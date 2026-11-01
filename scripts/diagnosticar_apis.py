#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
diagnosticar_apis.py
Script integral para auditar y diagnosticar el estado de todas las APIs
externas y servicios utilizados en el Atlas VGI UAH.
"""

import requests
import time
import json
import sys

def test_endpoint(categoria, nombre, metodo, url, **kwargs):
    t0 = time.time()
    try:
        headers = kwargs.pop('headers', {})
        if 'User-Agent' not in headers:
            headers['User-Agent'] = 'AtlasVGI-UAH/2026 (diagnostico territorial; contacto: juanpablolescanovillegas@gmail.com)'
        
        if metodo == 'GET':
            resp = requests.get(url, headers=headers, timeout=12, **kwargs)
        else:
            resp = requests.post(url, headers=headers, timeout=12, **kwargs)
            
        elapsed_ms = round((time.time() - t0) * 1000)
        cors = resp.headers.get('Access-Control-Allow-Origin', 'NO_CORS')
        status = resp.status_code
        
        estado = "OK" if status in (200, 201) else ("AUTH_REQ" if status in (401, 403) else f"STATUS_{status}")
        print(f"[{estado:10}] {categoria:15} | {nombre:30} | {elapsed_ms:5}ms | CORS: {cors:15} | HTTP {status}")
        
        if status not in (200, 201):
            snippet = resp.text.strip().replace('\n', ' ')[:140]
            print(f"             --> Detalle: {snippet}")
        return {
            "categoria": categoria,
            "nombre": nombre,
            "url": url,
            "status": status,
            "cors": cors,
            "elapsed_ms": elapsed_ms,
            "ok": status in (200, 201),
            "texto": resp.text[:300]
        }
    except requests.exceptions.Timeout:
        elapsed_ms = round((time.time() - t0) * 1000)
        print(f"[TIMEOUT   ] {categoria:15} | {nombre:30} | {elapsed_ms:5}ms | TIMEOUT (>12s)")
        return {"categoria": categoria, "nombre": nombre, "url": url, "status": 0, "ok": False, "error": "Timeout"}
    except Exception as exc:
        elapsed_ms = round((time.time() - t0) * 1000)
        print(f"[ERROR     ] {categoria:15} | {nombre:30} | {elapsed_ms:5}ms | Error: {str(exc)[:100]}")
        return {"categoria": categoria, "nombre": nombre, "url": url, "status": 0, "ok": False, "error": str(exc)}

def main():
    print("=" * 105)
    print("AUDITORIA Y DIAGNOSTICO DE APIS - ATLAS VGI UAH (16-09-2026)")
    print("=" * 105)
    
    bbox_barrio_brasil = "-70.6720,-33.4505,-70.6580,-33.4350"
    ql_bbox = "(-33.4505,-70.6720,-33.4350,-70.6580)"
    
    resultados = []
    
    # 1. OVERPASS API (Espejos)
    print("\n--- 1. OVERPASS API QL (Consultas Espaciales en Vivo) ---")
    ql_query = f"[out:json][timeout:20];node[\"amenity\"=\"pharmacy\"]{ql_bbox};out count;"
    resultados.append(test_endpoint("Overpass", "Principal (de)", "POST", "https://overpass-api.de/api/interpreter", data={"data": ql_query}))
    resultados.append(test_endpoint("Overpass", "Espejo lz4 (de)", "POST", "https://lz4.overpass-api.de/api/interpreter", data={"data": ql_query}))
    resultados.append(test_endpoint("Overpass", "Espejo z (de)", "POST", "https://z.overpass-api.de/api/interpreter", data={"data": ql_query}))
    resultados.append(test_endpoint("Overpass", "Espejo Kumi Systems", "POST", "https://overpass.kumi.systems/api/interpreter", data={"data": ql_query}))
    resultados.append(test_endpoint("Overpass", "Espejo Mail.ru", "POST", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", data={"data": ql_query}))
    
    # 2. OHSOME API (v1 vs v2 HeiGIT)
    print("\n--- 2. OHSOME API (Métricas de Calidad y Series Históricas HeiGIT) ---")
    resultados.append(test_endpoint("ohsome v1", "Metadata del Servidor", "GET", "https://api.ohsome.org/v1/metadata"))
    resultados.append(test_endpoint("ohsome v1", "Conteo (/elements/count)", "POST", "https://api.ohsome.org/v1/elements/count", 
                                    data={"bboxes": bbox_barrio_brasil, "filter": "building=* and type:way", "time": "2026-06-01"}))
    resultados.append(test_endpoint("ohsome v1", "Serie Anual (/users/count)", "POST", "https://api.ohsome.org/v1/users/count", 
                                    data={"bboxes": bbox_barrio_brasil, "filter": "building=* and type:way", "time": "2021-01-01/2026-06-01/P1Y"}))
    resultados.append(test_endpoint("ohsome v1", "Longitud Red (/elements/length)", "POST", "https://api.ohsome.org/v1/elements/length", 
                                    data={"bboxes": bbox_barrio_brasil, "filter": "highway=* and type:way", "time": "2026-06-01"}))
    resultados.append(test_endpoint("ohsome v1", "Superficie (/elements/area)", "POST", "https://api.ohsome.org/v1/elements/area", 
                                    data={"bboxes": bbox_barrio_brasil, "filter": "building=* and type:way", "time": "2026-06-01"}))
    resultados.append(test_endpoint("ohsome v1", "Contribuciones (/contributions)", "POST", "https://api.ohsome.org/v1/contributions/count", 
                                    data={"bboxes": bbox_barrio_brasil, "filter": "building=* and type:way", "time": "2021-01-01/2026-06-01/P1Y"}))
    
    # ohsome v2 (HeiGIT)
    resultados.append(test_endpoint("ohsome v2", "Metadata (api.heigit.org)", "GET", "https://api.heigit.org/ohsome-api/v2-rc/metadata"))
    resultados.append(test_endpoint("ohsome v2", "Features Count (sin key)", "POST", "https://api.heigit.org/ohsome-api/v2-rc/stats/features/count", 
                                    data={"bboxes": bbox_barrio_brasil, "filter": "building=*", "time": "2026-06-01"}))
    resultados.append(test_endpoint("ohsome v2", "Metadata (api.ohsome.org/v2)", "GET", "https://api.ohsome.org/v2/metadata"))
    
    # 3. TAGINFO API
    print("\n--- 3. TAGINFO API (Telemetría y Frecuencias Globales) ---")
    resultados.append(test_endpoint("Taginfo", "Estadísticas Tag (pharmacy)", "GET", "https://taginfo.openstreetmap.org/api/4/tag/stats?key=amenity&value=pharmacy"))
    resultados.append(test_endpoint("Taginfo", "Valores de Key (amenity)", "GET", "https://taginfo.openstreetmap.org/api/4/key/values?key=amenity&page=1&rp=5"))
    resultados.append(test_endpoint("Taginfo", "Valores de Key (building)", "GET", "https://taginfo.openstreetmap.org/api/4/key/values?key=building&page=1&rp=5"))
    
    # 4. OSM CHANGESETS API & OSMCHA
    print("\n--- 4. OSM CHANGESETS API & OSMCHA ---")
    resultados.append(test_endpoint("OSM Changesets", "Ediciones en Bbox (OSM API)", "GET", f"https://api.openstreetmap.org/api/0.6/changesets?bbox={bbox_barrio_brasil}"))
    resultados.append(test_endpoint("OSMCha", "Portal OSMCha (Front)", "GET", "https://osmcha.org/"))
    
    # 5. GBIF API (Biodiversidad y Taxonomía)
    print("\n--- 5. GBIF API (Biodiversidad y Especies de Ciencia Ciudadana) ---")
    resultados.append(test_endpoint("GBIF Species", "Autocompletado Especie", "GET", "https://api.gbif.org/v1/species/suggest?q=quillay"))
    resultados.append(test_endpoint("GBIF Occurrence", "Búsqueda en Bbox", "GET", "https://api.gbif.org/v1/occurrence/search?decimalLatitude=-33.4505,-33.4350&decimalLongitude=-70.6720,-70.6580&limit=5"))
    
    # 6. UMAP
    print("\n--- 6. UMAP (Cartografía Temática Comunitaria) ---")
    resultados.append(test_endpoint("UMap", "Instancia Oficial Francia", "GET", "https://umap.openstreetmap.fr/es/"))
    
    # 7. SUPABASE (PostGIS Cloud + Storage CDN)
    print("\n--- 7. SUPABASE POSTGIS CLOUD & STORAGE CDN ---")
    resultados.append(test_endpoint("Supabase", "REST API Root", "GET", "https://tkfzmmlhhxqhzgqavsqr.supabase.co/rest/v1/"))
    resultados.append(test_endpoint("Supabase", "Storage atlas-geojson CDN", "GET", "https://tkfzmmlhhxqhzgqavsqr.supabase.co/storage/v1/object/public/atlas-geojson/capa_oficial_01.geojson"))
    
    # 8. MINVU GEOIDE & SERVICIOS WMS
    print("\n--- 8. MINVU GEOIDE & SERVICIOS WMS ESTATALES ---")
    resultados.append(test_endpoint("MINVU", "Catálogo REST FeatureServer", "GET", "https://geoide.minvu.cl/server/rest/services?f=json"))
    resultados.append(test_endpoint("IDE Chile", "Geoportal CSW / Metadatos", "GET", "https://www.geoportal.cl/"))

    print("\n" + "=" * 105)
    total = len(resultados)
    exitosos = sum(1 for r in resultados if r.get("ok"))
    print(f"RESUMEN FINAL: {exitosos}/{total} endpoints operaron con respuesta 200 OK.")
    print("=" * 105)

if __name__ == "__main__":
    main()
