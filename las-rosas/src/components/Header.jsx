export default function Header({ title, subtitle, onBack, right }) {
  return (
    <div style={{
      padding: '14px 16px 12px',
      borderBottom: '1px solid #eee',
      background: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: 'none',
          border: 'none',
          fontSize: '22px',
          cursor: 'pointer',
          padding: '0 8px 0 0',
          color: '#666',
          lineHeight: 1,
          flexShrink: 0,
        }}>←</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#111',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{title}</div>
        {subtitle && (
          <div style={{
            fontSize: '11px',
            color: '#888',
            marginTop: '1px',
          }}>{subtitle}</div>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}