import os
import sys
import re
import json
import zipfile
import pandas as pd
import numpy as np
import geopandas as gpd

BASE_DIR = r"D:\17082025\2026\Practica profesional\Base de datos VGI"
PROJECT_DIR = r"D:\17082025\2026\Practica profesional\atlas_vgi_uah"
DATA_DIR = os.path.join(PROJECT_DIR, "data")
SRC_DATA_DIR = os.path.join(PROJECT_DIR, "src", "data")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SRC_DATA_DIR, exist_ok=True)

def clean_bidat_val(val):
    if pd.isna(val) or val is None:
        return np.nan
    v_str = str(val).strip()
    if v_str in ['S/N', 'nan', 'None', '', 'null', 'No Aplica', 'N/A']:
        return np.nan
    m_entre = re.search(r'(?:Valores\s+entre|entre|Entre)\s+(\d+(?:[\.,]\d+)?)\s+(?:y|a|-)\s+(\d+(?:[\.,]\d+)?)', v_str, re.IGNORECASE)
    if m_entre:
        low = float(m_entre.group(1).replace(',', '.'))
        high = float(m_entre.group(2).replace(',', '.'))
        return (low + high) / 2.0
    m_range = re.search(r'^(\d+(?:[\.,]\d+)?)\s*(?:a|-|y)\s*(\d+(?:[\.,]\d+)?)$', v_str, re.IGNORECASE)
    if m_range:
        low = float(m_range.group(1).replace(',', '.'))
        high = float(m_range.group(2).replace(',', '.'))
        return (low + high) / 2.0
    try:
        return float(v_str.replace(',', '.'))
    except ValueError:
        return np.nan

def process_unidades_vecinales_and_bidat():
    print("[1/3] Procesando Unidades Vecinales (Íntegra RM) y Joins BIDAT...")
    uv_zip = os.path.join(BASE_DIR, "unidades_vecinales_junio2026.zip")
    if not os.path.exists(uv_zip):
        print("[-] Archive unidades_vecinales_junio2026.zip not found!")
        return
        
    gdf_uv = gpd.read_file(f"zip://{uv_zip}!unidades_vecinales_junio2026/unidades_vecinales_junio2026_v1.shp").to_crs(epsg=4326)
    gdf_uv_rm = gdf_uv[gdf_uv['t_reg_ca'].astype(str) == '13'].copy()
    print(f"    - UV RM Total: {len(gdf_uv_rm)} polígonos conservados de forma íntegra.")
    
    bidat_files = {
        'igvust': '202608_igvust_uv_cuartil.csv',
        'dep_funcional': 'ind_427_430_202608.csv',
        'rsh_sexo': 'ind_89_90_202608.csv',
        'fonasa_mayores': 'ind_212_219_202606.csv',
        'fonasa_hombres': 'ind_213_220_202606.csv',
        'fonasa_jovenes': 'ind_214_221_202606.csv',
        'fonasa_mujeres': 'ind_215_222_202606.csv',
        'fonasa_nna': 'ind_216_223_202606.csv',
        'ocupados_rsh': 'ind_454_202606.csv'
    }
    
    joined_df = gdf_uv_rm[['t_com', 't_com_nom', 't_id_uv_ca', 't_uv_nom', 'geometry']].copy()
    joined_df['t_id_uv_ca'] = joined_df['t_id_uv_ca'].astype(str).str.strip()
    
    for prefix, fname in bidat_files.items():
        fpath = os.path.join(BASE_DIR, fname)
        if not os.path.exists(fpath): continue
        try:
            df = pd.read_csv(fpath, sep=';', encoding='latin-1', low_memory=False)
            uv_col = next((c for c in ['uv_rsh', 'unidad vecinal', 't_id_uv_ca', 'UV'] if c in df.columns), None)
            if not uv_col: continue
            df[uv_col] = df[uv_col].astype(str).str.strip()
            value_cols = [c for c in df.columns if c not in [uv_col, 'Region', 'Comuna', 'cod_com', 'cod_reg', 'rank_nac', 'Comuna ', 'Region ']]
            clean_sub = pd.DataFrame({uv_col: df[uv_col]})
            for c in value_cols:
                clean_sub[f"{prefix}_{c}"] = df[c].apply(clean_bidat_val)
            agg_sub = clean_sub.groupby(uv_col).mean(numeric_only=True).reset_index()
            joined_df = joined_df.merge(agg_sub, left_on='t_id_uv_ca', right_on=uv_col, how='left')
            if uv_col in joined_df.columns and uv_col != 't_id_uv_ca':
                joined_df.drop(columns=[uv_col], inplace=True)
        except Exception as e:
            print(f"    [-] Error uniendo {fname}: {e}")
            
    out_p1 = os.path.join(DATA_DIR, "capa_unidades_vecinales_bidat.geojson")
    out_p2 = os.path.join(SRC_DATA_DIR, "capa_unidades_vecinales_bidat.geojson")
    joined_df.to_file(out_p1, driver='GeoJSON')
    joined_df.to_file(out_p2, driver='GeoJSON')
    print(f"    [+] Guardada Capa UV + BIDAT ÍNTEGRA: {out_p1} ({len(joined_df)} entidades)")

def process_spatial_layers():
    print("[2/3] Extrayendo capas vectoriales públicas íntegras (sin recorte espacial)...")
    layers_config = [
        {"name": "Salud Oficial", "zip": "l_990_v1_establecimientos_de_salud_febrero_2026.zip", "out": "capa_salud_oficial.geojson"},
        {"name": "Educacion Escolar", "zip": "layer_establecimientos_educacion_escolar_20220309024120.zip", "out": "capa_educacion_escolar.geojson"},
        {"name": "Educacion Superior", "zip": "layer_establecimientos_de_educacion_superior_20220309024111.zip", "out": "capa_educacion_superior.geojson"},
        {"name": "Cuarteles Bomberos", "zip": "layer_cuarteles_20220309024623.zip", "out": "capa_cuarteles_bomberos.geojson"},
        {"name": "Jardines JUNJI", "zip": "layer_jardines_infantiles_junji_2024_20240619120021.zip", "out": "capa_jardines_junji.geojson"},
        {"name": "Infraestructura Deportiva", "zip": "layer_infraestructura_deportiva_20230921043832.zip", "out": "capa_infraestructura_deportiva.geojson"},
        {"name": "Ferias Libres", "zip": "layer_ferias_libres_20230921043202.zip", "out": "capa_ferias_libres.geojson"},
        {"name": "Ciclovias MOP", "zip": "CICLOVchile_shp.zip", "out": "capa_ciclovias_mop.geojson"},
        {"name": "Estaciones Meteorologicas", "zip": "EstacionesMeteorologicas.zip", "out": "capa_estaciones_meteorologicas.geojson"},
        {"name": "Antenas Ley Torres", "zip": "antenas_servicio_ley_torres.zip", "out": "capa_antenas_torres.geojson"},
        {"name": "SNASPE CONAF", "zip": "limite_snaspe_2016.zip", "out": "capa_snaspe.geojson"}
    ]
    for cfg in layers_config:
        zpath = os.path.join(BASE_DIR, cfg["zip"])
        if not os.path.exists(zpath): continue
        try:
            with zipfile.ZipFile(zpath, 'r') as z:
                shps = [f for f in z.namelist() if f.endswith('.shp')]
                if not shps: continue
                shp = shps[0]
            gdf = gpd.read_file(f"zip://{zpath}!{shp}").to_crs(epsg=4326)
            out_p1 = os.path.join(DATA_DIR, cfg["out"])
            out_p2 = os.path.join(SRC_DATA_DIR, cfg["out"])
            gdf.to_file(out_p1, driver='GeoJSON')
            gdf.to_file(out_p2, driver='GeoJSON')
            print(f"    [+] Guardada {cfg['name']}: {cfg['out']} ({len(gdf)} entidades conservadas)")
        except Exception as e:
            print(f"    [-] Error en {cfg['zip']}: {e}")

if __name__ == "__main__":
    process_unidades_vecinales_and_bidat()
    process_spatial_layers()
