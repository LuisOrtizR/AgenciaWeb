import prisma from '../../config/baseDatos.js'
import { DatosCrearServicio, DatosActualizarServicio, FiltrosServicio } from './servicios.tipos.js'

/**
 * Capa de lógica de negocio para servicios.
 */

// ─── Listar activos con paginación y búsqueda (público) ───────────────────────
export const listarServicios = async (filtros: FiltrosServicio) => {
  const { pagina, porPagina, busqueda } = filtros

  const donde = {
    activo: true,
    ...(busqueda && {
      OR: [
        { nombre:      { contains: busqueda, mode: 'insensitive' as const } },
        { descripcion: { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [datos, total] = await Promise.all([
    prisma.servicio.findMany({
      where:   donde,
      orderBy: { creadoEn: 'desc' },
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
      select: {
        id:              true,
        nombre:          true,
        slug:            true,
        descripcion:     true,
        precioDesde:     true,
        precioHasta:     true,
        semanasEntrega:  true,
        caracteristicas: true,
        creadoEn:        true,
      },
    }),
    prisma.servicio.count({ where: donde }),
  ])

  return {
    datos,
    paginacion: {
      paginaActual:   pagina,
      totalPaginas:   Math.ceil(total / porPagina),
      totalRegistros: total,
      porPagina,
    },
  }
}

// ─── Listar todos con paginación (admin ve también inactivos) ─────────────────
export const listarServiciosAdmin = async (filtros: FiltrosServicio) => {
  const { pagina, porPagina, busqueda, activo } = filtros

  const donde = {
    ...(activo !== undefined && { activo: activo === 'true' }),
    ...(busqueda && {
      OR: [
        { nombre:      { contains: busqueda, mode: 'insensitive' as const } },
        { descripcion: { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [datos, total] = await Promise.all([
    prisma.servicio.findMany({
      where:   donde,
      orderBy: { creadoEn: 'desc' },
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
    }),
    prisma.servicio.count({ where: donde }),
  ])

  return {
    datos,
    paginacion: {
      paginaActual:   pagina,
      totalPaginas:   Math.ceil(total / porPagina),
      totalRegistros: total,
      porPagina,
    },
  }
}

// ─── Obtener uno por slug (público) ──────────────────────────────────────────
export const obtenerServicioPorSlug = async (slug: string) => {
  const servicio = await prisma.servicio.findUnique({ where: { slug } })
  if (!servicio) throw new Error('Servicio no encontrado')
  return servicio
}

// ─── Obtener uno por id ───────────────────────────────────────────────────────
export const obtenerServicioPorId = async (id: string) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')
  return servicio
}

// ─── Crear (solo ADMIN) ───────────────────────────────────────────────────────
export const crearServicio = async (datos: DatosCrearServicio) => {
  const existente = await prisma.servicio.findUnique({ where: { slug: datos.slug } })
  if (existente) throw new Error('Ya existe un servicio con ese slug')

  if (datos.precioDesde > datos.precioHasta) {
    throw new Error('El precio mínimo no puede ser mayor al precio máximo')
  }

  return prisma.servicio.create({ data: datos })
}

// ─── Actualizar (solo ADMIN) ──────────────────────────────────────────────────
export const actualizarServicio = async (id: string, datos: DatosActualizarServicio) => {
  await obtenerServicioPorId(id)

  if (datos.slug) {
    const existente = await prisma.servicio.findFirst({
      where: { slug: datos.slug, NOT: { id } },
    })
    if (existente) throw new Error('Ya existe un servicio con ese slug')
  }

  if (datos.precioDesde && datos.precioHasta && datos.precioDesde > datos.precioHasta) {
    throw new Error('El precio mínimo no puede ser mayor al precio máximo')
  }

  return prisma.servicio.update({ where: { id }, data: datos })
}

// ─── Desactivar — soft delete (solo ADMIN) ────────────────────────────────────
export const desactivarServicio = async (id: string) => {
  await obtenerServicioPorId(id)
  return prisma.servicio.update({ where: { id }, data: { activo: false } })
}

// ─── Activar (solo ADMIN) ─────────────────────────────────────────────────────
export const activarServicio = async (id: string) => {
  await obtenerServicioPorId(id)
  return prisma.servicio.update({ where: { id }, data: { activo: true } })
}

// ─── Eliminar permanente (solo ADMIN) ────────────────────────────────────────
export const eliminarServicio = async (id: string) => {
  const servicio = await obtenerServicioPorId(id)

  // Verificar que no tenga proyectos o cotizaciones asociadas
  const [proyectos, cotizaciones] = await Promise.all([
    prisma.proyecto.count({ where: { servicioId: id } }),
    prisma.cotizacion.count({ where: { servicioId: id } }),
  ])

  if (proyectos > 0 || cotizaciones > 0) {
    throw new Error('No se puede eliminar un servicio con proyectos o cotizaciones asociadas. Desactívalo en su lugar.')
  }

  await prisma.servicio.delete({ where: { id } })
  return servicio
}