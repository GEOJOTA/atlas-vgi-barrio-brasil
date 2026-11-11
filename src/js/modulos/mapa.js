/*
  mapa.js
  -------
  Módulo de visualización cartográfica con Leaflet para el Atlas VGI.
  Maneja:
  - Inicialización del visor cartográfico en el territorio predeterminado (Barrio Brasil).
  - Selección de capas base (OpenStreetMap Estándar, Relieve Topográfico).
  - Herramienta de visualización y dibujo interactivo del Bounding Box (sincronizada con inputs).
  - Selector de territorios predefinidos (Barrio Brasil, Santiago Centro, etc.).
  - Representación de capas temáticas GeoJSON con simbología de carta topográfica y popups informativos.
  - Exportación de capas del mapa a archivo GeoJSON.
*/

const ModuloMapa = (() => {
  let mapa = null;
  let capaBbox = null;
  let grupoCapasTematicas = null;
  let capasTematicasActivas = {};
  let dibujandoBbox = false;
  let puntoInicioBbox = null;
  let rectanguloTemporal = null;

  // Paleta de colores temáticos coherente con estilos.css
  const COLORES_CATEGORIA = {
    educacion: '#35586B',
    servicios: '#A97722',
    transporte: '#2C4238',
    movilidad_activa: '#3F5D4E',
    espacio_publico: '#236B43',
    patrimonio: '#8F3A2C',
    accesibilidad: '#4B5142',
    biodiversidad: '#1C523A',
    edificaciones: '#555555',
    cobertura_suelo: '#5B704E',
    // Capas Oficiales IDE Chile y MINVU - Censo 2024 Multiescalar
    censo2024_regional: '#0A3D2E',
    censo2024_limite_urbano: '#165B4C',
    censo2024_localidades: '#1E7A56',
    censo2024_zonal: '#279B6C',
    censo2024_manzanas: '#34BF82',
    minvu_patrimonio: '#8F3A2C',
    minvu_ipt_areas_verdes: '#059669',
    educacion_parvularia: '#417A63',
    establecimientos_salud: '#B22222',
    bomberos: '#C71585',
    carabineros: '#2E5D3E',
    estaciones_metro: '#B33928',
    red_ferroviaria: '#34495E',
    cmn_sitios_memoria: '#5C4033',
    defecto: '#35586B'
  };

  let capasWMSActivas = {};
  let layerActivoPopup = null;
  let _pendingBboxBounds = null;

  function inicializar(idContenedor = 'mapa-atlas') {
    const el = document.getElementById(idContenedor);
    if (!el || mapa) return;

    const cfg = window.NODO_CONFIG || {};
    const centro = cfg.area_por_defecto?.centro || [-33.4445, -70.6620];
    const zoom = cfg.area_por_defecto?.zoom || 16;

    // Capas base 100% abiertas y satelitales sin requerir clave API (OpenStreetMap, Bing/Microsoft y Esri)
    const osmEstandar = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> colaboradores (ODbL)',
      maxZoom: 19
    });

    const osmHumanitario = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> colaboradores, Estilo <a href="https://www.hotosm.org/" target="_blank" rel="noopener">HOT</a>',
      maxZoom: 19
    });

    // Conector nativo QuadKey para imágenes satelitales de Bing / Microsoft VirtualEarth sin clave API
    const CapaBingMicrosoft = L.TileLayer.extend({
      getTileUrl: function (coords) {
        const z = this._getZoomForUrl();
        let quadKey = '';
        for (let i = z; i > 0; i--) {
          let digit = 0;
          const mask = 1 << (i - 1);
          if ((coords.x & mask) !== 0) digit += 1;
          if ((coords.y & mask) !== 0) digit += 2;
          quadKey += digit.toString();
        }
        return L.Util.template(this._url, {
          s: this._getSubdomain(coords),
          q: quadKey
        });
      }
    });

    const satelitalBingMicrosoft = new CapaBingMicrosoft('https://ecn.t{s}.tiles.virtualearth.net/tiles/a{q}.jpeg?g=14000', {
      attribution: 'Imágenes satelitales &copy; <a href="https://www.bing.com/maps" target="_blank" rel="noopener">Bing / Microsoft</a> VirtualEarth',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 19
    });

    const satelitalBingHibrido = new CapaBingMicrosoft('https://ecn.t{s}.tiles.virtualearth.net/tiles/h{q}.jpeg?g=14000&mkt=es-CL', {
      attribution: 'Imágenes satelitales y vialidad &copy; <a href="https://www.bing.com/maps" target="_blank" rel="noopener">Bing / Microsoft</a> VirtualEarth',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 19
    });

    // Capa Satelital Esri World Imagery (abierta, de alta resolución global y sin requerir clave API)
    const satelitalEsri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &mdash; Maxar, Earthstar Geographics, CNES/Airbus, USDA, USGS, IGN y Comunidad SIG',
      maxZoom: 19
    });

    mapa = L.map(idContenedor, {
      center: centro,
      zoom: zoom,
      layers: [osmEstandar],
      zoomControl: true,
      preferCanvas: true
    });

    const mapasBase = {
      'OpenStreetMap Estándar (Predeterminado)': osmEstandar,
      'OpenStreetMap Humanitario (HOT)': osmHumanitario,
      'Imagen Satelital (Bing / Microsoft)': satelitalBingMicrosoft,
      'Satelital Híbrido con Calles (Bing / Microsoft)': satelitalBingHibrido,
      'Imagen Satelital (Esri World Imagery)': satelitalEsri
    };

    L.control.layers(mapasBase, null, { position: 'topright' }).addTo(mapa);
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(mapa);

    // Observador reactivo de redimensionamiento del contenedor del visor Leaflet
    if (window.ResizeObserver && el) {
      try {
        const ro = new ResizeObserver(() => {
          if (mapa && el.clientWidth > 0 && el.clientHeight > 0) {
            mapa.invalidateSize({ pan: false });
          }
        });
        ro.observe(el);
      } catch (_) {}
    }

    grupoCapasTematicas = L.featureGroup().addTo(mapa);

    // En Modo Inspector Normativo (PRC), evitar que los popups genéricos de otras capas
    // oculten o reemplacen al marcador de auditoría normativa
    mapa.on('popupopen', (ev) => {
      const inspActivo = Boolean(window.__inspectorNormativoActivo || document.getElementById('btn-inspector-normativo')?.classList.contains('activo'));
      const src = ev && ev.popup && ev.popup._source;
      if (inspActivo && (!src || !src._esPinInspectorNormativo)) {
        try {
          mapa.closePopup(ev.popup);
          if (typeof ev.popup.remove === 'function') ev.popup.remove();
          if (typeof ev.popup.getElement === 'function') ev.popup.getElement()?.remove();
        } catch (_) {}
      }
    });

    // Pintar el bbox inicial
    if (cfg.area_por_defecto?.bbox) {
      actualizarRectanguloBbox(cfg.area_por_defecto.bbox);
    }

    configurarEventosDibujoBbox();
    inicializarControlSimbologia();

    let timerResizeGlobal;
    window.addEventListener('resize', () => {
      clearTimeout(timerResizeGlobal);
      timerResizeGlobal = setTimeout(() => {
        if (mapa) {
          try { mapa.invalidateSize({ pan: false }); } catch (_) {}
        }
      }, 100);
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (mapa) {
          try { mapa.invalidateSize({ pan: false }); } catch (_) {}
        }
      }, 200);
    });
  }

  function actualizarRectanguloBbox(bbox) {
    if (!mapa) return;
    const [oeste, sur, este, norte] = bbox;
    const bounds = [[sur, oeste], [norte, este]];

    let textoTooltip = 'Área de Consulta VGI';
    if (typeof ModuloGeodesia !== 'undefined' && ModuloGeodesia.calcularSuperficieBbox) {
      const s = ModuloGeodesia.calcularSuperficieBbox(bbox);
      textoTooltip = `Área Bbox: ${s.areaM2.toLocaleString('es-CL')} m² (${s.areaHa.toLocaleString('es-CL')} ha / ${s.areaKm2} km²) [EPSG:32719]`;
    }

    if (capaBbox) {
      capaBbox.setBounds(bounds);
      if (capaBbox.getTooltip()) {
        capaBbox.setTooltipContent(textoTooltip);
      } else {
        capaBbox.bindTooltip(textoTooltip, { permanent: false, direction: 'top' });
      }
    } else {
      capaBbox = L.rectangle(bounds, {
        color: '#A97722',
        weight: 2,
        dashArray: '5, 5',
        fillColor: '#A97722',
        fillOpacity: 0.08,
        interactive: false
      }).addTo(mapa);
      capaBbox.bindTooltip(textoTooltip, { permanent: false, direction: 'top' });
    }
  }

  function encuadrarBbox(bbox) {
    if (!mapa || !bbox) return;
    const [oeste, sur, este, norte] = bbox;
    const bounds = L.latLngBounds([[sur, oeste], [norte, este]]);
    const sz = mapa.getSize ? mapa.getSize() : null;
    if (!sz || sz.x < 50 || sz.y < 50) {
      // Contenedor aún oculto (0x0 px): evitar fitBounds que colapsa a zoom 19
      _pendingBboxBounds = bounds;
      const zoomDef = (window.NODO_CONFIG && window.NODO_CONFIG.area_por_defecto && window.NODO_CONFIG.area_por_defecto.zoom) || 15;
      mapa.setView([(sur + norte) / 2, (oeste + este) / 2], zoomDef, { animate: false });
    } else {
      _pendingBboxBounds = null;
      mapa.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
    }
    actualizarRectanguloBbox(bbox);
  }

  function configurarEventosDibujoBbox() {
    if (!mapa) return;
    const container = mapa.getContainer();

    container.addEventListener('pointerdown', (e) => {
      if (!dibujandoBbox) return;
      if (e.target && e.target.closest('.leaflet-control-container, .leaflet-popup')) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const containerPoint = L.point(e.clientX - rect.left, e.clientY - rect.top);
      puntoInicioBbox = mapa.containerPointToLatLng(containerPoint);

      if (rectanguloTemporal) mapa.removeLayer(rectanguloTemporal);
      rectanguloTemporal = L.rectangle([puntoInicioBbox, puntoInicioBbox], {
        color: '#8F3A2C',
        weight: 2,
        dashArray: '4, 4',
        fillOpacity: 0.2
      }).addTo(mapa);
      mapa.dragging.disable();
    });

    container.addEventListener('pointermove', (e) => {
      if (!dibujandoBbox || !puntoInicioBbox || !rectanguloTemporal) return;
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const containerPoint = L.point(e.clientX - rect.left, e.clientY - rect.top);
      const latlngActual = mapa.containerPointToLatLng(containerPoint);
      rectanguloTemporal.setBounds([puntoInicioBbox, latlngActual]);
    });

    const finalizarDibujo = (e) => {
      if (!dibujandoBbox || !puntoInicioBbox) return;
      if (e) e.preventDefault();

      let puntoFin = puntoInicioBbox;
      if (e && e.clientX && e.clientY) {
        const rect = container.getBoundingClientRect();
        const containerPoint = L.point(e.clientX - rect.left, e.clientY - rect.top);
        puntoFin = mapa.containerPointToLatLng(containerPoint);
      }

      mapa.dragging.enable();
      dibujandoBbox = false;

      const oeste = Math.min(puntoInicioBbox.lng, puntoFin.lng);
      const este = Math.max(puntoInicioBbox.lng, puntoFin.lng);
      const sur = Math.min(puntoInicioBbox.lat, puntoFin.lat);
      const norte = Math.max(puntoInicioBbox.lat, puntoFin.lat);

      if (rectanguloTemporal) {
        mapa.removeLayer(rectanguloTemporal);
        rectanguloTemporal = null;
      }
      puntoInicioBbox = null;

      if (Math.abs(este - oeste) > 0.0001 && Math.abs(norte - sur) > 0.0001) {
        const nuevoBbox = [
          Number(oeste.toFixed(5)),
          Number(sur.toFixed(5)),
          Number(este.toFixed(5)),
          Number(norte.toFixed(5))
        ];
        actualizarRectanguloBbox(nuevoBbox);
        document.dispatchEvent(new CustomEvent('nodo:bbox-cambiado', { detail: { bbox: nuevoBbox } }));
      }

      desactivarModoDibujoBbox();
    };

    container.addEventListener('pointerup', finalizarDibujo);
  }

  function activarModoDibujoBbox() {
    dibujandoBbox = true;
    const btn = document.getElementById('btn-dibujar-bbox');
    if (btn) btn.classList.add('activo');
    if (mapa) {
      mapa.getContainer().style.cursor = 'crosshair';
      mapa.dragging.disable();
    }
  }

  function desactivarModoDibujoBbox() {
    dibujandoBbox = false;
    const btn = document.getElementById('btn-dibujar-bbox');
    if (btn) btn.classList.remove('activo');
    if (mapa) {
      mapa.getContainer().style.cursor = '';
      mapa.dragging.enable();
    }
  }

  // =========================================================================
  // MOTOR DE SIMBOLOGÍA TEMÁTICA DINÁMICA CONFIGURABLE
  // =========================================================================

  const RAMPAS_CUANTITATIVAS = {
    verde_azul: ['#f0f9e8', '#ccebc5', '#a8ddb5', '#7bccc4', '#43a2ca', '#0868ac'],
    azul_verde: ['#edf8fb', '#ccece6', '#99d8c9', '#66c2a4', '#2ca25f', '#006d2c'],
    ylorrd: ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026'],
    blues: ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'],
    greens: ['#edf8e9', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#005a32'],
    reds: ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#99000d'],
    purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#756bb1', '#54278f'],
    oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801'],
    grises: ['#f7f7f7', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525'],
    viridis: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#bddf26', '#fde725'],
    plasma: ['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921'],
    inferno: ['#000004', '#160b39', '#420a68', '#6a176e', '#932667', '#ba3655', '#dd513a', '#f37819', '#fca50a', '#f6d746'],
    magma: ['#000004', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fec488', '#fcfdbf'],
    cividis: ['#00204d', '#00377a', '#36537d', '#576f83', '#778c89', '#98aa8e', '#bcc78c', '#e5e478', '#ffea46'],
    turbo: ['#30123b', '#4145ab', '#4675ed', '#39a2fc', '#1bcfd4', '#24eca6', '#61fc6c', '#a4fc3b', '#d1e834', '#f3c63a', '#fe9b2d', '#f36315', '#d93806', '#b01a02', '#7a0403'],
    verde_rojo: ['#1a9850', '#66bd63', '#a6d96a', '#d9ef8b', '#fee08b', '#fdae61', '#f46d43', '#d73027'],
    rojo_verde: ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'],
    azul_rojo: ['#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b'],
    rojo_azul: ['#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac'],
    espectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
    marron_verde: ['#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e'],
    purpura_verde: ['#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837']
  };

  const PALETAS_CATEGORICAS = {
    armonica: [
      '#2563eb', '#d97706', '#059669', '#dc2626', '#7c3aed',
      '#0891b2', '#ea580c', '#4f46e5', '#16a34a', '#db2777',
      '#ca8a04', '#0284c7', '#9333ea', '#e11d48', '#0d9488',
      '#65a30d', '#f97316', '#6366f1', '#14b8a6', '#84cc16'
    ],
    vibrante: [
      '#e11d48', '#2563eb', '#f59e0b', '#10b981', '#8b5cf6',
      '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1'
    ],
    tableau: [
      '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
      '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
    ],
    set1: [
      '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
      '#ffff33', '#a65628', '#f781bf', '#999999'
    ],
    set2: [
      '#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854',
      '#ffd92f', '#e5c494', '#b3b3b3'
    ],
    paired: [
      '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99',
      '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a'
    ],
    pastel: [
      '#93c5fd', '#fca5a5', '#86efac', '#fde047', '#c4b5fd',
      '#fdba74', '#6ee7b7', '#f9a8d4', '#a5f3fc', '#d8b4fe'
    ],
    tierra: [
      '#8b5a2b', '#556b2f', '#a0522d', '#cd853f', '#2e8b57',
      '#8fbc8f', '#b8860b', '#bc8f8f', '#696969', '#4682b4'
    ]
  };

  const PALETA_CATEGORIZADA = PALETAS_CATEGORICAS.armonica;

  let registroCapasTematicas = {}; // idCapa -> { idCapa, geojson, opciones, capaLeaflet, cols, config, clasificacion }
  let capaActivaSimbologiaId = null;
  let leyendaVisorCerradaManualmente = false;

  function hashCadena(str) {
    if (!str) return 0;
    let hash = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function obtenerColorDePaleta(clave, paletaKey = 'armonica', invertido = false) {
    let paleta = PALETAS_CATEGORICAS[paletaKey] || PALETAS_CATEGORICAS.armonica;
    if (invertido) {
      paleta = [...paleta].reverse();
    }
    const idx = hashCadena(clave) % paleta.length;
    return paleta[idx];
  }

  function interpolarRampa(rampaKey, k, invertido = false) {
    let base = RAMPAS_CUANTITATIVAS[rampaKey] || RAMPAS_CUANTITATIVAS.ylorrd;
    if (invertido) {
      base = [...base].reverse();
    }
    const n = Math.max(2, Math.min(k, 10));
    const colores = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.round(i * (base.length - 1) / (n - 1 || 1));
      colores.push(base[idx]);
    }
    return colores;
  }

  function formatearNumeroLegible(num) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    const n = Number(num);
    if (Math.abs(n) >= 1000000) {
      return (n / 1000000).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + 'M';
    }
    if (Math.abs(n) >= 1000) {
      return n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
    }
    if (Number.isInteger(n)) {
      return n.toString();
    }
    return n.toLocaleString('es-CL', { maximumFractionDigits: 2 });
  }

  // --- Algoritmos Estadísticos de Clasificación Cuantitativa ---

  function escaparHTML(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function calcularMinMax(valores) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < valores.length; i++) {
      const v = valores[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return min <= max ? [min, max] : [0, 1];
  }

  function muestrearEstratificadoOrdenado(dataOrdenada, maxMuestras = 600) {
    const n = dataOrdenada.length;
    if (n <= maxMuestras) return dataOrdenada;
    const muestra = [dataOrdenada[0]];
    const inner = maxMuestras - 2;
    for (let i = 1; i <= inner; i++) {
      const idx = Math.floor((i * (n - 1)) / (inner + 1));
      muestra.push(dataOrdenada[idx]);
    }
    muestra.push(dataOrdenada[n - 1]);
    return muestra;
  }

  function calcularPrettyBreaks(valores, n = 4) {
    if (!valores || valores.length === 0) return [0, 1];
    const [min, max] = calcularMinMax(valores);
    if (min === max) return [min, max + 1];

    const rawRange = max - min;
    const rawInterval = rawRange / Math.max(1, n);
    const base = Math.pow(10, Math.floor(Math.log10(rawInterval || 1)));
    const normalized = rawInterval / (base || 1);

    let prettyInterval;
    if (normalized < 1.5) prettyInterval = 1 * base;
    else if (normalized < 3) prettyInterval = 2 * base;
    else if (normalized < 7) prettyInterval = 5 * base;
    else prettyInterval = 10 * base;

    const start = Math.floor(min / prettyInterval) * prettyInterval;
    const end = Math.ceil(max / prettyInterval) * prettyInterval;

    const breaks = [];
    for (let v = start; v <= end + (prettyInterval * 0.5) && breaks.length < 24; v += prettyInterval) {
      breaks.push(Math.round(v * 100) / 100);
    }
    const unicos = Array.from(new Set(breaks)).sort((a, b) => a - b);
    return unicos.length >= 2 ? unicos : [min, max];
  }

  function calcularCuantiles(valores, k = 4) {
    if (!valores || valores.length === 0) return [0, 1];
    const sorted = [...valores].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    if (min === max) return [min, max + 1];

    const breaks = [min];
    for (let i = 1; i < k; i++) {
      const pos = (sorted.length - 1) * (i / k);
      const base = Math.floor(pos);
      const rest = pos - base;
      const val = sorted[base + 1] !== undefined
        ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
        : sorted[base];
      breaks.push(Math.round(val * 10000) / 10000);
    }
    breaks.push(max);
    const unicos = Array.from(new Set(breaks)).sort((a, b) => a - b);
    return unicos.length >= 2 ? unicos : [min, max];
  }

  function calcularIntervalosIguales(valores, k = 4) {
    if (!valores || valores.length === 0) return [0, 1];
    const [min, max] = calcularMinMax(valores);
    if (min === max) return [min, max + 1];
    const step = (max - min) / Math.max(1, k);
    const breaks = [];
    for (let i = 0; i <= k; i++) {
      breaks.push(Math.round((min + i * step) * 10000) / 10000);
    }
    const unicos = Array.from(new Set(breaks)).sort((a, b) => a - b);
    return unicos.length >= 2 ? unicos : [min, max];
  }

  function calcularDesviacionEstandar(valores) {
    if (!valores || valores.length === 0) return [0, 1];
    const n = valores.length;
    const [min, max] = calcularMinMax(valores);
    if (min === max) return [min, max + 1];

    let suma = 0;
    for (let i = 0; i < n; i++) suma += valores[i];
    const media = suma / n;
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      const d = valores[i] - media;
      sumSq += d * d;
    }
    const std = Math.sqrt(sumSq / n) || 1;

    const b1 = Math.max(min, Math.round((media - std) * 100) / 100);
    const b2 = Math.round(media * 100) / 100;
    const b3 = Math.min(max, Math.round((media + std) * 100) / 100);
    const breaks = [min, b1, b2, b3, max];
    const unicos = Array.from(new Set(breaks)).sort((a, b) => a - b);
    return unicos.length >= 2 ? unicos : [min, max];
  }

  function calcularJenks(valores, nClasses = 5) {
    if (!valores || valores.length === 0) return [0, 1];
    const ordenados = [...valores].filter(v => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
    if (ordenados.length === 0) return [0, 1];

    const min = ordenados[0];
    const max = ordenados[ordenados.length - 1];
    if (min === max) return [min, max + 1];

    const unicosTotales = Array.from(new Set(ordenados));
    if (unicosTotales.length < 2) return [min, max + 1];
    if (unicosTotales.length <= nClasses) return unicosTotales;

    // Muestreo estratificado por cuantiles preservando extremos para garantizar O(600^2 * k) < 15ms
    const data = muestrearEstratificadoOrdenado(ordenados, 600);
    const numData = data.length;
    const kEff = Math.max(2, Math.min(nClasses, numData));

    const mat1 = Array.from({ length: numData + 1 }, () => new Int32Array(kEff + 1));
    const mat2 = Array.from({ length: numData + 1 }, () => new Float64Array(kEff + 1));

    for (let y = 1; y <= kEff; y++) {
      mat1[1][y] = 1;
      mat2[1][y] = 0;
      for (let t = 2; t <= numData; t++) {
        mat2[t][y] = Infinity;
      }
    }

    let v = 0;
    for (let l = 2; l <= numData; l++) {
      let s1 = 0;
      let s2 = 0;
      let w = 0;
      for (let m = 1; m <= l; m++) {
        const i3 = l - m + 1;
        const val = data[i3 - 1];
        s2 += val * val;
        s1 += val;
        w++;
        v = Math.max(0, s2 - (s1 * s1) / w);
        const i4 = i3 - 1;
        if (i4 !== 0) {
          for (let j = 2; j <= kEff; j++) {
            const cand = v + mat2[i4][j - 1];
            if (mat2[l][j] >= cand) {
              mat1[l][j] = i3;
              mat2[l][j] = cand;
            }
          }
        }
      }
      mat1[l][1] = 1;
      mat2[l][1] = v;
    }

    let k = numData;
    const kclass = new Array(kEff + 1);
    kclass[kEff] = max;
    kclass[0] = min;

    for (let count = kEff; count >= 2; count--) {
      const rawId = (mat1[k] && mat1[k][count]) ? mat1[k][count] : 2;
      const id = Math.max(0, Math.min(numData - 1, rawId - 2));
      kclass[count - 1] = data[id];
      k = Math.max(1, rawId - 1);
    }

    const unicos = Array.from(new Set(kclass.filter(x => typeof x === 'number' && Number.isFinite(x)))).sort((a, b) => a - b);
    if (unicos.length < 2) return calcularCuantiles(ordenados, kEff);
    return unicos;
  }

  const COLUMNAS_TECNICAS_FILTRADAS = new Set([
    'fid', 'id', 'id1', 'oid', 'gid', 'cartodb_id', 'objectid', 'objectid_1', 'objectid_12',
    'esri_oid', 'osm_id', 'node_id', 'way_id', 'id_ig', 'id_igv', 'id_vgi', 't_id_uv_ca',
    'cut', 'cut_com', 'cut_prov', 'cut_reg', 'cut_2018', 'cod_com', 'cod_prov', 'cod_reg',
    'cod_bna', 'codcom', 'codprov', 'codreg', 'manzent', 'geom_wkt', 'coordenadas', 'bbox',
    'srs_superficie', 'srs_metrico', 'metodo_adquisicion', 'ley_aplicable', 'iso_topic_category',
    'fecha_registro', 'fecha_ingesta', 'fecha_catastro', 'fecha_oficio', 'fuente_documento',
    'fuente_institucion', 'cita_apa', 'fuente', 'licencia', 'accesibilidad', 'huso',
    'shape_leng', 'shape_area', 'shape_length', 'shape_len', 'shape__area', 'shape__length',
    'shape__are', 'shape__len', 'shape_star', 'shape_stle', 'st_area_sh', 'st_length_',
    'st_length', 'st_area', 'shape.starea()', 'shape.stlength()', 'shape.star', 'shape.stle',
    'bdide.owd.', 'uuid'
  ]);

  function esColumnaTecnica(nombreCol) {
    const k = String(nombreCol || '').trim();
    const kl = k.toLowerCase();
    if (!k) return true;
    if (kl.startsWith('_') || kl.startsWith('meta_') || kl.startsWith('shape') || kl.startsWith('st_')) return true;
    return COLUMNAS_TECNICAS_FILTRADAS.has(kl);
  }

  function inspeccionarColumnasGeoJSON(geojson) {
    if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
      return { numericas: [], categoricas: [], todas: [] };
    }
    const numericCounts = {};
    const totalCounts = {};
    const feats = geojson.features;
    const total = feats.length;
    const maxSample = Math.min(total, 400);
    const step = Math.max(1, Math.floor(total / maxSample));

    for (let idx = 0; idx < total; idx += step) {
      const f = feats[idx];
      const props = (f && f.properties) ? f.properties : {};
      Object.entries(props).forEach(([k, v]) => {
        if (esColumnaTecnica(k)) return;
        totalCounts[k] = (totalCounts[k] || 0) + 1;
        if (typeof v === 'number' && Number.isFinite(v)) {
          numericCounts[k] = (numericCounts[k] || 0) + 1;
        } else if (typeof v === 'string') {
          const trimmed = v.trim();
          if (trimmed.length > 0 && !/^(fecha|cut|cod|id_)/i.test(k)) {
            const parsed = Number(trimmed.replace(',', '.'));
            if (!isNaN(parsed) && Number.isFinite(parsed)) {
              numericCounts[k] = (numericCounts[k] || 0) + 1;
            }
          }
        }
      });
    }

    const numericas = [];
    const categoricas = [];
    const todas = Object.keys(totalCounts).sort();

    todas.forEach(k => {
      const numRatio = (numericCounts[k] || 0) / (totalCounts[k] || 1);
      if (numRatio >= 0.6) {
        numericas.push(k);
      } else {
        categoricas.push(k);
      }
    });

    return { numericas, categoricas, todas };
  }

  // Paleta semántica por palabras clave para capas IGV (VGI) en modo Color Único coherente
  const COLORES_VGI_SUBTIPO = [
    { match: /(arbol|flora|bosque|humedal|parque|plaza|verde|biodiversidad|hongo|nativa)/i, color: '#16a34a' },
    { match: /(ave|fauna|insecto|mariposa|mamifero|reptil|anfibio|especie|observacion)/i, color: '#d97706' },
    { match: /(escuela|colegio|universidad|jardin_infantil|biblioteca|educacion|museo|conservatorio|capacitacion)/i, color: '#2563eb' },
    { match: /(salud|hospital|clinica|farmacia|cesfam|ambulancia|desfibrilador|veterinaria|posta)/i, color: '#dc2626' },
    { match: /(metro|paradero|bus|bici|ciclovia|calle|cruce|semaforo|ferroviario|estacion|peaje|aerodromo|taxi|movilidad|transporte)/i, color: '#0891b2' },
    { match: /(patrimonio|monumento|iglesia|teatro|cite|arqueologico|cultura|memoria|animita)/i, color: '#b45309' },
    { match: /(comercio|mercado|feria|banco|panaderia|carniceria|restaurante|cafe|hotel|industria)/i, color: '#7c3aed' },
    { match: /(agua|grifo|hidrante|incendio|basurero|punto_limpio|reciclaje|energia|luminaria)/i, color: '#0d9488' }
  ];

  // Tabla experta de simbología predeterminada racional coherente con la naturaleza de cada capa
  const SIMBOLOGIA_EXPERTA = {
    // --- Modo PLANO (conjuntos homogéneos, límites administrativos o indicadores únicos) ---
    censo2024_regional: { modo: 'plano', color: '#475569' },
    establecimientos_salud: { modo: 'plano', color: '#dc2626' },
    red_ferroviaria: { modo: 'plano', color: '#1d4ed8' },
    cmn_sitios_memoria: { modo: 'plano', color: '#7c2d12' },
    minvu_ipt_limite_urbano: { modo: 'plano', color: '#334155' },
    bbdd_08: { modo: 'plano', color: '#0284c7' },
    bbdd_11: { modo: 'plano', color: '#0284c7' },
    bbdd_15: { modo: 'plano', color: '#0f766e' },
    bbdd_20: { modo: 'plano', color: '#be123c' },
    bbdd_24: { modo: 'plano', color: '#9333ea' },
    bbdd_27: { modo: 'plano', color: '#0369a1' },
    bbdd_32: { modo: 'plano', color: '#4f46e5' },
    bbdd_39: { modo: 'plano', color: '#0891b2' },
    bbdd_43: { modo: 'plano', color: '#64748b' },
    bbdd_46: { modo: 'plano', color: '#475569' },
    bbdd_47: { modo: 'plano', color: '#0369a1' },
    bbdd_50: { modo: 'plano', color: '#e11d48' },
    bbdd_54: { modo: 'plano', color: '#ea580c' },
    bbdd_66: { modo: 'plano', color: '#64748b' },
    ccu_rm_2024: { modo: 'plano', color: '#7c3aed' },
    subdere_rsd_sitios_intermedios_transferencia_rm: { modo: 'plano', color: '#b45309' },

    // --- Modo CATEGORIZADO (atributos nominales u ordinales discretos, máx. 9 + Otras) ---
    bomberos: { modo: 'categorizado', columnas: ['TIPO_DE_UN', 'PREFECTURA'], paletaCat: 'set1' },
    carabineros: { modo: 'categorizado', columnas: ['TIPO_DE_UN', 'PREFECTURA'], paletaCat: 'set1' },
    estaciones_metro: { modo: 'categorizado', columnas: ['linea'], paletaCat: 'vibrante' },
    minvu_patrimonio: { modo: 'categorizado', columnas: ['layer', 'EST_CONS', 'CAL_JURID'], paletaCat: 'tierra' },
    minvu_ipt_prc_santiago: { modo: 'categorizado', columnas: ['ZONA', 'NOM'], paletaCat: 'tableau' },
    minvu_ipt_prms_usosuelo: { modo: 'categorizado', columnas: ['UPREF', 'ZONA'], paletaCat: 'armonica' },
    minvu_ipt_areas_verdes: { modo: 'categorizado', columnas: ['TIPO_EP', 'USO'], paletaCat: 'tierra' },
    minvu_ipt_areas_riesgo: { modo: 'categorizado', columnas: ['NOM', 'ZONA', 'NOMBRE'], paletaCat: 'set1' },
    minvu_ipt_resguardo_infraestructura: { modo: 'categorizado', columnas: ['UPREF', 'NOMBRE'], paletaCat: 'set2' },
    ide_minvu_ipt_prms_riesgo: { modo: 'categorizado', columnas: ['NOMBRE', 'NORMA'], paletaCat: 'set1' },
    semaforos_rm_uoct_2026: { modo: 'categorizado', columnas: ['marca_control', 'estado'], paletaCat: 'vibrante' },
    bbdd_01: { modo: 'categorizado', columnas: ['ESTADO', 'ETAPA_MDS'], paletaCat: 'set2' },
    bbdd_02: { modo: 'categorizado', columnas: ['CARPETA', 'CLASIFICAC'], paletaCat: 'tableau' },
    bbdd_03: { modo: 'categorizado', columnas: ['TIPO_ESTAC', 'NOM_CUEN'], paletaCat: 'armonica' },
    bbdd_04: { modo: 'categorizado', columnas: ['TIPOLOGIA', 'ESTADO'], paletaCat: 'set2' },
    bbdd_06: { modo: 'categorizado', columnas: ['MODALIDAD', 'PROGRAMA_E'], paletaCat: 'set2' },
    bbdd_07: { modo: 'categorizado', columnas: ['TIPO_ENTRA', 'CATEGORIA'], paletaCat: 'tableau' },
    bbdd_10: { modo: 'categorizado', columnas: ['MODALIDAD', 'MACRONIVEL'], paletaCat: 'set2' },
    bbdd_14: { modo: 'categorizado', columnas: ['TIPO_INST'], paletaCat: 'armonica' },
    bbdd_17: { modo: 'categorizado', columnas: ['CLAS_OCDE', 'TIPO_COM'], paletaCat: 'tableau' },
    bbdd_19: { modo: 'categorizado', columnas: ['VECINDARIO', 'COM'], paletaCat: 'set2' },
    bbdd_21: { modo: 'categorizado', columnas: ['TIPO'], paletaCat: 'set1' },
    energia_almacenamiento_rm: { modo: 'categorizado', columnas: ['TIPO_EQUIP', 'PROPIEDAD'], paletaCat: 'vibrante' },
    energia_gasoducto_rm: { modo: 'categorizado', columnas: ['PROPIEDAD'], paletaCat: 'set1' },
    energia_lineas_transmision_rm: { modo: 'categorizado', columnas: ['TENSION_KV', 'PROPIEDAD'], paletaCat: 'vibrante' },
    energia_oleoducto_rm: { modo: 'categorizado', columnas: ['COMBUSTIBL', 'PROPIEDAD'], paletaCat: 'set1' },
    energia_termoelectricas_rm: { modo: 'categorizado', columnas: ['COMBUSTIBL', 'ESTADO'], paletaCat: 'set1' },
    bbdd_23: { modo: 'categorizado', columnas: ['DESIG'], paletaCat: 'tierra' },
    bbdd_25: { modo: 'categorizado', columnas: ['NOM_CUEN', 'NOM_SUBC'], paletaCat: 'tableau' },
    bbdd_26: { modo: 'categorizado', columnas: ['NOM_CUEN', 'NOM_SUBC'], paletaCat: 'tableau' },
    bbdd_29: { modo: 'categorizado', columnas: ['NOM_CUEN'], paletaCat: 'armonica' },
    bbdd_30: { modo: 'categorizado', columnas: ['CATEGORIA'], paletaCat: 'vibrante' },
    bbdd_31: { modo: 'categorizado', columnas: ['ETAPA', 'CARTERA'], paletaCat: 'set2' },
    bbdd_33: { modo: 'categorizado', columnas: ['PREFECTURA', 'CUA_TIPO'], paletaCat: 'tableau' },
    bbdd_34: { modo: 'categorizado', columnas: ['KOPPEN_FIN', 'DENOMINACI'], paletaCat: 'tierra' },
    bbdd_35: { modo: 'categorizado', columnas: ['TECNOLOGIA', 'ALIAS', 'TISO_DESCR'], paletaCat: 'vibrante' },
    bbdd_37: { modo: 'categorizado', columnas: ['CARPETA', 'TIPO'], paletaCat: 'tableau' },
    bbdd_38: { modo: 'categorizado', columnas: ['NOM_SS'], paletaCat: 'paired' },
    bbdd_40: { modo: 'categorizado', columnas: ['Circuito'], paletaCat: 'vibrante' },
    ccu_rm_1993: { modo: 'categorizado', columnas: ['PESO_ADMIN', 'TIPO'], paletaCat: 'set2' },
    ccu_rm_2002: { modo: 'categorizado', columnas: ['PESO_ADMIN', 'TIPO'], paletaCat: 'set2' },
    ccu_rm_2006: { modo: 'categorizado', columnas: ['PESO_ADMIN', 'TIPO'], paletaCat: 'set2' },
    ccu_rm_2011: { modo: 'categorizado', columnas: ['PESO_ADMIN', 'TIPO'], paletaCat: 'set2' },
    ccu_rm_2018: { modo: 'categorizado', columnas: ['PESO_ADMIN', 'TIPO'], paletaCat: 'set2' },
    ccu_rm_2019: { modo: 'categorizado', columnas: ['PESO_ADMIN', 'TIPO'], paletaCat: 'set2' },
    ccu_rm_2020: { modo: 'categorizado', columnas: ['PESO_ADMIN', 'TIPO'], paletaCat: 'set2' },
    ccu_rm_2021: { modo: 'categorizado', columnas: ['PESO_ADMIN', 'TIPO'], paletaCat: 'set2' },
    ccu_rm_2022: { modo: 'categorizado', columnas: ['PESO_ADMIN', 'TIPO'], paletaCat: 'set2' },
    ccu_rm_2023: { modo: 'categorizado', columnas: ['PESO_ADMIN', 'TIPO'], paletaCat: 'set2' },
    bbdd_42: { modo: 'categorizado', columnas: ['formacion'], paletaCat: 'tierra' },
    bbdd_44: { modo: 'categorizado', columnas: ['scam'], paletaCat: 'armonica' },
    bbdd_48: { modo: 'categorizado', columnas: ['habilitacn', 'complejo'], paletaCat: 'set1' },
    bbdd_49: { modo: 'categorizado', columnas: ['NOM_CUEN', 'NOM_SUBC'], paletaCat: 'tableau' },
    bbdd_51: { modo: 'categorizado', columnas: ['tipo_consu', 'urba_rural'], paletaCat: 'set2' },
    bbdd_52: { modo: 'categorizado', columnas: ['institucio'], paletaCat: 'vibrante' },
    bbdd_53: { modo: 'categorizado', columnas: ['industria', 'movilidad'], paletaCat: 'tierra' },
    bbdd_55: { modo: 'categorizado', columnas: ['Categoria'], paletaCat: 'tierra' },
    bbdd_59: { modo: 'categorizado', columnas: ['oua_tipo', 'f_trazado'], paletaCat: 'set2' },
    bbdd_60: { modo: 'categorizado', columnas: ['uso', 'uso_tierra'], paletaCat: 'tierra' },
    bbdd_62: { modo: 'categorizado', columnas: ['ESPECIE'], paletaCat: 'tierra' },
    bbdd_64: { modo: 'categorizado', columnas: ['c_ig_com', 'c_ig_reg'], paletaCat: 'tierra' },
    ine_permisos_edificacion_santiago: { modo: 'categorizado', columnas: ['USO_DESTINO', 'GLOSA_DESTINO'], paletaCat: 'tableau' },
    munistgo_aseo_zonas_residuos_2026: { modo: 'categorizado', columnas: ['zona_aseo'], paletaCat: 'vibrante' },
    barrios_santiago_con_zonas_aseo: { modo: 'categorizado', columnas: ['zona_aseo', 'AGRP'], paletaCat: 'vibrante' },
    subdere_rsd_ciudades_poblacion_rm: { modo: 'categorizado', columnas: ['TIPO', 'CATEGORIA'], paletaCat: 'set2' },
    subdere_rsd_criticidad_sitios_disposicion_rm: { modo: 'categorizado', columnas: ['Criticidad', 'Clase'], paletaCat: 'set1' },
    subdere_rsd_recoleccion_transporte_operativo_rm: { modo: 'categorizado', columnas: ['ModRecoleccion', 'SistRecoleccion'], paletaCat: 'tableau' },
    subdere_rsd_sdf_comunas_destino_rm: { modo: 'categorizado', columnas: ['SITIO', 'Clase'], paletaCat: 'tableau' },
    subdere_rsd_sdf_municipios_puntos_rm: { modo: 'categorizado', columnas: ['SITIO', 'Clase'], paletaCat: 'tableau' },
    subdere_rsd_sitios_disposicion_instalaciones_rm: { modo: 'categorizado', columnas: ['Clase', 'Estado'], paletaCat: 'set1' },

    // --- Modo GRADUADO con método estadístico coherente con la distribución del dato ---
    censo2024_localidades: { modo: 'graduado', columnas: ['n_per'], metodoCuant: 'jenks', numClases: 5, rampa: 'viridis' },
    censo2024_zonal: { modo: 'graduado', columnas: ['n_per'], metodoCuant: 'jenks', numClases: 5, rampa: 'viridis' },
    censo2024_manzanas: { modo: 'graduado', columnas: ['n_per'], metodoCuant: 'jenks', numClases: 5, rampa: 'viridis' },
    censo2024_limite_urbano: { modo: 'graduado', columnas: ['n_per'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'viridis' },
    ccu_rm_2017: { modo: 'graduado', columnas: ['PERS_HA', 'PERS'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'viridis' },
    educacion_parvularia: { modo: 'graduado', columnas: ['N_TOTAL'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'blues' },
    bbdd_12: { modo: 'graduado', columnas: ['MAT_TOTAL'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'blues' },
    bbdd_13: { modo: 'graduado', columnas: ['N_TOTAL'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'blues' },
    ide_minvu_campamentos: { modo: 'graduado', columnas: ['N_HOG', 'HECTAREAS'], metodoCuant: 'jenks', numClases: 5, rampa: 'ylorrd' },
    bbdd_65: { modo: 'graduado', columnas: ['EBI_COSTO_TOTAL'], metodoCuant: 'jenks', numClases: 5, rampa: 'ylorrd' },
    catastro_predial_sii: { modo: 'graduado', columnas: ['avaluo_fiscal', 'sup_construida_m2'], metodoCuant: 'jenks', numClases: 5, rampa: 'ylorrd' },
    energia_hidroelectricas_rm: { modo: 'graduado', columnas: ['POTENCIAMW'], metodoCuant: 'jenks', numClases: 5, rampa: 'blues' },
    energia_solares_rm: { modo: 'graduado', columnas: ['POTENCIAMW'], metodoCuant: 'jenks', numClases: 5, rampa: 'ylorrd' },
    energia_bioenergia_rm: { modo: 'graduado', columnas: ['POTENCIAMW'], metodoCuant: 'pretty', numClases: 4, rampa: 'greens' },
    energia_electrolineras_rm: { modo: 'graduado', columnas: ['Potencia_k'], metodoCuant: 'pretty', numClases: 5, rampa: 'plasma' },
    bbdd_05: { modo: 'graduado', columnas: ['AVANCE_FIS'], metodoCuant: 'iguales', numClases: 5, rampa: 'greens' },
    ine_crf_conjuntos_santiago: { modo: 'graduado', columnas: ['coeficiente_ocupacion_suelo_cos', 'densidad_neta_real_viv_ha'], metodoCuant: 'iguales', numClases: 5, rampa: 'ylorrd' },
    bbdd_63: { modo: 'graduado', columnas: ['BIOMASA'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'greens' },
    bbdd_67: { modo: 'graduado', columnas: ['total de personas con dependencia moderada o postradas - uv', 'total de personas postradas - uv'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'magma' },
    bbdd_68: { modo: 'graduado', columnas: ['total de personas en tramo 0% - 40% - uv', 'total de personas - uv'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'ylorrd' },
    bbdd_69: { modo: 'graduado', columnas: ['total - uv'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'blues' },
    bbdd_70: { modo: 'graduado', columnas: ['total - uv'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'purples' },
    bbdd_71: { modo: 'graduado', columnas: ['total - uv'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'viridis' },
    bbdd_72: { modo: 'graduado', columnas: ['total - uv'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'blues' },
    bbdd_73: { modo: 'graduado', columnas: ['total - uv'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'viridis' },
    bbdd_74: { modo: 'graduado', columnas: ['número de ocupados - uv', 'número de ocupados dependientes - uv'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'greens' },
    subdere_rsd_analisis_costos_comuna_rm: { modo: 'graduado', columnas: ['Aseo_Hab', 'Aseo_Ton'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'ylorrd' },
    subdere_rsd_ppc_generacion_pta_rm: { modo: 'graduado', columnas: ['Ppc_corr', 'Ppc'], metodoCuant: 'cuartiles', numClases: 5, rampa: 'ylorrd' },
    subdere_rsd_poblacion_atendida_pta_puntos_rm: { modo: 'graduado', columnas: ['PCA_PTA', 'PCA_Pob'], metodoCuant: 'iguales', numClases: 5, rampa: 'blues' },
    subdere_rsd_poblacion_comunal_pta_poligonos_rm: { modo: 'graduado', columnas: ['PCA_PTA', 'PCA_Pob'], metodoCuant: 'iguales', numClases: 5, rampa: 'blues' },
    subdere_rsd_gastos_ingresos_sinim_rm: { modo: 'graduado', columnas: ['Por_Aseo', 'PorDAseo'], metodoCuant: 'iguales', numClases: 5, rampa: 'purples' },
    subdere_rsd_distancia_municipio_sdf_rm: { modo: 'graduado', columnas: ['Km'], metodoCuant: 'iguales', numClases: 5, rampa: 'oranges' }
  };

  function columnaTieneVariacionNumerica(features, col, minDistintos = 3) {
    if (!col || !features || features.length === 0) return false;
    const unicos = new Set();
    const total = features.length;
    const step = Math.max(1, Math.floor(total / 400));
    for (let i = 0; i < total; i += step) {
      const raw = features[i]?.properties?.[col];
      if (raw !== undefined && raw !== null && raw !== '') {
        const num = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
        if (Number.isFinite(num)) {
          unicos.add(num);
          if (unicos.size >= minDistintos) return true;
        }
      }
    }
    return false;
  }

  function columnaTieneVariacionCategorica(features, col, minDistintos = 2) {
    if (!col || !features || features.length === 0) return false;
    const unicos = new Set();
    let noNulos = 0;
    const total = features.length;
    const step = Math.max(1, Math.floor(total / 400));
    for (let i = 0; i < total; i += step) {
      const val = normalizarValorCategorico(features[i]?.properties?.[col]);
      if (val !== '(Sin dato)') {
        noNulos++;
        unicos.add(val);
        if (unicos.size >= minDistintos && noNulos >= minDistintos) return true;
      }
    }
    return false;
  }

  function deducirColorSemanticoVGI(idCapa, opciones = {}) {
    const idStr = String(idCapa || '').toLowerCase();
    for (const regla of COLORES_VGI_SUBTIPO) {
      if (regla.match.test(idStr)) return regla.color;
    }
    return opciones.color || COLORES_CATEGORIA[idCapa] || '#0891b2';
  }

  function resolverNombreColumnaCandidata(colsTodas, candidatas) {
    if (!Array.isArray(candidatas)) return null;
    for (const c of candidatas) {
      if (colsTodas.includes(c)) return c;
      const ins = colsTodas.find(x => x.toLowerCase() === String(c).toLowerCase());
      if (ins) return ins;
    }
    return null;
  }

  /**
   * Determina de manera racional y verificable la simbología predeterminada
   * según la regla experta de la capa y la distribución real de sus datos.
   */
  function determinarSimbologiaPredeterminada(idCapa, geojson, opciones = {}) {
    const cols = inspeccionarColumnasGeoJSON(geojson);
    const features = (geojson && Array.isArray(geojson.features)) ? geojson.features : [];
    const idStr = String(idCapa || '').toLowerCase();

    // Deducir dimensión territorial para rampas de respaldo coherentes
    let dimension = opciones.dimension;
    if (!dimension && typeof window !== 'undefined' && Array.isArray(window.CATALOGO_VGI_DESCENTRALIZADO)) {
      const vgi = window.CATALOGO_VGI_DESCENTRALIZADO.find(c => c.id === idCapa);
      if (vgi && vgi.dimension) dimension = vgi.dimension;
    }
    if (!dimension && typeof window !== 'undefined' && window.ModuloIndicadoresAnalisis?.DIMENSIONES) {
      for (const d of window.ModuloIndicadoresAnalisis.DIMENSIONES) {
        if (d.capasIds && d.capasIds.includes(idCapa)) {
          dimension = d.id;
          break;
        }
      }
    }
    if (!dimension) {
      if (idStr.includes('censo') || idStr.includes('poblacion') || idStr.includes('rsh')) dimension = 'sociodemografica';
      else if (idStr.includes('comercio') || idStr.includes('inversion') || idStr.includes('predial') || idStr.includes('bip')) dimension = 'socioeconomica';
      else if (idStr.includes('arbol') || idStr.includes('verde') || idStr.includes('residuo') || idStr.includes('rsd') || idStr.includes('gbif') || idStr.includes('flora') || idStr.includes('fauna')) dimension = 'socioambiental';
      else if (idStr.includes('salud') || idStr.includes('farmacia') || idStr.includes('hospital') || idStr.includes('cesfam')) dimension = 'sociosanitaria';
      else dimension = 'sociourbana';
    }

    const RAMPAS_DIMENSION = {
      sociodemografica: 'viridis',
      socioeconomica: 'ylorrd',
      socioambiental: 'greens',
      sociosanitaria: 'magma',
      sociourbana: 'blues'
    };
    const rampaPredeterminada = RAMPAS_DIMENSION[dimension] || 'viridis';

    // Capas vacías o unitarias -> Color único (Plano)
    if (features.length <= 1) {
      const reglaUnica = SIMBOLOGIA_EXPERTA[idCapa] || {};
      return {
        modo: 'plano',
        colorPlano: reglaUnica.color || (idStr.startsWith('vgi_') ? deducirColorSemanticoVGI(idCapa, opciones) : (opciones.color || COLORES_CATEGORIA[idCapa] || '#35586B')),
        columna: cols.numericas[0] || cols.categoricas[0] || null,
        metodoCuant: 'cuartiles',
        numClases: 5,
        rampa: rampaPredeterminada,
        orden: 'normal',
        paletaCat: 'armonica'
      };
    }

    // 1. Capas IGV / VGI descentralizadas: entidades homogéneas en Color Único semántico
    if (idStr.startsWith('vgi_')) {
      return {
        modo: 'plano',
        colorPlano: deducirColorSemanticoVGI(idCapa, opciones),
        columna: cols.categoricas[0] || cols.numericas[0] || null,
        metodoCuant: 'cuartiles',
        numClases: 5,
        rampa: rampaPredeterminada,
        orden: 'normal',
        paletaCat: 'armonica'
      };
    }

    // 2. Regla experta verificada contra los atributos realmente presentes en el GeoJSON
    const regla = SIMBOLOGIA_EXPERTA[idCapa];
    if (regla) {
      if (regla.modo === 'plano') {
        return {
          modo: 'plano',
          colorPlano: regla.color || opciones.color || COLORES_CATEGORIA[idCapa] || '#35586B',
          columna: cols.categoricas[0] || cols.numericas[0] || null,
          metodoCuant: 'cuartiles',
          numClases: 5,
          rampa: rampaPredeterminada,
          orden: 'normal',
          paletaCat: 'armonica'
        };
      }

      if (regla.modo === 'graduado') {
        const colElegida = resolverNombreColumnaCandidata(cols.todas, regla.columnas);
        if (colElegida && columnaTieneVariacionNumerica(features, colElegida, 3)) {
          return {
            modo: 'graduado',
            columna: colElegida,
            metodoCuant: regla.metodoCuant || 'cuartiles',
            numClases: regla.numClases || 5,
            rampa: regla.rampa || rampaPredeterminada,
            orden: regla.orden || 'normal',
            paletaCat: 'armonica'
          };
        }
      }

      if (regla.modo === 'categorizado') {
        const colElegida = resolverNombreColumnaCandidata(cols.todas, regla.columnas);
        if (colElegida && columnaTieneVariacionCategorica(features, colElegida, 2)) {
          return {
            modo: 'categorizado',
            columna: colElegida,
            metodoCuant: 'cuartiles',
            numClases: 5,
            rampa: rampaPredeterminada,
            orden: regla.orden || 'normal',
            paletaCat: regla.paletaCat || 'armonica'
          };
        }
      }
    }

    // 3. Respaldo racional automático para capas externas / personalizadas del usuario
    const COLUMNAS_EXCLUIDAS_HEURISTICA = new Set([
      'superficie_m2', 'superficie_ha', 'point_x', 'point_y', 'latitud', 'longitud',
      'lat', 'lon', 'x', 'y', 'utm_este', 'utm_norte', 'este_84', 'norte_84',
      'x_coor', 'y_coor', 'coord_x', 'coord_y', 'coord_este', 'coord_nort',
      'ano', 'año', 'agno', 'mes', 'dia', 'numero', 'folio', 'ruc', 'rol', 'rbd'
    ]);

    const PATRONES_TASAS_IGUALES = /^(tasa|pct|porcentaje|por_|cob_|avance|cos|indice|igvust|km)/i;
    const PATRONES_TOTALES_JENKS = /^(n_per|personas|poblacion|habitantes|monto|inversion|costo|avaluo|ebi_costo|potenciamw|n_hog|hogares|viviendas)/i;
    const PATRONES_ORDINAL_CUARTIL = /^(n_total|mat_total|biomasa|capacidad|superficie|densidad|area|total)/i;

    const numericasValidas = cols.numericas.filter(c => {
      const kl = c.toLowerCase();
      if (esColumnaTecnica(c) || COLUMNAS_EXCLUIDAS_HEURISTICA.has(kl)) return false;
      return columnaTieneVariacionNumerica(features, c, 3);
    });

    const mejorTasa = numericasValidas.find(c => PATRONES_TASAS_IGUALES.test(c));
    if (mejorTasa) {
      return {
        modo: 'graduado', columna: mejorTasa, metodoCuant: 'iguales',
        numClases: 5, rampa: rampaPredeterminada, orden: 'normal', paletaCat: 'armonica'
      };
    }

    const mejorTotal = numericasValidas.find(c => PATRONES_TOTALES_JENKS.test(c));
    if (mejorTotal) {
      return {
        modo: 'graduado', columna: mejorTotal, metodoCuant: 'jenks',
        numClases: 5, rampa: rampaPredeterminada, orden: 'normal', paletaCat: 'armonica'
      };
    }

    const mejorCuartil = numericasValidas.find(c => PATRONES_ORDINAL_CUARTIL.test(c));
    if (mejorCuartil) {
      return {
        modo: 'graduado', columna: mejorCuartil, metodoCuant: 'cuartiles',
        numClases: 5, rampa: rampaPredeterminada, orden: 'normal', paletaCat: 'armonica'
      };
    }

    const PATRONES_CAT = /^(subtipo|tipo_ep|tipo|tipologia|zona|zona_aseo|uso|categoria|clase|estado|etapa|linea|especie|formacion|scam|modalidad)$/i;
    const categoricasValidas = cols.categoricas.filter(c => !esColumnaTecnica(c) && columnaTieneVariacionCategorica(features, c, 2));
    const mejorCat = categoricasValidas.find(c => PATRONES_CAT.test(c)) || categoricasValidas[0];
    if (mejorCat) {
      return {
        modo: 'categorizado', columna: mejorCat, metodoCuant: 'cuartiles',
        numClases: 5, rampa: rampaPredeterminada, orden: 'normal', paletaCat: 'armonica'
      };
    }

    if (numericasValidas.length > 0) {
      return {
        modo: 'graduado', columna: numericasValidas[0], metodoCuant: 'cuartiles',
        numClases: 5, rampa: rampaPredeterminada, orden: 'normal', paletaCat: 'armonica'
      };
    }

    // Último recurso racional: si ningún atributo varía de forma útil, Color Único
    return {
      modo: 'plano',
      colorPlano: opciones.color || COLORES_CATEGORIA[idCapa] || '#35586B',
      columna: cols.todas[0] || null,
      metodoCuant: 'cuartiles',
      numClases: 5,
      rampa: rampaPredeterminada,
      orden: 'normal',
      paletaCat: 'armonica'
    };
  }

  function normalizarValorCategorico(raw) {
    if (raw === undefined || raw === null) return '(Sin dato)';
    const s = String(raw).trim();
    if (!s) return '(Sin dato)';
    const sl = s.toLowerCase();
    if (
      sl === 'sin dato' || sl === 'sin datos' || sl === 'sin informacion' || sl === 'sin información' ||
      sl === 'nan' || sl === 'null' || sl === 'undefined' || sl === 's/i' || sl === 's_i' ||
      sl === 'n/a' || sl === 'no aplica' || sl === 'no especificado' || sl === '-'
    ) {
      return '(Sin dato)';
    }
    return s;
  }

  function calcularClasificacionCapa(reg) {
    if (!reg || !reg.geojson || !Array.isArray(reg.geojson.features)) return null;
    const cfg = reg.config || {};
    const features = reg.geojson.features;

    if (cfg.modo === 'plano' || !cfg.modo) {
      const colorPlano = cfg.colorPlano || reg.opciones?.color || COLORES_CATEGORIA[reg.idCapa] || '#35586B';
      return {
        modo: 'plano',
        colorPlano,
        totalValidos: features.length,
        itemsLeyenda: [
          { color: colorPlano, label: 'Entidades (Color Único)', conteo: features.length }
        ]
      };
    }

    if (cfg.modo === 'categorizado') {
      const col = cfg.columna || 'subtipo';
      const conteos = {};
      let validos = 0;

      for (let i = 0; i < features.length; i++) {
        const props = features[i]?.properties || {};
        const val = normalizarValorCategorico(props[col]);
        conteos[val] = (conteos[val] || 0) + 1;
        validos++;
      }

      const categoriasSinDato = conteos['(Sin dato)'] || 0;
      const categoriasReales = Object.keys(conteos)
        .filter(k => k !== '(Sin dato)')
        .sort((a, b) => conteos[b] - conteos[a]);

      const esInvertido = cfg.orden === 'invertido';
      let paleta = PALETAS_CATEGORICAS[cfg.paletaCat] || PALETAS_CATEGORICAS.armonica;
      if (esInvertido) {
        paleta = [...paleta].reverse();
      }

      const MAX_CLASES_CAT = 9;
      const topReales = categoriasReales.slice(0, MAX_CLASES_CAT);
      const restantesReales = categoriasReales.slice(MAX_CLASES_CAT);

      const asignacion = {};
      const itemsLeyenda = [];

      topReales.forEach((cat, idx) => {
        const color = paleta[idx % paleta.length];
        asignacion[cat] = color;
        itemsLeyenda.push({
          color,
          label: cat,
          conteo: conteos[cat]
        });
      });

      if (restantesReales.length > 0) {
        const colorOtras = '#64748b';
        let conteoOtras = 0;
        restantesReales.forEach(cat => {
          asignacion[cat] = colorOtras;
          conteoOtras += conteos[cat];
        });
        itemsLeyenda.push({
          color: colorOtras,
          label: `Otras categorías (${restantesReales.length})`,
          conteo: conteoOtras
        });
      }

      if (categoriasSinDato > 0) {
        const colorSinDato = '#cbd5e1';
        asignacion['(Sin dato)'] = colorSinDato;
        itemsLeyenda.push({
          color: colorSinDato,
          label: 'Sin dato',
          conteo: categoriasSinDato
        });
      }

      return {
        modo: 'categorizado',
        columna: col,
        asignacion,
        totalValidos: validos,
        itemsLeyenda
      };
    }

    if (cfg.modo === 'graduado') {
      const col = cfg.columna || 'superficie_m2';
      const numClases = Number(cfg.numClases) || 5;
      const metodo = cfg.metodoCuant || 'cuartiles';
      const rampaKey = cfg.rampa || 'ylorrd';

      const valoresValidos = [];
      for (let i = 0; i < features.length; i++) {
        const props = features[i]?.properties || {};
        const raw = props[col];
        if (raw !== undefined && raw !== null && raw !== '') {
          const num = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
          if (Number.isFinite(num)) valoresValidos.push(num);
        }
      }

      if (valoresValidos.length === 0) {
        return {
          modo: 'graduado',
          columna: col,
          metodo,
          breaks: [0, 1],
          colores: ['#94a3b8'],
          totalValidos: 0,
          itemsLeyenda: [{ color: '#94a3b8', label: 'Sin datos numéricos en esta columna', conteo: 0 }]
        };
      }

      let breaks = [];
      if (metodo === 'pretty') {
        breaks = calcularPrettyBreaks(valoresValidos, numClases);
      } else if (metodo === 'cuartiles') {
        breaks = calcularCuantiles(valoresValidos, numClases);
      } else if (metodo === 'iguales') {
        breaks = calcularIntervalosIguales(valoresValidos, numClases);
      } else if (metodo === 'jenks') {
        breaks = calcularJenks(valoresValidos, numClases);
      } else if (metodo === 'desviacion') {
        breaks = calcularDesviacionEstandar(valoresValidos);
      } else {
        breaks = calcularCuantiles(valoresValidos, numClases);
      }

      const numIntervalos = Math.max(1, breaks.length - 1);
      const esInvertido = cfg.orden === 'invertido';
      const colores = interpolarRampa(rampaKey, numIntervalos, esInvertido);

      const conteosPorClase = new Array(numIntervalos).fill(0);
      for (let fIdx = 0; fIdx < features.length; fIdx++) {
        const props = features[fIdx]?.properties || {};
        const raw = props[col];
        if (raw !== undefined && raw !== null && raw !== '') {
          const v = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
          if (Number.isFinite(v)) {
            let idx = 0;
            if (numIntervalos === 1 || v <= breaks[1]) {
              idx = 0;
            } else if (v >= breaks[breaks.length - 1]) {
              idx = numIntervalos - 1;
            } else {
              idx = numIntervalos - 1;
              for (let i = 1; i < breaks.length - 1; i++) {
                if (v <= breaks[i + 1]) {
                  idx = i;
                  break;
                }
              }
            }
            conteosPorClase[idx]++;
          }
        }
      }

      const itemsLeyenda = [];
      for (let i = 0; i < numIntervalos; i++) {
        let label = '';
        if (numIntervalos === 1) {
          label = `Todo el rango (${formatearNumeroLegible(breaks[0])} – ${formatearNumeroLegible(breaks[1])})`;
        } else if (i === 0) {
          label = `≤ ${formatearNumeroLegible(breaks[1])}`;
        } else if (i === numIntervalos - 1) {
          label = `> ${formatearNumeroLegible(breaks[i])}`;
        } else {
          label = `${formatearNumeroLegible(breaks[i])} – ${formatearNumeroLegible(breaks[i + 1])}`;
        }
        itemsLeyenda.push({
          color: colores[i],
          label,
          conteo: conteosPorClase[i]
        });
      }

      return {
        modo: 'graduado',
        columna: col,
        metodo,
        breaks,
        colores,
        totalValidos: valoresValidos.length,
        itemsLeyenda
      };
    }

    return null;
  }

  /**
   * Resuelve el color para una feature evaluando la clasificación activa de la capa
   */
  function resolverColorFeature(feature, idCapa, colorBasePorDefecto) {
    const reg = registroCapasTematicas[idCapa];
    if (!reg || !reg.config) {
      return colorBasePorDefecto || '#35586B';
    }

    const cfg = reg.config;
    const props = feature.properties || {};

    if (cfg.modo === 'plano') {
      return reg.clasificacion?.colorPlano || cfg.colorPlano || colorBasePorDefecto || '#35586B';
    }

    if (cfg.modo === 'categorizado') {
      const col = cfg.columna || 'subtipo';
      const val = normalizarValorCategorico(props[col]);
      const asignacion = reg.clasificacion?.asignacion;
      if (asignacion && Object.prototype.hasOwnProperty.call(asignacion, val)) {
        return asignacion[val];
      }
      return val === '(Sin dato)' ? '#cbd5e1' : '#64748b';
    }

    if (cfg.modo === 'graduado') {
      const col = cfg.columna || 'superficie_m2';
      const raw = props[col];
      if (raw === undefined || raw === null || raw === '') return '#94a3b8';
      const v = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
      if (!Number.isFinite(v)) return '#94a3b8';

      const clasif = reg.clasificacion;
      if (!clasif || !clasif.breaks || !clasif.colores) return colorBasePorDefecto || '#35586B';

      const breaks = clasif.breaks;
      const colores = clasif.colores;
      const numInt = colores.length;

      if (numInt <= 1) return colores[0] || '#35586B';
      if (v <= breaks[1]) return colores[0];
      if (v >= breaks[breaks.length - 1]) return colores[numInt - 1];

      for (let i = 1; i < breaks.length - 1; i++) {
        if (v <= breaks[i + 1]) {
          return colores[i];
        }
      }
      return colores[numInt - 1];
    }

    return colorBasePorDefecto || '#35586B';
  }

  function aplicarSimbologiaACapa(idCapa, nuevaConfig = {}) {
    const reg = registroCapasTematicas[idCapa];
    if (!reg || !reg.capaLeaflet) return;

    reg.config = { ...reg.config, ...nuevaConfig };
    reg.clasificacion = calcularClasificacionCapa(reg);

    // Actualizar cada entidad en el mapa de Leaflet
    reg.capaLeaflet.eachLayer(sublayer => {
      const feat = sublayer.feature;
      if (!feat) return;
      const nuevoColor = resolverColorFeature(feat, idCapa, reg.opciones?.color);
      sublayer._atlasColor = nuevoColor;

      if (typeof sublayer.setStyle === 'function') {
        const gt = feat.geometry?.type;
        if (gt === 'LineString' || gt === 'MultiLineString') {
          sublayer.setStyle({ color: nuevoColor, opacity: 0.9, weight: 3.5 });
        } else if (gt === 'Point' || gt === 'MultiPoint') {
          sublayer.setStyle({ fillColor: nuevoColor, color: '#1a1f18', fillOpacity: 0.9, weight: 1.5 });
        } else {
          sublayer.setStyle({ fillColor: nuevoColor, color: '#1a1f18', fillOpacity: 0.55, weight: 1.2 });
        }
      }
    });

    actualizarLeyendaPreview(reg);
    actualizarBadgeHeaderSimbologia(reg);
    actualizarLeyendaCartograficaVisor(reg);
  }

  function actualizarBadgeHeaderSimbologia(reg) {
    const badge = document.getElementById('badge-simbologia-capa-activa');
    if (!badge) return;
    if (!reg) {
      badge.textContent = 'Sin capas activas';
      badge.style.color = '#94a3b8';
      badge.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      return;
    }
    const nombre = reg.opciones?.nombre || reg.idCapa.toUpperCase();
    const modoNom = {
      graduado: 'Graduado',
      categorizado: 'Categorizado',
      plano: 'Color Único'
    }[reg.config.modo] || 'Color Único';
    const sufijo = reg.config.modo === 'plano' ? 'entidades' : (reg.config.columna || 'general');
    badge.textContent = `${nombre} (${modoNom}: ${sufijo})`;
    badge.style.color = '#38bdf8';
    badge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
  }

  function actualizarLeyendaPreview(reg) {
    const contenedor = document.getElementById('simbologia-muestras-clases');
    const badgeConteo = document.getElementById('conteo-preview-entidades');
    if (!contenedor) return;

    if (!reg || !reg.clasificacion) {
      contenedor.innerHTML = '<span class="placeholder-simbologia">Selecciona o carga una capa para visualizar sus clases y rangos.</span>';
      if (badgeConteo) badgeConteo.textContent = '0 entidades';
      return;
    }

    const clasif = reg.clasificacion;
    if (badgeConteo) {
      badgeConteo.textContent = `${Number(clasif.totalValidos || 0).toLocaleString('es-CL')} entidades evaluadas`;
    }

    if (!clasif.itemsLeyenda || clasif.itemsLeyenda.length === 0) {
      contenedor.innerHTML = '<span class="placeholder-simbologia">Sin clases definidas.</span>';
      return;
    }

    contenedor.innerHTML = clasif.itemsLeyenda.map(item => {
      const lbl = escaparHTML(item.label);
      return `
      <div class="item-clase-simbologia" title="${lbl} · ${item.conteo} entidades">
        <span class="swatch-color-clase" style="background-color: ${item.color};"></span>
        <span class="label-rango-clase">${lbl}</span>
        <span class="conteo-rango-clase">(${Number(item.conteo || 0).toLocaleString('es-CL')})</span>
      </div>
    `;
    }).join('');
  }

  /**
   * Actualiza y sincroniza la leyenda cartográfica flotante directamente sobre el visor.
   * Se muestra cuando el panel de configuración de simbología está plegado (escondido)
   * para permitir interpretar los colores y clases temáticas en pantalla completa.
   */
  function actualizarLeyendaCartograficaVisor(regForzado = null) {
    const elLeyenda = document.getElementById('leyenda-cartografica-visor');
    if (!elLeyenda) return;

    const panelSimbologia = document.getElementById('panel-simbologia-dinamica');
    const estaColapsado = !panelSimbologia || panelSimbologia.classList.contains('colapsado');

    // Solo se visualiza sobre el visor cuando el editor superior está plegado y no se ha cerrado manualmente
    if (!estaColapsado || leyendaVisorCerradaManualmente) {
      elLeyenda.style.display = 'none';
      return;
    }

    let reg = regForzado;
    if (!reg && capaActivaSimbologiaId) {
      reg = registroCapasTematicas[capaActivaSimbologiaId];
    }
    if (!reg) {
      const ids = Object.keys(registroCapasTematicas);
      if (ids.length > 0) {
        reg = registroCapasTematicas[ids[ids.length - 1]];
      }
    }

    if (!reg || !reg.clasificacion || !reg.clasificacion.itemsLeyenda || reg.clasificacion.itemsLeyenda.length === 0) {
      elLeyenda.style.display = 'none';
      return;
    }

    const clasif = reg.clasificacion;
    const cfg = reg.config || {};
    const nombreCapa = reg.opciones?.nombre || reg.idCapa.toUpperCase();

    let modoDesc = '';
    if (cfg.modo === 'graduado') {
      const nombresMetodo = {
        pretty: 'Pretty Breaks',
        cuartiles: 'Cuartiles',
        iguales: 'Intervalos Iguales',
        jenks: 'Jenks',
        desviacion: 'Desv. Estándar'
      };
      const met = nombresMetodo[cfg.metodoCuant] || 'Graduado';
      const ordenTxt = cfg.orden === 'invertido' ? ' (Invertido)' : '';
      modoDesc = `Graduado (${met}${ordenTxt}) · ${cfg.columna || 'general'}`;
    } else if (cfg.modo === 'categorizado') {
      const ordenTxt = cfg.orden === 'invertido' ? ' (Invertido)' : '';
      modoDesc = `Categorizado${ordenTxt} · ${cfg.columna || 'general'}`;
    } else {
      modoDesc = 'Color Único (Entidades)';
    }

    const elTitulo = document.getElementById('titulo-leyenda-cartografica-capa');
    const elMetodo = document.getElementById('metodo-leyenda-cartografica');
    const elItems = document.getElementById('items-leyenda-cartografica');
    const elConteo = document.getElementById('conteo-leyenda-cartografica');

    if (elTitulo) elTitulo.textContent = nombreCapa;
    if (elMetodo) elMetodo.textContent = modoDesc;

    if (elItems) {
      elItems.innerHTML = clasif.itemsLeyenda.map(item => {
        const lbl = escaparHTML(item.label);
        return `
        <div class="item-clase-cartografica" title="${lbl} (${Number(item.conteo || 0).toLocaleString('es-CL')} entidades)">
          <span class="swatch-cartografico" style="background-color: ${item.color};"></span>
          <span class="label-clase-cartografica">${lbl}</span>
          <span class="conteo-clase-cartografica">${Number(item.conteo || 0).toLocaleString('es-CL')}</span>
        </div>
      `;
      }).join('');
    }

    if (elConteo) {
      const total = clasif.totalValidos || 0;
      elConteo.textContent = `${Number(total).toLocaleString('es-CL')} entidades simbolizadas`;
    }

    elLeyenda.style.display = 'flex';
  }

  function sincronizarSelectorCapasSimbologia(idCapaForzada = null) {
    const selectCapa = document.getElementById('select-simbologia-capa');
    if (!selectCapa) return;

    const idsActivos = Object.keys(registroCapasTematicas);
    if (idsActivos.length === 0) {
      selectCapa.innerHTML = '<option value="">(Sin capas temáticas activas)</option>';
      capaActivaSimbologiaId = null;
      actualizarBadgeHeaderSimbologia(null);
      actualizarLeyendaPreview(null);
      actualizarLeyendaCartograficaVisor(null);
      return;
    }

    if (idCapaForzada && idsActivos.includes(idCapaForzada)) {
      capaActivaSimbologiaId = idCapaForzada;
    } else if (!capaActivaSimbologiaId || !idsActivos.includes(capaActivaSimbologiaId)) {
      capaActivaSimbologiaId = idsActivos[idsActivos.length - 1];
    }

    selectCapa.innerHTML = idsActivos.map(id => {
      const reg = registroCapasTematicas[id];
      const nombre = reg.opciones?.nombre || id.toUpperCase();
      const sel = id === capaActivaSimbologiaId ? 'selected' : '';
      return `<option value="${id}" ${sel}>${escaparHTML(nombre)} (${id})</option>`;
    }).join('');

    sincronizarControlesConCapaActiva();
  }

  function sincronizarControlesConCapaActiva() {
    if (!capaActivaSimbologiaId) return;
    const reg = registroCapasTematicas[capaActivaSimbologiaId];
    if (!reg) return;

    const selectModo = document.getElementById('select-simbologia-modo');
    const selectColumna = document.getElementById('select-simbologia-columna');
    const selectMetodoCuant = document.getElementById('select-simbologia-metodo-cuant');
    const selectNumClases = document.getElementById('select-simbologia-num-clases');
    const selectRampa = document.getElementById('select-simbologia-rampa');
    const selectOrden = document.getElementById('select-simbologia-orden');
    const selectPaleta = document.getElementById('select-simbologia-paleta');

    const grupoMetodoCuant = document.getElementById('grupo-simbologia-metodo-cuant');
    const grupoNumClases = document.getElementById('grupo-simbologia-num-clases');
    const grupoRampa = document.getElementById('grupo-simbologia-rampa');
    const grupoOrden = document.getElementById('grupo-simbologia-orden');
    const grupoPaleta = document.getElementById('grupo-simbologia-paleta');
    const grupoColumna = document.getElementById('grupo-simbologia-columna');

    const cfg = reg.config;
    if (selectModo) selectModo.value = cfg.modo || 'plano';
    if (selectMetodoCuant) selectMetodoCuant.value = cfg.metodoCuant || 'cuartiles';
    if (selectNumClases) selectNumClases.value = String(cfg.numClases || 5);
    if (selectRampa) selectRampa.value = cfg.rampa || 'viridis';
    if (selectOrden) selectOrden.value = cfg.orden || 'normal';
    if (selectPaleta) selectPaleta.value = cfg.paletaCat || 'armonica';

    const esGraduado = cfg.modo === 'graduado';
    const esCategorizado = cfg.modo === 'categorizado';
    const esPlano = cfg.modo === 'plano';

    if (grupoColumna) grupoColumna.style.display = esPlano ? 'none' : '';
    if (grupoMetodoCuant) grupoMetodoCuant.style.display = esGraduado ? '' : 'none';
    if (grupoNumClases) grupoNumClases.style.display = esGraduado ? '' : 'none';
    if (grupoRampa) grupoRampa.style.display = esGraduado ? '' : 'none';
    if (grupoOrden) grupoOrden.style.display = (esGraduado || esCategorizado) ? '' : 'none';
    if (grupoPaleta) grupoPaleta.style.display = esCategorizado ? '' : 'none';

    if (selectColumna && reg.cols) {
      const { numericas, categoricas } = reg.cols;
      let html = '';

      if (esGraduado) {
        if (numericas.length > 0) {
          html += `<optgroup label="Columnas Cuantitativas (Numéricas)">` +
            numericas.map(c => `<option value="${c}" ${c === cfg.columna ? 'selected' : ''}>${c} [Numérico]</option>`).join('') +
            `</optgroup>`;
        }
        if (categoricas.length > 0) {
          html += `<optgroup label="Otras Columnas">` +
            categoricas.map(c => `<option value="${c}" ${c === cfg.columna ? 'selected' : ''}>${c}</option>`).join('') +
            `</optgroup>`;
        }
      } else {
        if (categoricas.length > 0) {
          html += `<optgroup label="Columnas Cualitativas (Categóricas)">` +
            categoricas.map(c => `<option value="${c}" ${c === cfg.columna ? 'selected' : ''}>${c} [Categoría]</option>`).join('') +
            `</optgroup>`;
        }
        if (numericas.length > 0) {
          html += `<optgroup label="Columnas Cuantitativas">` +
            numericas.map(c => `<option value="${c}" ${c === cfg.columna ? 'selected' : ''}>${c} [Numérico]</option>`).join('') +
            `</optgroup>`;
        }
      }

      if (!html) html = '<option value="">(Sin columnas disponibles)</option>';
      selectColumna.innerHTML = html;

      if (cfg.columna) {
        selectColumna.value = cfg.columna;
      } else {
        cfg.columna = selectColumna.value;
      }
    }

    actualizarBadgeHeaderSimbologia(reg);
    actualizarLeyendaPreview(reg);
    actualizarLeyendaCartograficaVisor(reg);
  }

  function inicializarControlSimbologia() {
    const panel = document.getElementById('panel-simbologia-dinamica');
    const header = document.getElementById('header-panel-simbologia');
    const btnToggle = document.getElementById('btn-toggle-panel-simbologia');
    const cuerpo = document.getElementById('cuerpo-simbologia-dinamica');
    const labelToggle = document.getElementById('label-toggle-simbologia');
    const iconoToggle = document.getElementById('icono-toggle-simbologia');

    if (!panel || panel.dataset.iniciado === '1') return;
    panel.dataset.iniciado = '1';

    const togglePanel = () => {
      const colapsado = panel.classList.toggle('colapsado');
      if (cuerpo) cuerpo.style.display = colapsado ? 'none' : 'flex';
      if (btnToggle) btnToggle.setAttribute('aria-expanded', String(!colapsado));
      if (labelToggle) labelToggle.textContent = colapsado ? 'Ajustar' : 'Plegar';
      if (iconoToggle) iconoToggle.textContent = colapsado ? '▼' : '▲';

      if (colapsado) {
        leyendaVisorCerradaManualmente = false;
        actualizarLeyendaCartograficaVisor();
      } else {
        const elLey = document.getElementById('leyenda-cartografica-visor');
        if (elLey) elLey.style.display = 'none';
      }
    };

    if (btnToggle) {
      btnToggle.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
      };
    }

    if (header) {
      header.onclick = (e) => {
        if (e.target && (e.target.id === 'btn-toggle-panel-simbologia' || e.target.closest('#btn-toggle-panel-simbologia'))) return;
        togglePanel();
      };
    }

    // Inicializar controles de la leyenda cartográfica flotante en el visor
    const elLeyenda = document.getElementById('leyenda-cartografica-visor');
    const headerLeyenda = document.getElementById('header-leyenda-cartografica');
    const btnMinimizarLeyenda = document.getElementById('btn-minimizar-leyenda-cartografica');
    const btnCerrarLeyenda = document.getElementById('btn-cerrar-leyenda-cartografica');

    if (elLeyenda && typeof L !== 'undefined' && L.DomEvent) {
      try {
        L.DomEvent.disableClickPropagation(elLeyenda);
        L.DomEvent.disableScrollPropagation(elLeyenda);
      } catch (_) {}
    }

    if (btnMinimizarLeyenda) {
      btnMinimizarLeyenda.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!elLeyenda) return;
        const min = elLeyenda.classList.toggle('minimizada');
        btnMinimizarLeyenda.textContent = min ? '▲' : '▼';
        btnMinimizarLeyenda.setAttribute('aria-expanded', String(!min));
        btnMinimizarLeyenda.title = min ? 'Expandir leyenda cartográfica' : 'Minimizar leyenda cartográfica';
      };
    }

    if (headerLeyenda) {
      headerLeyenda.onclick = (e) => {
        if (e.target && (e.target.closest('#btn-cerrar-leyenda-cartografica') || e.target.closest('#btn-minimizar-leyenda-cartografica'))) {
          return;
        }
        if (!elLeyenda) return;
        const min = elLeyenda.classList.toggle('minimizada');
        if (btnMinimizarLeyenda) {
          btnMinimizarLeyenda.textContent = min ? '▲' : '▼';
          btnMinimizarLeyenda.setAttribute('aria-expanded', String(!min));
          btnMinimizarLeyenda.title = min ? 'Expandir leyenda cartográfica' : 'Minimizar leyenda cartográfica';
        }
      };
    }

    if (btnCerrarLeyenda) {
      btnCerrarLeyenda.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        leyendaVisorCerradaManualmente = true;
        if (elLeyenda) elLeyenda.style.display = 'none';
      };
    }

    const selectCapa = document.getElementById('select-simbologia-capa');
    const selectModo = document.getElementById('select-simbologia-modo');
    const selectColumna = document.getElementById('select-simbologia-columna');
    const selectMetodoCuant = document.getElementById('select-simbologia-metodo-cuant');
    const selectNumClases = document.getElementById('select-simbologia-num-clases');
    const selectRampa = document.getElementById('select-simbologia-rampa');
    const selectOrden = document.getElementById('select-simbologia-orden');
    const selectPaleta = document.getElementById('select-simbologia-paleta');
    const btnAplicar = document.getElementById('btn-aplicar-simbologia');
    const btnRestablecer = document.getElementById('btn-restablecer-simbologia');

    const leerConfigDesdeUI = () => {
      return {
        modo: selectModo ? selectModo.value : 'plano',
        columna: selectColumna ? selectColumna.value : null,
        metodoCuant: selectMetodoCuant ? selectMetodoCuant.value : 'cuartiles',
        numClases: selectNumClases ? Number(selectNumClases.value) : 5,
        rampa: selectRampa ? selectRampa.value : 'viridis',
        orden: selectOrden ? selectOrden.value : 'normal',
        paletaCat: selectPaleta ? selectPaleta.value : 'armonica'
      };
    };

    const aplicarDesdeUI = () => {
      if (!capaActivaSimbologiaId) return;
      const cfg = leerConfigDesdeUI();
      aplicarSimbologiaACapa(capaActivaSimbologiaId, cfg);
    };

    if (selectCapa) {
      selectCapa.onchange = () => {
        capaActivaSimbologiaId = selectCapa.value;
        sincronizarControlesConCapaActiva();
      };
    }

    if (selectModo) {
      selectModo.onchange = () => {
        if (!capaActivaSimbologiaId) return;
        const reg = registroCapasTematicas[capaActivaSimbologiaId];
        if (reg) {
          reg.config.modo = selectModo.value;
          if (selectModo.value === 'graduado' && reg.cols && reg.cols.numericas.length > 0) {
            if (!reg.cols.numericas.includes(reg.config.columna)) {
              reg.config.columna = reg.cols.numericas[0];
            }
          }
          if (selectModo.value === 'categorizado' && reg.cols && reg.cols.categoricas.length > 0) {
            if (!reg.cols.categoricas.includes(reg.config.columna)) {
              reg.config.columna = reg.cols.categoricas[0];
            }
          }
          sincronizarControlesConCapaActiva();
          aplicarDesdeUI();
        }
      };
    }

    [selectColumna, selectMetodoCuant, selectNumClases, selectRampa, selectOrden, selectPaleta].forEach(sel => {
      if (sel) {
        sel.onchange = () => {
          aplicarDesdeUI();
        };
      }
    });

    if (btnAplicar) {
      btnAplicar.onclick = (e) => {
        e.preventDefault();
        aplicarDesdeUI();
        leyendaVisorCerradaManualmente = false;
        actualizarLeyendaCartograficaVisor();
        const textoOriginal = btnAplicar.innerHTML;
        btnAplicar.innerHTML = '<span>¡Aplicado al mapa!</span>';
        btnAplicar.style.background = '#16a34a';
        setTimeout(() => {
          btnAplicar.innerHTML = textoOriginal;
          btnAplicar.style.background = '';
        }, 1200);
      };
    }

    if (btnRestablecer) {
      btnRestablecer.onclick = (e) => {
        e.preventDefault();
        if (!capaActivaSimbologiaId) return;
        const reg = registroCapasTematicas[capaActivaSimbologiaId];
        if (reg) {
          const def = determinarSimbologiaPredeterminada(reg.idCapa, reg.geojson, reg.opciones);
          reg.config = def;
          aplicarSimbologiaACapa(reg.idCapa, def);
          sincronizarControlesConCapaActiva();
          leyendaVisorCerradaManualmente = false;
          actualizarLeyendaCartograficaVisor(reg);
        }
      };
    }
  }

  function construirContenidoPopupLazy(feature, layer, idCapa, opciones, colorFallback, icono) {
    const props = feature.properties || {};
    const colorFeature = layer._atlasColor || resolverColorFeature(feature, idCapa, colorFallback) || colorFallback;
    const idCapaStrItem = (idCapa || '').toString().toLowerCase();
    const esGbifItem = Boolean(
      idCapaStrItem.includes('gbif') ||
      (props.fuente && props.fuente.toString().toLowerCase().includes('gbif')) ||
      (props._fuente && props._fuente.toString().toLowerCase().includes('gbif')) ||
      props.datasetKey || props.taxonKey || props.scientificName || props.gbifID
    );
    const esOficial = !esGbifItem && !!(
      props._idOficial ||
      (window.ModuloIDEChile?.obtenerDefinicion && Boolean(window.ModuloIDEChile.obtenerDefinicion(idCapa))) ||
      (idCapa && (
        idCapaStrItem.startsWith('bbdd_') ||
        idCapaStrItem.startsWith('ide_') ||
        idCapaStrItem.startsWith('oficial_') ||
        idCapaStrItem.includes('sii') ||
        idCapaStrItem.includes('predial') ||
        idCapaStrItem.includes('censo') ||
        idCapaStrItem.includes('rsh') ||
        idCapaStrItem.includes('bip') ||
        idCapaStrItem.includes('igvust') ||
        idCapaStrItem.includes('semaforos') ||
        idCapaStrItem.includes('subdere') ||
        idCapaStrItem.includes('munistgo') ||
        idCapaStrItem.includes('mop')
      ))
    );
    const nombre = props._nombre || props.nombre || props.name || props.NOM || props.NOMBRE || props.especie || 'Sin denominación';
    let fuente = props._fuente || props.fuente || opciones.fuente;
    if (!fuente) {
      if (idCapaStrItem.includes('sii') || idCapaStrItem.includes('predial')) fuente = 'Servicio de Impuestos Internos (SII)';
      else if (esOficial) fuente = 'Estado de Chile / IDE Chile';
      else if (esGbifItem) fuente = 'GBIF / Ciencia Ciudadana';
      else fuente = 'OpenStreetMap (API Overpass)';
    }
    let licencia = props._licencia || props.licencia || opciones.licencia;
    if (!licencia) {
      if (esOficial) licencia = 'Ley N° 20.285 de Transparencia';
      else if (esGbifItem) licencia = 'CC-BY 4.0';
      else if (fuente && fuente.includes('Geofabrik')) licencia = 'ODbL 1.0 (© colaboradores de OpenStreetMap / Geofabrik GmbH)';
      else licencia = 'ODbL 1.0 (© colaboradores de OpenStreetMap)';
    }
    const subtipo = props._subtipo || props.subtipo || props.fclass || props.amenity || props.shop || props.highway || props.building || props.leisure || props.historic || props.natural || props.landuse || props.railway || props.rubro || (props._idOficial ? 'Oficial' : (esGbifItem ? 'Observación de Biodiversidad' : 'Entidad Cartográfica'));

    let filasExtraInfo = '';
    if (props._extraInfo) {
      Object.keys(props._extraInfo).forEach(k => {
        filasExtraInfo += `<tr><td style="color:#4B5142; width:45%;">${escaparHTML(k)}:</td><td><strong>${escaparHTML(props._extraInfo[k])}</strong></td></tr>`;
      });
    }

    const geomType = feature.geometry?.type || 'Point';
    const rotuloGeometria = (geomType === 'Point' || geomType === 'MultiPoint') ? 'Punto 📍' :
                            (geomType === 'LineString' || geomType === 'MultiLineString') ? 'Línea 〰️' :
                            'Polígono ⬡';

    const idBotonDetalle = `btn-mas-detalle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    layer._atlasIdBotonDetalle = idBotonDetalle;

    return `
      <div class="popup-vgi" style="font-family:Spectral, Georgia, serif; max-width:260px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
          <span style="font-size:0.75rem; color:${colorFeature}; font-weight:bold; font-family:'IBM Plex Mono',monospace;">
            ${icono} ${escaparHTML(opciones.nombre || idCapa.toUpperCase())}
          </span>
          <span style="font-size:0.7rem; background:#EDE6D6; color:#4B5142; padding:1px 5px; border-radius:3px; font-weight:600;">
            ${rotuloGeometria}
          </span>
        </div>
        <h4 style="margin:4px 0 6px 0; font-size:1rem; border-bottom:1px solid #C9BFA0; padding-bottom:3px;">
          ${escaparHTML(nombre)}
        </h4>
        <table style="width:100%; font-size:0.78rem; border-collapse:collapse;">
          ${esOficial ? `<tr><td colspan="2" style="background:#1B4D3E; color:#FFF; font-size:0.68rem; font-family:'IBM Plex Mono',monospace; padding:2px 6px; font-weight:bold; letter-spacing:0.04em; margin-bottom:4px; display:block;">🏛️ CAPA OFICIAL DEL ESTADO DE CHILE</td></tr>` : ''}
          ${props.id_ig ? `<tr><td style="color:#4B5142; width:38%;">ID IG:</td><td><code style="font-size:0.7rem; color:#06b6d4; font-family:'IBM Plex Mono',monospace; font-weight:700;">${escaparHTML(props.id_ig)}</code></td></tr>` : ''}
          ${(props.id_igv || props.id_vgi) ? `<tr><td style="color:#4B5142; width:38%;">ID IGV:</td><td><code style="font-size:0.7rem; color:#06b6d4; font-family:'IBM Plex Mono',monospace; font-weight:700;">${escaparHTML(props.id_igv || props.id_vgi)}</code></td></tr>` : ''}
          <tr><td style="color:#4B5142; width:38%;">Clasificación:</td><td><strong>${escaparHTML(subtipo)}</strong></td></tr>
          ${filasExtraInfo}
          ${props.operador ? `<tr><td style="color:#4B5142;">Operador:</td><td>${escaparHTML(props.operador)}</td></tr>` : ''}
          ${props.direccion && !props._extraInfo?.['Dirección'] ? `<tr><td style="color:#4B5142;">Dirección:</td><td>${escaparHTML(props.direccion)}</td></tr>` : ''}
          ${props.accesibilidad ? `<tr><td style="color:#4B5142;">Accesible:</td><td>${escaparHTML(props.accesibilidad)}</td></tr>` : ''}
          ${props.superficie_m2 ? `<tr><td style="color:#4B5142;">Superficie:</td><td><strong>${Number(props.superficie_m2).toLocaleString('es-CL')} m²</strong> <span style="font-size:0.72rem; color:#8F3A2C; font-weight:600;" title="Calculada mediante reproyección conforme a EPSG:32719 (UTM 19S) + Gauss">(EPSG:32719)</span>${props.superficie_ha ? ` <small>(${Number(props.superficie_ha).toLocaleString('es-CL')} ha)</small>` : ''}</td></tr>` : ''}
          <tr><td style="color:#4B5142;">Fuente:</td><td>${escaparHTML(fuente)}</td></tr>
          <tr><td style="color:#4B5142;">Licencia:</td><td><small>${escaparHTML(licencia)}</small></td></tr>
          ${props._declaracion ? `<tr><td colspan="2" style="font-size:0.68rem; color:#4B5142; padding-top:4px; border-top:1px dashed #C9BFA0; line-height:1.25;"><em>${escaparHTML(props._declaracion)}</em></td></tr>` : ''}
          ${props._citaAPA ? `<tr><td colspan="2" style="font-size:0.65rem; color:#35586B; padding-top:2px; font-family:'IBM Plex Mono',monospace;"><strong>Cita:</strong> ${escaparHTML(props._citaAPA)}</td></tr>` : ''}
        </table>
        <div style="margin-top:8px; border-top:1px solid #C9BFA0; padding-top:6px; text-align:right;">
          <button id="${idBotonDetalle}" class="btn-mas-detalles-popup" style="background:linear-gradient(135deg,#06b6d4,#0891b2); color:#000; border:none; border-radius:5px; padding:6px 14px; font-size:0.75rem; font-weight:700; cursor:pointer; font-family:'IBM Plex Mono',monospace; letter-spacing:0.03em; transition:all 0.2s; box-shadow:0 2px 6px rgba(6,182,212,0.3);">Más detalles →</button>
        </div>
      </div>
    `;
  }

  function encuadrarCapaDeFormaRacional(capa, opciones = {}) {
    if (!mapa || !capa || opciones.ajustarVista === false) return;
    if (typeof capa.getBounds !== 'function') return;
    const b = capa.getBounds();
    if (!b || !b.isValid()) return;

    const aplicarEncuadre = () => {
      try {
        mapa.invalidateSize({ pan: false });
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        const latSpan = Math.abs(ne.lat - sw.lat);
        const lngSpan = Math.abs(ne.lng - sw.lng);
        const centroComuna = L.latLngBounds([-33.485, -70.705], [-33.420, -70.625]);

        if (latSpan <= 0.45 && lngSpan <= 0.55) {
          mapa.fitBounds(b, { padding: [40, 40], maxZoom: 16 });
        } else if (b.intersects(centroComuna)) {
          // Capa metropolitana o regional con cobertura en Santiago/Barrio Brasil:
          // evitar alejar la cámara a escala nacional (zoom 6-8) o quedar bloqueado en zoom > 16
          _pendingBboxBounds = null;
          const vistaActual = mapa.getBounds ? mapa.getBounds() : null;
          const zoomActual = mapa.getZoom ? mapa.getZoom() : 12;
          if (!vistaActual || !centroComuna.intersects(vistaActual) || zoomActual < 12 || zoomActual > 16) {
            mapa.fitBounds(L.latLngBounds([-33.470, -70.695], [-33.428, -70.635]), { padding: [20, 20], maxZoom: 14 });
          }
        } else {
          mapa.fitBounds(b, { padding: [40, 40], maxZoom: 14 });
        }
        if (typeof capa.redraw === 'function') capa.redraw();
      } catch (_) {}
    };

    const sz = mapa.getSize ? mapa.getSize() : null;
    if (!sz || sz.x === 0 || sz.y === 0) {
      setTimeout(aplicarEncuadre, 160);
    } else {
      aplicarEncuadre();
    }
  }

  /**
   * Agrega o reemplaza una capa GeoJSON en el mapa
   */
  function cargarCapaGeoJSON(idCapa, geojson, opciones = {}) {
    if (!mapa || !grupoCapasTematicas) return;

    if (capasTematicasActivas[idCapa]) {
      grupoCapasTematicas.removeLayer(capasTematicasActivas[idCapa]);
    }

    const color = opciones.color || COLORES_CATEGORIA[idCapa] || COLORES_CATEGORIA.defecto;
    const icono = opciones.icono || '📍';

    // Registrar o actualizar metadatos y configuración racional de simbología predeterminada
    if (!registroCapasTematicas[idCapa]) {
      const cols = inspeccionarColumnasGeoJSON(geojson);
      const configPredeterminada = determinarSimbologiaPredeterminada(idCapa, geojson, opciones);
      registroCapasTematicas[idCapa] = {
        idCapa,
        geojson,
        opciones,
        capaLeaflet: null,
        cols,
        config: configPredeterminada,
        clasificacion: null
      };
      registroCapasTematicas[idCapa].clasificacion = calcularClasificacionCapa(registroCapasTematicas[idCapa]);
    } else {
      registroCapasTematicas[idCapa].geojson = geojson;
      registroCapasTematicas[idCapa].opciones = opciones;
      registroCapasTematicas[idCapa].cols = inspeccionarColumnasGeoJSON(geojson);
      if (!registroCapasTematicas[idCapa].config || registroCapasTematicas[idCapa].config.modo === 'automatico') {
        registroCapasTematicas[idCapa].config = determinarSimbologiaPredeterminada(idCapa, geojson, opciones);
      }
      registroCapasTematicas[idCapa].clasificacion = calcularClasificacionCapa(registroCapasTematicas[idCapa]);
    }

    const numFeatures = (geojson && Array.isArray(geojson.features)) ? geojson.features.length : 0;
    const smoothPoligono = numFeatures > 5000 ? 1.5 : 1.0;

    const capa = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => {
        const colorFeature = resolverColorFeature(feature, idCapa, color);
        return L.circleMarker(latlng, {
          radius: numFeatures > 10000 ? 4 : 6,
          fillColor: colorFeature,
          color: '#1a1f18',
          weight: numFeatures > 10000 ? 0.8 : 1.5,
          opacity: 1,
          fillOpacity: 0.9
        });
      },
      style: (feature) => {
        const colorFeature = resolverColorFeature(feature, idCapa, color);
        const gt = feature.geometry?.type;
        if (gt === 'LineString' || gt === 'MultiLineString') {
          return {
            color: colorFeature,
            weight: numFeatures > 10000 ? 2.2 : 3.5,
            opacity: 0.88,
            smoothFactor: smoothPoligono
          };
        }
        return {
          fillColor: colorFeature,
          weight: numFeatures > 5000 ? 0.8 : 1.4,
          opacity: 0.9,
          color: '#1a1f18',
          fillOpacity: 0.55,
          smoothFactor: smoothPoligono
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const colorFeature = resolverColorFeature(feature, idCapa, color);

        // Guardar referencias internas en la entidad vectorial (sin asignar HTML ni closures pesados por cada feature)
        layer._atlasProps = props;
        layer._atlasOpciones = opciones;
        layer._atlasIdCapa = idCapa;
        layer._atlasIcono = icono;
        layer._atlasColor = colorFeature;

        // Construcción verdaderamente perezosa del popup al hacer clic, respetando el Modo Inspector Normativo
        layer.on('click', (ev) => {
          if (ev) {
            if (ev.originalEvent) {
              try { L.DomEvent.stopPropagation(ev.originalEvent); } catch (_) {}
            }
            try { L.DomEvent.stopPropagation(ev); } catch (_) {}
          }
          const inspActivo = Boolean(window.__inspectorNormativoActivo || document.getElementById('btn-inspector-normativo')?.classList.contains('activo'));
          if (inspActivo && ev && ev.latlng) {
            try { layer.closePopup(); } catch (_) {}
            if (typeof window.ejecutarConsultaInspector === 'function') {
              window.ejecutarConsultaInspector(ev.latlng.lat, ev.latlng.lng);
            }
            return;
          }
          if (typeof layer.getPopup !== 'function' || !layer.getPopup()) {
            layer.bindPopup(() => construirContenidoPopupLazy(feature, layer, idCapa, opciones, color, icono));
          }
          if (ev && ev.latlng) {
            layer.openPopup(ev.latlng);
          } else {
            layer.openPopup();
          }
        });

        // Vincular el botón «Más detalles» cada vez que el popup esté activo
        layer.on('popupopen', () => {
          const inspActivo = Boolean(window.__inspectorNormativoActivo || document.getElementById('btn-inspector-normativo')?.classList.contains('activo'));
          if (inspActivo) {
            try { layer.closePopup(); } catch (_) {}
            return;
          }
          layerActivoPopup = layer;
          const btn = layer._atlasIdBotonDetalle ? document.getElementById(layer._atlasIdBotonDetalle) : null;
          if (btn) {
            btn.onclick = (e) => {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
              abrirSidebarDetalle(props, opciones, idCapa, icono, layer._atlasColor || colorFeature);
              layer.closePopup();
            };
          }
        });
      }
    });

    capasTematicasActivas[idCapa] = capa;
    grupoCapasTematicas.addLayer(capa);
    if (registroCapasTematicas[idCapa]) {
      registroCapasTematicas[idCapa].capaLeaflet = capa;
    }
    sincronizarSelectorCapasSimbologia(idCapa);
    actualizarLeyendaCartograficaVisor(registroCapasTematicas[idCapa]);

    encuadrarCapaDeFormaRacional(capa, opciones);

    return capa;
  }

  function removerCapa(idCapa) {
    if (capasTematicasActivas[idCapa] && grupoCapasTematicas) {
      grupoCapasTematicas.removeLayer(capasTematicasActivas[idCapa]);
      delete capasTematicasActivas[idCapa];
      delete registroCapasTematicas[idCapa];
      sincronizarSelectorCapasSimbologia();
      actualizarLeyendaCartograficaVisor();
    }
  }

  function limpiarTodasLasCapas() {
    if (grupoCapasTematicas) {
      grupoCapasTematicas.clearLayers();
      capasTematicasActivas = {};
      registroCapasTematicas = {};
      capaActivaSimbologiaId = null;
      sincronizarSelectorCapasSimbologia();
      actualizarLeyendaCartograficaVisor(null);
    }
  }

  function obtenerGeoJSONCapa(idCapa) {
    if (capasTematicasActivas[idCapa]) {
      return capasTematicasActivas[idCapa].toGeoJSON();
    }
    return null;
  }

  function obtenerGeoJSONCompleto() {
    const features = [];
    Object.keys(capasTematicasActivas).forEach(id => {
      const gj = capasTematicasActivas[id].toGeoJSON();
      if (gj && gj.features) {
        // Resolver metadatos para esta capa temática
        let metaCapa = { id: id };
        if (typeof ModuloMetadatos !== 'undefined' && ModuloMetadatos.resolverMetadatosCapa) {
          metaCapa = ModuloMetadatos.resolverMetadatosCapa(id);
        }

        const reg = registroCapasTematicas[id];
        gj.features.forEach(f => {
          f.properties = f.properties || {};

          // Inyectar simbología y estilo visual aplicado
          let colorSimbologia = '#06b6d4';
          try {
            colorSimbologia = resolverColorFeature(f, id, reg?.opciones?.color);
          } catch (_) {}

          f.properties['marker-color'] = colorSimbologia;
          f.properties['stroke'] = colorSimbologia;
          f.properties['fill'] = colorSimbologia;
          f.properties['fill-opacity'] = 0.85;
          f.properties['stroke-width'] = 2;
          f.properties['simbologia_color'] = colorSimbologia;
          if (reg && reg.config) {
            f.properties['simbologia_modo'] = reg.config.modo || 'plano';
            if (reg.config.columna) f.properties['simbologia_columna'] = reg.config.columna;
            if (reg.config.rampa) f.properties['simbologia_rampa'] = reg.config.rampa;
            if (reg.config.paletaCat) f.properties['simbologia_paleta'] = reg.config.paletaCat;
          }

          f.properties.categoria_capa = id;
          f.properties.meta_capa_id = metaCapa.id || id;
          f.properties.meta_titulo = metaCapa.titulo || id;
          f.properties.meta_institucion = metaCapa.institucion || 'Atlas VGI — Nodo GeoAbierto';
          f.properties.meta_ministerio = metaCapa.ministerio || 'Sector Público / Sociedad Civil';
          f.properties.meta_grupo = metaCapa.grupo || 'general';
          f.properties.meta_tipo_fuente = metaCapa.tipo_fuente || 'VGI (Comunitaria / Abierta)';
          f.properties.meta_temporalidad = metaCapa.temporalidad || '2026';
          f.properties.meta_licencia = metaCapa.licencia || 'ODbL 1.0 / Ley N° 20.285';
          f.properties.meta_cita_apa = metaCapa.cita_apa || `Atlas VGI Territorial. (2026). ${metaCapa.titulo || id}.`;
          f.properties.meta_crs = 'EPSG:4326 (WGS 84)';
          f.properties.meta_igv = Number(metaCapa.igv || 100.0);
          f.properties.meta_grado_calidad = metaCapa.grado_calidad || 'A+ (Excelente)';
          f.properties.meta_contacto = metaCapa.contacto || 'tucorreoelectronico@gmail.com';
          f.properties.meta_url_servicio = metaCapa.url_servicio || window.location.href;
          features.push(f);
        });
      }
    });
    return {
      type: 'FeatureCollection',
      name: 'Atlas_VGI_Barrio_Brasil',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      metadata: {
        estandar: 'ISO 19115-1:2014 / ISO 19157:2023 / Perfil IDE Chile SNIT v2.0',
        fileIdentifier: `urn:uuid:vgi-cl-consolidado-${Date.now()}`,
        title: 'Colección de Capas Activas — Atlas VGI Barrio Brasil',
        organisationName: 'Atlas VGI Territorial / Nodo GeoAbierto',
        legalConstraints: 'Open Database License (ODbL) 1.0 / Ley N° 20.285',
        totalEntities: features.length,
        referenceSystemIdentifier: 'EPSG:4326',
        exportDate: new Date().toISOString()
      },
      features: features
    };
  }

  function exportarGeoJSONCargado() {
    const fc = obtenerGeoJSONCompleto();
    if (fc.features.length === 0) {
      alert('No hay capas temáticas activas con datos en el mapa para exportar.');
      return;
    }
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-vgi-barrio-brasil-${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function cambiarTerritorio(idTerritorio) {
    const cfg = window.NODO_CONFIG;
    if (!cfg || !cfg.territorios_predefinidos) return;
    const t = cfg.territorios_predefinidos.find(item => item.id === idTerritorio);
    if (t && t.bbox) {
      encuadrarBbox(t.bbox);
      document.dispatchEvent(new CustomEvent('nodo:bbox-cambiado', { detail: { bbox: t.bbox } }));
    }
  }

  function invalidarTamano(bounds) {
    if (!mapa) return;
    const refrescar = () => {
      try {
        mapa.invalidateSize({ pan: false });
        const sz = mapa.getSize ? mapa.getSize() : null;
        const visible = !!(sz && sz.x >= 50 && sz.y >= 50);
        if (bounds && bounds.isValid && bounds.isValid()) {
          _pendingBboxBounds = null;
          if (visible) {
            mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
          }
        } else if (_pendingBboxBounds && _pendingBboxBounds.isValid && _pendingBboxBounds.isValid() && visible) {
          const pendiente = _pendingBboxBounds;
          _pendingBboxBounds = null;
          mapa.fitBounds(pendiente, { padding: [20, 20], maxZoom: 16 });
        }
      } catch (_) {}
    };
    refrescar();
    setTimeout(refrescar, 60);
    setTimeout(refrescar, 200);
    setTimeout(refrescar, 500);
  }

  function alternarCapaWMS(idCapa, capaWMS) {
    if (!mapa || !capaWMS) return false;
    if (capasWMSActivas[idCapa]) {
      mapa.removeLayer(capasWMSActivas[idCapa]);
      delete capasWMSActivas[idCapa];
      return false;
    } else {
      capaWMS.addTo(mapa);
      capasWMSActivas[idCapa] = capaWMS;
      return true;
    }
  }

  function removerCapaWMS(idCapa) {
    if (mapa && capasWMSActivas[idCapa]) {
      mapa.removeLayer(capasWMSActivas[idCapa]);
      delete capasWMSActivas[idCapa];
    }
  }

  function obtenerCapasWMSActivas() {
    return { ...capasWMSActivas };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SIDEBAR DE DETALLES — «Más detalles →»
  // Muestra todas las propiedades del feature + metadatos de la capa y
  // metacalidad del pipeline de procesamiento.
  // ═══════════════════════════════════════════════════════════════════════

  // Metadatos de origen por capa BIDAT (fuente, pipeline, notas)
  const META_CAPAS_BIDAT = {
    'IGVUST_UV_2026_Agosto': {
      fuente: 'Ministerio de Desarrollo Social — BIDAT',
      archivo_origen: '202608_igvust_uv_cuartil.csv',
      descripcion: 'Índice de Gestión de Vulnerabilidad Social Territorial (IGVUST) por Unidad Vecinal. Cuartiles de vulnerabilidad socioeconómica calculados por el MDS para agosto 2026.',
      join_tipo: 'Atributo UV directo (uv_rsh → t_id_uv_ca)',
      clave_join: 'uv_rsh = t_id_uv_ca (9 dígitos)',
      cobertura: '1,364 / 1,364 UV (100%)',
      features_salida: 1364, features_excluidas: 0,
      nulos_rellenos: 'Ninguno (match perfecto)',
      crs_entrada: 'EPSG:5360 (SIRGAS-Chile)', crs_salida: 'EPSG:4326 (WGS84)',
      fecha_proceso: '2026-09-16', tamano_mb: 8.52,
      licencia: 'Dato público — Ministerio de Desarrollo Social Chile'
    },
    'RSH_Sexo_UV_2026_Agosto': {
      fuente: 'MDS BIDAT — Registro Social de Hogares', archivo_origen: 'ind_89_90_202608.csv',
      descripcion: 'Personas en RSH desagregadas por sexo (hombres/mujeres) según Unidad Vecinal. Agosto 2026. Valores con baja frecuencia sustituidos por rangos textuales (confidencialidad RSH).',
      join_tipo: 'Atributo UV (float→int)', clave_join: '"unidad vecinal" → t_id_uv_ca',
      cobertura: '1,355 / 1,364 UV (99.3%)', features_salida: 1364, features_excluidas: 0,
      nulos_rellenos: 'Valores textuales promediados; nulos → 0 / "Sin dato"',
      crs_entrada: 'EPSG:5360', crs_salida: 'EPSG:4326', fecha_proceso: '2026-09-16', tamano_mb: 15.22,
      licencia: 'Dato público — Ministerio de Desarrollo Social Chile'
    },
    'RSH_Dependencia_Funcional_UV_2026_Agosto': {
      fuente: 'MDS BIDAT', archivo_origen: 'ind_427_430_202608.csv',
      descripcion: 'Personas con dependencia funcional (leve, moderada, severa) en RSH por UV. Agosto 2026.',
      join_tipo: 'Atributo UV (float→int)', clave_join: '"unidad vecinal" → t_id_uv_ca',
      cobertura: '1,355 / 1,364 UV (99.3%)', features_salida: 1364, features_excluidas: 0,
      nulos_rellenos: 'Valores textuales promediados; nulos → 0', crs_entrada: 'EPSG:5360', crs_salida: 'EPSG:4326',
      fecha_proceso: '2026-09-16', tamano_mb: 17.90, licencia: 'Dato público — MDS Chile'
    },
    'NNA_RSH_Fonasa_Isapre_UV_2026_Junio': {
      fuente: 'MDS BIDAT', archivo_origen: 'ind_212_219_202606.csv',
      descripcion: 'Niños, niñas y adolescentes (NNA) en RSH según sistema de salud (FONASA/ISAPRE) por UV. Junio 2026.',
      join_tipo: 'Atributo UV (float→int)', clave_join: '"unidad vecinal" → t_id_uv_ca',
      cobertura: '1,355 / 1,364 UV (99.3%)', features_salida: 1364, features_excluidas: 0,
      nulos_rellenos: 'Nulos → 0', crs_entrada: 'EPSG:5360', crs_salida: 'EPSG:4326',
      fecha_proceso: '2026-09-16', tamano_mb: 18.32, licencia: 'Dato público — MDS Chile'
    },
    'Mujeres_RSH_Fonasa_Isapre_UV_2026_Junio': {
      fuente: 'MDS BIDAT', archivo_origen: 'ind_213_220_202606.csv',
      descripcion: 'Mujeres en RSH según sistema de salud (FONASA/ISAPRE) por UV. Junio 2026.',
      join_tipo: 'Atributo UV (float→int)', clave_join: '"unidad vecinal" → t_id_uv_ca',
      cobertura: '1,355 / 1,364 UV (99.3%)', features_salida: 1364, features_excluidas: 0,
      nulos_rellenos: 'Nulos → 0', crs_entrada: 'EPSG:5360', crs_salida: 'EPSG:4326',
      fecha_proceso: '2026-09-16', tamano_mb: 17.41, licencia: 'Dato público — MDS Chile'
    },
    'Jovenes_RSH_Fonasa_Isapre_UV_2026_Junio': {
      fuente: 'MDS BIDAT', archivo_origen: 'ind_214_221_202606.csv',
      descripcion: 'Jóvenes en RSH por sistema de salud por UV. Junio 2026.',
      join_tipo: 'Atributo UV (float→int)', clave_join: '"unidad vecinal" → t_id_uv_ca',
      cobertura: '1,355 / 1,364 UV (99.3%)', features_salida: 1364, features_excluidas: 0,
      nulos_rellenos: 'Nulos → 0', crs_entrada: 'EPSG:5360', crs_salida: 'EPSG:4326',
      fecha_proceso: '2026-09-16', tamano_mb: 17.46, licencia: 'Dato público — MDS Chile'
    },
    'Hombres_RSH_Fonasa_Isapre_UV_2026_Junio': {
      fuente: 'MDS BIDAT', archivo_origen: 'ind_215_222_202606.csv',
      descripcion: 'Hombres en RSH por sistema de salud por UV. Junio 2026.',
      join_tipo: 'Atributo UV (float→int)', clave_join: '"unidad vecinal" → t_id_uv_ca',
      cobertura: '1,355 / 1,364 UV (99.3%)', features_salida: 1364, features_excluidas: 0,
      nulos_rellenos: 'Nulos → 0', crs_entrada: 'EPSG:5360', crs_salida: 'EPSG:4326',
      fecha_proceso: '2026-09-16', tamano_mb: 17.41, licencia: 'Dato público — MDS Chile'
    },
    'Mayores_RSH_Fonasa_Isapre_UV_2026_Junio': {
      fuente: 'MDS BIDAT', archivo_origen: 'ind_216_223_202606.csv',
      descripcion: 'Adultos mayores en RSH por sistema de salud por UV. Junio 2026.',
      join_tipo: 'Atributo UV (float→int)', clave_join: '"unidad vecinal" → t_id_uv_ca',
      cobertura: '1,355 / 1,364 UV (99.3%)', features_salida: 1364, features_excluidas: 0,
      nulos_rellenos: 'Nulos → 0', crs_entrada: 'EPSG:5360', crs_salida: 'EPSG:4326',
      fecha_proceso: '2026-09-16', tamano_mb: 16.87, licencia: 'Dato público — MDS Chile'
    },
    'RSH_Ocupados_Cotizando_UV_2026_Junio': {
      fuente: 'MDS BIDAT', archivo_origen: 'ind_454_202606.csv',
      descripcion: 'Personas ocupadas y cotizando en RSH por UV. Junio 2026.',
      join_tipo: 'Atributo UV (float→int)', clave_join: '"unidad vecinal" → t_id_uv_ca',
      cobertura: '1,355 / 1,364 UV (99.3%)', features_salida: 1364, features_excluidas: 0,
      nulos_rellenos: 'Nulos → 0', crs_entrada: 'EPSG:5360', crs_salida: 'EPSG:4326',
      fecha_proceso: '2026-09-16', tamano_mb: 19.24, licencia: 'Dato público — MDS Chile'
    },
    'BIP_Iniciativas_Inversion_RM_Comunas': {
      fuente: 'Ministerio de Desarrollo Social — SNI/BIP',
      archivo_origen: 'base_inversiones_19-27.csv',
      descripcion: 'Base de iniciativas de inversión pública SNI/BIP 2019–2027 para la Región Metropolitana. Serie histórica completa. Cada fila es una iniciativa con geometría de su comuna. Join por CUT comunal (CMN_CLAVE → CUT_COM de COMUNAS_v1.shp DPA 2023).',
      join_tipo: 'Many-to-one: iniciativa → geometría de comuna',
      clave_join: 'CMN_CLAVE (float→int) → CUT_COM del SHP DPA 2023',
      cobertura: '52 / 52 comunas RM (100%)',
      features_salida: 3765, features_excluidas: 1128,
      razon_exclusion: 'CMN_CLAVE nulo en origen BIP (sin localización comunal asignada)',
      nulos_rellenos: '39 columnas con nulos → 0 / "Sin dato"',
      crs_entrada: 'SIRGAS-Chile (DPA 2023)', crs_salida: 'EPSG:4326',
      fecha_proceso: '2026-09-16', tamano_mb: 176.73,
      archivo_geojson: 'BIP_Iniciativas_Inversion_RM_Comunas.geojson',
      columnas_totales: 92,
      licencia: 'Dato público — Ministerio de Desarrollo Social Chile / SNI',
      nota_critica: 'REG_CLAVE en BIP = 181 (código interno SNI, ≠ CUT 13 del INE). Verificado cruzando CMN_CLAVE con CUT de comunas RM.'
    }
  };

  // Enlazar metadatos de archivo_geojson y columnas_totales para capas BIDAT / RSH
  if (META_CAPAS_BIDAT['IGVUST_UV_2026_Agosto']) {
    META_CAPAS_BIDAT['IGVUST_UV_2026_Agosto'].archivo_geojson = 'IGVUST_UV_2026_Agosto.geojson';
    META_CAPAS_BIDAT['IGVUST_UV_2026_Agosto'].columnas_totales = 22;
  }
  if (META_CAPAS_BIDAT['RSH_Sexo_UV_2026_Agosto']) {
    META_CAPAS_BIDAT['RSH_Sexo_UV_2026_Agosto'].archivo_geojson = 'RSH_Sexo_UV_2026_Agosto.geojson';
    META_CAPAS_BIDAT['RSH_Sexo_UV_2026_Agosto'].columnas_totales = 110;
  }
  if (META_CAPAS_BIDAT['RSH_Dependencia_Funcional_UV_2026_Agosto']) {
    META_CAPAS_BIDAT['RSH_Dependencia_Funcional_UV_2026_Agosto'].archivo_geojson = 'RSH_Dependencia_Funcional_UV_2026_Agosto.geojson';
    META_CAPAS_BIDAT['RSH_Dependencia_Funcional_UV_2026_Agosto'].columnas_totales = 110;
  }
  if (META_CAPAS_BIDAT['NNA_RSH_Fonasa_Isapre_UV_2026_Junio']) {
    META_CAPAS_BIDAT['NNA_RSH_Fonasa_Isapre_UV_2026_Junio'].archivo_geojson = 'NNA_RSH_Fonasa_Isapre_UV_2026_Junio.geojson';
    META_CAPAS_BIDAT['NNA_RSH_Fonasa_Isapre_UV_2026_Junio'].columnas_totales = 110;
  }
  if (META_CAPAS_BIDAT['Mujeres_RSH_Fonasa_Isapre_UV_2026_Junio']) {
    META_CAPAS_BIDAT['Mujeres_RSH_Fonasa_Isapre_UV_2026_Junio'].archivo_geojson = 'Mujeres_RSH_Fonasa_Isapre_UV_2026_Junio.geojson';
    META_CAPAS_BIDAT['Mujeres_RSH_Fonasa_Isapre_UV_2026_Junio'].columnas_totales = 110;
  }
  if (META_CAPAS_BIDAT['Jovenes_RSH_Fonasa_Isapre_UV_2026_Junio']) {
    META_CAPAS_BIDAT['Jovenes_RSH_Fonasa_Isapre_UV_2026_Junio'].archivo_geojson = 'Jovenes_RSH_Fonasa_Isapre_UV_2026_Junio.geojson';
    META_CAPAS_BIDAT['Jovenes_RSH_Fonasa_Isapre_UV_2026_Junio'].columnas_totales = 110;
  }
  if (META_CAPAS_BIDAT['Hombres_RSH_Fonasa_Isapre_UV_2026_Junio']) {
    META_CAPAS_BIDAT['Hombres_RSH_Fonasa_Isapre_UV_2026_Junio'].archivo_geojson = 'Hombres_RSH_Fonasa_Isapre_UV_2026_Junio.geojson';
    META_CAPAS_BIDAT['Hombres_RSH_Fonasa_Isapre_UV_2026_Junio'].columnas_totales = 110;
  }
  if (META_CAPAS_BIDAT['Mayores_RSH_Fonasa_Isapre_UV_2026_Junio']) {
    META_CAPAS_BIDAT['Mayores_RSH_Fonasa_Isapre_UV_2026_Junio'].archivo_geojson = 'Mayores_RSH_Fonasa_Isapre_UV_2026_Junio.geojson';
    META_CAPAS_BIDAT['Mayores_RSH_Fonasa_Isapre_UV_2026_Junio'].columnas_totales = 110;
  }
  if (META_CAPAS_BIDAT['RSH_Ocupados_Cotizando_UV_2026_Junio']) {
    META_CAPAS_BIDAT['RSH_Ocupados_Cotizando_UV_2026_Junio'].archivo_geojson = 'RSH_Ocupados_Cotizando_UV_2026_Junio.geojson';
    META_CAPAS_BIDAT['RSH_Ocupados_Cotizando_UV_2026_Junio'].columnas_totales = 142;
  }

  // Mapear aliases bbdd_XX hacia las definiciones oficiales
  META_CAPAS_BIDAT['bbdd_64'] = META_CAPAS_BIDAT['IGVUST_UV_2026_Agosto'];
  META_CAPAS_BIDAT['bbdd_65'] = META_CAPAS_BIDAT['BIP_Iniciativas_Inversion_RM_Comunas'];
  META_CAPAS_BIDAT['bbdd_67'] = META_CAPAS_BIDAT['RSH_Dependencia_Funcional_UV_2026_Agosto'];
  META_CAPAS_BIDAT['bbdd_68'] = META_CAPAS_BIDAT['RSH_Sexo_UV_2026_Agosto'];
  META_CAPAS_BIDAT['bbdd_69'] = META_CAPAS_BIDAT['NNA_RSH_Fonasa_Isapre_UV_2026_Junio'];
  META_CAPAS_BIDAT['bbdd_70'] = META_CAPAS_BIDAT['Mujeres_RSH_Fonasa_Isapre_UV_2026_Junio'];
  META_CAPAS_BIDAT['bbdd_71'] = META_CAPAS_BIDAT['Jovenes_RSH_Fonasa_Isapre_UV_2026_Junio'];
  META_CAPAS_BIDAT['bbdd_72'] = META_CAPAS_BIDAT['Hombres_RSH_Fonasa_Isapre_UV_2026_Junio'];
  META_CAPAS_BIDAT['bbdd_73'] = META_CAPAS_BIDAT['Mayores_RSH_Fonasa_Isapre_UV_2026_Junio'];
  META_CAPAS_BIDAT['bbdd_74'] = META_CAPAS_BIDAT['RSH_Ocupados_Cotizando_UV_2026_Junio'];

  // Mapear capas censales multiescalares INE y sectoriales complejas
  META_CAPAS_BIDAT['ide_censo2024_regional'] = {
    fuente: 'INE Chile — Censo 2024',
    descripcion: 'Marco Macroterritorial Región Metropolitana (Censo 2024). Desagregación demográfica y de vivienda.',
    archivo_geojson: 'ide_censo2024_regional.geojson',
    columnas_totales: 213,
    tamano_mb: 0.82,
    licencia: 'Datos Abiertos — Instituto Nacional de Estadísticas'
  };
  META_CAPAS_BIDAT['ide_censo2024_limite_urbano'] = {
    fuente: 'INE Chile — Censo 2024',
    descripcion: 'Áreas Urbanas Censales de la Región Metropolitana (106 polígonos). Atributos sociodemográficos y tipologías de asentamiento.',
    archivo_geojson: 'ide_censo2024_limite_urbano.geojson',
    columnas_totales: 213,
    tamano_mb: 6.48,
    licencia: 'Datos Abiertos — Instituto Nacional de Estadísticas'
  };
  META_CAPAS_BIDAT['ide_censo2024_localidades'] = {
    fuente: 'INE Chile — Censo 2024',
    descripcion: 'Localidades y Asentamientos Urbanos y Rurales RM (511 polígonos). Población, hogares y categorías censales.',
    archivo_geojson: 'ide_censo2024_localidades.geojson',
    columnas_totales: 213,
    tamano_mb: 17.16,
    licencia: 'Datos Abiertos — Instituto Nacional de Estadísticas'
  };
  META_CAPAS_BIDAT['ide_censo2024_zonal'] = {
    fuente: 'INE Chile — Censo 2024',
    descripcion: 'Distritos y Zonas Censales RM (1.865 polígonos). Microdatos sociodemográficos desagregados por sexo, tramos etarios y viviendas.',
    archivo_geojson: 'ide_censo2024_zonal.geojson',
    columnas_totales: 213,
    tamano_mb: 26.51,
    licencia: 'Datos Abiertos — Instituto Nacional de Estadísticas'
  };
  META_CAPAS_BIDAT['ide_censo2024_manzanas'] = {
    fuente: 'INE Chile — Censo 2024',
    descripcion: 'Manzanas Censales de la Región Metropolitana (66.873 polígonos). Microdatos completos con 217 variables censales oficiales del INE.',
    archivo_geojson: 'ide_censo2024_manzanas.geojson',
    columnas_totales: 217,
    tamano_mb: 496.87,
    licencia: 'Datos Abiertos — Instituto Nacional de Estadísticas'
  };
  META_CAPAS_BIDAT['capa_bbdd_61'] = {
    fuente: 'CONAF — Catastro Uso de Suelo',
    descripcion: 'Monitoreo de Cambios de Uso de Suelo y Cobertura Vegetacional (13.121 polígonos). Serie multitemporal completa.',
    archivo_geojson: 'capa_bbdd_61.geojson',
    columnas_totales: 85,
    tamano_mb: 284.4,
    licencia: 'Datos Abiertos — Corporación Nacional Forestal'
  };
    META_CAPAS_BIDAT['munistgo_aseo_zonas_residuos_2026'] = {
    fuente: 'Municipalidad de Santiago — Subdirección de Aseo y Gestión Integral de Residuos',
    archivo_origen: 'Oficio Transparencia MU-18117 / Memorando N° 204 / Catastro Junio 2026',
    descripcion: 'Catastro comunal oficial de infraestructura de residuos sólidos: 5 macro-zonas de aseo (Oriente, Centro Oriente, Centro Poniente, Centro Plaza, Poniente), 629 contenedores, 398 papeleros, 285.860 L de capacidad instalada, tasas de deterioro físico y operatividad.',
    cobertura: '5 / 5 Macro-Zonas de Aseo Comuna de Santiago (100% comunal / 27 Barrios agrupados)',
    features_salida: 5,
    crs_entrada: 'EPSG:32719 (WGS 84 / UTM Huso 19S)',
    crs_salida: 'EPSG:4326',
    fecha_proceso: '2026-10-22',
    tamano_mb: 0.03,
    archivo_geojson: 'zonas_aseo_contenedores_papeleros_santiago.geojson',
    archivo_gpkg: 'zonas_aseo_contenedores_papeleros_santiago.gpkg',
    columnas_totales: 43,
    licencia: 'Información Pública Oficial — Ley N° 20.285 de Transparencia (Oficio N° E-1528/2026)'
  };
  META_CAPAS_BIDAT['zonas_aseo_contenedores_papeleros_santiago'] = META_CAPAS_BIDAT['munistgo_aseo_zonas_residuos_2026'];
  META_CAPAS_BIDAT['barrios_santiago_con_zonas_aseo'] = {
    fuente: 'Municipalidad de Santiago — Subdirección de Aseo y Gestión Integral de Residuos',
    archivo_origen: 'Oficio Transparencia MU-18117 / Memorando N° 204 / Catastro Junio 2026',
    descripcion: 'Catastro comunal de los 27 barrios oficiales de la Comuna de Santiago con atributos asociados de zonas de aseo, volumen de contenedores y tasas de operatividad.',
    cobertura: '27 Barrios de la Comuna de Santiago (100% comunal)',
    features_salida: 27,
    crs_entrada: 'EPSG:32719 (WGS 84 / UTM Huso 19S)',
    crs_salida: 'EPSG:4326',
    fecha_proceso: '2026-10-22',
    tamano_mb: 0.09,
    archivo_geojson: 'barrios_santiago_con_zonas_aseo.geojson',
    archivo_gpkg: 'barrios_santiago_con_zonas_aseo.gpkg',
    columnas_totales: 43,
    licencia: 'Información Pública Oficial — Ley N° 20.285 de Transparencia (Oficio N° E-1528/2026)'
  };
  META_CAPAS_BIDAT['zonas_aseo'] = META_CAPAS_BIDAT['munistgo_aseo_zonas_residuos_2026'];
  META_CAPAS_BIDAT['aseo_santiago'] = META_CAPAS_BIDAT['munistgo_aseo_zonas_residuos_2026'];
  META_CAPAS_BIDAT['semaforos_rm_uoct_2026'] = {
    fuente: 'UOCT / MTT — Oficio N° 26105 / 2026',
    descripcion: 'Catastro de Cruces e Intersecciones Semaforizadas Conectadas al Sistema de Control de Tránsito RM (3.483 intersecciones operativas en 47 comunas).',
    archivo_geojson: 'semaforos_rm_uoct_2026.geojson',
    columnas_totales: 14,
    tamano_mb: 1.51,
    licencia: 'Información Pública Oficial — Ley N° 20.285 de Transparencia (Solicitud AN001T0026930)'
  };
  META_CAPAS_BIDAT['catastro_predial_sii'] = {
    fuente: 'Servicio de Impuestos Internos (SII) — Catastro Predial Oficial',
    ministerio: 'Ministerio de Hacienda',
    tipo_fuente: 'Oficial (Estado de Chile)',
    descripcion: 'Catastro Oficial de Bienes Raíces del Servicio de Impuestos Internos (SII), correspondiente al Segundo Semestre de 2025. Cobertura de predios urbanos geocodificados con ROL (Comuna-Manzana-Predio), dirección predial, avalúo fiscal y superficies.',
    archivo_geojson: 'capa_catastro_predial_sii.geojson',
    columnas_totales: 8,
    tamano_mb: 75.7,
    temporalidad: 'Segundo Semestre 2025',
    licencia: 'Información Pública Oficial — Ley N° 20.285 de Transparencia (Servicio de Impuestos Internos)',
    citaAPA: 'Servicio de Impuestos Internos [SII]. (2025). Catastro de Bienes Raíces (Segundo Semestre 2025). Ministerio de Hacienda, Gobierno de Chile. https://www.sii.cl'
  };
  META_CAPAS_BIDAT['capa_catastro_predial_sii'] = META_CAPAS_BIDAT['catastro_predial_sii'];
  META_CAPAS_BIDAT['bbdd_46'] = {
    fuente: 'SII / IDE Chile — Catastro Predial Oficial',
    descripcion: 'Catastro Oficial de Predios de la Comuna de Santiago (35.036 roles prediales). Cobertura comunal completa sin recortes ni simplificaciones.',
    archivo_geojson: 'capa_bbdd_46.geojson',
    columnas_totales: 5,
    tamano_mb: 15.79,
    licencia: 'Información Pública Oficial — Servicio de Impuestos Internos / IDE Chile'
  };
  META_CAPAS_BIDAT['capa_bbdd_46'] = META_CAPAS_BIDAT['bbdd_46'];
  META_CAPAS_BIDAT['minvu_ipt_areas_verdes'] = {
    fuente: 'MINVU / INE 2023 — Áreas Verdes Normativas',
    descripcion: 'Catastro Consolidado de Áreas Verdes Urbanas Región Metropolitana (18.173 entidades con tipología, jerarquía y superficie).',
    archivo_geojson: 'ide_minvu_ipt_areas_verdes.geojson',
    columnas_totales: 25,
    tamano_mb: 29.39,
    licencia: 'Datos Abiertos — MINVU / INE'
  };
  META_CAPAS_BIDAT['minvu_patrimonio'] = {
    fuente: 'MINVU — Instrumentos de Planificación Territorial',
    descripcion: 'Zonas de Conservación Histórica e Inmuebles de Conservación Histórica RM (1.690 entidades con decretos oficiales).',
    archivo_geojson: 'ide_minvu_patrimonio.geojson',
    columnas_totales: 16,
    tamano_mb: 3.08,
    licencia: 'Datos Abiertos — DDU MINVU'
  };

  // Aliases directos para los 5 niveles del Censo 2024 (con o sin prefijo ide_)
  META_CAPAS_BIDAT['censo2024_regional'] = META_CAPAS_BIDAT['ide_censo2024_regional'];
  META_CAPAS_BIDAT['censo2024_limite_urbano'] = META_CAPAS_BIDAT['ide_censo2024_limite_urbano'];
  META_CAPAS_BIDAT['censo2024_localidades'] = META_CAPAS_BIDAT['ide_censo2024_localidades'];
  META_CAPAS_BIDAT['censo2024_zonal'] = META_CAPAS_BIDAT['ide_censo2024_zonal'];
  META_CAPAS_BIDAT['censo2024_manzanas'] = META_CAPAS_BIDAT['ide_censo2024_manzanas'];
  META_CAPAS_BIDAT['ide_semaforos_rm_uoct_2026'] = META_CAPAS_BIDAT['semaforos_rm_uoct_2026'];

  META_CAPAS_BIDAT['ine_permisos_edificacion_santiago'] = {
    fuente: 'Instituto Nacional de Estadísticas (INE) / DOM Santiago',
    ministerio: 'Ministerio de Economía, Fomento y Turismo',
    archivo_origen: 'Permisos_Edificacion_Santiago_Consolidado_32719.gpkg',
    archivo_geojson: 'ine_permisos_edificacion_santiago.geojson',
    crs_entrada: 'EPSG:32719 (SIRGAS-Chile / UTM Huso 19 Sur)',
    crs_salida: 'EPSG:32719 (SIRGAS-Chile / UTM Huso 19 Sur)',
    cobertura: 'Comuna de Santiago (1.882 Permisos DOM 2010–2025)',
    features_salida: 1882,
    tamano_mb: 2.13,
    licencia: 'Ley N° 17.374 y Ley N° 20.285 de Transparencia Activa (Datos Abiertos)',
    citaAPA: 'Instituto Nacional de Estadísticas [INE]. (2025). Permisos de Edificación Georreferenciados de la Comuna de Santiago (2010–2025). Santiago, Chile. https://www.ine.gob.cl',
    descripcion: 'Puntos georreferenciados de permisos de edificación autorizados por la DOM de Santiago (2010–2025) con estadísticas de unidades aprobadas, pisos y cruce con zonificación PRC y manzanas censales.'
  };

  META_CAPAS_BIDAT['ine_crf_conjuntos_santiago'] = {
    fuente: 'Instituto Nacional de Estadísticas (INE) / DOM Santiago',
    ministerio: 'Ministerio de Economía, Fomento y Turismo',
    archivo_origen: 'CRF_Santiago_Con_Metricas_32719.gpkg',
    archivo_geojson: 'ine_crf_conjuntos_santiago.geojson',
    crs_entrada: 'EPSG:32719 (SIRGAS-Chile / UTM Huso 19 Sur)',
    crs_salida: 'EPSG:32719 (SIRGAS-Chile / UTM Huso 19 Sur)',
    cobertura: 'Comuna de Santiago (403 Conjuntos Habitacionales 2011–2025)',
    features_salida: 403,
    tamano_mb: 0.68,
    licencia: 'Ley N° 20.285 sobre Acceso a la Información Pública (Datos Abiertos)',
    citaAPA: 'Instituto Nacional de Estadísticas [INE]. (2025). Certificados de Recepción Final (CRF) de Conjuntos Habitacionales (2011–2025). Subdepartamento de Geografía. Santiago, Chile. https://www.ine.gob.cl',
    descripcion: 'Polígonos prediales de conjuntos habitacionales con recepción definitiva otorgada por la DOM de Santiago (2011–2025) con métricas morfológicas de Densidad Neta Real (viv/ha), COS, Porcentaje de Suelo Libre, Frente y Fondo Predial.'
  };

  function fila(etiqueta, valor) {
    const esNum = typeof valor === 'number';
    const esBool = typeof valor === 'boolean';
    const esVacio = valor === null || valor === undefined || valor === '' || valor === 'Sin dato';
    let valFmt = '—';
    if (esNum) {
      valFmt = Number.isInteger(valor) ? valor.toLocaleString('es-CL') : valor.toLocaleString('es-CL', { maximumFractionDigits: 4 });
    } else if (esBool) {
      valFmt = valor ? 'Sí' : 'No';
    } else if (!esVacio) {
      valFmt = valor;
    }
    return `<tr><td class="detalle-clave">${etiqueta}</td><td class="detalle-valor ${esNum ? 'num' : (esVacio ? 'vacio' : '')}">${valFmt}</td></tr>`;
  }

  function seccion(titulo, filasHtml) {
    if (!filasHtml || filasHtml.trim() === '') return '';
    return `
      <div class="detalle-seccion">
        <h5 class="detalle-seccion-titulo">${titulo}</h5>
        <table class="detalle-tabla"><tbody>${filasHtml}</tbody></table>
      </div>
    `;
  }

  function abrirSidebarDetalle(props = {}, opciones = {}, idCapa, icono, color) {
    const sidebar = document.getElementById('sidebar-detalle-bidat') || document.getElementById('sidebar-detalle');
    const cuerpo  = document.getElementById('sidebar-detalle-cuerpo');
    const badge   = document.getElementById('sidebar-detalle-badge');
    if (!sidebar || !cuerpo) return;

    // Nombre de la capa para el badge
    const nombreCapa = opciones?.nombre || idCapa || 'Capa';
    if (badge) badge.textContent = icono ? `${icono} ${nombreCapa}` : nombreCapa;

    // Detección rigurosa del tipo de fuente y procedencia jurídica
    const idCapaStr = (idCapa || '').toString().toLowerCase();
    const fuenteProps = (props._fuente || props.fuente || '').toString().toLowerCase();
    const licProps = (props._licencia || props.licencia || '').toString().toLowerCase();

    const esGBIF = Boolean(
      idCapaStr.includes('gbif') ||
      fuenteProps.includes('gbif') ||
      licProps.includes('cc-by') || licProps.includes('creativecommons') ||
      props.datasetKey || props.taxonKey || props.scientificName || props.gbifID
    );

    const idOficial = props._idOficial || opciones?.id || idCapa;
    const defOficial = window.ModuloIDEChile?.obtenerDefinicion ? window.ModuloIDEChile.obtenerDefinicion(idOficial) : (window.ModuloIDEChile?.CAPAS_OFICIALES?.[idOficial] || null);

    const esCapaOficial = Boolean(
      defOficial !== null ||
      props._idOficial ||
      idCapaStr.startsWith('bbdd_') ||
      idCapaStr.startsWith('ide_') ||
      idCapaStr.startsWith('oficial_') ||
      idCapaStr.includes('sii') ||
      idCapaStr.includes('predial') ||
      idCapaStr.includes('censo') ||
      idCapaStr.includes('rsh') ||
      idCapaStr.includes('bip') ||
      idCapaStr.includes('igvust') ||
      idCapaStr.includes('semaforos') ||
      idCapaStr.includes('subdere') ||
      idCapaStr.includes('munistgo') ||
      idCapaStr.includes('mop')
    );

    const esOSM = Boolean(
      !esGBIF && !esCapaOficial && (
        fuenteProps.includes('openstreetmap') ||
        fuenteProps.includes('osm') ||
        licProps.includes('odbl') ||
        idCapaStr.includes('osm') ||
        idCapaStr.startsWith('cat-') ||
        idCapaStr.startsWith('capa_osm') ||
        Boolean(props.osm_id || props.osm_type)
      )
    );

    let meta = {};

    if (esCapaOficial) {
      meta = META_CAPAS_BIDAT[idCapa] || META_CAPAS_BIDAT[props._idOficial] || META_CAPAS_BIDAT[opciones?.id] || {};
      if (defOficial) {
        meta = {
          fuente: meta.fuente || defOficial.institucion || 'Estado de Chile',
          ministerio: meta.ministerio || defOficial.ministerio || 'Organismo del Estado',
          archivo_origen: meta.archivo_origen || defOficial.archivoLocal || `data/${idOficial}.geojson`,
          archivo_geojson: meta.archivo_geojson || (defOficial.archivoLocal ? defOficial.archivoLocal.split('/').pop() : `${idOficial}.geojson`),
          descripcion: meta.descripcion || defOficial.descripcion || defOficial.nombre,
          licencia: meta.licencia || defOficial.declaracion || 'Ley N° 20.285 de Transparencia de la Función Pública',
          citaAPA: meta.citaAPA || defOficial.citaAPA || `Estado de Chile. (2026). ${defOficial.nombre}.`,
          columnas_totales: meta.columnas_totales || null,
          tamano_mb: meta.tamano_mb || null,
          join_tipo: meta.join_tipo,
          clave_join: meta.clave_join,
          cobertura: meta.cobertura,
          features_salida: meta.features_salida,
          features_excluidas: meta.features_excluidas,
          razon_exclusion: meta.razon_exclusion,
          nulos_rellenos: meta.nulos_rellenos,
          crs_entrada: meta.crs_entrada,
          crs_salida: meta.crs_salida || 'EPSG:4326 (WGS 84)',
          fecha_proceso: meta.fecha_proceso,
          nota_critica: meta.nota_critica
        };
      }
    } else if (esGBIF) {
      meta = {
        tipo_fuente: 'Información Geográfica Voluntaria (VGI) / Ciencia Ciudadana Biológica',
        fuente: 'Global Biodiversity Information Facility (GBIF.org) / Nodos Participantes',
        archivo_origen: props._archivoLocal || 'GBIF Occurrence API / Darwin Core Standard',
        archivo_geojson: 'capa_biodiversidad.geojson',
        licencia: props.licencia || props._licencia || 'Creative Commons Atribución (CC-BY 4.0 / CC0)',
        marco_legal: 'Creative Commons CC-BY 4.0 — Libre uso, distribución y adaptación con atribución al observador',
        declaracion: 'Datos de biodiversidad urbana y ciencia ciudadana provistos por GBIF.org y plataformas asociadas.',
        citaAPA: 'GBIF.org. (2026). GBIF Occurrence Download: Registros biológicos en Barrio Brasil y Región Metropolitana. https://doi.org/10.15468/dl',
        crs_salida: 'EPSG:4326 (WGS 84)',
        descripcion: 'Observaciones de biodiversidad urbana y registros taxonómicos obtenidos de GBIF y ciencia ciudadana.'
      };
    } else {
      // esOSM
      const esDeGeofabrik = Boolean(
        fuenteProps.includes('geofabrik') ||
        (props.proveedor && props.proveedor.toLowerCase().includes('geofabrik')) ||
        (props.dataset_origen && props.dataset_origen.toLowerCase().includes('geofabrik')) ||
        (idCapaStr.includes('geofabrik') || idCapaStr.includes('capa_osm_rm'))
      );

      const fuenteNombre = esDeGeofabrik ? 'Geofabrik (Extracto RM)' : 'OpenStreetMap (API Overpass)';
      const metodoDescarga = esDeGeofabrik ? 'Descarga Geofabrik (Dump PBF regional chile-260927.osm.pbf)' : 'Descarga de OpenStreetMap (con la API Overpass en vivo)';
      const proveedorNombre = esDeGeofabrik ? 'Geofabrik GmbH / © Colaboradores de OpenStreetMap' : 'Comunidad OpenStreetMap (© Colaboradores de OpenStreetMap)';
      const archivoVgi = props._archivoLocal ? props._archivoLocal.split('/').pop() :
        (idCapaStr.endsWith('.geojson') ? idCapaStr :
        (idCapaStr.startsWith('capa_') ? `${idCapaStr}.geojson` : `capa_${idCapaStr}.geojson`));

      meta = {
        tipo_fuente: 'Información Geográfica Voluntaria (VGI) / Cartografía Colaborativa Abierta',
        comunidad: proveedorNombre,
        fuente: fuenteNombre,
        metodo_adquisicion: metodoDescarga,
        es_geofabrik: esDeGeofabrik,
        archivo_origen: esDeGeofabrik ? 'chile-260927.osm.pbf (Geofabrik RM)' : (archivoVgi || 'Overpass API en vivo'),
        archivo_geojson: archivoVgi,
        licencia: esDeGeofabrik ? 'Open Database License (ODbL) 1.0 (© OSM / Geofabrik GmbH)' : 'Open Database License (ODbL) 1.0 (© Colaboradores de OpenStreetMap)',
        marco_legal: 'ODbL 1.0 (Open Data Commons) — Libre reutilización y enriquecimiento cartográfico con reciprocidad copyleft',
        declaracion: esDeGeofabrik ? 'Datos cartográficos procedentes del extracto regional de Geofabrik (chile-260927.osm.pbf) bajo licencia ODbL 1.0.' : 'Datos cartográficos y huellas espaciales provistos por © colaboradores de OpenStreetMap bajo licencia ODbL 1.0.',
        citaAPA: esDeGeofabrik ? 'Geofabrik GmbH & OpenStreetMap contributors. (2026). OpenStreetMap Chile Extract [Región Metropolitana]. Geofabrik GmbH. Open Database License (ODbL).' : 'OpenStreetMap contributors. (2026). OpenStreetMap data [Barrio Brasil & RM, Chile]. Open Database License (ODbL). https://www.openstreetmap.org/copyright',
        crs_salida: 'EPSG:4326 (WGS 84) / Compatible con EPSG:32719 (SIRGAS-Chile / UTM 19S)',
        descripcion: esDeGeofabrik ? 'Información geográfica voluntaria comunitaria obtenida de la descarga del dump regional de Geofabrik para la RM.' : 'Información geográfica voluntaria comunitaria extraída en vivo desde OpenStreetMap vía Overpass API.'
      };
    }

    // ── Alerta: Aviso según tipo de capa ──────────────────────────────────
    const totalColsProps = Object.keys(props).filter(k => !k.startsWith('_') && k !== 'geometry').length;
    const totalColsOrigen = meta.columnas_totales || totalColsProps;
    const archivoGeoJSON = meta.archivo_geojson ||
      (idCapa && idCapa.endsWith('.geojson') ? idCapa :
      (props._archivoLocal ? props._archivoLocal.split('/').pop() : `${idCapa}.geojson`));
    const nombreDescarga = archivoGeoJSON.split('/').pop();
    const rutaDescarga = `data/${nombreDescarga}`;
    const tamanoMbStr = meta.tamano_mb ? `${meta.tamano_mb} MB` : 'GeoJSON Completo';

    let alertaColumnasHtml = '';
    if (esCapaOficial) {
      alertaColumnasHtml = `
        <div class="detalle-alerta-columnas" style="background:rgba(234,179,8,0.12); border:1px solid #EAB308; border-left:4px solid #CA8A04; border-radius:6px; padding:12px 14px; margin-bottom:14px; font-family:'IBM Plex Sans',sans-serif;">
          <div style="display:flex; align-items:flex-start; gap:10px;">
            <span style="font-size:1.3rem; line-height:1.2;">🏛️</span>
            <div style="flex:1;">
              <strong style="display:block; color:#EAB308; font-size:0.83rem; font-family:'IBM Plex Mono',monospace; letter-spacing:0.02em; margin-bottom:4px;">
                CAPA OFICIAL DEL ESTADO DE CHILE (IDE CHILE / SNIT)
              </strong>
              <p style="margin:0; font-size:0.78rem; color:var(--tinta-suave,#e2e8f0); line-height:1.45;">
                Información pública oficial del Estado amparada por la <strong>Ley N° 20.285 de Transparencia</strong>. El visor muestra un resumen representativo; el dataset descargable contiene la totalidad de las entidades e indicadores.
              </p>
              <div style="margin-top:9px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                <a href="${rutaDescarga}" download="${nombreDescarga}" class="accion" style="display:inline-flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:700; text-decoration:none; padding:7px 14px; background:linear-gradient(135deg,#06b6d4,#0891b2); color:#000; border-radius:4px; font-family:'IBM Plex Mono',monospace; box-shadow:0 2px 6px rgba(0,0,0,0.3); transition:all 0.15s;">
                  📥 Descargar Capa Oficial (${tamanoMbStr})
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (esOSM) {
      const esGeof = meta.es_geofabrik;
      const rotuloAlerta = esGeof ? 'INFORMACIÓN GEOGRÁFICA VOLUNTARIA — DESCARGA GEOFABRIK (ODbL 1.0)' : 'INFORMACIÓN GEOGRÁFICA VOLUNTARIA — OPENSTREETMAP API OVERPASS (ODbL 1.0)';
      const textoAlerta = esGeof 
        ? 'Cartografía comunitaria de OpenStreetMap extraída del dump regional de Geofabrik (chile-260927.osm.pbf recortado para la RM) bajo licencia <strong>ODbL 1.0</strong>.' 
        : 'Cartografía comunitaria colaborativa abierta descargada en tiempo real desde la API Overpass de OpenStreetMap bajo licencia <strong>ODbL 1.0</strong>.';

      alertaColumnasHtml = `
        <div class="detalle-alerta-columnas" style="background:rgba(6,182,212,0.12); border:1px solid #06b6d4; border-left:4px solid #0891b2; border-radius:6px; padding:12px 14px; margin-bottom:14px; font-family:'IBM Plex Sans',sans-serif;">
          <div style="display:flex; align-items:flex-start; gap:10px;">
            <span style="font-size:1.3rem; line-height:1.2;">🌐</span>
            <div style="flex:1;">
              <strong style="display:block; color:#06b6d4; font-size:0.83rem; font-family:'IBM Plex Mono',monospace; letter-spacing:0.02em; margin-bottom:4px;">
                ${rotuloAlerta}
              </strong>
              <p style="margin:0; font-size:0.78rem; color:var(--tinta-suave,#e2e8f0); line-height:1.45;">
                ${textoAlerta}
              </p>
              <div style="margin-top:9px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                <a href="${rutaDescarga}" download="${nombreDescarga}" class="accion" style="display:inline-flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:700; text-decoration:none; padding:7px 14px; background:linear-gradient(135deg,#06b6d4,#0891b2); color:#000; border-radius:4px; font-family:'IBM Plex Mono',monospace; box-shadow:0 2px 6px rgba(0,0,0,0.3); transition:all 0.15s;">
                  📥 Descargar Capa GeoJSON (${nombreDescarga})
                </a>
                ${props.osm_type && props.osm_id ? `<a href="https://www.openstreetmap.org/${props.osm_type}/${props.osm_id}" target="_blank" rel="noopener" style="font-size:0.75rem; color:#38bdf8; text-decoration:underline; font-family:'IBM Plex Mono',monospace; padding:6px 0;">↗ Ver en openstreetmap.org</a>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;

    } else if (esGBIF) {
      alertaColumnasHtml = `
        <div class="detalle-alerta-columnas" style="background:rgba(16,185,129,0.12); border:1px solid #10b981; border-left:4px solid #059669; border-radius:6px; padding:12px 14px; margin-bottom:14px; font-family:'IBM Plex Sans',sans-serif;">
          <div style="display:flex; align-items:flex-start; gap:10px;">
            <span style="font-size:1.3rem; line-height:1.2;">☘</span>
            <div style="flex:1;">
              <strong style="display:block; color:#10b981; font-size:0.83rem; font-family:'IBM Plex Mono',monospace; letter-spacing:0.02em; margin-bottom:4px;">
                REGISTRO BIOLÓGICO DE CIENCIA CIUDADANA — GBIF (CC-BY 4.0)
              </strong>
              <p style="margin:0; font-size:0.78rem; color:var(--tinta-suave,#e2e8f0); line-height:1.45;">
                Registros de biodiversidad urbana desde GBIF.org y plataformas de ciencia ciudadana bajo licencia abierta <strong>Creative Commons CC-BY 4.0</strong>.
              </p>
              <div style="margin-top:9px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                <a href="${rutaDescarga}" download="${nombreDescarga}" class="accion" style="display:inline-flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:700; text-decoration:none; padding:7px 14px; background:linear-gradient(135deg,#10b981,#059669); color:#fff; border-radius:4px; font-family:'IBM Plex Mono',monospace; box-shadow:0 2px 6px rgba(0,0,0,0.3); transition:all 0.15s;">
                  📥 Descargar Capa GeoJSON (${nombreDescarga})
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ── Sección 1: Identificación del elemento ──────────────────────────
    const nombre = props._nombre || props.nombre || props.name || props.NOMBRE || props.EBI_NOMBRE ||
      (props.codigo_junction ? `Cruce ${props.codigo_junction}: ${props.acceso_1 || ''} / ${props.acceso_2 || ''}` : '') ||
      (props.NOM_COM ? `Comuna ${props.NOM_COM}` : '') ||
      (props.d_COMUNA ? `Comuna ${props.d_COMUNA}` : '') ||
      (props.LOCALIDAD ? `Localidad ${props.LOCALIDAD}` : '') ||
      (props.ENTIDAD ? `Entidad ${props.ENTIDAD}` : '') ||
      '—';
    const subtipo = props._subtipo || props.subtipo || props.EBI_ETAPA_POSTULA || props.amenity || props.shop || props.highway || props.historic || (defOficial ? defOficial.nombre : '—');

    let s1 = '';
    if (props.id_ig) s1 += fila('Identificador Oficial (ID IG)', `<code style="color:var(--musgo); font-family:var(--fuente-datos); font-weight:700;">${props.id_ig}</code>`);
    if (props.id_igv || props.id_vgi) s1 += fila('Identificador IGV', `<code style="color:var(--musgo); font-family:var(--fuente-datos); font-weight:700;">${props.id_igv || props.id_vgi}</code>`);
    s1 += fila('Nombre / Denominación', nombre);
    s1 += fila('Subtipo / Clasificación', subtipo);
    if (props.codigo_junction) s1 += fila('Código Junction (UOCT)', props.codigo_junction);
    if (props.acceso_1) s1 += fila('Intersección Vía 1', props.acceso_1);
    if (props.acceso_2) s1 += fila('Intersección Vía 2', props.acceso_2);
    if (props.marca_control) s1 += fila('Controlador Semafórico', `${props.marca_control} ${props.modelo || ''}`.trim());
    if (props.tipo_cabezal) s1 += fila('Tecnología Cabezal', props.tipo_cabezal);
    if (props.tipo_comunicacion) s1 += fila('Enlace Comunicación', props.tipo_comunicacion);
    if (props.estado) s1 += fila('Estado Operativo', props.estado);
    if (props.vigencia) s1 += fila('Vigencia Oficial', props.vigencia);
    if (props.t_id_uv_ca || props.uv_rsh) s1 += fila('ID Unidad Vecinal', props.t_id_uv_ca || props.uv_rsh);
    if (props.t_com_nom || props.COMUNA || props.comuna || props.d_COMUNA) s1 += fila('Comuna', props.t_com_nom || props.COMUNA || props.comuna || props.d_COMUNA);
    if (props.t_prov_nom || props.PROVINCIA || props.d_PROVINCIA) s1 += fila('Provincia', props.t_prov_nom || props.PROVINCIA || props.d_PROVINCIA);
    if (props.REGION || props.d_REGION) s1 += fila('Región', props.REGION || props.d_REGION);
    if (props.uv_carto) s1 += fila('Número UV', props.uv_carto);
    if (props.CUT || props.CUT_COM) s1 += fila('Código Único Territorial (CUT)', props.CUT || props.CUT_COM);
    if (props.EBI_CODIGO) s1 += fila('Código BIP / SNI', props.EBI_CODIGO);
    if (props.EBI_ANO_POSTULA) s1 += fila('Año Postulación', props.EBI_ANO_POSTULA);
    if (props.EBI_SITUACION) s1 += fila('Situación', props.EBI_SITUACION);
    if (props.EBI_SIMBOLO_MONEDA) s1 += fila('Moneda', props.EBI_SIMBOLO_MONEDA);
    if (props.EBI_COSTO_TOTAL) s1 += fila('Costo Total Proyecto', props.EBI_COSTO_TOTAL);
    if (props.direccion || props.DIRECCION || props.DIRECC) s1 += fila('Dirección', props.direccion || props.DIRECCION || props.DIRECC);
    if (props.operador) s1 += fila('Operador', props.operador);
    if (props.superficie_m2) s1 += fila('Superficie (m² EPSG:32719)', props.superficie_m2);
    if (props.superficie_ha || props.Ha || props.SUP_HA) s1 += fila('Superficie (ha)', props.superficie_ha || props.Ha || props.SUP_HA);

    // ── Sección 2: Datos cuantitativos y variables numéricas ────────────
    let s2 = '';
    let nCols = 0;
    const excluirCols = new Set([
      '_nombre','_subtipo','_fuente','_licencia','_capaId','_idUsuario','_color','_extraInfo','_declaracion','_citaAPA','_idOficial','geometry',
      'OBJECTID','FID','id','ID','CUT','CUT_COM','COD_REGION','COD_PROVINCIA','COD_COMUNA','EBI_CODIGO','superficie_m2','superficie_ha'
    ]);
    for (const [k, v] of Object.entries(props)) {
      if (excluirCols.has(k)) continue;
      if (typeof v === 'number' && nCols < 100) {
        s2 += fila(k, v);
        nCols++;
      }
    }
    if (!s2) s2 = '<p style="font-size:0.78rem; color:var(--tinta-tenue); margin:0;">No hay columnas numéricas adicionales.</p>';

    // ── Sección 3: Atributos del dato y variables de texto ──────────────
    let s3 = '';
    let nText = 0;
    const excluirTexto = new Set([
      ...excluirCols,
      't_reg_ca','t_reg_nom','CUT_REG','REGION','t_prov_nom','PROVINCIA','t_com_nom','COMUNA','comuna',
      'codigo_junction','acceso_1','acceso_2','marca_control','modelo','tipo_cabezal','tipo_comunicacion','estado','vigencia',
      'direccion','DIRECCION','DIRECC','operador','EBI_NOMBRE','EBI_ETAPA_POSTULA','EBI_SITUACION','EBI_SIMBOLO_MONEDA'
    ]);
    for (const [k, v] of Object.entries(props)) {
      if (excluirTexto.has(k)) continue;
      if (typeof v === 'boolean') {
        s3 += fila(k, v);
        nText++;
      } else if (typeof v === 'string' && v !== '' && v !== 'Sin dato' && nText < 100) {
        s3 += fila(k, v);
        nText++;
      }
    }
    if (!s3) s3 = '<p style="font-size:0.78rem; color:var(--tinta-tenue); margin:0;">Sin atributos de texto adicionales.</p>';

    // ── Sección 4: Metadatos de la capa y trazabilidad según procedencia ──
    let s4 = '';
    let tituloSeccion4 = '';

    if (esCapaOficial) {
      tituloSeccion4 = '📂 Metadatos de Origen y Trazabilidad Oficial (IDE Chile)';
      if (props.id_ig) s4 += fila('Identificador Oficial (ID IG)', props.id_ig);
      s4 += fila('Institución Oficial', meta.fuente || props._fuente || 'Estado de Chile');
      if (meta.ministerio) s4 += fila('Ministerio / Cartera', meta.ministerio);
      s4 += fila('Archivo de Origen', meta.archivo_origen || meta.archivo_geojson || '—');
      if (meta.join_tipo) s4 += fila('Tipo de Join Espacial', meta.join_tipo);
      if (meta.clave_join) s4 += fila('Clave de Join', meta.clave_join);
      if (meta.cobertura) s4 += fila('Cobertura Territorial', meta.cobertura);
      if (meta.features_salida) s4 += fila('Total Entidades', meta.features_salida);
      if (meta.features_excluidas !== undefined && meta.features_excluidas !== '—') s4 += fila('Entidades Excluidas', meta.features_excluidas);
      if (meta.razon_exclusion) s4 += fila('Causa de Exclusión', meta.razon_exclusion);
      if (meta.crs_entrada) s4 += fila('CRS de Entrada', meta.crs_entrada);
      s4 += fila('CRS de Salida', props.meta_crs || meta.crs_salida || defOficial?.crs_salida || defOficial?.crs || 'EPSG:32719 (SIRGAS-Chile / UTM Huso 19 Sur)');
      if (meta.fecha_proceso) s4 += fila('Fecha de Procesamiento', meta.fecha_proceso);
      if (meta.tamano_mb) s4 += fila('Tamaño del Dataset', `${meta.tamano_mb} MB`);
      s4 += fila('Marco Legal / Licencia', meta.licencia || props._licencia || 'Ley N° 20.285 de Transparencia de la Función Pública');
      if (meta.citaAPA || props._citaAPA) s4 += fila('Cita Bibliográfica APA', meta.citaAPA || props._citaAPA);
    } else if (esGBIF) {
      tituloSeccion4 = '📂 Metadatos de Origen y Licencia VGI (GBIF)';
      s4 += fila('Tipo de Fuente', 'Información Geográfica Voluntaria (VGI) / Ciencia Ciudadana');
      s4 += fila('Repositorio Global', 'Global Biodiversity Information Facility (GBIF.org)');
      if (props.scientificName) s4 += fila('Nombre Científico', `<em>${props.scientificName}</em>`);
      if (props.taxonRank) s4 += fila('Rango Taxonómico', props.taxonRank);
      if (props.gbifID) {
        s4 += fila('Identificador GBIF', props.gbifID);
        s4 += fila('Ficha en GBIF.org', `<a href="https://www.gbif.org/occurrence/${props.gbifID}" target="_blank" rel="noopener" style="color:var(--musgo,#06b6d4); text-decoration:underline;">Ver registro en gbif.org ↗</a>`);
      }
      s4 += fila('Archivo de Origen', meta.archivo_origen || 'capa_biodiversidad.geojson');
      s4 += fila('CRS de Salida', props.meta_crs || meta.crs_salida || defOficial?.crs_salida || defOficial?.crs || 'EPSG:32719 (SIRGAS-Chile / UTM Huso 19 Sur)');
      s4 += fila('Marco Legal / Licencia', meta.licencia || 'Creative Commons CC-BY 4.0 / CC0 1.0 Universal');
      s4 += fila('Declaración de Derechos', meta.declaracion || 'Datos abiertos de biodiversidad provistos por GBIF.org');
      s4 += fila('Cita Bibliográfica APA', meta.citaAPA);
    } else {
      // Por defecto para cualquier elemento VGI / OpenStreetMap
      tituloSeccion4 = meta.es_geofabrik ? '📂 Metadatos de Origen y Licencia VGI (Descarga Geofabrik)' : '📂 Metadatos de Origen y Licencia VGI (OpenStreetMap API)';
      s4 += fila('Tipo de Fuente', 'Información Geográfica Voluntaria (VGI)');
      s4 += fila('Fuente Específica', meta.fuente);
      s4 += fila('Método de Descarga', meta.metodo_adquisicion);
      s4 += fila('Comunidad / Proveedor', meta.comunidad);
      const idIgvVal = props.id_igv || props.id_vgi || (props.osm_type && props.osm_id ? `OSM/${props.osm_type}/${props.osm_id}` : (props.osm_id ? `OSM/${props.osm_id}` : (props.id || '—')));
      s4 += fila('Identificador IGV (OSM ID)', idIgvVal);
      if (props.osm_type && props.osm_id) {
        s4 += fila('Ficha en OpenStreetMap', `<a href="https://www.openstreetmap.org/${props.osm_type}/${props.osm_id}" target="_blank" rel="noopener" style="color:var(--musgo,#06b6d4); text-decoration:underline;">Ver elemento en openstreetmap.org ↗</a>`);
      }
      s4 += fila('Archivo de Origen', meta.archivo_origen);

      if (props.categoria) s4 += fila('Macro-Categoría VGI', props.categoria.toUpperCase());
      if (props.solapamiento_semantico && Array.isArray(props.solapamiento_semantico)) {
        s4 += fila('Solapamiento Semántico', props.solapamiento_semantico.join(' ↔ '));
      }
      s4 += fila('CRS de Salida', props.meta_crs || meta.crs_salida || defOficial?.crs_salida || defOficial?.crs || 'EPSG:32719 (SIRGAS-Chile / UTM Huso 19 Sur)');
      s4 += fila('Marco Legal / Licencia', meta.licencia || 'Open Database License (ODbL) 1.0 (ODC-ODbL)');
      s4 += fila('Declaración de Derechos', meta.declaracion || '© Colaboradores de OpenStreetMap (ODbL 1.0)');
      s4 += fila('Cita Bibliográfica APA', meta.citaAPA || 'OpenStreetMap contributors. (2026). OpenStreetMap data [Barrio Brasil & RM, Chile]. Open Database License (ODbL). https://www.openstreetmap.org/copyright');
    }

    // ── Sección 5: Descripción y nota crítica ───────────────────────────
    const descHtml = (meta.descripcion || meta.nota_critica)
      ? `<div class="detalle-metacalidad">
          ${meta.descripcion ? `<p>${meta.descripcion}</p>` : ''}
          ${meta.nota_critica ? `<p style="margin-top:6px; color:#f59e0b;"><strong>⚠ Nota Crítica:</strong> ${meta.nota_critica}</p>` : ''}
         </div>`
      : '';

    // ── Render completo ─────────────────────────────────────────────────
    cuerpo.innerHTML = [
      alertaColumnasHtml,
      seccion('🏷 Identificación del Elemento', s1),
      seccion('📊 Indicadores Numéricos y Variables', s2),
      seccion('📋 Atributos del Dato y Tipologías', s3),
      seccion(tituloSeccion4, s4),
      descHtml ? seccion('📖 Descripción de la Capa', descHtml) : ''
    ].join('');

    // Abrir panel debajo del mapa y desplazamiento suave
    sidebar.classList.add('abierto');
    setTimeout(() => {
      try {
        sidebar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (_) {}
    }, 80);
  }

  function cerrarSidebarDetalle() {
    const sidebar = document.getElementById('sidebar-detalle-bidat') || document.getElementById('sidebar-detalle');
    if (sidebar) {
      sidebar.classList.remove('abierto');
      const badge = document.getElementById('sidebar-detalle-badge');
      if (badge) badge.textContent = '—';
      const cuerpo = document.getElementById('sidebar-detalle-cuerpo');
      if (cuerpo) {
        cuerpo.innerHTML = `
          <p style="color:var(--tinta-suave); font-size:0.88rem; text-align:center; padding:28px 16px; grid-column:1/-1; line-height:1.6;">
            Haz clic en cualquier elemento cartográfico en el mapa y luego pulsa en <strong style="color:var(--musgo)">Más detalles →</strong> dentro de la ventana emergente para inspeccionar todas sus variables, atributos, tipologías y metadatos con máxima amplitud horizontal.
          </p>
        `;
      }
    }
  }

  function exportarCapaPorId(idCapa) {
    if (capasTematicasActivas[idCapa]) {
      const gj = capasTematicasActivas[idCapa].toGeoJSON();
      const reg = registroCapasTematicas[idCapa];
      if (gj && gj.features) {
        gj.features.forEach(f => {
          f.properties = f.properties || {};
          let colorSimbologia = '#06b6d4';
          try {
            colorSimbologia = resolverColorFeature(f, idCapa, reg?.opciones?.color);
          } catch (_) {}
          f.properties['marker-color'] = colorSimbologia;
          f.properties['stroke'] = colorSimbologia;
          f.properties['fill'] = colorSimbologia;
          f.properties['fill-opacity'] = 0.85;
          f.properties['stroke-width'] = 2;
          f.properties['simbologia_color'] = colorSimbologia;
          if (reg && reg.config) {
            f.properties['simbologia_modo'] = reg.config.modo || 'plano';
            if (reg.config.columna) f.properties['simbologia_columna'] = reg.config.columna;
            if (reg.config.rampa) f.properties['simbologia_rampa'] = reg.config.rampa;
            if (reg.config.paletaCat) f.properties['simbologia_paleta'] = reg.config.paletaCat;
          }
        });
      }
      if (typeof ModuloMetadatos !== 'undefined' && ModuloMetadatos.descargarGeoJSONEnriquecido) {
        ModuloMetadatos.descargarGeoJSONEnriquecido(gj, { id: idCapa }, `capa_${idCapa}_con_metadatos.geojson`);
        return true;
      }
      const blob = new Blob([JSON.stringify(gj, null, 2)], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `capa_${idCapa}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    }
    return false;
  }

  // Inicializar listeners del sidebar (botón cerrar, tecla Escape y delegación de clics)
  if (typeof document !== 'undefined') {
    function inicializarListenersSidebar() {
      const btnCerrar = document.getElementById('btn-cerrar-detalle');
      if (btnCerrar) btnCerrar.onclick = cerrarSidebarDetalle;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inicializarListenersSidebar);
    } else {
      inicializarListenersSidebar();
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarSidebarDetalle();
    });

    // Delegación global para botones "Más detalles →" en cualquier popup
    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest && (e.target.closest('.btn-mas-detalles-popup') || (e.target.id && e.target.id.startsWith('btn-mas-detalle-') ? e.target : null));
      if (btn && layerActivoPopup && layerActivoPopup._atlasProps) {
        e.preventDefault();
        e.stopPropagation();
        abrirSidebarDetalle(
          layerActivoPopup._atlasProps,
          layerActivoPopup._atlasOpciones,
          layerActivoPopup._atlasIdCapa,
          layerActivoPopup._atlasIcono,
          layerActivoPopup._atlasColor
        );
        if (mapa) mapa.closePopup();
      }
    });
  }

  return {
    inicializar,
    actualizarRectanguloBbox,
    encuadrarBbox,
    encuadrarCapa: (id, ops = {}) => {
      const reg = registroCapasTematicas[id];
      if (reg && reg.capaLeaflet) encuadrarCapaDeFormaRacional(reg.capaLeaflet, ops);
    },
    activarModoDibujoBbox,
    desactivarModoDibujoBbox,
    cargarCapaGeoJSON,
    removerCapa,
    limpiarTodasLasCapas,
    obtenerGeoJSONCapa,
    obtenerGeoJSONCompleto,
    exportarGeoJSONCargado,
    exportarCapaPorId,
    abrirSidebarDetalle,
    cerrarSidebarDetalle,
    cambiarTerritorio,
    invalidarTamano,
    alternarCapaWMS,
    removerCapaWMS,
    obtenerCapasWMSActivas,
    obtenerInstanciaMapa: () => mapa,
    aplicarSimbologiaACapa,
    determinarSimbologiaPredeterminada,
    restablecerSimbologia: (id) => {
      const reg = registroCapasTematicas[id];
      if (reg) {
        const def = determinarSimbologiaPredeterminada(reg.idCapa, reg.geojson, reg.opciones);
        reg.config = def;
        aplicarSimbologiaACapa(id, def);
        if (capaActivaSimbologiaId === id) {
          sincronizarControlesConCapaActiva();
        }
      }
    },
    obtenerRegistroCapas: () => registroCapasTematicas,
    sincronizarSelectorCapasSimbologia,
    actualizarLeyendaCartograficaVisor,
    inicializarControlSimbologia,
    RAMPAS_CUANTITATIVAS,
    PALETAS_CATEGORICAS,
    COLORES_CATEGORIA
  };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try { ModuloMapa.inicializarControlSimbologia(); } catch (_) {}
    });
  } else {
    setTimeout(() => {
      try { ModuloMapa.inicializarControlSimbologia(); } catch (_) {}
    }, 60);
  }
}

if (typeof window !== 'undefined') {
  window.ModuloMapa = ModuloMapa;
}
