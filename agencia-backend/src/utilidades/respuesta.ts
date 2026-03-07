import { Response } from 'express'
import { OpcionesPaginacion } from '../tipos.js'

/**
 * Formato estándar para TODAS las respuestas de la API.
 * Así el frontend siempre sabe qué esperar.
 */

// ─── Respuesta exitosa ────────────────────────────────────────────────────────
export const respuestaExito = <T>(
  res:     Response,
  datos:   T,
  mensaje: string  = 'Operación exitosa',
  codigo:  number  = 200
): Response => {
  return res.status(codigo).json({
    exito:        true,
    mensaje,
    datos,
    marca_tiempo: new Date().toISOString(),
  })
}

// ─── Respuesta de error ───────────────────────────────────────────────────────
export const respuestaError = (
  res:      Response,
  mensaje:  string,
  codigo:   number  = 400,
  detalles: unknown = null
): Response => {
  return res.status(codigo).json({
    exito:        false,
    mensaje,
    detalles,
    marca_tiempo: new Date().toISOString(),
  })
}

// ─── Respuesta paginada (para listas largas) ──────────────────────────────────
export const respuestaPaginada = <T>(
  res:        Response,
  datos:      T[],
  paginacion: OpcionesPaginacion
): Response => {
  return res.status(200).json({
    exito: true,
    datos,
    paginacion: {
      pagina_actual:   paginacion.paginaActual,
      total_paginas:   paginacion.totalPaginas,
      total_registros: paginacion.totalRegistros,
      por_pagina:      paginacion.porPagina,
    },
  })
}
