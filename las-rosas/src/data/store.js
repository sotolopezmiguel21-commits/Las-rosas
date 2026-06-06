import { useState, useEffect } from 'react'

let _damages = [
  {
    id: 'D001',
    sectorId: 'BAN_N1',
    floor: 1,
    cell: 'B2',
    description: 'Llave del lavamanos gotea constantemente',
    solution: 'Cambio de cartucho o reemplazo de llave',
    priority: 'media',
    supplies: 'Llave nueva FV o cartucho de repuesto, llave inglesa',
    photo: null,
    photoResolved: null,
    dateCreated: '2026-05-10',
    dateResolved: null,
    status: 'active',
  },
  {
    id: 'D002',
    sectorId: 'PAS_N',
    floor: 1,
    cell: 'C3',
    description: 'Ampolleta fundida, pasillo oscuro de noche',
    solution: 'Reemplazar ampolleta LED',
    priority: 'alta',
    supplies: 'Ampolleta LED 9W E27',
    photo: null,
    photoResolved: null,
    dateCreated: '2026-05-11',
    dateResolved: null,
    status: 'active',
  },
]

let _listeners = []

const notify = () => _listeners.forEach(fn => fn([..._damages]))

export const damageStore = {
  getAll: () => [..._damages],

  subscribe: (fn) => {
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter(l => l !== fn)
    }
  },

  add: (damage) => {
    const id = 'D' + String(_damages.length + 1).padStart(3, '0')
    const newDamage = { ...damage, id }
    _damages = [..._damages, newDamage]
    notify()
    return id
  },

  update: (id, changes) => {
    _damages = _damages.map(d => d.id === id ? { ...d, ...changes } : d)
    notify()
  },

  resolve: (id, photoResolved) => {
    const today = new Date().toISOString().split('T')[0]
    _damages = _damages.map(d =>
      d.id === id
        ? { ...d, status: 'resolved', dateResolved: today, photoResolved }
        : d
    )
    notify()
  },

  loadFromSheets: (damages) => {
    _damages = damages
    notify()
  },
}

export function useDamages() {
  const [damages, setDamages] = useState(() => damageStore.getAll())

  useEffect(() => {
    setDamages(damageStore.getAll())
    return damageStore.subscribe(setDamages)
  }, [])

  return damages
}