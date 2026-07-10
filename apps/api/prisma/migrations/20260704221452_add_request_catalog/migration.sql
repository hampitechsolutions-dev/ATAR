-- CreateEnum
CREATE TYPE "RequestCatalogFieldType" AS ENUM ('CHOICES', 'SEGMENTED', 'INPUT', 'QUANTITY', 'UPLOADER', 'TEXTAREA');

-- CreateEnum
CREATE TYPE "RequestCatalogInputType" AS ENUM ('TEXT', 'DATE');

-- CreateTable
CREATE TABLE "RequestCatalogCategory" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageSrc" TEXT,
    "imageClassName" TEXT,
    "searchKeywords" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestCatalogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestCatalogField" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RequestCatalogFieldType" NOT NULL,
    "options" TEXT[],
    "placeholder" TEXT,
    "helper" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "fullWidth" BOOLEAN NOT NULL DEFAULT false,
    "inputType" "RequestCatalogInputType",
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestCatalogField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestCatalogCategory_label_key" ON "RequestCatalogCategory"("label");

-- CreateIndex
CREATE INDEX "RequestCatalogCategory_isActive_sortOrder_idx" ON "RequestCatalogCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "RequestCatalogField_categoryId_isActive_sortOrder_idx" ON "RequestCatalogField"("categoryId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "RequestCatalogField_categoryId_key_key" ON "RequestCatalogField"("categoryId", "key");

-- AddForeignKey
ALTER TABLE "RequestCatalogField" ADD CONSTRAINT "RequestCatalogField_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RequestCatalogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
