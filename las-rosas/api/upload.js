export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { base64, filename } = req.body
    const email = process.env.VITE_SERVICE_ACCOUNT_EMAIL
    const key   = process.env.VITE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n')

    const token = await getServiceAccountToken(email, key)

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
  if (!data.access_token) throw new Error('Token error: ' + JSON.stringify(data))
  return data.access_token
}

async function createJWT(payload, privateKey) {
  const header = { alg: 'RS256', typ: 'JWT' }
  const encodeBase64Url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const headerEncoded  = encodeBase64Url(header)
  const payloadEncoded = encodeBase64Url(payload)
  const signingInput   = `${headerEncoded}.${payloadEncoded}`

  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  return `${signingInput}.${signatureBase64}`
}