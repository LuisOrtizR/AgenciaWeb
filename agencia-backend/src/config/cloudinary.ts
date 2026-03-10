import { v2 as cloudinary } from 'cloudinary'
import { Readable }          from 'stream'
import entorno               from './entorno.js'
import logger                from '../utilidades/logger.js'

cloudinary.config({
  cloud_name: entorno.CLOUDINARY_NOMBRE,
  api_key:    entorno.CLOUDINARY_CLAVE,
  api_secret: entorno.CLOUDINARY_SECRETO,
  secure:     true,
})

export const CARPETAS = {
  proyectos: 'agencia/proyectos',
} as const

export const subirImagen = async (
  buffer:          Buffer,
  carpeta:         string,
  nombreArchivo?: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const flujo = cloudinary.uploader.upload_stream(
      {
        folder:         carpeta,
        public_id:      nombreArchivo ?? `img_${Date.now()}`,
        overwrite:      true,
        resource_type:  'image',
        transformation: [
          { width: 1280, height: 960, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, resultado) => {
        if (error || !resultado) {
          logger.error(`[Cloudinary] Error al subir: ${error?.message ?? 'sin detalle'}`)
          reject(new Error('No se pudo subir la imagen. Intenta de nuevo.'))
          return
        }
        logger.info(`[Cloudinary] Imagen subida: ${resultado.public_id}`)
        resolve({ url: resultado.secure_url, publicId: resultado.public_id })
      }
    )

    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    readable.pipe(flujo)
  })
}

export const eliminarImagen = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId)
    logger.info(`[Cloudinary] Imagen eliminada: ${publicId}`)
  } catch (error) {
    logger.error(`[Cloudinary] Error eliminando ${publicId}: ${error instanceof Error ? error.message : error}`)
  }
}


export const extraerPublicId = (url: string): string | null => {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export default cloudinary