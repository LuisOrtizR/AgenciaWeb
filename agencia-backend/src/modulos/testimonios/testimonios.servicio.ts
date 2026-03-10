import prisma from '../../config/baseDatos.js'
import {
  DatosEnviarTestimonio,
  DatosCrearTestimonio,
  DatosActualizarTestimonio,
  DatosModeracion,
  FiltrosTestimonio,
} from './testimonios.tipos.js'


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
  usuario: { select: { id: true, nombre: true } },
} as const


const buscarOLanzar = async (id: string, soloVisible = false) => {
  const t = await prisma.testimonio.findUnique({ where: { id }, include: incluirRelaciones })
  if (!t)                        throw new Error('Testimonio no encontrado')
  if (soloVisible && !t.visible) throw new Error('Testimonio no disponible')
  return t
}

const verificarProyectoExiste = async (proyectoId: string) => {
  const p = await prisma.proyecto.findUnique({ where: { id: proyectoId }, select: { id: true } })
  if (!p) throw new Error('El proyecto indicado no existe')
}

const verificarUsuarioExiste = async (usuarioId: string) => {
  const u = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, activo: true } })
  if (!u)        throw new Error('El usuario indicado no existe')
  if (!u.activo) throw new Error('El usuario indicado esta inactivo')
}

const paginar = (total: number, pagina: number, porPagina: number) => ({
  paginaActual:   pagina,
  totalPaginas:   Math.ceil(total / porPagina),
  totalRegistros: total,
  porPagina,
})


export const enviarTestimonio = async (datos: DatosEnviarTestimonio) => {
  if (datos.sitioWeb) throw new Error('Solicitud invalida')

  if (datos.proyectoId) await verificarProyectoExiste(datos.proyectoId)

  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const reciente = await prisma.testimonio.findFirst({
    where: {
      nombreCliente: { equals: datos.nombreCliente, mode: 'insensitive' },
      creadoEn:      { gte: hace24h },
    },
    select: { id: true },
  })
  if (reciente) throw new Error('Ya enviaste un testimonio recientemente. Intenta de nuevo en 24 horas.')

  return prisma.testimonio.create({
    data: {
      nombreCliente: datos.nombreCliente,
      empresa:       datos.empresa      ?? null,
      contenido:     datos.contenido,
      calificacion:  datos.calificacion,
      proyectoId:    datos.proyectoId   ?? null,
      visible:       false,
    },
    include: incluirRelaciones,
  })
}


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
      orderBy: [{ calificacion: 'desc' }, { creadoEn: 'desc' }],
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
      include: incluirRelaciones,
    }),
    prisma.testimonio.count({ where: donde }),
  ])

  return { datos, paginacion: paginar(total, pagina, porPagina) }
}


export const listarTodos = async (filtros: FiltrosTestimonio) => {
  const { pagina, porPagina, busqueda, visible, calificacion, proyectoId } = filtros
  const donde = {
    ...(visible      !== undefined && { visible }),
    ...(calificacion && { calificacion }),
    ...(proyectoId   && { proyectoId }),
    ...(busqueda && {
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

  return { datos, paginacion: paginar(total, pagina, porPagina) }
}


export const obtenerTestimonioPorId = (id: string, soloVisible = false) =>
  buscarOLanzar(id, soloVisible)


export const listarDestacados = (limite = 6) =>
  prisma.testimonio.findMany({
    where:   { visible: true, calificacion: { gte: 4 } },
    orderBy: [{ calificacion: 'desc' }, { creadoEn: 'desc' }],
    take:    limite,
    include: incluirRelaciones,
  })


export const crearTestimonio = async (datos: DatosCrearTestimonio) => {
  if (datos.proyectoId) await verificarProyectoExiste(datos.proyectoId)
  if (datos.usuarioId)  await verificarUsuarioExiste(datos.usuarioId)

  return prisma.testimonio.create({
    data: {
      nombreCliente: datos.nombreCliente,
      empresa:       datos.empresa    ?? null,
      contenido:     datos.contenido,
      calificacion:  datos.calificacion,
      proyectoId:    datos.proyectoId ?? null,
      usuarioId:     datos.usuarioId  ?? null,
      visible:       datos.visible    ?? false,
    },
    include: incluirRelaciones,
  })
}


export const actualizarTestimonio = async (id: string, datos: DatosActualizarTestimonio) => {
  await buscarOLanzar(id)
  if (datos.proyectoId) await verificarProyectoExiste(datos.proyectoId)

  return prisma.testimonio.update({ where: { id }, data: datos, include: incluirRelaciones })
}


export const moderarTestimonio = async (id: string, datos: DatosModeracion) => {
  await buscarOLanzar(id)
  return prisma.testimonio.update({
    where:   { id },
    data:    { visible: datos.visible },
    include: incluirRelaciones,
  })
}


export const resumenTestimonios = async () => {
  const [total, visibles, porCalificacion, promedio] = await Promise.all([
    prisma.testimonio.count(),
    prisma.testimonio.count({ where: { visible: true } }),
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
    pendientesRevision:   total - visibles,
    promedioCalificacion: Math.round((promedio._avg.calificacion ?? 0) * 10) / 10,
    porCalificacion: porCalificacion.map(c => ({
      estrellas: c.calificacion,
      cantidad:  c._count.calificacion,
    })),
  }
}


export const eliminarTestimonio = async (id: string) => {
  const t = await buscarOLanzar(id)
  await prisma.testimonio.delete({ where: { id } })
  return { id: t.id, nombreCliente: t.nombreCliente, calificacion: t.calificacion }
}