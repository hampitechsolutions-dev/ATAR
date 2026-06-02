-- CreateEnum
CREATE TYPE "OrderFulfillmentStatus" AS ENUM ('ISSUED', 'CONFIRMED', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED');

-- AlterEnum
ALTER TYPE "RequestEventType" ADD VALUE 'ORDER_UPDATED';

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "fulfillmentStatus" "OrderFulfillmentStatus" NOT NULL DEFAULT 'ISSUED',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promisedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_requestId_key" ON "PurchaseOrder"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON "PurchaseOrder"("orderNumber");

-- AddForeignKey
ALTER TABLE "PurchaseOrder"
ADD CONSTRAINT "PurchaseOrder_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "Request"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
