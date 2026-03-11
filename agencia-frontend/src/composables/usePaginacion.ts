import type { Paginacion } from '@/types'

export function usePaginacion(porPaginaInicial = 10) {
  const paginaActual   = ref(1)
  const porPagina      = ref(porPaginaInicial)
  const totalPaginas   = ref(1)
  const totalRegistros = ref(0)

  const hayPaginaAnterior  = computed(() => paginaActual.value > 1)
  const hayPaginaSiguiente = computed(() => paginaActual.value < totalPaginas.value)
  const tienePaginacion    = computed(() => totalPaginas.value > 1)

  const rangoVisible = computed<number[]>(() => {
    const inicio = Math.max(1, paginaActual.value - 2)
    const fin    = Math.min(totalPaginas.value, paginaActual.value + 2)
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i)
  })

  const irAPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas.value) paginaActual.value = pagina
  }

  const actualizarPaginacion = (p: Paginacion) => {
    paginaActual.value   = p.pagina
    totalPaginas.value   = p.totalPaginas
    totalRegistros.value = p.total
    porPagina.value      = p.porPagina
  }

  const reiniciar = () => {
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
    tienePaginacion,
    rangoVisible,
    actualizarPaginacion,
    irAPagina,
    paginaAnterior:  () => irAPagina(paginaActual.value - 1),
    paginaSiguiente: () => irAPagina(paginaActual.value + 1),
    irAlInicio:      () => irAPagina(1),
    irAlFinal:       () => irAPagina(totalPaginas.value),
    reiniciar,
  }
}