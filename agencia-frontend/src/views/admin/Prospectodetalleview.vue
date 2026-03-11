<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { prospectosServicio, iaServicio, usuariosServicio } from '@/services/servicios'
import AppInsignia from '@/components/ui/AppInsignia.vue'
import AppBoton   from '@/components/ui/AppBoton.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import type {
  Prospecto,
  EstadoProspecto,
  DatosActualizarEstadoProspecto,
  UsuarioConConteo,
} from '@/types'

const route   = useRoute()
const router  = useRouter()
const uiStore = useUiStore()

const prospecto      = ref<Prospecto | null>(null)
const cargando       = ref(true)
const cargandoIA     = ref(false)
const modalEstado    = ref(false)
const modalAnalisis  = ref(false)
const modalPropuesta = ref(false)
const modalAsignar   = ref(false)
const resultadoIA    = ref('')
const propuestaIA    = ref('')

const usuarios         = ref<UsuarioConConteo[]>([])
const cargandoUsuarios = ref(false)
const busquedaUsuario  = ref('')
const usuarioSelecId   = ref<string | null>(null)
const guardandoAsignar = ref(false)

const formularioEstado = ref<DatosActualizarEstadoProspecto>({
  estado: 'NUEVO',
  notas:  null,
})

const CONFIG_ESTADO: Record<EstadoProspecto, {
  etiqueta: string
  variante: 'info' | 'advertencia' | 'exito' | 'error'
  bg:       string
  color:    string
  dot:      string
  icono:    string
}> = {
  NUEVO: {
    etiqueta: 'Nuevo',
    variante: 'info',
    bg:       'bg-blue-500/10 border-blue-500/20',
    color:    'text-blue-400',
    dot:      'bg-blue-400',
    icono:    'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  },
  CONTACTADO: {
    etiqueta: 'Contactado',
    variante: 'advertencia',
    bg:       'bg-amber-500/10 border-amber-500/20',
    color:    'text-amber-400',
    dot:      'bg-amber-400',
    icono:    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  CONVERTIDO: {
    etiqueta: 'Convertido',
    variante: 'exito',
    bg:       'bg-emerald-500/10 border-emerald-500/20',
    color:    'text-emerald-400',
    dot:      'bg-emerald-400',
    icono:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  PERDIDO: {
    etiqueta: 'Perdido',
    variante: 'error',
    bg:       'bg-red-500/10 border-red-500/20',
    color:    'text-red-400',
    dot:      'bg-red-400',
    icono:    'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
}

const CONFIG_COTIZACION: Record<string, 'info' | 'advertencia' | 'exito' | 'error' | 'neutro'> = {
  PENDIENTE: 'advertencia',
  ENVIADA:   'info',
  ACEPTADA:  'exito',
  RECHAZADA: 'error',
}

const ETIQUETA_TIPO: Record<string, string> = {
  LANDING:       'Landing Page',
  CORPORATIVO:   'Corporativo',
  ECOMMERCE:     'E-commerce',
  SAAS:          'SaaS',
  MANTENIMIENTO: 'Mantenimiento',
}

const ESTADOS: EstadoProspecto[] = ['NUEVO', 'CONTACTADO', 'CONVERTIDO', 'PERDIDO']

const formatearMoneda = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const formatearFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f))

const inicialNombre = (nombre: string) => nombre[0]?.toUpperCase() ?? '?'

const usuariosFiltrados = computed(() => {
  const q = busquedaUsuario.value.toLowerCase().trim()
  if (!q) return usuarios.value
  return usuarios.value.filter(u =>
    u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)
  )
})

const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await prospectosServicio.obtenerPorId(route.params.id as string)
    prospecto.value = data.datos
  } catch {
    uiStore.error('Error', 'No se pudo cargar el prospecto')
    router.push({ name: 'admin-prospectos' })
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

const abrirModalEstado = () => {
  if (!prospecto.value) return
  formularioEstado.value = { estado: prospecto.value.estado, notas: prospecto.value.notas }
  modalEstado.value = true
}

const guardarEstado = async () => {
  if (!prospecto.value) return
  try {
    await prospectosServicio.actualizarEstado(prospecto.value.id, formularioEstado.value)
    uiStore.exito('Estado actualizado')
    modalEstado.value = false
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el estado')
  }
}

const cambioRapidoEstado = async (estado: EstadoProspecto) => {
  if (!prospecto.value || prospecto.value.estado === estado) return
  try {
    await prospectosServicio.actualizarEstado(prospecto.value.id, { estado, notas: prospecto.value.notas })
    uiStore.exito('Estado actualizado', `Marcado como ${CONFIG_ESTADO[estado].etiqueta}`)
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el estado')
  }
}

const abrirModalAsignar = async () => {
  usuarioSelecId.value  = prospecto.value?.usuarioId ?? null
  busquedaUsuario.value = ''
  modalAsignar.value    = true
  cargandoUsuarios.value = true
  try {
    const { data } = await usuariosServicio.listar({ porPagina: 100 })
    usuarios.value = data.datos
  } catch {
    uiStore.error('Error', 'No se pudieron cargar los usuarios')
  } finally {
    cargandoUsuarios.value = false
  }
}

const guardarAsignacion = async () => {
  if (!prospecto.value) return
  guardandoAsignar.value = true
  try {
    await prospectosServicio.asignar(prospecto.value.id, usuarioSelecId.value)
    const usuario = usuarios.value.find(u => u.id === usuarioSelecId.value)
    uiStore.exito(
      usuarioSelecId.value ? 'Usuario asignado' : 'Asignación removida',
      usuarioSelecId.value
        ? `${usuario?.nombre} ahora verá las cotizaciones de este prospecto`
        : 'El prospecto quedó sin usuario asignado',
    )
    modalAsignar.value = false
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo asignar el usuario')
  } finally {
    guardandoAsignar.value = false
  }
}

const formatearResultadoIA = (a: any): string => {
  const emoji: Record<string, string> = { CALIENTE: '🔴', TIBIO: '🟡', FRIO: '🔵' }
  return [
    `${emoji[a.nivel] ?? '⚪'} PUNTAJE: ${a.puntaje}/100 — ${a.nivel}`,
    '', '📋 RESUMEN', a.resumen,
    '', '✅ FORTALEZAS', ...a.fortalezas.map((f: string) => `• ${f}`),
    '', '⚠️ RIESGOS', ...a.riesgos.map((r: string) => `• ${r}`),
    '', '🎯 ACCIONES RECOMENDADAS', ...a.accionesRecomendadas.map((ac: string) => `• ${ac}`),
    '', `⏱ TIEMPO SUGERIDO DE RESPUESTA: ${a.tiempoSugeridoRespuesta}`,
  ].join('\n')
}

const analizarConIA = async () => {
  if (!prospecto.value) return
  resultadoIA.value   = ''
  modalAnalisis.value = true
  cargandoIA.value    = true
  try {
    const { data } = await iaServicio.analizarProspecto(prospecto.value.id)
    resultadoIA.value = formatearResultadoIA(data.datos.analisis)
  } catch {
    uiStore.error('Error de IA', 'No se pudo analizar el prospecto')
    modalAnalisis.value = false
  } finally {
    cargandoIA.value = false
  }
}

const generarPropuesta = async () => {
  if (!prospecto.value) return
  propuestaIA.value    = ''
  modalPropuesta.value = true
  cargandoIA.value     = true
  try {
    const { data } = await iaServicio.generarPropuesta(prospecto.value.id)
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

const eliminar = async () => {
  if (!prospecto.value || !confirm(`¿Eliminar el prospecto de ${prospecto.value.nombre}?`)) return
  try {
    await prospectosServicio.eliminar(prospecto.value.id)
    uiStore.exito('Prospecto eliminado')
    router.push({ name: 'admin-prospectos' })
  } catch {
    uiStore.error('Error', 'No se pudo eliminar')
  }
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">

    <div class="flex items-center gap-2 text-sm">
      <RouterLink
        :to="{ name: 'admin-prospectos' }"
        class="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Prospectos
      </RouterLink>
      <span class="text-slate-700">/</span>
      <span class="text-slate-400">Detalle</span>
    </div>

    <div v-if="cargando" class="space-y-4">
      <div class="h-32 bg-white/5 rounded-2xl animate-pulse" />
      <div class="grid grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="h-24 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>

    <template v-else-if="prospecto">

      <div
        class="relative bg-[#13151f] border border-white/5 rounded-2xl p-6 overflow-hidden"
        :class="`border-${CONFIG_ESTADO[prospecto.estado].dot.replace('bg-', '')}/10`"
      >
        <div class="absolute inset-0 opacity-20 pointer-events-none"
          :class="{
            'bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]':   prospecto.estado === 'NUEVO',
            'bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_60%)]':   prospecto.estado === 'CONTACTADO',
            'bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_60%)]':   prospecto.estado === 'CONVERTIDO',
            'bg-[radial-gradient(ellipse_at_top_right,rgba(239,68,68,0.12),transparent_60%)]':    prospecto.estado === 'PERDIDO',
          }"
        />
        <div class="relative flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-2xl font-black text-violet-300 shrink-0">
              {{ inicialNombre(prospecto.nombre) }}
            </div>
            <div>
              <h1 class="text-2xl font-black text-white">{{ prospecto.nombre }}</h1>
              <p class="text-slate-500 text-sm mt-0.5">{{ prospecto.correo }}</p>
              <div class="flex items-center gap-2 mt-2 flex-wrap">
                <AppInsignia :variante="CONFIG_ESTADO[prospecto.estado].variante" punto>
                  {{ CONFIG_ESTADO[prospecto.estado].etiqueta }}
                </AppInsignia>
                <AppInsignia variante="neutro">{{ ETIQUETA_TIPO[prospecto.tipoServicio] ?? prospecto.tipoServicio }}</AppInsignia>
                <span v-if="prospecto.fuente" class="text-xs text-slate-500">via {{ prospecto.fuente }}</span>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 text-slate-300 hover:text-white text-sm font-medium transition-all"
              @click="abrirModalEstado"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Cambiar estado
            </button>
            <button
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 text-violet-300 text-sm font-medium transition-all"
              @click="analizarConIA"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analizar IA
            </button>
            <button
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-sm font-medium transition-all"
              @click="generarPropuesta"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Propuesta
            </button>
            <button
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-sm font-medium transition-all"
              @click="eliminar"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div class="lg:col-span-2 space-y-5">

          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Información de contacto</p>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-xs text-slate-500 mb-1">Correo</p>
                <a :href="`mailto:${prospecto.correo}`" class="text-violet-400 hover:text-violet-300 transition-colors break-all">
                  {{ prospecto.correo }}
                </a>
              </div>
              <div v-if="prospecto.telefono">
                <p class="text-xs text-slate-500 mb-1">Teléfono</p>
                <a :href="`tel:${prospecto.telefono}`" class="text-slate-300 hover:text-white transition-colors">
                  {{ prospecto.telefono }}
                </a>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Tipo de servicio</p>
                <p class="text-slate-300">{{ ETIQUETA_TIPO[prospecto.tipoServicio] ?? prospecto.tipoServicio }}</p>
              </div>
              <div v-if="prospecto.presupuesto">
                <p class="text-xs text-slate-500 mb-1">Presupuesto</p>
                <p class="text-white font-semibold">{{ formatearMoneda(prospecto.presupuesto) }}</p>
              </div>
              <div v-if="prospecto.fuente">
                <p class="text-xs text-slate-500 mb-1">Fuente</p>
                <p class="text-slate-300">{{ prospecto.fuente }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Fecha de registro</p>
                <p class="text-slate-300">{{ formatearFecha(prospecto.creadoEn) }}</p>
              </div>
            </div>
          </div>

          <div v-if="prospecto.mensaje" class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Mensaje del prospecto</p>
            <p class="text-slate-300 text-sm leading-relaxed">{{ prospecto.mensaje }}</p>
          </div>

          <div v-if="prospecto.notas" class="bg-[#13151f] border border-amber-500/15 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-xs font-semibold text-amber-400 uppercase tracking-wider">Notas internas</p>
            </div>
            <p class="text-slate-300 text-sm leading-relaxed">{{ prospecto.notas }}</p>
          </div>

          <div class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cotizaciones asociadas</p>
              <span class="text-xs text-slate-500">{{ prospecto.cotizaciones?.length ?? 0 }} total</span>
            </div>
            <div v-if="!prospecto.cotizaciones?.length" class="px-5 py-10 text-center">
              <p class="text-sm text-slate-500">Sin cotizaciones aún</p>
            </div>
            <ul v-else class="divide-y divide-white/5">
              <li
                v-for="c in prospecto.cotizaciones"
                :key="c.id"
                class="flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <AppInsignia :variante="CONFIG_COTIZACION[c.estado] ?? 'neutro'" punto>
                    {{ c.estado.charAt(0) + c.estado.slice(1).toLowerCase() }}
                  </AppInsignia>
                  <span class="text-sm font-semibold text-white">{{ formatearMoneda(c.precioTotal) }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-slate-500">{{ formatearFecha(c.creadoEn) }}</span>
                  <RouterLink
                    :to="{ name: 'admin-cotizacion-detalle', params: { id: c.id } }"
                    class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </RouterLink>
                </div>
              </li>
            </ul>
          </div>

        </div>

        <div class="space-y-5">

          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Flujo del proceso</p>
            <div class="relative">
              <div class="absolute left-4.5 top-6 bottom-6 w-px bg-white/8" />
              <div class="space-y-2">
                <button
                  v-for="estado in ESTADOS"
                  :key="estado"
                  class="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                  :class="prospecto.estado === estado
                    ? `${CONFIG_ESTADO[estado].bg} ${CONFIG_ESTADO[estado].color} border font-semibold`
                    : 'text-slate-500 hover:text-white hover:bg-white/5'"
                  @click="cambioRapidoEstado(estado)"
                >
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all z-10"
                    :class="prospecto.estado === estado
                      ? 'border-current bg-current/20'
                      : 'border-white/10 bg-[#13151f]'"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="CONFIG_ESTADO[estado].icono" />
                    </svg>
                  </div>
                  <span>{{ CONFIG_ESTADO[estado].etiqueta }}</span>
                  <svg v-if="prospecto.estado === estado" class="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <div class="flex items-center justify-between mb-4">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asignado a</p>
              <button
                class="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                @click="abrirModalAsignar"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {{ prospecto.usuario ? 'Cambiar' : 'Asignar' }}
              </button>
            </div>

            <div v-if="prospecto.usuario" class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                {{ inicialNombre(prospecto.usuario.nombre) }}
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ prospecto.usuario.nombre }}</p>
                <p class="text-xs text-slate-500">{{ prospecto.usuario.correo }}</p>
              </div>
            </div>

            <div v-else class="space-y-3">
              <div class="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <svg class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p class="text-xs font-semibold text-amber-300">Sin usuario vinculado</p>
                  <p class="text-xs text-amber-400/70 mt-0.5 leading-relaxed">El cliente no verá sus cotizaciones hasta que lo asignes.</p>
                </div>
              </div>
              <button
                class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 text-violet-300 text-sm font-medium transition-all"
                @click="abrirModalAsignar"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Vincular a un usuario
              </button>
            </div>
          </div>

          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Herramientas IA</p>
            </div>
            <div class="space-y-2">
              <button
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all text-left"
                @click="analizarConIA"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div>
                  <p class="font-medium">Analizar lead</p>
                  <p class="text-xs opacity-70">Puntaje, fortalezas y riesgos</p>
                </div>
              </button>
              <button
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all text-left"
                @click="generarPropuesta"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p class="font-medium">Generar propuesta</p>
                  <p class="text-xs opacity-70">Propuesta comercial personalizada</p>
                </div>
              </button>
            </div>
          </div>

          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5 space-y-2.5 text-xs">
            <p class="font-semibold text-slate-500 uppercase tracking-wider mb-1">Información</p>
            <div class="flex justify-between items-center">
              <span class="text-slate-500">ID</span>
              <span class="text-slate-400 font-mono truncate max-w-28" :title="prospecto.id">{{ prospecto.id.slice(0, 8) }}…</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Registrado</span>
              <span class="text-slate-300">{{ formatearFecha(prospecto.creadoEn) }}</span>
            </div>
          </div>

        </div>
      </div>

    </template>

    <AppModal :abierto="modalEstado" titulo="Cambiar estado" tamano="sm" @cerrar="modalEstado = false">
      <div class="space-y-4">
        <div v-if="prospecto" class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <div class="w-9 h-9 rounded-full bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
            {{ inicialNombre(prospecto.nombre) }}
          </div>
          <div>
            <p class="text-sm font-medium text-white">{{ prospecto.nombre }}</p>
            <p class="text-xs text-slate-500">{{ prospecto.correo }}</p>
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nuevo estado</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="estado in ESTADOS"
              :key="estado"
              class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
              :class="formularioEstado.estado === estado
                ? `${CONFIG_ESTADO[estado].bg} ${CONFIG_ESTADO[estado].color}`
                : 'bg-white/3 border-white/8 text-slate-400 hover:text-white hover:border-white/15'"
              @click="formularioEstado.estado = estado"
            >
              <span class="w-2 h-2 rounded-full shrink-0" :class="CONFIG_ESTADO[estado].dot" />
              {{ CONFIG_ESTADO[estado].etiqueta }}
            </button>
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Notas internas</label>
          <textarea
            v-model="formularioEstado.notas"
            rows="3"
            placeholder="Observaciones..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none resize-none transition-all"
          />
        </div>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalEstado = false">Cancelar</AppBoton>
        <AppBoton variante="primario" @click="guardarEstado">Guardar</AppBoton>
      </template>
    </AppModal>

    <AppModal :abierto="modalAsignar" titulo="Vincular a usuario" tamano="sm" @cerrar="modalAsignar = false">
      <div class="space-y-4">
        <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
          Al vincular, el usuario podrá ver y responder las cotizaciones desde su panel de cliente.
        </div>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="busquedaUsuario"
            type="search"
            placeholder="Buscar por nombre o correo..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
          />
        </div>
        <div class="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          <div v-if="cargandoUsuarios" class="space-y-2">
            <div v-for="i in 4" :key="i" class="h-12 bg-white/5 rounded-xl animate-pulse" />
          </div>
          <template v-else>
            <button
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border"
              :class="usuarioSelecId === null
                ? 'bg-red-500/10 border-red-500/20 text-red-300'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'"
              @click="usuarioSelecId = null"
            >
              <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <span class="font-medium">Sin asignar</span>
              <svg v-if="usuarioSelecId === null" class="w-4 h-4 ml-auto text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              v-for="u in usuariosFiltrados"
              :key="u.id"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border"
              :class="usuarioSelecId === u.id
                ? 'bg-violet-500/15 border-violet-500/25 text-violet-300'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'"
              @click="usuarioSelecId = u.id"
            >
              <div class="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                {{ inicialNombre(u.nombre) }}
              </div>
              <div class="flex-1 min-w-0 text-left">
                <p class="font-medium truncate">{{ u.nombre }}</p>
                <p class="text-xs opacity-70 truncate">{{ u.correo }}</p>
              </div>
              <svg v-if="usuarioSelecId === u.id" class="w-4 h-4 ml-auto text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <p v-if="!usuariosFiltrados.length" class="text-center text-sm text-slate-500 py-4">
              No se encontraron usuarios
            </p>
          </template>
        </div>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalAsignar = false">Cancelar</AppBoton>
        <AppBoton variante="primario" :cargando="guardandoAsignar" @click="guardarAsignacion">Confirmar</AppBoton>
      </template>
    </AppModal>

    <AppModal :abierto="modalAnalisis" titulo="🤖 Análisis IA del prospecto" tamano="md" @cerrar="modalAnalisis = false">
      <div v-if="prospecto" class="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
        <div class="w-10 h-10 rounded-full bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
          {{ inicialNombre(prospecto.nombre) }}
        </div>
        <div>
          <p class="text-sm font-semibold text-white">{{ prospecto.nombre }}</p>
          <p class="text-xs text-slate-500">{{ ETIQUETA_TIPO[prospecto.tipoServicio] }}</p>
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
      <div v-if="prospecto" class="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
        <div class="w-10 h-10 rounded-full bg-linear-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center text-sm font-bold text-emerald-400 shrink-0">
          {{ inicialNombre(prospecto.nombre) }}
        </div>
        <div>
          <p class="text-sm font-semibold text-white">{{ prospecto.nombre }}</p>
          <p class="text-xs text-slate-500">{{ ETIQUETA_TIPO[prospecto.tipoServicio] }}</p>
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