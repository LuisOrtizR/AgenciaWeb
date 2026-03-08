<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { proyectosServicio, serviciosServicio, iaServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppInput      from '@/components/ui/AppInput.vue'
import AppModal      from '@/components/ui/AppModal.vue'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import type { Proyecto, Servicio, DatosCrearProyecto } from '@/types'

const uiStore = useUiStore()
const pag     = usePaginacion(10)

const proyectos    = ref<Proyecto[]>([])
const servicios    = ref<Servicio[]>([])
const cargando     = ref(true)
const cargandoIA   = ref(false)
const guardando    = ref(false)
const modalForm    = ref(false)
const editando     = ref<Proyecto | null>(null)
const archivoImg   = ref<File | null>(null)

const busqueda = ref('')

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

// ─── Carga ───────────────────────────────────────────────────────────────────

const cargar = async () => {
  cargando.value = true
  try {
    const params: Record<string, unknown> = {
      pagina: pag.paginaActual.value,
      porPagina: pag.porPagina.value,
    }
    if (busqueda.value) params.busqueda = busqueda.value
    const [rP, rS] = await Promise.all([
      proyectosServicio.listar(params as any),
      serviciosServicio.listar({ porPagina: 50 }),
    ])
    proyectos.value = rP.data.datos
    servicios.value = rS.data.datos
    pag.actualizarPaginacion(rP.data.paginacion)
  } catch {
    uiStore.error('Error', 'No se pudieron cargar los proyectos')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
watch([busqueda, () => pag.paginaActual.value], () => {
  if (pag.paginaActual.value !== 1) pag.reiniciar()
  else cargar()
})

// ─── Formulario ───────────────────────────────────────────────────────────────

const resetFormulario = () => {
  Object.assign(formulario, {
    titulo: '', slug: '', descripcion: '', stackTecnico: [],
    imagenUrl: null, urlEnVivo: null, urlGithub: null, destacado: false, servicioId: null,
  })
  stackTexto.value = ''
  archivoImg.value = null
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
  formulario.stackTecnico = stackTexto.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
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

    // Subir imagen si se seleccionó
    if (archivoImg.value) {
      await proyectosServicio.subirImagen(proyecto.id, archivoImg.value)
    }

    uiStore.exito(editando.value ? 'Proyecto actualizado' : 'Proyecto creado')
    modalForm.value = false
    resetFormulario()
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo guardar el proyecto')
  } finally {
    guardando.value = false
  }
}

// ─── Acciones ─────────────────────────────────────────────────────────────────

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
  if (!confirm(`¿Eliminar el proyecto "${p.titulo}"?`)) return
  try {
    await proyectosServicio.eliminar(p.id)
    uiStore.exito('Proyecto eliminado')
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo eliminar')
  }
}

const generarDescripcionIA = async () => {
  if (!formulario.titulo || !formulario.stackTecnico.length) {
    uiStore.advertencia('Faltan datos', 'Ingresa título y tecnologías primero')
    return
  }
  procesarStack()
  cargandoIA.value = true
  try {
    const { data } = await iaServicio.generarDescripcion({
      titulo:       formulario.titulo,
      stackTecnico: formulario.stackTecnico,
      tipoServicio: servicios.value.find(s => s.id === formulario.servicioId)?.nombre ?? 'Web',
      urlEnVivo:    formulario.urlEnVivo ?? undefined,
    })
    formulario.descripcion = data.datos.descripciones.larga
    uiStore.exito('¡Descripción generada con IA!')
  } catch {
    uiStore.error('Error de IA', 'No se pudo generar la descripción')
  } finally {
    cargandoIA.value = false
  }
}

const manejarArchivoImg = (e: Event) => {
  const target = e.target as HTMLInputElement
  archivoImg.value = target.files?.[0] ?? null
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">

    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Proyectos</h1>
        <p class="text-gris-medio text-sm mt-1">Portafolio de trabajos realizados</p>
      </div>
      <AppBoton variante="primario" @click="abrirCrear">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Nuevo proyecto
      </AppBoton>
    </div>

    <!-- Búsqueda -->
    <div class="relative max-w-sm">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gris-medio pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input v-model="busqueda" type="search" placeholder="Buscar proyectos..."
        class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none transition-all" />
    </div>

    <!-- Grid de proyectos -->
    <div v-if="cargando" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="i" class="h-56 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <div v-else-if="!proyectos.length" class="py-20 text-center bg-[#13151f] border border-white/5 rounded-2xl">
      <p class="text-white font-medium">No hay proyectos</p>
      <p class="text-gris-medio text-sm mt-1">Crea tu primer proyecto para mostrarlo en el portafolio</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="p in proyectos"
        :key="p.id"
        class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group"
      >
        <!-- Imagen / placeholder -->
        <div class="h-40 bg-linear-to-br from-violeta/10 to-indigo-500/10 relative overflow-hidden">
          <img v-if="p.imagenUrl" :src="p.imagenUrl" :alt="p.titulo" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="w-10 h-10 text-gris-medio/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <!-- Badge destacado -->
          <div v-if="p.destacado" class="absolute top-3 right-3">
            <AppInsignia variante="violeta" punto>Destacado</AppInsignia>
          </div>
        </div>

        <!-- Info -->
        <div class="p-5">
          <h3 class="font-semibold text-white text-sm truncate">{{ p.titulo }}</h3>
          <p class="text-xs text-gris-medio mt-1 line-clamp-2">{{ p.descripcion }}</p>

          <!-- Stack -->
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span
              v-for="tech in p.stackTecnico.slice(0, 4)"
              :key="tech"
              class="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-xs text-gris-medio"
            >{{ tech }}</span>
            <span v-if="p.stackTecnico.length > 4" class="text-xs text-gris-medio">+{{ p.stackTecnico.length - 4 }}</span>
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
            <button class="p-1.5 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all" title="Editar" @click="abrirEditar(p)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button
              class="p-1.5 rounded-lg transition-all"
              :class="p.destacado ? 'text-amarillo hover:bg-amarillo/10' : 'text-gris-medio hover:text-amarillo hover:bg-amarillo/10'"
              title="Toggle destacado"
              @click="toggleDestacado(p)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </button>
            <a v-if="p.urlEnVivo" :href="p.urlEnVivo" target="_blank" class="p-1.5 rounded-lg text-gris-medio hover:text-verde hover:bg-verde/10 transition-all" title="Ver en vivo">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
            <button class="p-1.5 rounded-lg text-gris-medio hover:text-rojo hover:bg-rojo/10 transition-all ml-auto" title="Eliminar" @click="eliminar(p)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pag.totalPaginas.value > 1" class="bg-[#13151f] border border-white/5 rounded-2xl px-6 py-4">
      <AppPaginacion :pagina-actual="pag.paginaActual.value" :total-paginas="pag.totalPaginas.value"
        :total-registros="pag.totalRegistros.value" :por-pagina="pag.porPagina.value" @cambiar="pag.irAPagina" />
    </div>

    <!-- Modal crear/editar -->
    <AppModal :abierto="modalForm" :titulo="editando ? 'Editar proyecto' : 'Nuevo proyecto'" tamano="lg" @cerrar="modalForm = false">
      <div class="space-y-5">
        <!-- Título + slug -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Título <span class="text-rojo">*</span></label>
            <input v-model="formulario.titulo" type="text" placeholder="Mi proyecto web"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none"
              @blur="!editando && !formulario.slug && generarSlug()" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Slug <span class="text-rojo">*</span></label>
            <div class="flex gap-2">
              <input v-model="formulario.slug" type="text" placeholder="mi-proyecto-web"
                class="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none" />
              <button type="button" class="px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gris-medio hover:text-white transition-all" @click="generarSlug">Auto</button>
            </div>
          </div>
        </div>

        <!-- Descripción + botón IA -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-blanco-suave">Descripción <span class="text-rojo">*</span></label>
            <button type="button"
              class="flex items-center gap-1.5 text-xs text-violeta-claro hover:text-violeta transition-colors"
              :disabled="cargandoIA"
              @click="generarDescripcionIA"
            >
              <svg class="w-3.5 h-3.5" :class="cargandoIA ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {{ cargandoIA ? 'Generando...' : 'Generar con IA' }}
            </button>
          </div>
          <textarea v-model="formulario.descripcion" rows="4" placeholder="Descripción del proyecto..."
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none resize-none" />
        </div>

        <!-- Stack + Servicio -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Tecnologías (separadas por coma)</label>
            <input v-model="stackTexto" type="text" placeholder="Vue 3, Node.js, PostgreSQL"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Servicio relacionado</label>
            <select v-model="formulario.servicioId"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-blanco-suave text-sm outline-none">
              <option :value="null">Sin servicio</option>
              <option v-for="s in servicios" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
        </div>

        <!-- URLs -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">URL en vivo</label>
            <input v-model="formulario.urlEnVivo" type="url" placeholder="https://miproyecto.com"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">URL GitHub</label>
            <input v-model="formulario.urlGithub" type="url" placeholder="https://github.com/..."
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none" />
          </div>
        </div>

        <!-- Imagen + destacado -->
        <div class="grid grid-cols-2 gap-4 items-end">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Imagen del proyecto</label>
            <input type="file" accept="image/*" class="w-full text-sm text-gris-medio file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/5 file:text-blanco-suave hover:file:bg-white/10 transition-all" @change="manejarArchivoImg" />
          </div>
          <label class="flex items-center gap-3 cursor-pointer pb-2.5">
            <div class="relative">
              <input type="checkbox" v-model="formulario.destacado" class="sr-only" />
              <div class="w-10 h-5 rounded-full transition-colors" :class="formulario.destacado ? 'bg-violeta' : 'bg-white/10'" />
              <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" :class="formulario.destacado ? 'translate-x-5' : ''" />
            </div>
            <span class="text-sm text-blanco-suave">Proyecto destacado</span>
          </label>
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