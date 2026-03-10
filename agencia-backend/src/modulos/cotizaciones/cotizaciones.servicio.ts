import prisma from '../../config/baseDatos.js'
import { enviarCotizacion } from '../../config/correo.js'
import {
  DatosCrearCotizacion,
  DatosActualizarCotizacion,
  DatosActualizarEstadoCotizacion,
  FiltrosCotizacion,
} from './cotizaciones.tipos.js'

/**
 * Capa de lógica de negocio para cotizaciones.
 * Cuando el estado cambia a ENVIADA → se envía correo al prospecto.
 * Cuando el estado cambia a ACEPTADA → prospecto pasa a CONVERTIDO.
 * Cuando el estado cambia a RECHAZADA → prospecto pasa a PERDIDO.
 */

const incluirRelaciones = {
  prospecto: true,
  servicio:  { select: { id: true, nombre: true, slug: true } },
  usuario:   { select: { id: true, nombre: true, correo: true } },
}

// ─── Crear cotización — admin ─────────────────────────────────────────────────
export const crearCotizacion = async (datos: DatosCrearCotizacion, usuarioId?: string) => {
  const prospecto = await prisma.prospecto.findUnique({ where: { id: datos.prospectoId } })
  if (!prospecto) throw new Error('El prospecto indicado no existe')

  const servicio = await prisma.servicio.findUnique({ where: { id: datos.servicioId } })
  if (!servicio) throw new Error('El servicio indicado no existe')

  const cotizacion = await prisma.cotizacion.create({
    data: {
      prospectoId: datos.prospectoId,
      servicioId:  datos.servicioId,
      extras:      datos.extras,
      precioTotal: datos.precioTotal,
      notas:       datos.notas,
      usuarioId:   usuarioId ?? null,
    },
    include: incluirRelaciones,
  })

  // Si el prospecto estaba en NUEVO → pasa a CONTACTADO
  if (prospecto.estado === 'NUEVO') {
    await prisma.prospecto.update({
      where: { id: datos.prospectoId },
      data:  { estado: 'CONTACTADO' },
    })
  }

  return cotizacion
}

// ─── Listar con filtros y paginación — admin ──────────────────────────────────
export const listarCotizaciones = async (filtros: FiltrosCotizacion) => {
  const { pagina, porPagina, busqueda, estado, prospectoId, servicioId } = filtros

  const donde = {
    ...(estado      && { estado }),
    ...(prospectoId && { prospectoId }),
    ...(servicioId  && { servicioId }),
    ...(busqueda    && {
      OR: [
        { prospecto: { nombre: { contains: busqueda, mode: 'insensitive' as const } } },
        { prospecto: { correo: { contains: busqueda, mode: 'insensitive' as const } } },
        { notas:     { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [datos, total] = await Promise.all([
    prisma.cotizacion.findMany({
      where:   donde,
      orderBy: { creadoEn: 'desc' },
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
      include: incluirRelaciones,
    }),
    prisma.cotizacion.count({ where: donde }),
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

// ─── Obtener por ID — admin ───────────────────────────────────────────────────
export const obtenerCotizacionPorId = async (id: string) => {
  const cotizacion = await prisma.cotizacion.findUnique({
    where:   { id },
    include: incluirRelaciones,
  })
  if (!cotizacion) throw new Error('Cotización no encontrada')
  return cotizacion
}

// ─── Cotizaciones de un prospecto — admin ─────────────────────────────────────
export const cotizacionesPorProspecto = async (prospectoId: string) => {
  const prospecto = await prisma.prospecto.findUnique({ where: { id: prospectoId } })
  if (!prospecto) throw new Error('Prospecto no encontrado')

  return prisma.cotizacion.findMany({
    where:   { prospectoId },
    orderBy: { creadoEn: 'desc' },
    include: incluirRelaciones,
  })
}

// ─── Actualizar cotización — admin ────────────────────────────────────────────
export const actualizarCotizacion = async (id: string, datos: DatosActualizarCotizacion) => {
  const cotizacion = await obtenerCotizacionPorId(id)

  if (cotizacion.estado === 'ACEPTADA' || cotizacion.estado === 'RECHAZADA') {
    throw new Error('No se puede editar una cotización ya cerrada.')
  }

  return prisma.cotizacion.update({
    where:   { id },
    data:    datos,
    include: incluirRelaciones,
  })
}

// ─── Actualizar estado — admin ────────────────────────────────────────────────
export const actualizarEstado = async (id: string, datos: DatosActualizarEstadoCotizacion) => {
  const cotizacion = await obtenerCotizacionPorId(id)

  const actualizada = await prisma.cotizacion.update({
    where:   { id },
    data:    { estado: datos.estado, notas: datos.notas },
    include: incluirRelaciones,
  })

  // Al marcar ENVIADA → enviar correo al prospecto con los detalles
  if (datos.estado === 'ENVIADA') {
    const extras = Array.isArray(cotizacion.extras)
      ? (cotizacion.extras as string[])
      : []

    enviarCotizacion({
      nombreCliente: cotizacion.prospecto.nombre,
      correoCliente: cotizacion.prospecto.correo,
      servicio:      actualizada.servicio.nombre,
      extras,
      precioTotal:   cotizacion.precioTotal,
      notas:         datos.notas,
    }).catch(() => {})
  }

  // Flujo automático de estados del prospecto
  if (datos.estado === 'ACEPTADA') {
    await prisma.prospecto.update({
      where: { id: cotizacion.prospectoId },
      data:  { estado: 'CONVERTIDO' },
    })
  }

  if (datos.estado === 'RECHAZADA') {
    await prisma.prospecto.update({
      where: { id: cotizacion.prospectoId },
      data:  { estado: 'PERDIDO' },
    })
  }

  return actualizada
}

// ─── Duplicar cotización — admin ──────────────────────────────────────────────
export const duplicarCotizacion = async (id: string, usuarioId?: string) => {
  const original = await obtenerCotizacionPorId(id)

  return prisma.cotizacion.create({
    data: {
      prospectoId: original.prospectoId,
      servicioId:  original.servicioId,
      extras:      original.extras as string[],
      precioTotal: original.precioTotal,
      notas:       original.notas ? `[Copia] ${original.notas}` : '[Copia de cotización anterior]',
      estado:      'PENDIENTE',
      usuarioId:   usuarioId ?? null,
    },
    include: incluirRelaciones,
  })
}

// ─── Resumen financiero — admin ───────────────────────────────────────────────
export const resumenCotizaciones = async () => {
  const [total, porEstado, montoTotal, montoAceptado] = await Promise.all([
    prisma.cotizacion.count(),
    prisma.cotizacion.groupBy({
      by:      ['estado'],
      _count:  { estado: true },
      _sum:    { precioTotal: true },
      orderBy: { _count: { estado: 'desc' } },
    }),
    prisma.cotizacion.aggregate({ _sum: { precioTotal: true } }),
    prisma.cotizacion.aggregate({
      where: { estado: 'ACEPTADA' },
      _sum:  { precioTotal: true },
    }),
  ])

  return {
    total,
    montoTotalCotizado: montoTotal._sum.precioTotal ?? 0,
    montoTotalAceptado: montoAceptado._sum.precioTotal ?? 0,
    porEstado: porEstado.map(e => ({
      estado:   e.estado,
      cantidad: e._count.estado,
      monto:    e._sum.precioTotal ?? 0,
    })),
  }
}

// ─── Eliminar — admin ─────────────────────────────────────────────────────────
export const eliminarCotizacion = async (id: string) => {
  const cotizacion = await obtenerCotizacionPorId(id)

  if (cotizacion.estado === 'ACEPTADA') {
    throw new Error('No se puede eliminar una cotización aceptada.')
  }

  await prisma.cotizacion.delete({ where: { id } })
  return cotizacion
}

// ─── Mis cotizaciones — cliente ───────────────────────────────────────────────
export const misCotizaciones = async (correoUsuario: string, usuarioId: string) => {
  const prospectos = await prisma.prospecto.findMany({
    where: {
      OR: [
        { correo:    correoUsuario },
        { usuarioId: usuarioId    },
      ],
    },
    select: { id: true, correo: true, usuarioId: true },  // ← agregar correo y usuarioId
  })

  console.log('Prospectos encontrados:', prospectos)
  const ids = prospectos.map(p => p.id)
  if (ids.length === 0) return []

  return prisma.cotizacion.findMany({
    where:   { prospectoId: { in: ids } },
    orderBy: { creadoEn: 'desc' },
    include: incluirRelaciones,
  })
}

// ─── Responder cotización — cliente (ACEPTAR o RECHAZAR) ─────────────────────
export const responderCotizacion = async (
  id:             string,
  correoUsuario:  string,
  estado:         'ACEPTADA' | 'RECHAZADA'
) => {
  const cotizacion = await obtenerCotizacionPorId(id)

  if (cotizacion.prospecto.correo !== correoUsuario) {
    throw new Error('No tienes permiso para responder esta cotización')
  }

  if (cotizacion.estado !== 'ENVIADA') {
    throw new Error('Solo puedes responder cotizaciones en estado ENVIADA')
  }

  const actualizada = await prisma.cotizacion.update({
    where:   { id },
    data:    { estado },
    include: incluirRelaciones,
  })

  if (estado === 'ACEPTADA') {
    await prisma.prospecto.update({
      where: { id: cotizacion.prospectoId },
      data:  { estado: 'CONVERTIDO' },
    })
  }

  if (estado === 'RECHAZADA') {
    await prisma.prospecto.update({
      where: { id: cotizacion.prospectoId },
      data:  { estado: 'PERDIDO' },
    })
  }

  return actualizada
}