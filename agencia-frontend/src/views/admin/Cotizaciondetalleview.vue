<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { cotizacionesServicio } from '@/services/servicios'
import AppInsignia from '@/components/ui/AppInsignia.vue'
import AppBoton   from '@/components/ui/AppBoton.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import type { Cotizacion, EstadoCotizacion } from '@/types'

const route   = useRoute()
const router  = useRouter()
const uiStore = useUiStore()

const cotizacion   = ref<Cotizacion | null>(null)
const cargando     = ref(true)
const modalEstado  = ref(false)

const formularioEstado = ref<{ estado: EstadoCotizacion; notas: string | null }>({
  estado: 'PENDIENTE',
  notas:  null,
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ESTADOS: EstadoCotizacion[] = ['PENDIENTE', 'ENVIADA', 'ACEPTADA', 'RECHAZADA']

const varianteEstado = (e: EstadoCotizacion) => ({
  PENDIENTE: 'advertencia',
  ENVIADA:   'info',
  ACEPTADA:  'exito',
  RECHAZADA: 'error',
} as const)[e]

const etiquetaEstado = (e: EstadoCotizacion) => ({
  PENDIENTE: 'Pendiente',
  ENVIADA:   'Enviada',
  ACEPTADA:  'Aceptada',
  RECHAZADA: 'Rechazada',
}[e])

const formatearMoneda = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const formatearFechaCorta = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f))

const colorEstado = (e: EstadoCotizacion) => ({
  PENDIENTE: 'bg-yellow-400',
  ENVIADA:   'bg-blue-400',
  ACEPTADA:  'bg-green-400',
  RECHAZADA: 'bg-red-400',
}[e])

// ─── Carga ───────────────────────────────────────────────────────────────────

const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await cotizacionesServicio.obtenerPorId(route.params.id as string)
    cotizacion.value = data.datos
  } catch {
    uiStore.error('Error', 'No se pudo cargar la cotización')
    router.push({ name: 'admin-cotizaciones' })
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

// ─── Acciones ─────────────────────────────────────────────────────────────────

const abrirModalEstado = () => {
  if (!cotizacion.value) return
  formularioEstado.value = {
    estado: cotizacion.value.estado,
    notas:  cotizacion.value.notas,
  }
  modalEstado.value = true
}

const guardarEstado = async () => {
  if (!cotizacion.value) return
  try {
    await cotizacionesServicio.actualizarEstado(cotizacion.value.id, formularioEstado.value)
    uiStore.exito('Estado actualizado')
    modalEstado.value = false
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el estado')
  }
}

const cambioRapidoEstado = async (nuevoEstado: EstadoCotizacion) => {
  if (!cotizacion.value || cotizacion.value.estado === nuevoEstado) return
  try {
    await cotizacionesServicio.actualizarEstado(cotizacion.value.id, {
      estado: nuevoEstado,
      notas:  cotizacion.value.notas,
    })
    uiStore.exito(`Cotización marcada como ${etiquetaEstado(nuevoEstado)}`)
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar')
  }
}

const duplicar = async () => {
  if (!cotizacion.value) return
  try {
    await cotizacionesServicio.duplicar(cotizacion.value.id)
    uiStore.exito('Cotización duplicada', 'Se creó una copia como PENDIENTE')
    router.push({ name: 'admin-cotizaciones' })
  } catch {
    uiStore.error('Error', 'No se pudo duplicar')
  }
}

const eliminar = async () => {
  if (!cotizacion.value || !confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return
  try {
    await cotizacionesServicio.eliminar(cotizacion.value.id)
    uiStore.exito('Cotización eliminada')
    router.push({ name: 'admin-cotizaciones' })
  } catch {
    uiStore.error('Error', 'No se pudo eliminar')
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">

    <!-- Breadcrumb -->
    <div class="flex items-center gap-3">
      <RouterLink
        :to="{ name: 'admin-cotizaciones' }"
        class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Cotizaciones
      </RouterLink>
    </div>

    <!-- Skeleton -->
    <div v-if="cargando" class="space-y-4">
      <div class="h-28 bg-white/5 rounded-2xl animate-pulse" />
      <div class="grid grid-cols-2 gap-4">
        <div class="h-40 bg-white/5 rounded-2xl animate-pulse" />
        <div class="h-40 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>

    <template v-else-if="cotizacion">

      <!-- Header: monto + estado + acciones -->
      <div class="bg-[#13151f] border border-white/5 rounded-2xl p-6">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <AppInsignia :variante="varianteEstado(cotizacion.estado)" punto>
                {{ etiquetaEstado(cotizacion.estado) }}
              </AppInsignia>
              <span class="text-xs text-gray-500">{{ formatearFechaCorta(cotizacion.creadoEn) }}</span>
            </div>
            <p class="text-4xl font-black text-white">{{ formatearMoneda(cotizacion.precioTotal) }}</p>
            <p class="text-gray-400 text-sm mt-1">{{ cotizacion.servicio.nombre }}</p>
          </div>

          <!-- Acciones rápidas -->
          <div class="flex flex-wrap gap-2">
            <AppBoton variante="secundario" tamano="sm" @click="abrirModalEstado">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Cambiar estado
            </AppBoton>
            <AppBoton variante="secundario" tamano="sm" @click="duplicar">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicar
            </AppBoton>
            <AppBoton variante="peligro" tamano="sm" @click="eliminar">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </AppBoton>
          </div>
        </div>
      </div>

      <!-- Grid de detalles -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- Col izquierda: detalles principales -->
        <div class="lg:col-span-2 space-y-5">

          <!-- Prospecto asociado -->
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-white mb-4">Prospecto</h2>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-300">
                  {{ cotizacion.prospecto.nombre[0].toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-medium text-white">{{ cotizacion.prospecto.nombre }}</p>
                  <p class="text-xs text-gray-500">{{ cotizacion.prospecto.correo }}</p>
                </div>
              </div>
              <RouterLink
                :to="{ name: 'admin-prospecto-detalle', params: { id: cotizacion.prospecto.id } }"
                class="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Ver prospecto
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </RouterLink>
            </div>
          </div>

          <!-- Servicio + extras -->
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 class="text-sm font-semibold text-white">Detalle del servicio</h2>

            <div class="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
              <div>
                <p class="text-sm font-medium text-white">{{ cotizacion.servicio.nombre }}</p>
                <p class="text-xs text-gray-500">Servicio base</p>
              </div>
              <p class="text-sm font-bold text-white">{{ formatearMoneda(cotizacion.precioTotal) }}</p>
            </div>

            <div v-if="cotizacion.extras.length" class="space-y-2">
              <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Extras incluidos</p>
              <ul class="space-y-1.5">
                <li
                  v-for="extra in cotizacion.extras"
                  :key="extra"
                  class="flex items-center gap-2 text-sm text-gray-200"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  {{ extra }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Notas -->
          <div v-if="cotizacion.notas" class="bg-[#13151f] border border-yellow-500/20 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 class="text-sm font-semibold text-yellow-300">Notas</h2>
            </div>
            <p class="text-gray-300 text-sm leading-relaxed">{{ cotizacion.notas }}</p>
          </div>
        </div>

        <!-- Col derecha: pipeline de estado -->
        <div class="space-y-5">
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-white mb-4">Estado del proceso</h2>
            <div class="space-y-2">
              <button
                v-for="estado in ESTADOS"
                :key="estado"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                :class="cotizacion.estado === estado
                  ? 'bg-violet-600/20 border border-violet-500/20 text-violet-300'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'"
                @click="cambioRapidoEstado(estado)"
              >
                <span class="w-2 h-2 rounded-full shrink-0" :class="colorEstado(estado)" />
                {{ etiquetaEstado(estado) }}
                <svg v-if="cotizacion.estado === estado" class="w-3.5 h-3.5 ml-auto text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Responsable -->
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-white mb-3">Creada por</h2>
            <div v-if="cotizacion.usuario" class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-violet-300">
                {{ cotizacion.usuario.nombre[0].toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ cotizacion.usuario.nombre }}</p>
                <p class="text-xs text-gray-500">{{ cotizacion.usuario.correo }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500">Sistema</p>
          </div>

          <!-- Fecha -->
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5 text-xs text-gray-500 space-y-2">
            <div class="flex justify-between">
              <span>Fecha creación</span>
              <span class="text-gray-300">{{ formatearFechaCorta(cotizacion.creadoEn) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal: cambiar estado -->
    <AppModal :abierto="modalEstado" titulo="Actualizar estado" tamano="sm" @cerrar="modalEstado = false">
      <div class="space-y-4">
        <div v-if="cotizacion" class="p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
          <p class="font-medium text-white">{{ cotizacion.prospecto.nombre }}</p>
          <p class="text-gray-400">{{ formatearMoneda(cotizacion.precioTotal) }} · {{ cotizacion.servicio.nombre }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-gray-200">Nuevo estado</label>
          <select
            v-model="formularioEstado.estado"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none"
          >
            <option v-for="e in ESTADOS" :key="e" :value="e">{{ etiquetaEstado(e) }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-gray-200">Notas (opcional)</label>
          <textarea
            v-model="formularioEstado.notas"
            rows="3"
            placeholder="Observaciones..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-gray-500 text-sm outline-none resize-none"
          />
        </div>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalEstado = false">Cancelar</AppBoton>
        <AppBoton variante="primario" @click="guardarEstado">Guardar</AppBoton>
      </template>
    </AppModal>
  </div>
</template>