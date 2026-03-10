import { z } from 'zod'

export const esquemaEnviarTestimonio = z.object({
  nombreCliente: z.string().min(2, 'Minimo 2 caracteres').max(100).trim(),
  empresa:       z.string().max(100).trim().optional().nullable(),
  contenido:     z.string().min(10, 'Minimo 10 caracteres').max(1000).trim(),
  calificacion:  z.number().int().min(1).max(5),
  proyectoId:    z.string().uuid('ID de proyecto invalido').optional().nullable(),
  sitioWeb:      z.string().optional(),
})

export const esquemaCrearTestimonio = z.object({
  nombreCliente: z.string().min(2).max(100).trim(),
  empresa:       z.string().max(100).trim().optional().nullable(),
  contenido:     z.string().min(10).max(1000).trim(),
  calificacion:  z.number().int().min(1).max(5),
  proyectoId:    z.string().uuid().optional().nullable(),
  usuarioId:     z.string().uuid().optional().nullable(),
  visible:       z.boolean().default(false),
})

export const esquemaActualizarTestimonio = z.object({
  nombreCliente: z.string().min(2).max(100).trim().optional(),
  empresa:       z.string().max(100).trim().optional().nullable(),
  contenido:     z.string().min(10).max(1000).trim().optional(),
  calificacion:  z.number().int().min(1).max(5).optional(),
  proyectoId:    z.string().uuid().optional().nullable(),
  usuarioId:     z.string().uuid().optional().nullable(),
  visible:       z.boolean().optional(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: 'Debes enviar al menos un campo para actualizar' }
)

export const esquemaModeracion = z.object({
  visible: z.boolean(),
})

export const esquemaFiltrosTestimonio = z.object({
  pagina:       z.coerce.number().int().min(1).default(1),
  porPagina:    z.coerce.number().int().min(1).max(100).default(10),
  busqueda:     z.string().max(200).trim().optional(),
  visible:      z.coerce.boolean().optional(),
  calificacion: z.coerce.number().int().min(1).max(5).optional(),
  proyectoId:   z.string().uuid().optional(),
})

export type DatosEnviarTestimonio     = z.infer<typeof esquemaEnviarTestimonio>
export type DatosCrearTestimonio      = z.infer<typeof esquemaCrearTestimonio>
export type DatosActualizarTestimonio = z.infer<typeof esquemaActualizarTestimonio>
export type DatosModeracion           = z.infer<typeof esquemaModeracion>
export type FiltrosTestimonio         = z.infer<typeof esquemaFiltrosTestimonio>