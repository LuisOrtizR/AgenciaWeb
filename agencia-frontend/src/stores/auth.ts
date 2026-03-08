/**
 * stores/auth.ts — Estado global de autenticación
 *
 * Maneja:
 * - Login / Registro / Logout
 * - Persistencia en localStorage (tokenAcceso, tokenRefresco, usuario)
 * - Refresco automático del token de acceso
 * - Getters útiles para el router y componentes
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import type {
  Usuario,
  DatosLogin,
  DatosRegistro,
  RespuestaAuth,
  DatosActualizarPerfil,
  DatosCambiarContrasena,
  RespuestaApi,
  UsuarioConConteo,
} from '@/types'

// Claves de localStorage
const CLAVE_TOKEN_ACCESO   = 'nexova_token_acceso'
const CLAVE_TOKEN_REFRESCO = 'nexova_token_refresco'
const CLAVE_USUARIO        = 'nexova_usuario'

export const useAuthStore = defineStore('auth', () => {
  // ─── Estado ─────────────────────────────────────────────────────────────────

  const tokenAcceso   = ref<string | null>(localStorage.getItem(CLAVE_TOKEN_ACCESO))
  const tokenRefresco = ref<string | null>(localStorage.getItem(CLAVE_TOKEN_REFRESCO))
  const usuario       = ref<Pick<Usuario, 'id' | 'nombre' | 'correo' | 'rol'> | null>(
    (() => {
      try {
        const guardado = localStorage.getItem(CLAVE_USUARIO)
        return guardado ? JSON.parse(guardado) : null
      } catch {
        return null
      }
    })()
  )
  const cargando  = ref(false)
  const error     = ref<string | null>(null)

  // ─── Getters ─────────────────────────────────────────────────────────────────

  const estaAutenticado = computed(() => !!tokenAcceso.value && !!usuario.value)
  const esAdmin         = computed(() => usuario.value?.rol === 'ADMIN')
  const esCliente       = computed(() => usuario.value?.rol === 'CLIENTE')
  const nombreUsuario   = computed(() => usuario.value?.nombre ?? '')

  // ─── Helpers privados ────────────────────────────────────────────────────────

  const guardarSesion = (datos: RespuestaAuth): void => {
    tokenAcceso.value   = datos.tokenAcceso
    tokenRefresco.value = datos.tokenRefresco
    usuario.value       = datos.usuario

    localStorage.setItem(CLAVE_TOKEN_ACCESO,   datos.tokenAcceso)
    localStorage.setItem(CLAVE_TOKEN_REFRESCO, datos.tokenRefresco)
    localStorage.setItem(CLAVE_USUARIO,        JSON.stringify(datos.usuario))
  }

  const limpiarSesion = (): void => {
    tokenAcceso.value   = null
    tokenRefresco.value = null
    usuario.value       = null

    localStorage.removeItem(CLAVE_TOKEN_ACCESO)
    localStorage.removeItem(CLAVE_TOKEN_REFRESCO)
    localStorage.removeItem(CLAVE_USUARIO)
  }

  // ─── Acciones ────────────────────────────────────────────────────────────────

  /**
   * Iniciar sesión con correo y contraseña.
   */
  const iniciarSesion = async (datos: DatosLogin): Promise<void> => {
    cargando.value = true
    error.value    = null
    try {
      const { data } = await api.post<RespuestaApi<RespuestaAuth>>(
        '/autenticacion/login',
        datos
      )
      guardarSesion(data.datos)
    } catch (err: unknown) {
      const mensaje = extraerMensajeError(err)
      error.value   = mensaje
      throw new Error(mensaje)
    } finally {
      cargando.value = false
    }
  }

  /**
   * Registrar nueva cuenta.
   */
  const registrar = async (datos: DatosRegistro): Promise<void> => {
    cargando.value = true
    error.value    = null
    try {
      const { data } = await api.post<RespuestaApi<RespuestaAuth>>(
        '/autenticacion/registrar',
        datos
      )
      guardarSesion(data.datos)
    } catch (err: unknown) {
      const mensaje = extraerMensajeError(err)
      error.value   = mensaje
      throw new Error(mensaje)
    } finally {
      cargando.value = false
    }
  }

  /**
   * Cerrar sesión — limpia tokens y usuario.
   */
  const cerrarSesion = (): void => {
    limpiarSesion()
  }

  /**
   * Actualizar el token de acceso (llamado por el interceptor de Axios).
   */
  const actualizarTokenAcceso = (nuevoToken: string): void => {
    tokenAcceso.value = nuevoToken
    localStorage.setItem(CLAVE_TOKEN_ACCESO, nuevoToken)
  }

  /**
   * Obtener perfil completo del usuario autenticado.
   */
  const obtenerPerfil = async (): Promise<UsuarioConConteo> => {
    const { data } = await api.get<RespuestaApi<UsuarioConConteo>>('/usuarios/perfil')
    // Actualizar nombre/rol en memoria si cambió
    if (usuario.value) {
      usuario.value = {
        ...usuario.value,
        nombre: data.datos.nombre,
        correo: data.datos.correo,
        rol:    data.datos.rol,
      }
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario.value))
    }
    return data.datos
  }

  /**
   * Actualizar perfil propio.
   */
  const actualizarPerfil = async (datos: DatosActualizarPerfil): Promise<void> => {
    cargando.value = true
    error.value    = null
    try {
      const { data } = await api.put<RespuestaApi<Usuario>>('/usuarios/perfil', datos)
      if (usuario.value) {
        usuario.value = {
          ...usuario.value,
          nombre: data.datos.nombre,
        }
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario.value))
      }
    } catch (err: unknown) {
      const mensaje = extraerMensajeError(err)
      error.value   = mensaje
      throw new Error(mensaje)
    } finally {
      cargando.value = false
    }
  }

  /**
   * Cambiar contraseña propia.
   */
  const cambiarContrasena = async (datos: DatosCambiarContrasena): Promise<void> => {
    cargando.value = true
    error.value    = null
    try {
      await api.patch('/usuarios/contrasena', datos)
    } catch (err: unknown) {
      const mensaje = extraerMensajeError(err)
      error.value   = mensaje
      throw new Error(mensaje)
    } finally {
      cargando.value = false
    }
  }

  /**
   * Limpiar error manualmente (útil al cerrar modales o cambiar de vista).
   */
  const limpiarError = (): void => {
    error.value = null
  }

  /**
   * Establecer sesión manualmente con datos de respuesta de auth.
   */
  const establecerSesion = (datos: RespuestaAuth): void => {
    guardarSesion(datos)
  }

  const extraerMensajeError = (err: unknown): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      const res = (err as { response?: { data?: { mensaje?: string } } }).response
      return res?.data?.mensaje ?? 'Error desconocido'
    }
    if (err instanceof Error) return err.message
    return 'Error desconocido'
  }

  // ─── Expose ──────────────────────────────────────────────────────────────────

  return {
    // Estado
    tokenAcceso,
    tokenRefresco,
    usuario,
    cargando,
    error,
    // Getters
    estaAutenticado,
    esAdmin,
    esCliente,
    nombreUsuario,
    // Acciones
    iniciarSesion,
    registrar,
    cerrarSesion,
    actualizarTokenAcceso,
    obtenerPerfil,
    actualizarPerfil,
    cambiarContrasena,
    limpiarError,
    establecerSesion,
  }
})