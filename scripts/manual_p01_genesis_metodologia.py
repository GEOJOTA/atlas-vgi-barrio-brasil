# -*- coding: utf-8 -*-
PARTE_01 = r"""# PARTE I: ALCANCE OPERATIVO, FORMULACIÓN ESTRATÉGICA Y PERFILES TERRITORIALES

---

## 1. Identificación y alcance operativo del proyecto

El **Atlas de Información Geográfica Voluntaria (VGI) para la gestión territorial (Nodo GeoAbierto)** es una plataforma web abierta que reúne mapas oficiales y colaborativos para el diagnóstico urbano, la consulta normativa y la descarga de datos espaciales en el sector poniente de la comuna de Santiago, con foco en el Barrio Brasil y el entorno del Campus Universidad Alberto Hurtado (UAH).

El sistema articula estándares del Open Geospatial Consortium (OGC) y de la Organización Internacional de Normalización (ISO 19115 para metadatos, ISO 19157 para calidad espacial e ISO 19110 para catalogación de objetos geográficos). Para evitar la repetición de conteos a lo largo del documento, la Tabla 1.1 concentra las cifras clave del proyecto que sirven de referencia para los capítulos siguientes.

### Tabla 1.1. Cifras clave del proyecto (referencia general)

| Indicador o componente | Valor verificado | Definición operativa y alcance |
| :--- | :---: | :--- |
| **Coberturas cartográficas totales** | 134 capas | 124 capas oficiales del Estado de Chile + 10 macrocategorías de información geográfica voluntaria (VGI). |
| **Volumen de datos espaciales** | 3,33 GB (542,35 MB en ZIP) | 220 archivos GeoJSON en `src/data/` y paquete descargable `docs/geodatabase_completa_atlas_vgi.zip` (257 archivos en 7 subcarpetas). |
| **Descriptores del diccionario de datos** | 140 descriptores | Atributos documentados bajo la norma ISO 19110:2016, incluyendo la identificación de 86 brechas temáticas entre catastros públicos y mapeo ciudadano. |
| **Cartografías temáticas e indicadores** | 83 cartografías | Distribuidas en 4 guiones visuales (*storyboards*) territoriales y 5 dimensiones de análisis urbano en el Módulo 05. |
| **Índice Global de Calidad VGI (IGV)** | 95,4 % (95,41 %) | Promedio multicriterio de calidad espacial (modelo de combinación lineal ponderada, WLC, bajo ISO 19157) evaluado sobre las 134 capas del catálogo (91 en grado A+ y 43 en grado A). |
| **Índice Global de Metacalidad Documental (IGMC)** | 96,55 % | Porcentaje de cumplimiento de los campos documentales obligatorios del Perfil Nacional de Metadatos IDE Chile (ISO 19115 / XML ISO 19139) en el generador del Módulo 08. |
| **Conformidad de accesibilidad web** | WCAG 2.1 AA / AAA | Nivel AA general en todos los componentes interactivos (contraste de 4,58:1 a 8,87:1) y nivel AAA en todo el texto de lectura (contraste de 9,43:1 a 19,00:1). |
| **Arquitectura de software** | 21 módulos JS y 25 scripts Python | Aplicación web sin compilación previa en `src/js/` y conjunto de scripts de extracción, validación y empaquetado en `scripts/`. |

### 1.1. Propósito y misión operativa
El proyecto responde a la necesidad de cubrir los vacíos de información territorial a escala de manzana censal y unidad vecinal que presentan los catastros estatales tradicionales. Mientras las fuentes oficiales suelen registrar rezagos de actualización o agregaciones comunales que ocultan el detalle de la infraestructura peatonal, el comercio local o la red de cités, el mapeo ciudadano aporta datos actualizados a escala barrial.

Para resolver esta brecha, el Atlas integra en un mismo entorno de consulta los datos colaborativos de OpenStreetMap (OSM) y de la Infraestructura Mundial de Información en Biodiversidad (GBIF) con las coberturas públicas de IDE Chile, el Ministerio de Vivienda y Urbanismo (MINVU), el Instituto Nacional de Estadísticas (INE), el Ministerio de Transportes y Telecomunicaciones (MTT/UOCT), el Ministerio de Desarrollo Social y Familia (MDSF), la Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE), la Municipalidad de Santiago y el Servicio de Impuestos Internos (SII).

---

## 2. Delimitación geodésica y cobertura territorial del área de estudio
El área de estudio piloto comprende un polígono continuo de 223,75 ha situado en el sector poniente de la comuna de Santiago. Su caja delimitadora se define en coordenadas geográficas WGS84 (EPSG:4326) y en la proyección métrica oficial SIRGAS-Chile / UTM Huso 19 Sur (EPSG:32719):

```text
BBox_Barrio_Brasil (EPSG:4326) = [-70.6720, -33.4505, -70.6580, -33.4350]
  Longitud (oeste a este): -70,6720° a -70,6580°
  Latitud  (sur a norte) : -33,4505° a -33,4350°
```

* **Límite norte:** Eje vial de avenida San Pablo y calle Rosas (transición hacia el barrio Yungay).
* **Límite sur:** Eje de avenida Libertador Bernardo O'Higgins / Alameda (corredor de transporte metropolitano, Línea 1 de Metro con estaciones Los Héroes y República).
* **Límite oriente:** Eje vial de avenida Manuel Rodríguez (Autopista Central - Ruta 5 Norte-Sur).
* **Límite poniente:** Eje vial de avenida Ricardo Cumming y calle García Reyes.

---

## 3. Formulación estratégica: objetivos del proyecto

El proyecto se organiza en un objetivo general y cuatro objetivos específicos (OE 1 a OE 4) con entregables verificables en el repositorio:

```text
┌────────────────────────────────────────────────────────────────────────┐
│             ESTRUCTURA ESTRATÉGICA DEL PROYECTO                        │
├────────────────────────────────────────────────────────────────────────┤
│ • OE 1: Caracterización y diseño centrado en el usuario                │
│ • OE 2: Geodatabase multipropósito y calidad espacial                  │
│ • OE 3: Geoportal web accesible e interoperable                        │
│ • OE 4: Evaluación de usabilidad y transferibilidad                    │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1. Objetivo general
> Desarrollar un atlas de información geográfica voluntaria (VGI) reproducible, interoperable y centrado en el usuario, que integre geodatos abiertos, cartografía participativa y herramientas analíticas para subsanar vacíos de información territorial y apoyar la gestión local y la investigación en el Barrio Brasil y la comuna de Santiago.

---

### 3.2. Objetivos específicos y metas operativas

* **OE 1.** Caracterizar la disponibilidad, la cobertura y los vacíos de información geográfica del área de estudio, y definir las bases taxonómicas y de diseño centrado en el usuario que permitan integrar datos colaborativos e institucionales.
* **OE 2.** Consolidar una geodatabase multipropósito que armonice coberturas oficiales e información voluntaria bajo estándares internacionales de calidad y metadatos.
* **OE 3.** Implementar un geoportal web accesible e interoperable que permita visualizar cartografía multinivel, consultar el territorio en tiempo real y descargar geodatos abiertos.
* **OE 4.** Evaluar la usabilidad y la pertinencia de la plataforma con distintos perfiles de actores territoriales y asegurar su transferibilidad técnica, metodológica y documental.

---

#### Objetivo específico 1 (OE 1): Caracterización y diseño centrado en el usuario
* **Estado operativo:** 100 % completado (hitos 1, 2 y 3).
* **Definición formal:**
  > Caracterizar la disponibilidad, la cobertura y los vacíos de información geográfica del área de estudio, y definir las bases taxonómicas y de diseño centrado en el usuario que permitan integrar datos colaborativos e institucionales.
* **Componentes ejecutados:**
  - Revisión de cuatro plataformas de geodatos abiertos: OpenStreetMap, GBIF, ohsome API v1/v2 y servicios WFS/WMS de IDE Chile.
  - Estructuración de las 10 macrocategorías comunitarias VGI (CAT-01 a CAT-10) normalizadas bajo etiquetas OpenStreetMap y el estándar Darwin Core.
  - Caracterización de los cuatro perfiles de actores territoriales mediante metodologías de diseño centrado en el usuario.

```mermaid
flowchart LR
    subgraph OBJ1["1. Objetivo específico 1"]
        O1["OE 1: Caracterización y diseño centrado en el usuario"]
    end

    subgraph PROC1["2. Procedimientos específicos"]
        P1_1["1. Revisión de cuatro plataformas\n(OSM, GBIF, ohsome, IDE Chile)"]
        P1_2["2. Estructuración taxonómica\n10 macrocategorías VGI"]
        P1_3["3. Diseño centrado en el usuario\nde 4 perfiles de actores"]
    end

    subgraph PROD1["3. Productos resultantes"]
        PR1_1["Catálogo de fuentes VGI\ny matriz de brechas"]
        PR1_2["Taxonomía de 10 macrocategorías\n(CAT-01 a CAT-10)"]
        PR1_3["Matriz de 4 perfiles\npara la plataforma web"]
    end

    subgraph LOC1["4. Localización oficial en Git y web"]
        L1_1["docs/catalogo_fuentes_vgi.xlsx\ny src/docs/catalogo_fuentes_vgi.xlsx"]
        L1_2["docs/categorias_tematicas_osm.xlsx\ny src/docs/categorias_tematicas_osm.xlsx"]
        L1_3["docs/ARQUITECTURA.md, docs/TRAZABILIDAD.md\ny src/js/app.js (#sel-perfil-usuario)"]
    end

    O1 --> P1_1 --> PR1_1 --> L1_1
    O1 --> P1_2 --> PR1_2 --> L1_2
    O1 --> P1_3 --> PR1_3 --> L1_3
```

* **Entregables acreditados y localización oficial:**

| N° | Entregable acreditado | Tipo de producto | Fuente y localización oficial en el proyecto |
|:---:|:---|:---:|:---|
| **E-01** | Documento metodológico de arquitectura, taxonomía VGI y perfiles de usuario. | Metodológico | `docs/ARQUITECTURA.md`, `docs/TRAZABILIDAD.md` y `docs/MANUAL_ACTUALIZACION_ATLAS.md` (`src/docs/`) |
| **E-02** | Catálogo de fuentes geoespaciales y matriz de brechas barriales. | Catálogo de datos | `docs/catalogo_fuentes_vgi.xlsx` y `src/docs/catalogo_fuentes_vgi.xlsx` |

---

#### Objetivo específico 2 (OE 2): Geodatabase multipropósito y calidad espacial
* **Estado operativo:** 100 % completado (hitos 4, 5 y 6).
* **Definición formal:**
  > Consolidar una geodatabase multipropósito que armonice coberturas oficiales e información voluntaria bajo estándares internacionales de calidad y metadatos.
* **Componentes ejecutados:**
  - Descarga, normalización y geoprocesamiento de las coberturas vectoriales del catálogo (véase la Tabla 1.1 de cifras clave: 134 capas, compuestas por 124 oficiales del Estado de Chile y 10 coberturas VGI comunitarias) en los sistemas de referencia EPSG:4326 y EPSG:32719.
  - Estructuración de la base de datos espacial en clúster relacional PostgreSQL 17 + PostGIS 3.3 (Supabase Cloud) con más de 1.552.000 entidades indexadas mediante árboles GiST y claves JSONB con índices GIN.
  - Formulación y ejecución del modelo de combinación lineal ponderada (WLC v2.0) bajo norma ISO 19157:2013, integrando 5 componentes cuantitativos (media de 96,7 %) y 5 componentes cualitativos (media de 94,1 %), certificando un Índice Global de Calidad VGI (IGV) de 95,4 % (91 capas en grado A+ y 43 en grado A sobre las 134 coberturas), complementado por un Índice Global de Metacalidad Documental (IGMC) de 96,55 %.
  - Incorporación algorítmica del esquema maestro de 14 atributos normalizados ISO en la totalidad de capas vectoriales para descargas transparentes.

```mermaid
flowchart LR
    subgraph OBJ2["1. Objetivo específico 2"]
        O2["OE 2: Geodatabase multipropósito y calidad espacial"]
    end

    subgraph PROC2["2. Procedimientos específicos"]
        P2_1["1. Extracción Python y descarga\nde geoportales públicos"]
        P2_2["2. Normalización del esquema\nde 14 columnas ISO"]
        P2_3["3. Evaluación WLC v2.0 (ISO 19157)\ny auditoría de cambios"]
        P2_4["4. Carga espacial en\nPostgreSQL 17 / PostGIS 3.3"]
    end

    subgraph PROD2["3. Productos resultantes"]
        PR2_1["134 capas vectoriales GeoJSON\n(124 oficiales + 10 VGI)"]
        PR2_2["Bases vectoriales con linaje,\nfuente y fechas ISO"]
        PR2_3["Certificación de calidad ISO 19157\ny matriz WLC (IGV 95,4 %)"]
        PR2_4["Geodatabase relacional PostGIS\ncon índices GiST y GIN"]
    end

    subgraph LOC2["4. Localización oficial en Git y web"]
        L2_1["src/data/*.geojson, data/*.geojson\ny scripts/descargar_todas_las_categorias_osm.py"]
        L2_2["scripts/enriquecer_base_datos_metadatos.py\ny docs/perfil_metadatos_vgi.xlsx (src/docs/)"]
        L2_3["docs/ANALISIS_METACALIDAD.md, docs/matriz_metacalidad.json\ny docs/wlc_metacalidad_resultado.json (src/docs/)"]
        L2_4["scripts/db/01_schema_postgis.sql, 02_seed_metadata.sql\ny docs/GUIA_BASE_DATOS_SUPABASE.md"]
    end

    O2 --> P2_1 --> PR2_1 --> L2_1
    O2 --> P2_2 --> PR2_2 --> L2_2
    O2 --> P2_3 --> PR2_3 --> L2_3
    O2 --> P2_4 --> PR2_4 --> L2_4
```

* **Entregables acreditados y localización oficial:**

| N° | Entregable acreditado | Tipo de producto | Fuente y localización oficial en el proyecto |
|:---:|:---|:---:|:---|
| **E-03** | Geodatabase espacial de 134 coberturas vectoriales GeoJSON (EPSG:4326). | Geodatabase vectorial | `src/data/*.geojson` y `data/*.geojson` (véase la Tabla 1.1) |
| **E-04** | Base de datos espacial PostgreSQL 17 + PostGIS 3.3 desplegada en la nube con funciones RPC. | Base relacional espacial | `scripts/db/01_schema_postgis.sql`, `scripts/db/02_seed_metadata.sql` y `docs/GUIA_BASE_DATOS_SUPABASE.md` (`src/docs/`) |
| **E-05** | Reporte y matrices de calidad espacial ISO 19157:2013 (IGV 95,4 %). | Evaluación de calidad | `docs/ANALISIS_METACALIDAD.md`, `docs/matriz_metacalidad.json`, `docs/wlc_metacalidad_resultado.json`, `docs/wlc_metacalidad_ranking.csv` y `docs/correlacion_dimensiones_calidad.csv` (`src/docs/`) |
| **E-06** | Catálogo tabular en formato OpenXML (.xlsx) con esquema de 14 atributos normalizados ISO. | Catálogo tabular OGC | `docs/categorias_tematicas_osm.xlsx` y `docs/perfil_metadatos_vgi.xlsx` (`src/docs/`) |

---

#### Objetivo específico 3 (OE 3): Geoportal web accesible e interoperable
* **Estado operativo:** 100 % completado (hitos 7 y 8).
* **Definición formal:**
  > Implementar un geoportal web accesible e interoperable que permita visualizar cartografía multinivel, consultar el territorio en tiempo real y descargar geodatos abiertos.
* **Componentes ejecutados:**
  - Construcción de la interfaz web con conformidad WCAG 2.1 (nivel AA general en componentes interactivos y nivel AAA en todo el texto de lectura) y navegación agrupada en 5 secciones por tarea.
  - Configuración del visor cartográfico (Leaflet 1.9.4) con árbol de capas por categoría, selector de mapas base, carga bajo demanda con indicador de peso y herramientas de medición geodésica.
  - Implementación del inspector normativo del Plan Regulador Comunal (PRC) de Santiago y de la Ordenanza General de Urbanismo y Construcciones (OGUC), que ejecuta intersección punto en polígono en el navegador y emite el Certificado de Informaciones Normativas VGI (CIN-VGI).
  - Conexión dinámica en tiempo real con los servicios de Overpass QL API (con conmutación por falla entre servidores espejo), ohsome API v1/v2 y GBIF Occurrence API v1.
  - Implementación del generador de metadatos ISO 19115 / XML ISO 19139 conforme al Perfil Nacional de Metadatos de IDE Chile (IGMC de 96,55 %) y publicación continua en Netlify (`https://atlasvgiuah.netlify.app/`).

```mermaid
flowchart LR
    subgraph OBJ3["1. Objetivo específico 3"]
        O3["OE 3: Geoportal web accesible e interoperable"]
    end

    subgraph PROC3["2. Procedimientos específicos"]
        P3_1["1. Desarrollo de interfaz web\ncon accesibilidad WCAG 2.1 AA/AAA"]
        P3_2["2. Integración del visor Leaflet 1.9.4\ny marcadores vectoriales SVG"]
        P3_3["3. Intersección espacial punto en polígono\ny evaluación normativa PRC/OGUC"]
        P3_4["4. Conexión con clientes API en vivo\n(Overpass QL, ohsome, GBIF)"]
        P3_5["5. Configuración de cabeceras y\ndespliegue continuo en Netlify"]
    end

    subgraph PROD3["3. Productos resultantes"]
        PR3_1["Geoportal organizado en\n5 secciones por tarea"]
        PR3_2["Visor multinivel con carga\nbajo demanda y filtros"]
        PR3_3["Certificado de Informaciones\nNormativas VGI (CIN-VGI)"]
        PR3_4["Módulos de consulta en vivo,\ncalidad temporal y biodiversidad"]
        PR3_5["Aplicación publicada en producción"]
    end

    subgraph LOC3["4. Localización oficial en Git y web"]
        L3_1["src/index.html, src/css/estilos.css,\nsrc/js/config.js y src/js/app.js"]
        L3_2["src/js/modulos/mapa.js\ny src/js/modulos/ide_chile.js"]
        L3_3["src/js/modulos/evaluador_normativo.js,\nsrc/data/ide_minvu_ipt_prc_santiago.geojson y capa_ipt_prc_comunal.geojson"]
        L3_4["src/js/modulos/osm.js, ohsome.js,\ncalidad_analyst.js y gbif.js"]
        L3_5["netlify.toml\ny https://atlasvgiuah.netlify.app/"]
    end

    O3 --> P3_1 --> PR3_1 --> L3_1
    O3 --> P3_2 --> PR3_2 --> L3_2
    O3 --> P3_3 --> PR3_3 --> L3_3
    O3 --> P3_4 --> PR3_4 --> L3_4
    O3 --> P3_5 --> PR3_5 --> L3_5
```

* **Entregables acreditados y localización oficial:**

| N° | Entregable acreditado | Tipo de producto | Fuente y localización oficial en el proyecto |
|:---:|:---|:---:|:---|
| **E-07** | Geoportal web interactivo en producción (Leaflet 1.9.4). | Plataforma web | `src/index.html`, `src/js/app.js` y `https://atlasvgiuah.netlify.app/` |
| **E-08** | Inspector normativo territorial del PRC de Santiago y emisor del certificado CIN-VGI. | Módulo de análisis espacial | `src/js/modulos/evaluador_normativo.js`, `src/data/ide_minvu_ipt_prc_santiago.geojson` y `src/data/capa_ipt_prc_comunal.geojson` |
| **E-09** | Generador de metadatos estandarizados ISO 19115 / XML ISO 19139 (IGMC 96,55 %). | Módulo de metadatos | `src/js/modulos/metadatos.js` y `docs/perfil_metadatos_vgi.xlsx` (`src/docs/`) |
| **E-10** | Diccionario territorial interactivo paginado bajo norma ISO 19110 (140 descriptores). | Módulo documental | `src/js/modulos/diccionario.js` y `docs/DICCIONARIO_CATASTRO_RSD_SUBDERE_2024.md` |

---

#### Objetivo específico 4 (OE 4): Evaluación de usabilidad y transferibilidad
* **Estado operativo:** 100 % completado (hitos 9 y 10).
* **Definición formal:**
  > Evaluar la usabilidad y la pertinencia de la plataforma con distintos perfiles de actores territoriales y asegurar su transferibilidad técnica, metodológica y documental.
* **Componentes ejecutados:**
  - Evaluación de usabilidad y pertinencia técnica con representantes de los cuatro perfiles de actores territoriales, sistematizando los ajustes de navegación, lectura y descarga de geodatos.
  - Elaboración del Manual de uso (`MANUAL_USO.md`) y del Manual de actualización técnica (`MANUAL_ACTUALIZACION_ATLAS.md`), acompañados por un recetario operativo de 16 tutoriales paso a paso organizados bajo plantilla estándar (véase la Parte VIII).
  - Empaquetado y versionamiento de la geodatabase completa en archivo comprimido `docs/geodatabase_completa_atlas_vgi.zip` (542,35 MB).
  - Verificación automatizada de integridad pre-despliegue mediante el script `scripts/verificar_integridad_despliegue.py`.

```mermaid
flowchart LR
    subgraph OBJ4["1. Objetivo específico 4"]
        O4["OE 4: Usabilidad y transferibilidad"]
    end

    subgraph PROC4["2. Procedimientos específicos"]
        P4_1["1. Evaluación de usabilidad con\n4 perfiles de actores"]
        P4_2["2. Redacción del manual de uso\norientado a tareas"]
        P4_3["3. Elaboración del manual de\nactualización y 16 tutoriales"]
        P4_4["4. Empaquetado de la geodatabase\ny verificación de integridad"]
    end

    subgraph PROD4["3. Productos resultantes"]
        PR4_1["Registro de evaluación con usuarios\ny mejoras de interfaz"]
        PR4_2["Manual de usuario del geoportal\npor perfil territorial"]
        PR4_3["Manual de actualización técnica\ny transferencia metodológica"]
        PR4_4["Archivo comprimido ZIP\ncon la geodatabase completa"]
    end

    subgraph LOC4["4. Localización oficial en Git y web"]
        L4_1["docs/TRAZABILIDAD.md\ny src/docs/TRAZABILIDAD.md"]
        L4_2["MANUAL_USO.md, docs/MANUAL_USO.md\ny src/docs/MANUAL_USO.md (Módulo 07)"]
        L4_3["MANUAL_ACTUALIZACION_ATLAS.md, docs/MANUAL_ACTUALIZACION_ATLAS.md\ny src/docs/MANUAL_ACTUALIZACION_ATLAS.md"]
        L4_4["docs/geodatabase_completa_atlas_vgi.zip, src/docs/\ny scripts/empaquetar_base_datos_completa.py"]
    end

    O4 --> P4_1 --> PR4_1 --> L4_1
    O4 --> P4_2 --> PR4_2 --> L4_2
    O4 --> P4_3 --> PR4_3 --> L4_3
    O4 --> P4_4 --> PR4_4 --> L4_4
```

* **Entregables acreditados y localización oficial:**

| N° | Entregable acreditado | Tipo de producto | Fuente y localización oficial en el proyecto |
|:---:|:---|:---:|:---|
| **E-11** | Sistematización de la evaluación con usuarios y matriz de trazabilidad de mejoras. | Evaluación | `docs/TRAZABILIDAD.md` y `src/docs/TRAZABILIDAD.md` |
| **E-12** | Manual de uso del Atlas VGI para los cuatro perfiles de usuario. | Manual de uso | `MANUAL_USO.md`, `docs/MANUAL_USO.md` y `src/docs/MANUAL_USO.md` (Módulo 07 web) |
| **E-13** | Manual de actualización técnica, protocolos de mantenimiento y transferibilidad metodológica. | Manual técnico | `MANUAL_ACTUALIZACION_ATLAS.md`, `docs/MANUAL_ACTUALIZACION_ATLAS.md` y `src/docs/MANUAL_ACTUALIZACION_ATLAS.md` |
| **E-14** | Paquete comprimido de distribución de la geodatabase completa en formato ZIP. | Paquete de datos | `docs/geodatabase_completa_atlas_vgi.zip`, `src/docs/geodatabase_completa_atlas_vgi.zip` y `PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md` |

---

## 4. Matriz de cumplimiento de los 10 hitos del proyecto

```mermaid
flowchart TD
    subgraph FASE1["Fase I: Caracterización y diseño"]
        H1["Hito 1: Diagnóstico territorial y revisión de 4 plataformas"] --> H2["Hito 2: Taxonomía de 10 categorías VGI y 4 perfiles"]
        H2 --> H3["Hito 3: Inventario de fuentes y detección de brechas"]
    end

    subgraph FASE2["Fase II: Geodatabase y calidad ISO"]
        H4["Hito 4: Extracción Overpass QL y normalización de capas"] --> H5["Hito 5: Modelo WLC ISO 19157 (IGV 95,4 %) y 14 atributos"]
        H5 --> H6["Hito 6: Cruces espaciales y análisis en 5 dimensiones"]
    end

    subgraph FASE3["Fase III: Geoportal web y despliegue"]
        H7["Hito 7: Interfaz web accesible y conexión a APIs"] --> H8["Hito 8: Inspector PRC, guiones visuales y publicación"]
    end

    subgraph FASE4["Fase IV: Evaluación y transferibilidad"]
        H9["Hito 9: Evaluación con actores territoriales"] --> H10["Hito 10: Manual técnico, paquete ZIP y pruebas de integridad"]
    end

    FASE1 --> FASE2
    FASE2 --> FASE3
    FASE3 --> FASE4
```

| Hito | Descripción | OE asociado | Fase | Estado | Entregable y ruta en el repositorio |
|:---:|:---|:---:|:---|:---:|:---|
| **Hito 1** | Diagnóstico territorial y revisión de cuatro plataformas (OSM, GBIF, ohsome e IDE Chile). | OE 1 | Fase I | 100 % cerrado | `docs/ARQUITECTURA.md` y `docs/catalogo_fuentes_vgi.xlsx` (`src/docs/`) |
| **Hito 2** | Definición de 10 macrocategorías VGI y 4 perfiles de actores territoriales. | OE 1 | Fase I | 100 % cerrado | `docs/categorias_tematicas_osm.xlsx` (`src/docs/`) y `src/js/config.js` |
| **Hito 3** | Inventario de fuentes colaborativas y oficiales y matriz de brechas. | OE 1 | Fase I | 100 % cerrado | `docs/catalogo_fuentes_vgi.xlsx` y `docs/TRAZABILIDAD.md` (`src/docs/`) |
| **Hito 4** | Flujo de procesamiento para descarga y normalización de geodatos. | OE 2 | Fase II | 100 % cerrado | `scripts/descargar_todas_las_categorias_osm.py`, `data/*.geojson` y `src/data/*.geojson` |
| **Hito 5** | Evaluación de calidad ISO 19157 (WLC v2.0, IGV 95,4 %) e inyección de 14 atributos. | OE 2 | Fase II | 100 % cerrado | `docs/ANALISIS_METACALIDAD.md`, `docs/matriz_metacalidad.json`, `docs/wlc_metacalidad_resultado.json` y `docs/perfil_metadatos_vgi.xlsx` |
| **Hito 6** | Cruces espaciales barriales y síntesis en 5 dimensiones territoriales. | OE 2 | Fase II | 100 % cerrado | `data/matriz_sintesis_barrio_brasil_manzanas.geojson`, `data/resumen_catastro_vgi.csv` y `data/bip_inversiones_santiago.csv` |
| **Hito 7** | Desarrollo de la interfaz web, visor cartográfico y clientes de APIs. | OE 3 | Fase III | 100 % cerrado | `src/index.html`, `src/css/estilos.css`, `src/js/app.js` y `src/js/modulos/*.js` |
| **Hito 8** | Inspector normativo PRC, 4 guiones visuales (83 cartografías) y despliegue. | OE 3 | Fase III | 100 % cerrado | `src/js/modulos/evaluador_normativo.js`, `src/js/modulos/indicadores_analisis.js` y `netlify.toml` |
| **Hito 9** | Evaluación de la plataforma con usuarios y organizaciones del territorio. | OE 4 | Fase IV | 100 % cerrado | `docs/TRAZABILIDAD.md`, `MANUAL_USO.md` y `docs/MANUAL_USO.md` (`src/docs/`) |
| **Hito 10** | Pruebas de integridad pre-despliegue, paquete ZIP y manual técnico. | OE 4 | Fase IV | 100 % cerrado | `scripts/verificar_integridad_despliegue.py`, `docs/geodatabase_completa_atlas_vgi.zip` y `MANUAL_ACTUALIZACION_ATLAS.md` |

---

## 5. Los cuatro perfiles de actores territoriales (alineación con la plataforma web)

En correspondencia con el selector `#sel-perfil-usuario` configurado en `src/index.html` y `src/js/app.js`, la plataforma adapta las herramientas destacadas y las capas sugeridas a cuatro perfiles de usuario:

```text
┌────────────────────────────────────────────────────────────────────────┐
│             PERFILES DE ACTORES TERRITORIALES EN LA PLATAFORMA         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Instituciones públicas (Municipio / IDE)              [institucion]  │
│ 2. Comunidad y vecinos                                   [comunidad]    │
│ 3. Mapeadores voluntarios (OSM)                          [voluntario]   │
│ 4. ONG e investigación                                   [ong]          │
└────────────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> En la primera mención dentro de cada sección se desarrollan las siglas técnicas principales —como Plan Regulador Comunal (PRC), Ordenanza General de Urbanismo y Construcciones (OGUC), estimación de densidad por núcleo (*Kernel Density Estimation*, KDE) e indicadores locales de asociación espacial (*Local Indicators of Spatial Association*, LISA)—; sus definiciones completas pueden consultarse en el Capítulo 37 (Glosario técnico).

---

### 5.1. Perfil 1: Instituciones públicas (Municipio / IDE) [`institucion`]
* **Descripción en la interfaz:**
  > *"Vista para gestión municipal e institucional: prioriza normativa urbana (PRC), catastro oficial, metadatos ISO 19115 y calidad."*
* **Usuarios destinatarios:** Equipos técnicos de la Secretaría Comunal de Planificación (SECPLA), Dirección de Obras Municipales (DOM) y Dirección de Medio Ambiente, Aseo y Ornato (DIMAO) de la Municipalidad de Santiago; analistas de ministerios (MINVU, MOP, MDSF/RSH, MTT/UOCT, SUBDERE) y de IDE Chile / Sistema Nacional de Coordinación de Información Territorial (SNIT).
* **Tareas principales:**
  - Consultar la zonificación del Plan Regulador Comunal (PRC) y las disposiciones de la Ordenanza General de Urbanismo y Construcciones (OGUC) mediante el inspector normativo, obteniendo usos permitidos, usos prohibidos y el Certificado de Informaciones Normativas VGI (CIN-VGI).
  - Cruzar iniciativas del Banco Integrado de Proyectos (BIP) con los datos del Censo 2024 del INE a escala de manzana y zona censal.
  - Descargar fichas de metadatos en formato XML ISO 19139:2007 conforme al Perfil Nacional de Metadatos de IDE Chile.
* **Vistas prioritarias:** `inicio` (Visor e inspector normativo PRC), `metadatos-iso` (Metadatos ISO 19115), `diccionario` (Diccionario ISO 19110) y `licencias` (Licencias y descargas).

---

### 5.2. Perfil 2: Comunidad y vecinos [`comunidad`]
* **Descripción en la interfaz:**
  > *"Vista adaptada para vecinos y organizaciones barriales: destaca el mapa, servicios locales, áreas verdes y mapas participativos."*
* **Usuarios destinatarios:** Juntas de vecinos del Barrio Brasil y de la comuna de Santiago, comités de vivienda de cités y pasajes, agrupaciones patrimoniales, comerciantes locales y residentes.
* **Tareas principales:**
  - Localizar servicios de proximidad en un clic: centros de salud familiar (CESFAM), farmacias, puntos de reciclaje y plazas.
  - Visualizar la red de cités y pasajes residenciales que no figuran desagregados en la cartografía censal.
  - Identificar cruces peatonales sin rebajes de vereda para personas con movilidad reducida (PMR).
  - Consultar e integrar mapas colaborativos elaborados en la plataforma uMap.
* **Vistas prioritarias:** `inicio` (Visor y catálogo), `explorador-osm` (Consultas OpenStreetMap), `proyectos-umap` (Mapas comunitarios uMap) y `diccionario` (Glosario barrial).

---

### 5.3. Perfil 3: Mapeadores voluntarios (OSM) [`voluntario`]
* **Descripción en la interfaz:**
  > *"Vista para mapeadores de OpenStreetMap: destaca consultas Overpass QL, validación de etiquetas y evolución histórica."*
* **Usuarios destinatarios:** Contribuyentes de OpenStreetMap Chile, equipos de mapeo humanitario y editores de cartografía colaborativa.
* **Tareas principales:**
  - Ejecutar consultas en lenguaje Overpass QL acotadas a la caja delimitadora del Barrio Brasil o de la comuna de Santiago.
  - Analizar series históricas de edición (2008-2026) mediante la interfaz ohsome API v1/v2 del Heidelberg Institute for Geoinformation Technology (HeiGIT) y revisar el índice de saturación territorial.
  - Contrastar la frecuencia de etiquetas semánticas (`key=value`) con la base de Taginfo y verificar la topología antes de exportar en GeoJSON.
* **Vistas prioritarias:** `explorador-osm` (Consultas Overpass), `calidad-ohsome` (Calidad ISO 19157 y series ohsome), `diccionario` (Homologación de etiquetas OSM) y `manual` (Manual del sistema).

---

### 5.4. Perfil 4: ONG e investigación [`ong`]
* **Descripción en la interfaz:**
  > *"Vista para investigación y academia: prioriza indicadores espaciales (KDE y LISA), Censo 2024, calidad ISO 19157 y descargas."*
* **Usuarios destinatarios:** Organizaciones no gubernamentales de estudios urbanos, centros de investigación, docentes y estudiantes universitarios.
* **Tareas principales:**
  - Explorar las cartografías temáticas de estimación de densidad por núcleo (KDE) y de autocorrelación espacial local mediante el índice I de Moran local (LISA) en los cuatro guiones visuales del Módulo 05.
  - Descargar las capas vectoriales en GeoJSON (EPSG:4326), GeoPackage OGC y tablas CSV para su análisis en sistemas de información geográfica de escritorio como QGIS.
  - Revisar las matrices de evaluación multicriterio (WLC v2.0) y las referencias bibliográficas en formato APA 7.ª edición.
* **Vistas prioritarias:** `indicadores` (Indicadores y guiones visuales), `calidad-ohsome` (Evaluación de calidad ISO 19157), `licencias` (Descarga de geodatabase y catálogos) y `metadatos-iso` (Metadatos ISO 19115).

---
"""
print("[+] Parte 01 enriquecida cargada exitosamente")
