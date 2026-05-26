import { GRID_COLS, GRID_ROWS, PRIORITY } from '../data/config'

function AlertTriangle({ priority }) {
  const color = PRIORITY[priority]?.color || '#999'
  return (
    <svg width="20" height="18" viewBox="0 0 20 18">
      <polygon points="10,1 19,17 1,17"
        fill={color} stroke="white" strokeWidth="1"/>
      <text x="10" y="13" textAnchor="middle"
        fontSize="7" fill="white" fontWeight="bold">!</text>
    </svg>
  )
}

export default function Grid({ sectorId, damages, onCellClick }) {
  const getCellDamages = (cell) =>
    damages.filter(d =>
      d.sectorId === sectorId &&
      d.cell === cell &&
      d.status === 'active'
    )

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `28px repeat(${GRID_COLS.length}, 1fr)`,
        background: '#f5f5f3',
        borderBottom: '1px solid #ddd',
      }}>
        <div />
        {GRID_COLS.map(c => (
          <div key={c} style={{
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: '#888',
            padding: '6px 0',
          }}>{c}</div>
        ))}
      </div>

      {/* Rows */}
      {GRID_ROWS.map((row, ri) => (
        <div key={row} style={{
          display: 'grid',
          gridTemplateColumns: `28px repeat(${GRID_COLS.length}, 1fr)`,
          borderBottom: ri < GRID_ROWS.length - 1 ? '1px solid #eee' : 'none',
        }}>
          {/* Row number */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: '#888',
            background: '#f5f5f3',
            borderRight: '1px solid #ddd',
          }}>{row}</div>

          {/* Cells */}
          {GRID_COLS.map((col) => {
            const cell = col + row
            const cellDamages = getCellDamages(cell)
            const hasDamage = cellDamages.length > 0
            const priority = hasDamage ? cellDamages[0].priority : null

            return (
              <button key={col} onClick={() => onCellClick(cell, cellDamages)}
                style={{
                  height: '50px',
                  background: hasDamage ? PRIORITY[priority].bg : 'white',
                  border: 'none',
                  borderLeft: '1px solid #eee',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.1s',
                }}>
                {hasDamage
                  ? <AlertTriangle priority={priority} />
                  : <span style={{ color: '#ccc', fontSize: '18px' }}>+</span>
                }
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}