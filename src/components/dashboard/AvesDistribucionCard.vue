<script setup>
import SectionCard from '@/components/common/SectionCard.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

defineProps({
  aves: { type: Object, required: true },
})
</script>

<template>
  <SectionCard title="Población de aves" :subtitle="`${aves.total} aves activas`">
    <p v-if="aves.total === 0" class="text-sm text-verdoso-muted">
      Aún no hay aves activas registradas.
    </p>

    <template v-else>
      <div>
        <h4 class="text-xs font-semibold text-verdoso-muted uppercase tracking-wider mb-3">Por especie</h4>
        <ul class="space-y-3">
          <li v-for="e in aves.por_especie" :key="e.especie">
            <div class="flex items-center justify-between text-sm mb-1.5">
              <span class="font-medium text-verdoso">{{ e.especie }}</span>
              <span class="font-bold text-verdoso">{{ e.total }}</span>
            </div>
            <ProgressBar :value="e.total" :max="aves.total" :label="`${e.especie}: ${e.total} de ${aves.total}`" />
          </li>
        </ul>
      </div>

      <div class="border-t border-borde pt-4">
        <h4 class="text-xs font-semibold text-verdoso-muted uppercase tracking-wider mb-3">Por sexo</h4>
        <ul class="flex flex-wrap gap-2">
          <li
            v-for="s in aves.por_sexo"
            :key="s.sexo"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-salvia-50 text-bosque border border-salvia-100"
          >
            {{ s.sexo }}
            <span class="text-verdoso">{{ s.total }}</span>
          </li>
        </ul>
      </div>
    </template>
  </SectionCard>
</template>
