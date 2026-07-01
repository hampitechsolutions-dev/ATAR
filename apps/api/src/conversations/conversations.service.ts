import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationContextType,
  MembershipRole,
  Prisma,
} from '@prisma/client';
import type { AuthUser } from '../auth/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsGateway } from './conversations.gateway';
import { CreateProductConversationDto } from './dto/create-product-conversation.dto';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';

type ConversationWithRelations = Prisma.ConversationGetPayload<{
  include: {
    messages: true;
    request: {
      select: {
        id: true;
        title: true;
        productName: true;
        category: true;
        buyerCompanyId: true;
      };
    };
    quote: {
      select: {
        id: true;
        requestId: true;
        supplierCompanyId: true;
      };
    };
  };
}>;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsGateway: ConversationsGateway,
  ) {}

  async list(user: AuthUser, query: ListConversationsQueryDto) {
    const conversations = await this.prisma.conversation.findMany({
      where: this.buildConversationWhere(user, query),
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            productName: true,
            category: true,
            buyerCompanyId: true,
          },
        },
        quote: {
          select: {
            id: true,
            requestId: true,
            supplierCompanyId: true,
          },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    });

    return this.serializeConversations(conversations, user, false);
  }

  async findOne(user: AuthUser, id: string, query: ListMessagesQueryDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          where: this.buildMessageWhere(query),
          orderBy: {
            createdAt: 'asc',
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            productName: true,
            category: true,
            buyerCompanyId: true,
          },
        },
        quote: {
          select: {
            id: true,
            requestId: true,
            supplierCompanyId: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada.');
    }

    this.assertConversationAccess(user, conversation);

    const [serialized] = await this.serializeConversations([conversation], user, true);
    return serialized;
  }

  async getOrCreateByQuote(user: AuthUser, quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Cotizacion no encontrada.');
    }

    this.assertQuoteAccess(user, quote.request.buyerCompanyId, quote.supplierCompanyId);

    const existing = await this.prisma.conversation.findFirst({
      where: {
        quoteId,
        supplierCompanyId: quote.supplierCompanyId,
      },
    });

    const conversation =
      existing ??
      (await this.prisma.conversation.create({
        data: {
          contextType: ConversationContextType.QUOTE,
          contextTitle: quote.request.productName ?? quote.request.title,
          requestId: quote.requestId,
          quoteId,
          buyerCompanyId: quote.request.buyerCompanyId,
          supplierCompanyId: quote.supplierCompanyId,
        },
      }));

    return this.findOne(user, conversation.id, {});
  }

  async getOrCreateByProduct(user: AuthUser, dto: CreateProductConversationDto) {
    const buyerCompanyId = this.getCompanyIdForRole(user, MembershipRole.BUYER);
    const supplier = await this.findCompanyByName(dto.supplierCompanyName);

    const existing = await this.prisma.conversation.findFirst({
      where: {
        contextType: ConversationContextType.PRODUCT,
        buyerCompanyId,
        supplierCompanyId: supplier.id,
        contextTitle: dto.productName,
      },
    });

    const conversation =
      existing ??
      (await this.prisma.conversation.create({
        data: {
          contextType: ConversationContextType.PRODUCT,
          contextTitle: dto.productName,
          buyerCompanyId,
          supplierCompanyId: supplier.id,
        },
      }));

    return this.findOne(user, conversation.id, {});
  }

  async sendMessage(user: AuthUser, id: string, dto: SendMessageDto) {
    const trimmedBody = dto.body?.trim() ?? '';
    if (!trimmedBody && !dto.attachmentBase64) {
      throw new BadRequestException('El mensaje debe incluir texto o un archivo adjunto.');
    }

    if (dto.attachmentBase64 && !dto.attachmentName) {
      throw new BadRequestException('El archivo adjunto requiere un nombre.');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: true,
        request: {
          select: {
            id: true,
            title: true,
            productName: true,
            category: true,
            buyerCompanyId: true,
          },
        },
        quote: {
          select: {
            id: true,
            requestId: true,
            supplierCompanyId: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada.');
    }

    const participant = await this.resolveParticipant(user, conversation);

    await this.prisma.$transaction([
      this.prisma.conversationMessage.create({
        data: {
          conversationId: id,
          senderUserId: user.userId,
          senderRole: participant.role,
          senderCompanyName: participant.companyName ?? undefined,
          body: trimmedBody,
          attachmentName: dto.attachmentName,
          attachmentMimeType: dto.attachmentMimeType,
          attachmentSize: dto.attachmentSize,
          attachmentBase64: dto.attachmentBase64,
          emailNotificationQueuedAt: new Date(),
        },
      }),
      this.prisma.conversation.update({
        where: { id },
        data: {
          lastMessageAt: new Date(),
        },
      }),
    ]);

    this.conversationsGateway.emitConversationUpdated({
      id,
      buyerCompanyId: conversation.buyerCompanyId,
      supplierCompanyId: conversation.supplierCompanyId,
    });

    return this.findOne(user, id, {});
  }

  async markAsRead(user: AuthUser, id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: true,
        request: {
          select: {
            id: true,
            title: true,
            productName: true,
            category: true,
            buyerCompanyId: true,
          },
        },
        quote: {
          select: {
            id: true,
            requestId: true,
            supplierCompanyId: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada.');
    }

    const participant = await this.resolveParticipant(user, conversation);
    const now = new Date();

    await this.prisma.conversationMessage.updateMany({
      where:
        participant.role === MembershipRole.BUYER
          ? {
              conversationId: id,
              senderRole: MembershipRole.SUPPLIER,
              buyerReadAt: null,
            }
          : {
              conversationId: id,
              senderRole: MembershipRole.BUYER,
              supplierReadAt: null,
            },
      data:
        participant.role === MembershipRole.BUYER
          ? { buyerReadAt: now }
          : { supplierReadAt: now },
    });

    this.conversationsGateway.emitConversationRead({
      id,
      buyerCompanyId: conversation.buyerCompanyId,
      supplierCompanyId: conversation.supplierCompanyId,
      readByRole: participant.role,
    });

    return {
      conversationId: id,
      readAt: now.toISOString(),
    };
  }

  private buildConversationWhere(user: AuthUser, query: ListConversationsQueryDto): Prisma.ConversationWhereInput {
    const buyerCompanyId = this.getOptionalCompanyId(user, MembershipRole.BUYER);
    const supplierCompanyId = this.getOptionalCompanyId(user, MembershipRole.SUPPLIER);

    const accessWhere = this.isAdmin(user)
      ? {}
      : {
          OR: [
            buyerCompanyId ? { buyerCompanyId } : undefined,
            supplierCompanyId ? { supplierCompanyId } : undefined,
          ].filter(Boolean) as Prisma.ConversationWhereInput[],
        };

    const filters: Prisma.ConversationWhereInput[] = [accessWhere];

    if (query.contextType) {
      filters.push({ contextType: query.contextType });
    }

    if (query.search?.trim()) {
      filters.push({
        OR: [
          {
            contextTitle: {
              contains: query.search.trim(),
              mode: 'insensitive',
            },
          },
          {
            messages: {
              some: {
                body: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      });
    }

    if (query.from || query.to) {
      filters.push({
        lastMessageAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      });
    }

    return {
      AND: filters,
    };
  }

  private buildMessageWhere(query: ListMessagesQueryDto): Prisma.ConversationMessageWhereInput | undefined {
    const filters: Prisma.ConversationMessageWhereInput[] = [];

    if (query.search?.trim()) {
      filters.push({
        body: {
          contains: query.search.trim(),
          mode: 'insensitive',
        },
      });
    }

    if (query.from || query.to) {
      filters.push({
        createdAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      });
    }

    if (filters.length === 0) {
      return undefined;
    }

    return {
      AND: filters,
    };
  }

  private async serializeConversations(
    conversations: ConversationWithRelations[],
    user: AuthUser,
    includeMessages: boolean,
  ) {
    const companyIds = Array.from(
      new Set(
        conversations.flatMap((conversation) => [
          conversation.buyerCompanyId,
          conversation.supplierCompanyId,
        ]),
      ),
    );

    const companies = companyIds.length
      ? await this.prisma.company.findMany({
          where: {
            id: {
              in: companyIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const companyMap = new Map(companies.map((company) => [company.id, company.name]));

    return conversations.map((conversation) => {
      const participantRole = this.getParticipantRoleForConversation(user, conversation);
      const lastMessage = conversation.messages.at(-1) ?? null;
      const unreadCount = conversation.messages.filter((message) => {
        if (participantRole === MembershipRole.BUYER) {
          return message.senderRole === MembershipRole.SUPPLIER && !message.buyerReadAt;
        }

        if (participantRole === MembershipRole.SUPPLIER) {
          return message.senderRole === MembershipRole.BUYER && !message.supplierReadAt;
        }

        return false;
      }).length;

      return {
        id: conversation.id,
        contextType: conversation.contextType,
        contextTitle: conversation.contextTitle,
        requestId: conversation.requestId,
        quoteId: conversation.quoteId,
        buyerCompanyId: conversation.buyerCompanyId,
        buyerCompanyName: companyMap.get(conversation.buyerCompanyId) ?? 'Comprador',
        supplierCompanyId: conversation.supplierCompanyId,
        supplierCompanyName: companyMap.get(conversation.supplierCompanyId) ?? 'Proveedor',
        lastMessageAt: conversation.lastMessageAt,
        unreadCount,
        request: conversation.request,
        quote: conversation.quote,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              body: lastMessage.body,
              createdAt: lastMessage.createdAt,
              senderRole: lastMessage.senderRole,
              senderCompanyName: lastMessage.senderCompanyName,
            }
          : null,
        messages: includeMessages
          ? conversation.messages.map((message) => ({
              id: message.id,
              body: message.body,
              senderRole: message.senderRole,
              senderCompanyName: message.senderCompanyName,
              attachmentName: message.attachmentName,
              attachmentMimeType: message.attachmentMimeType,
              attachmentSize: message.attachmentSize,
              attachmentBase64: message.attachmentBase64,
              emailNotificationQueuedAt: message.emailNotificationQueuedAt,
              createdAt: message.createdAt,
              buyerReadAt: message.buyerReadAt,
              supplierReadAt: message.supplierReadAt,
            }))
          : undefined,
      };
    });
  }

  private assertConversationAccess(user: AuthUser, conversation: ConversationWithRelations) {
    if (this.isAdmin(user)) {
      return;
    }

    const buyerCompanyId = this.getOptionalCompanyId(user, MembershipRole.BUYER);
    const supplierCompanyId = this.getOptionalCompanyId(user, MembershipRole.SUPPLIER);

    if (buyerCompanyId && buyerCompanyId === conversation.buyerCompanyId) {
      return;
    }

    if (supplierCompanyId && supplierCompanyId === conversation.supplierCompanyId) {
      return;
    }

    throw new ForbiddenException('No tenes acceso a esta conversacion.');
  }

  private assertQuoteAccess(user: AuthUser, buyerCompanyId: string, supplierCompanyId: string) {
    if (this.isAdmin(user)) {
      return;
    }

    const currentBuyerCompanyId = this.getOptionalCompanyId(user, MembershipRole.BUYER);
    if (currentBuyerCompanyId && currentBuyerCompanyId === buyerCompanyId) {
      return;
    }

    const currentSupplierCompanyId = this.getOptionalCompanyId(user, MembershipRole.SUPPLIER);
    if (currentSupplierCompanyId && currentSupplierCompanyId === supplierCompanyId) {
      return;
    }

    throw new ForbiddenException('No tenes acceso a esta cotizacion.');
  }

  private async resolveParticipant(user: AuthUser, conversation: ConversationWithRelations) {
    this.assertConversationAccess(user, conversation);

    const buyerCompanyId = this.getOptionalCompanyId(user, MembershipRole.BUYER);
    if (buyerCompanyId && buyerCompanyId === conversation.buyerCompanyId) {
      return {
        role: MembershipRole.BUYER,
        companyName: await this.getCompanyNameById(conversation.buyerCompanyId),
      };
    }

    const supplierCompanyId = this.getOptionalCompanyId(user, MembershipRole.SUPPLIER);
    if (supplierCompanyId && supplierCompanyId === conversation.supplierCompanyId) {
      return {
        role: MembershipRole.SUPPLIER,
        companyName: await this.getCompanyNameById(conversation.supplierCompanyId),
      };
    }

    throw new ForbiddenException('No tenes permisos para enviar mensajes en esta conversacion.');
  }

  private getParticipantRoleForConversation(user: AuthUser, conversation: ConversationWithRelations) {
    const buyerCompanyId = this.getOptionalCompanyId(user, MembershipRole.BUYER);
    if (buyerCompanyId && buyerCompanyId === conversation.buyerCompanyId) {
      return MembershipRole.BUYER;
    }

    const supplierCompanyId = this.getOptionalCompanyId(user, MembershipRole.SUPPLIER);
    if (supplierCompanyId && supplierCompanyId === conversation.supplierCompanyId) {
      return MembershipRole.SUPPLIER;
    }

    return null;
  }

  private getCompanyIdForRole(user: AuthUser, role: MembershipRole) {
    const membership = user.memberships.find((item) => item.role === role);
    if (!membership) {
      throw new ForbiddenException(`La operacion requiere rol ${role}.`);
    }

    return membership.companyId;
  }

  private getOptionalCompanyId(user: AuthUser, role: MembershipRole) {
    return user.memberships.find((item) => item.role === role)?.companyId;
  }

  private async getCompanyNameById(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
      },
    });

    return company?.name ?? null;
  }

  private async findCompanyByName(name: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!company) {
      throw new NotFoundException('No se encontro la empresa proveedora para iniciar el chat.');
    }

    return company;
  }

  private isAdmin(user: AuthUser) {
    return user.memberships.some((item) => item.role === MembershipRole.ADMIN);
  }
}
