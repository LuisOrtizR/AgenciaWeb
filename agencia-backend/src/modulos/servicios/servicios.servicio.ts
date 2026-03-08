import prisma from '../../config/baseDatos.js'
import { DatosCrearServicio, DatosActualizarServicio, FiltrosServicio } from './servicios.tipos.js'

// ─── Caché de tasa USD/COP — se actualiza una vez al día ─────────────────────

let cacheTasa: { valor: number; fecha: string } | null = null

export const obtenerTasaCOP_USD = async (): Promise<number> => {
  const hoy = new Date().toISOString().slice(0, 10)

  if (cacheTasa && cacheTasa.fecha === hoy) {
    return cacheTasa.valor
  }

  try {
    const resp = await fetch('https://open.er-api.com/v6/latest/USD')
    const json = await resp.json() as { rates?: Record<string, number> }
    const tasa = json.rates?.['COP']

    if (!tasa) throw new Error('Tasa no disponible')

    cacheTasa = { valor: tasa, fecha: hoy }
    return tasa
  } catch {
    return cacheTasa?.valor ?? 4200
  }
}

const copAUsd = (cop: number, tasa: number) =>
  Math.round(cop / tasa)

// ─── Orden helper ─────────────────────────────────────────────────────────────

const ordenarPor = (orden: FiltrosServicio['orden']) => {
  if (orden === 'precio_asc')  return { precioDesde: 'asc'  as const }
  if (orden === 'precio_desc') return { precioDesde: 'desc' as const }
  return { creadoEn: 'desc' as const }
}

// ─── Agregar precios en USD a cada servicio ───────────────────────────────────

const agregarUsd = <T extends { precioDesde: number; precioHasta: number }>(
  items: T[],
  tasa: number
): (T & { precioDesdeUsd: number; precioHastaUsd: number; tasaCOP_USD: number })[] =>
  items.map(item => ({
    ...item,
    precioDesdeUsd: copAUsd(item.precioDesde, tasa),
    precioHastaUsd: copAUsd(item.precioHasta, tasa),
    tasaCOP_USD:    Math.round(tasa),
  }))

// ─── Listar activos (público) ─────────────────────────────────────────────────

export const listarServicios = async (filtros: FiltrosServicio) => {
  const { pagina, porPagina, busqueda, orden } = filtros

  const donde = {
    activo: true,
    ...(busqueda && {
      OR: [
        { nombre:      { contains: busqueda, mode: 'insensitive' as const } },
        { descripcion: { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [datos, total, tasa] = await Promise.all([
    prisma.servicio.findMany({
      where:   donde,
      orderBy: ordenarPor(orden),
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
    obtenerTasaCOP_USD(),
  ])

  return {
    datos: agregarUsd(datos, tasa),
    paginacion: {
      paginaActual:   pagina,
      totalPaginas:   Math.ceil(total / porPagina),
      totalRegistros: total,
      porPagina,
    },
  }
}

// ─── Listar todos (admin) ─────────────────────────────────────────────────────

export const listarServiciosAdmin = async (filtros: FiltrosServicio) => {
  const { pagina, porPagina, busqueda, activo, orden } = filtros

  const donde = {
    ...(activo !== undefined && { activo: activo === 'true' }),
    ...(busqueda && {
      OR: [
        { nombre:      { contains: busqueda, mode: 'insensitive' as const } },
        { descripcion: { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [datos, total, tasa] = await Promise.all([
    prisma.servicio.findMany({
      where:   donde,
      orderBy: ordenarPor(orden),
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
    }),
    prisma.servicio.count({ where: donde }),
    obtenerTasaCOP_USD(),
  ])

  return {
    datos: agregarUsd(datos, tasa),
    paginacion: {
      paginaActual:   pagina,
      totalPaginas:   Math.ceil(total / porPagina),
      totalRegistros: total,
      porPagina,
    },
  }
}

// ─── Obtener por slug (público) ───────────────────────────────────────────────

export const obtenerServicioPorSlug = async (slug: string) => {
  const s = await prisma.servicio.findUnique({ where: { slug } })
  if (!s) throw new Error('Servicio no encontrado')
  const tasa = await obtenerTasaCOP_USD()
  return {
    ...s,
    precioDesdeUsd: copAUsd(s.precioDesde, tasa),
    precioHastaUsd: copAUsd(s.precioHasta, tasa),
    tasaCOP_USD:    Math.round(tasa),
  }
}

// ─── Obtener por id (admin) ───────────────────────────────────────────────────

export const obtenerServicioPorId = async (id: string) => {
  const s = await prisma.servicio.findUnique({ where: { id } })
  if (!s) throw new Error('Servicio no encontrado')
  return s
}

// ─── Crear ────────────────────────────────────────────────────────────────────

export const crearServicio = async (datos: DatosCrearServicio) => {
  const existente = await prisma.servicio.findUnique({ where: { slug: datos.slug } })
  if (existente) throw new Error('Ya existe un servicio con ese slug')
  if (datos.precioDesde > datos.precioHasta) throw new Error('El precio mínimo no puede ser mayor al precio máximo')
  return prisma.servicio.create({ data: datos })
}

// ─── Actualizar ───────────────────────────────────────────────────────────────

export const actualizarServicio = async (id: string, datos: DatosActualizarServicio) => {
  await obtenerServicioPorId(id)

  if (datos.slug) {
    const existente = await prisma.servicio.findFirst({ where: { slug: datos.slug, NOT: { id } } })
    if (existente) throw new Error('Ya existe un servicio con ese slug')
  }

  if (datos.precioDesde && datos.precioHasta && datos.precioDesde > datos.precioHasta) {
    throw new Error('El precio mínimo no puede ser mayor al precio máximo')
  }

  return prisma.servicio.update({ where: { id }, data: datos })
}

// ─── Activar / Desactivar ─────────────────────────────────────────────────────

export const desactivarServicio = async (id: string) => {
  await obtenerServicioPorId(id)
  return prisma.servicio.update({ where: { id }, data: { activo: false } })
}

export const activarServicio = async (id: string) => {
  await obtenerServicioPorId(id)
  return prisma.servicio.update({ where: { id }, data: { activo: true } })
}

// ─── Eliminar ─────────────────────────────────────────────────────────────────

export const eliminarServicio = async (id: string) => {
  const s = await obtenerServicioPorId(id)

  const [proyectos, cotizaciones] = await Promise.all([
    prisma.proyecto.count({ where: { servicioId: id } }),
    prisma.cotizacion.count({ where: { servicioId: id } }),
  ])

  if (proyectos > 0 || cotizaciones > 0) {
    throw new Error('No se puede eliminar un servicio con proyectos o cotizaciones asociadas. Desactívalo en su lugar.')
  }

  await prisma.servicio.delete({ where: { id } })
  return s
}