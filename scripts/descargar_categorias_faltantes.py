#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/descargar_categorias_faltantes.py
-----------------------------------------
Descarga exhaustiva y optimizada de las 2 categorías faltantes (CAT-06 y CAT-10)
utilizando fragmentación por sub-claves y múltiples servidores Overpass API de respaldo.
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

# Consultas específicas por sub-etiquetas para evitar timeouts en Overpass
QUERIES_FALTANTES = {
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
    headers = {'User-Agent': 'AtlasVGI-UAH-Downloader/2.0 (geoprocesos@uahurtado.cl)'}
    
    for url in ENDPOINTS:
        try:
            req = urllib.request.Request(url, data=encoded_data, headers=headers)
            with urllib.request.urlopen(req, timeout=180) as resp:
                if resp.status == 200:
                    raw = resp.read().decode('utf-8')
                    return json.loads(raw)
        except Exception as e:
            print(f"    [!] Reintento en {url}: {e}")
            time.sleep(2)
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
        "nombre": tags.get("name") or tags.get("official_name") or tags.get("historic") or tags.get("landuse") or f"{cat_info['nombre']} {elem_id}",
        "fuente": "OpenStreetMap Contributors"
    }
    
    # Copiar todas las etiquetas OSM
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
    print("EXTRACTOR FALTANTE OSM — CAT-06 (Patrimonio) & CAT-10 (Cobertura de Suelo)")
    print("=" * 80)
    
    for key, cat_info in QUERIES_FALTANTES.items():
        print(f"\n[+] Procesando {cat_info['codigo']}: {cat_info['nombre']}...")
        features_dict = {}
        
        for idx, sub_q in enumerate(cat_info['sub_queries'], 1):
            cuerpo = sub_q.format(bbox=BBOX_RM)
            print(f"  -> Ejecutando sub-consulta {idx}/{len(cat_info['sub_queries'])}...")
            data = ejecutar_overpass_query(cuerpo)
            
            if data and "elements" in data:
                elems = data["elements"]
                count = 0
                for elem in elems:
                    feat = osm_element_to_feature(elem, cat_info)
                    if feat:
                        fid = feat["properties"]["id"]
                        if fid not in features_dict:
                            features_dict[fid] = feat
                            count += 1
                print(f"     [OK] Sub-consulta {idx}: {count} nuevas entidades extraídas.")
            else:
                print(f"     [!] Sub-consulta {idx} no devolvió datos o expiró.")
            time.sleep(1)
            
        lista_features = list(features_dict.values())
        print(f"  => Total consolidado para {cat_info['codigo']}: {len(lista_features):,} entidades.")
        
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
        
        # Guardar en data/ y src/data/
        path_data = os.path.join(DATA_DIR, cat_info["filename"])
        path_src = os.path.join(SRC_DATA_DIR, cat_info["filename"])
        
        if len(lista_features) > 0:
            with open(path_data, "w", encoding="utf-8") as f:
                json.dump(geojson_out, f, ensure_ascii=False, separators=(',', ':'))
            with open(path_src, "w", encoding="utf-8") as f:
                json.dump(geojson_out, f, ensure_ascii=False, separators=(',', ':'))
            print(f"  [OK] Guardado exitosamente en:\n       - {path_data}\n       - {path_src}")
        else:
            print(f"  [!] No se pudieron extraer entidades nuevas para {cat_info['codigo']}.")

if __name__ == "__main__":
    main()
