import { Response, NextFunction } from 'express'
import { respuestaError }         from '../utilidades/respuesta.js'
import { SolicitudAutenticada }   from '../tipos.js'

/**
 * Middleware de autorización por rol.
 * Úsalo después de requerirAutenticacion.
 *
 * Ejemplo:
 *   router.get('/ruta', requerirAutenticacion, requerirRol('ADMIN'), controlador)
 */
export const requerirRol = (...rolesPermitidos: string[]) => {
  return (req: SolicitudAutenticada, res: Response, next: NextFunction): void => {
    const rol = req.usuario?.rol

    if (!rol) {
      respuestaError(res, 'No autenticado', 401)
      return
    }

    if (!rolesPermitidos.includes(rol)) {
      respuestaError(
        res,
        `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`,
        403
      )
      return
    }

    next()
  }
}