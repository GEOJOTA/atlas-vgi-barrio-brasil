/*
  indicadores_analisis.js
  -----------------------
  Módulo de Indicadores de Análisis Multidimensional y Storyboards Territoriales de Barrio Brasil.
  Atlas de Información Geográfica Voluntaria para la Gestión Territorial.

  Estructura y Principios:
  1. Agrupación analítica de las 132 capas del Atlas (122 Oficiales + 10 VGI) en 5 Dimensiones Estratégicas:
     - 1) Sociodemográfica (19 capas)
     - 2) Socioeconómica (18 capas)
     - 3) Socioambiental (37 capas)
     - 4) Sociosanitaria (3 capas)
     - 5) Sociourbana o Habitabilidad (55 capas)
  2. Nombres de capas rigurosamente idénticos a los del Módulo "00. Visor y Atlas VGI".
  3. Datos espaciales derivados exclusivamente de la base de datos formal del Atlas VGI (capas oficiales y VGI).
  4. Storyboards territoriales con rigor técnico y lenguaje accesible:
     - Métricas cuantitativas (KPIs), porcentajes, gráficos de barras comparativas, diagramas técnicos vectoriales SVG y tablas de datos.
     - Sección analítica estructurada según los 4 Usuarios-Tipo del proyecto:
       * Institución / Autoridad Pública (MINVU, Municipio, MTT, IDE Chile)
       * Comunidad / Vecinal (Juntas de Vecinos, asambleas barriales, vecinos)
       * Mapeador / Voluntario OSM (comunidad OSM, mapeadores colaborativos)
       * ONGs / Investigadores / Academia (centros de estudios urbanos y territoriales)
     - Apartado Bibliográfico y Trazabilidad de Datos Formales:
       * Fuentes espaciales primarias (con código BBDD/CAT, institución custodia y sistema de referencia).
       * Referencias teórico-metodológicas de autores clave en norma APA 7ma edición.
  5. Conmutación cartográfica inmediata al Visor 2D (Leaflet).
*/

const ModuloIndicadoresAnalisis = (() => {

  // =========================================================================
  // 1. DICCIONARIOS DE METADATOS Y FALLBACK CON PARIDAD EXACTA (MÓDULO 01)
  // =========================================================================
  const NOMBRES_OFICIALES_FALLBACK = {
  "censo2024_regional": "Censo 2024 (Marco Regional RM)",
  "censo2024_limite_urbano": "Censo 2024 (Límites Urbanos Censales RM)",
  "censo2024_localidades": "Censo 2024 (Localidades y Asentamientos RM)",
  "censo2024_zonal": "Censo 2024 (Zonas y Distritos Censales RM)",
  "censo2024_manzanas": "Censo 2024 (Manzanas Censales RM)",
  "minvu_patrimonio": "Patrimonio IPT: Inmuebles y Zonas de Conservación Histórica (ZCH / ICH RM)",
  "educacion_parvularia": "Jardines y Salas Cuna (JUNJI / Integra)",
  "establecimientos_salud": "Salud Pública (CESFAM y Hospitales)",
  "bomberos": "Cuarteles de Bomberos de Chile",
  "carabineros": "Comisarías y Cuarteles Policiales",
  "estaciones_metro": "Estaciones de Metro de Santiago",
  "red_ferroviaria": "Red Ferroviaria EFE (MTT)",
  "cmn_sitios_memoria": "Sitios de Memoria y Monumentos CMN",
  "minvu_ipt_prc_santiago": "Planes Reguladores Comunales (PRC - RM): Zonificación Comunal",
  "minvu_ipt_prms_usosuelo": "Plan Regulador Metropolitano (PRMS): Usos de Suelo Regional",
  "minvu_ipt_areas_verdes": "Áreas Verdes Normativas (MINVU / INE 2023)",
  "minvu_ipt_areas_riesgo": "Áreas de Riesgo Normativas (IPT)",
  "minvu_ipt_resguardo_infraestructura": "Fajas de Resguardo e Infraestructura PRMS",
  "minvu_ipt_limite_urbano": "Límite Urbano Oficial PRC (MINVU)",
  "ide_minvu_campamentos": "Catastro Campamentos 2024 (MINVU)",
  "ide_minvu_ipt_prms_riesgo": "PRMS: Riesgos Metropolitanos (Inundación / Remoción)",
  "ide_subdere_dpa_comunas": "División Político-Administrativa (SUBDERE / IGM)",
  "bbdd_01": "Proyectos Mandatados - GEOMOP",
  "bbdd_02": "Red Vial Nacional - GEOMOP",
  "bbdd_03": "Red Hidrométrica - GEOMOP",
  "bbdd_04": "Contratos Concesionados - GEOMOP",
  "bbdd_05": "Contratos MOP - GEOMOP",
  "bbdd_06": "Jardines Infantiles JUNJI",
  "bbdd_07": "Infraestructura Deportiva",
  "bbdd_08": "Municipios",
  "bbdd_10": "Jardines Infantiles Fundación Integra",
  "bbdd_11": "Cuerpos de Bomberos",
  "bbdd_12": "Establecimientos Educación Escolar",
  "bbdd_13": "Establecimientos Educación Parvularia",
  "bbdd_14": "Establecimientos de Educación Superior",
  "bbdd_15": "Centros de SERNAM",
  "bbdd_17": "Áreas Funcionales de las ciudades (2026)",
  "bbdd_18": "Zonificación Termica",
  "bbdd_19": "Cité",
  "bbdd_20": "SEREMI MINVU Región Metropolitana",
  "bbdd_21": "Oficinas Serviu",
  "energia_almacenamiento_rm": "Sistemas de Almacenamiento de Energía RM",
  "energia_bioenergia_rm": "Centrales de Bioenergía RM",
  "energia_electrolineras_rm": "Red de Electrolineras RM",
  "energia_gasoducto_rm": "Red de Gasoductos RM",
  "energia_hidroelectricas_rm": "Centrales Hidroeléctricas RM",
  "energia_lineas_transmision_rm": "Líneas de Transmisión Eléctrica RM",
  "energia_oleoducto_rm": "Red de Oleoductos RM",
  "energia_solares_rm": "Plantas Solares Fotovoltaicas RM",
  "energia_termoelectricas_rm": "Centrales Termoeléctricas RM",
  "bbdd_23": "Sitios BIO-Prioritarios",
  "bbdd_24": "Juzgados de Familia",
  "bbdd_25": "Estaciones Meteorológicas",
  "bbdd_26": "Estaciones Sedimentométricas",
  "bbdd_27": "Estaciones de Calidad de Aguas",
  "bbdd_29": "Cuencas Banco Nacional de Aguas",
  "bbdd_30": "Indice Calidad de Aguas",
  "bbdd_31": "Ciclovías",
  "bbdd_32": "Vertederos Ilegales",
  "bbdd_33": "Plan Cuadrante Carabineros",
  "bbdd_34": "Zonas climáticas de Chile según Köppen-Geiger escala 1:1.500.000",
  "bbdd_35": "Antenas en Servicio Ley de Torres",
  "bbdd_37": "Red de Interconexión",
  "bbdd_38": "Territorios de los Servicios de Salud",
  "bbdd_39": "Estaciones de monitoreo de calidad de aire (Red Pública)",
  "bbdd_40": "Circuitos Turísticos",
  "ccu_rm_1993": "Continuo de Construcciones Urbanas (1993)",
  "ccu_rm_2002": "Continuo de Construcciones Urbanas (2002)",
  "ccu_rm_2006": "Continuo de Construcciones Urbanas (2006)",
  "ccu_rm_2011": "Continuo de Construcciones Urbanas (2011)",
  "ccu_rm_2017": "Continuo de Construcciones Urbanas (2017)",
  "ccu_rm_2018": "Continuo de Construcciones Urbanas (2018)",
  "ccu_rm_2019": "Continuo de Construcciones Urbanas (2019)",
  "ccu_rm_2020": "Continuo de Construcciones Urbanas (2020)",
  "ccu_rm_2021": "Continuo de Construcciones Urbanas (2021)",
  "ccu_rm_2022": "Continuo de Construcciones Urbanas (2022)",
  "ccu_rm_2023": "Continuo de Construcciones Urbanas (2023)",
  "ccu_rm_2024": "Continuo de Construcciones Urbanas (2024)",
  "bbdd_42": "Pisos vegetacionales de Luebert y Pliscoff 2017",
  "bbdd_43": "División Política Administrativa 2023",
  "bbdd_44": "Municipios con certificación ambiental (SCAM)",
  "bbdd_46": "Predios Urbanos (Comuna de Santiago)",
  "bbdd_47": "Zona Fronteriza",
  "bbdd_48": "Pasos Fronterizos",
  "bbdd_49": "Estaciones Fluviométricas",
  "bbdd_50": "Oficinas de Protección de Derechos (ODP)",
  "bbdd_51": "Localización de viveros en Chile continental",
  "bbdd_52": "Estaciones Meteorológicas Automáticas (FIA)",
  "bbdd_53": "Industria Forestal Primeria (INFOR)",
  "bbdd_54": "Mercados Mayoristas (ODEPA)",
  "bbdd_55": "Sistema Nacional de Áreas Silvestres Protegidas del Estado",
  "bbdd_59": "Cobertura de canales a nivel nacional",
  "bbdd_60": "Catastro y Actualización de los Recursos Vegetacionales y Uso de la Tierra de la Región de Metropolitana (XIII)",
  "bbdd_62": "Cobertura de polígonos representativos de los huertos frutales de la Región Metropolitana 2025",
  "bbdd_63": "Inventario de Biomasa y Carbono - Metropolitana tipo Forestal",
  "bbdd_64": "Índice Global de Vulnerabilidad Socioterritorial (IGVUST) por UV 2026 Agosto",
  "bbdd_65": "Iniciativas de inversión del Banco Integrado de Proyectos (BIP), por años, al 31-08-2026.",
  "bbdd_66": "Unidades Vecinales 2026",
  "bbdd_67": "Personas en RSH en situación de dependencia funcional según CSE - 2026 Agosto",
  "bbdd_68": "Personas en RSH según CSE y sexo - 2026 Agosto",
  "bbdd_69": "NNA en RSH adscritas a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio",
  "bbdd_70": "Mujeres en RSH adscritas a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio",
  "bbdd_71": "Jóvenes en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio",
  "bbdd_72": "Hombres en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio",
  "bbdd_73": "Personas mayores en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio",
  "bbdd_74": "Personas en RSH ocupadas y cotizando, por modalidad contractual según tramo CSE - 2026 Junio",
  "semaforos_rm_uoct_2026": "Cruces Semaforizados Conectados SC-RM (UOCT / MTT)",
  "catastro_predial_sii": "Catastro Predial del Servicio de Impuestos Internos (Segundo Semestre 2025)",
"subdere_rsd_analisis_costos_comuna_rm": "SUBDERE RSD 2024 - Costos Comunales de Aseo (RM)",
  "subdere_rsd_poblacion_atendida_pta_puntos_rm": "SUBDERE RSD 2024 - Población Total Atendida PTA (Centroides RM)",
  "subdere_rsd_poblacion_comunal_pta_poligonos_rm": "SUBDERE RSD 2024 - Población Total Atendida PTA (Polígonos RM)",
  "subdere_rsd_ciudades_poblacion_rm": "SUBDERE RSD 2024 - Ciudades y Entidades Urbanas (RM)",
  "subdere_rsd_criticidad_sitios_disposicion_rm": "SUBDERE RSD 2024 - Criticidad de Rellenos Sanitarios (RM)",
  "subdere_rsd_distancia_municipio_sdf_rm": "SUBDERE RSD 2024 - Distancias Municipio a Relleno Sanitario (RM)",
  "subdere_rsd_gastos_ingresos_sinim_rm": "SUBDERE RSD 2024 - Finanzas Municipales y Gasto en Aseo SINIM (RM)",
  "subdere_rsd_recoleccion_transporte_operativo_rm": "SUBDERE RSD 2024 - Recolección y Transporte de Residuos (RM)",
  "subdere_rsd_ppc_generacion_pta_rm": "SUBDERE RSD 2024 - Generación de Residuos y Producción Per Cápita (RM)",
  "subdere_rsd_sdf_comunas_destino_rm": "SUBDERE RSD 2024 - Destino de Disposición Final por Comuna (RM)",
  "subdere_rsd_sdf_municipios_puntos_rm": "SUBDERE RSD 2024 - Sedes Municipales y Relleno Receptor (Puntos RM)",
  "subdere_rsd_sitios_disposicion_instalaciones_rm": "SUBDERE RSD 2024 - Rellenos Sanitarios e Instalaciones (RM)",
  "subdere_rsd_sitios_intermedios_transferencia_rm": "SUBDERE RSD 2024 - Estaciones de Transferencia Intermedia (RM)",
  "munistgo_aseo_zonas_residuos_2026": "MuniSTGO - Catastro Zonas de Aseo, Contenedores y Papeleros (Junio 2026)"
};

  const NOMBRES_VGI_FALLBACK = {
    'cat01_educacion': { codigo: 'CAT-01', nombre: 'Educación y Universidad', institucion: 'OSM / VGI', geom: 'POLÍGONO', desc: 'Equipamiento escolar, superior (Campus UAH), bibliotecas y jardines infantiles.' },
    'cat02_servicios': { codigo: 'CAT-02', nombre: 'Servicios y Comercio Barrial', institucion: 'OSM / VGI', geom: 'PUNTO', desc: 'Comercios minoristas, farmacias, bancos, notarías, restaurantes y almacenes.' },
    'cat03_transporte': { codigo: 'CAT-03', nombre: 'Movilidad y Transporte', institucion: 'OSM / VGI', geom: 'LÍNEA', desc: 'Paraderos, estaciones de Metro (L1/L2/L5), terminales y ciclovías estructurantes.' },
    'cat04_movilidad_activa': { codigo: 'CAT-04', nombre: 'Movilidad Activa y Ciclovías', institucion: 'OSM / VGI', geom: 'LÍNEA', desc: 'Red de ciclovías, bicicleteros públicos, zonas 30 km/h y ejes peatonales.' },
    'cat05_espacio_publico': { codigo: 'CAT-05', nombre: 'Áreas Verdes y Espacio Público', institucion: 'OSM / VGI', geom: 'POLÍGONO', desc: 'Plazas (Plaza Brasil), parques urbanos, plazoletas, fuentes y mobiliario público.' },
    'cat06_patrimonio': { codigo: 'CAT-06', nombre: 'Patrimonio y Cultura', institucion: 'OSM / VGI', geom: 'PUNTO', desc: 'Monumentos históricos, zonas típicas, casonas protegidas y centros culturales.' },
    'cat07_accesibilidad': { codigo: 'CAT-07', nombre: 'Accesibilidad Universal', institucion: 'OSM / VGI', geom: 'PUNTO', desc: 'Rebajes peatonales (kerb=lowered), cruces accesibles, baldosas podotáctiles y rampas.' },
    'cat08_biodiversidad': { codigo: 'CAT-08', nombre: 'Biodiversidad Urbana', institucion: 'GBIF / OSM', geom: 'PUNTO', desc: 'Arbolado urbano (catastro GBIF), avifauna nativa e insectos polinizadores.' },
    'cat09_edificaciones': { codigo: 'CAT-09', nombre: 'Edificaciones y Huella Urbana', institucion: 'OSM / VGI', geom: 'POLÍGONO', desc: 'Polígonos de edificaciones con interpretación predial, alturas estimadas y materialidad.' },
    'cat10_cobertura_suelo': { codigo: 'CAT-10', nombre: 'Coberturas y Usos de Suelo', institucion: 'OSM / VGI', geom: 'POLÍGONO', desc: 'Zonificación urbana, superficies impermeables, cubiertas vegetales y usos efectivos.' }
  };

  // =========================================================================
  // 2. DEFINICIÓN DE LAS 5 DIMENSIONES ESTRATÉGICAS (132 CAPAS TOTALES)
  // =========================================================================
  const DIMENSIONES = [
    {
      id: 'sociodemografica',
      numero: '1',
      nombre: 'Sociodemográfica',
      icono: '👥',
      color: '#06B6D4', // Cian
      colorFondo: 'rgba(6, 182, 212, 0.12)',
      colorBorde: 'rgba(6, 182, 212, 0.45)',
      descripcion: 'Caracterización de la estructura poblacional, composición demográfica, distribución de hogares y estratificación socioeconómica en la Comuna de Santiago y el Barrio Brasil.',
      enfoque: 'Coberturas demográficas multiescalares del Censo 2024, vulnerabilidad socioterritorial del Registro Social de Hogares y delimitación de unidades vecinales.',
      capasIds: [
        'censo2024_regional',
        'censo2024_limite_urbano',
        'censo2024_localidades',
        'censo2024_zonal',
        'censo2024_manzanas',
        'ide_minvu_campamentos',
        'bbdd_66', // Unidades Vecinales 2026
        'bbdd_08', // Municipios
        'bbdd_15', // Centros de SERNAM
        'bbdd_44', // Municipios con certificación ambiental (SCAM)
        'bbdd_50', // Oficinas de Protección de Derechos (ODP)
        'bbdd_64', // Índice Global de Vulnerabilidad Socioterritorial (IGVUST)
        'bbdd_68', // Personas en RSH según CSE y sexo
        'bbdd_69', // NNA en RSH adscritas a Fonasa o Isapre
        'bbdd_70', // Mujeres en RSH adscritas a Fonasa o Isapre
        'bbdd_71', // Jóvenes en RSH adscritos a Fonasa o Isapre
        'bbdd_72', // Hombres en RSH adscritos a Fonasa o Isapre
        'bbdd_73', // Personas mayores en RSH adscritos a Fonasa o Isapre
        'ide_subdere_dpa_comunas'
      ]
    },
    {
      id: 'socioeconomica',
      numero: '2',
      nombre: 'Socioeconómica',
      icono: '📈',
      color: '#F59E0B', // Ámbar / Dorado
      colorFondo: 'rgba(245, 158, 11, 0.12)',
      colorBorde: 'rgba(245, 158, 11, 0.45)',
      descripcion: 'Evaluación de la inversión pública, dinámica laboral, localización comercial barrial e infraestructura de telecomunicaciones y energía a escala metropolitana y local.',
      enfoque: 'Iniciativas de inversión pública, contratos de infraestructura estatal, comercio barrial colaborativo y redes energéticas y de conectividad.',
      capasIds: [
        'bbdd_65', // Iniciativas de inversión BIP MDSF
        'bbdd_01', // Proyectos Mandatados - GEOMOP
        'bbdd_04', // Contratos Concesionados - GEOMOP
        'bbdd_05', // Contratos MOP - GEOMOP
        'bbdd_74', // Personas en RSH ocupadas y cotizando
        'cat02_servicios', // VGI Servicios y Comercio Barrial
        'bbdd_35', // Antenas en Servicio Ley de Torres
        'bbdd_53', // Industria Forestal Primeria (INFOR)
        'bbdd_54', // Mercados Mayoristas (ODEPA)
        'energia_electrolineras_rm',
        'energia_lineas_transmision_rm',
        'energia_hidroelectricas_rm',
        'energia_termoelectricas_rm',
        'energia_solares_rm',
        'energia_bioenergia_rm',
        'energia_almacenamiento_rm',
        'energia_gasoducto_rm',
        'energia_oleoducto_rm'
      ]
    },
    {
      id: 'socioambiental',
      numero: '3',
      nombre: 'Socioambiental',
      icono: '🌿',
      color: '#10B981', // Esmeralda
      colorFondo: 'rgba(16, 185, 129, 0.12)',
      colorBorde: 'rgba(16, 185, 129, 0.45)',
      descripcion: 'Análisis de la infraestructura verde urbana, biodiversidad, condiciones ambientales, recursos hídricos y sistemas de gestión de residuos domiciliarios.',
      enfoque: 'Áreas verdes públicas, arbolado y biodiversidad colaborativa, monitoreo hidrometeorológico y metabolismo de residuos sólidos municipales.',
      capasIds: [
        'minvu_ipt_areas_verdes',
        'cat05_espacio_publico', // VGI Áreas Verdes y Espacio Público
        'cat08_biodiversidad', // VGI Biodiversidad Urbana
        'cat10_cobertura_suelo', // VGI Coberturas y Usos de Suelo
        'bbdd_03', // Red Hidrométrica - GEOMOP
        'bbdd_23', // Sitios BIO-Prioritarios
        'bbdd_25', // Estaciones Meteorológicas
        'bbdd_26', // Estaciones Sedimentométricas
        'bbdd_27', // Estaciones de Calidad de Aguas
        'bbdd_29', // Cuencas Banco Nacional de Aguas
        'bbdd_30', // Indice Calidad de Aguas
        'bbdd_32', // Vertederos Ilegales
        'bbdd_34', // Zonas climáticas de Chile según Köppen-Geiger
        'bbdd_39', // Estaciones de monitoreo de calidad de aire (Red Pública)
        'bbdd_42', // Pisos vegetacionales de Luebert y Pliscoff 2017
        'bbdd_49', // Estaciones Fluviométricas
        'bbdd_51', // Localización de viveros en Chile continental
        'bbdd_52', // Estaciones Meteorológicas Automáticas (FIA)
        'bbdd_55', // Sistema Nacional de Áreas Silvestres Protegidas del Estado
        'bbdd_59', // Cobertura de canales a nivel nacional
        'bbdd_60', // Catastro y Actualización de Recursos Vegetacionales RM
        'bbdd_62', // Cobertura de polígonos representativos de huertos frutales RM
        'bbdd_63', // Inventario de Biomasa y Carbono RM
        'subdere_rsd_analisis_costos_comuna_rm',
        'subdere_rsd_poblacion_atendida_pta_puntos_rm',
        'subdere_rsd_poblacion_comunal_pta_poligonos_rm',
        'subdere_rsd_ciudades_poblacion_rm',
        'subdere_rsd_criticidad_sitios_disposicion_rm',
        'subdere_rsd_distancia_municipio_sdf_rm',
        'subdere_rsd_gastos_ingresos_sinim_rm',
        'subdere_rsd_recoleccion_transporte_operativo_rm',
        'subdere_rsd_ppc_generacion_pta_rm',
        'subdere_rsd_sdf_comunas_destino_rm',
        'subdere_rsd_sdf_municipios_puntos_rm',
        'subdere_rsd_sitios_disposicion_instalaciones_rm',
        'subdere_rsd_sitios_intermedios_transferencia_rm',
        'munistgo_aseo_zonas_residuos_2026'
      ]
    },
    {
      id: 'sociosanitaria',
      numero: '4',
      nombre: 'Sociosanitaria',
      icono: '🏥',
      color: '#EC4899', // Rosa
      colorFondo: 'rgba(236, 72, 153, 0.12)',
      colorBorde: 'rgba(236, 72, 153, 0.45)',
      descripcion: 'Cobertura territorial de la red asistencial de salud pública, distribución de población con dependencia funcional y jurisdicciones sanitarias.',
      enfoque: 'Establecimientos de atención primaria y hospitalaria, requerimientos de cuidado sociosanitario y territorios de servicios de salud.',
      capasIds: [
        'establecimientos_salud',
        'bbdd_67', // Personas en RSH en situación de dependencia funcional
        'bbdd_38'  // Territorios de los Servicios de Salud
      ]
    },
    {
      id: 'sociourbana',
      numero: '5',
      nombre: 'Sociourbana o Habitabilidad',
      icono: '🏛️',
      color: '#8B5CF6', // Violeta
      colorFondo: 'rgba(139, 92, 246, 0.12)',
      colorBorde: 'rgba(139, 92, 246, 0.45)',
      descripcion: 'Configuración morfológica, regulación urbana, equipamiento comunitario, redes de movilidad multimodal, accesibilidad universal y patrimonio construido.',
      enfoque: 'Instrumentos de planificación territorial, catastro predial, sistemas de transporte público y activo, zonas de conservación histórica y servicios urbanos.',
      capasIds: [
        'minvu_ipt_prc_santiago',
        'minvu_ipt_prms_usosuelo',
        'minvu_ipt_areas_riesgo',
        'minvu_ipt_resguardo_infraestructura',
        'minvu_ipt_limite_urbano',
        'ide_minvu_ipt_prms_riesgo',
        'catastro_predial_sii',
        'bbdd_17', // Áreas Funcionales de las ciudades (2026)
        'bbdd_18', // Zonificación Termica
        'bbdd_19', // Cité
        'bbdd_20', // SEREMI MINVU Región Metropolitana
        'bbdd_21', // Oficinas Serviu
        'bbdd_43', // División Política Administrativa 2023
        'bbdd_46', // Predios Urbanos (Comuna de Santiago)
        'bbdd_47', // Zona Fronteriza
        'bbdd_48', // Pasos Fronterizos
        'semaforos_rm_uoct_2026',
        'estaciones_metro',
        'red_ferroviaria',
        'bbdd_02', // Red Vial Nacional - GEOMOP
        'bbdd_31', // Ciclovías
        'bbdd_37', // Red de Interconexión
        'cat03_transporte', // VGI Movilidad y Transporte
        'cat04_movilidad_activa', // VGI Movilidad Activa y Ciclovías
        'cat07_accesibilidad', // VGI Accesibilidad Universal
        'cat09_edificaciones', // VGI Edificaciones y Huella Urbana
        'minvu_patrimonio',
        'cmn_sitios_memoria',
        'cat06_patrimonio', // VGI Patrimonio y Cultura
        'educacion_parvularia',
        'bbdd_06', // Jardines Infantiles JUNJI
        'bbdd_10', // Jardines Infantiles Fundación Integra
        'bbdd_12', // Establecimientos Educación Escolar
        'bbdd_13', // Establecimientos Educación Parvularia
        'bbdd_14', // Establecimientos de Educación Superior
        'cat01_educacion', // VGI Educación y Universidad
        'bbdd_07', // Infraestructura Deportiva
        'bbdd_40', // Circuitos Turísticos
        'bomberos',
        'bbdd_11', // Cuerpos de Bomberos
        'carabineros',
        'bbdd_33', // Plan Cuadrante Carabineros
        'bbdd_24', // Juzgados de Familia
        'ccu_rm_1993', 'ccu_rm_2002', 'ccu_rm_2006', 'ccu_rm_2011',
        'ccu_rm_2017', 'ccu_rm_2018', 'ccu_rm_2019', 'ccu_rm_2020',
        'ccu_rm_2021', 'ccu_rm_2022', 'ccu_rm_2023', 'ccu_rm_2024'
      ]
    }
  ];

  // =========================================================================
  // =========================================================================
  // =========================================================================
  // 3. DEFINICIÓN DE LOS 4 GRANDES STORYBOARDS TERRITORIALES (75 CARTOGRAFÍAS DEL AUTOR)
  // =========================================================================
  const STORYBOARDS = [
    // -----------------------------------------------------------------------
    // STORYBOARD 1: RESULTADOS DEL ANÁLISIS DE DENSIDAD DE KERNEL (KDE) (11 MAPAS)
    // -----------------------------------------------------------------------
    {
      id: 'storyboard-densidad-kernel-kde',
      dimensionId: 'metodologica',
      dimensionNombre: 'Resultados Espaciales · Densidades de Kernel (KDE)',
      titulo: 'Concentración Territorial y Núcleos de Actividad VGI en Santiago: Lo que Revelan las Superficies de Densidad de Kernel',
      bajada: 'Análisis espacial de las 14 cartografías de densidad continua (KDE) sobre las 10 macro-categorías colaborativas del Atlas VGI, la red de semáforos UOCT y las dinámicas oficiales de Permisos de Edificación y Certificados de Recepción Final (CRF). Polarización entre la hiperconcentración del eje Alameda, Barrio Brasil, Santa Ana y Ejército frente a los vacíos de cobertura en la periferia sur de la comuna (Sierra Bella y Bogotá).',
      imagen: 'img/storyboards/portada_analisis_kde.svg',
      imagenDestacada: 'img/storyboards/portada_analisis_kde.svg',
      piePortada: 'Ilustración síntesis de los núcleos de intensidad territorial VGI identificados en la Comuna de Santiago y el entorno de Barrio Brasil.',
      tags: ['Resultados KDE', 'Concentración VGI', 'Barrio Brasil', 'Semaforización UOCT', 'Permisos y CRF', '14 Cartografías'],
      capasRelevantes: ['cat01_educacion', 'cat02_servicios', 'cat03_transporte', 'cat04_movilidad_activa', 'cat05_espacio_publico', 'cat06_patrimonio', 'cat07_accesibilidad', 'cat08_biodiversidad', 'cat09_edificaciones', 'cat10_cobertura_suelo', 'semaforos_rm_uoct_2026', 'ine_permisos_edificacion_santiago', 'ine_crf_conjuntos_santiago'],
      contenido: {
        introduccion: `El análisis de los 10.166 registros multigeométricos levantados en el Atlas VGI (3.186 puntos, 3.929 vértices de redes lineales y 3.051 polígonos) demuestra que la provisión de infraestructura, servicios y atributos ambientales en los 27 barrios oficiales de la Comuna de Santiago no se distribuye de forma homogénea ni concéntrica. Los resultados de las superficies de densidad revelan una marcada estructura axial y policéntrica: mientras el corredor Alameda, Barrio Brasil (media de 6.924,1 ent/km²), Santa Ana (1.728,2 ent/km²), Ejército (1.007,0 ent/km²), Parque Almagro (790,6 ent/km²) y Barrio Universitario (703,3 ent/km²) concentran los máximos absolutos de intensidad territorial, barrios del borde sur (agrupación AV10) como Sierra Bella (1,9 ent/km²), Bogotá (1,4 ent/km²), Matta Sur (2,1 ent/km²), Franklin (3,1 ent/km²) y San Vicente (15,3 ent/km²) exhiben severos vacíos de equipamiento y cobertura colaborativa.`,
        datosClave: [
          { valor: '20.203,8', label: 'Cima KDE Total VGI', sub: 'Máximo comunal (ent/km²) en eje Brasil-Alameda' },
          { valor: '6.924,1', label: 'Media Barrio Brasil', sub: '14,1 veces el promedio comunal (489,1 ent/km²)' },
          { valor: '10.166', label: 'Entidades Evaluadas', sub: '3.186 pts · 3.929 lín · 3.051 pol' },
          { valor: '14', label: 'Cartografías KDE', sub: '10 macro-categorías VGI + UOCT + Permisos INE + CRF + Síntesis Total' }
        ],
        porcentajesClave: [
          { label: 'Peso de Edificaciones y Transporte en la Intensidad Total VGI', valor: '62,2%', porcentaje: 62.2, contexto: 'Edificaciones (3.305 registros) y Transporte (3.016 registros) dominan la estructura física mapeada.' },
          { label: 'Superioridad de Densidad Media en Barrio Brasil vs. Media Comunal', valor: '93,4%', porcentaje: 93.4, contexto: 'Barrio Brasil lidera las 10 categorías por confluencia del campus UAH, Plaza Brasil y ejes viales.' },
          { label: 'Concentración de Biodiversidad Arbórea en 3 Barrios Pericentrales', valor: '78,5%', porcentaje: 78.5, contexto: 'Brasil (843,8), Parque Almagro (221,4) y Ejército (190,0) concentran el grueso del dosel.' },
          { label: 'Barrios con Densidad VGI Consolidada Crítica (< 15 ent/km²)', valor: '25,9%', porcentaje: 25.9, contexto: '7 de los 27 barrios comunales (Bogotá, Sierra Bella, Matta Sur, Diez de Julio, Santa Isabel, Franklin y Santa Elena) presentan vacíos de cobertura.' }
        ],
        graficoComparativo: {
          titulo: 'Densidad Media Comunal y Máximo en Barrio Líder por Categoría VGI (ent/km²)',
          filas: [
            { label: 'KDE Total Consolidado (Líder: Barrio Brasil 6.924,1 | Media: 489,1)', valor: '20.203,8 máx', porcentaje: 100.0 },
            { label: 'Edificaciones y Morfología (Líder: Barrio Brasil 2.651,8 | Media: 163,7)', valor: '7.155,8 máx', porcentaje: 78.0 },
            { label: 'Biodiversidad y Arbolado (Líder: Barrio Brasil 843,8 | Media: 52,1)', valor: '7.364,5 máx', porcentaje: 74.0 },
            { label: 'Transporte Público y Red (Líder: Barrio Brasil 1.729,7 | Media: 150,8)', valor: '3.213,7 máx', porcentaje: 58.0 },
            { label: 'Movilidad Activa y Ciclovías (Líder: Barrio Brasil 819,2 | Media: 36,9)', valor: '3.616,9 máx', porcentaje: 52.0 },
            { label: 'Espacio Público y Plazas (Líder: Barrio Brasil 345,3 | Media: 18,8)', valor: '5.074,4 máx', porcentaje: 46.0 },
            { label: 'Servicios y Comercio Local (Líder: Barrio Brasil 420,1 | Media: 30,5)', valor: '1.356,7 máx', porcentaje: 36.0 },
            { label: 'Educación y Universidades (Líder: Barrio Brasil 155,9 | Media: 14,2)', valor: '1.225,1 máx', porcentaje: 31.0 }
          ]
        },
        diagramaSVG: () => `
          <svg viewBox="0 0 680 230" width="680" height="230" class="svg-diagrama-canvas" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <rect width="680" height="230" fill="#0b1329" rx="8"/>
            <text x="24" y="28" fill="#38bdf8" font-size="11.5" font-weight="bold">PERFIL TRANSVERSAL DE DENSIDAD VGI (NORPONIENTE → CENTRO → SUR DE SANTIAGO)</text>
            <line x1="40" y1="190" x2="640" y2="190" stroke="#475569" stroke-width="1.5"/>
            <line x1="40" y1="50" x2="640" y2="50" stroke="#1e293b" stroke-width="1" stroke-dasharray="4,4"/>
            <line x1="40" y1="100" x2="640" y2="100" stroke="#1e293b" stroke-width="1" stroke-dasharray="4,4"/>
            <line x1="40" y1="150" x2="640" y2="150" stroke="#1e293b" stroke-width="1" stroke-dasharray="4,4"/>
            <!-- Curva de resultados reales KDE -->
            <path d="M 50,165 Q 110,145 165,45 Q 215,55 270,80 Q 330,95 390,110 Q 470,155 540,178 L 630,185" fill="none" stroke="#f59e0b" stroke-width="3.5"/>
            <polygon points="50,190 50,165 110,145 165,45 215,55 270,80 330,95 390,110 470,155 540,178 630,185 630,190" fill="#f59e0b" opacity="0.18"/>
            <!-- Hitos territoriales -->
            <circle cx="165" cy="45" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
            <text x="165" y="38" fill="#fca5a5" font-size="9.5" font-weight="bold" text-anchor="middle">Barrio Brasil (6.924 ent/km²)</text>
            <circle cx="270" cy="80" r="5" fill="#38bdf8"/>
            <text x="270" y="70" fill="#7dd3fc" font-size="9" font-weight="bold" text-anchor="middle">Santa Ana (1.728)</text>
            <circle cx="385" cy="108" r="5" fill="#10b981"/>
            <text x="385" y="98" fill="#6ee7b7" font-size="9" font-weight="bold" text-anchor="middle">Ejército / Parque Almagro</text>
            <circle cx="565" cy="180" r="5" fill="#64748b"/>
            <text x="565" y="168" fill="#94a3b8" font-size="9" font-weight="bold" text-anchor="middle">Sierra Bella / Bogotá (&lt;2)</text>
            <!-- Etiquetas eje X -->
            <text x="70" y="210" fill="#cbd5e1" font-size="8.5" text-anchor="middle">Yungay</text>
            <text x="165" y="210" fill="#fef08a" font-size="9" font-weight="bold" text-anchor="middle">Barrio Brasil - UAH</text>
            <text x="275" y="210" fill="#cbd5e1" font-size="8.5" text-anchor="middle">Centro Histórico / Santa Ana</text>
            <text x="395" y="210" fill="#cbd5e1" font-size="8.5" text-anchor="middle">B. Universitario / Parque Almagro</text>
            <text x="565" y="210" fill="#94a3b8" font-size="8.5" text-anchor="middle">Periferia Sur (Franklin / Bogotá)</text>
          </svg>
        `,
        seccionesAnaliticas: [
          {
            titulo: '1. La estructura axial y policéntrica del territorio: lo que revela el KDE Total VGI',
            parrafos: [
              'La cartografía consolidada del total de aportes VGI (KDE_Total_VGI) muestra con nitidez que la intensidad de equipamiento y registros territoriales en la Comuna de Santiago alcanza un máximo de 20.203,8 entidades/km², estructurándose sobre dos grandes corredores: el eje longitudinal de la Alameda Libertador Bernardo O’Higgins y el eje norte-sur que articula Barrio Brasil, Santa Ana, Ejército y Barrio Universitario.',
              'En el zoom sobre el entorno de Barrio Brasil se observa cómo los vectores de gradiente convergen hacia dos focos amarillos de máxima intensidad: el cuadrante suroriente del barrio (entorno del Campus Universidad Alberto Hurtado en Cienfuegos, Almirante Barroso y Alameda) y el núcleo central de Plaza Brasil junto al corredor de Av. Brasil y Compañía de Jesús. En contraste, los barrios del extremo suroriente y surponiente comunal —como Sierra Bella (con 1,9 ent/km²), Bogotá (con 1,4 ent/km²), Matta Sur (con 2,1 ent/km²), Franklin (con 3,1 ent/km²) y San Vicente (con 15,3 ent/km²)— aparecen en tonos azul profundo, evidenciando una pronunciada brecha norte-sur en la densidad de atributos urbanos registrados.'
            ],
            graficoInline: {
              titulo: 'Contraste de Densidad KDE Consolidada por Barrios Representativos (media ent/km²)',
              filas: [
                { label: 'Barrio Brasil (Núcleo UAH - Plaza Brasil)', valor: '6.924,1 ent/km²', porcentaje: 100 },
                { label: 'Barrio Santa Ana (Eje Catedral - San Martín)', valor: '1.728,2 ent/km²', porcentaje: 55 },
                { label: 'Barrio Ejército (Polo Institucional)', valor: '1.007,0 ent/km²', porcentaje: 40 },
                { label: 'Promedio Comunal Santiago (1.711 manzanas · 27 Barrios)', valor: '489,1 ent/km²', porcentaje: 22 },
                { label: 'Sierra Bella / Bogotá (Borde Sur)', valor: '1,6 ent/km²', porcentaje: 4 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/KDE_Total_VGI.jpg',
                titulo: 'KDE Total VGI Consolidado (Comuna de Santiago y Barrio Brasil)',
                subtitulo: 'Rango: 0 a 20.203,8 ent/km² · 9.048 entidades únicas deduplicadas',
                lectura: 'Revela una columna vertebral de altísima densidad sobre el eje Alameda y el centro-poniente (Brasil, Santa Ana, Ejército y Barrio Universitario), con vectores que apuntan hacia el campus UAH y Plaza Brasil, frente a vacíos profundos en el tercio sur comunal.'
              }
            ]
          },
          {
            titulo: '2. Compacidad edificada, dinámicas de edificación (Permisos y CRF), polaridad comercial y el clúster universitario',
            parrafos: [
              'Al desagregar los resultados en morfología construida, servicios comerciales y educación, las cartografías demuestran cómo distintas funciones urbanas modelan el pericentro. La superficie de Edificaciones (KDE_Edificaciones, con cima de 5.839,5 ent/km²) exhibe una mancha continua de alta compacidad que cubre casi la totalidad de Barrio Brasil (media de 2.651,8 ent/km²), Santa Ana (539,2 ent/km²), Barrio Universitario (319,8 ent/km²), Ejército (233,8 ent/km²) y Yungay (154,0 ent/km²), reflejando la subdivisión predial histórica de cités, casonas continuas y pabellones institucionales.',
              'En cambio, la densidad de Servicios y Comercio (KDE_Servicios, máximo de 1.376,3 ent/km²) abandona la distribución homogénea para concentrarse selectivamente en subcentros gastronómicos y comerciales: el entorno de Plaza Brasil (calles Huérfanos, Compañía y Av. Brasil con media barrial de 420,1 ent/km² en Brasil), Santa Ana (147,1 ent/km²), Ejército (96,0 ent/km²) y el eje Alameda. Por su parte, la cartografía de Educación (KDE_Educacion, máximo de 1.249,2 ent/km²) dibuja islas muy definidas de equipamiento superior y escolar lideradas por Barrio Brasil (155,9 ent/km², impulsado por los 34 predios del campus UAH y colegios históricos), Barrio Ejército (66,5 ent/km²), Barrio Universitario (47,8 ent/km²) y Parque Almagro (31,0 ent/km²), mientras el pericentro sur carece de núcleos equivalentes.',
              'La incorporación de las cartografías de dinámicas de edificación oficial del INE —Permisos de Edificación (KDE_Permisos_Edificacion, cima de 639,6 permisos/km²) y Certificados de Recepción Final (KDE_Certificados_Recepcion_Final, cima de 99,6 conjuntos/km²)— complementa el diagnóstico morfológico de la comuna. Mientras las autorizaciones de edificación trazan una marcada presión constructiva sobre los corredores estructurantes de Santa Ana, Santa Isabel, San Borja y Parque Almagro, la recepción efectiva de conjuntos habitacionales concluidos constata la materialización física de obras en altura en el sector centro-oriente y suroriente comunal. Este patrón contrasta nítidamente con las áreas patrimoniales de Barrio Brasil y Yungay, donde las bajas densidades de nuevos permisos reflejan la contención normativa y la prevalencia de la conservación sobre la demolición.'
            ],
            graficoInline: {
              titulo: 'Intensidad Máxima de Edificaciones, Servicios, Permisos y Educación en las Cartografías KDE',
              filas: [
                { label: 'KDE Edificaciones (Morfología predial y huella construida)', valor: '5.839,5 máx', porcentaje: 100 },
                { label: 'KDE Servicios y Comercio (Gastronomía y abastecimiento)', valor: '1.376,3 máx', porcentaje: 38 },
                { label: 'KDE Educación (Campus UAH, liceos y jardines)', valor: '1.249,2 máx', porcentaje: 34 },
                { label: 'KDE Permisos de Edificación (2010–2025 DOM/INE)', valor: '639,6 máx', porcentaje: 26 },
                { label: 'KDE Recepción Final CRF (Conjuntos concluidos)', valor: '99,6 máx', porcentaje: 12 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/KDE_Edificaciones.jpg',
                titulo: 'KDE Edificaciones y Huella Construida',
                subtitulo: 'Rango: 0 a 5.839,5 ent/km² · 3.305 entidades evaluadas',
                lectura: 'Muestra la compacidad extrema del tejido pericentral en Barrio Brasil (2.651,8 ent/km²) y Santa Ana, donde el grano predial fino de casonas y cités genera una superficie continua de alta densidad.'
              },
              {
                src: 'img/cartografias/KDE_Permisos_Edificacion.jpg',
                titulo: 'KDE Permisos de Edificación Consolidados (2010–2025)',
                subtitulo: 'Comuna de Santiago · 1.882 permisos autorizados (DOM / INE) · Cima: 639,6 permisos/km²',
                lectura: 'Expone la intensa concentración espacial de permisos autorizados a lo largo de los ejes de renovación urbana en Santa Ana, Santa Isabel, San Borja y Parque Almagro, en marcado contraste con la baja intensidad en las áreas de conservación histórica de Barrio Brasil y Yungay.'
              },
              {
                src: 'img/cartografias/KDE_Certificados_Recepcion_Final.jpg',
                titulo: 'KDE Certificados de Recepción Final - CRF (2011–2025)',
                subtitulo: 'Comuna de Santiago · 403 conjuntos habitacionales concluidos (DOM / INE) · Cima: 99,6 conjuntos/km²',
                lectura: 'Visualiza la culminación y entrega efectiva de conjuntos habitacionales en altura, focalizada marcadamente en los corredores oriente y suroriente comunal, verificando la concreción física del ciclo inmobiliario frente a los sectores consolidados de baja renovación.'
              },
              {
                src: 'img/cartografias/KDE_Servicios.jpg',
                titulo: 'KDE Servicios Urbanos y Comercio Barrial',
                subtitulo: 'Rango: 0 a 1.376,3 ent/km² · 584 entidades evaluadas',
                lectura: 'Identifica tres polos comerciales nítidos dentro del entorno de Barrio Brasil: el entorno bohemio y gastronómico de Plaza Brasil, el eje Huérfanos-Compañía y la fachada comercial de la Alameda.'
              },
              {
                src: 'img/cartografias/KDE_Educacion.jpg',
                titulo: 'KDE Educación, Colegios y Campus Universitarios',
                subtitulo: 'Rango: 0 a 1.249,2 ent/km² · 322 entidades evaluadas',
                lectura: 'Evidencia la gravitación del distrito universitario sobre el borde sur de Barrio Brasil (Campus UAH en Almirante Barroso y Cienfuegos) y su continuidad hacia los barrios Ejército y Universitario.'
              }
            ]
          },
          {
            titulo: '3. Corredores de transporte público, regulación semafórica UOCT, redes de ciclovías y micro-infraestructura de accesibilidad',
            parrafos: [
              'Las cartografías de movilidad revelan una clara diferenciación entre la macro-conectividad metropolitana y la micro-caminabilidad barrial. En Transporte Público (KDE_Transporte, cima de 3.213,7 ent/km²), el patrón espacial es marcadamente lineal, siguiendo la superposición de líneas de Metro (L1, L2 y L5) y troncos de buses Red sobre la Alameda, San Pablo, Santo Domingo y Av. Brasil (media de 1.729,7 ent/km² en Brasil, 704,7 ent/km² en Santa Ana, 277,6 ent/km² en Ejército y 181,4 ent/km² en Barrio Universitario).',
              'A esta configuración de transporte se suma la cartografía de Semáforos Conectados al Sistema de Control de la UOCT (KDE_Semaforos_UOCT, evaluando 3.483 cruces semaforizados en la RM). La superficie de densidad de semáforos expone cómo la semaforización y la regulación de tránsito se concentran intensamente a lo largo de la Alameda, el Centro Histórico, Santa Lucía Forestal y las vías estructurantes de Barrio Brasil (Av. Brasil, Cumming, Compañía y Huérfanos), coordinando los flujos vehiculares de transporte colectivo con cruces peatonales controlados hacia las zonas residenciales y campus universitarios.',
              'Al observar Movilidad Activa (KDE_Movilidad_activa, máximo de 3.255,4 ent/km²), la densidad reproduce una retícula ortogonal en el centro-poniente que refleja las ciclovías de Rosas, Compañía de Jesús, Av. Brasil y Alameda (819,2 ent/km² en Brasil, 72,0 ent/km² en Santa Ana, 22,1 ent/km² en Yungay y 18,4 ent/km² en Ejército), pero que se interrumpe abruptamente al cruzar hacia el sector sur de la comuna. Complementariamente, la cartografía de Accesibilidad Universal (KDE_Accesibilidad, máximo de 652,1 ent/km²) muestra que los rebajes de vereda, cruces peatonales adaptados y dispositivos podotáctiles se concentran en torno al eje Alameda, el centro de Barrio Brasil (248,4 ent/km²), Santa Ana (158,6 ent/km²) y Ejército (73,5 ent/km²), dejando extensas manzanas residenciales interiores con baja cobertura de cruces adaptados.'
            ],
            cartografias: [
              {
                src: 'img/cartografias/KDE_Transporte.jpg',
                titulo: 'KDE Transporte Público y Red Multimodal',
                subtitulo: 'Rango: 0 a 3.213,7 ent/km² · 3.016 entidades evaluadas',
                lectura: 'Destaca la hiper-conectividad del eje Alameda (Estaciones Los Héroes y República) y del nodo Santa Ana-Cumming, contrastando con la menor densidad de corredores en Bogotá y Diez de Julio.'
              },
              {
                src: 'img/cartografias/KDE_Semaforos_UOCT.jpg',
                titulo: 'KDE Red de Semáforos y Control de Tránsito UOCT',
                subtitulo: 'Región Metropolitana y Comuna de Santiago · 3.483 cruces semaforizados (UOCT / MTT)',
                lectura: 'Evidencia la alta densidad de cruces semaforizados en el corredor Alameda y en los ejes conectores de Barrio Brasil (Av. Brasil, Cumming, Compañía y Huérfanos), vinculando la gestión semafórica con la canalización de flujos y la seguridad de cruce peatonal.'
              },
              {
                src: 'img/cartografias/KDE_Movilidad_activa.jpg',
                titulo: 'KDE Movilidad Activa y Red de Ciclovías',
                subtitulo: 'Rango: 0 a 3.255,4 ent/km² · 552 entidades evaluadas',
                lectura: 'Dibuja una malla ciclista altamente articulada sobre los ejes Rosas, Compañía, Brasil y Alameda, dejando al descubierto la desconexión de la mitad suroriental de la comuna.'
              },
              {
                src: 'img/cartografias/KDE_Accesibilidad.jpg',
                titulo: 'KDE Accesibilidad Universal y Cruces Peatonales',
                subtitulo: 'Rango: 0 a 652,1 ent/km² · 498 entidades evaluadas',
                lectura: 'Localiza las mayores concentraciones de rebajes peatonales y cruces accesibles en la intersección de Av. Brasil con Alameda y Compañía, así como en el entorno institucional de Santa Ana.'
              }
            ]
          },
          {
            titulo: '4. Parches ecológicos, espacio público recreativo y resguardo del patrimonio histórico',
            parrafos: [
              'El bloque socioambiental y patrimonial expone los contrastes más agudos de estructura morfológica. Tanto Biodiversidad Urbana (KDE_Biodiversidad, cima de 5.394,8 ent/km²) como Espacio Público (KDE_Espacio_Publico, cima de 3.310,6 ent/km²) y Coberturas de Suelo (KDE_Coberturas_de_Suelo, cima de 839,2 ent/km²) abandonan el patrón de corredor continuo para manifestarse como "archipiélagos verdes" altamente focalizados.',
              'Los datos confirman que la máxima intensidad de arbolado y áreas verdes se concentra en Plaza Brasil y los bandejones de Av. Brasil dentro de Barrio Brasil (con media de 843,8 ent/km² en biodiversidad y 345,3 ent/km² en espacio público), seguidos por Parque Almagro (con 221,4 ent/km² en biodiversidad y 153,4 ent/km² en coberturas de suelo) y Barrio Ejército (con 190,0 ent/km²). Finalmente, la cartografía de Patrimonio (KDE_Patrimonio, cima de 288,9 ent/km²) demuestra cómo los inmuebles protegidos, iglesias y monumentos conforman un corredor cultural entre Plaza Brasil y la Basílica del Salvador en Barrio Brasil (59,6 ent/km²), articulado con Santa Ana (19,2 ent/km²), Ejército (13,8 ent/km²), Parque Almagro (11,2 ent/km²) y Barrio Universitario (7,9 ent/km²), consolidando al poniente histórico como el reservorio identitario de la capital.'
            ],
            graficoInline: {
              titulo: 'Barrios con Mayor Densidad Media de Biodiversidad y Patrimonio en el Atlas VGI',
              filas: [
                { label: 'Biodiversidad: Barrio Brasil (843,8 ent/km²)', valor: '843,8 ent/km²', porcentaje: 100 },
                { label: 'Biodiversidad: Parque Almagro (221,4 ent/km²)', valor: '221,4 ent/km²', porcentaje: 42 },
                { label: 'Biodiversidad: Barrio Ejército (190,0 ent/km²)', valor: '190,0 ent/km²', porcentaje: 36 },
                { label: 'Patrimonio: Barrio Brasil (59,6 ent/km²)', valor: '59,6 ent/km²', porcentaje: 24 },
                { label: 'Patrimonio: Barrio Santa Ana (19,2 ent/km²)', valor: '19,2 ent/km²', porcentaje: 14 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/KDE_Biodiversidad.jpg',
                titulo: 'KDE Biodiversidad Urbana y Arbolado (GBIF / OSM)',
                subtitulo: 'Rango: 0 a 5.394,8 ent/km² · 979 entidades evaluadas',
                lectura: 'Exhibe un núcleo ecológico sobresaliente en Plaza Brasil, el eje arbolado de Av. Brasil y los patios del campus UAH, seguidos por Parque Almagro y Ejército.'
              },
              {
                src: 'img/cartografias/KDE_Espacio_Publico.jpg',
                titulo: 'KDE Espacio Público, Plazas y Recreación',
                subtitulo: 'Rango: 0 a 3.310,6 ent/km² · 348 entidades evaluadas',
                lectura: 'Muestra un patrón insular dominado por Plaza Brasil y Plaza Manuel Rodríguez, revelando la escasez de plazas de bolsillo en las manzanas interiores del pericentro.'
              },
              {
                src: 'img/cartografias/KDE_Coberturas_de_Suelo.jpg',
                titulo: 'KDE Coberturas y Usos de Suelo Urbano',
                subtitulo: 'Rango: 0 a 839,2 ent/km² · 463 entidades evaluadas',
                lectura: 'Destaca los paños de cobertura vegetal y usos institucionales en Parque Almagro (153,4 ent/km²), Barrio Brasil (151,9 ent/km²) y Santa Ana (77,8 ent/km²).'
              },
              {
                src: 'img/cartografias/KDE_Patrimonio.jpg',
                titulo: 'KDE Patrimonio Histórico, Sitios de Memoria y Cultura',
                subtitulo: 'Rango: 0 a 288,9 ent/km² · 99 entidades evaluadas',
                lectura: 'Configura un eje patrimonial continuo sobre las calles Huérfanos, Compañía, Cienfuegos y Almirante Barroso, articulando la Basílica del Salvador, cités históricos y casonas UAH.'
              }
            ]
          }
        ],
        tablaIndicadores: [
          { variable: 'Densidad KDE Consolidada Comunal', valor: '489,1 ent/km² (media)', referencial: 'Máximo: 20.203,8 ent/km²', fuente: 'Síntesis VGI 1.711 Manzanas' },
          { variable: 'Barrio de Mayor Concentración VGI', valor: 'Barrio Brasil (6.924,1 ent/km²)', referencial: 'Seguido por Santa Ana (1.728,2)', fuente: 'Catálogo KDE Multigeométrico' },
          { variable: 'Categoría de Mayor Volumen Espacial', valor: 'Edificaciones (3.305 registros)', referencial: 'Seguida por Transporte (3.016)', fuente: 'OpenStreetMap / Geofabrik' },
          { variable: 'Barrios con Mayor Vacío VGI', valor: 'Bogotá (1,4) y Sierra Bella (1,9)', referencial: 'Agrupación Sur AV10', fuente: 'Matriz Zonal 27 Barrios' }
        ],
        conclusion: 'Los resultados de densidad de kernel demuestran que Santiago opera bajo una marcada asimetría territorial entre sus 27 barrios comunales: un núcleo histórico-universitario (Barrio Brasil, Santa Ana, Ejército, Barrio Universitario y Parque Almagro) dotado de altísima diversidad de servicios, movilidad y arbolado, contrapuesto a barrios residenciales del sur comunal (Bogotá, Sierra Bella, Matta Sur, Franklin y San Vicente) que requieren inversión prioritaria en infraestructura pública y campañas focalizadas de mapeo comunitario.',
        analisisPorActor: [
          { id: 'institucion', icono: '🏛️', nombre: 'Institución / Autoridad Pública', subtitulo: 'SECPLA Santiago · DITEC · MINVU · MTT', utilidad: 'Permite focalizar inversión en espacio público, arbolado y rebajes de accesibilidad en los barrios del sur comunal (Sierra Bella, Bogotá, San Vicente) que aparecen con densidad nula.' },
          { id: 'comunidad', icono: '🏘️', nombre: 'Comunidad / Vecinal', subtitulo: 'Juntas de Vecinos · Comités Barriales', utilidad: 'Entrega evidencia cuantitativa sobre la presión comercial y de transporte que soporta el eje Brasil-Alameda frente al déficit de plazas en sectores interiores.' },
          { id: 'voluntario', icono: '🗺️', nombre: 'Mapeador / Voluntario OSM', subtitulo: 'Comunidad OpenStreetMap · Mapeadores Colaborativos', utilidad: 'Identifica dónde existen sombras de información cartográfica al norte de Av. Mapocho y al sur de Av. Matta para orientar nuevas campañas de levantamiento.' },
          { id: 'ong', icono: '🔬', nombre: 'Investigadores / Academia', subtitulo: 'Centros de Estudios Urbanos y Territoriales', utilidad: 'Demuestra cuantitativamente la sinergia entre el equipamiento universitario, la vitalidad comercial y la densidad patrimonial en el pericentro histórico.' }
        ],
        apartadoBibliografico: {
          fuentesDatos: [
            { codigo: 'cat01_cat10_vgi', nombre: '10 Macro-categorías VGI Multigeométricas (10.166 registros)', institucion: 'Comunidad OSM / GBIF', crs: 'EPSG:32719', tipo: 'Puntos, Líneas y Polígonos' },
            { codigo: 'semaforos_rm_uoct_2026', nombre: 'Red de Cruces Semaforizados RM (3.483 entidades)', institucion: 'Unidad Operativa de Control de Tránsito (UOCT) / MTT', crs: 'EPSG:32719', tipo: 'Puntos Georreferenciados' },
            { codigo: 'sintesis_manzanas_stgo', nombre: 'Matriz Zonal de 1.711 Manzanas Censales y 27 Barrios', institucion: 'INE / SECPLA', crs: 'EPSG:32719', tipo: 'Polígonos GeoPackage' },
            { codigo: 'catalogo_vgi_kde', nombre: 'Catálogo de Superficies de Densidad de Kernel (KDE)', institucion: 'Atlas de Información Geográfica Voluntaria', crs: 'EPSG:32719', tipo: 'Ráster / Cartografía' }
          ],
          referenciasAcademicas: [
            { cita: 'Silverman, B. W. (1986). Density Estimation for Statistics and Data Analysis. Chapman & Hall / CRC Press.', concepto: 'Fundamento de las superficies continuas de densidad aplicadas a las 10 categorías territoriales y red semafórica.' },
            { cita: 'Unidad Operativa de Control de Tránsito [UOCT]. (2026). Catastro de Cruces Semafóricos Conectados al Sistema de Control. Ministerio de Transportes y Telecomunicaciones de Chile.', concepto: 'Superficie continua de densidad y cobertura de regulación semafórica urbana.' },
            { cita: 'Goodchild, M. F. (2007). Citizens as sensors: the world of volunteered geography. GeoJournal, 69(4), 211–221.', concepto: 'Asimetrías espaciales y concentración de la información geográfica voluntaria en centros urbanos.' },
            { cita: 'de Smith, M. J., Goodchild, M. F., & Longley, P. A. (2018). Geospatial Analysis (6th ed.). The Winchelsea Press.', concepto: 'Interpretación de gradientes direccionales y núcleos de concentración multigeométrica.' }
          ]
        }
      }
    },

    // -----------------------------------------------------------------------
    // STORYBOARD 2: RESULTADOS DE AUTOCORRELACIÓN ESPACIAL Y CLUSTERS LISA (11 MAPAS)
    // -----------------------------------------------------------------------
    {
      id: 'storyboard-autocorrelacion-lisa',
      dimensionId: 'metodologica',
      dimensionNombre: 'Resultados Espaciales · Clusters y Outliers LISA',
      titulo: 'Segregación Espacial, Hotspots y Áreas de Rezago en Santiago: Resultados de los Clusters Locales LISA',
      bajada: 'Qué revelan las 11 cartografías de autocorrelación espacial local (Anselin, 1995) sobre las 1.711 manzanas de Santiago: dónde se agrupan estadísticamente los núcleos Alto-Alto, qué barrios conforman bolsones Bajo-Bajo y qué significan las manzanas atípicas de transición.',
      imagen: 'img/storyboards/portada_analisis_lisa.svg',
      imagenDestacada: 'img/storyboards/portada_analisis_lisa.svg',
      piePortada: 'Ilustración conceptual de la polarización territorial entre conglomerados Alto-Alto (Hotspots), Bajo-Bajo (Coldspots) y anomalías espaciales en la trama de Santiago.',
      tags: ['Resultados LISA', 'Hotspots Alto-Alto', 'Coldspots Bajo-Bajo', 'Outliers Territoriales', '11 Cartografías'],
      capasRelevantes: ['cat01_educacion', 'cat02_servicios', 'cat03_transporte', 'cat04_movilidad_activa', 'cat05_espacio_publico', 'censo2024_manzanas', 'minvu_ipt_prc_santiago'],
      contenido: {
        introduccion: `El análisis de los Indicadores Locales de Asociación Espacial (LISA) sobre las 1.711 manzanas y los 27 barrios oficiales de la Comuna de Santiago demuestra que los atributos urbanos y colaborativos presentan una fuerte segregación territorial estadísticamente significativa. En el consolidado comunal, el 44,1% de las manzanas pertenece a conglomerados extremos: 140 manzanas (8,2%) conforman un núcleo compacto de alta concentración (Hotspot Alto-Alto) anclado en Barrio Brasil (63 manzanas), Santa Ana (23 manzanas), Yungay (17 manzanas), Parque Almagro (13 manzanas), Ejército (12 manzanas) y Barrio Universitario (9 manzanas), mientras 615 manzanas (35,9%) integran extensos bolsones de rezago (Coldspot Bajo-Bajo) en el sur, oriente y norponiente comunal, encabezados por Sierra Bella (90 manzanas), Bogotá (87 manzanas), Matta Sur (58 manzanas), Diez de Julio (52 manzanas), Matta Norte (50 manzanas), Santa Isabel (46 manzanas), San Eugenio (44 manzanas), Viel (39 manzanas) y Balmaceda (37 manzanas).`,
        datosClave: [
          { valor: '140', label: 'Manzanas Hotspot (HH)', sub: '8,2% comunal · 45% de ellas en Barrio Brasil' },
          { valor: '615', label: 'Manzanas Coldspot (LL)', sub: '35,9% comunal · Concentradas en el sector sur' },
          { valor: '956', label: 'No Significativas', sub: '55,9% de transición intermedia comunal' },
          { valor: '11', label: 'Cartografías LISA', sub: '10 categorías VGI + Consolidado Total' }
        ],
        porcentajesClave: [
          { label: 'Proporción de Hotspots Comunales (Alto-Alto) Localizados en Barrio Brasil', valor: '45,0%', porcentaje: 45.0, contexto: '63 de las 140 manzanas Alto-Alto de toda la comuna se sitúan dentro de Barrio Brasil.' },
          { label: 'Manzanas Comunales Clasificadas en Coldspots de Rezago (Bajo-Bajo)', valor: '35,9%', porcentaje: 35.9, contexto: '615 manzanas forman un cinturón continuo de baja dotación en el borde sur, norponiente y oriente.' },
          { label: 'Concentración de Hotspots en los 4 Barrios Líderes (Brasil, Sta. Ana, Yungay, Almagro)', valor: '82,9%', porcentaje: 82.9, contexto: '116 de las 140 manzanas Alto-Alto se agrupan en el eje pericentral histórico-universitario.' },
          { label: 'Peso de los 4 Barrios Sur (Sierra Bella, Bogotá, Matta Sur, 10 de Julio) en Coldspots', valor: '46,7%', porcentaje: 46.7, contexto: '287 de las 615 manzanas Bajo-Bajo se ubican en el cuadrante suroriente de la comuna.' }
        ],
        graficoComparativo: {
          titulo: 'Distribución de Manzanas Significativas por Barrio en el Cluster LISA Total VGI',
          filas: [
            { label: 'Hotspot Alto-Alto: Barrio Brasil (63 manzanas · 45,0% del total HH)', valor: '63 mz HH', porcentaje: 100.0 },
            { label: 'Hotspot Alto-Alto: Barrio Santa Ana (23 manzanas · 16,4% del total HH)', valor: '23 mz HH', porcentaje: 36.5 },
            { label: 'Hotspot Alto-Alto: Barrio Yungay (17 manzanas · 12,1% del total HH)', valor: '17 mz HH', porcentaje: 27.0 },
            { label: 'Hotspot Alto-Alto: Parque Almagro (13 manzanas · 9,3% del total HH)', valor: '13 mz HH', porcentaje: 20.6 },
            { label: 'Coldspot Bajo-Bajo: Sierra Bella (90 manzanas en rezago espacial)', valor: '90 mz LL', porcentaje: 95.0 },
            { label: 'Coldspot Bajo-Bajo: Barrio Bogotá (87 manzanas en rezago espacial)', valor: '87 mz LL', porcentaje: 91.5 },
            { label: 'Coldspot Bajo-Bajo: Matta Sur (58 manzanas en rezago espacial)', valor: '58 mz LL', porcentaje: 61.0 },
            { label: 'Coldspot Bajo-Bajo: Diez de Julio (52 manzanas en rezago espacial)', valor: '52 mz LL', porcentaje: 55.0 }
          ]
        },
        diagramaSVG: () => `
          <svg viewBox="0 0 680 230" width="680" height="230" class="svg-diagrama-canvas" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <rect width="680" height="230" fill="#0b1329" rx="8"/>
            <text x="24" y="28" fill="#38bdf8" font-size="11.5" font-weight="bold">ESTRUCTURA TERRITORIAL DE LOS CUADRANTES LISA EN LA COMUNA DE SANTIAGO (1.711 MANZANAS)</text>
            <!-- Bloque 1: Hotspot HH -->
            <rect x="25" y="45" width="200" height="160" rx="8" fill="#eab308" fill-opacity="0.14" stroke="#eab308" stroke-width="1.8"/>
            <text x="40" y="70" fill="#fde047" font-size="12" font-weight="bold">ALTO-ALTO (Hotspot)</text>
            <text x="40" y="90" fill="#ffffff" font-size="18" font-weight="900">140 manzanas (8,2%)</text>
            <text x="40" y="112" fill="#cbd5e1" font-size="9.5">· Brasil: 63 manzanas</text>
            <text x="40" y="128" fill="#cbd5e1" font-size="9.5">· Santa Ana: 23 manzanas</text>
            <text x="40" y="144" fill="#cbd5e1" font-size="9.5">· Yungay: 17 manzanas</text>
            <text x="40" y="160" fill="#cbd5e1" font-size="9.5">· P. Almagro: 13 manzanas</text>
            <text x="40" y="185" fill="#fde047" font-size="8.5" font-weight="bold">Núcleo Alameda - Plaza Brasil - UAH</text>
            <!-- Bloque 2: Transición Atípicos HL / LH -->
            <rect x="240" y="45" width="200" height="160" rx="8" fill="#10b981" fill-opacity="0.12" stroke="#34d399" stroke-width="1.5"/>
            <text x="255" y="70" fill="#4ade80" font-size="12" font-weight="bold">ATÍPICOS (HL y LH)</text>
            <text x="255" y="90" fill="#ffffff" font-size="13" font-weight="800">Fronteras de Transición</text>
            <text x="255" y="114" fill="#67e8f9" font-size="9.5" font-weight="bold">▪ Alto-Bajo (Cian):</text>
            <text x="255" y="128" fill="#cbd5e1" font-size="8.8">Enclaves equipados rodeados de</text>
            <text x="255" y="140" fill="#cbd5e1" font-size="8.8">manzanas de menor densidad.</text>
            <text x="255" y="160" fill="#86efac" font-size="9.5" font-weight="bold">▪ Bajo-Alto (Verde):</text>
            <text x="255" y="174" fill="#cbd5e1" font-size="8.8">Manzanas interiores con vacío</text>
            <text x="255" y="186" fill="#cbd5e1" font-size="8.8">junto a corredores saturados.</text>
            <!-- Bloque 3: Coldspot LL -->
            <rect x="455" y="45" width="200" height="160" rx="8" fill="#3b82f6" fill-opacity="0.15" stroke="#60a5fa" stroke-width="1.8"/>
            <text x="470" y="70" fill="#93c5fd" font-size="12" font-weight="bold">BAJO-BAJO (Coldspot)</text>
            <text x="470" y="90" fill="#ffffff" font-size="18" font-weight="900">615 manzanas (35,9%)</text>
            <text x="470" y="112" fill="#cbd5e1" font-size="9.5">· Sierra Bella: 90 manzanas</text>
            <text x="470" y="128" fill="#cbd5e1" font-size="9.5">· Bogotá: 87 manzanas</text>
            <text x="470" y="144" fill="#cbd5e1" font-size="9.5">· Matta Sur: 58 manzanas</text>
            <text x="470" y="160" fill="#cbd5e1" font-size="9.5">· Diez de Julio: 52 manzanas</text>
            <text x="470" y="185" fill="#93c5fd" font-size="8.5" font-weight="bold">Anillo Periférico Sur y Norponiente</text>
          </svg>
        `,
        seccionesAnaliticas: [
          {
            titulo: '1. La fractura centro-periferia en el Cluster LISA Total VGI y la transición interna de Barrio Brasil',
            parrafos: [
              'La cartografía síntesis de autocorrelación local (cluster_lisa_vgi_kde_total) revela una geografía dual dentro de la comuna y dentro del propio Barrio Brasil. A escala comunal, las manzanas Alto-Alto (amarillo) configuran un macizo compacto en el centro-norte y pericentro poniente (Brasil, Santa Ana, Yungay, Parque Almagro, Ejército, Barrio Universitario y Panamá), mientras que los clusters Bajo-Bajo (azul) rodean la comuna por sus bordes norponiente (Balmaceda y norte de Yungay), oriente (Santa Isabel, Diez de Julio y San Borja) y todo el tercio sur (San Eugenio, San Vicente, Franklin, Bogotá, Sierra Bella, Matta Sur, Matta Norte y Viel).',
              'Al observar el panel derecho (Entorno Barrio Brasil), el mapa expone una reveladora diferenciación interna: la mitad sur y suroriente del barrio —entre Compañía, Av. Brasil, Cienfuegos, Almirante Barroso y la Alameda— forma un bloque continuo Alto-Alto acompañado de manzanas Bajo-Alto (verde) en el borde inmediato del eje Alameda, mientras que el sector norponiente (hacia Av. Mapocho y San Pablo) cae abruptamente en un cluster Bajo-Bajo, separado por una franja de manzanas Alto-Bajo (cian) que actúan como bisagra territorial.'
            ],
            cartografias: [
              {
                src: 'img/cartografias/cluster_lisa_vgi_kde_total.jpg',
                titulo: 'Cluster LISA KDE Total VGI (Comuna de Santiago y Entorno Barrio Brasil)',
                subtitulo: '140 mz Alto-Alto · 615 mz Bajo-Bajo · 956 mz No Significativas',
                lectura: 'Demuestra que el 45% de todas las manzanas Hotspot (Alto-Alto) de la comuna se concentra en la mitad sur y central de Barrio Brasil, mientras el sector norte hacia Mapocho y el sur comunal operan como Coldspots (Bajo-Bajo).'
              }
            ]
          },
          {
            titulo: '2. Conglomerados de compacidad construida, actividad comercial y el polo educativo-universitario',
            parrafos: [
              'El cruce entre las cartografías LISA de Edificaciones, Servicios y Educación permite distinguir cómo se agrupan las funciones estructurales de la ciudad. En Edificaciones (cluster_lisa_vgi_edificaciones), el cluster Alto-Alto cubre de forma casi ininterrumpida el corazón de Barrio Brasil, Yungay oriental y Santa Ana, confirmando un tejido homogéneo de alta densidad predial; sin embargo, emergen manzanas Bajo-Alto (verde) insertas en medio del cluster amarillo, correspondientes a grandes paños abiertos o predios no subdivididos rodeados de manzanas intensamente edificadas.',
              'En Servicios y Comercio (cluster_lisa_vgi_servicios), los Hotspots Alto-Alto se retraen hacia nodos específicos: el cuadrante gastronómico de Plaza Brasil (Huérfanos-Compañía-Brasil), el centro cívico y el eje Alameda, apareciendo flanqueados por manzanas Alto-Bajo (cian) que señalan esquinas comerciales aisladas en entornos residenciales. Por su parte, el mapa LISA de Educación (cluster_lisa_vgi_educacion) delimita con precisión quirúrgica el "distrito universitario" en el extremo suroriente de Barrio Brasil (Campus UAH) conectado con los barrios Universitario y Ejército, frente a un extenso Coldspot Bajo-Bajo en las periferias norte y sur.'
            ],
            graficoInline: {
              titulo: 'Intensidad Media en los Barrios Núcleo de los Clusters Alto-Alto (Edificaciones, Servicios y Educación)',
              filas: [
                { label: 'Edificaciones en Barrio Brasil (Núcleo HH)', valor: '2.651,8 ent/km²', porcentaje: 100 },
                { label: 'Edificaciones en Santa Ana (Continuidad HH)', valor: '539,2 ent/km²', porcentaje: 45 },
                { label: 'Servicios en Barrio Brasil (Polo Plaza Brasil - Alameda)', valor: '420,1 ent/km²', porcentaje: 38 },
                { label: 'Educación en Barrio Brasil (Polo Campus UAH)', valor: '155,9 ent/km²', porcentaje: 28 },
                { label: 'Educación en Barrio Ejército (Continuidad Universitaria)', valor: '66,5 ent/km²', porcentaje: 18 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/cluster_lisa_vgi_edificaciones.jpg',
                titulo: 'Cluster LISA: Edificaciones y Huella Urbana',
                subtitulo: 'Conglomerados de compacidad predial y anomalías de vacío interior',
                lectura: 'Consolida un gran bloque Alto-Alto (amarillo) en el centro de Barrio Brasil y Santa Ana, con puntuales manzanas Bajo-Alto (verde) donde plazas o patios institucionales rompen la masa edificada.'
              },
              {
                src: 'img/cartografias/cluster_lisa_vgi_servicios.jpg',
                titulo: 'Cluster LISA: Servicios y Comercio Barrial',
                subtitulo: 'Núcleos comerciales y bordes de transición residencial',
                lectura: 'Focaliza los Hotspots Alto-Alto en torno a Plaza Brasil, Huérfanos y el eje Alameda, rodeados por anomalías Alto-Bajo (cian) que marcan subcentros comerciales barriales.'
              },
              {
                src: 'img/cartografias/cluster_lisa_vgi_educacion.jpg',
                titulo: 'Cluster LISA: Educación y Campus Universitarios',
                subtitulo: 'Enclave universitario Almirante Barroso - Cienfuegos - Ejército',
                lectura: 'Revela un potente cluster Alto-Alto en el sector suroriente de Barrio Brasil (Campus UAH) y Barrio Ejército, mientras el resto del pericentro permanece no significativo o en Coldspot.'
              }
            ]
          },
          {
            titulo: '3. Corredores significativos de transporte, mallas de movilidad activa y brechas de accesibilidad',
            parrafos: [
              'En las dimensiones de movilidad, los clusters LISA permiten diferenciar entre corredores consolidados y barrios desconectados. En Transporte Público (cluster_lisa_vgi_transporte), las manzanas Alto-Alto conforman una franja continua a lo largo de la Alameda, Santa Ana y el eje Av. Brasil-San Pablo, acompañadas de manzanas Bajo-Alto (verde) inmediatamente adyacentes a las grandes avenidas, lo que indica que basta internarse una o dos cuadras hacia el interior residencial para que la densidad de paraderos caiga drásticamente.',
              'En Movilidad Activa (cluster_lisa_vgi_movilidad_activa), el cluster Alto-Alto dibuja con exactitud los ejes de las ciclovías de Rosas, Compañía, Brasil y Alameda, dejando a la vista un gran Coldspot Bajo-Bajo en el sur comunal donde la red ciclista pierde continuidad. Asimismo, el mapa LISA de Accesibilidad Universal (cluster_lisa_vgi_accesibilidad) demuestra que los rebajes de solera y cruces adaptados solo forman conglomerados Alto-Alto en el pericentro institucional (Alameda, Santa Ana y entorno de Plaza Brasil), mientras el norponiente y el borde sur carecen de continuidad peatonal accesible.'
            ],
            cartografias: [
              {
                src: 'img/cartografias/cluster_lisa_vgi_transporte.jpg',
                titulo: 'Cluster LISA: Transporte Público y Paraderos',
                subtitulo: 'Corredores multimodales Alto-Alto y efecto borde en manzanas interiores',
                lectura: 'Muestra cómo los Hotspots Alto-Alto siguen el trazado de Metro y buses Red en Alameda, Brasil y Santa Ana, flanqueados por manzanas Bajo-Alto (verde) en el interior inmediato.'
              },
              {
                src: 'img/cartografias/cluster_lisa_vgi_movilidad_activa.jpg',
                titulo: 'Cluster LISA: Movilidad Activa y Ciclovías',
                subtitulo: 'Alineación espacial sobre ejes ciclistas del centro-poniente',
                lectura: 'Los clusters Alto-Alto calcan los corredores de ciclovías en Rosas, Compañía, Av. Brasil y Alameda, contrastando con extensos Coldspots azules en el sector suroriente.'
              },
              {
                src: 'img/cartografias/cluster_lisa_vgi_accesibilidad.jpg',
                titulo: 'Cluster LISA: Accesibilidad Universal',
                subtitulo: 'Concentración de rebajes peatonales y vacíos periféricos',
                lectura: 'Confirma que la infraestructura peatonal inclusiva se agrupa significativamente en el eje Alameda y el centro de Barrio Brasil, diluyéndose hacia el norte de San Pablo.'
              }
            ]
          },
          {
            titulo: '4. Islas ecológicas y clústeres patrimoniales frente a los desiertos verdes periféricos',
            parrafos: [
              'Las cuatro cartografías restantes —Biodiversidad, Espacio Público, Coberturas de Suelo y Patrimonio— muestran los patrones más focalizados de toda la serie LISA. Tanto en Biodiversidad (cluster_lisa_vgi_biodiversidad) como en Espacio Público (cluster_lisa_vgi_espacio_publico) y Coberturas de Suelo (cluster_lisa_vgi_coberturas_de_suelo), los clusters Alto-Alto se restringen a parches muy acotados en torno a Plaza Brasil, el eje arbolado de Av. Brasil, Parque Almagro y Barrio Ejército, rodeados por anillos de manzanas Alto-Bajo (cian) y Bajo-Alto (verde) que evidencian una transición brusca entre las plazas arboladas y las manzanas densamente pavimentadas.',
              'Finalmente, la cartografía LISA de Patrimonio (cluster_lisa_vgi_patrimonio) sintetiza el valor histórico del sector poniente: las manzanas Alto-Alto se concentran de forma exclusiva en el corazón de Barrio Brasil (eje Huérfanos, Compañía, Basílica del Salvador y casonas UAH) y su articulación con Santa Ana y Ejército, confirmando estadísticamente que este cuadrante constituye el núcleo patrimonial más denso y continuo de la comuna.'
            ],
            cartografias: [
              {
                src: 'img/cartografias/cluster_lisa_vgi_biodiversidad.jpg',
                titulo: 'Cluster LISA: Biodiversidad Urbana y Arbolado',
                subtitulo: 'Micro-clusters ecológicos en Plaza Brasil, Parque Almagro y Ejército',
                lectura: 'Identifica un Hotspot Alto-Alto muy concentrado alrededor de Plaza Brasil y Av. Brasil, rodeado de anomalías cian y verdes que reflejan el cambio abrupto hacia calles sin arbolado.'
              },
              {
                src: 'img/cartografias/cluster_lisa_vgi_espacio_publico.jpg',
                titulo: 'Cluster LISA: Espacio Público y Plazas',
                subtitulo: 'Polarización en torno a grandes plazas barriales',
                lectura: 'Demuestra el carácter insular del espacio público recreativo: solo las manzanas colindantes a Plaza Brasil, Plaza Yungay y parques pericentrales logran conformar clusters Alto-Alto.'
              },
              {
                src: 'img/cartografias/cluster_lisa_vgi_coberturas_de_suelo.jpg',
                titulo: 'Cluster LISA: Coberturas de Suelo y Vegetación',
                subtitulo: 'Agrupamientos de superficie vegetal y paños institucionales',
                lectura: 'Resalta la continuidad de coberturas verdes en el cuadrante central-sur de Barrio Brasil y en el eje Parque Almagro - Santa Ana, frente a Coldspots en los bordes comunales.'
              },
              {
                src: 'img/cartografias/cluster_lisa_vgi_patrimonio.jpg',
                titulo: 'Cluster LISA: Patrimonio Histórico y Cultural',
                subtitulo: 'Concentración monumental e inmuebles de conservación histórica',
                lectura: 'Dibuja un cluster Alto-Alto nítido sobre el eje patrimonial Huérfanos - Compañía - Cienfuegos en Barrio Brasil, validando los perímetros de Zona Típica y Conservación Histórica.'
              }
            ]
          }
        ],
        tablaIndicadores: [
          { variable: 'Manzanas en Cluster Alto-Alto (Hotspot)', valor: '140 manzanas (8,2%)', referencial: 'Barrio Brasil concentra 63 mz (45%)', fuente: 'LISA Total VGI (1.711 mz)' },
          { variable: 'Manzanas en Cluster Bajo-Bajo (Coldspot)', valor: '615 manzanas (35,9%)', referencial: 'Sierra Bella (90) y Bogotá (87)', fuente: 'LISA Total VGI (1.711 mz)' },
          { variable: 'Manzanas No Significativas (p > 0,05)', valor: '956 manzanas (55,9%)', referencial: 'Tejido intermedio comunal', fuente: 'LISA Total VGI (1.711 mz)' },
          { variable: 'Principales Focos de Outliers (HL / LH)', valor: 'Bordes Alameda y San Pablo', referencial: 'Fronteras de transición espacial', fuente: 'Cartografías LISA por Categoría' }
        ],
        conclusion: 'La estadística local LISA comprueba que las brechas urbanas en Santiago no son aleatorias: existe una frontera espacial nítida que separa al pericentro histórico-universitario (cluster Alto-Alto en Brasil, Santa Ana, Yungay, Parque Almagro, Ejército y Barrio Universitario) de un extenso arco periférico Bajo-Bajo en el sur, oriente y norponiente de la comuna (Sierra Bella, Bogotá, Matta Sur, Diez de Julio, Matta Norte y Balmaceda), mientras que al interior del propio Barrio Brasil se evidencia una marcada transición hacia su borde norte.',
        analisisPorActor: [
          { id: 'institucion', icono: '🏛️', nombre: 'Institución / Autoridad Pública', subtitulo: 'SEREMI MINVU · SECPLA · INE · Subdere', utilidad: 'Permite dirigir programas de regeneración urbana hacia los 615 polígonos Bajo-Bajo (especialmente en Sierra Bella, Bogotá, Matta Sur y Diez de Julio).' },
          { id: 'comunidad', icono: '🏘️', nombre: 'Comunidad / Vecinal', subtitulo: 'Unidades Vecinales · Agrupaciones Sociales', utilidad: 'Visibiliza la brecha interna de Barrio Brasil al norte de calle Rosas/San Pablo (cluster Bajo-Bajo) para exigir equidad en arbolado, luminarias y cruces seguros.' },
          { id: 'voluntario', icono: '🗺️', nombre: 'Mapeador / Voluntario OSM', subtitulo: 'Comunidades Geoinformáticas', utilidad: 'Orienta la verificación en terreno sobre las manzanas Bajo-Alto (verde) y Alto-Bajo (cian) para confirmar cambios de uso de suelo o sub-registro cartográfico.' },
          { id: 'ong', icono: '🔬', nombre: 'Investigadores / Academia', subtitulo: 'Centros de Estudios Urbanos · Laboratorios Territoriales', utilidad: 'Aporta evidencia cuantitativa desagregada por manzana sobre cómo se superponen los clusters de patrimonio, educación superior y servicios en el centro histórico.' }
        ],
        apartadoBibliografico: {
          fuentesDatos: [
            { codigo: 'cluster_lisa_vgi', nombre: 'Colección de 11 Cartografías de Clusters LISA por Categoría VGI', institucion: 'Atlas de Información Geográfica Voluntaria', crs: 'EPSG:32719', tipo: 'Polígonos / Cartografía' },
            { codigo: 'sintesis_manzanas_stgo', nombre: 'Matriz Zonal Censal y VGI de Santiago (1.711 Manzanas)', institucion: 'INE / SECPLA', crs: 'EPSG:32719', tipo: 'Vectorial GeoPackage' },
            { codigo: 'barrios_stgo_27', nombre: 'Delimitación Oficial de los 27 Barrios de Santiago', institucion: 'Ilustre Municipalidad de Santiago', crs: 'EPSG:32719', tipo: 'Polígonos' }
          ],
          referenciasAcademicas: [
            { cita: 'Anselin, L. (1995). Local Indicators of Spatial Association—LISA. Geographical Analysis, 27(2), 93–115.', concepto: 'Tipología de cuadrantes espaciales (Alto-Alto, Bajo-Bajo, Alto-Bajo y Bajo-Alto) aplicada a las manzanas comunales.' },
            { cita: 'Tobler, W. R. (1970). A computer movie simulating urban growth in the Detroit region. Economic Geography, 46, 234–240.', concepto: 'Primera ley de la geografía y dependencia espacial entre unidades vecinas.' },
            { cita: 'Rey, S. J., Anselin, L., & Kang, W. (2020). Geographic Data Science with Python. Chapman and Hall/CRC.', concepto: 'Interpretación estadística de clusters espaciales y fronteras de transición urbana.' }
          ]
        }
      }
    },

    // -----------------------------------------------------------------------
    // STORYBOARD 3: RESULTADOS SOCIODEMOGRÁFICOS, HABITABILIDAD Y MORFOLOGÍA (29 MAPAS)
    // -----------------------------------------------------------------------
    {
      id: 'storyboard-demografia-habitabilidad-sociourbana',
      dimensionId: 'sociourbana',
      dimensionNombre: 'Resultados Territoriales · Demografía, Vivienda, PRC & Morfología Predial',
      titulo: 'Estructura Sociodemográfica, Habitabilidad y Morfología Urbana en Santiago: Resultados del Censo 2024, RSH y Dinámica Edificatoria',
      bajada: 'Qué revelan las 34 cartografías sociodemográficas, habitacionales y de morfología predial de la comuna: dónde se concentran los 432.081 habitantes, la hegemonía del departamento (92,7%) y del arriendo (72,1%), las alturas autorizadas de edificación, el COS medio (0,47) en conjuntos recepcionados (CRF), la persistencia de cités en el sur y la conservación en Barrio Brasil y Yungay.',
      imagen: 'img/storyboards/portada_analisis_sociourbano.svg',
      imagenDestacada: 'img/storyboards/portada_analisis_sociourbano.svg',
      piePortada: 'Ilustración de los contrastes morfológicos y demográficos de Santiago: torres hiperdensas de arriendo frente a cités, casonas patrimoniales y barrios históricos.',
      tags: ['Resultados Censo 2024', '72,1% Arriendo', '92,7% Departamentos', 'Morfología Predial OGUC', 'Permisos y CRF', '34 Cartografías'],
      capasRelevantes: ['censo2024_manzanas', 'catastro_predial_sii', 'minvu_patrimonio', 'minvu_ipt_prc_santiago', 'ine_permisos_edificacion_santiago', 'ine_crf_conjuntos_santiago', 'censo_manzanas_metricas_edificacion', 'bbdd_19', 'bbdd_64', 'bbdd_68', 'bbdd_74'],
      contenido: {
        introduccion: `Los resultados consolidados de las 1.711 manzanas censales y los 27 barrios oficiales de la Comuna de Santiago registran una población de 432.081 habitantes (219.003 hombres y 213.078 mujeres) distribuidos en 203.830 hogares y 211.435 viviendas particulares ocupadas. El cruce de las 34 cartografías demuestra una profunda fractura socio-morfológica entre tres realidades territoriales: 1) un corredor hiperdensificado de torres en altura —encabezado por Santa Isabel (con 52.658 hab. y 650,5 hab/ha), Santa Ana (con 26.343 hab. y 618,0 hab/ha) y Parque Almagro (con 46.948 hab. y 442,3 hab/ha)— dominado por departamentos (92,7% comunal) y hogares unipersonales (40,8%); 2) barrios patrimoniales de escala media como Barrio Brasil, Yungay, Ejército y Barrio Universitario, donde el Plan Regulador Comunal (Zona B de Conservación Histórica) ha preservado la morfología de casonas y cités; y 3) sectores pericentrales del sur y poniente —como Franklin, Matta Sur, San Vicente, Bogotá y Sierra Bella— donde se concentran el arriendo informal sin contrato, el hacinamiento habitacional (hasta 17,5%) y la población en el tramo de mayor vulnerabilidad socioeconómica (0-40% RSH).`,
        datosClave: [
          { valor: '432.081', label: 'Habitantes en Manzanas', sub: '50,7% hombres (219.003) · 49,3% mujeres (213.078)' },
          { valor: '72,1%', label: 'Hogares en Arriendo', sub: '147.044 hogares (62,6% con contrato · 9,5% sin contrato)' },
          { valor: '92,7%', label: 'Viviendas Departamento', sub: '196.060 deptos vs. 13,0% casas y 5,9% piezas/cités' },
          { valor: '34', label: 'Cartografías Oficiales', sub: 'Censo 2024 · RSH · PRC · Permisos DOM · CRF' }
        ],
        porcentajesClave: [
          { label: 'Predominio del Departamento en Edificio sobre el Parque Ocupado', valor: '92,7%', porcentaje: 92.7, contexto: '196.060 departamentos frente a 27.385 casas (concentradas en San Eugenio (75,3%) y San Vicente (74,5%)).' },
          { label: 'Hegemonía del Régimen de Tenencia en Arriendo (Formal + Informal)', valor: '72,1%', porcentaje: 72.1, contexto: 'Lideran Santa Elena (82,5%), Matta Sur (80,7%) y Franklin (80,7%), frente a 23,0% de vivienda propia.' },
          { label: 'Proporción de Hogares Unipersonales (1 Integrante) en la Comuna', valor: '40,8%', porcentaje: 40.8, contexto: 'Alcanza máximos en Parque O’Higgins (69,2%), Santa Lucía Forestal (58,4%) y San Borja (49,1%).' },
          { label: 'Participación de Población Inmigrante Internacional Residente', valor: '40,4%', porcentaje: 40.4, contexto: '174.413 residentes internacionales, con cimas en Meiggs (61,3%), Matta Sur (58,2%) y Franklin (57,8%).' }
        ],
        graficoComparativo: {
          titulo: 'Contrastes Territoriales entre Barrios Extremos de Santiago según Indicadores Censales',
          filas: [
            { label: 'Densidad Poblacional: Santa Isabel (650,5 hab/ha) vs. Club Hípico (28,0)', valor: '650,5 hab/ha', porcentaje: 100.0 },
            { label: 'Densidad Poblacional: Santa Ana (618,0 hab/ha) vs. P. Almagro (442,3)', valor: '618,0 hab/ha', porcentaje: 95.0 },
            { label: 'Tenencia en Arriendo Total: Santa Elena (82,5%) y Franklin (80,7%)', valor: '82,5% máx', porcentaje: 82.5 },
            { label: 'Viviendas Tipo Casa Tradicional: San Eugenio (75,3%) y San Vicente (74,5%)', valor: '75,3% máx', porcentaje: 75.3 },
            { label: 'Hogares Unipersonales: Santa Lucía Forestal (58,4%) y San Borja (49,1%)', valor: '58,4% máx', porcentaje: 58.4 },
            { label: 'Población Migrante: Meiggs (61,3%), Matta Sur (58,2%) y Franklin (57,8%)', valor: '61,3% máx', porcentaje: 61.3 },
            { label: 'Arriendo sin Contrato: San Vicente (31,7%), Bogotá (23,5%) y Yungay (20,8%)', valor: '31,7% máx', porcentaje: 42.0 },
            { label: 'Viviendas en Pieza / Cité: San Vicente (25,6%), Yungay (22,0%) y Bogotá (21,7%)', valor: '25,6% máx', porcentaje: 35.0 }
          ]
        },
        diagramaSVG: () => `
          <svg viewBox="0 0 680 230" width="680" height="230" class="svg-diagrama-canvas" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <rect width="680" height="230" fill="#0b1329" rx="8"/>
            <text x="24" y="26" fill="#38bdf8" font-size="11.5" font-weight="bold">SÍNTESIS DE RESULTADOS: TRES REGÍMENES SOCIO-HABITACIONALES EN SANTIAGO (CENSO 2024)</text>
            <!-- Régimen 1 -->
            <rect x="20" y="42" width="205" height="170" rx="8" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.6"/>
            <text x="32" y="64" fill="#a5b4fc" font-size="11" font-weight="bold">1. EJE HIPERDENSO VERTICAL</text>
            <text x="32" y="80" fill="#94a3b8" font-size="8.5">Santa Isabel · Santa Ana · Parque Almagro</text>
            <text x="32" y="102" fill="#ffffff" font-size="15" font-weight="900">442 – 650 hab/ha</text>
            <text x="32" y="122" fill="#cbd5e1" font-size="9">· &gt;95% departamentos en torre</text>
            <text x="32" y="138" fill="#cbd5e1" font-size="9">· 75%–82% tenencia en arriendo</text>
            <text x="32" y="154" fill="#cbd5e1" font-size="9">· 45%–58% hogares unipersonales</text>
            <text x="32" y="170" fill="#cbd5e1" font-size="9">· 98,5% acceso a internet fijo/móvil</text>
            <text x="32" y="194" fill="#818cf8" font-size="8.5" font-weight="bold">Zonas PRC A y D (Alta constructibilidad)</text>
            <!-- Régimen 2 -->
            <rect x="237" y="42" width="205" height="170" rx="8" fill="#064e3b" fill-opacity="0.45" stroke="#10b981" stroke-width="1.6"/>
            <text x="249" y="64" fill="#6ee7b7" font-size="11" font-weight="bold">2. BARRIOS PATRIMONIALES</text>
            <text x="249" y="80" fill="#94a3b8" font-size="8.5">Barrio Brasil · Yungay · Ejército</text>
            <text x="249" y="102" fill="#ffffff" font-size="15" font-weight="900">180 – 290 hab/ha</text>
            <text x="249" y="122" fill="#cbd5e1" font-size="9">· Mixtura de casonas, cités y deptos</text>
            <text x="249" y="138" fill="#cbd5e1" font-size="9">· 22,0% vivienda tipo pieza/cité (Yungay)</text>
            <text x="249" y="154" fill="#cbd5e1" font-size="9">· Mayor tenencia propia que el centro</text>
            <text x="249" y="170" fill="#cbd5e1" font-size="9">· Envejecimiento en manzanas interiores</text>
            <text x="249" y="194" fill="#34d399" font-size="8.5" font-weight="bold">Zona PRC B (Conservación Histórica)</text>
            <!-- Régimen 3 -->
            <rect x="454" y="42" width="206" height="170" rx="8" fill="#7c2d12" fill-opacity="0.45" stroke="#f97316" stroke-width="1.6"/>
            <text x="466" y="64" fill="#fdba74" font-size="11" font-weight="bold">3. PERICENTRO SUR Y PONIENTE</text>
            <text x="466" y="80" fill="#94a3b8" font-size="8.5">Franklin · San Vicente · Bogotá</text>
            <text x="466" y="102" fill="#ffffff" font-size="15" font-weight="900">17,0% – 17,5% Hacinam.</text>
            <text x="466" y="122" fill="#cbd5e1" font-size="9">· 20,8%–31,7% arriendo sin contrato</text>
            <text x="466" y="138" fill="#cbd5e1" font-size="9">· 20,0%–24,3% déficit cuantitativo</text>
            <text x="466" y="154" fill="#cbd5e1" font-size="9">· 57,8%–61,3% población inmigrante</text>
            <text x="466" y="170" fill="#cbd5e1" font-size="9">· Concentración tramo 0–40% RSH</text>
            <text x="466" y="194" fill="#fb923c" font-size="8.5" font-weight="bold">Zonas PRC E, G y H (Mixto / Productivo)</text>
          </svg>
        `,
        seccionesAnaliticas: [
          {
            titulo: '1. Hiperdensificación vertical y distribución por sexo: el corredor oriente-central frente a la escala humana de Barrio Brasil',
            parrafos: [
              'Las cartografías de densidad poblacional del Censo 2024 revelan una concentración demográfica extraordinariamente asimétrica entre los 27 barrios de la comuna. De los 432.081 habitantes registrados en las manzanas comunales, solo tres barrios —Santa Isabel (con 52.658 hab.), Parque Almagro (con 46.948 hab.) y Yungay (con 34.220 hab.)— concentran el 31,0% de toda la población de Santiago, seguidos por Matta Norte (con 27.904 hab.), Santa Ana (con 26.343 hab.) y Centro Histórico (con 22.711 hab.). En términos de densidad neta, Santa Isabel alcanza 650,5 hab/ha y Santa Ana 618,0 hab/ha, formando una muralla azul oscura de manzanas en el cuartil superior (31,31% a 84,48% del máximo comunal) a lo largo de los ejes Santa Isabel, Lira, Carmen, San Martín y San Pablo oriente.',
              'En marcado contraste, el recuadro de Barrio Brasil (con 13.783 hab. en 63 manzanas) en las láminas de densidad total, densidad de hombres (media comunal 50,7%, máximo de 5.211,7 hab/ha) y densidad de mujeres (media comunal 49,3%, máximo de 5.008,2 hab/ha) muestra un predominio de tonos amarillos y verdes (cuartiles bajos y medios), con densidades concentradas únicamente en las manzanas de borde sobre Av. San Pablo, Rosas y Alameda. Asimismo, el Índice de Masculinidad (media comunal de 102,8 hombres por cada 100 mujeres) exhibe una mayor presencia relativa masculina en enclaves comerciales e industriales del poniente y sur (Meiggs, San Vicente, Barrio Judicial y Franklin), mientras que los barrios residenciales consolidados del oriente y las manzanas interiores de Barrio Brasil mantienen una proporción equilibrada o mayoritariamente femenina.'
            ],
            graficoInline: {
              titulo: 'Barrios con Mayor Población Total y Densidad Neta en la Comuna de Santiago (Censo 2024)',
              filas: [
                { label: 'Barrio Santa Isabel (52.658 hab · 650,5 hab/ha)', valor: '650,5 hab/ha', porcentaje: 100 },
                { label: 'Barrio Santa Ana (26.343 hab · 618,0 hab/ha)', valor: '618,0 hab/ha', porcentaje: 95 },
                { label: 'Barrio Parque Almagro (46.948 hab · 442,3 hab/ha)', valor: '442,3 hab/ha', porcentaje: 68 },
                { label: 'Barrio Yungay (34.220 hab · 241,2 hab/ha)', valor: '241,2 hab/ha', porcentaje: 37 },
                { label: 'Barrio Club Hípico / San Eugenio (Baja densidad sur)', valor: '28,0 hab/ha', porcentaje: 6 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/densidad_pob_km2_percent_of_total.jpg',
                titulo: 'Densidad de Población Censo 2024 (% del Total por km²)',
                subtitulo: 'Cuartiles: 0%–5,06% · 5,07%–14,7% · 14,87%–30,64% · 31,31%–84,48%',
                lectura: 'Evidencia cómo la hiperdensidad (azul oscuro) se concentra en el corredor Santa Ana - Parque Almagro - Santa Isabel, mientras Barrio Brasil conserva densidades bajas y medias gracias a su protección patrimonial.'
              },
              {
                src: 'img/cartografias/densidad_de_hombres_ha.jpg',
                titulo: 'Densidad de Hombres por Hectárea (Censo 2024)',
                subtitulo: 'Rango: 0 a 5.211,7 hombres/ha · Total comunal: 219.003 hombres',
                lectura: 'Muestra focos de máxima concentración masculina en las torres del centro-oriente y en manzanas específicas del borde norte y poniente de Barrio Brasil.'
              },
              {
                src: 'img/cartografias/densidad_de_mujeres_ha.jpg',
                titulo: 'Densidad de Mujeres por Hectárea (Censo 2024)',
                subtitulo: 'Rango: 0 a 5.008,2 mujeres/ha · Total comunal: 213.078 mujeres',
                lectura: 'Reproduce el eje de densificación vertical en Santa Isabel, Parque Almagro y Santa Ana, con una distribución homogénea en las manzanas residenciales de Barrio Brasil.'
              },
              {
                src: 'img/cartografias/indice_de_masculinidad_log.jpg',
                titulo: 'Índice de Masculinidad Logarítmico (Censo 2024)',
                subtitulo: 'Razón Hombres / Mujeres · Media comunal: 102,8',
                lectura: 'Identifica manzanas con predominio masculino en sectores de piezas, cités y actividad comercial (Meiggs, San Vicente, borde San Pablo), frente a mayor presencia femenina en sectores de departamentos familiares y de adultos mayores.'
              }
            ]
          },
          {
            titulo: '2. Transición demográfica: envejecimiento en barrios históricos, hogares unipersonales e inserción migrante',
            parrafos: [
              'El segundo grupo de cartografías desvela cómo coexisten dos transiciones demográficas opuestas en el mismo territorio. Por un lado, los adultos mayores de 60 años y más suman 51.663 personas (12,0% comunal, prácticamente igualando a los 51.336 niños de 0 a 13 años, lo que arroja un Índice de Envejecimiento comunal de 100,6) y están presentes en el 10,0% de los hogares (20.415 hogares). Sin embargo, las cartografías de Porcentaje de Adultos Mayores, Hogares con Mayores de 60 Años e Índice de Envejecimiento muestran que la población mayor ha quedado desplazada de las torres hiperdensas del centro, concentrándose en los barrios tradicionales de baja altura del surponiente y sur —San Eugenio (24,6%), San Vicente (20,3%), Bogotá (18,8%), Club Hípico (18,6%), Sierra Bella (16,8%) y Huemul (16,7%)— así como en las manzanas interiores de casonas de Barrio Brasil (16,8%), Panamá (16,7%), Ejército (13,2%) y Barrio Universitario (13,0%).',
              'En sentido inverso, la cartografía de Población Migrante (174.413 personas, equivalentes al 40,4% de la población comunal) muestra una intensa concentración en el pericentro comercial y pericentro sur: Meiggs alcanza un 61,3% de residentes migrantes, seguido por Matta Sur (58,2%), Franklin (57,8%), Santa Elena (57,4%), Matta Norte (52,4%), Diez de Julio (47,7%), Centro Histórico (47,7%) y Santa Ana (46,4%), además del eje norte de Yungay (40,0%) y Barrio Brasil (27,4% promedio barrial, concentrado sobre San Pablo y Mapocho), reduciendo en esas mismas manzanas el Índice de Dependencia Demográfica por la llegada de población en edad laboral activa (20 a 44 años). Paralelamente, los Hogares Unipersonales representan ya el 40,8% de todos los hogares de Santiago (83.149 hogares), alcanzando sus máximos en Parque O’Higgins (69,2%), Santa Lucía Forestal (58,4%), San Borja (49,1%), Ejército (46,4%), Santa Isabel (46,2%), Barrio Brasil (45,2%) y Centro Histórico (44,3%).'
            ],
            graficoInline: {
              titulo: 'Indicadores de Estructura Etaria, Migración y Hogares Unipersonales en Barrios Clave',
              filas: [
                { label: 'Hogares Unipersonales: Santa Lucía Forestal (58,4%) y San Borja (49,1%)', valor: '58,4% máx', porcentaje: 95 },
                { label: 'Población Migrante: Meiggs (61,3%), Matta Sur (58,2%) y Franklin (57,8%)', valor: '61,3% máx', porcentaje: 100 },
                { label: 'Población Migrante Media Comunal (174.413 personas)', valor: '40,4% comunal', porcentaje: 66 },
                { label: 'Adultos Mayores (60+ años): San Eugenio (24,6%) y San Vicente (20,3%)', valor: '24,6% máx', porcentaje: 40 },
                { label: 'Adultos Mayores Media Comunal (51.663 personas · Índice Envej. 100,6)', valor: '12,0% comunal', porcentaje: 20 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/porcentaje_adultos_mayores.jpg',
                titulo: 'Porcentaje de Adultos Mayores (60 Años y Más)',
                subtitulo: 'Cuartiles: 0%–10,1% · 10,11%–16,28% · 16,29%–26,67% · 26,68%–100%',
                lectura: 'Muestra que las manzanas con más de 26,7% de personas mayores se ubican en barrios residenciales tradicionales (San Eugenio, Huemul, Matta Sur e interior de Barrio Brasil), lejos de los ejes de renovación inmobiliaria.'
              },
              {
                src: 'img/cartografias/hog_mayores_60_anos_pct.jpg',
                titulo: 'Hogares Integrados por Adultos Mayores de 60 Años (%)',
                subtitulo: 'Total comunal: 20.415 hogares (10,0% del total de hogares)',
                lectura: 'Destaca una alta presencia de hogares envejecidos en las manzanas centrales de Barrio Brasil (entre Compañía y Huérfanos) y en el sector surponiente comunal.'
              },
              {
                src: 'img/cartografias/indice_de_envejecimiento_log.jpg',
                titulo: 'Índice de Envejecimiento Logarítmico (Censo 2024)',
                subtitulo: 'Relación Adultos Mayores (60+) sobre Población Infantil · Media: 100,6',
                lectura: 'Revela un envejecimiento agudo en el Centro Histórico, Barrio Universitario, Ejército y manzanas patrimoniales de Barrio Brasil, frente a un rejuvenecimiento relativo en el eje norte y suroriente.'
              },
              {
                src: 'img/cartografias/indice_dependencia_demografica.jpg',
                titulo: 'Índice de Dependencia Demográfica (Censo 2024)',
                subtitulo: 'Relación de población pasiva (0–14 y 65+) sobre población activa (15–64)',
                lectura: 'Exhibe valores muy bajos en el corredor de torres centrales (predominio de jóvenes activos de 20 a 39 años) y valores altos en barrios tradicionales con mayor presencia de niñez y vejez.'
              },
              {
                src: 'img/cartografias/porcentaje_migrantes.jpg',
                titulo: 'Porcentaje de Población Migrante Internacional (Censo 2024)',
                subtitulo: 'Total comunal: 174.413 personas (40,4% del total comunal)',
                lectura: 'Concentra sus valores más elevados (sobre 50%) en Meiggs, Franklin, Matta Sur, Santa Ana y el tercio norte de Barrio Brasil y Yungay.'
              },
              {
                src: 'img/cartografias/pct_hogares_unipersonales.jpg',
                titulo: 'Porcentaje de Hogares Unipersonales (Censo 2024)',
                subtitulo: 'Total comunal: 83.149 hogares de 1 persona (40,8% comunal)',
                lectura: 'Predomina de forma masiva (tramo 51,9%–100%) en el Centro Histórico, Santa Lucía Forestal, San Borja y el entorno universitario del sur de Barrio Brasil.'
              }
            ]
          },
          {
            titulo: '3. Ordenamiento normativo (PRC) y tipologías residenciales: del edificio en altura a la resistencia de la casa y el cité',
            parrafos: [
              'La serie de cartografías normativas y morfológicas explica el origen físico de los patrones demográficos anteriores. El mapa del Plan Regulador Comunal (PRC_stgo_nombre_zonas), junto a las cartografías de las 7 Macro-Agrupaciones Barriales (AV1 a AV10) y de los 27 barrios oficiales según la delimitación comunal de Santiago, muestran cómo la Zona B de Conservación Histórica Patrimonial protege el grueso de Barrio Brasil, Yungay, Panamá, Ejército, Barrio Universitario y Matta Sur, mientras que la Zona A (Residencial Mixto y Ejes Estructurantes) y las Zonas D y E habilitaron los corredores de densificación intensiva en Santa Ana, Santa Isabel, Parque Almagro y Matta Norte. En el mapa de agrupaciones y unidades territoriales se distingue con exactitud la organización oficial de la comuna: AV1 (Santa Lucía Forestal y Centro Histórico), AV2 (Santa Ana, Panamá y Brasil), AV3 (Balmaceda y Yungay), AV7 (San Borja, Santa Isabel y Diez de Julio), AV8 (Parque Almagro, Matta Norte y Ejército), AV9 (Barrio Universitario, Club Hípico, San Eugenio, Meiggs y San Vicente) y AV10 en el arco sur (Parque O’Higgins, Santa Elena, Sierra Bella, Matta Sur, Bogotá, Franklin, Viel, Huemul y Barrio Judicial).',
              'El resultado directo en el parque habitacional es contundente: el 92,7% de las viviendas ocupadas de Santiago corresponde a Departamentos en Edificio (196.060 unidades), alcanzando prácticamente el 100% en las manzanas de Centro Histórico, Santa Lucía Forestal, Santa Isabel, San Borja y Parque Almagro. En cambio, la Vivienda Tipo Casa (27.385 unidades, 13,0% comunal) sobrevive en los barrios del surponiente y sur —San Eugenio (75,3%), San Vicente (74,5%), Bogotá (51,9%), Sierra Bella (46,2%) y Huemul (40,3%)— y en el corazón patrimonial de Barrio Brasil, Panamá, Yungay y Barrio Universitario, donde numerosas manzanas mantienen entre 36,9% y 100% de casas y casonas. De igual modo, la cartografía de Viviendas en Cité o Pieza (12.499 unidades, 5,9% comunal) revela que esta tipología histórica e inquilinato interior se concentra en San Vicente (25,6%), Yungay (22,0%), Bogotá (21,7%), Matta Sur (15,9%), Sierra Bella (15,5%), Barrio Brasil (14,7%, con 1.049 unidades) y Panamá (12,5%).'
            ],
            cartografias: [
              {
                src: 'img/cartografias/PRC_stgo_nombre_zonas.jpg',
                titulo: 'Zonificación del Plan Regulador Comunal (PRC Santiago)',
                subtitulo: 'Zonas A, B (Conservación Histórica), D, E, F (Áreas Verdes), G y H',
                lectura: 'Muestra que Barrio Brasil se encuentra mayoritariamente resguardado bajo la Zona B de Conservación Histórica Patrimonial (marrón), rodeado en sus bordes por la Zona A de ejes estructurantes.'
              },
              {
                src: 'img/cartografias/barrio_stgo_agrupacion.jpg',
                titulo: 'Macro-Agrupaciones Territoriales de Barrios (AV1 a AV10)',
                subtitulo: '7 agrupaciones barriales oficiales: AV1, AV2, AV3, AV7, AV8, AV9 y AV10',
                lectura: 'Estructura la comuna en 7 macro-agrupaciones: AV1 (Centro Histórico y Santa Lucía Forestal), AV2 (Santa Ana, Panamá y Brasil), AV3 (Balmaceda y Yungay), AV7 (San Borja, Santa Isabel y Diez de Julio), AV8 (Parque Almagro, Matta Norte y Ejército), AV9 (Barrio Universitario, Club Hípico, San Eugenio, Meiggs y San Vicente) y AV10 en el sur comunal (Parque O’Higgins, Santa Elena, Sierra Bella, Matta Sur, Bogotá, Franklin, Viel, Huemul y Barrio Judicial).'
              },
              {
                src: 'img/cartografias/barrio_stgo_unidad_territorial.jpg',
                titulo: 'Límites y Nombres Oficiales de los 27 Barrios de Santiago',
                subtitulo: 'Catastro oficial MuniSTGO 2026: 27 Barrios Municipales codificados de 0 a 26',
                lectura: 'Identifica los 27 barrios oficiales de la comuna: Parque O’Higgins, Santa Lucía Forestal, Centro Histórico, Santa Ana, Panamá, Brasil, Balmaceda, Yungay, San Borja, Santa Isabel, Diez de Julio, Parque Almagro, Matta Norte, Ejército, Barrio Universitario, Club Hípico, San Eugenio, Meiggs, San Vicente, Santa Elena, Sierra Bella, Matta Sur, Bogotá, Franklin, Viel, Huemul y Barrio Judicial.'
              },
              {
                src: 'img/cartografias/pct_viviendas_tipo_depto.jpg',
                titulo: 'Viviendas Tipo Departamento en Edificio (%)',
                subtitulo: 'Total comunal: 196.060 departamentos (92,7% de las viviendas ocupadas)',
                lectura: 'Domina de forma absoluta el centro y oriente comunal, mientras en el interior de Barrio Brasil se observan manzanas amarillas y verdes con baja presencia de edificios en altura.'
              },
              {
                src: 'img/cartografias/pct_viviendas_tipo_casa.jpg',
                titulo: 'Viviendas Tipo Casa Unifamiliar / Casona (%)',
                subtitulo: 'Total comunal: 27.385 casas · Máximos en San Eugenio (75,3%) y San Vicente (74,5%)',
                lectura: 'Resalta el corazón de Barrio Brasil, Yungay, Panamá, Barrio Universitario, Huemul, Bogotá, Sierra Bella, San Vicente y San Eugenio como los últimos reductos de vivienda horizontal y casonas de fachada continua.'
              },
              {
                src: 'img/cartografias/pct_vivienda_tipo_cite.jpg',
                titulo: 'Viviendas en Cité Tradicional o Pieza (%)',
                subtitulo: 'Total comunal: 12.499 unidades (5,9%) · Líderes: San Vicente (25,6%) y Yungay (22,0%)',
                lectura: 'Localiza los enclaves de cités y pasajes interiores en Yungay, San Vicente, Bogotá, Franklin y en el cuadrante central de Barrio Brasil.'
              }
            ]
          },
          {
            titulo: '4. Dinámica de edificación, alturas autorizadas y morfología predial: métricas OGUC de ocupación de suelo y conjuntos habitacionales',
            parrafos: [
              'El análisis espacial de las alturas máximas autorizadas en los permisos de edificación (Altura_Pisos_Permisos) evidencia cómo la verticalización contemporánea de Santiago se ha canalizado de forma diferenciada según las zonas normativas del Plan Regulador Comunal. Los proyectos de gran escala y mayor altura en pisos (edificios entre 15 y más de 30 pisos) se focalizan marcadamente en las zonas de renovación de Santa Isabel, Santa Ana, San Borja y los bordes estructurantes de Parque Almagro y Matta Norte. Por el contrario, los barrios históricos protegidos, en particular Barrio Brasil, Yungay y Barrio Universitario, presentan alturas autorizadas predominantemente bajas o acotadas a la escala de fachada continua barrial (1 a 4 pisos), reflejando las restricciones de conservación patrimonial.',
              'A nivel predial, las cartografías de los conjuntos habitacionales concluidos con Certificado de Recepción Final (CRF) entre 2011 y 2025 revelan patrones morfológicos consistentes con la normativa urbana (OGUC Art. 1.1.2). El Coeficiente de Ocupación de Suelo (CRF_COS_Ratio, con una media de 0,47) y el Porcentaje de Suelo Libre (CRF_Suelo_Libre_Pct, con un promedio de 53,5%) demuestran que las obras en altura concluidas en la comuna ocupan en promedio menos de la mitad del terreno en su primer piso, reservando entre un 40% y 60% de suelo libre para antejardines, distanciamientos a medianeros y patios comunes. Complementariamente, la superficie edificada basal (CRF_Huella_Edificada_m2, media de 740,2 m²) y la relación fondo/frente (CRF_Ratio_Fondo_Frente, media de 1,86) evidencian la coexistencia entre macro-lotes regulares producto de fusiones prediales para edificación en altura y lotes alargados característicos de la subdivisión histórica tradicional.'
            ],
            graficoInline: {
              titulo: 'Métricas Morfológicas Promedio en Proyectos con Recepción Final (CRF 2011–2025)',
              filas: [
                { label: 'Suelo Libre Promedio en Predio (%SL)', valor: '53,5%', porcentaje: 53.5 },
                { label: 'Coeficiente de Ocupación de Suelo (COS)', valor: '0,47', porcentaje: 47.0 },
                { label: 'Relación Fondo / Frente (Elongación)', valor: '1,86', porcentaje: 37.0 },
                { label: 'Densidad Neta Real Promedio (viv/ha)', valor: '1.659,4 viv/ha', porcentaje: 85.0 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/Altura_Pisos_Permisos.jpg',
                titulo: 'Alturas Máximas en Pisos en Permisos de Edificación (2010–2025)',
                subtitulo: 'Permisos autorizados por la Dirección de Obras Municipales (DOM / INE) · Rangos de 1 a 32 pisos',
                lectura: 'Evidencia la concentración de torres en altura (15 a más de 30 pisos) en Santa Isabel, Santa Ana y San Borja, en contraste con las bajas alturas y contención patrimonial en Barrio Brasil y Yungay.'
              },
              {
                src: 'img/cartografias/CRF_COS_Ratio.jpg',
                titulo: 'Coeficiente de Ocupación de Suelo (COS) en Conjuntos con Recepción Final',
                subtitulo: 'Art. 1.1.2 OGUC · Proporción de suelo cubierta en primer piso (Media: 0,47)',
                lectura: 'Muestra que los conjuntos habitacionales recepcionados ocupan típicamente entre 40% y 60% del lote en primer piso, respetando las exigencias de distanciamientos y antejardines.'
              },
              {
                src: 'img/cartografias/CRF_Huella_Edificada_m2.jpg',
                titulo: 'Superficie Edificada en Planta Baja (m²) de Proyectos Recepcionados',
                subtitulo: 'Huella construida basal a nivel de terreno · Media comunal: 740,2 m²',
                lectura: 'Identifica la magnitud de la huella en planta de los proyectos habitacionales concluidos, concentrando las mayores áreas basales en grandes conjuntos residenciales de los sectores centro y suroriente.'
              },
              {
                src: 'img/cartografias/CRF_Suelo_Libre_Pct.jpg',
                titulo: 'Porcentaje de Patio y Suelo Libre (%) en Proyectos con Recepción Final',
                subtitulo: 'Art. 2.6.1 a 2.6.3 OGUC · Proporción no edificada del lote (Media: 53,5%)',
                lectura: 'Constata que los proyectos concluidos preservan en promedio más de la mitad del predio libre de edificación para iluminación natural, ventilación, circulaciones y patios comunes.'
              },
              {
                src: 'img/cartografias/CRF_Ratio_Fondo_Frente.jpg',
                titulo: 'Relación Fondo / Frente e Índice de Elongación Predial',
                subtitulo: 'Cociente entre profundidad y ancho del lote · Media: 1,86 (Rango: 1,01 a 6,92)',
                lectura: 'Distingue entre lotes cuadrangulares producto de fusiones para torres residenciales (ratios 1,0 a 1,8) y predios alargados propios de la parcelación histórica del pericentro.'
              }
            ]
          },
          {
            titulo: '5. Hegemonía del arriendo, subarriendo sin contrato, hacinamiento y brecha digital',
            parrafos: [
              'El régimen de tenencia de la vivienda constituye uno de los hallazgos más reveladores del diagnóstico: el 72,1% de los hogares de Santiago es arrendatario (147.044 hogares), frente a apenas un 23,0% de tenencia propia (11,3% pagada y 11,8% pagándose). Sin embargo, las cartografías permiten separar dos mercados de arriendo radicalmente distintos: el Arriendo con Contrato Formal (62,6% comunal) domina en las torres de renovación inmobiliaria de Santa Elena (82,5%), Parque Almagro y Santa Isabel, mientras que el Arriendo sin Contrato Escrito (9,5% comunal, 19.342 hogares) se dispara en los barrios de casonas subdivididas y cités como San Vicente (31,7%), Bogotá (23,5%), Yungay (20,8%), Franklin y el sector norte de Barrio Brasil.',
              'Esta precariedad contractual se superpone espacialmente con las cartografías de Hacinamiento (19.388 viviendas, 9,2% comunal) y Déficit Cuantitativo y de Materialidad (25.576 hogares, 12,5% comunal). Los niveles más críticos de hacinamiento se registran en Franklin (17,5%), San Vicente (17,2%) y Matta Sur (17,0%), así como en manzanas puntuales de inquilinato en Yungay y el borde norte de Barrio Brasil (donde el déficit cuantitativo alcanza el tramo de 31,5% a 100%). A su vez, aunque el Acceso a Internet promedia un 97,6% comunal (198.898 hogares), la cartografía detecta manzanas con rezago de conectividad (<60%) en enclaves de adultos mayores y cités precarizados.'
            ],
            graficoInline: {
              titulo: 'Radiografía de Tenencia, Informalidad Contractual y Precariedad Habitacional en Santiago',
              filas: [
                { label: 'Tenencia en Arriendo Total Comunal (147.044 hogares)', valor: '72,1%', porcentaje: 72.1 },
                { label: 'Arriendo con Contrato Formal (127.702 hogares)', valor: '62,6%', porcentaje: 62.6 },
                { label: 'Arriendo sin Contrato en Barrio San Vicente (Máximo comunal)', valor: '31,7%', porcentaje: 31.7 },
                { label: 'Tenencia Propia Total Comunal (46.976 hogares)', valor: '23,0%', porcentaje: 23.0 },
                { label: 'Hacinamiento en Barrios Franklin (17,5%) y San Vicente (17,2%)', valor: '17,5% máx', porcentaje: 26.0 },
                { label: 'Déficit Cuantitativo en San Vicente (24,3%) y Franklin (23,0%)', valor: '24,3% máx', porcentaje: 34.0 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/pct_tenencia_arrendada_total.jpg',
                titulo: 'Tenencia de Vivienda Arrendada Total (%)',
                subtitulo: 'Cuartiles: 0%–19,23% · 20%–50,84% · 51,02%–73,20% · 73,33%–100%',
                lectura: 'Muestra que gran parte de la comuna supera el 73% de hogares arrendatarios, mientras el corazón de Barrio Brasil conserva manzanas en el tramo intermedio (51%–73%).'
              },
              {
                src: 'img/cartografias/pct_tenencia_arrendada_contrato.jpg',
                titulo: 'Vivienda Arrendada con Contrato Formal (%)',
                subtitulo: 'Total comunal: 127.702 hogares (62,6% del total comunal)',
                lectura: 'Se concentra en los ejes de edificios de departamentos recientes (Santa Isabel, Parque Almagro, Santa Ana y bordes de Barrio Brasil).'
              },
              {
                src: 'img/cartografias/pct_tenencia_arrendada_sin_contrato.jpg',
                titulo: 'Vivienda Arrendada sin Contrato Escrito (%)',
                subtitulo: 'Total comunal: 19.342 hogares (9,5%) · Líderes: San Vicente (31,7%) y Yungay (20,8%)',
                lectura: 'Evidencia focos críticos de informalidad arrendataria y subarriendo en Yungay, San Vicente, Bogotá, Franklin y manzanas interiores del norte de Barrio Brasil.'
              },
              {
                src: 'img/cartografias/pct_tenencia_propia_total.jpg',
                titulo: 'Tenencia de Vivienda Propia Total (%)',
                subtitulo: 'Total comunal: 46.976 hogares (23,0%) · Líderes: Club Hípico (38,8%) y San Eugenio (38,2%)',
                lectura: 'Destaca una mayor permanencia de propietarios históricos en el surponiente (Club Hípico, San Eugenio) y en las manzanas centrales de casonas de Barrio Brasil.'
              },
              {
                src: 'img/cartografias/pct_viviendas_hacinadas.jpg',
                titulo: 'Porcentaje de Viviendas Hacinadas (Censo 2024)',
                subtitulo: 'Total comunal: 19.388 viviendas (9,2%) · Cima en Franklin (17,5%) y San Vicente (17,2%)',
                lectura: 'Muestra bolsones de hacinamiento en el pericentro poniente y sur, coincidiendo exactamente con las zonas de mayor arriendo sin contrato y tipología de pieza/cité.'
              },
              {
                src: 'img/cartografias/pct_deficit_cuantitativo_materialidad.jpg',
                titulo: 'Déficit Cuantitativo y de Materialidad Habitacional (%)',
                subtitulo: 'Total comunal: 25.576 hogares (12,5%) · Cima en San Vicente (24,3%) y Franklin (23,0%)',
                lectura: 'Identifica viviendas irrecuperables y hogares allegados en el sector sur y norponiente, incluyendo manzanas puntuales deterioradas dentro de Barrio Brasil.'
              },
              {
                src: 'img/cartografias/pct_acceso_a_internet_total.jpg',
                titulo: 'Acceso a Internet en la Vivienda (%)',
                subtitulo: 'Total comunal: 198.898 hogares conectados (97,6% de cobertura)',
                lectura: 'Aunque el estándar comunal es alto, visibiliza micro-brechas digitales en manzanas con alta proporción de adultos mayores solos o cités precarizados.'
              }
            ]
          },
          {
            titulo: '6. Estratificación socioeconómica (RSH 0–40%), empleo cotizante y demanda de cuidados por Unidad Vecinal',
            parrafos: [
              'El quinto bloque de este storyboard incorpora las 6 cartografías elaboradas a partir del Registro Social de Hogares (RSH - BIDAT 2026) sobre las 53 Unidades Vecinales (UV) de la comuna, donde se registran 325.449 personas inscritas en RSH. El Índice Global de Vulnerabilidad Socioterritorial (igvst_poblacion, con rangos de 388 a 22.879 puntos ponderados) y el mapa de Personas en el Tramo 0–40% de Menores Ingresos (n_personas_tramo_0_40_total, con rangos de 131 a 7.592 personas por UV) revelan que el mayor volumen de población vulnerable se concentra en la franja central-sur y suroriente (Unidades Vecinales correspondientes a Parque Almagro, Santa Isabel, Diez de Julio, Matta Norte, Matta Sur y Franklin, en azul oscuro con 4.344 a 7.592 personas por UV), mientras que Barrio Brasil se divide entre su sector norte hacia San Pablo y Mapocho (tramo medio-alto de 2.707 a 4.343 personas) y su sector sur hacia la Alameda (tramo medio-bajo de 1.391 a 2.706 personas).',
              'Al examinar la inserción laboral y previsional, el mapa de Total de Ocupados Cotizantes (hasta 6.663 trabajadores por UV) y el Porcentaje de Ocupados Cotizantes en el Tramo 0–40% RSH (entre 25% y 38% en las UV más vulnerables) muestran que en los barrios del poniente y sur una alta proporción de trabajadores formales percibe ingresos bajos que los mantienen dentro del 40% más vulnerable. Finalmente, las cartografías de Niños y Adultos Mayores Adscritos a FONASA en Tramo 0–40% (de 40 a 2.094 personas por UV) y de Personas con Dependencia Funcional o Postradas en Tramo 0–40% (de 4 a 158 personas severamente dependientes por UV) localizan la mayor carga de cuidados médicos y dependencia domiciliaria en el eje central-sur y norponiente (Yungay norte, Balmaceda y Matta Sur).'
            ],
            cartografias: [
              {
                src: 'img/cartografias/igvst_poblacion.jpg',
                titulo: 'Vulnerabilidad Socioterritorial: Índice Global IGVST (BIDAT 2026)',
                subtitulo: 'Cuartiles UV: 388–3.929 · 3.930–5.457 · 5.458–7.207 · 7.208–22.879',
                lectura: 'Muestra que las Unidades Vecinales del corredor central y suroriente concentran la mayor carga acumulada de vulnerabilidad, mientras Barrio Brasil se sitúa en los tramos intermedios.'
              },
              {
                src: 'img/cartografias/n_personas_tramo_0_40_total.jpg',
                titulo: 'N° de Personas en Tramo 0–40% de Mayor Vulnerabilidad RSH',
                subtitulo: 'Rangos por UV: 131–1.390 · 1.391–2.706 · 2.707–4.343 · 4.344–7.592 personas',
                lectura: 'Identifica el mayor volumen de residentes del tramo 0–40% en el eje central-oriente y norte de Barrio Brasil (2.707–4.343 personas), disminuyendo hacia la mitad sur del barrio.'
              },
              {
                src: 'img/cartografias/n_cotizantes_ocupados_total.jpg',
                titulo: 'Total de Personas Ocupadas Cotizando en RSH por Unidad Vecinal',
                subtitulo: 'Rangos por UV: 99–1.430 · 1.431–2.411 · 2.412–3.884 · 3.885–6.663 cotizantes',
                lectura: 'Refleja la alta masa laboral activa residente en las Unidades Vecinales densificadas del eje central y oriente de la comuna.'
              },
              {
                src: 'img/cartografias/n_cotizantes_ocupados_0_40_pct_total.jpg',
                titulo: 'Porcentaje de Ocupados Cotizantes Pertenecientes al Tramo 0–40% RSH',
                subtitulo: 'Proporción de trabajadores formales en situación de vulnerabilidad socioeconómica',
                lectura: 'Revela que en las Unidades Vecinales del poniente (Yungay, norte de Brasil) y del sur (Franklin, Matta Sur) persiste una alta tasa de precariedad salarial aun entre trabajadores con cotizaciones.'
              },
              {
                src: 'img/cartografias/n_ninos_adultos_mayores_adscritos_fonasa_0_40_total.jpg',
                titulo: 'Niños y Adultos Mayores Adscritos a FONASA en Tramo 0–40% RSH',
                subtitulo: 'Demanda prioritaria sobre la red de atención primaria de salud (CESFAM)',
                lectura: 'Concentra los mayores contingentes de población infantil y mayor dependiente del sistema público de salud en la franja central, norponiente y suroriente de Santiago.'
              },
              {
                src: 'img/cartografias/n_dependencia_postrados_0_40_total.jpg',
                titulo: 'Personas en Situación de Dependencia y Postrados (Tramo 0–40% RSH)',
                subtitulo: 'Hogares vulnerables con demanda crítica de cuidados domiciliarios',
                lectura: 'Visibiliza los territorios que requieren apoyo prioritario del Sistema Nacional de Cuidados, destacando el sector norte de Barrio Brasil, Yungay y el eje central-sur.'
              }
            ]
          }
        ],
        tablaIndicadores: [
          { variable: 'Población Total en Manzanas Censales', valor: '432.081 habitantes', referencial: 'Sta. Isabel (52.658) · P. Almagro (46.948)', fuente: 'Censo 2024 INE' },
          { variable: 'Régimen de Tenencia en Arriendo', valor: '72,1% (147.044 hogares)', referencial: '62,6% con contrato · 9,5% sin contrato', fuente: 'Censo 2024 INE' },
          { variable: 'Tipología Constructiva Predominante', valor: '92,7% Departamentos', referencial: '13,0% Casas · 5,9% Piezas/Cités', fuente: 'Censo 2024 / Catastro SII' },
          { variable: 'Hacinamiento y Déficit Cuantitativo', valor: '9,2% Hacinam. · 12,5% Déficit', referencial: 'Máximos en Franklin y San Vicente', fuente: 'Censo 2024 / RSH BIDAT 2026' }
        ],
        conclusion: 'Los datos sociodemográficos y habitacionales demuestran que los 27 barrios oficiales de Santiago albergan tres ciudades superpuestas: un corredor central-oriental hiperdenso (Santa Isabel, Santa Ana, Parque Almagro y San Borja) de pequeños departamentos en arriendo formal habitados por jóvenes y hogares unipersonales; un pericentro histórico en Barrio Brasil, Yungay, Panamá, Ejército y Barrio Universitario donde la zonificación patrimonial ha permitido conservar la escala barrial pero enfrenta presiones de subarriendo en su borde norte; y un arco sur y poniente (Franklin, San Vicente, Bogotá, Matta Sur y Sierra Bella) donde convergen la informalidad contractual, el hacinamiento en cités y la mayor demanda de protección social y cuidados.',
        analisisPorActor: [
          { id: 'institucion', icono: '🏛️', nombre: 'Institución / Autoridad Pública', subtitulo: 'MINVU · SECPLA Santiago · Dirección de Desarrollo Comunitario (DIDECO)', utilidad: 'Permite focalizar subsidios de rehabilitación habitacional y fiscalización de subarriendo sin contrato en San Vicente (31,7%), Bogotá (23,5%) y Yungay (20,8%), además de orientar redes de cuidado en las UV con mayor número de postrados.' },
          { id: 'comunidad', icono: '🏘️', nombre: 'Comunidad / Vecinal', subtitulo: 'Juntas de Vecinos · Comités de Vivienda y Arrendatarios', utilidad: 'Aporta datos censales exactos por manzana y barrio para defender la Zona de Conservación Histórica en Barrio Brasil y exigir programas de apoyo a adultos mayores que viven solos.' },
          { id: 'voluntario', icono: '🗺️', nombre: 'Mapeador / Voluntario OSM', subtitulo: 'Comunidades Territoriales y Mapeadores Colaborativos', utilidad: 'Guía el catastro de cités, pasajes interiores y equipamientos de cuidado comunitario en las manzanas con mayor vulnerabilidad habitacional.' },
          { id: 'ong', icono: '🔬', nombre: 'Investigadores / Academia', subtitulo: 'Centros de Estudios Socioterritoriales', utilidad: 'Entrega evidencia cuantitativa actualizada sobre la relación entre zonificación PRC, verticalización inmobiliaria, inserción migrante (40,4%) y precarización del arriendo.' }
        ],
        apartadoBibliografico: {
          fuentesDatos: [
            { codigo: 'censo2024_manzanas', nombre: 'Censo de Población y Vivienda 2024 (1.711 Manzanas de Santiago)', institucion: 'Instituto Nacional de Estadísticas (INE)', crs: 'EPSG:32719', tipo: 'Polígonos / Tabular' },
            { codigo: 'rsh_bidat_2026', nombre: 'Registro Social de Hogares e Índice IGVUST por Unidad Vecinal (2026)', institucion: 'Ministerio de Desarrollo Social y Familia (MDSF - BIDAT)', crs: 'EPSG:32719', tipo: 'Polígonos UV' },
            { codigo: 'minvu_ipt_prc', nombre: 'Plan Regulador Comunal de Santiago y Delimitación de 27 Barrios', institucion: 'MINVU / Ilustre Municipalidad de Santiago', crs: 'EPSG:32719', tipo: 'Polígonos' }
          ],
          referenciasAcademicas: [
            { cita: 'Hidalgo, R., & Janoschka, M. (Eds.). (2014). La ciudad neoliberal: gentrificación y exclusión en Santiago de Chile. Pontificia Universidad Católica de Chile.', concepto: 'Efectos socioterritoriales de la verticalización intensiva y transformación del mercado de arriendo en el pericentro.' },
            { cita: 'Contreras, Y. (2017). Nuevos habitantes del centro de Santiago. Editorial Universitaria.', concepto: 'Trayectorias residenciales de jóvenes profesionales, hogares unipersonales e inmigrantes en barrios centrales.' },
            { cita: 'Instituto Nacional de Estadísticas [INE]. (2024). Resultados Censo de Población y Vivienda 2024. INE Chile.', concepto: 'Fuente estadística oficial para el cálculo de densidades, tipologías de vivienda, tenencia y demografía comunal.' }
          ]
        }
      }
    },

    // -----------------------------------------------------------------------
    // STORYBOARD 4: RESULTADOS SOCIOAMBIENTALES, MOVILIDAD Y METABOLISMO (24 MAPAS)
    // -----------------------------------------------------------------------
    {
      id: 'storyboard-socioambiental-movilidad-servicios',
      dimensionId: 'ambiental',
      dimensionNombre: 'Resultados Territoriales · Movilidad, Proximidad & Aseo',
      titulo: 'Socioambiente, Proximidad Peatonal, Movilidad y Metabolismo Urbano: Resultados en la Comuna de Santiago',
      bajada: 'Qué revelan las 24 cartografías socioambientales y operativas: el 84,6% de viajes en modos sustentables, las brechas de distancia a áreas verdes y salud en el borde sur, la exposición a ruido (>68 dBA) en corredores viales y la asimetría de contenedores entre las 5 zonas de aseo municipal.',
      imagen: 'img/storyboards/portada_analisis_socioambiental.svg',
      imagenDestacada: 'img/storyboards/portada_analisis_socioambiental.svg',
      piePortada: 'Ilustración de los flujos de movilidad sustentable, accesibilidad peatonal a parques, paisaje acústico y metabolismo de residuos en Santiago.',
      tags: ['84,6% Movilidad Sustentable', 'Proximidad Peatonal', 'Ruido Urbano dBA', '5 Zonas de Aseo', '24 Cartografías'],
      capasRelevantes: ['munistgo_aseo_zonas_residuos_2026', 'cat08_biodiversidad', 'cat04_movilidad_activa', 'cat05_espacio_publico', 'semaforos_rm_uoct_2026', 'estaciones_metro', 'establecimientos_salud'],
      contenido: {
        introduccion: `La evaluación espacial de las 24 cartografías socioambientales, de movilidad y de gestión de residuos revela cómo funciona el metabolismo cotidiano en los 27 barrios oficiales de la Comuna de Santiago. Por una parte, los datos censales de transporte confirman que el 84,6% de los 228.482 desplazamientos laborales y de estudio se realiza en modos sustentables (62,4% en transporte público, 17,0% a pie y 5,2% en bicicleta), frente a solo un 15,4% en modos motorizados privados (13,2% en automóvil y 2,2% en motocicleta). Sin embargo, esta alta caminabilidad convive con severas desigualdades ambientales: mientras barrios como Parque Almagro (con 1.092 árboles en un radio de 500 m), Ejército, Barrio Brasil y Santa Lucía Forestal gozan de acceso inmediato a áreas verdes y salud, sectores del surponiente y sur como San Vicente (795,7 m a espacio público), Sierra Bella (837,0 m a salud) y Barrio Judicial (965,8 m a salud) sufren déficits de proximidad, altos niveles de ruido vial (>68,6 dBA) y marcadas asimetrías en la dotación municipal de los 629 contenedores y 398 papeleros distribuidos en las 5 macro-zonas de aseo comunal.`,
        datosClave: [
          { valor: '84,6%', label: 'Movilidad Sustentable', sub: '62,4% TP · 17,0% Caminata · 5,2% Bicicleta' },
          { valor: '285,0', label: 'Árboles en Buffer 500m', sub: 'Media comunal (Máx: Parque Almagro con 1.092)' },
          { valor: '62,7 dBA', label: 'Ruido Promedio Comunal', sub: 'Cimas de 69,4 dBA en bordes de autopistas y ejes' },
          { valor: '285.860 L', label: 'Capacidad Red de Aseo', sub: '629 contenedores y 398 papeleros en 5 macro-zonas' }
        ],
        porcentajesClave: [
          { label: 'Desplazamientos Realizados en Transporte Público (Metro y Buses Red)', valor: '62,4%', porcentaje: 62.4, contexto: '142.548 viajes diarios; alcanza máximos en Santa Elena (73,7%), Diez de Julio (69,8%) y Viel (69,2%).' },
          { label: 'Desplazamientos Activos (Caminata 17,0% + Bicicleta 5,2%)', valor: '22,2%', porcentaje: 44.4, contexto: 'La caminata lidera en Meiggs (58,1%) y Centro Histórico (28,3%); la bicicleta en Sta. Lucía Forestal (8,6%).' },
          { label: 'Uso del Automóvil Particular Motorizado en Viajes Cotidianos', valor: '13,2%', porcentaje: 26.4, contexto: 'Mínimo en Meiggs (7,5%) y Centro Histórico (9,2%), subiendo a 30,4% en Club Hípico y 23,5% en P. O’Higgins.' },
          { label: 'Concentración de Capacidad de Contenedores en Zonas Poniente y Centro Poniente', valor: '80,9%', porcentaje: 80.9, contexto: 'Las zonas Poniente (121.480 L) y Centro Poniente/Brasil (109.660 L) reúnen 477 de los 629 contenedores.' }
        ],
        graficoComparativo: {
          titulo: 'Partición Modal Comunal y Contrastes Barriales de Movilidad y Metabolismo (Censo 2024 / MuniSTGO)',
          filas: [
            { label: 'Movilidad Sustentable Total Comunal (TP + Caminata + Bicicleta)', valor: '84,6% comunal', porcentaje: 84.6 },
            { label: 'Transporte Público: Media Comunal 62,4% (Máx: Santa Elena 73,7%)', valor: '62,4% comunal', porcentaje: 62.4 },
            { label: 'Viajes a Pie en Barrio Meiggs (58,1%) y Centro Histórico (28,3%)', valor: '58,1% máx', porcentaje: 58.1 },
            { label: 'Uso de Automóvil en Club Hípico (30,4%) vs. Media Comunal (13,2%)', valor: '30,4% máx', porcentaje: 30.4 },
            { label: 'Uso de Bicicleta en Santa Lucía Forestal (8,6%) y Santa Isabel (7,0%)', valor: '8,6% máx', porcentaje: 18.0 },
            { label: 'Capacidad de Aseo Zona Poniente (216 cont. · 209 pap. · 121.480 L)', valor: '121.480 L', porcentaje: 95.0 },
            { label: 'Capacidad de Aseo Zona Centro Poniente / Brasil (261 cont. · 24 pap.)', valor: '109.660 L', porcentaje: 86.0 },
            { label: 'Capacidad de Aseo Zona Oriente (114 cont. · 66 pap. · 41.040 L)', valor: '41.040 L', porcentaje: 32.0 }
          ]
        },
        diagramaSVG: () => `
          <svg viewBox="0 0 680 230" width="680" height="230" class="svg-diagrama-canvas" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <rect width="680" height="230" fill="#0b1329" rx="8"/>
            <text x="24" y="26" fill="#38bdf8" font-size="11.5" font-weight="bold">BALANCE TERRITORIAL DE MOVILIDAD Y METABOLISMO DE RESIDUOS EN SANTIAGO</text>
            <!-- Barra Partición Modal -->
            <rect x="24" y="42" width="632" height="72" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
            <text x="38" y="62" fill="#e2e8f0" font-size="10" font-weight="bold">Partición Modal Comunal (228.482 viajes): 84,6% Sustentable vs. 15,4% Motorizado Privado</text>
            <rect x="38" y="72" width="374" height="24" rx="4" fill="#0284c7"/>
            <text x="225" y="88" fill="#ffffff" font-size="9.5" font-weight="bold" text-anchor="middle">Transporte Público: 62,4%</text>
            <rect x="412" y="72" width="102" height="24" fill="#10b981"/>
            <text x="463" y="88" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle">A pie: 17,0%</text>
            <rect x="514" y="72" width="32" height="24" fill="#f59e0b"/>
            <text x="530" y="88" fill="#0f172a" font-size="8" font-weight="bold" text-anchor="middle">5,2%</text>
            <rect x="546" y="72" width="92" height="24" rx="4" fill="#ef4444"/>
            <text x="592" y="88" fill="#ffffff" font-size="8.5" font-weight="bold" text-anchor="middle">Auto/Moto: 15,4%</text>
            <!-- Las 5 Zonas de Aseo -->
            <text x="24" y="136" fill="#34d399" font-size="10.5" font-weight="bold">Capacidad Instalada por Macro-Zona de Aseo Municipal (Total: 629 Contenedores · 398 Papeleros · 285.860 L)</text>
            <rect x="24" y="146" width="120" height="68" rx="6" fill="#1e293b" stroke="#f97316" stroke-width="1.4"/>
            <text x="84" y="164" fill="#fdba74" font-size="9.5" font-weight="bold" text-anchor="middle">Poniente (Z5)</text>
            <text x="84" y="180" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle">121.480 L</text>
            <text x="84" y="196" fill="#cbd5e1" font-size="8" text-anchor="middle">216 cont · 209 pap (R: 1,03)</text>
            <rect x="152" y="146" width="126" height="68" rx="6" fill="#1e293b" stroke="#2dd4bf" stroke-width="1.4"/>
            <text x="215" y="164" fill="#5eead4" font-size="9.5" font-weight="bold" text-anchor="middle">Centro Poniente (Z3)</text>
            <text x="215" y="180" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle">109.660 L</text>
            <text x="215" y="196" fill="#cbd5e1" font-size="8" text-anchor="middle">261 cont · 24 pap (R: 10,88)</text>
            <rect x="286" y="146" width="120" height="68" rx="6" fill="#1e293b" stroke="#84cc16" stroke-width="1.4"/>
            <text x="346" y="164" fill="#bef264" font-size="9.5" font-weight="bold" text-anchor="middle">Oriente (Z1)</text>
            <text x="346" y="180" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle">41.040 L</text>
            <text x="346" y="196" fill="#cbd5e1" font-size="8" text-anchor="middle">114 cont · 66 pap (R: 1,73)</text>
            <rect x="414" y="146" width="120" height="68" rx="6" fill="#1e293b" stroke="#e879f9" stroke-width="1.4"/>
            <text x="474" y="164" fill="#f0abfc" font-size="9.5" font-weight="bold" text-anchor="middle">Centro Oriente (Z2)</text>
            <text x="474" y="180" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle">13.680 L</text>
            <text x="474" y="196" fill="#cbd5e1" font-size="8" text-anchor="middle">38 cont · 68 pap (R: 0,56)</text>
            <rect x="542" y="146" width="114" height="68" rx="6" fill="#1e293b" stroke="#60a5fa" stroke-width="1.4"/>
            <text x="599" y="164" fill="#93c5fd" font-size="9.5" font-weight="bold" text-anchor="middle">Centro Plaza (Z4)</text>
            <text x="599" y="180" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle">31 Papeleros</text>
            <text x="599" y="196" fill="#cbd5e1" font-size="8" text-anchor="middle">0 cont. en calzada (R: 0)</text>
          </svg>
        `,
        seccionesAnaliticas: [
          {
            titulo: '1. Hegemonía de la movilidad sustentable (84,6%) y geografía barrial de la partición modal',
            parrafos: [
              'Las seis cartografías de movilidad elaboradas a partir del Censo 2024 demuestran que la Comuna de Santiago posee un patrón de desplazamiento abrumadoramente sustentable: el 84,6% de todos los viajes cotidianos se realiza en transporte público, a pie o en bicicleta, situando a la mayoría de las manzanas comunales (y casi la totalidad de Barrio Brasil) en el cuartil superior de Movilidad Sustentable (75,24% a 100%). En contrapartida, la Movilidad Motorizada Privada (automóvil y motocicleta) promedia apenas un 15,4% comunal, superando el 25% únicamente en barrios periféricos del surponiente como Club Hípico (30,4% de uso de automóvil), Parque O’Higgins (23,5%) y San Eugenio (20,7%).',
              'Al desglosar cada modo, emergen especializaciones territoriales muy marcadas. El Transporte Público (62,4% comunal) alcanza sus tasas más altas en los barrios residenciales alejados del centro cívico pero conectados a líneas de Metro y corredores de buses, liderados por Santa Elena (73,7%), Diez de Julio (69,8%) y Viel (69,2%). Los Viajes a Pie (17,0% comunal) se disparan en los barrios donde coinciden vivienda y fuentes de trabajo comercial o administrativo, encabezados por Meiggs (58,1%), San Vicente (28,7%) y Centro Histórico (28,3%), además del sector sur de Barrio Brasil en torno a la Alameda y el campus UAH. Finalmente, el uso de la Bicicleta (5,2% comunal, con manzanas que llegan al 28,6%) alcanza sus promedios barriales más altos en el corredor oriente —Santa Lucía Forestal (8,6%), Santa Isabel (7,0%) y Diez de Julio (6,1%)— y en las manzanas interiores de Barrio Brasil conectadas a las ciclovías de Rosas y Compañía.'
            ],
            graficoInline: {
              titulo: 'Barrios Líderes según Modo Principal de Desplazamiento en la Comuna de Santiago',
              filas: [
                { label: 'Transporte Público: Barrio Santa Elena (73,7%) y Diez de Julio (69,8%)', valor: '73,7% máx', porcentaje: 100 },
                { label: 'Caminata Peatonal: Barrio Meiggs (58,1%) y San Vicente (28,7%)', valor: '58,1% máx', porcentaje: 79 },
                { label: 'Automóvil Particular: Barrio Club Hípico (30,4%) y P. O’Higgins (23,5%)', valor: '30,4% máx', porcentaje: 41 },
                { label: 'Bicicleta y Ciclovías: Santa Lucía Forestal (8,6%) y Santa Isabel (7,0%)', valor: '8,6% máx', porcentaje: 18 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/pct_movilidad_sustentable.jpg',
                titulo: 'Movilidad Sustentable Total (% Suma de Viajes Censo 2024)',
                subtitulo: 'Cuartiles: 0% · 42,86%–75,01% · 75,24%–87,20% · 87,23%–100%',
                lectura: 'Muestra un predominio de manzanas azul oscuro (87,2% a 100% de viajes sustentables) en el Centro Histórico, Santa Ana, Parque Almagro y gran parte de Barrio Brasil.'
              },
              {
                src: 'img/cartografias/pct_movilidad_motorizada_privada.jpg',
                titulo: 'Movilidad Motorizada Privada (% Automóvil y Motocicleta)',
                subtitulo: 'Media comunal: 15,4% (13,2% auto · 2,2% moto)',
                lectura: 'Exhibe los valores más bajos en el centro cívico y Barrio Brasil, incrementándose hacia el borde surponiente (Club Hípico y San Eugenio) y manzanas puntuales del oriente.'
              },
              {
                src: 'img/cartografias/utiliza_transporte_publico_porcentaje.jpg',
                titulo: 'Utiliza Transporte Público (% Buses Red y Metro)',
                subtitulo: 'Total comunal: 142.548 usuarios (62,4% de los viajes)',
                lectura: 'Constituye la base de la movilidad en toda la comuna, superando el 70% en el pericentro suroriente (Santa Elena, Diez de Julio, Viel) y en el norte de Barrio Brasil.'
              },
              {
                src: 'img/cartografias/transporte_a_pie.jpg',
                titulo: 'Transporte a Pie (Número de Personas que Caminan por Manzana)',
                subtitulo: 'Total comunal: 38.804 caminantes (17,0% de los viajes)',
                lectura: 'Resalta un corredor de altísima caminabilidad a lo largo del eje central (Centro Histórico, Parque Almagro, Santa Isabel) y en el entorno comercial de Meiggs y Alameda.'
              },
              {
                src: 'img/cartografias/transporte_en_bicicleta_ciclovias.jpg',
                titulo: 'Transporte en Bicicleta y Red de Ciclovías (%)',
                subtitulo: 'Total comunal: 11.988 ciclistas · Red de ciclovías superpuesta en rojo',
                lectura: 'Evidencia cómo los mayores porcentajes de uso de bicicleta se articulan directamente sobre la malla de ciclovías de Rosas, Compañía, Brasil, Santa Isabel y Portugal.'
              },
              {
                src: 'img/cartografias/transporte_en_auto.jpg',
                titulo: 'Transporte en Automóvil Particular (Número de Personas)',
                subtitulo: 'Total comunal: 30.088 conductores/pasajeros de auto (13,2%)',
                lectura: 'En términos absolutos, el mayor número de automóviles estacionados y en flujo proviene de las torres de alta densidad de Santa Isabel, Parque Almagro y San Borja.'
              }
            ]
          },
          {
            titulo: '2. Justicia espacial y proximidad peatonal: distancias reales a áreas verdes, biodiversidad, salud y comercio',
            parrafos: [
              'Las cinco cartografías de distancia euclidiana mínima desde cada manzana hacia los equipamientos revelan dónde se cumplen o vulneran los umbrales de la "ciudad de 15 minutos". En Distancia a Espacios Públicos VGI (media comunal de 176,8 m y mediana de 127,8 m) y Distancia a Áreas Verdes Totales, los barrios mejor servidos son Santa Lucía Forestal (41,1 m en promedio), Parque Almagro (45,1 m) y el corazón de Barrio Brasil en torno a Plaza Brasil; en cambio, barrios del borde surponiente como San Vicente (media de 795,7 m) y Meiggs (369,5 m) presentan las mayores distancias peatonales hacia una plaza o parque.',
              'Un patrón similar se observa en la Distancia a Biodiversidad Urbana (media comunal de 114,7 m, mediana de 45,3 m): mientras en Parque Almagro (4,3 m), Parque O’Higgins (10,1 m) y Barrio Brasil la vegetación arbórea es contigua a las manzanas (tonos amarillos de <50 m), en San Vicente (466,3 m), Meiggs (367,6 m) y sectores de Franklin y Santa Isabel se forman islas carentes de arbolado cercano. Respecto a la Distancia a Establecimientos de Salud (media comunal de 395,8 m), los barrios San Borja (70,1 m) y Santa Lucía Forestal (119,8 m) gozan de acceso inmediato a hospitales y clínicas, mientras Barrio Judicial (965,8 m), Sierra Bella (837,0 m) y el extremo norponiente de Yungay/Brasil superan los 500 m de caminata. Por el contrario, la Distancia a Servicios y Comercio VGI promedia apenas 19,4 m en la comuna (mediana de 0,6 m), confirmando la ubicuidad del comercio de proximidad salvo en manzanas interiores de Franklin (47,9 m) y Sierra Bella (42,3 m).'
            ],
            graficoInline: {
              titulo: 'Distancias Medias Peatonales en Barrios Extremos de Santiago (metros)',
              filas: [
                { label: 'Distancia a Salud: Barrio Judicial (965,8 m) vs. San Borja (70,1 m)', valor: '965,8 m máx', porcentaje: 100 },
                { label: 'Distancia a Salud: Sierra Bella (837,0 m) vs. Media (395,8 m)', valor: '837,0 m', porcentaje: 87 },
                { label: 'Distancia a Espacio Público: San Vicente (795,7 m) vs. Almagro (45,1 m)', valor: '795,7 m máx', porcentaje: 82 },
                { label: 'Distancia a Biodiversidad: San Vicente (466,3 m) vs. Media (114,7 m)', valor: '466,3 m máx', porcentaje: 48 },
                { label: 'Distancia a Servicios y Comercio: Franklin (47,9 m) vs. Media (19,4 m)', valor: '47,9 m máx', porcentaje: 12 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/distancia_areas_verdes_todas.jpg',
                titulo: 'Distancia Mínima a Áreas Verdes Oficiales y VGI (metros)',
                subtitulo: 'Gradiente de proximidad peatonal a parques y plazas comunales',
                lectura: 'Muestra acceso inmediato (<100 m, amarillo) en torno a Plaza Brasil, Parque Forestal, Parque Almagro y Parque O’Higgins, y brechas (>400 m, azul) en Meiggs, San Vicente y el suroriente.'
              },
              {
                src: 'img/cartografias/distancia_a_espacios_publicos_vgi.jpg',
                titulo: 'Distancia a Espacios Públicos Recreativos VGI (metros)',
                subtitulo: 'Media comunal: 176,8 m · Máximo en San Vicente (795,7 m) y Meiggs (369,5 m)',
                lectura: 'En Barrio Brasil las manzanas centrales están a menos de 80 m de Plaza Brasil, pero la distancia aumenta hacia los bordes de Av. Mapocho y Ricardo Cumming.'
              },
              {
                src: 'img/cartografias/distancia_a_biodiversidad_total.jpg',
                titulo: 'Distancia a Registros de Biodiversidad y Arbolado Urbano (metros)',
                subtitulo: 'Media comunal: 114,7 m (mediana 45,3 m) · Mínimo en Parque Almagro (4,3 m)',
                lectura: 'Confirma la alta cobertura ecológica de Barrio Brasil y el centro histórico, revelando en azul oscuro los vacíos de biodiversidad del cuadrante surponiente y oriente.'
              },
              {
                src: 'img/cartografias/distancia_a_salud_m_total.jpg',
                titulo: 'Distancia a Establecimientos de Salud Pública y Privada (metros)',
                subtitulo: 'Media comunal: 395,8 m · Extremos: San Borja (70,1 m) vs. Barrio Judicial (965,8 m)',
                lectura: 'Identifica conos de sombra asistencial (>600 m) en Sierra Bella, Barrio Judicial y en el cuadrante central-norte de Barrio Brasil alejado de la Alameda.'
              },
              {
                src: 'img/cartografias/distancia_a_servicios_vgi_m.jpg',
                titulo: 'Distancia a Servicios y Comercio Barrial VGI (metros)',
                subtitulo: 'Media comunal: 19,4 m (mediana 0,6 m) · Alta capilaridad de almacenes y locales',
                lectura: 'Demuestra que casi todas las manzanas de Barrio Brasil y del centro cuentan con comercio a menos de 20 metros, salvo paños industriales o residenciales cerrados en el sur.'
              }
            ]
          },
          {
            titulo: '3. Dotación acumulativa en radios caminables (buffers de 300 m y 500 m) y exposición al ruido ambiental',
            parrafos: [
              'Mientras las distancias mínimas miden el acceso al elemento más cercano, las siete cartografías de conteo en buffers caminables (300 m y 500 m) miden la abundancia real de oportunidades alrededor de cada manzana. En Arbolado Urbano en 500 m (media comunal de 285,0 árboles), Parque Almagro (1.092,0), Ejército (637,6) y el sur de Barrio Brasil lideran la comuna, mientras San Vicente y Meiggs apenas promedian 2,7 árboles en su entorno caminable. En Equipamiento Educativo en 500 m (media de 23,2 recintos), el polo Ejército (74,5), Barrio Universitario (68,3) y el suroriente de Barrio Brasil (Campus UAH) concentran la mayor oferta formativa del país, frente a apenas 6,4 recintos en Sierra Bella.',
              'De igual forma, el Centro Histórico y Santa Lucía Forestal lideran en Edificaciones en 500 m (884,0 predios), Paraderos de Bus en 500 m (342,2 puntos de parada), Patrimonio en 500 m (51,5 inmuebles) y Cruces Semaforizados UOCT en 300 m (25,5 cruces, frente a solo 2,7 en Club Hípico), mientras Barrio Brasil ocupa el segundo lugar comunal en densidad de Transporte VGI en 300 m (134,4 entidades, solo detrás de Centro Histórico con 144,7). No obstante, la cartografía de Ruido Ambiental Promedio (media comunal de 62,7 dBA, con rangos de 44,5 a 77,5 dBA) revela el costo ambiental de esta centralidad: las manzanas que enfrentan la Autopista Central (Parque O’Higgins con 69,4 dBA y Barrio Judicial con 69,3 dBA), la Alameda, Av. Matta y San Pablo superan el umbral crítico de 68,6 dBA (azul oscuro), mientras el interior de Barrio Brasil logra mantenerse como un refugio acústico relativo entre 44,5 y 62,8 dBA.'
            ],
            cartografias: [
              {
                src: 'img/cartografias/n_arboles_vgi_buffer500_m.jpg',
                titulo: 'N° de Árboles VGI en un Radio Caminable de 500 Metros',
                subtitulo: 'Media comunal: 285,0 árboles · Líder: Parque Almagro (1.092,0) y Ejército (637,6)',
                lectura: 'Destaca el cinturón verde que une Plaza Brasil, la Alameda, Barrio Ejército y Parque Almagro, contrastando con el déficit arbóreo del tercio sur.'
              },
              {
                src: 'img/cartografias/n_equip_educativos_buffer500_m_total.jpg',
                titulo: 'Equipamientos Educativos Totales en Buffer de 500 Metros',
                subtitulo: 'Media comunal: 23,2 recintos · Líderes: Ejército (74,5) y Barrio Universitario (68,3)',
                lectura: 'Muestra la extraordinaria concentración de universidades, liceos y jardines en el cuadrante sur de Barrio Brasil (Campus UAH) y su proyección hacia Ejército.'
              },
              {
                src: 'img/cartografias/n_paraderos_bus_buffer500m.jpg',
                titulo: 'Paraderos de Buses Red en Buffer de 500 Metros',
                subtitulo: 'Media comunal: 214,2 paradas · Líderes: Centro Histórico (342,2) y Sta. Lucía (322,1)',
                lectura: 'Evidencia la altísima densidad de oferta de transporte superficial en el centro cívico y en el borde Alameda-San Pablo de Barrio Brasil.'
              },
              {
                src: 'img/cartografias/n_edificaciones_buffer500m.jpg',
                titulo: 'Densidad de Edificaciones en Buffer de 500 Metros',
                subtitulo: 'Media comunal: 616,5 edificaciones · Máximo en Centro Histórico (884,0)',
                lectura: 'Refleja el grano fino de subdivisión predial en el casco histórico, Yungay, Barrio Brasil y Matta Sur.'
              },
              {
                src: 'img/cartografias/n_patrimonios_500buffer_vgi.jpg',
                titulo: 'Inmuebles y Monumentos Patrimoniales en Buffer de 500 Metros',
                subtitulo: 'Media comunal: 12,4 hitos · Líderes: Santa Lucía (51,5) y Centro Histórico (45,8)',
                lectura: 'Articula dos grandes polos patrimoniales: el casco fundacional (Plaza de Armas - Santa Lucía) y el eje poniente de Barrio Brasil (Plaza Brasil - Basílica del Salvador).'
              },
              {
                src: 'img/cartografias/n_semafotos_buffer_300_m.jpg',
                titulo: 'Cruces Semaforizados UOCT en Buffer de 300 Metros',
                subtitulo: 'Media comunal: 8,7 cruces · Líder: Centro Histórico (25,5) vs. Club Hípico (2,7)',
                lectura: 'Muestra que la regulación semaforizada se concentra en el triángulo central y sobre la Alameda, disminuyendo en las intersecciones interiores de Barrio Brasil.'
              },
              {
                src: 'img/cartografias/n_transporte_vgi_buffer_300_m.jpg',
                titulo: 'Entidades de Transporte VGI en Buffer de 300 Metros',
                subtitulo: 'Media comunal: 84,6 entidades · Líderes: Centro Histórico (144,7) y Brasil (134,4)',
                lectura: 'Posiciona a Barrio Brasil como el segundo barrio con mayor conectividad multimodal inmediata a menos de 300 metros en toda la comuna.'
              },
              {
                src: 'img/cartografias/ruido_promedio_db_total.jpg',
                titulo: 'Ruido Ambiental Promedio Ponderado (dBA Total MuniSTGO)',
                subtitulo: 'Cuartiles: 44,5–57,9 · 58,0–62,8 · 62,9–68,5 · 68,6–77,5 dBA',
                lectura: 'Expone las barreras acústicas críticas (>68,6 dBA, azul oscuro) sobre la Autopista Central (Av. Manuel Rodríguez), Alameda y San Pablo, mientras el interior de Barrio Brasil se mantiene bajo 62,8 dBA.'
              }
            ]
          },
          {
            titulo: '4. Metabolismo urbano de residuos: la asimetría operativa entre las 5 macro-zonas de aseo municipal',
            parrafos: [
              'El cierre del análisis aborda las cinco cartografías del sistema comunal de recolección de residuos elaborado a partir del catastro oficial de la Municipalidad de Santiago (MuniSTGO 2026), el cual organiza los 27 barrios oficiales en 5 grandes macro-zonas operativas: Centro Plaza (Zona 4), Centro Poniente (Zona 3), Centro Oriente (Zona 2), Poniente (Zona 5) y Oriente (Zona 1). En conjunto, la red municipal contabiliza 629 contenedores de alta capacidad y 398 papeleros peatonales, sumando una capacidad volumétrica instalada de 285.860 litros.',
              'Los resultados cartográficos revelan un desequilibrio profundo en el equipamiento entre zonas y en la relación contenedor/papelero a través de los 27 barrios comunales: 1) La Zona Poniente (Zona 5, integrada por los 8 barrios de Ejército, Barrio Universitario, Club Hípico, San Eugenio, Meiggs, San Vicente, Parque O’Higgins y Barrio Judicial) concentra la mayor capacidad total con 121.480 litros (216 contenedores y 209 papeleros, logrando un ratio equilibrado de 1,03); 2) La Zona Centro Poniente (Zona 3, conformada por los 5 barrios del sector norponiente: Barrio Brasil, Yungay, Santa Ana, Panamá y Balmaceda) posee el mayor número absoluto de contenedores domiciliarios de toda la comuna con 261 unidades (109.660 litros), pero cuenta con apenas 24 papeleros peatonales en vía pública, disparando el ratio a 10,88 contenedores por cada papelero; 3) La Zona Oriente (Zona 1, que agrupa 9 barrios: Parque Almagro, Matta Norte, Santa Elena, Sierra Bella, Matta Sur, Bogotá, Franklin, Viel y Huemul) dispone de 114 contenedores y 66 papeleros (41.040 litros, ratio 1,73); 4) La Zona Centro Oriente (Zona 2, compuesta por 4 barrios: Santa Lucía Forestal, San Borja, Santa Isabel y Diez de Julio) apenas registra 38 contenedores y 68 papeleros (13.680 litros, ratio 0,56) pese a albergar la mayor densidad habitacional en torres; y 5) La Zona Centro Plaza (Zona 4, correspondiente exclusivamente a Centro Histórico) opera con 0 contenedores en calzada y 31 papeleros peatonales.'
            ],
            graficoInline: {
              titulo: 'Distribución Real de Contenedores, Papeleros y Capacidad (Litros) en las 5 Zonas de Aseo',
              filas: [
                { label: 'Zona Poniente (216 contenedores · 209 papeleros · Ratio 1,03)', valor: '121.480 L', porcentaje: 100 },
                { label: 'Zona Centro Poniente / Barrio Brasil (261 cont · 24 pap · Ratio 10,88)', valor: '109.660 L', porcentaje: 90 },
                { label: 'Zona Oriente / Franklin-Almagro (114 cont · 66 pap · Ratio 1,73)', valor: '41.040 L', porcentaje: 34 },
                { label: 'Zona Centro Oriente / Sta. Isabel (38 cont · 68 pap · Ratio 0,56)', valor: '13.680 L', porcentaje: 12 },
                { label: 'Zona Centro Plaza / Casco Histórico (0 cont · 31 pap · Ratio 0,00)', valor: 'Solo papeleros', porcentaje: 5 }
              ]
            },
            cartografias: [
              {
                src: 'img/cartografias/zonas_de_aseo_munistgo.jpg',
                titulo: 'Zonas Operativas de Aseo Municipal (MuniSTGO 2026)',
                subtitulo: '5 Macro-sectores: Centro Oriente, Centro Plaza, Centro Poniente, Oriente y Poniente',
                lectura: 'Muestra la sectorización oficial del servicio de aseo, situando a Barrio Brasil íntegramente dentro de la macro-zona Centro Poniente (turquesa).'
              },
              {
                src: 'img/cartografias/total_contenedores_por_zona_aseo.jpg',
                titulo: 'Total de Contenedores de Residuos por Zona de Aseo',
                subtitulo: 'Rangos: 0 (Centro Plaza) · 38 (Centro Oriente) · 114 (Oriente) · 216 (Poniente) · 261 (Centro Poniente)',
                lectura: 'Revela que el sector Centro Poniente (Barrio Brasil y Yungay) concentra el máximo comunal con 261 contenedores domiciliarios en vía pública.'
              },
              {
                src: 'img/cartografias/total_papeleros_por_zona_aseo.jpg',
                titulo: 'Total de Papeleros Peatonales por Zona de Aseo',
                subtitulo: 'Rangos: 24 (Centro Poniente) · 31 (Centro Plaza) · 66 (Oriente) · 68 (Centro Oriente) · 209 (Poniente)',
                lectura: 'Evidencia el severo déficit de papeleros peatonales en la zona Centro Poniente / Barrio Brasil (solo 24 unidades) frente a las 209 unidades instaladas al sur de la Alameda.'
              },
              {
                src: 'img/cartografias/ratio_contenedores_papeleros_zona_aseo.jpg',
                titulo: 'Ratio Contenedores / Papeleros por Zona de Aseo',
                subtitulo: 'Valores: 0,00 · 0,56 · 1,03 · 1,73 · 10,88 (Centro Poniente)',
                lectura: 'Destaca en azul oscuro la anomalía del sector Centro Poniente (Barrio Brasil), donde existen casi 11 contenedores domiciliarios por cada papelero peatonal.'
              },
              {
                src: 'img/cartografias/capacidad_total_litros_zona_aseo.jpg',
                titulo: 'Capacidad Volumétrica Total de Residuos por Zona de Aseo (Litros)',
                subtitulo: 'Total comunal: 285.860 L · Máximo en Poniente (121.480 L) y Centro Poniente (109.660 L)',
                lectura: 'Confirma que el 80,9% de la capacidad volumétrica de contenedores en calle se concentra en la mitad poniente de la comuna (Zonas Poniente y Centro Poniente), dejando al sector hiperdenso de Santa Isabel con apenas 13.680 L.'
              }
            ]
          }
        ],
        tablaIndicadores: [
          { variable: 'Partición Modal Sustentable', valor: '84,6% de los viajes', referencial: '62,4% TP · 17,0% Pie · 5,2% Bici', fuente: 'Censo 2024 INE (228.482 viajes)' },
          { variable: 'Proximidad Media a Espacio Público y Salud', valor: '176,8 m (Plazas) · 395,8 m (Salud)', referencial: 'Peor acceso: San Vicente y Judicial', fuente: 'Matriz Zonal 1.711 Manzanas' },
          { variable: 'Ruido Ambiental Ponderado Comunal', valor: '62,7 dBA (media comunal)', referencial: 'Rango: 44,5 a 77,5 dBA', fuente: 'Mapa Acústico MuniSTGO' },
          { variable: 'Infraestructura Municipal de Aseo', valor: '629 Contenedores · 398 Papeleros', referencial: '285.860 Litros en 5 Macro-Zonas', fuente: 'Catastro Aseo MuniSTGO 2026' }
        ],
        conclusion: 'El cruce de los resultados socioambientales en los 27 barrios oficiales demuestra que la altísima sostenibilidad modal de Santiago (84,6% de viajes sin automóvil) requiere ser respaldada por una redistribución urgente de su infraestructura ambiental y operativa: resulta prioritario incrementar la dotación de arbolado y plazas en el borde surponiente y sur (San Vicente, Meiggs, Franklin y Sierra Bella), mitigar la exposición acústica (>68,6 dBA) en los bordes de la Autopista Central (Parque O’Higgins y Barrio Judicial) y Alameda, y corregir el déficit de papeleros peatonales en Barrio Brasil y la Zona Centro Poniente junto con la baja capacidad de contenedores en el corredor hiperdenso de Santa Isabel y la Zona Centro Oriente.',
        analisisPorActor: [
          { id: 'institucion', icono: '🏛️', nombre: 'Institución / Autoridad Pública', subtitulo: 'Dirección de Aseo y Ornato · Dirección de Tránsito · Ministerio del Medio Ambiente', utilidad: 'Entrega evidencia exacta para instalar nuevos papeleros peatonales en la Zona Centro Poniente (Barrio Brasil, que hoy tiene solo 24 unidades frente a 261 contenedores) y reforzar contenedores en la Zona Centro Oriente (Santa Isabel).' },
          { id: 'comunidad', icono: '🏘️', nombre: 'Comunidad / Vecinal', subtitulo: 'Comités Ambientales · Juntas de Vecinos · Colectivos Ciclistas', utilidad: 'Fundamenta la exigencia de pantallas acústicas y calmado de tráfico en el eje Manuel Rodríguez (Autopista Central) y Alameda, donde el ruido supera los 68,6 dBA.' },
          { id: 'voluntario', icono: '🗺️', nombre: 'Mapeador / Voluntario OSM', subtitulo: 'Comunidad Ciclista y Ambiental', utilidad: 'Orienta el mapeo de nuevos puntos limpios, papeleros, fuentes de agua y arbolado urbano en los barrios del sur comunal con distancias a biodiversidad superiores a 350 m.' },
          { id: 'ong', icono: '🔬', nombre: 'Investigadores / Academia', subtitulo: 'Ecología Urbana · Geografía Ambiental', utilidad: 'Permite correlacionar la hiperdensificación residencial del sector oriente con el déficit de contenedores municipales y la presión sobre el espacio público.' }
        ],
        apartadoBibliografico: {
          fuentesDatos: [
            { codigo: 'munistgo_aseo_2026', nombre: 'Catastro Oficial de 5 Zonas de Aseo, Contenedores y Papeleros (2026)', institucion: 'Ilustre Municipalidad de Santiago (Transparencia MU18117)', crs: 'EPSG:32719', tipo: 'Polígonos y Puntos' },
            { codigo: 'censo2024_movilidad', nombre: 'Microdatos de Modo de Transporte y Movilidad por Manzana (2024)', institucion: 'Instituto Nacional de Estadísticas (INE)', crs: 'EPSG:32719', tipo: 'Polígonos' },
            { codigo: 'ruido_buffers_stgo', nombre: 'Matriz de Ruido Ambiental (dBA), Distancias y Buffers 300m/500m', institucion: 'MMA / MuniSTGO', crs: 'EPSG:32719', tipo: 'Polígonos GeoPackage' }
          ],
          referenciasAcademicas: [
            { cita: 'Wolch, J. R., Byrne, J., & Newell, J. P. (2014). Urban green space, public health, and environmental justice. Landscape and Urban Planning, 125, 234–244.', concepto: 'Evaluación de brechas de distancia peatonal a áreas verdes y justicia ambiental urbana.' },
            { cita: 'Gehl, J. (2010). Cities for people. Island Press.', concepto: 'Caminabilidad, movilidad activa y calidad ambiental del espacio público a escala humana.' },
            { cita: 'Baccini, P., & Brunner, P. H. (2012). Metabolism of the anthroposphere: analysis, evaluation, design. MIT Press.', concepto: 'Análisis territorial de la capacidad volumétrica y distribución de infraestructura de residuos.' }
          ]
        }
      }
    }
  ];


  // Estado interno del módulo
// Estado interno del módulo
  let dimensionSeleccionada = null;
  let filtroTipoActivo = 'todos';
  let queryFiltroActual = '';

  /**
   * Helper seguro para obtener el mapa de definiciones de capas oficiales
   */
  function obtenerMapaCapasOficiales() {
    if (typeof window !== 'undefined' && window.ModuloIDEChile) {
      if (typeof window.ModuloIDEChile.obtenerCatalogoCapas === 'function') {
        try {
          return window.ModuloIDEChile.obtenerCatalogoCapas() || {};
        } catch (e) {
          console.warn('ModuloIndicadoresAnalisis: Error en obtenerCatalogoCapas()', e);
        }
      }
      if (window.ModuloIDEChile.CAPAS_OFICIALES) {
        return window.ModuloIDEChile.CAPAS_OFICIALES;
      }
    }
    return {};
  }

  /**
   * Resuelve los metadatos y nombre EXACTO de cualquier capa oficial o VGI
   * para asegurar paridad 100% con el Módulo "00. Visor y Atlas VGI"
   */
  function resolverDefinicionCapa(capaId) {
    // 1. Capas VGI Comunitarias (OpenStreetMap / GBIF)
    if (capaId.startsWith('cat0') || capaId.startsWith('cat1')) {
      const catKey = capaId.replace(/^cat\d\d_/, '');
      const catsVGI = (typeof window !== 'undefined' && window.NODO_CONFIG && window.NODO_CONFIG.categorias_osm) 
        ? window.NODO_CONFIG.categorias_osm 
        : [];
      const catFound = catsVGI.find(c => c.id === catKey || c.id === capaId);

      if (catFound) {
        const descGeom = catFound.geometrias ? catFound.geometrias[0] : 'Vectorial';
        const tipoGeom = descGeom.split(' ')[0].toUpperCase();
        return {
          id: catFound.id,
          tipo: 'vgi',
          codigo: catFound.codigo,
          nombre: catFound.nombre, // NOMBRE EXACTO de Módulo 01
          institucion: 'OSM / VGI',
          sigla: 'OSM / VGI',
          geometria: tipoGeom,
          descripcion: catFound.descripcion,
          archivoLocal: `data/capa_${catFound.id}.geojson`,
          nombreDescarga: `capa_${catFound.id}.geojson`
        };
      }

      // Fallback estricto con nombres exactos de config.js
      const fbVGI = NOMBRES_VGI_FALLBACK[capaId] || { codigo: 'VGI', nombre: catKey, institucion: 'OSM / VGI', geom: 'VECTORIAL', desc: 'Capa temática colaborativa.' };
      return {
        id: catKey,
        tipo: 'vgi',
        codigo: fbVGI.codigo,
        nombre: fbVGI.nombre, // NOMBRE EXACTO
        institucion: fbVGI.institucion,
        sigla: 'OSM / VGI',
        geometria: fbVGI.geom,
        descripcion: fbVGI.desc,
        archivoLocal: `data/capa_osm_rm_${capaId}.geojson`,
        nombreDescarga: `capa_osm_rm_${capaId}.geojson`
      };
    }

    // 2. Capas Oficiales del Estado (IDE Chile / MINVU / MTT / INE / MOP / etc.)
    const mapaOficiales = obtenerMapaCapasOficiales();
    let def = mapaOficiales[capaId];
    if (!def && typeof window !== 'undefined' && window.ModuloIDEChile && typeof window.ModuloIDEChile.obtenerDefinicion === 'function') {
      def = window.ModuloIDEChile.obtenerDefinicion(capaId);
    }

    if (def) {
      const sigla = (typeof window.obtenerSiglaInstitucion === 'function') 
        ? window.obtenerSiglaInstitucion(def.institucion) 
        : (def.institucion ? def.institucion.split('/')[0].trim().slice(0, 12) : 'ESTADO');
      
      const tipoGeom = (typeof window.obtenerTipoGeometria === 'function')
        ? window.obtenerTipoGeometria(def)
        : (def.geometria || 'VECTORIAL').toUpperCase();

      const codigo = def.num_bbdd ? `BBDD-${String(def.num_bbdd).padStart(2, '0')}` : def.id.toUpperCase().slice(0, 14);
      const archDescarga = def.archivoLocal || `data/${def.id}.geojson`;
      const nombreArchDescarga = archDescarga.split('/').pop();

      return {
        id: def.id,
        tipo: 'oficial',
        codigo: codigo,
        nombre: def.nombre, // NOMBRE EXACTO de Módulo 01
        institucion: def.institucion || 'Estado de Chile',
        sigla: sigla,
        geometria: tipoGeom,
        descripcion: def.descripcion || 'Capa oficial del Estado de Chile.',
        archivoLocal: archDescarga,
        nombreDescarga: nombreArchDescarga
      };
    }

    // Fallback con el diccionario de nombres exactos auditados de ide_chile.js
    const nombreFallback = NOMBRES_OFICIALES_FALLBACK[capaId] || capaId;
    const esBBDD = capaId.startsWith('bbdd_');
    const codigoFallback = esBBDD ? `BBDD-${capaId.split('_')[1].padStart(2, '0')}` : capaId.toUpperCase().slice(0, 14);

    return {
      id: capaId,
      tipo: 'oficial',
      codigo: codigoFallback,
      nombre: nombreFallback, // NOMBRE EXACTO de Módulo 01
      institucion: 'Estado de Chile (IDE Chile)',
      sigla: 'ESTADO',
      geometria: 'VECTORIAL',
      descripcion: 'Capa oficial de la base de datos territorial del Estado.',
      archivoLocal: `data/${capaId}.geojson`,
      nombreDescarga: `${capaId}.geojson`
    };
  }

  /**
   * Renderiza el contenedor completo del módulo dentro del elemento padre
   */
  function renderizarModulo(contenedorId = 'contenedor-indicadores-analisis') {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    const totalCapasAtlas = 132; // 122 oficiales + 10 VGI
    
    contenedor.innerHTML = `
      <div class="modulo-indicadores-analisis-wrapper">

        <!-- Encabezado del Módulo (Centrado y Visualmente Destacado) -->
        <header class="header-modulo-indicadores">
          <div class="insignia-indicadores">
            <span class="punto-pulso"></span>
            MÓDULO 05 · ANÁLISIS MULTIDIMENSIONAL Y NARRATIVAS TERRITORIALES
          </div>
          <h2 class="titulo-modulo-indicadores">Indicadores de Análisis Territorial y Storyboards</h2>
          <p class="bajada-modulo-indicadores">
            Articulación de las <strong>${totalCapasAtlas} coberturas geoespaciales del Atlas VGI</strong> (122 fuentes oficiales del Estado y 10 categorías colaborativas) en <strong>5 dimensiones de análisis territorial</strong>, complementadas con storyboards temáticos para la Comuna de Santiago y el Barrio Brasil.
          </p>
        </header>

        <!-- ===================================================================== -->
        <!-- GRILLA DE LAS 5 GRANDES DIMENSIONES ANALÍTICAS                         -->
        <!-- ===================================================================== -->
        <section class="seccion-dimensiones-analisis" aria-label="Dimensiones de Análisis">
          <h3 class="subtitulo-centrado-seccion">Dimensiones Analíticas y Coberturas Asociadas</h3>
          
          <div class="grilla-dimensiones-indicadores" id="grilla-tarjetas-dimensiones">
            ${DIMENSIONES.map(dim => {
              const conteo = dim.capasIds.length;
              return `
                <div class="tarjeta-dimension-grande" 
                     id="tarjeta-dim-${dim.id}" 
                     data-dimension="${dim.id}"
                     tabindex="0"
                     role="button"
                     aria-expanded="false"
                     aria-controls="contenedor-acordeon-capas"
                     onclick="ModuloIndicadoresAnalisis.alternarDimension('${dim.id}')">
                  <div class="badge-numero-dimension" style="border-color:${dim.color}; color:${dim.color};">
                    DIMENSIÓN 0${dim.numero}
                  </div>
                  <div class="icono-dimension-gigante" style="background:${dim.colorFondo}; border-color:${dim.colorBorde};">
                    <span>${dim.icono}</span>
                  </div>
                  <h4 class="nombre-dimension" style="color:#ffffff;">${dim.nombre}</h4>
                  <p class="desc-dimension">${dim.descripcion}</p>
                  <div class="footer-dimension">
                    <span class="badge-conteo-dimension" style="background:${dim.colorFondo}; color:${dim.color}; border:1px solid ${dim.colorBorde};">
                      ${conteo} CAPAS ASOCIADAS
                    </span>
                    <span class="indicador-acordeon-flecha">▾</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Contenedor del Acordeón Desplegable de Capas (Centrado) -->
          <div class="contenedor-acordeon-dimension" id="contenedor-acordeon-capas" style="display:none;">
            <!-- Contenido inyectado dinámicamente al seleccionar dimensión -->
          </div>
        </section>

        <!-- ===================================================================== -->
        <!-- SECCIÓN STORYBOARDS: NARRATIVAS DE DATOS EN BARRIO BRASIL               -->
        <!-- ===================================================================== -->
        <section class="seccion-storyboards-barrio-brasil" id="seccion-storyboards" aria-label="Storyboards de Barrio Brasil">
          <header class="header-seccion-storyboards">
            <div class="insignia-storyboards">NARRATIVAS ESPACIALES BASADAS EN DATOS</div>
            <h3 class="titulo-storyboards">Storyboards</h3>
            <p class="bajada-storyboards">
              Síntesis de resultados territoriales donde las <strong>83 cartografías temáticas</strong> revelan los patrones de concentración, segregación espacial, estructura demográfica, habitabilidad, movilidad y metabolismo urbano en la <strong>Comuna de Santiago y el Barrio Brasil</strong>.
            </p>
          </header>

          <div class="grilla-storyboards-cuadrados">
            ${STORYBOARDS.map((sb) => {
              return `
                <article class="tarjeta-storyboard-cuadrada" 
                         data-storyboard-id="${sb.id}"
                         role="button"
                         tabindex="0"
                         aria-label="Abrir historia: ${sb.titulo}"
                         onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('${sb.id}')">
                  <div class="imagen-cuadrada-wrapper">
                    <img src="${sb.imagen}" alt="${sb.titulo}" decoding="async" onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src=this.src.startsWith('src/')?this.src.slice(4):'src/'+this.src;}" class="img-storyboard-cuadro">
                    <div class="overlay-gradiente-storyboard"></div>
                    <button type="button" class="btn-zoom-miniatura" onclick="event.stopPropagation(); ModuloIndicadoresAnalisis.abrirLightboxImagenDeStoryboard('${sb.id}')" title="Ampliar imagen / cartografía">🔍</button>
                    <span class="badge-dimension-tag">${sb.dimensionNombre.split('&')[0]}</span>
                  </div>
                  <div class="cuerpo-tarjeta-storyboard">
                    <h4 class="titulo-tarjeta-storyboard">${sb.titulo}</h4>
                    <p class="bajada-tarjeta-storyboard">${sb.bajada}</p>
                    <div class="footer-tarjeta-storyboard">
                      <div class="tags-storyboard">
                        ${sb.tags.slice(0, 2).map(t => `<span class="tag-chip">${t}</span>`).join('')}
                      </div>
                      <span class="btn-abrir-historia">Leer Lámina ↗</span>
                    </div>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </section>

      </div>

      <!-- ===================================================================== -->
      <!-- MODAL / LÁMINA TIPO BLOG DE LECTURA DE STORYBOARDS                     -->
      <!-- ===================================================================== -->
      <div class="lamina-storyboard-overlay" id="lamina-storyboard-overlay" style="display:none;" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="lamina-storyboard-modal" id="lamina-storyboard-modal">
          <button type="button" class="btn-cerrar-lamina" id="btn-cerrar-lamina" onclick="ModuloIndicadoresAnalisis.cerrarLaminaStoryboard()" aria-label="Cerrar lámina">✕</button>
          <div class="lamina-contenido-scroll" id="lamina-contenido-scroll">
            <!-- Inyectado dinámicamente al abrir un storyboard -->
          </div>
        </div>
      </div>
    `;

    // Asignar listeners de accesibilidad por teclado
    vincularEventosInterfaz();
  }

  /**
   * Conecta los eventos de teclado y modales
   */
  function vincularEventosInterfaz() {
    const overlay = document.getElementById('lamina-storyboard-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cerrarLaminaStoryboard();
        }
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.style.display !== 'none') {
        cerrarLaminaStoryboard();
      }
    });
  }

  /**
   * Alterna la selección de una dimensión y despliega su acordeón con las capas correspondientes
   */
  function alternarDimension(dimId) {
    const contenedorAcordeon = document.getElementById('contenedor-acordeon-capas');
    if (!contenedorAcordeon) return;

    const dim = DIMENSIONES.find(d => d.id === dimId);
    if (!dim) return;

    const todasTarjetas = document.querySelectorAll('.tarjeta-dimension-grande');

    // Si ya está seleccionada, colapsar (efecto acordeón toggle)
    if (dimensionSeleccionada === dimId) {
      colapsarAcordeon();
      return;
    }

    // Activar nueva dimensión
    dimensionSeleccionada = dimId;
    filtroTipoActivo = 'todos';
    queryFiltroActual = '';

    todasTarjetas.forEach(t => {
      const coincide = t.dataset.dimension === dimId;
      t.classList.toggle('activa', coincide);
      t.setAttribute('aria-expanded', coincide ? 'true' : 'false');
    });

    // Conteos por origen para los botones de filtro
    const conteoOficiales = dim.capasIds.filter(id => !id.startsWith('cat0') && !id.startsWith('cat1')).length;
    const conteoVGI = dim.capasIds.filter(id => id.startsWith('cat0') || id.startsWith('cat1')).length;

    // Generar tarjetas de capas con nombres EXACTOS de Módulo 01 y estética Atlas VGI
    const htmlCapas = dim.capasIds.map(capaId => {
      const info = resolverDefinicionCapa(capaId);
      const geomIcon = info.geometria.includes('POL') ? '⬡' : (info.geometria.includes('PUN') ? '●' : (info.geometria.includes('LÍN') ? '〰' : '◆'));
      const origenIcon = info.tipo === 'oficial' ? '🏛️' : '👥';

      return `
        <div class="tarjeta-capa-dimension ${info.tipo}" 
             data-tipo="${info.tipo}" 
             data-nombre="${info.nombre.toLowerCase()}" 
             data-institucion="${info.institucion.toLowerCase()}"
             data-codigo="${info.codigo.toLowerCase()}">
          <div class="tarjeta-capa-dim-header">
            <span class="pill-dim-codigo">${info.codigo}</span>
            <span class="pill-dim-origen ${info.tipo}">${origenIcon} ${info.sigla}</span>
            <span class="pill-dim-geom"><span style="opacity:0.75; margin-right:3px;">${geomIcon}</span>${info.geometria}</span>
          </div>
          <h5 class="nombre-capa-dim">${info.nombre}</h5>
          <p class="desc-capa-dim">${info.descripcion}</p>
          <div class="tarjeta-capa-dim-acciones">
            <button type="button" class="btn-capa-accion btn-ver-mapa" onclick="ModuloIndicadoresAnalisis.activarCapaEnMapa('${info.id}', '${info.tipo}')">
              🗺️ Ver en Mapa
            </button>
            <a href="${info.archivoLocal}" download="${info.nombreDescarga}" class="btn-capa-accion btn-descarga-geojson" title="Descargar GeoJSON">
              GeoJSON 📥
            </a>
          </div>
        </div>
      `;
    }).join('');

    contenedorAcordeon.innerHTML = `
      <div class="caja-acordeon-activa" style="border-top: 3px solid ${dim.color}; border-radius: 14px;">
        <div class="cabecera-acordeon-activa">
          <div class="titulo-con-icono-acordeon">
            <span class="icono-acordeon-mini" style="background:${dim.colorFondo}; border-color:${dim.colorBorde}; box-shadow:0 0 18px ${dim.colorFondo};">${dim.icono}</span>
            <div>
              <h4 class="titulo-acordeon-activa">Dimensión 0${dim.numero}: ${dim.nombre}</h4>
              <p class="subtitulo-acordeon-activa">${dim.enfoque}</p>
            </div>
          </div>
          <div class="acciones-cabecera-acordeon">
            <span class="badge-contador-capas-filtro" id="badge-contador-capas-dim">
              Mostrando ${dim.capasIds.length} de ${dim.capasIds.length} capas
            </span>
            <button type="button" class="btn-cerrar-acordeon" onclick="ModuloIndicadoresAnalisis.colapsarAcordeon()" aria-label="Cerrar acordeón">✕ Cerrar</button>
          </div>
        </div>

        <!-- Barra de Herramientas: Buscador y Filtros -->
        <div class="barra-herramientas-acordeon">
          <div class="buscador-capas-acordeon">
            <span class="icono-lupa">🔍</span>
            <input type="text" 
                   id="input-buscador-capas-dim" 
                   placeholder="Buscar capa por nombre, código BBDD o institución..." 
                   aria-label="Buscar capa en dimensión"
                   oninput="ModuloIndicadoresAnalisis.filtrarCapasAcordeon(this.value)">
          </div>
          <div class="filtros-tipo-acordeon">
            <button type="button" class="btn-filtro-tipo activo" data-filtro="todos" onclick="ModuloIndicadoresAnalisis.filtrarPorTipo('todos')">Todas (${dim.capasIds.length})</button>
            <button type="button" class="btn-filtro-tipo" data-filtro="oficial" onclick="ModuloIndicadoresAnalisis.filtrarPorTipo('oficial')">🏛️ Oficiales Estado (${conteoOficiales})</button>
            <button type="button" class="btn-filtro-tipo" data-filtro="vgi" onclick="ModuloIndicadoresAnalisis.filtrarPorTipo('vgi')">👥 VGI Comunitario (${conteoVGI})</button>
          </div>
        </div>

        <!-- Grilla de Tarjetas de Capas -->
        <div class="grilla-capas-dimension" id="grilla-capas-dimension-items">
          ${htmlCapas}
          <div class="estado-vacio-capas-dim" id="estado-vacio-capas-dim" style="display:none;">
            <div class="icono-vacio-animado">🔍</div>
            <h5 class="titulo-vacio-capas">No se encontraron capas coincidentes</h5>
            <p class="desc-vacio-capas">No hay capas en esta dimensión que coincidan con los filtros aplicados.</p>
            <button type="button" class="btn-restablecer-filtros" onclick="ModuloIndicadoresAnalisis.restablecerFiltros()">Restablecer Búsqueda</button>
          </div>
        </div>
      </div>
    `;

    contenedorAcordeon.style.display = 'block';

    // Desplazamiento suave hacia el acordeón
    setTimeout(() => {
      contenedorAcordeon.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  }

  /**
   * Cierra el acordeón desplegable
   */
  function colapsarAcordeon() {
    dimensionSeleccionada = null;
    const contenedorAcordeon = document.getElementById('contenedor-acordeon-capas');
    if (contenedorAcordeon) {
      contenedorAcordeon.style.display = 'none';
      contenedorAcordeon.innerHTML = '';
    }
    document.querySelectorAll('.tarjeta-dimension-grande').forEach(t => {
      t.classList.remove('activa');
      t.setAttribute('aria-expanded', 'false');
    });
  }

  /**
   * Filtra las capas del acordeón en tiempo real según texto
   */
  function filtrarCapasAcordeon(query) {
    queryFiltroActual = (query || '').toLowerCase().trim();
    aplicarFiltrosCombinados();
  }

  /**
   * Filtra las capas del acordeón por tipo (todas, oficial, vgi)
   */
  function filtrarPorTipo(tipo) {
    filtroTipoActivo = tipo;
    document.querySelectorAll('.btn-filtro-tipo').forEach(btn => {
      btn.classList.toggle('activo', btn.dataset.filtro === tipo);
    });
    aplicarFiltrosCombinados();
  }

  /**
   * Aplica los filtros combinados de búsqueda y tipo sobre las tarjetas
   */
  function aplicarFiltrosCombinados() {
    const items = document.querySelectorAll('#grilla-capas-dimension-items .tarjeta-capa-dimension');
    let visibles = 0;

    items.forEach(el => {
      const tipo = el.dataset.tipo;
      const nombre = el.dataset.nombre || '';
      const institucion = el.dataset.institucion || '';
      const codigo = el.dataset.codigo || '';

      const coincideTipo = (filtroTipoActivo === 'todos') || (tipo === filtroTipoActivo);
      const coincideTexto = !queryFiltroActual || 
                            nombre.includes(queryFiltroActual) || 
                            institucion.includes(queryFiltroActual) || 
                            codigo.includes(queryFiltroActual);

      const mostrar = coincideTipo && coincideTexto;
      el.style.display = mostrar ? 'flex' : 'none';
      if (mostrar) visibles++;
    });

    const badgeContador = document.getElementById('badge-contador-capas-dim');
    if (badgeContador) {
      badgeContador.textContent = `Mostrando ${visibles} de ${items.length} capas`;
    }

    const estadoVacio = document.getElementById('estado-vacio-capas-dim');
    if (estadoVacio) {
      estadoVacio.style.display = (visibles === 0) ? 'flex' : 'none';
    }
  }

  /**
   * Restablece el buscador y los filtros a 'todos'
   */
  function restablecerFiltros() {
    const input = document.getElementById('input-buscador-capas-dim');
    if (input) input.value = '';
    queryFiltroActual = '';
    filtrarPorTipo('todos');
  }

  /**
   * Abre la lámina de lectura modal tipo blog para un Storyboard
   */
  function abrirLaminaStoryboard(storyboardId) {
    const sb = STORYBOARDS.find(s => s && s.id === storyboardId);
    if (!sb) return;

    const overlay = document.getElementById('lamina-storyboard-overlay');
    const scrollContenido = document.getElementById('lamina-contenido-scroll');
    if (!overlay || !scrollContenido) return;

    const totalCartos = Array.isArray(sb.contenido.seccionesAnaliticas)
      ? sb.contenido.seccionesAnaliticas.reduce((acc, sec) => acc + (Array.isArray(sec.cartografias) ? sec.cartografias.length : 0), 0)
      : (Array.isArray(sb.contenido.cartografias) ? sb.contenido.cartografias.length : 0);

    const imgDestacadaSrc = sb.imagenDestacada || sb.imagen;
    const pieDestacadaTexto = sb.piePortada || 'Ilustración síntesis de los hallazgos territoriales en la Comuna de Santiago y Barrio Brasil.';

    scrollContenido.innerHTML = `
      <article class="articulo-storyboard-blog">

        <!-- Encabezado de la Lámina -->
        <header class="header-articulo-blog">
          <div class="meta-superior-blog">
            <span class="badge-dim-storyboard">${sb.dimensionNombre}</span>
            <span class="tiempo-lectura-blog">🗺️ ${totalCartos} Cartografías Integradas</span>
          </div>
          <h1 class="titulo-articulo-blog">${sb.titulo}</h1>
          <p class="bajada-articulo-blog">${sb.bajada}</p>
          <div class="tags-articulo-blog">
            ${sb.tags.map(t => `<span class="tag-chip-blog">#${t}</span>`).join('')}
          </div>
        </header>

        <!-- Imagen Destacada del Storyboard (Con dimensiones explícitas garantizadas y Clic para Ampliar) -->
        <figure class="figura-destacada-blog figura-ampliable" onclick="ModuloIndicadoresAnalisis.abrirLightboxImagenDeStoryboard('${sb.id}')" title="Haz clic para ampliar la ilustración en pantalla completa">
          <div class="contenedor-imagen-ampliable">
            <img src="${imgDestacadaSrc}" alt="${sb.titulo}" width="800" height="420" decoding="async" onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src=this.src.startsWith('src/')?this.src.slice(4):'src/'+this.src;}" style="width:100%; height:auto; max-height:420px; min-height:220px; object-fit:contain; display:block; background:#0b1329;" class="img-destacada-blog">
            <div class="overlay-zoom-hover">
              <span class="badge-zoom-cta">🔍 Clic para ampliar en pantalla completa</span>
            </div>
          </div>
          <figcaption class="pie-figura-blog">
            ${pieDestacadaTexto} <span class="nota-ampliable">· Clic en la imagen para ampliar ↗</span>
          </figcaption>
        </figure>

        <!-- Párrafo de Apertura (Síntesis General de Resultados) -->
        <p class="parrafo-lead-blog">${sb.contenido.introduccion}</p>

        <!-- Matriz de Indicadores Clave Extraídos de la Base de Datos -->
        <div class="caja-metricas-storyboard">
          <h4 class="titulo-caja-metricas">📊 Resultados Cuantitativos Clave Extraídos de las Cartografías y la Base de Datos:</h4>
          <div class="grilla-kpis-storyboard">
            ${sb.contenido.datosClave.map(d => `
              <div class="tarjeta-kpi-storyboard">
                <span class="valor-kpi-storyboard">${d.valor}</span>
                <span class="label-kpi-storyboard">${d.label}</span>
                <span class="sub-kpi-storyboard">${d.sub}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- ================================================================= -->
        <!-- PANORAMA ESTADÍSTICO GENERAL: PORCENTAJES, GRÁFICO Y DIAGRAMA SVG -->
        <!-- ================================================================= -->
        <section class="seccion-analisis-profundo-datos" aria-label="Panorama Estadístico General">
          <div class="cabecera-subseccion-datos">
            <h4>📈 Panorama General de Resultados Territoriales en la Comuna de Santiago y Barrio Brasil</h4>
            <span class="badge-fuente-datos">CENSO 2024 · RSH BIDAT · ATLAS VGI</span>
          </div>

          <!-- Barras de Porcentajes Clave -->
          <div class="grilla-barras-porcentajes">
            ${sb.contenido.porcentajesClave.map(p => `
              <div class="tarjeta-barra-porcentaje">
                <div class="header-barra-porcentaje">
                  <span class="label-barra-porcentaje">${p.label}</span>
                  <span class="valor-barra-porcentaje">${p.valor}</span>
                </div>
                <div class="barra-progreso-fondo">
                  <div class="barra-progreso-relleno" style="width: ${Math.min(100, Math.max(8, p.porcentaje))}%;"></div>
                </div>
                <p class="contexto-barra-porcentaje">${p.contexto}</p>
              </div>
            `).join('')}
          </div>

          <!-- Gráfico Comparativo / Benchmark (Clic para Ampliar) -->
          <div class="contenedor-grafico-comparativo contenedor-figura-ampliable" onclick="ModuloIndicadoresAnalisis.abrirLightboxGrafico('${sb.id}')" title="Haz clic para ampliar el gráfico comparativo en pantalla completa">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h5 class="titulo-grafico-comparativo" style="margin:0;">📊 ${sb.contenido.graficoComparativo.titulo}</h5>
              <span class="btn-micro-zoom" title="Ampliar gráfico">🔍 Ampliar Gráfico</span>
            </div>
            ${sb.contenido.graficoComparativo.filas.map(f => `
              <div class="fila-grafico-barra">
                <span class="etiqueta-fila-barra" title="${f.label}">${f.label}</span>
                <div class="track-fila-barra">
                  <div class="fill-fila-barra" style="width: ${f.porcentaje}%;"></div>
                </div>
                <span class="valor-fila-barra">${f.valor}</span>
              </div>
            `).join('')}
          </div>

          <!-- Diagrama Técnico Vectorial SVG de Síntesis de Resultados (Clic para Ampliar) -->
          <div class="contenedor-diagrama-svg contenedor-figura-ampliable" onclick="ModuloIndicadoresAnalisis.abrirLightboxDiagrama('${sb.id}')" title="Haz clic para ampliar el diagrama de síntesis en pantalla completa">
            <div class="header-diagrama-svg">
              <h5 class="titulo-diagrama-svg">📐 Esquema Síntesis de Resultados Territoriales</h5>
              <div style="display:flex; gap:8px; align-items:center;">
                <span class="badge-fuente-datos">DIAGRAMA DE RESULTADOS</span>
                <span class="btn-micro-zoom" title="Ampliar diagrama">🔍 Ampliar Diagrama</span>
              </div>
            </div>
            <div class="svg-diagrama-canvas-wrapper">
              ${typeof sb.contenido.diagramaSVG === 'function' ? sb.contenido.diagramaSVG() : ''}
            </div>
            <p class="pie-diagrama-svg">
              Esquema comparativo elaborado a partir de los resultados del análisis cartográfico comunal y barrial. <span class="nota-ampliable">· Clic para ampliar ↗</span>
            </p>
          </div>
        </section>

        <!-- ================================================================= -->
        <!-- SECCIONES ANALÍTICAS CON CARTOGRAFÍAS INTERCALADAS EN EL RELATO   -->
        <!-- ================================================================= -->
        ${Array.isArray(sb.contenido.seccionesAnaliticas) ? sb.contenido.seccionesAnaliticas.map((sec, idxSec) => `
          <section class="bloque-narrativo-intercalado" aria-label="${sec.titulo}">
            <div class="cabecera-bloque-intercalado">
              <span class="badge-hallazgo-seccion">HALLAZGO TERRITORIAL 0${idxSec + 1} · ${sec.cartografias ? sec.cartografias.length : 0} ${sec.cartografias && sec.cartografias.length === 1 ? 'CARTOGRAFÍA' : 'CARTOGRAFÍAS'}</span>
              <h3 class="titulo-bloque-intercalado">${sec.titulo}</h3>
            </div>

            <div class="cuerpo-narrativo-blog">
              ${Array.isArray(sec.parrafos) ? sec.parrafos.map(p => `<p class="parrafo-blog">${p}</p>`).join('') : ''}
            </div>

            ${sec.graficoInline ? `
              <div class="contenedor-grafico-comparativo contenedor-grafico-inline contenedor-figura-ampliable" onclick="ModuloIndicadoresAnalisis.abrirLightboxGraficoInline('${sb.id}', ${idxSec})" title="Haz clic para ampliar este gráfico en pantalla completa">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                  <h5 class="titulo-grafico-comparativo" style="margin:0;">📊 ${sec.graficoInline.titulo}</h5>
                  <div style="display:flex; gap:8px; align-items:center;">
                    <span class="badge-fuente-datos">EVIDENCIA CUANTITATIVA</span>
                    <span class="btn-micro-zoom" title="Ampliar gráfico">🔍 Ampliar Gráfico</span>
                  </div>
                </div>
                ${sec.graficoInline.filas.map(f => `
                  <div class="fila-grafico-barra">
                    <span class="etiqueta-fila-barra" title="${f.label}">${f.label}</span>
                    <div class="track-fila-barra">
                      <div class="fill-fila-barra" style="width: ${f.porcentaje}%;"></div>
                    </div>
                    <span class="valor-fila-barra">${f.valor}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${Array.isArray(sec.cartografias) && sec.cartografias.length > 0 ? `
              <div class="contenedor-cartografias-inline">
                <div class="subcabecera-cartografias-inline">
                  <span>🗺️ <strong>Evidencia Cartográfica del Hallazgo 0${idxSec + 1}:</strong> Selecciona cualquier cartografía para examinarla en pantalla completa con zoom interactivo (2200×1423 px).</span>
                </div>
                <div class="grilla-cartografias-inline ${sec.cartografias.length === 1 ? 'grilla-carto-unica' : ''}">
                  ${sec.cartografias.map(c => `
                    <div class="item-cartografia-galeria item-cartografia-inline"
                         role="button"
                         tabindex="0"
                         onclick="ModuloIndicadoresAnalisis.abrirLightboxImagen('${c.src}', '${c.titulo.replace(/'/g, "\\'")}', '${(c.subtitulo || '').replace(/'/g, "\\'")}')"
                         title="Haz clic para ampliar: ${c.titulo}">
                      <div class="thumb-cartografia-wrapper">
                        <img src="${c.src}" alt="${c.titulo}" width="2200" height="1423" decoding="async" onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src=this.src.startsWith('src/')?this.src.slice(4):'src/'+this.src;}" class="img-thumb-cartografia">
                        <span class="btn-micro-zoom-carto">🔍 Ampliar Cartografía</span>
                      </div>
                      <div class="meta-thumb-cartografia">
                        <h6 class="titulo-thumb-carto">${c.titulo}</h6>
                        <span class="sub-thumb-carto">${c.subtitulo || ''}</span>
                        ${c.lectura ? `<p class="lectura-territorial-carto"><strong>Lectura territorial:</strong> ${c.lectura}</p>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </section>
        `).join('') : ''}

        <!-- Tabla de Síntesis de Indicadores y Atributos Específicos -->
        <section class="seccion-analisis-profundo-datos" aria-label="Tabla Resumen de Indicadores">
          <div class="cabecera-subseccion-datos">
            <h4>📋 Cuadro Resumen de Magnitudes Territoriales Comprobadas</h4>
            <span class="badge-fuente-datos">TRAZABILIDAD OFICIAL</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="tabla-datos-storyboard">
              <thead>
                <tr>
                  <th>Variable Territorial Evaluada</th>
                  <th>Resultado Comunal / Local</th>
                  <th>Contraste o Referencia Barrial</th>
                  <th>Fuente / Cartografía</th>
                </tr>
              </thead>
              <tbody>
                ${Array.isArray(sb.contenido.tablaIndicadores) ? sb.contenido.tablaIndicadores.map(row => `
                  <tr>
                    <td><strong>${row.variable}</strong></td>
                    <td class="valor-dato">${row.valor}</td>
                    <td class="valor-referencial">${row.referencial}</td>
                    <td><span class="pill-dim-origen oficial" style="font-size:0.68rem;">${row.fuente}</span></td>
                  </tr>
                `).join('') : ''}
              </tbody>
            </table>
          </div>
        </section>

        <!-- Conclusión / Síntesis de Resultados Territoriales -->
        ${sb.contenido.conclusion ? `
        <blockquote class="conclusion-destacada-blog">
          <p>${sb.contenido.conclusion}</p>
        </blockquote>` : ''}

        <!-- ================================================================= -->
        <!-- SECCIÓN 4 USUARIOS-TIPO: RELEVANCIA Y UTILIDAD TERRITORIAL        -->
        <!-- ================================================================= -->
        <section class="seccion-actores-territoriales-storyboard" aria-label="Utilidad para los 4 Usuarios-Tipo">
          <div class="cabecera-seccion-actores">
            <h4>🎯 Relevancia de estos Resultados según Perfil de Actor Territorial (4 Usuarios-Tipo)</h4>
            <span class="badge-fuente-datos">ENFOQUE MULTI-ACTOR</span>
          </div>
          <div class="grilla-actores-storyboard">
            ${Array.isArray(sb.contenido.analisisPorActor) ? sb.contenido.analisisPorActor.map(actor => `
              <div class="tarjeta-actor-storyboard actor-${actor.id}">
                <div class="header-actor-tarjeta">
                  <span class="icono-actor">${actor.icono}</span>
                  <div>
                    <span class="nombre-actor">${actor.nombre}</span>
                    <span class="subtitulo-actor">${actor.subtitulo}</span>
                  </div>
                </div>
                <p class="texto-utilidad-actor">${actor.utilidad}</p>
              </div>
            `).join('') : ''}
          </div>
        </section>

        <!-- ================================================================= -->
        <!-- SECCIÓN APARTADO BIBLIOGRÁFICO Y FUENTES FORMALES (APA 7MA ED.)    -->
        <!-- ================================================================= -->
        <section class="seccion-bibliografia-storyboard" aria-label="Apartado Bibliográfico y Fuentes">
          <div class="cabecera-bibliografia">
            <h4>📚 Apartado Bibliográfico y Trazabilidad de Datos Formales</h4>
            <span class="badge-fuente-datos">NORMA APA 7ª ED. · DATOS ABIERTOS</span>
          </div>

          <!-- Fuentes Formales de Datos Espaciales -->
          <div>
            <h5 class="subtitulo-bloque-biblio">1. Catálogo de Capas y Cartografías Utilizadas en este Análisis</h5>
            <div style="overflow-x:auto;">
              <table class="tabla-datos-storyboard" style="font-size:0.78rem;">
                <thead>
                  <tr>
                    <th>Código Capa</th>
                    <th>Nombre de Capa / Fuente en el Atlas</th>
                    <th>Institución / Autor</th>
                    <th>Sistema Ref. (CRS)</th>
                    <th>Geometría</th>
                  </tr>
                </thead>
                <tbody>
                  ${(sb.contenido.apartadoBibliografico && Array.isArray(sb.contenido.apartadoBibliografico.fuentesDatos)) ? sb.contenido.apartadoBibliografico.fuentesDatos.map(fd => `
                    <tr>
                      <td><code style="color:#38bdf8;">${fd.codigo}</code></td>
                      <td><strong>${fd.nombre}</strong></td>
                      <td>${fd.institucion}</td>
                      <td>${fd.crs}</td>
                      <td><span class="pill-dim-geom" style="font-size:0.65rem;">${fd.tipo}</span></td>
                    </tr>
                  `).join('') : ''}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Referencias Teórico-Metodológicas / Autores -->
          <div>
            <h5 class="subtitulo-bloque-biblio">2. Referencias Académicas y Fuentes Estadísticas (APA 7ª Ed.)</h5>
            <ul class="lista-referencias-apa">
              ${(sb.contenido.apartadoBibliografico && Array.isArray(sb.contenido.apartadoBibliografico.referenciasAcademicas)) ? sb.contenido.apartadoBibliografico.referenciasAcademicas.map(ref => `
                <li class="item-referencia-apa">
                  <strong>${ref.cita}</strong>
                  <span class="nota-marco-conceptual">${ref.concepto}</span>
                </li>
              `).join('') : ''}
            </ul>
          </div>
        </section>

        <!-- Barra de Acción Directa: Activar capas de la historia en el mapa -->
        <div class="barra-acciones-storyboard">
          <div class="info-acciones-storyboard">
            <strong>¿Deseas explorar las capas de este análisis en el mapa interactivo?</strong>
            <span>Activa directamente las coberturas geoespaciales asociadas en el Visor 2D.</span>
          </div>
          <button type="button" class="btn-explorar-historia-mapa" onclick="ModuloIndicadoresAnalisis.activarCapasDeHistoria('${sb.id}')">
            🗺️ Explorar Capas en el Visor
          </button>
        </div>

        <!-- Nota Metodológica de Transparencia -->
        <footer class="footer-articulo-blog">
          <small>
            * Este storyboard sintetiza los resultados de las 75 cartografías temáticas del Atlas de Información Geográfica Voluntaria para la Gestión Territorial. Datos integrados de fuentes oficiales (INE Censo 2024, MINVU, MDSF BiDat RSH 2026, UOCT/MTT, Municipalidad de Santiago) y comunitarias (OpenStreetMap y GBIF).
          </small>
        </footer>

      </article>
    `;

    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Bloquear scroll del fondo
  }

  /**
   * Cierra la lámina modal de lectura
   */
  function cerrarLaminaStoryboard() {
    cerrarLightboxFigura();
    const overlay = document.getElementById('lamina-storyboard-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }

  // =========================================================================
  // SISTEMA UNIVERSAL DE LIGHTBOX / ZOOM DE FIGURAS Y CARTOGRAFÍA
  // =========================================================================

  const lightboxState = {
    abierto: false,
    zoom: 1.0,
    minZoom: 0.5,
    maxZoom: 4.5,
    panX: 0,
    panY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    urlRecurso: ''
  };

  function asegurarLightboxEnDOM() {
    if (typeof document === 'undefined') return null;
    let overlay = document.getElementById('lightbox-figura-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'lightbox-figura-overlay';
      overlay.id = 'lightbox-figura-overlay';
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      overlay.innerHTML = `
        <div class="lightbox-figura-contenedor" id="lightbox-figura-contenedor">
          <header class="lightbox-header">
            <div class="lightbox-info-titulo">
              <span class="lightbox-tipo-badge" id="lightbox-tipo-badge">🗺️ CARTOGRAFÍA</span>
              <h3 class="lightbox-titulo" id="lightbox-titulo">Figura Ampliada</h3>
              <span class="lightbox-subtitulo" id="lightbox-subtitulo">Visualización a pantalla completa</span>
            </div>
            <div class="lightbox-controles">
              <button type="button" class="btn-control-lightbox" id="btn-lightbox-zoom-in" title="Acercar (+)">＋</button>
              <button type="button" class="btn-control-lightbox" id="btn-lightbox-zoom-out" title="Alejar (-)">－</button>
              <button type="button" class="btn-control-lightbox" id="btn-lightbox-zoom-reset" title="Restablecer tamaño (100%)">⟲ 100%</button>
              <a id="btn-lightbox-abrir-nueva-pestana" href="#" target="_blank" rel="noopener" class="btn-control-lightbox" title="Abrir recurso original en pestaña nueva ↗">↗</a>
              <button type="button" class="btn-control-lightbox btn-cerrar-lightbox" id="btn-cerrar-lightbox" title="Cerrar (ESC)">✕</button>
            </div>
          </header>

          <div class="lightbox-viewport" id="lightbox-viewport">
            <div class="lightbox-canvas" id="lightbox-canvas"></div>
          </div>

          <footer class="lightbox-footer">
            <span class="lightbox-ayuda-teclado">💡 <strong>[ESC]</strong> Cerrar · <strong>[Rueda / Pellizco]</strong> Zoom · <strong>[Arrastrar / Táctil]</strong> Desplazar</span>
            <span class="lightbox-escala-indicador" id="lightbox-escala-indicador">Escala: 100%</span>
          </footer>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    // Configurar listeners una sola vez
    if (!overlay.dataset || !overlay.dataset.listenersConfigurados) {
      if (overlay.dataset) overlay.dataset.listenersConfigurados = 'true';

      const btnCerrar = overlay.querySelector('#btn-cerrar-lightbox');
      if (btnCerrar) btnCerrar.onclick = cerrarLightboxFigura;

      const btnIn = overlay.querySelector('#btn-lightbox-zoom-in');
      if (btnIn) btnIn.onclick = () => aplicarZoom(0.25);

      const btnOut = overlay.querySelector('#btn-lightbox-zoom-out');
      if (btnOut) btnOut.onclick = () => aplicarZoom(-0.25);

      const btnReset = overlay.querySelector('#btn-lightbox-zoom-reset');
      if (btnReset) btnReset.onclick = () => aplicarZoom(0, true);

      // Cerrar al hacer clic en el backdrop
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cerrarLightboxFigura();
        }
      });

      // Viewport Pan y Zoom (Ratón y Pantallas Táctiles Multi-Dispositivo)
      const viewport = overlay.querySelector('#lightbox-viewport');
      if (viewport) {
        let initialPinchDist = null;
        let initialPinchZoom = 1.0;

        viewport.addEventListener('mousedown', (e) => {
          if (e.target.closest && (e.target.closest('.lightbox-header') || e.target.closest('.lightbox-footer') || e.target.closest('button') || e.target.closest('a'))) return;
          lightboxState.isDragging = true;
          lightboxState.startX = e.clientX - lightboxState.panX;
          lightboxState.startY = e.clientY - lightboxState.panY;
          viewport.classList.add('is-dragging');
        });

        viewport.addEventListener('touchstart', (e) => {
          if (e.target.closest && (e.target.closest('.lightbox-header') || e.target.closest('.lightbox-footer') || e.target.closest('button') || e.target.closest('a'))) return;
          if (e.touches.length === 1) {
            lightboxState.isDragging = true;
            lightboxState.startX = e.touches[0].clientX - lightboxState.panX;
            lightboxState.startY = e.touches[0].clientY - lightboxState.panY;
            initialPinchDist = null;
          } else if (e.touches.length === 2) {
            lightboxState.isDragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDist = Math.hypot(dx, dy);
            initialPinchZoom = lightboxState.zoom;
          }
        }, { passive: true });

        viewport.addEventListener('touchmove', (e) => {
          if (e.touches.length === 1 && lightboxState.isDragging) {
            if (e.cancelable) e.preventDefault();
            lightboxState.panX = e.touches[0].clientX - lightboxState.startX;
            lightboxState.panY = e.touches[0].clientY - lightboxState.startY;
            actualizarTransformCanvas();
          } else if (e.touches.length === 2 && initialPinchDist) {
            if (e.cancelable) e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const factor = dist / initialPinchDist;
            const nuevoZoom = Math.max(lightboxState.minZoom, Math.min(lightboxState.maxZoom, initialPinchZoom * factor));
            lightboxState.zoom = parseFloat(nuevoZoom.toFixed(2));
            actualizarTransformCanvas();
          }
        }, { passive: false });

        viewport.addEventListener('touchend', () => {
          lightboxState.isDragging = false;
          initialPinchDist = null;
        }, { passive: true });

        if (typeof window !== 'undefined') {
          window.addEventListener('mousemove', (e) => {
            if (!lightboxState.isDragging) return;
            e.preventDefault();
            lightboxState.panX = e.clientX - lightboxState.startX;
            lightboxState.panY = e.clientY - lightboxState.startY;
            actualizarTransformCanvas();
          });

          window.addEventListener('mouseup', () => {
            if (lightboxState.isDragging) {
              lightboxState.isDragging = false;
              viewport.classList.remove('is-dragging');
            }
          });

          viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.2 : -0.2;
            aplicarZoom(delta);
          }, { passive: false });

          viewport.addEventListener('dblclick', (e) => {
            if (e.target.closest && (e.target.closest('button') || e.target.closest('a'))) return;
            if (lightboxState.zoom > 1.1) {
              aplicarZoom(0, true);
            } else {
              aplicarZoom(0.8);
            }
          });

          // Teclado
          window.addEventListener('keydown', (e) => {
            if (!lightboxState.abierto) return;
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              cerrarLightboxFigura();
            } else if (e.key === '+' || e.key === '=') {
              e.preventDefault();
              aplicarZoom(0.25);
            } else if (e.key === '-' || e.key === '_') {
              e.preventDefault();
              aplicarZoom(-0.25);
            } else if (e.key === '0') {
              e.preventDefault();
              aplicarZoom(0, true);
            }
          });
        }
      }
    }

    return overlay;
  }

  function actualizarTransformCanvas() {
    if (typeof document === 'undefined') return;
    const canvas = document.getElementById('lightbox-canvas');
    const indicador = document.getElementById('lightbox-escala-indicador');
    if (canvas && canvas.style) {
      canvas.style.transform = `translate(${lightboxState.panX}px, ${lightboxState.panY}px) scale(${lightboxState.zoom})`;
    }
    if (indicador) {
      indicador.textContent = `Escala: ${Math.round(lightboxState.zoom * 100)}%`;
    }
  }

  function aplicarZoom(delta, reset = false) {
    if (reset) {
      lightboxState.zoom = 1.0;
      lightboxState.panX = 0;
      lightboxState.panY = 0;
    } else {
      const nuevoZoom = Math.max(lightboxState.minZoom, Math.min(lightboxState.maxZoom, lightboxState.zoom + delta));
      lightboxState.zoom = parseFloat(nuevoZoom.toFixed(2));
    }
    actualizarTransformCanvas();
  }

  function abrirLightboxGenerico(htmlContenido, badgeTexto, tituloTexto, subtituloTexto, urlRecurso = null) {
    const overlay = asegurarLightboxEnDOM();
    if (!overlay) return;
    const canvas = document.getElementById('lightbox-canvas');
    const badge = document.getElementById('lightbox-tipo-badge');
    const titulo = document.getElementById('lightbox-titulo');
    const subtitulo = document.getElementById('lightbox-subtitulo');
    const btnPestana = document.getElementById('btn-lightbox-abrir-nueva-pestana');

    if (canvas) canvas.innerHTML = htmlContenido;
    if (badge) badge.textContent = badgeTexto;
    if (titulo) titulo.textContent = tituloTexto;
    if (subtitulo) subtitulo.textContent = subtituloTexto;

    if (btnPestana) {
      if (urlRecurso) {
        btnPestana.href = urlRecurso;
        btnPestana.style.display = 'inline-flex';
      } else {
        btnPestana.style.display = 'none';
      }
    }

    lightboxState.abierto = true;
    lightboxState.zoom = 1.0;
    lightboxState.panX = 0;
    lightboxState.panY = 0;
    actualizarTransformCanvas();

    if (overlay.style) overlay.style.display = 'flex';
    if (overlay.setAttribute) overlay.setAttribute('aria-hidden', 'false');
    if (typeof document !== 'undefined' && document.body && document.body.style) {
      document.body.style.overflow = 'hidden';
    }
  }

  function abrirLightboxImagenDeStoryboard(storyboardId) {
    const sb = STORYBOARDS.find(s => s && s.id === storyboardId);
    if (!sb) return;
    const targetSrc = sb.imagenDestacada || sb.imagen;
    abrirLightboxImagen(targetSrc, sb.titulo, sb.piePortada || sb.dimensionNombre);
  }

  function abrirLightboxImagen(src, titulo, subtitulo) {
    const esSvg = typeof src === 'string' && src.toLowerCase().endsWith('.svg');
    const inlineDims = esSvg
      ? 'width="800" height="800" style="width:min(760px, 88vw); height:min(760px, 76vh); object-fit:contain; display:block;"'
      : 'width="2200" height="1423" style="max-width:min(1400px, 92vw); max-height:78vh; width:auto; height:auto; display:block; object-fit:contain;"';
    const onErrorFallback = `onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src=this.src.startsWith('src/')?this.src.slice(4):'src/'+this.src;}"`;
    const html = `<img src="${src}" alt="${titulo}" id="img-lightbox-activa" decoding="async" ${onErrorFallback} ${inlineDims} draggable="false">`;
    abrirLightboxGenerico(html, '🗺️ CARTOGRAFÍA / IMAGEN', titulo, subtitulo || 'Visualización a pantalla completa', src);
  }

  function abrirLightboxDiagrama(storyboardId) {
    const sb = STORYBOARDS.find(s => s && s.id === storyboardId);
    if (!sb) return;
    let svgContent = typeof sb.contenido.diagramaSVG === 'function' ? sb.contenido.diagramaSVG() : '<p>Diagrama no disponible</p>';
    // Garantizar dimensiones explícitas y escalado vectorial responsivo en cualquier navegador y pantalla
    svgContent = svgContent.replace(
      /<svg\b([^>]*)>/i,
      '<svg$1 style="width:min(1100px, 88vw); min-width:min(680px, 84vw); height:auto; max-height:74vh; display:block;">'
    );
    const html = `<div class="lightbox-svg-wrapper" style="width:min(1120px, 90vw); display:flex; align-items:center; justify-content:center;">${svgContent}</div>`;
    abrirLightboxGenerico(html, '📐 DIAGRAMA TÉCNICO VECTORIAL', `Diagrama: ${sb.titulo}`, 'Síntesis esquemática vectorial en escala ampliada', null);
  }

  function renderizarGraficoParaLightbox(g) {
    return `
      <div class="lightbox-chart-content">
        <h3 style="color:#ffffff; margin:0 0 14px 0; font-size:1.25rem; line-height:1.35;">📊 ${g.titulo}</h3>
        <p style="color:#94a3b8; font-size:0.88rem; margin-bottom:22px;">Distribución cuantitativa y comparativa territorial para la Comuna de Santiago y el Barrio Brasil.</p>
        <div style="display:flex; flex-direction:column; gap:14px;">
          ${g.filas.map(f => `
            <div class="lightbox-chart-row">
              <span class="lightbox-chart-label">${f.label}</span>
              <div class="lightbox-chart-track">
                <div style="height:100%; width:${f.porcentaje}%; background:linear-gradient(90deg, #0284c7 0%, #38bdf8 100%); border-radius:6px;"></div>
              </div>
              <span class="lightbox-chart-value">${f.valor}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function abrirLightboxGrafico(storyboardId) {
    const sb = STORYBOARDS.find(s => s && s.id === storyboardId);
    if (!sb || !sb.contenido.graficoComparativo) return;
    const g = sb.contenido.graficoComparativo;
    const html = renderizarGraficoParaLightbox(g);
    abrirLightboxGenerico(html, '📈 GRÁFICO COMPARATIVO', `Comparativa: ${g.titulo}`, 'Distribución métrica y comparativa ampliada', null);
  }

  function abrirLightboxGraficoInline(storyboardId, secIdx) {
    const sb = STORYBOARDS.find(s => s && s.id === storyboardId);
    if (!sb || !Array.isArray(sb.contenido.seccionesAnaliticas)) return;
    const sec = sb.contenido.seccionesAnaliticas[secIdx];
    if (!sec || !sec.graficoInline) return;
    const g = sec.graficoInline;
    const html = renderizarGraficoParaLightbox(g);
    abrirLightboxGenerico(html, '📊 EVIDENCIA CUANTITATIVA', g.titulo, sec.titulo || 'Distribución cuantitativa del hallazgo territorial', null);
  }

  function cerrarLightboxFigura() {
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('lightbox-figura-overlay');
    if (overlay) {
      if (overlay.style) overlay.style.display = 'none';
      if (overlay.setAttribute) overlay.setAttribute('aria-hidden', 'true');
    }
    lightboxState.abierto = false;
    lightboxState.zoom = 1.0;
    lightboxState.panX = 0;
    lightboxState.panY = 0;

    // Si la lámina modal está abierta, mantener body overflow hidden
    const laminaOverlay = document.getElementById('lamina-storyboard-overlay');
    if (laminaOverlay && laminaOverlay.style && laminaOverlay.style.display !== 'none') {
      if (document.body && document.body.style) document.body.style.overflow = 'hidden';
    } else {
      if (document.body && document.body.style) document.body.style.overflow = '';
    }
  }


  /**
   * Conmuta a la pestaña del visor y activa una capa específica
   */
  function activarCapaEnMapa(capaId, tipo = 'oficial') {
    cerrarLaminaStoryboard();
    
    // Activar pestaña del visor 'inicio'
    if (window.activarPanel) {
      window.activarPanel('inicio');
    }

    setTimeout(() => {
      if (tipo === 'vgi') {
        const btnCat = document.getElementById(`btn-cat-${capaId}`);
        if (btnCat) {
          btnCat.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (!btnCat.classList.contains('activo')) {
            btnCat.click();
          }
        }
      } else {
        const btnOficial = document.getElementById(`btn-oficial-${capaId}`);
        if (btnOficial) {
          // Asegurar que el acordeón temático oficial de IDE Chile esté abierto
          const detailsParent = btnOficial.closest('details');
          if (detailsParent) detailsParent.open = true;
          btnOficial.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (!btnOficial.classList.contains('activo')) {
            btnOficial.click();
          }
        }
      }
    }, 300);
  }

  /**
   * Activa las capas representativas de un storyboard en el mapa
   */
  function activarCapasDeHistoria(storyboardId) {
    const sb = STORYBOARDS.find(s => s && s.id === storyboardId);
    if (!sb || !sb.capasRelevantes) return;

    cerrarLaminaStoryboard();

    if (window.activarPanel) {
      window.activarPanel('inicio');
    }

    setTimeout(() => {
      // Activar las primeras 2 capas relevantes para no saturar el visor
      sb.capasRelevantes.slice(0, 2).forEach(cId => {
        if (cId.startsWith('cat0') || cId.startsWith('cat1')) {
          const catKey = cId.replace(/^cat\d\d_/, '');
          const btn = document.getElementById(`btn-cat-${catKey}`);
          if (btn && !btn.classList.contains('activo')) btn.click();
        } else {
          const btn = document.getElementById(`btn-oficial-${cId}`);
          if (btn) {
            const detailsParent = btn.closest('details');
            if (detailsParent) detailsParent.open = true;
            if (!btn.classList.contains('activo')) btn.click();
          }
        }
      });

      // Reencuadrar mapa si existe el botón
      const btnReencuadrar = document.getElementById('btn-reencuadrar-mapa');
      if (btnReencuadrar) btnReencuadrar.click();
    }, 350);
  }

  return {
    inicializar: renderizarModulo,
    alternarDimension,
    filtrarCapasAcordeon,
    filtrarPorTipo,
    colapsarAcordeon,
    restablecerFiltros,
    abrirLaminaStoryboard,
    cerrarLaminaStoryboard,
    abrirLightboxImagenDeStoryboard,
    abrirLightboxImagen,
    abrirLightboxDiagrama,
    abrirLightboxGrafico,
    abrirLightboxGraficoInline,
    abrirLightboxGenerico,
    cerrarLightboxFigura,
    aplicarZoom,
    activarCapaEnMapa,
    activarCapasDeHistoria,
    resolverDefinicionCapa,
    obtenerDimensiones: () => DIMENSIONES,
    obtenerStoryboards: () => STORYBOARDS
  };

})();

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.ModuloIndicadoresAnalisis = ModuloIndicadoresAnalisis;
}
