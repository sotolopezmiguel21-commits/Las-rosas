import * as XLSX from 'xlsx'
import { damageStore } from '../data/store'
import { inventoryStore } from '../data/inventoryStore'
import { getAllSectors } from '../data/floors'
import { FLOORS } from '../data/floors'

const getFloorLabel = (sectorId) => {
  for (const [floorNum, floor] of Object.entries(FLOORS)) {
    for (const group of floor.groups) {
      if (group.sectors.find(s => s.id === sectorId)) {
        return floor.label
      }
    }
  }
  return ''
}

const getPriorityLabel = (priority) => {
  const map = { alta: 'Alta', media: 'Media', baja: 'Baja' }
  return map[priority] || priority
}

export function exportToExcel() {
  const damages   = damageStore.getAll()
  const inventory = inventoryStore.getAll()
  const allSectors = getAllSectors()

  const getSectorName = (id) =>
    allSectors.find(s => s.id === id)?.name || id

  // ── Hoja 1: Daños Activos ─────────────────────────────────
  const active = damages.filter(d => d.status === 'active')
  const activeRows = active.map(d => ({
    'ID':               d.id,
    'Sector':           getSectorName(d.sectorId),
    'Piso':             getFloorLabel(d.sectorId),
    'Celda':            d.cell,
    'Descripción':      d.description,
    'Posible solución': d.solution || '',
    'Prioridad':        getPriorityLabel(d.priority),
    'Implementos':      d.supplies || '',
    'Fecha registro':   d.dateCreated,
    'Foto daño':        d.photo ? 'Pendiente Google Drive' : 'Sin foto',
  }))

  // ── Hoja 2: Arreglos Realizados ───────────────────────────
  const resolved = damages.filter(d => d.status === 'resolved')
  const resolvedRows = resolved.map(d => ({
    'ID':                 d.id,
    'Sector':             getSectorName(d.sectorId),
    'Piso':               getFloorLabel(d.sectorId),
    'Celda':              d.cell,
    'Descripción':        d.description,
    'Solución aplicada':  d.solution || '',
    'Prioridad':          getPriorityLabel(d.priority),
    'Implementos':        d.supplies || '',
    'Fecha registro':     d.dateCreated,
    'Fecha resolución':   d.dateResolved || '',
    'Foto daño':          d.photo         ? 'Pendiente Google Drive' : 'Sin foto',
    'Foto arreglo':       d.photoResolved ? 'Pendiente Google Drive' : 'Sin foto',
  }))

  // ── Hoja 3: Inventario ────────────────────────────────────
  const inventoryRows = inventory.map(i => ({
    'Sector':           i.sectorName,
    'Piso':             getFloorLabel(i.sectorId),
    'Categoría':        i.categoryLabel,
    'Elemento':         i.name,
    'Cantidad':         i.quantity,
    'Detalle':          i.detail || '',
    'Fecha registro':   i.dateCreated,
  }))

  // ── Hoja 4: Resumen Dashboard ─────────────────────────────
  const totalSectors  = allSectors.length
  const sectorsWithDamage = new Set(active.map(d => d.sectorId)).size
  const sectorPct = totalSectors > 0
    ? Math.round((sectorsWithDamage / totalSectors) * 100)
    : 0

  const totalElements = inventory.reduce((a, i) => a + i.quantity, 0)
  const damagedElements = active.filter(d => d.inventoryItemId).length
  const elementPct = totalElements > 0
    ? Math.round((damagedElements / totalElements) * 100)
    : 0
  const generalPct = totalElements > 0
    ? Math.round((sectorPct + elementPct) / 2)
    : sectorPct

  const byPriority = {
    Alta:  active.filter(d => d.priority === 'alta').length,
    Media: active.filter(d => d.priority === 'media').length,
    Baja:  active.filter(d => d.priority === 'baja').length,
  }

  // Top sectores
  const sectorCount = {}
  active.forEach(d => {
    sectorCount[d.sectorId] = (sectorCount[d.sectorId] || 0) + 1
  })
  const topSectors = Object.entries(sectorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      Sector:  getSectorName(id),
      Piso:    getFloorLabel(id),
      'Daños': count,
      Prioridad: active.some(d => d.sectorId === id && d.priority === 'alta')
        ? 'Alta'
        : active.some(d => d.sectorId === id && d.priority === 'media')
          ? 'Media'
          : 'Baja',
    }))

  // Inventario resumen
  const invSummary = inventoryStore.getSummary()
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(i => ({
      'Categoría': i.categoryLabel,
      'Elemento':  i.name,
      'Total uds': i.total,
    }))

  const summaryRows = [
    { 'RESUMEN': 'ESTADO GENERAL DEL HOGAR', '': '' },
    { 'RESUMEN': 'Porcentaje de daño general', '': `${generalPct}%` },
    { 'RESUMEN': 'Sectores afectados',         '': `${sectorsWithDamage} / ${totalSectors}` },
    { 'RESUMEN': 'Elementos afectados',        '': `${damagedElements} / ${totalElements}` },
    { 'RESUMEN': 'Total daños activos',        '': active.length },
    { 'RESUMEN': 'Total arreglos realizados',  '': resolved.length },
    { 'RESUMEN': '', '': '' },
    { 'RESUMEN': 'DAÑOS POR PRIORIDAD', '': '' },
    ...Object.entries(byPriority).map(([k, v]) => ({
      'RESUMEN': k,
      '': v,
      '%': active.length > 0
        ? Math.round((v / active.length) * 100) + '%'
        : '0%',
    })),
    { 'RESUMEN': '', '': '' },
    { 'RESUMEN': 'SECTORES MÁS CRÍTICOS', '': '' },
    ...topSectors.map(s => ({
      'RESUMEN': s.Sector,
      '': `${s['Daños']} daño${s['Daños'] !== 1 ? 's' : ''}`,
      '%': s.Prioridad,
    })),
    { 'RESUMEN': '', '': '' },
    { 'RESUMEN': 'INVENTARIO GENERAL (TOP 10)', '': '' },
    ...invSummary.map(i => ({
      'RESUMEN': i['Elemento'],
      '': i['Total uds'] + ' unidades',
      '%': i['Categoría'],
    })),
  ]

  // ── Crear workbook ────────────────────────────────────────
  const wb = XLSX.utils.book_new()

  const addSheet = (name, rows) => {
    if (rows.length === 0) {
      rows = [{ 'Sin datos': 'No hay registros aún' }]
    }
    const ws = XLSX.utils.json_to_sheet(rows)

    // Column widths
    const cols = Object.keys(rows[0]).map(k => ({
      wch: Math.max(k.length, 18)
    }))
    ws['!cols'] = cols

    XLSX.utils.book_append_sheet(wb, ws, name)
  }

  addSheet('Daños Activos',       activeRows)
  addSheet('Arreglos Realizados', resolvedRows)
  addSheet('Inventario',          inventoryRows)
  addSheet('Resumen',             summaryRows)

  // ── Descargar ─────────────────────────────────────────────
  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `las-rosas-${date}.xlsx`)
}