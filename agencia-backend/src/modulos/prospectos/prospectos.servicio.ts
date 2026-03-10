import prisma  from '../../config/baseDatos.js'
import logger  from '../../utilidades/logger.js'
import {
  notificarNuevoProspecto,
  confirmarRecepcionProspecto,
} from '../../config/correo.js'
import {
  DatosCrearProspecto,
  DatosActualizarProspecto,
  DatosActualizarEstadoProspecto,
  FiltrosProspecto,
} from './prospectos.tipos.js'

const selectResumido = {
  id:           true,
  nombre:       true,
  correo:       true,
  telefono:     true,
  tipoServicio: true,
  estado:       true,
  presupuesto:  true,
  fuente:       true,
  creadoEn:     true,
  usuario: { select: { id: true, nombre: true, correo: true } },
} as const


const buscarOLanzar = async (id: string) => {
  const prospecto = await prisma.prospecto.findUnique({
    where:   { id },
    include: {
      usuario:     { select: { id: true, nombre: true, correo: true } },
      cotizaciones: {
        include: { servicio: { select: { id: true, nombre: true } } },
        orderBy: { creadoEn: 'desc' },
      },
    },
  })
  if (!prospecto) throw new Error('Prospecto no encontrado')
  return prospecto
}

const construirFiltros = (filtros: FiltrosProspecto) => {
  const { busqueda, estado, tipoServicio, desde, hasta, conCotizacion } = filtros

  return {
    ...(estado       && { estado }),
    ...(tipoServicio && { tipoServicio }),
    ...(desde || hasta) && {
      creadoEn: {
        ...(desde && { gte: desde }),
        ...(hasta && { lte: hasta }),
      },
    },
    ...(conCotizacion === true  && { cotizaciones: { some:  {} } }),
    ...(conCotizacion === false && { cotizaciones: { none:  {} } }),
    ...(busqueda && {
      OR: [
        { nombre:   { contains: busqueda, mode: 'insensitive' as const } },
        { correo:   { contains: busqueda, mode: 'insensitive' as const } },
        { telefono: { contains: busqueda, mode: 'insensitive' as const } },
        { mensaje:  { contains: busqueda, mode: 'insensitive' as const } },
        { notas:    { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
  }
}


export const crearProspecto = async (datos: DatosCrearProspecto) => {
  const correoNormalizado = datos.correo.toLowerCase().trim()

  const usuarioVinculado = await prisma.usuario.findUnique({
    where:  { correo: correoNormalizado },
    select: { id: true },
  })

  const prospecto = await prisma.prospecto.create({
    data: {
      nombre:       datos.nombre.trim(),
      correo:       correoNormalizado,
      telefono:     datos.telefono   ?? null,
      tipoServicio: datos.tipoServicio,
      mensaje:      datos.mensaje    ?? null,
      presupuesto:  datos.presupuesto ?? null,
      fuente:       datos.fuente     ?? null,
      usuarioId:    usuarioVinculado?.id ?? null,
    },
    select: selectResumido,
  })

  const datoCorreo = {
    nombre:       datos.nombre,
    correo:       datos.correo,
    telefono:     datos.telefono     ?? null,
    tipoServicio: datos.tipoServicio,
    mensaje:      datos.mensaje      ?? null,
    presupuesto:  datos.presupuesto  ?? null,
    fuente:       datos.fuente       ?? null,
  }

  Promise.all([
    notificarNuevoProspecto(datoCorreo),
    confirmarRecepcionProspecto(datoCorreo),
  ]).catch((err) =>
    logger.error(`[Prospectos] Error enviando correos para ${correoNormalizado}: ${err instanceof Error ? err.message : err}`)
  )

  return prospecto
}


export const listarProspectos = async (filtros: FiltrosProspecto) => {
  const { pagina, porPagina, ordenarPor, direccion } = filtros
  const donde  = construirFiltros(filtros)
  const saltar = (pagina - 1) * porPagina

  const [datos, total] = await Promise.all([
    prisma.prospecto.findMany({
      where:   donde,
      orderBy: { [ordenarPor]: direccion },
      skip:    saltar,
      take:    porPagina,
      include: {
        usuario: { select: { id: true, nombre: true, correo: true } },
        cotizaciones: {
          select:  { id: true, estado: true, precioTotal: true, creadoEn: true },
          orderBy: { creadoEn: 'desc' },
          take:    3,
        },
      },
    }),
    prisma.prospecto.count({ where: donde }),
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


export const obtenerProspectoPorId = async (id: string) => buscarOLanzar(id)

export const actualizarProspecto = async (id: string, datos: DatosActualizarProspecto) => {
  await buscarOLanzar(id)
  return prisma.prospecto.update({
    where:   { id },
    data:    datos,
    include: { usuario: { select: { id: true, nombre: true, correo: true } } },
  })
}


export const actualizarEstado = async (
  id:    string,
  datos: DatosActualizarEstadoProspecto
) => {
  const prospecto = await buscarOLanzar(id)

  if (prospecto.estado === 'CONVERTIDO' && datos.estado === 'NUEVO') {
    throw new Error('No se puede revertir un prospecto convertido a estado NUEVO')
  }

  return prisma.prospecto.update({
    where:   { id },
    data:    { estado: datos.estado, notas: datos.notas ?? prospecto.notas },
    include: { usuario: { select: { id: true, nombre: true } } },
  })
}


export const asignarUsuario = async (prospectoId: string, usuarioId: string | null) => {
  await buscarOLanzar(prospectoId)

  if (usuarioId) {
    const usuario = await prisma.usuario.findUnique({
      where:  { id: usuarioId },
      select: { id: true, activo: true },
    })
    if (!usuario)        throw new Error('Usuario no encontrado')
    if (!usuario.activo) throw new Error('No se puede asignar a un usuario inactivo')
  }

  return prisma.prospecto.update({
    where:   { id: prospectoId },
    data:    { usuarioId },
    include: { usuario: { select: { id: true, nombre: true, correo: true } } },
  })
}


export const resumenProspectos = async () => {
  const ahora      = new Date()
  const inicioMes  = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioSemana = new Date(ahora)
  inicioSemana.setDate(ahora.getDate() - ahora.getDay())

  const [
    total,
    porEstado,
    porTipo,
    estaSemana,
    esteMes,
    sinAsignar,
    recientes,
  ] = await Promise.all([
    prisma.prospecto.count(),
    prisma.prospecto.groupBy({
      by:      ['estado'],
      _count:  { estado: true },
      orderBy: { _count: { estado: 'desc' } },
    }),
    prisma.prospecto.groupBy({
      by:      ['tipoServicio'],
      _count:  { tipoServicio: true },
      orderBy: { _count: { tipoServicio: 'desc' } },
    }),
    prisma.prospecto.count({ where: { creadoEn: { gte: inicioSemana } } }),
    prisma.prospecto.count({ where: { creadoEn: { gte: inicioMes }    } }),
    prisma.prospecto.count({ where: { usuarioId: null, estado: { in: ['NUEVO', 'CONTACTADO'] } } }),
    prisma.prospecto.findMany({
      orderBy: { creadoEn: 'desc' },
      take:    5,
      select:  selectResumido,
    }),
  ])

  const tasaConversion =
    total > 0
      ? Math.round(
          ((porEstado.find(e => e.estado === 'CONVERTIDO')?._count.estado ?? 0) / total) * 100
        )
      : 0

  return {
    total,
    estaSemana,
    esteMes,
    sinAsignar,
    tasaConversion,
    porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count.estado })),
    porTipo:   porTipo.map(t => ({ tipo: t.tipoServicio, cantidad: t._count.tipoServicio })),
    recientes,
  }
}


export const eliminarProspecto = async (id: string) => {
  const prospecto = await buscarOLanzar(id)

  const totalCotizaciones = await prisma.cotizacion.count({ where: { prospectoId: id } })
  if (totalCotizaciones > 0) {
    throw new Error(
      `No se puede eliminar un prospecto con ${totalCotizaciones} cotizacion(es) asociada(s). Eliminalas primero.`
    )
  }

  await prisma.prospecto.delete({ where: { id } })

  return { id: prospecto.id, nombre: prospecto.nombre, correo: prospecto.correo }
}