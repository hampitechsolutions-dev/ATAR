-- AlterTable
ALTER TABLE "SupplierProfile"
  ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "about" TEXT,
  ADD COLUMN "foundedYear" INTEGER,
  ADD COLUMN "employeeRange" TEXT,
  ADD COLUMN "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "mainProducts" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "categories" TEXT[] DEFAULT ARRAY[]::TEXT[];
