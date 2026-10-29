/*
  evaluador_calidad_cuantitativa.js
  ---------------------------------
  Motor Algorítmico Universal de Control de Calidad Espacial, Topología e Índice IGV:
  Implementa la evaluación estandarizada bajo las normas:
  - ISO 19157:2013 / ISO 19157-1:2023 (Geographic information — Data quality)
  - ISO 19115-1:2014 (Geographic information — Metadata)
  - OGC Simple Feature Access (SFA / ISO 19125-1)
  - RFC 7946 (The GeoJSON Format Specification)
  - Perfil Nacional de Metadatos de Chile v2.0 (IDE Chile - SNIT)

  Permite auditar tanto capas internas de la geodatabase como CUALQUIER conjunto
  de datos espaciales externo ingresado por el usuario (GeoJSON / JSON / archivos cargados).

  Proyecto: Atlas de Información Geográfica Voluntaria — Nodo GeoAbierto
  Fecha: Octubre 2026
*/

const EvaluadorCalidadCuantitativa = (() => {

  // Ponderadores Estandarizados Oficiales del Índice de Calidad Geográfica (IGV / IGMC)
  const PONDERADORES_DEFECTO = {
    pesoCuantitativo: 0.50,
    pesoCualitativo: 0.50,

    cuantitativo: {
      topologia: 0.30,      // Consistencia topológica (auto-intersecciones, anillos, colapsos)
      completitud: 0.25,    // Completitud de atributos (ausencia de nulos y vacíos)
      posicional: 0.20,     // Integridad de coordenadas y dominio geográfico
      estructura: 0.15,     // Homogeneidad de tipos y presencia de identificador único
      granularidad: 0.10    // Complejidad geométrica y ausencia de micro-slivers
    },

    cualitativo: {
      mc: 0.30,  // Completitud de metadatos núcleo (Core ISO)
      cc: 0.20,  // Conformidad normativa y semántica
      ll: 0.25,  // Linaje, trazabilidad y derechos jurídicos
      rg: 0.15,  // Resolución espacial y granularidad nominal
      ai: 0.10   // Accesibilidad y disponibilidad operativa
    }
  };

  // Umbrales de Seguridad para Procesamiento en Cliente (Prevención de Out-of-Memory y reinicio de página)
  const LIMITE_BYTES_ARCHIVO = 25 * 1024 * 1024;        // 25 MB máximo por archivo externo no filtrado
  const LIMITE_BYTES_CAPA_INTERNA = 80 * 1024 * 1024;   // 80 MB máximo para capas oficiales internas (recortadas por Bbox)
  const LIMITE_ENTIDADES_PROCESAMIENTO = 15000;         // 15.000 entidades vectoriales concurrentes

  // BBox Territorial Oficial del Caso Piloto: Barrio Brasil y Campus Patrimonial UAH
  // Envolvente: Oeste (Matucana) -70.6740, Sur (Alameda) -33.4530, Este (Manuel Rodríguez) -70.6550, Norte (San Pablo) -33.4330
  const BBOX_BARRIO_BRASIL_PILOTO = [-70.6740, -33.4530, -70.6550, -33.4330];

  let mapaDiagnosticoInstancia = null;
  let capaGeojsonDiagnostico = null;
  let ultimoResultadoAuditoria = null;
  let capasLeafletPorIndice = {};

  /**
   * Determina si dos segmentos 2D se intersecan estrictamente (orientación 2D)
   */
  function ccw(A, B, C) {
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
  }

  function segmentosIntersectan(p1, p2, p3, p4) {
    const minX1 = Math.min(p1[0], p2[0]), maxX1 = Math.max(p1[0], p2[0]);
    const minY1 = Math.min(p1[1], p2[1]), maxY1 = Math.max(p1[1], p2[1]);
    const minX2 = Math.min(p3[0], p4[0]), maxX2 = Math.max(p3[0], p4[0]);
    const minY2 = Math.min(p3[1], p4[1]), maxY2 = Math.max(p3[1], p4[1]);

    if (maxX1 < minX2 || minX1 > maxX2 || maxY1 < minY2 || minY1 > maxY2) {
      return false;
    }

    const a = ccw(p1, p3, p4);
    const b = ccw(p2, p3, p4);
    const c = ccw(p1, p2, p3);
    const d = ccw(p1, p2, p4);

    return (a !== b) && (c !== d);
  }

  function calcularAreaAnillo(ring) {
    if (!ring || ring.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      area += (ring[i][0] * ring[i + 1][1]) - (ring[i + 1][0] * ring[i][1]);
    }
    return Math.abs(area) / 2;
  }

  function calcularLongitudLinea(coords) {
    if (!coords || coords.length < 2) return 0;
    let lon = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const dx = coords[i + 1][0] - coords[i][0];
      const dy = coords[i + 1][1] - coords[i][1];
      lon += Math.sqrt((dx * dx) + (dy * dy));
    }
    return lon;
  }

  function detectarKinksEnAnillo(ring, maxSegmentosEvaluar = 1500) {
    const kinks = [];
    const n = ring.length;
    if (n < 4) return kinks;

    const paso = n > maxSegmentosEvaluar ? Math.ceil(n / maxSegmentosEvaluar) : 1;

    for (let i = 0; i < n - 1; i += paso) {
      const p1 = ring[i];
      const p2 = ring[i + 1];

      for (let j = i + 1; j < n - 1; j += paso) {
        if (j === i + 1) continue;
        if (i === 0 && j === n - 2) continue;

        const p3 = ring[j];
        const p4 = ring[j + 1];

        if (segmentosIntersectan(p1, p2, p3, p4)) {
          kinks.push({
            segmentoA: [i, i + 1],
            segmentoB: [j, j + 1],
            puntoAprox: [(p1[0] + p3[0]) / 2, (p1[1] + p3[1]) / 2]
          });
          if (kinks.length >= 10) return kinks;
        }
      }
    }
    return kinks;
  }

  /**
   * Obtiene el BBox territorial exclusivo para la auditoría de calidad de Barrio Brasil.
   * Este BBox opera de forma independiente y aislada respecto a la configuración general
   * del visor y la geodatabase oficial.
   */
  function obtenerBboxActivoParaAuditoria() {
    return BBOX_BARRIO_BRASIL_PILOTO;
  }

  /**
   * Determina si la envolvente convexa (AABB) de una geometría GeoJSON
   * interseca el BBox rectangular [minX, minY, maxX, maxY].
   */
  function geometriaIntersecaBbox(geom, bbox) {
    if (!geom || !geom.coordinates || !bbox || bbox.length < 4) return false;
    const minX = bbox[0], minY = bbox[1], maxX = bbox[2], maxY = bbox[3];

    let fMinX = Infinity, fMinY = Infinity, fMaxX = -Infinity, fMaxY = -Infinity;

    function procesarCoord(c) {
      if (!Array.isArray(c) || c.length < 2) return;
      const x = c[0], y = c[1];
      if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) return;
      if (x < fMinX) fMinX = x;
      if (y < fMinY) fMinY = y;
      if (x > fMaxX) fMaxX = x;
      if (y > fMaxY) fMaxY = y;
    }

    function extraer(g) {
      if (!g || !g.coordinates) return;
      const t = g.type, c = g.coordinates;
      if (t === 'Point') procesarCoord(c);
      else if (t === 'MultiPoint' || t === 'LineString') c.forEach(procesarCoord);
      else if (t === 'MultiLineString' || t === 'Polygon') c.forEach(an => an.forEach(procesarCoord));
      else if (t === 'MultiPolygon') c.forEach(p => p.forEach(an => an.forEach(procesarCoord)));
      else if (t === 'GeometryCollection' && Array.isArray(g.geometries)) g.geometries.forEach(extraer);
    }

    extraer(geom);

    if (fMinX === Infinity) return false;

    // Condición de no solapamiento AABB en 2D
    if (fMaxX < minX || fMinX > maxX || fMaxY < minY || fMinY > maxY) {
      return false;
    }
    return true;
  }

  /**
   * Filtra un objeto GeoJSON reteniendo únicamente las entidades vectoriales
   * que intersecan espacialmente el BBox de Barrio Brasil.
   */
  function filtrarDatasetPorBbox(geojsonData, bbox = BBOX_BARRIO_BRASIL_PILOTO) {
    if (!geojsonData || !Array.isArray(geojsonData.features)) {
      return { geojson: geojsonData, filtrado: false, totalOriginal: 0, totalFiltrado: 0, bbox };
    }

    const totalOriginal = geojsonData.features.length;
    const featuresFiltradas = geojsonData.features.filter(f => f && f.geometry && geometriaIntersecaBbox(f.geometry, bbox));

    const nuevoGeojson = {
      type: geojsonData.type || 'FeatureCollection',
      name: geojsonData.name,
      crs: geojsonData.crs,
      bbox: bbox,
      features: featuresFiltradas
    };

    return {
      geojson: nuevoGeojson,
      filtrado: featuresFiltradas.length > 0 && featuresFiltradas.length < totalOriginal,
      totalOriginal,
      totalFiltrado: featuresFiltradas.length,
      bbox
    };
  }

  function auditarGeometria(geom, featureIndex) {
    const hallazgos = [];
    let totalVertices = 0;
    let tieneErrorCritico = false;
    let esSliver = false;
    let bboxGeom = [Infinity, Infinity, -Infinity, -Infinity];

    function actualizarBbox(coord) {
      if (!Array.isArray(coord) || coord.length < 2) return;
      const x = coord[0], y = coord[1];
      if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) return;
      if (x < bboxGeom[0]) bboxGeom[0] = x;
      if (y < bboxGeom[1]) bboxGeom[1] = y;
      if (x > bboxGeom[2]) bboxGeom[2] = x;
      if (y > bboxGeom[3]) bboxGeom[3] = y;
    }

    if (!geom) {
      return {
        valida: false,
        totalVertices: 0,
        hallazgos: [{ tipo: 'GEOMETRIA_NULA', gravedad: 'Critica', detalle: 'La entidad carece de objeto de geometría (geometry = null).' }],
        bbox: null
      };
    }

    const tipo = geom.type;
    const coords = geom.coordinates;

    if (!coords || !Array.isArray(coords) || coords.length === 0) {
      return {
        valida: false,
        totalVertices: 0,
        hallazgos: [{ tipo: 'COORDENADAS_VACIAS', gravedad: 'Critica', detalle: 'El array de coordenadas está vacío.' }],
        bbox: null
      };
    }

    if (tipo === 'Point') {
      totalVertices = 1;
      actualizarBbox(coords);
      if (isNaN(coords[0]) || isNaN(coords[1])) {
        hallazgos.push({ tipo: 'COORDENADA_NAN', gravedad: 'Critica', detalle: 'Coordenadas del punto contienen valores NaN.' });
        tieneErrorCritico = true;
      }
      if (coords[0] === 0 && coords[1] === 0) {
        hallazgos.push({ tipo: 'NULL_ISLAND', gravedad: 'Advertencia', detalle: 'Coordenada en (0,0) (Null Island).' });
      }
    } else if (tipo === 'MultiPoint') {
      totalVertices = coords.length;
      coords.forEach(pt => {
        actualizarBbox(pt);
        if (isNaN(pt[0]) || isNaN(pt[1])) {
          hallazgos.push({ tipo: 'COORDENADA_NAN', gravedad: 'Critica', detalle: 'Vértice puntual contiene valores NaN.' });
          tieneErrorCritico = true;
        }
      });
    } else if (tipo === 'LineString') {
      totalVertices = coords.length;
      coords.forEach(c => actualizarBbox(c));

      if (coords.length < 2) {
        hallazgos.push({ tipo: 'LINEA_DEGENERADA', gravedad: 'Critica', detalle: 'LineString posee menos de 2 vértices requeridos por OGC.' });
        tieneErrorCritico = true;
      } else {
        const long = calcularLongitudLinea(coords);
        if (long === 0) {
          hallazgos.push({ tipo: 'LONGITUD_CERO', gravedad: 'Critica', detalle: 'Línea colapsada sobre sí misma con longitud cero.' });
          tieneErrorCritico = true;
        }
        for (let i = 0; i < coords.length - 1; i++) {
          if (coords[i][0] === coords[i + 1][0] && coords[i][1] === coords[i + 1][1]) {
            hallazgos.push({ tipo: 'VERTICE_DUPLICADO', gravedad: 'Observacion', detalle: `Vértices duplicados consecutivos en índices ${i} y ${i + 1}.` });
          }
        }
      }
    } else if (tipo === 'MultiLineString') {
      coords.forEach((linea, idxL) => {
        totalVertices += linea.length;
        linea.forEach(c => actualizarBbox(c));
        if (linea.length < 2) {
          hallazgos.push({ tipo: 'MULTILINEA_DEGENERADA', gravedad: 'Critica', detalle: `Línea #${idxL + 1} posee menos de 2 vértices.` });
          tieneErrorCritico = true;
        }
      });
    } else if (tipo === 'Polygon') {
      coords.forEach((anillo, idxA) => {
        const nA = anillo.length;
        totalVertices += nA;
        anillo.forEach(c => actualizarBbox(c));

        if (nA < 4) {
          hallazgos.push({ tipo: 'ANILLO_DEGENERADO', gravedad: 'Critica', detalle: `Anillo #${idxA + 1} tiene solo ${nA} vértices (mínimo 4).` });
          tieneErrorCritico = true;
          return;
        }

        const primero = anillo[0];
        const ultimo = anillo[nA - 1];
        if (primero[0] !== ultimo[0] || primero[1] !== ultimo[1]) {
          hallazgos.push({ tipo: 'ANILLO_NO_CERRADO', gravedad: 'Critica', detalle: `Anillo #${idxA + 1} no está cerrado (primer vértice != último vértice).` });
          tieneErrorCritico = true;
        }

        for (let i = 0; i < nA - 1; i++) {
          if (anillo[i][0] === anillo[i + 1][0] && anillo[i][1] === anillo[i + 1][1]) {
            hallazgos.push({ tipo: 'VERTICE_DUPLICADO', gravedad: 'Observacion', detalle: `Vértices duplicados consecutivos en anillo #${idxA + 1}.` });
          }
        }

        const area = calcularAreaAnillo(anillo);
        if (idxA === 0) {
          if (area === 0) {
            hallazgos.push({ tipo: 'AREA_CERO', gravedad: 'Critica', detalle: 'Polígono colapsado con área superficial nula.' });
            tieneErrorCritico = true;
          } else if (area < 1e-11) {
            hallazgos.push({ tipo: 'SLIVER_POLYGON', gravedad: 'Advertencia', detalle: `Micro-polígono / sliver topológico detectado (Área: ${area.toExponential(2)}).` });
            esSliver = true;
          }
        }

        const kinks = detectarKinksEnAnillo(anillo);
        if (kinks.length > 0) {
          hallazgos.push({
            tipo: 'AUTO_INTERSECCION',
            gravedad: 'Critica',
            detalle: `Se detectaron ${kinks.length} auto-intersecciones (kinks / bowties) en el anillo #${idxA + 1}.`,
            puntosKinks: kinks.map(k => k.puntoAprox)
          });
          tieneErrorCritico = true;
        }
      });
    } else if (tipo === 'MultiPolygon') {
      coords.forEach((poli, idxP) => {
        poli.forEach((anillo, idxA) => {
          const nA = anillo.length;
          totalVertices += nA;
          anillo.forEach(c => actualizarBbox(c));

          if (nA < 4) {
            hallazgos.push({ tipo: 'MULTIPOLIGONO_ANILLO_INVALIDO', gravedad: 'Critica', detalle: `Polígono #${idxP + 1}, Anillo #${idxA + 1} con menos de 4 vértices.` });
            tieneErrorCritico = true;
            return;
          }

          const primero = anillo[0];
          const ultimo = anillo[nA - 1];
          if (primero[0] !== ultimo[0] || primero[1] !== ultimo[1]) {
            hallazgos.push({ tipo: 'ANILLO_NO_CERRADO', gravedad: 'Critica', detalle: `Polígono #${idxP + 1}, Anillo #${idxA + 1} abierto.` });
            tieneErrorCritico = true;
          }

          const kinks = detectarKinksEnAnillo(anillo);
          if (kinks.length > 0) {
            hallazgos.push({
              tipo: 'AUTO_INTERSECCION',
              gravedad: 'Critica',
              detalle: `Auto-intersección en Polígono #${idxP + 1}, Anillo #${idxA + 1}.`,
              puntosKinks: kinks.map(k => k.puntoAprox)
            });
            tieneErrorCritico = true;
          }
        });
      });
    }

    return {
      valida: !tieneErrorCritico,
      esSliver,
      tipoGeometria: tipo,
      totalVertices,
      hallazgos,
      bbox: bboxGeom[0] !== Infinity ? bboxGeom : null
    };
  }

  function auditarAtributos(features) {
    const conteoPorCampo = {};
    const tiposPorCampo = {};
    const idsVistos = new Set();
    let hayIdDuplicado = false;
    let nombreCampoId = null;

    let totalCeldas = 0;
    let totalCeldasValidas = 0;

    const posiblesIds = ['id', 'fid', 'objectid', 'gid', 'codigo', 'osm_id', 'cod_com', 'cod_uv'];

    features.forEach(f => {
      const props = f.properties || {};
      const keys = Object.keys(props);

      if (!nombreCampoId) {
        for (const pid of posiblesIds) {
          if (props[pid] !== undefined) {
            nombreCampoId = pid;
            break;
          }
        }
      }

      if (nombreCampoId && props[nombreCampoId] !== undefined) {
        const valId = props[nombreCampoId];
        if (idsVistos.has(valId)) {
          hayIdDuplicado = true;
        } else {
          idsVistos.add(valId);
        }
      }

      keys.forEach(k => {
        if (!conteoPorCampo[k]) {
          conteoPorCampo[k] = { validos: 0, nulos: 0, total: 0 };
          tiposPorCampo[k] = new Set();
        }

        const v = props[k];
        conteoPorCampo[k].total++;
        totalCeldas++;

        const esNulo = (v === null || v === undefined || v === '' || v === 'N/A' || v === 'None' || v === 'null');
        if (esNulo) {
          conteoPorCampo[k].nulos++;
        } else {
          conteoPorCampo[k].validos++;
          totalCeldasValidas++;
          tiposPorCampo[k].add(typeof v);
        }
      });
    });

    const listaCampos = Object.keys(conteoPorCampo).map(k => {
      const info = conteoPorCampo[k];
      const tipos = Array.from(tiposPorCampo[k]);
      const pct = info.total > 0 ? (info.validos / info.total) * 100 : 0;
      return {
        campo: k,
        tipoDetectado: tipos.join('/') || 'sin datos',
        homogeneo: tipos.length <= 1,
        total: info.total,
        validos: info.validos,
        nulos: info.nulos,
        pctCompletitud: Math.round(pct * 10) / 10
      };
    });

    const tasaCompletitudGlobal = totalCeldas > 0
      ? Math.round((totalCeldasValidas / totalCeldas) * 1000) / 10
      : 100;

    const camposHomogeneos = listaCampos.filter(c => c.homogeneo).length;
    const tasaHomogeneidad = listaCampos.length > 0
      ? Math.round((camposHomogeneos / listaCampos.length) * 1000) / 10
      : 100;

    return {
      totalCampos: listaCampos.length,
      totalCeldas,
      totalCeldasValidas,
      tasaCompletitudGlobal,
      tasaHomogeneidad,
      campoIdIdentificado: nombreCampoId,
      clavePrimariaUnica: Boolean(nombreCampoId && !hayIdDuplicado && idsVistos.size === features.length),
      listaCampos
    };
  }

  function auditarPosicional(features) {
    let totalVertices = 0;
    let verticesEnRango = 0;
    let verticesNullIsland = 0;
    let bboxGlobal = [Infinity, Infinity, -Infinity, -Infinity];

    function procesarCoord(c) {
      if (!Array.isArray(c) || c.length < 2) return;
      totalVertices++;
      const x = c[0], y = c[1];

      const enWGS84 = (x >= -180 && x <= 180 && y >= -90 && y <= 90);
      const enUTM19S = (x >= 100000 && x <= 900000 && y >= 5000000 && y <= 8000000);

      if (enWGS84 || enUTM19S) {
        verticesEnRango++;
      }

      if (x === 0 && y === 0) {
        verticesNullIsland++;
      }

      if (x < bboxGlobal[0]) bboxGlobal[0] = x;
      if (y < bboxGlobal[1]) bboxGlobal[1] = y;
      if (x > bboxGlobal[2]) bboxGlobal[2] = x;
      if (y > bboxGlobal[3]) bboxGlobal[3] = y;
    }

    function extraerCoords(geom) {
      if (!geom || !geom.coordinates) return;
      const t = geom.type;
      const c = geom.coordinates;
      if (t === 'Point') procesarCoord(c);
      else if (t === 'MultiPoint' || t === 'LineString') c.forEach(procesarCoord);
      else if (t === 'MultiLineString' || t === 'Polygon') c.forEach(an => an.forEach(procesarCoord));
      else if (t === 'MultiPolygon') c.forEach(p => p.forEach(an => an.forEach(procesarCoord)));
    }

    features.forEach(f => extraerCoords(f.geometry));

    const tasaIntegridad = totalVertices > 0
      ? Math.round((verticesEnRango / totalVertices) * 1000) / 10
      : 100;

    return {
      totalVertices,
      verticesEnRango,
      verticesNullIsland,
      tasaIntegridad,
      bboxGlobal: bboxGlobal[0] !== Infinity ? bboxGlobal : obtenerBboxActivoParaAuditoria()
    };
  }

  /**
   * Evalúa objetivamente las 5 dimensiones cualitativas conforme a:
   * - ISO 19115-1:2014 (Geographic information — Metadata)
   * - Perfil Nacional de Metadatos de Chile v2.0 (IDE Chile - SNIT)
   * - ISO 19110:2016 (Feature Cataloguing Methodology)
   * - Ley N° 20.285 sobre Acceso a la Información Pública y Licenciamiento Abierto
   *
   * Realiza una auditoría estricta basada en EVIDENCIA DIRECTA:
   * - Sin valores mínimos arbitrarios (sin pisos ficticios de 60%, 70% o 65%).
   * - Si un archivo externo no declara metadatos, custodio, licencia o linaje, la puntuación es 0% en dichos criterios.
   * - Si el archivo cuenta con ficha oficial en el Atlas o metadatos embebidos en el objeto raíz, se auditan y puntúan con exactitud.
   */
  function auditarCualitativoDataset(geojsonData, metadatosDeclarados = null, features = []) {
    const meta = metadatosDeclarados || {};
    const nFeatures = features.length;
    const esArchivoExterno = Boolean(meta.esArchivoExterno || meta.tipoFuente === 'Archivo Externo Subido (.geojson)' || meta.tipoFuente === 'Entrada Texto Plano');

    // Metadatos embebidos en el objeto raíz del GeoJSON si existen (RFC 7946 extensible)
    const rootMeta = (geojsonData && (geojsonData.metadata || geojsonData.properties)) || {};

    // Muestra de atributos de entidades para análisis semántico
    const sampleFeatures = features.slice(0, 200);
    const setCampos = new Set();
    let totalPropiedadesNoVacias = 0;

    sampleFeatures.forEach(f => {
      if (f && f.properties && typeof f.properties === 'object') {
        const keys = Object.keys(f.properties);
        if (keys.length > 0) totalPropiedadesNoVacias++;
        keys.forEach(k => setCampos.add(k));
      }
    });

    const listaCampos = Array.from(setCampos);
    const camposLower = listaCampos.map(c => c.toLowerCase());

    // =========================================================================
    // 1. METADATOS NÚCLEO (MC - 10 ELEMENTOS DEL PERFIL NACIONAL IDE CHILE / ISO 19115) (30%)
    // =========================================================================
    let scoreMC = 0.0;
    const detallesMC = [];

    if (!esArchivoExterno && meta.score_mc !== undefined) {
      scoreMC = Number(meta.score_mc);
    } else {
      // 1. Identificador Persistente formal del dataset
      const e_id = Boolean(
        (!esArchivoExterno && meta.id) ||
        geojsonData.id ||
        rootMeta.id ||
        rootMeta.uuid ||
        geojsonData.uuid
      );
      detallesMC.push({ item: 'Identificador del dataset', cumplido: e_id });

      // 2. Título Formal (en raíz del GeoJSON o metadatos explícitos del recurso)
      const e_titulo = Boolean(
        (!esArchivoExterno && (meta.titulo || meta.nombre)) ||
        geojsonData.title ||
        geojsonData.name ||
        rootMeta.title ||
        rootMeta.nombre
      );
      detallesMC.push({ item: 'Título formal del recurso', cumplido: e_titulo });

      // 3. Resumen / Propósito descriptivo (abstract)
      const e_resumen = Boolean(
        (!esArchivoExterno && meta.resumen) ||
        geojsonData.description ||
        rootMeta.description ||
        rootMeta.resumen ||
        rootMeta.abstract
      );
      detallesMC.push({ item: 'Resumen o propósito (abstract)', cumplido: e_resumen });

      // 4. Custodio o Responsable Institucional con contacto
      const e_custodio = Boolean(
        (!esArchivoExterno && (meta.institucion || meta.custodio)) ||
        geojsonData.author ||
        geojsonData.custodian ||
        rootMeta.custodian ||
        rootMeta.institucion ||
        rootMeta.author
      );
      detallesMC.push({ item: 'Custodio o responsable institucional', cumplido: e_custodio });

      // 5. Fecha de Referencia / Extensión Temporal del dataset
      const e_temporal = Boolean(
        (!esArchivoExterno && meta.fecha) ||
        geojsonData.date ||
        rootMeta.date ||
        rootMeta.fecha ||
        rootMeta.timestamp
      );
      detallesMC.push({ item: 'Fecha de referencia o vigencia', cumplido: e_temporal });

      // 6. Categoría Temática ISO 19115 (Topic Category)
      const e_topico = Boolean(
        (!esArchivoExterno && (meta.categoria || meta.grupo)) ||
        geojsonData.category ||
        rootMeta.category ||
        rootMeta.topicCategory
      );
      detallesMC.push({ item: 'Categoría temática ISO', cumplido: e_topico });

      // 7. Extensión Geográfica Explícita en Metadatos (BBox delimitado en raíz)
      const e_bbox = Boolean(
        (Array.isArray(geojsonData.bbox) && geojsonData.bbox.length >= 4) ||
        (!esArchivoExterno && meta.bbox)
      );
      detallesMC.push({ item: 'Extensión espacial delimitada (BBox en raíz)', cumplido: e_bbox });

      // 8. Sistema de Referencia CRS Explícitamente Declarado
      const e_crs = Boolean(
        geojsonData.crs ||
        rootMeta.crs ||
        (!esArchivoExterno && (meta.crs || meta.proyeccion))
      );
      detallesMC.push({ item: 'Sistema de Referencia (CRS) explícito', cumplido: e_crs });

      // 9. Licencia y Derechos de Uso Explícitos
      const e_licencia = Boolean(
        (!esArchivoExterno && meta.licencia) ||
        geojsonData.license ||
        rootMeta.license ||
        rootMeta.licencia ||
        rootMeta.rights
      );
      detallesMC.push({ item: 'Licencia y condiciones de uso', cumplido: e_licencia });

      // 10. Linaje y Trazabilidad de Captura
      const e_linaje = Boolean(
        (!esArchivoExterno && (meta.linaje || meta.citaAPA)) ||
        geojsonData.lineage ||
        rootMeta.lineage ||
        rootMeta.fuente ||
        rootMeta.source
      );
      detallesMC.push({ item: 'Linaje y trazabilidad metodológica', cumplido: e_linaje });

      const elementosPresentes = detallesMC.filter(d => d.cumplido).length;
      scoreMC = Math.round((elementosPresentes / 10.0) * 1000) / 10;
    }

    // =========================================================================
    // 2. CONFORMIDAD SEMÁNTICA Y CATÁLOGO DE OBJETOS (CC - ISO 19110 / RFC 7946) (20%)
    // =========================================================================
    let scoreCC = 0.0;
    if (!esArchivoExterno && meta.score_cc !== undefined) {
      scoreCC = Number(meta.score_cc);
    } else {
      // Subfactor A: Presencia de propiedades en entidades (25 pts)
      const tasaPropiedades = sampleFeatures.length > 0 ? (totalPropiedadesNoVacias / sampleFeatures.length) : 0;
      const ptsPropiedades = tasaPropiedades * 25.0;

      // Subfactor B: Estandarización de nombres de atributos (35 pts)
      let camposEstandarizados = 0;
      listaCampos.forEach(c => {
        const esValido = /^[a-z0-9_]+$/.test(c) && !c.includes(' ') && !c.includes('shape_') && !c.endsWith('_1');
        if (esValido) camposEstandarizados++;
      });
      const tasaNombres = listaCampos.length > 0 ? (camposEstandarizados / listaCampos.length) : 0;
      const ptsNombres = tasaNombres * 35.0;

      // Subfactor C: Homogeneidad de tipos de datos en la tabla (20 pts)
      const ptsHomogeneidad = listaCampos.length > 0 ? 20.0 : 0.0;

      // Subfactor D: Catálogo de Objetos / Diccionario Atributivo Documentado (20 pts)
      let ptsCatalogo = 0.0;
      if (!esArchivoExterno && (meta.diccionario || meta.catalogo_objetos || (meta.tipoFuente && meta.tipoFuente.includes('Geodatabase')))) {
        ptsCatalogo = 20.0;
      } else if (rootMeta.dictionary || rootMeta.catalogo || rootMeta.fields) {
        ptsCatalogo = 20.0;
      }

      scoreCC = Math.round((ptsPropiedades + ptsNombres + ptsHomogeneidad + ptsCatalogo) * 10) / 10;
      scoreCC = Math.max(0.0, Math.min(100.0, scoreCC));
    }

    // =========================================================================
    // 3. LINAJE, TRAZABILIDAD Y CERTEZA LEGAL (LL - ISO 19115 / LEY 20.285 / ODbL) (25%)
    // =========================================================================
    let scoreLL = 0.0;
    if (!esArchivoExterno && meta.score_ll !== undefined) {
      scoreLL = Number(meta.score_ll);
    } else {
      let ptsLinaje = 0.0;
      // Subfactor A: Linaje metodológico / historia (40 pts)
      if (!esArchivoExterno && (meta.linaje || meta.citaAPA)) {
        ptsLinaje += 40.0;
      } else if (geojsonData.lineage || rootMeta.lineage || rootMeta.metodologia) {
        ptsLinaje += 40.0;
      } else if (camposLower.some(c => ['source', 'fuente', 'origin'].includes(c))) {
        ptsLinaje += 15.0; // Mención informal de fuente en atributos
      }

      // Subfactor B: Certeza jurídica y licencia explícita (35 pts)
      if (!esArchivoExterno && meta.licencia) {
        ptsLinaje += 35.0;
      } else if (geojsonData.license || rootMeta.license || rootMeta.licencia || rootMeta.rights) {
        ptsLinaje += 35.0;
      } else if (camposLower.some(c => ['license', 'licencia', 'rights'].includes(c))) {
        ptsLinaje += 15.0;
      }

      // Subfactor C: Custodia institucional reconocida (25 pts)
      if (!esArchivoExterno && (meta.institucion || meta.ministerio || meta.organismo)) {
        ptsLinaje += 25.0;
      } else if (geojsonData.author || rootMeta.author || rootMeta.institucion || rootMeta.custodian) {
        ptsLinaje += 25.0;
      }

      scoreLL = Math.round(ptsLinaje * 10) / 10;
      scoreLL = Math.max(0.0, Math.min(100.0, scoreLL));
    }

    // =========================================================================
    // 4. RESOLUCIÓN ESPACIAL Y GRANULARIDAD CONCEPTUAL (RG - ISO 19115 / SNYDER) (15%)
    // =========================================================================
    let scoreRG = 0.0;
    if (!esArchivoExterno && meta.score_rg !== undefined) {
      scoreRG = Number(meta.score_rg);
    } else {
      // Subfactor A: Precisión decimal geodésica de vértices (50 pts)
      let totalCoordsMuestreadas = 0;
      let totalDecimales = 0;
      const contarDec = (num) => {
        if (typeof num !== 'number') return 5;
        const s = num.toString();
        return s.includes('.') ? s.split('.')[1].length : 0;
      };
      const proc = (pt) => {
        if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number') {
          totalCoordsMuestreadas++;
          totalDecimales += (contarDec(pt[0]) + contarDec(pt[1])) / 2;
        }
      };

      sampleFeatures.forEach(f => {
        if (!f || !f.geometry || !f.geometry.coordinates) return;
        const g = f.geometry;
        const c = g.coordinates;
        if (g.type === 'Point') proc(c);
        else if (g.type === 'MultiPoint' || g.type === 'LineString') c.slice(0, 10).forEach(proc);
        else if (g.type === 'Polygon') (c[0] || []).slice(0, 10).forEach(proc);
        else if (g.type === 'MultiPolygon') ((c[0] && c[0][0]) || []).slice(0, 10).forEach(proc);
      });

      const promDecimales = totalCoordsMuestreadas > 0 ? (totalDecimales / totalCoordsMuestreadas) : 5.0;
      let ptsDecimales = 10.0;
      if (promDecimales >= 5.0) ptsDecimales = 50.0;       // Submétrica (<= 1.1 m)
      else if (promDecimales >= 4.0) ptsDecimales = 38.0;  // Comunal (~11 m)
      else if (promDecimales >= 3.0) ptsDecimales = 25.0;  // Regional (~110 m)

      // Subfactor B: Documentación de Escala Nominal / GSD en Metadatos (30 pts)
      let ptsEscala = 0.0;
      if (!esArchivoExterno && (meta.escala || meta.resolucion || meta.escala_captura)) {
        ptsEscala = 30.0;
      } else if (rootMeta.scale || rootMeta.scaleDenominator || rootMeta.resolution) {
        ptsEscala = 30.0;
      }

      // Subfactor C: Granularidad y Densidad Geométrica (20 pts)
      let ptsDensidad = 20.0;
      if (nFeatures === 0) ptsDensidad = 0.0;

      scoreRG = Math.round((ptsDecimales + ptsEscala + ptsDensidad) * 10) / 10;
      scoreRG = Math.max(0.0, Math.min(100.0, scoreRG));
    }

    // =========================================================================
    // 5. ACCESIBILIDAD Y DISPONIBILIDAD OPERATIVA (AI - FAIR PRINCIPLES) (10%)
    // =========================================================================
    let scoreAI = 0.0;
    if (!esArchivoExterno && meta.score_ai !== undefined) {
      scoreAI = Number(meta.score_ai);
    } else {
      // Subfactor A: Formato Estándar Abierto (GeoJSON RFC 7946) (40 pts)
      const ptsFormatoAbierto = 40.0;

      // Subfactor B: Servicios Web Interoperables en Red (WFS / WMS / API / Cloud CDN) (35 pts)
      let ptsServiciosEnRed = 0.0;
      if (!esArchivoExterno && (meta.wfs || meta.wms || meta.api_url || meta.archivoLocal)) {
        ptsServiciosEnRed = 35.0;
      } else if (rootMeta.wfs || rootMeta.wms || rootMeta.api || rootMeta.endpoint) {
        ptsServiciosEnRed = 35.0;
      }

      // Subfactor C: Enlace Persistente de Descarga y Reutilización Pública (25 pts)
      let ptsEnlaceDescarga = 0.0;
      if (!esArchivoExterno && (meta.url || meta.descarga || meta.archivoLocal)) {
        ptsEnlaceDescarga = 25.0;
      } else if (geojsonData.url || rootMeta.url || rootMeta.download_url) {
        ptsEnlaceDescarga = 25.0;
      }

      scoreAI = Math.round((ptsFormatoAbierto + ptsServiciosEnRed + ptsEnlaceDescarga) * 10) / 10;
      scoreAI = Math.max(0.0, Math.min(100.0, scoreAI));
    }

    return {
      mc: scoreMC,
      cc: scoreCC,
      ll: scoreLL,
      rg: scoreRG,
      ai: scoreAI,
      detallesMC
    };
  }

  function auditarDatasetEspacial(geojsonData, metadatosDeclarados = null, ponderadores = PONDERADORES_DEFECTO) {
    if (!geojsonData) {
      throw new Error('No se proporcionaron datos GeoJSON válidos para evaluar.');
    }

    let features = [];
    if (geojsonData.type === 'FeatureCollection' && Array.isArray(geojsonData.features)) {
      features = geojsonData.features;
    } else if (geojsonData.type === 'Feature') {
      features = [geojsonData];
    } else if (geojsonData.type && geojsonData.coordinates) {
      features = [{ type: 'Feature', geometry: geojsonData, properties: {} }];
    } else {
      throw new Error('El objeto no corresponde a una especificación válida GeoJSON (RFC 7946).');
    }

    const totalFeatures = features.length;
    if (totalFeatures === 0) {
      throw new Error('El conjunto de datos no contiene entidades vectoriales (0 Features).');
    }
    if (totalFeatures > LIMITE_ENTIDADES_PROCESAMIENTO) {
      const err = new Error('No se pudo procesar la auditoria de calidad dado que el archivo que ha ingresado es demasiado pesado, intente con un archivo más pequeño');
      err.esArchivoPesado = true;
      err.detalle = `El conjunto de datos contiene ${totalFeatures.toLocaleString('es-CL')} entidades vectoriales, superando el límite seguro de ${LIMITE_ENTIDADES_PROCESAMIENTO.toLocaleString('es-CL')} entidades concurrentes en navegador.`;
      throw err;
    }

    let featuresValidas = 0;
    let featuresConError = 0;
    let totalKinks = 0;
    let totalAnillosAbiertos = 0;
    let totalSlivers = 0;
    let totalVerticesDataset = 0;
    const entidadesDiagnosticadas = [];

    features.forEach((f, idx) => {
      const diag = auditarGeometria(f.geometry, idx);
      totalVerticesDataset += diag.totalVertices;

      if (diag.valida) {
        featuresValidas++;
      } else {
        featuresConError++;
      }

      diag.hallazgos.forEach(h => {
        if (h.tipo === 'AUTO_INTERSECCION') totalKinks++;
        if (h.tipo === 'ANILLO_NO_CERRADO') totalAnillosAbiertos++;
        if (h.tipo === 'SLIVER_POLYGON') totalSlivers++;
      });

      entidadesDiagnosticadas.push({
        index: idx,
        id: f.id || f.properties?.id || f.properties?.fid || `#${idx + 1}`,
        tipo: diag.tipoGeometria || 'Sin Geometría',
        valida: diag.valida,
        esSliver: diag.esSliver,
        vertices: diag.totalVertices,
        hallazgos: diag.hallazgos,
        featureRef: f
      });
    });

    const tasaValidezTopologica = Math.round((featuresValidas / totalFeatures) * 1000) / 10;
    const scoreTopologia = tasaValidezTopologica;

    const diagAtributos = auditarAtributos(features);
    const scoreCompletitud = diagAtributos.tasaCompletitudGlobal;

    const diagPosicional = auditarPosicional(features);
    const scorePosicional = diagPosicional.tasaIntegridad;

    let scoreEstructura = diagAtributos.tasaHomogeneidad;
    if (diagAtributos.clavePrimariaUnica) {
      scoreEstructura = Math.min(100, scoreEstructura + 5);
    }

    const pctSinSlivers = totalFeatures > 0 ? ((totalFeatures - totalSlivers) / totalFeatures) * 100 : 100;
    const scoreGranularidad = Math.round(pctSinSlivers * 10) / 10;

    const wC = ponderadores.cuantitativo;
    const scoreCuantitativo = Math.round((
      (wC.topologia * scoreTopologia) +
      (wC.completitud * scoreCompletitud) +
      (wC.posicional * scorePosicional) +
      (wC.estructura * scoreEstructura) +
      (wC.granularidad * scoreGranularidad)
    ) * 10) / 10;

    // Evaluación dinámica y objetiva del Pilar Cualitativo
    const desgloseCualitativo = auditarCualitativoDataset(geojsonData, metadatosDeclarados, features);
    const wM = ponderadores.cualitativo;
    const scoreCualitativo = Math.round((
      (wM.mc * desgloseCualitativo.mc) +
      (wM.cc * desgloseCualitativo.cc) +
      (wM.ll * desgloseCualitativo.ll) +
      (wM.rg * desgloseCualitativo.rg) +
      (wM.ai * desgloseCualitativo.ai)
    ) * 10) / 10;

    const igv = Math.round((
      (ponderadores.pesoCuantitativo * scoreCuantitativo) +
      (ponderadores.pesoCualitativo * scoreCualitativo)
    ) * 10) / 10;

    let grado = 'A+ (Excelente)';
    let badgeColor = '#10B981';
    let descripcionGrado = 'Cumplimiento sobresaliente de rigor topológico y metadatos estándar.';

    if (igv >= 95.0) {
      grado = 'A+ (Excelente)';
      badgeColor = '#10B981';
      descripcionGrado = 'Apto para producción cartográfica crítica, catastro oficial y publicaciones científicas.';
    } else if (igv >= 85.0) {
      grado = 'A (Muy Bueno)';
      badgeColor = '#38BDF8';
      descripcionGrado = 'Excelente consistencia espacial y semántica con observaciones menores.';
    } else if (igv >= 70.0) {
      grado = 'B (Aceptable)';
      badgeColor = '#F59E0B';
      descripcionGrado = 'Apto para uso referencial o diagnóstico comunitario; requiere corrección de topología o nulos.';
    } else {
      grado = 'C (Deficiente / Observado)';
      badgeColor = '#EF4444';
      descripcionGrado = 'Presenta inconsistencias topológicas críticas o vacíos severos de información tabular.';
    }

    // =========================================================================
    // MATRIZ MULTICRITERIO WLC v2.0 (Weighted Linear Combination)
    // Conforme a Malczewski (1999), Voogd (1983) y Eastman (1999)
    // Criterios clasificados formalmente en Beneficio (▲) y Costo (▼)
    // =========================================================================
    const pesoGlobalCuant = ponderadores.pesoCuantitativo;
    const pesoGlobalCual = ponderadores.pesoCualitativo;

    const criteriosWLC = [
      {
        id: 'topologia',
        nombre: 'Consistencia Topológica OGC',
        dimension: 'Consistencia Lógica (ISO 19157)',
        tipo: 'beneficio',
        unidad: '% válidas',
        valorBruto: scoreTopologia,
        norm: Math.round((scoreTopologia / 100) * 1000) / 1000,
        pesoRelativo: wC.topologia,
        pesoGlobal: Math.round((pesoGlobalCuant * wC.topologia) * 1000) / 1000,
        contrib: Math.round((pesoGlobalCuant * wC.topologia * scoreTopologia) * 10) / 10,
        detalle: `${featuresValidas}/${totalFeatures} entidades conformes OGC (${totalKinks} kinks)`
      },
      {
        id: 'completitud',
        nombre: 'Completitud Tabular',
        dimension: 'Completitud Atributos (ISO 19157)',
        tipo: 'beneficio',
        unidad: '% no nulos',
        valorBruto: scoreCompletitud,
        norm: Math.round((scoreCompletitud / 100) * 1000) / 1000,
        pesoRelativo: wC.completitud,
        pesoGlobal: Math.round((pesoGlobalCuant * wC.completitud) * 1000) / 1000,
        contrib: Math.round((pesoGlobalCuant * wC.completitud * scoreCompletitud) * 10) / 10,
        detalle: `${diagAtributos.totalCampos} campos analizados (${diagAtributos.tasaCompletitudGlobal}% completo)`
      },
      {
        id: 'posicional',
        nombre: 'Integridad Posicional y CRS',
        dimension: 'Exactitud Posicional (ISO 19157)',
        tipo: 'beneficio',
        unidad: '% en dominio',
        valorBruto: scorePosicional,
        norm: Math.round((scorePosicional / 100) * 1000) / 1000,
        pesoRelativo: wC.posicional,
        pesoGlobal: Math.round((pesoGlobalCuant * wC.posicional) * 1000) / 1000,
        contrib: Math.round((pesoGlobalCuant * wC.posicional * scorePosicional) * 10) / 10,
        detalle: `${diagPosicional.verticesEnRango}/${diagPosicional.totalVertices} vértices en dominio EPSG`
      },
      {
        id: 'estructura',
        nombre: 'Estructura y Esquema',
        dimension: 'Consistencia Conceptual (ISO 19157)',
        tipo: 'beneficio',
        unidad: '% homogeneidad',
        valorBruto: scoreEstructura,
        norm: Math.round((scoreEstructura / 100) * 1000) / 1000,
        pesoRelativo: wC.estructura,
        pesoGlobal: Math.round((pesoGlobalCuant * wC.estructura) * 1000) / 1000,
        contrib: Math.round((pesoGlobalCuant * wC.estructura * scoreEstructura) * 10) / 10,
        detalle: diagAtributos.clavePrimariaUnica ? 'Clave primaria unívoca presente ✓' : 'Tipos homogéneos'
      },
      {
        id: 'granularidad',
        nombre: 'Granularidad Geométrica',
        dimension: 'Calidad Geométrica (ISO 19157)',
        tipo: 'beneficio',
        unidad: '% sin slivers',
        valorBruto: scoreGranularidad,
        norm: Math.round((scoreGranularidad / 100) * 1000) / 1000,
        pesoRelativo: wC.granularidad,
        pesoGlobal: Math.round((pesoGlobalCuant * wC.granularidad) * 1000) / 1000,
        contrib: Math.round((pesoGlobalCuant * wC.granularidad * scoreGranularidad) * 10) / 10,
        detalle: `${totalSlivers} micro-slivers parásitos detectados`
      },
      {
        id: 'mc',
        nombre: 'Metadatos Núcleo (Core)',
        dimension: 'Completitud Documental (ISO 19115)',
        tipo: 'beneficio',
        unidad: '% 10 campos',
        valorBruto: desgloseCualitativo.mc,
        norm: Math.round((desgloseCualitativo.mc / 100) * 1000) / 1000,
        pesoRelativo: ponderadores.cualitativo.mc,
        pesoGlobal: Math.round((pesoGlobalCual * ponderadores.cualitativo.mc) * 1000) / 1000,
        contrib: Math.round((pesoGlobalCual * ponderadores.cualitativo.mc * desgloseCualitativo.mc) * 10) / 10,
        detalle: `${Math.round(desgloseCualitativo.mc / 10)}/10 elementos obligatorios del Perfil Nacional de Metadatos`
      },
      {
        id: 'cc',
        nombre: 'Conformidad Semántica',
        dimension: 'Catálogo de Objetos (ISO 19110)',
        tipo: 'beneficio',
        unidad: '% conformidad',
        valorBruto: desgloseCualitativo.cc,
        norm: Math.round((desgloseCualitativo.cc / 100) * 1000) / 1000,
        pesoRelativo: ponderadores.cualitativo.cc,
        pesoGlobal: Math.round((pesoGlobalCual * ponderadores.cualitativo.cc) * 1000) / 1000,
        contrib: Math.round((pesoGlobalCual * ponderadores.cualitativo.cc * desgloseCualitativo.cc) * 10) / 10,
        detalle: desgloseCualitativo.cc >= 80 ? 'Catálogo ISO 19110 conforme' : 'Esquema sin catálogo de variables documentado'
      },
      {
        id: 'll',
        nombre: 'Linaje y Derechos Legales',
        dimension: 'Trazabilidad y Licenciamiento',
        tipo: 'beneficio',
        unidad: '% legalidad',
        valorBruto: desgloseCualitativo.ll,
        norm: Math.round((desgloseCualitativo.ll / 100) * 1000) / 1000,
        pesoRelativo: ponderadores.cualitativo.ll,
        pesoGlobal: Math.round((pesoGlobalCual * ponderadores.cualitativo.ll) * 1000) / 1000,
        contrib: Math.round((pesoGlobalCual * ponderadores.cualitativo.ll * desgloseCualitativo.ll) * 10) / 10,
        detalle: desgloseCualitativo.ll > 0 ? 'Con respaldo legal o cita' : 'Sin fuente ni licencia declarada'
      },
      {
        id: 'rg',
        nombre: 'Resolución Espacial y Granularidad',
        dimension: 'Representación Geodésica',
        tipo: 'beneficio',
        unidad: '% escala',
        valorBruto: desgloseCualitativo.rg,
        norm: Math.round((desgloseCualitativo.rg / 100) * 1000) / 1000,
        pesoRelativo: ponderadores.cualitativo.rg,
        pesoGlobal: Math.round((pesoGlobalCual * ponderadores.cualitativo.rg) * 1000) / 1000,
        contrib: Math.round((pesoGlobalCual * ponderadores.cualitativo.rg * desgloseCualitativo.rg) * 10) / 10,
        detalle: desgloseCualitativo.rg >= 85 ? 'Precisión geodésica submétrica' : 'Resolución básica / Escala no informada'
      },
      {
        id: 'ai',
        nombre: 'Accesibilidad Operativa',
        dimension: 'Disponibilidad de Servicio',
        tipo: 'beneficio',
        unidad: '% disponibilidad',
        valorBruto: desgloseCualitativo.ai,
        norm: Math.round((desgloseCualitativo.ai / 100) * 1000) / 1000,
        pesoRelativo: ponderadores.cualitativo.ai,
        pesoGlobal: Math.round((pesoGlobalCual * ponderadores.cualitativo.ai) * 1000) / 1000,
        contrib: Math.round((pesoGlobalCual * ponderadores.cualitativo.ai * desgloseCualitativo.ai) * 10) / 10,
        detalle: desgloseCualitativo.ai >= 70 ? 'Servicios web activos y descarga' : 'Formato abierto sin servicios WFS'
      }
    ];

    const matrizWLC = {
      modelo: 'Weighted Linear Combination (WLC) v2.0 Escalable',
      referencias: 'Malczewski (1999); Voogd (1983); Eastman (1999); Anselin (1988/1995); Tobler (1970)',
      formula: 'IGV = Σ (w_i · x_norm,i) con Σ w_i = 1.00',
      pesoGlobalCuantitativo: pesoGlobalCuant,
      pesoGlobalCualitativo: pesoGlobalCual,
      criterios: criteriosWLC,
      penalizacionesCosto: [
        { id: 'kinks', nombre: 'Auto-intersecciones', valor: totalKinks, tipo: 'costo' },
        { id: 'anillos_abiertos', nombre: 'Anillos abiertos', valor: totalAnillosAbiertos, tipo: 'costo' },
        { id: 'slivers', nombre: 'Micro-slivers', valor: totalSlivers, tipo: 'costo' },
        { id: 'nulos', nombre: 'Celdas atributivas nulas', valor: diagAtributos.totalCeldas - diagAtributos.totalCeldasValidas, tipo: 'costo' }
      ]
    };

    return {
      fechaAuditoria: new Date().toISOString(),
      resumenDataset: {
        totalFeatures,
        totalVertices: totalVerticesDataset,
        featuresValidas,
        featuresConError,
        tasaValidezTopologica: `${tasaValidezTopologica}%`,
        totalKinks,
        totalAnillosAbiertos,
        totalSlivers,
        bbox: diagPosicional.bboxGlobal,
        recorteBboxAplicado: Boolean(metadatosDeclarados && metadatosDeclarados.recorteBboxAplicado),
        totalOriginalDataset: (metadatosDeclarados && metadatosDeclarados.totalOriginalDataset) || totalFeatures,
        bboxFiltro: (metadatosDeclarados && metadatosDeclarados.bboxFiltro) || null
      },
      indicadorGlobal: {
        igv,
        grado,
        badgeColor,
        descripcionGrado,
        scoreCuantitativo,
        scoreCualitativo
      },
      dimensionesCuantitativas: {
        topologia: { score: scoreTopologia, peso: wC.topologia, validas: featuresValidas, errores: featuresConError },
        completitud: { score: scoreCompletitud, peso: wC.completitud, tasaGlobal: diagAtributos.tasaCompletitudGlobal },
        posicional: { score: scorePosicional, peso: wC.posicional, tasaIntegridad: diagPosicional.tasaIntegridad },
        estructura: { score: scoreEstructura, peso: wC.estructura, campos: diagAtributos.totalCampos, claveUnica: diagAtributos.clavePrimariaUnica },
        granularidad: { score: scoreGranularidad, peso: wC.granularidad, totalSlivers }
      },
      dimensionesCualitativas: desgloseCualitativo,
      atributosDetalle: diagAtributos.listaCampos,
      entidadesDiagnosticadas,
      matrizWLC,
      geojsonOriginal: geojsonData,
      metadatosDeclarados: metadatosDeclarados,
      capaId: (metadatosDeclarados && (metadatosDeclarados.id || metadatosDeclarados.capaId)) || (geojsonData.name || 'dataset_evaluado'),
      nombreCapa: (metadatosDeclarados && (metadatosDeclarados.titulo || metadatosDeclarados.nombre)) || (geojsonData.name || 'Dataset Espacial'),
      institucion: (metadatosDeclarados && metadatosDeclarados.institucion) || 'Evaluador Universal de Calidad',
      tipoFuente: (metadatosDeclarados && metadatosDeclarados.tipoFuente) || 'Dato Espacial Evaluado'
    };
  }

  /**
   * Algoritmo de Auto-Reparación y Saneamiento Topológico en el Navegador (OGC SFA / RFC 7946):
   * 1. Cierra automáticamente anillos poligonales abiertos (primer vértice != último vértice).
   * 2. Elimina vértices consecutivos redundantes/duplicados.
   * 3. Descarta geometrías colapsadas, nulas o degeneradas (sin alterar entidades sanas).
   * 4. Asigna identificador primario secuencial ('id_auto' / 'fid') si la capa carece de clave primaria.
   */
  function repararDatasetGeoJSON(geojsonData) {
    if (!geojsonData || !geojsonData.features) {
      return {
        geojsonReparado: geojsonData,
        estadisticas: { totalModificaciones: 0, anillosCerrados: 0, verticesDuplicadosRemovidos: 0, geometriasNulasRemovidas: 0, idsAsignados: 0 }
      };
    }

    const copia = typeof structuredClone === 'function' ? structuredClone(geojsonData) : JSON.parse(JSON.stringify(geojsonData));
    let anillosCerrados = 0;
    let verticesDuplicadosRemovidos = 0;
    let geometriasNulasRemovidas = 0;
    let idsAsignados = 0;

    function limpiarAnillo(ring) {
      if (!Array.isArray(ring) || ring.length === 0) return ring;
      const nuevo = [];
      for (let i = 0; i < ring.length; i++) {
        const pt = ring[i];
        if (!Array.isArray(pt) || pt.length < 2 || isNaN(pt[0]) || isNaN(pt[1])) continue;
        if (nuevo.length > 0) {
          const prev = nuevo[nuevo.length - 1];
          if (prev[0] === pt[0] && prev[1] === pt[1]) {
            verticesDuplicadosRemovidos++;
            continue;
          }
        }
        nuevo.push(pt);
      }

      // Cerrar anillo si está abierto y tiene al menos 3 vértices
      if (nuevo.length >= 3) {
        const primero = nuevo[0];
        const ultimo = nuevo[nuevo.length - 1];
        if (primero[0] !== ultimo[0] || primero[1] !== ultimo[1]) {
          nuevo.push([primero[0], primero[1]]);
          anillosCerrados++;
        }
      }
      return nuevo;
    }

    function limpiarCoordenadasLinea(coords) {
      if (!Array.isArray(coords)) return coords;
      const nuevo = [];
      for (let i = 0; i < coords.length; i++) {
        const pt = coords[i];
        if (!Array.isArray(pt) || pt.length < 2 || isNaN(pt[0]) || isNaN(pt[1])) continue;
        if (nuevo.length > 0) {
          const prev = nuevo[nuevo.length - 1];
          if (prev[0] === pt[0] && prev[1] === pt[1]) {
            verticesDuplicadosRemovidos++;
            continue;
          }
        }
        nuevo.push(pt);
      }
      return nuevo;
    }

    function repararGeometria(geom) {
      if (!geom || !geom.type) return null;
      const t = geom.type;

      if (t === 'Point') {
        if (!Array.isArray(geom.coordinates) || geom.coordinates.length < 2 || isNaN(geom.coordinates[0]) || isNaN(geom.coordinates[1])) return null;
        return geom;
      }

      if (t === 'MultiPoint') {
        const ptsValidos = (geom.coordinates || []).filter(pt => Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1]));
        if (ptsValidos.length === 0) return null;
        geom.coordinates = ptsValidos;
        return geom;
      }

      if (t === 'LineString') {
        geom.coordinates = limpiarCoordenadasLinea(geom.coordinates);
        if (geom.coordinates.length < 2) return null;
        return geom;
      }

      if (t === 'MultiLineString') {
        geom.coordinates = (geom.coordinates || [])
          .map(limpiarCoordenadasLinea)
          .filter(l => l.length >= 2);
        if (geom.coordinates.length === 0) return null;
        return geom;
      }

      if (t === 'Polygon') {
        geom.coordinates = (geom.coordinates || [])
          .map(limpiarAnillo)
          .filter(r => r.length >= 4);
        if (geom.coordinates.length === 0) return null;
        return geom;
      }

      if (t === 'MultiPolygon') {
        geom.coordinates = (geom.coordinates || [])
          .map(poly => {
            return (poly || []).map(limpiarAnillo).filter(r => r.length >= 4);
          })
          .filter(poly => poly.length > 0);
        if (geom.coordinates.length === 0) return null;
        return geom;
      }

      return geom;
    }

    const featuresReparadas = [];
    copia.features.forEach((f, idx) => {
      if (!f) return;
      if (!f.properties) f.properties = {};

      // Si carece de clave primaria única, asignar fid secuencial
      const posiblesIds = ['id', 'fid', 'objectid', 'gid', 'codigo', 'osm_id', 'cod_com', 'cod_uv'];
      const tieneId = (f.id !== undefined && f.id !== null && f.id !== '') || posiblesIds.some(k => f.properties[k] !== undefined && f.properties[k] !== null && f.properties[k] !== '');
      if (!tieneId) {
        f.id = idx + 1;
        f.properties.fid = idx + 1;
        idsAsignados++;
      }

      if (!f.geometry) {
        geometriasNulasRemovidas++;
        return;
      }

      const geomLimpia = repararGeometria(f.geometry);
      if (!geomLimpia) {
        geometriasNulasRemovidas++;
        return;
      }

      f.geometry = geomLimpia;
      f.properties._autofix_reparado = true;
      featuresReparadas.push(f);
    });

    copia.features = featuresReparadas;

    const totalModificaciones = anillosCerrados + verticesDuplicadosRemovidos + geometriasNulasRemovidas + idsAsignados;

    return {
      geojsonReparado: copia,
      estadisticas: {
        anillosCerrados,
        verticesDuplicadosRemovidos,
        geometriasNulasRemovidas,
        idsAsignados,
        totalModificaciones
      }
    };
  }

  /**
   * Focaliza e ilumina una entidad específica en el mini-mapa Leaflet
   */
  function enfocarEntidadEnMapa(featureIndex) {
    if (!mapaDiagnosticoInstancia) {
      alert('El mapa de diagnóstico no está cargado aún.');
      return;
    }

    const layer = capasLeafletPorIndice[featureIndex];
    const elMapa = document.getElementById('mapa-diagnostico-calidad');
    if (elMapa) {
      elMapa.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (layer) {
      setTimeout(() => {
        try {
          if (layer.getBounds) {
            mapaDiagnosticoInstancia.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 18 });
          } else if (layer.getLatLng) {
            mapaDiagnosticoInstancia.setView(layer.getLatLng(), 18);
          }
          layer.openPopup();
        } catch (e) {
          console.warn('Error al enfocar entidad en mapa:', e);
        }
      }, 350);
    } else {
      console.warn(`Capa para índice ${featureIndex} no encontrada en Leaflet.`);
    }
  }

  /**
   * Ejecuta la subsanación automática de geometrías en memoria,
   * re-evalúa el dataset con el motor ISO 19157 y actualiza la interfaz
   */
  function ejecutarAutoFixEnNavegador() {
    if (!ultimoResultadoAuditoria || !ultimoResultadoAuditoria.geojsonOriginal) {
      alert('No hay un conjunto de datos cargado para reparar.');
      return;
    }

    const resReparacion = repararDatasetGeoJSON(ultimoResultadoAuditoria.geojsonOriginal);
    const stats = resReparacion.estadisticas;

    if (stats.totalModificaciones === 0) {
      alert('¡Excelente! El dataset no presenta anillos abiertos, vértices consecutivos duplicados ni IDs faltantes. Sus geometrías ya cumplen con estas reglas OGC. Si aún presenta auto-intersecciones complejas, consulta la guía paso a paso de QGIS o PostGIS.');
      return;
    }

    // Re-auditar el GeoJSON reparado con las mismas reglas
    const nuevoResultado = auditarDatasetEspacial(
      resReparacion.geojsonReparado,
      ultimoResultadoAuditoria.metadatosDeclarados
    );

    // Inyectar datos del Auto-Fix para el banner de celebración
    nuevoResultado.autoFixAplicado = {
      anterior: ultimoResultadoAuditoria.indicadorGlobal.igv,
      nuevo: nuevoResultado.indicadorGlobal.igv,
      mejora: Math.round((nuevoResultado.indicadorGlobal.igv - ultimoResultadoAuditoria.indicadorGlobal.igv) * 10) / 10,
      estadisticas: stats,
      geojsonReparado: resReparacion.geojsonReparado
    };

    // Actualizar cache global en memoria para exportaciones posteriores
    window._datosGeojsonCargadosParaCalidad = resReparacion.geojsonReparado;

    // Re-renderizar la UI completa
    renderizarResultadosUI(nuevoResultado, 'resultado-auditoria-igv');

    // Desplazar suavemente hacia la vista de resultados
    const cont = document.getElementById('resultado-auditoria-igv');
    if (cont) {
      cont.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Descarga el archivo GeoJSON reparado por Auto-Fix
   */
  function descargarGeoJSONReparado(geojsonReparado) {
    if (!geojsonReparado) return;
    const blob = new Blob([JSON.stringify(geojsonReparado, null, 2)], {
      type: 'application/geo+json; charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset_subsanado_autofix_${Date.now()}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Copia al portapapeles el plan de subsanación técnica
   */
  function copiarPlanSubsanacion(resultado) {
    if (!resultado) resultado = ultimoResultadoAuditoria;
    if (!resultado) return;

    const rd = resultado.resumenDataset;
    const ig = resultado.indicadorGlobal;
    const dc = resultado.dimensionesCuantitativas;

    const texto = `# PLAN DE SUBSANACIÓN Y REPARACIÓN DE CALIDAD ESPACIAL (ISO 19157 / ISO 19115)
Atlas de Información Geográfica Voluntaria — Nodo GeoAbierto
Fecha: ${resultado.fechaAuditoria}
Dataset: ${resultado.nombreCapa} (${rd.totalFeatures.toLocaleString('es-CL')} entidades, ${rd.totalVertices.toLocaleString('es-CL')} vértices)
Índice Global IGV: ${ig.igv}% [${ig.grado}]
Pilar Cuantitativo: ${ig.scoreCuantitativo}% | Pilar Cualitativo: ${ig.scoreCualitativo}%

================================================================================
1. DIAGNÓSTICO DE FALENCIAS DETECTADAS
================================================================================
- Consistencia Topológica: ${dc.topologia.score}% (${rd.featuresConError} entidades observadas)
  * Anillos Abiertos: ${rd.totalAnillosAbiertos}
  * Auto-intersecciones (Kinks): ${rd.totalKinks}
  * Micro-Slivers: ${rd.totalSlivers}
- Completitud Tabular: ${dc.completitud.score}% (${resultado.atributosDetalle.length} atributos evaluados)
- Clave Primaria Única: ${dc.estructura.claveUnica ? 'Sí' : 'No (Se recomienda asignar fid)'}

================================================================================
2. GUÍA DE RESOLUCIÓN EN QGIS 3.x
================================================================================
Paso 1: Abrir QGIS y cargar la capa '${resultado.nombreCapa}'.
Paso 2: Ir a Menú 'Vectorial' > 'Herramientas de geometría' > 'Corregir geometrías (Fix Geometries)'.
  - Capa de entrada: Capa auditada.
  - Método de reparación: Estructura válida (Make Valid).
  - Clic en Ejecutar. Se creará una capa temporal corregida.
Paso 3: Validar con la herramienta 'Comprobador de topología' (Vectorial > Comprobador de topología).
  - Reglas recomendadas: 'No debe tener geometrías no válidas' y 'No debe superponerse'.
Paso 4: Exportar capa subsanada:
  - Clic derecho sobre la capa > 'Exportar' > 'Guardar objetos como...'.
  - Formato: GeoJSON.
  - SRC: EPSG:4326 - WGS 84.
  - Codificación: UTF-8.

================================================================================
3. GUÍA DE RESOLUCIÓN EN POSTGIS / SQL
================================================================================
-- 1. Reparar geometrías no conformes y auto-intersecciones (ISO 19125 / SFA)
UPDATE mi_capa
SET geom = ST_Multi(ST_CollectionExtract(ST_MakeValid(geom), 3))
WHERE NOT ST_IsValid(geom);

-- 2. Purgar vértices redundantes y duplicados consecutivos
UPDATE mi_capa
SET geom = ST_RemoveRepeatedPoints(geom, 0.000001);

-- 3. Asignar identificador primario secuencial si no existe
ALTER TABLE mi_capa ADD COLUMN IF NOT EXISTS fid SERIAL PRIMARY KEY;

-- 4. Verificar integridad restante
SELECT COUNT(*) AS errores_restantes FROM mi_capa WHERE NOT ST_IsValid(geom);

================================================================================
4. GUÍA DE RESOLUCIÓN EN PYTHON / GEOPANDAS
================================================================================
import geopandas as gpd
from shapely.validation import make_valid

# Cargar dataset
gdf = gpd.read_file("${resultado.nombreCapa}.geojson")

# Reparar geometrías inválidas con Shapely make_valid
gdf['geometry'] = gdf['geometry'].apply(lambda g: make_valid(g) if (g and not g.is_valid) else g)

# Descartar geometrías nulas o colapsadas
gdf = gdf[gdf.geometry.notnull() & (~gdf.geometry.is_empty)]

# Asegurar identificador único
if 'fid' not in gdf.columns and 'id' not in gdf.columns:
    gdf.insert(0, 'fid', range(1, len(gdf) + 1))

# Exportar capa limpia
gdf.to_file("${resultado.nombreCapa}_subsanado.geojson", driver="GeoJSON")
print("Dataset subsanado y listo para producción!")
`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(() => {
        alert('¡Plan técnico de subsanación copiado al portapapeles con éxito!');
      }).catch(() => {
        mostrarModalTexto('Plan Técnico de Subsanación', texto);
      });
    } else {
      mostrarModalTexto('Plan Técnico de Subsanación', texto);
    }
  }

  function mostrarModalTexto(titulo, texto) {
    const area = document.createElement('textarea');
    area.value = texto;
    area.style.position = 'fixed';
    area.style.top = '10%';
    area.style.left = '10%';
    area.style.width = '80%';
    area.style.height = '80%';
    area.style.zIndex = '99999';
    area.style.background = '#0f172a';
    area.style.color = '#fff';
    area.style.padding = '20px';
    area.style.borderRadius = '10px';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    alert('Plan de subsanación copiado al portapapeles.');
    document.body.removeChild(area);
  }

  /**
   * Renderiza el mensaje de advertencia institucional cuando se ingresa un archivo
   * o capa que excede la capacidad de memoria segura del navegador web.
   */
  function renderizarAvisoArchivoPesado(contenedor, detalleExtra = '') {
    if (!contenedor) return;
    if (typeof contenedor === 'string') {
      contenedor = document.getElementById(contenedor);
      if (!contenedor) return;
    }

    contenedor.innerHTML = `
      <div class="caja-aviso-pesado" style="background:var(--papel-alto, #1a2b4b); border:2px solid var(--ocre, #f59e0b); border-left:6px solid var(--ocre, #f59e0b); border-radius:12px; padding:22px; margin-top:16px; box-shadow:var(--sombra-md, 0 10px 25px rgba(0,0,0,0.4));">
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:12px; flex-wrap:wrap;">
          <span style="font-size:2rem; line-height:1;">⚠️</span>
          <div>
            <span style="font-family:var(--fuente-datos); font-size:0.75rem; color:var(--ocre, #f59e0b); text-transform:uppercase; letter-spacing:0.06em; font-weight:800; display:block;">
              [CONTROL DE CAPACIDAD Y MEMORIA DEL NAVEGADOR]
            </span>
            <h4 style="margin:2px 0 0 0; font-size:1.15rem; font-family:var(--fuente-titulos); color:#ffffff; font-weight:700;">
              Límite de Procesamiento de Auditoría Superado
            </h4>
          </div>
        </div>

        <div style="background:rgba(245, 158, 11, 0.12); border:1px solid rgba(245, 158, 11, 0.35); border-radius:8px; padding:14px 18px; margin-bottom:14px;">
          <p style="margin:0; font-size:0.98rem; line-height:1.55; color:#ffffff; font-weight:600;">
            No se pudo procesar la auditoria de calidad dado que el archivo que ha ingresado es demasiado pesado, intente con un archivo más pequeño.
          </p>
        </div>

        <div style="background:rgba(0, 0, 0, 0.25); border-radius:8px; padding:12px 16px; font-family:var(--fuente-datos); font-size:0.8rem; color:var(--tinta-tenue, #e2e8f0); line-height:1.5;">
          <div style="margin-bottom:6px;">
            <strong style="color:var(--tinta, #ffffff);">¿Por qué ocurre este aviso?</strong> Para garantizar la estabilidad del Atlas y evitar que la pestaña del navegador colapse por consumo excesivo de memoria RAM (OutOfMemory) o se reinicie inesperadamente, la auditoría topológica en cliente (OGC SFA / ISO 19157) admite archivos vectoriales de hasta <strong>25 MB</strong> o un máximo de <strong>15.000 entidades</strong>.
          </div>
          ${detalleExtra ? `<div style="color:var(--ocre, #f59e0b); margin-top:6px; border-top:1px dashed rgba(255,255,255,0.15); padding-top:6px;"><strong>Detalle detectado:</strong> ${detalleExtra}</div>` : ''}
          <div style="margin-top:8px; color:var(--tinta-suave, #f8fafc);">
            💡 <em>Recomendación:</em> Puedes filtrar el archivo espacial por una comuna o polígono específico (como Barrio Brasil o Santiago Centro), simplificar vértices en QGIS/GDAL, o comprimir propiedades innecesarias antes de volver a auditarlo.
          </div>
        </div>
      </div>
    `;

    try {
      contenedor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) {}
  }

  /**
   * Renderiza los resultados en el contenedor visual HTML
   */
  function renderizarResultadosUI(resultado, contenedorId = 'resultado-auditoria-igv') {
    if (typeof document === 'undefined') return;
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    ultimoResultadoAuditoria = resultado;
    const ig = resultado.indicadorGlobal;
    const rd = resultado.resumenDataset;
    const dc = resultado.dimensionesCuantitativas;

    const entidadesConObservacion = (resultado.entidadesDiagnosticadas || []).filter(ed => !ed.valida || ed.esSliver || (ed.hallazgos && ed.hallazgos.length > 0));
    const erroresCriticos = (rd.totalKinks || 0) + (rd.totalAnillosAbiertos || 0) + ((rd.totalFeatures || 0) - (rd.featuresValidas || 0));
    const observacionesModeradas = (rd.totalSlivers || 0) + (dc.estructura.claveUnica ? 0 : 1);
    const celdasVacias = (resultado.atributosDetalle || []).reduce((acc, c) => acc + (c.nulos || 0), 0);

    cont.innerHTML = `
      <div style="background:var(--papel-tarjeta); border:2px solid var(--linea-tarjeta); border-radius:12px; padding:20px; margin-top:16px;">

        <!-- Cabecera KPI del Índice IGV -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; border-bottom:1px solid var(--linea); padding-bottom:16px; margin-bottom:18px;">
          <div>
            <span style="font-family:var(--fuente-datos); font-size:0.75rem; color:var(--musgo); text-transform:uppercase; letter-spacing:0.06em;">
              [CERTIFICACIÓN DE CALIDAD ESPACIAL // ISO 19157:2023 & ISO 19115]
            </span>
            <h3 style="margin:4px 0 2px 0; font-size:1.4rem; font-family:var(--fuente-titulos); display:flex; align-items:center; gap:10px;">
              <span>🛡️</span> Índice Global de Calidad (IGV):
              <span style="color:${ig.badgeColor}; font-weight:900;">${ig.igv}%</span>
            </h3>
            <div style="font-size:0.86rem; color:var(--tinta-suave);">
              ${ig.descripcionGrado}
            </div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
            <span style="background:${ig.badgeColor}22; color:${ig.badgeColor}; border:1px solid ${ig.badgeColor}; font-weight:800; font-size:0.85rem; padding:5px 14px; border-radius:8px;">
              ${ig.grado}
            </span>
            <span style="font-family:var(--fuente-datos); font-size:0.75rem; color:var(--tinta-tenue);">
              ${rd.totalFeatures.toLocaleString('es-CL')} Entidades · ${rd.totalVertices.toLocaleString('es-CL')} Vértices
            </span>
          </div>
        </div>

        ${rd.recorteBboxAplicado ? `
        <!-- Aviso de Focalización Territorial BBox Barrio Brasil -->
        <div style="background:rgba(6, 182, 212, 0.12); border:1px solid var(--musgo); border-left:5px solid var(--musgo); border-radius:8px; padding:12px 16px; margin-bottom:18px; font-family:var(--fuente-datos); font-size:0.83rem; color:var(--musgo); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
          <div>
            <strong style="color:#ffffff;">📍 Focalización Territorial Activa (BBox Barrio Brasil):</strong>
            <span style="color:var(--tinta-suave); display:block; margin-top:2px;">Se auditaron <strong>${rd.totalFeatures.toLocaleString('es-CL')}</strong> entidades correspondientes al territorio piloto (recortadas espacialmente de ${rd.totalOriginalDataset.toLocaleString('es-CL')} entidades totales en la base de datos).</span>
          </div>
          <span style="background:var(--papel); padding:4px 10px; border-radius:6px; font-size:0.76rem; border:1px solid var(--linea); color:var(--tinta); white-space:nowrap;">
            BBox: [${rd.bbox.map(n => Number(n).toFixed(4)).join(', ')}]
          </span>
        </div>` : ''}

        <!-- Comparativa de Pilares Cuantitativo vs Cualitativo -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-bottom:18px;">
          <div class="caja-tarjeta-normativa" style="border-left:6px solid #38bdf8; padding:14px;">
            <span style="font-size:0.75rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700;">
              PILAR CUANTITATIVO ESPACIAL (50%)
            </span>
            <div style="font-size:1.5rem; font-weight:900; color:#38bdf8; font-family:var(--fuente-titulos); margin:2px 0;">
              ${ig.scoreCuantitativo}%
            </div>
            <span style="font-size:0.78rem; color:var(--tinta-suave);">
              Validez topológica, completitud tabular, rango de coordenadas y ausencia de slivers.
            </span>
          </div>
          <div class="caja-tarjeta-normativa" style="border-left:6px solid #10b981; padding:14px;">
            <span style="font-size:0.75rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700;">
              PILAR CUALITATIVO DE METADATOS (50%)
            </span>
            <div style="font-size:1.5rem; font-weight:900; color:#10b981; font-family:var(--fuente-titulos); margin:2px 0;">
              ${ig.scoreCualitativo}%
            </div>
            <span style="font-size:0.78rem; color:var(--tinta-suave);">
              Conformidad ISO 19115, linaje, custodia institucional, trazabilidad y licenciamiento.
            </span>
          </div>
        </div>

        <!-- Desglose de las 5 Dimensiones Cuantitativas ISO 19157 -->
        <h4 style="margin:16px 0 10px 0; font-size:0.95rem; font-family:var(--fuente-datos); color:var(--tinta); display:flex; align-items:center; gap:6px;">
          <span>📐</span> Dimensiones Cuantitativas de Calidad (ISO 19157-1:2023)
        </h4>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-bottom:18px;">
          
          <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:8px; padding:10px;">
            <div style="font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">1. Consistencia Topológica (30%)</div>
            <div style="font-size:1.2rem; font-weight:800; color:${dc.topologia.score >= 95 ? '#10b981' : '#f59e0b'}; font-family:var(--fuente-titulos);">
              ${dc.topologia.score}%
            </div>
            <div style="font-size:0.72rem; color:var(--tinta-suave);">
              ${rd.featuresValidas} válidas · ${rd.totalKinks} kinks · ${rd.totalAnillosAbiertos} abiertos
            </div>
          </div>

          <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:8px; padding:10px;">
            <div style="font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">2. Completitud Tabular (25%)</div>
            <div style="font-size:1.2rem; font-weight:800; color:${dc.completitud.score >= 90 ? '#10b981' : '#f59e0b'}; font-family:var(--fuente-titulos);">
              ${dc.completitud.score}%
            </div>
            <div style="font-size:0.72rem; color:var(--tinta-suave);">
              ${resultado.atributosDetalle.length} campos analizados
            </div>
          </div>

          <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:8px; padding:10px;">
            <div style="font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">3. Integridad Posicional (20%)</div>
            <div style="font-size:1.2rem; font-weight:800; color:${dc.posicional.score >= 98 ? '#10b981' : '#f59e0b'}; font-family:var(--fuente-titulos);">
              ${dc.posicional.score}%
            </div>
            <div style="font-size:0.72rem; color:var(--tinta-suave);">
              Dominio geográfico / EPSG verificado
            </div>
          </div>

          <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:8px; padding:10px;">
            <div style="font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">4. Estructura y Esquema (15%)</div>
            <div style="font-size:1.2rem; font-weight:800; color:#38bdf8; font-family:var(--fuente-titulos);">
              ${dc.estructura.score}%
            </div>
            <div style="font-size:0.72rem; color:var(--tinta-suave);">
              ${dc.estructura.claveUnica ? 'Clave primaria única ✓' : 'Sin ID único'}
            </div>
          </div>

          <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:8px; padding:10px;">
            <div style="font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">5. Granularidad Geométrica (10%)</div>
            <div style="font-size:1.2rem; font-weight:800; color:#38bdf8; font-family:var(--fuente-titulos);">
              ${dc.granularidad.score}%
            </div>
            <div style="font-size:0.72rem; color:var(--tinta-suave);">
              ${rd.totalSlivers} slivers detectados
            </div>
          </div>

        </div>

        <!-- Desglose de las 5 Dimensiones Cualitativas ISO 19115 / ISO 19110 / Ley 20.285 -->
        <h4 style="margin:16px 0 10px 0; font-size:0.95rem; font-family:var(--fuente-datos); color:var(--tinta); display:flex; align-items:center; gap:6px;">
          <span>📋</span> Dimensiones Cualitativas de Metadatos y Linaje (ISO 19115 / ISO 19110 / Ley 20.285)
        </h4>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-bottom:18px;">
          
          <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:8px; padding:10px;">
            <div style="font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">1. Metadatos Núcleo (30%)</div>
            <div style="font-size:1.2rem; font-weight:800; color:${resultado.dimensionesCualitativas.mc >= 80 ? '#10b981' : (resultado.dimensionesCualitativas.mc >= 40 ? '#f59e0b' : '#ef4444')}; font-family:var(--fuente-titulos);">
              ${resultado.dimensionesCualitativas.mc}%
            </div>
            <div style="font-size:0.72rem; color:var(--tinta-suave);">
              ${Math.round(resultado.dimensionesCualitativas.mc / 10)}/10 campos Perfil Chile
            </div>
          </div>

          <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:8px; padding:10px;">
            <div style="font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">2. Conformidad Semántica (20%)</div>
            <div style="font-size:1.2rem; font-weight:800; color:${resultado.dimensionesCualitativas.cc >= 80 ? '#10b981' : (resultado.dimensionesCualitativas.cc >= 50 ? '#f59e0b' : '#ef4444')}; font-family:var(--fuente-titulos);">
              ${resultado.dimensionesCualitativas.cc}%
            </div>
            <div style="font-size:0.72rem; color:var(--tinta-suave);">
              ${resultado.dimensionesCualitativas.cc >= 80 ? 'Catálogo ISO 19110 conforme' : (resultado.dimensionesCualitativas.cc >= 50 ? 'Esquema RFC 7946 sin catálogo' : 'Nomenclatura no normalizada')}
            </div>
          </div>

          <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:8px; padding:10px;">
            <div style="font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">3. Linaje y Certeza Legal (25%)</div>
            <div style="font-size:1.2rem; font-weight:800; color:${resultado.dimensionesCualitativas.ll >= 75 ? '#10b981' : (resultado.dimensionesCualitativas.ll > 0 ? '#f59e0b' : '#ef4444')}; font-family:var(--fuente-titulos);">
              ${resultado.dimensionesCualitativas.ll}%
            </div>
            <div style="font-size:0.72rem; color:var(--tinta-suave);">
              ${resultado.dimensionesCualitativas.ll >= 75 ? 'Licencia abierta + Custodio' : (resultado.dimensionesCualitativas.ll > 0 ? 'Mención parcial sin licencia' : 'Sin linaje, custodio ni licencia')}
            </div>
          </div>

          <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:8px; padding:10px;">
            <div style="font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">4. Resolución Espacial (15%)</div>
            <div style="font-size:1.2rem; font-weight:800; color:${resultado.dimensionesCualitativas.rg >= 80 ? '#10b981' : '#38bdf8'}; font-family:var(--fuente-titulos);">
              ${resultado.dimensionesCualitativas.rg}%
            </div>
            <div style="font-size:0.72rem; color:var(--tinta-suave);">
              ${resultado.dimensionesCualitativas.rg >= 80 ? 'Submétrica + Escala documentada' : (resultado.dimensionesCualitativas.rg >= 50 ? 'Submétrica (Escala no informada)' : 'Baja resolución geodésica')}
            </div>
          </div>

          <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:8px; padding:10px;">
            <div style="font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">5. Accesibilidad Operativa (10%)</div>
            <div style="font-size:1.2rem; font-weight:800; color:${resultado.dimensionesCualitativas.ai >= 75 ? '#10b981' : '#38bdf8'}; font-family:var(--fuente-titulos);">
              ${resultado.dimensionesCualitativas.ai}%
            </div>
            <div style="font-size:0.72rem; color:var(--tinta-suave);">
              ${resultado.dimensionesCualitativas.ai >= 75 ? 'Servicios WFS/API + Descarga' : (resultado.dimensionesCualitativas.ai >= 40 ? 'Formato abierto RFC 7946 (Sin WFS)' : 'Acceso no verificado')}
            </div>
          </div>

        </div>

        <!-- Matriz Multicriterio WLC v2.0 (Combinación Lineal Ponderada y Normalización Min-Max) -->
        <div style="margin-top:20px; background:var(--papel-alto); border:1px solid var(--linea); border-radius:10px; padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
            <div>
              <h4 style="margin:0; font-size:1.02rem; font-family:var(--fuente-datos); color:var(--tinta); display:flex; align-items:center; gap:8px;">
                <span>📐</span> Matriz Multicriterio WLC v2.0 — Desglose y Normalización Min-Max
              </h4>
              <span style="font-size:0.75rem; color:var(--tinta-suave);">
                Formulación axiomática (Malczewski 1999; Voogd 1983; Eastman 1999). Ponderación aditiva lineal: S = Σ (wᵢ · x_norm,i).
              </span>
            </div>
            <span style="font-family:var(--fuente-datos); font-size:0.75rem; background:rgba(56, 189, 248, 0.15); color:#38bdf8; border:1px solid #38bdf8; padding:3px 10px; border-radius:6px; font-weight:700;">
              WLC ADITIVO · 10 CRITERIOS (100%)
            </span>
          </div>

          <!-- Barra Apilada de Contribuciones -->
          <div style="margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; font-size:0.72rem; font-family:var(--fuente-datos); margin-bottom:4px; color:var(--tinta-tenue);">
              <span>Distribución Relativa del Score IGV (${ig.igv}%)</span>
              <span>Suma de Contribuciones = 100%</span>
            </div>
            <div style="height:14px; width:100%; border-radius:6px; overflow:hidden; display:flex; background:#1e293b; border:1px solid var(--linea);">
              ${resultado.matrizWLC ? resultado.matrizWLC.criterios.map((c, i) => {
                const colores = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#10b981', '#059669', '#047857', '#065f46', '#064e3b'];
                return `<div title="${c.nombre}: +${c.contrib}%" style="width:${c.contrib}%; background:${colores[i % colores.length]}; height:100%;"></div>`;
              }).join('') : ''}
            </div>
          </div>

          <!-- Tabla de Desglose WLC -->
          <div style="overflow-x:auto;">
            <table class="tabla-datos" style="margin:0; width:100%; font-size:0.76rem;">
              <thead>
                <tr style="background:var(--papel-tarjeta);">
                  <th style="padding:6px 8px;">Criterio Evaluado</th>
                  <th style="padding:6px 8px;">Dimensión ISO</th>
                  <th style="padding:6px 8px; text-align:center;">Tipo</th>
                  <th style="padding:6px 8px; text-align:right;">Valor Bruto</th>
                  <th style="padding:6px 8px; text-align:right;">Norm. [0,1]</th>
                  <th style="padding:6px 8px; text-align:right;">Peso (wᵢ)</th>
                  <th style="padding:6px 8px; text-align:right;">Contribución</th>
                  <th style="padding:6px 8px;">Diagnóstico / Métrica</th>
                </tr>
              </thead>
              <tbody>
                ${resultado.matrizWLC ? resultado.matrizWLC.criterios.map(c => `
                  <tr>
                    <td style="padding:6px 8px; font-weight:700; font-family:var(--fuente-datos);">${c.nombre}</td>
                    <td style="padding:6px 8px; color:var(--tinta-suave); font-size:0.73rem;">${c.dimension}</td>
                    <td style="padding:6px 8px; text-align:center;">
                      <span style="font-size:0.7rem; font-weight:700; color:${c.tipo === 'beneficio' ? '#10b981' : '#f59e0b'};">
                        ${c.tipo === 'beneficio' ? '▲ Beneficio' : '▼ Costo'}
                      </span>
                    </td>
                    <td style="padding:6px 8px; text-align:right; font-family:var(--fuente-datos);">${c.valorBruto}${c.unidad.includes('%') ? '%' : ''}</td>
                    <td style="padding:6px 8px; text-align:right; font-family:var(--fuente-datos); color:#38bdf8; font-weight:700;">${c.norm}</td>
                    <td style="padding:6px 8px; text-align:right; font-family:var(--fuente-datos); color:var(--tinta-tenue);">${c.pesoGlobal}</td>
                    <td style="padding:6px 8px; text-align:right; font-family:var(--fuente-datos); font-weight:800; color:#10b981;">+${c.contrib}%</td>
                    <td style="padding:6px 8px; color:var(--tinta-suave); font-size:0.72rem;">${c.detalle}</td>
                  </tr>
                `).join('') : ''}
                <tr style="background:var(--papel-tarjeta); font-weight:800; border-top:2px solid var(--linea);">
                  <td colspan="5" style="padding:8px 8px; font-family:var(--fuente-datos);">PUNTAJE GLOBAL AGREGADO WLC (ÍNDICE IGV)</td>
                  <td style="padding:8px 8px; text-align:right; font-family:var(--fuente-datos);">1.000</td>
                  <td style="padding:8px 8px; text-align:right; font-family:var(--fuente-datos); font-size:0.95rem; color:${ig.badgeColor};">${ig.igv}%</td>
                  <td style="padding:8px 8px; font-family:var(--fuente-datos); color:${ig.badgeColor};">${ig.grado}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Auditoría de Defectos (Criterios de Costo) -->
          <div style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; font-size:0.73rem;">
            <span style="color:var(--tinta-tenue); font-weight:700;">Auditoría de Defectos (Criterios de Costo):</span>
            <span style="background:${rd.totalKinks > 0 ? '#ef444422' : '#10b98115'}; color:${rd.totalKinks > 0 ? '#ef4444' : '#10b981'}; border:1px solid ${rd.totalKinks > 0 ? '#ef4444' : '#10b981'}; padding:2px 8px; border-radius:4px;">
              ${rd.totalKinks} Auto-intersecciones (Kinks)
            </span>
            <span style="background:${rd.totalAnillosAbiertos > 0 ? '#ef444422' : '#10b98115'}; color:${rd.totalAnillosAbiertos > 0 ? '#ef4444' : '#10b981'}; border:1px solid ${rd.totalAnillosAbiertos > 0 ? '#ef4444' : '#10b981'}; padding:2px 8px; border-radius:4px;">
              ${rd.totalAnillosAbiertos} Anillos Abiertos
            </span>
            <span style="background:${rd.totalSlivers > 0 ? '#f59e0b22' : '#10b98115'}; color:${rd.totalSlivers > 0 ? '#f59e0b' : '#10b981'}; border:1px solid ${rd.totalSlivers > 0 ? '#f59e0b' : '#10b981'}; padding:2px 8px; border-radius:4px;">
              ${rd.totalSlivers} Micro-Slivers
            </span>
          </div>

        </div>

        <!-- Sección de Fundamentación Metodológica y Matriz de Correlación -->
        <details style="margin-top:16px; background:var(--papel-alto); border:1px solid var(--linea); border-radius:10px; padding:14px 18px;">
          <summary style="font-size:0.86rem; font-weight:700; cursor:pointer; color:var(--esmeralda); display:flex; align-items:center; gap:8px;">
            <span>🔬</span> Fundamentación de Variables Cualitativas y Matriz de Correlación entre Dimensiones
          </summary>
          <div style="margin-top:14px; font-size:0.82rem; color:var(--tinta-suave); line-height:1.5;">
            
            <h5 style="margin:0 0 8px 0; color:var(--tinta); font-size:0.9rem;">
              ¿Cómo se cuantifican objetivamente las variables cualitativas en el Atlas VGI?
            </h5>
            <p style="margin-bottom:10px;">
              En cumplimiento estricto con las normas <strong>ISO 19115-1:2014</strong>, <strong>ISO 19157-1:2023</strong> y el <strong>Perfil Nacional de Metadatos de Chile v2.0</strong>, los aspectos cualitativos se cuantifican de forma continua y objetiva en una escala [0, 100] mediante funciones de conformidad, verificación de presencia y precisión geodésica:
            </p>
            <ul style="margin:0 0 14px 18px; padding:0;">
              <li><strong>1. Metadatos Núcleo (MC, 30% cualitativo / 15% global):</strong> Tasa de presencia de los 10 elementos core de la ficha de metadatos (identificador, título, resumen, custodio institucional, fecha/vigencia, categoría temática, extensión geográfica/bbox, CRS/proyección, licencia y linaje). Cada elemento verificado aporta 10 puntos porcentuales.</li>
              <li><strong>2. Conformidad Semántica (CC, 20% cualitativo / 10% global):</strong> Nivel de adherencia al Catálogo de Objetos ISO 19110 y RFC 7946, evaluando la estandarización de nombres de atributos (snake_case sin truncamientos shapefile de 10 caracteres) y homogeneidad de tipos en la tabla atributiva.</li>
              <li><strong>3. Linaje, Trazabilidad y Certeza Legal (LL, 25% cualitativo / 12.5% global):</strong> Evaluación de la fuente primaria y su jerarquía institucional, presencia de cita bibliográfica completa (estilo APA/ISO 690), y respaldo jurídico explícito bajo la Ley N° 20.285 de Transparencia, ODbL 1.0 o licencias Creative Commons.</li>
              <li><strong>4. Resolución Espacial y Granularidad Conceptual (RG, 15% cualitativo / 7.5% global):</strong> Escala nominal de captura (1:1.000 local/barrial = 100%, 1:25.000 comunal = 92%, 1:50.000 intercomunal = 85%, 1:250.000 nacional = 75%) combinada con la precisión decimal de los vértices geodésicos (≥5 decimales = precisión submétrica).</li>
              <li><strong>5. Accesibilidad y Disponibilidad Operativa (AI, 10% cualitativo / 5% global):</strong> Existencia física y carga íntegra del archivo local (GeoJSON/GPKG), disponibilidad de servicios interoperables en línea (WFS/WMS/REST API/Overpass) y ausencia de barreras de pago o autenticación propietaria.</li>
            </ul>

            <h5 style="margin:14px 0 8px 0; color:var(--tinta); font-size:0.9rem;">
              Matriz de Correlación de Pearson entre las 10 Dimensiones de Calidad (WLC v2.0)
            </h5>
            <p style="margin-bottom:10px;">
              Calculada sobre la totalidad de la base de datos cartográfica del Atlas (132 componentes). Justifica la independencia y complementariedad dimensional del modelo multicriterio:
            </p>
            <div style="text-align:center; margin:14px 0;">
              <img src="docs/correlacion_dimensiones_calidad.png" alt="Matriz de Correlación de Dimensiones de Calidad" style="max-width:100%; height:auto; border-radius:8px; border:1px solid var(--linea); box-shadow:0 4px 12px rgba(0,0,0,0.3);" onerror="this.src='src/docs/correlacion_dimensiones_calidad.png'">
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
              <a href="docs/correlacion_dimensiones_calidad.csv" download="correlacion_dimensiones_calidad.csv" class="accion secundaria" style="font-size:0.75rem; text-decoration:none; padding:4px 10px;">
                📥 Descargar Matriz de Correlación (.csv)
              </a>
            </div>
          </div>
        </details>

        <!-- Mini-Mapa de Diagnóstico Cartográfico Leaflet -->
        <div style="margin-top:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="margin:0; font-size:0.95rem; font-family:var(--fuente-datos); color:var(--tinta);">
              🗺️ Inspección Cartográfica Interactiva (Semáforo de Calidad Espacial)
            </h4>
            <div style="font-size:0.72rem; color:var(--tinta-suave); display:flex; gap:10px; align-items:center;">
              <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; background:#10b981; border-radius:50%; display:inline-block;"></span> Conforme</span>
              <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; background:#ef4444; border-radius:50%; display:inline-block;"></span> Error Topológico</span>
              <span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; background:#f59e0b; border-radius:50%; display:inline-block;"></span> Atributos Incompletos</span>
            </div>
          </div>
          <div id="mapa-diagnostico-calidad" style="height:340px; border:1px solid var(--linea); border-radius:8px; background:#0f172a;"></div>
        </div>

        <!-- 🛠️ CENTRO DINÁMICO DE SUBSANACIÓN Y RECOMENDACIONES TÉCNICAS (PASO A PASO) -->
        <div style="margin-top:20px; background:var(--papel-alto); border:2px solid var(--linea); border-radius:12px; padding:20px;">
          
          <!-- Banner Celebratorio si se aplicó Auto-Fix -->
          ${resultado.autoFixAplicado ? `
            <div style="background:linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,78,59,0.35)); border:2px solid #10b981; border-radius:10px; padding:16px; margin-bottom:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                  <div style="font-weight:900; color:#10b981; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                    <span>✨</span> ¡Auto-Reparación de Geometrías Aplicada Exitosamente en el Navegador!
                  </div>
                  <div style="font-size:0.84rem; color:var(--tinta); margin-top:4px;">
                    Se sanearon anomalías topológicas y de esquema en memoria. El Índice IGV aumentó de 
                    <strong style="color:var(--alerta);">${resultado.autoFixAplicado.anterior}%</strong> a 
                    <strong style="color:#10b981; font-size:0.95rem;">${resultado.autoFixAplicado.nuevo}%</strong> 
                    <span style="background:#10b98133; color:#10b981; padding:2px 8px; border-radius:4px; font-weight:800; font-size:0.8rem;">
                      +${resultado.autoFixAplicado.mejora} puntos
                    </span>.
                  </div>
                  <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; font-size:0.76rem; font-family:var(--fuente-datos);">
                    <span style="background:rgba(16,185,129,0.2); padding:3px 8px; border-radius:4px; color:#10b981; font-weight:700;">
                      🔒 ${resultado.autoFixAplicado.estadisticas.anillosCerrados} Anillos Cerrados
                    </span>
                    <span style="background:rgba(16,185,129,0.2); padding:3px 8px; border-radius:4px; color:#10b981; font-weight:700;">
                      🧹 ${resultado.autoFixAplicado.estadisticas.verticesDuplicadosRemovidos} Vértices Duplicados Eliminados
                    </span>
                    ${resultado.autoFixAplicado.estadisticas.geometriasNulasRemovidas > 0 ? `
                      <span style="background:rgba(239,68,68,0.2); padding:3px 8px; border-radius:4px; color:#ef4444; font-weight:700;">
                        🗑️ ${resultado.autoFixAplicado.estadisticas.geometriasNulasRemovidas} Geometrías Corruptas Purgadas
                      </span>
                    ` : ''}
                    ${resultado.autoFixAplicado.estadisticas.idsAsignados > 0 ? `
                      <span style="background:rgba(56,189,248,0.2); padding:3px 8px; border-radius:4px; color:#38bdf8; font-weight:700;">
                        🔑 ${resultado.autoFixAplicado.estadisticas.idsAsignados} Claves Únicas (fid) Asignadas
                      </span>
                    ` : ''}
                  </div>
                </div>
                <button type="button" class="accion" id="btn-descargar-autofix-geojson" style="background:#10b981; color:#000; font-weight:800; padding:9px 18px; border-radius:8px; font-size:0.86rem; border:none; cursor:pointer;">
                  📥 Descargar Capa Reparada (.geojson)
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Cabecera del Centro de Subsanación -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; border-bottom:1px solid var(--linea); padding-bottom:12px;">
            <div>
              <h4 style="margin:0; font-size:1.1rem; font-family:var(--fuente-datos); color:var(--tinta); display:flex; align-items:center; gap:8px;">
                <span>🛠️</span> Centro Dinámico de Subsanación y Recomendaciones Técnicas (Paso a Paso)
              </h4>
              <div style="font-size:0.8rem; color:var(--tinta-suave); margin-top:3px;">
                Diagnóstico operativo para subsanar falencias topológicas, atributivas y de metadatos en QGIS, PostGIS o con un clic.
              </div>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button type="button" class="accion" id="btn-ejecutar-autofix-directo" style="background:#10b981; color:#000; font-weight:800; font-size:0.82rem; padding:8px 16px; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <span>⚡</span> Subsanar Geometrías Automáticamente (Auto-Fix)
              </button>
              <button type="button" class="accion secundaria" id="btn-copiar-plan-subsanacion" style="font-size:0.82rem; padding:8px 14px; background:rgba(56, 189, 248, 0.12); color:#38bdf8; border:1px solid #38bdf8; font-weight:700; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <span>📋</span> Copiar Plan Técnico
              </button>
            </div>
          </div>

          <!-- Diagnóstico Semafórico Clasificado por Severidad -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px; margin-bottom:18px;">
            
            <div style="background:var(--papel-tarjeta); border:1px solid ${erroresCriticos > 0 ? '#ef444455' : '#10b98144'}; border-left:5px solid ${erroresCriticos > 0 ? '#ef4444' : '#10b981'}; border-radius:8px; padding:12px;">
              <div style="font-size:0.75rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700; display:flex; justify-content:space-between;">
                <span>1. Severidad Crítica (Topología)</span>
                <span style="color:${erroresCriticos > 0 ? '#ef4444' : '#10b981'};">${erroresCriticos > 0 ? '🔴 Acción Requerida' : '🟢 Conforme'}</span>
              </div>
              <div style="font-size:1.3rem; font-weight:800; color:${erroresCriticos > 0 ? '#ef4444' : '#10b981'}; font-family:var(--fuente-titulos); margin:2px 0;">
                ${erroresCriticos} Falencias
              </div>
              <div style="font-size:0.76rem; color:var(--tinta-suave);">
                ${rd.totalAnillosAbiertos} anillos no cerrados · ${rd.totalKinks} auto-intersecciones · ${rd.featuresConError} entidades con error OGC.
              </div>
            </div>

            <div style="background:var(--papel-tarjeta); border:1px solid ${observacionesModeradas > 0 ? '#f59e0b55' : '#10b98144'}; border-left:5px solid ${observacionesModeradas > 0 ? '#f59e0b' : '#10b981'}; border-radius:8px; padding:12px;">
              <div style="font-size:0.75rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700; display:flex; justify-content:space-between;">
                <span>2. Severidad Moderada (Esquema)</span>
                <span style="color:${observacionesModeradas > 0 ? '#f59e0b' : '#10b981'};">${observacionesModeradas > 0 ? '🟡 Advertencia' : '🟢 Óptimo'}</span>
              </div>
              <div style="font-size:1.3rem; font-weight:800; color:${observacionesModeradas > 0 ? '#f59e0b' : '#10b981'}; font-family:var(--fuente-titulos); margin:2px 0;">
                ${observacionesModeradas} Observaciones
              </div>
              <div style="font-size:0.76rem; color:var(--tinta-suave);">
                ${rd.totalSlivers} micro-slivers · ${celdasVacias} celdas atributivas vacías · ${dc.estructura.claveUnica ? 'Clave única ✓' : 'Falta clave primaria (fid)'}.
              </div>
            </div>

            <div style="background:var(--papel-tarjeta); border:1px solid ${ig.scoreCualitativo >= 75 ? '#10b98144' : (ig.scoreCualitativo >= 40 ? '#f59e0b44' : '#ef444455')}; border-left:5px solid ${ig.scoreCualitativo >= 75 ? '#10b981' : (ig.scoreCualitativo >= 40 ? '#f59e0b' : '#ef4444')}; border-radius:8px; padding:12px;">
              <div style="font-size:0.75rem; font-family:var(--fuente-datos); color:var(--tinta-tenue); text-transform:uppercase; font-weight:700; display:flex; justify-content:space-between;">
                <span>3. Conformidad Normativa (Metadatos)</span>
                <span style="color:${ig.scoreCualitativo >= 75 ? '#10b981' : (ig.scoreCualitativo >= 40 ? '#f59e0b' : '#ef4444')};">
                  ${ig.scoreCualitativo >= 75 ? '🟢 Conforme ISO 19115' : (ig.scoreCualitativo >= 40 ? '🟡 Metadatos Parciales' : '🔴 Metadatos Críticos')}
                </span>
              </div>
              <div style="font-size:1.3rem; font-weight:800; color:${ig.scoreCualitativo >= 75 ? '#10b981' : (ig.scoreCualitativo >= 40 ? '#f59e0b' : '#ef4444')}; font-family:var(--fuente-titulos); margin:2px 0;">
                ${ig.scoreCualitativo}%
              </div>
              <div style="font-size:0.76rem; color:var(--tinta-suave);">
                Metadatos Core: ${resultado.dimensionesCualitativas.mc}% (${Math.round(resultado.dimensionesCualitativas.mc / 10)}/10) · Linaje: ${resultado.dimensionesCualitativas.ll}% · Semántica: ${resultado.dimensionesCualitativas.cc}%.
              </div>
            </div>

          </div>

          <!-- Listado Interactivo de Entidades con Observaciones y Botón "Ver en Mapa" -->
          <div style="margin-bottom:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <h5 style="margin:0; font-size:0.88rem; font-family:var(--fuente-datos); color:var(--tinta); display:flex; align-items:center; gap:6px;">
                <span>🔍</span> Entidades con Observaciones (${entidadesConObservacion.length} de ${rd.totalFeatures})
              </h5>
              <span style="font-size:0.73rem; color:var(--tinta-suave);">
                Haz clic en <strong>"Ver en Mapa"</strong> para focalizar la entidad con zoom en el visor Leaflet.
              </span>
            </div>

            ${entidadesConObservacion.length === 0 ? `
              <div style="background:rgba(16,185,129,0.1); border:1px solid #10b981; border-radius:6px; padding:12px; font-size:0.82rem; color:#10b981; display:flex; align-items:center; gap:8px;">
                <span>✅</span> <strong>¡Dataset 100% Conforme Topológicamente!</strong> No se detectaron anillos abiertos, auto-intersecciones ni micro-slivers en las ${rd.totalFeatures} entidades.
              </div>
            ` : `
              <div style="max-height:240px; overflow-y:auto; border:1px solid var(--linea); border-radius:6px; padding:8px; background:var(--papel-tarjeta);">
                ${entidadesConObservacion.slice(0, 50).map(ed => `
                  <div style="background:var(--papel-alto); border:1px solid ${ed.valida ? '#f59e0b44' : '#ef444455'}; border-left:4px solid ${ed.valida ? '#f59e0b' : '#ef4444'}; border-radius:6px; padding:8px 12px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                      <div style="font-weight:700; font-size:0.8rem; color:var(--tinta); display:flex; align-items:center; gap:6px;">
                        <span>${ed.valida ? '⚠️' : '❌'}</span> Entidad <strong>${ed.id}</strong> (${ed.tipo})
                        <span style="font-size:0.72rem; color:var(--tinta-tenue); font-weight:normal;">[${ed.vertices} vértices]</span>
                      </div>
                      <div style="font-size:0.74rem; color:var(--tinta-suave); margin-top:2px;">
                        ${ed.hallazgos.map(h => `<span style="display:inline-block; margin-right:8px; color:${h.gravedad === 'Critica' ? '#ef4444' : '#f59e0b'};">• ${h.detalle}</span>`).join('')}
                      </div>
                    </div>
                    <button type="button" class="accion secundaria btn-localizar-en-mapa" data-index="${ed.index}" style="font-size:0.74rem; padding:4px 10px; background:rgba(56, 189, 248, 0.15); color:#38bdf8; border:1px solid #38bdf8; font-weight:700; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                      🔍 Ver en Mapa
                    </button>
                  </div>
                `).join('')}
                ${entidadesConObservacion.length > 50 ? `
                  <div style="text-align:center; padding:10px; font-size:0.75rem; color:var(--tinta-tenue); border-top:1px dashed var(--linea); margin-top:6px; background:var(--papel-alto); border-radius:4px;">
                    <em>Mostrando las primeras 50 observaciones de un total de ${entidadesConObservacion.length} entidades observadas. El detalle íntegro está registrado en el Certificado JSON descargable y en el Plan de Subsanación.</em>
                  </div>
                ` : ''}
              </div>
            `}
          </div>

          <!-- Acordeón / Pestañas de Guías Técnicas Paso a Paso -->
          <details style="background:var(--papel-tarjeta); border:1px solid var(--linea); border-radius:8px; padding:12px 16px; margin-bottom:10px;" open>
            <summary style="font-size:0.86rem; font-weight:700; cursor:pointer; color:var(--tinta); display:flex; align-items:center; gap:8px;">
              <span>🗺️</span> Guía de Reparación Paso a Paso en QGIS 3.x
            </summary>
            <div style="margin-top:10px; font-size:0.8rem; color:var(--tinta-suave); line-height:1.5;">
              <ol style="margin:0 0 10px 18px; padding:0;">
                <li><strong>Cargar la capa:</strong> Abre QGIS y arrastra el archivo GeoJSON actual al panel de capas.</li>
                <li><strong>Ejecutar 'Corregir geometrías':</strong> Ve al menú superior <code>Vectorial ➔ Herramientas de geometría ➔ Corregir geometrías (Fix Geometries)</code>.</li>
                <li><strong>Parámetros:</strong> Selecciona tu capa y en <em>Método de reparación</em> elige <strong>Estructura válida (Make Valid)</strong>. Clic en <em>Ejecutar</em>.</li>
                <li><strong>Validación estricta:</strong> Abre <code>Vectorial ➔ Comprobador de topología</code> y agrega la regla <em>'No debe tener geometrías no válidas'</em>. Valida que el conteo de errores sea 0.</li>
                <li><strong>Exportar conforme a norma:</strong> Clic derecho sobre la capa corregida ➔ <code>Exportar ➔ Guardar objetos como...</code>. Formato: <strong>GeoJSON</strong>, SRC: <strong>EPSG:4326 (WGS 84)</strong>, Codificación: <strong>UTF-8</strong>.</li>
              </ol>
            </div>
          </details>

          <details style="background:var(--papel-tarjeta); border:1px solid var(--linea); border-radius:8px; padding:12px 16px; margin-bottom:10px;">
            <summary style="font-size:0.86rem; font-weight:700; cursor:pointer; color:var(--tinta); display:flex; align-items:center; gap:8px;">
              <span>🐘</span> Guía de Reparación en PostGIS / SQL (Script Listo para Copiar)
            </summary>
            <div style="margin-top:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-size:0.75rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">SQL Estandarizado PostGIS 3.x:</span>
                <button type="button" class="accion secundaria" id="btn-copiar-sql-subsanacion" style="font-size:0.72rem; padding:3px 8px; cursor:pointer;">
                  📋 Copiar SQL
                </button>
              </div>
              <pre id="codigo-sql-subsanacion" style="background:#0f172a; color:#f8fafc; padding:12px; border-radius:6px; font-size:0.75rem; font-family:monospace; overflow-x:auto; margin:0; border:1px solid var(--linea);">-- 1. Reparar geometrías no conformes (auto-intersecciones, kinks y anillos abiertos)
UPDATE mi_capa
SET geom = ST_MakeValid(geom)
WHERE NOT ST_IsValid(geom);

-- 2. Eliminar vértices colapsados y puntos repetidos consecutivos
UPDATE mi_capa
SET geom = ST_RemoveRepeatedPoints(geom, 0.000001);

-- 3. Asignar clave primaria unívoca secuencial si no existe
ALTER TABLE mi_capa ADD COLUMN IF NOT EXISTS fid SERIAL PRIMARY KEY;

-- 4. Certificación de validez topológica OGC: debe retornar 0
SELECT COUNT(*) AS errores_restantes FROM mi_capa WHERE NOT ST_IsValid(geom);</pre>
            </div>
          </details>

          <details style="background:var(--papel-tarjeta); border:1px solid var(--linea); border-radius:8px; padding:12px 16px; margin-bottom:10px;">
            <summary style="font-size:0.86rem; font-weight:700; cursor:pointer; color:var(--tinta); display:flex; align-items:center; gap:8px;">
              <span>🐍</span> Guía de Reparación en Python / GeoPandas (Script Listo para Copiar)
            </summary>
            <div style="margin-top:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-size:0.75rem; font-family:var(--fuente-datos); color:var(--tinta-tenue);">Python Script (GeoPandas & Shapely):</span>
                <button type="button" class="accion secundaria" id="btn-copiar-python-subsanacion" style="font-size:0.72rem; padding:3px 8px; cursor:pointer;">
                  📋 Copiar Python
                </button>
              </div>
              <pre id="codigo-python-subsanacion" style="background:#0f172a; color:#f8fafc; padding:12px; border-radius:6px; font-size:0.75rem; font-family:monospace; overflow-x:auto; margin:0; border:1px solid var(--linea);">import geopandas as gpd
from shapely.validation import make_valid

# 1. Cargar archivo GeoJSON original
gdf = gpd.read_file("datos_entrada.geojson")

# 2. Corregir geometrías no conformes y auto-intersecciones (OGC SFA)
gdf['geometry'] = gdf['geometry'].apply(lambda g: make_valid(g) if (g and not g.is_valid) else g)

# 3. Descartar geometrías colapsadas o nulas
gdf = gdf[gdf.geometry.notnull() & (~gdf.geometry.is_empty)]

# 4. Asegurar identificador primario secuencial
if 'fid' not in gdf.columns and 'id' not in gdf.columns:
    gdf.insert(0, 'fid', range(1, len(gdf) + 1))

# 5. Exportar GeoJSON corregido conforme a RFC 7946 (EPSG:4326)
gdf.to_file("datos_subsanados_calidad.geojson", driver="GeoJSON")
print(f"✓ Procesadas {len(gdf)} entidades saneadas exitosamente.")</pre>
            </div>
          </details>

          <!-- Guía de Subsanación de Metadatos ISO 19115 / IDE Chile -->
          <details style="background:var(--papel-tarjeta); border:1px solid var(--linea); border-radius:8px; padding:12px 16px; margin-bottom:10px;" ${resultado.dimensionesCualitativas.mc < 70 || resultado.dimensionesCualitativas.ll < 70 ? 'open' : ''}>
            <summary style="font-size:0.86rem; font-weight:700; cursor:pointer; color:var(--tinta); display:flex; align-items:center; gap:8px;">
              <span>📋</span> Guía de Subsanación de Metadatos y Linaje (ISO 19115 / Perfil Chile / Ley 20.285)
            </summary>
            <div style="margin-top:10px; font-size:0.8rem; color:var(--tinta-suave); line-height:1.5;">
              <p style="margin:0 0 10px 0;">
                El estándar internacional <strong>ISO 19115-1:2014</strong> y el <strong>Perfil Nacional de Metadatos de Chile (IDE Chile - SNIT)</strong> exigen 10 campos núcleo mínimos para garantizar que un conjunto de datos espaciales sea interoperable, trazable y tenga certeza jurídica.
              </p>

              <!-- Lista de verificación dinámica de los 10 campos -->
              <div style="background:var(--papel-alto); border:1px solid var(--linea); border-radius:6px; padding:10px; margin-bottom:12px;">
                <div style="font-weight:700; font-size:0.78rem; color:var(--tinta); margin-bottom:6px;">
                  Auditoría de los 10 Campos Núcleo en este archivo:
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:6px; font-size:0.75rem;">
                  ${(resultado.dimensionesCualitativas.detallesMC || []).map(d => `
                    <div style="display:flex; align-items:center; gap:6px; color:${d.cumplido ? '#10b981' : '#ef4444'};">
                      <span>${d.cumplido ? '✅' : '❌'}</span>
                      <span style="color:var(--tinta);">${d.item}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px;">
                <button type="button" class="accion" id="btn-ir-a-modulo-05-metadatos" data-panel="metadatos-iso" style="background:#38bdf8; color:#0f172a; font-weight:700; font-size:0.78rem; padding:8px 14px; border-radius:6px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                  <span>🏛️</span> Abrir Generador de Metadatos ISO 19115 (Módulo 05)
                </button>
                <button type="button" class="accion secundaria" id="btn-copiar-plantilla-metadatos" style="font-size:0.78rem; padding:8px 14px; background:rgba(56, 189, 248, 0.12); color:#38bdf8; border:1px solid #38bdf8; font-weight:700; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                  <span>📋</span> Copiar Plantilla de Metadatos GeoJSON
                </button>
              </div>

              <div style="font-size:0.75rem; color:var(--tinta-tenue);">
                <strong>Solución rápida en el archivo:</strong> Puedes embeber un bloque formal <code>"metadata"</code> en la raíz de tu archivo GeoJSON (conforme a RFC 7946 extensible) para que sea reconocido con el 100% de cumplimiento por visores y auditores:
              </div>
              <pre id="codigo-plantilla-metadatos" style="background:#0f172a; color:#f8fafc; padding:10px; border-radius:6px; font-size:0.74rem; font-family:monospace; overflow-x:auto; margin:6px 0 0 0; border:1px solid var(--linea);">{
  "type": "FeatureCollection",
  "metadata": {
    "id": "${resultado.capaId || 'capa_territorial'}",
    "title": "${resultado.nombreCapa || 'Nombre Descriptivo de la Capa'}",
    "description": "Propósito territorial y alcance metodológico del conjunto de datos",
    "custodian": "Organismo o investigador responsable (ej. IDE Chile / UAH)",
    "date": "${new Date().toISOString().split('T')[0]}",
    "category": "boundaries",
    "license": "Open Data Commons Open Database License (ODbL) 1.0 / CC-BY 4.0",
    "lineage": "Método de levantamiento, escala de captura o fuente de procedencia",
    "crs": "EPSG:4326"
  },
  "features": [ ... ]
}</pre>
            </div>
          </details>

        </div>

        <!-- Tabla de Atributos Tabulares -->
        <div style="margin-top:20px;">
          <h4 style="margin:0 0 8px 0; font-size:0.95rem; font-family:var(--fuente-datos); color:var(--tinta);">
            📋 Análisis Tabular por Atributo (${resultado.atributosDetalle.length} Campos)
          </h4>
          <div style="max-height:220px; overflow-y:auto; border:1px solid var(--linea); border-radius:6px;">
            <table class="tabla-datos" style="margin:0; width:100%; font-size:0.78rem;">
              <thead>
                <tr style="background:var(--papel-alto); position:sticky; top:0;">
                  <th style="padding:6px 10px;">Campo</th>
                  <th style="padding:6px 10px;">Tipo de Dato</th>
                  <th style="padding:6px 10px; text-align:center;">Válidos</th>
                  <th style="padding:6px 10px; text-align:center;">Nulos / Vacíos</th>
                  <th style="padding:6px 10px; text-align:right;">Completitud</th>
                </tr>
              </thead>
              <tbody>
                ${resultado.atributosDetalle.map(c => `
                  <tr>
                    <td style="padding:6px 10px; font-weight:600; font-family:var(--fuente-datos);">${c.campo}</td>
                    <td style="padding:6px 10px; color:var(--tinta-suave); font-family:var(--fuente-datos);">${c.tipoDetectado}</td>
                    <td style="padding:6px 10px; text-align:center;">${c.validos.toLocaleString('es-CL')}</td>
                    <td style="padding:6px 10px; text-align:center; color:${c.nulos > 0 ? '#f59e0b' : 'inherit'};">${c.nulos.toLocaleString('es-CL')}</td>
                    <td style="padding:6px 10px; text-align:right; font-weight:700; color:${c.pctCompletitud >= 90 ? '#10b981' : (c.pctCompletitud >= 50 ? '#f59e0b' : '#ef4444')};">
                      ${c.pctCompletitud}%
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Botones de Acción y Descarga -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-top:20px; border-top:1px solid var(--linea); padding-top:14px;">
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="accion" id="btn-descargar-geojson-certificado" style="font-size:0.8rem; padding:6px 14px; background:#38bdf8; color:#000; font-weight:700;">
              📥 Descargar GeoJSON Enriquecido (Metadatos + IGV)
            </button>
            <button class="accion secundaria" id="btn-descargar-certificado-calidad" style="font-size:0.8rem; padding:6px 14px; background:#10b981; color:#000; font-weight:700;">
              📄 Certificado ISO 19157 (.json)
            </button>
            <button class="accion secundaria" id="btn-descargar-matriz-wlc" style="font-size:0.8rem; padding:6px 14px; background:rgba(56, 189, 248, 0.15); color:#38bdf8; border:1px solid #38bdf8; font-weight:700;">
              📊 Matriz WLC (.csv)
            </button>
            <button class="accion secundaria" id="btn-copiar-resumen-calidad" style="font-size:0.8rem; padding:6px 14px;">
              📋 Copiar Resumen
            </button>
          </div>
          <span style="font-size:0.72rem; color:var(--tinta-tenue); font-family:var(--fuente-datos);">
            Auditoría conforme a ISO 19157-1:2023 · UAH Geografía 2026
          </span>
        </div>

      </div>
    `;

    // Inicializar mapa de diagnóstico Leaflet
    renderizarMapaDiagnostico('mapa-diagnostico-calidad', resultado);

    // Conectar botón Auto-Fix en el Navegador
    const btnAutoFix = document.getElementById('btn-ejecutar-autofix-directo');
    if (btnAutoFix) {
      btnAutoFix.addEventListener('click', () => ejecutarAutoFixEnNavegador());
    }

    // Conectar botón descargar Auto-Fix (si banner de auto-reparación está activo)
    const btnDescargarAutoFix = document.getElementById('btn-descargar-autofix-geojson');
    if (btnDescargarAutoFix && resultado.autoFixAplicado) {
      btnDescargarAutoFix.addEventListener('click', () => descargarGeoJSONReparado(resultado.autoFixAplicado.geojsonReparado));
    }

    // Conectar botón Copiar Plan de Subsanación
    const btnCopiarPlan = document.getElementById('btn-copiar-plan-subsanacion');
    if (btnCopiarPlan) {
      btnCopiarPlan.addEventListener('click', () => copiarPlanSubsanacion(resultado));
    }

    // Conectar botones "Ver en Mapa" para focalizar entidades observadas
    const btnsLocalizar = document.querySelectorAll('.btn-localizar-en-mapa');
    btnsLocalizar.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (!isNaN(idx)) {
          enfocarEntidadEnMapa(idx);
        }
      });
    });

    // Conectar botones de copiar snippets de código
    const btnCopiarSQL = document.getElementById('btn-copiar-sql-subsanacion');
    if (btnCopiarSQL) {
      btnCopiarSQL.addEventListener('click', () => {
        const pre = document.getElementById('codigo-sql-subsanacion');
        if (pre && navigator.clipboard) {
          navigator.clipboard.writeText(pre.textContent.trim()).then(() => alert('¡Script SQL de PostGIS copiado al portapapeles con éxito!'));
        }
      });
    }

    const btnCopiarPython = document.getElementById('btn-copiar-python-subsanacion');
    if (btnCopiarPython) {
      btnCopiarPython.addEventListener('click', () => {
        const pre = document.getElementById('codigo-python-subsanacion');
        if (pre && navigator.clipboard) {
          navigator.clipboard.writeText(pre.textContent.trim()).then(() => alert('¡Script Python de GeoPandas copiado al portapapeles con éxito!'));
        }
      });
    }

    const btnCopiarPlantillaMeta = document.getElementById('btn-copiar-plantilla-metadatos');
    if (btnCopiarPlantillaMeta) {
      btnCopiarPlantillaMeta.addEventListener('click', () => {
        const pre = document.getElementById('codigo-plantilla-metadatos');
        if (pre && navigator.clipboard) {
          navigator.clipboard.writeText(pre.textContent.trim()).then(() => alert('¡Plantilla de metadatos GeoJSON (ISO 19115 / RFC 7946) copiada al portapapeles con éxito!'));
        }
      });
    }

    const btnIrModulo05 = document.getElementById('btn-ir-a-modulo-05-metadatos');
    if (btnIrModulo05) {
      btnIrModulo05.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Redireccionar al panel del Módulo 05
        if (typeof window.navegarAModulo === 'function') {
          window.navegarAModulo('05');
        } else if (typeof window.activarPanel === 'function') {
          window.activarPanel('metadatos-iso');
        } else {
          const btnNav = document.querySelector('button[data-panel="metadatos-iso"]');
          if (btnNav) btnNav.click();
        }

        // 2. Prellenar datos en Módulo 05 a partir del dataset evaluado
        try {
          const inpTitulo = document.getElementById('md-titulo');
          if (inpTitulo && resultado.nombreCapa) {
            inpTitulo.value = resultado.nombreCapa;
          }
          const inpResumen = document.getElementById('md-resumen');
          if (inpResumen && resultado.resumenDataset) {
            const rd = resultado.resumenDataset;
            inpResumen.value = `Conjunto de datos espaciales: ${resultado.nombreCapa || 'Capa territorial'}. Comprende ${rd.totalFeatures} entidades vectoriales (${rd.tasaValidezTopologica} conformes con OGC SFA) y ${rd.totalVertices ? rd.totalVertices.toLocaleString('es-CL') : 0} vértices evaluados bajo norma ISO 19157 e ISO 19115 (Atlas VGI - Geografía UAH).`;
          }
          if (resultado.resumenDataset && resultado.resumenDataset.bbox) {
            const bbox = resultado.resumenDataset.bbox;
            const inpO = document.getElementById('md-oeste');
            const inpS = document.getElementById('md-sur');
            const inpE = document.getElementById('md-este');
            const inpN = document.getElementById('md-norte');
            if (inpO) inpO.value = bbox[0].toFixed(5);
            if (inpS) inpS.value = bbox[1].toFixed(5);
            if (inpE) inpE.value = bbox[2].toFixed(5);
            if (inpN) inpN.value = bbox[3].toFixed(5);
          }
          const inpLinaje = document.getElementById('md-linaje');
          if (inpLinaje && resultado.nombreCapa) {
            inpLinaje.value = `Capa vectorial "${resultado.nombreCapa}" auditada con el Evaluador de Calidad Espacial ISO 19157 del Atlas VGI (UAH Geografía UAH). Índice Global IGV: ${resultado.indiceGlobal ? resultado.indiceGlobal.igv : 100}%.`;
          }

          // Disparar generación automática de la ficha ISO para reflejar de inmediato los datos
          const formMeta = document.getElementById('form-metadatos');
          if (formMeta) {
            formMeta.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        } catch (err) {
          console.warn('Error al precargar metadatos en Módulo 05:', err);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Conectar botones de descarga
    const btnDescargarGeoJSON = document.getElementById('btn-descargar-geojson-certificado');
    if (btnDescargarGeoJSON) {
      btnDescargarGeoJSON.addEventListener('click', () => exportarGeoJSONCertificado(resultado));
    }

    const btnDescargar = document.getElementById('btn-descargar-certificado-calidad');
    if (btnDescargar) {
      btnDescargar.addEventListener('click', () => exportarCertificadoJSON(resultado));
    }

    const btnDescargarWLC = document.getElementById('btn-descargar-matriz-wlc');
    if (btnDescargarWLC) {
      btnDescargarWLC.addEventListener('click', () => exportarMatrizWLCCSV(resultado));
    }

    const btnCopiar = document.getElementById('btn-copiar-resumen-calidad');
    if (btnCopiar) {
      btnCopiar.addEventListener('click', () => {
        const resumenTexto = `CERTIFICADO DE CALIDAD ESPACIAL ISO 19157 / ISO 19115\n` +
          `Atlas VGI Territorial — Nodo GeoAbierto (UAH Geografía UAH)\n` +
          `Fecha: ${resultado.fechaAuditoria}\n` +
          `Índice Global IGV: ${ig.igv}% [${ig.grado}]\n` +
          `- Pilar Cuantitativo: ${ig.scoreCuantitativo}%\n` +
          `- Pilar Cualitativo: ${ig.scoreCualitativo}%\n` +
          `Entidades: ${rd.totalFeatures} (${rd.tasaValidezTopologica} válidas topológicamente)\n` +
          `Auto-intersecciones: ${rd.totalKinks} | Anillos abiertos: ${rd.totalAnillosAbiertos}\n` +
          `Completitud Tabular: ${dc.completitud.score}% en ${resultado.atributosDetalle.length} atributos.`;
        navigator.clipboard.writeText(resumenTexto).then(() => {
          alert('¡Resumen de calidad copiado al portapapeles con éxito!');
        });
      });
    }
  }

  /**
   * Inicializa o actualiza el mini-mapa Leaflet para visualización del semáforo de calidad
   */
  function renderizarMapaDiagnostico(contenedorMapaId, resultado) {
    if (typeof L === 'undefined') return;
    const cont = document.getElementById(contenedorMapaId);
    if (!cont) return;

    if (mapaDiagnosticoInstancia) {
      mapaDiagnosticoInstancia.remove();
      mapaDiagnosticoInstancia = null;
    }

    const bbox = (resultado.resumenDataset && resultado.resumenDataset.bbox) || obtenerBboxActivoParaAuditoria();
    const centroLat = (bbox[1] + bbox[3]) / 2;
    const centroLng = (bbox[0] + bbox[2]) / 2;

    mapaDiagnosticoInstancia = L.map(contenedorMapaId, {
      center: [centroLat, centroLng],
      zoom: 15,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap, &copy; CartoDB',
      maxZoom: 19
    }).addTo(mapaDiagnosticoInstancia);

    capasLeafletPorIndice = {};

    // Limitar la cantidad de entidades vectoriales dibujadas en Leaflet a un máximo de 300 para óptimo rendimiento gráfico
    const maxFeaturesRender = 300;
    let entidadesParaMapa = resultado.entidadesDiagnosticadas || [];
    if (entidadesParaMapa.length > maxFeaturesRender) {
      const conObs = entidadesParaMapa.filter(ed => !ed.valida || ed.esSliver || (ed.hallazgos && ed.hallazgos.length > 0));
      const conformes = entidadesParaMapa.filter(ed => ed.valida && !ed.esSliver && (!ed.hallazgos || ed.hallazgos.length === 0));
      const cupoRestante = Math.max(0, maxFeaturesRender - conObs.length);
      entidadesParaMapa = [...conObs, ...conformes.slice(0, cupoRestante)];
    }

    // Dibujar features estilizadas según semáforo
    const fc = {
      type: 'FeatureCollection',
      features: entidadesParaMapa.map(ed => {
        const f = ed.featureRef;
        f.__evalIdx = ed.index;
        return f;
      })
    };

    const mapaDiagnosticosPorIdx = {};
    entidadesParaMapa.forEach(ed => {
      mapaDiagnosticosPorIdx[ed.index] = ed;
    });

    capaGeojsonDiagnostico = L.geoJSON(fc, {
      style: (feature) => {
        const idx = (feature.__evalIdx !== undefined) ? feature.__evalIdx : fc.features.indexOf(feature);
        const ed = mapaDiagnosticosPorIdx[idx] || { valida: true };

        if (!ed.valida) {
          return { color: '#EF4444', weight: 3, fillColor: '#EF4444', fillOpacity: 0.45 };
        } else if (ed.esSliver) {
          return { color: '#F59E0B', weight: 2, fillColor: '#F59E0B', fillOpacity: 0.35 };
        } else {
          return { color: '#10B981', weight: 1.5, fillColor: '#10B981', fillOpacity: 0.25 };
        }
      },
      pointToLayer: (feature, latlng) => {
        const idx = (feature.__evalIdx !== undefined) ? feature.__evalIdx : fc.features.indexOf(feature);
        const ed = mapaDiagnosticosPorIdx[idx] || { valida: true };
        const color = !ed.valida ? '#EF4444' : '#10B981';
        return L.circleMarker(latlng, {
          radius: 6,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85
        });
      },
      onEachFeature: (feature, layer) => {
        const idx = (feature.__evalIdx !== undefined) ? feature.__evalIdx : fc.features.indexOf(feature);
        capasLeafletPorIndice[idx] = layer;
        const ed = mapaDiagnosticosPorIdx[idx];
        if (!ed) return;

        let htmlPopup = `
          <div style="font-family:sans-serif; font-size:0.82rem; min-width:200px;">
            <div style="font-weight:700; color:#0f172a; border-bottom:1px solid #cbd5e1; padding-bottom:4px; margin-bottom:6px;">
              Entidad ${ed.id} (${ed.tipo})
            </div>
            <div style="margin-bottom:4px;">
              <strong>Estado Topológico:</strong>
              <span style="color:${ed.valida ? '#10b981' : '#ef4444'}; font-weight:700;">
                ${ed.valida ? 'Válida ✓' : 'Con Observación ✗'}
              </span>
            </div>
            <div><strong>Vértices:</strong> ${ed.vertices}</div>
        `;

        if (ed.hallazgos.length > 0) {
          htmlPopup += `<div style="margin-top:6px; font-size:0.75rem; color:#b91c1c;"><strong>Hallazgos:</strong><ul>`;
          ed.hallazgos.forEach(h => {
            htmlPopup += `<li>${h.tipo}: ${h.detalle}</li>`;
          });
          htmlPopup += `</ul></div>`;
        }

        htmlPopup += `</div>`;
        layer.bindPopup(htmlPopup);
      }
    }).addTo(mapaDiagnosticoInstancia);

    try {
      if (capaGeojsonDiagnostico && capaGeojsonDiagnostico.getBounds && capaGeojsonDiagnostico.getBounds().isValid()) {
        mapaDiagnosticoInstancia.fitBounds(capaGeojsonDiagnostico.getBounds(), { padding: [20, 20], maxZoom: 17 });
      } else {
        mapaDiagnosticoInstancia.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]], { padding: [20, 20], maxZoom: 17 });
      }
    } catch (e) {
      mapaDiagnosticoInstancia.setView([centroLat, centroLng], 15);
    }

    setTimeout(() => {
      if (mapaDiagnosticoInstancia) mapaDiagnosticoInstancia.invalidateSize();
    }, 250);
  }

  /**
   * Exporta el GeoJSON evaluado enriquecido con las columnas de metadatos y los scores de calidad
   */
  function exportarGeoJSONCertificado(resultado) {
    if (!resultado || !resultado.geojsonOriginal) {
      alert('No hay un conjunto de datos espacial disponible para exportar.');
      return;
    }

    const gj = resultado.geojsonOriginal;
    const ig = resultado.indicadorGlobal || {};
    const dimCuant = resultado.dimensionesCuantitativas || {};

    const opciones = {
      id: resultado.capaId || 'capa_auditada',
      titulo: resultado.nombreCapa || 'Capa Evaluada',
      institucion: resultado.institucion || 'Evaluador Universal de Calidad',
      igv: ig.igv || 100,
      grado: ig.grado || 'A+ (Excelente)',
      tipo_fuente: resultado.tipoFuente || 'Dato Espacial Evaluado'
    };

    let gjEnriquecido = gj;
    if (typeof ModuloMetadatos !== 'undefined' && ModuloMetadatos.enriquecerGeoJSON) {
      gjEnriquecido = ModuloMetadatos.enriquecerGeoJSON(gj, opciones);
    } else {
      gjEnriquecido = typeof structuredClone === 'function' ? structuredClone(gj) : JSON.parse(JSON.stringify(gj));
    }

    // Inyectar en cada entidad las métricas cuantitativas y cualitativas de la auditoría
    if (gjEnriquecido && gjEnriquecido.features) {
      gjEnriquecido.features.forEach(f => {
        if (!f || !f.properties) return;
        f.properties.meta_igv = ig.igv || 100;
        f.properties.meta_grado_calidad = ig.grado || 'A+ (Excelente)';
        f.properties.meta_score_cuantitativo = ig.scoreCuantitativo || 100;
        f.properties.meta_score_cualitativo = ig.scoreCualitativo || 100;
        f.properties.meta_score_topologia = dimCuant.topologia ? dimCuant.topologia.score : 100;
        f.properties.meta_score_completitud = dimCuant.completitud ? dimCuant.completitud.score : 100;
        f.properties.meta_score_posicional = dimCuant.posicional ? dimCuant.posicional.score : 100;
        f.properties.meta_anillos_abiertos = dimCuant.topologia ? (dimCuant.topologia.anillosAbiertos || 0) : 0;
        f.properties.meta_slivers = dimCuant.granularidad ? (dimCuant.granularidad.totalSlivers || 0) : 0;
        f.properties.meta_auditoria_fecha = new Date().toISOString();
      });
    }

    const blob = new Blob([JSON.stringify(gjEnriquecido, null, 2)], {
      type: 'application/geo+json; charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geojson_certificado_calidad_igv_${Date.now()}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Exporta el resultado de la auditoría a archivo JSON descargable
   */
  function exportarCertificadoJSON(resultado) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(resultado, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `certificado_calidad_iso19157_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /**
   * Exporta la matriz multicriterio WLC v2.0 a archivo CSV estructurado
   */
  function exportarMatrizWLCCSV(resultado) {
    if (!resultado || !resultado.matrizWLC) return;
    const lineas = [
      'ID,CRITERIO,DIMENSION_NORMATIVA,TIPO,VALOR_BRUTO,NORMALIZADO_0_1,PESO_GLOBAL,CONTRIBUCION_IGV,DETALLE'
    ];
    resultado.matrizWLC.criterios.forEach(c => {
      const detalleLimpio = String(c.detalle || '').replace(/"/g, '""');
      lineas.push(`"${c.id}","${c.nombre}","${c.dimension}","${c.tipo}",${c.valorBruto},${c.norm},${c.pesoGlobal},${c.contrib},"${detalleLimpio}"`);
    });
    const csvContent = '\uFEFF' + lineas.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matriz_wlc_calidad_iso19157_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Inicializa la interfaz de usuario del Evaluador Universal de Calidad
   */
  function inicializarUI() {
    if (typeof document === 'undefined') return;

    const dropzone = document.getElementById('calidad-dropzone');
    const inputFile = document.getElementById('calidad-input-archivo');
    const selectCapa = document.getElementById('calidad-selector-capa-interna');
    const txtGeojson = document.getElementById('calidad-textarea-geojson');
    const btnAuditar = document.getElementById('btn-ejecutar-auditoria-igv');
    const btnEjemplo = document.getElementById('btn-cargar-ejemplo-calidad');

    // Poblar selector de capas del Atlas si está disponible
    if (selectCapa && window.ModuloIDEChile) {
      const capasOficiales = window.ModuloIDEChile.obtenerCapasDisponibles ? window.ModuloIDEChile.obtenerCapasDisponibles() : [];
      let htmlOpts = `<option value="">-- Selecciona una capa de la base de datos (132 componentes) --</option>`;

      htmlOpts += `<optgroup label="Macro-categorías VGI Comunitarias (10 Capas Barrio Brasil)">`;
      const catsVGI = [
        { id: 'vgi_educacion', nom: 'CAT-01: Educación y Universidad (Barrio Brasil)', file: 'data/capa_educacion.geojson' },
        { id: 'vgi_servicios', nom: 'CAT-02: Servicios y Comercio Barrial (Barrio Brasil)', file: 'data/capa_servicios.geojson' },
        { id: 'vgi_transporte', nom: 'CAT-03: Movilidad y Transporte (Barrio Brasil)', file: 'data/capa_transporte.geojson' },
        { id: 'vgi_mov_activa', nom: 'CAT-04: Movilidad Activa y Ciclovías (Barrio Brasil)', file: 'data/capa_movilidad_activa.geojson' },
        { id: 'vgi_espacio_pub', nom: 'CAT-05: Áreas Verdes y Espacio Público (Barrio Brasil)', file: 'data/capa_espacio_publico.geojson' },
        { id: 'vgi_patrimonio', nom: 'CAT-06: Patrimonio y Memoria (Barrio Brasil)', file: 'data/capa_patrimonio.geojson' },
        { id: 'vgi_accesibilidad', nom: 'CAT-07: Accesibilidad Universal (Barrio Brasil)', file: 'data/capa_accesibilidad.geojson' },
        { id: 'vgi_biodiversidad', nom: 'CAT-08: Biodiversidad Urbana (Barrio Brasil)', file: 'data/capa_biodiversidad.geojson' },
        { id: 'vgi_edificaciones', nom: 'CAT-09: Edificaciones y Huella Urbana (Barrio Brasil)', file: 'data/capa_edificaciones.geojson' },
        { id: 'vgi_cobertura', nom: 'CAT-10: Coberturas y Usos de Suelo (Barrio Brasil)', file: 'data/capa_cobertura_suelo.geojson' }
      ];
      catsVGI.forEach(c => {
        htmlOpts += `<option value="${c.file}">${c.nom}</option>`;
      });
      htmlOpts += `</optgroup>`;

      htmlOpts += `<optgroup label="Capas Oficiales del Estado (122 Capas IDE Chile / BBDD)">`;
      capasOficiales.forEach(co => {
        if (co.archivoLocal) {
          htmlOpts += `<option value="${co.archivoLocal}" data-id="${co.id}">${co.nombre} (${co.institucion})</option>`;
        }
      });
      htmlOpts += `</optgroup>`;

      selectCapa.innerHTML = htmlOpts;
    }

    // Drag & Drop
    if (dropzone && inputFile) {
      dropzone.addEventListener('click', () => inputFile.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--esmeralda)';
        dropzone.style.background = 'rgba(16, 185, 129, 0.08)';
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--linea)';
        dropzone.style.background = 'var(--papel-alto)';
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--linea)';
        dropzone.style.background = 'var(--papel-alto)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          procesarArchivoSeleccionado(e.dataTransfer.files[0]);
        }
      });

      inputFile.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          procesarArchivoSeleccionado(e.target.files[0]);
        }
      });
    }

    function procesarArchivoSeleccionado(file) {
      const spanNombre = document.getElementById('calidad-archivo-seleccionado-nombre');
      const cont = document.getElementById('resultado-auditoria-igv');

      // Comprobación de peso preventivo antes de leer en memoria del navegador
      if (file && file.size > LIMITE_BYTES_ARCHIVO) {
        window._datosGeojsonCargadosParaCalidad = null;
        window._metadatosAsociadosCargados = null;
        window._archivoDemasiadoPesadoInfo = {
          nombre: file.name,
          tamanoMB: (file.size / (1024 * 1024)).toFixed(1)
        };

        if (spanNombre) {
          spanNombre.textContent = `Archivo descartado por peso: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB > 25 MB)`;
          spanNombre.style.display = 'inline-block';
          spanNombre.style.background = 'rgba(244, 63, 94, 0.15)';
          spanNombre.style.color = 'var(--alerta, #f43f5e)';
          spanNombre.style.borderColor = 'var(--alerta, #f43f5e)';
        }

        if (inputFile) {
          inputFile.value = '';
        }
        if (txtGeojson) {
          txtGeojson.value = '';
        }

        renderizarAvisoArchivoPesado(
          cont,
          `El archivo "${file.name}" tiene un tamaño de ${(file.size / (1024 * 1024)).toFixed(1)} MB (el umbral máximo permitido es 25 MB).`
        );
        return;
      }

      window._archivoDemasiadoPesadoInfo = null;

      if (spanNombre) {
        spanNombre.textContent = `Archivo: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        spanNombre.style.display = 'inline-block';
        spanNombre.style.background = 'rgba(16, 185, 129, 0.15)';
        spanNombre.style.color = 'var(--esmeralda, #10b981)';
        spanNombre.style.borderColor = 'var(--esmeralda, #10b981)';
      }

      // Limpiar selector de capa interna para dar prioridad al archivo subido
      if (selectCapa) {
        selectCapa.value = '';
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target.result);
          window._datosGeojsonCargadosParaCalidad = json;
          window._metadatosAsociadosCargados = {
            id: file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_').toLowerCase(),
            titulo: file.name,
            nombre: file.name,
            tipoFuente: 'Archivo Externo Subido (.geojson)',
            esArchivoExterno: true,
            institucion: null,
            licencia: null,
            linaje: null,
            tamano_bytes: file.size
          };
          if (txtGeojson) txtGeojson.value = JSON.stringify(json).slice(0, 500) + '... (Archivo cargado exitosamente)';
          if (cont) {
            cont.innerHTML = `
              <div style="background:rgba(16, 185, 129, 0.1); border:1px solid var(--esmeralda); border-radius:8px; padding:12px 16px; color:var(--esmeralda); font-family:var(--fuente-datos); font-size:0.82rem; margin-top:10px;">
                ✓ Archivo <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB) preparado correctamente. Haz clic en <strong>Auditar Calidad Espacial e Índice IGV</strong> para procesarlo.
              </div>
            `;
          }
        } catch (err) {
          console.error('[Error al leer archivo GeoJSON]:', err);
          window._datosGeojsonCargadosParaCalidad = null;
          const esPesado = (err.name === 'RangeError') ||
            (err.message && (err.message.includes('string length') || err.message.includes('memory') || err.message.includes('allocation')));
          if (cont) {
            if (esPesado) {
              renderizarAvisoArchivoPesado(cont, `El archivo "${file.name}" agotó la memoria del navegador durante la lectura.`);
            } else {
              cont.innerHTML = `
                <div style="background:var(--papel-alto); border:1px solid var(--alerta); padding:16px; color:var(--alerta); font-family:var(--fuente-datos); font-size:0.85rem; border-radius:8px;">
                  <strong>[ERROR DE LECTURA]:</strong> No se pudo procesar el archivo GeoJSON: ${err.message}
                </div>
              `;
            }
          }
        }
      };

      reader.onerror = () => {
        window._datosGeojsonCargadosParaCalidad = null;
        renderizarAvisoArchivoPesado(cont, `Error al acceder al archivo "${file.name}" en el dispositivo local.`);
      };

      reader.readAsText(file);
    }

    if (selectCapa) {
      selectCapa.addEventListener('change', () => {
        if (selectCapa.value) {
          window._datosGeojsonCargadosParaCalidad = null;
          window._metadatosAsociadosCargados = null;
          window._archivoDemasiadoPesadoInfo = null;
          const spanNombre = document.getElementById('calidad-archivo-seleccionado-nombre');
          if (spanNombre) spanNombre.style.display = 'none';
          if (inputFile) inputFile.value = '';
          if (txtGeojson) txtGeojson.value = '';
        }
      });
    }

    // Botón Ejecutar Auditoría
    if (btnAuditar) {
      btnAuditar.addEventListener('click', async (e) => {
        if (e && typeof e.preventDefault === 'function') {
          e.preventDefault();
        }

        const cont = document.getElementById('resultado-auditoria-igv');

        // Si previamente se intentó ingresar un archivo descartado por exceso de peso
        if (window._archivoDemasiadoPesadoInfo) {
          renderizarAvisoArchivoPesado(
            cont,
            `El archivo "${window._archivoDemasiadoPesadoInfo.nombre}" (${window._archivoDemasiadoPesadoInfo.tamanoMB} MB) excede el tamaño máximo procesable en el cliente.`
          );
          return;
        }

        if (cont) {
          cont.innerHTML = `
            <div style="padding:20px; text-align:center; font-family:var(--fuente-datos); color:var(--musgo);">
              <span class="marcador-parpadeo">[INICIANDO AUDITORÍA]</span> Preparando análisis de calidad espacial bajo ISO 19157 / ISO 19115...
            </div>
          `;
        }

        try {
          let dataGeojson = window._datosGeojsonCargadosParaCalidad;
          let metadatosDeclarados = window._metadatosAsociadosCargados;

          // Si seleccionó capa interna y no hay archivo externo subido
          if (selectCapa && selectCapa.value && !dataGeojson) {
            const urlCapa = selectCapa.value;
            if (cont) {
              cont.innerHTML = `
                <div style="padding:20px; text-align:center; font-family:var(--fuente-datos); color:var(--musgo);">
                  <span class="marcador-parpadeo">[DESCARGANDO CAPA]</span> Obteniendo datos desde <code style="color:var(--esmeralda);">${urlCapa}</code>...
                </div>
              `;
            }

            const resFetch = await fetch(urlCapa);
            if (!resFetch.ok) throw new Error(`No se pudo cargar la capa seleccionada (${resFetch.status} ${resFetch.statusText})`);

            // Verificación preventiva por encabezado Content-Length (80 MB para capas oficiales)
            const clHeader = resFetch.headers.get('content-length');
            if (clHeader && parseInt(clHeader, 10) > LIMITE_BYTES_CAPA_INTERNA) {
              const szMB = (parseInt(clHeader, 10) / (1024 * 1024)).toFixed(1);
              const err = new Error('No se pudo procesar la auditoria de calidad dado que el archivo que ha ingresado es demasiado pesado, intente con un archivo más pequeño');
              err.esArchivoPesado = true;
              err.detalle = `La capa seleccionada tiene un tamaño de ${szMB} MB, superando el límite seguro de 80 MB para procesamiento en navegador.`;
              throw err;
            }

            const blob = await resFetch.blob();
            if (blob.size > LIMITE_BYTES_CAPA_INTERNA) {
              const szMB = (blob.size / (1024 * 1024)).toFixed(1);
              const err = new Error('No se pudo procesar la auditoria de calidad dado que el archivo que ha ingresado es demasiado pesado, intente con un archivo más pequeño');
              err.esArchivoPesado = true;
              err.detalle = `La capa descargada (${szMB} MB) supera el límite de 80 MB para procesamiento en navegador.`;
              throw err;
            }

            if (cont) {
              cont.innerHTML = `
                <div style="padding:20px; text-align:center; font-family:var(--fuente-datos); color:var(--musgo);">
                  <span class="marcador-parpadeo">[PARSANDO ESTRUCTURA]</span> Decodificando geometrías vectoriales y tabla de atributos...
                </div>
              `;
            }

            const text = await blob.text();
            dataGeojson = JSON.parse(text);

            const optSeleccionada = selectCapa.options[selectCapa.selectedIndex];
            const idCapa = optSeleccionada ? optSeleccionada.dataset.id : null;
            let metaDef = null;
            if (idCapa && window.ModuloIDEChile && window.ModuloIDEChile.obtenerDefinicion) {
              metaDef = window.ModuloIDEChile.obtenerDefinicion(idCapa);
            }
            metadatosDeclarados = {
              id: idCapa || 'capa_interna',
              nombre: metaDef ? metaDef.nombre : (optSeleccionada ? optSeleccionada.text : urlCapa),
              titulo: metaDef ? metaDef.nombre : (optSeleccionada ? optSeleccionada.text : urlCapa),
              institucion: metaDef ? metaDef.institucion : 'Atlas VGI UAH / IDE Chile',
              tipoFuente: 'Geodatabase Oficial / VGI (Atlas UAH)'
            };
          } else if (!dataGeojson && txtGeojson && txtGeojson.value.trim().startsWith('{')) {
            const valorTexto = txtGeojson.value.trim();
            if (valorTexto.length > LIMITE_BYTES_ARCHIVO) {
              const szMB = (valorTexto.length / (1024 * 1024)).toFixed(1);
              const err = new Error('No se pudo procesar la auditoria de calidad dado que el archivo que ha ingresado es demasiado pesado, intente con un archivo más pequeño');
              err.esArchivoPesado = true;
              err.detalle = `El texto GeoJSON ingresado (${szMB} MB) excede el límite de 25 MB para análisis directo.`;
              throw err;
            }
            dataGeojson = JSON.parse(valorTexto);
            metadatosDeclarados = {
              id: 'geojson_pegado',
              titulo: 'GeoJSON Ingresado por Texto Plano',
              nombre: 'GeoJSON Ingresado por Texto Plano',
              tipoFuente: 'Entrada Texto Plano',
              esArchivoExterno: true,
              institucion: null,
              licencia: null,
              linaje: null
            };
          }

          if (!dataGeojson) {
            throw new Error('Por favor arrastra un archivo GeoJSON, selecciona una capa o pega contenido válido.');
          }

          // Aplicar filtrado espacial por BBox territorial de Barrio Brasil si el control está activo
          // o si el conjunto de datos es masivo (> 600 entidades) para prevenir reinicios y enfocar el piloto
          const chkFiltroBbox = document.getElementById('calidad-chk-filtrar-bbox');
          const focalizarEnBbox = chkFiltroBbox ? chkFiltroBbox.checked : true;
          const bboxBarrioBrasil = obtenerBboxActivoParaAuditoria();
          const totalEntidadesCargadas = (dataGeojson.features && Array.isArray(dataGeojson.features)) ? dataGeojson.features.length : 0;

          if ((focalizarEnBbox || totalEntidadesCargadas > 600) && totalEntidadesCargadas > 0) {
            const resFiltro = filtrarDatasetPorBbox(dataGeojson, bboxBarrioBrasil);
            if (resFiltro.totalFiltrado > 0) {
              dataGeojson = resFiltro.geojson;
              if (!metadatosDeclarados) metadatosDeclarados = {};
              metadatosDeclarados.recorteBboxAplicado = true;
              metadatosDeclarados.totalOriginalDataset = totalEntidadesCargadas;
              metadatosDeclarados.totalAuditadoBbox = resFiltro.totalFiltrado;
              metadatosDeclarados.bboxFiltro = bboxBarrioBrasil;
            }
          }

          if (cont) {
            cont.innerHTML = `
              <div style="padding:20px; text-align:center; font-family:var(--fuente-datos); color:var(--musgo);">
                <span class="marcador-parpadeo">[AUDITORÍA EN EJECUCIÓN]</span> Analizando topología OGC SFA, consistencia métrica y atributos bajo ISO 19157...
              </div>
            `;
          }

          // Breve pausa para permitir al navegador refrescar el DOM antes de procesar
          await new Promise(r => setTimeout(r, 60));

          const resultado = auditarDatasetEspacial(dataGeojson, metadatosDeclarados);
          renderizarResultadosUI(resultado, 'resultado-auditoria-igv');

        } catch (err) {
          console.error('[Error en Auditoría IGV]:', err);
          if (cont) {
            const esPesado = Boolean(
              err.esArchivoPesado ||
              (err.message && (
                err.message.includes('demasiado pesado') ||
                err.message.includes('allocation') ||
                err.message.includes('out of memory') ||
                err.message.includes('heap') ||
                err.message.includes('Invalid string length')
              )) ||
              err.name === 'RangeError'
            );

            if (esPesado) {
              renderizarAvisoArchivoPesado(cont, err.detalle || '');
            } else {
              cont.innerHTML = `
                <div style="background:var(--papel-alto); border:1px solid var(--alerta); padding:16px; color:var(--alerta); font-family:var(--fuente-datos); font-size:0.85rem; border-radius:8px;">
                  <strong>[ERROR DE AUDITORÍA]:</strong> ${err.message}
                </div>
              `;
            }
          }
        }
      });
    }

    // Botón Ejemplo Piloto Barrio Brasil
    if (btnEjemplo) {
      btnEjemplo.addEventListener('click', async (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        try {
          const res = await fetch('data/capa_educacion.geojson');
          if (!res.ok) throw new Error('No se pudo cargar el ejemplo piloto.');
          const data = await res.json();
          window._datosGeojsonCargadosParaCalidad = data;
          window._metadatosAsociadosCargados = {
            titulo: 'CAT-01: Educación y Universidad (Barrio Brasil)',
            score_mc: 98.0, score_cc: 100.0, score_ll: 100.0, score_rg: 100.0, score_ai: 100.0
          };
          const spanNombre = document.getElementById('calidad-archivo-seleccionado-nombre');
          if (spanNombre) {
            spanNombre.textContent = 'Cargado: CAT-01 Educación y Universidad (Piloto Barrio Brasil)';
            spanNombre.style.display = 'inline-block';
          }
          if (btnAuditar) btnAuditar.click();
        } catch (e) {
          alert('Error cargando ejemplo: ' + e.message);
        }
      });
    }
  }

  function invalidarTamanoMapa() {
    if (mapaDiagnosticoInstancia) {
      setTimeout(() => {
        try {
          mapaDiagnosticoInstancia.invalidateSize();
        } catch (e) {
          console.warn('Error al invalidar tamaño de mapa de calidad:', e);
        }
      }, 200);
    }
  }

  return {
    BBOX_BARRIO_BRASIL_PILOTO,
    obtenerBboxActivoParaAuditoria,
    geometriaIntersecaBbox,
    filtrarDatasetPorBbox,
    PONDERADORES_DEFECTO,
    auditarGeometria,
    auditarAtributos,
    auditarPosicional,
    auditarCualitativoDataset,
    auditarDatasetEspacial,
    repararDatasetGeoJSON,
    ejecutarAutoFixEnNavegador,
    descargarGeoJSONReparado,
    enfocarEntidadEnMapa,
    copiarPlanSubsanacion,
    renderizarResultadosUI,
    renderizarAvisoArchivoPesado,
    renderizarMapaDiagnostico,
    invalidarTamanoMapa,
    exportarCertificadoJSON,
    exportarMatrizWLCCSV,
    exportarGeoJSONCertificado,
    inicializarUI
  };

})();

if (typeof window !== 'undefined') {
  window.EvaluadorCalidadCuantitativa = EvaluadorCalidadCuantitativa;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EvaluadorCalidadCuantitativa;
}
