#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/verificar_esquema_17_atributos.py
----------------------------------------
Audita matemáticamente y valida que el 100% de las entidades en todas
las capas VGI del Atlas posean de forma íntegra los 17 atributos canónicos
del modelo de datos ISO 19110 / IDE Chile.
"""

import os
import sys
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DATA_DIR = os.path.join(ROOT_DIR, 'src', 'data')
DATA_DIR = os.path.join(ROOT_DIR, 'data')

CANONICAL_17 = [
    'id_vgi',
    'categoria',
    'subtipo',
    'nombre',
    'operador',
    'direccion',
    'accesibilidad',
    'fuente',
    'metodo_adquisicion',
    'licencia',
    'coordenadas',
    'geom_wkt',
    'bbox',
    'fecha_registro',
    'superficie_m2',
    'superficie_ha',
    'srs_superficie'
]

CAPAS_VGI = [
    'capa_educacion.geojson',
    'capa_servicios.geojson',
    'capa_transporte.geojson',
    'capa_movilidad_activa.geojson',
    'capa_espacio_publico.geojson',
    'capa_patrimonio.geojson',
    'capa_accesibilidad.geojson',
    'capa_biodiversidad.geojson',
    'capa_edificaciones.geojson',
    'capa_cobertura_suelo.geojson',
    'atlas_vgi_barrio_brasil_uah_completo.geojson'
]

def auditar_capas():
    print("═" * 74)
    print("  AUDITORÍA DE INTEGRIDAD: ESQUEMA NORMALIZADO DE 17 ATRIBUTOS VGI")
    print("═" * 74)
    
    total_entidades_auditadas = 0
    total_fallos = 0
    
    for fn in CAPAS_VGI:
        p_src = os.path.join(SRC_DATA_DIR, fn)
        p_data = os.path.join(DATA_DIR, fn)
        
        if not os.path.exists(p_src):
            print(f"❌ [FAIL] Archivo no existe en src/data: {fn}")
            total_fallos += 1
            continue
            
        with open(p_src, 'r', encoding='utf-8') as f:
            gj = json.load(f)
            
        feats = gj.get('features', [])
        total_entidades_auditadas += len(feats)
        
        # Validar cada entidad
        fallos_capa = 0
        faltantes_por_atributo = {k: 0 for k in CANONICAL_17}
        
        for feat in feats:
            props = feat.get('properties', {})
            for k in CANONICAL_17:
                if k not in props:
                    faltantes_por_atributo[k] += 1
                    fallos_capa += 1
                    
        if fallos_capa == 0:
            print(f"✅ [PASS] {fn:44} N={len(feats):4d} entidades | 17/17 OK (100.0%)")
        else:
            print(f"❌ [FAIL] {fn:44} N={len(feats):4d} entidades | {fallos_capa} fallos")
            for k, cant in faltantes_por_atributo.items():
                if cant > 0:
                    print(f"         - Atributo '{k}': ausente en {cant} entidades")
            total_fallos += fallos_capa
            
        # Validar sincronía con data/
        if os.path.exists(p_data):
            with open(p_data, 'r', encoding='utf-8') as f:
                gj_d = json.load(f)
            if len(gj_d.get('features', [])) != len(feats):
                print(f"⚠️  [WARN] Desincronización en conteo data/ vs src/data/ para {fn}")
                total_fallos += 1

    print("═" * 74)
    if total_fallos == 0:
        print(f"✨ ÉXITO TOTAL: {len(CAPAS_VGI)} capas auditadas, {total_entidades_auditadas:,} entidades.")
        print(f"   El 100% de las entidades contienen de forma estricta los 17 atributos canónicos.")
    else:
        print(f"❌ DETECTADOS {total_fallos} FALLOS DE CONFORMIDAD.")
        sys.exit(1)
    print("═" * 74)

if __name__ == '__main__':
    auditar_capas()
