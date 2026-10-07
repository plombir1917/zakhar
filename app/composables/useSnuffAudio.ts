/**
 * Звук мира DJ Снюфа — всё синтезировано в браузере, файлов нет: своих
 * сведений хозяин дела ещё не принёс, а чужой трек — не наш случай. Когда
 * принесёт, бит заменяется воспроизведением файла через тот же bus.
 *
 * Схема одна на весь режим: источники → bus → фильтр → master → выход.
 * Фильтр крутит посетитель на пульте; master глушит кнопка звука и «выключение
 * телевизора» при выходе.
 *
 * Картинка двигается от kick(): огибающая последнего удара бочки — и бита, и
 * пэда. Поэтому прыгающие буквы и шейдер всегда в долю, даже если человек
 * лупит по пэдам невпопад.
 */
const BPM = 126
export const BEAT = 60 / BPM

let ctx: AudioContext | null = null
let bus: GainNode
let filter: BiquadFilterNode
let master: GainNode
let noiseBuf: AudioBuffer
let scheduler = 0
let nextBeat = 0
let beatNo = 0
const kicks: number[] = []
const muted = ref(false)
const beatOn = ref(false)

function graph() {
  if (ctx) return ctx
  ctx = new AudioContext()
  bus = ctx.createGain()
  filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 18000
  filter.Q.value = 0.9
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 4
  master = ctx.createGain()
  master.gain.value = muted.value ? 0 : 0.8
  bus.connect(filter).connect(comp).connect(master).connect(ctx.destination)
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return ctx
}

function noise(at: number, dur: number, f: BiquadFilterNode, peak: number, out: AudioNode = bus) {
  const s = ctx!.createBufferSource()
  s.buffer = noiseBuf
  const g = ctx!.createGain()
  g.gain.setValueAtTime(peak, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  s.connect(f).connect(g).connect(out)
  s.start(at, Math.random())
  s.stop(at + dur + 0.05)
}

function kick(at: number, big = false) {
  const o = ctx!.createOscillator()
  const g = ctx!.createGain()
  o.frequency.setValueAtTime(big ? 180 : 150, at)
  o.frequency.exponentialRampToValueAtTime(40, at + (big ? 0.6 : 0.32))
  g.gain.setValueAtTime(big ? 1.4 : 1, at)
  g.gain.exponentialRampToValueAtTime(0.001, at + (big ? 0.9 : 0.42))
  o.connect(g).connect(bus)
  o.start(at)
  o.stop(at + 1)
  kicks.push(at)
  if (kicks.length > 32) kicks.shift()
}

function hat(at: number, open = false) {
  const f = ctx!.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 7500
  noise(at, open ? 0.24 : 0.05, f, open ? 0.25 : 0.16)
}

function clap(at: number) {
  for (const d of [0, 0.012, 0.024]) {
    const f = ctx!.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 1500
    f.Q.value = 0.8
    noise(at + d, 0.14, f, 0.55)
  }
}

// Горн: три расстроенные пилы с провалом высоты — тот самый рейвовый «ту-ту-ту»
function horn(at: number) {
  for (const [i, hz] of [440, 554, 659].entries()) {
    const o = ctx!.createOscillator()
    o.type = 'sawtooth'
    o.detune.value = (i - 1) * 9
    const g = ctx!.createGain()
    for (let k = 0; k < 3; k++) {
      const t = at + k * 0.16
      o.frequency.setValueAtTime(hz, t)
      o.frequency.linearRampToValueAtTime(hz * 0.94, t + 0.13)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
    }
    o.connect(g).connect(bus)
    o.start(at)
    o.stop(at + 0.5)
  }
}

const BASS = [55, 0, 55, 65.41, 0, 49, 55, 73.42]
function bass(at: number, n: number) {
  const hz = BASS[n % BASS.length]
  if (!hz) return
  const o = ctx!.createOscillator()
  o.type = 'sawtooth'
  o.frequency.value = hz
  const f = ctx!.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(1100, at)
  f.frequency.exponentialRampToValueAtTime(150, at + BEAT / 2)
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(0.3, at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, at + BEAT / 2)
  o.connect(f).connect(g).connect(bus)
  o.start(at)
  o.stop(at + BEAT / 2 + 0.02)
}

// Планировщик смотрит на 120 мс вперёд: таймеры JS неточны, а звук ставится
// на часы AudioContext — бит не плывёт, даже если вкладка тормозит
function schedule() {
  while (nextBeat < ctx!.currentTime + 0.12) {
    kick(nextBeat)
    hat(nextBeat + BEAT / 2, beatNo % 4 === 3)
    bass(nextBeat + BEAT / 2, beatNo)
    if (beatNo % 4 === 2) clap(nextBeat)
    nextBeat += BEAT
    beatNo++
  }
}

export function useSnuffAudio() {
  function startBeat(at?: number) {
    graph()
    stopBeat()
    nextBeat = at ?? ctx!.currentTime + 0.05
    beatNo = 0
    schedule()
    scheduler = window.setInterval(schedule, 25)
    beatOn.value = true
  }

  function stopBeat() {
    clearInterval(scheduler)
    beatOn.value = false
  }

  /** Нарастание перед дропом: шум с ползущим фильтром и воющий тон вверх */
  function riser(dur: number) {
    graph()
    void ctx!.resume()
    const at = ctx!.currentTime + 0.02
    const f = ctx!.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 3
    f.frequency.setValueAtTime(250, at)
    f.frequency.exponentialRampToValueAtTime(7000, at + dur)
    const s = ctx!.createBufferSource()
    s.buffer = noiseBuf
    s.loop = true
    const g = ctx!.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(0.5, at + dur)
    s.connect(f).connect(g).connect(bus)
    s.start(at)
    s.stop(at + dur)
    const o = ctx!.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(90, at)
    o.frequency.exponentialRampToValueAtTime(900, at + dur)
    const og = ctx!.createGain()
    og.gain.setValueAtTime(0.0001, at)
    og.gain.exponentialRampToValueAtTime(0.06, at + dur)
    o.connect(og).connect(bus)
    o.start(at)
    o.stop(at + dur)
    return at + dur
  }

  /** Дроп: большая бочка, тарелка и сразу бит */
  function drop(at: number) {
    kick(at, true)
    const f = ctx!.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 3000
    noise(at, 1.6, f, 0.5)
    startBeat(at + BEAT)
  }

  function pad(name: 'kick' | 'clap' | 'hat' | 'horn') {
    graph()
    void ctx!.resume()
    const at = ctx!.currentTime + 0.005
    if (name === 'kick') kick(at)
    else if (name === 'clap') clap(at)
    else if (name === 'hat') hat(at, true)
    else horn(at)
  }

  /** 0 — глухо (300 Гц), 1 — открыто (18 кГц); по логарифму, как слышит ухо */
  function setFilter(v: number) {
    if (!ctx) return
    const hz = 300 * Math.pow(18000 / 300, v)
    filter.frequency.setTargetAtTime(hz, ctx.currentTime, 0.03)
  }

  /** «Выключение телевизора»: звук проваливается и гаснет */
  function powerOff(dur: number) {
    if (!ctx) return
    const now = ctx.currentTime
    filter.frequency.cancelScheduledValues(now)
    filter.frequency.setValueAtTime(filter.frequency.value, now)
    filter.frequency.exponentialRampToValueAtTime(120, now + dur)
    master.gain.setTargetAtTime(0, now, dur / 3)
    setTimeout(() => {
      stopBeat()
      filter.frequency.value = 18000
      master.gain.value = muted.value ? 0 : 0.8
    }, dur * 1000 + 60)
  }

  /** Огибающая последнего удара: 1 в момент бочки, к следующей доле — 0 */
  function kickEnv(): number {
    if (!ctx) return 0
    const now = ctx.currentTime
    let last = -1
    for (const k of kicks) if (k <= now && k > last) last = k
    if (last < 0) return 0
    return Math.exp(-(now - last) * 7)
  }

  function setMuted(m: boolean) {
    muted.value = m
    if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.04)
  }

  return { startBeat, stopBeat, riser, drop, pad, setFilter, powerOff, kickEnv, setMuted, muted, beatOn }
}
