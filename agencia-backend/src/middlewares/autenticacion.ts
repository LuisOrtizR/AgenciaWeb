import { Response, NextFunction } from 'express'
import { verificarToken }         from '../utilidades/tokens.js'
import { respuestaError }         from '../utilidades/respuesta.js'
import { SolicitudAutenticada }   from '../tipos.js'
import prisma                     from '../config/baseDatos.js'

export const requerirAutenticacion = async (
  req:  SolicitudAutenticada,
  res:  Response,
  next: NextFunction
): Promise<void> => {
  try {
    const encabezado = req.headers['authorization']

    if (!encabezado?.startsWith('Bearer ')) {
      respuestaError(res, 'Token de acceso requerido', 401)
      return
    }

    const token = encabezado.split(' ')[1]
    if (!token) {
      respuestaError(res, 'Token de acceso requerido', 401)
      return
    }

    const carga = verificarToken(token)
    if (!carga) {
      respuestaError(res, 'Token invalido o expirado. Inicia sesion de nuevo.', 401)
      return
    }

    const usuario = await prisma.usuario.findUnique({
      where:  { id: carga.id },
      select: { id: true, correo: true, nombre: true, rol: true, activo: true },
    })

    if (!usuario) {
      respuestaError(res, 'Usuario no encontrado. El token es invalido.', 401)
      return
    }

    if (!usuario.activo) {
      respuestaError(res, 'Tu cuenta ha sido desactivada. Contacta al administrador.', 403)
      return
    }

    req.usuario = { id: usuario.id, correo: usuario.correo, rol: usuario.rol }
    next()
  } catch {
    respuestaError(res, 'Error interno de autenticacion', 500)
  }
}