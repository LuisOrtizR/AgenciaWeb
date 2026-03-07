import { v2 as cloudinary } from 'cloudinary'
import { Readable }          from 'stream'
import entorno               from './entorno.js'
import logger                from '../utilidades/logger.js'

/**
 * Configuración y utilidades de Cloudinary.
 *
 * Flujo: Request multipart → Multer (memoria) → Buffer → Stream → Cloudinary
 * No escribe nada en disco — funciona en cualquier servidor.
 */

cloudinary.config({
  cloud_name: entorno.CLOUDINARY_NOMBRE,
  api_key:    entorno.CLOUDINARY_CLAVE,
  api_secret: entorno.CLOUDINARY_SECRETO,
  secure:     true,
})

// ─── Carpetas por módulo ──────────────────────────────────────────────────────
export const CARPETAS = {
  proyectos: 'agencia/proyectos',
} as const

// ─── Subir imagen desde buffer de Multer ─────────────────────────────────────
export const subirImagen = async (
  buffer:         Buffer,
  carpeta:        string,
  nombreArchivo?: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const flujo = cloudinary.uploader.upload_stream(
      {
        folder:        carpeta,
        public_id:     nombreArchivo ?? `img_${Date.now()}`,
        overwrite:     true,
        resource_type: 'image',
        transformation: [
          { width: 1280, height: 960, crop: 'limit' }, // Máximo 1280x960
          { quality: 'auto:good' },                    // Compresión automática
          { fetch_format: 'auto' },                    // WebP en navegadores modernos
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

    // Buffer → readable stream → Cloudinary
    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    readable.pipe(flujo)
  })
}

// ─── Eliminar imagen por publicId ─────────────────────────────────────────────
export const eliminarImagen = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId)
    logger.info(`[Cloudinary] Imagen eliminada: ${publicId}`)
  } catch (error) {
    // No propagamos — si falla en Cloudinary no bloqueamos la BD
    logger.error(`[Cloudinary] Error eliminando ${publicId}: ${error instanceof Error ? error.message : error}`)
  }
}

// ─── Extraer publicId desde URL de Cloudinary ─────────────────────────────────
// URL: https://res.cloudinary.com/cloud/image/upload/v123/agencia/proyectos/slug.webp
// Retorna: agencia/proyectos/slug
export const extraerPublicId = (url: string): string | null => {
  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i
    const match = url.match(regex)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export default cloudinary