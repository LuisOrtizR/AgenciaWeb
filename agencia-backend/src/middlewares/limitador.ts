import rateLimit from 'express-rate-limit'

const esDev     = process.env.NODE_ENV === 'development'
const ventanaMs = 15 * 60 * 1000 

const opcionesBase = {
  windowMs:        ventanaMs,
  skip:            () => esDev,
  standardHeaders: true,
  legacyHeaders:   false,
}

export const limitadorGeneral = rateLimit({
  ...opcionesBase,
  max: 100,
  message: {
    exito:   false,
    mensaje: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
  },
})

export const limitadorAutenticacion = rateLimit({
  ...opcionesBase,
  max: 10,
  message: {
    exito:   false,
    mensaje: 'Demasiados intentos de inicio de sesion. Intenta en 15 minutos.',
  },
})