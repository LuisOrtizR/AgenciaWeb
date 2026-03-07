import { z } from 'zod'

// ─── Esquemas de validación ───────────────────────────────────────────────────

export const esquemaActualizarPerfil = z.object({
  nombre:   z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).optional(),
  telefono: z.string().max(20).optional().nullable(),
  empresa:  z.string().max(100).optional().nullable(),
})

export const esquemaCambiarContrasena = z.object({
  contrasenaActual: z.string().min(1, 'La contraseña actual es requerida'),
  contrasenaNueva:  z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
})

export const esquemaCrearUsuario = z.object({
  nombre:     z.string().min(2).max(100),
  correo:     z.string().email('El correo no es válido'),
  contrasena: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  rol:      z.enum(['ADMIN', 'CLIENTE']).default('CLIENTE'),
  telefono: z.string().max(20).optional().nullable(),
  empresa:  z.string().max(100).optional().nullable(),
})

export const esquemaActualizarUsuario = z.object({
  nombre:   z.string().min(2).max(100).optional(),
  telefono: z.string().max(20).optional().nullable(),
  empresa:  z.string().max(100).optional().nullable(),
})

export const esquemaFiltrosUsuario = z.object({
  pagina:    z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(10),
  busqueda:  z.string().optional(),
  rol:       z.enum(['ADMIN', 'CLIENTE']).optional(),
  activo:    z.enum(['true', 'false']).optional(),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type DatosActualizarPerfil   = z.infer<typeof esquemaActualizarPerfil>
export type DatosCambiarContrasena  = z.infer<typeof esquemaCambiarContrasena>
export type DatosCrearUsuario       = z.infer<typeof esquemaCrearUsuario>
export type DatosActualizarUsuario  = z.infer<typeof esquemaActualizarUsuario>
export type FiltrosUsuario          = z.infer<typeof esquemaFiltrosUsuario>