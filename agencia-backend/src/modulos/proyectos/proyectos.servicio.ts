import prisma from '../../config/baseDatos.js'
import {
  DatosCrearProyecto,
  DatosActualizarProyecto,
  FiltrosProyecto,
} from './proyectos.tipos.js'

const selectServicio = { id: true, nombre: true, slug: true } as const

const incluirPublico = {
  servicio:    { select: selectServicio },
  testimonios: {
    where:  { visible: true },
    select: {
      id:            true,
      nombreCliente: true,
      empresa:       true,
      contenido:     true,
      calificacion:  true,
      creadoEn:      true,
    },
  },
} as const

const buscarOLanzar = async (id: string) => {
  const proyecto = await prisma.proyecto.findUnique({
    where:   { id },
    include: { servicio: true, testimonios: true },
  })
  if (!proyecto) throw new Error('Proyecto no encontrado')
  return proyecto
}

const verificarSlugUnico = async (slug: string, excluirId?: string) => {
  const existente = await prisma.proyecto.findFirst({
    where: { slug, ...(excluirId && { NOT: { id: excluirId } }) },
    select: { id: true },
  })
  if (existente) throw new Error(`Ya existe un proyecto con el slug "${slug}"`)
}

const verificarServicioExiste = async (servicioId: string) => {
  const servicio = await prisma.servicio.findUnique({
    where:  { id: servicioId },
    select: { id: true, activo: true },
  })
  if (!servicio)        throw new Error('El servicio indicado no existe')
  if (!servicio.activo) throw new Error('El servicio indicado esta inactivo')
}

const construirFiltros = (filtros: FiltrosProyecto) => {
  const { busqueda, destacado, servicioId, tecnologia } = filtros
  return {
    ...(destacado  !== undefined && { destacado }),
    ...(servicioId !== undefined && { servicioId }),
    ...(tecnologia && { stackTecnico: { array_contains: tecnologia } }),
    ...(busqueda   && {
      OR: [
        { titulo:      { contains: busqueda, mode: 'insensitive' as const } },
        { descripcion: { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
  }
}

export const listarProyectos = async (filtros: FiltrosProyecto) => {
  const { pagina, porPagina, ordenarPor, direccion } = filtros
  const donde  = construirFiltros(filtros)
  const saltar = (pagina - 1) * porPagina

  const ordenBase =
    ordenarPor === 'creadoEn'
      ? [{ destacado: 'desc' as const }, { creadoEn: direccion }]
      : [{ [ordenarPor]: direccion }]

  const [datos, total] = await Promise.all([
    prisma.proyecto.findMany({
      where:   donde,
      orderBy: ordenBase,
      skip:    saltar,
      take:    porPagina,
      include: incluirPublico,
    }),
    prisma.proyecto.count({ where: donde }),
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

export const listarDestacados = async () =>
  prisma.proyecto.findMany({
    where:   { destacado: true },
    orderBy: { creadoEn: 'desc' },
    take:    6,
    include: {
      servicio:    { select: selectServicio },
      testimonios: {
        where:  { visible: true },
        select: { id: true, nombreCliente: true, calificacion: true },
      },
    },
  })

export const obtenerProyectoPorSlug = async (slug: string) => {
  const proyecto = await prisma.proyecto.findUnique({
    where:   { slug },
    include: incluirPublico,
  })
  if (!proyecto) throw new Error('Proyecto no encontrado')
  return proyecto
}

export const obtenerProyectoPorId = async (id: string) => buscarOLanzar(id)

export const crearProyecto = async (datos: DatosCrearProyecto) => {
  await verificarSlugUnico(datos.slug)
  if (datos.servicioId) await verificarServicioExiste(datos.servicioId)

  return prisma.proyecto.create({
    data: {
      titulo:       datos.titulo,
      slug:         datos.slug,
      descripcion:  datos.descripcion,
      stackTecnico: datos.stackTecnico,
      imagenUrl:    datos.imagenUrl    ?? null,
      urlEnVivo:    datos.urlEnVivo    ?? null,
      urlGithub:    datos.urlGithub    ?? null,
      destacado:    datos.destacado    ?? false,
      servicioId:   datos.servicioId   ?? null,
    },
    include: { servicio: { select: selectServicio } },
  })
}

export const actualizarProyecto = async (id: string, datos: DatosActualizarProyecto) => {
  await buscarOLanzar(id)
  if (datos.slug)      await verificarSlugUnico(datos.slug, id)
  if (datos.servicioId) await verificarServicioExiste(datos.servicioId)

  return prisma.proyecto.update({
    where:   { id },
    data:    datos,
    include: { servicio: { select: selectServicio } },
  })
}

export const toggleDestacado = async (id: string) => {
  const proyecto = await buscarOLanzar(id)
  return prisma.proyecto.update({
    where:  { id },
    data:   { destacado: !proyecto.destacado },
    select: { id: true, titulo: true, slug: true, destacado: true },
  })
}

export const actualizarImagen = async (id: string, imagenUrl: string | null) => {
  await buscarOLanzar(id)
  return prisma.proyecto.update({
    where:  { id },
    data:   { imagenUrl },
    select: { id: true, titulo: true, slug: true, imagenUrl: true },
  })
}

export const eliminarProyecto = async (id: string) => {
  const proyecto = await buscarOLanzar(id)

  const totalTestimonios = await prisma.testimonio.count({ where: { proyectoId: id } })
  if (totalTestimonios > 0) {
    throw new Error(
      `No se puede eliminar un proyecto con ${totalTestimonios} testimonio(s) asociado(s). Eliminalos primero.`
    )
  }

  await prisma.proyecto.delete({ where: { id } })
  return { id: proyecto.id, titulo: proyecto.titulo, slug: proyecto.slug }
}

export const resumenTecnologias = async () => {
  const proyectos = await prisma.proyecto.findMany({
    select: { stackTecnico: true },
  })

  const conteo: Record<string, number> = {}
  for (const { stackTecnico } of proyectos) {
    for (const tec of stackTecnico as string[]) {
      conteo[tec] = (conteo[tec] ?? 0) + 1
    }
  }

  return Object.entries(conteo)
    .map(([tecnologia, cantidad]) => ({ tecnologia, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
}