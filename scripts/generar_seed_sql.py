import re
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDE_JS_PATH = os.path.join(BASE_DIR, "src", "js", "modulos", "ide_chile.js")
SQL_OUTPUT_PATH = os.path.join(BASE_DIR, "scripts", "db", "02_seed_metadata.sql")

def generar_sql():
    with open(IDE_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    start_c = content.find('const CAPAS_OFICIALES = {')
    end_c = content.find('  const SERVICIOS_IPT_CHILE = {')
    chunk = content[start_c:end_c]

    # Extraer capas
    # Cada capa empieza con 4 espacios y id: {
    pattern = re.compile(r'^\s{4}([\'"]?[a-zA-Z0-9_]+[\'"]?):\s*\{([^}]+(?:\{[^}]+\}[^}]+)*)\}', re.MULTILINE)
    matches = pattern.findall(chunk)

    print(f"Capas detectadas para SQL: {len(matches)}")

    rows = []
    for k_raw, body in matches:
        cid = k_raw.strip("'\"")
        
        def get_val(key, default=""):
            m = re.search(rf"{key}:\s*['\"]([^'\"]*)['\"]", body)
            if m:
                return m.group(1).replace("'", "''")
            m_num = re.search(rf"{key}:\s*(\d+)", body)
            if m_num:
                return m_num.group(1)
            return default

        nombre = get_val("nombre", cid)
        institucion = get_val("institucion", "Estado de Chile / IDE Chile")
        ministerio = get_val("ministerio", "Organismo Público del Estado de Chile")
        grupo = get_val("grupo", "equipamiento_infraestructura")
        geometria = get_val("geometria", "Vectorial GeoJSON")
        color = get_val("color", "#64748B")
        icono = get_val("icono", "🏛️")
        archivo_local = get_val("archivoLocal", f"data/{cid}.geojson")
        tipo_servicio = get_val("tipoServicio", "Vectorial GeoJSON Oficial")
        url_servicio = get_val("urlServicio", "https://www.geoportal.cl")
        declaracion = get_val("declaracion", "Información pública oficial del Estado de Chile amparada por la Ley N° 20.285.")
        cita_apa = get_val("citaAPA", f"Estado de Chile. (2026). {nombre}. IDE Chile.")

        # Entidades estimadas o conocidas
        total_entidades = 0
        if "18.173" in geometria or "18173" in geometria:
            total_entidades = 18173
        elif "1.690" in geometria or "1690" in geometria:
            total_entidades = 1690
        elif "35.036" in geometria or "35036" in geometria:
            total_entidades = 35036
        elif "526" in geometria:
            total_entidades = 526
        elif "3.483" in nombre or "3483" in nombre or "semaforos" in cid:
            total_entidades = 3483
        elif cid == "censo2024_regional":
            total_entidades = 1
        elif cid == "censo2024_limite_urbano":
            total_entidades = 106
        elif cid == "censo2024_localidades":
            total_entidades = 511
        elif cid == "censo2024_zonal":
            total_entidades = 1865
        elif cid == "censo2024_manzanas":
            total_entidades = 66873

        geojson_filename = os.path.basename(archivo_local)
        url_storage = f"https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/atlas-geojson/{geojson_filename}"

        row_sql = f"('{cid}', '{nombre}', '{institucion}', '{ministerio}', '{grupo}', '{geometria}', '{color}', '{icono}', {total_entidades}, ARRAY[-70.6720, -33.4505, -70.6580, -33.4350]::DOUBLE PRECISION[], '{url_storage}', '{tipo_servicio}', '{url_servicio}', '{declaracion}', '{cita_apa}')"
        rows.append(row_sql)

    sql_header = """-- ============================================================================
-- Nodo GeoAbierto — Catálogo Maestro de Capas Oficiales del Estado de Chile
-- Seed Data de Metadatos para public.capas_metadata
-- (109 Capas Oficiales del Estado Sincronizadas y Actualizadas)
-- ============================================================================

INSERT INTO public.capas_metadata (
    id, nombre, institucion, ministerio, categoria_macro, geometria_tipo,
    color, icono, total_entidades, bbox, archivo_geojson_url, tipo_servicio,
    url_servicio_origen, declaracion_legal, cita_apa
) VALUES
"""
    sql_body = ",\n".join(rows) + ";\n"

    with open(SQL_OUTPUT_PATH, "w", encoding="utf-8") as f_out:
        f_out.write(sql_header + sql_body)

    print(f"Archivo SQL generado exitosamente en: {SQL_OUTPUT_PATH}")

if __name__ == "__main__":
    generar_sql()
