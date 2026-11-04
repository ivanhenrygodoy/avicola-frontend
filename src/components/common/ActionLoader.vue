<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: 'Procesando acción...',
  },
  submessage: {
    type: String,
    default: 'Por favor, espere un momento...',
  },
})
</script>

<template>
  <Teleport to="body">
    <!-- Transición de opacidad pura para el overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4 select-none"
        style="position: fixed; inset: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 10000;"
      >
        <!-- Backdrop oscuro estático que cubre toda la pantalla -->
        <div
          class="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          style="position: fixed; inset: 0; width: 100%; height: 100%;"
          aria-hidden="true"
        />

        <!-- Tarjeta del Loader centrada y animada suavemente -->
        <div class="relative z-10 bg-white rounded-3xl p-6 sm:p-8 max-w-xs w-full shadow-2xl border border-borde text-center flex flex-col items-center gap-4 modal-content-animated">
          <!-- Spinner animado con Verde Bosque #244B36 y Verde Salvia #6F9678 -->
          <div class="relative w-16 h-16 flex items-center justify-center">
            <!-- Anillo exterior giratorio -->
            <div class="absolute inset-0 rounded-full border-4 border-borde border-t-[#244B36] border-r-[#6F9678] animate-spin"></div>
            <!-- Ícono central -->
            <span class="text-2xl select-none animate-pulse">🐔</span>
          </div>

          <!-- Textos de estado corporativos -->
          <div class="space-y-1">
            <h4 class="text-base font-bold text-verdoso">
              {{ message }}
            </h4>
            <p class="text-xs text-verdoso-muted">
              {{ submessage }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
