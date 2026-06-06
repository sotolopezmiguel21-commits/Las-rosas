import { useEffect } from 'react'
import { GOOGLE_CONFIG } from '../googleConfig'

export default function LoginPage({ onLogin }) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  const handleLogin = () => {
    if (window.google) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.clientId,
        scope: GOOGLE_CONFIG.scopes,
        prompt: 'select_account',
        callback: (response) => {
          if (response.access_token) {
            onLogin(response.access_token)
          }
        },
      })
      client.requestAccessToken()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: '32px 24px',
      background: 'white',
    }}>
      {/* Logo */}
      <div style={{
        width: '80px',
        height: '80px',
        background: '#3B5FCC',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        marginBottom: '24px',
      }}>🏥</div>

      {/* Title */}
      <div style={{
        fontSize: '22px',
        fontWeight: 700,
        color: '#111',
        marginBottom: '8px',
        textAlign: 'center',
      }}>Las Rosas</div>

      <div style={{
        fontSize: '14px',
        color: '#888',
        marginBottom: '8px',
        textAlign: 'center',
      }}>Sistema de registro de daños</div>

      <div style={{
        fontSize: '12px',
        color: '#aaa',
        marginBottom: '48px',
        textAlign: 'center',
      }}>Fundación Las Rosas</div>

      {/* Login button */}
      <button onClick={handleLogin} style={{
        width: '100%',
        maxWidth: '320px',
        padding: '14px 24px',
        background: 'white',
        border: '1.5px solid #ddd',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: 600,
        color: '#333',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Iniciar sesión con Google
      </button>

      <div style={{
        marginTop: '24px',
        fontSize: '11px',
        color: '#bbb',
        textAlign: 'center',
        maxWidth: '280px',
        lineHeight: 1.5,
      }}>
        Los datos se guardan en tu Google Drive de forma segura
      </div>
    </div>
  )
}