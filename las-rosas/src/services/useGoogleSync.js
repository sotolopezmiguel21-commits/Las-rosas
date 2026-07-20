import { useState, useCallback } from 'react'
import {
  readSheet, appendRow, updateRow, clearRow,
  initAllSheets, DAMAGE_HEADERS, INVENTORY_HEADERS, IMPROVEMENT_HEADERS,
  getAccessToken,
} from './googleSheets'
import { SHEETS } from '../googleConfig'
import { damageStore } from '../data/store'
import { inventoryStore } from '../data/inventoryStore'
import { improvementStore, IMPROVEMENT_TYPES } from '../data/improvementStore'

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

      const activeDamages   = await readSheet(SHEETS.damages)
      const resolvedDamages = await readSheet(SHEETS.resolved)

      console.log('Daños activos desde Sheets:', activeDamages)
      console.log('Arreglos desde Sheets:', resolvedDamages)

      const allDamages = [
        ...activeDamages.map(d  => ({ ...d, status: 'active'   })),
        ...resolvedDamages.map(d => ({ ...d, status: 'resolved' })),
      ]

      const inventory = await readSheet(SHEETS.inventory)
      console.log('Inventario desde Sheets:', inventory)

      const improvements = await readSheet(SHEETS.improvements)
      console.log('Mejoras desde Sheets:', improvements)

      damageStore.loadFromSheets(allDamages)
      inventoryStore.loadFromSheets(
        inventory.map(i => ({ ...i, quantity: Number(i.quantity) }))
      )
      improvementStore.loadFromSheets(improvements)

      setLastSync(new Date())
    } catch (err) {
      if (err.message.includes('401')) {
        throw err
      }
      setError('Error al cargar datos: ' + err.message)
      console.error('Error loadFromSheets:', err)
    } finally {
      setSyncing(false)
    }
  }, [])

  // ── SAVE DAMAGE ─────────────────────────────────────────
  const saveDamage = useCallback(async (damage) => {
    try {
      await appendRow(SHEETS.damages, DAMAGE_HEADERS, damage)
    } catch (err) {
      if (err.message.includes('401')) {
        localStorage.removeItem('gtoken')
        localStorage.removeItem('gtoken_time')
        sessionStorage.removeItem('app_loaded')
        window.location.reload()
        return
      }
      setError('Error al guardar daño: ' + err.message)
    }
  }, [])

  // ── UPDATE DAMAGE ────────────────────────────────────────
  const updateDamage = useCallback(async (damage) => {
    try {
      const sheetName = damage.status === 'resolved' ? SHEETS.resolved : SHEETS.damages
      const allDamages = await readSheet(sheetName)
      const rowIndex = allDamages.findIndex(d => d.id === damage.id)
      if (rowIndex !== -1) {
        await updateRow(sheetName, rowIndex, DAMAGE_HEADERS, damage)
      }
    } catch (err) {
      if (err.message.includes('401')) {
        localStorage.removeItem('gtoken')
        localStorage.removeItem('gtoken_time')
        sessionStorage.removeItem('app_loaded')
        window.location.reload()
        return
      }
      setError('Error al actualizar daño: ' + err.message)
    }
  }, [])

  // ── RESOLVE DAMAGE ──────────────────────────────────────
  const resolveDamage = useCallback(async (damage) => {
    try {
      const activeDamages = await readSheet(SHEETS.damages)
      const rowIndex = activeDamages.findIndex(d => d.id === damage.id)
      if (rowIndex !== -1) {
        await clearRow(SHEETS.damages, rowIndex)
      }
      await appendRow(SHEETS.resolved, DAMAGE_HEADERS, damage)
    } catch (err) {
      if (err.message.includes('401')) {
        localStorage.removeItem('gtoken')
        localStorage.removeItem('gtoken_time')
        sessionStorage.removeItem('app_loaded')
        window.location.reload()
        return
      }
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

  // ── SAVE IMPROVEMENT ─────────────────────────────────────
  const saveImprovement = useCallback(async (item) => {
    try {
      await appendRow(SHEETS.improvements, IMPROVEMENT_HEADERS, item)
    } catch (err) {
      setError('Error al guardar mejora: ' + err.message)
    }
  }, [])

  // ── COMPLETE IMPROVEMENT (pasa a Arreglos Realizados) ────
  const completeImprovement = useCallback(async (improvement, photoCompletedUrl) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const typeLabel = IMPROVEMENT_TYPES[improvement.type]?.label || improvement.type

      // 1. Quitar la fila de la hoja Mejoras
      const improvements = await readSheet(SHEETS.improvements)
      const rowIndex = improvements.findIndex(i => i.id === improvement.id)
      if (rowIndex !== -1) {
        await clearRow(SHEETS.improvements, rowIndex)
      }

      // 2. Agregarla a Arreglos Realizados con el mismo formato que un daño resuelto
      const arreglo = {
        id:                improvement.id,
        sectorId:          improvement.sectorId,
        sectorName:        improvement.sectorName,
        floor:             improvement.floor,
        cell:              '—',
        description:       improvement.description,
        solution:          `Mejora de tipo: ${typeLabel}`,
        priority:          '',
        supplies:          '',
        inventoryItemId:   '',
        inventoryItemName: '',
        photo:             improvement.photo || '',
        photoResolved:     photoCompletedUrl || '',
        dateCreated:       improvement.dateCreated,
        dateResolved:      today,
        status:            'resolved',
      }
      await appendRow(SHEETS.resolved, DAMAGE_HEADERS, arreglo)

      // 3. Actualizar stores locales para reflejarlo sin recargar
      improvementStore.remove(improvement.id)
      damageStore.add(arreglo)
    } catch (err) {
      setError('Error al completar mejora: ' + err.message)
    }
  }, [])

  // ── DISCARD IMPROVEMENT ───────────────────────────────────
  const discardImprovement = useCallback(async (improvement) => {
    try {
      const updated = { ...improvement, status: 'discarded' }
      const improvements = await readSheet(SHEETS.improvements)
      const rowIndex = improvements.findIndex(i => i.id === improvement.id)
      if (rowIndex !== -1) {
        await updateRow(SHEETS.improvements, rowIndex, IMPROVEMENT_HEADERS, updated)
      }
      improvementStore.discard(improvement.id)
    } catch (err) {
      setError('Error al descartar mejora: ' + err.message)
    }
  }, [])

  // ── REACTIVATE IMPROVEMENT ─────────────────────────────────
  const reactivateImprovement = useCallback(async (improvement) => {
    try {
      const updated = { ...improvement, status: 'active' }
      const improvements = await readSheet(SHEETS.improvements)
      const rowIndex = improvements.findIndex(i => i.id === improvement.id)
      if (rowIndex !== -1) {
        await updateRow(SHEETS.improvements, rowIndex, IMPROVEMENT_HEADERS, updated)
      }
      improvementStore.reactivate(improvement.id)
    } catch (err) {
      setError('Error al reactivar mejora: ' + err.message)
    }
  }, [])

  // ── DELETE IMPROVEMENT ────────────────────────────────────
  const deleteImprovement = useCallback(async (itemId) => {
    try {
      const improvements = await readSheet(SHEETS.improvements)
      const rowIndex = improvements.findIndex(i => i.id === itemId)
      if (rowIndex !== -1) {
        await clearRow(SHEETS.improvements, rowIndex)
      }
    } catch (err) {
      setError('Error al eliminar mejora: ' + err.message)
    }
  }, [])

  return {
    syncing,
    lastSync,
    error,
    loadFromSheets,
    saveDamage,
    updateDamage,
    resolveDamage,
    saveInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    saveImprovement,
    completeImprovement,
    deleteImprovement,
    discardImprovement,
    reactivateImprovement,
  }
}