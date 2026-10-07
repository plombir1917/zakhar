<script setup lang="ts">
withDefaults(defineProps<{ tilt?: number; width?: string }>(), { tilt: -6, width: '84px' })
</script>

<template>
  <!-- Кусок скотча: полупрозрачный, с рваными краями и бликом -->
  <span class="tape" :style="{ '--tilt': tilt + 'deg', width }" aria-hidden="true" />
</template>

<style scoped>
.tape {
  position: absolute;
  height: 26px;
  transform: rotate(var(--tilt));
  background:
    linear-gradient(100deg, rgb(255 255 255 / 0) 30%, rgb(255 255 255 / 0.35) 45%, rgb(255 255 255 / 0) 60%),
    rgb(240 235 210 / 0.55);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
  clip-path: polygon(2% 8%, 8% 0, 15% 10%, 24% 1%, 33% 9%, 45% 0, 56% 8%, 67% 1%, 78% 9%, 88% 0, 96% 7%, 100% 0,
    98% 92%, 92% 100%, 84% 91%, 73% 100%, 62% 92%, 50% 100%, 39% 92%, 28% 100%, 17% 91%, 8% 100%, 0 93%);
  backdrop-filter: blur(0.5px);
}
</style>
