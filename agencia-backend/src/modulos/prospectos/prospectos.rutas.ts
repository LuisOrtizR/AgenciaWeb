import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './prospectos.controlador.js'

/**
 * Rutas de prospectos.
 *
 * POST   /api/prospectos              → formulario de contacto (público)
 * GET    /api/prospectos/resumen      → dashboard (ADMIN)
 * GET    /api/prospectos              → listar (ADMIN)
 * GET    /api/prospectos/:id          → detalle (ADMIN)
 * PUT    /api/prospectos/:id          → actualizar datos (ADMIN)
 * PATCH  /api/prospectos/:id/estado   → cambiar estado (ADMIN)
 * PATCH  /api/prospectos/:id/asignar  → asignar usuario (ADMIN)
 * DELETE /api/prospectos/:id          → eliminar (ADMIN)
 */

const router = Router()

// Pública — formulario de contacto del sitio web
router.post('/', controlador.crear)

// Protegidas — solo ADMIN
router.use(requerirAutenticacion, requerirRol('ADMIN'))

router.get(   '/resumen',         controlador.resumen)
router.get(   '/',                controlador.listar)
router.get(   '/:id',             controlador.obtenerPorId)
router.put(   '/:id',             controlador.actualizar)
router.patch( '/:id/estado',      controlador.actualizarEstado)
router.patch( '/:id/asignar',     controlador.asignar)
router.delete('/:id',             controlador.eliminar)

export default router