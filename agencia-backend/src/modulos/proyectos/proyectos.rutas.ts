import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './proyectos.controlador.js'

const router = Router()

const admin = [requerirAutenticacion, requerirRol('ADMIN')]

router.get('/destacados',  controlador.destacados)
router.get('/tecnologias', controlador.tecnologias)
router.get('/slug/:slug',  controlador.obtenerPorSlug)
router.get('/',            controlador.listar)

router.get(   '/:id',           ...admin, controlador.obtenerPorId)
router.post(  '/',              ...admin, controlador.crear)
router.put(   '/:id',           ...admin, controlador.actualizar)
router.patch( '/:id/destacado', ...admin, controlador.toggleDestacado)
router.delete('/:id',           ...admin, controlador.eliminar)

export default router