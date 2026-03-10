<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { cotizacionesServicio, serviciosServicio, prospectosServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppModal      from '@/components/ui/AppModal.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import type { Cotizacion, EstadoCotizacion, Servicio, Prospecto } from '@/types'

const uiStore  = useUiStore()
const router   = useRouter()
const pag      = usePaginacion(12)

// ─── Estado ───────────────────────────────────────────────────────────────────
const cotizaciones = ref<Cotizacion[]>([])
const servicios    = ref<Servicio[]>([])
const prospectos   = ref<Prospecto[]>([])
const cargando     = ref(true)
const cargandoProspectos = ref(false)

const cotizSelec   = ref<Cotizacion | null>(null)
const modalEstado  = ref(false)
const modalCrear   = ref(false)
const guardando    = ref(false)

// ─── Filtros ──────────────────────────────────────────────────────────────────
const filtros = reactive({
  busqueda:   '',
  estado:     '' as EstadoCotizacion | '',
  servicioId: '',
})

// ─── Formulario crear ─────────────────────────────────────────────────────────
const formCrear = reactive({
  prospectoId: '',
  servicioId:  '',
  precioTotal: 0,
  extras:      [] as string[],
  notas:       '' as string | null,
})
const extraInput = ref('')

// ─── Formulario estado ────────────────────────────────────────────────────────
const formularioEstado = reactive({
  estado: '' as EstadoCotizacion,
  notas:  null as string | null,
})

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESTADOS: { valor: EstadoCotizacion | ''; etiqueta: string; color: string }[] = [
  { valor: '',           etiqueta: 'Todos',     color: '' },
  { valor: 'PENDIENTE',  etiqueta: 'Pendiente', color: 'text-amber-400' },
  { valor: 'ENVIADA',    etiqueta: 'Enviada',   color: 'text-blue-400' },
  { valor: 'ACEPTADA',   etiqueta: 'Aceptada',  color: 'text-emerald-400' },
  { valor: 'RECHAZADA',  etiqueta: 'Rechazada', color: 'text-red-400' },
]

const varianteEstado = (e: EstadoCotizacion) => ({
  PENDIENTE: 'advertencia',
  ENVIADA:   'info',
  ACEPTADA:  'exito',
  RECHAZADA: 'error',
} as const)[e]

const etiquetaEstado = (e: EstadoCotizacion) => ({
  PENDIENTE: 'Pendiente',
  ENVIADA:   'Enviada',
  ACEPTADA:  'Aceptada',
  RECHAZADA: 'Rechazada',
}[e])

const iconoEstado = (e: EstadoCotizacion) => ({
  PENDIENTE: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  ENVIADA:   'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  ACEPTADA:  'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  RECHAZADA: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
}[e])

// ─── Computed ────────────────────────────────────────────────────────────────
const resumenEstados = computed(() => {
  const counts = { PENDIENTE: 0, ENVIADA: 0, ACEPTADA: 0, RECHAZADA: 0 }
  cotizaciones.value.forEach(c => counts[c.estado]++)
  return counts
})

const servicioSeleccionado = computed(() =>
  servicios.value.find(s => s.id === formCrear.servicioId)
)

// ─── Métodos ─────────────────────────────────────────────────────────────────
const formatearMoneda = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const formatearFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f))

const cargar = async () => {
  cargando.value = true
  try {
    const params: Record<string, unknown> = {
      pagina:    pag.paginaActual.value,
      porPagina: pag.porPagina.value,
    }
    if (filtros.busqueda)   params.busqueda   = filtros.busqueda
    if (filtros.estado)     params.estado     = filtros.estado
    if (filtros.servicioId) params.servicioId = filtros.servicioId

    const [resCotiz, resSvcs] = await Promise.all([
      cotizacionesServicio.listar(params as any),
      serviciosServicio.listar({ porPagina: 50 }),
    ])
    cotizaciones.value = resCotiz.data.datos
    servicios.value    = resSvcs.data.datos
    pag.actualizarPaginacion(resCotiz.data.paginacion)
  } catch {
    uiStore.error('Error', 'No se pudieron cargar las cotizaciones')
  } finally {
    cargando.value = false
  }
}

const cargarProspectos = async () => {
  cargandoProspectos.value = true
  try {
    const res = await prospectosServicio.listar({ porPagina: 100 })
    prospectos.value = res.data.datos
  } catch {
    uiStore.error('Error', 'No se pudieron cargar los prospectos')
  } finally {
    cargandoProspectos.value = false
  }
}

onMounted(cargar)

watch(filtros, () => {
  pag.paginaActual.value = 1
  cargar()
}, { deep: true })

const cambiarPagina = (pagina: number) => {
  pag.irAPagina(pagina)
  cargar()
}

// ─── Crear cotización ─────────────────────────────────────────────────────────
const abrirModalCrear = async () => {
  formCrear.prospectoId = ''
  formCrear.servicioId  = ''
  formCrear.precioTotal = 0
  formCrear.extras      = []
  formCrear.notas       = null
  extraInput.value      = ''
  modalCrear.value      = true
  await cargarProspectos()
}

const agregarExtra = () => {
  const val = extraInput.value.trim()
  if (val && !formCrear.extras.includes(val)) {
    formCrear.extras.push(val)
    extraInput.value = ''
  }
}

const quitarExtra = (i: number) => formCrear.extras.splice(i, 1)

const crearCotizacion = async () => {
  if (!formCrear.prospectoId || !formCrear.servicioId || formCrear.precioTotal <= 0) {
    uiStore.error('Campos requeridos', 'Completa prospecto, servicio y precio')
    return
  }
  guardando.value = true
  try {
    await cotizacionesServicio.crear({
      prospectoId: formCrear.prospectoId,
      servicioId:  formCrear.servicioId,
      precioTotal: formCrear.precioTotal,
      extras:      formCrear.extras,
      notas:       formCrear.notas || null,
    })
    uiStore.exito('Cotización creada', 'Se creó correctamente como PENDIENTE')
    modalCrear.value = false
    cargar()
  } catch (e: any) {
    uiStore.error('Error', e?.response?.data?.mensaje ?? 'No se pudo crear la cotización')
  } finally {
    guardando.value = false
  }
}

// ─── Estado ───────────────────────────────────────────────────────────────────
const abrirModalEstado = (c: Cotizacion) => {
  cotizSelec.value        = c
  formularioEstado.estado = c.estado
  formularioEstado.notas  = c.notas
  modalEstado.value       = true
}

const guardarEstado = async () => {
  if (!cotizSelec.value) return
  try {
    await cotizacionesServicio.actualizarEstado(cotizSelec.value.id, formularioEstado)
    uiStore.exito('Estado actualizado')
    modalEstado.value = false
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el estado')
  }
}

// ─── Acciones ────────────────────────────────────────────────────────────────
const verDetalle = (c: Cotizacion) =>
  router.push({ name: 'admin-cotizacion-detalle', params: { id: c.id } })

const duplicar = async (c: Cotizacion) => {
  try {
    await cotizacionesServicio.duplicar(c.id)
    uiStore.exito('Cotización duplicada')
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo duplicar')
  }
}

const eliminar = async (c: Cotizacion) => {
  if (!confirm(`¿Eliminar cotización de ${formatearMoneda(c.precioTotal)}?`)) return
  try {
    await cotizacionesServicio.eliminar(c.id)
    uiStore.exito('Eliminada correctamente')
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo eliminar')
  }
}

// Sugerir precio base al seleccionar servicio
watch(() => formCrear.servicioId, (id) => {
  const svc = servicios.value.find(s => s.id === id)
  if (svc && formCrear.precioTotal === 0) {
    formCrear.precioTotal = svc.precioDesde
  }
})
</script>

<template>
  <div class="space-y-6">

    <!-- ── Encabezado ──────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Cotizaciones</h1>
        <p class="text-slate-400 text-sm mt-1">Gestiona propuestas y su ciclo de aprobación</p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-500/40 hover:-translate-y-px active:translate-y-0"
        @click="abrirModalCrear"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nueva cotización
      </button>
    </div>

    <!-- ── Tarjetas de estado ──────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <button
        v-for="e in ESTADOS.slice(1)"
        :key="e.valor"
        class="group relative p-4 rounded-2xl border transition-all text-left overflow-hidden"
        :class="filtros.estado === e.valor
          ? 'bg-white/8 border-white/20'
          : 'bg-[#13151f] border-white/5 hover:border-white/10 hover:bg-white/5'"
        @click="filtros.estado = filtros.estado === e.valor ? '' : e.valor as EstadoCotizacion"
      >
        <div class="flex items-center justify-between mb-3">
          <svg class="w-4 h-4" :class="e.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconoEstado(e.valor as EstadoCotizacion)" />
          </svg>
          <span
            v-if="filtros.estado === e.valor"
            class="text-[10px] font-bold uppercase tracking-wider text-violet-400"
          >Filtro activo</span>
        </div>
        <p class="text-2xl font-black text-white">
          {{ resumenEstados[e.valor as EstadoCotizacion] }}
        </p>
        <p class="text-xs text-slate-500 mt-0.5">{{ e.etiqueta }}</p>
      </button>
    </div>

    <!-- ── Barra de filtros ────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="filtros.busqueda"
          type="search"
          placeholder="Buscar por prospecto o correo..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#13151f] border border-white/8 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
        />
      </div>
      <select
        v-model="filtros.servicioId"
        class="px-3 py-2.5 rounded-xl bg-[#13151f] border border-white/8 text-slate-300 text-sm outline-none min-w-40"
      >
        <option value="">Todos los servicios</option>
        <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }}</option>
      </select>
    </div>

    <!-- ── Tabla ───────────────────────────────────────────────────────────── -->
    <div class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">

      <!-- Skeleton -->
      <div v-if="cargando" class="p-6 space-y-3">
        <div v-for="i in 6" :key="i" class="h-16 bg-white/4 rounded-xl animate-pulse" />
      </div>

      <!-- Vacío -->
      <div v-else-if="!cotizaciones.length" class="py-24 text-center">
        <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-white font-semibold">Sin cotizaciones</p>
        <p class="text-slate-500 text-sm mt-1">Crea la primera cotización para un prospecto</p>
        <button
          class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 text-sm font-medium transition-all"
          @click="abrirModalCrear"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva cotización
        </button>
      </div>

      <!-- Tabla -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prospecto</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Servicio</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
              <th class="px-4 py-3.5 w-24" />
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="c in cotizaciones"
              :key="c.id"
              class="group hover:bg-white/3 transition-colors cursor-pointer"
              @click="verDetalle(c)"
            >
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                    {{ c.prospecto.nombre?.[0]?.toUpperCase() ?? '?' }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ c.prospecto.nombre }}</p>
                    <p class="text-xs text-slate-500">{{ c.prospecto.correo }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 hidden md:table-cell">
                <span class="text-sm text-slate-300">{{ c.servicio.nombre }}</span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm font-bold text-white tabular-nums">{{ formatearMoneda(c.precioTotal) }}</span>
              </td>
              <td class="px-4 py-4">
                <button
                  class="hover:opacity-80 transition-opacity"
                  @click.stop="abrirModalEstado(c)"
                >
                  <AppInsignia :variante="varianteEstado(c.estado)" punto>{{ etiquetaEstado(c.estado) }}</AppInsignia>
                </button>
              </td>
              <td class="px-4 py-4 hidden lg:table-cell">
                <span class="text-xs text-slate-500">{{ formatearFecha(c.creadoEn) }}</span>
              </td>
              <td class="px-4 py-4" @click.stop>
                <div class="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all"
                    title="Ver detalle"
                    @click="verDetalle(c)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    class="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                    title="Duplicar"
                    @click="duplicar(c)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Eliminar"
                    @click="eliminar(c)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="pag.totalPaginas.value > 1" class="px-5 py-4 border-t border-white/5">
        <AppPaginacion
          :pagina-actual="pag.paginaActual.value"
          :total-paginas="pag.totalPaginas.value"
          :total-registros="pag.totalRegistros.value"
          :por-pagina="pag.porPagina.value"
          @cambiar="cambiarPagina"
        />
      </div>
    </div>

    <!-- ── Modal: Crear cotización ────────────────────────────────────────── -->
    <AppModal :abierto="modalCrear" titulo="Nueva cotización" tamano="md" @cerrar="modalCrear = false">
      <div class="space-y-5">

        <!-- Prospecto -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Prospecto *</label>
          <div v-if="cargandoProspectos" class="h-10 bg-white/5 rounded-xl animate-pulse" />
          <select
            v-else
            v-model="formCrear.prospectoId"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
          >
            <option value="" disabled>Selecciona un prospecto...</option>
            <option v-for="p in prospectos" :key="p.id" :value="p.id">
              {{ p.nombre }} — {{ p.correo }}
            </option>
          </select>
        </div>

        <!-- Servicio -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Servicio *</label>
          <select
            v-model="formCrear.servicioId"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
          >
            <option value="" disabled>Selecciona un servicio...</option>
            <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
          <p v-if="servicioSeleccionado" class="text-xs text-slate-500">
            Rango base: {{ formatearMoneda(servicioSeleccionado.precioDesde) }}
            <template v-if="servicioSeleccionado.precioHasta"> — {{ formatearMoneda(servicioSeleccionado.precioHasta) }}</template>
          </p>
        </div>

        <!-- Precio -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio total (COP) *</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">$</span>
            <input
              v-model.number="formCrear.precioTotal"
              type="number"
              min="0"
              step="50000"
              placeholder="0"
              class="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
            />
          </div>
          <p v-if="formCrear.precioTotal > 0" class="text-xs text-violet-400 font-medium">
            {{ formatearMoneda(formCrear.precioTotal) }}
          </p>
        </div>

        <!-- Extras -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Extras incluidos</label>
          <div class="flex gap-2">
            <input
              v-model="extraInput"
              type="text"
              placeholder="Ej: SEO optimizado, Hosting 1 año..."
              class="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
              @keyup.enter="agregarExtra"
            />
            <button
              class="px-3 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 text-sm transition-all"
              @click="agregarExtra"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div v-if="formCrear.extras.length" class="flex flex-wrap gap-2">
            <span
              v-for="(e, i) in formCrear.extras"
              :key="i"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs"
            >
              {{ e }}
              <button class="hover:text-red-400 transition-colors" @click="quitarExtra(i)">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
        </div>

        <!-- Notas -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Notas internas</label>
          <textarea
            v-model="formCrear.notas"
            rows="3"
            placeholder="Observaciones, acuerdos previos, condiciones especiales..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all resize-none"
          />
        </div>

        <!-- Preview precio -->
        <div v-if="formCrear.precioTotal > 0 && formCrear.servicioId" class="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <p class="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">Resumen</p>
          <p class="text-2xl font-black text-white">{{ formatearMoneda(formCrear.precioTotal) }}</p>
          <p class="text-sm text-violet-300 mt-0.5">{{ servicioSeleccionado?.nombre }}</p>
          <p v-if="formCrear.extras.length" class="text-xs text-slate-400 mt-1">
            + {{ formCrear.extras.length }} extra{{ formCrear.extras.length > 1 ? 's' : '' }}
          </p>
        </div>
      </div>

      <template #footer>
        <AppBoton variante="fantasma" @click="modalCrear = false">Cancelar</AppBoton>
        <AppBoton variante="primario" :cargando="guardando" @click="crearCotizacion">
          Crear cotización
        </AppBoton>
      </template>
    </AppModal>

    <!-- ── Modal: Cambiar estado ──────────────────────────────────────────── -->
    <AppModal :abierto="modalEstado" titulo="Actualizar estado" tamano="sm" @cerrar="modalEstado = false">
      <div class="space-y-4">
        <div v-if="cotizSelec" class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <div class="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
            {{ cotizSelec.prospecto.nombre?.[0]?.toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white truncate">{{ cotizSelec.prospecto.nombre }}</p>
            <p class="text-xs text-slate-400">{{ formatearMoneda(cotizSelec.precioTotal) }} · {{ cotizSelec.servicio.nombre }}</p>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nuevo estado</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="e in ESTADOS.slice(1)"
              :key="e.valor"
              class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
              :class="formularioEstado.estado === e.valor
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white/3 border-white/8 text-slate-400 hover:text-white hover:border-white/15'"
              @click="formularioEstado.estado = e.valor as EstadoCotizacion"
            >
              <svg class="w-3.5 h-3.5 shrink-0" :class="e.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconoEstado(e.valor as EstadoCotizacion)" />
              </svg>
              {{ e.etiqueta }}
            </button>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300" v-if="formularioEstado.estado === 'ENVIADA'">
          <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Se enviará un correo automático al prospecto con los detalles de la cotización.
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Notas (opcional)</label>
          <textarea
            v-model="formularioEstado.notas"
            rows="3"
            placeholder="Observaciones sobre este cambio..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all resize-none"
          />
        </div>
      </div>

      <template #footer>
        <AppBoton variante="fantasma" @click="modalEstado = false">Cancelar</AppBoton>
        <AppBoton variante="primario" @click="guardarEstado">Guardar cambio</AppBoton>
      </template>
    </AppModal>

  </div>
</template>