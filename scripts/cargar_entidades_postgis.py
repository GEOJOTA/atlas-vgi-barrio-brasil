#!/usr/bin/env python3
"""
scripts/cargar_entidades_postgis.py
-----------------------------------
Carga las entidades de los GeoJSON locales en la tabla public.capas_entidades de PostgreSQL PostGIS.
Utiliza ST_GeomFromGeoJSON para almacenar geometrías nativas con índices GIST.
"""

import os
import sys
import json
import ssl
import pg8000.native

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

DB_USER = "postgres"
DB_PASS = os.environ.get("DB_PASS", "")
DB_HOST = os.environ.get("DB_HOST", "db.example.supabase.co")
DB_PORT = 5432
DB_NAME = "postgres"

def main():
    print(f"[+] Conectando a Supabase PostgreSQL ({DB_HOST})...")
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    con = pg8000.native.Connection(
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        ssl_context=ssl_context,
        timeout=60
    )

    # Obtener IDs de capas registradas
    res_capas = con.run("SELECT id FROM public.capas_metadata;")
    capas_ids = {r[0] for r in res_capas}
    print(f"  ✓ {len(capas_ids)} capas registradas en metadata.")

    # Mapeo de archivos en data/
    archivos = [f for f in os.listdir(DATA_DIR) if f.endswith(".geojson")]
    archivos.sort()

    total_cargadas = 0
    capas_procesadas = 0

    for arc in archivos:
        path = os.path.join(DATA_DIR, arc)
        peso_mb = os.path.getsize(path) / (1024 * 1024)
        
        # Identificar capa_id correspondiente
        capa_id = None
        nombre_base = arc.replace(".geojson", "")
        if nombre_base in capas_ids:
            capa_id = nombre_base
        elif nombre_base.startswith("capa_") and nombre_base.replace("capa_", "") in capas_ids:
            capa_id = nombre_base.replace("capa_", "")
        elif nombre_base.startswith("ide_") and nombre_base.replace("ide_", "") in capas_ids:
            capa_id = nombre_base.replace("ide_", "")
        elif nombre_base.startswith("capa_bbdd_"):
            num = nombre_base.replace("capa_bbdd_", "")
            c_candidate = f"bbdd_{num}"
            if c_candidate in capas_ids:
                capa_id = c_candidate

        if not capa_id:
            continue

        # Si el archivo supera 25 MB en un solo batch, lo omitimos para Storage CDN o lo subimos particionado
        if peso_mb > 20:
            print(f"  ℹ {capa_id} ({peso_mb:.1f} MB): reservado para Supabase Storage CDN.")
            continue

        # Verificar si ya tiene entidades cargadas
        cnt_existente = con.run("SELECT COUNT(*) FROM public.capas_entidades WHERE capa_id = :cid;", cid=capa_id)[0][0]
        if cnt_existente > 0:
            continue

        try:
            with open(path, "r", encoding="utf-8") as jf:
                data = json.load(jf)
                features = data.get("features", [])

            if not features:
                continue

            print(f"[+] Insertando en PostGIS: {capa_id} ({len(features)} entidades, {peso_mb:.2f} MB)...")
            
            # Insertar en lotes de 100
            lote_size = 100
            for i in range(0, len(features), lote_size):
                lote = features[i:i + lote_size]
                values_clauses = []
                params = {"cid": capa_id}

                for j, feat in enumerate(lote):
                    geom = feat.get("geometry")
                    if not geom:
                        continue
                    props = feat.get("properties") or {}
                    geom_json_str = json.dumps(geom)
                    props_json_str = json.dumps(props)

                    param_geom = f"g_{i}_{j}"
                    param_props = f"p_{i}_{j}"
                    params[param_geom] = geom_json_str
                    params[param_props] = props_json_str

                    values_clauses.append(f"(:cid, ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON(:{param_geom}), 4326)), (:{param_props})::jsonb)")

                if values_clauses:
                    query = f"INSERT INTO public.capas_entidades (capa_id, geom, properties) VALUES {', '.join(values_clauses)};"
                    con.run(query, **params)

            con.run("COMMIT;")
            total_cargadas += len(features)
            capas_procesadas += 1
            print(f"  ✓ {capa_id}: {len(features)} entidades cargadas con éxito.")

        except Exception as e:
            print(f"  ✗ Error al cargar {capa_id}: {e}")

    print(f"\n[+] Total de capas vectorizadas en PostGIS: {capas_procesadas}")
    print(f"[+] Total de geometrías cargadas: {total_cargadas:,}")
    con.close()

if __name__ == "__main__":
    main()
