import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CompanyType,
  MembershipRole,
  Prisma,
  RequestStatus,
  UserStatus,
} from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
import { slugifyCompanyName } from '../common/slug.util';
import { PrismaService } from '../prisma/prisma.service';

type CreateUserInput = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyType: CompanyType;
  role: MembershipRole;
};

type CreateSellerInput = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  companyId: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listSuppliers(user: AuthUser) {
    const hasBuyerAccess =
      user.memberships.some((item) => item.role === MembershipRole.BUYER) ||
      user.memberships.some((item) => item.companyType === CompanyType.HYBRID) ||
      user.memberships.some((item) => item.role === MembershipRole.ADMIN);

    if (!hasBuyerAccess) {
      throw new ForbiddenException('Solo los compradores pueden consultar proveedores.');
    }

    return this.listMarketplaceSuppliers();
  }

  async listMarketplaceSuppliers() {
    const companies = await this.prisma.company.findMany({
      where: {
        OR: [
          {
            type: {
              in: [CompanyType.SUPPLIER, CompanyType.HYBRID],
            },
          },
          {
            memberships: {
              some: {
                role: MembershipRole.SUPPLIER,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        type: true,
        logoUrl: true,
        updatedAt: true,
        supplierProfile: {
          select: {
            genericCode: true,
            supplierRole: true,
            leadTimeDays: true,
            minimumOrder: true,
            logisticsSummary: true,
            financingSummary: true,
            isVerified: true,
            about: true,
            foundedYear: true,
            employeeRange: true,
            certifications: true,
            mainProducts: true,
            capabilities: true,
            categories: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const uniqueCompanies = new Map<string, (typeof companies)[number]>();

    for (const company of companies) {
      const key = this.normalizeSupplierKey(company.name);
      const existing = uniqueCompanies.get(key);

      if (!existing || this.scoreSupplier(company) > this.scoreSupplier(existing)) {
        uniqueCompanies.set(key, company);
      }
    }

    return [...uniqueCompanies.values()]
      .sort((left, right) => left.name.localeCompare(right.name, 'es'))
      .map((company) => ({
        id: company.id,
        slug: slugifyCompanyName(company.name),
        name: company.name,
        city: company.city,
        country: company.country,
        companyType: company.type,
        description:
          company.supplierProfile?.logisticsSummary ??
          company.supplierProfile?.financingSummary ??
          null,
        genericCode: company.supplierProfile?.genericCode ?? null,
        supplierRole: company.supplierProfile?.supplierRole ?? null,
        leadTimeDays: company.supplierProfile?.leadTimeDays ?? null,
        minimumOrder: company.supplierProfile?.minimumOrder ?? null,
        // Ficha ampliada. Todo opcional: la pantalla oculta lo que no este
        // cargado en vez de mostrar un placeholder.
        isVerified: company.supplierProfile?.isVerified ?? false,
        logoUrl: company.logoUrl,
        about: company.supplierProfile?.about ?? null,
        foundedYear: company.supplierProfile?.foundedYear ?? null,
        employeeRange: company.supplierProfile?.employeeRange ?? null,
        certifications: company.supplierProfile?.certifications ?? [],
        mainProducts: company.supplierProfile?.mainProducts ?? [],
        capabilities: company.supplierProfile?.capabilities ?? [],
        categories: company.supplierProfile?.categories ?? [],
        logisticsSummary: company.supplierProfile?.logisticsSummary ?? null,
        financingSummary: company.supplierProfile?.financingSummary ?? null,
        tags: [
          company.supplierProfile?.genericCode ?? null,
          typeof company.supplierProfile?.leadTimeDays === 'number'
            ? `${company.supplierProfile.leadTimeDays} dias`
            : null,
          typeof company.supplierProfile?.minimumOrder === 'number'
            ? `Min ${Math.round(company.supplierProfile.minimumOrder)}`
            : null,
        ].filter(Boolean) as string[],
      }));
  }

  async findMarketplaceSupplierBySlug(slug: string) {
    const suppliers = await this.listMarketplaceSuppliers();
    return suppliers.find((item) => item.slug === slug) ?? null;
  }

  async getMarketplaceStats() {
    const [suppliers, buyerCompanies, requestsCount, ordersCount, groupedCategories] = await Promise.all([
      this.listMarketplaceSuppliers(),
      this.prisma.company.findMany({
        where: {
          OR: [
            {
              type: {
                in: [CompanyType.BUYER, CompanyType.HYBRID],
              },
            },
            {
              memberships: {
                some: {
                  role: MembershipRole.BUYER,
                },
              },
            },
          ],
        },
        select: {
          name: true,
        },
      }),
      this.prisma.request.count({
        where: {
          status: {
            not: RequestStatus.DRAFT,
          },
        },
      }),
      this.prisma.purchaseOrder.count(),
      this.prisma.request.groupBy({
        by: ['category'],
        where: {
          category: {
            not: '',
          },
          status: {
            not: RequestStatus.DRAFT,
          },
        },
        _count: {
          category: true,
        },
        orderBy: {
          _count: {
            category: 'desc',
          },
        },
        take: 6,
      }),
    ]);

    const uniqueBuyerNames = new Set(
      buyerCompanies.map((company) => this.normalizeSupplierKey(company.name)),
    );

    return {
      suppliersCount: suppliers.length,
      buyersCount: uniqueBuyerNames.size,
      requestsCount,
      ordersCount,
      topCategories: groupedCategories.map((item) => ({
        label: item.category,
        requestCount: item._count.category,
      })),
    };
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  /**
   * Alta de un vendedor dentro de una empresa que ya existe.
   *
   * Queda como INVITED hasta que el administrador de la empresa lo habilita:
   * mientras tanto no ve nada de la empresa, porque un vendedor solo accede a
   * las solicitudes que le asignaron.
   */
  async createSellerForCompany(input: CreateSellerInput) {
    const company = await this.prisma.company.findUnique({
      where: { id: input.companyId },
      select: { id: true, type: true, name: true },
    });

    if (!company) {
      throw new NotFoundException('No encontramos la empresa seleccionada.');
    }

    if (company.type === CompanyType.BUYER) {
      throw new BadRequestException(
        'Esa empresa esta registrada como compradora y no tiene equipo de ventas.',
      );
    }

    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        status: UserStatus.INVITED,
        memberships: {
          create: {
            role: MembershipRole.SELLER,
            isPrimary: true,
            companyId: company.id,
          },
        },
      },
      include: {
        memberships: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  /** Empresas proveedoras disponibles para que un vendedor se sume al equipo. */
  async listSupplierDirectory(search?: string) {
    const companies = await this.prisma.company.findMany({
      where: {
        type: { in: [CompanyType.SUPPLIER, CompanyType.HYBRID] },
        ...(search?.trim()
          ? { name: { contains: search.trim(), mode: 'insensitive' as const } }
          : {}),
      },
      select: { id: true, name: true, city: true, country: true, type: true },
      orderBy: { name: 'asc' },
      take: 30,
    });

    return companies;
  }

  async createWithCompany(input: CreateUserInput) {
    const data: Prisma.UserCreateInput = {
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      memberships: {
        create: {
          role: input.role,
          isPrimary: true,
          company: {
            create: {
              name: input.companyName,
              type: input.companyType,
              supplierProfile:
                input.companyType === CompanyType.SUPPLIER || input.companyType === CompanyType.HYBRID
                  ? {
                      create: {},
                    }
                  : undefined,
            },
          },
        },
      },
    };

    return this.prisma.user.create({
      data,
      include: {
        memberships: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  private normalizeSupplierKey(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private scoreSupplier(
    company: {
      supplierProfile: {
        genericCode: string | null;
        leadTimeDays: number | null;
        minimumOrder: number | null;
        logisticsSummary: string | null;
        financingSummary: string | null;
      } | null;
      city: string | null;
    },
  ) {
    let score = 0;

    if (company.city) {
      score += 1;
    }

    if (company.supplierProfile?.genericCode) {
      score += 2;
    }

    if (typeof company.supplierProfile?.leadTimeDays === 'number') {
      score += 2;
    }

    if (typeof company.supplierProfile?.minimumOrder === 'number') {
      score += 2;
    }

    if (company.supplierProfile?.logisticsSummary) {
      score += 3;
    }

    if (company.supplierProfile?.financingSummary) {
      score += 2;
    }

    return score;
  }
}
