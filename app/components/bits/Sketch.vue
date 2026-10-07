<script setup lang="ts">
// Набросок вместо фото, пока хозяин дела не принёс снимки: длинный
// человечек с микрофоном у ростомера. Шутка про «2 метра» работает и без фото.
defineProps<{ caption?: string }>()
</script>

<template>
  <figure class="polaroid">
    <svg viewBox="0 0 200 230" role="img" aria-label="Набросок: высокий человек с микрофоном у ростомера">
      <rect x="0" y="0" width="200" height="230" fill="#f3f2ee" />
      <!-- ростомер -->
      <g stroke="#1b1b1b" stroke-width="1.4" fill="none" filter="url(#hand-wobble)">
        <path d="M150 20 V 214" />
        <path v-for="i in 10" :key="i" :d="`M150 ${214 - i * 19.4} h ${i % 5 === 0 ? 16 : 9}`" />
      </g>
      <text x="170" y="22" font-family="PT Mono" font-size="11" fill="#1b1b1b">200</text>
      <text x="170" y="122" font-family="PT Mono" font-size="11" fill="#1b1b1b">100</text>
      <!-- человечек: голова почти у отметки 200 -->
      <g stroke="#2b45c6" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#hand-wobble)">
        <circle cx="96" cy="38" r="15" />
        <path d="M96 53 C 95 90, 98 120, 96 150" />
        <path d="M96 150 C 90 175, 84 192, 80 212" />
        <path d="M96 150 C 102 175, 110 192, 114 212" />
        <path d="M96 76 C 80 92, 72 104, 66 116" />
        <path d="M96 76 C 108 70, 116 58, 118 46" />
        <!-- микрофон -->
        <path d="M118 46 L 124 30" stroke-width="4" stroke="#1b1b1b" />
        <circle cx="126" cy="26" r="5" fill="#1b1b1b" stroke="#1b1b1b" />
        <!-- улыбка -->
        <path d="M89 42 C 93 47, 100 47, 103 42" stroke-width="2" />
      </g>
    </svg>
    <figcaption v-if="caption" class="hand">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.polaroid {
  margin: 0;
  padding: 10px 10px 8px;
  background: #fbfbf8;
  box-shadow:
    0 1px 1px rgb(0 0 0 / 0.15),
    0 8px 18px -6px rgb(0 0 0 / 0.35);
}
.polaroid svg {
  display: block;
  width: 100%;
  height: auto;
}
figcaption {
  padding-top: 6px;
  color: var(--ink-soft);
  font-size: 0.95rem;
  text-align: center;
}
</style>
