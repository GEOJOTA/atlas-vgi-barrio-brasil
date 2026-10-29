#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/procesar_osm_geofabrik_usuario.py
-------------------------------------------
Procesa y clasifica los 4 archivos GeoJSON de OpenStreetMap Geofabrik filtrados
manualmente por el usuario para la Región Metropolitana:
- Geofabrik_Chile_Points.geojson
- Geofabrik_Chile_Lines.geojson
- Geofabrik_Chile_Multipolygons.geojson
- Geofabrik_Chile_Multistring.geojson

Aplica la taxonomía expandida de OSM hacia las 10 Macro-categorías temáticas (CAT-01 a CAT-10).
Genera los 10 archivos GeoJSON optimizados con Bbox precomputado y la fuente formal 'Geofabrik (Extracto RM)'.
"""

import os
import sys
import json
import re
import time
import random

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

RUTA_USUARIO = r"C:\Users\PT1261256\Desktop\16_09_2026\Base de datos VGI\descargadas nuevamente 25_09\Manual 2\nuevas 26-09\OSM Geofabrik"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
SRC_DATA_DIR = os.path.join(BASE_DIR, "src", "data")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SRC_DATA_DIR, exist_ok=True)

CATEGORIAS = [
    ("CAT-01", "educacion", "Educación y Universidad", "capa_osm_rm_cat01_educacion.geojson"),
    ("CAT-02", "servicios", "Servicios, Comercio y Abastecimiento", "capa_osm_rm_cat02_servicios.geojson"),
    ("CAT-03", "transporte", "Movilidad y Transporte", "capa_osm_rm_cat03_transporte.geojson"),
    ("CAT-04", "movilidad_activa", "Movilidad Activa y Ciclovías", "capa_osm_rm_cat04_movilidad_activa.geojson"),
    ("CAT-05", "espacio_publico", "Áreas Verdes y Espacio Público", "capa_osm_rm_cat05_espacio_publico.geojson"),
    ("CAT-06", "patrimonio", "Patrimonio y Cultura", "capa_osm_rm_cat06_patrimonio.geojson"),
    ("CAT-07", "accesibilidad", "Accesibilidad Universal y Cruces", "capa_osm_rm_cat07_accesibilidad.geojson"),
    ("CAT-08", "biodiversidad", "Biodiversidad Urbana", "capa_osm_rm_cat08_biodiversidad.geojson"),
    ("CAT-09", "edificaciones", "Edificaciones y Huella Urbana", "capa_osm_rm_cat09_edificaciones.geojson"),
    ("CAT-10", "cobertura_suelo", "Coberturas y Usos de Suelo", "capa_osm_rm_cat10_cobertura_suelo.geojson")
]

HSTORE_RE = re.compile(r'"([^"]+)"\s*=>\s*"([^"]*)"')

def parse_hstore(text):
    if not text or not isinstance(text, str):
        return {}
    return {m.group(1): m.group(2) for m in HSTORE_RE.finditer(text)}

def compute_bounds_and_round(geom):
    gtype = geom.get('type')
    coords = geom.get('coordinates', [])
    if not coords:
        return None, None
    min_x, min_y, max_x, max_y = 1e9, 1e9, -1e9, -1e9
    
    def process_coord(c):
        nonlocal min_x, min_y, max_x, max_y
        x = round(c[0], 5)
        y = round(c[1], 5)
        if x < min_x: min_x = x
        if x > max_x: max_x = x
        if y < min_y: min_y = y
        if y > max_y: max_y = y
        return [x, y]
        
    try:
        if gtype == 'Point':
            r_coords = process_coord(coords)
        elif gtype in ('LineString', 'MultiPoint'):
            r_coords = [process_coord(c) for c in coords]
        elif gtype in ('Polygon', 'MultiLineString'):
            r_coords = [[process_coord(c) for c in ring] for ring in coords]
        elif gtype == 'MultiPolygon':
            r_coords = [[[process_coord(c) for c in ring] for ring in poly] for poly in coords]
        else:
            return None, None
    except Exception:
        return None, None
        
    geom['coordinates'] = r_coords
    bbox = [min_x, min_y, max_x, max_y]
    return geom, bbox

def clasificar_feature(props):
    tags = dict(props)
    ot = props.get('other_tags')
    if ot:
        tags.update(parse_hstore(ot))
    
    amenity = tags.get('amenity') or ''
    shop = tags.get('shop') or ''
    highway = tags.get('highway') or ''
    railway = tags.get('railway') or ''
    leisure = tags.get('leisure') or ''
    historic = tags.get('historic') or ''
    heritage = tags.get('heritage') or ''
    natural = tags.get('natural') or ''
    landuse = tags.get('landuse') or ''
    building = tags.get('building') or ''
    craft = tags.get('craft') or ''
    office = tags.get('office') or ''
    tourism = tags.get('tourism') or ''
    crossing = tags.get('crossing') or ''
    kerb = tags.get('kerb') or ''
    tactile_paving = tags.get('tactile_paving') or ''
    wheelchair = tags.get('wheelchair') or ''
    cycleway = tags.get('cycleway') or ''
    bicycle = tags.get('bicycle') or ''
    route = tags.get('route') or ''
    public_transport = tags.get('public_transport') or ''
    waterway = tags.get('waterway') or ''
    footway = tags.get('footway') or ''
    
    name = props.get('name') or tags.get('name') or ''
    
    resultados = []
    
    # CAT-01: Educación y Universidad
    if amenity in {'school', 'kindergarten', 'university', 'college', 'library', 'childcare', 
                   'music_school', 'language_school', 'prep_school', 'research_institute', 
                   'educational_institution', 'driving_school', 'toy_library'} or \
       building in {'school', 'university', 'college', 'kindergarten', 'library'} or \
       office in {'educational_institution', 'school'}:
        subt = amenity or building or office or 'educacion'
        resultados.append(('CAT-01', 'educacion', subt, name))
        
    # CAT-02: Servicios, Comercio y Abastecimiento
    if shop or craft or office or \
       amenity in {'pharmacy', 'bank', 'atm', 'marketplace', 'post_office', 'police', 
                   'fire_station', 'hospital', 'clinic', 'doctors', 'dentist', 'veterinary', 
                   'courthouse', 'townhall', 'community_centre', 'social_facility', 
                   'restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'ice_cream', 'food_court', 
                   'fuel', 'charging_station', 'car_wash', 'public_bath', 'public_bookcase', 
                   'waste_transfer_station', 'recycling', 'telephone'}:
        subt = shop or amenity or craft or office or 'servicio'
        resultados.append(('CAT-02', 'servicios', subt, name))
        
    # CAT-03: Movilidad y Transporte
    if highway in {'bus_stop', 'platform'} or \
       railway in {'station', 'stop', 'subway_entrance', 'subway', 'tram', 'tram_stop', 'rail', 'light_rail', 'platform', 'halt'} or \
       amenity in {'bus_station', 'ferry_terminal', 'taxi', 'car_rental', 'car_sharing', 'bicycle_parking', 'bicycle_rental', 'parking', 'parking_space', 'parking_entrance', 'motorcycle_parking'} or \
       public_transport or \
       route in {'bus', 'subway', 'train', 'trolleybus', 'tram', 'light_rail'}:
        subt = route or railway or highway or amenity or public_transport or 'transporte'
        resultados.append(('CAT-03', 'transporte', subt, name))
        
    # CAT-04: Movilidad Activa y Ciclovías
    if highway == 'cycleway' or cycleway or bicycle in {'yes', 'designated', 'permissive'} or route == 'bicycle' or \
       highway in {'pedestrian', 'living_street', 'steps', 'path'} or \
       tags.get('cycleway:left') or tags.get('cycleway:right') or tags.get('cycleway:both'):
        subt = cycleway or (highway if highway == 'cycleway' else 'ciclovia_o_peatonal')
        resultados.append(('CAT-04', 'movilidad_activa', subt, name))
        
    # CAT-05: Áreas Verdes y Espacio Público
    if leisure in {'park', 'garden', 'playground', 'pitch', 'sports_centre', 'recreation_ground', 
                   'track', 'stadium', 'dog_park', 'nature_reserve', 'fitness_station', 'swimming_pool', 'water_park'} or \
       amenity in {'place_of_worship', 'fountain', 'bench', 'shelter', 'bbq'} or \
       tourism in {'picnic_site', 'viewpoint'}:
        subt = leisure or amenity or tourism or 'espacio_publico'
        resultados.append(('CAT-05', 'espacio_publico', subt, name))
        
    # CAT-06: Patrimonio y Cultura
    if historic or heritage or \
       tourism in {'museum', 'artwork', 'gallery', 'attraction'} or \
       amenity in {'theatre', 'arts_centre', 'cinema', 'cultural_centre', 'planetarium'}:
        subt = historic or heritage or tourism or amenity or 'patrimonio'
        resultados.append(('CAT-06', 'patrimonio', subt, name))
        
    # CAT-07: Accesibilidad Universal y Cruces
    if highway in {'crossing', 'elevator'} or crossing or kerb or tactile_paving or \
       wheelchair in {'yes', 'designated', 'limited'} or footway == 'crossing' or \
       tags.get('traffic_signals:vibration') == 'yes' or tags.get('traffic_signals:sound') == 'yes':
        subt = crossing or kerb or ('elevador' if highway == 'elevator' else 'cruce_accesible')
        resultados.append(('CAT-07', 'accesibilidad', subt, name))
        
    # CAT-08: Biodiversidad Urbana
    if natural in {'tree', 'wood', 'scrub', 'tree_row', 'water', 'wetland', 'grassland', 'bare_rock', 'heath', 'valley', 'ridge'} or \
       landuse in {'forest', 'orchard', 'vineyard', 'plant_nursery'} or \
       waterway in {'river', 'stream', 'canal', 'drain', 'ditch', 'waterfall'}:
        subt = natural or waterway or landuse or 'biodiversidad'
        resultados.append(('CAT-08', 'biodiversidad', subt, name))
        
    # CAT-09: Edificaciones y Huella Urbana
    if building and building != 'no':
        subt = building
        es_especifico = bool(name or building in {
            'apartments', 'commercial', 'retail', 'university', 'school', 'hospital',
            'civic', 'public', 'church', 'cathedral', 'chapel', 'industrial',
            'office', 'dormitory', 'residential', 'kindergarten', 'hotel', 'government',
            'train_station', 'transportation', 'college'
        })
        resultados.append(('CAT-09', 'edificaciones', subt, name, es_especifico))
        
    # CAT-10: Coberturas y Usos de Suelo
    if landuse in {'residential', 'commercial', 'industrial', 'retail', 'recreation_ground', 
                   'cemetery', 'farmland', 'grass', 'allotments', 'construction', 'basin', 
                   'meadow', 'forest', 'military', 'quarry', 'landfill', 'greenfield', 'brownfield'} or \
       natural in {'grassland', 'wood', 'scrub', 'water', 'sand', 'bare_rock', 'wetland'}:
        subt = landuse or natural or 'uso_suelo'
        resultados.append(('CAT-10', 'cobertura_suelo', subt, name))
        
    return resultados

def procesar():
    print("=" * 80)
    print("PROCESAMIENTO Y CLASIFICACIÓN OSM GEOFABRIK RM (DATOS USUARIO)")
    print("=" * 80)
    
    # Contenedores para cada categoría
    features_por_cat = {cat_id: [] for _, cat_id, _, _ in CATEGORIAS}
    edificaciones_resto = [] # para muestreo de huella residencial
    
    archivos = [
        "Geofabrik_Chile_Points.geojson",
        "Geofabrik_Chile_Lines.geojson",
        "Geofabrik_Chile_Multipolygons.geojson",
        "Geofabrik_Chile_Multistring.geojson"
    ]
    
    t_global = time.time()
    
    for nom_archivo in archivos:
        ruta_arch = os.path.join(RUTA_USUARIO, nom_archivo)
        if not os.path.exists(ruta_arch):
            print(f"[-] Archivo no encontrado: {ruta_arch}")
            continue
            
        sz_mb = os.path.getsize(ruta_arch) / (1024 * 1024)
        print(f"\n[*] Leyendo {nom_archivo} ({sz_mb:.2f} MB)...", flush=True)
        t0 = time.time()
        
        n_lineas = 0
        n_features = 0
        
        with open(ruta_arch, 'r', encoding='utf-8', errors='ignore') as fp:
            for line in fp:
                n_lineas += 1
                line_s = line.strip()
                if not (line_s.startswith('{"type":"Feature"') or line_s.startswith('{"type": "Feature"')):
                    continue
                if line_s.endswith(','):
                    line_s = line_s[:-1]
                    
                try:
                    feat = json.loads(line_s)
                except Exception:
                    continue
                    
                geom = feat.get('geometry')
                if not geom:
                    continue
                    
                # Redondear y calcular Bbox
                geom_rnd, bbox = compute_bounds_and_round(geom)
                if not geom_rnd or not bbox:
                    continue
                    
                props = feat.get('properties') or {}
                osm_id = props.get('osm_id') or props.get('osm_way_id') or f"u_{n_features}"
                
                # Clasificar con la taxonomía enriquecida
                clasificaciones = clasificar_feature(props)
                if not clasificaciones:
                    continue
                    
                n_features += 1
                
                for item in clasificaciones:
                    if len(item) == 4:
                        cod_cat, cat_id, subt, name = item
                        es_especifico = True
                    else:
                        cod_cat, cat_id, subt, name, es_especifico = item
                        
                    nombre_val = name if name else (subt.title() if subt else cod_cat)
                    
                    feat_vgi = {
                        "type": "Feature",
                        "id": f"osm_{osm_id}",
                        "bbox": bbox,
                        "properties": {
                            "id_vgi": f"osm_{osm_id}",
                            "osm_id": osm_id,
                            "categoria": cod_cat,
                            "categoria_id": cat_id,
                            "nombre": nombre_val,
                            "subtipo": subt,
                            "fuente": "Geofabrik (Extracto RM)",
                            "_fuente": "Geofabrik (Extracto RM)"
                        },
                        "geometry": geom_rnd
                    }
                    
                    if cat_id == 'edificaciones':
                        if es_especifico:
                            features_por_cat[cat_id].append(feat_vgi)
                        else:
                            edificaciones_resto.append(feat_vgi)
                    else:
                        features_por_cat[cat_id].append(feat_vgi)
                        
        print(f"    Leídas {n_lineas:,} líneas, {n_features:,} entidades clasificadas en {time.time()-t0:.2f}s")

    # Muestreo estratificado de edificaciones residenciales genéricas para optimizar peso web
    print(f"\n[*] Edificaciones: {len(features_por_cat['edificaciones']):,} estructuradas/nombradas + {len(edificaciones_resto):,} genéricas.")
    random.seed(42)
    if len(edificaciones_resto) > 28000:
        muestra_residencial = random.sample(edificaciones_resto, 28000)
    else:
        muestra_residencial = edificaciones_resto
    features_por_cat['edificaciones'].extend(muestra_residencial)
    print(f"    Total final CAT-09 (Edificaciones): {len(features_por_cat['edificaciones']):,} huellas urbanas.")

    # Guardar los 10 archivos GeoJSON
    print("\n" + "=" * 80)
    print("FASE 2: GUARDADO DE LAS 10 MACROCATEGORÍAS OPTIMIZADAS")
    print("=" * 80)
    
    total_general = 0
    fecha_proc = time.strftime("%Y-%m-%d %H:%M:%S")
    
    for cod_cat, cat_id, nom_cat, filename in CATEGORIAS:
        feats = features_por_cat[cat_id]
        total_feats = len(feats)
        total_general += total_feats
        
        fc = {
            "type": "FeatureCollection",
            "name": filename.replace(".geojson", ""),
            "metadata": {
                "codigo_categoria": cod_cat,
                "nombre_categoria": nom_cat,
                "total_entidades": total_feats,
                "fuente": "Geofabrik (Extracto RM)",
                "fuente_nombre": "Geofabrik (Extracto RM)",
                "fuente_detalle": "Geofabrik GmbH (chile-260927.osm.pbf · Extracto RM)",
                "metodo_adquisicion": "Descarga Geofabrik (Dump PBF regional)",
                "licencia": "ODbL 1.0 (© OpenStreetMap contributors / Geofabrik GmbH)",
                "proveedor": "Geofabrik GmbH",
                "dataset_origen": "Geofabrik Chile (Filtrado RM)",
                "filtro_espacial": "Región Metropolitana de Santiago (DPA 2023)",
                "fecha_procesamiento": fecha_proc,
                "srs": "EPSG:4326 (WGS 84)"
            },
            "features": feats
        }
        
        # Guardar en data/ y src/data/
        for target_dir in [DATA_DIR, SRC_DATA_DIR]:
            dest_path = os.path.join(target_dir, filename)
            with open(dest_path, 'w', encoding='utf-8') as out_fp:
                json.dump(fc, out_fp, separators=(',', ':'), ensure_ascii=False)
                
        sz_mb = os.path.getsize(os.path.join(DATA_DIR, filename)) / (1024 * 1024)
        print(f"  [✓] {cod_cat} ({nom_cat}): {total_feats:,} entidades -> {sz_mb:.2f} MB")
        
    print(f"\n================================================================================")
    print(f"PROCESAMIENTO COMPLETADO EXITOSAMENTE EN {time.time()-t_global:.1f}s")
    print(f"TOTAL ENTIDADES CLASIFICADAS EN LA RM: {total_general:,}")
    print(f"================================================================================")

if __name__ == '__main__':
    procesar()
