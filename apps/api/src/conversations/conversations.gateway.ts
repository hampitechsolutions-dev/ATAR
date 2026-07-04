import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { MembershipRole } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import type { AuthUser } from '../auth/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';

type SocketWithUser = Socket & {
  data: {
    user?: AuthUser;
  };
};

type ConversationSocketPayload = {
  conversationId: string;
};

type ConversationTypingPayload = ConversationSocketPayload & {
  isTyping: boolean;
};

@WebSocketGateway({
  namespace: '/conversations',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ConversationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ConversationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: SocketWithUser) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new WsException('Falta el token de autenticacion.');
      }

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        memberships: Array<{ role: MembershipRole; companyId: string }>;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'atar-dev-secret'),
      });

      const user: AuthUser = {
        userId: payload.sub,
        email: payload.email,
        memberships: payload.memberships,
      };

      client.data.user = user;
      client.join(this.getUserRoom(user.userId));
      user.memberships.forEach((membership) => {
        client.join(this.getCompanyRoom(membership.companyId));
      });
    } catch (error) {
      this.logger.warn(
        error instanceof Error ? error.message : 'No se pudo autenticar el socket de conversaciones.',
      );
      client.disconnect(true);
    }
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: ConversationSocketPayload,
  ) {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Sesion no valida para abrir la conversacion.');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: payload.conversationId },
      select: {
        id: true,
        buyerCompanyId: true,
        supplierCompanyId: true,
      },
    });

    if (!conversation) {
      throw new WsException('La conversacion no existe.');
    }

    const buyerCompanyId = user.memberships.find(
      (item: AuthUser['memberships'][number]) => item.role === MembershipRole.BUYER,
    )?.companyId;
    const supplierCompanyId = user.memberships.find(
      (item: AuthUser['memberships'][number]) => item.role === MembershipRole.SUPPLIER,
    )?.companyId;
    const hasAccess =
      user.memberships.some(
        (item: AuthUser['memberships'][number]) => item.role === MembershipRole.ADMIN,
      ) ||
      buyerCompanyId === conversation.buyerCompanyId ||
      supplierCompanyId === conversation.supplierCompanyId;

    if (!hasAccess) {
      throw new WsException('No tenes acceso a esta conversacion.');
    }

    client.join(this.getConversationRoom(payload.conversationId));

    return {
      joined: true,
      conversationId: payload.conversationId,
    };
  }

  @SubscribeMessage('conversation:leave')
  leaveConversation(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: ConversationSocketPayload,
  ) {
    client.leave(this.getConversationRoom(payload.conversationId));

    return {
      left: true,
      conversationId: payload.conversationId,
    };
  }

  @SubscribeMessage('conversation:typing')
  async handleTyping(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: ConversationTypingPayload,
  ) {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Sesion no valida para informar escritura.');
    }

    const participant = await this.resolveConversationParticipant(user, payload.conversationId);
    const eventPayload = {
      conversationId: payload.conversationId,
      senderRole: participant.role,
      senderCompanyId: participant.companyId,
      isTyping: payload.isTyping,
      updatedAt: new Date().toISOString(),
    };

    client.to(this.getConversationRoom(payload.conversationId)).emit('conversation:typing', eventPayload);

    return {
      sent: true,
      ...eventPayload,
    };
  }

  emitConversationUpdated(conversation: {
    id: string;
    buyerCompanyId: string;
    supplierCompanyId: string;
  }) {
    const payload = {
      conversationId: conversation.id,
      updatedAt: new Date().toISOString(),
    };

    this.server.to(this.getConversationRoom(conversation.id)).emit('conversation:updated', payload);
    this.server.to(this.getCompanyRoom(conversation.buyerCompanyId)).emit('conversation:updated', payload);
    this.server.to(this.getCompanyRoom(conversation.supplierCompanyId)).emit('conversation:updated', payload);
  }

  emitConversationRead(conversation: {
    id: string;
    buyerCompanyId: string;
    supplierCompanyId: string;
    readByRole: MembershipRole;
  }) {
    const payload = {
      conversationId: conversation.id,
      readByRole: conversation.readByRole,
      updatedAt: new Date().toISOString(),
    };

    this.server.to(this.getConversationRoom(conversation.id)).emit('conversation:read', payload);
    this.server.to(this.getCompanyRoom(conversation.buyerCompanyId)).emit('conversation:read', payload);
    this.server.to(this.getCompanyRoom(conversation.supplierCompanyId)).emit('conversation:read', payload);
  }

  private extractToken(client: Socket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const authorizationHeader = client.handshake.headers.authorization;
    if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
      return authorizationHeader.slice('Bearer '.length).trim();
    }

    return null;
  }

  private getConversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private getCompanyRoom(companyId: string) {
    return `company:${companyId}`;
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }

  private async resolveConversationParticipant(user: AuthUser, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        buyerCompanyId: true,
        supplierCompanyId: true,
      },
    });

    if (!conversation) {
      throw new WsException('La conversacion no existe.');
    }

    const buyerCompanyId = user.memberships.find(
      (item: AuthUser['memberships'][number]) => item.role === MembershipRole.BUYER,
    )?.companyId;
    if (buyerCompanyId && buyerCompanyId === conversation.buyerCompanyId) {
      return {
        role: MembershipRole.BUYER,
        companyId: buyerCompanyId,
      };
    }

    const supplierCompanyId = user.memberships.find(
      (item: AuthUser['memberships'][number]) => item.role === MembershipRole.SUPPLIER,
    )?.companyId;
    if (supplierCompanyId && supplierCompanyId === conversation.supplierCompanyId) {
      return {
        role: MembershipRole.SUPPLIER,
        companyId: supplierCompanyId,
      };
    }

    if (
      user.memberships.some(
        (item: AuthUser['memberships'][number]) => item.role === MembershipRole.ADMIN,
      )
    ) {
      return {
        role: MembershipRole.ADMIN,
        companyId: conversation.buyerCompanyId,
      };
    }

    throw new WsException('No tenes acceso a esta conversacion.');
  }
}
