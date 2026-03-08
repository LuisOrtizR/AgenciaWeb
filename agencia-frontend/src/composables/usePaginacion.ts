/**
 * composables/usePaginacion.ts
 * Maneja estado de paginación reutilizable en cualquier listado.
 */
import { ref, computed } from 'vue'
import type { Paginacion } from '@/types'

export function usePaginacion(porPaginaInicial = 10) {
  const paginaActual   = ref(1)
  const porPagina      = ref(porPaginaInicial)
  const totalPaginas   = ref(1)
  const totalRegistros = ref(0)

  const hayPaginaAnterior = computed(() => paginaActual.value > 1)
  const hayPaginaSiguiente = computed(() => paginaActual.value < totalPaginas.value)

  const actualizarPaginacion = (paginacion: Paginacion): void => {
    paginaActual.value   = paginacion.pagina_actual
    totalPaginas.value   = paginacion.total_paginas
    totalRegistros.value = paginacion.total_registros
    porPagina.value      = paginacion.por_pagina
  }

  const irAPagina = (pagina: number): void => {
    if (pagina >= 1 && pagina <= totalPaginas.value) {
      paginaActual.value = pagina
    }
  }

  const paginaAnterior  = (): void => irAPagina(paginaActual.value - 1)
  const paginaSiguiente = (): void => irAPagina(paginaActual.value + 1)
  const irAlInicio      = (): void => irAPagina(1)
  const irAlFinal       = (): void => irAPagina(totalPaginas.value)

  const reiniciar = (): void => {
    paginaActual.value   = 1
    totalPaginas.value   = 1
    totalRegistros.value = 0
  }

  return {
    paginaActual,
    porPagina,
    totalPaginas,
    totalRegistros,
    hayPaginaAnterior,
    hayPaginaSiguiente,
    actualizarPaginacion,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
    irAlInicio,
    irAlFinal,
    reiniciar,
  }
}