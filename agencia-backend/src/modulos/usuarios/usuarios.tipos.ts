import { z } from 'zod'

const regexContrasena = [
  z.string().regex(/[A-Z]/, 'Debe contener al menos una mayuscula'),
  z.string().regex(/[0-9]/, 'Debe contener al menos un numero'),
] as const

const contrasenaBase = z.string().min(8, 'Minimo 8 caracteres').superRefine((val, ctx) => {
  if (!/[A-Z]/.test(val)) ctx.addIssue({ code: 'custom', message: 'Debe contener al menos una mayuscula' })
  if (!/[0-9]/.test(val)) ctx.addIssue({ code: 'custom', message: 'Debe contener al menos un numero'    })
})

export const esquemaActualizarPerfil = z.object({
  nombre:   z.string().min(2, 'Minimo 2 caracteres').max(100).trim().optional(),
  telefono: z.string().max(20).trim().optional().nullable(),
  empresa:  z.string().max(100).trim().optional().nullable(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: 'Debes enviar al menos un campo para actualizar' }
)

export const esquemaCambiarContrasena = z.object({
  contrasenaActual: z.string().min(1, 'La contrasena actual es requerida'),
  contrasenaNueva:  contrasenaBase,
}).refine(
  (d) => d.contrasenaActual !== d.contrasenaNueva,
  { message: 'La nueva contrasena debe ser diferente a la actual', path: ['contrasenaNueva'] }
)

export const esquemaCrearUsuario = z.object({
  nombre:     z.string().min(2).max(100).trim(),
  correo:     z.string().email('Correo invalido').toLowerCase().trim(),
  contrasena: contrasenaBase,
  rol:        z.enum(['ADMIN', 'CLIENTE']).default('CLIENTE'),
  telefono:   z.string().max(20).trim().optional().nullable(),
  empresa:    z.string().max(100).trim().optional().nullable(),
})

export const esquemaActualizarUsuario = z.object({
  nombre:   z.string().min(2).max(100).trim().optional(),
  telefono: z.string().max(20).trim().optional().nullable(),
  empresa:  z.string().max(100).trim().optional().nullable(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: 'Debes enviar al menos un campo para actualizar' }
)

export const esquemaCambiarRol = z.object({
  rol: z.enum(['ADMIN', 'CLIENTE'], { message: 'Rol invalido. Usa ADMIN o CLIENTE' }),
})

export const esquemaFiltrosUsuario = z.object({
  pagina:    z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(10),
  busqueda:  z.string().max(200).trim().optional(),
  rol:       z.enum(['ADMIN', 'CLIENTE']).optional(),
  activo:    z.coerce.boolean().optional(),
})

export type DatosActualizarPerfil  = z.infer<typeof esquemaActualizarPerfil>
export type DatosCambiarContrasena = z.infer<typeof esquemaCambiarContrasena>
export type DatosCrearUsuario      = z.infer<typeof esquemaCrearUsuario>
export type DatosActualizarUsuario = z.infer<typeof esquemaActualizarUsuario>
export type DatosCambiarRol        = z.infer<typeof esquemaCambiarRol>
export type FiltrosUsuario         = z.infer<typeof esquemaFiltrosUsuario>