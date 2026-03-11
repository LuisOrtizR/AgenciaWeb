import { fileURLToPath, URL } from 'node:url'
import { defineConfig }       from 'vite'
import vue                    from '@vitejs/plugin-vue'
import vueDevTools            from 'vite-plugin-vue-devtools'
import tailwindcss            from '@tailwindcss/vite'
import AutoImport             from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts:     'src/auto-imports.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5175,
  },
})