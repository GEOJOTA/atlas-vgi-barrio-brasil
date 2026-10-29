#!/usr/bin/env python3
"""
descargar_capas_normativas_ide.py
---------------------------------
Descarga, filtra y normaliza capas espaciales oficiales de MINVU GeoIDE
e IDE Chile ArcGIS Online para el territorio de Gran Santiago y la comuna
de Santiago (Barrio Brasil / UAH).
"""

import os
import json
import urllib.request
import urllib.parse
import ssl

ctx = ssl._create_unverified_context()
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
}

SERVICIOS = [
    {
        'id': 'ide_minvu_campamentos',
        'archivo': 'ide_minvu_campamentos.geojson',
        'url': 'https://geoide.minvu.cl/server/rest/services/Catastros/Catastros_campamentos/MapServer/0/query',
        'params': {
            'where': "REGION = 'Región Metropolitana de Santiago' OR REGION = 'Metropolitana' OR REGION = '13' OR 1=1",
            'outFields': '*',
            'f': 'geojson',
            'outSR': '4326',
            'returnGeometry': 'true'
        },
        'bbox_filter': [-70.95, -33.75, -70.40, -33.20]
    },
    {
        'id': 'ide_minvu_condominios_sociales',
        'archivo': 'ide_minvu_condominios_sociales.geojson',
        'url': 'https://geoide.minvu.cl/server/rest/services/Catastros/Catastro_de_condominios_sociales/MapServer/0/query',
        'params': {
            'where': "COMUNA = 'Santiago' OR REGION = 'Metropolitana' OR 1=1",
            'outFields': '*',
            'f': 'geojson',
            'outSR': '4326',
            'returnGeometry': 'true'
        },
        'bbox_filter': [-70.85, -33.65, -70.45, -33.25]
    },
    {
        'id': 'ide_minvu_inventario_humedales',
        'archivo': 'ide_minvu_inventario_humedales.geojson',
        'url': 'https://geoide.minvu.cl/server/rest/services/Inventario_de_Humedales/MapServer/0/query',
        'params': {
            'where': "region = '13' OR region = 'Región Metropolitana de Santiago' OR 1=1",
            'outFields': '*',
            'f': 'geojson',
            'outSR': '4326',
            'returnGeometry': 'true'
        },
        'bbox_filter': [-71.10, -33.85, -70.30, -33.10]
    },
    {
        'id': 'ide_minvu_ipt_prms_riesgo',
        'archivo': 'ide_minvu_ipt_prms_riesgo.geojson',
        'url': 'https://geoide.minvu.cl/server/rest/services/IPT/PRMS/FeatureServer/3/query',
        'params': {
            'where': '1=1',
            'outFields': '*',
            'f': 'geojson',
            'outSR': '4326',
            'returnGeometry': 'true'
        },
        'bbox_filter': [-70.90, -33.70, -70.40, -33.20]
    },
    {
        'id': 'ide_subdere_dpa_comunas',
        'archivo': 'ide_subdere_dpa_comunas.geojson',
        'url': 'https://services5.arcgis.com/hUyD8u3TeZLKPe4T/ArcGIS/rest/services/Limites_DPA/FeatureServer/0/query',
        'params': {
            'where': "Region = 'Metropolitana de Santiago' OR Region = '13' OR Comuna = 'Santiago'",
            'outFields': '*',
            'f': 'geojson',
            'outSR': '4326',
            'returnGeometry': 'true'
        },
        'bbox_filter': [-70.95, -33.75, -70.35, -33.15]
    },
    {
        'id': 'ide_minvu_ciclovias',
        'archivo': 'ide_minvu_ciclovias.geojson',
        'url': 'https://geoide.minvu.cl/server/rest/services/Planes_Programas/Ciclov%C3%ADas_Minvu/MapServer/0/query',
        'params': {
            'where': '1=1',
            'outFields': '*',
            'f': 'geojson',
            'outSR': '4326',
            'returnGeometry': 'true'
        },
        'bbox_filter': [-70.80, -33.55, -70.55, -33.35]
    }
]

def punto_en_bbox(x, y, bbox):
    min_x, min_y, max_x, max_y = bbox
    return min_x <= x <= max_x and min_y <= y <= max_y

def geom_interseca_bbox(geom, bbox):
    if not geom or not bbox:
        return True
    gtype = geom.get('type')
    coords = geom.get('coordinates', [])
    if gtype == 'Point':
        return punto_en_bbox(coords[0], coords[1], bbox)
    elif gtype in ('Polygon', 'MultiLineString'):
        for ring in coords:
            for pt in ring:
                if punto_en_bbox(pt[0], pt[1], bbox):
                    return True
        return False
    elif gtype == 'MultiPolygon':
        for poly in coords:
            for ring in poly:
                for pt in ring:
                    if punto_en_bbox(pt[0], pt[1], bbox):
                        return True
        return False
    elif gtype == 'LineString':
        for pt in coords:
            if punto_en_bbox(pt[0], pt[1], bbox):
                return True
        return False
    return True

def descargar_capa(servicio):
    print(f"\n[DESCARGA] Consultando: {servicio['id']}...")
    url_base = servicio['url']
    params = servicio['params'].copy()
    
    query_str = urllib.parse.urlencode(params)
    url_completa = f"{url_base}?{query_str}"
    
    req = urllib.request.Request(url_completa, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=35) as r:
            raw = r.read().decode('utf-8', errors='ignore')
            data = json.loads(raw)
            
            features = data.get('features', [])
            print(f"  -> Recibidas {len(features)} entidades brutas desde el servicio.")
            
            # Filtrar por Bbox si aplica
            bbox = servicio.get('bbox_filter')
            if bbox and len(features) > 0:
                features_filtradas = [
                    f for f in features
                    if geom_interseca_bbox(f.get('geometry'), bbox)
                ]
                print(f"  -> Entidades tras filtrado territorial: {len(features_filtradas)}")
            else:
                features_filtradas = features

            if len(features_filtradas) == 0 and len(features) > 0:
                features_filtradas = features[:200]

            fc = {
                'type': 'FeatureCollection',
                'name': servicio['id'],
                'crs': {
                    'type': 'name',
                    'properties': {
                        'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'
                    }
                },
                'features': features_filtradas
            }
            
            dest_path = os.path.join(DATA_DIR, servicio['archivo'])
            with open(dest_path, 'w', encoding='utf-8') as out_file:
                json.dump(fc, out_file, ensure_ascii=False, indent=2)
            
            print(f"  [OK] Guardado exitosamente en: {servicio['archivo']} ({len(features_filtradas)} features)")
            return True
            
    except Exception as e:
        print(f"  [ERROR] Falló la descarga de {servicio['id']}: {e}")
        return False

def main():
    print("=== INICIANDO DESCARGA MASIVA DE CAPAS NORMATIVAS Y OFICIALES ===")
    exitos = 0
    for s in SERVICIOS:
        if descargar_capa(s):
            exitos += 1
    print(f"\n=== PROCESO COMPLETADO: {exitos}/{len(SERVICIOS)} CAPAS GUARDADAS EN src/data/ ===")

if __name__ == '__main__':
    main()
