<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { serviciosServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppModal      from '@/components/ui/AppModal.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import type { Servicio, DatosCrearServicio, TipoServicio } from '@/types'

const uiStore = useUiStore()
const pag     = usePaginacion(10)

const servicios  = ref<Servicio[]>([])
const cargando   = ref(true)
const guardando  = ref(false)
const modalForm  = ref(false)
const editando   = ref<Servicio | null>(null)

const filtros = reactive({
  busqueda: '',
  activo:   '' as 'true' | 'false' | '',
  tipo:     '' as TipoServicio | '',
})

const formulario = reactive<DatosCrearServicio & { activo: boolean }>({
  nombre:          '',
  slug:            '',
  descripcion:     '',
  tipo:            undefined,
  precioDesde:     0,
  precioHasta:     null,
  semanasEntrega:  4,
  caracteristicas: [],
  activo:          true,
})

const caracteristicasTexto = ref('')

const TIPOS_SERVICIO: { valor: TipoServicio; etiqueta: string; color: string; bg: string; dot: string }[] = [
  { valor: 'LANDING',       etiqueta: 'Landing Page',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',    dot: 'bg-blue-400' },
  { valor: 'CORPORATIVO',   etiqueta: 'Corporativo',   color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20', dot: 'bg-violet-400' },
  { valor: 'ECOMMERCE',     etiqueta: 'E-commerce',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  { valor: 'SAAS',          etiqueta: 'SaaS',          color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',  dot: 'bg-amber-400' },
  { valor: 'MANTENIMIENTO', etiqueta: 'Mantenimiento', color: 'text-slate-300',   bg: 'bg-white/8 border-white/15',           dot: 'bg-slate-400' },
]

const configTipo = computed(() => {
  const map: Record<string, typeof TIPOS_SERVICIO[0]> = {}
  TIPOS_SERVICIO.forEach(t => { map[t.valor] = t })
  return map
})

const totalActivos = computed(() => servicios.value.filter(s => s.activo).length)

const formatearMoneda = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const generarSlug = () => {
  formulario.slug = formulario.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const cargar = async () => {
  cargando.value = true
  try {
    const params: Record<string, unknown> = {
      pagina:    pag.paginaActual.value,
      porPagina: pag.porPagina.value,
    }
    if (filtros.busqueda) params.busqueda = filtros.busqueda
    if (filtros.activo)   params.activo   = filtros.activo
    if (filtros.tipo)     params.tipo     = filtros.tipo

    const { data } = await serviciosServicio.listarAdmin(params as any)
    servicios.value = data.datos
    pag.actualizarPaginacion(data.paginacion)
  } catch {
    uiStore.error('Error', 'No se pudieron cargar los servicios')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
watch(filtros, () => { pag.paginaActual.value = 1; cargar() }, { deep: true })
const cambiarPagina = (pagina: number) => { pag.irAPagina(pagina); cargar() }

const reset = () => {
  Object.assign(formulario, {
    nombre: '', slug: '', descripcion: '', tipo: undefined,
    precioDesde: 0, precioHasta: null, semanasEntrega: 4,
    caracteristicas: [], activo: true,
  })
  caracteristicasTexto.value = ''
  editando.value = null
}

const abrirCrear = () => { reset(); modalForm.value = true }

const abrirEditar = (s: Servicio) => {
  editando.value = s
  Object.assign(formulario, {
    nombre:          s.nombre,
    slug:            s.slug,
    descripcion:     s.descripcion,
    tipo:            s.tipo,
    precioDesde:     s.precioDesde,
    precioHasta:     s.precioHasta ?? null,
    semanasEntrega:  s.semanasEntrega,
    caracteristicas: [...s.caracteristicas],
    activo:          s.activo ?? true,
  })
  caracteristicasTexto.value = s.caracteristicas.join('\n')
  modalForm.value = true
}

const guardar = async () => {
  if (!formulario.nombre || !formulario.slug) {
    uiStore.advertencia('Campos requeridos', 'Completa nombre y slug')
    return
  }
  formulario.caracteristicas = caracteristicasTexto.value.split('\n').map(s => s.trim()).filter(Boolean)
  formulario.precioHasta     = formulario.precioHasta || null

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
  } catch {
    uiStore.error('Error', 'No se pudo guardar el servicio')
  } finally {
    guardando.value = false
  }
}

const toggleActivo = async (s: Servicio) => {
  try {
    if (s.activo) await serviciosServicio.desactivar(s.id)
    else          await serviciosServicio.activar(s.id)
    uiStore.exito(s.activo ? 'Servicio desactivado' : 'Servicio activado')
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el estado')
  }
}

const eliminar = async (s: Servicio) => {
  if (!confirm(`¿Eliminar el servicio "${s.nombre}"? Esta acción no se puede deshacer.`)) return
  try {
    await serviciosServicio.eliminar(s.id)
    uiStore.exito('Servicio eliminado')
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo eliminar')
  }
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">

    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Servicios</h1>
        <p class="text-slate-500 text-sm mt-1">
          Catálogo de la agencia
          <span v-if="pag.totalRegistros.value" class="text-slate-600">· {{ pag.totalRegistros.value }} total</span>
          <span v-if="totalActivos" class="text-emerald-500/70"> · {{ totalActivos }} activos</span>
        </p>
      </div>
      <AppBoton variante="primario" @click="abrirCrear">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo servicio
      </AppBoton>
    </div>

    <div class="bg-[#13151f] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
      <div class="flex-1 relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="filtros.busqueda"
          type="search"
          placeholder="Buscar servicios..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
        />
      </div>
      <select v-model="filtros.tipo" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none">
        <option value="">Todos los tipos</option>
        <option v-for="t in TIPOS_SERVICIO" :key="t.valor" :value="t.valor">{{ t.etiqueta }}</option>
      </select>
      <select v-model="filtros.activo" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none">
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </div>

    <div class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">

      <div v-if="cargando" class="p-8 space-y-3">
        <div v-for="i in 4" :key="i" class="h-16 bg-white/5 rounded-xl animate-pulse" />
      </div>

      <div v-else-if="!servicios.length" class="py-20 text-center">
        <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <p class="text-white font-medium">No hay servicios</p>
        <p class="text-slate-500 text-sm mt-1">Crea el primer servicio para mostrarlo en el sitio</p>
      </div>

      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-white/5">
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Servicio</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Tipo</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Precio</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Entrega</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Incluye</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
            <th class="px-4 py-3.5" />
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-for="s in servicios" :key="s.id" class="hover:bg-white/3 transition-colors group">
            <td class="px-6 py-4">
              <p class="text-sm font-medium text-white">{{ s.nombre }}</p>
              <p class="text-xs text-slate-500 line-clamp-1 max-w-xs">{{ s.descripcion }}</p>
            </td>
            <td class="px-4 py-4 hidden sm:table-cell">
              <template v-if="s.tipo">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border"
                  :class="[configTipo[s.tipo]?.bg ?? 'bg-white/5 border-white/10', configTipo[s.tipo]?.color ?? 'text-slate-400']"
                >
                  {{ configTipo[s.tipo]?.etiqueta ?? s.tipo }}
                </span>
              </template>
              <span v-else class="text-xs text-slate-600">—</span>
            </td>
            <td class="px-4 py-4 hidden md:table-cell">
              <p class="text-sm text-slate-300 tabular-nums">{{ formatearMoneda(s.precioDesde) }}</p>
              <p v-if="s.precioHasta" class="text-xs text-slate-500 tabular-nums">hasta {{ formatearMoneda(s.precioHasta) }}</p>
            </td>
            <td class="px-4 py-4 hidden lg:table-cell">
              <span class="text-sm text-slate-300">{{ s.semanasEntrega }} sem.</span>
            </td>
            <td class="px-4 py-4 hidden lg:table-cell">
              <span class="text-xs text-slate-500">{{ s.caracteristicas.length }} características</span>
            </td>
            <td class="px-4 py-4">
              <button @click="toggleActivo(s)">
                <AppInsignia :variante="s.activo ? 'exito' : 'neutro'" punto>
                  {{ s.activo ? 'Activo' : 'Inactivo' }}
                </AppInsignia>
              </button>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                  title="Editar"
                  @click="abrirEditar(s)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Eliminar"
                  @click="eliminar(s)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="pag.totalPaginas.value > 1" class="px-6 py-4 border-t border-white/5">
        <AppPaginacion
          :pagina-actual="pag.paginaActual.value"
          :total-paginas="pag.totalPaginas.value"
          :total-registros="pag.totalRegistros.value"
          :por-pagina="pag.porPagina.value"
          @cambiar="cambiarPagina"
        />
      </div>
    </div>

    <AppModal
      :abierto="modalForm"
      :titulo="editando ? `Editar · ${editando.nombre}` : 'Nuevo servicio'"
      tamano="md"
      @cerrar="modalForm = false"
    >
      <div class="space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nombre <span class="text-red-400">*</span>
            </label>
            <input
              v-model="formulario.nombre"
              type="text"
              placeholder="Landing Page Pro"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
              @blur="!editando && !formulario.slug && generarSlug()"
            />
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Slug</label>
            <div class="flex gap-2">
              <input
                v-model="formulario.slug"
                type="text"
                placeholder="landing-page-pro"
                class="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
              />
              <button
                type="button"
                class="px-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 text-xs text-slate-400 hover:text-white transition-all"
                @click="generarSlug"
              >
                Auto
              </button>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de servicio</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in TIPOS_SERVICIO"
              :key="t.valor"
              type="button"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all"
              :class="formulario.tipo === t.valor
                ? [t.bg, t.color, 'ring-1 ring-current/30']
                : 'bg-white/3 border-white/8 text-slate-500 hover:bg-white/6 hover:text-slate-200 hover:border-white/15'"
              @click="formulario.tipo = formulario.tipo === t.valor ? undefined : t.valor"
            >
              <svg
                v-if="formulario.tipo === t.valor"
                class="w-3 h-3 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="w-2 h-2 rounded-full shrink-0" v-else :class="t.dot ?? 'bg-slate-500'" />
              {{ t.etiqueta }}
            </button>
          </div>
          <p v-if="!formulario.tipo" class="text-xs text-slate-600">Opcional · elige el tipo que mejor describe este servicio</p>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
          <textarea
            v-model="formulario.descripcion"
            rows="3"
            placeholder="Descripción del servicio..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none resize-none transition-all"
          />
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio desde</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
              <input
                v-model.number="formulario.precioDesde"
                type="number"
                min="0"
                class="w-full pl-7 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
              />
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio hasta</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
              <input
                v-model.number="formulario.precioHasta"
                type="number"
                min="0"
                placeholder="Opcional"
                class="w-full pl-7 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-600 text-sm outline-none transition-all"
              />
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Semanas entrega</label>
            <input
              v-model.number="formulario.semanasEntrega"
              type="number"
              min="1"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
            />
          </div>
        </div>

        <div v-if="formulario.precioDesde || formulario.precioHasta" class="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15 text-xs text-emerald-400">
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Rango visible: <strong>{{ formatearMoneda(formulario.precioDesde) }}</strong>
            <template v-if="formulario.precioHasta"> — <strong>{{ formatearMoneda(formulario.precioHasta) }}</strong></template>
          </span>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Características
            <span class="ml-1 text-slate-600 font-normal normal-case">· una por línea</span>
          </label>
          <textarea
            v-model="caracteristicasTexto"
            rows="5"
            placeholder="Diseño responsivo&#10;SEO optimizado&#10;Panel de administración&#10;Soporte 30 días"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-600 text-sm outline-none resize-none font-mono transition-all"
          />
          <p class="text-xs text-slate-600">
            {{ caracteristicasTexto.split('\n').filter(Boolean).length }} características ingresadas
          </p>
        </div>

        <label class="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all">
          <div class="relative shrink-0">
            <input type="checkbox" v-model="formulario.activo" class="sr-only" />
            <div class="w-10 h-5 rounded-full transition-colors" :class="formulario.activo ? 'bg-violet-600' : 'bg-white/10'" />
            <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" :class="formulario.activo ? 'translate-x-5' : ''" />
          </div>
          <div>
            <p class="text-sm text-slate-300 font-medium">Servicio activo</p>
            <p class="text-xs text-slate-500">Visible en el sitio público y disponible para cotizaciones</p>
          </div>
        </label>

      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalForm = false">Cancelar</AppBoton>
        <AppBoton variante="primario" :cargando="guardando" @click="guardar">
          {{ editando ? 'Guardar cambios' : 'Crear servicio' }}
        </AppBoton>
      </template>
    </AppModal>

  </div>
</template>