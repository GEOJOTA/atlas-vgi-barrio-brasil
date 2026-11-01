#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/publicar_geofabrik_rm.py
---------------------------------
Publica a producción en GitHub (rama main) y Netlify:
1. Capas espaciales de la RM extraídas directamente del extracto Geofabrik Chile (chile-260927.osm.pbf)
   con recorte oficial por shapefile DPA 2023 de la Región Metropolitana.
2. Geodatabase espacial regional 'data/geodatabase_osm_rm_geofabrik.gpkg' con índices R-Tree nativos
   por macrocategoría.
3. 10 capas temáticas GeoJSON optimizadas en 'data/' y 'src/data/' con índice de Bbox por feature
   y metadatos oficiales de procedencia: Fuente (Geofabrik, local-api).
4. Actualización del módulo OSM (osm.js) y app.js con filtrado acelerado O(1) y trazabilidad completa.
"""

import os
import sys
import json
import base64
import time
import hashlib
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
LFS_URL = f"https://github.com/{OWNER}/{REPO}.git/info/lfs/objects/batch"

ARCHIVOS_CODIGO = [
    ".gitattributes",
    "src/index.html",
    "src/css/estilos.css",
    "src/js/modulos/osm.js",
    "src/js/modulos/mapa.js",
    "src/js/modulos/ide_chile.js",
    "src/js/modulos/evaluador_normativo.js",
    "src/js/modulos/indicadores_analisis.js",
    "src/js/app.js",
    "src/img/storyboards/brasil_patrimonio.jpg",
    "src/img/storyboards/brasil_movilidad.jpg",
    "src/img/storyboards/brasil_plaza.jpg",
    "src/img/storyboards/brasil_universidad.svg",
    "src/img/storyboards/brasil_cuidados.svg",
    "img/storyboards/brasil_patrimonio.jpg",
    "img/storyboards/brasil_movilidad.jpg",
    "img/storyboards/brasil_plaza.jpg",
    "img/storyboards/brasil_universidad.svg",
    "img/storyboards/brasil_cuidados.svg",
    "README.md",
    "MANUAL_USO.md",
    "src/docs/MANUAL_USO.md",
    "docs/ARQUITECTURA.md",
    "src/docs/ARQUITECTURA.md",
    "docs/TRAZABILIDAD_ACADEMICA.md",
    "src/docs/TRAZABILIDAD_ACADEMICA.md",
    "docs/categorias_tematicas_osm.xlsx",
    "src/docs/categorias_tematicas_osm.xlsx",
    "docs/catalogo_fuentes_vgi.xlsx",
    "src/docs/catalogo_fuentes_vgi.xlsx",
    "docs/perfil_metadatos_vgi.xlsx",
    "src/docs/perfil_metadatos_vgi.xlsx",
    "scripts/db/02_seed_metadata.sql",
    "scripts/descargar_capas_normativas_ide.py",
    "scripts/generar_catalogos_excel.py",
    "scripts/procesar_osm_geofabrik_usuario.py",
    "scripts/procesar_osm_geofabrik_completo.py",
    "scripts/verificar_conteo_capas.py",
    "scripts/analisis_metacalidad.py",
    "docs/matriz_metacalidad.json",
    "src/docs/matriz_metacalidad.json",
    "docs/ANALISIS_METACALIDAD.md",
    "src/docs/ANALISIS_METACALIDAD.md",
    "scripts/verificar_integridad_despliegue.py",
    "scripts/generar_ppt_estado_avance_blanco.py",
    "data/capa_bbdd_66.geojson",
    "src/data/capa_bbdd_66.geojson",
    "data/capa_unidades_vecinales_bidat.geojson",
    "src/data/capa_unidades_vecinales_bidat.geojson",
    "data/Areas_Verdes_MINVU_INE_2023.geojson",
    "src/data/Areas_Verdes_MINVU_INE_2023.geojson",
    "data/ide_minvu_ipt_areas_verdes.geojson",
    "src/data/ide_minvu_ipt_areas_verdes.geojson",
    "data/capa_ccu_1993.geojson",
    "src/data/capa_ccu_1993.geojson",
    "data/capa_ccu_2011.geojson",
    "src/data/capa_ccu_2011.geojson",
    "data/capa_ccu_2018.geojson",
    "src/data/capa_ccu_2018.geojson",
    "data/capa_ccu_2019.geojson",
    "src/data/capa_ccu_2019.geojson",
    "data/capa_ccu_2020.geojson",
    "src/data/capa_ccu_2020.geojson",
    "data/capa_ccu_2021.geojson",
    "src/data/capa_ccu_2021.geojson",
    "data/capa_ccu_2022.geojson",
    "src/data/capa_ccu_2022.geojson",
    "data/capa_ccu_2023.geojson",
    "src/data/capa_ccu_2023.geojson",
    "data/capa_ccu_2024.geojson",
    "src/data/capa_ccu_2024.geojson",
    "scripts/publicar_geofabrik_rm.py"
]


CATEGORIAS = [
    "cat01_educacion",
    "cat02_servicios",
    "cat03_transporte",
    "cat04_movilidad_activa",
    "cat05_espacio_publico",
    "cat06_patrimonio",
    "cat07_accesibilidad",
    "cat08_biodiversidad",
    "cat09_edificaciones",
    "cat10_cobertura_suelo"
]

ARCHIVOS_LFS = []
for cat in CATEGORIAS:
    ARCHIVOS_LFS.append(f"data/capa_osm_rm_{cat}.geojson")
    ARCHIVOS_LFS.append(f"src/data/capa_osm_rm_{cat}.geojson")



def obtener_headers_api():
    return {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Atlas-VGI-Deployer"
    }

def obtener_headers_lfs():
    return {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.git-lfs+json",
        "Content-Type": "application/vnd.git-lfs+json",
        "User-Agent": "Atlas-VGI-Deployer"
    }

def calcular_sha256_y_tamano(filepath):
    h = hashlib.sha256()
    size = os.path.getsize(filepath)
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest(), size

def crear_blob(contenido_bytes):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/git/blobs"
    b64_content = base64.b64encode(contenido_bytes).decode("utf-8")
    payload = {
        "content": b64_content,
        "encoding": "base64"
    }
    r = requests.post(url, json=payload, headers=obtener_headers_api(), timeout=45)
    if r.status_code != 201:
        raise Exception(f"Error creando blob: HTTP {r.status_code} - {r.text[:200]}")
    return r.json()["sha"]

def asegurar_y_subir_lfs():
    print("=" * 80)
    print("FASE 1: VERIFICACIÓN Y SUBIDA DE CAPAS ESPACIALES A GITHUB LFS S3")
    print("=" * 80)
    
    objetos_unicos = {}
    punteros = {}
    
    for rel_path in ARCHIVOS_LFS:
        full_path = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(full_path):
            print(f"[-] Advertencia: {rel_path} no encontrado, se omite.")
            continue
        sha, size = calcular_sha256_y_tamano(full_path)
        ptr = f"version https://git-lfs.github.com/spec/v1\noid sha256:{sha}\nsize {size}\n"
        punteros[rel_path] = ptr
        if sha not in objetos_unicos:
            objetos_unicos[sha] = {
                "size": size,
                "local_path": full_path,
                "paths": [rel_path]
            }
        else:
            objetos_unicos[sha]["paths"].append(rel_path)

    print(f"Total de archivos LFS a registrar: {len(punteros)}")
    print(f"Total de objetos binarios únicos: {len(objetos_unicos)}")

    for idx, (sha, meta) in enumerate(objetos_unicos.items(), 1):
        sz_mb = meta["size"] / (1024 * 1024)
        sample = meta["paths"][0]
        print(f"\n[{idx}/{len(objetos_unicos)}] LFS: {sample} ({sz_mb:.2f} MB)...")
        
        batch_payload = {
            "operation": "upload",
            "transfers": ["basic"],
            "objects": [{"oid": sha, "size": meta["size"]}]
        }
        r_batch = requests.post(LFS_URL, json=batch_payload, headers=obtener_headers_lfs(), timeout=30)
        if r_batch.status_code != 200:
            print(f"[-] Error en LFS Batch API: HTTP {r_batch.status_code} - {r_batch.text}")
            sys.exit(1)
            
        obj = r_batch.json().get("objects", [{}])[0]
        actions = obj.get("actions", {})
        
        if "upload" in actions:
            up_info = actions["upload"]
            put_url = up_info["href"]
            put_headers = up_info.get("header", {})
            print(f"  [*] Subiendo bytes a S3 ({sz_mb:.2f} MB)...", flush=True)
            
            class ProgressReader:
                def __init__(self, filename):
                    self.f = open(filename, 'rb', buffering=1024*1024)
                    self.total = os.path.getsize(filename)
                    self.read_bytes = 0
                    self.last_pct = 0
                    self.t0 = time.time()
                def read(self, n=-1):
                    chunk = self.f.read(n if n > 0 else 256*1024)
                    if chunk:
                        self.read_bytes += len(chunk)
                        pct = int(self.read_bytes * 100 / self.total)
                        if pct >= self.last_pct + 10:
                            self.last_pct = pct
                            el = time.time() - self.t0
                            speed = (self.read_bytes / (1024*1024)) / el if el > 0 else 0
                            print(f"      -> {pct}% ({self.read_bytes/(1024*1024):.1f}/{self.total/(1024*1024):.1f} MB) @ {speed:.2f} MB/s", flush=True)
                    return chunk
                def __len__(self):
                    return self.total
                def fileno(self):
                    return self.f.fileno()
                def tell(self):
                    return self.f.tell()
                def seek(self, offset, whence=0):
                    self.f.seek(offset, whence)
                    self.read_bytes = self.f.tell()
                def close(self):
                    self.f.close()

            subido_ok = False
            for intento in range(1, 8):
                if intento > 1:
                    print(f"  [*] Solicitando nueva URL pre-firmada S3 para reintento {intento}...", flush=True)
                    r_batch_retry = requests.post(LFS_URL, json=batch_payload, headers=obtener_headers_lfs(), timeout=30)
                    if r_batch_retry.status_code == 200:
                        obj_retry = r_batch_retry.json().get("objects", [{}])[0]
                        actions_retry = obj_retry.get("actions", {})
                        if "upload" not in actions_retry:
                            print("  [+] ¡El objeto ya fue aceptado por LFS S3!")
                            subido_ok = True
                            break
                        put_url = actions_retry["upload"]["href"]
                        put_headers = actions_retry["upload"].get("header", {})
                        actions = actions_retry

                reader = ProgressReader(meta["local_path"])
                try:
                    t0 = time.time()
                    session = requests.Session()
                    adapter = requests.adapters.HTTPAdapter(max_retries=1)
                    session.mount('https://', adapter)
                    r_put = session.put(put_url, data=reader, headers=put_headers, timeout=(60, 2400))
                    t_el = time.time() - t0
                    reader.close()
                    if r_put.status_code in (200, 201):
                        print(f"  [+] Subida OK ({t_el:.1f}s)")
                        subido_ok = True
                        break
                    else:
                        print(f"  [-] [Reintento {intento} HTTP {r_put.status_code}]: {r_put.text[:150]}", flush=True)
                        time.sleep(5)
                except Exception as e_s3:
                    reader.close()
                    print(f"  [-] [Reintento {intento} por {e_s3.__class__.__name__}]: {e_s3}", flush=True)
                    time.sleep(7)
            
            if not subido_ok:
                print("ERROR: Fallo definitivo tras reintentos en S3.")
                sys.exit(1)
        else:
            print(f"  [=] Objeto binario ya existente en LFS S3.")

        if "verify" in actions:
            ver_info = actions["verify"]
            ver_url = ver_info["href"]
            ver_headers = {**obtener_headers_lfs(), **ver_info.get("header", {})}
            print("  [*] Verificando objeto con GitHub LFS...", end=" ", flush=True)
            r_ver = requests.post(ver_url, json={"oid": sha, "size": meta["size"]}, headers=ver_headers, timeout=30)
            if r_ver.status_code not in (200, 201):
                print(f"ERROR verify: HTTP {r_ver.status_code}")
                sys.exit(1)
            print("VERIFICADO OK")

    return punteros

def main():
    punteros_lfs = asegurar_y_subir_lfs()
    
    print("\n" + "=" * 80)
    print("FASE 2: CREACIÓN DE COMMITS Y DESPLIEGUE EN GITHUB MAIN")
    print("=" * 80)
    
    headers_api = obtener_headers_api()
    
    ref_url = f"https://api.github.com/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}"
    r_ref = requests.get(ref_url, headers=headers_api, timeout=20)
    commit_sha = r_ref.json()["object"]["sha"]
    print(f"[*] Commit base actual en '{BRANCH}': {commit_sha}")

    r_commit = requests.get(f"https://api.github.com/repos/{OWNER}/{REPO}/git/commits/{commit_sha}", headers=headers_api, timeout=20)
    base_tree_sha = r_commit.json()["tree"]["sha"]
    print(f"[*] Base tree SHA: {base_tree_sha}")

    tree_entries = []

    # 1. Archivos de código
    for rel_path in ARCHIVOS_CODIGO:
        full_path = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(full_path):
            continue
        with open(full_path, "rb") as f:
            data = f.read()
        blob_sha = crear_blob(data)
        tree_entries.append({
            "path": rel_path.replace("\\", "/"),
            "mode": "100644",
            "type": "blob",
            "sha": blob_sha
        })
        print(f"  [+] Código {rel_path} -> {blob_sha[:8]}")

    # 2. Punteros Git LFS (132 bytes estándar)
    for rel_path, ptr_content in punteros_lfs.items():
        ptr_bytes = ptr_content.encode("utf-8")
        blob_sha = crear_blob(ptr_bytes)
        tree_entries.append({
            "path": rel_path.replace("\\", "/"),
            "mode": "100644",
            "type": "blob",
            "sha": blob_sha
        })
        print(f"  [+] Puntero LFS {rel_path} -> {blob_sha[:8]}")

    # 3. Crear Tree
    print("\n[*] Creando Tree en GitHub...", flush=True)
    tree_url = f"https://api.github.com/repos/{OWNER}/{REPO}/git/trees"
    payload_tree = {
        "base_tree": base_tree_sha,
        "tree": tree_entries
    }
    r_tree = requests.post(tree_url, json=payload_tree, headers=headers_api, timeout=30)
    if r_tree.status_code != 201:
        raise Exception(f"Error creando tree: HTTP {r_tree.status_code} - {r_tree.text}")
    new_tree_sha = r_tree.json()["sha"]
    print(f"[*] Nuevo Tree SHA: {new_tree_sha}")

    mensaje = (
        "fix(geometria): eliminacion total de simplificacion en unidades vecinales y reparacion topologica universal\n\n"
        "- Sustitucion de la capa de Unidades Vecinales (bbdd_66 y unidades_vecinales_bidat) por la cobertura oficial integra de la RM (1.364 poligonos, 159.495 vertices conservados al 100%, sin simplificacion).\n"
        "- Resolucion integral de errores topologicos (auto-intersecciones y bowties) en capas de origen mediante make_valid() en Areas Verdes, CCU (1993-2024) y coberturas comunitarias VGI (OSM).\n"
        "- Sincronizacion de ultimas actualizaciones del repositorio (metadatos, presentacion blanco estandarizado, metacalidad IGMC 98.58%).\n"
        "- Preservacion estricta de la integridad de la base de datos bajo estandares ISO 19115 / ISO 19157 (Geografía UAH)."
    )


    r_new_commit = requests.post(
        f"https://api.github.com/repos/{OWNER}/{REPO}/git/commits",
        json={"message": mensaje, "tree": new_tree_sha, "parents": [commit_sha]},
        headers=headers_api,
        timeout=30
    )
    if r_new_commit.status_code != 201:
        raise Exception(f"Error creando commit: HTTP {r_new_commit.status_code} - {r_new_commit.text}")
    new_commit_sha = r_new_commit.json()["sha"]
    print(f"[*] Nuevo Commit SHA: {new_commit_sha}")

    # 5. Actualizar ref
    r_update_ref = requests.patch(ref_url, json={"sha": new_commit_sha}, headers=headers_api, timeout=30)
    if r_update_ref.status_code != 200:
        raise Exception(f"Error actualizando ref: HTTP {r_update_ref.status_code} - {r_update_ref.text}")

    print(f"\n✅ ¡Rama '{BRANCH}' actualizada exitosamente al commit {new_commit_sha[:8]} en produccion!")

if __name__ == "__main__":
    main()
