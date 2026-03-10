<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute }          from 'vue-router'
import { useUiStore }        from '@/stores/ui'
import { useAuthStore }      from '@/stores/auth'
import { prospectosServicio, testimoniosServicio } from '@/services/servicios'
import type { TipoServicio, Testimonio } from '@/types'

const route     = useRoute()
const uiStore   = useUiStore()
const authStore = useAuthStore()

const enviado               = ref(false)
const enviando              = ref(false)
const testimoniosDestacados = ref<Testimonio[]>([])

// ──────────────────────────────────────────────────────────────────────────────
// onMounted: pre-rellenar formulario
//
// Prioridad de pre-llenado:
//  1. Datos del usuario autenticado (nombre, correo)
//  2. ?tipoServicio= en la URL (viene desde ServicioDetalleView)
//  3. ?servicio= en la URL (nombre del servicio, solo informativo)
// ──────────────────────────────────────────────────────────────────────────────
onMounted(async () => {
  // 1. Pre-llenar datos personales si está logueado
  if (authStore.usuario?.nombre) formulario.nombre = authStore.usuario.nombre
  if (authStore.usuario?.correo) formulario.correo = authStore.usuario.correo

  // 2. Pre-seleccionar tipo de servicio desde query param
  //    ServicioDetalleView envía: ?tipoServicio=LANDING&servicio=Landing+Page
  const tipoDesdeUrl = route.query.tipoServicio as TipoServicio | undefined
  if (tipoDesdeUrl && TIPOS_SERVICIO.some(t => t.valor === tipoDesdeUrl)) {
    formulario.tipoServicio = tipoDesdeUrl
  }

  // 3. Cargar testimonios del sidebar
  try {
    const { data } = await testimoniosServicio.destacados(3)
    testimoniosDestacados.value = data.datos
  } catch { /* silencioso */ }
})

// ──────────────────────────────────────────────────────────────────────────────
// Nombre del servicio seleccionado desde URL (informativo en el encabezado)
// ──────────────────────────────────────────────────────────────────────────────
const nombreServicioDesdeUrl = computed(() =>
  route.query.servicio ? String(route.query.servicio) : null
)

const formulario = reactive({
  nombre:       '',
  correo:       '',
  telefono:     '',
  tipoServicio: '' as TipoServicio | '',
  mensaje:      '',
  presupuesto:  null as number | null,
  fuente:       'Sitio web',
  // honeypot anti-bot — NUNCA mostrar al usuario, debe quedar vacío
  sitioWeb:     '',
})

const errores = reactive({
  nombre:       '',
  correo:       '',
  tipoServicio: '',
  mensaje:      '',
})

const TIPOS_SERVICIO: { valor: TipoServicio; etiqueta: string; icono: string; descripcion: string }[] = [
  { valor: 'LANDING',       etiqueta: 'Landing Page',      icono: '⚡', descripcion: 'Página de aterrizaje de alto impacto' },
  { valor: 'CORPORATIVO',   etiqueta: 'Sitio Corporativo', icono: '🏢', descripcion: 'Presencia profesional completa'         },
  { valor: 'ECOMMERCE',     etiqueta: 'Tienda Online',     icono: '🛒', descripcion: 'Vende tus productos en internet'        },
  { valor: 'SAAS',          etiqueta: 'App SaaS',          icono: '🚀', descripcion: 'Plataforma web escalable'               },
  { valor: 'MANTENIMIENTO', etiqueta: 'Mantenimiento',     icono: '🔧', descripcion: 'Soporte y mejoras continuas'            },
]

// ──────────────────────────────────────────────────────────────────────────────
// Validación
// ──────────────────────────────────────────────────────────────────────────────
const validar = (): boolean => {
  let ok = true
  errores.nombre = errores.correo = errores.tipoServicio = errores.mensaje = ''

  if (!formulario.nombre.trim() || formulario.nombre.trim().length < 2) {
    errores.nombre = 'Ingresa tu nombre completo'
    ok = false
  }
  if (!formulario.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo)) {
    errores.correo = 'Ingresa un correo válido'
    ok = false
  }
  if (!formulario.tipoServicio) {
    errores.tipoServicio = 'Selecciona el tipo de servicio que necesitas'
    ok = false
  }
  if (!formulario.mensaje.trim() || formulario.mensaje.trim().length < 20) {
    errores.mensaje = 'Describe tu proyecto (mínimo 20 caracteres)'
    ok = false
  }
  return ok
}

// ──────────────────────────────────────────────────────────────────────────────
// Envío del formulario → POST /prospectos
//
// El backend hace 2 cosas automáticamente:
//  - Si el correo coincide con un usuario registrado, vincula el prospecto
//  - Envía correo de notificación al admin
// ──────────────────────────────────────────────────────────────────────────────
const enviar = async () => {
  // Honeypot: si hay valor, es un bot
  if (formulario.sitioWeb) return
  if (!validar()) return

  enviando.value = true
  try {
    await prospectosServicio.crear({
      nombre:       formulario.nombre.trim(),
      correo:       formulario.correo.trim().toLowerCase(),
      telefono:     formulario.telefono.trim() || null,
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

const mensajeContador = computed(() => formulario.mensaje.length)
const contadorColor   = computed(() => {
  if (mensajeContador.value > 480) return 'text-red-400'
  if (mensajeContador.value > 400) return 'text-yellow-400'
  return 'text-slate-600'
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f]">

    <!-- Fondo decorativo -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-0 left-1/4 w-125 h-125 bg-violet-600/6 rounded-full blur-[140px]" />
      <div class="absolute top-32 right-1/4 w-80 h-80 bg-indigo-600/5 rounded-full blur-[120px]" />
      <div class="absolute bottom-0 left-1/2 w-96 h-96 bg-violet-800/4 rounded-full blur-[160px]" />
    </div>

    <div class="relative pt-28 pb-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">

        <!-- Hero -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span class="text-violet-300 text-xs font-semibold tracking-widest uppercase">Hablemos de tu proyecto</span>
          </div>
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight tracking-tight">
            Cotiza tu
            <span class="bg-linear-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"> proyecto</span>
          </h1>

          <!-- Si viene desde un servicio específico, mostrarlo -->
          <p v-if="nombreServicioDesdeUrl" class="text-violet-300 text-sm font-medium mb-3">
            Estás cotizando: <span class="text-white">{{ nombreServicioDesdeUrl }}</span>
          </p>

          <p class="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Cuéntanos tu idea y te respondemos en menos de 24 horas con una propuesta personalizada sin compromiso.
          </p>
        </div>

        <!-- ── Estado de éxito ─────────────────────────────────────────────── -->
        <Transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
        >
          <div v-if="enviado" class="max-w-md mx-auto text-center py-16">
            <div class="relative w-24 h-24 mx-auto mb-8">
              <div class="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
              <div class="relative w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <svg class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 class="text-3xl font-bold text-white mb-3">¡Solicitud enviada!</h2>
            <p class="text-slate-400 leading-relaxed mb-2">Revisaremos tu proyecto y te responderemos a</p>
            <p class="text-white font-semibold mb-8">{{ formulario.correo }}</p>
            <p class="text-slate-500 text-sm mb-8">en menos de 24 horas hábiles.</p>

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <!-- Si está autenticado, ir directo a sus cotizaciones para ver el seguimiento -->
              <RouterLink
                v-if="authStore.estaAutenticado"
                :to="{ name: 'cliente-cotizaciones' }"
                class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/25"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Ver mis cotizaciones
              </RouterLink>
              <!-- Si NO está autenticado, invitar a registrarse para ver el seguimiento -->
              <RouterLink
                v-else
                :to="{ name: 'registro' }"
                class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/25"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Crear cuenta para seguir mi cotización
              </RouterLink>
              <RouterLink
                :to="{ name: 'proyectos' }"
                class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
              >
                Ver nuestro portafolio →
              </RouterLink>
            </div>
          </div>
        </Transition>

        <!-- ── Grid principal ──────────────────────────────────────────────── -->
        <div v-if="!enviado" class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          <!-- Sidebar izquierdo -->
          <div class="lg:col-span-4 space-y-5">

            <!-- Por qué elegirnos -->
            <div class="p-6 rounded-2xl bg-white/3 border border-white/6">
              <div class="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="text-white font-semibold mb-4 text-sm">¿Por qué elegirnos?</h3>
              <ul class="space-y-3">
                <li
                  v-for="p in [
                    'Respuesta en menos de 24 horas',
                    'Propuesta sin compromiso',
                    'Tecnología moderna y escalable',
                    'Soporte post-lanzamiento',
                    'Precio justo y transparente',
                    'Código limpio y documentado',
                  ]"
                  :key="p"
                  class="flex items-start gap-2.5 text-sm text-slate-400"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                  {{ p }}
                </li>
              </ul>
            </div>

            <!-- Contacto directo -->
            <div class="p-6 rounded-2xl bg-linear-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/15">
              <p class="text-white font-semibold text-sm mb-1">¿Prefieres escribirnos?</p>
              <p class="text-slate-500 text-xs mb-4">Contáctanos directamente:</p>
              <a
                href="mailto:creatoraiweb@gmail.com"
                class="flex items-center gap-2.5 text-violet-300 hover:text-violet-200 transition-colors text-sm group"
              >
                <div class="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0 group-hover:bg-violet-500/25 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                creatoraiweb@gmail.com
              </a>
            </div>

            <!--
              Banner dinámico:
              - Si NO está autenticado → invitar a crear cuenta
              - Si está autenticado → mostrar bienvenida con acceso a cotizaciones
            -->
            <div
              v-if="!authStore.estaAutenticado"
              class="p-5 rounded-2xl bg-linear-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p class="text-white text-xs font-semibold mb-1">¿Tienes cuenta?</p>
                  <p class="text-slate-500 text-xs leading-relaxed mb-3">
                    Inicia sesión para ver el estado de tu cotización en tiempo real.
                  </p>
                  <RouterLink
                    :to="{ name: 'login', query: { redirigir: '/contacto' } }"
                    class="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    Iniciar sesión →
                  </RouterLink>
                </div>
              </div>
            </div>

            <!-- Usuario autenticado: mostrar acceso rápido -->
            <div
              v-else
              class="p-5 rounded-2xl bg-linear-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-white text-xs font-semibold mb-1">
                    Hola, {{ authStore.usuario?.nombre?.split(' ')[0] }} 👋
                  </p>
                  <p class="text-slate-500 text-xs leading-relaxed mb-3">
                    Tu solicitud quedará vinculada a tu cuenta automáticamente.
                  </p>
                  <RouterLink
                    :to="{ name: 'cliente-cotizaciones' }"
                    class="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Ver mis cotizaciones →
                  </RouterLink>
                </div>
              </div>
            </div>

            <!-- Testimonios -->
            <div v-if="testimoniosDestacados.length" class="space-y-3">
              <p class="text-xs text-slate-600 font-semibold uppercase tracking-widest px-1">Lo que dicen nuestros clientes</p>
              <div
                v-for="t in testimoniosDestacados"
                :key="t.id"
                class="p-4 rounded-xl bg-white/3 border border-white/5"
              >
                <div class="flex items-center gap-0.5 mb-2">
                  <span
                    v-for="n in 5"
                    :key="n"
                    class="text-xs"
                    :class="n <= t.calificacion ? 'text-yellow-400' : 'text-white/10'"
                  >★</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed line-clamp-2 italic">"{{ t.contenido }}"</p>
                <p class="text-xs text-slate-600 mt-2 font-medium">— {{ t.nombreCliente }}</p>
              </div>
            </div>
          </div>

          <!-- ── Formulario ──────────────────────────────────────────────── -->
          <div class="lg:col-span-8">
            <form
              class="bg-[#111118] border border-white/6 rounded-2xl p-6 sm:p-8 space-y-6"
              novalidate
              @submit.prevent="enviar"
            >
              <!-- Honeypot oculto anti-bot -->
              <input
                v-model="formulario.sitioWeb"
                type="text"
                name="sitioWeb"
                class="hidden"
                tabindex="-1"
                autocomplete="off"
              />

              <!-- Encabezado del form -->
              <div class="flex items-center gap-3 pb-2 border-b border-white/5">
                <div class="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                  <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p class="text-white font-semibold text-sm">Formulario de cotización</p>
                  <p class="text-slate-500 text-xs">Todos los campos marcados con * son obligatorios</p>
                </div>
              </div>

              <!-- Nombre y correo -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Nombre completo <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="formulario.nombre"
                    type="text"
                    placeholder="Tu nombre completo"
                    autocomplete="name"
                    class="w-full px-4 py-3 rounded-xl bg-white/4 border text-white placeholder-slate-600 text-sm outline-none transition-all"
                    :class="errores.nombre
                      ? 'border-red-500/40 focus:border-red-500/60 bg-red-500/5'
                      : 'border-white/8 focus:border-violet-500/50 focus:bg-white/6'"
                    @input="errores.nombre = ''"
                  />
                  <p v-if="errores.nombre" class="text-xs text-red-400 flex items-center gap-1">
                    <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                    </svg>
                    {{ errores.nombre }}
                  </p>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Correo electrónico <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="formulario.correo"
                    type="email"
                    placeholder="tu@correo.com"
                    autocomplete="email"
                    :readonly="!!authStore.usuario?.correo"
                    class="w-full px-4 py-3 rounded-xl bg-white/4 border text-white placeholder-slate-600 text-sm outline-none transition-all"
                    :class="[
                      errores.correo
                        ? 'border-red-500/40 focus:border-red-500/60 bg-red-500/5'
                        : 'border-white/8 focus:border-violet-500/50 focus:bg-white/6',
                      authStore.usuario?.correo ? 'opacity-70 cursor-not-allowed' : '',
                    ]"
                    @input="errores.correo = ''"
                  />
                  <p v-if="errores.correo" class="text-xs text-red-400 flex items-center gap-1">
                    <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                    </svg>
                    {{ errores.correo }}
                  </p>
                  <!-- Indicador de correo bloqueado (pertenece a cuenta) -->
                  <p v-if="authStore.usuario?.correo" class="text-xs text-violet-400 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Correo de tu cuenta
                  </p>
                </div>
              </div>

              <!-- Teléfono -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Teléfono <span class="normal-case font-normal text-slate-600 ml-1">(opcional)</span>
                </label>
                <input
                  v-model="formulario.telefono"
                  type="tel"
                  placeholder="+57 300 000 0000"
                  autocomplete="tel"
                  class="w-full px-4 py-3 rounded-xl bg-white/4 border border-white/8 focus:border-violet-500/50 focus:bg-white/6 text-white placeholder-slate-600 text-sm outline-none transition-all"
                />
              </div>

              <!-- Tipo de servicio — con pre-selección desde URL -->
              <div class="space-y-2.5">
                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  ¿Qué necesitas? <span class="text-red-400">*</span>
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <label
                    v-for="tipo in TIPOS_SERVICIO"
                    :key="tipo.valor"
                    class="flex items-start gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all select-none"
                    :class="formulario.tipoServicio === tipo.valor
                      ? 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                      : 'border-white/6 bg-white/3 hover:border-white/12 hover:bg-white/5'"
                  >
                    <input
                      type="radio"
                      v-model="formulario.tipoServicio"
                      :value="tipo.valor"
                      class="sr-only"
                      @change="errores.tipoServicio = ''"
                    />
                    <span class="text-xl leading-none mt-0.5 shrink-0">{{ tipo.icono }}</span>
                    <div>
                      <p class="text-sm font-semibold" :class="formulario.tipoServicio === tipo.valor ? 'text-white' : 'text-slate-300'">
                        {{ tipo.etiqueta }}
                      </p>
                      <p class="text-xs mt-0.5" :class="formulario.tipoServicio === tipo.valor ? 'text-violet-300' : 'text-slate-600'">
                        {{ tipo.descripcion }}
                      </p>
                    </div>
                  </label>
                </div>
                <p v-if="errores.tipoServicio" class="text-xs text-red-400 flex items-center gap-1">
                  <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd" />
                  </svg>
                  {{ errores.tipoServicio }}
                </p>
              </div>

              <!-- Presupuesto -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Presupuesto aproximado <span class="normal-case font-normal text-slate-600 ml-1">(opcional)</span>
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none font-semibold">$</span>
                  <input
                    v-model.number="formulario.presupuesto"
                    type="number"
                    min="0"
                    step="100000"
                    placeholder="3.500.000"
                    class="w-full pl-9 pr-16 py-3 rounded-xl bg-white/4 border border-white/8 focus:border-violet-500/50 focus:bg-white/6 text-white placeholder-slate-600 text-sm outline-none transition-all"
                  />
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs pointer-events-none font-medium">COP</span>
                </div>
              </div>

              <!-- Mensaje -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Cuéntanos tu proyecto <span class="text-red-400">*</span>
                </label>
                <textarea
                  v-model="formulario.mensaje"
                  rows="5"
                  maxlength="500"
                  placeholder="Describe tu idea: qué funcionalidades necesitas, referencias de diseño que te gusten, fecha límite, etc."
                  class="w-full px-4 py-3 rounded-xl bg-white/4 border text-white placeholder-slate-600 text-sm outline-none transition-all resize-none leading-relaxed"
                  :class="errores.mensaje
                    ? 'border-red-500/40 focus:border-red-500/60 bg-red-500/5'
                    : 'border-white/8 focus:border-violet-500/50 focus:bg-white/6'"
                  @input="errores.mensaje = ''"
                />
                <div class="flex items-center justify-between">
                  <p v-if="errores.mensaje" class="text-xs text-red-400 flex items-center gap-1">
                    <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                    </svg>
                    {{ errores.mensaje }}
                  </p>
                  <span class="text-xs ml-auto font-mono" :class="contadorColor">
                    {{ mensajeContador }}/500
                  </span>
                </div>
              </div>

              <!-- Submit -->
              <button
                type="submit"
                :disabled="enviando"
                class="w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5"
                :class="enviando
                  ? 'bg-violet-600/30 text-white/30 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0'"
              >
                <svg v-if="enviando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {{ enviando ? 'Enviando tu solicitud...' : 'Enviar solicitud de cotización' }}
              </button>

              <p class="text-xs text-slate-600 text-center">
                🔒 Sin spam · Respuesta garantizada en menos de 24 horas · Sin compromiso
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>