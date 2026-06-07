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

// ── UPLOAD PHOTO TO DRIVE ─────────────────────────────────
export const uploadPhotoToDrive = async (base64, filename) => {
  try {
    // Convert base64 to blob
    const base64Data = base64.split(',')[1]
    const mimeType = base64.split(',')[0].split(':')[1].split(';')[0]
    const byteCharacters = atob(base64Data)
    const byteArrays = []
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512)
      const byteNumbers = new Array(slice.length)
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j)
      }
      byteArrays.push(new Uint8Array(byteNumbers))
    }
    const blob = new Blob(byteArrays, { type: mimeType })

    // Upload to Drive
    const metadata = {
      name: filename,
      parents: [],
    }

    const formData = new FormData()
    formData.append('metadata', new Blob(
      [JSON.stringify(metadata)],
      { type: 'application/json' }
    ))
    formData.append('file', blob)

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${_accessToken}` },
        body: formData,
      }
    )

    const data = await res.json()

    // Make file publicly viewable
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    )

    return `https://drive.google.com/uc?id=${data.id}`
  } catch (err) {
    console.error('Error uploading photo:', err)
    return null
  }
}