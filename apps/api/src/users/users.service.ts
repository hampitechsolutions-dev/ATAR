import { Injectable } from '@nestjs/common';
import { CompanyType, MembershipRole, Prisma } from '@prisma/client';
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
