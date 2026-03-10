import aplicacion             from './aplicacion.js'
import { conectarBaseDatos } from './config/baseDatos.js'
import entorno               from './config/entorno.js'
import logger                from './utilidades/logger.js'

const iniciarServidor = async (): Promise<void> => {
  try {
    await conectarBaseDatos()
    aplicacion.listen(entorno.PUERTO, () => {
      logger.info(`Servidor corriendo en http://localhost:${entorno.PUERTO}`)
      logger.info(`Entorno: ${entorno.ENTORNO}`)
      logger.info(`Salud: http://localhost:${entorno.PUERTO}/api/salud`)
    })
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error)
    logger.error(`Error iniciando servidor: ${mensaje}`)
    process.exit(1)
  }
}

process.on('unhandledRejection', (error: unknown) => {
  logger.error(`Promesa rechazada sin manejar: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})

process.on('uncaughtException', (error: Error) => {
  logger.error(`Excepcion no capturada: ${error.message}`)
  process.exit(1)
})

iniciarServidor()