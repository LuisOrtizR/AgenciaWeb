import { Request, Response } from 'express'
import { respuestaExito, respuestaError, respuestaPaginada } from '../../utilidades/respuesta.js'
import { SolicitudAutenticada } from '../../tipos.js'
import {
  esquemaActualizarPerfil,
  esquemaCambiarContrasena,
  esquemaCrearUsuario,
  esquemaActualizarUsuario,
  esquemaFiltrosUsuario,
} from './usuarios.tipos.js'
import * as servicio from './usuarios.servicio.js'

/**
 * Controladores del módulo de usuarios.
 * Propio:   perfil, actualizar perfil, cambiar contraseña
 * ADMIN:    listar, crear, actualizar, activar, desactivar, cambiar rol, eliminar, resumen
 */

// GET /api/usuarios/perfil  — usuario ve su propio perfil
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

// PUT /api/usuarios/perfil  — usuario actualiza su propio perfil
export const actualizarPerfil = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarPerfil.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  const solicitud = req as SolicitudAutenticada
  const usuarioId = solicitud.usuario!.id
  try {
    const datos = await servicio.actualizarPerfil(usuarioId, resultado.data)
    respuestaExito(res, datos, 'Perfil actualizado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al actualizar perfil'
    respuestaError(res, mensaje, 400)
  }
}

// PATCH /api/usuarios/contrasena  — usuario cambia su propia contraseña
export const cambiarContrasena = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCambiarContrasena.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  const solicitud = req as SolicitudAutenticada
  const usuarioId = solicitud.usuario!.id
  try {
    const datos = await servicio.cambiarContrasena(usuarioId, resultado.data)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al cambiar contraseña'
    respuestaError(res, mensaje, 400)
  }
}

// GET /api/usuarios/resumen  — solo ADMIN
export const resumen = async (_req: Request, res: Response): Promise<void> => {
  try {
    const datos = await servicio.resumenUsuarios()
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al obtener resumen'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/usuarios?pagina=1&rol=CLIENTE&activo=true  — solo ADMIN
export const listar = async (req: Request, res: Response): Promise<void> => {
  const filtros = esquemaFiltrosUsuario.parse(req.query)
  try {
    const { datos, paginacion } = await servicio.listarUsuarios(filtros)
    respuestaPaginada(res, datos, paginacion)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al listar usuarios'
    respuestaError(res, mensaje, 500)
  }
}

// GET /api/usuarios/:id  — solo ADMIN
export const obtenerPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.obtenerUsuarioPorId(id)
    respuestaExito(res, datos)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Usuario no encontrado'
    respuestaError(res, mensaje, 404)
  }
}

// POST /api/usuarios  — solo ADMIN
export const crear = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaCrearUsuario.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const datos = await servicio.crearUsuario(resultado.data)
    respuestaExito(res, datos, 'Usuario creado exitosamente', 201)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al crear usuario'
    respuestaError(res, mensaje, 400)
  }
}

// PUT /api/usuarios/:id  — solo ADMIN
export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const resultado = esquemaActualizarUsuario.safeParse(req.body)
  if (!resultado.success) {
    respuestaError(res, 'Datos inválidos', 400, resultado.error.flatten().fieldErrors)
    return
  }
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.actualizarUsuario(id, resultado.data)
    respuestaExito(res, datos, 'Usuario actualizado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al actualizar usuario'
    respuestaError(res, mensaje, 400)
  }
}

// PATCH /api/usuarios/:id/activar  — solo ADMIN
export const activar = async (req: Request, res: Response): Promise<void> => {
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.activarUsuario(id)
    respuestaExito(res, datos, 'Usuario activado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al activar usuario'
    respuestaError(res, mensaje, 400)
  }
}

// PATCH /api/usuarios/:id/desactivar  — solo ADMIN
export const desactivar = async (req: Request, res: Response): Promise<void> => {
  const solicitud = req as SolicitudAutenticada
  const adminId   = solicitud.usuario!.id
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.desactivarUsuario(id, adminId)
    respuestaExito(res, datos, 'Usuario desactivado exitosamente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al desactivar usuario'
    respuestaError(res, mensaje, 400)
  }
}

// PATCH /api/usuarios/:id/rol  — solo ADMIN
export const cambiarRol = async (req: Request, res: Response): Promise<void> => {
  const solicitud = req as SolicitudAutenticada
  const adminId   = solicitud.usuario!.id
  const { rol }   = req.body as { rol?: string }

  if (!rol || !['ADMIN', 'CLIENTE'].includes(rol)) {
    respuestaError(res, 'Rol inválido. Usa ADMIN o CLIENTE', 400)
    return
  }
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.cambiarRol(id, rol as 'ADMIN' | 'CLIENTE', adminId)
    respuestaExito(res, datos, `Rol cambiado a ${rol} exitosamente`)
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al cambiar rol'
    respuestaError(res, mensaje, 400)
  }
}

// DELETE /api/usuarios/:id  — solo ADMIN
export const eliminar = async (req: Request, res: Response): Promise<void> => {
  const solicitud = req as SolicitudAutenticada
  const adminId   = solicitud.usuario!.id
  try {
    const id    = req.params['id'] as string
    const datos = await servicio.eliminarUsuario(id, adminId)
    respuestaExito(res, datos, 'Usuario eliminado permanentemente')
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al eliminar usuario'
    respuestaError(res, mensaje, 400)
  }
}