import { useState } from 'react'
import { improvementStore, IMPROVEMENT_TYPES } from '../data/improvementStore'
import { SECTOR_TYPES } from '../data/config'
import Header from '../components/Header'

export default function ImprovementFormPage({ sector, onBack, onSaved, saveImprovement }) {
  const [form, setForm] = useState({ description: '', type: 'funcionalidad' })
  const [saving, setSaving] = useState(false)
  const type = SECTOR_TYPES[sector?.type] || { icon: '📍' }

  const handleSave = async () => {
    if (!form.description.trim()) return
    setSaving(true)
    try {
      const item = {
        sectorId:      sector.id,
        sectorName:    sector.name,
        floor:         sector.floor || '',
        description:   form.description.trim(),
        type:          form.type,
        dateCreated:   new Date().toISOString().split('T')[0],
        dateCompleted: null,
        status:        'pending',
      }
      const id = improvementStore.add(item)
      if (saveImprovement) await saveImprovement({ ...item, id })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="Nueva mejora" onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

        {/* Context pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#f5f5f3', border: '1px solid #ddd',
          borderRadius: '20px', padding: '4px 12px',
          fontSize: '12px', color: '#555', marginBottom: '16px',
        }}>
          <span>{type.icon}</span>
          <span>{sector?.name}</span>
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '5px',
          }}>¿Qué mejora se propone?</div>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Ej: Instalar pasamanos en el pasillo, Pintar habitación..."
            rows={4}
            style={{
              width: '100%', padding: '10px 12px', fontSize: '14px',
              border: '1px solid #ddd', borderRadius: '10px',
              background: '#f9f9f7', color: '#111', resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tipo */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '8px',
          }}>Tipo de mejora</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
          }}>
            {Object.entries(IMPROVEMENT_TYPES).map(([key, t]) => (
              <button key={key}
                onClick={() => setForm(f => ({ ...f, type: key }))}
                style={{
                  padding: '12px 10px',
                  background: form.type === key ? t.bg : '#f5f5f3',
                  border: form.type === key ? `2px solid ${t.color}` : '1px solid #ddd',
                  borderRadius: '10px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '5px',
                }}>
                <span style={{ fontSize: '22px' }}>{t.icon}</span>
                <span style={{
                  fontSize: '12px', fontWeight: 600,
                  color: form.type === key ? t.text : '#666',
                }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave}
          disabled={!form.description.trim() || saving}
          style={{
            width: '100%', padding: '14px',
            background: form.description.trim() && !saving ? '#9333EA' : '#eee',
            color: form.description.trim() && !saving ? 'white' : '#aaa',
            border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: 600,
            cursor: form.description.trim() && !saving ? 'pointer' : 'default',
          }}>
          {saving ? '⏳ Guardando...' : 'Registrar mejora'}
        </button>

      </div>
    </div>
  )
}