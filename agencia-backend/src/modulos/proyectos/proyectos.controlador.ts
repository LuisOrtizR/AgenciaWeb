import { Request, Response }                         from 'express'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import {
  esquemaCrearProyecto,
  esquemaActualizarProyecto,
  esquemaFiltrosProyecto,
} from './proyectos.tipos.js'
import * as servicio from './proyectos.servicio.js'

/**
 * Controladores del módulo de proyectos (portafolio).
 * Público:  listar, listarDestacados, obtenerPorSlug
 * ADMIN:    crear, actualizar, toggleDestacado, eliminar
 */

// GET /api/proyectos/destacados  — público
export const destacados = async (_req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.listarDestacados()
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al obtener proyectos destacados'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/proyectos/tecnologias  — público
export const tecnologias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.resumenTecnologias()
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al obtener tecnologías'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/proyectos  — público
export const listar = async (req: Request, res: Response): Promise<void> => {
  const filtros = esquemaFiltrosProyecto.parse(req.query)
  try {
    const { datos, paginacion } = await servicio.listarProyectos(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al listar proyectos'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/proyectos/slug/:slug  — público
export const obtenerPorSlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug  = req.params['slug'] as string
    const datos = await servicio.obtenerProyectoPorSlug(slug)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Proyecto no encontrado'
    respuestaError(res, mensaje, 404)
  }
}

// GET /api/proyectos/:id  — admin
export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.obtenerProyectoPorId(id)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Proyecto no encontrado'
    respuestaError(res, mensaje, 404)
  }
}

// POST /api/proyectos  — admin
export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearProyecto.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.crearProyecto(resultado.data)
    respuestaExito(res, datos, 'Proyecto creado exitosamente', 201)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al crear proyecto'
    respuestaError(res, mensaje, 400)
  }
}

// PUT /api/proyectos/:id  — admin
export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarProyecto.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.actualizarProyecto(id, resultado.data)
    respuestaExito(res, datos, 'Proyecto actualizado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al actualizar proyecto'
    respuestaError(res, mensaje, 400)
  }
}

// PATCH /api/proyectos/:id/destacado  — admin
export const toggleDestacado = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.toggleDestacado(id)
    const msg   = datos.destacado ? 'Proyecto marcado como destacado' : 'Proyecto desmarcado como destacado'
    respuestaExito(res, datos, msg)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al cambiar estado destacado'
    respuestaError(res, mensaje, 400)
  }
}

// DELETE /api/proyectos/:id  — admin
export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.eliminarProyecto(id)
    respuestaExito(res, datos, 'Proyecto eliminado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al eliminar proyecto'
    respuestaError(res, mensaje, 400)
  }
}