import { SECTOR_TYPES, PRIORITY } from '../data/config'
import AlertBadge from './AlertBadge'

export default function SectorCard({ sector, alert, damageCount, onClick }) {
  const type = SECTOR_TYPES[sector.type] || { label: sector.type, icon: '📍' }
  const bgColor = alert ? PRIORITY[alert].bg : '#f5f5f3'
  const borderColor = alert ? `${PRIORITY[alert].color}44` : '#e5e5e3'

  return (
    <button onClick={onClick} style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '12px',
      padding: '12px',
      cursor: 'pointer',
      textAlign: 'left',
      width: '100%',
      transition: 'transform 0.1s',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '6px',
      }}>
        <span style={{ fontSize: '20px', lineHeight: 1 }}>{type.icon}</span>
        {alert && <AlertBadge level={alert} count={damageCount} small />}
      </div>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: alert ? PRIORITY[alert].text : '#222',
        lineHeight: 1.3,
      }}>{sector.name}</div>
      <div style={{
        fontSize: '10px',
        color: '#888',
        marginTop: '2px',
      }}>{type.label}</div>
    </button>
  )
}