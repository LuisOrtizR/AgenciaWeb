import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notificacion } from '@/types'

export const useUiStore = defineStore('ui', () => {
  const sidebarAbierto = ref(true)
  const cargandoGlobal = ref(false)
  const notificaciones = ref<Notificacion[]>([])

  const hayNotificaciones = computed(() => notificaciones.value.length > 0)

  const alternarSidebar = (): void => { sidebarAbierto.value = !sidebarAbierto.value }
  const abrirSidebar    = (): void => { sidebarAbierto.value = true }
  const cerrarSidebar   = (): void => { sidebarAbierto.value = false }

  const agregarNotificacion = (notificacion: Omit<Notificacion, 'id'>, duracionMs = 4000): string => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    notificaciones.value.push({ ...notificacion, id })
    if (duracionMs > 0) setTimeout(() => eliminarNotificacion(id), duracionMs)
    return id
  }

  const eliminarNotificacion = (id: string): void => {
    const indice = notificaciones.value.findIndex((n) => n.id === id)
    if (indice !== -1) notificaciones.value.splice(indice, 1)
  }

  const limpiarNotificaciones = (): void => { notificaciones.value = [] }

  const exito      = (titulo: string, mensaje = '', duracion = 4000): string =>
    agregarNotificacion({ tipo: 'exito', titulo, mensaje }, duracion)

  const error      = (titulo: string, mensaje = '', duracion = 5000): string =>
    agregarNotificacion({ tipo: 'error', titulo, mensaje }, duracion)

  const info       = (titulo: string, mensaje = '', duracion = 4000): string =>
    agregarNotificacion({ tipo: 'info', titulo, mensaje }, duracion)

  const advertencia = (titulo: string, mensaje = '', duracion = 4500): string =>
    agregarNotificacion({ tipo: 'advertencia', titulo, mensaje }, duracion)

  const iniciarCarga  = (): void => { cargandoGlobal.value = true }
  const terminarCarga = (): void => { cargandoGlobal.value = false }

  return {
    sidebarAbierto,
    cargandoGlobal,
    notificaciones,
    hayNotificaciones,
    alternarSidebar,
    abrirSidebar,
    cerrarSidebar,
    agregarNotificacion,
    eliminarNotificacion,
    limpiarNotificaciones,
    exito,
    error,
    info,
    advertencia,
    iniciarCarga,
    terminarCarga,
  }
})