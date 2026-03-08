<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { serviciosServicio } from '@/services/servicios'
import type { Servicio } from '@/types'

interface ServicioConUsd extends Servicio {
  precioDesdeUsd?: number
  precioHastaUsd?: number
  tasaCOP_USD?:    number
}

const route    = useRoute()
const router   = useRouter()
const servicio = ref<ServicioConUsd | null>(null)
const cargando = ref(true)

onMounted(async () => {
  try {
    const { data } = await serviciosServicio.obtenerPorSlug(route.params.slug as string)
    servicio.value = data.datos as ServicioConUsd
  } catch {
    router.push({ name: 'no-encontrado' })
  } finally {
    cargando.value = false
  }
})

const cop = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const usd = (m: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(m)
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f]">

    <div v-if="cargando" class="max-w-5xl mx-auto px-6 pt-32 space-y-5">
      <div class="h-5 w-40 bg-white/5 rounded-lg animate-pulse" />
      <div class="h-12 w-2/3 bg-white/5 rounded-xl animate-pulse" />
      <div class="h-5 w-full bg-white/5 rounded-lg animate-pulse" />
      <div class="h-5 w-4/5 bg-white/5 rounded-lg animate-pulse" />
      <div class="h-64 bg-white/5 rounded-2xl animate-pulse mt-4" />
    </div>

    <template v-else-if="servicio">
      <div class="relative overflow-hidden pt-32 pb-20 px-6">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute top-0 left-1/3 w-80 h-80 bg-violet-600/6 rounded-full blur-[100px]" />
        </div>

        <div class="relative max-w-5xl mx-auto">

          <div class="flex items-center gap-2 text-sm text-gray-500 mb-10">
            <RouterLink :to="{ name: 'servicios' }" class="hover:text-white transition-colors">Servicios</RouterLink>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span class="text-gray-300 truncate max-w-xs">{{ servicio.nombre }}</span>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

            <div class="lg:col-span-7 space-y-8">

              <div>
                <h1 class="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">{{ servicio.nombre }}</h1>
                <p class="text-gray-400 text-lg leading-relaxed">{{ servicio.descripcion }}</p>
              </div>

              <div class="p-6 rounded-2xl bg-[#111118] border border-white/6">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">¿Qué incluye?</p>
                <ul class="space-y-3">
                  <li
                    v-for="(c, i) in servicio.caracteristicas"
                    :key="c"
                    class="flex items-start gap-3"
                  >
                    <div class="w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0 mt-0.5">
                      <svg class="w-2.5 h-2.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span class="text-gray-200 text-sm leading-relaxed">{{ c }}</span>
                  </li>
                </ul>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="p-5 rounded-2xl bg-[#111118] border border-white/6 text-center">
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p class="text-2xl font-black text-white">{{ servicio.semanasEntrega }}</p>
                  <p class="text-xs text-gray-500 mt-1">semanas de entrega</p>
                </div>
                <div class="p-5 rounded-2xl bg-[#111118] border border-white/6 text-center">
                  <div class="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p class="text-2xl font-black text-white">{{ servicio.caracteristicas.length }}</p>
                  <p class="text-xs text-gray-500 mt-1">características incluidas</p>
                </div>
              </div>

            </div>

            <div class="lg:col-span-5">
              <div class="sticky top-24 space-y-4">

                <div class="p-6 rounded-2xl bg-[#111118] border border-white/6">
                  <p class="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-3">Inversión</p>

                  <div class="mb-4">
                    <p class="text-4xl font-black text-white leading-none">{{ cop(servicio.precioDesde) }}</p>
                    <p v-if="servicio.precioDesdeUsd" class="text-base text-gray-500 mt-1.5 font-medium">
                      ≈ {{ usd(servicio.precioDesdeUsd) }} USD
                    </p>
                  </div>

                  <div v-if="servicio.precioHasta" class="pt-3 border-t border-white/5 mb-4">
                    <p class="text-xs text-gray-600 mb-1">Hasta</p>
                    <p class="text-xl font-bold text-gray-300">{{ cop(servicio.precioHasta) }}</p>
                    <p v-if="servicio.precioHastaUsd" class="text-sm text-gray-600 mt-0.5">
                      ≈ {{ usd(servicio.precioHastaUsd) }} USD
                    </p>
                  </div>

                  <div v-if="servicio.tasaCOP_USD" class="flex items-center gap-1.5 mb-5 py-2.5 px-3 rounded-lg bg-white/3 border border-white/5">
                    <svg class="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-xs text-gray-600">
                      Tasa hoy: <span class="text-gray-400 font-medium">1 USD = {{ servicio.tasaCOP_USD.toLocaleString('es-CO') }} COP</span>
                    </p>
                  </div>

                  <RouterLink
                    :to="{ name: 'contacto', query: { servicio: servicio.slug } }"
                    class="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-500/35"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Solicitar cotización
                  </RouterLink>
                </div>

                <div class="p-5 rounded-2xl bg-linear-to-br from-violet-600/8 to-indigo-600/6 border border-violet-500/15 space-y-2.5">
                  <div v-for="punto in ['Sin costos ocultos', 'Soporte incluido post-lanzamiento', 'Entrega en el tiempo acordado']" :key="punto" class="flex items-center gap-2.5">
                    <svg class="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-xs text-gray-300">{{ punto }}</span>
                  </div>
                </div>

                <RouterLink
                  :to="{ name: 'servicios' }"
                  class="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-gray-500 hover:text-gray-300 text-sm transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Ver todos los servicios
                </RouterLink>

              </div>
            </div>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>