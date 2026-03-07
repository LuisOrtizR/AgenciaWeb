import prisma from '../../config/baseDatos.js'
import {
  DatosEnviarTestimonio,
  DatosCrearTestimonio,
  DatosActualizarTestimonio,
  DatosModeracion,
  FiltrosTestimonio,
} from './testimonios.tipos.js'

/**
 * Capa de lógica de negocio para testimonios.
 *
 * Público:  enviar testimonio (formulario), listar visibles, destacados, obtener por id
 * ADMIN:    listar todos, crear, actualizar, moderar, resumen, eliminar
 */

// ─── Selección con relaciones ─────────────────────────────────────────────────
const incluirRelaciones = {
  proyecto: {
    select: {
      id:        true,
      titulo:    true,
      slug:      true,
      imagenUrl: true,
      servicio:  { select: { id: true, nombre: true, slug: true } },
    },
  },
  usuario: {
    select: {
      id:     true,
      nombre: true,
    },
  },
}

// ─── Enviar testimonio — formulario público sin registro ──────────────────────
export const enviarTestimonio = async (datos: DatosEnviarTestimonio) => {
  // Verificar honeypot — si sitioWeb tiene valor es un bot
  if (datos.sitioWeb) {
    throw new Error('Solicitud inválida')
  }

  if (datos.proyectoId) {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: datos.proyectoId },
    })
    if (!proyecto) throw new Error('El proyecto indicado no existe')
  }

  // Verificar que no haya enviado uno reciente con el mismo nombre
  // (protección básica contra spam — ventana de 24 horas)
  const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const reciente    = await prisma.testimonio.findFirst({
    where: {
      nombreCliente: { equals: datos.nombreCliente, mode: 'insensitive' },
      creadoEn:      { gte: hace24Horas },
    },
  })
  if (reciente) {
    throw new Error('Ya enviaste un testimonio recientemente. Puedes intentarlo de nuevo en 24 horas.')
  }

  return prisma.testimonio.create({
    data: {
      nombreCliente: datos.nombreCliente,
      empresa:       datos.empresa,
      contenido:     datos.contenido,
      calificacion:  datos.calificacion,
      proyectoId:    datos.proyectoId,
      visible:       false, // Siempre oculto hasta que admin apruebe
    },
    include: incluirRelaciones,
  })
}

// ─── Listar visibles con paginación — público ─────────────────────────────────
export const listarVisibles = async (filtros: FiltrosTestimonio) => {
  const { pagina, porPagina, calificacion, proyectoId } = filtros

  const donde = {
    visible: true,
    ...(calificacion && { calificacion }),
    ...(proyectoId   && { proyectoId }),
  }

  const [datos, total] = await Promise.all([
    prisma.testimonio.findMany({
      where:   donde,
      orderBy: [
        { calificacion: 'desc' },
        { creadoEn:     'desc' },
      ],
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
      include: incluirRelaciones,
    }),
    prisma.testimonio.count({ where: donde }),
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

// ─── Listar todos — admin ve también los ocultos ──────────────────────────────
export const listarTodos = async (filtros: FiltrosTestimonio) => {
  const { pagina, porPagina, busqueda, visible, calificacion, proyectoId } = filtros

  const donde = {
    ...(visible      !== undefined && { visible: visible === 'true' }),
    ...(calificacion && { calificacion }),
    ...(proyectoId   && { proyectoId }),
    ...(busqueda     && {
      OR: [
        { nombreCliente: { contains: busqueda, mode: 'insensitive' as const } },
        { empresa:       { contains: busqueda, mode: 'insensitive' as const } },
        { contenido:     { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [datos, total] = await Promise.all([
    prisma.testimonio.findMany({
      where:   donde,
      orderBy: { creadoEn: 'desc' },
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
      include: incluirRelaciones,
    }),
    prisma.testimonio.count({ where: donde }),
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

// ─── Obtener uno por id ───────────────────────────────────────────────────────
export const obtenerTestimonioPorId = async (id: string, soloVisible = false) => {
  const testimonio = await prisma.testimonio.findUnique({
    where:   { id },
    include: incluirRelaciones,
  })

  if (!testimonio)                        throw new Error('Testimonio no encontrado')
  if (soloVisible && !testimonio.visible) throw new Error('Testimonio no disponible')

  return testimonio
}

// ─── Listar destacados — para página de inicio ────────────────────────────────
export const listarDestacados = async (limite = 6) => {
  return prisma.testimonio.findMany({
    where: {
      visible:      true,
      calificacion: { gte: 4 },
    },
    orderBy: [
      { calificacion: 'desc' },
      { creadoEn:     'desc' },
    ],
    take:    limite,
    include: incluirRelaciones,
  })
}

// ─── Crear testimonio — desde panel admin ────────────────────────────────────
export const crearTestimonio = async (datos: DatosCrearTestimonio) => {
  if (datos.proyectoId) {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: datos.proyectoId },
    })
    if (!proyecto) throw new Error('El proyecto indicado no existe')
  }

  if (datos.usuarioId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: datos.usuarioId },
    })
    if (!usuario) throw new Error('El usuario indicado no existe')
  }

  return prisma.testimonio.create({
    data: {
      nombreCliente: datos.nombreCliente,
      empresa:       datos.empresa,
      contenido:     datos.contenido,
      calificacion:  datos.calificacion,
      proyectoId:    datos.proyectoId,
      usuarioId:     datos.usuarioId,
      visible:       datos.visible ?? false,
    },
    include: incluirRelaciones,
  })
}

// ─── Actualizar testimonio — solo ADMIN ──────────────────────────────────────
export const actualizarTestimonio = async (id: string, datos: DatosActualizarTestimonio) => {
  await obtenerTestimonioPorId(id)

  if (datos.proyectoId) {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: datos.proyectoId },
    })
    if (!proyecto) throw new Error('El proyecto indicado no existe')
  }

  return prisma.testimonio.update({
    where:   { id },
    data:    datos,
    include: incluirRelaciones,
  })
}

// ─── Moderar — aprobar o ocultar — solo ADMIN ────────────────────────────────
export const moderarTestimonio = async (id: string, datos: DatosModeracion) => {
  await obtenerTestimonioPorId(id)

  return prisma.testimonio.update({
    where:   { id },
    data:    { visible: datos.visible },
    include: incluirRelaciones,
  })
}

// ─── Resumen para dashboard ───────────────────────────────────────────────────
export const resumenTestimonios = async () => {
  const [total, visibles, ocultos, porCalificacion, promedio] = await Promise.all([
    prisma.testimonio.count(),
    prisma.testimonio.count({ where: { visible: true  } }),
    prisma.testimonio.count({ where: { visible: false } }),

    prisma.testimonio.groupBy({
      by:      ['calificacion'],
      _count:  { calificacion: true },
      orderBy: { calificacion: 'desc' },
    }),

    prisma.testimonio.aggregate({
      where: { visible: true },
      _avg:  { calificacion: true },
    }),
  ])

  return {
    total,
    visibles,
    ocultos,
    pendientesRevision: ocultos,
    promedioCalificacion: Math.round((promedio._avg.calificacion ?? 0) * 10) / 10,
    porCalificacion: porCalificacion.map(c => ({
      estrellas: c.calificacion,
      cantidad:  c._count.calificacion,
    })),
  }
}

// ─── Eliminar — solo ADMIN ────────────────────────────────────────────────────
export const eliminarTestimonio = async (id: string) => {
  const testimonio = await obtenerTestimonioPorId(id)
  await prisma.testimonio.delete({ where: { id } })
  return testimonio
}