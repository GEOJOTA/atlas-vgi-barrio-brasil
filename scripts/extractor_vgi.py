#!/usr/bin/env python3
"""
extractor_vgi.py
----------------
Herramienta de línea de comandos (CLI) para geógrafos e investigadores territoriales.
Permite descargar, normalizar y exportar capas de Información Geográfica Voluntaria (VGI)
desde OpenStreetMap (Overpass API) y GBIF para un Bounding Box o comuna de interés.

No requiere librerías externas (opera 100% con la biblioteca estándar de Python 3).

Uso:
  python3 scripts/extractor_vgi.py
  python3 scripts/extractor_vgi.py --categoria educacion --output-dir data/
  python3 scripts/extractor_vgi.py --bbox -70.6675 -33.4505 -70.6565 -33.4385
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import argparse
import csv
from datetime import datetime
import math

# Rutas del proyecto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, "config", "config.json")

# Bbox por defecto: Barrio Brasil — Universidad Alberto Hurtado (Santiago Centro, Chile)
BBOX_DEFECTO = [-70.6675, -33.4505, -70.6565, -33.4385]

OVERPASS_SERVERS = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass-api.de/api/interpreter"
]

# Manejo de certificados SSL en macOS
import ssl
try:
    SSL_CONTEXT = ssl._create_unverified_context()
except Exception:
    SSL_CONTEXT = None

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
    """
    Reproyecta coordenadas geográficas WGS84 a planas métricas UTM 19S (EPSG:32719).
    Ecuaciones conformes de Transverse Mercator (Snyder, 1987).
    """
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
        A
        + (1.0 - T + C) * (A ** 3) / 6.0
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

def calcular_superficie_poligono(coords_lon_lat):
    """
    Calcula el área métrica plana de un polígono cerrado reprojectando a EPSG:32719 y aplicando Gauss.
    """
    if not coords_lon_lat or len(coords_lon_lat) < 3:
        return {"areaM2": 0.0, "areaHa": 0.0, "areaKm2": 0.0, "srs": "EPSG:32719"}
    coords_utm = [wgs84_a_utm19s(pt[0], pt[1]) for pt in coords_lon_lat]
    suma = 0.0
    n = len(coords_utm)
    for i in range(n - 1):
        suma += (coords_utm[i][0] * coords_utm[i + 1][1]) - (coords_utm[i + 1][0] * coords_utm[i][1])
    area_m2 = abs(suma) / 2.0
    return {
        "areaM2": round(area_m2, 1),
        "areaHa": round(area_m2 / 10000.0, 3),
        "areaKm2": round(area_m2 / 1000000.0, 6),
        "srs": "EPSG:32719 (WGS 84 / UTM Huso 19 Sur)"
    }

FILTROS_CATEGORIAS = {
    "educacion": {
        "nombre": "Educación y Universidad",
        "filtro_osm": 'nwr["amenity"~"university|college|library|school|kindergarten"]({bbox}); nwr["building"~"university|school|college|kindergarten|library"]({bbox});'
    },
    "servicios": {
        "nombre": "Servicios y Comercio Barrial",
        "filtro_osm": 'nwr["shop"]({bbox}); nwr["amenity"~"cafe|restaurant|bar|fast_food|pub|pharmacy|clinic|doctors|dentist|bank|atm|post_office|marketplace|police|fire_station"]({bbox}); nwr["building"~"retail|commercial|supermarket"]({bbox});'
    },
    "transporte": {
        "nombre": "Movilidad y Transporte",
        "filtro_osm": 'node["highway"="bus_stop"]({bbox}); node["railway"~"station|subway_entrance"]({bbox}); node["public_transport"~"platform|stop_position"]({bbox}); way["highway"~"primary|secondary|tertiary|trunk"]({bbox}); way["railway"="subway"]({bbox}); nwr["amenity"="bus_station"]({bbox});'
    },
    "movilidad_activa": {
        "nombre": "Movilidad Activa y Ciclovías",
        "filtro_osm": 'way["highway"="cycleway"]({bbox}); way["cycleway"]({bbox}); way["cycleway:left"]({bbox}); way["cycleway:right"]({bbox}); way["cycleway:both"]({bbox}); way["highway"~"footway|path"]["bicycle"~"yes|designated"]({bbox}); nwr["amenity"~"bicycle_parking|bicycle_rental"]({bbox}); nwr["shop"="bicycle"]({bbox});'
    },
    "espacio_publico": {
        "nombre": "Áreas Verdes y Espacio Público",
        "filtro_osm": 'nwr["leisure"~"park|playground|garden|pitch|sports_centre|fitness_station"]({bbox}); nwr["landuse"~"grass|village_green|recreation_ground"]({bbox}); node["amenity"~"bench|drinking_water"]({bbox});'
    },
    "patrimonio": {
        "nombre": "Patrimonio y Cultura",
        "filtro_osm": 'nwr["historic"]({bbox}); nwr["heritage"]({bbox}); nwr["building"~"church|cathedral|chapel"]({bbox}); nwr["amenity"~"theatre|arts_centre|place_of_worship|museum|community_centre"]({bbox}); nwr["tourism"~"museum|artwork|gallery"]({bbox});'
    },
    "accesibilidad": {
        "nombre": "Accesibilidad Universal",
        "filtro_osm": 'node["kerb"]({bbox}); node["highway"="crossing"]({bbox}); node["tactile_paving"]({bbox}); node["wheelchair"]({bbox}); way["highway"~"footway|pedestrian"]({bbox}); way["highway"="steps"]["ramp"~"yes|separate"]({bbox}); way["ramp"]({bbox});'
    },
    "biodiversidad": {
        "nombre": "Biodiversidad Urbana",
        "filtro_osm": 'node["natural"="tree"]({bbox}); way["natural"="tree_row"]({bbox}); nwr["natural"~"wood|scrub"]({bbox}); nwr["leisure"="garden"]({bbox}); nwr["landuse"="forest"]({bbox});'
    }
}

def consultar_overpass(cuerpo_ql, bbox):
    oeste, sur, este, norte = bbox
    bbox_str = f"{sur},{oeste},{norte},{este}"
    filtro_reemplazado = cuerpo_ql.replace("{bbox}", bbox_str)
    
    query = f"""
    [out:json][timeout:35];
    (
      {filtro_reemplazado}
    );
    out geom tags qt 400;
    """
    
    data_encoded = urllib.parse.urlencode({"data": query}).encode("utf-8")
    
    for srv in OVERPASS_SERVERS:
        try:
            req = urllib.request.Request(srv, data=data_encoded, headers={"User-Agent": "AtlasVGI-UAH-Practica/1.0"})
            with urllib.request.urlopen(req, timeout=12, context=SSL_CONTEXT) as res:
                if res.status == 200:
                    datos = json.loads(res.read().decode("utf-8"))
                    return datos.get("elements", [])
        except Exception as e:
            print(f"  [!] Falló servidor Overpass {srv}: {e}. Probando espejo...")
            continue
    return []

def consultar_gbif(bbox, limite=50):
    oeste, sur, este, norte = bbox
    params = urllib.parse.urlencode({
        "limit": str(limite),
        "hasCoordinate": "true",
        "decimalLatitude": f"{sur},{norte}",
        "decimalLongitude": f"{oeste},{este}"
    })
    url = f"https://api.gbif.org/v1/occurrence/search?{params}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AtlasVGI-UAH-Practica/1.0"})
        with urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as res:
            if res.status == 200:
                datos = json.loads(res.read().decode("utf-8"))
                return datos.get("results", [])
    except Exception as e:
        print(f"  [!] Error al consultar GBIF: {e}")
    return []

def normalizar_elementos(elementos, categoria_id):
    features = []
    filas_csv = []
    
    for el in elementos:
        tags = el.get("tags", {})
        el_type = el.get("type", "node")
        el_id = el.get("id")
        geometria = None
        lat = el.get("lat") or (el.get("center", {}).get("lat") if "center" in el else None)
        lon = el.get("lon") or (el.get("center", {}).get("lon") if "center" in el else None)

        if el_type == "node":
            if lat is not None and lon is not None:
                geometria = {"type": "Point", "coordinates": [lon, lat]}
        elif el_type == "way":
            geom = el.get("geometry", [])
            if geom and len(geom) >= 2:
                coords = [[p["lon"], p["lat"]] for p in geom if "lat" in p and "lon" in p]
                if not lat or not lon:
                    lat = coords[0][1]
                    lon = coords[0][0]
                es_cerrado = len(coords) >= 4 and abs(coords[0][0] - coords[-1][0]) < 1e-6 and abs(coords[0][1] - coords[-1][1]) < 1e-6
                es_poligono = es_cerrado and any([
                    "building" in tags, "leisure" in tags, "landuse" in tags,
                    "amenity" in tags, "historic" in tags, tags.get("natural") in ("wood", "scrub"),
                    "shop" in tags, tags.get("area") == "yes"
                ])
                if es_poligono:
                    geometria = {"type": "Polygon", "coordinates": [coords]}
                else:
                    geometria = {"type": "LineString", "coordinates": coords}
            elif lat is not None and lon is not None:
                geometria = {"type": "Point", "coordinates": [lon, lat]}
        elif "center" in el:
            c = el["center"]
            lat = c.get("lat")
            lon = c.get("lon")
            geometria = {"type": "Point", "coordinates": [lon, lat]}

        if not geometria or lat is None or lon is None:
            continue
            
        sup_info = None
        if geometria["type"] == "Polygon" and coords:
            sup_info = calcular_superficie_poligono(coords)

        nombre = tags.get("name") or tags.get("name:es") or tags.get("description") or "Sin denominación"
        subtipo = tags.get("amenity") or tags.get("shop") or tags.get("highway") or tags.get("leisure") or tags.get("historic") or tags.get("building") or tags.get("railway") or "Elemento VGI"
        operador = tags.get("operator", "")
        direccion = f"{tags.get('addr:street', '')} {tags.get('addr:housenumber', '')}".strip()
        accesibilidad = tags.get("wheelchair", "")
        el_id_str = f"{el_type}/{el_id}"
        
        feat = {
            "type": "Feature",
            "id": el_id_str,
            "geometry": geometria,
            "properties": {
                "id_vgi": f"OSM/{el_id_str}",
                "categoria": categoria_id,
                "tipo_geometria": geometria["type"],
                "subtipo": subtipo,
                "nombre": nombre,
                "operador": operador,
                "direccion": direccion,
                "accesibilidad": accesibilidad,
                "superficie_m2": sup_info["areaM2"] if sup_info else None,
                "superficie_ha": sup_info["areaHa"] if sup_info else None,
                "superficie_km2": sup_info["areaKm2"] if sup_info else None,
                "srs_superficie": sup_info["srs"] if sup_info else None,
                "fuente": "OpenStreetMap",
                "fecha": el.get("timestamp", datetime.now().strftime("%Y-%m-%d")),
                "licencia": "ODbL 1.0"
            }
        }
        features.append(feat)
        filas_csv.append([
            f"OSM/{el_id_str}", categoria_id, subtipo, nombre, operador, direccion, accesibilidad,
            "OpenStreetMap", el.get("timestamp", datetime.now().strftime("%Y-%m-%d")), "ODbL 1.0", lat, lon,
            sup_info["areaM2"] if sup_info else "", sup_info["areaHa"] if sup_info else "", sup_info["srs"] if sup_info else ""
        ])
        
    return features, filas_csv

def main():
    parser = argparse.ArgumentParser(description="Extractor VGI territorial para geografía y gestión urbana.")
    parser.add_argument("--bbox", nargs=4, type=float, default=BBOX_DEFECTO, help="Oeste Sur Este Norte (EPSG:4326)")
    parser.add_argument("--categoria", type=str, choices=list(FILTROS_CATEGORIAS.keys()) + ["todas"], default="todas", help="Categoría temática a descargar")
    parser.add_argument("--output-dir", type=str, default=os.path.join(BASE_DIR, "data"), help="Directorio de exportación")
    args = parser.parse_args()
    
    os.makedirs(args.output_dir, exist_ok=True)
    bbox = args.bbox
    print("==========================================================================")
    print("   EXTRACTOR TERRITORIAL VGI — ATLAS BARRIO BRASIL & UAH (CHILE)")
    print("==========================================================================")
    print(f"[*] Bbox: {bbox}")
    print(f"[*] Carpeta destino: {args.output_dir}\n")
    
    categorias_a_procesar = list(FILTROS_CATEGORIAS.keys()) if args.categoria == "todas" else [args.categoria]
    
    todas_filas_csv = []
    features_totales = []
    
    for cat_id in categorias_a_procesar:
        info_cat = FILTROS_CATEGORIAS[cat_id]
        print(f"[>] Procesando {cat_id}: '{info_cat['nombre']}'...")
        
        elementos_osm = consultar_overpass(info_cat["filtro_osm"], bbox)
        feats, filas = normalizar_elementos(elementos_osm, cat_id)
        
        # Si es biodiversidad, agregamos además registros de GBIF
        if cat_id == "biodiversidad":
            print("    Consultando observaciones biológicas en GBIF...")
            regs_gbif = consultar_gbif(bbox, limite=40)
            for r in regs_gbif:
                lat = r.get("decimalLatitude")
                lon = r.get("decimalLongitude")
                if lat and lon:
                    esp = r.get("scientificName") or r.get("species") or "Especie indeterminada"
                    nom_c = r.get("vernacularName", "")
                    nombre_bio = f"{nom_c} ({esp})" if nom_c else esp
                    pub = r.get("institutionCode") or r.get("publishingOrgKey") or "GBIF/iNaturalist"
                    r_id = f"GBIF/{r.get('key')}"
                    feats.append({
                        "type": "Feature",
                        "id": r_id,
                        "geometry": {"type": "Point", "coordinates": [lon, lat]},
                        "properties": {
                            "id_vgi": r_id,
                            "categoria": "biodiversidad",
                            "subtipo": "Registro Biológico",
                            "nombre": nombre_bio,
                            "operador": pub,
                            "direccion": "",
                            "accesibilidad": "",
                            "fuente": "GBIF / iNaturalist",
                            "fecha": (r.get("eventDate") or "")[:10],
                            "licencia": r.get("license", "CC-BY 4.0")
                        }
                    })
                    filas.append([
                        r_id, "biodiversidad", "Registro Biológico", nombre_bio, pub, "", "",
                        "GBIF / iNaturalist", (r.get("eventDate") or "")[:10], r.get("license", "CC-BY 4.0"), lat, lon,
                        "", "", ""
                    ])
                    
        print(f"    [+] {len(feats)} entidades extraídas y normalizadas.")
        features_totales.extend(feats)
        todas_filas_csv.extend(filas)
        
        # Guardar archivo GeoJSON por categoría
        ruta_geojson_cat = os.path.join(args.output_dir, f"capa_{cat_id}.geojson")
        fc_cat = {
            "type": "FeatureCollection",
            "name": f"AtlasVGI_{cat_id}",
            "features": feats
        }
        with open(ruta_geojson_cat, "w", encoding="utf-8") as f:
            json.dump(fc_cat, f, indent=2, ensure_ascii=False)
            
    # Guardar GeoJSON integral
    ruta_integral = os.path.join(args.output_dir, "atlas_vgi_barrio_brasil_uah_completo.geojson")
    fc_integral = {
        "type": "FeatureCollection",
        "name": "AtlasVGI_BarrioBrasil_UAH_Completo",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features_totales
    }
    with open(ruta_integral, "w", encoding="utf-8") as f:
        json.dump(fc_integral, f, indent=2, ensure_ascii=False)
    print(f"\n[+] Capa GeoJSON integral generada: {ruta_integral}")
    
    # Resumen métrico acumulado
    total_m2 = sum(f["properties"].get("superficie_m2", 0) for f in features_totales if f["properties"].get("superficie_m2"))
    total_ha = round(total_m2 / 10000.0, 2)
    print(f"[+] Total entidades recopiladas: {len(features_totales)}")
    print(f"[+] Superficie acumulada de geometrías poligonales: {total_m2:,.1f} m² ({total_ha} ha) [EPSG:32719]")

    # Guardar CSV resumen
    ruta_csv = os.path.join(args.output_dir, "resumen_catastro_vgi.csv")
    with open(ruta_csv, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "id_vgi", "categoria", "subtipo", "nombre", "operador", "direccion", "accesibilidad",
            "fuente", "fecha_registro", "licencia", "latitud", "longitud", "superficie_m2", "superficie_ha", "srs_superficie"
        ])
        writer.writerows(todas_filas_csv)
    print(f"[+] Tabla normalizada CSV generada: {ruta_csv}")
    print("\n[OK] Extracción territorial completada exitosamente.")

if __name__ == "__main__":
    main()
