import { PrismaClient } from '@prisma/client'
import { PrismaPg }    from '@prisma/adapter-pg'
import { Pool }        from 'pg'
import bcrypt          from 'bcryptjs'
import dotenv          from 'dotenv'

dotenv.config()

// ─── Conexión directa (igual que baseDatos.ts) ────────────────────────────────
const urlConexion =
  `postgresql://${process.env['DB_USUARIO']}:${encodeURIComponent(process.env['DB_CONTRASENA'] ?? '')}` +
  `@${process.env['DB_HOST']}:${process.env['DB_PUERTO'] ?? '5432'}/${process.env['DB_NOMBRE']}`

const pool    = new Pool({ connectionString: urlConexion, ssl: { rejectUnauthorized: false } })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

// ─── Datos del superadmin ─────────────────────────────────────────────────────
const SUPERADMIN = {
  nombre:     'Nexova Studio',
  correo:     'admin@nexova.studio',
  contrasena: 'Nexova2026#',
  rol:        'ADMIN' as const,
}

// ─── Semilla principal ────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Iniciando semilla...\n')

  // ── Superadmin ──────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash(SUPERADMIN.contrasena, 10)

  const admin = await prisma.usuario.upsert({
    where:  { correo: SUPERADMIN.correo },
    update: { rol: 'ADMIN', contrasena: hash, activo: true },
    create: {
      nombre:     SUPERADMIN.nombre,
      correo:     SUPERADMIN.correo,
      contrasena: hash,
      rol:        'ADMIN',
    },
    select: { id: true, nombre: true, correo: true, rol: true },
  })

  console.log('✅ Superadmin listo:')
  console.log(`   📧 Correo:     ${admin.correo}`)
  console.log(`   🔑 Contraseña: ${SUPERADMIN.contrasena}`)
  console.log(`   👑 Rol:        ${admin.rol}`)
  console.log(`   🆔 ID:         ${admin.id}\n`)

  // ── Servicios base ──────────────────────────────────────────────────────────
  const servicios = [
    {
      nombre:          'Landing Page',
      slug:            'landing-page',
      descripcion:     'Página de aterrizaje optimizada para conversión con diseño moderno y velocidad de carga máxima.',
      precioDesde:     1500000,
      precioHasta:     3500000,
      semanasEntrega:  2,
      caracteristicas: ['Diseño responsive', 'SEO optimizado', 'Formulario de contacto', 'Google Analytics', 'PageSpeed 90+'],
    },
    {
      nombre:          'Sitio Corporativo',
      slug:            'sitio-corporativo',
      descripcion:     'Presencia digital profesional con múltiples secciones, blog y panel de administración.',
      precioDesde:     3500000,
      precioHasta:     7000000,
      semanasEntrega:  4,
      caracteristicas: ['Hasta 10 páginas', 'Blog integrado', 'Panel CMS', 'SEO avanzado', 'Multiidioma opcional'],
    },
    {
      nombre:          'Tienda E-commerce',
      slug:            'tienda-ecommerce',
      descripcion:     'Tienda online completa con carrito, pagos en línea, gestión de inventario y panel de administración.',
      precioDesde:     7000000,
      precioHasta:     18000000,
      semanasEntrega:  6,
      caracteristicas: ['Catálogo ilimitado', 'Pagos PSE / Tarjeta', 'Gestión de pedidos', 'App móvil opcional', 'Reportes de ventas'],
    },
    {
      nombre:          'Aplicación Web / SaaS',
      slug:            'aplicacion-web-saas',
      descripcion:     'Desarrollo de aplicaciones web a medida con autenticación, roles y lógica de negocio personalizada.',
      precioDesde:     15000000,
      precioHasta:     60000000,
      semanasEntrega:  12,
      caracteristicas: ['Arquitectura escalable', 'API REST', 'Roles y permisos', 'Integraciones externas', 'Soporte 6 meses'],
    },
    {
      nombre:          'Mantenimiento Web',
      slug:            'mantenimiento-web',
      descripcion:     'Plan mensual de mantenimiento, actualizaciones de seguridad, backups y soporte técnico.',
      precioDesde:     300000,
      precioHasta:     800000,
      semanasEntrega:  1,
      caracteristicas: ['Actualizaciones de seguridad', 'Backups semanales', 'Soporte por WhatsApp', 'Reporte mensual', 'Tiempo de respuesta 24h'],
    },
  ]

  for (const datos of servicios) {
    await prisma.servicio.upsert({
      where:  { slug: datos.slug },
      update: datos,
      create: datos,
    })
    console.log(`   ✅ Servicio: ${datos.nombre}`)
  }

  console.log('\n🎉 Semilla completada exitosamente.')
  console.log('─────────────────────────────────────────')
  console.log('📌 Usa estas credenciales en Postman:')
  console.log(`   correo:     ${SUPERADMIN.correo}`)
  console.log(`   contrasena: ${SUPERADMIN.contrasena}`)
  console.log('─────────────────────────────────────────\n')
}

main()
  .catch((error) => {
    console.error('❌ Error en semilla:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })