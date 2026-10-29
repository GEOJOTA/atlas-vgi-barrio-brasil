#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/construir_manual_actualizacion_maestro.py
------------------------------------------------
Genera y sincroniza el MANUAL_ACTUALIZACION_ATLAS.md monumental (>= 5000 líneas)
para el Atlas de Información Geográfica Voluntaria (VGI) para la Gestión Territorial.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = [
    os.path.join(BASE_DIR, "MANUAL_ACTUALIZACION_ATLAS.md"),
    os.path.join(BASE_DIR, "docs", "MANUAL_ACTUALIZACION_ATLAS.md"),
    os.path.join(BASE_DIR, "src", "docs", "MANUAL_ACTUALIZACION_ATLAS.md")
]

print("[*] Iniciando construcción del Manual de Actualización Técnica y Operativa Maestro (>= 5000 líneas)...")

# 1. Importar las 8 partes modulares especializadas
sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
try:
    from manual_p01_genesis_metodologia import PARTE_01
    from manual_p02_ingenieria_datos import PARTE_02
    from manual_p03_modelos_calidad_metadatos import PARTE_03
    from manual_p04_frontend_cartografia import PARTE_04
    from manual_p05_personalizacion_gui import PARTE_05
    from manual_p06_backend_operaciones import PARTE_06
    from manual_p07_soporte_bibliografia import PARTE_07
    from manual_p08_tutorial_personalizacion import PARTE_08
except ImportError as e:
    print(f"[-] Error al importar módulos de partes del manual: {e}")
    sys.exit(1)

# 2. Concatenación secuencial de las 8 partes
partes = [
    PARTE_01.strip(),
    PARTE_02.strip(),
    PARTE_03.strip(),
    PARTE_04.strip(),
    PARTE_05.strip(),
    PARTE_06.strip(),
    PARTE_07.strip(),
    PARTE_08.strip()
]


INDICE_GENERAL = r"""# ATLAS DE INFORMACIÓN GEOGRÁFICA VOLUNTARIA (VGI) PARA LA GESTIÓN TERRITORIAL
## Manual Maestro de Actualización Técnica, Transferibilidad Metodológica y Arquitectura Operativa

---

## Índice General de Contenidos

### [PARTE I: ALCANCE OPERATIVO, FORMULACIÓN ESTRATÉGICA Y PERFILES TERRITORIALES](#parte-i-alcance-operativo-formulación-estratégica-y-perfiles-territoriales)
* [1. Identificación y Alcance Operativo del Proyecto](#1-identificación-y-alcance-operativo-del-proyecto)
  * [1.1. Propósito y Misión Operativa](#11-propósito-y-misión-operativa)
  * [1.2. Delimitación Geodésica y Cobertura Territorial](#12-delimitación-geodésica-y-cobertura-territorial)
* [2. Formulación Estratégica: Objetivos del Plan de Trabajo](#2-formulación-estratégica-objetivos-del-plan-de-trabajo)
  * [2.1. Objetivo General del Proyecto](#21-objetivo-general-del-proyecto)
  * [2.2. Objetivos Específicos y Metas Operativas (OE 1 a OE 4)](#22-objetivos-específicos-y-metas-operativas)
* [3. Matriz de Cumplimiento de los 10 Hitos del Plan de Trabajo](#3-matriz-de-cumplimiento-de-los-10-hitos-del-plan-de-trabajo)
* [4. Los Cuatro Perfiles de Actores Territoriales](#4-los-cuatro-perfiles-de-actores-territoriales-alineación-con-plataforma-web-en-vivo)
  * [4.1. Perfil 1: Autoridades / Instituciones (IDE / Municipio)](#41-perfil-1-autoridades--instituciones-ide--municipio-institucion)
  * [4.2. Perfil 2: Organizaciones Comunitarias / Vecinos](#42-perfil-2-organizaciones-comunitarias--vecinos-comunidad)
  * [4.3. Perfil 3: Mapeadores / Voluntarios OSM](#43-perfil-3-mapeadores--voluntarios-osm-voluntario)
  * [4.4. Perfil 4: ONGs / Territoriales](#44-perfil-4-ongs--territoriales-ong)
* [5. Fundamentos Epistemológicos: De los SIG Tradicionales a la Ciencia Ciudadana y VGI](#5-fundamentos-epistemológicos-de-los-sig-tradicionales-a-la-ciencia-ciudadana-y-vgi)

### [PARTE II: INGENIERÍA DE DATOS, PIPELINES DE EXTRACCIÓN Y NORMALIZACIÓN CARTOGRÁFICA](#parte-ii-ingeniería-de-datos-pipelines-de-extracción-y-normalización-cartográfica)
* [6. Arquitectura y Taxonomía de las 10 Macrocategorías Comunitarias VGI (CAT-01 a CAT-10)](#6-arquitectura-y-taxonomía-de-las-10-macrocategorías-comunitarias-vgi)
* [7. Pipeline de Extracción con Overpass API y Overpass QL](#7-pipeline-de-extracción-con-overpass-api-y-overpass-ql)
  * [7.1. Arquitectura de las Consultas Overpass QL](#71-arquitectura-de-las-consultas-overpass-ql)
  * [7.2. Mecanismo de Rotación de Servidores Espejo (Round-Robin Failover)](#72-mecanismo-de-rotación-de-servidores-espejo-round-robin-failover)
* [8. Auditoría Histórica y Análisis Espacio-Temporal con ohsome API v1/v2 (HeiGIT)](#8-auditoría-histórica-y-análisis-espacio-temporal-con-ohsome-api-v1v2-heigit)
* [9. Integración de Biodiversidad y Ciencia Ciudadana con GBIF y Darwin Core](#9-integración-de-biodiversidad-y-ciencia-ciudadana-con-gbif-y-darwin-core)
* [10. Integración de Cartografía Externa con uMap e iframes Aislados](#10-integración-de-cartografía-externa-con-umap-e-iframes-aislados)
* [11. Extractos Masivos Regionales de Geofabrik RM y Generación de GeoPackage OGC](#11-extractos-masivos-regionales-de-geofabrik-rm-y-generación-de-geopackage-ogc)
* [12. Ingesta, Normalización y Homologación de las 122 Capas Oficiales del Estado de Chile](#12-ingesta-normalización-y-homologación-de-las-122-capas-oficiales-del-estado-de-chile)
* [13. Catálogo Exhaustivo Detallado de las 132 Capas Cartográficas](#13-catálogo-exhaustivo-detallado-de-las-132-capas-cartográficas)
* [14. El Esquema Maestro Obligatorio de 14 Atributos ISO por Entidad Geográfica](#14-el-esquema-maestro-obligatorio-de-14-atributos-iso-por-entidad-geográfica)

### [PARTE III: MODELAMIENTO MATEMÁTICO DE CALIDAD, METADATOS Y ESTÁNDARES INTERNACIONALES](#parte-iii-modelamiento-matemático-de-calidad-metadatos-y-estándares-internacionales)
* [15. Modelo de MetaCalidad WLC v2.0 (ISO 19157:2013 / ISO 19157-1:2023)](#15-modelo-de-metacalidad-wlc-v20-iso-191572013--iso-19157-12023)
  * [15.1. Formulación Matemática Canónica (Pilares Cuantitativo y Cualitativo)](#151-formulación-matemática-canónica)
  * [15.2. Desglose Algorítmico y Fórmulas de las 10 Dimensiones de Calidad](#152-desglose-algorítmico-y-fórmulas-de-las-10-dimensiones-de-calidad)
  * [15.3. Rangos y Certificación Formal de Calidad](#153-rangos-y-certificación-formal-de-calidad)
* [16. Correlaciones Estadísticas, Sensibilidad y Ranking de Metacalidad](#16-correlaciones-estadísticas-sensibilidad-y-ranking-de-metacalidad)
* [17. Perfil de Metadatos ISO 19115-1:2014 / IDE Chile v2.0](#17-perfil-de-metadatos-iso-19115-12014--ide-chile-v20)
* [18. Especificación Técnica de Exportación XML ISO 19139:2007 (gmd:MD_Metadata)](#18-especificación-técnica-de-exportación-xml-iso-191392007-gmdmdmetadata)
* [19. Diccionario Territorial Interactivo: Los 140 Descriptores Normativos y Etiquetas OSM](#19-diccionario-territorial-interactivo-los-140-descriptores-normativos-y-etiquetas-osm)

### [PARTE IV: INGENIERÍA DE SOFTWARE, FRONTEND Y VISUALIZACIÓN INTERACTIVA](#parte-iv-ingeniería-de-software-frontend-y-visualización-interactiva)
* [20. Arquitectura de Software Frontend: Zero-Build Vanilla JavaScript SPA](#20-arquitectura-de-software-frontend-zero-build-vanilla-javascript-spa)
* [21. El Motor Cartográfico Leaflet 1.9.4, Reproyección Geodésica y Comparador Swipe/Lupa](#21-el-motor-cartográfico-leaflet-194-reproyección-geodésica-y-comparador-swipelupa)
* [22. Inspector Normativo del Plan Regulador Comunal (PRC) y Algoritmo Point-in-Polygon](#22-inspector-normativo-del-plan-regulador-comunal-prc-y-algoritmo-point-in-polygon)
* [23. Calculador de Isócronas de Accesibilidad Peatonal y Modelo de Ciudad de 15 Minutos](#23-calculador-de-isócronas-de-accesibilidad-peatonal-y-modelo-de-ciudad-de-15-minutos)
* [24. Los 4 Storyboards Cartográficos Interactivos de Síntesis Territorial (75 Cartografías)](#24-los-4-storyboards-cartográficos-interactivos-de-síntesis-territorial)
* [25. Los 4 Libros Maestros en Formato Excel OpenXML (.xlsx) y su Réplica CSV](#25-los-4-libros-maestros-en-formato-excel-openxml-xlsx-y-su-réplica-csv)
* [26. Desglose Técnico de los 10 Módulos de la Plataforma Web (01 a 10)](#26-desglose-técnico-de-los-10-módulos-de-la-plataforma-web-01-a-10)
* [27. Guía de Modificación del Frontend (HTML5 / CSS3 / JS ES6+)](#27-guía-de-modificación-del-frontend-html5--css3--js-es6)

### [PARTE V: PERSONALIZACIÓN VISUAL, ESTILOS, PUNTEROS Y CONFIGURACIÓN PERIMETRAL](#parte-v-personalización-visual-estilos-punteros-y-configuración-perimetral)
* [28. Guía Exhaustiva de Modificación y Operación de Netlify (`netlify.toml`)](#28-guía-exhaustiva-de-modificación-y-operación-de-netlify)
* [29. Guía Exhaustiva de Estilos CSS, Variables Semánticas `:root`, Temas y Accesibilidad](#29-guía-exhaustiva-de-estilos-css-variables-semánticas-root-temas-y-accesibilidad)
* [30. Guía Exhaustiva de Punteros, Cursores, Marcadores SVG y Geometrías Vectoriales](#30-guía-exhaustiva-de-punteros-cursores-marcadores-svg-y-geometrías-vectoriales)

### [PARTE VI: ARQUITECTURA DE DATOS POSTGIS, CATÁLOGO MULTI-LENGUAJE Y AUTOMATIZACIÓN](#parte-vi-arquitectura-de-datos-postgis-backend-y-pipeline-de-automatización)
* [31. Infraestructura de Almacenamiento Espacial: PostgreSQL 17 + PostGIS 3.3 en Supabase Cloud](#31-infraestructura-de-almacenamiento-espacial-postgresql-17--postgis-33-en-supabase-cloud)
* [32. Catálogo Estandarizado Multi-Lenguaje de Componentes, Archivos y Scripts de la Plataforma Web](#32-catálogo-estandarizado-multi-lenguaje-de-componentes-archivos-y-scripts-de-la-plataforma-web)
  * [32.1. Lenguaje de Marcado y Maquetación Estructural (HTML5 Semántico / WCAG 2.1 AAA)](#321-lenguaje-de-marcado-y-maquetación-estructural-html5-semántico--wcag-21-aaa)
  * [32.2. Lenguaje de Estilización y Sistema de Diseño Visual (CSS3 Nativo)](#322-lenguaje-de-estilización-y-sistema-de-diseño-visual-css3-nativo)
  * [32.3. Lenguaje de Programación Cliente y Motor Cartográfico (JavaScript ES6+ Modular IIFE)](#323-lenguaje-de-programación-cliente-y-motor-cartográfico-javascript-es6-modular-iife)
  * [32.4. Lenguajes de Base de Datos Espacial y Consultas (SQL / PL/pgSQL PostGIS y Overpass QL)](#324-lenguajes-de-base-de-datos-espacial-y-consultas-sql--plpgsql-postgis-y-overpass-ql)
  * [32.5. Lenguajes de Configuración, Manifiestos e Intercambio de Datos (JSON, GeoJSON, TOML y XML)](#325-lenguajes-de-configuración-manifiestos-e-intercambio-de-datos-json-geojson-rfc-7946-toml-y-xml)
  * [32.6. Lenguaje de Automatización Backend, ETL Geoespacial y Auditoría (Python 3)](#326-lenguaje-de-automatización-backend-etl-geoespacial-y-auditoría-python-3)
* [33. Pipeline de Empaquetado Masivo (`empaquetar_base_datos_completa.py`)](#33-pipeline-de-empaquetado-masivo-empaquetar_base_datos_completapy)
* [34. Protocolo de Integridad Pre-Despliegue (`scripts/verificar_integridad_despliegue.py`)](#34-protocolo-de-integridad-pre-despliegue-scriptsverificar_integridad_desplieguepy)

### [PARTE VII: OPERACIONES DE DESPLIEGUE, TROUBLESHOOTING, GLOSARIO Y MARCO TEÓRICO](#parte-vii-operaciones-de-despliegue-troubleshooting-glosario-y-marco-teórico)
* [35. Flujo de Trabajo en Git, Git LFS y Ciclo CI/CD en Netlify](#35-flujo-de-trabajo-en-git-git-lfs-y-ciclo-cicd-en-netlify)
* [36. Matriz de Troubleshooting y Resolución Técnica de Incidentes (15 Casos Críticos)](#36-matriz-de-troubleshooting-y-resolución-técnica-de-incidentes-15-casos-críticos)
* [37. Glosario Técnico Extendido (52 Términos Esenciales del Ecosistema VGI)](#37-glosario-técnico-extendido-52-términos-esenciales-del-ecosistema-vgi)
* [38. Marco Jurídico, Licencias y Propiedad Intelectual Territorial](#38-marco-jurídico-licencias-y-propiedad-intelectual-territorial)
* [39. Aparato Bibliográfico Consolidado — 125 Referencias en Formato APA 7ª Edición](#39-aparato-bibliográfico-consolidado--125-referencias-en-formato-apa-7ª-edición)

### [PARTE VIII: GUÍA MAESTRA DE MODIFICACIÓN DETALLE A DETALLE (COOKBOOK OPERATIVO)](#parte-viii-guía-maestra-de-modificación-detalle-a-detalle-cookbook-operativo)
* [40. Tutorial 01: Modificación de la Paleta Cromática y Variables `:root` en CSS](#40-tutorial-01-modificación-de-la-paleta-cromática-y-variables-root-en-css)
* [41. Tutorial 02: Personalización de Punteros y Cursores del Ratón](#41-tutorial-02-personalización-de-punteros-y-cursores-del-ratón)
* [42. Tutorial 03: Creación y Modificación de Marcadores SVG (`L.divIcon`)](#42-tutorial-03-creación-y-modificación-de-marcadores-svg-ldivicon)
* [43. Tutorial 04: Incorporación de Nuevos Mapas Base (TileLayers)](#43-tutorial-04-incorporación-de-nuevos-mapas-base-tilelayers)
* [44. Tutorial 05: Incorporación de una Nueva Capa GeoJSON al Atlas](#44-tutorial-05-incorporación-de-una-nueva-capa-geojson-al-atlas)
* [45. Tutorial 06: Creación de Nuevas Consultas Overpass QL](#45-tutorial-06-creación-de-nuevas-consultas-overpass-ql-en-el-módulo-02)
* [46. Tutorial 07: Diseño y Publicación de un Nuevo Storyboard Cartográfico](#46-tutorial-07-diseño-y-publicación-de-un-nuevo-storyboard-cartográfico)
* [47. Tutorial 08: Modificación de Ponderadores del Modelo WLC ISO 19157](#47-tutorial-08-modificación-de-ponderadores-del-modelo-wlc-iso-19157)
* [48. Tutorial 09: Actualización de la Zonificación del PRC de Santiago](#48-tutorial-09-actualización-de-la-zonificación-del-prc-de-santiago)
* [49. Tutorial 10: Configuración Perimetral Avanzada en `netlify.toml`](#49-tutorial-10-configuración-perimetral-avanzada-en-netlifytoml)
* [51. Tutorial 12: Incorporación de Nuevas Reglas de Validación en Pre-Despliegue](#51-tutorial-12-incorporación-de-nuevas-reglas-de-validación-en-pre-despliegue)
* [52. Tutorial 13: Sistema de Notificaciones Táctiles (Toast Notifications)](#52-tutorial-13-sistema-de-notificaciones-táctiles-toast-notifications)
* [53. Tutorial 14: Integración de Geoservicios WMS/WFS Oficiales del Estado de Chile](#53-tutorial-14-integración-de-geoservicios-wmswfs-oficiales-del-estado-de-chile)
* [54. Tutorial 15: Exportación Dinámica de Datos en Formatos GeoJSON, CSV y KML](#54-tutorial-15-exportación-dinámica-de-datos-en-formatos-geojson-csv-y-kml)
* [55. Tutorial 16: Protocolo de Auditoría de Accesibilidad Web (WCAG 2.1 Nivel AAA)](#55-tutorial-16-protocolo-de-auditoría-de-accesibilidad-web-wcag-21-nivel-aaa)
* [56. Tutorial 17: Pipeline de Reempaquetado y Despliegue en Producción](#56-tutorial-17-pipeline-de-reempaquetado-y-despliegue-en-producción)

---
"""

contenido_final = INDICE_GENERAL.strip() + "\n\n---\n\n" + "\n\n---\n\n".join(partes) + "\n"

# 3. Auditoría estricta de palabras prohibidas (Zero-Leak y coherencia conceptual)
forbidden_matches = 0
for lnum, line in enumerate(contenido_final.splitlines(), start=1):
    low = line.lower()
    terminos_prohibidos = [
        "fon" + "decyt",
        "f126" + "1256",
        "f-126" + "1256",
        "empíric",
        "empiric",
        "forense",
        "práctica profesional",
        "practica profesional",
        "práctica%20profesional",
        "departamento de geografía",
    ]
    if any(t in low for t in terminos_prohibidos):
        print(f"[-] ERROR: Mención no autorizada detectada en línea {lnum}: {line.strip()}")
        forbidden_matches += 1

if forbidden_matches > 0:
    print(f"[-] Fallo de validación: {forbidden_matches} referencias no autorizadas encontradas. Abortando.")
    sys.exit(1)

print("[✓] Auditoría de sanitización institucional aprobada: 0 menciones prohibidas detectadas.")

# 4. Conteo estricto de líneas (debe ser >= 5000)
lineas_totales = len(contenido_final.splitlines())
print(f"[*] Conteo de líneas del documento generado: {lineas_totales} líneas.")

UMBRAL_MINIMO = 5000
if lineas_totales < UMBRAL_MINIMO:
    print(f"[-] ERROR: El documento contiene {lineas_totales} líneas, por debajo del umbral mínimo de {UMBRAL_MINIMO} líneas.")
    sys.exit(1)

print(f"[✓] Validación de longitud superada: {lineas_totales} >= {UMBRAL_MINIMO} líneas.")

# 5. Escribir en los tres destinos oficiales
for target in TARGETS:
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w", encoding="utf-8") as f:
        f.write(contenido_final)
    print(f"[✓] Manual sincronizado en: {target}")

print(f"\n[✓✓✓] MANUAL_ACTUALIZACION_ATLAS.md generado exitosamente con {lineas_totales} líneas.")
