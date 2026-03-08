<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore }   from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const route     = useRoute()
const uiStore   = useUiStore()
const authStore = useAuthStore()

const abierto = computed(() => uiStore.sidebarAbierto)

interface Enlace {
  nombre: string
  ruta:   string
  icono:  string
}

interface Seccion {
  titulo:  string
  enlaces: Enlace[]
}

const secciones: Seccion[] = [
  {
    titulo: 'Principal',
    enlaces: [
      {
        nombre: 'Dashboard',
        ruta: 'admin-dashboard',
        icono: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
    ],
  },
  {
    titulo: 'CRM',
    enlaces: [
      {
        nombre: 'Prospectos',
        ruta: 'admin-prospectos',
        icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      },
      {
        nombre: 'Cotizaciones',
        ruta: 'admin-cotizaciones',
        icono: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      },
    ],
  },
  {
    titulo: 'Contenido',
    enlaces: [
      {
        nombre: 'Proyectos',
        ruta: 'admin-proyectos',
        icono: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      },
      {
        nombre: 'Servicios',
        ruta: 'admin-servicios',
        icono: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      },
      {
        nombre: 'Testimonios',
        ruta: 'admin-testimonios',
        icono: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      },
    ],
  },
  {
    titulo: 'Sistema',
    enlaces: [
      {
        nombre: 'Usuarios',
        ruta: 'admin-usuarios',
        icono: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      },
    ],
  },
]

const esActivo = (ruta: string) => route.name === ruta
</script>

<template>
  <aside
    class="shrink-0 flex flex-col bg-[#0d0d16] border-r border-white/5 transition-all duration-300 overflow-hidden"
    :class="abierto ? 'w-60' : 'w-16'"
  >
    <!-- Logo -->
    <div class="flex items-center h-16 px-4 border-b border-white/5 shrink-0">
      <RouterLink :to="{ name: 'admin-dashboard' }" class="flex items-center gap-3 min-w-0">
        <div class="w-8 h-8 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30">
          <span class="text-white font-black text-sm">N</span>
        </div>
        <Transition name="label">
          <span v-if="abierto" class="text-white font-bold text-base tracking-tight whitespace-nowrap overflow-hidden">
            Nexova<span class="text-violet-400">.</span>
          </span>
        </Transition>
      </RouterLink>
    </div>

    <!-- Navegación -->
    <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-6">
      <div v-for="seccion in secciones" :key="seccion.titulo">
        <!-- Título de sección -->
        <Transition name="label">
          <p v-if="abierto" class="px-3 mb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            {{ seccion.titulo }}
          </p>
        </Transition>
        <div v-if="!abierto" class="h-px bg-white/5 mx-2 mb-3" />

        <ul class="space-y-0.5">
          <li v-for="enlace in seccion.enlaces" :key="enlace.nombre">
            <RouterLink
              :to="{ name: enlace.ruta }"
              :title="!abierto ? enlace.nombre : undefined"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
              :class="esActivo(enlace.ruta)
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'"
            >
              <svg
                class="w-5 h-5 shrink-0 transition-colors"
                :class="esActivo(enlace.ruta) ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="enlace.icono" />
              </svg>
              <Transition name="label">
                <span v-if="abierto" class="truncate">{{ enlace.nombre }}</span>
              </Transition>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Footer: perfil + cerrar sesión -->
    <div class="shrink-0 p-2 border-t border-white/5 space-y-0.5">
      <RouterLink
        :to="{ name: 'admin-perfil' }"
        :title="!abierto ? 'Mi perfil' : undefined"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
        :class="esActivo('admin-perfil') ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20' : ''"
      >
        <div class="w-5 h-5 rounded-full bg-linear-to-br from-violet-500/40 to-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-violet-300 shrink-0">
          {{ (authStore.nombreUsuario || 'U')[0]?.toUpperCase() ?? 'U' }}
        </div>
        <Transition name="label">
          <span v-if="abierto" class="truncate">{{ authStore.nombreUsuario || 'Mi perfil' }}</span>
        </Transition>
      </RouterLink>

      <button
        :title="!abierto ? 'Cerrar sesión' : undefined"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        @click="authStore.cerrarSesion()"
      >
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <Transition name="label">
          <span v-if="abierto" class="truncate">Cerrar sesión</span>
        </Transition>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.label-enter-active,
.label-leave-active {
  transition: opacity 0.15s ease, width 0.15s ease;
}
.label-enter-from,
.label-leave-to {
  opacity: 0;
  width: 0;
}
</style>