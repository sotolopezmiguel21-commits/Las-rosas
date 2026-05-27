import { useState } from 'react'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

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
          onSaved={() => setView('sector')}
        />
      )}

      {view === 'damage' && selectedDamage && (
        <DamagePage
          damage={selectedDamage}
          sector={selectedSector}
          onBack={() => setView('sector')}
          onResolved={() => setView('sector')}
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