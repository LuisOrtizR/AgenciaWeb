import { Response, NextFunction } from 'express'
import { verificarToken }         from '../utilidades/tokens.js'
import { respuestaError }         from '../utilidades/respuesta.js'
import { SolicitudAutenticada }   from '../tipos.js'
import prisma                     from '../config/baseDatos.js'

/**
 * Middleware de autenticación.
 * 1. Verifica que el encabezado Authorization tenga formato Bearer
 * 2. Verifica que el JWT sea válido y no haya expirado
 * 3. Verifica que el usuario exista en la base de datos
 * 4. Verifica que el usuario esté activo (activo = true)
 *
 * Si pasa todo, inyecta req.usuario con datos frescos de la BD.
 */
export const requerirAutenticacion = async (
  req:  SolicitudAutenticada,
  res:  Response,
  next: NextFunction
): Promise<void> => {
  try {
    const encabezado = req.headers['authorization']

    if (!encabezado || !encabezado.startsWith('Bearer ')) {
      respuestaError(res, 'Token de acceso requerido', 401)
      return
    }

    const token = encabezado.split(' ')[1]
    if (!token) {
      respuestaError(res, 'Token de acceso requerido', 401)
      return
    }

    // Verificar firma y expiración del JWT
    const carga = verificarToken(token)
    if (!carga) {
      respuestaError(res, 'Token inválido o expirado. Inicia sesión de nuevo.', 401)
      return
    }

    // Consultar siempre la BD para tener datos frescos
    // Así si el admin desactiva a un usuario, aplica de inmediato
    const usuario = await prisma.usuario.findUnique({
      where:  { id: carga.id },
      select: { id: true, correo: true, nombre: true, rol: true, activo: true },
    })

    if (!usuario) {
      respuestaError(res, 'Usuario no encontrado. El token es inválido.', 401)
      return
    }

    // Verificar que la cuenta esté activa
    if (!usuario.activo) {
      respuestaError(
        res,
        'Tu cuenta ha sido desactivada. Contacta al administrador.',
        403
      )
      return
    }

    req.usuario = {
      id:     usuario.id,
      correo: usuario.correo,
      rol:    usuario.rol,
    }

    next()
  } catch (error) {
    respuestaError(res, 'Error interno de autenticación', 500)
  }
}