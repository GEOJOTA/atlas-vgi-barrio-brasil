#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
procesar_censo2024_rm.py
-------------------------
Procesa, estandariza y exporta los 5 niveles escalares del Censo 2024 (Región Metropolitana)
desde los GeoPackages oficiales en 'Base de datos VGI/CENSO 2024' hacia GeoJSON estándar
EPSG:4326 (WGS84) para el Atlas VGI UAH.

Escalas generadas:
1. ide_censo2024_regional.geojson       -> Escala Regional RM (1 polígono)
2. ide_censo2024_limite_urbano.geojson  -> Escala Límites Urbanos Censales (106 polígonos)
3. ide_censo2024_localidades.geojson    -> Escala Localidades y Asentamientos (511 polígonos)
4. ide_censo2024_zonal.geojson          -> Escala Zonas y Distritos Censales (1.865 polígonos)
5. ide_censo2024_manzanas.geojson       -> Escala Manzanas Comuna de Santiago / Barrio Brasil (1.711 polígonos)
"""

import os
import sys
import json
import geopandas as gpd
import shapely

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENSO_DIR = r"C:\Users\PT1261256\Desktop\16_09_2026\Base de datos VGI\CENSO 2024"
SRC_DATA_DIR = os.path.join(BASE_DIR, "src", "data")
ROOT_DATA_DIR = os.path.join(BASE_DIR, "data")

os.makedirs(SRC_DATA_DIR, exist_ok=True)
os.makedirs(ROOT_DATA_DIR, exist_ok=True)

def exportar_capa(gdf, nombre_archivo, descripcion):
    print(f"\n[*] Procesando: {descripcion} ({len(gdf):,} entidades, {len(gdf.columns)} columnas)...")
    
    # Asegurar proyección EPSG:4326 WGS84 fidedigna
    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)
        
    # Validar geometrías sin simplificar ningún vértice
    gdf['geometry'] = gdf['geometry'].make_valid()
    
    # Guardar GeoJSON íntegro con todas sus columnas en src/data y data/
    for dest_dir in [SRC_DATA_DIR, ROOT_DATA_DIR]:
        dest_path = os.path.join(dest_dir, nombre_archivo)
        gdf.to_file(dest_path, driver='GeoJSON')
        peso_mb = os.path.getsize(dest_path) / (1024 * 1024)
        print(f"    -> Guardado en {dest_path} ({peso_mb:.2f} MB)")
        
    return len(gdf), [float(gdf.total_bounds[0]), float(gdf.total_bounds[1]), float(gdf.total_bounds[2]), float(gdf.total_bounds[3])]

def main():
    print("=" * 80)
    print("PROCESAMIENTO MULTIESCALAR CENSO 2024 — INTEGRIDAD TOTAL 100% (RM)")
    print("=" * 80)
    
    resumen = {}
    
    # 1. ESCALA REGIONAL (RM) — 1 entidad
    path_reg = os.path.join(CENSO_DIR, "RM_Region.gpkg")
    gdf_reg = gpd.read_file(path_reg)
    cnt, bbox = exportar_capa(gdf_reg, "ide_censo2024_regional.geojson", "Escala 1: Marco Regional RM")
    resumen["censo2024_regional"] = {"count": cnt, "bbox": bbox, "file": "ide_censo2024_regional.geojson"}
    
    # 2. ESCALA LÍMITES URBANOS CENSALES — 106 entidades
    path_urb = os.path.join(CENSO_DIR, "RM_Limite_Urbano.gpkg")
    gdf_urb = gpd.read_file(path_urb)
    cnt, bbox = exportar_capa(gdf_urb, "ide_censo2024_limite_urbano.geojson", "Escala 2: Límites Urbanos Censales RM")
    resumen["censo2024_limite_urbano"] = {"count": cnt, "bbox": bbox, "file": "ide_censo2024_limite_urbano.geojson"}
    
    # 3. ESCALA LOCALIDADES Y ASENTAMIENTOS — 511 entidades
    path_loc = os.path.join(CENSO_DIR, "RM_Localidades.gpkg")
    gdf_loc = gpd.read_file(path_loc)
    cnt, bbox = exportar_capa(gdf_loc, "ide_censo2024_localidades.geojson", "Escala 3: Localidades y Asentamientos RM")
    resumen["censo2024_localidades"] = {"count": cnt, "bbox": bbox, "file": "ide_censo2024_localidades.geojson"}
    
    # 4. ESCALA ZONAS Y DISTRITOS CENSALES — 1.865 entidades
    path_zon = os.path.join(CENSO_DIR, "RM_Zonal.gpkg")
    gdf_zon = gpd.read_file(path_zon)
    cnt, bbox = exportar_capa(gdf_zon, "ide_censo2024_zonal.geojson", "Escala 4: Zonas y Distritos Censales RM")
    resumen["censo2024_zonal"] = {"count": cnt, "bbox": bbox, "file": "ide_censo2024_zonal.geojson"}
    
    # 5. ESCALA MANZANAS CENSALES — Todas las 66.873 manzanas de la RM sin recortes
    path_mnz = os.path.join(CENSO_DIR, "RM_Manzanas.gpkg")
    gdf_mnz = gpd.read_file(path_mnz)
    cnt, bbox = exportar_capa(gdf_mnz, "ide_censo2024_manzanas.geojson", "Escala 5: Manzanas Censales (Total Región Metropolitana)")
    resumen["censo2024_manzanas"] = {"count": cnt, "bbox": bbox, "file": "ide_censo2024_manzanas.geojson"}
    
    print("\n" + "=" * 80)
    print("RESUMEN DE CAPAS GENERADAS")
    print("=" * 80)
    for k, v in resumen.items():
        print(f"[{k:25}] {v['count']:5} entidades | BBox: {[round(x, 4) for x in v['bbox']]} | {v['file']}")
        
    print("\n[+] Proceso completado exitosamente.")

if __name__ == "__main__":
    main()
