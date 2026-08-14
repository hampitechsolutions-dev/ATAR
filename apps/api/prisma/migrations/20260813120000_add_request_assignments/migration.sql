-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('NEW', 'UNASSIGNED', 'ASSIGNED', 'IN_RESPONSE', 'QUOTED', 'NEGOTIATING', 'WON', 'LOST');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REQUEST_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'REQUEST_REASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'REQUEST_UPDATED';

-- CreateTable
CREATE TABLE "RequestAssignment" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "supplierCompanyId" TEXT NOT NULL,
  "sellerUserId" TEXT,
  "status" "OpportunityStatus" NOT NULL DEFAULT 'NEW',
  "assignedAt" TIMESTAMP(3),
  "assignedByUserId" TEXT,
  "notes" TEXT,
  "lastSellerViewAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RequestAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestAssignment_requestId_supplierCompanyId_key" ON "RequestAssignment"("requestId", "supplierCompanyId");

-- CreateIndex
CREATE INDEX "RequestAssignment_supplierCompanyId_status_idx" ON "RequestAssignment"("supplierCompanyId", "status");

-- CreateIndex
CREATE INDEX "RequestAssignment_sellerUserId_status_idx" ON "RequestAssignment"("sellerUserId", "status");

-- CreateIndex
CREATE INDEX "RequestAssignment_requestId_idx" ON "RequestAssignment"("requestId");

-- AddForeignKey
ALTER TABLE "RequestAssignment"
ADD CONSTRAINT "RequestAssignment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAssignment"
ADD CONSTRAINT "RequestAssignment_supplierCompanyId_fkey" FOREIGN KEY ("supplierCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAssignment"
ADD CONSTRAINT "RequestAssignment_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAssignment"
ADD CONSTRAINT "RequestAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
