<script setup lang="ts">
import SidebarAdmin from '@/components/layout/SidebarAdmin.vue'
import TopbarAdmin  from '@/components/layout/TopbarAdmin.vue'
import SistemaToast from '@/components/ui/SistemaToast.vue'
</script>

<template>
  <div class="flex h-dvh bg-(--background) overflow-hidden">
    <SidebarAdmin />
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <TopbarAdmin />
      <main class="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-8">
        <RouterView />
      </main>
    </div>
    <SistemaToast />
  </div>
</template>