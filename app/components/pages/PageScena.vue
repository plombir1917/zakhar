<script setup lang="ts">
/**
 * Сцена. Лист затемнён, свет — прожектор, который ходит за курсором: на
 * сцене видно только то, на что направлен луч. На телефоне луч гуляет сам и
 * прыгает туда, куда ткнули пальцем.
 *
 * Темнота — только картинка: текст под ней читается экранным диктором, а
 * кнопка «Включить свет» снимает её для тех, кому луч мешает.
 */
defineProps<{ fresh: boolean }>()

const stage = ref<HTMLElement | null>(null)
const lit = ref(false)
const x = ref(50)
const y = ref(28)
let wander = 0
let raf = 0

function aim(e: PointerEvent) {
  const r = stage.value?.getBoundingClientRect()
  if (!r) return
  x.value = ((e.clientX - r.left) / r.width) * 100
  y.value = ((e.clientY - r.top) / r.height) * 100
  if (e.pointerType === 'mouse') stopWander()
}

// Без мыши луч медленно водит по сцене восьмёркой — как прожекторщик,
// который ищет ведущего
function startWander() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const t0 = performance.now()
  const step = (t: number) => {
    const s = (t - t0) / 1000
    x.value = 50 + Math.sin(s * 0.45) * 32
    y.value = 40 + Math.sin(s * 0.9) * 22
    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
  wander = 1
}
function stopWander() {
  if (!wander) return
  cancelAnimationFrame(raf)
  wander = 0
}

onMounted(() => {
  if (!matchMedia('(hover: hover)').matches) startWander()
})
onBeforeUnmount(stopWander)

const frames = [
  { title: 'Свадьбы', note: 'первый танец, тосты, слёзы мамы' },
  { title: 'Деловые события', note: 'конференции, премии, корпоративы' },
  { title: 'Праздники', note: 'дни рождения, выпускные, юбилеи' },
]
</script>

<template>
  <div
    ref="stage"
    class="stage"
    :class="{ lit }"
    :style="{ '--x': x + '%', '--y': y + '%' }"
    @pointermove="aim"
    @pointerdown="aim"
  >
    <header class="page-head">
      <h1 class="page-title">Сцена</h1>
      <PenNote color="ink" :tilt="-3" class="chalk">моя любимая часть дела</PenNote>
    </header>

    <p class="lead">
      Веду свадьбы, деловые события и праздники. Держу зал, импровизирую, когда что-то идёт не по
      плану, и слежу, чтобы гостям было весело, а не неловко.
    </p>
    <p class="lead">Рост помогает: меня видно из любого конца зала.</p>

    <ul class="frames">
      <li v-for="(f, i) in frames" :key="f.title" class="frame" :style="{ '--r': (i - 1) * 2.4 + 'deg' }">
        <div class="shot" aria-hidden="true">
          <svg viewBox="0 0 120 90">
            <path d="M14 78 C 30 40, 90 40, 106 78" fill="none" stroke="currentColor" stroke-width="2" />
            <circle cx="60" cy="30" r="10" fill="none" stroke="currentColor" stroke-width="2" />
            <path d="M74 34 l 8 -10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
        <p class="frame-title type">{{ f.title }}</p>
        <PenNote class="frame-note" :tilt="-1.5" size="0.92rem">{{ f.note }}</PenNote>
      </li>
    </ul>
    <PenNote class="soon" :tilt="-2">настоящие фото со сцены — скоро</PenNote>

    <div class="cta">
      <TgButton>Позвать вести событие</TgButton>
      <button class="light" @click="lit = !lit">{{ lit ? 'Выключить свет' : 'Включить свет' }}</button>
    </div>
  </div>
</template>

<style scoped>
/* Лист переворачивается в «чёрный кабинет»: тёмная бумага, светлые чернила */
.stage {
  position: relative;
  margin: -34px -34px -46px -52px;
  padding: 34px 34px 46px 52px;
  min-height: calc(100% + 80px);
  background: #121014;
  color: #ece8e1;
  isolation: isolate;
}
.stage :deep(.page-title) {
  color: #ece8e1;
}
.chalk :deep(*),
.chalk {
  color: #ece8e1 !important;
}

/* Темнота вокруг луча: радиальный «прожектор» поверх всего листа */
.stage::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: radial-gradient(
    circle 190px at var(--x) var(--y),
    rgb(255 240 210 / 0.05) 0,
    rgb(0 0 0 / 0) 55%,
    rgb(6 5 8 / 0.9) 100%
  );
  transition: opacity 0.4s ease;
}
.lit::after {
  opacity: 0;
}

.frames {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin: 26px 0 6px;
  padding: 0;
  list-style: none;
}
.frame {
  transform: rotate(var(--r));
}
.shot {
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
  border: 1.5px dashed rgb(236 232 225 / 0.35);
  border-radius: 4px;
  color: rgb(236 232 225 / 0.5);
  background: repeating-linear-gradient(135deg, rgb(255 255 255 / 0.025) 0 8px, transparent 8px 16px);
}
.shot svg {
  width: 55%;
}
.frame-title {
  margin: 8px 0 0;
  font-size: 0.86rem;
  letter-spacing: 0.06em;
}
.frame-note {
  color: #9fb2ff !important;
}
.soon {
  margin-top: 10px;
  color: #9fb2ff !important;
}

.cta {
  position: relative;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-top: 26px;
}
.cta :deep(.tg) {
  background: #ece8e1;
  color: #121014;
}
.cta :deep(.tg:hover) {
  background: #ffd98a;
}
.light {
  padding: 8px 4px;
  border: 0;
  background: none;
  color: #ece8e1;
  text-decoration: underline;
  text-underline-offset: 4px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .stage {
    margin: -28px -18px -40px -34px;
    padding: 28px 18px 40px 34px;
  }
  .frames {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
