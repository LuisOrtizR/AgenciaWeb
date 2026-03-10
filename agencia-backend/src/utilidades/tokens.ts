import jwt             from 'jsonwebtoken'
import entorno         from '../config/entorno.js'
import { CargaUtilToken } from '../tipos.js'

interface DatosUsuarioToken {
  id:     string
  correo: string
  rol:    string
}

export const generarToken = (usuario: DatosUsuarioToken): string =>
  jwt.sign(
    { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
    entorno.JWT_SECRETO,
    { expiresIn: entorno.JWT_EXPIRACION as jwt.SignOptions['expiresIn'] }
  )

export const generarTokenAcceso = generarToken

export const generarTokenRefresco = (usuario: DatosUsuarioToken | string): string =>
  jwt.sign(
    { id: typeof usuario === 'string' ? usuario : usuario.id },
    entorno.JWT_SECRETO_REFRESCO,
    { expiresIn: entorno.JWT_EXPIRACION_REFRESCO as jwt.SignOptions['expiresIn'] }
  )

const verificar = (token: string, secreto: string): CargaUtilToken | null => {
  try {
    return jwt.verify(token, secreto) as CargaUtilToken
  } catch {
    return null
  }
}

export const verificarToken = (token: string): CargaUtilToken | null =>
  verificar(token, entorno.JWT_SECRETO)

export const verificarTokenRefresco = (token: string): CargaUtilToken | null =>
  verificar(token, entorno.JWT_SECRETO_REFRESCO)