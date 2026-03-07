import { Request, Response }                         from 'express'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import { SolicitudAutenticada }                       from '../../tipos.js'
import {
  esquemaCrearCotizacion,
  esquemaActualizarCotizacion,
  esquemaActualizarEstadoCotizacion,
  esquemaFiltrosCotizacion,
} from './cotizaciones.tipos.js'
import * as servicio from './cotizaciones.servicio.js'

/**
 * Controladores del módulo de cotizaciones.
 * Todos los endpoints requieren ADMIN.
 */

// GET /api/cotizaciones/resumen
export const resumen = async (_req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.resumenCotizaciones()
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al obtener resumen'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/cotizaciones
export const listar = async (req: Request, res: Response): Promise<void> => {
  const filtros = esquemaFiltrosCotizacion.parse(req.query)
  try {
    const { datos, paginacion } = await servicio.listarCotizaciones(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al listar cotizaciones'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/cotizaciones/:id
export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.obtenerCotizacionPorId(id)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Cotización no encontrada'
    respuestaError(res, mensaje, 404)
  }
}

// GET /api/cotizaciones/prospecto/:prospectoId
export const porProspecto = async (req: Request, res: Response): Promise<void> => {
  try {
    const prospectoId = req.params['prospectoId'] as string
    const datos       = await servicio.cotizacionesPorProspecto(prospectoId)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al obtener cotizaciones'
    respuestaError(res, mensaje, 404)
  }
}

// POST /api/cotizaciones
export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearCotizacion.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  const solicitud = req as SolicitudAutenticada
  const usuarioId = solicitud.usuario?.id
  try {
    const datos = await servicio.crearCotizacion(resultado.data, usuarioId)
    respuestaExito(res, datos, 'Cotización creada exitosamente', 201)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al crear cotización'
    respuestaError(res, mensaje, 400)
  }
}

// PUT /api/cotizaciones/:id
export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarCotizacion.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.actualizarCotizacion(id, resultado.data)
    respuestaExito(res, datos, 'Cotización actualizada exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al actualizar cotización'
    respuestaError(res, mensaje, 400)
  }
}

// PATCH /api/cotizaciones/:id/estado
export const actualizarEstado = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarEstadoCotizacion.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.actualizarEstado(id, resultado.data)
    respuestaExito(res, datos, `Estado actualizado a ${resultado.data.estado}`)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al actualizar estado'
    respuestaError(res, mensaje, 400)
  }
}

// POST /api/cotizaciones/:id/duplicar
export const duplicar = async (req: Request, res: Response): Promise<void> => {
  const solicitud = req as SolicitudAutenticada
  const usuarioId = solicitud.usuario?.id
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.duplicarCotizacion(id, usuarioId)
    respuestaExito(res, datos, 'Cotización duplicada exitosamente', 201)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al duplicar cotización'
    respuestaError(res, mensaje, 400)
  }
}

// DELETE /api/cotizaciones/:id
export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.eliminarCotizacion(id)
    respuestaExito(res, datos, 'Cotización eliminada exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al eliminar cotización'
    respuestaError(res, mensaje, 400)
  }
}