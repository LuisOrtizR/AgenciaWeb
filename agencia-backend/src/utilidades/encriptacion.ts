import bcrypt  from 'bcryptjs'
import entorno from '../config/entorno.js'

/**
 * Utilidades de encriptación con bcryptjs.
 */

// ─── Encriptar contraseña ─────────────────────────────────────────────────────
export const encriptarContrasena = async (contrasenaNormal: string): Promise<string> => {
  const sal                  = await bcrypt.genSalt(entorno.BCRYPT_RONDAS) // ya es número
  const contrasenaEncriptada = await bcrypt.hash(contrasenaNormal, sal)
  return contrasenaEncriptada
}

// ─── Verificar contraseña ─────────────────────────────────────────────────────
export const verificarContrasena = async (
  contrasenaNormal: string,
  hashGuardado:     string
): Promise<boolean> => {
  return bcrypt.compare(contrasenaNormal, hashGuardado)
}

// ─── Validar contraseña segura ────────────────────────────────────────────────
// Mín. 8 caracteres, 1 mayúscula, 1 número
export const esContrasenaSegura = (contrasena: string): boolean => {
  const tieneMinimo8   = contrasena.length >= 8
  const tieneMayuscula = /[A-Z]/.test(contrasena)
  const tieneNumero    = /[0-9]/.test(contrasena)
  return tieneMinimo8 && tieneMayuscula && tieneNumero
}