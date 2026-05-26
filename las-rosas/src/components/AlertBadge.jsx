import { PRIORITY } from '../data/config'

export default function AlertBadge({ level, count, small }) {
  if (!level) return null
  const p = PRIORITY[level]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: p.bg,
      color: p.text,
      borderRadius: '6px',
      padding: small ? '1px 6px' : '3px 8px',
      fontSize: small ? '10px' : '11px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      <svg width="9" height="8" viewBox="0 0 10 9">
        <polygon points="5,0 10,9 0,9" fill={p.color}/>
        <text x="5" y="8" textAnchor="middle" fontSize="5"
          fill="white" fontWeight="bold">!</text>
      </svg>
      {p.label}{count != null ? ` · ${count}` : ''}
    </span>
  )
}