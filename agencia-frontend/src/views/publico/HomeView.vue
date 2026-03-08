<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { proyectosServicio, serviciosServicio, testimoniosServicio } from '@/services/servicios'
import type { Proyecto, Testimonio } from '@/types'

interface ServicioConUsd {
  id: string; nombre: string; slug: string; descripcion: string
  precioDesde: number; precioHasta: number | null; semanasEntrega: number
  caracteristicas: string[]; precioDesdeUsd?: number; tasaCOP_USD?: number
}

const proyectosDestacados = ref<Proyecto[]>([])
const servicios           = ref<ServicioConUsd[]>([])
const testimonios         = ref<Testimonio[]>([])
const cargando            = ref(true)

onMounted(async () => {
  try {
    const [rP, rS, rT] = await Promise.all([
      proyectosServicio.listarDestacados(),
      serviciosServicio.listar({ porPagina: 6, orden: 'precio_asc' } as any),
      testimoniosServicio.destacados(6),
    ])
    proyectosDestacados.value = rP.data.datos
    servicios.value           = rS.data.datos as ServicioConUsd[]
    testimonios.value         = rT.data.datos
  } finally {
    cargando.value = false
  }
})

const cop = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const usd = (m: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(m)

const coloresAvatar = [
  'from-violet-500 to-indigo-600', 'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
]
const colorAvatar = (n: string) => coloresAvatar[n.charCodeAt(0) % coloresAvatar.length]

const ICONOS_SERVICIO = [
  'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v10m0 0h10M9 13H5m4 0v6m0 0H5a2 2 0 01-2-2v-4m14 6V9m0 10h4a2 2 0 002-2v-4',
  'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  'M13 10V3L4 14h7v7l9-11h-7z',
]
</script>

<template>
  <div class="bg-[#0a0a0f]">

    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-125 h-125 bg-violet-600/10 rounded-full blur-[130px]" />
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-[110px]" />
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-75 bg-violet-900/5 rounded-full blur-[80px]" />
        <div class="absolute inset-0 opacity-20" style="background-image:radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px);background-size:32px 32px" />
      </div>

      <div class="relative z-10 max-w-5xl mx-auto px-6 text-center pt-28 pb-20">

        <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span class="text-violet-300 text-sm font-medium">Disponibles para nuevos proyectos</span>
        </div>

        <h1 class="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.02] tracking-tight mb-7">
          Convertimos ideas<br />
          en
          <span class="relative inline-block">
            <span class="bg-linear-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">experiencias web</span>
            <span class="absolute -bottom-1 left-0 right-0 h-px bg-linear-to-r from-violet-400/0 via-violet-400/60 to-indigo-400/0" />
          </span>
        </h1>

        <p class="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Diseñamos y desarrollamos sitios web, tiendas online y plataformas SaaS que generan resultados reales para tu negocio.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <RouterLink
            :to="{ name: 'contacto' }"
            class="group flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-xl shadow-violet-600/30 hover:shadow-violet-500/40 transition-all text-base"
          >
            Cotizar mi proyecto
            <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </RouterLink>
          <RouterLink
            :to="{ name: 'proyectos' }"
            class="px-8 py-4 rounded-xl font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 transition-all text-base"
          >
            Ver portafolio
          </RouterLink>
        </div>

        <div class="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div v-for="stat in [{ valor: '+50', label: 'Proyectos' }, { valor: '4.9★', label: 'Calificación' }, { valor: '3+', label: 'Años' }]" :key="stat.valor"
            class="p-4 rounded-2xl bg-white/3 border border-white/5">
            <p class="text-2xl font-black text-white">{{ stat.valor }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ stat.label }}</p>
          </div>
        </div>
      </div>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce opacity-40">
        <div class="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
          <div class="w-1 h-1.5 rounded-full bg-white/50" />
        </div>
      </div>
    </section>

    <section class="py-28 bg-[#0d0d14]">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/15 mb-4">
              <span class="w-1 h-1 rounded-full bg-violet-400" />
              <span class="text-violet-300 text-xs font-semibold tracking-widest uppercase">Lo que hacemos</span>
            </div>
            <h2 class="text-4xl font-black text-white">Nuestros servicios</h2>
          </div>
          <RouterLink :to="{ name: 'servicios' }" class="text-sm text-gray-500 hover:text-violet-300 transition-colors shrink-0">
            Ver todos →
          </RouterLink>
        </div>

        <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div v-for="i in 6" :key="i" class="h-56 bg-white/4 rounded-2xl animate-pulse" />
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <RouterLink
            v-for="(s, i) in servicios"
            :key="s.id"
            :to="{ name: 'servicio-detalle', params: { slug: s.slug } }"
            class="group flex flex-col p-6 rounded-2xl bg-[#111118] border border-white/5 hover:border-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/8"
          >
            <div class="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mb-5 group-hover:bg-violet-500/20 transition-colors shrink-0">
              <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="ICONOS_SERVICIO[i % ICONOS_SERVICIO.length]" />
              </svg>
            </div>
            <h3 class="text-white font-semibold mb-2 group-hover:text-violet-300 transition-colors">{{ s.nombre }}</h3>
            <p class="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-5 flex-1">{{ s.descripcion }}</p>
            <div class="flex items-end justify-between pt-4 border-t border-white/5">
              <div>
                <p class="text-xs text-gray-600 mb-0.5">Desde</p>
                <p class="text-base font-bold text-white">{{ cop(s.precioDesde) }}</p>
                <p v-if="s.precioDesdeUsd" class="text-xs text-gray-600 mt-0.5">≈ {{ usd(s.precioDesdeUsd) }} USD</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-600 mb-0.5">Entrega</p>
                <p class="text-sm font-semibold text-emerald-400">{{ s.semanasEntrega }} sem.</p>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="py-28 bg-[#0a0a0f]">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/15 mb-4">
              <span class="w-1 h-1 rounded-full bg-violet-400" />
              <span class="text-violet-300 text-xs font-semibold tracking-widest uppercase">Portafolio</span>
            </div>
            <h2 class="text-4xl font-black text-white">Proyectos destacados</h2>
          </div>
          <RouterLink :to="{ name: 'proyectos' }" class="text-sm text-gray-500 hover:text-violet-300 transition-colors shrink-0">
            Ver todos →
          </RouterLink>
        </div>

        <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div v-for="i in 3" :key="i" class="h-72 bg-white/4 rounded-2xl animate-pulse" />
        </div>

        <div v-else-if="!proyectosDestacados.length" class="text-center py-16 text-gray-600">
          Proyectos próximamente
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <RouterLink
            v-for="p in proyectosDestacados"
            :key="p.id"
            :to="{ name: 'proyecto-detalle', params: { slug: p.slug } }"
            class="group rounded-2xl overflow-hidden bg-[#111118] border border-white/5 hover:border-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/8"
          >
            <div class="h-48 bg-linear-to-br from-violet-600/8 to-indigo-600/5 overflow-hidden relative">
              <img v-if="p.imagenUrl" :src="p.imagenUrl" :alt="p.titulo"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="absolute inset-0 bg-linear-to-t from-[#111118]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div class="p-5">
              <h3 class="font-semibold text-white group-hover:text-violet-300 transition-colors mb-1.5">{{ p.titulo }}</h3>
              <p class="text-gray-500 text-sm line-clamp-2 leading-relaxed">{{ p.descripcion }}</p>
              <div class="flex flex-wrap gap-1.5 mt-4">
                <span v-for="tech in p.stackTecnico.slice(0, 3)" :key="tech"
                  class="px-2.5 py-1 rounded-lg bg-white/4 border border-white/6 text-xs text-gray-500">{{ tech }}</span>
                <span v-if="p.stackTecnico.length > 3" class="px-2.5 py-1 rounded-lg bg-white/4 border border-white/6 text-xs text-gray-600">
                  +{{ p.stackTecnico.length - 3 }}
                </span>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <section v-if="!cargando && testimonios.length" class="py-28 bg-[#0d0d14]">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-14">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/15 mb-4">
            <span class="w-1 h-1 rounded-full bg-violet-400" />
            <span class="text-violet-300 text-xs font-semibold tracking-widest uppercase">Lo que dicen</span>
          </div>
          <h2 class="text-4xl font-black text-white">Clientes satisfechos</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="t in testimonios"
            :key="t.id"
            class="flex flex-col p-6 rounded-2xl bg-[#111118] border border-white/5"
          >
            <div class="flex items-center gap-0.5 mb-4">
              <span v-for="n in 5" :key="n" class="text-sm" :class="n <= t.calificacion ? 'text-yellow-400' : 'text-white/10'">★</span>
            </div>
            <p class="text-gray-300 text-sm leading-relaxed flex-1 mb-5">"{{ t.contenido }}"</p>
            <div class="flex items-center gap-3 pt-4 border-t border-white/5">
              <div
                class="w-9 h-9 rounded-full bg-linear-to-br flex items-center justify-center text-xs font-bold text-white shrink-0"
                :class="colorAvatar(t.nombreCliente)"
              >
                {{ t.nombreCliente[0]?.toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-semibold text-white">{{ t.nombreCliente }}</p>
                <p v-if="t.empresa" class="text-xs text-gray-600">{{ t.empresa }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center mt-10">
          <RouterLink :to="{ name: 'testimonios' }" class="text-sm text-gray-500 hover:text-violet-300 transition-colors">
            Ver todas las opiniones →
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="py-28 bg-[#0a0a0f]">
      <div class="max-w-3xl mx-auto px-6 text-center">
        <div class="relative overflow-hidden p-14 rounded-3xl bg-[#111118] border border-white/6">
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-violet-600/12 rounded-full blur-[60px]" />
          </div>
          <div class="relative">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/15 mb-6">
              <span class="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
              <span class="text-violet-300 text-xs font-semibold tracking-widest uppercase">Empecemos</span>
            </div>
            <h2 class="text-4xl font-black text-white mb-4">¿Listo para empezar?</h2>
            <p class="text-gray-400 text-lg mb-10 leading-relaxed max-w-lg mx-auto">
              Cuéntanos tu idea y en menos de 24 horas te enviamos una propuesta personalizada sin costo.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <RouterLink
                :to="{ name: 'contacto' }"
                class="group flex items-center gap-2.5 px-9 py-4 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-2xl shadow-violet-600/30 hover:shadow-violet-500/50 transition-all"
              >
                Comenzar mi proyecto
                <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </RouterLink>
              <RouterLink
                :to="{ name: 'proyectos' }"
                class="px-9 py-4 rounded-xl font-semibold text-gray-400 hover:text-white bg-white/4 hover:bg-white/8 border border-white/8 transition-all"
              >
                Ver portafolio
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>