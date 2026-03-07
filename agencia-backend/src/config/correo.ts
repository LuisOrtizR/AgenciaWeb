import { Resend } from 'resend'
import entorno    from './entorno.js'
import logger     from '../utilidades/logger.js'

/**
 * Servicio de correos con Resend.
 *
 * Funciones disponibles:
 *  1. notificarNuevoProspecto      → admin recibe datos del lead
 *  2. confirmarRecepcionProspecto  → cliente recibe confirmación de su solicitud
 *  3. notificarNuevoTestimonio     → admin recibe aviso de testimonio pendiente
 *  4. enviarCotizacion             → cliente recibe su cotización por correo
 *  5. enviarBienvenida             → cliente recibe correo al registrarse
 */

const resend = new Resend(entorno.RESEND_CLAVE)

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DatosProspectoCorreo {
  nombre:       string
  correo:       string
  telefono?:    string | null
  tipoServicio: string
  mensaje?:     string | null
  presupuesto?: number | null
  fuente?:      string | null
}

export interface DatosTestimonioCorreo {
  nombreCliente: string
  empresa?:      string | null
  contenido:     string
  calificacion:  number
}

export interface DatosCotizacionCorreo {
  nombreCliente: string
  correoCliente: string
  servicio:      string
  extras:        string[]
  precioTotal:   number
  notas?:        string | null
}

export interface DatosBienvenidaCorreo {
  nombre: string
  correo: string
}

// ─── Función base ─────────────────────────────────────────────────────────────

const enviar = async (para: string, asunto: string, html: string): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from:    `${entorno.CORREO_NOMBRE_REMITENTE} <onboarding@resend.dev>`,
      to:      [para],
      subject: asunto,
      html,
    })
    if (error) {
      logger.error(`[Correo] Error → ${asunto}: ${error.message}`)
    } else {
      logger.info(`[Correo] ✅ Enviado → ${asunto}`)
    }
  } catch (err) {
    logger.error(`[Correo] Excepción → ${err instanceof Error ? err.message : err}`)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatearPeso = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)

const etiquetaServicio: Record<string, string> = {
  LANDING:       'Landing Page',
  CORPORATIVO:   'Sitio Corporativo',
  ECOMMERCE:     'Tienda E-commerce',
  SAAS:          'Aplicación Web / SaaS',
  MANTENIMIENTO: 'Mantenimiento Web',
}

// Plantilla base compartida por todos los correos
const plantillaBase = (cuerpo: string, titulo: string) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px 40px;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">${titulo}</h1>
            <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px;">${entorno.EMPRESA_NOMBRE}</p>
          </td>
        </tr>

        <tr>
          <td style="background:#fff;padding:32px 40px;">
            ${cuerpo}
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;padding:18px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:13px;">
              ${entorno.EMPRESA_NOMBRE} ·
              <a href="mailto:${entorno.EMPRESA_CORREO_SOPORTE}" style="color:#6366f1;text-decoration:none;">
                ${entorno.EMPRESA_CORREO_SOPORTE}
              </a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

// Componente de campo reutilizable
const campo = (etiqueta: string, valor: string) => `
  <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">${etiqueta}</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:14px;">
    <p style="margin:0;font-size:15px;color:#1e293b;">${valor}</p>
  </div>
`

// ─── 1. Notificación nuevo prospecto → ADMIN ─────────────────────────────────

export const notificarNuevoProspecto = async (datos: DatosProspectoCorreo): Promise<void> => {
  const tipo = etiquetaServicio[datos.tipoServicio] ?? datos.tipoServicio

  const cuerpo = `
    <p style="color:#475569;font-size:15px;margin:0 0 20px;">
      Alguien llenó el formulario de contacto. Aquí están sus datos:
    </p>
    ${campo('Nombre', datos.nombre)}
    ${campo('Correo', `<a href="mailto:${datos.correo}" style="color:#6366f1;">${datos.correo}</a>`)}
    ${datos.telefono ? campo('Teléfono', `<a href="tel:${datos.telefono}" style="color:#6366f1;">${datos.telefono}</a>`) : ''}
    ${campo('Servicio de interés', tipo)}
    ${datos.presupuesto ? campo('Presupuesto', formatearPeso(datos.presupuesto)) : ''}
    ${datos.fuente ? campo('¿Cómo nos encontró?', datos.fuente) : ''}
    ${datos.mensaje ? campo('Mensaje', datos.mensaje) : ''}
    <div style="background:#eff6ff;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 18px;margin-top:8px;">
      <p style="margin:0;color:#1e40af;font-size:14px;">
        💡 <strong>Próximo paso:</strong> Contacta a este prospecto lo antes posible.
      </p>
    </div>
  `

  await enviar(
    entorno.EMPRESA_CORREO_SOPORTE,
    `🎯 Nuevo prospecto: ${datos.nombre} — ${tipo}`,
    plantillaBase(cuerpo, '🎯 Nuevo Prospecto')
  )
}

// ─── 2. Confirmación al cliente que llenó el formulario ──────────────────────

export const confirmarRecepcionProspecto = async (datos: DatosProspectoCorreo): Promise<void> => {
  const tipo = etiquetaServicio[datos.tipoServicio] ?? datos.tipoServicio

  const cuerpo = `
    <p style="color:#1e293b;font-size:16px;margin:0 0 12px;">Hola <strong>${datos.nombre}</strong>,</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Recibimos tu solicitud y nos comunicaremos contigo en las próximas
      <strong>24 horas hábiles</strong>.
    </p>
    <div style="background:#eff6ff;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.7;">
        📋 <strong>Resumen:</strong><br>
        Servicio: ${tipo}<br>
        ${datos.presupuesto ? `Presupuesto: ${formatearPeso(datos.presupuesto)}` : ''}
      </p>
    </div>
    <p style="color:#475569;font-size:14px;margin:0;">
      Si tienes alguna pregunta urgente, responde este correo directamente.
    </p>
  `

  await enviar(
    datos.correo,
    `✅ Recibimos tu solicitud — ${entorno.EMPRESA_NOMBRE}`,
    plantillaBase(cuerpo, '¡Gracias por contactarnos!')
  )
}

// ─── 3. Notificación nuevo testimonio pendiente → ADMIN ──────────────────────

export const notificarNuevoTestimonio = async (datos: DatosTestimonioCorreo): Promise<void> => {
  const estrellas = '⭐'.repeat(datos.calificacion) + '☆'.repeat(5 - datos.calificacion)

  const cuerpo = `
    <p style="color:#475569;font-size:15px;margin:0 0 20px;">
      Un cliente envió un testimonio. Apruébalo desde el panel de administración.
    </p>
    ${campo('Cliente', datos.nombreCliente + (datos.empresa ? ` — ${datos.empresa}` : ''))}
    ${campo('Calificación', `${estrellas} (${datos.calificacion}/5)`)}
    ${campo('Testimonio', `<em>"${datos.contenido}"</em>`)}
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;">
      <p style="margin:0;color:#92400e;font-size:14px;">
        ⚡ <strong>Acción requerida:</strong> Panel → Testimonios → Pendientes.
      </p>
    </div>
  `

  await enviar(
    entorno.EMPRESA_CORREO_SOPORTE,
    `⭐ Testimonio pendiente: ${datos.nombreCliente} (${datos.calificacion}/5)`,
    plantillaBase(cuerpo, '⭐ Nuevo Testimonio Pendiente')
  )
}

// ─── 4. Cotización enviada al cliente ────────────────────────────────────────

export const enviarCotizacion = async (datos: DatosCotizacionCorreo): Promise<void> => {
  const extrasHtml = datos.extras.length > 0
    ? datos.extras.map(e => `
        <tr>
          <td style="padding:7px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#22c55e;margin-right:8px;">✓</span>
            <span style="color:#475569;font-size:14px;">${e}</span>
          </td>
        </tr>`).join('')
    : `<tr><td style="color:#94a3b8;font-size:14px;padding:7px 0;">Sin extras adicionales</td></tr>`

  const cuerpo = `
    <p style="color:#1e293b;font-size:16px;margin:0 0 12px;">Hola <strong>${datos.nombreCliente}</strong>,</p>
    <p style="color:#475569;font-size:15px;margin:0 0 24px;">
      Preparamos tu cotización personalizada. Revisa los detalles:
    </p>
    ${campo('Servicio', datos.servicio)}
    <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Extras incluidos</p>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:4px 14px;margin-bottom:14px;">
      ${extrasHtml}
    </table>
    ${datos.notas ? campo('Notas', datos.notas) : ''}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:12px;margin:20px 0;">
      <tr>
        <td style="padding:24px;text-align:center;">
          <p style="color:#c7d2fe;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;">Inversión total</p>
          <p style="color:#fff;margin:0;font-size:34px;font-weight:800;">${formatearPeso(datos.precioTotal)}</p>
        </td>
      </tr>
    </table>
    <p style="color:#475569;font-size:14px;margin:0;">
      Para aceptar esta cotización o resolver dudas, responde este correo.
    </p>
  `

  await enviar(
    datos.correoCliente,
    `📄 Tu cotización de ${entorno.EMPRESA_NOMBRE} — ${formatearPeso(datos.precioTotal)}`,
    plantillaBase(cuerpo, '📄 Tu Cotización')
  )
}

// ─── 5. Bienvenida al registrarse ─────────────────────────────────────────────

export const enviarBienvenida = async (datos: DatosBienvenidaCorreo): Promise<void> => {
  const cuerpo = `
    <p style="color:#1e293b;font-size:16px;margin:0 0 12px;">Hola <strong>${datos.nombre}</strong> 👋</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Tu cuenta en <strong>${entorno.EMPRESA_NOMBRE}</strong> fue creada exitosamente.
      Ya puedes iniciar sesión y acceder a tu perfil.
    </p>
    <div style="background:#eff6ff;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 18px;">
      <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.7;">
        🔐 <strong>Tus datos de acceso</strong><br>
        Correo: <strong>${datos.correo}</strong><br>
        Contraseña: la que registraste al crear tu cuenta
      </p>
    </div>
  `

  await enviar(
    datos.correo,
    `¡Bienvenido/a a ${entorno.EMPRESA_NOMBRE}! 🎉`,
    plantillaBase(cuerpo, '¡Bienvenido/a! 🎉')
  )
}