<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
    <div class="text-center max-w-md mx-auto">

      <div class="relative mb-10">
        <p class="text-[180px] font-black text-white/4 leading-none select-none tracking-tighter">404</p>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <svg class="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <h1 class="text-3xl font-bold text-white mb-3">Página no encontrada</h1>
      <p class="text-slate-400 text-lg mb-10 leading-relaxed">
        La página que buscas no existe o fue movida. Pero no te preocupes, podemos llevarte de vuelta.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          class="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-medium text-sm transition-all"
          @click="router.back()"
        >
          ← Volver atrás
        </button>
        <RouterLink
          :to="{ name: 'inicio' }"
          class="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-600/25"
        >
          Ir al inicio
        </RouterLink>
      </div>

    </div>
  </div>
</template>