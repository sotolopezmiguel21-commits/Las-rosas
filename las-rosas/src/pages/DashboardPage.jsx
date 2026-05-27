import { useState, useEffect } from 'react'
import { damageStore } from '../data/store'
import { inventoryStore } from '../data/inventoryStore'
import { FLOORS, getAllSectors } from '../data/floors'
import { PRIORITY } from '../data/config'

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#f5f5f3',
      borderRadius: '12px',
      padding: '12px 8px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '26px',
        fontWeight: 700,
        color: color || '#111',
        lineHeight: 1.1,
      }}>{value}</div>
      <div style={{
        fontSize: '10px',
        color: '#888',
        marginTop: '3px',
        lineHeight: 1.3,
      }}>{label}</div>
    </div>
  )
}

function BarChart({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1,
        height: '8px',
        background: '#eee',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color || '#3B5FCC',
          borderRadius: '4px',
          transition: 'width 0.4s',
        }}/>
      </div>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#444',
        minWidth: '24px',
        textAlign: 'right',
      }}>{value}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: '11px',
      fontWeight: 600,
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: '10px',
      marginTop: '20px',
    }}>{children}</div>
  )
}

export default function DashboardPage() {
  const [damages, setDamages] = useState(() => damageStore.getAll())
  const [inventory, setInventory] = useState(() => inventoryStore.getAll())

  useEffect(() => {
    const u1 = damageStore.subscribe(setDamages)
    const u2 = inventoryStore.subscribe(setInventory)
    return () => { u1(); u2() }
  }, [])

  const allSectors = getAllSectors()
  const active = damages.filter(d => d.status === 'active')
  const resolved = damages.filter(d => d.status === 'resolved')

  // ── Estado general del hogar ──────────────────────────────
  const sectorsWithDamage = new Set(active.map(d => d.sectorId)).size
  const totalSectors = allSectors.length
  const sectorPct = totalSectors > 0
    ? Math.round((sectorsWithDamage / totalSectors) * 100)
    : 0

  const totalElements = inventory.reduce((a, i) => a + i.quantity, 0)
  const damagedElements = active.filter(d => d.inventoryItemId).length
  const elementPct = totalElements > 0
    ? Math.round((damagedElements / totalElements) * 100)
    : 0

  const generalPct = totalElements > 0
    ? Math.round((sectorPct + elementPct) / 2)
    : sectorPct

  const barColor = generalPct < 20
    ? '#1D9E75'
    : generalPct < 50
      ? '#EF9F27'
      : '#E24B4A'

  const statusLabel = generalPct === 0
    ? '✅ Sin daños registrados'
    : generalPct < 20
      ? '🟢 Buen estado general'
      : generalPct < 50
        ? '🟡 Estado regular'
        : '🔴 Requiere atención'

  // ── Sectores más críticos ─────────────────────────────────
  const sectorDamageCount = {}
  active.forEach(d => {
    sectorDamageCount[d.sectorId] = (sectorDamageCount[d.sectorId] || 0) + 1
  })
  const topSectors = Object.entries(sectorDamageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      sector: allSectors.find(s => s.id === id),
      count,
      alert: active.some(d => d.sectorId === id && d.priority === 'alta')
        ? 'alta'
        : active.some(d => d.sectorId === id && d.priority === 'media')
          ? 'media'
          : 'baja',
    }))

  const maxSectorCount = topSectors[0]?.count || 1

  // ── Daños por prioridad ───────────────────────────────────
  const byPriority = {
    alta:  active.filter(d => d.priority === 'alta').length,
    media: active.filter(d => d.priority === 'media').length,
    baja:  active.filter(d => d.priority === 'baja').length,
  }
  const maxPriority = Math.max(...Object.values(byPriority), 1)

  // ── Elementos que más se dañan ────────────────────────────
  const elementDamageCount = {}
  active.forEach(d => {
    if (d.inventoryItemName) {
      elementDamageCount[d.inventoryItemName] =
        (elementDamageCount[d.inventoryItemName] || 0) + 1
    }
  })
  const topElements = Object.entries(elementDamageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxElementCount = topElements[0]?.[1] || 1

  // ── Inventario general ────────────────────────────────────
  const inventorySummary = inventoryStore.getSummary()
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
  const maxInventory = inventorySummary[0]?.total || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid #eee',
        background: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Dashboard</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>
            Fundación Las Rosas
          </div>
        </div>
        <button onClick={() => {
          import('../utils/exportExcel').then(m => m.exportToExcel())
        }} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          background: '#1D9E75',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          📥 Excel
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 24px' }}>

        {/* ── Estado general ── */}
        <div style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '4px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px',
          }}>
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#111',
              }}>Estado general del hogar</div>
              <div style={{
                fontSize: '11px',
                color: '#888',
                marginTop: '2px',
              }}>{statusLabel}</div>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 800,
              color: barColor,
              lineHeight: 1,
            }}>{generalPct}%</div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: '10px',
            background: '#eee',
            borderRadius: '5px',
            overflow: 'hidden',
            marginBottom: '10px',
          }}>
            <div style={{
              width: `${generalPct}%`,
              height: '100%',
              background: barColor,
              borderRadius: '5px',
              transition: 'width 0.5s',
            }}/>
          </div>

          {/* Sub stats */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {[
              {
                label: 'Sectores afectados',
                value: `${sectorsWithDamage} / ${totalSectors}`,
                pct: sectorPct,
              },
              {
                label: 'Elementos afectados',
                value: totalElements > 0
                  ? `${damagedElements} / ${totalElements}`
                  : 'Sin inventario',
                pct: elementPct,
              },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1,
                minWidth: '120px',
                background: '#f5f5f3',
                borderRadius: '8px',
                padding: '8px 10px',
              }}>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  marginBottom: '2px',
                }}>{s.label}</div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#333',
                }}>{s.value}</div>
                {totalElements > 0 && (
                  <div style={{
                    fontSize: '10px',
                    color: barColor,
                    marginTop: '1px',
                  }}>{s.pct}%</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats generales ── */}
        <SectionTitle>Resumen</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
        }}>
          <StatCard
            label="Daños activos"
            value={active.length}
            color="#E24B4A"
          />
          <StatCard
            label="Resueltos"
            value={resolved.length}
            color="#1D9E75"
          />
          <StatCard
            label="Elementos registrados"
            value={totalElements}
            color="#3B5FCC"
          />
        </div>

        {/* ── Daños por prioridad ── */}
        <SectionTitle>Daños por prioridad</SectionTitle>
        <div style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: '12px',
          padding: '12px 14px',
        }}>
          {active.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '16px',
              color: '#aaa',
              fontSize: '13px',
            }}>✅ Sin daños activos</div>
          ) : (
            Object.entries(byPriority).map(([key, count]) => (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  width: '70px',
                  flexShrink: 0,
                }}>
                  <svg width="10" height="9" viewBox="0 0 10 9">
                    <polygon points="5,0 10,9 0,9"
                      fill={PRIORITY[key].color}/>
                  </svg>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: PRIORITY[key].text,
                  }}>{PRIORITY[key].label}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <BarChart
                    value={count}
                    max={maxPriority}
                    color={PRIORITY[key].color}
                  />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  width: '32px',
                  textAlign: 'right',
                  flexShrink: 0,
                }}>
                  {active.length > 0
                    ? Math.round((count / active.length) * 100) + '%'
                    : '0%'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Sectores más críticos ── */}
        {topSectors.length > 0 && (
          <>
            <SectionTitle>Sectores más críticos</SectionTitle>
            <div style={{
              background: 'white',
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '12px 14px',
            }}>
              {topSectors.map(({ sector, count, alert }) => (
                <div key={sector?.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: PRIORITY[alert].color,
                    flexShrink: 0,
                  }}/>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    flex: 1,
                    color: '#222',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{sector?.name || 'Sector desconocido'}</div>
                  <div style={{ flex: 1 }}>
                    <BarChart
                      value={count}
                      max={maxSectorCount}
                      color={PRIORITY[alert].color}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Elementos que más se dañan ── */}
        {topElements.length > 0 && (
          <>
            <SectionTitle>Elementos con más daños</SectionTitle>
            <div style={{
              background: 'white',
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '12px 14px',
            }}>
              {topElements.map(([name, count]) => (
                <div key={name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    width: '120px',
                    flexShrink: 0,
                    color: '#222',
                  }}>{name}</div>
                  <div style={{ flex: 1 }}>
                    <BarChart
                      value={count}
                      max={maxElementCount}
                      color="#3B5FCC"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Inventario general ── */}
        {inventorySummary.length > 0 && (
          <>
            <SectionTitle>Inventario general</SectionTitle>
            <div style={{
              background: 'white',
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '12px 14px',
            }}>
              {inventorySummary.map(item => (
                <div key={`${item.category}-${item.name}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}>
                  <span style={{
                    fontSize: '16px',
                    flexShrink: 0,
                  }}>{item.categoryIcon}</span>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    width: '110px',
                    flexShrink: 0,
                    color: '#222',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{item.name}</div>
                  <div style={{ flex: 1 }}>
                    <BarChart
                      value={item.total}
                      max={maxInventory}
                      color="#3B5FCC"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {inventorySummary.length === 0 && (
          <>
            <SectionTitle>Inventario general</SectionTitle>
            <div style={{
              background: 'white',
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              color: '#aaa',
              fontSize: '13px',
            }}>
              📦 Registra el inventario de los sectores para ver el resumen aquí
            </div>
          </>
        )}

      </div>
    </div>
  )
}