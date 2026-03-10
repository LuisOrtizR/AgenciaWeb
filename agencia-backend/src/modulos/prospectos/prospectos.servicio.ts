import prisma from '../../config/baseDatos.js'
import { notificarNuevoProspecto, confirmarRecepcionProspecto } from '../../config/correo.js'
import {
  DatosCrearProspecto,
  DatosActualizarProspecto,
  DatosActualizarEstadoProspecto,
  FiltrosProspecto,
} from './prospectos.tipos.js'

/**
 * Capa de lógica de negocio para prospectos.
 *
 * Al crear:
 *   → Si el correo coincide con un usuario registrado, se vincula automáticamente (usuarioId).
 *   → Envía correo al admin y confirmación al cliente.
 *
 * Al cambiar estado → lógica automática de CRM.
 */

// ─── Crear prospecto — público (formulario de contacto) ───────────────────────
export const crearProspecto = async (datos: DatosCrearProspecto) => {

  // Buscar si existe un usuario registrado con ese correo
  // Así el cliente puede ver sus cotizaciones aunque no esté logueado al enviar
  const usuarioVinculado = await prisma.usuario.findUnique({
    where:  { correo: datos.correo.toLowerCase().trim() },
    select: { id: true },
  })

  const prospecto = await prisma.prospecto.create({
    data: {
      nombre:       datos.nombre,
      correo:       datos.correo.toLowerCase().trim(),
      telefono:     datos.telefono   ?? null,
      tipoServicio: datos.tipoServicio,
      mensaje:      datos.mensaje    ?? null,
      presupuesto:  datos.presupuesto ?? null,
      fuente:       datos.fuente     ?? null,
      usuarioId:    usuarioVinculado?.id ?? null,  // ← vínculo automático
    },
  })

  // Notificaciones por correo — no bloquean si fallan
  notificarNuevoProspecto({
    nombre:       datos.nombre,
    correo:       datos.correo,
    telefono:     datos.telefono     ?? null,
    tipoServicio: datos.tipoServicio,
    mensaje:      datos.mensaje      ?? null,
    presupuesto:  datos.presupuesto  ?? null,
    fuente:       datos.fuente       ?? null,
  }).catch(() => {})

  confirmarRecepcionProspecto({
    nombre:       datos.nombre,
    correo:       datos.correo,
    telefono:     datos.telefono     ?? null,
    tipoServicio: datos.tipoServicio,
    mensaje:      datos.mensaje      ?? null,
    presupuesto:  datos.presupuesto  ?? null,
    fuente:       datos.fuente       ?? null,
  }).catch(() => {})

  return prospecto
}

// ─── Listar con filtros y paginación — admin ──────────────────────────────────
export const listarProspectos = async (filtros: FiltrosProspecto) => {
  const { pagina, porPagina, busqueda, estado, tipoServicio } = filtros

  const donde = {
    ...(estado       && { estado }),
    ...(tipoServicio && { tipoServicio }),
    ...(busqueda     && {
      OR: [
        { nombre:  { contains: busqueda, mode: 'insensitive' as const } },
        { correo:  { contains: busqueda, mode: 'insensitive' as const } },
        { mensaje: { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [datos, total] = await Promise.all([
    prisma.prospecto.findMany({
      where:   donde,
      orderBy: { creadoEn: 'desc' },
      skip:    (pagina - 1) * porPagina,
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

// ─── Obtener por ID — admin ───────────────────────────────────────────────────
export const obtenerProspectoPorId = async (id: string) => {
  const prospecto = await prisma.prospecto.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nombre: true, correo: true } },
      cotizaciones: {
        include: { servicio: { select: { id: true, nombre: true } } },
        orderBy: { creadoEn: 'desc' },
      },
    },
  })
  if (!prospecto) throw new Error('Prospecto no encontrado')
  return prospecto
}

// ─── Actualizar datos — admin ─────────────────────────────────────────────────
export const actualizarProspecto = async (id: string, datos: DatosActualizarProspecto) => {
  await obtenerProspectoPorId(id)
  return prisma.prospecto.update({
    where:   { id },
    data:    datos,
    include: { usuario: { select: { id: true, nombre: true } } },
  })
}

// ─── Actualizar estado — admin ────────────────────────────────────────────────
export const actualizarEstado = async (id: string, datos: DatosActualizarEstadoProspecto) => {
  await obtenerProspectoPorId(id)
  return prisma.prospecto.update({
    where: { id },
    data:  { estado: datos.estado, notas: datos.notas },
  })
}

// ─── Asignar usuario manualmente — admin ──────────────────────────────────────
export const asignarUsuario = async (prospectoId: string, usuarioId: string | null) => {
  await obtenerProspectoPorId(prospectoId)

  if (usuarioId) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) throw new Error('Usuario no encontrado')
  }

  return prisma.prospecto.update({
    where:   { id: prospectoId },
    data:    { usuarioId },
    include: { usuario: { select: { id: true, nombre: true } } },
  })
}

// ─── Resumen para dashboard — admin ──────────────────────────────────────────
export const resumenProspectos = async () => {
  const [total, porEstado, porTipo] = await Promise.all([
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
  ])

  const recientes = await prisma.prospecto.findMany({
    orderBy: { creadoEn: 'desc' },
    take:    5,
    select: {
      id:           true,
      nombre:       true,
      correo:       true,
      tipoServicio: true,
      estado:       true,
      creadoEn:     true,
    },
  })

  return {
    total,
    porEstado: porEstado.map(e => ({
      estado:   e.estado,
      cantidad: e._count.estado,
    })),
    porTipo: porTipo.map(t => ({
      tipo:     t.tipoServicio,
      cantidad: t._count.tipoServicio,
    })),
    recientes,
  }
}

// ─── Eliminar — admin ─────────────────────────────────────────────────────────
export const eliminarProspecto = async (id: string) => {
  const prospecto = await obtenerProspectoPorId(id)

  const cotizaciones = await prisma.cotizacion.count({ where: { prospectoId: id } })
  if (cotizaciones > 0) {
    throw new Error(
      `No se puede eliminar un prospecto con ${cotizaciones} cotización(es) asociada(s). Elimínalas primero.`
    )
  }

  await prisma.prospecto.delete({ where: { id } })
  return prospecto
}