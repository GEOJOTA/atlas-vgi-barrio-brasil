import os
import geopandas as gpd

ROOT_DIR = r"C:\Users\PT1261256\Desktop\16_09_2026\atlas_vgi_uah"
GPKG_PATH = r"C:\Users\PT1261256\Desktop\16_09_2026\Base de datos VGI\Manual\Semaforos RM MMT\SEMAFOROS_RM_2026_JULIO_32719.gpkg"
DATA_OUT = os.path.join(ROOT_DIR, "data", "semaforos_rm_uoct_2026.geojson")
SRC_DATA_OUT = os.path.join(ROOT_DIR, "src", "data", "semaforos_rm_uoct_2026.geojson")

gdf = gpd.read_file(GPKG_PATH)
valid_gdf = gdf[~gdf.geometry.is_empty & gdf.geometry.notnull()].copy()
valid_gdf = valid_gdf.to_crs(epsg=4326)

columnas_map = {
    valid_gdf.columns[0]: 'codigo_junction',
    'ACCESO 1': 'acceso_1',
    'ACCESO 2': 'acceso_2',
    'COMUNA': 'comuna',
    'ESTADO': 'estado',
    'MARCA CONTROL': 'marca_control',
    'MODELO': 'modelo',
    'LATITUD': 'latitud',
    'LONGITUD': 'longitud',
    valid_gdf.columns[9]: 'tipo_comunicacion',
    'GPS': 'gps',
    'UPS': 'ups',
    'TIPO CABEZAL': 'tipo_cabezal',
    'VIGENCIA: JULIO 2026': 'vigencia'
}
valid_gdf = valid_gdf.rename(columns=columnas_map)

def normalizar_comuna(c):
    if not c or str(c).strip() == 'S/I':
        return 'SIN INFORMACIÓN'
    c_str = str(c).strip().upper()
    if 'PE' in c_str and 'LOL' in c_str: return 'PEÑALOLÉN'
    if 'PE' in c_str and 'FLOR' in c_str: return 'PEÑAFLOR'
    if 'CONCHAL' in c_str: return 'CONCHALÍ'
    if 'MAIP' in c_str: return 'MAIPÚ'
    if c_str.endswith('OA') and 'U' in c_str: return 'ÑUÑOA'
    if 'JOAQUIN' in c_str or 'JOAQU' in c_str: return 'SAN JOAQUÍN'
    if 'RAMON' in c_str or 'RAM' in c_str: return 'SAN RAMÓN'
    if 'ESTACION' in c_str: return 'ESTACIÓN CENTRAL'
    return c_str

def limpiar_string(s):
    if s is None:
        return ''
    txt = str(s).strip()
    # clean any non-ascii artifacts
    txt = txt.encode('ascii', 'ignore').decode('ascii')
    return txt

valid_gdf['comuna'] = valid_gdf['comuna'].apply(normalizar_comuna)

# Clean junction code and strings
valid_gdf['codigo_junction'] = valid_gdf['codigo_junction'].astype(str).str.strip()
valid_gdf['estado'] = valid_gdf['estado'].fillna('CONECTADO').astype(str).str.strip()
valid_gdf['vigencia'] = 'Julio 2026'

valid_gdf.to_file(DATA_OUT, driver="GeoJSON")
valid_gdf.to_file(SRC_DATA_OUT, driver="GeoJSON")

print("Validación de Comunas normalizadas:")
for k, v in valid_gdf['comuna'].value_counts().items():
    print(f"  {k:22}: {v}")
print(f"\nTotal registros generados: {len(valid_gdf)} (Tamaño: {os.path.getsize(DATA_OUT)} bytes)")
