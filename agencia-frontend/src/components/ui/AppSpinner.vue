<script setup lang="ts">
type Tamano  = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Variante = 'violeta' | 'blanco' | 'gris' | 'verde' | 'rojo'

interface Props {
  tamano?:      Tamano
  variante?:    Variante
  etiqueta?:    string
  centrado?:    boolean
  pantalla?:    boolean
}

withDefaults(defineProps<Props>(), {
  tamano:   'md',
  variante: 'violeta',
  centrado: false,
  pantalla: false,
})

const TAMANOS: Record<Tamano, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const COLORES: Record<Variante, string> = {
  violeta: 'text-violeta',
  blanco:  'text-white',
  gris:    'text-gris-medio',
  verde:   'text-verde',
  rojo:    'text-rojo',
}
</script>

<template>
  <div
    v-if="pantalla"
    class="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm"
  >
    <div class="flex flex-col items-center gap-3">
      <svg
        class="animate-spin"
        :class="[TAMANOS['xl'], COLORES[variante]]"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p v-if="etiqueta" class="text-sm text-gris-medio">{{ etiqueta }}</p>
    </div>
  </div>

  <div
    v-else
    :class="centrado ? 'flex items-center justify-center gap-2' : 'inline-flex items-center gap-2'"
  >
    <svg
      class="animate-spin shrink-0"
      :class="[TAMANOS[tamano], COLORES[variante]]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <span v-if="etiqueta" class="text-sm text-gris-medio">{{ etiqueta }}</span>
  </div>
</template>