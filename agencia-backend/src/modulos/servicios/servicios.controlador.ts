import { Request, Response }                                  from 'express'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import {
  esquemaCrearServicio,
  esquemaActualizarServicio,
  esquemaFiltrosServicio,
} from './servicios.tipos.js'
import * as servicio from './servicios.servicio.js'

export const listar = async (req: Request, res: Response): Promise<void> => {
  const filtros = esquemaFiltrosServicio.parse(req.query)
  try {
    const { datos, paginacion } = await servicio.listarServicios(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    respuestaError(res, error instanceof Error ? error.message : 'Error al listar servicios', 500)
  }
}

export const listarAdmin = async (req: Request, res: Response): Promise<void> => {
  const filtros = esquemaFiltrosServicio.parse(req.query)
  try {
    const { datos, paginacion } = await servicio.listarServiciosAdmin(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    respuestaError(res, error instanceof Error ? error.message : 'Error al listar servicios', 500)
  }
}

export const obtenerPorSlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.obtenerServicioPorSlug(req.params['slug'] as string)
    respuestaExito(res, datos)
  } catch (error) {
    respuestaError(res, error instanceof Error ? error.message : 'Servicio no encontrado', 404)
  }
}

export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.obtenerServicioPorId(req.params['id'] as string)
    respuestaExito(res, datos)
  } catch (error) {
    respuestaError(res, error instanceof Error ? error.message : 'Servicio no encontrado', 404)
  }
}

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
    respuestaError(res, error instanceof Error ? error.message : 'Error al crear servicio', 400)
  }
}

export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarServicio.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.actualizarServicio(req.params['id'] as string, resultado.data)
    respuestaExito(res, datos, 'Servicio actualizado exitosamente')
  } catch (error) {
    respuestaError(res, error instanceof Error ? error.message : 'Error al actualizar servicio', 400)
  }
}

export const activar = async (req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.activarServicio(req.params['id'] as string)
    respuestaExito(res, datos, 'Servicio activado exitosamente')
  } catch (error) {
    respuestaError(res, error instanceof Error ? error.message : 'Error al activar servicio', 400)
  }
}

export const desactivar = async (req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.desactivarServicio(req.params['id'] as string)
    respuestaExito(res, datos, 'Servicio desactivado exitosamente')
  } catch (error) {
    respuestaError(res, error instanceof Error ? error.message : 'Error al desactivar servicio', 400)
  }
}

export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.eliminarServicio(req.params['id'] as string)
    respuestaExito(res, datos, 'Servicio eliminado permanentemente')
  } catch (error) {
    respuestaError(res, error instanceof Error ? error.message : 'Error al eliminar servicio', 400)
  }
}