<script setup>
import { ref, useId } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

/**
 * Tarjeta con cabecera desplegable (patrón acordeón accesible).
 * La cabecera es un <button> con aria-expanded/aria-controls; el cuerpo se
 * mantiene montado pero oculto y emite `open`/`close` para que el padre cargue datos.
 *
 * Efecto hover/foco/abierto igual al de las tarjetas de módulos del dashboard:
 * borde `salvia`, sombra suave y el cuadro del icono pasa de `bosque-50` a `bosque`
 * con el icono en blanco.
 */
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: [Object, Function], default: null }, // componente de Lucide
  defaultOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['open', 'close'])

const abierto = ref(props.defaultOpen)
const panelId = useId()

if (props.defaultOpen) emit('open')

const alternar = () => {
  abierto.value = !abierto.value
  emit(abierto.value ? 'open' : 'close')
}
</script>

<template>
  <section
    :class="[
      'group bg-white rounded-2xl border transition-all duration-200',
      'hover:border-salvia hover:shadow-xs focus-within:border-salvia',
      abierto ? 'border-salvia shadow-xs' : 'border-borde shadow-xs',
    ]"
  >
    <h3>
      <button
        type="button"
        class="w-full flex items-center justify-between gap-3 p-5 text-left rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salvia"
        :aria-expanded="abierto"
        :aria-controls="panelId"
        @click="alternar"
      >
        <span class="flex items-center gap-3 min-w-0">
          <span
            v-if="icon"
            :class="[
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200',
              'group-hover:bg-bosque group-hover:text-white group-focus-within:bg-bosque group-focus-within:text-white',
              abierto ? 'bg-bosque text-white' : 'bg-bosque-50 text-bosque',
            ]"
          >
            <component :is="icon" class="w-5 h-5" aria-hidden="true" />
          </span>
          <span class="min-w-0">
            <span class="block text-base font-bold text-verdoso tracking-tight">{{ title }}</span>
            <span v-if="subtitle" class="block text-xs text-verdoso-muted mt-0.5">{{ subtitle }}</span>
          </span>
        </span>
        <span class="flex items-center gap-3 shrink-0">
          <slot name="summary" />
          <ChevronDown
            :class="['w-5 h-5 text-bosque transition-transform duration-200', abierto ? 'rotate-180' : '']"
            aria-hidden="true"
          />
        </span>
      </button>
    </h3>

    <div v-show="abierto" :id="panelId" class="border-t border-borde">
      <slot />
    </div>
  </section>
</template>
