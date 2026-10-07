<script setup lang="ts">
import { EVIDENCE } from '~/data/dossier'

/**
 * Работа и проекты. Проекты — вещественные доказательства: скриншот в
 * прозрачном пакете с биркой, под ним — техническая карточка. Только здесь
 * дело переходит на язык документации: это раздел для тех, кто пришёл за кодом.
 */
defineProps<{ fresh: boolean }>()
</script>

<template>
  <div class="kod">
    <header class="page-head">
      <h1 class="page-title">Код</h1>
      <PenNote :tilt="-2">тут всё серьёзно. почти</PenNote>
    </header>

    <p class="lead">
      Днём — ведущий программист в администрации региона. Вечером и в выходные — свои проекты: от сайтов
      до сервисов, которые сами пишут, рисуют и монтируют.
    </p>
    <p class="lead">Два из них приобщены к делу:</p>

    <section v-for="e in EVIDENCE" :key="e.no" class="exhibit" :aria-labelledby="'ev-' + e.no">
      <div class="bag" :class="'n' + e.no">
        <span class="zip" aria-hidden="true" />
        <span class="tag" aria-hidden="true">
          <span class="tag-title type">Вещдок № {{ e.no }}</span>
          <PenNote :tilt="-2" size="0.95rem">{{ e.host }}</PenNote>
        </span>
        <picture>
          <source media="(max-width: 600px)" :srcset="e.shotPhone" />
          <img :src="e.shot" :alt="'Главная страница ' + e.host" loading="lazy" decoding="async" />
        </picture>
        <span class="gloss" aria-hidden="true" />
      </div>

      <div class="card">
        <h2 :id="'ev-' + e.no" class="card-title">{{ e.name }}</h2>
        <p class="card-what">{{ e.what }}</p>
        <dl class="spec">
          <template v-for="f in e.facts" :key="f.label">
            <dt class="type">{{ f.label }}</dt>
            <dd>{{ f.value }}</dd>
          </template>
        </dl>
        <a class="text-link" :href="e.url" target="_blank" rel="noopener">Открыть {{ e.host }}</a>
      </div>
    </section>

    <PenNote class="more" :tilt="-2">остальное — в работе, покажу, когда доделаю</PenNote>
  </div>
</template>

<style scoped>
.exhibit {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 22px;
  align-items: start;
  margin: 26px 0 34px;
}

/* Пакет для вещдоков: прозрачный пластик, застёжка, бирка, блик */
.bag {
  position: relative;
  padding: 26px 14px 14px;
  border-radius: 6px;
  background: rgb(240 246 250 / 0.42);
  box-shadow:
    inset 0 0 0 1.5px rgb(255 255 255 / 0.65),
    inset 0 0 22px rgb(140 170 190 / 0.25),
    0 10px 20px -12px rgb(0 0 0 / 0.45);
  transform: rotate(-1.2deg);
}
.bag.n2 {
  transform: rotate(1deg);
}
.zip {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(#cfd9df, #9fb3bf);
  opacity: 0.8;
}
.tag {
  position: absolute;
  z-index: 2;
  right: -8px;
  top: -14px;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 6px 12px 6px 14px;
  background: #fdfcf7;
  border-left: 8px solid var(--stamp);
  box-shadow: 0 3px 6px -2px rgb(0 0 0 / 0.35);
  transform: rotate(4deg);
}
.tag-title {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.bag img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 2px;
  filter: saturate(0.92) contrast(1.02);
}
.gloss {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  background: linear-gradient(115deg, rgb(255 255 255 / 0) 30%, rgb(255 255 255 / 0.28) 42%, rgb(255 255 255 / 0) 52%);
  pointer-events: none;
}

/* Техническая карточка — единственное место, где дело похоже на документацию */
.card {
  padding: 4px 0 0;
}
.card-title {
  margin: 0 0 6px;
  font-size: 1.18rem;
  line-height: 1.3;
}
.card-what {
  margin: 0 0 12px;
  font-size: 0.97rem;
}
.spec {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 14px;
  margin: 0 0 14px;
  padding: 10px 0;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  font-size: 0.92rem;
}
.spec dt {
  font-size: 0.78rem;
  color: var(--ink-soft);
  padding-top: 2px;
}
.spec dd {
  margin: 0;
}

.more {
  margin-top: 4px;
}

@container (max-width: 620px) {
  .exhibit {
    grid-template-columns: 1fr;
  }
  .bag {
    max-width: 440px;
  }
}
</style>
