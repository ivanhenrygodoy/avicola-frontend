<script setup>
import { RouterView } from 'vue-router'
import AlertToast from '@/components/common/AlertToast.vue'
import AsistenteChatWidget from '@/components/asistente/AsistenteChatWidget.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-crema text-verdoso antialiased">
    <RouterView />
    <AlertToast />
    <!-- El chat solo existe con el módulo `asistente` (R20): sin él sus rutas responden 403 -->
    <AsistenteChatWidget v-if="authStore.isAuthenticated && authStore.puede('asistente')" />
  </div>
</template>
