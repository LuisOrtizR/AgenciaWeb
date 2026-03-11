<script setup lang="ts">
type Tamano = 'sm' | 'md' | 'lg'

interface Opcion {
  valor: string | number
  etiqueta: string
  deshabilitada?: boolean
}

interface Props {
  modelValue:      string | number | null
  opciones:        Opcion[]
  label?:          string
  placeholder?:    string
  error?:          string
  ayuda?:          string
  deshabilitado?:  boolean
  requerido?:      boolean
  tamano?:         Tamano
}

const props = withDefaults(defineProps<Props>(), {
  deshabilitado: false,
  requerido:     false,
  tamano:        'md',
})

const emit = defineEmits<{ 'update:modelValue': [valor: string | number | null] }>()

const TAMANOS: Record<Tamano, string> = {
  sm: 'py-2 text-xs',
  md: 'py-2.5 text-sm',
  lg: 'py-3 text-base',
}

const onChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value
  emit('update:modelValue', val === '' ? null : val)
}
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-blanco-suave">
      {{ label }}
      <span v-if="requerido" class="text-rojo ml-0.5">*</span>
    </label>

    <div class="relative">
      <select
        :value="modelValue ?? ''"
        :disabled="deshabilitado"
        :required="requerido"
        :class="[
          'w-full rounded-xl bg-white/5 border text-white transition-all outline-none appearance-none pl-4 pr-10',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          TAMANOS[tamano],
          error
            ? 'border-rojo/40 focus:border-rojo focus:ring-2 focus:ring-rojo/15'
            : 'border-white/10 focus:border-violeta/50 focus:ring-2 focus:ring-violeta/10',
        ]"
        @change="onChange"
      >
        <option v-if="placeholder" value="" disabled :selected="modelValue === null || modelValue === ''">
          {{ placeholder }}
        </option>
        <option
          v-for="op in opciones"
          :key="op.valor"
          :value="op.valor"
          :disabled="op.deshabilitada"
        >
          {{ op.etiqueta }}
        </option>
      </select>

      <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
        <svg class="w-4 h-4 text-gris-medio" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <p v-if="error" class="text-xs text-rojo flex items-center gap-1">
      <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </p>
    <p v-else-if="ayuda" class="text-xs text-gris-medio">{{ ayuda }}</p>
  </div>
</template>