<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { serviciosServicio } from '@/services/servicios'
import type { Servicio } from '@/types'

const route    = useRoute()
const router   = useRouter()
const servicio = ref<Servicio | null>(null)
const cargando = ref(true)

onMounted(async () => {
  try {
    const { data } = await serviciosServicio.obtenerPorSlug(route.params.slug as string)
    servicio.value = data.datos
  } catch {
    router.push({ name: 'no-encontrado' })
  } finally {
    cargando.value = false
  }
})

const formatearMoneda = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] pt-24 pb-16">
    <div class="max-w-4xl mx-auto px-6">

      <div v-if="cargando" class="space-y-6">
        <div class="h-10 w-1/2 bg-white/5 rounded-xl animate-pulse" />
        <div class="h-60 bg-white/5 rounded-2xl animate-pulse" />
      </div>

      <template v-else-if="servicio">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <RouterLink :to="{ name: 'servicios' }" class="hover:text-white transition-colors">Servicios</RouterLink>
          <span>/</span>
          <span class="text-gray-200">{{ servicio.nombre }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Info principal -->
          <div class="md:col-span-2 space-y-6">
            <div>
              <h1 class="text-4xl font-black text-white mb-3">{{ servicio.nombre }}</h1>
              <p class="text-gray-400 text-lg leading-relaxed">{{ servicio.descripcion }}</p>
            </div>

            <!-- Características -->
            <div class="p-6 rounded-2xl bg-white/3 border border-white/5">
              <h2 class="text-white font-semibold mb-4">¿Qué incluye?</h2>
              <ul class="space-y-3">
                <li
                  v-for="c in servicio.caracteristicas"
                  :key="c"
                  class="flex items-start gap-3 text-sm text-gray-200"
                >
                  <svg class="w-4 h-4 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ c }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Panel de precio -->
          <div class="space-y-4">
            <div class="p-6 rounded-2xl bg-[#13151f] border border-white/5 sticky top-24">
              <p class="text-xs text-gray-400 mb-1">Inversión</p>
              <p class="text-3xl font-black text-white">{{ formatearMoneda(servicio.precioDesde) }}</p>
              <p v-if="servicio.precioHasta" class="text-gray-400 text-sm mt-1">
                hasta {{ formatearMoneda(servicio.precioHasta) }}
              </p>

              <div class="my-4 pt-4 border-t border-white/5">
                <div class="flex items-center gap-2 text-sm text-gray-200">
                  <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Entrega en {{ servicio.semanasEntrega }} semanas
                </div>
              </div>

              <RouterLink
                :to="{ name: 'contacto', query: { servicio: servicio.slug } }"
                class="flex items-center justify-center w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-600/20"
              >
                Solicitar cotización
              </RouterLink>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>