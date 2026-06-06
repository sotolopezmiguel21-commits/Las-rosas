import { useState, useCallback } from 'react'
import {
  readSheet, appendRow, updateRow, clearRow,
  initAllSheets, DAMAGE_HEADERS, INVENTORY_HEADERS,
} from './googleSheets'
import { SHEETS } from '../googleConfig'
import { damageStore } from '../data/store'
import { inventoryStore } from '../data/inventoryStore'

export function useGoogleSync() {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [error, setError] = useState(null)

  // ── LOAD FROM SHEETS ────────────────────────────────────
  const loadFromSheets = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      await initAllSheets()

      // Load active damages
      const activeDamages = await readSheet(SHEETS.damages)
      const resolvedDamages = await readSheet(SHEETS.resolved)
      const allDamages = [
        ...activeDamages.map(d => ({ ...d, status: 'active' })),
        ...resolvedDamages.map(d => ({ ...d, status: 'resolved' })),
      ]

      // Load inventory
      const inventory = await readSheet(SHEETS.inventory)

      // Update stores
      if (allDamages.length > 0) {
        damageStore.loadFromSheets(allDamages)
      }
      if (inventory.length > 0) {
        inventoryStore.loadFromSheets(inventory.map(i => ({
          ...i,
          quantity: Number(i.quantity),
        })))
      }

      setLastSync(new Date())
    } catch (err) {
      setError('Error al cargar datos: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }, [])

  // ── SAVE DAMAGE ─────────────────────────────────────────
  const saveDamage = useCallback(async (damage) => {
    try {
      const sheet = damage.status === 'resolved'
        ? SHEETS.resolved
        : SHEETS.damages
      await appendRow(sheet, DAMAGE_HEADERS, damage)
    } catch (err) {
      setError('Error al guardar daño: ' + err.message)
    }
  }, [])

  // ── RESOLVE DAMAGE ──────────────────────────────────────
  const resolveDamage = useCallback(async (damage) => {
    try {
      // Get active damages to find row index
      const activeDamages = await readSheet(SHEETS.damages)
      const rowIndex = activeDamages.findIndex(d => d.id === damage.id)
      if (rowIndex !== -1) {
        await clearRow(SHEETS.damages, rowIndex)
      }
      await appendRow(SHEETS.resolved, DAMAGE_HEADERS, damage)
    } catch (err) {
      setError('Error al resolver daño: ' + err.message)
    }
  }, [])

  // ── SAVE INVENTORY ITEM ─────────────────────────────────
  const saveInventoryItem = useCallback(async (item) => {
    try {
      await appendRow(SHEETS.inventory, INVENTORY_HEADERS, item)
    } catch (err) {
      setError('Error al guardar inventario: ' + err.message)
    }
  }, [])

  // ── UPDATE INVENTORY ITEM ───────────────────────────────
  const updateInventoryItem = useCallback(async (item) => {
    try {
      const inventory = await readSheet(SHEETS.inventory)
      const rowIndex = inventory.findIndex(i => i.id === item.id)
      if (rowIndex !== -1) {
        await updateRow(SHEETS.inventory, rowIndex, INVENTORY_HEADERS, item)
      }
    } catch (err) {
      setError('Error al actualizar inventario: ' + err.message)
    }
  }, [])

  // ── DELETE INVENTORY ITEM ───────────────────────────────
  const deleteInventoryItem = useCallback(async (itemId) => {
    try {
      const inventory = await readSheet(SHEETS.inventory)
      const rowIndex = inventory.findIndex(i => i.id === itemId)
      if (rowIndex !== -1) {
        await clearRow(SHEETS.inventory, rowIndex)
      }
    } catch (err) {
      setError('Error al eliminar elemento: ' + err.message)
    }
  }, [])

  return {
    syncing,
    lastSync,
    error,
    loadFromSheets,
    saveDamage,
    resolveDamage,
    saveInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  }
}