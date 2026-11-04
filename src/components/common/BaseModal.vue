<script setup>
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: 'md', // sm, md, lg, xl, 2xl
  },
  closable: {
    type: Boolean,
    default: true,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])

const maxWidthClass = computed(() => {
  const map = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }
  return map[props.maxWidth] || 'max-w-md'
})

const handleClose = () => {
  if (props.closable) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Transición suave de opacidad para el overlay completo (sin distorsión de escala) -->
    <Transition
      enter-active-class="transition-opacity duration-250 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 text-center select-none"
        style="position: fixed; inset: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 9999;"
      >
        <!-- Backdrop oscuro estático que cubre el 100% de la pantalla sin zoom ni recortes -->
        <div
          class="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
          style="position: fixed; inset: 0; width: 100%; height: 100%;"
          @click="handleClose"
          aria-hidden="true"
        />

        <!-- Tarjeta del Modal con animación propia suave y sombra profunda -->
        <div
          :class="[
            'relative z-10 bg-white rounded-3xl w-full shadow-2xl border border-borde p-6 mx-auto my-auto flex flex-col max-h-[90vh] text-left text-verdoso modal-content-animated',
            maxWidthClass
          ]"
        >
          <!-- Encabezado del Modal -->
          <div
            v-if="showHeader"
            class="flex items-center justify-between pb-3 border-b border-borde"
          >
            <slot name="header">
              <h3 class="text-lg font-bold text-verdoso">{{ title }}</h3>
            </slot>

            <button
              v-if="closable"
              type="button"
              @click="handleClose"
              class="text-salvia hover:text-verdoso p-1.5 rounded-xl hover:bg-crema transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Contenido del Modal (Cuerpo) -->
          <div class="py-4 flex-1 overflow-y-auto">
            <slot />
          </div>

          <!-- Pie del Modal: Centrado con sus botones de acción (SOLID) -->
          <div
            v-if="$slots.footer"
            class="pt-4 border-t border-borde flex items-center justify-center gap-3 w-full"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
