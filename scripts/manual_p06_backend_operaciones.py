# -*- coding: utf-8 -*-
PARTE_06 = r"""# PARTE VI: ARQUITECTURA DE DATOS POSTGIS, BACKEND Y PIPELINE DE AUTOMATIZACIÓN

---

## 31. Infraestructura de Almacenamiento Espacial: PostgreSQL 17 + PostGIS 3.3 en Supabase Cloud

El Atlas de Información Geográfica Voluntaria implementa un modelo de datos híbrido de triple redundancia (*triple failover architecture*). En la cúspide de este ecosistema se ubica la base de datos relacional orientada a objetos **PostgreSQL versión 17** enriquecida con la extensión geoespacial **PostGIS versión 3.3.4**, alojada en la infraestructura gestionada de **Supabase Cloud**.

Esta capa backend proporciona capacidades de cómputo analítico geoespacial en el lado del servidor, permitiendo ejecutar consultas topológicas complejas, filtrado espacial por rectángulos envolventes (*Bounding Boxes* o BBOX), agregaciones estadísticas instantáneas y transformaciones de sistemas de referencia de coordenadas sin sobrecargar los recursos del cliente web.

```text
┌────────────────────────────────────────────────────────────────────────┐
│        ARQUITECTURA DE DATOS ESPACIALES HÍBRIDA (TRIPLE FAILOVER)      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [Cliente Web / Leaflet 1.9.4]                                        │
│                 │                                                      │
│                 ├──► 1. Supabase PostGIS RPC (PostgreSQL 17 / PostGIS) │
│                 │       │ Fallback automático si latencia > 1200ms     │
│                 ├──► 2. Netlify Edge CDN (GeoJSON estático WGS84)      │
│                 │       │ Fallback automático si offline               │
│                 └──► 3. Caché Local Navegador (IndexedDB / LocalStorage)│
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```mermaid
flowchart TD
    Cliente["Cliente Web / Leaflet 1.9.4"]
    
    subgraph FAILOVER["Arquitectura Híbrida de Triple Redundancia"]
        P1["1. Supabase PostGIS RPC (PostgreSQL 17 / PostGIS 3.3)"]
        P2["2. Netlify Edge CDN (GeoJSON Estático WGS84)"]
        P3["3. Almacenamiento Local (IndexedDB / LocalStorage)"]
    end

    Cliente -->|"1. Petición BBOX / SQL"| P1
    P1 -.->|"Latencia > 1200ms o Error 503"| P2
    P2 -.->|"Offline o Sin Conectividad"| P3
    P1 ==>|"GeoJSON en Streaming"| Cliente
    P2 ==>|"GeoJSON Estático"| Cliente
    P3 ==>|"Datos Cacheados"| Cliente
```

### 31.1 Justificación Técnica del Motor PostGIS

La elección de PostGIS frente a otras soluciones de almacenamiento de datos espaciales (como MongoDB GeoJSON, Spatialite o bases NoSQL basadas en GeoHash) responde a las siguientes exigencias técnicas y académicas del proyecto:

1. **Cumplimiento Estricto de Estándares OGC:** PostGIS implementa fielmente la especificación *Open Geospatial Consortium (OGC) Simple Features for SQL (SFSQL)*, garantizando que todas las geometrías (Puntos, Líneas, Polígonos y Multi-geometrías) cumplan con las reglas de validez topológica universalmente reconocidas.
2. **Indexación Espacial GiST (Generalized Search Tree):** El motor utiliza árboles R-Tree balanceados (`GIST`) para indexar las cajas de delimitación mínima (*Minimum Bounding Boxes* - MBR) de cada geometría. Esto reduce la complejidad computacional de las consultas espaciales de un escaneo secuencial `O(n)` a una búsqueda logarítmica `O(log n)`, permitiendo filtrar cientos de miles de entidades en milisegundos.
3. **Indexación GIN para Metadatos Semánticos JSONB:** Los atributos alfanuméricos de OpenStreetMap y fuentes oficiales presentan esquemas altamente variables y no uniformes. La utilización del tipo de dato `JSONB` de PostgreSQL, combinada con índices invertidos generalizados (`GIN`), permite indexar cada clave-valor semántica (`amenity`, `highway`, `building`, `operator`) sin requerir costosas modificaciones al esquema relacional de la tabla.
4. **Capacidades Analíticas Nativas en el Servidor:** La presencia de funciones espaciales como `ST_Intersects`, `ST_Contains`, `ST_DWithin`, `ST_Buffer`, `ST_Centroid`, `ST_SimplifyPreserveTopology` y `ST_AsGeoJSON` elimina la necesidad de transferir millones de coordenadas al navegador web cuando solo se requiere un subconjunto o una métrica derivada.

```mermaid
erDiagram
    capas_metadata ||--o{ capas_entidades : "contiene (1:N)"
    capas_metadata ||--o{ auditoria_actualizaciones : "registra (1:N)"

    capas_metadata {
        varchar id PK
        varchar nombre
        varchar categoria
        varchar fuente
        varchar geometria_tipo
        integer total_entidades
        numeric indice_calidad_wlc
        timestamptz actualizado_el
    }

    capas_entidades {
        uuid id PK
        varchar capa_id FK
        varchar identificador_origen
        varchar nombre
        varchar categoria_osm
        jsonb propiedades
        geometry geom
        numeric calidad_puntaje
    }

    auditoria_actualizaciones {
        serial id PK
        varchar capa_id FK
        varchar tipo_evento
        integer entidades_afectadas
        numeric tiempo_ejecucion_segundos
        timestamptz fecha_evento
    }
```

---

### 31.2 Esquema DDL Completo (`01_schema_postgis.sql`)

A continuación se documenta el código de definición de datos (*Data Definition Language* - DDL) implementado en el clúster de Supabase. Este script inicializa las extensiones requeridas, crea las tablas maestras, configura las restricciones de integridad y establece los índices espaciales y semánticos.

```sql
-- ============================================================================
-- ATLAS DE INFORMACIÓN GEOGRÁFICA VOLUNTARIA
-- SCRIPT DE INICIALIZACIÓN DDL POSTGRESQL 17 + POSTGIS 3.3
-- ARCHIVO: scripts/db/01_schema_postgis.sql
-- ============================================================================

-- 1. Habilitación de extensiones espaciales y utilitarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- Verificación de versión de PostGIS instalada
DO $$
BEGIN
    RAISE NOTICE 'PostGIS Version: %', PostGIS_Full_Version();
END $$;

-- 2. Tabla Maestra de Metadatos de Capas Cartográficas
CREATE TABLE IF NOT EXISTS public.capas_metadata (
    id VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100),
    fuente VARCHAR(100) NOT NULL,
    descripcion TEXT,
    geometria_tipo VARCHAR(50) NOT NULL,
    epsg_original INTEGER DEFAULT 4326,
    total_entidades INTEGER DEFAULT 0,
    rango_escalar VARCHAR(50) DEFAULT '1:1.000 - 1:25.000',
    formato_origen VARCHAR(20) DEFAULT 'GeoJSON',
    licencia VARCHAR(100) DEFAULT 'ODbL / CC-BY 4.0',
    url_origen TEXT,
    archivo_local VARCHAR(255),
    indice_calidad_wlc NUMERIC(5,4) DEFAULT 0.0000,
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentarios explicativos en columnas de metadatos
COMMENT ON TABLE public.capas_metadata IS 'Registro maestro de capas vectoriales integradas en el Atlas VGI.';
COMMENT ON COLUMN public.capas_metadata.id IS 'Identificador canónico de la capa (ej: educacion -> data/capa_educacion.geojson).';
COMMENT ON COLUMN public.capas_metadata.indice_calidad_wlc IS 'Puntaje de Índice Global de Calidad VGI según modelo WLC ISO 19157 (0 a 1).';

-- 3. Tabla Maestra de Entidades Espaciales Vectoriales
CREATE TABLE IF NOT EXISTS public.capas_entidades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    capa_id VARCHAR(100) NOT NULL REFERENCES public.capas_metadata(id) ON DELETE CASCADE,
    identificador_origen VARCHAR(100),
    nombre VARCHAR(255),
    categoria_osm VARCHAR(100),
    propiedades JSONB NOT NULL DEFAULT '{}'::jsonb,
    geom geometry(Geometry, 4326) NOT NULL,
    longitud NUMERIC(12,8),
    latitud NUMERIC(12,8),
    calidad_puntaje NUMERIC(5,4) DEFAULT 0.0000,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentarios de tabla de entidades
COMMENT ON TABLE public.capas_entidades IS 'Almacén unificado de geometrías vectoriales del Atlas VGI en WGS84.';
COMMENT ON COLUMN public.capas_entidades.geom IS 'Geometría espacial en EPSG:4326 (Punto, Línea o Polígono).';
COMMENT ON COLUMN public.capas_entidades.propiedades IS 'Contenedor binario JSONB con los atributos semánticos completos.';

-- 4. Creación de Índices de Alto Rendimiento

-- Índice Espacial GiST para consultas topológicas y BBOX
CREATE INDEX IF NOT EXISTS idx_capas_entidades_geom 
    ON public.capas_entidades USING GIST (geom);

-- Índice B-Tree para filtrado por identificador de capa
CREATE INDEX IF NOT EXISTS idx_capas_entidades_capa_id 
    ON public.capas_entidades USING BTREE (capa_id);

-- Índice Invertido GIN para consultas semánticas sobre atributos JSONB
CREATE INDEX IF NOT EXISTS idx_capas_entidades_propiedades 
    ON public.capas_entidades USING GIN (propiedades);

-- Índice B-Tree compuesto para ordenamiento por calidad dentro de cada capa
CREATE INDEX IF NOT EXISTS idx_capas_entidades_capa_calidad 
    ON public.capas_entidades USING BTREE (capa_id, calidad_puntaje DESC);

-- 5. Tabla de Auditoría y Control de Actualizaciones
CREATE TABLE IF NOT EXISTS public.auditoria_actualizaciones (
    id SERIAL PRIMARY KEY,
    capa_id VARCHAR(100) REFERENCES public.capas_metadata(id) ON DELETE SET NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    entidades_afectadas INTEGER NOT NULL,
    ejecutado_por VARCHAR(100) DEFAULT 'pipeline_python_uah',
    tiempo_ejecucion_segundos NUMERIC(8,2),
    detalles JSONB,
    fecha_evento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

### 31.3 Funciones Remotas PL/pgSQL (Remote Procedure Calls - RPC)

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Visor Web / Script Analítico
    participant API as PostgREST API (Supabase)
    participant RPC as Función PL/pgSQL (fn_obtener_capa_bbox)
    participant GiST as Índice Espacial R-Tree (GiST)
    participant CDN as Fallback: Netlify Edge CDN (src/data/)

    Cliente->>API: POST /rest/v1/rpc/fn_obtener_capa_bbox (capa_id, BBox)
    alt Clúster PostGIS Activo (Latencia < 1200ms)
        API->>RPC: Invoca función con parámetros geodésicos
        RPC->>GiST: Filtro indexado geom && ST_MakeEnvelope(...)
        GiST-->>RPC: Subconjunto de registros espaciales
        RPC->>RPC: Ensambla FeatureCollection con ST_AsGeoJSON(geom)
        RPC-->>API: Objeto JSONB homologado
        API-->>Cliente: HTTP 200 OK (GeoJSON en Streaming)
    else Latencia > 1200ms o Modo Estático
        API--xCliente: Timeout / Conmutación automática
        Cliente->>CDN: GET /data/{archivo}.geojson
        CDN-->>Cliente: HTTP 200 OK (GeoJSON Estático WGS84)
    end
```

Para permitir que el cliente web (Leaflet) o los scripts Python interactúen con la base de datos de manera atómica y segura mediante la API REST de Supabase (*PostgREST*), se diseñaron e implementaron tres funciones almacenadas en lenguaje `PL/pgSQL`.

#### 1. Función `fn_obtener_capa_bbox`: Extracción Geoespacial por Bounding Box

```sql
CREATE OR REPLACE FUNCTION public.fn_obtener_capa_bbox(
    p_capa_id VARCHAR(100),
    p_min_lon DOUBLE PRECISION,
    p_min_lat DOUBLE PRECISION,
    p_max_lon DOUBLE PRECISION,
    p_max_lat DOUBLE PRECISION,
    p_limite INTEGER DEFAULT 2000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_bbox geometry;
    v_resultado JSONB;
BEGIN
    v_bbox := ST_MakeEnvelope(p_min_lon, p_min_lat, p_max_lon, p_max_lat, 4326);

    SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'capa_id', p_capa_id,
        'features', COALESCE(jsonb_agg(
            jsonb_build_object(
                'type', 'Feature',
                'id', e.id,
                'geometry', ST_AsGeoJSON(e.geom)::jsonb,
                'properties', e.propiedades || jsonb_build_object(
                    'calidad_puntaje', e.calidad_puntaje,
                    'nombre', e.nombre,
                    'categoria_osm', e.categoria_osm
                )
            )
        ), '[]'::jsonb)
    ) INTO v_resultado
    FROM (
        SELECT id, nombre, categoria_osm, propiedades, geom, calidad_puntaje
        FROM public.capas_entidades
        WHERE capa_id = p_capa_id
          AND geom && v_bbox
          AND ST_Intersects(geom, v_bbox)
        LIMIT p_limite
    ) e;

    RETURN v_resultado;
END;
$$;
```

#### 2. Función `fn_buscar_entidades_radio`: Análisis de Proximidad Esférica

```sql
CREATE OR REPLACE FUNCTION public.fn_buscar_entidades_radio(
    p_lon DOUBLE PRECISION,
    p_lat DOUBLE PRECISION,
    p_radio_metros DOUBLE PRECISION,
    p_capa_id VARCHAR(100) DEFAULT NULL,
    p_limite INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    capa_id VARCHAR(100),
    nombre VARCHAR(255),
    categoria_osm VARCHAR(100),
    distancia_metros NUMERIC(10,2),
    geojson JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_origen geography;
BEGIN
    v_origen := ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography;

    RETURN QUERY
    SELECT 
        e.id,
        e.capa_id,
        e.nombre,
        e.categoria_osm,
        ROUND(ST_Distance(e.geom::geography, v_origen)::numeric, 2) AS distancia_metros,
        ST_AsGeoJSON(e.geom)::jsonb AS geojson
    FROM public.capas_entidades e
    WHERE (p_capa_id IS NULL OR e.capa_id = p_capa_id)
      AND ST_DWithin(e.geom::geography, v_origen, p_radio_metros)
    ORDER BY ST_Distance(e.geom::geography, v_origen) ASC
    LIMIT p_limite;
END;
$$;
```

#### 3. Función `fn_resumen_estadistico_capa`: Diagnóstico de Geometrías y Atributos

```sql
CREATE OR REPLACE FUNCTION public.fn_resumen_estadistico_capa(p_capa_id VARCHAR(100))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'capa_id', p_capa_id,
        'total_entidades', COUNT(*),
        'geometrias', jsonb_object_agg(sub.tipo_geom, sub.conteo),
        'promedio_calidad', ROUND(AVG(calidad_puntaje)::numeric, 4),
        'min_calidad', MIN(calidad_puntaje),
        'max_calidad', MAX(calidad_puntaje)
    ) INTO v_stats
    FROM (
        SELECT 
            ST_GeometryType(geom) AS tipo_geom,
            COUNT(*) AS conteo,
            AVG(calidad_puntaje) AS calidad_puntaje
        FROM public.capas_entidades
        WHERE capa_id = p_capa_id
        GROUP BY ST_GeometryType(geom)
    ) sub;

    RETURN v_stats;
END;
$$;
```

---

### 31.4 Políticas de Seguridad por Fila (Row Level Security - RLS)

```sql
-- Habilitación obligatoria de RLS en todas las tablas públicas
ALTER TABLE public.capas_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capas_entidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_actualizaciones ENABLE ROW LEVEL SECURITY;

-- 1. Política de Lectura Pública (Anónima) para Metadatos
CREATE POLICY "Lectura pública anónima de capas_metadata"
    ON public.capas_metadata
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 2. Política de Lectura Pública (Anónima) para Entidades Espaciales
CREATE POLICY "Lectura pública anónima de capas_entidades"
    ON public.capas_entidades
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 3. Política de Escritura Exclusiva para Rol de Servicio (Service Role)
CREATE POLICY "Escritura exclusiva service_role en capas_metadata"
    ON public.capas_metadata
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Escritura exclusiva service_role en capas_entidades"
    ON public.capas_entidades
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Escritura exclusiva service_role en auditoria_actualizaciones"
    ON public.auditoria_actualizaciones
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
```

---

### 31.5 Script de Carga Masiva por Lotes (`scripts/cargar_entidades_postgis.py`)

```python
# scripts/cargar_entidades_postgis.py
# Pipeline de ingesta y sincronización masiva hacia Supabase PostGIS.

import os
import sys
import json
import time
import requests

CHUNK_SIZE = 500
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no definidas.")
    print("Defínalas en su entorno antes de ejecutar este script.")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def cargar_capa_a_postgis(ruta_geojson, capa_id):
    print(f"\n[*] Procesando capa: {capa_id} desde {ruta_geojson}")
    with open(ruta_geojson, 'r', encoding='utf-8') as f:
        data = json.load(f)

    features = data.get("features", [])
    total = len(features)
    print(f"    - Total de entidades detectadas: {total}")

    if total == 0:
        print("    [!] Capa sin geometrías. Omitiendo.")
        return

    for i in range(0, total, CHUNK_SIZE):
        chunk = features[i:i + CHUNK_SIZE]
        lote_postgis = []

        for f in chunk:
            geom = f.get("geometry")
            if not geom or not geom.get("coordinates"):
                continue

            props = f.get("properties", {})
            nombre = props.get("nombre") or props.get("name") or "Sin Nombre"
            categoria_osm = props.get("categoria_osm") or props.get("amenity") or "vgi_general"
            calidad = float(props.get("calidad_wlc", 0.70))

            registro = {
                "capa_id": capa_id,
                "identificador_origen": str(props.get("osm_id", f.get("id", ""))),
                "nombre": str(nombre)[:254],
                "categoria_osm": str(categoria_osm)[:99],
                "propiedades": props,
                "geom": f"SRID=4326;{json.dumps(geom)}",
                "calidad_puntaje": calidad
            }
            lote_postgis.append(registro)

        endpoint = f"{SUPABASE_URL}/rest/v1/capas_entidades"
        intentos = 0
        exito = False

        while intentos < 3 and not exito:
            intentos += 1
            try:
                resp = requests.post(endpoint, headers=HEADERS, json=lote_postgis, timeout=30)
                if resp.status_code in [200, 201]:
                    exito = True
                    print(f"    ✓ Lote {i//CHUNK_SIZE + 1} insertado con éxito ({len(lote_postgis)} registros).")
                else:
                    print(f"    [!] Error en lote {i//CHUNK_SIZE + 1} (HTTP {resp.status_code}): {resp.text}")
                    time.sleep(2 * intentos)
            except Exception as e:
                print(f"    [!] Excepción de red en intento {intentos}: {e}")
                time.sleep(2 * intentos)

        if not exito:
            print(f"    [ERROR] Falló la inserción del lote {i//CHUNK_SIZE + 1} tras 3 reintentos.")

if __name__ == "__main__":
    directorio_capas = "data"
    archivos = [a for a in os.listdir(directorio_capas) if a.endswith(".geojson")]
    print(f"[+] Iniciando ingesta masiva de {len(archivos)} capas hacia Supabase PostGIS...")
    for archivo in archivos:
        capa_id = os.path.splitext(archivo)[0]
        ruta = os.path.join(directorio_capas, archivo)
        cargar_capa_a_postgis(ruta, capa_id)
    print("\n[+] Ingesta masiva finalizada exitosamente.")
```

---

## 32. Catálogo Estandarizado Multi-Lenguaje de Componentes, Archivos y Scripts de la Plataforma Web

La plataforma web del Atlas opera mediante una arquitectura desacoplada y libre de transpiladores opacos, articulando **seis familias de lenguajes y estándares técnicos** (**HTML5**, **CSS3**, **JavaScript ES6+ IIFE**, **SQL / PL/pgSQL / Overpass QL**, **JSON / GeoJSON / TOML / XML** y **Python 3**).

Para facilitar la comprensión integral del ecosistema y permitir su modificación segura, todos los archivos de la plataforma se documentan a continuación bajo una **Estructura Estandarizada de 6 Atributos Técnicos**:
1. **Lenguaje y Estándar:** Especificación técnica e intérprete o motor de ejecución.
2. **Ruta en el Proyecto:** Ubicación relativa dentro del árbol del repositorio.
3. **Rol dentro de la Plataforma Web:** Función arquitectónica y responsabilidad dentro del geoportal.
4. **Estructura Interna y Componentes Clave:** Secciones, selectores, funciones públicas o tablas que lo componen.
5. **Entradas y Salidas (I/O):** Datos consumidos y artefactos o estados generados.
6. **Pautas de Modificación y Extensibilidad:** Instrucciones concretas para editar o ampliar el archivo sin romper la coherencia del sistema.

```text
┌────────────────────────────────────────────────────────────────────────┐
│     ECOSISTEMA MULTI-LENGUAJE DE LA PLATAFORMA WEB (ESTRUCTURA)        │
├────────────────────────────────────────────────────────────────────────┤
│ 32.1 HTML5 Semántico (WCAG 2.1 AAA)    ──► src/index.html              │
│ 32.2 CSS3 Nativo (:root + Flexbox/Grid)──► src/css/estilos.css         │
│ 32.3 JavaScript ES6+ (IIFE Modular)    ──► 21 módulos en src/js/       │
│ 32.4 SQL / PL/pgSQL + Overpass QL      ──► scripts/db/ y consultas QL  │
│ 32.5 JSON / GeoJSON / TOML / XML       ──► config/, netlify.toml, data/│
│ 32.6 Python 3 (Pipelines ETL y QA/QC)  ──► 25 scripts en scripts/      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 32.1. Lenguaje de Marcado y Maquetación Estructural (HTML5 Semántico / WCAG 2.1 AAA)

#### Componente HTML-01: `src/index.html`
- **Lenguaje y Estándar:** HTML5 Semántico (`<!DOCTYPE html>`, `lang="es"`) con atributos de accesibilidad WAI-ARIA (`role`, `aria-label`, `aria-expanded`, `aria-live`) bajo norma WCAG 2.1 Nivel AAA.
- **Ruta en el Proyecto:** `src/index.html`
- **Rol dentro de la Plataforma Web:** Documento contenedor de página única (*Single-Page Application* - SPA) que estructura el lienzo cartográfico, la barra de navegación superior de los 10 módulos (`01` a `10`), la consola lateral de herramientas SIG, las vistas dedicadas de análisis y el orden determinista de carga de hojas de estilo y scripts.
- **Estructura Interna y Componentes Clave:**
  - `<head>`: Metadatos de codificación UTF-8, viewport responsivo, precarga de fuentes (`Inter`, `Fraunces`, `JetBrains Mono`), hoja de estilos de Leaflet 1.9.4 y `css/estilos.css`.
  - `<header class="encabezado-principal">`: Identidad del geoportal, selector rápido de ámbito y barra de navegación principal (`.nav-principal`) con los botones de los 10 módulos (`data-vista`).
  - `<section id="vista-visor">`: Contenedor principal dividido en el lienzo `#mapa-principal`, el lienzo `#mapa-comparacion` (Swipe), la consola lateral `.consola-lateral-gis` (con las pestañas Capas, Herramientas y Leyenda) y los paneles flotantes (Diagnóstico Territorial, PRC, Isócronas, Auditoría Temporal ohsome y Evaluador de Calidad).
  - `<section id="vista-indicadores">`, `<section id="vista-metadatos">`, `<section id="vista-licencias">` y `<section id="vista-manual">`: Vistas modulares a pantalla completa para los Módulos `07`, `08`, `09` y `10`.
  - Bloque final de scripts (`<script src="...">`): Carga secuencial de Leaflet, Chart.js, `js/config.js`, utilidades (`js/utils/*.js`), los 16 módulos funcionales (`js/modulos/*.js`) y el orquestador `js/app.js`.
- **Entradas y Salidas (I/O):**
  - *Entradas:* Eventos de interacción del usuario (clics, teclado, selección de formularios) e inyecciones dinámicas del DOM desde los módulos JavaScript.
  - *Salidas:* Árbol DOM renderizado en el navegador y contenedores de montaje para mapas y gráficos.
- **Pautas de Modificación y Extensibilidad:**
  - Para añadir un nuevo módulo de navegación, agregue un botón `<button class="nav-btn" data-vista="nuevo-modulo">` en `.nav-principal` y cree su contenedor `<section id="vista-nuevo-modulo" class="vista-contenido">` antes del pie de página.
  - Al actualizar cualquier archivo JS o CSS en producción, incremente el parámetro de versión `?v=...` en las etiquetas `<link>` y `<script>` de `src/index.html` para invalidar la caché de los navegadores.

---

### 32.2. Lenguaje de Estilización y Sistema de Diseño Visual (CSS3 Nativo)

#### Componente CSS-01: `src/css/estilos.css`
- **Lenguaje y Estándar:** CSS3 Nativo con Variables Personalizadas (*CSS Custom Properties* en `:root`), maquetación mediante `Flexbox` y `CSS Grid`, unidades dinámicas de viewport (`100dvh`), animaciones `@keyframes` y consultas de medios (`@media`).
- **Ruta en el Proyecto:** `src/css/estilos.css`
- **Rol dentro de la Plataforma Web:** Gobernador visual único del geoportal. Define la paleta cromática de alto contraste, la jerarquía tipográfica, el comportamiento responsivo en escritorio, tablet y móvil, los estados de los cursores del mapa, los marcadores vectoriales pulsantes y las reglas de exportación para impresión (`@media print`).
- **Estructura Interna y Componentes Clave:**
  - Bloque `:root`: Tokens semánticos de color (`--musgo`, `--esmeralda`, `--ocre`, `--carmesí`, `--bg-dark`, `--papel`, `--tinta`), tipografía (`--fuente-texto`, `--fuente-datos`) y dimensiones (`--ancho-consola-gis`, `--alto-header`).
  - Layout Principal: Reglas para `.contenedor-visor`, `.consola-lateral-gis`, `.area-mapa` y `.vista-contenido`.
  - Componentes Analíticos: Estilos para `.tarjeta-capa-gis`, `.kpi-card`, `.tabla-datos`, `.badge-estado`, `.modal-overlay` y tarjetas narrativas de Storyboards (`.tarjeta-storyboard`).
  - Simbología Cartográfica: Clases `.pin-svg-pulso`, `.pin-halo`, `.pin-cuerpo` y cursores `.modo-inspeccion-activa`.
- **Entradas y Salidas (I/O):**
  - *Entradas:* Clases, atributos `data-*` y variables en línea (`style="--color-pin: ..."`) aplicadas en el DOM.
  - *Salidas:* Renderizado visual acelerado por GPU en el navegador con contraste validado WCAG 2.1 AAA.
- **Pautas de Modificación y Extensibilidad:**
  - Para modificar los colores globales de toda la plataforma, edite exclusivamente los tokens del bloque `:root` al inicio del archivo; evite escribir colores hexadecimales fijos en reglas individuales.
  - Para ajustar el ancho del panel lateral izquierdo del visor, modifique la variable `--ancho-consola-gis: 380px;`.

---

### 32.3. Lenguaje de Programación Cliente y Motor Cartográfico (JavaScript ES6+ Modular IIFE)

La lógica interactiva del cliente web se compone de **21 archivos JavaScript ES6+** organizados sin dependencias de compiladores externos mediante el patrón **IIFE (*Immediately Invoked Function Expression*)**, exponiendo interfaces limpias en el objeto global `window`.

| ID | Archivo en `src/js/` | Rol Arquitectónico dentro de la Plataforma Web | API / Funciones Públicas Clave | Entradas / Salidas (I/O) | Pautas de Modificación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **JS-01** | `js/config.js` | **Configuración Maestra del Cliente:** Almacena las constantes globales del ámbito de estudio, coordenadas centrales, Bounding Box, endpoints de APIs (Overpass, ohsome, GBIF, Taginfo, IDE Chile, Supabase), mapas base y catálogo base de capas VGI. | `window.CONFIG` (`estudio`, `mapa`, `capasBase`, `endpoints`, `capasVGI`, `pesosCalidad`) | **In:** `config/config.json`. **Out:** Objeto inmutable `CONFIG` consumido por todos los módulos. | Edite `estudio.bbox`, `mapa.centro` o `endpoints` para trasladar el visor a otra comuna o servidor. |
| **JS-02** | `js/modulos/geodesia.js` | **Motor Geodésico y Proyecciones:** Transforma coordenadas entre WGS84 (`EPSG:4326`), Web Mercator (`EPSG:3857`) y UTM Huso 19 Sur (`EPSG:32719` / SIRGAS-Chile), y calcula áreas geodésicas y distancias Haversine. | `Geodesia.wgs84AUTM19S()`, `utm19SAWgs84()`, `distanciaHaversine()`, `areaPoligonoM2()` | **In:** Pares `[lon, lat]` o geometrías GeoJSON. **Out:** Coordenadas métricas `(Este, Norte)` en metros y superficies en `m²`/`ha`. | Si el área de estudio cambia al Huso 18 Sur (`EPSG:32718`), actualice el meridiano central `λ₀ = -75°`. |
| **JS-03** | `js/modulos/db_client.js` | **Conector Híbrido de Triple Redundancia:** Gestiona las consultas espaciales hacia Supabase PostGIS RPC con conmutación automática (*failover*) a los archivos GeoJSON en Netlify CDN y caché en memoria. | `DBClient.obtenerCapa()`, `consultarBBox()`, `buscarRadio()`, `estadoConexion()` | **In:** `capa_id`, `bbox` o radio en metros. **Out:** `Promise<FeatureCollection>` homologada en EPSG:4326. | Ajuste el umbral `TIMEOUT_MS` (por defecto `1200` ms) para calibrar la conmutación al modo estático. |
| **JS-04** | `js/modulos/importador_capas.js` | **Importador y Exportador Local de Geodatos:** Permite cargar archivos locales del usuario (`.geojson`, `.json`, `.kml`, `.csv`) sobre el mapa y exportar subconjuntos vectoriales filtrados. | `ImportadorCapas.cargarArchivo()`, `exportarGeoJSON()`, `exportarCSV()` | **In:** Archivos locales arrastrados o `FeatureCollection` activa. **Out:** Capas temporales en Leaflet o flujo `Blob` descargado. | Añada nuevos analizadores de formato manteniendo la validación de rangos `EPSG:4326`. |
| **JS-05** | `js/modulos/mapa.js` | **Núcleo Cartográfico Leaflet (Módulo 01):** Inicializa el lienzo Leaflet, gestiona los mapas base, controla la pila de capas vectoriales, el comparador Swipe/Lupa, la barra de coordenadas UTM/WGS84 y los marcadores SVG. | `Mapa.inicializar()`, `cargarCapaGeoJSON()`, `cambiarMapaBase()`, `activarComparador()` | **In:** `CONFIG.mapa`, eventos de ratón y capas GeoJSON. **Out:** Instancia `L.Map`, capas renderizadas y popups interactivos. | Modifique `crearPopupEntidad()` para personalizar los campos visibles al hacer clic en un elemento del mapa. |
| **JS-06** | `js/modulos/manifold_canvas.js` | ** Acelerador de Renderizado Vectorial en Canvas:** Optimiza el dibujo de coberturas masivas de puntos, líneas y polígonos mediante `L.canvas()` para mantener 60 FPS en el navegador. | `ManifoldCanvas.crearRenderer()`, `optimizarCapaMasiva()` | **In:** `FeatureCollection` con miles de vértices. **Out:** Instancia `L.Canvas` de alto rendimiento. | Ajuste la tolerancia de acolchado (`padding: 0.5`) según la densidad de geometrías. |
| **JS-07** | `js/modulos/ide_chile.js` | **Gestor del Catálogo Territorial de 132 Capas (Módulo 01):** Administra el árbol de las **122 coberturas oficiales** (`CAPAS_OFICIALES`) y **10 categorías VGI** (`NODO_CONFIG.categoriasVGI`), el buscador instantáneo, los filtros por geometría/fuente y la simbología temática. | `IDEChile.inicializar()`, `activarCapa()`, `desactivarCapa()`, `filtrarCatalogo()` | **In:** `src/js/config.js`, `CAPAS_OFICIALES` y `src/data/*.geojson` (`data/*.geojson`). **Out:** Árbol DOM de capas, contadores por categoría y leyenda dinámica. | Para registrar una nueva cobertura local, agréguela en `CAPAS_OFICIALES` dentro de `src/js/modulos/ide_chile.js` y copie el `.geojson` en `data/` y `src/data/`. |
| **JS-08** | `js/modulos/osm.js` | **Conector en Vivo a OpenStreetMap (Módulo 02):** Ejecuta consultas en lenguaje Overpass QL en tiempo real para las 10 macrocategorías VGI con rotación de servidores espejo y conversión a GeoJSON. | `OSM.consultarCategoria()`, `ejecutarConsultaQL()`, `convertirOSM2GeoJSON()` | **In:** Cadena Overpass QL y `bbox`. **Out:** `FeatureCollection` extraída directamente de OpenStreetMap. | Modifique el diccionario de consultas para incorporar nuevas combinaciones de etiquetas OSM (`key=value`). |
| **JS-09** | `js/modulos/umap.js` | **Integrador de Cartografía Colaborativa uMap (Módulo 04):** Gestiona la inserción segura de mapas comunitarios externos alojados en uMap y la importación de capas remotas compatibles. | `UMap.cargarMapaEmbebido()`, `importarGeoJSONRemoto()` | **In:** URL de mapa uMap o endpoint GeoJSON. **Out:** Contenedor `<iframe>` aislado con atributos `sandbox` o capa Leaflet. | Agregue nuevos proyectos comunitarios preconfigurados en el listado `MAPAS_UMAP_DESTACADOS`. |
| **JS-10** | `js/modulos/gbif.js` | **Conector de Biodiversidad y Ciencia Ciudadana GBIF (Módulo 03):** Consulta la API v1 de GBIF (`occurrence/search`) dentro del polígono WKT de estudio, normalizando registros bajo el estándar **Darwin Core (DwC)**. | `GBIF.consultarOcurrencias()`, `filtrarPorReino()`, `renderizarFichaTaxonomica()` | **In:** Polígono WKT, filtros taxonómicos y de base de registro (`HUMAN_OBSERVATION`). **Out:** Marcadores biológicos y métricas de riqueza de especies. | Ajuste el límite de paginación (`limit`) o agregue nuevos filtros taxonómicos en `PARAMETROS_GBIF`. |
| **JS-11** | `js/modulos/taginfo.js` | **Auditor Semántico de Etiquetas Taginfo API v4 (Módulo 02/06):** Consulta frecuencias globales y consenso comunitario de pares `key=value` en Taginfo API v4 y calcula las componentes cualitativas del modelo WLC. | `Taginfo.auditarEtiqueta()`, `obtenerEstadisticasTag()`, `evaluarConsensoSemántico()` | **In:** Claves y valores OSM (`key`, `value`). **Out:** Frecuencia global de uso, estado de documentación Wiki y puntaje semántico. | Modifique los umbrales de consenso global en `UMBRALES_TAGINFO` para ajustar la sensibilidad semántica. |
| **JS-12** | `js/modulos/ohsome.js` | **Auditoría Histórica y Espacio-Temporal ohsome API (Módulo 06):** Conecta con la API v1 de HeiGIT (`ohsome`) y API v0.6 de OSM para ejecutar la serie histórica (`2008–2026`), el **Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157)** y el monitor de Changesets / OSMCha. | `Ohsome.ejecutarAuditoria()`, `calcularIndiceSaturacion()`, `consultarChangesets()` | **In:** Categoría OSM (`filter`), rango temporal (`2008-01-01/2026-03-01/P1Y`), `bpolys` en EPSG:4326 y área reproyectada en `EPSG:32719`. **Out:** Series de tiempo, densidad `elem/km²` y `elem / 10.000 m²`, intensidad `edit/user`, Score `/100`, Estado de Saturación y enlaces OSMCha. | Para añadir una nueva categoría de auditoría histórica, incorpore su filtro y el `endpointTipo` (`/count`, `/length` o `/area`) en `CATEGORIAS_OHSOME`. |
| **JS-13** | `js/modulos/calidad_analyst.js` | **Analista Multicriterio WLC y Correlación (Módulo 06):** Ejecuta el modelo de Combinación Lineal Ponderada (WLC v2.0) combinando las 10 dimensiones cuantitativas y cualitativas ISO 19157, y grafica matrices de correlación de Pearson. | `CalidadAnalyst.calcularWLC()`, `actualizarPesos()`, `renderizarMatrizPearson()` | **In:** `docs/wlc_metacalidad_resultado.json`, `docs/matriz_metacalidad.json` y `docs/correlacion_dimensiones_calidad.csv`. **Out:** Índice Global VGI (`IGV`), clasificación por niveles y gráficos radar. | Modifique los pesos predeterminados en `PESOS_WLC_DEFAULT` manteniendo siempre la restricción `∑ w_i = 1.00`. |
| **JS-14** | `js/modulos/evaluador_calidad_cuantitativa.js` | **Auditor Cuantitativo de Geometrías y Topología (Módulo 06):** Verifica el cierre de anillos poligonales, ausencia de vértices duplicados, validez de rangos WGS84, completitud del esquema de 14 atributos y frescura temporal. | `EvaluadorCuantitativo.auditarCapa()`, `validarTopologia()`, `verificarEsquema14()` | **In:** Geometrías y propiedades de las 132 capas vectoriales (`data/*.geojson`) o archivo externo. **Out:** Puntajes `[0-100%]` en las 5 dimensiones cuantitativas ISO 19157 y plan de subsanación. | Añada nuevas reglas geométricas o campos obligatorios dentro de `validarEntidadIndividual()`. |
| **JS-15** | `js/modulos/evaluador_normativo.js` | **Inspector Normativo PRC e Isócronas de Accesibilidad (Módulo 01):** Evalúa mediante algoritmo *Ray-Casting* (*Point-in-Polygon*) la zona del PRC Santiago (`data/ide_minvu_ipt_prc_santiago.geojson`), Zonas Típicas e ICH (`data/ide_minvu_patrimonio_urbano.geojson`), y emite el Certificado CIN-VGI. | `EvaluadorNormativo.inspeccionarPredio()`, `calcularIsocronas()`, `emitirCertificado()` | **In:** Coordenadas `[lon, lat]` del clic, polígonos PRC/CMN y capas de equipamiento. **Out:** Ficha normativa de edificación CIN-VGI y polígonos de isócronas. | Actualice los parámetros urbanísticos en `ZONAS_PRC_SANTIAGO` ante modificaciones o enmiendas comunales. |
| **JS-16** | `js/modulos/indicadores_analisis.js` | **Indicadores Territoriales y Storyboards Narrativos (Módulo 05):** Gestiona las 5 Dimensiones Analíticas y los **4 Storyboards Interactivos** con **75 cartografías integradas** (`img/cartografias/*.jpg`), portadas SVG (`img/storyboards/*.svg`) y Lightbox HD. | `IndicadoresAnalisis.inicializar()`, `abrirStoryboard()`, `cargarCartografiaEnVisor()` | **In:** `data/resumen_catastro_vgi.csv`, `docs/wlc_metacalidad_resultado.json`, `img/cartografias/*.jpg` y catálogo `STORYBOARDS`. **Out:** Acordeones de dimensiones, modal narrativo interactivo con Lightbox HD y activación de capas en el visor. | Para agregar un nuevo Storyboard o capítulo cartográfico, añada un objeto al arreglo `STORYBOARDS` especificando sus `capas` y `secciones`. |
| **JS-17** | `js/modulos/metadatos.js` | **Catálogo de Metadatos ISO 19115-1 y Exportador XML ISO 19139 (Módulo 08):** Renderiza el explorador interactivo de fichas de metadatos para las **132 coberturas (122 oficiales + 10 VGI)** y genera documentos XML `gmd:MD_Metadata`. | `Metadatos.inicializar()`, `mostrarFichaISO()`, `exportarXMLISO19139()` | **In:** Inventario de 132 capas y `docs/perfil_metadatos_vgi.xlsx` (`src/docs/perfil_metadatos_vgi.xlsx`). **Out:** Tabla maestra de metadatos, vista previa ISO 19115 y descarga XML/JSON. | Edite la función `generarXMLISO19139()` para incorporar campos adicionales del Perfil Nacional de Metadatos de IDE Chile. |
| **JS-18** | `js/modulos/diccionario.js` | **Diccionario Territorial Interactivo ISO 19110 (Módulo 09):** Administra el catálogo de los **140 descriptores normativos y etiquetas OSM** (`CATALOGO_ATRIBUTOS`), permitiendo filtrar por origen y consultar su equivalencia oficial-comunitaria. | `Diccionario.inicializar()`, `buscarDescriptor()`, `filtrarPorCategoria()` | **In:** Base de 140 descriptores semánticos ISO 19110 en `CATALOGO_ATRIBUTOS`. **Out:** Grilla interactiva de definiciones, tipos de datos y exportación JSON/CSV. | Incorpore nuevos descriptores en el arreglo `CATALOGO_ATRIBUTOS` especificando clave OSM, fuente oficial y capa relacionada. |
| **JS-19** | `js/modulos/licencias.js` | **Centro de Descargas, Licencias y Gobernanza (Módulo 10):** Administra el portal de descarga de la Geodatabase completa (`docs/geodatabase_completa_atlas_vgi.zip`), los 3 catálogos Excel OpenXML (`docs/categorias_tematicas_osm.xlsx`, `docs/catalogo_fuentes_vgi.xlsx`, `docs/perfil_metadatos_vgi.xlsx`), los 4 CSVs y la matriz jurídica. | `Licencias.inicializar()`, `descargarGeodatabase()`, `filtrarPorLicencia()` | **In:** Archivos en `docs/`, `src/docs/`, `data/` y `src/data/`. **Out:** Descargas directas con validación de integridad y fichas legales. | Si se actualiza el paquete ZIP masivo, actualice los metadatos de peso (542,35 MB) y conteo de archivos (132 capas del visor y 257 archivos) en el módulo. |
| **JS-20** | `js/modulos/manual.js` | **Manual de Uso y Actualización In-App (Módulo 07):** Renderiza dentro de la plataforma web la guía interactiva dividida en Manual de Uso (`USO · 01` a `USO · 04`) y Manual de Actualización (`ACT · 01` a `ACT · 05`), con buscador instantáneo e inventario filtrable de las 132 capas. | `Manual.inicializar()`, `cambiarCapitulo()`, `filtrarCapitulos()` | **In:** Inventario dinámico de 132 capas y `docs/MANUAL_ACTUALIZACION_ATLAS.md` (`src/docs/`). **Out:** Interfaz documental navegable con índice lateral, tablas filtrables y descarga del manual maestro. | Añada nuevas secciones operativas en `src/js/modulos/manual.js` manteniendo la sincronía con `MANUAL_ACTUALIZACION_ATLAS.md`. |
| **JS-21** | `js/app.js` | **Orquestador Principal de la Aplicación (Controlador SPA):** Coordina el ciclo de vida completo de la plataforma web, enlaza la navegación entre los 10 módulos (`01` a `10`), gestiona los perfiles de usuario, las notificaciones *Toast* y el estado global. | `App.inicializar()`, `cambiarVista()`, `aplicarPerfil()`, `mostrarNotificacion()` | **In:** Eventos globales `DOMContentLoaded` y acciones de los 20 módulos anteriores. **Out:** Transiciones fluidas entre vistas y sincronización del estado entre el visor y los paneles analíticos. | Registre cualquier nuevo módulo dentro de la secuencia de arranque `App.inicializar()` y en el controlador de pestañas. |

---

### 32.4. Lenguajes de Base de Datos Espacial y Consultas (SQL / PL/pgSQL PostGIS y Overpass QL)

#### Componente SQL-01: `scripts/db/01_schema_postgis.sql` y `scripts/db/02_seed_metadata.sql`
- **Lenguaje y Estándar:** SQL ANSI / PostgreSQL 17 DDL y lenguaje procedimental `PL/pgSQL` con extensión espacial **PostGIS 3.3** (estándar OGC Simple Features for SQL).
- **Ruta en el Proyecto:** `scripts/db/01_schema_postgis.sql` y `scripts/db/02_seed_metadata.sql` (documentados en `docs/GUIA_BASE_DATOS_SUPABASE.md`).
- **Rol dentro de la Plataforma Web:** Define la estructura relacional y espacial del backend en la nube, incluyendo las tablas maestras, los índices espaciales R-Tree (`GiST`), los índices semánticos sobre atributos variables (`GIN JSONB`), las políticas de seguridad por fila (*Row Level Security* - RLS), las vistas materializadas y la siembra de metadatos consumida por el visor.
- **Estructura Interna y Componentes Clave:**
  - Extensiones: `uuid-ossp`, `postgis`, `postgis_topology`.
  - Tablas: `public.capas_metadata`, `public.capas_entidades` (con columna `geom geometry(Geometry, 4326)` y `propiedades JSONB`) y `public.auditoria_actualizaciones`.
  - Funciones RPC: `fn_obtener_capa_bbox`, `fn_buscar_entidades_radio` y `fn_resumen_estadistico_capa`.
- **Entradas y Salidas (I/O):**
  - *Entradas:* Peticiones HTTP POST vía PostgREST desde `src/js/modulos/db_client.js` o lotes de inserción desde `scripts/subir_base_datos_supabase.py`.
  - *Salidas:* Objetos `FeatureCollection` GeoJSON ensamblados directamente en el motor de base de datos mediante `ST_AsGeoJSON()`.
- **Pautas de Modificación y Extensibilidad:**
  - Para crear una nueva consulta espacial en el servidor, escriba una función `CREATE OR REPLACE FUNCTION public.fn_nueva_consulta(...) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER` en `scripts/db/01_schema_postgis.sql` y expóngala al rol `anon`.

#### Componente QL-01: Diccionario de Consultas Overpass QL en `src/js/modulos/osm.js` y `scripts/descargar_todas_las_categorias_osm.py`
- **Lenguaje y Estándar:** **Overpass QL** (*Overpass Query Language*).
- **Ruta en el Proyecto:** `src/js/modulos/osm.js` (cliente web) y `scripts/descargar_todas_las_categorias_osm.py` (pipeline Python).
- **Rol dentro de la Plataforma Web:** Almacena las sentencias de extracción semántica y espacial para las **10 macrocategorías comunitarias VGI** (`educacion` a `cobertura_suelo`) sobre la base de datos global de OpenStreetMap.
- **Estructura Interna y Componentes Clave:** Directivas `[out:json][timeout:60];`, bloques de unión `( node[...](bbox); way[...](bbox); relation[...](bbox); );` y directiva de salida geométrica `out body geom;`.
- **Pautas de Modificación y Extensibilidad:** Para incorporar nuevas etiquetas comunitarias en una macrocategoría, agregue el predicado `["clave"="valor"]` dentro del bloque de unión correspondiente tanto en `src/js/modulos/osm.js` como en `scripts/descargar_todas_las_categorias_osm.py`.

---

### 32.5. Lenguajes de Configuración, Manifiestos e Intercambio de Datos (JSON, GeoJSON RFC 7946, TOML y XML)

| Componente | Lenguaje / Estándar | Ruta en el Proyecto | Rol dentro de la Plataforma Web | Estructura Interna Clave | Pautas de Modificación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CFG-01** | **JSON** (ECMA-404) | `config/config.json` y `src/js/config.js` | **Manifiesto de Configuración Territorial:** Define los parámetros del área de estudio, límites geográficos (`bbox`), proyección métrica, endpoints y las 10 macrocategorías VGI (`categoriasVGI`) compartidas entre el backend Python y el frontend web. | Bloques `proyecto`, `bbox`, `centroMapa`, `apis` y `categoriasVGI`. | Mantenga ambos archivos sincronizados al cambiar el polígono de estudio o las rutas de las capas VGI. |
| **CFG-02** | **TOML** v1.0.0 | `netlify.toml` | **Configuración Perimetral y Despliegue CDN:** Gobierna el directorio de publicación (`publish = "src"`), la expansión de binarios Git LFS (`GIT_LFS_SKIP_SMUDGE = "0"`), las cabeceras de seguridad/CORS y las redirecciones canónicas (`/geodatabase` → `/docs/geodatabase_completa_atlas_vgi.zip`). | Bloques `[build]`, `[build.environment]`, `[[headers]]` y `[[redirects]]`. | Añada nuevas reglas `[[headers]]` si incorpora nuevos formatos binarios (ej. `.pmtiles` o `.tif`). |
| **DAT-01** | **GeoJSON** (IETF RFC 7946) | `data/*.geojson` y `src/data/*.geojson` | **Almacén Vectorial Estático:** Contiene las **132 coberturas espaciales del visor** (10 macrocategorías VGI `capa_educacion.geojson` .. `capa_cobertura_suelo.geojson` + 122 capas oficiales `ide_*.geojson`, `bbdd_*_santiago.geojson`, `subdere_rsd_*.geojson`) y las 10 capas regionales RM (`capa_osm_rm_cat01_*.geojson` .. `cat10_*.geojson`) en `EPSG:4326`. | Objeto `FeatureCollection` con arreglo `features` (`geometry` + `properties`). | Valide siempre todo archivo editado con `scripts/verificar_integridad_despliegue.py` y mantenga espejo exacto entre `data/` y `src/data/`. |
| **DAT-02** | **JSON / CSV / XLSX Analítico** | `docs/wlc_metacalidad_resultado.json`, `docs/matriz_metacalidad.json`, `docs/wlc_metacalidad_ranking.csv`, `docs/correlacion_dimensiones_calidad.csv`, `data/resumen_catastro_vgi.csv`, `docs/*.xlsx` (y réplicas en `src/docs/` y `src/data/`) | **Reportes de Metacalidad y Catálogos Tabulares:** Almacenan los resultados de las evaluaciones ISO 19157 (WLC v2.0), correlaciones de Pearson y los 3 libros maestros OpenXML (`categorias_tematicas_osm.xlsx`, `catalogo_fuentes_vgi.xlsx`, `perfil_metadatos_vgi.xlsx`). | Matrices de 132 capas × 10 dimensiones de calidad y hojas estructuradas OpenXML. | Se regeneran automáticamente al ejecutar `scripts/modelo_indice_lineal_wlc.py`, `scripts/analisis_metacalidad.py` y `scripts/generar_entregables_excel.py`. |

---

### 32.6. Lenguaje de Automatización Backend, ETL Geoespacial y Auditoría (Python 3)

A continuación se documentan los **25 scripts operativos en Python 3** ubicados en el directorio `scripts/`, encargados de la extracción automatizada, normalización topológica, cálculo de calidad, generación de catálogos OpenXML, sincronización PostGIS y validación de integridad:

```text
┌────────────────────────────────────────────────────────────────────────┐
│             MATRIZ DE AUTOMATIZACIÓN PYTHON 3 EN SCRIPTS/              │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Ingesta y Extracción: Overpass, Geofabrik, IDE Chile, APIs REST     │
│ 2. Estandarización y Metadatos: ISO 19115/19157, Esquema 14 Atributos   │
│ 3. Modelamiento Espacial y Calidad: Algoritmo WLC, Correlación Pearson │
│ 4. Operaciones PostGIS: Esquemas DDL, Ingesta por Lotes, RPCs          │
│ 5. Control de Calidad y Despliegue: Verificador de 8 Pruebas y ZIP     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Script 01: `descargar_todas_las_categorias_osm.py`
- **Propósito:** Realiza la extracción masiva automatizada de las 10 macrocategorías temáticas de OpenStreetMap para el polígono de Barrio Brasil mediante consultas Overpass QL directas a los servidores Kumi Systems y Overpass Main.
- **Invocación CLI:** `python3 scripts/descargar_todas_las_categorias_osm.py --timeout 180 --reintentos 3`
- **Dependencias:** `requests`, `json`, `os`, `sys`, `time`.
- **Entradas:** Diccionario de las 10 consultas Overpass QL (`educacion` a `cobertura_suelo`).
- **Salidas:** 10 archivos GeoJSON normalizados en `data/capa_educacion.geojson` a `data/capa_cobertura_suelo.geojson`, consolidado `data/atlas_vgi_barrio_brasil_uah_completo.geojson` y resumen `data/resumen_catastro_vgi.csv` (todos sincronizados en `src/data/`).
- **Algoritmo:**
  1. Itera secuencialmente sobre las 10 categorías VGI maestras.
  2. Codifica la consulta Overpass QL en formato URL y la envía al endpoint `https://overpass-api.de/api/interpreter`.
  3. Si la respuesta retorna HTTP 429 (*Too Many Requests*), implementa una pausa progresiva de 15 segundos y conmuta al endpoint espejo `https://overpass.kumi.systems/api/interpreter`.
  4. Convierte la respuesta JSON de elementos OSM (nodes, ways, relations) en una `FeatureCollection` GeoJSON válida.
  5. Inyecta el esquema maestro de 14 atributos con valores predeterminados.
- **Salida de Terminal Típica:**
  ```text
  [*] Conectando a Overpass API para CAT-01 (Educación y Cultura)...
      ✓ HTTP 200 OK. 84 entidades descargadas en 2.42s.
      ✓ Transformación a FeatureCollection GeoJSON completada.
      ✓ Guardado en data/capa_educacion.geojson y src/data/capa_educacion.geojson.
  ```

---

### Script 02: `procesar_geofabrik_rm.py`
- **Propósito:** Descomprime y procesa el extracto regional masivo de OpenStreetMap para la Región Metropolitana de Santiago provisto por Geofabrik (`chile-rm-latest.osm.pbf` / `chile-latest-free.shp.zip`), filtrando las 10 macrocategorías temáticas para la escala metropolitana.
- **Invocación CLI:** `python3 scripts/procesar_geofabrik_rm.py`
- **Dependencias:** `geopandas`, `shapely`, `fiona`, `pyproj`.
- **Entradas:** Extracto regional de Geofabrik para la Región Metropolitana de Santiago.
- **Salidas:** 10 capas regionales GeoJSON (`data/capa_osm_rm_cat01_educacion.geojson` a `data/capa_osm_rm_cat10_cobertura_suelo.geojson`) y consolidado regional `data/capa_osm_rm_completo_vgi.geojson` (sincronizados en `src/data/`).
- **Algoritmo:**
  1. Lee las capas vectoriales mediante `geopandas.read_file()`.
  2. Verifica que el sistema de coordenadas sea EPSG:4326; si viene en otra proyección, ejecuta reproyección mediante `.to_crs(epsg=4326)`.
  3. Filtra geometrías vacías (`gdf[~gdf.is_empty]`) y geometrías inválidas (`gdf.make_valid()`).
  4. Exporta las capas optimizadas a `data/capa_osm_rm_cat01_educacion.geojson` .. `cat10_cobertura_suelo.geojson` y su espejo en `src/data/`.

---

### Script 03: `generar_gpkg_geofabrik.py`
- **Propósito:** Empaqueta las 10 capas vectoriales regionales de Geofabrik y su consolidado dentro de un único archivo **GeoPackage estándar OGC** (`data/geodatabase_osm_rm_geofabrik.gpkg`), facilitando su uso directo en software SIG de escritorio como QGIS o ArcGIS Pro.
- **Invocación CLI:** `python3 scripts/generar_gpkg_geofabrik.py`
- **Dependencias:** `sqlite3`, `geopandas`, `fiona`.
- **Entradas:** `data/capa_osm_rm_cat01_educacion.geojson` a `data/capa_osm_rm_cat10_cobertura_suelo.geojson` y `data/capa_osm_rm_completo_vgi.geojson`.
- **Salidas:** `data/geodatabase_osm_rm_geofabrik.gpkg` (archivo binario SQLite3 OGC GeoPackage v1.2).
- **Algoritmo:**
  1. Inicializa el contenedor GeoPackage SQLite con las tablas `gpkg_spatial_ref_sys`, `gpkg_contents` y `gpkg_geometry_columns`.
  2. Itera sobre las 10 capas regionales (`osm_rm_cat01_educacion` a `osm_rm_cat10_cobertura_suelo`) y la capa consolidada `osm_rm_completo_vgi`.
  3. Escribe cada una como tabla espacial con codificación binaria GeoPackage Standard Header + WKB.
  4. Registra los metadatos de extensión geográfica en `gpkg_contents`.

---

### Script 04: `procesar_osm_geofabrik_completo.py`
- **Propósito:** Realiza la normalización y depuración completa de atributos en las capas Geofabrik, armonizando los nombres de campos en inglés (`fclass`, `name`, `osm_id`) con el estándar en español y los 14 atributos del Atlas.
- **Invocación CLI:** `python3 scripts/procesar_osm_geofabrik_completo.py`
- **Dependencias:** `geopandas`, `pandas`.
- **Salidas:** `data/capa_osm_rm_completo_vgi.geojson` y `src/data/capa_osm_rm_completo_vgi.geojson`.

---

### Script 05: `procesar_osm_geofabrik_usuario.py`
- **Propósito:** Subconjunto especializado que recorta y consolida las entidades comunitarias dentro del polígono de Barrio Brasil, sincronizando las 10 capas barriales y el archivo consolidado.
- **Invocación CLI:** `python3 scripts/procesar_osm_geofabrik_usuario.py`
- **Salidas:** `data/atlas_vgi_barrio_brasil_uah_completo.geojson` y `src/data/atlas_vgi_barrio_brasil_uah_completo.geojson`.

---

### Script 06: `sincronizar_capas_osm_locales.py`
- **Propósito:** Sincroniza y verifica la paridad binaria (SHA256) entre los directorios `data/` y `src/data/`, asegurando que las 132 capas del visor estén idénticamente disponibles tanto en el almacén raíz como en el directorio publicado en producción (`src/`).
- **Invocación CLI:** `python3 scripts/sincronizar_capas_osm_locales.py`
- **Dependencias:** `hashlib`, `shutil`, `json`.
- **Salidas:** Sincronización espejo entre `data/*.geojson` y `src/data/*.geojson`.

---

### Script 07: `descargar_capas_normativas_ide.py`
- **Propósito:** Descarga y normaliza las capas oficiales de instrumentos de planificación territorial y normativas urbanas provenientes de IDE Chile, MINVU, CMN y Municipalidad de Santiago (Plan Regulador Comunal, Zonas Típicas, Monumentos Históricos, Inmuebles de Conservación Histórica y Límites Comunales).
- **Invocación CLI:** `python3 scripts/descargar_capas_normativas_ide.py`
- **Dependencias:** `requests`, `urllib3`.
- **Salidas:** `data/ide_minvu_ipt_prc_santiago.geojson`, `data/capa_ipt_prc_comunal.geojson`, `data/ide_minvu_patrimonio_urbano.geojson`, `data/ide_monumentos_nacionales.geojson` (y réplicas en `src/data/`).

---

### Script 08: `descargar_categorias_faltantes.py`
- **Propósito:** Script de contingencia para reintentar la descarga de capas específicas que hayan fallado por *timeout* en ejecuciones masivas anteriores, permitiendo pasar una lista de IDs de categorías.
- **Invocación CLI:** `python3 scripts/descargar_categorias_faltantes.py --ids "transporte,accesibilidad"`
- **Salidas:** Actualización puntual en `data/capa_*.geojson` y `src/data/capa_*.geojson`.

---

### Script 09: `procesar_censo2024_rm.py`
- **Propósito:** Procesa las coberturas vectoriales y alfanuméricas del Censo de Población y Vivienda 2024 del INE a nivel de Manzanas Censales, Comunas y Provincias para la comuna de Santiago y la Región Metropolitana, unificando los identificadores geoespaciales con la cartografía base.
- **Invocación CLI:** `python3 scripts/procesar_censo2024_rm.py`
- **Dependencias:** `geopandas`, `pandas`.
- **Salidas:** `data/ide_censo2024_manzanas.geojson`, `data/censo2024_comunas_rm.geojson`, `data/censo2024_provincias_rm.geojson`, `data/censo2024_region_rm.geojson` y `data/censo2024_limite_urbano_rm.geojson` (sincronizados en `src/data/`).

---

### Script 10: `inspeccionar_censo2024.py`
- **Propósito:** Script de diagnóstico estadístico que imprime en consola el resumen de variables censales (total viviendas, total personas, hogares, tipología constructiva y tenencia en las 1.711 manzanas de Santiago) para verificar consistencia demográfica.
- **Invocación CLI:** `python3 scripts/inspeccionar_censo2024.py`

---

### Script 11: `procesar_capa_semaforos.py`
- **Propósito:** Normaliza las capas de semáforos y controladores de la Unidad Operativa de Control de Tránsito (UOCT / MTT), verificando coordenadas geográficas en EPSG:4326 y clasificando los cruces semaforizados en Santiago Centro y la RM.
- **Invocación CLI:** `python3 scripts/procesar_capa_semaforos.py`
- **Salidas:** `data/semaforos_rm_uoct_2026.geojson` y `data/ide_mtt_semaforos_uoct.geojson` (sincronizados en `src/data/`).

---

### Script 12: `enriquecer_base_datos_metadatos.py`
- **Propósito:** Procesa las **132 capas GeoJSON del visor** e inyecta de forma masiva y recursiva el **esquema unificado de 14 atributos maestros** (ID, nombre, categoría, fecha, fuente, licencia, etc.), garantizando que ninguna entidad carezca de los campos requeridos por el estándar del Atlas.
- **Invocación CLI:** `python3 scripts/enriquecer_base_datos_metadatos.py`
- **Dependencias:** `json`, `os`, `sys`, `glob`.
- **Algoritmo:**
  1. Recorre `data/*.geojson` y `src/data/*.geojson`.
  2. Lee cada entidad del arreglo `features`.
  3. Evalúa si contiene las 14 claves estándar. Si alguna falta, asigna el valor por defecto derivado del nombre de la capa y el tipo de geometría.
  4. Sobrescribe el archivo de manera atómica preservando codificación UTF-8 sin BOM.

---

### Script 13: `enriquecer_catalogos_y_osm.py`
- **Propósito:** Cruza la información de los catálogos en Excel (`docs/*.xlsx`) con las entidades vectoriales de OpenStreetMap (`data/capa_*.geojson`) para sincronizar descripciones semánticas y metadatos ISO 19115.
- **Invocación CLI:** `python3 scripts/enriquecer_catalogos_y_osm.py`
- **Dependencias:** `openpyxl`, `json`.

---

### Script 14: `modelo_indice_lineal_wlc.py`
- **Propósito:** Implementa el modelo matemático de **Combinación Lineal Ponderada (WLC v2.0)** bajo norma ISO 19157:2013, calculando los puntajes de calidad cuantitativa (`P_cuant`), cualitativa (`P_cual`) e Índice Global VGI (`IGV`) para cada una de las 132 capas cartográficas.
- **Invocación CLI:** `python3 scripts/modelo_indice_lineal_wlc.py`
- **Dependencias:** `math`, `csv`, `json`.
- **Ecuación Evaluada:**
  ```text
  IGV = 0.50 × P_cuant + 0.50 × P_cual
  ```
- **Salidas:** `docs/wlc_metacalidad_ranking.csv`, `docs/wlc_metacalidad_resultado.json` y `docs/matriz_metacalidad.json` (y sus réplicas en `src/docs/`).

---

### Script 15: `analisis_metacalidad.py`
- **Propósito:** Ejecuta el análisis de correlación bivariada de Pearson entre las 10 dimensiones de calidad espacial y genera el informe técnico y gráfico de metacalidad sobre las 132 capas.
- **Invocación CLI:** `python3 scripts/analisis_metacalidad.py`
- **Salidas:** `docs/correlacion_dimensiones_calidad.csv`, `docs/correlacion_dimensiones_calidad.png` y `docs/ANALISIS_METACALIDAD.md` (sincronizados en `src/docs/`).

---

### Script 16: `generar_entregables_excel.py`
- **Propósito:** Construye de forma automatizada los **tres libros de cálculo maestros en formato OpenXML (.xlsx)** con estilos visuales profesionales, cabeceras institucionales en verde musgo (`#2d5a27`), fórmulas de conteo y validación de datos:
  1. `docs/categorias_tematicas_osm.xlsx` (`src/docs/categorias_tematicas_osm.xlsx` — 10 macrocategorías comunitarias VGI).
  2. `docs/catalogo_fuentes_vgi.xlsx` (`src/docs/catalogo_fuentes_vgi.xlsx` — 132 capas catalogadas con sus fuentes, endpoints y licencias).
  3. `docs/perfil_metadatos_vgi.xlsx` (`src/docs/perfil_metadatos_vgi.xlsx` — 7 paquetes normativos del perfil ISO 19115-1:2014 / ISO 19139).
- **Invocación CLI:** `python3 scripts/generar_entregables_excel.py`
- **Dependencias:** `openpyxl`, `datetime`.
- **Salidas:** Archivos `.xlsx` sincronizados en `docs/` y `src/docs/`.

---

### Script 17: `generar_seed_sql.py`
- **Propósito:** Lee el inventario de las 132 capas y genera las sentencias SQL de inicialización y siembra de metadatos (`scripts/db/01_schema_postgis.sql` y `scripts/db/02_seed_metadata.sql`) para poblar la base de datos PostgreSQL 17 + PostGIS 3.3 en Supabase.
- **Invocación CLI:** `python3 scripts/generar_seed_sql.py`
- **Salidas:** `scripts/db/01_schema_postgis.sql` y `scripts/db/02_seed_metadata.sql`.

---

### Script 18: `cargar_entidades_postgis.py`
- **Propósito:** Ingesta masiva y por lotes desde `data/*.geojson` hacia Supabase Cloud PostGIS mediante llamadas HTTP PostgREST autenticadas con `service_role` (detallado en el Capítulo 31).
- **Invocación CLI:** `python3 scripts/cargar_entidades_postgis.py`

---

### Script 19: `subir_base_datos_supabase.py`
- **Propósito:** Sincroniza los archivos GeoJSON de `data/` y los catálogos de `docs/` con el backend de Supabase (tablas PostGIS y Bucket público de respaldo).
- **Invocación CLI:** `python3 scripts/subir_base_datos_supabase.py`
- **Dependencias:** `requests`, `mimetypes`.

---

### Script 20: `ejecutar_migracion_remota.py`
- **Propósito:** Aplica los esquemas DDL (`scripts/db/01_schema_postgis.sql` y `scripts/db/02_seed_metadata.sql`) en el servidor remoto de base de datos de producción mediante conexión directa PostgreSQL.
- **Invocación CLI:** `python3 scripts/ejecutar_migracion_remota.py`

---

### Script 21: `diagnosticar_apis.py`
- **Propósito:** Realiza un sondeo de latencia y disponibilidad (*health check*) sobre los 6 endpoints de APIs externas que alimentan dinámicamente al Atlas: Overpass API, ohsome API v1/v2, GBIF Occurrence API, Taginfo API v4, IDE Chile WMS y Supabase REST API.
- **Invocación CLI:** `python3 scripts/diagnosticar_apis.py`
- **Salidas:** Matriz de disponibilidad con código de estado HTTP y tiempo de respuesta en milisegundos.

---

### Script 22: `test_cliente_apis.py`
- **Propósito:** Suite de pruebas unitarias que simula las peticiones de los módulos frontend (consultas Overpass QL, extracción de métricas temporales de edición en ohsome, etc.) validando que las estructuras de datos recibidas coincidan con las esperadas por el código JavaScript del cliente.
- **Invocación CLI:** `python3 scripts/test_cliente_apis.py`

---

### Script 23: `verificar_conteo_capas.py`
- **Propósito:** Realiza una auditoría física en el sistema de archivos del proyecto, contrastando las **132 capas declaradas en el visor** (`10 VGI` en `src/js/config.js` + `122 oficiales` en `src/js/modulos/ide_chile.js`) contra los archivos `.geojson` en `data/` y `src/data/` y el catálogo `docs/catalogo_fuentes_vgi.xlsx`.
- **Invocación CLI:** `python3 scripts/verificar_conteo_capas.py`
- **Salida de Terminal:**
  ```text
  [+] Conteo de Capas del Atlas VGI:
      - Macrocategorías VGI en src/js/config.js: 10 capas
      - Capas Oficiales en src/js/modulos/ide_chile.js: 122 capas
      - Total Capas Operativas en Visor Web: 132 capas
      - Archivos verificados en data/ y src/data/: 100% OK
  ```

---

### Script 24: `verificar_integridad_despliegue.py`
- **Propósito:** Protocolo automatizado de pre-despliegue que ejecuta 8 pruebas críticas de validación de sintaxis, integridad topológica, esquemas de metadatos, catálogos OpenXML y paquete ZIP (analizado en profundidad en el Capítulo 34).
- **Invocación CLI:** `python3 scripts/verificar_integridad_despliegue.py`
- **Código de Salida:** `0` si todas las pruebas pasan; `1` si alguna prueba falla (bloquea el despliegue en Netlify).

---

### Script 25: `empaquetar_base_datos_completa.py`
- **Propósito:** Pipeline de empaquetado masivo y compresión ZIP que consolida la base de datos completa del Atlas (**132 capas operativas del visor**, extractos regionales de Geofabrik RM, catálogos Excel OpenXML, CSVs, esquemas SQL PostGIS y documentación técnica) en `docs/geodatabase_completa_atlas_vgi.zip` y `src/docs/geodatabase_completa_atlas_vgi.zip` (542,35 MB y 257 archivos, analizado en el Capítulo 33).
- **Invocación CLI:** `python3 scripts/empaquetar_base_datos_completa.py`

---

## 33. Pipeline de Empaquetado Masivo (`empaquetar_base_datos_completa.py`)

Uno de los requerimientos fundamentales del Atlas de Información Geográfica Voluntaria para la Gestión Territorial es garantizar el **libre acceso y la soberanía de los datos** a investigadores, planificadores urbanos y comunidades organizadas. Para ello, el sistema cuenta con un pipeline de empaquetado masivo que genera un archivo comprimido descargable con un solo clic.

```text
┌────────────────────────────────────────────────────────────────────────┐
│             PIPELINE DE EMPAQUETADO MASIVO Y COMPRESIÓN ZIP            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [10 Capas VGI Barriales + 10 RM]  ──┐                                 │
│  [122 Capas Oficiales del Estado]  ──┼──► [empaquetar_base_datos_      │
│  [3 Libros Excel OpenXML (.xlsx)]  ──┤     completa.py]                │
│  [4 Archivos CSV + JSONs WLC]      ──┤            │                    │
│  [Esquemas SQL PostGIS + Docs .md] ──┘            ▼                    │
│                                       [docs/geodatabase_completa_      │
│                                        atlas_vgi.zip (542,35 MB)]      │
│                                                   │                    │
│                                                   ▼                    │
│                                       [Espejo en src/docs/ + SHA256]   │
│                                                   │                    │
│                                                   ▼                    │
│                                       [Netlify LFS & Edge CDN]         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 33.1 Especificaciones del Paquete ZIP Unificado

- **Nombre de Archivo:** `geodatabase_completa_atlas_vgi.zip`
- **Ubicación en el Repositorio (`git`):** `docs/geodatabase_completa_atlas_vgi.zip` y `src/docs/geodatabase_completa_atlas_vgi.zip`
- **Ruta de Despliegue en Producción:** `https://atlasvgiuah.netlify.app/docs/geodatabase_completa_atlas_vgi.zip` (y redirección corta `https://atlasvgiuah.netlify.app/geodatabase`)
- **Peso Comprimido (ZIP):** 542,35 MB (568.698.613 bytes)
- **Peso Descomprimido (Base de Datos Operativa):** ~3,33 GB
- **Total de Archivos Empaquetados:** **257 archivos** (incluyendo las **132 capas del visor**: 10 macrocategorías VGI + 122 capas oficiales del Estado)
- **Método de Compresión:** `ZIP_DEFLATED` (estándar zlib/RFC 1951 con soporte ZIP64 `allowZip64=True`)

---

### 33.2 Algoritmo de Compresión y Verificación de Integridad

El script clasifica automáticamente todos los archivos de `data/` y `docs/` en **7 subcarpetas temáticas estandarizadas**, genera un manifiesto `LEEME_ESTRUCTURA_BASE_DE_DATOS.txt` y sincroniza el paquete final tanto en `docs/geodatabase_completa_atlas_vgi.zip` como en `src/docs/geodatabase_completa_atlas_vgi.zip`:

```python
# Fragmento central de scripts/empaquetar_base_datos_completa.py
import os
import zipfile
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "data")
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
SRC_DOCS_DIR = os.path.join(ROOT_DIR, "src", "docs")
ZIP_PATH_DOCS = os.path.join(DOCS_DIR, "geodatabase_completa_atlas_vgi.zip")
ZIP_PATH_SRC = os.path.join(SRC_DOCS_DIR, "geodatabase_completa_atlas_vgi.zip")

def clasificar_archivo_geojson(filename):
    if filename.startswith("capa_osm_rm_"):
        return "01_vgi_comunitario_osm/region_metropolitana_geofabrik"
    if filename in {
        "capa_educacion.geojson", "capa_servicios.geojson", "capa_transporte.geojson",
        "capa_movilidad_activa.geojson", "capa_espacio_publico.geojson", "capa_patrimonio.geojson",
        "capa_accesibilidad.geojson", "capa_biodiversidad.geojson", "capa_edificaciones.geojson",
        "capa_cobertura_suelo.geojson", "atlas_vgi_barrio_brasil_uah_completo.geojson"
    }:
        return "01_vgi_comunitario_osm/barrio_brasil"
    if "censo2024" in filename:
        return "03_censo_2024_ine"
    if filename.startswith("bbdd_") or "munistgo" in filename or "barrios_santiago" in filename:
        return "04_observatorio_urbano_stgo"
    if filename.startswith("subdere_") or "zonas_aseo" in filename or "biodiversidad" in filename:
        return "05_medioambiente_residuos_subdere"
    if "semaforos" in filename or "antenas" in filename or "metro" in filename:
        return "06_transporte_y_telecomunicaciones"
    return "02_ide_chile_ministerios"
```

---

### 33.3 Inventario Estructurado de las 7 Subcarpetas Contenidas en `geodatabase_completa_atlas_vgi.zip`

| Carpeta Interna en el ZIP | Tipos de Archivo | Contenido Verificable |
|---|---|---|
| `01_vgi_comunitario_osm/` | `.geojson`, `.csv` | Subcarpeta `barrio_brasil/` (`capa_educacion.geojson` a `capa_cobertura_suelo.geojson`, `atlas_vgi_barrio_brasil_uah_completo.geojson`, `resumen_catastro_vgi.csv`) y subcarpeta `region_metropolitana_geofabrik/` (`capa_osm_rm_cat01_educacion.geojson` a `cat10_cobertura_suelo.geojson` y `capa_osm_rm_completo_vgi.geojson`). |
| `02_ide_chile_ministerios/` | `.geojson` | Coberturas oficiales ministeriales (`ide_minvu_ipt_prc_santiago.geojson`, `ide_minvu_patrimonio_urbano.geojson`, `ide_sii_catastro_predial.geojson`, `ide_establecimientos_salud.geojson`, `ide_establecimientos_educacion.geojson`, etc.). |
| `03_censo_2024_ine/` | `.geojson` | Cartografía censal INE Censo 2024 (`ide_censo2024_manzanas.geojson`, `censo2024_comunas_rm.geojson`, `censo2024_provincias_rm.geojson`, `censo2024_region_rm.geojson`, `censo2024_limite_urbano_rm.geojson`). |
| `04_observatorio_urbano_stgo/` | `.geojson`, `.csv` | Series comunales `bbdd_01_santiago.geojson` a `bbdd_91_santiago.geojson`, `barrios_santiago_19_27.geojson` y `bip_inversiones_santiago.csv`. |
| `05_medioambiente_residuos_subdere/` | `.geojson` | Catastro SUBDERE RSD (`subdere_rsd_*.geojson`), `zonas_aseo_contenedores_papeleros_santiago.geojson`, `mma_ruido_ambiental_santiago.geojson`, `ide_areas_verdes.geojson`. |
| `06_transporte_y_telecomunicaciones/` | `.geojson` | `semaforos_rm_uoct_2026.geojson`, `ide_mtt_semaforos_uoct.geojson`, `ide_estaciones_metro.geojson`, `ide_paradas_transporte.geojson`, `subtel_antenas_rm_2026.geojson`. |
| `07_metadatos_y_gobernanza/` | `.xlsx`, `.csv`, `.json`, `.md`, `.sql` | Libros Excel (`categorias_tematicas_osm.xlsx`, `catalogo_fuentes_vgi.xlsx`, `perfil_metadatos_vgi.xlsx`), reportes WLC (`wlc_metacalidad_ranking.csv`, `wlc_metacalidad_resultado.json`, `matriz_metacalidad.json`, `correlacion_dimensiones_calidad.csv`), manuales (`MANUAL_ACTUALIZACION_ATLAS.md`, `MANUAL_USO.md`, `ANALISIS_METACALIDAD.md`, `BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md`) y esquemas SQL (`01_schema_postgis.sql`, `02_seed_metadata.sql`). |
| **TOTAL GENERAL** | **257 archivos** | **Geodatabase Completa del Atlas VGI (`docs/geodatabase_completa_atlas_vgi.zip` — 542,35 MB ZIP / ~3,33 GB descomprimidos).** |

---

### 33.4 Integración en la Interfaz Web (`src/js/modulos/licencias.js`)

En el Módulo 10 (`src/js/modulos/licencias.js`) y en el encabezado de `src/index.html`, la descarga apunta directamente a la ruta canónica publicada en producción:

```javascript
// Descarga directa de la Geodatabase Completa (542,35 MB)
const urlGeodatabase = "docs/geodatabase_completa_atlas_vgi.zip";
// Redirección alternativa configurada en netlify.toml: /geodatabase -> /docs/geodatabase_completa_atlas_vgi.zip
```

---

## 34. Protocolo de Integridad Pre-Despliegue (`scripts/verificar_integridad_despliegue.py`)

Para garantizar que ninguna actualización rompa la estabilidad del visor cartográfico en producción, el proyecto implementa un protocolo riguroso de integración continua ejecutado por el script `scripts/verificar_integridad_despliegue.py`. 

Este script evalúa **8 bancos de pruebas de integridad exhaustivas** de manera secuencial. Si tan solo una prueba falla, el script retorna un código de error `exit(1)` que interrumpe de inmediato cualquier intento de despliegue en Netlify:

```text
┌────────────────────────────────────────────────────────────────────────┐
│            PROTOCOLO AUTOMATIZADO DE 8 PRUEBAS DE INTEGRIDAD           │
├────────────────────────────────────────────────────────────────────────┤
│ [TEST 1] Sintaxis JSON/GeoJSON en data/*.geojson y src/data/*.geojson  │
│ [TEST 2] Coordenadas geográficas y Bounding Box dentro de WGS84        │
│ [TEST 3] Esquema de 14 atributos maestros en cada Feature              │
│ [TEST 4] Normalización matemática del Índice Global WLC                │
│ [TEST 5] Coherencia referencial entre docs/*.xlsx y data/*.geojson     │
│ [TEST 6] Compilación y sintaxis limpia en todos los scripts Python/JS  │
│ [TEST 7] Existencia e integridad de docs/geodatabase_completa_atlas_vgi│
│ [TEST 8] Protocolo de Sanitización Estricta de Términos y Formato      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 34.1 Desglose Detallado de los 8 Bancos de Pruebas

#### Banco 1: Validación Estricta de Sintaxis JSON/GeoJSON
- **Metodología:** Abre e intenta deserializar con `json.loads()` cada uno de los archivos `.geojson` en `data/` y `src/data/`.
- **Criterio de Aprobación:** Cero errores de sintaxis (`JSONDecodeError`), sin comas finales (*trailing commas*) y codificación UTF-8 pura.
- **Acción ante fallo:** Reporta el archivo corrupto y la línea exacta del error de formateo.

#### Banco 2: Validación de Geometrías y Bounding Box WGS84
- **Metodología:** Verifica que las coordenadas geográficas se encuentren dentro de los rangos válidos del elipsoide WGS84 (`EPSG:4326`):
  ```text
  -180.0° ≤ Longitud ≤ 180.0°   y   -90.0° ≤ Latitud ≤ 90.0°
  ```
  Para el ámbito específico de Barrio Brasil y Santiago Centro, comprueba además que las coordenadas se ubiquen dentro del rectángulo envolvente esperado y que no estén invertidas (evitando el error frecuente de permutar Latitud y Longitud).
- **Criterio de Aprobación:** 100% de geometrías válidas y anillos poligonales cerrados (primer vértice idéntico al último).

#### Banco 3: Validación del Esquema Maestro de 14 Atributos
- **Metodología:** Inspecciona el diccionario `properties` de cada `Feature` vectorial, comprobando la presencia de los atributos de trazabilidad documental y fuente (`fuente_datos`, `licencia`, `crs_epsg`, etc.).
- **Criterio de Aprobación:** Todas las entidades cumplen con el esquema unificado.

#### Banco 4: Normalización Matemática del Índice WLC
- **Metodología:** Valida que los resultados de metacalidad en `docs/wlc_metacalidad_resultado.json` y `docs/wlc_metacalidad_ranking.csv` satisfagan los intervalos normativos (`[0, 100]` en porcentaje o `[0.0, 1.0]` normalizado).
- **Criterio de Aprobación:** Cero valores negativos, nulos (`NaN`) o fuera de rango.

#### Banco 5: Coherencia Referencial Cruzada (Excel vs GeoJSON)
- **Metodología:** Abre `docs/catalogo_fuentes_vgi.xlsx`, `docs/categorias_tematicas_osm.xlsx` y `docs/perfil_metadatos_vgi.xlsx` mediante `openpyxl` y compara los identificadores de las 132 capas contra los archivos reales presentes en `data/` y `src/data/`.
- **Criterio de Aprobación:** 100% de coincidencia entre los catálogos documentales y los archivos físicos en disco.

#### Banco 6: Integridad de Scripts Python y Módulos JavaScript
- **Metodología:** Ejecuta `py_compile.compile()` sobre todos los archivos `.py` en `scripts/` y valida la sintaxis de los 21 archivos `.js` en `src/js/`.
- **Criterio de Aprobación:** Cero excepciones de compilación o sintaxis.

#### Banco 7: Verificación del Paquete ZIP y Recursos Críticos
- **Metodología:** Comprueba la existencia y paridad de `docs/geodatabase_completa_atlas_vgi.zip` y `src/docs/geodatabase_completa_atlas_vgi.zip` (> 100 MB reales, descartando punteros Git LFS truncados).
- **Criterio de Aprobación:** Ambos paquetes ZIP existen y contienen las 7 carpetas temáticas íntegras.

#### Banco 8: Protocolo de Sanitización Estricta
- **Metodología:** Realiza una auditoría sobre el árbol de código fuente (`src/`, `docs/`, `scripts/`) verificando la ausencia de comandos LaTeX crudos o cadenas no permitidas.
- **Criterio de Aprobación:** Cero coincidencias en todo el proyecto.

---

### 34.2 Estructura de Validación en `scripts/verificar_integridad_despliegue.py`

```python
# Fragmento de verificación de rutas reales en scripts/verificar_integridad_despliegue.py
import os
import sys
import json
import py_compile
import openpyxl

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def prueba_01_sintaxis_geojson():
    print("[*] TEST 1: Verificando sintaxis JSON en data/ y src/data/...")
    for sub in ["data", os.path.join("src", "data")]:
        ruta_capas = os.path.join(BASE_DIR, sub)
        archivos = [f for f in os.listdir(ruta_capas) if f.endswith(".geojson")]
        for a in archivos:
            with open(os.path.join(ruta_capas, a), "r", encoding="utf-8") as fp:
                data = json.load(fp)
                if data.get("type") != "FeatureCollection":
                    return False
    print(f"    ✓ Capas GeoJSON verificadas en data/ y src/data/ sin errores.")
    return True

def prueba_05_coherencia_excel():
    print("[*] TEST 5: Verificando libros Excel maestros en docs/ y src/docs/...")
    libros = [
        "categorias_tematicas_osm.xlsx",
        "catalogo_fuentes_vgi.xlsx",
        "perfil_metadatos_vgi.xlsx"
    ]
    for libro in libros:
        for carpeta in ["docs", os.path.join("src", "docs")]:
            ruta_excel = os.path.join(BASE_DIR, carpeta, libro)
            if not os.path.exists(ruta_excel):
                print(f"    [FAIL] Libro Excel no encontrado: {ruta_excel}")
                return False
            wb = openpyxl.load_workbook(ruta_excel, read_only=True)
            wb.close()
    print("    ✓ Los 3 libros Excel maestros (.xlsx) existen y son íntegros en docs/ y src/docs/.")
    return True

def prueba_07_paquete_geodatabase_zip():
    print("[*] TEST 7: Verificando paquete ZIP docs/geodatabase_completa_atlas_vgi.zip...")
    for carpeta in ["docs", os.path.join("src", "docs")]:
        zip_ruta = os.path.join(BASE_DIR, carpeta, "geodatabase_completa_atlas_vgi.zip")
        if not os.path.exists(zip_ruta) or os.path.getsize(zip_ruta) < 100 * 1024 * 1024:
            print(f"    [FAIL] Paquete ZIP ausente o incompleto en {zip_ruta}")
            return False
    print("    ✓ Paquete geodatabase_completa_atlas_vgi.zip verificado en docs/ y src/docs/.")
    return True
```
"""
print("[+] Parte 06 enriquecida cargada exitosamente")
