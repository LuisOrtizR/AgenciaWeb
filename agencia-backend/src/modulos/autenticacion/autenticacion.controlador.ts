import { Request, Response }             from 'express'
import { respuestaExito, respuestaError } from '../../utilidades/respuesta.js'
import { SolicitudAutenticada }           from '../../tipos.js'
import {
  esquemaRegistro,
  esquemaLogin,
  esquemaRefrescarToken,
  esquemaSolicitarReset,
  esquemaResetearContrasena,
} from './autenticacion.tipos.js'
import * as servicio from './autenticacion.servicio.js'

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

export const olvidéContrasena = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaSolicitarReset.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Correo inválido', 400)
    return
  }
  try {
    const datos = await servicio.solicitarReset(resultado.data)
    respuestaExito(res, datos, datos.mensaje)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al procesar solicitud'
    respuestaError(res, mensaje, 500)
  }
}

export const resetContrasena = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaResetearContrasena.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.resetearContrasena(resultado.data)
    respuestaExito(res, datos, datos.mensaje)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al resetear contraseña'
    respuestaError(res, mensaje, 400)
  }
}