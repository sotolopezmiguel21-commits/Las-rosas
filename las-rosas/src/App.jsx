import { useState, useEffect } from 'react'
import { setAccessToken } from './services/googleSheets'
import { useGoogleSync } from './services/useGoogleSync'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import SectorPage from './pages/SectorPage'
import FormPage from './pages/FormPage'
import DamagePage from './pages/DamagePage'
import ResolvedPage from './pages/ResolvedPage'
import DashboardPage from './pages/DashboardPage'

onSaved

export default function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem('gtoken') || null
  )
  const [view, setView] = useState('map')
  const [selectedSector, setSelectedSector] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [selectedCell, setSelectedCell] = useState(null)
  const [selectedDamage, setSelectedDamage] = useState(null)
  const [loaded, setLoaded] = useState(() =>
    sessionStorage.getItem('app_loaded') === 'true'
  )
  const [tokenExpired, setTokenExpired] = useState(false)

  const {
    syncing, lastSync, error,
    loadFromSheets, saveDamage, resolveDamage,
    saveInventoryItem, updateInventoryItem, deleteInventoryItem,
  } = useGoogleSync()

  // Load data when token is available
  useEffect(() => {
    if (token) {
      const tokenTime = localStorage.getItem('gtoken_time')
      if (tokenTime) {
        const elapsed = Date.now() - Number(tokenTime)
        if (elapsed > 50 * 60 * 1000) {
          localStorage.removeItem('gtoken')
          localStorage.removeItem('gtoken_time')
          sessionStorage.removeItem('app_loaded')
          setToken(null)
          setTokenExpired(true)
          return
        }
      }
      setAccessToken(token)
      if (!loaded) {
        loadFromSheets().then(() => {
          setLoaded(true)
          sessionStorage.setItem('app_loaded', 'true')
        })
      }
    }
  }, [token])

  const handleLogin = (accessToken) => {
    localStorage.setItem('gtoken', accessToken)
    localStorage.setItem('gtoken_time', Date.now().toString())
    sessionStorage.removeItem('app_loaded')
    setAccessToken(accessToken)
    setToken(accessToken)
    setLoaded(false)
  }

  const handleSectorSelect = (sector, floor) => {
    setSelectedSector(sector)
    setSelectedFloor(floor)
    setView('sector')
  }

  const handleCellClick = (cell, cellDamages) => {
    setSelectedCell(cell)
    if (cellDamages.length > 0) {
      setSelectedDamage(cellDamages[0])
      setView('damage')
    } else {
      setView('form')
    }
  }

  const isMapArea = ['map', 'sector', 'form', 'damage'].includes(view)

  const NAV = [
    { v: 'map',       icon: '🗺',  label: 'Mapa'      },
    { v: 'dashboard', icon: '📊',  label: 'Dashboard' },
    { v: 'resolved',  icon: '✅',  label: 'Arreglos'  },
  ]

  // Not logged in
  if (!token) {
    return (
      <LoginPage
        onLogin={handleLogin}
        expired={tokenExpired}
      />
    )
  }

  // Loading
  if (!loaded) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        gap: '16px',
        background: 'white',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #eee',
          borderTop: '3px solid #3B5FCC',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: '14px', color: '#888' }}>
          {syncing ? 'Cargando datos...' : 'Conectando...'}
        </div>
        {error && (
          <div style={{
            fontSize: '12px',
            color: '#E24B4A',
            textAlign: 'center',
            padding: '0 32px',
          }}>{error}</div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

      {/* Sync indicator */}
      {syncing && (
        <div style={{
          background: '#EEF4FF',
          color: '#3B5FCC',
          fontSize: '11px',
          textAlign: 'center',
          padding: '4px',
        }}>Sincronizando...</div>
      )}

      {view === 'map' && (
        <MapPage onSectorSelect={handleSectorSelect} />
      )}

      {view === 'sector' && selectedSector && (
        <SectorPage
          sector={selectedSector}
          floor={selectedFloor}
          onBack={() => setView('map')}
          onCellClick={handleCellClick}
        />
      )}

      {view === 'form' && selectedSector && (
        <FormPage
          sector={selectedSector}
          floor={selectedFloor}
          cell={selectedCell}
          onBack={() => setView('sector')}
          onSaved={async (damage) => {
            try {
              await saveDamage(damage)
              alert('Guardado correctamente')
            } catch (err) {
              alert('Error: ' + err.message)
            }
            setView('sector')
          }}
        />
      )}

      {view === 'damage' && selectedDamage && (
        <DamagePage
          damage={selectedDamage}
          sector={selectedSector}
          onBack={() => setView('sector')}
          onResolved={async (damage) => {
            await resolveDamage(damage)
            setView('sector')
          }}
        />
      )}

      {view === 'resolved' && (
        <ResolvedPage onBack={() => setView('map')} />
      )}

      {view === 'dashboard' && (
        <DashboardPage />
      )}

      {/* Bottom navigation */}
      <div style={{
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'center',
        padding: '10px 0 12px',
        background: 'white',
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
      }}>
        {NAV.map(t => {
          const isActive = t.v === 'map' ? isMapArea : view === t.v
          return (
            <button key={t.v} onClick={() => {
              if (t.v === 'map') setSelectedSector(null)
              setView(t.v)
            }} style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              fontSize: '10px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#111' : '#aaa',
              padding: '4px 0',
            }}>
              <span style={{ fontSize: '22px' }}>{t.icon}</span>
              {t.label}
            </button>
          )
        })}
      </div>

    </div>
  )
}