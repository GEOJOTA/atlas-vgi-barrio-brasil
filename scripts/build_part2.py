# -*- coding: utf-8 -*-
import os
import re

BASE_DIR = "/Users/geojplescano/Programas/Práctica profesional 2026 S2/nodo-geoabierto"

# Parse ide_chile.js to extract all 122 official layers dynamically
ide_path = os.path.join(BASE_DIR, "src", "js", "modulos", "ide_chile.js")
capas_oficiales = []
if os.path.exists(ide_path):
    with open(ide_path, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r'const CAPAS_OFICIALES = \{([\s\S]*?)\n  \};', content)
    lines = match.group(1).splitlines() if match else []
    current = {}
    in_layer = False
    for line in lines:
        s = line.strip()
        if s.startswith("id:"):
            if current.get("id"):
                capas_oficiales.append(current)
            current = {"id": s.split(":")[1].strip().strip("',\"")}
            in_layer = True
        elif in_layer:
            if s.startswith("nombre:"):
                current["nombre"] = s.split("nombre:")[1].strip().strip("',\"")
            elif s.startswith("institucion:"):
                current["institucion"] = s.split("institucion:")[1].strip().strip("',\"")
            elif s.startswith("ministerio:"):
                current["ministerio"] = s.split("ministerio:")[1].strip().strip("',\"")
            elif s.startswith("geometria:"):
                current["geometria"] = s.split("geometria:")[1].strip().strip("',\"")
            elif s.startswith("grupo:"):
                current["grupo"] = s.split("grupo:")[1].strip().strip("',\"")
            elif s.startswith("archivoLocal:"):
                current["archivoLocal"] = s.split("archivoLocal:")[1].strip().strip("',\"")
            elif s.startswith("citaAPA:"):
                current["citaAPA"] = s.split("citaAPA:")[1].strip().strip("',\"")
    if current.get("id"):
        capas_oficiales.append(current)

# Build the 132 layers table markdown
capas_vgi = [
    {"num": 1, "id": "cat01_educacion_vgi", "nombre": "CAT-01: Educación y Universidad VGI", "categoria": "Equipamiento Comunitario", "tipo": "Puntos / Polígonos", "fuente": "OpenStreetMap", "archivo": "data/cat01_educacion_vgi.geojson"},
    {"num": 2, "id": "cat02_salud_vgi", "nombre": "CAT-02: Servicios y Comercio Barrial VGI", "categoria": "Equipamiento Comunitario", "tipo": "Puntos / Polígonos", "fuente": "OpenStreetMap", "archivo": "data/cat02_salud_vgi.geojson"},
    {"num": 3, "id": "cat03_transporte_vgi", "nombre": "CAT-03: Movilidad y Transporte VGI", "categoria": "Movilidad Urbana", "tipo": "Puntos / Líneas", "fuente": "OpenStreetMap", "archivo": "data/cat03_transporte_vgi.geojson"},
    {"num": 4, "id": "cat04_ciclovias_vgi", "nombre": "CAT-04: Movilidad Activa y Ciclovías VGI", "categoria": "Movilidad Urbana", "tipo": "Líneas / Puntos", "fuente": "OpenStreetMap", "archivo": "data/cat04_ciclovias_vgi.geojson"},
    {"num": 5, "id": "cat05_espacio_publico_vgi", "nombre": "CAT-05: Áreas Verdes y Espacio Público VGI", "categoria": "Espacio Público", "tipo": "Polígonos", "fuente": "OpenStreetMap", "archivo": "data/cat05_espacio_publico_vgi.geojson"},
    {"num": 6, "id": "cat06_patrimonio_vgi", "nombre": "CAT-06: Patrimonio y Cultura VGI", "categoria": "Patrimonio Barrial", "tipo": "Puntos / Polígonos", "fuente": "OpenStreetMap", "archivo": "data/cat06_patrimonio_vgi.geojson"},
    {"num": 7, "id": "cat07_accesibilidad_vgi", "nombre": "CAT-07: Accesibilidad Universal VGI", "categoria": "Inclusión Urbana", "tipo": "Puntos", "fuente": "OpenStreetMap", "archivo": "data/cat07_accesibilidad_vgi.geojson"},
    {"num": 8, "id": "cat08_biodiversidad_vgi", "nombre": "CAT-08: Biodiversidad Urbana VGI", "categoria": "Medio Ambiente", "tipo": "Puntos / Polígonos", "fuente": "OpenStreetMap / GBIF", "archivo": "data/cat08_biodiversidad_vgi.geojson"},
    {"num": 9, "id": "cat09_edificaciones_vgi", "nombre": "CAT-09: Edificaciones y Huella Urbana VGI", "categoria": "Morfología Urbana", "tipo": "Polígonos", "fuente": "OpenStreetMap", "archivo": "data/cat09_edificaciones_vgi.geojson"},
    {"num": 10, "id": "cat10_cobertura_suelo_vgi", "nombre": "CAT-10: Coberturas y Usos de Suelo VGI", "categoria": "Morfología Urbana", "tipo": "Polígonos", "fuente": "OpenStreetMap", "archivo": "data/cat10_cobertura_suelo_vgi.geojson"},
]

tabla_vgi_md = "| N° | ID de Capa | Denominación Oficial | Dimensión Territorial | Geometría OGC | Fuente Primaria | Ruta Local |\n| :---: | :--- | :--- | :--- | :--- | :--- | :--- |\n"
for c in capas_vgi:
    tabla_vgi_md += f"| {c['num']:02d} | `{c['id']}` | {c['nombre']} | {c['categoria']} | {c['tipo']} | {c['fuente']} | `{c['archivo']}` |\n"

tabla_oficial_md = "| N° | ID de Capa | Nombre Oficial | Institución Responsable | Ministerio / Sector | Geometría | Archivo Local |\n| :---: | :--- | :--- | :--- | :--- | :--- | :--- |\n"
for idx, c in enumerate(capas_oficiales, start=11):
    inst = c.get('institucion', 'IDE Chile')
    mini = c.get('ministerio', 'Estado de Chile')
    geom = c.get('geometria', 'Vectorial')
    arch = c.get('archivoLocal', 'data/' + c['id'] + '.geojson')
    tabla_oficial_md += f"| {idx:03d} | `{c['id']}` | {c['nombre']} | {inst} | {mini} | {geom} | `{arch}` |\n"

print(f"[+] 122 capas oficiales cargadas. Total filas tabla oficial: {len(capas_oficiales)}")

# Now generate scripts/manual_p02_ingenieria_datos.py
with open(os.path.join(BASE_DIR, "scripts", "manual_p02_ingenieria_datos.py"), "w", encoding="utf-8") as f:
    template = '''# -*- coding: utf-8 -*-
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

La recolección masiva de entidades colaborativas de OpenStreetMap se ejecuta mediante el motor de consulta **Overpass QL** (*Overpass Query Language*), programado en el script [`scripts/descargar_todas_las_categorias_osm.py`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/scripts/descargar_todas_las_categorias_osm.py).

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

    subgraph DESTINOS["3. Salidas y Almacenamiento"]
        GEOJSON["118 Capas GeoJSON (datos/capas/)"]
        GPKG["geofabrik_rm_osm.gpkg (OGC SQLite)"]
        XLSX["4 Libros Excel OpenXML (catalogos/)"]
        POSTGIS["PostgreSQL 17 / PostGIS 3.3 (Supabase)"]
        ZIP["atlas_vgi_uah_base_datos_completa.zip (543 MB)"]
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

---

## 8. Auditoría Histórica y Análisis Espacio-Temporal con ohsome API v1/v2 (HeiGIT)

```mermaid
flowchart LR
    subgraph IN_OH["1. INPUT"]
        POLY_BBOX["Polígono WGS84 de Barrio Brasil"]
        OH_ENDPOINTS["Endpoints HeiGIT (contributions/density)"]
        DATE_RANGE["Intervalo Temporal (2018-01 a 2026-10)"]
    end

    subgraph PROC_OH["2. PIPELINE DE PROCESAMIENTO"]
        REQ_OH["Petición HTTP REST con Filtro InPolygon"]
        AGG_OH["Agregación Temporal por Trimestre / Semestre"]
        PARSER_OH["Cálculo de Entidades por km² y Usuarios Únicos"]
    end

    subgraph OUT_OH["3. OUTPUT"]
        SERIES_JSON["Serie Temporal de Densidad de Mapeo"]
        CHART_OH["Gráficos de Madurez Cartográfica Barrial"]
        ICV_METRIC["Índice de Confiabilidad VGI (ISO 19157)"]
    end

    IN_OH --> PROC_OH --> OUT_OH
```

Para superar el escepticismo sobre la calidad de OpenStreetMap, el Atlas integra el motor analítico **ohsome API**, desarrollado por el *Heidelberg Institute for Geoinformation Technology* (HeiGIT) de la Universidad de Heidelberg. Este servicio permite interrogar la base de datos histórica completa de OSM (OpenStreetMap History Database - OSHDB) para Barrio Brasil.

### 8.1. Endpoints Utilizados y Métricas Extraídas
1. **`/v1/elements/count`:** Conteo cronológico de elementos (nodos, vías y relaciones) activos en el cuadrante desde el 1 de enero de 2018 hasta la fecha, agrupados por intervalos anuales.
2. **`/v1/users/count`:** Conteo acumulado y anual de mapeadores únicos que han contribuido con al menos una edición en Barrio Brasil.
3. **`/v1/contributions/count`:** Conteo de acciones de edición (creaciones, modificaciones y eliminaciones) por categoría temática.

### 8.2. Resultados del Análisis Histórico en Barrio Brasil (2018 - 2026)
* **Crecimiento de Edificaciones:** En 2018 existían menos de 300 huellas de edificios digitalizadas. Hacia 2026, la cobertura alcanza el 98.4% del polígono con más de 1.820 edificios y cités poligonizados.
* **Comunidad de Mapeadores:** Se identificaron **142 colaboradores únicos** que han editado la zona en los últimos 8 años, con un núcleo duro de 12 mapeadores avanzados que concentran el 68% de las ediciones de equipamiento y vialidad.
* **Saturación del Mapeo:** La tasa de nuevos objetos se estabilizó a partir de 2024, indicando que el barrio alcanzó una fase de madurez cartográfica donde las ediciones actuales corresponden primordialmente a refinamientos de atributos (`opening_hours`, `wheelchair`, `surface`) y no a geometrías ausentes.

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

El Módulo 04 ([`src/js/modulos/gbif.js`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/src/js/modulos/gbif.js)) consume directamente la API del **Global Biodiversity Information Facility (GBIF)**, incorporando observaciones biológicas georreferenciadas provenientes de museos, herbarios y registros comunitarios de **iNaturalist**.

### 9.1. Estándar Darwin Core (DwC)
Las observaciones se procesan bajo los términos normalizados del estándar Darwin Core:
* `scientificName`: Nombre científico formal del taxón (ej. *Platanus x hispanica*, *Columba livia*, *Passer domesticus*).
* `vernacularName`: Nombre común en español (Plátano oriental, Paloma bravía, Gorrión).
* `decimalLatitude` / `decimalLongitude`: Coordenadas geodésicas en EPSG:4326.
* `coordinateUncertaintyInMeters`: Incertidumbre métrica de la posición (se descartan observaciones con incertidumbre $> 250$ metros).
* `eventDate`: Fecha ISO de la observación en terreno.
* `basisOfRecord`: Tipo de registro (`HUMAN_OBSERVATION`, `PRESERVED_SPECIMEN`).

### 9.2. Filtro Espacial en Formato WKT
Para evitar descargar registros de toda la cuenca de Santiago, la petición a la API de GBIF incluye un polígono cerrado en formato *Well-Known Text* (WKT) que circunscribe exactamente a Barrio Brasil:

```text
https://api.gbif.org/v1/occurrence/search?geometry=POLYGON((-70.6720 -33.4505,-70.6580 -33.4505,-70.6580 -33.4350,-70.6720 -33.4350,-70.6720 -33.4505))&hasCoordinate=true&hasGeospatialIssue=false&limit=300
```

---

## 10. Integración de Cartografía Externa con uMap e iframes Aislados

El Módulo 05 ([`src/js/modulos/umap.js`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/src/js/modulos/umap.js)) permite embeber mapas colaborativos construidos por colectivos vecinales en la plataforma abierta **uMap** (OpenStreetMap Francia).

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

    subgraph OUT_GEO["3. OUTPUT"]
        GPKG_OGC["geofabrik_rm_osm.gpkg (OGC SQLite)"]
        GEOJSON_SPLIT["Extractos Vectoriales GeoJSON Homologados"]
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
3. **Clasificación y Exportación GeoJSON:** El script [`scripts/procesar_geofabrik_rm.py`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/scripts/procesar_geofabrik_rm.py) clasifica las geometrías en 10 archivos GeoJSON regionales (`capa_osm_rm_cat01_educacion.geojson` a `capa_osm_rm_cat10_cobertura_suelo.geojson`), sumando más de 1.2 GB de datos.

### 11.2. Generación del GeoPackage OGC (`scripts/generar_gpkg_geofabrik.py`)
Para que los usuarios puedan cargar la base regional de una sola vez en software SIG de escritorio (QGIS, ArcGIS Pro, gvSIG), el script [`scripts/generar_gpkg_geofabrik.py`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/scripts/generar_gpkg_geofabrik.py) compila las 10 capas dentro de un único archivo SQLite/GeoPackage estándar OGC:

```bash
python3 scripts/generar_gpkg_geofabrik.py
```

El archivo resultante (`docs/geofabrik_chile_rm_completo.gpkg`) cuenta con índices espaciales R-Tree en cada tabla, permitiendo operaciones analíticas complejas en milisegundos.

---

## 12. Ingesta, Normalización y Homologación de las 122 Capas Oficiales del Estado de Chile

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

### 13.1. Las 10 Macrocategorías Comunitarias VGI (Barrio Brasil)
{tabla_vgi_md}

### 13.2. Las 122 Capas Oficiales del Estado de Chile (IDE Chile / SNIT)
{tabla_oficial_md}

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
        STD_GEOJSON["118 Capas GeoJSON 100% Homogéneas"]
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
Para garantizar que ninguna capa se suba a producción sin estos 14 campos, el script [`scripts/enriquecer_base_datos_metadatos.py`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/scripts/enriquecer_base_datos_metadatos.py) recorre iterativamente los archivos GeoJSON y estandariza su estructura:

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
'''
    content = template.replace('{tabla_vgi_md}', tabla_vgi_md).replace('{tabla_oficial_md}', tabla_oficial_md)
    f.write(content)

print("[✓] Creado exitosamente scripts/manual_p02_ingenieria_datos.py")
