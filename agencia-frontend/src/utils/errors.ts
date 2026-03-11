// src/utils/errors.ts
export function extraerMensaje(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { mensaje?: string } } }).response
    if (res?.data?.mensaje) return res.data.mensaje
  }
  if (err instanceof Error) return err.message
  return 'Ocurrió un error inesperado'
}