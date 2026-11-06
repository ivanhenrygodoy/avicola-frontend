<script setup>
import { computed } from 'vue'
import SectionCard from '@/components/common/SectionCard.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  ocupacion: { type: Array, required: true },
})

const totalAves = computed(() => props.ocupacion.reduce((acc, c) => acc + c.total_aves, 0))
</script>

<template>
  <SectionCard title="Ocupación por casita" subtitle="Aves activas por casita y división">
    <p v-if="ocupacion.length === 0" class="text-sm text-verdoso-muted">
      Aún no hay casitas registradas.
    </p>

    <ul v-else class="divide-y divide-borde">
      <li v-for="casita in ocupacion" :key="casita.id_casita" class="py-4 first:pt-0 last:pb-0">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="font-bold text-verdoso">{{ casita.casita }}</span>
          <span class="font-semibold text-verdoso-muted">{{ casita.total_aves }} aves</span>
        </div>
        <ProgressBar
          :value="casita.total_aves"
          :max="totalAves"
          color-class="bg-salvia"
          :label="`${casita.casita}: ${casita.total_aves} de ${totalAves} aves`"
        />

        <ul class="mt-3 space-y-1.5">
          <li
            v-for="d in casita.divisiones"
            :key="d.id_division"
            class="flex items-center justify-between gap-2 text-xs"
          >
            <span class="flex items-center gap-2 min-w-0">
              <span class="font-medium text-verdoso truncate">{{ d.division }}</span>
              <StatusBadge v-if="!d.activa" variant="danger" size="sm" class="shrink-0">Inactiva</StatusBadge>
              <span v-if="d.especies.length" class="text-verdoso-muted truncate">
                {{ d.especies.join(', ') }}
              </span>
            </span>
            <span class="font-semibold text-verdoso shrink-0">{{ d.total_aves }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </SectionCard>
</template>
