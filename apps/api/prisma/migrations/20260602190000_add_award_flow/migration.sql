-- AlterEnum
ALTER TYPE "QuoteStatus" ADD VALUE 'AWARDED';
ALTER TYPE "QuoteStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Request" ADD COLUMN "awardedQuoteId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Request_awardedQuoteId_key" ON "Request"("awardedQuoteId");

-- AddForeignKey
ALTER TABLE "Request"
ADD CONSTRAINT "Request_awardedQuoteId_fkey"
FOREIGN KEY ("awardedQuoteId") REFERENCES "Quote"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
