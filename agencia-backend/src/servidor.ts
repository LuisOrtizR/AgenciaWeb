/**
 * Punto de entrada del servidor.
 * Conecta la base de datos e inicia Express.
 */
import aplicacion          from './aplicacion.js'
import { conectarBaseDatos } from './config/baseDatos.js'
import entorno             from './config/entorno.js'
import logger              from './utilidades/logger.js'

const iniciarServidor = async (): Promise<void> => {
  try {
    // 1. Conectar a PostgreSQL primero
    await conectarBaseDatos()

    // 2. Iniciar servidor Express
    aplicacion.listen(entorno.PUERTO, () => {
      logger.info(`🚀 Servidor corriendo en http://localhost:${entorno.PUERTO}`)
      logger.info(`📦 Entorno: ${entorno.ENTORNO}`)
      logger.info(`🏥 Salud: http://localhost:${entorno.PUERTO}/api/salud`)
    })
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error)
    logger.error(`❌ Error iniciando servidor: ${mensaje}`)
    process.exit(1)
  }
}

// ─── Errores no capturados ───────────────────────────────────────────────────
process.on('unhandledRejection', (error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error)
  logger.error(`Promesa rechazada sin manejar: ${mensaje}`)
  process.exit(1)
})

process.on('uncaughtException', (error: Error) => {
  logger.error(`Excepción no capturada: ${error.message}`)
  process.exit(1)
})

iniciarServidor()
