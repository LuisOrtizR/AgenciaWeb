<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import AppBoton  from '@/components/ui/AppBoton.vue'
import AppInput  from '@/components/ui/AppInput.vue'
import type { UsuarioConConteo } from '@/types'

const authStore = useAuthStore()
const uiStore   = useUiStore()

const perfil       = ref<UsuarioConConteo | null>(null)
const cargando     = ref(true)
const guardandoPerfil    = ref(false)
const guardandoContrasena = ref(false)

const formPerfil = reactive({ nombre: '', telefono: '', empresa: '' })
const formContrasena = reactive({ contrasenaActual: '', contrasenaNueva: '', confirmar: '' })
const erroresContrasena = reactive({ contrasenaActual: '', contrasenaNueva: '', confirmar: '' })

onMounted(async () => {
  try {
    const datos = await authStore.obtenerPerfil()
    perfil.value = datos
    formPerfil.nombre   = datos.nombre
    formPerfil.telefono = datos.telefono ?? ''
    formPerfil.empresa  = datos.empresa  ?? ''
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
      nombre:   formPerfil.nombre,
      telefono: formPerfil.telefono || null,
      empresa:  formPerfil.empresa  || null,
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
  erroresContrasena.contrasenaNueva  = ''
  erroresContrasena.confirmar        = ''

  if (!formContrasena.contrasenaActual) {
    erroresContrasena.contrasenaActual = 'Ingresa tu contraseña actual'
    return
  }
  if (formContrasena.contrasenaNueva.length < 8) {
    erroresContrasena.contrasenaNueva = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  if (formContrasena.contrasenaNueva !== formContrasena.confirmar) {
    erroresContrasena.confirmar = 'Las contraseñas no coinciden'
    return
  }

  guardandoContrasena.value = true
  try {
    await authStore.cambiarContrasena({
      contrasenaActual: formContrasena.contrasenaActual,
      contrasenaNueva:  formContrasena.contrasenaNueva,
    })
    uiStore.exito('Contraseña actualizada')
    formContrasena.contrasenaActual = ''
    formContrasena.contrasenaNueva  = ''
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
</script>

<template>
  <div class="space-y-6 max-w-2xl mx-auto">
    <div>
      <h1 class="text-2xl font-bold text-white">Mi perfil</h1>
      <p class="text-gris-medio text-sm mt-1">Actualiza tu información personal y contraseña</p>
    </div>

    <!-- Avatar + info básica -->
    <div class="bg-[#13151f] border border-white/5 rounded-2xl p-6 flex items-center gap-5">
      <div class="w-16 h-16 rounded-2xl bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-lg shadow-violeta/30">
        {{ iniciales }}
      </div>
      <div>
        <p class="text-lg font-semibold text-white">{{ authStore.nombreUsuario }}</p>
        <p class="text-gris-medio text-sm">{{ authStore.usuario?.correo }}</p>
        <span class="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-violeta/10 text-violeta-claro border border-violeta/20">
          {{ authStore.usuario?.rol === 'ADMIN' ? 'Administrador' : 'Cliente' }}
        </span>
      </div>
    </div>

    <!-- Skeleton de carga -->
    <div v-if="cargando" class="space-y-4">
      <div class="h-48 bg-white/5 rounded-2xl animate-pulse" />
      <div class="h-56 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <template v-else>
      <!-- Sección: datos del perfil -->
      <div class="bg-[#13151f] border border-white/5 rounded-2xl p-6 space-y-5">
        <h2 class="text-white font-semibold text-sm">Información personal</h2>

        <div class="space-y-4">
          <AppInput
            v-model="formPerfil.nombre"
            label="Nombre completo"
            placeholder="Tu nombre"
            requerido
          />
          <AppInput
            v-model="formPerfil.telefono"
            label="Teléfono"
            placeholder="+57 300 000 0000"
            tipo="tel"
          />
          <AppInput
            v-model="formPerfil.empresa"
            label="Empresa"
            placeholder="Nombre de tu empresa (opcional)"
          />
        </div>

        <div class="flex justify-end pt-2">
          <AppBoton variante="primario" :cargando="guardandoPerfil" @click="guardarPerfil">
            Guardar cambios
          </AppBoton>
        </div>
      </div>

      <!-- Sección: cambiar contraseña -->
      <div class="bg-[#13151f] border border-white/5 rounded-2xl p-6 space-y-5">
        <h2 class="text-white font-semibold text-sm">Cambiar contraseña</h2>

        <div class="space-y-4">
          <AppInput
            v-model="formContrasena.contrasenaActual"
            label="Contraseña actual"
            tipo="password"
            :error="erroresContrasena.contrasenaActual"
          />
          <AppInput
            v-model="formContrasena.contrasenaNueva"
            label="Nueva contraseña"
            tipo="password"
            ayuda="Mínimo 8 caracteres"
            :error="erroresContrasena.contrasenaNueva"
          />
          <AppInput
            v-model="formContrasena.confirmar"
            label="Confirmar nueva contraseña"
            tipo="password"
            :error="erroresContrasena.confirmar"
          />
        </div>

        <div class="flex justify-end pt-2">
          <AppBoton variante="peligro" :cargando="guardandoContrasena" @click="guardarContrasena">
            Cambiar contraseña
          </AppBoton>
        </div>
      </div>

      <!-- Estadísticas del perfil -->
      <div v-if="perfil" class="bg-[#13151f] border border-white/5 rounded-2xl p-6">
        <h2 class="text-white font-semibold text-sm mb-4">Actividad en el sistema</h2>
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-4 rounded-xl bg-white/3">
            <p class="text-2xl font-bold text-white">{{ perfil._count.prospectos }}</p>
            <p class="text-xs text-gris-medio mt-1">Prospectos</p>
          </div>
          <div class="text-center p-4 rounded-xl bg-white/3">
            <p class="text-2xl font-bold text-white">{{ perfil._count.cotizaciones }}</p>
            <p class="text-xs text-gris-medio mt-1">Cotizaciones</p>
          </div>
          <div class="text-center p-4 rounded-xl bg-white/3">
            <p class="text-2xl font-bold text-white">{{ perfil._count.testimonios }}</p>
            <p class="text-xs text-gris-medio mt-1">Testimonios</p>
          </div>
        </div>
        <p class="text-xs text-gris-medio mt-4 text-center">
          Cuenta creada el {{ new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(perfil.creadoEn)) }}
        </p>
      </div>
    </template>
  </div>
</template>