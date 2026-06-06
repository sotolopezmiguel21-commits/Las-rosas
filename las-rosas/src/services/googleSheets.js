import { GOOGLE_CONFIG, SHEETS } from '../googleConfig'

// ── Token management ──────────────────────────────────────
let _accessToken = null

export const setAccessToken = (token) => {
  _accessToken = token
}

export const getAccessToken = () => _accessToken

const authHeaders = () => ({
  'Authorization': `Bearer ${_accessToken}`,
  'Content-Type': 'application/json',
})

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const sid  = GOOGLE_CONFIG.sheetId

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
  const res = await fetch(
    `${BASE}/${sid}/values/${encodeURIComponent(sheetName)}`,
    { headers: authHeaders() }
  )
  const data = await res.json()
  if (!data.values || data.values.length < 2) return []
  const [headers, ...rows] = data.values
  return rows.map(row => rowToObj(headers, row))
}

// ── APPEND ────────────────────────────────────────────────
export const appendRow = async (sheetName, headers, obj) => {
  const row = objToRow(headers, obj)
  await fetch(
    `${BASE}/${sid}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ values: [row] }),
    }
  )
}

// ── UPDATE ────────────────────────────────────────────────
export const updateRow = async (sheetName, rowIndex, headers, obj) => {
  const row = objToRow(headers, obj)
  const range = `${sheetName}!A${rowIndex + 2}`
  await fetch(
    `${BASE}/${sid}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ values: [row] }),
    }
  )
}

// ── DELETE (clear row) ────────────────────────────────────
export const clearRow = async (sheetName, rowIndex) => {
  const range = `${sheetName}!A${rowIndex + 2}:Z${rowIndex + 2}`
  await fetch(
    `${BASE}/${sid}/values/${encodeURIComponent(range)}:clear`,
    { method: 'POST', headers: authHeaders() }
  )
}

// ── INIT HEADERS ──────────────────────────────────────────
export const initSheetHeaders = async (sheetName, headers) => {
  const res = await fetch(
    `${BASE}/${sid}/values/${encodeURIComponent(sheetName)}!A1:Z1`,
    { headers: authHeaders() }
  )
  const data = await res.json()
  if (data.values && data.values[0] && data.values[0].length > 0) return
  await fetch(
    `${BASE}/${sid}/values/${encodeURIComponent(sheetName)}!A1:Z1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ values: [headers] }),
    }
  )
}

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

// ── INIT ALL SHEETS ───────────────────────────────────────
export const initAllSheets = async () => {
  await initSheetHeaders(SHEETS.damages,   DAMAGE_HEADERS)
  await initSheetHeaders(SHEETS.resolved,  DAMAGE_HEADERS)
  await initSheetHeaders(SHEETS.inventory, INVENTORY_HEADERS)
}