import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth'

const BASE_URL = import.meta.env.VITE_URL_API ?? 'http://localhost:3001/api'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

let estaRefrescando = false
let colaEspera: Array<{
  resolver: (token: string) => void
  rechazar: (error: unknown) => void
}> = []

const procesarCola = (error: unknown, token: string | null = null): void => {
  colaEspera.forEach(({ resolver, rechazar }) =>
    error ? rechazar(error) : resolver(token!)
  )
  colaEspera = []
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore().tokenAcceso
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const solicitudOriginal = error.config as AxiosRequestConfig & { _reintentado?: boolean }

    if (error.response?.status !== 401 || solicitudOriginal._reintentado) {
      return Promise.reject(error)
    }

    const esRutaAuth =
      solicitudOriginal.url?.includes('/autenticacion/refrescar') ||
      solicitudOriginal.url?.includes('/autenticacion/login')

    if (esRutaAuth) return Promise.reject(error)

    solicitudOriginal._reintentado = true

    if (estaRefrescando) {
      return new Promise<string>((resolver, rechazar) => {
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
      const authStore = useAuthStore()
      const tokenRefresco = authStore.tokenRefresco

      if (!tokenRefresco) throw new Error('No hay token de refresco disponible')

      const { data } = await axios.post(`${BASE_URL}/autenticacion/refrescar`, { tokenRefresco })
      const nuevoToken: string = data.datos.tokenAcceso

      authStore.actualizarTokenAcceso(nuevoToken)
      procesarCola(null, nuevoToken)

      if (solicitudOriginal.headers) {
        solicitudOriginal.headers['Authorization'] = `Bearer ${nuevoToken}`
      }
      return api(solicitudOriginal)
    } catch (errorRefresh) {
      procesarCola(errorRefresh, null)
      useAuthStore().cerrarSesion()
      return Promise.reject(errorRefresh)
    } finally {
      estaRefrescando = false
    }
  }
)

export default api