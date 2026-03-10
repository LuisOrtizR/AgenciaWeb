import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './testimonios.controlador.js'

const router = Router()
const admin  = [requerirAutenticacion, requerirRol('ADMIN')]

router.post('/',           controlador.enviar)
router.get( '/destacados', controlador.destacados)

router.get(  '/resumen',   ...admin, controlador.resumen)
router.get(  '/admin',     ...admin, controlador.listarAdmin)
router.get(  '/admin/:id', ...admin, controlador.obtenerPorIdAdmin)
router.post( '/admin',     ...admin, controlador.crear)

router.get(   '/',            controlador.listar)
router.get(   '/:id',         controlador.obtenerPorId)
router.put(   '/:id',         ...admin, controlador.actualizar)
router.patch( '/:id/moderar', ...admin, controlador.moderar)
router.delete('/:id',         ...admin, controlador.eliminar)

export default router