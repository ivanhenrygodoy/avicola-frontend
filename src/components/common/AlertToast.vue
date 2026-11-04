<script setup>
import { useNotificationStore } from '@/stores/notification'
import BaseAlert from './BaseAlert.vue'

const notification = useNotificationStore()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-x-8 opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-8 opacity-0"
    >
      <div
        v-if="notification.isOpen"
        class="fixed top-5 right-5 z-[11000] w-[90%] sm:w-auto max-w-md drop-shadow-xl"
      >
        <BaseAlert
          :type="notification.type"
          :message="notification.message"
          :dismissible="true"
          @close="notification.close"
        />
      </div>
    </Transition>
  </Teleport>
</template>
