import multer, { FileFilterCallback } from 'multer'
import { Request, Response, NextFunction } from 'express'
import { respuestaError } from '../utilidades/respuesta.js'

/**
 * Middleware de subida de imágenes con Multer.
 * Almacenamiento en MEMORIA — no escribe en disco.
 * Tipos permitidos: jpg, jpeg, png, webp
 * Tamaño máximo: 5 MB
 * Campo esperado en el formulario: "imagen"
 */

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const LIMITE_BYTES     = 5 * 1024 * 1024 // 5 MB

const filtroArchivo = (
  _req:     Request,
  archivo:  Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (TIPOS_PERMITIDOS.includes(archivo.mimetype)) {
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

// Middleware listo para usar en rutas: router.post('/ruta', subirImagenUnica, controlador)
export const subirImagenUnica = subida.single('imagen')

// Manejador de errores de Multer — registrar DESPUÉS de las rutas en aplicacion.ts
export const manejarErrorSubida = (
  error: unknown,
  _req:  Request,
  res:   Response,
  next:  NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      respuestaError(res, 'El archivo supera el límite de 5 MB', 400)
      return
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      respuestaError(res, 'Campo de archivo inesperado. Usa el campo "imagen"', 400)
      return
    }
    respuestaError(res, `Error al subir archivo: ${error.message}`, 400)
    return
  }

  if (error instanceof Error && error.message.includes('Tipo no permitido')) {
    respuestaError(res, error.message, 400)
    return
  }

  next(error)
}