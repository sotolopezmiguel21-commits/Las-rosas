const API = '/api/sheets'

// ── Helpers ───────────────────────────────────────────────
const rowToObj = (headers, row) => {
  const obj = {}
  headers.forEach((h, i) => { obj[h] = row[i] || '' })
  return obj
}

const objToRow = (headers, obj) =>
  headers.map(h => obj[h] ?? '')

// ── READ ──────────────────────────────────────────────────
export const readSheet = async (sheetName) => {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'read', sheetName }),
  })
  const data = await res.json()
  if (!data.values || data.values.length < 2) return []
  const [headers, ...rows] = data.values
  return rows.map(row => rowToObj(headers, row))
}

// ── APPEND ────────────────────────────────────────────────
export const appendRow = async (sheetName, headers, obj) => {
  const row = objToRow(headers, obj)
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'append', sheetName, values: [row] }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Sheets error ${res.status}: ${JSON.stringify(data)}`)
  return data
}

// ── UPDATE ────────────────────────────────────────────────
export const updateRow = async (sheetName, rowIndex, headers, obj) => {
  const row = objToRow(headers, obj)
  const range = `${sheetName}!A${rowIndex + 2}`
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'put', range, values: [row] }),
  })
  return res.json()
}

// ── CLEAR ROW ─────────────────────────────────────────────
export const clearRow = async (sheetName, rowIndex) => {
  const range = `${sheetName}!A${rowIndex + 2}:Z${rowIndex + 2}`
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear', range }),
  })
  return res.json()
}

// ── INIT HEADERS ──────────────────────────────────────────
export const initSheetHeaders = async (sheetName, headers) => {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'initHeaders', sheetName, values: [headers] }),
  })
  return res.json()
}

// ── UPLOAD PHOTO TO DRIVE ─────────────────────────────────
export const uploadPhotoToDrive = async (base64, filename) => {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, filename }),
    })
    const data = await res.json()
    return data.url || null
  } catch (err) {
    console.error('Error uploading photo:', err)
    return null
  }
}

// ── INIT ALL SHEETS ───────────────────────────────────────
export const initAllSheets = async () => {
  await initSheetHeaders(SHEETS.damages,   DAMAGE_HEADERS)
  await initSheetHeaders(SHEETS.resolved,  DAMAGE_HEADERS)
  await initSheetHeaders(SHEETS.inventory, INVENTORY_HEADERS)
}

// ── TOKEN (no necesario con cuenta de servicio) ───────────
export const setAccessToken = () => {}
export const getAccessToken = () => 'service-account'

// ── SHEET HEADERS CONFIG ──────────────────────────────────
export const DAMAGE_HEADERS = [
  'id', 'sectorId', 'sectorName', 'floor', 'cell',
  'description', 'solution', 'priority', 'supplies',
  'inventoryItemId', 'inventoryItemName',
  'photo', 'photoResolved',
  'dateCreated', 'dateResolved', 'status',
]

export const INVENTORY_HEADERS = [
  'id', 'sectorId', 'sectorName', 'floor',
  'category', 'categoryLabel', 'categoryIcon',
  'name', 'quantity', 'detail', 'dateCreated',
]

import { SHEETS } from '../googleConfig'