import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../auth-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'atar-dev-secret'),
    });
  }

  /**
   * Las membresias se leen de la base, no del token.
   *
   * Un vendedor puede sumar o perder empresas mientras su sesion sigue viva
   * (acepta una invitacion, la empresa lo saca del equipo). Si se usara la
   * copia que viajo en el JWT, durante dias trabajaria con una lista vieja: no
   * podria entrar a la empresa nueva y seguiria entrando a la que ya no
   * representa.
   */
  async validate(payload: { sub: string; email: string }): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        status: true,
        memberships: {
          select: {
            role: true,
            companyId: true,
            company: { select: { type: true } },
          },
        },
      },
    });

    if (!user || user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('Sesion invalida.');
    }

    return {
      userId: user.id,
      email: user.email,
      memberships: user.memberships.map((membership) => ({
        role: membership.role,
        companyId: membership.companyId,
        companyType: membership.company.type,
      })),
    };
  }
}
