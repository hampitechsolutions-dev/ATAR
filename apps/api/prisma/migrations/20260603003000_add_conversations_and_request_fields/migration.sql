-- CreateEnum
CREATE TYPE "ConversationContextType" AS ENUM ('PRODUCT', 'REQUEST', 'QUOTE');

-- AlterTable
ALTER TABLE "Request"
ADD COLUMN "productName" TEXT,
ADD COLUMN "quantityRequested" INTEGER,
ADD COLUMN "referenceUnitPrice" DOUBLE PRECISION,
ADD COLUMN "estimatedTotalCost" DOUBLE PRECISION,
ADD COLUMN "preferredSupplierName" TEXT;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "quoteId" TEXT,
    "contextType" "ConversationContextType" NOT NULL,
    "contextTitle" TEXT NOT NULL,
    "buyerCompanyId" TEXT NOT NULL,
    "supplierCompanyId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "senderRole" "MembershipRole" NOT NULL,
    "senderCompanyName" TEXT,
    "body" TEXT NOT NULL,
    "attachmentName" TEXT,
    "attachmentMimeType" TEXT,
    "attachmentSize" INTEGER,
    "attachmentBase64" TEXT,
    "emailNotificationQueuedAt" TIMESTAMP(3),
    "buyerReadAt" TIMESTAMP(3),
    "supplierReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_buyerCompanyId_lastMessageAt_idx" ON "Conversation"("buyerCompanyId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_supplierCompanyId_lastMessageAt_idx" ON "Conversation"("supplierCompanyId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_requestId_idx" ON "Conversation"("requestId");

-- CreateIndex
CREATE INDEX "Conversation_quoteId_idx" ON "Conversation"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_quoteId_supplierCompanyId_key" ON "Conversation"("quoteId", "supplierCompanyId");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_createdAt_idx" ON "ConversationMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "Request"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_quoteId_fkey"
FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage"
ADD CONSTRAINT "ConversationMessage_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
