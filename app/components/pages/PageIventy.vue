<script setup lang="ts">
/**
 * Ивенты. Вместо рассказа «как я организую» — лист тайминга, который ведёт
 * координатор: время, пункт, галочка ручкой. Одна строка зачёркнута и
 * переписана — так выглядит любой настоящий тайминг к середине дня.
 */
const props = defineProps<{ fresh: boolean }>()

const plan = [
  { at: '09:00', what: 'площадка готова, звук проверен' },
  { at: '11:30', what: 'подрядчики на местах, все знают, что делают' },
  { at: '12:00', what: 'гости приходят, никто не потерялся' },
  { at: '12:30', what: 'открытие: ведущий на сцене' },
  { at: '15:00', what: 'всё пошло не по плану', fixed: 'всё по плану' },
  { at: '18:00', what: 'гости уходят довольными' },
]
const tick = (i: number) => (props.fresh ? 0.3 + i * 0.22 : 0)
</script>

<template>
  <div class="iventy">
    <header class="page-head">
      <Typewriter tag="h1" class="page-title" text="Ивенты" :armed="fresh" :start="fresh" :pace="70" />
      <PenNote :tilt="-3">за кулисами</PenNote>
    </header>

    <p class="lead">
      Работаю в ивент-индустрии региона: бываю координатором и организатором мероприятий. Моя часть —
      план, тайминг и люди, чтобы событие случилось вовремя и без суеты.
    </p>

    <div class="timing">
      <p class="timing-head type">Тайминг события <PenNote :tilt="-2" size="0.95rem">пример</PenNote></p>
      <ol>
        <li v-for="(p, i) in plan" :key="p.at">
          <span class="at type">{{ p.at }}</span>
          <span class="what">
            <span :class="{ struck: p.fixed }">{{ p.what }}</span>
            <Scribble v-if="p.fixed" kind="strike" class="strike" color="var(--stamp)" :draw="fresh" :delay="tick(i)" />
            <PenNote v-if="p.fixed" color="stamp" :tilt="-3">{{ p.fixed }}</PenNote>
          </span>
          <svg class="check" viewBox="0 0 30 26" aria-hidden="true" :style="{ '--d': tick(i) + 0.15 + 's' }" :class="{ draw: fresh }">
            <path d="M3 14 C 7 17, 9 20, 11 23 C 15 14, 21 7, 27 3" pathLength="1" />
          </svg>
        </li>
      </ol>
      <Stamp class="done" :thump="fresh" :delay="tick(plan.length) + 0.3" :tilt="-12" size="1.05rem">Выполнено</Stamp>
    </div>
  </div>
</template>

<style scoped>
.timing {
  position: relative;
  max-width: 520px;
  margin-top: 22px;
  padding: 18px 20px 26px;
  background:
    repeating-linear-gradient(transparent 0 31px, rgb(43 69 198 / 0.18) 31px 32px),
    #f6f6f1;
  box-shadow: 0 8px 18px -10px rgb(0 0 0 / 0.4);
  transform: rotate(-0.6deg);
}
.timing-head {
  margin: 0 0 8px;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
ol {
  margin: 0;
  padding: 0;
  list-style: none;
}
li {
  display: grid;
  grid-template-columns: 3.4em 1fr 26px;
  align-items: center;
  gap: 12px;
  min-height: 32px;
}
.at {
  font-size: 0.86rem;
}
.what {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 12px;
  font-size: 0.97rem;
}
.struck {
  color: var(--ink-soft);
}
.strike {
  position: absolute;
  left: -4px;
  top: 4px;
  width: 13em;
  height: 14px;
}
.check {
  width: 24px;
  height: 22px;
  fill: none;
  stroke: var(--pen);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.check.draw path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ink 0.35s ease var(--d) forwards;
}
@keyframes ink {
  to {
    stroke-dashoffset: 0;
  }
}
.done {
  position: absolute;
  right: 18px;
  bottom: -14px;
}
</style>
