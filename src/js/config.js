/*
  config.js
  ---------
  Carga la configuración centralizada intentando rutas relativas para soportar
  tanto servidores que sirven desde la raíz como servidores que sirven desde src/,
  o apertura directa local (file://).
  Expone el objeto en window.NODO_CONFIG y emite el evento 'nodo:config-lista'.
*/

const CONFIG_PREDETERMINADA = {
  organizacion: {
    nombre: 'Atlas de Información Geográfica Voluntaria',
    subtitulo: 'Plataforma VGI para la Gestión Territorial',
    descripcion_corta: 'Consulta, calidad y metadatos VGI | Barrio Brasil & UAH',
    contacto: 'juanpablolescanovillegas@gmail.com',
    area_de_interes_nombre: 'Barrio Brasil — Universidad Alberto Hurtado (Santiago Centro, Chile)'
  },
  area_por_defecto: {
    bbox: [-70.6720, -33.4505, -70.6580, -33.4350],
    centro: [-33.4425, -70.6650],
    zoom: 15
  },
  territorios_predefinidos: [
    {
      id: 'barrio-brasil-ampliado',
      nombre: 'Barrio Brasil Completo (hasta Plaza Brasil)',
      bbox: [-70.6720, -33.4505, -70.6580, -33.4350],
      centro: [-33.4425, -70.6650],
      zoom: 15,
      descripcion: 'Zona Típica Barrio Brasil, Plaza Brasil, Huérfanos, Compañía, Av. Brasil y Alameda'
    },
    {
      id: 'uah-manzana',
      nombre: 'Barrio Brasil — Universidad Alberto Hurtado (Manzana UAH)',
      bbox: [-70.6675, -33.4505, -70.6565, -33.4385],
      centro: [-33.4445, -70.6620],
      zoom: 16,
      descripcion: 'Campus patrimonial UAH (Almirante Barroso, Erasmo Escala, Cienfuegos, Los Héroes)'
    }
  ],
  endpoints: {
    overpass: 'https://overpass-api.de/api/interpreter',
    overpass_espejos: [
      'https://lz4.overpass-api.de/api/interpreter',
      'https://z.overpass-api.de/api/interpreter',
      'https://overpass.openstreetmap.fr/api/interpreter',
      'https://overpass-api.de/api/interpreter'
    ],
    ohsome: 'https://api.ohsome.org/v1',
    ohsome_v1: 'https://api.ohsome.org/v1',
    ohsome_v2: 'https://api.heigit.org/ohsome-api/v2-rc',
    gbif: 'https://api.gbif.org/v1',
    umap_instancia_sugerida: 'https://umap.openstreetmap.fr'
  },
  base_datos: {
    proveedor: 'supabase',
    nombre_motor: 'PostgreSQL 15+ con extensión PostGIS',
    tipo: 'Open Source Cloud Spatial Database',
    url: 'https://tkfzmmlhhxqhzgqavsqr.supabase.co',
    anon_key: '',
    storage_bucket: 'atlas-geojson',
    modo: 'auto', // 'auto' (Supabase con fallback local), 'supabase' o 'local'
    tablas: {
      metadata: 'capas_metadata',
      entidades: 'capas_entidades',
      rpc_bbox: 'fn_obtener_capa_bbox'
    }
  },
  categorias_osm: [
    {
      id: 'educacion',
      codigo: 'CAT-01',
      nombre: 'Educación y Universidad',
      icono: '🏫',
      color: '#35586B',
      geometrias: ['Puntos (Nodos)', 'Polígonos (Huellas de Campus)'],
      entidades: ['Universidades y facultades', 'Institutos profesionales', 'Colegios y liceos', 'Jardines infantiles', 'Bibliotecas académicas y comunales', 'Pabellones y edificios educativos', 'Residencias estudiantiles', 'Institutos de investigación'],
      filtro_overpass: 'nwr["amenity"~"university|college|library|school|kindergarten|childcare|student_accommodation|research_institute|music_school|training_centre"]; nwr["building"~"university|school|college|kindergarten|library"]; nwr["name"~"Universidad|Facultad|Liceo|Colegio|UAH|Alberto Hurtado"];',
      descripcion: 'Instalaciones de educación superior, campus patrimonial UAH (Almirante Barroso/Erasmo Escala/Cienfuegos), colegios, jardines infantiles, bibliotecas y huellas poligonales de pabellones universitarios'
    },
    {
      id: 'servicios',
      codigo: 'CAT-02',
      nombre: 'Servicios y Comercio Barrial',
      icono: '🏬',
      color: '#A97722',
      geometrias: ['Puntos (Nodos)', 'Polígonos (Recintos Comerciales)'],
      entidades: ['Comercio barrial y almacenes', 'Panaderías y verdulerías', 'Cafeterías, bares y restaurantes', 'Farmacias y boticas', 'Consultorios y clínicas', 'Bancos, cajeros y correos', 'Comisarías y bomberos', 'Equipamiento de salud y social'],
      filtro_overpass: 'nwr["shop"]; nwr["amenity"~"cafe|restaurant|bar|fast_food|pub|pharmacy|clinic|doctors|dentist|bank|atm|post_office|marketplace|police|fire_station|hospital|townhall|veterinary|community_centre|social_facility"]; nwr["emergency"~"ambulance_station|defibrillator|fire_hydrant"]; nwr["building"~"retail|commercial|supermarket"];',
      descripcion: 'Red de abastecimiento de proximidad, comercio de barrio, vida gastronómica en Av. Brasil y Huérfanos, salud comunitaria, servicios financieros y huellas de galerías comerciales'
    },
    {
      id: 'transporte',
      codigo: 'CAT-03',
      nombre: 'Movilidad y Transporte',
      icono: '🚆',
      color: '#2C4238',
      geometrias: ['Puntos (Paraderos y Bocas de Metro)', 'Líneas (Ejes Viales y Vía Férrea)', 'Polígonos (Estaciones y Terminales)'],
      entidades: ['Paraderos Red Movilidad', 'Estaciones de Metro y accesos', 'Ejes viales estructurantes (Alameda, Brasil, San Pablo)', 'Trazados ferroviarios y andenes', 'Terminales de buses y taxis'],
      filtro_overpass: 'node["highway"="bus_stop"]; node["railway"~"station|subway_entrance|stop|halt|tram_stop|level_crossing"]; node["public_transport"~"platform|stop_position|station"]; way["highway"~"primary|secondary|tertiary|trunk|motorway|residential|unclassified"]; way["railway"~"subway|rail|tram"]; nwr["amenity"~"bus_station|ferry_terminal|taxi"]; nwr["vending"="public_transport_tickets"];',
      descripcion: 'Infraestructura intermodal metropolitana: estaciones de Metro (Los Héroes, Santa Ana, Cumming), paraderos Red, corredores viales primarios y trazados de transporte'
    },
    {
      id: 'movilidad_activa',
      codigo: 'CAT-04',
      nombre: 'Movilidad Activa y Ciclovías',
      icono: '🚲',
      color: '#3F5D4E',
      geometrias: ['Líneas (Ciclovías y Ciclobandas)', 'Puntos (Biciestacionamientos y Talleres)', 'Polígonos (Patios Ciclables)'],
      entidades: ['Ciclovías segregadas exclusivas', 'Ciclobandas y vías compartidas', 'Sendas ciclables y paseos mixtos', 'Biciestacionamientos públicos y UAH', 'Estaciones de bicicletas compartidas', 'Talleres comunitarios de bicicletas', 'Estaciones de carga'],
      filtro_overpass: 'way["highway"="cycleway"]; way["cycleway"]; way["cycleway:left"]; way["cycleway:right"]; way["cycleway:both"]; way["highway"~"living_street|track|steps"]; way["highway"~"footway|path"]["bicycle"~"yes|designated"]; nwr["amenity"~"bicycle_parking|bicycle_rental|bicycle_repair_station|charging_station"]; nwr["shop"="bicycle"];',
      descripcion: 'Ejes de micromovilidad y movilidad sustentable: ciclovías segregadas (Rosas, Brasil), estacionamientos para bicicletas, estaciones de arriendo y talleres mecánicos de barrio'
    },
    {
      id: 'espacio_publico',
      codigo: 'CAT-05',
      nombre: 'Áreas Verdes y Espacio Público',
      icono: '🌲',
      color: '#236B43',
      geometrias: ['Polígonos (Parques, Plazas y Canchas)', 'Puntos (Mobiliario, Bancos y Juegos)'],
      entidades: ['Plazas mayores y vecinales (Plaza Brasil)', 'Parques y plazoletas', 'Juegos infantiles y recreación', 'Multicanchas y recintos deportivos', 'Bandejones arbolados', 'Bancos de descanso y bebederos'],
      filtro_overpass: 'nwr["leisure"~"park|playground|garden|pitch|sports_centre|fitness_station|dog_park|water_park|marina"]; nwr["landuse"~"grass|village_green|recreation_ground"]; node["amenity"~"bench|drinking_water"];',
      descripcion: 'Espacio público barrial y descanso: polígonos de Plaza Brasil, canchas, plazoletas, bandejones verdes, mobiliario de permanencia urbana y bebederos públicos'
    },
    {
      id: 'patrimonio',
      codigo: 'CAT-06',
      nombre: 'Patrimonio y Cultura',
      icono: '🏛',
      color: '#8F3A2C',
      geometrias: ['Polígonos (Casonas, Iglesias y Centros Culturales)', 'Puntos (Esculturas, Memoriales y Placas)'],
      entidades: ['Inmuebles de Conservación Histórica (ICH)', 'Zona Típica Barrio Brasil', 'Casonas Neoclásicas UAH', 'Templos e iglesias (Basílica del Salvador, Parroquia San Lázaro)', 'Museos, galerías y murales', 'Centros culturales comunitarios', 'Esculturas, monumentos y memoriales'],
      filtro_overpass: 'nwr["historic"]; nwr["heritage"]; nwr["building"~"church|cathedral|chapel"]; nwr["amenity"~"theatre|arts_centre|place_of_worship|museum|community_centre|cinema"]; nwr["tourism"~"museum|artwork|gallery"];',
      descripcion: 'Memoria urbana y patrimonio arquitectónico: casonas de la Zona Típica, Basílica del Salvador, centros culturales comunitarios, teatros, museos, monumentos y memoriales históricos'
    },
    {
      id: 'accesibilidad',
      codigo: 'CAT-07',
      nombre: 'Accesibilidad Universal',
      icono: '🦯',
      color: '#4B5142',
      geometrias: ['Puntos (Rebajes de Cordón y Cruces)', 'Líneas (Paseos Peatonales y Rampas)', 'Polígonos (Equipamientos Accesibles)'],
      entidades: ['Rebajes de cordón y solera en esquinas', 'Pasos peatonales y cruces seguros', 'Pavimento podotáctil para personas ciegas', 'Rampas peatonales y accesos continuos', 'Paseos y veredas peatonales', 'Equipamientos con accesibilidad validada', 'Semáforos sonoros'],
      filtro_overpass: 'node["kerb"]; node["highway"="crossing"]; node["tactile_paving"]; node["traffic_signals:sound"]; node["highway"="traffic_signals"]; node["wheelchair"]; way["highway"~"footway|pedestrian"]; way["highway"="steps"]; way["ramp"]; way["highway"="ramp"]; nwr["amenity"="shelter"]; nwr["highway"="elevator"];',
      descripcion: 'Diagnóstico de caminabilidad inclusiva: rebajes de cordón en veredas, pasos de cebra, semáforos sonoros, guías podotáctiles, rampas y condiciones de acceso para personas con movilidad reducida'
    },
    {
      id: 'biodiversidad',
      codigo: 'CAT-08',
      nombre: 'Biodiversidad Urbana',
      icono: '☘',
      color: '#1C523A',
      geometrias: ['Puntos (Árboles y Registros de Fauna/Flora)', 'Líneas (Alineaciones Arbóreas)', 'Polígonos (Arboledas y Jardines)'],
      entidades: ['Arbolado urbano individual (OSM)', 'Alineaciones de árboles en calles', 'Parches boscosos y matorral urbano', 'Jardines botánicos y comunitarios', 'Avifauna de ciencia ciudadana (GBIF / iNaturalist)', 'Flora nativa urbana (peumo, quillay, palma)'],
      filtro_overpass: 'node["natural"="tree"]; way["natural"="tree_row"]; nwr["natural"~"wood|scrub|water|wetland"]; nwr["leisure"="garden"]; nwr["landuse"="forest"]; nwr["genus"];',
      descripcion: 'Ecología y naturaleza urbana: arbolado viario en Av. Brasil, alineaciones arbóreas, jardines comunitarios y registros de avifauna y flora integrados desde GBIF y ciencia ciudadana'
    },
    {
      id: 'edificaciones',
      codigo: 'CAT-09',
      nombre: 'Edificaciones y Huella Urbana',
      icono: '🏙',
      color: '#555555',
      geometrias: ['Polígonos (Huellas de Manzanas y Edificios)', 'Puntos (Direcciones y Entradas)'],
      entidades: ['Viviendas unifamiliares y casonas', 'Edificios residenciales en altura', 'Pabellones universitarios UAH', 'Inmuebles comerciales', 'Edificios públicos y cívicos', 'Templos e iglesias'],
      filtro_overpass: 'way["building"]; relation["building"]; node["building"]; nwr["building:levels"];',
      descripcion: 'Catastro poligonal de edificaciones y volumetría construida: huellas de manzanas, casonas patrimoniales, campus UAH y edificaciones con cálculo de superficie métrica en m² (EPSG:32719 UTM 19S)'
    },
    {
      id: 'cobertura_suelo',
      codigo: 'CAT-10',
      nombre: 'Coberturas y Usos de Suelo',
      icono: '▧',
      color: '#5B704E',
      geometrias: ['Polígonos (Zonificación Funcional y Áreas)', 'Líneas (Ejes de Calzada y Pavimentos)'],
      entidades: ['Uso residencial', 'Uso comercial y servicios', 'Recintos educacionales', 'Áreas recreativas y deportivas', 'Suelos en faena o construcción', 'Prados y cubiertas vegetales'],
      filtro_overpass: 'nwr["landuse"]; nwr["natural"~"wood|scrub|water|grassland|bare_rock|wetland"]; nwr["leisure"~"park|garden|pitch|nature_reserve|stadium"]; way["surface"="asphalt"];',
      descripcion: 'Zonificación funcional del suelo urbano y coberturas biofísicas: áreas residenciales, comerciales, dotacionales, deportivas y áreas verdes naturales'
    }
  ],
  idioma_interfaz: 'es',
  metadatos_iso_defecto: {
    sistema_referencia: 'EPSG:4326 (WGS84)',
    sistema_referencia_nacional: 'EPSG:5361 (SIRGAS-Chile / UTM 19S)',
    idioma_recurso: 'spa',
    punto_de_contacto_organizacion: 'Atlas de Información Geográfica Voluntaria — Nodo GeoAbierto',
    punto_de_contacto_correo: 'juanpablolescanovillegas@gmail.com',
    restricciones_defecto: 'Datos OpenStreetMap: Open Database License (ODbL) 1.0 (© colaboradores de OpenStreetMap). Datos GBIF: CC-BY 4.0 / CC0 según registro original.'
  }
};

// Inicialización inmediata con la configuración completa para disponibilidad síncrona
window.NODO_CONFIG = JSON.parse(JSON.stringify(CONFIG_PREDETERMINADA));

async function cargarConfiguracion() {
  const rutasPosibles = [
    'config/config.json',
    './config/config.json',
    '../config/config.json',
    '/config/config.json'
  ];

  for (const ruta of rutasPosibles) {
    try {
      const respuesta = await fetch(ruta);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        window.NODO_CONFIG = Object.assign({}, CONFIG_PREDETERMINADA, datos);
        console.log(`[+] Configuración remota aplicada desde: ${ruta}`);
        break;
      }
    } catch (e) {
      // Intenta siguiente ruta o mantiene la configuración predeterminada completa
    }
  }

  document.dispatchEvent(new CustomEvent('nodo:config-lista'));
}

cargarConfiguracion();
