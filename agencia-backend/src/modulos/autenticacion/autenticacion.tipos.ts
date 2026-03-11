import { z } from 'zod'


export const esquemaRegistro = z.object({
  nombre:     z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  correo:     z.string().email('El correo no es válido'),
  contrasena: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
})

export const esquemaLogin = z.object({
  correo:     z.string().email('El correo no es válido'),
  contrasena: z.string().min(1, 'La contraseña es requerida'),
})

export const esquemaRefrescarToken = z.object({
  tokenRefresco: z.string().min(1, 'El token de refresco es requerido'),
})

export const esquemaSolicitarReset = z.object({
  correo: z.string().email('El correo no es válido'),
})

export const esquemaResetearContrasena = z.object({
  token:      z.string().min(1, 'El token es requerido'),
  contrasena: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
})


export type DatosRegistro           = z.infer<typeof esquemaRegistro>
export type DatosLogin              = z.infer<typeof esquemaLogin>
export type DatosRefrescarToken     = z.infer<typeof esquemaRefrescarToken>
export type DatosSolicitarReset     = z.infer<typeof esquemaSolicitarReset>
export type DatosResetearContrasena = z.infer<typeof esquemaResetearContrasena>