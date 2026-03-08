import dotenv from 'dotenv'
dotenv.config()

const requerida = (nombre: string): string => {
  const valor = process.env[nombre]
  if (!valor) throw new Error(`Variable de entorno requerida: ${nombre}`)
  return valor
}

const opcional = (nombre: string, porDefecto = ''): string =>
  process.env[nombre] ?? porDefecto

const entorno = {
  PUERTO:  parseInt(opcional('PUERTO', '3001')),
  ENTORNO: opcional('NODE_ENV', 'development'),
  get esProduccion() { return this.ENTORNO === 'production' },

  URL_FRONTEND: opcional('URL_FRONTEND', 'http://localhost:5173'),

  JWT_SECRETO:             requerida('JWT_SECRETO'),
  JWT_SECRETO_REFRESCO:    requerida('JWT_SECRETO_REFRESCO'),
  JWT_EXPIRACION:          opcional('JWT_EXPIRACION',          '8h'),
  JWT_EXPIRACION_REFRESCO: opcional('JWT_EXPIRACION_REFRESCO', '7d'),

  DB_HOST:       requerida('DB_HOST'),
  DB_USUARIO:    requerida('DB_USUARIO'),
  DB_CONTRASENA: requerida('DB_CONTRASENA'),
  DB_NOMBRE:     requerida('DB_NOMBRE'),
  DB_PUERTO:     parseInt(opcional('DB_PUERTO', '5432')),

  BCRYPT_RONDAS: parseInt(opcional('BCRYPT_RONDAS', '10')),

  RESEND_CLAVE:            requerida('RESEND_CLAVE'),
  CORREO_NOMBRE_REMITENTE: opcional('CORREO_NOMBRE_REMITENTE', 'AIWeb Creator'),
  EMPRESA_NOMBRE:          opcional('EMPRESA_NOMBRE',          'AIWeb Creator'),
  EMPRESA_CORREO_SOPORTE:  requerida('EMPRESA_CORREO_SOPORTE'),
  EMPRESA_LOGO_URL:        opcional('EMPRESA_LOGO_URL'),

  CLOUDINARY_NOMBRE:  opcional('CLOUDINARY_NOMBRE'),
  CLOUDINARY_CLAVE:   opcional('CLOUDINARY_CLAVE'),
  CLOUDINARY_SECRETO: opcional('CLOUDINARY_SECRETO'),

  TAMAÑO_MAX_ARCHIVO: parseInt(opcional('TAMAÑO_MAX_ARCHIVO', '5242880')),

  GROQ_CLAVE: requerida('GROQ_CLAVE'),
}

export default entorno