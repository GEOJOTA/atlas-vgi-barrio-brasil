#!/usr/bin/env python3
"""
scripts/ejecutar_migracion_remota.py
------------------------------------
Ejecuta los scripts DDL y DML (01_schema_postgis.sql y 02_seed_metadata.sql)
directamente en la base de datos PostgreSQL de Supabase.
"""

import os
import sys
import ssl
import pg8000.native

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_SQL = os.path.join(BASE_DIR, "scripts", "db", "01_schema_postgis.sql")
SEED_SQL = os.path.join(BASE_DIR, "scripts", "db", "02_seed_metadata.sql")

DB_USER = "postgres"
DB_PASS = os.environ.get("DB_PASS", "")
DB_HOST = os.environ.get("DB_HOST", "db.example.supabase.co")
DB_PORT = 5432
DB_NAME = "postgres"

def main():
    print(f"[+] Conectando a {DB_HOST}:{DB_PORT}/{DB_NAME}...")
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
        timeout=30
    )
    print("  ✓ Conectado exitosamente.")

    # 1. Ejecutar Schema PostGIS
    print(f"\n[+] Ejecutando esquema DDL: {SCHEMA_SQL}...")
    with open(SCHEMA_SQL, "r", encoding="utf-8") as f:
        schema_content = f.read()

    # Ejecutar declaraciones
    con.run(schema_content)
    print("  ✓ Esquema PostGIS, tablas capas_metadata y capas_entidades creadas correctamente.")

    # Verificar PostGIS
    postgis_ver = con.run("SELECT PostGIS_Version();")[0][0]
    print(f"  ✓ Extensión espacial activa: PostGIS {postgis_ver}")

    # 2. Ejecutar Seed de Metadatos
    print(f"\n[+] Ejecutando catálogo semilla: {SEED_SQL}...")
    with open(SEED_SQL, "r", encoding="utf-8") as f:
        seed_content = f.read()

    con.run(seed_content)
    con.run("COMMIT;")
    
    count_meta = con.run("SELECT COUNT(*) FROM public.capas_metadata;")[0][0]
    print(f"  ✓ {count_meta} capas registradas oficialmente en public.capas_metadata.")

    con.close()
    print("\n[+] Migración de esquema y catálogo maestro completada con 100% de éxito.")

if __name__ == "__main__":
    main()
