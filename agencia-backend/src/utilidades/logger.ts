import winston from 'winston'
import entorno from '../config/entorno.js'

/**
 * Logger centralizado con Winston.
 * En producción: solo warn/error en JSON.
 * En desarrollo: todo en consola con colores.
 */
const logger = winston.createLogger({
  level: entorno.esProduccion ? 'warn' : 'debug',
  format: entorno.esProduccion
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(
          ({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`
        )
      ),
  transports: [new winston.transports.Console()],
})

export default logger
