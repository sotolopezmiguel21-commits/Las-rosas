import { useState, useEffect } from 'react'
import { damageStore } from '../data/store'
import { getSectorById } from '../data/floors'
import { SECTOR_TYPES, PRIORITY } from '../data/config'
import Header from '../components/Header'

const driveUrl = (url) =>
  url?.includes('drive.google.com')
    ? url.replace('uc?id=', 'thumbnail?id=') + '&sz=w800'
    : url

export default function ResolvedPage({ onBack }) {
  const [damages, setDamages] = useState(() => damageStore.getAll())
  const [expandedId, setExpandedId] = useState(null)

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
              const fromImprovement = d.id?.startsWith('M')
              const p = PRIORITY[d.priority] || { label: 'Mejora', text: '#6B21A8', bg: '#F5F0FF' }
              const hasCell = d.cell && d.cell !== '—'
              const isExpanded = expandedId === d.id

              return (
                <div key={d.id} style={{
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
                >
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
                        {type.icon} {sector?.name}{hasCell ? ` · Celda ${d.cell}` : ''}{fromImprovement ? ' · 💡 Mejora' : ''}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span style={{
                        fontSize: '10px',
                        color: '#aaa',
                        whiteSpace: 'nowrap',
                      }}>{d.id}</span>
                      <span style={{
                        fontSize: '12px',
                        color: '#bbb',
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s',
                      }}>▾</span>
                    </div>
                  </div>

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
                    }}>{fromImprovement ? '💡 Mejora completada' : `Prioridad ${p.label}`}</span>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ marginTop: '10px' }}>
                      {/* Solution */}
                      {d.solution && (
                        <div style={{
                          fontSize: '12px',
                          color: '#555',
                          marginBottom: '10px',
                          paddingLeft: '8px',
                          borderLeft: '2px solid #1D9E75',
                        }}>
                          {d.solution}
                        </div>
                      )}

                      {/* Inventory item */}
                      {d.inventoryItemName && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#888',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '3px',
                          }}>Elemento dañado</div>
                          <div style={{
                            fontSize: '13px',
                            color: '#111',
                            lineHeight: 1.5,
                          }}>{d.inventoryItemName}</div>
                        </div>
                      )}

                      {/* Supplies */}
                      {d.supplies && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#888',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '3px',
                          }}>Implementos necesarios</div>
                          <div style={{
                            fontSize: '13px',
                            color: '#111',
                            lineHeight: 1.5,
                          }}>{d.supplies}</div>
                        </div>
                      )}

                      {/* Photos */}
                      {(d.photo || d.photoResolved) && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: d.photo && d.photoResolved ? '1fr 1fr' : '1fr',
                          gap: '8px',
                        }}>
                          {d.photo && (
                            <div>
                              <div style={{
                                fontSize: '10px',
                                color: '#aaa',
                                marginBottom: '4px',
                              }}>Antes</div>
                              <img src={driveUrl(d.photo)} alt="Daño"
                                style={{
                                  width: '100%',
                                  borderRadius: '8px',
                                  height: '120px',
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
                              <img src={driveUrl(d.photoResolved)} alt="Arreglo"
                                style={{
                                  width: '100%',
                                  borderRadius: '8px',
                                  height: '120px',
                                  objectFit: 'cover',
                                }} />
                            </div>
                          )}
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
