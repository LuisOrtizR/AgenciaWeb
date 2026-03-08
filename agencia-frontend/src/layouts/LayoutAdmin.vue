<template>
  <div class="layout-admin">
    <SidebarAdmin />
    <div class="admin-body">
      <TopbarAdmin />
      <main class="admin-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import SidebarAdmin from '@/components/layout/SidebarAdmin.vue'
import TopbarAdmin from '@/components/layout/TopbarAdmin.vue'
</script>

<style scoped>
.layout-admin {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.admin-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}
</style>