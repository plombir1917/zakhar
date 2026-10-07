<script setup lang="ts">
import { CHANNEL } from '~/data/dossier'

/**
 * Музыка. Треки на сайт не выкладываются — основные живут в Telegram-канале
 * «документация к жизни», туда и ведём. Кассета здесь — обложка, а не плеер.
 */
defineProps<{ fresh: boolean }>()
</script>

<template>
  <div class="muzyka">
    <header class="page-head">
      <h1 class="page-title">Музыка</h1>
      <PenNote :tilt="-3">грешу, признаю</PenNote>
    </header>

    <p class="lead">
      Пишу рэп под ником <b>!захар</b>. А когда трек нужно свести, включается <b>DJ Снюф</b> — моё
      альтер эго: на днях рождения друзей он кричит в микрофон, в остальное время сводит звук.
    </p>

    <div class="tape-deck">
      <svg class="cassette" viewBox="0 0 320 200" role="img" aria-label="Кассета с надписью «!захар»">
        <rect x="6" y="6" width="308" height="188" rx="14" fill="#2a2730" />
        <rect x="26" y="22" width="268" height="100" rx="6" fill="#f4f1e8" />
        <path d="M26 46 H 294" stroke="#c8232c" stroke-width="5" />
        <rect x="88" y="66" width="144" height="44" rx="22" fill="#2a2730" />
        <circle cx="122" cy="88" r="15" fill="#f4f1e8" />
        <circle cx="198" cy="88" r="15" fill="#f4f1e8" />
        <g class="reel" :class="{ spin: fresh }" style="transform-origin: 122px 88px">
          <path d="M122 76 v 24 M110 88 h 24" stroke="#2a2730" stroke-width="4" />
        </g>
        <g class="reel" :class="{ spin: fresh }" style="transform-origin: 198px 88px">
          <path d="M198 76 v 24 M186 88 h 24" stroke="#2a2730" stroke-width="4" />
        </g>
        <path d="M70 194 L 90 150 H 230 L 250 194" fill="#3a3642" />
        <circle cx="110" cy="174" r="5" fill="#2a2730" />
        <circle cx="210" cy="174" r="5" fill="#2a2730" />
        <text x="40" y="40" font-family="Shantell Sans Variable" font-size="17" font-weight="700" fill="#2b45c6">!захар — основное</text>
        <text x="284" y="40" text-anchor="end" font-family="PT Mono" font-size="10" fill="#1b1b1b">сторона А</text>
      </svg>
      <PenNote class="deck-note" :tilt="4" color="stamp">сводил DJ Снюф</PenNote>
    </div>

    <p class="lead">Основные треки — в моём Telegram-канале «документация к жизни».</p>
    <TgButton :href="CHANNEL">Слушать в канале</TgButton>

    <p class="snuff-hint">
      <PenNote :tilt="-2">видите на столе красную бумажку «НЕ ТРОГАТЬ»? это он. лучше не трогайте.</PenNote>
    </p>
  </div>
</template>

<style scoped>
.tape-deck {
  position: relative;
  max-width: 360px;
  margin: 20px 0 22px;
  transform: rotate(-2deg);
}
.cassette {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 10px 14px rgb(0 0 0 / 0.35));
}
.reel.spin {
  animation: spin 2.4s linear 3;
}
@keyframes spin {
  to {
    rotate: 360deg;
  }
}
.deck-note {
  position: absolute;
  right: -12px;
  bottom: -14px;
}
.snuff-hint {
  margin: 26px 0 0;
  max-width: 30em;
}
</style>
