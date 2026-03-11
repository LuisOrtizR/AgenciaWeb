<script setup lang="ts">
type Props = {
  paginaActual:   number
  totalPaginas:   number
  totalRegistros: number
  porPagina:      number
  mostrarInfo?:   boolean
}

const props = withDefaults(defineProps<Props>(), { mostrarInfo: true })

const emit = defineEmits<{ cambiar: [pagina: number] }>()

const ir = (pagina: number) => {
  if (pagina >= 1 && pagina <= props.totalPaginas && pagina !== props.paginaActual)
    emit('cambiar', pagina)
}

const paginas = computed<(number | '...')[]>(() => {
  const { totalPaginas: total, paginaActual: actual } = props
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const rango: number[] = []
  for (let i = Math.max(2, actual - 1); i <= Math.min(total - 1, actual + 1); i++) rango.push(i)

  const resultado: (number | '...')[] = [1]
  if (rango.length > 0 && rango[0]! > 2)                          resultado.push('...')
  resultado.push(...rango)
  if (rango.length > 0 && rango[rango.length - 1]! < total - 1)   resultado.push('...')
  resultado.push(total)
  return resultado
})

const desde = computed(() => (props.paginaActual - 1) * props.porPagina + 1)
const hasta = computed(() => Math.min(props.paginaActual * props.porPagina, props.totalRegistros))
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
    <p v-if="mostrarInfo" class="text-xs text-gris-medio">
      Mostrando
      <span class="text-blanco-suave font-medium">{{ desde }}–{{ hasta }}</span>
      de
      <span class="text-blanco-suave font-medium">{{ totalRegistros }}</span>
      registros
    </p>

    <div class="flex items-center gap-1">
      <button
        class="p-2 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="paginaActual <= 1"
        aria-label="Primera pagina"
        @click="ir(1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        class="p-2 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="paginaActual <= 1"
        aria-label="Pagina anterior"
        @click="ir(paginaActual - 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <template v-for="(pagina, i) in paginas" :key="i">
        <span v-if="pagina === '...'" class="px-2 text-gris-medio text-sm select-none">…</span>
        <button
          v-else
          class="w-8 h-8 rounded-lg text-sm font-medium transition-all"
          :class="pagina === paginaActual
            ? 'bg-violeta text-white shadow-sm shadow-violeta/30'
            : 'text-gris-medio hover:text-white hover:bg-white/5'"
          @click="ir(pagina as number)"
        >
          {{ pagina }}
        </button>
      </template>

      <button
        class="p-2 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="paginaActual >= totalPaginas"
        aria-label="Pagina siguiente"
        @click="ir(paginaActual + 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button
        class="p-2 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="paginaActual >= totalPaginas"
        aria-label="Ultima pagina"
        @click="ir(totalPaginas)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>