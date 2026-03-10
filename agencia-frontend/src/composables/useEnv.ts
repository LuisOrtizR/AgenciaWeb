/**
 * composables/useEnv.ts
 * Acceso centralizado a variables de entorno con fallbacks seguros.
 * Evita errores de "Cannot read properties of undefined" si Vite
 * no inyecta las variables (build antiguo, .env faltante, etc.)
 */
export function useEnv() {
  // ── App ────────────────────────────────────────────────────────────
  const nombreApp = String(import.meta.env.VITE_EMPRESA_NOMBRE ?? 'AIWeb CREATOR')
  const urlApi    = String(import.meta.env.VITE_URL_API        ?? 'http://localhost:3001/api')

  // ── Empresa ────────────────────────────────────────────────────────
  const empresaNombre  = nombreApp
  const empresaCorreo  = String(import.meta.env.VITE_EMPRESA_CORREO   ?? 'creatoraiweb@gmail.com')
  const empresaCelular = String(import.meta.env.VITE_EMPRESA_CELULAR  ?? '3232456846')
  const empresaPais    = String(import.meta.env.VITE_EMPRESA_PAIS     ?? 'Colombia')

  // ── Redes sociales ─────────────────────────────────────────────────
  const githubUrl    = String(import.meta.env.VITE_EMPRESA_GITHUB    ?? 'https://github.com/LuisOrtizR/AgenciaWeb')
  const linkedinUrl  = String(import.meta.env.VITE_EMPRESA_LINKEDIN  ?? 'https://linkedin.com/company/aiweb-creator')
  const instagramUrl = String(import.meta.env.VITE_EMPRESA_INSTAGRAM ?? 'https://instagram.com/aiweb.creator')

  // ── Derivados ──────────────────────────────────────────────────────
  /** Primera letra del nombre de la app → logo */
  const letraLogo = nombreApp.charAt(0).toUpperCase()

  /** 3232456846 → +57 323 245 6846 */
  const celularFormateado = `+57 ${empresaCelular.slice(0, 3)} ${empresaCelular.slice(3, 6)} ${empresaCelular.slice(6)}`

  /** Link directo a WhatsApp */
  const whatsappUrl = `https://wa.me/57${empresaCelular}`

  return {
    nombreApp,
    urlApi,
    letraLogo,
    empresaNombre,
    empresaCorreo,
    empresaCelular,
    empresaPais,
    celularFormateado,
    whatsappUrl,
    githubUrl,
    linkedinUrl,
    instagramUrl,
  }
}