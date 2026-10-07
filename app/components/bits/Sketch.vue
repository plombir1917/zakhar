<script setup lang="ts">
import type { SketchKind } from '~/data/dossier'

/**
 * Фото на левой странице. Пока снимков нет — карандашный набросок по
 * разделу: у ростомера, на сцене под прожектором, за ноутбуком, с планом
 * мероприятия, у студийного микрофона, с гантелью, с телефоном.
 *
 * Карандаш, а не цветные человечки: набросок должен выглядеть как то, что
 * правда могло лежать в деле, — штрих графитом, второй проход линии со
 * сдвигом, штриховка в тенях. Появится фото — подставится оно.
 */
const props = defineProps<{ kind: SketchKind; photo?: string; caption?: string }>()

/** Человечек ростом с ростомер: голова, корпус, руки и ноги — путями */
function body(x: number, top: number, arms: [string, string], legs = 'stand') {
  const h = top + 14
  const neck = h + 16
  const hip = neck + 78
  const head = `M${x} ${top} a13 15 0 1 0 0.1 0`
  const torso = `M${x - 2} ${h + 16} C ${x - 6} ${neck + 30}, ${x + 4} ${neck + 55}, ${x} ${hip}`
  const shoulders = `M${x - 18} ${neck + 8} C ${x - 6} ${neck + 2}, ${x + 6} ${neck + 2}, ${x + 18} ${neck + 8}`
  const leg =
    legs === 'stand'
      ? [`M${x} ${hip} C ${x - 6} ${hip + 30}, ${x - 12} ${hip + 55}, ${x - 14} ${hip + 82}`, `M${x} ${hip} C ${x + 6} ${hip + 30}, ${x + 10} ${hip + 55}, ${x + 14} ${hip + 82}`]
      : [`M${x} ${hip} C ${x + 20} ${hip + 4}, ${x + 30} ${hip + 10}, ${x + 32} ${hip + 40}`, `M${x} ${hip} C ${x + 18} ${hip + 8}, ${x + 22} ${hip + 20}, ${x + 16} ${hip + 44}`]
  return [head, torso, shoulders, ...arms, ...leg]
}

const scene = computed(() => {
  const ink: string[] = []
  const hatch: string[] = []
  switch (props.kind) {
    case 'ruler': {
      ink.push('M152 18 V 214')
      for (let i = 0; i <= 10; i++) ink.push(`M152 ${214 - i * 19.6} h ${i % 5 === 0 ? 16 : 9}`)
      ink.push(...body(98, 26, ['M80 66 C 70 90, 66 110, 64 132', 'M116 66 C 124 56, 128 44, 126 30']))
      ink.push('M126 30 l 4 -12', 'M128 14 a5 5 0 1 0 0.1 0') // микрофон
      for (let y = 60; y < 200; y += 7) hatch.push(`M60 ${y} l 14 -8`)
      break
    }
    case 'stage': {
      ink.push('M20 196 H 180', 'M20 202 H 180')
      ink.push(...body(100, 46, ['M82 86 C 72 104, 70 120, 72 140', 'M118 86 C 128 74, 134 60, 132 46']))
      ink.push('M132 46 l 3 -12', 'M134 30 a5 5 0 1 0 0.1 0')
      // прожектор сверху: конус штриховкой
      ink.push('M80 0 L 40 196', 'M120 0 L 160 196')
      for (let y = 8; y < 196; y += 9) hatch.push(`M${80 - y * 0.2} ${y} l ${40 + y * 0.4} 0`)
      // головы зрителей
      for (let x = 30; x < 180; x += 22) ink.push(`M${x} 228 a10 9 0 0 1 20 0`)
      break
    }
    case 'laptop': {
      ink.push('M10 168 H 190', 'M30 168 V 228', 'M170 168 V 228') // стол
      ink.push('M96 166 L 150 166 L 156 120 L 104 120 Z') // ноутбук
      for (let y = 128; y < 160; y += 7) ink.push(`M110 ${y} h ${20 + ((y * 7) % 18)}`)
      ink.push('M162 166 v -14 h 14 v 14', 'M176 156 a5 5 0 0 1 0 8') // кружка
      // сидит за столом, чуть сутулясь
      ink.push('M60 52 a13 15 0 1 0 0.1 0', 'M62 82 C 58 110, 60 130, 66 150', 'M62 96 C 80 110, 92 130, 104 150', 'M66 150 C 80 152, 90 158, 92 168', 'M66 150 C 64 180, 60 200, 58 226')
      for (let y = 172; y < 226; y += 6) hatch.push(`M32 ${y} l 20 -6`)
      break
    }
    case 'plan': {
      ink.push(...body(86, 30, ['M68 70 C 60 96, 66 112, 84 120', 'M104 70 C 116 90, 120 104, 112 120']))
      ink.push('M74 30 C 70 14, 102 14, 98 30', 'M70 34 l -6 10') // гарнитура
      ink.push('M84 104 L 124 104 L 124 160 L 84 160 Z', 'M98 100 h 12 v 6 h -12 z') // планшет с зажимом
      for (let y = 116; y < 156; y += 9) ink.push(`M92 ${y} l 3 3 l 6 -7`, `M104 ${y} h 14`)
      for (let y = 40; y < 220; y += 8) hatch.push(`M150 ${y} l 18 -10`)
      break
    }
    case 'mic': {
      // студийный микрофон на стойке и поп-фильтр
      ink.push('M140 220 V 96', 'M126 220 H 154', 'M140 96 L 116 78', 'M106 64 a12 16 0 1 0 0.1 0', 'M86 78 a18 18 0 1 0 0.1 0')
      ink.push(...body(52, 40, ['M34 80 C 30 100, 36 116, 44 128', 'M70 80 C 80 92, 86 104, 84 118']))
      ink.push('M38 50 C 34 30, 70 30, 66 50', 'M36 50 h -6 v 12 h 6', 'M68 50 h 6 v 12 h -6') // наушники
      for (let r = 0; r < 3; r++) ink.push(`M${90 + r * 10} ${58 - r * 4} a${16 + r * 8} ${16 + r * 8} 0 0 1 0 ${34 + r * 16}`)
      for (let y = 100; y < 220; y += 7) hatch.push(`M150 ${y} l 16 -9`)
      break
    }
    case 'sport': {
      ink.push(...body(100, 44, ['M82 84 C 74 66, 72 46, 74 26', 'M118 84 C 126 66, 128 46, 126 26']))
      ink.push('M60 26 H 140', 'M58 14 v 24', 'M66 16 v 20', 'M142 14 v 24', 'M134 16 v 20') // штанга над головой
      for (let x = 150; x < 196; x += 6) hatch.push(`M${x} 214 l -8 -20`)
      ink.push('M20 214 H 180')
      break
    }
    case 'phone': {
      // рука с телефоном и бумажный самолётик с пунктиром
      ink.push('M40 228 C 50 190, 60 170, 70 150', 'M110 228 C 108 200, 112 180, 118 158')
      ink.push('M66 70 L 122 70 L 122 168 L 66 168 Z', 'M72 78 h 44 v 74 h -44 z')
      ink.push('M86 116 l 18 -12 l -4 22 l -5 -6 z')
      ink.push('M150 40 L 188 26 L 172 62 L 164 48 Z', 'M164 48 L 188 26')
      ink.push('M100 104 C 120 80, 130 70, 150 52')
      for (let y = 160; y < 226; y += 7) hatch.push(`M54 ${y} l 18 -6`)
      break
    }
  }
  return { ink, hatch }
})

const labels: Record<SketchKind, string> = {
  ruler: 'Набросок: высокий человек у ростомера с микрофоном',
  stage: 'Набросок: ведущий на сцене под прожектором',
  laptop: 'Набросок: за ноутбуком',
  plan: 'Набросок: с гарнитурой и планом мероприятия',
  mic: 'Набросок: в наушниках у студийного микрофона',
  sport: 'Набросок: со штангой над головой',
  phone: 'Набросок: телефон и бумажный самолётик Telegram',
}
</script>

<template>
  <figure class="polaroid">
    <img v-if="photo" class="photo" :src="photo" :alt="caption || ''" />
    <svg v-else viewBox="0 0 200 230" role="img" :aria-label="labels[kind]">
      <rect width="200" height="230" fill="#f2f1ec" />
      <g stroke="#6e6e72" stroke-width="0.9" opacity="0.5" fill="none" stroke-linecap="round">
        <path v-for="(d, i) in scene.hatch" :key="'h' + i" :d="d" />
      </g>
      <g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#hand-wobble)">
        <!-- второй, лёгкий проход линии со сдвигом — так рука рисует карандашом -->
        <path v-for="(d, i) in scene.ink" :key="'s' + i" :d="d" stroke="#3a3a3e" stroke-width="1" opacity="0.4" transform="translate(0.8 0.6)" />
        <path v-for="(d, i) in scene.ink" :key="'i' + i" :d="d" stroke="#232326" stroke-width="2" />
      </g>
    </svg>
    <figcaption v-if="caption" class="hand">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.polaroid {
  margin: 0;
  padding: 10px 10px 8px;
  background:
    linear-gradient(160deg, rgb(255 255 255 / 0.5), transparent 40%),
    #fbfbf8;
  box-shadow:
    0 1px 1px rgb(0 0 0 / 0.18),
    0 10px 20px -8px rgb(0 0 0 / 0.4);
}
.polaroid svg,
.photo {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 200 / 230;
  object-fit: cover;
  filter: contrast(1.02);
}
figcaption {
  padding-top: 6px;
  color: var(--ink-soft);
  font-size: 0.95rem;
  text-align: center;
}
</style>
