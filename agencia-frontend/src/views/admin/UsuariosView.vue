<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { usuariosServicio } from '@/services/servicios'
import { usePaginacion } from '@/composables/usePaginacion'
import AppInsignia   from '@/components/ui/AppInsignia.vue'
import AppBoton      from '@/components/ui/AppBoton.vue'
import AppModal      from '@/components/ui/AppModal.vue'
import AppPaginacion from '@/components/ui/AppPaginacion.vue'
import type { UsuarioConConteo, RolUsuario } from '@/types'

const uiStore = useUiStore()
const pag     = usePaginacion(12)

const usuarios     = ref<UsuarioConConteo[]>([])
const cargando     = ref(true)
const usuarioSelec = ref<UsuarioConConteo | null>(null)
const modalRol     = ref(false)
const nuevoRol     = ref<RolUsuario>('CLIENTE')

const filtros = reactive({
  busqueda: '',
  activo:   '' as 'true' | 'false' | '',
  rol:      '' as RolUsuario | '',
})

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
    const { data } = await usuariosServicio.listar(params as any)
    usuarios.value = data.datos
    pag.actualizarPaginacion(data.paginacion)
  } catch {
    uiStore.error('Error', 'No se pudieron cargar los usuarios')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

watch(filtros, () => {
  pag.paginaActual.value = 1
  cargar()
}, { deep: true })

const cambiarPagina = (pagina: number) => {
  pag.irAPagina(pagina)
  cargar()
}

const toggleActivo = async (u: UsuarioConConteo) => {
  try {
    if (u.activo) await usuariosServicio.desactivar(u.id)
    else          await usuariosServicio.activar(u.id)
    uiStore.exito(u.activo ? 'Usuario desactivado' : 'Usuario activado')
    cargar()
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
  try {
    await usuariosServicio.cambiarRol(usuarioSelec.value.id, nuevoRol.value)
    uiStore.exito('Rol actualizado', `${usuarioSelec.value.nombre} ahora es ${nuevoRol.value}`)
    modalRol.value = false
    cargar()
  } catch {
    uiStore.error('Error', 'No se pudo cambiar el rol')
  }
}

const formatearFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f))

const iniciales = (nombre: string) =>
  nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">

    <div>
      <h1 class="text-2xl font-bold text-white">Usuarios</h1>
      <p class="text-gris-medio text-sm mt-1">Gestiona las cuentas y roles del sistema</p>
    </div>

    <div class="bg-[#13151f] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
      <div class="flex-1 relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gris-medio pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="filtros.busqueda" type="search" placeholder="Buscar por nombre o correo..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white placeholder-gris-medio text-sm outline-none transition-all" />
      </div>
      <select v-model="filtros.rol" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-blanco-suave text-sm outline-none">
        <option value="">Todos los roles</option>
        <option value="ADMIN">Administrador</option>
        <option value="CLIENTE">Cliente</option>
      </select>
      <select v-model="filtros.activo" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-blanco-suave text-sm outline-none">
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
        <p class="text-white font-medium">No hay usuarios</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="text-left px-6 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide">Usuario</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide hidden md:table-cell">Actividad</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide">Rol</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide">Estado</th>
              <th class="text-left px-4 py-3.5 text-xs font-semibold text-gris-medio uppercase tracking-wide hidden lg:table-cell">Registro</th>
              <th class="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="u in usuarios" :key="u.id" class="hover:bg-white/3 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-linear-to-br from-violeta/20 to-indigo-500/20 flex items-center justify-center text-sm font-bold text-violeta-claro shrink-0">
                    {{ iniciales(u.nombre) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ u.nombre }}</p>
                    <p class="text-xs text-gris-medio">{{ u.correo }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 hidden md:table-cell">
                <div class="flex items-center gap-3 text-xs text-gris-medio">
                  <span>{{ u._count?.prospectos ?? 0 }} prosp.</span>
                  <span>{{ u._count?.cotizaciones ?? 0 }} cotiz.</span>
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
                <span class="text-xs text-gris-medio">{{ formatearFecha(u.creadoEn) }}</span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-1 justify-end">
                  <button class="p-1.5 rounded-lg text-gris-medio hover:text-violeta-claro hover:bg-violeta/10 transition-all" title="Cambiar rol" @click="abrirModalRol(u)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button
                    class="p-1.5 rounded-lg text-gris-medio hover:text-amarillo hover:bg-amarillo/10 transition-all"
                    :title="u.activo ? 'Desactivar' : 'Activar'"
                    @click="toggleActivo(u)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
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

    <AppModal :abierto="modalRol" titulo="Cambiar rol de usuario" tamano="sm" @cerrar="modalRol = false">
      <div class="space-y-4">
        <div v-if="usuarioSelec" class="p-3 rounded-xl bg-white/5 border border-white/5">
          <p class="text-sm font-medium text-white">{{ usuarioSelec.nombre }}</p>
          <p class="text-xs text-gris-medio">{{ usuarioSelec.correo }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-blanco-suave">Nuevo rol</label>
          <select v-model="nuevoRol" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violeta/50 text-white text-sm outline-none">
            <option value="ADMIN">Administrador</option>
            <option value="CLIENTE">Cliente</option>
          </select>
        </div>
        <p class="text-xs text-gris-medio bg-amarillo/5 border border-amarillo/20 rounded-lg p-3">
          ⚠️ Cambiar a <strong class="text-amarillo">ADMIN</strong> otorga acceso total al panel de administración.
        </p>
      </div>
      <template #footer>
        <AppBoton variante="fantasma" @click="modalRol = false">Cancelar</AppBoton>
        <AppBoton variante="primario" @click="guardarRol">Guardar rol</AppBoton>
      </template>
    </AppModal>
  </div>
</template>