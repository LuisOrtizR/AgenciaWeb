import { Router }                from 'express'
import { requerirAutenticacion } from '../../middlewares/autenticacion.js'
import { requerirRol }           from '../../middlewares/roles.js'
import * as controlador          from './usuarios.controlador.js'

/**
 * Rutas de usuarios.
 *
 * Propio (autenticado):
 *   GET    /api/usuarios/perfil         → ver mi perfil
 *   PUT    /api/usuarios/perfil         → actualizar mi perfil
 *   PATCH  /api/usuarios/contrasena     → cambiar mi contraseña
 *
 * ADMIN:
 *   GET    /api/usuarios/resumen        → estadísticas
 *   GET    /api/usuarios                → listar
 *   GET    /api/usuarios/:id            → detalle
 *   POST   /api/usuarios                → crear
 *   PUT    /api/usuarios/:id            → actualizar
 *   PATCH  /api/usuarios/:id/activar    → activar
 *   PATCH  /api/usuarios/:id/desactivar → desactivar
 *   PATCH  /api/usuarios/:id/rol        → cambiar rol
 *   DELETE /api/usuarios/:id            → eliminar
 */

const router = Router()

// Todas las rutas requieren autenticación
router.use(requerirAutenticacion)

// Rutas del perfil propio
router.get(  '/perfil',     controlador.perfil)
router.put(  '/perfil',     controlador.actualizarPerfil)
router.patch('/contrasena', controlador.cambiarContrasena)

// Rutas exclusivas de ADMIN
router.get(   '/resumen',            requerirRol('ADMIN'), controlador.resumen)
router.get(   '/',                   requerirRol('ADMIN'), controlador.listar)
router.get(   '/:id',                requerirRol('ADMIN'), controlador.obtenerPorId)
router.post(  '/',                   requerirRol('ADMIN'), controlador.crear)
router.put(   '/:id',                requerirRol('ADMIN'), controlador.actualizar)
router.patch( '/:id/activar',        requerirRol('ADMIN'), controlador.activar)
router.patch( '/:id/desactivar',     requerirRol('ADMIN'), controlador.desactivar)
router.patch( '/:id/rol',            requerirRol('ADMIN'), controlador.cambiarRol)
router.delete('/:id',                requerirRol('ADMIN'), controlador.eliminar)

export default router