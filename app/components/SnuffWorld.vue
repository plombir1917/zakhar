<script setup lang="ts">
import { CHANNEL, TELEGRAM } from '~/data/dossier'

/**
 * Мир DJ Снюфа — нарочно не «личное дело». Там бумага, ручка и порядок;
 * здесь флаер рейва: жидкий хром, хромированные буквы, бегущая строка и пульт,
 * на котором посетитель сам играет поверх бита. Общее у двух миров — только
 * Telegram и выход обратно.
 *
 * Всё, что движется, движется от удара бочки (--kick): буквы прыгают, тени
 * расходятся цветом, фон встряхивается — поэтому страница «играет», а не
 * просто анимирована.
 */
const emit = defineEmits<{ exit: [] }>()

const audio = useSnuffAudio()
const root = ref<HTMLElement | null>(null)
const calm = ref(false)
const filter = ref(1)
const lit = reactive<Record<string, boolean>>({})
let raf = 0

const PADS = [
  { id: 'kick', label: 'Бочка', key: 'a' },
  { id: 'clap', label: 'Хлопок', key: 's' },
  { id: 'hat', label: 'Хэт', key: 'd' },
  { id: 'horn', label: 'Горн', key: 'f' },
] as const

function hit(id: (typeof PADS)[number]['id']) {
  audio.pad(id)
  lit[id] = true
  setTimeout(() => (lit[id] = false), 140)
}

watch(filter, (v) => audio.setFilter(v))

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') return emit('exit')
  if (e.repeat || e.metaKey || e.ctrlKey || (e.target as HTMLElement)?.tagName === 'INPUT') return
  const p = PADS.find((x) => x.key === e.key.toLowerCase() || x.key === layoutRu[e.key.toLowerCase()])
  if (p) hit(p.id)
}
// Клавиши те же на русской раскладке: ф ы в а
const layoutRu: Record<string, string> = { ф: 'a', ы: 's', в: 'd', а: 'f' }

onMounted(() => {
  calm.value = matchMedia('(prefers-reduced-motion: reduce)').matches
  addEventListener('keydown', onKey)
  const tick = () => {
    root.value?.style.setProperty('--kick', calm.value ? '0' : audio.kickEnv().toFixed(3))
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  root.value?.focus()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  removeEventListener('keydown', onKey)
})

const title = [
  ['D', 'J'],
  ['С', 'Н', 'Ю', 'Ф'],
]
const ticker = 'НЕ ТРОГАТЬ ✶ ВСЁ РАВНО ТРОНУЛИ ✶ DJ СНЮФ В ЗДАНИИ ✶ СВЕДЁМ ВСЁ, ЧТО ЗВУЧИТ ✶ '
</script>

<template>
  <div ref="root" class="world" tabindex="-1" role="region" aria-label="Мир DJ Снюфа">
    <SnuffShader mode="world" :kick="audio.kickEnv" :still="calm" />
    <div class="scan" aria-hidden="true" />

    <header class="bar">
      <span class="presents">!захар представляет</span>
      <div class="bar-actions">
        <button class="ghost" :aria-pressed="audio.muted.value" @click="audio.setMuted(!audio.muted.value)">
          {{ audio.muted.value ? 'звук: выкл' : 'звук: вкл' }}
        </button>
        <button class="ghost exit" @click="emit('exit')">обратно в личное дело</button>
      </div>
    </header>

    <section class="hero">
      <h1 class="title" aria-label="DJ Снюф">
        <span v-for="(row, r) in title" :key="r" class="row" aria-hidden="true">
          <span
            v-for="(ch, i) in row"
            :key="i"
            class="slam"
            :style="{ '--i': r * 2 + i, '--dir': (r * 2 + i) % 2 ? 1 : -1 }"
            ><span class="ch">{{ ch }}</span></span
          >
        </span>
      </h1>
      <p class="sub">
        Саунд-продюсер. Сводит треки, ставит бит и кричит в микрофон на праздниках у друзей.
      </p>
    </section>

    <div class="ticker" aria-hidden="true">
      <div class="ticker-track">
        <span v-for="n in 4" :key="n">{{ ticker }}</span>
      </div>
    </div>

    <section class="deck" aria-labelledby="deck-title">
      <h2 id="deck-title" class="h2">Пульт</h2>
      <p class="hint">Жми пэды или клавиши A S D F — играешь поверх бита.</p>
      <div class="pads">
        <button
          v-for="p in PADS"
          :key="p.id"
          class="pad"
          :class="[p.id, { lit: lit[p.id] }]"
          @pointerdown.prevent="hit(p.id)"
          @keydown.enter.prevent="hit(p.id)"
        >
          <span class="pad-label">{{ p.label }}</span>
          <kbd>{{ p.key.toUpperCase() }}</kbd>
        </button>
      </div>
      <div class="controls">
        <label class="fader">
          <span>Фильтр</span>
          <input v-model.number="filter" type="range" min="0" max="1" step="0.01" />
          <span class="fader-ends"><i>глухо</i><i>звонко</i></span>
        </label>
        <button class="ghost big" @click="audio.beatOn.value ? audio.stopBeat() : audio.startBeat()">
          {{ audio.beatOn.value ? 'Остановить бит' : 'Запустить бит' }}
        </button>
      </div>
    </section>

    <section class="lineup" aria-label="В программе">
      <p class="tonight">Сегодня в программе</p>
      <p class="act">Сведение треков</p>
      <p class="act">Крики в микрофон</p>
      <p class="act">Танцпол из ничего</p>
    </section>

    <section class="cta">
      <p class="ask">Нужно свести трек или устроить шум на празднике?</p>
      <div class="cta-row">
        <a class="loud" :href="TELEGRAM" target="_blank" rel="noopener">Написать DJ Снюфу</a>
        <a class="ghost big" :href="CHANNEL" target="_blank" rel="noopener">Слушать треки !захара</a>
      </div>
      <button class="back" @click="emit('exit')">Это всё ещё сайт Захара. Вернуться к папке</button>
    </section>
  </div>
</template>

<style scoped>
.world {
  --uv: #7b2cff;
  --hot: #ff3da8;
  --cy: #2bd4ff;
  --tox: #f5e50a;
  --kick: 0;
  position: fixed;
  inset: 0;
  z-index: 60;
  overflow-y: auto;
  overflow-x: clip;
  color: #f4f2ff;
  font-family: 'Tektur Variable', var(--text);
  background: #07050d;
  outline: none;
}

/* Строки развёртки и зерно поверх шейдера — экран, а не плоская заливка */
.scan {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    repeating-linear-gradient(rgb(0 0 0 / 0.18) 0 1px, transparent 1px 3px),
    var(--grain);
  mix-blend-mode: multiply;
}

.bar {
  position: sticky;
  top: 0;
  z-index: 3;
  background: linear-gradient(rgb(7 5 13 / 0.6), rgb(7 5 13 / 0));
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px clamp(16px, 4vw, 40px);
}
.presents {
  font-family: var(--hand);
  font-size: 1.05rem;
  color: var(--tox);
  transform: rotate(-3deg);
}
.bar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ghost {
  padding: 8px 14px;
  border: 1.5px solid rgb(244 242 255 / 0.55);
  border-radius: 999px;
  background: rgb(7 5 13 / 0.35);
  color: inherit;
  font: inherit;
  font-size: 0.85rem;
  text-decoration: none;
  backdrop-filter: blur(6px);
  cursor: pointer;
}
.ghost:hover {
  border-color: var(--tox);
  color: var(--tox);
}
.ghost.big {
  padding: 12px 20px;
  font-size: 0.95rem;
}

.hero {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  min-height: calc(100svh - 70px);
  padding: 0 16px 40px;
  text-align: center;
}
.title {
  margin: 0;
  font-family: var(--stampface);
  font-weight: 400;
  line-height: 0.82;
  font-size: clamp(5.5rem, 21vw, 19rem);
}
.row {
  display: block;
  white-space: nowrap;
}
/* Влёт буквы — на обёртке, прыжок в долю — на самой букве: одно свойство
   transform на двоих не делится, и анимация «зависла» бы поверх прыжков */
.slam {
  display: inline-block;
  animation: slam 0.7s cubic-bezier(0.2, 0.9, 0.2, 1.15) calc(var(--i) * 0.07s) both;
}
/* Хромированные буквы: металлический перелив в заливке, а цветные копии
   расходятся на ударе — как расслоение каналов на перегруженном экране.
   drop-shadow, а не text-shadow: тень текста просвечивает сквозь прозрачные
   буквы и красит их сплошным цветом, а drop-shadow ложится по уже залитой
   форме — при нулевом сдвиге её просто не видно. */
.ch {
  display: inline-block;
  background: linear-gradient(180deg, #ffffff 0%, #d9d9e8 34%, #6a6a82 49%, #2c2c3a 52%, #f0f0ff 60%, #a4a4c0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(calc(var(--kick) * 10px) 0 0 rgb(43 212 255 / 0.9))
    drop-shadow(calc(var(--kick) * -10px) 0 0 rgb(255 61 168 / 0.9)) drop-shadow(0 6px 14px rgb(0 0 0 / 0.45));
  transform: translateY(calc(var(--kick) * 14px * var(--dir))) scale(calc(1 + var(--kick) * 0.04));
}
@keyframes slam {
  from {
    opacity: 0;
    filter: blur(18px);
    transform: scale(3.2) rotate(calc(var(--dir) * 12deg));
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}
.sub {
  max-width: 30em;
  margin: 18px auto 0;
  font-size: clamp(1rem, 1.8vw, 1.25rem);
  line-height: 1.5;
  text-wrap: balance;
}

.ticker {
  position: relative;
  z-index: 1;
  overflow: hidden;
  padding: 12px 0;
  background: var(--tox);
  color: #07050d;
  font-family: var(--stampface);
  font-size: clamp(1.4rem, 3.4vw, 2.6rem);
  transform: rotate(-2.5deg) scale(1.04);
}
.ticker-track {
  display: flex;
  width: max-content;
  animation: run 14s linear infinite;
}
.ticker-track span {
  padding-right: 0.4em;
  white-space: nowrap;
}
@keyframes run {
  to {
    transform: translateX(-50%);
  }
}

.deck,
.lineup,
.cta {
  position: relative;
  z-index: 1;
  max-width: 980px;
  margin: 0 auto;
  padding: clamp(56px, 10vw, 110px) clamp(16px, 4vw, 40px) 0;
}
.h2 {
  margin: 0;
  font-family: var(--stampface);
  font-weight: 400;
  font-size: clamp(2.4rem, 6vw, 4.4rem);
  color: var(--tox);
}
.hint {
  margin: 6px 0 22px;
  opacity: 0.85;
}
.pads {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.pad {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px;
  border: 2px solid var(--c);
  border-radius: 14px;
  background: color-mix(in srgb, var(--c) 14%, rgb(7 5 13 / 0.55));
  color: #f4f2ff;
  font: inherit;
  font-size: clamp(1rem, 2vw, 1.3rem);
  font-weight: 600;
  backdrop-filter: blur(8px);
  cursor: pointer;
  touch-action: manipulation;
  transition:
    transform 0.08s ease,
    background 0.08s ease,
    box-shadow 0.08s ease;
}
.pad.kick {
  --c: var(--uv);
}
.pad.clap {
  --c: var(--hot);
}
.pad.hat {
  --c: var(--cy);
}
.pad.horn {
  --c: var(--tox);
}
.pad.lit,
.pad:active {
  transform: scale(0.95);
  background: var(--c);
  color: #07050d;
  box-shadow: 0 0 40px var(--c);
}
kbd {
  align-self: flex-end;
  padding: 2px 8px;
  border: 1.5px solid currentColor;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.8rem;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px 28px;
  margin-top: 22px;
}
.fader {
  display: grid;
  gap: 6px;
  min-width: min(360px, 100%);
}
.fader input {
  width: 100%;
  accent-color: var(--tox);
}
.fader-ends {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  opacity: 0.75;
}
.fader-ends i {
  font-style: normal;
}

.lineup {
  text-align: center;
}
.tonight {
  margin: 0 0 8px;
  font-family: var(--hand);
  font-size: 1.3rem;
  color: var(--tox);
  transform: rotate(-2deg);
}
.act {
  margin: 0;
  font-family: var(--stampface);
  font-size: clamp(2rem, 7.4vw, 5.6rem);
  line-height: 1.02;
  -webkit-text-stroke: 1.5px #f4f2ff;
  color: transparent;
}
.act:nth-child(3) {
  color: var(--hot);
  -webkit-text-stroke: 0;
}

.cta {
  padding-bottom: 90px;
  text-align: center;
}
.ask {
  max-width: 22em;
  margin: 0 auto 22px;
  font-size: clamp(1.2rem, 2.6vw, 1.7rem);
  text-wrap: balance;
}
.cta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
}
.loud {
  padding: 16px 28px;
  background: var(--tox);
  color: #07050d;
  font-family: var(--stampface);
  font-size: 1.25rem;
  text-decoration: none;
  transform: skewX(-8deg);
  box-shadow: 6px 6px 0 var(--hot);
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}
.loud:hover {
  transform: skewX(-8deg) translate(-2px, -2px);
  box-shadow: 9px 9px 0 var(--hot);
}
.back {
  margin-top: 46px;
  padding: 6px;
  border: 0;
  background: none;
  color: rgb(244 242 255 / 0.8);
  font-family: var(--hand);
  font-size: 1.05rem;
  text-decoration: underline;
  text-underline-offset: 4px;
  cursor: pointer;
}

@media (max-width: 700px) {
  .pads {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .presents {
    display: none;
  }
  .bar {
    justify-content: flex-end;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    animation: none;
  }
}
</style>
