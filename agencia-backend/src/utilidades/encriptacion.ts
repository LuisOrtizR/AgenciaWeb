import bcrypt  from 'bcryptjs'
import entorno from '../config/entorno.js'

export const encriptarContrasena = async (contrasenaNormal: string): Promise<string> =>
  bcrypt.hash(contrasenaNormal, await bcrypt.genSalt(entorno.BCRYPT_RONDAS))

export const verificarContrasena = (
  contrasenaNormal: string,
  hashGuardado:     string
): Promise<boolean> => bcrypt.compare(contrasenaNormal, hashGuardado)

export const esContrasenaSegura = (contrasena: string): boolean =>
  contrasena.length >= 8 &&
  /[A-Z]/.test(contrasena)   &&
  /[0-9]/.test(contrasena)