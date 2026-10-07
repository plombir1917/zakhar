<script setup lang="ts">
/**
 * Вступление: тёмная комната, стол, настольная лампа. Лампа мигает и
 * загорается, в её луче плывёт пыль, камера заходит сбоку мимо лампы и
 * опускается над папкой. Последний кадр снят ровно сверху и подогнан под
 * размер настоящей папки на странице — поэтому сцена не обрывается, а
 * перетекает в стол из разметки.
 *
 * three.js подгружается только здесь и только на клиенте: это вступление, а не
 * сайт, и ждать его основному содержимому незачем.
 *
 * Пропускается кликом, клавишей или касанием. Не играет при «уменьшить
 * движение», по ссылке на раздел (#kod) и второй раз за сеанс.
 */
const emit = defineEmits<{ done: [] }>()

const host = ref<HTMLDivElement | null>(null)
const fading = ref(false)
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

async function drawCover(): Promise<HTMLCanvasElement> {
  // Шрифты обложки должны успеть загрузиться, иначе холст нарисует системными
  await Promise.all([
    document.fonts.load('700 120px "Shantell Sans Variable"'),
    document.fonts.load('60px "PT Mono"'),
    document.fonts.load('60px "Ruslan Display"'),
  ]).catch(() => {})
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 1393
  const g = c.getContext('2d')!
  g.fillStyle = '#b8946a'
  g.fillRect(0, 0, c.width, c.height)
  // волокна картона
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(60,40,20,${Math.random() * 0.07})`
    g.fillRect(Math.random() * c.width, Math.random() * c.height, 20 + Math.random() * 90, 1.4)
  }
  g.fillStyle = 'rgba(27,27,27,.82)'
  g.font = '64px "PT Mono"'
  g.fillText('Л И Ч Н О Е   Д Е Л О', 110, 330)
  g.font = '44px "PT Mono"'
  g.fillText('№', 110, 520)
  g.fillRect(170, 530, 190, 3)
  g.fillStyle = '#2b45c6'
  g.font = '700 74px "Shantell Sans Variable"'
  g.fillText('200', 200, 515)
  g.fillStyle = 'rgba(27,27,27,.82)'
  g.font = '30px "PT Mono"'
  g.fillText('Фамилия, имя', 110, 660)
  g.fillRect(110, 820, 800, 3)
  g.fillStyle = '#2b45c6'
  g.font = '700 150px "Shantell Sans Variable"'
  g.fillText('!захар', 150, 790)
  // штамп
  g.save()
  g.translate(650, 1180)
  g.rotate(-0.19)
  g.strokeStyle = 'rgba(200,35,44,.85)'
  g.lineWidth = 6
  g.strokeRect(-220, -60, 440, 120)
  g.strokeRect(-210, -50, 420, 100)
  g.fillStyle = 'rgba(200,35,44,.85)'
  g.font = '42px "Ruslan Display"'
  g.textAlign = 'center'
  g.fillText('ХРАНИТЬ ВЕЧНО', 0, 18)
  g.restore()
  return c
}

onMounted(async () => {
  // ?introAt=2.5 — заморозить сцену на этой секунде (для скриншотов и отладки:
  // без видеокарты кадр рисуется секундами, и «живое» время проскакивает)
  const frozenAt = Number(new URLSearchParams(location.search).get('introAt')) || 0
  const skip =
    !frozenAt &&
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    location.hash.length > 1 ||
    (() => {
      try {
        return sessionStorage.getItem('intro-seen') === '1'
      } catch {
        return false
      }
    })()
  if (skip) {
    finished = true
    fading.value = true
    emit('done')
    return
  }

  const THREE = await import('three')
  const el = host.value!
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setSize(innerWidth, innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#060504')
  scene.fog = new THREE.FogExp2('#060504', 0.22)

  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 50)

  // ── Свет: лунный холод из окна и тёплая лампа ──────────────────────────
  scene.add(new THREE.AmbientLight('#8a96b0', 0.14))
  const moon = new THREE.DirectionalLight('#7f96c8', 0.7)
  moon.position.set(-3, 2.5, 1.5)
  scene.add(moon)

  const DESK_Y = 0.75
  const wood = new THREE.MeshStandardMaterial({ color: '#5b4130', roughness: 0.55, metalness: 0.05 })
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.07, 1.5), wood)
  desk.position.set(0, DESK_Y - 0.035, 0)
  desk.receiveShadow = true
  scene.add(desk)
  for (const [x, z] of [[-1.2, -0.65], [1.2, -0.65], [-1.2, 0.65], [1.2, 0.65]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, DESK_Y - 0.07, 0.07), wood)
    leg.position.set(x!, (DESK_Y - 0.07) / 2, z!)
    scene.add(leg)
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: '#15110d', roughness: 0.9 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // ── Папка ─────────────────────────────────────────────────────────────
  const FW = 0.56
  const FH = FW * 1.36
  const coverTex = new THREE.CanvasTexture(await drawCover())
  coverTex.colorSpace = THREE.SRGBColorSpace
  coverTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
  const kraft = new THREE.MeshStandardMaterial({ color: '#9c7a52', roughness: 0.85 })
  const folder = new THREE.Mesh(new THREE.BoxGeometry(FW, 0.014, FH), [
    kraft, kraft, new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.82 }), kraft, kraft, kraft,
  ])
  folder.position.set(0, DESK_Y + 0.007, 0)
  folder.rotation.y = (1.6 * Math.PI) / 180
  folder.castShadow = true
  folder.receiveShadow = true
  scene.add(folder)
  // закладки торчат из-под обложки
  const tabColors = ['#f5d547', '#f28db2', '#8ec5ff', '#7fbf6a', '#b9a3f0', '#f3a25c', '#ef6a5b']
  tabColors.forEach((col, i) => {
    const tab = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.006, 0.032),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 }),
    )
    tab.position.set(FW / 2 + 0.03, 0.002, -FH / 2 + 0.06 + i * 0.04)
    folder.add(tab)
  })

  // ── Предметы на столе: ручка, бумажка Снюфа, листы ────────────────────
  const pen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.15, 12),
    new THREE.MeshStandardMaterial({ color: '#2b45c6', roughness: 0.3, metalness: 0.2 }),
  )
  pen.rotation.set(Math.PI / 2, 0, 0.9)
  pen.position.set(0.45, DESK_Y + 0.006, 0.28)
  pen.castShadow = true
  scene.add(pen)
  const note = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.002, 0.09),
    new THREE.MeshStandardMaterial({ color: '#e23a3a', roughness: 0.7 }),
  )
  note.position.set(-0.62, DESK_Y + 0.001, 0.42)
  note.rotation.y = 0.12
  scene.add(note)
  const sheets = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.006, 0.58),
    new THREE.MeshStandardMaterial({ color: '#e9eae6', roughness: 0.9 }),
  )
  sheets.position.set(-0.78, DESK_Y + 0.003, -0.22)
  sheets.rotation.y = -0.25
  sheets.receiveShadow = true
  scene.add(sheets)

  // ── Лампа ─────────────────────────────────────────────────────────────
  const metal = new THREE.MeshStandardMaterial({ color: '#1f2a24', roughness: 0.35, metalness: 0.7 })
  const lamp = new THREE.Group()
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 32), metal)
  base.position.y = 0.015
  lamp.add(base)
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 12), metal)
  arm1.position.set(0, 0.22, 0.04)
  arm1.rotation.x = 0.25
  lamp.add(arm1)
  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 12), metal)
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
  // Лампа стоит за верхним правым краем последнего кадра: в нём она уже не
  // нужна — от неё остаётся пятно света, как у лампы-градиента в разметке
  lamp.position.set(0.82, DESK_Y, -0.72)
  lamp.rotation.y = -0.72
  lamp.traverse((o) => ((o as THREE.Mesh).castShadow = true))
  scene.add(lamp)

  const bulbWorld = new THREE.Vector3()
  bulb.getWorldPosition(bulbWorld)
  const spot = new THREE.SpotLight('#ffcf8f', 0, 1.9, 0.66, 0.7, 1.6)
  spot.position.copy(bulbWorld)
  spot.target.position.set(0, DESK_Y, 0.05)
  spot.castShadow = true
  spot.shadow.mapSize.set(2048, 2048)
  spot.shadow.bias = -0.0004
  spot.shadow.radius = 4
  scene.add(spot, spot.target)
  const glow = new THREE.PointLight('#ffbf70', 0, 1.2, 2)
  glow.position.copy(bulbWorld)
  scene.add(glow)

  // ── Пыль в луче ──────────────────────────────────────────────────────
  const N = 520
  const pos = new Float32Array(N * 3)
  const seed = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const t = Math.random()
    const r = Math.random() * 0.12 + t * 0.35
    const a = Math.random() * Math.PI * 2
    pos[i * 3] = bulbWorld.x + (0 - bulbWorld.x) * t + Math.cos(a) * r
    pos[i * 3 + 1] = bulbWorld.y + (DESK_Y + 0.05 - bulbWorld.y) * t
    pos[i * 3 + 2] = bulbWorld.z + (0.05 - bulbWorld.z) * t + Math.sin(a) * r
    seed[i] = Math.random() * 100
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const base0 = pos.slice()
  const dustMat = new THREE.PointsMaterial({
    color: '#ffe0b0',
    size: 0.006,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  scene.add(new THREE.Points(dustGeo, dustMat))

  // ── Путь камеры ──────────────────────────────────────────────────────
  const fovRad = (camera.fov * Math.PI) / 180
  let finalH = (FH * innerHeight) / (domFolderHeight() * 2 * Math.tan(fovRad / 2))
  const narrow = innerWidth <= 900
  // На телефоне папка в разметке прижата к верху — сдвигаем последний кадр так же
  const finalZ = narrow ? ((innerHeight / 2 - (10 + domFolderHeight() / 2)) / innerHeight) * 2 * finalH * Math.tan(fovRad / 2) : 0
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.2, 1.25, 3.4),
    new THREE.Vector3(0.95, 1.05, 1.7),
    new THREE.Vector3(0.6, 1.25, 0.75),
    new THREE.Vector3(0.12, DESK_Y + finalH * 0.7, 0.18),
    new THREE.Vector3(0, DESK_Y + finalH, finalZ + 0.0001),
  ])
  const lookFrom = new THREE.Vector3(0.3, 0.9, -0.1)
  const lookTo = new THREE.Vector3(0, DESK_Y, finalZ)
  const look = new THREE.Vector3()
  const upFrom = new THREE.Vector3(0, 1, 0)
  const upTo = new THREE.Vector3(0, 0, -1)

  const T_LAMP = 0.55
  const T_MOVE = 1.15
  const T_END = 4.9
  // Мигание лампы: включилась, погасла, снова — как старая лампа с плохим контактом
  const flicker = [0, 1, 0.08, 0.85, 0.15, 1, 1]
  const lampAt = (t: number) => {
    if (t < T_LAMP) return 0
    const k = (t - T_LAMP) / 0.75
    if (k >= 1) return 1
    return flicker[Math.floor(k * (flicker.length - 1))]!
  }

  const clock = new THREE.Clock()
  let raf = 0
  function frame() {
    const t = frozenAt || clock.getElapsedTime()
    const l = lampAt(t)
    spot.intensity = l * 9
    glow.intensity = l * 0.8
    bulbMat.emissiveIntensity = l * 6
    dustMat.opacity = l * 0.55

    // пыль медленно плывёт и кружится
    const p = dustGeo.attributes.position!.array as Float32Array
    for (let i = 0; i < N; i++) {
      const s = seed[i]!
      p[i * 3] = base0[i * 3]! + Math.sin(t * 0.3 + s) * 0.02
      p[i * 3 + 1] = base0[i * 3 + 1]! + Math.sin(t * 0.2 + s * 1.3) * 0.015
      p[i * 3 + 2] = base0[i * 3 + 2]! + Math.cos(t * 0.25 + s) * 0.02
    }
    dustGeo.attributes.position!.needsUpdate = true

    const m = ease(clamp01((t - T_MOVE) / (T_END - T_MOVE)))
    camera.position.copy(path.getPoint(m))
    // лёгкое «дыхание» ручной камеры, затухает к последнему кадру
    const breath = (1 - m) * 0.012
    camera.position.x += Math.sin(t * 1.3) * breath
    camera.position.y += Math.sin(t * 1.7) * breath
    look.lerpVectors(lookFrom, lookTo, ease(clamp01((m - 0.15) / 0.85)))
    camera.up.lerpVectors(upFrom, upTo, ease(clamp01((m - 0.55) / 0.45))).normalize()
    camera.lookAt(look)

    renderer.render(scene, camera)
    if (t >= T_END && !finished && !frozenAt) finish()
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  const onResize = () => {
    renderer.setSize(innerWidth, innerHeight)
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
    renderer.dispose()
    renderer.domElement.remove()
    coverTex.dispose()
  }
})

onBeforeUnmount(() => stop())
</script>

<template>
  <div class="intro" :class="{ fading }" @pointerdown="finish">
    <div ref="host" class="host" aria-hidden="true" />
    <button class="skip" type="button" @click.stop="finish">пропустить</button>
  </div>
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: #060504;
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
