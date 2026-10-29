import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

archivos_a_eliminar = [
    # 1) Red oficial de ciclovias (Minvu/dtpm)
    "ide_minvu_ciclovias.geojson",
    # 2) Limite urbano censal (INE)
    "ide_limite_urbano_censal.geojson",
    # 3) Condominios sociales (MINVU)
    "ide_minvu_condominios_sociales.geojson",
    # 4) Inventario de humedales (MMA / MINVU)
    "ide_minvu_inventario_humedales.geojson",
    # 5) Infraestructura deportiva (IND / MINDEP)
    "capa_infraestructura_deportiva.geojson",
    # 6) Nivel de erosión
    "capa_bbdd_45.geojson",
    # 7) Jardines infantiles JUNJI y Integra
    "capa_jardines_junji.geojson",
    # 8) Educación Superior (MINEDUC)
    "capa_educacion_superior.geojson",
    "ide_educacion_superior.geojson",
    # 10) Colegios y liceos (Mineduc)
    "capa_educacion_escolar.geojson",
    "ide_educacion_escolar.geojson",
    # 11) Establecimientos de salud febrero 2026
    "capa_salud_oficial.geojson",
    "capa_bbdd_28.geojson",
    # 12) Curva de 10m
    "capa_bbdd_36.geojson",
    # 13) Cuarteles de Bomberos (Junta Nacional / CBS)
    "capa_cuarteles_bomberos.geojson",
    # 14) Cuarteles de Bomberos
    "capa_bbdd_09.geojson",
    # 15) Ferias libres
    "capa_ferias_libres.geojson",
    "capa_bbdd_16.geojson",
]

directorios = [
    os.path.join(BASE_DIR, "data"),
    os.path.join(BASE_DIR, "src", "data"),
]

eliminados = []
no_encontrados = []

for dir_path in directorios:
    for nombre in archivos_a_eliminar:
        archivo = os.path.join(dir_path, nombre)
        if os.path.exists(archivo):
            os.remove(archivo)
            rel = os.path.relpath(archivo, BASE_DIR)
            eliminados.append(rel)
            print(f"[x] Eliminado: {rel}")
        else:
            rel = os.path.relpath(archivo, BASE_DIR)
            no_encontrados.append(rel)

print(f"\nTotal eliminados: {len(eliminados)}")
print(f"Total no encontrados (ya no existían): {len(no_encontrados)}")
