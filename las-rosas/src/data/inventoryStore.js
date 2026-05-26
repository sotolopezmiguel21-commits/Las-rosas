import { useState, useEffect } from 'react'

let _inventory = []
let _listeners = []

const notify = () => _listeners.forEach(fn => fn([..._inventory]))

export const inventoryStore = {
  getAll: () => [..._inventory],

  getBySector: (sectorId) =>
    _inventory.filter(i => i.sectorId === sectorId),

  subscribe: (fn) => {
    _listeners.push(fn)
    return () => {
      _listeners = _listeners.filter(l => l !== fn)
    }
  },

  add: (item) => {
    const id = 'I' + String(_inventory.length + 1).padStart(3, '0')
    const newItem = { ...item, id }
    _inventory = [..._inventory, newItem]
    notify()
    return id
  },

  update: (id, changes) => {
    _inventory = _inventory.map(i =>
      i.id === id ? { ...i, ...changes } : i
    )
    notify()
  },

  remove: (id) => {
    _inventory = _inventory.filter(i => i.id !== id)
    notify()
  },

  getSummary: () => {
    const summary = {}
    _inventory.forEach(item => {
      const key = `${item.category}__${item.name}`
      if (!summary[key]) {
        summary[key] = {
          category: item.category,
          categoryLabel: item.categoryLabel,
          categoryIcon: item.categoryIcon,
          name: item.name,
          detail: item.detail,
          total: 0,
          sectors: [],
        }
      }
      summary[key].total += item.quantity
      summary[key].sectors.push({
        sectorId: item.sectorId,
        sectorName: item.sectorName,
        quantity: item.quantity,
      })
    })
    return Object.values(summary)
  },
}

export function useInventory() {
  const [inventory, setInventory] = useState(() => inventoryStore.getAll())

  useEffect(() => {
    return inventoryStore.subscribe(setInventory)
  }, [])

  return inventory
}

export function useSectorInventory(sectorId) {
  const [inventory, setInventory] = useState(() =>
    inventoryStore.getBySector(sectorId)
  )

  useEffect(() => {
    return inventoryStore.subscribe(all => {
      setInventory(all.filter(i => i.sectorId === sectorId))
    })
  }, [sectorId])

  return inventory
}