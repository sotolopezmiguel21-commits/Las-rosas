import { useState } from 'react'
import { useSectorImprovements, improvementStore, IMPROVEMENT_TYPES } from '../data/improvementStore'
import { SECTOR_TYPES } from '../data/config'
import Header from '../components/Header'
import ImprovementFormPage from './ImprovementFormPage'

export default function ImprovementPage({
  sector, onBack,
  saveImprovement, completeImprovement, deleteImprovement,
}) {
  const improvements = useSectorImprovements(sector.id)
  const [showForm, setShowForm] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [completingId, setCompletingId] = useState(null)
  const type = SECTOR_TYPES[sector?.type] || { icon: '📍' }

  const pending = improvements.filter(i => i.status !== 'done')
  const done = improvements.filter(i => i.status === 'done')

  const handleComplete = async (imp) => {
    setCompletingId(imp.id)
    improvementStore.complete(imp.id)
    if (completeImprovement) {
      await completeImprovement({ ...imp, status: 'done', dateCompleted: new Date().toISOString().split('T')[0] })
    }
    setCompletingId(null)
  }

  const handleDelete = async (id) => {
    improvementStore.remove(id)
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
                {pending.map(imp => <ImprovementCard key={imp.id} imp={imp}
                  onComplete={handleComplete} onDelete={() => setConfirmId(imp.id)}
                  confirmId={confirmId} onCancelDelete={() => setConfirmId(null)}
                  onConfirmDelete={handleDelete} completing={completingId === imp.id}
                />)}
              </div>
            )}

            {/* Realizadas */}
            {done.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, color: '#888',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
                }}>Realizadas</div>
                {done.map(imp => <ImprovementCard key={imp.id} imp={imp}
                  onDelete={() => setConfirmId(imp.id)}
                  confirmId={confirmId} onCancelDelete={() => setConfirmId(null)}
                  onConfirmDelete={handleDelete}
                />)}
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

function ImprovementCard({ imp, onComplete, onDelete, confirmId, onCancelDelete, onConfirmDelete, completing }) {
  const t = IMPROVEMENT_TYPES[imp.type] || { label: imp.type, icon: '💡', color: '#888', bg: '#f5f5f3', text: '#555' }
  const isDone = imp.status === 'done'

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${isDone ? '#eee' : t.color + '44'}`,
      borderRadius: '10px',
      padding: '11px 13px',
      marginBottom: '8px',
      opacity: isDone ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{
          fontSize: '20px',
          background: t.bg,
          borderRadius: '8px',
          padding: '4px 6px',
          flexShrink: 0,
        }}>{t.icon}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '13px', fontWeight: 600,
            color: isDone ? '#888' : '#111',
            textDecoration: isDone ? 'line-through' : 'none',
            marginBottom: '3px',
          }}>{imp.description}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 600,
              color: t.text, background: t.bg,
              borderRadius: '6px', padding: '2px 7px',
            }}>{t.label}</span>
            <span style={{ fontSize: '10px', color: '#aaa' }}>
              {isDone ? `✅ ${imp.dateCompleted}` : `📅 ${imp.dateCreated}`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {!isDone && (
            <button onClick={() => onComplete(imp)} disabled={completing} style={{
              background: 'none', border: '1px solid #1D9E75',
              borderRadius: '6px', padding: '5px 7px',
              fontSize: '12px', cursor: 'pointer', color: '#1D9E75',
            }}>{completing ? '⏳' : '✅'}</button>
          )}
          <button onClick={onDelete} style={{
            background: 'none', border: '1px solid #ddd',
            borderRadius: '6px', padding: '5px 7px',
            fontSize: '12px', cursor: 'pointer', color: '#E24B4A',
          }}>🗑</button>
        </div>
      </div>

      {confirmId === imp.id && (
        <div style={{
          marginTop: '10px', padding: '10px',
          background: '#FCEBEB', borderRadius: '8px',
          border: '1px solid #E24B4A44',
        }}>
          <div style={{ fontSize: '12px', color: '#A32D2D', marginBottom: '8px' }}>
            ¿Eliminar esta mejora?
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