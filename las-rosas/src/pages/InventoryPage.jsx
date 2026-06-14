import { useState } from 'react'
import { useSectorInventory } from '../data/inventoryStore'
import { inventoryStore } from '../data/inventoryStore'
import { SECTOR_TYPES } from '../data/config'
import Header from '../components/Header'
import InventoryFormPage from './InventoryFormPage'

function ItemRow({ item, onEdit, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div style={{
      background: 'white',
      border: '1px solid #eee',
      borderRadius: '10px',
      padding: '11px 13px',
      marginBottom: '7px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        {/* Icon + info */}
        <span style={{ fontSize: '20px', flexShrink: 0 }}>
          {item.categoryIcon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#111',
          }}>{item.name}</div>
          {item.detail ? (
            <div style={{
              fontSize: '11px',
              color: '#888',
              marginTop: '1px',
            }}>{item.detail}</div>
          ) : null}
          <div style={{
            fontSize: '10px',
            color: '#aaa',
            marginTop: '1px',
          }}>{item.categoryLabel}</div>
        </div>

        {/* Quantity badge */}
        <div style={{
          background: '#EEF4FF',
          color: '#3B5FCC',
          borderRadius: '8px',
          padding: '4px 10px',
          fontSize: '16px',
          fontWeight: 700,
          flexShrink: 0,
        }}>{item.quantity}</div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flexShrink: 0,
        }}>
          <button onClick={() => onEdit(item)} style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            color: '#555',
          }}>✏️</button>
          <button onClick={() => setShowConfirm(true)} style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            color: '#E24B4A',
          }}>🗑</button>
        </div>
      </div>

      {/* Delete confirm */}
      {showConfirm && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: '#FCEBEB',
          borderRadius: '8px',
          border: '1px solid #E24B4A44',
        }}>
          <div style={{
            fontSize: '12px',
            color: '#A32D2D',
            marginBottom: '8px',
          }}>¿Eliminar este elemento?</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowConfirm(false)} style={{
              flex: 1,
              padding: '7px',
              border: '1px solid #ddd',
              borderRadius: '7px',
              background: 'white',
              fontSize: '12px',
              cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={() => onDelete(item.id)} style={{
              flex: 1,
              padding: '7px',
              border: 'none',
              borderRadius: '7px',
              background: '#E24B4A',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}>Eliminar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InventoryPage({
  sector, onBack,
  saveInventoryItem, updateInventoryItem, deleteInventoryItem,
}) {
  const inventory = useSectorInventory(sector.id)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const type = SECTOR_TYPES[sector?.type] || { icon: '📍' }

  const handleDelete = async (id) => {
    inventoryStore.remove(id)
    if (deleteInventoryItem) {
      await deleteInventoryItem(id)
    }
  }

  if (showForm || editItem) {
    return (
      <InventoryFormPage
        sector={sector}
        editItem={editItem}
        onBack={() => {
          setShowForm(false)
          setEditItem(null)
        }}
        onSaved={() => {
          setShowForm(false)
          setEditItem(null)
        }}
        saveInventoryItem={saveInventoryItem}
        updateInventoryItem={updateInventoryItem}
      />
    )
  }

  // Group items by category
  const grouped = inventory.reduce((acc, item) => {
    const key = item.category
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const totalItems = inventory.reduce((a, i) => a + i.quantity, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Header
        title="Inventario"
        subtitle={`${type.icon} ${sector.name} · ${totalItems} elemento${totalItems !== 1 ? 's' : ''}`}
        onBack={onBack}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {inventory.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '50px 20px',
            color: '#aaa',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '40px', marginBottom: '12px' }}>📦</span>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '6px',
              color: '#666',
            }}>Sin elementos registrados</div>
            <div style={{ fontSize: '13px' }}>
              Toca el botón para agregar elementos de este sector
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([catKey, items]) => (
            <div key={catKey} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '7px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <span>{items[0].categoryIcon}</span>
                {items[0].categoryLabel}
              </div>
              {items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={(i) => setEditItem(i)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))
        )}

        {/* Spacer for button */}
        <div style={{ height: '70px' }} />
      </div>

      {/* Add button */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        padding: '10px 14px',
        background: 'white',
        borderTop: '1px solid #eee',
      }}>
        <button onClick={() => setShowForm(true)} style={{
          width: '100%',
          padding: '13px',
          background: '#3B5FCC',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}>+ Agregar elemento</button>
      </div>
    </div>
  )
}
