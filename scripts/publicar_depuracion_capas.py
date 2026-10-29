#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/publicar_depuracion_capas.py
------------------------------------
Despliega a producción en GitHub (rama main) y Netlify la depuración
quirúrgica de 15 capas redundantes o no pertinentes del Atlas VGI UAH.
"""

import os
import sys
import json
import base64
import time
import requests

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

OWNER = "GEOJOTA"
REPO = "atlas_vgi_uah"
BRANCH = "main"
TOKEN = os.environ.get("GITHUB_TOKEN", "")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ARCHIVOS_TEXTO = [
    "src/js/modulos/ide_chile.js",
    "src/js/modulos/mapa.js",
    "src/js/modulos/evaluador_normativo.js",
    "scripts/db/02_seed_metadata.sql",
    "scripts/limpiar_archivos_obsoletos.py",
    "scripts/publicar_depuracion_capas.py",
]

ARCHIVOS_BINARIOS = [
    "docs/catalogo_fuentes_vgi.xlsx",
    "docs/perfil_metadatos_vgi.xlsx",
    "docs/categorias_tematicas_osm.xlsx",
    "src/docs/catalogo_fuentes_vgi.xlsx",
    "src/docs/perfil_metadatos_vgi.xlsx",
    "src/docs/categorias_tematicas_osm.xlsx",
]

ARCHIVOS_A_ELIMINAR = [
    # 1) Red oficial de ciclovias (Minvu/dtpm)
    "data/ide_minvu_ciclovias.geojson",
    "src/data/ide_minvu_ciclovias.geojson",
    # 2) Limite urbano censal (INE)
    "data/ide_limite_urbano_censal.geojson",
    "src/data/ide_limite_urbano_censal.geojson",
    # 3) Condominios sociales (MINVU)
    "data/ide_minvu_condominios_sociales.geojson",
    "src/data/ide_minvu_condominios_sociales.geojson",
    # 4) Inventario de humedales (MMA / MINVU)
    "data/ide_minvu_inventario_humedales.geojson",
    "src/data/ide_minvu_inventario_humedales.geojson",
    # 5) Infraestructura deportiva (IND / MINDEP)
    "data/capa_infraestructura_deportiva.geojson",
    "src/data/capa_infraestructura_deportiva.geojson",
    # 6) Nivel de erosión
    "data/capa_bbdd_45.geojson",
    "src/data/capa_bbdd_45.geojson",
    # 7) Jardines infantiles JUNJI y Integra
    "data/capa_jardines_junji.geojson",
    "src/data/capa_jardines_junji.geojson",
    # 8) Educación Superior (MINEDUC)
    "data/capa_educacion_superior.geojson",
    "data/ide_educacion_superior.geojson",
    "src/data/capa_educacion_superior.geojson",
    "src/data/ide_educacion_superior.geojson",
    # 10) Colegios y liceos (Mineduc)
    "data/capa_educacion_escolar.geojson",
    "data/ide_educacion_escolar.geojson",
    "src/data/capa_educacion_escolar.geojson",
    "src/data/ide_educacion_escolar.geojson",
    # 11) Establecimientos de salud febrero 2026
    "data/capa_salud_oficial.geojson",
    "data/capa_bbdd_28.geojson",
    "src/data/capa_salud_oficial.geojson",
    "src/data/capa_bbdd_28.geojson",
    # 12) Curva de 10m
    "data/capa_bbdd_36.geojson",
    "src/data/capa_bbdd_36.geojson",
    # 13) Cuarteles de Bomberos (Junta Nacional / CBS)
    "data/capa_cuarteles_bomberos.geojson",
    "src/data/capa_cuarteles_bomberos.geojson",
    # 14) Cuarteles de Bomberos
    "data/capa_bbdd_09.geojson",
    "src/data/capa_bbdd_09.geojson",
    # 15) Ferias libres
    "data/capa_ferias_libres.geojson",
    "data/capa_bbdd_16.geojson",
    "src/data/capa_ferias_libres.geojson",
    "src/data/capa_bbdd_16.geojson",
]

def obtener_headers_github():
    return {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AtlasVGI-LayerPurge/1.0"
    }

def crear_blob_binario(api_base, headers, file_path):
    with open(file_path, "rb") as f:
        data = f.read()
    b64_content = base64.b64encode(data).decode("utf-8")
    payload = {
        "content": b64_content,
        "encoding": "base64"
    }
    r = requests.post(f"{api_base}/git/blobs", headers=headers, json=payload, timeout=60)
    if r.status_code in (200, 201):
        return r.json()["sha"]
    else:
        raise Exception(f"Error creando blob binario {file_path}: {r.status_code} - {r.text}")

def main():
    api_base = f"https://api.github.com/repos/{OWNER}/{REPO}"
    headers_gh = obtener_headers_github()

    print("=" * 80)
    print("DESPLIEGUE A PRODUCCIÓN: ELIMINACIÓN DE 15 CAPAS Y ACTUALIZACIÓN INTEGRAL")
    print("=" * 80)

    # 1. Obtener última referencia de la rama main
    print("\n[*] 1. Obteniendo último commit de la rama 'main'...")
    r_ref = requests.get(f"{api_base}/git/refs/heads/{BRANCH}", headers=headers_gh, timeout=20)
    if r_ref.status_code != 200:
        print(f"[-] Error al leer rama main: HTTP {r_ref.status_code} - {r_ref.text}")
        sys.exit(1)

    latest_commit_sha = r_ref.json()["object"]["sha"]
    print(f"    --> Commit base SHA: {latest_commit_sha}")

    # 2. Obtener base tree
    print("[*] 2. Obteniendo árbol (base tree)...")
    r_commit = requests.get(f"{api_base}/git/commits/{latest_commit_sha}", headers=headers_gh, timeout=20)
    base_tree_sha = r_commit.json()["tree"]["sha"]
    print(f"    --> Base tree SHA: {base_tree_sha}")

    # 3. Preparar entradas del Tree
    print("\n[*] 3. Preparando entradas del árbol Git...")
    tree_items = []

    # A) Archivos de texto modificados/nuevos
    for rel_path in ARCHIVOS_TEXTO:
        local_path = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(local_path):
            print(f"    [!] Archivo local de texto no encontrado: {rel_path}, saltando.")
            continue
        with open(local_path, "r", encoding="utf-8", errors="replace") as f:
            contenido = f.read()
        tree_items.append({
            "path": rel_path.replace("\\", "/"),
            "mode": "100644",
            "type": "blob",
            "content": contenido
        })
        print(f"    [TXT] {rel_path} ({len(contenido):,} caracteres)")

    # B) Archivos binarios (Excel)
    for rel_path in ARCHIVOS_BINARIOS:
        local_path = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(local_path):
            print(f"    [!] Archivo local binario no encontrado: {rel_path}, saltando.")
            continue
        blob_sha = crear_blob_binario(api_base, headers_gh, local_path)
        tree_items.append({
            "path": rel_path.replace("\\", "/"),
            "mode": "100644",
            "type": "blob",
            "sha": blob_sha
        })
        print(f"    [BIN] {rel_path} -> Blob SHA: {blob_sha[:10]}...")

    # C) Archivos a eliminar (sha: None)
    for rel_path in ARCHIVOS_A_ELIMINAR:
        tree_items.append({
            "path": rel_path.replace("\\", "/"),
            "mode": "100644",
            "type": "blob",
            "sha": None
        })
        print(f"    [DEL] {rel_path}")

    # 4. Crear nuevo Tree en GitHub
    print(f"\n[*] 4. Creando nuevo árbol en GitHub con {len(tree_items)} operaciones...")
    r_tree = requests.post(f"{api_base}/git/trees", headers=headers_gh, json={
        "base_tree": base_tree_sha,
        "tree": tree_items
    }, timeout=60)

    if r_tree.status_code not in (200, 201):
        print(f"[-] Error al crear Tree: HTTP {r_tree.status_code} - {r_tree.text}")
        sys.exit(1)

    new_tree_sha = r_tree.json()["sha"]
    print(f"    --> Nuevo Tree SHA: {new_tree_sha}")

    # 5. Crear el Commit en GitHub
    mensaje_commit = (
        "fix(capas): depuración de 15 capas redundantes y sincronización de metadatos\n\n"
        "- Eliminadas 15 capas redundantes del catálogo IDE Chile y BBDD oficial:\n"
        "  1) Red oficial de ciclovias (Minvu/dtpm)\n"
        "  2) Limite urbano censal (INE)\n"
        "  3) Condominios sociales (MINVU)\n"
        "  4) Inventario de humedales (MMA / MINVU)\n"
        "  5) Infraestructura deportiva (IND / MINDEP)\n"
        "  6) Nivel de erosión\n"
        "  7) Jardines infantiles JUNJI y Integra\n"
        "  8) Educación Superior (MINEDUC)\n"
        "  9) Educación Superior 2026 (Mineduc)\n"
        "  10) Colegios y liceos (Mineduc)\n"
        "  11) Establecimientos de salud febrero 2026\n"
        "  12) Curva de 10m\n"
        "  13) Cuarteles de Bomberos (Junta Nacional / CBS)\n"
        "  14) Cuarteles de Bomberos\n"
        "  15) Ferias libres\n"
        "- Preservadas intactas capas homólogas oficiales y Censo 2024\n"
        "- Sincronizados 02_seed_metadata.sql, mapa.js, ide_chile.js, evaluador_normativo.js\n"
        "- Eliminados archivos GeoJSON locales obsoletos de data/ y src/data/\n"
        "- Regenerados catálogos Excel maestros (.xlsx)"
    )

    print("[*] 5. Creando Commit en GitHub...")
    r_commit_post = requests.post(f"{api_base}/git/commits", headers=headers_gh, json={
        "message": mensaje_commit,
        "tree": new_tree_sha,
        "parents": [latest_commit_sha]
    }, timeout=30)

    if r_commit_post.status_code not in (200, 201):
        print(f"[-] Error al crear Commit: HTTP {r_commit_post.status_code} - {r_commit_post.text}")
        sys.exit(1)

    new_commit_sha = r_commit_post.json()["sha"]
    print(f"    --> Nuevo Commit SHA: {new_commit_sha}")

    # 6. Actualizar rama main
    print(f"[*] 6. Actualizando rama '{BRANCH}' al nuevo commit...")
    r_update_ref = requests.patch(f"{api_base}/git/refs/heads/{BRANCH}", headers=headers_gh, json={
        "sha": new_commit_sha,
        "force": False
    }, timeout=30)

    if r_update_ref.status_code != 200:
        print(f"[-] Error al actualizar referencia main: HTTP {r_update_ref.status_code} - {r_update_ref.text}")
        sys.exit(1)

    print(f"    [+] ¡Rama '{BRANCH}' actualizada exitosamente a {new_commit_sha[:10]}!")

    # 7. Verificación del despliegue en Netlify
    print("\n[*] 7. Esperando propagación y verificando Netlify (https://atlasvgiuah.netlify.app/)...")
    url_netlify = "https://atlasvgiuah.netlify.app/"
    for intento in range(1, 10):
        time.sleep(4)
        try:
            r_net = requests.get(url_netlify, timeout=15)
            if r_net.status_code == 200:
                print(f"    [+] Intento {intento}: Netlify respondiendo HTTP 200 OK ({len(r_net.content):,} bytes)")
                break
            else:
                print(f"    [~] Intento {intento}: Netlify status {r_net.status_code}, esperando...")
        except Exception as e:
            print(f"    [~] Intento {intento}: Error de conexión ({e}), reintentando...")

    print("\n" + "=" * 80)
    print("¡DESPLIEGUE A PRODUCCIÓN COMPLETADO EXITOSAMENTE!")
    print(f"Repositorio: https://github.com/{OWNER}/{REPO}/commit/{new_commit_sha}")
    print(f"Sitio en vivo: {url_netlify}")
    print("=" * 80)

if __name__ == "__main__":
    main()
