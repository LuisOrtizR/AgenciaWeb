/**
 * services/autenticacion.ts
 */
import api from './api'
import type { RespuestaApi, RespuestaAuth, UsuarioConConteo } from '@/types'

export const autenticacionServicio = {
  login: (datos: { correo: string; contrasena: string }) =>
    api.post<RespuestaApi<RespuestaAuth>>('/autenticacion/login', datos),

  registrar: (datos: { nombre: string; correo: string; contrasena: string }) =>
    api.post<RespuestaApi<RespuestaAuth>>('/autenticacion/registrar', datos),

  perfil: () =>
    api.get<RespuestaApi<UsuarioConConteo>>('/autenticacion/perfil'),

  refrescar: (tokenRefresco: string) =>
    api.post<RespuestaApi<{ tokenAcceso: string }>>('/autenticacion/refrescar', { tokenRefresco }),
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * services/usuarios.ts
 */
import type {
  RespuestaPaginada, UsuarioConConteo as UsuarioConteo,
  DatosActualizarPerfil, DatosCambiarContrasena,
  DatosCrearUsuario, DatosActualizarUsuario,
  FiltrosUsuario, ResumenUsuarios, Usuario,
} from '@/types'

export const usuariosServicio = {
  perfil: () =>
    api.get<RespuestaApi<UsuarioConteo>>('/usuarios/perfil'),

  actualizarPerfil: (datos: DatosActualizarPerfil) =>
    api.put<RespuestaApi<Usuario>>('/usuarios/perfil', datos),

  cambiarContrasena: (datos: DatosCambiarContrasena) =>
    api.patch('/usuarios/contrasena', datos),

  resumen: () =>
    api.get<RespuestaApi<ResumenUsuarios>>('/usuarios/resumen'),

  listar: (filtros: FiltrosUsuario = {}) =>
    api.get<RespuestaPaginada<UsuarioConteo>>('/usuarios', { params: filtros }),

  obtenerPorId: (id: string) =>
    api.get<RespuestaApi<UsuarioConteo>>(`/usuarios/${id}`),

  crear: (datos: DatosCrearUsuario) =>
    api.post<RespuestaApi<Usuario>>('/usuarios', datos),

  actualizar: (id: string, datos: DatosActualizarUsuario) =>
    api.put<RespuestaApi<Usuario>>(`/usuarios/${id}`, datos),

  activar: (id: string) =>
    api.patch<RespuestaApi<Usuario>>(`/usuarios/${id}/activar`),

  desactivar: (id: string) =>
    api.patch<RespuestaApi<Usuario>>(`/usuarios/${id}/desactivar`),

  cambiarRol: (id: string, rol: 'ADMIN' | 'CLIENTE') =>
    api.patch<RespuestaApi<Usuario>>(`/usuarios/${id}/rol`, { rol }),

  eliminar: (id: string) =>
    api.delete<RespuestaApi<Usuario>>(`/usuarios/${id}`),
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * services/servicios.ts
 */
import type {
  Servicio, DatosCrearServicio, DatosActualizarServicio, FiltrosServicio,
} from '@/types'

export const serviciosServicio = {
  // Públicas
  listar: (filtros: FiltrosServicio = {}) =>
    api.get<RespuestaPaginada<Servicio>>('/servicios', { params: filtros }),

  obtenerPorSlug: (slug: string) =>
    api.get<RespuestaApi<Servicio>>(`/servicios/slug/${slug}`),

  // Admin
  listarAdmin: (filtros: FiltrosServicio = {}) =>
    api.get<RespuestaPaginada<Servicio>>('/servicios/admin', { params: filtros }),

  obtenerPorId: (id: string) =>
    api.get<RespuestaApi<Servicio>>(`/servicios/${id}`),

  crear: (datos: DatosCrearServicio) =>
    api.post<RespuestaApi<Servicio>>('/servicios', datos),

  actualizar: (id: string, datos: DatosActualizarServicio) =>
    api.put<RespuestaApi<Servicio>>(`/servicios/${id}`, datos),

  activar: (id: string) =>
    api.patch<RespuestaApi<Servicio>>(`/servicios/${id}/activar`),

  desactivar: (id: string) =>
    api.patch<RespuestaApi<Servicio>>(`/servicios/${id}/desactivar`),

  eliminar: (id: string) =>
    api.delete<RespuestaApi<Servicio>>(`/servicios/${id}`),
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * services/prospectos.ts
 */
import type {
  Prospecto, DatosCrearProspecto, DatosActualizarProspecto,
  DatosActualizarEstadoProspecto, FiltrosProspecto, ResumenProspectos,
} from '@/types'

export const prospectosServicio = {
  // Pública — formulario de contacto
  crear: (datos: DatosCrearProspecto) =>
    api.post<RespuestaApi<Prospecto>>('/prospectos', datos),

  // Admin
  resumen: () =>
    api.get<RespuestaApi<ResumenProspectos>>('/prospectos/resumen'),

  listar: (filtros: FiltrosProspecto = {}) =>
    api.get<RespuestaPaginada<Prospecto>>('/prospectos', { params: filtros }),

  obtenerPorId: (id: string) =>
    api.get<RespuestaApi<Prospecto>>(`/prospectos/${id}`),

  actualizar: (id: string, datos: DatosActualizarProspecto) =>
    api.put<RespuestaApi<Prospecto>>(`/prospectos/${id}`, datos),

  actualizarEstado: (id: string, datos: DatosActualizarEstadoProspecto) =>
    api.patch<RespuestaApi<Prospecto>>(`/prospectos/${id}/estado`, datos),

  asignar: (id: string, usuarioId: string | null) =>
    api.patch<RespuestaApi<Prospecto>>(`/prospectos/${id}/asignar`, { usuarioId }),

  eliminar: (id: string) =>
    api.delete<RespuestaApi<Prospecto>>(`/prospectos/${id}`),
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * services/proyectos.ts
 */
import type {
  Proyecto, DatosCrearProyecto, DatosActualizarProyecto,
  FiltrosProyecto, TecnologiaConteo,
} from '@/types'

export const proyectosServicio = {
  // Públicas
  listar: (filtros: FiltrosProyecto = {}) =>
    api.get<RespuestaPaginada<Proyecto>>('/proyectos', { params: filtros }),

  listarDestacados: () =>
    api.get<RespuestaApi<Proyecto[]>>('/proyectos/destacados'),

  tecnologias: () =>
    api.get<RespuestaApi<TecnologiaConteo[]>>('/proyectos/tecnologias'),

  obtenerPorSlug: (slug: string) =>
    api.get<RespuestaApi<Proyecto>>(`/proyectos/slug/${slug}`),

  // Admin
  obtenerPorId: (id: string) =>
    api.get<RespuestaApi<Proyecto>>(`/proyectos/${id}`),

  crear: (datos: DatosCrearProyecto) =>
    api.post<RespuestaApi<Proyecto>>('/proyectos', datos),

  actualizar: (id: string, datos: DatosActualizarProyecto) =>
    api.put<RespuestaApi<Proyecto>>(`/proyectos/${id}`, datos),

  toggleDestacado: (id: string) =>
    api.patch<RespuestaApi<Proyecto>>(`/proyectos/${id}/destacado`),

  eliminar: (id: string) =>
    api.delete<RespuestaApi<Proyecto>>(`/proyectos/${id}`),

  // Imágenes
  subirImagen: (id: string, archivo: File) => {
    const formData = new FormData()
    formData.append('imagen', archivo)
    return api.post<RespuestaApi<Proyecto>>(
      `/imagenes/proyectos/${id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  eliminarImagen: (id: string) =>
    api.delete<RespuestaApi<{ id: string; titulo: string }>>(`/imagenes/proyectos/${id}`),
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * services/cotizaciones.ts
 */
import type {
  Cotizacion, DatosCrearCotizacion, DatosActualizarCotizacion,
  DatosActualizarEstadoCotizacion, FiltrosCotizacion, ResumenCotizaciones,
} from '@/types'

export const cotizacionesServicio = {
  resumen: () =>
    api.get<RespuestaApi<ResumenCotizaciones>>('/cotizaciones/resumen'),

  listar: (filtros: FiltrosCotizacion = {}) =>
    api.get<RespuestaPaginada<Cotizacion>>('/cotizaciones', { params: filtros }),

  porProspecto: (prospectoId: string) =>
    api.get<RespuestaApi<Cotizacion[]>>(`/cotizaciones/prospecto/${prospectoId}`),

  obtenerPorId: (id: string) =>
    api.get<RespuestaApi<Cotizacion>>(`/cotizaciones/${id}`),

  crear: (datos: DatosCrearCotizacion) =>
    api.post<RespuestaApi<Cotizacion>>('/cotizaciones', datos),

  actualizar: (id: string, datos: DatosActualizarCotizacion) =>
    api.put<RespuestaApi<Cotizacion>>(`/cotizaciones/${id}`, datos),

  actualizarEstado: (id: string, datos: DatosActualizarEstadoCotizacion) =>
    api.patch<RespuestaApi<Cotizacion>>(`/cotizaciones/${id}/estado`, datos),

  duplicar: (id: string) =>
    api.post<RespuestaApi<Cotizacion>>(`/cotizaciones/${id}/duplicar`),

  eliminar: (id: string) =>
    api.delete<RespuestaApi<Cotizacion>>(`/cotizaciones/${id}`),
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * services/testimonios.ts
 */
import type {
  Testimonio, DatosEnviarTestimonio, DatosCrearTestimonio,
  DatosActualizarTestimonio, DatosModeracion,
  FiltrosTestimonio, ResumenTestimonios,
} from '@/types'

export const testimoniosServicio = {
  // Públicas
  enviar: (datos: DatosEnviarTestimonio) =>
    api.post<RespuestaApi<Testimonio>>('/testimonios', datos),

  listarVisibles: (filtros: FiltrosTestimonio = {}) =>
    api.get<RespuestaPaginada<Testimonio>>('/testimonios', { params: filtros }),

  destacados: (limite = 6) =>
    api.get<RespuestaApi<Testimonio[]>>('/testimonios/destacados', { params: { limite } }),

  obtenerPorId: (id: string) =>
    api.get<RespuestaApi<Testimonio>>(`/testimonios/${id}`),

  // Admin
  resumen: () =>
    api.get<RespuestaApi<ResumenTestimonios>>('/testimonios/resumen'),

  listarAdmin: (filtros: FiltrosTestimonio = {}) =>
    api.get<RespuestaPaginada<Testimonio>>('/testimonios/admin', { params: filtros }),

  obtenerPorIdAdmin: (id: string) =>
    api.get<RespuestaApi<Testimonio>>(`/testimonios/admin/${id}`),

  crear: (datos: DatosCrearTestimonio) =>
    api.post<RespuestaApi<Testimonio>>('/testimonios/admin', datos),

  actualizar: (id: string, datos: DatosActualizarTestimonio) =>
    api.put<RespuestaApi<Testimonio>>(`/testimonios/${id}`, datos),

  moderar: (id: string, datos: DatosModeracion) =>
    api.patch<RespuestaApi<Testimonio>>(`/testimonios/${id}/moderar`, datos),

  eliminar: (id: string) =>
    api.delete<RespuestaApi<Testimonio>>(`/testimonios/${id}`),
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * services/ia.ts
 */
import type {
  DatosChatMensaje, RespuestaChat,
  RespuestaPropuesta, RespuestaAnalisis,
  DatosGenerarDescripcion, RespuestaDescripcion,
} from '@/types'

export const iaServicio = {
  // Pública — widget de chat del sitio web
  chat: (datos: DatosChatMensaje) =>
    api.post<RespuestaApi<RespuestaChat>>('/ia/chat', datos),

  // Admin
  generarPropuesta: (prospectoId: string) =>
    api.post<RespuestaApi<RespuestaPropuesta>>('/ia/propuesta', { prospectoId }),

  analizarProspecto: (prospectoId: string) =>
    api.post<RespuestaApi<RespuestaAnalisis>>('/ia/analizar-prospecto', { prospectoId }),

  generarDescripcion: (datos: DatosGenerarDescripcion) =>
    api.post<RespuestaApi<RespuestaDescripcion>>('/ia/descripcion-proyecto', datos),
}