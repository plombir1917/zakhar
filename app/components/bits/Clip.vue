<template>
  <!-- Канцелярская скрепка: держит фото у края страницы -->
  <svg class="clip" viewBox="0 0 40 110" aria-hidden="true">
    <path
      d="M12 98 V 22 a 10 10 0 0 1 20 0 V 88 a 6 6 0 0 1 -12 0 V 30"
      fill="none"
      stroke="#9aa0a6"
      stroke-width="3.4"
      stroke-linecap="round"
    />
    <path
      d="M12 98 V 22 a 10 10 0 0 1 20 0 V 88 a 6 6 0 0 1 -12 0 V 30"
      fill="none"
      stroke="#eef1f4"
      stroke-width="1.2"
      stroke-linecap="round"
      transform="translate(-0.8 -0.8)"
    />
  </svg>
</template>

<style scoped>
.clip {
  width: 26px;
  height: 72px;
  filter: drop-shadow(1px 2px 1.5px rgb(0 0 0 / 0.35));
}
</style>
