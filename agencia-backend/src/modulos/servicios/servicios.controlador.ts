import { Request, Response }                                 from 'express'
import { param }                                             from '../../tipos.js'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import {
  esquemaCrearServicio,
  esquemaActualizarServicio,
  esquemaFiltrosServicio,
} from './servicios.tipos.js'
import * as servicio from './servicios.servicio.js'

const manejarError = (res: Response, error: unknown, codigoDefecto = 400): void => {
  const mensaje = error instanceof Error ? error.message : 'Error inesperado'
  const codigo  =
    mensaje.includes('no encontrado') ? 404 :
    mensaje.includes('Ya existe')     ? 409 :
    codigoDefecto
  respuestaError(res, mensaje, codigo)
}

const parsearFiltros = (req: Request, res: Response) => {
  const resultado = esquemaFiltrosServicio.safeParse(req.query)
  if (!resultado.success) { respuestaError(res, 'Parametros de filtro invalidos', 400, resultado.error.flatten().fieldErrors); return null }
  return resultado.data
}

export const listar = async (req: Request, res: Response): Promise<void> => {
  const filtros = parsearFiltros(req, res)
  if (!filtros) return
  try {
    const { datos, paginacion } = await servicio.listarServicios(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) { manejarError(res, error, 500) }
}

export const listarAdmin = async (req: Request, res: Response): Promise<void> => {
  const filtros = parsearFiltros(req, res)
  if (!filtros) return
  try {
    const { datos, paginacion } = await servicio.listarServiciosAdmin(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) { manejarError(res, error, 500) }
}

export const obtenerPorSlug = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.obtenerServicioPorSlug(param(req, 'slug')))
  } catch (error) { manejarError(res, error, 404) }
}

export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.obtenerServicioPorId(param(req, 'id')))
  } catch (error) { manejarError(res, error, 404) }
}

export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearServicio.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.crearServicio(resultado.data), 'Servicio creado correctamente', 201)
  } catch (error) { manejarError(res, error) }
}

export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarServicio.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.actualizarServicio(param(req, 'id'), resultado.data), 'Servicio actualizado correctamente')
  } catch (error) { manejarError(res, error) }
}

export const activar = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.activarServicio(param(req, 'id')), 'Servicio activado correctamente')
  } catch (error) { manejarError(res, error) }
}

export const desactivar = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.desactivarServicio(param(req, 'id')), 'Servicio desactivado correctamente')
  } catch (error) { manejarError(res, error) }
}

export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.eliminarServicio(param(req, 'id')), 'Servicio eliminado permanentemente')
  } catch (error) { manejarError(res, error) }
}