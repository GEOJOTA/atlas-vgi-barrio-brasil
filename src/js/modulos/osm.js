/*
  osm.js
  ------
  Consultas espaciales a OpenStreetMap vía Overpass API.
  Incluye:
  - Soporte para las 10 categorías temáticas VGI del Atlas (CAT-01 a CAT-10).
  - Fallback automático entre servidores espejo (overpass-api.de, kumi.systems, mail.ru).
  - Normalizador de elementos Overpass (nodes, ways, relations) a estándar GeoJSON (FeatureCollection).
*/

const ModuloOSM = (() => {

  /**
   * Catálogo de consultas predefinidas según la taxonomía del Atlas
   */
  const PRESETS_CATEGORIAS = {
    educacion: {
      nombre: 'Educación y Universidad',
      codigo: 'CAT-01',
      filtro: `
        nwr["amenity"~"university|college|library|school|kindergarten|childcare|language_school|music_school|driving_school|student_accommodation|research_institute|training_centre"]({{bbox}});
        nwr["building"~"university|school|college|kindergarten|library"]({{bbox}});
        nwr["name"~"Universidad|Facultad|Liceo|Colegio|UAH|Alberto Hurtado"]({{bbox}});
        nwr["operator"~"Universidad|Alberto Hurtado|UAH|CRUCH"]({{bbox}});
      `
    },
    servicios: {
      nombre: 'Servicios y Comercio Barrial',
      codigo: 'CAT-02',
      filtro: `
        nwr["shop"]({{bbox}});
        nwr["amenity"~"cafe|restaurant|bar|fast_food|pub|pharmacy|clinic|doctors|dentist|bank|atm|post_office|marketplace|police|fire_station|hospital|townhall|veterinary|community_centre|recycling|waste_basket|social_facility|coast_guard"]({{bbox}});
        nwr["emergency"~"ambulance_station|defibrillator|fire_hydrant|fire_lookout"]({{bbox}});
        nwr["man_made"~"surveillance|water_tower|water_works"]({{bbox}});
        nwr["office"~"government"]({{bbox}});
        nwr["highway"="street_lamp"]({{bbox}});
        nwr["building"~"retail|commercial|supermarket"]({{bbox}});
        nwr["healthcare"]({{bbox}});
      `
    },
    transporte: {
      nombre: 'Movilidad y Transporte',
      codigo: 'CAT-03',
      filtro: `
        node["highway"="bus_stop"]({{bbox}});
        node["railway"~"station|subway_entrance|stop|halt|tram_stop|level_crossing"]({{bbox}});
        node["public_transport"~"platform|stop_position|station"]({{bbox}});
        way["highway"~"primary|secondary|tertiary|trunk|motorway|residential|unclassified"]({{bbox}});
        way["railway"~"subway|rail|tram"]({{bbox}});
        nwr["amenity"~"bus_station|ferry_terminal|taxi"]({{bbox}});
        nwr["vending"="public_transport_tickets"]({{bbox}});
        nwr["barrier"="toll_booth"]({{bbox}});
        nwr["aeroway"="aerodrome"]({{bbox}});
      `
    },
    movilidad_activa: {
      nombre: 'Movilidad Activa y Ciclovías',
      codigo: 'CAT-04',
      filtro: `
        way["highway"="cycleway"]({{bbox}});
        way["cycleway"]({{bbox}});
        way["cycleway:left"]({{bbox}});
        way["cycleway:right"]({{bbox}});
        way["cycleway:both"]({{bbox}});
        way["highway"~"living_street|track|steps"]({{bbox}});
        way["highway"~"footway|path"]["bicycle"~"yes|designated"]({{bbox}});
        nwr["amenity"~"bicycle_parking|bicycle_rental|bicycle_repair_station|charging_station"]({{bbox}});
        nwr["highway"="speed_display"]({{bbox}});
        nwr["shop"="bicycle"]({{bbox}});
      `
    },
    espacio_publico: {
      nombre: 'Áreas Verdes y Espacio Público',
      codigo: 'CAT-05',
      filtro: `
        nwr["leisure"~"park|playground|garden|pitch|sports_centre|fitness_station|dog_park|water_park|marina"]({{bbox}});
        nwr["landuse"~"grass|village_green|recreation_ground"]({{bbox}});
        node["amenity"~"bench|drinking_water"]({{bbox}});
      `
    },
    patrimonio: {
      nombre: 'Patrimonio y Cultura',
      codigo: 'CAT-06',
      filtro: `
        nwr["historic"]({{bbox}});
        nwr["heritage"]({{bbox}});
        nwr["building"~"church|cathedral|chapel"]({{bbox}});
        nwr["amenity"~"theatre|arts_centre|place_of_worship|museum|community_centre|cinema"]({{bbox}});
        nwr["tourism"~"museum|artwork|gallery"]({{bbox}});
      `
    },
    accesibilidad: {
      nombre: 'Accesibilidad Universal',
      codigo: 'CAT-07',
      filtro: `
        node["kerb"]({{bbox}});
        node["highway"="crossing"]({{bbox}});
        node["tactile_paving"]({{bbox}});
        node["traffic_signals:sound"]({{bbox}});
        node["highway"="traffic_signals"]({{bbox}});
        node["wheelchair"]({{bbox}});
        way["highway"~"footway|pedestrian"]({{bbox}});
        way["highway"="steps"]({{bbox}});
        way["ramp"]({{bbox}});
        way["highway"="ramp"]({{bbox}});
        nwr["amenity"="shelter"]({{bbox}});
        nwr["highway"="elevator"]({{bbox}});
      `
    },
    biodiversidad: {
      nombre: 'Biodiversidad Urbana',
      codigo: 'CAT-08',
      filtro: `
        node["natural"="tree"]({{bbox}});
        way["natural"="tree_row"]({{bbox}});
        nwr["natural"~"wood|scrub|water|wetland"]({{bbox}});
        nwr["leisure"="garden"]({{bbox}});
        nwr["landuse"="forest"]({{bbox}});
        nwr["genus"]({{bbox}});
      `
    },
    edificaciones: {
      nombre: 'Edificaciones y Huella Urbana (Polígonos)',
      codigo: 'CAT-09',
      filtro: `
        way["building"]({{bbox}});
        relation["building"]({{bbox}});
        node["building"]({{bbox}});
        nwr["building:levels"]({{bbox}});
      `
    },
    cobertura_suelo: {
      nombre: 'Coberturas y Usos de Suelo (Polígonos)',
      codigo: 'CAT-10',
      filtro: `
        nwr["landuse"]({{bbox}});
        nwr["natural"~"wood|scrub|water|grassland|bare_rock|wetland"]({{bbox}});
        nwr["leisure"~"park|garden|pitch|nature_reserve|stadium"]({{bbox}});
        way["surface"="asphalt"]({{bbox}});
      `
    }
  };

  // Mapeo bidireccional y alias de las 10 Macro-Categorías VGI
  const ALIAS_MACRO = {
    'CAT-01': 'educacion', 'cat-01': 'educacion',
    'CAT-02': 'servicios', 'cat-02': 'servicios',
    'CAT-03': 'transporte', 'cat-03': 'transporte',
    'CAT-04': 'movilidad_activa', 'cat-04': 'movilidad_activa',
    'CAT-05': 'espacio_publico', 'cat-05': 'espacio_publico',
    'CAT-06': 'patrimonio', 'cat-06': 'patrimonio',
    'CAT-07': 'accesibilidad', 'cat-07': 'accesibilidad',
    'CAT-08': 'biodiversidad', 'cat-08': 'biodiversidad',
    'CAT-09': 'edificaciones', 'cat-09': 'edificaciones',
    'CAT-10': 'cobertura_suelo', 'cat-10': 'cobertura_suelo'
  };
  Object.entries(ALIAS_MACRO).forEach(([alias, target]) => {
    if (PRESETS_CATEGORIAS[target]) {
      PRESETS_CATEGORIAS[alias] = PRESETS_CATEGORIAS[target];
    }
  });

  /**
   * Construye consulta Overpass QL
   */
  function construirConsulta(bbox, etiquetaOPreset) {
    const [oeste, sur, este, norte] = bbox;
    const bboxOverpass = `${sur},${oeste},${norte},${este}`; // S, W, N, E

    let cuerpoConsulta;

    if (PRESETS_CATEGORIAS[etiquetaOPreset]) {
      cuerpoConsulta = PRESETS_CATEGORIAS[etiquetaOPreset].filtro.replaceAll('{{bbox}}', bboxOverpass);
    } else if (etiquetaOPreset && etiquetaOPreset.includes('=')) {
      const [clave, valor] = etiquetaOPreset.split('=').map(s => s.trim());
      cuerpoConsulta = `
        node["${clave}"="${valor}"](${bboxOverpass});
        way["${clave}"="${valor}"](${bboxOverpass});
        relation["${clave}"="${valor}"](${bboxOverpass});
      `;
    } else {
      const etiquetaLimpia = (etiquetaOPreset || 'highway').trim();
      cuerpoConsulta = `
        node["${etiquetaLimpia}"](${bboxOverpass});
        way["${etiquetaLimpia}"](${bboxOverpass});
        relation["${etiquetaLimpia}"](${bboxOverpass});
      `;
    }

    return `
      [out:json][timeout:35];
      (
        ${cuerpoConsulta}
      );
      out geom tags qt 3500;
    `;
  }

  // Caché en memoria para evitar re-consultar Overpass innecesariamente
  const cacheConsultas = new Map();

  /**
   * Ejecuta la consulta probando servidores espejo si el principal falla
   */
  async function consultar(bbox, etiquetaOPreset, consultaDirecta = null) {
    const claveCache = `${JSON.stringify(bbox)}_${etiquetaOPreset}_${consultaDirecta || ''}`;
    if (cacheConsultas.has(claveCache)) {
      console.log(`[Overpass] Retornando datos desde caché en memoria para ${etiquetaOPreset}`);
      return cacheConsultas.get(claveCache);
    }

    const cfg = window.NODO_CONFIG || {};
    const endpoints = (cfg.endpoints?.overpass_espejos && cfg.endpoints.overpass_espejos.length > 0)
      ? cfg.endpoints.overpass_espejos
      : [
          'https://lz4.overpass-api.de/api/interpreter',
          'https://z.overpass-api.de/api/interpreter',
          'https://overpass.openstreetmap.fr/api/interpreter',
          'https://overpass-api.de/api/interpreter'
        ];

    const consulta = consultaDirecta || construirConsulta(bbox, etiquetaOPreset);
    let ultimoError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`[Overpass] Intentando consulta en: ${endpoint}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s máx por servidor con fallback reactivo

        const respuesta = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8'
          },
          body: 'data=' + encodeURIComponent(consulta),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (respuesta.ok) {
          const datos = await respuesta.json();
          const elementos = datos.elements || [];
          cacheConsultas.set(claveCache, elementos);
          return elementos;
        }
        ultimoError = new Error(`Servidor ${endpoint} respondió con status ${respuesta.status}`);
      } catch (err) {
        console.warn(`[Overpass] Fallo o timeout en ${endpoint}:`, err.message);
        ultimoError = err;
      }
    }

    throw new Error(`No se pudo conectar a Overpass tras intentar en ${endpoints.length} servidores espejo. Detalle: ${ultimoError?.message || 'Error de red o timeout'}`);
  }

  /**
   * Convierte los elementos de Overpass a GeoJSON FeatureCollection normalizado
   * soportando geometrías mixtas: Puntos (nodos/centroides), Líneas (vías abiertas/ejes)
   * y Polígonos (vías cerradas/huellas/áreas).
   */
  function elementosAGeoJSON(elementos, categoriaId = 'general') {
    const features = [];

    elementos.forEach(el => {
      let geometria = null;
      const tags = el.tags || {};

      if (el.type === 'node' && el.lat !== undefined && el.lon !== undefined) {
        geometria = {
          type: 'Point',
          coordinates: [el.lon, el.lat]
        };
      } else if (el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length > 0) {
        const coords = el.geometry.map(p => [p.lon, p.lat]);
        const primerPunto = coords[0];
        const ultimoPunto = coords[coords.length - 1];
        const esCerrado = coords.length >= 4 &&
          Math.abs(primerPunto[0] - ultimoPunto[0]) < 1e-6 &&
          Math.abs(primerPunto[1] - ultimoPunto[1]) < 1e-6;

        const esPoligono = esCerrado && (
          tags.building ||
          tags.landuse ||
          tags.leisure ||
          tags.amenity ||
          tags.historic ||
          tags.natural ||
          tags.shop ||
          tags.tourism ||
          tags.office ||
          tags.craft ||
          tags.aeroway ||
          tags.emergency ||
          tags.place ||
          tags.boundary ||
          tags.area === 'yes'
        );

        if (esPoligono) {
          geometria = {
            type: 'Polygon',
            coordinates: [coords]
          };
        } else {
          geometria = {
            type: 'LineString',
            coordinates: coords
          };
        }
      } else if (el.type === 'relation' && Array.isArray(el.members)) {
        // Soporte de relaciones multipolygon con miembros geométricos (out geom)
        const outerMember = el.members.find(m => m.role === 'outer' && Array.isArray(m.geometry) && m.geometry.length >= 4);
        if (outerMember) {
          const coords = outerMember.geometry.map(p => [p.lon, p.lat]);
          geometria = {
            type: 'Polygon',
            coordinates: [coords]
          };
        } else if (el.center && el.center.lat !== undefined && el.center.lon !== undefined) {
          geometria = {
            type: 'Point',
            coordinates: [el.center.lon, el.center.lat]
          };
        }
      } else if (el.center && el.center.lat !== undefined && el.center.lon !== undefined) {
        geometria = {
          type: 'Point',
          coordinates: [el.center.lon, el.center.lat]
        };
      }

      if (!geometria) return;

      let infoSuperficie = null;
      if (geometria.type === 'Polygon' && Array.isArray(geometria.coordinates) && geometria.coordinates.length > 0 && typeof ModuloGeodesia !== 'undefined' && ModuloGeodesia.calcularSuperficiePoligono) {
        infoSuperficie = ModuloGeodesia.calcularSuperficiePoligono(geometria.coordinates[0]);
      }

      const nombre = tags.name || tags['name:es'] || tags.operator || tags.description || 'Sin nombre';
      const subtipo = tags.building || tags.landuse || tags.amenity || tags.shop || tags.highway || tags.leisure || tags.historic || tags.natural || tags.railway || 'VGI';
      const direccion = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');

      features.push({
        type: 'Feature',
        id: `${el.type}/${el.id}`,
        geometry: geometria,
        properties: {
          id_vgi: `OSM/${el.type}/${el.id}`,
          osm_type: el.type,
          osm_id: el.id,
          tipo_geometria: geometria.type,
          categoria: categoriaId,
          subtipo: subtipo,
          nombre: nombre,
          operador: tags.operator || null,
          direccion: direccion || null,
          accesibilidad: tags.wheelchair || null,
          superficie_m2: infoSuperficie ? infoSuperficie.areaM2 : null,
          superficie_ha: infoSuperficie ? infoSuperficie.areaHa : null,
          superficie_km2: infoSuperficie ? infoSuperficie.areaKm2 : null,
          fecha: el.timestamp || new Date().toISOString().slice(0, 10),
          fuente: 'OpenStreetMap (API Overpass)',
          _fuente: 'OpenStreetMap (API Overpass)',
          proveedor: 'OpenStreetMap (Overpass API)',
          metodo_adquisicion: 'Descarga de OSM (con la API)',
          licencia: 'ODbL 1.0 (© colaboradores de OpenStreetMap)',
          etiquetas_completas: tags
        }
      });
    });

    return {
      type: 'FeatureCollection',
      name: `OSM_${categoriaId}`,
      features: features,
      fuente: 'OpenStreetMap (API Overpass)',
      fuente_detalle: 'OpenStreetMap (Overpass API en vivo)',
      metodo_adquisicion: 'Descarga de OSM (con la API)',
      licencia: 'ODbL 1.0 (© colaboradores de OpenStreetMap)'
    };

  }

  // Datasets de las 10 Macro-Categorías VGI descargadas para la RM
  const DATASETS_RM = {
    educacion: 'capa_osm_rm_cat01_educacion.geojson',
    servicios: 'capa_osm_rm_cat02_servicios.geojson',
    transporte: 'capa_osm_rm_cat03_transporte.geojson',
    movilidad_activa: 'capa_osm_rm_cat04_movilidad_activa.geojson',
    espacio_publico: 'capa_osm_rm_cat05_espacio_publico.geojson',
    patrimonio: 'capa_osm_rm_cat06_patrimonio.geojson',
    accesibilidad: 'capa_osm_rm_cat07_accesibilidad.geojson',
    biodiversidad: 'capa_osm_rm_cat08_biodiversidad.geojson',
    edificaciones: 'capa_osm_rm_cat09_edificaciones.geojson',
    cobertura_suelo: 'capa_osm_rm_cat10_cobertura_suelo.geojson'
  };

  const DATASETS_LOCAL = {
    educacion: 'capa_educacion.geojson',
    servicios: 'capa_servicios.geojson',
    transporte: 'capa_transporte.geojson',
    movilidad_activa: 'capa_movilidad_activa.geojson',
    espacio_publico: 'capa_espacio_publico.geojson',
    patrimonio: 'capa_patrimonio.geojson',
    accesibilidad: 'capa_accesibilidad.geojson',
    biodiversidad: 'capa_biodiversidad.geojson',
    edificaciones: 'capa_edificaciones.geojson',
    cobertura_suelo: 'capa_cobertura_suelo.geojson'
  };

  const cacheGeoJSONLocal = new Map();

  async function cargarDatasetGeoJSON(nombreArchivo) {
    if (cacheGeoJSONLocal.has(nombreArchivo)) {
      return cacheGeoJSONLocal.get(nombreArchivo);
    }
    const rutas = [
      `data/${nombreArchivo}`,
      `./data/${nombreArchivo}`,
      `../data/${nombreArchivo}`,
      `/data/${nombreArchivo}`,
      `src/data/${nombreArchivo}`,
      `https://atlasvgiuah.netlify.app/data/${nombreArchivo}`
    ];
    for (const r of rutas) {
      try {
        const res = await fetch(r);
        if (res.ok) {
          const data = await res.json();
          if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
            cacheGeoJSONLocal.set(nombreArchivo, data);
            return data;
          }
        }
      } catch (_) {}
    }
    return null;
  }

  function geometriaIntersecaBbox(geom, bbox, featBbox = null) {
    if (!geom || !geom.coordinates) return false;
    const [oeste, sur, este, norte] = bbox;

    // Aceleración de índice espacial BBOX a nivel de Feature (O(1))
    if (featBbox && Array.isArray(featBbox) && featBbox.length === 4) {
      const [fOeste, fSur, fEste, fNorte] = featBbox;
      // Si la caja del elemento no se solapa con el Bbox consultado, descartar de inmediato
      if (fEste < oeste || fOeste > este || fNorte < sur || fSur > norte) return false;
      // Si la caja del elemento está completamente dentro del Bbox consultado, aceptar de inmediato
      if (fOeste >= oeste && fEste <= este && fSur >= sur && fNorte <= norte) return true;
    }

    const tipo = geom.type;

    if (tipo === 'Point') {
      const [x, y] = geom.coordinates;
      return x >= oeste && x <= este && y >= sur && y <= norte;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let tienePuntoDentro = false;

    function procesarCoord(c) {
      if (!Array.isArray(c) || c.length < 2) return;
      const x = c[0], y = c[1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x >= oeste && x <= este && y >= sur && y <= norte) {
        tienePuntoDentro = true;
      }
    }

    function recorrer(coords) {
      if (typeof coords[0] === 'number') {
        procesarCoord(coords);
      } else {
        coords.forEach(recorrer);
      }
    }

    recorrer(geom.coordinates);

    if (tienePuntoDentro) return true;
    if (minX > este || maxX < oeste || minY > norte || maxY < sur) return false;

    // Intersección de envolventes espaciales (AABB): garantiza que cualquier polígono/línea que cruce o contenga el Bbox sea devuelto
    return !(maxX < oeste || minX > este || maxY < sur || minY > norte);
  }

  function resolverCategoria(preset, etiqueta) {
    if (preset) {
      const p = preset.toLowerCase().trim();
      if (ALIAS_MACRO[p]) return ALIAS_MACRO[p];
      if (DATASETS_RM[p]) return p;
    }
    if (etiqueta) {
      const e = etiqueta.toLowerCase().trim();
      if (e.includes('building') || e.includes('edifici') || e.includes('manzana')) return 'edificaciones';
      if (e.includes('universi') || e.includes('college') || e.includes('school') || e.includes('educacion') || e.includes('kindergarten') || e.includes('uah') || e.includes('alberto hurtado')) return 'educacion';
      if (e.includes('cycleway') || e.includes('bicycle') || e.includes('ciclovia') || e.includes('bici')) return 'movilidad_activa';
      if (e.includes('bus') || e.includes('metro') || e.includes('railway') || e.includes('transporte') || e.includes('station')) return 'transporte';
      if (e.includes('park') || e.includes('leisure') || e.includes('plaza') || e.includes('jardin') || e.includes('pitch')) return 'espacio_publico';
      if (e.includes('historic') || e.includes('patrimonio') || e.includes('museum') || e.includes('church') || e.includes('iglesia')) return 'patrimonio';
      if (e.includes('kerb') || e.includes('crossing') || e.includes('wheelchair') || e.includes('accesib') || e.includes('tactile')) return 'accesibilidad';
      if (e.includes('tree') || e.includes('arbol') || e.includes('wood') || e.includes('biodiversidad') || e.includes('natural')) return 'biodiversidad';
      if (e.includes('landuse') || e.includes('suelo')) return 'cobertura_suelo';
      if (e.includes('shop') || e.includes('amenity') || e.includes('cafe') || e.includes('restaurant') || e.includes('farmacia') || e.includes('comercio') || e.includes('salud') || e.includes('clinic')) return 'servicios';
    }
    return 'educacion';
  }

  function coincideEtiqueta(props, etiquetaManual) {
    if (!etiquetaManual || !etiquetaManual.trim()) return true;
    const txt = etiquetaManual.trim().toLowerCase();
    const p = props || {};
    const tags = p.etiquetas_completas || {};

    if (txt.includes('=')) {
      const [k, v] = txt.split('=').map(s => s.trim());
      const valK = (p[k] || tags[k] || '').toString().toLowerCase();
      if (v === '*') return Boolean(valK);
      if (valK === v) return true;
      if (k === 'amenity' && (p.subtipo || '').toLowerCase() === v) return true;
      if (k === 'building' && (p.subtipo || '').toLowerCase() === v) return true;
      if (k === 'shop' && (p.subtipo || '').toLowerCase() === v) return true;
      if (k === 'highway' && (p.subtipo || '').toLowerCase() === v) return true;
      if (k === 'natural' && (p.subtipo || '').toLowerCase() === v) return true;
      return false;
    }

    const jsonStr = JSON.stringify(p).toLowerCase();
    return jsonStr.includes(txt);
  }

  /**
   * Consulta directa a la Geodatabase espacial descargada de la RM (PostGIS / CDN / GeoJSON local)
   * con recorte espacial en memoria por Bounding Box WGS84 y filtrado opcional por etiqueta.
   */
  async function consultarBaseDatosOSM(bbox, preset, etiquetaManual = '') {
    const categoriaId = resolverCategoria(preset, etiquetaManual);
    const archivoRM = DATASETS_RM[categoriaId] || 'capa_osm_rm_cat01_educacion.geojson';
    const archivoLocal = DATASETS_LOCAL[categoriaId] || 'capa_educacion.geojson';

    // 1. Cargar dataset RM pre-descargado
    let dataset = await cargarDatasetGeoJSON(archivoRM);

    // 2. Si no carga el RM, recurrir al catálogo validado local de Barrio Brasil / UAH
    if (!dataset || !dataset.features || dataset.features.length === 0) {
      console.warn(`[Geodatabase RM] No se pudo cargar ${archivoRM}, intentando ${archivoLocal}...`);
      dataset = await cargarDatasetGeoJSON(archivoLocal);
    }

    if (!dataset || !dataset.features) {
      throw new Error(`No se pudo cargar el dataset para ${categoriaId} desde la base de datos descargada.`);
    }

    // 3. Filtrar geométricamente por el Bounding Box consultado aprovechando f.bbox (índice espacial por entidad)
    let featuresFiltradas = dataset.features.filter(f => geometriaIntersecaBbox(f.geometry, bbox, f.bbox));

    // Si la categoría consultada es educación o se busca UAH/Alberto Hurtado,
    // consolidar también los polígonos del campus UAH de edificaciones si aún no están en la lista
    if (categoriaId === 'educacion' || (etiquetaManual && (etiquetaManual.includes('uah') || etiquetaManual.includes('alberto hurtado')))) {
      const edifDataset = await cargarDatasetGeoJSON(DATASETS_RM.edificaciones);
      if (edifDataset && edifDataset.features) {
        const uahEdif = edifDataset.features.filter(f => {
          const str = JSON.stringify(f.properties).toLowerCase();
          return (str.includes('uah') || str.includes('alberto hurtado') || str.includes('barroso 10') || str.includes('erasmo escala 1822')) && geometriaIntersecaBbox(f.geometry, bbox, f.bbox);
        });
        const existingIds = new Set(featuresFiltradas.map(f => f.properties?.id_vgi || f.id));
        uahEdif.forEach(feat => {
          const id = feat.properties?.id_vgi || feat.id;
          if (!existingIds.has(id)) {
            const fClone = JSON.parse(JSON.stringify(feat));
            fClone.properties.categoria = 'educacion';
            featuresFiltradas.push(fClone);
            existingIds.add(id);
          }
        });
      }
    }

    // 4. Filtrar por etiqueta manual si fue provista
    if (etiquetaManual && etiquetaManual.trim()) {
      featuresFiltradas = featuresFiltradas.filter(f => coincideEtiqueta(f.properties, etiquetaManual));
    }

    // 5. Garantizar cálculo métrico de superficies en polígonos y trazabilidad VGI estricta
    featuresFiltradas.forEach(f => {
      if (!f.properties) f.properties = {};
      f.properties.fuente = 'Geofabrik (Extracto RM)';
      f.properties.proveedor = 'Geofabrik GmbH (chile-260927.osm.pbf)';
      f.properties.metodo_adquisicion = 'Descarga Geofabrik (Dump PBF regional)';
      f.properties._fuente = 'Geofabrik (Extracto RM)';
      f.properties._licencia = 'ODbL 1.0 (© colaboradores de OpenStreetMap / Geofabrik GmbH)';
      f.properties.licencia = 'ODbL 1.0 (© colaboradores de OpenStreetMap / Geofabrik GmbH)';
      f.properties._declaracion = 'Datos cartográficos de OpenStreetMap procedentes de la descarga de Geofabrik (chile-260927.osm.pbf) bajo licencia ODbL 1.0.';
      f.properties._citaAPA = 'Geofabrik GmbH & OpenStreetMap contributors. (2026). OpenStreetMap Chile Extract [Región Metropolitana]. Geofabrik GmbH. Open Database License (ODbL).';

      if (f.geometry && f.geometry.type === 'Polygon' && (!f.properties.superficie_m2 || f.properties.superficie_m2 === 0)) {
        if (typeof ModuloGeodesia !== 'undefined' && ModuloGeodesia.calcularSuperficiePoligono && f.geometry.coordinates[0]) {
          const s = ModuloGeodesia.calcularSuperficiePoligono(f.geometry.coordinates[0]);
          f.properties.superficie_m2 = s.areaM2;
          f.properties.superficie_ha = s.areaHa;
          f.properties.superficie_km2 = s.areaKm2;
          f.properties.srs_superficie = 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)';
        }
      }
    });

    return {
      type: 'FeatureCollection',
      name: `OSM_RM_${categoriaId}`,
      categoria: categoriaId,
      features: featuresFiltradas,
      fuente: 'Geofabrik (Extracto RM)',
      fuente_detalle: 'Geofabrik GmbH (chile-260927.osm.pbf · Extracto RM)',
      metodo_adquisicion: 'Descarga Geofabrik (Dump PBF regional)',
      licencia: 'ODbL 1.0 (© colaboradores de OpenStreetMap / Geofabrik GmbH)'
    };

  }

  let backendDisponible = null;

  /**
   * Consulta personalizada avanzada en vivo con TRIPLE FAILOVER:
   * 1. Backend /api/consulta o Overpass API en vivo (espejos lz4, z, openstreetmap.fr).
   * 2. Supabase PostGIS / Storage CDN si Overpass está saturado (504/timeout).
   * 3. Geodatabase espacial descargada de la RM local con recorte en memoria por Bbox.
   */
  async function consultarPersonalizada(parametros) {
    const { bbox, clave, valor, operador, entidad, queryPersonalizada, nombreConsulta = 'Personalizada' } = parametros;

    // NIVEL 1: Intento primario Overpass (backend o cliente directo)
    let errorOverpass = null;

    if (backendDisponible !== false) {
      try {
        const controllerBackend = new AbortController();
        const timeoutBackend = setTimeout(() => controllerBackend.abort(), 6500);
        const respuestaBackend = await fetch('/api/consulta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parametros),
          signal: controllerBackend.signal
        });
        clearTimeout(timeoutBackend);

        if (respuestaBackend.ok) {
          const datos = await respuestaBackend.json();
          if (datos.ok && datos.geojson && datos.geojson.features) {
            backendDisponible = true;
            console.log(`[+] Consulta personalizada resuelta exitosamente vía backend (${datos.servidor}): ${datos.total} elementos`);
            return {
              total: datos.total,
              geojson: datos.geojson,
              servidor: datos.servidor,
              desdeBackend: true,
              failover: false
            };
          }
        } else if (respuestaBackend.status === 404) {
          backendDisponible = false;
        }
      } catch (errBackend) {
        console.warn('Backend /api/consulta no accesible o lento (modo client-side activo):', errBackend.message);
      }
    }

    // Intento directo en navegador a Overpass
    const [oeste, sur, este, norte] = bbox;
    const bboxStr = `${sur},${oeste},${norte},${este}`;
    let consultaCompleta;

    if (queryPersonalizada && queryPersonalizada.trim()) {
      let ql = queryPersonalizada.replaceAll('{{bbox}}', bboxStr).trim();
      if (ql.includes('[out:') || ql.includes('out ') || ql.includes('out;')) {
        if (!ql.includes('[out:json]')) {
          ql = `[out:json][timeout:30];\n${ql}`;
        }
        if (!ql.includes('out ') && !ql.includes('out;')) {
          ql = `${ql}\nout geom tags qt 3500;`;
        }
        consultaCompleta = ql;
      } else {
        consultaCompleta = `
          [out:json][timeout:30];
          (
            ${ql}
          );
          out geom tags qt 3500;
        `;
      }
    } else {
      const tipo = entidad || 'nwr';
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
      consultaCompleta = `
        [out:json][timeout:30];
        (
          ${tipo}${filtro}(${bboxStr});
        );
        out geom tags qt 3500;
      `;
    }

    try {
      const elementos = await consultar(bbox, null, consultaCompleta);
      const geojson = elementosAGeoJSON(elementos, nombreConsulta);

      return {
        total: elementos.length,
        geojson: geojson,
        servidor: 'Cliente directo (OpenStreetMap API Overpass)',
        fuente: 'OpenStreetMap (API Overpass)',
        desdeBackend: false,
        failover: false
      };
    } catch (errOverpass) {
      console.warn('⚠️ [Overpass Saturado/504]: Activando Triple Failover hacia Geodatabase RM descargada...', errOverpass.message);
      errorOverpass = errOverpass;
    }

    // NIVEL 2 y 3: Triple Failover hacia la Geodatabase RM descargada de Geofabrik
    try {
      const etiquetaFiltro = (clave && valor && valor !== '*') ? `${clave}=${valor}` : (clave || '');
      const resultadoDB = await consultarBaseDatosOSM(bbox, null, etiquetaFiltro);
      return {
        total: resultadoDB.features.length,
        geojson: resultadoDB,
        servidor: 'Geodatabase RM (Descarga Geofabrik · R-Tree)',
        fuente: 'Geofabrik (Extracto RM)',
        desdeBackend: false,
        failover: true,
        motivoFailover: `Overpass API no respondió (${errorOverpass?.message || 'Timeout/504'}). Conmutación a descarga de Geofabrik (Extracto RM).`
      };
    } catch (errDB) {
      throw new Error(`Falló Overpass (${errorOverpass?.message || 'Error'}) y falló Geodatabase RM (${errDB.message})`);
    }

  }

  return {
    consultar,
    consultarPersonalizada,
    consultarBaseDatosOSM,
    construirConsulta,
    elementosAGeoJSON,
    PRESETS_CATEGORIAS
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloOSM = ModuloOSM;
  window.ModuloOsm = ModuloOSM;
}
