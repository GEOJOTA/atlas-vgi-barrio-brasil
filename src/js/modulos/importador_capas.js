/*
  importador_capas.js
  -------------------
  Módulo de importación y procesamiento de capas espaciales locales en el navegador.
  Permite cargar capas de usuario sin descargarlas en el servidor ni guardarlas en el repo.

  Formatos soportados con concordancia estándar:
  1. GeoJSON (.geojson, .json): Formato estándar RFC 7946 en WGS84 (EPSG:4326).
  2. KML (.kml): Keyhole Markup Language (OGC KML 2.2).
  3. KMZ (.kmz): Paquete comprimido ZIP que contiene KML y recursos (descomprimido vía JSZip).
  4. GPX (.gpx): GPS Exchange Format para rutas, tracks y waypoints.
  5. CSV / TSV (.csv, .tsv): Tablas delimitadas con detección automática de columnas lat/lon o WKT.
*/

const ModuloImportadorCapas = (() => {
  let capasImportadas = {};
  const PALETA_COLORES_IMPORTACION = [
    '#2563EB', '#D97706', '#059669', '#DC2626', '#7C3AED', 
    '#DB2777', '#0891B2', '#4B5563', '#4F46E5', '#16A34A'
  ];
  let indiceColor = 0;

  function obtenerSiguienteColor() {
    const color = PALETA_COLORES_IMPORTACION[indiceColor % PALETA_COLORES_IMPORTACION.length];
    indiceColor++;
    return color;
  }

  /**
   * Procesa un archivo subido por el usuario (File object)
   */
  async function procesarArchivo(file) {
    if (!file) throw new Error('No se proporcionó ningún archivo.');

    const nombreArchivo = file.name;
    const extension = nombreArchivo.split('.').pop().toLowerCase();
    const idCapa = `usr_${Date.now()}_${extension}`;
    const color = obtenerSiguienteColor();

    let geojson = null;
    let formatoDetectado = extension.toUpperCase();

    if (extension === 'geojson' || extension === 'json') {
      const texto = await file.text();
      geojson = parsearGeoJSON(texto);
    } else if (extension === 'kml') {
      const texto = await file.text();
      geojson = parsearKML(texto);
    } else if (extension === 'kmz') {
      geojson = await parsearKMZ(file);
      formatoDetectado = 'KMZ (Google Earth)';
    } else if (extension === 'gpx') {
      const texto = await file.text();
      geojson = parsearGPX(texto);
    } else if (extension === 'csv' || extension === 'tsv') {
      const texto = await file.text();
      geojson = parsearCSV(texto, extension === 'tsv' ? '\t' : ',');
      formatoDetectado = 'CSV / Delimitado';
    } else {
      throw new Error(`Formato ".${extension}" no soportado. Formatos válidos: .geojson, .json, .kml, .kmz, .gpx, .csv, .tsv.`);
    }

    if (!geojson || !geojson.features || geojson.features.length === 0) {
      throw new Error(`El archivo "${nombreArchivo}" no contiene entidades geográficas válidas.`);
    }

    // Normalizar atributos de la colección importada
    normalizarFeatures(geojson, idCapa, nombreArchivo, color);

    const registroCapa = {
      id: idCapa,
      nombre: nombreArchivo.replace(/\.[^/.]+$/, ''),
      archivoOriginal: nombreArchivo,
      formato: formatoDetectado,
      color: color,
      icono: extension === 'kmz' || extension === 'kml' ? '🌐' : (extension === 'gpx' ? '📍' : '📁'),
      geojson: geojson,
      cantidad: geojson.features.length,
      activa: true,
      fechaCarga: new Date().toISOString()
    };

    capasImportadas[idCapa] = registroCapa;
    return registroCapa;
  }

  /**
   * Parser GeoJSON estándar
   */
  function parsearGeoJSON(texto) {
    try {
      const obj = JSON.parse(texto);
      if (obj.type === 'FeatureCollection') {
        return obj;
      } else if (obj.type === 'Feature') {
        return { type: 'FeatureCollection', features: [obj] };
      } else if (obj.type && obj.coordinates) {
        return {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: obj, properties: {} }]
        };
      }
      throw new Error('El archivo JSON no tiene estructura GeoJSON válida.');
    } catch (e) {
      throw new Error(`Error al procesar GeoJSON: ${e.message}`);
    }
  }

  /**
   * Parser KML a GeoJSON usando toGeoJSON o fallback XML
   */
  function parsearKML(textoKml) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(textoKml, 'text/xml');
    
    // Verificar error en parseo XML
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      throw new Error('El archivo KML contiene sintaxis XML no válida.');
    }

    if (window.toGeoJSON && typeof window.toGeoJSON.kml === 'function') {
      return window.toGeoJSON.kml(xmlDoc);
    }

    // Fallback nativo ligero para Placemarks KML si toGeoJSON no está disponible
    return kmlFallbackAGeoJSON(xmlDoc);
  }

  /**
   * Parser KMZ: Descomprime archivo ZIP con JSZip, extrae el archivo KML principal y lo parsea
   */
  async function parsearKMZ(file) {
    if (typeof JSZip === 'undefined') {
      throw new Error('La biblioteca JSZip no está disponible para descomprimir archivos .kmz.');
    }

    const zip = await JSZip.loadAsync(file);
    let kmlContent = null;
    let kmlFileName = null;

    // Buscar doc.kml o cualquier archivo .kml dentro del archivo KMZ
    const kmlFiles = Object.keys(zip.files).filter(nombre => nombre.toLowerCase().endsWith('.kml'));

    if (kmlFiles.length === 0) {
      throw new Error('El archivo KMZ no contiene ningún archivo KML legible en su interior.');
    }

    // Priorizar doc.kml si existe, o tomar el primero
    kmlFileName = kmlFiles.find(n => n.toLowerCase() === 'doc.kml') || kmlFiles[0];
    kmlContent = await zip.files[kmlFileName].async('string');

    return parsearKML(kmlContent);
  }

  /**
   * Parser GPX a GeoJSON
   */
  function parsearGPX(textoGpx) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(textoGpx, 'text/xml');

    if (window.toGeoJSON && typeof window.toGeoJSON.gpx === 'function') {
      return window.toGeoJSON.gpx(xmlDoc);
    }

    // Fallback nativo para waypoints GPX
    const features = [];
    const wpts = xmlDoc.getElementsByTagName('wpt');
    for (let i = 0; i < wpts.length; i++) {
      const wpt = wpts[i];
      const lat = parseFloat(wpt.getAttribute('lat'));
      const lon = parseFloat(wpt.getAttribute('lon'));
      const name = wpt.getElementsByTagName('name')[0]?.textContent || `Waypoint ${i + 1}`;
      if (!isNaN(lat) && !isNaN(lon)) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          properties: { name }
        });
      }
    }
    return { type: 'FeatureCollection', features };
  }

  /**
   * Parser CSV / TSV a GeoJSON Point FeatureCollection
   */
  function parsearCSV(texto, delimitador = ',') {
    const lineas = texto.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lineas.length < 2) {
      throw new Error('El archivo CSV debe tener al menos una cabecera y una fila de datos.');
    }

    // Parser simple de línea CSV considerando comillas
    function dividirLinea(linea) {
      const resultado = [];
      let actual = '';
      let enComillas = false;
      for (let i = 0; i < linea.length; i++) {
        const c = linea[i];
        if (c === '"') {
          enComillas = !enComillas;
        } else if (c === delimitador && !enComillas) {
          resultado.push(actual.trim().replace(/^"|"$/g, ''));
          actual = '';
        } else {
          actual += c;
        }
      }
      resultado.push(actual.trim().replace(/^"|"$/g, ''));
      return resultado;
    }

    const cabeceras = dividirLinea(lineas[0]).map(h => h.toLowerCase().replace(/[\s_]/g, ''));
    
    // Identificar columnas de latitud y longitud
    const variantesLat = ['lat', 'latitude', 'latitud', 'y', 'latwgs84', 'coordy', 'norte'];
    const variantesLon = ['lon', 'lng', 'long', 'longitude', 'longitud', 'x', 'lonwgs84', 'coordx', 'este'];

    let idxLat = cabeceras.findIndex(h => variantesLat.includes(h));
    let idxLon = cabeceras.findIndex(h => variantesLon.includes(h));

    if (idxLat === -1 || idxLon === -1) {
      throw new Error(`No se pudieron detectar columnas de latitud y longitud en el CSV. Cabeceras encontradas: ${cabeceras.join(', ')}.`);
    }

    const features = [];
    const cabecerasOriginales = dividirLinea(lineas[0]);

    for (let i = 1; i < lineas.length; i++) {
      const fila = dividirLinea(lineas[i]);
      if (fila.length <= Math.max(idxLat, idxLon)) continue;

      // Reemplazar comas por puntos decimales si aplica
      const latStr = fila[idxLat].replace(',', '.');
      const lonStr = fila[idxLon].replace(',', '.');
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);

      if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        continue; // Ignorar fila inválida
      }

      const props = {};
      cabecerasOriginales.forEach((c, idx) => {
        if (idx !== idxLat && idx !== idxLon && fila[idx] !== undefined) {
          props[c] = fila[idx];
        }
      });

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        properties: props
      });
    }

    return {
      type: 'FeatureCollection',
      features: features
    };
  }

  /**
   * Fallback nativo KML a GeoJSON si toGeoJSON no está cargado
   */
  function kmlFallbackAGeoJSON(xmlDoc) {
    const features = [];
    const placemarks = xmlDoc.getElementsByTagName('Placemark');

    for (let i = 0; i < placemarks.length; i++) {
      const pm = placemarks[i];
      const name = pm.getElementsByTagName('name')[0]?.textContent || `Placemark ${i + 1}`;
      const desc = pm.getElementsByTagName('description')[0]?.textContent || '';
      
      const point = pm.getElementsByTagName('Point')[0];
      const line = pm.getElementsByTagName('LineString')[0];
      const poly = pm.getElementsByTagName('Polygon')[0];

      if (point) {
        const coordsStr = point.getElementsByTagName('coordinates')[0]?.textContent || '';
        const coords = coordsStr.trim().split(',').map(parseFloat);
        if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [coords[0], coords[1]] },
            properties: { name, description: desc }
          });
        }
      } else if (line) {
        const coordsStr = line.getElementsByTagName('coordinates')[0]?.textContent || '';
        const pts = coordsStr.trim().split(/\s+/).map(c => c.split(',').map(parseFloat)).filter(c => c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1]));
        if (pts.length >= 2) {
          features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: pts },
            properties: { name, description: desc }
          });
        }
      } else if (poly) {
        const coordsStr = poly.getElementsByTagName('coordinates')[0]?.textContent || '';
        const pts = coordsStr.trim().split(/\s+/).map(c => c.split(',').map(parseFloat)).filter(c => c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1]));
        if (pts.length >= 3) {
          features.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [pts] },
            properties: { name, description: desc }
          });
        }
      }
    }

    return { type: 'FeatureCollection', features };
  }

  /**
   * Normaliza los atributos de cada feature para compatibilidad total con popups y visor cartográfico
   */
  function normalizarFeatures(geojson, idCapa, nombreArchivo, color) {
    geojson.features.forEach((f, idx) => {
      if (!f.properties) f.properties = {};
      const props = f.properties;
      props._capaId = idCapa;
      props._idUsuario = `${idCapa}_${idx}`;
      props._fuente = `Capa Importada: ${nombreArchivo}`;
      props._color = color;
      props._nombre = props.name || props.nombre || props.Name || props.NOMBRE || props.title || `Entidad #${idx + 1}`;
      props._subtipo = props.tipo || props.type || props.category || props.categoria || f.geometry.type;
    });
  }

  /**
   * Obtiene los límites envolventes (Bbox [minX, minY, maxX, maxY]) de la capa GeoJSON
   */
  function calcularBbox(geojson) {
    if (!geojson || !geojson.features || geojson.features.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    function procesarCoord(c) {
      if (Array.isArray(c) && typeof c[0] === 'number') {
        minX = Math.min(minX, c[0]);
        minY = Math.min(minY, c[1]);
        maxX = Math.max(maxX, c[0]);
        maxY = Math.max(maxY, c[1]);
      } else if (Array.isArray(c)) {
        c.forEach(procesarCoord);
      }
    }

    geojson.features.forEach(f => {
      if (f.geometry && f.geometry.coordinates) {
        procesarCoord(f.geometry.coordinates);
      }
    });

    if (minX === Infinity) return null;
    return [minX, minY, maxX, maxY];
  }

  function alternarCapa(idCapa) {
    if (capasImportadas[idCapa]) {
      capasImportadas[idCapa].activa = !capasImportadas[idCapa].activa;
      return capasImportadas[idCapa].activa;
    }
    return false;
  }

  function removerCapa(idCapa) {
    if (capasImportadas[idCapa]) {
      delete capasImportadas[idCapa];
      return true;
    }
    return false;
  }

  function obtenerCapasImportadas() {
    return { ...capasImportadas };
  }

  function obtenerCapaPorId(idCapa) {
    return capasImportadas[idCapa] || null;
  }

  return {
    procesarArchivo,
    calcularBbox,
    alternarCapa,
    removerCapa,
    obtenerCapasImportadas,
    obtenerCapaPorId
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloImportadorCapas = ModuloImportadorCapas;
}
