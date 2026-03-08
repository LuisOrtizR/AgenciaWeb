/**
 * router/index.ts — Enrutador con guards de autenticación y roles
 *
 * Rutas públicas:   /, /servicios, /proyectos, /contacto, /login
 * Rutas protegidas: /admin/* (requiere token + rol ADMIN)
 *
 * Guards:
 * - requireAuth: redirige a /login si no hay sesión activa
 * - requireAdmin: redirige a / si el rol no es ADMIN
 * - redirectIfAuth: redirige a /admin si ya está autenticado (ej. en /login)
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ─── Definición de rutas ──────────────────────────────────────────────────────

const rutas: RouteRecordRaw[] = [

  // ── Sitio público ────────────────────────────────────────────────────────────
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
    ],
  },

  // ── Autenticación ────────────────────────────────────────────────────────────
  {
    path:      '/login',
    name:      'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: {
      titulo:          'Iniciar sesión — Nexova Studio',
      redirigirSiAuth: true,
    },
  },
  {
    path:      '/registro',
    name:      'registro',
    component: () => import('@/views/auth/RegistroView.vue'),
    meta: {
      titulo:          'Crear cuenta — Nexova Studio',
      redirigirSiAuth: true,
    },
  },

  // ── Panel de cliente ─────────────────────────────────────────────────────────
  {
    path:      '/cliente',
    component: () => import('@/layouts/LayoutPublico.vue'), // Or a specific cliente layout if exists
    meta: {
      requireAuth: true,
    },
    children: [
      {
        path:      '',
        redirect:  { name: 'cliente-perfil' },
      },
      {
        path:      'perfil',
        name:      'cliente-perfil',
        component: () => import('@/views/cliente/PerfilClienteView.vue'),
        meta: { titulo: 'Mi Perfil — Nexova Cliente' },
      },
    ],
  },

  // ── Panel de administración ──────────────────────────────────────────────────
  {
    path:      '/admin',
    component: () => import('@/layouts/LayoutAdmin.vue'),
    meta: {
      requireAuth:  true,
      requireAdmin: true,
    },
    children: [
      {
        path:      '',
        redirect:  { name: 'admin-dashboard' },
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
        meta: { titulo: 'Cotización — Nexova Admin' },
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
        component: () => import('@/views/admin/TestimoniosView.vue'),
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

  // ── 404 ──────────────────────────────────────────────────────────────────────
  {
    path:      '/:pathMatch(.*)*',
    name:      'no-encontrado',
    component: () => import('@/views/NoEncontradoView.vue'),
    meta: { titulo: 'Página no encontrada — Nexova Studio' },
  },
]

// ─── Crear router ─────────────────────────────────────────────────────────────

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes:  rutas,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash)        return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

// ─── Guard global ─────────────────────────────────────────────────────────────

router.beforeEach((to, _from) => {
  const authStore = useAuthStore()

  // Actualizar título de la pestaña
  const titulo = to.meta.titulo as string | undefined
  if (titulo) document.title = titulo

  // Redirigir a /admin si ya está autenticado e intenta ir al login
  if (to.meta.redirigirSiAuth && authStore.estaAutenticado) {
    return { name: 'admin-dashboard' }
  }

  // Ruta requiere autenticación
  if (to.meta.requireAuth && !authStore.estaAutenticado) {
    return {
      name:  'login',
      query: { redirigir: to.fullPath }, // Para redirigir después del login
    }
  }

  // Ruta requiere rol ADMIN
  if (to.meta.requireAdmin && !authStore.esAdmin) {
    // Si está autenticado pero no es admin → ir al inicio
    if (authStore.estaAutenticado) {
      return { name: 'inicio' }
    }
    return { name: 'login' }
  }
})

// ─── Meta tipado de rutas ─────────────────────────────────────────────────────

declare module 'vue-router' {
  interface RouteMeta {
    titulo?:          string
    requireAuth?:     boolean
    requireAdmin?:    boolean
    redirigirSiAuth?: boolean
  }
}

export default router