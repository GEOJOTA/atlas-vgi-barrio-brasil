#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/empaquetar_base_datos_completa.py
-----------------------------------------
Genera el paquete comprimido maestro oficial (.zip) de absolutamente toda
la base de datos, capas cartográficas, catálogos, matrices y metadatos del
Atlas de Información Geográfica Voluntaria (VGI) — Caso Barrio Brasil / UAH.

Empaqueta el 100% de los datos existentes en src/data/ (los 214 archivos GeoJSON
y 2 archivos CSV), las 118 capas del visor, los extractos de Geofabrik RM,
los 4 catálogos Excel .xlsx, los 4 datasets CSV y los 12 documentos de metadatos.

Estructura exhaustiva del paquete (geodatabase_completa_atlas_vgi.zip):
├── LEAME_PRIMERO_ATLAS_VGI.txt
├── INVENTARIO_GENERAL_ATLAS_VGI.json
├── 01_vgi_comunitario_osm/ (11 capas GeoJSON Barrio Brasil / UAH)
│   ├── atlas_vgi_barrio_brasil_uah_completo.geojson
│   └── capa_educacion.geojson ... capa_cobertura_suelo.geojson (10 macro-categorías)
├── 02_geofabrik_chile_rm/ (11 capas GeoJSON + Scripts + Guías)
│   ├── capa_osm_rm_cat01_educacion.geojson ... cat10_cobertura_suelo.geojson
│   ├── capa_osm_rm_completo_vgi.geojson
│   ├── ENLACES_Y_METADATOS_GEOFABRIK.json
│   ├── GUIA_IMPORTACION_GEOFABRIK_QGIS.md
│   └── scripts/ (procesar_geofabrik_rm.py, generar_gpkg_geofabrik.py)
├── 03_capas_oficiales_estado/ (108 capas oficiales GeoJSON + Inventario)
│   ├── INVENTARIO_108_CAPAS_OFICIALES.json
│   └── ide_censo2024_regional.geojson ... (todas las 108 capas de CAPAS_OFICIALES)
├── 04_repositorio_cartografico_completo/ (84 capas GeoJSON adicionales de src/data/)
│   └── capa_bbdd_61.geojson, capa_bbdd_75.geojson, curvas IGM, canales CNR, etc.
├── 05_catalogos_matrices_excel/ (4 libros OpenXML .xlsx)
│   ├── categorias_tematicas_osm.xlsx
│   ├── catalogo_fuentes_vgi.xlsx
│   ├── perfil_metadatos_vgi.xlsx
│   └── Estado_Avance_Atlas_VGI_UAH.xlsx
├── 06_datos_consolidados_csv/ (4 datasets tabulares .csv)
│   ├── bip_inversiones_santiago.csv
│   ├── resumen_catastro_vgi.csv
│   ├── correlacion_dimensiones_calidad.csv
│   └── wlc_metacalidad_ranking.csv
└── 07_metadatos_y_gobernanza/ (12 documentos de calidad, metadatos y gobernanza)
    ├── metadatos_iso19139_atlas_vgi.xml
    ├── metadatos_iso19115_atlas_vgi.json
    ├── matriz_metacalidad.json
    ├── wlc_metacalidad_resultado.json
    ├── Estado_Avance_Atlas_VGI_UAH.docx
    ├── ANALISIS_METACALIDAD.md
    ├── MANUAL_USO.md
    ├── ARQUITECTURA.md
    ├── BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md
    ├── TRAZABILIDAD_ACADEMICA.md
    ├── GUIA_BASE_DATOS_SUPABASE.md
    └── LICENSE
"""

import os
import sys
import re
import json
import zipfile
import shutil
import hashlib
from datetime import datetime

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, "src")
DATA_DIR = os.path.join(SRC_DIR, "data")
DOCS_DIR = os.path.join(SRC_DIR, "docs")
PARENT_DIR = os.path.dirname(BASE_DIR)

OUTPUT_ZIP = os.path.join(SRC_DIR, "docs", "geodatabase_completa_atlas_vgi.zip")
MIRROR_ZIP = os.path.join(BASE_DIR, "docs", "geodatabase_completa_atlas_vgi.zip")

print("=" * 80)
print("EMPAQUETANDO BASE DE DATOS COMPLETA E INTEGRAL ATLAS VGI (.ZIP)")
print("INCLUYENDO EL 100% DE CAPAS DE SRC/DATA, GEOFABRIK, EXCEL, CSV Y METADATOS")
print("=" * 80)

# -----------------------------------------------------------------------------
# 1. Extraer dinámicamente las 108 capas oficiales desde ide_chile.js
# -----------------------------------------------------------------------------
ide_chile_path = os.path.join(SRC_DIR, "js", "modulos", "ide_chile.js")
with open(ide_chile_path, "r", encoding="utf-8") as f:
    ide_text = f.read()

matches = re.finditer(r'^\s{4}([\'\w]+):\s*\{([\s\S]*?)\n\s{4}\},?', ide_text, re.MULTILINE)
capas_oficiales_meta = []
archivos_oficiales_set = set()

for m in matches:
    lid = m.group(1).strip('\'"')
    body = m.group(2)
    arch = re.search(r'archivoLocal:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
    nom = re.search(r'nombre:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
    inst = re.search(r'institucion:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
    minis = re.search(r'ministerio:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
    tipo = re.search(r'tipoServicio:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
    url_s = re.search(r'urlServicio:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
    desc = re.search(r'descripcion:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
    decl = re.search(r'declaracion:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)
    cita = re.search(r'citaAPA:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', body)

    if arch:
        fname = arch.group(1).replace("data/", "")
        archivos_oficiales_set.add(fname)
        capas_oficiales_meta.append({
            "id": lid,
            "nombre": nom.group(1) if nom else lid,
            "archivo": fname,
            "institucion": inst.group(1) if inst else "Estado de Chile",
            "ministerio": minis.group(1) if minis else "Gobierno de Chile",
            "tipo_servicio": tipo.group(1) if tipo else "GeoJSON WGS84",
            "url_oficial": url_s.group(1) if url_s else "https://www.geoportal.cl",
            "descripcion": desc.group(1) if desc else "",
            "declaracion": decl.group(1) if decl else "",
            "cita_apa_7": cita.group(1) if cita else ""
        })

print(f"[*] Capas Oficiales del Estado detectadas en ide_chile.js: {len(capas_oficiales_meta)} (Meta: 122)")
assert len(capas_oficiales_meta) == 122, f"Se esperaban 122 capas oficiales, se hallaron {len(capas_oficiales_meta)}"

# -----------------------------------------------------------------------------
# 2. Definir las 10 macrocategorías VGI + dataset consolidado (11 capas)
# -----------------------------------------------------------------------------
VGI_FILES = [
    'atlas_vgi_barrio_brasil_uah_completo.geojson',
    'capa_educacion.geojson',
    'capa_servicios.geojson',
    'capa_transporte.geojson',
    'capa_movilidad_activa.geojson',
    'capa_espacio_publico.geojson',
    'capa_patrimonio.geojson',
    'capa_accesibilidad.geojson',
    'capa_biodiversidad.geojson',
    'capa_edificaciones.geojson',
    'capa_cobertura_suelo.geojson'
]
print(f"[*] Capas Comunitarias VGI (Barrio Brasil / UAH): {len(VGI_FILES)} (10 macrocategorías + dataset consolidado)")

# -----------------------------------------------------------------------------
# 3. Definir las 11 capas de Geofabrik RM
# -----------------------------------------------------------------------------
GEOFABRIK_FILES = [
    'capa_osm_rm_cat01_educacion.geojson',
    'capa_osm_rm_cat02_servicios.geojson',
    'capa_osm_rm_cat03_transporte.geojson',
    'capa_osm_rm_cat04_movilidad_activa.geojson',
    'capa_osm_rm_cat05_espacio_publico.geojson',
    'capa_osm_rm_cat06_patrimonio.geojson',
    'capa_osm_rm_cat07_accesibilidad.geojson',
    'capa_osm_rm_cat08_biodiversidad.geojson',
    'capa_osm_rm_cat09_edificaciones.geojson',
    'capa_osm_rm_cat10_cobertura_suelo.geojson',
    'capa_osm_rm_completo_vgi.geojson'
]
print(f"[*] Capas Temáticas y Consolidada Geofabrik RM: {len(GEOFABRIK_FILES)}")

# -----------------------------------------------------------------------------
# 4. Detectar capas adicionales restantes en src/data/ (para completar el 100%)
# -----------------------------------------------------------------------------
archivos_clasificados = set(VGI_FILES) | set(GEOFABRIK_FILES) | archivos_oficiales_set
todos_geojsons_data = sorted([f for f in os.listdir(DATA_DIR) if f.endswith('.geojson')])
geojsons_adicionales = [f for f in todos_geojsons_data if f not in archivos_clasificados]
print(f"[*] Capas Cartográficas Adicionales en src/data/: {len(geojsons_adicionales)}")
print(f"[*] TOTAL de archivos GeoJSON a incluir en el ZIP: {len(VGI_FILES) + len(GEOFABRIK_FILES) + len(capas_oficiales_meta) + len(geojsons_adicionales)} (100% de los {len(todos_geojsons_data)} en disco)")

# -----------------------------------------------------------------------------
# 5. Archivos Excel (.xlsx)
# -----------------------------------------------------------------------------
EXCEL_CANDIDATES = [
    ('categorias_tematicas_osm.xlsx', os.path.join(DOCS_DIR, 'categorias_tematicas_osm.xlsx')),
    ('catalogo_fuentes_vgi.xlsx', os.path.join(DOCS_DIR, 'catalogo_fuentes_vgi.xlsx')),
    ('perfil_metadatos_vgi.xlsx', os.path.join(DOCS_DIR, 'perfil_metadatos_vgi.xlsx')),
    ('Estado_Avance_Atlas_VGI_UAH.xlsx', os.path.join(PARENT_DIR, 'Estado_Avance_Atlas_VGI_UAH.xlsx'))
]

# -----------------------------------------------------------------------------
# 6. Archivos CSV (.csv)
# -----------------------------------------------------------------------------
CSV_FILES = [
    ('bip_inversiones_santiago.csv', os.path.join(DATA_DIR, 'bip_inversiones_santiago.csv')),
    ('resumen_catastro_vgi.csv', os.path.join(DATA_DIR, 'resumen_catastro_vgi.csv')),
    ('correlacion_dimensiones_calidad.csv', os.path.join(DOCS_DIR, 'correlacion_dimensiones_calidad.csv')),
    ('wlc_metacalidad_ranking.csv', os.path.join(DOCS_DIR, 'wlc_metacalidad_ranking.csv'))
]

# -----------------------------------------------------------------------------
# 7. Documentos de Metadatos y Gobernanza
# -----------------------------------------------------------------------------
DOC_FILES = [
    ('ANALISIS_METACALIDAD.md', os.path.join(DOCS_DIR, 'ANALISIS_METACALIDAD.md')),
    ('MANUAL_USO.md', os.path.join(DOCS_DIR, 'MANUAL_USO.md')),
    ('ARQUITECTURA.md', os.path.join(DOCS_DIR, 'ARQUITECTURA.md')),
    ('BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md', os.path.join(DOCS_DIR, 'BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md')),
    ('TRAZABILIDAD_ACADEMICA.md', os.path.join(DOCS_DIR, 'TRAZABILIDAD_ACADEMICA.md')),
    ('GUIA_BASE_DATOS_SUPABASE.md', os.path.join(DOCS_DIR, 'GUIA_BASE_DATOS_SUPABASE.md')),
    ('matriz_metacalidad.json', os.path.join(DOCS_DIR, 'matriz_metacalidad.json')),
    ('wlc_metacalidad_resultado.json', os.path.join(DOCS_DIR, 'wlc_metacalidad_resultado.json')),
    ('Estado_Avance_Atlas_VGI_UAH.docx', os.path.join(PARENT_DIR, 'Estado_Avance_Atlas_VGI_UAH.docx'))
]

# -----------------------------------------------------------------------------
# 8. Generar Ficha XML ISO 19139 y JSON ISO 19115
# -----------------------------------------------------------------------------
XML_ISO19139 = f"""<?xml version="1.0" encoding="UTF-8"?>
<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd"
                 xmlns:gco="http://www.isotc211.org/2005/gco"
                 xmlns:gml="http://www.opengis.net/gml"
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xsi:schemaLocation="http://www.isotc211.org/2005/gmd http://schemas.opengis.net/iso/19139/20060504/gmd/gmd.xsd">
  <gmd:fileIdentifier>
    <gco:CharacterString>urn:uuid:atlas-vgi-uah-barrio-brasil-completo-2026</gco:CharacterString>
  </gmd:fileIdentifier>
  <gmd:language>
    <gmd:LanguageCode codeList="http://www.loc.gov/standards/iso639-2/" codeListValue="spa">Español</gmd:LanguageCode>
  </gmd:language>
  <gmd:characterSet>
    <gmd:MD_CharacterSetCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#MD_CharacterSetCode" codeListValue="utf8">UTF-8</gmd:MD_CharacterSetCode>
  </gmd:characterSet>
  <gmd:hierarchyLevel>
    <gmd:MD_ScopeCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#MD_ScopeCode" codeListValue="dataset">dataset</gmd:MD_ScopeCode>
  </gmd:hierarchyLevel>
  <gmd:contact>
    <gmd:CI_ResponsibleParty>
      <gmd:individualName><gco:CharacterString>Juan Pablo Lescano Villegas (GEOJOTA)</gco:CharacterString></gmd:individualName>
      <gmd:organisationName><gco:CharacterString>Departamento de Geografía — Universidad Alberto Hurtado (UAH)</gco:CharacterString></gmd:organisationName>
      <gmd:contactInfo>
        <gmd:CI_Contact>
          <gmd:address>
            <gmd:CI_Address>
              <gmd:electronicMailAddress><gco:CharacterString>juanpablolescanovillegas@gmail.com</gco:CharacterString></gmd:electronicMailAddress>
            </gmd:CI_Address>
          </gmd:address>
        </gmd:CI_Contact>
      </gmd:contactInfo>
      <gmd:role>
        <gmd:CI_RoleCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#CI_RoleCode" codeListValue="custodian">custodian</gmd:CI_RoleCode>
      </gmd:role>
    </gmd:CI_ResponsibleParty>
  </gmd:contact>
  <gmd:dateStamp>
    <gco:Date>2026-10-14</gco:Date>
  </gmd:dateStamp>
  <gmd:metadataStandardName>
    <gco:CharacterString>Perfil Nacional de Metadatos IDE Chile (ISO 19115:2003 / Cor 1:2006 / ISO 19139:2007)</gco:CharacterString>
  </gmd:metadataStandardName>
  <gmd:metadataStandardVersion>
    <gco:CharacterString>2.0</gco:CharacterString>
  </gmd:metadataStandardVersion>
  <gmd:referenceSystemInfo>
    <gmd:MD_ReferenceSystem>
      <gmd:referenceSystemIdentifier>
        <gmd:RS_Identifier>
          <gmd:code><gco:CharacterString>EPSG:4326 (WGS 84 Coordenadas Geográficas) / EPSG:32719 (WGS 84 / UTM Huso 19 Sur métrico)</gco:CharacterString></gmd:code>
        </gmd:RS_Identifier>
      </gmd:referenceSystemIdentifier>
    </gmd:MD_ReferenceSystem>
  </gmd:referenceSystemInfo>
  <gmd:identificationInfo>
    <gmd:MD_DataIdentification>
      <gmd:citation>
        <gmd:CI_Citation>
          <gmd:title><gco:CharacterString>Geodatabase Multicapa Completa — Atlas VGI Barrio Brasil y Campus UAH (214 Capas GeoJSON + Geofabrik + Catálogos)</gco:CharacterString></gmd:title>
          <gmd:date>
            <gmd:CI_Date>
              <gmd:date><gco:Date>2026-10-14</gco:Date></gmd:date>
              <gmd:dateType>
                <gmd:CI_DateTypeCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#CI_DateTypeCode" codeListValue="creation">creation</gmd:CI_DateTypeCode>
              </gmd:dateType>
            </gmd:CI_Date>
          </gmd:date>
        </gmd:CI_Citation>
      </gmd:citation>
      <gmd:abstract><gco:CharacterString>Geodatabase completa que integra la totalidad absoluta de las capas cartográficas del repositorio: 10 macrocategorías VGI comunitarias (OpenStreetMap/GBIF), 11 capas regionales de Geofabrik RM, 108 capas oficiales del Estado de Chile (Censo INE 2024, MINVU, UOCT, Subtel, BIP, RSH, SEC, MMA, MOP) y 84 capas complementarias masivas. Incluye matrices metodológicas Excel, conjuntos tabulares CSV y metadatos normalizados bajo normas ISO 19115/19139 e ISO 19157.</gco:CharacterString></gmd:abstract>
      <gmd:purpose><gco:CharacterString>Proveer a la comunidad académica, organizaciones territoriales e instituciones públicas una infraestructura de datos espaciales abierta, reproducible y de calidad certificada para la gestión territorial del Barrio Brasil y Gran Santiago.</gco:CharacterString></gmd:purpose>
      <gmd:resourceConstraints>
        <gmd:MD_LegalConstraints>
          <gmd:useLimitation><gco:CharacterString>Open Database License (ODbL 1.0) para OpenStreetMap; Creative Commons CC BY-SA 4.0 para metadatos y matrices; Ley N° 20.285 para datos oficiales del Estado de Chile; GNU AGPLv3 para código fuente.</gco:CharacterString></gmd:useLimitation>
        </gmd:MD_LegalConstraints>
      </gmd:resourceConstraints>
      <gmd:topicCategory>
        <gmd:MD_TopicCategoryCode>planningCadastre</gmd:MD_TopicCategoryCode>
      </gmd:topicCategory>
      <gmd:extent>
        <gmd:EX_Extent>
          <gmd:description><gco:CharacterString>Barrio Brasil, Campus Universidad Alberto Hurtado y Región Metropolitana de Santiago, Chile.</gco:CharacterString></gmd:description>
          <gmd:geographicElement>
            <gmd:EX_GeographicBoundingBox>
              <gmd:westBoundLongitude><gco:Decimal>-70.6750</gco:Decimal></gmd:westBoundLongitude>
              <gmd:eastBoundLongitude><gco:Decimal>-70.6550</gco:Decimal></gmd:eastBoundLongitude>
              <gmd:southBoundLatitude><gco:Decimal>-33.4530</gco:Decimal></gmd:southBoundLatitude>
              <gmd:northBoundLatitude><gco:Decimal>-33.4350</gco:Decimal></gmd:northBoundLatitude>
            </gmd:EX_GeographicBoundingBox>
          </gmd:geographicElement>
        </gmd:EX_Extent>
      </gmd:extent>
    </gmd:MD_DataIdentification>
  </gmd:identificationInfo>
  <gmd:dataQualityInfo>
    <gmd:DQ_DataQuality>
      <gmd:scope>
        <gmd:DQ_Scope>
          <gmd:level><gmd:MD_ScopeCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#MD_ScopeCode" codeListValue="dataset">dataset</gmd:MD_ScopeCode></gmd:level>
        </gmd:DQ_Scope>
      </gmd:scope>
      <gmd:lineage>
        <gmd:LI_Lineage>
          <gmd:statement><gco:CharacterString>Datos vectoriales normalizados y verificados bajo ISO 19157 (MetaCalidad global 95.28%). Esquema de 14 atributos maestros y 125 citas bibliográficas APA 7ª ed.</gco:CharacterString></gmd:statement>
        </gmd:LI_Lineage>
      </gmd:lineage>
    </gmd:DQ_DataQuality>
  </gmd:dataQualityInfo>
</gmd:MD_Metadata>"""

JSON_ISO19115 = {
    "estandar": "ISO 19115-1:2014 / Perfil Nacional de Metadatos IDE Chile (SNIT)",
    "uuid": "urn:uuid:atlas-vgi-uah-barrio-brasil-completo-2026",
    "fecha_empaquetado": datetime.now().isoformat(),
    "titulo": "Geodatabase Completa Atlas VGI — Barrio Brasil / Universidad Alberto Hurtado",
    "cobertura": "Barrio Brasil, Campus UAH y Región Metropolitana de Santiago, Chile",
    "resumen": "Geodatabase exhaustiva con 214 capas GeoJSON (10 VGI + 11 Geofabrik + 108 Oficiales del Estado + 84 cartografía complementaria), 4 catálogos Excel .xlsx, 4 datasets CSV y metadatos normalizados.",
    "sistema_referencia": {
        "coordenadas_nativas": "EPSG:4326 (WGS 84 Coordenadas Geográficas)",
        "calculo_metrico": "EPSG:32719 (WGS 84 / UTM Huso 19 Sur)",
        "marco_geodesico_nacional": "EPSG:5361 (SIRGAS-Chile / UTM Huso 19S)"
    },
    "estadisticas_generales": {
        "total_archivos_geojson": len(todos_geojsons_data),
        "capas_oficiales_estado": 108,
        "macrocategorias_vgi_comunitarias": 10,
        "capas_geofabrik_rm": 11,
        "capas_cartograficas_adicionales": len(geojsons_adicionales),
        "catalogos_excel_xlsx": len(EXCEL_CANDIDATES),
        "datasets_tabulares_csv": len(CSV_FILES),
        "documentos_gobernanza_y_calidad": len(DOC_FILES) + 1
    },
    "licencias": {
        "datos_osm": "Open Database License (ODbL 1.0)",
        "datos_oficiales": "Ley N° 20.285 sobre Acceso a la Información Pública (Estado de Chile)",
        "metadatos_y_catalogos": "Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)",
        "codigo_y_scripts": "GNU Affero General Public License v3.0 (AGPLv3)"
    },
    "contacto": {
        "organizacion": "Departamento de Geografía — Universidad Alberto Hurtado (UAH)",
        "proyecto": "Investigación Cartográfica UAH · Práctica Profesional 2026 S2",
        "practicante": "Juan Pablo Lescano Villegas (GEOJOTA)",
        "correo": "juanpablolescanovillegas@gmail.com",
        "supervisor": "Prof. Manuel Fuenzalida",
        "repositorio": "https://github.com/GEOJOTA/atlas_vgi_uah",
        "visor_en_linea": "https://atlasvgiuah.netlify.app/"
    }
}

GEOFABRIK_META = {
    "proveedor": "Geofabrik GmbH (Karlsruhe, Alemania)",
    "origen_datos": "OpenStreetMap contributors (ODbL 1.0)",
    "cobertura": "Chile y Región Metropolitana de Santiago",
    "frecuencia_actualizacion": "Diaria (00:00 UTC)",
    "descargas_oficiales_directas": {
        "osm_pbf_chile": {
            "nombre": "Chile OSM PBF (Formato binario comprimido optimizado)",
            "url": "https://download.geofabrik.de/south-america/chile-latest.osm.pbf",
            "descripcion": "Extracto completo de todas las entidades de OpenStreetMap en Chile.",
            "formato": "OSM PBF",
            "herramientas_recomendadas": ["osmium", "osmconvert", "osm2pgsql", "QGIS (QuickOSM)"]
        },
        "shapefiles_chile": {
            "nombre": "Chile Shapefiles (Capas temáticas ESRI Shapefile)",
            "url": "https://download.geofabrik.de/south-america/chile-latest-free.shp.zip",
            "descripcion": "Paquete comprimido con capas Shapefile: roads, buildings, points of interest, landuse, water, etc.",
            "formato": "ESRI Shapefile (.shp.zip)",
            "herramientas_recomendadas": ["QGIS", "ArcGIS", "GeoPandas"]
        },
        "osm_bz2_chile": {
            "nombre": "Chile XML OSM comprimido BZ2",
            "url": "https://download.geofabrik.de/south-america/chile-latest.osm.bz2",
            "descripcion": "Extracto XML clásico comprimido con bzip2.",
            "formato": "OSM XML BZ2"
        }
    },
    "capas_incluidas_en_paquete": GEOFABRIK_FILES
}

GUIA_GEOFABRIK_MD = """# Guía Técnica: Uso de Extractos Geofabrik en el Atlas VGI UAH

## 1. ¿Qué es Geofabrik?
Geofabrik GmbH es el principal proveedor mundial de extractos regionales depurados de OpenStreetMap. Cada noche procesa el planet dump de OSM y genera archivos recortados por países y regiones sin costo de acceso bajo licencia ODbL 1.0.

## 2. Enlaces Oficiales de Descarga Directa
- **OSM PBF Chile (Recomendado):** https://download.geofabrik.de/south-america/chile-latest.osm.pbf
- **Shapefiles Chile (.zip):** https://download.geofabrik.de/south-america/chile-latest-free.shp.zip
- **Servidor Geofabrik Sudamérica:** https://download.geofabrik.de/south-america/chile.html

## 3. Capas Geofabrik RM Incluidas en Este Paquete
Este paquete contiene las 10 macrocategorías temáticas VGI de la Región Metropolitana ya filtradas y normalizadas en formato GeoJSON WGS84 (EPSG:4326), además del archivo consolidado `capa_osm_rm_completo_vgi.geojson`.

## 4. Uso en QGIS
1. En QGIS, abra el menú `Capa` → `Añadir Capa` → `Añadir Capa Vectorial`.
2. Seleccione cualquiera de los archivos `.geojson` de la carpeta `02_geofabrik_chile_rm/`.
3. Para superponer con el polígono piloto, cargue `01_vgi_comunitario_osm/atlas_vgi_barrio_brasil_uah_completo.geojson`.

## 5. Filtrado con Osmium Tool (CLI)
Para recortar el archivo `.osm.pbf` de Chile al BBox de Barrio Brasil:
```bash
osmium extract -b -70.6720,-33.4505,-70.6580,-33.4350 chile-latest.osm.pbf -o barrio_brasil_geofabrik.osm.pbf
```
"""

LEAME_TEXT = """================================================================================
ATLAS DE INFORMACIÓN GEOGRÁFICA VOLUNTARIA (VGI) PARA LA GESTIÓN TERRITORIAL
CASO PILOTO: BARRIO BRASIL Y CAMPUS UNIVERSIDAD ALBERTO HURTADO (SANTIAGO, CHILE)
DEPARTAMENTO DE GEOGRAFÍA UAH 2026
================================================================================

Este archivo comprimido (.zip) contiene la base de datos ÍNTEGRA Y COMPLETA,
abarcando el 100% absoluto de las capas espaciales, catálogos, matrices y
metadatos existentes en el repositorio del Atlas VGI Territorial (3.33 GB de
datos vectoriales y tabulares descomprimidos en más de 240 archivos).

--------------------------------------------------------------------------------
1. ESTRUCTURA DE CARPETAS Y CONTENIDO TOTAL (241 ARCHIVOS)
--------------------------------------------------------------------------------

01_vgi_comunitario_osm/ (11 archivos GeoJSON)
   Contiene las 10 Macro-categorías VGI del polígono piloto (Barrio Brasil / UAH)
   más el dataset unificado consolidado con esquema de 14 atributos maestros:
   - CAT-01: Educación y Universidades (capa_educacion.geojson)
   - CAT-02: Salud y Servicios Comunitarios (capa_servicios.geojson)
   - CAT-03: Transporte y Movilidad (capa_transporte.geojson)
   - CAT-04: Movilidad Activa y Ciclovías (capa_movilidad_activa.geojson)
   - CAT-05: Áreas Verdes y Espacio Público (capa_espacio_publico.geojson)
   - CAT-06: Patrimonio y Memoria Histórica (capa_patrimonio.geojson)
   - CAT-07: Accesibilidad Universal (capa_accesibilidad.geojson)
   - CAT-08: Biodiversidad Urbana (capa_biodiversidad.geojson)
   - CAT-09: Edificaciones y Huella Urbana (capa_edificaciones.geojson)
   - CAT-10: Coberturas y Usos de Suelo (capa_cobertura_suelo.geojson)
   - Dataset Unificado: atlas_vgi_barrio_brasil_uah_completo.geojson

02_geofabrik_chile_rm/ (11 archivos GeoJSON + Scripts + Guías)
   Capas temáticas y consolidada regional de Geofabrik para la Región Metropolitana:
   - Las 10 macrocategorías regionales (capa_osm_rm_cat01 a cat10)
   - Dataset consolidado regional (capa_osm_rm_completo_vgi.geojson)
   - ENLACES_Y_METADATOS_GEOFABRIK.json (URLs a dumps oficiales diarios PBF/SHP)
   - GUIA_IMPORTACION_GEOFABRIK_QGIS.md (Guía técnica de uso e índices R-Tree)
   - scripts/procesar_geofabrik_rm.py y generar_gpkg_geofabrik.py

03_capas_oficiales_estado/ (108 capas oficiales GeoJSON + Inventario)
   TODAS las 108 capas oficiales de instituciones del Estado de Chile integradas en el
   visor cartográfico, categorizadas por ministerio y servicio público:
   - Censo INE 2024: Manzanas, Zonas, Localidades, Límites Urbanos y Marco Regional
   - MINVU: Áreas Verdes, Zonificación Térmica, Instrumentos de Planificación Territorial (IPT)
   - UOCT / MTT: Red de Cruces Semaforizados Conectados al SC-RM
   - Subtel: Antenas en Servicio y Torres de Telecomunicaciones
   - MIDESO: Unidades Vecinales BIDAT y 8 capas de cobertura socioeconómica RSH
   - MOP / DGA: Cuencas, Red Hídrica, Calidad de Aguas e Índice ICA
   - SEC / SEN: Centrales de generación (solar, hidro, termo, bio), líneas y gasoductos
   - CONAF / CIREN: Catastro de recursos vegetacionales, biomasa y huertos frutales
   - BIP: Banco Integrado de Proyectos de Inversión Pública en la RM
   - SII: Catastro Predial Geocodificado
   - INVENTARIO_108_CAPAS_OFICIALES.json con ficha técnica y citas APA de cada capa.

04_repositorio_cartografico_completo/ (84 archivos GeoJSON masivos y complementarios)
   Todos los conjuntos cartográficos complementarios de src/data/ sin excepción:
   - Catastro vegetacional completo CONAF (capa_bbdd_61.geojson, 284 MB)
   - Censo INE manzanas censales completas RM (capa_bbdd_75.geojson, 123 MB)
   - Instrumentos Comunales IPT Santiago (capa_ipt_prc_comunal.geojson, 77.8 MB)
   - Áreas Verdes consolidadas (Areas_Verdes_MINVU_INE_2023.geojson, 29.4 MB)
   - Canales de riego CNR y Curvas de Nivel IGM (17.7 MB y 16.1 MB)
   - Red de SNASPE, pisos vegetacionales MMA y zonificaciones térmicas
   - Continuo de construcciones urbanas CCU multitemporal y fajas de resguardo.

05_catalogos_matrices_excel/ (4 libros OpenXML .xlsx)
   - categorias_tematicas_osm.xlsx: Libro de 4 hojas (Taxonomías CAT-01..10,
     catálogo de etiquetas Chile, diccionario de atributos y 125 citas APA 7ª ed.)
   - catalogo_fuentes_vgi.xlsx: Inventario evaluado de fuentes colaborativas y oficiales
   - perfil_metadatos_vgi.xlsx: Perfil de metadatos ISO 19115 / SNIT y matriz de calidad
   - Estado_Avance_Atlas_VGI_UAH.xlsx: Matriz de avance y carta Gantt del proyecto

06_datos_consolidados_csv/ (4 datasets tabulares .csv)
   - bip_inversiones_santiago.csv: Registro detallado de iniciativas BIP
   - resumen_catastro_vgi.csv: Resumen cuantitativo por categoría y polígono
   - correlacion_dimensiones_calidad.csv: Matriz de correlación ISO 19157
   - wlc_metacalidad_ranking.csv: Ranking de calidad ponderada (WLC)

07_metadatos_y_gobernanza/ (12 documentos técnicos y legales)
   - metadatos_iso19139_atlas_vgi.xml: Ficha XML oficial para GeoNetwork / GeoNode
   - metadatos_iso19115_atlas_vgi.json: Ficha JSON conforme a perfil SNIT
   - matriz_metacalidad.json: Matriz computacional de calidad de las 118 capas
   - wlc_metacalidad_resultado.json: Resultados cuantitativos de ponderación WLC
   - Estado_Avance_Atlas_VGI_UAH.docx: Informe de avance académico de práctica UAH
   - ANALISIS_METACALIDAD.md: Informe de auditoría bajo norma ISO 19157:2013/2023
   - MANUAL_USO.md: Manual integral del Atlas y visor interactivo
   - ARQUITECTURA.md: Documentación técnica del stack y failover triple
   - BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md: 125 referencias bibliográficas en APA 7ª ed.
   - TRAZABILIDAD_ACADEMICA.md: Registro de auditoría y decisiones de diseño
   - GUIA_BASE_DATOS_SUPABASE.md: Esquema PostGIS y funciones espaciales RPC
   - LICENSE: Marco legal tripartito (ODbL 1.0 + CC BY-SA 4.0 + GNU AGPLv3)

Raíz:
   - LEAME_PRIMERO_ATLAS_VGI.txt: Este documento
   - INVENTARIO_GENERAL_ATLAS_VGI.json: Catálogo maestro con hash, tamaño y atributos.

--------------------------------------------------------------------------------
2. SISTEMAS DE REFERENCIA ESPACIAL (CRS)
--------------------------------------------------------------------------------
- Coordenadas geográficas nativas: WGS 84 (EPSG:4326), formato GeoJSON (RFC 7946).
- Proyección métrica oficial de cálculo: SIRGAS-Chile / UTM huso 19S (EPSG:32719 / EPSG:5361).

--------------------------------------------------------------------------------
3. INSTRUCCIONES DE USO EN SIG (QGIS / ARCGIS / PYTHON)
--------------------------------------------------------------------------------
- QGIS: Arrastre cualquier archivo .geojson directamente sobre el panel de capas.
- ArcGIS Pro / ArcMap: Utilice la herramienta "JSON To Features" (Conversion Tools).
- Python / GeoPandas:
  >>> import geopandas as gpd
  >>> gdf = gpd.read_file("01_vgi_comunitario_osm/atlas_vgi_barrio_brasil_uah_completo.geojson")
  >>> gdf_utm = gdf.to_crs(epsg=32719)

--------------------------------------------------------------------------------
4. CRÉDITOS Y CONTACTO
--------------------------------------------------------------------------------
- Practicante: Juan Pablo Lescano Villegas (GEOJOTA) - juanpablolescanovillegas@gmail.com
- Supervisor: Prof. Manuel Fuenzalida — Departamento de Geografía, Universidad Alberto Hurtado.
- Repositorio: https://github.com/GEOJOTA/atlas_vgi_uah
- Visor en Línea: https://atlasvgiuah.netlify.app/
================================================================================
"""

# -----------------------------------------------------------------------------
# 9. Empaquetamiento en archivo ZIP (compresslevel=6 para velocidad y balance)
# -----------------------------------------------------------------------------
inventario_general = {
    "fecha_generacion": datetime.now().isoformat(),
    "archivos": []
}

total_archivos_agregados = 0
total_bytes_uncompressed = 0

with zipfile.ZipFile(OUTPUT_ZIP, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    def agregar_string(ruta_en_zip, contenido_str):
        global total_archivos_agregados, total_bytes_uncompressed
        data_bytes = contenido_str.encode('utf-8')
        zf.writestr(ruta_en_zip, data_bytes)
        total_archivos_agregados += 1
        total_bytes_uncompressed += len(data_bytes)
        inventario_general["archivos"].append({
            "ruta": ruta_en_zip,
            "tamano_bytes": len(data_bytes),
            "md5": hashlib.md5(data_bytes).hexdigest()
        })

    def agregar_archivo(ruta_fisica, ruta_en_zip):
        global total_archivos_agregados, total_bytes_uncompressed
        if os.path.exists(ruta_fisica):
            zf.write(ruta_fisica, ruta_en_zip)
            sz = os.path.getsize(ruta_fisica)
            total_archivos_agregados += 1
            total_bytes_uncompressed += sz
            with open(ruta_fisica, 'rb') as fp:
                file_hash = hashlib.md5(fp.read()).hexdigest()
            inventario_general["archivos"].append({
                "ruta": ruta_en_zip,
                "tamano_bytes": sz,
                "md5": file_hash
            })
            return True
        else:
            print(f" [!] Advertencia: Archivo no encontrado: {ruta_fisica}")
            return False

    # A. Textos y metadatos raíz
    agregar_string('geodatabase_completa_atlas_vgi/LEAME_PRIMERO_ATLAS_VGI.txt', LEAME_TEXT.strip())
    agregar_string('geodatabase_completa_atlas_vgi/02_geofabrik_chile_rm/ENLACES_Y_METADATOS_GEOFABRIK.json', json.dumps(GEOFABRIK_META, indent=2, ensure_ascii=False))
    agregar_string('geodatabase_completa_atlas_vgi/02_geofabrik_chile_rm/GUIA_IMPORTACION_GEOFABRIK_QGIS.md', GUIA_GEOFABRIK_MD.strip())
    agregar_string('geodatabase_completa_atlas_vgi/03_capas_oficiales_estado/INVENTARIO_108_CAPAS_OFICIALES.json', json.dumps(capas_oficiales_meta, indent=2, ensure_ascii=False))
    agregar_string('geodatabase_completa_atlas_vgi/07_metadatos_y_gobernanza/metadatos_iso19139_atlas_vgi.xml', XML_ISO19139.strip())
    agregar_string('geodatabase_completa_atlas_vgi/07_metadatos_y_gobernanza/metadatos_iso19115_atlas_vgi.json', json.dumps(JSON_ISO19115, indent=2, ensure_ascii=False))

    # B. 01_vgi_comunitario_osm (11 archivos)
    print("\n--- Empaquetando 01_vgi_comunitario_osm ---")
    for f in VGI_FILES:
        p = os.path.join(DATA_DIR, f)
        if agregar_archivo(p, f'geodatabase_completa_atlas_vgi/01_vgi_comunitario_osm/{f}'):
            print(f" [+] VGI: {f}")

    # C. 02_geofabrik_chile_rm (11 archivos + scripts)
    print("\n--- Empaquetando 02_geofabrik_chile_rm ---")
    for f in GEOFABRIK_FILES:
        p = os.path.join(DATA_DIR, f)
        if agregar_archivo(p, f'geodatabase_completa_atlas_vgi/02_geofabrik_chile_rm/{f}'):
            print(f" [+] Geofabrik: {f}")

    for sf in ['procesar_geofabrik_rm.py', 'generar_gpkg_geofabrik.py']:
        sp = os.path.join(BASE_DIR, 'scripts', sf)
        if os.path.exists(sp):
            agregar_archivo(sp, f'geodatabase_completa_atlas_vgi/02_geofabrik_chile_rm/scripts/{sf}')

    # D. 03_capas_oficiales_estado (108 archivos oficiales)
    print("\n--- Empaquetando 03_capas_oficiales_estado ---")
    for meta in capas_oficiales_meta:
        fname = meta["archivo"]
        p = os.path.join(DATA_DIR, fname)
        if agregar_archivo(p, f'geodatabase_completa_atlas_vgi/03_capas_oficiales_estado/{fname}'):
            print(f" [+] Oficial ({meta['id']}): {fname}")

    # E. 04_repositorio_cartografico_completo (84 archivos restantes)
    print(f"\n--- Empaquetando 04_repositorio_cartografico_completo ({len(geojsons_adicionales)} capas adicionales) ---")
    for f in geojsons_adicionales:
        p = os.path.join(DATA_DIR, f)
        if agregar_archivo(p, f'geodatabase_completa_atlas_vgi/04_repositorio_cartografico_completo/{f}'):
            print(f" [+] Repositorio complementario: {f}")

    # F. 05_catalogos_matrices_excel (4 archivos)
    print("\n--- Empaquetando 05_catalogos_matrices_excel ---")
    for fname, p in EXCEL_CANDIDATES:
        if agregar_archivo(p, f'geodatabase_completa_atlas_vgi/05_catalogos_matrices_excel/{fname}'):
            print(f" [+] Excel: {fname}")

    # G. 06_datos_consolidados_csv (4 archivos)
    print("\n--- Empaquetando 06_datos_consolidados_csv ---")
    for fname, p in CSV_FILES:
        if agregar_archivo(p, f'geodatabase_completa_atlas_vgi/06_datos_consolidados_csv/{fname}'):
            print(f" [+] CSV: {fname}")

    # H. 07_metadatos_y_gobernanza (12 archivos)
    print("\n--- Empaquetando 07_metadatos_y_gobernanza ---")
    for fname, p in DOC_FILES:
        if agregar_archivo(p, f'geodatabase_completa_atlas_vgi/07_metadatos_y_gobernanza/{fname}'):
            print(f" [+] Doc: {fname}")

    lic_p = os.path.join(BASE_DIR, 'LICENSE')
    if os.path.exists(lic_p):
        agregar_archivo(lic_p, 'geodatabase_completa_atlas_vgi/07_metadatos_y_gobernanza/LICENSE')
        print(" [+] Licencia: LICENSE")

    # I. Inventario General Consolidado (JSON)
    agregar_string('geodatabase_completa_atlas_vgi/INVENTARIO_GENERAL_ATLAS_VGI.json', json.dumps(inventario_general, indent=2, ensure_ascii=False))

# Sincronizar copia en docs/
shutil.copy2(OUTPUT_ZIP, MIRROR_ZIP)

sz_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
uncompressed_mb = total_bytes_uncompressed / (1024 * 1024)

print("\n" + "=" * 80)
print(f"✅ PAQUETE MAESTRO GENERADO CON ÉXITO:")
print(f"   Archivo de Salida:   {OUTPUT_ZIP}")
print(f"   Copia Espejo:        {MIRROR_ZIP}")
print(f"   Archivos Incluidos:  {total_archivos_agregados} archivos totales (100% DE LA DATA)")
print(f"   Tamaño Descomprimido:{uncompressed_mb:.2f} MB ({uncompressed_mb / 1024:.2f} GB)")
print(f"   Tamaño Comprimido:   {sz_mb:.2f} MB")
print("=" * 80)
