import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './prospectos.controlador.js'

const router = Router()
router.post('/', controlador.crear)
const admin = [requerirAutenticacion, requerirRol('ADMIN')]

router.get(   '/resumen',        ...admin, controlador.resumen)
router.get(   '/',               ...admin, controlador.listar)
router.get(   '/:id',            ...admin, controlador.obtenerPorId)
router.put(   '/:id',            ...admin, controlador.actualizar)
router.patch( '/:id/estado',     ...admin, controlador.actualizarEstado)
router.patch( '/:id/asignar',    ...admin, controlador.asignar)
router.delete('/:id',            ...admin, controlador.eliminar)

export default router