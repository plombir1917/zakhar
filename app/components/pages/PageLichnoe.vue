<script setup lang="ts">
import { INSTAGRAM, VK } from '~/data/dossier'

/** Личное: спорт и жизнь. Фото на скотче, подписи ручкой — как в блокноте. */
defineProps<{ fresh: boolean }>()

const snaps = [
  { caption: 'спорт — для себя, не для медалей', tilt: -4 },
  { caption: 'друзья и праздники', tilt: 3 },
  { caption: 'ситуации', tilt: -2 },
]
</script>

<template>
  <div class="lichnoe">
    <header class="page-head">
      <h1 class="page-title">Личное</h1>
      <PenNote :tilt="-3">то, что не секретно</PenNote>
    </header>

    <p class="lead">
      Спорт — для себя. Остальное — жизнь: друзья, поездки, праздники и ситуации, после которых есть что
      рассказать со сцены.
    </p>

    <ul class="board">
      <li v-for="(s, i) in snaps" :key="s.caption" class="snap" :style="{ '--r': s.tilt + 'deg' }">
        <Tape class="snap-tape" :tilt="i % 2 ? 8 : -7" width="70px" />
        <div class="snap-photo" aria-hidden="true" />
        <PenNote class="snap-cap" :tilt="0" size="0.98rem">{{ s.caption }}</PenNote>
      </li>
    </ul>
    <PenNote :tilt="-2">фото будут, когда хозяин дела их принесёт</PenNote>

    <p class="elsewhere">
      Где ещё водится:
      <a class="text-link" :href="INSTAGRAM" target="_blank" rel="noopener">Instagram</a>,
      <a class="text-link" :href="VK" target="_blank" rel="noopener">ВКонтакте</a>
    </p>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  margin: 28px 0 14px;
  padding: 0;
  list-style: none;
}
.snap {
  position: relative;
  padding: 10px 10px 8px;
  background: #fbfbf8;
  box-shadow: 0 8px 16px -8px rgb(0 0 0 / 0.4);
  transform: rotate(var(--r));
}
.snap-tape {
  top: -12px;
  left: calc(50% - 35px);
}
.snap-photo {
  aspect-ratio: 1;
  background:
    radial-gradient(circle at 30% 30%, rgb(255 255 255 / 0.5), transparent 40%),
    linear-gradient(160deg, #cfd6dc, #aeb8c0);
}
.snap-cap {
  display: block;
  padding-top: 6px;
  color: var(--ink-soft);
}
.elsewhere {
  margin: 26px 0 0;
}
@media (max-width: 700px) {
  .board {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
