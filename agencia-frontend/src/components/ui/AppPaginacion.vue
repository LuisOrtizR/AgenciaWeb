<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  paginaActual:   number
  totalPaginas:   number
  totalRegistros: number
  porPagina:      number
}

const props = defineProps<Props>()
const emit  = defineEmits<{ (e: 'cambiar', pagina: number): void }>()

const ir = (pagina: number) => {
  if (pagina >= 1 && pagina <= props.totalPaginas && pagina !== props.paginaActual) {
    emit('cambiar', pagina)
  }
}

// Generar números de páginas visibles con elipsis
const paginas = computed<(number | '...')[]>(() => {
  const total   = props.totalPaginas
  const actual  = props.paginaActual
  const delta   = 1

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const rango: number[] = []
  for (let i = Math.max(2, actual - delta); i <= Math.min(total - 1, actual + delta); i++) {
    rango.push(i)
  }

  const resultado: (number | '...')[] = [1]
  if (rango[0] > 2) resultado.push('...')
  resultado.push(...rango)
  if (rango[rango.length - 1] < total - 1) resultado.push('...')
  resultado.push(total)

  return resultado
})

const desde = computed(() => (props.paginaActual - 1) * props.porPagina + 1)
const hasta = computed(() => Math.min(props.paginaActual * props.porPagina, props.totalRegistros))
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
    <!-- Info registros -->
    <p class="text-xs text-gris-medio">
      Mostrando
      <span class="text-blanco-suave font-medium">{{ desde }}–{{ hasta }}</span>
      de
      <span class="text-blanco-suave font-medium">{{ totalRegistros }}</span>
      registros
    </p>

    <!-- Controles de paginación -->
    <div class="flex items-center gap-1">
      <!-- Anterior -->
      <button
        class="p-2 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="paginaActual <= 1"
        @click="ir(paginaActual - 1)"
        aria-label="Página anterior"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Números -->
      <template v-for="(pagina, i) in paginas" :key="i">
        <span v-if="pagina === '...'" class="px-2 text-gris-medio text-sm select-none">…</span>
        <button
          v-else
          class="w-8 h-8 rounded-lg text-sm font-medium transition-all"
          :class="pagina === paginaActual
            ? 'bg-violeta text-white'
            : 'text-gris-medio hover:text-white hover:bg-white/5'"
          @click="ir(pagina as number)"
        >
          {{ pagina }}
        </button>
      </template>

      <!-- Siguiente -->
      <button
        class="p-2 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="paginaActual >= totalPaginas"
        @click="ir(paginaActual + 1)"
        aria-label="Página siguiente"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>