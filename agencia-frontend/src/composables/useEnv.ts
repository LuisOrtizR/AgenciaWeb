const env = import.meta.env

const empresaCelular = String(env.VITE_EMPRESA_CELULAR ?? '3232456846')
const nombreApp      = String(env.VITE_EMPRESA_NOMBRE  ?? 'AIWeb CREATOR')

export function useEnv() {
  return {
    nombreApp,
    urlApi:            String(env.VITE_URL_API             ?? 'http://localhost:3001/api'),
    letraLogo:         nombreApp.charAt(0).toUpperCase(),
    empresaNombre:     nombreApp,
    empresaCorreo:     String(env.VITE_EMPRESA_CORREO      ?? 'creatoraiweb@gmail.com'),
    empresaCelular,
    empresaPais:       String(env.VITE_EMPRESA_PAIS        ?? 'Colombia'),
    celularFormateado: `+57 ${empresaCelular.slice(0,3)} ${empresaCelular.slice(3,6)} ${empresaCelular.slice(6)}`,
    whatsappUrl:       `https://wa.me/57${empresaCelular}`,
    githubUrl:         String(env.VITE_EMPRESA_GITHUB    ?? ''),
    linkedinUrl:       String(env.VITE_EMPRESA_LINKEDIN  ?? ''),
    instagramUrl:      String(env.VITE_EMPRESA_INSTAGRAM ?? ''),
  }
}