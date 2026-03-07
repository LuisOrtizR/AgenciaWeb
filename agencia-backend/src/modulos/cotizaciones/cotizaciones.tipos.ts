import { z } from 'zod'

// ─── Esquemas de validación ───────────────────────────────────────────────────

export const esquemaCrearCotizacion = z.object({
  prospectoId: z.string().uuid('ID de prospecto inválido'),
  servicioId:  z.string().uuid('ID de servicio inválido'),
  extras:      z.array(z.string()).default([]),
  precioTotal: z.number().positive('El precio debe ser mayor a 0'),
  notas:       z.string().max(1000).optional().nullable(),
})

export const esquemaActualizarCotizacion = z.object({
  extras:      z.array(z.string()).optional(),
  precioTotal: z.number().positive('El precio debe ser mayor a 0').optional(),
  notas:       z.string().max(1000).optional().nullable(),
})

export const esquemaActualizarEstadoCotizacion = z.object({
  estado: z.enum(['PENDIENTE', 'ENVIADA', 'ACEPTADA', 'RECHAZADA'], {
    message: 'Estado inválido. Usa: PENDIENTE, ENVIADA, ACEPTADA o RECHAZADA',
  }),
  notas: z.string().max(1000).optional().nullable(),
})

export const esquemaFiltrosCotizacion = z.object({
  pagina:      z.coerce.number().int().min(1).default(1),
  porPagina:   z.coerce.number().int().min(1).max(100).default(10),
  busqueda:    z.string().optional(),
  estado:      z.enum(['PENDIENTE', 'ENVIADA', 'ACEPTADA', 'RECHAZADA']).optional(),
  prospectoId: z.string().uuid().optional(),
  servicioId:  z.string().uuid().optional(),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type DatosCrearCotizacion            = z.infer<typeof esquemaCrearCotizacion>
export type DatosActualizarCotizacion       = z.infer<typeof esquemaActualizarCotizacion>
export type DatosActualizarEstadoCotizacion = z.infer<typeof esquemaActualizarEstadoCotizacion>
export type FiltrosCotizacion               = z.infer<typeof esquemaFiltrosCotizacion>