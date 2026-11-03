# Atlas de información geográfica voluntaria para la gestión territorial

[![Estado de Producción](https://img.shields.io/badge/Estado-En_Producci%C3%B3n-10b981?style=for-the-badge)](https://atlasvgiuah.netlify.app)
[![Coberturas Espaciales](https://img.shields.io/badge/Capas_Operativas-134_(124_Oficiales_+_10_VGI)-0284c7?style=for-the-badge)](#3-estructura-de-los-10-módulos-de-la-plataforma-web)
[![guiones visuales Territoriales](https://img.shields.io/badge/Storyboards-4_Ejes_(83_Cartograf%C3%ADas)-9333ea?style=for-the-badge)](#3-estructura-de-los-10-módulos-de-la-plataforma-web)
[![Estándares ISO/OGC](https://img.shields.io/badge/Normas-ISO_19110_%7C_19115_%7C_19139_%7C_19157-d97706?style=for-the-badge)](#5-documentación-técnica-del-proyecto)
[![Licencia de Datos](https://img.shields.io/badge/Licencias-ODbL_1.0_%7C_CC_BY--SA_4.0_%7C_AGPLv3-dc2626?style=for-the-badge)](#6-licenciamiento-y-gobernanza-de-datos-abiertos)

Plataforma web abierta que reúne mapas oficiales del Estado de Chile e información geográfica voluntaria (*Volunteered Geographic Information*, VGI; Goodchild, 2007; Haklay, 2010) para el análisis multiescalar del barrio Brasil, el entorno del Campus Universidad Alberto Hurtado, la comuna de Santiago y la Región Metropolitana de Santiago.

* Plataforma web en producción (CDN primario): [https://atlasvgiuah.netlify.app](https://atlasvgiuah.netlify.app)
* Repositorio espejo (GitHub Pages): [https://geojota.github.io/atlas-vgi-barrio-brasil/](https://geojota.github.io/atlas-vgi-barrio-brasil/)
* Geodatabase consolidada descargable (`.zip`): `docs/geodatabase_completa_atlas_vgi.zip` (`542,35 MB` comprimidos / `3,33 GB` descomprimidos; `257` archivos distribuidos en `7` subcarpetas temáticas).

---

## 1. Objetivos y tabla de cifras clave del proyecto

### 1.1. Objetivo general
Desarrollar un atlas de información geográfica voluntaria (VGI) reproducible, interoperable y centrado en el usuario, que integre geodatos abiertos, cartografía participativa y herramientas analíticas para subsanar vacíos de información territorial y apoyar la gestión local y la investigación en el Barrio Brasil y la comuna de Santiago.

### 1.2. Objetivos específicos
* **OE 1.** Caracterizar la disponibilidad, la cobertura y los vacíos de información geográfica del área de estudio, y definir las bases taxonómicas y de diseño centrado en el usuario que permitan integrar datos colaborativos e institucionales.
* **OE 2.** Consolidar una geodatabase multipropósito que armonice coberturas oficiales e información voluntaria bajo estándares internacionales de calidad y metadatos.
* **OE 3.** Implementar un geoportal web accesible e interoperable que permita visualizar cartografía multinivel, consultar el territorio en tiempo real y descargar geodatos abiertos.
* **OE 4.** Evaluar la usabilidad y la pertinencia de la plataforma con distintos perfiles de actores territoriales y asegurar su transferibilidad técnica, metodológica y documental.

### 1.3. Tabla 1.1: Cifras clave del proyecto (referencia única)

| Componente del sistema | Cifra o especificación | Definición y rutas asociadas |
| :--- | :--- | :--- |
| Coberturas geográficas operativas | 134 capas (124 oficiales + 10 VGI `CAT-01` a `CAT-10`) | `src/js/modulos/ide_chile.js`, `src/js/config.js`, `data/*.geojson`, `src/data/*.geojson` |
| Descriptores del diccionario de datos | 140 descriptores bajo ISO 19110:2016 (86 brechas VGI) | Módulo `09` (`src/js/modulos/diccionario.js`), `docs/categorias_tematicas_osm.xlsx` |
| Dimensiones y guiones visuales | 5 dimensiones y 4 guiones visuales con 83 cartografías | Módulo `05` (`src/js/modulos/indicadores_analisis.js`), `src/img/cartografias/` |
| Índice Global de Calidad VGI (IGV) | 95,4 % (91 capas A+ y 43 A de 134 capas) | Calidad espacial multicriterio WLC v2.0 (ISO 19157) en Módulo `06` y `docs/ANALISIS_METACALIDAD.md` |
| Índice Global de Metacalidad Documental (IGMC) | 96,55 % | Cumplimiento de campos obligatorios de metadatos ISO 19115 / IDE Chile en Módulo `08` |
| Accesibilidad web | WCAG 2.1 nivel AA general y nivel AAA en texto | Contraste de `4,58:1` a `8,87:1` en componentes (AA) y de `9,43:1` a `19,00:1` en lectura (AAA) |
| Arquitectura de software | 21 módulos JS y 25 scripts Python | Aplicación en `src/js/` y automatización en `scripts/` |

---

## 2. Flujos de procesamiento de arquitectura y procesamiento de datos

El proyecto organiza su flujo de ingeniería de datos y operación web en cuatro flujos de procesamiento troncales bajo el modelo `1. INPUT / ENTRADA` → `2. PIPELINE DE PROCESAMIENTO / MÓDULO` → `3. OUTPUT / RUTAS EN GIT Y PLATAFORMA WEB`:

### 2.1. Flujo de procesamiento general de los cuatro subsistemas (flujos de procesamiento a, b, c y d)

```mermaid
flowchart LR
    subgraph IN["1. INPUT / ENTRADA (Fuentes Primarias y Configuración)"]
        I1["caja delimitadora Territorial + Etiquetas OSM<br/>src/js/config.js & config/config.json"]
        I2["Capas IPT / PRC / Patrimonio / Riesgo<br/>data/ide_minvu_ipt_*.geojson"]
        I3["134 Capas GeoJSON + Series ohsome API<br/>data/*.geojson & api.ohsome.org/v1"]
        I4["Censo 2024 + RSH 2026 + BIP + SUBDERE<br/>data/ide_censo2024_manzanas.geojson"]
    end

    subgraph PROC["2. FLUJO DE PROCESAMIENTO DE PROCESAMIENTO (Motores JS ES6+ y Scripts Python 3)"]
        P1["flujo de procesamiento A · Extracción y Normalización VGI<br/>src/js/modulos/osm.js & gbif.js<br/>scripts/descargar_todas_las_categorias_osm.py"]
        P2["flujo de procesamiento B · Inspector Normativo PRC/OGUC<br/>src/js/modulos/evaluador_normativo.js<br/>Ray-Casting + Art. 2.1.24 / 2.1.17 OGUC"]
        P3["flujo de procesamiento C · Motor de Calidad WLC v2.0 y ohsome<br/>src/js/modulos/ohsome.js & calidad_analyst.js<br/>scripts/analisis_metacalidad.py"]
        P4["flujo de procesamiento D · Modelamiento KDE/LISA y Empaquetado<br/>src/js/modulos/indicadores_analisis.js<br/>scripts/empaquetar_base_datos_completa.py"]
    end

    subgraph OUT["3. OUTPUT / ENTREGABLES VERIFICABLES (Rutas en Git y Web)"]
        O1["data/capa_*.geojson (10 barriales + 10 RM)<br/>data/atlas_vgi_barrio_brasil_uah_completo.geojson<br/>docs/categorias_tematicas_osm.xlsx"]
        O2["Certificado CIN-VGI Interactivo (.txt / .html)<br/>10 Hitos PRC (1990-2024) en Módulo 01<br/>docs/catalogo_fuentes_vgi.xlsx"]
        O3["docs/ANALISIS_METACALIDAD.md<br/>docs/wlc_metacalidad_ranking.csv & .json<br/>docs/matriz_metacalidad.json & perfil_metadatos_vgi.xlsx"]
        O4["4 guiones visuales (83 Mapas) en Módulo 05<br/>data/matriz_sintesis_barrio_brasil_manzanas.geojson<br/>docs/geodatabase_completa_atlas_vgi.zip (542,35 MB)"]
    end

    I1 --> P1 --> O1
    I2 --> P2 --> O2
    I3 --> P3 --> O3
    I4 --> P4 --> O4
```

### 2.2. Flujo de procesamiento de articulación de los 10 Módulos de la plataforma web (`src/index.html`)

```mermaid
flowchart TD
    subgraph NUCLEO["Núcleo de Configuración y Motor Geodésico"]
        CFG["src/js/config.js + config/config.json<br/>(window.NODO_CONFIG: caja delimitadora y CAT-01 a CAT-10)"]
        GEO["src/js/modulos/geodesia.js<br/>(EPSG:4326 ↔ EPSG:32719 UTM 19S)"]
        DB["src/js/modulos/db_client.js<br/>(Conmutación por falla: PostGIS RPC → CDN → Caché Local)"]
    end

    subgraph VISOR["Módulo 01: Visor Territorial y Subpaneles"]
        M01["01. Visor Territorial<br/>src/js/modulos/mapa.js & ide_chile.js<br/>(134 Capas: 124 Oficiales + 10 VGI)"]
        ICV["Subpanel Métricas: ICV Dinámico<br/>src/js/app.js"]
        CIN["Subpanel Inspector Normativo PRC/OGUC<br/>src/js/modulos/evaluador_normativo.js"]
    end

    subgraph INGESTA["Módulos 02, 03 y 04: Captura y Cartografía Colaborativa"]
        M02["02. Consultas Overpass (OSM) & Taginfo<br/>src/js/modulos/osm.js & taginfo.js"]
        M03["03. Biodiversidad GBIF (Darwin Core)<br/>src/js/modulos/gbif.js"]
        M04["04. Cartografía uMap & Importador Local<br/>src/js/modulos/umap.js & importador_capas.js"]
    end

    subgraph ANALISIS["Módulos 05 y 06: Síntesis Territorial y Auditoría de Calidad"]
        M05["05. Indicadores & 4 guiones visuales (83 Mapas)<br/>src/js/modulos/indicadores_analisis.js"]
        M06["06. Calidad & ICV (WLC v2.0 / ohsome / OSMCha)<br/>src/js/modulos/ohsome.js & calidad_analyst.js"]
    end

    subgraph GOBERNANZA["Módulos 07, 08, 09 y 10: Documentación, Normas ISO y Licencias"]
        M07["07. Manual de Uso y Actualización<br/>src/js/modulos/manual.js"]
        M08["08. Metadatos ISO 19115 / ISO 19139 XML<br/>src/js/modulos/metadatos.js"]
        M09["09. Diccionario ISO 19110 (140 Descriptores)<br/>src/js/modulos/diccionario.js"]
        M10["10. Licencias & Catálogos (.xlsx / .zip)<br/>src/js/modulos/licencias.js"]
    end

    CFG --> M01 & M02 & M03 & M05 & M06
    GEO --> M01 & M05 & M06
    DB --> M01 & M08
    M01 --> ICV & CIN
    M02 & M03 & M04 --> M01
    M01 --> M05 & M06
    M05 & M06 --> M07 & M08 & M09 & M10
```

---

## 3. Estructura de los 10 Módulos de la plataforma web

| N° | Pestaña en la Interfaz (`src/index.html`) | ID del Panel DOM | Controladores JavaScript (`src/js/`) | Función Principal y Salidas Verificables |
| :---: | :--- | :--- | :--- | :--- |
| `01` | Visor para la gestión territorial | `#panel-inicio` | `app.js`, `modulos/mapa.js`, `modulos/ide_chile.js`, `modulos/evaluador_normativo.js`, `modulos/geodesia.js` | Superposición interactiva de las 134 capas (`124` oficiales + `10` VGI), cálculo del ICV Dinámico, dibujo de caja delimitadora con área en `EPSG:32719` y emisión del Certificado CIN-VGI (con los 10 hitos históricos del PRC 1990–2024). |
| `02` | Consultas Overpass (OSM) | `#panel-explorador-osm` | `modulos/osm.js`, `modulos/taginfo.js` | Consultas en vivo mediante Overpass QL con conmutación por falla entre 3 servidores, reconstrucción topológica de nodos/vías, normalización al esquema de 14 atributos y auditoría semántica Taginfo API v4. |
| `03` | Biodiversidad GBIF | `#panel-biodiversidad-gbif` | `modulos/gbif.js` | Consulta a GBIF API v1 bajo estándar Darwin Core (DwC) para registros de flora, arbolado y fauna urbana georreferenciada (`data/capa_biodiversidad.geojson`). |
| `04` | Cartografía uMap | `#panel-proyectos-umap` | `modulos/umap.js`, `modulos/importador_capas.js` | Integración de proyectos comunitarios uMap e importador local *client-side* para archivos `.geojson`, `.kml`, `.kmz`, `.gpx` y `.csv`. |
| `05` | Indicadores & guiones visuales | `#panel-indicadores` | `modulos/indicadores_analisis.js` | Sistematización de las 134 capas en 5 Dimensiones Analíticas y 4 guiones visuales Territoriales con 83 cartografías temáticas (`01`: 14 mapas KDE; `02`: 11 mapas LISA; `03`: 34 mapas Censo 2024/RSH; `04`: 24 mapas Socioambiente/Movilidad/Residuos). |
| `06` | Calidad & ICV | `#panel-calidad-ohsome` | `modulos/ohsome.js`, `modulos/calidad_analyst.js`, `modulos/evaluador_calidad_cuantitativa.js` | Submódulo A: Evaluador Universal WLC v2.0 (ISO 19157/19115). Submódulo B: Series históricas ohsome API v1/v2 con Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157). Submódulo C: Auditoría de changesets con OSMCha. |
| `07` | Manual de Uso | `#panel-manual` | `modulos/manual.js` | Documentación interactiva integrada: Parte I (Manual de Uso) con inventario filtrable de las 134 capas, y Parte II (Manual de Actualización Técnica) con catálogo multi-lenguaje y flujos de procesamiento de datos. |
| `08` | Metadatos ISO 19115 | `#panel-metadatos-iso` | `modulos/metadatos.js` | Generador de fichas de metadatos conformes al Perfil Nacional de IDE Chile (ISO 19115:2003 / ISO 19115-1:2014) con exportación directa en JSON y XML (ISO 19139:2007). |
| `09` | Diccionario (134 Capas) | `#panel-diccionario` | `modulos/diccionario.js` | Catálogo de Objetos Geográficos (ISO 19110:2016) con 140 descriptores normativos, homologación con IDE Chile e identificación de 86 brechas temáticas cubiertas por VGI. |
| `10` | Licencias & Catálogos (.xlsx) | `#panel-licencias` | `modulos/licencias.js` | Marco jurídico de datos abiertos y descarga directa de `docs/geodatabase_completa_atlas_vgi.zip` y de los 3 libros maestros `.xlsx`. |

---

## 4. Estructura del repositorio y entregables verificables en Git

El repositorio mantiene paridad simétrica entre los directorios de raíz (`data/` y `docs/`) y los directorios publicados por el servidor web (`src/data/` y `src/docs/`), garantizando rutas idénticas tanto en ejecución local como en despliegues sobre Netlify y GitHub Pages.

```text
nodo-geoabierto/
├── src/                                      # Directorio de publicación web (publish = "src" en netlify.toml)
│   ├── index.html                            # Documento maestro SPA (10 módulos, modales y Lightbox)
│   ├── css/estilos.css                       # Sistema de diseño CSS3 con variables nativas (:root)
│   ├── js/                                   # 21 scripts JavaScript ES6+ (Patrón IIFE modular)
│   │   ├── config.js                         # Configuración global síncrona (window.NODO_CONFIG)
│   │   ├── app.js                            # Orquestador principal de la interfaz y telemetría ICV
│   │   └── modulos/                          # 19 módulos especializados (mapa, ide_chile, ohsome, etc.)
│   ├── img/cartografias/                     # 83 cartografías temáticas (JPG) para los 4 Storyboards
│   ├── data/                                 # Espejo exacto de data/ para consumo directo vía Fetch API
│   └── docs/                                 # Espejo exacto de docs/ para descarga directa desde el navegador
├── data/                                     # Repositorio maestro de capas GeoJSON (.geojson), GPKG (.gpkg) y CSV
├── docs/                                     # Documentación técnica (.md), reportes WLC (.csv/.json), libros (.xlsx) y .zip
├── config/config.json                        # Parámetros JSON de caja delimitadora, comunas RM y 10 categorías VGI
├── scripts/                                  # 25 scripts Python 3 de ETL, calidad WLC, auditoría y empaquetado
│   └── db/                                   # Esquemas SQL PostGIS (01_schema_postgis.sql, 02_seed_metadata.sql)
└── netlify.toml                              # Configuración CDN, cabeceras CORS/Cache y redirecciones HTTP
```

### Catálogo de entregables verificables (`docs/` y `src/docs/`)

| Archivo / Entregable en Git y Web | Formato | Descripción y Contenido |
| :--- | :---: | :--- |
| [`docs/geodatabase_completa_atlas_vgi.zip`](docs/geodatabase_completa_atlas_vgi.zip) | `.zip` | Paquete consolidado (`542,35 MB` / `257` archivos en `7` subcarpetas) con las 134 capas del visor, extractos RM, libros Excel, CSV, SQL y metadatos ISO. |
| [`docs/categorias_tematicas_osm.xlsx`](docs/categorias_tematicas_osm.xlsx) | `.xlsx` | Libro Excel de 4 hojas con la taxonomía de las 10 macrocategorías VGI (`CAT-01` a `CAT-10`), etiquetas OSM y homologación ISO 19110. |
| [`docs/catalogo_fuentes_vgi.xlsx`](docs/catalogo_fuentes_vgi.xlsx) | `.xlsx` | Libro Excel de 4 hojas con el inventario de las 134 coberturas operativas, instituciones custodias, escalas y licencias. |
| [`docs/perfil_metadatos_vgi.xlsx`](docs/perfil_metadatos_vgi.xlsx) | `.xlsx` | Libro Excel de 4 hojas con el perfil de metadatos ISO 19115 / IDE Chile y la matriz de evaluación WLC ISO 19157. |
| [`docs/wlc_metacalidad_ranking.csv`](docs/wlc_metacalidad_ranking.csv) y [`.json`](docs/wlc_metacalidad_resultado.json) | `.csv` / `.json` | Ranking multicriterio WLC y resultados por dimensión (`C1` Linaje, `C2` Completitud, `C3` Consistencia Lógica, `C4` Exactitud Posicional, `C5` Actualidad). |
| [`docs/matriz_metacalidad.json`](docs/matriz_metacalidad.json) y [`correlacion_dimensiones_calidad.csv`](docs/correlacion_dimensiones_calidad.csv) | `.json` / `.csv` | Matriz detallada de metacalidad por archivo GeoJSON y matriz de correlación de Pearson entre dimensiones de calidad. |

---

## 5. Documentación técnica del proyecto

Toda la documentación se encuentra sincronizada en la raíz del proyecto, en `docs/` y en `src/docs/`:

1. [`MANUAL_USO.md`](MANUAL_USO.md) (`docs/MANUAL_USO.md` / `src/docs/MANUAL_USO.md`): Manual operativo de los 10 módulos de la plataforma web, flujos de trabajo con diagramas flujo de procesamiento, uso del Inspector Normativo Plan Regulador Comunal (PRC, véase el glosario)/Ordenanza General de Urbanismo y Construcciones (OGUC, véase el glosario), los 4 guiones visuales (83 cartografías) y los 3 submódulos de Calidad Espacial.
2. [`MANUAL_ACTUALIZACION_ATLAS.md`](MANUAL_ACTUALIZACION_ATLAS.md) (`docs/MANUAL_ACTUALIZACION_ATLAS.md` / `src/docs/MANUAL_ACTUALIZACION_ATLAS.md`): Manual de ingeniería de software, arquitectura, catálogo estandarizado multi-lenguaje, flujos de procesamiento de datos y guía paso a paso para adaptar el Atlas a cualquier territorio.
3. [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) y [`PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md`](PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md): Especificación de la arquitectura cliente-servidor, motor geodésico `EPSG:4326` ↔ `EPSG:32719`, protocolo de 8 bancos de pruebas pre-despliegue y despliegue continuo en Netlify y GitHub Pages.
4. [`docs/ANALISIS_METACALIDAD.md`](docs/ANALISIS_METACALIDAD.md): Reporte técnico del modelo de Combinación Lineal Ponderada (WLC) bajo las normas ISO 19115:2014 e ISO 19157:2013 sobre el repositorio cartográfico.
5. [`docs/GUIA_BASE_DATOS_SUPABASE.md`](docs/GUIA_BASE_DATOS_SUPABASE.md): Guía de despliegue y operación del backend relacional PostgreSQL 17 / PostGIS 3.3 en Supabase y automatización Keep-Alive mediante GitHub Actions.
6. [`docs/TRAZABILIDAD_ACADEMICA.md`](docs/TRAZABILIDAD_ACADEMICA.md): Síntesis metodológica, marco conceptual VGI, homologación taxonómica y gobernanza territorial.
7. [`docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md`](docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md): Compendio de 125 referencias bibliográficas y normativas en formato APA 7ª edición que respaldan los módulos, indicadores y guiones visuales del sistema.

---

## 6. Ejecución local, verificación y licenciamiento

### Ejecución local y suite de auditoría automatizada

```bash
# 1. Levantar servidor HTTP local apuntando al directorio de publicación web (src/)
python3 -m http.server 8080 --directory src

# 2. Verificar paridad de las 134 capas (124 Oficiales + 10 VGI) y 140 descriptores ISO 19110
python3 scripts/verificar_conteo_capas.py

# 3. Verificar integridad de archivos GeoJSON, ausencia de punteros LFS y sincronización data/ <-> src/data/
python3 scripts/verificar_integridad_despliegue.py

# 4. Recalcular matriz de metacalidad WLC (ISO 19115 / ISO 19157)
python3 scripts/analisis_metacalidad.py
```

### Licenciamiento y gobernanza de datos abiertos

* Datos Colaborativos de OpenStreetMap: [Open Database License (ODbL 1.0)](https://opendatacommons.org/licenses/odbl/1-0/) — © Colaboradores de OpenStreetMap.
* Registros de Biodiversidad (GBIF) y Cartografías Derivadas: [Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/deed.es).
* Coberturas Oficiales del Estado de Chile: Acceso público y reutilización regidos por la Ley N° 20.285 sobre Acceso a la Información Pública y resguardo de microdatos conforme a la Ley N° 19.628 sobre Protección de la Vida Privada.
* Código Fuente del Software: [GNU Affero General Public License v3.0 (AGPLv3)](https://www.gnu.org/licenses/agpl-3.0.html).
