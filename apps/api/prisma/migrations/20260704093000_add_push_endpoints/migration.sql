-- CreateEnum
CREATE TYPE "PushChannel" AS ENUM ('WEB', 'MOBILE_EXPO');

-- CreateTable
CREATE TABLE "PushEndpoint" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "channel" "PushChannel" NOT NULL,
  "endpoint" TEXT NOT NULL,
  "payload" JSONB,
  "userAgent" TEXT,
  "deviceName" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PushEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushEndpoint_endpoint_key" ON "PushEndpoint"("endpoint");

-- CreateIndex
CREATE INDEX "PushEndpoint_userId_channel_isActive_idx" ON "PushEndpoint"("userId", "channel", "isActive");

-- CreateIndex
CREATE INDEX "PushEndpoint_companyId_channel_isActive_idx" ON "PushEndpoint"("companyId", "channel", "isActive");

-- AddForeignKey
ALTER TABLE "PushEndpoint"
ADD CONSTRAINT "PushEndpoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
