<script setup lang="ts">
// Штамп. «thump» — отпечаток ставится на глазах: печать прилетает крупно и
// с размаху прижимается. Используется один раз за открытие папки.
withDefaults(
  defineProps<{
    tilt?: number
    sub?: string
    thump?: boolean
    delay?: number
    size?: string
  }>(),
  { tilt: -8, thump: false, delay: 0, size: '1.25rem' },
)
</script>

<template>
  <span
    class="stamp"
    :class="{ thump }"
    :style="{ '--tilt': tilt + 'deg', '--delay': delay + 's', fontSize: size }"
  >
    <span class="main"><slot /></span>
    <span v-if="sub" class="sub">{{ sub }}</span>
  </span>
</template>

<style scoped>
.stamp {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1em;
  padding: 0.35em 0.7em 0.3em;
  border: 0.16em double var(--stamp);
  border-radius: 0.3em;
  color: var(--stamp);
  font-family: var(--stampface);
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transform: rotate(var(--tilt));
  filter: url(#stamp-ink);
  mix-blend-mode: multiply;
  opacity: 0.93;
  user-select: none;
}
.sub {
  font-family: var(--type);
  font-size: 0.42em;
  letter-spacing: 0.12em;
}
.thump {
  animation: thump 0.42s cubic-bezier(0.2, 0.9, 0.3, 1.25) var(--delay) both;
}
@keyframes thump {
  0% {
    opacity: 0;
    transform: rotate(calc(var(--tilt) - 6deg)) scale(1.9);
  }
  70% {
    opacity: 0.95;
    transform: rotate(var(--tilt)) scale(0.96);
  }
  100% {
    opacity: 0.93;
    transform: rotate(var(--tilt)) scale(1);
  }
}
</style>
