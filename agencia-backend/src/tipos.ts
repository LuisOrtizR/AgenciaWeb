import { Request }    from 'express'
import { JwtPayload } from 'jsonwebtoken'

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