<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { usuariosServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppModal      from '@/components/ui/AppModal.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import type { UsuarioConConteo, RolUsuario, ResumenUsuarios } from '@/types'

const uiStore = useUiStore()
const pag     = usePaginacion(12)

const usuarios     = ref<UsuarioConConteo[]>([])
const resumen      = ref<ResumenUsuarios | null>(null)
const cargando     = ref(true)
const guardando    = ref(false)

const usuarioSelec = ref<UsuarioConConteo | null>(null)
const modalRol     = ref(false)
const modalCrear   = ref(false)
const modalEditar  = ref(false)
const nuevoRol     = ref<RolUsuario>('CLIENTE')

const filtros = reactive({
  busqueda: '',
  activo:   '' as 'true' | 'false' | '',
  rol:      '' as RolUsuario | '',
})

const formCrear = reactive({
  nombre:     '',
  correo:     '',
  contrasena: '',
  rol:        'CLIENTE' as RolUsuario,
})

const formEditar = reactive({
  nombre: '',
  correo: '',
})

const tarjetasResumen = computed(() => resumen.value ? [
  {
    label: 'Total',
    valor: resumen.value.total,
    color: 'text-white',
    bg:    'bg-white/5',
    icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
  },
  {
    label: 'Administradores',
    valor: resumen.value.admins,
    color: 'text-violet-400',
    bg:    'bg-violet-500/10 border-violet-500/20',
    icono: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    label: 'Clientes',
    valor: resumen.value.clientes,
    color: 'text-blue-400',
    bg:    'bg-blue-500/10 border-blue-500/20',
    icono: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    label: 'Activos',
    valor: resumen.value.activos,
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/10 border-emerald-500/20',
    icono: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
] : [])

const cargar = async () => {
  cargando.value = true
  try {
    const params: Record<string, unknown> = {
      pagina:    pag.paginaActual.value,
      porPagina: pag.porPagina.value,
    }
    if (filtros.busqueda) params.busqueda = filtros.busqueda
    if (filtros.activo)   params.activo   = filtros.activo
    if (filtros.rol)      params.rol      = filtros.rol
    const [{ data }, { data: dataResumen }] = await Promise.all([
      usuariosServicio.listar(params as any),
      resumen.value ? Promise.resolve({ data: { datos: resumen.value } }) : usuariosServicio.resumen(),
    ])
    usuarios.value = data.datos
    resumen.value  = dataResumen.datos
    pag.actualizarPaginacion(data.paginacion)
  } catch {
    uiStore.error('Error', 'No se pudieron cargar los usuarios')
  } finally {
    cargando.value = false
  }
}

const recargarResumen = async () => {
  const { data } = await usuariosServicio.resumen()
  resumen.value = data.datos
}

onMounted(cargar)
watch(filtros, () => { pag.paginaActual.value = 1; cargar() }, { deep: true })

const cambiarPagina = (pagina: number) => { pag.irAPagina(pagina); cargar() }

const toggleActivo = async (u: UsuarioConConteo) => {
  try {
    if (u.activo) await usuariosServicio.desactivar(u.id)
    else          await usuariosServicio.activar(u.id)
    uiStore.exito(u.activo ? 'Usuario desactivado' : 'Usuario activado')
    cargar()
    recargarResumen()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el estado')
  }
}

const abrirModalRol = (u: UsuarioConConteo) => {
  usuarioSelec.value = u
  nuevoRol.value     = u.rol
  modalRol.value     = true
}

const guardarRol = async () => {
  if (!usuarioSelec.value) return
  guardando.value = true
  try {
    await usuariosServicio.cambiarRol(usuarioSelec.value.id, nuevoRol.value)
    uiStore.exito('Rol actualizado', `${usuarioSelec.value.nombre} ahora es ${nuevoRol.value}`)
    modalRol.value = false
    cargar()
    recargarResumen()
  } catch {
    uiStore.error('Error', 'No se pudo cambiar el rol')
  } finally {
    guardando.value = false
  }
}

const abrirModalEditar = (u: UsuarioConConteo) => {
  usuarioSelec.value = u
  formEditar.nombre  = u.nombre
  formEditar.correo  = u.correo
  modalEditar.value  = true
}

const guardarEdicion = async () => {
  if (!usuarioSelec.value) return
  guardando.value = true
  try {
    await usuariosServicio.actualizar(usuarioSelec.value.id, {
      nombre: formEditar.nombre,
      correo: formEditar.correo,
    })
    uiStore.exito('Usuario actualizado')
    modalEditar.value = false
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo actualizar el usuario')
  } finally {
    guardando.value = false
  }
}

const crearUsuario = async () => {
  guardando.value = true
  try {
    await usuariosServicio.crear(formCrear)
    uiStore.exito('Usuario creado', `${formCrear.nombre} fue añadido como ${formCrear.rol}`)
    modalCrear.value    = false
    formCrear.nombre    = ''
    formCrear.correo    = ''
    formCrear.contrasena = ''
    formCrear.rol       = 'CLIENTE'
    cargar()
    recargarResumen()
  } catch {
    uiStore.error('Error', 'No se pudo crear el usuario')
  } finally {
    guardando.value = false
  }
}

const eliminar = async (u: UsuarioConConteo) => {
  if (!confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`)) return
  try {
    await usuariosServicio.eliminar(u.id)
    uiStore.exito('Usuario eliminado')
    cargar()
    recargarResumen()
  } catch (err: unknown) {
    const mensaje = err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: { mensaje?: string } } }).response?.data?.mensaje
      : undefined
    uiStore.error('Error', mensaje ?? 'No se pudo eliminar')
  }
}

const formatearFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f))

const iniciales = (nombre: string) =>
  nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Usuarios</h1>
        <p class="text-slate-500 text-sm mt-1">Gestiona las cuentas y roles del sistema</p>
      </div>
      <AppBoton variante="primario" @click="modalCrear = true">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo usuario
      </AppBoton>
    </div>

    <div v-if="tarjetasResumen.length" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="t in tarjetasResumen"
        :key="t.label"
        class="bg-[#13151f] border rounded-2xl p-4"
        :class="t.bg"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t.label }}</span>
          <svg class="w-4 h-4" :class="t.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="t.icono" />
          </svg>
        </div>
        <p class="text-2xl font-black tabular-nums" :class="t.color">{{ t.valor }}</p>
      </div>
    </div>
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div v-for="i in 4" :key="i" class="h-20 bg-white/5 rounded-2xl animate-pulse" />
    </div>

    <div class="bg-[#13151f] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
      <div class="flex-1 relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="filtros.busqueda"
          type="search"
          placeholder="Buscar por nombre o correo..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
        />
      </div>
      <select v-model="filtros.rol" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none">
        <option value="">Todos los roles</option>
        <option value="ADMIN">Administrador</option>
        <option value="CLIENTE">Cliente</option>
      </select>
      <select v-model="filtros.activo" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none">
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </div>

    <div class="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden">
      <div v-if="cargando" class="p-8 space-y-3">
        <div v-for="i in 6" :key="i" class="h-14 bg-white/5 rounded-xl animate-pulse" />
      </div>

      <div v-else-if="!usuarios.length" class="py-20 text-center">
        <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
        </div>
        <p class="text-white font-medium">No hay usuarios</p>
        <p class="text-slate-500 text-sm mt-1">Prueba cambiando los filtros o crea uno nuevo</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Actividad</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Registro</th>
              <th class="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="u in usuarios" :key="u.id" class="hover:bg-white/3 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-linear-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
                    {{ iniciales(u.nombre) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ u.nombre }}</p>
                    <p class="text-xs text-slate-500">{{ u.correo }}</p>
                    <p v-if="u.empresa" class="text-xs text-slate-600 mt-0.5">{{ u.empresa }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 hidden md:table-cell">
                <div class="flex items-center gap-3 text-xs text-slate-500">
                  <span title="Prospectos">{{ u._count?.prospectos ?? 0 }} prosp.</span>
                  <span title="Cotizaciones">{{ u._count?.cotizaciones ?? 0 }} cotiz.</span>
                  <span v-if="u._count?.testimonios" title="Testimonios">{{ u._count.testimonios }} test.</span>
                </div>
              </td>
              <td class="px-4 py-4">
                <button @click="abrirModalRol(u)">
                  <AppInsignia :variante="u.rol === 'ADMIN' ? 'violeta' : 'neutro'" punto>
                    {{ u.rol === 'ADMIN' ? 'Admin' : 'Cliente' }}
                  </AppInsignia>
                </button>
              </td>
              <td class="px-4 py-4">
                <button @click="toggleActivo(u)">
                  <AppInsignia :variante="u.activo ? 'exito' : 'error'" punto>
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </AppInsignia>
                </button>
              </td>
              <td class="px-4 py-4 hidden lg:table-cell">
                <span class="text-xs text-slate-500">{{ formatearFecha(u.creadoEn) }}</span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="p-1.5 rounded-lg text-slate-500 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
                    title="Editar usuario"
                    @click="abrirModalEditar(u)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    class="p-1.5 rounded-lg text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                    title="Cambiar rol"
                    @click="abrirModalRol(u)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </button>
                  <button
                    class="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-all"
                    :title="u.activo ? 'Desactivar' : 'Activar'"
                    @click="toggleActivo(u)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                  <button
                    class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Eliminar usuario"
                    @click="eliminar(u)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pag.totalPaginas.value > 1" class="px-6 py-4 border-t border-white/5">
        <AppPaginacion
          :pagina-actual="pag.paginaActual.value"
          :total-paginas="pag.totalPaginas.value"
          :total-registros="pag.totalRegistros.value"
          :por-pagina="pag.porPagina.value"
          @cambiar="cambiarPagina"
        />
      </div>
    </div>

    <!-- Modal: Crear usuario -->
    <AppModal :abierto="modalCrear" titulo="Nuevo usuario" tamano="sm" @cerrar="modalCrear = false">
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</label>
          <input
            v-model="formCrear.nombre"
            type="text"
            placeholder="Nombre completo"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo</label>
          <input
            v-model="formCrear.correo"
            type="email"
            placeholder="correo@ejemplo.com"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Contraseña</label>
          <input
            v-model="formCrear.contrasena"
            type="password"
            placeholder="Mínimo 8 caracteres"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all"
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="rol in (['CLIENTE', 'ADMIN'] as RolUsuario[])"
              :key="rol"
              class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
              :class="formCrear.rol === rol
                ? rol === 'ADMIN'
                  ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                : 'bg-white/3 border-white/8 text-slate-400 hover:text-white hover:border-white/15'"
              @click="formCrear.rol = rol"
            >
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  :d="rol === 'ADMIN'
                    ? 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                    : 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'"
                />
              </svg>
              {{ rol === 'ADMIN' ? 'Administrador' : 'Cliente' }}
            </button>
          </div>
        </div>
        <p v-if="formCrear.rol === 'ADMIN'" class="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          ⚠️ Rol <strong>ADMIN</strong> otorga acceso total al panel de administración.
        </p>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalCrear = false">Cancelar</AppBoton>
        <AppBoton variante="primario" :cargando="guardando" @click="crearUsuario">Crear usuario</AppBoton>
      </template>
    </AppModal>

    <!-- Modal: Editar usuario -->
    <AppModal :abierto="modalEditar" titulo="Editar usuario" tamano="sm" @cerrar="modalEditar = false">
      <div class="space-y-4">
        <div v-if="usuarioSelec" class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <div class="w-9 h-9 rounded-full bg-linear-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
            {{ iniciales(usuarioSelec.nombre) }}
          </div>
          <div>
            <p class="text-sm font-medium text-white">{{ usuarioSelec.nombre }}</p>
            <p class="text-xs text-slate-500">{{ usuarioSelec.correo }}</p>
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</label>
          <input
            v-model="formEditar.nombre"
            type="text"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo</label>
          <input
            v-model="formEditar.correo"
            type="email"
            class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 text-white text-sm outline-none transition-all"
          />
        </div>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalEditar = false">Cancelar</AppBoton>
        <AppBoton variante="primario" :cargando="guardando" @click="guardarEdicion">Guardar cambios</AppBoton>
      </template>
    </AppModal>

    <!-- Modal: Cambiar rol -->
    <AppModal :abierto="modalRol" titulo="Cambiar rol de usuario" tamano="sm" @cerrar="modalRol = false">
      <div class="space-y-4">
        <div v-if="usuarioSelec" class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <div class="w-9 h-9 rounded-full bg-linear-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
            {{ iniciales(usuarioSelec.nombre) }}
          </div>
          <div>
            <p class="text-sm font-medium text-white">{{ usuarioSelec.nombre }}</p>
            <p class="text-xs text-slate-500">{{ usuarioSelec.correo }}</p>
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nuevo rol</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="rol in (['CLIENTE', 'ADMIN'] as RolUsuario[])"
              :key="rol"
              class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
              :class="nuevoRol === rol
                ? rol === 'ADMIN'
                  ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                : 'bg-white/3 border-white/8 text-slate-400 hover:text-white hover:border-white/15'"
              @click="nuevoRol = rol"
            >
              {{ rol === 'ADMIN' ? 'Administrador' : 'Cliente' }}
            </button>
          </div>
        </div>
        <p v-if="nuevoRol === 'ADMIN'" class="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          ⚠️ Cambiar a <strong>ADMIN</strong> otorga acceso total al panel de administración.
        </p>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalRol = false">Cancelar</AppBoton>
        <AppBoton variante="primario" :cargando="guardando" @click="guardarRol">Guardar rol</AppBoton>
      </template>
    </AppModal>

  </div>
</template>