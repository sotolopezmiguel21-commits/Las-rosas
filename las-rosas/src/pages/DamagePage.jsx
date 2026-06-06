import { useState, useRef } from 'react'
import { PRIORITY, SECTOR_TYPES } from '../data/config'
import { damageStore } from '../data/store'
import Header from '../components/Header'
import AlertBadge from '../components/AlertBadge'
import { compressImage } from '../utils/compressImage'

export default function DamagePage({ damage, sector, onBack, onResolved }) {
  const [showResolve, setShowResolve] = useState(false)
  const [resolvePhoto, setResolvePhoto] = useState(null)
  const fileRef = useRef()
  const type = SECTOR_TYPES[sector?.type] || { icon: '📍' }

  const handleResolve = () => {
    damageStore.resolve(damage.id, resolvePhoto)
    onResolved()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header
        title="Detalle del daño"
        subtitle={`${type.icon} ${sector?.name} · Celda ${damage.cell}`}
        onBack={onBack}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

        {/* Badges */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '14px',
        }}>
          <AlertBadge level={damage.priority} />
          <span style={{
            background: '#f5f5f3',
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '11px',
            color: '#666',
          }}>📅 {damage.dateCreated}</span>
          <span style={{
            background: '#f5f5f3',
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '11px',
            color: '#666',
          }}>{damage.id}</span>
        </div>

        {/* Info card */}
        <div style={{
          background: '#f5f5f3',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '14px',
        }}>
          {[
            ['Descripción del daño', damage.description],
            ['Posible solución', damage.solution],
            ['Implementos necesarios', damage.supplies],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '3px',
              }}>{label}</div>
              <div style={{
                fontSize: '14px',
                color: '#111',
                lineHeight: 1.5,
              }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Photo damage */}
        {damage.photo && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#888',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>Foto del daño</div>
            <img src={damage.photo} alt="Daño"
              style={{
                width: '100%',
                borderRadius: '10px',
                maxHeight: '220px',
                objectFit: 'cover',
              }} />
          </div>
        )}

        {/* Resolved badge */}
        {damage.status === 'resolved' && (
          <div style={{
            background: '#E1F5EE',
            border: '1px solid #1D9E75',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#085041' }}>
                Resuelto
              </div>
              <div style={{ fontSize: '12px', color: '#0F6E56' }}>
                {damage.dateResolved}
              </div>
            </div>
          </div>
        )}

        {/* Resolve photo */}
        {damage.status === 'resolved' && damage.photoResolved && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#888',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>Foto del arreglo</div>
            <img src={damage.photoResolved} alt="Arreglo"
              style={{
                width: '100%',
                borderRadius: '10px',
                maxHeight: '220px',
                objectFit: 'cover',
              }} />
          </div>
        )}

        {/* Actions */}
        {damage.status === 'active' && !showResolve && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={onBack} style={{
              flex: 1,
              padding: '13px',
              border: '1px solid #ddd',
              borderRadius: '12px',
              background: 'none',
              fontSize: '13px',
              cursor: 'pointer',
              color: '#666',
            }}>✏️ Editar</button>
            <button onClick={() => setShowResolve(true)} style={{
              flex: 2,
              padding: '13px',
              background: '#1D9E75',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}>✅ Marcar como resuelto</button>
          </div>
        )}

        {/* Resolve form */}
        {showResolve && (
          <div style={{
            background: '#E1F5EE',
            border: '1px solid #1D9E75',
            borderRadius: '12px',
            padding: '14px',
            marginTop: '8px',
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#085041',
              marginBottom: '10px',
            }}>Confirmar resolución</div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={async e => {
                const file = e.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = async ev => {
                  const compressed = await compressImage(ev.target.result, 800, 0.5)
                  setResolvePhoto(compressed)
                }
                reader.readAsDataURL(file)
              }}
            />

            {resolvePhoto
              ? (
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <img src={resolvePhoto} alt="Arreglo"
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      maxHeight: '180px',
                      objectFit: 'cover',
                    }} />
                  <button onClick={() => setResolvePhoto(null)} style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    border: 'none', borderRadius: '50%',
                    width: '26px', height: '26px',
                    cursor: 'pointer', fontSize: '14px',
                  }}>×</button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} style={{
                  width: '100%',
                  padding: '11px',
                  border: '1px dashed #0F6E56',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#0F6E56',
                  marginBottom: '10px',
                }}>📷 Foto del arreglo (opcional)</button>
              )
            }

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowResolve(false)} style={{
                flex: 1,
                padding: '11px',
                border: '1px solid #0F6E56',
                borderRadius: '8px',
                background: 'white',
                fontSize: '13px',
                cursor: 'pointer',
                color: '#085041',
              }}>Cancelar</button>
              <button onClick={handleResolve} style={{
                flex: 2,
                padding: '11px',
                background: '#1D9E75',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}>Confirmar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}