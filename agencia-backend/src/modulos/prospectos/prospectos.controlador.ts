import { Request, Response }                         from 'express'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import {
  esquemaCrearProspecto,
  esquemaActualizarProspecto,
  esquemaActualizarEstadoProspecto,
  esquemaFiltrosProspecto,
} from './prospectos.tipos.js'
import * as servicio from './prospectos.servicio.js'

/**
 * Controladores del módulo de prospectos.
 * Público:  crearProspecto (formulario de contacto)
 * ADMIN:    todo lo demás
 */

// POST /api/prospectos  — público (formulario de contacto)
export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearProspecto.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.crearProspecto(resultado.data)
    respuestaExito(res, datos, '¡Mensaje recibido! Nos comunicaremos pronto.', 201)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al registrar solicitud'
    respuestaError(res, mensaje, 400)
  }
}

// GET /api/prospectos/resumen  — admin
export const resumen = async (_req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.resumenProspectos()
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al obtener resumen'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/prospectos  — admin
export const listar = async (req: Request, res: Response): Promise<void> => {
  const filtros = esquemaFiltrosProspecto.parse(req.query)
  try {
    const { datos, paginacion } = await servicio.listarProspectos(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al listar prospectos'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/prospectos/:id  — admin
export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.obtenerProspectoPorId(id)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Prospecto no encontrado'
    respuestaError(res, mensaje, 404)
  }
}

// PUT /api/prospectos/:id  — admin
export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarProspecto.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.actualizarProspecto(id, resultado.data)
    respuestaExito(res, datos, 'Prospecto actualizado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al actualizar prospecto'
    respuestaError(res, mensaje, 400)
  }
}

// PATCH /api/prospectos/:id/estado  — admin
export const actualizarEstado = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarEstadoProspecto.safeParse(req.body)
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

// PATCH /api/prospectos/:id/asignar  — admin
export const asignar = async (req: Request, res: Response): Promise<void> => {
  const { usuarioId } = req.body as { usuarioId?: string | null }
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.asignarUsuario(id, usuarioId ?? null)
    respuestaExito(res, datos, 'Prospecto asignado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al asignar prospecto'
    respuestaError(res, mensaje, 400)
  }
}

// DELETE /api/prospectos/:id  — admin
export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.eliminarProspecto(id)
    respuestaExito(res, datos, 'Prospecto eliminado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al eliminar prospecto'
    respuestaError(res, mensaje, 400)
  }
}