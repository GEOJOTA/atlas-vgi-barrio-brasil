#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/sincronizar_capas_osm_locales.py
---------------------------------------
Sincroniza y consolida las 10 capas VGI descargadas localmente en data/ y src/data/
asegurando fallback local 100% funcional ante fallos o saturaciones de Overpass API.
"""

import os
import json
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
SRC_DATA_DIR = os.path.join(BASE_DIR, "src", "data")

MAPA_CATEGORIAS = [
    ("educacion", "capa_educacion.geojson", "capa_osm_rm_cat01_educacion.geojson", "CAT-01", "Educación y Universidad"),
    ("servicios", "capa_servicios.geojson", "capa_osm_rm_cat02_servicios.geojson", "CAT-02", "Servicios y Comercio Barrial"),
    ("transporte", "capa_transporte.geojson", "capa_osm_rm_cat03_transporte.geojson", "CAT-03", "Movilidad y Transporte"),
    ("movilidad_activa", "capa_movilidad_activa.geojson", "capa_osm_rm_cat04_movilidad_activa.geojson", "CAT-04", "Movilidad Activa y Ciclovías"),
    ("espacio_publico", "capa_espacio_publico.geojson", "capa_osm_rm_cat05_espacio_publico.geojson", "CAT-05", "Áreas Verdes y Espacio Público"),
    ("patrimonio", "capa_patrimonio.geojson", "capa_osm_rm_cat06_patrimonio.geojson", "CAT-06", "Patrimonio y Cultura"),
    ("accesibilidad", "capa_accesibilidad.geojson", "capa_osm_rm_cat07_accesibilidad.geojson", "CAT-07", "Accesibilidad Universal"),
    ("biodiversidad", "capa_biodiversidad.geojson", "capa_osm_rm_cat08_biodiversidad.geojson", "CAT-08", "Biodiversidad Urbana"),
    ("edificaciones", "capa_edificaciones.geojson", "capa_osm_rm_cat09_edificaciones.geojson", "CAT-09", "Edificaciones y Huella Urbana"),
    ("cobertura_suelo", "capa_cobertura_suelo.geojson", "capa_osm_rm_cat10_cobertura_suelo.geojson", "CAT-10", "Coberturas y Usos de Suelo")
]

def main():
    print("=" * 80)
    print("SINCRONIZADOR DE CAPAS LOCALES OSM — FALLBACK OFFLINE ATLAS VGI")
    print("=" * 80)
    
    todas_las_features = []
    
    for cat_id, f_orig, f_dest, cod_cat, nom_cat in MAPA_CATEGORIAS:
        src_path = os.path.join(SRC_DATA_DIR, f_dest)
        orig_path = os.path.join(SRC_DATA_DIR, f_orig)
        
        feats = []
        data_dest_path = os.path.join(DATA_DIR, f_dest)
        if os.path.exists(data_dest_path) and os.path.getsize(data_dest_path) > 500:
            with open(data_dest_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                feats = data.get("features", [])
        elif os.path.exists(src_path) and os.path.getsize(src_path) > 500:
            with open(src_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                feats = data.get("features", [])
        elif os.path.exists(orig_path) and os.path.getsize(orig_path) > 500:
            with open(orig_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                feats = data.get("features", [])

        # Enriquecer propiedades con taxonomía completa
        for feat in feats:
            props = feat.get("properties", {})
            props["categoria"] = cod_cat
            props["categoria_id"] = cat_id
            props["nombre_categoria"] = nom_cat
            feat["properties"] = props
            todas_las_features.append(feat)

        fc = {
            "type": "FeatureCollection",
            "name": f_dest.replace(".geojson", ""),
            "metadata": {
                "codigo_categoria": cod_cat,
                "nombre_categoria": nom_cat,
                "total_entidades": len(feats),
                "fuente": "OpenStreetMap Contributors (ODbL 1.0 / Nodo Local Región Metropolitana)",
                "fecha_sincronizacion": time.strftime("%Y-%m-%d %H:%M:%S")
            },
            "features": feats
        }

        # Guardar en data/ y src/data/
        p1 = os.path.join(DATA_DIR, f_dest)
        p2 = os.path.join(SRC_DATA_DIR, f_dest)
        with open(p1, "w", encoding="utf-8") as f:
            json.dump(fc, f, ensure_ascii=False, separators=(',', ':'))
        with open(p2, "w", encoding="utf-8") as f:
            json.dump(fc, f, ensure_ascii=False, separators=(',', ':'))
            
        print(f"  [OK] {cod_cat} ({nom_cat}): {len(feats):,} entidades guardadas en data/ y src/data/")

    # Capa maestra consolidada
    fc_maestra = {
        "type": "FeatureCollection",
        "name": "capa_osm_rm_completo_vgi",
        "metadata": {
            "descripcion": "Base de datos vectoriales integrales de OpenStreetMap para la Región Metropolitana (10 Macro-Categorías VGI). Usada para fallback local instantáneo ante saturación de Overpass API.",
            "total_entidades": len(todas_las_features),
            "fuente": "OpenStreetMap Contributors (ODbL 1.0)",
            "fecha_sincronizacion": time.strftime("%Y-%m-%d %H:%M:%S")
        },
        "features": todas_las_features
    }

    mp1 = os.path.join(DATA_DIR, "capa_osm_rm_completo_vgi.geojson")
    mp2 = os.path.join(SRC_DATA_DIR, "capa_osm_rm_completo_vgi.geojson")
    with open(mp1, "w", encoding="utf-8") as f:
        json.dump(fc_maestra, f, ensure_ascii=False, separators=(',', ':'))
    with open(mp2, "w", encoding="utf-8") as f:
        json.dump(fc_maestra, f, ensure_ascii=False, separators=(',', ':'))

    print(f"\n[OK] Capa Maestra Off-Line Sincronizada: {len(todas_las_features):,} entidades totales ({os.path.getsize(mp1)/(1024*1024):.2f} MB)")
    print("=" * 80)

if __name__ == "__main__":
    main()
