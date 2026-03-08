// ─── Enums ────────────────────────────────────────────────────────────────────

export type RolUsuario       = 'ADMIN' | 'CLIENTE'
export type EstadoProspecto  = 'NUEVO' | 'CONTACTADO' | 'CONVERTIDO' | 'PERDIDO'
export type TipoServicio     = 'LANDING' | 'CORPORATIVO' | 'ECOMMERCE' | 'SAAS' | 'MANTENIMIENTO'
export type EstadoCotizacion = 'PENDIENTE' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA'

// ─── API genérica ─────────────────────────────────────────────────────────────

export interface RespuestaApi<T> {
  exito:   boolean
  mensaje: string
  datos:   T
}

export interface Paginacion {
  total:        number
  pagina:       number
  porPagina:    number
  totalPaginas: number
}

export interface RespuestaPaginada<T> {
  exito:     boolean
  mensaje:   string
  datos:     T[]
  paginacion: Paginacion
}

// ─── Usuario ──────────────────────────────────────────────────────────────────

export interface Usuario {
  id:        string
  nombre:    string
  correo:    string
  rol:       RolUsuario
  activo:    boolean
  avatarUrl: string | null
  creadoEn:  string
  actualizadoEn: string
}

export interface UsuarioConConteo extends Usuario {
  _count?: {
    prospectos:  number
    cotizaciones: number
  }
}

export interface ResumenUsuarios {
  total:    number
  admins:   number
  clientes: number
  activos:  number
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface DatosLogin {
  correo:    string
  contrasena: string
}

export interface DatosRegistro {
  nombre:    string
  correo:    string
  contrasena: string
}

export interface RespuestaAuth {
  tokenAcceso:   string
  tokenRefresco: string
  usuario:       Usuario
}

export interface DatosActualizarPerfil {
  nombre?:    string
  avatarUrl?: string | null
}

export interface DatosCambiarContrasena {
  contrasenaActual: string
  nuevaContrasena:  string
}

// ─── Tipos de usuario CRUD (admin) ────────────────────────────────────────────

export interface DatosCrearUsuario {
  nombre:    string
  correo:    string
  contrasena: string
  rol?:      RolUsuario
}

export interface DatosActualizarUsuario {
  nombre?:    string
  correo?:    string
  rol?:       RolUsuario
  activo?:    boolean
  avatarUrl?: string | null
}

export interface FiltrosUsuario {
  pagina?:   number
  porPagina?: number
  busqueda?: string
  rol?:      RolUsuario
  activo?:   boolean
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export interface Servicio {
  id:              string
  nombre:          string
  slug:            string
  descripcion:     string
  tipo?:           TipoServicio
  precioDesde:     number
  precioHasta:     number | null
  semanasEntrega:  number
  caracteristicas: string[]
  activo?:         boolean
  creadoEn:        string
  actualizadoEn?:  string
}

export interface DatosCrearServicio {
  nombre:           string
  slug:             string
  descripcion:      string
  tipo?:            TipoServicio
  precioDesde:      number
  precioHasta?:     number | null
  semanasEntrega:   number
  caracteristicas?: string[]
  activo?:          boolean
}

export interface DatosActualizarServicio {
  nombre?:          string
  slug?:            string
  descripcion?:     string
  tipo?:            TipoServicio
  precioDesde?:     number
  precioHasta?:     number | null
  semanasEntrega?:  number
  caracteristicas?: string[]
  activo?:          boolean
}

export interface FiltrosServicio {
  pagina?:    number
  porPagina?: number
  busqueda?:  string
  tipo?:      TipoServicio
  activo?:    boolean
}

// ─── Prospecto ────────────────────────────────────────────────────────────────

export interface Prospecto {
  id:           string
  nombre:       string
  correo:       string
  telefono:     string | null
  mensaje:      string | null
  tipoServicio: TipoServicio
  presupuesto:  number | null
  estado:       EstadoProspecto
  notas:        string | null
  fuente:       string | null
  usuarioId:    string | null
  usuario?:     Usuario | null
  cotizaciones?: Cotizacion[]
  creadoEn:     string
  actualizadoEn: string
}

export interface DatosCrearProspecto {
  nombre:       string
  correo:       string
  telefono?:    string | null
  mensaje?:     string | null
  tipoServicio: TipoServicio
  presupuesto?: number | null
  fuente?:      string | null
  // honeypot
  website?:     string
}

export interface DatosActualizarProspecto {
  nombre?:       string
  correo?:       string
  telefono?:     string | null
  mensaje?:      string | null
  tipoServicio?: TipoServicio
  presupuesto?:  number | null
  notas?:        string | null
  fuente?:       string | null
}

export interface DatosActualizarEstadoProspecto {
  estado: EstadoProspecto
  notas?: string | null
}

export interface FiltrosProspecto {
  pagina?:    number
  porPagina?: number
  busqueda?:  string
  estado?:    EstadoProspecto
  tipo?:      TipoServicio
}

export interface ResumenProspectos {
  total:      number
  nuevos:     number
  contactados: number
  convertidos: number
  perdidos:   number
}

// ─── Proyecto ─────────────────────────────────────────────────────────────────

export interface Proyecto {
  id:           string
  titulo:       string
  slug:         string
  descripcion:  string
  stackTecnico: string[]
  imagenUrl:    string | null
  urlEnVivo:    string | null
  urlGithub:    string | null
  destacado:    boolean
  servicio?:    Servicio | null
  servicioId:   string | null
  testimonios?: Testimonio[]
  creadoEn:     string
  actualizadoEn?: string
}

export interface DatosCrearProyecto {
  titulo:       string
  slug:         string
  descripcion:  string
  // ✅ Requerido con valor por defecto [] — nunca undefined
  stackTecnico: string[]
  imagenUrl?:   string | null
  urlEnVivo?:   string | null
  urlGithub?:   string | null
  destacado?:   boolean
  servicioId?:  string | null
}

export interface DatosActualizarProyecto {
  titulo?:       string
  slug?:         string
  descripcion?:  string
  stackTecnico?: string[]
  imagenUrl?:    string | null
  urlEnVivo?:    string | null
  urlGithub?:    string | null
  destacado?:    boolean
  servicioId?:   string | null
}

export interface FiltrosProyecto {
  pagina?:     number
  porPagina?:  number
  busqueda?:   string
  tecnologia?: string
  destacado?:  boolean
  servicioId?: string
}

export interface TecnologiaConteo {
  tecnologia: string
  cantidad:   number
}

// ─── Cotización ───────────────────────────────────────────────────────────────

export interface Cotizacion {
  id:          string
  precioTotal: number
  estado:      EstadoCotizacion
  extras:      string[]
  notas:       string | null
  prospecto:   Prospecto
  prospectoId: string
  servicio:    Servicio
  servicioId:  string
  usuario?:    Usuario | null
  usuarioId:   string | null
  creadoEn:    string
  actualizadoEn: string
}

export interface DatosCrearCotizacion {
  prospectoId: string
  servicioId:  string
  precioTotal: number
  extras?:     string[]
  notas?:      string | null
}

export interface DatosActualizarCotizacion {
  servicioId?:  string
  precioTotal?: number
  extras?:      string[]
  notas?:       string | null
}

export interface DatosActualizarEstadoCotizacion {
  estado: EstadoCotizacion
  notas?: string | null
}

export interface FiltrosCotizacion {
  pagina?:    number
  porPagina?: number
  busqueda?:  string
  estado?:    EstadoCotizacion
  servicioId?: string
}

export interface ResumenCotizaciones {
  total:     number
  pendientes: number
  enviadas:  number
  aceptadas: number
  rechazadas: number
  ingresosTotales: number
}

// ─── Testimonio ───────────────────────────────────────────────────────────────

export interface Testimonio {
  id:         string
  nombre:     string
  empresa:    string | null
  cargo:      string | null
  texto:      string
  calificacion: number
  visible:    boolean
  proyectoId: string | null
  proyecto?:  Proyecto | null
  creadoEn:   string
  actualizadoEn: string
}

export interface DatosEnviarTestimonio {
  nombre:       string
  empresa?:     string | null
  cargo?:       string | null
  texto:        string
  calificacion: number
  proyectoId?:  string | null
}

export interface DatosCrearTestimonio extends DatosEnviarTestimonio {
  visible?: boolean
}

export interface DatosActualizarTestimonio {
  nombre?:       string
  empresa?:      string | null
  cargo?:        string | null
  texto?:        string
  calificacion?: number
  proyectoId?:   string | null
}

export interface DatosModeracion {
  visible: boolean
}

export interface FiltrosTestimonio {
  pagina?:    number
  porPagina?: number
  busqueda?:  string
  visible?:   boolean
}

export interface ResumenTestimonios {
  total:    number
  visibles: number
  ocultos:  number
  calificacionPromedio: number
}

// ─── IA ───────────────────────────────────────────────────────────────────────

export interface MensajeChat {
  rol:      'user' | 'assistant'
  contenido: string
}

export interface DatosChatMensaje {
  mensaje:   string
  historial?: MensajeChat[]
}

export interface RespuestaChat {
  respuesta: string
}

export interface RespuestaPropuesta {
  propuesta: string
}

export interface RespuestaAnalisis {
  analisis: {
    puntaje:              number
    nivel:                string
    resumen:              string
    fortalezas:           string[]
    riesgos:              string[]
    accionesRecomendadas: string[]
    tiempoSugeridoRespuesta: string
  }
}

export interface DatosGenerarDescripcion {
  titulo:       string
  stackTecnico: string[]
  tipoServicio: string
  urlEnVivo?:   string
}

export interface RespuestaDescripcion {
  descripciones: {
    corta:           string
    larga:           string
    metaDescription: string
    etiquetas:       string[]
  }
  tokens: number
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type VarianteNotificacion = 'exito' | 'error' | 'advertencia' | 'info'

export interface Notificacion {
  id:       string
  tipo:     VarianteNotificacion
  titulo:   string
  mensaje?: string
  duracion?: number
}

export interface OpcionesPaginacion {
  pagina:     number
  porPagina:  number
  total:      number
  totalPaginas: number
}