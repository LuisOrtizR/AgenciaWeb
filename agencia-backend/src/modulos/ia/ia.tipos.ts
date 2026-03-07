    import { z } from 'zod'

export const esquemaChatMensaje = z.object({
  mensaje: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
  historial: z.array(z.object({
    rol:       z.enum(['user', 'assistant']),
    contenido: z.string(),
  })).max(10).default([]),
})

export const esquemaGenerarPropuesta = z.object({
  prospectoId: z.string().uuid('ID de prospecto inválido'),
})

export const esquemaAnalizarProspecto = z.object({
  prospectoId: z.string().uuid('ID de prospecto inválido'),
})

export const esquemaGenerarDescripcion = z.object({
  titulo:       z.string().min(3).max(150),
  stackTecnico: z.array(z.string()).min(1),
  tipoServicio: z.string(),
  urlEnVivo:    z.string().optional(),
})

export type DatosChatMensaje        = z.infer<typeof esquemaChatMensaje>
export type DatosGenerarPropuesta   = z.infer<typeof esquemaGenerarPropuesta>
export type DatosAnalizarProspecto  = z.infer<typeof esquemaAnalizarProspecto>
export type DatosGenerarDescripcion = z.infer<typeof esquemaGenerarDescripcion>