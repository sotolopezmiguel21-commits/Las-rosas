import { useState } from 'react'
import { INVENTORY_CATEGORIES } from '../data/inventory'
import { inventoryStore } from '../data/inventoryStore'
import { SECTOR_TYPES } from '../data/config'
import Header from '../components/Header'

export default function InventoryFormPage({
  sector, onBack, onSaved, editItem,
  saveInventoryItem, updateInventoryItem,
}) {
  const isEdit = !!editItem
  const [step, setStep] = useState(isEdit ? 2 : 1)
  const [selectedCategory, setSelectedCategory] = useState(
    isEdit ? editItem.category : null
  )
  const [form, setForm] = useState({
    name:     isEdit ? editItem.name     : '',
    quantity: isEdit ? editItem.quantity : 1,
    detail:   isEdit ? editItem.detail   : '',
  })
  const [saving, setSaving] = useState(false)

  const type = SECTOR_TYPES[sector?.type] || { icon: '📍' }
  const category = selectedCategory
    ? INVENTORY_CATEGORIES[selectedCategory]
    : null

  const handleSave = async () => {
    if (!form.name || form.quantity < 1) return
    setSaving(true)
    try {
      const data = {
        sectorId:      sector.id,
        sectorName:    sector.name,
        category:      selectedCategory,
        categoryLabel: category.label,
        categoryIcon:  category.icon,
        name:          form.name,
        quantity:      Number(form.quantity),
        detail:        form.detail,
        dateCreated:   isEdit ? editItem.dateCreated : new Date().toISOString().split('T')[0],
      }
      if (isEdit) {
        inventoryStore.update(editItem.id, data)
        if (updateInventoryItem) {
          await updateInventoryItem({ ...data, id: editItem.id })
        }
      } else {
        const id = inventoryStore.add(data)
        if (saveInventoryItem) {
          await saveInventoryItem({ ...data, id })
        }
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header
        title={isEdit ? 'Editar elemento' : 'Agregar elemento'}
        subtitle={`${type.icon} ${sector?.name}`}
        onBack={step === 2 && !isEdit ? () => setStep(1) : onBack}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

        {/* STEP 1 — Seleccionar categoría */}
        {step === 1 && (
          <div>
            <div style={{
              fontSize: '13px',
              color: '#555',
              marginBottom: '14px',
            }}>Selecciona la categoría del elemento</div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              {Object.entries(INVENTORY_CATEGORIES).map(([key, cat]) => (
                <button key={key} onClick={() => {
                  setSelectedCategory(key)
                  setForm({ name: '', quantity: 1, detail: '' })
                  setStep(2)
                }} style={{
                  background: '#f5f5f3',
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '14px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <span style={{ fontSize: '22px' }}>{cat.icon}</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#333',
                    lineHeight: 1.3,
                  }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Completar datos */}
        {step === 2 && category && (
          <div>

            {/* Category pill */}
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
              marginBottom: '18px',
            }}>
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </div>

            {/* Element selector */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#555',
                marginBottom: '8px',
              }}>Elemento</div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '7px',
              }}>
                {category.items.map(item => (
                  <button key={item} onClick={() => setForm(f => ({ ...f, name: item }))}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '20px',
                      border: form.name === item
                        ? '2px solid #3B5FCC'
                        : '1px solid #ddd',
                      background: form.name === item ? '#EEF4FF' : '#f5f5f3',
                      color: form.name === item ? '#3B5FCC' : '#444',
                      fontSize: '13px',
                      fontWeight: form.name === item ? 600 : 400,
                      cursor: 'pointer',
                    }}>{item}</button>
                ))}
              </div>

              {/* Custom name if Otro */}
              {form.name === 'Otro' && (
                <input
                  type="text"
                  placeholder="Describe el elemento..."
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    background: '#f9f9f7',
                    boxSizing: 'border-box',
                  }}
                  onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                />
              )}
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#555',
                marginBottom: '8px',
              }}>Cantidad</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                width: 'fit-content',
                border: '1px solid #ddd',
                borderRadius: '10px',
                overflow: 'hidden',
              }}>
                <button onClick={() => setForm(f => ({
                  ...f, quantity: Math.max(1, f.quantity - 1)
                }))} style={{
                  width: '44px',
                  height: '44px',
                  background: '#f5f5f3',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#444',
                }}>−</button>
                <div style={{
                  width: '60px',
                  textAlign: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#111',
                }}>{form.quantity}</div>
                <button onClick={() => setForm(f => ({
                  ...f, quantity: f.quantity + 1
                }))} style={{
                  width: '44px',
                  height: '44px',
                  background: '#f5f5f3',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#444',
                }}>+</button>
              </div>
            </div>

            {/* Detail */}
            {form.name !== 'Otro' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#555',
                  marginBottom: '5px',
                }}>Detalle <span style={{ fontWeight: 400, color: '#aaa' }}>(opcional)</span></div>
                <input
                  type="text"
                  value={form.detail}
                  onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                  placeholder='Ej: "marca FV", "LED 9W", "eléctrica"...'
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    background: '#f9f9f7',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            )}

            {/* Save button */}
            <button onClick={handleSave}
              disabled={!form.name || form.quantity < 1 || saving}
              style={{
                width: '100%',
                padding: '14px',
                background: form.name && !saving ? '#3B5FCC' : '#eee',
                color: form.name && !saving ? 'white' : '#aaa',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: form.name && !saving ? 'pointer' : 'default',
              }}>
              {saving ? '⏳ Guardando...' : (isEdit ? 'Guardar cambios' : 'Agregar elemento')}
            </button>

          </div>
        )}
      </div>
    </div>
  )
}
