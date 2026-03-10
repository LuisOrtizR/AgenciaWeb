import { z } from 'zod'

export const CAMPOS_ORDEN_PROYECTO = ['creadoEn', 'titulo', 'destacado'] as const
export const DIRECCIONES           = ['asc', 'desc'] as const

const regexSlug = /^[a-z0-9-]+$/

export const esquemaCrearProyecto = z.object({
  titulo:       z.string().min(3, 'Minimo 3 caracteres').max(150).trim(),
  slug:         z.string().min(3).max(150).trim()
                  .regex(regexSlug, 'El slug solo admite minusculas, numeros y guiones'),
  descripcion:  z.string().min(10, 'Minimo 10 caracteres').max(5000).trim(),
  stackTecnico: z.array(z.string().min(1).max(50).trim()).min(1, 'Agrega al menos una tecnologia').max(30),
  imagenUrl:    z.string().url('URL de imagen invalida').optional().nullable(),
  urlEnVivo:    z.string().url('URL invalida').optional().nullable(),
  urlGithub:    z.string().url('URL invalida').optional().nullable(),
  destacado:    z.boolean().default(false),
  servicioId:   z.string().uuid('ID de servicio invalido').optional().nullable(),
})

export const esquemaActualizarProyecto = z.object({
  titulo:       z.string().min(3).max(150).trim().optional(),
  slug:         z.string().min(3).max(150).trim().regex(regexSlug).optional(),
  descripcion:  z.string().min(10).max(5000).trim().optional(),
  stackTecnico: z.array(z.string().min(1).max(50).trim()).min(1).max(30).optional(),
  imagenUrl:    z.string().url().optional().nullable(),
  urlEnVivo:    z.string().url().optional().nullable(),
  urlGithub:    z.string().url().optional().nullable(),
  destacado:    z.boolean().optional(),
  servicioId:   z.string().uuid().optional().nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debes enviar al menos un campo para actualizar' }
)

export const esquemaFiltrosProyecto = z.object({
  pagina:      z.coerce.number().int().min(1).default(1),
  porPagina:   z.coerce.number().int().min(1).max(100).default(12),
  busqueda:    z.string().max(200).trim().optional(),
  destacado:   z.coerce.boolean().optional(),
  servicioId:  z.string().uuid().optional(),
  tecnologia:  z.string().max(50).trim().optional(),
  ordenarPor:  z.enum(CAMPOS_ORDEN_PROYECTO).default('creadoEn'),
  direccion:   z.enum(DIRECCIONES).default('desc'),
})

export type DatosCrearProyecto      = z.infer<typeof esquemaCrearProyecto>
export type DatosActualizarProyecto = z.infer<typeof esquemaActualizarProyecto>
export type FiltrosProyecto         = z.infer<typeof esquemaFiltrosProyecto>