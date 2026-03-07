import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import { subirImagenUnica }      from '../../middlewares/imagenes.js'
import * as controlador          from './imagenes.controlador.js'

/**
 * Rutas de imágenes — todas requieren ADMIN.
 *
 * POST   /api/imagenes/proyectos/:id
 *   Body: multipart/form-data  campo "imagen" (jpg|png|webp, máx 5 MB)
 *
 * DELETE /api/imagenes/proyectos/:id
 */

const router = Router()

router.post(
  '/proyectos/:id',
  requerirAutenticacion,
  requerirRol('ADMIN'),
  subirImagenUnica,
  controlador.subirImagenProyecto
)

router.delete(
  '/proyectos/:id',
  requerirAutenticacion,
  requerirRol('ADMIN'),
  controlador.eliminarImagenProyecto
)

export default router