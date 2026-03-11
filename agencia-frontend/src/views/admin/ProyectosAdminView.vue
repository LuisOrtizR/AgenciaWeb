<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { proyectosServicio, serviciosServicio, iaServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppModal      from '@/components/ui/AppModal.vue'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import type { Proyecto, Servicio, DatosCrearProyecto } from '@/types'

const uiStore = useUiStore()
const pag     = usePaginacion(9)

const proyectos    = ref<Proyecto[]>([])
const servicios    = ref<Servicio[]>([])
const tecnologias  = ref<string[]>([])
const cargando     = ref(true)
const cargandoIA   = ref(false)
const guardando    = ref(false)
const modalForm    = ref(false)
const editando     = ref<Proyecto | null>(null)
const archivoImg   = ref<File | null>(null)
const previewImg   = ref<string | null>(null)

const filtros = reactive({
  busqueda:   '',
  tecnologia: '',
  destacado:  '' as 'true' | 'false' | '',
})

const formulario = reactive<DatosCrearProyecto>({
  titulo:       '',
  slug:         '',
  descripcion:  '',
  stackTecnico: [],
  imagenUrl:    null,
  urlEnVivo:    null,
  urlGithub:    null,
  destacado:    false,
  servicioId:   null,
})

const stackTexto = ref('')

const totalDestacados = computed(() => proyectos.value.filter(p => p.destacado).length)

const cargar = async () => {
  cargando.value = true
  try {
    const params: Record<string, unknown> = {
      pagina:    pag.paginaActual.value,
      porPagina: pag.porPagina.value,
    }
    if (filtros.busqueda)   params.busqueda   = filtros.busqueda
    if (filtros.tecnologia) params.tecnologia = filtros.tecnologia
    if (filtros.destacado)  params.destacado  = filtros.destacado

    const [rP, rS, rT] = await Promise.all([
      proyectosServicio.listar(params as any),
      servicios.value.length ? Promise.resolve({ data: { datos: servicios.value } }) : serviciosServicio.listar({ porPagina: 50 }),
      tecnologias.value.length ? Promise.resolve({ data: { datos: tecnologias.value.map(t => ({ tecnologia: t, cantidad: 0 })) } }) : proyectosServicio.tecnologias(),
    ])
    proyectos.value   = rP.data.datos
    servicios.value   = rS.data.datos
    tecnologias.value = rT.data.datos.map((t: any) => t.tecnologia ?? t)
    pag.actualizarPaginacion(rP.data.paginacion)
  } catch {
    uiStore.error('Error', 'No se pudieron cargar los proyectos')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
watch(filtros, () => { pag.paginaActual.value = 1; cargar() }, { deep: true })
const cambiarPagina = (pagina: number) => { pag.irAPagina(pagina); cargar() }

const resetFormulario = () => {
  Object.assign(formulario, {
    titulo: '', slug: '', descripcion: '', stackTecnico: [],
    imagenUrl: null, urlEnVivo: null, urlGithub: null, destacado: false, servicioId: null,
  })
  stackTexto.value = ''
  archivoImg.value = null
  previewImg.value = null
  editando.value   = null
}

const abrirCrear = () => { resetFormulario(); modalForm.value = true }

const abrirEditar = (p: Proyecto) => {
  editando.value = p
  Object.assign(formulario, {
    titulo:       p.titulo,
    slug:         p.slug,
    descripcion:  p.descripcion,
    stackTecnico: [...p.stackTecnico],
    imagenUrl:    p.imagenUrl,
    urlEnVivo:    p.urlEnVivo,
    urlGithub:    p.urlGithub,
    destacado:    p.destacado,
    servicioId:   p.servicioId,
  })
  stackTexto.value = p.stackTecnico.join(', ')
  previewImg.value = p.imagenUrl
  modalForm.value  = true
}

const generarSlug = () => {
  formulario.slug = formulario.titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const procesarStack = () => {
  formulario.stackTecnico = stackTexto.value.split(',').map(s => s.trim()).filter(Boolean)
}

const manejarArchivoImg = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  archivoImg.value = file
  previewImg.value = file ? URL.createObjectURL(file) : (editando.value?.imagenUrl ?? null)
}

const eliminarImagenExistente = async (p: Proyecto) => {
  if (!confirm('¿Eliminar la imagen de este proyecto?')) return
  try {
    await proyectosServicio.eliminarImagen(p.id)
    uiStore.exito('Imagen eliminada')
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo eliminar la imagen')
  }
}

const guardar = async () => {
  if (!formulario.titulo || !formulario.slug || !formulario.descripcion) {
    uiStore.advertencia('Campos requeridos', 'Completa título, slug y descripción')
    return
  }
  procesarStack()
  guardando.value = true
  try {
    let proyecto: Proyecto
    if (editando.value) {
      const { data } = await proyectosServicio.actualizar(editando.value.id, formulario)
      proyecto = data.datos
    } else {
      const { data } = await proyectosServicio.crear(formulario)
      proyecto = data.datos
    }
    if (archivoImg.value) {
      await proyectosServicio.subirImagen(proyecto.id, archivoImg.value)
    }
    uiStore.exito(editando.value ? 'Proyecto actualizado' : 'Proyecto creado')
    modalForm.value = false
    resetFormulario()
    tecnologias.value = []
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo guardar el proyecto')
  } finally {
    guardando.value = false
  }
}

const toggleDestacado = async (p: Proyecto) => {
  try {
    await proyectosServicio.toggleDestacado(p.id)
    uiStore.exito(p.destacado ? 'Quitado de destacados' : 'Marcado como destacado')
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar')
  }
}

const eliminar = async (p: Proyecto) => {
  if (!confirm(`¿Eliminar el proyecto "${p.titulo}"? Esta acción no se puede deshacer.`)) return
  try {
    await proyectosServicio.eliminar(p.id)
    uiStore.exito('Proyecto eliminado')
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo eliminar')
  }
}

const generarDescripcionIA = async () => {
  if (!formulario.titulo || !stackTexto.value.trim()) {
    uiStore.advertencia('Faltan datos', 'Ingresa título y tecnologías primero')
    return
  }
  procesarStack()
  cargandoIA.value = true
  try {
    const { data } = await iaServicio.generarDescripcion({
      titulo:       formulario.titulo,
      stackTecnico: formulario.stackTecnico,
      tipoServicio: servicios.value.find(s => s.id === formulario.servicioId)?.tipo ?? 'CORPORATIVO',
      urlEnVivo:    formulario.urlEnVivo ?? undefined,
    })
    formulario.descripcion = data.datos.descripciones.larga
    uiStore.exito('Descripción generada con IA')
  } catch {
    uiStore.error('Error de IA', 'No se pudo generar la descripción')
  } finally {
    cargandoIA.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">

    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Proyectos</h1>
        <p class="text-slate-500 text-sm mt-1">
          Portafolio de trabajos
          <span v-if="pag.totalRegistros.value" class="text-slate-600">· {{ pag.totalRegistros.value }} total</span>
          <span v-if="totalDestacados" class="text-amber-500/80"> · {{ totalDestacados }} destacados</span>
        </p>
      </div>
      <AppBoton variante="primario" @click="abrirCrear">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo proyecto
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
          placeholder="Buscar proyectos..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
        />
      </div>
      <select
        v-if="tecnologias.length"
        v-model="filtros.tecnologia"
        class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none"
      >
        <option value="">Todas las tecnologías</option>
        <option v-for="t in tecnologias" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filtros.destacado" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none">
        <option value="">Todos</option>
        <option value="true">Solo destacados</option>
        <option value="false">No destacados</option>
      </select>
    </div>

    <div v-if="cargando" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="h-64 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <div v-else-if="!proyectos.length" class="py-20 text-center bg-[#13151f] border border-white/5 rounded-2xl">
      <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      <p class="text-white font-medium">No hay proyectos</p>
      <p class="text-slate-500 text-sm mt-1">Crea tu primer proyecto para mostrarlo en el portafolio</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="p in proyectos"
        :key="p.id"
        class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group flex flex-col"
      >
        <div class="h-44 bg-linear-to-br from-violet-500/10 to-indigo-500/10 relative overflow-hidden shrink-0">
          <img v-if="p.imagenUrl" :src="p.imagenUrl" :alt="p.titulo" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="absolute inset-0 bg-linear-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end gap-2 p-3">
            <a
              v-if="p.urlEnVivo"
              :href="p.urlEnVivo"
              target="_blank"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition-all"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver en vivo
            </a>
            <a
              v-if="p.urlGithub"
              :href="p.urlGithub"
              target="_blank"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition-all"
            >
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
          <div class="absolute top-3 left-3 flex gap-2">
            <button
              class="p-1.5 rounded-lg backdrop-blur-sm transition-all"
              :class="p.destacado
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-black/30 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-400'"
              :title="p.destacado ? 'Quitar de destacados' : 'Marcar como destacado'"
              @click="toggleDestacado(p)"
            >
              <svg class="w-4 h-4" :fill="p.destacado ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
          <div v-if="p.imagenUrl" class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="p-1.5 rounded-lg bg-red-500/20 backdrop-blur-sm text-red-400 hover:bg-red-500/30 transition-all"
              title="Eliminar imagen"
              @click.stop="eliminarImagenExistente(p)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="p-5 flex flex-col flex-1">
          <div class="flex items-start justify-between gap-2 mb-1">
            <h3 class="font-semibold text-white text-sm truncate">{{ p.titulo }}</h3>
            <AppInsignia v-if="p.destacado" variante="violeta">★</AppInsignia>
          </div>
          <p class="text-xs text-slate-500 line-clamp-2 flex-1">{{ p.descripcion }}</p>
          <div v-if="p.stackTecnico.length" class="flex flex-wrap gap-1.5 mt-3">
            <span
              v-for="tech in p.stackTecnico.slice(0, 4)"
              :key="tech"
              class="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-xs text-slate-400"
            >
              {{ tech }}
            </span>
            <span v-if="p.stackTecnico.length > 4" class="text-xs text-slate-600 self-center">
              +{{ p.stackTecnico.length - 4 }}
            </span>
          </div>
          <div class="flex items-center gap-1 mt-4 pt-4 border-t border-white/5">
            <button
              class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="Editar"
              @click="abrirEditar(p)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <span v-if="p.servicio" class="text-xs text-slate-600 truncate ml-1 flex-1">{{ p.servicio.nombre }}</span>
            <span v-else class="flex-1" />
            <button
              class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Eliminar"
              @click="eliminar(p)"
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
      :titulo="editando ? `Editar · ${editando.titulo}` : 'Nuevo proyecto'"
      tamano="lg"
      @cerrar="modalForm = false"
    >
      <div class="space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Título <span class="text-red-400">*</span>
            </label>
            <input
              v-model="formulario.titulo"
              type="text"
              placeholder="Mi proyecto web"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
              @blur="!editando && !formulario.slug && generarSlug()"
            />
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Slug <span class="text-red-400">*</span>
            </label>
            <div class="flex gap-2">
              <input
                v-model="formulario.slug"
                type="text"
                placeholder="mi-proyecto-web"
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

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Descripción <span class="text-red-400">*</span>
            </label>
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-40"
              :disabled="cargandoIA"
              @click="generarDescripcionIA"
            >
              <svg class="w-3.5 h-3.5" :class="cargandoIA ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {{ cargandoIA ? 'Generando...' : 'Generar con IA' }}
            </button>
          </div>
          <textarea
            v-model="formulario.descripcion"
            rows="4"
            placeholder="Descripción del proyecto..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none resize-none transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tecnologías</label>
            <input
              v-model="stackTexto"
              type="text"
              placeholder="Vue 3, Node.js, PostgreSQL"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
            />
            <p class="text-xs text-slate-600">Separadas por coma</p>
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Servicio relacionado</label>
            <select
              v-model="formulario.servicioId"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-slate-300 text-sm outline-none transition-all"
            >
              <option :value="null">Sin servicio</option>
              <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">URL en vivo</label>
            <input
              v-model="formulario.urlEnVivo"
              type="url"
              placeholder="https://miproyecto.com"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
            />
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">URL GitHub</label>
            <input
              v-model="formulario.urlGithub"
              type="url"
              placeholder="https://github.com/..."
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 items-start">
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Imagen del proyecto</label>
            <div v-if="previewImg" class="relative w-full h-28 rounded-xl overflow-hidden border border-white/10">
              <img :src="previewImg" alt="preview" class="w-full h-full object-cover" />
              <button
                type="button"
                class="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-all"
                @click="archivoImg = null; previewImg = null; formulario.imagenUrl = null"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/5 file:text-slate-300 hover:file:bg-white/10 transition-all cursor-pointer"
              @change="manejarArchivoImg"
            />
            <p class="text-xs text-slate-600">JPG, PNG o WEBP · máx. 5 MB</p>
          </div>

          <div class="space-y-2 pt-6">
            <label class="flex items-center gap-3 cursor-pointer select-none">
              <div class="relative">
                <input type="checkbox" v-model="formulario.destacado" class="sr-only" />
                <div
                  class="w-10 h-5 rounded-full transition-colors"
                  :class="formulario.destacado ? 'bg-violet-600' : 'bg-white/10'"
                />
                <div
                  class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  :class="formulario.destacado ? 'translate-x-5' : ''"
                />
              </div>
              <div>
                <p class="text-sm text-slate-300 font-medium">Proyecto destacado</p>
                <p class="text-xs text-slate-500">Aparece primero en el portafolio</p>
              </div>
            </label>
          </div>
        </div>

      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalForm = false">Cancelar</AppBoton>
        <AppBoton variante="primario" :cargando="guardando" @click="guardar">
          {{ editando ? 'Guardar cambios' : 'Crear proyecto' }}
        </AppBoton>
      </template>
    </AppModal>

  </div>
</template>