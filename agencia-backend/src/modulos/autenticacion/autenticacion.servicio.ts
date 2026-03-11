import prisma   from '../../config/baseDatos.js'
import bcrypt    from 'bcryptjs'
import crypto    from 'crypto'
import entorno   from '../../config/entorno.js'
import {
  generarToken,
  generarTokenRefresco,
  verificarTokenRefresco,
} from '../../utilidades/tokens.js'
import {
  enviarBienvenida,
  enviarResetContrasena,
} from '../../config/correo.js'
import {
  DatosRegistro,
  DatosLogin,
  DatosSolicitarReset,
  DatosResetearContrasena,
} from './autenticacion.tipos.js'

export const registrar = async (datos: DatosRegistro) => {
  const existe = await prisma.usuario.findUnique({
    where: { correo: datos.correo },
  })
  if (existe) throw new Error('Ya existe una cuenta con ese correo')

  const hash = await bcrypt.hash(datos.contrasena, entorno.BCRYPT_RONDAS)

  const usuario = await prisma.usuario.create({
    data: {
      nombre:     datos.nombre,
      correo:     datos.correo,
      contrasena: hash,
    },
    select: { id: true, nombre: true, correo: true, rol: true },
  })

  enviarBienvenida({ nombre: usuario.nombre, correo: usuario.correo }).catch(() => {})

  const tokenAcceso   = generarToken({ id: usuario.id, correo: usuario.correo, rol: usuario.rol })
  const tokenRefresco = generarTokenRefresco({ id: usuario.id, correo: usuario.correo, rol: usuario.rol })

  return { usuario, tokenAcceso, tokenRefresco }
}

export const login = async (datos: DatosLogin) => {
  const usuario = await prisma.usuario.findUnique({
    where: { correo: datos.correo },
  })

  if (!usuario) throw new Error('Correo o contraseña incorrectos')

  if (!usuario.activo) {
    throw new Error('Tu cuenta está desactivada. Contacta al administrador.')
  }

  const contrasenaValida = await bcrypt.compare(datos.contrasena, usuario.contrasena)
  if (!contrasenaValida) throw new Error('Correo o contraseña incorrectos')

  const tokenAcceso   = generarToken({ id: usuario.id, correo: usuario.correo, rol: usuario.rol })
  const tokenRefresco = generarTokenRefresco({ id: usuario.id, correo: usuario.correo, rol: usuario.rol })

  return {
    usuario: {
      id:     usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol:    usuario.rol,
    },
    tokenAcceso,
    tokenRefresco,
  }
}

export const obtenerPerfil = async (usuarioId: string) => {
  const usuario = await prisma.usuario.findUnique({
    where:  { id: usuarioId },
    select: {
      id:            true,
      nombre:        true,
      correo:        true,
      rol:           true,
      telefono:      true,
      empresa:       true,
      activo:        true,
      creadoEn:      true,
      actualizadoEn: true,
    },
  })
  if (!usuario) throw new Error('Usuario no encontrado')
  return usuario
}

export const refrescarToken = async (tokenRefresco: string) => {
  const carga = verificarTokenRefresco(tokenRefresco)
  if (!carga) throw new Error('Token de refresco inválido o expirado')

  const usuario = await prisma.usuario.findUnique({
    where:  { id: carga.id },
    select: { id: true, correo: true, rol: true, activo: true },
  })

  if (!usuario)        throw new Error('Usuario no encontrado')
  if (!usuario.activo) throw new Error('Tu cuenta está desactivada.')

  const nuevoToken = generarToken({
    id:     usuario.id,
    correo: usuario.correo,
    rol:    usuario.rol,
  })

  return { tokenAcceso: nuevoToken }
}

export const solicitarReset = async (datos: DatosSolicitarReset) => {
  const usuario = await prisma.usuario.findUnique({
    where: { correo: datos.correo },
  })

  if (!usuario || !usuario.activo) {
    return { mensaje: 'Si el correo existe, recibirás un enlace en breve.' }
  }

  const token         = crypto.randomBytes(32).toString('hex')
  const tokenHash     = crypto.createHash('sha256').update(token).digest('hex')
  const expiracion    = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      tokenReset:        tokenHash,
      tokenResetExpira:  expiracion,
    },
  })

  const urlReset = `${entorno.URL_FRONTEND}/reset-contrasena?token=${token}`

  enviarResetContrasena({
    nombre:   usuario.nombre,
    correo:   usuario.correo,
    urlReset,
  }).catch(() => {})

  return { mensaje: 'Si el correo existe, recibirás un enlace en breve.' }
}

export const resetearContrasena = async (datos: DatosResetearContrasena) => {
  const tokenHash = crypto.createHash('sha256').update(datos.token).digest('hex')

  const usuario = await prisma.usuario.findFirst({
    where: {
      tokenReset:       tokenHash,
      tokenResetExpira: { gt: new Date() }, 
    },
  })

  if (!usuario) {
    throw new Error('El enlace de recuperación es inválido o ha expirado.')
  }

  const hash = await bcrypt.hash(datos.contrasena, entorno.BCRYPT_RONDAS)

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      contrasena:       hash,
      tokenReset:       null,
      tokenResetExpira: null,
    },
  })

  return { mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' }
}