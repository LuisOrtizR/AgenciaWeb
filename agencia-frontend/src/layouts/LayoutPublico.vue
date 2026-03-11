<script setup lang="ts">
import NavbarPublico from '@/components/layout/NavbarPublico.vue'
import FooterPublico from '@/components/layout/FooterPublico.vue'
import ChatWidget    from '@/components/shared/ChatWidget.vue'
</script>

<template>
  <div class="flex flex-col min-h-dvh">
    <NavbarPublico />
    <main class="flex-1">
      <RouterView />
    </main>
    <FooterPublico />
    <ChatWidget />
  </div>
</template>