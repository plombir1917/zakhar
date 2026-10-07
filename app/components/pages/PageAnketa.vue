<script setup lang="ts">
import { ANKETA } from '~/data/dossier'

/**
 * Первый лист. При первом открытии анкету печатает машинка: заголовок, потом
 * поле за полем, литера за литерой. Пометка ручкой появляется, когда её поле
 * допечатано; в конце звенит каретка и на образование падает штамп.
 * Второй раз лист просто лежит готовым.
 *
 * Печать долгая нарочно — это машинка, а не проявление. Кто не хочет ждать,
 * кликает по листу: всё допечатывается сразу.
 */
const props = defineProps<{ fresh: boolean }>()
defineEmits<{ go: [id: 'scena'] }>()
const sounds = useDeskSounds()

// -1 — печатается заголовок, 0…n-1 — поле, n — всё готово
const step = ref(props.fresh ? -1 : ANKETA.length)
const skip = ref(false)
const done = computed(() => step.value >= ANKETA.length)

function next() {
  step.value++
  if (done.value && props.fresh) {
    sounds.ding()
    setTimeout(() => sounds.stamp(), 420)
  }
}
function hurry() {
  if (!done.value) skip.value = true
}
watch(skip, (s) => {
  if (s) step.value = ANKETA.length
})
</script>

<template>
  <div class="anketa" :class="{ typing: !done }" @click="hurry">
    <header class="page-head">
      <Typewriter tag="h1" class="page-title" text="Анкета" :armed="fresh" :start="fresh" :complete="skip" @done="step === -1 && next()" />
      <PenNote v-if="done || !fresh" :tilt="-3" class="appear">заполнено лично</PenNote>
      <span v-else class="hurry hand">клик — допечатать сразу</span>
    </header>

    <dl class="fields">
      <div v-for="(f, i) in ANKETA" :key="f.label" class="field">
        <dt class="type">{{ f.label }}</dt>
        <dd>
          <Typewriter
            class="value type"
            :text="f.value"
            :armed="fresh"
            :start="fresh && step === i"
            :complete="skip"
            @done="step === i && next()"
          />
          <PenNote
            v-if="f.note && (step > i || !fresh)"
            class="margin appear"
            :color="f.noteColor ?? 'pen'"
            :tilt="i % 2 ? 2 : -3"
          >{{ f.note }}</PenNote>
          <Stamp
            v-if="f.label === 'Образование' && done"
            class="honours"
            :thump="fresh"
            :delay="fresh && !skip ? 0.42 : 0"
            :tilt="-7"
            size="0.95rem"
            sub="магистратура"
          >Красный диплом</Stamp>
        </dd>
      </div>
    </dl>

    <footer class="next">
      <button v-if="done" class="to-stage" @click.stop="$emit('go', 'scena')">
        <PenNote :tilt="-2" size="1.15rem">а теперь — на сцену</PenNote>
        <Scribble kind="arrow" class="arrow" :draw="fresh" :delay="0.9" />
      </button>
    </footer>
  </div>
</template>

<style scoped>
.anketa.typing {
  cursor: pointer;
}
.hurry {
  color: var(--ink-soft);
  font-size: 0.9rem;
  opacity: 0.75;
}

.fields {
  margin: 0;
}
.field {
  display: grid;
  grid-template-columns: 9.5em 1fr;
  gap: 2px 14px;
  padding: 9px 0 7px;
  border-bottom: 1px solid var(--rule);
}
dt {
  font-size: 0.8rem;
  color: var(--ink-soft);
  padding-top: 3px;
}
dd {
  position: relative;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 14px;
  min-height: 1.6em;
}
.value {
  font-size: 1.04rem;
}
.margin {
  max-width: 100%;
}
.honours {
  margin-left: auto;
}

/* Пометка ручкой: появляется, будто её только что написали */
.appear {
  animation: write 0.4s ease both;
}
@keyframes write {
  from {
    opacity: 0;
    transform: rotate(var(--tilt)) translateY(3px);
    filter: blur(1px);
  }
  to {
    opacity: 1;
    transform: rotate(var(--tilt));
    filter: blur(0);
  }
}

.next {
  min-height: 48px;
  margin-top: 26px;
}
.to-stage {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  border: 0;
  background: none;
  cursor: pointer;
}
.to-stage:hover :deep(.note) {
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
}
.arrow {
  width: 90px;
  height: 32px;
}

@media (max-width: 560px) {
  .field {
    grid-template-columns: 1fr;
  }
  .honours {
    margin-left: 0;
  }
}
</style>
