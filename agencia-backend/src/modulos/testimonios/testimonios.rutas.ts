import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './testimonios.controlador.js'

/**
 * Rutas de testimonios.
 *
 * POST   /api/testimonios                → formulario público
 * GET    /api/testimonios/destacados     → público
 * GET    /api/testimonios                → público (solo visibles)
 * GET    /api/testimonios/:id            → público (solo visibles)
 * GET    /api/testimonios/resumen        → admin
 * GET    /api/testimonios/admin          → admin (todos)
 * GET    /api/testimonios/admin/:id      → admin
 * POST   /api/testimonios/admin          → admin (crear directo)
 * PUT    /api/testimonios/:id            → admin
 * PATCH  /api/testimonios/:id/moderar    → admin
 * DELETE /api/testimonios/:id            → admin
 */

const router = Router()

// Públicas
router.post('//',          controlador.enviar)
router.get( '/destacados', controlador.destacados)
router.get( '/',           controlador.listar)
router.get( '/:id',        controlador.obtenerPorId)

// Protegidas — solo ADMIN
router.get(   '/resumen',         requerirAutenticacion, requerirRol('ADMIN'), controlador.resumen)
router.get(   '/admin',           requerirAutenticacion, requerirRol('ADMIN'), controlador.listarAdmin)
router.get(   '/admin/:id',       requerirAutenticacion, requerirRol('ADMIN'), controlador.obtenerPorIdAdmin)
router.post(  '/admin',           requerirAutenticacion, requerirRol('ADMIN'), controlador.crear)
router.put(   '/:id',             requerirAutenticacion, requerirRol('ADMIN'), controlador.actualizar)
router.patch( '/:id/moderar',     requerirAutenticacion, requerirRol('ADMIN'), controlador.moderar)
router.delete('/:id',             requerirAutenticacion, requerirRol('ADMIN'), controlador.eliminar)

export default router