import { Router }                from 'express'
import { limitadorAutenticacion } from '../../middlewares/limitador.js'
import { requerirAutenticacion }  from '../../middlewares/autenticacion.js'
import * as controlador           from './autenticacion.controlador.js'

/**
 * Rutas de autenticación.
 *
 * POST /api/autenticacion/registrar          → crear cuenta
 * POST /api/autenticacion/login              → iniciar sesión
 * GET  /api/autenticacion/perfil             → ver perfil (requiere auth)
 * POST /api/autenticacion/refrescar          → renovar token de acceso
 * POST /api/autenticacion/olvide-contrasena  → solicitar reset por correo
 * POST /api/autenticacion/reset-contrasena   → aplicar nueva contraseña con token
 */

const router = Router()

router.post('/registrar',         limitadorAutenticacion, controlador.registrar)
router.post('/login',             limitadorAutenticacion, controlador.login)
router.get( '/perfil',            requerirAutenticacion,  controlador.perfil)
router.post('/refrescar',                                 controlador.refrescarToken)
router.post('/olvide-contrasena', limitadorAutenticacion, controlador.olvidéContrasena)
router.post('/reset-contrasena',  limitadorAutenticacion, controlador.resetContrasena)

export default router