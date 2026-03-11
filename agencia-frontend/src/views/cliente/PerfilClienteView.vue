<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore }     from '@/stores/auth'
import { useUiStore }       from '@/stores/ui'
import { usuariosServicio } from '@/services/servicios'
import AppBoton from '@/components/ui/AppBoton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const authStore = useAuthStore()
const uiStore   = useUiStore()

const cargando        = ref(true)
const guardandoPerfil = ref(false)
const guardandoPass   = ref(false)
const tabActiva       = ref<'perfil' | 'seguridad'>('perfil')

const formPerfil = reactive({ nombre: '', telefono: '' as string | null, empresa: '' as string | null })

const formPass = reactive({ contrasenaActual: '', contrasenaNueva: '', confirmar: '' })

const erroresPass = reactive({ contrasenaActual: '', contrasenaNueva: '', confirmar: '' })

function extraerMensaje(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { mensaje?: string } } }).response
    return res?.data?.mensaje ?? 'Error desconocido'
  }
  if (err instanceof Error) return err.message
  return 'Error desconocido'
}

const iniciales = computed(() =>
  (authStore.nombreUsuario || 'U')
    .split(' ').slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('')
)

const validarPass = (): boolean => {
  erroresPass.contrasenaActual = ''
  erroresPass.contrasenaNueva  = ''
  erroresPass.confirmar        = ''
  if (!formPass.contrasenaActual)
    erroresPass.contrasenaActual = 'La contraseña actual es requerida'
  if (!formPass.contrasenaNueva)
    erroresPass.contrasenaNueva = 'La nueva contraseña es requerida'
  else if (formPass.contrasenaNueva.length < 8)
    erroresPass.contrasenaNueva = 'Mínimo 8 caracteres'
  else if (!/[A-Z]/.test(formPass.contrasenaNueva))
    erroresPass.contrasenaNueva = 'Debe tener al menos una mayúscula'
  else if (!/[0-9]/.test(formPass.contrasenaNueva))
    erroresPass.contrasenaNueva = 'Debe tener al menos un número'
  if (formPass.contrasenaNueva !== formPass.confirmar)
    erroresPass.confirmar = 'Las contraseñas no coinciden'
  return !erroresPass.contrasenaActual && !erroresPass.contrasenaNueva && !erroresPass.confirmar
}

const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await usuariosServicio.perfil()
    const u = data.datos
    formPerfil.nombre   = u.nombre   ?? ''
    formPerfil.telefono = u.telefono ?? ''
    formPerfil.empresa  = u.empresa  ?? ''
  } catch {
    uiStore.error('Error', 'No se pudo cargar el perfil')
  } finally {
    cargando.value = false
  }
}

const guardarPerfil = async () => {
  if (!formPerfil.nombre.trim()) {
    uiStore.advertencia('Campo requerido', 'El nombre no puede estar vacío')
    return
  }
  guardandoPerfil.value = true
  try {
    await usuariosServicio.actualizarPerfil({
      nombre:   formPerfil.nombre,
      telefono: formPerfil.telefono || null,
      empresa:  formPerfil.empresa  || null,
    })
    uiStore.exito('Perfil actualizado', 'Tus datos han sido guardados')
  } catch (err) {
    uiStore.error('Error', extraerMensaje(err))
  } finally {
    guardandoPerfil.value = false
  }
}

const cambiarContrasena = async () => {
  if (!validarPass()) return
  guardandoPass.value = true
  try {
    await usuariosServicio.cambiarContrasena({
      contrasenaActual: formPass.contrasenaActual,
      contrasenaNueva:  formPass.contrasenaNueva,
    })
    uiStore.exito('Contraseña actualizada', 'Usa tu nueva contraseña en el próximo inicio de sesión')
    formPass.contrasenaActual = ''
    formPass.contrasenaNueva  = ''
    formPass.confirmar        = ''
  } catch (err) {
    uiStore.error('Error', extraerMensaje(err))
  } finally {
    guardandoPass.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 pt-24 pb-10 space-y-6">
    <div class="bg-[#13151f] border border-white/5 rounded-2xl p-6 flex items-center gap-5">
      <div class="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center text-2xl font-black text-violet-300 shrink-0">
        {{ iniciales }}
      </div>
      <div>
        <h1 class="text-xl font-black text-white">{{ authStore.nombreUsuario }}</h1>
        <p class="text-slate-400 text-sm mt-0.5">{{ authStore.usuario?.correo }}</p>
        <span class="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Cliente
        </span>
      </div>
    </div>

    <div class="flex gap-1 bg-white/5 p-1 rounded-xl">
      <button
        class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
        :class="tabActiva === 'perfil' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'"
        @click="tabActiva = 'perfil'"
      >
        Mis datos
      </button>
      <button
        class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
        :class="tabActiva === 'seguridad' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'"
        @click="tabActiva = 'seguridad'"
      >
        Seguridad
      </button>
    </div>

    <div v-if="cargando" class="space-y-4">
      <div class="h-64 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <template v-else>
      <div v-if="tabActiva === 'perfil'" class="bg-[#13151f] border border-white/5 rounded-2xl p-6 space-y-5">
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
            <AppInput v-model="formPerfil.nombre" label="Nombre completo" placeholder="Tu nombre" requerido />
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Correo electrónico
              <span class="ml-1 text-slate-600 font-normal normal-case">(no editable)</span>
            </label>
            <input
              :value="authStore.usuario?.correo"
              type="email"
              readonly
              class="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 text-slate-500 text-sm outline-none cursor-not-allowed"
            />
          </div>
          <AppInput v-model="formPerfil.telefono" label="Teléfono" placeholder="+57 300 000 0000" />
          <div class="sm:col-span-2">
            <AppInput v-model="formPerfil.empresa" label="Empresa" placeholder="Nombre de tu empresa" />
          </div>
        </div>

        <div class="flex justify-end pt-1">
          <AppBoton variante="primario" :cargando="guardandoPerfil" @click="guardarPerfil">
            Guardar cambios
          </AppBoton>
        </div>
      </div>

      <div v-if="tabActiva === 'seguridad'" class="bg-[#13151f] border border-white/5 rounded-2xl p-6 space-y-5">
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
            v-model="formPass.contrasenaActual"
            label="Contraseña actual"
            tipo="password"
            :error="erroresPass.contrasenaActual"
          />
          <AppInput
            v-model="formPass.contrasenaNueva"
            label="Nueva contraseña"
            tipo="password"
            ayuda="Mínimo 8 caracteres, una mayúscula y un número"
            :error="erroresPass.contrasenaNueva"
          />
          <AppInput
            v-model="formPass.confirmar"
            label="Confirmar nueva contraseña"
            tipo="password"
            :error="erroresPass.confirmar"
          />
        </div>

        <div class="flex justify-end pt-1">
          <AppBoton variante="peligro" :cargando="guardandoPass" @click="cambiarContrasena">
            Cambiar contraseña
          </AppBoton>
        </div>
      </div>
    </template>

    <div class="flex items-center gap-2 pt-2">
      <RouterLink
        :to="{ name: 'cliente-cotizaciones' }"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Mis cotizaciones
      </RouterLink>
    </div>
  </div>
</template>