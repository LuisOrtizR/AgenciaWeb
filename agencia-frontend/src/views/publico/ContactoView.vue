<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUiStore } from '@/stores/ui'
import { prospectosServicio } from '@/services/servicios'
import type { TipoServicio } from '@/types'

const uiStore  = useUiStore()
const enviado  = ref(false)
const enviando = ref(false)

const formulario = reactive({
  nombre:       '',
  correo:       '',
  telefono:     '',
  tipoServicio: '' as TipoServicio | '',
  mensaje:      '',
  presupuesto:  null as number | null,
  fuente:       'Sitio web',
  sitioWeb:     '', // honeypot
})

const errores = reactive({
  nombre:       '',
  correo:       '',
  tipoServicio: '',
  mensaje:      '',
})

const TIPOS_SERVICIO: { valor: TipoServicio; etiqueta: string; descripcion: string }[] = [
  { valor: 'LANDING',       etiqueta: 'Landing Page',        descripcion: 'Página de aterrizaje para captar clientes' },
  { valor: 'CORPORATIVO',   etiqueta: 'Sitio Corporativo',   descripcion: 'Presencia profesional para tu empresa' },
  { valor: 'ECOMMERCE',     etiqueta: 'Tienda Online',       descripcion: 'Vende tus productos en internet' },
  { valor: 'SAAS',          etiqueta: 'Aplicación SaaS',     descripcion: 'Plataforma web a medida con suscripción' },
  { valor: 'MANTENIMIENTO', etiqueta: 'Mantenimiento',       descripcion: 'Soporte y mejoras a tu sitio actual' },
]

const RANGOS_PRESUPUESTO = [
  { valor: 1500000,  etiqueta: 'Menos de $1,5M COP' },
  { valor: 3000000,  etiqueta: '$1,5M – $3M COP' },
  { valor: 6000000,  etiqueta: '$3M – $6M COP' },
  { valor: 15000000, etiqueta: '$6M – $15M COP' },
  { valor: 30000000, etiqueta: 'Más de $15M COP' },
]

const validar = (): boolean => {
  let valido = true
  errores.nombre       = ''
  errores.correo       = ''
  errores.tipoServicio = ''
  errores.mensaje      = ''

  if (!formulario.nombre.trim()) {
    errores.nombre = 'Tu nombre es requerido'
    valido = false
  }
  if (!formulario.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo)) {
    errores.correo = 'Ingresa un correo válido'
    valido = false
  }
  if (!formulario.tipoServicio) {
    errores.tipoServicio = 'Selecciona el tipo de servicio que necesitas'
    valido = false
  }
  if (!formulario.mensaje.trim() || formulario.mensaje.trim().length < 20) {
    errores.mensaje = 'Cuéntanos más (mínimo 20 caracteres)'
    valido = false
  }
  return valido
}

const enviar = async () => {
  if (formulario.sitioWeb) return // honeypot
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
    uiStore.error('Error al enviar', 'Ocurrió un problema. Por favor intenta de nuevo o escríbenos directamente.')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] pt-24 pb-16">
    <div class="max-w-5xl mx-auto px-6">

      <!-- Encabezado -->
      <div class="text-center mb-14">
        <p class="text-violeta-claro text-sm font-semibold uppercase tracking-widest mb-3">Hablemos</p>
        <h1 class="text-5xl font-black text-white mb-4">Cotiza tu proyecto</h1>
        <p class="text-gris-medio text-lg max-w-xl mx-auto">
          Cuéntanos tu idea y te respondemos en menos de 24 horas con una propuesta personalizada.
        </p>
      </div>

      <!-- Estado: enviado ✓ -->
      <Transition name="enviado">
        <div v-if="enviado" class="max-w-lg mx-auto text-center py-16">
          <div class="w-20 h-20 rounded-full bg-verde/10 border border-verde/20 flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white mb-3">¡Mensaje recibido!</h2>
          <p class="text-gris-medio mb-8">
            Gracias por contactarnos. Revisaremos tu solicitud y te responderemos
            a <strong class="text-white">{{ formulario.correo }}</strong> en menos de 24 horas.
          </p>
          <RouterLink :to="{ name: 'proyectos' }"
            class="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-blanco-suave hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
            Mientras tanto, mira nuestro portafolio →
          </RouterLink>
        </div>
      </Transition>

      <!-- Formulario -->
      <div v-if="!enviado" class="grid grid-cols-1 lg:grid-cols-5 gap-8">

        <!-- Col izquierda: info de contacto -->
        <div class="lg:col-span-2 space-y-6">
          <div class="p-6 rounded-2xl bg-white/3 border border-white/5">
            <h3 class="text-white font-semibold mb-4">¿Por qué elegirnos?</h3>
            <ul class="space-y-3 text-sm">
              <li v-for="punto in [
                'Respuesta en menos de 24 horas',
                'Propuesta sin compromiso',
                'Tecnología moderna y escalable',
                'Soporte post-lanzamiento incluido',
                'Precio justo y transparente',
              ]" :key="punto" class="flex items-center gap-2.5 text-blanco-suave">
                <svg class="w-4 h-4 text-verde shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ punto }}
              </li>
            </ul>
          </div>

          <div class="p-6 rounded-2xl bg-violeta/5 border border-violeta/15">
            <h3 class="text-white font-semibold mb-2">¿Prefieres escribirnos?</h3>
            <p class="text-gris-medio text-sm mb-3">También puedes contactarnos directamente:</p>
            <a href="mailto:hola@nexova.studio" class="text-violeta-claro hover:text-violeta transition-colors text-sm font-medium">
              hola@nexova.studio
            </a>
          </div>
        </div>

        <!-- Col derecha: formulario -->
        <form class="lg:col-span-3 space-y-5 bg-[#13151f] border border-white/5 rounded-2xl p-6 md:p-8" @submit.prevent="enviar" novalidate>
          <!-- Honeypot oculto -->
          <input v-model="formulario.sitioWeb" type="text" name="sitioWeb" class="hidden" tabindex="-1" autocomplete="off" />

          <!-- Nombre + correo -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-blanco-suave">Nombre <span class="text-rojo">*</span></label>
              <input v-model="formulario.nombre" type="text" placeholder="Tu nombre completo"
                class="w-full px-4 py-2.5 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-all"
                :class="errores.nombre ? 'border-rojo/40 focus:border-rojo' : 'border-white/10 focus:border-violeta/50'"
                @input="errores.nombre = ''" />
              <p v-if="errores.nombre" class="text-xs text-rojo">{{ errores.nombre }}</p>
            </div>
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-blanco-suave">Correo <span class="text-rojo">*</span></label>
              <input v-model="formulario.correo" type="email" placeholder="tu@correo.com"
                class="w-full px-4 py-2.5 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-all"
                :class="errores.correo ? 'border-rojo/40 focus:border-rojo' : 'border-white/10 focus:border-violeta/50'"
                @input="errores.correo = ''" />
              <p v-if="errores.correo" class="text-xs text-rojo">{{ errores.correo }}</p>
            </div>
          </div>

          <!-- Teléfono -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Teléfono (opcional)</label>
            <input v-model="formulario.telefono" type="tel" placeholder="+57 300 000 0000"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none transition-all" />
          </div>

          <!-- Tipo de servicio -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-blanco-suave">¿Qué necesitas? <span class="text-rojo">*</span></label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                v-for="tipo in TIPOS_SERVICIO"
                :key="tipo.valor"
                class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                :class="formulario.tipoServicio === tipo.valor
                  ? 'border-violeta/50 bg-violeta/10'
                  : 'border-white/5 bg-white/3 hover:border-white/10'"
              >
                <input type="radio" v-model="formulario.tipoServicio" :value="tipo.valor" class="sr-only" />
                <div class="w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 transition-all"
                  :class="formulario.tipoServicio === tipo.valor ? 'border-violeta bg-violeta' : 'border-gris-medio'" />
                <div>
                  <p class="text-sm font-medium" :class="formulario.tipoServicio === tipo.valor ? 'text-white' : 'text-blanco-suave'">{{ tipo.etiqueta }}</p>
                  <p class="text-xs text-gris-medio">{{ tipo.descripcion }}</p>
                </div>
              </label>
            </div>
            <p v-if="errores.tipoServicio" class="text-xs text-rojo">{{ errores.tipoServicio }}</p>
          </div>

          <!-- Presupuesto -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Presupuesto aproximado</label>
            <select v-model="formulario.presupuesto"
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-blanco-suave text-sm outline-none transition-all">
              <option :value="null">Prefiero no especificar</option>
              <option v-for="r in RANGOS_PRESUPUESTO" :key="r.valor" :value="r.valor">{{ r.etiqueta }}</option>
            </select>
          </div>

          <!-- Mensaje -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Cuéntanos tu proyecto <span class="text-rojo">*</span></label>
            <textarea v-model="formulario.mensaje" rows="4"
              placeholder="Describe brevemente tu idea, qué funcionalidades necesitas, si tienes referentes de diseño, fecha límite..."
              class="w-full px-4 py-2.5 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-all resize-none"
              :class="errores.mensaje ? 'border-rojo/40 focus:border-rojo' : 'border-white/10 focus:border-violeta/50'"
              @input="errores.mensaje = ''" />
            <p v-if="errores.mensaje" class="text-xs text-rojo">{{ errores.mensaje }}</p>
          </div>

          <!-- Botón enviar -->
          <button
            type="submit"
            :disabled="enviando"
            class="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            :class="enviando ? 'bg-violeta/50 text-white/50 cursor-not-allowed' : 'bg-violeta hover:bg-violeta/90 text-white shadow-lg shadow-violeta/20 hover:shadow-violeta/40'"
          >
            <svg v-if="enviando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ enviando ? 'Enviando...' : 'Enviar solicitud de cotización' }}
          </button>

          <p class="text-xs text-gris-medio text-center">
            Al enviar aceptas que te contactemos sobre tu proyecto. Sin spam, lo prometemos.
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.enviado-enter-active { transition: all 0.4s ease; }
.enviado-enter-from   { opacity: 0; transform: translateY(16px); }
</style>