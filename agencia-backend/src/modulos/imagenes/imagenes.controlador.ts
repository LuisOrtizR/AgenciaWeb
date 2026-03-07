import { Response }             from 'express'
import { SolicitudAutenticada } from '../../tipos.js'
import { respuestaExito, respuestaError } from '../../utilidades/respuesta.js'
import { subirImagen, eliminarImagen, extraerPublicId, CARPETAS } from '../../config/cloudinary.js'
import prisma from '../../config/baseDatos.js'

/**
 * Controladores de imágenes — solo ADMIN.
 *
 * POST   /api/imagenes/proyectos/:id  → sube imagen y guarda URL en el proyecto
 * DELETE /api/imagenes/proyectos/:id  → elimina imagen de Cloudinary y limpia BD
 */

// POST /api/imagenes/proyectos/:id
// Body: multipart/form-data con campo "imagen"
export const subirImagenProyecto = async (
  req: SolicitudAutenticada,
  res: Response
): Promise<void> => {
  try {
    const id      = req.params['id'] as string
    const archivo = req.file

    if (!archivo) {
      respuestaError(res, 'No se recibió ningún archivo. Envía el campo "imagen".', 400)
      return
    }

    const proyecto = await prisma.proyecto.findUnique({
      where:  { id },
      select: { id: true, titulo: true, slug: true, imagenUrl: true },
    })
    if (!proyecto) {
      respuestaError(res, 'Proyecto no encontrado', 404)
      return
    }

    // Si ya tenía imagen → eliminarla de Cloudinary antes de subir la nueva
    if (proyecto.imagenUrl) {
      const publicIdAnterior = extraerPublicId(proyecto.imagenUrl)
      if (publicIdAnterior) await eliminarImagen(publicIdAnterior)
    }

    // Subir nueva imagen — nombre de archivo = slug del proyecto
    const { url, publicId } = await subirImagen(
      archivo.buffer,
      CARPETAS.proyectos,
      proyecto.slug
    )

    // Guardar URL en la BD
    const proyectoActualizado = await prisma.proyecto.update({
      where:  { id },
      data:   { imagenUrl: url },
      select: { id: true, titulo: true, slug: true, imagenUrl: true },
    })

    respuestaExito(res, { ...proyectoActualizado, publicId }, 'Imagen subida exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al subir imagen'
    respuestaError(res, mensaje, 500)
  }
}

// DELETE /api/imagenes/proyectos/:id
export const eliminarImagenProyecto = async (
  req: SolicitudAutenticada,
  res: Response
): Promise<void> => {
  try {
    const id = req.params['id'] as string

    const proyecto = await prisma.proyecto.findUnique({
      where:  { id },
      select: { id: true, titulo: true, imagenUrl: true },
    })

    if (!proyecto) {
      respuestaError(res, 'Proyecto no encontrado', 404)
      return
    }

    if (!proyecto.imagenUrl) {
      respuestaError(res, 'Este proyecto no tiene imagen que eliminar', 400)
      return
    }

    // Eliminar de Cloudinary
    const publicId = extraerPublicId(proyecto.imagenUrl)
    if (publicId) await eliminarImagen(publicId)

    // Limpiar URL en la BD
    await prisma.proyecto.update({
      where: { id },
      data:  { imagenUrl: null },
    })

    respuestaExito(res, { id, titulo: proyecto.titulo }, 'Imagen eliminada exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al eliminar imagen'
    respuestaError(res, mensaje, 500)
  }
}