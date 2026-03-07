import prisma  from '../../config/baseDatos.js'
import bcrypt  from 'bcryptjs'
import entorno from '../../config/entorno.js'
import {
  DatosActualizarPerfil,
  DatosCambiarContrasena,
  DatosCrearUsuario,
  DatosActualizarUsuario,
  FiltrosUsuario,
} from './usuarios.tipos.js'

/**
 * Capa de lógica de negocio para usuarios.
 * Propio:   ver perfil, actualizar perfil, cambiar contraseña
 * ADMIN:    listar, crear, actualizar, activar, desactivar, eliminar, resumen
 */

// ─── Campos seguros — nunca devolver contraseña ───────────────────────────────
const camposPublicos = {
  id:           true,
  nombre:       true,
  correo:       true,
  rol:          true,
  telefono:     true,
  empresa:      true,
  activo:       true,
  creadoEn:     true,
  actualizadoEn: true,
}

// ─── Ver perfil propio ────────────────────────────────────────────────────────
export const obtenerPerfil = async (usuarioId: string) => {
  const usuario = await prisma.usuario.findUnique({
    where:  { id: usuarioId },
    select: {
      ...camposPublicos,
      _count: {
        select: {
          prospectos:   true,
          cotizaciones: true,
          testimonios:  true,
        },
      },
    },
  })
  if (!usuario) throw new Error('Usuario no encontrado')
  return usuario
}

// ─── Actualizar perfil propio ─────────────────────────────────────────────────
export const actualizarPerfil = async (usuarioId: string, datos: DatosActualizarPerfil) => {
  await obtenerPerfil(usuarioId)

  return prisma.usuario.update({
    where:  { id: usuarioId },
    data:   datos,
    select: camposPublicos,
  })
}

// ─── Cambiar contraseña propia ────────────────────────────────────────────────
export const cambiarContrasena = async (usuarioId: string, datos: DatosCambiarContrasena) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
  })
  if (!usuario) throw new Error('Usuario no encontrado')

  const contrasenaValida = await bcrypt.compare(datos.contrasenaActual, usuario.contrasena)
  if (!contrasenaValida) throw new Error('La contraseña actual es incorrecta')

  const hash = await bcrypt.hash(datos.contrasenaNueva, entorno.BCRYPT_RONDAS)

  await prisma.usuario.update({
    where: { id: usuarioId },
    data:  { contrasena: hash },
  })

  return { mensaje: 'Contraseña actualizada exitosamente' }
}

// ─── Listar usuarios — solo ADMIN ────────────────────────────────────────────
export const listarUsuarios = async (filtros: FiltrosUsuario) => {
  const { pagina, porPagina, busqueda, rol, activo } = filtros

  const donde = {
    ...(rol    && { rol }),
    ...(activo !== undefined && { activo: activo === 'true' }),
    ...(busqueda && {
      OR: [
        { nombre:  { contains: busqueda, mode: 'insensitive' as const } },
        { correo:  { contains: busqueda, mode: 'insensitive' as const } },
        { empresa: { contains: busqueda, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [datos, total] = await Promise.all([
    prisma.usuario.findMany({
      where:   donde,
      orderBy: { creadoEn: 'desc' },
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
      select: {
        ...camposPublicos,
        _count: {
          select: {
            prospectos:   true,
            cotizaciones: true,
            testimonios:  true,
          },
        },
      },
    }),
    prisma.usuario.count({ where: donde }),
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

// ─── Obtener usuario por id — solo ADMIN ─────────────────────────────────────
export const obtenerUsuarioPorId = async (id: string) => {
  const usuario = await prisma.usuario.findUnique({
    where:  { id },
    select: {
      ...camposPublicos,
      prospectos: {
        orderBy: { creadoEn: 'desc' },
        take:    5,
        select:  { id: true, nombre: true, tipoServicio: true, estado: true, creadoEn: true },
      },
      cotizaciones: {
        orderBy: { creadoEn: 'desc' },
        take:    5,
        select:  { id: true, precioTotal: true, estado: true, creadoEn: true },
      },
      testimonios: {
        orderBy: { creadoEn: 'desc' },
        take:    5,
        select:  { id: true, contenido: true, calificacion: true, visible: true, creadoEn: true },
      },
      _count: {
        select: {
          prospectos:   true,
          cotizaciones: true,
          testimonios:  true,
        },
      },
    },
  })
  if (!usuario) throw new Error('Usuario no encontrado')
  return usuario
}

// ─── Crear usuario — solo ADMIN ──────────────────────────────────────────────
export const crearUsuario = async (datos: DatosCrearUsuario) => {
  const existente = await prisma.usuario.findUnique({
    where: { correo: datos.correo },
  })
  if (existente) throw new Error('Ya existe un usuario con ese correo')

  const hash = await bcrypt.hash(datos.contrasena, entorno.BCRYPT_RONDAS)

  return prisma.usuario.create({
    data: {
      nombre:    datos.nombre,
      correo:    datos.correo,
      contrasena: hash,
      rol:       datos.rol,
      telefono:  datos.telefono,
      empresa:   datos.empresa,
    },
    select: camposPublicos,
  })
}

// ─── Actualizar usuario — solo ADMIN ─────────────────────────────────────────
export const actualizarUsuario = async (id: string, datos: DatosActualizarUsuario) => {
  await obtenerUsuarioPorId(id)

  return prisma.usuario.update({
    where:  { id },
    data:   datos,
    select: camposPublicos,
  })
}

// ─── Activar usuario — solo ADMIN ────────────────────────────────────────────
export const activarUsuario = async (id: string) => {
  await obtenerUsuarioPorId(id)
  return prisma.usuario.update({
    where:  { id },
    data:   { activo: true },
    select: camposPublicos,
  })
}

// ─── Desactivar usuario — solo ADMIN ─────────────────────────────────────────
export const desactivarUsuario = async (id: string, adminId: string) => {
  if (id === adminId) throw new Error('No puedes desactivar tu propia cuenta')

  const usuario = await obtenerUsuarioPorId(id)
  if (!usuario.activo) throw new Error('El usuario ya está desactivado')

  return prisma.usuario.update({
    where:  { id },
    data:   { activo: false },
    select: camposPublicos,
  })
}

// ─── Cambiar rol — solo ADMIN ─────────────────────────────────────────────────
export const cambiarRol = async (id: string, rol: 'ADMIN' | 'CLIENTE', adminId: string) => {
  if (id === adminId) throw new Error('No puedes cambiar tu propio rol')

  await obtenerUsuarioPorId(id)

  return prisma.usuario.update({
    where:  { id },
    data:   { rol },
    select: camposPublicos,
  })
}

// ─── Eliminar usuario — solo ADMIN ───────────────────────────────────────────
export const eliminarUsuario = async (id: string, adminId: string) => {
  if (id === adminId) throw new Error('No puedes eliminar tu propia cuenta')

  const usuario = await obtenerUsuarioPorId(id)

  // Verificar que no tenga registros vinculados
  const [prospectos, cotizaciones, testimonios] = await Promise.all([
    prisma.prospecto.count({   where: { usuarioId: id } }),
    prisma.cotizacion.count({  where: { usuarioId: id } }),
    prisma.testimonio.count({  where: { usuarioId: id } }),
  ])

  if (prospectos > 0 || cotizaciones > 0 || testimonios > 0) {
    throw new Error(
      `No se puede eliminar el usuario porque tiene registros asociados: ${prospectos} prospecto(s), ${cotizaciones} cotización(es), ${testimonios} testimonio(s). Desactívalo en su lugar.`
    )
  }

  await prisma.usuario.delete({ where: { id } })
  return usuario
}

// ─── Resumen para dashboard — solo ADMIN ─────────────────────────────────────
export const resumenUsuarios = async () => {
  const [total, activos, inactivos, admins, clientes] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { activo: true  } }),
    prisma.usuario.count({ where: { activo: false } }),
    prisma.usuario.count({ where: { rol: 'ADMIN'  } }),
    prisma.usuario.count({ where: { rol: 'CLIENTE'} }),
  ])

  // Últimos 5 registrados
  const recientes = await prisma.usuario.findMany({
    orderBy: { creadoEn: 'desc' },
    take:    5,
    select:  { id: true, nombre: true, correo: true, rol: true, creadoEn: true },
  })

  return { total, activos, inactivos, admins, clientes, recientes }
}