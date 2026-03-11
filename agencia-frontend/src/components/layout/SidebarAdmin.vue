<script setup lang="ts">
import { useRoute }   from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useEnv }     from '@/composables/useEnv'

const route   = useRoute()
const ui      = useUiStore()
const { nombreApp, letraLogo } = useEnv()

const abierto = computed(() => ui.sidebarAbierto)

interface Enlace  { nombre: string; ruta: string; icono: string }
interface Seccion { titulo: string; enlaces: Enlace[] }

const SECCIONES: Seccion[] = [
  {
    titulo: 'Principal',
    enlaces: [
      { nombre: 'Dashboard',   ruta: 'admin-dashboard',   icono: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    ],
  },
  {
    titulo: 'CRM',
    enlaces: [
      { nombre: 'Prospectos',  ruta: 'admin-prospectos',  icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { nombre: 'Cotizaciones', ruta: 'admin-cotizaciones', icono: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    ],
  },
  {
    titulo: 'Contenido',
    enlaces: [
      { nombre: 'Proyectos',   ruta: 'admin-proyectos',   icono: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
      { nombre: 'Servicios',   ruta: 'admin-servicios',   icono: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
      { nombre: 'Testimonios', ruta: 'admin-testimonios', icono: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    ],
  },
  {
    titulo: 'Sistema',
    enlaces: [
      { nombre: 'Usuarios',    ruta: 'admin-usuarios',    icono: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    ],
  },
]

const esActivo = (ruta: string) => route.name === ruta
</script>

<template>
  <aside
    class="shrink-0 flex flex-col bg-[#0d0d16] border-r border-white/5 overflow-hidden transition-all duration-300"
    :class="abierto ? 'w-60' : 'w-16'"
  >
    <div class="flex items-center h-16 px-4 border-b border-white/5 shrink-0">
      <RouterLink :to="{ name: 'admin-dashboard' }" class="flex items-center gap-3 min-w-0">
        <div class="shrink-0 w-8 h-8 rounded-xl bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center shadow-lg shadow-violeta/25">
          <span class="text-white font-black text-sm leading-none select-none">{{ letraLogo }}</span>
        </div>
        <span v-show="abierto" class="text-white font-bold text-base tracking-tight whitespace-nowrap truncate">
          {{ nombreApp }}<span class="text-violeta-claro">.</span>
        </span>
      </RouterLink>
    </div>

    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5 scrollbar-thin">
      <div v-for="seccion in SECCIONES" :key="seccion.titulo">
        <p v-show="abierto" class="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gris-oscuro select-none">
          {{ seccion.titulo }}
        </p>
        <div v-show="!abierto" class="h-px bg-white/5 mx-2 mb-3" />

        <ul class="space-y-0.5">
          <li v-for="enlace in seccion.enlaces" :key="enlace.nombre">
            <RouterLink
              :to="{ name: enlace.ruta }"
              :title="!abierto ? enlace.nombre : undefined"
              class="relative flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-colors duration-150 overflow-hidden border"
              :class="esActivo(enlace.ruta)
                ? 'bg-violeta/15 text-violeta-claro border-violeta/20'
                : 'text-gris-medio hover:text-white hover:bg-white/5 border-transparent'"
            >
              <span v-if="esActivo(enlace.ruta)" class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violeta-claro rounded-r-full" />
              <svg
                class="shrink-0 transition-colors"
                :class="esActivo(enlace.ruta) ? 'text-violeta-claro' : 'text-gris-oscuro'"
                style="width:18px;height:18px;min-width:18px"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="enlace.icono" />
              </svg>
              <span v-show="abierto" class="truncate leading-none">{{ enlace.nombre }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>