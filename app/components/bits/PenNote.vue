<script setup lang="ts">
// Пометка на полях. Наклон и цвет — у каждой свои: две одинаково
// повёрнутые надписи выдают, что их писала не рука.
withDefaults(
  defineProps<{
    color?: 'pen' | 'stamp' | 'ink'
    tilt?: number
    size?: string
  }>(),
  { color: 'pen', tilt: -2, size: '1.05rem' },
)
</script>

<template>
  <span class="note hand" :class="color" :style="{ '--tilt': tilt + 'deg', fontSize: size }"><slot /></span>
</template>

<style scoped>
.note {
  display: inline-block;
  transform: rotate(var(--tilt));
  line-height: 1.2;
  font-weight: 450;
}
.pen {
  color: var(--pen);
}
.stamp {
  color: var(--stamp);
}
.ink {
  color: var(--ink);
}
</style>
