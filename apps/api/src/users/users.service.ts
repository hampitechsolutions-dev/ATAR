import { ForbiddenException, Injectable } from '@nestjs/common';
import { CompanyType, MembershipRole, Prisma } from '@prisma/client';
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
        name: 'asc',
      },
    });

    return companies.map((company) => {
      const tags = [
        company.supplierProfile?.genericCode ? `Cod. ${company.supplierProfile.genericCode}` : null,
        typeof company.supplierProfile?.leadTimeDays === 'number'
          ? `Entrega ${company.supplierProfile.leadTimeDays} d`
          : null,
        typeof company.supplierProfile?.minimumOrder === 'number'
          ? `Min ${Math.round(company.supplierProfile.minimumOrder)}`
          : null,
        company.type === CompanyType.HYBRID ? 'Empresa híbrida' : 'Proveedor activo',
      ].filter(Boolean) as string[];

      return {
        id: company.id,
        name: company.name,
        city: company.city,
        country: company.country,
        companyType: company.type,
        description:
          company.supplierProfile?.logisticsSummary ??
          company.supplierProfile?.financingSummary ??
          'Proveedor verificado dentro de la red ATAR.',
        tags,
      };
    });
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
}
