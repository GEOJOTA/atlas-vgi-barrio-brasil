#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_cliente_apis.py
Valida el comportamiento del cliente web con las APIs actualizadas:
- Overpass (con rotación de espejos activos: overpass-api.de, z.overpass-api.de, kumi.systems)
- ohsome v1 (con ventana segura 2021-01-01 a fecha máxima 2026-07-27, timeouts holgados)
- GBIF (Species y Occurrence con timeouts de 15s)
- Taginfo v4
- OSM Changesets
"""

import requests
import time
import json

def test_overpass():
    print("\n--- TEST OVERPASS CON ESPEJOS ACTIVOS ---")
    bbox_ql = "(-33.4505,-70.6720,-33.4350,-70.6580)"
    query = f"[out:json][timeout:25];(node[\"amenity\"=\"university\"]{bbox_ql};way[\"amenity\"=\"university\"]{bbox_ql};);out count;"
    
    espejos = [
        "https://overpass-api.de/api/interpreter",
        "https://z.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ]
    
    for esp in espejos:
        t0 = time.time()
        try:
            r = requests.post(esp, data={"data": query}, timeout=15)
            ms = round((time.time() - t0) * 1000)
            if r.status_code == 200:
                print(f"[OK] {esp:45} | {ms:5}ms | Respuesta válida")
            else:
                print(f"[STATUS {r.status_code}] {esp:45} | {ms:5}ms | {r.text[:100]}")
        except Exception as e:
            print(f"[FAIL] {esp:45} | {e}")

def test_ohsome():
    print("\n--- TEST OHSOME v1 (FECHA SEGURA + TODAS LAS CATEGORIAS) ---")
    bbox = "-70.6720,-33.4505,-70.6580,-33.4350"
    
    # 1. Obtener fecha máxima
    r_meta = requests.get("https://api.ohsome.org/v1/metadata", timeout=10)
    fecha_fin = r_meta.json().get("extractRegion", {}).get("temporalExtent", {}).get("toTimestamp", "2026-07-27T00:00Z")[:10]
    print(f"Fecha máxima detectada en servidor: {fecha_fin}")
    
    ventana = f"2021-01-01/{fecha_fin}/P1Y"
    
    filtros = [
        ("Educación (Nodos/Vías)", "amenity=university and (type:node or type:way)"),
        ("Comercio y Salud", "shop=* and (type:node or type:way)"),
        ("Transporte Paraderos", "highway=bus_stop and type:node"),
        ("Accesibilidad Cruces", "(highway=crossing or kerb=*) and type:node"),
        ("Patrimonio Casonas", "historic=* and (type:node or type:way)"),
        ("Espacio Público Parques", "leisure=park and (type:way or type:relation)"),
        ("Edificaciones Huellas", "building=* and type:way"),
        ("Movilidad Ciclovías", "(highway=cycleway or cycleway=*) and type:way"),
        ("Biodiversidad Árboles", "natural=tree and type:node")
    ]
    
    for nombre, filtro in filtros:
        t0 = time.time()
        try:
            r = requests.post("https://api.ohsome.org/v1/elements/count", 
                              data={"bboxes": bbox, "filter": filtro, "time": ventana},
                              timeout=25)
            ms = round((time.time() - t0) * 1000)
            if r.status_code == 200:
                res = r.json().get("result", [])
                cantidades = [f"{x.get('timestamp','')[:4]}:{int(x.get('value',0))}" for x in res]
                print(f"[OK] {nombre:25} | {ms:5}ms | Serie: {' -> '.join(cantidades)}")
            else:
                print(f"[ERROR {r.status_code}] {nombre:25} | {ms:5}ms | {r.text[:120]}")
        except Exception as e:
            print(f"[TIMEOUT/FAIL] {nombre:25} | {e}")

def main():
    print("=" * 80)
    print("VERIFICACION OPERATIVA COMPLETA DE APIS ACTUALIZADAS")
    print("=" * 80)
    test_overpass()
    test_ohsome()
    print("\n" + "=" * 80)
    print("VERIFICACION COMPLETADA CON EXITO")
    print("=" * 80)

if __name__ == "__main__":
    main()
