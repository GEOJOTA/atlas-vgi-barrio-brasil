#!/usr/bin/env python3
"""
descentralizar_capas_vgi.py
--------------------------
Descentraliza los 134 descriptores VGI (OpenStreetMap y GBIF) definidos en el
Diccionario de Datos en 134 capas vectoriales GeoJSON independientes y descargables.
Asigna cada capa a una de las 5 Dimensiones de Análisis de Módulo 01 en 100% Español.
Guarda los archivos simétricamente en data/ y src/data/.
"""

import json
import os
import re
import unicodedata

def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^a-zA-Z0-9]+', '_', text.lower()).strip('_')
    return text

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_SRC = os.path.join(ROOT_DIR, 'src', 'data')
DATA_ROOT = os.path.join(ROOT_DIR, 'data')
DICCIONARIO_PATH = os.path.join(ROOT_DIR, 'src', 'js', 'modulos', 'diccionario.js')

with open(DICCIONARIO_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

idx_start = text.find('const ETIQUETAS_TERRITORIALES_OSM = [')
idx_end = text.find('];', idx_start)
descriptors = json.loads(text[idx_start + len('const ETIQUETAS_TERRITORIALES_OSM = '):idx_end + 1])

print(f"[*] Cargados {len(descriptors)} descriptores desde diccionario.js")

# Mapeo a las 5 Dimensiones de Análisis de Módulo 01
cat_to_dim = {
    'CAT-01': 'sociourbana',       # Educación
    'CAT-02': 'socioeconomica',    # Comercio y Servicios
    'CAT-03': 'sociourbana',       # Transporte
    'CAT-04': 'sociourbana',       # Movilidad Activa
    'CAT-05': 'socioambiental',    # Espacio Público
    'CAT-06': 'sociourbana',       # Patrimonio
    'CAT-07': 'sociourbana',       # Accesibilidad
    'CAT-08': 'socioambiental',    # Biodiversidad
    'CAT-09': 'sociodemografica',  # Edificaciones y vivienda
    'CAT-10': 'socioambiental'     # Cobertura de suelo
}

def get_dimension(d):
    tag = d['tag']
    # Salud y emergencias a sociosanitaria
    if any(k in tag for k in ['pharmacy', 'hospital', 'clinic', 'dentist', 'veterinary', 'ambulance', 'defibrillator', 'social_facility']):
        return 'sociosanitaria'
    # Vivienda y demografía a sociodemografica
    if any(k in tag for k in ['residential', 'apartments', 'house', 'student_accommodation', 'community_centre', 'levels']):
        return 'sociodemografica'
    # Medio ambiente, arbolado, agua y residuos a socioambiental
    if any(k in tag for k in ['park', 'garden', 'pitch', 'playground', 'natural', 'tree', 'dwc:', 'genus=', 'recycling', 'waste', 'water', 'wetland', 'dog_park']):
        return 'socioambiental'
    # Comercio, servicios, bancos, gastronomía a socioeconomica
    if any(k in tag for k in ['shop=', 'bank', 'atm', 'cafe', 'restaurant', 'office=', 'marketplace', 'commercial', 'toll_booth']):
        return 'socioeconomica'
    # Movilidad, vialidad, equipamiento, educación, patrimonio a sociourbana
    return cat_to_dim.get(d['categoria'], 'sociourbana')

def get_geom_type(tag):
    if any(k in tag for k in ['building', 'landuse', 'pitch', 'park', 'playground', 'garden', 'marina', 'wetland']):
        return 'Polígonos'
    if any(k in tag for k in ['highway', 'cycleway', 'track', 'steps', 'waterway', 'railway=rail']):
        return 'Líneas'
    return 'Puntos'

def get_icon(tag, dim):
    icons = {
        'university': '🎓', 'college': '🏫', 'school': '🎒', 'kindergarten': '🧸', 'library': '📚',
        'hospital': '🏥', 'clinic': '🩺', 'pharmacy': '💊', 'dentist': '🦷', 'veterinary': '🐾',
        'fire_station': '🚒', 'police': '👮', 'post_office': '📮', 'bank': '🏦', 'atm': '🏧',
        'supermarket': '🛒', 'convenience': '🏪', 'bakery': '🥖', 'restaurant': '🍽️', 'cafe': '☕',
        'tree': '🌳', 'park': '🌲', 'garden': '🌷', 'playground': '🛝', 'recycling': '♻️',
        'bus_stop': '🚏', 'station': '🚇', 'cycleway': '🚲', 'bicycle_parking': '🚲', 'crossing': '🚶',
        'residential': '🏠', 'apartments': '🏢', 'house': '🏡', 'monument': '🏛️', 'church': '⛪',
        'memorial': '🕯️', 'street_lamp': '💡', 'waste_basket': '🗑️', 'community_centre': '🤝',
        'water': '💧', 'wetland': '🦆', 'cryptocarya': '🌿', 'maytenus': '🌱'
    }
    for k, ico in icons.items():
        if k in tag.lower():
            return ico
    if dim == 'sociosanitaria': return '🏥'
    if dim == 'socioambiental': return '🌿'
    if dim == 'sociodemografica': return '👥'
    if dim == 'socioeconomica': return '🏪'
    return '📍'

# Cargar fuentes de datos VGI disponibles
candidate_features = []

# 1. 10 capas VGI existentes
for c in ['educacion', 'servicios', 'transporte', 'movilidad_activa', 'espacio_publico', 'patrimonio', 'accesibilidad', 'biodiversidad', 'edificaciones', 'cobertura_suelo']:
    p = os.path.join(DATA_SRC, f'capa_{c}.geojson')
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            gj = json.load(f)
            candidate_features.extend(gj.get('features', []))

# 2. capa_osm_rm_completo_vgi.geojson (para Santiago y RM)
p_comp = os.path.join(DATA_SRC, 'capa_osm_rm_completo_vgi.geojson')
if os.path.exists(p_comp):
    with open(p_comp, 'r', encoding='utf-8') as f:
        gj = json.load(f)
        for feat in gj.get('features', []):
            geom = feat.get('geometry')
            if not geom: continue
            coords = geom.get('coordinates')
            if geom.get('type') == 'Point' and coords:
                lon, lat = coords[:2]
                if -70.75 <= lon <= -70.58 and -33.52 <= lat <= -33.38:
                    candidate_features.append(feat)

print(f"[*] Total entidades candidatas recopiladas: {len(candidate_features)}")

# Procesar y descentralizar cada descriptor
catalogo_vgi = []
seen_slugs = set()

for idx, d in enumerate(descriptors, 1):
    tag = d['tag']
    dim = get_dimension(d)
    raw_name = d['significado'].split('/')[0].strip()
    slug_base = slugify(raw_name)
    if not slug_base or slug_base in seen_slugs:
        slug_base = f"{slug_base}_{idx}"
    seen_slugs.add(slug_base)
    slug = f"vgi_{slug_base}"

    if '=' in tag:
        k, v = tag.split('=', 1)
    else:
        k, v = tag, '*'

    matched_features = []
    seen_fids = set()

    for feat in candidate_features:
        props = feat.get('properties', {})
        fid = props.get('id_vgi') or props.get('id') or props.get('osm_id')
        if fid and fid in seen_fids:
            continue

        match = False
        # Chequeo directo de clave-valor
        if k in props:
            val = str(props[k])
            if v == '*' or val == v or (v in val):
                match = True
        # Chequeo por subtipo
        sub = str(props.get('subtipo', ''))
        if sub:
            if v != '*' and sub == v:
                match = True
            elif v == '*' and sub == k:
                match = True

        if match:
            # Normalizar atributos en Español
            clean_props = {
                'id_vgi': str(fid or f"VGI_{slug}_{len(matched_features)+1}"),
                'nombre': props.get('nombre') or props.get('name') or raw_name,
                'descriptor_vgi': raw_name,
                'etiqueta_osm': tag,
                'categoria_vgi': d['categoria'],
                'dimension_analisis': dim,
                'institucion_custodia': d.get('institucion', 'Comunidad OpenStreetMap (VGI)'),
                'direccion': props.get('direccion') or props.get('addr:street'),
                'fuente': props.get('fuente') or 'OpenStreetMap / GBIF (VGI)',
                'licencia': 'ODbL 1.0 / CC BY 4.0'
            }
            clean_feat = {
                'type': 'Feature',
                'geometry': feat.get('geometry'),
                'properties': clean_props
            }
            matched_features.append(clean_feat)
            if fid: seen_fids.add(fid)

    geojson_obj = {
        'type': 'FeatureCollection',
        'name': f"Capa VGI: {d['significado']}",
        'crs': {
            'type': 'name',
            'properties': { 'name': 'urn:ogc:def:crs:OGC:1.3:CRS84' }
        },
        'metadata': {
            'id': slug,
            'nombre': d['significado'],
            'descriptor': raw_name,
            'tag': tag,
            'categoria': d['categoria'],
            'dimension': dim,
            'institucion': d.get('institucion', 'Comunidad OpenStreetMap (VGI)'),
            'licencia': 'ODbL 1.0 (OpenStreetMap) / CC BY 4.0 (GBIF)',
            'total_entidades': len(matched_features),
            'fecha_generacion': '2026-11-09'
        },
        'features': matched_features
    }

    # Guardar en src/data/ y en data/
    fname = f"capa_{slug}.geojson"
    path_src = os.path.join(DATA_SRC, fname)
    path_root = os.path.join(DATA_ROOT, fname)

    with open(path_src, 'w', encoding='utf-8') as f:
        json.dump(geojson_obj, f, ensure_ascii=False)
    with open(path_root, 'w', encoding='utf-8') as f:
        json.dump(geojson_obj, f, ensure_ascii=False)

    catalogo_vgi.append({
        'id': slug,
        'tag': tag,
        'nombre': d['significado'],
        'nombreCorto': raw_name,
        'categoriaVGI': d['categoria'],
        'dimension': dim,
        'institucion': d.get('institucion', 'Comunidad OpenStreetMap (VGI)'),
        'archivoLocal': f"data/{fname}",
        'icono': get_icon(tag, dim),
        'geometria': get_geom_type(tag),
        'totalEntidades': len(matched_features),
        'descripcion': f"Catastro colaborativo VGI de {raw_name.lower()} levantado por la comunidad en OpenStreetMap y GBIF.",
        'tipo': 'Colaborativa VGI'
    })

print(f"[✓] 134 GeoJSONs descentralizados generados exitosamente en src/data/ y data/.")

# Exportar catálogo JS para el frontend
out_js = os.path.join(ROOT_DIR, 'src', 'js', 'modulos', 'catalogo_vgi_descentralizado.js')
with open(out_js, 'w', encoding='utf-8') as f:
    f.write("/* catalogo_vgi_descentralizado.js — 134 Descriptores VGI Descentralizados */\n")
    f.write("const CATALOGO_VGI_DESCENTRALIZADO = ")
    json.dump(catalogo_vgi, f, ensure_ascii=False, indent=2)
    f.write(";\n\n")
    f.write("if (typeof window !== 'undefined') {\n  window.CATALOGO_VGI_DESCENTRALIZADO = CATALOGO_VGI_DESCENTRALIZADO;\n}\n")

print(f"[✓] Catálogo JS exportado en {out_js}")
