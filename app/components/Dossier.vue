<script setup lang="ts">
import { SECTIONS, type Section, type SectionId } from '~/data/dossier'
import PageAnketa from '~/components/pages/PageAnketa.vue'
import PageScena from '~/components/pages/PageScena.vue'
import PageKod from '~/components/pages/PageKod.vue'
import PageIventy from '~/components/pages/PageIventy.vue'
import PageMuzyka from '~/components/pages/PageMuzyka.vue'
import PageLichnoe from '~/components/pages/PageLichnoe.vue'
import PageSvyaz from '~/components/pages/PageSvyaz.vue'

/**
 * Папка на столе. Три состояния: закрыта, открывается, открыта.
 *
 * Открытие — единственное поставленное движение на сайте: обложка
 * переворачивается на корешке, и её изнанка становится левой страницей
 * разворота. Всё остальное движется только в ответ на действия человека.
 *
 * Листание — настоящий лист: он поднимается с правой страницы, переворачивается
 * на корешке и ложится влево, а на его обороте уже фото нового раздела. Пока
 * лист в воздухе, под ним справа лежит новая страница, слева — прежняя; назад
 * — наоборот. Поэтому состояний три: выбранная закладка (current), что видно
 * справа (rightId) и что видно слева (leftId).
 *
 * Раздел живёт в адресе (#scena), чтобы ссылку на «Сцену» можно было
 * отправить другу; открытая по такой ссылке папка пропускает анимацию —
 * человек пришёл за содержимым, а не за обложкой.
 */
const pages: Record<SectionId, Component> = {
  anketa: PageAnketa,
  scena: PageScena,
  kod: PageKod,
  iventy: PageIventy,
  muzyka: PageMuzyka,
  lichnoe: PageLichnoe,
  svyaz: PageSvyaz,
}

const state = ref<'closed' | 'open'>('closed')
const instant = ref(false)
const revealed = ref(false)
const current = ref<SectionId>('anketa')
const rightId = ref<SectionId>('anketa')
const leftId = ref<SectionId>('anketa')
const flip = ref<null | { dir: 'forward' | 'back'; front: SectionId; back: SectionId }>(null)
const visited = reactive(new Set<SectionId>())
const sounds = useDeskSounds()
const FLIP_MS = 1050
let flipTimer = 0
const snuff = ref(false)
// Вступление (3D-сцена) накрывает стол, пока не доиграет; потом снимается
const introOn = ref(true)
const introDone = ref(false)
function afterIntro() {
  introDone.value = true
  setTimeout(() => (introOn.value = false), 900)
}

const index = (id: SectionId) => SECTIONS.findIndex((s) => s.id === id)
const sec = (id: SectionId): Section => SECTIONS[index(id)]!

function open(opts: { instant?: boolean } = {}) {
  if (state.value === 'open') return
  instant.value = !!opts.instant
  sounds.unlock()
  state.value = 'open'
  // Содержимое проявляется, когда обложка почти легла: печатать анкету под
  // летящим картоном — значит показать её никому.
  setTimeout(() => (revealed.value = true), opts.instant ? 0 : 950)
}

// Лист ещё в воздухе, а уже нажали следующую закладку — кладём его сразу
function settle() {
  clearTimeout(flipTimer)
  rightId.value = current.value
  leftId.value = current.value
  flip.value = null
}

function go(id: SectionId) {
  if (id === current.value) return
  settle()
  const from = current.value
  const dir = index(id) > index(from) ? 'forward' : 'back'
  visited.add(from)
  current.value = id
  if (import.meta.client) history.replaceState(null, '', '#' + id)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return settle()
  sounds.flip()
  if (dir === 'forward') {
    // вперёд: лист с прежней страницей уходит влево, на обороте — новое фото
    rightId.value = id
    flip.value = { dir, front: from, back: id }
  } else {
    // назад: лист с новым фото слева возвращается вправо и ложится новой страницей
    leftId.value = id
    flip.value = { dir, front: id, back: from }
  }
  flipTimer = window.setTimeout(settle, FLIP_MS)
}

const fresh = computed(() => !visited.has(rightId.value))

onMounted(() => {
  const id = location.hash.slice(1) as SectionId
  if (SECTIONS.some((s) => s.id === id)) {
    current.value = id
    rightId.value = id
    leftId.value = id
    open({ instant: true })
  }
})

// Стрелки по закладкам — как у настоящего списка вкладок
function onTabKey(e: KeyboardEvent) {
  const i = index(current.value)
  let next = i
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % SECTIONS.length
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + SECTIONS.length) % SECTIONS.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = SECTIONS.length - 1
  else return
  e.preventDefault()
  go(SECTIONS[next]!.id)
  nextTick(() => document.getElementById('tab-' + SECTIONS[next]!.id)?.focus())
}
</script>

<template>
  <main class="desk" :class="[state, { instant, snuff, revealed }]">
    <SvgDefs />
    <IntroScene v-if="introOn" @done="afterIntro" />
    <div class="lamp" aria-hidden="true" />
    <div class="vignette" aria-hidden="true" />
    <SnuffMode v-model="snuff" />

    <p v-if="state === 'closed' && introDone" class="hint" aria-hidden="true">
      <PenNote color="ink" :tilt="-4" size="1.35rem">открой — не укусит</PenNote>
      <Scribble kind="arrow" class="hint-arrow" color="var(--paper)" :delay="0.6" />
    </p>

    <div class="folder">
      <!-- Задняя доска папки: на ней подшиты листы -->
      <section class="board" :aria-hidden="state === 'closed'">
        <div class="fastener" aria-hidden="true" />
        <div class="stack" aria-hidden="true">
          <span /><span /><span />
        </div>

        <div class="sheets">
          <article
            :key="rightId"
            class="sheet"
            role="tabpanel"
            :id="'panel-' + rightId"
            :aria-labelledby="'tab-' + rightId"
            tabindex="-1"
          >
            <!-- на телефоне левой страницы нет — фото раздела стоит наверху листа -->
            <div class="narrow-only strip-photo">
              <Sketch :kind="sec(rightId).sketch" :photo="sec(rightId).photo" :caption="sec(rightId).caption" />
            </div>
            <component :is="pages[rightId]" v-if="revealed" :fresh="fresh" @go="go" />
            <p class="sheet-no type" aria-hidden="true">лист {{ index(rightId) + 1 }}</p>
          </article>
          <!-- тень от поднятого листа бежит по странице под ним -->
          <span v-if="flip" class="under-shade" :class="flip.dir" aria-hidden="true" />

        </div>

        <nav class="tabs" role="tablist" aria-label="Разделы дела" aria-orientation="vertical" @keydown="onTabKey">
          <button
            v-for="(s, i) in SECTIONS"
            :id="'tab-' + s.id"
            :key="s.id"
            class="tab"
            role="tab"
            :aria-selected="current === s.id"
            :aria-controls="'panel-' + s.id"
            :tabindex="current === s.id ? 0 : -1"
            :style="{ '--tab': s.color, '--i': i }"
            @click="go(s.id)"
          >
            <span>{{ s.tab }}</span>
          </button>
        </nav>
        <!-- На телефоне красной бумажке на столе места нет — она становится
             последней закладкой в нижней полосе -->
        <button class="tab snuff-tab" :aria-pressed="snuff" @click="snuff = !snuff">
          <span>{{ snuff ? 'вернуть' : 'не трогать' }}</span>
        </button>
      </section>

      <!-- Переворачиваемый лист — над обложкой: внутри доски его закрывала бы
           левая страница, как только он уходит влево -->
      <div v-if="flip" :key="flip.front + flip.back" class="leaf" :class="flip.dir" aria-hidden="true" inert>
        <div class="leaf-face front sheet">
          <component :is="pages[flip.front]" :fresh="false" />
          <span class="shade" />
        </div>
        <div class="leaf-face back left-sheet">
          <LeftPage :section="sec(flip.back)" :current="flip.back" />
          <span class="shade" />
        </div>
      </div>
      <!-- Свет лампы поверх папки: тёплое пятно справа сверху, к краям темнее -->
      <div class="lamplight" aria-hidden="true" />

      <!-- Обложка: снаружи — «Личное дело», изнутри — фото и опись -->
      <div class="cover">
        <button class="face outside" :tabindex="state === 'open' ? -1 : 0" :aria-hidden="state === 'open'" @click="open()">
          <span class="sr-only">Открыть личное дело</span>
          <!-- Картон отдельным слоем: у него загнут уголок (clip-path), а тесёмки
               и штамп выходят за край — их обрезать нельзя -->
          <span class="skin" aria-hidden="true">
            <span class="frame" />
            <svg class="ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" /><circle cx="60" cy="60" r="45" class="inner" /></svg>
          </span>
          <span class="ear" aria-hidden="true" />

          <!-- Разметка — как у типографской папки «Дело» -->
          <span class="org" aria-hidden="true">
            <span class="blank wide"><PenNote :tilt="-1.5" size="1.2rem">документация к жизни</PenNote></span>
            <span class="cap type">(наименование учреждения)</span>
          </span>
          <span class="printed type" aria-hidden="true">
            Дело № <span class="blank"><PenNote :tilt="-3" size="1.9rem">200</PenNote></span>
            <PenNote class="cm" :tilt="-6" size="0.95rem">в сантиметрах</PenNote>
          </span>
          <span class="name" aria-hidden="true">
            <span class="blank wide"><PenNote :tilt="-1" size="1.3rem">Личное дело</PenNote></span>
            <span class="blank wide"><PenNote :tilt="-2" size="clamp(2.8rem, 6vw, 4.4rem)" class="who">!захар</PenNote></span>
            <span class="cap type">(заголовок дела)</span>
          </span>
          <span class="rows type" aria-hidden="true">
            <span>Начато <span class="blank"><PenNote :tilt="-2">давно</PenNote></span></span>
            <span>Окончено <span class="blank"><PenNote :tilt="1" color="stamp">ещё нет</PenNote></span></span>
            <span>На <span class="blank short"><PenNote :tilt="-3">7</PenNote></span> листах</span>
            <span>Хранить <span class="blank" /></span>
          </span>
          <Stamp class="keep" :tilt="-11" size="clamp(1rem, 2.4vw, 1.5rem)" sub="Архив № 1">Хранить вечно</Stamp>
          <span class="ties" aria-hidden="true"><i /><i /></span>
        </button>

        <div class="face inside" :aria-hidden="state !== 'open'">
          <div class="left-sheet">
            <LeftPage :section="sec(leftId)" :current="current" :interactive="state === 'open'" @go="go" />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ── Стол ─────────────────────────────────────────────────────────────── */
.desk {
  --pw: min(560px, 44vw, calc((100svh - 72px) / 1.36));
  --ph: calc(var(--pw) * 1.36);
  /* Фон — кадр 3D-сцены вступления сверху (public/desk.jpg, npm run
     desk-shot). Масштаб привязан к папке: кадр в k раз выше неё, и тогда
     ноутбук, кружка и лампа стоят ровно там, где их оставила камера. */
  --desk-k: 2.6261;
  --desk-h: calc(var(--ph) * var(--desk-k));
  /* по центру; проценты в background-position считаются от разницы
     размеров, поэтому «50%» — это и есть центр кадра по центру стола */
  --desk-y: 50%;
  position: relative;
  min-height: 100svh;
  display: grid;
  place-items: center;
  /* clip, а не hidden: hidden-блок браузер всё равно прокручивает сам, когда
     тянется показать сфокусированную кнопку, — и стол уезжал вместе с папкой */
  overflow: clip;
  background:
    var(--grain),
    url('/desk.jpg') 50% var(--desk-y) / auto var(--desk-h) no-repeat,
    #050403;
}

/* Лампа: тёплое пятно света на папке — тот же приём, что и прожектор на
   сцене, только здесь он светит на бумаги */
/* Свет лампы уже в кадре стола; здесь — только лёгкое дыхание накала, чтобы
   стол не выглядел фотографией */
.lamp {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 46%, rgb(255 210 150 / 0.06), transparent 40%);
  pointer-events: none;
  animation: breathe 6s ease-in-out infinite;
}
@keyframes breathe {
  50% {
    opacity: 0.55;
  }
}

.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 75% 70% at 52% 46%, transparent 55%, rgb(0 0 0 / 0.55));
}
/* Свет лампы на развороте: мягкий свет поверх бумаги, не меняющий её цвет
   до неузнаваемости — soft-light только подсвечивает и притеняет */
.lamplight {
  position: absolute;
  inset: 0;
  border-radius: 6px 10px 10px 6px;
  z-index: 6;
  pointer-events: none;
  mix-blend-mode: soft-light;
  background: radial-gradient(ellipse 80% 70% at 72% 18%, rgb(255 225 170 / 0.55), transparent 60%),
    radial-gradient(ellipse 90% 80% at 50% 50%, transparent 55%, rgb(20 12 4 / 0.45));
}
.open .lamplight {
  /* раскрытый разворот вдвое шире папки: свет накрывает и левую страницу */
  inset: 0 0 0 -100%;
}

.hint {
  position: absolute;
  left: calc(50% - var(--pw) / 2 - 290px);
  top: 30%;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  color: var(--paper);
}
.hint :deep(.note) {
  color: var(--paper);
}
.hint-arrow {
  width: 150px;
  height: 54px;
  margin-left: 40px;
}

/* ── Папка ────────────────────────────────────────────────────────────── */
.folder {
  position: relative;
  width: var(--pw);
  height: var(--ph);
  perspective: 2400px;
  transform: rotate(-1.6deg);
  transition: transform 1.15s cubic-bezier(0.7, 0, 0.2, 1);
}
/* Перспектива нужна только на время переворота обложки. Потом её снимаем:
   она делает папку «рамкой» для fixed-потомков (на телефоне отрывалась нижняя
   полоса закладок) и складывалась бы с собственной перспективой листа */
.revealed .folder {
  perspective: none;
}
.open .folder {
  /* Раскрытый разворот вдвое шире — сдвигаем, чтобы он встал по центру */
  transform: translateX(calc(var(--pw) / 2)) rotate(0deg);
}

.board,
.face {
  position: absolute;
  inset: 0;
  border-radius: 6px 10px 10px 6px;
}

.board {
  background: var(--mottle), var(--fiber), var(--grain), var(--kraft-deep);
  /* Толщина: из-под обложки по правому и нижнему краю видна стопка листов —
     несколько бумажных кромок разного оттенка, под ними задняя доска */
  box-shadow:
    1px 1px 0 #e6e6e1,
    2px 2px 0 #cfd1cb,
    3px 3px 0 #e2e3de,
    4px 4px 0 #c8cac4,
    5px 6px 0 #9c7a52,
    0 2px 0 rgb(0 0 0 / 0.25),
    0 30px 60px -20px rgb(0 0 0 / 0.65),
    0 12px 24px -12px rgb(0 0 0 / 0.5);
}

/* Скоросшиватель у корешка: металлическая планка, на которую надеты листы */
.fastener {
  position: absolute;
  left: 18px;
  top: 14%;
  bottom: 14%;
  width: 9px;
  border-radius: 4px;
  background: linear-gradient(90deg, #8d9399, #e3e6e9 45%, #9aa0a6);
  box-shadow: 1px 1px 2px rgb(0 0 0 / 0.4);
  z-index: 3;
}

/* Подшитые листы под текущим: торчат краями, сдвинуты — стопка */
.stack span {
  position: absolute;
  inset: 14px 16px 16px 12px;
  background: var(--paper-shade);
  border-radius: 2px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
}
.stack span:nth-child(1) {
  transform: translate(5px, 5px) rotate(0.6deg);
}
.stack span:nth-child(2) {
  transform: translate(3px, 3px) rotate(-0.4deg);
}
.stack span:nth-child(3) {
  transform: translate(1px, 1px);
}

.sheets {
  position: absolute;
  inset: 14px 16px 16px 12px;
}

.sheet {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 34px 34px 46px 52px;
  background:
    /* дыроколом: две дырки у края, через них листы надеты на планку */
    radial-gradient(circle at 18px 22%, var(--kraft-deep) 0 6px, transparent 6.6px),
    radial-gradient(circle at 18px 78%, var(--kraft-deep) 0 6px, transparent 6.6px),
    var(--grain),
    var(--paper);
  border-radius: 2px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  scrollbar-width: thin;
  scrollbar-color: var(--rule) transparent;
  /* Раскладка страниц — по ширине листа, а не экрана: лист на развороте
     вдвое уже окна */
  container-type: inline-size;
}
.sheet:focus {
  outline: none;
}

.sheet-no {
  position: absolute;
  right: 18px;
  bottom: 10px;
  margin: 0;
  font-size: 0.75rem;
  color: var(--ink-soft);
}

/* ── Перелистывание ─────────────────────────────────────────────────────
   Лист вращается на корешке: ось — левый край доски, то есть на 12px левее
   самого листа (столько отступ листов от корешка). Перспектива — в самом
   transform, а не у предка: перспектива предка ломает position: fixed у
   нижней полосы закладок на телефоне. */
.leaf {
  position: absolute;
  /* те же отступы, что у листов на доске */
  inset: 14px 16px 16px 12px;
  z-index: 5;
  transform-origin: -12px 50%;
  transform-style: preserve-3d;
  pointer-events: none;
  animation: leaf-forward 1.05s cubic-bezier(0.55, 0.05, 0.3, 1) forwards;
}
.leaf.back {
  animation-name: leaf-back;
}
/* Лист сначала отрывается от стопки (подъём), летит, к концу ложится плавно */
@keyframes leaf-forward {
  0% {
    transform: perspective(2600px) rotateY(0deg);
  }
  14% {
    transform: perspective(2600px) rotateY(-14deg) translateZ(6px);
  }
  50% {
    transform: perspective(2600px) rotateY(-90deg) translateZ(26px);
  }
  100% {
    transform: perspective(2600px) rotateY(-180deg);
  }
}
@keyframes leaf-back {
  0% {
    transform: perspective(2600px) rotateY(-180deg);
  }
  14% {
    transform: perspective(2600px) rotateY(-166deg) translateZ(6px);
  }
  50% {
    transform: perspective(2600px) rotateY(-90deg) translateZ(26px);
  }
  100% {
    transform: perspective(2600px) rotateY(0deg);
  }
}
.leaf-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.leaf-face.back {
  transform: rotateY(180deg);
}
/* Свет на летящем листе: у корешка он в тени, к ребру — светлее; темнее
   всего, когда лист стоит торцом к лампе */
.shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgb(20 14 8 / 0.45), rgb(20 14 8 / 0.05) 55%, rgb(255 240 210 / 0.12));
  opacity: 0;
}
.leaf.forward .front .shade,
.leaf.back .back .shade {
  animation: shade-in 1.05s cubic-bezier(0.55, 0.05, 0.3, 1) forwards;
}
.leaf.forward .back .shade,
.leaf.back .front .shade {
  animation: shade-out 1.05s cubic-bezier(0.55, 0.05, 0.3, 1) forwards;
}
.leaf-face.back .shade {
  background: linear-gradient(-90deg, rgb(20 14 8 / 0.45), rgb(20 14 8 / 0.05) 55%, rgb(255 240 210 / 0.12));
}
@keyframes shade-in {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}
@keyframes shade-out {
  0%,
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
/* Тень от поднятого листа на странице под ним */
.under-shade {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(90deg, rgb(0 0 0 / 0.3), rgb(0 0 0 / 0) 55%);
  animation: under 1.05s ease forwards;
}
.under-shade.back {
  background: linear-gradient(90deg, rgb(0 0 0 / 0.22), rgb(0 0 0 / 0) 70%);
}
@keyframes under {
  0% {
    opacity: 0;
  }
  45% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* Фото раздела наверху листа — только на телефоне, где нет левой страницы */
.strip-photo {
  width: 46%;
  max-width: 200px;
  margin: 0 0 20px 4px;
  transform: rotate(-3deg);
}

/* ── Закладки ─────────────────────────────────────────────────────────── */
.tabs {
  position: absolute;
  top: 22px;
  right: 0;
  /* Закладки торчат из-под листов наружу целиком: подпись читается и у
     закрытой папки, а под обложкой остаётся только корешок пластика */
  transform: translateX(calc(100% - 10px));
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1;
}
.closed .tabs {
  /* У закрытой папки закладки торчат из-под обложки, но нажимать их рано */
  pointer-events: none;
}
.tab {
  position: relative;
  min-width: 88px;
  padding: 7px 14px 7px 16px;
  border: 0;
  border-radius: 0 7px 7px 0;
  /* пластик: полупрозрачный, с бликом сверху и тенью у корня */
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.38), rgb(255 255 255 / 0) 45%),
    linear-gradient(90deg, rgb(0 0 0 / 0.16), transparent 30%),
    color-mix(in srgb, var(--tab) 88%, transparent);
  border: 1px solid rgb(0 0 0 / 0.08);
  border-left: 0;
  box-shadow: 1px 2px 3px rgb(0 0 0 / 0.3);
  font-family: var(--hand);
  font-size: 1rem;
  font-size-adjust: 0.36;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  transform: translateX(-4px);
  transition: transform 0.18s ease;
}
.tab:hover {
  transform: translateX(2px);
}
.tab[aria-selected='true'] {
  transform: translateX(10px);
  z-index: 2;
}

/* ── Обложка ──────────────────────────────────────────────────────────── */
.cover {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  transform-style: preserve-3d;
  transition: transform 1.15s cubic-bezier(0.7, 0, 0.2, 1);
  z-index: 4;
}
.open .cover {
  transform: rotateY(-180deg);
}
.instant .cover,
.instant .folder {
  transition: none;
}

.face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.outside {
  display: block;
  width: 100%;
  padding: 8% 9% 7% 11%;
  border: 0;
  text-align: left;
  cursor: pointer;
  background: none;
  filter: drop-shadow(0 18px 22px rgb(0 0 0 / 0.45));
  transition: transform 0.25s ease;
}
.closed .outside:hover {
  transform: translateY(-3px) rotate(-0.3deg);
}

/* Картон: пятна вторсырья, волокна, зерно, потемневшие от рук края и углы,
   светлая потёртость по кромке. Уголок справа внизу загнут — срезан
   clip-path, а сам загиб нарисован отдельно (.ear). */
.skin {
  position: absolute;
  inset: 0;
  border-radius: 4px 9px 9px 4px;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 34px), calc(100% - 34px) 100%, 0 100%);
  background:
    radial-gradient(120% 60% at 100% 0%, rgb(60 38 18 / 0.28), transparent 45%),
    radial-gradient(90% 50% at 0% 100%, rgb(60 38 18 / 0.3), transparent 50%),
    radial-gradient(60% 30% at 30% 12%, rgb(255 240 210 / 0.12), transparent 70%),
    var(--mottle),
    var(--fiber),
    var(--grain),
    linear-gradient(105deg, rgb(255 255 255 / 0.07), transparent 40%),
    var(--kraft);
  box-shadow:
    inset 0 0 0 1px rgb(0 0 0 / 0.1),
    inset 0 0 0 3px rgb(255 238 205 / 0.14),
    inset 0 0 26px rgb(50 30 12 / 0.35),
    inset 4px 0 0 rgb(0 0 0 / 0.1);
}
/* Типографская рамка: двойная линия, краска чуть неровная */
.frame {
  position: absolute;
  inset: 5% 5.5% 5% 7%;
  border: 1.5px solid rgb(27 27 27 / 0.42);
  outline: 0.75px solid rgb(27 27 27 / 0.35);
  outline-offset: -6px;
  filter: url(#hand-wobble);
}
/* Круг от кружки: кто-то ставил кофе прямо на дело */
.ring {
  position: absolute;
  right: 6%;
  top: 26%;
  width: 34%;
  fill: none;
  stroke: rgb(105 58 22 / 0.32);
  stroke-width: 3.5;
  mix-blend-mode: multiply;
  filter: url(#hand-wobble) blur(0.4px);
  transform: rotate(18deg);
}
.ring .inner {
  stroke-width: 1.2;
  stroke-dasharray: 60 22 110 30;
  stroke: rgb(105 58 22 / 0.18);
  fill: rgb(105 58 22 / 0.035);
}
/* Загнутый уголок: изнанка картона светлее, под ней тень */
.ear {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, transparent 50%, #cdae84 50%, #b99a70 100%);
  filter: drop-shadow(-2px -2px 2px rgb(0 0 0 / 0.25));
  border-radius: 0 0 6px 0;
}

.org,
.name {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}
.org {
  margin-bottom: 7%;
  width: 82%;
}
.cap {
  align-self: center;
  font-size: 0.68rem;
  color: rgb(27 27 27 / 0.55);
}
.printed {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin-bottom: 7%;
  font-size: clamp(1.5rem, 3.4vw, 2.4rem);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(27 27 27 / 0.82);
}
.printed .blank {
  letter-spacing: 0;
  text-transform: none;
}
.cm {
  letter-spacing: 0;
  text-transform: none;
}
.blank {
  display: inline-flex;
  justify-content: center;
  min-width: 4.5em;
  padding: 0 6px;
  border-bottom: 1.2px solid rgb(27 27 27 / 0.5);
}
.blank.short {
  min-width: 2.2em;
}
.blank.wide {
  justify-content: flex-start;
  padding-left: 4%;
}
.name {
  margin-bottom: 7%;
}
.who {
  line-height: 1.05;
}
.rows {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 18px;
  font-size: 0.86rem;
  color: rgb(27 27 27 / 0.8);
}
.rows > span {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.keep {
  position: absolute;
  right: 10%;
  bottom: 8%;
}

/* Завязки: тесёмки, которыми стягивают старые папки «Дело» */
.ties {
  position: absolute;
  right: -2px;
  top: 50%;
  translate: 0 -50%;
}
.ties i {
  display: block;
  width: 64px;
  height: 7px;
  margin: 7px 0;
  border-radius: 4px;
  background:
    repeating-linear-gradient(90deg, rgb(0 0 0 / 0.06) 0 2px, transparent 2px 5px),
    #ede6d6;
  box-shadow: 0 1px 1.5px rgb(0 0 0 / 0.35);
  transform: translateX(36px) rotate(-6deg);
}
.ties i + i {
  transform: translateX(40px) rotate(7deg);
}

/* Изнанка обложки — левая страница разворота */
.inside {
  transform: rotateY(180deg);
  background:
    var(--mottle),
    var(--fiber),
    var(--grain),
    linear-gradient(-100deg, rgb(0 0 0 / 0.18), transparent 12%),
    var(--kraft-inside);
  overflow: hidden;
}
/* Левая страница — лист бумаги на изнанке обложки, с тем же отступом от
   корешка, что у правых листов: перевёрнутый лист ложится ровно на неё */
.left-sheet {
  position: absolute;
  inset: 14px 12px 16px 16px;
  background:
    linear-gradient(-90deg, rgb(0 0 0 / 0.12), transparent 8%),
    var(--grain),
    var(--paper);
  border-radius: 2px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
}
.leaf-face.left-sheet {
  inset: 0;
}

.snuff-tab {
  display: none;
}

/* ── Узкий экран: разворота нет, обложка улетает, закладки — внизу ─────── */
@media (max-width: 900px) {
  .desk {
    --pw: calc(100vw - 20px);
    --ph: calc(100svh - 92px);
    /* папка прижата к верху — центр кадра стола тоже */
    --desk-y: calc(10px + var(--ph) / 2 - var(--desk-h) / 2);
    align-items: start;
    padding-top: 10px;
  }
  .folder,
  .open .folder {
    transform: none;
  }

  .open .cover {
    transform: rotateY(-180deg) translateZ(1px);
    opacity: 0;
    pointer-events: none;
    transition:
      transform 1s cubic-bezier(0.7, 0, 0.2, 1),
      opacity 0.3s ease 0.7s;
  }
  .hint {
    left: 20px;
    top: auto;
    bottom: 18px;
  }
  .hint-arrow {
    display: none;
  }
  .sheet {
    padding: 28px 18px 40px 34px;
  }
  .open .lamplight {
    inset: 0;
  }
  /* левой страницы нет — оборот листа не нужен, лист просто уходит */
  .leaf-face.back {
    display: none;
  }
  .tabs {
    position: fixed;
    top: auto;
    right: 0;
    left: 0;
    bottom: 0;
    flex-direction: row;
    gap: 3px;
    transform: none;
    padding: 0 8px env(safe-area-inset-bottom);
    overflow-x: auto;
    scrollbar-width: none;
    z-index: 6;
  }
  .tab {
    flex: 0 0 auto;
    width: auto;
    padding: 12px 14px 16px;
    border-radius: 8px 8px 0 0;
    transform: translateY(8px);
  }
  .tab:hover {
    transform: translateY(6px);
  }
  .tab[aria-selected='true'] {
    transform: translateY(0);
  }
  .closed .tabs,
  .closed .snuff-tab {
    display: none;
  }
  .snuff-tab {
    display: block;
    position: fixed;
    right: 8px;
    bottom: 0;
    z-index: 7;
    min-width: 0;
    --tab: #e23a3a;
    color: #fff6ee;
    box-shadow: -10px 0 12px -6px rgb(0 0 0 / 0.5);
  }
  .tabs {
    /* место под красную закладку «не трогать», чтобы она не закрывала «Связь» */
    padding-right: 150px;
  }
}
</style>
