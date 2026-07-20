import { useState, useRef } from 'react'
import { improvementStore, IMPROVEMENT_TYPES } from '../data/improvementStore'
import { SECTOR_TYPES } from '../data/config'
import { uploadPhotoToDrive } from '../services/googleSheets'
import { compressImage } from '../utils/compressImage'
import Header from '../components/Header'

export default function ImprovementFormPage({ sector, onBack, onSaved, saveImprovement }) {
  const [form, setForm] = useState({ description: '', type: 'funcionalidad', photo: null })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const type = SECTOR_TYPES[sector?.type] || { icon: '📍' }

  const handleSave = async () => {
    if (!form.description.trim()) return
    setSaving(true)
    try {
      let photoUrl = null
      if (form.photo) {
        const filename = `mejora-${sector.id}-${Date.now()}.jpg`
        photoUrl = await uploadPhotoToDrive(form.photo, filename)
      }

      const item = {
        sectorId:       sector.id,
        sectorName:     sector.name,
        floor:          sector.floor || '',
        description:    form.description.trim(),
        type:           form.type,
        photo:          photoUrl,
        photoCompleted: null,
        dateCreated:    new Date().toISOString().split('T')[0],
        dateCompleted:  null,
        status:         'active',
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

        {/* Photo */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '6px',
          }}>Foto del lugar a mejorar <span style={{ fontWeight: 400, color: '#aaa' }}>(opcional)</span></div>
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
                setForm(f => ({ ...f, photo: compressed }))
              }
              reader.readAsDataURL(file)
            }}
          />
          {form.photo
            ? (
              <div style={{ position: 'relative' }}>
                <img src={form.photo} alt="Foto"
                  style={{
                    width: '100%', borderRadius: '10px',
                    maxHeight: '200px', objectFit: 'cover',
                  }} />
                <button onClick={() => setForm(f => ({ ...f, photo: null }))}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    border: 'none', borderRadius: '50%',
                    width: '28px', height: '28px',
                    cursor: 'pointer', fontSize: '15px',
                  }}>×</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} style={{
                width: '100%', padding: '14px',
                border: '1px dashed #ccc', borderRadius: '10px',
                background: '#f9f9f7', cursor: 'pointer',
                fontSize: '13px', color: '#888',
              }}>📷 Tomar o seleccionar foto</button>
            )
          }
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