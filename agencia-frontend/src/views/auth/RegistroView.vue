<script setup lang="ts">
import { ref, computed }  from 'vue'
import { useRouter }      from 'vue-router'
import { useAuthStore }   from '@/stores/auth'
import { useUiStore }     from '@/stores/ui'
import { autenticacionServicio } from '@/services/servicios'

const router    = useRouter()
const authStore = useAuthStore()
const uiStore   = useUiStore()

const form = ref({
  nombre:              '',
  correo:              '',
  contrasena:          '',
  confirmarContrasena: '',
})

const cargando     = ref(false)
const mostrarPass  = ref(false)
const mostrarPass2 = ref(false)
const errores      = ref<Record<string, string>>({})

function extraerMensaje(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { mensaje?: string } } }).response
    return res?.data?.mensaje ?? 'Error al crear la cuenta'
  }
  if (err instanceof Error) return err.message
  return 'Error al crear la cuenta'
}

const fortalezaContrasena = computed(() => {
  const p = form.value.contrasena
  if (!p) return 0
  return [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)]
    .filter(Boolean).length
})

const etiquetaFortaleza = computed(() =>
  ['', 'Débil', 'Regular', 'Buena', 'Fuerte'][fortalezaContrasena.value]
)

const colorFortaleza = computed(() =>
  ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][fortalezaContrasena.value]
)

const validar = (): boolean => {
  errores.value = {}
  if (!form.value.nombre.trim())
    errores.value.nombre = 'El nombre es requerido'
  if (!form.value.correo.trim())
    errores.value.correo = 'El correo es requerido'
  else if (!/\S+@\S+\.\S+/.test(form.value.correo))
    errores.value.correo = 'El correo no es válido'
  if (!form.value.contrasena)
    errores.value.contrasena = 'La contraseña es requerida'
  else if (form.value.contrasena.length < 8)
    errores.value.contrasena = 'Mínimo 8 caracteres'
  else if (!/[A-Z]/.test(form.value.contrasena))
    errores.value.contrasena = 'Debe contener al menos una mayúscula'
  else if (!/[0-9]/.test(form.value.contrasena))
    errores.value.contrasena = 'Debe contener al menos un número'
  if (form.value.contrasena !== form.value.confirmarContrasena)
    errores.value.confirmarContrasena = 'Las contraseñas no coinciden'
  return Object.keys(errores.value).length === 0
}

const registrar = async () => {
  if (!validar()) return
  cargando.value = true
  try {
    const { data } = await autenticacionServicio.registrar({
      nombre:     form.value.nombre,
      correo:     form.value.correo,
      contrasena: form.value.contrasena,
    })
    authStore.establecerSesion(data.datos)
    uiStore.exito('¡Cuenta creada!', `Bienvenido/a, ${data.datos.usuario.nombre}`)
    router.push(
      data.datos.usuario.rol === 'ADMIN'
        ? { name: 'admin-dashboard' }
        : { name: 'cliente-perfil' }
    )
  } catch (err) {
    uiStore.error('Error', extraerMensaje(err))
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
        <h1 class="mt-6 text-2xl font-black text-white">Crear cuenta</h1>
        <p class="mt-2 text-gris-medio text-sm">Únete a Nexova Studio</p>
      </div>

      <div class="bg-[#13151f] border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div class="space-y-5">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Nombre completo</label>
            <input
              v-model="form.nombre"
              type="text"
              placeholder="Juan Pérez"
              autocomplete="name"
              class="w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
              :class="errores.nombre ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-violeta/50'"
              @keyup.enter="registrar"
            />
            <p v-if="errores.nombre" class="text-xs text-red-400">{{ errores.nombre }}</p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Correo electrónico</label>
            <input
              v-model="form.correo"
              type="email"
              placeholder="tu@correo.com"
              autocomplete="email"
              class="w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
              :class="errores.correo ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-violeta/50'"
              @keyup.enter="registrar"
            />
            <p v-if="errores.correo" class="text-xs text-red-400">{{ errores.correo }}</p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Contraseña</label>
            <div class="relative">
              <input
                v-model="form.contrasena"
                :type="mostrarPass ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                autocomplete="new-password"
                class="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
                :class="errores.contrasena ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-violeta/50'"
                @keyup.enter="registrar"
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gris-medio hover:text-white transition-colors" @click="mostrarPass = !mostrarPass">
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="!mostrarPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            <div v-if="form.contrasena" class="space-y-1">
              <div class="flex gap-1">
                <div
                  v-for="i in 4" :key="i"
                  class="h-1 flex-1 rounded-full transition-all"
                  :class="i <= fortalezaContrasena ? colorFortaleza : 'bg-white/10'"
                />
              </div>
              <p class="text-xs" :class="{
                'text-red-400':    fortalezaContrasena === 1,
                'text-yellow-400': fortalezaContrasena === 2,
                'text-blue-400':   fortalezaContrasena === 3,
                'text-green-400':  fortalezaContrasena === 4,
              }">{{ etiquetaFortaleza }}</p>
            </div>
            <p v-if="errores.contrasena" class="text-xs text-red-400">{{ errores.contrasena }}</p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Confirmar contraseña</label>
            <div class="relative">
              <input
                v-model="form.confirmarContrasena"
                :type="mostrarPass2 ? 'text' : 'password'"
                placeholder="Repite tu contraseña"
                autocomplete="new-password"
                class="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
                :class="errores.confirmarContrasena ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-violeta/50'"
                @keyup.enter="registrar"
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gris-medio hover:text-white transition-colors" @click="mostrarPass2 = !mostrarPass2">
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="!mostrarPass2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            <p v-if="errores.confirmarContrasena" class="text-xs text-red-400">{{ errores.confirmarContrasena }}</p>
          </div>

          <button
            class="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            :class="cargando ? 'bg-violeta/50 text-white/50 cursor-not-allowed' : 'bg-violeta hover:bg-violeta/90 text-white shadow-lg shadow-violeta/25 hover:shadow-violeta/40'"
            :disabled="cargando"
            @click="registrar"
          >
            <svg v-if="cargando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ cargando ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </div>

        <div class="flex items-center gap-3 my-6">
          <div class="flex-1 h-px bg-white/8" />
          <span class="text-xs text-gris-medio">¿Ya tienes cuenta?</span>
          <div class="flex-1 h-px bg-white/8" />
        </div>

        <RouterLink :to="{ name: 'login' }" class="block w-full py-3 rounded-xl border border-white/10 hover:border-white/20 text-gris-medio hover:text-white text-sm font-medium text-center transition-all">
          Iniciar sesión
        </RouterLink>
      </div>

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