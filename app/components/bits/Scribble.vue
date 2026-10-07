<script setup lang="ts">
// Каракули ручкой: подчёркивание, обводка, стрелка, зачёркивание. Рисуются
// линией на глазах (draw), когда их показывают в первый раз.
const props = withDefaults(
  defineProps<{
    kind: 'underline' | 'circle' | 'arrow' | 'strike' | 'arrow-down'
    color?: string
    draw?: boolean
    delay?: number
    width?: number
  }>(),
  { color: 'var(--pen)', draw: true, delay: 0, width: 2.4 },
)

const shapes = {
  underline: { box: '0 0 200 18', d: ['M3 11 C 42 5, 82 15, 122 8 S 186 10, 197 6'] },
  circle: {
    box: '0 0 200 80',
    d: ['M112 8 C 166 6 198 24 192 44 C 186 66 118 76 68 70 C 20 64 2 46 9 28 C 16 12 64 2 124 10'],
  },
  arrow: { box: '0 0 140 50', d: ['M5 42 C 36 14, 86 6, 128 22', 'M112 8 L 130 22 L 110 34'] },
  'arrow-down': { box: '0 0 60 120', d: ['M30 4 C 18 40, 44 70, 30 110', 'M14 92 L 30 112 L 46 94'] },
  strike: { box: '0 0 200 20', d: ['M2 13 C 52 7 120 16 198 6'] },
}
const shape = computed(() => shapes[props.kind])
</script>

<template>
  <svg
    class="scribble"
    :class="{ draw }"
    :viewBox="shape.box"
    preserveAspectRatio="none"
    aria-hidden="true"
    :style="{ '--delay': delay + 's', color }"
  >
    <path
      v-for="(d, i) in shape.d"
      :key="i"
      :d="d"
      pathLength="1"
      fill="none"
      stroke="currentColor"
      :stroke-width="width"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
      :style="{ animationDelay: `calc(var(--delay) + ${i * 0.25}s)` }"
    />
  </svg>
</template>

<style scoped>
.scribble {
  display: block;
  overflow: visible;
  pointer-events: none;
}
.draw path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ink 0.6s cubic-bezier(0.4, 0.1, 0.3, 1) forwards;
}
@keyframes ink {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
