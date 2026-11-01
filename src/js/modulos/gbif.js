/*
  gbif.js
  -------
  Consultas a la API pública de GBIF (Global Biodiversity Information Facility).
  Permite incorporar ciencia ciudadana (iNaturalist, museos) al Atlas VGI.
  Incluye autocompletado taxonómico (Species API) y auditoría de banderas de calidad (Darwin Core Issues).
  Convierte los registros directamente a GeoJSON FeatureCollection para visualización cartográfica.
*/

const ModuloGBIF = (() => {

  const cacheTaxon = new Map();
  const cacheOcurrencias = new Map();

  /**
   * Sugiere taxones en tiempo real usando GBIF Species Suggest API
   */
  async function sugerirTaxon(texto) {
    if (!texto || texto.trim().length < 2) return [];
    const tLimpio = texto.trim().toLowerCase();
    if (cacheTaxon.has(tLimpio)) return cacheTaxon.get(tLimpio);

    const base = (typeof window !== 'undefined' && window.NODO_CONFIG?.endpoints?.gbif) || 'https://api.gbif.org/v1';
    const url = `${base}/species/suggest?q=${encodeURIComponent(texto.trim())}&limit=6`;

    try {
      const ctl = new AbortController();
      const tId = setTimeout(() => ctl.abort(), 8000);
      const res = await fetch(url, { signal: ctl.signal });
      clearTimeout(tId);
      if (!res.ok) return [];
      const datos = await res.json();
      const resultado = datos.map(item => ({
        canonicalName: item.canonicalName || item.scientificName,
        scientificName: item.scientificName,
        kingdom: item.kingdom,
        rank: item.rank
      }));
      cacheTaxon.set(tLimpio, resultado);
      return resultado;
    } catch (e) {
      console.warn('[GBIF] Error en autocompletado taxonómico:', e.message);
      return [];
    }
  }

  async function buscarOcurrencias({ nombre, bbox, limite = 300, basisOfRecord = 'ALL' }) {
    const claveCache = `${nombre || ''}_${JSON.stringify(bbox)}_${limite}_${basisOfRecord}`;
    if (cacheOcurrencias.has(claveCache)) {
      console.log('[GBIF] Retornando ocurrencias desde caché en memoria');
      return cacheOcurrencias.get(claveCache);
    }

    const base = (typeof window !== 'undefined' && window.NODO_CONFIG?.endpoints?.gbif) || 'https://api.gbif.org/v1';
    const parametros = new URLSearchParams({
      limit: String(limite),
      hasCoordinate: 'true'
    });

    if (nombre && nombre.trim()) {
      parametros.set('q', nombre.trim());
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

    const ctl = new AbortController();
    const tId = setTimeout(() => ctl.abort(), 15000);
    let respuesta;
    try {
      respuesta = await fetch(urlFinal, { signal: ctl.signal });
      clearTimeout(tId);
    } catch (err) {
      clearTimeout(tId);
      throw new Error(`Timeout o error de conexión con GBIF: ${err.message}`);
    }

    if (!respuesta.ok) {
      throw new Error(`GBIF respondió con error ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    const resultados = datos.results || [];

    const registros = resultados.map(r => ({
      id: r.key || r.gbifID,
      especie: r.scientificName || r.species || 'Especie no determinada',
      nombreComun: r.vernacularName || null,
      reino: r.kingdom || 'Indeterminado',
      familia: r.family || null,
      fecha: r.eventDate ? r.eventDate.slice(0, 10) : 'Sin fecha registrada',
      publicador: r.institutionCode || r.publishingOrgKey || 'Ciencia Ciudadana / GBIF',
      licencia: r.license || 'CC-BY 4.0',
      lat: r.decimalLatitude,
      lon: r.decimalLongitude,
      issues: r.issues || [] // Banderas de calidad Darwin Core
    }));

    return {
      total: datos.count || 0,
      registros: registros,
      geojson: ocurrenciasAGeoJSON(registros)
    };
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
          categoria: 'biodiversidad',
          subtipo: 'Registro Biológico (GBIF/iNat)',
          nombre: r.nombreComun ? `${r.nombreComun} (${r.especie})` : r.especie,
          especie: r.especie,
          reino: r.reino,
          familia: r.familia,
          operador: r.publicador,
          fecha: r.fecha,
          fuente: 'GBIF / Ciencia Ciudadana',
          licencia: r.licencia,
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
    sugerirTaxon,
    buscarOcurrencias,
    ocurrenciasAGeoJSON
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloGBIF = ModuloGBIF;
  window.ModuloGbif = ModuloGBIF;
}
