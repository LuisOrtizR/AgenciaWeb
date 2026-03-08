<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import type { Notificacion } from '@/types'

const uiStore = useUiStore()

const iconoPorTipo: Record<Notificacion['tipo'], string> = {
  exito:       'M5 13l4 4L19 7',
  error:       'M6 18L18 6M6 6l12 12',
  advertencia: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info:        'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const clasesPorTipo: Record<Notificacion['tipo'], { contenedor: string; icono: string; barra: string }> = {
  exito: {
    contenedor: 'border-green-500/20 bg-green-500/5',
    icono:      'text-green-400 bg-green-500/10',
    barra:      'bg-green-500',
  },
  error: {
    contenedor: 'border-red-500/20 bg-red-500/5',
    icono:      'text-red-400 bg-red-500/10',
    barra:      'bg-red-500',
  },
  advertencia: {
    contenedor: 'border-yellow-500/20 bg-yellow-500/5',
    icono:      'text-yellow-400 bg-yellow-500/10',
    barra:      'bg-yellow-500',
  },
  info: {
    contenedor: 'border-blue-500/20 bg-blue-500/5',
    icono:      'text-blue-400 bg-blue-500/10',
    barra:      'bg-blue-500',
  },
}
</script>

<template>
  <Teleport to="body">
    <div
      aria-live="polite"
      aria-atomic="false"
      class="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-3">
        <div
          v-for="n in uiStore.notificaciones"
          :key="n.id"
          class="pointer-events-auto w-full bg-[#13151f] border rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
          :class="clasesPorTipo[n.tipo].contenedor"
          role="alert"
        >
          <!-- Barra superior de color -->
          <div class="h-0.5 w-full" :class="clasesPorTipo[n.tipo].barra" />

          <div class="flex items-start gap-3 p-4">
            <!-- Icono -->
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              :class="clasesPorTipo[n.tipo].icono"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" :d="iconoPorTipo[n.tipo]" />
              </svg>
            </div>

            <!-- Contenido -->
            <div class="flex-1 min-w-0 pt-0.5">
              <p class="text-sm font-semibold text-white leading-snug">{{ n.titulo }}</p>
              <p v-if="n.mensaje" class="text-xs text-gray-400 mt-0.5 leading-relaxed">{{ n.mensaje }}</p>
            </div>

            <!-- Cerrar -->
            <button
              class="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all shrink-0 -mt-0.5 -mr-0.5"
              @click="uiStore.eliminarNotificacion(n.id)"
              aria-label="Cerrar notificación"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(24px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.95);
}
.toast-move {
  transition: transform 0.2s ease;
}
</style>