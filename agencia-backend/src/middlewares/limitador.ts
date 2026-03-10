import rateLimit from 'express-rate-limit'

const esDev = process.env.NODE_ENV === 'development'

/**
 * Limita peticiones para prevenir abuso / ataques de fuerza bruta.
 * En desarrollo se omite el límite para no interrumpir el flujo de trabajo.
 */

// ── General: 100 req / 15 min por IP ──────────────────────────────────────────
export const limitadorGeneral = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  skip:            () => esDev,          // ✅ sin límite en desarrollo
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    exito:   false,
    mensaje: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
  },
})

// ── Autenticación: 10 intentos / 15 min ───────────────────────────────────────
export const limitadorAutenticacion = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  skip:            () => esDev,          // ✅ sin límite en desarrollo
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    exito:   false,
    mensaje: 'Demasiados intentos de inicio de sesión. Intenta en 15 minutos.',
  },
})