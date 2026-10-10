import type { CardioSession, CountryCode, Exercise, Workout } from '../types'
import { bestSet, prsIn, sessionsFor } from './progression'
import { fmtAmount, metricOf } from './metric'

/**
 * Temas por hora del día, estación y fechas especiales (festivos, cumpleaños,
 * aniversario y meses cumplidos entrenando). Todo es puro y determinista:
 * recibe la fecha y devuelve qué mostrar, para poder probarlo.
 */

export const COUNTRIES: { code: CountryCode; name: string; flag: string; south: boolean }[] = [
  { code: 'MX', name: 'México', flag: '🇲🇽', south: false },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', south: false },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', south: false },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', south: true },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', south: true },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', south: true },
  { code: 'ES', name: 'España', flag: '🇪🇸', south: false },
]

export const countryInfo = (c: CountryCode) => COUNTRIES.find((x) => x.code === c) ?? COUNTRIES[0]

/* ---------- Colores ---------- */

/** Acento para modo oscuro y claro (color + tinta legible encima) y degradado del encabezado. */
export interface Palette {
  dark: [string, string]
  light: [string, string]
  gradient: [string, string]
}

const P = {
  gold: { dark: ['#ffd166', '#2b2000'], light: ['#a16207', '#ffffff'], gradient: ['#ffd166', '#ff9f1c'] },
  pink: { dark: ['#ff7ab6', '#2b0616'], light: ['#be185d', '#ffffff'], gradient: ['#ff7ab6', '#c4a7ff'] },
  orange: { dark: ['#ff9f1c', '#1a0f00'], light: ['#b45309', '#ffffff'], gradient: ['#ff9f1c', '#7a3bdb'] },
  red: { dark: ['#ff6b6b', '#2b0606'], light: ['#c0262d', '#ffffff'], gradient: ['#ff6b6b', '#3ddc84'] },
  green: { dark: ['#3ddc84', '#062b12'], light: ['#15803d', '#ffffff'], gradient: ['#3ddc84', '#ff6b6b'] },
  lilac: { dark: ['#c4a7ff', '#1a0b33'], light: ['#7c3aed', '#ffffff'], gradient: ['#c4a7ff', '#8ee3c8'] },
  marigold: { dark: ['#ffb000', '#2b1d00'], light: ['#b45309', '#ffffff'], gradient: ['#ffb000', '#d946ef'] },
  magenta: { dark: ['#e879f9', '#2b062b'], light: ['#a21caf', '#ffffff'], gradient: ['#e879f9', '#ffd166'] },
  sky: { dark: ['#60a5fa', '#04122b'], light: ['#1d4ed8', '#ffffff'], gradient: ['#60a5fa', '#ff6b6b'] },
  yellow: { dark: ['#fde047', '#2b2600'], light: ['#a16207', '#ffffff'], gradient: ['#fde047', '#60a5fa'] },
} satisfies Record<string, Palette>

export type TimeOfDay = 'morning' | 'afternoon' | 'night'

export function timeOfDay(d: Date): TimeOfDay {
  const h = d.getHours()
  return h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 19 ? 'afternoon' : 'night'
}

export const TIME_THEME: Record<TimeOfDay, { emoji: string; gradient: [string, string] }> = {
  morning: { emoji: '🌅', gradient: ['#ffb37a', '#ffe08a'] },
  afternoon: { emoji: '☀️', gradient: ['#ffcf5c', '#7cc4ff'] },
  night: { emoji: '🌙', gradient: ['#3b4bdb', '#7a3bdb'] },
}

/* ---------- Estaciones ---------- */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const SEASONS: Record<Season, { name: string; emoji: string }> = {
  spring: { name: 'Primavera', emoji: '🌸' },
  summer: { name: 'Verano', emoji: '☀️' },
  autumn: { name: 'Otoño', emoji: '🍂' },
  winter: { name: 'Invierno', emoji: '❄️' },
}

/** Inicio aproximado de cada estación astronómica (hemisferio norte). Varía ±1 día según el año. */
const NORTH_STARTS: [number, number, Season][] = [
  [3, 20, 'spring'],
  [6, 21, 'summer'],
  [9, 22, 'autumn'],
  [12, 21, 'winter'],
]
const OPPOSITE: Record<Season, Season> = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' }

const md = (d: Date) => (d.getMonth() + 1) * 100 + d.getDate()

export function seasonOf(d: Date, south = false): Season {
  const v = md(d)
  let s: Season = 'winter'
  for (const [m, day, season] of NORTH_STARTS) if (v >= m * 100 + day) s = season
  return south ? OPPOSITE[s] : s
}

/** Si hoy empieza una estación (equinoccio o solsticio). */
export function seasonStartingToday(d: Date, south = false): { season: Season; kind: 'equinoccio' | 'solsticio' } | null {
  const hit = NORTH_STARTS.find(([m, day]) => d.getMonth() + 1 === m && d.getDate() === day)
  if (!hit) return null
  const kind = hit[0] === 3 || hit[0] === 9 ? 'equinoccio' : 'solsticio'
  return { season: south ? OPPOSITE[hit[2]] : hit[2], kind }
}

/* ---------- Fechas móviles ---------- */

/** Domingo de Pascua (algoritmo gregoriano anónimo, "Meeus/Jones/Butcher"). */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

/** n-ésimo día de la semana de un mes (ej. 4.º jueves de noviembre). weekday: 0 = domingo. */
export function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month - 1, 1)
  const offset = (weekday - first.getDay() + 7) % 7
  return new Date(year, month - 1, 1 + offset + (n - 1) * 7)
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/* ---------- Festivos ---------- */

interface Holiday {
  id: string
  emoji: string
  palette: Palette
  countries?: CountryCode[]
  /** ¿Cae en esta fecha? */
  on: (d: Date) => boolean
  /** Tres tonos (humor fitness, inspirador, saludo simple) como [mensaje completo, versión corta]. `n` = ", Daniel" o "". */
  messages: (n: string) => [Msg, Msg, Msg]
}

/** [mensaje completo, versión corta para el encabezado] */
type Msg = [string, string]

const fixed = (month: number, ...days: number[]) => (d: Date) => d.getMonth() + 1 === month && days.includes(d.getDate())

/** Mensajes para fiestas patrias, con nombre de la fiesta y bandera. */
const national = (name: string, flag: string) => (n: string): [Msg, Msg, Msg] => [
  [`${flag} ¡Feliz ${name}${n}! Hoy se celebra en grande… después de entrenar 💪`, `${flag} Hoy se celebra… después de entrenar`],
  [`${flag} ¡Feliz ${name}${n}! Que tu disciplina sea tan grande como tu orgullo por tu tierra.`, `${flag} Disciplina tan grande como tu orgullo`],
  [`${flag} ¡Feliz ${name}${n}!`, `${flag} ¡Feliz ${name}!`],
]

export const HOLIDAYS: Holiday[] = [
  {
    id: 'new-year',
    emoji: '🎆',
    palette: P.gold,
    on: fixed(1, 1, 2),
    messages: (n) => [
      [`🎆 ¡Feliz Año Nuevo${n}! Propósito #1: que el gym no sea solo de enero.`, '🎆 Que el gym no sea solo de enero'],
      [`🎆 ¡Feliz Año Nuevo${n}! Que este sea el año de tus mejores marcas.`, '🎆 El año de tus mejores marcas'],
      [`🎆 ¡Feliz Año Nuevo${n}!`, '🎆 ¡Feliz Año Nuevo!'],
    ],
  },
  {
    id: 'valentine',
    emoji: '❤️',
    palette: P.pink,
    on: fixed(2, 14),
    messages: (n) => [
      [`❤️ ¡Feliz San Valentín${n}! Tu relación más estable: tú y las pesas.`, '❤️ Tu relación más estable: las pesas'],
      [`❤️ ¡Feliz San Valentín${n}! Quererte también es cuidarte.`, '❤️ Quererte también es cuidarte'],
      [`❤️ ¡Feliz San Valentín${n}!`, '❤️ ¡Feliz San Valentín!'],
    ],
  },
  {
    id: 'activity-day',
    emoji: '🏃',
    palette: P.sky,
    on: fixed(4, 6),
    messages: (n) => [
      [`🏃 Hoy es el Día Mundial de la Actividad Física${n}. Tú lo celebras casi diario 😎`, '🏃 Día de la Actividad Física: tú ya cumples'],
      [`🏃 Día Mundial de la Actividad Física: cada entreno cuenta${n}. ¡Celébralo moviéndote!`, '🏃 Hoy cada movimiento cuenta'],
      [`🏃 ¡Feliz Día Mundial de la Actividad Física${n}!`, '🏃 Día Mundial de la Actividad Física'],
    ],
  },
  {
    id: 'easter',
    emoji: '🐣',
    palette: P.lilac,
    on: (d) => sameDay(d, easterSunday(d.getFullYear())),
    messages: (n) => [
      [`🐣 ¡Felices Pascuas${n}! Que lo único que escondas hoy sean los huevos, no las ganas de entrenar.`, '🐣 Esconde huevos, no las ganas de entrenar'],
      [`🐣 ¡Felices Pascuas${n}! Buen día para renacer y empezar una nueva racha.`, '🐣 Buen día para empezar una nueva racha'],
      [`🐣 ¡Felices Pascuas${n}!`, '🐣 ¡Felices Pascuas!'],
    ],
  },
  {
    id: 'halloween',
    emoji: '🎃',
    palette: P.orange,
    on: fixed(10, 31),
    messages: (n) => [
      [`🎃 ¡Feliz Halloween${n}! Lo único que debería dar miedo es saltarte el día de pierna.`, '🎃 Lo único que da miedo: saltarte pierna'],
      [`🎃 ¡Feliz Halloween${n}! Disfrázate de la mejor versión de ti.`, '🎃 Disfrázate de tu mejor versión'],
      [`🎃 ¡Feliz Halloween${n}!`, '🎃 ¡Feliz Halloween!'],
    ],
  },
  {
    id: 'christmas',
    emoji: '🎄',
    palette: P.red,
    on: fixed(12, 24, 25),
    messages: (n) => [
      [`🎄 ¡Feliz Navidad${n}! Hoy los carbohidratos son parte del plan.`, '🎄 Hoy los carbohidratos son parte del plan'],
      [`🎄 ¡Feliz Navidad${n}! El mejor regalo que te has dado este año es cuidarte.`, '🎄 Tu mejor regalo: cuidarte'],
      [`🎄 ¡Feliz Navidad${n}!`, '🎄 ¡Feliz Navidad!'],
    ],
  },
  {
    id: 'year-end',
    emoji: '🥂',
    palette: P.gold,
    on: fixed(12, 31),
    messages: (n) => [
      [`🥂 Último día del año${n}: el entreno de hoy es oficialmente legendario.`, '🥂 Último entreno del año: legendario'],
      [`🥂 Gracias por no rendirte este año${n}. Lo mejor viene.`, '🥂 Gracias por no rendirte este año'],
      [`🥂 ¡Feliz fin de año${n}!`, '🥂 ¡Feliz fin de año!'],
    ],
  },
  // México
  {
    id: 'mx-independence',
    emoji: '🇲🇽',
    palette: P.green,
    countries: ['MX'],
    on: fixed(9, 15, 16),
    messages: (n) => [
      [`🇲🇽 ¡Viva México${n}! Hoy se vale el pozole… mañana, sentadillas.`, '🇲🇽 Hoy pozole, mañana sentadillas'],
      [`🇲🇽 ¡Viva México${n}! Que tu disciplina sea tan grande como nuestra historia.`, '🇲🇽 Disciplina tan grande como nuestra historia'],
      [`🇲🇽 ¡Feliz día de la Independencia${n}!`, '🇲🇽 ¡Viva México!'],
    ],
  },
  {
    id: 'mx-muertos',
    emoji: '💀',
    palette: P.marigold,
    countries: ['MX'],
    on: fixed(11, 1, 2),
    messages: (n) => [
      [`💀 ¡Feliz Día de Muertos${n}! Que lo único muerto hoy sean tus excusas.`, '💀 Que lo único muerto sean tus excusas'],
      [`💀 Día de Muertos${n}: la mejor forma de honrar a quienes ya no están es vivir plenamente.`, '💀 Honrarlos es vivir plenamente'],
      [`💀 ¡Feliz Día de Muertos${n}!`, '💀 ¡Feliz Día de Muertos!'],
    ],
  },
  {
    id: 'mx-revolution',
    emoji: '🇲🇽',
    palette: P.red,
    countries: ['MX'],
    on: fixed(11, 20),
    messages: (n) => [
      [`🇲🇽 Día de la Revolución${n}: revoluciona tu rutina con día de pierna.`, '🇲🇽 Revoluciona tu rutina: día de pierna'],
      [`🇲🇽 Día de la Revolución${n}: todo gran cambio empieza con una decisión.`, '🇲🇽 Todo gran cambio empieza con una decisión'],
      [`🇲🇽 ¡Feliz Día de la Revolución${n}!`, '🇲🇽 ¡Feliz Día de la Revolución!'],
    ],
  },
  // Otros países
  { id: 'us-independence', emoji: '🇺🇸', palette: P.sky, countries: ['US'], on: fixed(7, 4), messages: national('4 de julio', '🇺🇸') },
  {
    id: 'us-thanksgiving',
    emoji: '🦃',
    palette: P.orange,
    countries: ['US'],
    on: (d) => sameDay(d, nthWeekday(d.getFullYear(), 11, 4, 4)),
    messages: (n) => [
      [`🦃 ¡Feliz Día de Acción de Gracias${n}! Hoy el pavo no cuenta; mañana el cardio sí.`, '🦃 Hoy el pavo no cuenta; mañana el cardio sí'],
      [`🦃 ¡Feliz Día de Acción de Gracias${n}! Agradece a tu cuerpo todo lo que puede hacer.`, '🦃 Agradece todo lo que tu cuerpo puede hacer'],
      [`🦃 ¡Feliz Día de Acción de Gracias${n}!`, '🦃 ¡Feliz Acción de Gracias!'],
    ],
  },
  { id: 'co-independence', emoji: '🇨🇴', palette: P.yellow, countries: ['CO'], on: fixed(7, 20), messages: national('Día de la Independencia', '🇨🇴') },
  { id: 'ar-independence', emoji: '🇦🇷', palette: P.sky, countries: ['AR'], on: fixed(7, 9), messages: national('Día de la Independencia', '🇦🇷') },
  { id: 'cl-fiestas', emoji: '🇨🇱', palette: P.red, countries: ['CL'], on: fixed(9, 18), messages: national('Fiestas Patrias', '🇨🇱') },
  { id: 'pe-independence', emoji: '🇵🇪', palette: P.red, countries: ['PE'], on: fixed(7, 28), messages: national('Fiestas Patrias', '🇵🇪') },
  { id: 'es-national', emoji: '🇪🇸', palette: P.yellow, countries: ['ES'], on: fixed(10, 12), messages: national('Día de la Fiesta Nacional', '🇪🇸') },
]

/* ---------- Ocasiones personales ---------- */

const DAY = 24 * 60 * 60 * 1000
const dayIndex = (d: Date) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / DAY)
const pick = <T,>(list: T[], seed: number) => list[((seed % list.length) + list.length) % list.length]
const msg = ([message, short]: Msg) => ({ message, short })
const withName = (name: string) => (name.trim() ? `, ${name.trim()}` : '')
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "YYYY-MM-DD" → Date local. */
const parseYmd = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const daysInMonth = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate()

/**
 * Meses completos desde `start` si hoy es su "día-aniversario mensual"; si no, null.
 * Si empezaste un 31, en meses más cortos cuenta el último día del mes.
 */
export function monthsCompletedToday(start: Date, today: Date): number | null {
  const months = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth())
  if (months < 1) return null
  const target = Math.min(start.getDate(), daysInMonth(today.getFullYear(), today.getMonth()))
  return today.getDate() === target ? months : null
}

/** "1 año y 3 meses", "6 meses" */
export function fmtMonths(months: number) {
  const y = Math.floor(months / 12)
  const m = months % 12
  if (!y) return plural(m, 'mes', 'meses')
  return m ? `${plural(y, 'año', 'años')} y ${plural(m, 'mes', 'meses')}` : plural(y, 'año', 'años')
}

function stageMessage(months: number, n: string): string {
  const t = fmtMonths(months)
  switch (months) {
    case 1:
      return `📅 ¡1 mes entrenando${n}! El primer mes es el más difícil y ya lo superaste.`
    case 2:
      return `📅 ¡2 meses entrenando${n}! Ya no es motivación: es hábito.`
    case 3:
      return `📅 ¡3 meses entrenando${n}! Los cambios ya se empiezan a notar.`
    case 6:
      return `📅 ¡Medio año entrenando${n}! Esto ya es un estilo de vida.`
    case 9:
      return `📅 ¡9 meses de constancia${n}! Estás a nada de cumplir un año.`
    default:
      return `📅 ¡${t} entrenando${n}! Un mes más sumando. Sigue así.`
  }
}

/** Ejercicio con mayor mejora desde su primera sesión: "Tu press banca pasó de 50 a 65 kg". */
export function bestImprovement(workouts: Workout[], exercises: Exercise[]): string | null {
  let best: { ratio: number; text: string } | null = null
  for (const ex of exercises) {
    const sessions = sessionsFor(ex.id, workouts)
    if (sessions.length < 2) continue
    const metric = metricOf(ex)
    const first = bestSet(sessions[0].sets, metric)
    const top = sessions.map((s) => bestSet(s.sets, metric)).reduce((a, b) => (b.score > a.score ? b : a))
    if (first.score <= 0 || top.score <= first.score) continue
    const ratio = top.score / first.score
    const name = ex.name.charAt(0).toLowerCase() + ex.name.slice(1)
    const text =
      top.weight > 0 && top.weight !== first.weight
        ? `Tu ${name} pasó de ${first.weight} a ${top.weight} kg desde que empezaste 🔥`
        : `Tu ${name} pasó de ${fmtAmount(first.reps, metric)} a ${fmtAmount(top.reps, metric)} desde que empezaste 🔥`
    if (!best || ratio > best.ratio) best = { ratio, text }
  }
  return best?.text ?? null
}

/** Datos para el mensaje de aniversario: entrenos, récords y km de cardio desde que empezaste. */
export function trainingStats(workouts: Workout[], exercises: Exercise[], cardio: CardioSession[]) {
  const done = workouts.filter((w) => w.finishedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  let prs = 0
  done.forEach((w, i) => (prs += prsIn(w, done.slice(0, i), exercises).length))
  const km = Math.round(cardio.reduce((n, s) => n + s.distanceKm, 0))
  return { workouts: done.length, prs, km }
}

/* ---------- Resultado ---------- */

export interface Occasion {
  id: string
  emoji: string
  /** Mensaje completo (se ve al tocar el encabezado) */
  message: string
  /** Una línea para el encabezado, sin el nombre (ya va en el saludo) */
  short: string
  /** Línea secundaria (p. ej. tu mejor avance) */
  detail?: string
  palette: Palette
}

export interface OccasionInput {
  now: Date
  name: string
  country: CountryCode
  /** YYYY-MM-DD o "" */
  birthday: string
  /** YYYY-MM-DD o "" (si está vacío se usa la fecha del primer entreno) */
  trainingStart: string
  workouts: Workout[]
  exercises: Exercise[]
  cardio: CardioSession[]
}

/** Fecha de inicio efectiva: la configurada o la del primer entreno. */
export function effectiveTrainingStart(trainingStart: string, workouts: Workout[]): Date | null {
  if (trainingStart) return parseYmd(trainingStart)
  const first = workouts.filter((w) => w.finishedAt).map((w) => w.startedAt).sort()[0]
  if (!first) return null
  const d = new Date(first)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Ocasión del día, por prioridad: cumpleaños > aniversario > mes cumplido >
 * festivo nacional > festivo internacional > inicio de estación.
 */
export function occasionFor(input: OccasionInput): Occasion | null {
  const { now, country, workouts, exercises, cardio } = input
  const n = withName(input.name)
  const year = now.getFullYear()
  const seed = dayIndex(now)

  if (input.birthday) {
    const b = parseYmd(input.birthday)
    // 29 de febrero: en años no bisiestos se celebra el 28
    const bDay = Math.min(b.getDate(), daysInMonth(year, b.getMonth()))
    if (now.getMonth() === b.getMonth() && now.getDate() === bDay) {
      return {
        id: 'birthday',
        emoji: '🎂',
        palette: P.magenta,
        ...msg(
          pick<Msg>(
            [
              [`🎂 ¡Feliz cumpleaños${n}! Es un orgullo acompañarte en este viaje.`, '🎂 ¡Feliz cumpleaños! Un orgullo acompañarte'],
              [`🎂 ¡Feliz cumpleaños${n}! Un año más fuerte que el anterior. Hoy el mejor ejercicio es disfrutar.`, '🎂 ¡Feliz cumpleaños! Un año más fuerte'],
              [`🎂 ¡Feliz cumpleaños${n}! Hoy el pastel no cuenta como trampa. Mañana lo quemamos 💪`, '🎂 ¡Feliz cumpleaños! Hoy el pastel no es trampa'],
            ],
            year,
          ),
        ),
      }
    }
  }

  const start = effectiveTrainingStart(input.trainingStart, workouts)
  if (start) {
    const months = monthsCompletedToday(start, now)
    if (months && months % 12 === 0) {
      const years = months / 12
      const t = plural(years, 'año', 'años')
      const s = trainingStats(workouts, exercises, cardio)
      const data = [
        plural(s.workouts, 'entreno', 'entrenos'),
        plural(s.prs, 'récord', 'récords'),
        ...(s.km > 0 ? [`${s.km} km de cardio`] : []),
      ]
      const dataText = `${data.slice(0, -1).join(', ')} y ${data.at(-1)}`
      return {
        id: 'anniversary',
        emoji: '🏆',
        palette: P.gold,
        short: `🏆 ¡${t} entrenando! Feliz aniversario`,
        message: pick(
          [
            `🏆 ¡${t} entrenando${n}! ${dataText}. Mira todo lo que has construido.`,
            `🏆 Hace ${t} decidiste empezar. Tu yo de ese primer día estaría orgulloso de ti${n}.`,
            `🏆 ¡Feliz aniversario con las pesas${n}! ${t} y la relación sigue más fuerte que nunca 💪`,
          ],
          years - 1,
        ),
      }
    }
    if (months) {
      return {
        id: 'monthiversary',
        emoji: '📅',
        palette: P.gold,
        short: `📅 ¡${fmtMonths(months)} entrenando!`,
        message: stageMessage(months, n),
        detail: bestImprovement(workouts, exercises) ?? undefined,
      }
    }
  }

  const holidays = [
    ...HOLIDAYS.filter((h) => h.countries?.includes(country)),
    ...HOLIDAYS.filter((h) => !h.countries),
  ]
  const holiday = holidays.find((h) => h.on(now))
  if (holiday) {
    return { id: holiday.id, emoji: holiday.emoji, palette: holiday.palette, ...msg(pick(holiday.messages(n), seed)) }
  }

  const south = countryInfo(country).south
  const starting = seasonStartingToday(now, south)
  if (starting) {
    const { name, emoji } = SEASONS[starting.season]
    const article = starting.season === 'summer' || starting.season === 'winter' ? 'el' : 'la'
    const tips: Record<Season, string> = {
      spring: 'buen momento para renovar tu rutina',
      summer: 'hidrátate bien y aprovecha los días largos',
      autumn: 'temporada perfecta para salir a caminar o correr',
      winter: 'calienta bien antes de entrenar',
    }
    return {
      id: `season-${starting.season}`,
      emoji,
      palette: { spring: P.pink, summer: P.yellow, autumn: P.orange, winter: P.sky }[starting.season],
      short: `${emoji} Hoy empieza ${article} ${name.toLowerCase()}`,
      message: `${emoji} Hoy empieza ${article} ${name.toLowerCase()} (${starting.kind})${n}: ${tips[starting.season]}.`,
    }
  }

  return null
}

/** Permite previsualizar una fecha con ?fecha=YYYY-MM-DD o ?fecha=YYYY-MM-DDTHH:MM (solo cambia la apariencia). */
export function previewNow(search = typeof location !== 'undefined' ? location.search : ''): Date {
  const v = new URLSearchParams(search).get('fecha')
  if (v && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(v)) {
    const d = v.includes('T') ? new Date(v) : new Date(`${v}T10:00`)
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date()
}
