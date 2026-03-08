<script setup lang="ts">
// ProyectosView.vue
import { ref, onMounted, computed } from 'vue'
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
  <div class="min-h-screen bg-[#0a0a0f] pt-24 pb-16">
    <div class="max-w-7xl mx-auto px-6">

      <!-- Encabezado -->
      <div class="text-center mb-14">
        <p class="text-violeta-claro text-sm font-semibold uppercase tracking-widest mb-3">Nuestro trabajo</p>
        <h1 class="text-5xl font-black text-white mb-4">Portafolio</h1>
        <p class="text-gris-medio text-lg max-w-xl mx-auto">Proyectos que hemos diseñado y desarrollado para clientes de diferentes industrias.</p>
      </div>

      <!-- Búsqueda -->
      <div class="relative max-w-md mx-auto mb-8">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gris-medio pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="busqueda" type="search" placeholder="Buscar proyectos..." @keydown.enter="buscarProyectos"
          class="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none transition-all" />
      </div>

      <!-- Filtros de tecnología -->
      <div v-if="tecnologias.length" class="flex flex-wrap justify-center gap-2 mb-12">
        <button
          class="px-4 py-2 rounded-full text-sm font-medium transition-all"
          :class="tecActiva === '' ? 'bg-violeta text-white' : 'bg-white/5 text-gris-medio hover:text-white border border-white/5 hover:border-white/10'"
          @click="filtrarPorTec('')"
        >Todos</button>
        <button
          v-for="tec in tecnologias.slice(0, 12)"
          :key="tec.tecnologia"
          class="px-4 py-2 rounded-full text-sm font-medium transition-all"
          :class="tecActiva === tec.tecnologia ? 'bg-violeta text-white' : 'bg-white/5 text-gris-medio hover:text-white border border-white/5 hover:border-white/10'"
          @click="filtrarPorTec(tec.tecnologia)"
        >{{ tec.tecnologia }} <span class="opacity-60">({{ tec.cantidad }})</span></button>
      </div>

      <!-- Grid -->
      <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="h-72 bg-white/5 rounded-2xl animate-pulse" />
      </div>

      <div v-else-if="!proyectos.length" class="text-center py-20">
        <p class="text-white font-medium text-lg">No se encontraron proyectos</p>
        <p class="text-gris-medio mt-2">Prueba con otras tecnologías o busca otro término</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RouterLink
          v-for="p in proyectos"
          :key="p.id"
          :to="{ name: 'proyecto-detalle', params: { slug: p.slug } }"
          class="group rounded-2xl overflow-hidden bg-white/3 border border-white/5 hover:border-violeta/20 transition-all"
        >
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
              <span v-for="tech in p.stackTecnico.slice(0, 4)" :key="tech" class="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-xs text-gris-medio">{{ tech }}</span>
            </div>
          </div>
        </RouterLink>
      </div>

      <div v-if="pag.totalPaginas.value > 1" class="mt-10 bg-[#13151f] border border-white/5 rounded-2xl px-6 py-4">
        <AppPaginacion :pagina-actual="pag.paginaActual.value" :total-paginas="pag.totalPaginas.value"
          :total-registros="pag.totalRegistros.value" :por-pagina="pag.porPagina.value" @cambiar="(p) => { pag.irAPagina(p); cargar() }" />
      </div>
    </div>
  </div>
</template>