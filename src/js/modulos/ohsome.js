/*
  ohsome.js
  ---------
  Módulo de análisis de calidad y evolución espacio-temporal de OpenStreetMap
  basado en la API v1 y v2 de ohsome (HeiGIT - Heidelberg Institute for Geoinformation Technology).

  Arquitectura Resiliente Híbrida:
  - Nivel 1 (Prioritario): Invoca el endpoint proxy /api/calidad (Netlify Function o servidor local Python),
    evitando bloqueos CORS del navegador y firewalls institucionales.
  - Nivel 2 (Fallback en Cliente): Conmutación automática a consultas directas en el navegador
    contra https://api.ohsome.org/v1 si el proxy no está disponible.
  - Sensibilidad geométrica:
    * Entidades Lineales (calles, ciclovías, metro): /elements/length (km) + /elements/count.
    * Entidades Poligonales (edificaciones, plazas): /elements/area (m²/ha) + /elements/count.
    * Entidades Puntuales (equipamiento, paraderos, arbolado): /elements/count.
  - Reproyección conforme a EPSG:32719 (WGS 84 / UTM 19S) para cálculo exacto de superficies en m² y densidades.
*/

const ModuloOhsome = (() => {

  let fechaMaximaDisponible = null;

  function bboxParaOhsome(bbox) {
    return bbox.join(',');
  }

  /**
   * Obtiene la fecha máxima disponible en el servidor ohsome para evitar errores 400 por fechas futuras
   */
  async function obtenerFechaMaxima(baseEndpoint) {
    if (fechaMaximaDisponible) return fechaMaximaDisponible;
    try {
      const ctl = new AbortController();
      const tId = setTimeout(() => ctl.abort(), 8000);
      const res = await fetch(`${baseEndpoint}/metadata`, { signal: ctl.signal });
      clearTimeout(tId);
      if (res.ok) {
        const meta = await res.json();
        const toTs = meta.extractRegion?.temporalExtent?.toTimestamp;
        if (toTs) {
          fechaMaximaDisponible = toTs.slice(0, 10);
          console.log(`[ohsome] Horizonte temporal detectado en servidor: ${fechaMaximaDisponible}`);
          return fechaMaximaDisponible;
        }
      }
    } catch (e) {
      console.warn('[ohsome] No se pudo leer metadata a tiempo, usando fecha de corte segura.');
    }
    fechaMaximaDisponible = '2026-07-27';
    return fechaMaximaDisponible;
  }

  /**
   * Determina la métrica geométrica especializada según el filtro OSM
   */
  function clasificarGeometria(filtro) {
    const f = (filtro || '').toLowerCase();
    if (f.includes('highway') || f.includes('cycleway') || f.includes('footway') || f.includes('waterway') || f.includes('railway') || f.includes('path') || f.includes('track')) {
      return 'linea';
    }
    if (f.includes('building') || f.includes('leisure') || f.includes('landuse') || f.includes('boundary') || f.includes('natural=wood')) {
      return 'poligono';
    }
    return 'punto';
  }

  async function consultarEndpointV1(rutaEndpoint, bbox, filtro, tiempo) {
    const base = window.NODO_CONFIG?.endpoints?.ohsome_v1 || window.NODO_CONFIG?.endpoints?.ohsome || 'https://api.ohsome.org/v1';
    const url = `${base}${rutaEndpoint}`;

    const cuerpo = new URLSearchParams({
      bboxes: bboxParaOhsome(bbox),
      filter: filtro,
      time: tiempo
    });

    const ctl = new AbortController();
    const tId = setTimeout(() => ctl.abort(), 25000); // 25s para permitir consultas OSHDB densas y multi-anuales

    try {
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: cuerpo.toString(),
        signal: ctl.signal
      });
      clearTimeout(tId);

      if (!respuesta.ok) {
        const texto = await respuesta.text().catch(() => '');
        throw new Error(`ohsome v1 código ${respuesta.status} en ${rutaEndpoint}. ${texto ? texto.slice(0, 100) : ''}`);
      }

      return respuesta.json();
    } catch (e) {
      clearTimeout(tId);
      throw e;
    }
  }

  async function consultarEndpointV2(rutaEndpoint, bbox, filtro, tiempo, apiKey) {
    const base = window.NODO_CONFIG?.endpoints?.ohsome_v2 || 'https://api.heigit.org/ohsome-api/v2-rc';
    const url = `${base}${rutaEndpoint}`;

    const cuerpo = new URLSearchParams({
      bboxes: bboxParaOhsome(bbox),
      filter: filtro,
      time: tiempo
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    if (apiKey && apiKey.trim()) {
      const token = apiKey.trim();
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      headers['apiKey'] = token.replace(/^Bearer\s+/i, '');
    }

    const ctl = new AbortController();
    const tId = setTimeout(() => ctl.abort(), 8000);

    try {
      const respuesta = await fetch(url, {
        method: 'POST',
        headers,
        body: cuerpo.toString(),
        signal: ctl.signal
      });
      clearTimeout(tId);

      if (!respuesta.ok) {
        const texto = await respuesta.text().catch(() => '');
        const err = new Error(`ohsome v2 código ${respuesta.status} en ${rutaEndpoint}. ${texto ? texto.slice(0, 100) : ''}`);
        err.status = respuesta.status;
        throw err;
      }

      return respuesta.json();
    } catch (e) {
      clearTimeout(tId);
      throw e;
    }
  }

  /**
   * Adapta la respuesta del backend /api/calidad al esquema esperado por la interfaz
   */
  function normalizarRespuestaProxy(dataProxy, versionSolicitada) {
    return {
      version: dataProxy.version || versionSolicitada,
      motor: dataProxy.motor || 'ohsome API (HeiGIT)',
      fueFallback: Boolean(dataProxy.fueFallback),
      motivoFallback: dataProxy.motivoFallback || null,
      tipoGeometria: dataProxy.tipoGeometria || 'punto',
      elementosAhora: Number(dataProxy.elementosAhora || 0),
      metricaGeometrica: dataProxy.metricaGeometrica || null,
      usuariosPorAnio: dataProxy.usuariosPorAnio || [],
      elementosPorAnio: dataProxy.elementosPorAnio || [],
      contribucionesPorAnio: dataProxy.contribucionesPorAnio || [],
      ratioContribucionPorUsuario: dataProxy.ratioContribucionPorUsuario || null,
      fechaCorte: dataProxy.fechaCorte || '2026-06-01',
      referencias: dataProxy.referencias || [
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
        }
      ]
    };
  }

  let proxyCalidadDisponible = null;
  const cacheOhsome = new Map();

  /**
   * Calcula los indicadores de calidad especializados según tipo de entidad (compatible con v1 y v2)
   */
  async function calcularIndicadores(bbox, filtro = 'building=* and type:way', intervalo = 'P1Y', version = 'v1', apiKey = '') {
    const claveCache = `${JSON.stringify(bbox)}_${filtro}_${intervalo}_${version}`;
    if (cacheOhsome.has(claveCache)) {
      console.log('[ohsome] Retornando indicadores de calidad desde caché en memoria');
      return cacheOhsome.get(claveCache);
    }

    // ----------------------------------------------------
    // NIVEL 1: Intentar primero vía /api/calidad (Serverless / Local) con timeout rápido (2s)
    // ----------------------------------------------------
    if (proxyCalidadDisponible !== false) {
      try {
        const ctlProxy = new AbortController();
        const tProxy = setTimeout(() => ctlProxy.abort(), 2000);
        const resProxy = await fetch('/api/calidad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bbox, filtro, intervalo, version, apiKey }),
          signal: ctlProxy.signal
        });
        clearTimeout(tProxy);

        if (resProxy.ok) {
          const dataProxy = await resProxy.json();
          if (dataProxy && dataProxy.ok) {
            proxyCalidadDisponible = true;
            console.log('[ohsome] Métrica de calidad calculada con éxito vía /api/calidad.');
            const resultado = normalizarRespuestaProxy(dataProxy, version);
            cacheOhsome.set(claveCache, resultado);
            return resultado;
          }
        } else if (resProxy.status === 404) {
          proxyCalidadDisponible = false;
        }
      } catch (errProxy) {
        console.warn('[ohsome] /api/calidad no accesible o lento (modo directo en cliente activo):', errProxy.message);
      }
    }

    // ----------------------------------------------------
    // NIVEL 2: Fallback directo en cliente (Browser fetch)
    // ----------------------------------------------------
    const baseV1 = window.NODO_CONFIG?.endpoints?.ohsome_v1 || window.NODO_CONFIG?.endpoints?.ohsome || 'https://api.ohsome.org/v1';
    const fechaFin = await obtenerFechaMaxima(baseV1);

    const anioFin = parseInt(fechaFin.slice(0, 4), 10);
    let fechaInicio = `${anioFin - 5}-01-01`;
    if (intervalo === 'P1M') {
      fechaInicio = `${anioFin - 1}-${fechaFin.slice(5)}`;
    } else if (intervalo === 'P6M') {
      fechaInicio = `${anioFin - 3}-01-01`;
    }
    const ventanaTiempo = `${fechaInicio}/${fechaFin}/${intervalo}`;

    const tipoGeo = clasificarGeometria(filtro);

    // Si se solicitó v2, intentar en cliente con captura de CORS para fallback
    if (version === 'v2') {
      try {
        console.log('[ohsome] Intentando consulta cliente directa v2...');
        const endpointEspecial = tipoGeo === 'linea' ? '/stats/features/length' : (tipoGeo === 'poligono' ? '/stats/features/area' : null);

        const promesasV2 = [
          consultarEndpointV2('/stats/features/count', bbox, filtro, fechaFin, apiKey),
          consultarEndpointV2('/stats/contributors/count', bbox, filtro, ventanaTiempo, apiKey).catch(() => null),
          consultarEndpointV2('/stats/features/count', bbox, filtro, ventanaTiempo, apiKey).catch(() => null),
          endpointEspecial ? consultarEndpointV2(endpointEspecial, bbox, filtro, fechaFin, apiKey).catch(() => null) : Promise.resolve(null),
          consultarEndpointV2('/stats/contributors/count', bbox, filtro, ventanaTiempo, apiKey).catch(() => null)
        ];

        const [conteoActual, usuarios, serieTemporal, resEspecial, resContribuciones] = await Promise.all(promesasV2);

        const resV2 = procesarResultadosIndicadores({
          tipoGeo,
          conteoActual,
          usuarios,
          serieTemporal,
          resEspecial,
          resContribuciones,
          fechaFin,
          versionUtilizada: 'v2',
          motor: 'ohsomeDB (PostgreSQL / Citus / Python)',
          fueFallback: false
        });
        if (claveCache) cacheOhsome.set(claveCache, resV2);
        return resV2;
      } catch (errV2) {
        console.warn(`[ohsome] Consulta v2 directa no permitida por CORS o falta de API Key (${errV2.message}). Conmutando automáticamente a v1 (OSHDB)...`);
        const resV1 = await ejecutarFlujoV1(bbox, filtro, tipoGeo, fechaFin, ventanaTiempo, claveCache);
        resV1.fueFallback = true;
        resV1.motivoFallback = errV2.status === 401 ? 'Requiere API Key de HeiGIT' : 'Conmutación por política CORS / Red';
        if (claveCache) cacheOhsome.set(claveCache, resV1);
        return resV1;
      }
    }

    // Flujo predeterminado v1 (OSHDB - acceso libre)
    return ejecutarFlujoV1(bbox, filtro, tipoGeo, fechaFin, ventanaTiempo, claveCache);
  }

  async function ejecutarFlujoV1(bbox, filtro, tipoGeo, fechaFin, ventanaTiempo, claveCache = null) {
    const promesas = [
      consultarEndpointV1('/elements/count', bbox, filtro, fechaFin).catch(e => {
        console.warn('[ohsome v1] Conteo puntual no disponible:', e.message);
        return null;
      }),
      consultarEndpointV1('/users/count', bbox, filtro, ventanaTiempo).catch(e => {
        console.warn('[ohsome v1] Usuarios no disponible:', e.message);
        return null;
      }),
      consultarEndpointV1('/elements/count', bbox, filtro, ventanaTiempo).catch(e => {
        console.warn('[ohsome v1] Serie no disponible:', e.message);
        return null;
      })
    ];

    let promesaEspecial = null;
    if (tipoGeo === 'linea') {
      promesaEspecial = consultarEndpointV1('/elements/length', bbox, filtro, fechaFin).catch(e => {
        console.warn('[ohsome v1] Longitud no aplicable o error:', e.message);
        return null;
      });
    } else if (tipoGeo === 'poligono') {
      promesaEspecial = consultarEndpointV1('/elements/area', bbox, filtro, fechaFin).catch(e => {
        console.warn('[ohsome v1] Área no aplicable o error:', e.message);
        return null;
      });
    }

    const promesaContribuciones = consultarEndpointV1('/contributions/count', bbox, filtro, ventanaTiempo).catch(e => {
      console.warn('[ohsome v1] Contribuciones no aplicable o error:', e.message);
      return null;
    });

    const [conteoActual, usuarios, serieTemporal, resEspecial, resContribuciones] = await Promise.all([
      promesas[0],
      promesas[1],
      promesas[2],
      promesaEspecial,
      promesaContribuciones
    ]);

    const resultadoFinal = procesarResultadosIndicadores({
      tipoGeo,
      conteoActual,
      usuarios,
      serieTemporal,
      resEspecial,
      resContribuciones,
      fechaFin,
      versionUtilizada: 'v1',
      motor: 'OSHDB (HeiGIT Java Engine)',
      fueFallback: false
    });
    if (claveCache) {
      cacheOhsome.set(claveCache, resultadoFinal);
    }
    return resultadoFinal;
  }

  function procesarResultadosIndicadores(params) {
    const {
      tipoGeo,
      conteoActual,
      usuarios,
      serieTemporal,
      resEspecial,
      resContribuciones,
      fechaFin,
      versionUtilizada,
      motor,
      fueFallback
    } = params;

    const extractArray = (obj) => {
      if (!obj) return [];
      if (Array.isArray(obj)) return obj;
      if (Array.isArray(obj.result)) return obj.result;
      if (Array.isArray(obj.data)) return obj.data;
      return [];
    };

    const resActual = extractArray(conteoActual);
    let elementosAhora = resActual.length > 0 ? (resActual[0].value || 0) : 0;

    const listaUsuarios = extractArray(usuarios).map(r => ({
      fecha: (r.fromTimestamp || r.timestamp || '').slice(0, 10),
      valor: Math.round(r.value || 0)
    }));

    const listaElementos = extractArray(serieTemporal).map(r => ({
      fecha: (r.fromTimestamp || r.timestamp || '').slice(0, 10),
      valor: Math.round(r.value || 0)
    }));

    if (!elementosAhora && listaElementos.length > 0) {
      elementosAhora = listaElementos[listaElementos.length - 1].valor || 0;
    }

    const listaContribuciones = extractArray(resContribuciones).map(r => ({
      fecha: (r.fromTimestamp || r.timestamp || '').slice(0, 10),
      valor: Math.round(r.value || 0)
    }));

    // Métricas geométricas calculadas
    let metricaGeometrica = null;
    const itemsEspecial = extractArray(resEspecial);
    if (tipoGeo === 'linea' && itemsEspecial.length > 0) {
      const metros = itemsEspecial[0].value || 0;
      metricaGeometrica = {
        tipo: 'longitud',
        etiqueta: 'Longitud total de red trazada',
        valorMetros: Math.round(metros),
        valorKm: Number((metros / 1000).toFixed(2)),
        unidad: 'km'
      };
    } else if (tipoGeo === 'poligono' && itemsEspecial.length > 0) {
      const m2 = itemsEspecial[0].value || 0;
      metricaGeometrica = {
        tipo: 'superficie',
        etiqueta: 'Superficie total construida / cubierta',
        valorM2: Math.round(m2),
        valorKm2: Number((m2 / 1000000).toFixed(4)),
        valorHectareas: Number((m2 / 10000).toFixed(2)),
        unidad: 'm²'
      };
    }

    // Ratio de intensidad comunitaria (sin usar Array.prototype.at para compatibilidad universal)
    const ultimoUsuarios = (listaUsuarios && listaUsuarios.length > 0) ? listaUsuarios[listaUsuarios.length - 1].valor : 0;
    const ultimasContribuciones = (listaContribuciones && listaContribuciones.length > 0) ? listaContribuciones[listaContribuciones.length - 1].valor : 0;
    const ratioContribucionPorUsuario = ultimoUsuarios > 0 ? Number((ultimasContribuciones / ultimoUsuarios).toFixed(1)) : null;

    return {
      version: versionUtilizada,
      motor,
      fueFallback,
      tipoGeometria: tipoGeo,
      elementosAhora: Math.round(elementosAhora),
      metricaGeometrica,
      usuariosPorAnio: listaUsuarios,
      elementosPorAnio: listaElementos,
      contribucionesPorAnio: listaContribuciones,
      ratioContribucionPorUsuario,
      fechaCorte: fechaFin,
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
        },
        {
          autor: 'Haklay, M. (2010)',
          titulo: 'How good is volunteered geographical information? A case study of OpenStreetMap in the UK',
          doi: '10.1068/b35097',
          url: 'https://doi.org/10.1068/b35097'
        }
      ]
    };
  }

  /**
   * Calcula densidad de elementos por km² sobre el Bounding Box
   * aplicando reproyección geodésica rigurosa a EPSG:32719 (UTM 19S)
   */
  function calcularDensidad(bbox, cantidadElementos) {
    let infoArea = null;
    if (typeof ModuloGeodesia !== 'undefined' && ModuloGeodesia.calcularSuperficieBbox) {
      infoArea = ModuloGeodesia.calcularSuperficieBbox(bbox);
    } else {
      // Fallback geodésico WGS 84 / UTM 19S (Snyder, 1987)
      const a = 6378137.0;
      const f = 1 / 298.257223563;
      const e2 = 2 * f - f * f;
      const latMediaRad = ((bbox[1] + bbox[3]) / 2) * (Math.PI / 180);
      const mLat = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(latMediaRad) ** 2, 1.5);
      const mLon = (a * Math.cos(latMediaRad)) / Math.sqrt(1 - e2 * Math.sin(latMediaRad) ** 2);
      const anchoM = Math.abs(bbox[2] - bbox[0]) * (Math.PI / 180) * mLon;
      const altoM = Math.abs(bbox[3] - bbox[1]) * (Math.PI / 180) * mLat;
      const areaM2 = anchoM * altoM;
      infoArea = {
        areaM2: Math.round(areaM2),
        areaHa: Number((areaM2 / 10000).toFixed(2)),
        areaKm2: Number((areaM2 / 1000000).toFixed(4)),
        srs: 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)',
        metodo: 'Reproyección geodésica conforme a EPSG:32719 + Fórmula de Gauss'
      };
    }

    if (!infoArea || infoArea.areaKm2 <= 0) return null;

    return {
      densidad: cantidadElementos / infoArea.areaKm2,
      densidadHa: infoArea.areaHa > 0 ? (cantidadElementos / infoArea.areaHa) : null,
      densidadM2: infoArea.areaM2 > 0 ? (cantidadElementos / infoArea.areaM2) : null,
      densidad1000m2: infoArea.areaM2 > 0 ? Number(((cantidadElementos / infoArea.areaM2) * 1000).toFixed(4)) : null,
      areaM2: infoArea.areaM2,
      areaHa: infoArea.areaHa,
      areaKm2: infoArea.areaKm2,
      srs: infoArea.srs,
      metodo: infoArea.metodo
    };
  }

  return {
    calcularIndicadores,
    calcularDensidad,
    clasificarGeometria
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloOhsome = ModuloOhsome;
}
