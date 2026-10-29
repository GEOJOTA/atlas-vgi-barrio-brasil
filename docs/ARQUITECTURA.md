# Arquitectura de Software, Pipelines de Datos y Catálogo Multi-Lenguaje — Atlas VGI

* **Plataforma Web en Producción (CDN Primario):** [https://atlasvgiuah.netlify.app](https://atlasvgiuah.netlify.app)
* **Repositorio Espejo (GitHub Pages):** [https://geojota.github.io/atlas-vgi-barrio-brasil/](https://geojota.github.io/atlas-vgi-barrio-brasil/)
* **Alcance Arquitectónico:** **132 Capas Operativas** (`122` Oficiales + `10` VGI) · **140 Descriptores ISO 19110:2016** · **5 Dimensiones Analíticas** · **4 Storyboards (75 Cartografías)** · **10 Módulos (`01` al `10`)** · **21 Módulos JS ES6+ (IIFE)** · **25 Scripts Python 3** · **Esquema Relacional PostGIS**.

---

## 1. Principios de Diseño y Arquitectura General del Sistema

El **Atlas de Información Geográfica Voluntaria (VGI)** implementa una **arquitectura web estática, modular y autónoma (*Zero-Build Client-Side GIS*)** articulada con un backend relacional opcional en **PostgreSQL 15+ / PostGIS 3.4+ (Supabase)** y un repositorio local espejo de alta disponibilidad (`data/` ↔ `src/data/` y `docs/` ↔ `src/docs/`).

### Principios Rectores de Ingeniería:
1. **Ejecución Nativa sin Empaquetadores Complejos (*No-Bundle ES6+ IIFE*):** El código cliente se estructura en **21 módulos JavaScript ES6+** bajo el **Patrón de Módulo Revelador (*Immediately Invoked Function Expression*, IIFE)** expuestos en el espacio de nombres `window.Modulo*`. Esto elimina vulnerabilidades por obsolescencia de dependencias `node_modules` y permite auditar o modificar cualquier archivo directamente en un editor de texto.
2. **Doble Proyección Geodésica en el Cliente (`EPSG:4326` ↔ `EPSG:32719`):** Todas las capas vectoriales se almacenan e intercambian en formato `GeoJSON` bajo coordenadas geográficas `EPSG:4326` (WGS84, RFC 7946) para su representación en **Leaflet 1.9.4**, mientras que los cálculos de superficie (`m²`, `ha`, `km²`), perímetros y distancias euclidianas se ejecutan previa reproyección al vuelo a **UTM Huso 19 Sur (`EPSG:32719` / SIRGAS-Chile)** mediante la serie trigonométrica de Redfearn en `src/js/modulos/geodesia.js`.
3. **Arquitectura de Persistencia de Triple Nivel (*Triple-Tier Failover*):** El cliente de datos (`src/js/modulos/db_client.js`, `src/js/modulos/ide_chile.js` y `src/js/modulos/osm.js`) resuelve las consultas espaciales con degradación elegante automática:
   * **Nivel 1 (RPC / API Remota):** Funciones espaciales PostGIS en Supabase (`rpc/obtener_entidades_en_bbox`), Overpass API (3 servidores en failover), GBIF API v1 y HeiGIT ohsome API v1.
   * **Nivel 2 (CDN Estático Simétrico):** Archivos preprocesados en `src/data/*.geojson` (sincronizados byte a byte con `data/*.geojson`), servidos con compresión Brotli/Gzip desde Netlify y GitHub Pages.
   * **Nivel 3 (Caché en Memoria RAM del Navegador):** Diccionarios indexados en memoria (`capasOficialesCargadas`, `capasCargadasPorCategoria`) que evitan descargas redundantes durante la sesión.

---

## 2. Pipeline Maestro de Arquitectura de Tres Capas

```mermaid
flowchart TB
    subgraph CAPA1["1. INPUT / ENTRADA: Fuentes Primarias, APIs Externas y Repositorio Local"]
        F1["APIs Colaborativas en Vivo<br/>Overpass API (OSM) | Taginfo API v4<br/>GBIF API v1 (DwC) | HeiGIT ohsome API v1"]
        F2["Backend Relacional Espacial (Nivel 1)<br/>Supabase PostgreSQL 15+ / PostGIS 3.4+<br/>scripts/db/01_schema_postgis.sql & 02_seed_metadata.sql"]
        F3["Repositorio Cartográfico Simétrico (Nivel 2)<br/>data/*.geojson ↔ src/data/*.geojson (132 Capas)<br/>docs/* ↔ src/docs/* (Libros .xlsx, .csv, .json, .zip)"]
    end

    subgraph CAPA2["2. PIPELINE DE PROCESAMIENTO: Núcleo Modular Client-Side (21 Scripts JS ES6+) y Suite ETL (25 Scripts Python 3)"]
        N1["Núcleo de Configuración y Red<br/>src/js/config.js + config/config.json<br/>src/js/modulos/db_client.js & app.js"]
        N2["Motor Cartográfico, Geodésico y Normativo<br/>src/js/modulos/mapa.js (Leaflet 1.9.4)<br/>geodesia.js (EPSG:32719) & evaluador_normativo.js (PRC/OGUC)"]
        N3["Motores Analíticos y de Calidad ISO 19157<br/>src/js/modulos/indicadores_analisis.js (5 Dim / 4 Storyboards)<br/>ohsome.js, calidad_analyst.js & evaluador_calidad_cuantitativa.js"]
        N4["Motores de Estándares ISO y Gobernanza<br/>src/js/modulos/manual.js, metadatos.js (ISO 19115/19139),<br/>diccionario.js (ISO 19110) & licencias.js"]
        N5["Suite Python 3 de Ingeniería y Auditoría<br/>scripts/verificar_conteo_capas.py | verificar_integridad_despliegue.py<br/>analisis_metacalidad.py | empaquetar_base_datos_completa.py"]
    end

    subgraph CAPA3["3. OUTPUT / ENTREGABLES VERIFICABLES: Interfaz SPA (10 Módulos) y Paquetes de Datos"]
        S1["Interfaz Web SPA (src/index.html + src/css/estilos.css)<br/>Módulos 01 al 10 + 75 Cartografías en Lightbox"]
        S2["Certificados y Metadatos Exportables<br/>Certificado CIN-VGI (.txt) | ISO 19115 (.json) | ISO 19139 (.xml)"]
        S3["Paquetes Maestros en docs/ y src/docs/<br/>geodatabase_completa_atlas_vgi.zip (542,35 MB / 257 archivos)<br/>3 Libros Excel (.xlsx) + Matrices WLC (.csv / .json)"]
    end

    F1 & F2 & F3 --> N1
    N5 --> F3
    N1 --> N2 & N3 & N4
    N2 & N3 & N4 --> S1 & S2 & S3
```

---

## 3. Pipelines Especializados por Subsistema Técnico (`INPUT` → `PROCESAMIENTO` → `OUTPUT`)

### 3.1. Pipeline Geodésico de Doble Proyección (`EPSG:4326` ↔ `EPSG:32719`)

```mermaid
flowchart LR
    subgraph IN["1. INPUT / ENTRADA"]
        G1["Coordenadas Geográficas WGS84 (EPSG:4326)<br/>Latitud φ [-33,46°], Longitud λ [-70,66°]<br/>Polígonos GeoJSON o Dibujo de BBox en Visor"]
    end

    subgraph PROC["2. PROCESAMIENTO (src/js/modulos/geodesia.js)"]
        G2["Transformación Directa de Redfearn (Transverse Mercator)<br/>Elipsoide WGS84 (a = 6.378.137 m, f = 1/298,257223563)<br/>Meridiano Central λ0 = -69° (Huso 19S), k0 = 0,9996,<br/>Falso Este E0 = 500.000 m, Falso Norte N0 = 10.000.000 m"]
        G3["Fórmula Poligonal de Gauss / Shoelace en Plano UTM<br/>A = 0,5 · |Σ (Ei · Ni+1 - Ei+1 · Ni)|<br/>Distancia Euclidiana UTM y Haversine Esférica"]
    end

    subgraph OUT["3. OUTPUT / SALIDAS EN MÓDULOS 01, 05 Y 06"]
        G4["Coordenadas Planas UTM 19S (EPSG:32719)<br/>Superficie Exacta en m², Hectáreas (ha) y km²<br/>Denominador de Densidad ohsome (elem/km² y elem/10.000 m²)"]
    end

    G1 --> G2 --> G3 --> G4
```

### 3.2. Pipeline de Evaluación de Calidad Espacial WLC v2.0 e Índice de Saturación Territorial (Módulo 06)

```mermaid
flowchart LR
    subgraph IN["1. INPUT / ENTRADA"]
        C1["132 Capas Locales en data/*.geojson (src/data/)<br/>+ Series Temporales ohsome API v1 (2008-2026)<br/>(/elements/count, /length, /area, /users/count)"]
    end

    subgraph PROC["2. PROCESAMIENTO (ohsome.js, calidad_analyst.js, analisis_metacalidad.py)"]
        C2["Submódulo A · Modelo Multicriterio WLC v2.0 (ISO 19157/19115)<br/>ICV_WLC = 0,25·C1 (Linaje) + 0,25·C2 (Completitud)<br/>+ 0,20·C3 (Consistencia) + 0,15·C4 (Exactitud) + 0,15·C5 (Actualidad)"]
        C3["Submódulo B · Índice de Saturación y Maduración Territorial<br/>(Herfort et al., 2023 / ISO 19157)<br/>Pondera Asíntota Geométrica (60%) + Contribuyentes (40%)"]
        C4["Submódulo C · Auditoría de Changesets OSMCha<br/>Inspección de ediciones masivas y validación de fuentes"]
    end

    subgraph OUT["3. OUTPUT / RUTAS EN GIT Y PLATAFORMA WEB"]
        C5["docs/ANALISIS_METACALIDAD.md (src/docs/)<br/>docs/wlc_metacalidad_ranking.csv & wlc_metacalidad_resultado.json<br/>docs/matriz_metacalidad.json & correlacion_dimensiones_calidad.csv<br/>docs/perfil_metadatos_vgi.xlsx + Gráficos en Módulo 06"]
    end

    C1 --> C2 & C3 & C4 --> C5
```

### 3.3. Pipeline del Inspector Normativo PRC/OGUC y Certificado CIN-VGI (Módulo 01)

```mermaid
flowchart LR
    subgraph IN["1. INPUT / ENTRADA"]
        N1["Clic en Punto (lat, lng) sobre el Visor<br/>+ 10 Capas Normativas en data/ y src/data/:<br/>ide_minvu_ipt_prc_santiago.geojson, capa_ipt_prc_comunal.geojson,<br/>ZCH_ICH_RM_Patrimonio_IPT.geojson, ide_minvu_ipt_areas_riesgo.geojson"]
    end

    subgraph PROC["2. PROCESAMIENTO (src/js/modulos/evaluador_normativo.js)"]
        N2["Intersección Espacial Point-in-Polygon (Ray-Casting)<br/>Evaluación de Usos Permitidos (UPERM) y Prohibidos (UPROH)<br/>según Art. 2.1.24 y Art. 2.1.17 de la OGUC<br/>+ Cruce con los 10 Hitos Históricos del PRC en Barrio Brasil (1990-2024)"]
    end

    subgraph OUT["3. OUTPUT / RUTAS EN GIT Y PLATAFORMA WEB"]
        N3["Ficha Normativa HUD en Módulo 01<br/>Certificado de Informaciones Normativas VGI (CIN-VGI .txt)<br/>Enlace a Expedientes PRC Munistgo + docs/catalogo_fuentes_vgi.xlsx"]
    end

    N1 --> N2 --> N3
```

---

## 4. Catálogo Estandarizado Multi-Lenguaje de la Plataforma

Cada archivo del repositorio cumple un contrato técnico explícito según su lenguaje de programación o especificación de datos:

### 4.1. Capa de Presentación y Estructura DOM (`HTML5` y `CSS3`)

| Lenguaje | Ruta en el Repositorio | Rol Funcional | Componentes Clave y Protocolo de Modificación |
| :---: | :--- | :--- | :--- |
| **HTML5** | [`src/index.html`](src/index.html) | Documento maestro SPA (`1.758` líneas) que estructura las 10 pestañas (`01` a `10`), el visor 2D, acordeones de las 122 capas oficiales, modales de Storyboards, Lightbox y el modal de descarga de la Geodatabase. | Contiene las secciones `<section class="panel" id="panel-...">`, los botones `.chip-oficial[data-capa]` y la carga secuencial de los 21 scripts con parámetro de invalidación de caché `?v=20261026_v13`. |
| **CSS3** | [`src/css/estilos.css`](src/css/estilos.css) | Sistema de diseño visual (`>4.500` líneas) con variables nativas en `:root`, modo oscuro de alto contraste (WCAG 2.1 AA), grillas responsivas y estilos de impresión para certificados normativos. | Define tokens cromáticos (`--papel`, `--tinta`, `--esmeralda`, `--ocre`), clases `.lamina-storyboard-modal`, `.lightbox-figura-overlay` y reglas `@media` para escritorio, tablet y móvil. |

### 4.2. Capa de Lógica de Aplicación Client-Side (`21 Scripts JavaScript ES6+ IIFE`)

| N° | Archivo JavaScript (`src/js/`) | Objeto Global Expuesto | Responsabilidad Técnica y Entradas / Salidas |
| :---: | :--- | :--- | :--- |
| `01` | [`src/js/config.js`](src/js/config.js) | `window.NODO_CONFIG` | Configuración síncrona del nodo: BBox barrial y comunal, las 52 comunas de la RM, endpoints API y definición de las **10 macrocategorías VGI (`CAT-01` a `CAT-10`)**. |
| `02` | [`src/js/modulos/geodesia.js`](src/js/modulos/geodesia.js) | `window.ModuloGeodesia` | Transformación geodésica `EPSG:4326` ↔ `EPSG:32719` (Redfearn), cálculo de áreas poligonales Gauss/Shoelace (`m²`, `ha`, `km²`) y distancias Haversine/UTM. |
| `03` | [`src/js/modulos/db_client.js`](src/js/modulos/db_client.js) | `window.NodoDB` | Cliente de persistencia híbrida con failover automático entre PostgreSQL/PostGIS en Supabase (RPC) y los archivos locales en `src/data/`. |
| `04` | [`src/js/modulos/mapa.js`](src/js/modulos/mapa.js) | `window.ModuloMapa` | Controlador del lienzo Leaflet 1.9.4: teselas base CartoDB/OSM/Esri, renderizado vectorial GeoJSON, simbología por categoría, WMS OGC y herramienta de dibujo de BBox. |
| `05` | [`src/js/modulos/osm.js`](src/js/modulos/osm.js) | `window.ModuloOSM` | Cliente Overpass API con failover entre 3 instancias, constructor de consultas Overpass QL, reconstrucción topológica de nodos/vías y normalización a 14 atributos. |
| `06` | [`src/js/modulos/taginfo.js`](src/js/modulos/taginfo.js) | `window.ModuloTaginfo` | Cliente REST de Taginfo API v4 para verificar frecuencia global de etiquetas `key=value`, combinaciones semánticas y cobertura en la wiki de OSM. |
| `07` | [`src/js/modulos/ohsome.js`](src/js/modulos/ohsome.js) | `window.ModuloOhsome` | Cliente de series históricas HeiGIT ohsome API v1/v2 (`2008–2026`), cálculo de densidad `elem/km²`, `elem/10.000 m²`, `edit/user` e **Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157)**. |
| `08` | [`src/js/modulos/calidad_analyst.js`](src/js/modulos/calidad_analyst.js) | `window.ModuloCalidadAnalyst` | Motor analítico complementario de calidad VGI, curvas de crecimiento asintótico y cruce con auditoría de conjuntos de cambios en OSMCha. |
| `09` | [`src/js/modulos/evaluador_calidad_cuantitativa.js`](src/js/modulos/evaluador_calidad_cuantitativa.js) | `window.ModuloEvaluadorCalidad` | **Submódulo A del Módulo 06:** Evaluador Universal de Calidad Cuantitativa (WLC v2.0 bajo ISO 19157 e ISO 19115) para las 132 capas del catálogo o archivos `.geojson` externos. |
| `10` | [`src/js/modulos/gbif.js`](src/js/modulos/gbif.js) | `window.ModuloGBIF` | Cliente de GBIF API v1 para consulta y mapeo de ocurrencias de biodiversidad urbana bajo el estándar **Darwin Core (DwC)**. |
| `11` | [`src/js/modulos/umap.js`](src/js/modulos/umap.js) | `window.ModuloUMap` | Gestor de proyectos de cartografía colaborativa uMap e inyección de capas ciudadanas en el visor principal. |
| `12` | [`src/js/modulos/importador_capas.js`](src/js/modulos/importador_capas.js) | `window.ImportadorCapas` | Analizador sintáctico local (*Drag & Drop*) para archivos `.geojson`, `.kml`, `.kmz`, `.gpx` y `.csv` georreferenciados. |
| `13` | [`src/js/modulos/ide_chile.js`](src/js/modulos/ide_chile.js) | `window.ModuloIDEChile` | Catálogo maestro y cargador asíncrono de las **122 coberturas oficiales del Estado de Chile** (`CAPAS_OFICIALES`), con soporte GeoJSON local y servicios WMS OGC. |
| `14` | [`src/js/modulos/evaluador_normativo.js`](src/js/modulos/evaluador_normativo.js) | `window.ModuloEvaluadorNormativo` | Motor del Inspector Normativo PRC/PRMS/OGUC (algoritmo *Ray-Casting*), generador del **Certificado CIN-VGI** y repositorio de los **10 hitos históricos del PRC en Barrio Brasil (1990–2024)**. |
| `15` | [`src/js/modulos/indicadores_analisis.js`](src/js/modulos/indicadores_analisis.js) | `window.ModuloIndicadoresAnalisis` | Motor del **Módulo 05**: estructura las **5 Dimensiones Analíticas** (132 capas) y renderiza los **4 Storyboards Territoriales (75 cartografías)**, diagramas SVG y el visor Lightbox. |
| `16` | [`src/js/modulos/manual.js`](src/js/modulos/manual.js) | `window.ModuloManual` | Motor del **Módulo 07**: renderiza interactivamente el Manual de Uso (`USO · 01` a `04` con tabla filtrable de las 132 capas) y el Manual de Actualización Técnica (`ACT · 01` a `05`). |
| `17` | [`src/js/modulos/metadatos.js`](src/js/modulos/metadatos.js) | `window.ModuloMetadatos` | Motor del **Módulo 08**: autocompletado de fichas para las 132 capas y exportación conforme a **ISO 19115 (`.json`)** e **ISO 19139 / Perfil Nacional IDE Chile (`.xml`)**. |
| `18` | [`src/js/modulos/diccionario.js`](src/js/modulos/diccionario.js) | `window.ModuloDiccionario` | Motor del **Módulo 09**: catálogo de **140 descriptores normativos ISO 19110:2016**, homologación institucional e identificación de las **86 brechas temáticas VGI**. |
| `19` | [`src/js/modulos/licencias.js`](src/js/modulos/licencias.js) | `window.ModuloLicencias` | Motor del **Módulo 10**: comparador de licencias abiertas (`ODbL 1.0`, `CC BY-SA 4.0`, `Ley N° 20.285`, `Ley N° 19.628`) y panel de descarga de los libros `.xlsx` y `.zip`. |
| `20` | [`src/js/modulos/territorio.js`](src/js/modulos/territorio.js) | `window.ModuloTerritorio` | Síntesis contextual del área de estudio (Barrio Brasil, Campus UAH y Comuna de Santiago) e indicadores base de superficie y población. |
| `21` | [`src/js/app.js`](src/js/app.js) | Controlador Principal | Orquestador del ciclo de vida `DOMContentLoaded`, navegación entre los 10 paneles, cálculo del **ICV Dinámico** (`actualizarTelemetriaCapasActivas`) y exportación de datos. |

### 4.3. Capa de Datos, Configuración y Backend Relacional (`JSON`, `GeoJSON`, `GPKG`, `SQL`, `TOML`)

| Formato / Lenguaje | Rutas en el Repositorio | Función en la Arquitectura |
| :---: | :--- | :--- |
| **JSON / TOML** | [`config/config.json`](config/config.json), [`netlify.toml`](netlify.toml) | Configuración declarativa de BBox y categorías VGI; reglas de publicación CDN (`publish = "src"`), cabeceras CORS (`Access-Control-Allow-Origin: *`), tipos MIME para `.geojson`/`.gpkg` y redirecciones HTTP. |
| **SQL / PostGIS** | [`scripts/db/01_schema_postgis.sql`](scripts/db/01_schema_postgis.sql), [`scripts/db/02_seed_metadata.sql`](scripts/db/02_seed_metadata.sql) | Definición DDL de tablas relacionales (`catalogo_capas`, `entidades_vgi`, `metricas_calidad_iso19157`), índices espaciales `GiST` (`EPSG:4326` y `EPSG:32719`), índices `GIN` sobre `JSONB`, políticas RLS y funciones RPC. |
| **GeoJSON / GPKG** | `data/*.geojson` ↔ `src/data/*.geojson` | **132 coberturas operativas** del visor y capas regionales de respaldo en formato `RFC 7946` (`EPSG:4326`), acompañadas por las bases relacionales SQLite/GeoPackage (`.gpkg`) en `docs/geodatabase_completa_atlas_vgi.zip`. |

### 4.4. Suite de Ingeniería ETL, Calidad y Verificación (`25 Scripts Python 3` en `scripts/`)

| Grupo Funcional | Scripts Principales en `scripts/` | Entregables Generados / Verificados |
| :--- | :--- | :--- |
| **1. Auditoría y Verificación Pre-Deploy** | `verificar_conteo_capas.py`, `verificar_integridad_despliegue.py`, `auditoria_exhaustiva_capas.py` | Validan la paridad exacta de las **132 capas** (`122` oficiales + `10` VGI), los **140 descriptores ISO 19110**, la ausencia de punteros Git LFS y la sincronización `data/` ↔ `src/data/`. |
| **2. Modelamiento de Calidad WLC (ISO 19157/19115)** | `analisis_metacalidad.py`, `modelo_indice_lineal_wlc.py` | Calculan las 5 dimensiones de calidad y generan `docs/ANALISIS_METACALIDAD.md`, `docs/wlc_metacalidad_ranking.csv`, `docs/wlc_metacalidad_resultado.json`, `docs/matriz_metacalidad.json` y `docs/correlacion_dimensiones_calidad.csv` (`.png`). |
| **3. Ingesta VGI, IDE y Reproyección** | `descargar_todas_las_categorias_osm.py`, `procesar_geofabrik_rm.py`, `integrar_nuevas_capas_2026.py`, `integrar_subdere_rsd_2024.py`, `reproyectar_capas_stgo.py` | Extraen, normalizan y reproyectan a `EPSG:4326` las capas barriales y regionales en `data/` y `src/data/`. |
| **4. Generación de Libros Excel, Manuales y Geodatabase** | `generar_catalogos_excel.py`, `empaquetar_base_datos_completa.py`, `construir_manual_actualizacion_maestro.py` (`manual_p01` a `manual_p08`) | Generan los 3 libros `.xlsx` en `docs/` y `src/docs/`, el paquete `docs/geodatabase_completa_atlas_vgi.zip` (`542,35 MB`) y el `MANUAL_ACTUALIZACION_ATLAS.md`. |
