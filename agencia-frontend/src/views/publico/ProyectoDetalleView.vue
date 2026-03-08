<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { proyectosServicio } from '@/services/servicios'
import type { Proyecto } from '@/types'

const route    = useRoute()
const router   = useRouter()
const proyecto = ref<Proyecto | null>(null)
const cargando = ref(true)

onMounted(async () => {
  try {
    const { data } = await proyectosServicio.obtenerPorSlug(route.params.slug as string)
    proyecto.value = data.datos
  } catch {
    router.push({ name: 'no-encontrado' })
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f]">

    <div v-if="cargando" class="max-w-5xl mx-auto px-6 pt-32 space-y-5">
      <div class="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
      <div class="h-12 w-2/3 bg-white/5 rounded-xl animate-pulse" />
      <div class="h-5 w-full bg-white/5 rounded-lg animate-pulse" />
      <div class="h-80 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <template v-else-if="proyecto">

      <div class="relative overflow-hidden pt-32 pb-6 px-6">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute top-0 left-1/3 w-96 h-72 bg-violet-600/6 rounded-full blur-[100px]" />
        </div>
        <div class="relative max-w-5xl mx-auto">

          <div class="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <RouterLink :to="{ name: 'proyectos' }" class="hover:text-white transition-colors">Portafolio</RouterLink>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span class="text-gray-300 truncate max-w-xs">{{ proyecto.titulo }}</span>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">

            <div class="lg:col-span-8 space-y-6">

              <div>
                <div v-if="proyecto.servicio" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-4">
                  {{ proyecto.servicio.nombre }}
                </div>
                <h1 class="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">{{ proyecto.titulo }}</h1>
                <p class="text-gray-400 text-lg leading-relaxed">{{ proyecto.descripcion }}</p>
              </div>

              <div class="rounded-2xl overflow-hidden bg-linear-to-br from-violet-600/8 to-indigo-600/5 border border-white/6">
                <img
                  v-if="proyecto.imagenUrl"
                  :src="proyecto.imagenUrl"
                  :alt="proyecto.titulo"
                  class="w-full object-cover max-h-120"
                />
                <div v-else class="h-64 flex items-center justify-center">
                  <svg class="w-16 h-16 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div class="p-6 rounded-2xl bg-[#111118] border border-white/6">
                <h3 class="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Stack tecnológico</h3>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tech in proyecto.stackTecnico"
                    :key="tech"
                    class="px-3 py-1.5 rounded-xl bg-white/4 border border-white/8 text-sm text-gray-300 font-medium hover:border-violet-500/30 hover:text-violet-300 transition-colors"
                  >
                    {{ tech }}
                  </span>
                </div>
              </div>

              <div v-if="proyecto.testimonios?.length" class="space-y-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest">Lo que dice el cliente</p>
                <div
                  v-for="t in proyecto.testimonios"
                  :key="t.id"
                  class="p-6 rounded-2xl bg-[#111118] border border-white/6 relative overflow-hidden"
                >
                  <div class="absolute top-4 right-5 text-5xl text-violet-500/10 font-serif leading-none select-none">"</div>
                  <div class="flex items-center gap-1 mb-3">
                    <span v-for="n in 5" :key="n" class="text-sm" :class="n <= t.calificacion ? 'text-yellow-400' : 'text-white/10'">★</span>
                  </div>
                  <p class="text-gray-300 leading-relaxed italic mb-4">"{{ t.contenido }}"</p>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {{ t.nombreCliente[0]?.toUpperCase() }}
                    </div>
                    <span class="text-sm font-medium text-white">{{ t.nombreCliente }}</span>
                  </div>
                </div>
              </div>

            </div>

            <div class="lg:col-span-4 space-y-4">

              <div class="sticky top-24 space-y-4">

                <div class="p-5 rounded-2xl bg-[#111118] border border-white/6 space-y-3">
                  <a
                    v-if="proyecto.urlEnVivo"
                    :href="proyecto.urlEnVivo"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-500/40"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver en vivo
                  </a>
                  <a
                    v-if="proyecto.urlGithub"
                    :href="proyecto.urlGithub"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/8 text-gray-300 hover:text-white font-semibold text-sm transition-all"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    Ver en GitHub
                  </a>
                </div>

                <RouterLink
                  :to="{ name: 'contacto' }"
                  class="flex flex-col items-center gap-1 w-full p-5 rounded-2xl bg-linear-to-br from-violet-600/10 to-indigo-600/8 border border-violet-500/20 hover:border-violet-500/40 transition-all group"
                >
                  <span class="text-sm font-semibold text-white group-hover:text-violet-200 transition-colors">¿Quieres algo similar?</span>
                  <span class="text-xs text-gray-500">Cotiza tu proyecto →</span>
                </RouterLink>

                <div v-if="proyecto.servicio" class="p-5 rounded-2xl bg-[#111118] border border-white/6">
                  <p class="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Categoría</p>
                  <p class="text-white font-medium text-sm">{{ proyecto.servicio.nombre }}</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>