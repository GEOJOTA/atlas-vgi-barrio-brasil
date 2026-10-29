# -*- coding: utf-8 -*-
PARTE_01 = r"""# PARTE I: ALCANCE OPERATIVO, FORMULACIÓN ESTRATÉGICA Y PERFILES TERRITORIALES

---

## Identificación y Alcance Operativo del Proyecto

El **Atlas de Información Geográfica Voluntaria para la Gestión Territorial (Nodo GeoAbierto)** constituye una infraestructura sociotécnica de datos espaciales, análisis urbano y visualización cartográfica interactiva orientada a la integración de información geoespacial oficial y colaborativa.



### Propósito y Misión Operativa
El proyecto surge de la necesidad de subsanar los vacíos de información territorial a microescala existentes en los instrumentos tradicionales de planificación y en las bases de datos catastrales del Estado de Chile. Mientras la información oficial presenta desactualización temporal y baja granularidad para equipamientos de escala barrial, la dinámica urbana cotidiana evoluciona con rapidez.

El Atlas opera como una **plataforma abierta y reproducible que articula geodatos abiertos (OpenStreetMap y GBIF), capas oficiales del Estado (IDE Chile, MINVU, INE, MTT/UOCT, MDSF, SUBDERE, Municipalidad de Santiago) y herramientas analíticas multicriterio**, democratizando el acceso a diagnósticos territoriales a escala de Manzana Censal y Unidad Vecinal.

### Delimitación Geodésica y Cobertura Territorial
El área de estudio piloto corresponde a un polígono continuo de **223,75 hectáreas** emplazado en el sector poniente de la comuna de Santiago Centro. Su delimitación geodésica estricta se encuentra definida en coordenadas geográficas WGS84 (EPSG:4326) y en su proyección métrica conforme oficial SIRGAS-Chile / UTM Huso 19 Sur (EPSG:32719):

```text
BBox_Barrio_Brasil (EPSG:4326) = [-70.6720, -33.4505, -70.6580, -33.4350]
  Longitud (Oeste a Este): -70.6720° a -70.6580°
  Latitud  (Sur a Norte) : -33.4505° a -33.4350°
```

* **Límite Norte:** Eje vial de Avenida San Pablo y calle Rosas (transición hacia Barrio Yungay).
* **Límite Sur:** Eje estructurante de Avenida Libertador Bernardo O'Higgins / Alameda (corredor de transporte metropolitano, Línea 1 de Metro con estaciones Los Héroes y República).
* **Límite Oriente:** Eje vial de Avenida Manuel Rodríguez (trinchera de la Autopista Central - Ruta 5 Norte-Sur).
* **Límite Poniente:** Eje vial de Avenida Ricardo Cumming y calle García Reyes.

---

## Formulación Estratégica: Objetivos del Proyecto

La estructura estratégica y operativa del proyecto se articula en un **Objetivo General** y **cuatro Objetivos Específicos (OE 1 a OE 4)** con fases secuenciales y metas verificables:

```text
┌────────────────────────────────────────────────────────────────────────┐
│             ESTRUCTURA ESTRATÉGICA DEL PROYECTO                        │
├────────────────────────────────────────────────────────────────────────┤
│ • OE 1: Caracterización y Diseño Conceptual                            │
│ • OE 2: Geodatabase y Calidad Espacial                                 │
│ • OE 3: Geoportal Web Interactivo                                      │
│ • OE 4: Validación y Transferibilidad                                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Objetivo General del Proyecto
> **Desarrollar un Atlas de Información Geográfica Voluntaria (VGI) reproducible, interoperable y centrado en usuarios que subsane vacíos de información territorial en el Barrio Brasil y la Comuna de Santiago, articulando geodatos abiertos, cartografía participativa y herramientas analíticas para la gestión local y la investigación territorial.**

---

### Objetivos Específicos y Metas Operativas

#### Objetivo Específico 1 (OE 1): Caracterización y Diseño Conceptual
* **Estado Operativo:** **100% Completado (Hitos 1, 2 y 3).**
* **Definición Formal:**
  > Caracterizar la disponibilidad, cobertura y vacíos de información geográfica en el área de estudio de Barrio Brasil y la Comuna de Santiago, estructurando las bases conceptuales, taxonómicas y de diseño centrado en el usuario necesarias para articular los geodatos colaborativos e institucionales a la gestión territorial.
* **Componentes Ejecutados:**
  - Revisión exhaustiva de plataformas de geodatos abiertos (OpenStreetMap, GBIF, ohsome API v1/v2) y servicios WFS/WMS de IDE Chile.
  - Estructuración de las **10 Macrocategorías Comunitarias VGI (CAT-01 a CAT-10)** normalizadas bajo etiquetas OSM y Darwin Core.
  - Modelamiento conceptual y caracterización de los **4 Perfiles de Actores Territoriales** mediante metodologías de diseño centrado en el usuario.

```mermaid
flowchart LR
    subgraph OBJ1["1. Objetivo Específico 1"]
        O1["OE 1: Caracterización y Diseño Conceptual"]
    end

    subgraph PROC1["2. Procedimientos Específicos"]
        P1_1["1. Auditoría de Plataformas VGI\n(OSM, GBIF, IDE Chile)"]
        P1_2["2. Estructuración Taxonómica\n10 Macrocategorías VGI"]
        P1_3["3. Diseño Centrado en el Usuario\nde 4 Perfiles de Actores"]
    end

    subgraph PROD1["3. Productos Resultantes Específicos"]
        PR1_1["Catálogo de Fuentes VGI\n& Matriz de Brechas"]
        PR1_2["Taxonomía de 10 Macrocategorías\n(CAT-01 a CAT-10)"]
        PR1_3["Matriz Conceptual de 4 Perfiles\npara la Plataforma Web"]
    end

    subgraph LOC1["4. Localización / Fuente Oficial en Git y Web"]
        L1_1["docs/catalogo_fuentes_vgi.xlsx\n& src/docs/catalogo_fuentes_vgi.xlsx"]
        L1_2["docs/categorias_tematicas_osm.xlsx\n& src/docs/categorias_tematicas_osm.xlsx"]
        L1_3["docs/ARQUITECTURA.md, docs/TRAZABILIDAD_ACADEMICA.md\n& src/js/app.js (#sel-perfil-usuario)"]
    end

    O1 --> P1_1 --> PR1_1 --> L1_1
    O1 --> P1_2 --> PR1_2 --> L1_2
    O1 --> P1_3 --> PR1_3 --> L1_3
```

* **Entregables Acreditados y Localización:**

| N° | Entregable Acreditado | Tipo de Producto | Fuente / Localización Oficial en el Proyecto |
|:---:|:---|:---:|:---|
| **E-01** | Documento Metodológico de Arquitectura Conceptual: 10 Macrocategorías VGI y 4 Perfiles de Actores Territoriales. | Metodológico / Conceptual | `docs/ARQUITECTURA.md`, `docs/TRAZABILIDAD_ACADEMICA.md` y `docs/MANUAL_ACTUALIZACION_ATLAS.md` (`src/docs/`) |
| **E-02** | Catálogo de Fuentes Geoespaciales y Matriz de Brechas de Información Barrial. | Catálogo / Datos | `docs/catalogo_fuentes_vgi.xlsx` y `src/docs/catalogo_fuentes_vgi.xlsx` |

---

#### Objetivo Específico 2 (OE 2): Geodatabase y Calidad Espacial
* **Estado Operativo:** **100% Completado (Hitos 4, 5 y 6).**
* **Definición Formal:**
  > Diseñar, estructurar y consolidar una geodatabase espacial multipropósito bajo estándares internacionales de calidad geográfica y metadatos, integrando y armonizando coberturas cartográficas oficiales del Estado con información comunitaria voluntaria.
* **Componentes Ejecutados:**
  - Descarga, normalización y geoprocesamiento de **132 coberturas vectoriales (122 oficiales del Estado de Chile + 10 VGI comunitarias)**, totalizando 3,33 GB de datos en EPSG:4326 y EPSG:32719.
  - Almacenamiento espacial estructurado en clúster relacional PostgreSQL 17 + PostGIS 3.3 (Supabase Cloud) con más de 1.552.000 entidades indexadas mediante árboles GiST y claves JSONB con índices GIN.
  - Formulación y ejecución del **Modelo de MetaCalidad WLC v2.0 bajo norma ISO 19157:2013**, integrando 5 componentes cuantitativos (topología, completitud, geodésica, esquema y granularidad) y 5 componentes cualitativos (metadatos núcleo, linaje, conformidad ISO, escala y accesibilidad), certificando un **96,55% / 97,88% de metacalidad global (Grado A+ Excelente)**.
  - Inyección algorítmica universal del **Esquema Maestro de 14 Atributos Normalizados ISO** en la totalidad de capas vectoriales para descargas transparentes.

```mermaid
flowchart LR
    subgraph OBJ2["1. Objetivo Específico 2"]
        O2["OE 2: Geodatabase y Calidad Espacial"]
    end

    subgraph PROC2["2. Procedimientos Específicos"]
        P2_1["1. Extracción Python & Descarga\nde Geoportales del Estado"]
        P2_2["2. Inyección Universal Esquema\n14 Columnas Estandarizadas ISO"]
        P2_3["3. Calidad WLC v2.0 (ISO 19157)\n& OSMCha / Changesets v0.6"]
        P2_4["4. Carga Espacial\nPostgreSQL 17 / PostGIS 3.3"]
    end

    subgraph PROD2["3. Productos Resultantes Específicos"]
        PR2_1["132 Capas Vectoriales GeoJSON\n(122 Oficiales + 10 VGI)"]
        PR2_2["Bases Vectoriales con Linaje,\nFuente y Fechas ISO"]
        PR2_3["Certificación Grado A+ MetaCalidad\n& Matriz Analítica WLC"]
        PR2_4["Geodatabase Relacional PostGIS\ncon Índices GiST y GIN"]
    end

    subgraph LOC2["4. Localización / Fuente Oficial en Git y Web"]
        L2_1["src/data/*.geojson & data/*.geojson\n& scripts/descargar_todas_las_categorias_osm.py"]
        L2_2["scripts/enriquecer_base_datos_metadatos.py\n& docs/perfil_metadatos_vgi.xlsx (src/docs/)"]
        L2_3["docs/ANALISIS_METACALIDAD.md, docs/matriz_metacalidad.json\n& docs/wlc_metacalidad_resultado.json (src/docs/)"]
        L2_4["scripts/db/01_schema_postgis.sql, 02_seed_metadata.sql\n& docs/GUIA_BASE_DATOS_SUPABASE.md"]
    end

    O2 --> P2_1 --> PR2_1 --> L2_1
    O2 --> P2_2 --> PR2_2 --> L2_2
    O2 --> P2_3 --> PR2_3 --> L2_3
    O2 --> P2_4 --> PR2_4 --> L2_4
```

* **Entregables Acreditados y Localización:**

| N° | Entregable Acreditado | Tipo de Producto | Fuente / Localización Oficial en el Proyecto |
|:---:|:---|:---:|:---|
| **E-03** | Repositorio de Geodatabase Espacial de 132 Coberturas Vectoriales GeoJSON (EPSG:4326). | Geodatabase Vectorial | `src/data/*.geojson` y `data/*.geojson` (3,33 GB totales) |
| **E-04** | Base de Datos Espacial PostgreSQL 17 + PostGIS 3.3 desplegada en Cloud con Funciones RPC. | Base Relacional Espacial | `scripts/db/01_schema_postgis.sql`, `scripts/db/02_seed_metadata.sql` y `docs/GUIA_BASE_DATOS_SUPABASE.md` (`src/docs/`) |
| **E-05** | Matriz Analítica y Reporte de Certificación de MetaCalidad Espacial ISO 19157:2013 (Grado A+). | Matriz / Certificación | `docs/ANALISIS_METACALIDAD.md`, `docs/matriz_metacalidad.json`, `docs/wlc_metacalidad_resultado.json`, `docs/wlc_metacalidad_ranking.csv` y `docs/correlacion_dimensiones_calidad.csv` (`src/docs/`) |
| **E-06** | Catálogo Maestro de Geodatos en Formato OpenXML y Esquema de 14 Columnas Normalizadas ISO. | Catálogo Tabular OGC | `docs/categorias_tematicas_osm.xlsx` y `docs/perfil_metadatos_vgi.xlsx` (`src/docs/`) |

---

#### Objetivo Específico 3 (OE 3): Geoportal Web Interactivo
* **Estado Operativo:** **100% Completado (Hitos 7 y 8).**
* **Definición Formal:**
  > Desarrollar e implementar un geoportal web interactivo, accesible e interoperable, orientado a la visualización cartográfica multinivel, la consulta analítica territorial en tiempo real y la transferencia de geodatos abiertos a la comunidad.
* **Componentes Ejecutados:**
  - Desarrollo de una plataforma web interactiva y modular con diseño accesible, garantizando portabilidad absoluta y autonomía tecnológica.
  - Implementación del visor cartográfico interactivo (Leaflet 1.9.4) con control de capas en acordeón jerárquico, selectores de mapas base y herramientas de medición de distancias y superficies.
  - Programación del **Inspector Normativo Territorial del PRC de Santiago**, que ejecuta en el navegador algoritmos de intersección espacial y análisis geométrico para evaluar la normativa comunal y emitir instantáneamente el Certificado de Informaciones Normativas VGI (CIN-VGI).
  - Integración dinámica en tiempo real con Overpass QL API, ohsome API v1/v2 (HeiGIT) y GBIF Occurrence API.
  - Generador de fichas de metadatos estandarizadas en XML ISO 19139 conforme al Perfil Nacional de Metadatos de IDE Chile / SNIT v2.0.
  - Automatización del despliegue y publicación continua en la nube (https://atlasvgiuah.netlify.app/).

```mermaid
flowchart LR
    subgraph OBJ3["1. Objetivo Específico 3"]
        O3["OE 3: Geoportal Web Interactivo"]
    end

    subgraph PROC3["2. Procedimientos Específicos"]
        P3_1["1. Desarrollo de Interfaz Web\nModular y Accesible"]
        P3_2["2. Integración Motor Cartográfico\nLeaflet 1.9.4 & Marcadores SVG"]
        P3_3["3. Algoritmos de Intersección Espacial\ny Evaluación Normativa Comunal"]
        P3_4["4. Conexión Clientes API en Vivo\n(Overpass QL, ohsome v1/v2, GBIF)"]
        P3_5["5. Automatización de Despliegue\ny Publicación Continua en la Nube"]
    end

    subgraph PROD3["3. Productos Resultantes Específicos"]
        PR3_1["Plataforma Web Interactiva\n10 Módulos Operativos"]
        PR3_2["Visor Cartográfico Multinivel con\nSelector de Mapas Base y Filtros"]
        PR3_3["Certificado de Informaciones\nNormativas Digital (CIN-VGI)"]
        PR3_4["Módulos Dinámicos de Consulta,\nCalidad Temporal y Biodiversidad"]
        PR3_5["Geoportal Web en Producción Viva"]
    end

    subgraph LOC3["4. Localización / Fuente Oficial en Git y Web"]
        L3_1["src/index.html, src/css/estilos.css,\nsrc/js/config.js & src/js/app.js"]
        L3_2["src/js/modulos/mapa.js\n& src/js/modulos/ide_chile.js"]
        L3_3["src/js/modulos/evaluador_normativo.js,\nsrc/data/ide_minvu_ipt_prc_santiago.geojson & capa_ipt_prc_comunal.geojson"]
        L3_4["src/js/modulos/osm.js, ohsome.js,\ncalidad_analyst.js & gbif.js"]
        L3_5["netlify.toml (Edge CDN Headers)\n& URL: https://atlasvgiuah.netlify.app/"]
    end

    O3 --> P3_1 --> PR3_1 --> L3_1
    O3 --> P3_2 --> PR3_2 --> L3_2
    O3 --> P3_3 --> PR3_3 --> L3_3
    O3 --> P3_4 --> PR3_4 --> L3_4
    O3 --> P3_5 --> PR3_5 --> L3_5
```

* **Entregables Acreditados y Localización:**

| N° | Entregable Acreditado | Tipo de Producto | Fuente / Localización Oficial en el Proyecto |
|:---:|:---|:---:|:---|
| **E-07** | Plataforma Web en Producción Operativa con 10 Módulos Funcionales (Leaflet 1.9.4). | Geoportal Web Interactivo | `src/index.html`, `src/js/app.js` y URL: https://atlasvgiuah.netlify.app/ |
| **E-08** | Módulo Evaluador e Inspector Normativo Territorial del PRC de Santiago (Evaluación Espacial CIN-VGI). | Motor de Análisis Espacial en Navegador | `src/js/modulos/evaluador_normativo.js`, `src/data/ide_minvu_ipt_prc_santiago.geojson` y `src/data/capa_ipt_prc_comunal.geojson` |
| **E-09** | Generador Interactivo de Metadatos Espaciales ISO 19115 / XML ISO 19139 para IDE Chile. | Motor de Metadatos XML | `src/js/modulos/metadatos.js` y `docs/perfil_metadatos_vgi.xlsx` (`src/docs/`) |
| **E-10** | Diccionario Territorial Interactivo con 140 Descriptores Normativos y Etiquetas OSM. | Glosario Interactivo | `src/js/modulos/diccionario.js` y `docs/DICCIONARIO_CATASTRO_RSD_SUBDERE_2024.md` (`src/docs/`) |

---

#### Objetivo Específico 4 (OE 4): Validación y Transferibilidad
* **Estado Operativo:** **100% Completado (Hitos 9 y 10).**
* **Definición Formal:**
  > Evaluar la usabilidad, pertinencia y aplicabilidad práctica de la plataforma con los diferentes perfiles de actores territoriales, asegurando la transferibilidad técnica, metodológica y documental de la solución desarrollada para su adopción y sostenibilidad operativa.
* **Componentes Ejecutados:**
  - Proceso sistemático y participativo de validación con usuarios y organizaciones territoriales de los 4 perfiles definidos, recogiendo retroalimentación cualitativa y evaluando la pertinencia, facilidad de uso y utilidad práctica de la plataforma en el territorio.
  - Redacción y publicación del **Manual de Actualización Técnica y Transferibilidad** (>5000 líneas), documentando exhaustivamente la arquitectura multi-lenguaje, scripts Python, PostGIS, netlify.toml y resolución técnica de incidentes.
  - Compilación del archivo comprimido maestro unificado `docs/geodatabase_completa_atlas_vgi.zip` y `src/docs/geodatabase_completa_atlas_vgi.zip` (542,35 MB comprimidos / 3,33 GB crudos) para descarga pública.

```mermaid
flowchart LR
    subgraph OBJ4["1. Objetivo Específico 4"]
        O4["OE 4: Validación y Transferibilidad"]
    end

    subgraph PROC4["2. Procedimientos Específicos"]
        P4_1["1. Proceso de Validación con Usuarios\ny Actores Territoriales"]
        P4_2["2. Redacción Manual de Uso Web\npara los 4 Perfiles de Actores"]
        P4_3["3. Elaboración Manual Técnico de\nActualización Reproducible (>5000L)"]
        P4_4["4. Empaquetado & Compresión BBDD\n(GeoJSON, GPKG, XLSX, CSV en ZIP)"]
    end

    subgraph PROD4["3. Productos Resultantes Específicos"]
        PR4_1["Sistematización de Validación\ncon Usuarios y Retroalimentación"]
        PR4_2["Manual de Usuario del Geoportal\nGuía Ilustrada por Perfiles"]
        PR4_3["Manual Maestro de Administración,\nArquitectura y Transferibilidad Técnica"]
        PR4_4["Paquete Maestro Comprimido ZIP\nBase de Datos Funcional Completa"]
    end

    subgraph LOC4["4. Localización / Fuente Oficial en Git y Web"]
        L4_1["Documentación de Validación\ncon Usuarios Territoriales (docs/)"]
        L4_2["MANUAL_USO.md, docs/MANUAL_USO.md\n& src/docs/MANUAL_USO.md (Módulo 07)"]
        L4_3["MANUAL_ACTUALIZACION_ATLAS.md, docs/MANUAL_ACTUALIZACION_ATLAS.md\n& src/docs/MANUAL_ACTUALIZACION_ATLAS.md"]
        L4_4["docs/geodatabase_completa_atlas_vgi.zip, src/docs/\n& scripts/empaquetar_base_datos_completa.py"]
    end

    O4 --> P4_1 --> PR4_1 --> L4_1
    O4 --> P4_2 --> PR4_2 --> L4_2
    O4 --> P4_3 --> PR4_3 --> L4_3
    O4 --> P4_4 --> PR4_4 --> L4_4
```

* **Entregables Acreditados y Localización:**

| N° | Entregable Acreditado | Tipo de Producto | Fuente / Localización Oficial en el Proyecto |
|:---:|:---|:---:|:---|
| **E-11** | Sistematización de Validación con Usuarios y Retroalimentación de Actores Territoriales. | Validación con Usuarios | Documentación de validación con usuarios territoriales (`docs/TRAZABILIDAD_ACADEMICA.md` y `src/docs/`) |
| **E-12** | Manual de Uso del Atlas VGI: Guía Ilustrada para los 4 Perfiles Territoriales. | Manual de Usuario | `MANUAL_USO.md`, `docs/MANUAL_USO.md` y `src/docs/MANUAL_USO.md` (Módulo 07 web) |
| **E-13** | Manual Maestro de Actualización Técnica y Transferibilidad Metodológica: Protocolo ETL, Arquitectura y Despliegue Continuo. | Manual Maestro (>5000L) | `MANUAL_ACTUALIZACION_ATLAS.md`, `docs/MANUAL_ACTUALIZACION_ATLAS.md` y `src/docs/MANUAL_ACTUALIZACION_ATLAS.md` |
| **E-14** | Geodatabase Definitiva, Diccionario de Datos y Paquete Maestro de Distribución OGC en Formato ZIP. | Paquete de Datos Binario | `docs/geodatabase_completa_atlas_vgi.zip`, `src/docs/geodatabase_completa_atlas_vgi.zip` y `PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md` |

---

## Matriz de Cumplimiento de los 10 Hitos del Proyecto

```mermaid
flowchart TD
    subgraph FASE1["FASE I: Caracterización y Diseño Conceptual"]
        H1["Hito 1: Diagnóstico Territorial & Revisión de Fuentes"] --> H2["Hito 2: Taxonomía 10 Cat. VGI & 4 Perfiles Actor"]
        H2 --> H3["Hito 3: Inventario de Fuentes & Detección de Brechas"]
    end

    subgraph FASE2["FASE II: Geodatabase Espacial & Calidad ISO"]
        H4["Hito 4: Extracción Overpass QL & Descarga 132 Capas"] --> H5["Hito 5: Modelo WLC ISO 19157 (Grado A+) & 14 Atributos"]
        H5 --> H6["Hito 6: Cruces Espaciales & Análisis Multidimensional"]
    end

    subgraph FASE3["FASE III: Geoportal Web & Despliegue"]
        H7["Hito 7: Plataforma Web Interactiva & APIs en Vivo"] --> H8["Hito 8: Inspector Normativo PRC, Storyboards & Despliegue en la Nube"]
    end

    subgraph FASE4["FASE IV: Validación & Transferibilidad"]
        H9["Hito 9: Validación con Usuarios Territoriales"] --> H10["Hito 10: Manual Maestro, ZIP 558.5MB & Transferibilidad Técnica"]
    end

    FASE1 --> FASE2
    FASE2 --> FASE3
    FASE3 --> FASE4
```

| Hito | Denominación Oficial | OE Asociado | Fase | Estado | Entregable Verificable y Ruta en Git / Plataforma Web |
|:---:|:---|:---:|:---:|:---:|:---|
| **Hito 1** | Diagnóstico territorial y revisión de plataformas VGI. | **OE 1** | Fase I | **100% Cerrado** | `docs/ARQUITECTURA.md` y `docs/catalogo_fuentes_vgi.xlsx` (`src/docs/`) |
| **Hito 2** | Estructuración de 10 macrocategorías VGI y 4 perfiles multiactor. | **OE 1** | Fase I | **100% Cerrado** | `docs/categorias_tematicas_osm.xlsx` (`src/docs/`) y `src/js/config.js` |
| **Hito 3** | Inventario exhaustivo de fuentes colaborativas y oficiales. | **OE 1** | Fase I | **100% Cerrado** | `docs/catalogo_fuentes_vgi.xlsx` y `docs/TRAZABILIDAD_ACADEMICA.md` (`src/docs/`) |
| **Hito 4** | Pipeline de descarga y extracción automatizada de geodatos. | **OE 2** | Fase II | **100% Cerrado** | `scripts/descargar_todas_las_categorias_osm.py`, `data/*.geojson` y `src/data/*.geojson` (132 capas) |
| **Hito 5** | Auditoría de calidad ISO 19157 (WLC v2.0) e inyección de 14 atributos. | **OE 2** | Fase II | **100% Cerrado** | `docs/ANALISIS_METACALIDAD.md`, `docs/matriz_metacalidad.json`, `docs/wlc_metacalidad_resultado.json` y `docs/perfil_metadatos_vgi.xlsx` |
| **Hito 6** | Cruces espaciales barriales y análisis en 5 dimensiones territoriales. | **OE 2** | Fase II | **100% Cerrado** | `data/matriz_sintesis_barrio_brasil_manzanas.geojson`, `data/resumen_catastro_vgi.csv` y `data/bip_inversiones_santiago.csv` |
| **Hito 7** | Arquitectura web interactiva modular, visor cartográfico y APIs en vivo. | **OE 3** | Fase III | **100% Cerrado** | `src/index.html`, `src/css/estilos.css`, `src/js/app.js` y `src/js/modulos/*.js` |
| **Hito 8** | Inspector Normativo PRC, Storyboards barriales y despliegue en la nube. | **OE 3** | Fase III | **100% Cerrado** | `src/js/modulos/evaluador_normativo.js`, `src/js/modulos/indicadores_analisis.js` y `netlify.toml` |
| **Hito 9** | Proceso de validación de la plataforma con usuarios y organizaciones territoriales. | **OE 4** | Fase IV | **100% Cerrado** | Documentación de validación con usuarios, `MANUAL_USO.md` y `docs/MANUAL_USO.md` (`src/docs/`) |
| **Hito 10** | Suite de integridad, ZIP masivo y Manual Maestro de Actualización. | **OE 4** | Fase IV | **100% Cerrado** | `scripts/verificar_integridad_despliegue.py`, `docs/geodatabase_completa_atlas_vgi.zip` y `MANUAL_ACTUALIZACION_ATLAS.md` |

---

## Los Cuatro Perfiles de Actores Territoriales (Alineación con Plataforma Web en Vivo)

En estricta coherencia con la interfaz web desplegada en producción (`https://atlasvgiuah.netlify.app/`) y el selector dinámico `#sel-perfil-usuario` configurado en `src/index.html` y `src/js/app.js`, el Atlas estructura sus herramientas y accesos en torno a **cuatro perfiles de actores territoriales** formulados bajo el enfoque de diseño centrado en el usuario:

```text
┌────────────────────────────────────────────────────────────────────────┐
│             LOS 4 PERFILES DE ACTORES TERRITORIALES (EN VIVO)          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 🏛 Autoridades / Instituciones (IDE / Municipio)      [institucion]  │
│ 2. 🗫 Organizaciones Comunitarias / Vecinos               [comunidad]    │
│ 3. ⌖ Mapeadores / Voluntarios OSM                        [voluntario]   │
│ 4. 🔬 ONGs / Territoriales                                [ong]          │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Perfil 1: Autoridades / Instituciones (IDE / Municipio) [`institucion`]
* **Definición Canónica en Plataforma:**
  > *"🏛 Perfil Institucional / Municipal / IDE Chile: Prioriza metadatos normalizados (ISO 19115/19139), catastro de equipamiento crítico, licencias abiertas y control de calidad espacial."*
* **Actores Destinatarios:** Profesionales de la Secretaría Comunal de Planificación (SECPLA), Dirección de Obras Municipales (DOM), Dirección de Medio Ambiente, Aseo y Ornato (DIMAO) de la Municipalidad de Santiago; analistas sectoriales de ministerios (MINVU, MOP, MIDESO/RSH, MTT/UOCT, SUBDERE) y equipo de IDE Chile / SNIT.
* **Requerimientos Territoriales Críticos:**
  - Consulta y verificación espacial de las zonas normativas del Plan Regulador Comunal de Santiago (PRC) mediante el **Inspector Normativo Territorial**, obteniendo usos de suelo permitidos (UPERM), usos prohibidos (UPROH), alturas máximas y coeficientes de constructibilidad.
  - Cruce de iniciativas de inversión pública del Banco Integrado de Proyectos (BIP / MDSF) con la cobertura censal del INE Censo 2024 a nivel de Manzana y Zona Censal.
  - Auditoría de metadatos conforme al Perfil Nacional de Metadatos de Chile (Decreto N° 28 de Bienes Nacionales) y descarga de archivos XML estructurados bajo norma ISO 19139:2007.
* **Paneles y Módulos Prioritarios en la Plataforma Web:**
  1. `metadatos-iso` (Módulo 08): Generador y visualizador de metadatos estandarizados ISO 19115 / ISO 19139.
  2. `inicio` (Módulo 01): Inspector Normativo PRC (Certificado CIN-VGI) y árbol de 122 capas oficiales + 10 VGI.
  3. `diccionario` (Módulo 09): Homologación de 140 descriptores territoriales (ISO 19110) entre la OGUC, el PRC y la cartografía.
  4. `licencias` (Módulo 10): Matriz de gobernanza legal, licencias estatales y catálogo de capas en OpenXML (.xlsx).

---

### Perfil 2: Organizaciones Comunitarias / Vecinos [`comunidad`]
* **Definición Canónica en Plataforma:**
  > *"🗫 Perfil Comunitario / Vecinal: Facilita consultas rápidas en 1 clic para plazas, patrimonio, ciclovías, comercios locales y mapeo barrial colaborativo en UMap."*
* **Actores Destinatarios:** Juntas de Vecinos de Barrio Brasil y Santiago, comités de vivienda de cités y pasajes residenciales, colectivos de patrimonio barrial, asambleas vecinales, comerciantes tradicionales y residentes locales.
* **Requerimientos Territoriales Críticos:**
  - Acceso inmediato en 1 clic a la ubicación de servicios de proximidad: centros de salud familiar (CESFAM DEIS), farmacias populares, puntos limpios y áreas verdes.
  - Reconocimiento y visibilización de la microred habitacional de cités y pasajes peatonales no detallados en los catastros prediales del Estado.
  - Detección de barreras de accesibilidad universal: esquinas sin rebajes peatonales normativos (rampas PMR) y pavimentos deteriorados.
  - Integración con proyectos cartográficos comunitarios mediante la plataforma uMap para el mapeo colaborativo barrial.
* **Paneles y Módulos Prioritarios en la Plataforma Web:**
  1. `inicio` (Módulo 01): Visor cartográfico intuitivo con filtros táctiles rápidos por categoría barrial.
  2. `explorador-osm` (Módulo 02): Consultas temáticas directas sobre arbolado, patrimonio y comercio local.
  3. `proyectos-umap` (Módulo 04): Visualizador de mapas colaborativos y participativos comunitarios embebidos.
  4. `diccionario` (Módulo 09): Glosario simplificado de términos urbanos y zonificaciones patrimoniales.

---

### Perfil 3: Mapeadores / Voluntarios OSM [`voluntario`]
* **Definición Canónica en Plataforma:**
  > *"⌖ Perfil Mapeador / Voluntario OSM: Herramientas analíticas avanzadas, métricas geométricas ohsome v1 (longitud/área/densidad), editor Overpass QL y taxonomía."*
* **Actores Destinatarios:** Comunidad de mapeadores voluntarios de OpenStreetMap Chile, colaboradores de HOT (Humanitarian OpenStreetMap Team) y especialistas en geoinformación colaborativa.
* **Requerimientos Territoriales Críticos:**
  - Consola interactiva con soporte de consultas Overpass QL en tiempo real parametrizadas sobre el Bounding Box de Barrio Brasil.
  - Monitoreo histórico y analítico de aportes mediante **ohsome API v1/v2 (HeiGIT)**: recuento de ediciones por usuario, densidad temporal de nodos, evolución de huellas edilicias e **Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157)**.
  - Homologación de etiquetas semánticas y taxonomías temáticas contrastadas con el servicio Taginfo.
  - Control de consistencia topológica y detección de geometrías nulas o duplicadas para enriquecer la base global de OSM.
* **Paneles y Módulos Prioritarios en la Plataforma Web:**
  1. `explorador-osm` (Módulo 02): Editor y ejecutor de consultas Overpass QL con descarga directa en GeoJSON.
  2. `calidad-ohsome` (Módulo 06): Analítica temporal de contribuciones, saturación OQT y auditoría de changesets OSMCha.
  3. `diccionario` (Módulo 09): Taxonomía exhaustiva de etiquetas OSM aplicadas a la realidad chilena.
  4. `manual` (Módulo 07): Especificaciones de ingeniería de datos y esquemas de atributos normalizados.

---

### Perfil 4: ONGs / Territoriales [`ong`]
* **Definición Canónica en Plataforma:**
  > *"🔬 Perfil ONGs / Territoriales: Proporciona cálculo de densidades territoriales rigurosas mediante reproyección EPSG:32719, calidad ISO 19157 con ohsome v1/v2, exportación GeoJSON para QGIS, articulación comunitaria y fuentes bibliográficas."*
* **Actores Destinatarios:** Organizaciones no gubernamentales (ONGs) de derecho a la ciudad, corporaciones de desarrollo barrial, centros de investigación socioespacial, observatorios urbanos e investigadores territoriales.
* **Requerimientos Territoriales Críticos:**
  - Descarga masiva de coberturas vectoriales en formatos geográficos interoperables (GeoJSON WGS84, GeoPackage SQLite OGC y tablas CSV UTF-8) listas para procesamiento en software SIG de escritorio (QGIS, ArcGIS Pro).
  - Cálculo de densidades y métricas espaciales geodésicamente rigurosas mediante reproyección conforme a SIRGAS-Chile / UTM 19S (EPSG:32719).
  - Certificación y trazabilidad de calidad espacial conforme a la norma ISO 19157 (matriz WLC v2.0 Grado A+ e Índice de Saturación y Maduración Territorial).
  - Trazabilidad documental y bibliográfica formal con 125 referencias en norma APA 7ª edición para fundamentar estudios urbanos y propuestas de política pública local.
* **Paneles y Módulos Prioritarios en la Plataforma Web:**
  1. `indicadores` (Módulo 05): Diagnóstico barrial en las 5 dimensiones territoriales y 4 Storyboards analíticos (75 cartografías).
  2. `calidad-ohsome` (Módulo 06): Certificación de metacalidad ISO 19157 y métricas de saturación espacial.
  3. `licencias` (Módulo 10): Descarga de catálogos maestros en OpenXML (.xlsx) y paquete ZIP unificado (558,5 MB).
  4. `metadatos-iso` (Módulo 08): Fichas técnicas completas con linaje de captura y fechas de actualización.

---
"""
print("[+] Parte 01 enriquecida cargada exitosamente")
