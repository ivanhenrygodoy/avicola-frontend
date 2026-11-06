<script setup>
import { CheckCircle2, Plus, Trash2, XCircle } from 'lucide-vue-next'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import RowActionButton from '@/components/common/RowActionButton.vue'

/**
 * Ficha de una casita con la lista de sus corrales (solo presentación). No muta nada:
 * emite eventos y la vista decide qué hacer (abrir el alta de corral, confirmar el
 * cambio de estado o la eliminación).
 *
 *   <CasitaDetalleModal :is-open="show" :casita="store.selectedCasita"
 *     @close="show = false" @add-division="..." @toggle-division="..." @delete-division="..." />
 */
defineProps({
  isOpen: { type: Boolean, default: false },
  casita: { type: Object, default: null },
})

defineEmits(['close', 'add-division', 'toggle-division', 'delete-division'])
</script>

<template>
  <BaseModal :is-open="isOpen && !!casita" max-width="2xl" @close="$emit('close')">
    <template #header>
      <div>
        <div class="flex items-center gap-2">
          <StatusBadge variant="neutral">{{ casita?.tipo || 'Galpón' }}</StatusBadge>
          <StatusBadge :variant="casita?.activa ? 'success' : 'danger'">
            {{ casita?.activa ? 'Activa' : 'Inactiva' }}
          </StatusBadge>
        </div>
        <h3 class="text-xl font-bold text-verdoso mt-1">{{ casita?.nombre }}</h3>
        <p class="text-xs text-verdoso-muted mt-0.5">
          {{ casita?.descripcion || 'Sin descripción detallada' }}
        </p>
      </div>
    </template>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-salvia uppercase tracking-wider">
          Corrales y Divisiones Asociadas ({{ casita?.divisiones?.length || 0 }})
        </h4>
        <button
          type="button"
          class="px-3 py-1.5 btn-principal text-xs flex items-center gap-1"
          @click="$emit('add-division', casita)"
        >
          <Plus class="w-3.5 h-3.5" /> Agregar Corral
        </button>
      </div>

      <div
        v-if="!casita?.divisiones || casita.divisiones.length === 0"
        class="p-8 text-center text-verdoso-muted italic bg-crema rounded-xl border border-dashed border-borde text-xs"
      >
        No hay corrales registrados en esta casita. Puedes agregar el primero con el botón superior.
      </div>

      <div
        v-for="div in casita?.divisiones"
        :key="div.id"
        class="p-4 rounded-xl border border-borde bg-white hover:border-salvia transition-all flex items-center justify-between gap-4 shadow-2xs"
      >
        <div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-bold text-verdoso">{{ div.nombre }}</p>
            <span class="text-xs text-salvia font-mono">#{{ div.id }}</span>
          </div>
          <p class="text-xs text-verdoso-muted mt-1">
            {{ div.descripcion || 'Espacio físico asignado para albergue de aves' }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <StatusBadge
            as="button"
            :variant="div.activa ? 'success' : 'outline'"
            :title="div.activa ? 'Clic para deshabilitar corral' : 'Clic para habilitar corral'"
            @click="$emit('toggle-division', div)"
          >
            <component :is="div.activa ? CheckCircle2 : XCircle" class="w-3.5 h-3.5" aria-hidden="true" />
            <span>{{ div.activa ? 'Habilitado' : 'Inactivo' }}</span>
          </StatusBadge>

          <RowActionButton
            :icon="Trash2"
            tone="danger"
            size="sm"
            title="Eliminar división"
            @click="$emit('delete-division', div)"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="px-6 py-2 btn-secundario text-sm" @click="$emit('close')">Cerrar</button>
    </template>
  </BaseModal>
</template>
