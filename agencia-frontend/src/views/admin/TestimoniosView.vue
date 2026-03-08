<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { testimoniosServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import type { Testimonio } from '@/types'

const uiStore = useUiStore()
const pag     = usePaginacion(12)

const testimonios = ref<Testimonio[]>([])
const cargando    = ref(true)

const filtros = reactive({
  busqueda: '',
  visible:  '' as 'true' | 'false' | '',
})

const cargar = async () => {
  cargando.value = true
  try {
    const params: Record<string, unknown> = { pagina: pag.paginaActual.value, porPagina: pag.porPagina.value }
    if (filtros.busqueda) params.busqueda = filtros.busqueda
    if (filtros.visible)  params.visible  = filtros.visible
    const { data } = await testimoniosServicio.listarAdmin(params as any)
    testimonios.value = data.datos
    pag.actualizarPaginacion(data.paginacion)
  } catch { uiStore.error('Error', 'No se pudieron cargar los testimonios') }
  finally { cargando.value = false }
}

onMounted(cargar)
watch([filtros, () => pag.paginaActual.value], () => {
  if (pag.paginaActual.value !== 1) pag.reiniciar()
  else cargar()
}, { deep: true })

const moderar = async (t: Testimonio) => {
  try {
    await testimoniosServicio.moderar(t.id, { visible: !t.visible })
    uiStore.exito(t.visible ? 'Testimonio ocultado' : 'Testimonio aprobado y visible')
    cargar()
  } catch { uiStore.error('Error', 'No se pudo moderar') }
}

const eliminar = async (t: Testimonio) => {
  if (!confirm(`¿Eliminar el testimonio de ${t.nombreCliente}?`)) return
  try {
    await testimoniosServicio.eliminar(t.id)
    uiStore.exito('Testimonio eliminado')
    cargar()
  } catch { uiStore.error('Error', 'No se pudo eliminar') }
}

const estrellas = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

const formatearFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f))
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <div>
      <h1 class="text-2xl font-bold text-white">Testimonios</h1>
      <p class="text-gris-medio text-sm mt-1">Modera los comentarios de clientes antes de publicarlos</p>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1 relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gris-medio pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="filtros.busqueda" type="search" placeholder="Buscar por nombre o empresa..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none transition-all" />
      </div>
      <select v-model="filtros.visible" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-blanco-suave text-sm outline-none">
        <option value="">Todos</option>
        <option value="true">Visibles</option>
        <option value="false">Ocultos</option>
      </select>
    </div>

    <!-- Cards de testimonios -->
    <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 6" :key="i" class="h-40 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <div v-else-if="!testimonios.length" class="py-20 text-center bg-[#13151f] border border-white/5 rounded-2xl">
      <p class="text-white font-medium">No hay testimonios</p>
      <p class="text-gris-medio text-sm mt-1">Los testimonios enviados por clientes aparecerán aquí</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="t in testimonios"
        :key="t.id"
        class="bg-[#13151f] border rounded-2xl p-5 transition-all"
        :class="t.visible ? 'border-white/5' : 'border-amarillo/20 bg-amarillo/5'"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="text-sm font-medium text-white">{{ t.nombreCliente }}</p>
            <p v-if="t.empresa" class="text-xs text-gris-medio">{{ t.empresa }}</p>
            <p class="text-amarillo text-sm mt-1 tracking-widest">{{ estrellas(t.calificacion) }}</p>
          </div>
          <AppInsignia :variante="t.visible ? 'exito' : 'advertencia'" punto>
            {{ t.visible ? 'Visible' : 'Oculto' }}
          </AppInsignia>
        </div>

        <!-- Contenido -->
        <p class="text-sm text-blanco-suave leading-relaxed line-clamp-3">{{ t.contenido }}</p>

        <!-- Proyecto relacionado -->
        <p v-if="t.proyecto" class="text-xs text-gris-medio mt-2">
          Proyecto: <span class="text-violeta-claro">{{ t.proyecto.titulo }}</span>
        </p>

        <!-- Acciones -->
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <span class="text-xs text-gris-medio">{{ formatearFecha(t.creadoEn) }}</span>
          <div class="flex items-center gap-1">
            <button
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              :class="t.visible
                ? 'text-gris-medio hover:text-amarillo hover:bg-amarillo/10'
                : 'text-verde hover:bg-verde/10'"
              @click="moderar(t)"
            >
              {{ t.visible ? 'Ocultar' : 'Aprobar' }}
            </button>
            <button class="p-1.5 rounded-lg text-gris-medio hover:text-rojo hover:bg-rojo/10 transition-all" @click="eliminar(t)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pag.totalPaginas.value > 1" class="bg-[#13151f] border border-white/5 rounded-2xl px-6 py-4">
      <AppPaginacion :pagina-actual="pag.paginaActual.value" :total-paginas="pag.totalPaginas.value" :total-registros="pag.totalRegistros.value" :por-pagina="pag.porPagina.value" @cambiar="pag.irAPagina" />
    </div>
  </div>
</template>