<script setup lang="ts">
type Tipo   = 'exito' | 'error' | 'advertencia' | 'info'
type Tamano = 'sm' | 'md'

interface Props {
  tipo?:       Tipo
  titulo?:     string
  cerrable?:   boolean
  tamano?:     Tamano
  borde?:      boolean
}

const props = withDefaults(defineProps<Props>(), {
  tipo:     'info',
  cerrable: false,
  tamano:   'md',
  borde:    true,
})

const emit = defineEmits<{ cerrar: [] }>()

const visible = ref(true)

const ESTILOS: Record<Tipo, { contenedor: string; icono: string; titulo: string; mensaje: string }> = {
  exito:       { contenedor: 'bg-verde/5 border-verde/20',    icono: 'text-verde',    titulo: 'text-verde',    mensaje: 'text-verde/80'    },
  error:       { contenedor: 'bg-rojo/5 border-rojo/20',      icono: 'text-rojo',     titulo: 'text-rojo',     mensaje: 'text-rojo/80'     },
  advertencia: { contenedor: 'bg-amarillo/5 border-amarillo/20', icono: 'text-amarillo', titulo: 'text-amarillo', mensaje: 'text-amarillo/80' },
  info:        { contenedor: 'bg-azul/5 border-azul/20',      icono: 'text-azul',     titulo: 'text-azul',     mensaje: 'text-azul/80'     },
}

const ICONOS: Record<Tipo, string> = {
  exito:       'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error:       'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  advertencia: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info:        'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const PADDING: Record<Tamano, string> = {
  sm: 'p-3',
  md: 'p-4',
}

const cerrar = () => {
  visible.value = false
  emit('cerrar')
}
</script>

<template>
  <Transition name="alerta">
    <div
      v-if="visible"
      class="rounded-xl flex items-start gap-3"
      :class="[ESTILOS[tipo].contenedor, PADDING[tamano], borde ? 'border' : '']"
      role="alert"
    >
      <svg
        class="w-5 h-5 shrink-0 mt-0.5"
        :class="ESTILOS[tipo].icono"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ICONOS[tipo]" />
      </svg>

      <div class="flex-1 min-w-0">
        <p v-if="titulo" class="text-sm font-semibold" :class="ESTILOS[tipo].titulo">{{ titulo }}</p>
        <div v-if="$slots.default" class="text-sm mt-0.5" :class="[ESTILOS[tipo].mensaje, titulo ? '' : 'font-medium']">
          <slot />
        </div>
      </div>

      <button
        v-if="cerrable"
        class="p-0.5 rounded transition-opacity opacity-60 hover:opacity-100"
        :class="ESTILOS[tipo].icono"
        aria-label="Cerrar"
        @click="cerrar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.alerta-enter-active { transition: all 0.2s ease }
.alerta-leave-active { transition: all 0.15s ease }
.alerta-enter-from,
.alerta-leave-to     { opacity: 0; transform: translateY(-4px) }
</style>