import { CompanyType, MembershipRole } from '@prisma/client';

export type AuthUser = {
  userId: string;
  email: string;
  memberships: Array<{
    role: MembershipRole;
    companyId: string;
    companyType?: CompanyType;
  }>;
};
