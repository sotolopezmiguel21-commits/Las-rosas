export const GOOGLE_CONFIG = {
  clientId: '707843863477-grleot1n6rrhkuc8c2p5195c4mnhig0o.apps.googleusercontent.com',
  sheetId: '11ELkq1iaIgvta9nwcXW7HqZYLK1jK0cfErXa8sGe8OM',
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ].join(' '),
}

// Nombres exactos de las hojas
export const SHEETS = {
  damages:   'Daños Activos',
  resolved:  'Arreglos Realizados',
  inventory: 'Inventario',
  config:    'Configuracion',
}