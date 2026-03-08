<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface Props {
  abierto:   boolean
  titulo?:   string
  tamano?:   'sm' | 'md' | 'lg' | 'xl' | 'pantalla-completa'
  cerrarAlFondo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tamano:         'md',
  cerrarAlFondo:  true,
})

const emit = defineEmits<{ (e: 'cerrar'): void }>()

const cerrar = () => emit('cerrar')

const clasesTamano = {
  sm:                'max-w-md',
  md:                'max-w-lg',
  lg:                'max-w-2xl',
  xl:                'max-w-4xl',
  'pantalla-completa': 'max-w-[95vw] max-h-[95vh]',
}

// Cerrar con Escape
const manejadorTeclado = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.abierto) cerrar()
}

onMounted(() => document.addEventListener('keydown', manejadorTeclado))
onUnmounted(() => document.removeEventListener('keydown', manejadorTeclado))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="abierto"
        class="fixed inset-0 z-9998 flex items-center justify-center p-4"
      >
        <!-- Fondo -->
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          @click="cerrarAlFondo ? cerrar() : undefined"
        />

        <!-- Panel modal -->
        <div
          class="relative w-full bg-[#13151f] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          :class="clasesTamano[tamano]"
          style="max-height: 90vh;"
        >
          <!-- Header -->
          <div v-if="titulo || $slots.header" class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
            <slot name="header">
              <h2 class="text-white font-semibold text-base">{{ titulo }}</h2>
            </slot>
            <button
              class="p-1.5 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all"
              @click="cerrar"
              aria-label="Cerrar modal"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Cuerpo con scroll -->
          <div class="flex-1 overflow-y-auto px-6 py-5">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="shrink-0 px-6 py-4 border-t border-white/5 flex justify-end gap-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  transition: all 0.25s ease;
}
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(8px);
}
</style>