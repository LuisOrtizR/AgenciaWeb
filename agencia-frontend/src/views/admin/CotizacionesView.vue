<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { cotizacionesServicio, serviciosServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppModal      from '@/components/ui/AppModal.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import type { Cotizacion, EstadoCotizacion, Servicio } from '@/types'

const uiStore = useUiStore()
const pag     = usePaginacion(12)

const cotizaciones   = ref<Cotizacion[]>([])
const servicios      = ref<Servicio[]>([])
const cargando       = ref(true)
const cotizSelec     = ref<Cotizacion | null>(null)
const modalEstado    = ref(false)
const modalDetalle   = ref(false)

const filtros = reactive({
  busqueda:  '',
  estado:    '' as EstadoCotizacion | '',
  servicioId: '',
})

const formularioEstado = reactive({
  estado: '' as EstadoCotizacion,
  notas:  null as string | null,
})

// ─── Etiquetas ───────────────────────────────────────────────────────────────

const ESTADOS: { valor: EstadoCotizacion | ''; etiqueta: string }[] = [
  { valor: '',           etiqueta: 'Todos los estados' },
  { valor: 'PENDIENTE',  etiqueta: 'Pendiente' },
  { valor: 'ENVIADA',    etiqueta: 'Enviada' },
  { valor: 'ACEPTADA',   etiqueta: 'Aceptada' },
  { valor: 'RECHAZADA',  etiqueta: 'Rechazada' },
]

const varianteEstado = (estado: EstadoCotizacion) => {
  const mapa: Record<EstadoCotizacion, 'advertencia' | 'info' | 'exito' | 'error'> = {
    PENDIENTE: 'advertencia',
    ENVIADA:   'info',
    ACEPTADA:  'exito',
    RECHAZADA: 'error',
  }
  return mapa[estado]
}

const etiquetaEstado = (e: EstadoCotizacion) => ({
  PENDIENTE: 'Pendiente',
  ENVIADA:   'Enviada',
  ACEPTADA:  'Aceptada',
  RECHAZADA: 'Rechazada',
}[e])

const formatearMoneda = (monto: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto)

const formatearFecha = (fecha: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(fecha))

// ─── Carga ───────────────────────────────────────────────────────────────────

const cargar = async () => {
  cargando.value = true
  try {
    const params: Record<string, unknown> = {
      pagina: pag.paginaActual.value,
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

onMounted(cargar)
watch([filtros, () => pag.paginaActual.value], () => {
  if (pag.paginaActual.value !== 1) pag.reiniciar()
  else cargar()
}, { deep: true })

// ─── Acciones ─────────────────────────────────────────────────────────────────

const abrirModalEstado = (c: Cotizacion) => {
  cotizSelec.value           = c
  formularioEstado.estado    = c.estado
  formularioEstado.notas     = c.notas
  modalEstado.value          = true
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

const duplicar = async (c: Cotizacion) => {
  try {
    await cotizacionesServicio.duplicar(c.id)
    uiStore.exito('Cotización duplicada', 'Se creó una copia como PENDIENTE')
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo duplicar la cotización')
  }
}

const eliminar = async (c: Cotizacion) => {
  if (!confirm(`¿Eliminar esta cotización? (${formatearMoneda(c.precioTotal)})`)) return
  try {
    await cotizacionesServicio.eliminar(c.id)
    uiStore.exito('Eliminada correctamente')
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo eliminar la cotización')
  }
}

const verDetalle = (c: Cotizacion) => {
  cotizSelec.value  = c
  modalDetalle.value = true
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">

    <!-- Encabezado -->
    <div>
      <h1 class="text-2xl font-bold text-white">Cotizaciones</h1>
      <p class="text-gris-medio text-sm mt-1">Gestiona propuestas y su estado de aprobación</p>
    </div>

    <!-- Filtros -->
    <div class="bg-[#13151f] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
      <div class="flex-1 relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gris-medio pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="filtros.busqueda" type="search" placeholder="Buscar por prospecto..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none transition-all" />
      </div>
      <select v-model="filtros.estado"
        class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-blanco-suave text-sm outline-none">
        <option v-for="e in ESTADOS" :key="e.valor" :value="e.valor">{{ e.etiqueta }}</option>
      </select>
      <select v-model="filtros.servicioId"
        class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-blanco-suave text-sm outline-none">
        <option value="">Todos los servicios</option>
        <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }}</option>
      </select>
    </div>

    <!-- Tabla -->
    <div class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
      <div v-if="cargando" class="p-8 space-y-3">
        <div v-for="i in 6" :key="i" class="h-14 bg-white/5 rounded-xl animate-pulse" />
      </div>

      <div v-else-if="!cotizaciones.length" class="py-20 text-center">
        <p class="text-white font-medium">No hay cotizaciones</p>
        <p class="text-gris-medio text-sm mt-1">Las cotizaciones aparecerán aquí una vez creadas</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="text-left px-6 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide">Prospecto</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide hidden md:table-cell">Servicio</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide">Monto</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide">Estado</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide hidden lg:table-cell">Fecha</th>
              <th class="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="c in cotizaciones" :key="c.id" class="hover:bg-white/3 transition-colors">
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-white">{{ c.prospecto.nombre }}</p>
                <p class="text-xs text-gris-medio">{{ c.prospecto.correo }}</p>
              </td>
              <td class="px-4 py-4 hidden md:table-cell">
                <span class="text-sm text-blanco-suave">{{ c.servicio.nombre }}</span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm font-semibold text-white">{{ formatearMoneda(c.precioTotal) }}</span>
              </td>
              <td class="px-4 py-4">
                <button @click="abrirModalEstado(c)">
                  <AppInsignia :variante="varianteEstado(c.estado)" punto>{{ etiquetaEstado(c.estado) }}</AppInsignia>
                </button>
              </td>
              <td class="px-4 py-4 hidden lg:table-cell">
                <span class="text-xs text-gris-medio">{{ formatearFecha(c.creadoEn) }}</span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-1 justify-end">
                  <button class="p-1.5 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all" title="Ver detalle" @click="verDetalle(c)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button class="p-1.5 rounded-lg text-gris-medio hover:text-azul hover:bg-azul/10 transition-all" title="Duplicar" @click="duplicar(c)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                  <button class="p-1.5 rounded-lg text-gris-medio hover:text-rojo hover:bg-rojo/10 transition-all" title="Eliminar" @click="eliminar(c)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

    <!-- Modal: cambiar estado -->
    <AppModal :abierto="modalEstado" titulo="Actualizar estado" tamano="sm" @cerrar="modalEstado = false">
      <div class="space-y-4">
        <div v-if="cotizSelec" class="p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
          <p class="font-medium text-white">{{ cotizSelec.prospecto.nombre }}</p>
          <p class="text-gris-medio">{{ formatearMoneda(cotizSelec.precioTotal) }} · {{ cotizSelec.servicio.nombre }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-blanco-suave">Nuevo estado</label>
          <select v-model="formularioEstado.estado"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none">
            <option v-for="e in ESTADOS.slice(1)" :key="e.valor" :value="e.valor">{{ e.etiqueta }}</option>
          </select>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-blanco-suave">Notas (opcional)</label>
          <textarea v-model="formularioEstado.notas" rows="3" placeholder="Observaciones..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none resize-none" />
        </div>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalEstado = false">Cancelar</AppBoton>
        <AppBoton variante="primario" @click="guardarEstado">Guardar</AppBoton>
      </template>
    </AppModal>

    <!-- Modal: detalle -->
    <AppModal :abierto="modalDetalle" titulo="Detalle de cotización" tamano="md" @cerrar="modalDetalle = false">
      <div v-if="cotizSelec" class="space-y-5 text-sm">
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-white/5 border border-white/5">
            <p class="text-xs text-gris-medio mb-1">Prospecto</p>
            <p class="font-medium text-white">{{ cotizSelec.prospecto.nombre }}</p>
            <p class="text-gris-medio text-xs">{{ cotizSelec.prospecto.correo }}</p>
          </div>
          <div class="p-4 rounded-xl bg-white/5 border border-white/5">
            <p class="text-xs text-gris-medio mb-1">Servicio</p>
            <p class="font-medium text-white">{{ cotizSelec.servicio.nombre }}</p>
          </div>
          <div class="p-4 rounded-xl bg-white/5 border border-white/5">
            <p class="text-xs text-gris-medio mb-1">Precio total</p>
            <p class="font-bold text-white text-lg">{{ formatearMoneda(cotizSelec.precioTotal) }}</p>
          </div>
          <div class="p-4 rounded-xl bg-white/5 border border-white/5">
            <p class="text-xs text-gris-medio mb-2">Estado</p>
            <AppInsignia :variante="varianteEstado(cotizSelec.estado)" punto>{{ etiquetaEstado(cotizSelec.estado) }}</AppInsignia>
          </div>
        </div>
        <div v-if="cotizSelec.extras.length" class="p-4 rounded-xl bg-white/5 border border-white/5">
          <p class="text-xs text-gris-medio mb-2">Extras incluidos</p>
          <ul class="space-y-1">
            <li v-for="extra in cotizSelec.extras" :key="extra" class="flex items-center gap-2 text-blanco-suave">
              <span class="w-1.5 h-1.5 rounded-full bg-verde" />{{ extra }}
            </li>
          </ul>
        </div>
        <div v-if="cotizSelec.notas" class="p-4 rounded-xl bg-white/5 border border-white/5">
          <p class="text-xs text-gris-medio mb-1">Notas</p>
          <p class="text-blanco-suave">{{ cotizSelec.notas }}</p>
        </div>
        <p class="text-xs text-gris-medio text-right">Creada el {{ formatearFecha(cotizSelec.creadoEn) }}</p>
      </div>
      <template #footer>
        <AppBoton variante="secundario" @click="modalDetalle = false">Cerrar</AppBoton>
        <AppBoton variante="primario" @click="() => { modalDetalle = false; abrirModalEstado(cotizSelec!) }">Cambiar estado</AppBoton>
      </template>
    </AppModal>
  </div>
</template>