import { Router } from 'express'
import { limitadorAutenticacion }  from '../../middlewares/limitador.js'
import { requerirAutenticacion }   from '../../middlewares/autenticacion.js'
import { requerirRol }             from '../../middlewares/roles.js'
import * as controlador            from './ia.controlador.js'

const router = Router()

/**
 * RUTAS DE IA
 *
 * POST /api/ia/chat                — Público  (limitado)
 * POST /api/ia/propuesta           — ADMIN
 * POST /api/ia/analizar-prospecto  — ADMIN
 * POST /api/ia/descripcion-proyecto— ADMIN
 */

// Público — widget de chat del sitio web (limitado a 30 req/15min)
router.post('/chat', limitadorAutenticacion, controlador.chat)

// Admin — herramientas internas de IA
router.post('/propuesta',            requerirAutenticacion, requerirRol('ADMIN'), controlador.propuesta)
router.post('/analizar-prospecto',   requerirAutenticacion, requerirRol('ADMIN'), controlador.analizarProspecto)
router.post('/descripcion-proyecto', requerirAutenticacion, requerirRol('ADMIN'), controlador.descripcionProyecto)

export default router