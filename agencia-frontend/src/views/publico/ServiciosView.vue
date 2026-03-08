<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { serviciosServicio } from '@/services/servicios'
import type { Servicio } from '@/types'

const servicios = ref<Servicio[]>([])
const cargando  = ref(true)

onMounted(async () => {
  try {
    const { data } = await serviciosServicio.listar({ porPagina: 20 })
    servicios.value = data.datos
  } finally {
    cargando.value = false
  }
})

const formatearMoneda = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] pt-24 pb-16">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-16">
        <p class="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">¿Qué hacemos?</p>
        <h1 class="text-5xl font-black text-white mb-4">Nuestros servicios</h1>
        <p class="text-gray-400 text-lg max-w-2xl mx-auto">
          Soluciones digitales diseñadas para que tu negocio crezca en internet, desde simples landing pages hasta plataformas complejas.
        </p>
      </div>

      <div v-if="cargando" class="space-y-4">
        <div v-for="i in 4" :key="i" class="h-40 bg-white/5 rounded-2xl animate-pulse" />
      </div>

      <div v-else class="space-y-5">
        <RouterLink
          v-for="s in servicios"
          :key="s.id"
          :to="{ name: 'servicio-detalle', params: { slug: s.slug } }"
          class="group flex flex-col md:flex-row md:items-center gap-6 p-6 md:p-8 rounded-2xl bg-white/3 border border-white/5 hover:border-violet-500/20 hover:bg-white/5 transition-all"
        >
          <div class="md:w-1/2">
            <h2 class="text-xl font-bold text-white group-hover:text-violet-400 transition-colors mb-2">{{ s.nombre }}</h2>
            <p class="text-gray-400 leading-relaxed">{{ s.descripcion }}</p>
          </div>
          <div class="md:w-1/2 flex flex-wrap items-center justify-between gap-4">
            <ul class="space-y-1.5">
              <li v-for="c in s.caracteristicas.slice(0, 4)" :key="c" class="flex items-center gap-2 text-sm text-gray-200">
                <svg class="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ c }}
              </li>
            </ul>
            <div class="text-right">
              <p class="text-sm text-gray-400">Desde</p>
              <p class="text-2xl font-black text-white">{{ formatearMoneda(s.precioDesde) }}</p>
              <p class="text-sm text-gray-400 mt-1">{{ s.semanasEntrega }} semanas de entrega</p>
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- CTA -->
      <div class="mt-16 text-center">
        <RouterLink
          :to="{ name: 'contacto' }"
          class="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/20 transition-all"
        >
          Solicitar cotización →
        </RouterLink>
      </div>
    </div>
  </div>
</template>