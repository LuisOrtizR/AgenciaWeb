<script setup lang="ts">
type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma' | 'exito' | 'advertencia'
type Tamano   = 'xs' | 'sm' | 'md' | 'lg'

interface Props {
  variante?:      Variante
  tamano?:        Tamano
  cargando?:      boolean
  deshabilitado?: boolean
  tipo?:          'button' | 'submit' | 'reset'
  bloque?:        boolean
  icono?:         boolean
}

const props = withDefaults(defineProps<Props>(), {
  variante:      'primario',
  tamano:        'md',
  cargando:      false,
  deshabilitado: false,
  tipo:          'button',
  bloque:        false,
  icono:         false,
})

const BASE = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1117] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none'

const VARIANTES: Record<Variante, string> = {
  primario:    'bg-violeta hover:bg-violeta/90 text-white shadow-lg shadow-violeta/20 hover:shadow-violeta/35 focus-visible:ring-violeta',
  secundario:  'bg-white/5 hover:bg-white/10 text-blanco-suave hover:text-white border border-white/10 hover:border-white/20 focus-visible:ring-white/20',
  peligro:     'bg-rojo/10 hover:bg-rojo/20 text-rojo border border-rojo/20 hover:border-rojo/40 focus-visible:ring-rojo',
  fantasma:    'text-gris-medio hover:text-white hover:bg-white/5 focus-visible:ring-white/20',
  exito:       'bg-verde/10 hover:bg-verde/20 text-verde border border-verde/20 hover:border-verde/40 focus-visible:ring-verde',
  advertencia: 'bg-amarillo/10 hover:bg-amarillo/20 text-amarillo border border-amarillo/20 hover:border-amarillo/40 focus-visible:ring-amarillo',
}

const TAMANOS: Record<Tamano, string> = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

const TAMANOS_ICONO: Record<Tamano, string> = {
  xs: 'p-1.5',
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3',
}
</script>

<template>
  <button
    :type="tipo"
    :disabled="cargando || deshabilitado"
    :class="[
      BASE,
      VARIANTES[variante],
      icono ? TAMANOS_ICONO[tamano] : TAMANOS[tamano],
      bloque ? 'w-full' : '',
    ]"
  >
    <svg v-if="cargando" class="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>