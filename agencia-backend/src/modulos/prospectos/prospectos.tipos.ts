import { z } from 'zod'

export const TIPOS_SERVICIO  = ['LANDING', 'CORPORATIVO', 'ECOMMERCE', 'SAAS', 'MANTENIMIENTO'] as const
export const ESTADOS_PROSPECTO = ['NUEVO', 'CONTACTADO', 'CONVERTIDO', 'PERDIDO'] as const
export const CAMPOS_ORDEN    = ['creadoEn', 'nombre', 'presupuesto', 'estado'] as const
export const DIRECCIONES     = ['asc', 'desc'] as const

export const esquemaCrearProspecto = z.object({
  nombre:       z.string().min(2, 'Minimo 2 caracteres').max(100).trim(),
  correo:       z.string().email('Correo invalido').toLowerCase().trim(),
  telefono:     z.string().max(20).trim().optional().nullable(),
  tipoServicio: z.enum(TIPOS_SERVICIO, { message: 'Tipo de servicio invalido' }),
  mensaje:      z.string().max(2000).trim().optional().nullable(),
  presupuesto:  z.number().int().positive().optional().nullable(),
  fuente:       z.string().max(100).trim().optional().nullable(),
})

export const esquemaActualizarProspecto = z.object({
  nombre:       z.string().min(2).max(100).trim().optional(),
  correo:       z.string().email().toLowerCase().trim().optional(),
  telefono:     z.string().max(20).trim().optional().nullable(),
  tipoServicio: z.enum(TIPOS_SERVICIO).optional(),
  mensaje:      z.string().max(2000).trim().optional().nullable(),
  presupuesto:  z.number().int().positive().optional().nullable(),
  fuente:       z.string().max(100).trim().optional().nullable(),
  notas:        z.string().max(5000).trim().optional().nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debes enviar al menos un campo para actualizar' }
)

export const esquemaActualizarEstadoProspecto = z.object({
  estado: z.enum(ESTADOS_PROSPECTO, {
    message: 'Estado invalido. Opciones: NUEVO, CONTACTADO, CONVERTIDO, PERDIDO',
  }),
  notas: z.string().max(5000).trim().optional().nullable(),
})

export const esquemaAsignarProspecto = z.object({
  usuarioId: z.string().uuid('ID de usuario invalido').nullable(),
})

export const esquemaFiltrosProspecto = z.object({
  pagina:       z.coerce.number().int().min(1).default(1),
  porPagina:    z.coerce.number().int().min(1).max(100).default(20),
  busqueda:     z.string().max(200).trim().optional(),
  estado:       z.enum(ESTADOS_PROSPECTO).optional(),
  tipoServicio: z.enum(TIPOS_SERVICIO).optional(),
  ordenarPor:   z.enum(CAMPOS_ORDEN).default('creadoEn'),
  direccion:    z.enum(DIRECCIONES).default('desc'),
  desde:        z.coerce.date().optional(),
  hasta:        z.coerce.date().optional(),
  conCotizacion: z.coerce.boolean().optional(),
})

export type DatosCrearProspecto            = z.infer<typeof esquemaCrearProspecto>
export type DatosActualizarProspecto       = z.infer<typeof esquemaActualizarProspecto>
export type DatosActualizarEstadoProspecto = z.infer<typeof esquemaActualizarEstadoProspecto>
export type DatosAsignarProspecto          = z.infer<typeof esquemaAsignarProspecto>
export type FiltrosProspecto               = z.infer<typeof esquemaFiltrosProspecto>