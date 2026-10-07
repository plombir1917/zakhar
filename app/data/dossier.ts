// Содержимое дела. Всё, что человек читает, — здесь, а не в разметке:
// поправить формулировку не значит лезть в анимацию папки.

export const TELEGRAM = 'https://t.me/plombir1917'
export const TELEGRAM_HANDLE = '@plombir1917'
// Канал «документация к жизни» — там основные треки. С площадок треки на сайт
// не тянем: решение хозяина дела.
export const CHANNEL = 'https://t.me/+1KrnRe2OeSVhZWZi'
export const INSTAGRAM = 'https://www.instagram.com/plombir1917/'
export const VK = 'https://vk.com/plombir1917'

export type SectionId = 'anketa' | 'scena' | 'kod' | 'iventy' | 'muzyka' | 'lichnoe' | 'svyaz'

export interface Section {
  id: SectionId
  /** Надпись на закладке — простым словом, без шифров */
  tab: string
  /** Строка в описи на внутренней стороне обложки */
  inventory: string
  color: string
}

export const SECTIONS: Section[] = [
  { id: 'anketa', tab: 'Анкета', inventory: 'Анкета: кто такой', color: 'var(--tab-yellow)' },
  { id: 'scena', tab: 'Сцена', inventory: 'Сцена: веду события', color: 'var(--tab-pink)' },
  { id: 'kod', tab: 'Код', inventory: 'Код: работа и проекты', color: 'var(--tab-blue)' },
  { id: 'iventy', tab: 'Ивенты', inventory: 'Ивенты: организую', color: 'var(--tab-green)' },
  { id: 'muzyka', tab: 'Музыка', inventory: 'Музыка: рэп и сведение', color: 'var(--tab-violet)' },
  { id: 'lichnoe', tab: 'Личное', inventory: 'Личное: спорт и жизнь', color: 'var(--tab-orange)' },
  { id: 'svyaz', tab: 'Связь', inventory: 'Связь: как найти', color: 'var(--tab-red)' },
]

export interface Field {
  label: string
  value: string
  /** Пометка ручкой на полях */
  note?: string
  noteColor?: 'pen' | 'stamp'
}

export const ANKETA: Field[] = [
  { label: 'Имя', value: 'Захар', note: 'можно просто Захар' },
  { label: 'Позывной', value: '!захар', note: '«!» — потому что громкий' },
  { label: 'Рост', value: '200 см', note: '2 метра безобразия', noteColor: 'stamp' },
  { label: 'Возраст', value: 'молодой', note: 'точнее — под грифом', noteColor: 'stamp' },
  { label: 'Образование', value: 'бакалавриат и магистратура, программный инженер' },
  { label: 'Основная работа', value: 'ведущий программист, администрация региона' },
  { label: 'По совместительству', value: 'ведущий мероприятий, координатор событий' },
  { label: 'Увлечения', value: 'спорт, рэп, сведение треков' },
  { label: 'Особые приметы', value: 'виден издалека; в руках часто микрофон', note: 'проверено на свадьбах' },
]

export interface Evidence {
  no: number
  name: string
  url: string
  host: string
  shot: string
  shotPhone: string
  what: string
  facts: { label: string; value: string }[]
}

export const EVIDENCE: Evidence[] = [
  {
    no: 1,
    name: 'Футбольная академия «НЕО»',
    url: 'https://ffa-neo.ru/',
    host: 'ffa-neo.ru',
    shot: '/evidence/ffa-neo.jpg',
    shotPhone: '/evidence/ffa-neo-phone.jpg',
    what: 'Сайт детской футбольной академии в Липецке: программы, тренеры, площадки и запись на первое занятие прямо в Telegram.',
    facts: [
      { label: 'Для кого', value: 'родители юных футболистов' },
      { label: 'Сделано на', value: 'Nuxt, Tailwind' },
      { label: 'Состояние', value: 'работает, принимает заявки' },
    ],
  },
  {
    no: 2,
    name: 'vid — ролик из текста',
    url: 'https://vid-ai.ru/',
    host: 'vid-ai.ru',
    shot: '/evidence/vid-ai.jpg',
    shotPhone: '/evidence/vid-ai-phone.jpg',
    what: 'Сервис, который превращает текст в вертикальный ролик: пишет сценарий, озвучивает, рисует кадры, снимает клипы и сам монтирует.',
    facts: [
      { label: 'Для кого', value: 'блогеры, SMM, все, кому нужен ролик' },
      { label: 'Сделано на', value: 'Go, Nuxt, PostgreSQL' },
      { label: 'Состояние', value: 'в бою, с оплатой и очередью' },
    ],
  },
]
