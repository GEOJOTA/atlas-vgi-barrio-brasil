#!/usr/bin/env python3
"""
descargar_gbif_rm_fallback.py
-----------------------------
Descarga exhaustiva y estructuración del catálogo de biodiversidad
de la Región Metropolitana de Santiago desde la API pública de GBIF.

Realiza múltiples consultas facetadas y espaciales por reinos, clases,
órdenes y comunas de la RM para recopilar la mayor densidad biológica
posible dentro de los límites de rendimiento web y de repositorios.
"""

import urllib.request
import urllib.parse
import json
import ssl
import time
import os
import sys

# Diccionario expandido de nombres comunes de Chile
NOMBRES_COMUNES = {
    'jubaea chilensis': 'Palma chilena',
    'zonotrichia capensis': 'Chincol / Gorrión americano',
    'turdus falcklandii': 'Zorzal patagónico',
    'columbina picui': 'Tortolita cuyana',
    'vanellus chilensis': 'Queltehue / Treile',
    'schinus molle': 'Pimiento boliviano / Molle',
    'schinus polygamus': 'Huingán',
    'cryptocarya alba': 'Peumo',
    'quillaja saponaria': 'Quillay',
    'jacaranda mimosifolia': 'Jacarandá',
    'lithraea caustica': 'Litre',
    'maytenus boaria': 'Maitén',
    'vachellia caven': 'Espino / Aromo',
    'peumus boldus': 'Boldo',
    'prosopis chilensis': 'Algarrobo chileno',
    'kageneckia oblonga': 'Bollén',
    'escallonia illinita': 'Barraco',
    'colliguaja odorifera': 'Colliguay',
    'retanilla trinervia': 'Tebo',
    'cobea scandens': 'Cobaea',
    'bombus dahlbomii': 'Moscardón del bosque (Abejorro nativo)',
    'bombus terrestris': 'Abejorro común europeo',
    'bombus ruderatus': 'Abejorro gigante',
    'apis mellifera': 'Abeja melífera',
    'mimus thenca': 'Tenca',
    'zenaida auriculata': 'Tórtola torcaza',
    'columba livia': 'Paloma bravía',
    'cathartes aura': 'Jote de cabeza colorada',
    'coragyps atratus': 'Jote de cabeza negra',
    'phytotoma rara': 'Rara',
    'muscisaxicola maclovianus': 'Dormilona tontita',
    'patagona gigas': 'Picaflor gigante',
    'sephanoides sephaniodes': 'Picaflor chico / Pingüirirí',
    'falco sparverius': 'Cernícalo',
    'milvago chimango': 'Tiuque',
    'parabuteo unicinctus': 'Peuco',
    'geranoaetus polyosoma': 'Aguilucho común',
    'nycticorax nycticorax': 'Huairavo / Garza bruja',
    'leucophaeus pipixcan': 'Gaviota de Franklin',
    'passer domesticus': 'Gorrión común',
    'myiopsitta monachus': 'Cotorra argentina',
    'spinus barbatus': 'Jilguero',
    'sicalis luteola': 'Chirigüe común',
    'diuca diuca': 'Diuca',
    'troglodytes aedon': 'Chercán',
    'lessonia rufa': 'Colegial',
    'anas georgica': 'Pato jergón grande',
    'anas flavirostris': 'Pato jergón chico',
    'fulica armillata': 'Tagua común',
    'liolaemus tenuis': 'Lagartija esbelta',
    'liolaemus chiliensis': 'Lagartija nítida / Lagarto llorón',
    'liolaemus monticola': 'Lagartija de los montes',
    'liolaemus lemniscatus': 'Lagartija lemniscata',
    'liolaemus nitidus': 'Lagarto nítido',
    'calyptocephalella gayi': 'Rana chilena',
    'pleurodema thaul': 'Sapito de cuatro ojos',
    'rhinella arunco': 'Sapo de rulo',
    'lycalopex culpaeus': 'Zorro culpeo',
    'tadarida brasiliensis': 'Murciélago cola de ratón',
    'myotis chiloensis': 'Murciélago oreja de ratón',
    'abrothrix olivacea': 'Ratón oliváceo',
    'octodon degus': 'Degú'
}

# Límites geográficos de la Región Metropolitana de Santiago
BBOX_RM = [-71.85, -34.45, -69.75, -32.90]

def es_coordenada_en_rm(lon, lat):
    if lon is None or lat is None:
        return False
    return BBOX_RM[0] <= lon <= BBOX_RM[2] and BBOX_RM[1] <= lat <= BBOX_RM[3]

def consultar_gbif(params, limite=300, max_paginas=5):
    ctx = ssl._create_unverified_context()
    base_url = "https://api.gbif.org/v1/occurrence/search"
    registros = []
    
    for pagina in range(max_paginas):
        offset = pagina * limite
        if offset >= 100000:
            break
            
        query_params = {
            **params,
            "hasCoordinate": "true",
            "hasGeospatialIssue": "false",
            "limit": str(limite),
            "offset": str(offset)
        }
        
        encoded_params = urllib.parse.urlencode(query_params)
        url = f"{base_url}?{encoded_params}"
        req = urllib.request.Request(url, headers={"User-Agent": "AtlasVGI-UAH-GeoProcess/2.0"})
        
        try:
            with urllib.request.urlopen(req, timeout=25, context=ctx) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                results = data.get("results", [])
                if not results:
                    break
                registros.extend(results)
                if len(results) < limite:
                    break
            time.sleep(0.25)
        except Exception as e:
            print(f"  [!] Advertencia en página {pagina}: {e}")
            break
            
    return registros

def transformar_a_geojson(registros):
    features = []
    vistos = set()
    
    for r in registros:
        key = r.get("key") or r.get("gbifID")
        if not key or key in vistos:
            continue
        vistos.add(key)
        
        lat = r.get("decimalLatitude")
        lon = r.get("decimalLongitude")
        if not es_coordenada_en_rm(lon, lat):
            continue
            
        sp = r.get("species") or r.get("canonicalName") or (r.get("scientificName", "").split("(")[0].strip() if r.get("scientificName") else "Especie no determinada")
        sp_lower = sp.lower()
        nom_comun = r.get("vernacularName") or NOMBRES_COMUNES.get(sp_lower) or None
        
        # Fecha
        fecha_orig = r.get("eventDate") or r.get("year")
        fecha_str = "2026-01-01"
        if fecha_orig:
            fecha_str = str(fecha_orig)[:10]
            
        # 17 atributos canónicos
        id_vgi = f"GBIF/{key}"
        coords = [round(lon, 6), round(lat, 6)]
        geom_wkt = f"POINT({coords[0]} {coords[1]})"
        bbox_entidad = [coords[0], coords[1], coords[0], coords[1]]
        
        pub = r.get("datasetName") or "iNaturalist / GBIF (Catálogo Región Metropolitana)"
        lic = r.get("license") or "http://creativecommons.org/licenses/by/4.0/legalcode"
        
        feature = {
            "type": "Feature",
            "id": id_vgi,
            "geometry": {
                "type": "Point",
                "coordinates": coords
            },
            "properties": {
                # 17 Atributos Canónicos VGI
                "id_vgi": id_vgi,
                "categoria": "CAT-08 (Biodiversidad Urbana)",
                "subtipo": "Registro Biológico (GBIF/iNat)",
                "nombre": nom_comun or sp,
                "operador": pub,
                "direccion": None,
                "accesibilidad": None,
                "fuente": "GBIF Occurrence API / Ciencia Ciudadana (Región Metropolitana)",
                "metodo_adquisicion": "Consulta REST API GBIF Occurrence (Catálogo RM verificado)",
                "licencia": lic,
                "coordenadas": coords,
                "geom_wkt": geom_wkt,
                "bbox": bbox_entidad,
                "fecha_registro": fecha_str,
                "superficie_m2": None,
                "superficie_ha": None,
                "srs_superficie": None,
                # Atributos Darwin Core y GBIF
                "gbifID": str(key),
                "especie": sp,
                "scientificName": r.get("scientificName") or sp,
                "nombreComun": nom_comun,
                "reino": r.get("kingdom") or "Indeterminado",
                "clase": r.get("class"),
                "orden": r.get("order"),
                "familia": r.get("family"),
                "genero": r.get("genus"),
                "fecha": fecha_str,
                "issues": r.get("issues", [])
            }
        }
        features.append(feature)
        
    return {
        "type": "FeatureCollection",
        "name": "gbif_biodiversidad_region_metropolitana_fallback",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
        },
        "features": features
    }

def main():
    print("=" * 70)
    print("DESCARGA MASIVA EXHAUSTIVA DE REGISTROS GBIF — REGIÓN METROPOLITANA")
    print("=" * 70)
    
    # Batería multidimensional de consultas por cuadrantes geográficos y grupos biológicos
    consultas = [
        # A. Foco Centro Metropolitano (Barrio Brasil, Santiago, Quinta Normal, Yungay, Santa Lucía)
        {"country": "CL", "decimalLatitude": "-33.460,-33.430", "decimalLongitude": "-70.680,-70.645"},
        {"country": "CL", "decimalLatitude": "-33.450,-33.415", "decimalLongitude": "-70.665,-70.615"}, # Recoleta, Parque Metropolitano
        {"country": "CL", "decimalLatitude": "-33.445,-33.400", "decimalLongitude": "-70.620,-70.570"}, # Providencia, Las Condes
        {"country": "CL", "decimalLatitude": "-33.490,-33.440", "decimalLongitude": "-70.620,-70.540"}, # Ñuñoa, La Reina, Peñalolén
        {"country": "CL", "decimalLatitude": "-33.560,-33.490", "decimalLongitude": "-70.620,-70.520"}, # La Florida, Puente Alto
        {"country": "CL", "decimalLatitude": "-33.640,-33.550", "decimalLongitude": "-70.750,-70.620"}, # San Bernardo, Calera de Tango
        {"country": "CL", "decimalLatitude": "-33.560,-33.470", "decimalLongitude": "-70.800,-70.700"}, # Maipú, Cerrillos, Estación Central
        {"country": "CL", "decimalLatitude": "-33.480,-33.390", "decimalLongitude": "-70.850,-70.720"}, # Pudahuel, Cerro Navia, Lo Prado, Renca
        {"country": "CL", "decimalLatitude": "-33.380,-33.280", "decimalLongitude": "-70.780,-70.600"}, # Huechuraba, Conchalí, Quilicura, Colina
        {"country": "CL", "decimalLatitude": "-33.750,-33.550", "decimalLongitude": "-70.550,-70.000"}, # San José de Maipo, Cajón del Maipo, Pirque
        {"country": "CL", "decimalLatitude": "-33.850,-33.600", "decimalLongitude": "-71.500,-70.800"}, # Talagante, Melipilla, Peñaflor
        {"country": "CL", "decimalLatitude": "-33.950,-33.700", "decimalLongitude": "-70.850,-70.600"}, # Buin, Paine

        # B. Plantae (Reino Vegetal completo: árboles nativos, matorral esclerófilo, flora urbana)
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "kingdomKey": "6"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "kingdomKey": "6", "year": "2024,2026"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "kingdomKey": "6", "year": "2020,2023"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "kingdomKey": "6", "year": "2015,2019"},

        # C. Insecta (Abejorros, abejas nativas, mariposas, coleópteros)
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "classKey": "216"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "classKey": "216", "year": "2023,2026"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "classKey": "216", "year": "2018,2022"},

        # D. Aves (Avifauna urbana y silvestre de la cuenca)
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "classKey": "212"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "classKey": "212", "year": "2025,2026"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "classKey": "212", "year": "2024"},

        # E. Reptilia, Amphibia, Mammalia y Fungi
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "classKey": "358"}, # Reptilia
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "classKey": "131"}, # Amphibia
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "classKey": "359"}, # Mammalia
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "kingdomKey": "5"}, # Fungi

        # F. Consultas por géneros clave de conservación
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "q": "Jubaea"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "q": "Bombus"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "q": "Cryptocarya"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "q": "Quillaja"},
        {"country": "CL", "stateProvince": "Región Metropolitana de Santiago", "q": "Liolaemus"}
    ]
    
    total_crudos = []
    print(f"Iniciando descarga sobre {len(consultas)} ejes de consulta...")
    for idx, c in enumerate(consultas, 1):
        nombre_eje = c.get("q") or c.get("classKey") or c.get("kingdomKey") or c.get("decimalLatitude") or "General"
        print(f"[{idx:02d}/{len(consultas):02d}] Consultando GBIF: {nombre_eje}...", end=" ", flush=True)
        res = consultar_gbif(c, limite=300, max_paginas=4)
        print(f"-> {len(res)} registros")
        total_crudos.extend(res)
        
    print(f"\n[+] Total registros crudos acumulados: {len(total_crudos)}")
    geojson = transformar_a_geojson(total_crudos)
    num_entidades = len(geojson["features"])
    print(f"[+] Total registros únicos validados en la Región Metropolitana: {num_entidades}")
    
    # Guardar en data/ y src/data/
    rutas = [
        "data/gbif_rm_fallback.geojson",
        "src/data/gbif_rm_fallback.geojson",
        "data/gbif_barrio_brasil_fallback.geojson",
        "src/data/gbif_barrio_brasil_fallback.geojson"
    ]
    
    for r in rutas:
        os.makedirs(os.path.dirname(r), exist_ok=True)
        with open(r, "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False, indent=2)
        tam_mb = os.path.getsize(r) / (1024 * 1024)
        print(f"  [✓] Guardado en {r} ({tam_mb:.2f} MB)")
        
    print("\n✅ Proceso completado con éxito.")

if __name__ == "__main__":
    main()
