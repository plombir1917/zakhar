<script setup lang="ts">
/**
 * Режим DJ Снюфа — тяжёлая вставка «со всей фигнёй». Красная бумажка
 * «НЕ ТРОГАТЬ» на столе включает ночной клуб: лампа гаснет, по столу ходят
 * прожекторы, папка качается в бит, бит играет сам.
 *
 * Бит синтезирован в браузере (бочка, хэт, бас), а не файлом: своих сведений
 * в деле пока нет, а тащить чужой трек — не наш случай. Когда хозяин принесёт
 * свой — заменить play() на воспроизведение файла.
 *
 * Свет пульсирует, но не мигает: по всему экрану не бывает резких вспышек
 * чаще трёх в секунду — это порог, опасный для людей с фоточувствительной
 * эпилепсией. При «уменьшить движение» прожекторы стоят, папка не качается.
 */
const on = defineModel<boolean>({ default: false })

const BPM = 124
const BEAT = 60 / BPM

const canvas = ref<HTMLCanvasElement | null>(null)
const muted = ref(false)
let ctx: AudioContext | null = null
let master: GainNode | null = null
let t0 = 0
let nextBeat = 0
let beatNo = 0
let raf = 0
let scheduler = 0
let calm = false

function kick(at: number) {
  const o = ctx!.createOscillator()
  const g = ctx!.createGain()
  o.frequency.setValueAtTime(150, at)
  o.frequency.exponentialRampToValueAtTime(42, at + 0.32)
  g.gain.setValueAtTime(1, at)
  g.gain.exponentialRampToValueAtTime(0.001, at + 0.4)
  o.connect(g).connect(master!)
  o.start(at)
  o.stop(at + 0.42)
}

let noise: AudioBuffer | null = null
function hat(at: number, open = false) {
  if (!noise) {
    noise = ctx!.createBuffer(1, ctx!.sampleRate * 0.3, ctx!.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const s = ctx!.createBufferSource()
  s.buffer = noise
  const f = ctx!.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 7000
  const g = ctx!.createGain()
  g.gain.setValueAtTime(open ? 0.22 : 0.14, at)
  g.gain.exponentialRampToValueAtTime(0.001, at + (open ? 0.22 : 0.05))
  s.connect(f).connect(g).connect(master!)
  s.start(at)
  s.stop(at + 0.3)
}

// Бас: короткие ноты пилой через фильтр, рисунок на два такта
const BASS = [55, 0, 55, 65.4, 0, 49, 55, 0]
function bass(at: number, n: number) {
  const hz = BASS[n % BASS.length]
  if (!hz) return
  const o = ctx!.createOscillator()
  o.type = 'sawtooth'
  o.frequency.value = hz
  const f = ctx!.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(900, at)
  f.frequency.exponentialRampToValueAtTime(160, at + BEAT / 2)
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(0.28, at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, at + BEAT / 2)
  o.connect(f).connect(g).connect(master!)
  o.start(at)
  o.stop(at + BEAT / 2 + 0.02)
}

// Планировщик смотрит на 120 мс вперёд: таймеры JS неточны, а звук
// ставится на часы AudioContext — так бит не плывёт.
function schedule() {
  while (nextBeat < ctx!.currentTime + 0.12) {
    kick(nextBeat)
    hat(nextBeat + BEAT / 2, beatNo % 4 === 3)
    bass(nextBeat + BEAT / 2, beatNo)
    nextBeat += BEAT
    beatNo++
  }
}

function startAudio() {
  ctx ??= new AudioContext()
  void ctx.resume()
  master = ctx.createGain()
  master.gain.value = muted.value ? 0 : 0.55
  master.connect(ctx.destination)
  t0 = ctx.currentTime + 0.05
  nextBeat = t0
  beatNo = 0
  schedule()
  scheduler = window.setInterval(schedule, 25)
}

function stopAudio() {
  clearInterval(scheduler)
  master?.disconnect()
  master = null
}

watch(muted, (m) => {
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.05)
})

// ── Свет ──────────────────────────────────────────────────────────────
const COLORS = ['123, 44, 255', '255, 61, 168', '43, 212, 255', '245, 213, 71']
const beams = Array.from({ length: 7 }, (_, i) => ({
  x: 0.08 + i * 0.14,
  speed: 0.35 + ((i * 37) % 10) / 22,
  phase: i * 1.7,
  color: COLORS[i % COLORS.length],
}))

function frame() {
  const c = canvas.value
  if (!c || !ctx) return
  const w = (c.width = c.clientWidth * devicePixelRatio)
  const h = (c.height = c.clientHeight * devicePixelRatio)
  const g = c.getContext('2d')!
  const t = ctx.currentTime - t0
  const phase = (((t % BEAT) + BEAT) % BEAT) / BEAT
  // Огибающая удара: вспыхивает на бочке и гаснет к следующей доле
  const pulse = calm ? 0.35 : Math.exp(-phase * 5)
  document.documentElement.style.setProperty('--kick', calm ? '0' : pulse.toFixed(3))

  g.clearRect(0, 0, w, h)
  g.globalCompositeOperation = 'lighter'
  for (const b of beams) {
    const ang = calm ? 0.25 * Math.sin(b.phase) : Math.sin(t * b.speed + b.phase) * 0.55
    const x = b.x * w
    const len = h * 1.25
    const spread = 0.13
    const grad = g.createLinearGradient(x, 0, x + Math.sin(ang) * len, len)
    const a = 0.1 + pulse * 0.16
    grad.addColorStop(0, `rgba(${b.color}, ${a + 0.12})`)
    grad.addColorStop(1, `rgba(${b.color}, 0)`)
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(x, -10)
    g.lineTo(x + Math.sin(ang - spread) * len, Math.cos(ang - spread) * len)
    g.lineTo(x + Math.sin(ang + spread) * len, Math.cos(ang + spread) * len)
    g.closePath()
    g.fill()
  }
  raf = requestAnimationFrame(frame)
}

watch(on, (v) => {
  document.documentElement.classList.toggle('snuff', v)
  if (v) {
    calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    startAudio()
    nextTick(() => (raf = requestAnimationFrame(frame)))
  } else {
    cancelAnimationFrame(raf)
    stopAudio()
    document.documentElement.style.removeProperty('--kick')
  }
})

onBeforeUnmount(() => {
  on.value = false
  cancelAnimationFrame(raf)
  stopAudio()
  void ctx?.close()
})
</script>

<template>
  <canvas v-show="on" ref="canvas" class="beams" aria-hidden="true" />
  <p v-if="on" class="loud" aria-hidden="true">СНЮФ</p>

  <div class="note-wrap">
    <button class="snuff-note" :class="{ on }" :aria-pressed="on" @click="on = !on">
      <span class="hand big">{{ on ? 'верни как было' : 'НЕ ТРОГАТЬ' }}</span>
      <span class="type small">DJ Снюф</span>
    </button>
    <button v-if="on" class="mute" :aria-pressed="muted" @click="muted = !muted">
      {{ muted ? 'включить звук' : 'выключить звук' }}
    </button>
  </div>
</template>

<style scoped>
.beams {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100svh;
  pointer-events: none;
  mix-blend-mode: screen;
  z-index: 0;
}

/* Надпись во весь стол позади папки — качается вместе с битом */
.loud {
  position: fixed;
  inset: 0;
  margin: 0;
  display: grid;
  place-items: center;
  font-family: var(--stampface);
  font-size: min(46vw, 64vh);
  letter-spacing: -0.02em;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 3px rgb(160 90 255 / 0.75);
  pointer-events: none;
  z-index: 0;
  transform: scale(calc(1 + var(--kick, 0) * 0.04)) rotate(-6deg);
}

/* Красная бумажка на краю стола */
.note-wrap {
  position: fixed;
  left: 28px;
  bottom: 26px;
  z-index: 8;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
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
.snuff-note.on {
  background: var(--grain), #7b2cff;
  transform: rotate(5deg);
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
.mute {
  padding: 4px 2px;
  border: 0;
  background: none;
  color: #e9e3ff;
  font-size: 0.85rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .note-wrap {
    left: auto;
    right: 12px;
    top: 12px;
    bottom: auto;
    align-items: flex-end;
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
/* Клуб: лампа гаснет, стол — ночь, папка качается в бит */
.snuff .desk {
  background:
    var(--grain),
    radial-gradient(ellipse 80% 70% at 50% 40%, #1a1030, transparent 70%),
    #08060f;
}
.snuff .lamp {
  opacity: 0;
}
.snuff .folder {
  z-index: 1;
  scale: calc(1 + var(--kick, 0) * 0.018);
  rotate: calc(var(--kick, 0) * 1.4deg - 0.7deg);
}
.snuff .sheet {
  box-shadow:
    0 0 0 1px rgb(123 44 255 / 0.4),
    0 0 calc(var(--kick, 0) * 40px) rgb(255 61 168 / 0.45);
}
.snuff .hint {
  display: none;
}
@media (max-width: 900px) {
  .desk.open .note-wrap {
    display: none;
  }
  /* Качать папку на телефоне нельзя: scale/rotate у предка ломают
     position: fixed нижней полосы закладок. Качаются листы. */
  .snuff .folder {
    /* именно none: даже scale: 1 делает папку «рамкой» для fixed-потомков */
    scale: none;
    rotate: none;
  }
  .snuff .sheets {
    scale: calc(1 + var(--kick, 0) * 0.015);
    rotate: calc(var(--kick, 0) * 1deg - 0.5deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .snuff .folder {
    scale: 1;
    rotate: 0deg;
  }
}
</style>
