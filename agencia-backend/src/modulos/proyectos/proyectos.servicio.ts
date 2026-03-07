import prisma from '../../config/baseDatos.js'
import {
  DatosCrearProyecto,
  DatosActualizarProyecto,
  FiltrosProyecto,
} from './proyectos.tipos.js'

/**
 * Capa de lógica de negocio para proyectos (portafolio).
 */

// ─── Listar proyectos públicos con paginación y filtros ───────────────────────
export const listarProyectos = async (filtros: FiltrosProyecto) => {
  const { pagina, porPagina, busqueda, destacado, servicioId, tecnologia } = filtros

  const donde = {
    ...(destacado  !== undefined && { destacado: destacado === 'true' }),
    ...(servicioId !== undefined && { servicioId }),
    ...(busqueda   && {
      OR: [
        { titulo:      { contains: busqueda, mode: 'insensitive' as const } },
        { descripcion: { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
    // Filtrar por tecnología dentro del array JSON
    ...(tecnologia && {
      stackTecnico: { array_contains: tecnologia },
    }),
  }

  const [datos, total] = await Promise.all([
    prisma.proyecto.findMany({
      where:   donde,
      orderBy: [
        { destacado: 'desc' }, // Destacados primero
        { creadoEn:  'desc' },
      ],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: {
        servicio:    { select: { id: true, nombre: true, slug: true } },
        testimonios: {
          where:  { visible: true },
          select: { id: true, nombreCliente: true, calificacion: true, contenido: true },
        },
      },
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

// ─── Listar solo destacados (para página de inicio) ───────────────────────────
export const listarDestacados = async () => {
  return prisma.proyecto.findMany({
    where:   { destacado: true },
    orderBy: { creadoEn: 'desc' },
    take:    6,
    include: {
      servicio:    { select: { id: true, nombre: true, slug: true } },
      testimonios: {
        where:  { visible: true },
        select: { id: true, nombreCliente: true, calificacion: true },
      },
    },
  })
}

// ─── Obtener uno por slug (público) ──────────────────────────────────────────
export const obtenerProyectoPorSlug = async (slug: string) => {
  const proyecto = await prisma.proyecto.findUnique({
    where:   { slug },
    include: {
      servicio:    true,
      testimonios: {
        where:  { visible: true },
        select: {
          id:           true,
          nombreCliente: true,
          empresa:      true,
          contenido:    true,
          calificacion: true,
          creadoEn:     true,
        },
      },
    },
  })
  if (!proyecto) throw new Error('Proyecto no encontrado')
  return proyecto
}

// ─── Obtener uno por id (admin) ───────────────────────────────────────────────
export const obtenerProyectoPorId = async (id: string) => {
  const proyecto = await prisma.proyecto.findUnique({
    where:   { id },
    include: {
      servicio:    true,
      testimonios: true,
    },
  })
  if (!proyecto) throw new Error('Proyecto no encontrado')
  return proyecto
}

// ─── Crear proyecto (solo ADMIN) ─────────────────────────────────────────────
export const crearProyecto = async (datos: DatosCrearProyecto) => {
  const existente = await prisma.proyecto.findUnique({
    where: { slug: datos.slug },
  })
  if (existente) throw new Error('Ya existe un proyecto con ese slug')

  if (datos.servicioId) {
    const servicio = await prisma.servicio.findUnique({
      where: { id: datos.servicioId },
    })
    if (!servicio) throw new Error('El servicio indicado no existe')
  }

  return prisma.proyecto.create({
    data: {
      titulo:       datos.titulo,
      slug:         datos.slug,
      descripcion:  datos.descripcion,
      stackTecnico: datos.stackTecnico,
      imagenUrl:    datos.imagenUrl,
      urlEnVivo:    datos.urlEnVivo,
      urlGithub:    datos.urlGithub,
      destacado:    datos.destacado ?? false,
      servicioId:   datos.servicioId,
    },
    include: {
      servicio: { select: { id: true, nombre: true, slug: true } },
    },
  })
}

// ─── Actualizar proyecto (solo ADMIN) ────────────────────────────────────────
export const actualizarProyecto = async (id: string, datos: DatosActualizarProyecto) => {
  await obtenerProyectoPorId(id)

  if (datos.slug) {
    const existente = await prisma.proyecto.findFirst({
      where: { slug: datos.slug, NOT: { id } },
    })
    if (existente) throw new Error('Ya existe un proyecto con ese slug')
  }

  if (datos.servicioId) {
    const servicio = await prisma.servicio.findUnique({
      where: { id: datos.servicioId },
    })
    if (!servicio) throw new Error('El servicio indicado no existe')
  }

  return prisma.proyecto.update({
    where:   { id },
    data:    datos,
    include: { servicio: { select: { id: true, nombre: true, slug: true } } },
  })
}

// ─── Marcar / desmarcar como destacado ───────────────────────────────────────
export const toggleDestacado = async (id: string) => {
  const proyecto = await obtenerProyectoPorId(id)
  return prisma.proyecto.update({
    where: { id },
    data:  { destacado: !proyecto.destacado },
  })
}

// ─── Actualizar imagen ────────────────────────────────────────────────────────
export const actualizarImagen = async (id: string, imagenUrl: string) => {
  await obtenerProyectoPorId(id)
  return prisma.proyecto.update({
    where: { id },
    data:  { imagenUrl },
  })
}

// ─── Eliminar proyecto (solo ADMIN) ──────────────────────────────────────────
export const eliminarProyecto = async (id: string) => {
  const proyecto = await obtenerProyectoPorId(id)

  const totalTestimonios = await prisma.testimonio.count({
    where: { proyectoId: id },
  })

  if (totalTestimonios > 0) {
    throw new Error(
      `No se puede eliminar un proyecto con ${totalTestimonios} testimonio(s) asociado(s). Elimínalos primero.`
    )
  }

  await prisma.proyecto.delete({ where: { id } })
  return proyecto
}

// ─── Resumen de tecnologías usadas ────────────────────────────────────────────
export const resumenTecnologias = async () => {
  const proyectos = await prisma.proyecto.findMany({
    select: { stackTecnico: true },
  })

  const conteo: Record<string, number> = {}

  for (const proyecto of proyectos) {
    const stack = proyecto.stackTecnico as string[]
    for (const tecnologia of stack) {
      conteo[tecnologia] = (conteo[tecnologia] ?? 0) + 1
    }
  }

  return Object.entries(conteo)
    .map(([tecnologia, cantidad]) => ({ tecnologia, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
}