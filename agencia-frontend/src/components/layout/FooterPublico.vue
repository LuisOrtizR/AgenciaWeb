<script setup lang="ts">
import { useEnv } from '@/composables/useEnv'

// ── Variables de entorno (con fallbacks seguros) ───────────────
const {
  nombreApp,
  letraLogo,
  empresaCorreo,
  celularFormateado,
  whatsappUrl,
  empresaPais,
  githubUrl,
  linkedinUrl,
  instagramUrl,
} = useEnv()

const anioActual = new Date().getFullYear()

// ── Datos de navegación ────────────────────────────────────────
const enlacesServicios = [
  { nombre: 'Landing Pages',       ruta: { name: 'servicios' } },
  { nombre: 'Sitios Corporativos', ruta: { name: 'servicios' } },
  { nombre: 'Tiendas Online',      ruta: { name: 'servicios' } },
  { nombre: 'Aplicaciones SaaS',   ruta: { name: 'servicios' } },
  { nombre: 'Mantenimiento',       ruta: { name: 'servicios' } },
]

const enlacesEmpresa = [
  { nombre: 'Portafolio', ruta: { name: 'proyectos' } },
  { nombre: 'Contacto',   ruta: { name: 'contacto'  } },
  { nombre: 'Cotizar',    ruta: { name: 'contacto'  } },
]

const redesSociales = [
  {
    nombre: 'GitHub',
    url: githubUrl,
    icono: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
  },
  {
    nombre: 'LinkedIn',
    url: linkedinUrl,
    icono: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    nombre: 'Instagram',
    url: instagramUrl,
    icono: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
]
</script>

<template>
  <footer class="bg-[#0a0a0f] border-t border-white/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      <!-- ── Grid principal ─────────────────────────────────────── -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

        <!-- Col 1 — Marca + contacto -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Logotipo -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center shadow-lg shadow-violeta/30">
              <span class="text-white font-bold text-base">{{ letraLogo }}</span>
            </div>
            <span class="text-white font-bold text-xl tracking-tight">
              {{ nombreApp }}<span class="text-violeta">.</span>
            </span>
          </div>

          <p class="text-gris-medio text-sm leading-relaxed max-w-sm">
            Agencia de desarrollo web especializada en crear experiencias digitales
            que impulsan el crecimiento de tu negocio. Desde landing pages hasta
            plataformas SaaS completas.
          </p>

          <!-- Contacto directo -->
          <div class="space-y-2.5">
            <a
              :href="`mailto:${empresaCorreo}`"
              class="flex items-center gap-2 text-gris-medio hover:text-violeta-claro text-sm transition-colors group"
            >
              <svg class="w-4 h-4 shrink-0 text-violeta/50 group-hover:text-violeta transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {{ empresaCorreo }}
            </a>
            <a
              :href="whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-gris-medio hover:text-violeta-claro text-sm transition-colors group"
            >
              <svg class="w-4 h-4 shrink-0 text-violeta/50 group-hover:text-violeta transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {{ celularFormateado }}
            </a>
          </div>

          <!-- Redes sociales -->
          <div class="flex items-center gap-3">
            <a
              v-for="red in redesSociales"
              :key="red.nombre"
              :href="red.url"
              :aria-label="red.nombre"
              target="_blank"
              rel="noopener noreferrer"
              class="w-9 h-9 rounded-lg bg-white/5 hover:bg-violeta/20 border border-white/5 hover:border-violeta/30 flex items-center justify-center transition-all group"
            >
              <svg class="w-4 h-4 text-gris-medio group-hover:text-violeta-claro transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path :d="red.icono" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Col 2 — Servicios -->
        <div class="space-y-5">
          <h3 class="text-white font-semibold text-sm tracking-wide uppercase">Servicios</h3>
          <ul class="space-y-3">
            <li v-for="enlace in enlacesServicios" :key="enlace.nombre">
              <RouterLink
                :to="enlace.ruta"
                class="text-gris-medio hover:text-blanco-suave text-sm transition-colors flex items-center gap-2 group"
              >
                <span class="w-1 h-1 rounded-full bg-violeta/40 group-hover:bg-violeta transition-colors" />
                {{ enlace.nombre }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Col 3 — Empresa -->
        <div class="space-y-5">
          <h3 class="text-white font-semibold text-sm tracking-wide uppercase">Empresa</h3>
          <ul class="space-y-3">
            <li v-for="enlace in enlacesEmpresa" :key="enlace.nombre">
              <RouterLink
                :to="enlace.ruta"
                class="text-gris-medio hover:text-blanco-suave text-sm transition-colors flex items-center gap-2 group"
              >
                <span class="w-1 h-1 rounded-full bg-violeta/40 group-hover:bg-violeta transition-colors" />
                {{ enlace.nombre }}
              </RouterLink>
            </li>
          </ul>

          <!-- CTA -->
          <div class="pt-2">
            <RouterLink
              :to="{ name: 'contacto' }"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violeta/10 hover:bg-violeta/20 border border-violeta/20 text-violeta-claro text-sm font-medium transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Cotizar proyecto
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- ── Barra inferior ─────────────────────────────────────── -->
      <div class="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-gris-medio text-xs">
          © {{ anioActual }} {{ nombreApp }}. Todos los derechos reservados.
        </p>
        <p class="text-gris-medio text-xs">
          Hecho con <span class="text-rojo">♥</span> en {{ empresaPais }}
        </p>
      </div>
    </div>
  </footer>
</template>