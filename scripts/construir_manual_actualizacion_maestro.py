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


INDICE_GENERAL = r"""# ATLAS PARA LA GESTIÓN TERRITORIAL
## Manual Maestro de Actualización Técnica, Transferibilidad Metodológica y Arquitectura Operativa
### Análisis y Exploración | Municipio de Santiago y Barrio Brasil

---

## Índice General de Contenidos

### [PARTE I: ALCANCE OPERATIVO, FORMULACIÓN ESTRATÉGICA Y PERFILES TERRITORIALES](#parte-i-alcance-operativo-formulación-estratégica-y-perfiles-territoriales)
* [1. Identificación y Alcance Operativo del Proyecto](#1-identificación-y-alcance-operativo-del-proyecto)
  * [1.1. Propósito y Misión Operativa](#11-propósito-y-misión-operativa)
* [2. Delimitación Geodésica y Cobertura Territorial del Área de Estudio](#2-delimitación-geodésica-y-cobertura-territorial-del-área-de-estudio)
* [3. Formulación Estratégica: Objetivos del Proyecto](#3-formulación-estratégica-objetivos-del-proyecto)
  * [3.1. Objetivo General](#31-objetivo-general)
  * [3.2. Objetivos Específicos (OE 1 a OE 4)](#32-objetivos-específicos)
* [4. Matriz de Cumplimiento de los 10 Hitos del Proyecto](#4-matriz-de-cumplimiento-de-los-10-hitos-del-proyecto)
* [5. Los Cuatro Perfiles de Actores Territoriales (Alineación con Plataforma Web en Vivo)](#5-los-cuatro-perfiles-de-actores-territoriales-alineación-con-plataforma-web-en-vivo)
  * [5.1. Perfil 1: Autoridades / Instituciones (IDE / Municipio)](#51-perfil-1-autoridades--instituciones-ide--municipio-institucion)
  * [5.2. Perfil 2: Organizaciones Comunitarias / Vecinos](#52-perfil-2-organizaciones-comunitarias--vecinos-comunidad)
  * [5.3. Perfil 3: Mapeadores / Voluntarios OSM](#53-perfil-3-mapeadores--voluntarios-osm-voluntario)
  * [5.4. Perfil 4: ONGs / Territoriales](#54-perfil-4-ongs--territoriales-ong)

### [PARTE II: INGENIERÍA DE DATOS, PIPELINES DE EXTRACCIÓN Y NORMALIZACIÓN CARTOGRÁFICA](#parte-ii-ingeniería-de-datos-pipelines-de-extracción-y-normalización-cartográfica)
* [6. Arquitectura y Taxonomía de las 10 Macrocategorías Comunitarias VGI](#6-arquitectura-y-taxonomía-de-las-10-macrocategorías-comunitarias-vgi)
* [7. Pipeline de Extracción con Overpass API y Overpass QL](#7-pipeline-de-extracción-con-overpass-api-y-overpass-ql)
  * [7.1. Arquitectura de las Consultas Overpass QL](#71-arquitectura-de-las-consultas-overpass-ql)
  * [7.2. Mecanismo de Rotación de Servidores Espejo (Round-Robin Failover)](#72-mecanismo-de-rotación-de-servidores-espejo-round-robin-failover)
* [8. Auditoría Histórica y Análisis Espacio-Temporal con ohsome API v1/v2 (HeiGIT)](#8-auditoría-histórica-y-análisis-espacio-temporal-con-ohsome-api-v1v2-heigit)
* [9. Integración de Biodiversidad y Ciencia Ciudadana con GBIF y Darwin Core](#9-integración-de-biodiversidad-y-ciencia-ciudadana-con-gbif-y-darwin-core)
* [10. Integración de Cartografía Externa con uMap e iframes Aislados](#10-integración-de-cartografía-externa-con-umap-e-iframes-aislados)
* [11. Extractos Masivos Regionales de Geofabrik RM y Generación de GeoPackage OGC](#11-extractos-masivos-regionales-de-geofabrik-rm-y-generación-de-geopackage-ogc)
* [12. Ingesta, Normalización y Homologación de las 124 Capas Oficiales del Estado de Chile](#12-ingesta-normalización-y-homologación-de-las-124-capas-oficiales-del-estado-de-chile)
* [13. Catálogo Exhaustivo Detallado de las 134 Capas Cartográficas](#13-catálogo-exhaustivo-detallado-de-las-134-capas-cartográficas)
* [14. El Esquema Maestro Obligatorio de 14 Atributos ISO por Entidad Geográfica](#14-el-esquema-maestro-obligatorio-de-14-atributos-iso-por-entidad-geográfica)

### [PARTE III: MODELAMIENTO MATEMÁTICO DE CALIDAD, METADATOS Y ESTÁNDARES INTERNACIONALES](#parte-iii-modelamiento-matemático-de-calidad-metadatos-y-estándares-internacionales)
* [15. Modelo Cuantitativo de Calidad Espacial ISO 19157 (Weighted Linear Combination - WLC v2.0)](#15-modelo-cuantitativo-de-calidad-espacial-iso-19157-weighted-linear-combination---wlc-v20)
  * [15.1. Formulación Matemática Canónica (Pilares Cuantitativo y Cualitativo)](#151-formulación-matemática-canónica)
  * [15.2. Desglose Algorítmico y Fórmulas de las 10 Dimensiones de Calidad](#152-desglose-algorítmico-y-fórmulas-de-las-10-dimensiones-de-calidad)
  * [15.3. Rangos y Certificación Formal de Calidad](#153-rangos-y-certificación-formal-de-calidad)
* [16. Correlaciones Estadísticas, Sensibilidad y Ranking de Metacalidad](#16-correlaciones-estadísticas-sensibilidad-y-ranking-de-metacalidad)
* [17. Perfil de Metadatos Espaciales ISO 19115-1:2014 e Implementación XML ISO 19139:2007](#17-perfil-de-metadatos-espaciales-iso-19115-12014-e-implementación-xml-iso-191392007)
* [18. Catálogos Maestros OpenXML (.xlsx) y Archivos Consolidados CSV](#18-catálogos-maestros-openxml-xlsx-y-archivos-consolidados-csv)
* [19. Diccionario Territorial Interactivo: Los 140 Descriptores Normativos y Etiquetas OSM](#19-diccionario-territorial-interactivo-los-140-descriptores-normativos-y-etiquetas-osm)

### [PARTE IV: INGENIERÍA DE SOFTWARE, FRONTEND Y VISUALIZACIÓN INTERACTIVA](#parte-iv-ingeniería-de-software-frontend-y-visualización-interactiva)
* [20. Arquitectura Frontend de la SPA: Zero-Build Vanilla JavaScript y Patrón IIFE](#20-arquitectura-frontend-de-la-spa-zero-build-vanilla-javascript-y-patrón-iife)
* [21. Motor Cartográfico: Leaflet 1.9.4, Renderizado y Simbología Dinámica](#21-motor-cartográfico-leaflet-194-renderizado-y-simbología-dinámica)
* [22. Inspector Normativo del Plan Regulador Comunal de Santiago (CIN-VGI)](#22-inspector-normativo-del-plan-regulador-comunal-de-santiago-cin-vgi)
* [23. Los Cuatro Storyboards Territoriales y las 83 Cartografías Temáticas](#23-los-cuatro-storyboards-territoriales-y-las-83-cartografías-temáticas)
* [24. Visor Lightbox Pop-Up HD Multi-Dispositivo y Galería Multimedia](#24-visor-lightbox-pop-up-hd-multi-dispositivo-y-galería-multimedia)
* [25. Topografía Integral del Repositorio y Anatomía de Archivos](#25-topografía-integral-del-repositorio-y-anatomía-de-archivos)
* [26. Desglose de los 10 Módulos del Sistema (01 al 10) en Coherencia con la Plataforma Web](#26-desglose-de-los-10-módulos-del-sistema-01-al-10-en-coherencia-con-la-plataforma-web)
* [27. Guía Paso a Paso para Agregar un Nuevo Módulo a la Plataforma](#27-guía-paso-a-paso-para-agregar-un-nuevo-módulo-a-la-plataforma)

### [PARTE V: PERSONALIZACIÓN VISUAL, ESTILOS, PUNTEROS Y CONFIGURACIÓN PERIMETRAL](#parte-v-personalización-visual-estilos-punteros-y-configuración-perimetral)
* [28. Guía Exhaustiva de Modificación y Operación de Netlify](#28-guía-exhaustiva-de-modificación-y-operación-de-netlify)
* [29. Guía Exhaustiva de Estilos CSS, Variables Semánticas `:root`, Temas y Accesibilidad](#29-guía-exhaustiva-de-estilos-css-variables-semánticas-root-temas-y-accesibilidad)
* [30. Guía Exhaustiva de Punteros, Cursores, Marcadores SVG y Geometrías Vectoriales](#30-guía-exhaustiva-de-punteros-cursores-marcadores-svg-y-geometrías-vectoriales)

### [PARTE VI: ARQUITECTURA DE DATOS POSTGIS, CATÁLOGO MULTI-LENGUAJE Y AUTOMATIZACIÓN](#parte-vi-arquitectura-de-datos-postgis-backend-y-pipeline-de-automatización)
* [31. Infraestructura de Almacenamiento Espacial: PostgreSQL 17 + PostGIS 3.3 en Supabase Cloud](#31-infraestructura-de-almacenamiento-espacial-postgresql-17--postgis-33-en-supabase-cloud)
* [32. Catálogo Estandarizado Multi-Lenguaje de Componentes, Archivos y Scripts de la Plataforma Web](#32-catálogo-estandarizado-multi-lenguaje-de-componentes-archivos-y-scripts-de-la-plataforma-web)
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
* [45. Tutorial 06: Creación de Nuevas Consultas Overpass QL en el Módulo 02](#45-tutorial-06-creación-de-nuevas-consultas-overpass-ql-en-el-módulo-02)
* [46. Tutorial 07: Diseño y Publicación de un Nuevo Storyboard Cartográfico](#46-tutorial-07-diseño-y-publicación-de-un-nuevo-storyboard-cartográfico)
* [47. Tutorial 08: Modificación de Ponderadores del Modelo WLC ISO 19157](#47-tutorial-08-modificación-de-ponderadores-del-modelo-wlc-iso-19157)
* [48. Tutorial 09: Actualización de la Zonificación del PRC de Santiago](#48-tutorial-09-actualización-de-la-zonificación-del-prc-de-santiago)
* [49. Tutorial 10: Configuración Perimetral Avanzada en `netlify.toml`](#49-tutorial-10-configuración-perimetral-avanzada-en-netlifytoml)
* [50. Tutorial 11: Incorporación de Nuevas Reglas de Validación en Pre-Despliegue](#50-tutorial-11-incorporación-de-nuevas-reglas-de-validación-en-pre-despliegue)
* [51. Tutorial 12: Sistema de Notificaciones Táctiles (Toast Notifications)](#51-tutorial-12-sistema-de-notificaciones-táctiles-toast-notifications)
* [52. Tutorial 13: Integración de Geoservicios WMS/WFS Oficiales del Estado de Chile](#52-tutorial-13-integración-de-geoservicios-wmswfs-oficiales-del-estado-de-chile)
* [53. Tutorial 14: Exportación Dinámica de Datos en Formatos GeoJSON, CSV y KML](#53-tutorial-14-exportación-dinámica-de-datos-en-formatos-geojson-csv-y-kml)
* [54. Tutorial 15: Protocolo de Auditoría de Accesibilidad Web (WCAG 2.1 AA General / AAA Tipográfico)](#54-tutorial-15-protocolo-de-auditoría-de-accesibilidad-web-wcag-21-aa-general--aaa-tipográfico)
* [55. Tutorial 16: Pipeline de Reempaquetado y Despliegue en Producción](#55-tutorial-16-pipeline-de-reempaquetado-y-despliegue-en-producción)

---
"""

from normalizador_editorial_docs import normalizar_documento_markdown

contenido_final = INDICE_GENERAL.strip() + "\n\n---\n\n" + "\n\n---\n\n".join(partes) + "\n"
contenido_final = normalizar_documento_markdown(contenido_final, actualizar_toc_manual=True)

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
