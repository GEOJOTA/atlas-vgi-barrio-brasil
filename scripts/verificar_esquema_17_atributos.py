# -*- coding: utf-8 -*-
import os, sys, json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DATA_DIR = os.path.join(ROOT_DIR, 'src', 'data')
DATA_DIR = os.path.join(ROOT_DIR, 'data')

CANONICAL_17_VGI = [
    'id_igv', 'categoria', 'subtipo', 'nombre', 'operador', 'direccion',
    'accesibilidad', 'fuente', 'metodo_adquisicion', 'licencia', 'coordenadas',
    'geom_wkt', 'bbox', 'fecha_registro', 'superficie_m2', 'superficie_ha', 'srs_superficie'
]

CANONICAL_17_OFICIAL = [
    'id_ig', 'categoria', 'subtipo', 'nombre', 'operador', 'direccion',
    'accesibilidad', 'fuente', 'metodo_adquisicion', 'licencia', 'coordenadas',
    'geom_wkt', 'bbox', 'fecha_registro', 'superficie_m2', 'superficie_ha', 'srs_superficie'
]

CAPAS_VGI = [
    'capa_educacion.geojson', 'capa_servicios.geojson', 'capa_transporte.geojson',
    'capa_movilidad_activa.geojson', 'capa_espacio_publico.geojson', 'capa_patrimonio.geojson',
    'capa_accesibilidad.geojson', 'capa_biodiversidad.geojson', 'capa_edificaciones.geojson',
    'capa_cobertura_suelo.geojson', 'atlas_vgi_barrio_brasil_uah_completo.geojson'
]

CAPAS_OFICIALES_MUESTRA = [
    'ide_censo2024_regional.geojson', 'ide_censo2024_limite_urbano.geojson',
    'ide_censo2024_localidades.geojson', 'ide_censo2024_zonal.geojson',
    'ide_censo2024_manzanas.geojson', 'ide_minvu_patrimonio.geojson',
    'ide_educacion_parvularia.geojson', 'ide_establecimientos_salud.geojson',
    'ide_bomberos.geojson', 'ide_carabineros.geojson',
    'semaforos_rm_uoct_2026.geojson', 'RSH_Sexo_UV_2026_Agosto.geojson'
]

def auditar_capas():
    print('==============================================================================')
    print('  AUDITORIA DE INTEGRIDAD: ESQUEMA NORMALIZADO (ID_IGV / ID_IG)')
    print('==============================================================================')
    total_entidades = 0
    total_fallos = 0

    print('\n--- [1/2] Capas Colaborativas VGI (Esquema Canónico id_igv) ---')
    for fn in CAPAS_VGI:
        p_src = os.path.join(SRC_DATA_DIR, fn)
        if not os.path.exists(p_src):
            continue
        with open(p_src, 'r', encoding='utf-8') as f:
            gj = json.load(f)
        feats = gj.get('features', [])
        total_entidades += len(feats)
        fallos = 0
        for feat in feats:
            p = feat.get('properties', {})
            for k in CANONICAL_17_VGI:
                if k == 'id_igv':
                    if 'id_igv' not in p and 'id_vgi' not in p:
                        fallos += 1
                elif k not in p:
                    fallos += 1
        if fallos == 0:
            print(f'OK [PASS] {fn:44} N={len(feats):5d} | 17/17 id_igv OK')
        else:
            print(f'FAIL    {fn:44} | {fallos} fallos')
            total_fallos += fallos

    print('\n--- [2/2] Capas Oficiales del Estado (Esquema Canónico id_ig) ---')
    for fn in CAPAS_OFICIALES_MUESTRA:
        p_src = os.path.join(SRC_DATA_DIR, fn)
        if not os.path.exists(p_src):
            continue
        with open(p_src, 'r', encoding='utf-8') as f:
            gj = json.load(f)
        feats = gj.get('features', [])
        total_entidades += len(feats)
        fallos = 0
        for feat in feats:
            p = feat.get('properties', {})
            for k in CANONICAL_17_OFICIAL:
                if k not in p:
                    fallos += 1
                    break
        if fallos == 0:
            print(f'OK [PASS] {fn:44} N={len(feats):5d} | 17/17 id_ig OK')
        else:
            print(f'FAIL    {fn:44} | {fallos} fallos')
            total_fallos += fallos

    print('==============================================================================')
    if total_fallos == 0:
        print(f'EXITO TOTAL: {total_entidades:,} entidades auditadas 100% conformes.')
    else:
        print(f'FALLOS: {total_fallos}')
        sys.exit(1)
    print('==============================================================================')

if __name__ == '__main__':
    auditar_capas()
