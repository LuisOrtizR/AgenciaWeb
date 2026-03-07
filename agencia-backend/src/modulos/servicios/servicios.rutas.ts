import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './servicios.controlador.js'

/**
 * Rutas de servicios.
 *
 * GET    /api/servicios                   → públicos (activos)
 * GET    /api/servicios/slug/:slug        → público
 * GET    /api/servicios/admin             → admin (todos)
 * GET    /api/servicios/:id               → admin
 * POST   /api/servicios                   → admin
 * PUT    /api/servicios/:id               → admin
 * PATCH  /api/servicios/:id/activar       → admin
 * PATCH  /api/servicios/:id/desactivar    → admin
 * DELETE /api/servicios/:id               → admin
 */

const router = Router()

// Públicas
router.get('/slug/:slug', controlador.obtenerPorSlug)
router.get('/',           controlador.listar)

// Protegidas — solo ADMIN
router.get(   '/admin',            requerirAutenticacion, requerirRol('ADMIN'), controlador.listarAdmin)
router.get(   '/:id',              requerirAutenticacion, requerirRol('ADMIN'), controlador.obtenerPorId)
router.post(  '/',                 requerirAutenticacion, requerirRol('ADMIN'), controlador.crear)
router.put(   '/:id',              requerirAutenticacion, requerirRol('ADMIN'), controlador.actualizar)
router.patch( '/:id/activar',      requerirAutenticacion, requerirRol('ADMIN'), controlador.activar)
router.patch( '/:id/desactivar',   requerirAutenticacion, requerirRol('ADMIN'), controlador.desactivar)
router.delete('/:id',              requerirAutenticacion, requerirRol('ADMIN'), controlador.eliminar)

export default router