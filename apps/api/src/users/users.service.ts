import { ForbiddenException, Injectable } from '@nestjs/common';
import { CompanyType, MembershipRole, Prisma, RequestStatus } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
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
        updatedAt: true,
        supplierProfile: {
          select: {
            genericCode: true,
            leadTimeDays: true,
            minimumOrder: true,
            logisticsSummary: true,
            financingSummary: true,
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
        slug: this.slugify(company.name),
        name: company.name,
        city: company.city,
        country: company.country,
        companyType: company.type,
        description:
          company.supplierProfile?.logisticsSummary ??
          company.supplierProfile?.financingSummary ??
          null,
        genericCode: company.supplierProfile?.genericCode ?? null,
        leadTimeDays: company.supplierProfile?.leadTimeDays ?? null,
        minimumOrder: company.supplierProfile?.minimumOrder ?? null,
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

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
