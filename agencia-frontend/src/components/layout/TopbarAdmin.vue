<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useUiStore }          from '@/stores/ui'
import { useAuthStore }        from '@/stores/auth'
import { useEnv }              from '@/composables/useEnv'

const route     = useRoute()
const router    = useRouter()
const ui        = useUiStore()
const auth      = useAuthStore()
const { nombreApp } = useEnv()

const menuAbierto = ref(false)
const menuRef     = useTemplateRef<HTMLElement>('menuRef')

const titulo = computed(() =>
  (route.meta.titulo as string | undefined)?.split(' — ')[0] ?? 'Panel'
)

const iniciales = computed(() =>
  (auth.nombreUsuario || 'U').split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
)

const cerrarSesion = () => {
  menuAbierto.value = false
  auth.cerrarSesion()
  router.push({ name: 'login' })
}

const irPerfil = () => {
  menuAbierto.value = false
  router.push({ name: 'admin-perfil' })
}

const onClickOutside = (e: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) menuAbierto.value = false
}

onMounted(()  => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <header class="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-[#0d0d16] border-b border-white/5">
    <div class="flex items-center gap-3">
      <button
        class="p-2 rounded-lg text-gris-oscuro hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Alternar sidebar"
        @click="ui.alternarSidebar()"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div>
        <h1 class="text-white font-semibold text-sm leading-none">{{ titulo }}</h1>
        <p class="text-gris-oscuro text-[11px] mt-0.5 hidden sm:block">{{ nombreApp }} Admin</p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <RouterLink
        :to="{ name: 'inicio' }"
        target="_blank"
        class="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gris-medio hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all font-medium"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Ver sitio
      </RouterLink>

      <div class="hidden sm:block w-px h-5 bg-white/10" />

      <div ref="menuRef" class="relative">
        <button
          class="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
          @click="menuAbierto = !menuAbierto"
        >
          <div class="w-7 h-7 rounded-full bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-white/5 select-none">
            {{ iniciales }}
          </div>
          <div class="hidden sm:block text-left">
            <p class="text-xs font-medium text-white leading-none">{{ auth.nombreUsuario }}</p>
            <p class="text-[10px] text-gris-medio mt-0.5 capitalize">{{ auth.usuario?.rol?.toLowerCase() }}</p>
          </div>
          <svg
            class="w-3 h-3 text-gris-oscuro hidden sm:block transition-transform duration-200"
            :class="menuAbierto ? 'rotate-180' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          leave-active-class="transition-all duration-100 ease-in"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div v-if="menuAbierto" class="absolute right-0 top-full mt-2 w-56 bg-[#13151f] border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50 origin-top-right">
            <div class="px-4 py-3 border-b border-white/5 flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center text-sm font-bold text-white shrink-0 select-none">
                {{ iniciales }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ auth.nombreUsuario }}</p>
                <p class="text-xs text-gris-medio truncate">{{ auth.usuario?.correo }}</p>
              </div>
            </div>

            <div class="p-1.5 space-y-0.5">
              <button class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gris-medio hover:text-white hover:bg-white/5 transition-colors text-left" @click="irPerfil">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Mi perfil
              </button>
              <RouterLink :to="{ name: 'inicio' }" target="_blank" class="sm:hidden flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gris-medio hover:text-white hover:bg-white/5 transition-colors" @click="menuAbierto = false">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Ver sitio
              </RouterLink>
            </div>

            <div class="p-1.5 border-t border-white/5">
              <button class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rojo/80 hover:text-rojo hover:bg-rojo/10 transition-colors text-left" @click="cerrarSesion">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Cerrar sesion
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>