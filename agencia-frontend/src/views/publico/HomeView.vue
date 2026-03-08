<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { proyectosServicio, serviciosServicio, testimoniosServicio } from '@/services/servicios'
import type { Proyecto, Servicio, Testimonio } from '@/types'

const proyectosDestacados = ref<Proyecto[]>([])
const servicios           = ref<Servicio[]>([])
const testimonios         = ref<Testimonio[]>([])
const cargando            = ref(true)

onMounted(async () => {
  try {
    const [rP, rS, rT] = await Promise.all([
      proyectosServicio.listarDestacados(),
      serviciosServicio.listar({ porPagina: 6 }),
      testimoniosServicio.destacados(6),
    ])
    proyectosDestacados.value = rP.data.datos
    servicios.value           = rS.data.datos
    testimonios.value         = rT.data.datos
  } finally {
    cargando.value = false
  }
})

const formatearMoneda = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const estrellas = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)
</script>

<template>
  <div>
    <!-- ─── HERO ──────────────────────────────────────────────────────────── -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
      <!-- Fondo animado -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/3 left-1/4 w-125 h-125 bg-violeta/10 rounded-full blur-[120px]" />
        <div class="absolute bottom-1/3 right-1/4 w-100 h-100 bg-indigo-500/8 rounded-full blur-[100px]" />
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      </div>

      <div class="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24 pb-16">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violeta/10 border border-violeta/20 text-violeta-claro text-sm font-medium mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-verde animate-pulse" />
          Agencia activa · Disponibles para nuevos proyectos
        </div>

        <!-- Headline -->
        <h1 class="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
          Convertimos tus ideas<br />
          en
          <span class="text-transparent bg-clip-text bg-linear-to-r from-violeta to-indigo-400">
            experiencias web
          </span>
        </h1>

        <p class="text-xl text-gris-medio max-w-2xl mx-auto leading-relaxed mb-10">
          Diseñamos y desarrollamos sitios web, tiendas online y plataformas SaaS
          que generan resultados reales para tu negocio.
        </p>

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <RouterLink
            :to="{ name: 'contacto' }"
            class="px-8 py-4 rounded-xl font-semibold text-white bg-violeta hover:bg-violeta/90 shadow-xl shadow-violeta/25 hover:shadow-violeta/40 transition-all text-base"
          >
            Cotizar mi proyecto →
          </RouterLink>
          <RouterLink
            :to="{ name: 'proyectos' }"
            class="px-8 py-4 rounded-xl font-semibold text-blanco-suave hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-base"
          >
            Ver portafolio
          </RouterLink>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-8 mt-20 max-w-lg mx-auto">
          <div>
            <p class="text-3xl font-black text-white">+50</p>
            <p class="text-sm text-gris-medio mt-1">Proyectos entregados</p>
          </div>
          <div>
            <p class="text-3xl font-black text-white">4.9★</p>
            <p class="text-sm text-gris-medio mt-1">Calificación promedio</p>
          </div>
          <div>
            <p class="text-3xl font-black text-white">3+</p>
            <p class="text-sm text-gris-medio mt-1">Años de experiencia</p>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <svg class="w-5 h-5 text-gris-medio" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>

    <!-- ─── SERVICIOS ─────────────────────────────────────────────────────── -->
    <section class="py-24 bg-[#0d0d16]">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-violeta-claro text-sm font-semibold uppercase tracking-widest mb-3">Lo que hacemos</p>
          <h2 class="text-4xl font-black text-white">Nuestros servicios</h2>
        </div>

        <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="h-52 bg-white/5 rounded-2xl animate-pulse" />
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RouterLink
            v-for="s in servicios"
            :key="s.id"
            :to="{ name: 'servicio-detalle', params: { slug: s.slug } }"
            class="group p-6 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/6 hover:border-violeta/20 transition-all"
          >
            <div class="w-10 h-10 rounded-xl bg-violeta/10 border border-violeta/20 flex items-center justify-center mb-5 group-hover:bg-violeta/20 transition-colors">
              <svg class="w-5 h-5 text-violeta-claro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 class="text-white font-semibold mb-2">{{ s.nombre }}</h3>
            <p class="text-gris-medio text-sm leading-relaxed line-clamp-3 mb-4">{{ s.descripcion }}</p>
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-violeta-claro">
                Desde {{ formatearMoneda(s.precioDesde) }}
              </p>
              <span class="text-xs text-gris-medio">{{ s.semanasEntrega }} semanas</span>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ─── PROYECTOS DESTACADOS ──────────────────────────────────────────── -->
    <section class="py-24 bg-[#0a0a0f]">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex items-end justify-between mb-16">
          <div>
            <p class="text-violeta-claro text-sm font-semibold uppercase tracking-widest mb-3">Portafolio</p>
            <h2 class="text-4xl font-black text-white">Proyectos destacados</h2>
          </div>
          <RouterLink :to="{ name: 'proyectos' }" class="text-sm text-gris-medio hover:text-white transition-colors hidden sm:block">
            Ver todos los proyectos →
          </RouterLink>
        </div>

        <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="h-72 bg-white/5 rounded-2xl animate-pulse" />
        </div>

        <div v-else-if="!proyectosDestacados.length" class="text-center py-12 text-gris-medio">
          Proyectos próximamente
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RouterLink
            v-for="p in proyectosDestacados"
            :key="p.id"
            :to="{ name: 'proyecto-detalle', params: { slug: p.slug } }"
            class="group rounded-2xl overflow-hidden bg-white/3 border border-white/5 hover:border-violeta/20 transition-all"
          >
            <!-- Imagen -->
            <div class="h-48 bg-linear-to-br from-violeta/10 to-indigo-500/5 overflow-hidden">
              <img v-if="p.imagenUrl" :src="p.imagenUrl" :alt="p.titulo" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-12 h-12 text-gris-medio/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div class="p-5">
              <h3 class="font-semibold text-white group-hover:text-violeta-claro transition-colors">{{ p.titulo }}</h3>
              <p class="text-gris-medio text-sm mt-1.5 line-clamp-2">{{ p.descripcion }}</p>
              <div class="flex flex-wrap gap-1.5 mt-3">
                <span v-for="tech in p.stackTecnico.slice(0, 3)" :key="tech" class="px-2 py-0.5 rounded-md bg-white/5 text-xs text-gris-medio">{{ tech }}</span>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ─── TESTIMONIOS ───────────────────────────────────────────────────── -->
    <section v-if="!cargando && testimonios.length" class="py-24 bg-[#0d0d16]">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-violeta-claro text-sm font-semibold uppercase tracking-widest mb-3">Lo que dicen</p>
          <h2 class="text-4xl font-black text-white">Clientes satisfechos</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="t in testimonios"
            :key="t.id"
            class="p-6 rounded-2xl bg-white/3 border border-white/5"
          >
            <p class="text-amarillo text-lg tracking-widest mb-4">{{ estrellas(t.calificacion) }}</p>
            <p class="text-blanco-suave text-sm leading-relaxed mb-5">
              "{{ t.contenido }}"
            </p>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-linear-to-br from-violeta/20 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violeta-claro shrink-0">
                {{ t.nombreCliente[0] }}
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ t.nombreCliente }}</p>
                <p v-if="t.empresa" class="text-xs text-gris-medio">{{ t.empresa }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── CTA FINAL ─────────────────────────────────────────────────────── -->
    <section class="py-24 bg-[#0a0a0f]">
      <div class="max-w-3xl mx-auto px-6 text-center">
        <div class="p-12 rounded-3xl bg-linear-to-br from-violeta/10 to-indigo-500/5 border border-violeta/20">
          <h2 class="text-4xl font-black text-white mb-4">
            ¿Listo para empezar?
          </h2>
          <p class="text-gris-medio text-lg mb-8 leading-relaxed">
            Cuéntanos tu idea y en menos de 24 horas te enviamos una propuesta personalizada sin costo.
          </p>
          <RouterLink
            :to="{ name: 'contacto' }"
            class="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-white bg-violeta hover:bg-violeta/90 shadow-2xl shadow-violeta/30 hover:shadow-violeta/50 transition-all text-base"
          >
            Comenzar mi proyecto
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>