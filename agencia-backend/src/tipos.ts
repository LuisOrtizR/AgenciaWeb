import { Request } from 'express'
import { JwtPayload } from 'jsonwebtoken'

// ─── Payload del token JWT ────────────────────────────────────────────────────
export interface CargaUtilToken extends JwtPayload {
  id:     string
  correo: string
  rol:    string
}

// ─── Request autenticado (con usuario inyectado por middleware) ───────────────
export interface SolicitudAutenticada extends Request {
  usuario?: CargaUtilToken
}

// ─── Opciones de paginación ───────────────────────────────────────────────────
export interface OpcionesPaginacion {
  paginaActual:    number
  totalPaginas:    number
  totalRegistros:  number
  porPagina:       number
}
