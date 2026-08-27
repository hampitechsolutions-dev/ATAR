-- CreateEnum
CREATE TYPE "RepresentationDirection" AS ENUM ('SELLER_TO_COMPANY', 'COMPANY_TO_SELLER');

-- CreateEnum
CREATE TYPE "RepresentationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REPRESENTATION_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'REPRESENTATION_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'REPRESENTATION_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'REPRESENTATION_CANCELLED';

-- CreateTable
CREATE TABLE "RepresentationRequest" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "sellerUserId" TEXT NOT NULL,
  "direction" "RepresentationDirection" NOT NULL,
  "status" "RepresentationStatus" NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "respondedByUserId" TEXT,
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RepresentationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepresentationRequest_companyId_sellerUserId_key" ON "RepresentationRequest"("companyId", "sellerUserId");

-- CreateIndex
CREATE INDEX "RepresentationRequest_companyId_status_idx" ON "RepresentationRequest"("companyId", "status");

-- CreateIndex
CREATE INDEX "RepresentationRequest_sellerUserId_status_idx" ON "RepresentationRequest"("sellerUserId", "status");

-- AddForeignKey
ALTER TABLE "RepresentationRequest"
ADD CONSTRAINT "RepresentationRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentationRequest"
ADD CONSTRAINT "RepresentationRequest_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentationRequest"
ADD CONSTRAINT "RepresentationRequest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentationRequest"
ADD CONSTRAINT "RepresentationRequest_respondedByUserId_fkey" FOREIGN KEY ("respondedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
