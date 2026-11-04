<script setup>
import { computed } from 'vue'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-vue-next'

const props = defineProps({
  type: {
    type: String,
    default: 'warning', // 'warning', 'error', 'success', 'info'
    validator: (val) => ['warning', 'error', 'success', 'info'].includes(val),
  },
  message: {
    type: String,
    required: true,
  },
  dismissible: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['close'])

const config = computed(() => {
  switch (props.type) {
    case 'error':
      return {
        bgClass: 'bg-[#FEE2E2] border-[#FECACA]',
        textClass: 'text-[#991B1B]',
        iconClass: 'text-[#DC2626]',
        closeHoverClass: 'hover:bg-red-200/50 text-[#991B1B]',
        icon: AlertCircle,
      }
    case 'success':
      return {
        bgClass: 'bg-[#DDF3E3] border-[#BBF7D0]',
        textClass: 'text-[#244B36]',
        iconClass: 'text-[#166534]',
        closeHoverClass: 'hover:bg-[#cbeed4] text-[#244B36]',
        icon: CheckCircle2,
      }
    case 'info':
      return {
        bgClass: 'bg-salvia-50 border-salvia-200',
        textClass: 'text-verdoso',
        iconClass: 'text-salvia',
        closeHoverClass: 'hover:bg-salvia-100 text-verdoso',
        icon: Info,
      }
    case 'warning':
    default:
      return {
        bgClass: 'bg-[#FFF1CC] border-[#FDE68A]',
        textClass: 'text-[#B45309]',
        iconClass: 'text-[#D97706]',
        closeHoverClass: 'hover:bg-amber-200/60 text-[#B45309]',
        icon: AlertTriangle,
      }
  }
})
</script>

<template>
  <div
    :class="[
      'rounded-xl border px-4 py-3 flex items-start sm:items-center justify-between gap-3 shadow-md transition-all text-xs sm:text-sm font-semibold select-none',
      config.bgClass,
      config.textClass
    ]"
    role="alert"
  >
    <div class="flex items-start sm:items-center gap-2.5 flex-1">
      <component
        :is="config.icon"
        :class="['w-5 h-5 shrink-0 mt-0.5 sm:mt-0', config.iconClass]"
      />
      <div class="leading-snug break-words">
        {{ message }}
      </div>
    </div>

    <button
      v-if="dismissible"
      type="button"
      @click="$emit('close')"
      :class="[
        'p-1 rounded-lg transition-colors cursor-pointer shrink-0 -mr-1',
        config.closeHoverClass
      ]"
      title="Cerrar advertencia"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
</template>

