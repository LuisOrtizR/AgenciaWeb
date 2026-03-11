<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import type { Notificacion } from '@/types'

const uiStore = useUiStore()

type Tipo = Notificacion['tipo']

const ICONOS: Record<Tipo, string> = {
  exito:       'M5 13l4 4L19 7',
  error:       'M6 18L18 6M6 6l12 12',
  advertencia: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info:        'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const ESTILOS: Record<Tipo, { contenedor: string; icono: string; barra: string }> = {
  exito:       { contenedor: 'border-verde/20 bg-verde/5',    icono: 'text-verde bg-verde/10',       barra: 'bg-verde'    },
  error:       { contenedor: 'border-rojo/20 bg-rojo/5',      icono: 'text-rojo bg-rojo/10',         barra: 'bg-rojo'     },
  advertencia: { contenedor: 'border-amarillo/20 bg-amarillo/5', icono: 'text-amarillo bg-amarillo/10', barra: 'bg-amarillo' },
  info:        { contenedor: 'border-azul/20 bg-azul/5',      icono: 'text-azul bg-azul/10',         barra: 'bg-azul'     },
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
          role="alert"
          class="pointer-events-auto w-full bg-[#13151f] border rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
          :class="ESTILOS[n.tipo].contenedor"
        >
          <div class="h-0.5 w-full" :class="ESTILOS[n.tipo].barra" />
          <div class="flex items-start gap-3 p-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :class="ESTILOS[n.tipo].icono">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" :d="ICONOS[n.tipo]" />
              </svg>
            </div>
            <div class="flex-1 min-w-0 pt-0.5">
              <p class="text-sm font-semibold text-white leading-snug">{{ n.titulo }}</p>
              <p v-if="n.mensaje" class="text-xs text-gris-medio mt-0.5 leading-relaxed">{{ n.mensaje }}</p>
            </div>
            <button
              class="p-1 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all shrink-0 -mt-0.5 -mr-0.5"
              aria-label="Cerrar"
              @click="uiStore.eliminarNotificacion(n.id)"
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
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) }
.toast-leave-active { transition: all 0.2s ease }
.toast-enter-from,
.toast-leave-to     { opacity: 0; transform: translateX(24px) scale(0.95) }
.toast-move         { transition: transform 0.2s ease }
</style>