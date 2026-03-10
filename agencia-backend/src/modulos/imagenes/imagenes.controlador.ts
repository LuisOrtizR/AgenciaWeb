import { Response }             from 'express'
import { SolicitudAutenticada } from '../../tipos.js'
import { respuestaExito, respuestaError } from '../../utilidades/respuesta.js'
import { subirImagen, eliminarImagen, extraerPublicId, CARPETAS } from '../../config/cloudinary.js'
import logger from '../../utilidades/logger.js'
import prisma from '../../config/baseDatos.js'

const buscarProyecto = async (id: string, res: Response) => {
  const proyecto = await prisma.proyecto.findUnique({
    where:  { id },
    select: { id: true, titulo: true, slug: true, imagenUrl: true },
  })
  if (!proyecto) {
    respuestaError(res, 'Proyecto no encontrado', 404)
    return null
  }
  return proyecto
}

const limpiarImagenAnterior = async (imagenUrl: string | null): Promise<void> => {
  if (!imagenUrl) return
  const publicId = extraerPublicId(imagenUrl)
  if (publicId) await eliminarImagen(publicId)
}

export const subirImagenProyecto = async (
  req: SolicitudAutenticada,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    if (!req.file) {
      respuestaError(res, 'No se recibio ningun archivo. Envía el campo "imagen".', 400)
      return
    }

    const proyecto = await buscarProyecto(id, res)
    if (!proyecto) return

    await limpiarImagenAnterior(proyecto.imagenUrl)

    const { url, publicId } = await subirImagen(
      req.file.buffer,
      CARPETAS.proyectos,
      proyecto.slug
    )

    const proyectoActualizado = await prisma.proyecto.update({
      where:  { id },
      data:   { imagenUrl: url },
      select: { id: true, titulo: true, slug: true, imagenUrl: true },
    })

    logger.info(`[Imagenes] Imagen subida para proyecto "${proyecto.slug}" por usuario ${req.usuario?.id}`)

    respuestaExito(
      res,
      { ...proyectoActualizado, publicId },
      'Imagen subida exitosamente',
      201
    )
  } catch (error) {
    logger.error(`[Imagenes] Error al subir imagen: ${error instanceof Error ? error.message : error}`)
    respuestaError(res, 'Error interno al subir la imagen', 500)
  }
}


export const eliminarImagenProyecto = async (
  req: SolicitudAutenticada,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    const proyecto = await buscarProyecto(id, res)
    if (!proyecto) return

    if (!proyecto.imagenUrl) {
      respuestaError(res, 'Este proyecto no tiene imagen que eliminar', 409)
      return
    }

    const publicId = extraerPublicId(proyecto.imagenUrl)

    await Promise.all([
      publicId ? eliminarImagen(publicId) : Promise.resolve(),
      prisma.proyecto.update({ where: { id }, data: { imagenUrl: null } }),
    ])

    logger.info(`[Imagenes] Imagen eliminada del proyecto "${proyecto.titulo}" por usuario ${req.usuario?.id}`)

    respuestaExito(res, { id, titulo: proyecto.titulo }, 'Imagen eliminada exitosamente')
  } catch (error) {
    logger.error(`[Imagenes] Error al eliminar imagen: ${error instanceof Error ? error.message : error}`)
    respuestaError(res, 'Error interno al eliminar la imagen', 500)
  }
}