import { Request, Response }                                 from 'express'
import { param }                                             from '../../tipos.js'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import {
  esquemaCrearProspecto,
  esquemaActualizarProspecto,
  esquemaActualizarEstadoProspecto,
  esquemaAsignarProspecto,
  esquemaFiltrosProspecto,
} from './prospectos.tipos.js'
import * as servicio from './prospectos.servicio.js'

const manejarError = (res: Response, error: unknown, codigoDefecto = 400): void => {
  const mensaje = error instanceof Error ? error.message : 'Error inesperado'
  const codigo  = mensaje.includes('no encontrado') ? 404 : codigoDefecto
  respuestaError(res, mensaje, codigo)
}

export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearProspecto.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.crearProspecto(resultado.data), 'Mensaje recibido. Nos comunicaremos pronto.', 201)
  } catch (error) { manejarError(res, error) }
}

export const resumen = async (_req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.resumenProspectos())
  } catch (error) { manejarError(res, error, 500) }
}

export const listar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaFiltrosProspecto.safeParse(req.query)
  if (!resultado.success) { respuestaError(res, 'Parametros de filtro invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    const { datos, paginacion } = await servicio.listarProspectos(resultado.data)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) { manejarError(res, error, 500) }
}

export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.obtenerProspectoPorId(param(req, 'id')))
  } catch (error) { manejarError(res, error, 404) }
}

export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarProspecto.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.actualizarProspecto(param(req, 'id'), resultado.data), 'Prospecto actualizado correctamente')
  } catch (error) { manejarError(res, error) }
}

export const actualizarEstado = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarEstadoProspecto.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.actualizarEstado(param(req, 'id'), resultado.data), `Estado actualizado a ${resultado.data.estado}`)
  } catch (error) { manejarError(res, error) }
}

export const asignar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaAsignarProspecto.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    const datos = await servicio.asignarUsuario(param(req, 'id'), resultado.data.usuarioId)
    respuestaExito(res, datos, resultado.data.usuarioId ? 'Prospecto asignado correctamente' : 'Asignacion removida correctamente')
  } catch (error) { manejarError(res, error) }
}

export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.eliminarProspecto(param(req, 'id')), 'Prospecto eliminado correctamente')
  } catch (error) { manejarError(res, error) }
}