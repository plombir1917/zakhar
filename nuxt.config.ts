// Личный сайт !захар — «личное дело»: картонная папка на столе, которую
// листают по закладкам. Одна страница, разделы — якоря (#scena, #kod…):
// листание с анимацией не должно перезагружать папку.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  // Без префиксов папок: <PenNote>, а не <BitsPenNote> — имена и так говорящие.
  components: [{ path: '~/components', pathPrefix: false }],
  css: [
    // Шрифты лежат в проекте, а не тянутся с Google: у переменного
    // рукописного нужны все оси (full.css), а их в веб-API не отдают.
    '@fontsource-variable/shantell-sans/full.css',
    '@fontsource-variable/golos-text',
    '@fontsource/pt-mono/400.css',
    '@fontsource/ruslan-display/400.css',
    // Мир DJ Снюфа: техно-гротеск для пульта и текста флаера
    '@fontsource-variable/tektur',
    '~/assets/css/main.css',
  ],
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: '!захар — личное дело',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'Захар: ведущий программист, ведущий мероприятий, рэп под ником !захар и сведение под именем DJ Снюф. Личное дело — открывайте.',
        },
        { name: 'theme-color', content: '#1f1b17' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      // Без JS вступление не доиграет и так и закроет стол чёрным — прячем его
      noscript: [{ innerHTML: '<style>.intro{display:none}</style>' }],
    },
  },
})
