<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { prospectosServicio, iaServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppInsignia    from '@/components/ui/AppInsignia.vue'
import AppBoton       from '@/components/ui/AppBoton.vue'
import AppModal       from '@/components/ui/AppModal.vue'
import AppPaginacion  from '@/components/ui/AppPaginacion.vue'
import type { Prospecto, EstadoProspecto, TipoServicio, DatosActualizarEstadoProspecto } from '@/types'

const router  = useRouter()
const uiStore = useUiStore()
const pag     = usePaginacion(12)

// ─── Estado ──────────────────────────────────────────────────────────────────

const prospectos     = ref<Prospecto[]>([])
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

// ─── Etiquetas ───────────────────────────────────────────────────────────────

const ESTADOS: { valor: EstadoProspecto | ''; etiqueta: string }[] = [
  { valor: '',           etiqueta: 'Todos los estados' },
  { valor: 'NUEVO',      etiqueta: 'Nuevo' },
  { valor: 'CONTACTADO', etiqueta: 'Contactado' },
  { valor: 'CONVERTIDO', etiqueta: 'Convertido' },
  { valor: 'PERDIDO',    etiqueta: 'Perdido' },
]

const TIPOS: { valor: TipoServicio | ''; etiqueta: string }[] = [
  { valor: '',              etiqueta: 'Todos los tipos' },
  { valor: 'LANDING',       etiqueta: 'Landing Page' },
  { valor: 'CORPORATIVO',   etiqueta: 'Corporativo' },
  { valor: 'ECOMMERCE',     etiqueta: 'E-commerce' },
  { valor: 'SAAS',          etiqueta: 'SaaS' },
  { valor: 'MANTENIMIENTO', etiqueta: 'Mantenimiento' },
]

const varianteEstado = (estado: EstadoProspecto) => {
  const mapa: Record<EstadoProspecto, 'info' | 'advertencia' | 'exito' | 'error'> = {
    NUEVO:      'info',
    CONTACTADO: 'advertencia',
    CONVERTIDO: 'exito',
    PERDIDO:    'error',
  }
  return mapa[estado]
}

const etiquetaEstado = (estado: EstadoProspecto): string => ({
  NUEVO:      'Nuevo',
  CONTACTADO: 'Contactado',
  CONVERTIDO: 'Convertido',
  PERDIDO:    'Perdido',
}[estado])

const etiquetaTipo = (tipo: TipoServicio): string => ({
  LANDING:       'Landing Page',
  CORPORATIVO:   'Corporativo',
  ECOMMERCE:     'E-commerce',
  SAAS:          'SaaS',
  MANTENIMIENTO: 'Mantenimiento',
}[tipo])

// ─── Carga de datos ───────────────────────────────────────────────────────────

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

    const { data } = await prospectosServicio.listar(params as any)
    prospectos.value = data.datos
    pag.actualizarPaginacion(data.paginacion)
  } catch {
    uiStore.error('Error', 'No se pudieron cargar los prospectos')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

watch([filtros, () => pag.paginaActual.value], () => {
  if (pag.paginaActual.value !== 1) pag.reiniciar()
  else cargar()
}, { deep: true })

// ─── Acciones ─────────────────────────────────────────────────────────────────

const abrirModalEstado = (prospecto: Prospecto) => {
  prospectoSelec.value    = prospecto
  formularioEstado.estado = prospecto.estado
  formularioEstado.notas  = prospecto.notas
  modalEstado.value       = true
}

const guardarEstado = async () => {
  if (!prospectoSelec.value) return
  try {
    await prospectosServicio.actualizarEstado(prospectoSelec.value.id, formularioEstado)
    uiStore.exito('Estado actualizado', `Prospecto marcado como ${etiquetaEstado(formularioEstado.estado)}`)
    modalEstado.value = false
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el estado')
  }
}

// ── IA: analizar prospecto ────────────────────────────────────────────────────
const analizarConIA = async (prospecto: Prospecto) => {
  prospectoSelec.value = prospecto
  resultadoIA.value    = ''
  modalAnalisis.value  = true
  cargandoIA.value     = true
  try {
    const { data } = await iaServicio.analizarProspecto(prospecto.id)
    const a = data.datos.analisis

    const nivelColor: Record<string, string> = {
      CALIENTE: '🔴',
      TIBIO:    '🟡',
      FRIO:     '🔵',
    }
    const icono = nivelColor[a.nivel] ?? '⚪'

    resultadoIA.value = [
      `${icono} PUNTAJE: ${a.puntaje}/100 — ${a.nivel}`,
      '',
      `📋 RESUMEN`,
      a.resumen,
      '',
      `✅ FORTALEZAS`,
      ...a.fortalezas.map(f => `• ${f}`),
      '',
      `⚠️ RIESGOS`,
      ...a.riesgos.map(r => `• ${r}`),
      '',
      `🎯 ACCIONES RECOMENDADAS`,
      ...a.accionesRecomendadas.map(ac => `• ${ac}`),
      '',
      `⏱ TIEMPO SUGERIDO DE RESPUESTA: ${a.tiempoSugeridoRespuesta}`,
    ].join('\n')
  } catch {
    uiStore.error('Error de IA', 'No se pudo analizar el prospecto')
    modalAnalisis.value = false
  } finally {
    cargandoIA.value = false
  }
}

// ── IA: generar propuesta comercial ──────────────────────────────────────────
const generarPropuesta = async (prospecto: Prospecto) => {
  prospectoSelec.value = prospecto
  propuestaIA.value    = ''
  modalPropuesta.value = true
  cargandoIA.value     = true
  try {
    const { data } = await iaServicio.generarPropuesta(prospecto.id)
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

// ── Eliminar ──────────────────────────────────────────────────────────────────
const eliminarProspecto = async (prospecto: Prospecto) => {
  if (!confirm(`¿Eliminar el prospecto de ${prospecto.nombre}? Esta acción no se puede deshacer.`)) return
  try {
    await prospectosServicio.eliminar(prospecto.id)
    uiStore.exito('Eliminado', `El prospecto de ${prospecto.nombre} fue eliminado`)
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo eliminar el prospecto')
  }
}

const formatearFecha = (fecha: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(fecha))

const inicialNombre = (nombre: string) =>
  nombre[0]?.toUpperCase() ?? '?'
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">

    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Prospectos</h1>
        <p class="text-gris-medio text-sm mt-1">Gestiona y convierte tus prospectos con ayuda de IA</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-[#13151f] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
      <div class="flex-1 relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gris-medio pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="filtros.busqueda" type="search" placeholder="Buscar por nombre o correo..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 focus:ring-2 focus:ring-violeta/10 text-white placeholder-gris-medio text-sm outline-none transition-all" />
      </div>
      <select v-model="filtros.estado"
        class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-blanco-suave text-sm outline-none transition-all">
        <option v-for="e in ESTADOS" :key="e.valor" :value="e.valor">{{ e.etiqueta }}</option>
      </select>
      <select v-model="filtros.tipoServicio"
        class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-blanco-suave text-sm outline-none transition-all">
        <option v-for="t in TIPOS" :key="t.valor" :value="t.valor">{{ t.etiqueta }}</option>
      </select>
    </div>

    <!-- Tabla -->
    <div class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">

      <div v-if="cargando" class="p-8 space-y-3">
        <div v-for="i in 6" :key="i" class="h-14 bg-white/5 rounded-xl animate-pulse" />
      </div>

      <div v-else-if="!prospectos.length" class="py-20 text-center">
        <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gris-medio" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
        </div>
        <p class="text-white font-medium">No hay prospectos</p>
        <p class="text-gris-medio text-sm mt-1">Los prospectos aparecerán aquí cuando completen el formulario de contacto</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="text-left px-6 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide">Prospecto</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide hidden md:table-cell">Servicio</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide hidden lg:table-cell">Presupuesto</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide">Estado</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide hidden xl:table-cell">Fecha</th>
              <th class="px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide text-right">Acciones IA</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="p in prospectos" :key="p.id" class="hover:bg-white/2 transition-colors">

              <!-- Nombre + correo -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-linear-to-br from-violeta/30 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violeta-claro shrink-0">
                    {{ inicialNombre(p.nombre) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ p.nombre }}</p>
                    <p class="text-xs text-gris-medio">{{ p.correo }}</p>
                  </div>
                </div>
              </td>

              <!-- Tipo de servicio -->
              <td class="px-4 py-4 hidden md:table-cell">
                <span class="text-sm text-blanco-suave">{{ etiquetaTipo(p.tipoServicio) }}</span>
              </td>

              <!-- Presupuesto -->
              <td class="px-4 py-4 hidden lg:table-cell">
                <span class="text-sm text-blanco-suave">
                  {{ p.presupuesto
                    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.presupuesto)
                    : '—' }}
                </span>
              </td>

              <!-- Estado -->
              <td class="px-4 py-4">
                <button @click="abrirModalEstado(p)">
                  <AppInsignia :variante="varianteEstado(p.estado)" punto>
                    {{ etiquetaEstado(p.estado) }}
                  </AppInsignia>
                </button>
              </td>

              <!-- Fecha -->
              <td class="px-4 py-4 hidden xl:table-cell">
                <span class="text-xs text-gris-medio">{{ formatearFecha(p.creadoEn) }}</span>
              </td>

              <!-- Acciones -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-1 justify-end">

                  <!-- Ver detalle -->
                  <RouterLink :to="{ name: 'admin-prospecto-detalle', params: { id: p.id } }"
                    class="p-1.5 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all" title="Ver detalle">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </RouterLink>

                  <!-- Analizar con IA -->
                  <button class="p-1.5 rounded-lg text-gris-medio hover:text-violeta-claro hover:bg-violeta/10 transition-all" title="Analizar lead con IA" @click="analizarConIA(p)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </button>

                  <!-- Generar propuesta -->
                  <button class="p-1.5 rounded-lg text-gris-medio hover:text-verde hover:bg-verde/10 transition-all" title="Generar propuesta con IA" @click="generarPropuesta(p)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>

                  <!-- Eliminar -->
                  <button class="p-1.5 rounded-lg text-gris-medio hover:text-rojo hover:bg-rojo/10 transition-all" title="Eliminar prospecto" @click="eliminarProspecto(p)">
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
        <AppPaginacion :pagina-actual="pag.paginaActual.value" :total-paginas="pag.totalPaginas.value"
          :total-registros="pag.totalRegistros.value" :por-pagina="pag.porPagina.value" @cambiar="pag.irAPagina" />
      </div>
    </div>

    <!-- ── Modal: cambiar estado ───────────────────────────────────────────── -->
    <AppModal :abierto="modalEstado" titulo="Actualizar estado del prospecto" tamano="sm" @cerrar="modalEstado = false">
      <div class="space-y-4">
        <div v-if="prospectoSelec" class="p-3 rounded-xl bg-white/5 border border-white/5">
          <p class="text-sm font-medium text-white">{{ prospectoSelec.nombre }}</p>
          <p class="text-xs text-gris-medio">{{ prospectoSelec.correo }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-blanco-suave">Nuevo estado</label>
          <select v-model="formularioEstado.estado"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none transition-all">
            <option v-for="e in ESTADOS.slice(1)" :key="e.valor" :value="e.valor">{{ e.etiqueta }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-blanco-suave">Notas internas (opcional)</label>
          <textarea v-model="formularioEstado.notas" rows="3" placeholder="Observaciones sobre este prospecto..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none transition-all resize-none" />
        </div>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalEstado = false">Cancelar</AppBoton>
        <AppBoton variante="primario" @click="guardarEstado">Guardar estado</AppBoton>
      </template>
    </AppModal>

    <!-- ── Modal: análisis IA ─────────────────────────────────────────────── -->
    <AppModal :abierto="modalAnalisis" titulo="🤖 Análisis IA del prospecto" tamano="md" @cerrar="modalAnalisis = false">
      <!-- Encabezado del prospecto -->
      <div v-if="prospectoSelec" class="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
        <div class="w-10 h-10 rounded-full bg-linear-to-br from-violeta/30 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violeta-claro shrink-0">
          {{ inicialNombre(prospectoSelec.nombre) }}
        </div>
        <div>
          <p class="text-sm font-semibold text-white">{{ prospectoSelec.nombre }}</p>
          <p class="text-xs text-gris-medio">{{ prospectoSelec.correo }}</p>
        </div>
      </div>

      <!-- Cargando -->
      <div v-if="cargandoIA" class="py-12 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center animate-pulse shadow-lg shadow-violeta/30">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p class="text-blanco-suave text-sm font-medium">Analizando con inteligencia artificial...</p>
        <p class="text-gris-medio text-xs">Groq · Llama 3.3 70B</p>
      </div>

      <!-- Resultado -->
      <div v-else class="bg-white/3 rounded-xl p-4 text-sm text-blanco-suave whitespace-pre-line leading-relaxed font-mono">
        {{ resultadoIA }}
      </div>

      <template #footer>
        <AppBoton variante="secundario" @click="modalAnalisis = false">Cerrar</AppBoton>
      </template>
    </AppModal>

    <!-- ── Modal: propuesta IA ────────────────────────────────────────────── -->
    <AppModal :abierto="modalPropuesta" titulo="📄 Propuesta comercial generada con IA" tamano="lg" @cerrar="modalPropuesta = false">
      <!-- Encabezado -->
      <div v-if="prospectoSelec" class="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
        <div class="w-10 h-10 rounded-full bg-linear-to-br from-verde/20 to-emerald-500/10 flex items-center justify-center text-sm font-bold text-verde shrink-0">
          {{ inicialNombre(prospectoSelec.nombre) }}
        </div>
        <div>
          <p class="text-sm font-semibold text-white">{{ prospectoSelec.nombre }}</p>
          <p class="text-xs text-gris-medio">{{ etiquetaTipo(prospectoSelec.tipoServicio) }}</p>
        </div>
      </div>

      <!-- Cargando -->
      <div v-if="cargandoIA" class="py-12 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-verde to-emerald-500 flex items-center justify-center animate-pulse shadow-lg shadow-verde/30">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-blanco-suave text-sm font-medium">Generando propuesta comercial...</p>
        <p class="text-gris-medio text-xs">Groq · Llama 3.3 70B</p>
      </div>

      <!-- Propuesta -->
      <div v-else class="space-y-4">
        <div class="bg-white/3 rounded-xl p-4 text-sm text-blanco-suave whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto">
          {{ propuestaIA }}
        </div>
        <p class="text-xs text-gris-medio">
          💡 Revisa y personaliza antes de enviar. Esta propuesta fue generada automáticamente con IA.
        </p>
      </div>

      <template #footer>
        <AppBoton variante="fantasma" @click="modalPropuesta = false">Cerrar</AppBoton>
        <AppBoton v-if="!cargandoIA && propuestaIA" variante="primario" @click="copiarPropuesta">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copiar al portapapeles
        </AppBoton>
      </template>
    </AppModal>

  </div>
</template>