<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import AppBoton from '@/components/ui/AppBoton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { UsuarioConConteo } from '@/types'

const authStore = useAuthStore()
const uiStore   = useUiStore()

const perfil              = ref<UsuarioConConteo | null>(null)
const cargando            = ref(true)
const guardandoPerfil     = ref(false)
const guardandoContrasena = ref(false)

const formPerfil = reactive({
  nombre:    '',
  telefono:  '' as string | null,
  empresa:   '' as string | null,
  avatarUrl: '' as string | null,
})

const formContrasena = reactive({
  contrasenaActual: '',
  nuevaContrasena:  '',
  confirmar:        '',
})

const erroresContrasena = reactive({
  contrasenaActual: '',
  nuevaContrasena:  '',
  confirmar:        '',
})

onMounted(async () => {
  try {
    const datos = await authStore.obtenerPerfil()
    perfil.value          = datos
    formPerfil.nombre     = datos.nombre
    formPerfil.telefono   = datos.telefono ?? ''
    formPerfil.empresa    = datos.empresa  ?? ''
    formPerfil.avatarUrl  = datos.avatarUrl ?? ''
  } catch {
    uiStore.error('Error', 'No se pudo cargar el perfil')
  } finally {
    cargando.value = false
  }
})

const guardarPerfil = async () => {
  guardandoPerfil.value = true
  try {
    await authStore.actualizarPerfil({
      nombre:    formPerfil.nombre,
      telefono:  formPerfil.telefono  || null,
      empresa:   formPerfil.empresa   || null,
      avatarUrl: formPerfil.avatarUrl || null,
    })
    uiStore.exito('Perfil actualizado correctamente')
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el perfil')
  } finally {
    guardandoPerfil.value = false
  }
}

const guardarContrasena = async () => {
  erroresContrasena.contrasenaActual = ''
  erroresContrasena.nuevaContrasena  = ''
  erroresContrasena.confirmar        = ''

  if (!formContrasena.contrasenaActual) {
    erroresContrasena.contrasenaActual = 'Ingresa tu contraseña actual'
    return
  }
  if (formContrasena.nuevaContrasena.length < 8) {
    erroresContrasena.nuevaContrasena = 'Mínimo 8 caracteres'
    return
  }
  if (formContrasena.nuevaContrasena !== formContrasena.confirmar) {
    erroresContrasena.confirmar = 'Las contraseñas no coinciden'
    return
  }

  guardandoContrasena.value = true
  try {
    await authStore.cambiarContrasena({
      contrasenaActual: formContrasena.contrasenaActual,
      contrasenaNueva:  formContrasena.nuevaContrasena,
    })
    uiStore.exito('Contraseña actualizada')
    formContrasena.contrasenaActual = ''
    formContrasena.nuevaContrasena  = ''
    formContrasena.confirmar        = ''
  } catch {
    uiStore.error('Error', 'La contraseña actual es incorrecta')
  } finally {
    guardandoContrasena.value = false
  }
}

const iniciales = computed(() =>
  (authStore.nombreUsuario || '').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
)

const avatarValido = computed(() =>
  formPerfil.avatarUrl?.startsWith('http') ? formPerfil.avatarUrl : null
)

const formatearFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(f))
</script>

<template>
  <div class="space-y-6 max-w-2xl mx-auto">

    <div>
      <h1 class="text-2xl font-bold text-white">Mi perfil</h1>
      <p class="text-slate-500 text-sm mt-1">Gestiona tu información personal y seguridad</p>
    </div>

    <div class="bg-[#13151f] border border-white/5 rounded-2xl p-6">
      <div class="flex items-center gap-5">
        <div class="relative shrink-0">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg overflow-hidden"
            :class="avatarValido ? '' : 'bg-linear-to-br from-violet-600 to-indigo-500 shadow-violet-500/30'"
          >
            <img v-if="avatarValido" :src="avatarValido" alt="avatar" class="w-full h-full object-cover" />
            <span v-else>{{ iniciales }}</span>
          </div>
          <div
            v-if="perfil?.creadoEn"
            class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#13151f]"
            title="Cuenta activa"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-lg font-semibold text-white truncate">{{ authStore.nombreUsuario }}</p>
          <p class="text-slate-500 text-sm truncate">{{ authStore.usuario?.correo }}</p>
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {{ authStore.usuario?.rol === 'ADMIN' ? 'Administrador' : 'Cliente' }}
            </span>
            <span v-if="perfil?.empresa" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-400 border border-white/8">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {{ perfil.empresa }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="cargando" class="space-y-4">
      <div class="h-64 bg-white/5 rounded-2xl animate-pulse" />
      <div class="h-56 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <template v-else>

      <div class="bg-[#13151f] border border-white/5 rounded-2xl p-6 space-y-5">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-md bg-violet-500/15 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 class="text-white font-semibold text-sm">Información personal</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <AppInput v-model="formPerfil.nombre" label="Nombre completo" placeholder="Tu nombre completo" requerido />
          </div>
          <AppInput
            v-model="formPerfil.telefono"
            label="Teléfono"
            placeholder="+57 300 000 0000"
          />
          <AppInput
            v-model="formPerfil.empresa"
            label="Empresa"
            placeholder="Nombre de tu empresa"
          />
          <div class="sm:col-span-2 space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">URL de avatar</label>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white/8 flex items-center justify-center text-xs font-bold text-slate-400">
                <img v-if="avatarValido" :src="avatarValido" alt="" class="w-full h-full object-cover" />
                <span v-else>{{ iniciales }}</span>
              </div>
              <input
                v-model="formPerfil.avatarUrl"
                type="url"
                placeholder="https://ejemplo.com/avatar.jpg"
                class="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
              />
            </div>
            <p class="text-xs text-slate-600">Ingresa la URL pública de tu imagen de perfil</p>
          </div>
        </div>

        <div class="flex justify-end pt-1">
          <AppBoton variante="primario" :cargando="guardandoPerfil" @click="guardarPerfil">
            Guardar cambios
          </AppBoton>
        </div>
      </div>

      <div class="bg-[#13151f] border border-white/5 rounded-2xl p-6 space-y-5">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-md bg-red-500/15 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 class="text-white font-semibold text-sm">Cambiar contraseña</h2>
        </div>

        <div class="space-y-4">
          <AppInput
            v-model="formContrasena.contrasenaActual"
            label="Contraseña actual"
            tipo="password"
            :error="erroresContrasena.contrasenaActual"
          />
          <AppInput
            v-model="formContrasena.nuevaContrasena"
            label="Nueva contraseña"
            tipo="password"
            ayuda="Mínimo 8 caracteres"
            :error="erroresContrasena.nuevaContrasena"
          />
          <AppInput
            v-model="formContrasena.confirmar"
            label="Confirmar nueva contraseña"
            tipo="password"
            :error="erroresContrasena.confirmar"
          />
        </div>

        <div class="flex justify-end pt-1">
          <AppBoton variante="peligro" :cargando="guardandoContrasena" @click="guardarContrasena">
            Cambiar contraseña
          </AppBoton>
        </div>
      </div>

      <div v-if="perfil" class="bg-[#13151f] border border-white/5 rounded-2xl p-6">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 class="text-white font-semibold text-sm">Actividad en el sistema</h2>
        </div>

        <div class="grid grid-cols-3 gap-3 mb-5">
          <div class="text-center p-4 rounded-xl bg-white/3 border border-white/5">
            <p class="text-2xl font-bold text-white tabular-nums">{{ perfil._count?.prospectos ?? 0 }}</p>
            <p class="text-xs text-slate-500 mt-1">Prospectos</p>
          </div>
          <div class="text-center p-4 rounded-xl bg-white/3 border border-white/5">
            <p class="text-2xl font-bold text-white tabular-nums">{{ perfil._count?.cotizaciones ?? 0 }}</p>
            <p class="text-xs text-slate-500 mt-1">Cotizaciones</p>
          </div>
          <div class="text-center p-4 rounded-xl bg-white/3 border border-white/5">
            <p class="text-2xl font-bold text-white tabular-nums">{{ perfil._count?.testimonios ?? 0 }}</p>
            <p class="text-xs text-slate-500 mt-1">Testimonios</p>
          </div>
        </div>

        <div class="flex items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/5">
          <svg class="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-xs text-slate-500">
            Cuenta creada el
            <span class="text-slate-300">{{ formatearFecha(perfil.creadoEn) }}</span>
          </p>
        </div>
      </div>

    </template>
  </div>
</template>