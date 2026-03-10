import prisma from '../../config/baseDatos.js'
import logger  from '../../utilidades/logger.js'
import { DatosCrearServicio, DatosActualizarServicio, FiltrosServicio } from './servicios.tipos.js'

const TASA_FALLBACK = 4200
let cacheTasa: { valor: number; fecha: string } | null = null

export const obtenerTasaCOP_USD = async (): Promise<number> => {
  const hoy = new Date().toISOString().slice(0, 10)
  if (cacheTasa?.fecha === hoy) return cacheTasa.valor

  try {
    const resp = await fetch('https://open.er-api.com/v6/latest/USD')
    const json = await resp.json() as { rates?: Record<string, number> }
    const tasa = json.rates?.['COP']
    if (!tasa) throw new Error('Tasa no disponible en la respuesta')
    cacheTasa = { valor: tasa, fecha: hoy }
    return tasa
  } catch (err) {
    logger.error(`[Servicios] No se pudo obtener tasa USD/COP: ${err instanceof Error ? err.message : err}`)
    return cacheTasa?.valor ?? TASA_FALLBACK
  }
}


const copAUsd = (cop: number, tasa: number) => Math.round(cop / tasa)

const resolverOrden = (orden: FiltrosServicio['orden']) => {
  if (orden === 'precio_asc')  return { precioDesde: 'asc'  as const }
  if (orden === 'precio_desc') return { precioDesde: 'desc' as const }
  return { creadoEn: 'desc' as const }
}

const agregarUsd = <T extends { precioDesde: number; precioHasta: number }>(
  items: T[],
  tasa:  number
) => items.map(item => ({
  ...item,
  precioDesdeUsd: copAUsd(item.precioDesde, tasa),
  precioHastaUsd: copAUsd(item.precioHasta, tasa),
  tasaCOP_USD:    Math.round(tasa),
}))

const construirBusqueda = (busqueda?: string) =>
  busqueda
    ? {
        OR: [
          { nombre:      { contains: busqueda, mode: 'insensitive' as const } },
          { descripcion: { contains: busqueda, mode: 'insensitive' as const } },
        ],
      }
    : {}

const paginar = (datos: unknown[], total: number, pagina: number, porPagina: number) => ({
  paginaActual:   pagina,
  totalPaginas:   Math.ceil(total / porPagina),
  totalRegistros: total,
  porPagina,
})

const buscarOLanzar = async (id: string) => {
  const s = await prisma.servicio.findUnique({ where: { id } })
  if (!s) throw new Error('Servicio no encontrado')
  return s
}

const verificarSlugUnico = async (slug: string, excluirId?: string) => {
  const existente = await prisma.servicio.findFirst({
    where: { slug, ...(excluirId && { NOT: { id: excluirId } }) },
    select: { id: true },
  })
  if (existente) throw new Error(`Ya existe un servicio con el slug "${slug}"`)
}


const selectPublico = {
  id:              true,
  nombre:          true,
  slug:            true,
  descripcion:     true,
  precioDesde:     true,
  precioHasta:     true,
  semanasEntrega:  true,
  caracteristicas: true,
  creadoEn:        true,
} as const

export const listarServicios = async (filtros: FiltrosServicio) => {
  const { pagina, porPagina, busqueda, orden } = filtros
  const donde = { activo: true, ...construirBusqueda(busqueda) }

  const [datos, total, tasa] = await Promise.all([
    prisma.servicio.findMany({
      where:   donde,
      orderBy: resolverOrden(orden),
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
      select:  selectPublico,
    }),
    prisma.servicio.count({ where: donde }),
    obtenerTasaCOP_USD(),
  ])

  return { datos: agregarUsd(datos, tasa), paginacion: paginar(datos, total, pagina, porPagina) }
}


export const listarServiciosAdmin = async (filtros: FiltrosServicio) => {
  const { pagina, porPagina, busqueda, activo, orden } = filtros
  const donde = {
    ...(activo !== undefined && { activo }),
    ...construirBusqueda(busqueda),
  }

  const [datos, total, tasa] = await Promise.all([
    prisma.servicio.findMany({
      where:   donde,
      orderBy: resolverOrden(orden),
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
    }),
    prisma.servicio.count({ where: donde }),
    obtenerTasaCOP_USD(),
  ])

  return { datos: agregarUsd(datos, tasa), paginacion: paginar(datos, total, pagina, porPagina) }
}

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


export const obtenerServicioPorId = async (id: string) => buscarOLanzar(id)


export const crearServicio = async (datos: DatosCrearServicio) => {
  await verificarSlugUnico(datos.slug)
  return prisma.servicio.create({ data: datos })
}

export const actualizarServicio = async (id: string, datos: DatosActualizarServicio) => {
  await buscarOLanzar(id)
  if (datos.slug) await verificarSlugUnico(datos.slug, id)
  return prisma.servicio.update({ where: { id }, data: datos })
}


const cambiarEstado = async (id: string, activo: boolean) => {
  await buscarOLanzar(id)
  return prisma.servicio.update({
    where:  { id },
    data:   { activo },
    select: { id: true, nombre: true, slug: true, activo: true },
  })
}

export const activarServicio    = (id: string) => cambiarEstado(id, true)
export const desactivarServicio = (id: string) => cambiarEstado(id, false)


export const eliminarServicio = async (id: string) => {
  const s = await buscarOLanzar(id)

  const [totalProyectos, totalCotizaciones] = await Promise.all([
    prisma.proyecto.count({ where: { servicioId: id } }),
    prisma.cotizacion.count({ where: { servicioId: id } }),
  ])

  if (totalProyectos > 0 || totalCotizaciones > 0) {
    throw new Error(
      `No se puede eliminar un servicio con ${totalProyectos} proyecto(s) y ${totalCotizaciones} cotizacion(es) asociadas. Desactivalo en su lugar.`
    )
  }

  await prisma.servicio.delete({ where: { id } })
  return { id: s.id, nombre: s.nombre, slug: s.slug }
}