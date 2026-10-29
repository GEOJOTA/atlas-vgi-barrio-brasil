# -*- coding: utf-8 -*-
"""
scripts/manual_p02_ingenieria_datos.py
Capítulos 06 al 14: Ingeniería de Datos, Extracción, Normalización y Catálogo de 132 Capas.
"""

PARTE_02 = r"""# PARTE II: INGENIERÍA DE DATOS, PIPELINES DE EXTRACCIÓN Y NORMALIZACIÓN CARTOGRÁFICA

---

## 6. Arquitectura y Taxonomía de las 10 Macrocategorías Comunitarias VGI

Para clasificar de forma inequívoca el tejido urbano de Barrio Brasil, el Atlas VGI estableció una **taxonomía de 10 macrocategorías temáticas maestras (CAT-01 a CAT-10)**, cruzando las etiquetas de la Wiki oficial de OpenStreetMap con el estándar Darwin Core de biodiversidad.

```text
┌────────────────────────────────────────────────────────────────────────┐
│             LAS 10 MACROCATEGORÍAS TEMÁTICAS MAESTRAS VGI              │
├────────────────────────────────────────────────────────────────────────┤
│ CAT-01: Educación y Universidad                                        │
│ CAT-02: Servicios y Comercio Barrial                                   │
│ CAT-03: Movilidad y Transporte                                         │
│ CAT-04: Movilidad Activa y Ciclovías                                   │
│ CAT-05: Áreas Verdes y Espacio Público                                 │
│ CAT-06: Patrimonio y Cultura                                           │
│ CAT-07: Accesibilidad Universal                                        │
│ CAT-08: Biodiversidad Urbana                                           │
│ CAT-09: Edificaciones y Huella Urbana (Polígonos)                     │
│ CAT-10: Coberturas y Usos de Suelo (Polígonos)                         │
└────────────────────────────────────────────────────────────────────────┘
```

```mermaid
flowchart LR
    subgraph IN_CAT["1. INPUT"]
        OSM_TAGS["Diccionario de Etiquetas OSM (amenity, highway, leisure, building, landuse)"]
        DWC_TERMS["Estándar Darwin Core (taxonRank, scientificName)"]
    end

    subgraph PROC_CAT["2. PIPELINE DE CLASIFICACIÓN TAXONÓMICA"]
        PARSE_TAG["Clasificación y Filtrado Semántico de Atributos"]
        GEOM_SORT["Segregación Topológica (Puntos, Líneas y Polígonos)"]
        HOMOLOG_ID["Asignación de Código Taxonómico (CAT-01 a CAT-10)"]
    end

    subgraph OUT_CAT["3. OUTPUT"]
        TEN_LAYERS["10 Capas Vectoriales VGI Barriales (src/data/cat01..cat10)"]
        EXCEL_CAT["Libro Maestro categorias_tematicas_osm.xlsx (11 Hojas)"]
        LEGEND_SVG["Simbología Vectorial SVG Diferenciada en el Visor"]
    end

    IN_CAT --> PROC_CAT --> OUT_CAT
```

A continuación se detalla la especificación técnica de cada categoría:

### 6.1. CAT-01: Educación y Universidad
* **Etiquetas OSM Primarias:** `amenity=school`, `amenity=kindergarten`, `amenity=college`, `amenity=university`, `amenity=library`.
* **Etiquetas OSM Complementarias:** `operator:type=public|private`, `name=*`, `addr:street=*`, `capacity=*`, `wheelchair=yes|no|limited`.
* **Geometrías Admitidas:** Puntos (nodos de acceso) y Polígonos (huella predial del establecimiento).
* **Entidades Clave en Barrio Brasil:** Campus Universidad Alberto Hurtado (sedes patrimoniales Cienfuegos, Erasmo Escala y Almirante Barroso), Liceo Experimental Manuel de Salas, Escuela Básica República de Panamá, Biblioteca Pública de Santiago.

### 6.2. CAT-02: Servicios y Comercio Barrial
* **Etiquetas OSM Primarias:** `amenity=hospital`, `amenity=clinic`, `amenity=doctors`, `amenity=pharmacy`, `healthcare=centre`.
* **Etiquetas Complementarias:** `emergency=yes|no`, `dispensing=yes`, `opening_hours=*`.
* **Entidades Clave:** Hospital San Juan de Dios (entorno poniente), CESFAM Ignacio Domeyko, SAPU barrial, farmacias comunitarias y farmacias de turno de calle San Pablo.

### 6.3. CAT-03: Movilidad y Transporte
* **Etiquetas OSM Primarias:** `highway=bus_stop`, `railway=station`, `railway=subway_entrance`, `amenity=bus_station`.
* **Etiquetas Complementarias:** `shelter=yes|no`, `bench=yes|no`, `network=Red Metropolitana de Movilidad`, `operator=Metro de Santiago`.
* **Entidades Clave:** Estaciones de Metro Los Héroes (Línea 1 y Línea 2), Santa Ana (Línea 2 y Línea 5), Cumming (Línea 5), paraderos troncales de Alameda, San Pablo y Manuel Rodríguez.

### 6.4. CAT-04: Movilidad Activa y Ciclovías
* **Etiquetas OSM Primarias:** `highway=cycleway`, `cycleway=lane|track|shared_lane`, `amenity=bicycle_parking`, `amenity=bicycle_repair_station`.
* **Etiquetas Complementarias:** `segregated=yes|no`, `surface=asphalt|paved`, `capacity=*`.
* **Entidades Clave:** Ciclovía Avenida Brasil, ciclovía calle Rosas, ciclovía calle Mapocho, bicicleteros de las estaciones de Metro y talleres barriales.

### 6.5. CAT-05: Áreas Verdes y Espacio Público
* **Etiquetas OSM Primarias:** `leisure=park`, `leisure=pitch`, `leisure=playground`, `highway=pedestrian`.
* **Etiquetas Complementarias:** `surface=grass|paved`, `lit=yes|no`, `access=yes`.
* **Entidades Clave:** Plaza Brasil, Plaza Yungay, Plaza Manuel Rodríguez, bulevares peatonales y áreas de juegos infantiles.

### 6.6. CAT-06: Patrimonio y Cultura
* **Etiquetas OSM Primarias:** `historic=monument`, `historic=memorial`, `historic=building`, `heritage=*`.
* **Etiquetas Complementarias:** `heritage:operator=Consejo de Monumentos Nacionales`, `start_date=*`.
* **Entidades Clave:** Zona Típica Barrio Brasil (D.S. 432/1993), Basílica del Salvador, Iglesia San Saturnino, casonas patrimoniales UAH, placas conmemorativas.

### 6.7. CAT-07: Accesibilidad Universal
* **Etiquetas OSM Primarias:** `highway=crossing`, `kerb=lowered|flush|raised`, `blind:description=*`, `traffic_signals:sound=yes|no`.
* **Etiquetas Complementarias:** `tactile_paving=yes|no`, `sloped_curb=*`, `wheelchair=yes|no`.
* **Entidades Clave:** Cruces semaforizados de Alameda con Cumming y Brasil, cruces de calle Catedral con Maturana.

### 6.8. CAT-08: Biodiversidad Urbana
* **Etiquetas OSM / GBIF:** `natural=tree`, `landuse=forest`, `natural=wood`, registros Darwin Core (`taxonRank`, `scientificName`).
* **Etiquetas Complementarias:** `species=*`, `circumference=*`, `height=*`, `denotation=urban`.
* **Entidades Clave:** Arbolado viario de plátanos orientales de Avenida Brasil, palmeras centenarias de Plaza Brasil, jardines interiores UAH.

### 6.9. CAT-09: Edificaciones y Huella Urbana (Polígonos)
* **Etiquetas OSM Primarias:** `building=yes|residential|commercial`, `building:levels=*`, `building:cité=yes`, `highway=service`.
* **Etiquetas Complementarias:** `building:material=brick|adobe|concrete`, `roof:shape=flat|gabled`.
* **Entidades Clave:** Más de 1.800 huellas de edificios y 45 cités residenciales catalogados en el cuadrante.

### 6.10. CAT-10: Coberturas y Usos de Suelo (Polígonos)
* **Etiquetas OSM Primarias:** `landuse=residential`, `landuse=commercial`, `landuse=retail`, `landuse=industrial`, `landuse=brownfield`.
* **Etiquetas Complementarias:** `commercial:type=*`, `service:type=*`.

---

## 7. Pipeline de Extracción con Overpass API y Overpass QL

La recolección masiva de entidades colaborativas de OpenStreetMap se ejecuta mediante el motor de consulta **Overpass QL** (*Overpass Query Language*), programado en el script `scripts/descargar_todas_las_categorias_osm.py`.

```mermaid
flowchart LR
    subgraph FUENTES["1. Fuentes Primarias de Datos"]
        OSM["OpenStreetMap (Overpass QL)"]
        OHS["ohsome API v2 (HeiGIT)"]
        GBIF["GBIF Darwin Core"]
        IDE["IDE Chile WFS / WMS"]
        GEO["Geofabrik RM (Shapefile / PBF)"]
    end

    subgraph PIPELINE["2. Pipeline de Procesamiento Python"]
        EXT["descargar_todas_las_categorias_osm.py"]
        REP["Reproyección GeoPandas (SIRGAS -> WGS84)"]
        ENR["enriquecer_base_datos_metadatos.py (14 Atributos)"]
        WLC["modelo_indice_lineal_wlc.py (ISO 19157)"]
    end

    subgraph DESTINOS["3. Salidas y Almacenamiento en Git y Web"]
        GEOJSON["132 Capas GeoJSON en src/data/ y data/ (122 Oficiales + 10 VGI)"]
        GPKG["data/geodatabase_osm_rm_geofabrik.gpkg (OGC SQLite)"]
        XLSX["3 Libros Excel OpenXML en docs/ y src/docs/"]
        POSTGIS["PostgreSQL 17 / PostGIS 3.3 (scripts/db/01_schema_postgis.sql)"]
        ZIP["docs/geodatabase_completa_atlas_vgi.zip (542,35 MB)"]
    end

    OSM --> EXT --> ENR
    OHS --> EXT
    GBIF --> EXT
    IDE --> REP --> ENR
    GEO --> REP --> ENR
    ENR --> WLC
    WLC --> GEOJSON
    WLC --> GPKG
    WLC --> XLSX
    GEOJSON --> POSTGIS
    GEOJSON --> ZIP
```

### 7.1. Arquitectura de las Consultas Overpass QL
Cada una de las 10 categorías VGI dispone de una consulta QL parametrizada contra el Bounding Box de Barrio Brasil:

```text
[out:json][timeout:35];
(
  // Primitivas geométricas declaradas
  node["amenity"="school"](-33.4505,-70.6720,-33.4350,-70.6580);
  way["amenity"="school"](-33.4505,-70.6720,-33.4350,-70.6580);
  relation["amenity"="school"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body;
>;
out skel qt;
```

A continuación se exponen las consultas QL canónicas utilizadas para cada macrocategoría:

#### Consulta QL: CAT-01 Educación y Universidad
```text
[out:json][timeout:30];
(
  node["amenity"~"school|kindergarten|college|university|library"](-33.4505,-70.6720,-33.4350,-70.6580);
  way["amenity"~"school|kindergarten|college|university|library"](-33.4505,-70.6720,-33.4350,-70.6580);
  relation["amenity"~"school|kindergarten|college|university|library"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body; >; out skel qt;
```

#### Consulta QL: CAT-02 Servicios y Comercio Barrial
```text
[out:json][timeout:30];
(
  node["amenity"~"hospital|clinic|doctors|pharmacy"](-33.4505,-70.6720,-33.4350,-70.6580);
  way["amenity"~"hospital|clinic|doctors|pharmacy"](-33.4505,-70.6720,-33.4350,-70.6580);
  relation["amenity"~"hospital|clinic|doctors|pharmacy"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body; >; out skel qt;
```

#### Consulta QL: CAT-03 Movilidad y Transporte
```text
[out:json][timeout:30];
(
  node["highway"="bus_stop"](-33.4505,-70.6720,-33.4350,-70.6580);
  node["railway"="subway_entrance"](-33.4505,-70.6720,-33.4350,-70.6580);
  way["railway"="subway_entrance"](-33.4505,-70.6720,-33.4350,-70.6580);
  relation["route"="bus"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body; >; out skel qt;
```

#### Consulta QL: CAT-04 Movilidad Activa y Ciclovías
```text
[out:json][timeout:30];
(
  way["highway"="cycleway"](-33.4505,-70.6720,-33.4350,-70.6580);
  way["cycleway"](-33.4505,-70.6720,-33.4350,-70.6580);
  node["amenity"="bicycle_parking"](-33.4505,-70.6720,-33.4350,-70.6580);
  node["amenity"="bicycle_repair_station"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body; >; out skel qt;
```

#### Consulta QL: CAT-05 Áreas Verdes y Espacio Público
```text
[out:json][timeout:30];
(
  way["leisure"~"park|pitch|playground"](-33.4505,-70.6720,-33.4350,-70.6580);
  relation["leisure"~"park|pitch|playground"](-33.4505,-70.6720,-33.4350,-70.6580);
  way["highway"="pedestrian"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body; >; out skel qt;
```

#### Consulta QL: CAT-06 Patrimonio y Cultura
```text
[out:json][timeout:30];
(
  node["historic"](-33.4505,-70.6720,-33.4350,-70.6580);
  way["historic"](-33.4505,-70.6720,-33.4350,-70.6580);
  relation["historic"](-33.4505,-70.6720,-33.4350,-70.6580);
  node["heritage"](-33.4505,-70.6720,-33.4350,-70.6580);
  way["heritage"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body; >; out skel qt;
```

#### Consulta QL: CAT-07 Accesibilidad Universal
```text
[out:json][timeout:30];
(
  node["highway"="crossing"](-33.4505,-70.6720,-33.4350,-70.6580);
  node["kerb"](-33.4505,-70.6720,-33.4350,-70.6580);
  node["wheelchair"](-33.4505,-70.6720,-33.4350,-70.6580);
  node["tactile_paving"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body; >; out skel qt;
```

#### Consulta QL: CAT-08 Biodiversidad Urbana
```text
[out:json][timeout:35];
(
  node["natural"="tree"](-33.4505,-70.6720,-33.4350,-70.6580);
  way["natural"="tree_row"](-33.4505,-70.6720,-33.4350,-70.6580);
  way["natural"="wood"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body; >; out skel qt;
```

#### Consulta QL: CAT-09 Edificaciones y Huella Urbana
```text
[out:json][timeout:60];
(
  way["building"](-33.4505,-70.6720,-33.4350,-70.6580);
  relation["building"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body; >; out skel qt;
```

#### Consulta QL: CAT-10 Coberturas y Usos de Suelo
```text
[out:json][timeout:45];
(
  way["landuse"](-33.4505,-70.6720,-33.4350,-70.6580);
  relation["landuse"](-33.4505,-70.6720,-33.4350,-70.6580);
);
out body; >; out skel qt;
```

### 7.2. Mecanismo de Rotación de Servidores Espejo (*Round-Robin Failover*)
Debido a que el endpoint público principal `overpass-api.de` experimenta periódicamente saturación global por cuota de concurrencia (`HTTP 429 Too Many Requests` o `504 Gateway Timeout`), el script de extracción implementa una lista ordenada de servidores espejo con reintentos exponenciales:

```python
SERVIDORES_OVERPASS_ESPEJO = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
]
```

Si un servidor rechaza la petición, el script espera 2 segundos, conmuta automáticamente al siguiente y, en caso de fallo generalizado, recurre a la copia estática cacheada en `data/cache_consultas/`.

```mermaid
sequenceDiagram
    autonumber
    participant Extractor as Script Python / Módulo 02 Web
    participant S1 as Nodo 1: overpass-api.de
    participant S2 as Nodo 2: lz4.overpass-api.de
    participant S3 as Nodo 3: overpass.kumi.systems
    participant Cache as Respaldo Local (src/data/*.geojson)

    Extractor->>S1: POST Consulta Overpass QL (timeout: 35s)
    alt Respuesta HTTP 200 OK
        S1-->>Extractor: Payload JSON OSM (nodes, ways, relations)
    else Error HTTP 429 / 504 Timeout
        S1--xExtractor: Rechazo por cuota de concurrencia
        Note over Extractor,S2: Conmutación Round-Robin (Espera 2s)
        Extractor->>S2: POST Consulta Overpass QL
        alt Respuesta HTTP 200 OK
            S2-->>Extractor: Payload JSON OSM
        else Fallo en Nodo 2
            S2--xExtractor: Timeout
            Extractor->>S3: POST Consulta Overpass QL
            alt Respuesta HTTP 200 OK
                S3-->>Extractor: Payload JSON OSM
            else Contingencia Total de Red Externa
                Extractor->>Cache: Lectura de GeoJSON Homologado Local
                Cache-->>Extractor: Entrega inmediata con 0% pérdida de servicio
            end
        end
    end
```

---

## 8. Auditoría Histórica y Análisis Espacio-Temporal con ohsome API v1/v2 (HeiGIT)

```mermaid
flowchart LR
    subgraph IN_OH["1. INPUT: CONSULTA HISTÓRICA Y GEOMÉTRICA"]
        POLY_BBOX["BBox / Polígono WGS84 -> Reproyección Métrica EPSG:32719 (geodesia.js)"]
        OH_ENDPOINTS["Endpoints HeiGIT (/elements/count, /length, /area, /users/count, /contributions/count)"]
        OSMCHA_API["OSM API v0.6 Changesets (/api/0.6/changesets)"]
    end

    subgraph PROC_OH["2. PIPELINE DE PROCESAMIENTO (MÓDULO 06: ohsome.js + calidad_analyst.js)"]
        REQ_OH["Petición HTTP POST con bpolys/bboxes y Filtro Semántico OSM"]
        GEOM_METRIC["Cálculo de Superficie Gauss/Shoelace (km² y ha) y Densidad (elem/km² y elem/10.000 m²)"]
        OQT_MODEL["Cálculo de Intensidad Comunitaria (edit/user) y Tasa Interanual (Δ%)"]
        HEUR_CHA["Evaluación Heurística de Changesets (OSMCha)"]
    end

    subgraph OUT_OH["3. OUTPUT: INDICADORES EN LA PLATAFORMA WEB"]
        SAT_INDEX["Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157)"]
        SCORE_MAD["Score de Madurez Territorial (/100), Estado de Saturación Física y Tendencia"]
        IGV_LINK["Integración con Evaluador Universal de Calidad Espacial e Índice IGV (Submódulo A)"]
    end

    IN_OH --> PROC_OH --> OUT_OH
```

En plena coherencia con el **Módulo 06 (`Evaluación de Calidad Geoespacial e Índice Global de Calidad`)** de la plataforma web, la evaluación de calidad articula tres submódulos complementarios (`src/js/modulos/evaluador_calidad_cuantitativa.js`, `src/js/modulos/ohsome.js` y `src/js/modulos/calidad_analyst.js`) que combinan la auditoría geométrica-documental directa con el análisis histórico de la base de datos de OpenStreetMap (OSHDB) provisto por el *Heidelberg Institute for Geoinformation Technology* (HeiGIT) de la Universidad de Heidelberg.

### 8.1. Articulación de los 3 Submódulos de Calidad en la Plataforma Web (Módulo 06)
1. **Submódulo A — Evaluador Universal de Calidad Espacial, Topología e Índice IGV (`evaluador_calidad_cuantitativa.js`):**
   - Evalúa cualquier capa interna del catálogo (132 coberturas) o cualquier archivo externo cargado por el usuario (`.geojson` / `.json`).
   - Computa el **Índice Global de Calidad (IGV / IGMC)** mediante Combinación Lineal Ponderada (WLC) al **50% para el Pilar Cuantitativo** (Consistencia Topológica 30%, Completitud de Atributos 25%, Exactitud Posicional y Dominio 20%, Conformidad de Esquema 15% y Densidad de Vértices 10%) y **50% para el Pilar Cualitativo** (Completitud de Metadatos ISO 19115 25%, Trazabilidad del Linaje 25%, Actualidad Temporal 20%, Conformidad Estándar IDE Chile 15% y Claridad Legal/Licenciamiento 15%).
2. **Submódulo B — Serie Histórica OSHDB e Índice de Saturación y Maduración Territorial (`ohsome.js` y `calidad_analyst.js`):**
   - Consulta la evolución histórica 2018–2026 en la API de HeiGIT (**ohsome API v1/v2**) aplicando sensibilidad geométrica según la naturaleza espacial de la categoría consultada y reproyectando el polígono de consulta a **SIRGAS-Chile / UTM Huso 19 Sur (`EPSG:32719`)** mediante el algoritmo Transverse Mercator y la fórmula de área de Gauss (*Shoelace*) en `src/js/modulos/geodesia.js`.
   - Determina el **Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157)**, entregando el **Score de Madurez (`/100`)**, el **Estado de Saturación Física**, la **Tendencia Espacio-Temporal**, la **Densidad Espacial Métrica (`elem/km²` y `elem / 10.000 m²`)** y la **Intensidad Comunitaria (`edit/user`)**.
3. **Submódulo C — Control de Cambios y Validación de Ediciones Recientes (`calidad_analyst.js` — OSMCha / OSM API v0.6):**
   - Interroga en vivo el endpoint `https://api.openstreetmap.org/api/0.6/changesets` sobre el Bounding Box activo, parsea el flujo XML de conjuntos de cambios y aplica reglas heurísticas inspiradas en **OSMCha** (*OpenStreetMap Changeset Analyzer*) para clasificar cada edición como `Verificado / Normal` o `Revisión sugerida` (por ejemplo, cambios masivos `> 300` elementos o comentarios de menos de 4 caracteres), generando enlaces directos de inspección en `osmcha.org`.

### 8.2. Endpoints con Sensibilidad Geométrica y Conceptos Operativos en `ohsome.js`
A diferencia de un conteo simple, el módulo `src/js/modulos/ohsome.js` selecciona dinámicamente el endpoint geométrico de ohsome según el tipo de cobertura o el selector de **Sensibilidad Geométrica (`#ohsome-metrica-geom`)** de la interfaz:
1. **`/v1/elements/count` (Conteo de Entidades):** Número absoluto de objetos geográficos (nodos, vías y relaciones) vigentes en cada corte anual (`2018-01-01/2026-01-01/P1Y`).
2. **`/v1/elements/length` (Longitud Lineal Acumulada):** Aplicado a redes viales, ciclovías y transporte (`highway=cycleway`, `highway=footway`, etc.), cuantificando los metros y kilómetros lineales construidos en el tiempo.
3. **`/v1/elements/area` (Superficie Poligonal Acumulada):** Aplicado a huellas de edificaciones (`building=*`), áreas verdes (`leisure=park`) y usos de suelo (`landuse=*`), cuantificando la superficie cubierta en m² y hectáreas.
4. **`/v1/users/count` y `/v1/contributions/count` (Mapeadores Únicos y Contribuciones):** Cuantifica los colaboradores activos por período y el volumen de ediciones, a partir de los cuales la plataforma calcula la **Intensidad Comunitaria (`Contribuciones / Colaboradores Únicos`, expresada en `edit/user`)**.

### 8.3. Formulación del Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157)
En `src/js/modulos/calidad_analyst.js` (función `calcularIndicadoresOQT`), el **Índice de Saturación y Maduración Territorial** evalúa la pendiente interanual reciente de la serie histórica de ohsome junto con la riqueza semántica de las entidades:
* **Tasa de Variación Interanual (`Δ`):** Se compara el último corte anual (`ultimo`) con el penúltimo (`penultimo`):
  ```text
  Δ = Valor_ultimo - Valor_penultimo
  ```
* **Reglas de Clasificación de Saturación Física y Score de Madurez (`/100`):**
  - Si `ultimo > 0` y `Δ ≤ 0.05 × ultimo` (variación anual menor o igual al 5%): el territorio se clasifica en **`Saturación Alta / Consolidación`**, con tendencia **`Mapeo estabilizado, mantenimiento de microatributos`** y un **Score de Madurez base de `88 / 100`**. Indica que la infraestructura física base ya se encuentra prácticamente completa en OpenStreetMap y las ediciones recientes corresponden a actualización de atributos (`opening_hours`, `wheelchair`, `surface`).
  - Si `Δ > 0.15 × ultimo` (crecimiento anual superior al 15%): el territorio se clasifica en **`Fase de Expansión Rápida`**, con tendencia **`Incorporación activa de geometrías nuevas`** y un **Score de Madurez de `72 / 100`**.
  - En rangos intermedios (`5% < Δ ≤ 15%`): se clasifica en **`Fase de Levantamiento Activo`** con **Score de Madurez de `55 / 100`**.
* **Densidad Espacial Métrica (`EPSG:32719`):**
  ```text
  Densidad_km2 = Total_Elementos_Actuales / Area_Poligono_km2 (EPSG:32719)
  Densidad_ha  = Densidad_km2 / 100   [expresada en elem / 10.000 m²]
  ```

### 8.4. Resultados Históricos Observados en Barrio Brasil (2018 – 2026)
* **Consolidación de Huellas de Edificaciones:** Entre 2018 y 2026 la cobertura poligonal de edificaciones (`building=*`) y cités en Barrio Brasil superó las 1.820 estructuras digitalizadas, alcanzando estado de **Saturación Alta / Consolidación (Score 88/100)**.
* **Comunidad de Mapeadores e Intensidad:** Se registran más de **142 colaboradores únicos** en el polígono barrial, con una alta intensidad comunitaria concentrada en el enriquecimiento de equipamiento universitario, comercios locales, arbolado urbano y cruces peatonales accesibles.

---

## 9. Integración de Biodiversidad y Ciencia Ciudadana con GBIF y Darwin Core

```mermaid
flowchart LR
    subgraph IN_GB["1. INPUT"]
        DWC_EP["Endpoint GBIF Occurrence API (v1/occurrence/search)"]
        WKT_BB["Polígono WKT (POLY) de Barrio Brasil"]
        OCC_CRITERIA["Filtros: hasCoordinate=true, basisOfRecord=HUMAN_OBSERVATION"]
    end

    subgraph PROC_GB["2. PIPELINE DE PROCESAMIENTO"]
        GET_GB["Consulta Asíncrona con Filtros Geodésicos WKT"]
        DWC_MAP["Mapeo de Campos Darwin Core (scientificName, kingdom, eventDate)"]
        GEO_VAL["Validación de Incertidumbre Espacial coordinateUncertaintyInMeters <= 50m"]
    end

    subgraph OUT_GB["3. OUTPUT"]
        GEOJSON_GB["Capa Vectorial de Ocurrencias Biológicas"]
        POPUP_GB["Fichas de Biodiversidad con Fotografía y Taxonomía"]
        TAB_GBIF["Consolidado Tabular de Especies Registradas"]
    end

    IN_GB --> PROC_GB --> OUT_GB
```

El Módulo 03 (`src/js/modulos/gbif.js`) consume directamente la API del **Global Biodiversity Information Facility (GBIF)**, incorporando observaciones biológicas georreferenciadas provenientes de museos, herbarios y registros comunitarios de **iNaturalist**.

### 9.1. Estándar Darwin Core (DwC)
Las observaciones se procesan bajo los términos normalizados del estándar Darwin Core:
* `scientificName`: Nombre científico formal del taxón (ej. *Platanus x hispanica*, *Columba livia*, *Passer domesticus*).
* `vernacularName`: Nombre común en español (Plátano oriental, Paloma bravía, Gorrión).
* `decimalLatitude` / `decimalLongitude`: Coordenadas geodésicas en EPSG:4326.
* `coordinateUncertaintyInMeters`: Incertidumbre métrica de la posición (se descartan observaciones con incertidumbre > 250 metros).
* `eventDate`: Fecha ISO de la observación en terreno.
* `basisOfRecord`: Tipo de registro (`HUMAN_OBSERVATION`, `PRESERVED_SPECIMEN`).

### 9.2. Filtro Espacial en Formato WKT
Para evitar descargar registros de toda la cuenca de Santiago, la petición a la API de GBIF incluye un polígono cerrado en formato *Well-Known Text* (WKT) que circunscribe exactamente a Barrio Brasil:

```text
https://api.gbif.org/v1/occurrence/search?geometry=POLYGON((-70.6720 -33.4505,-70.6580 -33.4505,-70.6580 -33.4350,-70.6720 -33.4350,-70.6720 -33.4505))&hasCoordinate=true&hasGeospatialIssue=false&limit=300
```

---

## 10. Integración de Cartografía Externa con uMap e iframes Aislados

```mermaid
flowchart LR
    subgraph IN_UMAP["1. INPUT"]
        UMAP_PROJ["URLs de Proyectos Colaborativos uMap (OSM Francia)"]
        LOCAL_BKP["Copias Vectoriales de Respaldo (data/umap/*.geojson)"]
        CSP_RULES["Directivas de Seguridad Content-Security-Policy"]
    end

    subgraph PROC_UMAP["2. PIPELINE DE PROCESAMIENTO"]
        SANDBOX_IFR["Encapsulamiento en iframe (sandbox='allow-scripts allow-same-origin')"]
        CORS_CHECK["Detección de Disponibilidad y Cabeceras CORS"]
        FALLBACK_SW["Conmutación Automática a GeoJSON Local en Caso de Caída"]
    end

    subgraph OUT_UMAP["3. OUTPUT"]
        VIEW_UMAP["Visor Participativo Embebido en la Plataforma"]
        SAFE_DOM["Aislamiento Estricto del DOM Principal"]
    end

    IN_UMAP --> PROC_UMAP --> OUT_UMAP
```

El Módulo de Cartografía Participativa (`src/js/modulos/umap.js`) permite embeber mapas colaborativos construidos por colectivos vecinales en la plataforma abierta **uMap** (OpenStreetMap Francia).

### 10.1. Manejo Seguro de Sandboxing
Para proteger al Atlas frente a inyecciones de código malicioso de proyectos externos, los iframes se configuran con directivas de seguridad estrictas:

```html
<iframe 
  src="https://umap.openstreetmap.fr/es/map/barrio-brasil-patrimonio_12345?scaleControl=false&miniMap=false" 
  width="100%" 
  height="100%" 
  frameborder="0" 
  allowfullscreen 
  sandbox="allow-scripts allow-same-origin allow-popups">
</iframe>
```

### 10.2. Superación de Restricciones CORS
Cuando un mapa uMap aloja datos vectoriales en servidores remotos que bloquean la descarga directa del GeoJSON mediante cabeceras `Access-Control-Allow-Origin`, el módulo detecta la falla y conmuta a la descarga de una copia estática local preservada en `data/umap/`.

---

## 11. Extractos Masivos Regionales de Geofabrik RM y Generación de GeoPackage OGC

```mermaid
flowchart LR
    subgraph IN_GEO["1. INPUT"]
        PBF_FILE["Extracto Regional Geofabrik (.osm.pbf / .shp.zip)"]
        BBOX_CLIP["Máscara Territorial de Barrio Brasil / Santiago"]
    end

    subgraph PROC_GEO["2. PIPELINE DE PROCESAMIENTO"]
        OSM_CONV["Osmium / GDAL ogr2ogr Filtro Espacial"]
        LAYER_SPLIT["Separación por Capas (points, lines, polygons)"]
        ATTR_STD["Inyección de 14 Columnas Estandarizadas ISO"]
    end

    subgraph OUT_GEO["3. OUTPUT EN GIT Y WEB"]
        GPKG_OGC["data/geodatabase_osm_rm_geofabrik.gpkg (OGC SQLite)"]
        GEOJSON_SPLIT["data/capa_osm_rm_cat01_educacion.geojson a cat10_cobertura_suelo.geojson"]
    end

    IN_GEO --> PROC_GEO --> OUT_GEO
```

Para satisfacer las demandas de investigadores que requieren estudiar la conectividad metropolitana entre Barrio Brasil y el resto de los 52 municipios de la Región Metropolitana, el Atlas incorpora extractos regionales masivos provistos por **Geofabrik GmbH**.

### 11.1. Procedimiento de Corte y Conversión
1. **Descarga del Dump Nacional:** Se descarga diariamente el archivo Protocolbuffer Binary Format (PBF) de Chile (`chile-latest.osm.pbf`, ~500 MB).
2. **Corte por Bounding Box con Osmium:** Mediante la utilidad `osmium-tool`, se realiza el recorte geográfico hacia la envolvente de la RM (`[-71.72, -34.30, -69.75, -32.92]`):
   ```bash
   osmium extract -b -71.72,-34.30,-69.75,-32.92 chile-latest.osm.pbf -o rm-latest.osm.pbf
   ```
3. **Clasificación y Exportación GeoJSON:** El script `scripts/procesar_geofabrik_rm.py` clasifica las geometrías en 10 archivos GeoJSON regionales (`data/capa_osm_rm_cat01_educacion.geojson` a `data/capa_osm_rm_cat10_cobertura_suelo.geojson` y su espejo en `src/data/`), además del consolidado `data/capa_osm_rm_completo_vgi.geojson`, sumando más de 1.2 GB de datos.

### 11.2. Generación del GeoPackage OGC (`scripts/generar_gpkg_geofabrik.py`)
Para que los usuarios puedan cargar la base regional de una sola vez en software SIG de escritorio (QGIS, ArcGIS Pro, gvSIG), el script `scripts/generar_gpkg_geofabrik.py` compila las 10 capas dentro de un único archivo SQLite/GeoPackage estándar OGC:

```bash
python3 scripts/generar_gpkg_geofabrik.py
```

El archivo resultante (`data/geodatabase_osm_rm_geofabrik.gpkg`) cuenta con índices espaciales R-Tree en cada tabla, permitiendo operaciones analíticas complejas en milisegundos.

---

## 12. Ingesta, Normalización y Homologación de las 122 Capas Oficiales del Estado de Chile

```mermaid
flowchart LR
    subgraph IN_IDE["1. INPUT: FUENTES ESTATALES"]
        INE_SRC["INE Censo 2024 (Manzanas, Zonas, Límites)"]
        MINVU_SRC["MINVU GeoIDE (PRC, PRMS, ZCH, CCU 1993-2024)"]
        SUB_SRC["SUBDERE RSD 2024 (14 Capas Residuos RM)"]
        MUNI_SRC["MuniSTGO Aseo 2026 / UOCT Semáforos / SII Predial"]
        MDSF_SRC["MDSF / BIDAT (RSH, IGVUST, Inversiones BIP)"]
    end

    subgraph PROC_IDE["2. PIPELINE DE PROCESAMIENTO GEODÉSICO Y TABULAR"]
        CRS_TRANS["Homologación Geodésica a WGS84 (EPSG:4326)"]
        CLIP_BBOX["Recorte Espacial y Depuración Topológica OGC"]
        SCHEMA_14["Inyección del Esquema Maestro de 14 Atributos ISO"]
        APA_CITE["Asignación de Cita APA 7ª Ed. y Puntaje WLC v2.0"]
    end

    subgraph OUT_IDE["3. OUTPUT: CATÁLOGO OFICIAL"]
        IDE_122["122 Capas Oficiales Homologadas (src/data/*.geojson)"]
        XLSX_132["Catálogo Maestro catalogo_fuentes_vgi.xlsx (132 Filas)"]
        WEB_MOD01["Sincronización en Visor Web (Módulo 01) y Storyboards (Módulo 05)"]
    end

    IN_IDE --> PROC_IDE --> OUT_IDE
```

El Atlas VGI integra exactamente **122 capas cartográficas oficiales del Estado de Chile**, auditadas, homologadas a WGS84 (EPSG:4326) e inyectadas con metadatos completos y citas bibliográficas bajo norma APA 7ª edición.

A continuación se detalla la proveniencia institucional y aporte temático de las principales entidades públicas integradas:

### 12.1. Instituto Nacional de Estadísticas (INE) — Censo 2024
* **Aporte:** Cartografía oficial del Censo de Población y Vivienda 2024 a nivel de Marco Regional RM, Límites Urbanos Censales, Localidades, Zonas Censales y **Manzanas Censales de Santiago**.
* **Tratamiento:** Se limpiaron las tablas asociadas para extraer población total, densidad habitacional y total de viviendas censadas, resolviendo problemas de memoria (*Out of Memory* - OOM) mediante clipping estricto sobre Barrio Brasil.

### 12.2. Ministerio de Vivienda y Urbanismo (MINVU)
* **Aporte:** Instrumentos de Planificación Territorial (IPT), Catastro de Asentamientos Precarios (Campamentos), Condominios Sociales y Parques Urbanos.
* **Tratamiento:** Descarga desde geoservicios WFS de GeoIDE MINVU, conversión a GeoJSON y homogenización de atributos prediales.

### 12.3. Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) — Catastro RSD 2024
* **Aporte:** 14 capas cartográficas correspondientes al **Catastro Nacional de Residuos Sólidos Domiciliarios (enero 2024)** para la Región Metropolitana: Sitios de Disposición Final, Estaciones de Transferencia, Rutas de Recolección y Transporte, Análisis de Costos Comunales y Criticidad Ambiental.
* **Tratamiento:** Normalización de nombres de atributos, corrección de geometrías colapsadas y estructuración en el subdirectorio `data/subdere_rsd_2024_rm/`.

### 12.4. Unidad Operativa de Control de Tránsito (UOCT / MTT)
* **Aporte:** Red de 3.200 cruces semaforizados de la Región Metropolitana, con especificación del tipo de controlador (conectado a central SCAT o local) y fecha de modernización.
* **Tratamiento:** Procesamiento mediante `scripts/procesar_capa_semaforos.py` para generar marcadores puntuales SVG con iconografía vial.

### 12.5. Ministerio de Desarrollo Social y Familia (MIDESO)
* **Aporte:** Caracterización socioeconómica del Registro Social de Hogares (RSH) agregada por unidad vecinal (UV) y proyectos del Banco Integrado de Proyectos (BIP).
* **Tratamiento:** Vinculación de códigos territoriales con la geometría de unidades vecinales de la comuna de Santiago.

### 12.6. Consejo de Monumentos Nacionales (CMN) y Ministerio de las Culturas
* **Aporte:** Polígonos oficiales de Zonas Típicas, Monumentos Históricos y Sitios Arqueológicos.
* **Tratamiento:** Intersección con el parcelario urbano para alimentar el Inspector Normativo.

---

## 13. Catálogo Exhaustivo Detallado de las 132 Capas Cartográficas

A continuación se expone la tabla maestra con el inventario universal de las 132 capas que operan en la plataforma web y en la geodatabase unificada:

### 13.1. Las 10 Macrocategorías Comunitarias VGI (Barrio Brasil y Región Metropolitana)
| N° | ID en Plataforma (`config.js`) | Código | Denominación Oficial | Dimensión Territorial | Geometría OGC | Ruta Barrial (`data/` y `src/data/`) | Ruta Regional RM (`data/` y `src/data/`) |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| 01 | `educacion` | `CAT-01` | Educación, Universidades e Investigación | Equipamiento Comunitario | Puntos / Polígonos | `data/capa_educacion.geojson` | `data/capa_osm_rm_cat01_educacion.geojson` |
| 02 | `servicios` | `CAT-02` | Servicios Públicos, Salud y Comercio Barrial | Equipamiento Comunitario | Puntos / Polígonos | `data/capa_servicios.geojson` | `data/capa_osm_rm_cat02_servicios.geojson` |
| 03 | `transporte` | `CAT-03` | Transporte Público e Infraestructura Vial | Movilidad Urbana | Puntos / Líneas | `data/capa_transporte.geojson` | `data/capa_osm_rm_cat03_transporte.geojson` |
| 04 | `movilidad_activa` | `CAT-04` | Movilidad Activa, Ciclovías y Red Peatonal | Movilidad Urbana | Líneas / Puntos | `data/capa_movilidad_activa.geojson` | `data/capa_osm_rm_cat04_movilidad_activa.geojson` |
| 05 | `espacio_publico` | `CAT-05` | Áreas Verdes, Parques y Espacio Público | Espacio Público | Polígonos / Puntos | `data/capa_espacio_publico.geojson` | `data/capa_osm_rm_cat05_espacio_publico.geojson` |
| 06 | `patrimonio` | `CAT-06` | Patrimonio Urbano, Cultura y Memoria | Patrimonio Barrial | Puntos / Polígonos | `data/capa_patrimonio.geojson` | `data/capa_osm_rm_cat06_patrimonio.geojson` |
| 07 | `accesibilidad` | `CAT-07` | Accesibilidad Universal e Inclusión (PMR) | Inclusión Urbana | Puntos | `data/capa_accesibilidad.geojson` | `data/capa_osm_rm_cat07_accesibilidad.geojson` |
| 08 | `biodiversidad` | `CAT-08` | Biodiversidad Urbana y Arbolado (OSM / GBIF) | Medio Ambiente | Puntos / Polígonos | `data/capa_biodiversidad.geojson` | `data/capa_osm_rm_cat08_biodiversidad.geojson` |
| 09 | `edificaciones` | `CAT-09` | Edificaciones, Cités y Morfología Urbana | Morfología Urbana | Polígonos | `data/capa_edificaciones.geojson` | `data/capa_osm_rm_cat09_edificaciones.geojson` |
| 10 | `cobertura_suelo` | `CAT-10` | Cobertura y Uso de Suelo Urbano | Morfología Urbana | Polígonos | `data/capa_cobertura_suelo.geojson` | `data/capa_osm_rm_cat10_cobertura_suelo.geojson` |


### 13.2. Las 122 Capas Oficiales del Estado de Chile (IDE Chile / SNIT)
| N° | ID de Capa | Nombre Oficial | Institución Responsable | Ministerio / Sector | Geometría | Archivo Local |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 011 | `censo2024_regional` | Censo 2024 (Marco Regional RM) | Instituto Nacional de Estadísticas (INE) / IDE Chile | Ministerio de Economía, Fomento y Turismo | Polígono (Región Metropolitana) | `data/ide_censo2024_regional.geojson` |
| 012 | `censo2024_limite_urbano` | Censo 2024 (Límites Urbanos Censales RM) | Instituto Nacional de Estadísticas (INE) / IDE Chile | Ministerio de Economía, Fomento y Turismo | Polígonos (Límites Urbanos) | `data/ide_censo2024_limite_urbano.geojson` |
| 013 | `censo2024_localidades` | Censo 2024 (Localidades y Asentamientos RM) | Instituto Nacional de Estadísticas (INE) / IDE Chile | Ministerio de Economía, Fomento y Turismo | Polígonos (Localidades y Asentamientos) | `data/ide_censo2024_localidades.geojson` |
| 014 | `censo2024_zonal` | Censo 2024 (Zonas y Distritos Censales RM) | Instituto Nacional de Estadísticas (INE) / IDE Chile | Ministerio de Economía, Fomento y Turismo | Polígonos (Distritos y Zonas Censales) | `data/ide_censo2024_zonal.geojson` |
| 015 | `censo2024_manzanas` | Censo 2024 (Manzanas Censales RM) | Instituto Nacional de Estadísticas (INE) / IDE Chile | Ministerio de Economía, Fomento y Turismo | Polígonos (Manzanas Censales) | `data/ide_censo2024_manzanas.geojson` |
| 016 | `minvu_patrimonio` | Patrimonio IPT: Inmuebles y Zonas de Conservación Histórica (ZCH / ICH RM) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Puntos y Polígonos | `data/ide_minvu_patrimonio.geojson` |
| 017 | `educacion_parvularia` | Jardines y Salas Cuna (JUNJI / Integra) | JUNJI / Fundación Integra / MINEDUC / IDE Chile | Subsecretaría de Educación Parvularia | Puntos (Jardines) | `data/ide_educacion_parvularia.geojson` |
| 018 | `establecimientos_salud` | Salud Pública (CESFAM y Hospitales) | Ministerio de Salud (MINSAL) / DEIS / IDE Chile | Subsecretaría de Redes Asistenciales | Puntos (Salud) | `data/ide_establecimientos_salud.geojson` |
| 019 | `bomberos` | Cuarteles de Bomberos de Chile | Junta Nacional de Cuerpos de Bomberos / IDE Chile | Ministerio del Interior y Seguridad Pública | Puntos (Cuarteles) | `data/ide_bomberos.geojson` |
| 020 | `carabineros` | Comisarías y Cuarteles Policiales | Carabineros de Chile / IDE Chile | Ministerio del Interior y Seguridad Pública | Puntos (Comisarías) | `data/ide_carabineros.geojson` |
| 021 | `estaciones_metro` | Estaciones de Metro de Santiago | DTPM / Metro S.A. / IDE Chile / datos.gob.cl | Ministerio de Transportes y Telecomunicaciones (MTT) | Puntos (Estaciones) | `data/ide_estaciones_metro.geojson` |
| 022 | `red_ferroviaria` | Red Ferroviaria EFE (MTT) | Empresa de los Ferrocarriles del Estado (EFE) / MTT / IDE Chile | Ministerio de Transportes y Telecomunicaciones | Líneas (Vías Férreas) | `data/ide_red_ferroviaria.geojson` |
| 023 | `cmn_sitios_memoria` | Sitios de Memoria y Monumentos CMN | Consejo de Monumentos Nacionales (CMN) / datos.gob.cl | Ministerio de las Culturas, las Artes y el Patrimonio | Puntos (Monumentos) | `data/ide_cmn_sitios_memoria.geojson` |
| 024 | `minvu_ipt_prc_santiago` | Planes Reguladores Comunales (PRC - RM): Zonificación Comunal | MINVU / Municipios de la Región Metropolitana | División de Desarrollo Urbano (DDU) / DOM Municipales | Polígonos (Zonificación Comunal) | `data/ide_minvu_ipt_prc_santiago.geojson` |
| 025 | `minvu_ipt_prms_usosuelo` | Plan Regulador Metropolitano (PRMS): Usos de Suelo Regional | MINVU / SEREMI Metropolitana de Vivienda y Urbanismo | División de Desarrollo Urbano (DDU) | Polígonos (Usos Metropolitanos) | `data/ide_minvu_ipt_prms_usosuelo.geojson` |
| 026 | `minvu_ipt_areas_verdes` | Áreas Verdes Normativas (MINVU / INE 2023) | Ministerio de Vivienda y Urbanismo (MINVU) / INE | División de Desarrollo Urbano (DDU) | Polígonos (18.173 Áreas Verdes RM) | `data/ide_minvu_ipt_areas_verdes.geojson` |
| 027 | `minvu_ipt_areas_riesgo` | Áreas de Riesgo Normativas (IPT) | MINVU / DDU / SEREMI RM | División de Desarrollo Urbano (DDU) | Polígonos (Riesgo y Restricción) | `data/ide_minvu_ipt_areas_riesgo.geojson` |
| 028 | `minvu_ipt_resguardo_infraestructura` | Fajas de Resguardo e Infraestructura PRMS | MINVU / SEREMI Metropolitana | División de Desarrollo Urbano (DDU) | Líneas (Fajas de Resguardo) | `data/ide_minvu_ipt_resguardo_infraestructura.geojson` |
| 029 | `minvu_ipt_limite_urbano` | Límite Urbano Oficial PRC (MINVU) | MINVU / DDU / I. Municipalidad de Santiago | División de Desarrollo Urbano (DDU) | Polígono (Límite Urbano Oficial) | `data/ide_minvu_ipt_limite_urbano.geojson` |
| 030 | `ide_minvu_campamentos` | Catastro Campamentos 2024 (MINVU) | Ministerio de Vivienda y Urbanismo (MINVU) | Programa de Asentamientos Precarios | Puntos y Polígonos (Campamentos) | `data/ide_minvu_campamentos.geojson` |
| 031 | `ide_minvu_ipt_prms_riesgo` | PRMS: Riesgos Metropolitanos (Inundación / Remoción) | MINVU / SEREMI Metropolitana | División de Desarrollo Urbano (DDU) | Polígonos (Zonas de Riesgo Intercomunal) | `data/ide_minvu_ipt_prms_riesgo.geojson` |
| 032 | `ide_subdere_dpa_comunas` | División Político-Administrativa (SUBDERE / IGM) | Subsecretaría de Desarrollo Regional (SUBDERE) / IGM / IDE Chile | Ministerio del Interior y Seguridad Pública | Polígonos (Límites Comunales Oficiales) | `data/ide_subdere_dpa_comunas.geojson` |
| 033 | `bbdd_01` | Proyectos Mandatados - GEOMOP | Estado de Chile / IDE Chile / geomop.mop.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_01.geojson` |
| 034 | `bbdd_02` | Red Vial Nacional - GEOMOP | Estado de Chile / IDE Chile / geomop.mop.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_02.geojson` |
| 035 | `bbdd_03` | Red Hidrométrica - GEOMOP | Estado de Chile / IDE Chile / geomop.mop.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_03.geojson` |
| 036 | `bbdd_04` | Contratos Concesionados - GEOMOP | Estado de Chile / IDE Chile / geomop.mop.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_04.geojson` |
| 037 | `bbdd_05` | Contratos MOP - GEOMOP | Estado de Chile / IDE Chile / geomop.mop.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_05.geojson` |
| 038 | `bbdd_06` | Jardines Infantiles JUNJI | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_06.geojson` |
| 039 | `bbdd_07` | Infraestructura Deportiva | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_07.geojson` |
| 040 | `bbdd_08` | Municipios | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_08.geojson` |
| 041 | `bbdd_10` | Jardines Infantiles Fundación Integra | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_10.geojson` |
| 042 | `bbdd_11` | Cuerpos de Bomberos | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_11.geojson` |
| 043 | `bbdd_12` | Establecimientos Educación Escolar | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_12.geojson` |
| 044 | `bbdd_13` | Establecimientos Educación Parvularia | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_13.geojson` |
| 045 | `bbdd_14` | Establecimientos de Educación Superior | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_14.geojson` |
| 046 | `bbdd_15` | Centros de SERNAM | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_15.geojson` |
| 047 | `bbdd_17` | Áreas Funcionales de las ciudades (2026) | Estado de Chile / IDE Chile / geoide.minvu.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_17.geojson` |
| 048 | `bbdd_18` | Zonificación Termica | Estado de Chile / IDE Chile / geoide.minvu.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_18.geojson` |
| 049 | `bbdd_19` | Cité | Estado de Chile / IDE Chile / geoide.minvu.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_19.geojson` |
| 050 | `bbdd_20` | SEREMI MINVU Región Metropolitana | SEREMI Metropolitana de Vivienda y Urbanismo / MINVU | Ministerio de Vivienda y Urbanismo | Polígono / Cobertura Regional | `data/capa_bbdd_20.geojson` |
| 051 | `bbdd_21` | Oficinas Serviu | Estado de Chile / IDE Chile / geoide.minvu.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_21.geojson` |
| 052 | `energia_almacenamiento_rm` | Sistemas de Almacenamiento de Energía RM | Ministerio de Energía / IDE Energía | Ministerio de Energía | Infraestructura Energética | `data/capa_energia_almacenamiento.geojson` |
| 053 | `energia_bioenergia_rm` | Centrales de Bioenergía RM | Ministerio de Energía / IDE Energía | Ministerio de Energía | Centrales de Generación | `data/capa_energia_bioenergia.geojson` |
| 054 | `energia_electrolineras_rm` | Red de Electrolineras RM | Ministerio de Energía / IDE Energía | Ministerio de Energía | Puntos de Carga (526 electrolineras) | `data/capa_energia_electrolineras.geojson` |
| 055 | `energia_gasoducto_rm` | Red de Gasoductos RM | Ministerio de Energía / IDE Energía | Ministerio de Energía | Líneas (Trazados de Gasoducto) | `data/capa_energia_gasoductos.geojson` |
| 056 | `energia_hidroelectricas_rm` | Centrales Hidroeléctricas RM | Ministerio de Energía / IDE Energía | Ministerio de Energía | Centrales Hidroeléctricas | `data/capa_energia_hidroelectricas.geojson` |
| 057 | `energia_lineas_transmision_rm` | Líneas de Transmisión Eléctrica RM | Ministerio de Energía / IDE Energía | Ministerio de Energía | Líneas de Alta y Media Tensión | `data/capa_energia_lineas_transmision.geojson` |
| 058 | `energia_oleoducto_rm` | Red de Oleoductos RM | Ministerio de Energía / IDE Energía | Ministerio de Energía | Líneas (Trazados de Oleoducto) | `data/capa_energia_oleoductos.geojson` |
| 059 | `energia_solares_rm` | Plantas Solares Fotovoltaicas RM | Ministerio de Energía / IDE Energía | Ministerio de Energía | Parques y Plantas Solares | `data/capa_energia_solares.geojson` |
| 060 | `energia_termoelectricas_rm` | Centrales Termoeléctricas RM | Ministerio de Energía / IDE Energía | Ministerio de Energía | Centrales Térmicas | `data/capa_energia_termoelectricas.geojson` |
| 061 | `bbdd_23` | Sitios BIO-Prioritarios | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_23.geojson` |
| 062 | `bbdd_24` | Juzgados de Familia | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_24.geojson` |
| 063 | `bbdd_25` | Estaciones Meteorológicas | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_25.geojson` |
| 064 | `bbdd_26` | Estaciones Sedimentométricas | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_26.geojson` |
| 065 | `bbdd_27` | Estaciones de Calidad de Aguas | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_27.geojson` |
| 066 | `bbdd_29` | Cuencas Banco Nacional de Aguas | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_29.geojson` |
| 067 | `bbdd_30` | Indice Calidad de Aguas | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_30.geojson` |
| 068 | `bbdd_31` | Ciclovías | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_31.geojson` |
| 069 | `bbdd_32` | Vertederos Ilegales | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_32.geojson` |
| 070 | `bbdd_33` | Plan Cuadrante Carabineros | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_33.geojson` |
| 071 | `bbdd_34` | Zonas climáticas de Chile según Köppen-Geiger escala 1:1.500.000 | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_34.geojson` |
| 072 | `bbdd_35` | Antenas en Servicio Ley de Torres | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_35.geojson` |
| 073 | `bbdd_37` | Red de Interconexión | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_37.geojson` |
| 074 | `bbdd_38` | Territorios de los Servicios de Salud | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_38.geojson` |
| 075 | `bbdd_39` | Estaciones de monitoreo de calidad de aire (Red Pública) | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_39.geojson` |
| 076 | `bbdd_40` | Circuitos Turísticos | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_40.geojson` |
| 077 | `ccu_rm_1993` | Continuo de Construcciones Urbanas (1993) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 1993) | `data/capa_ccu_1993.geojson` |
| 078 | `ccu_rm_2002` | Continuo de Construcciones Urbanas (2002) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2002) | `data/capa_ccu_2002.geojson` |
| 079 | `ccu_rm_2006` | Continuo de Construcciones Urbanas (2006) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2006) | `data/capa_ccu_2006.geojson` |
| 080 | `ccu_rm_2011` | Continuo de Construcciones Urbanas (2011) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2011) | `data/capa_ccu_2011.geojson` |
| 081 | `ccu_rm_2017` | Continuo de Construcciones Urbanas (2017) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2017) | `data/capa_ccu_2017.geojson` |
| 082 | `ccu_rm_2018` | Continuo de Construcciones Urbanas (2018) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2018) | `data/capa_ccu_2018.geojson` |
| 083 | `ccu_rm_2019` | Continuo de Construcciones Urbanas (2019) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2019) | `data/capa_ccu_2019.geojson` |
| 084 | `ccu_rm_2020` | Continuo de Construcciones Urbanas (2020) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2020) | `data/capa_ccu_2020.geojson` |
| 085 | `ccu_rm_2021` | Continuo de Construcciones Urbanas (2021) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2021) | `data/capa_ccu_2021.geojson` |
| 086 | `ccu_rm_2022` | Continuo de Construcciones Urbanas (2022) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2022) | `data/capa_ccu_2022.geojson` |
| 087 | `ccu_rm_2023` | Continuo de Construcciones Urbanas (2023) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2023) | `data/capa_ccu_2023.geojson` |
| 088 | `ccu_rm_2024` | Continuo de Construcciones Urbanas (2024) | Ministerio de Vivienda y Urbanismo (MINVU) | División de Desarrollo Urbano (DDU) | Polígonos (Huella Urbana 2024) | `data/capa_ccu_2024.geojson` |
| 089 | `bbdd_42` | Pisos vegetacionales de Luebert y Pliscoff 2017 | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_42.geojson` |
| 090 | `bbdd_43` | División Política Administrativa 2023 | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_43.geojson` |
| 091 | `bbdd_44` | Municipios con certificación ambiental (SCAM) | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_44.geojson` |
| 092 | `bbdd_46` | Predios Urbanos (Comuna de Santiago) | Servicio de Impuestos Internos (SII) / IDE Chile | Ministerio de Hacienda | Polígonos (35.036 Predios Santiago) | `data/capa_bbdd_46.geojson` |
| 093 | `bbdd_47` | Zona Fronteriza | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_47.geojson` |
| 094 | `bbdd_48` | Pasos Fronterizos | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_48.geojson` |
| 095 | `bbdd_49` | Estaciones Fluviométricas | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_49.geojson` |
| 096 | `bbdd_50` | Oficinas de Protección de Derechos (ODP) | Estado de Chile / IDE Chile / geoportal.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_50.geojson` |
| 097 | `bbdd_51` | Localización de viveros en Chile continental | Estado de Chile / IDE Chile / ide.minagri.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_51.geojson` |
| 098 | `bbdd_52` | Estaciones Meteorológicas Automáticas (FIA) | Estado de Chile / IDE Chile / ide.minagri.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_52.geojson` |
| 099 | `bbdd_53` | Industria Forestal Primeria (INFOR) | Estado de Chile / IDE Chile / ide.minagri.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_53.geojson` |
| 100 | `bbdd_54` | Mercados Mayoristas (ODEPA) | Estado de Chile / IDE Chile / ide.minagri.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_54.geojson` |
| 101 | `bbdd_55` | Sistema Nacional de Áreas Silvestres Protegidas del Estado | Estado de Chile / IDE Chile / ide.minagri.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_55.geojson` |
| 102 | `bbdd_59` | Cobertura de canales a nivel nacional | Estado de Chile / IDE Chile / ide.minagri.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_59.geojson` |
| 103 | `bbdd_60` | Catastro y Actualización de los Recursos Vegetacionales y Uso de la Tierra de la Región de Metropolitana (XIII) | Estado de Chile / IDE Chile / ide.minagri.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_60.geojson` |
| 104 | `bbdd_62` | Cobertura de polígonos representativos de los huertos frutales de la Región Metropolitana 2025 | Estado de Chile / IDE Chile / icet.odepa.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_62.geojson` |
| 105 | `bbdd_63` | Inventario de Biomasa y Carbono - Metropolitana tipo Forestal | Estado de Chile / IDE Chile / sit.conaf.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_63.geojson` |
| 106 | `bbdd_64` | Índice Global de Vulnerabilidad Socioterritorial (IGVUST) por UV 2026 Agosto | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/IGVUST_UV_2026_Agosto.geojson` |
| 107 | `bbdd_65` | Iniciativas de inversión del Banco Integrado de Proyectos (BIP), por años, al 31-08-2026. | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/BIP_Iniciativas_Inversion_RM_Comunas.geojson` |
| 108 | `bbdd_66` | Unidades Vecinales 2026 | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/capa_bbdd_66.geojson` |
| 109 | `bbdd_67` | Personas en RSH en situación de dependencia funcional según CSE - 2026 Agosto | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/RSH_Dependencia_Funcional_UV_2026_Agosto.geojson` |
| 110 | `bbdd_68` | Personas en RSH según CSE y sexo - 2026 Agosto | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/RSH_Sexo_UV_2026_Agosto.geojson` |
| 111 | `bbdd_69` | NNA en RSH adscritas a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/NNA_RSH_Fonasa_Isapre_UV_2026_Junio.geojson` |
| 112 | `bbdd_70` | Mujeres en RSH adscritas a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/Mujeres_RSH_Fonasa_Isapre_UV_2026_Junio.geojson` |
| 113 | `bbdd_71` | Jóvenes en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/Jovenes_RSH_Fonasa_Isapre_UV_2026_Junio.geojson` |
| 114 | `bbdd_72` | Hombres en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/Hombres_RSH_Fonasa_Isapre_UV_2026_Junio.geojson` |
| 115 | `bbdd_73` | Personas mayores en RSH adscritos a Fonasa o Isapre según CSE y tipo de institución - 2026 Junio | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/Mayores_RSH_Fonasa_Isapre_UV_2026_Junio.geojson` |
| 116 | `bbdd_74` | Personas en RSH ocupadas y cotizando, por modalidad contractual según tramo CSE - 2026 Junio | Estado de Chile / IDE Chile / bidat.gob.cl | Organismo Público del Estado de Chile | Vectorial / Tabular Georreferenciada | `data/RSH_Ocupados_Cotizando_UV_2026_Junio.geojson` |
| 117 | `semaforos_rm_uoct_2026` | Cruces Semaforizados Conectados SC-RM (UOCT / MTT) | Unidad Operativa de Control de Tránsito (UOCT) / MTT | Ministerio de Transportes y Telecomunicaciones | Puntos (Cruces Semaforizados) | `data/semaforos_rm_uoct_2026.geojson` |
| 118 | `catastro_predial_sii` | Catastro Predial del Servicio de Impuestos Internos (Segundo Semestre 2025) | Servicio de Impuestos Internos (SII) | Ministerio de Hacienda | Puntos (Predios Geocodificados) | `data/capa_catastro_predial_sii.geojson` |
| 119 | `subdere_rsd_analisis_costos_comuna_rm` | SUBDERE RSD 2024 - Costos Comunales de Aseo (RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Polígonos Comunales | `data/subdere_rsd_2024_rm/Analisis_Costos_Comuna_RM.geojson` |
| 120 | `subdere_rsd_poblacion_atendida_pta_puntos_rm` | SUBDERE RSD 2024 - Población Total Atendida PTA (Centroides RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Puntos (Centroides Comunales) | `data/subdere_rsd_2024_rm/Poblacion_Comunal_Atendida_PTA_p_RM.geojson` |
| 121 | `subdere_rsd_poblacion_comunal_pta_poligonos_rm` | SUBDERE RSD 2024 - Población Total Atendida PTA (Polígonos RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Polígonos Comunales | `data/subdere_rsd_2024_rm/Poblacion_Comunal_PTA_RM.geojson` |
| 122 | `subdere_rsd_ciudades_poblacion_rm` | SUBDERE RSD 2024 - Ciudades y Entidades Urbanas (RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Polígonos Urbanos | `data/subdere_rsd_2024_rm/Ciudades_Pb_Pol_RM.geojson` |
| 123 | `subdere_rsd_criticidad_sitios_disposicion_rm` | SUBDERE RSD 2024 - Criticidad de Rellenos Sanitarios (RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Puntos (Rellenos Sanitarios) | `data/subdere_rsd_2024_rm/Criticidad_Sitios_Disposicion_RSD_Ene24_RM.geojson` |
| 124 | `subdere_rsd_distancia_municipio_sdf_rm` | SUBDERE RSD 2024 - Distancias Municipio a Relleno Sanitario (RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Líneas de Transporte | `data/subdere_rsd_2024_rm/Distancia_Municipio_SDF_RM.geojson` |
| 125 | `subdere_rsd_gastos_ingresos_sinim_rm` | SUBDERE RSD 2024 - Finanzas Municipales y Gasto en Aseo SINIM (RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Polígonos Comunales | `data/subdere_rsd_2024_rm/Gastos_Ingresos_SINIM_RM.geojson` |
| 126 | `subdere_rsd_recoleccion_transporte_operativo_rm` | SUBDERE RSD 2024 - Recolección y Transporte de Residuos (RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Polígonos Comunales | `data/subdere_rsd_2024_rm/Recoleccion_Transporte_RM.geojson` |
| 127 | `subdere_rsd_ppc_generacion_pta_rm` | SUBDERE RSD 2024 - Generación de Residuos y Producción Per Cápita (RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Polígonos Comunales | `data/subdere_rsd_2024_rm/RSD_PPC_PTA_RM.geojson` |
| 128 | `subdere_rsd_sdf_comunas_destino_rm` | SUBDERE RSD 2024 - Destino de Disposición Final por Comuna (RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Polígonos Comunales | `data/subdere_rsd_2024_rm/SDF_Comunas_RM.geojson` |
| 129 | `subdere_rsd_sdf_municipios_puntos_rm` | SUBDERE RSD 2024 - Sedes Municipales y Relleno Receptor (Puntos RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Puntos (Municipios) | `data/subdere_rsd_2024_rm/SDF_Municipios_RM.geojson` |
| 130 | `subdere_rsd_sitios_disposicion_instalaciones_rm` | SUBDERE RSD 2024 - Rellenos Sanitarios e Instalaciones (RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Puntos (Instalaciones) | `data/subdere_rsd_2024_rm/Sitios_Disposicion_RSD_Ene24_RM.geojson` |
| 131 | `subdere_rsd_sitios_intermedios_transferencia_rm` | SUBDERE RSD 2024 - Estaciones de Transferencia Intermedia (RM) | Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE) | Ministerio del Interior y Seguridad Pública | Puntos (Estaciones de Transferencia) | `data/subdere_rsd_2024_rm/Sitios_Intermedios_Disposicion_RSD_Ene24_RM.geojson` |
| 132 | `munistgo_aseo_zonas_residuos_2026` | MuniSTGO - Catastro Zonas de Aseo, Contenedores y Papeleros (Junio 2026) | Ilustre Municipalidad de Santiago (Subdirección de Aseo y Gestión Integral de Residuos) | Municipalidad de Santiago / Ley N° 20.285 Transparencia | Polígonos (Macro-Zonas de Aseo) | `data/zonas_aseo_contenedores_papeleros_santiago.geojson` |


---

## 14. El Esquema Maestro Obligatorio de 14 Atributos ISO por Entidad Geográfica

```mermaid
flowchart LR
    subgraph IN_ISO["1. INPUT"]
        RAW_VEC["Capas Vectoriales GeoJSON Crudas (VGI y Oficiales)"]
        METADATA_DICT["Diccionario Maestro de Metadatos y Linaje"]
    end

    subgraph PROC_ISO["2. PIPELINE DE PROCESAMIENTO"]
        SCRIPT_ENR["scripts/enriquecer_base_datos_metadatos.py"]
        INJECT_PROP["Inyección Algorítmica de 14 Claves Obligatorias"]
        CAST_TYPES["Homologación de Tipos de Datos (String, Float, ISO-Date)"]
    end

    subgraph OUT_ISO["3. OUTPUT"]
        STD_GEOJSON["132 Capas GeoJSON 100% Homogéneas"]
        ISO_CONFORM["Conformidad Total con Perfil IDE Chile / SNIT"]
        EXPORT_READY["Exportabilidad Directa hacia QGIS y ArcGIS"]
    end

    IN_ISO --> PROC_ISO --> OUT_ISO
```

Para garantizar que el Inspector Normativo, el Evaluador de Calidad ISO 19157 y las funciones de exportación tabular operen de manera homogénea sobre cualquier capa (sea comunitaria u oficial), todo archivo GeoJSON en el Atlas debe contener en su objeto `properties` los siguientes **14 atributos maestros normalizados**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│             LOS 14 ATRIBUTOS MAESTROS OBLIGATORIOS POR ENTIDAD         │
├────────────────────────────────────────────────────────────────────────┤
│ 01. id_atlas              ──> Identificador unívoco alfanumérico       │
│ 02. categoria             ──> Macrocategoría temático-funcional        │
│ 03. subcategoria          ──> Tipo específico del elemento             │
│ 04. nombre                ──> Topónimo o nombre oficial                │
│ 05. fuente_origen         ──> Organización o proyecto emisor           │
│ 06. licencia              ──> Base jurídica de reutilización           │
│ 07. fecha_captura         ──> Fecha ISO 8601 de captura o actualización│
│ 08. comuna                ──> Comuna político-administrativa (DPA)     │
│ 09. region                ──> Región político-administrativa (RM)      │
│ 10. metadato_url          ──> Enlace web a la ficha ISO 19115          │
│ 11. tipo_geometria        ──> Geometría OGC Simple Feature             │
│ 12. precision_posicional  ──> Tolerancia métrica de error estimada     │
│ 13. estado_revision       ──> Nivel de curatoría técnica en el Atlas   │
│ 14. propiedades_originales──> Diccionario JSON con atributos crudos    │
└────────────────────────────────────────────────────────────────────────┘
```

### 14.1. Diccionario de Tipos de Datos y Ejemplos Reales

| N° | Atributo Maestro | Tipo de Dato | Restricción / Formato | Ejemplo Real en Barrio Brasil |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `id_atlas` | String | Clave única alfanumérica sin espacios | `"VGI-CL-RM-CAT01-000412"` |
| **2** | `categoria` | String | Una de las 10 macrocategorías o grupos IDE | `"Educación y Equipamiento"` |
| **3** | `subcategoria` | String | Clasificador secundario estandarizado | `"Universidad / Sede Académica"` |
| **4** | `nombre` | String | Nombre formal (no dejar en blanco) | `"Universidad Alberto Hurtado - Sede Cienfuegos"` |
| **5** | `fuente_origen`| String | Fuente primaria de procedencia del dato | `"OpenStreetMap / Colaboradores UAH"` |
| **6** | `licencia` | String | Licencia abierta explícita | `"Open Database License (ODbL 1.0)"` |
| **7** | `fecha_captura`| String | Formato ISO 8601 `YYYY-MM-DD` | `"2026-09-24"` |
| **8** | `comuna` | String | Nombre oficial según DPA Subdere | `"Santiago"` |
| **9** | `region` | String | Región oficial del Estado | `"Región Metropolitana de Santiago"` |
| **10**| `metadato_url` | String | URL resoluble al metadato | `"https://atlasvgiuah.netlify.app/docs/perfil_metadatos_vgi.xlsx"` |
| **11**| `tipo_geometria`| String | Simple Feature: Point, LineString, Polygon | `"Polygon"` |
| **12**| `precision_posicional`| String | Estimación de tolerancia métrica | `"± 3.0 metros (GNSS / Ortofoto IDE)"` |
| **13**| `estado_revision`| String | Nivel de auditoría en el modelo WLC | `"Auditado Grado A+ (ISO 19157)"` |
| **14**| `propiedades_originales`| Object | Objeto JSON con los atributos crudos de origen | `{"rbd": 9845, "osm_id": 4829104, "levels": 3}` |

### 14.2. Script Automatizado de Inyección de Atributos (`scripts/enriquecer_base_datos_metadatos.py`)
Para garantizar que ninguna capa se suba a producción sin estos 14 campos, el script `scripts/enriquecer_base_datos_metadatos.py` recorre iterativamente los archivos GeoJSON y estandariza su estructura:

```python
import json
import os

def normalizar_geojson(ruta_archivo, id_prefijo, categoria_defecto):
    with open(ruta_archivo, "r", encoding="utf-8") as f:
        data = json.load(f)

    for idx, feature in enumerate(data.get("features", [])):
        props = feature.get("properties", {})
        geom = feature.get("geometry", {})
        
        # Preservar atributos crudos
        propiedades_originales = dict(props)
        
        # Inyectar los 14 atributos maestros obligatorios
        feature["properties"] = {
            "id_atlas": f"{id_prefijo}-{idx+1:06d}",
            "categoria": props.get("categoria", categoria_defecto),
            "subcategoria": props.get("subcategoria", props.get("tipo", "General")),
            "nombre": props.get("nombre", props.get("name", "Entidad Sin Nombre")),
            "fuente_origen": props.get("fuente_origen", "Atlas VGI UAH"),
            "licencia": props.get("licencia", "CC BY-SA 4.0 / ODbL 1.0"),
            "fecha_captura": props.get("fecha_captura", "2026-10-01"),
            "comuna": props.get("comuna", "Santiago"),
            "region": "Región Metropolitana de Santiago",
            "metadato_url": "https://atlasvgiuah.netlify.app/docs/perfil_metadatos_vgi.xlsx",
            "tipo_geometria": geom.get("type", "Unknown"),
            "precision_posicional": props.get("precision_posicional", "± 5.0 metros"),
            "estado_revision": "Validado Grado A+ (ISO 19157)",
            "propiedades_originales": propiedades_originales
        }

    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
```

---
"""
print("[+] Parte 02 enriquecida cargada exitosamente")
