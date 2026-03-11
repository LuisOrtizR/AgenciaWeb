<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore }             from '@/stores/auth'
import { useUiStore }               from '@/stores/ui'
import { cotizacionesServicio }     from '@/services/servicios'
import type { Cotizacion, EstadoCotizacion } from '@/types'

const authStore = useAuthStore()
const uiStore   = useUiStore()

const cargando     = ref(true)
const respondiendo = ref<string | null>(null)
const cotizaciones = ref<Cotizacion[]>([])

const CONFIG_ESTADO: Record<EstadoCotizacion, { label: string; clase: string }> = {
  PENDIENTE: { label: 'Pendiente',          clase: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
  ENVIADA:   { label: 'Esperando respuesta', clase: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  ACEPTADA:  { label: 'Aceptada',           clase: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  RECHAZADA: { label: 'Rechazada',          clase: 'bg-red-500/15 text-red-400 border-red-500/20' },
}

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const formatFecha = (s: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(s))

const pendientes = computed(() => cotizaciones.value.filter(c => c.estado === 'ENVIADA').length)
const aceptadas  = computed(() => cotizaciones.value.filter(c => c.estado === 'ACEPTADA').length)

const iniciales = computed(() =>
  (authStore.nombreUsuario || 'U')
    .split(' ').slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('')
)

const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await cotizacionesServicio.misCotizaciones()
    cotizaciones.value = data.datos
  } catch {
    uiStore.error('Error', 'No se pudieron cargar las cotizaciones')
  } finally {
    cargando.value = false
  }
}

const responder = async (id: string, estado: 'ACEPTADA' | 'RECHAZADA') => {
  respondiendo.value = id
  try {
    const { data } = await cotizacionesServicio.responder(id, estado)
    const idx = cotizaciones.value.findIndex(c => c.id === id)
    if (idx !== -1) cotizaciones.value[idx] = data.datos
    uiStore.exito(
      estado === 'ACEPTADA' ? '¡Cotización aceptada!' : 'Cotización rechazada',
      estado === 'ACEPTADA'
        ? 'Nos pondremos en contacto pronto para comenzar.'
        : 'Puedes contactarnos si deseas ajustar la propuesta.'
    )
  } catch {
    uiStore.error('Error', 'No se pudo procesar tu respuesta')
  } finally {
    respondiendo.value = null
  }
}

onMounted(cargar)
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 pt-24 pb-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-white">Mis cotizaciones</h1>
        <p class="text-slate-400 text-sm mt-1">Revisa y responde las propuestas que te hemos enviado</p>
      </div>
      <div class="w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
        {{ iniciales }}
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div class="bg-[#13151f] border border-white/5 rounded-2xl p-4 text-center">
        <p class="text-2xl font-black text-white">{{ cotizaciones.length }}</p>
        <p class="text-xs text-slate-500 mt-1">Total</p>
      </div>
      <div class="bg-[#13151f] border border-blue-500/20 rounded-2xl p-4 text-center">
        <p class="text-2xl font-black text-blue-400">{{ pendientes }}</p>
        <p class="text-xs text-slate-500 mt-1">Por responder</p>
      </div>
      <div class="bg-[#13151f] border border-emerald-500/20 rounded-2xl p-4 text-center">
        <p class="text-2xl font-black text-emerald-400">{{ aceptadas }}</p>
        <p class="text-xs text-slate-500 mt-1">Aceptadas</p>
      </div>
    </div>

    <div v-if="!cargando && pendientes > 0" class="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
      <svg class="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-sm text-blue-300">
        Tienes <strong>{{ pendientes }}</strong> cotización{{ pendientes > 1 ? 'es' : '' }} esperando tu respuesta.
      </p>
    </div>

    <div v-if="cargando" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-32 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <div
      v-else-if="cotizaciones.length === 0"
      class="bg-[#13151f] border border-white/5 rounded-2xl p-12 flex flex-col items-center gap-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
        <svg class="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <div class="text-center">
        <p class="text-white font-semibold">Aún no tienes cotizaciones</p>
        <p class="text-slate-500 text-sm mt-1">Cuando solicites un proyecto recibirás propuestas aquí</p>
      </div>
      <RouterLink
        :to="{ name: 'contacto' }"
        class="mt-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/25"
      >
        Solicitar cotización →
      </RouterLink>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="cotizacion in cotizaciones"
        :key="cotizacion.id"
        class="bg-[#13151f] border rounded-2xl p-5 transition-all"
        :class="cotizacion.estado === 'ENVIADA' ? 'border-blue-500/25 shadow-lg shadow-blue-500/5' : 'border-white/5'"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h3 class="text-white font-semibold text-sm">{{ cotizacion.servicio.nombre }}</h3>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                :class="CONFIG_ESTADO[cotizacion.estado].clase"
              >
                {{ CONFIG_ESTADO[cotizacion.estado].label }}
              </span>
            </div>
            <p class="text-slate-500 text-xs mt-1">{{ formatFecha(cotizacion.creadoEn) }}</p>
          </div>
          <p class="text-white font-black text-lg shrink-0">{{ formatPrecio(cotizacion.precioTotal) }}</p>
        </div>

        <div v-if="cotizacion.extras?.length" class="flex flex-wrap gap-1.5 mt-3">
          <span
            v-for="extra in cotizacion.extras"
            :key="extra"
            class="px-2 py-0.5 rounded-lg bg-white/5 text-slate-400 text-xs border border-white/5"
          >
            {{ extra }}
          </span>
        </div>

        <p v-if="cotizacion.notas" class="mt-3 text-slate-400 text-xs leading-relaxed border-t border-white/5 pt-3">
          {{ cotizacion.notas }}
        </p>

        <div v-if="cotizacion.estado === 'ENVIADA'" class="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
          <p class="text-xs text-slate-500 flex-1">¿Aceptas esta propuesta?</p>
          <button
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            :class="respondiendo === cotizacion.id
              ? 'bg-red-500/30 text-red-300/50 cursor-not-allowed'
              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'"
            :disabled="respondiendo === cotizacion.id"
            @click="responder(cotizacion.id, 'RECHAZADA')"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Rechazar
          </button>
          <button
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            :class="respondiendo === cotizacion.id
              ? 'bg-emerald-600/40 text-white/50 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'"
            :disabled="respondiendo === cotizacion.id"
            @click="responder(cotizacion.id, 'ACEPTADA')"
          >
            <svg v-if="respondiendo === cotizacion.id" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Aceptar
          </button>
        </div>

        <div v-else-if="cotizacion.estado === 'ACEPTADA'" class="flex items-center gap-2 mt-4 pt-4 border-t border-emerald-500/10">
          <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-xs text-emerald-400">Propuesta aceptada — nos pondremos en contacto pronto</p>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 pt-2">
      <RouterLink
        :to="{ name: 'cliente-perfil' }"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Mi perfil
      </RouterLink>
      <RouterLink
        :to="{ name: 'contacto' }"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors border border-violet-500/20"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Solicitar nueva cotización
      </RouterLink>
    </div>
  </div>
</template>