<script setup lang="ts">
/**
 * Режим DJ Снюфа: переход из «личного дела» в совсем другой мир.
 *
 * Сценарий — одна поставленная сцена, в которую не надо вмешиваться:
 *   1. darken (2.2 с) — экран медленно темнеет, стол расплывается и выцветает,
 *      растёт нарастающий шум, в темноте проступает «ну я же просил…»;
 *   2. tunnel (2.4 с) — затягивает в неоновый туннель, отсчёт 3-2-1;
 *   3. drop — одна вспышка, удар, ударная волна — и открывается мир Снюфа;
 *   4. leaving — выход как у старого телевизора: картинка схлопывается в
 *      полоску, потом в точку, звук проваливается.
 *
 * Вспышка ровно одна и короткая: частые вспышки опасны для людей с
 * фоточувствительной эпилепсией. При «уменьшить движение» туннеля и вспышки
 * нет — тихое затемнение и сразу мир.
 */
const on = defineModel<boolean>({ default: false })

type Phase = 'idle' | 'darken' | 'tunnel' | 'world' | 'leaving'
const phase = ref<Phase>('idle')
const tunnelProg = ref(0)
const count = ref(0)
const flash = ref(false)
const audio = useSnuffAudio()

const DARKEN = 2.2
const TUNNEL = 2.4
let timers: number[] = []
let raf = 0
const later = (s: number, fn: () => void) => timers.push(window.setTimeout(fn, s * 1000))
const clearAll = () => {
  timers.forEach(clearTimeout)
  timers = []
  cancelAnimationFrame(raf)
}

function enter() {
  clearAll()
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
  document.documentElement.classList.add('snuff-darken')
  phase.value = 'darken'
  if (calm) {
    later(0.5, () => {
      phase.value = 'world'
      audio.startBeat()
    })
    return
  }
  const dropAt = audio.riser(DARKEN + TUNNEL)
  later(DARKEN, () => {
    phase.value = 'tunnel'
    const t0 = performance.now()
    const step = () => {
      tunnelProg.value = Math.min(1, (performance.now() - t0) / (TUNNEL * 1000))
      if (tunnelProg.value < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    ;[3, 2, 1].forEach((n, i) => later(i * (TUNNEL / 3), () => (count.value = n)))
  })
  later(DARKEN + TUNNEL, () => {
    count.value = 0
    audio.drop(dropAt)
    flash.value = true
    phase.value = 'world'
    later(0.6, () => (flash.value = false))
  })
}

function leave() {
  clearAll()
  if (phase.value === 'idle') return
  phase.value = 'leaving'
  audio.powerOff(0.6)
  later(0.75, () => {
    phase.value = 'idle'
    document.documentElement.classList.remove('snuff-darken')
  })
}

watch(on, (v) => (v ? enter() : leave()))
onBeforeUnmount(() => {
  clearAll()
  audio.stopBeat()
  document.documentElement.classList.remove('snuff-darken')
})
</script>

<template>
  <!-- Бумажка на краю стола — вход в мир Снюфа -->
  <div v-if="phase === 'idle'" class="note-wrap">
    <button class="snuff-note" @click="on = true">
      <span class="hand big">НЕ ТРОГАТЬ</span>
      <span class="type small">DJ Снюф</span>
    </button>
  </div>

  <Teleport to="body">
    <div v-if="phase !== 'idle'" class="snuff-stage" :class="'is-' + phase">
      <!-- 1. Темнота -->
      <div class="dim" aria-hidden="true" />
      <p v-if="phase === 'darken'" class="warn hand">ну я же просил не трогать…</p>

      <!-- 2. Туннель и отсчёт -->
      <template v-if="phase === 'tunnel'">
        <SnuffShader mode="tunnel" :progress="tunnelProg" />
        <Transition name="count">
          <p v-if="count" :key="count" class="count" aria-hidden="true">{{ count }}</p>
        </Transition>
      </template>

      <!-- 3. Мир -->
      <div v-if="phase === 'world' || phase === 'leaving'" class="tv">
        <SnuffWorld @exit="on = false" />
      </div>
      <div v-if="flash" class="flash" aria-hidden="true">
        <span class="wave" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Бумажка ─────────────────────────────────────────────────────────── */
.note-wrap {
  position: fixed;
  left: 28px;
  bottom: 26px;
  z-index: 8;
}
.snuff-note {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 14px 18px 12px;
  border: 0;
  background: var(--grain), #e23a3a;
  color: #fff6ee;
  box-shadow:
    0 1px 1px rgb(0 0 0 / 0.3),
    0 10px 18px -8px rgb(0 0 0 / 0.6);
  transform: rotate(-7deg);
  cursor: pointer;
  transition: transform 0.15s ease;
}
.snuff-note:hover {
  transform: rotate(-4deg) translateY(-3px);
}
.big {
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.05;
}
.small {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  opacity: 0.85;
}

/* ── Сцена перехода ──────────────────────────────────────────────────── */
.snuff-stage {
  position: fixed;
  inset: 0;
  z-index: 55;
}
.dim {
  position: absolute;
  inset: 0;
  background: #000;
  opacity: 0;
  animation: dim 2.2s cubic-bezier(0.55, 0, 0.6, 1) forwards;
}
@keyframes dim {
  to {
    opacity: 1;
  }
}
.is-leaving .dim {
  opacity: 1;
  animation: undim 0.6s ease 0.15s forwards;
}
@keyframes undim {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
.warn {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  color: #e23a3a;
  font-size: clamp(1.4rem, 3vw, 2.2rem);
  opacity: 0;
  animation: warn 1.4s ease 0.8s forwards;
}
@keyframes warn {
  from {
    opacity: 0;
    transform: rotate(-3deg) scale(0.96);
  }
  to {
    opacity: 1;
    transform: rotate(-3deg) scale(1);
  }
}

.count {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-family: var(--stampface);
  font-size: min(42vw, 60vh);
  color: rgb(255 255 255 / 0.12);
  -webkit-text-stroke: 4px #fff;
  text-shadow:
    0 0 40px rgb(123 44 255 / 0.9),
    0 0 80px rgb(255 61 168 / 0.6);
  pointer-events: none;
}
.count-enter-active {
  animation: count-in 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) both;
}
.count-leave-active {
  display: none;
}
@keyframes count-in {
  from {
    transform: scale(2.6);
    opacity: 0;
    filter: blur(14px);
  }
  25% {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
  75% {
    opacity: 1;
    transform: scale(0.9);
  }
  to {
    transform: scale(0.7);
    opacity: 0;
  }
}

/* Вспышка дропа: одна, короткая; по ней расходится ударная волна */
.flash {
  position: absolute;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  background: #fff;
  pointer-events: none;
  animation: flash 0.55s ease-out forwards;
}
@keyframes flash {
  to {
    background: rgb(255 255 255 / 0);
  }
}
.wave {
  width: 20vmax;
  height: 20vmax;
  border-radius: 50%;
  border: 6vmax solid rgb(123 44 255 / 0.85);
  animation: wave 0.55s cubic-bezier(0.1, 0.7, 0.3, 1) forwards;
}
@keyframes wave {
  to {
    transform: scale(7);
    border-width: 0.3vmax;
    opacity: 0;
  }
}

/* Обёртка мира — на весь экран: её transform (выключение телевизора) делает
   её «рамкой» для fixed-потомков, и мир должен совпадать с ней */
.tv {
  position: fixed;
  inset: 0;
  z-index: 60;
}
/* Выход: старый телевизор — сначала в полоску, потом в точку */
.is-leaving .tv {
  animation: tv-off 0.6s cubic-bezier(0.7, 0, 0.9, 0.4) forwards;
}
@keyframes tv-off {
  0% {
    transform: scale(1, 1);
    filter: brightness(1);
  }
  55% {
    transform: scale(1, 0.004);
    filter: brightness(3);
  }
  100% {
    transform: scale(0, 0.004);
    filter: brightness(5);
  }
}

@media (max-width: 900px) {
  .note-wrap {
    left: auto;
    right: 12px;
    top: 12px;
    bottom: auto;
  }
  .snuff-note {
    padding: 8px 12px 7px;
  }
  .big {
    font-size: 0.95rem;
  }
}
</style>

<style>
/* Пока темнеет, стол уходит в расфокус и выцветает — как будто теряешь сознание */
.desk {
  transition:
    filter 0.6s ease,
    transform 0.6s ease;
}
.snuff-darken .desk {
  filter: blur(7px) saturate(0.2) brightness(0.7);
  transform: scale(0.97);
  transition:
    filter 2.2s ease,
    transform 2.2s ease;
}
@media (max-width: 900px) {
  .desk.open .note-wrap {
    display: none;
  }
}
</style>
