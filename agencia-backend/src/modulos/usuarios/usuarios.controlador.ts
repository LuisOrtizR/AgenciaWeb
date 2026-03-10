import { Request, Response }                                  from 'express'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import { SolicitudAutenticada }                              from '../../tipos.js'
import {
  esquemaActualizarPerfil,
  esquemaCambiarContrasena,
  esquemaCrearUsuario,
  esquemaActualizarUsuario,
  esquemaCambiarRol,
  esquemaFiltrosUsuario,
} from './usuarios.tipos.js'
import * as servicio from './usuarios.servicio.js'


const uid = (req: Request) => (req as SolicitudAutenticada).usuario!.id

const manejarError = (res: Response, error: unknown, codigoDefecto = 400): void => {
  const mensaje = error instanceof Error ? error.message : 'Error inesperado'
  const codigo  =
    mensaje.includes('no encontrado')  ? 404 :
    mensaje.includes('Ya existe')      ? 409 :
    codigoDefecto
  respuestaError(res, mensaje, codigo)
}


export const perfil = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.obtenerPerfil(uid(req)))
  } catch (error) {
    manejarError(res, error, 404)
  }
}


export const actualizarPerfil = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarPerfil.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    respuestaExito(res, await servicio.actualizarPerfil(uid(req), resultado.data), 'Perfil actualizado correctamente')
  } catch (error) {
    manejarError(res, error)
  }
}


export const cambiarContrasena = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCambiarContrasena.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    respuestaExito(res, await servicio.cambiarContrasena(uid(req), resultado.data))
  } catch (error) {
    manejarError(res, error)
  }
}


export const resumen = async (_req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.resumenUsuarios())
  } catch (error) {
    manejarError(res, error, 500)
  }
}


export const listar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaFiltrosUsuario.safeParse(req.query)
  if (!resultado.success) {
    respuestaError(res, 'Parametros de filtro invalidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const { datos, paginacion } = await servicio.listarUsuarios(resultado.data)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    manejarError(res, error, 500)
  }
}


export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.obtenerUsuarioPorId(req.params['id']))
  } catch (error) {
    manejarError(res, error, 404)
  }
}


export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearUsuario.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    respuestaExito(res, await servicio.crearUsuario(resultado.data), 'Usuario creado correctamente', 201)
  } catch (error) {
    manejarError(res, error)
  }
}


export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarUsuario.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    respuestaExito(res, await servicio.actualizarUsuario(req.params['id'], resultado.data), 'Usuario actualizado correctamente')
  } catch (error) {
    manejarError(res, error)
  }
}


export const activar = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.activarUsuario(req.params['id']), 'Usuario activado correctamente')
  } catch (error) {
    manejarError(res, error)
  }
}


export const desactivar = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.desactivarUsuario(req.params['id'], uid(req)), 'Usuario desactivado correctamente')
  } catch (error) {
    manejarError(res, error)
  }
}


export const cambiarRol = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCambiarRol.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos invalidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.cambiarRol(req.params['id'], resultado.data.rol, uid(req))
    respuestaExito(res, datos, `Rol actualizado a ${resultado.data.rol}`)
  } catch (error) {
    manejarError(res, error)
  }
}


export const eliminar = async (req: Request, res: Response): Promise<void> => {
  try {
    respuestaExito(res, await servicio.eliminarUsuario(req.params['id'], uid(req)), 'Usuario eliminado permanentemente')
  } catch (error) {
    manejarError(res, error)
  }
}