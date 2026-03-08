<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore }   from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const route     = useRoute()
const router    = useRouter()
const uiStore   = useUiStore()
const authStore = useAuthStore()

const menuUsuario = ref(false)

const tituloPagina = computed(() =>
  (route.meta.titulo as string | undefined)?.split(' — ')[0] ?? 'Panel'
)

const iniciales = computed(() =>
  (authStore.nombreUsuario || 'U')
    .split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
)

const cerrarSesion = () => {
  menuUsuario.value = false
  authStore.cerrarSesion()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-[#0d0d16] border-b border-white/5">

    <!-- Izquierda -->
    <div class="flex items-center gap-3">
      <button
        class="p-2 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all"
        @click="uiStore.alternarSidebar()"
        aria-label="Alternar sidebar"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div>
        <h1 class="text-white font-semibold text-sm leading-none">{{ tituloPagina }}</h1>
        <p class="text-gris-medio text-[11px] mt-0.5 hidden sm:block">Nexova Studio Admin</p>
      </div>
    </div>

    <!-- Derecha -->
    <div class="flex items-center gap-2">

      <!-- Ver sitio -->
      <RouterLink
        :to="{ name: 'inicio' }"
        target="_blank"
        class="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gris-medio hover:text-blanco-suave hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all font-medium"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Ver sitio
      </RouterLink>

      <div class="hidden sm:block w-px h-5 bg-white/8" />

      <!-- Avatar + dropdown -->
      <div class="relative">
        <button
          class="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/5 transition-all"
          @click="menuUsuario = !menuUsuario"
        >
          <div class="w-7 h-7 rounded-full bg-linear-to-br from-violeta to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm shadow-violeta/40">
            {{ iniciales }}
          </div>
          <div class="hidden sm:block text-left">
            <p class="text-xs font-medium text-blanco-suave leading-none">{{ authStore.nombreUsuario }}</p>
            <p class="text-[10px] text-gris-medio mt-0.5 capitalize">{{ authStore.usuario?.rol?.toLowerCase() }}</p>
          </div>
          <svg class="w-3 h-3 text-gris-medio hidden sm:block transition-transform" :class="menuUsuario ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
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
              <p class="text-xs text-gris-medio truncate">{{ authStore.usuario?.correo }}</p>
            </div>

            <div class="p-1.5 space-y-0.5">
              <RouterLink
                :to="{ name: 'admin-perfil' }"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gris-medio hover:text-blanco-suave hover:bg-white/5 transition-all"
                @click="menuUsuario = false"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mi perfil
              </RouterLink>

              <RouterLink
                :to="{ name: 'inicio' }"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gris-medio hover:text-blanco-suave hover:bg-white/5 transition-all"
                @click="menuUsuario = false"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Sitio público
              </RouterLink>
            </div>

            <div class="p-1.5 border-t border-white/5">
              <button
                class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rojo/80 hover:text-rojo hover:bg-rojo/10 transition-all"
                @click="cerrarSesion"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }
</style>