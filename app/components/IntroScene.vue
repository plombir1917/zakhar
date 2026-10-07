<script setup lang="ts">
/**
 * Вступление: ночная комната, в которой каждый предмет рассказывает про
 * хозяина дела ещё до того, как открыта папка.
 *
 * На стене — пробковая доска «расследования»: карточки ролей (сцена, код,
 * рэп, ивенты, спорт) стянуты красной нитью к «!захару». Сквозь жалюзи луна
 * кладёт полосы на стену и стол. На столе — ноутбук с кодом, микрофон,
 * наушники, кружка с паром, кассета, книги; под столом гантель. Лампа мигает
 * и загорается, в её конусе плывёт пыль.
 *
 * Камера проходит вдоль доски, скользит над столом и опускается ровно над
 * папкой. Последний кадр подогнан под размер настоящей папки на странице —
 * сцена не обрывается, а перетекает в стол из разметки.
 *
 * three.js с постобработкой подгружается только здесь и только на клиенте.
 * Пропускается кликом, клавишей или касанием. Не играет при «уменьшить
 * движение», по ссылке на раздел и второй раз за сеанс.
 * ?introAt=секунды — заморозить сцену (скриншоты без видеокарты).
 */
const emit = defineEmits<{ done: [] }>()

const host = ref<HTMLDivElement | null>(null)
const fading = ref(false)
const waking = ref(false)
// стоп-кадр (?introAt) и съёмка стола — без век и расфокуса
const awake = ref(false)
let stop = () => {}
let finished = false

function finish() {
  if (finished) return
  finished = true
  fading.value = true
  try {
    sessionStorage.setItem('intro-seen', '1')
  } catch {}
  emit('done')
  setTimeout(() => stop(), 900)
}

// Тот же расчёт, что у папки в разметке (Dossier.vue, --pw/--ph): последний
// кадр обязан совпасть с ней по высоте, иначе стык заметен
function domFolderHeight() {
  const w = innerWidth
  const h = innerHeight
  if (w <= 900) return h - 92
  const pw = Math.min(560, w * 0.44, (h - 72) / 1.36)
  return pw * 1.36
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/** Холст под текстуру: рисуем и отдаём */
function paint(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  return c
}

function drawCover(g: CanvasRenderingContext2D) {
  // Повторяет обложку из разметки (Dossier.vue): на стыке вступления с сайтом
  // папка не должна сменить вид
  const W = 1024
  const H = 1393
  g.fillStyle = '#b8946a'
  g.fillRect(0, 0, W, H)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = 60 + Math.random() * 200
    const gr = g.createRadialGradient(x, y, 0, x, y, r)
    gr.addColorStop(0, `rgba(70,45,20,${Math.random() * 0.08})`)
    gr.addColorStop(1, 'rgba(70,45,20,0)')
    g.fillStyle = gr
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(60,40,20,${Math.random() * 0.07})`
    g.fillRect(Math.random() * W, Math.random() * H, 20 + Math.random() * 90, 1.4)
  }
  // рамка
  g.strokeStyle = 'rgba(27,27,27,.42)'
  g.lineWidth = 3
  g.strokeRect(W * 0.07, H * 0.05, W * 0.875, H * 0.9)
  g.lineWidth = 1.5
  g.strokeRect(W * 0.07 + 12, H * 0.05 + 12, W * 0.875 - 24, H * 0.9 - 24)
  const ink = 'rgba(27,27,27,.8)'
  const pen = '#2b45c6'
  const line = (x: number, y: number, w: number) => {
    g.fillStyle = 'rgba(27,27,27,.5)'
    g.fillRect(x, y, w, 2.4)
  }
  // учреждение
  line(110, 360, 560)
  g.fillStyle = pen
  g.font = '44px "Marck Script"'
  g.fillText('документация к жизни', 130, 345)
  g.fillStyle = 'rgba(27,27,27,.55)'
  g.font = '20px "PT Mono"'
  g.fillText('(наименование учреждения)', 330, 392)
  // ДЕЛО №
  g.fillStyle = ink
  g.font = '76px "PT Mono"'
  g.fillText('Д Е Л О  №', 110, 560)
  line(530, 572, 300)
  g.fillStyle = pen
  g.font = '60px "Marck Script"'
  g.fillText('200', 620, 552)
  // заголовок
  line(110, 760, 800)
  line(110, 900, 800)
  g.fillStyle = pen
  g.font = '48px "Marck Script"'
  g.fillText('Личное дело', 150, 745)
  g.font = '170px "Marck Script"'
  g.fillText('!захар', 150, 885)
  // графы
  g.fillStyle = ink
  g.font = '28px "PT Mono"'
  g.fillText('Начато', 110, 1035)
  g.fillText('Окончено', 560, 1030)
  g.fillText('На', 110, 1095)
  g.fillText('листах', 260, 1095)
  g.fillText('Хранить', 560, 1090)
  g.fillStyle = pen
  g.font = '40px "Marck Script"'
  g.fillText('давно', 250, 1032)
  g.fillText('7', 200, 1092)
  g.fillStyle = '#c8232c'
  g.fillText('ещё нет', 760, 1027)
  // круг от кружки — у левого края, как на обложке в разметке
  g.strokeStyle = 'rgba(105,58,22,.3)'
  g.lineWidth = 7
  g.beginPath()
  g.arc(40, 520, 120, 0, 6.3)
  g.stroke()
  // фото 3×4 в правом верхнем углу: белая карточка, силуэт, фотоуголки
  g.save()
  g.translate(800, 260)
  g.rotate(0.05)
  g.fillStyle = 'rgba(0,0,0,.25)'
  g.fillRect(-100, -132, 210, 274)
  // тоном темнее, чем в разметке: под лампой и свечением белое пересвечивается
  g.fillStyle = '#bdb9ae'
  g.fillRect(-105, -137, 210, 274)
  g.fillStyle = '#aaa69b'
  g.fillRect(-94, -126, 188, 252)
  g.strokeStyle = '#2a2a2e'
  g.lineWidth = 4
  g.beginPath()
  g.ellipse(0, -40, 36, 46, 0, 0, 6.3)
  g.stroke()
  g.beginPath()
  g.moveTo(-90, 126)
  g.quadraticCurveTo(-80, 30, 0, 26)
  g.quadraticCurveTo(80, 30, 90, 126)
  g.stroke()
  g.fillStyle = 'rgba(42,36,32,.85)'
  for (const [x, y, dx, dy] of [[-105, -137, 1, 1], [105, -137, -1, 1], [-105, 137, 1, -1], [105, 137, -1, -1]]) {
    g.beginPath()
    g.moveTo(x!, y!)
    g.lineTo(x! + dx! * 38, y!)
    g.lineTo(x!, y! + dy! * 38)
    g.fill()
  }
  g.restore()
  // штамп
  g.save()
  g.translate(680, 1240)
  g.rotate(-0.19)
  g.strokeStyle = 'rgba(200,35,44,.85)'
  g.lineWidth = 6
  g.strokeRect(-220, -60, 440, 120)
  g.strokeRect(-210, -50, 420, 100)
  g.fillStyle = 'rgba(200,35,44,.85)'
  g.font = '42px "Ruslan Display"'
  g.textAlign = 'center'
  g.fillText('ХРАНИТЬ ВЕЧНО', 0, 16)
  g.restore()
}

// Экран ноутбука: кусок кода в духе этого сайта, подсвеченный как в редакторе
const CODE: [string, string][] = [
  ['k', 'const '], ['v', 'state '], ['p', '= '], ['f', 'ref'], ['p', "('closed')"], ['n', ''],
  ['k', 'function '], ['f', 'open'], ['p', '() {'], ['n', ''],
  ['c', '  // обложка ложится на корешок'], ['n', ''],
  ['p', '  state.value = '], ['s', "'open'"], ['n', ''],
  ['p', '}'], ['n', ''], ['n', ''],
  ['k', 'export const '], ['v', 'BRAND '], ['p', '= '], ['s', "'!захар'"], ['n', ''],
  ['k', 'const '], ['v', 'height '], ['p', '= '], ['m', '200'], ['c', ' // см'], ['n', ''],
  ['n', ''], ['k', 'if '], ['p', '(!'], ['v', 'захар'], ['p', ') {'], ['n', ''],
  ['c', '  // такого не бывает'], ['n', ''], ['p', '}'],
]
function drawCode(g: CanvasRenderingContext2D) {
  g.fillStyle = '#0d1117'
  g.fillRect(0, 0, 1024, 640)
  g.fillStyle = '#161b22'
  g.fillRect(0, 0, 1024, 46)
  ;['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => {
    g.fillStyle = c
    g.beginPath()
    g.arc(30 + i * 28, 23, 8, 0, 6.3)
    g.fill()
  })
  const col: Record<string, string> = {
    k: '#ff7b72', v: '#ffa657', p: '#c9d1d9', f: '#d2a8ff', s: '#a5d6ff', c: '#8b949e', m: '#79c0ff',
  }
  g.font = '30px "PT Mono"'
  let x = 70
  let y = 100
  let line = 1
  g.fillStyle = '#484f58'
  g.fillText('1', 20, y)
  for (const [k, t] of CODE) {
    if (k === 'n') {
      y += 42
      x = 70
      line++
      g.fillStyle = '#484f58'
      g.fillText(String(line), 20, y)
      continue
    }
    g.fillStyle = col[k]!
    g.fillText(t, x, y)
    x += g.measureText(t).width
  }
}

function drawCork(g: CanvasRenderingContext2D) {
  g.fillStyle = '#9b6f45'
  g.fillRect(0, 0, 1024, 640)
  for (let i = 0; i < 9000; i++) {
    const l = rnd(-40, 40)
    g.fillStyle = `rgba(${120 + l},${85 + l},${50 + l * 0.5},.55)`
    g.fillRect(Math.random() * 1024, Math.random() * 640, rnd(1, 4), rnd(1, 4))
  }
}

function drawCard(text: string, color: string, hot: boolean) {
  return (g: CanvasRenderingContext2D) => {
    g.fillStyle = color
    g.fillRect(0, 0, 256, 192)
    for (let y = 46; y < 192; y += 26) {
      g.fillStyle = 'rgba(43,69,198,.18)'
      g.fillRect(0, y, 256, 2)
    }
    g.fillStyle = hot ? '#c8232c' : '#1b2a8a'
    g.font = `${text.length > 7 ? 42 : 52}px "Marck Script"`
    g.textAlign = 'center'
    g.fillText(text, 128, 118)
  }
}

onMounted(async () => {
  const q = new URLSearchParams(location.search)
  const frozenAt = Number(q.get('introAt')) || 0
  // ?deskShot=1 — снять фон стола для разметки (см. DESK_SHOT ниже); только для сборки
  const deskShot = q.has('deskShot')
  awake.value = !!frozenAt || deskShot
  const skip =
    !frozenAt &&
    !deskShot &&
    (matchMedia('(prefers-reduced-motion: reduce)').matches ||
      location.hash.length > 1 ||
      (() => {
        try {
          return sessionStorage.getItem('intro-seen') === '1'
        } catch {
          return false
        }
      })())
  if (skip) {
    finished = true
    fading.value = true
    emit('done')
    return
  }

  const [THREE, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, { ShaderPass }] =
    await Promise.all([
      import('three'),
      import('three/examples/jsm/postprocessing/EffectComposer.js'),
      import('three/examples/jsm/postprocessing/RenderPass.js'),
      import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
      import('three/examples/jsm/postprocessing/OutputPass.js'),
      import('three/examples/jsm/postprocessing/ShaderPass.js'),
    ])
  // Шрифты для текстур: в разработке CSS с @font-face подключается позже
  // монтирования, и load() отвечает пустотой — тогда обложка рисуется Times.
  // Ждём, пока шрифты действительно доступны, но не дольше трёх секунд.
  // Две ловушки. check() отвечает «да», когда шрифта в списке ещё нет вовсе.
  // А кириллица у этих шрифтов — отдельный файл (unicode-range), и load() без
  // образца текста грузит только латиницу: «200» рисовалось своим шрифтом,
  // а «!захар» — Times. Поэтому грузим с кириллическим образцом и считаем
  // готовым, только когда load() вернул загруженные начертания по каждому.
  const SAMPLE = 'Личное дело !захар документация ДЕЛО ХРАНИТЬ 200'
  const faces = ['120px "Marck Script"', '30px "PT Mono"', '42px "Ruslan Display"']
  for (let i = 0; i < 60; i++) {
    const got = await Promise.all(faces.map((f) => document.fonts.load(f, SAMPLE).catch(() => [])))
    if (got.every((list) => list.length > 0)) break
    await new Promise((r) => setTimeout(r, 50))
  }

  const el = host.value!
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setSize(innerWidth, innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  el.appendChild(renderer.domElement)

  const tex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = renderer.capabilities.getMaxAnisotropy()
    return t
  }
  const mat = (o: ConstructorParameters<typeof THREE.MeshStandardMaterial>[0]) => new THREE.MeshStandardMaterial(o)
  const shadowy = <T extends THREE.Object3D>(m: T): T => {
    m.traverse((o) => {
      o.castShadow = true
      o.receiveShadow = true
    })
    return m
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#050406')
  scene.fog = new THREE.FogExp2('#07060a', 0.16)
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 60)

  const DESK_Y = 0.75
  const WALL_Z = -1.35

  // ── Комната: пол, стена, окно ────────────────────────────────────────
  scene.add(new THREE.AmbientLight('#6f7ca0', 0.1))
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat({ color: '#17120e', roughness: 0.85 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), mat({ color: '#2a2c33', roughness: 0.95 }))
  wall.position.set(0, 3, WALL_Z)
  wall.receiveShadow = true
  scene.add(wall)
  // окно слева: рама и холодное стекло, на нём ламели жалюзи
  const frameMat = mat({ color: '#1b1d22', roughness: 0.6 })
  const win = new THREE.Group()
  win.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.3),
      new THREE.MeshBasicMaterial({ color: '#2a3f66', transparent: true, opacity: 0.55 }),
    ),
  )
  for (const [w, h, x, y] of [
    [1.2, 0.06, 0, 0.68],
    [1.2, 0.06, 0, -0.68],
    [0.06, 1.42, -0.58, 0],
    [0.06, 1.42, 0.58, 0],
    [0.04, 1.3, 0, 0],
  ] as const) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), frameMat)
    b.position.set(x, y, 0.02)
    win.add(b)
  }
  const slatMat = mat({ color: '#3b3f48', roughness: 0.5 })
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.012, 0.05), slatMat)
    s.position.set(0, 0.62 - i * 0.08, 0.06)
    s.rotation.x = 0.7
    win.add(s)
  }
  win.position.set(-1.75, 1.65, WALL_Z + 0.01)
  scene.add(win)

  // Луна сквозь жалюзи: прожектор с «печеньем» из полос рисует решётку света
  const blinds = tex(
    paint(512, 512, (g) => {
      g.fillStyle = '#000'
      g.fillRect(0, 0, 512, 512)
      g.fillStyle = '#fff'
      for (let y = 0; y < 512; y += 32) g.fillRect(40, y + 8, 432, 16)
      g.fillStyle = '#000'
      g.fillRect(250, 0, 12, 512)
    }),
  )
  const moon = new THREE.SpotLight('#8fa9e0', 14, 9, 0.42, 0.25, 1.1)
  moon.map = blinds
  moon.position.set(-3.6, 2.6, -0.2)
  moon.target.position.set(-0.4, 1.0, WALL_Z)
  moon.castShadow = true
  moon.shadow.mapSize.set(1024, 1024)
  scene.add(moon, moon.target)

  // ── Пробковая доска «расследования» ──────────────────────────────────
  const board = new THREE.Group()
  board.add(
    new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.94, 0.03), [
      frameMat,
      frameMat,
      frameMat,
      frameMat,
      mat({ map: tex(paint(1024, 640, drawCork)), roughness: 0.95 }),
      frameMat,
    ]),
  )
  const cards = [
    { text: '!захар', x: 0, y: 0.04, r: -0.03, color: '#f4f1e8', hot: true },
    { text: 'сцена', x: -0.52, y: 0.27, r: 0.08, color: '#f6d6e2', hot: false },
    { text: 'код', x: 0.5, y: 0.28, r: -0.07, color: '#d9e8f7', hot: false },
    { text: 'рэп', x: -0.5, y: -0.24, r: -0.05, color: '#e3dcf7', hot: false },
    { text: 'ивенты', x: 0.48, y: -0.25, r: 0.06, color: '#dbeed2', hot: false },
    { text: 'спорт', x: -0.02, y: -0.34, r: 0.04, color: '#f7e2c8', hot: false },
    { text: 'DJ Снюф?', x: 0.02, y: 0.36, r: -0.06, color: '#fff6a8', hot: true },
  ]
  const pins: THREE.Vector3[] = []
  const pinMat = mat({ color: '#c8232c', roughness: 0.3, metalness: 0.2 })
  for (const c of cards) {
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.18),
      mat({ map: tex(paint(256, 192, drawCard(c.text, c.color, c.hot))), roughness: 0.9 }),
    )
    card.position.set(c.x, c.y, 0.02)
    card.rotation.z = c.r
    board.add(card)
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), pinMat)
    pin.position.set(c.x, c.y + 0.07, 0.035)
    board.add(pin)
    pins.push(pin.position.clone())
  }
  // красная нить от каждой карточки к «!захару»
  const thread = mat({ color: '#b3161f', roughness: 0.6 })
  for (let i = 1; i < pins.length; i++) {
    const a = pins[0]!
    const b = pins[i]!
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, a.distanceTo(b), 6), thread)
    s.position.copy(a).add(b).multiplyScalar(0.5)
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    board.add(s)
  }
  board.position.set(0.05, 1.55, WALL_Z + 0.02)
  scene.add(shadowy(board))

  // ── Стол ─────────────────────────────────────────────────────────────
  const wood = mat({ color: '#5b4130', roughness: 0.5, metalness: 0.04 })
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.07, 1.5), wood)
  desk.position.set(0, DESK_Y - 0.035, -0.2)
  scene.add(shadowy(desk))
  for (const [x, z] of [
    [-1.2, -0.85],
    [1.2, -0.85],
    [-1.2, 0.45],
    [1.2, 0.45],
  ] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, DESK_Y - 0.07, 0.07), wood)
    leg.position.set(x, (DESK_Y - 0.07) / 2, z)
    scene.add(shadowy(leg))
  }

  // ── Папка ────────────────────────────────────────────────────────────
  const FW = 0.56
  const FH = FW * 1.36
  const kraft = mat({ color: '#9c7a52', roughness: 0.85 })
  const folder = new THREE.Mesh(new THREE.BoxGeometry(FW, 0.014, FH), [
    kraft,
    kraft,
    mat({ map: tex(paint(1024, 1393, drawCover)), roughness: 0.82 }),
    kraft,
    kraft,
    kraft,
  ])
  folder.position.set(0, DESK_Y + 0.007, 0)
  folder.rotation.y = (1.6 * Math.PI) / 180
  ;['#d9bb3c', '#d97fa0', '#7fb0e0', '#73aa60', '#a693d8', '#d98f50', '#d65e50'].forEach((col, i) => {
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.006, 0.032), mat({ color: col, roughness: 0.35 }))
    tab.position.set(FW / 2 + 0.03, 0.002, -FH / 2 + 0.06 + i * 0.04)
    folder.add(tab)
  })
  scene.add(shadowy(folder))

  // ── Ноутбук с кодом ──────────────────────────────────────────────────
  const alu = mat({ color: '#3a3d44', roughness: 0.35, metalness: 0.8 })
  const laptop = new THREE.Group()
  const lapBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.016, 0.25), alu)
  lapBase.position.y = 0.008
  laptop.add(lapBase)
  const hinge = new THREE.Group()
  hinge.position.set(0, 0.016, -0.125)
  hinge.rotation.x = -1.85
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.01, 0.24), alu)
  lid.position.set(0, 0, 0.12)
  hinge.add(lid)
  const screenTex = tex(paint(1024, 640, drawCode))
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.33, 0.21),
    new THREE.MeshStandardMaterial({ map: screenTex, emissive: '#ffffff', emissiveMap: screenTex, emissiveIntensity: 0.9 }),
  )
  screen.rotation.x = Math.PI / 2
  screen.position.set(0, -0.0055, 0.12)
  hinge.add(screen)
  laptop.add(hinge)
  laptop.position.set(-0.78, DESK_Y, -0.45)
  laptop.rotation.y = 0.5
  scene.add(shadowy(laptop))
  const screenGlow = new THREE.PointLight('#6f9cff', 0.9, 1.4, 2)
  screenGlow.position.set(-0.7, DESK_Y + 0.18, -0.35)
  scene.add(screenGlow)

  // ── Микрофон, наушники, кружка, книги, кассета, ручка, бумажка ──────
  const black = mat({ color: '#141416', roughness: 0.4, metalness: 0.3 })
  const mic = new THREE.Group()
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.18, 20), black)
  handle.rotation.z = Math.PI / 2
  mic.add(handle)
  const grille = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), mat({ color: '#9aa0a8', roughness: 0.35, metalness: 0.9 }))
  grille.position.x = 0.11
  mic.add(grille)
  mic.position.set(0.48, DESK_Y + 0.03, 0.32)
  mic.rotation.y = -0.7
  scene.add(shadowy(mic))

  const phones = new THREE.Group()
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.01, 10, 32, Math.PI), black)
  band.rotation.x = -Math.PI / 2
  phones.add(band)
  for (const s of [-1, 1]) {
    const earCup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 24), black)
    earCup.position.set(s * 0.09, 0.02, 0)
    phones.add(earCup)
  }
  phones.position.set(-0.45, DESK_Y + 0.012, 0.36)
  phones.rotation.y = 0.4
  scene.add(shadowy(phones))

  const ceramic = mat({ color: '#d9d4c7', roughness: 0.35 })
  const mug = new THREE.Group()
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.04, 0.1, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: '#d9d4c7', roughness: 0.35, side: THREE.DoubleSide }),
  )
  cup.position.y = 0.05
  mug.add(cup)
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.043, 24), mat({ color: '#2b1a10', roughness: 0.15 }))
  coffee.rotation.x = -Math.PI / 2
  coffee.position.y = 0.085
  mug.add(coffee)
  const ear = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.007, 8, 16), ceramic)
  ear.position.set(0.05, 0.05, 0)
  mug.add(ear)
  mug.position.set(0.68, DESK_Y, -0.22)
  scene.add(shadowy(mug))

  const books = new THREE.Group()
  ;(
    [
      ['#6b2430', 0.3, 0.05],
      ['#1f3a5c', 0.28, 0.04],
      ['#3d4a2a', 0.31, 0.045],
    ] as const
  ).forEach(([c, w, h], i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.21), mat({ color: c, roughness: 0.7 }))
    b.position.set(rnd(-0.01, 0.01), 0.025 + i * 0.047, 0)
    b.rotation.y = rnd(-0.12, 0.12)
    books.add(b)
  })
  books.position.set(-1.0, DESK_Y, 0.05)
  books.rotation.y = -0.3
  scene.add(shadowy(books))

  const cassette = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.064), mat({ color: '#2a2730', roughness: 0.5 }))
  cassette.position.set(-0.28, DESK_Y + 0.006, 0.47)
  cassette.rotation.y = 0.35
  scene.add(shadowy(cassette))
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.15, 12), mat({ color: '#2b45c6', roughness: 0.3, metalness: 0.2 }))
  pen.rotation.set(Math.PI / 2, 0, 0.9)
  pen.position.set(0.4, DESK_Y + 0.006, 0.12)
  scene.add(shadowy(pen))
  const note = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.002, 0.09), mat({ color: '#e23a3a', roughness: 0.7 }))
  note.position.set(-0.55, DESK_Y + 0.001, 0.08)
  note.rotation.y = 0.12
  scene.add(shadowy(note))

  // гантель под столом — спорт «для себя»
  const dumbbell = new THREE.Group()
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 12), alu)
  bar.rotation.z = Math.PI / 2
  dumbbell.add(bar)
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 24), black)
    plate.rotation.z = Math.PI / 2
    plate.position.x = s * 0.12
    dumbbell.add(plate)
  }
  dumbbell.position.set(0.7, 0.07, 0.75)
  dumbbell.rotation.y = 0.6
  scene.add(shadowy(dumbbell))

  // ── Лампа ────────────────────────────────────────────────────────────
  const lampMetal = mat({ color: '#1f2a24', roughness: 0.35, metalness: 0.7 })
  const lamp = new THREE.Group()
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 32), lampMetal)
  base.position.y = 0.015
  lamp.add(base)
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 12), lampMetal)
  arm1.position.set(0, 0.22, 0.04)
  arm1.rotation.x = 0.25
  lamp.add(arm1)
  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 12), lampMetal)
  arm2.position.set(0, 0.44, 0.2)
  arm2.rotation.x = -1.15
  lamp.add(arm2)
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.13, 0.17, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: '#24382c', roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide }),
  )
  shade.position.set(0, 0.5, 0.36)
  shade.rotation.x = 0.55
  lamp.add(shade)
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#ffe2a8', emissive: '#ffcf80', emissiveIntensity: 0 })
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), bulbMat)
  bulb.position.set(0, 0.47, 0.38)
  lamp.add(bulb)
  lamp.position.set(0.82, DESK_Y, -0.72)
  lamp.rotation.y = -0.72
  scene.add(shadowy(lamp))
  scene.updateMatrixWorld(true)

  const bulbWorld = new THREE.Vector3()
  bulb.getWorldPosition(bulbWorld)
  const target = new THREE.Vector3(0, DESK_Y, 0.05)
  const spot = new THREE.SpotLight('#ffcf8f', 0, 2.2, 0.66, 0.7, 1.5)
  spot.position.copy(bulbWorld)
  spot.target.position.copy(target)
  spot.castShadow = true
  spot.shadow.mapSize.set(2048, 2048)
  spot.shadow.bias = -0.0004
  spot.shadow.radius = 5
  scene.add(spot, spot.target)
  const glow = new THREE.PointLight('#ffbf70', 0, 1.3, 2)
  glow.position.copy(bulbWorld)
  scene.add(glow)

  // ── Пыль в луче и пар над кружкой ───────────────────────────────────
  const N = 600
  const pos = new Float32Array(N * 3)
  const seed = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const t = Math.random()
    const r = Math.random() * (0.03 + t * 0.4)
    const a = Math.random() * Math.PI * 2
    const pnt = bulbWorld.clone().lerp(target, t)
    pos[i * 3] = pnt.x + Math.cos(a) * r
    pos[i * 3 + 1] = pnt.y + rnd(-0.05, 0.05)
    pos[i * 3 + 2] = pnt.z + Math.sin(a) * r
    seed[i] = Math.random() * 100
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const base0 = pos.slice()
  const dustMat = new THREE.PointsMaterial({
    color: '#ffe0b0',
    size: 0.005,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  scene.add(new THREE.Points(dustGeo, dustMat))

  const puff = tex(
    paint(64, 64, (g) => {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      gr.addColorStop(0, 'rgba(255,255,255,.55)')
      gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr
      g.fillRect(0, 0, 64, 64)
    }),
  )
  const steam = Array.from({ length: 18 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, transparent: true, depthWrite: false, opacity: 0 }))
    s.userData.off = i / 18
    scene.add(s)
    return s
  })
  const mugTop = new THREE.Vector3(0.68, DESK_Y + 0.09, -0.22)

  // ── Постобработка: свечение, виньетка, зерно, лёгкое расслоение ──────
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.45, 0.6, 0.9))
  composer.addPass(new OutputPass())
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uTime, uVig; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 61.7) * 43758.5453); }
      void main(){
        vec2 d = vUv - 0.5;
        float ca = dot(d, d) * 0.012 * uVig;
        vec3 c = vec3(texture2D(tDiffuse, vUv + d * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * ca).b);
        c *= mix(1.0, smoothstep(0.95, 0.2, length(d * vec2(1.1, 1.0))), 0.75 * uVig);
        c += (h(vUv * 900.0) - 0.5) * 0.045 * (0.4 + 0.6 * uVig);
        gl_FragColor = vec4(c, 1.0);
      }`,
  })
  composer.addPass(grade)

  // ── Путь камеры ──────────────────────────────────────────────────────
  const fovRad = (camera.fov * Math.PI) / 180
  let finalH = (FH * innerHeight) / (domFolderHeight() * 2 * Math.tan(fovRad / 2))
  const narrow = innerWidth <= 900
  const finalZ = narrow
    ? ((innerHeight / 2 - (10 + domFolderHeight() / 2)) / innerHeight) * 2 * finalH * Math.tan(fovRad / 2)
    : 0
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
  // камера: из темноты вдоль доски, вправо над кружкой, низко над столом, вверх над папкой
  const camPath = new THREE.CatmullRomCurve3([
    V(-1.25, 1.5, 2.7),
    V(-0.55, 1.42, 1.25),
    V(0.55, 1.22, 0.85),
    V(0.42, 1.0, 0.42),
    V(0.12, DESK_Y + finalH * 0.72, 0.16),
    V(0, DESK_Y + finalH, finalZ + 0.0001),
  ])
  // взгляд: доска → «!захар» → ноутбук → стол → папка
  const lookPath = new THREE.CatmullRomCurve3([
    V(-0.25, 1.45, WALL_Z),
    V(0.05, 1.5, WALL_Z),
    V(-0.45, 0.95, -0.4),
    V(0.05, DESK_Y, -0.05),
    V(0, DESK_Y, finalZ),
    V(0, DESK_Y, finalZ),
  ])
  const upFrom = V(0, 1, 0)
  const upTo = V(0, 0, -1)
  const look = new THREE.Vector3()

  // Сначала глаза открываются (≈3.4 с, см. .lids), потом загорается лампа и
  // камера начинает движение
  /**
   * Фон стола для разметки — кадр этой же сцены сверху, без папки и красной
   * бумажки (они в разметке настоящие). Снят с той же высоты, что последний
   * кадр вступления, но шире объективом: тогда последний кадр — просто центр
   * фона, и на стыке ничего не прыгает, даже высокие лампа и кружка.
   * Снимается при сборке: npm run desk-shot → public/desk.jpg.
   */
  function shootDesk() {
    folder.visible = false
    note.visible = false
    spot.intensity = 6
    glow.intensity = 0.5
    bulbMat.emissiveIntensity = 7
    dustMat.opacity = 0
    const W = 2400
    const H = 1500
    renderer.setPixelRatio(1)
    renderer.setSize(W, H)
    composer.setSize(W, H)
    composer.removePass(grade)
    // высота последнего кадра для типичного экрана 1440×900 с папкой 770 px
    const h = (FH * 900) / (770 * 2 * Math.tan(fovRad / 2))
    const halfH = 1.0
    camera.fov = (2 * Math.atan(halfH / h) * 180) / Math.PI
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    camera.position.set(0, DESK_Y + h, 0.0001)
    camera.up.set(0, 0, -1)
    camera.lookAt(0, DESK_Y, 0)
    composer.render()
    ;(window as unknown as Record<string, unknown>).__desk = {
      jpg: renderer.domElement.toDataURL('image/jpeg', 0.86),
      // во сколько раз кадр выше папки — для background-size в разметке
      k: (2 * halfH) / FH,
    }
  }

  const T_LAMP = 3.1
  const T_MOVE = 3.4
  const T_END = 9.5
  // Лампа со старым контактом: включилась, погасла, снова
  const flicker = [0, 1, 0.08, 0.85, 0.15, 0.95, 0.4, 1, 1]
  const lampAt = (t: number) => {
    if (t < T_LAMP) return 0
    const k = (t - T_LAMP) / 0.9
    if (k >= 1) return 1
    return flicker[Math.floor(k * (flicker.length - 1))]!
  }

  if (deskShot) return shootDesk()

  const clock = new THREE.Clock()
  let raf = 0
  let first = true
  function frame() {
    const t = frozenAt || clock.getElapsedTime()
    const l = lampAt(t)
    spot.intensity = l * 6
    glow.intensity = l * 0.5
    bulbMat.emissiveIntensity = l * 7
    dustMat.opacity = l * 0.6
    screenGlow.intensity = 0.9 + Math.sin(t * 7) * 0.04

    const p = dustGeo.attributes.position!.array as Float32Array
    for (let i = 0; i < N; i++) {
      const s = seed[i]!
      p[i * 3] = base0[i * 3]! + Math.sin(t * 0.3 + s) * 0.02
      p[i * 3 + 1] = base0[i * 3 + 1]! + Math.sin(t * 0.2 + s * 1.3) * 0.015
      p[i * 3 + 2] = base0[i * 3 + 2]! + Math.cos(t * 0.25 + s) * 0.02
    }
    dustGeo.attributes.position!.needsUpdate = true

    for (const s of steam) {
      const k = (t * 0.25 + s.userData.off) % 1
      s.position.set(mugTop.x + Math.sin(k * 9 + s.userData.off * 20) * 0.02 * k, mugTop.y + k * 0.28, mugTop.z)
      s.scale.setScalar(0.04 + k * 0.12)
      s.material.opacity = Math.sin(k * Math.PI) * 0.22
    }

    const m = ease(clamp01((t - T_MOVE) / (T_END - T_MOVE)))
    camera.position.copy(camPath.getPoint(m))
    const breath = (1 - m) * 0.01
    camera.position.x += Math.sin(t * 1.3) * breath
    camera.position.y += Math.sin(t * 1.7) * breath
    look.copy(lookPath.getPoint(m))
    camera.up.lerpVectors(upFrom, upTo, ease(clamp01((m - 0.7) / 0.3))).normalize()
    camera.lookAt(look)
    // к последнему кадру виньетка и зерно уходят — на странице их нет, стык был бы виден
    grade.uniforms.uVig!.value = 1 - ease(clamp01((m - 0.8) / 0.2))
    grade.uniforms.uTime!.value = t

    composer.render()
    // Веки начинают открываться, когда под ними уже есть комната: импорт
    // three.js и шрифтов занимает время, и глаза не должны открыться в пустоту
    if (first) {
      first = false
      if (!frozenAt) waking.value = true
    }
    if (t >= T_END && !finished && !frozenAt) finish()
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  const onResize = () => {
    renderer.setSize(innerWidth, innerHeight)
    composer.setSize(innerWidth, innerHeight)
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    finalH = (FH * innerHeight) / (domFolderHeight() * 2 * Math.tan(fovRad / 2))
  }
  addEventListener('resize', onResize)
  const onSkip = () => finish()
  addEventListener('keydown', onSkip)

  stop = () => {
    cancelAnimationFrame(raf)
    removeEventListener('resize', onResize)
    removeEventListener('keydown', onSkip)
    composer.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
})

onBeforeUnmount(() => stop())
</script>

<template>
  <div class="intro" :class="{ fading, waking, awake }" @pointerdown="finish">
    <div ref="host" class="host" aria-hidden="true" />
    <!-- Веки: комната появляется, будто медленно открываешь глаза -->
    <div class="lid top" aria-hidden="true" />
    <div class="lid bottom" aria-hidden="true" />
    <button class="skip" type="button" @click.stop="finish">пропустить</button>
  </div>
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: #050406;
  transition: opacity 0.85s ease;
  cursor: pointer;
}
.intro.fading {
  opacity: 0;
  pointer-events: none;
}
.host :deep(canvas) {
  display: block;
}

/* ── Пробуждение ─────────────────────────────────────────────────────────
   Два века с размытым краем. Сначала темно, потом щёлочка, моргание,
   приоткрылись шире, ещё моргание, открылись. Взгляд при этом фокусируется:
   картинка под веками сначала мутная и тёмная. Моргание быстрое (≈0.15 с) —
   медленное читается как засыпание, а не пробуждение. */
.lid {
  position: absolute;
  left: -15%;
  width: 130%;
  height: 56%;
  background: #000;
  box-shadow: 0 0 60px 50px #000;
  pointer-events: none;
}
.lid.top {
  top: 0;
  border-radius: 0 0 50% 50% / 0 0 34% 34%;
}
.lid.bottom {
  bottom: 0;
  border-radius: 50% 50% 0 0 / 34% 34% 0 0;
}
.waking .lid.top {
  animation: lid-top 3.4s linear forwards;
}
.waking .lid.bottom {
  animation: lid-bottom 3.4s linear forwards;
}
.host {
  filter: blur(14px) brightness(0.5);
}
.waking .host {
  animation: focus 3.6s ease-out forwards;
}
.awake .lid {
  display: none;
}
.awake .host {
  filter: none;
  animation: none;
}
@keyframes lid-top {
  0%, 22% { transform: translateY(0); }
  42% { transform: translateY(-30%); }
  46% { transform: translateY(0); }
  52% { transform: translateY(-38%); }
  66% { transform: translateY(-58%); }
  70% { transform: translateY(0); }
  76% { transform: translateY(-62%); }
  100% { transform: translateY(-130%); }
}
@keyframes lid-bottom {
  0%, 22% { transform: translateY(0); }
  42% { transform: translateY(30%); }
  46% { transform: translateY(0); }
  52% { transform: translateY(38%); }
  66% { transform: translateY(58%); }
  70% { transform: translateY(0); }
  76% { transform: translateY(62%); }
  100% { transform: translateY(130%); }
}
@keyframes focus {
  0%, 30% { filter: blur(14px) brightness(0.5); }
  70% { filter: blur(5px) brightness(0.8); }
  100% { filter: blur(0) brightness(1); }
}
.skip {
  position: absolute;
  right: 22px;
  bottom: 18px;
  padding: 6px 4px;
  border: 0;
  background: none;
  color: rgb(233 234 230 / 0.55);
  font-family: var(--hand);
  font-size: 1rem;
  text-decoration: underline;
  text-underline-offset: 4px;
  cursor: pointer;
}
.skip:hover {
  color: var(--paper);
}
</style>
