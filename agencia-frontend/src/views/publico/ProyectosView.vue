<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { proyectosServicio } from '@/services/servicios'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import { usePaginacion } from '@/composables/usePaginacion'
import type { Proyecto, TecnologiaConteo } from '@/types'

const pag         = usePaginacion(9)
const proyectos   = ref<Proyecto[]>([])
const tecnologias = ref<TecnologiaConteo[]>([])
const cargando    = ref(true)
const tecActiva   = ref('')
const busqueda    = ref('')

const cargar = async () => {
  cargando.value = true
  try {
    const params: Record<string, unknown> = { pagina: pag.paginaActual.value, porPagina: pag.porPagina.value }
    if (tecActiva.value) params.tecnologia = tecActiva.value
    if (busqueda.value)  params.busqueda   = busqueda.value
    const [rP, rT] = await Promise.all([
      proyectosServicio.listar(params as any),
      tecnologias.value.length ? Promise.resolve(null) : proyectosServicio.tecnologias(),
    ])
    proyectos.value = rP.data.datos
    pag.actualizarPaginacion(rP.data.paginacion)
    if (rT) tecnologias.value = rT.data.datos
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

const filtrarPorTec = (tec: string) => {
  tecActiva.value = tecActiva.value === tec ? '' : tec
  pag.reiniciar()
  cargar()
}

const buscarProyectos = () => {
  pag.reiniciar()
  cargar()
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f]">

    <div class="relative overflow-hidden pt-32 pb-16 px-6">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-1/3 w-96 h-96 bg-violet-600/6 rounded-full blur-[120px]" />
        <div class="absolute top-10 right-1/4 w-72 h-72 bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div class="relative max-w-7xl mx-auto">

        <div class="text-center mb-14">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span class="text-violet-300 text-xs font-semibold tracking-widest uppercase">Nuestro trabajo</span>
          </div>
          <h1 class="text-5xl sm:text-6xl font-black text-white mb-5">Portafolio</h1>
          <p class="text-gray-400 text-lg max-w-xl mx-auto">
            Proyectos que hemos diseñado y desarrollado para clientes de diferentes industrias.
          </p>
        </div>

        <div class="relative max-w-md mx-auto mb-8">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar proyectos..."
            class="w-full pl-11 pr-4 py-3 rounded-xl bg-white/4 border border-white/8 focus:border-violet-500/50 text-white placeholder-gray-600 text-sm outline-none transition-all"
            @keydown.enter="buscarProyectos"
          />
        </div>

        <div v-if="tecnologias.length" class="flex flex-wrap justify-center gap-2 mb-14">
          <button
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            :class="tecActiva === ''
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
              : 'bg-white/4 text-gray-400 hover:text-white border border-white/6 hover:border-white/12'"
            @click="filtrarPorTec('')"
          >
            Todos
          </button>
          <button
            v-for="tec in tecnologias.slice(0, 12)"
            :key="tec.tecnologia"
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            :class="tecActiva === tec.tecnologia
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
              : 'bg-white/4 text-gray-400 hover:text-white border border-white/6 hover:border-white/12'"
            @click="filtrarPorTec(tec.tecnologia)"
          >
            {{ tec.tecnologia }}
            <span class="opacity-50 ml-1 text-xs">{{ tec.cantidad }}</span>
          </button>
        </div>

        <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div v-for="i in 6" :key="i" class="h-72 bg-white/4 rounded-2xl animate-pulse" />
        </div>

        <div v-else-if="!proyectos.length" class="text-center py-24">
          <div class="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mx-auto mb-5">
            <svg class="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-white font-semibold text-lg">No se encontraron proyectos</p>
          <p class="text-gray-500 text-sm mt-2">Prueba con otras tecnologías o términos de búsqueda</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <RouterLink
            v-for="p in proyectos"
            :key="p.id"
            :to="{ name: 'proyecto-detalle', params: { slug: p.slug } }"
            class="group rounded-2xl overflow-hidden bg-[#111118] border border-white/6 hover:border-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/8"
          >
            <div class="h-48 bg-linear-to-br from-violet-600/8 to-indigo-600/5 overflow-hidden relative">
              <img
                v-if="p.imagenUrl"
                :src="p.imagenUrl"
                :alt="p.titulo"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="absolute inset-0 bg-linear-to-t from-[#111118]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                <div class="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shadow-lg">
                  <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="p-5">
              <h3 class="font-semibold text-white group-hover:text-violet-300 transition-colors text-base">{{ p.titulo }}</h3>
              <p class="text-gray-500 text-sm mt-1.5 line-clamp-2 leading-relaxed">{{ p.descripcion }}</p>
              <div class="flex flex-wrap gap-1.5 mt-4">
                <span
                  v-for="tech in p.stackTecnico.slice(0, 4)"
                  :key="tech"
                  class="px-2.5 py-1 rounded-lg bg-white/4 border border-white/6 text-xs text-gray-500 font-medium"
                >
                  {{ tech }}
                </span>
                <span v-if="p.stackTecnico.length > 4" class="px-2.5 py-1 rounded-lg bg-white/4 border border-white/6 text-xs text-gray-600">
                  +{{ p.stackTecnico.length - 4 }}
                </span>
              </div>
            </div>
          </RouterLink>
        </div>

        <div v-if="pag.totalPaginas.value > 1" class="mt-10 bg-[#111118] border border-white/6 rounded-2xl px-6 py-4">
          <AppPaginacion
            :pagina-actual="pag.paginaActual.value"
            :total-paginas="pag.totalPaginas.value"
            :total-registros="pag.totalRegistros.value"
            :por-pagina="pag.porPagina.value"
            @cambiar="(p) => { pag.irAPagina(p); cargar() }"
          />
        </div>
      </div>
    </div>
  </div>
</template>