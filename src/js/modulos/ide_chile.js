/*
  ide_chile.js
  ------------
  Módulo de integración con capas y servicios oficiales del Estado de Chile:
  - Infraestructura de Datos Geoespaciales de Chile (IDE Chile / SNIT)
  - Geoportal de Chile (geoportal.cl)
  - Ministerio de Vivienda y Urbanismo (MINVU / geoide.minvu.cl)
  - Instituto Nacional de Estadísticas (INE / Censo 2024)
  - Ministerio de Educación (MINEDUC)
  - Ministerio de Salud (MINSAL / DEIS)
  - Ministerio de Transportes y Telecomunicaciones (MTT / DTPM / Metro S.A.)
  - Junta Nacional de Cuerpos de Bomberos y Carabineros de Chile
  - Consejo de Monumentos Nacionales (CMN / datos.gob.cl)

  Provee:
  1. Consumo dinámico de FeatureServers en vivo y catálogos normalizados locales en src/data/.
  2. Consumo de capas OGC WMS (Web Map Service) oficiales.
  3. Desglose detallado de atributos públicos, trazabilidad y citas APA 7ª ed.
  4. Cumplimiento de la Ley N° 20.285 sobre Acceso a la Información Pública.
*/

const ModuloIDEChile = (() => {

  // Catálogo maestro exhaustivo de capas oficiales integradas
  const CAPAS_OFICIALES = {
    // =========================================================================
    // CAPAS OFICIALES BASE ORIGINALES (27 CAPAS BASE)
    // =========================================================================
    // =========================================================================
    // CAPAS OFICIALES BASE ORIGINALES (27 CAPAS BASE)
    // =========================================================================
    censo2024_regional: {
      id: 'censo2024_regional',
      nombre: 'Censo 2024 (Marco Regional RM)',
      institucion: 'Instituto Nacional de Estadísticas (INE) / IDE Chile',
      ministerio: 'Ministerio de Economía, Fomento y Turismo',
      tipoServicio: 'GeoPackage Oficial INE / GeoJSON WGS84',
      urlServicio: 'https://www.ine.gob.cl/estadisticas/sociales/censos-de-poblacion-y-vivienda/censo-2024',
      archivoLocal: 'data/ide_censo2024_regional.geojson',
      color: '#0A3D2E',
      icono: '🗺️',
      geometria: 'Polígono (Región Metropolitana)',
      grupo: 'social_demografia',
      descripcion: 'Delimitación oficial y marco macroterritorial de la Región Metropolitana de Santiago según el Censo de Población y Vivienda 2024.',
      declaracion: 'Cartografía censal oficial provista por el Instituto Nacional de Estadísticas (INE) y la Infraestructura de Datos Geoespaciales de Chile (IDE Chile). Licencia de Datos Abiertos conforme a la Ley N° 20.285.',
      citaAPA: 'Instituto Nacional de Estadísticas [INE]. (2024). Censo de Población y Vivienda 2024: Cartografía y Marco Territorial Regional. IDE Chile. https://www.ine.gob.cl'
    },
    censo2024_limite_urbano: {
      id: 'censo2024_limite_urbano',
      nombre: 'Censo 2024 (Límites Urbanos Censales RM)',
      institucion: 'Instituto Nacional de Estadísticas (INE) / IDE Chile',
      ministerio: 'Ministerio de Economía, Fomento y Turismo',
      tipoServicio: 'GeoPackage Oficial INE / GeoJSON WGS84',
      urlServicio: 'https://www.ine.gob.cl/estadisticas/sociales/censos-de-poblacion-y-vivienda/censo-2024',
      archivoLocal: 'data/ide_censo2024_limite_urbano.geojson',
      color: '#165B4C',
      icono: '🏙️',
      geometria: 'Polígonos (Límites Urbanos)',
      grupo: 'social_demografia',
      descripcion: 'Límites urbanos censales oficiales de la Región Metropolitana (106 áreas urbanas) con agregación de población, sexo y grupos etarios.',
      declaracion: 'Cartografía censal oficial provista por el Instituto Nacional de Estadísticas (INE) y la Infraestructura de Datos Geoespaciales de Chile (IDE Chile).',
      citaAPA: 'Instituto Nacional de Estadísticas [INE]. (2024). Censo de Población y Vivienda 2024: Límites Urbanos Censales de la Región Metropolitana. IDE Chile. https://www.ine.gob.cl'
    },
    censo2024_localidades: {
      id: 'censo2024_localidades',
      nombre: 'Censo 2024 (Localidades y Asentamientos RM)',
      institucion: 'Instituto Nacional de Estadísticas (INE) / IDE Chile',
      ministerio: 'Ministerio de Economía, Fomento y Turismo',
      tipoServicio: 'GeoPackage Oficial INE / GeoJSON WGS84',
      urlServicio: 'https://www.ine.gob.cl/estadisticas/sociales/censos-de-poblacion-y-vivienda/censo-2024',
      archivoLocal: 'data/ide_censo2024_localidades.geojson',
      color: '#1E7A56',
      icono: '🏘️',
      geometria: 'Polígonos (Localidades y Asentamientos)',
      grupo: 'social_demografia',
      descripcion: 'Localidades pobladas y asentamientos de la Región Metropolitana (511 entidades urbanas y rurales) con desglose de población, sexo y viviendas.',
      declaracion: 'Cartografía censal oficial provista por el Instituto Nacional de Estadísticas (INE) y la Infraestructura de Datos Geoespaciales de Chile (IDE Chile).',
      citaAPA: 'Instituto Nacional de Estadísticas [INE]. (2024). Censo de Población y Vivienda 2024: Localidades y Entidades Pobladas de la Región Metropolitana. IDE Chile. https://www.ine.gob.cl'
    },
    censo2024_zonal: {
      id: 'censo2024_zonal',
      nombre: 'Censo 2024 (Zonas y Distritos Censales RM)',
      institucion: 'Instituto Nacional de Estadísticas (INE) / IDE Chile',
      ministerio: 'Ministerio de Economía, Fomento y Turismo',
      tipoServicio: 'GeoPackage Oficial INE / GeoJSON WGS84',
      urlServicio: 'https://www.ine.gob.cl/estadisticas/sociales/censos-de-poblacion-y-vivienda/censo-2024',
      archivoLocal: 'data/ide_censo2024_zonal.geojson',
      color: '#279B6C',
      icono: '⬡',
      geometria: 'Polígonos (Distritos y Zonas Censales)',
      grupo: 'social_demografia',
      descripcion: 'Zonas y distritos censales de la Región Metropolitana (1.865 polígonos) con datos sociodemográficos consolidados de población, etnias, migración y vivienda.',
      declaracion: 'Cartografía censal oficial provista por el Instituto Nacional de Estadísticas (INE) y la Infraestructura de Datos Geoespaciales de Chile (IDE Chile).',
      citaAPA: 'Instituto Nacional de Estadísticas [INE]. (2024). Censo de Población y Vivienda 2024: Distritos y Zonas Censales de la Región Metropolitana. IDE Chile. https://www.ine.gob.cl'
    },
    censo2024_manzanas: {
      id: 'censo2024_manzanas',
      nombre: 'Censo 2024 (Manzanas Censales RM)',
      institucion: 'Instituto Nacional de Estadísticas (INE) / IDE Chile',
      ministerio: 'Ministerio de Economía, Fomento y Turismo',
      tipoServicio: 'GeoPackage Oficial INE / GeoJSON WGS84',
      urlServicio: 'https://www.ine.gob.cl/estadisticas/sociales/censos-de-poblacion-y-vivienda/censo-2024',
      archivoLocal: 'data/ide_censo2024_manzanas.geojson',
      color: '#34BF82',
      icono: '⬚',
      geometria: 'Polígonos (Manzanas Censales)',
      grupo: 'social_demografia',
      descripcion: 'Microdatos censales oficiales georreferenciados a nivel de manzana para la totalidad de la Región Metropolitana de Santiago (66.873 manzanas censales con 217 variables demográficas del INE).',
      declaracion: 'Microdatos oficiales provistos por el Instituto Nacional de Estadísticas (INE) y la Secretaría Ejecutiva SNIT / IDE Chile. Licencia de Datos Abiertos del Estado de Chile conforme a la Ley N° 20.285.',
      citaAPA: 'Instituto Nacional de Estadísticas [INE]. (2024). Censo de Población y Vivienda 2024: Microdatos Georreferenciados a Nivel de Manzana (Región Metropolitana). IDE Chile. https://www.ine.gob.cl'
    },
    minvu_patrimonio: {
      id: 'minvu_patrimonio',
      nombre: 'Patrimonio IPT: Inmuebles y Zonas de Conservación Histórica (ZCH / ICH RM)',
      institucion: 'Ministerio de Vivienda y Urbanismo (MINVU)',
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'ArcGIS FeatureServer / GeoJSON WGS84',
      urlServicio: 'https://geoide.minvu.cl/server/rest/services/IPT/Patrimonio/MapServer/0',
      archivoLocal: 'data/ide_minvu_patrimonio.geojson',
      color: '#8F3A2C',
      icono: '🏛',
      geometria: 'Puntos y Polígonos',
      grupo: 'equipamiento_patrimonio',
      descripcion: 'Catastro oficial de Inmuebles de Conservación Histórica (ICH) y Zonas de Conservación Histórica (ZCH) normadas por Instrumentos de Planificación Territorial en la Región Metropolitana (1.690 entidades).',
      declaracion: 'Información oficial producida por la División de Desarrollo Urbano del MINVU y publicada en geoide.minvu.cl e IDE Chile.',
      citaAPA: 'Ministerio de Vivienda y Urbanismo [MINVU]. (2024). Catastro Oficial de Patrimonio en Instrumentos de Planificación Territorial (IPT). DDU, MINVU. https://geoide.minvu.cl/server/rest/services/IPT/Patrimonio/MapServer'
    },
    educacion_parvularia: {
      id: 'educacion_parvularia',
      nombre: 'Jardines y Salas Cuna (JUNJI / Integra)',
      institucion: 'JUNJI / Fundación Integra / MINEDUC / IDE Chile',
      ministerio: 'Subsecretaría de Educación Parvularia',
      tipoServicio: 'Geoportal de Chile (Shapefile Oficial)',
      urlServicio: 'https://www.geoportal.cl/geoportal/catalog/download/b52e4229-365e-3163-b211-679cc6b2fd99',
      archivoLocal: 'data/ide_educacion_parvularia.geojson',
      color: '#417A63',
      icono: '🏫',
      geometria: 'Puntos (Jardines)',
      grupo: 'equipamiento_patrimonio',
      descripcion: 'Salas cuna y jardines infantiles de administración pública, JUNJI y Fundación Integra en la comuna de Santiago.',
      declaracion: 'Registro nacional georreferenciado de educación parvularia publicado en Geoportal de Chile.',
      citaAPA: 'Subsecretaría de Educación Parvularia. (2024). Directorio Nacional de Establecimientos de Educación Parvularia. Geoportal de Chile. https://www.geoportal.cl'
    },
    establecimientos_salud: {
      id: 'establecimientos_salud',
      nombre: 'Salud Pública (CESFAM y Hospitales)',
      institucion: 'Ministerio de Salud (MINSAL) / DEIS / IDE Chile',
      ministerio: 'Subsecretaría de Redes Asistenciales',
      tipoServicio: 'DEIS / datos.gob.cl / IDE Chile',
      urlServicio: 'https://datos.gob.cl/dataset/3bf4cf7c-f638-4735-9a01-f65faae4beca',
      archivoLocal: 'data/ide_establecimientos_salud.geojson',
      color: '#B22222',
      icono: '🏥',
      geometria: 'Puntos (Salud)',
      grupo: 'equipamiento_patrimonio',
      descripcion: 'Establecimientos de atención primaria (CESFAM, CECOSF), postas y hospitales de la red del Servicio de Salud Metropolitano Central.',
      declaracion: 'Registro oficial del Departamento de Estadísticas e Información de Salud (DEIS), Ministerio de Salud.',
      citaAPA: 'Ministerio de Salud [MINSAL]. (2024). Catastro Nacional de Establecimientos Asistenciales de Salud. DEIS / IDE Chile. https://datos.gob.cl'
    },
    bomberos: {
      id: 'bomberos',
      nombre: 'Cuarteles de Bomberos de Chile',
      institucion: 'Junta Nacional de Cuerpos de Bomberos / IDE Chile',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Geoportal de Chile (Shapefile Oficial)',
      urlServicio: 'https://www.geoportal.cl/geoportal/catalog/download/e476987d-7422-3fa4-b02a-0c67ce3b3ac8',
      archivoLocal: 'data/ide_bomberos.geojson',
      color: '#C71585',
      icono: '🚒',
      geometria: 'Puntos (Cuarteles)',
      grupo: 'seguridad_justicia',
      descripcion: 'Compañías del Cuerpo de Bomberos de Santiago (CBS) que atienden Barrio Brasil, Yungay y el centro histórico.',
      declaracion: 'Catastro oficial de cuarteles de bomberos provisto para la gestión de riesgos y emergencias en IDE Chile.',
      citaAPA: 'Cuerpo de Bomberos de Chile. (2024). Catastro Georreferenciado de Compañías de Bomberos. Geoportal de Chile / IDE Chile. https://www.geoportal.cl'
    },
    carabineros: {
      id: 'carabineros',
      nombre: 'Comisarías y Cuarteles Policiales',
      institucion: 'Carabineros de Chile / IDE Chile',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Geoportal de Chile (Shapefile Oficial)',
      urlServicio: 'https://www.geoportal.cl/geoportal/catalog/download/24cae8aa-4e9c-36a9-9e92-d1dca97e3a0c',
      archivoLocal: 'data/ide_carabineros.geojson',
      color: '#2E5D3E',
      icono: '👮',
      geometria: 'Puntos (Comisarías)',
      grupo: 'seguridad_justicia',
      descripcion: 'Unidades policiales, comisarías territoriales y retenes de Carabineros de Chile en Santiago.',
      declaracion: 'Información geoespacial oficial distribuida a través de la Infraestructura de Datos Geoespaciales de Chile.',
      citaAPA: 'Carabineros de Chile. (2024). Catastro Oficial de Cuarteles y Unidades Policiales. Geoportal de Chile / IDE Chile. https://www.geoportal.cl'
    },
    estaciones_metro: {
      id: 'estaciones_metro',
      nombre: 'Estaciones de Metro de Santiago',
      institucion: 'DTPM / Metro S.A. / IDE Chile / datos.gob.cl',
      ministerio: 'Ministerio de Transportes y Telecomunicaciones (MTT)',
      tipoServicio: 'DTPM / datos.gob.cl',
      urlServicio: 'https://datos.gob.cl/dataset/71a3f5bc-9742-4b76-8f4f-d07291123bf4',
      archivoLocal: 'data/ide_estaciones_metro.geojson',
      color: '#B33928',
      icono: '🚇',
      geometria: 'Puntos (Estaciones)',
      grupo: 'movilidad_transporte',
      descripcion: 'Red de estaciones de Metro de Santiago (Línea 1, Línea 2, Línea 5) que conectan Barrio Brasil (Los Héroes, Santa Ana, Cumming, República).',
      declaracion: 'Datos provistos por la Dirección de Transporte Público Metropolitano (DTPM) y Metro S.A. en datos.gob.cl.',
      citaAPA: 'Dirección de Transporte Público Metropolitano [DTPM] & Metro S.A. (2024). Red de Estaciones de Metro de Santiago. Portal de Datos Abiertos del Estado de Chile. https://datos.gob.cl'
    },
    red_ferroviaria: {
      id: 'red_ferroviaria',
      nombre: 'Red Ferroviaria EFE (MTT)',
      institucion: 'Empresa de los Ferrocarriles del Estado (EFE) / MTT / IDE Chile',
      ministerio: 'Ministerio de Transportes y Telecomunicaciones',
      tipoServicio: 'Geoportal de Chile (Shapefile Oficial)',
      urlServicio: 'https://www.geoportal.cl/geoportal/catalog/download/a29f7a5d-95f9-38ff-83f3-bebc40ddadc7',
      archivoLocal: 'data/ide_red_ferroviaria.geojson',
      color: '#34495E',
      icono: '🚆',
      geometria: 'Líneas (Vías Férreas)',
      grupo: 'movilidad_transporte',
      descripcion: 'Trazados ferroviarios y cruces de la red central EFE en la Región Metropolitana (Estación Central / Santiago).',
      declaracion: 'Catastro de infraestructura ferroviaria de EFE distribuido por IDE Chile en Geoportal.',
      citaAPA: 'Empresa de los Ferrocarriles del Estado [EFE]. (2024). Red Ferroviaria y Cruces Nacionales. Geoportal de Chile. https://www.geoportal.cl'
    },
    cmn_sitios_memoria: {
      id: 'cmn_sitios_memoria',
      nombre: 'Sitios de Memoria y Monumentos CMN',
      institucion: 'Consejo de Monumentos Nacionales (CMN) / datos.gob.cl',
      ministerio: 'Ministerio de las Culturas, las Artes y el Patrimonio',
      tipoServicio: 'Conjunto de Datos Abiertos / Geoportal',
      urlServicio: 'https://datos.gob.cl/dataset/7ddfa6cf-6d0e-405a-9bd0-273d7d678bbc',
      archivoLocal: 'data/ide_cmn_sitios_memoria.geojson',
      color: '#5C4033',
      icono: '🕯',
      geometria: 'Puntos (Monumentos)',
      grupo: 'equipamiento_patrimonio',
      descripcion: 'Sitios de memoria y monumentos con decreto oficial de declaratoria por el Consejo de Monumentos Nacionales en la comuna de Santiago.',
      declaracion: 'Conjunto publicado en el Portal de Datos Abiertos del Estado (datos.gob.cl) y Geoportal de Chile.',
      citaAPA: 'Consejo de Monumentos Nacionales [CMN]. (2024). Sitios de Memoria y Monumentos Nacionales con Declaratoria Oficial. Portal de Datos Abiertos del Estado de Chile. https://datos.gob.cl'
    },
    minvu_ipt_prc_santiago: {
      id: 'minvu_ipt_prc_santiago',
      nombre: 'Planes Reguladores Comunales (PRC - RM): Zonificación Comunal',
      institucion: 'MINVU / Municipios de la Región Metropolitana',
      ministerio: 'División de Desarrollo Urbano (DDU) / DOM Municipales',
      tipoServicio: 'ArcGIS MapServer / FeatureServer',
      urlServicio: 'https://geoide.minvu.cl/server/rest/services/IPT/PRC/FeatureServer/0',
      archivoLocal: 'data/ide_minvu_ipt_prc_santiago.geojson',
      color: '#D97706',
      icono: '🏛️',
      geometria: 'Polígonos (Zonificación Comunal)',
      grupo: 'normativa_ipt',
      descripcion: 'Zonificación urbana y normas urbanísticas oficiales comunales de los municipios de la Región Metropolitana (Santiago, Providencia, Las Condes, Ñuñoa, Maipú, Vitacura, Renca, San Bernardo, etc.): usos permitidos (UPERM), usos prohibidos (UPROH), altura, rasante y decretos D.O. Escala comunal / municipal específica.',
      declaracion: 'Normativa urbanística oficial promulgada por los municipios de la Región Metropolitana y ratificada por MINVU DDU conforme a la Ley General de Urbanismo y Construcciones (DFL 458/1975).',
      citaAPA: 'Municipios de la Región Metropolitana & Ministerio de Vivienda y Urbanismo [MINVU]. (2024). Planes Reguladores Comunales (PRC): Zonificación y Ordenanzas Locales Oficiales. DDU, MINVU / IDE Chile.'
    },
    minvu_ipt_prms_usosuelo: {
      id: 'minvu_ipt_prms_usosuelo',
      nombre: 'Plan Regulador Metropolitano (PRMS): Usos de Suelo Regional',
      institucion: 'MINVU / SEREMI Metropolitana de Vivienda y Urbanismo',
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'ArcGIS FeatureServer',
      urlServicio: 'https://geoide.minvu.cl/server/rest/services/IPT/PRMS/FeatureServer/5',
      archivoLocal: 'data/ide_minvu_ipt_prms_usosuelo.geojson',
      color: '#7C3AED',
      icono: '▧',
      geometria: 'Polígonos (Usos Metropolitanos)',
      grupo: 'normativa_ipt',
      descripcion: 'Zonificación intercomunal y macro-usos del Plan Regulador Metropolitano de Santiago (PRMS): parques intercomunales, equipamiento metropolitano, áreas rurales e infraestructura intercomunal. Escala regional / intercomunal.',
      declaracion: 'Instrumento de Planificación Territorial Metropolitano regulado por el Art. 34 LGUC y administrado por SEREMI MINVU RM.',
      citaAPA: 'Secretaría Regional Ministerial Metropolitana de Vivienda y Urbanismo [SEREMI MINVU RM]. (2024). Plan Regulador Metropolitano de Santiago (PRMS): Usos de Suelo Oficiales. DDU, MINVU.'
    },
    minvu_ipt_areas_verdes: {
      id: 'minvu_ipt_areas_verdes',
      nombre: 'Áreas Verdes Normativas (MINVU / INE 2023)',
      institucion: 'Ministerio de Vivienda y Urbanismo (MINVU) / INE',
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Catastro Nacional Integrado GeoJSON',
      urlServicio: 'https://geoide.minvu.cl/server/rest/services/IPT/%C3%81reas_verdes_IPT/FeatureServer/0',
      archivoLocal: 'data/ide_minvu_ipt_areas_verdes.geojson',
      color: '#059669',
      icono: '🌲',
      geometria: 'Polígonos (18.173 Áreas Verdes RM)',
      grupo: 'medio_ambiente',
      descripcion: 'Catastro oficial consolidado de áreas verdes urbanas en la Región Metropolitana (MINVU / INE 2023). Contiene 18.173 entidades con tipología de plazas, parques, paseos y áreas verdes normativas con cobertura completa comunal.',
      declaracion: 'Información oficial elaborada por el Ministerio de Vivienda y Urbanismo y el Instituto Nacional de Estadísticas.',
      citaAPA: 'Ministerio de Vivienda y Urbanismo [MINVU] & Instituto Nacional de Estadísticas [INE]. (2023). Catastro Consolidado de Áreas Verdes Urbanas Región Metropolitana. Santiago, Chile.'
    },
    minvu_ipt_areas_riesgo: {
      id: 'minvu_ipt_areas_riesgo',
      nombre: 'Áreas de Riesgo Normativas (IPT)',
      institucion: 'MINVU / DDU / SEREMI RM',
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'ArcGIS FeatureServer',
      urlServicio: 'https://geoide.minvu.cl/server/rest/services/IPT/IPT_AREA_RIESGO/FeatureServer/0',
      archivoLocal: 'data/ide_minvu_ipt_areas_riesgo.geojson',
      color: '#DC2626',
      icono: '⚠️',
      geometria: 'Polígonos (Riesgo y Restricción)',
      grupo: 'normativa_ipt',
      descripcion: 'Áreas bajo restricción urbanística por riesgo natural (remoción en masa, inundación, fallas geológicas) normadas en los PRC y PRMS conforme al Art. 2.1.17 de la OGUC.',
      declaracion: 'Zonas de Protección por Riesgo oficialmente incorporadas en los planes reguladores comunales e intercomunales.',
      citaAPA: 'Ministerio de Vivienda y Urbanismo [MINVU]. (2024). Áreas de Riesgo y Restricción en Instrumentos de Planificación Territorial de Chile. DDU, MINVU. https://geoide.minvu.cl/server/rest/services/IPT/IPT_AREA_RIESGO/FeatureServer'
    },
    minvu_ipt_resguardo_infraestructura: {
      id: 'minvu_ipt_resguardo_infraestructura',
      nombre: 'Fajas de Resguardo e Infraestructura PRMS',
      institucion: 'MINVU / SEREMI Metropolitana',
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'ArcGIS FeatureServer',
      urlServicio: 'https://geoide.minvu.cl/server/rest/services/IPT/PRMS/FeatureServer/0',
      archivoLocal: 'data/ide_minvu_ipt_resguardo_infraestructura.geojson',
      color: '#0284C7',
      icono: '🛡',
      geometria: 'Líneas (Fajas de Resguardo)',
      grupo: 'normativa_ipt',
      descripcion: 'Fajas y conos normativos de protección de infraestructura de transporte, ferrocarril, acueductos y servidumbres metropolitanas normadas por el PRMS.',
      declaracion: 'Líneas de resguardo metropolitano de infraestructura conforme al Capítulo 8.4 de la Ordenanza del PRMS.',
      citaAPA: 'Secretaría Regional Ministerial Metropolitana de Vivienda y Urbanismo [SEREMI MINVU RM]. (2024). Fajas de Resguardo de Infraestructura Metropolitana (PRMS). DDU, MINVU. https://geoide.minvu.cl/server/rest/services/IPT/PRMS/FeatureServer'
    },
    minvu_ipt_limite_urbano: {
      id: 'minvu_ipt_limite_urbano',
      nombre: 'Límite Urbano Oficial PRC (MINVU)',
      institucion: 'MINVU / DDU / I. Municipalidad de Santiago',
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'ArcGIS FeatureServer',
      urlServicio: 'https://geoide.minvu.cl/server/rest/services/IPT/Limites_Urbanos/FeatureServer/0',
      archivoLocal: 'data/ide_minvu_ipt_limite_urbano.geojson',
      color: '#4F46E5',
      icono: '⛶',
      geometria: 'Polígono (Límite Urbano Oficial)',
      grupo: 'normativa_ipt',
      descripcion: 'Línea oficial legal que delimita el territorio urbano comunal normado por el Plan Regulador Comunal de Santiago conforme a la Ley General de Urbanismo y Construcciones.',
      declaracion: 'Polígono legal publicado en Diario Oficial y consolidado en el Catastro Nacional de Límites Urbanos de MINVU.',
      citaAPA: 'Ministerio de Vivienda y Urbanismo [MINVU]. (2024). Catastro Oficial de Límites Urbanos de Chile (PRC/PRI). DDU, MINVU / IDE Chile. https://geoide.minvu.cl/server/rest/services/IPT/Limites_Urbanos/FeatureServer'
    },
    ide_minvu_campamentos: {
      id: 'ide_minvu_campamentos',
      nombre: 'Catastro Campamentos 2024 (MINVU)',
      institucion: 'Ministerio de Vivienda y Urbanismo (MINVU)',
      ministerio: 'Programa de Asentamientos Precarios',
      tipoServicio: 'ArcGIS MapServer / FeatureServer',
      urlServicio: 'https://geoide.minvu.cl/server/rest/services/Catastros/Catastros_campamentos/MapServer/0',
      archivoLocal: 'data/ide_minvu_campamentos.geojson',
      color: '#E11D48',
      icono: '⛺',
      geometria: 'Puntos y Polígonos (Campamentos)',
      grupo: 'social_demografia',
      descripcion: 'Catastro Oficial de Campamentos 2024 del MINVU: asentamientos informales, número de hogares, tenencia y planes de erradicación/radicación.',
      declaracion: 'Información oficial provista por el Departamento de Asentamientos Precarios del MINVU bajo la Política Nacional de Campamentos.',
      citaAPA: 'Ministerio de Vivienda y Urbanismo [MINVU]. (2024). Catastro Nacional Oficial de Campamentos 2024. Secretaría Ejecutiva SNIT / IDE Chile. https://geoide.minvu.cl/server/rest/services/Catastros/Catastros_campamentos/MapServer/0'
    },
    ide_minvu_ipt_prms_riesgo: {
      id: 'ide_minvu_ipt_prms_riesgo',
      nombre: 'PRMS: Riesgos Metropolitanos (Inundación / Remoción)',
      institucion: 'MINVU / SEREMI Metropolitana',
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'ArcGIS FeatureServer',
      urlServicio: 'https://geoide.minvu.cl/server/rest/services/IPT/PRMS/FeatureServer/3',
      archivoLocal: 'data/ide_minvu_ipt_prms_riesgo.geojson',
      color: '#DC2626',
      icono: '⚠️',
      geometria: 'Polígonos (Zonas de Riesgo Intercomunal)',
      grupo: 'normativa_ipt',
      descripcion: 'Áreas de restricción por riesgo geológico, fallas activas, remoción en masa e inundación fluvial normadas por el Plan Regulador Metropolitano de Santiago (PRMS).',
      declaracion: 'Zonas normativas de riesgo metropolitano reguladas por el Art. 2.1.17 de la OGUC y la Ordenanza del PRMS.',
      citaAPA: 'Secretaría Regional Ministerial Metropolitana de Vivienda y Urbanismo [SEREMI MINVU RM]. (2024). Áreas de Riesgo Metropolitano (PRMS): Fallas, Inundación y Remoción. DDU, MINVU. https://geoide.minvu.cl/server/rest/services/IPT/PRMS/FeatureServer/3'
    },
    ide_subdere_dpa_comunas: {
      id: 'ide_subdere_dpa_comunas',
      nombre: 'División Político-Administrativa (SUBDERE / IGM)',
      institucion: 'Subsecretaría de Desarrollo Regional (SUBDERE) / IGM / IDE Chile',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'ArcGIS FeatureServer',
      urlServicio: 'https://services5.arcgis.com/hUyD8u3TeZLKPe4T/ArcGIS/rest/services/SIET_comunas_16R_gdb/FeatureServer/0',
      archivoLocal: 'data/ide_subdere_dpa_comunas.geojson',
      color: '#475569',
      icono: '🗺',
      geometria: 'Polígonos (Límites Comunales Oficiales)',
      grupo: 'normativa_ipt',
      descripcion: 'Límites comunales y provinciales oficiales de Chile (División Político-Administrativa) con códigos únicos territoriales (CUT).',
      declaracion: 'Cartografía base oficial de la República de Chile provista por SUBDERE, INE e Instituto Geográfico Militar (IGM).',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE] & IGM. (2024). División Político Administrativa Oficial de Chile (DPA). IDE Chile. https://services5.arcgis.com/hUyD8u3TeZLKPe4T/ArcGIS/rest/services/SIET_comunas_16R_gdb/FeatureServer/0'
    },

    // =========================================================================
    // CAPAS CATASTRADAS EN BBDD.XLSX (74 CAPAS ESTADO DE CHILE)
    // =========================================================================
    'bbdd_01': {
      id: 'bbdd_01',
      num_bbdd: 1,
      nombre: "Proyectos Mandatados - GEOMOP",
      institucion: "Estado de Chile / IDE Chile / geomop.mop.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geomop.mop.gob.cl/descargas/",
      archivoLocal: 'data/capa_bbdd_01.geojson',
      color: '#64748B',
      icono: '🏛️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'economia_inversion',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 01: Proyectos Mandatados - GEOMOP. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Proyectos Mandatados - GEOMOP (Capa N° 01). IDE Chile / Geoportal. https://geomop.mop.gob.cl/descargas/"
    },
    'bbdd_02': {
      id: 'bbdd_02',
      num_bbdd: 2,
      nombre: "Red Vial Nacional - GEOMOP",
      institucion: "Estado de Chile / IDE Chile / geomop.mop.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geomop.mop.gob.cl/descargas/",
      archivoLocal: 'data/capa_bbdd_02.geojson',
      color: '#06B6D4',
      icono: '🚲',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'movilidad_transporte',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 02: Red Vial Nacional - GEOMOP. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Red Vial Nacional - GEOMOP (Capa N° 02). IDE Chile / Geoportal. https://geomop.mop.gob.cl/descargas/"
    },
    'bbdd_03': {
      id: 'bbdd_03',
      num_bbdd: 3,
      nombre: "Red Hidrométrica - GEOMOP",
      institucion: "Estado de Chile / IDE Chile / geomop.mop.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geomop.mop.gob.cl/descargas/",
      archivoLocal: 'data/capa_bbdd_03.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 03: Red Hidrométrica - GEOMOP. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Red Hidrométrica - GEOMOP (Capa N° 03). IDE Chile / Geoportal. https://geomop.mop.gob.cl/descargas/"
    },
    'bbdd_04': {
      id: 'bbdd_04',
      num_bbdd: 4,
      nombre: "Contratos Concesionados - GEOMOP",
      institucion: "Estado de Chile / IDE Chile / geomop.mop.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geomop.mop.gob.cl/descargas/",
      archivoLocal: 'data/capa_bbdd_04.geojson',
      color: '#06B6D4',
      icono: '🚲',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'economia_inversion',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 04: Contratos Concesionados - GEOMOP. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Contratos Concesionados - GEOMOP (Capa N° 04). IDE Chile / Geoportal. https://geomop.mop.gob.cl/descargas/"
    },
    'bbdd_05': {
      id: 'bbdd_05',
      num_bbdd: 5,
      nombre: "Contratos MOP - GEOMOP",
      institucion: "Estado de Chile / IDE Chile / geomop.mop.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geomop.mop.gob.cl/descargas/",
      archivoLocal: 'data/capa_bbdd_05.geojson',
      color: '#64748B',
      icono: '🏛️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'economia_inversion',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 05: Contratos MOP - GEOMOP. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Contratos MOP - GEOMOP (Capa N° 05). IDE Chile / Geoportal. https://geomop.mop.gob.cl/descargas/"
    },
    'bbdd_06': {
      id: 'bbdd_06',
      num_bbdd: 6,
      nombre: "Jardines Infantiles JUNJI",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/34965/Jardines%20Infantiles%20JUNJI",
      archivoLocal: 'data/capa_bbdd_06.geojson',
      color: '#3B82F6',
      icono: '🏫',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 06: Jardines Infantiles JUNJI. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Jardines Infantiles JUNJI (Capa N° 06). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/34965/Jardines%20Infantiles%20JUNJI"
    },
    'bbdd_07': {
      id: 'bbdd_07',
      num_bbdd: 7,
      nombre: "Infraestructura Deportiva",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35034/Infraestructura%20Deportiva",
      archivoLocal: 'data/capa_bbdd_07.geojson',
      color: '#8B5CF6',
      icono: '⚽',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 07: Infraestructura Deportiva. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Infraestructura Deportiva (Capa N° 07). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35034/Infraestructura%20Deportiva"
    },
    'bbdd_08': {
      id: 'bbdd_08',
      num_bbdd: 8,
      nombre: "Municipios",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35603/Municipios",
      archivoLocal: 'data/capa_bbdd_08.geojson',
      color: '#6366F1',
      icono: '👥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 08: Municipios. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Municipios (Capa N° 08). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35603/Municipios"
    },
    'bbdd_10': {
      id: 'bbdd_10',
      num_bbdd: 10,
      nombre: "Jardines Infantiles Fundación Integra",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35001/Jardines%20Infantiles%20Fundaci%C3%B3n%20Integra",
      archivoLocal: 'data/capa_bbdd_10.geojson',
      color: '#3B82F6',
      icono: '🏫',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 10: Jardines Infantiles Fundación Integra. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Jardines Infantiles Fundación Integra (Capa N° 10). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35001/Jardines%20Infantiles%20Fundaci%C3%B3n%20Integra"
    },
    'bbdd_11': {
      id: 'bbdd_11',
      num_bbdd: 11,
      nombre: "Cuerpos de Bomberos",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/36393/Cuerpos%20de%20Bomberos",
      archivoLocal: 'data/capa_bbdd_11.geojson',
      color: '#F59E0B',
      icono: '🛡️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'seguridad_justicia',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 11: Cuerpos de Bomberos. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Cuerpos de Bomberos (Capa N° 11). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/36393/Cuerpos%20de%20Bomberos"
    },
    'bbdd_12': {
      id: 'bbdd_12',
      num_bbdd: 12,
      nombre: "Establecimientos Educación Escolar",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35408/Establecimientos%20Educaci%C3%B3n%20Escolar",
      archivoLocal: 'data/capa_bbdd_12.geojson',
      color: '#3B82F6',
      icono: '🏫',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 12: Establecimientos Educación Escolar. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Establecimientos Educación Escolar (Capa N° 12). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35408/Establecimientos%20Educaci%C3%B3n%20Escolar"
    },
    'bbdd_13': {
      id: 'bbdd_13',
      num_bbdd: 13,
      nombre: "Establecimientos Educación Parvularia",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35553/Establecimientos%20Educaci%C3%B3n%20Parvularia",
      archivoLocal: 'data/capa_bbdd_13.geojson',
      color: '#3B82F6',
      icono: '🏫',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 13: Establecimientos Educación Parvularia. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Establecimientos Educación Parvularia (Capa N° 13). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35553/Establecimientos%20Educaci%C3%B3n%20Parvularia"
    },
    'bbdd_14': {
      id: 'bbdd_14',
      num_bbdd: 14,
      nombre: "Establecimientos de Educación Superior",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35554/Establecimientos%20de%20Educaci%C3%B3n%20Superior",
      archivoLocal: 'data/capa_bbdd_14.geojson',
      color: '#3B82F6',
      icono: '🏫',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 14: Establecimientos de Educación Superior. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Establecimientos de Educación Superior (Capa N° 14). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35554/Establecimientos%20de%20Educaci%C3%B3n%20Superior"
    },
    'bbdd_15': {
      id: 'bbdd_15',
      num_bbdd: 15,
      nombre: "Centros de SERNAM",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35000/Centros%20de%20SERNAM",
      archivoLocal: 'data/capa_bbdd_15.geojson',
      color: '#6366F1',
      icono: '👥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 15: Centros de SERNAM. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Centros de SERNAM (Capa N° 15). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35000/Centros%20de%20SERNAM"
    },
    'bbdd_17': {
      id: 'bbdd_17',
      num_bbdd: 17,
      nombre: "Áreas Funcionales de las ciudades (2026)",
      institucion: "Estado de Chile / IDE Chile / geoide.minvu.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/AFU_2026/FeatureServer",
      archivoLocal: 'data/capa_bbdd_17.geojson',
      color: '#64748B',
      icono: '🏛️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 17: Áreas Funcionales de las ciudades (2026). Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Áreas Funcionales de las ciudades (2026) (Capa N° 17). IDE Chile / Geoportal. https://geoide.minvu.cl/server/rest/services/Otros/AFU_2026/FeatureServer"
    },
    'bbdd_18': {
      id: 'bbdd_18',
      num_bbdd: 18,
      nombre: "Zonificación Termica",
      institucion: "Estado de Chile / IDE Chile / geoide.minvu.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/Zonificaci%C3%B3n_termica/FeatureServer",
      archivoLocal: 'data/capa_bbdd_18.geojson',
      color: '#D97706',
      icono: '📜',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'normativa_ipt',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 18: Zonificación Termica. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Zonificación Termica (Capa N° 18). IDE Chile / Geoportal. https://geoide.minvu.cl/server/rest/services/Otros/Zonificaci%C3%B3n_termica/FeatureServer"
    },
    'bbdd_19': {
      id: 'bbdd_19',
      num_bbdd: 19,
      nombre: "Cité",
      institucion: "Estado de Chile / IDE Chile / geoide.minvu.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/Cit%C3%A9/FeatureServer",
      archivoLocal: 'data/capa_bbdd_19.geojson',
      color: '#64748B',
      icono: '🏛️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 19: Cité. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Cité (Capa N° 19). IDE Chile / Geoportal. https://geoide.minvu.cl/server/rest/services/Otros/Cit%C3%A9/FeatureServer"
    },
    'bbdd_20': {
      id: 'bbdd_20',
      num_bbdd: 20,
      nombre: "SEREMI MINVU Región Metropolitana",
      institucion: "SEREMI Metropolitana de Vivienda y Urbanismo / MINVU",
      ministerio: 'Ministerio de Vivienda y Urbanismo',
      tipoServicio: 'Shapefile Oficial GeoJSON',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/Seremis/FeatureServer",
      archivoLocal: 'data/capa_bbdd_20.geojson',
      color: '#2563EB',
      icono: '🏢',
      geometria: 'Polígono / Cobertura Regional',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Jurisdicción y sede regional oficial de la Secretaría Regional Ministerial de Vivienda y Urbanismo de la Región Metropolitana de Santiago.",
      declaracion: 'Información pública oficial del Ministerio de Vivienda y Urbanismo.',
      citaAPA: "SEREMI MINVU RM. (2024). Delimitación y Sede Regional Metropolitana. Ministerio de Vivienda y Urbanismo."
    },
    'bbdd_21': {
      id: 'bbdd_21',
      num_bbdd: 21,
      nombre: "Oficinas Serviu",
      institucion: "Estado de Chile / IDE Chile / geoide.minvu.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/Ofinas_Serviu/FeatureServer",
      archivoLocal: 'data/capa_bbdd_21.geojson',
      color: '#64748B',
      icono: '🏛️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 21: Oficinas Serviu. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Oficinas Serviu (Capa N° 21). IDE Chile / Geoportal. https://geoide.minvu.cl/server/rest/services/Otros/Ofinas_Serviu/FeatureServer"
    },
    'energia_almacenamiento_rm': {
      id: 'energia_almacenamiento_rm',
      nombre: "Sistemas de Almacenamiento de Energía RM",
      institucion: "Ministerio de Energía / IDE Energía",
      ministerio: 'Ministerio de Energía',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/FeatureServer",
      archivoLocal: 'data/capa_energia_almacenamiento.geojson',
      color: '#8B5CF6',
      icono: '🔋',
      geometria: 'Infraestructura Energética',
      grupo: 'economia_inversion',
      descripcion: "Infraestructura y proyectos de sistemas de almacenamiento de energía en la Región Metropolitana (BESS / almacenamiento electroquímico y térmico).",
      declaracion: 'Catastro oficial provisto por IDE Energía, Ministerio de Energía.',
      citaAPA: "Ministerio de Energía. (2024). Catastro de Sistemas de Almacenamiento de Energía. IDE Energía. https://ide-energia.minenergia.cl"
    },
    'energia_bioenergia_rm': {
      id: 'energia_bioenergia_rm',
      nombre: "Centrales de Bioenergía RM",
      institucion: "Ministerio de Energía / IDE Energía",
      ministerio: 'Ministerio de Energía',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/FeatureServer",
      archivoLocal: 'data/capa_energia_bioenergia.geojson',
      color: '#16A34A',
      icono: '🌱',
      geometria: 'Centrales de Generación',
      grupo: 'economia_inversion',
      descripcion: "Centrales generadoras de energía a partir de biomasa, biogás y valorización energética en la Región Metropolitana.",
      declaracion: 'Catastro oficial provisto por IDE Energía, Ministerio de Energía.',
      citaAPA: "Ministerio de Energía. (2024). Centrales de Generación por Bioenergía. IDE Energía."
    },
    'energia_electrolineras_rm': {
      id: 'energia_electrolineras_rm',
      nombre: "Red de Electrolineras RM",
      institucion: "Ministerio de Energía / IDE Energía",
      ministerio: 'Ministerio de Energía',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/FeatureServer",
      archivoLocal: 'data/capa_energia_electrolineras.geojson',
      color: '#0284C7',
      icono: '⚡',
      geometria: 'Puntos de Carga (526 electrolineras)',
      grupo: 'movilidad_transporte',
      descripcion: "Red pública y privada de puntos de carga para vehículos eléctricos (electrolineras) habilitadas en la Región Metropolitana.",
      declaracion: 'Registro nacional oficial de infraestructura de electromovilidad, Ministerio de Energía.',
      citaAPA: "Ministerio de Energía. (2024). Red Nacional de Electrolineras. IDE Energía."
    },
    'energia_gasoducto_rm': {
      id: 'energia_gasoducto_rm',
      nombre: "Red de Gasoductos RM",
      institucion: "Ministerio de Energía / IDE Energía",
      ministerio: 'Ministerio de Energía',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/FeatureServer",
      archivoLocal: 'data/capa_energia_gasoductos.geojson',
      color: '#EA580C',
      icono: '🔥',
      geometria: 'Líneas (Trazados de Gasoducto)',
      grupo: 'economia_inversion',
      descripcion: "Trazados y redes de distribución y transporte de gas de alta y media presión en la Región Metropolitana.",
      declaracion: 'Catastro de infraestructura de transporte de hidrocarburos, IDE Energía.',
      citaAPA: "Ministerio de Energía. (2024). Red de Gasoductos de Chile. IDE Energía."
    },
    'energia_hidroelectricas_rm': {
      id: 'energia_hidroelectricas_rm',
      nombre: "Centrales Hidroeléctricas RM",
      institucion: "Ministerio de Energía / IDE Energía",
      ministerio: 'Ministerio de Energía',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/FeatureServer",
      archivoLocal: 'data/capa_energia_hidroelectricas.geojson',
      color: '#0EA5E9',
      icono: '💧',
      geometria: 'Centrales Hidroeléctricas',
      grupo: 'economia_inversion',
      descripcion: "Plantas y centrales hidroeléctricas de pasada y embalse operativas y en desarrollo en las cuencas de la RM.",
      declaracion: 'Catastro oficial de generación hidroeléctrica, Ministerio de Energía.',
      citaAPA: "Ministerio de Energía. (2024). Centrales Hidroeléctricas del Sistema Eléctrico Nacional. IDE Energía."
    },
    'energia_lineas_transmision_rm': {
      id: 'energia_lineas_transmision_rm',
      nombre: "Líneas de Transmisión Eléctrica RM",
      institucion: "Ministerio de Energía / IDE Energía",
      ministerio: 'Ministerio de Energía',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/FeatureServer",
      archivoLocal: 'data/capa_energia_lineas_transmision.geojson',
      color: '#EAB308',
      icono: '🗼',
      geometria: 'Líneas de Alta y Media Tensión',
      grupo: 'economia_inversion',
      descripcion: "Trazados de líneas de transmisión del Sistema Eléctrico Nacional (SEN) en alta tensión (110kV, 220kV, 500kV) en la RM.",
      declaracion: 'Infraestructura de transmisión troncal y zonal oficial de IDE Energía.',
      citaAPA: "Ministerio de Energía. (2024). Trazado Oficial de Líneas de Transmisión. IDE Energía."
    },
    'energia_oleoducto_rm': {
      id: 'energia_oleoducto_rm',
      nombre: "Red de Oleoductos RM",
      institucion: "Ministerio de Energía / IDE Energía",
      ministerio: 'Ministerio de Energía',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/FeatureServer",
      archivoLocal: 'data/capa_energia_oleoductos.geojson',
      color: '#475569',
      icono: '🛢️',
      geometria: 'Líneas (Trazados de Oleoducto)',
      grupo: 'economia_inversion',
      descripcion: "Oleoductos y poliductos para transporte de combustibles líquidos y derivados del petróleo en la Región Metropolitana.",
      declaracion: 'Catastro de infraestructura de transporte de combustibles líquidos, IDE Energía.',
      citaAPA: "Ministerio de Energía. (2024). Red de Oleoductos y Poliductos. IDE Energía."
    },
    'energia_solares_rm': {
      id: 'energia_solares_rm',
      nombre: "Plantas Solares Fotovoltaicas RM",
      institucion: "Ministerio de Energía / IDE Energía",
      ministerio: 'Ministerio de Energía',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/FeatureServer",
      archivoLocal: 'data/capa_energia_solares.geojson',
      color: '#F59E0B',
      icono: '☀️',
      geometria: 'Parques y Plantas Solares',
      grupo: 'economia_inversion',
      descripcion: "Parques y plantas de generación solar fotovoltaica (PMGD y de escala de utilidad) en la Región Metropolitana.",
      declaracion: 'Catastro nacional de plantas de generación solar, Ministerio de Energía.',
      citaAPA: "Ministerio de Energía. (2024). Plantas de Generación Solar Fotovoltaica. IDE Energía."
    },
    'energia_termoelectricas_rm': {
      id: 'energia_termoelectricas_rm',
      nombre: "Centrales Termoeléctricas RM",
      institucion: "Ministerio de Energía / IDE Energía",
      ministerio: 'Ministerio de Energía',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/FeatureServer",
      archivoLocal: 'data/capa_energia_termoelectricas.geojson',
      color: '#DC2626',
      icono: '🏭',
      geometria: 'Centrales Térmicas',
      grupo: 'economia_inversion',
      descripcion: "Centrales térmicas de generación eléctrica (gas natural, ciclo combinado, respaldo diésel) en la Región Metropolitana.",
      declaracion: 'Catastro oficial del parque generador térmico, Ministerio de Energía.',
      citaAPA: "Ministerio de Energía. (2024). Centrales Termoeléctricas del Sistema Eléctrico Nacional. IDE Energía."
    },
    'bbdd_23': {
      id: 'bbdd_23',
      num_bbdd: 23,
      nombre: "Sitios BIO-Prioritarios",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35909/Sitios%20prioritarios",
      archivoLocal: 'data/capa_bbdd_23.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 23: Sitios BIO-Prioritarios. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Sitios BIO-Prioritarios (Capa N° 23). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35909/Sitios%20prioritarios"
    },
    'bbdd_24': {
      id: 'bbdd_24',
      num_bbdd: 24,
      nombre: "Juzgados de Familia",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35093/Juzgados%20de%20Familia",
      archivoLocal: 'data/capa_bbdd_24.geojson',
      color: '#F59E0B',
      icono: '🛡️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'seguridad_justicia',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 24: Juzgados de Familia. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Juzgados de Familia (Capa N° 24). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35093/Juzgados%20de%20Familia"
    },
    'bbdd_25': {
      id: 'bbdd_25',
      num_bbdd: 25,
      nombre: "Estaciones Meteorológicas",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35262/Estaciones%20Meteorol%C3%B3gicas",
      archivoLocal: 'data/capa_bbdd_25.geojson',
      color: '#64748B',
      icono: '🏛️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 25: Estaciones Meteorológicas. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Estaciones Meteorológicas (Capa N° 25). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35262/Estaciones%20Meteorol%C3%B3gicas"
    },
    'bbdd_26': {
      id: 'bbdd_26',
      num_bbdd: 26,
      nombre: "Estaciones Sedimentométricas",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35265/Estaciones%20sedimentom%C3%A9tricas",
      archivoLocal: 'data/capa_bbdd_26.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 26: Estaciones Sedimentométricas. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Estaciones Sedimentométricas (Capa N° 26). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35265/Estaciones%20sedimentom%C3%A9tricas"
    },
    'bbdd_27': {
      id: 'bbdd_27',
      num_bbdd: 27,
      nombre: "Estaciones de Calidad de Aguas",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35154/Estaciones%20de%20calidad%20de%20aguas",
      archivoLocal: 'data/capa_bbdd_27.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 27: Estaciones de Calidad de Aguas. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Estaciones de Calidad de Aguas (Capa N° 27). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35154/Estaciones%20de%20calidad%20de%20aguas"
    },
    'bbdd_29': {
      id: 'bbdd_29',
      num_bbdd: 29,
      nombre: "Cuencas Banco Nacional de Aguas",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35416/Cuencas%20Banco%20Nacional%20de%20Aguas",
      archivoLocal: 'data/capa_bbdd_29.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 29: Cuencas Banco Nacional de Aguas. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Cuencas Banco Nacional de Aguas (Capa N° 29). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35416/Cuencas%20Banco%20Nacional%20de%20Aguas"
    },
    'bbdd_30': {
      id: 'bbdd_30',
      num_bbdd: 30,
      nombre: "Indice Calidad de Aguas",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35251/Calidad%20aguas",
      archivoLocal: 'data/capa_bbdd_30.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 30: Indice Calidad de Aguas. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Indice Calidad de Aguas (Capa N° 30). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35251/Calidad%20aguas"
    },
    'bbdd_31': {
      id: 'bbdd_31',
      num_bbdd: 31,
      nombre: "Ciclovías",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/dashboard/118",
      archivoLocal: 'data/capa_bbdd_31.geojson',
      color: '#06B6D4',
      icono: '🚲',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'movilidad_transporte',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 31: Ciclovías. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Ciclovías (Capa N° 31). IDE Chile / Geoportal. https://geoportal.cl/geoportal/dashboard/118"
    },
    'bbdd_32': {
      id: 'bbdd_32',
      num_bbdd: 32,
      nombre: "Vertederos Ilegales",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35653/Vertederos%20Ilegales",
      archivoLocal: 'data/capa_bbdd_32.geojson',
      color: '#64748B',
      icono: '🏛️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 32: Vertederos Ilegales. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Vertederos Ilegales (Capa N° 32). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35653/Vertederos%20Ilegales"
    },
    'bbdd_33': {
      id: 'bbdd_33',
      num_bbdd: 33,
      nombre: "Plan Cuadrante Carabineros",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35002/Plan%20Cuadrante",
      archivoLocal: 'data/capa_bbdd_33.geojson',
      color: '#F59E0B',
      icono: '🛡️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'seguridad_justicia',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 33: Plan Cuadrante Carabineros. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Plan Cuadrante Carabineros (Capa N° 33). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35002/Plan%20Cuadrante"
    },
    'bbdd_34': {
      id: 'bbdd_34',
      num_bbdd: 34,
      nombre: "Zonas climáticas de Chile según Köppen-Geiger escala 1:1.500.000",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35414/Zonas%20clim%C3%A1ticas%20de%20Chile%20seg%C3%BAn%20K%C3%B6ppen-Geiger%20escala%201:1.500.000",
      archivoLocal: 'data/capa_bbdd_34.geojson',
      color: '#64748B',
      icono: '🏛️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 34: Zonas climáticas de Chile según Köppen-Geiger escala 1:1.500.000. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Zonas climáticas de Chile según Köppen-Geiger escala 1:1.500.000 (Capa N° 34). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35414/Zonas%20clim%C3%A1ticas%20de%20Chile%20seg%C3%BAn%20K%C3%B6ppen-Geiger%20escala%201:1.500.000"
    },
    'bbdd_35': {
      id: 'bbdd_35',
      num_bbdd: 35,
      nombre: "Antenas en Servicio Ley de Torres",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35911/Antenas%20en%20Servicio%20Ley%20de%20Torres",
      archivoLocal: 'data/capa_bbdd_35.geojson',
      color: '#F97316',
      icono: '💰',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'economia_inversion',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 35: Antenas en Servicio Ley de Torres. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Antenas en Servicio Ley de Torres (Capa N° 35). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35911/Antenas%20en%20Servicio%20Ley%20de%20Torres"
    },
    'bbdd_37': {
      id: 'bbdd_37',
      num_bbdd: 37,
      nombre: "Red de Interconexión",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35419/Red%20de%20Interconexi%C3%B3n",
      archivoLocal: 'data/capa_bbdd_37.geojson',
      color: '#06B6D4',
      icono: '🚲',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'movilidad_transporte',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 37: Red de Interconexión. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Red de Interconexión (Capa N° 37). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35419/Red%20de%20Interconexi%C3%B3n"
    },
    'bbdd_38': {
      id: 'bbdd_38',
      num_bbdd: 38,
      nombre: "Territorios de los Servicios de Salud",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35388/Territorios%20de%20los%20Servicios%20de%20Salud",
      archivoLocal: 'data/capa_bbdd_38.geojson',
      color: '#EF4444',
      icono: '🏥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 38: Territorios de los Servicios de Salud. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Territorios de los Servicios de Salud (Capa N° 38). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35388/Territorios%20de%20los%20Servicios%20de%20Salud"
    },
    'bbdd_39': {
      id: 'bbdd_39',
      num_bbdd: 39,
      nombre: "Estaciones de monitoreo de calidad de aire (Red Pública)",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35152/Estaciones%20de%20monitoreo%20de%20calidad%20de%20aire%20%28Red%20P%C3%BAblica%29",
      archivoLocal: 'data/capa_bbdd_39.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 39: Estaciones de monitoreo de calidad de aire (Red Pública). Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Estaciones de monitoreo de calidad de aire (Red Pública) (Capa N° 39). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35152/Estaciones%20de%20monitoreo%20de%20calidad%20de%20aire%20%28Red%20P%C3%BAblica%29"
    },
    'bbdd_40': {
      id: 'bbdd_40',
      num_bbdd: 40,
      nombre: "Circuitos Turísticos",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35141/Circuitos%20Tur%C3%ADsticos",
      archivoLocal: 'data/capa_bbdd_40.geojson',
      color: '#8B5CF6',
      icono: '⚽',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'equipamiento_patrimonio',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 40: Circuitos Turísticos. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Circuitos Turísticos (Capa N° 40). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35141/Circuitos%20Tur%C3%ADsticos"
    },
    'ccu_rm_1993': {
      id: 'ccu_rm_1993',
      nombre: "Continuo de Construcciones Urbanas (1993)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_1993.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 1993)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 1993, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (1993). Continuo de Construcciones Urbanas RM 1993. DDU, MINVU."
    },
    'ccu_rm_2002': {
      id: 'ccu_rm_2002',
      nombre: "Continuo de Construcciones Urbanas (2002)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2002.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2002)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2002, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2002). Continuo de Construcciones Urbanas RM 2002. DDU, MINVU."
    },
    'ccu_rm_2006': {
      id: 'ccu_rm_2006',
      nombre: "Continuo de Construcciones Urbanas (2006)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2006.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2006)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2006, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2006). Continuo de Construcciones Urbanas RM 2006. DDU, MINVU."
    },
    'ccu_rm_2011': {
      id: 'ccu_rm_2011',
      nombre: "Continuo de Construcciones Urbanas (2011)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2011.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2011)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2011, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2011). Continuo de Construcciones Urbanas RM 2011. DDU, MINVU."
    },
    'ccu_rm_2017': {
      id: 'ccu_rm_2017',
      nombre: "Continuo de Construcciones Urbanas (2017)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2017.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2017)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2017, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2017). Continuo de Construcciones Urbanas RM 2017. DDU, MINVU."
    },
    'ccu_rm_2018': {
      id: 'ccu_rm_2018',
      nombre: "Continuo de Construcciones Urbanas (2018)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2018.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2018)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2018, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2018). Continuo de Construcciones Urbanas RM 2018. DDU, MINVU."
    },
    'ccu_rm_2019': {
      id: 'ccu_rm_2019',
      nombre: "Continuo de Construcciones Urbanas (2019)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2019.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2019)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2019, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2019). Continuo de Construcciones Urbanas RM 2019. DDU, MINVU."
    },
    'ccu_rm_2020': {
      id: 'ccu_rm_2020',
      nombre: "Continuo de Construcciones Urbanas (2020)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2020.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2020)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2020, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2020). Continuo de Construcciones Urbanas RM 2020. DDU, MINVU."
    },
    'ccu_rm_2021': {
      id: 'ccu_rm_2021',
      nombre: "Continuo de Construcciones Urbanas (2021)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2021.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2021)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2021, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2021). Continuo de Construcciones Urbanas RM 2021. DDU, MINVU."
    },
    'ccu_rm_2022': {
      id: 'ccu_rm_2022',
      nombre: "Continuo de Construcciones Urbanas (2022)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2022.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2022)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2022, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2022). Continuo de Construcciones Urbanas RM 2022. DDU, MINVU."
    },
    'ccu_rm_2023': {
      id: 'ccu_rm_2023',
      nombre: "Continuo de Construcciones Urbanas (2023)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2023.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2023)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2023, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2023). Continuo de Construcciones Urbanas RM 2023. DDU, MINVU."
    },
    'ccu_rm_2024': {
      id: 'ccu_rm_2024',
      nombre: "Continuo de Construcciones Urbanas (2024)",
      institucion: "Ministerio de Vivienda y Urbanismo (MINVU)",
      ministerio: 'División de Desarrollo Urbano (DDU)',
      tipoServicio: 'Vectorial GeoJSON Oficial',
      urlServicio: "https://geoide.minvu.cl/server/rest/services/Otros/CCU_1993_2019/FeatureServer",
      archivoLocal: 'data/capa_ccu_2024.geojson',
      color: '#64748B',
      icono: '🏙️',
      geometria: 'Polígonos (Huella Urbana 2024)',
      grupo: 'equipamiento_patrimonio',
      descripcion: "Catastro oficial del Continuo de Construcciones Urbanas (CCU) de la Región Metropolitana para el año 2024, elaborado por el MINVU para monitorear la expansión y huella urbana.",
      declaracion: 'Información pública oficial del MINVU para el análisis de dinámica urbana y ocupación de suelo.',
      citaAPA: "Ministerio de Vivienda y Urbanismo [MINVU]. (2024). Continuo de Construcciones Urbanas RM 2024. DDU, MINVU."
    },
    'bbdd_42': {
      id: 'bbdd_42',
      num_bbdd: 42,
      nombre: "Pisos vegetacionales de Luebert y Pliscoff 2017",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/32581/Pisos%20vegetacionales%20de%20Luebert%20y%20Pliscoff%202017",
      archivoLocal: 'data/capa_bbdd_42.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 42: Pisos vegetacionales de Luebert y Pliscoff 2017. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Pisos vegetacionales de Luebert y Pliscoff 2017 (Capa N° 42). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/32581/Pisos%20vegetacionales%20de%20Luebert%20y%20Pliscoff%202017"
    },
    'bbdd_43': {
      id: 'bbdd_43',
      num_bbdd: 43,
      nombre: "División Política Administrativa 2023",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/36391/Divisi%C3%B3n%20Pol%C3%ADtica%20Administrativa%202023",
      archivoLocal: 'data/capa_bbdd_43.geojson',
      color: '#D97706',
      icono: '📜',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'normativa_ipt',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 43: División Política Administrativa 2023. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). División Política Administrativa 2023 (Capa N° 43). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/36391/Divisi%C3%B3n%20Pol%C3%ADtica%20Administrativa%202023"
    },
    'bbdd_44': {
      id: 'bbdd_44',
      num_bbdd: 44,
      nombre: "Municipios con certificación ambiental (SCAM)",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35656/Municipios%20con%20certificaci%C3%B3n%20ambiental%20%28SCAM%29",
      archivoLocal: 'data/capa_bbdd_44.geojson',
      color: '#6366F1',
      icono: '👥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 44: Municipios con certificación ambiental (SCAM). Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Municipios con certificación ambiental (SCAM) (Capa N° 44). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35656/Municipios%20con%20certificaci%C3%B3n%20ambiental%20%28SCAM%29"
    },
    'bbdd_46': {
      id: 'bbdd_46',
      num_bbdd: 46,
      nombre: "Predios Urbanos (Comuna de Santiago)",
      institucion: "Servicio de Impuestos Internos (SII) / IDE Chile",
      ministerio: 'Ministerio de Hacienda',
      tipoServicio: 'Vectorial GeoJSON Oficial (Comuna Completa)',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35406/Predios",
      archivoLocal: 'data/capa_bbdd_46.geojson',
      color: '#B45309',
      icono: '📐',
      geometria: 'Polígonos (35.036 Predios Santiago)',
      grupo: 'normativa_ipt',
      joinInfo: "ORIGINAL",
      descripcion: "Catastro predial oficial completo de la Comuna de Santiago (35.036 roles prediales). Cobertura comunal íntegra sin simplificar, con roles, avalúos y destinos del Servicio de Impuestos Internos.",
      declaracion: 'Cartografía predial oficial provista por el Servicio de Impuestos Internos y distribuida vía IDE Chile / Geoportal.',
      citaAPA: "Servicio de Impuestos Internos [SII]. (2024). Catastro Cartográfico de Predios Comuna de Santiago. IDE Chile. https://geoportal.cl"
    },
    'bbdd_47': {
      id: 'bbdd_47',
      num_bbdd: 47,
      nombre: "Zona Fronteriza",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/36570/Zona%20Fronteriza",
      archivoLocal: 'data/capa_bbdd_47.geojson',
      color: '#D97706',
      icono: '📜',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'normativa_ipt',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 47: Zona Fronteriza. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Zona Fronteriza (Capa N° 47). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/36570/Zona%20Fronteriza"
    },
    'bbdd_48': {
      id: 'bbdd_48',
      num_bbdd: 48,
      nombre: "Pasos Fronterizos",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/36573/Pasos%20Fronterizos",
      archivoLocal: 'data/capa_bbdd_48.geojson',
      color: '#D97706',
      icono: '📜',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'normativa_ipt',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 48: Pasos Fronterizos. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Pasos Fronterizos (Capa N° 48). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/36573/Pasos%20Fronterizos"
    },
    'bbdd_49': {
      id: 'bbdd_49',
      num_bbdd: 49,
      nombre: "Estaciones Fluviométricas",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35258/Estaciones%20Fluviom%C3%A9tricas",
      archivoLocal: 'data/capa_bbdd_49.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 49: Estaciones Fluviométricas. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Estaciones Fluviométricas (Capa N° 49). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35258/Estaciones%20Fluviom%C3%A9tricas"
    },
    'bbdd_50': {
      id: 'bbdd_50',
      num_bbdd: 50,
      nombre: "Oficinas de Protección de Derechos (ODP)",
      institucion: "Estado de Chile / IDE Chile / geoportal.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://geoportal.cl/geoportal/catalog/35094/Oficinas%20de%20Protecci%C3%B3n%20de%20Derechos%20%28ODP%29",
      archivoLocal: 'data/capa_bbdd_50.geojson',
      color: '#6366F1',
      icono: '👥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 50: Oficinas de Protección de Derechos (ODP). Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Oficinas de Protección de Derechos (ODP) (Capa N° 50). IDE Chile / Geoportal. https://geoportal.cl/geoportal/catalog/35094/Oficinas%20de%20Protecci%C3%B3n%20de%20Derechos%20%28ODP%29"
    },
    'bbdd_51': {
      id: 'bbdd_51',
      num_bbdd: 51,
      nombre: "Localización de viveros en Chile continental",
      institucion: "Estado de Chile / IDE Chile / ide.minagri.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://ide.minagri.gob.cl/descarga-de-capas-shp/agricultura-y-ganaderia/",
      archivoLocal: 'data/capa_bbdd_51.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 51: Localización de viveros en Chile continental. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Localización de viveros en Chile continental (Capa N° 51). IDE Chile / Geoportal. https://ide.minagri.gob.cl/descarga-de-capas-shp/agricultura-y-ganaderia/"
    },
    'bbdd_52': {
      id: 'bbdd_52',
      num_bbdd: 52,
      nombre: "Estaciones Meteorológicas Automáticas (FIA)",
      institucion: "Estado de Chile / IDE Chile / ide.minagri.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://ide.minagri.gob.cl/descarga-de-capas-shp/clima/",
      archivoLocal: 'data/capa_bbdd_52.geojson',
      color: '#64748B',
      icono: '🏛️',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 52: Estaciones Meteorológicas Automáticas (FIA). Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Estaciones Meteorológicas Automáticas (FIA) (Capa N° 52). IDE Chile / Geoportal. https://ide.minagri.gob.cl/descarga-de-capas-shp/clima/"
    },
    'bbdd_53': {
      id: 'bbdd_53',
      num_bbdd: 53,
      nombre: "Industria Forestal Primeria (INFOR)",
      institucion: "Estado de Chile / IDE Chile / ide.minagri.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://ide.minagri.gob.cl/descarga-de-capas-shp/economia/",
      archivoLocal: 'data/capa_bbdd_53.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 53: Industria Forestal Primeria (INFOR). Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Industria Forestal Primeria (INFOR) (Capa N° 53). IDE Chile / Geoportal. https://ide.minagri.gob.cl/descarga-de-capas-shp/economia/"
    },
    'bbdd_54': {
      id: 'bbdd_54',
      num_bbdd: 54,
      nombre: "Mercados Mayoristas (ODEPA)",
      institucion: "Estado de Chile / IDE Chile / ide.minagri.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://ide.minagri.gob.cl/descarga-de-capas-shp/economia/",
      archivoLocal: 'data/capa_bbdd_54.geojson',
      color: '#F97316',
      icono: '💰',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'economia_inversion',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 54: Mercados Mayoristas (ODEPA). Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Mercados Mayoristas (ODEPA) (Capa N° 54). IDE Chile / Geoportal. https://ide.minagri.gob.cl/descarga-de-capas-shp/economia/"
    },
    'bbdd_55': {
      id: 'bbdd_55',
      num_bbdd: 55,
      nombre: "Sistema Nacional de Áreas Silvestres Protegidas del Estado",
      institucion: "Estado de Chile / IDE Chile / ide.minagri.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://ide.minagri.gob.cl/descarga-de-capas-shp/medio-ambiente/",
      archivoLocal: 'data/capa_bbdd_55.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 55: Sistema Nacional de Áreas Silvestres Protegidas del Estado. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Sistema Nacional de Áreas Silvestres Protegidas del Estado (Capa N° 55). IDE Chile / Geoportal. https://ide.minagri.gob.cl/descarga-de-capas-shp/medio-ambiente/"
    },
    'bbdd_59': {
      id: 'bbdd_59',
      num_bbdd: 59,
      nombre: "Cobertura de canales a nivel nacional",
      institucion: "Estado de Chile / IDE Chile / ide.minagri.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://ide.minagri.gob.cl/descarga-de-capas-shp/aguas-continentales/",
      archivoLocal: 'data/capa_bbdd_59.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 59: Cobertura de canales a nivel nacional. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Cobertura de canales a nivel nacional (Capa N° 59). IDE Chile / Geoportal. https://ide.minagri.gob.cl/descarga-de-capas-shp/aguas-continentales/"
    },
    'bbdd_60': {
      id: 'bbdd_60',
      num_bbdd: 60,
      nombre: "Catastro y Actualización de los Recursos Vegetacionales y Uso de la Tierra de la Región de Metropolitana (XIII)",
      institucion: "Estado de Chile / IDE Chile / ide.minagri.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://ide.minagri.gob.cl/descarga-de-capas-shp/planificacion-catastral/",
      archivoLocal: 'data/capa_bbdd_60.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 60: Catastro y Actualización de los Recursos Vegetacionales y Uso de la Tierra de la Región de Metropolitana (XIII). Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Catastro y Actualización de los Recursos Vegetacionales y Uso de la Tierra de la Región de Metropolitana (XIII) (Capa N° 60). IDE Chile / Geoportal. https://ide.minagri.gob.cl/descarga-de-capas-shp/planificacion-catastral/"
    },
    'bbdd_62': {
      id: 'bbdd_62',
      num_bbdd: 62,
      nombre: "Cobertura de polígonos representativos de los huertos frutales de la Región Metropolitana 2025",
      institucion: "Estado de Chile / IDE Chile / icet.odepa.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://icet.odepa.gob.cl/",
      archivoLocal: 'data/capa_bbdd_62.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 62: Cobertura de polígonos representativos de los huertos frutales de la Región Metropolitana 2025. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Cobertura de polígonos representativos de los huertos frutales de la Región Metropolitana 2025 (Capa N° 62). IDE Chile / Geoportal. https://icet.odepa.gob.cl/"
    },
    'bbdd_63': {
      id: 'bbdd_63',
      num_bbdd: 63,
      nombre: "Inventario de Biomasa y Carbono - Metropolitana tipo Forestal",
      institucion: "Estado de Chile / IDE Chile / sit.conaf.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://sit.conaf.cl/",
      archivoLocal: 'data/capa_bbdd_63.geojson',
      color: '#10B981',
      icono: '🌳',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'medio_ambiente',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 63: Inventario de Biomasa y Carbono - Metropolitana tipo Forestal. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Inventario de Biomasa y Carbono - Metropolitana tipo Forestal (Capa N° 63). IDE Chile / Geoportal. https://sit.conaf.cl/"
    },
    'bbdd_64': {
      id: 'bbdd_64',
      num_bbdd: 64,
      nombre: "Índice Global de Vulnerabilidad Socioterritorial (IGVUST) por UV 2026 Agosto",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/bases-de-datos-agosto-2026",
      archivoLocal: 'data/IGVUST_UV_2026_Agosto.geojson',
      archivoAlternativo: 'data/capa_bbdd_64.geojson',
      color: '#6366F1',
      icono: '👥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "Unidades Vecinales 2026",
      descripcion: "Capa cartográfica e indicador territorial N° 64: Índice Global de Vulnerabilidad Socioterritorial (IGVUST) por UV 2026 Agosto. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Índice Global de Vulnerabilidad Socioterritorial (IGVUST) por UV 2026 Agosto (Capa N° 64). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/bases-de-datos-agosto-2026"
    },
    'bbdd_65': {
      id: 'bbdd_65',
      num_bbdd: 65,
      nombre: "Iniciativas de inversión del Banco Integrado de Proyectos (BIP), por años, al 31-08-2026.",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/registro-de-proyectos-de-inversion?page=1",
      archivoLocal: 'data/BIP_Iniciativas_Inversion_RM_Comunas.geojson',
      archivoAlternativo: 'data/capa_bbdd_65.geojson',
      color: '#3B82F6',
      icono: '🏫',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'economia_inversion',
      joinInfo: "Comuna / Región Metropolitana",
      descripcion: "Capa cartográfica e indicador territorial N° 65: Iniciativas de inversión del Banco Integrado de Proyectos (BIP), por años, al 31-08-2026.. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Iniciativas de inversión del Banco Integrado de Proyectos (BIP), por años, al 31-08-2026. (Capa N° 65). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/registro-de-proyectos-de-inversion?page=1"
    },
    'bbdd_66': {
      id: 'bbdd_66',
      num_bbdd: 66,
      nombre: "Unidades Vecinales 2026",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/shape-de-unidades-vecinales-del-registro-social-de-hogares",
      archivoLocal: 'data/capa_bbdd_66.geojson',
      color: '#6366F1',
      icono: '👥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "ORIGINAL",
      descripcion: "Capa cartográfica e indicador territorial N° 66: Unidades Vecinales 2026. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Unidades Vecinales 2026 (Capa N° 66). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/shape-de-unidades-vecinales-del-registro-social-de-hogares"
    },
    'bbdd_67': {
      id: 'bbdd_67',
      num_bbdd: 67,
      nombre: "Personas en RSH en situación de dependencia funcional según CSE - 2026 Agosto",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/personas-en-rsh-en-situacion-dependencia-funcional-segun-cse-2026",
      archivoLocal: 'data/RSH_Dependencia_Funcional_UV_2026_Agosto.geojson',
      archivoAlternativo: 'data/capa_bbdd_67.geojson',
      color: '#EF4444',
      icono: '🏥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "Unidades Vecinales 2026",
      descripcion: "Capa cartográfica e indicador territorial N° 67: Personas en RSH en situación de dependencia funcional según CSE - 2026 Agosto. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Personas en RSH en situación de dependencia funcional según CSE - 2026 Agosto (Capa N° 67). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/personas-en-rsh-en-situacion-dependencia-funcional-segun-cse-2026"
    },
    'bbdd_68': {
      id: 'bbdd_68',
      num_bbdd: 68,
      nombre: "Personas en RSH según CSE y sexo - 2026 Agosto",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/personas-en-rsh-segun-cse-y-sexo-2026",
      archivoLocal: 'data/RSH_Sexo_UV_2026_Agosto.geojson',
      archivoAlternativo: 'data/capa_bbdd_68.geojson',
      color: '#6366F1',
      icono: '👥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "Unidades Vecinales 2026",
      descripcion: "Capa cartográfica e indicador territorial N° 68: Personas en RSH según CSE y sexo - 2026 Agosto. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Personas en RSH según CSE y sexo - 2026 Agosto (Capa N° 68). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/personas-en-rsh-segun-cse-y-sexo-2026"
    },
    'bbdd_69': {
      id: 'bbdd_69',
      num_bbdd: 69,
      nombre: "NNA en RSH adscritas a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/nna-en-rsh-adscritas-fonasa-isapre-segun-cse-y-tipo-institucion-2026",
      archivoLocal: 'data/NNA_RSH_Fonasa_Isapre_UV_2026_Junio.geojson',
      archivoAlternativo: 'data/capa_bbdd_69.geojson',
      color: '#EF4444',
      icono: '🏥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "Unidades Vecinales 2026",
      descripcion: "Capa cartográfica e indicador territorial N° 69: NNA en RSH adscritas a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). NNA en RSH adscritas a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio (Capa N° 69). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/nna-en-rsh-adscritas-fonasa-isapre-segun-cse-y-tipo-institucion-2026"
    },
    'bbdd_70': {
      id: 'bbdd_70',
      num_bbdd: 70,
      nombre: "Mujeres en RSH adscritas a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/mujeres-en-rsh-adscritas-fonasa-isapre-segun-cse-y-tipo-institucion-2026",
      archivoLocal: 'data/Mujeres_RSH_Fonasa_Isapre_UV_2026_Junio.geojson',
      archivoAlternativo: 'data/capa_bbdd_70.geojson',
      color: '#EF4444',
      icono: '🏥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "Unidades Vecinales 2026",
      descripcion: "Capa cartográfica e indicador territorial N° 70: Mujeres en RSH adscritas a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Mujeres en RSH adscritas a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio (Capa N° 70). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/mujeres-en-rsh-adscritas-fonasa-isapre-segun-cse-y-tipo-institucion-2026"
    },
    'bbdd_71': {
      id: 'bbdd_71',
      num_bbdd: 71,
      nombre: "Jóvenes en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/jovenes-en-rsh-adscritos-fonasa-isapre-segun-cse-y-tipo-institucion-2026",
      archivoLocal: 'data/Jovenes_RSH_Fonasa_Isapre_UV_2026_Junio.geojson',
      archivoAlternativo: 'data/capa_bbdd_71.geojson',
      color: '#EF4444',
      icono: '🏥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "Unidades Vecinales 2026",
      descripcion: "Capa cartográfica e indicador territorial N° 71: Jóvenes en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Jóvenes en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio (Capa N° 71). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/jovenes-en-rsh-adscritos-fonasa-isapre-segun-cse-y-tipo-institucion-2026"
    },
    'bbdd_72': {
      id: 'bbdd_72',
      num_bbdd: 72,
      nombre: "Hombres en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/hombres-en-rsh-adscritos-fonasa-isapre-segun-cse-y-tipo-institucion-2026",
      archivoLocal: 'data/Hombres_RSH_Fonasa_Isapre_UV_2026_Junio.geojson',
      archivoAlternativo: 'data/capa_bbdd_72.geojson',
      color: '#EF4444',
      icono: '🏥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "Unidades Vecinales 2026",
      descripcion: "Capa cartográfica e indicador territorial N° 72: Hombres en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Hombres en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio (Capa N° 72). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/hombres-en-rsh-adscritos-fonasa-isapre-segun-cse-y-tipo-institucion-2026"
    },
    'bbdd_73': {
      id: 'bbdd_73',
      num_bbdd: 73,
      nombre: "Personas mayores en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/personas-mayores-en-rsh-adscritos-fonasa-isapre-segun-cse-y-tipo-institucion-2026",
      archivoLocal: 'data/Mayores_RSH_Fonasa_Isapre_UV_2026_Junio.geojson',
      archivoAlternativo: 'data/capa_bbdd_73.geojson',
      color: '#EF4444',
      icono: '🏥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'social_demografia',
      joinInfo: "Unidades Vecinales 2026",
      descripcion: "Capa cartográfica e indicador territorial N° 73: Personas mayores en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Personas mayores en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio (Capa N° 73). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/personas-mayores-en-rsh-adscritos-fonasa-isapre-segun-cse-y-tipo-institucion-2026"
    },
    'bbdd_74': {
      id: 'bbdd_74',
      num_bbdd: 74,
      nombre: "Personas en RSH ocupadas y cotizando, por modalidad contractual según tramo CSE - 2026 Junio",
      institucion: "Estado de Chile / IDE Chile / bidat.gob.cl",
      ministerio: 'Organismo Público del Estado de Chile',
      tipoServicio: 'Vectorial GeoJSON / Tabular BIDAT / OGC WMS',
      urlServicio: "https://bidat.gob.cl/details/ficha/dataset/personas-en-rsh-ocupadas-y-cotizando-por-modalidad-contractual-segun-tramo-cse-2026",
      archivoLocal: 'data/RSH_Ocupados_Cotizando_UV_2026_Junio.geojson',
      archivoAlternativo: 'data/capa_bbdd_74.geojson',
      color: '#6366F1',
      icono: '👥',
      geometria: 'Vectorial / Tabular Georreferenciada',
      grupo: 'economia_inversion',
      joinInfo: "Unidades Vecinales 2026",
      descripcion: "Capa cartográfica e indicador territorial N° 74: Personas en RSH ocupadas y cotizando, por modalidad contractual según tramo CSE - 2026 Junio. Catastrada e integrada al Atlas VGI con respaldo de metadatos estandarizados.",
      declaracion: 'Información pública oficial del Estado de Chile amparada por la Ley N° 20.285 de Transparencia.',
      citaAPA: "Estado de Chile. (2026). Personas en RSH ocupadas y cotizando, por modalidad contractual según tramo CSE - 2026 Junio (Capa N° 74). IDE Chile / Geoportal. https://bidat.gob.cl/details/ficha/dataset/personas-en-rsh-ocupadas-y-cotizando-por-modalidad-contractual-segun-tramo-cse-2026"
    },
    'semaforos_rm_uoct_2026': {
      id: 'semaforos_rm_uoct_2026',
      nombre: "Cruces Semaforizados Conectados SC-RM (UOCT / MTT)",
      institucion: "Unidad Operativa de Control de Tránsito (UOCT) / MTT",
      ministerio: "Ministerio de Transportes y Telecomunicaciones",
      tipoServicio: "Catastro Oficial GeoPackage / Transparencia Ley 20.285",
      urlServicio: "https://www.uoct.gob.cl",
      archivoLocal: "data/semaforos_rm_uoct_2026.geojson",
      color: "#F59E0B",
      icono: "🚦",
      geometria: "Puntos (Cruces Semaforizados)",
      grupo: "movilidad_transporte",
      descripcion: "Catastro oficial de 3.483 intersecciones y cruces semaforizados integrados al Sistema de Control de Tránsito de la Región Metropolitana (SC-RM). Entrega oficial bajo Oficio N° 26105 / 2026 (Solicitud AN001T0026930), con códigos junction, vías intersectadas, comuna, modelo de controlador, comunicación y vigencia a julio 2026.",
      declaracion: "Información pública oficial del Ministerio de Transportes y Telecomunicaciones amparada por la Ley N° 20.285 de Transparencia de la Función Pública.",
      citaAPA: "Subsecretaría de Transportes & Unidad Operativa de Control de Tránsito [UOCT]. (2026). Catastro de Intersecciones Semaforizadas Conectadas al Sistema de Control de la Región Metropolitana (Oficio N° 26105, Solicitud AN001T0026930). Ministerio de Transportes y Telecomunicaciones."
    },
    'catastro_predial_sii': {
      id: 'catastro_predial_sii',
      num_bbdd: 'SII-01',
      nombre: "Catastro Predial del Servicio de Impuestos Internos (Segundo Semestre 2025)",
      institucion: "Servicio de Impuestos Internos (SII)",
      ministerio: 'Ministerio de Hacienda',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana & Nacional',
      urlServicio: "https://www.sii.cl",
      archivoLocal: 'data/capa_catastro_predial_sii.geojson',
      archivoNacional: 'data/Catastro_SII_Geocodificado_v4_Pais.gpkg',
      color: '#D97706',
      icono: '🏛️',
      geometria: 'Puntos (Predios Geocodificados)',
      grupo: 'normativa_ipt',
      joinInfo: "ROL SII (Comuna - Manzana - Predio)",
      temporalidad: "Segundo Semestre 2025",
      descripcion: "Catastro Oficial de Bienes Raíces del Servicio de Impuestos Internos (SII), correspondiente al Segundo Semestre de 2025. Cobertura de predios urbanos geocodificados con ROL (Comuna-Manzana-Predio), dirección predial, avalúo fiscal y superficies de terreno y construidas. ℹ️ ALERTA DE COBERTURA: La base de datos íntegra contiene la totalidad de los predios geocodificados para todo Chile (1.380.649 propiedades en GeoPackage nacional), pero por motivos de rendimiento y peso del archivo en la interfaz web, en el visor interactivo del Atlas solo se despliegan los predios correspondientes a la Región Metropolitana (264.195 predios).",
      declaracion: 'Información pública oficial del Catastro de Bienes Raíces del Servicio de Impuestos Internos (SII) correspondiente al Segundo Semestre de 2025, amparada por la Ley N° 20.285 de Transparencia de la Función Pública.',
      citaAPA: "Servicio de Impuestos Internos [SII]. (2025). Catastro de Bienes Raíces (Segundo Semestre 2025). Ministerio de Hacienda, Gobierno de Chile. https://www.sii.cl"
    }
  ,
// =========================================================================
    // SUBDERE - CATASTRO NACIONAL DE RESIDUOS SÓLIDOS DOMICILIARIOS (RSD 2024)
    // =========================================================================
    subdere_rsd_analisis_costos_comuna_rm: {
      id: 'subdere_rsd_analisis_costos_comuna_rm',
      num_bbdd: 'RSD-01',
      nombre: 'SUBDERE RSD 2024 - Costos Comunales de Aseo (RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/Analisis_Costos_Comuna_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/Analisis_Costos_Comuna_RM.gpkg',
      color: '#10B981',
      icono: '💰',
      geometria: 'Polígonos Comunales',
      grupo: 'medio_ambiente',
      descripcion: 'Costos anuales devengados por municipio en los servicios de recolección, transporte y disposición final de residuos sólidos domiciliarios en la Región Metropolitana, incluyendo costo por habitante ($/hab) y por tonelada gestionada ($/Ton).',
      declaracion: 'Información pública oficial del Catastro Nacional de Residuos Sólidos Domiciliarios provista por SUBDERE bajo la Ley N° 20.285 de Transparencia de la Función Pública.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_poblacion_atendida_pta_puntos_rm: {
      id: 'subdere_rsd_poblacion_atendida_pta_puntos_rm',
      num_bbdd: 'RSD-02',
      nombre: 'SUBDERE RSD 2024 - Población Total Atendida PTA (Centroides RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/Poblacion_Comunal_Atendida_PTA_p_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/Poblacion_Comunal_Atendida_PTA_p_RM.gpkg',
      color: '#059669',
      icono: '👥',
      geometria: 'Puntos (Centroides Comunales)',
      grupo: 'medio_ambiente',
      descripcion: 'Centroides comunales con estadísticas de cobertura de aseo urbana y rural, Población Comunal Atendida (PCA), Población Flotante Turística (PFP) y Población Total Atendida (PTA = PCA + PFP).',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_poblacion_comunal_pta_poligonos_rm: {
      id: 'subdere_rsd_poblacion_comunal_pta_poligonos_rm',
      num_bbdd: 'RSD-03',
      nombre: 'SUBDERE RSD 2024 - Población Total Atendida PTA (Polígonos RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/Poblacion_Comunal_PTA_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/Poblacion_Comunal_PTA_RM.gpkg',
      color: '#047857',
      icono: '🏙️',
      geometria: 'Polígonos Comunales',
      grupo: 'medio_ambiente',
      descripcion: 'Límites comunales con indicadores de cobertura del servicio de aseo (urbano/rural), volumen de población atendida residente y ponderación de población flotante en la Región Metropolitana.',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_ciudades_poblacion_rm: {
      id: 'subdere_rsd_ciudades_poblacion_rm',
      num_bbdd: 'RSD-04',
      nombre: 'SUBDERE RSD 2024 - Ciudades y Entidades Urbanas (RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/Ciudades_Pb_Pol_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/Ciudades_Pb_Pol_RM.gpkg',
      color: '#14B8A6',
      icono: '🏘️',
      geometria: 'Polígonos Urbanos',
      grupo: 'medio_ambiente',
      descripcion: 'Polígonos de ciudades y centros poblados de la Región Metropolitana con categoría censal, jerarquía urbana y concentración demográfica.',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_criticidad_sitios_disposicion_rm: {
      id: 'subdere_rsd_criticidad_sitios_disposicion_rm',
      num_bbdd: 'RSD-05',
      nombre: 'SUBDERE RSD 2024 - Criticidad de Rellenos Sanitarios (RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/Criticidad_Sitios_Disposicion_RSD_Ene24_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/Criticidad_Sitios_Disposicion_RSD_Ene24_RM.gpkg',
      color: '#EF4444',
      icono: '⚠️',
      geometria: 'Puntos (Rellenos Sanitarios)',
      grupo: 'medio_ambiente',
      descripcion: 'Evaluación de criticidad operativa de los rellenos sanitarios en la RM (Loma Los Colorados, Santa Marta, Santiago Poniente), según vida útil remanente, población atendida y estado sanitario.',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_distancia_municipio_sdf_rm: {
      id: 'subdere_rsd_distancia_municipio_sdf_rm',
      num_bbdd: 'RSD-06',
      nombre: 'SUBDERE RSD 2024 - Distancias Municipio a Relleno Sanitario (RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/Distancia_Municipio_SDF_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/Distancia_Municipio_SDF_RM.gpkg',
      color: '#F59E0B',
      icono: '🛣️',
      geometria: 'Líneas de Transporte',
      grupo: 'medio_ambiente',
      descripcion: 'Vectores y distancias efectivas de transporte en kilómetros desde los municipios de la Región Metropolitana hasta sus respectivos sitios de disposición final autorizados.',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_gastos_ingresos_sinim_rm: {
      id: 'subdere_rsd_gastos_ingresos_sinim_rm',
      num_bbdd: 'RSD-07',
      nombre: 'SUBDERE RSD 2024 - Finanzas Municipales y Gasto en Aseo SINIM (RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/Gastos_Ingresos_SINIM_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/Gastos_Ingresos_SINIM_RM.gpkg',
      color: '#0284C7',
      icono: '📊',
      geometria: 'Polígonos Comunales',
      grupo: 'medio_ambiente',
      descripcion: 'Información financiera municipal (SINIM) que vincula el gasto en extracción de basura con ingresos propios permanentes (IPP), dependencia del Fondo Común Municipal (FCM) y cobro de derechos de aseo.',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_recoleccion_transporte_operativo_rm: {
      id: 'subdere_rsd_recoleccion_transporte_operativo_rm',
      num_bbdd: 'RSD-08',
      nombre: 'SUBDERE RSD 2024 - Recolección y Transporte de Residuos (RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/Recoleccion_Transporte_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/Recoleccion_Transporte_RM.gpkg',
      color: '#10B981',
      icono: '🚛',
      geometria: 'Polígonos Comunales',
      grupo: 'medio_ambiente',
      descripcion: 'Condiciones operativas comunales: modalidad del servicio (concesionado/municipal), tipo de recolección (puerta a puerta/contenedores), tipo de camiones, frecuencia semanal y recolección diferenciada.',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_ppc_generacion_pta_rm: {
      id: 'subdere_rsd_ppc_generacion_pta_rm',
      num_bbdd: 'RSD-09',
      nombre: 'SUBDERE RSD 2024 - Generación de Residuos y Producción Per Cápita (RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/RSD_PPC_PTA_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/RSD_PPC_PTA_RM.gpkg',
      color: '#059669',
      icono: '⚖️',
      geometria: 'Polígonos Comunales',
      grupo: 'medio_ambiente',
      descripcion: 'Volumen anual de residuos sólidos domiciliarios (toneladas/año) y producción per cápita (PPC en kg/hab*día), tanto por población residente como corregida por población flotante (PTA).',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_sdf_comunas_destino_rm: {
      id: 'subdere_rsd_sdf_comunas_destino_rm',
      num_bbdd: 'RSD-10',
      nombre: 'SUBDERE RSD 2024 - Destino de Disposición Final por Comuna (RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/SDF_Comunas_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/SDF_Comunas_RM.gpkg',
      color: '#16A34A',
      icono: '🗺️',
      geometria: 'Polígonos Comunales',
      grupo: 'medio_ambiente',
      descripcion: 'Asignación territorial de cada comuna a su relleno sanitario receptor, con distancia de traslado, costo anual de disposición y tarifa por tonelada.',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_sdf_municipios_puntos_rm: {
      id: 'subdere_rsd_sdf_municipios_puntos_rm',
      num_bbdd: 'RSD-11',
      nombre: 'SUBDERE RSD 2024 - Sedes Municipales y Relleno Receptor (Puntos RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/SDF_Municipios_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/SDF_Municipios_RM.gpkg',
      color: '#0D9488',
      icono: '🏛️',
      geometria: 'Puntos (Municipios)',
      grupo: 'medio_ambiente',
      descripcion: 'Ubicación puntual de las sedes municipales de la Región Metropolitana con sus parámetros de vinculación a los rellenos sanitarios de destino.',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_sitios_disposicion_instalaciones_rm: {
      id: 'subdere_rsd_sitios_disposicion_instalaciones_rm',
      num_bbdd: 'RSD-12',
      nombre: 'SUBDERE RSD 2024 - Rellenos Sanitarios e Instalaciones (RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/Sitios_Disposicion_RSD_Ene24_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/Sitios_Disposicion_RSD_Ene24_RM.gpkg',
      color: '#2563EB',
      icono: '🏭',
      geometria: 'Puntos (Instalaciones)',
      grupo: 'medio_ambiente',
      descripcion: 'Instalaciones de disposición final activas en la Región Metropolitana: Relleno Sanitario Loma Los Colorados (Til Til / KDM), Santa Marta (Talagante), Santiago Poniente (Maipú / Proactiva), con coordenadas, empresa operadora, resolución ambiental y vida útil estimada.',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    subdere_rsd_sitios_intermedios_transferencia_rm: {
      id: 'subdere_rsd_sitios_intermedios_transferencia_rm',
      num_bbdd: 'RSD-13',
      nombre: 'SUBDERE RSD 2024 - Estaciones de Transferencia Intermedia (RM)',
      institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
      ministerio: 'Ministerio del Interior y Seguridad Pública',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Región Metropolitana',
      urlServicio: 'https://proactiva.subdere.gov.cl/handle/123456789/635',
      archivoLocal: 'data/subdere_rsd_2024_rm/Sitios_Intermedios_Disposicion_RSD_Ene24_RM.geojson',
      archivoGpkg: 'data/subdere_rsd_2024_rm/Sitios_Intermedios_Disposicion_RSD_Ene24_RM.gpkg',
      color: '#7C3AED',
      icono: '🔄',
      geometria: 'Puntos (Estaciones de Transferencia)',
      grupo: 'medio_ambiente',
      descripcion: 'Estaciones intermedias de transbordo, compactación y transferencia de residuos en la Región Metropolitana (Estación de Transferencia Quilicura KDM).',
      declaracion: 'Información pública oficial de SUBDERE amparada por la Ley N° 20.285.',
      citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo [SUBDERE]. (2024). Diagnóstico y catastro nacional de residuos sólidos domiciliarios: Síntesis Nacional y Catastro RSD 2024. Programa Nacional de Residuos Sólidos. Gobierno de Chile. https://proactiva.subdere.gov.cl'
    },
    ine_permisos_edificacion_santiago: {
      id: 'ine_permisos_edificacion_santiago',
      num_bbdd: 'EDIF-01',
      nombre: 'INE - Permisos de Edificación Georreferenciados Santiago (2010-2025)',
      institucion: 'Instituto Nacional de Estadísticas (INE) / DOM Santiago',
      ministerio: 'Ministerio de Economía, Fomento y Turismo',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Comunal Santiago',
      urlServicio: 'https://www.ine.gob.cl/estadisticas/economia/edificacion',
      archivoLocal: 'data/ine_permisos_edificacion_santiago.geojson',
      archivoGpkg: 'data/ine_permisos_edificacion_santiago.gpkg',
      color: '#f59e0b',
      icono: '📑',
      geometria: 'Puntos (Permisos de Edificación)',
      grupo: 'normativa_ipt',
      descripcion: 'Permisos de Edificación autorizados por la Dirección de Obras Municipales (DOM) de Santiago (2010-2025). Corresponden al acto administrativo preliminar y proyectual que autoriza legalmente el inicio de faenas constructivas, registrando la intención de desarrollo inmobiliario: número de unidades autorizadas, superficie total aprobada (m²), cantidad de pisos proyectados y destinos planificados según el Formulario Único de Edificación del INE. A diferencia de las recepciones finales (CRF), el permiso no garantiza la habitabilidad efectiva inmediata ni la materialización íntegra del proyecto, pero permite proyectar la dinámica inmobiliaria y demanda potencial de suelo.',
      declaracion: 'Información estadística y cartográfica oficial provista por el INE conforme a la Ley N° 17.374 y Ley N° 20.285 de Transparencia Activa. Licencia de Datos Abiertos.',
      citaAPA: 'Instituto Nacional de Estadísticas [INE]. (2025). Permisos de Edificación Georreferenciados de la Comuna de Santiago (2010–2025). Departamento de Estadísticas de Precios e Industria. Subdirección de Operaciones. https://www.ine.gob.cl'
    },
    ine_crf_conjuntos_santiago: {
      id: 'ine_crf_conjuntos_santiago',
      num_bbdd: 'EDIF-02',
      nombre: 'INE - Certificados de Recepción Final (CRF) de Conjuntos Habitacionales (2011-2025)',
      institucion: 'Instituto Nacional de Estadísticas (INE) / DOM Santiago',
      ministerio: 'Ministerio de Economía, Fomento y Turismo',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Comunal Santiago',
      urlServicio: 'https://www.ine.gob.cl/estadisticas/economia/edificacion',
      archivoLocal: 'data/ine_crf_conjuntos_santiago.geojson',
      archivoGpkg: 'data/ine_crf_conjuntos_santiago.gpkg',
      color: '#10b981',
      icono: '🏢',
      geometria: 'Polígonos (Predios y Conjuntos Habitacionales Recepcionados)',
      grupo: 'normativa_ipt',
      descripcion: 'Certificados de Recepción Final (CRF) emitidos por la DOM de Santiago para conjuntos habitacionales y edificios residenciales (2011-2025). Constituyen el acto terminal y concluyente que acredita el término conforme de las obras frente a la normativa urbanística y la LGUC/OGUC, otorgando la recepción legal y habitabilidad de las unidades. A diferencia de los Permisos de Edificación (que son intenciones proyectuales), los CRF representan obras efectivamente ejecutadas y entregadas a la ciudad. Sus geometrías poligonales prediales permiten derivar indicadores morfológicos reales de ocupación: Densidad Neta Real (viv/ha, OGUC Art. 1.1.2), Coeficiente de Ocupación de Suelo (COS real), Porcentaje de Patio/Suelo Libre y morfología de Frente y Fondo Predial.',
      declaracion: 'Cartografía predial y estadística oficial de conjuntos habitacionales con recepción definitiva provista por el INE (Subdepartamento de Geografía) bajo la Ley N° 20.285 de Transparencia. Licencia de Datos Abiertos.',
      citaAPA: 'Instituto Nacional de Estadísticas [INE]. (2025). Certificados de Recepción Final (CRF) de Conjuntos Habitacionales (2011–2025). Subdepartamento de Geografía. Santiago, Chile. https://www.ine.gob.cl'
    },
    munistgo_aseo_zonas_residuos_2026: {
      id: 'munistgo_aseo_zonas_residuos_2026',
      num_bbdd: 'ASEO-01',
      nombre: 'MuniSTGO - Catastro Zonas de Aseo, Contenedores y Papeleros (Junio 2026)',
      institucion: 'Ilustre Municipalidad de Santiago (Subdirección de Aseo y Gestión Integral de Residuos)',
      ministerio: 'Municipalidad de Santiago / Ley N° 20.285 Transparencia',
      tipoServicio: 'Vectorial GeoPackage / GeoJSON WGS84 / Cobertura Comunal Santiago',
      urlServicio: 'https://www.municipalidaddesantiago.cl',
      archivoLocal: 'data/zonas_aseo_contenedores_papeleros_santiago.geojson',
      archivoGpkg: 'data/zonas_aseo_contenedores_papeleros_santiago.gpkg',
      color: '#06b6d4',
      icono: '🗑️',
      geometria: 'Polígonos (Macro-Zonas de Aseo)',
      grupo: 'medio_ambiente',
      descripcion: 'Catastro comunal oficial de infraestructura de residuos sólidos domiciliarios y mobiliario urbano de aseo: 5 macro-zonas de aseo (Oriente, Centro Oriente, Centro Poniente, Centro Plaza, Poniente), desagregación por volumen (240L, 360L, 770L), papeleros peatonales, tasas de operatividad, deterioro físico y pérdida.',
      declaracion: 'Información pública oficial de la Municipalidad de Santiago provista conforme a la Ley N° 20.285 sobre Acceso a la Información Pública (Oficio N° E-1528/2026, MU-18117 / Memorando N° 204). Licencia de Datos Abiertos.',
      citaAPA: 'Municipalidad de Santiago. (2026). Catastro de contenedores y papeleros por zonas de aseo comunal (Memorando N° 204 / Oficio N° E-1528/2026, MU-18117). Subdirección de Aseo y Gestión Integral de Residuos, Dirección de Asesoría Jurídica. Santiago, Chile.'
    }
  };

  // Diccionario multirregional escalable de endpoints IPT en MINVU GeoIDE
  const SERVICIOS_IPT_CHILE = {
    'RM': {
      nombre: 'Región Metropolitana de Santiago',
      servicios: {
        prc_norte: 'https://geoide.minvu.cl/server/rest/services/IPT/PRC_RM_Norte/MapServer',
        prc_sur: 'https://geoide.minvu.cl/server/rest/services/IPT/PRC_RM_Sur/MapServer',
        prms: 'https://geoide.minvu.cl/server/rest/services/IPT/PRMS/FeatureServer',
        areas_verdes: 'https://geoide.minvu.cl/server/rest/services/IPT/%C3%81reas_verdes_IPT/FeatureServer',
        areas_riesgo: 'https://geoide.minvu.cl/server/rest/services/IPT/IPT_AREA_RIESGO/FeatureServer',
        limites_urbanos: 'https://geoide.minvu.cl/server/rest/services/IPT/Limites_Urbanos/FeatureServer',
        patrimonio: 'https://geoide.minvu.cl/server/rest/services/IPT/Patrimonio/MapServer'
      }
    },
    '05_VALPARAISO': {
      nombre: 'Región de Valparaíso',
      servicios: {
        prc: 'https://geoide.minvu.cl/server/rest/services/IPT/PRC_Valpara%C3%ADso/MapServer',
        premval: 'https://geoide.minvu.cl/server/rest/services/IPT/PREMVAL/MapServer',
        pri: 'https://geoide.minvu.cl/server/rest/services/IPT/PRI_Valparaiso/MapServer'
      }
    },
    '08_BIOBIO': {
      nombre: 'Región del Biobío',
      servicios: {
        prc: 'https://geoide.minvu.cl/server/rest/services/IPT/PRC_Biobio/MapServer',
        prmc: 'https://geoide.minvu.cl/server/rest/services/IPT/PRMC/MapServer'
      }
    },
    '09_ARAUCANIA': {
      nombre: 'Región de La Araucanía',
      servicios: {
        prc: 'https://geoide.minvu.cl/server/rest/services/IPT/PRC_Araucania/MapServer',
        pri: 'https://geoide.minvu.cl/server/rest/services/IPT/PRI_Araucan%C3%ADa/MapServer'
      }
    },
    '02_ANTOFAGASTA': {
      nombre: 'Región de Antofagasta',
      servicios: {
        prc: 'https://geoide.minvu.cl/server/rest/services/IPT/PRC_Antofagasta/MapServer',
        pri: 'https://geoide.minvu.cl/server/rest/services/IPT/PRI_Antofagasta/MapServer'
      }
    },
    '16_NUBLE': {
      nombre: 'Región de Ñuble',
      servicios: {
        prc: 'https://geoide.minvu.cl/server/rest/services/IPT/PRC_Nuble/MapServer',
        pri: 'https://geoide.minvu.cl/server/rest/services/IPT/PRI_Chill%C3%A1n___Chill%C3%A1n_Viejo/MapServer'
      }
    },
    '10_LOS_LAGOS': {
      nombre: 'Región de Los Lagos',
      servicios: {
        prc: 'https://geoide.minvu.cl/server/rest/services/IPT/PRC_Los_Lagos/MapServer'
      }
    }
  };

  const cacheCapasOficiales = new Map();

  /**
   * Consulta una capa oficial: prioriza la carga local, luego base de datos, y finalmente servicio en vivo
   */
  async function consultarCapaOficial(idCapa, bbox = null) {
    if (cacheCapasOficiales.has(idCapa)) {
      return cacheCapasOficiales.get(idCapa);
    }

    const def = obtenerDefinicion(idCapa);
    if (!def) {
      throw new Error(`Capa oficial "${idCapa}" no reconocida en el catálogo.`);
    }

    let geojson = null;
    let fuenteUsada = 'Servicio Oficial en Vivo';

    // 1. Carga prioritaria desde repositorio local validado en data/ o src/data/ (100% de geometrías e integridad atributiva)
    if (def.archivoLocal) {
      const rutas = [
        def.archivoLocal,
        `./${def.archivoLocal}`,
        `../${def.archivoLocal}`,
        `src/${def.archivoLocal}`,
        `data/${def.archivoLocal.split('/').pop()}`,
        `src/data/${def.archivoLocal.split('/').pop()}`,
        `https://atlasvgiuah.netlify.app/data/${def.archivoLocal.split('/').pop()}`
      ];
      if (def.archivoAlternativo) {
        rutas.push(
          def.archivoAlternativo,
          `./${def.archivoAlternativo}`,
          `data/${def.archivoAlternativo.split('/').pop()}`,
          `src/data/${def.archivoAlternativo.split('/').pop()}`
        );
      }

      for (const r of rutas) {
        try {
          const resp = await fetch(r);
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
              geojson = data;
              fuenteUsada = `${def.institucion} (Conjunto Oficial Integrado Local)`;
              break;
            }
          }
        } catch (_) {}
      }
    }

    // 2. Consulta a Base de Datos en la Nube (Supabase PostGIS / Storage CDN) como respaldo si no existe local
    if (!geojson && window.ModuloDBClient) {
      try {
        const resDb = await window.ModuloDBClient.consultarCapa(idCapa, def, bbox);
        if (resDb && resDb.geojson) {
          geojson = resDb.geojson;
          fuenteUsada = `${def.institucion} [${resDb.origenUsado}]`;
        }
      } catch (eDb) {
        console.warn(`[ModuloIDEChile]: DB Client no pudo resolver ${idCapa}: ${eDb.message}`);
      }
    }

    if (!geojson) {
      throw new Error(`No fue posible cargar la capa oficial "${def.nombre}" ni en vivo ni desde la base de datos ni desde el repositorio local.`);
    }

    // Normalizar atributos de cada feature para visualización y popup estándar
    geojson.features = (geojson.features || []).map((feat, idx) => {
      const props = feat.properties || {};

      let nombreEntidad = 'Entidad Oficial';
      let detalleTipo = def.nombre;
      let extraInfo = {};

      if (idCapa === 'censo2024_regional') {
        const regionNom = props.REGION || 'Región Metropolitana de Santiago';
        const codReg = props.COD_REGION || '13';
        nombreEntidad = `Marco Regional: ${regionNom}`;
        detalleTipo = 'Límite Político-Administrativo y Censal RM';
        extraInfo = {
          'Región': regionNom,
          'Código Región': String(codReg),
          'Unidad': 'Marco Macroterritorial Censo 2024',
          'Fuente': 'Instituto Nacional de Estadísticas (INE)'
        };
      } else if (idCapa === 'censo2024_limite_urbano') {
        const nomUrb = props.LOCALIDAD || props.COMUNA || props.ENTIDAD || `Área Urbana ${idx + 1}`;
        const poblacion = props.n_per !== undefined ? Number(props.n_per).toLocaleString('es-CL') : 'No disp.';
        const hombres = props.n_hombres !== undefined ? Number(props.n_hombres).toLocaleString('es-CL') : '-';
        const mujeres = props.n_mujeres !== undefined ? Number(props.n_mujeres).toLocaleString('es-CL') : '-';
        const viviendas = props.n_viv !== undefined ? Number(props.n_viv).toLocaleString('es-CL') : (props.n_viv_par !== undefined ? Number(props.n_viv_par).toLocaleString('es-CL') : '-');
        nombreEntidad = `Límite Urbano: ${nomUrb}`;
        detalleTipo = `Población: ${poblacion} hab. | Comuna: ${props.COMUNA || '-'}`;
        extraInfo = {
          'Área / Localidad': nomUrb,
          'Comuna': props.COMUNA || '-',
          'Provincia': props.PROVINCIA || 'Santiago',
          'Población Total': `${poblacion} personas`,
          'Hombres': hombres,
          'Mujeres': mujeres,
          'Viviendas': viviendas,
          'Código CUT': props.CUT || '-'
        };
      } else if (idCapa === 'censo2024_localidades') {
        const nomLoc = props.LOCALIDAD || props.ENTIDAD || `Localidad ${idx + 1}`;
        const poblacion = props.n_per !== undefined ? Number(props.n_per).toLocaleString('es-CL') : 'No disp.';
        const hombres = props.n_hombres !== undefined ? Number(props.n_hombres).toLocaleString('es-CL') : '-';
        const mujeres = props.n_mujeres !== undefined ? Number(props.n_mujeres).toLocaleString('es-CL') : '-';
        const viviendas = props.n_viv !== undefined ? Number(props.n_viv).toLocaleString('es-CL') : (props.n_viv_par !== undefined ? Number(props.n_viv_par).toLocaleString('es-CL') : '-');
        nombreEntidad = `Localidad: ${nomLoc}`;
        detalleTipo = `Categoría: ${props.CATEGORIA || 'Entidad'} | ${poblacion} hab.`;
        extraInfo = {
          'Localidad / Asentamiento': nomLoc,
          'Categoría': props.CATEGORIA || 'Entidad Poblada',
          'Comuna': props.COMUNA || '-',
          'Provincia': props.PROVINCIA || '-',
          'Población Total': `${poblacion} personas`,
          'Hombres': hombres,
          'Mujeres': mujeres,
          'Viviendas': viviendas,
          'Conurbación': props.CONURBACION || '-'
        };
      } else if (idCapa === 'censo2024_zonal') {
        const dist = props.DISTRITO || props.COD_DISTRITO || props.COD_ZONA || `Zona ${idx + 1}`;
        const poblacion = props.n_per !== undefined ? Number(props.n_per).toLocaleString('es-CL') : 'No disp.';
        const hombres = props.n_hombres !== undefined ? Number(props.n_hombres).toLocaleString('es-CL') : '-';
        const mujeres = props.n_mujeres !== undefined ? Number(props.n_mujeres).toLocaleString('es-CL') : '-';
        const viviendas = props.n_viv !== undefined ? Number(props.n_viv).toLocaleString('es-CL') : (props.n_viv_par !== undefined ? Number(props.n_viv_par).toLocaleString('es-CL') : '-');
        nombreEntidad = `Distrito/Zona: ${dist}`;
        detalleTipo = `Comuna: ${props.COMUNA || '-'} | Población: ${poblacion} hab.`;
        extraInfo = {
          'Distrito Censal': props.DISTRITO || props.COD_DISTRITO || '-',
          'Código Zona': props.COD_ZONA || '-',
          'Comuna': props.COMUNA || '-',
          'Provincia': props.PROVINCIA || '-',
          'Población Total': `${poblacion} personas`,
          'Hombres': hombres,
          'Mujeres': mujeres,
          'Viviendas': viviendas,
          'Inmigrantes': props.n_inmigrantes !== undefined ? Number(props.n_inmigrantes).toLocaleString('es-CL') : '-'
        };
      } else if (idCapa === 'censo2024_manzanas') {
        const codManzana = props.MANZENT || props.COD_ENTIDAD_MANZANA || props.MANZANA || props.ID_NIVEL_CENSAL || `MZ-${idx + 1}`;
        const poblacion = props.n_per !== undefined ? Number(props.n_per).toLocaleString('es-CL') : 'No disp.';
        const hombres = props.n_hombres !== undefined ? Number(props.n_hombres).toLocaleString('es-CL') : '-';
        const mujeres = props.n_mujeres !== undefined ? Number(props.n_mujeres).toLocaleString('es-CL') : '-';
        const viviendas = props.n_viv !== undefined ? Number(props.n_viv).toLocaleString('es-CL') : (props.n_viv_par !== undefined ? Number(props.n_viv_par).toLocaleString('es-CL') : 'No disp.');

        nombreEntidad = `Manzana Censal ${codManzana}`;
        detalleTipo = `Población: ${poblacion} hab. | Viviendas: ${viviendas}`;
        extraInfo = {
          'Población Total': `${poblacion} personas`,
          'Hombres': hombres,
          'Mujeres': mujeres,
          'Viviendas Particulares': viviendas,
          'Comuna': props.COMUNA || 'Santiago',
          'Código Manzana': codManzana,
          'NNA (0-17 años)': (props.n_edad_0_5 !== undefined && props.n_edad_6_13 !== undefined && props.n_edad_14_17 !== undefined)
            ? Number(props.n_edad_0_5 + props.n_edad_6_13 + props.n_edad_14_17).toLocaleString('es-CL') : '-',
          'Adultos Mayores (60+)': props.n_edad_60_mas !== undefined ? Number(props.n_edad_60_mas).toLocaleString('es-CL') : '-',
          'Población Inmigrante': props.n_inmigrantes !== undefined ? Number(props.n_inmigrantes).toLocaleString('es-CL') : '-'
        };
      } else if (idCapa === 'minvu_patrimonio') {
        nombreEntidad = props.NOMBRE || props.DENOMINACION || props.DIRECCION || 'Inmueble Patrimonial';
        detalleTipo = props.CATEGORIA || (props.ZCH ? 'Zona de Conservación Histórica' : 'Inmueble de Conservación Histórica');
        extraInfo = {
          'Categoría IPT': detalleTipo,
          'Dirección': props.DIRECCION || 'No indicada',
          'Comuna': props.COMUNA || 'Santiago',
          'Región': props.REGION || 'Metropolitana'
        };
      } else if (idCapa === 'minvu_parques') {
        nombreEntidad = props.NOMBRE || 'Parque Urbano';
        detalleTipo = 'Parque Urbano Catastrado (MINVU)';
        extraInfo = {
          'Superficie Oficial': props.SUPERFICIE ? `${Number(props.SUPERFICIE).toLocaleString('es-CL')} m²` : 'No indicada',
          'Dirección': props.DIRECCION || 'Barrio Brasil / Yungay',
          'Comuna': props.COM || props.COMUNA || 'Santiago'
        };
      } else if (idCapa === 'minvu_barrios_historicos') {
        nombreEntidad = `Barrio Histórico ${props.BARRIO || 'Yungay - Brasil'}`;
        detalleTipo = `Programa ${props.TIPO || 'Patrimonial'} — Quiero Mi Barrio`;
        extraInfo = {
          'Estado Programa': props.ESTADO_CB || 'Consolidado',
          'Habitantes Estimados': props.NRO_HAB ? Number(props.NRO_HAB).toLocaleString('es-CL') : '-',
          'Viviendas': props.NRO_VIV || '-',
          'Año Inicio': props.A_INICIO || '2012'
        };
      } else if (idCapa === 'educacion_parvularia') {
        nombreEntidad = props.NOM_EST || props.NOMBRE || 'Jardín Infantil';
        detalleTipo = props.ADMIN || props.TIPO || 'Educación Parvularia';
        extraInfo = {
          'Administración': detalleTipo,
          'Dirección': `${props.DIRECCION || ''} ${props.NUMERO || ''}`.trim() || 'Santiago',
          'Comuna': props.COMUNA || 'Santiago'
        };
      } else if (idCapa === 'establecimientos_salud') {
        nombreEntidad = props.nombre || props.NOMBRE || 'Centro de Salud';
        detalleTipo = props.tipo || 'Atención Primaria / Hospitalaria';
        extraInfo = {
          'Tipo Establecimiento': detalleTipo,
          'Dependencia': props.dependencia || '-',
          'Dirección': props.direccion || 'Santiago',
          'Comuna': props.comuna || 'Santiago'
        };
      } else if (idCapa === 'bomberos') {
        nombreEntidad = props.NOMBRE || props.CIA || props.COMPANIA || 'Compañía de Bomberos';
        detalleTipo = 'Cuerpo de Bomberos de Santiago (CBS)';
        extraInfo = {
          'Cuerpo': props.CUERPO || 'Santiago',
          'Dirección': props.DIRECCION || 'Santiago',
          'Comuna': props.COMUNA || 'Santiago'
        };
      } else if (idCapa === 'carabineros') {
        nombreEntidad = props.NOMBRE || props.UNIDAD || 'Cuartel de Carabineros';
        detalleTipo = props.TIPO || 'Comisaría / Prefectura';
        extraInfo = {
          'Prefectura': props.PREFECTURA || 'Santiago Central',
          'Dirección': props.DIRECCION || 'Santiago',
          'Comuna': props.COMUNA || 'Santiago'
        };
      } else if (idCapa === 'estaciones_metro') {
        nombreEntidad = props.nombre || 'Estación de Metro';
        detalleTipo = `Línea ${props.linea || 'Metro'}`;
        extraInfo = {
          'Línea': props.linea || '-',
          'Dirección': props.direccion || '-',
          'Comuna': props.comuna || 'Santiago'
        };
      } else if (idCapa === 'red_ferroviaria') {
        nombreEntidad = props.NOMBRE || props.TRAMO || 'Trazado Ferroviario EFE';
        detalleTipo = props.TIPO || 'Vía Férrea Principal';
        extraInfo = {
          'Estado': props.ESTADO || 'En Operación',
          'Operador': 'EFE Central'
        };
      } else if (idCapa === 'cmn_sitios_memoria') {
        nombreEntidad = props.nombre || 'Sitio de Memoria CMN';
        detalleTipo = props.tipo_declaratoria || 'Monumento Histórico';
        extraInfo = {
          'Decreto': props.decreto || 'No indicado',
          'Dirección': props.direccion || 'Santiago',
          'Comuna': props.comuna || 'Santiago'
        };
      } else if (idCapa === 'minvu_ipt_prc_santiago') {
        const zonaCodigo = props.ZONA || '';
        const zonaNom = props.NOM || '';
        nombreEntidad = zonaCodigo ? `Zona ${zonaCodigo}: ${zonaNom}` : (zonaNom || 'Zona Normativa PRC');
        detalleTipo = `Plan Regulador Comunal de Santiago (${props.T_DO || 'Res.'} ${props.N_DOC || ''})`;
        extraInfo = {
          'Zona Normativa': zonaCodigo,
          'Nombre Zona': zonaNom,
          'Usos Permitidos': props.UPERM || 'Ver ordenanza local',
          'Usos Prohibidos': props.UPROH || 'Ver ordenanza local',
          'Fecha D.O.': props.P_DO || '-',
          'Instrumento': `${props.T_DO || 'Resolución'} N° ${props.N_DOC || ''}`
        };
      } else if (idCapa === 'catastro_predial_sii' || idCapa.startsWith('catastro_sii')) {
        const rolStr = props.rol || (props.manzana ? `${props.manzana}-${props.predio}` : 'Sin ROL');
        const dirStr = props.direccion || props.rc_direccion || props.dc_direccion || 'Sin dirección registrada';
        const comStr = props.comuna || 'Santiago';
        const avaluoVal = props.avaluo_fiscal || props.rc_avaluo_total || props.dc_avaluo_fiscal;
        const avaluoStr = avaluoVal ? `$${Number(avaluoVal).toLocaleString('es-CL')}` : 'No disponible';
        const nivelGeo = (props.geocod_nivel || 'v4').toUpperCase();

        nombreEntidad = `Predio ROL SII ${rolStr}`;
        detalleTipo = `Dirección: ${dirStr} | Avalúo: ${avaluoStr} | Geocod: ${nivelGeo}`;
        extraInfo = {
          'ROL SII': rolStr,
          'Dirección Catastral': dirStr,
          'Comuna (Código/Nombre)': comStr,
          'Avalúo Fiscal Total': avaluoStr,
          'Superficie Terreno (m²)': props.sup_terreno_m2 ? `${Number(props.sup_terreno_m2).toLocaleString('es-CL')} m²` : '-',
          'Superficie Construida (m²)': props.sup_construida_m2 ? `${Number(props.sup_construida_m2).toLocaleString('es-CL')} m²` : '-',
          'Nivel Geocodificación': nivelGeo,
          'Temporalidad': 'Segundo Semestre 2025',
          'Fuente de Origen': 'Servicio de Impuestos Internos (SII) — Catastro Oficial (Segundo Semestre 2025)',
          'Alerta Cobertura Web': 'Visualización activa para Región Metropolitana por peso de archivo. Datos nacionales completos (1.380.649 predios todo Chile) disponibles en el repositorio.',
          'Nota / Calidad': 'Geocodificación automatizada sujeta a margen de error (según nivel) y/o vacíos de origen.'
        };
      } else if (idCapa === 'minvu_ipt_prms_usosuelo') {
        nombreEntidad = props.NOMBRE || props.Capa || 'Uso de Suelo Metropolitano';
        detalleTipo = props.UPREF || 'Zonificación PRMS (Metropolitano)';
        extraInfo = {
          'Uso Preferente': props.UPREF || '-',
          'Uso Permitido': props.UPERM || '-',
          'Normativa PRMS': props.NORMA || 'Ordenanza PRMS',
          'Superficie (ha)': props.SUP_HA ? `${props.SUP_HA} ha` : '-',
          'Comuna': props.COMUNA || 'Santiago'
        };
      } else if (idCapa === 'minvu_ipt_areas_verdes') {
        nombreEntidad = props.NOMBRE || 'Área Verde Normada (IPT)';
        detalleTipo = `Área Verde Normativa (${props.TIPO_AV || 'IPT'})`;
        extraInfo = {
          'Tipo de Área Verde': props.TIPO_AV || 'Área Verde',
          'Zona Normativa': props.Zona || '-',
          'Superficie Normativa': props.Ha ? `${Number(props.Ha).toFixed(2)} ha` : '-',
          'Comuna': props.COMUNA || 'Santiago'
        };
      } else if (idCapa === 'minvu_ipt_areas_riesgo') {
        nombreEntidad = props.NOM || props.NOMBRE || 'Área de Riesgo Normativa';
        detalleTipo = props.CAT || props.Capa || 'Restricción por Riesgo (Art. 2.1.17 OGUC)';
        extraInfo = {
          'Tipo / Categoría de Riesgo': props.CAT || props.NOMBRE || 'Restricción',
          'Condición Normativa': props.UPROH || props.NORMA || 'Restricción constructiva según OGUC',
          'Comuna': props.COM || props.COMUNA || 'Santiago'
        };
      } else if (idCapa === 'minvu_ipt_resguardo_infraestructura') {
        nombreEntidad = props.NOMBRE || props.Capa || 'Faja de Resguardo PRMS';
        detalleTipo = 'Resguardo de Infraestructura Metropolitana';
        extraInfo = {
          'Infraestructura': props.NOMBRE || 'Corredor Metropolitano',
          'Norma': props.NORMA || 'Cap. 8.4 PRMS',
          'Capa': props.Capa || 'Faja de Resguardo'
        };
      } else if (idCapa === 'minvu_ipt_limite_urbano') {
        nombreEntidad = `Límite Urbano Oficial Comuna de Santiago`;
        detalleTipo = 'Límite Urbano Normativo PRC';
        extraInfo = {
          'Instrumento': props.INSTRUM || 'Plan Regulador Comunal de Santiago',
          'Publicación D.O.': props.P_DO || '-',
          'Norma Legal': `${props.T_DO || 'Resolución'} N° ${props.N_DO || ''}`,
          'Administración': props.ADMIN || 'SEREMI MINVU / Municipalidad'
        };
      } else if (idCapa === 'ide_minvu_campamentos') {
        nombreEntidad = props.Nombre_Campamento || props.NOMBRE || 'Campamento Precario';
        detalleTipo = 'Asentamiento Precario (Catastro Oficial 2024)';
        extraInfo = {
          'Hogares': props.N_HOGARES || props.HOGARES || '-',
          'Tipo de Terreno': props.TIPO_TERRENO || 'Fiscal / Privado',
          'Estrategia MINVU': props.ESTRATEGIA || 'Radicación / Relocalización',
          'Comuna': props.COMUNA || 'Santiago'
        };
      } else if (idCapa === 'bbdd_66' || idCapa === 'ide_minvu_unidades_vecinales_rsh') {
        nombreEntidad = `Unidad Vecinal N° ${props.uv_carto || props.t_uv_nom || props.OBJECTID || props.nombre || props.uv || 'S/N'}`;
        detalleTipo = 'Unidad Vecinal Oficial (MDS / RSH 2026)';
        extraInfo = {
          'Comuna': props.t_com_nom || props.COMUNA || props.comuna || 'Santiago',
          'Provincia': props.t_prov_nom || props.provincia || 'Santiago',
          'ID Cartográfico': props.t_id_uv_ca || props.id || '-'
        };
      } else if (idCapa === 'ide_minvu_ipt_prms_riesgo') {
        nombreEntidad = `Zona de Riesgo PRMS: ${props.ZONA || props.DESCRIP || 'Riesgo Natural'}`;
        detalleTipo = 'Área de Riesgo Metropolitano (Art. 2.1.17 OGUC)';
        extraInfo = {
          'Tipo de Riesgo': props.TIPO_RIESGO || props.DESCRIP || 'Inundación / Remoción en Masa',
          'Marco Normativo': 'Art. 2.1.17 OGUC / PRMS',
          'Instrumento': 'Plan Regulador Metropolitano de Santiago'
        };
      } else if (idCapa === 'ide_subdere_dpa_comunas') {
        nombreEntidad = `Comuna de ${props.NOM_COMUNA || props.COMUNA || 'Santiago'}`;
        detalleTipo = 'División Político-Administrativa (SUBDERE / IGM)';
        extraInfo = {
          'Código CUT': props.CUT || '-',
          'Provincia': props.NOM_PROVINCIA || props.PROVINCIA || '-',
          'Región': props.NOM_REGION || props.REGION || 'Metropolitana de Santiago'
        }
      } else if (idCapa.startsWith('subdere_rsd_')) {
        const nomComuna = props.COMUNA || props.Comuna || props.NOM_COM || props.Nombre_Sit || props.NOMBRE_SDF || props.NOMBRE || props.ENTIDAD || props.CIUDAD || props.Municipio || 'Región Metropolitana';
        nombreEntidad = `${def.nombre}: ${nomComuna}`;
        detalleTipo = `${def.geometria} | SUBDERE Residuos Sólidos 2024`;

        if (idCapa === 'subdere_rsd_analisis_costos_comuna_rm') {
          const aseoAnual = props.Aseo_año ?? props['Aseo_a\u00f1o'] ?? props['Aseo_ao'] ?? props.Aseo_ano;
          const rtAnual = props.RT_año ?? props['RT_a\u00f1o'] ?? props['RT_ao'] ?? props.RT_ano;
          const dfAnual = props.DF_año ?? props['DF_a\u00f1o'] ?? props['DF_ao'] ?? props.DF_ano;
          extraInfo = {
            'Comuna': nomComuna,
            'Población Comunal': props.Pobl_INE ? Number(props.Pobl_INE).toLocaleString('es-CL') + ' hab.' : '-',
            'Residuos Anuales (RSDyA)': props.RSDyA ? Number(props.RSDyA).toLocaleString('es-CL') + ' Ton/año' : '-',
            'Costo Total Aseo Anual': aseoAnual ? '$' + Number(aseoAnual).toLocaleString('es-CL') : '-',
            'Costo Anual por Habitante': props.Aseo_Hab ? '$' + Number(props.Aseo_Hab).toLocaleString('es-CL') + '/hab' : '-',
            'Costo por Tonelada Dispuesto': props.Aseo_Ton ? '$' + Number(props.Aseo_Ton).toLocaleString('es-CL') + '/Ton' : '-',
            'Costo Recolección y Transporte': rtAnual ? '$' + Number(rtAnual).toLocaleString('es-CL') : '-',
            'Costo Disposición Final': dfAnual ? '$' + Number(dfAnual).toLocaleString('es-CL') : '-'
          };
        } else if (idCapa.includes('poblacion') || idCapa.includes('pta')) {
          extraInfo = {
            'Comuna': nomComuna,
            'Población Total Atendida (PTA)': props.PTA !== undefined ? Number(props.PTA).toLocaleString('es-CL') + ' hab.' : (props.PTA_ATENDI !== undefined ? Number(props.PTA_ATENDI).toLocaleString('es-CL') + ' hab.' : '-'),
            'Población Comunal Atendida (PCA)': props.PCA !== undefined ? Number(props.PCA).toLocaleString('es-CL') + ' hab.' : '-',
            'Población Flotante Turística (PFP)': props.PFP !== undefined ? Number(props.PFP).toLocaleString('es-CL') + ' hab.' : '-',
            'Cobertura Urbana': props.Cob_Urb !== undefined ? props.Cob_Urb + '%' : '-',
            'Cobertura Rural': props.Cob_Rur !== undefined ? props.Cob_Rur + '%' : '-'
          };
        } else if (idCapa === 'subdere_rsd_ppc_generacion_pta_rm') {
          extraInfo = {
            'Comuna': nomComuna,
            'Generación Anual (RSDyA 2022)': props.RSDyA_22 !== undefined ? Number(props.RSDyA_22).toLocaleString('es-CL') + ' Ton/año' : '-',
            'Población Atendida (PTA)': props.PTA_22 !== undefined ? Number(props.PTA_22).toLocaleString('es-CL') + ' hab.' : '-',
            'PPC Residente (Ppc)': props.Ppc !== undefined ? props.Ppc + ' kg/hab·día' : '-',
            'PPC Corregida Flotante (Ppc_corr)': props.Ppc_corr !== undefined ? props.Ppc_corr + ' kg/hab·día' : '-',
            'Fuente de Información': props.Fuente || 'SUBDERE RSD 2024'
          };
        } else if (idCapa.includes('criticidad') || idCapa.includes('sitios_disposicion')) {
          extraInfo = {
            'Relleno Sanitario / Sitio': props.NOMBRE || props.Nombre_Sit || nomComuna,
            'Comuna Emplazamiento': props.COMUNA || props.Comuna || '-',
            'Clase de Sitio': props.Clase || 'Relleno Sanitario',
            'Estado Operativo': props.Estado || 'Operativo',
            'Vida Útil Remanente': props.VidaUtil !== undefined ? props.VidaUtil + ' años' : '-',
            'Índice de Criticidad': props.Criticidad || 'Evaluado',
            'Empresa Operadora': props.Operador || props.Propieta || '-',
            'RCA': props.RCA || 'Autorizada'
          };
        } else if (idCapa.includes('recoleccion_transporte')) {
          extraInfo = {
            'Comuna': nomComuna,
            'Modalidad del Servicio': props.TipoServicio || 'Concesionado',
            'Sistema de Recolección': props.SistRecoleccion || 'Puerta a puerta',
            'Modo de Recolección': props.ModRecoleccion || '-',
            'Frecuencia Urbana': props.FrecUrbana || '-',
            'Frecuencia Rural': props.FrecRural || '-',
            'Recolección Diferenciada': props.RecDiferenciada || 'No',
            'Distancia al SDF': props.DistSDF !== undefined ? props.DistSDF + ' km' : '-'
          };
        } else if (idCapa.includes('distancia')) {
          extraInfo = {
            'Municipio / Comuna Origen': props.Comuna || nomComuna,
            'Distancia al Relleno Sanitario': props.Km !== undefined ? props.Km + ' km' : '-'
          };
        } else if (idCapa.includes('sinim')) {
          extraInfo = {
            'Comuna': nomComuna,
            'Gasto en Aseo SINIM': props.Aseo_SINIM ? '$' + Number(props.Aseo_SINIM).toLocaleString('es-CL') : '-',
            'Porcentaje de Aseo sobre Gasto': props.Por_Aseo ? props.Por_Aseo + '%' : '-',
            'Ingresos Propios Permanentes (IPP)': props.IPP ? '$' + Number(props.IPP).toLocaleString('es-CL') : '-',
            'Aporte Fondo Común Municipal (FCM)': props.Ing_FCM ? '$' + Number(props.Ing_FCM).toLocaleString('es-CL') : '-',
            'Recaudación Derechos de Aseo': props.DerAseo ? '$' + Number(props.DerAseo).toLocaleString('es-CL') : '-'
          };
        } else if (idCapa.includes('aseo') || idCapa.includes('residuos_2026')) {
          nombreEntidad = props.BARRIO ? `Barrio ${props.BARRIO} (Zona ${props.zona_aseo || ''})` : `Macro-Zona de Aseo: ${props.zona_aseo || 'Comuna de Santiago'}`;
          detalleTipo = `Capacidad: ${(props.capacidad_total_litros || props.zona_capacidad_litros ? Number(props.capacidad_total_litros || props.zona_capacidad_litros).toLocaleString('es-CL') : '0')} L | Contenedores: ${props.contenedores_tot || props.zona_contenedores_tot || 0}`;
          extraInfo = {
            'Macro-Zona Operativa': props.zona_aseo || '-',
            'Código de Zona': props.zona_codigo || '-',
            'Barrio / Sector': props.BARRIO || ((props.n_barrios_agrupados || '') + ' barrios (' + (props.barrios_integrantes || '') + ')'),
            'Superficie Territorial': (props.superficie_ha || props.SUP_HA || 0) + ' ha (' + (props.superficie_km2 || props.SUP_KM || 0) + ' km²)',
            'Contenedores Totales': (props.contenedores_tot || props.zona_contenedores_tot || 0) + ' unidades (' + (props.pct_contenedores_comunal || props.zona_pct_cont_comunal || 0) + '%)',
            'Papeleros Peatonales': (props.papeleros_tot || props.zona_papeleros_tot || 0) + ' unidades (' + (props.pct_papeleros_comunal || props.zona_pct_pap_comunal || 0) + '%)',
            'Total Elementos Aseo': (props.elementos_tot || props.zona_elementos_tot || 0) + ' unidades',
            'Capacidad de Acopio': (props.capacidad_total_litros || props.zona_capacidad_litros ? Number(props.capacidad_total_litros || props.zona_capacidad_litros).toLocaleString('es-CL') : '0') + ' L',
            'Volumetría Contenedores': '240L: ' + (props.cont_240l || props.zona_cont_240l || 0) + ' | 360L: ' + (props.cont_360l || props.zona_cont_360l || 0) + ' | 770L: ' + (props.cont_770l || props.zona_cont_770l || 0),
            'Tasa Deterioro Físico': (props.tasa_deterioro_pct || props.zona_tasa_deterioro_pct || 0) + '%',
            'Tasa Operatividad': (props.tasa_operativo_pct || props.zona_tasa_operativo_pct || 0) + '%',
            'Tasa Pérdida / No está': (props.tasa_perdida_pct || props.zona_tasa_perdida_pct || 0) + '%',
            'Densidad Contenedores': (props.densidad_contenedores_km2 || props.zona_densidad_cont_km2 || 0) + ' cont/km²',
            'Densidad Capacidad': (props.densidad_capacidad_litros_ha || props.zona_densidad_cap_litros_ha || 0) + ' L/ha',
            'Ratio Contenedores / Papeleros': props.ratio_contenedores_papeleros || '0',
            'Diagnóstico Técnico': props.nota_estado || props.zona_nota_estado || '-'
          };
        } else if (idCapa.includes('sdf_comunas') || idCapa.includes('sdf_municipios')) {
          extraInfo = {
            'Comuna Evaluada': nomComuna,
            'Relleno Sanitario Receptor': props.SITIO || '-',
            'Comuna Emplazamiento': props.COMUNA_QUE_DISPONE || '-',
            'Distancia de Transporte': props.Dist_SDF !== undefined ? props.Dist_SDF + ' km' : '-',
            'Costo Anual Disposición': props.Costo_a ? '$' + Number(props.Costo_a).toLocaleString('es-CL') : '-',
            'Costo por Tonelada': props.Costo_Ton ? '$' + Number(props.Costo_Ton).toLocaleString('es-CL') + '/Ton' : '-'
          };
        } else {
          extraInfo = {
            'Comuna / Entidad': nomComuna,
            'Categoría': props.CATEGORIA || props.TIPO || def.geometria,
            'Fuente Oficial': 'SUBDERE - Catastro RSD 2024'
          };
        }
;
      }

      props._idOficial = idCapa;
      props._nombre = nombreEntidad;
      props._subtipo = detalleTipo;
      props._institucion = def.institucion;
      props._fuente = fuenteUsada;
      props._licencia = 'Ley N° 20.285 / Datos Abiertos Estado de Chile';
      props._citaAPA = def.citaAPA;
      props._declaracion = def.declaracion;
      props._archivoLocal = def.archivoLocal;
      
      if (Object.keys(extraInfo).length === 0) {
        let count = 0;
        for (const [k, v] of Object.entries(props)) {
          if (!k.startsWith('_') && v !== null && v !== undefined && v !== '' && count < 4) {
            extraInfo[k] = String(v);
            count++;
          }
        }
        if (count === 0) {
          extraInfo['Entidad'] = props.NOMBRE || props.nombre || props.ID || props.t_uv_nom || def.nombre;
          extraInfo['Institución'] = def.institucion;
        }
      }

      props._extraInfo = extraInfo;
      props._color = def.color;
      props._icono = def.icono;

      return {
        ...feat,
        properties: props
      };
    });

    const resultadoFinal = {
      def,
      fuenteUsada,
      geojson,
      cantidad: geojson.features.length
    };
    cacheCapasOficiales.set(idCapa, resultadoFinal);
    return resultadoFinal;
  }

  /**
   * Crea una capa WMS de Leaflet para los servicios oficiales que soportan GetMap
   */
  function crearCapaWMSLeaflet(idCapa) {
    const def = CAPAS_OFICIALES[idCapa];
    if (!def || !def.urlWMS || typeof L === 'undefined') return null;

    return L.tileLayer.wms(def.urlWMS, {
      layers: def.capasWMS,
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      attribution: `&copy; ${def.institucion} (WMS OGC)`
    });
  }

  function obtenerCapasDisponibles() {
    return Object.values(CAPAS_OFICIALES);
  }

  function obtenerDefinicion(idCapa) {
    if (!idCapa) return null;
    if (CAPAS_OFICIALES[idCapa]) return CAPAS_OFICIALES[idCapa];
    if (typeof idCapa === 'string') {
      if (idCapa.startsWith('capa_')) {
        const alias = idCapa.replace('capa_', 'bbdd_');
        if (CAPAS_OFICIALES[alias]) return CAPAS_OFICIALES[alias];
      }
      if (idCapa.startsWith('bbdd_')) {
        const alias = idCapa.replace('bbdd_', 'capa_');
        if (CAPAS_OFICIALES[alias]) return CAPAS_OFICIALES[alias];
      }
      // Alias / fallback de compatibilidad para capas consolidadas:
      if (idCapa === 'zonas_aseo' || idCapa === 'aseo_santiago' || idCapa === 'capa_zonas_aseo') {
        return CAPAS_OFICIALES['munistgo_aseo_zonas_residuos_2026'];
      }
      if (idCapa === 'barrios_santiago_con_zonas_aseo' || idCapa === 'capa_barrios_santiago_con_zonas_aseo') {
        return {
          ...CAPAS_OFICIALES['munistgo_aseo_zonas_residuos_2026'],
          id: 'barrios_santiago_con_zonas_aseo',
          nombre: 'MuniSTGO - Barrios con Catastro de Zonas de Aseo y Residuos',
          archivoLocal: 'data/barrios_santiago_con_zonas_aseo.geojson',
          geometria: 'Polígonos (27 Barrios Santiago)'
        };
      }
      if (idCapa === 'unidades_vecinales_bidat' || idCapa === 'capa_unidades_vecinales_bidat' || idCapa === 'ide_minvu_unidades_vecinales_rsh') {
        return CAPAS_OFICIALES['bbdd_66'];
      }
    }
    return null;
  }

  return {
    CAPAS_OFICIALES,
    SERVICIOS_IPT_CHILE,
    consultarCapaOficial,
    crearCapaWMSLeaflet,
    obtenerCapasDisponibles,
    obtenerDefinicion,
    obtenerDefinicionCapa: obtenerDefinicion,
    obtenerCatalogoCapas: () => CAPAS_OFICIALES
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloIDEChile = ModuloIDEChile;
}
