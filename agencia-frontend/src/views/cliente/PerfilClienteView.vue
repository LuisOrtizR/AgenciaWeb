<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore }   from '@/stores/auth'
import { useUiStore }     from '@/stores/ui'
import { usuariosServicio } from '@/services/servicios'

const authStore = useAuthStore()
const uiStore   = useUiStore()

// ─── Estado ──────────────────────────────────────────────────────────────────
const cargando       = ref(true)
const guardandoPerfil = ref(false)
const guardandoPass  = ref(false)
const tabActiva      = ref<'perfil' | 'seguridad'>('perfil')

const formPerfil = ref({ nombre: '', telefono: '', empresa: '' })
const formPass   = ref({ contrasenaActual: '', contrasenaNueva: '', confirmar: '' })
const mostrarPassActual  = ref(false)
const mostrarPassNueva   = ref(false)
const erroresPerfil      = ref<Record<string, string>>({})
const erroresPass        = ref<Record<string, string>>({})

// ─── Carga inicial ────────────────────────────────────────────────────────────
const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await usuariosServicio.miPerfil()
    const u = data.datos
    formPerfil.value = {
      nombre:   u.nombre    ?? '',
      telefono: u.telefono  ?? '',
      empresa:  u.empresa   ?? '',
    }
  } catch {
    uiStore.error('Error', 'No se pudo cargar el perfil')
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

// ─── Guardar perfil ───────────────────────────────────────────────────────────
const validarPerfil = () => {
  erroresPerfil.value = {}
  if (!formPerfil.value.nombre.trim())
    erroresPerfil.value.nombre = 'El nombre es requerido'
  return Object.keys(erroresPerfil.value).length === 0
}

const guardarPerfil = async () => {
  if (!validarPerfil()) return
  guardandoPerfil.value = true
  try {
    await usuariosServicio.actualizarMiPerfil({
      nombre:   formPerfil.value.nombre,
      telefono: formPerfil.value.telefono || null,
      empresa:  formPerfil.value.empresa || null,
    })
    uiStore.exito('Perfil actualizado', 'Tus datos han sido guardados')
    // Actualizar nombre en el store
    authStore.actualizarNombre?.(formPerfil.value.nombre)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al guardar'
    uiStore.error('Error', msg)
  } finally {
    guardandoPerfil.value = false
  }
}

// ─── Cambiar contraseña ───────────────────────────────────────────────────────
const validarPass = () => {
  erroresPass.value = {}
  if (!formPass.value.contrasenaActual)
    erroresPass.value.contrasenaActual = 'La contraseña actual es requerida'
  if (!formPass.value.contrasenaNueva)
    erroresPass.value.contrasenaNueva = 'La nueva contraseña es requerida'
  else if (formPass.value.contrasenaNueva.length < 8)
    erroresPass.value.contrasenaNueva = 'Mínimo 8 caracteres'
  else if (!/[A-Z]/.test(formPass.value.contrasenaNueva))
    erroresPass.value.contrasenaNueva = 'Debe tener al menos una mayúscula'
  else if (!/[0-9]/.test(formPass.value.contrasenaNueva))
    erroresPass.value.contrasenaNueva = 'Debe tener al menos un número'
  if (formPass.value.contrasenaNueva !== formPass.value.confirmar)
    erroresPass.value.confirmar = 'Las contraseñas no coinciden'
  return Object.keys(erroresPass.value).length === 0
}

const cambiarContrasena = async () => {
  if (!validarPass()) return
  guardandoPass.value = true
  try {
    await usuariosServicio.cambiarContrasena({
      contrasenaActual: formPass.value.contrasenaActual,
      contrasenaNueva:  formPass.value.contrasenaNueva,
    })
    uiStore.exito('Contraseña actualizada', 'Usa tu nueva contraseña en el próximo inicio de sesión')
    formPass.value = { contrasenaActual: '', contrasenaNueva: '', confirmar: '' }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al cambiar contraseña'
    uiStore.error('Error', msg)
  } finally {
    guardandoPass.value = false
  }
}

const inicialNombre = (n: string) => n[0]?.toUpperCase() ?? '?'
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f]">

    <!-- Navbar simple para clientes -->
    <header class="h-16 flex items-center justify-between px-6 bg-[#0d0d16] border-b border-white/5">
      <RouterLink :to="{ name: 'inicio' }" class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center shadow-lg shadow-violeta/30">
          <span class="text-white font-black text-sm">N</span>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">
          Nexova<span class="text-violeta">.</span>
        </span>
      </RouterLink>

      <div class="flex items-center gap-3">
        <RouterLink :to="{ name: 'inicio' }" class="text-xs text-gris-medio hover:text-white transition-colors hidden sm:block">
          ← Ver sitio
        </RouterLink>
        <button
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-all"
          @click="authStore.cerrarSesion()"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </header>

    <!-- Contenido -->
    <div class="max-w-2xl mx-auto px-4 py-10 space-y-6">

      <!-- Skeleton -->
      <div v-if="cargando" class="space-y-4">
        <div class="h-28 bg-white/5 rounded-2xl animate-pulse" />
        <div class="h-64 bg-white/5 rounded-2xl animate-pulse" />
      </div>

      <template v-else>

        <!-- Header perfil -->
        <div class="bg-[#13151f] border border-white/5 rounded-2xl p-6 flex items-center gap-5">
          <div class="w-16 h-16 rounded-2xl bg-linear-to-br from-violeta/30 to-indigo-500/20 flex items-center justify-center text-2xl font-black text-violeta-claro shrink-0">
            {{ inicialNombre(formPerfil.nombre || authStore.nombreUsuario || 'U') }}
          </div>
          <div>
            <h1 class="text-xl font-black text-white">{{ formPerfil.nombre || authStore.nombreUsuario }}</h1>
            <p class="text-gris-medio text-sm mt-0.5">{{ authStore.usuario?.correo }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Cliente
              </span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-white/3 p-1 rounded-xl">
          <button
            class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            :class="tabActiva === 'perfil'
              ? 'bg-white/8 text-white'
              : 'text-gris-medio hover:text-white'"
            @click="tabActiva = 'perfil'"
          >
            Mis datos
          </button>
          <button
            class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            :class="tabActiva === 'seguridad'
              ? 'bg-white/8 text-white'
              : 'text-gris-medio hover:text-white'"
            @click="tabActiva = 'seguridad'"
          >
            Seguridad
          </button>
        </div>

        <!-- Tab: Mis datos -->
        <div v-if="tabActiva === 'perfil'" class="bg-[#13151f] border border-white/5 rounded-2xl p-6 space-y-5">
          <h2 class="text-sm font-semibold text-white">Información personal</h2>

          <!-- Nombre -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Nombre completo</label>
            <input
              v-model="formPerfil.nombre"
              type="text"
              placeholder="Tu nombre"
              class="w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
              :class="erroresPerfil.nombre ? 'border-red-500/50' : 'border-white/10 focus:border-violeta/50'"
            />
            <p v-if="erroresPerfil.nombre" class="text-xs text-red-400">{{ erroresPerfil.nombre }}</p>
          </div>

          <!-- Correo (solo lectura) -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">
              Correo electrónico
              <span class="ml-2 text-xs text-gris-medio font-normal">(no editable)</span>
            </label>
            <input
              :value="authStore.usuario?.correo"
              type="email"
              readonly
              class="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/5 text-gris-medio text-sm outline-none cursor-not-allowed"
            />
          </div>

          <!-- Teléfono -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Teléfono <span class="text-gris-medio font-normal">(opcional)</span></label>
            <input
              v-model="formPerfil.telefono"
              type="tel"
              placeholder="+57 300 000 0000"
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none transition-colors"
            />
          </div>

          <!-- Empresa -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Empresa <span class="text-gris-medio font-normal">(opcional)</span></label>
            <input
              v-model="formPerfil.empresa"
              type="text"
              placeholder="Nombre de tu empresa"
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none transition-colors"
            />
          </div>

          <button
            class="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            :class="guardandoPerfil
              ? 'bg-violeta/50 text-white/50 cursor-not-allowed'
              : 'bg-violeta hover:bg-violeta/90 text-white shadow-lg shadow-violeta/25'"
            :disabled="guardandoPerfil"
            @click="guardarPerfil"
          >
            <svg v-if="guardandoPerfil" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ guardandoPerfil ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>

        <!-- Tab: Seguridad -->
        <div v-if="tabActiva === 'seguridad'" class="bg-[#13151f] border border-white/5 rounded-2xl p-6 space-y-5">
          <div>
            <h2 class="text-sm font-semibold text-white">Cambiar contraseña</h2>
            <p class="text-xs text-gris-medio mt-1">Mínimo 8 caracteres, una mayúscula y un número</p>
          </div>

          <!-- Contraseña actual -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Contraseña actual</label>
            <div class="relative">
              <input
                v-model="formPass.contrasenaActual"
                :type="mostrarPassActual ? 'text' : 'password'"
                placeholder="Tu contraseña actual"
                class="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
                :class="erroresPass.contrasenaActual ? 'border-red-500/50' : 'border-white/10 focus:border-violeta/50'"
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gris-medio hover:text-white" @click="mostrarPassActual = !mostrarPassActual">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p v-if="erroresPass.contrasenaActual" class="text-xs text-red-400">{{ erroresPass.contrasenaActual }}</p>
          </div>

          <!-- Nueva contraseña -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Nueva contraseña</label>
            <div class="relative">
              <input
                v-model="formPass.contrasenaNueva"
                :type="mostrarPassNueva ? 'text' : 'password'"
                placeholder="Tu nueva contraseña"
                class="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
                :class="erroresPass.contrasenaNueva ? 'border-red-500/50' : 'border-white/10 focus:border-violeta/50'"
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gris-medio hover:text-white" @click="mostrarPassNueva = !mostrarPassNueva">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p v-if="erroresPass.contrasenaNueva" class="text-xs text-red-400">{{ erroresPass.contrasenaNueva }}</p>
          </div>

          <!-- Confirmar -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-blanco-suave">Confirmar nueva contraseña</label>
            <input
              v-model="formPass.confirmar"
              type="password"
              placeholder="Repite la nueva contraseña"
              class="w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gris-medio text-sm outline-none transition-colors"
              :class="erroresPass.confirmar ? 'border-red-500/50' : 'border-white/10 focus:border-violeta/50'"
            />
            <p v-if="erroresPass.confirmar" class="text-xs text-red-400">{{ erroresPass.confirmar }}</p>
          </div>

          <button
            class="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            :class="guardandoPass
              ? 'bg-violeta/50 text-white/50 cursor-not-allowed'
              : 'bg-violeta hover:bg-violeta/90 text-white shadow-lg shadow-violeta/25'"
            :disabled="guardandoPass"
            @click="cambiarContrasena"
          >
            <svg v-if="guardandoPass" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ guardandoPass ? 'Guardando...' : 'Cambiar contraseña' }}
          </button>
        </div>

      </template>
    </div>
  </div>
</template>