<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { testimoniosServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppModal      from '@/components/ui/AppModal.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import type { Testimonio, ResumenTestimonios, DatosCrearTestimonio, FiltrosTestimonio } from '@/types'

const uiStore = useUiStore()
const pag     = usePaginacion(12)

const testimonios = ref<Testimonio[]>([])
const resumen     = ref<ResumenTestimonios | null>(null)
const cargando    = ref(true)
const guardando   = ref(false)
const modalForm   = ref(false)
const modalVer    = ref(false)
const editando    = ref<Testimonio | null>(null)
const viendo      = ref<Testimonio | null>(null)

const filtros = reactive({
  busqueda:     '',
  visible:      '' as 'true' | 'false' | '',
  calificacion: '' as '1' | '2' | '3' | '4' | '5' | '',
})

// DatosCrearTestimonio usa: nombre, texto, empresa, cargo, calificacion, proyectoId
const formulario = reactive<DatosCrearTestimonio & { visible: boolean }>({
  nombre:      '',
  empresa:     null,
  cargo:       null,
  texto:       '',
  calificacion: 5,
  visible:     true,
  proyectoId:  null,
})

const tarjetasResumen = computed(() => resumen.value ? [
  {
    label: 'Total',
    valor: resumen.value.total,
    color: 'text-white',
    bg:    'bg-white/5 border-white/8',
    icono: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    label: 'Visibles',
    valor: resumen.value.visibles,
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/10 border-emerald-500/20',
    icono: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  },
  {
    label: 'Pendientes',
    valor: resumen.value.total - resumen.value.visibles,
    color: 'text-amber-400',
    bg:    'bg-amber-500/10 border-amber-500/20',
    icono: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    label: 'Promedio',
    valor: resumen.value.calificacionPromedio?.toFixed(1) ?? '—',
    color: 'text-amber-400',
    bg:    'bg-amber-500/10 border-amber-500/20',
    icono: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
] : [])

const formatearFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f))

const inicialNombre = (nombre: string) => nombre[0]?.toUpperCase() ?? '?'

const cargar = async () => {
  cargando.value = true
  try {
    const params: FiltrosTestimonio = {
      pagina:    pag.paginaActual.value,
      porPagina: pag.porPagina.value,
    }
    if (filtros.busqueda)     params.busqueda = filtros.busqueda
    if (filtros.visible !== '') params.visible = filtros.visible === 'true'

    const [{ data }, { data: dataResumen }] = await Promise.all([
      testimoniosServicio.listarAdmin(params),
      resumen.value
        ? Promise.resolve({ data: { datos: resumen.value } })
        : testimoniosServicio.resumen(),
    ])
    testimonios.value = data.datos
    resumen.value     = dataResumen.datos
    pag.actualizarPaginacion(data.paginacion)
  } catch {
    uiStore.error('Error', 'No se pudieron cargar los testimonios')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

watch(filtros, () => { pag.paginaActual.value = 1; cargar() }, { deep: true })

const cambiarPagina = (pagina: number) => { pag.irAPagina(pagina); cargar() }

const resetFormulario = () => {
  Object.assign(formulario, {
    nombre:       '',
    empresa:      null,
    cargo:        null,
    texto:        '',
    calificacion: 5,
    visible:      true,
    proyectoId:   null,
  })
  editando.value = null
}

const abrirCrear = () => { resetFormulario(); modalForm.value = true }

const abrirEditar = (t: Testimonio) => {
  editando.value = t
  Object.assign(formulario, {
    nombre:       t.nombreCliente,
    empresa:      t.empresa ?? null,
    cargo:        null,
    texto:        t.contenido,
    calificacion: t.calificacion,
    visible:      t.visible,
    proyectoId:   t.proyectoId ?? null,
  })
  modalForm.value = true
}

const abrirVer = (t: Testimonio) => { viendo.value = t; modalVer.value = true }

const guardar = async () => {
  if (!formulario.nombre || !formulario.texto) {
    uiStore.advertencia('Campos requeridos', 'Completa nombre y contenido')
    return
  }
  guardando.value = true
  try {
    if (editando.value) {
      await testimoniosServicio.actualizar(editando.value.id, {
        texto:        formulario.texto,
        calificacion: formulario.calificacion,
      })
      uiStore.exito('Testimonio actualizado')
    } else {
      await testimoniosServicio.crear(formulario)
      uiStore.exito('Testimonio creado')
    }
    modalForm.value = false
    resetFormulario()
    resumen.value = null
    await cargar()
  } catch {
    uiStore.error('Error', 'No se pudo guardar el testimonio')
  } finally {
    guardando.value = false
  }
}

const moderar = async (t: Testimonio) => {
  try {
    await testimoniosServicio.moderar(t.id, { visible: !t.visible })
    uiStore.exito(t.visible ? 'Testimonio ocultado' : 'Testimonio aprobado')
    resumen.value = null
    await cargar()
  } catch {
    uiStore.error('Error', 'No se pudo moderar')
  }
}

const eliminar = async (t: Testimonio) => {
  if (!confirm(`¿Eliminar el testimonio de ${t.nombreCliente}? Esta acción no se puede deshacer.`)) return
  try {
    await testimoniosServicio.eliminar(t.id)
    uiStore.exito('Testimonio eliminado')
    resumen.value = null
    await cargar()
  } catch {
    uiStore.error('Error', 'No se pudo eliminar')
  }
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Testimonios</h1>
        <p class="text-slate-500 text-sm mt-1">Modera los comentarios de clientes antes de publicarlos</p>
      </div>
      <AppBoton variante="primario" @click="abrirCrear">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo testimonio
      </AppBoton>
    </div>

    <div v-if="tarjetasResumen.length" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="card in tarjetasResumen"
        :key="card.label"
        class="bg-[#13151f] border rounded-2xl p-4"
        :class="card.bg"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ card.label }}</span>
          <svg class="w-4 h-4" :class="card.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="card.icono" />
          </svg>
        </div>
        <p class="text-2xl font-black tabular-nums" :class="card.color">{{ card.valor }}</p>
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
          placeholder="Buscar por nombre o empresa..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
        />
      </div>
      <div class="flex gap-2">
        <button
          v-for="n in [5, 4, 3, 2, 1]"
          :key="n"
          class="px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all"
          :class="filtros.calificacion === String(n)
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            : 'bg-white/3 border-white/8 text-slate-500 hover:text-amber-400 hover:border-amber-500/20'"
          @click="filtros.calificacion = (filtros.calificacion === String(n) ? '' : String(n)) as typeof filtros.calificacion"
        >
          {{ n }}★
        </button>
      </div>
      <select
        v-model="filtros.visible"
        class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none"
      >
        <option value="">Todos</option>
        <option value="true">Visibles</option>
        <option value="false">Ocultos</option>
      </select>
    </div>

    <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 6" :key="i" class="h-44 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <div v-else-if="!testimonios.length" class="py-20 text-center bg-[#13151f] border border-white/5 rounded-2xl">
      <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
        <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p class="text-white font-medium">No hay testimonios</p>
      <p class="text-slate-500 text-sm mt-1">Los testimonios enviados por clientes aparecerán aquí</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="t in testimonios"
        :key="t.id"
        class="bg-[#13151f] border rounded-2xl p-5 flex flex-col transition-all hover:border-white/10 group"
        :class="t.visible ? 'border-white/5' : 'border-amber-500/15'"
      >
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-full bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
              {{ inicialNombre(t.nombreCliente) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-white truncate">{{ t.nombreCliente }}</p>
              <p v-if="t.empresa" class="text-xs text-slate-500 truncate">{{ t.empresa }}</p>
            </div>
          </div>
          <AppInsignia :variante="t.visible ? 'exito' : 'advertencia'" punto class="shrink-0">
            {{ t.visible ? 'Visible' : 'Oculto' }}
          </AppInsignia>
        </div>

        <div class="flex items-center gap-1 mb-3">
          <svg
            v-for="n in 5"
            :key="n"
            class="w-3.5 h-3.5"
            :class="n <= t.calificacion ? 'text-amber-400 fill-current' : 'text-slate-700 fill-current'"
            viewBox="0 0 24 24"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span class="text-xs text-slate-500 ml-1">{{ t.calificacion }}/5</span>
        </div>

        <p class="text-sm text-slate-300 leading-relaxed line-clamp-3 flex-1">{{ t.contenido }}</p>

        <div v-if="t.proyecto" class="flex flex-wrap items-center gap-2 mt-3">
          <span class="inline-flex items-center gap-1 text-xs text-violet-400">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {{ t.proyecto.titulo }}
          </span>
        </div>

        <div class="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <span class="text-xs text-slate-600">{{ formatearFecha(t.creadoEn) }}</span>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              title="Ver completo"
              class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              @click="abrirVer(t)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              title="Editar"
              class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              @click="abrirEditar(t)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              :class="t.visible
                ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                : 'text-emerald-400 hover:bg-emerald-500/10'"
              @click="moderar(t)"
            >
              {{ t.visible ? 'Ocultar' : 'Aprobar' }}
            </button>
            <button
              title="Eliminar"
              class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              @click="eliminar(t)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pag.totalPaginas.value > 1" class="bg-[#13151f] border border-white/5 rounded-2xl px-6 py-4">
      <AppPaginacion
        :pagina-actual="pag.paginaActual.value"
        :total-paginas="pag.totalPaginas.value"
        :total-registros="pag.totalRegistros.value"
        :por-pagina="pag.porPagina.value"
        @cambiar="cambiarPagina"
      />
    </div>

    <AppModal
      :abierto="modalForm"
      :titulo="editando ? `Editar · ${editando.nombreCliente}` : 'Nuevo testimonio'"
      tamano="sm"
      @cerrar="modalForm = false"
    >
      <div class="space-y-4">
        <template v-if="!editando">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nombre <span class="text-red-400">*</span>
              </label>
              <input
                v-model="formulario.nombre"
                type="text"
                placeholder="Ana García"
                class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
              />
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Empresa</label>
              <input
                v-model="formulario.empresa"
                type="text"
                placeholder="Tech Corp SAS"
                class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
              />
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Cargo</label>
            <input
              v-model="formulario.cargo"
              type="text"
              placeholder="CEO, Diseñador, etc."
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
            />
          </div>
        </template>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Calificación</label>
          <div class="flex items-center gap-2">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="transition-transform hover:scale-110"
              @click="formulario.calificacion = n"
            >
              <svg
                class="w-7 h-7"
                :class="n <= formulario.calificacion ? 'text-amber-400 fill-current' : 'text-slate-700 fill-current'"
                viewBox="0 0 24 24"
              >
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <span class="text-sm text-slate-400 ml-1">{{ formulario.calificacion }}/5</span>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Contenido <span class="text-red-400">*</span>
          </label>
          <textarea
            v-model="formulario.texto"
            rows="4"
            placeholder="Excelente servicio, entregaron el proyecto antes del plazo..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none resize-none transition-all"
          />
          <p class="text-xs text-slate-600">{{ formulario.texto.length }} caracteres</p>
        </div>

        <label class="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all">
          <div class="relative shrink-0">
            <input type="checkbox" v-model="formulario.visible" class="sr-only" />
            <div class="w-10 h-5 rounded-full transition-colors" :class="formulario.visible ? 'bg-emerald-600' : 'bg-white/10'" />
            <div
              class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
              :class="formulario.visible ? 'translate-x-5' : ''"
            />
          </div>
          <div>
            <p class="text-sm text-slate-300 font-medium">Publicar inmediatamente</p>
            <p class="text-xs text-slate-500">Visible en el sitio público sin necesidad de moderación</p>
          </div>
        </label>
      </div>

      <template #footer>
        <AppBoton variante="fantasma" @click="modalForm = false">Cancelar</AppBoton>
        <AppBoton variante="primario" :cargando="guardando" @click="guardar">
          {{ editando ? 'Guardar cambios' : 'Crear testimonio' }}
        </AppBoton>
      </template>
    </AppModal>

    <AppModal
      v-if="viendo"
      :abierto="modalVer"
      titulo="Testimonio completo"
      tamano="sm"
      @cerrar="modalVer = false"
    >
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-base font-bold text-violet-300 shrink-0">
            {{ inicialNombre(viendo.nombreCliente) }}
          </div>
          <div>
            <p class="text-sm font-semibold text-white">{{ viendo.nombreCliente }}</p>
            <p v-if="viendo.empresa" class="text-xs text-slate-500">{{ viendo.empresa }}</p>
          </div>
          <AppInsignia :variante="viendo.visible ? 'exito' : 'advertencia'" punto class="ml-auto">
            {{ viendo.visible ? 'Visible' : 'Oculto' }}
          </AppInsignia>
        </div>

        <div class="flex items-center gap-1">
          <svg
            v-for="n in 5"
            :key="n"
            class="w-4 h-4"
            :class="n <= viendo.calificacion ? 'text-amber-400 fill-current' : 'text-slate-700 fill-current'"
            viewBox="0 0 24 24"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span class="text-xs text-slate-500 ml-1">{{ viendo.calificacion }}/5</span>
        </div>

        <div class="bg-white/3 rounded-xl p-4">
          <p class="text-sm text-slate-300 leading-relaxed">{{ viendo.contenido }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div v-if="viendo.proyecto" class="p-2.5 rounded-xl bg-white/5">
            <p class="text-slate-500 mb-0.5">Proyecto</p>
            <p class="text-violet-400 font-medium">{{ viendo.proyecto.titulo }}</p>
          </div>
          <div class="p-2.5 rounded-xl bg-white/5">
            <p class="text-slate-500 mb-0.5">Fecha</p>
            <p class="text-slate-300">{{ formatearFecha(viendo.creadoEn) }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <AppBoton variante="fantasma" @click="modalVer = false">Cerrar</AppBoton>
        <AppBoton
          :variante="viendo.visible ? 'secundario' : 'exito'"
          @click="moderar(viendo); modalVer = false"
        >
          {{ viendo.visible ? 'Ocultar' : 'Aprobar y publicar' }}
        </AppBoton>
      </template>
    </AppModal>
  </div>
</template>