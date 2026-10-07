/**
 * Звуки стола: удар литеры машинки, пробел, звонок каретки, шелест
 * перелистываемого листа. Всё синтезировано — шум через фильтры, без файлов.
 *
 * Звук включается только после первого действия человека (открыл папку) —
 * так требуют браузеры, и так честнее: сайт не заговаривает первым.
 * Выключатель — на столе, выбор помнится в localStorage.
 */
let ctx: AudioContext | null = null
let out: GainNode
let noise: AudioBuffer
const enabled = ref(true)
let loaded = false

function load() {
  if (loaded || !import.meta.client) return
  loaded = true
  try {
    enabled.value = localStorage.getItem('desk-sound') !== 'off'
  } catch {}
}

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    out = ctx.createGain()
    out.gain.value = 0.5
    out.connect(ctx.destination)
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  void ctx.resume()
  return ctx
}

function burst(at: number, dur: number, type: BiquadFilterType, hz: number, q: number, peak: number) {
  const c = ctx!
  const s = c.createBufferSource()
  s.buffer = noise
  const f = c.createBiquadFilter()
  f.type = type
  f.frequency.value = hz
  f.Q.value = q
  const g = c.createGain()
  g.gain.setValueAtTime(peak, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  s.connect(f).connect(g).connect(out)
  s.start(at, Math.random() * 0.5)
  s.stop(at + dur + 0.02)
}

export function useDeskSounds() {
  load()

  /** Удар литеры: щелчок рычага и глухой стук по валику */
  function key(kind: 'char' | 'space' = 'char') {
    if (!enabled.value) return
    const c = audio()
    const at = c.currentTime + 0.001
    const v = 0.7 + Math.random() * 0.5
    if (kind === 'space') {
      burst(at, 0.05, 'lowpass', 900, 0.8, 0.35 * v)
      return
    }
    burst(at, 0.018, 'highpass', 3200 + Math.random() * 1500, 0.7, 0.55 * v)
    burst(at + 0.004, 0.06, 'bandpass', 420 + Math.random() * 120, 1.2, 0.5 * v)
  }

  /** Звонок каретки в конце строки и её перевод */
  function ding() {
    if (!enabled.value) return
    const c = audio()
    const at = c.currentTime + 0.01
    for (const [hz, gain] of [
      [2093, 0.16],
      [4186, 0.05],
    ] as const) {
      const o = c.createOscillator()
      o.frequency.value = hz
      const g = c.createGain()
      g.gain.setValueAtTime(gain, at)
      g.gain.exponentialRampToValueAtTime(0.0001, at + 1.2)
      o.connect(g).connect(out)
      o.start(at)
      o.stop(at + 1.25)
    }
    burst(at + 0.15, 0.35, 'bandpass', 700, 0.6, 0.25)
  }

  /** Шелест листа: шум, который «проезжает» по частотам */
  function flip() {
    if (!enabled.value) return
    const c = audio()
    const at = c.currentTime + 0.01
    const s = c.createBufferSource()
    s.buffer = noise
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 0.9
    f.frequency.setValueAtTime(900, at)
    f.frequency.exponentialRampToValueAtTime(3800, at + 0.35)
    f.frequency.exponentialRampToValueAtTime(1200, at + 0.75)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(0.22, at + 0.12)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.8)
    s.connect(f).connect(g).connect(out)
    s.start(at)
    s.stop(at + 0.85)
    // лист ложится — мягкий шлепок
    burst(at + 0.82, 0.08, 'lowpass', 500, 0.7, 0.28)
  }

  /** Штамп: глухой удар резины о бумагу */
  function stamp() {
    if (!enabled.value) return
    const c = audio()
    burst(c.currentTime + 0.005, 0.12, 'lowpass', 260, 1, 0.9)
  }

  function toggle() {
    enabled.value = !enabled.value
    try {
      localStorage.setItem('desk-sound', enabled.value ? 'on' : 'off')
    } catch {}
  }

  /** Разбудить звук на действии человека — потом им можно пользоваться откуда угодно */
  function unlock() {
    if (enabled.value) audio()
  }

  return { key, ding, flip, stamp, toggle, unlock, enabled }
}
