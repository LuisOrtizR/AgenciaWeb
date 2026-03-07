import rateLimit from 'express-rate-limit'

/**
 * Limita peticiones para prevenir abuso / ataques de fuerza bruta.
 */

// Limitador general: 100 req / 15 min por IP
export const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message: {
    exito:   false,
    mensaje: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
})

// Limitador estricto para autenticación: 10 intentos / 15 min
export const limitadorAutenticacion = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message: {
    exito:   false,
    mensaje: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
})
