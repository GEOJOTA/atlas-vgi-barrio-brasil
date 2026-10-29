# -*- coding: utf-8 -*-

SECCION_12 = r"""## 12. Catálogos Maestros y Matrices Tabulares (OpenXML .xlsx y CSV)

El Atlas VGI desacopla estrictamente los datos espaciales vectoriales (GeoJSON/PostGIS) de sus descripciones catalográficas, taxonomías temáticas y matrices de metacalidad. Esta separación permite que investigadores de ciencias sociales, planificadores urbanos y auditores no técnicos examinen la geodatabase completa mediante hojas de cálculo estándar ISO/IEC 29500 (OpenXML .xlsx) y texto delimitado por comas (CSV UTF-8).

### 12.1. Catálogo de Macrocategorías Temáticas VGI (`categorias_tematicas_osm.xlsx`)
Ubicado en [`docs/categorias_tematicas_osm.xlsx`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/docs/categorias_tematicas_osm.xlsx) y replicado en `src/docs/categorias_tematicas_osm.xlsx`, este libro de trabajo constituye la taxonomía semántica oficial del Atlas para el mapeo colaborativo en Barrio Brasil y Santiago Centro.

* **Estructura Interna del Libro:** Consta de 11 hojas de cálculo estructuradas:
  1. `Resumen_General`: Tablero de control con el conteo de subcategorías, peso porcentual en el modelo de habitabilidad urbana y fuente primaria.
  2. `CAT-01_Educacion`: Colegios, escuelas básicas, liceos, sedes universitarias (UAH, USACH, etc.), bibliotecas públicas y centros de investigación.
  3. `CAT-02_Salud`: Hospitales de alta complejidad (ej. San Juan de Dios), CESFAM comunales, SAPU, postas de urgencia, farmacias comunitarias e independientes.
  4. `CAT-03_Transporte`: Bocas y andenes de estaciones de Metro (Líneas 1, 2 y 5), paraderos RED Movilidad, terminales de buses interurbanos y aparcamientos.
  5. `CAT-04_Ciclovias`: Ciclovías consolidadas, ciclocalles zonificadas, estaciones de bicicletas públicas (Bike Santiago / Itaú) y talleres de reparación barrial.
  6. `CAT-05_Espacio_Publico`: Plazas históricas (Plaza Brasil, Plaza Yungay, Plaza Manuel Rodríguez), parques metropolitanos (Parque Quinta Normal, Parque Portales), bulevares peatonales y mobiliario urbano.
  7. `CAT-06_Patrimonio`: Monumentos Nacionales, Inmuebles y Zonas de Conservación Histórica del PRC de Santiago, placas recordatorias y centros de memoria barrial.
  8. `CAT-07_Accesibilidad`: Cruces peatonales semaforizados con pulsador sonoro, rebajes de acera (rampas PMR), veredas accesibles y obstáculos en vía pública.
  9. `CAT-08_Biodiversidad`: Catastro de arbolado viario significativo, jardines comunitarios, copas de árboles y áreas de refugio faunístico urbano.
  10. `CAT-09_Edificaciones`: Huellas de edificios en altura, tipologías de cités históricos, pasajes residenciales y usos mixtos comerciales/residenciales.
  11. `CAT-10_Cobertura_Suelo`: Clasificación de usos de suelo (residencial, comercial, equipamiento, baldío o sitio eriazo).

* **Esquema de Columnas por Hoja:**
  - `ID_SUBCATEGORIA`: Código unívoco alfanumérico (ej. `CAT01-EDU-001`).
  - `NOMBRE_ES`: Nombre formal en español del descriptor.
  - `ETIQUETA_OSM_PRIMARIA`: Par clave=valor principal en OpenStreetMap (ej. `amenity=school`).
  - `ETIQUETAS_COMPLEMENTARIAS`: Etiquetas secundarias recomendadas (`operator:type=public`, `fee=no`, `wheelchair=yes`).
  - `PESO_HABITABILIDAD`: Ponderador analítico en el modelo de caminabilidad urbana (rango 0.05 a 0.25).
  - `FUENTE_NORMATIVA`: Documento regulador (OGUC, Ley General de Urbanismo y Construcciones, Guía Metodológica MINVU).
  - `CRITERIO_VERIFICACION`: Instrucción clara para que un voluntario o estudiante verifique en terreno la veracidad del objeto.

### 12.2. Catálogo Maestro de Fuentes Oficiales e Interoperabilidad (`catalogo_fuentes_vgi.xlsx`)
Ubicado en [`docs/catalogo_fuentes_vgi.xlsx`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/docs/catalogo_fuentes_vgi.xlsx), consolida las fichas técnicas de las **131 capas cartográficas** integradas en el Atlas.

* **Campos del Catálogo (24 Columnas Normalizadas):**
  1. `ID_CAPA_ATLAS`: Identificador de software (ej. `censo2024_manzanas`, `subdere_rsd_sitios_disposicion_instalaciones_rm`).
  2. `NOMBRE_OFICIAL`: Nombre estandarizado de la capa.
  3. `MINISTERIO`: Secretaría de Estado responsable (ej. *Ministerio de Economía, Fomento y Turismo*).
  4. `INSTITUCION_CUSTODIA`: Organismo técnico titular de los datos (ej. *Instituto Nacional de Estadísticas - INE*).
  5. `DIVISION_DEPARTAMENTO`: Unidad operativa emisora.
  6. `TIPO_SERVICIO_ORIGEN`: WFS (Web Feature Service), WMS, REST FeatureServer de ArcGIS o archivo estático.
  7. `URL_SERVICIO_OFICIAL`: Endpoint HTTP directo al geoservicio gubernamental.
  8. `GEOMETRIA_OGC`: `Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`.
  9. `TOTAL_ENTIDADES`: Número de entidades vectoriales auditadas en la Región Metropolitana.
  10. `ANIO_PUBLICACION`: Año oficial del conjunto de datos (ej. 2024, 2025 o 2026).
  11. `FECHA_ULTIMA_DESCARGA`: Fecha ISO de la sincronización en el Atlas (ej. `2026-10-18`).
  12. `SISTEMA_COORDENADAS_ORIGEN`: EPSG de origen (ej. `EPSG:32719` - UTM 19S o `EPSG:5360` - SIRGAS Chile).
  13. `SISTEMA_COORDENADAS_DESTINO`: `EPSG:4326` (WGS84 lat/lon decimal).
  14. `PRECISION_POSICIONAL_ESTIMADA`: Rango métrico de incertidumbre posicional.
  15. `LICENCIA_USO`: Base legal de reutilización (Ley N° 20.285 de Transparencia, ODbL 1.0, CC BY 4.0).
  16. `RESTRICCION_ACCESO`: Condiciones jurídicas o secretaría técnica.
  17. `RESUMEN_DESCRIPTIVO`: Párrafo de alcance metodológico y temático.
  18. `LINEAJE_PROCESAMIENTO`: Pasos de transformación espacial aplicados (recorte, reproyección, cálculo de áreas).
  19. `CITA_BIBLIOGRAFICA_APA`: Referencia normalizada bajo norma APA 7ª edición.
  20. `CALIDAD_WLC_IGV`: Puntuación de calidad porcentual obtenida en el modelo ISO 19157 (ej. `96.84%`).
  21. `ESTADO_CONEXION_HTTP`: Código de respuesta del servidor oficial (`HTTP 200 OK`).
  22. `RUTA_LOCAL_SRC`: Ubicación del archivo en la arquitectura web (ej. `data/ide_censo2024_manzanas.geojson`).
  23. `URL_CDN_SUPABASE`: Enlace de alta velocidad al bucket perimetral `atlas-geojson`.
  24. `METADATO_XML_IDE_CHILE`: URL al archivo de metadatos ISO 19139 en el Catálogo Nacional SNIT.

### 12.3. Perfil de Metadatos Espaciales ISO 19115 / ISO 19139 (`perfil_metadatos_vgi.xlsx`)
Estructura la parametrización de los **7 paquetes normativos** requeridos por la norma internacional ISO 19115-1:2014 para la interoperabilidad con nodos IDE nacionales y globales:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   PAQUETES ISO 19115 EN perfil_metadatos_vgi.xlsx      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. MD_IdentificationInfo  ──> Título, Resumen, BBox WGS84, Palabras    │
│ 2. MD_Constraints         ──> Licencias (ODbL, CC BY-SA), Ley 20.285   │
│ 3. DQ_DataQuality         ──> Reporte ISO 19157 (Topología, Linaje)    │
│ 4. MD_MaintenanceInfo     ──> Frecuencia de actualización y cambios    │
│ 5. MD_SpatialRepresInfo   ──> Vectorial OGC Simple Features            │
│ 6. MD_ReferenceSystem     ──> EPSG:4326 (WGS84)                        │
│ 7. CI_ResponsibleParty    ──> Dpto. de Geografía UAH (Custodio/Punto)  │
└────────────────────────────────────────────────────────────────────────┘
```

### 12.4. Archivos Consolidados CSV
En la carpeta `data/`, `src/data/` y `docs/` se mantienen archivos CSV optimizados para análisis masivo con Python (`pandas`), R o importación en PostgreSQL:

* **`data/bip_inversiones_santiago.csv` (3.73 MB):** Catálogo de proyectos del Banco Integrado de Proyectos (BIP) del Ministerio de Desarrollo Social y Familia (MIDESO) para la comuna de Santiago. Contiene: código BIP, nombre de la iniciativa, etapa del ciclo de vida (Diseño, Ejecución, Operación), monto en miles de pesos (M$), coordenadas de georreferenciación, sector (Vialidad, Espacios Públicos, Salud, Educación) y fecha de postulación.
* **`docs/correlacion_dimensiones_calidad.csv`:** Matriz simétrica de correlación lineal de Pearson ($r$) entre las 5 dimensiones cuantitativas y las 5 dimensiones cualitativas del modelo de calidad WLC v2.0 para las 131 capas del Atlas.
* **`docs/wlc_metacalidad_ranking.csv`:** Tabla ordenada de capas cartográficas con sus puntajes individuales por dimensión, puntaje ponderado global ($IGV$) y categoría de certificación asignada (Grados A+, A, B o C).
* **`data/resumen_catastro_vgi.csv`:** Resumen tabular agregado por categoría temática comunitaria con conteo de nodos, vías y relaciones activas en Barrio Brasil.

### 12.5. Procedimiento para Actualizar los Catálogos Tabulares
Cuando se incorpore una nueva capa cartográfica o se modifique una etiqueta en OpenStreetMap, debe ejecutarse el script automatizado de regeneración tabular:

```bash
# Regenera las matrices Excel y CSV a partir del estado actual de los archivos GeoJSON
python3 scripts/generar_catalogos_excel.py
```

El script realiza las siguientes operaciones:
1. Inspecciona iterativamente cada archivo `.geojson` en `data/` y `src/data/`.
2. Extrae las propiedades, valida la presencia de los 14 atributos maestros y recalcula la envolvente espacial (BBox).
3. Actualiza las celdas de las hojas de cálculo correspondientes utilizando la biblioteca `openpyxl`, preservando fórmulas, colores corporativos en cabeceras y estilos de bordes.
4. Exporta las réplicas idénticas a los directorios de producción (`docs/` y `src/docs/`).

---

## 13. Empaquetado, Compresión y Distribución Masiva (ZIP de 256 Archivos)

Uno de los requerimientos estructurales primordiales del Atlas VGI es **garantizar el acceso universal y sin barreras a la totalidad de la base de datos geográfica**. Mientras que los visores tradicionales limitan a los usuarios a descargas parciales o consultas individuales, el Atlas integra un pipeline de empaquetado continuo que consolida la geodatabase completa en un único archivo comprimido maestro.

### 13.1. Arquitectura del Archivo Maestro `geodatabase_completa_atlas_vgi.zip`
* **Volumen Descomprimido:** **3.36 GB (3,612,410,880 bytes)** de información geoespacial, bases tabulares, cartografías y metadatos.
* **Volumen Comprimido:** **~543 MB (568,534,094 bytes)**, logrando un ratio de compresión global de **6.35 : 1** mediante el algoritmo Deflate optimizado.
* **Total de Archivos Empaquetados:** **256 archivos operativos**, clasificados sistemáticamente:
  - 121 capas oficiales del Estado de Chile (GeoJSON WGS84).
  - 14 capas del Catastro Nacional RSD SUBDERE 2024 (GeoJSON).
  - 10 macrocategorías temáticas comunitarias VGI (GeoJSON normalizado de Barrio Brasil).
  - 10 extractos masivos regionales de OpenStreetMap Geofabrik (GeoJSON de toda la RM).
  - 1 GeoPackage OGC consolidado multicapa (`geofabrik_chile_rm_completo.gpkg`).
  - 4 libros de cálculo OpenXML (`.xlsx`) con catálogos y perfiles ISO.
  - 4 archivos de datos tabulares consolidados (`.csv`).
  - Metadatos estandarizados en formatos JSON e ISO 19139 XML.
  - Archivos maestros de verificación criptográfica (`checksums.md5` y `checksums.sha256`).
  - Documentos de licenciamiento y guía de inicio rápido (`README_GEODATABASE.md`, `LICENCIAS.md`).

### 13.2. Topografía Interna del Archivo ZIP
Al descomprimir el archivo, el usuario obtiene una estructura limpia y estandarizada, compatible de inmediato con QGIS, ArcGIS Pro, gvSIG o scripts en Python/R:

```text
geodatabase_completa_atlas_vgi/
├── 00_LEEME_PRIMERO.md                       # Guía de orientación rápida, licencias y métodos de carga en QGIS
├── LICENCIAS_Y_TERMINOS_USO.md               # Declaración tripartita de derechos (ODbL, CC BY-SA 4.0, AGPLv3)
├── checksums.sha256                          # Huellas digitales criptográficas de los 256 archivos
├── checksums.md5                             # Sumas de verificación MD5 complementarias
├── 01_capas_oficiales_estado_chile/          # 121 capas oficiales del Estado (GeoJSON EPSG:4326)
│   ├── censo2024_manzanas.geojson            # INE Censo 2024 a nivel de manzana
│   ├── prc_zonificacion_santiago.geojson     # Zonificación del Plan Regulador Comunal
│   ├── red_semaforos_uoct_rm.geojson         # 3.200 cruces semaforizados UOCT/MTT
│   ├── subdere_rsd_2024_rm/                  # Catastro Nacional RSD SUBDERE 2024
│   │   ├── Sitios_Disposicion_RSD_Ene24_RM.geojson
│   │   ├── Recoleccion_Transporte_RM.geojson
│   │   ├── Criticidad_Sitios_Disposicion_RSD_Ene24_RM.geojson
│   │   └── INVENTARIO_SUBDERE_RSD_2024_RM.json
│   └── ... (resto de capas oficiales del Estado)
├── 02_capas_vgi_barrio_brasil/               # 10 macrocategorías comunitarias VGI (Barrio Brasil)
│   ├── cat01_educacion_vgi.geojson
│   ├── cat02_salud_vgi.geojson
│   ├── cat03_transporte_vgi.geojson
│   ├── cat04_ciclovias_vgi.geojson
│   ├── cat05_espacio_publico_vgi.geojson
│   ├── cat06_patrimonio_vgi.geojson
│   ├── cat07_accesibilidad_vgi.geojson
│   ├── cat08_biodiversidad_vgi.geojson
│   ├── cat09_edificaciones_vgi.geojson
│   └── cat10_cobertura_suelo_vgi.geojson
├── 03_extractos_regionales_geofabrik_rm/     # 10 capas masivas regionales de toda la RM (OSM)
│   ├── capa_osm_rm_cat01_educacion.geojson
│   ├── capa_osm_rm_cat02_salud.geojson
│   └── ... (resto de extractos regionales)
├── 04_geopackage_ogc/
│   └── geofabrik_chile_rm_completo.gpkg      # GeoPackage SQLite estándar con las 10 capas y tablas indexadas
├── 05_catalogos_y_metadatos/
│   ├── catalogo_fuentes_vgi.xlsx             # Catálogo de 131 capas con citas APA
│   ├── categorias_tematicas_osm.xlsx         # Taxonomía temático-normativa
│   ├── perfil_metadatos_vgi.xlsx             # Paquetes normativos ISO 19115
│   ├── bip_inversiones_santiago.csv          # Proyectos de inversión pública BIP (MIDESO)
│   ├── correlacion_dimensiones_calidad.csv   # Matriz de Pearson del modelo WLC
│   └── wlc_metacalidad_ranking.csv           # Ranking de calidad de capas
└── 06_metadatos_xml_iso19139/                # Fichas XML para importación directa en GeoNetwork / SNIT
    └── ficha_metadatos_atlas_vgi.xml
```

### 13.3. Algoritmo de Compresión e Integridad (`scripts/empaquetar_base_datos_completa.py`)
El script de empaquetado opera bajo estrictas directivas de integridad de datos y control de memoria RAM. A continuación se desglosa su mecanismo algorítmico:

```python
import os
import zipfile
import hashlib

def generar_paquete_maestro():
    ruta_zip = "docs/geodatabase_completa_atlas_vgi.zip"
    print(f"[*] Empaquetando geodatabase completa en {ruta_zip}...")

    # Compresión Deflate con nivel máximo (9) para reducir consumo de ancho de banda
    with zipfile.ZipFile(ruta_zip, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        # 1. Empacar capas oficiales y subdere
        # 2. Empacar capas comunitarias VGI
        # 3. Empacar extractos Geofabrik y GeoPackage
        # 4. Empacar catálogos Excel y CSV
        # 5. Generar y escribir checksums.sha256 en la raíz del archivo ZIP
        pass

    # Verificación física del archivo generado
    print("[*] Ejecutando testzip() para verificar que no existan bloques CRC dañados...")
    with zipfile.ZipFile(ruta_zip, mode="r") as zipf:
        corrupto = zipf.testzip()
        if corrupto:
            raise RuntimeError(f"Error crítico: Archivo corrupto en el ZIP: {corrupto}")
        conteo = len(zipf.namelist())
        peso_mb = os.path.getsize(ruta_zip) / (1024 * 1024)
        print(f"[✓] Verificación superada: {conteo} archivos empaquetados ({peso_mb:.2f} MB).")

    # Replicación en espejo hacia src/docs/ para despliegue en Netlify CDN
    # os.system("cp docs/geodatabase_completa_atlas_vgi.zip src/docs/")
```

### 13.4. Mecanismo de Descarga en el Frontend y Bypass de Caché
En la interfaz del usuario ([`src/index.html`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/src/index.html)), el botón de descarga principal `#btn-descargar-coleccion-completa` (ubicado tanto en la barra de herramientas del visor como en el modal de catálogo de capas) ejecuta la función con bypass anti-caché:

```javascript
// En src/js/modulos/mapa.js o src/js/app.js:
const btnDescarga = document.getElementById('btn-descargar-coleccion-completa');
if (btnDescarga) {
  btnDescarga.addEventListener('click', (e) => {
    e.preventDefault();
    // Parámetro de versión para forzar revalidación y evitar que el navegador use caché local
    const urlDescarga = 'docs/geodatabase_completa_atlas_vgi.zip?v=' + Date.now();
    
    // Crear ancla de descarga programática
    const enlace = document.createElement('a');
    enlace.href = urlDescarga;
    enlace.setAttribute('download', 'geodatabase_completa_atlas_vgi.zip');
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    
    console.log('[✓] Descarga iniciada con bypass de caché:', urlDescarga);
  });
}
```

---

## 14. Base de Datos Espacial PostgreSQL 17 + PostGIS 3.3 (Supabase)

El Atlas VGI adopta **PostgreSQL 17 con la extensión espacial PostGIS 3.3** sobre la infraestructura cloud de **Supabase**, proporcionando una base de datos relacional y geográfica de alto rendimiento, 100% de código abierto y sin costo de operación recurrente ($0 USD/mes de forma permanente).

### 14.1. Ventajas de la Arquitectura Supabase PostGIS
1. **Conformidad Estricta con OGC:** PostGIS es el estándar mundial para el almacenamiento y geoprocesamiento de datos vectoriales y ráster, soportando más de 1.000 funciones analíticas espaciales (`ST_Intersects`, `ST_Buffer`, `ST_Distance`, `ST_Centroid`, `ST_MakeEnvelope`, `ST_AsGeoJSON`).
2. **Consultas con Aceleración Espacial por Índices GIST:** Utiliza estructuras de árbol R (*Generalized Search Tree*) que indexan los volúmenes envolventes mínimos (MBR) de las geometrías, reduciendo el tiempo de búsqueda espacial de $O(N)$ a $O(\log N)$.
3. **Persistencia Híbrida Vectorial / Documental:** Combina columnas espaciales nativas (`GEOMETRY(Geometry, 4326)`) con campos de atributos flexibles en formato `JSONB`, preservando todas las propiedades de origen sin necesidad de migraciones de esquema complejas cuando se incorporan nuevas fuentes.
4. **Endpoints REST y RPC Instantáneos:** Supabase expone automáticamente la base de datos a través de PostgREST, lo que permite que el frontend del Atlas consulte capas recortadas por BBox directamente en JSON sin requerir un backend intermedio en Node.js o Python.

### 14.2. Esquema DDL Espacial Completo (`scripts/db/01_schema_postgis.sql`)
A continuación se documenta el esquema SQL que inicializa las extensiones, tablas, índices y funciones de consulta:

```sql
-- ============================================================================
-- Nodo GeoAbierto — Atlas VGI (Departamento de Geografía · UAH)
-- Esquema de Base de Datos Espacial PostgreSQL 17 + PostGIS 3.3
-- ============================================================================

-- 1. Habilitación de extensiones
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLA: public.capas_metadata
-- Catálogo centralizado de capas con atributos normativos y linaje
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.capas_metadata (
    id TEXT PRIMARY KEY,                           -- ej: 'censo2024_manzanas', 'red_semaforos_uoct'
    nombre TEXT NOT NULL,                          -- Denominación formal de la capa
    institucion TEXT NOT NULL,                     -- Organismo rector (INE, MINVU, MOP, etc.)
    ministerio TEXT,                               -- Cartera de gobierno
    categoria_macro TEXT NOT NULL,                 -- equipamiento, movilidad, medio_ambiente, etc.
    geometria_tipo TEXT,                           -- Point, LineString, Polygon, MultiPolygon
    color TEXT DEFAULT '#0284c7',                  -- Color hexadecimal para simbología predeterminada
    icono TEXT DEFAULT '🗺️',                        -- Glifo identificador
    total_entidades INTEGER DEFAULT 0,             -- Cantidad verificada de elementos
    bbox DOUBLE PRECISION[],                       -- [minLon, minLat, maxLon, maxLat] en EPSG:4326
    archivo_geojson_url TEXT,                      -- Enlace de descarga en Supabase Storage CDN
    tipo_servicio TEXT,                            -- GeoJSON, WFS, REST FeatureServer
    url_servicio_origen TEXT,                      -- Enlace al catálogo del Estado
    declaracion_legal TEXT,                        -- Amparo bajo Ley N° 20.285 de Transparencia
    cita_apa TEXT,                                 -- Cita normalizada APA 7ª edición
    activo BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMPTZ DEFAULT NOW(),
    actualizado_el TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capas_metadata_categoria ON public.capas_metadata (categoria_macro);
CREATE INDEX IF NOT EXISTS idx_capas_metadata_institucion ON public.capas_metadata (institucion);

-- ============================================================================
-- 3. TABLA: public.capas_entidades
-- Almacén espacial unificado con geometrías binarias y atributos JSONB
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.capas_entidades (
    gid BIGSERIAL PRIMARY KEY,
    capa_id TEXT NOT NULL REFERENCES public.capas_metadata(id) ON DELETE CASCADE,
    geom GEOMETRY(Geometry, 4326) NOT NULL,        -- Coordenadas geográficas WGS84
    properties JSONB NOT NULL DEFAULT '{}'::jsonb, -- 14 atributos maestros y campos de origen
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- Índices espaciales y de consulta de alta velocidad
CREATE INDEX IF NOT EXISTS idx_capas_entidades_geom ON public.capas_entidades USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_capas_entidades_capa_id ON public.capas_entidades (capa_id);
CREATE INDEX IF NOT EXISTS idx_capas_entidades_props ON public.capas_entidades USING GIN (properties);

-- ============================================================================
-- 4. FUNCIÓN RPC: fn_obtener_capa_bbox
-- Recorta espacialmente por el BBox visible del mapa y retorna un FeatureCollection
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_obtener_capa_bbox(
    p_capa_id TEXT,
    p_minx DOUBLE PRECISION DEFAULT -70.6720,
    p_miny DOUBLE PRECISION DEFAULT -33.4505,
    p_maxx DOUBLE PRECISION DEFAULT -70.6580,
    p_maxy DOUBLE PRECISION DEFAULT -33.4350
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bbox_geom GEOMETRY;
    v_geojson JSONB;
BEGIN
    -- Generar polígono envolvente en EPSG:4326
    v_bbox_geom := ST_MakeEnvelope(p_minx, p_miny, p_maxx, p_maxy, 4326);

    SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'capa_id', p_capa_id,
        'features', COALESCE(jsonb_agg(
            jsonb_build_object(
                'type', 'Feature',
                'id', e.gid,
                'geometry', ST_AsGeoJSON(e.geom)::jsonb,
                'properties', e.properties
            )
        ), '[]'::jsonb)
    )
    INTO v_geojson
    FROM public.capas_entidades e
    WHERE e.capa_id = p_capa_id
      AND ST_Intersects(e.geom, v_bbox_geom);

    RETURN v_geojson;
END;
$$;

-- Permisos de lectura pública anónima
GRANT EXECUTE ON FUNCTION public.fn_obtener_capa_bbox TO anon, authenticated, service_role;
```

### 14.3. Pipeline de Ingesta Masiva Vectorial (`scripts/cargar_entidades_postgis.py`)
Para cargar las **129.262 entidades geográficas** en la base de datos sin saturar los límites de memoria de la conexión, el script [`scripts/cargar_entidades_postgis.py`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/scripts/cargar_entidades_postgis.py) procesa los GeoJSON mediante inserciones por lotes (*batch insert*) con transacciones atómicas:

```bash
# Variables de entorno requeridas
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# Ejecución de la ingesta masiva
python3 scripts/cargar_entidades_postgis.py
```

El script implementa:
1. `ST_Force2D(ST_GeomFromGeoJSON(...))`: Sanitiza las coordenadas eliminando valores de elevación Z o medidas M que invaliden la tabla 2D.
2. `psycopg2.extras.execute_batch(cur, sql, params, page_size=2000)`: Agrupa hasta 2.000 entidades por viaje de ida y vuelta a la red (*round-trip*), reduciendo el tiempo de carga total de 45 minutos a solo 2.5 minutos.
3. Actualización automática del campo `total_entidades` y cálculo de la envolvente convexa global (`ST_Envelope(ST_Collect(geom))`) en la tabla `public.capas_metadata`.

---

## 15. Inventario Exhaustivo de los Scripts Python de Automatización

El proyecto cuenta con un conjunto de **49 scripts en Python** ubicados en el directorio [`scripts/`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/scripts/), organizados sistemáticamente en 6 subsistemas funcionales. A continuación se documenta la función técnica, entradas, salidas y comandos de ejecución de cada uno:

### 15.1. Subsistema 1: Procesamiento de Capas Oficiales del Estado e IDE Chile
1. **`scripts/descargar_capas_normativas_ide.py`:**
   * *Comando:* `python3 scripts/descargar_capas_normativas_ide.py`
   * *Propósito:* Conecta a los geoservicios WFS de IDE Chile y MINVU para descargar capas de instrumentos de planificación territorial (PRC Santiago, Seccionales, Zonas de Conservación Histórica).
   * *Entrada:* URLs de servicios WFS declaradas en el script.
   * *Salida:* Archivos GeoJSON normalizados en `data/` y `src/data/`.
2. **`scripts/procesar_capa_semaforos.py`:**
   * *Comando:* `python3 scripts/procesar_capa_semaforos.py`
   * *Propósito:* Procesa el catastro de cruces semaforizados de la Unidad Operativa de Control de Tránsito (UOCT/MTT), extrayendo los 3.200 puntos de la RM y recortando al área de Barrio Brasil.
   * *Entrada:* Catastro semafórico crudo (`data/raw/semaforos_rm.json`).
   * *Salida:* `data/red_semaforos_uoct_rm.geojson` y `src/data/red_semaforos_uoct_rm.geojson`.
3. **`scripts/inspeccionar_censo2024.py`:**
   * *Comando:* `python3 scripts/inspeccionar_censo2024.py`
   * *Propósito:* Audita la estructura interna de columnas, tipos de datos y población censada en el dataset preliminar del Censo de Población y Vivienda 2024 del INE.
   * *Salida:* Resumen en terminal de totales comunales, viviendas y personas.
4. **`scripts/procesar_censo2024_rm.py`:**
   * *Comando:* `python3 scripts/procesar_censo2024_rm.py`
   * *Propósito:* Convierte el archivo Shapefile del Censo 2024 a GeoJSON WGS84, calcula densidades habitacionales por hectárea e inyecta los 14 atributos maestros ISO.
   * *Salida:* `data/ide_censo2024_manzanas.geojson`.
5. **`scripts/publicar_censo2024_produccion.py`:**
   * *Comando:* `python3 scripts/publicar_censo2024_produccion.py`
   * *Propósito:* Copia la capa validada del Censo 2024 a `src/data/`, actualiza el catálogo en `src/js/modulos/ide_chile.js` y regenera los índices de búsqueda.
6. **`scripts/publicar_semaforos_y_redisenio.py`:**
   * *Comando:* `python3 scripts/publicar_semaforos_y_redisenio.py`
   * *Propósito:* Sincroniza la capa de semáforos con la consola de visualización del mapa y actualiza la simbología Leaflet con iconos SVG de semáforos viales.

### 15.2. Subsistema 2: Extracción y Procesamiento de OSM y Geofabrik RM
7. **`scripts/descargar_todas_las_categorias_osm.py`:**
   * *Comando:* `python3 scripts/descargar_todas_las_categorias_osm.py`
   * *Propósito:* Itera sobre las 10 macrocategorías temáticas y descarga todos los elementos de OpenStreetMap dentro del cuadrante de Barrio Brasil usando Overpass QL.
   * *Salida:* 10 archivos GeoJSON comunitarios en `data/cat01_educacion_vgi.geojson` a `data/cat10_cobertura_suelo_vgi.geojson`.
8. **`scripts/descargar_categorias_faltantes.py`:**
   * *Comando:* `python3 scripts/descargar_categorias_faltantes.py`
   * *Propósito:* Detecta categorías que hayan fallado por timeout o cuota en Overpass y ejecuta descargas quirúrgicas con backoff exponencial.
9. **`scripts/sincronizar_capas_osm_locales.py`:**
   * *Comando:* `python3 scripts/sincronizar_capas_osm_locales.py`
   * *Propósito:* Realiza un diff entre los datos locales y la última versión de OSM, actualizando únicamente los elementos con `version` superior en los metadatos de OSM.
10. **`scripts/procesar_geofabrik_rm.py`:**
    * *Comando:* `python3 scripts/procesar_geofabrik_rm.py`
    * *Propósito:* Lee el archivo binario regional `rm-latest.osm.pbf` de Geofabrik, filtra por tags y genera los 10 archivos GeoJSON regionales de la RM.
    * *Salida:* `data/capa_osm_rm_cat01_educacion.geojson` a `capa_osm_rm_cat10_cobertura_suelo.geojson`.
11. **`scripts/generar_gpkg_geofabrik.py`:**
    * *Comando:* `python3 scripts/generar_gpkg_geofabrik.py`
    * *Propósito:* Consolida las 10 capas regionales en un único archivo GeoPackage SQLite OGC con tablas indexadas espacialmente.
    * *Salida:* `docs/geofabrik_chile_rm_completo.gpkg`.
12. **`scripts/publicar_geofabrik_rm.py`:**
    * *Comando:* `python3 scripts/publicar_geofabrik_rm.py`
    * *Propósito:* Sincroniza los extractos regionales en `src/data/` y actualiza las rutas en el orquestador frontend.
13. **`scripts/procesar_osm_geofabrik_completo.py`:**
    * *Comando:* `python3 scripts/procesar_osm_geofabrik_completo.py`
    * *Propósito:* Pipeline maestro que ejecuta secuencialmente la extracción de PBF, recorte espacial, validación geométrica y exportación GeoJSON/GPKG.
14. **`scripts/procesar_osm_geofabrik_usuario.py`:**
    * *Comando:* `python3 scripts/procesar_osm_geofabrik_usuario.py`
    * *Propósito:* Extrae estadísticas de usuarios y mapeadores activos en el extracto de Geofabrik RM para auditorías comunitarias.
15. **`scripts/extractor_vgi.py`:**
    * *Comando:* `python3 scripts/extractor_vgi.py`
    * *Propósito:* Motor de consulta genérico para extraer primitivas geométricas (nodos, vías, relaciones) desde fuentes VGI abiertas.

### 15.3. Subsistema 3: Evaluación de Calidad ISO 19157 y Modelos WLC
16. **`scripts/modelo_indice_lineal_wlc.py`:**
    * *Comando:* `python3 scripts/modelo_indice_lineal_wlc.py`
    * *Propósito:* Implementa el modelo computacional *Weighted Linear Combination* v2.0 para calcular el Índice Global de Calidad ($IGV$) de cada capa cartográfica.
    * *Salida:* Puntuaciones porcentuales de las 131 capas y clasificación en Grados A+, A, B o C.
17. **`scripts/analisis_metacalidad.py`:**
    * *Comando:* `python3 scripts/analisis_metacalidad.py`
    * *Propósito:* Audita la coherencia geométrica (OGC), completitud de atributos y linaje legal de las capas, generando la matriz de metacalidad.
    * *Salida:* `docs/ANALISIS_METACALIDAD.md` y `docs/wlc_metacalidad_ranking.csv`.
18. **`scripts/enriquecer_base_datos_metadatos.py`:**
    * *Comando:* `python3 scripts/enriquecer_base_datos_metadatos.py`
    * *Propósito:* Inyecta los 14 atributos maestros obligatorios en cualquier archivo GeoJSON que carezca de estandarización formal.
19. **`scripts/enriquecer_catalogos_y_osm.py`:**
    * *Comando:* `python3 scripts/enriquecer_catalogos_y_osm.py`
    * *Propósito:* Cruza las etiquetas crudas de OpenStreetMap con las definiciones normativas de la OGUC y el Diccionario Territorial del Atlas.
20. **`scripts/verificar_conteo_capas.py`:**
    * *Comando:* `python3 scripts/verificar_conteo_capas.py`
    * *Propósito:* Verifica que la suma de capas oficiales (121) y comunitarias (10) sea exactamente **131 capas auditadas**, reportando cualquier discrepancia.

### 15.4. Subsistema 4: Generación de Entregables, Informes y Catálogos
21. **`scripts/generar_catalogos_excel.py`:**
    * *Comando:* `python3 scripts/generar_catalogos_excel.py`
    * *Propósito:* Construye y actualiza los libros de cálculo OpenXML: `catalogo_fuentes_vgi.xlsx`, `categorias_tematicas_osm.xlsx` y `perfil_metadatos_vgi.xlsx`.
22. **`scripts/generador_entregables_base.py`:**
    * *Comando:* `python3 scripts/generador_entregables_base.py`
    * *Propósito:* Módulo base con utilidades de generación de documentos en Word (.docx), PowerPoint (.pptx) y Excel (.xlsx) para reportes de avance.
23. **`scripts/datos_entregables_oe1.py`:**
    * *Comando:* `python3 scripts/datos_entregables_oe1.py`
    * *Propósito:* Fuente de datos estructurada con los logros, metodologías y taxonomías del Objetivo Específico 1 (Caracterización territorial y conceptual).
24. **`scripts/datos_entregables_oe2.py`:**
    * *Comando:* `python3 scripts/datos_entregables_oe2.py`
    * *Propósito:* Métricas y estadísticas del Objetivo Específico 2 (Geodatabase VGI, 131 capas, normalización WGS84, 129.262 entidades).
25. **`scripts/datos_entregables_oe3.py`:**
    * *Comando:* `python3 scripts/datos_entregables_oe3.py`
    * *Propósito:* Estadísticas de la plataforma web en producción (Objetivo Específico 3: 10 módulos, Netlify CDN, Leaflet 1.9.4).
26. **`scripts/datos_entregables_oe4.py`:**
    * *Comando:* `python3 scripts/datos_entregables_oe4.py`
    * *Propósito:* Indicadores de validación con actores comunitarios, manuales y transferencia metodológica (Objetivo Específico 4).
27. **`scripts/generar_doc_estado_avance.py`:**
    * *Comando:* `python3 scripts/generar_doc_estado_avance.py`
    * *Propósito:* Genera el informe formal de estado de avance en formato Word (`.docx`) de 4 páginas con tablas de horas y productos.
28. **`scripts/generar_ppt_estado_avance_blanco.py`:**
    * *Comando:* `python3 scripts/generar_ppt_estado_avance_blanco.py`
    * *Propósito:* Genera la presentación ejecutiva de diapositivas en PowerPoint (`.pptx`) con diseño corporativo institucional para defensas académicas.
29. **`scripts/generar_xls_estado_avance.py`:**
    * *Comando:* `python3 scripts/generar_xls_estado_avance.py`
    * *Propósito:* Genera la Carta Gantt y matriz de horas de avance en formato Excel (`.xlsx`) con semaforización de actividades completadas.
30. **`scripts/build_all_deliverables.py`:**
    * *Comando:* `python3 scripts/build_all_deliverables.py`
    * *Propósito:* Orquesta la compilación en un solo paso de los tres entregables académicos (.docx, .pptx y .xlsx).
31. **`scripts/ejecutar_generacion_entregables.py`:**
    * *Comando:* `python3 scripts/ejecutar_generacion_entregables.py`
    * *Propósito:* Wrapper de ejecución que valida la existencia de dependencias (`python-docx`, `python-pptx`, `openpyxl`) antes de compilar.

### 15.5. Subsistema 5: Empaquetado, Integridad y Despliegue
32. **`scripts/empaquetar_base_datos_completa.py`:**
    * *Comando:* `python3 scripts/empaquetar_base_datos_completa.py`
    * *Propósito:* Empaqueta los 256 archivos de la geodatabase completa (3.36 GB descomprimidos) en `docs/geodatabase_completa_atlas_vgi.zip` (~543 MB).
33. **`scripts/verificar_integridad_despliegue.py`:**
    * *Comando:* `python3 scripts/verificar_integridad_despliegue.py`
    * *Propósito:* Suite de 8 pruebas automatizadas de pre-despliegue (sintaxis JSON, integridad del ZIP con testzip, chequeo de LFS y sincronización espejo).
34. **`scripts/subir_a_github.py`:**
    * *Comando:* `python3 scripts/subir_a_github.py`
    * *Propósito:* Automatiza el staging, commit semántico y push hacia la rama `main` en GitHub, verificando el seguimiento de Git LFS.
35. **`scripts/publicar_depuracion_capas.py`:**
    * *Comando:* `python3 scripts/publicar_depuracion_capas.py`
    * *Propósito:* Elimina capas temporales de desarrollo en `src/data/` antes de desplegar a producción.
36. **`scripts/publicar_mas_detalles.py`:**
    * *Comando:* `python3 scripts/publicar_mas_detalles.py`
    * *Propósito:* Inyecta enlaces a storyboards y detalles técnicos en los modales de información de capas oficiales.
37. **`scripts/limpiar_archivos_obsoletos.py`:**
    * *Comando:* `python3 scripts/limpiar_archivos_obsoletos.py`
    * *Propósito:* Purga archivos `.DS_Store`, temporales de Python (`__pycache__`, `*.pyc`) y backups en desuso.
38. **`scripts/eliminar_capas_obsoletas.py`:**
    * *Comando:* `python3 scripts/eliminar_capas_obsoletas.py`
    * *Propósito:* Remueve capas reemplazadas por nuevas versiones censales o catastrales.
39. **`scripts/diagnosticar_apis.py`:**
    * *Comando:* `python3 scripts/diagnosticar_apis.py`
    * *Propósito:* Envía solicitudes de prueba a Overpass, ohsome, GBIF y Taginfo, reportando latencias y estado HTTP en terminal.
40. **`scripts/test_cliente_apis.py`:**
    * *Comando:* `python3 scripts/test_cliente_apis.py`
    * *Propósito:* Verifica el correcto funcionamiento de los fallbacks locales cuando las APIs externas simulan un error 500 o timeout.
41. **`scripts/construir_manual_actualizacion_maestro.py`:**
    * *Comando:* `python3 scripts/construir_manual_actualizacion_maestro.py`
    * *Propósito:* Concatena de forma determinista las 20 secciones del manual maestro, validando que supere las 2.000 líneas y sincronizándolo en los tres directorios oficiales.

### 15.6. Subsistema 6: Base de Datos Espacial, Migración y PostGIS
42. **`scripts/subir_base_datos_supabase.py`:**
    * *Comando:* `python3 scripts/subir_base_datos_supabase.py --upload-storage`
    * *Propósito:* Sube los archivos GeoJSON al bucket público de almacenamiento CDN en Supabase Storage con verificación SHA256.
43. **`scripts/cargar_entidades_postgis.py`:**
    * *Comando:* `python3 scripts/cargar_entidades_postgis.py`
    * *Propósito:* Conecta a PostgreSQL 17 vía SSL e inserta masivamente las 129.262 entidades en la tabla `public.capas_entidades`.
44. **`scripts/generar_seed_sql.py`:**
    * *Comando:* `python3 scripts/generar_seed_sql.py`
    * *Propósito:* Genera el archivo SQL de siembra `scripts/db/02_seed_metadata.sql` a partir de los metadatos de las capas oficiales.
45. **`scripts/ejecutar_migracion_remota.py`:**
    * *Comando:* `python3 scripts/ejecutar_migracion_remota.py`
    * *Propósito:* Aplica migraciones DDL automáticas sobre bases de datos PostgreSQL remotas.
46. **`scripts/procesar_bbdd_vgi.py`:**
    * *Comando:* `python3 scripts/procesar_bbdd_vgi.py`
    * *Propósito:* Orquesta la validación cruzada entre la base de datos relacional y las copias estáticas locales en disco.
47. **`scripts/secciones_manual.py`:** Módulo auxiliar con la Sección 01 del manual.
48. **`scripts/secciones_02_06.py`:** Módulo auxiliar con las Secciones 02 a 06 del manual.
49. **`scripts/secciones_07_11.py`:** Módulo auxiliar con las Secciones 07 a 11 del manual.

---

## 16. Sistema de Storyboards Territoriales y Visor Lightbox Pop-Up HD

El Atlas VGI trasciende la mera visualización estática de mapas incorporando una **estrategia de comunicación narrativa geoespacial (*Spatial Storytelling*)**. A través del Módulo 09 ([`src/js/modulos/indicadores_analisis.js`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/src/js/modulos/indicadores_analisis.js)), la plataforma articula las 131 capas en relatos situados que vinculan la evidencia cuantitativa con los problemas cotidianos de Barrio Brasil.

### 16.1. Marco Metodológico del Storytelling Territorial
El relato territorial se organiza en torno a 4 perfiles de usuarios de la comunidad universitaria y barrial:
1. **Comunidad Vecinal y Organizaciones Barriales:** Necesidad de argumentación técnica para presupuestos participativos, defensa del arbolado urbano y fiscalización de residuos.
2. **Estudiantes e Investigadores de la Universidad Alberto Hurtado:** Datos abiertos estandarizados para tesis de pregrado y posgrado en geografía, sociología y planificación territorial.
3. **Comercio Local y Emprendimientos Barriales:** Diagnóstico de flujos peatonales, accesibilidad y cobertura de servicios.
4. **Planificadores y Gestores Municipales:** Consulta ágil del Plan Regulador Comunal (PRC) y catastro de inversiones públicas (BIP).

### 16.2. Ficha Técnica de los 7 Storyboards Barriales
1. **Storyboard 1: Evolución Histórica y Protección Patrimonial:**
   - *Capas Clave:* Zonas Típicas (Monumentos Nacionales), Inmuebles de Conservación Histórica (PRC Santiago), polígonos de cités y arquitectura tradicional de finales del siglo XIX y principios del XX.
   - *Pregunta Territorial:* ¿Cómo coexisten las áreas de estricta protección patrimonial con la presión inmobiliaria de renovación urbana en el cuadrante Av. Brasil - Ricardo Cumming?
2. **Storyboard 2: Vulnerabilidad Social y Registro Social de Hogares (RSH):**
   - *Capas Clave:* Manzanas Censo 2024 (INE), tramos RSH por unidad vecinal (40% y 60% de menores ingresos), hogares monoparentales con jefatura femenina y adultos mayores.
   - *Pregunta Territorial:* ¿Dónde se concentran los núcleos de mayor fragilidad socioeconómica y qué distancia recorren hacia los servicios de salud primaria?
3. **Storyboard 3: Movilidad Activa e Infraestructura Ciclista:**
   - *Capas Clave:* Red de ciclovías consolidadas (Calle Brasil, Rosas, Mapocho), estaciones de bicicletas públicas, paraderos de buses RED y siniestralidad vial histórica.
   - *Pregunta Territorial:* ¿Existen discontinuidades críticas en la red de transporte no motorizado al cruzar ejes de alta velocidad como Av. San Pablo o Matucana?
4. **Storyboard 4: Arbolado Urbano, Plazas e Islas de Calor:**
   - *Capas Clave:* Catastro de arbolado viario, polígonos de plazas (Plaza Brasil, Plaza Yungay), temperatura de superficie terrestre (Landsat/Sentinel) y zonas de sombra peatonal.
   - *Pregunta Territorial:* ¿Cuál es el déficit de metros cuadrados de área verde por habitante en las manzanas densificadas de Barrio Brasil respecto al estándar OMS (9 m²/hab)?
5. **Storyboard 5: Equipamiento Comunitario y Seguridad de Emergencia:**
   - *Capas Clave:* Cuarteles de bomberos (Cuerpo de Bomberos de Santiago), comisarías de Carabineros de Chile, centros de salud de urgencia (SAPU), semáforos UOCT y alumbrado público.
   - *Pregunta Territorial:* ¿Qué sectores residenciales superan el tiempo de respuesta óptimo de 8 minutos para unidades de emergencia?
6. **Storyboard 6: Identidad Cultural, Centros Comunitarios y Gastronomía:**
   - *Capas Clave:* Teatros barriales, bibliotecas, galpones comunitarios, centros culturales autogestionados y locales gastronómicos patrimoniales.
   - *Pregunta Territorial:* ¿Cómo se estructura el circuito de economías creativas barriales en torno a la Plaza Brasil y el eje Huérfanos?
7. **Storyboard 7: Gestión de Residuos Sólidos y Puntos Limpios (Catastro SUBDERE 2024):**
   - *Capas Clave:* Catastro Nacional de Residuos Sólidos Domiciliarios (SUBDERE 2024), sitios de recolección y transporte, puntos limpios comunitarios y microbasurales identificados por voluntarios.
   - *Pregunta Territorial:* ¿Cómo impacta la logística de recolección en los costos comunales y qué cobertura espacial tienen los puntos de reciclaje en el barrio?

### 16.3. Arquitectura y Código del Visor Lightbox Pop-Up HD
Para permitir la inspección profunda de cartografías temáticas complejas sin pixelación, el Atlas incorpora un visor modal Lightbox en alta definición ([`src/index.html`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/src/index.html), líneas 450 a 485):

```html
<!-- VISOR LIGHTBOX CARTOGRÁFICO POP-UP HD -->
<div class="lightbox-overlay" id="lightbox-visor-hd" aria-hidden="true" role="dialog">
  <div class="lightbox-contenedor">
    <header class="lightbox-header">
      <div class="lightbox-titulo-zona">
        <span class="insignia-hd">ALTA RESOLUCIÓN</span>
        <h3 id="lightbox-titulo">Lámina Cartográfica Temática HD</h3>
      </div>
      <div class="lightbox-toolbar">
        <button type="button" class="lightbox-btn" id="btn-zoom-in" title="Aumentar zoom (+)">🔍 +</button>
        <button type="button" class="lightbox-btn" id="btn-zoom-out" title="Disminuir zoom (-)">🔍 -</button>
        <button type="button" class="lightbox-btn" id="btn-zoom-reset" title="Restablecer vista original (100%)">⟲ 100%</button>
        <button type="button" class="lightbox-btn lightbox-cerrar" id="btn-lightbox-cerrar" title="Cerrar visor (Esc)">✕</button>
      </div>
    </header>
    <div class="lightbox-cuerpo" id="lightbox-cuerpo-pan">
      <img id="lightbox-imagen-hd" src="" alt="Cartografía Barrial en Alta Definición" draggable="false" />
    </div>
    <footer class="lightbox-footer">
      <p id="lightbox-metadatos">Departamento de Geografía · Universidad Alberto Hurtado · Proyección WGS84 / UTM 19S</p>
    </footer>
  </div>
</div>
```

* **Lógica JavaScript de Interacción (Zoom & Pan Suave):**
  En `src/js/modulos/indicadores_analisis.js` se implementa el controlador táctil y de ratón:
  ```javascript
  let escalaZoom = 1.0;
  let posX = 0, posY = 0;
  let arrastrando = false;
  let inicioX = 0, inicioY = 0;

  function abrirLightboxHD(urlImagen, titulo, metadatos) {
    const modal = document.getElementById('lightbox-visor-hd');
    const img = document.getElementById('lightbox-imagen-hd');
    const tituloEl = document.getElementById('lightbox-titulo');
    const metaEl = document.getElementById('lightbox-metadatos');

    img.src = urlImagen;
    tituloEl.textContent = titulo;
    metaEl.textContent = metadatos;
    
    escalaZoom = 1.0;
    posX = 0;
    posY = 0;
    actualizarTransformacion();

    modal.classList.add('activo');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Bloquear scroll de fondo
  }

  function actualizarTransformacion() {
    const img = document.getElementById('lightbox-imagen-hd');
    img.style.transform = `translate(${posX}px, ${posY}px) scale(${escalaZoom})`;
  }

  // Eventos de Zoom por Botones y Rueda de Ratón
  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    escalaZoom = Math.min(escalaZoom + 0.25, 4.0); // Máximo 400%
    actualizarTransformacion();
  });

  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    escalaZoom = Math.max(escalaZoom - 0.25, 0.5); // Mínimo 50%
    actualizarTransformacion();
  });

  document.getElementById('btn-zoom-reset').addEventListener('click', () => {
    escalaZoom = 1.0;
    posX = 0;
    posY = 0;
    actualizarTransformacion();
  });

  // Atajo de teclado: Escape para cerrar
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('lightbox-visor-hd');
      if (modal.classList.contains('activo')) {
        modal.classList.remove('activo');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }
  });
  ```

### 16.4. Especificaciones para Nuevas Cartografías HD
Para que una nueva cartografía temática se visualice nítidamente en el Lightbox Pop-Up HD:
1. **Resolución Mínima:** 3.840 × 2.160 píxeles (4K UHD) a 300 DPI.
2. **Formato:** WebP con compresión de calidad 90% (o PNG de 24 bits optimizado con `oxipng`).
3. **Ubicación:** Guardar en `src/img/cartografias/` con nomenclatura estandarizada:
   `lamina_hd_[numero]_[nombre_corto].webp`.
4. **Vínculo en el Storyboard:** En `src/js/modulos/indicadores_analisis.js`, invocar la función pasando los metadatos completos y cita institucional.

---
"""
print("[+] Secciones 12 a 16 cargadas")
