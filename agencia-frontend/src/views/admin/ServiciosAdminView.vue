<script setup lang="ts">
// ServiciosAdminView.vue
import { ref, reactive, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { serviciosServicio } from '@/services/servicios'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppModal      from '@/components/ui/AppModal.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import { usePaginacion } from '@/composables/usePaginacion'
import type { Servicio, DatosCrearServicio } from '@/types'

const uiStore = useUiStore()
const pag     = usePaginacion(10)

const servicios  = ref<Servicio[]>([])
const cargando   = ref(true)
const guardando  = ref(false)
const modalForm  = ref(false)
const editando   = ref<Servicio | null>(null)

const formulario = reactive<DatosCrearServicio & { activo: boolean }>({
  nombre: '', slug: '', descripcion: '',
  precioDesde: 0, precioHasta: 0, semanasEntrega: 4,
  caracteristicas: [], activo: true,
})
const caracteristicasTexto = ref('')

const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await serviciosServicio.listarAdmin({ pagina: pag.paginaActual.value, porPagina: pag.porPagina.value })
    servicios.value = data.datos
    pag.actualizarPaginacion(data.paginacion)
  } catch { uiStore.error('Error', 'No se pudieron cargar los servicios') }
  finally { cargando.value = false }
}

onMounted(cargar)
watch(() => pag.paginaActual.value, cargar)

const reset = () => {
  Object.assign(formulario, { nombre: '', slug: '', descripcion: '', precioDesde: 0, precioHasta: 0, semanasEntrega: 4, caracteristicas: [], activo: true })
  caracteristicasTexto.value = ''
  editando.value = null
}

const abrirCrear = () => { reset(); modalForm.value = true }

const abrirEditar = (s: Servicio) => {
  editando.value = s
  Object.assign(formulario, { ...s, activo: s.activo })
  caracteristicasTexto.value = s.caracteristicas.join('\n')
  modalForm.value = true
}

const generarSlug = () => {
  formulario.slug = formulario.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const guardar = async () => {
  formulario.caracteristicas = caracteristicasTexto.value.split('\n').map(s => s.trim()).filter(Boolean)
  guardando.value = true
  try {
    if (editando.value) {
      await serviciosServicio.actualizar(editando.value.id, formulario)
      uiStore.exito('Servicio actualizado')
    } else {
      await serviciosServicio.crear(formulario)
      uiStore.exito('Servicio creado')
    }
    modalForm.value = false
    reset()
    cargar()
  } catch { uiStore.error('Error', 'No se pudo guardar') }
  finally { guardando.value = false }
}

const toggleActivo = async (s: Servicio) => {
  try {
    if (s.activo) await serviciosServicio.desactivar(s.id)
    else          await serviciosServicio.activar(s.id)
    uiStore.exito(s.activo ? 'Servicio desactivado' : 'Servicio activado')
    cargar()
  } catch { uiStore.error('Error', 'No se pudo actualizar el estado') }
}

const eliminar = async (s: Servicio) => {
  if (!confirm(`¿Eliminar el servicio "${s.nombre}"?`)) return
  try {
    await serviciosServicio.eliminar(s.id)
    uiStore.exito('Servicio eliminado')
    cargar()
  } catch { uiStore.error('Error', 'No se pudo eliminar') }
}

const formatearMoneda = (m: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Servicios</h1>
        <p class="text-gris-medio text-sm mt-1">Catálogo de servicios ofrecidos por la agencia</p>
      </div>
      <AppBoton variante="primario" @click="abrirCrear">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Nuevo servicio
      </AppBoton>
    </div>

    <div class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
      <div v-if="cargando" class="p-8 space-y-3">
        <div v-for="i in 4" :key="i" class="h-16 bg-white/5 rounded-xl animate-pulse" />
      </div>

      <div v-else-if="!servicios.length" class="py-20 text-center">
        <p class="text-white font-medium">No hay servicios</p>
        <p class="text-gris-medio text-sm mt-1">Crea el primer servicio para mostrarlo en el sitio</p>
      </div>

      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-white/5">
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide">Servicio</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide hidden md:table-cell">Precio</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide hidden lg:table-cell">Entrega</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide">Estado</th>
            <th class="px-4 py-3.5" />
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-for="s in servicios" :key="s.id" class="hover:bg-white/3 transition-colors">
            <td class="px-6 py-4">
              <p class="text-sm font-medium text-white">{{ s.nombre }}</p>
              <p class="text-xs text-gris-medio line-clamp-1">{{ s.descripcion }}</p>
            </td>
            <td class="px-4 py-4 hidden md:table-cell">
              <p class="text-sm text-blanco-suave">{{ formatearMoneda(s.precioDesde) }}</p>
              <p class="text-xs text-gris-medio">hasta {{ formatearMoneda(s.precioHasta) }}</p>
            </td>
            <td class="px-4 py-4 hidden lg:table-cell">
              <span class="text-sm text-blanco-suave">{{ s.semanasEntrega }} sem.</span>
            </td>
            <td class="px-4 py-4">
              <button @click="toggleActivo(s)">
                <AppInsignia :variante="s.activo ? 'exito' : 'neutro'" punto>{{ s.activo ? 'Activo' : 'Inactivo' }}</AppInsignia>
              </button>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-1 justify-end">
                <button class="p-1.5 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all" @click="abrirEditar(s)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button class="p-1.5 rounded-lg text-gris-medio hover:text-rojo hover:bg-rojo/10 transition-all" @click="eliminar(s)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="pag.totalPaginas.value > 1" class="px-6 py-4 border-t border-white/5">
        <AppPaginacion :pagina-actual="pag.paginaActual.value" :total-paginas="pag.totalPaginas.value" :total-registros="pag.totalRegistros.value" :por-pagina="pag.porPagina.value" @cambiar="pag.irAPagina" />
      </div>
    </div>

    <!-- Modal -->
    <AppModal :abierto="modalForm" :titulo="editando ? 'Editar servicio' : 'Nuevo servicio'" tamano="md" @cerrar="modalForm = false">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Nombre <span class="text-rojo">*</span></label>
            <input v-model="formulario.nombre" type="text" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none" @blur="!editando && !formulario.slug && generarSlug()" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Slug</label>
            <div class="flex gap-2">
              <input v-model="formulario.slug" type="text" class="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none" />
              <button type="button" class="px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gris-medio hover:text-white" @click="generarSlug">Auto</button>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-blanco-suave">Descripción</label>
          <textarea v-model="formulario.descripcion" rows="3" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none resize-none" />
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Precio desde (COP)</label>
            <input v-model.number="formulario.precioDesde" type="number" min="0" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Precio hasta (COP)</label>
            <input v-model.number="formulario.precioHasta" type="number" min="0" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Semanas entrega</label>
            <input v-model.number="formulario.semanasEntrega" type="number" min="1" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-blanco-suave">Características (una por línea)</label>
          <textarea v-model="caracteristicasTexto" rows="4" placeholder="Diseño responsivo&#10;SEO optimizado&#10;Panel de administración" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none resize-none font-mono" />
        </div>
      </div>

      <template #footer>
        <AppBoton variante="fantasma" @click="modalForm = false">Cancelar</AppBoton>
        <AppBoton variante="primario" :cargando="guardando" @click="guardar">{{ editando ? 'Guardar cambios' : 'Crear servicio' }}</AppBoton>
      </template>
    </AppModal>
  </div>
</template>