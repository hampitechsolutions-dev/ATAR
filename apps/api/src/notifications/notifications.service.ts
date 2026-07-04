import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  MembershipRole,
  NotificationEmailStatus,
  NotificationType,
  PushChannel,
  type Prisma,
} from '@prisma/client';
import * as webpush from 'web-push';
import { AuthUser } from '../auth/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { RegisterPushEndpointDto } from './dto/register-push-endpoint.dto';

type RecipientInput = {
  companyId: string;
  roles?: MembershipRole[];
  excludeUserId?: string;
};

type RecipientRecord = {
  id: string;
  email: string;
  firstName: string;
};

type CreateNotificationInput = {
  companyId: string;
  roles?: MembershipRole[];
  excludeUserId?: string;
  type: NotificationType;
  title: string;
  detail?: string | null;
  href?: string | null;
  metadata?: Prisma.InputJsonValue;
};

type WebPushPayload = {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resendApiUrl = 'https://api.resend.com/emails';
  private readonly expoPushApiUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.configureWebPush();
  }

  async list(user: AuthUser, query: ListNotificationsQueryDto) {
    const where: Prisma.NotificationWhereInput = {
      userId: user.userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };

    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: query.limit ?? 30,
      }),
      this.prisma.notification.count({
        where: {
          userId: user.userId,
          readAt: null,
        },
      }),
    ]);

    return {
      items,
      unreadCount,
    };
  }

  getPushConfig() {
    const publicKey = this.configService.get<string>('WEB_PUSH_PUBLIC_KEY')?.trim() ?? null;

    return {
      webPushEnabled: Boolean(publicKey),
      webPushPublicKey: publicKey,
    };
  }

  async registerPushEndpoint(user: AuthUser, dto: RegisterPushEndpointDto) {
    const companyId = user.memberships[0]?.companyId;
    if (!companyId) {
      throw new NotFoundException('No se encontro una empresa activa para registrar push.');
    }

    return this.prisma.pushEndpoint.upsert({
      where: {
        endpoint: dto.endpoint,
      },
      create: {
        userId: user.userId,
        companyId,
        channel: dto.channel as PushChannel,
        endpoint: dto.endpoint,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
        userAgent: dto.userAgent,
        deviceName: dto.deviceName,
        isActive: true,
        lastSeenAt: new Date(),
      },
      update: {
        userId: user.userId,
        companyId,
        channel: dto.channel as PushChannel,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
        userAgent: dto.userAgent,
        deviceName: dto.deviceName,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  }

  async removePushEndpoint(user: AuthUser, endpoint: string) {
    await this.prisma.pushEndpoint.updateMany({
      where: {
        endpoint,
        userId: user.userId,
      },
      data: {
        isActive: false,
      },
    });

    return { ok: true };
  }

  async markAsRead(user: AuthUser, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notificacion no encontrada.');
    }

    if (notification.readAt) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(user: AuthUser) {
    await this.prisma.notification.updateMany({
      where: {
        userId: user.userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return this.list(user, {});
  }

  async createForCompany(input: CreateNotificationInput) {
    const recipients = await this.resolveRecipients({
      companyId: input.companyId,
      roles: input.roles,
      excludeUserId: input.excludeUserId,
    });

    if (recipients.length === 0) {
      return [];
    }

    const hasEmailProvider = this.hasEmailProvider();
    const notifications = await this.prisma.$transaction(
      recipients.map((recipient) =>
        this.prisma.notification.create({
          data: {
            userId: recipient.id,
            companyId: input.companyId,
            type: input.type,
            title: input.title,
            detail: input.detail ?? undefined,
            href: input.href ?? undefined,
            metadata: input.metadata,
            emailStatus: hasEmailProvider ? NotificationEmailStatus.PENDING : NotificationEmailStatus.SKIPPED,
          },
        }),
      ),
    );

    await Promise.all(
      notifications.map(async (notification, index) => {
        const recipient = recipients[index];
        await Promise.all([
          this.sendPushNotifications(notification, recipient),
          hasEmailProvider
            ? this.sendEmailNotification(notification.id, {
                email: recipient.email,
                firstName: recipient.firstName,
                title: input.title,
                detail: input.detail ?? null,
                href: input.href ?? null,
              })
            : Promise.resolve(),
        ]);
      }),
    );

    return notifications;
  }

  private configureWebPush() {
    const subject = this.configService.get<string>('WEB_PUSH_SUBJECT');
    const publicKey = this.configService.get<string>('WEB_PUSH_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('WEB_PUSH_PRIVATE_KEY');

    if (!subject || !publicKey || !privateKey) {
      return;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } catch (error) {
      this.logger.warn(
        error instanceof Error
          ? `No se pudo configurar web push: ${error.message}`
          : 'No se pudo configurar web push.',
      );
    }
  }

  private async resolveRecipients(input: RecipientInput): Promise<RecipientRecord[]> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        companyId: input.companyId,
        ...(input.roles?.length ? { role: { in: input.roles } } : {}),
        ...(input.excludeUserId ? { userId: { not: input.excludeUserId } } : {}),
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    const users = memberships.map((membership) => membership.user);
    return Array.from(new Map(users.map((user) => [user.id, user])).values());
  }

  private hasEmailProvider() {
    return Boolean(
      this.configService.get<string>('RESEND_API_KEY') &&
        this.configService.get<string>('EMAIL_FROM'),
    );
  }

  private async sendPushNotifications(
    notification: {
      id: string;
      userId: string;
      title: string;
      detail: string | null;
      href: string | null;
      type: NotificationType;
    },
    recipient: RecipientRecord,
  ) {
    const endpoints = await this.prisma.pushEndpoint.findMany({
      where: {
        userId: notification.userId,
        isActive: true,
      },
    });

    if (endpoints.length === 0) {
      return;
    }

    await Promise.all(
      endpoints.map((endpoint) =>
        endpoint.channel === PushChannel.WEB
          ? this.sendWebPush(endpoint.id, endpoint.endpoint, endpoint.payload, notification)
          : this.sendExpoPush(endpoint.id, endpoint.endpoint, recipient.firstName, notification),
      ),
    );
  }

  private async sendWebPush(
    pushEndpointId: string,
    endpoint: string,
    payload: Prisma.JsonValue | null,
    notification: {
      title: string;
      detail: string | null;
      href: string | null;
      type: NotificationType;
    },
  ) {
    if (!this.getPushConfig().webPushEnabled) {
      return;
    }

    const subscription = this.resolveWebPushSubscription(endpoint, payload);
    if (!subscription) {
      return;
    }

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: notification.title,
          body: notification.detail ?? 'Tenes una nueva novedad en ATAR.',
          url: notification.href,
          tag: notification.type,
        }),
      );
    } catch (error) {
      const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode?: unknown }).statusCode) : null;
      if (statusCode === 404 || statusCode === 410) {
        await this.deactivatePushEndpoint(pushEndpointId);
      }
      this.logger.warn(
        error instanceof Error ? `Fallo web push: ${error.message}` : 'Fallo web push.',
      );
    }
  }

  private async sendExpoPush(
    pushEndpointId: string,
    expoToken: string,
    firstName: string,
    notification: {
      title: string;
      detail: string | null;
      href: string | null;
      type: NotificationType;
    },
  ) {
    try {
      const response = await fetch(this.expoPushApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify([
          {
            to: expoToken,
            title: notification.title,
            body: notification.detail ?? `Hola ${firstName}, tenes una nueva novedad en ATAR.`,
            data: {
              href: notification.href,
              type: notification.type,
            },
            sound: 'default',
          },
        ]),
      });

      if (!response.ok) {
        this.logger.warn(`Fallo Expo push: ${await response.text()}`);
        return;
      }

      const payload = (await response.json()) as {
        data?: Array<{ status?: string; details?: { error?: string } }>;
      };
      const ticket = payload.data?.[0];
      if (ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        await this.deactivatePushEndpoint(pushEndpointId);
      }
    } catch (error) {
      this.logger.warn(
        error instanceof Error ? `Fallo Expo push: ${error.message}` : 'Fallo Expo push.',
      );
    }
  }

  private resolveWebPushSubscription(
    endpoint: string,
    payload: Prisma.JsonValue | null,
  ): WebPushPayload | null {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }

    const payloadRecord = payload as Record<string, unknown>;
    const maybeKeys = payloadRecord.keys;
    const keys =
      maybeKeys && typeof maybeKeys === 'object' && !Array.isArray(maybeKeys)
        ? {
            p256dh:
              typeof (maybeKeys as Record<string, unknown>).p256dh === 'string'
                ? ((maybeKeys as Record<string, unknown>).p256dh as string)
                : undefined,
            auth:
              typeof (maybeKeys as Record<string, unknown>).auth === 'string'
                ? ((maybeKeys as Record<string, unknown>).auth as string)
                : undefined,
          }
        : undefined;

    return {
      endpoint,
      keys,
    };
  }

  private async deactivatePushEndpoint(pushEndpointId: string) {
    await this.prisma.pushEndpoint.update({
      where: { id: pushEndpointId },
      data: {
        isActive: false,
      },
    });
  }

  private async sendEmailNotification(
    notificationId: string,
    input: {
      email: string;
      firstName: string;
      title: string;
      detail: string | null;
      href: string | null;
    },
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const emailFrom = this.configService.get<string>('EMAIL_FROM');
    const appUrl = this.configService.get<string>('APP_WEB_URL');

    if (!apiKey || !emailFrom) {
      return;
    }

    const resolvedHref = input.href
      ? input.href.startsWith('http')
        ? input.href
        : appUrl
          ? `${appUrl.replace(/\/$/, '')}${input.href}`
          : input.href
      : null;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a;">
        <h2 style="margin:0 0 12px;font-size:24px;">${input.title}</h2>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hola ${input.firstName},</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">
          ${input.detail ?? 'Tenes una nueva novedad comercial dentro de ATAR.'}
        </p>
        ${
          resolvedHref
            ? `<a href="${resolvedHref}" style="display:inline-block;background:#4f46ff;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600;">Ver detalle</a>`
            : ''
        }
      </div>
    `;

    try {
      const response = await fetch(this.resendApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [input.email],
          subject: input.title,
          html,
          text: `${input.title}\n\n${input.detail ?? 'Tenes una nueva novedad comercial dentro de ATAR.'}${resolvedHref ? `\n\n${resolvedHref}` : ''}`,
        }),
      });

      if (!response.ok) {
        const payload = await response.text();
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            emailStatus: NotificationEmailStatus.FAILED,
            emailError: payload.slice(0, 500),
          },
        });
        this.logger.warn(`No se pudo enviar email transaccional: ${payload}`);
        return;
      }

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          emailStatus: NotificationEmailStatus.SENT,
          emailSentAt: new Date(),
          emailError: null,
        },
      });
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          emailStatus: NotificationEmailStatus.FAILED,
          emailError: error instanceof Error ? error.message.slice(0, 500) : 'Error desconocido',
        },
      });
      this.logger.warn(
        error instanceof Error
          ? error.message
          : 'No se pudo conectar con el proveedor de email transaccional.',
      );
    }
  }
}
