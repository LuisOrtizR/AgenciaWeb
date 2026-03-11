<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore }        from '@/stores/auth'
import { useEnv }              from '@/composables/useEnv'

const route     = useRoute()
const router    = useRouter()
const auth      = useAuthStore()
const { nombreApp, letraLogo } = useEnv()

const menuMovil   = ref(false)
const menuUsuario = ref(false)
const scrolled    = ref(false)
const navRef      = useTemplateRef<HTMLElement>('navRef')

const ENLACES = [
  { nombre: 'Inicio',      ruta: { name: 'inicio'      } },
  { nombre: 'Servicios',   ruta: { name: 'servicios'   } },
  { nombre: 'Portafolio',  ruta: { name: 'proyectos'   } },
  { nombre: 'Testimonios', ruta: { name: 'testimonios' } },
  { nombre: 'Contacto',    ruta: { name: 'contacto'    } },
]

const RUTAS_ACTIVAS: Record<string, string[]> = {
  inicio:      ['inicio'],
  servicios:   ['servicios', 'servicio-detalle'],
  portafolio:  ['proyectos', 'proyecto-detalle'],
  testimonios: ['testimonios'],
  contacto:    ['contacto'],
}

const esActivo   = (nombre: string) => RUTAS_ACTIVAS[nombre.toLowerCase()]?.includes(route.name as string) ?? false
const esAdmin    = computed(() => auth.usuario?.rol === 'ADMIN')
const iniciales  = computed(() =>
  (auth.nombreUsuario || 'U').split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
)

const cerrar = () => { menuMovil.value = false; menuUsuario.value = false }

const cerrarSesion = () => {
  cerrar()
  auth.cerrarSesion()
  router.push({ name: 'inicio' })
}

const onClickOutside = (e: MouseEvent) => {
  if (navRef.value && !navRef.value.contains(e.target as Node)) menuUsuario.value = false
}
const onScroll = () => { scrolled.value = window.scrollY > 20 }

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('mousedown', onClickOutside)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('mousedown', onClickOutside)
})
</script>

<template>
  <header
    ref="navRef"
    class="fixed top-0 inset-x-0 z-40 transition-all duration-300"
    :class="scrolled ? 'bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20' : 'bg-transparent'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">

        <RouterLink :to="{ name: 'inicio' }" class="flex items-center gap-2.5 shrink-0 group">
          <div class="w-8 h-8 rounded-xl bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center shadow-lg shadow-violeta/30 group-hover:shadow-violeta/50 transition-all">
            <span class="text-white font-black text-sm select-none">{{ letraLogo }}</span>
          </div>
          <span class="text-white font-bold text-lg tracking-tight">
            {{ nombreApp }}<span class="text-violeta-claro">.</span>
          </span>
        </RouterLink>

        <nav class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="enlace in ENLACES"
            :key="enlace.nombre"
            :to="enlace.ruta"
            class="relative px-4 py-2 rounded-lg text-sm font-medium transition-all"
            :class="esActivo(enlace.nombre)
              ? 'text-white bg-white/8'
              : 'text-gris-medio hover:text-white hover:bg-white/5'"
          >
            {{ enlace.nombre }}
            <span v-if="esActivo(enlace.nombre)" class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violeta-claro" />
          </RouterLink>
        </nav>

        <div class="hidden md:flex items-center gap-2">
          <template v-if="auth.estaAutenticado">
            <RouterLink
              :to="{ name: 'contacto' }"
              class="px-4 py-2 rounded-lg border border-violeta/30 hover:border-violeta/60 text-violeta-claro hover:text-white text-sm font-medium transition-all"
            >
              Cotizar &rarr;
            </RouterLink>

            <div class="relative">
              <button
                class="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                @click="menuUsuario = !menuUsuario"
              >
                <div class="w-7 h-7 rounded-full bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-white/10 select-none">
                  {{ iniciales }}
                </div>
                <div class="text-left">
                  <p class="text-xs font-medium text-white leading-none">{{ auth.nombreUsuario }}</p>
                  <p class="text-[10px] text-gris-medio mt-0.5">{{ esAdmin ? 'Administrador' : 'Cliente' }}</p>
                </div>
                <svg class="w-3 h-3 text-gris-medio transition-transform duration-200" :class="menuUsuario ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <Transition
                enter-active-class="transition-all duration-150 ease-out"
                leave-active-class="transition-all duration-100 ease-in"
                enter-from-class="opacity-0 scale-95 -translate-y-1"
                leave-to-class="opacity-0 scale-95 -translate-y-1"
              >
                <div v-if="menuUsuario" class="absolute right-0 top-full mt-2 w-52 bg-[#13151f] border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50 origin-top-right">
                  <div class="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0 select-none">
                      {{ iniciales }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-white truncate">{{ auth.nombreUsuario }}</p>
                      <p class="text-xs text-gris-medio truncate">{{ auth.usuario?.correo }}</p>
                    </div>
                  </div>

                  <div class="p-1.5 space-y-0.5">
                    <RouterLink v-if="esAdmin" :to="{ name: 'admin-dashboard' }" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gris-medio hover:text-white hover:bg-white/5 transition-colors" @click="menuUsuario = false">
                      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                      Panel admin
                    </RouterLink>
                    <RouterLink v-else :to="{ name: 'cliente-cotizaciones' }" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gris-medio hover:text-white hover:bg-white/5 transition-colors" @click="menuUsuario = false">
                      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      Mis cotizaciones
                    </RouterLink>
                    <RouterLink v-if="!esAdmin" :to="{ name: 'cliente-perfil' }" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gris-medio hover:text-white hover:bg-white/5 transition-colors" @click="menuUsuario = false">
                      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Mi perfil
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
          </template>

          <template v-else>
            <RouterLink :to="{ name: 'login' }" class="px-4 py-2 rounded-lg text-sm font-medium text-gris-medio hover:text-white hover:bg-white/5 transition-all">
              Iniciar sesion
            </RouterLink>
            <RouterLink :to="{ name: 'registro' }" class="px-4 py-2 rounded-lg bg-violeta hover:bg-violeta/90 text-white text-sm font-semibold transition-all shadow-lg shadow-violeta/25">
              Registrarse
            </RouterLink>
            <RouterLink :to="{ name: 'contacto' }" class="px-4 py-2 rounded-lg border border-violeta/30 hover:border-violeta/60 text-violeta-claro text-sm font-medium transition-all">
              Cotizar &rarr;
            </RouterLink>
          </template>
        </div>

        <button
          class="md:hidden p-2 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all"
          :aria-label="menuMovil ? 'Cerrar menu' : 'Abrir menu'"
          @click="menuMovil = !menuMovil"
        >
          <svg v-if="!menuMovil" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 -translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="menuMovil" class="md:hidden bg-[#0d0d16]/98 backdrop-blur-xl border-t border-white/5">
        <div class="max-w-7xl mx-auto px-4 py-4 space-y-1">
          <RouterLink
            v-for="enlace in ENLACES"
            :key="enlace.nombre"
            :to="enlace.ruta"
            class="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all"
            :class="esActivo(enlace.nombre)
              ? 'text-white bg-violeta/20 border border-violeta/20'
              : 'text-gris-medio hover:text-white hover:bg-white/5'"
            @click="menuMovil = false"
          >
            {{ enlace.nombre }}
          </RouterLink>

          <div class="pt-3 mt-1 border-t border-white/5 space-y-2">
            <template v-if="auth.estaAutenticado">
              <div class="flex items-center gap-3 px-4 py-2">
                <div class="w-8 h-8 rounded-full bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0 select-none">
                  {{ iniciales }}
                </div>
                <div>
                  <p class="text-sm font-medium text-white">{{ auth.nombreUsuario }}</p>
                  <p class="text-xs text-gris-medio">{{ esAdmin ? 'Administrador' : 'Cliente' }}</p>
                </div>
              </div>

              <RouterLink v-if="esAdmin" :to="{ name: 'admin-dashboard' }" class="flex items-center justify-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-blanco-suave text-sm font-medium hover:bg-white/8 transition-all" @click="cerrar">
                Panel de administracion
              </RouterLink>
              <template v-else>
                <RouterLink :to="{ name: 'cliente-cotizaciones' }" class="flex items-center justify-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-blanco-suave text-sm font-medium hover:bg-white/8 transition-all" @click="cerrar">
                  Mis cotizaciones
                </RouterLink>
                <RouterLink :to="{ name: 'cliente-perfil' }" class="flex items-center justify-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-blanco-suave text-sm font-medium hover:bg-white/8 transition-all" @click="cerrar">
                  Mi perfil
                </RouterLink>
              </template>

              <RouterLink :to="{ name: 'contacto' }" class="flex items-center justify-center px-4 py-3 rounded-xl border border-violeta/30 text-violeta-claro text-sm font-medium" @click="cerrar">
                Cotizar proyecto &rarr;
              </RouterLink>
              <button class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-rojo hover:bg-rojo/10 transition-all" @click="cerrarSesion">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Cerrar sesion
              </button>
            </template>

            <template v-else>
              <RouterLink :to="{ name: 'login' }" class="flex items-center justify-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-blanco-suave text-sm font-medium" @click="menuMovil = false">
                Iniciar sesion
              </RouterLink>
              <RouterLink :to="{ name: 'registro' }" class="flex items-center justify-center px-4 py-3 rounded-xl bg-violeta text-white text-sm font-semibold" @click="menuMovil = false">
                Crear cuenta gratis
              </RouterLink>
              <RouterLink :to="{ name: 'contacto' }" class="flex items-center justify-center px-4 py-3 rounded-xl border border-violeta/30 text-violeta-claro text-sm font-medium" @click="menuMovil = false">
                Cotizar proyecto &rarr;
              </RouterLink>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>