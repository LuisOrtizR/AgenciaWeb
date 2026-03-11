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

const CLAVE_TOKEN_ACCESO   = 'nexova_token_acceso'
const CLAVE_TOKEN_REFRESCO = 'nexova_token_refresco'
const CLAVE_USUARIO        = 'nexova_usuario'

function extraerMensajeError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { mensaje?: string } } }).response
    return res?.data?.mensaje ?? 'Error desconocido'
  }
  if (err instanceof Error) return err.message
  return 'Error desconocido'
}

function parsearUsuarioGuardado(): Pick<Usuario, 'id' | 'nombre' | 'correo' | 'rol'> | null {
  try {
    const guardado = localStorage.getItem(CLAVE_USUARIO)
    return guardado ? JSON.parse(guardado) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const tokenAcceso   = ref<string | null>(localStorage.getItem(CLAVE_TOKEN_ACCESO))
  const tokenRefresco = ref<string | null>(localStorage.getItem(CLAVE_TOKEN_REFRESCO))
  const usuario       = ref<Pick<Usuario, 'id' | 'nombre' | 'correo' | 'rol'> | null>(parsearUsuarioGuardado())
  const cargando      = ref(false)
  const error         = ref<string | null>(null)

  const estaAutenticado = computed(() => !!tokenAcceso.value && !!usuario.value)
  const esAdmin         = computed(() => usuario.value?.rol === 'ADMIN')
  const esCliente       = computed(() => usuario.value?.rol === 'CLIENTE')
  const nombreUsuario   = computed(() => usuario.value?.nombre ?? '')

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

  const iniciarSesion = async (datos: DatosLogin): Promise<void> => {
    cargando.value = true
    error.value    = null
    try {
      const { data } = await api.post<RespuestaApi<RespuestaAuth>>('/autenticacion/login', datos)
      guardarSesion(data.datos)
    } catch (err) {
      const mensaje = extraerMensajeError(err)
      error.value   = mensaje
      throw new Error(mensaje)
    } finally {
      cargando.value = false
    }
  }

  const registrar = async (datos: DatosRegistro): Promise<void> => {
    cargando.value = true
    error.value    = null
    try {
      const { data } = await api.post<RespuestaApi<RespuestaAuth>>('/autenticacion/registrar', datos)
      guardarSesion(data.datos)
    } catch (err) {
      const mensaje = extraerMensajeError(err)
      error.value   = mensaje
      throw new Error(mensaje)
    } finally {
      cargando.value = false
    }
  }

  const cerrarSesion = (): void => limpiarSesion()

  const actualizarTokenAcceso = (nuevoToken: string): void => {
    tokenAcceso.value = nuevoToken
    localStorage.setItem(CLAVE_TOKEN_ACCESO, nuevoToken)
  }

  const obtenerPerfil = async (): Promise<UsuarioConConteo> => {
    const { data } = await api.get<RespuestaApi<UsuarioConConteo>>('/usuarios/perfil')
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

  const actualizarPerfil = async (datos: DatosActualizarPerfil): Promise<void> => {
    cargando.value = true
    error.value    = null
    try {
      const { data } = await api.put<RespuestaApi<Usuario>>('/usuarios/perfil', datos)
      if (usuario.value) {
        usuario.value = { ...usuario.value, nombre: data.datos.nombre }
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario.value))
      }
    } catch (err) {
      const mensaje = extraerMensajeError(err)
      error.value   = mensaje
      throw new Error(mensaje)
    } finally {
      cargando.value = false
    }
  }

  const cambiarContrasena = async (datos: DatosCambiarContrasena): Promise<void> => {
    cargando.value = true
    error.value    = null
    try {
      await api.patch('/usuarios/contrasena', datos)
    } catch (err) {
      const mensaje = extraerMensajeError(err)
      error.value   = mensaje
      throw new Error(mensaje)
    } finally {
      cargando.value = false
    }
  }

  const limpiarError      = (): void => { error.value = null }
  const establecerSesion  = (datos: RespuestaAuth): void => guardarSesion(datos)

  return {
    tokenAcceso,
    tokenRefresco,
    usuario,
    cargando,
    error,
    estaAutenticado,
    esAdmin,
    esCliente,
    nombreUsuario,
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