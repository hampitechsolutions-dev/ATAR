/*
 * Alta/promoción de un ADMIN de plataforma ATAR (dueño de ATAR).
 *
 * El rol ADMIN da acceso al panel de facturación (/dashboard/admin) y a todos
 * los endpoints de administración. NO se puede obtener por registro público
 * (ver auth.service.register): se asigna solo con este script, corriéndolo quien
 * tiene acceso al servidor/base.
 *
 * Uso:
 *   node prisma/grant-admin.js <email> [password] [nombre] [apellido]
 *   # o con variables de entorno:
 *   ATAR_ADMIN_EMAIL=... ATAR_ADMIN_PASSWORD=... node prisma/grant-admin.js
 *
 * - Si el usuario ya existe, lo promueve a ADMIN (no hace falta password).
 * - Si no existe, lo crea (password obligatoria).
 * Es idempotente: correrlo de nuevo no duplica nada.
 */
const bcrypt = require('bcrypt');
const { PrismaClient, CompanyType, MembershipRole, UserStatus } = require('@prisma/client');

const prisma = new PrismaClient();

// Empresa "interna" de la plataforma a la que se cuelga la membresía ADMIN.
const ATAR_COMPANY_ID = 'atar-plataforma';

async function main() {
  const email = (process.argv[2] || process.env.ATAR_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.argv[3] || process.env.ATAR_ADMIN_PASSWORD || '';
  const firstName = process.argv[4] || process.env.ATAR_ADMIN_FIRSTNAME || 'Admin';
  const lastName = process.argv[5] || process.env.ATAR_ADMIN_LASTNAME || 'ATAR';

  if (!email) {
    console.error('Falta el email. Uso: node prisma/grant-admin.js <email> [password] [nombre] [apellido]');
    process.exit(1);
  }

  const company = await prisma.company.upsert({
    where: { id: ATAR_COMPANY_ID },
    update: {},
    create: { id: ATAR_COMPANY_ID, name: 'ATAR', type: CompanyType.HYBRID, country: 'AR' },
  });

  let user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });

  if (!user) {
    if (!password) {
      console.error(`No existe un usuario con ${email}. Pasá una contraseña para crearlo:`);
      console.error('  node prisma/grant-admin.js <email> <password> [nombre] [apellido]');
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, status: UserStatus.ACTIVE },
      include: { memberships: true },
    });
    console.log(`Usuario creado: ${email}`);
  } else if (password) {
    // Si se pasó password para un usuario existente, se actualiza (reset).
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    console.log(`Contraseña actualizada para ${email}`);
  }

  const already = user.memberships.find(
    (membership) => membership.companyId === company.id && membership.role === MembershipRole.ADMIN,
  );
  if (already) {
    console.log(`${email} ya es ADMIN de ATAR. Nada que hacer.`);
  } else {
    await prisma.membership.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: MembershipRole.ADMIN,
        isPrimary: user.memberships.length === 0,
      },
    });
    console.log(`✔ ${email} ahora es ADMIN de ATAR.`);
  }

  console.log('Ingresá en /acceso y abrí "Panel de ATAR" (o /dashboard/admin/facturacion).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
