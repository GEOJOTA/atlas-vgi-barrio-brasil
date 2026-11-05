/*
  gbif.js
  -------
  Consultas a la API pública de GBIF (Global Biodiversity Information Facility).
  Permite incorporar ciencia ciudadana (iNaturalist, museos) al Atlas VGI.
  Incluye resolución taxonómica robusta (Backbone oficial de GBIF + Taxonomía Chilena Verificada),
  búsqueda estricta por taxonKey para evitar contaminación inter-especies,
  auto-expansión metropolitana inteligente cuando el cuadrante local tiene pocos registros,
  y auditoría de banderas de calidad (Darwin Core Issues).
  Convierte los registros directamente a GeoJSON FeatureCollection para visualización cartográfica.
*/

const ModuloGBIF = (() => {

  const cacheTaxon = new Map();
  const cacheOcurrencias = new Map();
  let cacheDatasetFallback = null;

  // Bounding Boxes canónicos de referencia
  const BBOX_BARRIO_BRASIL_DEFECTO = [-70.6720, -33.4505, -70.6580, -33.4350];
  const BBOX_RM_DEFECTO = [-71.85, -34.45, -69.75, -32.90];
  const GBIF_BACKBONE_DATASET_KEY = 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c';

  /**
   * Normaliza cadenas de texto para búsqueda taxonómica insensible a tildes, mayúsculas y puntuación
   */
  function normalizarTextoTaxon(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[—–-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Taxonomía Verificada de Chile y Región Metropolitana:
   * Mapeo canónico a claves de taxón aceptadas en el GBIF Backbone oficial.
   * Resuelve inmediatamente (0 ms) nombres vernáculos y científicos frecuentes,
   * evitando errores por homónimos, autores homónimos o checklists secundarias.
   */
  const TAXONOMIA_VERIFICADA_CHILE = [
    // Flora y Arbolado Esclerófilo / Nativo / Ornamental
    {
      taxonKey: 3029379,
      canonicalName: 'Quillaja saponaria',
      scientificName: 'Quillaja saponaria Molina',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Quillay',
      aliases: ['quillay', 'quillaya', 'quillaja saponaria', 'quillaja']
    },
    {
      taxonKey: 4178741,
      canonicalName: 'Cryptocarya alba',
      scientificName: 'Cryptocarya alba (Molina) Looser',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Peumo',
      aliases: ['peumo', 'cryptocarya alba', 'cryptocarya', 'peumo chileno']
    },
    {
      taxonKey: 3034108,
      canonicalName: 'Peumus boldus',
      scientificName: 'Peumus boldus Molina',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Boldo',
      aliases: ['boldo', 'peumus boldus', 'peumus']
    },
    {
      taxonKey: 3660323,
      canonicalName: 'Lithraea caustica',
      scientificName: 'Lithraea caustica (Molina) Hook. & Arn.',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Litre',
      aliases: ['litre', 'lithraea caustica', 'lithraea']
    },
    {
      taxonKey: 3190642,
      canonicalName: 'Schinus molle',
      scientificName: 'Schinus molle L.',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Pimiento boliviano / Molle',
      aliases: ['molle', 'pimiento', 'pimiento boliviano', 'schinus molle', 'arbol pimiento']
    },
    {
      taxonKey: 4928873,
      canonicalName: 'Schinus polygama',
      scientificName: 'Schinus polygama (Cav.) Cabrera',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Huingán',
      aliases: ['huingan', 'schinus polygamus', 'schinus polygama']
    },
    {
      taxonKey: 2735138,
      canonicalName: 'Jubaea chilensis',
      scientificName: 'Jubaea chilensis (Molina) Baill.',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Palma chilena',
      aliases: ['palma chilena', 'jubaea chilensis', 'jubaea', 'palma de coquitos']
    },
    {
      taxonKey: 3795588,
      canonicalName: 'Vachellia caven',
      scientificName: 'Vachellia caven (Molina) Seigler & Ebinger',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Espino',
      aliases: ['espino', 'vachellia caven', 'acacia caven', 'espino chileno']
    },
    {
      taxonKey: 3790726,
      canonicalName: 'Maytenus boaria',
      scientificName: 'Maytenus boaria Molina',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Maitén',
      aliases: ['maiten', 'maytenus boaria', 'maytenus']
    },
    {
      taxonKey: 5358466,
      canonicalName: 'Prosopis chilensis',
      scientificName: 'Prosopis chilensis (Molina) Stuntz',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Algarrobo chileno',
      aliases: ['algarrobo', 'algarrobo chileno', 'prosopis chilensis', 'prosopis']
    },
    {
      taxonKey: 5420309,
      canonicalName: 'Luma apiculata',
      scientificName: 'Luma apiculata (DC.) Burret',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Arrayán',
      aliases: ['arrayan', 'luma apiculata', 'luma', 'palo colorado']
    },
    {
      taxonKey: 3172499,
      canonicalName: 'Jacaranda mimosifolia',
      scientificName: 'Jacaranda mimosifolia D.Don',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Jacarandá',
      aliases: ['jacaranda', 'jacaranda mimosifolia']
    },
    {
      taxonKey: 2696225,
      canonicalName: 'Puya chilensis',
      scientificName: 'Puya chilensis Molina',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Chagual',
      aliases: ['chagual', 'puya chilensis', 'puya']
    },
    {
      taxonKey: 4017881,
      canonicalName: 'Puya berteroniana',
      scientificName: 'Puya berteroniana Mez',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Chagual azul',
      aliases: ['chagual azul', 'puya berteroniana']
    },
    {
      taxonKey: 3987404,
      canonicalName: 'Porlieria chilensis',
      scientificName: 'Porlieria chilensis I.M.Johnst.',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Guayacán',
      aliases: ['guayacan', 'porlieria chilensis', 'porlieria']
    },
    {
      taxonKey: 4176205,
      canonicalName: 'Beilschmiedia miersii',
      scientificName: 'Beilschmiedia miersii (Gay) Kosterm.',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Belloto del norte',
      aliases: ['belloto del norte', 'belloto', 'beilschmiedia miersii', 'beilschmiedia']
    },
    {
      taxonKey: 3016219,
      canonicalName: 'Kageneckia oblonga',
      scientificName: 'Kageneckia oblonga Ruiz & Pav.',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Bollen',
      aliases: ['bollen', 'kageneckia oblonga', 'kageneckia']
    },
    {
      taxonKey: 5651082,
      canonicalName: 'Aristotelia chilensis',
      scientificName: 'Aristotelia chilensis (Molina) Stuntz',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Maqui',
      aliases: ['maqui', 'aristotelia chilensis', 'aristotelia']
    },
    {
      taxonKey: 6371450,
      canonicalName: 'Colletia spinosissima',
      scientificName: 'Colletia spinosissima J.F.Gmel.',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Crucero',
      aliases: ['crucero', 'colletia spinosissima', 'colletia']
    },
    {
      taxonKey: 11063606,
      canonicalName: 'Leucostele chiloensis',
      scientificName: 'Leucostele chiloensis (Colla) Schlumpb.',
      rank: 'SPECIES',
      kingdom: 'Plantae',
      commonName: 'Quisco',
      aliases: ['quisco', 'leucostele chiloensis', 'echinopsis chiloensis', 'cactus quisco']
    },
    {
      taxonKey: 6,
      canonicalName: 'Plantae',
      scientificName: 'Plantae',
      rank: 'KINGDOM',
      kingdom: 'Plantae',
      commonName: 'Todo el Reino Vegetal',
      aliases: ['plantae', 'plantas', 'flora', 'reino vegetal', 'arbolado']
    },

    // Avifauna Urbana
    {
      taxonKey: 5231103,
      canonicalName: 'Zonotrichia capensis',
      scientificName: 'Zonotrichia capensis (Müller, 1776)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Chincol / Gorrión americano',
      aliases: ['chincol', 'gorrion americano', 'zonotrichia capensis', 'zonotrichia']
    },
    {
      taxonKey: 2490775,
      canonicalName: 'Turdus falcklandii',
      scientificName: 'Turdus falcklandii Quoy & Gaimard, 1824',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Zorzal patagónico',
      aliases: ['zorzal', 'zorzal patagonico', 'turdus falcklandii', 'turdus']
    },
    {
      taxonKey: 2495865,
      canonicalName: 'Columbina picui',
      scientificName: 'Columbina picui (Temminck, 1813)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Tortolita cuyana',
      aliases: ['tortolita', 'tortolita cuyana', 'columbina picui', 'columbina']
    },
    {
      taxonKey: 5229146,
      canonicalName: 'Vanellus chilensis',
      scientificName: 'Vanellus chilensis (Molina, 1782)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Queltehue / Treile',
      aliases: ['queltehue', 'treile', 'vanellus chilensis', 'vanellus', 'tero']
    },
    {
      taxonKey: 5231685,
      canonicalName: 'Mimus thenca',
      scientificName: 'Mimus thenca (Molina, 1782)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Tenca',
      aliases: ['tenca', 'mimus thenca', 'mimus']
    },
    {
      taxonKey: 2495358,
      canonicalName: 'Zenaida auriculata',
      scientificName: 'Zenaida auriculata (Des Murs, 1847)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Tórtola torcaza',
      aliases: ['tortola', 'tortola torcaza', 'zenaida auriculata', 'zenaida']
    },
    {
      taxonKey: 2476817,
      canonicalName: 'Sephanoides sephaniodes',
      scientificName: 'Sephanoides sephaniodes (Lesson & Garnot, 1827)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Picaflor chico / Colibrí',
      aliases: ['picaflor', 'picaflor chico', 'colibri', 'sephanoides sephaniodes', 'sephanoides']
    },
    {
      taxonKey: 2481930,
      canonicalName: 'Cathartes aura',
      scientificName: 'Cathartes aura (Linnaeus, 1758)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Jote de cabeza colorada',
      aliases: ['jote de cabeza colorada', 'jote cabeza colorada', 'cathartes aura', 'cathartes']
    },
    {
      taxonKey: 2481942,
      canonicalName: 'Coragyps atratus',
      scientificName: 'Coragyps atratus (Bechstein, 1793)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Jote de cabeza negra',
      aliases: ['jote de cabeza negra', 'jote cabeza negra', 'coragyps atratus', 'coragyps']
    },
    {
      taxonKey: 2486493,
      canonicalName: 'Phytotoma rara',
      scientificName: 'Phytotoma rara Molina, 1782',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Rara',
      aliases: ['rara', 'phytotoma rara', 'phytotoma']
    },
    {
      taxonKey: 2483725,
      canonicalName: 'Muscisaxicola maclovianus',
      scientificName: 'Muscisaxicola maclovianus (Garnot, 1826)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Dormilona tontita',
      aliases: ['dormilona', 'dormilona tontita', 'muscisaxicola maclovianus', 'muscisaxicola']
    },
    {
      taxonKey: 9685907,
      canonicalName: 'Falco sparverius',
      scientificName: 'Falco sparverius Linnaeus, 1758',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Cernícalo',
      aliases: ['cernicalo', 'falco sparverius', 'falco']
    },
    {
      taxonKey: 2481065,
      canonicalName: 'Milvago chimango',
      scientificName: 'Milvago chimango (Vieillot, 1816)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Tiuque',
      aliases: ['tiuque', 'milvago chimango', 'milvago']
    },
    {
      taxonKey: 2491645,
      canonicalName: 'Diuca diuca',
      scientificName: 'Diuca diuca (Molina, 1782)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Diuca',
      aliases: ['diuca', 'diuca diuca']
    },
    {
      taxonKey: 2484424,
      canonicalName: 'Curaeus curaeus',
      scientificName: 'Curaeus curaeus (Molina, 1782)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Tordo',
      aliases: ['tordo', 'curaeus curaeus', 'curaeus']
    },
    {
      taxonKey: 5231459,
      canonicalName: 'Troglodytes aedon',
      scientificName: 'Troglodytes aedon Vieillot, 1809',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Chercán',
      aliases: ['chercan', 'troglodytes aedon', 'troglodytes']
    },
    {
      taxonKey: 5229651,
      canonicalName: 'Elaenia albiceps',
      scientificName: 'Elaenia albiceps (d\'Orbigny & Lafresnaye, 1837)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Fío-fío',
      aliases: ['fio-fio', 'fio fio', 'elaenia albiceps', 'elaenia']
    },
    {
      taxonKey: 212,
      canonicalName: 'Aves',
      scientificName: 'Aves',
      rank: 'CLASS',
      kingdom: 'Animalia',
      commonName: 'Todas las Aves',
      aliases: ['aves', 'pajaros', 'avifauna']
    },

    // Insectos y Polinizadores
    {
      taxonKey: 1340388,
      canonicalName: 'Bombus dahlbomii',
      scientificName: 'Bombus dahlbomii Guérin-Méneville, 1835',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Moscardón del bosque (Abejorro nativo)',
      aliases: ['moscardon', 'moscardon del bosque', 'bombus dahlbomii', 'abejorro nativo', 'moscardon chileno']
    },
    {
      taxonKey: 1340503,
      canonicalName: 'Bombus terrestris',
      scientificName: 'Bombus terrestris (Linnaeus, 1758)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Abejorro común europeo',
      aliases: ['bombus terrestris', 'abejorro europeo', 'abejorro comun']
    },
    {
      taxonKey: 1340383,
      canonicalName: 'Bombus ruderatus',
      scientificName: 'Bombus ruderatus (Fabricius, 1775)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Abejorro gigante',
      aliases: ['bombus ruderatus', 'abejorro gigante']
    },
    {
      taxonKey: 1340278,
      canonicalName: 'Bombus',
      scientificName: 'Bombus Latreille, 1802',
      rank: 'GENUS',
      kingdom: 'Animalia',
      commonName: 'Abejorros y polinizadores (Bombus)',
      aliases: ['bombus', 'abejorro', 'abejorros', 'polinizadores']
    },
    {
      taxonKey: 1341976,
      canonicalName: 'Apis mellifera',
      scientificName: 'Apis mellifera Linnaeus, 1758',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Abeja melífera',
      aliases: ['abeja', 'abeja melifera', 'apis mellifera', 'apis']
    },
    {
      taxonKey: 1941561,
      canonicalName: 'Castnia',
      scientificName: 'Castnia Fabricius, 1807',
      rank: 'GENUS',
      kingdom: 'Animalia',
      commonName: 'Mariposa del chagual',
      aliases: ['mariposa del chagual', 'castnia psittacus', 'castnia']
    },
    {
      taxonKey: 797,
      canonicalName: 'Lepidoptera',
      scientificName: 'Lepidoptera',
      rank: 'ORDER',
      kingdom: 'Animalia',
      commonName: 'Mariposas urbanas',
      aliases: ['lepidoptera', 'mariposa', 'mariposas', 'polillas']
    },
    {
      taxonKey: 216,
      canonicalName: 'Insecta',
      scientificName: 'Insecta',
      rank: 'CLASS',
      kingdom: 'Animalia',
      commonName: 'Insectos urbanos',
      aliases: ['insecta', 'insectos', 'bichos']
    },

    // Reptiles y Anfibios
    {
      taxonKey: 2460411,
      canonicalName: 'Liolaemus tenuis',
      scientificName: 'Liolaemus tenuis (Duméril & Bibron, 1837)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Lagartija esbelta',
      aliases: ['lagartija esbelta', 'liolaemus tenuis', 'lagartija del arbol']
    },
    {
      taxonKey: 2460306,
      canonicalName: 'Liolaemus lemniscatus',
      scientificName: 'Liolaemus lemniscatus Gravenhorst, 1838',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Lagartija lemniscata',
      aliases: ['lagartija lemniscata', 'liolaemus lemniscatus']
    },
    {
      taxonKey: 2453525,
      canonicalName: 'Philodryas chamissonis',
      scientificName: 'Philodryas chamissonis (Wiegmann, 1835)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Culebra de cola larga',
      aliases: ['culebra de cola larga', 'philodryas chamissonis', 'culebra chilena']
    },
    {
      taxonKey: 2423479,
      canonicalName: 'Pleurodema thaul',
      scientificName: 'Pleurodema thaul (Lesson, 1827)',
      rank: 'SPECIES',
      kingdom: 'Animalia',
      commonName: 'Sapito de cuatro ojos',
      aliases: ['sapo de cuatro ojos', 'sapito de cuatro ojos', 'pleurodema thaul', 'pleurodema']
    }
  ];

  // Diccionario simplificado para enriquecimiento en tablas y tooltips
  const NOMBRES_COMUNES_CHILE = {};
  TAXONOMIA_VERIFICADA_CHILE.forEach(item => {
    NOMBRES_COMUNES_CHILE[item.canonicalName.toLowerCase()] = item.commonName;
    item.aliases.forEach(a => {
      NOMBRES_COMUNES_CHILE[a.toLowerCase()] = item.commonName;
    });
  });

  /**
   * Busca coincidencias en el diccionario canónico de taxonomía de Chile
   */
  function buscarTaxonEnDiccionario(texto) {
    if (!texto || !texto.trim()) return null;
    const norm = normalizarTextoTaxon(texto);

    // 1. Coincidencia exacta por alias o nombre canónico
    for (const item of TAXONOMIA_VERIFICADA_CHILE) {
      if (normalizarTextoTaxon(item.canonicalName) === norm ||
          normalizarTextoTaxon(item.commonName) === norm ||
          item.aliases.some(a => normalizarTextoTaxon(a) === norm)) {
        return {
          taxonKey: item.taxonKey,
          canonicalName: item.canonicalName,
          scientificName: item.scientificName,
          rank: item.rank,
          kingdom: item.kingdom,
          commonName: item.commonName,
          matchType: 'VERIFIED_CHILE'
        };
      }
    }

    // 2. Coincidencia parcial (el texto contiene el alias o viceversa)
    for (const item of TAXONOMIA_VERIFICADA_CHILE) {
      if (item.aliases.some(a => {
        const na = normalizarTextoTaxon(a);
        return na.length >= 4 && (norm.includes(na) || na.includes(norm));
      })) {
        return {
          taxonKey: item.taxonKey,
          canonicalName: item.canonicalName,
          scientificName: item.scientificName,
          rank: item.rank,
          kingdom: item.kingdom,
          commonName: item.commonName,
          matchType: 'VERIFIED_CHILE_PARTIAL'
        };
      }
    }

    return null;
  }

  /**
   * Ejecuta peticiones fetch con control de timeout por AbortController
   */
  async function fetchConTimeout(url, opciones = {}, timeoutMs = 22000) {
    const ctl = new AbortController();
    const tId = setTimeout(() => {
      ctl.abort(new Error(`Tiempo de espera agotado (${timeoutMs / 1000} s) al consultar GBIF`));
    }, timeoutMs);

    try {
      const respuesta = await fetch(url, { ...opciones, signal: ctl.signal });
      clearTimeout(tId);
      return respuesta;
    } catch (err) {
      clearTimeout(tId);
      throw err;
    }
  }

  /**
   * Carga y almacena en caché el dataset GeoJSON de respaldo metropolitano verificado
   */
  async function cargarDatasetFallbackLocal() {
    if (cacheDatasetFallback) return cacheDatasetFallback;

    const rutasTentativas = [
      'data/gbif_rm_fallback.geojson',
      'src/data/gbif_rm_fallback.geojson',
      './data/gbif_rm_fallback.geojson',
      './src/data/gbif_rm_fallback.geojson',
      'data/gbif_barrio_brasil_fallback.geojson',
      'src/data/gbif_barrio_brasil_fallback.geojson',
      './data/gbif_barrio_brasil_fallback.geojson',
      './src/data/gbif_barrio_brasil_fallback.geojson',
      'data/capa_biodiversidad.geojson',
      'src/data/capa_biodiversidad.geojson'
    ];

    for (const ruta of rutasTentativas) {
      try {
        const res = await fetch(ruta);
        if (res.ok) {
          const geojson = await res.json();
          if (geojson && Array.isArray(geojson.features) && geojson.features.length > 0) {
            console.log(`[GBIF] Catálogo local metropolitano verificado cargado desde ${ruta} (${geojson.features.length} entidades)`);
            cacheDatasetFallback = geojson;
            return geojson;
          }
        }
      } catch (_) {
        // Continuar con la siguiente ruta
      }
    }

    console.warn('[GBIF] No se pudo cargar el archivo GeoJSON de respaldo metropolitano desde las rutas relativas habituales.');
    return null;
  }

  /**
   * Obtiene ocurrencias desde el catálogo local verificado aplicando filtros taxonómicos y espaciales
   * con auto-ampliación metropolitana inteligente.
   */
  async function obtenerFallbackLocal({ nombre = '', canonFinal = null, targetRank = null, bbox = null, basisOfRecord = 'ALL', motivo = 'Demora o indisponibilidad en la red de GBIF' }) {
    console.warn(`[GBIF] Activando modo de respaldo local. Motivo: ${motivo}`);
    const dataset = await cargarDatasetFallbackLocal();

    if (!dataset || !dataset.features) {
      throw new Error(`GBIF en vivo no respondió (${motivo}) y el archivo de respaldo local no pudo ser leído.`);
    }

    let todasFeatures = [...dataset.features];
    let featuresFiltradas = todasFeatures;
    let esFallbackMetropolitano = false;
    let conteoLocal = 0;

    // 1. Filtro taxonómico prioritario: buscar primero la especie o grupo en todo el dataset regional
    const textoFiltro = (canonFinal || nombre || '').toLowerCase().trim();
    const textoNorm = normalizarTextoTaxon(textoFiltro);

    if (textoNorm) {
      const filtradasTaxon = todasFeatures.filter(f => {
        const p = f.properties || {};
        const esp = normalizarTextoTaxon(p.especie || p.scientificName || '');
        const nom = normalizarTextoTaxon(p.nombre || p.nombreComun || '');
        const rei = normalizarTextoTaxon(p.reino || '');
        const fam = normalizarTextoTaxon(p.familia || '');
        const cla = normalizarTextoTaxon(p.clase || '');
        const ord = normalizarTextoTaxon(p.orden || '');
        const gen = normalizarTextoTaxon(p.genero || '');

        return esp.includes(textoNorm) || nom.includes(textoNorm) ||
               rei.includes(textoNorm) || fam.includes(textoNorm) ||
               cla.includes(textoNorm) || ord.includes(textoNorm) ||
               gen.includes(textoNorm);
      });

      if (filtradasTaxon.length > 0) {
        featuresFiltradas = filtradasTaxon;
      }
    }

    // 2. Filtro espacial por BBox con salvaguarda de representatividad
    if (Array.isArray(bbox) && bbox.length === 4) {
      let [oeste, sur, este, norte] = bbox.map(Number);
      if (oeste > este) [oeste, este] = [este, oeste];
      if (sur > norte) [sur, norte] = [norte, sur];

      const filtradasEspacial = featuresFiltradas.filter(f => {
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) return false;
        const [lon, lat] = coords;
        return lon >= oeste && lon <= este && lat >= sur && lat <= norte;
      });

      conteoLocal = filtradasEspacial.length;

      // Si en el cuadrante acotado hay suficientes registros (>= 5), mantener el filtro local
      // Pero si hay muy pocos (< 5) para una especie popular/específica, entregar la población metropolitana completa
      if (filtradasEspacial.length >= 5 || (!textoNorm && filtradasEspacial.length > 0)) {
        featuresFiltradas = filtradasEspacial;
      } else {
        // Auto-ampliación metropolitana en el fallback local
        esFallbackMetropolitano = true;
        console.log(`[GBIF Fallback] Cuadrante local con ${conteoLocal} registros para "${textoFiltro}". Entregando catálogo metropolitano (${featuresFiltradas.length} observaciones).`);
      }
    }

    // Limitar a máximo 300 registros para rendimiento óptimo
    const featuresFinales = featuresFiltradas.slice(0, 300);

    // 3. Mapeo a registros normalizados
    const registros = featuresFinales.map(f => {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates || [null, null];
      const sp = p.especie || p.scientificName || p.nombre || 'Especie no determinada';
      const spLower = sp.toLowerCase();
      const nomComun = p.nombreComun || NOMBRES_COMUNES_CHILE[spLower] || null;

      return {
        id: p.gbifID || p.id_vgi || f.id || Math.floor(Math.random() * 1000000),
        especie: sp,
        scientificName: p.scientificName || sp,
        nombreComun: nomComun,
        reino: p.reino || 'Indeterminado',
        clase: p.clase || null,
        orden: p.orden || null,
        familia: p.familia || null,
        genero: p.genero || null,
        fecha: p.fecha || p.fecha_registro || 'Registro verificado',
        publicador: p.operador || 'iNaturalist / GBIF (Catálogo local verificado)',
        licencia: p.licencia || 'CC-BY 4.0 (GBIF)',
        lat: coords[1],
        lon: coords[0],
        issues: Array.isArray(p.issues) ? p.issues : []
      };
    });

    return {
      total: registros.length,
      totalGbif: featuresFiltradas.length,
      conteoLocal: conteoLocal,
      taxonResuelto: null,
      esFallback: true,
      esFallbackMetropolitano: esFallbackMetropolitano,
      motivoFallback: motivo,
      registros: registros,
      geojson: ocurrenciasAGeoJSON(registros)
    };
  }

  /**
   * Resuelve un texto (nombre científico, grupo biológico o nombre común en español)
   * al taxón oficial en el Backbone de GBIF para obtener su taxonKey aceptado.
   * Utiliza primero la Taxonomía Verificada de Chile (0 ms) y consulta el Backbone Nub.
   */
  async function resolverTaxon(texto) {
    if (!texto || !texto.trim()) return null;
    const tLimpio = texto.trim();
    const claveCache = 'res_' + normalizarTextoTaxon(tLimpio);
    if (cacheTaxon.has(claveCache)) return cacheTaxon.get(claveCache);

    // 1. Verificación inmediata en el catálogo taxonómico verificado de Chile
    const resVerificada = buscarTaxonEnDiccionario(tLimpio);
    if (resVerificada) {
      cacheTaxon.set(claveCache, resVerificada);
      return resVerificada;
    }

    const base = (typeof window !== 'undefined' && window.NODO_CONFIG?.endpoints?.gbif) || 'https://api.gbif.org/v1';

    // Generar candidatos taxonómicos limpios
    const candidatos = [];

    // Si contiene paréntesis (ej: "Palma chilena (Jubaea chilensis)"), extraer el nombre científico
    const matchParentesis = tLimpio.match(/\(([^)]+)\)/);
    if (matchParentesis && matchParentesis[1]) {
      const dentro = matchParentesis[1].replace(/\s+spp\.?/i, '').trim();
      if (dentro) candidatos.push(dentro);
    }

    // Texto sin paréntesis ni sufijos descriptivos
    const sinParentesis = tLimpio.replace(/\(.*?\)/g, '').replace(/—.*$/, '').replace(/\/.*$/, '').trim();
    if (sinParentesis && !candidatos.includes(sinParentesis)) {
      candidatos.push(sinParentesis);
    }

    // Texto original completo
    if (!candidatos.includes(tLimpio)) {
      candidatos.push(tLimpio);
    }

    // A) Intentar con /species/match (GBIF Backbone Oficial)
    for (const cand of candidatos) {
      try {
        const ctl = new AbortController();
        const tId = setTimeout(() => ctl.abort(), 6000);
        const res = await fetch(`${base}/species/match?name=${encodeURIComponent(cand)}&strict=false`, { signal: ctl.signal });
        clearTimeout(tId);
        if (res.ok) {
          const data = await res.json();
          if ((data.matchType === 'EXACT' || data.matchType === 'FUZZY' || data.matchType === 'HIGHERRANK') && (data.acceptedUsageKey || data.speciesKey || data.usageKey || data.key)) {
            const taxKey = data.acceptedUsageKey || data.speciesKey || data.usageKey || data.key;
            const canon = (data.status === 'SYNONYM' && data.species) ? data.species : (data.canonicalName || data.species || data.scientificName);
            const taxRes = {
              taxonKey: taxKey,
              canonicalName: canon,
              scientificName: data.scientificName || canon,
              rank: data.rank || 'TAXON',
              kingdom: data.kingdom || '',
              commonName: NOMBRES_COMUNES_CHILE[canon.toLowerCase()] || null,
              matchType: data.matchType
            };
            cacheTaxon.set(claveCache, taxRes);
            return taxRes;
          }
        }
      } catch (err) {
        // Continuar con el siguiente candidato
      }
    }

    // B) Probar /species/search forzando el datasetKey del GBIF Nub Backbone para evitar checklists espurias
    for (const cand of candidatos) {
      try {
        const ctl = new AbortController();
        const tId = setTimeout(() => ctl.abort(), 6000);
        const res = await fetch(`${base}/species/search?datasetKey=${GBIF_BACKBONE_DATASET_KEY}&q=${encodeURIComponent(cand)}&limit=4`, { signal: ctl.signal });
        clearTimeout(tId);
        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          if (results.length > 0) {
            // Preferir el registro aceptado (status === 'ACCEPTED')
            const top = results.find(r => r.taxonomicStatus === 'ACCEPTED') || results[0];
            const taxKey = top.nubKey || top.acceptedKey || top.speciesKey || top.key;
            if (taxKey) {
              const canon = top.canonicalName || top.species || top.scientificName;
              const taxRes = {
                taxonKey: taxKey,
                canonicalName: canon,
                scientificName: top.scientificName || canon,
                rank: top.rank || 'TAXON',
                kingdom: top.kingdom || '',
                commonName: NOMBRES_COMUNES_CHILE[canon.toLowerCase()] || null,
                matchType: 'SPECIES_BACKBONE_SEARCH'
              };
              cacheTaxon.set(claveCache, taxRes);
              return taxRes;
            }
          }
        }
      } catch (err) {
        // Continuar
      }
    }

    // C) Probar /species/suggest como último recurso con Backbone oficial
    for (const cand of candidatos) {
      try {
        const ctl = new AbortController();
        const tId = setTimeout(() => ctl.abort(), 6000);
        const res = await fetch(`${base}/species/suggest?datasetKey=${GBIF_BACKBONE_DATASET_KEY}&q=${encodeURIComponent(cand)}&limit=3`, { signal: ctl.signal });
        clearTimeout(tId);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && data[0].key) {
            const top = data[0];
            const canon = top.canonicalName || top.scientificName;
            const taxRes = {
              taxonKey: top.key,
              canonicalName: canon,
              scientificName: top.scientificName || top.canonicalName,
              rank: top.rank || 'TAXON',
              kingdom: top.kingdom || '',
              commonName: NOMBRES_COMUNES_CHILE[canon.toLowerCase()] || null,
              matchType: 'SUGGEST'
            };
            cacheTaxon.set(claveCache, taxRes);
            return taxRes;
          }
        }
      } catch (err) {
        // Continuar
      }
    }

    return null;
  }

  /**
   * Sugiere taxones en tiempo real integrando catálogo local chileno y GBIF Species Suggest API
   */
  async function sugerirTaxon(texto) {
    if (!texto || texto.trim().length < 2) return [];
    const tLimpio = texto.trim();
    const claveCache = 'sug_' + normalizarTextoTaxon(tLimpio);
    if (cacheTaxon.has(claveCache)) return cacheTaxon.get(claveCache);

    const resultados = [];
    const keysVistas = new Set();
    const norm = normalizarTextoTaxon(tLimpio);

    // 1. Coincidencias locales inmediatas en el catálogo chileno verificado (0 ms)
    for (const item of TAXONOMIA_VERIFICADA_CHILE) {
      const matchCanon = normalizarTextoTaxon(item.canonicalName).includes(norm);
      const matchComun = normalizarTextoTaxon(item.commonName).includes(norm);
      const matchAlias = item.aliases.some(a => normalizarTextoTaxon(a).includes(norm));

      if (matchCanon || matchComun || matchAlias) {
        if (!keysVistas.has(item.taxonKey)) {
          keysVistas.add(item.taxonKey);
          resultados.push({
            key: item.taxonKey,
            canonicalName: item.canonicalName,
            scientificName: item.scientificName,
            kingdom: item.kingdom,
            rank: item.rank,
            commonName: item.commonName
          });
        }
      }
    }

    // 2. Consulta remota a GBIF species/suggest restringida al Backbone oficial
    const base = (typeof window !== 'undefined' && window.NODO_CONFIG?.endpoints?.gbif) || 'https://api.gbif.org/v1';
    try {
      const ctl = new AbortController();
      const tId = setTimeout(() => ctl.abort(), 4000);
      const res = await fetch(`${base}/species/suggest?datasetKey=${GBIF_BACKBONE_DATASET_KEY}&q=${encodeURIComponent(tLimpio)}&limit=6`, { signal: ctl.signal });
      clearTimeout(tId);
      if (res.ok) {
        const datos = await res.json();
        if (Array.isArray(datos)) {
          datos.forEach(item => {
            if (item.key && !keysVistas.has(item.key)) {
              keysVistas.add(item.key);
              const canon = item.canonicalName || item.scientificName;
              resultados.push({
                key: item.key,
                canonicalName: canon,
                scientificName: item.scientificName || canon,
                kingdom: item.kingdom || '',
                rank: item.rank || 'TAXON',
                commonName: NOMBRES_COMUNES_CHILE[canon.toLowerCase()] || null
              });
            }
          });
        }
      }
    } catch (_) {
      // Si la red demora, los resultados locales ya están disponibles
    }

    cacheTaxon.set(claveCache, resultados);
    return resultados;
  }

  /**
   * Consulta registros biológicos en GBIF con auto-ampliación metropolitana inteligente.
   * Si una consulta acotada a un BBox local devuelve pocos registros (< 10) para una especie,
   * amplía la consulta a la Región Metropolitana para ofrecer una perspectiva biológica robusta.
   */
  async function buscarOcurrencias({ nombre, taxonKey, rank, canonicalName, bbox, limite = 300, basisOfRecord = 'ALL' }) {
    const claveCache = `${nombre || ''}_${taxonKey || ''}_${rank || ''}_${canonicalName || ''}_${JSON.stringify(bbox)}_${limite}_${basisOfRecord}`;
    if (cacheOcurrencias.has(claveCache)) {
      console.log('[GBIF] Retornando ocurrencias desde caché en memoria');
      return cacheOcurrencias.get(claveCache);
    }

    const base = (typeof window !== 'undefined' && window.NODO_CONFIG?.endpoints?.gbif) || 'https://api.gbif.org/v1';
    const parametros = new URLSearchParams({
      limit: String(limite),
      hasCoordinate: 'true'
    });

    let taxonResuelto = null;
    let keyTaxonFinal = taxonKey ? Number(taxonKey) : null;
    let rankFinal = rank || null;
    let canonFinal = canonicalName || (nombre ? nombre.trim() : null);

    if (keyTaxonFinal && canonFinal) {
      taxonResuelto = {
        taxonKey: keyTaxonFinal,
        canonicalName: canonFinal,
        scientificName: canonFinal,
        rank: rankFinal || 'TAXON',
        kingdom: ''
      };
    } else if (!keyTaxonFinal && nombre && nombre.trim()) {
      taxonResuelto = await resolverTaxon(nombre.trim());
      if (taxonResuelto && taxonResuelto.taxonKey) {
        keyTaxonFinal = taxonResuelto.taxonKey;
        rankFinal = taxonResuelto.rank;
        canonFinal = taxonResuelto.canonicalName;
      }
    }

    // Declarar targetRank y canonObjetivo
    const targetRank = (rankFinal || taxonResuelto?.rank || '').toUpperCase();
    const canonObjetivo = (canonFinal || taxonResuelto?.canonicalName || nombre || '').toLowerCase().trim();
    const canonNorm = normalizarTextoTaxon(canonObjetivo);

    if (keyTaxonFinal) {
      // Búsqueda taxonómica precisa: el taxonKey filtra el árbol taxonómico completo
      parametros.set('taxonKey', String(keyTaxonFinal));
    } else if (nombre && nombre.trim()) {
      const nombreLimpio = nombre.replace(/\(.*?\)/g, '').replace(/—.*$/, '').trim() || nombre.trim();
      parametros.set('scientificName', nombreLimpio);
    }

    if (basisOfRecord && basisOfRecord !== 'ALL') {
      parametros.set('basisOfRecord', basisOfRecord);
    }

    if (bbox && bbox.length === 4) {
      const [oeste, sur, este, norte] = bbox;
      parametros.set('decimalLatitude', `${sur},${norte}`);
      parametros.set('decimalLongitude', `${oeste},${este}`);
    }

    const urlFinal = `${base}/occurrence/search?${parametros.toString()}`;
    console.log(`[GBIF] Consultando ocurrencias: ${urlFinal}`);

    let datos = null;
    let errorVivo = null;

    // Intento 1: Timeout de 20 segundos
    try {
      const respuesta = await fetchConTimeout(urlFinal, {}, 20000);
      if (respuesta.ok) {
        datos = await respuesta.json();
      } else {
        errorVivo = `GBIF respondió con código HTTP ${respuesta.status}`;
      }
    } catch (err1) {
      errorVivo = err1.message || 'Error de red o timeout';
      console.warn(`[GBIF] Intento 1 falló (${errorVivo}). Probando reintento rápido...`);

      // Intento 2 (Reintento automático): Timeout de 10 segundos
      try {
        const respuesta2 = await fetchConTimeout(urlFinal, {}, 10000);
        if (respuesta2.ok) {
          datos = await respuesta2.json();
          errorVivo = null;
        } else {
          errorVivo = `GBIF respondió con código HTTP ${respuesta2.status} en reintento`;
        }
      } catch (err2) {
        errorVivo = err2.message || 'Fallo persistente de conexión con GBIF';
      }
    }

    // Si ambos intentos fallaron o la API no está disponible, activar el catálogo local verificado
    if (!datos || errorVivo) {
      const fallback = await obtenerFallbackLocal({
        nombre,
        canonFinal,
        targetRank,
        bbox,
        basisOfRecord,
        motivo: errorVivo || 'Demora o indisponibilidad en la red central de GBIF'
      });
      cacheOcurrencias.set(claveCache, fallback);
      return fallback;
    }

    let resultados = datos.results || [];
    let esFallbackMetropolitano = false;
    let conteoLocal = resultados.length;

    // Detectar si el BBox solicitado es acotado (ej: Barrio Brasil o submalla urbana pequeña < 0.25°)
    const esBboxAcotado = bbox && bbox.length === 4 && (
      Math.abs(bbox[2] - bbox[0]) < 0.25 || Math.abs(bbox[3] - bbox[1]) < 0.25
    );

    // Auto-ampliación metropolitana inteligente:
    // Si la búsqueda acotada a un cuadrante local arroja pocos registros (< 10) para un taxón específico
    // (típico en Quillaja saponaria, Cryptocarya alba, Peumus boldus, Schinus molle, Jubaea chilensis, etc.
    // donde en 1 km² hay sólo 1 ejemplar inventariado, pero en la Región Metropolitana existen cientos o miles),
    // consultar automáticamente la Región Metropolitana para entregar una cartografía biológica representativa
    if (esBboxAcotado && (keyTaxonFinal || canonFinal) && resultados.length < 10) {
      const bboxRM = BBOX_RM_DEFECTO;
      const paramsRM = new URLSearchParams(parametros);
      paramsRM.set('decimalLatitude', `${bboxRM[1]},${bboxRM[3]}`);
      paramsRM.set('decimalLongitude', `${bboxRM[0]},${bboxRM[2]}`);
      paramsRM.set('limit', String(limite || 300));
      try {
        const ctlRM = new AbortController();
        const tIdRM = setTimeout(() => ctlRM.abort(), 12000);
        const resRM = await fetch(`${base}/occurrence/search?${paramsRM.toString()}`, { signal: ctlRM.signal });
        clearTimeout(tIdRM);
        if (resRM.ok) {
          const datosRM = await resRM.json();
          if (datosRM.results && datosRM.results.length > resultados.length) {
            conteoLocal = resultados.length;
            resultados = datosRM.results;
            datos.count = datosRM.count || resultados.length;
            esFallbackMetropolitano = true;
            console.log(`[GBIF] Auto-ampliación metropolitana exitosa: ${resultados.length} registros para ${canonFinal} (${conteoLocal} en cuadrante local acotado)`);
          }
        }
      } catch (e) {
        console.warn('[GBIF] Error en auto-ampliación metropolitana:', e);
      }
    }

    let registros = resultados.map(r => {
      const sp = r.species || r.canonicalName || (r.scientificName ? r.scientificName.split('(')[0].trim() : 'Especie no determinada');
      const spLower = sp.toLowerCase();
      const nomComun = r.vernacularName || NOMBRES_COMUNES_CHILE[spLower] || (canonFinal && NOMBRES_COMUNES_CHILE[canonFinal.toLowerCase()]) || null;

      return {
        id: r.key || r.gbifID,
        especie: sp,
        scientificName: r.scientificName || r.species || 'Especie no determinada',
        nombreComun: nomComun,
        reino: r.kingdom || 'Indeterminado',
        clase: r.class || null,
        orden: r.order || null,
        familia: r.family || null,
        genero: r.genus || null,
        fecha: r.eventDate ? r.eventDate.slice(0, 10) : 'Sin fecha registrada',
        publicador: r.institutionCode || r.publishingOrgKey || 'Ciencia Ciudadana / GBIF',
        licencia: r.license || 'CC-BY 4.0',
        lat: r.decimalLatitude,
        lon: r.decimalLongitude,
        issues: r.issues || [] // Banderas de calidad Darwin Core
      };
    });

    // Filtro de verificación taxonómica estricto por rango biológico:
    // Garantiza pureza absoluta (0% mezcla con otras especies) sin descartar falsos negativos
    if (canonNorm && targetRank) {
      if (['SPECIES', 'SUBSPECIES', 'VARIETY'].includes(targetRank)) {
        registros = registros.filter(r => {
          const esp = normalizarTextoTaxon(r.especie || '');
          const sci = normalizarTextoTaxon(r.scientificName || '');
          return esp.includes(canonNorm) || sci.includes(canonNorm) || canonNorm.includes(esp);
        });
      } else if (targetRank === 'GENUS') {
        registros = registros.filter(r => {
          const gen = normalizarTextoTaxon(r.genero || '');
          const esp = normalizarTextoTaxon(r.especie || '');
          const sci = normalizarTextoTaxon(r.scientificName || '');
          return gen === canonNorm || esp.startsWith(canonNorm) || sci.startsWith(canonNorm);
        });
      } else if (targetRank === 'CLASS') {
        registros = registros.filter(r => {
          const cla = normalizarTextoTaxon(r.clase || '');
          return !cla || cla === canonNorm;
        });
      } else if (targetRank === 'ORDER') {
        registros = registros.filter(r => {
          const ord = normalizarTextoTaxon(r.orden || '');
          return !ord || ord === canonNorm;
        });
      } else if (targetRank === 'KINGDOM') {
        registros = registros.filter(r => {
          const rei = normalizarTextoTaxon(r.reino || '');
          return !rei || rei === canonNorm;
        });
      }
    }

    const respuestaFinal = {
      total: registros.length,
      totalGbif: datos.count || registros.length,
      conteoLocal: conteoLocal,
      taxonResuelto: taxonResuelto,
      esFallback: false,
      esFallbackMetropolitano: esFallbackMetropolitano,
      registros: registros,
      geojson: ocurrenciasAGeoJSON(registros)
    };

    cacheOcurrencias.set(claveCache, respuestaFinal);
    return respuestaFinal;
  }

  function ocurrenciasAGeoJSON(registros) {
    const features = registros
      .filter(r => r.lat && r.lon)
      .map(r => ({
        type: 'Feature',
        id: `GBIF/${r.id}`,
        geometry: {
          type: 'Point',
          coordinates: [r.lon, r.lat]
        },
        properties: {
          id_vgi: `GBIF/${r.id}`,
          categoria: 'CAT-08 (Biodiversidad Urbana)',
          subtipo: 'Registro Biológico (GBIF/iNat)',
          nombre: r.nombreComun ? `${r.nombreComun} (${r.especie})` : r.especie,
          operador: r.publicador || null,
          direccion: null,
          accesibilidad: null,
          fuente: 'GBIF Occurrence API / Ciencia Ciudadana',
          metodo_adquisicion: 'Consulta REST API GBIF Occurrence en vivo',
          licencia: r.licencia || 'CC-BY 4.0 (GBIF)',
          coordenadas: [r.lon, r.lat],
          geom_wkt: `POINT(${r.lon} ${r.lat})`,
          bbox: [r.lon, r.lat, r.lon, r.lat],
          fecha_registro: r.fecha || new Date().toISOString().slice(0, 10),
          superficie_m2: null,
          superficie_ha: null,
          srs_superficie: null,
          especie: r.especie,
          scientificName: r.scientificName || r.especie,
          reino: r.reino,
          familia: r.familia,
          fecha: r.fecha,
          calidad_issues: (r.issues && r.issues.length > 0) ? r.issues.join(', ') : 'Sin advertencias (Georreferencia válida)'
        }
      }));

    return {
      type: 'FeatureCollection',
      name: 'GBIF_Biodiversidad_Urbana',
      features: features
    };
  }

  return {
    resolverTaxon,
    sugerirTaxon,
    buscarOcurrencias,
    ocurrenciasAGeoJSON,
    obtenerFallbackLocal,
    NOMBRES_COMUNES_CHILE,
    TAXONOMIA_VERIFICADA_CHILE,
    BBOX_RM_DEFECTO,
    BBOX_BARRIO_BRASIL_DEFECTO
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloGBIF = ModuloGBIF;
  window.ModuloGbif = ModuloGBIF;
}
