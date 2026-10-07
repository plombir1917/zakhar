// Снимает фон стола из 3D-сцены вступления (IntroScene.vue, ?deskShot=1) в
// public/desk.jpg. Запускать при поднятом dev-сервере после правок сцены:
//   npm run dev  &&  node scripts/desk-shot.mjs [http://localhost:3000]
// Коэффициент k (во сколько раз кадр выше папки) печатается — он должен
// совпадать с --desk-k в Dossier.vue.
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const base = process.argv[2] || 'http://localhost:3000'
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const pg = await br.newPage({ viewport: { width: 1440, height: 900 } })
await pg.goto(base + '/?deskShot=1')
await pg.waitForFunction(() => window.__desk, null, { timeout: 120000 })
const { jpg, k } = await pg.evaluate(() => window.__desk)
writeFileSync(new URL('../public/desk.jpg', import.meta.url), Buffer.from(jpg.split(',')[1], 'base64'))
console.log('public/desk.jpg готов, k =', k.toFixed(4))
await br.close()
