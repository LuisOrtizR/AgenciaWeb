<script setup lang="ts">
import { ref, reactive, nextTick, computed } from 'vue'
import { iaServicio } from '@/services/servicios'
import type { MensajeChat } from '@/types'

const empresaNombre = import.meta.env.VITE_EMPRESA_NOMBRE as string

// ─── Estado ──────────────────────────────────────────────────────────────────

const abierto        = ref(false)
const cargando       = ref(false)
const textoUsuario   = ref('')
const contenedorRef  = ref<HTMLElement | null>(null)
const inputRef       = ref<HTMLInputElement | null>(null)

const mensajes = reactive<MensajeChat[]>([
  {
    rol: 'assistant',
    contenido: `¡Hola! 👋 Soy el asistente de ${empresaNombre}. Puedo orientarte sobre nuestros servicios, precios y procesos. ¿En qué te puedo ayudar?`,
  },
])

// ─── Computed ─────────────────────────────────────────────────────────────────

const historialParaApi = computed<MensajeChat[]>(() =>
  mensajes.map(m => ({ rol: m.rol, contenido: m.contenido }))
)

const puedeEnviar = computed(() =>
  textoUsuario.value.trim().length > 0 && !cargando.value
)

// ─── Métodos ─────────────────────────────────────────────────────────────────

const toggleChat = () => {
  abierto.value = !abierto.value
  if (abierto.value) {
    nextTick(() => {
      inputRef.value?.focus()
      scrollAlFondo()
    })
  }
}

const scrollAlFondo = () => {
  nextTick(() => {
    if (contenedorRef.value) {
      contenedorRef.value.scrollTop = contenedorRef.value.scrollHeight
    }
  })
}

const enviarMensaje = async () => {
  const texto = textoUsuario.value.trim()
  if (!texto || cargando.value) return

  mensajes.push({ rol: 'user', contenido: texto })
  textoUsuario.value = ''
  scrollAlFondo()

  cargando.value = true

  try {
    const { data } = await iaServicio.chat({
      mensaje:   texto,
      historial: historialParaApi.value.slice(0, -1),
    })

    mensajes.push({ rol: 'assistant', contenido: data.datos.respuesta })
  } catch {
    mensajes.push({
      rol: 'assistant',
      contenido: 'Lo siento, tuve un problema al responder. Por favor intenta de nuevo o contáctanos directamente.',
    })
  } finally {
    cargando.value = false
    scrollAlFondo()
    inputRef.value?.focus()
  }
}

const manejarEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) return
  e.preventDefault()
  enviarMensaje()
}

const sugerencias = [
  '¿Qué servicios ofrecen?',
  '¿Cuánto cuesta una landing page?',
  '¿Cuánto tiempo tarda un proyecto?',
]

const usarSugerencia = (texto: string) => {
  textoUsuario.value = texto
  enviarMensaje()
}
</script>

<template>
  <!-- Botón flotante -->
  <div class="fixed bottom-6 right-6 z-50">

    <!-- Panel de chat -->
    <Transition name="chat-panel">
      <div
        v-if="abierto"
        class="absolute bottom-16 right-0 w-80 sm:w-96 bg-[#13151f] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
        style="max-height: 520px;"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3.5 bg-linear-to-r from-violeta/20 to-indigo-500/10 border-b border-white/5 shrink-0">
          <div class="w-8 h-8 rounded-full bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-white font-semibold text-sm">Asistente {{ empresaNombre }}</p>
            <p class="text-verde text-xs flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-verde inline-block animate-pulse" />
              En línea ahora
            </p>
          </div>
          <button
            class="p-1.5 rounded-lg text-gris-medio hover:text-white hover:bg-white/5 transition-all"
            @click="abierto = false"
            aria-label="Cerrar chat"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Mensajes -->
        <div
          ref="contenedorRef"
          class="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin"
        >
          <div
            v-for="(msg, i) in mensajes"
            :key="i"
            class="flex"
            :class="msg.rol === 'user' ? 'justify-end' : 'justify-start'"
          >
            <!-- Avatar IA -->
            <div
              v-if="msg.rol === 'assistant'"
              class="w-6 h-6 rounded-full bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center text-white text-xs shrink-0 mt-0.5 mr-2"
            >
              AI
            </div>

            <div
              class="max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
              :class="msg.rol === 'user'
                ? 'bg-violeta text-white rounded-tr-sm'
                : 'bg-white/8 text-blanco-suave rounded-tl-sm border border-white/5'"
            >
              {{ msg.contenido }}
            </div>
          </div>

          <!-- Indicador de escritura -->
          <div v-if="cargando" class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-linear-to-br from-violeta to-indigo-500 flex items-center justify-center text-white text-xs shrink-0">AI</div>
            <div class="bg-white/8 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 bg-gris-medio rounded-full animate-bounce" style="animation-delay: 0ms" />
              <span class="w-1.5 h-1.5 bg-gris-medio rounded-full animate-bounce" style="animation-delay: 150ms" />
              <span class="w-1.5 h-1.5 bg-gris-medio rounded-full animate-bounce" style="animation-delay: 300ms" />
            </div>
          </div>
        </div>

        <!-- Sugerencias rápidas -->
        <div v-if="mensajes.length <= 1 && !cargando" class="px-4 pb-2 flex flex-wrap gap-2">
          <button
            v-for="sug in sugerencias"
            :key="sug"
            class="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-violeta/15 border border-white/10 hover:border-violeta/30 text-gris-medio hover:text-violeta-claro transition-all"
            @click="usarSugerencia(sug)"
          >
            {{ sug }}
          </button>
        </div>

        <!-- Input -->
        <div class="px-3 pb-3 shrink-0">
          <div class="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-violeta/40 transition-all">
            <input
              ref="inputRef"
              v-model="textoUsuario"
              type="text"
              placeholder="Escribe tu mensaje..."
              class="flex-1 bg-transparent text-sm text-white placeholder-gris-medio outline-none"
              :disabled="cargando"
              @keydown.enter="manejarEnter"
              maxlength="500"
            />
            <button
              class="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
              :class="puedeEnviar
                ? 'bg-violeta hover:bg-violeta/90 text-white'
                : 'bg-white/5 text-gris-medio cursor-not-allowed'"
              :disabled="!puedeEnviar"
              @click="enviarMensaje"
              aria-label="Enviar mensaje"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p class="text-center text-xs text-gris-medio mt-2 opacity-50">
            Impulsado por IA · {{ empresaNombre }}
          </p>
        </div>
      </div>
    </Transition>

    <!-- Botón flotante principal -->
    <button
      class="w-14 h-14 rounded-full bg-linear-to-br from-violeta to-indigo-500 shadow-xl shadow-violeta/30 hover:shadow-violeta/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative"
      @click="toggleChat"
      :aria-label="abierto ? 'Cerrar chat' : 'Abrir chat'"
    >
      <Transition name="icono-chat" mode="out-in">
        <svg v-if="abierto" key="cerrar" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <svg v-else key="chat" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </Transition>

      <!-- Burbuja de notificación -->
      <span
        v-if="!abierto"
        class="absolute -top-1 -right-1 w-4 h-4 bg-verde rounded-full border-2 border-[#0a0a0f] animate-pulse"
      />
    </button>
  </div>
</template>

<style scoped>
.chat-panel-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chat-panel-leave-active {
  transition: all 0.2s ease;
}
.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

.icono-chat-enter-active,
.icono-chat-leave-active {
  transition: all 0.15s ease;
}
.icono-chat-enter-from,
.icono-chat-leave-to {
  opacity: 0;
  transform: scale(0.7) rotate(90deg);
}
</style>