<script setup lang="ts">
import { TELEGRAM, TELEGRAM_HANDLE } from '~/data/dossier'

/**
 * Связь. Один способ — Telegram, и подан он как объявление на подъезде с
 * отрывными полосками: «оторвал» полоску — она улетает, а Telegram
 * открывается. Знакомо каждому, и нажать хочется самому.
 */
defineProps<{ fresh: boolean }>()

const STRIPS = 8
const torn = reactive(new Set<number>())

function tear(i: number) {
  torn.add(i)
}
</script>

<template>
  <div class="svyaz">
    <header class="page-head">
      <Typewriter tag="h1" class="page-title" text="Связь" :armed="fresh" :start="fresh" :pace="70" />
      <PenNote :tilt="-3">один способ, зато быстрый</PenNote>
    </header>

    <p class="big">
      Позвать вести свадьбу или событие, сделать сайт, свести трек или просто сказать привет — пишите в
      Telegram.
    </p>

    <div class="row">
      <TgButton>Написать в Telegram</TgButton>
      <span class="handle type">{{ TELEGRAM_HANDLE }}</span>
    </div>

    <!-- Объявление на подъезде -->
    <div class="ad">
      <Tape class="ad-tape" :tilt="-3" width="96px" />
      <p class="ad-head hand">Внимание!</p>
      <p class="ad-body">
        Ведущий на праздник. Программист на проект. Рэпер на трек.
        <span class="ad-small">Всё в одном человеке, рост 200 см. Звонить не надо — пишите.</span>
      </p>
      <ul class="strips" aria-label="Отрывные полоски с контактом">
        <li v-for="i in STRIPS" :key="i">
          <a
            class="strip"
            :class="{ torn: torn.has(i) }"
            :href="TELEGRAM"
            target="_blank"
            rel="noopener"
            :style="{ '--r': ((i * 37) % 7) - 3 + 'deg' }"
            @click="tear(i)"
          >
            <span class="type">{{ TELEGRAM_HANDLE }}</span>
          </a>
        </li>
      </ul>
      <PenNote class="ad-note" :tilt="-4">отрывай смело — полосок много</PenNote>
    </div>

    <Stamp class="seal" :thump="fresh" :delay="0.4" :tilt="-9" sub="Дело открыто">На связи</Stamp>
  </div>
</template>

<style scoped>
.svyaz {
  position: relative;
}
.big {
  max-width: 24em;
  margin: 4px 0 22px;
  font-size: clamp(1.15rem, 2cqi + 0.6rem, 1.4rem);
  line-height: 1.45;
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}
.handle {
  font-size: 0.95rem;
  color: var(--ink-soft);
}

.ad {
  position: relative;
  max-width: 420px;
  margin: 38px 0 10px 6px;
  padding: 22px 0 0;
  background: var(--grain), #fbfbf6;
  box-shadow: 0 10px 18px -10px rgb(0 0 0 / 0.45);
  transform: rotate(-1.4deg);
}
.ad-tape {
  top: -12px;
  left: calc(50% - 48px);
}
.ad-head {
  margin: 0 22px 4px;
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--stamp);
  font-variation-settings: 'INFM' 100, 'BNCE' 100;
}
.ad-body {
  margin: 0 22px 16px;
  font-size: 1.02rem;
  font-weight: 600;
  line-height: 1.4;
}
.ad-small {
  display: block;
  margin-top: 4px;
  font-weight: 400;
  font-size: 0.92rem;
}

/* Полоски нарезаны ножницами: пунктир сверху, номер — поперёк */
.strips {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1.5px dashed rgb(27 27 27 / 0.35);
}
.strips li {
  flex: 1;
  min-width: 0;
}
.strip {
  display: flex;
  justify-content: center;
  height: 118px;
  border-right: 1px dashed rgb(27 27 27 / 0.3);
  background: #fbfbf6;
  color: var(--ink);
  text-decoration: none;
  transform-origin: top center;
  transform: rotate(var(--r));
  transition:
    transform 0.6s cubic-bezier(0.5, 0, 0.75, 0),
    opacity 0.6s ease;
}
.strips li:last-child .strip {
  border-right: 0;
}
.strip span {
  writing-mode: vertical-rl;
  rotate: 180deg;
  padding: 8px 0;
  font-size: 0.78rem;
}
.strip:hover {
  background: color-mix(in srgb, var(--marker) 40%, #fbfbf6);
}
/* Оторванная улетает вниз и пропадает — на её месте пустой пунктир */
.strip.torn {
  transform: translateY(140px) rotate(calc(var(--r) * 6));
  opacity: 0;
  pointer-events: none;
}
.ad-note {
  position: absolute;
  right: -18px;
  bottom: -30px;
}

.seal {
  position: absolute;
  right: 2%;
  top: -6px;
}
@container (max-width: 560px) {
  .seal {
    position: static;
    margin-top: 40px;
  }
}
</style>
