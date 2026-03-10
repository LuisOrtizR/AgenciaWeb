import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './servicios.controlador.js'
const router = Router()
const admin  = [requerirAutenticacion, requerirRol('ADMIN')]

router.get('/slug/:slug', controlador.obtenerPorSlug)
router.get('/',           controlador.listar)

router.get(   '/admin',          ...admin, controlador.listarAdmin)
router.get(   '/:id',            ...admin, controlador.obtenerPorId)
router.post(  '/',               ...admin, controlador.crear)
router.put(   '/:id',            ...admin, controlador.actualizar)
router.patch( '/:id/activar',    ...admin, controlador.activar)
router.patch( '/:id/desactivar', ...admin, controlador.desactivar)
router.delete('/:id',            ...admin, controlador.eliminar)

export default router