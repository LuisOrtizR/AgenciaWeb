import { Response } from 'express'
import { OpcionesPaginacion } from '../tipos.js'

export const respuestaExito = <T>(
  res:     Response,
  datos:   T,
  mensaje: string = 'Operacion exitosa',
  codigo:  number = 200
): Response =>
  res.status(codigo).json({
    exito:        true,
    mensaje,
    datos,
    marca_tiempo: new Date().toISOString(),
  })

export const respuestaError = (
  res:      Response,
  mensaje:  string,
  codigo:   number  = 400,
  detalles: unknown = null
): Response =>
  res.status(codigo).json({
    exito:        false,
    mensaje,
    detalles,
    marca_tiempo: new Date().toISOString(),
  })

export const respuestaPaginada = <T>(
  res:        Response,
  datos:      T[],
  paginacion: OpcionesPaginacion
): Response =>
  res.status(200).json({
    exito: true,
    datos,
    paginacion: {
      pagina_actual:   paginacion.paginaActual,
      total_paginas:   paginacion.totalPaginas,
      total_registros: paginacion.totalRegistros,
      por_pagina:      paginacion.porPagina,
    },
  })