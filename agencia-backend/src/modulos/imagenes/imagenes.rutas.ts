import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import { subirImagenUnica }      from '../../middlewares/imagenes.js'
import * as controlador          from './imagenes.controlador.js'

const router = Router()

const guardias = [requerirAutenticacion, requerirRol('ADMIN')]

router.post(
  '/proyectos/:id',
  ...guardias,
  subirImagenUnica,
  controlador.subirImagenProyecto
)

router.delete(
  '/proyectos/:id',
  ...guardias,
  controlador.eliminarImagenProyecto
)

export default router