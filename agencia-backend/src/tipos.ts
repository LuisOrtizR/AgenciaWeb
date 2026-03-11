// src/tipos.ts
import type { Request } from 'express'
import type { JwtPayload } from 'jsonwebtoken'

export interface CargaUtilToken extends JwtPayload {
  id:     string
  correo: string
  rol:    string
}

export interface SolicitudAutenticada extends Request {
  usuario?: CargaUtilToken
}

export interface OpcionesPaginacion {
  paginaActual:   number
  totalPaginas:   number
  totalRegistros: number
  porPagina:      number
}

export const param = (req: Request, key: string): string =>
  String(req.params[key] ?? '')

export const uid = (req: Request): string =>
  ((req as SolicitudAutenticada).usuario?.id ?? '')