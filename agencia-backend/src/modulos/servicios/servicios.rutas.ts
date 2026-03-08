import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './servicios.controlador.js'

const router = Router()

router.get('/slug/:slug', controlador.obtenerPorSlug)
router.get('/',           controlador.listar)

router.get(   '/admin',          requerirAutenticacion, requerirRol('ADMIN'), controlador.listarAdmin)
router.get(   '/:id',            requerirAutenticacion, requerirRol('ADMIN'), controlador.obtenerPorId)
router.post(  '/',               requerirAutenticacion, requerirRol('ADMIN'), controlador.crear)
router.put(   '/:id',            requerirAutenticacion, requerirRol('ADMIN'), controlador.actualizar)
router.patch( '/:id/activar',    requerirAutenticacion, requerirRol('ADMIN'), controlador.activar)
router.patch( '/:id/desactivar', requerirAutenticacion, requerirRol('ADMIN'), controlador.desactivar)
router.delete('/:id',            requerirAutenticacion, requerirRol('ADMIN'), controlador.eliminar)

export default router