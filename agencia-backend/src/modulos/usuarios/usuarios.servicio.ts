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


const camposPublicos = {
  id:            true,
  nombre:        true,
  correo:        true,
  rol:           true,
  telefono:      true,
  empresa:       true,
  activo:        true,
  creadoEn:      true,
  actualizadoEn: true,
} as const

const conteoRelaciones = {
  _count: { select: { prospectos: true, cotizaciones: true, testimonios: true } },
} as const


const buscarOLanzar = async (id: string) => {
  const u = await prisma.usuario.findUnique({ where: { id }, select: { ...camposPublicos, activo: true, rol: true } })
  if (!u) throw new Error('Usuario no encontrado')
  return u
}

const guardarEstado = (id: string, activo: boolean) =>
  prisma.usuario.update({ where: { id }, data: { activo }, select: camposPublicos })

const protegerAutoAccion = (id: string, adminId: string, accion: string) => {
  if (id === adminId) throw new Error(`No puedes ${accion} tu propia cuenta`)
}

const hashear = (contrasena: string) => bcrypt.hash(contrasena, entorno.BCRYPT_RONDAS)


export const obtenerPerfil = async (usuarioId: string) => {
  const u = await prisma.usuario.findUnique({
    where:  { id: usuarioId },
    select: { ...camposPublicos, ...conteoRelaciones },
  })
  if (!u) throw new Error('Usuario no encontrado')
  return u
}

export const actualizarPerfil = async (usuarioId: string, datos: DatosActualizarPerfil) => {
  await buscarOLanzar(usuarioId)
  return prisma.usuario.update({ where: { id: usuarioId }, data: datos, select: camposPublicos })
}

export const cambiarContrasena = async (usuarioId: string, datos: DatosCambiarContrasena) => {
  const u = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { contrasena: true } })
  if (!u) throw new Error('Usuario no encontrado')

  const valida = await bcrypt.compare(datos.contrasenaActual, u.contrasena)
  if (!valida) throw new Error('La contrasena actual es incorrecta')

  await prisma.usuario.update({ where: { id: usuarioId }, data: { contrasena: await hashear(datos.contrasenaNueva) } })
  return { mensaje: 'Contrasena actualizada correctamente' }
}


export const listarUsuarios = async (filtros: FiltrosUsuario) => {
  const { pagina, porPagina, busqueda, rol, activo } = filtros
  const donde = {
    ...(rol    && { rol }),
    ...(activo !== undefined && { activo }),
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
      select:  { ...camposPublicos, ...conteoRelaciones },
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


export const obtenerUsuarioPorId = async (id: string) => {
  const u = await prisma.usuario.findUnique({
    where:  { id },
    select: {
      ...camposPublicos,
      ...conteoRelaciones,
      prospectos: {
        orderBy: { creadoEn: 'desc' }, take: 5,
        select:  { id: true, nombre: true, tipoServicio: true, estado: true, creadoEn: true },
      },
      cotizaciones: {
        orderBy: { creadoEn: 'desc' }, take: 5,
        select:  { id: true, precioTotal: true, estado: true, creadoEn: true },
      },
      testimonios: {
        orderBy: { creadoEn: 'desc' }, take: 5,
        select:  { id: true, contenido: true, calificacion: true, visible: true, creadoEn: true },
      },
    },
  })
  if (!u) throw new Error('Usuario no encontrado')
  return u
}


export const crearUsuario = async (datos: DatosCrearUsuario) => {
  const correo = datos.correo.toLowerCase().trim()
  const existe = await prisma.usuario.findUnique({ where: { correo }, select: { id: true } })
  if (existe) throw new Error('Ya existe un usuario con ese correo')

  return prisma.usuario.create({
    data: {
      nombre:     datos.nombre,
      correo,
      contrasena: await hashear(datos.contrasena),
      rol:        datos.rol,
      telefono:   datos.telefono ?? null,
      empresa:    datos.empresa  ?? null,
    },
    select: camposPublicos,
  })
}


export const actualizarUsuario = async (id: string, datos: DatosActualizarUsuario) => {
  await buscarOLanzar(id)
  return prisma.usuario.update({ where: { id }, data: datos, select: camposPublicos })
}


export const activarUsuario = async (id: string) => {
  const u = await buscarOLanzar(id)
  if (u.activo) throw new Error('El usuario ya esta activo')
  return guardarEstado(id, true)
}

export const desactivarUsuario = async (id: string, adminId: string) => {
  protegerAutoAccion(id, adminId, 'desactivar')
  const u = await buscarOLanzar(id)
  if (!u.activo) throw new Error('El usuario ya esta desactivado')
  return guardarEstado(id, false)
}


export const cambiarRol = async (id: string, rol: 'ADMIN' | 'CLIENTE', adminId: string) => {
  protegerAutoAccion(id, adminId, 'cambiar el rol de')
  const u = await buscarOLanzar(id)
  if (u.rol === rol) throw new Error(`El usuario ya tiene el rol ${rol}`)
  return prisma.usuario.update({ where: { id }, data: { rol }, select: camposPublicos })
}


export const eliminarUsuario = async (id: string, adminId: string) => {
  protegerAutoAccion(id, adminId, 'eliminar')
  await buscarOLanzar(id)

  const [prospectos, cotizaciones, testimonios] = await Promise.all([
    prisma.prospecto.count({  where: { usuarioId: id } }),
    prisma.cotizacion.count({ where: { usuarioId: id } }),
    prisma.testimonio.count({ where: { usuarioId: id } }),
  ])

  if (prospectos > 0 || cotizaciones > 0 || testimonios > 0) {
    throw new Error(
      `El usuario tiene registros asociados: ${prospectos} prospecto(s), ${cotizaciones} cotizacion(es), ${testimonios} testimonio(s). Desactivalo en su lugar.`
    )
  }

  await prisma.usuario.delete({ where: { id } })
  return { id, eliminado: true }
}


export const resumenUsuarios = async () => {
  const ahora     = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const [total, activos, admins, esteMes, recientes] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { activo: true } }),
    prisma.usuario.count({ where: { rol: 'ADMIN'  } }),
    prisma.usuario.count({ where: { creadoEn: { gte: inicioMes } } }),
    prisma.usuario.findMany({
      orderBy: { creadoEn: 'desc' },
      take:    5,
      select:  { id: true, nombre: true, correo: true, rol: true, activo: true, creadoEn: true },
    }),
  ])

  return {
    total,
    activos,
    inactivos: total - activos,
    admins,
    clientes:  total - admins,
    esteMes,
    recientes,
  }
}