import prisma   from '../../config/baseDatos.js'
import bcrypt    from 'bcryptjs'
import entorno   from '../../config/entorno.js'
import {
  generarToken,
  generarTokenRefresco,
  verificarTokenRefresco,
} from '../../utilidades/tokens.js'
import { enviarBienvenida } from '../../config/correo.js'
import {
  DatosRegistro,
  DatosLogin,
} from './autenticacion.tipos.js'

/**
 * Capa de lógica de negocio para autenticación.
 */

// ─── Registrar nuevo usuario ──────────────────────────────────────────────────
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

  // Correo de bienvenida — no bloquea si falla
  enviarBienvenida({ nombre: usuario.nombre, correo: usuario.correo }).catch(() => {})

  const tokenAcceso   = generarToken({ id: usuario.id, correo: usuario.correo, rol: usuario.rol })
  const tokenRefresco = generarTokenRefresco({ id: usuario.id, correo: usuario.correo, rol: usuario.rol })

  return { usuario, tokenAcceso, tokenRefresco }
}

// ─── Login ────────────────────────────────────────────────────────────────────
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

// ─── Obtener perfil ───────────────────────────────────────────────────────────
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

// ─── Refrescar token ──────────────────────────────────────────────────────────
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