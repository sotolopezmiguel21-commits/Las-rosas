import { useState, useEffect } from 'react'
import { useGoogleSync } from './services/useGoogleSync'
import MapPage from './pages/MapPage'
import SectorPage from './pages/SectorPage'
import FormPage from './pages/FormPage'
import DamagePage from './pages/DamagePage'
import ResolvedPage from './pages/ResolvedPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const [view, setView] = useState('map')
  const [selectedSector, setSelectedSector] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [selectedCell, setSelectedCell] = useState(null)
  const [selectedDamage, setSelectedDamage] = useState(null)
  const [loaded, setLoaded] = useState(false)

  const {
    syncing, error,
    loadFromSheets, saveDamage, updateDamage, resolveDamage,
    saveInventoryItem, updateInventoryItem, deleteInventoryItem,
  } = useGoogleSync()

  useEffect(() => {
    loadFromSheets()
      .then(() => {
        setLoaded(true)
        // Recuperar vista de formulario si Android recargó
        const formSector = sessionStorage.getItem('form_sector')
        const formCell   = sessionStorage.getItem('form_cell')
        const formFloor  = sessionStorage.getItem('form_floor')
        if (formSector && formCell) {
          setSelectedSector(JSON.parse(formSector))
          setSelectedFloor(Number(formFloor))
          setSelectedCell(formCell)
          setView('form')
        }
      })
      .catch(err => console.error('Error cargando datos:', err))
  }, [])

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
      // Guardar estado para recuperar si Android recarga
      sessionStorage.setItem('form_sector', JSON.stringify(selectedSector))
      sessionStorage.setItem('form_floor', selectedFloor)
      sessionStorage.setItem('form_cell', cell)
      setView('form')
    }
  }

  const isMapArea = ['map', 'sector', 'form', 'damage'].includes(view)

  const NAV = [
    { v: 'map',       icon: '🗺',  label: 'Mapa'      },
    { v: 'dashboard', icon: '📊',  label: 'Dashboard' },
    { v: 'resolved',  icon: '✅',  label: 'Arreglos'  },
  ]

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
          Cargando datos...
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
          saveInventoryItem={saveInventoryItem}
          updateInventoryItem={updateInventoryItem}
          deleteInventoryItem={deleteInventoryItem}
        />
      )}

      {view === 'form' && selectedSector && (
        <FormPage
          sector={selectedSector}
          floor={selectedFloor}
          cell={selectedCell}
          onBack={() => setView('sector')}
          onSaved={async (damage) => {
            await saveDamage(damage)
            setView('sector')
          }}
        />
      )}

      {view === 'edit' && selectedSector && selectedDamage && (
        <FormPage
          sector={selectedSector}
          floor={selectedFloor}
          cell={selectedCell}
          editDamage={selectedDamage}
          onBack={() => setView('damage')}
          onSaved={async (updatedDamage) => {
            await updateDamage(updatedDamage)
            setSelectedDamage(updatedDamage)
            setView('damage')
          }}
        />
      )}

      {view === 'damage' && selectedDamage && (
        <DamagePage
          damage={selectedDamage}
          sector={selectedSector}
          onBack={() => setView('sector')}
          onResolved={async (resolvedDamage) => {
            await resolveDamage(resolvedDamage)
            setView('sector')
          }}
          onEdit={(damage) => {
            setSelectedDamage(damage)
            setView('edit')
          }}
        />
      )}

      {view === 'resolved' && (
        <ResolvedPage onBack={() => setView('map')} />
      )}

      {view === 'dashboard' && (
        <DashboardPage />
      )}

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
