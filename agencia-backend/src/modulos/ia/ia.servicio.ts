import Groq   from 'groq-sdk'
import prisma  from '../../config/baseDatos.js'
import entorno from '../../config/entorno.js'
import logger  from '../../utilidades/logger.js'
import type { DatosChatMensaje, DatosGenerarDescripcion } from './ia.tipos.js'

/**
 * Módulo de IA — Groq (Llama 3.3 70B)
 *
 * 1. chatAgencia          → asistente 24/7 del sitio web  (público)
 * 2. generarPropuesta     → propuesta comercial en markdown (admin)
 * 3. analizarProspecto    → lead scoring con JSON          (admin)
 * 4. generarDescripcion   → copywriting SEO de proyectos   (admin)
 */

const groq  = new Groq({ apiKey: entorno.GROQ_CLAVE })
const MODELO = 'llama-3.3-70b-versatile'

const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const parsearJSON = (texto: string) => {
  try {
    return JSON.parse(texto.replace(/```json|```/g, '').trim())
  } catch {
    return { error: 'No se pudo parsear la respuesta', raw: texto }
  }
}

// ─── 1. Chat del sitio web ────────────────────────────────────────────────────
export const chatAgencia = async (datos: DatosChatMensaje) => {
  const servicios = await prisma.servicio.findMany({
    where:  { activo: true },
    select: { nombre: true, descripcion: true, precioDesde: true, precioHasta: true, semanasEntrega: true },
  })

  const catalogo = servicios.length
    ? servicios.map(s =>
        `• ${s.nombre}: ${s.descripcion}\n  Precio: ${cop(s.precioDesde)} – ${cop(s.precioHasta)} | Entrega: ${s.semanasEntrega} semana(s)`
      ).join('\n')
    : 'Catálogo próximamente disponible.'

  const sistema = `Eres el asistente virtual de ${entorno.EMPRESA_NOMBRE}, agencia de desarrollo web en Colombia.

Tu misión: ayudar a los visitantes a entender los servicios, resolver dudas y motivarlos a contactarnos.

CATÁLOGO ACTUAL:
${catalogo}

REGLAS:
- Responde siempre en español, tono cálido y profesional
- Máximo 3 párrafos cortos por respuesta
- Si preguntan por precios de proyectos personalizados, invítalos al formulario de contacto
- No inventes precios ni plazos fuera del catálogo
- Correo de contacto: ${entorno.EMPRESA_CORREO_SOPORTE}
- Al final, si es relevante, sugiere sutilmente llenar el formulario`

  const historial = datos.historial.map(h => ({
    role:    h.rol as 'user' | 'assistant',
    content: h.contenido,
  }))

  const res = await groq.chat.completions.create({
    model:       MODELO,
    max_tokens:  600,
    temperature: 0.7,
    messages: [
      { role: 'system', content: sistema },
      ...historial,
      { role: 'user',   content: datos.mensaje },
    ],
  })

  const respuesta = res.choices[0]?.message?.content ?? 'Lo siento, intenta de nuevo.'
  logger.info(`[IA:chat] tokens=${res.usage?.total_tokens ?? 0}`)
  return { respuesta, tokens: res.usage?.total_tokens ?? 0 }
}

// ─── 2. Propuesta comercial ───────────────────────────────────────────────────
export const generarPropuesta = async (prospectoId: string) => {
  const prospecto = await prisma.prospecto.findUnique({
    where:   { id: prospectoId },
    include: {
      cotizaciones: {
        include: { servicio: { select: { nombre: true } } },
        orderBy: { creadoEn: 'desc' },
        take:    1,
      },
    },
  })
  if (!prospecto) throw new Error('Prospecto no encontrado')

  const servicio = prospecto.cotizaciones[0]?.servicio?.nombre

  const prompt = `Eres consultor senior de ${entorno.EMPRESA_NOMBRE}, agencia de desarrollo web colombiana.

Genera una propuesta comercial persuasiva en español para:

CLIENTE:
- Nombre: ${prospecto.nombre}
- Servicio: ${prospecto.tipoServicio}${servicio ? ` — ${servicio}` : ''}
- Necesidad: "${prospecto.mensaje ?? 'No especificó'}"
- Presupuesto: ${prospecto.presupuesto ? cop(prospecto.presupuesto) : 'No indicó'}
- Fuente: ${prospecto.fuente ?? 'Desconocida'}

ESTRUCTURA (usa markdown):
1. **Saludo personalizado** con su nombre
2. **Entendemos tu negocio** — demuestra que captaste su necesidad
3. **Nuestra propuesta** — qué construiríamos específicamente
4. **Beneficios concretos** — 3-4 puntos con enfoque en ROI
5. **Metodología** — proceso en 4 pasos simples
6. **Inversión** — menciona que se enviará cotización detallada
7. **Próximos pasos** — llamada a la acción clara

Tono profesional pero cercano. 400-500 palabras.`

  const res = await groq.chat.completions.create({
    model: MODELO, max_tokens: 1000, temperature: 0.75,
    messages: [{ role: 'user', content: prompt }],
  })

  const propuesta = res.choices[0]?.message?.content ?? ''
  logger.info(`[IA:propuesta] prospecto=${prospecto.nombre} tokens=${res.usage?.total_tokens ?? 0}`)
  return {
    propuesta,
    prospecto: { id: prospecto.id, nombre: prospecto.nombre, correo: prospecto.correo },
    tokens: res.usage?.total_tokens ?? 0,
  }
}

// ─── 3. Lead scoring — análisis de prospecto ─────────────────────────────────
export const analizarProspecto = async (prospectoId: string) => {
  const prospecto = await prisma.prospecto.findUnique({
    where:   { id: prospectoId },
    include: { cotizaciones: { select: { estado: true, precioTotal: true } } },
  })
  if (!prospecto) throw new Error('Prospecto no encontrado')

  const diasDesdeContacto = Math.floor(
    (Date.now() - new Date(prospecto.creadoEn).getTime()) / 86_400_000
  )

  const prompt = `Eres especialista en ventas de agencias de desarrollo web colombianas.
Analiza este lead y responde SOLO con JSON válido (sin markdown):

{
  "puntaje": <1-100>,
  "nivel": "<FRIO|TIBIO|CALIENTE>",
  "resumen": "<2 oraciones sobre el potencial del lead>",
  "fortalezas": ["<f1>", "<f2>"],
  "riesgos": ["<r1>", "<r2>"],
  "accionesRecomendadas": ["<a1>", "<a2>", "<a3>"],
  "tiempoSugeridoRespuesta": "<inmediato|24h|48h|esta semana>"
}

DATOS DEL LEAD:
- Nombre: ${prospecto.nombre}
- Servicio: ${prospecto.tipoServicio}
- Presupuesto: ${prospecto.presupuesto ? cop(prospecto.presupuesto) : 'No indicó'}
- Mensaje: "${prospecto.mensaje ?? 'Sin mensaje'}"
- Fuente: ${prospecto.fuente ?? 'Desconocida'}
- Estado: ${prospecto.estado}
- Cotizaciones generadas: ${prospecto.cotizaciones.length}
- Días desde contacto: ${diasDesdeContacto}`

  const res = await groq.chat.completions.create({
    model: MODELO, max_tokens: 600, temperature: 0.3,
    messages: [{ role: 'user', content: prompt }],
  })

  const analisis = parsearJSON(res.choices[0]?.message?.content ?? '{}')
  logger.info(`[IA:scoring] ${prospecto.nombre} → puntaje=${analisis.puntaje ?? '?'} nivel=${analisis.nivel ?? '?'}`)
  return {
    analisis,
    prospecto: { id: prospecto.id, nombre: prospecto.nombre, tipoServicio: prospecto.tipoServicio },
    tokens: res.usage?.total_tokens ?? 0,
  }
}

// ─── 4. Descripción SEO de proyecto ──────────────────────────────────────────
export const generarDescripcion = async (datos: DatosGenerarDescripcion) => {
  const prompt = `Eres copywriter SEO especializado en agencias de desarrollo web latinoamericanas.
Responde SOLO con JSON válido (sin markdown):

{
  "corta": "<80-100 palabras para tarjeta de portafolio>",
  "larga": "<200-250 palabras para página detalle: problema, solución técnica, resultados>",
  "metaDescription": "<máx 155 caracteres para meta SEO>",
  "etiquetas": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"]
}

PROYECTO:
- Título: ${datos.titulo}
- Tipo: ${datos.tipoServicio}
- Stack: ${datos.stackTecnico.join(', ')}
${datos.urlEnVivo ? `- URL: ${datos.urlEnVivo}` : ''}`

  const res = await groq.chat.completions.create({
    model: MODELO, max_tokens: 700, temperature: 0.8,
    messages: [{ role: 'user', content: prompt }],
  })

  const descripciones = parsearJSON(res.choices[0]?.message?.content ?? '{}')
  logger.info(`[IA:descripcion] "${datos.titulo}" tokens=${res.usage?.total_tokens ?? 0}`)
  return { descripciones, tokens: res.usage?.total_tokens ?? 0 }
}