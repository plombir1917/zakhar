<script setup lang="ts">
import { TELEGRAM } from '~/data/dossier'
withDefaults(defineProps<{ href?: string }>(), { href: TELEGRAM })
</script>

<template>
  <a class="tg" :href="href" target="_blank" rel="noopener">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M21.4 3.6 2.9 10.8c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.5c.3-1.3-.5-1.9-1.4-1.6Zm-3.3 3.6-8.6 7.8-.3 3.6-1.5-4.8 10-6.3c.5-.3.9 0 .4.3Z" />
    </svg>
    <slot />
  </a>
</template>
