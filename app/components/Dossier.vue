<script setup lang="ts">
import { SECTIONS, type SectionId } from '~/data/dossier'
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
const direction = ref<'forward' | 'back'>('forward')
const visited = reactive(new Set<SectionId>())
const snuff = ref(false)

const index = (id: SectionId) => SECTIONS.findIndex((s) => s.id === id)
const section = computed(() => SECTIONS[index(current.value)]!)

function open(opts: { instant?: boolean } = {}) {
  if (state.value === 'open') return
  instant.value = !!opts.instant
  state.value = 'open'
  // Содержимое проявляется, когда обложка почти легла: печатать анкету под
  // летящим картоном — значит показать её никому.
  setTimeout(() => (revealed.value = true), opts.instant ? 0 : 950)
}

function go(id: SectionId) {
  if (id === current.value) return
  direction.value = index(id) > index(current.value) ? 'forward' : 'back'
  visited.add(current.value)
  current.value = id
  if (import.meta.client) history.replaceState(null, '', '#' + id)
}

const fresh = computed(() => !visited.has(current.value))

onMounted(() => {
  const id = location.hash.slice(1) as SectionId
  if (SECTIONS.some((s) => s.id === id)) {
    current.value = id
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
    <div class="lamp" aria-hidden="true" />
    <SnuffMode v-model="snuff" />

    <p v-if="state === 'closed'" class="hint" aria-hidden="true">
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
          <Transition :name="'sheet-' + direction">
            <article
              :key="current"
              class="sheet"
              role="tabpanel"
              :id="'panel-' + current"
              :aria-labelledby="'tab-' + current"
              tabindex="-1"
            >
              <component :is="pages[current]" v-if="revealed" :fresh="fresh" @go="go" />
              <p class="sheet-no type" aria-hidden="true">лист {{ index(current) + 1 }}</p>
            </article>
          </Transition>
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

      <!-- Обложка: снаружи — «Личное дело», изнутри — фото и опись -->
      <div class="cover">
        <button class="face outside" :tabindex="state === 'open' ? -1 : 0" :aria-hidden="state === 'open'" @click="open()">
          <span class="sr-only">Открыть личное дело</span>
          <span class="printed type" aria-hidden="true">Личное дело</span>
          <span class="line type" aria-hidden="true">
            № <span class="blank"><PenNote :tilt="-3" size="1.9rem">200</PenNote></span>
            <PenNote class="cm" :tilt="-6" size="0.95rem">в сантиметрах</PenNote>
          </span>
          <span class="name" aria-hidden="true">
            <span class="type label">Фамилия, имя</span>
            <span class="blank wide"><PenNote :tilt="-2" size="clamp(2.6rem, 6vw, 4.2rem)" class="who">!захар</PenNote></span>
          </span>
          <span class="dates type" aria-hidden="true">
            <span>Начато <span class="blank"><PenNote :tilt="-2">давно</PenNote></span></span>
            <span>Окончено <span class="blank"><PenNote :tilt="1" color="stamp">ещё нет</PenNote></span></span>
          </span>
          <Stamp class="keep" :tilt="-11" size="clamp(1rem, 2.4vw, 1.5rem)" sub="Архив № 1">Хранить вечно</Stamp>
          <span class="ties" aria-hidden="true"><i /><i /></span>
        </button>

        <div class="face inside" :aria-hidden="state !== 'open'">
          <div class="photo">
            <Clip class="photo-clip" />
            <Sketch caption="фото скоро, пока так" />
          </div>

          <div class="inventory">
            <Tape class="inv-tape" :tilt="-4" />
            <h2 class="type">Опись документов</h2>
            <ol>
              <li v-for="(s, i) in SECTIONS" :key="s.id">
                <button class="inv-row" :class="{ on: current === s.id }" :tabindex="state === 'open' ? 0 : -1" @click="go(s.id)">
                  <span class="inv-no type">{{ i + 1 }}.</span>
                  <span class="inv-text">{{ s.inventory }}</span>
                  <span class="inv-dots" aria-hidden="true" />
                  <span class="inv-page type">л. {{ i + 1 }}</span>
                </button>
              </li>
            </ol>
            <PenNote class="inv-note" :tilt="-3">листай закладки справа →</PenNote>
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
  position: relative;
  min-height: 100svh;
  display: grid;
  place-items: center;
  /* clip, а не hidden: hidden-блок браузер всё равно прокручивает сам, когда
     тянется показать сфокусированную кнопку, — и стол уезжал вместе с папкой */
  overflow: clip;
  background:
    var(--grain),
    radial-gradient(ellipse 70% 60% at 50% 42%, var(--desk-glow), transparent 70%),
    repeating-linear-gradient(92deg, rgb(255 255 255 / 0.012) 0 3px, transparent 3px 11px),
    var(--desk);
}

/* Лампа: тёплое пятно света на папке — тот же приём, что и прожектор на
   сцене, только здесь он светит на бумаги */
.lamp {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle at 52% 40%, rgb(255 226 170 / 0.16), transparent 42%);
  pointer-events: none;
  transition: opacity 0.6s;
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
  background: var(--fiber), var(--grain), var(--kraft-deep);
  box-shadow:
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

/* Листание: уходящий лист срывают со стопки, под ним уже лежит новый.
   Назад — наоборот: лист кладут сверху. */
.sheet-forward-leave-active,
.sheet-back-enter-active {
  z-index: 2;
  transition:
    transform 0.55s cubic-bezier(0.5, 0, 0.25, 1),
    opacity 0.55s ease;
}
.sheet-forward-leave-to,
.sheet-back-enter-from {
  transform: translate(-70%, -6%) rotate(-9deg);
  opacity: 0;
}
.sheet-forward-enter-active,
.sheet-back-leave-active {
  transition: opacity 0.3s ease 0.15s;
}
.sheet-forward-enter-from,
.sheet-back-leave-to {
  opacity: 0.6;
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
  background:
    linear-gradient(90deg, rgb(0 0 0 / 0.14), transparent 30%),
    var(--tab);
  box-shadow: 1px 2px 3px rgb(0 0 0 / 0.3);
  font-family: var(--hand);
  font-variation-settings: 'INFM' 60, 'BNCE' 30;
  font-size: 0.92rem;
  font-weight: 600;
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
  padding: 9% 9% 8% 11%;
  border: 0;
  text-align: left;
  cursor: pointer;
  background:
    var(--fiber),
    var(--grain),
    linear-gradient(105deg, rgb(255 255 255 / 0.08), transparent 40%),
    var(--kraft);
  box-shadow:
    inset 0 0 0 1px rgb(0 0 0 / 0.08),
    inset 3px 0 0 rgb(0 0 0 / 0.08),
    0 20px 40px -18px rgb(0 0 0 / 0.6);
  transition: transform 0.25s ease;
}
.closed .outside:hover {
  transform: translateY(-3px) rotate(-0.3deg);
}

.printed {
  display: block;
  margin-bottom: 9%;
  font-size: clamp(1.4rem, 3.4vw, 2.3rem);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgb(27 27 27 / 0.82);
}
.line,
.name,
.dates {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: rgb(27 27 27 / 0.82);
}
.line {
  font-size: 1.3rem;
  margin-bottom: 9%;
  flex-wrap: wrap;
}
.cm {
  margin-left: 2px;
}
.blank {
  display: inline-flex;
  justify-content: center;
  min-width: 4.5em;
  padding: 0 6px;
  border-bottom: 1.5px solid rgb(27 27 27 / 0.55);
}
.name {
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  margin-bottom: 10%;
}
.label {
  font-size: 0.85rem;
}
.blank.wide {
  justify-content: flex-start;
  padding-left: 4%;
}
.who {
  font-weight: 700;
  line-height: 1;
}
.dates {
  justify-content: space-between;
  flex-wrap: wrap;
  font-size: 0.9rem;
}
.keep {
  position: absolute;
  right: 9%;
  bottom: 9%;
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
  padding: 7% 7% 7% 8%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 6%;
  background:
    var(--fiber),
    var(--grain),
    linear-gradient(-100deg, rgb(0 0 0 / 0.18), transparent 12%),
    var(--kraft-inside);
  overflow: hidden;
}
.photo {
  position: relative;
  width: 46%;
  margin-left: 6%;
  transform: rotate(-3deg);
}
.photo-clip {
  position: absolute;
  top: -28px;
  left: 22%;
  z-index: 2;
}

.inventory {
  position: relative;
  align-self: start;
  padding: 18px 20px 16px;
  background: var(--grain), var(--paper);
  box-shadow: 0 2px 6px -2px rgb(0 0 0 / 0.35);
  transform: rotate(0.8deg);
}
.inv-tape {
  top: -12px;
  left: 40%;
}
.inventory h2 {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: 0.08em;
}
.inventory ol {
  margin: 0;
  padding: 0;
  list-style: none;
}
.inv-row {
  display: grid;
  grid-template-columns: 1.6em auto 1fr auto;
  align-items: baseline;
  gap: 6px;
  width: 100%;
  padding: 3px 0;
  border: 0;
  background: none;
  text-align: left;
  font-size: 0.92rem;
  cursor: pointer;
}
.inv-row:hover .inv-text,
.inv-row.on .inv-text {
  background: linear-gradient(transparent 55%, color-mix(in srgb, var(--marker) 85%, transparent) 55% 92%, transparent 92%);
}
.inv-no,
.inv-page {
  font-size: 0.78rem;
  color: var(--ink-soft);
}
.inv-dots {
  border-bottom: 1.5px dotted var(--rule);
  transform: translateY(-4px);
}
.inv-note {
  margin-top: 10px;
}

.snuff-tab {
  display: none;
}

/* ── Узкий экран: разворота нет, обложка улетает, закладки — внизу ─────── */
@media (max-width: 900px) {
  .desk {
    --pw: calc(100vw - 20px);
    --ph: calc(100svh - 92px);
    align-items: start;
    padding-top: 10px;
  }
  .folder,
  .open .folder {
    transform: none;
  }
  /* Перспектива нужна только на время переворота обложки. Потом её снимаем:
     она делает папку «рамкой» для fixed-потомков, и нижняя полоса закладок
     переставала быть прикреплённой к экрану */
  .revealed .folder {
    perspective: none;
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
    padding-right: 120px;
  }
}
</style>
