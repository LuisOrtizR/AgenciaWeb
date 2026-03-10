<script setup lang="ts">
import { ref } from 'vue'
import { autenticacionServicio } from '@/services/servicios'
import { useUiStore } from '@/stores/ui'

const uiStore  = useUiStore()
const correo   = ref('')
const cargando = ref(false)
const enviado  = ref(false)
const error    = ref('')

const enviar = async () => {
  error.value = ''
  if (!correo.value.trim()) {
    error.value = 'El correo es requerido'
    return
  }
  if (!/\S+@\S+\.\S+/.test(correo.value)) {
    error.value = 'El correo no es válido'
    return
  }

  cargando.value = true
  try {
    await autenticacionServicio.olvidéContrasena(correo.value.trim())
    enviado.value = true
  } catch {
    // Siempre mostramos el mismo mensaje para no revelar si el correo existe
    enviado.value = true
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">

    <!-- Fondo decorativo -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-violeta/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-md">

      <!-- Logo -->
      <div class="text-center mb-8">
        <RouterLink :to="{ name: 'inicio' }" class="inline-flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center shadow-lg shadow-violeta/30">
            <span class="text-white font-black text-lg">N</span>
          </div>
          <span class="text-white font-bold text-2xl tracking-tight">
            Nexova<span class="text-violeta">.</span>
          </span>
        </RouterLink>
        <h1 class="mt-6 text-2xl font-black text-white">¿Olvidaste tu contraseña?</h1>
        <p class="mt-2 text-gris-medio text-sm">Te enviaremos un enlace para restablecerla</p>
      </div>

      <!-- Card -->
      <div class="bg-[#13151f] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/40">

        <!-- Estado: correo enviado -->
        <template v-if="enviado">
          <div class="text-center py-4 space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-verde/10 border border-verde/20 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-verde" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p class="text-white font-semibold text-lg">Revisa tu correo</p>
              <p class="text-gris-medio text-sm mt-2 leading-relaxed">
                Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.
                El enlace expira en <strong class="text-blanco-suave">1 hora</strong>.
              </p>
            </div>
            <p class="text-xs text-gris-medio pt-2">
              ¿No llegó? Revisa tu carpeta de spam o
              <button class="text-violeta-claro hover:text-violeta transition-colors underline" @click="enviado = false">
                intenta de nuevo
              </button>
            </p>
          </div>
        </template>

        <!-- Estado: formulario -->
        <template v-else>
          <div class="space-y-5">
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-blanco-suave">Correo electrónico</label>
              <input
                v-model="correo"
                type="email"
                placeholder="tu@correo.com"
                autocomplete="email"
                class="w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
                :class="error
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-white/10 focus:border-violeta/50'"
                @keyup.enter="enviar"
              />
              <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
            </div>

            <button
              class="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              :class="cargando
                ? 'bg-violeta/50 text-white/50 cursor-not-allowed'
                : 'bg-violeta hover:bg-violeta/90 text-white shadow-lg shadow-violeta/25 hover:shadow-violeta/40'"
              :disabled="cargando"
              @click="enviar"
            >
              <svg v-if="cargando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ cargando ? 'Enviando...' : 'Enviar enlace de recuperación' }}
            </button>
          </div>
        </template>

      </div>

      <!-- Volver al login -->
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