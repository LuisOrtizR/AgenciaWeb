import winston from 'winston'
import entorno  from '../config/entorno.js'

const { combine, timestamp, json, colorize, printf } = winston.format

const formatoProduccion = combine(timestamp(), json())

const formatoDesarrollo = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`)
)

const logger = winston.createLogger({
  level:      entorno.esProduccion ? 'warn' : 'debug',
  format:     entorno.esProduccion ? formatoProduccion : formatoDesarrollo,
  transports: [new winston.transports.Console()],
})

export default logger