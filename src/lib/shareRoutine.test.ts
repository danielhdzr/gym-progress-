import { describe, expect, it } from 'vitest'
import type { Routine } from '../types'
import { defaultState } from './defaults'
import { buildRoutines, TEMPLATES } from './templates'
import { appBaseUrl, decodeRoutine, encodeRoutine, importRoutine, routineCodeFromHash, shareUrl } from './shareRoutine'

const base = defaultState()
const [torsoA] = buildRoutines(TEMPLATES.find((t) => t.id === 'powerbuilding')!, base.exercises)

describe('compartir rutinas por enlace', () => {
  it('ida y vuelta conserva nombre, objetivo y esquema de cada ejercicio', () => {
    const p = decodeRoutine(encodeRoutine(torsoA, base.exercises))
    const { routine } = importRoutine(base, p)
    expect(routine.name).toBe('Powerbuilding · Torso A')
    expect(routine.goal).toBe('powerbuilding')
    expect(routine.items.map((i) => [i.exerciseId, i.sets, i.target?.goal])).toEqual(torsoA.items.map((i) => [i.exerciseId, i.sets, i.target?.goal]))
    expect(routine.id).not.toBe(torsoA.id)
  })

  it('incluye ejercicios propios y no los duplica si ya existen con el mismo nombre', () => {
    const mine = { id: 'mi-ej', name: 'Press Landmine', muscle: 'Hombros', repMin: 8, repMax: 12, increment: 2.5 }
    const r: Routine = { id: 'r', name: 'Mía', items: [{ exerciseId: 'mi-ej', sets: 3 }, { exerciseId: 'bench', sets: 3 }] }
    const code = encodeRoutine(r, [...base.exercises, mine])
    // Quien la recibe no tiene el ejercicio: se crea
    const a = importRoutine(base, decodeRoutine(code))
    expect(a.state.exercises.some((e) => e.name === 'Press Landmine')).toBe(true)
    // Quien ya tiene uno con el mismo nombre (otro id): se reutiliza
    const theirs = { ...base, exercises: [...base.exercises, { ...mine, id: 'otro-id', name: 'press landmine' }] }
    const b = importRoutine(theirs, decodeRoutine(code))
    expect(b.state.exercises.length).toBe(theirs.exercises.length)
    expect(b.routine.items[0].exerciseId).toBe('otro-id')
  })

  it('la dirección base sale bien con rutas relativas (sin punto suelto ni parámetros)', () => {
    expect(appBaseUrl('https://danielhdzr.github.io/gym-progress-/', './')).toBe('https://danielhdzr.github.io/gym-progress-/')
    expect(appBaseUrl('https://danielhdzr.github.io/gym-progress-/?fecha=2026-10-02#x', './')).toBe('https://danielhdzr.github.io/gym-progress-/')
    expect(appBaseUrl('http://localhost:5173/', './')).toBe('http://localhost:5173/')
  })

  it('arma y lee el enlace con #rutina=', () => {
    const url = shareUrl('abc', 'https://x.io/app/')
    expect(url).toBe('https://x.io/app/#rutina=abc')
    expect(routineCodeFromHash('#rutina=abc')).toBe('abc')
    expect(routineCodeFromHash('#otra')).toBeNull()
  })

  it('rechaza enlaces inválidos o manipulados', () => {
    const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '')
    expect(() => decodeRoutine('no-es-base64!!')).toThrow()
    expect(() => decodeRoutine(enc({ v: 2, n: 'x', i: [['bench', 3]] }))).toThrow()
    expect(() => decodeRoutine(enc({ v: 1, n: 'x', i: [['bench', 99]] }))).toThrow()
    expect(() => decodeRoutine(enc({ v: 1, n: 'x', i: [['no-existe', 3]] }))).toThrow()
    expect(() => decodeRoutine(enc({ v: 1, n: 'x'.repeat(200), i: [['bench', 3]] }))).toThrow()
    expect(() => decodeRoutine(enc({ v: 1, n: 'x', i: [['bench', 3, 's', 10, 5, 120]] }))).toThrow()
  })

  it('maneja acentos y emojis en el nombre', () => {
    const r: Routine = { id: 'r', name: 'Día de pierna 🦵', items: [{ exerciseId: 'squat', sets: 4 }] }
    expect(decodeRoutine(encodeRoutine(r, base.exercises)).n).toBe('Día de pierna 🦵')
  })
})
