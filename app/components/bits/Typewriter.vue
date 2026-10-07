<script setup lang="ts">
/**
 * Текст, который печатает машинка.
 *
 * Не «проявление»: литеры встают по одной, с живым ритмом — пробел чуть
 * дольше, после запятой и точки пауза, будто человек думает, что печатать
 * дальше. Каждая литера стоит немного криво и пропечатана неровно — у
 * машинки так всегда: рычаги разболтаны, лента выработана. Кривизна
 * постоянная (считается от позиции буквы), поэтому текст не «дрожит»,
 * а просто напечатан на старой машинке.
 *
 * armed — текст будет напечатан: пока очередь не дошла, лист пустой.
 * start — начать печатать. Без armed и start текст лежит готовым (уже читали).
 * complete — допечатать мгновенно (клик по листу).
 */
const props = withDefaults(
  defineProps<{
    text: string
    armed?: boolean
    start?: boolean
    complete?: boolean
    tag?: string
    /** Средний интервал между ударами, мс */
    pace?: number
  }>(),
  { armed: false, start: false, complete: false, tag: 'span', pace: 52 },
)
const emit = defineEmits<{ done: [] }>()
const sounds = useDeskSounds()

const chars = computed(() => [...props.text])
// Литеры сгруппированы по словам: каждая литера — inline-block (чтобы стоять
// криво), а между inline-block браузер переносит где угодно, даже посреди слова
const words = computed(() => {
  const out: { chars: string[]; start: number; space: boolean }[] = []
  let i = 0
  for (const part of props.text.split(/(\s+)/)) {
    if (!part) continue
    out.push({ chars: [...part], start: i, space: /^\s+$/.test(part) })
    i += [...part].length
  }
  return out
})
const shown = ref(props.armed || props.start ? 0 : chars.value.length)
const typing = ref(false)
let timer = 0

// Псевдослучайное от номера литеры: одна и та же буква всегда стоит одинаково криво
const jitter = (i: number, k: number) => {
  const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}
function inkStyle(i: number) {
  return {
    '--dy': (jitter(i, 1) - 0.5) * 1.6 + 'px',
    '--rot': (jitter(i, 2) - 0.5) * 3 + 'deg',
    '--ink': (0.72 + jitter(i, 3) * 0.28).toFixed(2),
  }
}

function step() {
  if (shown.value >= chars.value.length) {
    typing.value = false
    emit('done')
    return
  }
  const ch = chars.value[shown.value]!
  shown.value++
  sounds.key(ch === ' ' ? 'space' : 'char')
  let wait = props.pace + (Math.random() - 0.5) * props.pace * 0.8
  if (ch === ' ') wait += props.pace * 0.4
  if (/[,.;:—!?]/.test(ch)) wait += props.pace * 2.6
  timer = window.setTimeout(step, wait)
}

function begin() {
  if (typing.value || shown.value >= chars.value.length) return
  typing.value = true
  timer = window.setTimeout(step, props.pace)
}

function finish() {
  clearTimeout(timer)
  if (shown.value < chars.value.length || typing.value) {
    shown.value = chars.value.length
    typing.value = false
    emit('done')
  }
}

watch(
  () => props.start,
  (s) => {
    if (s) begin()
  },
)
watch(
  () => props.complete,
  (c) => {
    if (c) finish()
  },
)
onMounted(() => {
  if (props.complete || ((props.armed || props.start) && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    finish()
  } else if (props.start) {
    begin()
  }
})
onBeforeUnmount(() => clearTimeout(timer))
defineExpose({ finish })
</script>

<template>
  <component :is="tag" class="tw" :aria-label="text">
    <template v-for="w in words" :key="w.start">
      <span v-if="w.space" aria-hidden="true">{{ w.chars.join('') }}</span>
      <span v-else class="word" aria-hidden="true">
        <template v-for="(ch, j) in w.chars" :key="j">
          <span v-if="typing && w.start + j === shown" class="caret" />
          <span class="ch" :class="{ off: w.start + j >= shown }" :style="inkStyle(w.start + j)">{{ ch }}</span>
        </template>
      </span>
      <span v-if="typing && w.space && w.start === shown" class="caret" aria-hidden="true" />
    </template>
    <span v-if="typing && shown >= chars.length" class="caret" aria-hidden="true" />
  </component>
</template>

<style scoped>
.tw {
  white-space: pre-wrap;
}
.word {
  display: inline-block;
  white-space: nowrap;
}
.ch {
  display: inline-block;
  transform: translateY(var(--dy)) rotate(var(--rot));
  opacity: var(--ink);
  /* лента чуть растекается по волокнам бумаги */
  text-shadow: 0 0 0.6px currentColor;
}
.ch.off {
  visibility: hidden;
}
/* Каретка: где ударит следующая литера */
.caret {
  display: inline-block;
  width: 0.55em;
  height: 0.12em;
  margin-right: -0.55em;
  vertical-align: -0.15em;
  background: var(--stamp);
  opacity: 0.8;
  animation: blink 0.9s steps(2, start) infinite;
}
@keyframes blink {
  to {
    visibility: hidden;
  }
}
</style>
