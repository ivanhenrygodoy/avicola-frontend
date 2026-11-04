<script setup>
import { RouterView } from 'vue-router'
import AlertToast from '@/components/common/AlertToast.vue'
</script>

<template>
  <div class="min-h-screen bg-crema text-verdoso antialiased">
    <RouterView />
    <AlertToast />
  </div>
</template>
