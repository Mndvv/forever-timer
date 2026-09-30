export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  vite: {
    optimizeDeps: {
      include: ['jszip']
    }
  },
  runtimeConfig: {
    public: {
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || ''
    }
  }
})