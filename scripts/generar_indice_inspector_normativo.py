#!/usr/bin/env python3
"""
scripts/generar_indice_inspector_normativo.py
---------------------------------------------
Genera dos índices espaciales JSON livianos, recortados estrictamente a la
Región Metropolitana de Santiago, con bounding boxes precalculados (`bbox`) por
entidad y depuración de atributos nulos o redundantes para el Inspector
Normativo PRC/PRMS (`src/js/modulos/evaluador_normativo.js`).

Salidas (sincronizadas en `src/data/` y `data/`):
- `indice_inspector_prc_rm.json`: Zonificación PRC, PRMS, Límites Urbanos y Comunas.
- `indice_inspector_entorno_rm.json`: Manzanas Censo 2024, Unidades Vecinales,
  Áreas de Riesgo, Áreas Verdes IPT, Patrimonio, Campamentos, Permisos DOM y CRF.
"""

import gzip
import json
import math
import os
import shutil
import sys
import time
from shapely.geometry import shape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vgi_utils import DATA_DIR, SRC_DATA_DIR, _redondear_coords, cargar_poligonos_referencia

CAPAS_INDICE_PRC = [
    (
        'bbdd_43',
        'capa_bbdd_43.geojson',
        ['COMUNA', 'NOM_COMUNA', 'NOM_COM', 'CUT_COM', 'PROVINCIA', 'REGION'],
    ),
    (
        'minvu_ipt_prc_santiago',
        'ide_minvu_ipt_prc_santiago.geojson',
        [
            'COMUNA', 'COMUNA_ORIGEN', 'COM', 'NOM_COMUNA', 'NOM_COM',
            'ZONA', 'Zonas', 'NOM', 'NOM_ZONA', 'NOMBRE', 'DESCRIP', 'CODIGO',
            'INSTRUM', 'PRC', 'CAPA', 'Capa', 'DECRETO', 'DOC', 'N_DOC',
            'DO', 'P_DO', 'T_DO', 'FECHA_DO', 'FECHA', 'NORMA', 'ARTICULO',
            'UPERM', 'USO_PERM', 'UPREF', 'UPROH', 'USO_PROH',
            'AMAXED', 'OBS_AMAXED', 'ALT_MAX', 'ALTURA', 'COS', 'OBS_COS',
            'DEN', 'OBS_DEN', 'DENSIDAD', 'RAS', 'ANTJ', 'DIST', 'OBS',
            'SUELO', 'AGRU', 'SECTOR', 'ROL', 'DIRECCION', 'DIR',
            'CAL_JURID', 'REGIMEN', 'URL',
        ],
    ),
    (
        'minvu_ipt_limite_urbano',
        'ide_minvu_ipt_limite_urbano.geojson',
        ['COM', 'COMUNA', 'NOM', 'INSTRUMENT', 'T_DOC', 'N_DOC', 'DO', 'ADMIN', 'SUP_HA'],
    ),
]

CAPAS_INDICE_ENTORNO = [
    (
        'minvu_ipt_prms_usosuelo',
        'ide_minvu_ipt_prms_usosuelo.geojson',
        [
            'COMUNA', 'ZONA', 'NOMBRE', 'SECTOR', 'UPERM', 'UPREF',
            'USO', 'TIPO', 'UPROH', 'NORMA', 'PRMS', 'HA', 'SUP_HA', 'URL',
        ],
    ),
    (
        'censo2024_limite_urbano',
        'ide_censo2024_limite_urbano.geojson',
        ['COMUNA', 'LOCALIDAD', 'ENTIDAD', 'CATEGORIA', 'CUT'],
    ),
    (
        'bbdd_66',
        'capa_bbdd_66.geojson',
        ['uv_carto', 't_uv_nom', 't_id_uv_ca', 't_com_nom', 't_prov_nom', 'OBJECTID', 'nombre'],
    ),
    (
        'censo2024_manzanas',
        'ide_censo2024_manzanas.geojson',
        [
            'MANZENT', 'manzent', 'COD_MANZANA', 'COMUNA', 'NOM_COMUNA',
            'DISTRITO', 'LOCALIDAD', 'ENTIDAD', 'barrio_stgo_nombre',
            'nombre_barrio', 'n_per', 'n_hog', 'n_vp',
        ],
    ),
    (
        'minvu_ipt_areas_riesgo',
        'ide_minvu_ipt_areas_riesgo.geojson',
        ['CAT', 'NOM', 'NOMBRE', 'ZONA', 'NORMA', 'UPERM', 'UPROH', 'COM', 'LOC', 'LOCALIDAD', 'OBS', 'SUP_km2'],
    ),
    (
        'ide_minvu_ipt_prms_riesgo',
        'ide_minvu_ipt_prms_riesgo.geojson',
        ['COM', 'LOCALIDAD', 'NOMBRE', 'NORMA', 'Capa', 'superficie_ha'],
    ),
    (
        'minvu_ipt_areas_verdes',
        'ide_minvu_ipt_areas_verdes.geojson',
        [
            'NOMBRE_EP', 'NOMBRE', 'TIPO_EP', 'TIPO_AV', 'TIPO_TAMAN',
            'USO', 'ADM', 'COMUNA', 'SUP_TOTAL_', 'SUP_VEGETA',
            'superficie_ha', 'Ha', 'OBSERVACIO',
        ],
    ),
    (
        'minvu_patrimonio',
        'ide_minvu_patrimonio.geojson',
        [
            'NOMBRE', 'NOM', 'name', 'CATEGORIA', 'categoria', 'TIPO', 'subtipo',
            'COMUNA', 'COM', 'DIRECCION', 'SECTOR', 'CAL_JURID', 'REGIMEN',
            'DOC', 'N_DOC', 'DO', 'P_DO', 'AGNO_CONS', 'EST_CONS', 'ROL', 'OBS',
            'UPERM', 'UPROH',
        ],
    ),
    (
        'cmn_sitios_memoria',
        'ide_cmn_sitios_memoria.geojson',
        ['nombre', 'comuna', 'decreto', 'tipo_declaratoria', 'direccion', 'categoria', 'subtipo'],
    ),
    (
        'ide_minvu_campamentos',
        'ide_minvu_campamentos.geojson',
        ['NOMBRE', 'COMUNA', 'PROVINCIA', 'FOLIO', 'AN_CAT', 'N_HOG', 'HECTAREAS', 'OBS', 'FUENTE'],
    ),
    (
        'ine_permisos_edificacion_santiago',
        'ine_permisos_edificacion_santiago.geojson',
        [
            'manzent', 'zona_prc', 'nombre_zona_prc', 'nombre_barrio', 'AÑO',
            'CANTIDAD_UNIDAD', 'SUPERFICIE', 'NUM_PISOS', 'GLOSA_DESTINO',
            'USO_DESTINO', 'GLOSA_COMUNA',
        ],
    ),
    (
        'ine_crf_conjuntos_santiago',
        'ine_crf_conjuntos_santiago.geojson',
        [
            'manzent', 'zona_prc', 'nombre_zona_prc', 'nombre_barrio', 'AÑO_EMISION',
            'N_VIVIENDA', 'sup_terreno_m2', 'sup_edificada_planta_m2',
            'densidad_neta_real_viv_ha', 'coeficiente_ocupacion_suelo_cos',
            'porcentaje_patio_suelo_libre', 'frente_predial_oguc_m',
            'fondo_predial_oguc_m', 'relacion_fondo_frente', 'NOM_COMUNA',
        ],
    ),
]


def _extraer_bbox_coords(geom):
    """Calcula [minx, miny, maxx, maxy] exacto desde el árbol de coordenadas."""
    minx = miny = math.inf
    maxx = maxy = -math.inf

    def _rec(node):
        nonlocal minx, miny, maxx, maxy
        if not node:
            return
        if isinstance(node[0], (int, float)):
            x, y = node[0], node[1]
            if x < minx:
                minx = x
            if x > maxx:
                maxx = x
            if y < miny:
                miny = y
            if y > maxy:
                maxy = y
        else:
            for child in node:
                _rec(child)

    _rec(geom.get('coordinates'))
    if not math.isfinite(minx):
        return None
    return [round(minx, 6), round(miny, 6), round(maxx, 6), round(maxy, 6)]


def _compilar_capa(capa_id, filename, keep_keys, refs):
    src_path = os.path.join(SRC_DATA_DIR, filename)
    with open(src_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    rx0, ry0, rx1, ry1 = refs['rm_bounds']
    rm_prep = refs['rm_prep']
    out_features = []
    skipped = 0

    for ft in data.get('features', []):
        geom = ft.get('geometry')
        if not geom or not geom.get('coordinates'):
            skipped += 1
            continue
        raw_bbox = _extraer_bbox_coords(geom)
        if not raw_bbox:
            skipped += 1
            continue
        bx0, by0, bx1, by1 = raw_bbox
        if bx1 < rx0 or bx0 > rx1 or by1 < ry0 or by0 > ry1:
            skipped += 1
            continue
        try:
            shp = shape(geom)
            if shp.is_empty or not rm_prep.intersects(shp):
                skipped += 1
                continue
        except Exception:
            skipped += 1
            continue

        props_in = ft.get('properties') or {}
        props_out = {}
        for k in keep_keys:
            if k in props_in:
                val = props_in[k]
                if val is None:
                    continue
                if isinstance(val, str):
                    val_s = val.strip()
                    if not val_s:
                        continue
                    props_out[k] = val_s
                else:
                    props_out[k] = val

        geom_out = {
            'type': geom['type'],
            'coordinates': _redondear_coords(geom['coordinates'], 6),
        }
        bbox_out = _extraer_bbox_coords(geom_out)
        out_features.append({
            'type': 'Feature',
            'bbox': bbox_out,
            'geometry': geom_out,
            'properties': props_out,
        })

    return {
        'type': 'FeatureCollection',
        'features': out_features,
    }, len(data.get('features', [])), len(out_features), skipped


def generar_indice(nombre_salida, especificaciones, refs):
    t0 = time.time()
    capas_out = {}
    meta_capas = {}
    for capa_id, filename, keep_keys in especificaciones:
        fc, total_in, total_out, skipped = _compilar_capa(capa_id, filename, keep_keys, refs)
        capas_out[capa_id] = fc
        meta_capas[capa_id] = {
            'fuente': filename,
            'entidades_origen': total_in,
            'entidades_rm': total_out,
            'descartadas_fuera_rm': skipped,
        }
        print(f"  - {capa_id:34s}: {total_in:6d} -> {total_out:6d} RM (descartadas={skipped})")

    payload = {
        'version': '2026-11-11',
        'crs': 'EPSG:4326',
        'scope': 'Region Metropolitana de Santiago',
        'resumen': meta_capas,
        'layers': capas_out,
    }
    raw_bytes = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    gz_bytes = gzip.compress(raw_bytes, compresslevel=6)

    for folder in (SRC_DATA_DIR, DATA_DIR):
        os.makedirs(folder, exist_ok=True)
        out_path = os.path.join(folder, nombre_salida)
        with open(out_path, 'wb') as f:
            f.write(raw_bytes)

    mb_raw = len(raw_bytes) / (1024 * 1024)
    mb_gz = len(gz_bytes) / (1024 * 1024)
    print(f"[OK] {nombre_salida}: {mb_raw:.2f} MB raw | {mb_gz:.2f} MB gzip ({time.time() - t0:.1f}s)")


def main():
    print("Cargando polígono oficial Región Metropolitana...")
    refs = cargar_poligonos_referencia()
    print("\nCompilando índice 1 (PRC / PRMS / Límites / Comunas)...")
    generar_indice('indice_inspector_prc_rm.json', CAPAS_INDICE_PRC, refs)
    print("\nCompilando índice 2 (Manzanas / Riesgos / Áreas Verdes / Patrimonio / Edificación)...")
    generar_indice('indice_inspector_entorno_rm.json', CAPAS_INDICE_ENTORNO, refs)


if __name__ == '__main__':
    main()
