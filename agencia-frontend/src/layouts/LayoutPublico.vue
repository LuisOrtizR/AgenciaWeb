<template>
  <div class="layout-publico">
    <NavbarPublico />
    <main class="main-content">
      <RouterView />
    </main>
    <FooterPublico />
  </div>
</template>

<script setup lang="ts">
import NavbarPublico from '@/components/layout/NavbarPublico.vue'
import FooterPublico from '@/components/layout/FooterPublico.vue'
</script>

<style scoped>
.layout-publico {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
}
</style>