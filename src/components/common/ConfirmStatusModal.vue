<script setup>
import BaseConfirmModal from './BaseConfirmModal.vue'

defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  question: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: 'Aceptar',
  },
  cancelText: {
    type: String,
    default: 'Cancelar',
  },
  isDestructive: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['confirm', 'close'])
</script>

<template>
  <BaseConfirmModal
    :is-open="isOpen"
    :title="title"
    :question="question"
    :description="description"
    :confirm-text="confirmText"
    :cancel-text="cancelText"
    :is-destructive="isDestructive"
    :loading="loading"
    @confirm="$emit('confirm')"
    @close="$emit('close')"
  />
</template>
