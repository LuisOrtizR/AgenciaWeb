import { z } from 'zod'

export const esquemaCrearServicio = z.object({
  nombre:          z.string().min(3).max(100),
  slug:            z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  descripcion:     z.string().min(10).max(2000),
  precioDesde:     z.number().int().positive(),
  precioHasta:     z.number().int().positive(),
  semanasEntrega:  z.number().int().positive(),
  caracteristicas: z.array(z.string()).min(1),
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
  orden: z.enum(['precio_asc', 'precio_desc', 'reciente']).default('precio_asc'),
})

export type DatosCrearServicio      = z.infer<typeof esquemaCrearServicio>
export type DatosActualizarServicio = z.infer<typeof esquemaActualizarServicio>
export type FiltrosServicio         = z.infer<typeof esquemaFiltrosServicio>