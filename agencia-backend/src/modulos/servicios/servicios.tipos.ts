import { z } from 'zod'

const regexSlug = /^[a-z0-9-]+$/

export const esquemaCrearServicio = z.object({
  nombre:          z.string().min(3).max(100).trim(),
  slug:            z.string().min(3).max(100).trim().regex(regexSlug, 'Solo minusculas, numeros y guiones'),
  descripcion:     z.string().min(10).max(3000).trim(),
  precioDesde:     z.number().int().positive(),
  precioHasta:     z.number().int().positive(),
  semanasEntrega:  z.number().int().min(1).max(52),
  caracteristicas: z.array(z.string().min(1).max(200).trim()).min(1).max(20),
}).refine(
  (d) => d.precioDesde <= d.precioHasta,
  { message: 'El precio minimo no puede superar al precio maximo', path: ['precioDesde'] }
)

export const esquemaActualizarServicio = z.object({
  nombre:          z.string().min(3).max(100).trim().optional(),
  slug:            z.string().min(3).max(100).trim().regex(regexSlug).optional(),
  descripcion:     z.string().min(10).max(3000).trim().optional(),
  precioDesde:     z.number().int().positive().optional(),
  precioHasta:     z.number().int().positive().optional(),
  semanasEntrega:  z.number().int().min(1).max(52).optional(),
  caracteristicas: z.array(z.string().min(1).max(200).trim()).min(1).max(20).optional(),
  activo:          z.boolean().optional(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: 'Debes enviar al menos un campo para actualizar' }
).refine(
  (d) => d.precioDesde === undefined || d.precioHasta === undefined || d.precioDesde <= d.precioHasta,
  { message: 'El precio minimo no puede superar al precio maximo', path: ['precioDesde'] }
)

export const esquemaFiltrosServicio = z.object({
  pagina:    z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(10),
  busqueda:  z.string().max(200).trim().optional(),
  activo:    z.coerce.boolean().optional(),
  orden:     z.enum(['precio_asc', 'precio_desc', 'reciente']).default('precio_asc'),
})

export type DatosCrearServicio      = z.infer<typeof esquemaCrearServicio>
export type DatosActualizarServicio = z.infer<typeof esquemaActualizarServicio>
export type FiltrosServicio         = z.infer<typeof esquemaFiltrosServicio>