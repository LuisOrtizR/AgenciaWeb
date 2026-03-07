import { z } from 'zod'

// ─── Esquemas de validación ───────────────────────────────────────────────────

export const esquemaCrearProspecto = z.object({
  nombre:       z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  correo:       z.string().email('El correo no es válido'),
  telefono:     z.string().max(20).optional().nullable(),
  tipoServicio: z.enum(['LANDING', 'CORPORATIVO', 'ECOMMERCE', 'SAAS', 'MANTENIMIENTO'], {
    message: 'Tipo de servicio inválido',
  }),
  mensaje:      z.string().max(2000).optional().nullable(),
  presupuesto:  z.number().positive().optional().nullable(),
  fuente:       z.string().max(100).optional().nullable(),
})

export const esquemaActualizarProspecto = z.object({
  nombre:       z.string().min(2).max(100).optional(),
  correo:       z.string().email().optional(),
  telefono:     z.string().max(20).optional().nullable(),
  tipoServicio: z.enum(['LANDING', 'CORPORATIVO', 'ECOMMERCE', 'SAAS', 'MANTENIMIENTO']).optional(),
  mensaje:      z.string().max(2000).optional().nullable(),
  presupuesto:  z.number().positive().optional().nullable(),
  fuente:       z.string().max(100).optional().nullable(),
  notas:        z.string().max(2000).optional().nullable(),
})

export const esquemaActualizarEstadoProspecto = z.object({
  estado: z.enum(['NUEVO', 'CONTACTADO', 'CONVERTIDO', 'PERDIDO'], {
    message: 'Estado inválido. Usa: NUEVO, CONTACTADO, CONVERTIDO o PERDIDO',
  }),
  notas: z.string().max(2000).optional().nullable(),
})

export const esquemaFiltrosProspecto = z.object({
  pagina:       z.coerce.number().int().min(1).default(1),
  porPagina:    z.coerce.number().int().min(1).max(100).default(10),
  busqueda:     z.string().optional(),
  estado:       z.enum(['NUEVO', 'CONTACTADO', 'CONVERTIDO', 'PERDIDO']).optional(),
  tipoServicio: z.enum(['LANDING', 'CORPORATIVO', 'ECOMMERCE', 'SAAS', 'MANTENIMIENTO']).optional(),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type DatosCrearProspecto            = z.infer<typeof esquemaCrearProspecto>
export type DatosActualizarProspecto       = z.infer<typeof esquemaActualizarProspecto>
export type DatosActualizarEstadoProspecto = z.infer<typeof esquemaActualizarEstadoProspecto>
export type FiltrosProspecto               = z.infer<typeof esquemaFiltrosProspecto>