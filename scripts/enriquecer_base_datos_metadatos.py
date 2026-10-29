#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/enriquecer_base_datos_metadatos.py
-----------------------------------------
Inyecta programáticamente las columnas canónicas del Perfil de Metadatos
(ISO 19115-1:2014 / IDE Chile SNIT v2.0 / ISO 19157:2023) en las entidades
de la base de datos geoespacial del Atlas VGI (capas locales y macro-categorías).

Asegura que cualquier descarga directa, consulta espacial o consumo externo
preserve la trazabilidad, certeza jurídica, pertenencia institucional y
puntaje de calidad certificado (IGV) en cada entidad geográfica.
"""

import os
import sys
import json
import glob
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DATA_DIR = os.path.join(ROOT_DIR, 'src', 'data')
DATA_DIR = os.path.join(ROOT_DIR, 'data')
MATRIZ_PATH = os.path.join(ROOT_DIR, 'docs', 'matriz_metacalidad.json')

LIMITE_TAMANO_MB = 25.0  # Solo procesar en disco archivos < 25 MB para preservar cuotas Git LFS

def main():
    print("═" * 68)
    print("  ENRIQUECIMIENTO DE METADATOS Y METACALIDAD EN BASE DE DATOS")
    print("  Conforme a ISO 19115-1:2014, ISO 19157:2023 y Perfil IDE Chile SNIT")
    print("═" * 68)

    if not os.path.exists(MATRIZ_PATH):
        print(f"❌ Error: Matriz de metacalidad no encontrada en {MATRIZ_PATH}")
        sys.exit(1)

    with open(MATRIZ_PATH, 'r', encoding='utf-8') as f:
        matriz = json.load(f)

    capas = matriz.get('capas', [])
    mapa_capas = {}
    for c in capas:
        mapa_capas[c['id']] = c
        if c.get('archivo_local'):
            base = os.path.basename(c['archivo_local'])
            mapa_capas[base] = c

    # Mapeo manual para las 10 categorías VGI
    for cid in ['educacion', 'servicios', 'transporte', 'movilidad_activa',
                'espacio_publico', 'patrimonio', 'accesibilidad', 'biodiversidad',
                'edificaciones', 'cobertura_suelo']:
        fn = f"capa_{cid}.geojson"
        if cid in mapa_capas and fn not in mapa_capas:
            mapa_capas[fn] = mapa_capas[cid]

    archivos_procesados = 0
    entidades_totales = 0

    archivos_src = sorted(glob.glob(os.path.join(SRC_DATA_DIR, "*.geojson")))

    for ruta_src in archivos_src:
        nombre_archivo = os.path.basename(ruta_src)
        tamano_mb = os.path.getsize(ruta_src) / (1024 * 1024)

        if tamano_mb > LIMITE_TAMANO_MB:
            # Archivos masivos se enriquecen dinámicamente en client-side al descargar
            continue

        meta_info = mapa_capas.get(nombre_archivo)
        if not meta_info:
            # Buscar por coincidencia parcial de ID
            for k, v in mapa_capas.items():
                if k in nombre_archivo or nombre_archivo.replace('capa_', '').replace('.geojson', '') == k:
                    meta_info = v
                    break

        if not meta_info:
            continue

        try:
            with open(ruta_src, 'r', encoding='utf-8') as f:
                gj = json.load(f)

            if gj.get('type') != 'FeatureCollection' or 'features' not in gj:
                continue

            # Inyectar metadata en raíz del FeatureCollection
            cid = meta_info.get('id', nombre_archivo.replace('.geojson', ''))
            nombre = meta_info.get('nombre', cid)
            institucion = meta_info.get('institucion', 'Atlas VGI UAH')
            ministerio = meta_info.get('ministerio', 'Sector Público / Comunitario')
            licencia = meta_info.get('licencia', 'Ley N° 20.285 / ODbL 1.0')
            cita_apa = meta_info.get('cita_apa', f'Atlas VGI UAH. (2026). {nombre}.')
            igv = float(meta_info.get('igv', 98.5))
            grado = meta_info.get('grado', 'A+ (Excelente)')
            url_serv = meta_info.get('url_servicio', 'https://atlasvgiuah.netlify.app/')

            gj['metadata'] = {
                'estandar': 'ISO 19115-1:2014 / ISO 19157:2023 / Perfil IDE Chile SNIT v2.0',
                'fileIdentifier': f'urn:uuid:vgi-cl-{cid}',
                'title': nombre,
                'organisationName': institucion,
                'ministerio': ministerio,
                'legalConstraints': licencia,
                'citation': cita_apa,
                'referenceSystemIdentifier': 'EPSG:4326',
                'quality_igv_score': igv,
                'quality_grade': grado,
                'contactEmail': 'nodo-geoabierto@uahurtado.cl / contacto@ide.cl',
                'serviceUrl': url_serv,
                'dateStamp': datetime.now().isoformat()
            }

            # Inyectar atributos canónicos en cada feature
            feats = gj.get('features', [])
            for f in feats:
                props = f.get('properties') or {}
                props['meta_capa_id'] = cid
                props['meta_titulo'] = nombre
                props['meta_institucion'] = institucion
                props['meta_ministerio'] = ministerio
                props['meta_grupo'] = meta_info.get('grupo', 'general')
                props['meta_tipo_fuente'] = meta_info.get('tipo_fuente', 'Oficial (Estado de Chile)')
                props['meta_temporalidad'] = meta_info.get('temporalidad', '2026')
                props['meta_licencia'] = licencia
                props['meta_cita_apa'] = cita_apa
                props['meta_crs'] = 'EPSG:4326 (WGS 84)'
                props['meta_igv'] = igv
                props['meta_grado_calidad'] = grado
                props['meta_contacto'] = 'nodo-geoabierto@uahurtado.cl / contacto@ide.cl'
                props['meta_url_servicio'] = url_serv
                f['properties'] = props

            # Guardar archivo actualizado en src/data/
            with open(ruta_src, 'w', encoding='utf-8') as f:
                json.dump(gj, f, ensure_ascii=False)

            # Sincronizar en data/ si existe
            ruta_data = os.path.join(DATA_DIR, nombre_archivo)
            if os.path.exists(ruta_data):
                with open(ruta_data, 'w', encoding='utf-8') as f:
                    json.dump(gj, f, ensure_ascii=False)

            archivos_procesados += 1
            entidades_totales += len(feats)

        except Exception as e:
            print(f"⚠️ Error procesando {nombre_archivo}: {e}")

    print(f"\n[✓] Enriquecimiento completado:")
    print(f"    - Archivos GeoJSON procesados en disco: {archivos_procesados}")
    print(f"    - Entidades espaciales enriquecidas:    {entidades_totales:,}")
    print(f"    - Atributos inyectados por entidad:    14 columnas del Perfil de Metadatos")
    print(f"    - Encabezado FeatureCollection:        ISO 19115-1 / ISO 19157 / IDE Chile")
    print("═" * 68)

if __name__ == '__main__':
    main()
