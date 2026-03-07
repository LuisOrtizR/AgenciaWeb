import jwt        from 'jsonwebtoken'
import entorno     from '../config/entorno.js'
import { CargaUtilToken } from '../tipos.js'

interface DatosUsuarioToken {
  id:     string
  correo: string
  rol:    string
}

// ─── Generar token de acceso (8h por defecto) ─────────────────────────────────
export const generarToken = (usuario: DatosUsuarioToken): string => {
  return jwt.sign(
    { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
    entorno.JWT_SECRETO,
    { expiresIn: entorno.JWT_EXPIRACION as jwt.SignOptions['expiresIn'] }
  )
}

// Alias para compatibilidad
export const generarTokenAcceso = generarToken

// ─── Generar token de refresco (7d por defecto) ───────────────────────────────
export const generarTokenRefresco = (usuario: DatosUsuarioToken | string): string => {
  const id = typeof usuario === 'string' ? usuario : usuario.id
  return jwt.sign(
    { id },
    entorno.JWT_SECRETO_REFRESCO,
    { expiresIn: entorno.JWT_EXPIRACION_REFRESCO as jwt.SignOptions['expiresIn'] }
  )
}

// ─── Verificar token de acceso ────────────────────────────────────────────────
export const verificarToken = (token: string): CargaUtilToken | null => {
  try {
    return jwt.verify(token, entorno.JWT_SECRETO) as CargaUtilToken
  } catch {
    return null
  }
}

// ─── Verificar token de refresco ──────────────────────────────────────────────
export const verificarTokenRefresco = (token: string): CargaUtilToken | null => {
  try {
    return jwt.verify(token, entorno.JWT_SECRETO_REFRESCO) as CargaUtilToken
  } catch {
    return null
  }
}