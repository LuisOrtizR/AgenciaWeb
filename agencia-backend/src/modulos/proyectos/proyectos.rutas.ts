import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './proyectos.controlador.js'

/**
 * Rutas de proyectos (portafolio).
 *
 * GET    /api/proyectos/destacados        → públicos
 * GET    /api/proyectos/tecnologias       → públicos
 * GET    /api/proyectos                   → públicos
 * GET    /api/proyectos/slug/:slug        → públicos
 * GET    /api/proyectos/:id               → admin
 * POST   /api/proyectos                   → admin
 * PUT    /api/proyectos/:id               → admin
 * PATCH  /api/proyectos/:id/destacado     → admin
 * DELETE /api/proyectos/:id               → admin
 */

const router = Router()

// Públicas
router.get('/destacados',   controlador.destacados)
router.get('/tecnologias',  controlador.tecnologias)
router.get('/slug/:slug',   controlador.obtenerPorSlug)
router.get('/',             controlador.listar)

// Protegidas — solo ADMIN
router.get(   '/:id',            requerirAutenticacion, requerirRol('ADMIN'), controlador.obtenerPorId)
router.post(  '/',               requerirAutenticacion, requerirRol('ADMIN'), controlador.crear)
router.put(   '/:id',            requerirAutenticacion, requerirRol('ADMIN'), controlador.actualizar)
router.patch( '/:id/destacado',  requerirAutenticacion, requerirRol('ADMIN'), controlador.toggleDestacado)
router.delete('/:id',            requerirAutenticacion, requerirRol('ADMIN'), controlador.eliminar)

export default router