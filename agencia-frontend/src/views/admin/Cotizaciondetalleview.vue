<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { cotizacionesServicio } from '@/services/servicios'
import AppBoton from '@/components/ui/AppBoton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import type { Cotizacion, EstadoCotizacion } from '@/types'

const route   = useRoute()
const router  = useRouter()
const uiStore = useUiStore()

const cotizacion  = ref<Cotizacion | null>(null)
const cargando    = ref(true)
const modalEstado = ref(false)
const guardando   = ref(false)

const formularioEstado = ref<{ estado: EstadoCotizacion; notas: string | null }>({
  estado: 'PENDIENTE',
  notas:  null,
})

const ESTADOS: EstadoCotizacion[] = ['PENDIENTE', 'ENVIADA', 'ACEPTADA', 'RECHAZADA']

const CONFIG_ESTADO: Record<EstadoCotizacion, {
  etiqueta: string
  variante: 'advertencia' | 'info' | 'exito' | 'error'
  color:    string
  bg:       string
  icono:    string
}> = {
  PENDIENTE: {
    etiqueta: 'Pendiente',
    variante: 'advertencia',
    color:    'text-amber-400',
    bg:       'bg-amber-500/10 border-amber-500/20',
    icono:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  ENVIADA: {
    etiqueta: 'Enviada',
    variante: 'info',
    color:    'text-blue-400',
    bg:       'bg-blue-500/10 border-blue-500/20',
    icono:    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  ACEPTADA: {
    etiqueta: 'Aceptada',
    variante: 'exito',
    color:    'text-emerald-400',
    bg:       'bg-emerald-500/10 border-emerald-500/20',
    icono:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  RECHAZADA: {
    etiqueta: 'Rechazada',
    variante: 'error',
    color:    'text-red-400',
    bg:       'bg-red-500/10 border-red-500/20',
    icono:    'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
}

const formatearMoneda = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const formatearFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(f))

const inicialProspecto = computed(() =>
  cotizacion.value?.prospecto.nombre?.[0]?.toUpperCase() ?? '?'
)

const extras = computed(() => cotizacion.value?.extras as string[] ?? [])

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

const abrirModalEstado = () => {
  if (!cotizacion.value) return
  formularioEstado.value = { estado: cotizacion.value.estado, notas: cotizacion.value.notas }
  modalEstado.value = true
}

const guardarEstado = async () => {
  if (!cotizacion.value) return
  guardando.value = true
  try {
    await cotizacionesServicio.actualizarEstado(cotizacion.value.id, formularioEstado.value)
    uiStore.exito('Estado actualizado')
    modalEstado.value = false
    await cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar')
  } finally {
    guardando.value = false
  }
}

const cambioRapidoEstado = async (nuevoEstado: EstadoCotizacion) => {
  if (!cotizacion.value || cotizacion.value.estado === nuevoEstado) return
  try {
    await cotizacionesServicio.actualizarEstado(cotizacion.value.id, {
      estado: nuevoEstado,
      notas:  cotizacion.value.notas,
    })
    uiStore.exito(`Cotización marcada como ${CONFIG_ESTADO[nuevoEstado].etiqueta}`)
    await cargar()
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
  if (!cotizacion.value) return
  if (!confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return
  try {
    await cotizacionesServicio.eliminar(cotizacion.value.id)
    uiStore.exito('Cotización eliminada')
    router.push({ name: 'admin-cotizaciones' })
  } catch (err: unknown) {
    const mensaje = err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: { mensaje?: string } } }).response?.data?.mensaje
      : undefined
    uiStore.error('Error', mensaje ?? 'No se pudo eliminar')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex items-center gap-2 text-sm">
      <RouterLink
        :to="{ name: 'admin-cotizaciones' }"
        class="text-slate-500 hover:text-white transition-colors flex items-center gap-1.5"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Cotizaciones
      </RouterLink>
      <span class="text-slate-700">/</span>
      <span class="text-slate-400">Detalle</span>
    </div>

    <div v-if="cargando" class="space-y-4">
      <div class="h-32 bg-white/5 rounded-2xl animate-pulse" />
      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2 h-64 bg-white/5 rounded-2xl animate-pulse" />
        <div class="h-64 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>

    <template v-else-if="cotizacion">
      <div class="relative bg-[#13151f] border border-white/5 rounded-2xl p-6 overflow-hidden">
        <div
          class="absolute inset-0 opacity-30 pointer-events-none"
          :class="{
            'bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_60%)]':  cotizacion.estado === 'PENDIENTE',
            'bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_60%)]':  cotizacion.estado === 'ENVIADA',
            'bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_60%)]':  cotizacion.estado === 'ACEPTADA',
            'bg-[radial-gradient(ellipse_at_top_right,rgba(239,68,68,0.08),transparent_60%)]':   cotizacion.estado === 'RECHAZADA',
          }"
        />

        <div class="relative flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
                :class="`${CONFIG_ESTADO[cotizacion.estado].bg} ${CONFIG_ESTADO[cotizacion.estado].color}`"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="CONFIG_ESTADO[cotizacion.estado].icono" />
                </svg>
                {{ CONFIG_ESTADO[cotizacion.estado].etiqueta }}
              </div>
              <span class="text-xs text-slate-500">{{ formatearFecha(cotizacion.creadoEn) }}</span>
            </div>

            <div>
              <p class="text-4xl font-black text-white tracking-tight tabular-nums">
                {{ formatearMoneda(cotizacion.precioTotal) }}
              </p>
              <p class="text-slate-400 text-sm mt-1">{{ cotizacion.servicio.nombre }}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 text-slate-300 hover:text-white text-sm font-medium transition-all"
              @click="abrirModalEstado"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Cambiar estado
            </button>

            <button
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-blue-500/10 border border-white/8 hover:border-blue-500/20 text-slate-300 hover:text-blue-300 text-sm font-medium transition-all"
              @click="duplicar"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicar
            </button>

            <button
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium transition-all"
              @click="eliminar"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 space-y-5">
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Prospecto</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center text-base font-black text-violet-300">
                  {{ inicialProspecto }}
                </div>
                <div>
                  <p class="font-semibold text-white">{{ cotizacion.prospecto.nombre }}</p>
                  <p class="text-sm text-slate-400">{{ cotizacion.prospecto.correo }}</p>
                  <p v-if="cotizacion.prospecto.telefono" class="text-xs text-slate-500 mt-0.5">
                    {{ cotizacion.prospecto.telefono }}
                  </p>
                </div>
              </div>
              <RouterLink
                :to="{ name: 'admin-prospecto-detalle', params: { id: cotizacion.prospecto.id } }"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 text-violet-300 text-xs font-medium transition-all"
              >
                Ver prospecto
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </RouterLink>
            </div>
          </div>

          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Detalle del servicio</p>
            <div class="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 mb-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                  <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-white text-sm">{{ cotizacion.servicio.nombre }}</p>
                  <p class="text-xs text-slate-500">Servicio base</p>
                </div>
              </div>
              <p class="text-lg font-black text-white tabular-nums">{{ formatearMoneda(cotizacion.precioTotal) }}</p>
            </div>

            <template v-if="extras.length">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Extras incluidos</p>
              <ul class="space-y-2">
                <li
                  v-for="extra in extras"
                  :key="extra"
                  class="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-sm text-slate-300"
                >
                  <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ extra }}
                </li>
              </ul>
            </template>
            <p v-else class="text-xs text-slate-600 italic">Sin extras adicionales</p>
          </div>

          <div v-if="cotizacion.notas" class="bg-[#13151f] border border-amber-500/15 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-xs font-semibold text-amber-400 uppercase tracking-wider">Notas internas</p>
            </div>
            <p class="text-slate-300 text-sm leading-relaxed">{{ cotizacion.notas }}</p>
          </div>
        </div>

        <div class="space-y-5">
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Flujo del proceso</p>
            <div class="relative">
              <div class="absolute left-4.5 top-6 bottom-6 w-px bg-white/8" />
              <div class="space-y-3">
                <button
                  v-for="estado in ESTADOS"
                  :key="estado"
                  class="relative w-full flex items-center gap-3 p-2.5 rounded-xl text-sm transition-all"
                  :class="cotizacion.estado === estado
                    ? `${CONFIG_ESTADO[estado].bg} ${CONFIG_ESTADO[estado].color} border font-semibold`
                    : 'text-slate-500 hover:text-white hover:bg-white/5'"
                  @click="cambioRapidoEstado(estado)"
                >
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all z-10"
                    :class="cotizacion.estado === estado
                      ? 'border-current bg-current/20'
                      : 'border-white/10 bg-[#13151f]'"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="CONFIG_ESTADO[estado].icono" />
                    </svg>
                  </div>
                  <span>{{ CONFIG_ESTADO[estado].etiqueta }}</span>
                  <svg v-if="cotizacion.estado === estado" class="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="cotizacion.estado === 'ENVIADA'" class="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              El correo fue enviado al prospecto automáticamente.
            </div>
          </div>

          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Creada por</p>
            <div v-if="cotizacion.usuario" class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center text-xs font-black text-violet-300">
                {{ cotizacion.usuario.nombre?.[0]?.toUpperCase() ?? '?' }}
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ cotizacion.usuario.nombre }}</p>
                <p class="text-xs text-slate-400">{{ cotizacion.usuario.correo }}</p>
              </div>
            </div>
            <div v-else class="flex items-center gap-2 text-slate-500 text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
              Generada por el sistema
            </div>
          </div>

          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5 space-y-3">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Información</p>
            <div class="space-y-2.5 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-slate-500">ID</span>
                <span class="text-slate-400 font-mono text-xs truncate max-w-28" :title="cotizacion.id">
                  {{ cotizacion.id.slice(0, 8) }}…
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500">Creada</span>
                <span class="text-slate-300 text-xs">{{ formatearFecha(cotizacion.creadoEn) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500">Servicio ID</span>
                <span class="text-slate-400 font-mono text-xs">{{ cotizacion.servicioId.slice(0, 8) }}…</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <AppModal :abierto="modalEstado" titulo="Actualizar estado" tamano="sm" @cerrar="modalEstado = false">
      <div class="space-y-5">
        <div v-if="cotizacion" class="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
          <div class="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-sm font-black text-violet-300 shrink-0">
            {{ inicialProspecto }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-white truncate">{{ cotizacion.prospecto.nombre }}</p>
            <p class="text-sm text-slate-400">{{ formatearMoneda(cotizacion.precioTotal) }} · {{ cotizacion.servicio.nombre }}</p>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nuevo estado</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="estado in ESTADOS"
              :key="estado"
              class="flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all"
              :class="formularioEstado.estado === estado
                ? `${CONFIG_ESTADO[estado].bg} ${CONFIG_ESTADO[estado].color} border`
                : 'bg-white/3 border-white/8 text-slate-400 hover:text-white hover:border-white/15'"
              @click="formularioEstado.estado = estado"
            >
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="CONFIG_ESTADO[estado].icono" />
              </svg>
              {{ CONFIG_ESTADO[estado].etiqueta }}
            </button>
          </div>
        </div>

        <div v-if="formularioEstado.estado === 'ENVIADA'" class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
          <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Se enviará un correo automático al prospecto con los detalles y el precio de la cotización.
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Notas del cambio</label>
          <textarea
            v-model="formularioEstado.notas"
            rows="3"
            placeholder="Motivo del cambio, observaciones..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all resize-none"
          />
        </div>
      </div>

      <template #footer>
        <AppBoton variante="fantasma" @click="modalEstado = false">Cancelar</AppBoton>
        <AppBoton variante="primario" :cargando="guardando" @click="guardarEstado">
          Confirmar cambio
        </AppBoton>
      </template>
    </AppModal>
  </div>
</template>