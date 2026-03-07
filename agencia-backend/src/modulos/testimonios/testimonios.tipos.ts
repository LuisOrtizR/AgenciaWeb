import { z } from 'zod'

// ─── Esquemas de validación ───────────────────────────────────────────────────

// Formulario público (con honeypot anti-bot)
export const esquemaEnviarTestimonio = z.object({
  nombreCliente: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  empresa:       z.string().max(100).optional().nullable(),
  contenido:     z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(1000),
  calificacion:  z.number().int().min(1).max(5),
  proyectoId:    z.string().uuid('ID de proyecto inválido').optional().nullable(),
  sitioWeb:      z.string().optional(), // honeypot anti-bot — si tiene valor es bot
})

export const esquemaCrearTestimonio = z.object({
  nombreCliente: z.string().min(2).max(100),
  empresa:       z.string().max(100).optional().nullable(),
  contenido:     z.string().min(10).max(1000),
  calificacion:  z.number().int().min(1).max(5),
  proyectoId:    z.string().uuid().optional().nullable(),
  usuarioId:     z.string().uuid().optional().nullable(),
  visible:       z.boolean().default(false),
})

export const esquemaActualizarTestimonio = z.object({
  nombreCliente: z.string().min(2).max(100).optional(),
  empresa:       z.string().max(100).optional().nullable(),
  contenido:     z.string().min(10).max(1000).optional(),
  calificacion:  z.number().int().min(1).max(5).optional(),
  proyectoId:    z.string().uuid().optional().nullable(),
  usuarioId:     z.string().uuid().optional().nullable(),
  visible:       z.boolean().optional(),
})

export const esquemaModeracion = z.object({
  visible: z.boolean(),
})

export const esquemaFiltrosTestimonio = z.object({
  pagina:       z.coerce.number().int().min(1).default(1),
  porPagina:    z.coerce.number().int().min(1).max(100).default(10),
  busqueda:     z.string().optional(),
  visible:      z.enum(['true', 'false']).optional(),
  calificacion: z.coerce.number().int().min(1).max(5).optional(),
  proyectoId:   z.string().uuid().optional(),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type DatosEnviarTestimonio    = z.infer<typeof esquemaEnviarTestimonio>
export type DatosCrearTestimonio     = z.infer<typeof esquemaCrearTestimonio>
export type DatosActualizarTestimonio = z.infer<typeof esquemaActualizarTestimonio>
export type DatosModeracion          = z.infer<typeof esquemaModeracion>
export type FiltrosTestimonio        = z.infer<typeof esquemaFiltrosTestimonio>