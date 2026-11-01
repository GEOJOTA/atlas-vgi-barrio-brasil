/*
  app.js
  ------
  Orquestador de la interfaz de usuario del Atlas de Información Geográfica Voluntaria.
  Maneja:
  - Inicialización del mapa Leaflet y sincronización reactiva del Bounding Box.
  - Carga y toggle de las 8 capas temáticas VGI en el mapa interactivo.
  - Selector de territorios (Barrio Brasil UAH, Santiago Centro, etc.).
  - Consultas en vivo a Overpass, ohsome y GBIF con retroalimentación visual.
  - Generación y exportación dual de metadatos ISO 19115 (JSON) e ISO 19139 (XML).
  - Exportación de conjuntos de datos espaciales a GeoJSON para QGIS.
*/

let ultimaConsultaRealizada = null;
let capasCargadasPorCategoria = {};
let capasOficialesCargadas = {};

const DICCIONARIO_VALORES_OSM = {
  amenity: [
    { valor: 'pharmacy', etiqueta: '💊 Farmacias y Boticas (pharmacy)', nombre: 'Farmacias Barrio Brasil', color: '#B33928' },
    { valor: 'university', etiqueta: '🎓 Sedes Universitarias UAH (university)', nombre: 'Campus UAH', color: '#1C523A' },
    { valor: 'college', etiqueta: '🏛️ Institutos y Centros de Formación (college)', nombre: 'Institutos Técnicos', color: '#2E8B57' },
    { valor: 'school', etiqueta: '🎒 Colegios y Escuelas (school)', nombre: 'Escuelas y Liceos', color: '#3A7D44' },
    { valor: 'hospital', etiqueta: '🏥 Hospitales y Clínicas (hospital)', nombre: 'Hospitales', color: '#D9534F' },
    { valor: 'clinic', etiqueta: '🩺 Consultorios y CESFAM (clinic)', nombre: 'CESFAM y Consultorios', color: '#C0392B' },
    { valor: 'bicycle_parking', etiqueta: '🚲 Biciestacionamientos (bicycle_parking)', nombre: 'Biciestacionamientos', color: '#E67E22' },
    { valor: 'fire_station', etiqueta: '🚒 Compañías de Bomberos (fire_station)', nombre: 'Bomberos Barrio Brasil', color: '#C0392B' },
    { valor: 'cafe', etiqueta: '☕ Cafeterías y Salones de Té (cafe)', nombre: 'Cafeterías Barrio Brasil', color: '#8A5A36' },
    { valor: 'restaurant', etiqueta: '🍽️ Restaurantes y Gastronomía (restaurant)', nombre: 'Restaurantes', color: '#D35400' },
    { valor: 'place_of_worship', etiqueta: '⛪ Iglesias y Templos (place_of_worship)', nombre: 'Templos y Basílicas', color: '#7D3C98' },
    { valor: 'community_centre', etiqueta: '🤝 Centros Comunitarios y Juntas de Vecinos (community_centre)', nombre: 'Centros Comunitarios', color: '#27AE60' },
    { valor: 'recycling', etiqueta: '♻️ Puntos Verdes y Reciclaje (recycling)', nombre: 'Puntos Verdes', color: '#229954' },
    { valor: 'police', etiqueta: '👮 Comisarías y Seguridad (police)', nombre: 'Seguridad y Carabineros', color: '#2980B9' }
  ],
  shop: [
    { valor: 'bakery', etiqueta: '🍞 Panaderías y Pastelerías (bakery)', nombre: 'Panaderías de Barrio', color: '#D4AC0D' },
    { valor: 'supermarket', etiqueta: '🛒 Supermercados (supermarket)', nombre: 'Supermercados', color: '#F39C12' },
    { valor: 'convenience', etiqueta: '🏪 Minimarkets y Almacenes (convenience)', nombre: 'Almacenes de Barrio', color: '#E67E22' },
    { valor: 'greengrocer', etiqueta: '🥬 Verdulerías y Fruterías (greengrocer)', nombre: 'Verdulerías', color: '#27AE60' },
    { valor: 'kiosk', etiqueta: '📰 Kioscos de Prensa y Confites (kiosk)', nombre: 'Kioscos', color: '#7F8C8D' },
    { valor: 'books', etiqueta: '📚 Librerías (books)', nombre: 'Librerías', color: '#8E44AD' }
  ],
  historic: [
    { valor: '*', etiqueta: '🏛️ Todo el Patrimonio Histórico (*)', nombre: 'Patrimonio Cultural', color: '#8A5A36' },
    { valor: 'building', etiqueta: '🏢 Casonas y Edificios Históricos (building)', nombre: 'Edificios Patrimoniales', color: '#6E2C00' },
    { valor: 'monument', etiqueta: '🗿 Monumentos Públicos (monument)', nombre: 'Monumentos Públicos', color: '#784212' },
    { valor: 'memorial', etiqueta: '🕯️ Memoriales y Placas Conmemorativas (memorial)', nombre: 'Memoriales Históricos', color: '#4A235A' }
  ],
  highway: [
    { valor: 'bus_stop', etiqueta: '🚌 Paraderos Sistema Red Movilidad (bus_stop)', nombre: 'Paraderos de Bus', color: '#2980B9' },
    { valor: 'crossing', etiqueta: '🚶 Cruces Peatonales y Pasos de Cebra (crossing)', nombre: 'Cruces Peatonales', color: '#16A085' },
    { valor: 'traffic_signals', etiqueta: '🚦 Semáforos y Señalización (traffic_signals)', nombre: 'Semáforos', color: '#C0392B' },
    { valor: 'cycleway', etiqueta: '🚲 Ciclovías y Calles Ciclistas (cycleway)', nombre: 'Ciclovías', color: '#27AE60' },
    { valor: 'pedestrian', etiqueta: '🚶 Calles Peatonales y Paseos (pedestrian)', nombre: 'Paseos Peatonales', color: '#2980B9' },
    { valor: 'footway', etiqueta: '🚶 Pasajes y Sendas Peatonales (footway)', nombre: 'Pasajes Peatonales', color: '#1F618D' }
  ],
  leisure: [
    { valor: 'park', etiqueta: '🌳 Parques y Plazas Urbanas (park)', nombre: 'Plazas y Parques', color: '#1E8449' },
    { valor: 'garden', etiqueta: '🌺 Jardines y Huertos Comunitarios (garden)', nombre: 'Jardines Urbanos', color: '#2ECC71' },
    { valor: 'playground', etiqueta: '🛝 Juegos Infantiles (playground)', nombre: 'Plazas de Juegos', color: '#F1C40F' },
    { valor: 'sports_centre', etiqueta: '⚽ Canchas y Centros Deportivos (sports_centre)', nombre: 'Centros Deportivos', color: '#E74C3C' }
  ],
  building: [
    { valor: 'yes', etiqueta: '🏢 Todas las Edificaciones Catastradas (yes)', nombre: 'Huella Construida', color: '#555555' },
    { valor: 'residential', etiqueta: '🏠 Viviendas y Casas Residenciales (residential)', nombre: 'Viviendas Residenciales', color: '#8A7968' },
    { valor: 'apartments', etiqueta: '🏢 Edificios de Departamentos (apartments)', nombre: 'Edificios Residenciales', color: '#6A7B8C' },
    { valor: 'house', etiqueta: '🏡 Casas Habitación Unifamiliares (house)', nombre: 'Casas Unifamiliares', color: '#9E7E63' },
    { valor: 'commercial', etiqueta: '🏪 Edificios Comerciales y Oficinas (commercial)', nombre: 'Edificios Comerciales', color: '#D35400' },
    { valor: 'civic', etiqueta: '🏛️ Edificios Cívicos e Institucionales (civic)', nombre: 'Edificios Cívicos', color: '#3A5A6B' },
    { valor: 'university', etiqueta: '🎓 Pabellones Universitarios UAH (university)', nombre: 'Pabellones UAH', color: '#1C523A' },
    { valor: 'school', etiqueta: '🎒 Pabellones Escolares (school)', nombre: 'Escuelas y Liceos', color: '#2E7D32' },
    { valor: 'church', etiqueta: '⛪ Iglesias y Templos (church)', nombre: 'Templos e Iglesias', color: '#7D3C98' }
  ],
  landuse: [
    { valor: '*', etiqueta: '🗺️ Todas las Coberturas y Usos de Suelo (*)', nombre: 'Usos de Suelo', color: '#5B704E' },
    { valor: 'residential', etiqueta: '🏠 Zona Residencial / Habitacional (residential)', nombre: 'Suelo Residencial', color: '#8D7B68' },
    { valor: 'commercial', etiqueta: '🏪 Zona Comercial y Servicios (commercial)', nombre: 'Suelo Comercial', color: '#D35400' },
    { valor: 'education', etiqueta: '🎓 Recinto Educacional / Campus (education)', nombre: 'Suelo Educacional', color: '#1C523A' },
    { valor: 'recreation_ground', etiqueta: '⚽ Recreación y Deportes al Aire Libre (recreation_ground)', nombre: 'Áreas Deportivas', color: '#2E8B57' },
    { valor: 'grass', etiqueta: '🌿 Césped y Prados Urbanos (grass)', nombre: 'Césped Urbano', color: '#4CAF50' },
    { valor: 'construction', etiqueta: '🏗️ Terreno en Obras / Construcción (construction)', nombre: 'Faenas de Construcción', color: '#E65100' }
  ],
  natural: [
    { valor: 'tree', etiqueta: '🌳 Árbol Urbano Individual (tree)', nombre: 'Arbolado Urbano', color: '#1C523A' },
    { valor: 'tree_row', etiqueta: '🌲 Alineación de Árboles en Calle (tree_row)', nombre: 'Alineación Arbórea', color: '#2E7D32' },
    { valor: 'wood', etiqueta: '🌲 Bosquetes y Masas Arbóreas (wood)', nombre: 'Bosquetes Urbanos', color: '#1B5E20' },
    { valor: 'scrub', etiqueta: '🌾 Matorral y Vegetación Arbustiva (scrub)', nombre: 'Matorrales Urbanos', color: '#689F38' },
    { valor: 'water', etiqueta: '💧 Cuerpos de Agua y Fuentes (water)', nombre: 'Aguas y Fuentes', color: '#0288D1' }
  ],
  healthcare: [
    { valor: 'pharmacy', etiqueta: '💊 Farmacias (pharmacy)', nombre: 'Farmacias y Salud', color: '#B33928' },
    { valor: 'clinic', etiqueta: '🩺 Centros de Salud Primaria (clinic)', nombre: 'Salud Primaria', color: '#C0392B' },
    { valor: 'centre', etiqueta: '🏥 Centros Médicos y Diagnósticos (centre)', nombre: 'Centros Médicos', color: '#922B21' },
    { valor: 'dentist', etiqueta: '🦷 Clínicas Odontológicas (dentist)', nombre: 'Dentistas y Odontología', color: '#16A085' }
  ],
  tourism: [
    { valor: 'hotel', etiqueta: '🏨 Hoteles y Hostales Patrimoniales (hotel)', nombre: 'Hospedajes y Hoteles', color: '#7D3C98' },
    { valor: 'museum', etiqueta: '🏛️ Museos y Salas de Exposición (museum)', nombre: 'Museos y Salas', color: '#6C3483' },
    { valor: 'gallery', etiqueta: '🎨 Galerías de Arte (gallery)', nombre: 'Galerías de Arte', color: '#884EA0' },
    { valor: 'viewpoint', etiqueta: '🔭 Miradores Urbanos (viewpoint)', nombre: 'Miradores', color: '#2980B9' }
  ],
  emergency: [
    { valor: 'fire_hydrant', etiqueta: '💧 Grifos de Agua para Incendios (fire_hydrant)', nombre: 'Grifos contra Incendios', color: '#C0392B' },
    { valor: 'defibrillator', etiqueta: '❤️ Desfibriladores DEA de Emergencia (defibrillator)', nombre: 'Equipos DEA', color: '#922B21' },
    { valor: 'assembly_point', etiqueta: '🚨 Puntos de Encuentro en Emergencias (assembly_point)', nombre: 'Zonas de Evacuación', color: '#27AE60' }
  ]
};

function actualizarOpcionesValoresSegunClave(clave) {
  const selValor = document.getElementById('custom-valor-select');
  if (!selValor) return;

  const lista = DICCIONARIO_VALORES_OSM[clave] || [];
  if (lista.length === 0) {
    selValor.innerHTML = '<option value="custom" selected>✍️ — Escribir valor manual —</option>';
    return;
  }

  selValor.innerHTML = `
    <option value="custom" selected>✍️ — Escribir valor manual —</option>
    ${lista.map(item => `<option value="${item.valor}" data-nombre="${item.nombre}" data-color="${item.color}">${item.etiqueta}</option>`).join('')}
  `;
}

/* ---------------------- COHERENCIA INTERMODULAR Y AUTOCARGA ---------------------- */

let categoriaActivaGlobal = 'educacion';

const MAPA_COHERENCIA_CATEGORIAS = {
  educacion: {
    codigo: 'CAT-01',
    nombre: 'Educación y Universidad',
    claveOSM: 'amenity',
    valorOSM: 'university',
    entidadOSM: 'nwr',
    color: '#35586B',
    ohPreset: 'amenity=university and (type:node or type:way)',
    ohFiltro: 'amenity=university and (type:node or type:way)',
    gbifTaxa: 'custom',
    isoTopic: 'society',
    tituloMd: 'Catastro VGI de Educación y Campus Universitario UAH: Barrio Brasil',
    resumenMd: 'Inventario geoespacial de sedes universitarias, pabellones patrimoniales de la Universidad Alberto Hurtado (UAH), colegios, liceos y bibliotecas en Barrio Brasil y Santiago Centro.'
  },
  servicios: {
    codigo: 'CAT-02',
    nombre: 'Servicios y Comercio Barrial',
    claveOSM: 'shop',
    valorOSM: '*',
    entidadOSM: 'nwr',
    color: '#A97722',
    ohPreset: 'shop=* and (type:node or type:way)',
    ohFiltro: 'shop=* and (type:node or type:way)',
    gbifTaxa: 'custom',
    isoTopic: 'planningCadastre',
    tituloMd: 'Catastro VGI de Servicios y Comercio Barrial: Barrio Brasil - Universidad Alberto Hurtado',
    resumenMd: 'Red de abastecimiento de proximidad, locales comerciales, almacenes, panaderías, cafeterías y farmacias comunitarias en Barrio Brasil y entorno del campus UAH.'
  },
  transporte: {
    codigo: 'CAT-03',
    nombre: 'Movilidad y Transporte',
    claveOSM: 'highway',
    valorOSM: 'bus_stop',
    entidadOSM: 'node',
    color: '#2C4238',
    ohPreset: 'highway=bus_stop and type:node',
    ohFiltro: 'highway=bus_stop and type:node',
    gbifTaxa: 'custom',
    isoTopic: 'transportation',
    tituloMd: 'Catastro VGI de Movilidad y Transporte: Barrio Brasil - Universidad Alberto Hurtado',
    resumenMd: 'Infraestructura intermodal de transporte público: paraderos del Sistema Red Movilidad, accesos a estaciones de Metro (Los Héroes, Santa Ana, Cumming) y ejes estructurantes en Barrio Brasil.'
  },
  movilidad_activa: {
    codigo: 'CAT-04',
    nombre: 'Movilidad Activa y Ciclovías',
    claveOSM: 'highway',
    valorOSM: 'cycleway',
    entidadOSM: 'way',
    color: '#3F5D4E',
    ohPreset: '(highway=cycleway or cycleway=*) and type:way',
    ohFiltro: '(highway=cycleway or cycleway=*) and type:way',
    gbifTaxa: 'custom',
    isoTopic: 'transportation',
    tituloMd: 'Catastro VGI de Movilidad Activa y Ciclovías: Barrio Brasil - Universidad Alberto Hurtado',
    resumenMd: 'Ejes de micromovilidad y movilidad sustentable: ciclovías segregadas, ciclobandas, sendas ciclables, talleres comunitarios y estacionamientos de bicicletas en Barrio Brasil y campus UAH.'
  },
  espacio_publico: {
    codigo: 'CAT-05',
    nombre: 'Áreas Verdes y Espacio Público',
    claveOSM: 'leisure',
    valorOSM: 'park',
    entidadOSM: 'nwr',
    color: '#236B43',
    ohPreset: 'leisure=park and (type:way or type:relation)',
    ohFiltro: 'leisure=park and (type:way or type:relation)',
    gbifTaxa: 'Plantae',
    isoTopic: 'environment',
    tituloMd: 'Catastro VGI de Áreas Verdes y Espacios Públicos: Barrio Brasil - Universidad Alberto Hurtado',
    resumenMd: 'Superficie métrica calculada y catastro de plazas públicas (Plaza Brasil), parques urbanos, bandejones verdes, juegos infantiles y áreas de permanencia y recreación comunitaria.'
  },
  patrimonio: {
    codigo: 'CAT-06',
    nombre: 'Patrimonio y Cultura',
    claveOSM: 'historic',
    valorOSM: '*',
    entidadOSM: 'nwr',
    color: '#8F3A2C',
    ohPreset: 'historic=* and (type:node or type:way)',
    ohFiltro: 'historic=* and (type:node or type:way)',
    gbifTaxa: 'custom',
    isoTopic: 'society',
    tituloMd: 'Catastro VGI de Patrimonio y Cultura: Zona Típica Barrio Brasil - Universidad Alberto Hurtado',
    resumenMd: 'Inmuebles de Conservación Histórica (ICH), casonas neoclásicas UAH, templos religiosos (Basílica del Salvador), centros culturales comunitarios, teatros y monumentos en la Zona Típica de Barrio Brasil.'
  },
  accesibilidad: {
    codigo: 'CAT-07',
    nombre: 'Accesibilidad Universal',
    claveOSM: 'highway',
    valorOSM: 'crossing',
    entidadOSM: 'node',
    color: '#4B5142',
    ohPreset: '(highway=crossing or kerb=*) and type:node',
    ohFiltro: '(highway=crossing or kerb=*) and type:node',
    gbifTaxa: 'custom',
    isoTopic: 'transportation',
    tituloMd: 'Catastro VGI de Caminabilidad y Accesibilidad Universal: Barrio Brasil - Universidad Alberto Hurtado',
    resumenMd: 'Diagnóstico de caminabilidad inclusiva: rebajes de cordón en veredas, pasos peatonales seguros, pavimentos podotáctiles y rampas de acceso en el entorno de Barrio Brasil y UAH.'
  },
  biodiversidad: {
    codigo: 'CAT-08',
    nombre: 'Biodiversidad Urbana',
    claveOSM: 'natural',
    valorOSM: 'tree',
    entidadOSM: 'node',
    color: '#1C523A',
    ohPreset: 'natural=tree and type:node',
    ohFiltro: 'natural=tree and type:node',
    gbifTaxa: 'Plantae',
    isoTopic: 'biota',
    tituloMd: 'Catastro VGI de Biodiversidad Urbana y Arbolado: Barrio Brasil - Universidad Alberto Hurtado',
    resumenMd: 'Registros de arbolado urbano georreferenciado, flora y fauna comunitaria compilados desde OpenStreetMap y la Infraestructura Mundial de Información en Biodiversidad (GBIF).'
  },
  edificaciones: {
    codigo: 'CAT-09',
    nombre: 'Edificaciones y Huella Urbana',
    claveOSM: 'building',
    valorOSM: 'yes',
    entidadOSM: 'way',
    color: '#06b6d4',
    ohPreset: 'building=* and type:way',
    ohFiltro: 'building=* and type:way',
    gbifTaxa: 'custom',
    isoTopic: 'structure',
    tituloMd: 'Catastro VGI de Edificaciones y Huella Urbana: Barrio Brasil - Universidad Alberto Hurtado',
    resumenMd: 'Huella poligonal de edificaciones, manzaneo catastral y volumetría construida en Barrio Brasil y entorno del campus UAH.'
  },
  cobertura_suelo: {
    codigo: 'CAT-10',
    nombre: 'Coberturas y Usos de Suelo',
    claveOSM: 'landuse',
    valorOSM: '*',
    entidadOSM: 'way',
    color: '#10b981',
    ohPreset: 'landuse=* and (type:way or type:relation)',
    ohFiltro: 'landuse=* and (type:way or type:relation)',
    gbifTaxa: 'custom',
    isoTopic: 'planningCadastre',
    tituloMd: 'Catastro VGI de Coberturas y Usos de Suelo: Barrio Brasil - Universidad Alberto Hurtado',
    resumenMd: 'Zonificación de usos de suelo y coberturas territoriales en Barrio Brasil y Santiago Centro.'
  }
};

function resolverCategoriaId(identificador) {
  if (!identificador) return 'educacion';
  if (MAPA_COHERENCIA_CATEGORIAS[identificador]) return identificador;
  const s = String(identificador).toLowerCase().trim();
  if (s === 'cat-01' || s.includes('universidad') || s.includes('educacion') || s.includes('school') || s.includes('college') || s.includes('library')) return 'educacion';
  if (s === 'cat-02' || s.includes('farmacia') || s.includes('salud') || s.includes('comercio') || s.includes('shop') || s.includes('bakery') || s.includes('cafe') || s.includes('restaurant')) return 'servicios';
  if (s === 'cat-03' || s.includes('bus') || s.includes('transporte') || s.includes('metro') || s.includes('railway')) return 'transporte';
  if (s === 'cat-04' || s.includes('ciclo') || s.includes('bici') || s.includes('cycleway')) return 'movilidad_activa';
  if (s === 'cat-05' || s.includes('plaza') || s.includes('parque') || s.includes('leisure') || s.includes('park') || s.includes('playground')) return 'espacio_publico';
  if (s === 'cat-06' || s.includes('patrimonio') || s.includes('historic') || s.includes('casona') || s.includes('museum') || s.includes('theatre')) return 'patrimonio';
  if (s === 'cat-07' || s.includes('cruce') || s.includes('accesibilidad') || s.includes('kerb') || s.includes('wheelchair') || s.includes('crossing')) return 'accesibilidad';
  if (s === 'cat-08' || s.includes('arbol') || s.includes('arbolado') || s.includes('biodiversidad') || s.includes('tree') || s.includes('natural')) return 'biodiversidad';
  if (s === 'cat-09' || s.includes('edific') || s.includes('building') || s.includes('huella')) return 'edificaciones';
  if (s === 'cat-10' || s.includes('suelo') || s.includes('landuse') || s.includes('cobertura')) return 'cobertura_suelo';
  return 'educacion';
}

function sincronizarCoherenciaEntreModulos(identificador, opciones = {}) {
  const catId = resolverCategoriaId(identificador);
  categoriaActivaGlobal = catId;
  const mapa = MAPA_COHERENCIA_CATEGORIAS[catId];
  if (!mapa) return;

  // 1. Sincronizar botones de categorías en el visor
  document.querySelectorAll('.btn-categoria').forEach(b => {
    if (b.id === `btn-cat-${catId}`) {
      b.classList.add('sincronizado-activo');
    } else {
      b.classList.remove('sincronizado-activo');
    }
  });

  // 2. Sincronizar Preset de Overpass
  const selOsmPreset = document.getElementById('osm-categoria-preset');
  if (selOsmPreset && opciones.origen !== 'preset_osm') {
    selOsmPreset.value = catId;
    const inpEtiqueta = document.getElementById('osm-etiqueta');
    if (inpEtiqueta) {
      inpEtiqueta.value = '';
      inpEtiqueta.placeholder = `Preset activo: ${catId} (${mapa.nombre})`;
    }
  }

  // 3. Sincronizar Constructor Personalizado
  if (opciones.origen !== 'constructor_custom') {
    const inpClave = document.getElementById('custom-clave-manual');
    const inpValor = document.getElementById('custom-valor');
    const selClave = document.getElementById('custom-clave-select');
    const inpNombre = document.getElementById('custom-nombre-capa');
    const inpColor = document.getElementById('custom-color-capa');
    const selEntidad = document.getElementById('custom-entidad');
    const selValor = document.getElementById('custom-valor-select');
    if (selClave) selClave.value = 'otra';
    if (inpClave) inpClave.value = '';
    if (inpValor) inpValor.value = '';
    if (inpNombre) inpNombre.value = opciones.nombre || mapa.nombre;
    if (inpColor) inpColor.value = opciones.color || mapa.color;
    if (selEntidad) selEntidad.value = mapa.entidadOSM;
    if (selValor) selValor.value = 'custom';
    if (typeof actualizarCodigoQLPreview === 'function') actualizarCodigoQLPreview();
  }

  // 4. Sincronizar Panel ohsome
  const selOhPreset = document.getElementById('oh-preset-selector');
  const inpOhFiltro = document.getElementById('oh-filtro');
  if (selOhPreset) {
    let match = false;
    for (let i = 0; i < selOhPreset.options.length; i++) {
      if (selOhPreset.options[i].value === mapa.ohPreset) {
        selOhPreset.selectedIndex = i;
        match = true;
        break;
      }
    }
    if (!match) selOhPreset.value = 'custom';
  }
  if (inpOhFiltro) {
    inpOhFiltro.value = mapa.ohFiltro;
  }

  // 5. Sincronizar Panel GBIF
  const selGbifTaxa = document.getElementById('gbif-taxa-selector');
  const inpGbifNombre = document.getElementById('gbif-nombre');
  if (selGbifTaxa && mapa.gbifTaxa !== 'custom') {
    selGbifTaxa.value = mapa.gbifTaxa;
    if (inpGbifNombre) inpGbifNombre.value = mapa.gbifTaxa;
  }

  // 6. Autocarga reactiva de metadatos ISO 19115/19139
  autocargarMetadatos({
    categoriaId: catId,
    titulo: opciones.nombre ? `Catastro VGI: ${opciones.nombre} - Barrio Brasil / UAH` : mapa.tituloMd,
    resumen: mapa.resumenMd,
    forzar: false
  });
}

function sincronizarCoherenciaDesdeOhsome(presetVal) {
  for (const [catId, info] of Object.entries(MAPA_COHERENCIA_CATEGORIAS)) {
    if (info.ohPreset === presetVal || info.ohFiltro === presetVal) {
      sincronizarCoherenciaEntreModulos(catId, { origen: 'preset_ohsome' });
      return;
    }
  }
}

function autocargarMetadatos(opciones = {}) {
  const bbox = opciones.bbox || leerBbox('osm') || leerBbox('oh') || window.NODO_CONFIG?.area_por_defecto?.bbox;
  if (bbox) escribirBbox('md', bbox);

  const catId = opciones.categoriaId || categoriaActivaGlobal || 'educacion';
  const mapa = MAPA_COHERENCIA_CATEGORIAS[catId] || MAPA_COHERENCIA_CATEGORIAS['educacion'];

  const inpTitulo = document.getElementById('md-titulo');
  const selCategoriaIso = document.getElementById('md-categoria-iso');
  const txtResumen = document.getElementById('md-resumen');
  const txtLinaje = document.getElementById('md-linaje');
  const inpSrs = document.getElementById('md-srs');

  const titulo = opciones.titulo || mapa.tituloMd;
  if (inpTitulo) inpTitulo.value = titulo;
  if (selCategoriaIso) selCategoriaIso.value = opciones.isoTopic || mapa.isoTopic;

  let extraMetricas = '';
  if (typeof ModuloGeodesia !== 'undefined' && ModuloGeodesia.calcularSuperficieBbox && bbox) {
    const s = ModuloGeodesia.calcularSuperficieBbox(bbox);
    extraMetricas = ` Superficie métrica calculada: ${s.areaM2.toLocaleString('es-CL')} m² (${s.areaHa.toLocaleString('es-CL')} ha / ${s.areaKm2} km²) bajo EPSG:32719 UTM Huso 19 Sur.`;
  }
  if (txtResumen) {
    txtResumen.value = `${opciones.resumen || mapa.resumenMd}${extraMetricas}`;
  }

  const cantidad = opciones.cantidad !== undefined ? opciones.cantidad : (ultimaConsultaRealizada?.cantidad ?? 'múltiples');
  const fuente = opciones.fuente || ultimaConsultaRealizada?.fuente || 'OpenStreetMap / Overpass QL & ohsome API';
  const filtro = opciones.filtro || ultimaConsultaRealizada?.filtro || mapa.nombre;
  const fechaHoy = new Date().toISOString().slice(0, 10);

  if (txtLinaje) {
    txtLinaje.value = `Conjunto de datos VGI derivado de ${fuente} mediante consulta "${filtro}" ejecutada el ${fechaHoy} sobre el Bbox [${(bbox || []).join(', ')}]. Comprende ${cantidad} entidades espaciales validadas, normalizadas y proyectadas conforme a la norma ISO 19115/19139 para IDE Chile / SNIT (EPSG:32719 / EPSG:5361).`;
  }

  if (inpSrs && !inpSrs.value) {
    inpSrs.value = 'EPSG:4326 (WGS84) / Compatible con EPSG:5361 (SIRGAS-Chile) y EPSG:32719';
  }

  // Generar y renderizar vista previa automáticamente en el DOM
  try {
    const ficha = construirObjetoFichaDesdeFormulario();
    window._ultimaFichaGenerada = ficha;
    const cntVistaPrevia = document.getElementById('vista-previa-metadatos');
    if (cntVistaPrevia && typeof ModuloMetadatos !== 'undefined' && ModuloMetadatos.renderVistaPrevia) {
      cntVistaPrevia.innerHTML = ModuloMetadatos.renderVistaPrevia(ficha);
      const btnExpJson = document.getElementById('btn-exportar-json');
      const btnExpXml = document.getElementById('btn-exportar-xml');
      if (btnExpJson) btnExpJson.disabled = false;
      if (btnExpXml) btnExpXml.disabled = false;
    }
  } catch (e) {
    // Tolerancia ante fases tempranas de carga
  }
}

let appInicializada = false;
function intentarInicializar() {
  if (appInicializada) return;
  if (window.NODO_CONFIG) {
    appInicializada = true;
    inicializarAplicacion();
  }
}

document.addEventListener('nodo:config-lista', intentarInicializar);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', intentarInicializar);
} else {
  intentarInicializar();
}

function inicializarAplicacion() {
  const cfg = window.NODO_CONFIG;
  if (!cfg) return;

  if (window.ManifoldCanvas) {
    window.ManifoldCanvas.init('manifold-bg-container');
  }

  configurarNavegacion();
  configurarSubpanelesDerecha();
  precargarCamposDesdeConfig();
  ModuloMapa.inicializar('mapa-atlas');
  crearBotonesCategorias();
  configurarEventosMapa();
  configurarCapasOficialesIDE();
  configurarImportadorCapas();
  configurarPanelBaseDatos();
  pintarEstadoConexion();

  const ml = window.ModuloLicencias || (typeof ModuloLicencias !== 'undefined' ? ModuloLicencias : null);
  const contLic = document.getElementById('contenido-licencias');
  if (contLic && ml) {
    contLic.innerHTML = ml.render();
  }
  cargarResumenMetodologia();

  // Inicializar Módulo 05: Indicadores de Análisis Multidimensional y Storyboards
  if (window.ModuloIndicadoresAnalisis) {
    window.ModuloIndicadoresAnalisis.inicializar();
  }

  // Inicializar Módulo 06: Evaluador Universal de Calidad Cuantitativa e Índice IGV (ISO 19157)
  if (window.EvaluadorCalidadCuantitativa) {
    window.EvaluadorCalidadCuantitativa.inicializarUI();
  }

  // Interceptar descargas en toda la interfaz para garantizar metadatos del catálogo
  configurarInterceptoresDescargasMetadatos();

  // Inicializar diccionario territorial con soporte para pestañas de grupo y búsqueda
  const cntDiccionario = document.getElementById('contenido-diccionario');
  const md = window.ModuloDiccionario || (typeof ModuloDiccionario !== 'undefined' ? ModuloDiccionario : null);
  if (cntDiccionario && md) {
    let grupoActivo = 'todos';
    let textoFiltro = '';

    const refrescarDiccionario = () => {
      cntDiccionario.innerHTML = md.render(textoFiltro, grupoActivo);
    };

    refrescarDiccionario();

    document.getElementById('filtro-diccionario')?.addEventListener('input', (e) => {
      textoFiltro = e.target.value;
      refrescarDiccionario();
    });

    document.querySelectorAll('.filtro-dicc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-dicc-btn').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        grupoActivo = btn.dataset.grupo || 'todos';
        refrescarDiccionario();
      });
    });
  }

  // Inicializar selector de actor territorial / perfil
  const selPerfil = document.getElementById('sel-perfil-usuario');
  if (selPerfil) {
    selPerfil.addEventListener('change', manejarCambioPerfilUsuario);
    manejarCambioPerfilUsuario();
  }

  // Inicializar botones de sugerencias ciudadanas (1 clic)
  document.querySelectorAll('.btn-sugerencia-ciudadana').forEach(btn => {
    btn.addEventListener('click', () => {
      const clave = btn.dataset.clave;
      const valor = btn.dataset.valor;
      const operador = btn.dataset.operador || '=';
      const nombre = btn.dataset.nombre;
      const color = btn.dataset.color || '#A97722';
      const entidad = btn.dataset.entidad || 'nwr';

      const selClave = document.getElementById('custom-clave-select');
      if (selClave) selClave.value = 'otra';
      document.getElementById('custom-clave-manual').value = '';
      document.getElementById('custom-valor').value = '';
      document.getElementById('custom-operador').value = operador;
      document.getElementById('custom-nombre-capa').value = nombre;
      document.getElementById('custom-color-capa').value = color;
      document.getElementById('custom-entidad').value = entidad;
      const selValor = document.getElementById('custom-valor-select');
      if (selValor) selValor.value = 'custom';

      actualizarCodigoQLPreview();
      const catDestino = btn.dataset.cat || btn.dataset.categoria || clave;
      sincronizarCoherenciaEntreModulos(catDestino, { valor, nombre, color, origen: 'sugerencia_ciudadana' });
      manejarConsultaPersonalizada();
    });
  });

  // Preset geométrico de ohsome API v1 e intervalo temporal
  document.getElementById('oh-preset-selector')?.addEventListener('change', (e) => {
    if (e.target.value !== 'custom') {
      document.getElementById('oh-filtro').value = e.target.value;
      sincronizarCoherenciaDesdeOhsome(e.target.value);
    } else {
      document.getElementById('oh-filtro').focus();
    }
  });

  // Selector de versión de ohsome API (v1 vs v2) y gestión de API Key
  const selVersionOh = document.getElementById('oh-version-selector');
  const cntApiKeyOh = document.getElementById('contenedor-oh-api-key');
  const inpApiKeyOh = document.getElementById('oh-api-key');

  if (inpApiKeyOh) {
    const keyGuardada = localStorage.getItem('nodo-vgi:heigit-api-key');
    if (keyGuardada) inpApiKeyOh.value = keyGuardada;
    inpApiKeyOh.addEventListener('input', (e) => {
      localStorage.setItem('nodo-vgi:heigit-api-key', e.target.value.trim());
    });
  }

  if (selVersionOh) {
    selVersionOh.addEventListener('change', (e) => {
      if (e.target.value === 'v2') {
        if (cntApiKeyOh) cntApiKeyOh.style.display = 'block';
      } else {
        if (cntApiKeyOh) cntApiKeyOh.style.display = 'none';
      }
    });
  }

  // Eventos de paneles
  document.getElementById('btn-consultar-osm').addEventListener('click', () => manejarConsultaOSM(false, 'bbox'));
  const btnCoords = document.getElementById('btn-consultar-osm-coords');
  if (btnCoords) {
    btnCoords.addEventListener('click', () => {
      const bbox = leerBbox('osm');
      if (bbox) {
        ModuloMapa.actualizarRectanguloBbox(bbox);
        ModuloMapa.encuadrarBbox(bbox);
      }
      manejarConsultaOSM(false, 'coordenadas');
    });
  }
  const btnRM = document.getElementById('btn-encuadre-rm-completa');
  if (btnRM) {
    btnRM.addEventListener('click', () => {
      const bboxRM = [-71.55, -34.35, -69.95, -32.85];
      sincronizarBboxEnInputs(bboxRM);
      ModuloMapa.encuadrarBbox(bboxRM);
      ModuloMapa.actualizarRectanguloBbox(bboxRM);
      actualizarFichaTerritorio('Región Metropolitana de Santiago (Completa)', bboxRM);
      manejarConsultaOSM(false, 'rm_completa');
    });
  }
  document.getElementById('btn-cargar-osm-al-mapa').addEventListener('click', () => manejarConsultaOSM(true, 'mapa'));
  document.getElementById('btn-usar-area-config').addEventListener('click', aplicarAreaConfigAlExplorador);
  document.getElementById('osm-categoria-preset').addEventListener('change', manejarCambioPresetOSM);


  // Constructor de Consultas Personalizadas: sincronización dual selectores y campos manuales
  actualizarOpcionesValoresSegunClave('amenity');
  actualizarCodigoQLPreview();

  const selClave = document.getElementById('custom-clave-select');
  const inpClave = document.getElementById('custom-clave-manual');
  const selValor = document.getElementById('custom-valor-select');
  const inpValor = document.getElementById('custom-valor');
  const inpNombre = document.getElementById('custom-nombre-capa');
  const inpColor = document.getElementById('custom-color-capa');
  const selOperador = document.getElementById('custom-operador');
  const selEntidad = document.getElementById('custom-entidad');
  const selFiltroExtra = document.getElementById('custom-filtro-extra');

  if (selClave) {
    selClave.addEventListener('change', (e) => {
      if (e.target.value !== 'otra') {
        inpClave.value = e.target.value;
        actualizarOpcionesValoresSegunClave(e.target.value);
      } else {
        inpClave.value = '';
        inpClave.focus();
        actualizarOpcionesValoresSegunClave('');
      }
      actualizarCodigoQLPreview();
    });
  }

  if (selValor) {
    selValor.addEventListener('change', (e) => {
      if (e.target.value !== 'custom') {
        const opcion = selValor.options[selValor.selectedIndex];
        inpValor.value = e.target.value === '*' ? '' : e.target.value;
        if (opcion.dataset.nombre) inpNombre.value = opcion.dataset.nombre;
        if (opcion.dataset.color) inpColor.value = opcion.dataset.color;
      } else {
        inpValor.focus();
      }
      actualizarCodigoQLPreview();
    });
  }

  [inpClave, inpValor, inpNombre, inpColor, selOperador, selEntidad, selFiltroExtra].forEach(el => {
    if (el) {
      el.addEventListener('input', actualizarCodigoQLPreview);
      el.addEventListener('change', actualizarCodigoQLPreview);
    }
  });

  const btnEjecutarCustom = document.getElementById('btn-ejecutar-consulta-custom');
  if (btnEjecutarCustom) btnEjecutarCustom.addEventListener('click', manejarConsultaPersonalizada);

  const btnValidarTaginfo = document.getElementById('btn-validar-taginfo');
  if (btnValidarTaginfo) {
    btnValidarTaginfo.addEventListener('click', () => {
      const clave = document.getElementById('custom-clave-manual').value.trim() || 'amenity';
      const valor = document.getElementById('custom-valor').value.trim() || '*';
      if (window.ModuloTaginfo) {
        window.ModuloTaginfo.renderizarEnContenedor('contenedor-resultado-taginfo-custom', clave, valor);
      }
    });
  }

  const btnGuardarConsulta = document.getElementById('btn-guardar-consulta');
  if (btnGuardarConsulta) btnGuardarConsulta.addEventListener('click', guardarConsultaUsuario);

  const btnToggleQL = document.getElementById('btn-toggle-ql-avanzado');
  if (btnToggleQL) {
    btnToggleQL.addEventListener('click', () => {
      const cnt = document.getElementById('contenedor-ql-avanzado');
      if (cnt.style.display === 'none') {
        cnt.style.display = 'block';
        actualizarCodigoQLPreview();
      } else {
        cnt.style.display = 'none';
      }
    });
  }

  cargarConsultasGuardadas();

  document.getElementById('btn-consultar-ohsome').addEventListener('click', manejarConsultaOhsome);

  // Control de Cambios y Validación de Ediciones con OSMCha (Changesets API v0.6)
  const selModoOSMCha = document.getElementById('osmcha-filtro-modo');
  const divContenedorIdOSMCha = document.getElementById('contenedor-osmcha-id');
  if (selModoOSMCha && divContenedorIdOSMCha) {
    selModoOSMCha.addEventListener('change', (e) => {
      divContenedorIdOSMCha.style.display = e.target.value === 'id' ? 'block' : 'none';
    });
  }

  const btnEjecutarOSMCha = document.getElementById('btn-ejecutar-validacion-osmcha');
  if (btnEjecutarOSMCha) {
    btnEjecutarOSMCha.addEventListener('click', () => {
      const modo = selModoOSMCha ? selModoOSMCha.value : 'bbox';
      if (modo === 'id') {
        const inpId = document.getElementById('osmcha-input-id');
        const csId = inpId ? inpId.value.trim() : '';
        if (!csId) {
          alert('Ingresa un número de changeset válido para consultar.');
          return;
        }
        if (window.ModuloCalidadAnalyst) {
          window.ModuloCalidadAnalyst.renderizarInspectorChangesets('contenedor-auditoria-osmcha', null, { changesetId: csId });
        }
      } else {
        const bbox = leerBbox('oh') || window.NODO_CONFIG?.area_por_defecto?.bbox;
        if (!bbox) {
          alert('Debes completar las coordenadas del área (Bbox) para consultar los changesets.');
          return;
        }
        if (window.ModuloCalidadAnalyst) {
          window.ModuloCalidadAnalyst.renderizarInspectorChangesets('contenedor-auditoria-osmcha', bbox);
        }
      }
    });
  }

  const btnAbrirOSMChaExt = document.getElementById('btn-abrir-osmcha-externo');
  if (btnAbrirOSMChaExt) {
    btnAbrirOSMChaExt.addEventListener('click', () => {
      const bbox = leerBbox('oh') || window.NODO_CONFIG?.area_por_defecto?.bbox;
      if (bbox && bbox.length >= 4) {
        const [o, s, e, n] = bbox;
        const url = `https://osmcha.org/?filters=${encodeURIComponent(JSON.stringify({ in_bbox: `${o},${s},${e},${n}` }))}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.open('https://osmcha.org/', '_blank', 'noopener,noreferrer');
      }
    });
  }

  document.getElementById('btn-consultar-gbif').addEventListener('click', () => manejarConsultaGBIF(false));
  document.getElementById('btn-cargar-gbif-al-mapa').addEventListener('click', () => manejarConsultaGBIF(true));
  document.getElementById('btn-cargar-umap').addEventListener('click', manejarCargaUMap);

  // Selector de especies y autocompletado taxonómico en vivo (GBIF Species API)
  const selTaxaGBIF = document.getElementById('gbif-taxa-selector');
  const inpNombreGBIF = document.getElementById('gbif-nombre');
  const divSugerenciasGBIF = document.getElementById('gbif-sugerencias-taxa');

  if (selTaxaGBIF && inpNombreGBIF) {
    selTaxaGBIF.addEventListener('change', (e) => {
      if (e.target.value !== 'custom') {
        inpNombreGBIF.value = e.target.value;
      } else {
        inpNombreGBIF.value = '';
        inpNombreGBIF.focus();
      }
      if (divSugerenciasGBIF) divSugerenciasGBIF.style.display = 'none';
    });
  }

  if (inpNombreGBIF && divSugerenciasGBIF) {
    let timerTaxa = null;
    inpNombreGBIF.addEventListener('input', () => {
      clearTimeout(timerTaxa);
      const texto = inpNombreGBIF.value.trim();
      if (texto.length < 2) {
        divSugerenciasGBIF.style.display = 'none';
        divSugerenciasGBIF.innerHTML = '';
        return;
      }

      timerTaxa = setTimeout(async () => {
        if (window.ModuloGBIF && window.ModuloGBIF.sugerirTaxon) {
          const sugerencias = await window.ModuloGBIF.sugerirTaxon(texto);
          if (sugerencias.length > 0) {
            divSugerenciasGBIF.innerHTML = `
              <div style="padding:6px; font-family:var(--fuente-datos); font-size:0.75rem; background:var(--papel-alto); border:1px solid var(--musgo);">
                <div style="font-size:0.68rem; color:var(--musgo); text-transform:uppercase; margin-bottom:4px; font-weight:600;">[GBIF SPECIES API // COINCIDENCIAS]:</div>
                ${sugerencias.map(s => `
                  <div class="sugerencia-taxa-item" style="padding:4px 6px; cursor:pointer; border-bottom:1px dashed var(--linea);" data-nombre="${s.canonicalName}">
                    <strong>${s.canonicalName}</strong> <span style="color:var(--tinta-suave); font-size:0.7rem;">(${s.rank || 'Taxón'} · ${s.kingdom || ''})</span>
                  </div>
                `).join('')}
              </div>
            `;
            divSugerenciasGBIF.style.display = 'block';

            divSugerenciasGBIF.querySelectorAll('.sugerencia-taxa-item').forEach(item => {
              item.addEventListener('click', () => {
                inpNombreGBIF.value = item.dataset.nombre;
                divSugerenciasGBIF.style.display = 'none';
              });
            });
          } else {
            divSugerenciasGBIF.style.display = 'none';
          }
        }
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (!inpNombreGBIF.contains(e.target) && !divSugerenciasGBIF.contains(e.target)) {
        divSugerenciasGBIF.style.display = 'none';
      }
    });
  }

  // Selector de proyectos cartográficos colaborativos UMap
  const selUMap = document.getElementById('umap-preset-selector');
  if (selUMap) {
    selUMap.addEventListener('change', (e) => {
      const inpUrlUMap = document.getElementById('umap-url');
      if (e.target.value && e.target.value !== 'custom') {
        inpUrlUMap.value = e.target.value;
        manejarCargaUMap();
      } else if (e.target.value === 'custom') {
        inpUrlUMap.value = '';
        inpUrlUMap.focus();
      }
    });
  }

  // Botones de mapas comunitarios UMap sugeridos
  document.getElementById('btn-umap-ejemplo-patrimonio')?.addEventListener('click', () => {
    document.getElementById('umap-url').value = 'https://umap.openstreetmap.fr/es/map/patrimonio-santiago-centro_19382';
    manejarCargaUMap();
  });
  document.getElementById('btn-umap-ejemplo-ciclovias')?.addEventListener('click', () => {
    document.getElementById('umap-url').value = 'https://umap.openstreetmap.fr/es/map/ciclovias-santiago_28412';
    manejarCargaUMap();
  });

  // Selector de SRS de metadatos
  document.getElementById('md-srs-select')?.addEventListener('change', (e) => {
    document.getElementById('md-srs').value = e.target.value;
  });

  // Selector de Marco Jurídico de Licenciamiento en Metadatos ISO
  document.getElementById('md-licencia-select')?.addEventListener('change', (e) => {
    const mapaLicencias = {
      odbl: 'Open Database License (ODbL 1.0) para datos vectoriales de OSM (© colaboradores de OpenStreetMap). Reutilización libre sujeta a atribución y compartir bajo la misma licencia.',
      cc_by: 'Creative Commons Atribución (CC-BY 4.0) para registros biológicos (GBIF / iNaturalist / Ciencia Ciudadana).',
      datos_gob: 'Datos Abiertos del Estado de Chile (Licencia de Atribución Datos Abiertos / IDE Chile / Ley N° 20.285 de Transparencia).',
      vgi_mixta: 'Licencia Mixta VGI: Open Database License (ODbL 1.0) para geometrías OSM + Creative Commons CC-BY 4.0 para observaciones biológicas de GBIF.'
    };
    const texto = mapaLicencias[e.target.value] || e.target.value;
    document.getElementById('md-restricciones').value = texto;
  });

  document.getElementById('form-metadatos').addEventListener('submit', manejarGenerarMetadatos);
  document.getElementById('btn-prellenar-metadatos').addEventListener('click', prellenarMetadatosDesdeUltimaConsulta);
  document.getElementById('btn-exportar-json').addEventListener('click', exportarMetadatosJSON);
  document.getElementById('btn-exportar-xml').addEventListener('click', exportarMetadatosXML);

  function configurarInterceptoresDescargasMetadatos() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest && e.target.closest('.btn-accion-descarga-gis');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const idCapa = btn.dataset.idCapa || btn.getAttribute('data-id-capa');
      const urlArchivo = btn.getAttribute('href');
      const nombreDescarga = btn.getAttribute('download') || `capa_${idCapa || 'datos'}.geojson`;

      const textoOrig = btn.textContent;
      btn.textContent = '⏳ ...';
      btn.style.pointerEvents = 'none';

      try {
        if (typeof ModuloMetadatos !== 'undefined' && ModuloMetadatos.descargarCapaEnriquecidaPorId) {
          await ModuloMetadatos.descargarCapaEnriquecidaPorId(idCapa, urlArchivo, nombreDescarga);
        } else {
          const a = document.createElement('a');
          a.href = urlArchivo;
          a.download = nombreDescarga;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } catch (err) {
        console.warn('[Descarga Metadatos] Fallback a enlace directo:', err);
        const a = document.createElement('a');
        a.href = urlArchivo;
        a.download = nombreDescarga;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } finally {
        btn.textContent = textoOrig;
        btn.style.pointerEvents = '';
      }
    });
  }

  let timerRecargaBbox = null;
  function recargarCapasActivasPorNuevoBbox(nuevoBbox) {
    if (!nuevoBbox || !Array.isArray(nuevoBbox) || nuevoBbox.length !== 4) return;
    clearTimeout(timerRecargaBbox);
    timerRecargaBbox = setTimeout(async () => {
      const categoriasActivas = Object.keys(capasCargadasPorCategoria);
      if (categoriasActivas.length === 0) return;
      const estadoTexto = document.getElementById('estado-carga-capas');
      if (estadoTexto) estadoTexto.textContent = `Actualizando geometrías en nuevo Bbox (${categoriasActivas.length} capas activas)…`;

      for (const catId of categoriasActivas) {
        const catObj = (window.NODO_CONFIG?.categorias_osm || []).find(c => c.id === catId);
        if (!catObj) continue;
        const btn = document.getElementById(`btn-cat-${catId}`);
        const labelConteo = document.getElementById(`conteo-cat-${catId}`);
        if (btn) btn.classList.add('cargando');

        try {
          let geojson;
          let fuente = 'OpenStreetMap (API Overpass)';
          if (catId === 'biodiversidad') {
            const [resGBIF, resOSM] = await Promise.allSettled([
              ModuloGBIF.buscarOcurrencias({ bbox: nuevoBbox, limite: 300 }),
              ModuloOSM.consultar(nuevoBbox, 'biodiversidad')
            ]);
            let featsOSM = [];
            let featsGBIF = [];
            let fuenteOSM = 'OpenStreetMap (API Overpass)';
            if (resOSM.status === 'fulfilled') {
              featsOSM = ModuloOSM.elementosAGeoJSON(resOSM.value, 'biodiversidad').features || [];
            } else {
              try {
                const dbRes = await ModuloOSM.consultarBaseDatosOSM(nuevoBbox, 'biodiversidad');
                featsOSM = dbRes.features || [];
                fuenteOSM = 'Geofabrik (Extracto RM)';
              } catch (_) {}
            }
            if (resGBIF.status === 'fulfilled' && resGBIF.value?.geojson?.features) {
              featsGBIF = resGBIF.value.geojson.features;
            }
            // Superposición explícita únicamente si ambas fuentes aportan entidades
            if (featsGBIF.length > 0 && featsOSM.length > 0) {
              fuente = `GBIF + ${fuenteOSM}`;
            } else if (featsGBIF.length > 0) {
              fuente = 'GBIF (Ciencia Ciudadana)';
            } else {
              fuente = fuenteOSM;
            }
            geojson = {
              type: 'FeatureCollection',
              features: [...featsOSM, ...featsGBIF]
            };
          } else {
            try {
              const elementos = await ModuloOSM.consultar(nuevoBbox, catId);
              geojson = ModuloOSM.elementosAGeoJSON(elementos, catId);
              fuente = 'OpenStreetMap (API Overpass)';
            } catch (errOverpass) {
              geojson = await ModuloOSM.consultarBaseDatosOSM(nuevoBbox, catId);
              fuente = 'Geofabrik (Extracto RM)';
            }
          }

          if (geojson && geojson.features) {
            const lic = fuente.includes('Geofabrik')
              ? 'ODbL 1.0 (© colaboradores de OpenStreetMap / Geofabrik GmbH)'
              : 'ODbL 1.0 (© colaboradores de OpenStreetMap)';
            ModuloMapa.cargarCapaGeoJSON(catId, geojson, {
              nombre: catObj.nombre,
              color: catObj.color,
              icono: catObj.icono,
              fuente: geojson.fuente || fuente,
              licencia: lic
            });
            capasCargadasPorCategoria[catId] = geojson;
            if (labelConteo) labelConteo.textContent = `${geojson.features.length} ent.`;
          }
        } catch (errRecarga) {
          console.warn(`Error al recargar capa ${catId} para el nuevo Bbox:`, errRecarga);
        } finally {
          if (btn) btn.classList.remove('cargando');
        }
      }
      if (estadoTexto) estadoTexto.textContent = `Capas VGI actualizadas para el recuadro territorial activo.`;
      actualizarTelemetriaCapasActivas();
    }, 500);
  }

  // Escuchar cambios de bbox desde el mapa
  document.addEventListener('nodo:bbox-cambiado', (e) => {
    if (e.detail && e.detail.bbox) {
      sincronizarBboxEnInputs(e.detail.bbox);
      actualizarFichaTerritorio('Área de Consulta Personalizada (Bbox interactivo)', e.detail.bbox);
      autocargarMetadatos({ bbox: e.detail.bbox });
      recargarCapasActivasPorNuevoBbox(e.detail.bbox);

      // Si el panel Explorador OSM está activo y está en Modo Bbox, re-ejecutar consulta automáticamente
      const modoBbox = document.getElementById('modo-local-bbox');
      const panelExplorador = document.getElementById('panel-explorador-osm');
      if (modoBbox && modoBbox.checked && panelExplorador && panelExplorador.classList.contains('activo')) {
        manejarConsultaOSM(false, 'bbox');
      }
    }
  });


  // Escuchar cambios manuales en inputs de coordenadas para actualizar el mapa
  ['osm', 'oh', 'gbif', 'md'].forEach(prefijo => {
    ['oeste', 'sur', 'este', 'norte'].forEach(coord => {
      const el = document.getElementById(`${prefijo}-${coord}`);
      if (el) {
        el.addEventListener('change', () => {
          const bbox = leerBbox(prefijo);
          if (bbox) {
            ModuloMapa.actualizarRectanguloBbox(bbox);
            sincronizarBboxEnInputs(bbox);
            autocargarMetadatos({ bbox });
            recargarCapasActivasPorNuevoBbox(bbox);
          }
        });
      }
    });
  });

  // Inicialización de coherencia y metadatos con la categoría predeterminada
  sincronizarCoherenciaEntreModulos('educacion');
  autocargarMetadatos();
}

/* ---------------------- NAVEGACIÓN ---------------------- */

function configurarNavegacion() {
  const activarPanel = (panelId) => {
    if (!panelId) return;
    const botonesNav = Array.from(new Set(document.querySelectorAll('#lista-navegacion button, .barra-pestanas-profundidad button, button[data-panel]')));
    botonesNav.forEach(b => {
      const coincide = b.dataset.panel === panelId;
      b.setAttribute('aria-current', coincide ? 'true' : 'false');
      b.classList.toggle('activa', coincide);
    });

    document.querySelectorAll('.panel').forEach(p => p.classList.remove('activo'));
    const panelDestino = document.getElementById('panel-' + panelId);
    if (panelDestino) {
      panelDestino.classList.add('activo');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (panelId === 'inicio' && window.ModuloMapa) {
        window.ModuloMapa.invalidarTamano();
      }
      if (panelId === 'manual') {
        cargarResumenMetodologia();
      }
      if (panelId === 'calidad-ohsome' && window.EvaluadorCalidadCuantitativa) {
        window.EvaluadorCalidadCuantitativa.invalidarTamanoMapa();
      }
      if (panelId === 'indicadores') {
        const cont = document.getElementById('contenedor-indicadores-analisis');
        const modulo = window.ModuloIndicadoresAnalisis || (typeof ModuloIndicadoresAnalisis !== 'undefined' ? ModuloIndicadoresAnalisis : null);
        if (modulo) {
          if (!cont || !cont.querySelector('.modulo-indicadores-analisis-wrapper')) {
            modulo.inicializar();
          }
        }
      }
    }
  };

  window.activarPanel = activarPanel;
  window.autocargarMetadatos = autocargarMetadatos;

  window.navegarAModulo = function(moduloId) {
    if (!moduloId) return;
    const mapaModulos = {
      // Nueva numeración oficial 01 al 10
      '01': 'inicio',
      '1': 'inicio',
      'inicio': 'inicio',
      'visor': 'inicio',

      '02': 'explorador-osm',
      '2': 'explorador-osm',
      'explorador': 'explorador-osm',

      '03': 'biodiversidad-gbif',
      '3': 'biodiversidad-gbif',
      'biodiversidad': 'biodiversidad-gbif',

      '04': 'proyectos-umap',
      '4': 'proyectos-umap',
      'umap': 'proyectos-umap',

      '05': 'indicadores',
      '5': 'indicadores',
      'indicadores': 'indicadores',
      'storyboards': 'indicadores',

      '06': 'calidad-ohsome',
      '6': 'calidad-ohsome',
      'calidad': 'calidad-ohsome',

      '07': 'manual',
      '7': 'manual',
      'manual': 'manual',

      '08': 'metadatos-iso',
      '8': 'metadatos-iso',
      'metadatos': 'metadatos-iso',

      '09': 'diccionario',
      '9': 'diccionario',
      'diccionario': 'diccionario',

      '10': 'licencias',
      'licencias': 'licencias',

      // Alias retroactivos
      '00': 'inicio'
    };
    const panelId = mapaModulos[moduloId] || moduloId;
    activarPanel(panelId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const botonesNav = Array.from(new Set(document.querySelectorAll('#lista-navegacion button, .barra-pestanas-profundidad button')));
  botonesNav.forEach(boton => {
    boton.addEventListener('click', (e) => {
      e.stopPropagation();
      activarPanel(boton.dataset.panel);
    });
  });

  // Delegación global infalible para clicks en spans, badges o botones dinámicos
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#lista-navegacion button, .barra-pestanas-profundidad button, button[data-panel]');
    if (btn && btn.dataset.panel) {
      activarPanel(btn.dataset.panel);
    }
  });
}

function configurarSubpanelesDerecha() {
  const btns = document.querySelectorAll('.pestanas-profundidad-derecha .btn-subpanel');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('activa'));
      btn.classList.add('activa');

      document.querySelectorAll('.subpanel-profundidad').forEach(p => p.classList.remove('activo'));
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.add('activo');
    });
  });
}

function configurarPanelBaseDatos() {
  const inpUrl = document.getElementById('input-supabase-url');
  const inpKey = document.getElementById('input-supabase-anon-key');
  const btnConectar = document.getElementById('btn-conectar-bd');
  const btnProbar = document.getElementById('btn-probar-bd');
  const badgeEstado = document.getElementById('sidebar-bd-estado');
  const mensajeEl = document.getElementById('sidebar-bd-mensaje');

  if (!badgeEstado || !window.ModuloDBClient) return;

  const cfg = window.ModuloDBClient.obtenerConfig();
  if (inpUrl && cfg.url) inpUrl.value = cfg.url;
  if (inpKey && cfg.anonKey) inpKey.value = cfg.anonKey;

  const actualizarBadge = (conectado, texto) => {
    if (conectado) {
      badgeEstado.textContent = '🟢 PostGIS Activo';
      badgeEstado.style.color = 'var(--esmeralda)';
    } else {
      badgeEstado.textContent = texto || '📁 Modo Local (Fallback)';
      badgeEstado.style.color = 'var(--ocre)';
    }
  };

  if (cfg.url && cfg.anonKey) {
    actualizarBadge(true);
  }

  btnConectar?.addEventListener('click', async () => {
    const url = (inpUrl?.value || '').trim();
    const key = (inpKey?.value || '').trim();

    if (!url || !key) {
      if (mensajeEl) {
        mensajeEl.textContent = 'Ingresa la URL y la Anon Key de Supabase.';
        mensajeEl.style.color = 'var(--ocre)';
      }
      return;
    }

    if (mensajeEl) {
      mensajeEl.textContent = 'Conectando y probando PostGIS…';
      mensajeEl.style.color = 'var(--musgo)';
    }
    window.ModuloDBClient.guardarCredenciales(url, key);

    const res = await window.ModuloDBClient.probarConexion();
    actualizarBadge(res.ok);
    if (mensajeEl) {
      mensajeEl.textContent = res.mensaje;
      mensajeEl.style.color = res.ok ? 'var(--esmeralda)' : 'var(--alerta)';
    }
  });

  btnProbar?.addEventListener('click', async () => {
    if (mensajeEl) {
      mensajeEl.textContent = 'Enviando ping de telemetría a Supabase…';
      mensajeEl.style.color = 'var(--musgo)';
    }
    const res = await window.ModuloDBClient.probarConexion();
    actualizarBadge(res.ok);
    if (mensajeEl) {
      mensajeEl.textContent = res.mensaje;
      mensajeEl.style.color = res.ok ? 'var(--esmeralda)' : 'var(--alerta)';
    }
  });
}

function poblarSelectorTerritorios() {
  const selTerritorio = document.getElementById('sel-territorio');
  const territorios = window.NODO_CONFIG?.territorios_predefinidos;
  if (!selTerritorio || !territorios || !territorios.length) return;
  selTerritorio.innerHTML = '';
  territorios.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.nombre;
    selTerritorio.appendChild(opt);
  });
}

function actualizarFichaTerritorio(nombre, bbox) {
  const el = document.getElementById('resumen-area-defecto');
  if (!el || !bbox) return;
  let txtSuperficie = '';
  if (typeof ModuloGeodesia !== 'undefined' && ModuloGeodesia.calcularSuperficieBbox) {
    const s = ModuloGeodesia.calcularSuperficieBbox(bbox);
    txtSuperficie = `<br>Superficie métrica calculada: <strong>${s.areaM2.toLocaleString('es-CL')} m²</strong> (${s.areaHa.toLocaleString('es-CL')} ha / ${s.areaKm2} km²) <span style="font-size:0.75rem; color:#8F3A2C; font-weight:600;" title="Reproyección conforme Transverse Mercator a EPSG:32719">(EPSG:32719 - WGS 84 / UTM Huso 19 Sur)</span>`;
  }
  el.innerHTML = `
    <strong>${nombre}</strong><br>
    Bbox WGS84: <code>[${bbox.join(', ')}]</code>
    ${txtSuperficie}<br>
    <span class="descripcion">Foco territorial: Barrio Brasil Completo y Manzana Campus Universidad Alberto Hurtado (Santiago Centro, Chile).</span>
  `;
}

function precargarCamposDesdeConfig() {
  const cfg = window.NODO_CONFIG;
  document.getElementById('nombre-organizacion').textContent = cfg.organizacion.descripcion_corta || cfg.organizacion.nombre;
  
  const terrDefecto = cfg.territorios_predefinidos?.find(t => t.id === cfg.area_por_defecto.id) || cfg.territorios_predefinidos?.[0];
  actualizarFichaTerritorio(terrDefecto ? terrDefecto.nombre : cfg.organizacion.area_de_interes_nombre, cfg.area_por_defecto.bbox);

  poblarSelectorTerritorios();
  aplicarAreaConfigAlExplorador();

  const md = cfg.metadatos_iso_defecto || {};
  if (md.sistema_referencia) document.getElementById('md-srs').value = `${md.sistema_referencia} / Compatible con ${md.sistema_referencia_nacional || 'EPSG:5361'}`;
  if (md.punto_de_contacto_organizacion) document.getElementById('md-contacto-org').value = md.punto_de_contacto_organizacion;
  if (md.punto_de_contacto_correo) document.getElementById('md-contacto-correo').value = md.punto_de_contacto_correo;
}

function pintarEstadoConexion() {
  const elemento = document.getElementById('estado-conexion');
  elemento.innerHTML = `🟢 APIs en vivo: Overpass (OSM), ohsome (HeiGIT) y GBIF conectadas.`;
}

/* ---------------------- HELPERS DE BBOX ---------------------- */

function leerBbox(prefijo) {
  const oeste = parseFloat(document.getElementById(`${prefijo}-oeste`).value);
  const sur = parseFloat(document.getElementById(`${prefijo}-sur`).value);
  const este = parseFloat(document.getElementById(`${prefijo}-este`).value);
  const norte = parseFloat(document.getElementById(`${prefijo}-norte`).value);
  if ([oeste, sur, este, norte].some(Number.isNaN)) return null;
  return [oeste, sur, este, norte];
}

function escribirBbox(prefijo, bbox) {
  const elO = document.getElementById(`${prefijo}-oeste`);
  const elS = document.getElementById(`${prefijo}-sur`);
  const elE = document.getElementById(`${prefijo}-este`);
  const elN = document.getElementById(`${prefijo}-norte`);
  if (elO) elO.value = bbox[0];
  if (elS) elS.value = bbox[1];
  if (elE) elE.value = bbox[2];
  if (elN) elN.value = bbox[3];
}

function sincronizarBboxEnInputs(bbox) {
  escribirBbox('osm', bbox);
  escribirBbox('oh', bbox);
  escribirBbox('gbif', bbox);
  escribirBbox('md', bbox);
}

function aplicarAreaConfigAlExplorador() {
  const bbox = window.NODO_CONFIG.area_por_defecto.bbox;
  sincronizarBboxEnInputs(bbox);
  ModuloMapa.encuadrarBbox(bbox);
}

/* ---------------------- CONTROL DEL MAPA ATLAS ---------------------- */

function configurarEventosMapa() {
  const selTerritorio = document.getElementById('sel-territorio');
  if (selTerritorio) {
    selTerritorio.addEventListener('change', (e) => {
      ModuloMapa.cambiarTerritorio(e.target.value);
      const terr = window.NODO_CONFIG?.territorios_predefinidos?.find(t => t.id === e.target.value);
      if (terr) {
        actualizarFichaTerritorio(terr.nombre, terr.bbox);
        sincronizarBboxEnInputs(terr.bbox);
        autocargarMetadatos({ bbox: terr.bbox });
      }
    });
  }

  const btnDibujar = document.getElementById('btn-dibujar-bbox');
  if (btnDibujar) {
    btnDibujar.addEventListener('click', () => {
      if (btnDibujar.classList.contains('activo')) {
        ModuloMapa.desactivarModoDibujoBbox();
      } else {
        ModuloMapa.activarModoDibujoBbox();
      }
    });
  }

  const btnReencuadrar = document.getElementById('btn-reencuadrar-mapa');
  if (btnReencuadrar) {
    btnReencuadrar.addEventListener('click', () => {
      const bbox = leerBbox('osm') || window.NODO_CONFIG.area_por_defecto.bbox;
      ModuloMapa.encuadrarBbox(bbox);
    });
  }

  const btnExportarGeoJSON = document.getElementById('btn-exportar-geojson-mapa');
  if (btnExportarGeoJSON) {
    btnExportarGeoJSON.addEventListener('click', () => {
      ModuloMapa.exportarGeoJSONCargado();
    });
  }
}

function crearBotonesCategorias() {
  const contenedor = document.getElementById('contenedor-botones-categorias');
  if (!contenedor) return;

  const categorias = window.NODO_CONFIG.categorias_osm || [];
  contenedor.innerHTML = '';

  categorias.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'tarjeta-capa-gis vgi';
    card.id = `card-vgi-${cat.id}`;
    card.dataset.id = cat.id;
    card.dataset.nombre = cat.nombre.toLowerCase();
    card.dataset.codigo = (cat.codigo || '').toLowerCase();
    card.dataset.desc = (cat.descripcion || '').toLowerCase();
    card.dataset.tipo = 'vgi';
    card.dataset.grupo = 'vgi';

    const descGeom = cat.geometrias ? cat.geometrias[0] : 'Vectorial';
    const tipoGeom = descGeom.split(' ')[0].toUpperCase();

    card.innerHTML = `
      <div class="tarjeta-capa-header">
        <div class="tarjeta-capa-tag-grupo">
          <span class="pill-institucion vgi">OSM / VGI</span>
          <span class="pill-codigo">${cat.codigo}</span>
        </div>
        <span class="pill-geometria">${tipoGeom}</span>
      </div>
      <div class="tarjeta-capa-cuerpo">
        <h4 class="tarjeta-capa-titulo">${cat.nombre}</h4>
        <p class="tarjeta-capa-desc">${cat.descripcion}</p>
      </div>
      <div class="tarjeta-capa-footer">
        <button type="button" class="btn-toggle-capa" id="btn-cat-${cat.id}" title="Alternar visualización de la capa en el mapa">
          <span class="indicador-switch"></span>
          <span class="texto-switch">Activar</span>
        </button>
        <div class="tarjeta-capa-acciones">
          <span class="conteo-entidades-gis" id="conteo-cat-${cat.id}">—</span>
          <a href="data/capa_${cat.id}.geojson" download="capa_${cat.id}_con_metadatos.geojson" data-id-capa="${cat.id}" class="btn-accion-descarga-gis" title="Descargar archivo GeoJSON con perfil de metadatos" onclick="event.stopPropagation();">
            GeoJSON
          </a>
        </div>
      </div>
    `;

    const btn = card.querySelector(`#btn-cat-${cat.id}`);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      alternarCapaCategoria(cat);
    });
    card.addEventListener('click', () => {
      alternarCapaCategoria(cat);
    });

    contenedor.appendChild(card);
  });
}

async function alternarCapaCategoria(categoria) {
  const card = document.getElementById(`card-vgi-${categoria.id}`);
  const btn = document.getElementById(`btn-cat-${categoria.id}`);
  const labelConteo = document.getElementById(`conteo-cat-${categoria.id}`);
  const textoSwitch = btn ? btn.querySelector('.texto-switch') : null;
  const estadoTexto = document.getElementById('estado-carga-capas');

  // Sincronizar coherencia de módulos de consulta con la categoría seleccionada
  sincronizarCoherenciaEntreModulos(categoria.id, { origen: 'boton_categoria' });

  // Si ya está activa, la desactivamos
  if (btn && btn.classList.contains('activo')) {
    ModuloMapa.removerCapa(categoria.id);
    btn.classList.remove('activo');
    if (card) card.classList.remove('activo');
    if (textoSwitch) textoSwitch.textContent = 'Activar';
    if (labelConteo) labelConteo.textContent = '—';
    delete capasCargadasPorCategoria[categoria.id];
    actualizarTelemetriaCapasActivas();
    return;
  }

  // Activar y cargar datos
  if (btn) btn.classList.add('cargando');
  if (card) card.classList.add('cargando');
  if (estadoTexto) estadoTexto.textContent = `Consultando ${categoria.nombre} en el área territorial seleccionada…`;

  const bbox = leerBbox('osm') || window.NODO_CONFIG.area_por_defecto.bbox;

  try {
    let geojson;
    let fuenteUtilizada = 'OpenStreetMap (API Overpass)';

    if (categoria.id === 'biodiversidad') {
      // Para biodiversidad, consultamos GBIF + OSM con failover transparente a Geodatabase RM
      const [resGBIF, resOSM] = await Promise.allSettled([
        ModuloGBIF.buscarOcurrencias({ bbox, limite: 300 }),
        ModuloOSM.consultar(bbox, 'biodiversidad')
      ]);

      let featsOSM = [];
      let featsGBIF = [];
      let fuenteOSM = 'OpenStreetMap (API Overpass)';

      if (resOSM.status === 'fulfilled') {
        featsOSM = ModuloOSM.elementosAGeoJSON(resOSM.value, 'biodiversidad').features || [];
      } else {
        try {
          const dbOSM = await ModuloOSM.consultarBaseDatosOSM(bbox, 'biodiversidad');
          featsOSM = dbOSM.features || [];
          fuenteOSM = 'Geofabrik (Extracto RM)';
        } catch (_) {}
      }

      if (resGBIF.status === 'fulfilled' && resGBIF.value?.geojson?.features) {
        featsGBIF = resGBIF.value.geojson.features;
      }

      // Superposición explícita únicamente si ambas fuentes aportan entidades
      if (featsGBIF.length > 0 && featsOSM.length > 0) {
        fuenteUtilizada = `GBIF + ${fuenteOSM}`;
      } else if (featsGBIF.length > 0) {
        fuenteUtilizada = 'GBIF (Ciencia Ciudadana)';
      } else {
        fuenteUtilizada = fuenteOSM;
      }

      geojson = {
        type: 'FeatureCollection',
        features: [...featsOSM, ...featsGBIF]
      };
    } else {
      try {
        const elementos = await ModuloOSM.consultar(bbox, categoria.id);
        geojson = ModuloOSM.elementosAGeoJSON(elementos, categoria.id);
        fuenteUtilizada = 'OpenStreetMap (API Overpass)';
      } catch (errOverpass) {
        console.warn(`[Overpass en vivo no disponible para ${categoria.id}]:`, errOverpass.message);
        geojson = await ModuloOSM.consultarBaseDatosOSM(bbox, categoria.id);
        fuenteUtilizada = 'Geofabrik (Extracto RM)';
      }
    }

    const cantidad = (geojson && geojson.features) ? geojson.features.length : 0;
    if (labelConteo) labelConteo.textContent = `${cantidad} ent.`;

    const lic = fuenteUtilizada.includes('Geofabrik')
      ? 'ODbL 1.0 (© colaboradores de OpenStreetMap / Geofabrik GmbH)'
      : 'ODbL 1.0 (© colaboradores de OpenStreetMap)';

    ModuloMapa.cargarCapaGeoJSON(categoria.id, geojson, {
      nombre: categoria.nombre,
      color: categoria.color,
      icono: categoria.icono,
      fuente: geojson.fuente || fuenteUtilizada,
      licencia: lic
    });

    capasCargadasPorCategoria[categoria.id] = geojson;
    if (btn) {
      btn.classList.remove('cargando');
      btn.classList.add('activo');
    }
    if (card) {
      card.classList.remove('cargando');
      card.classList.add('activo');
    }
    if (textoSwitch) textoSwitch.textContent = 'En Mapa';
    if (estadoTexto) estadoTexto.textContent = `Capa "${categoria.nombre}" cargada (${cantidad} elementos en el Bbox, fuente: ${fuenteUtilizada}).`;
    actualizarTelemetriaCapasActivas();

    ultimaConsultaRealizada = {
      bbox,
      filtro: categoria.nombre,
      cantidad: cantidad,
      fuente: fuenteUtilizada
    };
    autocargarMetadatos({
      categoriaId: categoria.id,
      cantidad: cantidad,
      fuente: fuenteUtilizada,
      filtro: categoria.nombre,
      bbox
    });
  } catch (error) {
    console.error(`[Error general al consultar ${categoria.id}]:`, error);
    btn.classList.remove('cargando');
    if (card) card.classList.remove('cargando');
    estadoTexto.innerHTML = `<span style="color:var(--alerta);">Error al consultar ${categoria.nombre}: ${error.message}</span>`;
  }
}

/* ---------------------- PANEL EXPLORADOR OSM ---------------------- */

function actualizarCodigoQLPreview() {
  const qlInput = document.getElementById('custom-ql-codigo');
  if (!qlInput) return;
  const entidad = document.getElementById('custom-entidad')?.value || 'nwr';
  const clave = document.getElementById('custom-clave-manual')?.value.trim() || 'amenity';
  const operador = document.getElementById('custom-operador')?.value || '=';
  const valor = document.getElementById('custom-valor')?.value.trim() || '';
  const filtroExtra = document.getElementById('custom-filtro-extra')?.value || 'todos';

  let filtro = '';
  if (clave && valor && valor !== '*') {
    if (operador === '~') filtro = `["${clave}"~"${valor}"]`;
    else if (operador === '!=') filtro = `["${clave}"!="${valor}"]`;
    else filtro = `["${clave}"="${valor}"]`;
  } else if (clave) {
    filtro = `["${clave}"]`;
  } else {
    filtro = '["amenity"]';
  }

  let extra = '';
  if (filtroExtra === 'con_nombre') extra = '["name"]';
  else if (filtroExtra === 'accesibles') extra = '["wheelchair"="yes"]';
  else if (filtroExtra === 'con_direccion') extra = '["addr:street"]';
  else if (filtroExtra === 'con_operador') extra = '["operator"]';

  qlInput.value = `${entidad}${filtro}${extra}({{bbox}});`;
}

async function manejarConsultaPersonalizada() {
  const contenedor = document.getElementById('resultado-osm');
  const bbox = leerBbox('osm') || window.NODO_CONFIG.area_por_defecto.bbox;
  if (!bbox) {
    contenedor.innerHTML = avisoError('Completa las cuatro coordenadas del Bounding Box.');
    return;
  }

  const entidad = document.getElementById('custom-entidad').value;
  const clave = document.getElementById('custom-clave-manual').value.trim();
  const operador = document.getElementById('custom-operador').value;
  const valor = document.getElementById('custom-valor').value.trim();
  const nombreCapa = document.getElementById('custom-nombre-capa').value.trim() || 'Consulta Personalizada';
  const colorCapa = document.getElementById('custom-color-capa').value || '#A97722';
  const qlCustom = document.getElementById('custom-ql-codigo')?.value.trim() || '';

  contenedor.innerHTML = '<p class="descripcion">🚀 Ejecutando consulta espacial en backend / Overpass API…</p>';

  const params = {
    bbox,
    entidad,
    clave,
    operador,
    valor,
    queryPersonalizada: qlCustom,
    nombreConsulta: nombreCapa
  };

  try {
    const inicio = performance.now();
    const res = await ModuloOSM.consultarPersonalizada(params);
    const duracionSeg = ((performance.now() - inicio) / 1000).toFixed(1);

    const geojson = res.geojson;
    const total = geojson.features.length;

    if (total === 0) {
      contenedor.innerHTML = avisoInfo(`No se encontraron elementos para la consulta "${nombreCapa}" en esa área.`);
      return;
    }

    // Cargar en el mapa Atlas con capa dinámica
    const capaId = 'custom_' + Date.now();
    const fuenteCapa = res.fuente || 'OpenStreetMap (API Overpass)';
    const licCapa = fuenteCapa.includes('Geofabrik')
      ? 'ODbL 1.0 (© colaboradores de OpenStreetMap / Geofabrik GmbH)'
      : 'ODbL 1.0 (© colaboradores de OpenStreetMap)';

    ModuloMapa.cargarCapaGeoJSON(capaId, geojson, {
      nombre: nombreCapa,
      color: colorCapa,
      icono: '🔍',
      fuente: fuenteCapa,
      licencia: licCapa
    });

    ultimaConsultaRealizada = {
      bbox,
      filtro: `${nombreCapa} [${clave}${operador}${valor}]`,
      cantidad: total,
      fuente: fuenteCapa
    };
    autocargarMetadatos({
      categoriaId: categoriaActivaGlobal,
      cantidad: total,
      fuente: fuenteCapa,
      filtro: `${nombreCapa} [${clave}${operador}${valor}]`,
      bbox
    });

    // Cálculo métrico de superficies en polígonos
    const puntos = geojson.features.filter(f => f.geometry && f.geometry.type === 'Point').length;
    const lineas = geojson.features.filter(f => f.geometry && (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString')).length;
    const poligonos = geojson.features.filter(f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
    const totalM2 = poligonos.reduce((acc, f) => acc + (f.properties?.superficie_m2 || 0), 0);

    // Generar tabla y botones de exportación
    const filas = geojson.features.slice(0, 30).map(f => {
      const p = f.properties;
      return `
        <tr>
          <td><code>${p.id_vgi || f.id}</code></td>
          <td><strong>${p.nombre || '—'}</strong></td>
          <td>${p.subtipo || '—'}</td>
          <td>${p.superficie_m2 ? `<strong>${p.superficie_m2.toLocaleString('es-CL')} m²</strong> <small style="color:var(--tinta-suave);">(${p.superficie_ha} ha)</small>` : '—'}</td>
          <td>${p.direccion || '—'}</td>
          <td><small>${p.accesibilidad ? '♿ ' + p.accesibilidad : '—'}</small></td>
        </tr>
      `;
    }).join('');

    if (typeof ModuloMetadatos !== 'undefined' && ModuloMetadatos.enriquecerGeoJSON) {
      geojson = ModuloMetadatos.enriquecerGeoJSON(geojson, {
        id: `overpass_${Date.now()}`,
        nombre: nombreCapa,
        institucion: 'Comunidad OpenStreetMap (© Colaboradores de OpenStreetMap)',
        ministerio: 'Cartografía Colaborativa Abierta / OpenStreetMap Foundation',
        grupo: categoriaActivaGlobal || 'vgi_en_vivo',
        tipo_fuente: 'VGI (Comunitaria / Abierta)',
        licencia: 'Open Database License (ODbL) 1.0 (ODC-ODbL)',
        cita_apa: `OpenStreetMap contributors. (2026). Datos espaciales de ${nombreCapa}. https://www.openstreetmap.org`,
        igv: 98.5,
        grado_calidad: 'A+ (Excelente)'
      });
    }

    const jsonString = encodeURIComponent(JSON.stringify(geojson, null, 2));

    // Convertir a CSV plano incluyendo columnas canónicas de metadatos del catálogo
    const encabezadosCsv = [
      'id_vgi', 'nombre', 'subtipo', 'superficie_m2', 'superficie_ha', 'srs_superficie',
      'direccion', 'accesibilidad', 'fuente', 'licencia', 'latitud', 'longitud',
      'meta_capa_id', 'meta_titulo', 'meta_institucion', 'meta_ministerio', 'meta_grupo',
      'meta_tipo_fuente', 'meta_temporalidad', 'meta_licencia', 'meta_cita_apa', 'meta_crs', 'meta_igv', 'meta_grado_calidad'
    ];
    const lineasCsv = [encabezadosCsv.join(',')];
    geojson.features.forEach(f => {
      const p = f.properties || {};
      const coords = f.geometry ? f.geometry.coordinates : [];
      const lat = f.geometry?.type === 'Point' ? coords[1] : (coords[0] && coords[0][0] ? coords[0][0][1] : '');
      const lon = f.geometry?.type === 'Point' ? coords[0] : (coords[0] && coords[0][0] ? coords[0][0][0] : '');
      lineasCsv.push([
        `"${p.id_vgi || ''}"`,
        `"${(p.nombre || '').replace(/"/g, '""')}"`,
        `"${p.subtipo || ''}"`,
        p.superficie_m2 || '',
        p.superficie_ha || '',
        `"${p.srs_superficie || ''}"`,
        `"${(p.direccion || '').replace(/"/g, '""')}"`,
        `"${p.accesibilidad || ''}"`,
        `"${p.fuente || 'OpenStreetMap'}"`,
        `"${p.licencia || 'ODbL 1.0'}"`,
        lat,
        lon,
        `"${p.meta_capa_id || ''}"`,
        `"${(p.meta_titulo || '').replace(/"/g, '""')}"`,
        `"${(p.meta_institucion || '').replace(/"/g, '""')}"`,
        `"${(p.meta_ministerio || '').replace(/"/g, '""')}"`,
        `"${p.meta_grupo || ''}"`,
        `"${p.meta_tipo_fuente || ''}"`,
        `"${p.meta_temporalidad || ''}"`,
        `"${(p.meta_licencia || '').replace(/"/g, '""')}"`,
        `"${(p.meta_cita_apa || '').replace(/"/g, '""')}"`,
        `"${p.meta_crs || ''}"`,
        p.meta_igv || '',
        `"${p.meta_grado_calidad || ''}"`
      ].join(','));
    });
    const csvString = encodeURIComponent(lineasCsv.join('\n'));

    let badgeSuperficieHtml = '';
    if (totalM2 > 0) {
      badgeSuperficieHtml = `
        <div class="indicador" style="margin:0; border-left:3px solid #B8860B;">
          <span class="valor">${totalM2.toLocaleString('es-CL')} m²</span>
          <span class="etiqueta">Superficie total cubierta (${(totalM2 / 10000).toFixed(2)} ha / ${(totalM2 / 1000000).toFixed(4)} km²) [EPSG:32719]</span>
        </div>
      `;
    }

    let badgeFailoverHtml = '';
    if (res.failover) {
      badgeFailoverHtml = `
        <div style="background:var(--ocre-claro); color:var(--ocre); border:1px solid var(--ocre); padding:8px 12px; border-radius:6px; font-size:0.84rem; margin-bottom:12px; font-weight:600;">
          ⚡ <strong>Triple Failover Activado:</strong> ${res.motivoFailover || 'Servidor Overpass saturado. Se obtuvieron las geometrías desde la Geodatabase RM descargada del proyecto.'}
        </div>
      `;
    }

    contenedor.innerHTML = `
      ${badgeFailoverHtml}
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <div class="indicador" style="margin:0;">
            <span class="valor">${total}</span>
            <span class="etiqueta">elementos (📍 ${puntos} · 〰️ ${lineas} · ⬡ ${poligonos.length}) [${duracionSeg}s]</span>
          </div>
          ${badgeSuperficieHtml}
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="accion" id="btn-ver-en-mapa-custom" style="font-size:0.85rem; padding:6px 12px;">🗺️ Ver en Mapa Atlas</button>
          <a href="data:application/geo+json;charset=utf-8,${jsonString}" download="${nombreCapa.toLowerCase().replace(/\\s+/g, '_')}.geojson" class="accion secundaria" style="text-decoration:none; display:inline-flex; align-items:center; font-size:0.85rem; padding:6px 12px;">📥 GeoJSON</a>
          <a href="data:text/csv;charset=utf-8,${csvString}" download="${nombreCapa.toLowerCase().replace(/\\s+/g, '_')}.csv" class="accion secundaria" style="text-decoration:none; display:inline-flex; align-items:center; font-size:0.85rem; padding:6px 12px;">📄 CSV</a>
          <button class="accion secundaria" id="btn-metadatos-custom" style="font-size:0.85rem; padding:6px 12px;">📋 Crear Metadatos</button>
        </div>
      </div>
      <table class="tabla-datos">
        <thead><tr><th>ID VGI</th><th>Nombre</th><th>Subtipo</th><th>Superficie (m²)</th><th>Dirección</th><th>Accesibilidad</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      ${total > 30 ? `<p class="descripcion" style="margin-top:6px;">Mostrando los primeros 30 de ${total} registros extraídos.</p>` : ''}
    `;

    document.getElementById('btn-ver-en-mapa-custom')?.addEventListener('click', () => {
      const capa = ModuloMapa.cargarCapaGeoJSON(capaId, geojson, {
        nombre: nombreCapa,
        color: colorCapa,
        icono: '🔍',
        fuente: fuenteCapa,
        licencia: licCapa
      });
      if (typeof window.activarPanel === 'function') {
        window.activarPanel('inicio');
      } else {
        document.querySelector('button[data-panel="inicio"]')?.click();
      }
      setTimeout(() => {
        ModuloMapa.invalidarTamano(capa && capa.getBounds ? capa.getBounds() : null);
      }, 100);
    });
    document.getElementById('btn-metadatos-custom')?.addEventListener('click', () => {
      prellenarMetadatosDesdeUltimaConsulta();
      document.querySelector('button[data-panel="metadatos"]').click();
    });

  } catch (err) {
    contenedor.innerHTML = avisoError(`Error en consulta: ${err.message}`);
  }
}

function guardarConsultaUsuario() {
  const clave = document.getElementById('custom-clave-manual')?.value.trim();
  const valor = document.getElementById('custom-valor')?.value.trim();
  const operador = document.getElementById('custom-operador')?.value || '=';
  const nombre = document.getElementById('custom-nombre-capa')?.value.trim() || `${clave}=${valor}`;
  const entidad = document.getElementById('custom-entidad')?.value || 'nwr';

  if (!clave) {
    alert('Por favor especifica al menos una clave OSM para guardar.');
    return;
  }

  const guardadas = JSON.parse(localStorage.getItem('nodo-vgi:consultas-guardadas') || '[]');
  guardadas.unshift({ nombre, clave, valor, operador, entidad });
  localStorage.setItem('nodo-vgi:consultas-guardadas', JSON.stringify(guardadas.slice(0, 10)));
  cargarConsultasGuardadas();
}

function cargarConsultasGuardadas() {
  const cnt = document.getElementById('lista-consultas-guardadas');
  if (!cnt) return;

  const defaultConsultas = [
    { nombre: 'Farmacias y Salud', clave: 'amenity', valor: 'pharmacy', operador: '=', entidad: 'nwr' },
    { nombre: 'Panaderías y Almacenes', clave: 'shop', valor: 'bakery', operador: '=', entidad: 'nwr' },
    { nombre: 'Casonas y Patrimonio', clave: 'historic', valor: '*', operador: '*', entidad: 'nwr' },
    { nombre: 'Paradas de Bus Red', clave: 'highway', valor: 'bus_stop', operador: '=', entidad: 'node' }
  ];

  const guardadas = JSON.parse(localStorage.getItem('nodo-vgi:consultas-guardadas') || 'null') || defaultConsultas;

  cnt.innerHTML = guardadas.map((c, i) => `
    <button type="button" class="accion secundaria" style="font-size:0.78rem; padding:3px 8px; border-radius:12px; margin:2px;" data-consulta-idx="${i}">
      🔍 ${c.nombre} <small style="opacity:0.7">(${c.clave}${c.operador}${c.valor || '*'}</small>)
    </button>
  `).join('');

  cnt.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-consulta-idx'), 10);
      const c = guardadas[idx];
      if (!c) return;
      document.getElementById('custom-clave-manual').value = c.clave;
      document.getElementById('custom-valor').value = c.valor || '';
      document.getElementById('custom-operador').value = c.operador || '=';
      document.getElementById('custom-nombre-capa').value = c.nombre;
      document.getElementById('custom-entidad').value = c.entidad || 'nwr';
      actualizarCodigoQLPreview();
      manejarConsultaPersonalizada();
    });
  });
}

function manejarCambioPresetOSM(e) {
  const preset = e.target.value;
  const inputEtiqueta = document.getElementById('osm-etiqueta');
  if (inputEtiqueta) {
    if (preset) {
      inputEtiqueta.value = '';
      inputEtiqueta.placeholder = `Preset activo: ${preset}`;
    } else {
      inputEtiqueta.placeholder = 'ej: amenity=university, shop=bakery';
    }
  }
  if (preset) {
    sincronizarCoherenciaEntreModulos(preset, { origen: 'preset_osm' });
  }
}

async function manejarConsultaOSM(cargarAlMapa = false, modo = 'bbox') {
  const contenedor = document.getElementById('resultado-osm');
  const bbox = leerBbox('osm');
  if (!bbox) { contenedor.innerHTML = avisoError('Completa las cuatro coordenadas del área.'); return; }

  const preset = document.getElementById('osm-categoria-preset')?.value || '';
  const etiquetaManual = document.getElementById('osm-etiqueta')?.value?.trim() || '';
  const filtroAEjecutar = etiquetaManual || preset || 'educacion';

  const modoTexto = modo === 'coordenadas' 
    ? '📌 Coordenadas Numéricas Manuales' 
    : (modo === 'rm_completa' ? '🌐 Toda la Región Metropolitana' : '🗺️ Bbox Interactivo del Mapa');

  contenedor.innerHTML = `<p class="descripcion">📦 Consultando Geodatabase RM (${modoTexto})...</p>`;

  try {
    const geojson = await ModuloOSM.consultarBaseDatosOSM(bbox, preset, etiquetaManual);
    const elementos = geojson.features || [];
    const total = elementos.length;
    const catId = geojson.categoria || preset || 'educacion';
    const catCfg = window.NODO_CONFIG?.categorias_osm?.find(c => c.id === catId) || {};
    const nombreCapa = catCfg.nombre || preset || etiquetaManual || 'Geodatabase RM';
    const colorCapa = catCfg.color || '#A97722';
    const iconoCapa = catCfg.icono || '📦';

    ultimaConsultaRealizada = { bbox, filtro: filtroAEjecutar, cantidad: total, fuente: 'Geofabrik (Extracto RM)' };
    autocargarMetadatos({
      categoriaId: catId,
      cantidad: total,
      fuente: 'Geofabrik (Extracto RM)',
      filtro: filtroAEjecutar,
      bbox
    });

    if (total === 0) {
      contenedor.innerHTML = avisoInfo(`No se encontraron elementos para "${filtroAEjecutar}" en el área seleccionada.`);
      return;
    }

    if (cargarAlMapa) {
      const capa = ModuloMapa.cargarCapaGeoJSON('explorador_osm', geojson, {
        nombre: `Geodatabase RM: ${nombreCapa} (Geofabrik)`,
        color: colorCapa,
        icono: iconoCapa,
        fuente: 'Geofabrik (Extracto RM)',
        licencia: 'ODbL 1.0 (© colaboradores de OpenStreetMap / Geofabrik GmbH)'
      });
      // Cambiar a panel de inicio para ver el mapa
      if (typeof window.activarPanel === 'function') {
        window.activarPanel('inicio');
      } else {
        document.querySelector('button[data-panel="inicio"]')?.click();
      }
      setTimeout(() => {
        ModuloMapa.invalidarTamano(capa && capa.getBounds ? capa.getBounds() : null);
      }, 100);
      return;
    }

    const puntos = geojson.features.filter(f => f.geometry && f.geometry.type === 'Point').length;
    const lineas = geojson.features.filter(f => f.geometry && (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString')).length;
    const poligonos = geojson.features.filter(f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
    const totalM2 = poligonos.reduce((acc, f) => acc + (f.properties?.superficie_m2 || 0), 0);

    let indicadorSuperficieHtml = '';
    if (totalM2 > 0) {
      indicadorSuperficieHtml = `
        <div class="indicador" style="border-left: 3px solid #B8860B;">
          <span class="valor">${totalM2.toLocaleString('es-CL')} m²</span>
          <span class="etiqueta">Superficie total cubierta (${(totalM2 / 10000).toFixed(2)} ha / ${(totalM2 / 1000000).toFixed(4)} km²) [EPSG:32719]</span>
        </div>
      `;
    }

    const filas = geojson.features.slice(0, 35).map(f => {
      const p = f.properties;
      return `
        <tr>
          <td><code>${p.id_vgi || f.id}</code></td>
          <td><strong>${p.nombre || '—'}</strong></td>
          <td>${p.subtipo || '—'}</td>
          <td>${p.superficie_m2 ? `<strong>${p.superficie_m2.toLocaleString('es-CL')} m²</strong> <small style="color:var(--tinta-suave);">(${p.superficie_ha} ha)</small>` : '—'}</td>
          <td><small>${p.etiquetas_completas ? Object.entries(p.etiquetas_completas).slice(0, 3).map(([k,v]) => `${k}=${v}`).join(', ') : ''}</small></td>
        </tr>
      `;
    }).join('');

    let geojsonDescarga = geojson;
    if (typeof ModuloMetadatos !== 'undefined' && ModuloMetadatos.enriquecerGeoJSON) {
      geojsonDescarga = ModuloMetadatos.enriquecerGeoJSON(geojson, { id: catId });
    }
    const jsonString = encodeURIComponent(JSON.stringify(geojsonDescarga, null, 2));

    contenedor.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <div class="indicador">
            <span class="valor">${total}</span>
            <span class="etiqueta">elementos (📍 ${puntos} puntos · 〰️ ${lineas} líneas · ⬡ ${poligonos.length} polígonos)</span>
          </div>
          ${indicadorSuperficieHtml}
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="accion" id="btn-ver-en-mapa-osm-db" style="font-size:0.85rem; padding:6px 12px;">🗺️ Ver en Mapa Atlas</button>
          <a href="data:application/geo+json;charset=utf-8,${jsonString}" download="geodatabase_osm_${catId}.geojson" class="accion secundaria" style="text-decoration:none; display:inline-flex; align-items:center; font-size:0.85rem; padding:6px 12px;">📥 GeoJSON</a>
        </div>
      </div>
      <div style="background:var(--papel-tarjeta); border:1px solid var(--linea); border-left:4px solid var(--verde); padding:8px 12px; border-radius:6px; font-size:0.84rem; margin-bottom:12px;">
        📦 <strong>Fuente:</strong> Descarga de Geofabrik (Extracto Región Metropolitana · 921.401 entidades con superposición semántica · 319.380 edificaciones completas · 151.066 de transporte · 76.397 coberturas/usos de suelo) · <strong>Filtro:</strong> ${modoTexto} <code>[${bbox.map(n => Number(n).toFixed(4)).join(', ')}]</code> · Cobertura 100% Macro-Categoría <code>${catId.toUpperCase()}</code>
      </div>

      <table class="tabla-datos">
        <thead><tr><th>ID</th><th>Nombre</th><th>Tipo Principal</th><th>Superficie (m²)</th><th>Etiquetas Clave</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      ${total > 35 ? `<p class="descripcion">Mostrando 35 de ${total} elementos descargados en Bbox.</p>` : ''}
    `;

    document.getElementById('btn-ver-en-mapa-osm-db')?.addEventListener('click', () => {
      const capa = ModuloMapa.cargarCapaGeoJSON('explorador_osm', geojson, {
        nombre: `Geodatabase RM: ${nombreCapa} (Geofabrik)`,
        color: colorCapa,
        icono: iconoCapa,
        fuente: 'Geofabrik (Extracto RM)',
        licencia: 'ODbL 1.0 (© colaboradores de OpenStreetMap / Geofabrik GmbH)'
      });

      if (typeof window.activarPanel === 'function') {
        window.activarPanel('inicio');
      } else {
        document.querySelector('button[data-panel="inicio"]')?.click();
      }
      setTimeout(() => {
        ModuloMapa.invalidarTamano(capa && capa.getBounds ? capa.getBounds() : null);
      }, 100);
    });

  } catch (error) {
    contenedor.innerHTML = avisoError(error.message);
  }
}

/* ---------------------- GESTIÓN DE PERFILES DE ACTOR TERRITORIAL ---------------------- */

function manejarCambioPerfilUsuario(e) {
  const perfil = e ? e.target.value : (document.getElementById('sel-perfil-usuario')?.value || 'todos');
  const badgeInfo = document.getElementById('badge-perfil-info');

  const descripciones = {
    todos: 'Herramientas adaptadas para gestión territorial integral. Acceso general a todas las funciones.',
    institucion: '🏛 Perfil Institucional / Municipal / IDE Chile: Prioriza metadatos normalizados (ISO 19115/19139), catastro de equipamiento crítico, licencias abiertas y control de calidad espacial.',
    comunidad: '🗫 Perfil Comunitario / Vecinal: Facilita consultas rápidas en 1 clic para plazas, patrimonio, ciclovías, comercios locales y mapeo barrial colaborativo en UMap.',
    voluntario: '⌖ Perfil Mapeador / Voluntario OSM: Herramientas analíticas avanzadas, métricas geométricas ohsome v1 (longitud/área/densidad), editor Overpass QL y taxonomía.',
    ong: '🔬 Perfil ONGs / Territoriales: Proporciona cálculo de densidades territoriales rigurosas mediante reproyección EPSG:32719, calidad ISO 19157 con ohsome v1/v2, exportación GeoJSON para QGIS, articulación comunitaria y fuentes bibliográficas.'
  };

  if (badgeInfo) {
    badgeInfo.textContent = descripciones[perfil] || descripciones.todos;
  }

  // Paneles prioritarios según perfil
  const panelesPrioritarios = {
    institucion: ['metadatos-iso', 'calidad-ohsome', 'diccionario', 'licencias'],
    comunidad: ['inicio', 'explorador-osm', 'proyectos-umap', 'diccionario'],
    voluntario: ['explorador-osm', 'calidad-ohsome', 'diccionario', 'manual'],
    ong: ['inicio', 'calidad-ohsome', 'biodiversidad-gbif', 'metadatos-iso', 'manual'],
    todos: []
  };

  const recomendados = panelesPrioritarios[perfil] || [];

  // Actualizar botones de navegación en la barra lateral
  document.querySelectorAll('#lista-navegacion button').forEach(btn => {
    const idPanel = btn.dataset.panel;
    const yaExisteBadge = btn.querySelector('.badge-recomendado');
    if (yaExisteBadge) yaExisteBadge.remove();

    if (recomendados.includes(idPanel)) {
      btn.style.borderLeft = '3px solid var(--ocre)';
      const span = document.createElement('span');
      span.className = 'badge-recomendado';
      span.style.fontSize = '0.65rem';
      span.style.marginLeft = '6px';
      span.style.color = 'var(--ocre)';
      span.style.fontWeight = 'bold';
      span.textContent = '★';
      btn.appendChild(span);
    } else {
      btn.style.borderLeft = '';
    }
  });

  // Ajustar o destacar botones de sugerencias ciudadanas
  const perfilesSugerencias = {
    institucion: ['amenity=university', 'highway=bus_stop', 'kerb=lowered', 'building=yes', 'CAT-01', 'CAT-03', 'CAT-07', 'CAT-09'],
    comunidad: ['shop=*', 'leisure=park', 'historic=*', 'highway=cycleway', 'CAT-02', 'CAT-04', 'CAT-05', 'CAT-06'],
    voluntario: ['amenity=university', 'historic=*', 'kerb=lowered', 'natural=tree', 'CAT-01', 'CAT-06', 'CAT-07', 'CAT-08'],
    ong: ['natural=tree', 'leisure=park', 'historic=*', 'landuse=*', 'CAT-05', 'CAT-06', 'CAT-08', 'CAT-10']
  };

  const listaFiltro = perfilesSugerencias[perfil] || null;

  document.querySelectorAll('.btn-sugerencia-ciudadana').forEach(btn => {
    const clave = btn.dataset.clave;
    const valor = btn.dataset.valor;
    const cat = btn.dataset.cat;
    const claveValor = `${clave}=${valor}`;

    if (!listaFiltro) {
      btn.classList.remove('perfil-destacado', 'perfil-atenuado');
    } else if (listaFiltro.includes(claveValor) || (clave === 'historic' && listaFiltro.includes('historic=*')) || (cat && listaFiltro.includes(cat))) {
      btn.classList.add('perfil-destacado');
      btn.classList.remove('perfil-atenuado');
    } else {
      btn.classList.remove('perfil-destacado');
      btn.classList.add('perfil-atenuado');
    }
  });
}

/* ---------------------- PANEL OHSOME ---------------------- */

async function manejarConsultaOhsome() {
  const contenedor = document.getElementById('resultado-ohsome');
  const bbox = leerBbox('oh');
  if (!bbox) { contenedor.innerHTML = avisoError('Completa las cuatro coordenadas del área.'); return; }

  const valFiltroInput = document.getElementById('oh-filtro').value.trim();
  const valPresetSelect = document.getElementById('oh-preset-selector')?.value;
  const filtro = valFiltroInput || (valPresetSelect && valPresetSelect !== 'custom' ? valPresetSelect : 'building=* and type:way');
  const intervalo = document.getElementById('oh-intervalo-selector')?.value || 'P1Y';
  const version = document.getElementById('oh-version-selector')?.value || 'v1';
  const apiKey = document.getElementById('oh-api-key')?.value.trim() || localStorage.getItem('nodo-vgi:heigit-api-key') || '';

  contenedor.innerHTML = `<p class="descripcion">Calculando métricas multidimensionales de calidad con ohsome API ${version.toUpperCase()} (HeiGIT)…</p>`;

  try {
    const indicadores = await ModuloOhsome.calcularIndicadores(bbox, filtro, intervalo, version, apiKey);
    const densInfo = ModuloOhsome.calcularDensidad(bbox, indicadores.elementosAhora || 0);

    ultimaConsultaRealizada = { bbox, filtro, cantidad: indicadores.elementosAhora, fuente: `ohsome ${indicadores.version}` };
    autocargarMetadatos({
      categoriaId: categoriaActivaGlobal,
      cantidad: indicadores.elementosAhora,
      fuente: `ohsome API ${indicadores.version.toUpperCase()} (${indicadores.motor})`,
      filtro: filtro,
      bbox
    });

    let htmlBadgeVersion = '';
    if (indicadores.fueFallback) {
      htmlBadgeVersion = `
        <div class="caja-cuadrado" style="background:rgba(245, 158, 11, 0.12); border-left:6px solid var(--ocre); border-radius:12px; padding:16px; margin-bottom:18px;">
          <strong style="color:var(--ocre); font-size:0.95rem;">ℹ️ Conmutación Automática a ohsome API v1 (Motor OSHDB):</strong><br>
          <span style="font-size:0.88rem; color:var(--tinta-suave);">La consulta solicitada a la API v2 no pudo autenticarse (${indicadores.motivoFallback || 'Requiere API Key válida de HeiGIT'}). Se ejecutó exitosamente la consulta mediante <strong>ohsome API v1</strong> garantizando la continuidad operativa.</span>
        </div>
      `;
    } else {
      const colorVersion = indicadores.version === 'v2' ? 'var(--esmeralda)' : 'var(--agua)';
      htmlBadgeVersion = `
        <div style="display:inline-flex; align-items:center; gap:10px; margin-bottom:16px; padding:6px 14px; background:var(--papel-tarjeta); border:2px solid var(--linea-tarjeta); border-radius:12px; font-size:0.86rem; box-shadow:var(--sombra-sm);">
          <span style="font-weight:800; color:${colorVersion}; font-family:var(--fuente-datos);">● OHSOME API ${indicadores.version.toUpperCase()}</span>
          <span style="color:var(--tinta-suave); font-weight:600;">Motor Analytics: ${indicadores.motor}</span>
        </div>
      `;
    }

    // Indicadores métricos geométricos
    let htmlMetricaGeo = '';
    if (indicadores.metricaGeometrica) {
      if (indicadores.metricaGeometrica.tipo === 'longitud') {
        htmlMetricaGeo = `
          <div class="caja-tarjeta-normativa" style="border-left: 6px solid var(--esmeralda);">
            <span style="font-size:0.8rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700;">MAGNITUD LINEAL EN RED</span>
            <div style="font-size:1.6rem; font-weight:900; color:#34d399; font-family:var(--fuente-titulos);">${indicadores.metricaGeometrica.valorKm.toLocaleString('es-CL')} km</div>
            <span style="font-size:0.82rem; color:var(--tinta-suave);">${indicadores.metricaGeometrica.etiqueta} (${indicadores.metricaGeometrica.valorMetros.toLocaleString('es-CL')} m lineales)</span>
          </div>
        `;
      } else if (indicadores.metricaGeometrica.tipo === 'superficie') {
        htmlMetricaGeo = `
          <div class="caja-tarjeta-normativa" style="border-left: 6px solid var(--ocre);">
            <span style="font-size:0.8rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700;">COBERTURA DE SUPERFICIE</span>
            <div style="font-size:1.5rem; font-weight:900; color:#fbbf24; font-family:var(--fuente-titulos);">${indicadores.metricaGeometrica.valorM2.toLocaleString('es-CL')} m²</div>
            <span style="font-size:0.82rem; color:var(--tinta-suave);">${indicadores.metricaGeometrica.etiqueta} (${indicadores.metricaGeometrica.valorHectareas.toLocaleString('es-CL')} ha / ${indicadores.metricaGeometrica.valorKm2} km²) [EPSG:32719]</span>
          </div>
        `;
      }
    } else {
      htmlMetricaGeo = `
        <div class="caja-tarjeta-normativa" style="border-left: 6px solid var(--agua);">
          <span style="font-size:0.8rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700;">TIPO DE GEOMETRÍA</span>
          <div style="font-size:1.4rem; font-weight:900; color:#38bdf8; font-family:var(--fuente-titulos);">${indicadores.elementosAhora.toLocaleString('es-CL')} Entidades</div>
          <span style="font-size:0.82rem; color:var(--tinta-suave);">Entidad de geometría puntual (nodos / puntos discretos en WGS84)</span>
        </div>
      `;
    }

    // Unificación de series cronológicas anuales
    const mapaSeries = {};
    (indicadores.elementosPorAnio || []).forEach(item => {
      mapaSeries[item.fecha] = { fecha: item.fecha, elementos: item.valor, usuarios: '—', contribuciones: '—' };
    });
    (indicadores.usuariosPorAnio || []).forEach(item => {
      if (!mapaSeries[item.fecha]) mapaSeries[item.fecha] = { fecha: item.fecha, elementos: '—', usuarios: item.valor, contribuciones: '—' };
      else mapaSeries[item.fecha].usuarios = item.valor;
    });
    (indicadores.contribucionesPorAnio || []).forEach(item => {
      if (!mapaSeries[item.fecha]) mapaSeries[item.fecha] = { fecha: item.fecha, elementos: '—', usuarios: '—', contribuciones: item.valor };
      else mapaSeries[item.fecha].contribuciones = item.valor;
    });

    const filasSerie = Object.values(mapaSeries).sort((a, b) => a.fecha.localeCompare(b.fecha)).map(p => `
      <tr>
        <td><strong>${p.fecha}</strong></td>
        <td>${typeof p.elementos === 'number' ? p.elementos.toLocaleString('es-CL') : p.elementos}</td>
        <td>${typeof p.usuarios === 'number' ? p.usuarios.toLocaleString('es-CL') : p.usuarios}</td>
        <td>${typeof p.contribuciones === 'number' ? p.contribuciones.toLocaleString('es-CL') : p.contribuciones}</td>
      </tr>
    `).join('');

    const ultimosUsuarios = (indicadores.usuariosPorAnio && indicadores.usuariosPorAnio.length > 0)
      ? (indicadores.usuariosPorAnio[indicadores.usuariosPorAnio.length - 1]?.valor ?? '—')
      : '—';
    const ultimasContribuciones = (indicadores.contribucionesPorAnio && indicadores.contribucionesPorAnio.length > 0)
      ? (indicadores.contribucionesPorAnio[indicadores.contribucionesPorAnio.length - 1]?.valor ?? '—')
      : '—';
    const ratioEdicion = indicadores.ratioContribucionPorUsuario ? `${indicadores.ratioContribucionPorUsuario} edit/user` : '—';

    // Lista de referencias académicas
    const listaRefs = (indicadores.referencias || []).map(r => `
      <li style="margin-bottom:8px; font-size:0.84rem; line-height:1.5;">
        <strong>${r.autor}</strong> — <em>${r.titulo}</em>.
        ${r.doi ? `<br><a href="https://doi.org/${r.doi}" target="_blank" rel="noopener" style="color:var(--musgo); text-decoration:underline;">https://doi.org/${r.doi} ↗</a>` : ''}
        ${r.url ? `<br><a href="${r.url}" target="_blank" rel="noopener" style="color:var(--musgo); text-decoration:underline;">${r.url} ↗</a>` : ''}
      </li>
    `).join('');

    // Índice OQT de Saturación y Madurez Territorial (HeiGIT / Herfort et al., 2023)
    let htmlOQT = '';
    if (window.ModuloCalidadAnalyst) {
      const oqt = window.ModuloCalidadAnalyst.calcularIndicadoresOQT(indicadores, []);
      htmlOQT = `
        <div class="caja-cuadrado" style="border:2px solid var(--violeta); background:var(--papel-alto); padding:24px; margin-top:22px; border-top:6px solid var(--violeta);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--linea); padding-bottom:12px; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
            <div>
              <span style="font-family:var(--fuente-datos); font-size:0.78rem; color:var(--violeta); text-transform:uppercase; letter-spacing:0.06em; font-weight:800;">[MARCO HEIGIT OQT // OHSOME QUALITY ANALYST]</span>
              <h3 style="margin:4px 0 0 0; font-size:1.35rem; color:#ffffff;">Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157)</h3>
            </div>
            <div style="font-family:var(--fuente-datos); font-size:1.1rem; background:rgba(168, 85, 247, 0.18); border:2px solid var(--violeta); padding:6px 16px; border-radius:12px; font-weight:800; color:#e9d5ff;">
              Score de Madurez: ${oqt.scoreSaturacion}/100
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom:16px;">
            <div style="background:var(--papel-tarjeta); padding:16px; border:2px solid var(--linea-tarjeta); border-radius:10px;">
              <span style="font-size:0.75rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); display:block; font-weight:700;">ESTADO DE SATURACIÓN FISICA</span>
              <strong style="font-size:1.15rem; color:var(--violeta); font-family:var(--fuente-titulos); font-weight:900;">${oqt.saturacion}</strong>
            </div>
            <div style="background:var(--papel-tarjeta); padding:16px; border:2px solid var(--linea-tarjeta); border-radius:10px;">
              <span style="font-size:0.75rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); display:block; font-weight:700;">TENDENCIA ESPACIO-TEMPORAL</span>
              <strong style="font-size:1.05rem; color:#ffffff; font-weight:800;">${oqt.tendencia}</strong>
            </div>
          </div>

          <div style="background:rgba(13, 21, 39, 0.85); border:1.5px solid var(--linea-tarjeta); border-radius:10px; padding:16px; font-size:0.9rem; color:var(--tinta-suave); line-height:1.65;">
            📖 <strong>¿Qué representa este indicador?</strong><br>
            El <em>Índice de Saturación y Madurez Territorial</em> (Herfort et al., 2023) analiza el comportamiento histórico de la curva acumulativa de elementos espaciales extraídos por ohsome API (OSHDB). Cuando la pendiente anual de la curva de nuevas geometrías se atenúa mientras las ediciones por usuario se mantienen altas, el polígono territorial ha alcanzado la <strong>saturación de huella primaria</strong>. Esto significa que la cartografía base (geometría de calles y edificios) se encuentra consolidada, permitiendo reorientar los esfuerzos comunitarios y municipales hacia la actualización de <strong>microatributos cualitativos de accesibilidad (Art. 2.6.3 / D.S. 50), nombres de locales y fiscalización de ordenanzas</strong>.
          </div>
        </div>
      `;
    }

    contenedor.innerHTML = `
      ${htmlBadgeVersion}

      <!-- Grilla de Tarjetas con Métricas de Calidad -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:20px;">
        <div class="caja-tarjeta-normativa" style="border-left: 6px solid var(--musgo);">
          <span style="font-size:0.8rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700;">ELEMENTOS VIGENTES</span>
          <div style="font-size:1.6rem; font-weight:900; color:#ffffff; font-family:var(--fuente-titulos);">${indicadores.elementosAhora.toLocaleString('es-CL')}</div>
          <span style="font-size:0.82rem; color:var(--tinta-suave);">Objetos activos al ${indicadores.fechaCorte}</span>
        </div>

        ${htmlMetricaGeo}

        <div class="caja-tarjeta-normativa" style="border-left: 6px solid var(--alerta);">
          <span style="font-size:0.8rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700;">DENSIDAD ESPACIAL METRICA</span>
          <div style="font-size:1.5rem; font-weight:900; color:#f87171; font-family:var(--fuente-titulos);">${densInfo ? densInfo.densidad.toFixed(1) : '—'} <small style="font-size:0.8rem;">elem/km²</small></div>
          <div style="font-size:0.8rem; color:var(--tinta-suave); margin-top:4px; line-height:1.4;">
            Área Bbox: ${densInfo ? `<strong>${densInfo.areaM2.toLocaleString('es-CL')} m²</strong> (${densInfo.areaHa.toLocaleString('es-CL')} ha)` : '—'}<br>
            Densidad por m²: ${densInfo && densInfo.densidadM2 ? `<strong>${(densInfo.densidadM2 * 10000).toFixed(2)} elem / 10.000 m²</strong>` : '—'}<br>
            <strong style="color:#f87171;">Reproyectado a EPSG:32719</strong> (Shoelace Gauss)
          </div>
        </div>

        <div class="caja-tarjeta-normativa" style="border-left: 6px solid var(--agua);">
          <span style="font-size:0.8rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700;">COLABORADORES ÚNICOS</span>
          <div style="font-size:1.6rem; font-weight:900; color:#38bdf8; font-family:var(--fuente-titulos);">${ultimosUsuarios}</div>
          <span style="font-size:0.82rem; color:var(--tinta-suave);">Mapeadores activos en el último período</span>
        </div>

        <div class="caja-tarjeta-normativa" style="border-left: 6px solid var(--violeta);">
          <span style="font-size:0.8rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700;">CONTRIBUCIONES REGISTRADAS</span>
          <div style="font-size:1.5rem; font-weight:900; color:#c084fc; font-family:var(--fuente-titulos);">${typeof ultimasContribuciones === 'number' ? ultimasContribuciones.toLocaleString('es-CL') : ultimasContribuciones}</div>
          <span style="font-size:0.82rem; color:var(--tinta-suave);">Ediciones / Commits espacio-temporales</span>
        </div>

        <div class="caja-tarjeta-normativa" style="border-left: 6px solid var(--esmeralda);">
          <span style="font-size:0.8rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700;">INTENSIDAD COMUNITARIA</span>
          <div style="font-size:1.5rem; font-weight:900; color:#34d399; font-family:var(--fuente-titulos);">${ratioEdicion}</div>
          <span style="font-size:0.82rem; color:var(--tinta-suave);">Tasa media de ediciones por colaborador</span>
        </div>
      </div>

      ${htmlOQT}

      <div class="caja-cuadrado" style="margin-top:22px;">
        <h3 style="margin-top:0; color:#ffffff;">Evolución Histórica Multidimensional (ohsome API / OSHDB)</h3>
        <p class="descripcion" style="margin-bottom:14px;">Serie cronológica anual extraída directamente de la base de datos histórica de OpenStreetMap (HeiGIT):</p>
        <table class="tabla-datos">
          <thead>
            <tr>
              <th>Período / Año</th>
              <th>Elementos Totales</th>
              <th>Colaboradores Únicos</th>
              <th>Contribuciones / Cambios</th>
            </tr>
          </thead>
          <tbody>${filasSerie}</tbody>
        </table>
      </div>

      <div class="caja-cuadrado" style="border-left:6px solid var(--musgo); margin-top:22px;">
        <h4 style="margin:0 0 10px 0; font-size:1.1rem; color:var(--musgo);">📐 Rigor Metodológico, Reproyección y Criterios ISO 19157</h4>
        <p class="descripcion" style="margin-bottom:10px; font-size:0.92rem; line-height:1.65; color:var(--tinta-suave);">
          <strong>Reproyección Geodésica Rigurosa a EPSG:32719 (WGS 84 / UTM Huso 19 Sur):</strong> Todo cálculo métrico de superficie del Bbox territorial (${densInfo ? `${densInfo.areaM2.toLocaleString('es-CL')} m² / ${densInfo.areaHa.toLocaleString('es-CL')} ha / ${densInfo.areaKm2} km²` : ''}) y densidad espacial de elementos se obtiene proyectando los vértices geográficos mediante las ecuaciones conformes de Transverse Mercator (Snyder, 1987) al sistema oficial de referencia <strong>EPSG:32719</strong> (meridiano central 69°O, elipsoide WGS84, falso este 500.000 m, falso norte 10.000.000 m) y aplicando la fórmula de Gauss (Shoelace). Esto garantiza concordancia con las normas del Instituto Geográfico Militar (IGM) y la Infraestructura de Datos Espaciales de Chile (IDE Chile / SNIT), expresando consistentemente cada dimensión superficial en metros cuadrados (m²), hectáreas (ha) y kilómetros cuadrados (km²).
        </p>
        <p class="descripcion" style="margin-bottom:10px; font-size:0.92rem; line-height:1.65; color:var(--tinta-suave);">
          <strong>Sensibilidad geométrica:</strong> Conforme a la API v1 de ohsome, las geometrías lineales evalúan continuidad de red en kilómetros lineales (calles y ciclovías), mientras que los polígonos cuantifican la superficie de huella construida o áreas verdes en hectáreas y metros cuadrados.
        </p>
        <p class="descripcion" style="margin-bottom:12px; font-size:0.92rem; line-height:1.65; color:var(--tinta-suave);">
          <strong>Madurez y Linaje:</strong> El ratio de contribuciones por usuario y la masa crítica de colaboradores permiten evaluar si la cartografía de Barrio Brasil depende de pocos mapeadores esporádicos o de una comunidad activa recurrente (Haklay, 2010; Neis & Zipf, 2012).
        </p>
        <h5 style="margin:14px 0 8px 0; font-size:0.86rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--tinta);">Referencias Académicas y Documentales:</h5>
        <ul style="padding-left:20px; margin:0; color:var(--tinta-suave);">
          ${listaRefs}
        </ul>
      </div>
    `;
  } catch (error) {
    contenedor.innerHTML = avisoError(error.message + ' Prueba con un área más pequeña o ajusta el filtro según docs.ohsome.org.');
  }
}

/* ---------------------- PANEL GBIF ---------------------- */

async function manejarConsultaGBIF(cargarAlMapa = false) {
  const contenedor = document.getElementById('resultado-gbif');
  const bbox = leerBbox('gbif');
  const nombre = document.getElementById('gbif-nombre').value.trim();
  const basisOfRecord = document.getElementById('gbif-basis-selector')?.value || 'ALL';

  contenedor.innerHTML = '<p class="descripcion">Consultando registros de biodiversidad en GBIF…</p>';

  try {
    const resultado = await ModuloGBIF.buscarOcurrencias({
      nombre,
      bbox: bbox || undefined,
      basisOfRecord: basisOfRecord,
      limite: 300
    });

    if (resultado.registros.length === 0) {
      contenedor.innerHTML = avisoInfo('No se encontraron registros biológicos con esos criterios en el área.');
      return;
    }

    ultimaConsultaRealizada = {
      bbox,
      filtro: nombre || 'Biodiversidad Urbana',
      cantidad: resultado.total,
      fuente: 'GBIF'
    };
    autocargarMetadatos({
      categoriaId: 'biodiversidad',
      cantidad: resultado.total,
      fuente: 'Global Biodiversity Information Facility (GBIF)',
      filtro: nombre || 'Biodiversidad Urbana',
      bbox
    });

    if (cargarAlMapa) {
      const capa = ModuloMapa.cargarCapaGeoJSON('gbif_biodiversidad', resultado.geojson, {
        nombre: 'Biodiversidad (GBIF)',
        color: '#1C523A',
        icono: '🌿',
        fuente: 'GBIF / Ciencia Ciudadana',
        licencia: 'CC-BY 4.0'
      });
      if (typeof window.activarPanel === 'function') {
        window.activarPanel('inicio');
      } else {
        document.querySelector('button[data-panel="inicio"]')?.click();
      }
      setTimeout(() => {
        ModuloMapa.invalidarTamano(capa && capa.getBounds ? capa.getBounds() : null);
      }, 100);
      return;
    }

    const filas = resultado.registros.slice(0, 30).map(r => {
      const flagsIssues = (r.issues && r.issues.length > 0)
        ? r.issues.map(iss => `<span style="display:inline-block; font-family:var(--fuente-datos); font-size:0.68rem; background:var(--papel); border:1px solid var(--linea); padding:1px 4px; margin:1px;">${iss}</span>`).join(' ')
        : `<span style="color:var(--musgo); font-family:var(--fuente-datos); font-size:0.75rem;">✓ Sin incidencias</span>`;

      return `
        <tr>
          <td><strong>${r.especie}</strong></td>
          <td>${r.nombreComun || '—'}</td>
          <td>${r.fecha}</td>
          <td>${r.publicador}</td>
          <td>${flagsIssues}</td>
          <td><small>${r.licencia}</small></td>
        </tr>
      `;
    }).join('');

    contenedor.innerHTML = `
      <div class="indicador"><span class="valor">${resultado.total}</span><span class="etiqueta">registros totales en GBIF</span></div>
      <table class="tabla-datos">
        <thead>
          <tr>
            <th>Especie Científica</th>
            <th>Nombre Común</th>
            <th>Fecha</th>
            <th>Publicador</th>
            <th>Validación Darwin Core (Issues)</th>
            <th>Licencia</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    `;
  } catch (error) {
    contenedor.innerHTML = avisoError(error.message);
  }
}

/* ---------------------- PANEL UMAP ---------------------- */

async function manejarCargaUMap() {
  const contenedor = document.getElementById('resultado-umap');
  const url = document.getElementById('umap-url').value.trim();
  if (!url) { contenedor.innerHTML = avisoError('Pega la URL pública de un mapa UMap.'); return; }

  const analisis = ModuloUMap.analizarUrl(url);

  contenedor.innerHTML = `
    <iframe class="iframe-umap" src="${ModuloUMap.urlEmbebido(url)}" title="Mapa UMap embebido"></iframe>
    <p class="descripcion">Intentando obtener el GeoJSON del mapa…</p>
  `;

  if (!analisis) {
    contenedor.innerHTML += avisoInfo('No se pudo reconocer el formato de la URL para la descarga automática; el mapa se muestra arriba embebido.');
    return;
  }

  const intento = await ModuloUMap.intentarDescargarGeojson(analisis);
  const parrafoEstado = document.createElement('div');

  if (intento.ok) {
    const cantidadFeatures = intento.datos.features ? intento.datos.features.length : '—';
    parrafoEstado.innerHTML = avisoInfo(`GeoJSON obtenido: ${cantidadFeatures} elementos. <a href="${intento.urlIntentada}" target="_blank" rel="noopener">Descargar archivo</a>.`);
  } else {
    parrafoEstado.innerHTML = avisoInfo(`No se pudo leer el GeoJSON automáticamente (${intento.motivo}). Puedes descargarlo de forma directa desde <a href="${intento.urlIntentada}" target="_blank" rel="noopener">este enlace</a>.`);
  }
  contenedor.appendChild(parrafoEstado);
}

/* ---------------------- PANEL METADATOS ISO ---------------------- */

function construirObjetoFichaDesdeFormulario() {
  return ModuloMetadatos.construirFicha({
    titulo: document.getElementById('md-titulo').value,
    resumen: document.getElementById('md-resumen').value,
    categoriaTema: document.getElementById('md-categoria-iso')?.value || 'planningCadastre',
    frecuencia: document.getElementById('md-frecuencia')?.value || 'asNeeded',
    rol: document.getElementById('md-rol-select')?.value || 'author',
    oeste: document.getElementById('md-oeste').value,
    sur: document.getElementById('md-sur').value,
    este: document.getElementById('md-este').value,
    norte: document.getElementById('md-norte').value,
    srs: document.getElementById('md-srs').value,
    linaje: document.getElementById('md-linaje').value,
    restricciones: document.getElementById('md-restricciones').value,
    contactoOrganizacion: document.getElementById('md-contacto-org').value,
    contactoCorreo: document.getElementById('md-contacto-correo').value
  });
}

function manejarGenerarMetadatos(evento) {
  evento.preventDefault();
  const ficha = construirObjetoFichaDesdeFormulario();
  ModuloMetadatos.guardarFichaLocal(ficha);
  window._ultimaFichaGenerada = ficha;

  document.getElementById('resultado-metadatos').innerHTML = `
    <div class="aviso">Ficha ISO 19115 generada con éxito. Utiliza los botones inferiores para exportar en JSON o XML (IDE Chile).</div>
    <pre class="tabla-datos" style="white-space:pre-wrap; padding:12px; font-family:'IBM Plex Mono', monospace; font-size:0.8rem; max-height:400px; overflow:auto;">${JSON.stringify(ficha, null, 2)}</pre>
  `;
}

function prellenarMetadatosDesdeUltimaConsulta() {
  const bbox = leerBbox('osm') || window.NODO_CONFIG.area_por_defecto.bbox;
  escribirBbox('md', bbox);

  const fuente = ultimaConsultaRealizada?.fuente || 'OpenStreetMap / Overpass QL';
  const filtro = ultimaConsultaRealizada?.filtro || 'Campus UAH y Barrio Brasil';
  const cantidad = ultimaConsultaRealizada?.cantidad || 'múltiples';

  document.getElementById('md-linaje').value =
    `Extraído desde ${fuente} (${filtro}) para el Bbox [${bbox.join(', ')}] el ${new Date().toISOString().slice(0, 10)}. Comprende ${cantidad} registros validados y normalizados.`;
  document.getElementById('md-titulo').value =
    `Catastro VGI de Equipamiento Universitario y Urbano: Barrio Brasil - Universidad Alberto Hurtado (${new Date().getFullYear()})`;
}

function exportarMetadatosJSON() {
  const ficha = window._ultimaFichaGenerada || construirObjetoFichaDesdeFormulario();
  ModuloMetadatos.exportarComoArchivoJSON(ficha);
}

function exportarMetadatosXML() {
  const ficha = window._ultimaFichaGenerada || construirObjetoFichaDesdeFormulario();
  ModuloMetadatos.exportarComoArchivoXML(ficha);
}

/* ---------------------- NAVEGACIÓN GLOBAL AL MANUAL ---------------------- */

window.navegarAManual = function(seccionId) {
  const btnManual = document.querySelector('button[data-panel="manual"]');
  if (btnManual) {
    btnManual.click();
  }
  if (!seccionId) return;
  setTimeout(() => {
    const el = document.getElementById(seccionId);
    if (el) {
      if (el.tagName === 'DETAILS' || el.closest('details')) {
        const det = el.tagName === 'DETAILS' ? el : el.closest('details');
        det.open = true;
        det.style.display = 'block';
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('resaltado-temporal');
      setTimeout(() => el.classList.remove('resaltado-temporal'), 2500);
    }
  }, 120);
};

/* ---------------------- RESUMEN METODOLÓGICO Y MANUAL DE USO ---------------------- */

function cargarResumenMetodologia() {
  const contenedor = document.getElementById('contenido-manual');
  if (!contenedor) return;
  const mm = window.ModuloManual || (typeof ModuloManual !== 'undefined' ? ModuloManual : null);
  if (mm && typeof mm.render === 'function') {
    contenedor.innerHTML = mm.render();
  }
}

function avisoError(mensaje) { return `<div class="aviso error">${mensaje}</div>`; }
function avisoInfo(mensaje) { return `<div class="aviso">${mensaje}</div>`; }


/* ==========================================================================
   INTEGRACIÓN DE CAPAS OFICIALES IDE CHILE Y AUDITORÍA NORMATIVA
   ========================================================================== */

let modoInspectorNormativoActivo = false;

function obtenerSiglaInstitucion(inst) {
  if (!inst) return 'ESTADO';
  const u = inst.toUpperCase();
  if (u.includes('UOCT')) return 'UOCT';
  if (u.includes('MINVU')) return 'MINVU';
  if (u.includes('INE') || u.includes('CENSO')) return 'INE';
  if (u.includes('MOP') || u.includes('GEOMOP')) return 'MOP';
  if (u.includes('MINEDUC')) return 'MINEDUC';
  if (u.includes('MINSAL') || u.includes('DEIS')) return 'MINSAL';
  if (u.includes('CONAF')) return 'CONAF';
  if (u.includes('DGA')) return 'DGA';
  if (u.includes('BIP') || u.includes('MDS') || u.includes('RSH')) return 'MDS';
  if (u.includes('ODEPA')) return 'ODEPA';
  if (u.includes('SUBTEL')) return 'SUBTEL';
  if (u.includes('BOMBEROS')) return 'CBS';
  if (u.includes('EFE')) return 'EFE';
  if (u.includes('METRO')) return 'METRO';
  if (u.includes('DIFROL')) return 'DIFROL';
  if (u.includes('SUBDERE')) return 'SUBDERE';
  if (u.includes('SII')) return 'SII';
  return inst.split('/')[0].split('(')[0].trim().slice(0, 10);
}

function obtenerTipoGeometria(def) {
  const g = (def.geometria || '').toUpperCase();
  if (g.includes('PUNTO') || g.includes('POINT')) return 'PUNTO';
  if (g.includes('POLÍGONO') || g.includes('POLIGONO') || g.includes('POLYGON')) return 'POLÍGONO';
  if (g.includes('LÍNEA') || g.includes('LINEA') || g.includes('LINE')) return 'LÍNEA';
  if (def.tipoServicio && def.tipoServicio.includes('WMS')) return 'WMS';
  return 'VECTORIAL';
}

function actualizarTelemetriaCapasActivas() {
  const kpiActivas = document.getElementById('kpi-activas-capas');
  const badgeTabActivas = document.getElementById('badge-conteo-activas');
  const contenedorResumen = document.getElementById('contenedor-resumen-capas-activas');

  const elStatCapas = document.getElementById('sidebar-stat-capas');
  const elStatObjetos = document.getElementById('sidebar-stat-objetos');
  const elIcvCompletitud = document.getElementById('sidebar-icv-completitud');
  const elIcvActualidad = document.getElementById('sidebar-icv-actualidad');
  const elIcvAtribucion = document.getElementById('sidebar-icv-atribucion');
  const elIcvGlobal = document.getElementById('sidebar-icv-global');
  const elIcvNota = document.getElementById('sidebar-icv-nota');

  const activasVGI = Object.keys(capasCargadasPorCategoria);
  const activasOficiales = Object.keys(capasOficialesCargadas);

  const importadasActivas = [];
  if (window.ModuloImportadorCapas && typeof window.ModuloImportadorCapas.obtenerCapasImportadas === 'function') {
    const importadas = window.ModuloImportadorCapas.obtenerCapasImportadas();
    Object.values(importadas).forEach(c => {
      if (c && c.activa && c.geojson) {
        importadasActivas.push(c);
      }
    });
  }

  const totalActivas = activasVGI.length + activasOficiales.length + importadasActivas.length;

  if (kpiActivas) kpiActivas.textContent = totalActivas;
  if (badgeTabActivas) badgeTabActivas.textContent = totalActivas;
  if (elStatCapas) elStatCapas.textContent = totalActivas;

  if (totalActivas === 0) {
    if (elStatObjetos) elStatObjetos.textContent = '0';
    if (elIcvCompletitud) {
      elIcvCompletitud.textContent = '—';
      elIcvCompletitud.style.color = 'var(--tinta-tenue)';
    }
    if (elIcvActualidad) {
      elIcvActualidad.textContent = '—';
      elIcvActualidad.style.color = 'var(--tinta-tenue)';
    }
    if (elIcvAtribucion) {
      elIcvAtribucion.textContent = '—';
      elIcvAtribucion.style.color = 'var(--tinta-tenue)';
    }
    if (elIcvGlobal) {
      elIcvGlobal.textContent = '—';
      elIcvGlobal.style.color = 'var(--tinta-tenue)';
    }
    if (elIcvNota) {
      elIcvNota.textContent = 'Activa capas en el mapa para evaluar las métricas en tiempo real.';
    }

    if (contenedorResumen) {
      contenedorResumen.innerHTML = `
        <div style="grid-column:1/-1; padding:24px; text-align:center; color:#94a3b8; font-size:0.88rem; background:rgba(15,23,42,0.5); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">
          No hay capas activas superpuestas en el visor actualmente. Activa capas desde "Capas Oficiales del Estado" o "Capas Colaborativas VGI".
        </div>
      `;
    }
    return;
  }

  // Auditar características de todas las capas activas
  let totalFeatures = 0;
  let featuresConGeometriaValida = 0;
  let totalCeldasAtributos = 0;
  let celdasAtributosLlenas = 0;
  const aniosDetectados = new Set();
  let hayTrimestreQ3 = false;

  function auditarDataset(geojson, layerDef = null, esVGI = false) {
    if (!geojson) return;
    const features = Array.isArray(geojson.features) ? geojson.features : [];
    totalFeatures += features.length;

    if (esVGI) {
      aniosDetectados.add(2026);
      hayTrimestreQ3 = true;
    }

    if (layerDef) {
      const textoDef = `${layerDef.nombre || ''} ${layerDef.citaAPA || ''} ${layerDef.declaracion || ''} ${layerDef.descripcion || ''}`;
      const matchesAnio = textoDef.match(/\b(201\d|202\d)\b/g);
      if (matchesAnio) {
        matchesAnio.forEach(y => aniosDetectados.add(parseInt(y, 10)));
      }
    }

    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      if (!f) continue;

      // 1. Geometría
      const g = f.geometry;
      if (g && g.type && g.coordinates && Array.isArray(g.coordinates) && g.coordinates.length > 0) {
        featuresConGeometriaValida++;
      }

      // 2. Atributos
      const props = f.properties || {};
      const keys = Object.keys(props);
      for (let k = 0; k < keys.length; k++) {
        totalCeldasAtributos++;
        const val = props[keys[k]];
        if (val !== null && val !== undefined) {
          const s = String(val).trim();
          if (s !== '' && s !== 'null' && s !== 'undefined' && s !== 'N/A' && s !== 'None' && s !== '-') {
            celdasAtributosLlenas++;
          }
        }
      }

      // 3. Temporalidad
      const t = props.meta_temporalidad || props.timestamp || props.FECHA || props.fecha || props.ANIO || props.anio || props.ANIO_DOC || props.VIGENCIA || props.VU_2023 || props.FECHA_ACTU;
      if (t) {
        const strT = String(t);
        if (strT.includes('2026') || strT.includes('Q3')) {
          hayTrimestreQ3 = true;
        }
        const m = strT.match(/\b(201\d|202\d)\b/g);
        if (m) {
          m.forEach(y => aniosDetectados.add(parseInt(y, 10)));
        }
      }
    }
  }

  activasVGI.forEach(cId => {
    auditarDataset(capasCargadasPorCategoria[cId], null, true);
  });

  activasOficiales.forEach(cId => {
    const geo = capasOficialesCargadas[cId];
    const def = window.ModuloIDEChile ? window.ModuloIDEChile.obtenerDefinicion(cId) : null;
    auditarDataset(geo, def, false);
  });

  importadasActivas.forEach(c => {
    auditarDataset(c.geojson, null, false);
  });

  // Métricas calculadas
  if (elStatObjetos) {
    elStatObjetos.textContent = totalFeatures.toLocaleString('es-CL');
  }

  // 1. Completitud espacial
  const pctEspacial = totalFeatures > 0 ? (featuresConGeometriaValida / totalFeatures) * 100 : 0;
  const califEspacial = pctEspacial >= 95 ? 'Alto' : (pctEspacial >= 80 ? 'Medio' : 'Bajo');
  if (elIcvCompletitud) {
    elIcvCompletitud.textContent = `${pctEspacial.toFixed(1)}% (${califEspacial})`;
    elIcvCompletitud.style.color = pctEspacial >= 90 ? 'var(--musgo)' : (pctEspacial >= 75 ? 'var(--ocre)' : '#ef4444');
  }

  // 2. Actualidad reciente
  let actualidadTexto = '—';
  if (aniosDetectados.size > 0) {
    const maxAnio = Math.max(...aniosDetectados);
    const minAnio = Math.min(...aniosDetectados);
    if (maxAnio === 2026 && hayTrimestreQ3) {
      actualidadTexto = (minAnio < 2026) ? `${minAnio}–2026 Q3` : '2026 Q3';
    } else if (minAnio === maxAnio) {
      actualidadTexto = String(maxAnio);
    } else {
      actualidadTexto = `${minAnio}–${maxAnio}`;
    }
  } else if (totalFeatures > 0) {
    actualidadTexto = '2024–2026';
  }
  if (elIcvActualidad) {
    elIcvActualidad.textContent = actualidadTexto;
    elIcvActualidad.style.color = 'var(--esmeralda)';
  }

  // 3. Atribución completa
  const pctAtribucion = totalCeldasAtributos > 0 ? (celdasAtributosLlenas / totalCeldasAtributos) * 100 : 0;
  const califAtribucion = pctAtribucion >= 85 ? 'Consistente' : (pctAtribucion >= 70 ? 'Aceptable' : 'Incompleto');
  if (elIcvAtribucion) {
    elIcvAtribucion.textContent = `${pctAtribucion.toFixed(1)}% (${califAtribucion})`;
    elIcvAtribucion.style.color = pctAtribucion >= 80 ? 'var(--ocre)' : (pctAtribucion >= 65 ? '#f59e0b' : '#ef4444');
  }

  // 4. Calidad estimada global
  const scoreGlobal = (pctEspacial * 0.5) + (pctAtribucion * 0.5);
  const califGlobal = scoreGlobal >= 90 ? 'Excelente' : (scoreGlobal >= 80 ? 'Bueno' : (scoreGlobal >= 70 ? 'Aceptable' : 'Bajo'));
  if (elIcvGlobal) {
    elIcvGlobal.textContent = `${scoreGlobal.toFixed(1)}% (${califGlobal})`;
    elIcvGlobal.style.color = scoreGlobal >= 85 ? '#38bdf8' : (scoreGlobal >= 70 ? '#facc15' : '#f87171');
  }

  // 5. Nota explicativa
  if (elIcvNota) {
    elIcvNota.textContent = `Calculado en tiempo real sobre ${totalFeatures.toLocaleString('es-CL')} entidades de ${totalActivas} capa(s) activa(s).`;
  }

  // Poblar contenedor resumen de capas activas en la pestaña si existe
  if (!contenedorResumen) return;
  contenedorResumen.innerHTML = '';

  activasVGI.forEach(cId => {
    const card = document.createElement('div');
    card.className = 'tarjeta-capa-gis vgi activo';
    card.innerHTML = `
      <div class="tarjeta-capa-header">
        <span class="pill-institucion vgi">OSM / VGI</span>
        <span class="pill-geometria">EN MAPA</span>
      </div>
      <div class="tarjeta-capa-cuerpo">
        <h4 class="tarjeta-capa-titulo">${cId.toUpperCase()}</h4>
        <p class="tarjeta-capa-desc">Capa colaborativa activa en el visor.</p>
      </div>
      <div class="tarjeta-capa-footer">
        <button type="button" class="btn-gis-accion" style="padding:4px 8px; font-size:0.75rem;">✕ Remover del Mapa</button>
      </div>
    `;
    card.querySelector('button').addEventListener('click', () => {
      const btn = document.getElementById(`btn-cat-${cId}`);
      if (btn) btn.click();
    });
    contenedorResumen.appendChild(card);
  });

  activasOficiales.forEach(cId => {
    const def = window.ModuloIDEChile ? window.ModuloIDEChile.obtenerDefinicion(cId) : null;
    const card = document.createElement('div');
    card.className = 'tarjeta-capa-gis oficial activo';
    const sigla = def ? obtenerSiglaInstitucion(def.institucion) : 'ESTADO';
    card.innerHTML = `
      <div class="tarjeta-capa-header">
        <span class="pill-institucion oficial">${sigla}</span>
        <span class="pill-geometria">EN MAPA</span>
      </div>
      <div class="tarjeta-capa-cuerpo">
        <h4 class="tarjeta-capa-titulo">${def ? def.nombre : cId}</h4>
        <p class="tarjeta-capa-desc">${def ? def.descripcion : 'Capa oficial del Estado de Chile'}</p>
      </div>
      <div class="tarjeta-capa-footer">
        <button type="button" class="btn-gis-accion" style="padding:4px 8px; font-size:0.75rem;">✕ Remover del Mapa</button>
      </div>
    `;
    card.querySelector('button').addEventListener('click', () => {
      const btn = document.getElementById(`btn-oficial-${cId}`);
      if (btn) btn.click();
    });
    contenedorResumen.appendChild(card);
  });

  importadasActivas.forEach(capa => {
    const card = document.createElement('div');
    card.className = 'tarjeta-capa-gis activo';
    card.innerHTML = `
      <div class="tarjeta-capa-header">
        <span class="pill-institucion" style="background:#0284c7; color:#fff;">IMPORTADA</span>
        <span class="pill-geometria">EN MAPA</span>
      </div>
      <div class="tarjeta-capa-cuerpo">
        <h4 class="tarjeta-capa-titulo">${capa.nombre || capa.id}</h4>
        <p class="tarjeta-capa-desc">Capa importada localmente por el usuario.</p>
      </div>
      <div class="tarjeta-capa-footer">
        <button type="button" class="btn-gis-accion" style="padding:4px 8px; font-size:0.75rem;">✕ Remover del Mapa</button>
      </div>
    `;
    card.querySelector('button').addEventListener('click', () => {
      if (window.ModuloMapa) ModuloMapa.removerCapa(capa.id);
      if (window.ModuloImportadorCapas) ModuloImportadorCapas.removerCapa(capa.id);
      actualizarTelemetriaCapasActivas();
    });
    contenedorResumen.appendChild(card);
  });
}

function inicializarControlesConsolaGIS() {
  // 1. Buscador en vivo
  const inputBusqueda = document.getElementById('busqueda-capas-atlas');
  const btnLimpiar = document.getElementById('btn-limpiar-busqueda-capas');

  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', () => {
      const q = inputBusqueda.value.trim().toLowerCase();
      if (btnLimpiar) btnLimpiar.style.display = q.length > 0 ? 'block' : 'none';

      const todasTarjetas = document.querySelectorAll('.tarjeta-capa-gis:not(.tarjeta-activa-resumen)');
      todasTarjetas.forEach(card => {
        if (!q) {
          card.style.display = '';
          return;
        }
        const nombre = card.dataset.nombre || '';
        const institucion = card.dataset.institucion || '';
        const desc = card.dataset.desc || '';
        const codigo = card.dataset.codigo || '';
        const id = card.dataset.id || '';

        const coincide = nombre.includes(q) || institucion.includes(q) || desc.includes(q) || codigo.includes(q) || id.includes(q);
        card.style.display = coincide ? '' : 'none';

        if (coincide) {
          const detailsParent = card.closest('details');
          if (detailsParent) detailsParent.open = true;
        }
      });
    });

    if (btnLimpiar) {
      btnLimpiar.addEventListener('click', () => {
        inputBusqueda.value = '';
        inputBusqueda.dispatchEvent(new Event('input'));
        inputBusqueda.focus();
      });
    }
  }

  // 2. Chips de filtro temático
  const chips = document.querySelectorAll('#contenedor-chips-filtro .chip-filtro');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('activo'));
      chip.classList.add('activo');
      const filtro = chip.dataset.filtro;

      const pestanaOficial = document.querySelector('.pestana-capas[data-seccion="seccion-capas-oficiales"]');
      const pestanaVGI = document.querySelector('.pestana-capas[data-seccion="seccion-capas-vgi"]');

      if (filtro === 'vgi') {
        if (pestanaVGI) pestanaVGI.click();
        return;
      } else {
        if (pestanaOficial) pestanaOficial.click();
      }

      const acordes = document.querySelectorAll('.acordeon-grupo-oficial');
      acordes.forEach(ac => {
        if (filtro === 'todos') {
          ac.style.display = '';
        } else if (filtro === 'movilidad' && ac.dataset.grupoId === 'movilidad_transporte') {
          ac.style.display = '';
          ac.open = true;
        } else if (filtro === 'normativa' && ac.dataset.grupoId === 'normativa_ipt') {
          ac.style.display = '';
          ac.open = true;
        } else if (filtro === 'demografia' && ac.dataset.grupoId === 'social_demografia') {
          ac.style.display = '';
          ac.open = true;
        } else if (filtro === 'economia' && ac.dataset.grupoId === 'economia_inversion') {
          ac.style.display = '';
          ac.open = true;
        } else if (filtro === 'equipamiento' && ac.dataset.grupoId === 'equipamiento_patrimonio') {
          ac.style.display = '';
          ac.open = true;
        } else if (filtro === 'medio_ambiente' && ac.dataset.grupoId === 'medio_ambiente') {
          ac.style.display = '';
          ac.open = true;
        } else if (filtro === 'seguridad' && ac.dataset.grupoId === 'seguridad_justicia') {
          ac.style.display = '';
          ac.open = true;
        } else {
          ac.style.display = 'none';
        }
      });
    });
  });

  // 3. Navegación por pestañas
  const pestanas = document.querySelectorAll('.consola-pestanas-nav .pestana-capas');
  pestanas.forEach(p => {
    p.addEventListener('click', () => {
      pestanas.forEach(x => x.classList.remove('activa'));
      p.classList.add('activa');
      const targetSecId = p.dataset.seccion;

      const secciones = ['seccion-capas-oficiales', 'seccion-capas-vgi', 'seccion-capas-activas'];
      secciones.forEach(sId => {
        const secEl = document.getElementById(sId);
        if (secEl) {
          secEl.style.display = sId === targetSecId ? 'block' : 'none';
        }
      });
    });
  });

  // 4. Botón desactivar todas las capas
  const btnDesactivarTodas = document.getElementById('btn-desactivar-todas-capas');
  if (btnDesactivarTodas) {
    btnDesactivarTodas.addEventListener('click', () => {
      // Desactivar VGI
      Object.keys(capasCargadasPorCategoria).forEach(cId => {
        const btn = document.getElementById(`btn-cat-${cId}`);
        if (btn) btn.click();
      });
      // Desactivar Oficiales
      Object.keys(capasOficialesCargadas).forEach(cId => {
        const btn = document.getElementById(`btn-oficial-${cId}`);
        if (btn) btn.click();
      });
    });
  }
}

function configurarCapasOficialesIDE() {
  const contenedor = document.getElementById('contenedor-botones-oficiales-ide');
  if (!contenedor || !window.ModuloIDEChile) return;

  const todasCapas = window.ModuloIDEChile.obtenerCapasDisponibles();
  const kpiTotalEl = document.getElementById('kpi-total-capas');
  if (kpiTotalEl) kpiTotalEl.textContent = String(todasCapas.length + 10);
  const badgeOficialEl = document.querySelector('.pestana-capas[data-seccion="seccion-capas-oficiales"] .badge-tab-conteo');
  if (badgeOficialEl) badgeOficialEl.textContent = String(todasCapas.length);
  const capasMap = {};
  todasCapas.forEach(c => { capasMap[c.id] = c; });

  const GRUPOS_OFICIALES = [
    {
      id: 'normativa_ipt',
      nombre: 'Normativa Urbanística & Catastro Predial (MINVU IPT / DPA / SII)',
      filtroGrupo: (c) => c.grupo === 'normativa_ipt'
    },
    {
      id: 'movilidad_transporte',
      nombre: 'Movilidad, Red Vial, Tránsito & Cruces Semaforizados (MTT / UOCT / MOP / EFE / Metro)',
      filtroGrupo: (c) => c.grupo === 'movilidad_transporte'
    },
    {
      id: 'social_demografia',
      nombre: 'Demografía, Censo 2024, Comunidades & Vulnerabilidad Social (INE / MDS / MINVU)',
      filtroGrupo: (c) => c.grupo === 'social_demografia'
    },
    {
      id: 'economia_inversion',
      nombre: 'Economía, Fomento, Empleo & Inversión Pública (BIP / MOP / ODEPA / Energía RM)',
      filtroGrupo: (c) => c.grupo === 'economia_inversion'
    },
    {
      id: 'equipamiento_patrimonio',
      nombre: 'Equipamiento Público, Educación, Salud & Patrimonio (CMN / MINEDUC / MINSAL / IND)',
      filtroGrupo: (c) => c.grupo === 'equipamiento_patrimonio'
    },
    {
      id: 'medio_ambiente',
      nombre: 'Medio Ambiente, Residuos Sólidos (SUBDERE 2024), Recursos Hídricos & Parques (MMA / DGA / CONAF / DMC)',
      filtroGrupo: (c) => c.grupo === 'medio_ambiente'
    },
    {
      id: 'seguridad_justicia',
      nombre: 'Seguridad, Bomberos & Justicia (Carabineros / CBS / MINJU)',
      filtroGrupo: (c) => c.grupo === 'seguridad_justicia'
    }
  ];

  contenedor.innerHTML = '';
  const capasProcesadas = new Set();

  // Render collapsible modern accordions for each macro group
  GRUPOS_OFICIALES.forEach((grp, idx) => {
    const capasEnGrupo = todasCapas.filter(c => !capasProcesadas.has(c.id) && grp.filtroGrupo(c));
    if (capasEnGrupo.length === 0) return;
    capasEnGrupo.forEach(c => capasProcesadas.add(c.id));

    const details = document.createElement('details');
    details.className = 'acordeon-grupo-oficial';
    details.dataset.grupoId = grp.id;
    if (idx < 2) details.open = true; // Open first 2 groups by default

    const summary = document.createElement('summary');
    summary.className = 'cabecera-acordeon-oficial';
    summary.innerHTML = `
      <div class="cabecera-acordeon-contenido">
        <span class="titulo-acordeon-oficial">${grp.nombre}</span>
        <div class="meta-acordeon-oficial">
          <span class="badge-acordeon-conteo">${capasEnGrupo.length} CAPAS</span>
          <span class="flecha-acordeon-oficial">▾</span>
        </div>
      </div>
    `;
    details.appendChild(summary);

    const grillaCapas = document.createElement('div');
    grillaCapas.className = 'grilla-capas-acordeon';

    capasEnGrupo.forEach(def => {
      const card = document.createElement('div');
      card.className = 'tarjeta-capa-gis oficial';
      card.id = `card-oficial-${def.id}`;
      card.dataset.id = def.id;
      card.dataset.nombre = def.nombre.toLowerCase();
      card.dataset.institucion = (def.institucion || '').toLowerCase();
      card.dataset.desc = (def.descripcion || '').toLowerCase();
      card.dataset.tipo = 'oficial';
      card.dataset.grupo = grp.id;

      const sigla = obtenerSiglaInstitucion(def.institucion);
      const claseSigla = sigla.toLowerCase().replace(/[^a-z0-9]/g, '');
      const tipoGeom = obtenerTipoGeometria(def);
      const archDescarga = def.archivoLocal || `data/${def.id}.geojson`;
      const nombreArchDescarga = archDescarga.split('/').pop();

      card.innerHTML = `
        <div class="tarjeta-capa-header">
          <div class="tarjeta-capa-tag-grupo">
            <span class="pill-institucion oficial ${claseSigla}" title="${def.institucion}">${sigla}</span>
            <span class="pill-codigo">${def.num_bbdd ? `BBDD-${String(def.num_bbdd).padStart(2,'0')}` : def.id.toUpperCase().slice(0, 14)}</span>
          </div>
          <span class="pill-geometria">${tipoGeom}</span>
        </div>
        <div class="tarjeta-capa-cuerpo">
          <h4 class="tarjeta-capa-titulo">${def.nombre}</h4>
          <p class="tarjeta-capa-desc">${def.descripcion || ''}</p>
        </div>
        <div class="tarjeta-capa-footer">
          <button type="button" class="btn-toggle-capa btn-categoria-oficial" id="btn-oficial-${def.id}" data-capa="${def.id}" title="Alternar capa en el mapa">
            <span class="indicador-switch"></span>
            <span class="texto-switch">Activar</span>
          </button>
          <div class="tarjeta-capa-acciones">
            <span class="conteo-entidades-gis badge-conteo-oficial" id="conteo-oficial-${def.id}">—</span>
            <a href="${archDescarga}" download="${nombreArchDescarga}" data-id-capa="${def.id}" class="btn-accion-descarga-gis" title="Descargar archivo GeoJSON oficial con perfil de metadatos (${nombreArchDescarga})" onclick="event.stopPropagation();">
              GeoJSON
            </a>
          </div>
        </div>
      `;

      const btnToggle = card.querySelector(`#btn-oficial-${def.id}`);
      btnToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        alternarCapaOficialIDE(def.id, btnToggle);
      });
      card.addEventListener('click', () => {
        alternarCapaOficialIDE(def.id, btnToggle);
      });

      grillaCapas.appendChild(card);
    });

    details.appendChild(grillaCapas);
    contenedor.appendChild(details);
  });

  // WMS Patrimonio MINVU button
  const btnWMS = document.createElement('button');
  btnWMS.type = 'button';
  btnWMS.className = 'btn-categoria-oficial btn-wms-oficial';
  btnWMS.id = 'btn-oficial-wms-patrimonio';
  btnWMS.style.marginTop = '14px';
  btnWMS.dataset.wms = 'minvu_patrimonio';
  btnWMS.title = 'Superponer la capa oficial de teselas WMS GetMap de Patrimonio MINVU (OGC WMS 1.3.0)';
  btnWMS.innerHTML = `
    <span class="icono-cat">🗺️</span>
    <div class="info-cat">
      <strong>MINVU WMS Patrimonio en Vivo</strong>
      <small>Servicio OGC GetMap en vivo</small>
    </div>
    <span class="badge-conteo-oficial" style="background:#8F3A2C; color:#FFF;">WMS</span>
  `;
  btnWMS.addEventListener('click', () => alternarCapaWMSOficial('minvu_patrimonio', btnWMS));
  contenedor.appendChild(btnWMS);

  // Inicializar controles de la consola GIS
  inicializarControlesConsolaGIS();
  actualizarTelemetriaCapasActivas();

  // Poblar subpanel rápido de capas en la barra lateral
  const contSidebar = document.getElementById('sidebar-lista-ide-rapida');
  if (contSidebar) {
    contSidebar.innerHTML = '';
    todasCapas.slice(0, 24).forEach(def => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:7px 10px; background:var(--papel-tarjeta); border:1px solid var(--linea-tarjeta); border-radius:6px; font-size:0.78rem; cursor:pointer; transition:all 0.2s ease;';
      item.innerHTML = `
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px; color:#ffffff;" title="${def.nombre}">${def.icono} ${def.nombre}</span>
        <span style="font-size:0.68rem; background:rgba(6,182,212,0.15); border:1px solid var(--musgo); color:var(--musgo); padding:2px 6px; border-radius:4px; font-weight:700;">TOGGLE</span>
      `;
      item.addEventListener('mouseenter', () => { item.style.borderColor = 'var(--musgo)'; item.style.background = 'var(--papel-hover)'; });
      item.addEventListener('mouseleave', () => { item.style.borderColor = 'var(--linea-tarjeta)'; item.style.background = 'var(--papel-tarjeta)'; });
      item.addEventListener('click', () => {
        const btnMain = document.getElementById(`btn-oficial-${def.id}`);
        if (btnMain) {
          // Abrir el acordeón contenedor si está cerrado
          const detailsParent = btnMain.closest('details');
          if (detailsParent) detailsParent.open = true;
          btnMain.scrollIntoView({ behavior: 'smooth', block: 'center' });
          btnMain.click();
        } else {
          alternarCapaOficialIDE(def.id, item);
        }
      });
      contSidebar.appendChild(item);
    });
  }

  document.getElementById('btn-descargar-todo-ide')?.addEventListener('click', descargarColeccionOficialCompleta);
  document.getElementById('btn-descargar-bd-mapa')?.addEventListener('click', descargarColeccionOficialCompleta);
  document.getElementById('btn-cerrar-modal-bd')?.addEventListener('click', cerrarModalDescargaBaseDatos);
  document.getElementById('btn-cerrar-modal-bd-pie')?.addEventListener('click', cerrarModalDescargaBaseDatos);
  document.getElementById('modal-descarga-bd-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-descarga-bd-overlay') cerrarModalDescargaBaseDatos();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModalDescargaBaseDatos();
  });
  inicializarInspectorNormativo();
}

function inicializarInspectorNormativo() {
  const btnInspector = document.getElementById('btn-inspector-normativo');
  const contInspector = document.getElementById('contenedor-inspector-normativo');
  if (!btnInspector || !contInspector) return;

  btnInspector.addEventListener('click', () => {
    modoInspectorNormativoActivo = !modoInspectorNormativoActivo;
    btnInspector.classList.toggle('activo', modoInspectorNormativoActivo);

    if (modoInspectorNormativoActivo) {
      contInspector.style.display = 'block';
      contInspector.innerHTML = `
        <div class="ficha-normativa-hud">
          <div class="ficha-normativa-header">
            <span class="badge-alerta-normativa seguro">⚖️ MODO INSPECTOR NORMATIVO ACTIVO</span>
            <span class="ficha-normativa-id">Haz clic en cualquier punto del mapa para auditar zonificación y riesgos</span>
          </div>
          <p style="font-size:0.8rem; margin:8px 0; color:var(--tinta-suave);">El inspector analizará automáticamente la zonificación PRC Santiago (usos permitidos UPERM / prohibidos UPROH), límite urbano oficial, áreas de riesgo (Art. 2.1.17 OGUC), áreas verdes normadas y afectación patrimonial.</p>
        </div>
      `;
    } else {
      contInspector.style.display = 'none';
      contInspector.innerHTML = '';
    }
  });

  const mapa = ModuloMapa.obtenerInstanciaMapa && ModuloMapa.obtenerInstanciaMapa();
  if (mapa) {
    mapa.on('click', async (e) => {
      if (!modoInspectorNormativoActivo) return;
      ejecutarConsultaInspector(e.latlng.lat, e.latlng.lng);
    });
  }
}

async function ejecutarConsultaInspector(lat, lng) {
  const contInspector = document.getElementById('contenedor-inspector-normativo');
  if (!contInspector || !window.ModuloEvaluadorNormativo) return;

  contInspector.style.display = 'block';
  contInspector.innerHTML = `<div class="ficha-normativa-hud" style="text-align:center; padding:18px;">⏳ Auditando normativa urbanística para lat: ${lat.toFixed(5)}, lng: ${lng.toFixed(5)}...</div>`;

  const capasRequeridas = [
    'minvu_ipt_prc_santiago',
    'minvu_ipt_prms_usosuelo',
    'minvu_ipt_limite_urbano',
    'minvu_ipt_areas_riesgo',
    'ide_minvu_ipt_prms_riesgo',
    'minvu_ipt_areas_verdes',
    'minvu_patrimonio',
    'bbdd_66',
    'censo2024_manzanas',
    'ine_permisos_edificacion_santiago',
    'ine_crf_conjuntos_santiago',
    'ide_minvu_campamentos',
    'ide_minvu_inventario_humedales'
  ];

  await Promise.all(capasRequeridas.map(async (cId) => {
    if (!capasOficialesCargadas[cId] && window.ModuloIDEChile) {
      try {
        const res = await ModuloIDEChile.consultarCapaOficial(cId);
        if (res && res.geojson) {
          capasOficialesCargadas[cId] = res.geojson;
        }
      } catch (_) {}
    }
  }));

  const todasLasCapas = {
    ...capasCargadasPorCategoria,
    ...capasOficialesCargadas
  };

  const resultado = ModuloEvaluadorNormativo.consultarPuntoNormativo(lat, lng, todasLasCapas);
  contInspector.innerHTML = ModuloEvaluadorNormativo.renderizarFichaNormativaHTML(resultado);

  document.getElementById('btn-cerrar-ficha-normativa')?.addEventListener('click', () => {
    contInspector.style.display = 'none';
  });

  document.getElementById('btn-descargar-cin-txt')?.addEventListener('click', () => {
    const texto = ModuloEvaluadorNormativo.generarCertificadoTexto(resultado);
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificado-Informaciones-Normativas-VGI-${lat.toFixed(4)}_${lng.toFixed(4)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function abrirModalDescargaBaseDatos() {
  const overlay = document.getElementById('modal-descarga-bd-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
  }
}

function cerrarModalDescargaBaseDatos() {
  const overlay = document.getElementById('modal-descarga-bd-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
  }
}

async function descargarColeccionOficialCompleta() {
  const btn = document.getElementById('btn-descargar-todo-ide');
  const textoOriginal = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '⏳ Descargando Base de Datos...';
    btn.disabled = true;
  }

  const estadoTexto = document.getElementById('estado-carga-capas-oficiales');
  if (estadoTexto) {
    estadoTexto.innerHTML = `
      <span style="color:var(--esmeralda,#10b981); font-weight:700;">📦 [INICIANDO DESCARGA]:</span> 
      Descargando la base de datos completa del Atlas VGI en archivo comprimido (<code>docs/geodatabase_completa_atlas_vgi.zip</code>, 542,35 MB). 
      Incluye las 134 capas del visor (10 macrocategorías VGI + 124 capas oficiales), extractos regionales de Geofabrik RM, los 3 libros maestros Excel (.xlsx), 4 datasets CSV, esquemas SQL PostGIS y metadatos ISO (257 archivos totales en 7 subcarpetas, ~3,33 GB descomprimido).
    `;
  }

  try {
    const rutaZip = 'docs/geodatabase_completa_atlas_vgi.zip?v=' + Date.now();
    const a = document.createElement('a');
    a.href = rutaZip;
    a.download = 'geodatabase_completa_atlas_vgi.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    console.log('[+] Descarga de Base de Datos Completa (.zip) iniciada exitosamente desde:', rutaZip);

    // Abrir modal con desglose completo y opciones
    abrirModalDescargaBaseDatos();

    if (estadoTexto) {
      estadoTexto.innerHTML = `
        <span style="color:var(--esmeralda,#10b981); font-weight:700;">✅ [DESCARGA INICIADA]:</span> 
        Archivo <code>docs/geodatabase_completa_atlas_vgi.zip</code> (542,35 MB en red / ~3,33 GB descomprimido) descargándose en el equipo. 
        Contiene 7 subcarpetas estructuradas (257 archivos totales): <strong>01_vgi_comunitario_osm/</strong>, <strong>02_ide_chile_ministerios/</strong>, <strong>03_censo_2024_ine/</strong>, <strong>04_observatorio_urbano_stgo/</strong>, <strong>05_medioambiente_residuos_subdere/</strong>, <strong>06_transporte_y_telecomunicaciones/</strong> y <strong>07_metadatos_y_gobernanza/</strong>.
      `;
    }
  } catch (err) {
    console.error('[-] Error al iniciar descarga de base de datos:', err);
    if (estadoTexto) {
      estadoTexto.innerHTML = `<span style="color:#ef4444; font-weight:700;">❌ [ERROR]:</span> No se pudo iniciar la descarga automática. <a href="docs/geodatabase_completa_atlas_vgi.zip?v=20261026_v13" download="geodatabase_completa_atlas_vgi.zip" style="color:var(--musgo); text-decoration:underline;">Haz clic aquí para descarga manual</a>.`;
    }
  } finally {
    setTimeout(() => {
      if (btn) {
        btn.innerHTML = textoOriginal || '📦 Descargar Colección Completa (.zip)';
        btn.disabled = false;
      }
    }, 2000);
  }
}

async function alternarCapaOficialIDE(idCapa, btn) {
  const card = document.getElementById(`card-oficial-${idCapa}`);
  const estadoTexto = document.getElementById('estado-carga-capas-oficiales');
  const badgeConteo = document.getElementById(`conteo-oficial-${idCapa}`) || (btn ? btn.querySelector('.badge-conteo-oficial') : null);
  const textoSwitch = btn ? btn.querySelector('.texto-switch') : null;
  const bbox = null; // Cargar la capa ÍNTEGRA sin limitar por el BBox barrial

  // Desactivar si ya está activa
  if (btn && btn.classList.contains('activo')) {
    if (window.ModuloMapa) ModuloMapa.removerCapa(idCapa);
    delete capasOficialesCargadas[idCapa];
    btn.classList.remove('activo');
    if (card) card.classList.remove('activo');
    if (textoSwitch) textoSwitch.textContent = 'Activar';
    if (badgeConteo) badgeConteo.textContent = '—';
    if (estadoTexto) estadoTexto.textContent = `Capa oficial "${idCapa}" desactivada.`;
    actualizarTelemetriaCapasActivas();
    return;
  }

  // Activar y cargar datos
  if (btn) btn.classList.add('cargando');
  if (card) card.classList.add('cargando');
  if (estadoTexto) estadoTexto.textContent = `Cargando conjunto cartográfico oficial íntegro de la Región Metropolitana…`;

  try {
    const res = await ModuloIDEChile.consultarCapaOficial(idCapa, null);
    const def = res.def;

    if (window.ModuloMapa) {
      ModuloMapa.cargarCapaGeoJSON(idCapa, res.geojson, {
        id: def.id,
        nombre: def.nombre,
        color: def.color,
        icono: def.icono,
        archivoLocal: def.archivoLocal
      });
    }

    capasOficialesCargadas[idCapa] = res.geojson;
    if (btn) {
      btn.classList.remove('cargando');
      btn.classList.add('activo');
    }
    if (card) {
      card.classList.remove('cargando');
      card.classList.add('activo');
    }
    if (textoSwitch) textoSwitch.textContent = 'En Mapa';
    if (badgeConteo) badgeConteo.textContent = `${res.cantidad} ent.`;

    if (estadoTexto) {
      estadoTexto.innerHTML = `
        <span style="color:#06b6d4; font-weight:700;">[OFICIAL ESTADO DE CHILE]:</span> 
        Capa <strong>${def.nombre}</strong> cargada (${res.cantidad} entidades). 
        <em>${res.fuenteUsada}</em>. 
        <span style="color:var(--tinta-suave); display:block; font-size:0.75rem; margin-top:2px;">${def.declaracion}</span>
      `;
    }
    actualizarTelemetriaCapasActivas();
  } catch (err) {
    if (btn) btn.classList.remove('cargando');
    if (card) card.classList.remove('cargando');
    console.error(`Error al cargar capa oficial ${idCapa}:`, err);
    if (estadoTexto) estadoTexto.textContent = `Error al consultar servicio oficial: ${err.message}`;
  }
}

function alternarCapaWMSOficial(idCapa, btn) {
  const estadoTexto = document.getElementById('estado-carga-capas-oficiales');
  if (!window.ModuloIDEChile || !window.ModuloMapa) return;

  const wmsLayer = ModuloIDEChile.crearCapaWMSLeaflet(idCapa);
  if (!wmsLayer) return;

  const activa = ModuloMapa.alternarCapaWMS(idCapa, wmsLayer);
  btn.classList.toggle('activo', activa);

  if (activa) {
    if (estadoTexto) {
      estadoTexto.innerHTML = `
        <span style="color:#8F3A2C; font-weight:600;">[WMS OGC EN VIVO]:</span> 
        Capa WMS GetMap de <strong>MINVU Patrimonio</strong> superpuesta en el visor 2D (OGC WMS 1.3.0).
      `;
    }
  } else {
    if (estadoTexto) estadoTexto.textContent = 'Capa WMS de Patrimonio desactivada.';
  }
}

/**
 * Módulo Controlador de Interfaz: Importador de Capas Espaciales Locales
 * Permite subir y visualizar .kmz, .kml, .geojson, .gpx y .csv en el visor y auditoría normativa.
 */
function configurarImportadorCapas() {
  const btnAbrir = document.getElementById('btn-abrir-importador');
  const seccionImportador = document.getElementById('seccion-importador-capas');
  const dropZone = document.getElementById('zona-drop-importacion');
  const fileInput = document.getElementById('input-archivo-capa');
  const contenedorCapas = document.getElementById('contenedor-capas-importadas');
  const grillaCapas = document.getElementById('grilla-capas-importadas');
  const contadorCapas = document.getElementById('contador-capas-importadas');
  const btnLimpiar = document.getElementById('btn-limpiar-capas-importadas');
  const estadoTexto = document.getElementById('estado-importacion-capas');

  if (!dropZone || !fileInput) return;

  // Botón de salto rápido en barra superior
  if (btnAbrir && seccionImportador) {
    btnAbrir.addEventListener('click', () => {
      seccionImportador.scrollIntoView({ behavior: 'smooth', block: 'center' });
      seccionImportador.style.transition = 'box-shadow 0.3s ease';
      seccionImportador.style.boxShadow = '0 0 16px rgba(122, 112, 69, 0.45)';
      setTimeout(() => {
        seccionImportador.style.boxShadow = 'none';
      }, 1500);
    });
  }

  // Clic en la dropzone para activar selector de archivos
  dropZone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
      fileInput.click();
    }
  });

  // Eventos de arrastrar y soltar (Drag & Drop)
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const archivos = e.dataTransfer.files;
    if (archivos && archivos.length > 0) {
      procesarListaArchivos(archivos);
    }
  });

  fileInput.addEventListener('change', (e) => {
    const archivos = e.target.files;
    if (archivos && archivos.length > 0) {
      procesarListaArchivos(archivos);
      fileInput.value = ''; // Reset para permitir subir el mismo archivo si fue editado
    }
  });

  // Botón para limpiar todas las capas importadas
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      if (!window.ModuloImportadorCapas) return;
      const todas = ModuloImportadorCapas.obtenerCapasImportadas();
      Object.keys(todas).forEach(idCapa => {
        ModuloMapa.removerCapa(idCapa);
        ModuloImportadorCapas.removerCapa(idCapa);
      });
      grillaCapas.innerHTML = '';
      if (contenedorCapas) contenedorCapas.style.display = 'none';
      if (contadorCapas) contadorCapas.textContent = '0';
      if (estadoTexto) estadoTexto.textContent = 'Todas las capas importadas han sido removidas de la sesión.';
      actualizarTelemetriaCapasActivas();
    });
  }

  async function procesarListaArchivos(archivos) {
    if (!window.ModuloImportadorCapas || !window.ModuloMapa) {
      alert('Los módulos del mapa e importador aún no están disponibles.');
      return;
    }

    if (estadoTexto) {
      estadoTexto.innerHTML = `<span style="color:#7A7045; font-weight:600;">⏳ Procesando ${archivos.length} archivo(s)...</span>`;
    }

    let procesadosExito = 0;
    let errores = [];

    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      try {
        const capa = await ModuloImportadorCapas.procesarArchivo(archivo);

        // Cargar en el visor Leaflet
        ModuloMapa.cargarCapaGeoJSON(capa.id, capa.geojson, {
          color: capa.color,
          icono: capa.icono,
          nombre: capa.nombre
        });

        // Encuadrar automáticamente hacia la capa importada
        const bbox = ModuloImportadorCapas.calcularBbox(capa.geojson);
        if (bbox) {
          const mapaInstancia = ModuloMapa.obtenerInstanciaMapa();
          if (mapaInstancia) {
            mapaInstancia.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]], { padding: [30, 30] });
          }
        }

        // Renderizar tarjeta en la grilla
        renderizarTarjetaCapaImportada(capa);
        procesadosExito++;
      } catch (err) {
        console.error(`Error al procesar archivo ${archivo.name}:`, err);
        errores.push(`${archivo.name}: ${err.message}`);
      }
    }

    // Actualizar contadores y visibilidad del contenedor
    const capasActuales = Object.keys(ModuloImportadorCapas.obtenerCapasImportadas()).length;
    if (contadorCapas) contadorCapas.textContent = String(capasActuales);
    if (contenedorCapas) contenedorCapas.style.display = capasActuales > 0 ? 'block' : 'none';
    actualizarTelemetriaCapasActivas();

    if (estadoTexto) {
      if (errores.length === 0) {
        estadoTexto.innerHTML = `
          <span style="color:#10B981; font-weight:600;">✓ ¡Éxito!</span> 
          Se importaron ${procesadosExito} capa(s) correctamente y se desplegaron en el mapa interactivo.
        `;
      } else {
        estadoTexto.innerHTML = `
          <span style="color:#DC2626; font-weight:600;">⚠️ Importación completada con observaciones:</span> 
          ${procesadosExito} procesadas. Errores: ${errores.join(' | ')}
        `;
      }
    }
  }

  function renderizarTarjetaCapaImportada(capa) {
    if (!grillaCapas) return;

    // Si ya existe tarjeta previa con el mismo ID, removerla
    const tarjetaPrevia = document.getElementById(`tarjeta-capa-${capa.id}`);
    if (tarjetaPrevia) tarjetaPrevia.remove();

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-capa-importada';
    tarjeta.id = `tarjeta-capa-${capa.id}`;
    tarjeta.style.borderLeftColor = capa.color;

    tarjeta.innerHTML = `
      <div class="tarjeta-capa-cabecera">
        <div class="tarjeta-capa-titulo">
          ${capa.icono} ${capa.nombre}
        </div>
        <span class="badge-formato-capa">${capa.formato}</span>
      </div>
      <div class="tarjeta-capa-meta">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${capa.color}; vertical-align:middle;"></span>
        <span>${capa.cantidad.toLocaleString('es-CL')} entidades</span>
        <span>•</span>
        <span>${capa.archivoOriginal}</span>
      </div>
      <div class="tarjeta-capa-acciones">
        <button type="button" class="btn-accion-capa btn-toggle-capa" title="Mostrar u ocultar la capa en el mapa">👁️ Ocultar</button>
        <button type="button" class="btn-accion-capa btn-encuadrar-capa" title="Centrar y encuadrar el visor en esta capa">🎯 Encuadrar</button>
        <button type="button" class="btn-accion-capa btn-auditar-capa" title="Auditar compatibilidad normativa con el PRC Santiago">⚖️ Auditar PRC</button>
        <button type="button" class="btn-accion-capa peligro btn-eliminar-capa" title="Eliminar capa de la sesión">🗑️ Eliminar</button>
      </div>
    `;

    // Evento Ocultar / Mostrar
    const btnToggle = tarjeta.querySelector('.btn-toggle-capa');
    btnToggle.addEventListener('click', () => {
      const activa = ModuloImportadorCapas.alternarCapa(capa.id);
      tarjeta.classList.toggle('inactiva', !activa);
      btnToggle.textContent = activa ? '👁️ Ocultar' : '👁️ Mostrar';

      if (activa) {
        ModuloMapa.cargarCapaGeoJSON(capa.id, capa.geojson, {
          color: capa.color,
          icono: capa.icono,
          nombre: capa.nombre
        });
      } else {
        ModuloMapa.removerCapa(capa.id);
      }
      actualizarTelemetriaCapasActivas();
    });

    // Evento Encuadrar
    const btnEncuadrar = tarjeta.querySelector('.btn-encuadrar-capa');
    btnEncuadrar.addEventListener('click', () => {
      const bbox = ModuloImportadorCapas.calcularBbox(capa.geojson);
      if (bbox) {
        const mapaInstancia = ModuloMapa.obtenerInstanciaMapa();
        if (mapaInstancia) {
          mapaInstancia.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]], { padding: [30, 30] });
        }
      }
    });

    // Evento Auditar Normativa
    const btnAuditar = tarjeta.querySelector('.btn-auditar-capa');
    btnAuditar.addEventListener('click', () => {
      if (!window.ModuloEvaluadorNormativo) {
        alert('El Módulo de Evaluación Normativa no está cargado.');
        return;
      }
      // Obtener la primera coordenada o centroide de la primera entidad
      const f0 = capa.geojson.features && capa.geojson.features[0];
      if (!f0 || !f0.geometry) {
        alert('La capa no posee geometrías evaluables.');
        return;
      }
      let latTarget = null;
      let lngTarget = null;
      const geom = f0.geometry;
      if (geom.type === 'Point') {
        lngTarget = geom.coordinates[0];
        latTarget = geom.coordinates[1];
      } else if (geom.type === 'LineString' || geom.type === 'MultiPoint') {
        lngTarget = geom.coordinates[0][0];
        latTarget = geom.coordinates[0][1];
      } else if (geom.type === 'Polygon') {
        lngTarget = geom.coordinates[0][0][0];
        latTarget = geom.coordinates[0][0][1];
      } else if (geom.type === 'MultiPolygon') {
        lngTarget = geom.coordinates[0][0][0][0];
        latTarget = geom.coordinates[0][0][0][1];
      }

      if (latTarget !== null && lngTarget !== null) {
        const inf = ModuloEvaluadorNormativo.consultarPuntoNormativo(latTarget, lngTarget);
        const contInspector = document.getElementById('contenedor-inspector-normativo');
        if (contInspector) {
          contInspector.innerHTML = ModuloEvaluadorNormativo.renderizarFichaNormativaHTML(inf);
          contInspector.style.display = 'block';
          contInspector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

          // Configurar botones de la ficha
          document.getElementById('btn-cerrar-ficha-normativa')?.addEventListener('click', () => {
            contInspector.style.display = 'none';
          });
          document.getElementById('btn-descargar-cin-txt')?.addEventListener('click', () => {
            const txt = ModuloEvaluadorNormativo.generarCertificadoTexto(inf);
            const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const codZona = (inf.prc && (inf.prc.codigo || inf.prc.zona)) ? (inf.prc.codigo || inf.prc.zona).replace(/\s+/g, '_') : 'SANTIAGO';
            a.download = `Certificado_Normativo_VGI_${codZona}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          });
        }
      } else {
        alert('No se pudieron extraer coordenadas representativas de la capa.');
      }
    });

    // Evento Eliminar
    const btnEliminar = tarjeta.querySelector('.btn-eliminar-capa');
    btnEliminar.addEventListener('click', () => {
      ModuloMapa.removerCapa(capa.id);
      ModuloImportadorCapas.removerCapa(capa.id);
      tarjeta.remove();

      const restantes = Object.keys(ModuloImportadorCapas.obtenerCapasImportadas()).length;
      if (contadorCapas) contadorCapas.textContent = String(restantes);
      if (contenedorCapas) contenedorCapas.style.display = restantes > 0 ? 'block' : 'none';
      if (estadoTexto) estadoTexto.textContent = `Capa "${capa.nombre}" eliminada.`;
      actualizarTelemetriaCapasActivas();
    });

    grillaCapas.prepend(tarjeta);
  }
}

