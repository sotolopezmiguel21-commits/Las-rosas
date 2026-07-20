import { useState, useRef } from 'react'
import { useSectorImprovements, IMPROVEMENT_TYPES } from '../data/improvementStore'
import { SECTOR_TYPES } from '../data/config'
import { uploadPhotoToDrive } from '../services/googleSheets'
import { compressImage } from '../utils/compressImage'
import Header from '../components/Header'
import ImprovementFormPage from './ImprovementFormPage'

const driveUrl = (url) =>
  url?.includes('drive.google.com')
    ? url.replace('uc?id=', 'thumbnail?id=') + '&sz=w800'
    : url

export default function ImprovementPage({
  sector, onBack,
  saveImprovement, completeImprovement, deleteImprovement,
  discardImprovement, reactivateImprovement,
}) {
  const improvements = useSectorImprovements(sector.id)
  const [showForm, setShowForm] = useState(false)
  const [confirmId, setConfirmId] = useState(null)      // eliminar (permanente)
  const [discardId, setDiscardId] = useState(null)       // confirmar descarte
  const [completingId, setCompletingId] = useState(null) // tarjeta con panel de completar abierto
  const [completionPhoto, setCompletionPhoto] = useState(null)
  const [busyId, setBusyId] = useState(null)             // acción en curso (spinner)
  const type = SECTOR_TYPES[sector?.type] || { icon: '📍' }

  const pending = improvements.filter(i => i.status !== 'discarded')
  const discarded = improvements.filter(i => i.status === 'discarded')

  const openComplete = (imp) => {
    setCompletingId(imp.id)
    setCompletionPhoto(null)
  }

  const handleConfirmComplete = async (imp) => {
    setBusyId(imp.id)
    try {
      let photoUrl = null
      if (completionPhoto) {
        const filename = `mejora-completada-${imp.sectorId}-${Date.now()}.jpg`
        photoUrl = await uploadPhotoToDrive(completionPhoto, filename)
      }
      if (completeImprovement) await completeImprovement(imp, photoUrl)
      setCompletingId(null)
      setCompletionPhoto(null)
    } finally {
      setBusyId(null)
    }
  }

  const handleDiscard = async (imp) => {
    setBusyId(imp.id)
    try {
      if (discardImprovement) await discardImprovement(imp)
      setDiscardId(null)
    } finally {
      setBusyId(null)
    }
  }

  const handleReactivate = async (imp) => {
    setBusyId(imp.id)
    try {
      if (reactivateImprovement) await reactivateImprovement(imp)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id) => {
    if (deleteImprovement) await deleteImprovement(id)
    setConfirmId(null)
  }

  if (showForm) {
    return (
      <ImprovementFormPage
        sector={sector}
        onBack={() => setShowForm(false)}
        onSaved={() => setShowForm(false)}
        saveImprovement={saveImprovement}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header
        title="Mejoras"
        subtitle={`${type.icon} ${sector.name} · ${pending.length} pendiente${pending.length !== 1 ? 's' : ''}`}
        onBack={onBack}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {improvements.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '50px 20px', color: '#aaa', textAlign: 'center',
          }}>
            <span style={{ fontSize: '40px', marginBottom: '12px' }}>💡</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>
              Sin mejoras registradas
            </div>
            <div style={{ fontSize: '13px' }}>
              Toca el botón para agregar una mejora
            </div>
          </div>
        ) : (
          <>
            {/* Pendientes */}
            {pending.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, color: '#888',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
                }}>Pendientes</div>
                {pending.map(imp => (
                  <ImprovementCard key={imp.id} imp={imp}
                    busy={busyId === imp.id}
                    isCompleting={completingId === imp.id}
                    completionPhoto={completionPhoto}
                    onSetCompletionPhoto={setCompletionPhoto}
                    onOpenComplete={() => openComplete(imp)}
                    onCancelComplete={() => { setCompletingId(null); setCompletionPhoto(null) }}
                    onConfirmComplete={() => handleConfirmComplete(imp)}
                    isDiscarding={discardId === imp.id}
                    onOpenDiscard={() => setDiscardId(imp.id)}
                    onCancelDiscard={() => setDiscardId(null)}
                    onConfirmDiscard={() => handleDiscard(imp)}
                  />
                ))}
              </div>
            )}

            {/* Descartadas */}
            {discarded.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, color: '#888',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
                }}>Descartadas</div>
                {discarded.map(imp => (
                  <ImprovementCard key={imp.id} imp={imp}
                    busy={busyId === imp.id}
                    discardedView
                    onReactivate={() => handleReactivate(imp)}
                    onDelete={() => setConfirmId(imp.id)}
                    confirmId={confirmId}
                    onCancelDelete={() => setConfirmId(null)}
                    onConfirmDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div style={{ height: '70px' }} />
      </div>

      {/* Add button */}
      <div style={{
        position: 'sticky', bottom: 0, padding: '10px 14px',
        background: 'white', borderTop: '1px solid #eee',
      }}>
        <button onClick={() => setShowForm(true)} style={{
          width: '100%', padding: '13px',
          background: '#9333EA', color: 'white',
          border: 'none', borderRadius: '12px',
          fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        }}>+ Agregar mejora</button>
      </div>
    </div>
  )
}

function ImprovementCard({
  imp, busy, discardedView,
  isCompleting, completionPhoto, onSetCompletionPhoto,
  onOpenComplete, onCancelComplete, onConfirmComplete,
  isDiscarding, onOpenDiscard, onCancelDiscard, onConfirmDiscard,
  onReactivate, onDelete, confirmId, onCancelDelete, onConfirmDelete,
}) {
  const fileRef = useRef()
  const t = IMPROVEMENT_TYPES[imp.type] || { label: imp.type, icon: '💡', color: '#888', bg: '#f5f5f3', text: '#555' }

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${discardedView ? '#eee' : t.color + '44'}`,
      borderRadius: '10px',
      padding: '11px 13px',
      marginBottom: '8px',
      opacity: discardedView ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {imp.photo
          ? (
            <img src={driveUrl(imp.photo)} alt="Mejora" style={{
              width: '44px', height: '44px', borderRadius: '8px',
              objectFit: 'cover', flexShrink: 0,
            }} />
          ) : (
            <span style={{
              fontSize: '20px', background: t.bg,
              borderRadius: '8px', padding: '4px 6px', flexShrink: 0,
            }}>{t.icon}</span>
          )
        }

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '13px', fontWeight: 600,
            color: discardedView ? '#888' : '#111',
            textDecoration: discardedView ? 'line-through' : 'none',
            marginBottom: '3px',
          }}>{imp.description}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 600,
              color: t.text, background: t.bg,
              borderRadius: '6px', padding: '2px 7px',
            }}>{t.label}</span>
            <span style={{ fontSize: '10px', color: '#aaa' }}>📅 {imp.dateCreated}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {discardedView ? (
            <>
              <button onClick={onReactivate} disabled={busy} style={{
                background: 'none', border: '1px solid #3B5FCC',
                borderRadius: '6px', padding: '5px 7px',
                fontSize: '12px', cursor: 'pointer', color: '#3B5FCC',
              }}>{busy ? '⏳' : '↩️'}</button>
              <button onClick={onDelete} style={{
                background: 'none', border: '1px solid #ddd',
                borderRadius: '6px', padding: '5px 7px',
                fontSize: '12px', cursor: 'pointer', color: '#E24B4A',
              }}>🗑</button>
            </>
          ) : (
            <>
              <button onClick={onOpenComplete} disabled={busy || isCompleting} style={{
                background: 'none', border: '1px solid #1D9E75',
                borderRadius: '6px', padding: '5px 7px',
                fontSize: '12px', cursor: 'pointer', color: '#1D9E75',
              }}>✅</button>
              <button onClick={onOpenDiscard} disabled={busy} style={{
                background: 'none', border: '1px solid #ddd',
                borderRadius: '6px', padding: '5px 7px',
                fontSize: '12px', cursor: 'pointer', color: '#888',
              }}>❌</button>
            </>
          )}
        </div>
      </div>

      {/* Confirmar completar (con foto opcional) */}
      {isCompleting && (
        <div style={{
          marginTop: '10px', padding: '10px',
          background: '#E1F5EE', borderRadius: '8px',
          border: '1px solid #1D9E7544',
        }}>
          <div style={{ fontSize: '12px', color: '#085041', marginBottom: '8px', fontWeight: 600 }}>
            Marcar mejora como completada
          </div>

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
                onSetCompletionPhoto(compressed)
              }
              reader.readAsDataURL(file)
            }}
          />

          {completionPhoto
            ? (
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <img src={completionPhoto} alt="Mejora completada" style={{
                  width: '100%', borderRadius: '8px', maxHeight: '160px', objectFit: 'cover',
                }} />
                <button onClick={() => onSetCompletionPhoto(null)} style={{
                  position: 'absolute', top: '6px', right: '6px',
                  background: 'rgba(0,0,0,0.6)', color: 'white',
                  border: 'none', borderRadius: '50%',
                  width: '26px', height: '26px', cursor: 'pointer', fontSize: '14px',
                }}>×</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} style={{
                width: '100%', padding: '10px',
                border: '1px dashed #0F6E56', borderRadius: '8px',
                background: 'white', cursor: 'pointer',
                fontSize: '12px', color: '#0F6E56', marginBottom: '8px',
              }}>📷 Foto de la mejora realizada (opcional)</button>
            )
          }

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onCancelComplete} disabled={busy} style={{
              flex: 1, padding: '9px', border: '1px solid #0F6E56',
              borderRadius: '7px', background: 'white', fontSize: '12px', cursor: 'pointer', color: '#085041',
            }}>Cancelar</button>
            <button onClick={onConfirmComplete} disabled={busy} style={{
              flex: 2, padding: '9px', background: '#1D9E75', color: 'white',
              border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>{busy ? '⏳ Guardando...' : 'Confirmar y pasar a Arreglos'}</button>
          </div>
        </div>
      )}

      {/* Confirmar descarte */}
      {isDiscarding && (
        <div style={{
          marginTop: '10px', padding: '10px',
          background: '#f5f5f3', borderRadius: '8px', border: '1px solid #ddd',
        }}>
          <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
            ¿Descartar esta mejora? Quedará guardada en el historial como descartada.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onCancelDiscard} style={{
              flex: 1, padding: '7px', border: '1px solid #ddd',
              borderRadius: '7px', background: 'white', fontSize: '12px', cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={onConfirmDiscard} disabled={busy} style={{
              flex: 1, padding: '7px', border: 'none', borderRadius: '7px',
              background: '#888', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>{busy ? '⏳' : 'Descartar'}</button>
          </div>
        </div>
      )}

      {/* Confirmar eliminación permanente (desde descartadas) */}
      {confirmId === imp.id && (
        <div style={{
          marginTop: '10px', padding: '10px',
          background: '#FCEBEB', borderRadius: '8px',
          border: '1px solid #E24B4A44',
        }}>
          <div style={{ fontSize: '12px', color: '#A32D2D', marginBottom: '8px' }}>
            ¿Eliminar esta mejora para siempre?
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onCancelDelete} style={{
              flex: 1, padding: '7px', border: '1px solid #ddd',
              borderRadius: '7px', background: 'white', fontSize: '12px', cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={() => onConfirmDelete(imp.id)} style={{
              flex: 1, padding: '7px', border: 'none', borderRadius: '7px',
              background: '#E24B4A', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>Eliminar</button>
          </div>
        </div>
      )}
    </div>
  )
}
