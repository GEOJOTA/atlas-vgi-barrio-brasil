import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

archivos_a_borrar = [
    os.path.join(BASE_DIR, 'data', 'ide_minvu_parques.geojson'),
    os.path.join(BASE_DIR, 'src', 'data', 'ide_minvu_parques.geojson'),
    os.path.join(BASE_DIR, 'data', 'ide_minvu_barrios_historicos.geojson'),
    os.path.join(BASE_DIR, 'src', 'data', 'ide_minvu_barrios_historicos.geojson'),
    os.path.join(BASE_DIR, 'data', 'capa_bbdd_41.geojson'),
    os.path.join(BASE_DIR, 'src', 'data', 'capa_bbdd_41.geojson'),
    os.path.join(BASE_DIR, 'data', 'capa_bbdd_22.geojson'),
    os.path.join(BASE_DIR, 'src', 'data', 'capa_bbdd_22.geojson'),
]

for f in archivos_a_borrar:
    if os.path.exists(f):
        try:
            os.remove(f)
            print(f"[ELIMINADO] {f}")
        except Exception as e:
            print(f"[ERROR al eliminar {f}]: {e}")
    else:
        print(f"[NO EXISTÍA] {f}")
