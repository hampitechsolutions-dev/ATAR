-- CreateEnum
CREATE TYPE "RequestEventType" AS ENUM ('REQUEST_CREATED', 'QUOTE_SUBMITTED', 'QUOTE_UPDATED', 'REQUEST_AWARDED');

-- CreateTable
CREATE TABLE "RequestEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" "RequestEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "actorRole" "MembershipRole",
    "actorCompanyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestEvent_requestId_createdAt_idx" ON "RequestEvent"("requestId", "createdAt");

-- AddForeignKey
ALTER TABLE "RequestEvent"
ADD CONSTRAINT "RequestEvent_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "Request"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
