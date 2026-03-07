import { z } from 'zod'

// ─── Esquemas de validación ───────────────────────────────────────────────────

export const esquemaCrearServicio = z.object({
  nombre:          z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  slug:            z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, 'El slug solo puede tener letras minúsculas, números y guiones'),
  descripcion:     z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(2000),
  precioDesde:     z.number().int().positive('El precio mínimo debe ser positivo'),
  precioHasta:     z.number().int().positive('El precio máximo debe ser positivo'),
  semanasEntrega:  z.number().int().positive('Las semanas de entrega deben ser positivas'),
  caracteristicas: z.array(z.string()).min(1, 'Agrega al menos una característica'),
})

export const esquemaActualizarServicio = z.object({
  nombre:          z.string().min(3).max(100).optional(),
  slug:            z.string().min(3).max(100).regex(/^[a-z0-9-]+$/).optional(),
  descripcion:     z.string().min(10).max(2000).optional(),
  precioDesde:     z.number().int().positive().optional(),
  precioHasta:     z.number().int().positive().optional(),
  semanasEntrega:  z.number().int().positive().optional(),
  caracteristicas: z.array(z.string()).min(1).optional(),
  activo:          z.boolean().optional(),
})

export const esquemaFiltrosServicio = z.object({
  pagina:    z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(10),
  busqueda:  z.string().optional(),
  activo:    z.enum(['true', 'false']).optional(),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type DatosCrearServicio      = z.infer<typeof esquemaCrearServicio>
export type DatosActualizarServicio = z.infer<typeof esquemaActualizarServicio>
export type FiltrosServicio         = z.infer<typeof esquemaFiltrosServicio>