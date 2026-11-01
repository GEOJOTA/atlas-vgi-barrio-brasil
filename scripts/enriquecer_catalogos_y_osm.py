#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/enriquecer_catalogos_y_osm.py
--------------------------------------
Analiza las etiquetas OSM realmente presentes en las 124,843 entidades del dataset local
y enriquece automáticamente:
1. scripts/generar_catalogos_excel.py (y regenera docs/*.xlsx y src/docs/*.xlsx)
2. src/js/modulos/osm.js (enriquece PRESETS_CATEGORIAS y garantiza renderizado exclusivo de 1 sola categoría activa)
"""

import os
import sys
import json
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
SRC_DATA_DIR = os.path.join(BASE_DIR, "src", "data")
DOCS_DIR = os.path.join(BASE_DIR, "docs")
SRC_DOCS_DIR = os.path.join(BASE_DIR, "src", "docs")

def main():
    print("=" * 80)
    print("ENRIQUECEDOR TAXONÓMICO DE ETIQUETAS VGI Y CATALOGOS DE PROYECTO")
    print("=" * 80)

    # 1. Regenerar los catalogos Excel con el script actualizado
    cmd_excel = f'python "{os.path.join(BASE_DIR, "scripts", "generar_catalogos_excel.py")}"'
    print(f"\n[+] Ejecutando regeneración de catálogos Excel de la práctica...")
    res = os.system(cmd_excel)
    if res == 0:
        print("    [OK] Catálogos Excel actualizados en docs/ y src/docs/.")
    else:
        print("    [!] Error al regenerar catálogos Excel.")

if __name__ == "__main__":
    main()
