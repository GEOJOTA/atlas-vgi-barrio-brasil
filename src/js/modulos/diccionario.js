/*
  diccionario.js
  --------------
  Diccionario de metadatos, atributos normalizados y etiquetas territoriales
  para el Atlas de Información Geográfica Voluntaria (Barrio Brasil / UAH).
  Traduce la jerga técnica de OpenStreetMap a conceptos comprensibles para
  instituciones, organizaciones comunitarias y estudiantes.
*/

const ModuloDiccionario = (() => {

  const ATRIBUTOS_NORMALIZADOS = [
    {
      campo: 'id_vgi',
      nombre: 'Identificador Único VGI',
      tipo: 'Texto (Alfanumérico)',
      definicion: 'Identificador global persistente formado por la fuente, el tipo de geometría y el ID numérico (ej: OSM/node/906429642).',
      ejemplo: 'OSM/node/906429642',
      equivalenciaIDE: 'Código Identificador de Objeto Geográfico (ID_OBJETO / gmd:identifier)',
      importancia: 'Permite evitar duplicados y referenciar unívocamente la entidad en auditorías y cruces en QGIS.'
    },
    {
      campo: 'categoria',
      nombre: 'Categoría Temática VGI',
      tipo: 'Texto (Código CAT-01 a CAT-10)',
      definicion: 'Clasificación sectorial del objeto territorial según la taxonomía del Atlas (educación, servicios y comercio barrial, transporte público, movilidad activa, áreas verdes y recreación, patrimonio cultural, accesibilidad universal, biodiversidad urbana, edificaciones y coberturas de suelo).',
      ejemplo: 'CAT-01 (Educación y Universidad)',
      equivalenciaIDE: 'Categoría Temática ISO 19115 (gmd:topicCategory)',
      importancia: 'Facilita la agregación estadística y el análisis multicriterio para diagnósticos comunales.'
    },
    {
      campo: 'subtipo',
      nombre: 'Subtipo Semántico / Actividad',
      tipo: 'Texto',
      definicion: 'Especificación puntual de la actividad o uso del suelo (ej: university, pharmacy, bus_stop, park, historic, kerb).',
      ejemplo: 'university, pharmacy, cycleway',
      equivalenciaIDE: 'Tipo de Objeto Catastral / Subclase',
      importancia: 'Determina la función exacta del equipamiento en la trama barrial.'
    },
    {
      campo: 'nombre',
      nombre: 'Nombre Propio / Denominación',
      tipo: 'Texto',
      definicion: 'Nombre oficial o comercial con el cual la comunidad o institución reconoce el lugar en el territorio.',
      ejemplo: 'Universidad Alberto Hurtado - Casa Central, Farmacia Ahumada, Plaza Brasil',
      equivalenciaIDE: 'Toponimia Oficial / Nombre Geográfico (gmd:title)',
      importancia: 'Permite la búsqueda toponímica y la orientación espacial en terreno.'
    },
    {
      campo: 'operador',
      nombre: 'Operador / Entidad Administradora',
      tipo: 'Texto',
      definicion: 'Institución pública, empresa u organización comunitaria responsable de la administración o mantención del equipamiento.',
      ejemplo: 'Universidad Alberto Hurtado, Metro de Santiago, Ilustre Municipalidad de Santiago',
      equivalenciaIDE: 'Punto de Contacto Responsable (gmd:CI_ResponsibleParty / Custodio)',
      importancia: 'Clave para autoridades: identifica a quién corresponde gestionar o fiscalizar el recinto.'
    },
    {
      campo: 'direccion',
      nombre: 'Dirección Catastral / Numeración',
      tipo: 'Texto',
      definicion: 'Calle y número domiciliario de acceso principal al inmueble o equipamiento.',
      ejemplo: 'Almirante Barroso 10, Alameda 1869, Erasmo Escala 1822',
      equivalenciaIDE: 'Dirección Domiciliaria / Localización por Dirección',
      importancia: 'Permite geocodificación inversa y contrastación con el catastro comunal del SII.'
    },
    {
      campo: 'accesibilidad',
      nombre: 'Accesibilidad Universal (Silla de Ruedas)',
      tipo: 'Texto (yes / limited / no / designated)',
      definicion: 'Condición de acceso físico para personas con movilidad reducida o en silla de ruedas (rampas, puertas anchas, desniveles).',
      ejemplo: 'yes (totalmente accesible), limited (requiere ayuda), no (infranqueable con peldaños)',
      equivalenciaIDE: 'Atributo de Calidad de Acceso / Infraestructura Inclusiva',
      importancia: 'Fundamental para organizaciones comunitarias e inclusión urbana en Barrio Brasil.'
    },
    {
      campo: 'fuente',
      nombre: 'Fuente de Adquisición',
      tipo: 'Texto',
      definicion: 'Plataforma proveedora del dato espacial (OpenStreetMap, Geofabrik RM, GBIF Occurrence API, iNaturalist, IDE Chile).',
      ejemplo: 'OpenStreetMap (API Overpass) / Geofabrik (Extracto RM) / GBIF',
      equivalenciaIDE: 'Linaje y Procedencia (gmd:LI_Lineage)',
      importancia: 'Garantiza la trazabilidad del dato y la transparencia metodológica.'
    },
    {
      campo: 'metodo_adquisicion',
      nombre: 'Método de Adquisición y Extracción',
      tipo: 'Texto',
      definicion: 'Método técnico empleado para la obtención del dato territorial (proceso masivo dump regional vs query transaccional Overpass en vivo).',
      ejemplo: 'Descarga Geofabrik (Dump PBF regional) / Consulta API Overpass en vivo',
      equivalenciaIDE: 'Paso de Proceso / Método (gmd:LI_ProcessStep)',
      importancia: 'Permite diferenciar capas precargadas de alta densidad de consultas dinámicas en tiempo real.'
    },
    {
      campo: 'licencia',
      nombre: 'Marco Jurídico de Licenciamiento',
      tipo: 'Texto',
      definicion: 'Licencia bajo la cual se comparten y pueden reutilizarse los datos espaciales.',
      ejemplo: 'ODbL 1.0 (OpenStreetMap), CC-BY 4.0 (GBIF), Datos Abiertos Estado de Chile',
      equivalenciaIDE: 'Restricciones Legales y de Uso (gmd:MD_LegalConstraints)',
      importancia: 'Asegura que el uso por parte de municipios o estudiantes respete la ley de propiedad intelectual.'
    },
    {
      campo: 'coordenadas',
      nombre: 'Geometría Espacial (Latitud / Longitud)',
      tipo: 'Punto [Longitud, Latitud] en WGS84 (EPSG:4326)',
      definicion: 'Ubicación geográfica absoluta expresada en grados decimales.',
      ejemplo: '[-70.66214, -33.44991]',
      equivalenciaIDE: 'Sistema de Referencia Espacial SIRGAS-Chile (EPSG:5360 / EPSG:4326)',
      importancia: 'Permite abrir directamente las capas en QGIS, ArcGIS, Google Earth o Leaflet.'
    },
    {
      campo: 'geom_wkt',
      nombre: 'Geometría Vectorial Well-Known Text (WKT)',
      tipo: 'Texto (WKT OGC)',
      definicion: 'Representación textual estándar OGC de la geometría vectorial (Point, LineString, Polygon, MultiPolygon).',
      ejemplo: 'POINT(-70.66214 -33.44991) / POLYGON((...))',
      equivalenciaIDE: 'Geometría del Objeto Espacial (OGC SFA / ISO 19107)',
      importancia: 'Interoperabilidad directa con motores espaciales SQL (PostGIS ST_GeomFromText) y QGIS.'
    },
    {
      campo: 'bbox',
      nombre: 'Envolvente Geográfica (Bounding Box)',
      tipo: 'Arreglo [minX, minY, maxX, maxY]',
      definicion: 'Caja delimitadora rectangular precomputada por entidad en EPSG:4326.',
      ejemplo: '[-70.665, -33.448, -70.661, -33.445]',
      equivalenciaIDE: 'Extensión Geográfica Delimitada (gmd:EX_GeographicBoundingBox)',
      importancia: 'Permite filtrado espacial O(1) ultrarrápido por tesela en el visor Leaflet sin sobrecargar memoria.'
    },
    {
      campo: 'fecha_registro',
      nombre: 'Fecha de Registro / Actualización',
      tipo: 'Fecha ISO 8601 (AAAA-MM-DD)',
      definicion: 'Marca temporal de la última edición o captura del objeto espacial en la fuente original.',
      ejemplo: '2026-09-24',
      equivalenciaIDE: 'Fecha de Captura / Temporalidad (gmd:dateStamp)',
      importancia: 'Vital para auditoría temporal bajo ISO 19157 y detección de obsolescencia barrial.'
    },
    {
      campo: 'superficie_m2',
      nombre: 'Superficie Métrica (m²)',
      tipo: 'Numérico (Decimal / Entero)',
      definicion: 'Área calculada de la geometría poligonal tras reproyectar de WGS84 geográfico a coordenadas proyectadas planas métricas EPSG:32719 (UTM 19S) mediante la fórmula de Gauss (Shoelace).',
      ejemplo: '1,420.5 m²',
      equivalenciaIDE: 'Superficie de Objeto Territorial (gmd:EX_Extent / Área métrica)',
      importancia: 'Permite análisis cuantitativos de densidad de ocupación del suelo, huella de edificación y dotación de áreas verdes en el barrio.'
    },
    {
      campo: 'superficie_ha',
      nombre: 'Superficie en Hectáreas (ha)',
      tipo: 'Numérico (Decimal)',
      definicion: 'Equivalencia de la superficie métrica expresada en hectáreas (1 ha = 10.000 m²).',
      ejemplo: '0.14 ha',
      equivalenciaIDE: 'Área en Hectáreas / Indicador Territorial',
      importancia: 'Facilita la comparación de escalas mayores para instrumentos de planificación comunal (PRC).'
    },
    {
      campo: 'srs_superficie',
      nombre: 'Sistema de Referencia Geodésico del Cálculo',
      tipo: 'Texto (Código EPSG y Denominación Oficial)',
      definicion: 'Sistema de referencia de coordenadas proyectado empleado para garantizar métricas de área euclidianas no distorsionadas.',
      ejemplo: 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)',
      equivalenciaIDE: 'Sistema de Coordenadas de Referencia (gmd:MD_ReferenceSystem / EPSG:5361)',
      importancia: 'Garantiza la trazabilidad geodésica requerida por los estándares del SNIT e IDE Chile.'
    },
// --- Variables de Residuos Sólidos Domiciliarios (SUBDERE RSD 2024) ---
    {
      campo: 'rsdya_ton',
      nombre: 'Generación Anual de Residuos Sólidos Domiciliarios y Asimilables (Ton/año)',
      tipo: 'Numérico (Toneladas métricas anuales)',
      definicion: 'Masa anual de residuos sólidos domiciliarios y asimilables recolectada y transportada para su disposición final autorizada.',
      ejemplo: '45,210.5 Ton/año',
      equivalenciaIDE: 'Generación Comunal de Residuos (SUBDERE RSD / SINIM)',
      importancia: 'Permite dimensionar la huella metabólica de residuos del territorio barrial y comunal.'
    },
    {
      campo: 'ppc_kg_hab_dia',
      nombre: 'Producción Per Cápita de Residuos (kg/hab·día)',
      tipo: 'Numérico (Decimal en kilogramos)',
      definicion: 'Tasa promedio de generación diaria de residuos por habitante, calculada tanto sobre población residente (PCA) como corregida por población flotante (PTA).',
      ejemplo: '1.14 kg/hab·día',
      equivalenciaIDE: 'Índice de Generación Per Cápita (SUBDERE)',
      importancia: 'Indicador fundamental para evaluar la sustentabilidad del consumo y eficiencia del reciclaje barrial.'
    },
    {
      campo: 'pta_poblacion_atendida',
      nombre: 'Población Total Atendida (PTA = PCA + PFP)',
      tipo: 'Numérico (Personas)',
      definicion: 'Población total cubierta por el servicio de aseo, sumando la población residente censalmente atendida (PCA) y la población flotante turística (PFP).',
      ejemplo: '532,400 hab.',
      equivalenciaIDE: 'Cobertura Demográfica del Servicio Sanitario (SUBDERE)',
      importancia: 'Esencial en Santiago Centro y Barrio Brasil debido al alto volumen de estudiantes y trabajadores flotantes.'
    },
    {
      campo: 'costo_aseo_anual',
      nombre: 'Costo Total Anual del Servicio de Aseo Municipal ($/año)',
      tipo: 'Moneda ($ CLP devengado)',
      definicion: 'Presupuesto total devengado anualmente por el municipio para los contratos de recolección, transporte y disposición final en rellenos sanitarios.',
      ejemplo: '$14,250,800,000',
      equivalenciaIDE: 'Presupuesto de Aseo y Ornato (SINIM / SUBDERE)',
      importancia: 'Permite comparar el costo fiscal de la gestión de residuos y la recaudación por derechos de aseo.'
    },
    {
      campo: 'criticidad_sdf',
      nombre: 'Índice de Criticidad del Sitio de Disposición Final (Relleno Sanitario)',
      tipo: 'Texto (Nivel de Criticidad)',
      definicion: 'Evaluación técnica de riesgo sanitario y capacidad operativa considerando los años de vida útil remanente y la presión poblacional atendida.',
      ejemplo: 'Media / Alta',
      equivalenciaIDE: 'Estado Sanitario y Vulnerabilidad de Infraestructura (SUBDERE)',
      importancia: 'Alerta sobre la inminente saturación de rellenos metropolitanos (Santa Marta, Loma Los Colorados, Santiago Poniente).'
    },
    {
      campo: 'distancia_transporte_sdf',
      nombre: 'Distancia de Transporte a Relleno Sanitario (km)',
      tipo: 'Numérico (Kilómetros de ruta)',
      definicion: 'Distancia kilométrica efectiva de viaje desde el centro comunal hasta el sitio de disposición final autorizado.',
      ejemplo: '64.8 km',
      equivalenciaIDE: 'Logística de Residuos Urbanos (SUBDERE)',
      importancia: 'Determina las emisiones de gases de efecto invernadero y el gasto en combustible de la flota de camiones recolectores.'
    },
    {
      campo: 'zona_aseo',
      nombre: 'Macro-Zona Operativa de Aseo y Residuos',
      tipo: 'Texto (Categoría Territorial)',
      definicion: 'Zonificación operativa municipal de aseo (Oriente, Centro Oriente, Centro Poniente, Centro Plaza, Poniente) adaptada para la gestión, fiscalización y mantenimiento de contenedores y papeleros.',
      ejemplo: 'Centro Poniente',
      equivalenciaIDE: 'Zona Operacional de Aseo / Sectorización Municipal',
      importancia: 'Permite desagregar las políticas de acopio y recolección de residuos en unidades territoriales homogéneas.'
    },
    {
      campo: 'contenedores_tot',
      nombre: 'Total de Contenedores de Acopio Volumétrico',
      tipo: 'Numérico Entero (Unidades)',
      definicion: 'Número total de contenedores de carga domiciliaria y comercial instalados en la calzada o acera dentro de la macro-zona.',
      ejemplo: '261 unidades',
      equivalenciaIDE: 'Infraestructura de Acopio de Residuos Sólidos (MuniSTGO)',
      importancia: 'Cuantifica el volumen de equipamiento primario disponible para la disposición de residuos de vecinos y locatarios.'
    },
    {
      campo: 'papeleros_tot',
      nombre: 'Total de Papeleros Peatonales',
      tipo: 'Numérico Entero (Unidades)',
      definicion: 'Número de papeleros o basureros peatonales destinados al descarte rápido de residuos menores por transeúntes.',
      ejemplo: '24 unidades',
      equivalenciaIDE: 'Mobiliario Urbano de Paseo y Vía Pública',
      importancia: 'Esencial para evaluar la limpieza de paseos peatonales, paraderos y áreas de alta circulación.'
    },
    {
      campo: 'capacidad_total_litros',
      nombre: 'Capacidad Total de Acopio Simultáneo (Litros)',
      tipo: 'Numérico Entero (Litros)',
      definicion: 'Volumen total de almacenamiento simultáneo en litros resultante de la ponderación por tipología de contenedor (240L, 360L y 770L).',
      ejemplo: '109,660 L',
      equivalenciaIDE: 'Capacidad de Acopio Comunal de Residuos',
      importancia: 'Permite estimar la suficiencia volumétrica frente a la generación diaria de residuos de la población atendida.'
    },
    {
      campo: 'ratio_contenedores_papeleros',
      nombre: 'Ratio Contenedores / Papeleros',
      tipo: 'Numérico Flotante (Razón C/P)',
      definicion: 'Relación cuantitativa entre contenedores de acopio volumétrico y papeleros peatonales instalados.',
      ejemplo: '10.88',
      equivalenciaIDE: 'Índice de Balance de Equipamiento de Aseo',
      importancia: 'Identifica desequilibrios espaciales entre acopio domiciliario/comercial y mobiliario para peatones en el espacio público.'
    },
    {
      campo: 'tasa_deterioro_pct',
      nombre: 'Tasa de Deterioro Físico de Contenedores (%)',
      tipo: 'Porcentaje (%)',
      definicion: 'Porcentaje de contenedores catastrados en terreno cuyo estado de conservación fue clasificado como Regular o Malo.',
      ejemplo: '91.19%',
      equivalenciaIDE: 'Estado de Conservación de Mobiliario Urbano',
      importancia: 'Prioriza zonas de intervención urgente para el recambio o reparación de infraestructura deteriorada.'
    }
  ];

  const ETIQUETAS_TERRITORIALES_OSM = [
  {
    "tag": "amenity=university",
    "significado": "Campus Universitario / Sede Central",
    "categoria": "CAT-01",
    "grupo": "educacion_servicios",
    "institucion": "MINEDUC / CRUCH",
    "ideChile": "Establecimientos de Educación Superior (MINEDUC / IDE Chile)",
    "aplicacionUAH": "Universidad Alberto Hurtado (Casa Central Barroso 10)",
    "citaAPA": "(MINEDUC, 2023; WikiProject Chile, 2024)"
  },
  {
    "tag": "amenity=college",
    "significado": "Instituto Profesional (IP) / Centro Formación Técnica (CFT)",
    "categoria": "CAT-01",
    "grupo": "educacion_servicios",
    "institucion": "MINEDUC / Subsecretaría de Educación Superior",
    "ideChile": "Establecimientos de Educación Superior - IP y CFT (MINEDUC / IDE Chile)",
    "aplicacionUAH": "Sedes de educación técnica en eje Alameda y República",
    "citaAPA": "(MINEDUC, 2023)"
  },
  {
    "tag": "amenity=school",
    "significado": "Colegio / Escuela Básica / Liceo Tradicional",
    "categoria": "CAT-01",
    "grupo": "educacion_servicios",
    "institucion": "MINEDUC / SLEP Santiago",
    "ideChile": "Establecimientos de Educación Escolar (MINEDUC / IDE Chile)",
    "aplicacionUAH": "Liceo Miguel Luis Amunátegui / Escuela Rep. de Panamá",
    "citaAPA": "(MINEDUC, 2023; IDE Chile / SNIT, 2024)"
  },
  {
    "tag": "amenity=kindergarten",
    "significado": "Jardín Infantil / Sala Cuna (JUNJI / Integra)",
    "categoria": "CAT-01",
    "grupo": "educacion_servicios",
    "institucion": "Subsecretaría de Educación Parvularia",
    "ideChile": "Establecimientos de Educación Parvularia (JUNJI - Integra / IDE Chile)",
    "aplicacionUAH": "Jardín Infantil Barrial JUNJI calle Cienfuegos",
    "citaAPA": "(JUNJI, 2022; MINEDUC, 2023)"
  },
  {
    "tag": "amenity=library",
    "significado": "Biblioteca Pública o Universitaria",
    "categoria": "CAT-01",
    "grupo": "educacion_servicios",
    "institucion": "Servicio Nacional del Patrimonio Cultural (SERPAT)",
    "ideChile": "Red de Bibliotecas Públicas (SERPAT / IDE Chile)",
    "aplicacionUAH": "Biblioteca Central UAH / Biblioteca de Santiago",
    "citaAPA": "(SERPAT, 2023; UAH, 2023)"
  },
  {
    "tag": "amenity=student_accommodation",
    "significado": "Residencia Universitaria / Pensionado Estudiantil",
    "categoria": "CAT-01",
    "grupo": "educacion_servicios",
    "institucion": "MINEDUC / Instituciones Universitarias",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Residencias universitarias en eje Almirante Barroso",
    "citaAPA": "(MINEDUC, 2023)"
  },
  {
    "tag": "amenity=research_institute",
    "significado": "Centro de Investigación / Instituto Científico",
    "categoria": "CAT-01",
    "grupo": "educacion_servicios",
    "institucion": "Ministerio de Ciencia, Tecnología e Innovación",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Centros de investigación de facultades UAH",
    "citaAPA": "(OECD, 2017; UAH, 2023)"
  },
  {
    "tag": "amenity=music_school",
    "significado": "Conservatorio / Academia de Música y Artes",
    "categoria": "CAT-01",
    "grupo": "educacion_servicios",
    "institucion": "MINCAP / MINEDUC",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Academias de música y arte en Barrio Brasil",
    "citaAPA": "(MINCAP, 2022)"
  },
  {
    "tag": "amenity=clinic",
    "significado": "CESFAM / CECOSF / Consultorio de Salud Familiar",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "MINSAL / FONASA (Modelo Salud Familiar)",
    "ideChile": "Establecimientos de Salud - Atención Primaria CESFAM (DEIS - MINSAL / IDE Chile)",
    "aplicacionUAH": "CESFAM N° 1 Ramón Corbalán Melgarejo",
    "citaAPA": "(MINSAL, 2023; IDE Chile / SNIT, 2024)"
  },
  {
    "tag": "amenity=hospital",
    "significado": "Hospital Público / Complejo Hospitalario / Clínica",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "MINSAL / Red Asistencial Pública",
    "ideChile": "Establecimientos de Salud - Hospitales (DEIS - MINSAL / IDE Chile)",
    "aplicacionUAH": "Hospital San Juan de Dios / Posta Central",
    "citaAPA": "(MINSAL, 2023; IDE Chile / SNIT, 2024)"
  },
  {
    "tag": "amenity=pharmacy",
    "significado": "Farmacia de Barrio / Farmacia Comunal Popular",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "MINSAL / Instituto de Salud Pública (ISP)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Farmacia Popular Comuna de Santiago / Cruz Verde Brasil",
    "citaAPA": "(ISP Chile, 2022; INE, 2021)"
  },
  {
    "tag": "amenity=dentist",
    "significado": "Consulta Odontológica / Clínica Dental",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "MINSAL / Colegio de Cirujano Dentistas",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Clínicas odontológicas universitarias en sector República",
    "citaAPA": "(MINSAL, 2023)"
  },
  {
    "tag": "amenity=veterinary",
    "significado": "Clínica Veterinaria / Atención de Mascotas",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "SUBDERE (Ley N° 21.020 Tenencia Responsable)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Clínica veterinaria barrial en calle Maturana",
    "citaAPA": "(SUBDERE, 2018)"
  },
  {
    "tag": "emergency=ambulance_station",
    "significado": "Base de Ambulancias SAMU (131)",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "MINSAL / SAMU Metropolitano",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Base SAMU Poniente en Hospital San Juan de Dios",
    "citaAPA": "(MINSAL, 2023)"
  },
  {
    "tag": "emergency=defibrillator",
    "significado": "Desfibrilador Externo Automático (DEA)",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "MINSAL (Ley N° 21.156 Desfibriladores Públicos)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "DEA en andenes de Metro Los Héroes y Santa Ana",
    "citaAPA": "(MINSAL, 2019)"
  },
  {
    "tag": "emergency=fire_hydrant",
    "significado": "Grifo de Incendio Urbano",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Superintendencia de Servicios Sanitarios (SISS) / Bomberos",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Grifo de incendio en Almirante Barroso esq. Alameda",
    "citaAPA": "(Bomberos de Chile, 2022; SISS, 2022)"
  },
  {
    "tag": "amenity=police",
    "significado": "Comisaría de Carabineros / Cuartel PDI",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Ministerio del Interior y Seguridad Pública",
    "ideChile": "Unidades Policiales y Comisarías (Carabineros de Chile / IDE Chile)",
    "aplicacionUAH": "3ª Comisaría de Carabineros de Santiago Centro",
    "citaAPA": "(Ministerio del Interior, 2022; Carabineros, 2023)"
  },
  {
    "tag": "amenity=fire_station",
    "significado": "Compañía del Cuerpo de Bomberos de Chile",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Junta Nacional de Cuerpos de Bomberos (Ley 20.564)",
    "ideChile": "Cuarteles de Bomberos (Bomberos de Chile / IDE Chile)",
    "aplicacionUAH": "11ª Compañía Pompa Italia (Calle República)",
    "citaAPA": "(Bomberos de Chile, 2022)"
  },
  {
    "tag": "man_made=surveillance",
    "significado": "Cámara de Televigilancia Municipal / Seguridad Ciudadana",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Subsecretaría de Prevención del Delito / Seguridad Vecinal",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Cámaras de televigilancia en esquinas de Plaza Brasil",
    "citaAPA": "(Ministerio del Interior, 2022)"
  },
  {
    "tag": "amenity=townhall",
    "significado": "Municipalidad / Edificio Consistorial",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "SUBDERE / Municipalidad de Santiago",
    "ideChile": "Edificios Consistoriales Municipales (SUBDERE / IDE Chile)",
    "aplicacionUAH": "Casa Consistorial / Centro Comunitario Municipal Brasil",
    "citaAPA": "(SUBDERE, 2022)"
  },
  {
    "tag": "office=government",
    "significado": "Oficina Pública Estatal (Registro Civil, SII, ChileAtiende)",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Ministerio de Justicia / Hacienda / Trabajo",
    "ideChile": "Inmuebles Fiscales y Servicios Públicos (Ministerio de Bienes Nacionales / IDE Chile)",
    "aplicacionUAH": "Sucursal Registro Civil Santiago Centro / ChileAtiende",
    "citaAPA": "(ChileAtiende, 2023; IDE Chile / SNIT, 2024)"
  },
  {
    "tag": "amenity=community_centre",
    "significado": "Sede Social / Junta de Vecinos (JJVV)",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "SUBDERE / Municipalidad de Santiago",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Junta de Vecinos Barrio Brasil (calle Huérfanos)",
    "citaAPA": "(INE, 2017; Municipalidad de Santiago, 2021)"
  },
  {
    "tag": "amenity=post_office",
    "significado": "Sucursal Postal (CorreosChile, Chilexpress, Starken)",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Ministerio de Transportes y Telecomunicaciones",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Sucursal CorreosChile en calle Moneda / Alameda",
    "citaAPA": "(Correos de Chile, 2023)"
  },
  {
    "tag": "shop=bakery",
    "significado": "Panadería / Amasandería Tradicional Chilena",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "SERCOTEC / Fomento Productivo Barrial",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Panadería Las Rosas Chicas / Panadería Brasil",
    "citaAPA": "(SERCOTEC, 2022; INE, 2021)"
  },
  {
    "tag": "shop=convenience",
    "significado": "Almacén de Barrio / Minimarket de Abarrotes",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "SERCOTEC / Economía Social Barrial",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Almacén Don Lucho (calle Cienfuegos)",
    "citaAPA": "(SERCOTEC, 2022; INE, 2021)"
  },
  {
    "tag": "shop=supermarket",
    "significado": "Supermercado de Cadena / Autoservicio",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Ministerio de Economía / INE",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Santa Isabel calle Brasil / Lider Express San Pablo",
    "citaAPA": "(INE, 2021; Taginfo Chile, 2026)"
  },
  {
    "tag": "amenity=marketplace",
    "significado": "Feria Libre Regulada / Mercado Municipal",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "ASOF Chile / I. Municipalidad de Santiago",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Feria Libre calle Esperanza / Mercado Cueto",
    "citaAPA": "(ASOF Chile, 2021; ODEPA, 2022)"
  },
  {
    "tag": "shop=alcohol",
    "significado": "Botillería Tradicional con Patente de Alcoholes",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Dirección de Rentas Municipales",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Botillería Barriocentro en calle Maturana",
    "citaAPA": "(INE, 2021)"
  },
  {
    "tag": "shop=greengrocer",
    "significado": "Verdulería / Frutería Local de Barrio",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "SERCOTEC",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Verdulería tradicional en calle Compañía de Jesús",
    "citaAPA": "(INE, 2021)"
  },
  {
    "tag": "shop=butcher",
    "significado": "Carnicería de Barrio",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "SEREMI de Salud / ISP",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Carnicería de barrio en calle Huérfanos",
    "citaAPA": "(INE, 2021)"
  },
  {
    "tag": "shop=hardware",
    "significado": "Ferretería de Barrio / Cerrajería",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "SERCOTEC",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Ferretería El Candado en calle Rosas",
    "citaAPA": "(INE, 2021)"
  },
  {
    "tag": "shop=kiosk",
    "significado": "Quiosco de Diarios, Revistas y Confites",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Sindicato de Suplementeros / Rentas Municipales",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Quiosco de suplementero en Alameda esq. Almirante Barroso",
    "citaAPA": "(INE, 2021)"
  },
  {
    "tag": "amenity=bank",
    "significado": "Sucursal Bancaria (BancoEstado, Santander, etc.)",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Comisión para el Mercado Financiero (CMF)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "BancoEstado Sucursal Brasil / Alameda",
    "citaAPA": "(CMF Chile, 2023)"
  },
  {
    "tag": "amenity=atm",
    "significado": "Cajero Automático (Redbanc)",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Comisión para el Mercado Financiero (CMF)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Cajero Redbanc en estaciones Metro y farmacias",
    "citaAPA": "(CMF Chile, 2023)"
  },
  {
    "tag": "amenity=cafe",
    "significado": "Cafetería / Salón de Té Universitario",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "SERNATUR / Municipalidad de Santiago",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Cafés universitarios en Av. Brasil y calle Maturana",
    "citaAPA": "(INE, 2021; SERNATUR, 2022)"
  },
  {
    "tag": "amenity=restaurant",
    "significado": "Restaurante / Fuente de Soda / Picada Tradicional",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "SERNATUR / Ministerio de las Culturas",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Restaurante El Huaso Enrique / Fuentes de soda Alameda",
    "citaAPA": "(SERNATUR, 2022)"
  },
  {
    "tag": "amenity=recycling",
    "significado": "Punto Limpio / Campana de Reciclaje Diferenciado",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Ministerio del Medio Ambiente (Ley REP 20.920)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Campana de reciclaje en Plaza Brasil y patios UAH",
    "citaAPA": "(MMA, 2022; Ley N° 20.920)"
  },
  {
    "tag": "amenity=waste_basket",
    "significado": "Basurero Peatonal Urbano de Vereda",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Dirección de Aseo y Ornato Municipal",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Papeleros peatonales en eje Av. Brasil y Alameda",
    "citaAPA": "(Municipalidad de Santiago, 2021)"
  },
  {
    "tag": "highway=street_lamp",
    "significado": "Luminaria Pública / Farol de Alumbrado Urbano",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Municipalidad de Santiago / Enel",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Faroles coloniales patrimoniales en Barrio Brasil",
    "citaAPA": "(Municipalidad de Santiago, 2021)"
  },
  {
    "tag": "railway=station",
    "significado": "Estación de Metro de Santiago",
    "categoria": "CAT-03",
    "grupo": "movilidad",
    "institucion": "Metro de Santiago / MTT / DTPM",
    "ideChile": "Estaciones de Metro y Ferrocarriles (DTPM - Metro S.A. / IDE Chile)",
    "aplicacionUAH": "Estación Los Héroes (L1/L2) y Estación Santa Ana (L2/L5)",
    "citaAPA": "(Metro de Santiago, 2024; DTPM & MTT, 2023)"
  },
  {
    "tag": "railway=subway_entrance",
    "significado": "Acceso / Boca de Estación de Metro",
    "categoria": "CAT-03",
    "grupo": "movilidad",
    "institucion": "Metro S.A.",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Boca Metro Santa Ana por Manuel Rodríguez / Catedral",
    "citaAPA": "(Metro de Santiago, 2024)"
  },
  {
    "tag": "highway=bus_stop",
    "significado": "Paradero de Buses Red Movilidad",
    "categoria": "CAT-03",
    "grupo": "movilidad",
    "institucion": "Directorio de Transporte Público Metropolitano (DTPM)",
    "ideChile": "Paradas de Transporte Público Red Movilidad (DTPM - MTT / IDE Chile)",
    "aplicacionUAH": "Paradero PA347 Alameda esq. Almirante Barroso",
    "citaAPA": "(DTPM & MTT, 2023)"
  },
  {
    "tag": "public_transport=platform",
    "significado": "Andén / Plataforma de Parada de Bus",
    "categoria": "CAT-03",
    "grupo": "movilidad",
    "institucion": "DTPM / MTT",
    "ideChile": "Paradas de Transporte Público Red Movilidad (DTPM - MTT / IDE Chile)",
    "aplicacionUAH": "Andén segregado en corredor Alameda Bernardo O'Higgins",
    "citaAPA": "(DTPM & MTT, 2023)"
  },
  {
    "tag": "amenity=bus_station",
    "significado": "Terminal de Buses Interurbanos",
    "categoria": "CAT-03",
    "grupo": "educacion_servicios",
    "institucion": "MTT / SEREMI de Transportes RM",
    "ideChile": "Terminales de Buses Interurbanos (MTT / IDE Chile)",
    "aplicacionUAH": "Terminal Los Héroes (Tucapel Jiménez)",
    "citaAPA": "(MTT, 2022)"
  },
  {
    "tag": "vending=public_transport_tickets",
    "significado": "Tótem / Punto de Carga de Tarjeta bip!",
    "categoria": "CAT-03",
    "grupo": "movilidad",
    "institucion": "Metro S.A. / DTPM",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Punto de carga bip! en boletería Metro Los Héroes",
    "citaAPA": "(DTPM & MTT, 2023)"
  },
  {
    "tag": "railway=subway",
    "significado": "Trazado Subterráneo de Línea de Metro",
    "categoria": "CAT-03",
    "grupo": "movilidad",
    "institucion": "Metro S.A.",
    "ideChile": "Trazados de Líneas de Metro de Santiago (DTPM / IDE Chile)",
    "aplicacionUAH": "Trazado Línea 1 bajo eje Alameda / Línea 2 Manuel Rodríguez",
    "citaAPA": "(Metro de Santiago, 2024)"
  },
  {
    "tag": "amenity=taxi",
    "significado": "Parada de Taxis Básicos / Colectivos Urbanos",
    "categoria": "CAT-03",
    "grupo": "educacion_servicios",
    "institucion": "SEREMI de Transportes RM / MTT",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Parada de taxis en Alameda frente a Metro Los Héroes",
    "citaAPA": "(MTT, 2022)"
  },
  {
    "tag": "highway=cycleway",
    "significado": "Ciclovía Segregada en Calzada / Bandejón",
    "categoria": "CAT-04",
    "grupo": "movilidad",
    "institucion": "MINVU (Manual Vialidad Cicloinclusiva) / MTT",
    "ideChile": "Catastro de Ciclovías Urbanas (SECTRA - MTT / IDE Chile)",
    "aplicacionUAH": "Ciclovía calle Rosas / Ciclovía Alameda Poniente",
    "citaAPA": "(MINVU, 2020; MTT, 2021)"
  },
  {
    "tag": "cycleway=lane",
    "significado": "Ciclobanda Demarcada en Calzada",
    "categoria": "CAT-04",
    "grupo": "movilidad",
    "institucion": "MINVU / Dirección de Tránsito Municipal",
    "ideChile": "Catastro de Ciclovías Urbanas (SECTRA - MTT / IDE Chile)",
    "aplicacionUAH": "Ciclobanda en eje Av. Brasil",
    "citaAPA": "(MINVU, 2020)"
  },
  {
    "tag": "amenity=bicycle_parking",
    "significado": "Biciestacionamiento / Punto de Anclaje",
    "categoria": "CAT-04",
    "grupo": "educacion_servicios",
    "institucion": "MINVU / DTPM / UAH",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Biciestacionamientos en patios UAH y exterior Metro",
    "citaAPA": "(MINVU, 2020; UAH, 2023)"
  },
  {
    "tag": "amenity=bicycle_rental",
    "significado": "Estación de Bicicletas Públicas Compartidas",
    "categoria": "CAT-04",
    "grupo": "educacion_servicios",
    "institucion": "GORE Metropolitano / Municipios",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Estación Bike Santiago en Plaza Brasil",
    "citaAPA": "(GORE RM, 2021)"
  },
  {
    "tag": "amenity=bicycle_repair_station",
    "significado": "Tótem de Reparación e Inflado de Bicis",
    "categoria": "CAT-04",
    "grupo": "educacion_servicios",
    "institucion": "Municipios / Organizaciones Ciclistas",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Tótem de herramientas en acceso campus UAH",
    "citaAPA": "(WikiProject Chile, 2024)"
  },
  {
    "tag": "amenity=charging_station",
    "significado": "Estación de Carga de Vehículos Eléctricos",
    "categoria": "CAT-04",
    "grupo": "educacion_servicios",
    "institucion": "Ministerio de Energía / SEC",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Electrolinera de carga rápida en eje Alameda",
    "citaAPA": "(Ministerio de Energía, 2023)"
  },
  {
    "tag": "highway=living_street",
    "significado": "Zona Calma / Calle de Coexistencia (Zona 30)",
    "categoria": "CAT-04",
    "grupo": "movilidad",
    "institucion": "CONASET / MINVU",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Calles de velocidad reducida en torno a Plaza Brasil",
    "citaAPA": "(CONASET, 2022; MINVU, 2020)"
  },
  {
    "tag": "highway=speed_display",
    "significado": "Radar Pedagógico de Velocidad Vial",
    "categoria": "CAT-04",
    "grupo": "movilidad",
    "institucion": "CONASET / Dirección de Tránsito",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Radar indicador de velocidad en calle Cienfuegos",
    "citaAPA": "(CONASET, 2022)"
  },
  {
    "tag": "leisure=park",
    "significado": "Parque Urbano Público / Plaza Barrial",
    "categoria": "CAT-05",
    "grupo": "educacion_servicios",
    "institucion": "MINVU (Política Nacional de Parques Urbanos)",
    "ideChile": "Catastro de Parques Urbanos (MINVU / IDE Chile)",
    "aplicacionUAH": "Plaza Brasil (parque barrial estructurante)",
    "citaAPA": "(MINVU, 2021; IDE Chile / SNIT, 2024)"
  },
  {
    "tag": "leisure=playground",
    "significado": "Área de Juegos Infantiles Modulares",
    "categoria": "CAT-05",
    "grupo": "educacion_servicios",
    "institucion": "MINVU / Municipalidad de Santiago",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Esculturas lúdicas de Federica Matta en Plaza Brasil",
    "citaAPA": "(MINVU, 2021)"
  },
  {
    "tag": "leisure=pitch",
    "significado": "Cancha de Baby Fútbol / Multicancha Comunitaria",
    "categoria": "CAT-05",
    "grupo": "educacion_servicios",
    "institucion": "Instituto Nacional de Deportes (IND)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Multicancha deportiva en JJVV Barrio Brasil",
    "citaAPA": "(IND Chile, 2021)"
  },
  {
    "tag": "leisure=sports_centre",
    "significado": "Polideportivo Municipal / Complejo Deportivo",
    "categoria": "CAT-05",
    "grupo": "educacion_servicios",
    "institucion": "IND / I. Municipalidad de Santiago",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Polideportivo Comunal Santiago Centro",
    "citaAPA": "(IND Chile, 2021)"
  },
  {
    "tag": "leisure=fitness_station",
    "significado": "Plaza Activa / Máquinas de Ejercicios",
    "categoria": "CAT-05",
    "grupo": "educacion_servicios",
    "institucion": "MINVU / Municipalidades",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Estación de máquinas de calistenia en Plaza Brasil",
    "citaAPA": "(MINVU, 2021)"
  },
  {
    "tag": "amenity=bench",
    "significado": "Banca / Escaño Público de Descanso",
    "categoria": "CAT-05",
    "grupo": "educacion_servicios",
    "institucion": "MINVU / Dirección de Aseo y Ornato",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Escaños patrimoniales en bandejón central de Av. Brasil",
    "citaAPA": "(MINVU, 2021)"
  },
  {
    "tag": "amenity=drinking_water",
    "significado": "Bebedero Público de Agua Potable",
    "categoria": "CAT-05",
    "grupo": "educacion_servicios",
    "institucion": "Aguas Andinas / Municipalidades",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Bebedero público en Plaza Brasil",
    "citaAPA": "(MINVU, 2021)"
  },
  {
    "tag": "leisure=dog_park",
    "significado": "Zona Canina / Canil de Espacio Público",
    "categoria": "CAT-05",
    "grupo": "educacion_servicios",
    "institucion": "Municipalidad de Santiago (Tenencia Responsable)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Canil cerrado y zona de adiestramiento en Parque Quinta Normal",
    "citaAPA": "(SUBDERE, 2018)"
  },
  {
    "tag": "landuse=grass",
    "significado": "Césped Urbano / Superficie Verde Ajardinada",
    "categoria": "CAT-05",
    "grupo": "educacion_servicios",
    "institucion": "Dirección de Parques y Jardines / MINVU",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Prados ajardinados centrales en Plaza Brasil",
    "citaAPA": "(MINVU, 2021)"
  },
  {
    "tag": "historic=building",
    "significado": "Inmueble de Conservación Histórica (ICH) / Casona",
    "categoria": "CAT-06",
    "grupo": "patrimonio_verde",
    "institucion": "Consejo de Monumentos Nacionales (CMN) / DOM",
    "ideChile": "Monumentos Históricos e Inmuebles Protegidos (CMN - SERPAT / IDE Chile)",
    "aplicacionUAH": "Casonas Neoclásicas UAH (Barroso 10, Cienfuegos 41)",
    "citaAPA": "(CMN & MINCAP, 2022; Municipalidad de Santiago, 2019)"
  },
  {
    "tag": "historic=monument",
    "significado": "Monumento Público / Escultura Nacional",
    "categoria": "CAT-06",
    "grupo": "patrimonio_verde",
    "institucion": "Consejo de Monumentos Nacionales (CMN)",
    "ideChile": "Monumentos Públicos (CMN - SERPAT / IDE Chile)",
    "aplicacionUAH": "Esculturas conmemorativas en Plaza Brasil",
    "citaAPA": "(CMN & MINCAP, 2022; Ley N° 17.288)"
  },
  {
    "tag": "historic=memorial",
    "significado": "Memorial de Derechos Humanos / Hito Conmemorativo",
    "categoria": "CAT-06",
    "grupo": "patrimonio_verde",
    "institucion": "Subsecretaría de Derechos Humanos / CMN",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Placas conmemorativas en sedes comunitarias y sindicales",
    "citaAPA": "(Subsecretaría de DDHH, 2021)"
  },
  {
    "tag": "heritage=cite",
    "significado": "Cité Patrimonial / Pasaje Colectivo Tradicional",
    "categoria": "CAT-06",
    "grupo": "patrimonio_verde",
    "institucion": "MINVU / CMN / Municipalidad de Santiago",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Cité Lucrecia Valdés / Pasajes de calle Huérfanos",
    "citaAPA": "(Municipalidad de Santiago, 2019; Hidalgo, 2005)"
  },
  {
    "tag": "amenity=place_of_worship",
    "significado": "Templo Religioso / Basílica / Parroquia",
    "categoria": "CAT-06",
    "grupo": "patrimonio_verde",
    "institucion": "CMN / Arzobispado de Santiago",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Basílica del Salvador (Monumento Histórico)",
    "citaAPA": "(CMN & MINCAP, 2022)"
  },
  {
    "tag": "amenity=arts_centre",
    "significado": "Centro Cultural Comunitario / Galpón de Arte",
    "categoria": "CAT-06",
    "grupo": "patrimonio_verde",
    "institucion": "Ministerio de las Culturas, las Artes y el Patrimonio",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Centro Cultural de Barrio Brasil / Galpón Víctor Jara",
    "citaAPA": "(MINCAP, 2022)"
  },
  {
    "tag": "tourism=museum",
    "significado": "Museo Público / Histórico / Universitario",
    "categoria": "CAT-06",
    "grupo": "patrimonio_verde",
    "institucion": "Servicio Nacional del Patrimonio Cultural (SERPAT)",
    "ideChile": "Catastro Nacional de Museos (SERPAT / IDE Chile)",
    "aplicacionUAH": "Museo de la Educación Gabriela Mistral",
    "citaAPA": "(SERPAT, 2023)"
  },
  {
    "tag": "amenity=cinema",
    "significado": "Cine Comunitario / Sala de Exhibición Independiente",
    "categoria": "CAT-06",
    "grupo": "patrimonio_verde",
    "institucion": "MINCAP / Red de Salas de Cine de Chile",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Cine Normandie y salas independientes de Barrio Universitario",
    "citaAPA": "(MINCAP, 2022)"
  },
  {
    "tag": "historic=archaeological_site",
    "significado": "Sitio de Rescate Arqueológico Colonial",
    "categoria": "CAT-06",
    "grupo": "patrimonio_verde",
    "institucion": "Consejo de Monumentos Nacionales (CMN)",
    "ideChile": "Sitios Arqueológicos Protegidos (CMN - SERPAT / IDE Chile)",
    "aplicacionUAH": "Hallazgos arqueológicos coloniales en obras viales de Santiago Poniente",
    "citaAPA": "(CMN & MINCAP, 2022)"
  },
  {
    "tag": "kerb=lowered",
    "significado": "Rebaje de Solera / Vado Peatonal en Esquina",
    "categoria": "CAT-07",
    "grupo": "accesibilidad",
    "institucion": "MINVU (OGUC Art. 2.2.8) / SENADIS",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Rebaje de solera en cruce Alameda con Almirante Barroso",
    "citaAPA": "(MINVU, 2016; SENADIS, 2021)"
  },
  {
    "tag": "kerb=flush",
    "significado": "Cordón a Nivel Cero / Plataforma Única",
    "categoria": "CAT-07",
    "grupo": "accesibilidad",
    "institucion": "MINVU / SERVIU Metropolitano",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Pasos a nivel en paseos peatonales y calles calmadas",
    "citaAPA": "(MINVU, 2016)"
  },
  {
    "tag": "highway=crossing",
    "significado": "Paso Peatonal Demarcado (Paso Cebra / Semaforizado)",
    "categoria": "CAT-07",
    "grupo": "accesibilidad",
    "institucion": "CONASET (Ministerio de Transportes) / MINVU",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Paso de cebra demarcado en Cienfuegos frente a UAH",
    "citaAPA": "(CONASET, 2022; MTT, 2021)"
  },
  {
    "tag": "tactile_paving=yes",
    "significado": "Pavimento Podotáctil de Alerta o Guía (Baldosa Táctil)",
    "categoria": "CAT-07",
    "grupo": "accesibilidad",
    "institucion": "MINVU (D.S. 50) / SENADIS",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Baldosas podotáctiles en esquinas y andenes de Metro",
    "citaAPA": "(MINVU, 2016; SENADIS, 2021)"
  },
  {
    "tag": "traffic_signals:sound=yes",
    "significado": "Semáforo Peatonal Audible (Señal Acústica)",
    "categoria": "CAT-07",
    "grupo": "accesibilidad",
    "institucion": "Unidad Operativa de Control de Tránsito (UOCT)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Semáforo sonoro en eje Alameda con Los Héroes",
    "citaAPA": "(UOCT & MTT, 2022)"
  },
  {
    "tag": "highway=traffic_signals",
    "significado": "Intersección con Semáforos Sincronizados UOCT",
    "categoria": "CAT-07",
    "grupo": "accesibilidad",
    "institucion": "UOCT / MTT",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Cruces semaforizados sincronizados en Alameda con Manuel Rodríguez",
    "citaAPA": "(UOCT & MTT, 2022)"
  },
  {
    "tag": "wheelchair=yes",
    "significado": "Recinto o Local 100% Accesible para Sillas de Ruedas",
    "categoria": "CAT-07",
    "grupo": "accesibilidad",
    "institucion": "MINVU / SENADIS",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Edificio Erasmo Escala UAH con rampa y ascensor accesible",
    "citaAPA": "(SENADIS, 2021; ISO 21542:2021)"
  },
  {
    "tag": "wheelchair=limited",
    "significado": "Recinto con Accesibilidad Parcial / Requiere Asistencia",
    "categoria": "CAT-07",
    "grupo": "accesibilidad",
    "institucion": "MINVU / SENADIS",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Casonas patrimoniales con accesibilidad restringida en segundo piso",
    "citaAPA": "(SENADIS, 2021)"
  },
  {
    "tag": "highway=pedestrian",
    "significado": "Paseo Peatonal Exclusivo / Calle Peatonalizada",
    "categoria": "CAT-07",
    "grupo": "accesibilidad",
    "institucion": "MINVU / SECPLAN Santiago",
    "ideChile": "Red Vial Urbana - Paseos Peatonales (MOP - SERVIU / IDE Chile)",
    "aplicacionUAH": "Paseo peatonal Huérfanos Poniente y pasajes patrimoniales",
    "citaAPA": "(MINVU, 2021)"
  },
  {
    "tag": "highway=ramp",
    "significado": "Rampa de Acceso Peatonal con Pendiente Normada",
    "categoria": "CAT-07",
    "grupo": "accesibilidad",
    "institucion": "MINVU (D.S. 50) / SENADIS",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Rampas con pasamanos en accesos de facultades UAH",
    "citaAPA": "(MINVU, 2016; SENADIS, 2021)"
  },
  {
    "tag": "natural=tree",
    "significado": "Árbol Urbano de Alineación en Acera o Plaza",
    "categoria": "CAT-08",
    "grupo": "patrimonio_verde",
    "institucion": "Corporación Nacional Forestal (CONAF) / Municipios",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Plátanos orientales y jacarandás en Av. Brasil",
    "citaAPA": "(CONAF, 2019; MMA, 2022)"
  },
  {
    "tag": "natural=wood",
    "significado": "Masa Arbórea Continua / Bosquete Urbano",
    "categoria": "CAT-08",
    "grupo": "patrimonio_verde",
    "institucion": "CONAF / MMA",
    "ideChile": "Catastro de Recursos Vegetacionales Nativos (CONAF / IDE Chile)",
    "aplicacionUAH": "Área arbolada densa en Parque Quinta Normal",
    "citaAPA": "(CONAF, 2019; IDE Chile / SNIT, 2024)"
  },
  {
    "tag": "genus=Platanus",
    "significado": "Plátano Oriental (Platanus orientalis / × acerifolia)",
    "categoria": "CAT-08",
    "grupo": "patrimonio_verde",
    "institucion": "CONAF / Catastro Arbolado Urbano Santiago",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Alineaciones arbóreas históricas en Av. Brasil y bandejón Alameda",
    "citaAPA": "(CONAF, 2019)"
  },
  {
    "tag": "genus=Jacaranda",
    "significado": "Jacarandá (Jacaranda mimosifolia)",
    "categoria": "CAT-08",
    "grupo": "patrimonio_verde",
    "institucion": "CONAF / Dirección de Aseo y Ornato",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Jacarandás florecidos en primavera en torno a Plaza Brasil",
    "citaAPA": "(CONAF, 2019)"
  },
  {
    "tag": "genus=Jubaea",
    "significado": "Palma Chilena (Jubaea chilensis - Nativa Vulnerable)",
    "categoria": "CAT-08",
    "grupo": "patrimonio_verde",
    "institucion": "CONAF / Ministerio del Medio Ambiente",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Ejemplares monumentales de palma chilena en plazas de Santiago",
    "citaAPA": "(CONAF, 2019; MMA, 2022)"
  },
  {
    "tag": "genus=Schinus",
    "significado": "Pimiento / Molle (Schinus areira - Nativo Resistente a Sequía)",
    "categoria": "CAT-08",
    "grupo": "patrimonio_verde",
    "institucion": "CONAF / MMA",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Pimientos nativos resistentes a escasez hídrica en Barrio Brasil",
    "citaAPA": "(CONAF, 2019)"
  },
  {
    "tag": "genus=Quillaja",
    "significado": "Quillay (Quillaja saponaria - Flora Esclerófila)",
    "categoria": "CAT-08",
    "grupo": "patrimonio_verde",
    "institucion": "CONAF / MMA",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Quillayes en platabandas sostenibles de la comuna de Santiago",
    "citaAPA": "(CONAF, 2019; MMA, 2022)"
  },
  {
    "tag": "amenity=training_centre",
    "significado": "Centro de Capacitación Laboral / Sede OTEC",
    "categoria": "CAT-01",
    "grupo": "educacion_servicios",
    "institucion": "SENCE / Ministerio del Trabajo y Previsión Social",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Centros de capacitación laboral y sedes OTEC en Santiago Poniente y regiones",
    "citaAPA": "(SENCE & Mintrab, 2022; OECD, 2017)"
  },
  {
    "tag": "healthcare=centre",
    "significado": "Posta de Salud Rural (PSR) / Estación Médico Rural",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "MINSAL / Red Asistencial Rural",
    "ideChile": "Establecimientos de Salud - Atención Primaria Rural (DEIS - MINSAL / IDE Chile)",
    "aplicacionUAH": "Postas rurales en comunas periurbanas de la RM (Melipilla, Talagante, Tiltil) y regiones",
    "citaAPA": "(MINSAL, 2023; IDE Chile / SNIT, 2024)"
  },
  {
    "tag": "amenity=social_facility",
    "significado": "Establecimiento de Larga Estadía para Adultos Mayores (ELEAM)",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Servicio Nacional del Adulto Mayor (SENAMA) / MDSF",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Residencias de adultos mayores en Barrio Brasil, Quinta Normal y ciudades regionales",
    "citaAPA": "(SENAMA & MDSF, 2021)"
  },
  {
    "tag": "man_made=water_tower",
    "significado": "Copa de Agua Potable / Estanque Elevado de Regulación",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Dirección de Obras Hidráulicas (DOH - MOP) / SISS",
    "ideChile": "Sistemas de Agua Potable y Estanques de Regulación (DOH - MOP / IDE Chile)",
    "aplicacionUAH": "Copas de agua y estanques de distribución en Santiago Poniente y cabeceras comunales",
    "citaAPA": "(DOH & MOP, 2022; SISS, 2022)"
  },
  {
    "tag": "man_made=water_works",
    "significado": "Planta de Agua Potable Rural (APR) / Servicio Sanitario Rural",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Subdirección de Servicios Sanitarios Rurales (DOH - MOP, Ley N° 20.998)",
    "ideChile": "Sistemas de Agua Potable Rural (DOH - MOP / IDE Chile)",
    "aplicacionUAH": "Cooperativas y comités de agua potable rural en cuencas de Maipo, Aconcagua y Maule",
    "citaAPA": "(DOH & MOP, 2022; Ley N° 20.998)"
  },
  {
    "tag": "emergency=fire_lookout",
    "significado": "Torre de Detección de Incendios Forestales / Caseta CONAF",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Corporación Nacional Forestal (CONAF) / SENAPRED",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Torres de vigilancia en cerros islas y áreas de interfaz urbano-forestal en regiones",
    "citaAPA": "(CONAF, 2022; SENAPRED, 2023)"
  },
  {
    "tag": "amenity=coast_guard",
    "significado": "Capitanía de Puerto / Alcaldía de Mar (DIRECTEMAR)",
    "categoria": "CAT-02",
    "grupo": "educacion_servicios",
    "institucion": "Dirección General del Territorio Marítimo y Marina Mercante (DIRECTEMAR)",
    "ideChile": "Capitanías de Puerto y Alcaldías de Mar (DIRECTEMAR / IDE Chile)",
    "aplicacionUAH": "Alcaldías de mar y capitanías en puertos de Valparaíso, San Antonio, Talcahuano y fiordos australes",
    "citaAPA": "(DIRECTEMAR & Armada de Chile, 2021)"
  },
  {
    "tag": "amenity=ferry_terminal",
    "significado": "Terminal de Transbordadores / Rampa de Barcazas de Conectividad",
    "categoria": "CAT-03",
    "grupo": "movilidad",
    "institucion": "Dirección de Obras Portuarias (DOP - MOP) / MTT",
    "ideChile": "Terminales y Rampas de Conectividad Austral (DOP - MOP / IDE Chile)",
    "aplicacionUAH": "Rampas de conectividad en Pargua, Chacao, Quellón, Puerto Chacabuco y Punta Arenas",
    "citaAPA": "(DOP & MOP, 2023; MTT, 2022)"
  },
  {
    "tag": "railway=level_crossing",
    "significado": "Cruce Ferroviario a Nivel con Barrera / Señalización",
    "categoria": "CAT-03",
    "grupo": "movilidad",
    "institucion": "Empresa de los Ferrocarriles del Estado (EFE) / MTT",
    "ideChile": "Cruces Ferroviarios (EFE - MTT / IDE Chile)",
    "aplicacionUAH": "Cruces a nivel de tren Nos-Alameda, Biotren y ramal Talca-Constitución",
    "citaAPA": "(EFE & MTT, 2023)"
  },
  {
    "tag": "barrier=toll_booth",
    "significado": "Plaza de Peaje Interurbano / Pórtico Free Flow (TAG)",
    "categoria": "CAT-03",
    "grupo": "movilidad",
    "institucion": "Dirección General de Concesiones (DGC - MOP)",
    "ideChile": "Plazas de Peaje Concesionadas (DGC - MOP / IDE Chile)",
    "aplicacionUAH": "Pórticos TAG en autopistas urbanas y plazas de peaje en Ruta 5 y Ruta 68",
    "citaAPA": "(DGC & MOP, 2023)"
  },
  {
    "tag": "aeroway=aerodrome",
    "significado": "Aeródromo Comunal / Pista de Emergencia Aeromédica",
    "categoria": "CAT-03",
    "grupo": "movilidad",
    "institucion": "Dirección General de Aeronáutica Civil (DGAC)",
    "ideChile": "Aeródromos y Helipuertos Públicos (DGAC / IDE Chile)",
    "aplicacionUAH": "Aeródromo Tobalaba, Peldehue y pistas de enlace comunitario en regiones",
    "citaAPA": "(DGAC, 2023)"
  },
  {
    "tag": "highway=track",
    "significado": "Camino Rural No Pavimentado / Huella de Servidumbre Agrícola",
    "categoria": "CAT-04",
    "grupo": "movilidad",
    "institucion": "Dirección de Vialidad (MOP) / Indap",
    "ideChile": "Red Vial Rural y Huellas (Dirección de Vialidad - MOP / IDE Chile)",
    "aplicacionUAH": "Redes viales secundarias y huellas agrícolas en periferia de Santiago y regiones",
    "citaAPA": "(Dirección de Vialidad & MOP, 2022)"
  },
  {
    "tag": "highway=steps",
    "significado": "Escalinata Peatonal de Cerro / Escalera Pública Barrial",
    "categoria": "CAT-04",
    "grupo": "movilidad",
    "institucion": "MINVU / Municipalidades (Planes de Cerros)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Escaleras de quebradas urbanas y accesos a cerros en Valparaíso y Santiago Poniente",
    "citaAPA": "(MINVU, 2020; Municipalidad de Valparaíso, 2021)"
  },
  {
    "tag": "leisure=marina",
    "significado": "Caleta de Pescadores Artesanales / Muelle Artesanal",
    "categoria": "CAT-05",
    "grupo": "patrimonio_verde",
    "institucion": "Servicio Nacional de Pesca y Acuicultura (SERNAPESCA) / DOP MOP",
    "ideChile": "Caletas Pesqueras Artesanales (SERNAPESCA / IDE Chile)",
    "aplicacionUAH": "Caletas pesqueras artesanales (Caleta Portales, Caleta San Antonio, Caleta Angelmó)",
    "citaAPA": "(SERNAPESCA & Subpesca, 2022)"
  },
  {
    "tag": "historic=wayside_cross",
    "significado": "Animita de Carretera / Gruta Popular Tradicional",
    "categoria": "CAT-06",
    "grupo": "patrimonio_verde",
    "institucion": "Consejo de Monumentos Nacionales (Patrimonio Cultural Inmaterial)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Animitas y grutas de devoción popular en esquinas barriales y calzadas interurbanas",
    "citaAPA": "(CMN & MINCAP, 2022; Weigell, 2023)"
  },
  {
    "tag": "amenity=shelter",
    "significado": "Refugio Peatonal Rural / Garita de Espera de Transporte",
    "categoria": "CAT-07",
    "grupo": "accesibilidad_biodiv",
    "institucion": "Dirección de Vialidad (MOP) / Gobiernos Regionales",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Garitas de madera y hormigón en paradas de micro rural e interprovincial",
    "citaAPA": "(Dirección de Vialidad & MOP, 2022; MTT, 2021)"
  },
  {
    "tag": "highway=elevator",
    "significado": "Ascensor Público Urbano / Funicular de Transporte Inclusivo",
    "categoria": "CAT-07",
    "grupo": "accesibilidad_biodiv",
    "institucion": "MINVU / SENADIS / Municipalidades",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Ascensores en pasarelas de autopistas urbanas, estaciones de Metro y funiculares patrimoniales",
    "citaAPA": "(MINVU, 2016; SENADIS, 2021)"
  },
  {
    "tag": "natural=wetland",
    "significado": "Humedal Urbano Protegido (Ley N° 21.202) / Pajonal / Salar",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "Ministerio del Medio Ambiente (MMA - Inventario Nacional de Humedales)",
    "ideChile": "Humedales Urbanos Declarados (MMA / IDE Chile)",
    "aplicacionUAH": "Humedales urbanos protegidos en Quilicura, Batuco, Concón, Llanquihue y Valdivia",
    "citaAPA": "(MMA, 2022; Ley N° 21.202)"
  },
  {
    "tag": "genus=Cryptocarya",
    "significado": "Peumo (Cryptocarya alba) - Árbol Nativo Esclerófilo",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "CONAF (Programa de Arborización Urbana y Restauración)",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Ejemplares nativos de peumo en parques urbanos y campus universitarios",
    "citaAPA": "(CONAF, 2019; MMA, 2022)"
  },
  {
    "tag": "genus=Maytenus",
    "significado": "Maitén (Maytenus boaria) - Árbol Nativo Siempreverde",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "CONAF / Ministerio del Medio Ambiente",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Maitenes protegidos en bandejones y áreas verdes comunitarias",
    "citaAPA": "(CONAF, 2019; MMA, 2022)"
  },
  {
    "tag": "dwc:scientificName",
    "significado": "Nombre Científico del Taxón / Especie (Darwin Core)",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "GBIF Chile / Ministerio del Medio Ambiente (MMA)",
    "ideChile": "Especies Nativas e Introducidas (MMA / IDE Chile)",
    "aplicacionUAH": "Taxonomía biológica de flora urbana y avifauna en Plaza Brasil y campus UAH",
    "citaAPA": "(GBIF Secretariat, 2024; TDWG, 2023)"
  },
  {
    "tag": "dwc:vernacularName",
    "significado": "Nombre Común o Vernáculo en Chile (Darwin Core)",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "MMA / Inventario Nacional de Especies / Red de Ciencia Ciudadana",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Identificación comunitaria de especies: chincol, zorzal, tórtola, pimiento, quillay",
    "citaAPA": "(GBIF Secretariat, 2024; MMA, 2022)"
  },
  {
    "tag": "dwc:basisOfRecord",
    "significado": "Tipo de Registro Biológico (HUMAN_OBSERVATION / iNaturalist)",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "GBIF Secretariat / TDWG Darwin Core",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Observaciones comunitarias fotográficas con grado de investigación en Barrio Brasil",
    "citaAPA": "(TDWG, 2023; GBIF Secretariat, 2024)"
  },
  {
    "tag": "dwc:coordinateUncertaintyInMeters",
    "significado": "Incertidumbre Posicional Métrica de Coordenada GPS",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "GBIF Secretariat / IGM / ISO 19157",
    "ideChile": "Exactitud Posicional Absoluta (gmd:DQ_AbsoluteExternalPositionalAccuracy / IDE Chile)",
    "aplicacionUAH": "Radio de precisión métrica (<15 m) en registros móviles de biodiversidad urbana",
    "citaAPA": "(Chapman, 2005a; ISO 19157:2013)"
  },
  {
    "tag": "dwc:recordedBy",
    "significado": "Observador Ciudadano / Colector de Ciencia Comunitaria",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "GBIF Chile / iNaturalist / Comunidad",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Trazabilidad de autoría ciudadana de avistamientos de fauna y arbolado en el barrio",
    "citaAPA": "(Goodchild, 2007; Haklay, 2013)"
  },
  {
    "tag": "dwc:issues",
    "significado": "Banderas de Calidad Espacial y Taxonómica (Darwin Core Issues)",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "GBIF Secretariat / ISO 19157",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Auditoría algorítmica de anomalías en coordenadas y nombres taxonómicos",
    "citaAPA": "(Chapman, 2005b; Chapman, 2010)"
  },
  {
    "tag": "dwc:datasetKey",
    "significado": "Identificador Persistente del Dataset Publicador (UUID)",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "GBIF Secretariat / Nodos Participantes",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Trazabilidad DOI de repositorios institucionales y de ciencia ciudadana",
    "citaAPA": "(Wilkinson et al., 2016; GBIF.org, 2025)"
  },
  {
    "tag": "dwc:taxonRank",
    "significado": "Jerarquía Taxonómica del Espécimen (Especie, Género, Familia)",
    "categoria": "CAT-08",
    "grupo": "accesibilidad_biodiv",
    "institucion": "GBIF Secretariat / TDWG",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Resolución del nivel taxonómico de observaciones de flora y fauna en la cuenca de Santiago",
    "citaAPA": "(TDWG, 2023; CONAF, 2019)"
  },
  {
    "tag": "building=yes",
    "significado": "Huella de Edificación Catastrada / Manzana Construida",
    "categoria": "CAT-09",
    "grupo": "edificaciones_suelo",
    "institucion": "Servicio de Impuestos Internos (SII) / DOM",
    "ideChile": "Catastro Nacional de Bienes Raíces (SII / IDE Chile)",
    "aplicacionUAH": "Huellas poligonales de manzanas patrimoniales y campus UAH",
    "citaAPA": "(IDE Chile / SNIT, 2024; SII, 2023)"
  },
  {
    "tag": "building=residential",
    "significado": "Inmueble Residencial / Vivienda Colectiva o Casa Habitación",
    "categoria": "CAT-09",
    "grupo": "edificaciones_suelo",
    "institucion": "MINVU / Dirección de Obras Municipales",
    "ideChile": "Catastro Habitacional Urbano (MINVU / IDE Chile)",
    "aplicacionUAH": "Inmuebles residenciales en calles Maturana, Brasil y Huérfanos",
    "citaAPA": "(MINVU, 2020; INE, 2017)"
  },
  {
    "tag": "building=apartments",
    "significado": "Edificio Residencial en Altura / Departamentos",
    "categoria": "CAT-09",
    "grupo": "edificaciones_suelo",
    "institucion": "Dirección de Obras Municipales / MINVU",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Torres de departamentos en eje Alameda, San Pablo y Manuel Rodríguez",
    "citaAPA": "(MINVU, 2020; Hidalgo, 2005)"
  },
  {
    "tag": "building=house",
    "significado": "Casa Habitación Unifamiliar / Vivienda Tradicional",
    "categoria": "CAT-09",
    "grupo": "edificaciones_suelo",
    "institucion": "Dirección de Obras Municipales (DOM) / INE",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Casas tradicionales de 1 y 2 pisos en pasajes interiores de Barrio Brasil",
    "citaAPA": "(INE, 2017; Municipalidad de Santiago, 2019)"
  },
  {
    "tag": "building=commercial",
    "significado": "Inmueble Comercial / Galería Comercial y Oficinas",
    "categoria": "CAT-09",
    "grupo": "edificaciones_suelo",
    "institucion": "SERCOTEC / Rentas Municipales",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Galerías comerciales y locales en Av. Brasil y Alameda",
    "citaAPA": "(SERCOTEC, 2022; INE, 2021)"
  },
  {
    "tag": "building=civic",
    "significado": "Edificio Cívico / Dependencia Institucional del Estado",
    "categoria": "CAT-09",
    "grupo": "edificaciones_suelo",
    "institucion": "Dirección de Arquitectura (MOP) / Bienes Nacionales",
    "ideChile": "Infraestructura Pública del Estado (MOP / IDE Chile)",
    "aplicacionUAH": "Edificios públicos de ministerios y servicios en Santiago Poniente",
    "citaAPA": "(IDE Chile / SNIT, 2024; MOP, 2022)"
  },
  {
    "tag": "building=school",
    "significado": "Pabellón Escolar / Edificio de Escuela o Liceo",
    "categoria": "CAT-09",
    "grupo": "edificaciones_suelo",
    "institucion": "MINEDUC / SLEP Santiago",
    "ideChile": "Establecimientos de Educación Escolar (MINEDUC / IDE Chile)",
    "aplicacionUAH": "Pabellones del Liceo Amunátegui y Escuela República de Panamá",
    "citaAPA": "(MINEDUC, 2023; IDE Chile / SNIT, 2024)"
  },
  {
    "tag": "building=university",
    "significado": "Pabellón Universitario / Sede Académica Universitaria",
    "categoria": "CAT-09",
    "grupo": "edificaciones_suelo",
    "institucion": "MINEDUC / CRUCH",
    "ideChile": "Establecimientos de Educación Superior (MINEDUC / IDE Chile)",
    "aplicacionUAH": "Pabellones y casonas académicas del campus UAH (Barroso / Erasmo Escala)",
    "citaAPA": "(MINEDUC, 2023; UAH, 2023)"
  },
  {
    "tag": "building=church",
    "significado": "Templo Religioso / Iglesia o Capilla Patrimonial",
    "categoria": "CAT-09",
    "grupo": "edificaciones_suelo",
    "institucion": "Consejo de Monumentos Nacionales / Arzobispado",
    "ideChile": "Inmuebles Religiosos y Templos Catastrados (CMN / IDE Chile)",
    "aplicacionUAH": "Basílica del Salvador e Iglesia San Lázaro en el entorno barrial",
    "citaAPA": "(CMN & MINCAP, 2022; Ley N° 17.288)"
  },
  {
    "tag": "building:levels",
    "significado": "Número de Pisos / Altura de Edificación en Niveles",
    "categoria": "CAT-09",
    "grupo": "edificaciones_suelo",
    "institucion": "Dirección de Obras Municipales / MINVU",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Catastro de alturas para análisis morfológico y rasantes en Barrio Brasil",
    "citaAPA": "(MINVU, 2020; Municipalidad de Santiago, 2019)"
  },
  {
    "tag": "landuse=residential",
    "significado": "Zona de Uso de Suelo Residencial / Habitacional Consolidado",
    "categoria": "CAT-10",
    "grupo": "edificaciones_suelo",
    "institucion": "MINVU / Secretaría Técnica PRC Municipal",
    "ideChile": "Zonificación Planes Reguladores Comunales (MINVU / IDE Chile)",
    "aplicacionUAH": "Manzanas de uso predominantemente habitacional de la Zona Típica",
    "citaAPA": "(MINVU, 2017; IDE Chile / SNIT, 2024)"
  },
  {
    "tag": "landuse=commercial",
    "significado": "Zona de Uso de Suelo Comercial y de Servicios",
    "categoria": "CAT-10",
    "grupo": "edificaciones_suelo",
    "institucion": "MINVU / Secretaría Técnica PRC Municipal",
    "ideChile": "Zonificación Planes Reguladores Comunales (MINVU / IDE Chile)",
    "aplicacionUAH": "Corredores comerciales en Av. Brasil, Huérfanos y Alameda Poniente",
    "citaAPA": "(MINVU, 2017; IDE Chile / SNIT, 2024)"
  },
  {
    "tag": "landuse=education",
    "significado": "Recinto de Uso Educacional / Campus Integrado",
    "categoria": "CAT-10",
    "grupo": "edificaciones_suelo",
    "institucion": "MINVU / MINEDUC",
    "ideChile": "Zonificación de Equipamiento Educacional (MINVU / IDE Chile)",
    "aplicacionUAH": "Polígono del Campus Universitario Universidad Alberto Hurtado",
    "citaAPA": "(MINVU, 2017; MINEDUC, 2023)"
  },
  {
    "tag": "landuse=recreation_ground",
    "significado": "Recinto de Recreación y Deportes al Aire Libre",
    "categoria": "CAT-10",
    "grupo": "edificaciones_suelo",
    "institucion": "Instituto Nacional de Deportes (IND) / MINVU",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Canchas comunitarias y áreas recreativas exteriores en Barrio Brasil",
    "citaAPA": "(IND Chile, 2021; MINVU, 2021)"
  },
  {
    "tag": "landuse=construction",
    "significado": "Terreno en Faena de Construcción / Obras Urbanas Activas",
    "categoria": "CAT-10",
    "grupo": "edificaciones_suelo",
    "institucion": "Dirección de Obras Municipales / CChC",
    "ideChile": "Sin capa homóloga en IDE Chile (Dato VGI / Brecha de información oficial)",
    "aplicacionUAH": "Sitios en demolición, remodelación o edificación de nuevas obras",
    "citaAPA": "(MINVU, 2020)"
  },
  {
    "tag": "surface=asphalt",
    "significado": "Cobertura de Calzada en Asfalto / Pavimento Flexible",
    "categoria": "CAT-10",
    "grupo": "edificaciones_suelo",
    "institucion": "Dirección de Vialidad (MOP) / SERVIU Metropolitano",
    "ideChile": "Red Vial Pavimentada (Dirección de Vialidad - MOP / IDE Chile)",
    "aplicacionUAH": "Calzadas vehiculares principales de Av. Brasil, Alameda y Ricardo Cumming",
    "citaAPA": "(Dirección de Vialidad & MOP, 2022; IDE Chile / SNIT, 2024)"
  }
];

  const CATEGORIAS_MAESTRAS = [
    {
      codigo: 'CAT-01',
      id_manual: 'manual-cat-01',
      nombre: 'Educación y Universidad',
      icono: '🏫',
      resumen: 'Campus universitario UAH (Almirante Barroso, Erasmo Escala), facultades, institutos, colegios, liceos y bibliotecas.',
      filtro_grupo: 'educacion_servicios'
    },
    {
      codigo: 'CAT-02',
      id_manual: 'manual-cat-02',
      nombre: 'Servicios, Comercio y Salud Barrial',
      icono: '🏬',
      resumen: 'Comercio de barrio, almacenes, panaderías, farmacias, CESFAM N° 5, clínicas comunitarias, bancos y gastronomía.',
      filtro_grupo: 'educacion_servicios'
    },
    {
      codigo: 'CAT-03',
      id_manual: 'manual-cat-03',
      nombre: 'Movilidad y Transporte Público',
      icono: '🚆',
      resumen: 'Paraderos Red Movilidad, estaciones Metro Los Héroes (L1/L2), Santa Ana (L2/L5), Cumming (L5) y corredores viales.',
      filtro_grupo: 'movilidad'
    },
    {
      codigo: 'CAT-04',
      id_manual: 'manual-cat-04',
      nombre: 'Movilidad Activa y Ciclovías',
      icono: '🚲',
      resumen: 'Ciclovías segregadas Rosas y Brasil, ciclobandas, biciestacionamientos públicos y campus UAH, y talleres comunitarios.',
      filtro_grupo: 'movilidad'
    },
    {
      codigo: 'CAT-05',
      id_manual: 'manual-cat-05',
      nombre: 'Áreas Verdes, Deporte y Espacio Público',
      icono: '🌲',
      resumen: 'Plaza Brasil, bandejones arbolados de Alameda, multicanchas comunitarias, juegos infantiles, bancos y bebederos.',
      filtro_grupo: 'patrimonio_verde'
    },
    {
      codigo: 'CAT-06',
      id_manual: 'manual-cat-06',
      nombre: 'Patrimonio Histórico y Cultura',
      icono: '🏛',
      resumen: 'Zona Típica Barrio Brasil, Inmuebles de Conservación Histórica (ICH), Basílica del Salvador, Casonas UAH y museos.',
      filtro_grupo: 'patrimonio_verde'
    },
    {
      codigo: 'CAT-07',
      id_manual: 'manual-cat-07',
      nombre: 'Accesibilidad Universal y Caminabilidad',
      icono: '🦯',
      resumen: 'Vados peatonales y rebajes de solera D.S. 50 MINVU, baldosas táctiles podotáctiles, pasos cebra demarcados y rampas.',
      filtro_grupo: 'accesibilidad_biodiv'
    },
    {
      codigo: 'CAT-08',
      id_manual: 'manual-cat-08',
      nombre: 'Biodiversidad Urbana y Arbolado',
      icono: '☘',
      resumen: 'Arbolado viario de alineación (plátano oriental, quillay, jacarandá), plazas, jardines y registros de ciencia ciudadana GBIF.',
      filtro_grupo: 'accesibilidad_biodiv'
    },
    {
      codigo: 'CAT-09',
      id_manual: 'manual-cat-09',
      nombre: 'Edificaciones y Huella Urbana',
      icono: '🏙',
      resumen: 'Catastro poligonal de edificaciones, huellas de manzanas, volumetría construida y cálculo de superficie en m² (EPSG:32719).',
      filtro_grupo: 'edificaciones_suelo'
    },
    {
      codigo: 'CAT-10',
      id_manual: 'manual-cat-10',
      nombre: 'Coberturas y Usos de Suelo',
      icono: '▧',
      resumen: 'Zonificación funcional del suelo urbano (residencial, comercial, dotacional, recreativo) y superficies biofísicas.',
      filtro_grupo: 'edificaciones_suelo'
    }
  ];

  function irACategoriaManual(codigo) {
    const cod = (codigo || '').toUpperCase().trim();
    const mapIds = {
      'CAT-01': 'manual-cat-01',
      'CAT-02': 'manual-cat-02',
      'CAT-03': 'manual-cat-03',
      'CAT-04': 'manual-cat-04',
      'CAT-05': 'manual-cat-05',
      'CAT-06': 'manual-cat-06',
      'CAT-07': 'manual-cat-07',
      'CAT-08': 'manual-cat-08',
      'CAT-09': 'manual-cat-09',
      'CAT-10': 'manual-cat-10'
    };
    const targetId = mapIds[cod] || 'manual-cat-01';
    if (typeof window.navegarAManual === 'function') {
      window.navegarAManual(targetId);
    } else {
      const btn = document.querySelector('button[data-panel="manual"]');
      if (btn) btn.click();
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }

  function filtrarPorCodigo(codigo) {
    const input = document.getElementById('filtro-diccionario');
    if (input) {
      input.value = codigo;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function inspeccionarTaginfo(tag) {
    if (!tag) return;
    const partes = tag.split('=');
    const clave = partes[0];
    const valor = partes[1] || '*';

    const cont = document.getElementById('visor-taginfo-diccionario');
    if (cont && window.ModuloTaginfo) {
      cont.style.display = 'block';
      cont.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.ModuloTaginfo.renderizarEnContenedor('visor-taginfo-diccionario-contenido', clave, valor);
    }
  }

  function cerrarVisorTaginfo() {
    const cont = document.getElementById('visor-taginfo-diccionario');
    if (cont) cont.style.display = 'none';
  }

  function render(filtroTexto = '', filtroGrupo = 'todos') {
    const texto = filtroTexto.toLowerCase().trim();

    const mostrarAtributos = (filtroGrupo === 'todos' || filtroGrupo === 'esquema');
    const mostrarEtiquetas = (filtroGrupo !== 'esquema');

    const atributosFiltrados = ATRIBUTOS_NORMALIZADOS.filter(a =>
      !texto || a.campo.toLowerCase().includes(texto) || a.nombre.toLowerCase().includes(texto) || a.definicion.toLowerCase().includes(texto) || a.equivalenciaIDE.toLowerCase().includes(texto)
    );

    const etiquetasFiltradas = ETIQUETAS_TERRITORIALES_OSM.filter(e => {
      const coincideTexto = !texto || e.tag.toLowerCase().includes(texto) || e.significado.toLowerCase().includes(texto) || e.aplicacionUAH.toLowerCase().includes(texto) || e.categoria.toLowerCase().includes(texto) || (e.institucion && e.institucion.toLowerCase().includes(texto)) || (e.ideChile && e.ideChile.toLowerCase().includes(texto)) || (e.citaAPA && e.citaAPA.toLowerCase().includes(texto));
      
      let coincideGrupo = false;
      if (filtroGrupo === 'todos') coincideGrupo = true;
      else if (filtroGrupo === 'brechas') coincideGrupo = e.ideChile.startsWith('Sin capa homóloga');
      else if (filtroGrupo === 'oficiales') coincideGrupo = !e.ideChile.startsWith('Sin capa homóloga');
      else coincideGrupo = (e.grupo === filtroGrupo);

      return coincideTexto && coincideGrupo;
    });

    const totalOficiales = ETIQUETAS_TERRITORIALES_OSM.filter(e => !e.ideChile.startsWith('Sin capa homóloga')).length;
    const totalBrechas = ETIQUETAS_TERRITORIALES_OSM.filter(e => e.ideChile.startsWith('Sin capa homóloga')).length;

    // 1. Tarjetas Superiores Sobrias e Interactivas de las 10 Macro-Categorías
    const tarjetasCategoriasHTML = `
      <div class="dicc-tarjetas-seccion">
        <div class="dicc-tarjetas-header">
          <span class="marcador">[ESTÁNDAR // ISO 19110]</span>
          <h3 style="display:inline; margin-left:6px;">Taxonomía Territorial: 10 Macro-Categorías VGI para Chile</h3>
          <p class="descripcion" style="margin-top:4px;">
            Seleccione <strong>[🔍 Filtrar]</strong> para aislar los descriptores de esa categoría en la tabla, o pulse <strong>[📖 Manual ↗]</strong> para abrir su ficha detallada en el <strong>Manual de Uso del Atlas</strong>:
          </p>
        </div>
        <div class="dicc-grid-tarjetas">
          ${CATEGORIAS_MAESTRAS.map(cat => `
            <div class="dicc-tarjeta-cat" data-codigo="${cat.codigo}">
              <div class="dicc-tarjeta-top">
                <span class="dicc-cat-badge">${cat.codigo}</span>
                <span class="dicc-cat-icono">${cat.icono}</span>
              </div>
              <h4 class="dicc-cat-titulo">${cat.nombre}</h4>
              <p class="dicc-cat-resumen">${cat.resumen}</p>
              <div class="dicc-tarjeta-acciones">
                <button type="button" class="dicc-btn-filtrar" onclick="ModuloDiccionario.filtrarPorCodigo('${cat.codigo}')" title="Filtrar descriptores de ${cat.codigo}">
                  🔍 Filtrar
                </button>
                <button type="button" class="dicc-btn-manual" onclick="ModuloDiccionario.irACategoriaManual('${cat.codigo}')" title="Ver guía metodológica y ejemplos en el Manual">
                  📖 Manual ↗
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // 2. Tabla de Atributos Normalizados
    const htmlAtributos = atributosFiltrados.map(a => {
      let enlaceDoc = '';
      if (a.campo === 'categoria') {
        enlaceDoc = `<button type="button" class="dicc-tag-cat-link" onclick="window.navegarAManual('doc-categorias')" style="margin-left:4px; font-size:0.75rem;">Ver 10 Cats ↗</button>`;
      } else if (a.campo === 'superficie_m2' || a.campo === 'superficie_ha') {
        enlaceDoc = `<button type="button" class="dicc-tag-cat-link" onclick="window.navegarAManual('doc-geodesia')" style="margin-left:4px; font-size:0.75rem;">Geodesia ↗</button>`;
      } else if (a.campo === 'licencia') {
        enlaceDoc = `<button type="button" class="dicc-tag-cat-link" onclick="window.navegarAManual('doc-gobernanza')" style="margin-left:4px; font-size:0.75rem;">Licencias ↗</button>`;
      }

      return `
        <tr style="border-bottom:1px solid var(--linea);">
          <td><strong style="color:var(--musgo); font-family:var(--fuente-datos);">${a.campo}</strong>${enlaceDoc}</td>
          <td><strong>${a.nombre}</strong><br><small style="color:var(--tinta-suave); font-family:var(--fuente-datos);">${a.tipo}</small></td>
          <td style="font-size:0.85rem;">${a.definicion}<br><span class="descripcion" style="font-style:italic;">Ejemplo: ${a.ejemplo}</span></td>
          <td style="font-size:0.82rem; background:var(--papel-alto); font-family:var(--fuente-datos);"><code>${a.equivalenciaIDE}</code></td>
          <td style="font-size:0.82rem;">${a.importancia}</td>
        </tr>
      `;
    }).join('');

    // 3. Tabla de Etiquetas Territoriales con Enlaces al Manual y Taginfo
    const htmlEtiquetas = etiquetasFiltradas.map(e => {
      const esBrecha = e.ideChile.startsWith('Sin capa homóloga');
      const badgeHomologia = esBrecha
        ? `<span style="display:inline-block; margin-top:3px; background:#4a231c; color:#eedec4; font-family:var(--fuente-datos); font-size:0.68rem; padding:2px 6px; border:1px solid #7c261e; letter-spacing:0.02em;">[BRECHA VGI] ${e.ideChile}</span>`
        : `<span style="display:inline-block; margin-top:3px; background:#1e3527; color:#d8eedb; font-family:var(--fuente-datos); font-size:0.68rem; padding:2px 6px; border:1px solid #385d49; letter-spacing:0.02em;">[OFICIAL IDE] ${e.ideChile}</span>`;

      return `
        <tr style="border-bottom:1px solid var(--linea);">
          <td>
            <code style="font-weight:600; color:var(--musgo); font-size:0.88rem;">${e.tag}</code>
            <div style="margin-top:4px;">
              ${e.tag.startsWith('dwc:')
                ? `<a href="https://dwc.tdwg.org/terms/#${e.tag.replace('dwc:', '')}" target="_blank" rel="noopener" class="btn-taginfo-inspector" style="font-family:var(--fuente-datos); font-size:0.68rem; padding:1px 5px; background:var(--papel); border:1px solid var(--musgo); color:var(--musgo); text-decoration:none; display:inline-block;">🌿 GBIF Darwin Core ↗</a>`
                : `<button type="button" class="btn-taginfo-inspector" onclick="ModuloDiccionario.inspeccionarTaginfo('${e.tag}')" style="font-family:var(--fuente-datos); font-size:0.68rem; padding:1px 5px; background:var(--papel); border:1px solid var(--musgo); color:var(--musgo); cursor:pointer; display:inline-block;">⚡ Taginfo API</button>`
              }
            </div>
          </td>
          <td><strong>${e.significado}</strong></td>
          <td>
            <button type="button" class="dicc-tag-cat-link" onclick="ModuloDiccionario.irACategoriaManual('${e.categoria}')" title="Ver ficha metodológica de ${e.categoria} en el Manual de Uso">
              ${e.categoria} ↗
            </button>
          </td>
          <td style="font-size:0.82rem;">
            <strong>${e.institucion || 'Comunidad OSM'}</strong><br>
            ${badgeHomologia}
          </td>
        </tr>
      `;
    }).join('');

    let bloqueAtributosHTML = '';
    if (mostrarAtributos) {
      bloqueAtributosHTML = `
        <div class="bloque">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
            <div>
              <span style="font-family:var(--fuente-datos); font-size:0.72rem; color:var(--musgo); text-transform:uppercase;">[CATÁLOGO DE OBJETOS // 23 ATRIBUTOS NORMALIZADOS]</span>
              <h3 style="margin:2px 0 0 0;">1. Esquema de Datos VGI y Ambiental Normalizado (Atributos IDE Chile / ISO 19110 / SUBDERE)</h3>
            </div>
          </div>
          <p class="descripcion">Cada entidad descargada, auditada o proyectada en el Atlas adopta esta estructura tabular estandarizada de 23 atributos conformes a <strong>ISO 19110 (Metodología para la catalogación de fenómenos geográficos)</strong>, el <strong>Perfil Nacional de Metadatos de Chile (IDE Chile / SNIT)</strong>, variables de gestión de residuos de <strong>SUBDERE</strong>, geometrías vectoriales OGC y métricas de área en m² (EPSG:32719):</p>
          <div style="overflow-x:auto;">
            <table class="tabla-datos" style="margin-top:10px; font-size:0.88rem;">
              <thead>
                <tr style="background:var(--papel-alto);">
                  <th>Campo</th>
                  <th>Nombre Atributo</th>
                  <th>Definición y Dominio</th>
                  <th>Equivalencia IDE Chile / ISO 19115</th>
                  <th>Relevancia para la Gestión</th>
                </tr>
              </thead>
              <tbody>
                ${htmlAtributos.length > 0 ? htmlAtributos : '<tr><td colspan="5" style="text-align:center; padding:12px; color:var(--tinta-suave);">No hay atributos que coincidan con la búsqueda.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    let bloqueEtiquetasHTML = '';
    if (mostrarEtiquetas) {
      bloqueEtiquetasHTML = `
        <div class="bloque" style="margin-top:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
            <div>
              <span style="font-family:var(--fuente-datos); font-size:0.72rem; color:var(--musgo); text-transform:uppercase;">[CATÁLOGO TERRITORIAL CHILE // ${ETIQUETAS_TERRITORIALES_OSM.length} DESCRIPTORES]</span>
              <h3 style="margin:2px 0 0 0;">2. Glosario de Etiquetas OSM: Capas Oficiales IDE (${totalOficiales}) vs Brechas VGI (${totalBrechas})</h3>
            </div>
            <a href="docs/categorias_tematicas_osm.xlsx" download="categorias_tematicas_osm.xlsx" class="accion secundaria" style="font-size:0.82rem; text-decoration:none; display:inline-flex; align-items:center; gap:6px; padding:5px 12px;">
              📊 Descargar Catálogo Excel (.xlsx con 4 Hojas y 104 Citas APA)
            </a>
          </div>

          <!-- Drawer / Modal para Taginfo API dentro del Diccionario -->
          <div id="visor-taginfo-diccionario" style="display:none; margin-bottom:14px; position:relative;">
            <button type="button" onclick="ModuloDiccionario.cerrarVisorTaginfo()" style="position:absolute; top:6px; right:8px; z-index:10; background:none; border:1px solid var(--linea); font-family:var(--fuente-datos); font-size:0.75rem; cursor:pointer; padding:2px 6px;">✕ Cerrar</button>
            <div id="visor-taginfo-diccionario-contenido"></div>
          </div>

          <p class="descripcion">
            <strong>Hallazgo metodológico para la gestión territorial:</strong> El análisis comparativo revela que <strong>${totalBrechas} de las ${ETIQUETAS_TERRITORIALES_OSM.length} etiquetas prioritarias</strong> corresponden a microelementos barriales (accesibilidad universal, quioscos, comercio de proximidad, mobiliario urbano y arbolado por género) que carecen de cobertura en la información estatal abierta vigente. La VGI opera como una infraestructura complementaria insustituible para el diagnóstico comunal.
          </p>
          <div style="overflow-x:auto;">
            <table class="tabla-datos" style="margin-top:10px; font-size:0.86rem;">
              <thead>
                <tr style="background:var(--papel-alto);">
                  <th>Etiqueta OSM (Tag)</th>
                  <th>Denominación Común en Chile</th>
                  <th>Categoría Atlas</th>
                  <th>Institución Contraparte / Homología IDE Chile</th>
                </tr>
              </thead>
              <tbody>
                ${htmlEtiquetas.length > 0 ? htmlEtiquetas : '<tr><td colspan="4" style="text-align:center; padding:12px; color:var(--tinta-suave);">No hay etiquetas que coincidan con el filtro seleccionado.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    return `
      ${tarjetasCategoriasHTML}

      <div class="caja-guia-referencia" style="margin-top:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
          <div>
            <h4>📖 Marco Metodológico de Catalogación Geográfica (ISO 19110 / SNIT Chile / APA 7ª ed.)</h4>
            <p style="margin-bottom:8px;">
              Para que los datos de Información Geográfica Voluntaria (VGI) sean aptos para revisión por personas no técnicas y comités académicos, deben regirse por el estándar <strong>ISO 19110 (Metodología para la catalogación de fenómenos geográficos)</strong> y el <strong>Catálogo de Objetos Geográficos de Chile v3.0 (IDE Chile / SNIT)</strong>. Esto garantiza que cada etiqueta abierta tenga un significado inequívoco, medible y contrastable con la cartografía municipal y fiscal.
            </p>
          </div>
          <div>
            <a href="docs/categorias_tematicas_osm.xlsx" download class="accion" style="font-size:0.82rem; text-decoration:none; padding:6px 14px; white-space:nowrap; display:inline-flex; align-items:center; gap:6px;">
              📥 Descargar categorias_tematicas_osm.xlsx
            </a>
          </div>
        </div>
        <ul style="margin-top:6px; font-size:0.85rem; line-height:1.45;">
          <li><strong>IDE Chile / SNIT (2020):</strong> <em>Catálogo de Objetos Geográficos de Chile v3.0: Estándar para la captura y clasificación de información geoespacial.</em> Ministerio de Bienes Nacionales. https://www.ide.cl</li>
          <li><strong>OpenStreetMap Wiki Chile (2024):</strong> <em>WikiProject Chile: Guía, directrices y convenciones comunitarias de mapeo para Chile.</em> https://wiki.openstreetmap.org/wiki/ES:Chile</li>
          <li><strong>Geofabrik & HeiGIT (2026):</strong> <em>Taginfo Chile: Regional OpenStreetMap Tag Usage and Statistics.</em> https://taginfo.geofabrik.de/south-america:chile</li>
          <li><strong>ISO/TC 211 (2016):</strong> <em>ISO 19110:2016: Geographic information — Methodology for feature cataloguing.</em> International Organization for Standardization.</li>
        </ul>
      </div>

      ${bloqueAtributosHTML}
      ${bloqueEtiquetasHTML}
    `;
  }

  return {
    ATRIBUTOS_NORMALIZADOS,
    ETIQUETAS_TERRITORIALES_OSM,
    CATEGORIAS_MAESTRAS,
    irACategoriaManual,
    filtrarPorCodigo,
    inspeccionarTaginfo,
    cerrarVisorTaginfo,
    render
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloDiccionario = ModuloDiccionario;
}
