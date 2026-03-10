import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './usuarios.controlador.js'

const router = Router()
const admin  = [requerirRol('ADMIN')]

router.use(requerirAutenticacion)

router.get(  '/perfil',     controlador.perfil)
router.put(  '/perfil',     controlador.actualizarPerfil)
router.patch('/contrasena', controlador.cambiarContrasena)

router.get(   '/resumen',        ...admin, controlador.resumen)
router.get(   '/',               ...admin, controlador.listar)
router.get(   '/:id',            ...admin, controlador.obtenerPorId)
router.post(  '/',               ...admin, controlador.crear)
router.put(   '/:id',            ...admin, controlador.actualizar)
router.patch( '/:id/activar',    ...admin, controlador.activar)
router.patch( '/:id/desactivar', ...admin, controlador.desactivar)
router.patch( '/:id/rol',        ...admin, controlador.cambiarRol)
router.delete('/:id',            ...admin, controlador.eliminar)

export default router