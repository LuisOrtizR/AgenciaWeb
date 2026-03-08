<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const menuAbierto   = ref(false)
const scrolled      = ref(false)
const menuUsuario   = ref(false)

const enlaces = [
  { nombre: 'Inicio',     ruta: { name: 'inicio' } },
  { nombre: 'Servicios',  ruta: { name: 'servicios' } },
  { nombre: 'Portafolio', ruta: { name: 'proyectos' } },
  { nombre: 'Testimonios',  ruta: { name: 'testimonios' } },
  { nombre: 'Contacto',   ruta: { name: 'contacto' } },
]

const esActivo = (nombre: string) => {
  const mapa: Record<string, string[]> = {
    inicio:    ['inicio'],
    servicios: ['servicios', 'servicio-detalle'],
    proyectos: ['proyectos', 'proyecto-detalle'],
    testimonios:  ['testimonios'],
    contacto:  ['contacto'],
  }
  return mapa[nombre.toLowerCase()]?.includes(route.name as string) ?? false
}

const iniciales = computed(() =>
  (authStore.nombreUsuario || 'U')
    .split(' ')
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('')
)

const destinoPerfil = computed(() =>
  authStore.usuario?.rol === 'ADMIN'
    ? { name: 'admin-dashboard' }
    : { name: 'cliente-perfil' }
)

const cerrarSesion = () => {
  menuUsuario.value = false
  menuAbierto.value = false
  authStore.cerrarSesion()
  router.push({ name: 'inicio' })
}

const manejarScroll = () => { scrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', manejarScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', manejarScroll))
</script>

<template>
  <header
    class="fixed top-0 inset-x-0 z-40 transition-all duration-300"
    :class="scrolled
      ? 'bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20'
      : 'bg-transparent'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">

        <!-- Logo -->
        <RouterLink :to="{ name: 'inicio' }" class="flex items-center gap-2.5 shrink-0 group">
          <div class="w-8 h-8 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all">
            <span class="text-white font-black text-sm">N</span>
          </div>
          <span class="text-white font-bold text-lg tracking-tight">
            Nexova<span class="text-violet-400">.</span>
          </span>
        </RouterLink>

        <!-- Nav desktop -->
        <nav class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="enlace in enlaces"
            :key="enlace.nombre"
            :to="enlace.ruta"
            class="relative px-4 py-2 rounded-lg text-sm font-medium transition-all"
            :class="esActivo(enlace.nombre)
              ? 'text-white bg-white/8'
              : 'text-gray-400 hover:text-white hover:bg-white/5'"
          >
            {{ enlace.nombre }}
            <span
              v-if="esActivo(enlace.nombre)"
              class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400"
            />
          </RouterLink>
        </nav>

        <!-- Acciones desktop -->
        <div class="hidden md:flex items-center gap-3">

          <!-- Usuario autenticado -->
          <template v-if="authStore.estaAutenticado">
            <div class="relative">
              <button
                class="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-white/5 transition-all"
                @click="menuUsuario = !menuUsuario"
              >
                <div class="w-7 h-7 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {{ iniciales }}
                </div>
                <div class="text-left">
                  <p class="text-xs font-medium text-white leading-none">{{ authStore.nombreUsuario }}</p>
                  <p class="text-[10px] text-gray-500 mt-0.5 capitalize">
                    {{ authStore.usuario?.rol === 'ADMIN' ? 'Administrador' : 'Cliente' }}
                  </p>
                </div>
                <svg class="w-3.5 h-3.5 text-gray-500 transition-transform" :class="menuUsuario ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown -->
              <Transition name="dropdown">
                <div
                  v-if="menuUsuario"
                  class="absolute right-0 top-full mt-2 w-52 bg-[#13151f] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                  <div class="px-4 py-3 border-b border-white/5">
                    <p class="text-sm font-medium text-white truncate">{{ authStore.nombreUsuario }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ authStore.usuario?.correo }}</p>
                  </div>
                  <div class="p-1.5">
                    <RouterLink
                      :to="destinoPerfil"
                      class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                      @click="menuUsuario = false"
                    >
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {{ authStore.usuario?.rol === 'ADMIN' ? 'Panel admin' : 'Mi cuenta' }}
                    </RouterLink>
                  </div>
                  <div class="p-1.5 border-t border-white/5">
                    <button
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      @click="cerrarSesion"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </template>

          <!-- No autenticado -->
          <template v-else>
            <RouterLink
              :to="{ name: 'login' }"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Iniciar sesión
            </RouterLink>
            <RouterLink
              :to="{ name: 'registro' }"
              class="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/25"
            >
              Registrarse
            </RouterLink>
          </template>

          <!-- Botón cotizar (siempre visible) -->
          <RouterLink
            :to="{ name: 'contacto' }"
            class="px-4 py-2 rounded-lg border border-violet-500/30 hover:border-violet-500/60 text-violet-300 hover:text-violet-200 text-sm font-medium transition-all"
          >
            Cotizar →
          </RouterLink>
        </div>

        <!-- Botón menú móvil -->
        <button
          class="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          :aria-label="menuAbierto ? 'Cerrar menú' : 'Abrir menú'"
          @click="menuAbierto = !menuAbierto"
        >
          <svg v-if="!menuAbierto" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Menú móvil -->
    <Transition name="menu-movil">
      <div v-if="menuAbierto" class="md:hidden bg-[#0d0d16]/98 backdrop-blur-xl border-t border-white/5">
        <div class="max-w-7xl mx-auto px-4 py-4 space-y-1">

          <!-- Links nav -->
          <RouterLink
            v-for="enlace in enlaces"
            :key="enlace.nombre"
            :to="enlace.ruta"
            class="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all"
            :class="esActivo(enlace.nombre)
              ? 'text-white bg-violet-600/20 border border-violet-500/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'"
            @click="menuAbierto = false"
          >
            {{ enlace.nombre }}
          </RouterLink>

          <!-- Auth móvil -->
          <div class="pt-3 border-t border-white/5 space-y-2">
            <template v-if="authStore.estaAutenticado">
              <!-- Info usuario -->
              <div class="flex items-center gap-3 px-4 py-3">
                <div class="w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {{ iniciales }}
                </div>
                <div>
                  <p class="text-sm font-medium text-white">{{ authStore.nombreUsuario }}</p>
                  <p class="text-xs text-gray-500 capitalize">
                    {{ authStore.usuario?.rol === 'ADMIN' ? 'Administrador' : 'Cliente' }}
                  </p>
                </div>
              </div>
              <RouterLink
                :to="destinoPerfil"
                class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium"
                @click="menuAbierto = false"
              >
                {{ authStore.usuario?.rol === 'ADMIN' ? 'Panel de administración' : 'Mi cuenta' }}
              </RouterLink>
              <button
                class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                @click="cerrarSesion"
              >
                Cerrar sesión
              </button>
            </template>

            <template v-else>
              <RouterLink
                :to="{ name: 'login' }"
                class="flex items-center justify-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium"
                @click="menuAbierto = false"
              >
                Iniciar sesión
              </RouterLink>
              <RouterLink
                :to="{ name: 'registro' }"
                class="flex items-center justify-center px-4 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold"
                @click="menuAbierto = false"
              >
                Crear cuenta gratis
              </RouterLink>
            </template>

            <RouterLink
              :to="{ name: 'contacto' }"
              class="flex items-center justify-center px-4 py-3 rounded-xl border border-violet-500/30 text-violet-300 text-sm font-medium"
              @click="menuAbierto = false"
            >
              Cotizar proyecto →
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.menu-movil-enter-active,
.menu-movil-leave-active {
  transition: all 0.2s ease;
}
.menu-movil-enter-from,
.menu-movil-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>