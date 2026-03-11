import { Request, Response }                                 from 'express'
import { param }                                             from '../../tipos.js'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import {
  esquemaCrearProyecto,
  esquemaActualizarProyecto,
  esquemaFiltrosProyecto,
} from './proyectos.tipos.js'
import * as servicio from './proyectos.servicio.js'

const manejarError = (res: Response, error: unknown, codigoDefecto = 400): void => {
  const mensaje = error instanceof Error ? error.message : 'Error inesperado'
  const codigo  =
    mensaje.includes('no encontrado') ? 404 :
    mensaje.includes('Ya existe')     ? 409 :
    codigoDefecto
  respuestaError(res, mensaje, codigo)
}

export const destacados = async (_req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.listarDestacados())
  } catch (error) { manejarError(res, error, 500) }
}

export const tecnologias = async (_req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.resumenTecnologias())
  } catch (error) { manejarError(res, error, 500) }
}

export const listar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaFiltrosProyecto.safeParse(req.query)
  if (!resultado.success) { respuestaError(res, 'Parametros de filtro invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    const { datos, paginacion } = await servicio.listarProyectos(resultado.data)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) { manejarError(res, error, 500) }
}

export const obtenerPorSlug = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.obtenerProyectoPorSlug(param(req, 'slug')))
  } catch (error) { manejarError(res, error, 404) }
}

export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.obtenerProyectoPorId(param(req, 'id')))
  } catch (error) { manejarError(res, error, 404) }
}

export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearProyecto.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.crearProyecto(resultado.data), 'Proyecto creado correctamente', 201)
  } catch (error) { manejarError(res, error) }
}

export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarProyecto.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.actualizarProyecto(param(req, 'id'), resultado.data), 'Proyecto actualizado correctamente')
  } catch (error) { manejarError(res, error) }
}

export const toggleDestacado = async (req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.toggleDestacado(param(req, 'id'))
    respuestaExito(res, datos, datos.destacado ? 'Proyecto marcado como destacado' : 'Proyecto desmarcado como destacado')
  } catch (error) { manejarError(res, error) }
}

export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.eliminarProyecto(param(req, 'id')), 'Proyecto eliminado correctamente')
  } catch (error) { manejarError(res, error) }
}