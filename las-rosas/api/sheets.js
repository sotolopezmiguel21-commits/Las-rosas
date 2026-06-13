import { getAccessTokenFromRefreshToken } from './_googleAuth'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { action, sheetName, values, range } = req.body || {}
    const sheetId = process.env.VITE_SHEET_ID

    const token = await getAccessTokenFromRefreshToken()

    const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    if (action === 'read') {
      const response = await fetch(
        `${BASE}/values/${encodeURIComponent(sheetName)}`,
        { headers }
      )
      const data = await response.json()
      return res.status(200).json(data)
    }

    if (action === 'append') {
      const response = await fetch(
        `${BASE}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { method: 'POST', headers, body: JSON.stringify({ values }) }
      )
      const data = await response.json()
      if (!response.ok) return res.status(response.status).json(data)
      return res.status(200).json(data)
    }

    if (action === 'put') {
      const response = await fetch(
        `${BASE}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
        { method: 'PUT', headers, body: JSON.stringify({ values }) }
      )
      const data = await response.json()
      return res.status(200).json(data)
    }

    if (action === 'clear') {
      const response = await fetch(
        `${BASE}/values/${encodeURIComponent(range)}:clear`,
        { method: 'POST', headers }
      )
      const data = await response.json()
      return res.status(200).json(data)
    }

    if (action === 'initHeaders') {
      const checkRes = await fetch(
        `${BASE}/values/${encodeURIComponent(sheetName)}!A1:Z1`,
        { headers }
      )
      const checkData = await checkRes.json()
      if (checkData.values && checkData.values[0]?.length > 0) {
        return res.status(200).json({ skipped: true })
      }
      const writeRes = await fetch(
        `${BASE}/values/${encodeURIComponent(sheetName)}!A1:Z1?valueInputOption=RAW`,
        { method: 'PUT', headers, body: JSON.stringify({ values }) }
      )
      const writeData = await writeRes.json()
      return res.status(200).json(writeData)
    }

    return res.status(400).json({ error: 'Invalid action' })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}