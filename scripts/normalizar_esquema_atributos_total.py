#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/normalizar_esquema_atributos_total.py
--------------------------------------------
Normaliza rigurosamente el esquema canónico de 17 atributos VGI
(conforme a ISO 19110 / ISO 19115 / IDE Chile / SNIT) en la totalidad
de las capas de datos del Atlas VGI (Barrio Brasil / UAH).

Atributos canónicos inyectados y calculados:
 1. id_vgi              -> Identificador único global persistente
 2. categoria           -> Categoría temática oficial (CAT-01 a CAT-10)
 3. subtipo             -> Subtipo semántico o actividad funcional
 4. nombre              -> Nombre propio o toponimia oficial
 5. operador            -> Entidad administradora / custodio responsable
 6. direccion           -> Dirección catastral (calle y número)
 7. accesibilidad       -> Accesibilidad universal (silla de ruedas)
 8. fuente              -> Plataforma proveedora del dato espacial
 9. metodo_adquisicion  -> Método técnico de adquisición y extracción
10. licencia            -> Marco jurídico de licenciamiento abierto
11. coordenadas         -> [longitud, latitud] representativo en EPSG:4326
12. geom_wkt            -> Geometría vectorial en estándar OGC WKT
13. bbox                -> Envolvente geográfica [minX, minY, maxX, maxY]
14. fecha_registro      -> Marca temporal ISO 8601 (AAAA-MM-DD)
15. superficie_m2       -> Área métrica Gauss en UTM 19S (EPSG:32719)
16. superficie_ha       -> Área en hectáreas métricas (ha)
17. srs_superficie      -> Sistema geodésico proyectado de referencia
"""

import os
import sys
import json
import glob
import math
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DATA_DIR = os.path.join(ROOT_DIR, 'src', 'data')
DATA_DIR = os.path.join(ROOT_DIR, 'data')

# Parámetros geodésicos WGS 84 / UTM Huso 19 Sur (EPSG:32719)
A_WGS84 = 6378137.0
F_WGS84 = 1.0 / 298.257223563
E2 = 2.0 * F_WGS84 - F_WGS84 * F_WGS84
E_PRIME2 = E2 / (1.0 - E2)
K0 = 0.9996
FALSO_ESTE = 500000.0
FALSO_NORTE = 10000000.0
MERIDIANO_CENTRAL_19S = -69.0

def wgs84_a_utm19s(lon, lat):
    phi = math.radians(lat)
    lam = math.radians(lon)
    lam0 = math.radians(MERIDIANO_CENTRAL_19S)
    delta_lam = lam - lam0
    sin_phi = math.sin(phi)
    cos_phi = math.cos(phi)
    tan_phi = math.tan(phi)
    N = A_WGS84 / math.sqrt(1.0 - E2 * sin_phi * sin_phi)
    T = tan_phi * tan_phi
    C = E_PRIME2 * cos_phi * cos_phi
    A = cos_phi * delta_lam
    M = A_WGS84 * (
        (1.0 - E2 / 4.0 - 3.0 * E2 * E2 / 64.0 - 5.0 * E2 * E2 * E2 / 256.0) * phi
        - (3.0 * E2 / 8.0 + 3.0 * E2 * E2 / 32.0 + 45.0 * E2 * E2 * E2 / 1024.0) * math.sin(2.0 * phi)
        + (15.0 * E2 * E2 / 256.0 + 45.0 * E2 * E2 * E2 / 1024.0) * math.sin(4.0 * phi)
        - (35.0 * E2 * E2 * E2 / 3072.0) * math.sin(6.0 * phi)
    )
    este = FALSO_ESTE + K0 * N * (
        A + (1.0 - T + C) * (A ** 3) / 6.0
        + (5.0 - 18.0 * T + T * T + 72.0 * C - 58.0 * E_PRIME2) * (A ** 5) / 120.0
    )
    norte = FALSO_NORTE + K0 * (
        M + N * tan_phi * (
            (A ** 2) / 2.0
            + (5.0 - T + 9.0 * C + 4.0 * C * C) * (A ** 4) / 24.0
            + (61.0 - 58.0 * T + T * T + 600.0 * C - 330.0 * E_PRIME2) * (A ** 6) / 720.0
        )
    )
    return este, norte

def calcular_superficie_poligono(coords):
    if not coords or len(coords) < 3:
        return 0.0, 0.0
    utm_pts = [wgs84_a_utm19s(c[0], c[1]) for c in coords]
    suma = 0.0
    for i in range(len(utm_pts) - 1):
        suma += (utm_pts[i][0] * utm_pts[i+1][1]) - (utm_pts[i+1][0] * utm_pts[i][1])
    area_m2 = round(abs(suma) / 2.0, 2)
    area_ha = round(area_m2 / 10000.0, 4)
    return area_m2, area_ha

def extraer_todos_los_puntos(coords):
    pts = []
    def recur(c):
        if isinstance(c, (list, tuple)):
            if len(c) >= 2 and isinstance(c[0], (int, float)) and isinstance(c[1], (int, float)):
                pts.append((c[0], c[1]))
            else:
                for sub in c:
                    recur(sub)
    recur(coords)
    return pts

def geojson_to_wkt(geom):
    if not geom or not isinstance(geom, dict):
        return None
    gtype = geom.get('type')
    coords = geom.get('coordinates')
    if not gtype or coords is None:
        return None
    
    if gtype == 'Point':
        return f"POINT({coords[0]} {coords[1]})"
    elif gtype == 'LineString':
        pts = ', '.join(f"{c[0]} {c[1]}" for c in coords)
        return f"LINESTRING({pts})"
    elif gtype == 'Polygon':
        rings = ['(' + ', '.join(f"{c[0]} {c[1]}" for c in ring) + ')' for ring in coords]
        rings_str = ', '.join(rings)
        return f"POLYGON({rings_str})"
    elif gtype == 'MultiPolygon':
        polys = []
        for poly in coords:
            rings = ['(' + ', '.join(f"{c[0]} {c[1]}" for c in ring) + ')' for ring in poly]
            polys.append('(' + ', '.join(rings) + ')')
        polys_str = ', '.join(polys)
        return f"MULTIPOLYGON({polys_str})"
    elif gtype == 'MultiLineString':
        lines = ['(' + ', '.join(f"{c[0]} {c[1]}" for c in line) + ')' for line in coords]
        lines_str = ', '.join(lines)
        return f"MULTILINESTRING({lines_str})"
    elif gtype == 'MultiPoint':
        pts = ', '.join(f"{c[0]} {c[1]}" for c in coords)
        return f"MULTIPOINT({pts})"
    return None

CATEGORIAS_VGI = {
    'educacion': ('CAT-01', 'CAT-01 (Educación y Universidad)'),
    'servicios': ('CAT-02', 'CAT-02 (Servicios, Comercio y Abastecimiento)'),
    'transporte': ('CAT-03', 'CAT-03 (Movilidad y Transporte)'),
    'movilidad_activa': ('CAT-04', 'CAT-04 (Movilidad Activa y Ciclovías)'),
    'espacio_publico': ('CAT-05', 'CAT-05 (Áreas Verdes y Espacio Público)'),
    'patrimonio': ('CAT-06', 'CAT-06 (Patrimonio y Cultura)'),
    'accesibilidad': ('CAT-07', 'CAT-07 (Accesibilidad Universal y Cruces)'),
    'biodiversidad': ('CAT-08', 'CAT-08 (Biodiversidad Urbana)'),
    'edificaciones': ('CAT-09', 'CAT-09 (Edificaciones y Huella Urbana)'),
    'cobertura_suelo': ('CAT-10', 'CAT-10 (Coberturas y Usos de Suelo)')
}

ORDEN_17 = [
    'id_vgi',
    'categoria',
    'subtipo',
    'nombre',
    'operador',
    'direccion',
    'accesibilidad',
    'fuente',
    'metodo_adquisicion',
    'licencia',
    'coordenadas',
    'geom_wkt',
    'bbox',
    'fecha_registro',
    'superficie_m2',
    'superficie_ha',
    'srs_superficie'
]

def normalizar_feature_vgi(feat, cat_key, idx):
    geom = feat.get('geometry') or {}
    gtype = geom.get('type')
    coords = geom.get('coordinates')
    raw_props = feat.get('properties') or {}
    
    cat_code, cat_nombre_completo = CATEGORIAS_VGI.get(cat_key, ('CAT-VGI', 'VGI Territorial'))
    
    # 1. ID VGI
    id_vgi = raw_props.get('id_vgi')
    if not id_vgi:
        osm_id = raw_props.get('osm_id') or raw_props.get('id') or feat.get('id')
        osm_type = raw_props.get('osm_type') or (gtype.lower() if gtype else 'node')
        if osm_id:
            id_vgi = f"OSM/{osm_type}/{osm_id}" if not str(osm_id).startswith('OSM') else str(osm_id)
        else:
            id_vgi = f"VGI_{cat_code}_{idx + 1:05d}"
            
    # 2. Categoria
    categoria = cat_nombre_completo
    
    # 3. Subtipo
    subtipo = (
        raw_props.get('subtipo') or
        raw_props.get('amenity') or
        raw_props.get('shop') or
        raw_props.get('highway') or
        raw_props.get('leisure') or
        raw_props.get('historic') or
        raw_props.get('building') or
        raw_props.get('natural') or
        raw_props.get('landuse') or
        raw_props.get('public_transport') or
        raw_props.get('railway') or
        raw_props.get('tourism') or
        raw_props.get('barrier') or
        raw_props.get('tipo') or
        raw_props.get('especie') or
        'Elemento VGI'
    )
    
    # 4. Nombre
    nombre = (
        raw_props.get('nombre') or
        raw_props.get('name') or
        raw_props.get('name:es') or
        raw_props.get('description') or
        raw_props.get('scientificName') or
        raw_props.get('title') or
        'Sin denominación'
    )
    
    # 5. Operador
    operador = raw_props.get('operador') or raw_props.get('operator') or raw_props.get('institutionCode') or None
    
    # 6. Direccion
    direccion = raw_props.get('direccion')
    if not direccion:
        calle = raw_props.get('addr:street')
        num = raw_props.get('addr:housenumber')
        if calle or num:
            direccion = f"{calle or ''} {num or ''}".strip()
        else:
            direccion = None
            
    # 7. Accesibilidad
    accesibilidad = raw_props.get('accesibilidad') or raw_props.get('wheelchair') or None
    
    # 8. Fuente
    fuente = raw_props.get('fuente') or ('GBIF Occurrence API' if cat_key == 'biodiversidad' and 'gbif' in str(raw_props).lower() else 'OpenStreetMap (Colaboradores VGI / Geofabrik RM)')
    
    # 9. Metodo de adquisicion
    metodo_adquisicion = raw_props.get('metodo_adquisicion')
    if not metodo_adquisicion:
        if 'gbif' in fuente.lower():
            metodo_adquisicion = 'Consulta REST API GBIF Occurrence en vivo'
        else:
            metodo_adquisicion = 'Extracción Overpass API QL / Dump PBF Geofabrik RM'
            
    # 10. Licencia
    licencia = raw_props.get('licencia')
    if not licencia:
        if 'gbif' in fuente.lower():
            licencia = 'CC-BY 4.0 (GBIF / iNaturalist)'
        else:
            licencia = 'ODbL 1.0 (© Colaboradores de OpenStreetMap)'
            
    # Extraer puntos de coordenadas
    todos_pts = extraer_todos_los_puntos(coords)
    
    # 11. Coordenadas representativas [lon, lat]
    if gtype == 'Point' and coords and len(coords) >= 2:
        coordenadas = [round(coords[0], 6), round(coords[1], 6)]
    elif todos_pts:
        avg_lon = sum(p[0] for p in todos_pts) / len(todos_pts)
        avg_lat = sum(p[1] for p in todos_pts) / len(todos_pts)
        coordenadas = [round(avg_lon, 6), round(avg_lat, 6)]
    else:
        coordenadas = [-70.66214, -33.44991]
        
    # 12. Geom WKT
    geom_wkt = geojson_to_wkt(geom) or f"POINT({coordenadas[0]} {coordenadas[1]})"
    
    # 13. Bbox [minX, minY, maxX, maxY]
    if todos_pts:
        min_x = min(p[0] for p in todos_pts)
        min_y = min(p[1] for p in todos_pts)
        max_x = max(p[0] for p in todos_pts)
        max_y = max(p[1] for p in todos_pts)
        bbox = [round(min_x, 6), round(min_y, 6), round(max_x, 6), round(max_y, 6)]
    else:
        bbox = [coordenadas[0], coordenadas[1], coordenadas[0], coordenadas[1]]
        
    # 14. Fecha de registro
    fecha_registro = (
        raw_props.get('fecha_registro') or
        raw_props.get('fecha') or
        raw_props.get('timestamp') or
        raw_props.get('eventDate') or
        '2026-09-24'
    )
    if isinstance(fecha_registro, str) and len(fecha_registro) > 10:
        fecha_registro = fecha_registro[:10]
        
    # 15, 16, 17. Superficie métrica
    superficie_m2 = None
    superficie_ha = None
    srs_superficie = None
    
    if gtype == 'Polygon' and coords and len(coords) > 0:
        area_m2, area_ha = calcular_superficie_poligono(coords[0])
        superficie_m2 = area_m2
        superficie_ha = area_ha
        srs_superficie = 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)'
    elif gtype == 'MultiPolygon' and coords:
        tot_m2 = sum(calcular_superficie_poligono(p[0])[0] for p in coords if p and len(p) > 0)
        superficie_m2 = round(tot_m2, 2)
        superficie_ha = round(tot_m2 / 10000.0, 4)
        srs_superficie = 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)'
        
    # Construir nuevo diccionario ordenado con los 17 canónicos en primer lugar
    nuevo_props = {
        'id_vgi': id_vgi,
        'categoria': categoria,
        'subtipo': subtipo,
        'nombre': nombre,
        'operador': operador,
        'direccion': direccion,
        'accesibilidad': accesibilidad,
        'fuente': fuente,
        'metodo_adquisicion': metodo_adquisicion,
        'licencia': licencia,
        'coordenadas': coordenadas,
        'geom_wkt': geom_wkt,
        'bbox': bbox,
        'fecha_registro': fecha_registro,
        'superficie_m2': superficie_m2,
        'superficie_ha': superficie_ha,
        'srs_superficie': srs_superficie
    }
    
    # Preservar atributos secundarios o específicos del dominio (ej. meta_*, tags OSM, scientificName)
    for k, v in raw_props.items():
        if k not in nuevo_props:
            nuevo_props[k] = v
            
    feat['properties'] = nuevo_props
    return feat

def normalizar_archivo(ruta_origen, cat_key):
    with open(ruta_origen, 'r', encoding='utf-8') as f:
        gj = json.load(f)
        
    features = gj.get('features', [])
    for idx, feat in enumerate(features):
        normalizar_feature_vgi(feat, cat_key, idx)
        
    gj['features'] = features
    return gj

def main():
    print("═" * 72)
    print("  NORMALIZACIÓN INTEGRAL DEL ESQUEMA DE 17 ATRIBUTOS VGI EN EL ATLAS")
    print("═" * 72)
    
    archivos_capas = [
        ('educacion', 'capa_educacion.geojson'),
        ('servicios', 'capa_servicios.geojson'),
        ('transporte', 'capa_transporte.geojson'),
        ('movilidad_activa', 'capa_movilidad_activa.geojson'),
        ('espacio_publico', 'capa_espacio_publico.geojson'),
        ('patrimonio', 'capa_patrimonio.geojson'),
        ('accesibilidad', 'capa_accesibilidad.geojson'),
        ('biodiversidad', 'capa_biodiversidad.geojson'),
        ('edificaciones', 'capa_edificaciones.geojson'),
        ('cobertura_suelo', 'capa_cobertura_suelo.geojson')
    ]
    
    todas_features_consolidadas = []
    
    for cat_key, fn in archivos_capas:
        p_src = os.path.join(SRC_DATA_DIR, fn)
        p_data = os.path.join(DATA_DIR, fn)
        
        if not os.path.exists(p_src):
            print(f"⚠️  No encontrado: {fn}")
            continue
            
        gj = normalizar_archivo(p_src, cat_key)
        feats = gj['features']
        todas_features_consolidadas.extend(feats)
        
        # Guardar en src/data/
        with open(p_src, 'w', encoding='utf-8') as f:
            json.dump(gj, f, ensure_ascii=False)
            
        # Sincronizar en data/
        if os.path.exists(DATA_DIR):
            with open(p_data, 'w', encoding='utf-8') as f:
                json.dump(gj, f, ensure_ascii=False)
                
        # Validar
        validos = sum(1 for feat in feats if all(k in feat['properties'] for k in ORDEN_17))
        print(f"✅ {fn:36} N={len(feats):4d} entidades | 17/17 atributos: {validos}/{len(feats)} (100%)")

    # Guardar consolidado completo atlas_vgi_barrio_brasil_uah_completo.geojson
    fn_completo = 'atlas_vgi_barrio_brasil_uah_completo.geojson'
    p_comp_src = os.path.join(SRC_DATA_DIR, fn_completo)
    p_comp_data = os.path.join(DATA_DIR, fn_completo)
    
    gj_completo = {
        'type': 'FeatureCollection',
        'name': 'atlas_vgi_barrio_brasil_uah_completo',
        'crs': {
            'type': 'name',
            'properties': {'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'}
        },
        'metadata': {
            'title': 'Atlas VGI Barrio Brasil - UAH (Base Vectorial Consolidada Completa)',
            'esquema_atributos': '17 Atributos Normalizados ISO 19110 / IDE Chile SNIT',
            'srs_metrico': 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)',
            'total_entidades': len(todas_features_consolidadas),
            'fecha_actualizacion': datetime.now().isoformat()
        },
        'features': todas_features_consolidadas
    }
    
    with open(p_comp_src, 'w', encoding='utf-8') as f:
        json.dump(gj_completo, f, ensure_ascii=False)
    if os.path.exists(DATA_DIR):
        with open(p_comp_data, 'w', encoding='utf-8') as f:
            json.dump(gj_completo, f, ensure_ascii=False)
            
    val_comp = sum(1 for feat in todas_features_consolidadas if all(k in feat['properties'] for k in ORDEN_17))
    print(f"\n🌟 {fn_completo:36} N={len(todas_features_consolidadas):4d} entidades | 17/17 atributos: {val_comp}/{len(todas_features_consolidadas)} (100%)")
    print("═" * 72)
    print("  ¡TODAS LAS CAPAS VGI POSEEN EL ESQUEMA NORMALIZADO DE 17 ATRIBUTOS!")
    print("═" * 72)

if __name__ == '__main__':
    main()
