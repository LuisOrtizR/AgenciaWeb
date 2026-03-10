<template>
  <div class="layout-publico">
    <NavbarPublico />
    <main class="main-content">
      <RouterView />
    </main>
    <FooterPublico />
    <ChatWidget />
  </div>
</template>

<script setup lang="ts">
import NavbarPublico from '@/components/layout/NavbarPublico.vue'
import FooterPublico from '@/components/layout/FooterPublico.vue'
import ChatWidget from '@/components/shared/ChatWidget.vue'
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