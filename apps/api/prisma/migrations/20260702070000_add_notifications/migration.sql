-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'QUOTE_SUBMITTED',
  'QUOTE_UPDATED',
  'QUOTE_AWARDED',
  'QUOTE_REJECTED',
  'NEGOTIATION_STARTED',
  'ORDER_ISSUED',
  'ORDER_UPDATED',
  'FULFILLMENT_UPDATED',
  'NEW_MESSAGE'
);

-- CreateEnum
CREATE TYPE "NotificationEmailStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT,
  "href" TEXT,
  "metadata" JSONB,
  "readAt" TIMESTAMP(3),
  "emailStatus" "NotificationEmailStatus" NOT NULL DEFAULT 'PENDING',
  "emailSentAt" TIMESTAMP(3),
  "emailError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_companyId_createdAt_idx" ON "Notification"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
