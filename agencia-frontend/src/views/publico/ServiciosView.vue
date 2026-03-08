<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { serviciosServicio } from '@/services/servicios'
import type { Servicio } from '@/types'

interface ServicioConUsd extends Servicio {
  precioDesdeUsd?: number
  precioHastaUsd?: number
  tasaCOP_USD?:    number
}

const servicios = ref<ServicioConUsd[]>([])
const cargando  = ref(true)
const orden = ref<'reciente' | 'precio_asc' | 'precio_desc'>('precio_asc')

const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await serviciosServicio.listar({ porPagina: 20, orden: orden.value } as any)
    servicios.value = data.datos as ServicioConUsd[]
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

const cambiarOrden = (nuevo: typeof orden.value) => {
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

    <div class="relative overflow-hidden pt-32 pb-20 px-6">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-1/3 w-96 h-80 bg-violet-600/7 rounded-full blur-[120px]" />
        <div class="absolute top-20 right-1/4 w-72 h-72 bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div class="relative max-w-5xl mx-auto">

        <div class="text-center mb-14">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span class="text-violet-300 text-xs font-semibold tracking-widest uppercase">¿Qué hacemos?</span>
          </div>
          <h1 class="text-5xl sm:text-6xl font-black text-white mb-5 leading-tight">Nuestros servicios</h1>
          <p class="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Soluciones digitales diseñadas para que tu negocio crezca en internet, desde landing pages hasta plataformas complejas.
          </p>
        </div>

        <div class="flex items-center justify-between mb-8 flex-wrap gap-3">
          <p class="text-sm text-gray-500">
            <span class="text-white font-medium">{{ servicios.length }}</span> servicios disponibles
          </p>
          <div class="flex items-center gap-1 bg-white/4 border border-white/8 rounded-xl p-1">
            <button
              v-for="op in [
                { valor: 'reciente',    etiqueta: 'Recientes' },
                { valor: 'precio_asc',  etiqueta: 'Menor precio' },
                { valor: 'precio_desc', etiqueta: 'Mayor precio' },
              ]"
              :key="op.valor"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              :class="orden === op.valor
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'"
              @click="cambiarOrden(op.valor as any)"
            >
              {{ op.etiqueta }}
            </button>
          </div>
        </div>

        <div v-if="cargando" class="space-y-4">
          <div v-for="i in 4" :key="i" class="h-44 bg-white/4 rounded-2xl animate-pulse" />
        </div>

        <div v-else class="space-y-4">
          <RouterLink
            v-for="s in servicios"
            :key="s.id"
            :to="{ name: 'servicio-detalle', params: { slug: s.slug } }"
            class="group flex flex-col lg:flex-row gap-6 p-6 lg:p-7 rounded-2xl bg-[#111118] border border-white/6 hover:border-violet-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/8"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-3">
                <h2 class="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">{{ s.nombre }}</h2>
                <div class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
                  <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs text-emerald-400 font-medium whitespace-nowrap">{{ s.semanasEntrega }} sem.</span>
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
              <div class="flex items-center justify-between lg:justify-end">
                <span class="text-xs text-violet-400 font-medium group-hover:text-violet-300 transition-colors">
                  Ver detalle →
                </span>
              </div>
            </div>
          </RouterLink>
        </div>

        <div class="mt-16 relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-600/15 to-indigo-600/10 border border-violet-500/20 p-10 text-center">
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-600/15 rounded-full blur-[60px]" />
          </div>
          <div class="relative">
            <p class="text-white font-bold text-xl mb-2">¿No encuentras lo que necesitas?</p>
            <p class="text-gray-400 text-sm mb-6">Cuéntanos tu proyecto y te preparamos una propuesta a medida.</p>
            <RouterLink
              :to="{ name: 'contacto' }"
              class="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/25 transition-all text-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Solicitar cotización
            </RouterLink>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>