import { useState, useEffect } from 'react'
import { damageStore } from '../data/store'
import { getSectorById } from '../data/floors'
import { SECTOR_TYPES, PRIORITY } from '../data/config'
import Header from '../components/Header'

export default function ResolvedPage({ onBack }) {
  const [damages, setDamages] = useState(() => damageStore.getAll())

  useEffect(() => {
    return damageStore.subscribe(setDamages)
  }, [])

  const resolved = damages.filter(d => d.status === 'resolved')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header
        title="Arreglos realizados"
        subtitle={`${resolved.length} reparación${resolved.length !== 1 ? 'es' : ''} completada${resolved.length !== 1 ? 's' : ''}`}
        onBack={onBack}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {resolved.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            color: '#aaa',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '48px', marginBottom: '12px' }}>✅</span>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
              Sin arreglos registrados aún
            </div>
            <div style={{ fontSize: '13px' }}>
              Cuando marques un daño como resuelto aparecerá aquí
            </div>
          </div>
        ) : (
          resolved
            .slice()
            .sort((a, b) => b.dateResolved?.localeCompare(a.dateResolved))
            .map(d => {
              const sector = getSectorById(d.sectorId)
              const type = SECTOR_TYPES[sector?.type] || { icon: '📍' }
              const p = PRIORITY[d.priority]
              return (
                <div key={d.id} style={{
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '10px',
                }}>
                  {/* Header row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}>
                    <div style={{ flex: 1, paddingRight: '8px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#111',
                        marginBottom: '3px',
                      }}>{d.description}</div>
                      <div style={{
                        fontSize: '11px',
                        color: '#888',
                      }}>
                        {type.icon} {sector?.name} · Celda {d.cell}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      color: '#aaa',
                      whiteSpace: 'nowrap',
                    }}>{d.id}</span>
                  </div>

                  {/* Solution */}
                  {d.solution && (
                    <div style={{
                      fontSize: '12px',
                      color: '#555',
                      marginBottom: '8px',
                      paddingLeft: '8px',
                      borderLeft: '2px solid #1D9E75',
                    }}>
                      {d.solution}
                    </div>
                  )}

                  {/* Dates + priority */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontSize: '10px',
                      color: '#888',
                      background: '#f5f5f3',
                      borderRadius: '6px',
                      padding: '2px 8px',
                    }}>📅 Registrado: {d.dateCreated}</span>
                    <span style={{
                      fontSize: '10px',
                      color: '#085041',
                      background: '#E1F5EE',
                      borderRadius: '6px',
                      padding: '2px 8px',
                    }}>✅ Resuelto: {d.dateResolved}</span>
                    <span style={{
                      fontSize: '10px',
                      color: p.text,
                      background: p.bg,
                      borderRadius: '6px',
                      padding: '2px 8px',
                    }}>Prioridad {p.label}</span>
                  </div>

                  {/* Photos */}
                  {(d.photo || d.photoResolved) && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: d.photo && d.photoResolved ? '1fr 1fr' : '1fr',
                      gap: '8px',
                      marginTop: '10px',
                    }}>
                      {d.photo && (
                        <div>
                          <div style={{
                            fontSize: '10px',
                            color: '#aaa',
                            marginBottom: '4px',
                          }}>Antes</div>
                          <img src={d.photo} alt="Daño"
                            style={{
                              width: '100%',
                              borderRadius: '8px',
                              height: '100px',
                              objectFit: 'cover',
                            }} />
                        </div>
                      )}
                      {d.photoResolved && (
                        <div>
                          <div style={{
                            fontSize: '10px',
                            color: '#aaa',
                            marginBottom: '4px',
                          }}>Después</div>
                          <img src={d.photoResolved} alt="Arreglo"
                            style={{
                              width: '100%',
                              borderRadius: '8px',
                              height: '100px',
                              objectFit: 'cover',
                            }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}