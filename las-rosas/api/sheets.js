export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { action, sheetName, values, range } = req.body || {}
    const sheetId = process.env.VITE_SHEET_ID
    const email   = process.env.VITE_SERVICE_ACCOUNT_EMAIL
    const key     = process.env.VITE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n')

    // Get access token using service account
    const token = await getServiceAccountToken(email, key)

    const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    if (req.method === 'GET') {
      // Read sheet
      const response = await fetch(
        `${BASE}/values/${encodeURIComponent(sheetName)}`,
        { headers }
      )
      const data = await response.json()
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      if (action === 'append') {
        const response = await fetch(
          `${BASE}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
          { method: 'POST', headers, body: JSON.stringify({ values }) }
        )
        const data = await response.json()
        if (!response.ok) {
          return res.status(response.status).json(data)
        }
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
        // Check if headers exist
        const checkRes = await fetch(
          `${BASE}/values/${encodeURIComponent(sheetName)}!A1:Z1`,
          { headers }
        )
        const checkData = await checkRes.json()
        if (checkData.values && checkData.values[0]?.length > 0) {
          return res.status(200).json({ skipped: true })
        }
        // Write headers
        const writeRes = await fetch(
          `${BASE}/values/${encodeURIComponent(sheetName)}!A1:Z1?valueInputOption=RAW`,
          { method: 'PUT', headers, body: JSON.stringify({ values }) }
        )
        const writeData = await writeRes.json()
        return res.status(200).json(writeData)
      }
    }

    return res.status(400).json({ error: 'Invalid action' })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function getServiceAccountToken(email, privateKey) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const jwt = await createJWT(payload, privateKey)

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const data = await response.json()
  if (!data.access_token) {
    throw new Error('Failed to get token: ' + JSON.stringify(data))
  }
  return data.access_token
}

async function createJWT(payload, privateKey) {
  const header = { alg: 'RS256', typ: 'JWT' }

  const encodeBase64Url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

  const headerEncoded  = encodeBase64Url(header)
  const payloadEncoded = encodeBase64Url(payload)
  const signingInput   = `${headerEncoded}.${payloadEncoded}`

  // Import private key
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const encoder = new TextEncoder()
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signingInput)
  )

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${signingInput}.${signatureBase64}`
}