/*
  evaluador_normativo.js
  ----------------------
  Módulo de Auditoría y Evaluación Normativa Automática del PRC y PRMS
  para el Atlas VGI UAH (Práctica Profesional 2026).
  
  Capacidades:
  1. Identificación geométrica precisa de Zonificación PRC (Santiago), PRMS y Límite Urbano.
  2. Detección de Usos de Suelo Permitidos (UPERM) y Prohibidos (UPROH).
  3. Principio de Exclusión Negativa (Art. 2.1.24 OGUC).
  4. Identificación de Áreas de Riesgo Natural (Art. 2.1.17 OGUC) y Áreas Verdes (Art. 59 LGUC).
  5. Protección Patrimonial (Zonas de Conservación Histórica - ZCH e Inmuebles - ICH).
  6. Evaluación de Dinámica Edificatoria: Permisos de Edificación DOM (INE 2010-2025) y
     Certificados de Recepción Final (CRF 2011-2025) a escala Manzana y Zonificación PRC (Buffer 500 m).
  7. Cálculo e integración de métricas morfológicas:
     - Densidad Neta Real (viv/ha, OGUC Art. 1.1.2)
     - Coeficiente de Ocupación de Suelo (COS)
     - Porcentaje de Patio / Suelo Libre (%)
     - Frente y Fondo Predial OGUC (m) y relación Fondo/Frente.
  8. Emisión de Certificado de Informaciones Normativas VGI (CIN-VGI) descargable en .txt.
*/

const ModuloEvaluadorNormativo = (() => {

  const FUENTES_ORDENANZAS_IPT = [
    {
      institucion: 'Ilustre Municipalidad de Santiago — Asesoría Urbana',
      instrumento: 'Repositorio Histórico de Modificaciones al PRC de Santiago (1990–2024)',
      url: 'https://drive.google.com/drive/folders/1MMxFwr8G3fYCjX2NzO_0yeUIzPN-CSjz',
      descripcion: 'Expedientes oficiales completos de todas las modificaciones, seccionales, enmiendas de altura, protección de cités y postergaciones de permisos de la comuna de Santiago.'
    },
    {
      institucion: 'Ministerio de Vivienda y Urbanismo (MINVU)',
      instrumento: 'Planes Reguladores Comunales (PRC) — Catálogo de la Región Metropolitana',
      url: 'https://portalipt.minvu.cl/',
      descripcion: 'Expedientes digitales oficiales del MINVU. Incluyen texto completo de Ordenanzas Locales, Memorias Explicativas, Planos de Zonificación oficial y decretos modificatorios en Diario Oficial.'
    },
    {
      institucion: 'Biblioteca del Congreso Nacional (BCN — LeyChile)',
      instrumento: 'Marco Jurídico Nacional: LGUC (DFL 458/1975) & OGUC (D.S. 47/1992)',
      url: 'https://www.bcn.cl/leychile/navegar?idNorma=13560',
      descripcion: 'Textos legales actualizados: Art. 2.1.24 OGUC (Principio de exclusión negativa de usos), Art. 2.1.17 OGUC (Áreas de riesgo), Art. 2.1.30 OGUC (Equipamiento) y Art. 116 LGUC (Facultad privativa del CIP).'
    },
    {
      institucion: 'Instituto Nacional de Estadísticas (INE)',
      instrumento: 'Permisos de Edificación (2010-2025) y Recepciones Finales CRF (2011-2025)',
      url: 'https://www.ine.gob.cl/estadisticas/economia/edificacion',
      descripcion: 'Registros oficiales de edificación georreferenciados: unidades autorizadas vs concluidas, densidades netas reales y coeficientes de ocupación de suelo.'
    }
  ];

  const TEXTO_DISCLAIMER_LEGAL = `La información de este Certificado de Informaciones Normativas VGI (CIN-VGI) es una guía técnica de carácter referencial. No reemplaza ni tiene la validez legal de un Certificado de Informaciones Previas (CIP), el cual según el Artículo 116 de la Ley General de Urbanismo y Construcciones (LGUC) solo puede ser emitido por la Dirección de Obras Municipales (DOM) respectiva.`;

  // Normalizador de código de manzana (elimina .0 y espacios)
  function normMz(mz) {
    if (!mz) return '';
    return String(mz).replace(/\.0+$/, '').trim();
  }

  // Algoritmo Point-in-Polygon (Ray casting)
  function puntoEnPoligono(pt, ring) {
    let x = pt[0], y = pt[1];
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      let xi = ring[i][0], yi = ring[i][1];
      let xj = ring[j][0], yj = ring[j][1];
      let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function puntoEnGeometria(lng, lat, geom) {
    if (!geom) return false;
    const pt = [lng, lat];
    if (geom.type === 'Polygon') {
      if (!puntoEnPoligono(pt, geom.coordinates[0])) return false;
      for (let k = 1; k < geom.coordinates.length; k++) {
        if (puntoEnPoligono(pt, geom.coordinates[k])) return false;
      }
      return true;
    } else if (geom.type === 'MultiPolygon') {
      for (let poly of geom.coordinates) {
        if (puntoEnPoligono(pt, poly[0])) {
          let enAgujero = false;
          for (let k = 1; k < poly.length; k++) {
            if (puntoEnPoligono(pt, poly[k])) {
              enAgujero = true;
              break;
            }
          }
          if (!enAgujero) return true;
        }
      }
      return false;
    }
    return false;
  }

  function distanciaMetros(lng1, lat1, lng2, lat2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function obtenerCentroideGeometria(geom) {
    if (!geom) return null;
    if (geom.type === 'Point') {
      return { lng: geom.coordinates[0], lat: geom.coordinates[1] };
    }
    let coords = [];
    if (geom.type === 'Polygon' && geom.coordinates[0]) {
      coords = geom.coordinates[0];
    } else if (geom.type === 'MultiPolygon' && geom.coordinates[0] && geom.coordinates[0][0]) {
      coords = geom.coordinates[0][0];
    }
    if (coords.length === 0) return null;
    let sumLng = 0, sumLat = 0;
    for (let c of coords) {
      sumLng += c[0];
      sumLat += c[1];
    }
    return { lng: sumLng / coords.length, lat: sumLat / coords.length };
  }

  // Mapa de nombres oficiales limpios de capas (evita bbdd_...)
  const NOMBRES_CAPAS_OFICIALES = {
    'minvu_ipt_prc_santiago': { nombre: 'Plan Regulador Comunal (PRC) — Zonificación Santiago', inst: 'MINVU / DOM Santiago' },
    'capa_ipt_prc_comunal': { nombre: 'Plan Regulador Comunal (PRC) — Zonificación Comunal', inst: 'MINVU / DOM' },
    'minvu_ipt_prms_usosuelo': { nombre: 'Plan Regulador Metropolitano de Santiago (PRMS) — Macro-Usos', inst: 'SEREMI MINVU RM' },
    'capa_ipt_prms_metropolitano': { nombre: 'Plan Regulador Metropolitano (PRMS)', inst: 'SEREMI MINVU RM' },
    'minvu_ipt_limite_urbano': { nombre: 'Límite Urbano Oficial (Art. 52 LGUC)', inst: 'MINVU / DDU' },
    'censo2024_limite_urbano': { nombre: 'Límite Urbano Censal (Censo 2024)', inst: 'INE / IDE Chile' },
    'censo2024_manzanas': { nombre: 'Censo 2024 — Manzanas Censales Oficiales', inst: 'Instituto Nacional de Estadísticas (INE)' },
    'ine_permisos_edificacion_santiago': { nombre: 'INE — Permisos de Edificación Georreferenciados (2010–2025)', inst: 'INE / DOM Santiago' },
    'ine_crf_conjuntos_santiago': { nombre: 'INE — Certificados de Recepción Final (CRF) Conjuntos Habitacionales', inst: 'INE / DOM Santiago' },
    'ide_subdere_dpa_comunas': { nombre: 'División Político Administrativa Comunal (DPA)', inst: 'SUBDERE' },
    'capa_bbdd_43': { nombre: 'División Político Administrativa Comunal (DPA)', inst: 'SUBDERE' },
    'bbdd_66': { nombre: 'Unidades Vecinales Oficiales (RSH)', inst: 'Ministerio de Desarrollo Social y Familia' },
    'ide_minvu_unidades_vecinales_rsh': { nombre: 'Unidades Vecinales Oficiales (RSH)', inst: 'Ministerio de Desarrollo Social y Familia' },
    'minvu_ipt_areas_riesgo': { nombre: 'Áreas de Riesgo Normativas (Art. 2.1.17 OGUC)', inst: 'MINVU / DDU' },
    'ide_minvu_ipt_prms_riesgo': { nombre: 'Áreas de Riesgo Metropolitano (PRMS)', inst: 'SEREMI MINVU RM' },
    'minvu_ipt_areas_verdes': { nombre: 'Áreas Verdes y Parques Normativos (Art. 59 LGUC)', inst: 'MINVU' },
    'minvu_patrimonio': { nombre: 'Inmuebles y Zonas de Conservación Histórica (ICH / ZCH)', inst: 'MINVU / DDU' },
    'cmn_sitios_memoria': { nombre: 'Monumentos Nacionales y Sitios Patrimoniales', inst: 'Consejo de Monumentos Nacionales (CMN)' },
    'ide_minvu_campamentos': { nombre: 'Catastro Nacional de Asentamientos Precarios', inst: 'MINVU' },
    'ide_minvu_inventario_humedales': { nombre: 'Inventario Nacional de Humedales Urbanos', inst: 'Ministerio del Medio Ambiente (MMA)' },
    'munistgo_aseo_zonas_residuos_2026': { nombre: 'Catastro Comunal de Zonas de Aseo y Residuos', inst: 'I. Municipalidad de Santiago' }
  };

  /**
   * Consulta exhaustiva para un punto geográfico
   */
  function consultarPuntoNormativo(lat, lng, capas) {
    if (!capas) {
      if (typeof window !== 'undefined') {
        capas = {
          ...(window.CAPAS_GEOJSON || {}),
          ...(window.capasOficialesCargadas || {})
        };
      } else {
        capas = {};
      }
    }

    const res = {
      coordenadas: { lat, lng },
      timestamp: new Date().toISOString(),
      comunaEspecifica: null,
      capasConsultadas: [],
      prc: null,
      zonaPRC: null,
      prms: null,
      limiteUrbano: false,
      manzana: null,
      areasRiesgo: [],
      areasVerdes: [],
      patrimonio: [],
      unidadVecinal: null,
      edificacion: {
        crfPredioExacto: null,
        manzana: {
          manzent: null,
          nombreBarrio: null,
          permisosCount: 0,
          permisosUnidades: 0,
          permisosSuperficieM2: 0,
          permisosPisosMax: 0,
          permisosDestinos: [],
          crfCount: 0,
          crfViviendas: 0,
          densidadNetaMedia: 0,
          cosMedio: 0,
          sueloLibreMedio: 0,
          frenteMedio: 0,
          fondoMedio: 0,
          relacionFondoFrenteMedia: 0
        },
        zonificacion500m: {
          zonaPRC: null,
          bufferMetros: 500,
          permisosCount: 0,
          permisosUnidades: 0,
          permisosSuperficieM2: 0,
          permisosPisosPromedio: 0,
          permisosDestinos: [],
          crfCount: 0,
          crfViviendas: 0,
          densidadNetaMedia: 0,
          cosMedio: 0,
          sueloLibreMedio: 0,
          frenteMedio: 0,
          fondoMedio: 0,
          relacionFondoFrenteMedia: 0
        }
      },
      ordenanzasFuentes: FUENTES_ORDENANZAS_IPT,
      disclaimerLegal: TEXTO_DISCLAIMER_LEGAL
    };

    function registrarCapaIntersecada(key) {
      const def = NOMBRES_CAPAS_OFICIALES[key] || {};
      const nombre = def.nombre || (capas[key]?.def?.nombre) || key;
      const inst = def.inst || (capas[key]?.def?.institucion) || 'Estado de Chile';
      if (!res.capasConsultadas.some(c => c.nombre === nombre)) {
        res.capasConsultadas.push({ id: key, nombre, institucion: inst });
      }
    }

    // 1. DPA Comunas
    const capaDPA = capas['ide_subdere_dpa_comunas'] || capas['capa_bbdd_43'];
    if (capaDPA && capaDPA.features) {
      for (let f of capaDPA.features) {
        if (puntoEnGeometria(lng, lat, f.geometry)) {
          const props = f.properties || {};
          const nomCom = props.COMUNA || props.NOM_COMUNA || props.NOM_COM || props.CUT_COM;
          if (nomCom) res.comunaEspecifica = nomCom;
          registrarCapaIntersecada('ide_subdere_dpa_comunas');
          break;
        }
      }
    }

    // 2. Zonificación PRC Comunal (Santiago)
    const capaPRC = capas['minvu_ipt_prc_santiago'] || capas['capa_ipt_prc_comunal'];
    if (capaPRC && capaPRC.features) {
      for (let f of capaPRC.features) {
        if (puntoEnGeometria(lng, lat, f.geometry)) {
          const props = f.properties || {};
          const comunaNom = props.COMUNA || props.COMUNA_ORIGEN || props.NOM_COMUNA || props.NOM_COM || res.comunaEspecifica || 'Santiago';
          const zonaCod = (props.ZONA || props.NOM_ZONA || props.CODIGO || 'Regulada').trim().toUpperCase();
          const zonaNombre = props.NOM_ZONA || props.NOMBRE || props.DESCRIP || `Zona Normativa ${zonaCod}`;
          const instNom = props.INSTRUM || props.PRC || `Plan Regulador Comunal de ${comunaNom}`;
          const fechaDO = props.P_DO || props.FECHA_DO || props.FECHA || (props.N_DOC ? `Doc. N° ${props.N_DOC}` : null);
          const normaDec = props.N_DOC ? `Resolución / Decreto N° ${props.N_DOC}${fechaDO ? ` (D.O. ${fechaDO})` : ''}` : (fechaDO ? `Publicación D.O. ${fechaDO}` : 'Ordenanza Local Vigente');

          res.prc = {
            comuna: comunaNom,
            zona: zonaCod,
            codigo: zonaCod,
            nombreZona: zonaNombre,
            instrumento: instNom,
            decreto: normaDec,
            fechaPublicacion: fechaDO || 'Consultar Diario Oficial',
            articuloOrdenanza: props.NORMA || props.ARTICULO || `Ordenanza Local del PRC de ${comunaNom}`,
            usosPermitidos: props.UPERM || props.USO_PERM || 'Residencial y equipamiento de acuerdo al cuadro de usos de la zona.',
            usosProhibidos: props.UPROH || props.USO_PROH || 'Industrias molestas, acopio masivo, talleres pesados y todo uso no mencionado expresamente (Art. 2.1.24 OGUC).',
            alturaMax: props.ALT_MAX || props.ALTURA || props.NORMA || 'Según rasantes y distanciamientos OGUC',
            densidadMax: props.DENSIDAD || 'Según norma de zona',
            propiedadesOriginales: props
          };
          if (!res.comunaEspecifica && comunaNom) res.comunaEspecifica = comunaNom;
          registrarCapaIntersecada('minvu_ipt_prc_santiago');
          break;
        }
      }
    }
    res.zonaPRC = res.prc;

    // 3. PRMS Usos Metropolitanos
    const capaPRMS = capas['minvu_ipt_prms_usosuelo'] || capas['capa_ipt_prms_metropolitano'];
    if (capaPRMS && capaPRMS.features) {
      for (let f of capaPRMS.features) {
        if (puntoEnGeometria(lng, lat, f.geometry)) {
          const props = f.properties || {};
          res.prms = {
            macroZona: props.ZONA || props.NOMBRE || props.SECTOR || 'Zona Metropolitana',
            usoPreferente: props.UPREF || props.USO || props.TIPO || 'Área Urbana Metropolitano',
            normativa: props.NORMA || 'Capítulo 8.3 PRMS'
          };
          registrarCapaIntersecada('minvu_ipt_prms_usosuelo');
          break;
        }
      }
    }

    // 4. Límite Urbano Oficial
    const capaLU = capas['minvu_ipt_limite_urbano'] || capas['censo2024_limite_urbano'];
    if (capaLU && capaLU.features) {
      for (let f of capaLU.features) {
        if (puntoEnGeometria(lng, lat, f.geometry)) {
          res.limiteUrbano = true;
          registrarCapaIntersecada('censo2024_limite_urbano');
          break;
        }
      }
    }

    // 5. Manzana Censal Oficial (Censo 2024 / Síntesis)
    const capaMZ = capas['censo2024_manzanas'] || capas['sintesis_manzanas'];
    if (capaMZ && capaMZ.features) {
      for (let f of capaMZ.features) {
        if (puntoEnGeometria(lng, lat, f.geometry)) {
          const p = f.properties || {};
          const mCode = normMz(p.MANZENT || p.manzent || p.COD_MANZANA);
          res.manzana = {
            manzent: mCode,
            nombreBarrio: p.barrio_stgo_nombre || p.nombre_barrio || p.LOCALIDAD || null,
            comuna: p.COMUNA || p.NOM_COMUNA || res.comunaEspecifica
          };
          res.edificacion.manzana.manzent = mCode;
          res.edificacion.manzana.nombreBarrio = res.manzana.nombreBarrio;
          registrarCapaIntersecada('censo2024_manzanas');
          break;
        }
      }
    }

    // 6. Áreas de Riesgo Normativas (Art. 2.1.17 OGUC)
    const capaRiesgo = capas['minvu_ipt_areas_riesgo'] || capas['ide_minvu_ipt_prms_riesgo'];
    if (capaRiesgo && capaRiesgo.features) {
      for (let f of capaRiesgo.features) {
        if (puntoEnGeometria(lng, lat, f.geometry)) {
          const p = f.properties || {};
          res.areasRiesgo.push({
            tipo: p.CAT || p.NOMBRE || p.ZONA || 'Riesgo Natural',
            norma: p.UPROH || p.NORMA || 'Restricción Art. 2.1.17 OGUC',
            fuente: `PRC ${p.COMUNA || 'Comunal'}`
          });
          registrarCapaIntersecada('minvu_ipt_areas_riesgo');
        }
      }
    }

    // 7. Áreas Verdes Normativas IPT
    const capaAV = capas['minvu_ipt_areas_verdes'];
    if (capaAV && capaAV.features) {
      for (let f of capaAV.features) {
        if (puntoEnGeometria(lng, lat, f.geometry)) {
          const p = f.properties || {};
          res.areasVerdes.push({
            nombre: p.NOMBRE || 'Área Verde Normada',
            tipo: p.TIPO_AV || p.TIPO || 'Plaza / Parque',
            superficie: p.Ha ? `${Number(p.Ha).toFixed(2)} ha` : '-'
          });
          registrarCapaIntersecada('minvu_ipt_areas_verdes');
        }
      }
    }

    // 8. Patrimonio (ZCH / ICH)
    const capaPatrimonio = capas['minvu_patrimonio'] || capas['cmn_sitios_memoria'];
    if (capaPatrimonio && capaPatrimonio.features) {
      for (let f of capaPatrimonio.features) {
        const p = f.properties || {};
        if (f.geometry.type === 'Point') {
          const coords = f.geometry.coordinates;
          const dist = distanciaMetros(lng, lat, coords[0], coords[1]);
          if (dist <= 100) {
            res.patrimonio.push({
              nombre: p.NOMBRE || p.name || 'Inmueble Patrimonial',
              categoria: p.CATEGORIA || p.TIPO || 'ICH / Monumento',
              distanciaMetros: Math.round(dist)
            });
            registrarCapaIntersecada('minvu_patrimonio');
          }
        } else if (puntoEnGeometria(lng, lat, f.geometry)) {
          res.patrimonio.push({
            nombre: p.NOMBRE || 'Zona de Conservación Histórica (ZCH)',
            categoria: p.CATEGORIA || 'Zona Protegida IPT',
            distanciaMetros: 0
          });
          registrarCapaIntersecada('minvu_patrimonio');
        }
      }
    }

    // 9. Unidad Vecinal Oficial (RSH)
    const capaUV = capas['bbdd_66'] || capas['ide_minvu_unidades_vecinales_rsh'];
    if (capaUV && capaUV.features) {
      for (let f of capaUV.features) {
        if (puntoEnGeometria(lng, lat, f.geometry)) {
          const p = f.properties || {};
          res.unidadVecinal = {
            numero: p.uv_carto || p.t_uv_nom || p.OBJECTID || 'S/N',
            comuna: p.t_com_nom || p.COMUNA || res.comunaEspecifica || 'Metropolitana'
          };
          registrarCapaIntersecada('bbdd_66');
          break;
        }
      }
    }

    // =========================================================================
    // 10. DINÁMICA EDIFICATORIA: PERMISOS DE EDIFICACIÓN Y CRF (MANZANA Y ZONA 500M)
    // =========================================================================
    const puntoMzCode = res.manzana ? res.manzana.manzent : null;
    const puntoZonaCod = res.prc ? res.prc.zona : null;
    res.edificacion.zonificacion500m.zonaPRC = puntoZonaCod;

    // A) Certificados de Recepción Final (CRF - Polígonos de Conjuntos Habitacionales)
    const capaCRF = capas['ine_crf_conjuntos_santiago'];
    if (capaCRF && capaCRF.features) {
      let crfMzList = [];
      let crfZonaList = [];

      for (let f of capaCRF.features) {
        const p = f.properties || {};
        const fMz = normMz(p.manzent);
        const fZona = (p.zona_prc || '').trim().toUpperCase();

        // 1. ¿El punto cae dentro de este predio con CRF exacto?
        if (puntoEnGeometria(lng, lat, f.geometry)) {
          res.edificacion.crfPredioExacto = {
            viviendas: Number(p.N_VIVIENDA) || 0,
            anioEmision: p.AÑO_EMISION || p['AO_EMISION'] || '2011-2025',
            supTerrenoM2: Number(p.sup_terreno_m2) || 0,
            supEdificadaPlantaM2: Number(p.sup_edificada_planta_m2) || 0,
            densidadNetaRealVivHa: Number(p.densidad_neta_real_viv_ha) || 0,
            coeficienteOcupacionSueloCOS: Number(p.coeficiente_ocupacion_suelo_cos) || 0,
            porcentajePatioSueloLibre: Number(p.porcentaje_patio_suelo_libre) || 0,
            frentePredialOGUC_m: Number(p.frente_predial_oguc_m) || 0,
            fondoPredialOGUC_m: Number(p.fondo_predial_oguc_m) || 0,
            relacionFondoFrente: Number(p.relacion_fondo_frente) || 0,
            nombreBarrio: p.nombre_barrio || null,
            zonaPRC: fZona
          };
          if (!res.edificacion.manzana.manzent && fMz) {
            res.edificacion.manzana.manzent = fMz;
          }
          if (!res.edificacion.manzana.nombreBarrio && p.nombre_barrio) {
            res.edificacion.manzana.nombreBarrio = p.nombre_barrio;
          }
          registrarCapaIntersecada('ine_crf_conjuntos_santiago');
        }

        // 2. Misma Manzana
        if (puntoMzCode && fMz === puntoMzCode) {
          crfMzList.push(p);
        }

        // 3. Misma Zonificación PRC en Buffer 500m
        if (puntoZonaCod && fZona === puntoZonaCod) {
          const centroid = obtenerCentroideGeometria(f.geometry);
          if (centroid) {
            const dist = distanciaMetros(lng, lat, centroid.lng, centroid.lat);
            if (dist <= 500) {
              crfZonaList.push(p);
            }
          }
        }
      }

      // Agregar métricas CRF Manzana
      if (crfMzList.length > 0) {
        registrarCapaIntersecada('ine_crf_conjuntos_santiago');
        res.edificacion.manzana.crfCount = crfMzList.length;
        res.edificacion.manzana.crfViviendas = crfMzList.reduce((acc, x) => acc + (Number(x.N_VIVIENDA) || 0), 0);
        res.edificacion.manzana.densidadNetaMedia = Number((crfMzList.reduce((acc, x) => acc + (Number(x.densidad_neta_real_viv_ha) || 0), 0) / crfMzList.length).toFixed(1));
        res.edificacion.manzana.cosMedio = Number((crfMzList.reduce((acc, x) => acc + (Number(x.coeficiente_ocupacion_suelo_cos) || 0), 0) / crfMzList.length).toFixed(2));
        res.edificacion.manzana.sueloLibreMedio = Number((crfMzList.reduce((acc, x) => acc + (Number(x.porcentaje_patio_suelo_libre) || 0), 0) / crfMzList.length).toFixed(1));
        res.edificacion.manzana.frenteMedio = Number((crfMzList.reduce((acc, x) => acc + (Number(x.frente_predial_oguc_m) || 0), 0) / crfMzList.length).toFixed(1));
        res.edificacion.manzana.fondoMedio = Number((crfMzList.reduce((acc, x) => acc + (Number(x.fondo_predial_oguc_m) || 0), 0) / crfMzList.length).toFixed(1));
        res.edificacion.manzana.relacionFondoFrenteMedia = Number((crfMzList.reduce((acc, x) => acc + (Number(x.relacion_fondo_frente) || 0), 0) / crfMzList.length).toFixed(2));
      }

      // Agregar métricas CRF Zonificación Buffer 500m
      if (crfZonaList.length > 0) {
        registrarCapaIntersecada('ine_crf_conjuntos_santiago');
        res.edificacion.zonificacion500m.crfCount = crfZonaList.length;
        res.edificacion.zonificacion500m.crfViviendas = crfZonaList.reduce((acc, x) => acc + (Number(x.N_VIVIENDA) || 0), 0);
        res.edificacion.zonificacion500m.densidadNetaMedia = Number((crfZonaList.reduce((acc, x) => acc + (Number(x.densidad_neta_real_viv_ha) || 0), 0) / crfZonaList.length).toFixed(1));
        res.edificacion.zonificacion500m.cosMedio = Number((crfZonaList.reduce((acc, x) => acc + (Number(x.coeficiente_ocupacion_suelo_cos) || 0), 0) / crfZonaList.length).toFixed(2));
        res.edificacion.zonificacion500m.sueloLibreMedio = Number((crfZonaList.reduce((acc, x) => acc + (Number(x.porcentaje_patio_suelo_libre) || 0), 0) / crfZonaList.length).toFixed(1));
        res.edificacion.zonificacion500m.frenteMedio = Number((crfZonaList.reduce((acc, x) => acc + (Number(x.frente_predial_oguc_m) || 0), 0) / crfZonaList.length).toFixed(1));
        res.edificacion.zonificacion500m.fondoMedio = Number((crfZonaList.reduce((acc, x) => acc + (Number(x.fondo_predial_oguc_m) || 0), 0) / crfZonaList.length).toFixed(1));
        res.edificacion.zonificacion500m.relacionFondoFrenteMedia = Number((crfZonaList.reduce((acc, x) => acc + (Number(x.relacion_fondo_frente) || 0), 0) / crfZonaList.length).toFixed(2));
      }
    }

    // B) Permisos de Edificación (Puntos georreferenciados)
    const capaPE = capas['ine_permisos_edificacion_santiago'];
    if (capaPE && capaPE.features) {
      let peMzList = [];
      let peZonaList = [];

      for (let f of capaPE.features) {
        if (!f.geometry || f.geometry.type !== 'Point') continue;
        const p = f.properties || {};
        const coords = f.geometry.coordinates;
        const fMz = normMz(p.manzent);
        const fZona = (p.zona_prc || '').trim().toUpperCase();

        // Misma Manzana
        if (puntoMzCode && fMz === puntoMzCode) {
          peMzList.push(p);
        }

        // Misma Zonificación PRC en Buffer 500m
        if (puntoZonaCod && fZona === puntoZonaCod) {
          const dist = distanciaMetros(lng, lat, coords[0], coords[1]);
          if (dist <= 500) {
            peZonaList.push(p);
          }
        }
      }

      // Métricas PE Manzana
      if (peMzList.length > 0) {
        registrarCapaIntersecada('ine_permisos_edificacion_santiago');
        res.edificacion.manzana.permisosCount = peMzList.length;
        res.edificacion.manzana.permisosUnidades = peMzList.reduce((acc, x) => acc + (Number(x.CANTIDAD_UNIDAD) || 0), 0);
        res.edificacion.manzana.permisosSuperficieM2 = Math.round(peMzList.reduce((acc, x) => acc + (Number(x.SUPERFICIE) || 0), 0));
        res.edificacion.manzana.permisosPisosMax = Math.max(...peMzList.map(x => Number(x.NUM_PISOS) || 0));
        const destinos = [...new Set(peMzList.map(x => x.GLOSA_DESTINO || x.USO_DESTINO).filter(Boolean))];
        res.edificacion.manzana.permisosDestinos = destinos.slice(0, 3);
      }

      // Métricas PE Zonificación Buffer 500m
      if (peZonaList.length > 0) {
        registrarCapaIntersecada('ine_permisos_edificacion_santiago');
        res.edificacion.zonificacion500m.permisosCount = peZonaList.length;
        res.edificacion.zonificacion500m.permisosUnidades = peZonaList.reduce((acc, x) => acc + (Number(x.CANTIDAD_UNIDAD) || 0), 0);
        res.edificacion.zonificacion500m.permisosSuperficieM2 = Math.round(peZonaList.reduce((acc, x) => acc + (Number(x.SUPERFICIE) || 0), 0));
        const pisosSum = peZonaList.reduce((acc, x) => acc + (Number(x.NUM_PISOS) || 0), 0);
        res.edificacion.zonificacion500m.permisosPisosPromedio = Number((pisosSum / peZonaList.length).toFixed(1));
        const destinosZ = [...new Set(peZonaList.map(x => x.GLOSA_DESTINO || x.USO_DESTINO).filter(Boolean))];
        res.edificacion.zonificacion500m.permisosDestinos = destinosZ.slice(0, 4);
      }
    }

    return res;
  }

  /**
   * Genera el contenido formateado del Certificado CIN-VGI en formato texto (.txt)
   */
  function generarCertificadoTexto(informe) {
    const c = informe.coordenadas;
    const prc = informe.prc;
    const prms = informe.prms;
    const uv = informe.unidadVecinal;
    const ed = informe.edificacion;
    const comuna = informe.comunaEspecifica || (prc ? prc.comuna : 'Santiago');

    let txtCapas = (informe.capasConsultadas || []).map(cp => `    * [CAPA INTERSECADA]: ${cp.nombre} | Institución: ${cp.institucion}`).join('\n');
    if (!txtCapas) txtCapas = '    * Capas oficiales consultadas en memoria activa.';

    return `================================================================================
REPÚBLICA DE CHILE — UNIVERSIDAD ALBERTO HURTADO
ATLAS DE INFORMACIÓN GEOGRÁFICA VOLUNTARIA & GESTIÓN TERRITORIAL
CERTIFICADO DE INFORMACIONES NORMATIVAS VGI (CIN-VGI)
Ley General de Urbanismo y Construcciones (DFL 458/1975) & OGUC (D.S. 47/1992)
================================================================================

1. ANTECEDENTES DE LA CONSULTA TERRITORIAL DINÁMICA:
   - Fecha y Hora de Emisión: ${new Date().toLocaleString('es-CL')}
   - Coordenadas WGS84: Latitud ${c.lat.toFixed(5)}° S, Longitud ${c.lng.toFixed(5)}° O
   - Sistema Geodésico: SIRGAS-Chile / WGS84 (EPSG:4326) / UTM 19S (EPSG:32719)
   - Comuna Evaluada: ${comuna}
   - Manzana Censal Oficial: ${ed.manzana.manzent ? `Manzana ${ed.manzana.manzent} (${ed.manzana.nombreBarrio || 'Santiago'})` : 'No asociada'}
   - Unidad Vecinal Oficial: ${uv ? `U.V. N° ${uv.numero} (${uv.comuna})` : 'No asociada'}

2. CAPAS E INSTRUMENTOS REVISADOS EN ESTE PUNTO:
${txtCapas}

3. ENCUADRE NORMATIVO EN PLANES REGULADORES OFICIALES:
   - Límite Urbano Oficial: ${informe.limiteUrbano ? 'DENTRO DEL LÍMITE URBANO OFICIAL (Art. 52 LGUC)' : 'ÁREA DE EXTENSIÓN URBANA O CONDICIÓN ESPECIAL'}
   - Instrumento Comunal (PRC): ${prc ? prc.instrumento : 'Sin zonificación comunal específica en la cobertura'}
   - Zonificación PRC: ${prc ? `${prc.zona} — ${prc.nombreZona}` : 'Sin datos de zona en el punto'}
   - Decreto / Aprobación D.O.: ${prc ? prc.decreto : 'No indicado'}
   - Macro-Zonificación Metropolitano (PRMS): ${prms ? `${prms.macroZona} (${prms.usoPreferente})` : 'Área Urbana Metropolitano'}

4. 🏗️ DINÁMICA EDIFICATORIA, PERMISOS DOM Y RECEPCIONES FINALES (CRF) INE:
   - [ALERTA METODOLÓGICA DE COBERTURA]: Los resultados arrojados no representan el universo total del punto muestreado sino que están basados en los datos (recepción final (2011-2025) y permisos de edificación (2010-2025)) disponibles públicamente.
   [A] Escala Manzana Censal Inmediata (${ed.manzana.manzent || 'S/N'}):
       * Permisos de Edificación DOM: ${ed.manzana.permisosCount} permisos | ${ed.manzana.permisosUnidades} unidades autorizadas | ${ed.manzana.permisosSuperficieM2.toLocaleString()} m² construidos | Pisos máx: ${ed.manzana.permisosPisosMax}
       * Recepciones Finales (CRF): ${ed.manzana.crfCount} conjuntos recepcionados | ${ed.manzana.crfViviendas} viviendas habitables
       * Densidad Neta Real Media: ${ed.manzana.densidadNetaMedia} viv/ha (OGUC Art. 1.1.2)
       * Coeficiente Ocupación de Suelo (COS) Medio: ${ed.manzana.cosMedio}
       * Porcentaje de Patio / Suelo Libre Medio: ${ed.manzana.sueloLibreMedio}%
       * Morfología Predial OGUC: Frente medio ${ed.manzana.frenteMedio} m | Fondo medio ${ed.manzana.fondoMedio} m

   [B] Escala Zonificación PRC ${ed.zonificacion500m.zonaPRC || ''} (Entorno Buffer 500 m):
       * Permisos de Edificación DOM: ${ed.zonificacion500m.permisosCount} permisos | ${ed.zonificacion500m.permisosUnidades} unidades autorizadas | ${ed.zonificacion500m.permisosSuperficieM2.toLocaleString()} m² | Pisos prom: ${ed.zonificacion500m.permisosPisosPromedio}
       * Recepciones Finales (CRF): ${ed.zonificacion500m.crfCount} conjuntos concluidos | ${ed.zonificacion500m.crfViviendas} viviendas efectivas
       * Densidad Neta Real Zonal Media: ${ed.zonificacion500m.densidadNetaMedia} viv/ha
       * COS Zonal Medio: ${ed.zonificacion500m.cosMedio} | Suelo Libre Zonal Medio: ${ed.zonificacion500m.sueloLibreMedio}%
       * Frente Predial Promedio: ${ed.zonificacion500m.frenteMedio} m | Fondo Medio: ${ed.zonificacion500m.fondoMedio} m

5. CONDICIONES URBANÍSTICAS Y USOS DE SUELO:
   - Usos de Suelo Permitidos (UPERM):
     ${prc ? prc.usosPermitidos : 'No aplica'}

   - Usos Expresamente Prohibidos (UPROH):
     ${prc ? prc.usosProhibidos : 'No aplica'}

   - Principio de Exclusión Negativa (Art. 2.1.24 OGUC):
     "Todo uso, destino o actividad no mencionado expresamente como permitido en la Ordenanza Local se entiende legalmente prohibido."

6. GRAVÁMENES Y RESTRICCIONES NORMATIVAS:
   - Áreas de Riesgo Natural (Art. 2.1.17 OGUC):
     ${informe.areasRiesgo.length > 0 ? informe.areasRiesgo.map(r => `* [ALERTA] ${r.tipo}: ${r.norma} (${r.fuente})`).join('\n     ') : 'Ninguna restricción por riesgo registrada en esta ubicación.'}
   - Áreas Verdes Normativas (Art. 59 LGUC):
     ${informe.areasVerdes.length > 0 ? informe.areasVerdes.map(a => `* ${a.nombre} (${a.tipo} - ${a.superficie})`).join('\n     ') : 'Punto no afecto a declaratoria de parque de utilidad pública.'}
   - Protección Patrimonial (ZCH / ICH / Ley N° 17.288 CMN):
     ${informe.patrimonio.length > 0 ? informe.patrimonio.map(p => `* [PATRIMONIO] ${p.nombre} [${p.categoria}] (${p.distanciaMetros === 0 ? 'En zona protegida' : `${p.distanciaMetros} m`})`).join('\n     ') : 'Fuera del perímetro inmediato de conservación histórica.'}

7. ENLACE A EXPEDIENTES OFICIALES:
   - Repositorio Oficial Expedientes DOM (Google Drive MuniStgo): https://drive.google.com/drive/folders/1MMxFwr8G3fYCjX2NzO_0yeUIzPN-CSjz

8. AVISO LEGAL:
${TEXTO_DISCLAIMER_LEGAL}

================================================================================
Generado dinámicamente por: Atlas VGI UAH — Sistema Abierto de Información Territorial.
================================================================================`;
  }

  /**
   * Renderiza el HTML dinámico de la Ficha Normativa (HUD)
   */
  function renderizarFichaNormativaHTML(inf) {
    const c = inf.coordenadas;
    const prc = inf.prc;
    const prms = inf.prms;
    const ed = inf.edificacion;
    const tieneRiesgo = inf.areasRiesgo.length > 0;
    const esUrbano = inf.limiteUrbano;
    const comuna = inf.comunaEspecifica || (prc ? prc.comuna : 'Santiago');

    let htmlCapas = (inf.capasConsultadas || []).map(cp => `
      <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(14,165,233,0.3); border-radius:6px; padding:6px 10px; font-size:0.82rem;">
        <strong style="color:var(--agua);">${cp.nombre}</strong><br>
        <span style="color:var(--tinta-tenue); font-size:0.75rem;">🏛️ ${cp.institucion}</span>
      </div>
    `).join('');

    return `
      <div class="ficha-normativa-hud">
        <!-- Encabezado de Geolocalización -->
        <div class="ficha-normativa-header">
          <span class="badge-alerta-normativa ${tieneRiesgo ? 'peligro' : 'seguro'}">
            ${tieneRiesgo ? '⚠️ ATENCIÓN: ÁREA AFECTA A RESTRICCIÓN DE RIESGO NATURAL (Art. 2.1.17 OGUC)' : '✅ PUNTO AUDITADO CON INFORMACIÓN NORMATIVA Y MORFOLÓGICA'}
          </span>
          <span class="ficha-normativa-id">
            📍 LAT ${c.lat.toFixed(5)}° S | LON ${c.lng.toFixed(5)}° O // COMUNA: <strong>${comuna.toUpperCase()}</strong>
          </span>
        </div>

        <div class="ficha-normativa-cuerpo">

          <!-- Tarjeta 1: Capas e Instrumentos Revisados en este Punto -->
          <div class="caja-tarjeta-normativa" style="border-left:4px solid var(--agua);">
            <span class="etiqueta-normativa-card" style="color:var(--agua);">📖 Capas e Instrumentos Revisados en este Punto:</span>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:6px; margin-top:8px;">
              ${htmlCapas || '<span style="font-size:0.85rem; color:var(--tinta-suave);">Capas oficiales evaluadas en el punto.</span>'}
            </div>
          </div>

          <!-- Tarjeta 2: Plan Regulador Comunal y Zonificación -->
          <div class="caja-tarjeta-normativa">
            <span class="etiqueta-normativa-card">🏛️ Plan Regulador Comunal y Zonificación (${comuna}):</span>
            ${prc ? `
              <div class="valor-normativo-destacado">${prc.zona} — ${prc.nombreZona}</div>
              <div class="meta-ordenanza-prc" style="margin-top:6px; font-size:0.92rem; color:var(--tinta-suave); line-height:1.6;">
                📜 <strong>Instrumento:</strong> ${prc.instrumento}<br>
                ⚖️ <strong>Decreto / Publicación:</strong> ${prc.decreto}<br>
                📑 <strong>Artículo / Norma:</strong> ${prc.articuloOrdenanza}
              </div>
            ` : `
              <div style="padding:10px; background:rgba(245, 158, 11, 0.1); border-radius:6px; font-size:0.9rem; color:var(--ocre); margin-top:6px;">
                ⚠️ <strong>Sin zonificación comunal PRC activa registrada en este punto exacto.</strong>
                <br><span style="font-size:0.82rem; color:var(--tinta-suave);">El punto se rige por las normas intercomunales del PRMS o está en transición normativa.</span>
              </div>
            `}
            <div class="grilla-2col-normativa" style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--linea);">
              <div>
                <span style="font-size:0.8rem; color:var(--tinta-tenue); display:block; text-transform:uppercase; font-weight:700;">Límite Urbano Oficial (Art. 52 LGUC):</span>
                <strong style="color:${esUrbano ? '#34d399' : '#f59e0b'}; font-size:0.95rem;">${esUrbano ? '✅ Dentro del Límite Urbano Oficial' : '⚠️ Área de Extensión / Condición Especial'}</strong>
              </div>
              ${prms ? `
                <div>
                  <span style="font-size:0.8rem; color:var(--tinta-tenue); display:block; text-transform:uppercase; font-weight:700;">Plan Regulador Metropolitano (PRMS):</span>
                  <strong style="color:var(--tinta); font-size:0.95rem;">${prms.macroZona} (${prms.usoPreferente})</strong>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Tarjeta 3: DINÁMICA EDIFICATORIA, PERMISOS DOM Y RECEPCIONES FINALES (CRF) INE -->
          <div class="caja-tarjeta-normativa" style="border-left:4px solid #10b981; background:rgba(16, 185, 129, 0.04);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:gap; gap:8px;">
              <span class="etiqueta-normativa-card" style="color:#10b981;">🏗️ DINÁMICA EDIFICATORIA, PERMISOS DOM Y RECEPCIONES FINALES (CRF) INE:</span>
              <span style="font-size:0.78rem; background:rgba(16, 185, 129, 0.2); color:#10b981; padding:3px 8px; border-radius:4px; font-weight:700;">Métricas LGUC / OGUC</span>
            </div>

            <div class="alerta-cobertura-edificatoria" style="background:rgba(234, 179, 8, 0.12); border:1px solid #EAB308; border-left:4px solid #CA8A04; border-radius:6px; padding:10px 14px; margin:10px 0 12px 0; font-size:0.83rem; color:var(--tinta-suave, #e2e8f0); line-height:1.5;">
              ⚠️ <strong>Alerta Metodológica de Cobertura:</strong> Los resultados arrojados no representan el universo total del punto muestreado sino que están basados en los datos (recepción final (2011-2025) y permisos de edificación (2010-2025)) disponibles públicamente.
            </div>

            ${ed.crfPredioExacto ? `
              <div style="background:rgba(16, 185, 129, 0.12); border:1.5px solid #10b981; border-radius:8px; padding:10px 12px; margin:10px 0;">
                <strong style="color:#10b981; font-size:0.95rem;">🏢 Predio Intersecado con Certificado de Recepción Final (CRF):</strong>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:8px; margin-top:8px; font-size:0.85rem; color:var(--tinta-suave);">
                  <div>🏠 <strong>Viviendas:</strong> ${ed.crfPredioExacto.viviendas} viv.</div>
                  <div>📐 <strong>Densidad Neta Real:</strong> <span style="color:#34d399; font-weight:700;">${ed.crfPredioExacto.densidadNetaRealVivHa.toLocaleString()} viv/ha</span></div>
                  <div>📊 <strong>COS Real:</strong> <strong>${ed.crfPredioExacto.coeficienteOcupacionSueloCOS}</strong></div>
                  <div>🌿 <strong>Suelo Libre / Patio:</strong> <strong>${ed.crfPredioExacto.porcentajePatioSueloLibre}%</strong></div>
                  <div>📏 <strong>Frente Predial:</strong> ${ed.crfPredioExacto.frentePredialOGUC_m} m</div>
                  <div>📐 <strong>Fondo Predial:</strong> ${ed.crfPredioExacto.fondoPredialOGUC_m} m</div>
                  <div>📅 <strong>Año Recepción:</strong> ${ed.crfPredioExacto.anioEmision}</div>
                  <div>🗺️ <strong>Barrio:</strong> ${ed.crfPredioExacto.nombreBarrio || 'Santiago'}</div>
                </div>
              </div>
            ` : ''}

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px;">
              <!-- Columna 1: Escala Manzana Censal -->
              <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px;">
                <div style="font-size:0.82rem; font-weight:700; color:var(--agua); text-transform:uppercase; margin-bottom:8px;">
                  📍 Escala Manzana Inmediata ${ed.manzana.manzent ? `(MZ ${ed.manzana.manzent})` : ''}
                </div>
                <div style="font-size:0.86rem; color:var(--tinta-suave); line-height:1.6;">
                  <div style="border-bottom:1px dashed rgba(255,255,255,0.1); padding-bottom:6px; margin-bottom:6px;">
                    <strong>📑 Permisos de Edificación DOM:</strong><br>
                    • Total Permisos: <strong>${ed.manzana.permisosCount}</strong><br>
                    • Unidades Aprobadas: <strong>${ed.manzana.permisosUnidades}</strong> viv/unid.<br>
                    • Superficie Autorizada: <strong>${ed.manzana.permisosSuperficieM2.toLocaleString()} m²</strong><br>
                    • Pisos Máximos: <strong>${ed.manzana.permisosPisosMax || '-'}</strong>
                  </div>
                  <div>
                    <strong>🏢 Recepciones Finales (CRF):</strong><br>
                    • Conjuntos Concluidos: <strong>${ed.manzana.crfCount}</strong><br>
                    • Viviendas Habitables: <strong>${ed.manzana.crfViviendas}</strong> viv.<br>
                    • Densidad Neta Media: <strong style="color:#34d399;">${ed.manzana.densidadNetaMedia} viv/ha</strong><br>
                    • COS Medio: <strong>${ed.manzana.cosMedio}</strong> | Patio: <strong>${ed.manzana.sueloLibreMedio}%</strong><br>
                    • Frente / Fondo: <strong>${ed.manzana.frenteMedio} m / ${ed.manzana.fondoMedio} m</strong>
                  </div>
                </div>
              </div>

              <!-- Columna 2: Escala Zonificación PRC (Buffer 500m) -->
              <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px;">
                <div style="font-size:0.82rem; font-weight:700; color:#fbbf24; text-transform:uppercase; margin-bottom:8px;">
                  🎯 Escala Zonificación PRC ${ed.zonificacion500m.zonaPRC || ''} (Buffer 500 m)
                </div>
                <div style="font-size:0.86rem; color:var(--tinta-suave); line-height:1.6;">
                  <div style="border-bottom:1px dashed rgba(255,255,255,0.1); padding-bottom:6px; margin-bottom:6px;">
                    <strong>📑 Permisos DOM en la Zona (500m):</strong><br>
                    • Total Permisos: <strong>${ed.zonificacion500m.permisosCount}</strong><br>
                    • Unidades Aprobadas: <strong>${ed.zonificacion500m.permisosUnidades}</strong> viv/unid.<br>
                    • Superficie Autorizada: <strong>${ed.zonificacion500m.permisosSuperficieM2.toLocaleString()} m²</strong><br>
                    • Pisos Promedio: <strong>${ed.zonificacion500m.permisosPisosPromedio || '-'}</strong>
                  </div>
                  <div>
                    <strong>🏢 Recepciones Finales (CRF) en la Zona:</strong><br>
                    • Conjuntos Recepcionados: <strong>${ed.zonificacion500m.crfCount}</strong><br>
                    • Viviendas Concluidas: <strong>${ed.zonificacion500m.crfViviendas}</strong> viv.<br>
                    • Densidad Neta Zonal: <strong style="color:#34d399;">${ed.zonificacion500m.densidadNetaMedia} viv/ha</strong><br>
                    • COS Zonal Medio: <strong>${ed.zonificacion500m.cosMedio}</strong> | Patio: <strong>${ed.zonificacion500m.sueloLibreMedio}%</strong><br>
                    • Frente / Fondo Prom: <strong>${ed.zonificacion500m.frenteMedio} m / ${ed.zonificacion500m.fondoMedio} m</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tarjeta 4: Usos de Suelo Permitidos (UPERM) -->
          <div class="caja-tarjeta-normativa caja-permitidos">
            <span class="etiqueta-normativa-card" style="color:#34d399;">✅ Usos de Suelo Permitidos (UPERM):</span>
            <p class="texto-normativo permitido" style="margin:6px 0 0 0; font-size:0.94rem; color:var(--tinta-suave); line-height:1.65;">
              ${prc ? prc.usosPermitidos : 'No hay datos de usos permitidos registrados para este punto.'}
            </p>
          </div>

          <!-- Tarjeta 5: Usos Prohibidos (UPROH - OGUC Art. 2.1.24) -->
          <div class="caja-tarjeta-normativa caja-prohibidos">
            <span class="etiqueta-normativa-card" style="color:#fbbf24;">🚫 Usos Prohibidos (UPROH) y Principio de Exclusión (Art. 2.1.24 OGUC):</span>
            <div style="background:rgba(245, 158, 11, 0.12); border:1.5px solid var(--ocre); border-radius:8px; padding:10px; margin:8px 0 8px 0; font-size:0.86rem; color:var(--tinta-suave);">
              ⚖️ <em>Según el Art. 2.1.24 de la OGUC, todo uso o destino no indicado expresamente como permitido en la Ordenanza Local se entiende legalmente prohibido.</em>
            </div>
            <p style="margin:4px 0 0 0; font-size:0.92rem; color:var(--tinta-suave); line-height:1.6;">
              ${prc ? prc.usosProhibidos : 'No se registran datos de usos prohibidos en esta ubicación.'}
            </p>
          </div>

          <!-- Tarjeta 6: Gravámenes por Riesgo Natural (Art. 2.1.17 OGUC) -->
          <div class="caja-tarjeta-normativa ${tieneRiesgo ? 'caja-riesgo' : ''}">
            <span class="etiqueta-normativa-card" style="color:${tieneRiesgo ? '#f87171' : '#34d399'};">
              ${tieneRiesgo ? '⚠️ Restricción por Riesgo Natural o Falla Geológica (Art. 2.1.17 OGUC):' : '🛡️ Riesgo Natural (Art. 2.1.17 OGUC):'}
            </span>
            ${tieneRiesgo ? `
              <ul class="lista-riesgos" style="margin:6px 0 0 0; padding-left:20px; color:#fecdd3; font-size:0.92rem;">
                ${inf.areasRiesgo.map(r => `<li><strong>${r.tipo}:</strong> ${r.norma} <em>(${r.fuente})</em></li>`).join('')}
              </ul>
            ` : `
              <p style="margin:4px 0 0 0; font-size:0.92rem; color:var(--tinta-suave);">
                ✅ Este punto no presenta polígonos de riesgo natural en las capas oficiales consultadas.
              </p>
            `}
          </div>

          <!-- Tarjeta 7: Protección Patrimonial (ICH / ZCH) -->
          <div class="caja-tarjeta-normativa caja-patrimonio">
            <span class="etiqueta-normativa-card" style="color:#c084fc;">🏛️ Protección Patrimonial (ICH / ZCH / Ley N° 17.288 CMN):</span>
            ${inf.patrimonio.length > 0 ? `
              <ul class="lista-patrimonio" style="margin:6px 0 0 0; padding-left:20px; color:var(--tinta-suave); font-size:0.92rem;">
                ${inf.patrimonio.map(p => `<li>🏛️ <strong>${p.nombre}</strong> (${p.categoria}) — ${p.distanciaMetros === 0 ? 'En zona protegida' : `A ${p.distanciaMetros} m de distancia`}</li>`).join('')}
              </ul>
            ` : `
              <p style="margin:4px 0 0 0; font-size:0.92rem; color:var(--tinta-suave);">
                Sin declaratoria patrimonial directa en este punto exacto.
              </p>
            `}
          </div>

          <!-- Tarjeta 8: Disclaimer Normativo Legal -->
          <div class="caja-tarjeta-normativa caja-disclaimer">
            <span class="etiqueta-normativa-card" style="color:#cbd5e1;">⚠️ Nota Importante sobre Validez Legal:</span>
            <p style="margin:4px 0 0 0; font-size:0.84rem; color:var(--tinta-tenue); line-height:1.6;">
              ${TEXTO_DISCLAIMER_LEGAL}
            </p>
          </div>

        </div>

        <!-- Botones de Acción y Acceso a Expedientes -->
        <div class="ficha-normativa-acciones" style="display:flex; gap:10px; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08);">
          <div>
            <a href="https://drive.google.com/drive/folders/1MMxFwr8G3fYCjX2NzO_0yeUIzPN-CSjz" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:6px; font-size:0.84rem; font-weight:700; color:#0f172a; background:#fbbf24; padding:8px 14px; border-radius:6px; text-decoration:none; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
              📂 Ver Expedientes Oficiales (Google Drive MuniStgo) ↗
            </a>
          </div>
          <div style="display:flex; gap:10px;">
            <button type="button" class="accion" id="btn-descargar-cin-txt" style="font-size:0.88rem; padding:8px 16px;">📄 Descargar Certificado CIN-VGI (.txt)</button>
            <button type="button" class="accion secundaria" id="btn-cerrar-ficha-normativa" style="font-size:0.88rem; padding:8px 16px;">Cerrar Ficha</button>
          </div>
        </div>
      </div>
    `;
  }

  return {
    consultarPuntoNormativo,
    generarCertificadoTexto,
    renderizarFichaNormativaHTML,
    obtenerFuentesOrdenanzas: () => FUENTES_ORDENANZAS_IPT,
    obtenerDisclaimerLegal: () => TEXTO_DISCLAIMER_LEGAL
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuloEvaluadorNormativo;
}
if (typeof window !== 'undefined') {
  window.ModuloEvaluadorNormativo = ModuloEvaluadorNormativo;
}
