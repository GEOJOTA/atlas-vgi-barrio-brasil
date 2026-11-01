-- ============================================================================
-- Nodo GeoAbierto — Atlas de Información Geográfica Voluntaria (Barrio Brasil / UAH)
-- Esquema de Base de Datos Espacial PostgreSQL 15+ con PostGIS (Supabase)
-- ============================================================================
-- 100% Código Abierto, Gratuito y Permanente
-- Permite almacenar y consultar la base de datos geográfica en su integridad total.
-- ============================================================================

-- 1. Habilitar extensión espacial PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLA MAESTRA: capas_metadata
-- Catálogo de las 108 capas oficiales del Estado de Chile e indicadores territoriales
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.capas_metadata (
    id TEXT PRIMARY KEY,                           -- ej: 'bbdd_01', 'censo2024_regional', 'censo2024_manzanas'
    nombre TEXT NOT NULL,                          -- Denominación oficial de la capa
    institucion TEXT NOT NULL,                     -- Organismo rector (MINVU, INE, MOP, etc.)
    ministerio TEXT,                               -- Ministerio o cartera
    categoria_macro TEXT NOT NULL,                 -- normativa_ipt, medio_ambiente, etc.
    geometria_tipo TEXT,                           -- Puntos, Líneas, Polígonos
    color TEXT DEFAULT '#06B6D4',                  -- Color hexadecimal para visualización
    icono TEXT DEFAULT '🗺️',                        -- Emoji o glifo de categoría
    total_entidades INTEGER DEFAULT 0,             -- Cantidad verificada de geometrías
    bbox DOUBLE PRECISION[],                       -- [minX, minY, maxX, maxY] en EPSG:4326
    archivo_geojson_url TEXT,                      -- URL en Supabase Storage CDN
    tipo_servicio TEXT,                            -- WFS, WMS, FeatureServer, GeoJSON
    url_servicio_origen TEXT,                      -- Enlace a geoportal o servicio del Estado
    declaracion_legal TEXT,                        -- Ley N° 20.285 de Transparencia
    cita_apa TEXT,                                 -- Referencia bibliográfica normalizada APA 7ª
    activo BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMPTZ DEFAULT NOW(),
    actualizado_el TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de búsqueda sobre metadatos
CREATE INDEX IF NOT EXISTS idx_capas_metadata_categoria ON public.capas_metadata (categoria_macro);
CREATE INDEX IF NOT EXISTS idx_capas_metadata_institucion ON public.capas_metadata (institucion);

-- ============================================================================
-- 3. TABLA ESPACIAL PRINCIPAL: capas_entidades
-- Almacena todas las entidades geométricas en formato PostGIS binario con atributos JSONB
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.capas_entidades (
    gid BIGSERIAL PRIMARY KEY,
    capa_id TEXT NOT NULL REFERENCES public.capas_metadata(id) ON DELETE CASCADE,
    geom GEOMETRY(Geometry, 4326) NOT NULL,        -- Soporta Point, LineString, Polygon, MultiPolygon
    properties JSONB NOT NULL DEFAULT '{}'::jsonb, -- Todos los atributos originales intactos
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- Índices espaciales y de atributos de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_capas_entidades_geom ON public.capas_entidades USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_capas_entidades_capa_id ON public.capas_entidades (capa_id);
CREATE INDEX IF NOT EXISTS idx_capas_entidades_props ON public.capas_entidades USING GIN (properties);

-- ============================================================================
-- 4. FUNCIÓN RPC: fn_obtener_capa_bbox
-- Consulta espacial de alto rendimiento que recorta por Bounding Box y retorna GeoJSON
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
    -- Crear polígono de envolvente espacial en EPSG:4326
    v_bbox_geom := ST_MakeEnvelope(p_minx, p_miny, p_maxx, p_maxy, 4326);

    -- Generar FeatureCollection estándar con ST_AsGeoJSON
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

-- ============================================================================
-- 5. POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- Lectura pública universal (anon) y control de escritura administrativa (service_role)
-- ============================================================================
ALTER TABLE public.capas_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capas_entidades ENABLE ROW LEVEL SECURITY;

-- Lectura pública para cualquier usuario web sin autenticación previa
CREATE POLICY "Permitir lectura publica de metadatos" 
    ON public.capas_metadata 
    FOR SELECT 
    TO anon, authenticated 
    USING (activo = TRUE);

CREATE POLICY "Permitir lectura publica de entidades geograficas" 
    ON public.capas_entidades 
    FOR SELECT 
    TO anon, authenticated 
    USING (TRUE);

-- Escritura restringida al rol administrador / servicio de backend
CREATE POLICY "Permitir administracion completa a service_role en metadata" 
    ON public.capas_metadata 
    FOR ALL 
    TO service_role 
    USING (TRUE) 
    WITH CHECK (TRUE);

CREATE POLICY "Permitir administracion completa a service_role en entidades" 
    ON public.capas_entidades 
    FOR ALL 
    TO service_role 
    USING (TRUE) 
    WITH CHECK (TRUE);

-- Comentarios explicativos
COMMENT ON TABLE public.capas_metadata IS 'Registro maestro de capas oficiales de IDE Chile y el Estado integradas al Atlas VGI';
COMMENT ON TABLE public.capas_entidades IS 'Geometrías espaciales PostGIS en WGS84 (EPSG:4326) con propiedades JSONB completas';
COMMENT ON FUNCTION public.fn_obtener_capa_bbox IS 'Retorna un FeatureCollection GeoJSON filtrado espacialmente por Bounding Box';
