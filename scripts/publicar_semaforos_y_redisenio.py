#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/publicar_semaforos_y_redisenio.py
-----------------------------------------
Publica y despliega a producción en GitHub (rama main) y activa el build automático en Netlify.
Sube la nueva capa oficial de Semáforos RM UOCT/MTT (GeoJSON 100% íntegro vía Git LFS),
los catálogos Excel actualizados (.xlsx), módulos JS rediseñados, estilos CSS,
HTML de la Consola GIS, scripts SQL y documentación técnica.
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
    # Capa oficial Semáforos RM UOCT 2026
    "src/data/semaforos_rm_uoct_2026.geojson",
    "data/semaforos_rm_uoct_2026.geojson",
    # Catálogos Excel regenerados con 112 capas oficiales
    "src/docs/catalogo_fuentes_vgi.xlsx",
    "src/docs/perfil_metadatos_vgi.xlsx",
    "src/docs/categorias_tematicas_osm.xlsx",
    "docs/catalogo_fuentes_vgi.xlsx",
    "docs/perfil_metadatos_vgi.xlsx",
    "docs/categorias_tematicas_osm.xlsx"
]

# Archivos de código, SQL, estilos y documentación técnica estándar
ARCHIVOS_TEXTO = [
    # Frontend SPA y estilos rediseñados (Consola GIS Workbench)
    "src/index.html",
    "src/css/estilos.css",
    "src/js/app.js",
    "src/js/modulos/ide_chile.js",
    "src/js/modulos/mapa.js",
    # Scripts de procesamiento, verificación y DB
    "scripts/procesar_capa_semaforos.py",
    "scripts/verificar_integridad_despliegue.py",
    "scripts/generar_seed_sql.py",
    "scripts/generar_catalogos_excel.py",
    "scripts/db/02_seed_metadata.sql",
    "scripts/publicar_semaforos_y_redisenio.py",
    # Protocolo y Reglas
    "PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md",
    "AGENTS.md",
    # Documentación Técnica y Académica
    "README.md",
    "MANUAL_USO.md",
    "INFORME_PROYECTO_ATLAS_VGI.md",
    "docs/ARQUITECTURA.md",
    "src/docs/ARQUITECTURA.md",
    "docs/GUIA_BASE_DATOS_SUPABASE.md",
    "src/docs/GUIA_BASE_DATOS_SUPABASE.md"
]

def obtener_headers_github():
    return {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "AtlasVGI-Deployer/2.1"
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
    print("DESPLIEGUE A PRODUCCIÓN: SEMÁFOROS RM (UOCT/MTT) Y REDISEÑO CONSOLA GIS")
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
    
    for rel_path, pointer_str in punteros_lfs.items():
        tree_items.append({
            "path": rel_path.replace("\\", "/"),
            "mode": "100644",
            "type": "blob",
            "content": pointer_str
        })
        print(f"    [LFS] {rel_path} (puntero SHA {pointer_str.split('oid sha256:')[1][:8]})")
        
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
        "feat(cartografia): integracion capa semaforos RM UOCT/MTT y redisenio integral consola GIS\n\n"
        "- Ingesta de 3.483 cruces semaforizados operativos UOCT/MTT en la RM (Oficio N° 26105 / 2026)\n"
        "- 100% de geometrías íntegras sin simplificaciones y con 14 atributos normalizados en UTF-8\n"
        "- Rediseño profesional GIS-grade de la consola de capas (Workbench): buscador en vivo, chips de filtro rápido, tabs y switches\n"
        "- Eliminación de elementos informales/emojis en títulos para estética cartográfica rigurosa\n"
        "- Totalización de 112 capas oficiales del Estado y 122 capas cartográficas en el Atlas\n"
        "- Regeneración de catálogos Excel OpenXML (.xlsx), script SQL de metadatos PostGIS y suite documental"
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
    print("Netlify compilará y desplegará automáticamente la nueva versión.")
    print("=" * 80)

if __name__ == "__main__":
    main()
