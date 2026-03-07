import { Request, Response }                         from 'express'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import { notificarNuevoTestimonio }                  from '../../config/correo.js'
import {
  esquemaEnviarTestimonio,
  esquemaCrearTestimonio,
  esquemaActualizarTestimonio,
  esquemaModeracion,
  esquemaFiltrosTestimonio,
} from './testimonios.tipos.js'
import * as servicio from './testimonios.servicio.js'

/**
 * Controladores del módulo de testimonios.
 * Público:  enviar (formulario), listar visibles, destacados, obtener por id
 * ADMIN:    listar todos, crear, actualizar, moderar, resumen, eliminar
 */

// POST /api/testimonios  — público (formulario del sitio)
export const enviar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaEnviarTestimonio.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.enviarTestimonio(resultado.data)

    // Notificar al admin — no bloquea si falla
    notificarNuevoTestimonio({
      nombreCliente: datos.nombreCliente,
      empresa:       datos.empresa ?? null,
      contenido:     datos.contenido,
      calificacion:  datos.calificacion,
    }).catch(() => {})

    respuestaExito(res, datos, '¡Gracias por tu testimonio! Lo revisaremos pronto.', 201)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al enviar testimonio'
    respuestaError(res, mensaje, 400)
  }
}

// GET /api/testimonios/destacados  — público
export const destacados = async (req: Request, res: Response): Promise<void> => {
  try {
    const limite = Number(req.query['limite']) || 6
    const datos  = await servicio.listarDestacados(limite)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al obtener destacados'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/testimonios/resumen  — admin
export const resumen = async (_req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.resumenTestimonios()
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al obtener resumen'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/testimonios  — público (solo visibles)
export const listar = async (req: Request, res: Response): Promise<void> => {
  const filtros = esquemaFiltrosTestimonio.parse(req.query)
  try {
    const { datos, paginacion } = await servicio.listarVisibles(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al listar testimonios'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/testimonios/admin  — admin (todos)
export const listarAdmin = async (req: Request, res: Response): Promise<void> => {
  const filtros = esquemaFiltrosTestimonio.parse(req.query)
  try {
    const { datos, paginacion } = await servicio.listarTodos(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al listar testimonios'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/testimonios/:id  — público (solo visibles)
export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.obtenerTestimonioPorId(id, true)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Testimonio no encontrado'
    respuestaError(res, mensaje, 404)
  }
}

// GET /api/testimonios/admin/:id  — admin
export const obtenerPorIdAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.obtenerTestimonioPorId(id, false)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Testimonio no encontrado'
    respuestaError(res, mensaje, 404)
  }
}

// POST /api/testimonios/admin  — admin (crear directamente)
export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearTestimonio.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.crearTestimonio(resultado.data)
    respuestaExito(res, datos, 'Testimonio creado exitosamente', 201)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al crear testimonio'
    respuestaError(res, mensaje, 400)
  }
}

// PUT /api/testimonios/:id  — admin
export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarTestimonio.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.actualizarTestimonio(id, resultado.data)
    respuestaExito(res, datos, 'Testimonio actualizado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al actualizar testimonio'
    respuestaError(res, mensaje, 400)
  }
}

// PATCH /api/testimonios/:id/moderar  — admin
export const moderar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaModeracion.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.moderarTestimonio(id, resultado.data)
    const msg   = datos.visible ? 'Testimonio aprobado y publicado' : 'Testimonio ocultado'
    respuestaExito(res, datos, msg)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al moderar testimonio'
    respuestaError(res, mensaje, 400)
  }
}

// DELETE /api/testimonios/:id  — admin
export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.eliminarTestimonio(id)
    respuestaExito(res, datos, 'Testimonio eliminado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al eliminar testimonio'
    respuestaError(res, mensaje, 400)
  }
}