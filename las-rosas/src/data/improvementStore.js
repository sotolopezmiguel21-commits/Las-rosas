import { useState, useEffect } from 'react'

let _improvements = []
let _listeners = []

const notify = () => _listeners.forEach(fn => fn([..._improvements]))

export const improvementStore = {
  getAll: () => [..._improvements],

  getBySector: (sectorId) =>
    _improvements.filter(i => i.sectorId === sectorId),

  subscribe: (fn) => {
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter(l => l !== fn)
    }
  },

  add: (item) => {
    const id = 'M' + String(_improvements.length + 1).padStart(3, '0')
    const newItem = { ...item, id }
    _improvements = [..._improvements, newItem]
    notify()
    return id
  },

  update: (id, changes) => {
    _improvements = _improvements.map(i =>
      i.id === id ? { ...i, ...changes } : i
    )
    notify()
  },

  remove: (id) => {
    _improvements = _improvements.filter(i => i.id !== id)
    notify()
  },

  complete: (id) => {
    const today = new Date().toISOString().split('T')[0]
    _improvements = _improvements.map(i =>
      i.id === id ? { ...i, status: 'done', dateCompleted: today } : i
    )
    notify()
  },

  loadFromSheets: (items) => {
    _improvements = items
    notify()
  },
}

export const IMPROVEMENT_TYPES = {
  seguridad:      { label: 'Seguridad',      icon: '🛡️', color: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D' },
  confort:        { label: 'Confort',         icon: '🛋️', color: '#3B5FCC', bg: '#EEF4FF', text: '#1E3A8A' },
  estetica:       { label: 'Estética',        icon: '✨', color: '#9333EA', bg: '#F5F0FF', text: '#6B21A8' },
  funcionalidad:  { label: 'Funcionalidad',   icon: '⚙️', color: '#EF9F27', bg: '#FAEEDA', text: '#BA7517' },
}

export const IMPROVEMENT_HEADERS = [
  'id', 'sectorId', 'sectorName', 'floor',
  'description', 'type',
  'dateCreated', 'dateCompleted', 'status',
]

export function useImprovements() {
  const [improvements, setImprovements] = useState(() => improvementStore.getAll())
  useEffect(() => {
    return improvementStore.subscribe(setImprovements)
  }, [])
  return improvements
}

export function useSectorImprovements(sectorId) {
  const [improvements, setImprovements] = useState(() =>
    improvementStore.getBySector(sectorId)
  )
  useEffect(() => {
    return improvementStore.subscribe(all => {
      setImprovements(all.filter(i => i.sectorId === sectorId))
    })
  }, [sectorId])
  return improvements
}