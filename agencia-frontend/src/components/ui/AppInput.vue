<script setup lang="ts">
interface Props {
  modelValue:   string | number | null
  label?:       string
  placeholder?: string
  tipo?:        string
  error?:       string
  ayuda?:       string
  deshabilitado?: boolean
  requerido?:   boolean
  icono?:       string // SVG path
  tamano?:      'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  tipo:           'text',
  deshabilitado:  false,
  requerido:      false,
  tamano:         'md',
})

defineEmits<{
  (e: 'update:modelValue', valor: string | number | null): void
}>()

const clasesTamano = {
  sm: 'py-2 text-xs',
  md: 'py-2.5 text-sm',
  lg: 'py-3 text-base',
}
</script>

<template>
  <div class="space-y-1.5">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-blanco-suave">
      {{ label }}
      <span v-if="requerido" class="text-rojo ml-0.5">*</span>
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <!-- Icono izquierdo -->
      <div v-if="icono" class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <svg class="w-4 h-4 text-gris-medio" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="icono" />
        </svg>
      </div>

      <input
        :type="tipo"
        :value="modelValue ?? ''"
        :placeholder="placeholder"
        :disabled="deshabilitado"
        :required="requerido"
        :class="[
          'w-full rounded-xl bg-white/5 border text-white placeholder-gris-medio transition-all outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          clasesTamano[tamano],
          icono ? 'pl-10 pr-4' : 'px-4',
          error
            ? 'border-rojo/40 focus:border-rojo focus:ring-2 focus:ring-rojo/15'
            : 'border-white/10 focus:border-violeta/50 focus:ring-2 focus:ring-violeta/10',
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Error -->
    <p v-if="error" class="text-xs text-rojo flex items-center gap-1">
      <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </p>

    <!-- Ayuda -->
    <p v-else-if="ayuda" class="text-xs text-gris-medio">{{ ayuda }}</p>
  </div>
</template>