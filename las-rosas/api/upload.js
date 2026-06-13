export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { base64, filename } = req.body

    const token = await getAccessTokenFromRefreshToken()

    // Convert base64 to binary
    const base64Data    = base64.split(',')[1]
    const mimeType      = base64.split(',')[0].split(':')[1].split(';')[0]
    const binaryString  = atob(base64Data)
    const bytes         = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const metadata = JSON.stringify({ name: filename })
    const boundary = 'boundary_las_rosas'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelim = `\r\n--${boundary}--`

    const metaPart  = `Content-Type: application/json\r\n\r\n${metadata}`
    const filePart  = `Content-Type: ${mimeType}\r\n\r\n`

    const encoder   = new TextEncoder()
    const metaBytes = encoder.encode(delimiter + metaPart + delimiter + filePart)
    const closeBytes= encoder.encode(closeDelim)

    const body = new Uint8Array(metaBytes.length + bytes.length + closeBytes.length)
    body.set(metaBytes, 0)
    body.set(bytes, metaBytes.length)
    body.set(closeBytes, metaBytes.length + bytes.length)

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    )

    const uploadData = await uploadRes.json()
    if (!uploadData.id) throw new Error('Upload failed: ' + JSON.stringify(uploadData))

    // Make public
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      }
    )

    return res.status(200).json({
      url: `https://drive.google.com/uc?id=${uploadData.id}`,
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// ── Obtener access token usando refresh token (OAuth de usuario) ──
async function getAccessTokenFromRefreshToken() {
  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json()
  if (!data.access_token) {
    throw new Error('Failed to refresh token: ' + JSON.stringify(data))
  }
  return data.access_token
}