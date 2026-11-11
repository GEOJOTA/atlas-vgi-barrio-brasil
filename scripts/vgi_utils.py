#!/usr/bin/env python3
"""
scripts/vgi_utils.py
--------------------
Utilidades compartidas para la extracción exhaustiva, recorte espacial oficial
(Región Metropolitana y Barrio Brasil), cálculo métrico y normalización al
perfil de metadatos ISO 19157 (17 atributos + meta_*) de las 171 capas IGV/VGI.
"""

import json
import math
import os
import re
import shutil
from shapely.geometry import Point, shape
from shapely.ops import unary_union
from shapely.prepared import prep

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DATA_DIR = os.path.join(ROOT_DIR, 'src', 'data')
DATA_DIR = os.path.join(ROOT_DIR, 'data')
CATALOGO_JS_PATH = os.path.join(ROOT_DIR, 'src', 'js', 'modulos', 'catalogo_vgi_descentralizado.js')

# Rectángulo extendido de referencia del Área de Estudio Barrio Brasil
BR_EXT_BBOX = (-70.678, -33.452, -70.658, -33.435)


def cargar_poligonos_referencia():
    """Carga los polígonos oficiales de la RM (Censo 2024) y Barrio Brasil."""
    rm_path = os.path.join(SRC_DATA_DIR, 'ide_censo2024_regional.geojson')
    with open(rm_path, 'r', encoding='utf-8') as f:
        rm_fc = json.load(f)
    rm_geom = unary_union([shape(ft['geometry']) for ft in rm_fc.get('features', []) if ft.get('geometry')])
    rm_prep = prep(rm_geom)

    br_path = os.path.join(SRC_DATA_DIR, 'matriz_sintesis_barrio_brasil_manzanas.geojson')
    with open(br_path, 'r', encoding='utf-8') as f:
        br_fc = json.load(f)
    br_geom = unary_union([shape(ft['geometry']) for ft in br_fc.get('features', []) if ft.get('geometry')]).buffer(0.00045)
    br_prep = prep(br_geom)

    return {
        'rm_geom': rm_geom,
        'rm_prep': rm_prep,
        'rm_bounds': rm_geom.bounds,
        'br_geom': br_geom,
        'br_prep': br_prep,
        'br_bounds': br_geom.bounds,
    }


def _redondear_coords(obj, dec=6):
    if isinstance(obj, (int, float)):
        return round(float(obj), dec)
    if isinstance(obj, list):
        return [_redondear_coords(x, dec) for x in obj]
    return obj


def procesar_geometria(geom_dict, refs):
    """
    Valida, redondea a 6 decimales y verifica pertenencia espacial a la Región
    Metropolitana. Retorna (geom_redondeada, meta_geom_dict, en_barrio_brasil) o None.
    """
    if not geom_dict or not isinstance(geom_dict, dict):
        return None
    gtype = geom_dict.get('type')
    coords = geom_dict.get('coordinates')
    if not gtype or not coords:
        return None

    try:
        if gtype == 'Point':
            lon, lat = float(coords[0]), float(coords[1])
            if not (math.isfinite(lon) and math.isfinite(lat)):
                return None
            lon_r, lat_r = round(lon, 6), round(lat, 6)
            bx0, by0, bx1, by1 = refs['rm_bounds']
            if not (bx0 <= lon_r <= bx1 and by0 <= lat_r <= by1):
                return None
            pt = Point(lon_r, lat_r)
            if not refs['rm_prep'].contains(pt):
                return None
            en_br = (
                BR_EXT_BBOX[0] <= lon_r <= BR_EXT_BBOX[2]
                and BR_EXT_BBOX[1] <= lat_r <= BR_EXT_BBOX[3]
            ) or refs['br_prep'].contains(pt)
            g_out = {'type': 'Point', 'coordinates': [lon_r, lat_r]}
            meta_g = {
                'coordenadas': [lon_r, lat_r],
                'geom_wkt': f'POINT({lon_r} {lat_r})',
                'bbox': [lon_r, lat_r, lon_r, lat_r],
                'superficie_m2': 0.0,
                'superficie_ha': 0.0,
                'srs_superficie': 'EPSG:32719',
            }
            return g_out, meta_g, en_br

        coords_r = _redondear_coords(coords, 6)
        g_clean = {'type': gtype, 'coordinates': coords_r}
        shp = shape(g_clean)
        if shp.is_empty:
            return None
        if not shp.is_valid:
            shp = shp.buffer(0)
            if shp.is_empty:
                return None
            g_clean = json.loads(json.dumps(shp.__geo_interface__))

        sx0, sy0, sx1, sy1 = shp.bounds
        rx0, ry0, rx1, ry1 = refs['rm_bounds']
        if sx1 < rx0 or sx0 > rx1 or sy1 < ry0 or sy0 > ry1:
            return None
        if not refs['rm_prep'].intersects(shp):
            return None

        c = shp.centroid
        cx, cy = round(c.x, 6), round(c.y, 6)
        en_br = refs['br_prep'].intersects(shp) or (
            not (sx1 < BR_EXT_BBOX[0] or sx0 > BR_EXT_BBOX[2] or sy1 < BR_EXT_BBOX[1] or sy0 > BR_EXT_BBOX[3])
        )

        area_m2 = 0.0
        area_ha = 0.0
        if gtype in ('Polygon', 'MultiPolygon') or shp.geom_type in ('Polygon', 'MultiPolygon'):
            mx = 111319.9 * math.cos(math.radians(cy))
            my = 110913.0
            area_m2 = round(shp.area * mx * my, 2)
            area_ha = round(area_m2 / 10000.0, 4)

        meta_g = {
            'coordenadas': [cx, cy],
            'geom_wkt': f'{shp.geom_type.upper()}({cx} {cy})',
            'bbox': [round(sx0, 6), round(sy0, 6), round(sx1, 6), round(sy1, 6)],
            'superficie_m2': area_m2,
            'superficie_ha': area_ha,
            'srs_superficie': 'EPSG:32719',
        }
        return g_clean, meta_g, en_br
    except Exception:
        return None


def construir_propiedades_vgi(
    *,
    id_igv,
    categoria,
    subtipo,
    nombre,
    operador,
    direccion,
    accesibilidad,
    fuente,
    metodo_adquisicion,
    licencia,
    fecha_registro,
    meta_g,
    capa_id,
    titulo,
    institucion,
    grupo,
    cita_apa,
    extras=None,
):
    """Construye el diccionario estándar ISO 19157 (17 atributos + meta_*)."""
    props = {
        'id_igv': str(id_igv),
        'categoria': str(categoria or 'VGI Territorial'),
        'subtipo': str(subtipo or 'Entidad VGI'),
        'nombre': str(nombre or subtipo or 'Sin nombre registrado'),
        'operador': str(operador or institucion or 'Comunidad / IGV'),
        'direccion': str(direccion or 'Región Metropolitana de Santiago, Chile'),
        'accesibilidad': str(accesibilidad or 'Acceso Público / Información Abierta'),
        'fuente': str(fuente or 'OpenStreetMap / GBIF'),
        'metodo_adquisicion': str(metodo_adquisicion or 'Descarga Geoespacial Abierta'),
        'licencia': str(licencia or 'ODbL 1.0 / CC BY 4.0'),
        'coordenadas': meta_g['coordenadas'],
        'geom_wkt': meta_g['geom_wkt'],
        'bbox': meta_g['bbox'],
        'fecha_registro': str(fecha_registro or '2026-11-10')[:10],
        'superficie_m2': meta_g['superficie_m2'],
        'superficie_ha': meta_g['superficie_ha'],
        'srs_superficie': meta_g['srs_superficie'],
    }
    if extras:
        for k, v in extras.items():
            if v is not None and v != '' and k not in props:
                props[k] = v

    props.update({
        'meta_capa_id': capa_id,
        'meta_titulo': titulo,
        'meta_institucion': institucion or 'Comunidad Abierta OSM / GBIF',
        'meta_ministerio': 'Sector Público / Ciencia Ciudadana',
        'meta_grupo': grupo or 'sociourbana',
        'meta_tipo_fuente': 'Colaborativa VGI',
        'meta_temporalidad': '2026',
        'meta_licencia': str(licencia or 'ODbL 1.0 / CC BY-NC 4.0'),
        'meta_cita_apa': cita_apa,
        'meta_crs': 'EPSG:4326 (WGS 84)',
        'meta_contacto': 'contacto@atlasvgi.cl',
        'meta_url_servicio': 'https://atlasvgiuah.netlify.app/',
    })
    return props


def escribir_capa_geojson(filename, features, metadata=None):
    """Guarda un GeoJSON minificado idéntico en src/data/ y data/."""
    fc = {
        'type': 'FeatureCollection',
        'features': features,
    }
    if metadata:
        fc['metadata'] = metadata

    os.makedirs(SRC_DATA_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    p_src = os.path.join(SRC_DATA_DIR, filename)
    p_dat = os.path.join(DATA_DIR, filename)

    with open(p_src, 'w', encoding='utf-8') as f:
        json.dump(fc, f, ensure_ascii=False, separators=(',', ':'))
    shutil.copyfile(p_src, p_dat)
    return os.path.getsize(p_src)


def cargar_catalogo_vgi():
    """Lee el arreglo JSON desde src/js/modulos/catalogo_vgi_descentralizado.js."""
    with open(CATALOGO_JS_PATH, 'r', encoding='utf-8') as f:
        txt = f.read()
    m = re.search(r'(\[\s*\{.*?\}\s*\])\s*;', txt, re.S)
    if not m:
        raise RuntimeError('No se pudo localizar el arreglo en catalogo_vgi_descentralizado.js')
    return txt, m.span(1), json.loads(m.group(1))


def actualizar_catalogo_vgi_js(actualizaciones):
    """
    Actualiza totalEntidades, geometria (opcional) y descripcion en
    catalogo_vgi_descentralizado.js preservando el orden y los 171 registros.
    actualizaciones: dict { id_capa: {'totalEntidades': int, 'rm_count': int, 'br_count': int, 'geometria': str|None} }
    """
    txt, (start, end), entries = cargar_catalogo_vgi()
    for item in entries:
        cid = item['id']
        if cid in actualizaciones:
            upd = actualizaciones[cid]
            tot = int(upd['totalEntidades'])
            item['totalEntidades'] = tot
            if upd.get('geometria'):
                item['geometria'] = upd['geometria']
            rm_c = int(upd.get('rm_count', tot))
            br_c = int(upd.get('br_count', 0))
            fuente = 'GBIF / Ciencia Comunitaria' if str(item.get('tag', '')).startswith('dwc:') else 'OpenStreetMap (Geofabrik + Overpass RM)'
            if tot == 0:
                item['descripcion'] = (
                    f"Cobertura colaborativa IGV de {item['nombreCorto']} sin registros georreferenciados verificados "
                    f"en {fuente} dentro de la Región Metropolitana de Santiago."
                )
            else:
                item['descripcion'] = (
                    f"Catastro colaborativo IGV de {item['nombreCorto']} ({fuente}): "
                    f"{rm_c:,} entidades en la Región Metropolitana ({br_c:,} en Barrio Brasil)."
                ).replace(',', '.')

    nuevo_json = json.dumps(entries, indent=2, ensure_ascii=False)
    nuevo_txt = txt[:start] + nuevo_json + txt[end:]
    with open(CATALOGO_JS_PATH, 'w', encoding='utf-8') as f:
        f.write(nuevo_txt)
    return len(entries)
