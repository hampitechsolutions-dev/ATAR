/**
 * Sincroniza RequestCatalogCategory con el fallback del frontend.
 *
 * `apps/web/src/lib/request-catalog-fallback.ts` quedo como la copia mas
 * completa del catalogo original (15 categorias con sus fotos y campos). El
 * seed de la API solo tenia 8 y, al correrlo, borro las otras 7 y piso las
 * imagenes de las que sobrevivieron. Este script vuelve a dejar la base como
 * el fallback, que es lo que la app venia mostrando.
 *
 * No borra nada: hace upsert por label.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient, RequestCatalogFieldType, RequestCatalogInputType } = require('@prisma/client');

const prisma = new PrismaClient();

const FALLBACK =
  process.env.FALLBACK_PATH ??
  path.join(__dirname, '..', '..', 'web', 'src', 'lib', 'request-catalog-fallback.ts');

function readCatalog(file) {
  const source = fs.readFileSync(file, 'utf8');
  const start = source.indexOf('const CATALOG');
  if (start === -1) {
    throw new Error('No encontre CATALOG en el fallback.');
  }

  // Se busca el '[' del literal, no el de la anotacion `CategoryInput[]`.
  const open = source.indexOf('[', source.indexOf('=', start));
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '[') depth += 1;
    if (source[i] === ']') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  // Es un literal de datos: se evalua tal cual, sin la anotacion de tipo.
  const literal = source.slice(open, end + 1);
  // eslint-disable-next-line no-eval
  return eval(literal);
}

async function main() {
  const catalog = readCatalog(FALLBACK);
  console.log(`Fallback: ${catalog.length} categorias.`);

  const before = await prisma.requestCatalogCategory.findMany({ select: { label: true } });
  console.log(`Base antes: ${before.length} categorias.`);

  for (const [index, category] of catalog.entries()) {
    const data = {
      subtitle: category.subtitle,
      imageSrc: category.imageSrc,
      imageClassName: category.imageClassName,
      searchKeywords: category.searchKeywords,
      sortOrder: index,
      isActive: true,
    };

    const record = await prisma.requestCatalogCategory.upsert({
      where: { label: category.label },
      create: { label: category.label, ...data },
      update: data,
    });

    await prisma.requestCatalogField.deleteMany({ where: { categoryId: record.id } });
    await prisma.requestCatalogField.createMany({
      data: category.fields.map((field, fieldIndex) => ({
        categoryId: record.id,
        key: field.key,
        label: field.label,
        type: RequestCatalogFieldType[field.type.toUpperCase()],
        options: field.options ?? [],
        placeholder: field.placeholder ?? null,
        helper: field.helper ?? null,
        required: field.required ?? false,
        fullWidth: field.fullWidth ?? false,
        inputType: field.inputType
          ? RequestCatalogInputType[field.inputType.toUpperCase()]
          : null,
        sortOrder: fieldIndex,
        isActive: true,
      })),
    });

    const existed = before.some((item) => item.label === category.label);
    console.log(`  ${existed ? 'actualizada' : 'RESTAURADA '} ${category.label} -> ${category.imageSrc}`);
  }

  const after = await prisma.requestCatalogCategory.count();
  console.log(`Base despues: ${after} categorias.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
