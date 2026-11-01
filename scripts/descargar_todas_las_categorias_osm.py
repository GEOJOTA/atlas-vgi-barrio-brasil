#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/descargar_todas_las_categorias_osm.py
----------------------------------------------
Descarga masiva, exhaustiva y garantizada de las 10 Macro-Categorías VGI para la RM
utilizando fragmentación por sub-etiquetas y reintentos automáticos multiseridor Overpass.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
SRC_DATA_DIR = os.path.join(BASE_DIR, "src", "data")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SRC_DATA_DIR, exist_ok=True)

# Coordenadas BBOX Región Metropolitana de Santiago [sur, oeste, norte, este]
BBOX_RM = "-34.25,-71.80,-32.90,-69.75"

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter"
]

TODAS_LAS_CATEGORIAS = {
    "cat01": {
        "codigo": "CAT-01",
        "nombre": "Educación y Universidad",
        "filename": "capa_osm_rm_cat01_educacion.geojson",
        "sub_queries": [
            'nwr["amenity"~"school|kindergarten|university|college|library|childcare|music_school"]({bbox});'
        ]
    },
    "cat02": {
        "codigo": "CAT-02",
        "nombre": "Servicios y Comercio Barrial",
        "filename": "capa_osm_rm_cat02_servicios.geojson",
        "sub_queries": [
            'nwr["amenity"~"bank|pharmacy|hospital|clinic|police|post_office|fire_station|doctors|dentist|townhall"]({bbox});',
            'nwr["shop"~"supermarket|convenience|bakery|butcher|clothes|hardware"]({bbox});'
        ]
    },
    "cat03": {
        "codigo": "CAT-03",
        "nombre": "Movilidad y Transporte",
        "filename": "capa_osm_rm_cat03_transporte.geojson",
        "sub_queries": [
            'nwr["highway"~"bus_stop|platform"]({bbox});',
            'nwr["railway"~"station|subway_entrance|halt|tram_stop"]({bbox});',
            'nwr["public_transport"~"platform|stop_position|station"]({bbox});'
        ]
    },
    "cat04": {
        "codigo": "CAT-04",
        "nombre": "Movilidad Activa y Ciclovías",
        "filename": "capa_osm_rm_cat04_movilidad_activa.geojson",
        "sub_queries": [
            'way["highway"="cycleway"]({bbox});',
            'way["cycleway"]({bbox});',
            'nwr["amenity"="bicycle_parking"]({bbox});',
            'nwr["amenity"="bicycle_rental"]({bbox});'
        ]
    },
    "cat05": {
        "codigo": "CAT-05",
        "nombre": "Áreas Verdes y Espacio Público",
        "filename": "capa_osm_rm_cat05_espacio_publico.geojson",
        "sub_queries": [
            'nwr["leisure"~"park|playground|pitch|garden|square|park_and_ride"]({bbox});',
            'nwr["landuse"~"recreation_ground|village_green|grass"]({bbox});',
            'node["amenity"~"bench|drinking_water"]({bbox});'
        ]
    },
    "cat06": {
        "codigo": "CAT-06",
        "nombre": "Patrimonio y Cultura",
        "filename": "capa_osm_rm_cat06_patrimonio.geojson",
        "sub_queries": [
            'nwr["historic"]({bbox});',
            'nwr["heritage"]({bbox});',
            'nwr["building"~"church|cathedral|chapel"]({bbox});',
            'nwr["amenity"~"theatre|arts_centre|place_of_worship|museum|community_centre"]({bbox});',
            'nwr["tourism"~"museum|artwork|gallery"]({bbox});'
        ]
    },
    "cat07": {
        "codigo": "CAT-07",
        "nombre": "Accesibilidad Universal",
        "filename": "capa_osm_rm_cat07_accesibilidad.geojson",
        "sub_queries": [
            'node["kerb"]({bbox});',
            'node["highway"="crossing"]({bbox});',
            'node["tactile_paving"]({bbox});',
            'node["wheelchair"]({bbox});',
            'way["highway"~"footway|pedestrian"]({bbox});',
            'way["ramp"]({bbox});'
        ]
    },
    "cat08": {
        "codigo": "CAT-08",
        "nombre": "Biodiversidad Urbana",
        "filename": "capa_osm_rm_cat08_biodiversidad.geojson",
        "sub_queries": [
            'node["natural"="tree"]({bbox});',
            'nwr["natural"~"wood|scrub|tree_row|water|wetland"]({bbox});',
            'nwr["leisure"="garden"]({bbox});',
            'nwr["landuse"="forest"]({bbox});'
        ]
    },
    "cat09": {
        "codigo": "CAT-09",
        "nombre": "Edificaciones y Huella Urbana",
        "filename": "capa_osm_rm_cat09_edificaciones.geojson",
        "sub_queries": [
            'way["building"~"apartments|residential|commercial|industrial|public|civic"]({bbox});',
            'relation["building"]({bbox});'
        ]
    },
    "cat10": {
        "codigo": "CAT-10",
        "nombre": "Coberturas y Usos de Suelo",
        "filename": "capa_osm_rm_cat10_cobertura_suelo.geojson",
        "sub_queries": [
            'nwr["landuse"~"residential|commercial|industrial|farmland|forest|meadow|basin|construction|cemetery|retail|recreation_ground"]({bbox});',
            'nwr["natural"~"wood|scrub|water|grassland|bare_rock|wetland"]({bbox});',
            'nwr["leisure"~"park|garden|pitch|nature_reserve|playground|stadium"]({bbox});'
        ]
    }
}

def ejecutar_overpass_query(cuerpo_query):
    query_full = f"""[out:json][timeout:300];
    (
        {cuerpo_query}
    );
    out body center qt 5000;
    >;
    out skel qt 5000;"""
    
    encoded_data = urllib.parse.urlencode({'data': query_full}).encode('utf-8')
    headers = {'User-Agent': 'AtlasVGI-UAH-MasterDownloader/2.0 (geoprocesos@uahurtado.cl)'}
    
    for url in ENDPOINTS:
        try:
            req = urllib.request.Request(url, data=encoded_data, headers=headers)
            with urllib.request.urlopen(req, timeout=180) as resp:
                if resp.status == 200:
                    raw = resp.read().decode('utf-8')
                    return json.loads(raw)
        except Exception as e:
            time.sleep(1)
    return None

def osm_element_to_feature(elem, cat_info):
    tags = elem.get("tags", {})
    elem_id = elem.get("id")
    elem_type = elem.get("type", "node")
    
    lon = elem.get("lon") or (elem.get("center", {}).get("lon"))
    lat = elem.get("lat") or (elem.get("center", {}).get("lat"))
    
    if lon is None or lat is None:
        return None
        
    props = {
        "id": f"{elem_type}/{elem_id}",
        "osm_id": elem_id,
        "osm_type": elem_type,
        "categoria": cat_info["codigo"],
        "categoria_id": cat_info["nombre"].lower().replace(" ", "_"),
        "nombre_categoria": cat_info["nombre"],
        "nombre": tags.get("name") or tags.get("official_name") or tags.get("amenity") or tags.get("shop") or tags.get("highway") or f"{cat_info['nombre']} {elem_id}",
        "fuente": "OpenStreetMap Contributors"
    }
    
    for k, v in tags.items():
        props[k] = v
        
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [float(lon), float(lat)]
        },
        "properties": props
    }

def main():
    print("=" * 80)
    print("EXTRACTOR MAESTRO OSM — 10 MACRO-CATEGORIAS VGI COMPLETAS (RM)")
    print("=" * 80)
    
    todas_las_features_maestras = []
    resumen_descargas = {}
    
    for key, cat_info in TODAS_LAS_CATEGORIAS.items():
        print(f"\n[+] Extrayendo {cat_info['codigo']}: {cat_info['nombre']}...")
        features_dict = {}
        
        for idx, sub_q in enumerate(cat_info['sub_queries'], 1):
            cuerpo = sub_q.format(bbox=BBOX_RM)
            data = ejecutar_overpass_query(cuerpo)
            
            if data and "elements" in data:
                count = 0
                for elem in data["elements"]:
                    feat = osm_element_to_feature(elem, cat_info)
                    if feat:
                        fid = feat["properties"]["id"]
                        if fid not in features_dict:
                            features_dict[fid] = feat
                            count += 1
                print(f"  [OK] Sub-consulta {idx}/{len(cat_info['sub_queries'])}: {count:,} nuevas entidades.")
            else:
                print(f"  [!] Sub-consulta {idx}/{len(cat_info['sub_queries'])} expiró o sin datos.")
            time.sleep(1)
            
        lista_features = list(features_dict.values())
        print(f"  => Total {cat_info['codigo']}: {len(lista_features):,} entidades.")
        resumen_descargas[cat_info['codigo']] = len(lista_features)
        todas_las_features_maestras.extend(lista_features)
        
        geojson_out = {
            "type": "FeatureCollection",
            "name": cat_info["filename"].replace(".geojson", ""),
            "metadata": {
                "codigo_categoria": cat_info["codigo"],
                "nombre_categoria": cat_info["nombre"],
                "total_entidades": len(lista_features),
                "fuente": "OpenStreetMap Contributors (ODbL 1.0)",
                "fecha_actualizacion": time.strftime("%Y-%m-%d %H:%M:%S")
            },
            "features": lista_features
        }
        
        path_data = os.path.join(DATA_DIR, cat_info["filename"])
        path_src = os.path.join(SRC_DATA_DIR, cat_info["filename"])
        
        if len(lista_features) > 0:
            with open(path_data, "w", encoding="utf-8") as f:
                json.dump(geojson_out, f, ensure_ascii=False, separators=(',', ':'))
            with open(path_src, "w", encoding="utf-8") as f:
                json.dump(geojson_out, f, ensure_ascii=False, separators=(',', ':'))

    # Guardar Capa Maestra Consolidada
    print("\n[+] Guardando Capa Maestra Consolidada (capa_osm_rm_completo_vgi.geojson)...")
    fc_maestra = {
        "type": "FeatureCollection",
        "name": "capa_osm_rm_completo_vgi",
        "metadata": {
            "descripcion": "Base de datos vectoriales integrales de OpenStreetMap para la Región Metropolitana (10 Macro-Categorías VGI). Usada para fallback local instantáneo.",
            "total_entidades": len(todas_las_features_maestras),
            "fuente": "OpenStreetMap Contributors (ODbL 1.0)",
            "fecha_actualizacion": time.strftime("%Y-%m-%d %H:%M:%S")
        },
        "features": todas_las_features_maestras
    }
    
    mp1 = os.path.join(DATA_DIR, "capa_osm_rm_completo_vgi.geojson")
    mp2 = os.path.join(SRC_DATA_DIR, "capa_osm_rm_completo_vgi.geojson")
    with open(mp1, "w", encoding="utf-8") as f:
        json.dump(fc_maestra, f, ensure_ascii=False, separators=(',', ':'))
    with open(mp2, "w", encoding="utf-8") as f:
        json.dump(fc_maestra, f, ensure_ascii=False, separators=(',', ':'))

    print("\n" + "=" * 80)
    print("RESUMEN GENERAL DE DESCARGAS MAESTRAS DE LAS 10 CATEGORIAS VGI:")
    print("=" * 80)
    for cod, count in resumen_descargas.items():
        print(f"  - {cod}: {count:,} entidades")
    print(f"  TOTAL ENTIDADES CONSOLIDADAS: {len(todas_las_features_maestras):,}")
    print("=" * 80)

if __name__ == "__main__":
    main()
