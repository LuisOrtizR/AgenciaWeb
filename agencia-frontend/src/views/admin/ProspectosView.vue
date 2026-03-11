<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { prospectosServicio, iaServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppModal      from '@/components/ui/AppModal.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import type {
  Prospecto,
  EstadoProspecto,
  TipoServicio,
  DatosActualizarEstadoProspecto,
  ResumenProspectos,
} from '@/types'

const router  = useRouter()
const uiStore = useUiStore()
const pag     = usePaginacion(12)

const prospectos     = ref<Prospecto[]>([])
const resumen        = ref<ResumenProspectos | null>(null)
const cargando       = ref(true)
const cargandoIA     = ref(false)
const prospectoSelec = ref<Prospecto | null>(null)
const modalEstado    = ref(false)
const modalAnalisis  = ref(false)
const modalPropuesta = ref(false)
const resultadoIA    = ref('')
const propuestaIA    = ref('')

const filtros = reactive({
  busqueda:     '',
  estado:       '' as EstadoProspecto | '',
  tipoServicio: '' as TipoServicio | '',
})

const formularioEstado = reactive<DatosActualizarEstadoProspecto>({
  estado: 'NUEVO',
  notas:  null,
})

const CONFIG_ESTADO: Record<EstadoProspecto, {
  etiqueta: string
  variante: 'info' | 'advertencia' | 'exito' | 'error'
  color:    string
  dot:      string
}> = {
  NUEVO:      { etiqueta: 'Nuevo',      variante: 'info',        color: 'text-blue-400',    dot: 'bg-blue-400' },
  CONTACTADO: { etiqueta: 'Contactado', variante: 'advertencia', color: 'text-amber-400',   dot: 'bg-amber-400' },
  CONVERTIDO: { etiqueta: 'Convertido', variante: 'exito',       color: 'text-emerald-400', dot: 'bg-emerald-400' },
  PERDIDO:    { etiqueta: 'Perdido',    variante: 'error',       color: 'text-red-400',     dot: 'bg-red-400' },
}

const ETIQUETA_TIPO: Record<string, string> = {
  LANDING:       'Landing Page',
  CORPORATIVO:   'Corporativo',
  ECOMMERCE:     'E-commerce',
  SAAS:          'SaaS',
  MANTENIMIENTO: 'Mantenimiento',
}

const ESTADOS_FILTRO = [
  { valor: '' as const,           etiqueta: 'Todos los estados' },
  { valor: 'NUEVO' as const,      etiqueta: 'Nuevo' },
  { valor: 'CONTACTADO' as const, etiqueta: 'Contactado' },
  { valor: 'CONVERTIDO' as const, etiqueta: 'Convertido' },
  { valor: 'PERDIDO' as const,    etiqueta: 'Perdido' },
]

const TIPOS_FILTRO = [
  { valor: '' as const,                etiqueta: 'Todos los tipos' },
  { valor: 'LANDING' as const,         etiqueta: 'Landing Page' },
  { valor: 'CORPORATIVO' as const,     etiqueta: 'Corporativo' },
  { valor: 'ECOMMERCE' as const,       etiqueta: 'E-commerce' },
  { valor: 'SAAS' as const,            etiqueta: 'SaaS' },
  { valor: 'MANTENIMIENTO' as const,   etiqueta: 'Mantenimiento' },
]

const tarjetasResumen = computed(() => resumen.value ? [
  {
    label: 'Total',
    valor: resumen.value.total,
    color: 'text-white',
    bg:    'bg-white/5 border-white/8',
    icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
  },
  {
    label: 'Nuevos',
    valor: resumen.value.nuevos,
    color: 'text-blue-400',
    bg:    'bg-blue-500/10 border-blue-500/20',
    icono: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  },
  {
    label: 'Contactados',
    valor: resumen.value.contactados,
    color: 'text-amber-400',
    bg:    'bg-amber-500/10 border-amber-500/20',
    icono: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    label: 'Convertidos',
    valor: resumen.value.convertidos,
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/10 border-emerald-500/20',
    icono: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
] : [])

const formatearMoneda = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const formatearFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f))

const inicialNombre = (nombre: string) => nombre[0]?.toUpperCase() ?? '?'

const cargar = async () => {
  cargando.value = true
  try {
    const params: Record<string, unknown> = {
      pagina:    pag.paginaActual.value,
      porPagina: pag.porPagina.value,
    }
    if (filtros.busqueda)     params.busqueda     = filtros.busqueda
    if (filtros.estado)       params.estado       = filtros.estado
    if (filtros.tipoServicio) params.tipoServicio = filtros.tipoServicio

    const [{ data }, { data: dataResumen }] = await Promise.all([
      prospectosServicio.listar(params as any),
      resumen.value ? Promise.resolve({ data: { datos: resumen.value } }) : prospectosServicio.resumen(),
    ])
    prospectos.value = data.datos
    resumen.value    = dataResumen.datos
    pag.actualizarPaginacion(data.paginacion)
  } catch {
    uiStore.error('Error', 'No se pudieron cargar los prospectos')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
watch(filtros, () => { pag.paginaActual.value = 1; cargar() }, { deep: true })
const cambiarPagina = (pagina: number) => { pag.irAPagina(pagina); cargar() }

const abrirModalEstado = (p: Prospecto) => {
  prospectoSelec.value    = p
  formularioEstado.estado = p.estado
  formularioEstado.notas  = p.notas
  modalEstado.value       = true
}

const guardarEstado = async () => {
  if (!prospectoSelec.value) return
  try {
    await prospectosServicio.actualizarEstado(prospectoSelec.value.id, formularioEstado)
    uiStore.exito('Estado actualizado', `Marcado como ${CONFIG_ESTADO[formularioEstado.estado].etiqueta}`)
    modalEstado.value = false
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el estado')
  }
}

const formatearResultadoIA = (a: any): string => {
  const emoji: Record<string, string> = { CALIENTE: '🔴', TIBIO: '🟡', FRIO: '🔵' }
  return [
    `${emoji[a.nivel] ?? '⚪'} PUNTAJE: ${a.puntaje}/100 — ${a.nivel}`,
    '',
    '📋 RESUMEN', a.resumen,
    '', '✅ FORTALEZAS', ...a.fortalezas.map((f: string) => `• ${f}`),
    '', '⚠️ RIESGOS', ...a.riesgos.map((r: string) => `• ${r}`),
    '', '🎯 ACCIONES RECOMENDADAS', ...a.accionesRecomendadas.map((ac: string) => `• ${ac}`),
    '', `⏱ TIEMPO SUGERIDO DE RESPUESTA: ${a.tiempoSugeridoRespuesta}`,
  ].join('\n')
}

const analizarConIA = async (p: Prospecto) => {
  prospectoSelec.value = p
  resultadoIA.value    = ''
  modalAnalisis.value  = true
  cargandoIA.value     = true
  try {
    const { data } = await iaServicio.analizarProspecto(p.id)
    resultadoIA.value = formatearResultadoIA(data.datos.analisis)
  } catch {
    uiStore.error('Error de IA', 'No se pudo analizar el prospecto')
    modalAnalisis.value = false
  } finally {
    cargandoIA.value = false
  }
}

const generarPropuesta = async (p: Prospecto) => {
  prospectoSelec.value = p
  propuestaIA.value    = ''
  modalPropuesta.value = true
  cargandoIA.value     = true
  try {
    const { data } = await iaServicio.generarPropuesta(p.id)
    propuestaIA.value = data.datos.propuesta
  } catch {
    uiStore.error('Error de IA', 'No se pudo generar la propuesta')
    modalPropuesta.value = false
  } finally {
    cargandoIA.value = false
  }
}

const copiarPropuesta = async () => {
  try {
    await navigator.clipboard.writeText(propuestaIA.value)
    uiStore.exito('Copiada', 'Propuesta copiada al portapapeles')
  } catch {
    uiStore.error('Error', 'No se pudo copiar al portapapeles')
  }
}

const eliminarProspecto = async (p: Prospecto) => {
  if (!confirm(`¿Eliminar el prospecto de ${p.nombre}? Esta acción no se puede deshacer.`)) return
  try {
    await prospectosServicio.eliminar(p.id)
    uiStore.exito('Eliminado', `El prospecto de ${p.nombre} fue eliminado`)
    resumen.value = null
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo eliminar el prospecto')
  }
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">

    <div>
      <h1 class="text-2xl font-bold text-white">Prospectos</h1>
      <p class="text-slate-500 text-sm mt-1">Gestiona y convierte tus leads con ayuda de IA</p>
    </div>

    <div v-if="tarjetasResumen.length" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="t in tarjetasResumen"
        :key="t.label"
        class="bg-[#13151f] border rounded-2xl p-4"
        :class="t.bg"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t.label }}</span>
          <svg class="w-4 h-4" :class="t.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="t.icono" />
          </svg>
        </div>
        <p class="text-2xl font-black tabular-nums" :class="t.color">{{ t.valor }}</p>
      </div>
    </div>
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div v-for="i in 4" :key="i" class="h-20 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <div class="bg-[#13151f] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
      <div class="flex-1 relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="filtros.busqueda"
          type="search"
          placeholder="Buscar por nombre o correo..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
        />
      </div>
      <select v-model="filtros.estado" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none">
        <option v-for="e in ESTADOS_FILTRO" :key="e.valor" :value="e.valor">{{ e.etiqueta }}</option>
      </select>
      <select v-model="filtros.tipoServicio" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none">
        <option v-for="t in TIPOS_FILTRO" :key="t.valor" :value="t.valor">{{ t.etiqueta }}</option>
      </select>
    </div>

    <div class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
      <div v-if="cargando" class="p-8 space-y-3">
        <div v-for="i in 6" :key="i" class="h-14 bg-white/5 rounded-xl animate-pulse" />
      </div>

      <div v-else-if="!prospectos.length" class="py-20 text-center">
        <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
        </div>
        <p class="text-white font-medium">No hay prospectos</p>
        <p class="text-slate-500 text-sm mt-1">Los prospectos aparecerán aquí cuando completen el formulario de contacto</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prospecto</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Servicio</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Presupuesto</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Fecha</th>
              <th class="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="p in prospectos" :key="p.id" class="hover:bg-white/3 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-linear-to-brrom-violet-500/30 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
                    {{ inicialNombre(p.nombre) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ p.nombre }}</p>
                    <p class="text-xs text-slate-500">{{ p.correo }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 hidden md:table-cell">
                <span class="text-sm text-slate-300">{{ ETIQUETA_TIPO[p.tipoServicio] ?? p.tipoServicio }}</span>
              </td>
              <td class="px-4 py-4 hidden lg:table-cell">
                <span class="text-sm text-slate-300">
                  {{ p.presupuesto ? formatearMoneda(p.presupuesto) : '—' }}
                </span>
              </td>
              <td class="px-4 py-4">
                <button @click="abrirModalEstado(p)">
                  <AppInsignia :variante="CONFIG_ESTADO[p.estado].variante" punto>
                    {{ CONFIG_ESTADO[p.estado].etiqueta }}
                  </AppInsignia>
                </button>
              </td>
              <td class="px-4 py-4 hidden xl:table-cell">
                <span class="text-xs text-slate-500">{{ formatearFecha(p.creadoEn) }}</span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <RouterLink
                    :to="{ name: 'admin-prospecto-detalle', params: { id: p.id } }"
                    class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                    title="Ver detalle"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </RouterLink>
                  <button
                    class="p-1.5 rounded-lg text-slate-500 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
                    title="Analizar con IA"
                    @click="analizarConIA(p)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </button>
                  <button
                    class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                    title="Generar propuesta con IA"
                    @click="generarPropuesta(p)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Eliminar"
                    @click="eliminarProspecto(p)"
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
      </div>

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

    <AppModal :abierto="modalEstado" titulo="Actualizar estado" tamano="sm" @cerrar="modalEstado = false">
      <div class="space-y-4">
        <div v-if="prospectoSelec" class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <div class="w-9 h-9 rounded-full bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
            {{ inicialNombre(prospectoSelec.nombre) }}
          </div>
          <div>
            <p class="text-sm font-medium text-white">{{ prospectoSelec.nombre }}</p>
            <p class="text-xs text-slate-500">{{ prospectoSelec.correo }}</p>
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nuevo estado</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="e in ESTADOS_FILTRO.slice(1)"
              :key="e.valor"
              class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
              :class="formularioEstado.estado === e.valor
                ? `bg-${CONFIG_ESTADO[e.valor as EstadoProspecto].dot.replace('bg-', '')}/15 border-${CONFIG_ESTADO[e.valor as EstadoProspecto].dot.replace('bg-', '')}/30 ${CONFIG_ESTADO[e.valor as EstadoProspecto].color}`
                : 'bg-white/3 border-white/8 text-slate-400 hover:text-white hover:border-white/15'"
              @click="formularioEstado.estado = e.valor as EstadoProspecto"
            >
              <span class="w-2 h-2 rounded-full shrink-0" :class="CONFIG_ESTADO[e.valor as EstadoProspecto].dot" />
              {{ e.etiqueta }}
            </button>
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Notas internas</label>
          <textarea
            v-model="formularioEstado.notas"
            rows="3"
            placeholder="Observaciones sobre este prospecto..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all resize-none"
          />
        </div>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalEstado = false">Cancelar</AppBoton>
        <AppBoton variante="primario" @click="guardarEstado">Guardar estado</AppBoton>
      </template>
    </AppModal>

    <AppModal :abierto="modalAnalisis" titulo="🤖 Análisis IA del prospecto" tamano="md" @cerrar="modalAnalisis = false">
      <div v-if="prospectoSelec" class="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
        <div class="w-10 h-10 rounded-full bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
          {{ inicialNombre(prospectoSelec.nombre) }}
        </div>
        <div>
          <p class="text-sm font-semibold text-white">{{ prospectoSelec.nombre }}</p>
          <p class="text-xs text-slate-500">{{ ETIQUETA_TIPO[prospectoSelec.tipoServicio] }}</p>
        </div>
      </div>
      <div v-if="cargandoIA" class="py-12 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-500 flex items-center justify-center animate-pulse shadow-lg shadow-violet-500/30">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p class="text-slate-300 text-sm font-medium">Analizando con inteligencia artificial...</p>
        <p class="text-slate-500 text-xs">Groq · Llama 3.3 70B</p>
      </div>
      <div v-else class="bg-white/3 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-line leading-relaxed font-mono max-h-96 overflow-y-auto">
        {{ resultadoIA }}
      </div>
      <template #footer>
        <AppBoton variante="secundario" @click="modalAnalisis = false">Cerrar</AppBoton>
      </template>
    </AppModal>

    <AppModal :abierto="modalPropuesta" titulo="📄 Propuesta comercial con IA" tamano="lg" @cerrar="modalPropuesta = false">
      <div v-if="prospectoSelec" class="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
        <div class="w-10 h-10 rounded-full bg-linear-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center text-sm font-bold text-emerald-400 shrink-0">
          {{ inicialNombre(prospectoSelec.nombre) }}
        </div>
        <div>
          <p class="text-sm font-semibold text-white">{{ prospectoSelec.nombre }}</p>
          <p class="text-xs text-slate-500">{{ ETIQUETA_TIPO[prospectoSelec.tipoServicio] }}</p>
        </div>
      </div>
      <div v-if="cargandoIA" class="py-12 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/30">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-slate-300 text-sm font-medium">Generando propuesta comercial...</p>
        <p class="text-slate-500 text-xs">Groq · Llama 3.3 70B</p>
      </div>
      <div v-else class="space-y-3">
        <div class="bg-white/3 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto">
          {{ propuestaIA }}
        </div>
        <p class="text-xs text-slate-500 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Revisa y personaliza antes de enviar. Generada automáticamente con IA.
        </p>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalPropuesta = false">Cerrar</AppBoton>
        <AppBoton v-if="!cargandoIA && propuestaIA" variante="primario" @click="copiarPropuesta">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copiar propuesta
        </AppBoton>
      </template>
    </AppModal>

  </div>
</template>