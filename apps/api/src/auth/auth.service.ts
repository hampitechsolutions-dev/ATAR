import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CompanyType, MembershipRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario registrado con ese email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createWithCompany({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      companyName: dto.companyName,
      companyType: dto.companyType as CompanyType,
      role: dto.role as MembershipRole,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    return this.serializeUser(user);
  }

  private async buildAuthResponse(user: Awaited<ReturnType<UsersService['findByEmail']>>) {
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const serializedUser = this.serializeUser(user);
    const accessToken = await this.jwtService.signAsync({
      sub: serializedUser.id,
      email: serializedUser.email,
      memberships: serializedUser.memberships.map((membership) => ({
        role: membership.role,
        companyId: membership.company.id,
      })),
    });

    return {
      accessToken,
      user: serializedUser,
    };
  }

  private serializeUser(user: NonNullable<Awaited<ReturnType<UsersService['findByEmail']>>>) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      memberships: user.memberships.map((membership) => ({
        id: membership.id,
        role: membership.role,
        isPrimary: membership.isPrimary,
        company: {
          id: membership.company.id,
          name: membership.company.name,
          type: membership.company.type,
          country: membership.company.country,
          city: membership.company.city,
        },
      })),
    };
  }
}
