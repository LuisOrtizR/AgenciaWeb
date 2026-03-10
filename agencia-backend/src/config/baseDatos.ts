import { PrismaClient } from '@prisma/client'
import { PrismaPg }    from '@prisma/adapter-pg'
import { Pool }        from 'pg'
import entorno         from './entorno.js'
import logger          from '../utilidades/logger.js'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const urlConexion =
  `postgresql://${entorno.DB_USUARIO}:${encodeURIComponent(entorno.DB_CONTRASENA)}` +
  `@${entorno.DB_HOST}:${entorno.DB_PUERTO}/${entorno.DB_NOMBRE}`

const pool = new Pool({
  connectionString: urlConexion,
  ssl: { rejectUnauthorized: false },
})

const prisma = global.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) })

if (process.env['NODE_ENV'] !== 'production') {
  global.prisma = prisma
}

export const conectarBaseDatos = async (): Promise<void> => {
  try {
    await prisma.$connect()
    logger.info('Base de datos conectada exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error)
    logger.error(`Error conectando a la base de datos: ${mensaje}`)
    throw error
  }
}

export default prisma