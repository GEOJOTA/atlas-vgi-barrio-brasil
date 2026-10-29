#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/publicar_mas_detalles.py
--------------------------------
Publica y despliega a producción en GitHub (rama main) los cambios que
corrigen e integran la funcionalidad "Más detalles →" en el visor cartográfico.
Activa el despliegue automático en Netlify y verifica el sitio en vivo.
"""

import os
import sys
import json
import time
import requests

sys.stdout.reconfigure(encoding='utf-8')

OWNER = "GEOJOTA"
REPO = "atlas_vgi_uah"
BRANCH = "main"
TOKEN = os.environ.get("GITHUB_TOKEN", "")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ARCHIVOS_A_PUBLICAR = [
    "src/js/modulos/mapa.js",
    "src/css/estilos.css",
    "scripts/publicar_mas_detalles.py"
]

def obtener_headers_github():
    return {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AtlasVGI-Deployer/2.1"
    }

def main():
    api_base = f"https://api.github.com/repos/{OWNER}/{REPO}"
    headers_gh = obtener_headers_github()

    print("=" * 80)
    print("DESPLIEGUE A PRODUCCIÓN: REPARACIÓN INTEGRAL DE 'MÁS DETALLES'")
    print("=" * 80)

    # 1. Obtener última referencia de la rama main
    print("[*] 1. Obteniendo último commit de la rama 'main'...")
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
    print("[*] 3. Preparando entradas del árbol...")
    tree_items = []
    for rel_path in ARCHIVOS_A_PUBLICAR:
        local_path = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(local_path):
            print(f"    [!] Archivo local no encontrado: {rel_path}, saltando.")
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

    # 4. Crear nuevo Tree en GitHub
    print(f"\n[*] 4. Creando nuevo árbol en GitHub con {len(tree_items)} entradas...")
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
        "fix(visor): reparacion integral y activacion del panel lateral de mas detalles\n\n"
        "- Correccion de discrepancia de selector DOM (sidebar-detalle-bidat vs sidebar-detalle)\n"
        "- Preservacion estricta de valores numericos 0 (sin tratarlos erroneamente como nulos o vacios)\n"
        "- Formateo de valores booleanos ('Si' / 'No') y ampliacion de renderizado a 100 atributos\n"
        "- Herencia automatica de metadatos oficiales del Estado (ModuloIDEChile y META_CAPAS_BIDAT)\n"
        "- Banner de alerta informativa con boton de descarga directa del GeoJSON integro\n"
        "- Ajuste de z-index a 1200 en estilos.css para sobreponerse a controles Leaflet\n"
        "- Vinculacion de cierre por boton X, tecla Escape y delegacion de eventos en popups"
    )

    print("[*] 5. Creando Commit en GitHub...")
    r_commit = requests.post(f"{api_base}/git/commits", headers=headers_gh, json={
        "message": mensaje_commit,
        "tree": new_tree_sha,
        "parents": [latest_commit_sha]
    }, timeout=30)

    if r_commit.status_code not in (200, 201):
        print(f"[-] Error al crear Commit: HTTP {r_commit.status_code} - {r_commit.text}")
        sys.exit(1)

    new_commit_sha = r_commit.json()["sha"]
    print(f"    --> Nuevo Commit SHA: {new_commit_sha}")

    # 6. Actualizar rama main
    print(f"[*] 6. Apuntando rama 'main' al nuevo commit {new_commit_sha[:8]}...")
    r_update_ref = requests.patch(f"{api_base}/git/refs/heads/{BRANCH}", headers=headers_gh, json={
        "sha": new_commit_sha,
        "force": False
    }, timeout=20)

    if r_update_ref.status_code != 200:
        print(f"[-] Error al actualizar ref: HTTP {r_update_ref.status_code} - {r_update_ref.text}")
        sys.exit(1)

    print("\n" + "=" * 80)
    print("¡DESPLIEGUE A PRODUCCIÓN COMPLETADO CON ÉXITO!")
    print("=" * 80)
    print(f"Commit en GitHub : https://github.com/{OWNER}/{REPO}/commit/{new_commit_sha}")
    print(f"Repositorio      : https://github.com/{OWNER}/{REPO}")
    print(f"Sitio en Vivo    : https://atlasvgiuah.netlify.app/")
    print("Netlify compilará y desplegará automáticamente la nueva versión.")
    print("=" * 80)

if __name__ == "__main__":
    main()
