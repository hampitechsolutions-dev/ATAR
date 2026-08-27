-- El logo pasa de SupplierProfile a Company: tambien lo necesitan las
-- compradoras (chat, selector de empresa, listados).

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "logoUrl" TEXT;

-- Se conserva lo ya cargado.
UPDATE "Company" AS c
SET "logoUrl" = p."logoUrl"
FROM "SupplierProfile" AS p
WHERE p."companyId" = c."id" AND p."logoUrl" IS NOT NULL;

-- AlterTable
ALTER TABLE "SupplierProfile" DROP COLUMN "logoUrl";
