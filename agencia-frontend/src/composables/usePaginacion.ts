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

  // ── Computed ───────────────────────────────────────────────────────
  const hayPaginaAnterior  = computed(() => paginaActual.value > 1)
  const hayPaginaSiguiente = computed(() => paginaActual.value < totalPaginas.value)

  /** Genera un rango de páginas visible alrededor de la página actual */
  const rangoVisible = computed<number[]>(() => {
    const delta  = 2
    const inicio = Math.max(1, paginaActual.value - delta)
    const fin    = Math.min(totalPaginas.value, paginaActual.value + delta)
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i)
  })

  /** Indica si la paginación tiene más de una página */
  const tienePaginacion = computed(() => totalPaginas.value > 1)

  // ── Métodos ────────────────────────────────────────────────────────
  const actualizarPaginacion = (paginacion: Paginacion): void => {
    // ✅ Propiedades exactas del tipo Paginacion en @/types
    paginaActual.value   = paginacion.pagina        // pagina (no paginaActual)
    totalPaginas.value   = paginacion.totalPaginas
    totalRegistros.value = paginacion.total          // total (no totalRegistros)
    porPagina.value      = paginacion.porPagina
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
    // estado
    paginaActual,
    porPagina,
    totalPaginas,
    totalRegistros,
    // computed
    hayPaginaAnterior,
    hayPaginaSiguiente,
    rangoVisible,
    tienePaginacion,
    // métodos
    actualizarPaginacion,
    irAPagina,
    paginaAnterior,
    paginaSiguiente,
    irAlInicio,
    irAlFinal,
    reiniciar,
  }
}