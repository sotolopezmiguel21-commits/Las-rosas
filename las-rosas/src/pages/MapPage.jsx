import { useState } from 'react'
import { FLOORS } from '../data/floors'
import { PRIORITY } from '../data/config'
import { damageStore } from '../data/store'
import Header from '../components/Header'
import SectorCard from '../components/SectorCard'

function getAlert(damages, sectorId) {
  const active = damages.filter(d => d.sectorId === sectorId && d.status === 'active')
  if (!active.length) return null
  if (active.some(d => d.priority === 'alta')) return 'alta'
  if (active.some(d => d.priority === 'media')) return 'media'
  return 'baja'
}

export default function MapPage({ onSectorSelect }) {
  const [floor, setFloor] = useState(1)
  const damages = damageStore.getAll()
  const floorData = FLOORS[floor]

  const activeTotal = damages.filter(d => d.status === 'active' && d.floor === floor).length
  const resolvedTotal = damages.filter(d => d.status === 'resolved').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header
        title="Las Rosas"
        subtitle="Fundación Las Rosas — Registro de daños"
        right={
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map(n => (
              <button key={n} onClick={() => setFloor(n)} style={{
                minWidth: '32px',
                height: '32px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: n === floor ? 600 : 400,
                cursor: 'pointer',
                background: n === floor ? '#EEF4FF' : '#f5f5f3',
                color: n === floor ? '#3B5FCC' : '#666',
                border: n === floor ? '1.5px solid #3B5FCC' : '1px solid #ddd',
              }}>{n}</button>
            ))}
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '16px',
        }}>
          {[
            { label: 'Daños activos', value: activeTotal, color: '#E24B4A' },
            { label: 'Resueltos', value: resolvedTotal, color: '#1D9E75' },
            { label: 'Sectores', value: floorData?.groups.reduce((a, g) => a + g.sectors.length, 0) },
          ].map(s => (
            <div key={s.label} style={{
              background: '#f5f5f3',
              borderRadius: '10px',
              padding: '10px 8px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: s.color || '#333',
                lineHeight: 1.1,
              }}>{s.value}</div>
              <div style={{
                fontSize: '10px',
                color: '#888',
                marginTop: '3px',
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Sector groups */}
        {floorData?.groups.map(group => (
          <div key={group.id} style={{ marginBottom: '18px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>{group.name}</div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              {group.sectors.map(sector => (
                <SectorCard
                  key={sector.id}
                  sector={sector}
                  alert={getAlert(damages, sector.id)}
                  damageCount={damages.filter(d =>
                    d.sectorId === sector.id && d.status === 'active'
                  ).length}
                  onClick={() => onSectorSelect(sector, floor)}
                />
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}