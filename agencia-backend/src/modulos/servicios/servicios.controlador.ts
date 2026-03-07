import { Request, Response }                         from 'express'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import {
  esquemaCrearServicio,
  esquemaActualizarServicio,
  esquemaFiltrosServicio,
} from './servicios.tipos.js'
import * as servicio from './servicios.servicio.js'

/**
 * Controladores del módulo de servicios.
 * Público:  listar (activos), obtenerPorSlug
 * ADMIN:    listar todos, crear, actualizar, activar, desactivar, eliminar
 */

// GET /api/servicios  — público (solo activos)
export const listar = async (req: Request, res: Response): Promise<void> => {
  const filtros = esquemaFiltrosServicio.parse(req.query)
  try {
    const { datos, paginacion } = await servicio.listarServicios(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al listar servicios'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/servicios/admin  — admin (activos e inactivos)
export const listarAdmin = async (req: Request, res: Response): Promise<void> => {
  const filtros = esquemaFiltrosServicio.parse(req.query)
  try {
    const { datos, paginacion } = await servicio.listarServiciosAdmin(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al listar servicios'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/servicios/slug/:slug  — público
export const obtenerPorSlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug  = req.params['slug'] as string
    const datos = await servicio.obtenerServicioPorSlug(slug)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Servicio no encontrado'
    respuestaError(res, mensaje, 404)
  }
}

// GET /api/servicios/:id  — admin
export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.obtenerServicioPorId(id)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Servicio no encontrado'
    respuestaError(res, mensaje, 404)
  }
}

// POST /api/servicios  — admin
export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearServicio.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.crearServicio(resultado.data)
    respuestaExito(res, datos, 'Servicio creado exitosamente', 201)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al crear servicio'
    respuestaError(res, mensaje, 400)
  }
}

// PUT /api/servicios/:id  — admin
export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarServicio.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.actualizarServicio(id, resultado.data)
    respuestaExito(res, datos, 'Servicio actualizado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al actualizar servicio'
    respuestaError(res, mensaje, 400)
  }
}

// PATCH /api/servicios/:id/activar  — admin
export const activar = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.activarServicio(id)
    respuestaExito(res, datos, 'Servicio activado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al activar servicio'
    respuestaError(res, mensaje, 400)
  }
}

// PATCH /api/servicios/:id/desactivar  — admin
export const desactivar = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.desactivarServicio(id)
    respuestaExito(res, datos, 'Servicio desactivado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al desactivar servicio'
    respuestaError(res, mensaje, 400)
  }
}

// DELETE /api/servicios/:id  — admin
export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.eliminarServicio(id)
    respuestaExito(res, datos, 'Servicio eliminado permanentemente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al eliminar servicio'
    respuestaError(res, mensaje, 400)
  }
}