export const INVENTORY_CATEGORIES = {
  sanitario: {
    label: 'Sanitario',
    icon: '🚿',
    items: [
      'Llave de agua',
      'Llave de paso',
      'Inodoro',
      'Ducha',
      'Lavamanos',
      'Urinario',
      'Otro',
    ]
  },
  iluminacion: {
    label: 'Iluminación',
    icon: '💡',
    items: [
      'Ampolleta LED',
      'Tubo fluorescente',
      'Luminaria',
      'Otro',
    ]
  },
  mobiliario_hab: {
    label: 'Mobiliario Habitación',
    icon: '🛏',
    items: [
      'Camilla eléctrica',
      'Camilla manual',
      'Camilla antigua',
      'Velador',
      'Ropero',
      'Casillero',
      'Otro',
    ]
  },
  mobiliario_com: {
    label: 'Mobiliario Común',
    icon: '🛋',
    items: [
      'Sillón',
      'Silla',
      'Asiento/Banca',
      'Mesa',
      'Escritorio',
      'Basurero',
      'Otro',
    ]
  },
  movilidad: {
    label: 'Movilidad',
    icon: '♿',
    items: [
      'Silla de ruedas',
      'Andador',
      'Bastón',
      'Otro',
    ]
  },
  electrico: {
    label: 'Eléctrico',
    icon: '🔌',
    items: [
      'Enchufe',
      'Interruptor',
      'Alargador',
      'Televisor',
      'Calefactor',
      'Cámara de seguridad',
      'Otro',
    ]
  },
  puertas: {
    label: 'Puertas y Ventanas',
    icon: '🚪',
    items: [
      'Puerta',
      'Ventana',
      'Persiana',
      'Otro',
    ]
  },
  seguridad: {
    label: 'Seguridad',
    icon: '🧯',
    items: [
      'Extintor',
      'Manguera de incendio',
      'Gabinete de manguera',
      'Luz de emergencia',
      'Cámara de seguridad',
      'Otro',
    ]
  },
  climatizacion: {
    label: 'Climatización',
    icon: '🌡',
    items: [
      'Calefactor',
      'Termostato',
      'Extractor de aire',
      'Ventilador',
      'Aire acondicionado',
      'Otro',
    ]
  },
  otro: {
    label: 'Otro',
    icon: '🔧',
    items: ['Otro']
  }
}

export const getCategoryByItem = (itemName) => {
  for (const [key, cat] of Object.entries(INVENTORY_CATEGORIES)) {
    if (cat.items.includes(itemName)) return { key, ...cat }
  }
  return null
}