<script setup>
import BaseModal from './BaseModal.vue'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({
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
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: 'Al confirmar la acción, los cambios no podrán revertirse.',
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
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm', 'close', 'cancel'])

const handleClose = () => {
  emit('close')
  emit('cancel')
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :show-header="false"
    :closable="!(loading || isLoading)"
    max-width="md"
    @close="handleClose"
  >
    <div class="py-4 px-2 text-center space-y-3">
      <!-- Título secundario / contexto (si se proporciona) -->
      <h3 v-if="title" class="text-xl font-bold text-verdoso tracking-tight">
        {{ title }}
      </h3>

      <!-- Pregunta de confirmación principal centrada -->
      <p
        :class="[
          'font-bold text-verdoso tracking-tight',
          title ? 'text-sm font-medium text-verdoso/90' : 'text-lg sm:text-xl'
        ]"
      >
        {{ question || message }}
      </p>

      <!-- Descripción o advertencia centrada -->
      <p v-if="description" class="text-xs sm:text-sm text-verdoso-muted leading-relaxed max-w-sm mx-auto">
        {{ description }}
      </p>
    </div>

    <!-- Botones de Acción Centrados (SOLID) -->
    <template #footer>
      <div class="flex items-center justify-center gap-4 w-full pt-1">
        <button
          type="button"
          @click="handleClose"
          :disabled="loading || isLoading"
          class="px-7 py-2.5 btn-secundario text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {{ cancelText }}
        </button>

        <button
          type="button"
          @click="$emit('confirm')"
          :disabled="loading || isLoading"
          :class="[
            'px-7 py-2.5 text-sm shadow-xs flex items-center gap-2 cursor-pointer',
            isDestructive ? 'btn-destructivo' : 'btn-principal'
          ]"
        >
          <Loader2 v-if="loading || isLoading" class="w-4 h-4 animate-spin text-white" />
          <span>{{ confirmText }}</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

