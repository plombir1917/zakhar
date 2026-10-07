<script setup lang="ts">
import { SECTIONS, type Section, type SectionId } from '~/data/dossier'

/**
 * Левая страница разворота: фото раздела на скрепке и опись документов.
 *
 * Это оборот перевёрнутого листа — поэтому она одна и та же и на развороте,
 * и на обратной стороне листа, который переворачивается: когда лист ложится
 * влево, на нём уже фото нового раздела.
 */
defineProps<{ section: Section; current: SectionId; interactive?: boolean }>()
defineEmits<{ go: [id: SectionId] }>()
</script>

<template>
  <div class="left">
    <div class="photo">
      <Clip class="photo-clip" />
      <Sketch :kind="section.sketch" :photo="section.photo" :caption="section.caption" />
    </div>

    <div class="inventory">
      <h2 class="type">Опись документов</h2>
      <ol>
        <li v-for="(s, i) in SECTIONS" :key="s.id">
          <button
            class="inv-row"
            :class="{ on: current === s.id }"
            :tabindex="interactive ? 0 : -1"
            @click="$emit('go', s.id)"
          >
            <span class="inv-no type">{{ i + 1 }}.</span>
            <span class="inv-text">{{ s.inventory }}</span>
            <span class="inv-dots" aria-hidden="true" />
            <span class="inv-page type">л. {{ i + 1 }}</span>
          </button>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.left {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 5%;
  padding: 9% 8% 6% 9%;
}
.photo {
  position: relative;
  width: min(52%, 250px);
  margin-left: 8%;
  transform: rotate(-3deg);
}
.photo-clip {
  position: absolute;
  top: -28px;
  left: 22%;
  z-index: 2;
}
.inventory {
  align-self: start;
}
.inventory h2 {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: 0.08em;
}
.inventory ol {
  margin: 0;
  padding: 0;
  list-style: none;
}
.inv-row {
  display: grid;
  grid-template-columns: 1.6em auto 1fr auto;
  align-items: baseline;
  gap: 6px;
  width: 100%;
  padding: 3px 0;
  border: 0;
  background: none;
  text-align: left;
  font-size: 0.92rem;
  cursor: pointer;
}
.inv-row:hover .inv-text,
.inv-row.on .inv-text {
  background: linear-gradient(transparent 55%, color-mix(in srgb, var(--marker) 80%, transparent) 55% 92%, transparent 92%);
}
.inv-no,
.inv-page {
  font-size: 0.78rem;
  color: var(--ink-soft);
}
.inv-dots {
  border-bottom: 1.5px dotted var(--rule);
  transform: translateY(-4px);
}
</style>
