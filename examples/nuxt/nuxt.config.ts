export default defineNuxtConfig({
  compatibilityDate: '2026-08-05',

  modules: ['@jamit/audio-recorder-nuxt'],

  css: ['~/assets/css/main.css'],

  devtools: {
    enabled: true,
  },
});