import express, { Application, Request, Response, NextFunction } from 'express'
import cors    from 'cors'
import helmet  from 'helmet'
import morgan  from 'morgan'
import entorno from './config/entorno.js'

import { limitadorGeneral }   from './middlewares/limitador.js'
import { manejarErrorSubida } from './middlewares/imagenes.js'
import { respuestaError }     from './utilidades/respuesta.js'
import logger                 from './utilidades/logger.js'

import rutasAutenticacion from './modulos/autenticacion/autenticacion.rutas.js'
import rutasUsuarios      from './modulos/usuarios/usuarios.rutas.js'
import rutasServicios     from './modulos/servicios/servicios.rutas.js'
import rutasProspectos    from './modulos/prospectos/prospectos.rutas.js'
import rutasProyectos     from './modulos/proyectos/proyectos.rutas.js'
import rutasCotizaciones  from './modulos/cotizaciones/cotizaciones.rutas.js'
import rutasTestimonios   from './modulos/testimonios/testimonios.rutas.js'
import rutasImagenes      from './modulos/imagenes/imagenes.rutas.js'
import rutasIA            from './modulos/ia/ia.rutas.js'

const aplicacion: Application = express()

aplicacion.use(helmet())
aplicacion.use(cors({ origin: entorno.URL_FRONTEND, credentials: true }))
aplicacion.use(limitadorGeneral)
aplicacion.use(express.json())
aplicacion.use(express.urlencoded({ extended: true }))
if (!entorno.esProduccion) aplicacion.use(morgan('dev'))

aplicacion.get('/api/salud', (_req: Request, res: Response) =>
  res.json({ estado: 'OK', mensaje: 'Servidor funcionando correctamente' })
)

aplicacion.use('/api/autenticacion', rutasAutenticacion)
aplicacion.use('/api/usuarios',      rutasUsuarios)
aplicacion.use('/api/servicios',     rutasServicios)
aplicacion.use('/api/prospectos',    rutasProspectos)
aplicacion.use('/api/proyectos',     rutasProyectos)
aplicacion.use('/api/cotizaciones',  rutasCotizaciones)
aplicacion.use('/api/testimonios',   rutasTestimonios)
aplicacion.use('/api/imagenes',      rutasImagenes)
aplicacion.use('/api/ia',            rutasIA)

aplicacion.use(manejarErrorSubida)

aplicacion.use((
  error:     Error,
  _req:      Request,
  respuesta: Response,
  _next:     NextFunction
): void => {
  logger.error(`[Error global] ${error.message}`)
  respuestaError(
    respuesta,
    entorno.esProduccion ? 'Error del servidor' : error.message,
    500
  )
})

export default aplicacion