import { Request, Response }          from 'express'
import { respuestaExito, respuestaError } from '../../utilidades/respuesta.js'
import { SolicitudAutenticada }          from '../../tipos.js'
import {
  esquemaRegistro,
  esquemaLogin,
  esquemaRefrescarToken,
} from './autenticacion.tipos.js'
import * as servicio from './autenticacion.servicio.js'

/**
 * Controladores del módulo de autenticación.
 */

// POST /api/autenticacion/registrar
export const registrar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaRegistro.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.registrar(resultado.data)
    respuestaExito(res, datos, 'Cuenta creada exitosamente', 201)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al registrar'
    respuestaError(res, mensaje, 400)
  }
}

// POST /api/autenticacion/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaLogin.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.login(resultado.data)
    respuestaExito(res, datos, 'Sesión iniciada exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al iniciar sesión'
    respuestaError(res, mensaje, 401)
  }
}

// GET /api/autenticacion/perfil  (requiere auth)
export const perfil = async (req: Request, res: Response): Promise<void> => {
  const solicitud = req as SolicitudAutenticada
  const usuarioId = solicitud.usuario!.id
  try {
    const datos = await servicio.obtenerPerfil(usuarioId)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al obtener perfil'
    respuestaError(res, mensaje, 404)
  }
}

// POST /api/autenticacion/refrescar
export const refrescarToken = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaRefrescarToken.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Token de refresco requerido', 400)
    return
  }
  try {
    const datos = await servicio.refrescarToken(resultado.data.tokenRefresco)
    respuestaExito(res, datos, 'Token renovado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al refrescar token'
    respuestaError(res, mensaje, 401)
  }
}