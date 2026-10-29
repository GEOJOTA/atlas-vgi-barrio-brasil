/*
  mapa.js
  -------
  Módulo de visualización cartográfica con Leaflet para el Atlas VGI.
  Maneja:
  - Inicialización del visor cartográfico en el territorio predeterminado (Barrio Brasil / UAH).
  - Selección de capas base (Carto Positron, OSM Estándar, Topográfico).
  - Herramienta de visualización y dibujo interactivo del Bounding Box (sincronizada con inputs).
  - Selector de territorios predefinidos (Barrio Brasil UAH, Santiago Centro, etc.).
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

  function inicializar(idContenedor = 'mapa-atlas') {
    const el = document.getElementById(idContenedor);
    if (!el || mapa) return;

    const cfg = window.NODO_CONFIG || {};
    const centro = cfg.area_por_defecto?.centro || [-33.4445, -70.6620];
    const zoom = cfg.area_por_defecto?.zoom || 16;

    // Capas base de libre acceso sin llave API
    const cartoPositron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });

    const osmEstandar = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> colaboradores',
      maxZoom: 19
    });

    const openTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; OSM contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
      maxZoom: 17
    });

    mapa = L.map(idContenedor, {
      center: centro,
      zoom: zoom,
      layers: [cartoPositron],
      zoomControl: true,
      preferCanvas: true
    });

    const mapasBase = {
      'Carto Positron (Limpio)': cartoPositron,
      'OpenStreetMap Estándar': osmEstandar,
      'Relieve Topográfico (OpenTopo)': openTopo
    };

    L.control.layers(mapasBase, null, { position: 'topright' }).addTo(mapa);
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(mapa);

    grupoCapasTematicas = L.featureGroup().addTo(mapa);

    // Pintar el bbox inicial
    if (cfg.area_por_defecto?.bbox) {
      actualizarRectanguloBbox(cfg.area_por_defecto.bbox);
    }

    configurarEventosDibujoBbox();
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
        fillOpacity: 0.08
      }).addTo(mapa);
      capaBbox.bindTooltip(textoTooltip, { permanent: false, direction: 'top' });
    }
  }

  function encuadrarBbox(bbox) {
    if (!mapa || !bbox) return;
    const [oeste, sur, este, norte] = bbox;
    mapa.fitBounds([[sur, oeste], [norte, este]], { padding: [20, 20] });
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

    const capa = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 6,
          fillColor: color,
          color: '#23281F',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85
        });
      },
      style: (feature) => {
        if (feature.geometry && (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString')) {
          return {
            color: color,
            weight: 3.5,
            opacity: 0.85
          };
        }
        return {
          fillColor: color,
          weight: 1.5,
          opacity: 0.9,
          color: '#23281F',
          fillOpacity: 0.35
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
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
        const esOsmItem = Boolean(
          !esGbifItem && !esOficial && (
            idCapaStrItem.includes('osm') || idCapaStrItem.startsWith('cat-') || idCapaStrItem.startsWith('capa_osm') ||
            (props.fuente && props.fuente.toString().toLowerCase().includes('osm')) ||
            (props._fuente && props._fuente.toString().toLowerCase().includes('osm')) ||
            props.osm_id || props.osm_type
          )
        );
        const nombre = props._nombre || props.nombre || props.name || props.especie || 'Sin denominación';
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
        const fecha = props.fecha || props.fecha_registro || (idCapaStrItem.includes('sii') ? 'Segundo Semestre 2025' : (esOficial ? 'Oficial 2024' : 'No indicada'));
        const subtipo = props._subtipo || props.subtipo || props.fclass || props.amenity || props.shop || props.highway || props.building || props.leisure || props.historic || props.natural || props.landuse || props.railway || props.rubro || (props._idOficial ? 'Oficial' : (esGbifItem ? 'Observación de Biodiversidad' : 'Entidad Cartográfica'));

        let filasExtraInfo = '';
        if (props._extraInfo) {
          Object.keys(props._extraInfo).forEach(k => {
            filasExtraInfo += `<tr><td style="color:#4B5142; width:45%;">${k}:</td><td><strong>${props._extraInfo[k]}</strong></td></tr>`;
          });
        }

        const geomType = feature.geometry?.type || 'Point';
        const rotuloGeometria = geomType === 'Point' ? 'Punto 📍' :
                                (geomType === 'LineString' || geomType === 'MultiLineString') ? 'Línea 〰️' :
                                'Polígono ⬡';

        const idBotonDetalle = `btn-mas-detalle-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
        const contenidoPopup = `
          <div class="popup-vgi" style="font-family:Spectral, Georgia, serif; max-width:260px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
              <span style="font-size:0.75rem; color:${color}; font-weight:bold; font-family:'IBM Plex Mono',monospace;">
                ${icono} ${opciones.nombre || idCapa.toUpperCase()}
              </span>
              <span style="font-size:0.7rem; background:#EDE6D6; color:#4B5142; padding:1px 5px; border-radius:3px; font-weight:600;">
                ${rotuloGeometria}
              </span>
            </div>
            <h4 style="margin:4px 0 6px 0; font-size:1rem; border-bottom:1px solid #C9BFA0; padding-bottom:3px;">
              ${nombre}
            </h4>
            <table style="width:100%; font-size:0.78rem; border-collapse:collapse;">
              ${esOficial ? `<tr><td colspan="2" style="background:#1B4D3E; color:#FFF; font-size:0.68rem; font-family:'IBM Plex Mono',monospace; padding:2px 6px; font-weight:bold; letter-spacing:0.04em; margin-bottom:4px; display:block;">🏛️ CAPA OFICIAL DEL ESTADO DE CHILE</td></tr>` : ''}
              <tr><td style="color:#4B5142; width:38%;">Clasificación:</td><td><strong>${subtipo}</strong></td></tr>
              ${filasExtraInfo}
              ${props.operador ? `<tr><td style="color:#4B5142;">Operador:</td><td>${props.operador}</td></tr>` : ''}
              ${props.direccion && !props._extraInfo?.['Dirección'] ? `<tr><td style="color:#4B5142;">Dirección:</td><td>${props.direccion}</td></tr>` : ''}
              ${props.accesibilidad ? `<tr><td style="color:#4B5142;">Accesible:</td><td>${props.accesibilidad}</td></tr>` : ''}
              ${props.superficie_m2 ? `<tr><td style="color:#4B5142;">Superficie:</td><td><strong>${props.superficie_m2.toLocaleString('es-CL')} m²</strong> <span style="font-size:0.72rem; color:#8F3A2C; font-weight:600;" title="Calculada mediante reproyección conforme a EPSG:32719 (UTM 19S) + Gauss">(EPSG:32719)</span>${props.superficie_ha ? ` <small>(${props.superficie_ha.toLocaleString('es-CL')} ha)</small>` : ''}</td></tr>` : ''}
              <tr><td style="color:#4B5142;">Fuente:</td><td>${fuente}</td></tr>
              <tr><td style="color:#4B5142;">Licencia:</td><td><small>${licencia}</small></td></tr>
              ${props._declaracion ? `<tr><td colspan="2" style="font-size:0.68rem; color:#4B5142; padding-top:4px; border-top:1px dashed #C9BFA0; line-height:1.25;"><em>${props._declaracion}</em></td></tr>` : ''}
              ${props._citaAPA ? `<tr><td colspan="2" style="font-size:0.65rem; color:#35586B; padding-top:2px; font-family:'IBM Plex Mono',monospace;"><strong>Cita:</strong> ${props._citaAPA}</td></tr>` : ''}
            </table>
            <div style="margin-top:8px; border-top:1px solid #C9BFA0; padding-top:6px; text-align:right;">
              <button id="${idBotonDetalle}" class="btn-mas-detalles-popup" style="background:linear-gradient(135deg,#06b6d4,#0891b2); color:#000; border:none; border-radius:5px; padding:6px 14px; font-size:0.75rem; font-weight:700; cursor:pointer; font-family:'IBM Plex Mono',monospace; letter-spacing:0.03em; transition:all 0.2s; box-shadow:0 2px 6px rgba(6,182,212,0.3);" onmouseover="this.style.opacity='0.85'; this.style.transform='translateY(-1px)';" onmouseout="this.style.opacity='1'; this.style.transform='none';">Más detalles →</button>
            </div>
          </div>
        `;
        layer.bindPopup(contenidoPopup);

        // Guardar referencias internas en la entidad vectorial
        layer._atlasProps = props;
        layer._atlasOpciones = opciones;
        layer._atlasIdCapa = idCapa;
        layer._atlasIcono = icono;
        layer._atlasColor = color;

        // Vincular el botón «Más detalles» cada vez que el popup esté activo
        layer.on('popupopen', () => {
          layerActivoPopup = layer;
          const btn = document.getElementById(idBotonDetalle);
          if (btn) {
            btn.onclick = (e) => {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
              abrirSidebarDetalle(props, opciones, idCapa, icono, color);
              layer.closePopup();
            };
          }
        });

      }
    });

    capasTematicasActivas[idCapa] = capa;
    grupoCapasTematicas.addLayer(capa);

    // Ajuste automático de encuadre para que las geometrías aparezcan inmediatamente en pantalla
    if (opciones.ajustarVista !== false && capa.getBounds && capa.getBounds().isValid()) {
      try {
        mapa.fitBounds(capa.getBounds(), { padding: [40, 40], maxZoom: 16 });
      } catch (_) {}

      // Si el contenedor del mapa estaba oculto en una pestaña inactiva (size 0x0), recalcular al mostrarse
      const sz = mapa.getSize ? mapa.getSize() : null;
      if (!sz || sz.x === 0 || sz.y === 0) {
        setTimeout(() => {
          try {
            mapa.invalidateSize();
            if (capa.getBounds().isValid()) {
              mapa.fitBounds(capa.getBounds(), { padding: [40, 40], maxZoom: 16 });
            }
          } catch (_) {}
        }, 150);
      }
    }

    return capa;
  }

  function removerCapa(idCapa) {
    if (capasTematicasActivas[idCapa] && grupoCapasTematicas) {
      grupoCapasTematicas.removeLayer(capasTematicasActivas[idCapa]);
      delete capasTematicasActivas[idCapa];
    }
  }

  function limpiarTodasLasCapas() {
    if (grupoCapasTematicas) {
      grupoCapasTematicas.clearLayers();
      capasTematicasActivas = {};
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

        gj.features.forEach(f => {
          f.properties = f.properties || {};
          f.properties.categoria_capa = id;
          f.properties.meta_capa_id = metaCapa.id || id;
          f.properties.meta_titulo = metaCapa.titulo || id;
          f.properties.meta_institucion = metaCapa.institucion || 'Atlas VGI — Nodo GeoAbierto';
          f.properties.meta_ministerio = metaCapa.ministerio || 'Sector Público / Sociedad Civil';
          f.properties.meta_grupo = metaCapa.grupo || 'general';
          f.properties.meta_tipo_fuente = metaCapa.tipo_fuente || 'VGI (Comunitaria / Abierta)';
          f.properties.meta_temporalidad = metaCapa.temporalidad || '2026';
          f.properties.meta_licencia = metaCapa.licencia || 'ODbL 1.0 / Ley N° 20.285';
          f.properties.meta_cita_apa = metaCapa.cita_apa || `Atlas VGI UAH. (2026). ${metaCapa.titulo || id}.`;
          f.properties.meta_crs = 'EPSG:4326 (WGS 84)';
          f.properties.meta_igv = Number(metaCapa.igv || 100.0);
          f.properties.meta_grado_calidad = metaCapa.grado_calidad || 'A+ (Excelente)';
          f.properties.meta_contacto = metaCapa.contacto || 'nodo-geoabierto@uahurtado.cl';
          f.properties.meta_url_servicio = metaCapa.url_servicio || window.location.href;
          features.push(f);
        });
      }
    });
    return {
      type: 'FeatureCollection',
      name: 'Atlas_VGI_Barrio_Brasil_UAH',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      metadata: {
        estandar: 'ISO 19115-1:2014 / ISO 19157:2023 / Perfil IDE Chile SNIT v2.0',
        fileIdentifier: `urn:uuid:vgi-cl-consolidado-${Date.now()}`,
        title: 'Colección de Capas Activas — Atlas VGI Barrio Brasil UAH',
        organisationName: 'Universidad Alberto Hurtado / Nodo GeoAbierto',
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
    a.download = `atlas-vgi-barrio-brasil-uah-${new Date().toISOString().slice(0, 10)}.geojson`;
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
    if (mapa) {
      setTimeout(() => {
        try {
          mapa.invalidateSize();
          if (bounds && bounds.isValid && bounds.isValid()) {
            mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
          }
        } catch (_) {}
      }, 60);
    }
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
      s4 += fila('CRS de Salida', meta.crs_salida || 'EPSG:4326 (WGS 84)');
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
      s4 += fila('CRS de Salida', meta.crs_salida || 'EPSG:4326 (WGS 84)');
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
      const idVgiVal = props.id_vgi || (props.osm_type && props.osm_id ? `OSM/${props.osm_type}/${props.osm_id}` : (props.osm_id ? `OSM/${props.osm_id}` : (props.id || '—')));
      s4 += fila('Identificador VGI (OSM ID)', idVgiVal);
      if (props.osm_type && props.osm_id) {
        s4 += fila('Ficha en OpenStreetMap', `<a href="https://www.openstreetmap.org/${props.osm_type}/${props.osm_id}" target="_blank" rel="noopener" style="color:var(--musgo,#06b6d4); text-decoration:underline;">Ver elemento en openstreetmap.org ↗</a>`);
      }
      s4 += fila('Archivo de Origen', meta.archivo_origen);

      if (props.categoria) s4 += fila('Macro-Categoría VGI', props.categoria.toUpperCase());
      if (props.solapamiento_semantico && Array.isArray(props.solapamiento_semantico)) {
        s4 += fila('Solapamiento Semántico', props.solapamiento_semantico.join(' ↔ '));
      }
      s4 += fila('CRS de Salida', meta.crs_salida || 'EPSG:4326 (WGS 84)');
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

    // Abrir sidebar
    sidebar.classList.add('abierto');
  }

  function cerrarSidebarDetalle() {
    const sidebar = document.getElementById('sidebar-detalle-bidat') || document.getElementById('sidebar-detalle');
    if (sidebar) sidebar.classList.remove('abierto');
  }

  function exportarCapaPorId(idCapa) {
    if (capasTematicasActivas[idCapa]) {
      const gj = capasTematicasActivas[idCapa].toGeoJSON();
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
    COLORES_CATEGORIA
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloMapa = ModuloMapa;
}
