export const FLOORS = {
  1: {
    label: 'Piso 1',
    groups: [
      {
        id: 'norte',
        name: 'Sector Norte',
        sectors: [
          { id: 'ENT',    name: 'Entrada Principal', type: 'ent' },
          { id: 'CAP',    name: 'Capilla',           type: 'cap' },
          { id: 'MED',    name: 'Sala Médica',       type: 'med' },
          { id: 'COC',    name: 'Cocina',            type: 'coc' },
          { id: 'COM',    name: 'Comedor',           type: 'com' },
          { id: 'SAL_M',  name: 'Sala Multiusos',    type: 'sal' },
          { id: 'BAN_N1', name: 'Baño Norte 01',     type: 'ban' },
          { id: 'BAN_N2', name: 'Baño Norte 02',     type: 'ban' },
          { id: 'PAS_N',  name: 'Pasillo Norte',     type: 'pas' },
          { id: 'HAB_N1', name: 'Habitación N-01',   type: 'hab' },
          { id: 'HAB_N2', name: 'Habitación N-02',   type: 'hab' },
          { id: 'HAB_N3', name: 'Habitación N-03',   type: 'hab' },
          { id: 'HAB_N4', name: 'Habitación N-04',   type: 'hab' },
          { id: 'HAB_N5', name: 'Habitación N-05',   type: 'hab' },
          { id: 'HAB_N6', name: 'Habitación N-06',   type: 'hab' },
          { id: 'HAB_N7', name: 'Habitación N-07',   type: 'hab' },
        ]
      },
      {
        id: 'sur',
        name: 'Sector Sur',
        sectors: [
          { id: 'BAN_S1', name: 'Baño Sur 01',     type: 'ban' },
          { id: 'BAN_S2', name: 'Baño Sur 02',     type: 'ban' },
          { id: 'PAS_S',  name: 'Pasillo Sur',     type: 'pas' },
          { id: 'HAB_S1', name: 'Habitación S-01', type: 'hab' },
          { id: 'HAB_S2', name: 'Habitación S-02', type: 'hab' },
          { id: 'HAB_S3', name: 'Habitación S-03', type: 'hab' },
          { id: 'HAB_S4', name: 'Habitación S-04', type: 'hab' },
          { id: 'HAB_S5', name: 'Habitación S-05', type: 'hab' },
          { id: 'LAV',    name: 'Lavandería',      type: 'lav' },
          { id: 'PAT',    name: 'Patio Interior',  type: 'ext' },
        ]
      }
    ]
  },
  2: {
    label: 'Piso 2',
    groups: [
      {
        id: 'p2',
        name: 'Segundo Piso',
        sectors: [
          { id: 'HAB_P2_01', name: 'Habitación P2-01', type: 'hab' },
          { id: 'HAB_P2_02', name: 'Habitación P2-02', type: 'hab' },
          { id: 'HAB_P2_03', name: 'Habitación P2-03', type: 'hab' },
          { id: 'HAB_P2_04', name: 'Habitación P2-04', type: 'hab' },
          { id: 'BAN_P2_1',  name: 'Baño P2-01',       type: 'ban' },
          { id: 'BAN_P2_2',  name: 'Baño P2-02',       type: 'ban' },
          { id: 'PAS_P2',    name: 'Pasillo P2',       type: 'pas' },
        ]
      }
    ]
  },
  3: {
    label: 'Piso 3',
    groups: [
      {
        id: 'p3',
        name: 'Hogar Hombres',
        sectors: [
          { id: 'HAB_P3_01', name: 'Habitación P3-01', type: 'hab' },
          { id: 'HAB_P3_02', name: 'Habitación P3-02', type: 'hab' },
          { id: 'HAB_P3_03', name: 'Habitación P3-03', type: 'hab' },
          { id: 'HAB_P3_04', name: 'Habitación P3-04', type: 'hab' },
          { id: 'BAN_P3_1',  name: 'Baño P3-01',       type: 'ban' },
          { id: 'PAS_P3',    name: 'Pasillo P3',       type: 'pas' },
        ]
      }
    ]
  }
}

export const getAllSectors = () =>
  Object.values(FLOORS).flatMap(f => f.groups.flatMap(g => g.sectors))

export const getSectorById = (id) =>
  getAllSectors().find(s => s.id === id)