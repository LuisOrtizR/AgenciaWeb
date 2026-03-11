import { Request, Response }                                 from 'express'
import { param }                                             from '../../tipos.js'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import { notificarNuevoTestimonio }                          from '../../config/correo.js'
import {
  esquemaEnviarTestimonio,
  esquemaCrearTestimonio,
  esquemaActualizarTestimonio,
  esquemaModeracion,
  esquemaFiltrosTestimonio,
} from './testimonios.tipos.js'
import * as servicio from './testimonios.servicio.js'

const manejarError = (res: Response, error: unknown, codigoDefecto = 400): void => {
  const mensaje = error instanceof Error ? error.message : 'Error inesperado'
  const codigo  =
    mensaje.includes('no encontrado') || mensaje.includes('no disponible') ? 404 :
    codigoDefecto
  respuestaError(res, mensaje, codigo)
}

const parsearFiltros = (req: Request, res: Response) => {
  const resultado = esquemaFiltrosTestimonio.safeParse(req.query)
  if (!resultado.success) { respuestaError(res, 'Parametros de filtro invalidos', 400, resultado.error.flatten().fieldErrors); return null }
  return resultado.data
}

export const enviar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaEnviarTestimonio.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    const datos = await servicio.enviarTestimonio(resultado.data)
    notificarNuevoTestimonio({
      nombreCliente: datos.nombreCliente,
      empresa:       datos.empresa ?? null,
      contenido:     datos.contenido,
      calificacion:  datos.calificacion,
    }).catch(() => {})
    respuestaExito(res, datos, 'Testimonio recibido. Lo revisaremos pronto.', 201)
  } catch (error) { manejarError(res, error) }
}

export const destacados = async (req: Request, res: Response): Promise<void> => {
  const limite = Math.min(Number(req.query['limite']) || 6, 20)
  try {
    respuestaExito(res, await servicio.listarDestacados(limite))
  } catch (error) { manejarError(res, error, 500) }
}

export const resumen = async (_req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.resumenTestimonios())
  } catch (error) { manejarError(res, error, 500) }
}

export const listar = async (req: Request, res: Response): Promise<void> => {
  const filtros = parsearFiltros(req, res)
  if (!filtros) return
  try {
    const { datos, paginacion } = await servicio.listarVisibles(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) { manejarError(res, error, 500) }
}

export const listarAdmin = async (req: Request, res: Response): Promise<void> => {
  const filtros = parsearFiltros(req, res)
  if (!filtros) return
  try {
    const { datos, paginacion } = await servicio.listarTodos(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) { manejarError(res, error, 500) }
}

export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.obtenerTestimonioPorId(param(req, 'id'), true))
  } catch (error) { manejarError(res, error, 404) }
}

export const obtenerPorIdAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.obtenerTestimonioPorId(param(req, 'id')))
  } catch (error) { manejarError(res, error, 404) }
}

export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearTestimonio.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.crearTestimonio(resultado.data), 'Testimonio creado correctamente', 201)
  } catch (error) { manejarError(res, error) }
}

export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarTestimonio.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.actualizarTestimonio(param(req, 'id'), resultado.data), 'Testimonio actualizado correctamente')
  } catch (error) { manejarError(res, error) }
}

export const moderar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaModeracion.safeParse(req.body)
  if (!resultado.success) { respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors); return }
  try {
    const datos = await servicio.moderarTestimonio(param(req, 'id'), resultado.data)
    respuestaExito(res, datos, datos.visible ? 'Testimonio aprobado y publicado' : 'Testimonio ocultado')
  } catch (error) { manejarError(res, error) }
}

export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.eliminarTestimonio(param(req, 'id')), 'Testimonio eliminado correctamente')
  } catch (error) { manejarError(res, error) }
}