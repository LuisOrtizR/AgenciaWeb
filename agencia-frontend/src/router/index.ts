import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    titulo?:          string
    requireAuth?:     boolean
    requireAdmin?:    boolean
    soloCliente?:     boolean
    redirigirSiAuth?: boolean
  }
}

const rutas: RouteRecordRaw[] = [
  {
    path:      '/',
    component: () => import('@/layouts/LayoutPublico.vue'),
    children: [
      {
        path:      '',
        name:      'inicio',
        component: () => import('@/views/publico/HomeView.vue'),
        meta: { titulo: 'Nexova Studio — Desarrollo Web Profesional' },
      },
      {
        path:      'servicios',
        name:      'servicios',
        component: () => import('@/views/publico/ServiciosView.vue'),
        meta: { titulo: 'Servicios — Nexova Studio' },
      },
      {
        path:      'servicios/:slug',
        name:      'servicio-detalle',
        component: () => import('@/views/publico/ServicioDetalleView.vue'),
        meta: { titulo: 'Servicio — Nexova Studio' },
      },
      {
        path:      'proyectos',
        name:      'proyectos',
        component: () => import('@/views/publico/ProyectosView.vue'),
        meta: { titulo: 'Portafolio — Nexova Studio' },
      },
      {
        path:      'proyectos/:slug',
        name:      'proyecto-detalle',
        component: () => import('@/views/publico/ProyectoDetalleView.vue'),
        meta: { titulo: 'Proyecto — Nexova Studio' },
      },
      {
        path:      'contacto',
        name:      'contacto',
        component: () => import('@/views/publico/ContactoView.vue'),
        meta: { titulo: 'Contacto — Nexova Studio' },
      },
      {
        path:      'testimonios',
        name:      'testimonios',
        component: () => import('@/views/publico/TestimoniosView.vue'),
        meta: { titulo: 'Testimonios — Nexova Studio' },
      },
    ],
  },
  {
    path:      '/login',
    name:      'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { titulo: 'Iniciar sesion — Nexova Studio', redirigirSiAuth: true },
  },
  {
    path:      '/registro',
    name:      'registro',
    component: () => import('@/views/auth/RegistroView.vue'),
    meta: { titulo: 'Crear cuenta — Nexova Studio', redirigirSiAuth: true },
  },
  {
    path:      '/olvide-contrasena',
    name:      'olvide-contrasena',
    component: () => import('@/views/auth/Olvidecontrasenaview.vue'),
    meta: { titulo: 'Recuperar contrasena — Nexova Studio', redirigirSiAuth: true },
  },
  {
    path:      '/reset-contrasena',
    name:      'reset-contrasena',
    component: () => import('@/views/auth/Resetcontrasenaview.vue'),
    meta: { titulo: 'Nueva contrasena — Nexova Studio', redirigirSiAuth: true },
  },
  {
    path:      '/cliente',
    component: () => import('@/layouts/LayoutPublico.vue'),
    meta: { requireAuth: true, soloCliente: true },
    children: [
      {
        path:     '',
        redirect: { name: 'cliente-cotizaciones' },
      },
      {
        path:      'cotizaciones',
        name:      'cliente-cotizaciones',
        component: () => import('@/views/cliente/MisCotizacionesView.vue'),
        meta: { titulo: 'Mis Cotizaciones — Nexova Cliente' },
      },
      {
        path:      'perfil',
        name:      'cliente-perfil',
        component: () => import('@/views/cliente/PerfilClienteView.vue'),
        meta: { titulo: 'Mi Perfil — Nexova Cliente' },
      },
    ],
  },
  {
    path:      '/admin',
    component: () => import('@/layouts/LayoutAdmin.vue'),
    meta: { requireAuth: true, requireAdmin: true },
    children: [
      {
        path:     '',
        redirect: { name: 'admin-dashboard' },
      },
      {
        path:      'dashboard',
        name:      'admin-dashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { titulo: 'Dashboard — Nexova Admin' },
      },
      {
        path:      'prospectos',
        name:      'admin-prospectos',
        component: () => import('@/views/admin/ProspectosView.vue'),
        meta: { titulo: 'Prospectos — Nexova Admin' },
      },
      {
        path:      'prospectos/:id',
        name:      'admin-prospecto-detalle',
        component: () => import('@/views/admin/Prospectodetalleview.vue'),
        meta: { titulo: 'Prospecto — Nexova Admin' },
      },
      {
        path:      'cotizaciones',
        name:      'admin-cotizaciones',
        component: () => import('@/views/admin/CotizacionesView.vue'),
        meta: { titulo: 'Cotizaciones — Nexova Admin' },
      },
      {
        path:      'cotizaciones/:id',
        name:      'admin-cotizacion-detalle',
        component: () => import('@/views/admin/Cotizaciondetalleview.vue'),
        meta: { titulo: 'Cotizacion — Nexova Admin' },
      },
      {
        path:      'proyectos',
        name:      'admin-proyectos',
        component: () => import('@/views/admin/ProyectosAdminView.vue'),
        meta: { titulo: 'Proyectos — Nexova Admin' },
      },
      {
        path:      'servicios',
        name:      'admin-servicios',
        component: () => import('@/views/admin/ServiciosAdminView.vue'),
        meta: { titulo: 'Servicios — Nexova Admin' },
      },
      {
        path:      'testimonios',
        name:      'admin-testimonios',
        component: () => import('@/views/admin/Testimoniosadminview.vue'),
        meta: { titulo: 'Testimonios — Nexova Admin' },
      },
      {
        path:      'usuarios',
        name:      'admin-usuarios',
        component: () => import('@/views/admin/UsuariosView.vue'),
        meta: { titulo: 'Usuarios — Nexova Admin' },
      },
      {
        path:      'perfil',
        name:      'admin-perfil',
        component: () => import('@/views/admin/PerfilView.vue'),
        meta: { titulo: 'Mi Perfil — Nexova Admin' },
      },
    ],
  },
  {
    path:      '/:pathMatch(.*)*',
    name:      'no-encontrado',
    component: () => import('@/views/NoEncontradoView.vue'),
    meta: { titulo: 'Pagina no encontrada — Nexova Studio' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes:  rutas,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition)  return savedPosition
    if (to.hash)        return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to, _from) => {
  const auth = useAuthStore()

  const titulo = to.meta.titulo as string | undefined
  if (titulo) document.title = titulo

  if (to.meta.redirigirSiAuth && auth.estaAutenticado) {
    return auth.esAdmin
      ? { name: 'admin-dashboard' }
      : { name: 'cliente-cotizaciones' }
  }

  if (to.meta.requireAuth && !auth.estaAutenticado) {
    return { name: 'login', query: { redirigir: to.fullPath } }
  }

  if (to.meta.requireAdmin && !auth.esAdmin) {
    return auth.estaAutenticado
      ? { name: 'cliente-cotizaciones' }
      : { name: 'login' }
  }

  if (to.meta.soloCliente && auth.esAdmin) {
    return { name: 'admin-dashboard' }
  }
})

export default router