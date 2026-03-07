import { z } from 'zod'

// ─── Esquemas de validación ───────────────────────────────────────────────────

export const esquemaCrearProyecto = z.object({
  titulo:       z.string().min(3, 'El título debe tener al menos 3 caracteres').max(150),
  slug:         z.string().min(3).max(150).regex(/^[a-z0-9-]+$/, 'El slug solo puede tener letras minúsculas, números y guiones'),
  descripcion:  z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(3000),
  stackTecnico: z.array(z.string()).min(1, 'Agrega al menos una tecnología'),
  imagenUrl:    z.string().url('URL de imagen inválida').optional().nullable(),
  urlEnVivo:    z.string().url('URL inválida').optional().nullable(),
  urlGithub:    z.string().url('URL inválida').optional().nullable(),
  destacado:    z.boolean().default(false),
  servicioId:   z.string().uuid('ID de servicio inválido').optional().nullable(),
})

export const esquemaActualizarProyecto = z.object({
  titulo:       z.string().min(3).max(150).optional(),
  slug:         z.string().min(3).max(150).regex(/^[a-z0-9-]+$/).optional(),
  descripcion:  z.string().min(10).max(3000).optional(),
  stackTecnico: z.array(z.string()).min(1).optional(),
  imagenUrl:    z.string().url().optional().nullable(),
  urlEnVivo:    z.string().url().optional().nullable(),
  urlGithub:    z.string().url().optional().nullable(),
  destacado:    z.boolean().optional(),
  servicioId:   z.string().uuid().optional().nullable(),
})

export const esquemaFiltrosProyecto = z.object({
  pagina:     z.coerce.number().int().min(1).default(1),
  porPagina:  z.coerce.number().int().min(1).max(100).default(12),
  busqueda:   z.string().optional(),
  destacado:  z.enum(['true', 'false']).optional(),
  servicioId: z.string().uuid().optional(),
  tecnologia: z.string().optional(),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type DatosCrearProyecto      = z.infer<typeof esquemaCrearProyecto>
export type DatosActualizarProyecto = z.infer<typeof esquemaActualizarProyecto>
export type FiltrosProyecto         = z.infer<typeof esquemaFiltrosProyecto>