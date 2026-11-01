#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
publicar_censo2024_produccion.py
---------------------------------
Publica y despliega a producción en GitHub (rama main) y activa el build automático en Netlify.
Sube las 5 capas multiescalares del Censo 2024 RM (GeoJSON 100% íntegros con Git LFS), módulos JS, SQL,
catálogos Excel y documentación técnica.
"""

import os
import sys
import json
import base64
import time
import hashlib
import requests

sys.stdout.reconfigure(encoding='utf-8')

OWNER = "GEOJOTA"
REPO = "atlas_vgi_uah"
BRANCH = "main"
TOKEN = os.environ.get("GITHUB_TOKEN", "")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Archivos gestionados por Git LFS (*.geojson y *.xlsx según .gitattributes)
ARCHIVOS_LFS = [
    # GeoJSON Multiescalar Censo 2024 en src/data/ (Web)
    "src/data/ide_censo2024_regional.geojson",
    "src/data/ide_censo2024_limite_urbano.geojson",
    "src/data/ide_censo2024_localidades.geojson",
    "src/data/ide_censo2024_zonal.geojson",
    "src/data/ide_censo2024_manzanas.geojson",
    # GeoJSON Multiescalar Censo 2024 en data/ (Local / Backup)
    "data/ide_censo2024_regional.geojson",
    "data/ide_censo2024_limite_urbano.geojson",
    "data/ide_censo2024_localidades.geojson",
    "data/ide_censo2024_zonal.geojson",
    "data/ide_censo2024_manzanas.geojson",
    # Catálogos Excel generados
    "src/docs/catalogo_fuentes_vgi.xlsx",
    "src/docs/perfil_metadatos_vgi.xlsx",
    "src/docs/categorias_tematicas_osm.xlsx",
    "docs/catalogo_fuentes_vgi.xlsx",
    "docs/perfil_metadatos_vgi.xlsx",
    "docs/categorias_tematicas_osm.xlsx"
]

# Archivos de código, SQL y documentación técnica estándar
ARCHIVOS_TEXTO = [
    # Módulos Frontend
    "src/js/modulos/ide_chile.js",
    "src/js/modulos/mapa.js",
    # Scripts de procesamiento, inspección y DB
    "scripts/procesar_censo2024_rm.py",
    "scripts/inspeccionar_censo2024.py",
    "scripts/db/01_schema_postgis.sql",
    "scripts/db/02_seed_metadata.sql",
    "scripts/generar_catalogos_excel.py",
    "scripts/publicar_censo2024_produccion.py",
    # Documentación Técnica y Académica
    "README.md",
    "src/docs/ARQUITECTURA.md",
    "src/docs/TRAZABILIDAD_ACADEMICA.md",
    "INFORME_PROYECTO_ATLAS_VGI.md",
    "PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md"
]

def obtener_headers_github():
    return {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AtlasVGI-Deployer/2.0"
    }

def obtener_headers_lfs():
    return {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.git-lfs+json",
        "Content-Type": "application/vnd.git-lfs+json"
    }

def calcular_sha256_y_tamano(filepath):
    h = hashlib.sha256()
    size = os.path.getsize(filepath)
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest(), size

def asegurar_objetos_lfs(archivos_lfs):
    """
    Verifica y sube los binarios de Git LFS al storage de GitHub (AWS S3) usando LFS Batch API.
    Devuelve un diccionario {rel_path: puntero_str}.
    """
    print("\n" + "=" * 80)
    print("FASE 1: VERIFICACIÓN Y SUBIDA DE OBJETOS GIT LFS")
    print("=" * 80)

    lfs_url = f"https://github.com/{OWNER}/{REPO}.git/info/lfs/objects/batch"
    
    # 1. Agrupar por hash único para evitar subidas duplicadas (data/ vs src/data/)
    objetos_unicos = {} # sha -> {size, paths}
    punteros = {} # rel_path -> pointer_string

    for rel_path in archivos_lfs:
        local_path = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(local_path):
            print(f"  [!] Archivo LFS no encontrado en disco: {rel_path}, saltando.")
            continue
            
        sha, size = calcular_sha256_y_tamano(local_path)
        pointer_str = f"version https://git-lfs.github.com/spec/v1\noid sha256:{sha}\nsize {size}\n"
        punteros[rel_path] = pointer_str
        
        if sha not in objetos_unicos:
            objetos_unicos[sha] = {
                "size": size,
                "local_path": local_path,
                "paths": [rel_path]
            }
        else:
            objetos_unicos[sha]["paths"].append(rel_path)

    print(f"[*] {len(punteros)} referencias LFS mapeadas a {len(objetos_unicos)} objetos binarios únicos.")

    # 2. Consultar Batch API
    batch_payload = {
        "operation": "upload",
        "transfers": ["basic"],
        "objects": [{"oid": sha, "size": meta["size"]} for sha, meta in objetos_unicos.items()]
    }

    r_batch = requests.post(lfs_url, json=batch_payload, headers=obtener_headers_lfs(), timeout=30)
    if r_batch.status_code != 200:
        print(f"[-] Error en LFS Batch API: HTTP {r_batch.status_code} - {r_batch.text}")
        sys.exit(1)

    batch_resp = r_batch.json()
    
    # 3. Subir los que requieran upload
    for obj in batch_resp.get("objects", []):
        sha = obj["oid"]
        meta = objetos_unicos[sha]
        size_mb = meta["size"] / (1024 * 1024)
        sample_path = meta["paths"][0]
        
        if "actions" in obj and "upload" in obj["actions"]:
            upload_action = obj["actions"]["upload"]
            put_url = upload_action["href"]
            put_headers = upload_action.get("header", {})
            
            print(f"  --> Subiendo a LFS S3 ({size_mb:.2f} MB): {sample_path}...", end=" ", flush=True)
            t0 = time.time()
            with open(meta["local_path"], "rb") as f:
                r_put = requests.put(put_url, data=f, headers=put_headers, timeout=1200)
            t_el = time.time() - t0
            
            if r_put.status_code not in (200, 201):
                print(f"ERROR: HTTP {r_put.status_code} - {r_put.text[:120]}")
                sys.exit(1)
            print(f"OK ({t_el:.1f}s)", end=" ", flush=True)
            
            if "verify" in obj["actions"]:
                verify_action = obj["actions"]["verify"]
                r_ver = requests.post(
                    verify_action["href"],
                    json={"oid": sha, "size": meta["size"]},
                    headers=verify_action.get("header", {}),
                    timeout=30
                )
                if r_ver.status_code in (200, 204):
                    print("[Verificado]")
                else:
                    print(f"[Error Verify: HTTP {r_ver.status_code}]")
            else:
                print()
        else:
            print(f"  ✓ Ya presente en Git LFS ({size_mb:.2f} MB): {sample_path}")

    return punteros

def main():
    print("=" * 80)
    print("DESPLIEGUE A PRODUCCIÓN: CENSO 2024 MULTIESCALAR — GITHUB & NETLIFY")
    print("=" * 80)
    
    headers_gh = obtener_headers_github()
    api_base = f"https://api.github.com/repos/{OWNER}/{REPO}"
    
    # 1. Asegurar binarios en Git LFS
    punteros_lfs = asegurar_objetos_lfs(ARCHIVOS_LFS)
    
    # 2. Obtener referencia actual de origin/main
    print("\n" + "=" * 80)
    print("FASE 2: CONSTRUCCIÓN DEL COMMIT EN GITHUB")
    print("=" * 80)
    print("[*] 1. Obteniendo último commit de origin/main...")
    r_ref = requests.get(f"{api_base}/git/refs/heads/{BRANCH}", headers=headers_gh, timeout=20)
    if r_ref.status_code != 200:
        print(f"[-] Error al leer rama main: HTTP {r_ref.status_code} - {r_ref.text}")
        sys.exit(1)
    
    latest_commit_sha = r_ref.json()["object"]["sha"]
    print(f"    --> Commit base SHA: {latest_commit_sha}")
    
    # 3. Obtener base tree
    print("[*] 2. Obteniendo árbol (base tree)...")
    r_commit = requests.get(f"{api_base}/git/commits/{latest_commit_sha}", headers=headers_gh, timeout=20)
    base_tree_sha = r_commit.json()["tree"]["sha"]
    print(f"    --> Base tree SHA: {base_tree_sha}")
    
    # 4. Preparar entradas del Tree (LFS pointers + Archivos estándar)
    print(f"[*] 3. Preparando entradas del árbol...")
    tree_items = []
    
    # A. Archivos LFS: cada uno se almacena como su puntero de texto UTF-8 estándar
    for rel_path, pointer_str in punteros_lfs.items():
        tree_items.append({
            "path": rel_path.replace("\\", "/"),
            "mode": "100644",
            "type": "blob",
            "content": pointer_str
        })
        print(f"    [LFS] {rel_path} (puntero SHA {pointer_str.split('oid sha256:')[1][:8]})")
        
    # B. Archivos estándar de código y documentación
    for rel_path in ARCHIVOS_TEXTO:
        local_path = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(local_path):
            print(f"    [!] Archivo de texto no encontrado: {rel_path}, saltando.")
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
        
    # 5. Crear nuevo Tree en GitHub
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
    
    # 6. Crear el Commit en GitHub
    mensaje_commit = (
        "feat(censo2024): integracion multiescalar del Censo 2024 RM en 5 capas territoriales independientes\n\n"
        "- Escala 1 (Regional): Marco Macroterritorial RM (1 polígono, 0.82 MB)\n"
        "- Escala 2 (Límites Urbanos): 106 áreas urbanas censales con demografía (6.48 MB)\n"
        "- Escala 3 (Localidades): 511 localidades y asentamientos urbanos y rurales (17.16 MB)\n"
        "- Escala 4 (Zonal): 1.865 zonas y distritos censales con 213 variables (26.51 MB)\n"
        "- Escala 5 (Manzanas): 66.873 manzanas censales de la Región Metropolitana con 217 variables (496.87 MB)\n"
        "- 100% de geometrías íntegras sin simplificación de vértices ni recortes espaciales\n"
        "- Almacenamiento en Git LFS para capas vectoriales y catálogos OpenXML (.xlsx)\n"
        "- Actualización de modulos/ide_chile.js, modulos/mapa.js, seed PostGIS y catálogos Excel\n"
        "- Cumplimiento estricto del PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md"
    )
    print(f"[*] 5. Creando Commit en GitHub...")
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
    
    # 7. Actualizar rama main
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
    print("Netlify iniciará automáticamente la compilación y despliegue continuo.")
    print("=" * 80)

if __name__ == "__main__":
    main()
