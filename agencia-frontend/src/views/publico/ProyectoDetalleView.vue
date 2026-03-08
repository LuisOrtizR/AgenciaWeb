<script setup lang="ts">
// ProyectoDetalleView.vue
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { proyectosServicio } from '@/services/servicios'
import type { Proyecto } from '@/types'

const route  = useRoute()
const router = useRouter()

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

const estrellas = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] pt-24 pb-16">
    <div class="max-w-4xl mx-auto px-6">

      <!-- Skeleton -->
      <div v-if="cargando" class="space-y-6">
        <div class="h-10 w-2/3 bg-white/5 rounded-xl animate-pulse" />
        <div class="h-72 bg-white/5 rounded-2xl animate-pulse" />
        <div class="h-40 bg-white/5 rounded-2xl animate-pulse" />
      </div>

      <template v-else-if="proyecto">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gris-medio mb-8">
          <RouterLink :to="{ name: 'proyectos' }" class="hover:text-white transition-colors">Portafolio</RouterLink>
          <span>/</span>
          <span class="text-blanco-suave">{{ proyecto.titulo }}</span>
        </div>

        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-black text-white mb-3">{{ proyecto.titulo }}</h1>
          <p class="text-gris-medio text-lg leading-relaxed">{{ proyecto.descripcion }}</p>
        </div>

        <!-- Imagen principal -->
        <div class="rounded-2xl overflow-hidden mb-8 bg-linear-to-br from-violeta/10 to-indigo-500/5 border border-white/5">
          <img v-if="proyecto.imagenUrl" :src="proyecto.imagenUrl" :alt="proyecto.titulo" class="w-full object-cover max-h-125" />
          <div v-else class="h-64 flex items-center justify-center">
            <svg class="w-16 h-16 text-gris-medio/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <!-- Info lateral -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="md:col-span-2 space-y-5">
            <!-- Stack técnico -->
            <div class="p-5 rounded-2xl bg-white/3 border border-white/5">
              <h3 class="text-white font-semibold mb-3">Tecnologías utilizadas</h3>
              <div class="flex flex-wrap gap-2">
                <span v-for="tech in proyecto.stackTecnico" :key="tech"
                  class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-sm text-blanco-suave">{{ tech }}</span>
              </div>
            </div>

            <!-- Testimonios del proyecto -->
            <div v-if="proyecto.testimonios?.length" class="p-5 rounded-2xl bg-white/3 border border-white/5">
              <h3 class="text-white font-semibold mb-4">Lo que dice el cliente</h3>
              <div v-for="t in proyecto.testimonios" :key="t.id" class="space-y-2">
                <p class="text-amarillo">{{ estrellas(t.calificacion) }}</p>
                <p class="text-blanco-suave text-sm italic">"{{ t.contenido }}"</p>
                <p class="text-gris-medio text-xs">— {{ t.nombreCliente }}</p>
              </div>
            </div>
          </div>

          <!-- Panel derecho -->
          <div class="space-y-4">
            <!-- Servicio -->
            <div v-if="proyecto.servicio" class="p-4 rounded-2xl bg-white/3 border border-white/5">
              <p class="text-xs text-gris-medio mb-1">Tipo de proyecto</p>
              <p class="text-white font-medium">{{ proyecto.servicio.nombre }}</p>
            </div>

            <!-- Links -->
            <div class="space-y-2">
              <a v-if="proyecto.urlEnVivo" :href="proyecto.urlEnVivo" target="_blank" rel="noopener noreferrer"
                class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-violeta hover:bg-violeta/90 text-white font-semibold text-sm transition-all shadow-lg shadow-violeta/20">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Ver proyecto en vivo
              </a>
              <a v-if="proyecto.urlGithub" :href="proyecto.urlGithub" target="_blank" rel="noopener noreferrer"
                class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-blanco-suave font-semibold text-sm transition-all">
                Código en GitHub
              </a>
            </div>

            <!-- CTA -->
            <RouterLink :to="{ name: 'contacto' }"
              class="flex items-center justify-center w-full py-3 rounded-xl bg-white/3 border border-white/10 hover:border-violeta/30 text-gris-medio hover:text-violeta-claro text-sm transition-all">
              ¿Quieres algo similar?
            </RouterLink>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>