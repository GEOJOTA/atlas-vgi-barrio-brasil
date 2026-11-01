# -*- coding: utf-8 -*-
"""
scripts/secciones_manual.py
Módulos de contenido para el Manual de Actualización Técnica y Operativa.
"""

SECCION_01 = """# Manual de Actualización Técnica, Operativa y Arquitectura del Atlas VGI

**Departamento de Geografía · Universidad Alberto Hurtado (2026)**  
**Proyecto:** Atlas de Información Geográfica Voluntaria para la Gestión Territorial — Nodo GeoAbierto  
**Autoría Técnica:** Juan Pablo Lescano Villegas (GEOJOTA)  
**Estándares:** ISO 19115-1:2014, ISO 19139:2007, ISO 19157:2013/2023, ISO 19110:2016, IDE Chile / SNIT  
**Licenciamiento:** ODbL 1.0 (Datos OSM) · CC BY-SA 4.0 (Cartografía y Documentos) · GNU AGPLv3 (Software)  
**URL de Producción Oficial:** [https://atlasvgiuah.netlify.app](https://atlasvgiuah.netlify.app)  
**Repositorio Oficial:** [https://github.com/GEOJOTA/atlas_vgi_uah](https://github.com/GEOJOTA/atlas_vgi_uah)

---

## 1. Identificación Institucional, Alcance y Principios de Diseño

### 1.1. Propósito y Filosofía del Manual
El presente documento constituye la **guía maestra de referencia técnica, operativa y de ingeniería de software** para el mantenimiento, actualización, refactorización y escalamiento del *Atlas de Información Geográfica Voluntaria para la Gestión Territorial*. Su diseño está orientado a proveer instrucciones deterministas, exhaustivas y desprovistas de ambigüedad para que cualquier desarrollador, investigador, analista SIG o administrador de sistemas pueda intervenir cada componente del proyecto, desde la configuración de servidores perimetrales en Netlify hasta la modificación de un puntero de ratón, un token de color CSS o la estructura interna de una consulta espacial en PostgreSQL/PostGIS.

El Atlas VGI fue concebido bajo el principio de **soberanía tecnológica y reproducibilidad científica**, articulando fuentes de datos geográficos colaborativos (OpenStreetMap, GBIF, uMap) con la cartografía oficial del Estado de Chile (IDE Chile, INE Censo 2024, MINVU, SUBDERE, UOCT, SUBTEL, MIDESO, SEC, CONAF, CIREN, MOP e IGM).

### 1.2. Principios Rectores de la Arquitectura
1. **Costo de Operación Cero Permanente ($0 USD/mes):** El sistema opera íntegramente sobre infraestructura sin costos recurrentes (Netlify Starter CDN, GitHub Free con Git LFS, Supabase Cloud Free Tier y consumo de APIs públicas abiertas con caché local). Toda modificación debe preservar esta restricción presupuestaria.
2. **Arquitectura Client-Side First:** La lógica de procesamiento cartográfico, filtrado de capas, cálculo de métricas de calidad y renderizado de storyboards se ejecuta en el navegador del usuario final mediante JavaScript ES6+ Vanilla. Esto garantiza que la plataforma escale a miles de usuarios concurrentes sin degradación de rendimiento ni saturación de servidores dedicados.
3. **Resiliencia y Triple Failover Espacial:** Ninguna capa cartográfica ni módulo funcional depende de un único punto de fallo (SPOF). Si la base de datos remota en Supabase PostGIS no responde o se agota su cuota de red, el sistema conmuta automáticamente al almacenamiento perimetral (CDN Storage) y, en última instancia, al repositorio local estático (`src/data/`), asegurando una disponibilidad de servicio del 99.9%.
4. **Desacoplamiento Estricto:** La interfaz gráfica (HTML5/CSS3), la capa lógica de módulos (JS IIFE), los catálogos normativos (OpenXML/CSV) y las fuentes vectoriales (GeoJSON/PostGIS) se encuentran estrictamente desacoplados. Es posible actualizar el 100% de los datos vectoriales sin tocar una sola línea de código fuente visual.
5. **Alineamiento con Estándares Internacionales ISO:** Toda entidad geográfica manipulada o incorporada debe ajustarse a las normas ISO 19115 (Metadatos geográficos), ISO 19139 (Esquema de implementación XML) e ISO 19157 (Calidad de la información geográfica), asegurando la interoperabilidad con la Infraestructura de Datos Geoespaciales de Chile (SNIT) y catálogos de metadatos tipo GeoNetwork.

### 1.3. Matriz de Roles y Responsabilidades Técnicas
* **Administrador del Repositorio:** Gestión de ramas (`main`), control de accesos, aprobación de pull requests y monitoreo de la cuota de ancho de banda en Git LFS.
* **Ingeniero Frontend / Web GIS:** Mantenimiento de la SPA (`src/index.html`, `src/css/estilos.css`, `src/js/app.js`), controladores de mapas Leaflet y diseño de storyboards.
* **Administrador de Datos Espaciales (Data Engineer):** Descarga, homologación, reproyección a EPSG:4326 y validación topográfica de capas oficiales del Estado y extractos de Geofabrik.
* **Auditor de Metacalidad:** Ejecución de modelos multicriterio ponderados (WLC v2.0), cálculo de índices de calidad cuantitativa y cualitativa, y actualización de matrices ISO.

---
"""
print("[+] Seccion 01 cargada")
