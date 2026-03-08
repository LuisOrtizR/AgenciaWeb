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
 *
 * ⚠️  ORDEN IMPORTANTE: las rutas específicas (/destacados, /resumen, /admin, /admin/:id)
 *     deben ir ANTES de /:id, de lo contrario Express interpreta "admin" o "resumen"
 *     como un parámetro :id y nunca alcanza los controladores correctos.
 */

const router = Router()

// ── Rutas públicas específicas (ANTES de /:id) ────────────────────────────────

// ✅ FIX: '/' en lugar de '//' para que POST /api/testimonios funcione
router.post('/destacados',  controlador.destacados) // no aplica, solo por orden
router.post('/',            controlador.enviar)

router.get('/destacados',   controlador.destacados)

// ── Rutas protegidas específicas (ANTES de /:id) ──────────────────────────────

// ✅ FIX: /resumen y /admin ANTES de /:id para que Express no las confunda con un id
router.get(  '/resumen',    requerirAutenticacion, requerirRol('ADMIN'), controlador.resumen)
router.get(  '/admin',      requerirAutenticacion, requerirRol('ADMIN'), controlador.listarAdmin)
router.get(  '/admin/:id',  requerirAutenticacion, requerirRol('ADMIN'), controlador.obtenerPorIdAdmin)
router.post( '/admin',      requerirAutenticacion, requerirRol('ADMIN'), controlador.crear)

// ── Rutas públicas con parámetro (AL FINAL para no interceptar rutas específicas) ──

router.get('/',    controlador.listar)
router.get('/:id', controlador.obtenerPorId)

// ── Rutas protegidas con parámetro ────────────────────────────────────────────

router.put(   '/:id',         requerirAutenticacion, requerirRol('ADMIN'), controlador.actualizar)
router.patch( '/:id/moderar', requerirAutenticacion, requerirRol('ADMIN'), controlador.moderar)
router.delete('/:id',         requerirAutenticacion, requerirRol('ADMIN'), controlador.eliminar)

export default router