import { Request, Response }              from 'express'
import { respuestaExito, respuestaError } from '../../utilidades/respuesta.js'
import {
  esquemaChatMensaje,
  esquemaGenerarPropuesta,
  esquemaAnalizarProspecto,
  esquemaGenerarDescripcion,
} from './ia.tipos.js'
import * as servicio from './ia.servicio.js'

// POST /api/ia/chat  ─ público
export const chat = async (req: Request, res: Response): Promise<void> => {
  const r = esquemaChatMensaje.safeParse(req.body)
  if (!r.success) { respuestaError(res, 'Datos inválidos', 400, r.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.chatAgencia(r.data))
  } catch (e) {
    respuestaError(res, e instanceof Error ? e.message : 'Error en chat IA', 500)
  }
}

// POST /api/ia/propuesta  ─ admin
export const propuesta = async (req: Request, res: Response): Promise<void> => {
  const r = esquemaGenerarPropuesta.safeParse(req.body)
  if (!r.success) { respuestaError(res, 'Datos inválidos', 400, r.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.generarPropuesta(r.data.prospectoId), 'Propuesta generada')
  } catch (e) {
    respuestaError(res, e instanceof Error ? e.message : 'Error generando propuesta', 500)
  }
}

// POST /api/ia/analizar-prospecto  ─ admin
export const analizarProspecto = async (req: Request, res: Response): Promise<void> => {
  const r = esquemaAnalizarProspecto.safeParse(req.body)
  if (!r.success) { respuestaError(res, 'Datos inválidos', 400, r.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.analizarProspecto(r.data.prospectoId), 'Análisis completado')
  } catch (e) {
    respuestaError(res, e instanceof Error ? e.message : 'Error analizando prospecto', 500)
  }
}

// POST /api/ia/descripcion-proyecto  ─ admin
export const descripcionProyecto = async (req: Request, res: Response): Promise<void> => {
  const r = esquemaGenerarDescripcion.safeParse(req.body)
  if (!r.success) { respuestaError(res, 'Datos inválidos', 400, r.error.flatten().fieldErrors); return }
  try {
    respuestaExito(res, await servicio.generarDescripcion(r.data), 'Descripción generada')
  } catch (e) {
    respuestaError(res, e instanceof Error ? e.message : 'Error generando descripción', 500)
  }
}