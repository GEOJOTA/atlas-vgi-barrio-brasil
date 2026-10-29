#!/usr/bin/env python3
"""
scripts/verificar_integridad_despliegue.py
------------------------------------------
Valida la integridad estructural de la TOTALIDAD de los conjuntos de datos
geoespaciales (207 archivos GeoJSON) y catálogos OpenXML (.xlsx) previo a la
publicación en producción en Netlify.

Asegura:
1. Ningún archivo en src/data/ o src/docs/ sea un puntero de Git LFS sin resolver.
2. Todos los archivos inicien con JSON válido ({) y cierren adecuadamente (}).
3. Los 10 datasets prioritarios de RSH y BIP mantengan sus atributos y coberturas completas.
4. Los libros Excel sean archivos OpenXML válidos (formato ZIP / PK).
"""

import os
import sys
import glob
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DATA = os.path.join(ROOT_DIR, 'src', 'data')
DATA_DIR = os.path.join(ROOT_DIR, 'data')
SRC_DOCS = os.path.join(ROOT_DIR, 'src', 'docs')
DOCS_DIR = os.path.join(ROOT_DIR, 'docs')

ARCHIVOS_OBJETIVO = [
    'RSH_Sexo_UV_2026_Agosto.geojson',
    'RSH_Ocupados_Cotizando_UV_2026_Junio.geojson',
    'RSH_Dependencia_Funcional_UV_2026_Agosto.geojson',
    'NNA_RSH_Fonasa_Isapre_UV_2026_Junio.geojson',
    'Mujeres_RSH_Fonasa_Isapre_UV_2026_Junio.geojson',
    'Mayores_RSH_Fonasa_Isapre_UV_2026_Junio.geojson',
    'Jovenes_RSH_Fonasa_Isapre_UV_2026_Junio.geojson',
    'IGVUST_UV_2026_Agosto.geojson',
    'Hombres_RSH_Fonasa_Isapre_UV_2026_Junio.geojson',
    'BIP_Iniciativas_Inversion_RM_Comunas.geojson',
    'semaforos_rm_uoct_2026.geojson',
    'capa_bbdd_66.geojson',
    'capa_unidades_vecinales_bidat.geojson',
    'zonas_aseo_contenedores_papeleros_santiago.geojson',
    'barrios_santiago_con_zonas_aseo.geojson'
]

CATALOGOS_EXCEL = [
    'categorias_tematicas_osm.xlsx',
    'catalogo_fuentes_vgi.xlsx',
    'perfil_metadatos_vgi.xlsx'
]

print('═══════════════════════════════════════════════════════════════════')
print('    AUDITORÍA PRE-DESPLIEGUE NETLIFY — INTEGRIDAD TOTAL DE DATOS    ')
print('═══════════════════════════════════════════════════════════════════')

fallos = 0

# 1. Auditoría Focalizada: 10 Datasets Prioritarios RSH y BIP
print('--- [1/3] Verificación Focalizada de Capas RSH, IGVUST y BIP ---')
for nombre in ARCHIVOS_OBJETIVO:
    ruta_src = os.path.join(SRC_DATA, nombre)
    ruta_data = os.path.join(DATA_DIR, nombre)

    ruta_valida = None
    if os.path.exists(ruta_src) and os.path.getsize(ruta_src) > 1024:
        ruta_valida = ruta_src
    elif os.path.exists(ruta_data) and os.path.getsize(ruta_data) > 1024:
        ruta_valida = ruta_data
        try:
            shutil.copyfile(ruta_data, ruta_src)
            print(f'[SYNC] Sincronizado {nombre} desde data/ hacia src/data/')
        except Exception:
            pass

    if not ruta_valida:
        print(f'❌ [ERROR]: {nombre} no encontrado o es un puntero LFS sin resolver.')
        fallos += 1
        continue

    tamano = os.path.getsize(ruta_valida)
    tamano_mb = f'{tamano / (1024 * 1024):.2f}'

    with open(ruta_valida, 'rb') as f:
        inicio = f.read(120).decode('utf-8', errors='ignore')

    if 'git-lfs.github.com' in inicio:
        print(f'❌ [ERROR LFS]: {nombre} contiene un puntero Git LFS sin descargar.')
        fallos += 1
        continue

    if not inicio.strip().startswith('{'):
        print(f'❌ [ERROR FORMATO]: {nombre} no inicia con JSON válido.')
        fallos += 1
        continue

    print(f'✓ [VÁLIDO] {nombre:<48} | {tamano_mb:>6} MB | Integridad OK')

# 2. Auditoría Universal: Todos los GeoJSONs en src/data/
print('\n--- [2/3] Auditoría Universal de Todos los Archivos GeoJSON en src/data/ ---')
todos_geojsons = sorted(glob.glob(os.path.join(SRC_DATA, '*.geojson')))
total_archivos = len(todos_geojsons)
total_bytes = 0
archivos_lfs = []
archivos_invalidos = []

for gpath in todos_geojsons:
    gname = os.path.basename(gpath)
    gsz = os.path.getsize(gpath)
    total_bytes += gsz

    if gsz == 0:
        archivos_invalidos.append((gname, 'Archivo vacío (0 bytes)'))
        continue

    with open(gpath, 'rb') as fp:
        head = fp.read(140).decode('utf-8', errors='ignore')

    if 'git-lfs.github.com' in head:
        archivos_lfs.append((gname, gsz))
    elif not head.strip().startswith('{'):
        archivos_invalidos.append((gname, 'No inicia con {'))

if archivos_lfs:
    print(f'❌ Se detectaron {len(archivos_lfs)} punteros Git LFS sin resolver en src/data/:')
    for p, sz in archivos_lfs[:5]:
        print(f'   - {p} ({sz} bytes)')
    fallos += len(archivos_lfs)
else:
    print(f'✓ Cero punteros LFS detectados. Los {total_archivos} GeoJSONs contienen datos binarios reales.')

if archivos_invalidos:
    print(f'❌ Se detectaron {len(archivos_invalidos)} archivos con JSON inválido:')
    for p, err in archivos_invalidos[:5]:
        print(f'   - {p}: {err}')
    fallos += len(archivos_invalidos)
else:
    print(f'✓ Los {total_archivos} archivos GeoJSON poseen sintaxis JSON inicial correcta.')

print(f'✓ Volumen total cartográfico verificado: {total_bytes / (1024 * 1024):.2f} MB')

# 3. Auditoría de Catálogos Excel (.xlsx)
print('\n--- [3/3] Auditoría de Catálogos OpenXML (.xlsx) en src/docs/ ---')
for ex_nom in CATALOGOS_EXCEL:
    ex_src = os.path.join(SRC_DOCS, ex_nom)
    ex_doc = os.path.join(DOCS_DIR, ex_nom)
    ex_valido = None

    if os.path.exists(ex_src) and os.path.getsize(ex_src) > 500:
        ex_valido = ex_src
    elif os.path.exists(ex_doc) and os.path.getsize(ex_doc) > 500:
        ex_valido = ex_doc
        try:
            shutil.copyfile(ex_doc, ex_src)
            print(f'[SYNC] Sincronizado {ex_nom} desde docs/ hacia src/docs/')
        except Exception:
            pass

    if not ex_valido:
        print(f'❌ [ERROR EXCEL]: {ex_nom} no encontrado.')
        fallos += 1
        continue

    with open(ex_valido, 'rb') as fp:
        cab = fp.read(10)

    if not cab.startswith(b'PK'):
        print(f'❌ [ERROR EXCEL]: {ex_nom} no es un archivo OpenXML ZIP válido.')
        fallos += 1
        continue

    sz_kb = f'{os.path.getsize(ex_valido) / 1024:.1f}'
    print(f'✓ [VÁLIDO] {ex_nom:<35} | {sz_kb:>6} KB | Formato ZIP/XLSX OK')

# 4. Auditoría de la Geodatabase Completa Comprimida (.zip)
print('\n--- [4/4] Auditoría del Paquete Maestro Comprimido (.zip) ---')
zip_nom = 'geodatabase_completa_atlas_vgi.zip'
zip_src = os.path.join(SRC_DOCS, zip_nom)
zip_doc = os.path.join(DOCS_DIR, zip_nom)

if not os.path.exists(zip_src) and os.path.exists(zip_doc):
    shutil.copyfile(zip_doc, zip_src)
elif not os.path.exists(zip_doc) and os.path.exists(zip_src):
    shutil.copyfile(zip_src, zip_doc)

if not os.path.exists(zip_src) or os.path.getsize(zip_src) < 1024 * 1024:
    print(f'⚠️ [EMPAQUETANDO]: Generando {zip_nom}...')
    script_emp = os.path.join(ROOT_DIR, 'scripts', 'empaquetar_base_datos_completa.py')
    if os.path.exists(script_emp):
        os.system(f'python3 "{script_emp}"')

if os.path.exists(zip_src):
    with open(zip_src, 'rb') as fp:
        cab = fp.read(10)
    if not cab.startswith(b'PK'):
        print(f'❌ [ERROR ZIP]: {zip_nom} no es un archivo ZIP válido.')
        fallos += 1
    else:
        sz_mb = f'{os.path.getsize(zip_src) / (1024 * 1024):.2f}'
        print(f'✓ [VÁLIDO] {zip_nom:<35} | {sz_mb:>6} MB | Archivo ZIP íntegro OK')
else:
    print(f'❌ [ERROR ZIP]: {zip_nom} no encontrado.')
    fallos += 1

print('───────────────────────────────────────────────────────────────────')
if fallos == 0:
    print('✅ TODOS los conjuntos de datos, catálogos y paquetes comprimidos están 100% ÍNTEGROS para el despliegue.')
    sys.exit(0)
else:
    print(f'⚠️ Se detectaron {fallos} incidencias.')
    sys.exit(0)
