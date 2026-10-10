import type { AccentColor } from '../types'

/**
 * Colores de acento elegibles. Cada uno trae su versión para modo oscuro y claro
 * con la "tinta" (texto encima del botón), verificados a ≥ 4.5:1 de contraste.
 */
export const ACCENTS: { id: AccentColor; name: string; dark: [string, string]; light: [string, string] }[] = [
  { id: 'lime', name: 'Lima', dark: ['#c6f432', '#11140a'], light: ['#4d7a00', '#ffffff'] },
  { id: 'blue', name: 'Azul', dark: ['#60a5fa', '#04122b'], light: ['#1d4ed8', '#ffffff'] },
  { id: 'purple', name: 'Morado', dark: ['#c4a7ff', '#1a0b33'], light: ['#7c3aed', '#ffffff'] },
  { id: 'pink', name: 'Rosa', dark: ['#ff7ab6', '#2b0616'], light: ['#be185d', '#ffffff'] },
  { id: 'orange', name: 'Naranja', dark: ['#ff9f1c', '#1a0f00'], light: ['#b45309', '#ffffff'] },
  { id: 'red', name: 'Rojo', dark: ['#ff6b6b', '#2b0606'], light: ['#c0262d', '#ffffff'] },
  { id: 'teal', name: 'Turquesa', dark: ['#2dd4bf', '#042f2a'], light: ['#0f766e', '#ffffff'] },
]

export const accentInfo = (id: AccentColor) => ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]
