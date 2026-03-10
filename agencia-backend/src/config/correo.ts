import { Resend } from 'resend'
import entorno    from './entorno.js'
import logger     from '../utilidades/logger.js'

const resend = new Resend(entorno.RESEND_CLAVE)


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

export interface DatosResetCorreo {
  nombre:   string
  correo:   string
  urlReset: string
}


const enviar = async (para: string, asunto: string, html: string): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from:    `${entorno.CORREO_NOMBRE_REMITENTE} <onboarding@resend.dev>`,
      to:      [para],
      subject: asunto,
      html,
    })
    if (error) logger.error(`[Correo] Error — ${asunto}: ${error.message}`)
    else        logger.info(`[Correo] Enviado — ${asunto}`)
  } catch (err) {
    logger.error(`[Correo] Excepcion — ${err instanceof Error ? err.message : err}`)
  }
}

const formatearPeso = (n: number): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const etiquetaServicio: Record<string, string> = {
  LANDING:       'Landing Page',
  CORPORATIVO:   'Sitio Corporativo',
  ECOMMERCE:     'Tienda E-commerce',
  SAAS:          'Aplicacion Web / SaaS',
  MANTENIMIENTO: 'Mantenimiento Web',
}

const logoHtml = entorno.EMPRESA_LOGO_URL
  ? `<div style="text-align:center;margin-bottom:20px;">
       <div style="display:inline-block;background:#fff;border-radius:16px;padding:12px;box-shadow:0 2px 12px rgba(0,0,0,.15);">
         <img
           src="${entorno.EMPRESA_LOGO_URL}"
           alt="${entorno.EMPRESA_NOMBRE}"
           width="72" height="72"
           style="display:block;width:72px;height:72px;object-fit:contain;border-radius:10px;"
         />
       </div>
     </div>`
  : `<div style="text-align:center;margin-bottom:20px;">
       <div style="display:inline-block;background:rgba(255,255,255,.15);border-radius:16px;padding:14px 22px;">
         <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">${entorno.EMPRESA_NOMBRE}</span>
       </div>
     </div>`

const plantillaBase = (cuerpo: string, titulo: string): string => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
            ${logoHtml}
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
              ${entorno.EMPRESA_NOMBRE} &middot;
              <a href="mailto:${entorno.EMPRESA_CORREO_SOPORTE}" style="color:#7c3aed;text-decoration:none;">
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

const campo = (etiqueta: string, valor: string): string => `
  <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">${etiqueta}</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:14px;">
    <p style="margin:0;font-size:15px;color:#1e293b;">${valor}</p>
  </div>
`


export const notificarNuevoProspecto = async (datos: DatosProspectoCorreo): Promise<void> => {
  const tipo = etiquetaServicio[datos.tipoServicio] ?? datos.tipoServicio
  const cuerpo = `
    <p style="color:#475569;font-size:15px;margin:0 0 20px;">Alguien lleno el formulario de contacto:</p>
    ${campo('Nombre', datos.nombre)}
    ${campo('Correo', `<a href="mailto:${datos.correo}" style="color:#7c3aed;">${datos.correo}</a>`)}
    ${datos.telefono ? campo('Telefono', `<a href="tel:${datos.telefono}" style="color:#7c3aed;">${datos.telefono}</a>`) : ''}
    ${campo('Servicio de interes', tipo)}
    ${datos.presupuesto ? campo('Presupuesto', formatearPeso(datos.presupuesto)) : ''}
    ${datos.fuente      ? campo('Como nos encontro', datos.fuente)               : ''}
    ${datos.mensaje     ? campo('Mensaje', datos.mensaje)                        : ''}
    <div style="background:#eff6ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 18px;margin-top:8px;">
      <p style="margin:0;color:#1e40af;font-size:14px;"><strong>Proximo paso:</strong> Contacta a este prospecto lo antes posible.</p>
    </div>
  `
  await enviar(
    entorno.EMPRESA_CORREO_SOPORTE,
    `Nuevo prospecto: ${datos.nombre} — ${tipo}`,
    plantillaBase(cuerpo, 'Nuevo Prospecto')
  )
}

export const confirmarRecepcionProspecto = async (datos: DatosProspectoCorreo): Promise<void> => {
  const tipo = etiquetaServicio[datos.tipoServicio] ?? datos.tipoServicio
  const cuerpo = `
    <p style="color:#1e293b;font-size:16px;margin:0 0 12px;">Hola <strong>${datos.nombre}</strong>,</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Recibimos tu solicitud y nos comunicaremos contigo en las proximas <strong>24 horas habiles</strong>.
    </p>
    <div style="background:#eff6ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.7;">
        <strong>Resumen:</strong><br>
        Servicio: ${tipo}<br>
        ${datos.presupuesto ? `Presupuesto: ${formatearPeso(datos.presupuesto)}` : ''}
      </p>
    </div>
    <p style="color:#475569;font-size:14px;margin:0;">Si tienes alguna pregunta urgente, responde este correo directamente.</p>
  `
  await enviar(
    datos.correo,
    `Recibimos tu solicitud — ${entorno.EMPRESA_NOMBRE}`,
    plantillaBase(cuerpo, 'Gracias por contactarnos')
  )
}

export const notificarNuevoTestimonio = async (datos: DatosTestimonioCorreo): Promise<void> => {
  const estrellas = '★'.repeat(datos.calificacion) + '☆'.repeat(5 - datos.calificacion)
  const cuerpo = `
    <p style="color:#475569;font-size:15px;margin:0 0 20px;">Un cliente envio un testimonio. Apruebalo desde el panel.</p>
    ${campo('Cliente', datos.nombreCliente + (datos.empresa ? ` — ${datos.empresa}` : ''))}
    ${campo('Calificacion', `${estrellas} (${datos.calificacion}/5)`)}
    ${campo('Testimonio', `<em>"${datos.contenido}"</em>`)}
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;">
      <p style="margin:0;color:#92400e;font-size:14px;"><strong>Accion requerida:</strong> Panel &rarr; Testimonios &rarr; Pendientes.</p>
    </div>
  `
  await enviar(
    entorno.EMPRESA_CORREO_SOPORTE,
    `Testimonio pendiente: ${datos.nombreCliente} (${datos.calificacion}/5)`,
    plantillaBase(cuerpo, 'Nuevo Testimonio Pendiente')
  )
}

export const enviarCotizacion = async (datos: DatosCotizacionCorreo): Promise<void> => {
  const extrasHtml = datos.extras.length > 0
    ? datos.extras.map(e => `
        <tr>
          <td style="padding:7px 0;border-bottom:1px solid #f1f5f9;">
            <span style="color:#22c55e;margin-right:8px;">&#10003;</span>
            <span style="color:#475569;font-size:14px;">${e}</span>
          </td>
        </tr>`).join('')
    : `<tr><td style="color:#94a3b8;font-size:14px;padding:7px 0;">Sin extras adicionales</td></tr>`

  const cuerpo = `
    <p style="color:#1e293b;font-size:16px;margin:0 0 12px;">Hola <strong>${datos.nombreCliente}</strong>,</p>
    <p style="color:#475569;font-size:15px;margin:0 0 24px;">Preparamos tu cotizacion personalizada:</p>
    ${campo('Servicio', datos.servicio)}
    <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Extras incluidos</p>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:4px 14px;margin-bottom:14px;">
      ${extrasHtml}
    </table>
    ${datos.notas ? campo('Notas', datos.notas) : ''}
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;margin:20px 0;">
      <tr>
        <td style="padding:24px;text-align:center;">
          <p style="color:#c7d2fe;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;">Inversion total</p>
          <p style="color:#fff;margin:0;font-size:34px;font-weight:800;">${formatearPeso(datos.precioTotal)}</p>
        </td>
      </tr>
    </table>
    <p style="color:#475569;font-size:14px;margin:0;">Para aceptar esta cotizacion o resolver dudas, responde este correo.</p>
  `
  await enviar(
    datos.correoCliente,
    `Cotizacion de ${entorno.EMPRESA_NOMBRE} — ${formatearPeso(datos.precioTotal)}`,
    plantillaBase(cuerpo, 'Tu Cotizacion')
  )
}

export const enviarBienvenida = async (datos: DatosBienvenidaCorreo): Promise<void> => {
  const cuerpo = `
    <p style="color:#1e293b;font-size:16px;margin:0 0 12px;">Hola <strong>${datos.nombre}</strong>,</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Tu cuenta en <strong>${entorno.EMPRESA_NOMBRE}</strong> fue creada exitosamente. Ya puedes iniciar sesion.
    </p>
    <div style="background:#eff6ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 18px;">
      <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.7;">
        <strong>Datos de acceso</strong><br>
        Correo: <strong>${datos.correo}</strong><br>
        Contrasena: la que registraste al crear tu cuenta
      </p>
    </div>
  `
  await enviar(
    datos.correo,
    `Bienvenido/a a ${entorno.EMPRESA_NOMBRE}`,
    plantillaBase(cuerpo, 'Bienvenido/a')
  )
}

export const enviarResetContrasena = async (datos: DatosResetCorreo): Promise<void> => {
  const cuerpo = `
    <p style="color:#1e293b;font-size:16px;margin:0 0 12px;">Hola <strong>${datos.nombre}</strong>,</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Recibimos una solicitud para restablecer la contrasena de tu cuenta.
      Si no fuiste tu, ignora este correo — tu contrasena no cambiara.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a
        href="${datos.urlReset}"
        style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;
               font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;
               box-shadow:0 4px 14px rgba(124,58,237,.4);"
      >
        Restablecer contrasena
      </a>
    </div>
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
        <strong>Este enlace expira en 1 hora.</strong><br>
        Si expiro, solicita uno nuevo desde la pagina de inicio de sesion.
      </p>
    </div>
    <p style="color:#94a3b8;font-size:13px;margin:0;">
      Si el boton no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="${datos.urlReset}" style="color:#7c3aed;word-break:break-all;">${datos.urlReset}</a>
    </p>
  `
  await enviar(
    datos.correo,
    `Restablecer contrasena — ${entorno.EMPRESA_NOMBRE}`,
    plantillaBase(cuerpo, 'Recuperar Contrasena')
  )
}