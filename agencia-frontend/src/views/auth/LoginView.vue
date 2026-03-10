<script setup lang="ts">
import { ref }          from 'vue'
import { useRouter }    from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import { autenticacionServicio } from '@/services/servicios'

const router    = useRouter()
const authStore = useAuthStore()
const uiStore   = useUiStore()

const empresaNombre = import.meta.env.VITE_EMPRESA_NOMBRE as string

const form = ref({ correo: '', contrasena: '' })
const cargando    = ref(false)
const mostrarPass = ref(false)
const errores     = ref<Record<string, string>>({})

const validar = () => {
  errores.value = {}
  if (!form.value.correo.trim())
    errores.value.correo = 'El correo es requerido'
  if (!form.value.contrasena)
    errores.value.contrasena = 'La contraseña es requerida'
  return Object.keys(errores.value).length === 0
}

const iniciarSesion = async () => {
  if (!validar()) return
  cargando.value = true
  try {
    const { data } = await autenticacionServicio.login(form.value)
    authStore.establecerSesion(data.datos)
    uiStore.exito('Sesión iniciada', `Bienvenido/a, ${data.datos.usuario.nombre}`)
    const destino = data.datos.usuario.rol === 'ADMIN'
      ? { name: 'admin-dashboard' }
      : { name: 'cliente-perfil' }
    router.push(destino)
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Credenciales inválidas'
    uiStore.error('Error', mensaje)
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
            <span class="text-white font-black text-sm">AI</span>
          </div>
          <span class="text-white font-bold text-2xl tracking-tight">
            AIWeb<span class="text-violeta"> CREATOR</span>
          </span>
        </RouterLink>
        <h1 class="mt-6 text-2xl font-black text-white">Iniciar sesión</h1>
        <p class="mt-2 text-gris-medio text-sm">Accede a tu cuenta de {{ empresaNombre }}</p>
      </div>

      <!-- Card -->
      <div class="bg-[#13151f] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/40">

        <div class="space-y-5">

          <!-- Correo -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Correo electrónico</label>
            <input
              v-model="form.correo"
              type="email"
              placeholder="tu@correo.com"
              autocomplete="email"
              class="w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
              :class="errores.correo
                ? 'border-red-500/50 focus:border-red-500'
                : 'border-white/10 focus:border-violeta/50'"
              @keyup.enter="iniciarSesion"
            />
            <p v-if="errores.correo" class="text-xs text-red-400">{{ errores.correo }}</p>
          </div>

          <!-- Contraseña -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium text-blanco-suave">Contraseña</label>
              <RouterLink
                :to="{ name: 'olvide-contrasena' }"
                class="text-xs text-violeta-claro hover:text-violeta transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </RouterLink>
            </div>
            <div class="relative">
              <input
                v-model="form.contrasena"
                :type="mostrarPass ? 'text' : 'password'"
                placeholder="Tu contraseña"
                autocomplete="current-password"
                class="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
                :class="errores.contrasena
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-white/10 focus:border-violeta/50'"
                @keyup.enter="iniciarSesion"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gris-medio hover:text-white transition-colors"
                @click="mostrarPass = !mostrarPass"
              >
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="!mostrarPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            <p v-if="errores.contrasena" class="text-xs text-red-400">{{ errores.contrasena }}</p>
          </div>

          <!-- Botón login -->
          <button
            class="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2"
            :class="cargando
              ? 'bg-violeta/50 text-white/50 cursor-not-allowed'
              : 'bg-violeta hover:bg-violeta/90 text-white shadow-lg shadow-violeta/25 hover:shadow-violeta/40'"
            :disabled="cargando"
            @click="iniciarSesion"
          >
            <svg v-if="cargando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ cargando ? 'Ingresando...' : 'Iniciar sesión' }}
          </button>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-6">
          <div class="flex-1 h-px bg-white/8" />
          <span class="text-xs text-gris-medio">¿No tienes cuenta?</span>
          <div class="flex-1 h-px bg-white/8" />
        </div>

        <RouterLink
          :to="{ name: 'registro' }"
          class="block w-full py-3 rounded-xl border border-white/10 hover:border-white/20 text-gris-medio hover:text-white text-sm font-medium text-center transition-all"
        >
          Crear cuenta gratis
        </RouterLink>
      </div>

      <!-- Volver al inicio -->
      <div class="text-center mt-6">
        <RouterLink :to="{ name: 'inicio' }" class="text-xs text-gris-medio hover:text-blanco-suave transition-colors inline-flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al sitio
        </RouterLink>
      </div>

    </div>
  </div>
</template>