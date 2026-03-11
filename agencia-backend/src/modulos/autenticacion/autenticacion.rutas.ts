import { Router }                from 'express'
import { limitadorAutenticacion } from '../../middlewares/limitador.js'
import { requerirAutenticacion }  from '../../middlewares/autenticacion.js'
import * as controlador           from './autenticacion.controlador.js'


const router = Router()

router.post('/registrar',         limitadorAutenticacion, controlador.registrar)
router.post('/login',             limitadorAutenticacion, controlador.login)
router.get( '/perfil',            requerirAutenticacion,  controlador.perfil)
router.post('/refrescar',                                 controlador.refrescarToken)
router.post('/olvide-contrasena', limitadorAutenticacion, controlador.olvidéContrasena)
router.post('/reset-contrasena',  limitadorAutenticacion, controlador.resetContrasena)

export default router