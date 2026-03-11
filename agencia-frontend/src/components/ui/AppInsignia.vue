<script setup lang="ts">
type Variante = 'exito' | 'error' | 'advertencia' | 'info' | 'neutro' | 'violeta'
type Tamano   = 'xs' | 'sm' | 'md'

interface Props {
  variante?: Variante
  tamano?:   Tamano
  punto?:    boolean
  pulsar?:   boolean
}

withDefaults(defineProps<Props>(), {
  variante: 'neutro',
  tamano:   'sm',
  punto:    false,
  pulsar:   false,
})

const VARIANTES: Record<Variante, string> = {
  exito:       'bg-verde/10 text-verde border-verde/20',
  error:       'bg-rojo/10 text-rojo border-rojo/20',
  advertencia: 'bg-amarillo/10 text-amarillo border-amarillo/20',
  info:        'bg-azul/10 text-azul border-azul/20',
  neutro:      'bg-white/5 text-gris-medio border-white/10',
  violeta:     'bg-violeta/10 text-violeta-claro border-violeta/20',
}

const COLOR_PUNTO: Record<Variante, string> = {
  exito:       'bg-verde',
  error:       'bg-rojo',
  advertencia: 'bg-amarillo',
  info:        'bg-azul',
  neutro:      'bg-gris-medio',
  violeta:     'bg-violeta',
}

const TAMANOS: Record<Tamano, string> = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border font-medium"
    :class="[VARIANTES[variante], TAMANOS[tamano]]"
  >
    <span
      v-if="punto"
      class="w-1.5 h-1.5 rounded-full shrink-0"
      :class="[COLOR_PUNTO[variante], pulsar ? 'animate-pulse' : '']"
    />
    <slot />
  </span>
</template>