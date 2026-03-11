<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUiStore }          from '@/stores/ui'
import { useAuthStore }        from '@/stores/auth'
import { testimoniosServicio } from '@/services/servicios'
import type { Testimonio }     from '@/types'
import { extraerMensaje }      from '@/utils/errors'

const uiStore   = useUiStore()
const authStore = useAuthStore()

const testimonios   = ref<Testimonio[]>([])
const cargando      = ref(true)
const enviando      = ref(false)
const enviado       = ref(false)
const estrellaHover = ref(0)

const formulario = reactive({
  nombre:       '',
  empresa:      '',
  texto:        '',
  calificacion: 0,
  sitioWeb:     '',
})

const errores = reactive({
  nombre:       '',
  texto:        '',
  calificacion: '',
})

const ETIQUETAS_CALIFICACION = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!']

const COLORES_AVATAR = [
  'from-violet-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
]

const promedioCalificacion = computed(() => {
  if (!testimonios.value.length) return 0
  return testimonios.value.reduce((a, t) => a + t.calificacion, 0) / testimonios.value.length
})

const colorAvatar = (nombre: string) =>
  COLORES_AVATAR[nombre.charCodeAt(0) % COLORES_AVATAR.length]

const iniciales = (nombre: string) =>
  nombre.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')

const formatearFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f))

const validar = (): boolean => {
  errores.nombre = errores.texto = errores.calificacion = ''
  let ok = true
  if (!formulario.nombre.trim() || formulario.nombre.length < 2) {
    errores.nombre = 'Ingresa tu nombre (mínimo 2 caracteres)'; ok = false
  }
  if (!formulario.texto.trim() || formulario.texto.length < 10) {
    errores.texto = 'Mínimo 10 caracteres'; ok = false
  }
  if (!formulario.calificacion) {
    errores.calificacion = 'Selecciona una calificación'; ok = false
  }
  return ok
}

const enviar = async () => {
  if (formulario.sitioWeb) return
  if (!validar()) return
  enviando.value = true
  try {
    const payload: Record<string, unknown> = {
      nombreCliente: formulario.nombre.trim(),
      contenido:     formulario.texto.trim(),
      calificacion:  formulario.calificacion,
    }
    const empresa = formulario.empresa.trim()
    if (empresa) payload.empresa = empresa
    await testimoniosServicio.enviar(payload as any)
    enviado.value = true
    formulario.nombre = formulario.empresa = formulario.texto = ''
    formulario.calificacion = 0
  } catch (err) {
    uiStore.error('Error', extraerMensaje(err))
  } finally {
    enviando.value = false
  }
}

onMounted(async () => {
  if (authStore.usuario?.nombre)  formulario.nombre   = authStore.usuario.nombre

  try {
    const { data } = await testimoniosServicio.listarVisibles({ porPagina: 50 })
    testimonios.value = data.datos
  } catch {} finally {
    cargando.value = false
  }
})
</script>

<template>
  <div class="bg-[#0a0a0f] min-h-screen">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">

      <div class="mb-10">
        <p class="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-2">Testimonios</p>
        <h1 class="text-3xl font-black text-white">Lo que dicen nuestros clientes</h1>
        <div class="flex items-center gap-2 mt-4">
          <div class="flex">
            <span
              v-for="n in 5"
              :key="n"
              class="text-base"
              :class="n <= Math.round(promedioCalificacion) ? 'text-yellow-400' : 'text-white/10'"
            >★</span>
          </div>
          <span class="text-white font-bold text-sm">{{ promedioCalificacion.toFixed(1) }}</span>
          <span class="text-gray-500 text-sm">· {{ testimonios.length }} opiniones</span>
        </div>
      </div>

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        leave-active-class="transition-all duration-200 ease-in"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-if="!enviado" class="mb-12">
          <div class="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
            <div class="px-6 pt-6 pb-4 border-b border-white/5">
              <h2 class="text-base font-semibold text-white">Deja tu opinión</h2>
              <p class="text-gray-500 text-xs mt-0.5">Tu comentario será revisado antes de publicarse</p>
            </div>

            <div class="px-6 py-5 space-y-5">
              <input v-model="formulario.sitioWeb" type="text" class="hidden" tabindex="-1" autocomplete="off" />

              <div
                v-if="authStore.estaAutenticado"
                class="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20"
              >
                <div class="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p class="text-xs text-emerald-300">
                  Publicando como <span class="font-semibold text-white">{{ authStore.usuario?.nombre }}</span>
                  — tu testimonio quedará vinculado a tu cuenta.
                </p>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  Calificación <span class="text-red-400">*</span>
                </label>
                <div class="flex items-center gap-1" @mouseleave="estrellaHover = 0">
                  <button
                    v-for="n in 5"
                    :key="n"
                    type="button"
                    class="text-2xl leading-none transition-transform focus:outline-none hover:scale-125"
                    :class="n <= (estrellaHover || formulario.calificacion) ? 'text-yellow-400' : 'text-white/10'"
                    @click="formulario.calificacion = n"
                    @mouseenter="estrellaHover = n"
                  >★</button>
                  <span v-if="estrellaHover || formulario.calificacion" class="text-xs text-yellow-400 ml-2 font-medium">
                    {{ ETIQUETAS_CALIFICACION[estrellaHover || formulario.calificacion] }}
                  </span>
                </div>
                <p v-if="errores.calificacion" class="text-xs text-red-400">{{ errores.calificacion }}</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    Nombre <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="formulario.nombre"
                    type="text"
                    placeholder="Tu nombre"
                    :readonly="!!authStore.usuario?.nombre"
                    class="w-full px-4 py-2.5 rounded-xl bg-white/4 border text-white placeholder-gray-600 text-sm outline-none transition-all"
                    :class="[
                      errores.nombre ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/8 focus:border-violet-500/50',
                      authStore.usuario?.nombre ? 'opacity-70 cursor-not-allowed' : '',
                    ]"
                    @input="errores.nombre = ''"
                  />
                  <p v-if="authStore.usuario?.nombre" class="text-xs text-violet-400 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Nombre de tu cuenta
                  </p>
                  <p v-else-if="errores.nombre" class="text-xs text-red-400">{{ errores.nombre }}</p>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    Empresa <span class="text-gray-600 normal-case font-normal">(opcional)</span>
                  </label>
                  <input
                    v-model="formulario.empresa"
                    type="text"
                    placeholder="Tu empresa"
                    class="w-full px-4 py-2.5 rounded-xl bg-white/4 border border-white/8 focus:border-violet-500/50 text-white placeholder-gray-600 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  Tu experiencia <span class="text-red-400">*</span>
                </label>
                <textarea
                  v-model="formulario.texto"
                  rows="3"
                  maxlength="1000"
                  placeholder="Cuéntanos cómo fue trabajar con nosotros..."
                  class="w-full px-4 py-3 rounded-xl bg-white/4 border text-white placeholder-gray-600 text-sm outline-none transition-all resize-none leading-relaxed"
                  :class="errores.texto ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/8 focus:border-violet-500/50'"
                  @input="errores.texto = ''"
                />
                <div class="flex justify-between items-center">
                  <p v-if="errores.texto" class="text-xs text-red-400">{{ errores.texto }}</p>
                  <span
                    class="text-xs ml-auto font-mono"
                    :class="formulario.texto.length > 900 ? 'text-yellow-400' : 'text-gray-600'"
                  >{{ formulario.texto.length }}/1000</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-1">
                <p class="text-xs text-gray-600">Se publicará tras revisión del equipo</p>
                <button
                  type="button"
                  :disabled="enviando"
                  class="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  :class="enviando
                    ? 'bg-violet-600/30 text-white/30 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20'"
                  @click="enviar"
                >
                  <svg v-if="enviando" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ enviando ? 'Enviando...' : 'Publicar opinión' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 scale-95"
      >
        <div
          v-if="enviado"
          class="mb-12 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl px-6 py-5 flex items-center gap-4"
        >
          <div class="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-white">¡Gracias por tu opinión!</p>
            <p class="text-xs text-gray-500 mt-0.5">Tu testimonio será revisado y publicado pronto.</p>
          </div>
        </div>
      </Transition>

      <div class="flex items-center gap-3 mb-8">
        <span class="text-sm font-semibold text-white">{{ testimonios.length }} opiniones</span>
        <div class="flex-1 h-px bg-white/5" />
      </div>

      <div v-if="cargando" class="space-y-6">
        <div v-for="i in 5" :key="i" class="flex gap-4">
          <div class="w-9 h-9 rounded-full bg-white/5 animate-pulse shrink-0" />
          <div class="flex-1 space-y-2">
            <div class="h-3 w-32 bg-white/5 rounded animate-pulse" />
            <div class="h-3 w-full bg-white/5 rounded animate-pulse" />
            <div class="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div v-else-if="!testimonios.length" class="py-16 text-center">
        <div class="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p class="text-white font-medium text-sm">Aún no hay opiniones publicadas</p>
        <p class="text-gray-600 text-xs mt-1">¡Sé el primero en dejar la tuya!</p>
      </div>

      <div v-else class="divide-y divide-white/4">
        <div v-for="t in testimonios" :key="t.id" class="py-5 flex gap-4">
          <div
            class="w-9 h-9 rounded-full bg-linear-to-br flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
            :class="colorAvatar(t.nombreCliente)"
          >
            {{ iniciales(t.nombreCliente) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-semibold text-white">{{ t.nombreCliente }}</span>
              <span v-if="t.empresa" class="text-xs text-gray-600">· {{ t.empresa }}</span>
              <span class="text-xs text-gray-600">· {{ formatearFecha(t.creadoEn) }}</span>
            </div>
            <div class="flex items-center gap-0.5 mt-1 mb-2">
              <span v-for="n in 5" :key="n" class="text-xs" :class="n <= t.calificacion ? 'text-yellow-400' : 'text-white/10'">★</span>
            </div>
            <p class="text-sm text-gray-300 leading-relaxed">{{ t.contenido }}</p>
            <div
              v-if="t.proyecto"
              class="mt-2 inline-flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/8 border border-violet-500/15 rounded-lg px-2.5 py-1"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {{ t.proyecto.titulo }}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>