/*
  netlify/functions/calidad.js
  ----------------------------
  Función serverless de Netlify para consultar indicadores avanzados en ohsome API (v1 y v2).
  Aplica sensibilidad geométrica:
  - Líneas: consulta /elements/length (km)
  - Polígonos: consulta /elements/area (m²/km²)
  - Puntos/Comunes: /elements/count, /users/count, /contributions/count.
*/

const USER_AGENT = 'AtlasVGI-UAH/2.0 (nodo.geoabierto@uahurtado.cl)';

// Parámetros geodésicos del elipsoide WGS 84 para UTM 19S (EPSG:32719)
const A_WGS84 = 6378137.0;
const F_WGS84 = 1 / 298.257223563;
const E2 = 2 * F_WGS84 - F_WGS84 * F_WGS84;
const E_PRIME2 = E2 / (1 - E2);
const K0 = 0.9996;
const FALSO_ESTE = 500000.0;
const FALSO_NORTE = 10000000.0;
const MERIDIANO_CENTRAL_19S = -69.0;

function wgs84aUTM19S(lon, lat) {
  const phi = lat * (Math.PI / 180);
  const lambda = lon * (Math.PI / 180);
  const lambda0 = MERIDIANO_CENTRAL_19S * (Math.PI / 180);
  const deltaLambda = lambda - lambda0;

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const N = A_WGS84 / Math.sqrt(1 - E2 * sinPhi * sinPhi);
  const T = tanPhi * tanPhi;
  const C = E_PRIME2 * cosPhi * cosPhi;
  const A = cosPhi * deltaLambda;

  const M = A_WGS84 * (
    (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 * E2 * E2 / 256) * phi
    - (3 * E2 / 8 + 3 * E2 * E2 / 32 + 45 * E2 * E2 * E2 / 1024) * Math.sin(2 * phi)
    + (15 * E2 * E2 / 256 + 45 * E2 * E2 * E2 / 1024) * Math.sin(4 * phi)
    - (35 * E2 * E2 * E2 / 3072) * Math.sin(6 * phi)
  );

  const este = FALSO_ESTE + K0 * N * (
    A
    + (1 - T + C) * Math.pow(A, 3) / 6
    + (5 - 18 * T + T * T + 72 * C - 58 * E_PRIME2) * Math.pow(A, 5) / 120
  );

  const norte = FALSO_NORTE + K0 * (
    M + N * tanPhi * (
      A * A / 2
      + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24
      + (61 - 58 * T + T * T + 600 * C - 330 * E_PRIME2) * Math.pow(A, 6) / 720
    )
  );

  return [este, norte];
}

function calcularSuperficieBbox(bbox) {
  const [oeste, sur, este, norte] = bbox;
  const p1 = wgs84aUTM19S(oeste, sur);
  const p2 = wgs84aUTM19S(este, sur);
  const p3 = wgs84aUTM19S(este, norte);
  const p4 = wgs84aUTM19S(oeste, norte);

  const vertices = [p1, p2, p3, p4, p1];
  let suma = 0;
  for (let i = 0; i < 4; i++) {
    suma += (vertices[i][0] * vertices[i + 1][1]) - (vertices[i + 1][0] * vertices[i][1]);
  }
  const areaM2 = Math.abs(suma) / 2;
  return {
    areaM2: Math.round(areaM2),
    areaHa: Number((areaM2 / 10000).toFixed(2)),
    areaKm2: Number((areaM2 / 1000000).toFixed(4)),
    srs: 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)'
  };
}

function extraerItems(obj) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (Array.isArray(obj.result)) return obj.result;
  if (Array.isArray(obj.data)) return obj.data;
  return [];
}

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apiKey',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método no permitido. Utiliza POST.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'JSON inválido.' })
    };
  }

  const { bbox, filtro = 'building=* and type:way', intervalo = 'P1Y', version = 'v1', apiKey = '' } = body;
  if (!bbox || bbox.length !== 4) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Se requiere "bbox" [oeste, sur, este, norte].' })
    };
  }

  const baseOhsomeV1 = 'https://api.ohsome.org/v1';
  const baseOhsomeV2 = 'https://api.heigit.org/ohsome-api/v2-rc';

  try {
    // 1. Obtener fecha máxima disponible con límite de tiempo seguro
    let fechaFin = '2026-06-01';
    try {
      const ctlMeta = new AbortController();
      const tMeta = setTimeout(() => ctlMeta.abort(), 3500);
      const metaRes = await fetch(`${baseOhsomeV1}/metadata`, {
        signal: ctlMeta.signal,
        headers: { 'User-Agent': USER_AGENT }
      });
      clearTimeout(tMeta);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const toTs = meta.extractRegion?.temporalExtent?.toTimestamp;
        if (toTs) fechaFin = toTs.slice(0, 10);
      }
    } catch (_) {}

    const anioFin = parseInt(fechaFin.slice(0, 4), 10);
    let fechaInicio = `${anioFin - 5}-01-01`;
    if (intervalo === 'P1M') {
      fechaInicio = `${anioFin - 1}-${fechaFin.slice(5)}`;
    } else if (intervalo === 'P6M') {
      fechaInicio = `${anioFin - 3}-01-01`;
    }
    const ventanaTiempo = `${fechaInicio}/${fechaFin}/${intervalo}`;
    const bboxesStr = bbox.join(',');

    const fLower = filtro.toLowerCase();
    let tipoGeo = 'punto';
    if (fLower.includes('highway') || fLower.includes('cycleway') || fLower.includes('footway') || fLower.includes('waterway') || fLower.includes('railway') || fLower.includes('path')) {
      tipoGeo = 'linea';
    } else if (fLower.includes('building') || fLower.includes('leisure') || fLower.includes('landuse') || fLower.includes('boundary')) {
      tipoGeo = 'poligono';
    }

    let versionReal = 'v1';
    let motorReal = 'OSHDB (HeiGIT Java Engine)';
    let fueFallback = false;

    async function consultarEndpoint(path, timeParam, usarV2 = false) {
      const base = usarV2 ? baseOhsomeV2 : baseOhsomeV1;
      const p = new URLSearchParams({
        bboxes: bboxesStr,
        filter: filtro,
        time: timeParam
      });
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      };
      if (usarV2 && apiKey && apiKey.trim()) {
        const token = apiKey.trim();
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        headers['apiKey'] = token.replace(/^Bearer\s+/i, '');
      }

      const ctl = new AbortController();
      const tId = setTimeout(() => ctl.abort(), 5500);

      try {
        const res = await fetch(`${base}${path}`, {
          method: 'POST',
          headers,
          body: p.toString(),
          signal: ctl.signal
        });
        clearTimeout(tId);
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${txt.slice(0, 100)}`);
        }
        return res.json();
      } catch (err) {
        clearTimeout(tId);
        throw err;
      }
    }

    let conteoActual = null;
    let usuarios = null;
    let serieTemporal = null;
    let resEspecial = null;
    let resContrib = null;

    if (version === 'v2') {
      try {
        const epEspecial = tipoGeo === 'linea' ? '/stats/features/length' : (tipoGeo === 'poligono' ? '/stats/features/area' : null);
        [conteoActual, usuarios, serieTemporal, resEspecial, resContrib] = await Promise.all([
          consultarEndpoint('/stats/features/count', fechaFin, true),
          consultarEndpoint('/stats/contributors/count', ventanaTiempo, true).catch(() => null),
          consultarEndpoint('/stats/features/count', ventanaTiempo, true).catch(() => null),
          epEspecial ? consultarEndpoint(epEspecial, fechaFin, true).catch(() => null) : Promise.resolve(null),
          consultarEndpoint('/stats/contributors/count', ventanaTiempo, true).catch(() => null)
        ]);

        if (conteoActual && (conteoActual.data || conteoActual.result)) {
          versionReal = 'v2';
          motorReal = 'ohsomeDB (PostgreSQL / Citus / Python)';
        } else {
          throw new Error('Sin datos en respuesta v2');
        }
      } catch (errV2) {
        console.warn(`[calidad.js] Consulta v2 no disponible o requiere API Key (${errV2.message}), ejecutando fallback a v1.`);
        fueFallback = true;
        conteoActual = null;
      }
    }

    if (!conteoActual) {
      const promesasV1 = [
        consultarEndpoint('/elements/count', fechaFin, false),
        consultarEndpoint('/users/count', ventanaTiempo, false).catch(() => null),
        consultarEndpoint('/elements/count', ventanaTiempo, false).catch(() => null)
      ];

      let promesaEspecialV1 = null;
      if (tipoGeo === 'linea') {
        promesaEspecialV1 = consultarEndpoint('/elements/length', fechaFin, false).catch(() => null);
      } else if (tipoGeo === 'poligono') {
        promesaEspecialV1 = consultarEndpoint('/elements/area', fechaFin, false).catch(() => null);
      }

      const promesaContribV1 = consultarEndpoint('/contributions/count', ventanaTiempo, false).catch(() => null);

      [conteoActual, usuarios, serieTemporal, resEspecial, resContrib] = await Promise.all([
        promesasV1[0],
        promesasV1[1],
        promesasV1[2],
        promesaEspecialV1,
        promesaContribV1
      ]);
    }

    const itemsConteo = extraerItems(conteoActual);
    const elementosAhora = itemsConteo.length > 0 ? Math.round(itemsConteo[0].value || 0) : 0;

    // Cálculo de área y densidad sobre Bbox mediante reproyección a EPSG:32719
    const geoSuperficie = calcularSuperficieBbox(bbox);
    const areaKm2 = geoSuperficie.areaKm2;
    const areaM2 = geoSuperficie.areaM2;
    const areaHa = geoSuperficie.areaHa;
    const densidad = areaKm2 > 0 ? (elementosAhora / areaKm2) : null;
    const densidad_m2 = areaM2 > 0 ? (elementosAhora / areaM2) : null;
    const densidad_ha = areaHa > 0 ? (elementosAhora / areaHa) : null;

    let metricaGeometrica = null;
    const itemsEspecial = extraerItems(resEspecial);
    if (tipoGeo === 'linea' && itemsEspecial.length > 0) {
      const metros = itemsEspecial[0].value || 0;
      metricaGeometrica = {
        tipo: 'longitud',
        etiqueta: 'Longitud de red trazada',
        valorMetros: Math.round(metros),
        valorM: Math.round(metros),
        valorKm: Number((metros / 1000).toFixed(2)),
        unidad: 'km'
      };
    } else if (tipoGeo === 'poligono' && itemsEspecial.length > 0) {
      const m2 = itemsEspecial[0].value || 0;
      metricaGeometrica = {
        tipo: 'superficie',
        etiqueta: 'Superficie total cubierta',
        valorM2: Math.round(m2),
        valorHectareas: Number((m2 / 10000).toFixed(2)),
        valorHa: Number((m2 / 10000).toFixed(2)),
        valorKm2: Number((m2 / 1000000).toFixed(4)),
        unidad: 'm²'
      };
    }

    const listaUsuarios = extraerItems(usuarios).map(r => ({
      fecha: (r.fromTimestamp || r.timestamp || '').slice(0, 10),
      valor: Math.round(r.value || 0)
    }));
    const ultimosUsuarios = (listaUsuarios && listaUsuarios.length > 0) ? listaUsuarios[listaUsuarios.length - 1].valor : 0;

    const listaContrib = extraerItems(resContrib).map(r => ({
      fecha: (r.fromTimestamp || r.timestamp || '').slice(0, 10),
      valor: Math.round(r.value || 0)
    }));
    const ultimasContrib = (listaContrib && listaContrib.length > 0) ? listaContrib[listaContrib.length - 1].valor : 0;
    const ratioContribUsuario = ultimosUsuarios > 0 ? Number((ultimasContrib / ultimosUsuarios).toFixed(1)) : null;

    const listaElementos = extraerItems(serieTemporal).map(r => ({
      fecha: (r.fromTimestamp || r.timestamp || '').slice(0, 10),
      valor: Math.round(r.value || 0)
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600'
      },
      body: JSON.stringify({
        ok: true,
        version: versionReal,
        motor: motorReal,
        fueFallback,
        fechaCorte: fechaFin,
        tipoGeometria: tipoGeo,
        elementosAhora: elementosAhora,
        metricaGeometrica,
        densidad: densidad ? Number(densidad.toFixed(2)) : null,
        densidad_m2: densidad_m2 ? Number(densidad_m2.toFixed(6)) : null,
        densidad_ha: densidad_ha ? Number(densidad_ha.toFixed(4)) : null,
        areaKm2: Number(areaKm2.toFixed(4)),
        areaHa: geoSuperficie.areaHa,
        areaM2: geoSuperficie.areaM2,
        srs: geoSuperficie.srs,
        reproyeccion_aplicada: 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur - Transverse Mercator)',
        ratioContribucionPorUsuario: ratioContribUsuario,
        usuariosPorAnio: listaUsuarios,
        elementosPorAnio: listaElementos,
        contribucionesPorAnio: listaContrib,
        referencias: [
          {
            autor: 'Raifer, M., Troilo, R., Kowatsch, F., Marx, S., & Zipf, A. (2019)',
            titulo: 'OSHDB: a framework for spatio-temporal analysis of OpenStreetMap history data (ohsome API v1)',
            doi: '10.1186/s40965-019-0061-3',
            url: 'https://doi.org/10.1186/s40965-019-0061-3'
          },
          {
            autor: 'HeiGIT - Heidelberg Institute for Geoinformation Technology (2025/2026)',
            titulo: 'ohsome API v2: Next-Generation OSM History Analysis with ohsomeDB and Citus',
            url: 'https://api.heigit.org/ohsome-api/v2-rc/docs'
          },
          {
            autor: 'Neis, P. & Zipf, A. (2012)',
            titulo: 'Analyzing the Contributor Activity of OpenStreetMap and Its Development for the Community',
            doi: '10.3390/ijgi1020146',
            url: 'https://doi.org/10.3390/ijgi1020146'
          }
        ]
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: error.message })
    };
  }
};
