import { useState, useRef, useEffect } from 'react'
import { PRIORITY, SECTOR_TYPES } from '../data/config'
import { damageStore } from '../data/store'
import { inventoryStore } from '../data/inventoryStore'
import { uploadPhotoToDrive } from '../services/googleSheets'
import Header from '../components/Header'

export default function FormPage({ sector, floor, cell, onBack, onSaved }) {
  const [form, setForm] = useState({
    description: '',
    solution: '',
    priority: 'media',
    supplies: '',
    photo: null,
    inventoryItemId: null,
    inventoryItemName: null,
  })
  const [sectorInventory, setSectorInventory] = useState([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const type = SECTOR_TYPES[sector?.type] || { icon: '📍' }

  useEffect(() => {
    setSectorInventory(inventoryStore.getBySector(sector.id))
  }, [sector.id])

  const handleSave = async () => {
    if (!form.description.trim()) return
    setSaving(true)
    try {
      let photoUrl = null
      if (form.photo) {
        const filename = `daño-${sector.id}-${Date.now()}.jpg`
        photoUrl = await uploadPhotoToDrive(form.photo, filename)
      }
      const damage = {
        sectorId:          sector.id,
        sectorName:        sector.name,
        floor,
        cell,
        description:       form.description,
        solution:          form.solution,
        priority:          form.priority,
        supplies:          form.supplies,
        photo:             photoUrl,
        inventoryItemId:   form.inventoryItemId,
        inventoryItemName: form.inventoryItemName,
        photoResolved:     null,
        dateCreated:       new Date().toISOString().split('T')[0],
        dateResolved:      null,
        status:            'active',
      }
      const id = damageStore.add(damage)
      onSaved({ ...damage, id })
    } finally {
      setSaving(false)
    }
  }

  const field = (label, key, placeholder) => (
    <div style={{ marginBottom: '14px' }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#555',
        marginBottom: '5px',
      }}>{label}</div>
      <textarea
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          border: '1px solid #ddd',
          borderRadius: '10px',
          background: '#f9f9f7',
          color: '#111',
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header title="Registrar daño" onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

        {/* Context pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#f5f5f3',
          border: '1px solid #ddd',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '12px',
          color: '#555',
          marginBottom: '16px',
        }}>
          <span>{type.icon}</span>
          <span>{sector?.name}</span>
          <span style={{ color: '#ccc' }}>·</span>
          <span>Celda {cell}</span>
        </div>

        {field('¿Qué está dañado?', 'description', 'Ej: Llave del lavamanos gotea constantemente...')}
        {field('Posible solución', 'solution', 'Ej: Cambio de cartucho o reemplazo de llave...')}

        {/* Priority */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#555',
            marginBottom: '8px',
          }}>Nivel de prioridad</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
          }}>
            {Object.entries(PRIORITY).map(([key, p]) => (
              <button key={key}
                onClick={() => setForm(f => ({ ...f, priority: key }))}
                style={{
                  padding: '10px 6px',
                  background: form.priority === key ? p.bg : '#f5f5f3',
                  border: form.priority === key
                    ? `2px solid ${p.color}`
                    : '1px solid #ddd',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                <svg width="18" height="16" viewBox="0 0 18 16">
                  <polygon points="9,1 17,15 1,15" fill={p.color}/>
                  <text x="9" y="12" textAnchor="middle"
                    fontSize="7" fill="white" fontWeight="bold">!</text>
                </svg>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: form.priority === key ? p.text : '#666',
                }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {field('Implementos necesarios', 'supplies', 'Ej: Llave inglesa, cartucho FV...')}

        {/* Inventory link */}
        {sectorInventory.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#555',
              marginBottom: '6px',
            }}>
              ¿Qué elemento está dañado?
              <span style={{
                fontWeight: 400,
                color: '#aaa',
                marginLeft: '4px',
              }}>(opcional)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              <button
                onClick={() => setForm(f => ({
                  ...f,
                  inventoryItemId: null,
                  inventoryItemName: null,
                }))}
                style={{
                  padding: '7px 12px',
                  borderRadius: '20px',
                  border: !form.inventoryItemId
                    ? '2px solid #888'
                    : '1px solid #ddd',
                  background: !form.inventoryItemId ? '#f0f0f0' : '#f9f9f7',
                  color: !form.inventoryItemId ? '#333' : '#888',
                  fontSize: '12px',
                  fontWeight: !form.inventoryItemId ? 600 : 400,
                  cursor: 'pointer',
                }}>
                Sin especificar
              </button>
              {sectorInventory.map(item => (
                <button key={item.id}
                  onClick={() => setForm(f => ({
                    ...f,
                    inventoryItemId:   item.id,
                    inventoryItemName: item.name,
                  }))}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '20px',
                    border: form.inventoryItemId === item.id
                      ? '2px solid #3B5FCC'
                      : '1px solid #ddd',
                    background: form.inventoryItemId === item.id
                      ? '#EEF4FF'
                      : '#f9f9f7',
                    color: form.inventoryItemId === item.id
                      ? '#3B5FCC'
                      : '#444',
                    fontSize: '12px',
                    fontWeight: form.inventoryItemId === item.id ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                  <span>{item.categoryIcon}</span>
                  <span>{item.name}</span>
                  <span style={{
                    background: '#ddd',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '10px',
                    color: '#555',
                  }}>×{item.quantity}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photo */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#555',
            marginBottom: '6px',
          }}>Foto del daño</div>
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
              reader.onload = ev => {
                setForm(f => ({ ...f, photo: ev.target.result }))
              }
              reader.readAsDataURL(file)
            }}
          />
          {form.photo
            ? (
              <div style={{ position: 'relative' }}>
                <img src={form.photo} alt="Foto"
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    maxHeight: '200px',
                    objectFit: 'cover',
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
                width: '100%',
                padding: '14px',
                border: '1px dashed #ccc',
                borderRadius: '10px',
                background: '#f9f9f7',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#888',
              }}>📷 Tomar o seleccionar foto</button>
            )
          }
        </div>

        {/* Save */}
        <button onClick={handleSave}
          disabled={!form.description.trim() || saving}
          style={{
            width: '100%',
            padding: '14px',
            background: form.description.trim() && !saving ? '#E24B4A' : '#eee',
            color: form.description.trim() && !saving ? 'white' : '#aaa',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: form.description.trim() && !saving ? 'pointer' : 'default',
          }}>
          {saving ? '⏳ Subiendo foto...' : 'Registrar daño'}
        </button>

      </div>
    </div>
  )
}