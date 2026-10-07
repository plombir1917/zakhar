<template>
  <!--
    Фильтры для всего дела, один раз на страницу. Штамп рвёт края и теряет
    краску неравномерно — как резиновая печать, прижатая с разной силой;
    «рука» слегка гнёт ровные линии, чтобы рамки не выглядели начерченными.
  -->
  <svg width="0" height="0" style="position: absolute" aria-hidden="true" focusable="false">
    <defs>
      <filter id="stamp-ink" x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="bent" />
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="speck" />
        <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9" result="holes" />
        <feComposite in="bent" in2="holes" operator="in" />
      </filter>
      <filter id="hand-wobble" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="11" result="w" />
        <feDisplacementMap in="SourceGraphic" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
</template>
