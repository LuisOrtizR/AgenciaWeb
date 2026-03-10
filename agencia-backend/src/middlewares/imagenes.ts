import multer, { FileFilterCallback } from 'multer'
import { Request, Response, NextFunction } from 'express'
import { respuestaError } from '../utilidades/respuesta.js'

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const LIMITE_BYTES     = 5 * 1024 * 1024 // 5 MB

const filtroArchivo = (
  _req:     Request,
  archivo:  Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (TIPOS_PERMITIDOS.has(archivo.mimetype)) {
    callback(null, true)
  } else {
    callback(new Error(`Tipo no permitido: ${archivo.mimetype}. Solo JPG, PNG y WEBP.`))
  }
}

const subida = multer({
  storage:    multer.memoryStorage(),
  limits:     { fileSize: LIMITE_BYTES },
  fileFilter: filtroArchivo,
})

export const subirImagenUnica = subida.single('imagen')

export const manejarErrorSubida = (
  error: unknown,
  _req:  Request,
  res:   Response,
  next:  NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    const mensajes: Partial<Record<multer.MulterError['code'], string>> = {
      LIMIT_FILE_SIZE:      'El archivo supera el limite de 5 MB',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado. Usa el campo "imagen"',
    }
    const mensaje = mensajes[error.code] ?? `Error al subir archivo: ${error.message}`
    respuestaError(res, mensaje, 400)
    return
  }

  if (error instanceof Error && error.message.startsWith('Tipo no permitido')) {
    respuestaError(res, error.message, 400)
    return
  }

  next(error)
}