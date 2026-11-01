#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/generar_gpkg_geofabrik.py
-----------------------------------
Genera la Geodatabase espacial OGC GeoPackage 'data/geodatabase_osm_rm_geofabrik.gpkg'
a partir de los 10 archivos GeoJSON clasificados, creando índices espaciales R-Tree nativos.
"""

import os
import sys
import time
import geopandas as gpd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
GPKG_PATH = os.path.join(DATA_DIR, "geodatabase_osm_rm_geofabrik.gpkg")

if os.path.exists(GPKG_PATH):
    try:
        os.remove(GPKG_PATH)
    except Exception as e:
        print(f"Aviso al remover GPKG previo: {e}")

CATEGORIAS = [
    ("cat01_educacion", "capa_osm_rm_cat01_educacion.geojson"),
    ("cat02_servicios", "capa_osm_rm_cat02_servicios.geojson"),
    ("cat03_transporte", "capa_osm_rm_cat03_transporte.geojson"),
    ("cat04_movilidad_activa", "capa_osm_rm_cat04_movilidad_activa.geojson"),
    ("cat05_espacio_publico", "capa_osm_rm_cat05_espacio_publico.geojson"),
    ("cat06_patrimonio", "capa_osm_rm_cat06_patrimonio.geojson"),
    ("cat07_accesibilidad", "capa_osm_rm_cat07_accesibilidad.geojson"),
    ("cat08_biodiversidad", "capa_osm_rm_cat08_biodiversidad.geojson"),
    ("cat09_edificaciones", "capa_osm_rm_cat09_edificaciones.geojson"),
    ("cat10_cobertura_suelo", "capa_osm_rm_cat10_cobertura_suelo.geojson")
]

print("=" * 80)
print("GENERACIÓN DE GEOPACKAGE SPATIALITE CON ÍNDICES R-TREE NATIVOS")
print("=" * 80)

t0 = time.time()
for layer_name, geojson_name in CATEGORIAS:
    geojson_path = os.path.join(DATA_DIR, geojson_name)
    if not os.path.exists(geojson_path):
        print(f"[-] Omitiendo {geojson_name} (no existe)")
        continue
    
    print(f"[*] Leyendo {geojson_name}...", flush=True)
    gdf = gpd.read_file(geojson_path)
    print(f"    Guardando capa '{layer_name}' ({len(gdf):,} registros) en GeoPackage...", flush=True)
    gdf.to_file(GPKG_PATH, layer=layer_name, driver="GPKG", spatial_index=True)
    print(f"    [✓] Capa '{layer_name}' guardada con índice espacial R-Tree.")

sz_mb = os.path.getsize(GPKG_PATH) / (1024 * 1024)
print("=" * 80)
print(f"GEOPACKAGE GENERADO: {GPKG_PATH} ({sz_mb:.2f} MB) en {time.time()-t0:.1f}s")
print("=" * 80)
