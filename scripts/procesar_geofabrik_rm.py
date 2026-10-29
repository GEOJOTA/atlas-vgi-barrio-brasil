#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/procesar_geofabrik_rm.py
---------------------------------
Procesa el extracto completo de Chile de Geofabrik (chile-260927.osm.pbf),
lo filtra espacialmente con el polígono oficial de la Región Metropolitana
(DPA 2023 - region_rm_base_5360_sirgas.shp reprojectado a EPSG:4326),
genera un índice espacial (R-Tree / GeoPackage + Bbox index en memoria)
y actualiza las 10 capas temáticas locales OSM en data/ y src/data/,
indicando en los metadatos y propiedades la procedencia exacta:
Fuente: Geofabrik (chile-260927.osm.pbf), local-api.
"""

import os
import sys
import re
import time
import json
import sqlite3
import pyogrio
import pandas as pd
import geopandas as gpd
from shapely.prepared import prep
from shapely.geometry import mapping

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PBF_PATH = r"C:\Users\PT1261256\Desktop\16_09_2026\Base de datos VGI\descargadas nuevamente 25_09\chile-260927.osm.pbf"
SHP_PATH = r"C:\Users\PT1261256\Desktop\16_09_2026\Base de datos VGI\descargadas nuevamente 25_09\Manual 2\Manual\DPA 2023\region_rm_base_5360_sirgas.shp"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
SRC_DATA_DIR = os.path.join(BASE_DIR, "src", "data")
GPKG_PATH = os.path.join(DATA_DIR, "geodatabase_osm_rm_geofabrik.gpkg")

HSTORE_RE = re.compile(r'"([^"\\]*(?:\\.[^"\\]*)*)"=>"([^"\\]*(?:\\.[^"\\]*)*)"')
def parse_hstore(text):
    if not isinstance(text, str) or not text: return {}
    return {k: v.replace(r'\"', '"') for k, v in HSTORE_RE.findall(text)}

def main():
    print("=" * 80)
    print("EXTRACCIÓN ESPACIAL GEOFABRIK RM (chile-260927.osm.pbf)")
    print("=" * 80)
    t_global = time.time()

    # 1. Cargar máscara espacial oficial de la RM (EPSG:4326)
    print("\n[1/5] Cargando polígono oficial de la RM desde shapefile...")
    gdf_rm = gpd.read_file(SHP_PATH).to_crs(epsg=4326)
    rm_geom = gdf_rm.geometry.iloc[0]
    bbox_rm = tuple(gdf_rm.total_bounds)
    prep_rm = prep(rm_geom)
    print(f"  ✓ Polígono RM cargado | Bbox WGS84: ({bbox_rm[0]:.4f}, {bbox_rm[1]:.4f}, {bbox_rm[2]:.4f}, {bbox_rm[3]:.4f})")

    # 2. Lectura y recorte de Puntos
    print("\n[2/5] Leyendo capa 'points' de PBF con filtro BBOX y máscara poligonal...")
    t0 = time.time()
    pts = pyogrio.read_dataframe(PBF_PATH, layer='points', bbox=bbox_rm)
    pts = pts[pts.geometry.map(prep_rm.intersects)].copy()
    print(f"  ✓ {len(pts):,} puntos en la RM ({time.time()-t0:.1f}s)")

    # 3. Lectura y recorte de Líneas
    print("\n[3/5] Leyendo capa 'lines' de PBF con filtro BBOX y máscara poligonal...")
    t0 = time.time()
    lines = pyogrio.read_dataframe(PBF_PATH, layer='lines', bbox=bbox_rm)
    lines = lines[lines.geometry.map(prep_rm.intersects)].copy()
    print(f"  ✓ {len(lines):,} líneas en la RM ({time.time()-t0:.1f}s)")

    # 4. Lectura y recorte de Multipolígonos
    print("\n[4/5] Leyendo capa 'multipolygons' de PBF con filtro BBOX y máscara poligonal...")
    t0 = time.time()
    polys = pyogrio.read_dataframe(PBF_PATH, layer='multipolygons', bbox=bbox_rm)
    polys = polys[polys.geometry.map(prep_rm.intersects)].copy()
    print(f"  ✓ {len(polys):,} multipolígonos en la RM ({time.time()-t0:.1f}s)")

    # 5. Clasificación en las 10 Macro-Categorías VGI
    print("\n[5/5] Clasificando entidades en las 10 Macrocategorías temáticas...")

    categorias_config = [
        ("CAT-01", "educacion", "Educación y Universidad", "capa_osm_rm_cat01_educacion.geojson"),
        ("CAT-02", "servicios", "Servicios y Comercio Barrial", "capa_osm_rm_cat02_servicios.geojson"),
        ("CAT-03", "transporte", "Movilidad y Transporte", "capa_osm_rm_cat03_transporte.geojson"),
        ("CAT-04", "movilidad_activa", "Movilidad Activa y Ciclovías", "capa_osm_rm_cat04_movilidad_activa.geojson"),
        ("CAT-05", "espacio_publico", "Áreas Verdes y Espacio Público", "capa_osm_rm_cat05_espacio_publico.geojson"),
        ("CAT-06", "patrimonio", "Patrimonio y Cultura", "capa_osm_rm_cat06_patrimonio.geojson"),
        ("CAT-07", "accesibilidad", "Accesibilidad Universal", "capa_osm_rm_cat07_accesibilidad.geojson"),
        ("CAT-08", "biodiversidad", "Biodiversidad Urbana", "capa_osm_rm_cat08_biodiversidad.geojson"),
        ("CAT-09", "edificaciones", "Edificaciones y Huella Urbana", "capa_osm_rm_cat09_edificaciones.geojson"),
        ("CAT-10", "cobertura_suelo", "Coberturas y Usos de Suelo", "capa_osm_rm_cat10_cobertura_suelo.geojson")
    ]

    # Pre-parsear other_tags para puntos y líneas
    print("  [*] Parseando etiquetas adicionales (other_tags)...", flush=True)
    pts['tags_dict'] = pts['other_tags'].map(parse_hstore)
    lines['tags_dict'] = lines['other_tags'].map(parse_hstore)
    polys['tags_dict'] = polys['other_tags'].map(parse_hstore)

    def asegurar_tags(df, tags_list):
        for t in tags_list:
            if t in df.columns:
                df[t] = df[t].fillna(df['tags_dict'].map(lambda d: d.get(t)))
            else:
                df[t] = df['tags_dict'].map(lambda d: d.get(t))

    print("  [*] Consolidando campos de etiquetas temáticas...", flush=True)
    asegurar_tags(pts, ['amenity', 'shop', 'highway', 'leisure', 'historic', 'tourism', 'natural', 'building'])
    asegurar_tags(lines, ['highway', 'railway', 'route', 'cycleway', 'bicycle', 'natural', 'amenity'])
    asegurar_tags(polys, ['amenity', 'shop', 'building', 'historic', 'tourism', 'leisure', 'landuse', 'natural'])

    fuente_str = "Geofabrik, local-api"
    fuente_detalle = "Geofabrik (chile-260927.osm.pbf), local-api"
    origen_api = "local-api"
    licencia_str = "ODbL 1.0 (© OpenStreetMap contributors / Geofabrik GmbH)"

    fecha_corte = "2026-09-27"
    fecha_proc = time.strftime("%Y-%m-%d %H:%M:%S")

    # Guardar también en GeoPackage con índice espacial R-Tree
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(SRC_DATA_DIR, exist_ok=True)
    if os.path.exists(GPKG_PATH):
        try: os.remove(GPKG_PATH)
        except: pass

    resultados_resumen = []

    for cod_cat, cat_id, nom_cat, filename in categorias_config:
        print(f"\n  >> Procesando {cod_cat}: {nom_cat}...", flush=True)
        gdfs = []

        if cat_id == 'educacion':
            amenities_edu = {'school', 'kindergarten', 'university', 'college', 'library', 'childcare', 'music_school', 'language_school'}
            # Puntos
            p_mask = pts['amenity'].isin(amenities_edu) | pts['tags_dict'].map(lambda d: d.get('amenity') in amenities_edu)
            p_sub = pts[p_mask].copy()
            if len(p_sub) > 0:
                p_sub['subtipo'] = p_sub['amenity'].fillna(p_sub['tags_dict'].map(lambda d: d.get('amenity', 'educacion')))
                gdfs.append(p_sub)
            # Poligonos
            poly_mask = polys['amenity'].isin(amenities_edu) | polys['building'].isin({'school', 'university', 'kindergarten', 'college'}) | polys['tags_dict'].map(lambda d: d.get('amenity') in amenities_edu)
            poly_sub = polys[poly_mask].copy()
            if len(poly_sub) > 0:
                poly_sub['subtipo'] = poly_sub['amenity'].fillna(poly_sub['building']).fillna(poly_sub['tags_dict'].map(lambda d: d.get('amenity', 'educacion')))
                gdfs.append(poly_sub)

        elif cat_id == 'servicios':
            amenities_serv = {'bank', 'pharmacy', 'hospital', 'clinic', 'police', 'post_office', 'fire_station', 'doctors', 'dentist', 'townhall', 'marketplace', 'veterinary', 'community_centre', 'social_facility', 'cafe', 'restaurant', 'bar', 'pub', 'fast_food', 'fuel'}
            # Puntos
            p_mask = pts['amenity'].isin(amenities_serv) | pts['tags_dict'].map(lambda d: d.get('amenity') in amenities_serv or 'shop' in d)
            p_sub = pts[p_mask].copy()
            if len(p_sub) > 0:
                p_sub['subtipo'] = p_sub['amenity'].fillna(p_sub['tags_dict'].map(lambda d: d.get('shop') or d.get('amenity', 'servicio')))
                gdfs.append(p_sub)
            # Polígonos
            poly_mask = polys['amenity'].isin(amenities_serv) | polys['shop'].notnull() | polys['building'].isin({'commercial', 'retail', 'supermarket', 'hospital'}) | polys['tags_dict'].map(lambda d: d.get('amenity') in amenities_serv or 'shop' in d)
            poly_sub = polys[poly_mask].copy()
            if len(poly_sub) > 0:
                poly_sub['subtipo'] = poly_sub['shop'].fillna(poly_sub['amenity']).fillna(poly_sub['building']).fillna('servicio')
                gdfs.append(poly_sub)

        elif cat_id == 'transporte':
            # Puntos
            p_mask = pts['highway'].isin({'bus_stop', 'platform'}) | pts['tags_dict'].map(lambda d: d.get('railway') in {'station', 'subway_entrance', 'halt'} or d.get('public_transport') in {'platform', 'stop_position', 'station'} or d.get('amenity') in {'bus_station', 'taxi'})
            p_sub = pts[p_mask].copy()
            if len(p_sub) > 0:
                p_sub['subtipo'] = p_sub['highway'].fillna(p_sub['tags_dict'].map(lambda d: d.get('public_transport') or d.get('railway') or d.get('amenity', 'transporte')))
                gdfs.append(p_sub)
            # Líneas
            l_mask = lines['tags_dict'].map(lambda d: d.get('railway') in {'subway', 'rail', 'light_rail', 'tram'} or d.get('route') == 'bus')
            l_sub = lines[l_mask].copy()
            if len(l_sub) > 0:
                l_sub['subtipo'] = l_sub['tags_dict'].map(lambda d: d.get('railway') or d.get('route', 'linea_transporte'))
                gdfs.append(l_sub)
            # Polígonos
            poly_mask = polys['amenity'].isin({'bus_station', 'ferry_terminal'}) | polys['tags_dict'].map(lambda d: d.get('railway') in {'station', 'platform'})
            poly_sub = polys[poly_mask].copy()
            if len(poly_sub) > 0:
                poly_sub['subtipo'] = poly_sub['amenity'].fillna('estacion_transporte')
                gdfs.append(poly_sub)

        elif cat_id == 'movilidad_activa':
            # Puntos
            p_mask = pts['tags_dict'].map(lambda d: d.get('amenity') in {'bicycle_parking', 'bicycle_rental', 'bicycle_repair_station'})
            p_sub = pts[p_mask].copy()
            if len(p_sub) > 0:
                p_sub['subtipo'] = p_sub['tags_dict'].map(lambda d: d.get('amenity', 'estacionamiento_bici'))
                gdfs.append(p_sub)
            # Líneas
            l_mask = (lines['highway'] == 'cycleway') | lines['tags_dict'].map(lambda d: 'cycleway' in d or d.get('bicycle') in {'yes', 'designated'})
            l_sub = lines[l_mask].copy()
            if len(l_sub) > 0:
                l_sub['subtipo'] = 'ciclovia'
                gdfs.append(l_sub)

        elif cat_id == 'espacio_publico':
            leisures = {'park', 'playground', 'pitch', 'garden', 'square', 'recreation_ground', 'sports_centre', 'swimming_pool'}
            # Puntos
            p_mask = pts['tags_dict'].map(lambda d: d.get('leisure') in leisures or d.get('amenity') in {'bench', 'drinking_water'})
            p_sub = pts[p_mask].copy()
            if len(p_sub) > 0:
                p_sub['subtipo'] = p_sub['tags_dict'].map(lambda d: d.get('leisure') or d.get('amenity', 'espacio_publico'))
                gdfs.append(p_sub)
            # Polígonos
            poly_mask = polys['leisure'].isin(leisures) | polys['landuse'].isin({'village_green', 'grass', 'recreation_ground'}) | polys['tags_dict'].map(lambda d: d.get('leisure') in leisures)
            poly_sub = polys[poly_mask].copy()
            if len(poly_sub) > 0:
                poly_sub['subtipo'] = poly_sub['leisure'].fillna(poly_sub['landuse']).fillna('area_verde')
                gdfs.append(poly_sub)

        elif cat_id == 'patrimonio':
            # Puntos
            p_mask = pts['tags_dict'].map(lambda d: 'historic' in d or 'heritage' in d or d.get('amenity') in {'theatre', 'arts_centre', 'place_of_worship', 'museum'} or d.get('tourism') in {'museum', 'artwork', 'gallery'})
            p_sub = pts[p_mask].copy()
            if len(p_sub) > 0:
                p_sub['subtipo'] = p_sub['tags_dict'].map(lambda d: d.get('historic') or d.get('amenity') or d.get('tourism', 'patrimonio'))
                gdfs.append(p_sub)
            # Polígonos
            poly_mask = polys['historic'].notnull() | polys['amenity'].isin({'theatre', 'arts_centre', 'place_of_worship', 'museum'}) | polys['tourism'].isin({'museum', 'artwork', 'gallery'}) | polys['building'].isin({'church', 'cathedral', 'chapel', 'shrine'}) | polys['tags_dict'].map(lambda d: 'historic' in d or 'heritage' in d)
            poly_sub = polys[poly_mask].copy()
            if len(poly_sub) > 0:
                poly_sub['subtipo'] = poly_sub['historic'].fillna(poly_sub['tourism']).fillna(poly_sub['amenity']).fillna(poly_sub['building']).fillna('patrimonio')
                gdfs.append(poly_sub)

        elif cat_id == 'accesibilidad':
            # Puntos
            p_mask = (pts['highway'] == 'crossing') | pts['tags_dict'].map(lambda d: 'kerb' in d or 'tactile_paving' in d or 'wheelchair' in d or 'ramp' in d)
            p_sub = pts[p_mask].copy()
            if len(p_sub) > 0:
                p_sub['subtipo'] = p_sub['tags_dict'].map(lambda d: 'rebaje_kerb' if 'kerb' in d else ('cruce_accesible' if 'tactile_paving' in d else d.get('highway', 'accesibilidad')))
                gdfs.append(p_sub)
            # Líneas
            l_mask = lines['highway'].isin({'footway', 'pedestrian', 'steps'}) | lines['tags_dict'].map(lambda d: 'ramp' in d or 'wheelchair' in d)
            l_sub = lines[l_mask].copy()
            if len(l_sub) > 0:
                l_sub['subtipo'] = l_sub['highway'].fillna('pasarela_accesible')
                gdfs.append(l_sub)

        elif cat_id == 'biodiversidad':
            # Puntos
            p_mask = pts['tags_dict'].map(lambda d: d.get('natural') in {'tree', 'wood', 'scrub', 'tree_row', 'water', 'wetland'})
            p_sub = pts[p_mask].copy()
            if len(p_sub) > 0:
                p_sub['subtipo'] = p_sub['tags_dict'].map(lambda d: d.get('natural', 'arbol'))
                gdfs.append(p_sub)
            # Polígonos
            poly_mask = polys['natural'].isin({'wood', 'scrub', 'water', 'wetland'}) | polys['landuse'].isin({'forest'}) | polys['tags_dict'].map(lambda d: d.get('natural') in {'wood', 'scrub', 'water', 'wetland'})
            poly_sub = polys[poly_mask].copy()
            if len(poly_sub) > 0:
                poly_sub['subtipo'] = poly_sub['natural'].fillna(poly_sub['landuse']).fillna('cobertura_vegetal')
                gdfs.append(poly_sub)

        elif cat_id == 'edificaciones':
            # Polígonos de edificaciones representativas de toda la RM:
            # Seleccionar todas las edificaciones con nombre propio y tipologías estructuradas
            # más un muestreo homogéneo de 25.000 huellas residenciales en todas las comunas.
            b_mask = polys['building'].notnull() & (polys['building'] != 'no')
            poly_sub = polys[b_mask].copy()
            
            tipos_estructurados = {
                'apartments', 'commercial', 'retail', 'university', 'school', 'hospital',
                'civic', 'public', 'church', 'cathedral', 'chapel', 'industrial',
                'office', 'dormitory', 'residential', 'kindergarten', 'hotel'
            }
            nombradas = poly_sub[poly_sub['name'].notnull()]
            con_tipo = poly_sub[poly_sub['building'].isin(tipos_estructurados)]
            especificos = pd.concat([nombradas, con_tipo]).drop_duplicates(subset=['osm_id']).copy()
            
            resto = poly_sub[~poly_sub.index.isin(especificos.index)]
            if len(resto) > 25000:
                muestra_resto = resto.sample(25000, random_state=42)
            else:
                muestra_resto = resto
                
            poly_sub = gpd.GeoDataFrame(pd.concat([especificos, muestra_resto], ignore_index=True), crs=polys.crs)
            poly_sub['subtipo'] = poly_sub['building']
            gdfs.append(poly_sub)

        elif cat_id == 'cobertura_suelo':
            lu = {'residential', 'commercial', 'industrial', 'farmland', 'forest', 'meadow', 'basin', 'construction', 'cemetery', 'retail', 'recreation_ground', 'grass', 'allotments', 'orchard', 'vineyard'}
            nat = {'wood', 'scrub', 'water', 'grassland', 'bare_rock', 'wetland', 'sand'}
            poly_mask = polys['landuse'].isin(lu) | polys['natural'].isin(nat)
            poly_sub = polys[poly_mask].copy()
            if len(poly_sub) > 0:
                poly_sub['subtipo'] = poly_sub['landuse'].fillna(poly_sub['natural']).fillna('suelo')
                gdfs.append(poly_sub)

        # Consolidar
        if not gdfs:
            print(f"    [!] No se encontraron entidades para {cod_cat}")
            continue

        gdf_cat = gpd.GeoDataFrame(pd.concat(gdfs, ignore_index=True), crs=pts.crs)
        
        # Homogeneizar atributos estándar del Atlas VGI
        total_ent = len(gdf_cat)
        print(f"    Total entidades extraídas: {total_ent:,}")

        features_list = []
        for idx, row in gdf_cat.iterrows():
            geom = row.geometry
            if geom is None or geom.is_empty:
                continue
            
            osm_id = row.get('osm_id') or row.get('osm_way_id') or idx
            name_val = row.get('name')
            if not name_val or str(name_val).lower() == 'nan':
                name_val = row.get('subtipo') or nom_cat
                
            subt = row.get('subtipo')
            if not subt or str(subt).lower() == 'nan':
                subt = 'elemento'

            # Redondear coordenadas a 5 decimales (1.1m de precisión, reduce peso 40%)
            geom_json = mapping(geom)
            def round_c(c):
                if isinstance(c, (list, tuple)) and len(c) >= 2 and isinstance(c[0], (int, float)):
                    return [round(c[0], 5), round(c[1], 5)]
                elif isinstance(c, (list, tuple)):
                    return [round_c(sub) for sub in c]
                return c
            if 'coordinates' in geom_json:
                geom_json['coordinates'] = round_c(geom_json['coordinates'])

            # Bounding box del elemento para acelerar índice espacial cliente
            b = geom.bounds
            
            feat = {
                "type": "Feature",
                "id": f"osm_{osm_id}",
                "bbox": [round(b[0], 5), round(b[1], 5), round(b[2], 5), round(b[3], 5)],
                "properties": {
                    "id_vgi": f"osm_{osm_id}",
                    "osm_id": osm_id,
                    "categoria": cod_cat,
                    "categoria_id": cat_id,
                    "nombre": str(name_val),
                    "subtipo": str(subt),
                    "fuente": "Geofabrik, local-api",
                    "_fuente": "(Geofabrik, local-api)"
                },
                "geometry": geom_json
            }
            features_list.append(feat)

        fc = {
            "type": "FeatureCollection",
            "name": filename.replace(".geojson", ""),
            "metadata": {
                "codigo_categoria": cod_cat,
                "nombre_categoria": nom_cat,
                "total_entidades": len(features_list),
                "fuente": "(Geofabrik, local-api)",
                "fuente_nombre": fuente_str,
                "fuente_detalle": fuente_detalle,
                "origen_api": origen_api,
                "licencia": licencia_str,
                "proveedor": "Geofabrik GmbH",
                "dataset_origen": "chile-260927.osm.pbf",
                "filtro_espacial": "Región Metropolitana de Santiago (DPA 2023)",
                "fecha_corte": fecha_corte,
                "fecha_procesamiento": fecha_proc,
                "srs": "EPSG:4326 (WGS 84)"
            },
            "features": features_list
        }

        # Guardar en data/ y src/data/
        for target_dir in [DATA_DIR, SRC_DATA_DIR]:
            fpath = os.path.join(target_dir, filename)
            with open(fpath, "w", encoding="utf-8") as fp:
                json.dump(fc, fp, ensure_ascii=False, separators=(',', ':'))
        
        sz_mb = os.path.getsize(os.path.join(DATA_DIR, filename)) / (1024 * 1024)
        print(f"    ✓ Guardado {filename}: {len(features_list):,} entidades ({sz_mb:.2f} MB)")
        resultados_resumen.append((cod_cat, nom_cat, len(features_list), sz_mb))

        # Guardar capa en GeoPackage con índice espacial R-Tree
        try:
            if 'name' not in gdf_cat.columns: gdf_cat['name'] = None
            if 'subtipo' not in gdf_cat.columns: gdf_cat['subtipo'] = None
            gdf_cat_clean = gdf_cat[['geometry', 'name', 'subtipo']].copy()
            gdf_cat_clean['name'] = gdf_cat_clean['name'].fillna('').astype(str)
            gdf_cat_clean['subtipo'] = gdf_cat_clean['subtipo'].fillna('').astype(str)
            gdf_cat_clean['osm_id'] = gdf_cat_clean.index.astype(str)
            gdf_cat_clean['fuente'] = fuente_str
            gdf_cat_clean['origen_api'] = origen_api
            pyogrio.write_dataframe(gdf_cat_clean, GPKG_PATH, layer=cat_id, driver="GPKG", spatial_index=True)
            print(f"    ✓ Capa {cat_id} guardada en GeoPackage con índice espacial R-Tree")
        except Exception as e_gpkg:
            print(f"    [-] Nota GPKG {cat_id}: {e_gpkg}")

    print("\n" + "=" * 80)
    print("RESUMEN DE CAPAS REGIONALES EXTRAÍDAS DESDE GEOFABRIK (LOCAL-API)")
    print("=" * 80)
    for c_cod, c_nom, c_cnt, c_mb in resultados_resumen:
        print(f"  {c_cod:<8} | {c_nom:<32} | {c_cnt:>7,} entidades | {c_mb:>6.2f} MB")
    print(f"\nTiempo total de ejecución: {time.time()-t_global:.1f} segundos.")
    print("=" * 80)

if __name__ == '__main__':
    main()
