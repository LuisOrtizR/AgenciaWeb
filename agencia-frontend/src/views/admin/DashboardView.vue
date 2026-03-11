<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import {
  prospectosServicio,
  cotizacionesServicio,
  testimoniosServicio,
  usuariosServicio,
} from '@/services/servicios'
import AppInsignia from '@/components/ui/AppInsignia.vue'
import type {
  ResumenProspectos,
  ResumenCotizaciones,
  ResumenTestimonios,
  ResumenUsuarios,
  Prospecto,
} from '@/types'

const router  = useRouter()
const uiStore = useUiStore()

const cargando            = ref(true)
const resumenProspectos   = ref<ResumenProspectos | null>(null)
const resumenCotizaciones = ref<ResumenCotizaciones | null>(null)
const resumenTestimonios  = ref<ResumenTestimonios | null>(null)
const resumenUsuarios     = ref<ResumenUsuarios | null>(null)
const prospectosRecientes = ref<Prospecto[]>([])

onMounted(async () => {
  try {
    const [rP, rC, rT, rU, rPR] = await Promise.all([
      prospectosServicio.resumen(),
      cotizacionesServicio.resumen(),
      testimoniosServicio.resumen(),
      usuariosServicio.resumen(),
      prospectosServicio.listar({ pagina: 1, porPagina: 5 }),
    ])
    resumenProspectos.value   = rP.data.datos
    resumenCotizaciones.value = rC.data.datos
    resumenTestimonios.value  = rT.data.datos
    resumenUsuarios.value     = rU.data.datos
    prospectosRecientes.value = rPR.data.datos
  } catch {
    uiStore.error('Error al cargar el dashboard', 'Intenta recargar la página')
  } finally {
    cargando.value = false
  }
})

const formatearMoneda = (monto: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto)

const CONFIG_ESTADO_PROSPECTO: Record<string, { etiqueta: string; variante: 'info' | 'advertencia' | 'exito' | 'error' }> = {
  NUEVO:      { etiqueta: 'Nuevo',      variante: 'info' },
  CONTACTADO: { etiqueta: 'Contactado', variante: 'advertencia' },
  CONVERTIDO: { etiqueta: 'Convertido', variante: 'exito' },
  PERDIDO:    { etiqueta: 'Perdido',    variante: 'error' },
}

const tarjetas = computed(() => [
  {
    titulo:    'Prospectos totales',
    valor:     resumenProspectos.value?.total ?? 0,
    subtitulo: `${resumenProspectos.value?.nuevos ?? 0} nuevos sin contactar`,
    icono:     'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    color:     'text-blue-400',
    fondo:     'bg-blue-500/10 border-blue-500/20',
    ruta:      'admin-prospectos',
  },
  {
    titulo:    'Cotizaciones',
    valor:     resumenCotizaciones.value?.total ?? 0,
    subtitulo: `${resumenCotizaciones.value?.pendientes ?? 0} pendientes de revisión`,
    icono:     'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    color:     'text-violet-400',
    fondo:     'bg-violet-500/10 border-violet-500/20',
    ruta:      'admin-cotizaciones',
  },
  {
    titulo:    'Ingresos aceptados',
    valor:     formatearMoneda(resumenCotizaciones.value?.ingresosTotales ?? 0),
    subtitulo: `${resumenCotizaciones.value?.aceptadas ?? 0} cotizaciones aceptadas`,
    icono:     'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color:     'text-emerald-400',
    fondo:     'bg-emerald-500/10 border-emerald-500/20',
    ruta:      'admin-cotizaciones',
  },
  {
    titulo:    'Testimonios',
    valor:     resumenTestimonios.value?.total ?? 0,
    subtitulo: `${resumenTestimonios.value?.ocultos ?? 0} pendientes de moderación`,
    icono:     'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    color:     'text-amber-400',
    fondo:     'bg-amber-500/10 border-amber-500/20',
    ruta:      'admin-testimonios',
  },
])

const cotizacionesPorEstado = computed(() => {
  if (!resumenCotizaciones.value) return []
  return [
    { label: 'Pendiente', cantidad: resumenCotizaciones.value.pendientes, color: 'bg-amber-400' },
    { label: 'Enviada',   cantidad: resumenCotizaciones.value.enviadas,   color: 'bg-blue-400' },
    { label: 'Aceptada',  cantidad: resumenCotizaciones.value.aceptadas,  color: 'bg-emerald-400' },
    { label: 'Rechazada', cantidad: resumenCotizaciones.value.rechazadas, color: 'bg-red-400' },
  ]
})

const totalCotizaciones = computed(() =>
  cotizacionesPorEstado.value.reduce((s, i) => s + i.cantidad, 0)
)
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">

    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Dashboard</h1>
        <p class="text-slate-500 text-sm mt-1">Vista general de Nexova Studio</p>
      </div>
      <RouterLink
        :to="{ name: 'admin-prospectos' }"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-500/20 self-start"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo prospecto
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <template v-if="cargando">
        <div v-for="i in 4" :key="i" class="h-32 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
      </template>
      <template v-else>
        <button
          v-for="t in tarjetas"
          :key="t.titulo"
          class="group text-left p-5 rounded-2xl bg-[#13151f] border border-white/5 hover:border-white/10 transition-all hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          @click="router.push({ name: t.ruta })"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="p-2.5 rounded-xl border" :class="t.fondo">
              <svg class="w-5 h-5" :class="t.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="t.icono" />
              </svg>
            </div>
            <svg class="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p class="text-2xl font-bold text-white mb-1 tabular-nums">{{ t.valor }}</p>
          <p class="text-xs text-slate-500">{{ t.subtitulo }}</p>
        </button>
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <div class="lg:col-span-2 bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 class="text-white font-semibold text-sm">Prospectos recientes</h2>
          <RouterLink :to="{ name: 'admin-prospectos' }" class="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Ver todos →
          </RouterLink>
        </div>
        <div v-if="cargando" class="p-6 space-y-4">
          <div v-for="i in 5" :key="i" class="h-10 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div v-else-if="!prospectosRecientes.length" class="px-6 py-12 text-center text-slate-500 text-sm">
          No hay prospectos aún
        </div>
        <ul v-else class="divide-y divide-white/5">
          <li
            v-for="p in prospectosRecientes"
            :key="p.id"
            class="px-6 py-4 flex items-center justify-between hover:bg-white/3 transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                {{ p.nombre?.[0]?.toUpperCase() ?? '?' }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-white truncate">{{ p.nombre }}</p>
                <p class="text-xs text-slate-500 truncate">{{ p.correo }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0 ml-4">
              <AppInsignia :variante="CONFIG_ESTADO_PROSPECTO[p.estado]?.variante ?? 'info'" punto>
                {{ CONFIG_ESTADO_PROSPECTO[p.estado]?.etiqueta ?? p.estado }}
              </AppInsignia>
              <RouterLink
                :to="{ name: 'admin-prospecto-detalle', params: { id: p.id } }"
                class="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </RouterLink>
            </div>
          </li>
        </ul>
      </div>

      <div class="space-y-5">

        <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
          <h2 class="text-white font-semibold text-sm mb-4">Cotizaciones por estado</h2>
          <div v-if="cargando" class="space-y-3">
            <div v-for="i in 4" :key="i" class="h-8 bg-white/5 rounded animate-pulse" />
          </div>
          <template v-else>
            <ul class="space-y-3 mb-4">
              <li v-for="item in cotizacionesPorEstado" :key="item.label" class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="w-2 h-2 rounded-full shrink-0" :class="item.color" />
                  <span class="text-sm text-slate-300">{{ item.label }}</span>
                </div>
                <span class="text-sm font-semibold text-white tabular-nums">{{ item.cantidad }}</span>
              </li>
            </ul>
            <div v-if="totalCotizaciones" class="flex rounded-full overflow-hidden h-1.5 gap-px">
              <div
                v-for="item in cotizacionesPorEstado.filter(i => i.cantidad)"
                :key="item.label"
                :class="item.color"
                :style="{ width: `${(item.cantidad / totalCotizaciones) * 100}%` }"
              />
            </div>
          </template>
        </div>

        <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-white font-semibold text-sm">Usuarios</h2>
            <RouterLink :to="{ name: 'admin-usuarios' }" class="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Ver todos →
            </RouterLink>
          </div>
          <div v-if="cargando" class="space-y-2">
            <div v-for="i in 4" :key="i" class="h-6 bg-white/5 rounded animate-pulse" />
          </div>
          <ul v-else class="space-y-2.5 text-sm">
            <li class="flex justify-between items-center">
              <span class="text-slate-500">Total registrados</span>
              <span class="text-white font-semibold tabular-nums">{{ resumenUsuarios?.total ?? 0 }}</span>
            </li>
            <li class="flex justify-between items-center">
              <span class="text-slate-500">Activos</span>
              <span class="text-emerald-400 font-semibold tabular-nums">{{ resumenUsuarios?.activos ?? 0 }}</span>
            </li>
            <li class="flex justify-between items-center">
              <span class="text-slate-500">Administradores</span>
              <span class="text-violet-400 font-semibold tabular-nums">{{ resumenUsuarios?.admins ?? 0 }}</span>
            </li>
            <li class="flex justify-between items-center">
              <span class="text-slate-500">Clientes</span>
              <span class="text-slate-300 font-semibold tabular-nums">{{ resumenUsuarios?.clientes ?? 0 }}</span>
            </li>
          </ul>
        </div>

        <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
          <h2 class="text-white font-semibold text-sm mb-4">Accesos rápidos</h2>
          <div class="grid grid-cols-2 gap-2">
            <RouterLink
              v-for="link in [
                { nombre: 'Prospectos',  ruta: 'admin-prospectos',  icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { nombre: 'Servicios',   ruta: 'admin-servicios',   icono: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
                { nombre: 'Proyectos',   ruta: 'admin-proyectos',   icono: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
                { nombre: 'Testimonios', ruta: 'admin-testimonios', icono: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
              ]"
              :key="link.ruta"
              :to="{ name: link.ruta }"
              class="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 hover:border-white/10 transition-all text-center"
            >
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="link.icono" />
              </svg>
              <span class="text-xs text-slate-400">{{ link.nombre }}</span>
            </RouterLink>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>