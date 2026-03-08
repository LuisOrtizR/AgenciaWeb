/**
 * api.ts — Instancia central de Axios
 *
 * Características:
 * - Base URL desde variables de entorno
 * - Interceptor de solicitud → adjunta Bearer token automáticamente
 * - Interceptor de respuesta → maneja 401 y refresca token sin romper otras peticiones
 * - Cola de peticiones en espera mientras se refresca el token
 * - Logout automático si el refresh también falla
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth'

// ─── Instancia base ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_URL_API ?? 'http://localhost:3001/api',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Control del refresh ──────────────────────────────────────────────────────

let estaRefrescando = false
let colaEspera: Array<{
  resolver: (token: string) => void
  rechazar: (error: unknown) => void
}> = []

const procesarCola = (error: unknown, token: string | null = null): void => {
  colaEspera.forEach(({ resolver, rechazar }) => {
    if (error) {
      rechazar(error)
    } else {
      resolver(token!)
    }
  })
  colaEspera = []
}

// ─── Interceptor de SOLICITUD ─────────────────────────────────────────────────
// Adjunta el Bearer token en cada petición si existe

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    const token     = authStore.tokenAcceso

    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ─── Interceptor de RESPUESTA ─────────────────────────────────────────────────
// Maneja 401: intenta refrescar el token y reintentar la petición original

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const solicitudOriginal = error.config as AxiosRequestConfig & { _reintentado?: boolean }

    // Solo actuar en 401 y si no hemos reintentado ya
    if (error.response?.status !== 401 || solicitudOriginal._reintentado) {
      return Promise.reject(error)
    }

    // No intentar refrescar si falla el propio endpoint de refresco o login
    const esRutaAuth = solicitudOriginal.url?.includes('/autenticacion/refrescar') ||
                       solicitudOriginal.url?.includes('/autenticacion/login')

    if (esRutaAuth) {
      return Promise.reject(error)
    }

    solicitudOriginal._reintentado = true

    if (estaRefrescando) {
      // Encolar la petición hasta que el refresh termine
      return new Promise((resolver, rechazar) => {
        colaEspera.push({ resolver, rechazar })
      }).then((nuevoToken) => {
        if (solicitudOriginal.headers) {
          solicitudOriginal.headers['Authorization'] = `Bearer ${nuevoToken}`
        }
        return api(solicitudOriginal)
      })
    }

    estaRefrescando = true

    try {
      const authStore         = useAuthStore()
      const tokenRefresco     = authStore.tokenRefresco

      if (!tokenRefresco) {
        throw new Error('No hay token de refresco disponible')
      }

      // Llamar al endpoint de refresco directamente (sin interceptor para evitar loop)
      const { data } = await axios.post(
        `${import.meta.env.VITE_URL_API ?? 'http://localhost:3001/api'}/autenticacion/refrescar`,
        { tokenRefresco }
      )

      const nuevoToken = data.datos.tokenAcceso
      authStore.actualizarTokenAcceso(nuevoToken)

      procesarCola(null, nuevoToken)

      // Reintentar la solicitud original con el nuevo token
      if (solicitudOriginal.headers) {
        solicitudOriginal.headers['Authorization'] = `Bearer ${nuevoToken}`
      }

      return api(solicitudOriginal)
    } catch (errorRefresh) {
      procesarCola(errorRefresh, null)

      // Si el refresh falla → cerrar sesión
      const authStore = useAuthStore()
      authStore.cerrarSesion()

      return Promise.reject(errorRefresh)
    } finally {
      estaRefrescando = false
    }
  }
)

export default api