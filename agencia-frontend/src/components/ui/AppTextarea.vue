<script setup lang="ts">
type Tamano = 'sm' | 'md' | 'lg'

interface Props {
  modelValue:      string | null
  label?:          string
  placeholder?:    string
  error?:          string
  ayuda?:          string
  deshabilitado?:  boolean
  requerido?:      boolean
  filas?:          number
  maxlength?:      number
  contador?:       boolean
  redimensionable?: boolean
  tamano?:         Tamano
}

const props = withDefaults(defineProps<Props>(), {
  deshabilitado:   false,
  requerido:       false,
  filas:           4,
  contador:        false,
  redimensionable: true,
  tamano:          'md',
})

const emit = defineEmits<{ 'update:modelValue': [valor: string | null] }>()

const TAMANOS: Record<Tamano, string> = {
  sm: 'p-2.5 text-xs',
  md: 'p-3 text-sm',
  lg: 'p-3.5 text-base',
}

const longitudActual = computed(() => props.modelValue?.length ?? 0)
</script>

<template>
  <div class="space-y-1.5">
    <div v-if="label || (contador && maxlength)" class="flex items-center justify-between">
      <label v-if="label" class="block text-sm font-medium text-blanco-suave">
        {{ label }}
        <span v-if="requerido" class="text-rojo ml-0.5">*</span>
      </label>
      <span v-if="contador && maxlength" class="text-xs" :class="longitudActual >= maxlength ? 'text-rojo' : 'text-gris-medio'">
        {{ longitudActual }}/{{ maxlength }}
      </span>
    </div>

    <textarea
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="deshabilitado"
      :required="requerido"
      :rows="filas"
      :maxlength="maxlength"
      :class="[
        'w-full rounded-xl bg-white/5 border text-white placeholder-gris-medio transition-all outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        redimensionable ? 'resize-y' : 'resize-none',
        TAMANOS[tamano],
        error
          ? 'border-rojo/40 focus:border-rojo focus:ring-2 focus:ring-rojo/15'
          : 'border-white/10 focus:border-violeta/50 focus:ring-2 focus:ring-violeta/10',
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value || null)"
    />

    <p v-if="error" class="text-xs text-rojo flex items-center gap-1">
      <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </p>
    <p v-else-if="ayuda" class="text-xs text-gris-medio">{{ ayuda }}</p>
  </div>
</template>