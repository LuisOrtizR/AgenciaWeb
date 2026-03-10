import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './cotizaciones.controlador.js'

/**
 * Rutas de cotizaciones — todas requieren ADMIN.
 *
 * GET    /api/cotizaciones/resumen
 * GET    /api/cotizaciones
 * GET    /api/cotizaciones/:id
 * GET    /api/cotizaciones/prospecto/:prospectoId
 * POST   /api/cotizaciones
 * PUT    /api/cotizaciones/:id
 * PATCH  /api/cotizaciones/:id/estado
 * POST   /api/cotizaciones/:id/duplicar
 * DELETE /api/cotizaciones/:id
 */

const router = Router()

// ── Rutas de cliente (solo autenticación, sin rol ADMIN) ──
router.get(   '/mis-cotizaciones', requerirAutenticacion, controlador.misCotizaciones)
router.patch( '/:id/responder',    requerirAutenticacion, controlador.responderCotizacion)

// ── Rutas de admin (requieren ADMIN) ──────────────────────
router.use(requerirAutenticacion, requerirRol('ADMIN'))

router.get(   '/resumen',                controlador.resumen)
router.get(   '/prospecto/:prospectoId', controlador.porProspecto)
router.get(   '/',                       controlador.listar)
router.get(   '/:id',                    controlador.obtenerPorId)
router.post(  '/',                       controlador.crear)
router.put(   '/:id',                    controlador.actualizar)
router.patch( '/:id/estado',             controlador.actualizarEstado)
router.post(  '/:id/duplicar',           controlador.duplicar)
router.delete('/:id',                    controlador.eliminar)

export default router