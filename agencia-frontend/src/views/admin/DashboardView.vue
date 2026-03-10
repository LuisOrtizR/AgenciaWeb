<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { prospectosServicio  } from '@/services/servicios'
import { cotizacionesServicio } from '@/services/servicios'
import { testimoniosServicio  } from '@/services/servicios'
import { usuariosServicio     } from '@/services/servicios'
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

const etiquetaEstadoProspecto: Record<string, string> = {
  NUEVO:      'Nuevo',
  CONTACTADO: 'Contactado',
  CONVERTIDO: 'Convertido',
  PERDIDO:    'Perdido',
}

const varianteEstadoProspecto: Record<string, 'info' | 'advertencia' | 'exito' | 'error'> = {
  NUEVO:      'info',
  CONTACTADO: 'advertencia',
  CONVERTIDO: 'exito',
  PERDIDO:    'error',
}

const tarjetas = [
  {
    titulo:    'Prospectos totales',
    valor:     () => resumenProspectos.value?.total ?? 0,
    subtitulo: () => `${resumenProspectos.value?.nuevos ?? 0} nuevos sin contactar`,
    icono:     'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    color:     'text-azul',
    fondo:     'bg-azul/10 border-azul/20',
    ruta:      'admin-prospectos',
  },
  {
    titulo:    'Cotizaciones',
    valor:     () => resumenCotizaciones.value?.total ?? 0,
    subtitulo: () => `${resumenCotizaciones.value?.pendientes ?? 0} pendientes de revisión`,
    icono:     'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    color:     'text-violeta-claro',
    fondo:     'bg-violeta/10 border-violeta/20',
    ruta:      'admin-cotizaciones',
  },
  {
    titulo:    'Ingresos aceptados',
    valor:     () => formatearMoneda(resumenCotizaciones.value?.ingresosTotales ?? 0),
    subtitulo: () => `${resumenCotizaciones.value?.aceptadas ?? 0} cotizaciones aceptadas`,
    icono:     'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color:     'text-verde',
    fondo:     'bg-verde/10 border-verde/20',
    ruta:      'admin-cotizaciones',
  },
  {
    titulo:    'Testimonios',
    valor:     () => resumenTestimonios.value?.total ?? 0,
    subtitulo: () => `${resumenTestimonios.value?.ocultos ?? 0} pendientes de moderación`,
    icono:     'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    color:     'text-amarillo',
    fondo:     'bg-amarillo/10 border-amarillo/20',
    ruta:      'admin-testimonios',
  },
]

const cotizacionesPorEstado = () => {
  if (!resumenCotizaciones.value) return []
  return [
    { estado: 'PENDIENTE', cantidad: resumenCotizaciones.value.pendientes },
    { estado: 'ENVIADA',   cantidad: resumenCotizaciones.value.enviadas },
    { estado: 'ACEPTADA',  cantidad: resumenCotizaciones.value.aceptadas },
    { estado: 'RECHAZADA', cantidad: resumenCotizaciones.value.rechazadas },
  ]
}
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">

    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Dashboard</h1>
        <p class="text-gris-medio text-sm mt-1">Vista general de Nexova Studio</p>
      </div>
      <RouterLink
        :to="{ name: 'admin-prospectos' }"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violeta hover:bg-violeta/90 text-white text-sm font-medium transition-all shadow-lg shadow-violeta/20 self-start"
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
          v-for="tarjeta in tarjetas"
          :key="tarjeta.titulo"
          class="group text-left p-5 rounded-2xl bg-[#13151f] border border-white/5 hover:border-white/10 transition-all hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-violeta"
          @click="router.push({ name: tarjeta.ruta })"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="p-2.5 rounded-xl border" :class="tarjeta.fondo">
              <svg class="w-5 h-5" :class="tarjeta.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="tarjeta.icono" />
              </svg>
            </div>
            <svg class="w-4 h-4 text-gris-medio group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p class="text-2xl font-bold text-white mb-1">{{ tarjeta.valor() }}</p>
          <p class="text-xs text-gris-medio">{{ tarjeta.subtitulo() }}</p>
        </button>
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <div class="lg:col-span-2 bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 class="text-white font-semibold text-sm">Prospectos recientes</h2>
          <RouterLink :to="{ name: 'admin-prospectos' }" class="text-xs text-violeta-claro hover:text-violeta transition-colors">
            Ver todos →
          </RouterLink>
        </div>

        <div v-if="cargando" class="p-6 space-y-4">
          <div v-for="i in 4" :key="i" class="h-10 bg-white/5 rounded-lg animate-pulse" />
        </div>

        <div v-else-if="!prospectosRecientes.length" class="px-6 py-12 text-center text-gris-medio text-sm">
          No hay prospectos aún
        </div>

        <ul v-else class="divide-y divide-white/5">
          <li
            v-for="prospecto in prospectosRecientes"
            :key="prospecto.id"
            class="px-6 py-4 flex items-center justify-between hover:bg-white/3 transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-full bg-linear-to-br from-gris-medio/30 to-white/10 flex items-center justify-center text-xs font-bold text-blanco-suave shrink-0">
                {{ prospecto.nombre?.[0]?.toUpperCase() ?? '?' }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-white truncate">{{ prospecto.nombre }}</p>
                <p class="text-xs text-gris-medio truncate">{{ prospecto.correo }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0 ml-4">
              <AppInsignia :variante="varianteEstadoProspecto[prospecto.estado]" punto>
                {{ etiquetaEstadoProspecto[prospecto.estado] }}
              </AppInsignia>
              <RouterLink
                :to="{ name: 'admin-prospecto-detalle', params: { id: prospecto.id } }"
                class="p-1.5 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all"
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
          <ul v-else class="space-y-3">
            <li v-for="item in cotizacionesPorEstado()" :key="item.estado" class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="{
                    'bg-amarillo': item.estado === 'PENDIENTE',
                    'bg-azul':     item.estado === 'ENVIADA',
                    'bg-verde':    item.estado === 'ACEPTADA',
                    'bg-rojo':     item.estado === 'RECHAZADA',
                  }"
                />
                <span class="text-sm text-blanco-suave capitalize">
                  {{ item.estado.charAt(0) + item.estado.slice(1).toLowerCase() }}
                </span>
              </div>
              <span class="text-sm font-semibold text-white">{{ item.cantidad }}</span>
            </li>
          </ul>
        </div>

        <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-white font-semibold text-sm">Usuarios</h2>
            <RouterLink :to="{ name: 'admin-usuarios' }" class="text-xs text-violeta-claro hover:text-violeta transition-colors">
              Ver todos →
            </RouterLink>
          </div>
          <div v-if="cargando" class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-6 bg-white/5 rounded animate-pulse" />
          </div>
          <ul v-else class="space-y-2.5 text-sm">
            <li class="flex justify-between items-center">
              <span class="text-gris-medio">Total registrados</span>
              <span class="text-white font-semibold">{{ resumenUsuarios?.total ?? 0 }}</span>
            </li>
            <li class="flex justify-between items-center">
              <span class="text-gris-medio">Activos</span>
              <span class="text-verde font-semibold">{{ resumenUsuarios?.activos ?? 0 }}</span>
            </li>
            <li class="flex justify-between items-center">
              <span class="text-gris-medio">Administradores</span>
              <span class="text-violeta-claro font-semibold">{{ resumenUsuarios?.admins ?? 0 }}</span>
            </li>
            <li class="flex justify-between items-center">
              <span class="text-gris-medio">Clientes</span>
              <span class="text-blanco-suave font-semibold">{{ resumenUsuarios?.clientes ?? 0 }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>