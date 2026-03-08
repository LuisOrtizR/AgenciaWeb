<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { prospectosServicio, iaServicio } from '@/services/servicios'
import AppInsignia from '@/components/ui/AppInsignia.vue'
import AppBoton   from '@/components/ui/AppBoton.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import type { Prospecto, EstadoProspecto, DatosActualizarEstadoProspecto } from '@/types'

const route   = useRoute()
const router  = useRouter()
const uiStore = useUiStore()

const prospecto      = ref<Prospecto | null>(null)
const cargando       = ref(true)
const cargandoIA     = ref(false)
const modalEstado    = ref(false)
const modalAnalisis  = ref(false)
const modalPropuesta = ref(false)
const resultadoIA    = ref('')
const propuestaIA    = ref('')

const formularioEstado = ref<DatosActualizarEstadoProspecto>({
  estado: 'NUEVO',
  notas:  null,
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

type VarianteInsignia = 'info' | 'advertencia' | 'exito' | 'error' | 'neutro'

const varianteEstado = (e: EstadoProspecto): VarianteInsignia => ({
  NUEVO:      'info',
  CONTACTADO: 'advertencia',
  CONVERTIDO: 'exito',
  PERDIDO:    'error',
} as const)[e]

const etiquetaEstado = (e: EstadoProspecto) => ({
  NUEVO:      'Nuevo',
  CONTACTADO: 'Contactado',
  CONVERTIDO: 'Convertido',
  PERDIDO:    'Perdido',
}[e])

const etiquetaTipo = (tipo: string) => ({
  LANDING:       'Landing Page',
  CORPORATIVO:   'Corporativo',
  ECOMMERCE:     'E-commerce',
  SAAS:          'SaaS',
  MANTENIMIENTO: 'Mantenimiento',
}[tipo] ?? tipo)

const varianteCotizacion = (e: string): VarianteInsignia => {
  const mapa: Record<string, VarianteInsignia> = {
    PENDIENTE: 'advertencia',
    ENVIADA:   'info',
    ACEPTADA:  'exito',
    RECHAZADA: 'error',
  }
  return mapa[e] ?? 'neutro'
}

const formatearMoneda = (m: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(m)

const formatearFechaCorta = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f))

const inicialNombre = (nombre: string) =>
  nombre[0]?.toUpperCase() ?? '?'

// ─── Carga ───────────────────────────────────────────────────────────────────

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

// ─── Acciones ────────────────────────────────────────────────────────────────

const ESTADOS: EstadoProspecto[] = ['NUEVO', 'CONTACTADO', 'CONVERTIDO', 'PERDIDO']

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
    uiStore.exito('Estado actualizado', `Marcado como ${etiquetaEstado(estado)}`)
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el estado')
  }
}

// ── IA: analizar prospecto ───────────────────────────────────────────────────
const analizarConIA = async () => {
  if (!prospecto.value) return
  resultadoIA.value   = ''
  modalAnalisis.value = true
  cargandoIA.value    = true
  try {
    const { data } = await iaServicio.analizarProspecto(prospecto.value.id)
    const a = data.datos.analisis
    const nivelEmoji: Record<string, string> = { CALIENTE: '🔴', TIBIO: '🟡', FRIO: '🔵' }
    resultadoIA.value = [
      `${nivelEmoji[a.nivel] ?? '⚪'} PUNTAJE: ${a.puntaje}/100 — ${a.nivel}`,
      '',
      '📋 RESUMEN',
      a.resumen,
      '',
      '✅ FORTALEZAS',
      ...a.fortalezas.map(f => `• ${f}`),
      '',
      '⚠️ RIESGOS',
      ...a.riesgos.map(r => `• ${r}`),
      '',
      '🎯 ACCIONES RECOMENDADAS',
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

// ── IA: generar propuesta ────────────────────────────────────────────────────
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

// ── Eliminar ─────────────────────────────────────────────────────────────────
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

    <!-- Navegación atrás -->
    <div class="flex items-center gap-3">
      <RouterLink :to="{ name: 'admin-prospectos' }"
        class="flex items-center gap-1.5 text-sm text-gris-medio hover:text-white transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Prospectos
      </RouterLink>
    </div>

    <!-- Skeleton -->
    <div v-if="cargando" class="space-y-4">
      <div class="h-32 bg-white/5 rounded-2xl animate-pulse" />
      <div class="grid grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="h-24 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>

    <template v-else-if="prospecto">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-violeta/30 to-indigo-500/20 flex items-center justify-center text-2xl font-black text-violeta-claro shrink-0">
            {{ inicialNombre(prospecto.nombre) }}
          </div>
          <div>
            <h1 class="text-2xl font-black text-white">{{ prospecto.nombre }}</h1>
            <p class="text-gris-medio text-sm mt-0.5">{{ prospecto.correo }}</p>
            <div class="flex items-center gap-2 mt-2">
              <AppInsignia :variante="varianteEstado(prospecto.estado)" punto>
                {{ etiquetaEstado(prospecto.estado) }}
              </AppInsignia>
              <AppInsignia variante="neutro">{{ etiquetaTipo(prospecto.tipoServicio) }}</AppInsignia>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <AppBoton variante="secundario" tamano="sm" @click="abrirModalEstado">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Cambiar estado
          </AppBoton>
          <AppBoton variante="secundario" tamano="sm" @click="analizarConIA">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analizar IA
          </AppBoton>
          <AppBoton variante="exito" tamano="sm" @click="generarPropuesta">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar propuesta
          </AppBoton>
          <AppBoton variante="peligro" tamano="sm" @click="eliminar">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </AppBoton>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- Columna principal -->
        <div class="lg:col-span-2 space-y-5">

          <!-- Información de contacto -->
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 class="text-sm font-semibold text-white">Información de contacto</h2>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-xs text-gris-medio mb-1">Correo</p>
                <a :href="`mailto:${prospecto.correo}`" class="text-violeta-claro hover:text-violeta transition-colors">{{ prospecto.correo }}</a>
              </div>
              <div v-if="prospecto.telefono">
                <p class="text-xs text-gris-medio mb-1">Teléfono</p>
                <a :href="`tel:${prospecto.telefono}`" class="text-blanco-suave">{{ prospecto.telefono }}</a>
              </div>
              <div>
                <p class="text-xs text-gris-medio mb-1">Tipo de servicio</p>
                <p class="text-blanco-suave">{{ etiquetaTipo(prospecto.tipoServicio) }}</p>
              </div>
              <div v-if="prospecto.presupuesto">
                <p class="text-xs text-gris-medio mb-1">Presupuesto</p>
                <p class="text-white font-semibold">{{ formatearMoneda(prospecto.presupuesto) }}</p>
              </div>
              <div v-if="prospecto.fuente">
                <p class="text-xs text-gris-medio mb-1">Fuente</p>
                <p class="text-blanco-suave">{{ prospecto.fuente }}</p>
              </div>
              <div>
                <p class="text-xs text-gris-medio mb-1">Fecha de registro</p>
                <p class="text-blanco-suave">{{ formatearFechaCorta(prospecto.creadoEn) }}</p>
              </div>
            </div>
          </div>

          <!-- Mensaje -->
          <div v-if="prospecto.mensaje" class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-white mb-3">Mensaje del prospecto</h2>
            <p class="text-gris-medio text-sm leading-relaxed">{{ prospecto.mensaje }}</p>
          </div>

          <!-- Notas internas -->
          <div v-if="prospecto.notas" class="bg-[#13151f] border border-amarillo/20 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-amarillo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 class="text-sm font-semibold text-amarillo">Notas internas</h2>
            </div>
            <p class="text-blanco-suave text-sm leading-relaxed">{{ prospecto.notas }}</p>
          </div>

          <!-- Cotizaciones -->
          <div class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 class="text-sm font-semibold text-white">Cotizaciones asociadas</h2>
              <span class="text-xs text-gris-medio">{{ prospecto.cotizaciones?.length ?? 0 }} total</span>
            </div>
            <div v-if="!prospecto.cotizaciones?.length" class="px-5 py-8 text-center text-sm text-gris-medio">
              Sin cotizaciones aún
            </div>
            <ul v-else class="divide-y divide-white/5">
              <li v-for="c in prospecto.cotizaciones" :key="c.id"
                class="flex items-center justify-between px-5 py-3.5 hover:bg-white/2 transition-colors">
                <div class="flex items-center gap-3">
                  <AppInsignia :variante="varianteCotizacion(c.estado)" punto>
                    {{ c.estado.charAt(0) + c.estado.slice(1).toLowerCase() }}
                  </AppInsignia>
                  <span class="text-sm font-semibold text-white">{{ formatearMoneda(c.precioTotal) }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gris-medio">{{ formatearFechaCorta(c.creadoEn) }}</span>
                  <RouterLink :to="{ name: 'admin-cotizacion-detalle', params: { id: c.id } }"
                    class="p-1.5 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </RouterLink>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Columna derecha -->
        <div class="space-y-5">

          <!-- Cambio rápido de estado -->
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5 space-y-3">
            <h2 class="text-sm font-semibold text-white">Estado del prospecto</h2>
            <div class="space-y-2">
              <button v-for="estado in ESTADOS" :key="estado"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                :class="prospecto.estado === estado
                  ? 'bg-violeta/20 border border-violeta/30 text-violeta-claro'
                  : 'text-gris-medio hover:text-white hover:bg-white/5'"
                @click="cambioRapidoEstado(estado)">
                <span class="w-2 h-2 rounded-full shrink-0"
                  :class="{
                    'bg-blue-400':   estado === 'NUEVO',
                    'bg-yellow-400': estado === 'CONTACTADO',
                    'bg-green-400':  estado === 'CONVERTIDO',
                    'bg-red-400':    estado === 'PERDIDO',
                  }" />
                {{ etiquetaEstado(estado) }}
                <svg v-if="prospecto.estado === estado" class="w-3.5 h-3.5 ml-auto text-violeta-claro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Herramientas IA -->
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5 space-y-3">
            <h2 class="text-sm font-semibold text-white flex items-center gap-2">
              <svg class="w-4 h-4 text-violeta-claro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Herramientas IA
            </h2>
            <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gris-medio hover:text-violeta-claro hover:bg-violeta/10 transition-all text-left" @click="analizarConIA">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <p class="font-medium">Analizar lead</p>
                <p class="text-xs opacity-70">Puntaje, fortalezas y riesgos</p>
              </div>
            </button>
            <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gris-medio hover:text-verde hover:bg-verde/10 transition-all text-left" @click="generarPropuesta">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p class="font-medium">Generar propuesta</p>
                <p class="text-xs opacity-70">Propuesta comercial personalizada</p>
              </div>
            </button>
          </div>

          <!-- Usuario asignado -->
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5">
            <h2 class="text-sm font-semibold text-white mb-3">Asignado a</h2>
            <div v-if="prospecto.usuario" class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-linear-to-br from-violeta/30 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-violeta-claro">
                {{ inicialNombre(prospecto.usuario.nombre) }}
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ prospecto.usuario.nombre }}</p>
                <p class="text-xs text-gris-medio">{{ prospecto.usuario.correo }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gris-medio">Sin asignar</p>
          </div>

          <!-- Fechas -->
          <div class="bg-[#13151f] border border-white/5 rounded-2xl p-5 space-y-3 text-xs text-gris-medio">
            <div class="flex justify-between">
              <span>Registrado</span>
              <span class="text-blanco-suave">{{ formatearFechaCorta(prospecto.creadoEn) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Modal: cambiar estado ─────────────────────────────────────────── -->
    <AppModal :abierto="modalEstado" titulo="Cambiar estado" tamano="sm" @cerrar="modalEstado = false">
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-blanco-suave">Nuevo estado</label>
          <select v-model="formularioEstado.estado"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none">
            <option v-for="e in ESTADOS" :key="e" :value="e">{{ etiquetaEstado(e) }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-blanco-suave">Notas internas</label>
          <textarea v-model="formularioEstado.notas" rows="3" placeholder="Observaciones..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none resize-none" />
        </div>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalEstado = false">Cancelar</AppBoton>
        <AppBoton variante="primario" @click="guardarEstado">Guardar</AppBoton>
      </template>
    </AppModal>

    <!-- ── Modal: análisis IA ────────────────────────────────────────────── -->
    <AppModal :abierto="modalAnalisis" titulo="🤖 Análisis IA del prospecto" tamano="md" @cerrar="modalAnalisis = false">
      <div v-if="prospecto" class="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
        <div class="w-10 h-10 rounded-full bg-linear-to-br from-violeta/30 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violeta-claro shrink-0">
          {{ inicialNombre(prospecto.nombre) }}
        </div>
        <div>
          <p class="text-sm font-semibold text-white">{{ prospecto.nombre }}</p>
          <p class="text-xs text-gris-medio">{{ etiquetaTipo(prospecto.tipoServicio) }}</p>
        </div>
      </div>
      <div v-if="cargandoIA" class="py-12 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center animate-pulse shadow-lg shadow-violeta/30">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p class="text-blanco-suave text-sm font-medium">Analizando con inteligencia artificial...</p>
        <p class="text-gris-medio text-xs">Groq · Llama 3.3 70B</p>
      </div>
      <div v-else class="bg-white/3 rounded-xl p-4 text-sm text-blanco-suave whitespace-pre-line leading-relaxed font-mono">
        {{ resultadoIA }}
      </div>
      <template #footer>
        <AppBoton variante="secundario" @click="modalAnalisis = false">Cerrar</AppBoton>
      </template>
    </AppModal>

    <!-- ── Modal: propuesta IA ───────────────────────────────────────────── -->
    <AppModal :abierto="modalPropuesta" titulo="📄 Propuesta comercial con IA" tamano="lg" @cerrar="modalPropuesta = false">
      <div v-if="prospecto" class="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
        <div class="w-10 h-10 rounded-full bg-linear-to-br from-verde/20 to-emerald-500/10 flex items-center justify-center text-sm font-bold text-verde shrink-0">
          {{ inicialNombre(prospecto.nombre) }}
        </div>
        <div>
          <p class="text-sm font-semibold text-white">{{ prospecto.nombre }}</p>
          <p class="text-xs text-gris-medio">{{ etiquetaTipo(prospecto.tipoServicio) }}</p>
        </div>
      </div>
      <div v-if="cargandoIA" class="py-12 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-verde to-emerald-500 flex items-center justify-center animate-pulse shadow-lg shadow-verde/30">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-blanco-suave text-sm font-medium">Generando propuesta comercial...</p>
        <p class="text-gris-medio text-xs">Groq · Llama 3.3 70B</p>
      </div>
      <div v-else class="space-y-4">
        <div class="bg-white/3 rounded-xl p-4 text-sm text-blanco-suave whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto">
          {{ propuestaIA }}
        </div>
        <p class="text-xs text-gris-medio flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-amarillo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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