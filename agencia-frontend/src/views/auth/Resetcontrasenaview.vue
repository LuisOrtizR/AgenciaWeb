<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { autenticacionServicio }    from '@/services/servicios'
import { useUiStore }               from '@/stores/ui'

const route   = useRoute()
const router  = useRouter()
const uiStore = useUiStore()

const token         = ref('')
const contrasena    = ref('')
const confirmar     = ref('')
const mostrarPass   = ref(false)
const mostrarPass2  = ref(false)
const cargando      = ref(false)
const exitoso       = ref(false)
const tokenInvalido = ref(false)
const errores       = ref<Record<string, string>>({})

function extraerMensaje(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { mensaje?: string } } }).response
    return res?.data?.mensaje ?? 'El enlace es inválido o ha expirado'
  }
  if (err instanceof Error) return err.message
  return 'El enlace es inválido o ha expirado'
}

onMounted(() => {
  const t = route.query.token
  if (!t || typeof t !== 'string') {
    tokenInvalido.value = true
    return
  }
  token.value = t
})

const fortaleza = computed(() => {
  const p = contrasena.value
  if (!p) return 0
  return [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)]
    .filter(Boolean).length
})

const etiquetaFortaleza = computed(() =>
  ['', 'Débil', 'Regular', 'Buena', 'Fuerte'][fortaleza.value]
)

const colorFortaleza = computed(() =>
  ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][fortaleza.value]
)

const validar = (): boolean => {
  errores.value = {}
  if (!contrasena.value)
    errores.value.contrasena = 'La contraseña es requerida'
  else if (contrasena.value.length < 8)
    errores.value.contrasena = 'Mínimo 8 caracteres'
  else if (!/[A-Z]/.test(contrasena.value))
    errores.value.contrasena = 'Debe contener al menos una mayúscula'
  else if (!/[0-9]/.test(contrasena.value))
    errores.value.contrasena = 'Debe contener al menos un número'
  if (contrasena.value !== confirmar.value)
    errores.value.confirmar = 'Las contraseñas no coinciden'
  return Object.keys(errores.value).length === 0
}

const guardar = async () => {
  if (!validar()) return
  cargando.value = true
  try {
    await autenticacionServicio.resetContrasena({ token: token.value, contrasena: contrasena.value })
    exitoso.value = true
    uiStore.exito('Contraseña actualizada', 'Ya puedes iniciar sesión')
    setTimeout(() => router.push({ name: 'login' }), 2500)
  } catch (err) {
    uiStore.error('Error', extraerMensaje(err))
    tokenInvalido.value = true
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-violeta/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-md">
      <div class="text-center mb-8">
        <RouterLink :to="{ name: 'inicio' }" class="inline-flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center shadow-lg shadow-violeta/30">
            <span class="text-white font-black text-lg">N</span>
          </div>
          <span class="text-white font-bold text-2xl tracking-tight">
            Nexova<span class="text-violeta">.</span>
          </span>
        </RouterLink>
        <h1 class="mt-6 text-2xl font-black text-white">Nueva contraseña</h1>
        <p class="mt-2 text-gris-medio text-sm">Elige una contraseña segura para tu cuenta</p>
      </div>

      <div class="bg-[#13151f] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/40">
        <template v-if="tokenInvalido">
          <div class="text-center py-4 space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-rojo/10 border border-rojo/20 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-rojo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p class="text-white font-semibold text-lg">Enlace inválido o expirado</p>
              <p class="text-gris-medio text-sm mt-2 leading-relaxed">
                Este enlace ya no es válido. Puede haber expirado (duran 1 hora) o ya fue utilizado.
              </p>
            </div>
            <RouterLink :to="{ name: 'olvide-contrasena' }" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violeta hover:bg-violeta/90 text-white text-sm font-semibold transition-all shadow-lg shadow-violeta/25">
              Solicitar nuevo enlace
            </RouterLink>
          </div>
        </template>

        <template v-else-if="exitoso">
          <div class="text-center py-4 space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-verde/10 border border-verde/20 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p class="text-white font-semibold text-lg">¡Contraseña actualizada!</p>
              <p class="text-gris-medio text-sm mt-2">Redirigiendo al inicio de sesión...</p>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="space-y-5">
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-blanco-suave">Nueva contraseña</label>
              <div class="relative">
                <input
                  v-model="contrasena"
                  :type="mostrarPass ? 'text' : 'password'"
                  placeholder="Mínimo 8 caracteres"
                  autocomplete="new-password"
                  class="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
                  :class="errores.contrasena ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-violeta/50'"
                  @keyup.enter="guardar"
                />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gris-medio hover:text-white transition-colors" @click="mostrarPass = !mostrarPass">
                  <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="!mostrarPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <div v-if="contrasena" class="space-y-1">
                <div class="flex gap-1">
                  <div
                    v-for="i in 4" :key="i"
                    class="h-1 flex-1 rounded-full transition-all"
                    :class="i <= fortaleza ? colorFortaleza : 'bg-white/10'"
                  />
                </div>
                <p class="text-xs" :class="{
                  'text-red-400':    fortaleza === 1,
                  'text-yellow-400': fortaleza === 2,
                  'text-blue-400':   fortaleza === 3,
                  'text-green-400':  fortaleza === 4,
                }">{{ etiquetaFortaleza }}</p>
              </div>
              <p v-if="errores.contrasena" class="text-xs text-red-400">{{ errores.contrasena }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-blanco-suave">Confirmar contraseña</label>
              <div class="relative">
                <input
                  v-model="confirmar"
                  :type="mostrarPass2 ? 'text' : 'password'"
                  placeholder="Repite tu contraseña"
                  autocomplete="new-password"
                  class="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
                  :class="errores.confirmar ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-violeta/50'"
                  @keyup.enter="guardar"
                />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gris-medio hover:text-white transition-colors" @click="mostrarPass2 = !mostrarPass2">
                  <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="!mostrarPass2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <p v-if="errores.confirmar" class="text-xs text-red-400">{{ errores.confirmar }}</p>
            </div>

            <button
              class="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              :class="cargando ? 'bg-violeta/50 text-white/50 cursor-not-allowed' : 'bg-violeta hover:bg-violeta/90 text-white shadow-lg shadow-violeta/25 hover:shadow-violeta/40'"
              :disabled="cargando"
              @click="guardar"
            >
              <svg v-if="cargando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ cargando ? 'Guardando...' : 'Guardar nueva contraseña' }}
            </button>
          </div>
        </template>
      </div>

      <div class="text-center mt-6">
        <RouterLink :to="{ name: 'login' }" class="text-xs text-gris-medio hover:text-blanco-suave transition-colors inline-flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio de sesión
        </RouterLink>
      </div>
    </div>
  </div>
</template>