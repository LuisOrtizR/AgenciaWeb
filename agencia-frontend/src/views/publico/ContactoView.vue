<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { prospectosServicio, testimoniosServicio } from '@/services/servicios'
import type { TipoServicio, Testimonio } from '@/types'

const uiStore               = useUiStore()
const enviado               = ref(false)
const enviando              = ref(false)
const testimoniosDestacados = ref<Testimonio[]>([])

onMounted(async () => {
  try {
    const { data } = await testimoniosServicio.destacados(3)
    testimoniosDestacados.value = data.datos
  } catch {}
})

const formulario = reactive({
  nombre:       '',
  correo:       '',
  telefono:     '',
  tipoServicio: '' as TipoServicio | '',
  mensaje:      '',
  presupuesto:  null as number | null,
  fuente:       'Sitio web',
  sitioWeb:     '',
})

const errores = reactive({
  nombre:       '',
  correo:       '',
  tipoServicio: '',
  mensaje:      '',
})

const TIPOS_SERVICIO: { valor: TipoServicio; etiqueta: string; icono: string }[] = [
  { valor: 'LANDING',       etiqueta: 'Landing Page',      icono: '⚡' },
  { valor: 'CORPORATIVO',   etiqueta: 'Sitio Corporativo', icono: '🏢' },
  { valor: 'ECOMMERCE',     etiqueta: 'Tienda Online',     icono: '🛒' },
  { valor: 'SAAS',          etiqueta: 'App SaaS',          icono: '🚀' },
  { valor: 'MANTENIMIENTO', etiqueta: 'Mantenimiento',     icono: '🔧' },
]

const validar = (): boolean => {
  let ok = true
  errores.nombre = errores.correo = errores.tipoServicio = errores.mensaje = ''
  if (!formulario.nombre.trim()) { errores.nombre = 'Requerido'; ok = false }
  if (!formulario.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo)) { errores.correo = 'Correo inválido'; ok = false }
  if (!formulario.tipoServicio) { errores.tipoServicio = 'Selecciona un servicio'; ok = false }
  if (!formulario.mensaje.trim() || formulario.mensaje.trim().length < 20) { errores.mensaje = 'Mínimo 20 caracteres'; ok = false }
  return ok
}

const enviar = async () => {
  if (formulario.sitioWeb) return
  if (!validar()) return
  enviando.value = true
  try {
    await prospectosServicio.crear({
      nombre:       formulario.nombre.trim(),
      correo:       formulario.correo.trim().toLowerCase(),
      telefono:     formulario.telefono || null,
      tipoServicio: formulario.tipoServicio as TipoServicio,
      mensaje:      formulario.mensaje.trim(),
      presupuesto:  formulario.presupuesto,
      fuente:       formulario.fuente,
    })
    enviado.value = true
  } catch {
    uiStore.error('Error al enviar', 'Ocurrió un problema. Intenta de nuevo o escríbenos directamente.')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f]">

    <div class="relative overflow-hidden pt-32 pb-16 px-6">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-[120px]" />
        <div class="absolute top-20 right-1/4 w-72 h-72 bg-indigo-600/6 rounded-full blur-[100px]" />
      </div>

      <div class="relative max-w-6xl mx-auto">

        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span class="text-violet-300 text-xs font-semibold tracking-widest uppercase">Hablemos</span>
          </div>
          <h1 class="text-5xl sm:text-6xl font-black text-white mb-5 leading-tight">
            Cotiza tu
            <span class="bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"> proyecto</span>
          </h1>
          <p class="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
            Cuéntanos tu idea y te respondemos en menos de 24 horas con una propuesta personalizada.
          </p>
        </div>

        <Transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
        >
          <div v-if="enviado" class="max-w-md mx-auto text-center py-20">
            <div class="relative w-24 h-24 mx-auto mb-8">
              <div class="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
              <div class="relative w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <svg class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 class="text-3xl font-bold text-white mb-3">¡Solicitud recibida!</h2>
            <p class="text-gray-400 leading-relaxed mb-8">
              Revisaremos tu proyecto y te responderemos a
              <span class="text-white font-medium">{{ formulario.correo }}</span>
              en menos de 24 horas.
            </p>
            <RouterLink
              :to="{ name: 'proyectos' }"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
            >
              Ver nuestro portafolio →
            </RouterLink>
          </div>
        </Transition>

        <div v-if="!enviado" class="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div class="lg:col-span-4 space-y-4">

            <div class="p-6 rounded-2xl bg-white/3 border border-white/6">
              <div class="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="text-white font-semibold mb-4 text-sm">¿Por qué elegirnos?</h3>
              <ul class="space-y-2.5">
                <li
                  v-for="p in ['Respuesta en menos de 24 horas', 'Propuesta sin compromiso', 'Tecnología moderna y escalable', 'Soporte post-lanzamiento', 'Precio justo y transparente']"
                  :key="p"
                  class="flex items-center gap-2.5 text-sm text-gray-400"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  {{ p }}
                </li>
              </ul>
            </div>

            <div class="p-6 rounded-2xl bg-linear-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/15">
              <p class="text-white font-semibold text-sm mb-1">¿Prefieres escribirnos?</p>
              <p class="text-gray-500 text-xs mb-3">Contáctanos directamente:</p>
              <a href="mailto:hola@nexova.studio" class="text-violet-300 hover:text-violet-200 transition-colors text-sm font-medium">
                creatoraiweb@gmail.com
              </a>
            </div>

            <div v-if="testimoniosDestacados.length" class="space-y-3">
              <p class="text-xs text-gray-600 font-medium uppercase tracking-widest px-1">Lo que dicen clientes</p>
              <div
                v-for="t in testimoniosDestacados"
                :key="t.id"
                class="p-4 rounded-xl bg-white/3 border border-white/5"
              >
                <div class="flex items-center gap-0.5 mb-2">
                  <span v-for="n in 5" :key="n" class="text-xs" :class="n <= t.calificacion ? 'text-yellow-400' : 'text-white/10'">★</span>
                </div>
                <p class="text-xs text-gray-400 leading-relaxed line-clamp-2">"{{ t.contenido }}"</p>
                <p class="text-xs text-gray-600 mt-2 font-medium">— {{ t.nombreCliente }}</p>
              </div>
            </div>
          </div>

          <div class="lg:col-span-8">
            <form
              class="bg-[#111118] border border-white/6 rounded-2xl p-7 space-y-6"
              novalidate
              @submit.prevent="enviar"
            >
              <input v-model="formulario.sitioWeb" type="text" name="sitioWeb" class="hidden" tabindex="-1" autocomplete="off" />

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Nombre <span class="text-red-400">*</span></label>
                  <input
                    v-model="formulario.nombre"
                    type="text"
                    placeholder="Tu nombre completo"
                    class="w-full px-4 py-3 rounded-xl bg-white/4 border text-white placeholder-gray-600 text-sm outline-none transition-all"
                    :class="errores.nombre ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/8 focus:border-violet-500/50'"
                    @input="errores.nombre = ''"
                  />
                  <p v-if="errores.nombre" class="text-xs text-red-400">{{ errores.nombre }}</p>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Correo <span class="text-red-400">*</span></label>
                  <input
                    v-model="formulario.correo"
                    type="email"
                    placeholder="tu@correo.com"
                    class="w-full px-4 py-3 rounded-xl bg-white/4 border text-white placeholder-gray-600 text-sm outline-none transition-all"
                    :class="errores.correo ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/8 focus:border-violet-500/50'"
                    @input="errores.correo = ''"
                  />
                  <p v-if="errores.correo" class="text-xs text-red-400">{{ errores.correo }}</p>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Teléfono <span class="text-gray-600 normal-case font-normal">(opcional)</span></label>
                <input
                  v-model="formulario.telefono"
                  type="tel"
                  placeholder="+57 300 000 0000"
                  class="w-full px-4 py-3 rounded-xl bg-white/4 border border-white/8 focus:border-violet-500/50 text-white placeholder-gray-600 text-sm outline-none transition-all"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide">¿Qué necesitas? <span class="text-red-400">*</span></label>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label
                    v-for="tipo in TIPOS_SERVICIO"
                    :key="tipo.valor"
                    class="flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer transition-all select-none"
                    :class="formulario.tipoServicio === tipo.valor
                      ? 'border-violet-500/50 bg-violet-500/10 text-white'
                      : 'border-white/6 bg-white/3 text-gray-400 hover:border-white/12 hover:text-gray-300'"
                  >
                    <input type="radio" v-model="formulario.tipoServicio" :value="tipo.valor" class="sr-only" />
                    <span class="text-base leading-none">{{ tipo.icono }}</span>
                    <span class="text-sm font-medium">{{ tipo.etiqueta }}</span>
                  </label>
                </div>
                <p v-if="errores.tipoServicio" class="text-xs text-red-400">{{ errores.tipoServicio }}</p>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Presupuesto <span class="text-gray-600 normal-case font-normal">(opcional)</span>
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none font-medium">$</span>
                  <input
                    v-model.number="formulario.presupuesto"
                    type="number"
                    min="0"
                    step="100000"
                    placeholder="3.500.000"
                    class="w-full pl-8 pr-14 py-3 rounded-xl bg-white/4 border border-white/8 focus:border-violet-500/50 text-white placeholder-gray-600 text-sm outline-none transition-all"
                  />
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none">COP</span>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Tu proyecto <span class="text-red-400">*</span></label>
                <textarea
                  v-model="formulario.mensaje"
                  rows="4"
                  placeholder="Describe tu idea: funcionalidades, referentes de diseño, fecha límite..."
                  class="w-full px-4 py-3 rounded-xl bg-white/4 border text-white placeholder-gray-600 text-sm outline-none transition-all resize-none leading-relaxed"
                  :class="errores.mensaje ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/8 focus:border-violet-500/50'"
                  @input="errores.mensaje = ''"
                />
                <div class="flex justify-between items-center">
                  <p v-if="errores.mensaje" class="text-xs text-red-400">{{ errores.mensaje }}</p>
                  <span class="text-xs text-gray-600 ml-auto" :class="formulario.mensaje.length > 450 ? 'text-yellow-400' : ''">
                    {{ formulario.mensaje.length }}/500
                  </span>
                </div>
              </div>

              <button
                type="submit"
                :disabled="enviando"
                class="w-full py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5"
                :class="enviando
                  ? 'bg-violet-600/30 text-white/30 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-500/40'"
              >
                <svg v-if="enviando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {{ enviando ? 'Enviando...' : 'Enviar solicitud de cotización' }}
              </button>

              <p class="text-xs text-gray-600 text-center">
                Sin spam · Respuesta garantizada en 24 horas
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>