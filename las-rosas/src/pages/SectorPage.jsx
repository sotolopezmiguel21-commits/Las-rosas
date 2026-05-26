import { useState, useEffect } from 'react'
import { SECTOR_TYPES, PRIORITY } from '../data/config'
import { damageStore } from '../data/store'
import Header from '../components/Header'
import Grid from '../components/Grid'
import AlertBadge from '../components/AlertBadge'
import InventoryPage from './InventoryPage'

export default function SectorPage({ sector, floor, onBack, onCellClick }) {
  const [damages, setDamages] = useState(damageStore.getAll())
  const [tab, setTab] = useState('damages')

  useEffect(() => {
    return damageStore.subscribe(setDamages)
  }, [])

  const active = damages.filter(d =>
    d.sectorId === sector.id && d.status === 'active'
  )

  const type = SECTOR_TYPES[sector.type] || { label: sector.type, icon: '📍' }

  if (tab === 'inventory') {
    return (
      <InventoryPage
        sector={sector}
        onBack={() => setTab('damages')}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header
        title={sector.name}
        subtitle={`${type.icon} Piso ${floor}`}
        onBack={onBack}
      />

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #eee',
        background: 'white',
      }}>
        {[
          { key: 'damages',   label: '⚠️ Daños'      },
          { key: 'inventory', label: '📦 Inventario'  },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1,
            padding: '12px',
            background: 'none',
            border: 'none',
            borderBottom: tab === t.key
              ? '2px solid #3B5FCC'
              : '2px solid transparent',
            color: tab === t.key ? '#3B5FCC' : '#888',
            fontSize: '13px',
            fontWeight: tab === t.key ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {/* Sector info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#f5f5f3',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '14px',
        }}>
          <span style={{ fontSize: '28px' }}>{type.icon}</span>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
            }}>{sector.name}</div>
            <div style={{
              fontSize: '12px',
              color: '#888',
              marginTop: '2px',
            }}>
              {active.length
                ? `${active.length} daño${active.length > 1 ? 's' : ''} activo${active.length > 1 ? 's' : ''}`
                : 'Sin daños registrados ✓'}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '10px',
        }}>
          Toca <span style={{ color: '#ccc' }}>+</span> para registrar
          · Toca un triángulo para ver el daño
        </div>

        {/* Grid */}
        <Grid
          sectorId={sector.id}
          damages={damages}
          onCellClick={onCellClick}
        />

        {/* Active damages list */}
        {active.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>Daños activos</div>

            {active.map(d => (
              <div key={d.id}
                onClick={() => onCellClick(d.cell, [d])}
                style={{
                  background: PRIORITY[d.priority].bg,
                  border: `1px solid ${PRIORITY[d.priority].color}44`,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    flex: 1,
                  }}>{d.description}</div>
                  <AlertBadge level={d.priority} small />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  marginTop: '4px',
                }}>Celda {d.cell} · {d.dateCreated}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}