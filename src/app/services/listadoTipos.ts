export interface Tipo {
  key: string;
  name: string;
  desc?: string;
}

export const listadoTipos: Tipo[] = [
  { key: 'todos', name: 'Todas' },
  {
    key: 'ferias_espacios', name: 'Ferias',
    desc: 'Ferias de Economía Social y Solidaria, Espacios de comercialización, Nodos de consumo'
  },
  {
    key: 'medios', name: 'Medios',
    desc: 'Medios de comunicación, Colectivos culturales'
  },
  {
    key: 'cooperativa', name: 'Cooperativas',
    desc: 'Cooperativas, Mutuales, Empresas recuperadas, Asociaciones Civiles u otras'
  },
  {
    key: 'universidades', name: 'Universidades',
    desc: 'Universidades, Organismos Públicos, Entidades de vinculación socio técnica'
  },
  { key: 'chasqui', name: 'Chasqui', desc: 'Chasqui' },
]
