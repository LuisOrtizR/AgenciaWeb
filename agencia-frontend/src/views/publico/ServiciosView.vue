<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { serviciosServicio } from '@/services/servicios'
import { useUiStore }        from '@/stores/ui'
import { useAuthStore }      from '@/stores/auth'
import type { Servicio }     from '@/types'

// El backend devuelve estos campos extra cuando hay tasa en tiempo real
interface ServicioConUsd extends Servicio {
  precioDesdeUsd?: number
  precioHastaUsd?: number
  tasaCOP_USD?:    number
}

type OrdenServicio = 'reciente' | 'precio_asc' | 'precio_desc'

const uiStore   = useUiStore()
const authStore = useAuthStore()

const servicios = ref<ServicioConUsd[]>([])
const cargando  = ref(true)
const error     = ref(false)
const orden     = ref<OrdenServicio>('precio_asc')

const cargar = async () => {
  cargando.value = true
  error.value    = false
  try {
    // El backend acepta ?orden=precio_asc|precio_desc|reciente
    const { data } = await serviciosServicio.listar({
      porPagina: 20,
      orden:     orden.value,
    } as Parameters<typeof serviciosServicio.listar>[0])
    servicios.value = data.datos as ServicioConUsd[]
  } catch {
    error.value = true
    uiStore.error('Error al cargar', 'No se pudieron obtener los servicios. Intenta de nuevo.')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

const cambiarOrden = (nuevo: OrdenServicio) => {
  if (orden.value === nuevo) return
  orden.value = nuevo
  cargar()
}

const cop = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const usd = (m: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(m)
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f]">

    <!-- Fondo decorativo -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-0 left-1/3 w-96 h-80 bg-violet-600/7 rounded-full blur-[120px]" />
      <div class="absolute top-20 right-1/4 w-72 h-72 bg-indigo-600/5 rounded-full blur-[100px]" />
    </div>

    <div class="relative pt-32 pb-20 px-6">
      <div class="max-w-5xl mx-auto">

        <!-- Hero -->
        <div class="text-center mb-14">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span class="text-violet-300 text-xs font-semibold tracking-widest uppercase">¿Qué hacemos?</span>
          </div>
          <h1 class="text-5xl sm:text-6xl font-black text-white mb-5 leading-tight">Nuestros servicios</h1>
          <p class="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Soluciones digitales diseñadas para que tu negocio crezca en internet, desde landing pages hasta plataformas complejas.
          </p>
        </div>

        <!-- Barra de controles -->
        <div class="flex items-center justify-between mb-8 flex-wrap gap-3">
          <p class="text-sm text-gray-500">
            <template v-if="!cargando && !error">
              <span class="text-white font-medium">{{ servicios.length }}</span> servicios disponibles
            </template>
            <span v-else-if="cargando">Cargando servicios…</span>
          </p>
          <div class="flex items-center gap-1 bg-white/4 border border-white/8 rounded-xl p-1">
            <button
              v-for="op in ([
                { valor: 'reciente',    etiqueta: 'Recientes'     },
                { valor: 'precio_asc',  etiqueta: 'Menor precio'  },
                { valor: 'precio_desc', etiqueta: 'Mayor precio'  },
              ] as { valor: OrdenServicio; etiqueta: string }[])"
              :key="op.valor"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              :class="orden === op.valor
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'"
              @click="cambiarOrden(op.valor)"
            >
              {{ op.etiqueta }}
            </button>
          </div>
        </div>

        <!-- Skeleton -->
        <div v-if="cargando" class="space-y-4">
          <div v-for="i in 4" :key="i" class="h-44 bg-white/4 rounded-2xl animate-pulse" />
        </div>

        <!-- Error state -->
        <div
          v-else-if="error"
          class="py-20 flex flex-col items-center gap-4 text-center"
        >
          <div class="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-white font-semibold">No se pudieron cargar los servicios</p>
            <p class="text-gray-500 text-sm mt-1">Verifica tu conexión e intenta de nuevo</p>
          </div>
          <button
            class="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
            @click="cargar"
          >
            Reintentar
          </button>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="servicios.length === 0"
          class="py-20 flex flex-col items-center gap-4 text-center"
        >
          <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
            <svg class="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p class="text-white font-semibold">Sin servicios por ahora</p>
          <p class="text-gray-500 text-sm">Vuelve pronto, estamos actualizando el catálogo</p>
        </div>

        <!-- Lista de servicios -->
        <div v-else class="space-y-4">
          <RouterLink
            v-for="s in servicios"
            :key="s.id"
            :to="{ name: 'servicio-detalle', params: { slug: s.slug } }"
            class="group flex flex-col lg:flex-row gap-6 p-6 lg:p-7 rounded-2xl bg-[#111118] border border-white/6 hover:border-violet-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/8"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-3">
                <h2 class="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                  {{ s.nombre }}
                </h2>
                <div class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
                  <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs text-emerald-400 font-medium whitespace-nowrap">
                    {{ s.semanasEntrega }} sem.
                  </span>
                </div>
              </div>
              <p class="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">{{ s.descripcion }}</p>
              <ul class="flex flex-wrap gap-x-5 gap-y-1.5">
                <li
                  v-for="c in s.caracteristicas.slice(0, 4)"
                  :key="c"
                  class="flex items-center gap-1.5 text-xs text-gray-400"
                >
                  <span class="w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                  {{ c }}
                </li>
                <li v-if="s.caracteristicas.length > 4" class="text-xs text-gray-600">
                  +{{ s.caracteristicas.length - 4 }} más
                </li>
              </ul>
            </div>

            <!-- Precio -->
            <div class="lg:w-52 shrink-0 flex flex-col justify-between gap-4 lg:border-l lg:border-white/5 lg:pl-6">
              <div>
                <p class="text-xs text-gray-600 uppercase tracking-wide font-medium mb-1">Inversión desde</p>
                <p class="text-2xl font-black text-white leading-none">{{ cop(s.precioDesde) }}</p>
                <p v-if="s.precioDesdeUsd" class="text-sm text-gray-500 mt-1">
                  ≈ {{ usd(s.precioDesdeUsd) }} USD
                </p>
                <p v-if="s.precioHasta" class="text-xs text-gray-600 mt-1.5">
                  hasta {{ cop(s.precioHasta) }}
                  <span v-if="s.precioHastaUsd" class="text-gray-700"> / {{ usd(s.precioHastaUsd) }}</span>
                </p>
              </div>
              <span class="text-xs text-violet-400 font-medium group-hover:text-violet-300 transition-colors">
                Ver detalle →
              </span>
            </div>
          </RouterLink>
        </div>

        <!-- CTA inferior — cambia según si está autenticado -->
        <div class="mt-16 relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-600/15 to-indigo-600/10 border border-violet-500/20 p-10 text-center">
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-600/15 rounded-full blur-[60px]" />
          </div>
          <div class="relative">
            <p class="text-white font-bold text-xl mb-2">¿No encuentras lo que necesitas?</p>
            <p class="text-gray-400 text-sm mb-6">
              Cuéntanos tu proyecto y te preparamos una propuesta a medida.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <RouterLink
                :to="{ name: 'contacto' }"
                class="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/25 transition-all text-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Solicitar cotización
              </RouterLink>
              <!-- Si ya está autenticado, ofrecer acceso directo a sus cotizaciones -->
              <RouterLink
                v-if="authStore.estaAutenticado"
                :to="{ name: 'cliente-cotizaciones' }"
                class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-violet-300 hover:text-violet-200 border border-violet-500/25 hover:border-violet-500/50 bg-violet-500/5 hover:bg-violet-500/10 transition-all text-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Ver mis cotizaciones
              </RouterLink>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>