<script setup lang="ts">
import { ANKETA } from '~/data/dossier'

/**
 * Первый лист. При первом открытии поля допечатываются машинкой по очереди,
 * а в конце на образование падает штамп — это продолжение открытия папки,
 * а не отдельный эффект. Второй раз лист просто лежит готовым.
 */
defineProps<{ fresh: boolean }>()
defineEmits<{ go: [id: 'scena'] }>()

// Машинка печатает со скоростью, а не за фиксированное время: короткое поле
// не должно тянуться, длинное — мелькать.
const CHAR = 0.009
const timing = ANKETA.reduce<{ delay: number; dur: number }[]>((acc, f) => {
  const prev = acc.at(-1)
  const delay = prev ? prev.delay + prev.dur + 0.03 : 0.1
  acc.push({ delay, dur: Math.max(0.1, f.value.length * CHAR) })
  return acc
}, [])
const typedAt = timing.at(-1)!.delay + timing.at(-1)!.dur
</script>

<template>
  <div class="anketa" :class="{ fresh }">
    <div class="narrow-only photo">
      <Sketch caption="фото скоро, пока так" />
    </div>

    <header class="page-head">
      <h1 class="page-title">Анкета</h1>
      <PenNote :tilt="-3">заполнено лично</PenNote>
    </header>

    <dl class="fields">
      <div v-for="(f, i) in ANKETA" :key="f.label" class="field">
        <dt class="type">{{ f.label }}</dt>
        <dd>
          <span
            class="value type"
            :style="{ '--d': timing[i]!.delay + 's', '--t': timing[i]!.dur + 's', '--n': f.value.length }"
          >{{ f.value }}</span>
          <PenNote
            v-if="f.note"
            class="margin"
            :color="f.noteColor ?? 'pen'"
            :tilt="i % 2 ? 2 : -3"
            :style="{ '--d': typedAt + 0.2 + i * 0.08 + 's' }"
          >{{ f.note }}</PenNote>
          <Stamp
            v-if="f.label === 'Образование'"
            class="honours"
            :thump="fresh"
            :delay="typedAt + 0.5"
            :tilt="-7"
            size="0.95rem"
            sub="магистратура"
          >Красный диплом</Stamp>
        </dd>
      </div>
    </dl>

    <footer class="next">
      <button class="to-stage" @click="$emit('go', 'scena')">
        <PenNote :tilt="-2" size="1.15rem">а теперь — на сцену</PenNote>
        <Scribble kind="arrow" class="arrow" :draw="fresh" :delay="typedAt + 0.9" />
      </button>
    </footer>
  </div>
</template>

<style scoped>
.photo {
  width: 52%;
  max-width: 220px;
  margin: 0 0 22px 4px;
  transform: rotate(-3deg);
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
}
.value {
  font-size: 1.02rem;
}
.margin {
  max-width: 100%;
}
.honours {
  margin-left: auto;
}

/* Машинка: поле открывается по буквам, шаг — ровно буква */
.fresh .value {
  clip-path: inset(0 100% 0 0);
  animation: type var(--t) steps(var(--n), end) var(--d) forwards;
}
.fresh .margin {
  opacity: 0;
  animation: write 0.35s ease var(--d) forwards;
}
@keyframes type {
  to {
    clip-path: inset(0 0 0 0);
  }
}
@keyframes write {
  from {
    opacity: 0;
    transform: rotate(var(--tilt)) translateY(3px);
  }
  to {
    opacity: 1;
    transform: rotate(var(--tilt));
  }
}

.next {
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
