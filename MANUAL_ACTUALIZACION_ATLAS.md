# Atlas para la Gestión Territorial
## Análisis y Exploración | Municipio de Santiago y Barrio Brasil — Manual de Actualización, Estructura de Datos y Funcionamiento de la Plataforma (Prototipo 02)

* **Plataforma Web en Producción:** [https://atlasvgiuah.netlify.app](https://atlasvgiuah.netlify.app)
* **Repositorio Espejo (GitHub Pages):** [https://geojota.github.io/atlas-vgi-barrio-brasil/](https://geojota.github.io/atlas-vgi-barrio-brasil/)
* **Geodatabase Consolidada Descargable (`.zip`):** `docs/geodatabase_completa_atlas_vgi.zip` (`542,35 MB` comprimidos / `~3,33 GB` descomprimidos; `294` coberturas espaciales operativas).

---

## Índice General de Contenidos

### [PARTE I: Alcance Operativo, Formulación Estratégica, Hitos Verificados y Perfiles Territoriales](#parte-i-alcance-operativo-formulación-estratégica-hitos-verificados-y-perfiles-territoriales)
* [1. Identificación, propósito y visión general del Prototipo 02](#1-identificación-propósito-y-visión-general-del-prototipo-02)
  * [1.1. Un prototipo sintetizado para facilitar la gestión y lectura del territorio](#11-un-prototipo-sintetizado-para-facilitar-la-gestión-y-lectura-del-territorio)
  * [1.2. Tabla 1.1: Cifras clave verificadas del proyecto (referencia única)](#12-tabla-11-cifras-clave-verificadas-del-proyecto-referencia-única)
  * [1.3. Diagrama general de la plataforma y sus 3 módulos operativos](#13-diagrama-general-de-la-plataforma-y-sus-3-módulos-operativos)
* [2. Cobertura territorial y escalas de trabajo del Atlas](#2-cobertura-territorial-y-escalas-de-trabajo-del-atlas)
  * [2.1. Articulación entre la escala comunal (Municipio de Santiago) y la escala barrial (Barrio Brasil)](#21-articulación-entre-la-escala-comunal-municipio-de-santiago-y-la-escala-barrial-barrio-brasil)
* [3. Formulación estratégica: Objetivos del proyecto y entregables verificados (Eje Rector)](#3-formulación-estratégica-objetivos-del-proyecto-y-entregables-verificados-eje-rector)
  * [3.1. Objetivo general](#31-objetivo-general)
  * [3.2. Objetivos específicos (`OE 1` a `OE 4`) y entregables verificados](#32-objetivos-específicos-oe-1-a-oe-4-y-entregables-verificados)
  * [3.3. Tabla sinóptica de articulación estratégica y correspondencia en la plataforma](#33-tabla-sinóptica-de-articulación-estratégica-y-correspondencia-en-la-plataforma)
* [4. Matriz de los 9 Hitos con entregable verificado asociado (`Hito 1 / E1` a `Hito 9 / E9`)](#4-matriz-de-los-9-hitos-con-entregable-verificado-asociado-hito-1--e1-a-hito-9--e9)
* [5. Perfiles de actores territoriales destinatarios](#5-perfiles-de-actores-territoriales-destinatarios)

### [PARTE II: Organización de las 5 Dimensiones Analíticas, Catálogo de 294 Capas, Diagnóstico Territorial y Actualización](#parte-ii-organización-de-las-5-dimensiones-analíticas-catálogo-de-294-capas-diagnóstico-territorial-y-actualización)
* [6. Organización temática en las 5 Dimensiones Analíticas del Territorio](#6-organización-temática-en-las-5-dimensiones-analíticas-del-territorio)
  * [6.1. Dimensión 1: Sociodemográfica y Habitacional](#61-dimensión-1-sociodemográfica-y-habitacional)
  * [6.2. Dimensión 2: Socioeconómica y Comercial](#62-dimensión-2-socioeconómica-y-comercial)
  * [6.3. Dimensión 3: Socioambiental y Espacio Público](#63-dimensión-3-socioambiental-y-espacio-público)
  * [6.4. Dimensión 4: Sociosanitaria y Salud](#64-dimensión-4-sociosanitaria-y-salud)
  * [6.5. Dimensión 5: Sociourbana, Movilidad y Normativa](#65-dimensión-5-sociourbana-movilidad-y-normativa)
* [7. Descentralización de las 171 coberturas de Información Geográfica Voluntaria (`id_igv`)](#7-descentralización-de-las-171-coberturas-de-información-geográfica-voluntaria-id_igv)
* [8. Integración de las 123 capas oficiales del Estado de Chile (`id_ig`)](#8-integración-de-las-123-capas-oficiales-del-estado-de-chile-id_ig)
* [9. Perfil homologado de 17 atributos de metadatos y calidad (ISO 19115 / ISO 19157)](#9-perfil-homologado-de-17-atributos-de-metadatos-y-calidad-iso-19115--iso-19157)
  * [9.1. Diccionario de los 17 atributos homologados (`id_ig` / `id_igv`)](#91-diccionario-de-los-17-atributos-homologados-id_ig--id_igv)
  * [9.2. Libros maestros descargables en formato Excel (`.xlsx`)](#92-libros-maestros-descargables-en-formato-excel-xlsx)
* [10. Guía comprensible de los 4 Ejes de Diagnóstico Geoestadístico (83 cartografías)](#10-guía-comprensible-de-los-4-ejes-de-diagnóstico-geoestadístico-83-cartografías)
  * [10.1. Eje 01: Concentración Territorial de Actividad IGV en Santiago (14 mapas KDE)](#101-eje-01-concentración-territorial-de-actividad-igv-en-santiago-14-mapas-kde)
  * [10.2. Eje 02: Segregación Espacial, Hotspots y Áreas de Rezago (11 mapas LISA)](#102-eje-02-segregación-espacial-hotspots-y-áreas-de-rezago-11-mapas-lisa)
  * [10.3. Eje 03: Estructura Sociodemográfica, Habitabilidad y Morfología Urbana (34 mapas)](#103-eje-03-estructura-sociodemográfica-habitabilidad-y-morfología-urbana-34-mapas)
  * [10.4. Eje 04: Metabolismo Urbano, Movilidad y Espacio Público (24 mapas)](#104-eje-04-metabolismo-urbano-movilidad-y-espacio-público-24-mapas)
* [11. Criterios generales para la actualización y mantención del Atlas](#11-criterios-generales-para-la-actualización-y-mantención-del-atlas)
  * [11.1. Catálogo descriptivo de todos los archivos del repositorio y de la plataforma](#111-catálogo-descriptivo-de-todos-los-archivos-del-repositorio-y-de-la-plataforma)

---

# PARTE I: Alcance Operativo, Formulación Estratégica, Hitos Verificados y Perfiles Territoriales

---

## 1. Identificación, propósito y visión general del Prototipo 02

El **Atlas para la Gestión Territorial** (*Análisis y Exploración | Municipio de Santiago y Barrio Brasil*) es una plataforma web pública y abierta que integra en un mismo entorno **123 coberturas oficiales del Estado de Chile** (identificadas con el atributo primario `id_ig`) y **171 coberturas descentralizadas de Información Geográfica Voluntaria, IGV** (identificadas con el atributo primario `id_igv`).

Su objetivo principal es acercar la información territorial tanto a quienes toman decisiones en instituciones públicas como a las comunidades barriales, mapeadores voluntarios e investigadores, combinando la validez estadística y normativa de los registros del Estado con el nivel de detalle cotidiano que aporta la cartografía colaborativa.

### 1.1. Un prototipo sintetizado para facilitar la gestión y lectura del territorio
A partir de la evaluación de usabilidad desarrollada en el proyecto, el **Prototipo 02** organiza todas las capacidades del Atlas en una estructura limpia, directa y fácil de recorrer compuesta por **tres módulos principales** y **dos herramientas de apoyo permanente en la cabecera**:
* **Cabecera Superior Permanente (`#cabecera-atlas`):** Ubica el **Tutorial Interactivo** (de 18 pasos organizados en 4 bloques navegables) a la izquierda del título principal, y el **Glosario de siglas** a la derecha del título, evitando que ambos recuadros se superpongan.
* **Módulo 01 · Análisis (`#panel-indicadores`):** Presenta el diagnóstico del territorio a través de **4 láminas geoestadísticas (83 cartografías temáticas)** y agrupa las **294 coberturas** en **5 Dimensiones Analíticas** con un buscador en español que permite activarlas directamente en el mapa.
* **Módulo 02 · Explorar Mapa (`#panel-inicio`):** Dispone un visor cartográfico amplio y de proporción cuadrada con **5 mapas base abiertos y satelitales sin requerimiento de clave de API** (OpenStreetMap Estándar, OpenStreetMap Humanitario HOT, Imagen Satelital Bing/Microsoft, Satelital Híbrido con Calles Bing/Microsoft e Imagen Satelital Esri World Imagery), barra superior centrada de herramientas, motor de **Simbología Dinámica**, **Inspector normativo del Plan Regulador Comunal (PRC)** bajo demanda y el panel inferior **Detalles** para consultar los **17 atributos homologados (`id_ig` / `id_igv`)**.
* **Módulo 03 · Documentación (`#panel-manual`):** Reúne dentro de la plataforma **6 capítulos navegables (`DOC · 01` a `DOC · 06`)** con buscador en tiempo real, descargas de los 3 libros en formato Excel (`.xlsx`), manuales, el paquete comprimido de la geodatabase completa (`.zip` de `542,35 MB`) y el inventario filtrable de las 294 capas.

### 1.2. Tabla 1.1: Cifras clave verificadas del proyecto (referencia única)

| Componente del sistema | Valor verificado | Descripción clara y alcance |
| :--- | :---: | :--- |
| **Total de coberturas cartográficas** | **294 capas** | Suma de **123 capas oficiales del Estado de Chile (`id_ig`)** y **171 coberturas descentralizadas de Información Geográfica Voluntaria (`id_igv`)**. |
| **Dimensiones Analíticas del territorio** | **5 dimensiones** | (1) *Sociodemográfica y Habitacional*, (2) *Socioeconómica y Comercial*, (3) *Socioambiental y Espacio Público*, (4) *Sociosanitaria y Salud*, y (5) *Sociourbana, Movilidad y Normativa*. |
| **Diagnóstico geoestadístico** | **4 ejes · 83 cartografías** | Lámina 01: Concentración KDE (`14` mapas); Lámina 02: Autocorrelación LISA (`11` mapas); Lámina 03: Demografía Censo 2024, RSH y cités (`34` mapas); Lámina 04: Metabolismo urbano, ruido y residuos (`24` mapas). |
| **Perfil homologado de metadatos y calidad** | **17 atributos por entidad** | Estandarizado bajo normas **ISO 19115** e **ISO 19157**, diferenciando `id_ig` (fuente oficial) e `id_igv` (fuente voluntaria), visible en el panel inferior **Detalles** del Módulo 02. |
| **Estructura de navegación** | **3 módulos + 2 ayudas** | `Módulo 01 · Análisis`, `Módulo 02 · Explorar Mapa` y `Módulo 03 · Documentación` (6 capítulos), más el **Tutorial Interactivo** (18 pasos) y el **Glosario de siglas**. |
| **Mapas base disponibles** | **5 mapas base sin API** | *OpenStreetMap Estándar*, *OpenStreetMap Humanitario (HOT)*, *Imagen Satelital (Bing / Microsoft)*, *Satelital Híbrido con Calles (Bing / Microsoft)* e *Imagen Satelital (Esri World Imagery)*. |
| **Hitos con entregable verificado** | **9 hitos (`E1` a `E9`)** | Cronograma de 9 hitos vinculados directamente con entregables verificados en el repositorio y en la plataforma web. |
| **Paquete maestro descargable** | **542,35 MB (`.zip`)** | Archivo `docs/geodatabase_completa_atlas_vgi.zip` acompañado de 3 libros maestros en formato Excel (`.xlsx`). |

### 1.3. Diagrama general de la plataforma y sus 3 módulos operativos

```mermaid
flowchart TB
    subgraph FUENTES["1. FUENTES INTEGRADAS EN EL ATLAS (294 Capas)"]
        FO["123 Capas Oficiales del Estado de Chile (id_ig)\nIDE Chile · INE Censo 2024 · MINVU PRC · MDSF RSH/BIP\nSUBDERE RSD · SII · CMN · UOCT · Municipalidad de Santiago"]
        FV["171 Capas Colaborativas de IGV Descentralizadas (id_igv)\nComunidad OpenStreetMap Chile (ODbL 1.0) &\nCiencia Ciudadana GBIF (CC BY 4.0 · 52 especies)"]
    end

    subgraph ARMONIZACION["2. ORGANIZACIÓN Y ESTANDARIZACIÓN"]
        DIM["Agrupación en las 5 Dimensiones Analíticas\n1. Sociodemográfica · 2. Socioeconómica · 3. Socioambiental\n4. Sociosanitaria · 5. Sociourbana y Normativa"]
        ATR["Perfil Homologado de 17 Atributos (ISO 19115 / ISO 19157)\nIdentificación clara de origen (id_ig / id_igv), custodia, vigencia y licencia"]
    end

    subgraph PLATAFORMA["3. INTERFAZ DEL PROTOTIPO 02 (3 Módulos + Cabecera)"]
        CAB["Cabecera Superior\nIzquierda: Tutorial Interactivo (18 pasos) | Centro: Título Oficial | Derecha: Glosario de Siglas"]
        M01["Módulo 01 · Análisis\n• 4 Ejes de Diagnóstico con 83 Cartografías Temáticas\n• Explorador de las 5 Dimensiones y 294 Capas"]
        M02["Módulo 02 · Explorar Mapa\n• Visor Cuadrado + 5 Mapas Base (OSM, Bing/Microsoft, Esri)\n• Delimitar Área · Simbología Dinámica · Inspector PRC · Panel Detalles"]
        M03["Módulo 03 · Documentación\n• 6 Capítulos Navegables (DOC · 01 a DOC · 06) con Buscador\n• Descarga de 3 Libros Excel (.xlsx), Manuales y Geodatabase (.zip)"]
    end

    FO & FV --> DIM --> ATR
    ATR --> M01 & M02 & M03
    CAB --> M01 & M02 & M03
    M01 <-->|"Activar capa en el mapa /\nVer Atlas de Análisis"| M02
```

---

## 2. Cobertura territorial y escalas de trabajo del Atlas

### 2.1. Articulación entre la escala comunal (Municipio de Santiago) y la escala barrial (Barrio Brasil)
El Atlas permite trabajar de forma fluida en dos escalas complementarias, conmutables desde el selector **Área de enfoque** en la barra superior del **Módulo 02 (`Explorar Mapa`)**:
1. **Escala Comunal — Municipio de Santiago (`1.711` manzanas censales y `26` unidades vecinales):** Abarca toda la comuna de Santiago, permitiendo observar patrones generales de población, distribución de equipamientos, redes de movilidad y zonas de gestión ambiental.
2. **Escala Barrial — Barrio Brasil (`223,75 ha` en el sector norponiente):** Comprende el polígono delimitado por Av. San Pablo/Rosas al norte, la Alameda al sur, Av. Manuel Rodríguez (Ruta 5) al oriente y Av. Ricardo Cumming/García Reyes al poniente, facilitando el análisis detallado a nivel de cuadra, pasaje, cité y predio patrimonial.

```mermaid
flowchart LR
    COM["Escala Comunal: Municipio de Santiago\n26 Unidades Vecinales y 1.711 Manzanas Censales\nVisión estructural de servicios, vivienda y movilidad"]
    BAR["Escala Barrial: Barrio Brasil Completo\nPolígono histórico y residencial de 223,75 ha\nDetalle de cités, patrimonio (ZCH/ICH), arbolado y comercio"]

    COM <-->|"Selector 'Área de enfoque'\nen la barra superior del Módulo 02"| BAR
```

---

## 3. Formulación estratégica: Objetivos del proyecto y entregables verificados (Eje Rector)

La formulación estratégica constituye el **eje rector** que define la arquitectura, el diseño de datos, las herramientas del geoportal y las pautas de validación del Atlas. El proyecto se estructura formalmente en un **Objetivo General** y **cuatro Objetivos Específicos (`OE 1` a `OE 4`)**, cuyos componentes ejecutados y entregables verificados se encuentran materializados en el repositorio y en la plataforma web:

```mermaid
flowchart LR
    OG["Objetivo General\nAtlas para la Gestión Territorial\n(Municipio de Santiago y Barrio Brasil)"]
    OE1["OE 1: Caracterización y diseño\ncentrado en el usuario\n(Entregables E1, E2, E3)"]
    OE2["OE 2: Geodatabase multipropósito\ny calidad espacial\n(Entregables E4, E5)"]
    OE3["OE 3: Geoportal web accesible\ne interoperable en 3 módulos\n(Entregables E6, E7)"]
    OE4["OE 4: Evaluación de usabilidad\ny transferibilidad\n(Entregables E8, E9)"]

    OG --> OE1 & OE2 & OE3 & OE4
```

### 3.1. Objetivo general

> **Desarrollar un Atlas para la Gestión Territorial reproducible, interoperable y centrado en el usuario, que integre geodatos abiertos, cartografía participativa y herramientas analíticas para subsanar vacíos de información territorial y apoyar la gestión local y la investigación en la Comuna de Santiago y Barrio Brasil.**

---

### 3.2. Objetivos específicos (`OE 1` a `OE 4`) y entregables verificados

#### **OE 1. Caracterizar la disponibilidad, la cobertura y los vacíos de información geográfica del área de estudio, y definir las bases taxonómicas y de diseño centrado en el usuario que permitan integrar datos colaborativos e institucionales.**
* **Componentes ejecutados y entregables verificados (`E1`, `E2`, `E3`):**
  * Revisión sistemática de plataformas de geodatos abiertos (OpenStreetMap, GBIF e IDE Chile).
  * Organización temática del catálogo en las **5 Dimensiones Analíticas** del territorio (*Sociodemográfica y Habitacional*, *Socioeconómica y Comercial*, *Socioambiental y Espacio Público*, *Sociosanitaria y Salud*, y *Sociourbana, Movilidad y Normativa*).
  * Caracterización de los cuatro perfiles de actores territoriales e inventario exhaustivo de brechas de información entre fuentes oficiales y comunitarias.
  * **Ubicación verificable en el repositorio:** [`docs/ARQUITECTURA.md`](ARQUITECTURA.md), [`docs/TRAZABILIDAD.md`](TRAZABILIDAD.md), [`docs/catalogo_fuentes_vgi.xlsx`](catalogo_fuentes_vgi.xlsx) y [`docs/categorias_tematicas_osm.xlsx`](categorias_tematicas_osm.xlsx) (con réplica exacta en `src/docs/`).

#### **OE 2. Consolidar una geodatabase multipropósito que armonice coberturas oficiales e información voluntaria bajo estándares internacionales de calidad y metadatos.**
* **Componentes ejecutados y entregables verificados (`E4`, `E5`):**
  * Descarga, descentralización y normalización de las **294 coberturas vectoriales** (**123 capas oficiales del Estado de Chile** y **171 coberturas descentralizadas de Información Geográfica Voluntaria, IGV**) en los sistemas de referencia `EPSG:4326` (WGS 84) y `EPSG:32719` (SIRGAS-Chile UTM 19S).
  * Homologación del perfil de metadatos y calidad ISO 19157 de **17 atributos** en la totalidad de capas, diferenciando **`id_ig`** (información geográfica oficial del Estado) e **`id_igv`** (información geográfica voluntaria y colaborativa).
  * Elaboración de las matrices de síntesis comunal (1.711 manzanas) y barrial (Barrio Brasil).
  * **Ubicación verificable en el repositorio:** `src/data/*.geojson` (294 capas), `data/*.geojson`, [`docs/perfil_metadatos_vgi.xlsx`](perfil_metadatos_vgi.xlsx), `data/matriz_sintesis_barrio_brasil_manzanas.geojson` y `data/bip_inversiones_santiago.csv`.

#### **OE 3. Implementar un geoportal web accesible e interoperable que permita visualizar cartografía multinivel, consultar el territorio en tiempo real y descargar geodatos abiertos.**
* **Componentes ejecutados y entregables verificados (`E6`, `E7`):**
  * **Definición de un prototipo sintetizado para usuarios no técnicos:** prototipo más sintetizado que permita a usuarios sin experiencia técnica poder interactuar de forma más simple con la plataforma, articulado en 3 módulos (*Módulo 01 Análisis*, *Módulo 02 Explorar Mapa* y *Módulo 03 Documentación*).
  * Visor cartográfico cuadrado con **5 mapas base abiertos y satelitales sin clave de API** (*OpenStreetMap Estándar*, *OpenStreetMap Humanitario HOT*, *Imagen Satelital Bing/Microsoft*, *Satelital Híbrido con Calles Bing/Microsoft* e *Imagen Satelital Esri World Imagery*).
  * Herramienta de simbología dinámica (*Cortes Naturales de Jenks*, cuantiles e intervalos), **Inspector normativo del Plan Regulador Comunal (PRC)** bajo demanda, panel inferior **Detalles** con los 17 atributos homologados y **4 ejes de diagnóstico geoestadístico con 83 cartografías temáticas**.
  * **Ubicación verificable en el repositorio:** [`src/index.html`](../index.html), [`src/css/estilos.css`](../css/estilos.css), [`src/js/modulos/mapa.js`](../js/modulos/mapa.js), [`src/js/modulos/evaluador_normativo.js`](../js/modulos/evaluador_normativo.js), [`src/js/modulos/indicadores_analisis.js`](../js/modulos/indicadores_analisis.js) y [`netlify.toml`](../../netlify.toml).

#### **OE 4. Evaluar la usabilidad y la pertinencia de la plataforma con distintos perfiles de actores territoriales y asegurar su transferibilidad técnica, metodológica y documental.**
* **Componentes ejecutados y entregables verificados (`E8`, `E9`):**
  * Aplicación de instrumentos de evaluación de usabilidad con tareas guiadas (Modalidad 1) y conversaciones con vecinos (Modalidad 2) en el Barrio Brasil.
  * Implementación del **Tutorial Interactivo navegable de 18 pasos en 4 bloques** (a la izquierda del título) y del **Glosario de siglas** (a la derecha del título).
  * Documentación interactiva y navegable en el Módulo 03 y en el repositorio Git (Manual de uso, Manual de actualización y Arquitectura).
  * Empaquetado completo de la geodatabase (`.zip` de 542,35 MB) y verificación automatizada de las 294 capas.
  * **Ubicación verificable en el repositorio:** [`docs/MANUAL_USO.md`](MANUAL_USO.md), [`docs/MANUAL_ACTUALIZACION_ATLAS.md`](MANUAL_ACTUALIZACION_ATLAS.md), [`src/js/modulos/tutorial_interactivo.js`](../js/modulos/tutorial_interactivo.js), [`src/js/modulos/manual.js`](../js/modulos/manual.js) y [`docs/geodatabase_completa_atlas_vgi.zip`](geodatabase_completa_atlas_vgi.zip).

---

### 3.3. Tabla sinóptica de articulación estratégica y correspondencia en la plataforma

| Objetivo Específico | Entregables Verificados | Componentes Técnicos Clave | Archivos de Respaldo | Módulo Asociado en la Plataforma |
| :--- | :---: | :--- | :--- | :--- |
| **OE 1 · Caracterización y taxonomía** | **E1, E2, E3** | • Revisión de plataformas abiertas<br>• Estructuración de las 5 dimensiones<br>• Perfiles de actores y brechas | `docs/ARQUITECTURA.md`<br>`docs/TRAZABILIDAD.md`<br>`docs/catalogo_fuentes_vgi.xlsx`<br>`docs/categorias_tematicas_osm.xlsx` | **Módulo 01 (`Análisis`)** y **Módulo 03 (`Documentación`)** |
| **OE 2 · Geodatabase multipropósito** | **E4, E5** | • 294 capas GeoJSON normalizadas<br>• 17 atributos ISO (`id_ig` e `id_igv`)<br>• Matrices comunal y barrial | `src/data/*.geojson`<br>`data/*.geojson`<br>`docs/perfil_metadatos_vgi.xlsx`<br>`matriz_sintesis_barrio_brasil_manzanas.geojson` | **Módulo 02 (`Explorar Mapa`)** (Panel Detalles) |
| **OE 3 · Geoportal web interoperable** | **E6, E7** | • Prototipo sintetizado en 3 módulos<br>• Visor cuadrado + 5 mapas base sin API<br>• Inspector PRC y 83 mapas temáticos | `src/index.html`<br>`src/css/estilos.css`<br>`src/js/modulos/mapa.js`<br>`evaluador_normativo.js`<br>`indicadores_analisis.js` | **Módulo 01 (`Análisis`)** y **Módulo 02 (`Explorar Mapa`)** |
| **OE 4 · Usabilidad y transferibilidad** | **E8, E9** | • Evaluación Modalidad 1 y 2<br>• Tutorial navegable (18 pasos) y Glosario<br>• Manual de actualización y paquete ZIP | `docs/MANUAL_USO.md`<br>`docs/MANUAL_ACTUALIZACION_ATLAS.md`<br>`src/js/modulos/tutorial_interactivo.js`<br>`geodatabase_completa_atlas_vgi.zip` | **Cabecera Permanente** y **Módulo 03 (`Documentación`)** |

---

## 4. Matriz de los 9 Hitos con entregable verificado asociado (`Hito 1 / E1` a `Hito 9 / E9`)

En total correspondencia con la Carta Gantt del proyecto (`Carta_Gantt_Atlas_VGI.pdf`), se mantienen exclusivamente los **9 hitos que cuentan con un entregable verificado asociado (`E1` a `E9`)**:

```mermaid
flowchart LR
    subgraph F1["Fase I · OE 1"]
        H1["Hito 1 (03 sep) ♦\nE1: Arquitectura y catálogo\ninicial de fuentes"] --> H2["Hito 2 (09 sep) ♦\nE2: 5 Dimensiones Analíticas\ny etiquetas IGV"] --> H3["Hito 3 (16 sep) ♦\nE3: Inventario de 294 fuentes\ny matriz de brechas"]
    end

    subgraph F2["Fase II · OE 2"]
        H4["Hito 4 (08 oct) ♦\nE4: Geodatabase de 294 capas\ny 17 atributos ISO (id_ig / id_igv)"] --> H5["Hito 5 (19 oct) ♦\nE5: Matriz de síntesis barrial,\ncatastro IGV e inversiones BIP"]
    end

    subgraph F3["Fase III · OE 3"]
        H6["Hito 6 (27 oct) ♦\nE6: Plataforma en 3 módulos\ny visor cuadrado (5 mapas base)"] --> H7["Hito 7 (04 nov) ♦\nE7: Inspector PRC, Jenks,\nDetalles, 83 mapas y Netlify"]
    end

    subgraph F4["Fase IV · OE 4"]
        H8["Hito 8 (09 nov) ♦\nE8: Evaluación de usabilidad,\nTutorial (18 pasos) y Módulo 03"] --> H9["Hito 9 (12 nov) ♦\nE9: Manual de actualización,\nZIP (542,35 MB) y auditoría"]
    end

    F1 --> F2 --> F3 --> F4
```

| Hito | Fecha ($\blacklozenge$) | OE | Entregable verificado asociado (`E1` a `E9`) | Localización verificable en el repositorio y plataforma |
| :---: | :---: | :---: | :--- | :--- |
| **Hito 1** | `03 sep 2026` | `OE 1` | **E1 ·** Arquitectura del sistema y catálogo inicial de fuentes | `docs/ARQUITECTURA.md` y `docs/catalogo_fuentes_vgi.xlsx` (`src/docs/`) |
| **Hito 2** | `09 sep 2026` | `OE 1` | **E2 ·** Cinco dimensiones analíticas, etiquetas IGV y configuración | `docs/categorias_tematicas_osm.xlsx` (`src/docs/`) y `src/js/config.js` |
| **Hito 3** | `16 sep 2026` | `OE 1` | **E3 ·** Inventario consolidado de 294 fuentes y matriz de brechas | `docs/catalogo_fuentes_vgi.xlsx` y `docs/TRAZABILIDAD.md` (`src/docs/`) |
| **Hito 4** | `08 oct 2026` | `OE 2` | **E4 ·** Geodatabase de 294 capas GeoJSON y perfil de 17 atributos ISO (`id_ig` / `id_igv`) | `src/data/*.geojson`, `data/*.geojson` y `docs/perfil_metadatos_vgi.xlsx` |
| **Hito 5** | `19 oct 2026` | `OE 2` | **E5 ·** Matriz de síntesis barrial por manzana, catastro IGV e inversiones BIP | `data/matriz_sintesis_barrio_brasil_manzanas.geojson`, `data/resumen_catastro_vgi.csv` y `data/bip_inversiones_santiago.csv` |
| **Hito 6** | `27 oct 2026` | `OE 3` | **E6 ·** Plataforma sintetizada en 3 módulos (*Análisis*, *Explorar Mapa*, *Documentación*) y visor cuadrado | `src/index.html`, `src/css/estilos.css`, `src/js/app.js` y `src/js/modulos/mapa.js` |
| **Hito 7** | `04 nov 2026` | `OE 3` | **E7 ·** Inspector normativo PRC, simbología Jenks, panel *Detalles*, 83 mapas y despliegue en Netlify | `src/js/modulos/evaluador_normativo.js`, `src/js/modulos/simbologia_dinamica.js`, `src/js/modulos/indicadores_analisis.js` y `netlify.toml` |
| **Hito 8** | `09 nov 2026` | `OE 4` | **E8 ·** Evaluación de usabilidad, Tutorial interactivo (18 pasos) y Módulo 03 navegable | `docs/TRAZABILIDAD.md`, `MANUAL_USO.md`, `src/js/modulos/tutorial_interactivo.js` y `src/js/modulos/manual.js` |
| **Hito 9** | `12 nov 2026` | `OE 4` | **E9 ·** Manual de actualización, paquete ZIP (`542,35 MB`) y verificación de integridad | `MANUAL_ACTUALIZACION_ATLAS.md`, `docs/geodatabase_completa_atlas_vgi.zip` y `scripts/verificar_conteo_capas.py` |

---

## 5. Perfiles de actores territoriales destinatarios

La plataforma está diseñada para responder de forma clara a cuatro perfiles de actores territoriales:
1. **Perfil 1 — Instituciones públicas (Municipio / IDE):** Equipos municipales (SECPLAN, DOM, DIDECO, DIMAO) y servicios ministeriales que requieren cruzar vulnerabilidad social (RSH) y demografía (Censo 2024) con dotación de equipamiento, cartera de proyectos BIP y normativa vigente del Plan Regulador Comunal (PRC).
2. **Perfil 2 — Comunidad, vecinas y vecinos:** Juntas de vecinos, organizaciones barriales y residentes del Barrio Brasil y de Santiago que buscan conocer y visibilizar el estado de su entorno (áreas verdes, salud, luminarias, cités, patrimonio y reglas de edificación en su cuadra) mediante una interfaz guiada por el Tutorial Interactivo y el Glosario de siglas.
3. **Perfil 3 — Mapeadores voluntarios y ciencia ciudadana (OpenStreetMap / GBIF):** Contribuyentes de datos abiertos que utilizan el Atlas para identificar sectores de la comuna con vacíos de mapeo colaborativo y revisar los atributos de completitud y calidad de las 171 coberturas `id_igv`.
4. **Perfil 4 — ONG, docencia e investigación:** Equipos académicos, estudiantes y organizaciones sociales que consultan las 83 cartografías temáticas del Módulo 01 y descargan la geodatabase completa (`.zip`) y los catálogos en Excel (`.xlsx`) desde el Módulo 03 para sus propios estudios.

---

# PARTE II: Organización de las 5 Dimensiones Analíticas, Catálogo de 294 Capas, Diagnóstico Territorial y Actualización

---

## 6. Organización temática en las 5 Dimensiones Analíticas del Territorio

Para facilitar la búsqueda y comprensión de las **294 coberturas espaciales** (`123` oficiales del Estado + `171` colaborativas de IGV), el Prototipo 02 las agrupa en **5 Dimensiones Analíticas** presentes tanto en el **Módulo 01 (`Análisis`)** como en el selector de capas del **Módulo 02 (`Explorar Mapa`)**:

```mermaid
flowchart TD
    CAT["Catálogo Unificado del Atlas (294 Capas)\n123 Capas Oficiales del Estado (id_ig) +\n171 Capas Colaborativas de IGV (id_igv)"]

    D1["1. Dimensión Sociodemográfica y Habitacional\nCenso 2024 (INE), vulnerabilidad RSH 2026, tipologías de vivienda,\nhacinamiento, arriendo, cités, predios SII y permisos de edificación"]
    D2["2. Dimensión Socioeconómica y Comercial\nInversión pública (BIP y MOP), comercio barrial y gastronomía (IGV),\nferias libres, supermercados, bancos, servicios y telecomunicaciones"]
    D3["3. Dimensión Socioambiental y Espacio Público\nParques y áreas verdes (MINVU/INE), arbolado urbano, 52 especies de\nbiodiversidad ciudadana (GBIF), ruido (>68 dBA) y residuos SUBDERE RSD 2024"]
    D4["4. Dimensión Sociosanitaria y Salud\nRed asistencial pública (hospitales, CESFAM, COSAM), clínicas,\nfarmacias, desfibriladores (DEA), grifos y recintos deportivos"]
    D5["5. Dimensión Sociourbana, Movilidad y Normativa\nZonificación del Plan Regulador Comunal (PRC Santiago), patrimonio\nprotegido (ZCH/ICH/CMN), Metro, paraderos Red, ciclovías y luminarias"]

    CAT --> D1 & D2 & D3 & D4 & D5
```

### 6.1. Dimensión 1: Sociodemográfica y Habitacional
Reúne información sobre la población y sus viviendas: manzanas y zonas del **Censo 2024 (INE)**, calificación socioeconómica del **Registro Social de Hogares (RSH)**, catastro de **cités y pasajes históricos**, hacinamiento, arriendo, permisos de edificación y avalúo fiscal predial del SII.

### 6.2. Dimensión 2: Socioeconómica y Comercial
Agrupa la actividad económica comunal y de proximidad: cartera de proyectos de inversión pública del **Banco Integrado de Proyectos (BIP)** y del MOP, ferias libres, comercio minorista, gastronomía barrial, bancos, servicios de correo y telecomunicaciones.

### 6.3. Dimensión 3: Socioambiental y Espacio Público
Caracteriza la calidad ambiental urbana: catastro de parques y plazas públicas (MINVU/INE y municipal), arbolado urbano, registros ciudadanos de **52 especies de flora y fauna (GBIF)**, mapas de ruido ambiental (`>68 dBA`) y zonas de recolección de residuos domiciliarios (**SUBDERE RSD 2024**).

### 6.4. Dimensión 4: Sociosanitaria y Salud
Concentra los servicios de salud y respuesta ante emergencias: hospitales, consultorios y centros de salud familiar (CESFAM), centros de salud mental (COSAM), farmacias, desfibriladores externos automáticos (DEA), grifos contra incendios y recintos deportivos.

### 6.5. Dimensión 5: Sociourbana, Movilidad y Normativa
Contiene las reglas de planificación y las redes de desplazamiento: zonificación del **Plan Regulador Comunal de Santiago (PRC)**, Zonas e Inmuebles de Conservación Histórica (`ZCH`/`ICH`), Monumentos Nacionales (CMN), estaciones de Metro, paraderos del sistema Red, ciclovías y luminarias públicas.

---

## 7. Descentralización de las 171 coberturas de Información Geográfica Voluntaria (`id_igv`)

En el Prototipo 02, la Información Geográfica Voluntaria no se almacena en un archivo único e indivisible, sino que se organiza en **171 coberturas temáticas independientes (`.geojson`)** registradas en `src/js/modulos/catalogo_vgi_descentralizado.js`. Esto ofrece tres ventajas directas:
1. **Carga rápida bajo demanda:** El navegador solo descarga y procesa en pantalla la capa específica que el usuario decide encender.
2. **Nombres y descripciones comprensibles en español:** Cada etiqueta técnica de OpenStreetMap (por ejemplo, `amenity=pharmacy`) o de GBIF se traduce a un título claro (por ejemplo, *Farmacias de barrio* o *Zorzal común*).
3. **Control visual independiente:** Cada cobertura posee su propio color, símbolo y nivel de opacidad para facilitar su superposición con otras capas.

---

## 8. Integración de las 123 capas oficiales del Estado de Chile (`id_ig`)

El Atlas incorpora **123 coberturas oficiales** provistas por ministerios, servicios y la Municipalidad de Santiago (administradas en `src/js/modulos/ide_chile.js`). Todas se encuentran normalizadas bajo el mismo sistema de coordenadas (`EPSG:4326`) y homologadas con el perfil de 17 atributos, asegurando que los datos del Estado dialoguen de forma fluida con las capas ciudadanas de IGV.

---

## 9. Perfil homologado de 17 atributos de metadatos y calidad (ISO 19115 / ISO 19157)

### 9.1. Diccionario de los 17 atributos homologados (`id_ig` / `id_igv`)

Cada punto, línea o polígono de las 294 capas del Atlas cuenta con 17 atributos estandarizados que se consultan en el panel inferior **Detalles** del Módulo 02 al hacer clic en el mapa:

| N° | Atributo | Norma ISO | Significado claro y función |
| :---: | :--- | :---: | :--- |
| **`01`** | **`id_ig` / `id_igv`** | ISO 19115 | Código único del registro. Si empieza con **`id_ig`** proviene de un organismo público del Estado de Chile; si empieza con **`id_igv`** proviene de mapeo colaborativo ciudadano (OSM o GBIF). |
| **`02`** | `nombre_capa` | ISO 19115 | Nombre oficial y comprensible de la cobertura cartográfica en español. |
| **`03`** | `dimension_analitica` | ISO 19115 | A cuál de las 5 Dimensiones Analíticas del Atlas pertenece la capa. |
| **`04`** | `tipo_fuente` | ISO 19115 | Indica si el dato es oficial del Estado o colaborativo de Información Geográfica Voluntaria (IGV). |
| **`05`** | `institucion_custodia` | ISO 19115 | Institución pública responsable (INE, MINVU, RSH, SUBDERE, SII, CMN, Municipalidad) o comunidad colaborativa (OpenStreetMap, GBIF). |
| **`06`** | `sistema_referencia` | ISO 19115 | Coordenadas del dato: `EPSG:4326` (WGS 84) para visualización y `EPSG:32719` (SIRGAS-Chile UTM 19S) para mediciones en metros. |
| **`07`** | `escala_referencia` | ISO 19115 | Nivel de detalle con que se levantó el dato (`1:1.000` a `1:5.000` barrial; `1:10.000` a `1:25.000` comunal). |
| **`08`** | `fecha_actualizacion` | ISO 19115 | Fecha verificada de corte o publicación del dato (`AAAA-MM-DD`). |
| **`09`** | `licencia_uso` | ISO 19115 | Términos de uso abierto: Ley N° 20.285 de Datos Públicos, `ODbL 1.0` (OpenStreetMap) o `CC BY 4.0` (GBIF). |
| **`10`** | `exactitud_posicional` | ISO 19157 | Precisión de la ubicación del objeto respecto a la cartografía predial y ortofotografías. |
| **`11`** | `consistencia_topologica` | ISO 19157 | Certifica que la geometría está correctamente cerrada y sin errores de trazado. |
| **`12`** | `completitud` | ISO 19157 | Grado en que los campos descriptivos clave del elemento cuentan con información completa. |
| **`13`** | `exactitud_tematica` | ISO 19157 | Confirma que la clasificación o categoría asignada al objeto corresponde con la realidad. |
| **`14`** | `consistencia_temporal` | ISO 19157 | Indica la vigencia temporal del dato dentro del periodo operativo del Atlas (`2024–2026`). |
| **`15`** | `linaje_fuente` | ISO 19157 | Resume de dónde provino el dato y cómo fue normalizado para integrarse en la plataforma. |
| **`16`** | `cobertura_territorial` | ISO 19115 | Alcance espacial de la capa (`Barrio Brasil`, `Comuna de Santiago` o `Región Metropolitana`). |
| **`17`** | `archivo_origen` | ISO 19115 | Ruta del archivo `.geojson` en el repositorio (`data/<archivo>.geojson`) para su trazabilidad directa. |

### 9.2. Libros maestros descargables en formato Excel (`.xlsx`)
Desde el capítulo **`DOC · 04`** del **Módulo 03 (`Documentación`)** se pueden descargar tres libros Excel que respaldan toda la estructura del catálogo:
1. **`categorias_tematicas_osm.xlsx`:** Organización de las 5 Dimensiones Analíticas, listado de las 171 capas de IGV y diccionario de atributos.
2. **`perfil_metadatos_vgi.xlsx`:** Detalle de los 17 atributos homologados (`id_ig` / `id_igv`) bajo las normas ISO 19115 e ISO 19157.
3. **`catalogo_fuentes_vgi.xlsx`:** Inventario completo de las 294 coberturas con su institución custodia, escala y licencia.

---

## 10. Guía comprensible de los 4 Ejes de Diagnóstico Geoestadístico (83 cartografías)

El **Módulo 01 (`Análisis`)** reúne **83 cartografías temáticas** organizadas en **4 ejes o láminas de diagnóstico**. A continuación se explica de manera clara y accesible qué muestra cada eje y cómo ayuda a comprender el territorio:

```mermaid
flowchart TD
    subgraph EJES["Los 4 Ejes de Diagnóstico en el Módulo 01 · Análisis (83 Cartografías)"]
        E1["Lámina 01 · Concentración de Actividad IGV (14 mapas KDE)\nMuestra en una malla de 20 metros dónde se concentran\nlos comercios, servicios, equipamientos y transporte"]
        E2["Lámina 02 · Segregación y Áreas de Rezago (11 mapas LISA)\nEvalúa las 1.711 manzanas censales para distinguir sectores\nbien dotados (Alto-Alto) y bolsones de rezago (Bajo-Bajo)"]
        E3["Lámina 03 · Demografía, RSH y Cités (34 mapas)\nCruza el Censo 2024, la vulnerabilidad social (RSH 2026),\nlos cités históricos, el patrimonio y la inversión BIP"]
        E4["Lámina 04 · Metabolismo Urbano y Movilidad (24 mapas)\nAnaliza el acceso a pie (isócronas de 5 y 15 min) a parques y salud,\nel arbolado, el ruido (>68 dBA) y las 5 zonas de aseo (SUBDERE RSD)"]
    end

    E1 --> E2 --> E3 --> E4
```

### 10.1. Eje 01: Concentración Territorial de Actividad IGV en Santiago (14 mapas KDE)
* **¿Qué muestra y cómo se lee?** A través del método de **Estimación de Densidad por Núcleo (KDE)** calculado sobre una malla de 20 metros (a partir de 79.841 entidades y 112.264 nodos colaborativos), estos 14 mapas transforman miles de puntos individuales en superficies continuas de intensidad. Los colores más intensos permiten identificar de un vistazo dónde se agrupan con mayor fuerza el comercio cotidiano, los servicios, la oferta cultural y el transporte público (especialmente en el eje Alameda, el centro histórico y el Barrio Brasil-Yungay), mientras que los tonos suaves muestran los sectores residenciales con menor densidad de equipamiento mapeado.

### 10.2. Eje 02: Segregación Espacial, Hotspots y Áreas de Rezago (11 mapas LISA)
* **¿Qué muestra y cómo se lee?** Utiliza los **Indicadores Locales de Asociación Espacial (LISA de Anselin)** sobre las **1.711 manzanas censales** de la Comuna de Santiago para comparar cada manzana con sus manzanas vecinas inmediatas. Así, el mapa clasifica las manzanas en cuatro situaciones fáciles de interpretar para la toma de decisiones:
  * **Alto-Alto (Rojo — *Hotspot*):** Manzanas con alta cobertura de servicios rodeadas de vecinas igualmente bien dotadas.
  * **Bajo-Bajo (Azul — *Coldspot*):** Conjuntos de manzanas vecinas que comparten simultáneamente baja dotación de equipamiento o mayor vulnerabilidad, señalando las **áreas prioritarias de rezago donde focalizar proyectos e inversión**.
  * **Alto-Bajo y Bajo-Alto:** Manzanas que presentan una condición distinta a la de su entorno inmediato.

### 10.3. Eje 03: Estructura Sociodemográfica, Habitabilidad y Morfología Urbana (34 mapas)
* **¿Qué muestra y cómo se lee?** Es la serie más amplia de mapas del diagnóstico (`34` cartografías) y cruza tres fuentes clave: el **Censo de Población y Vivienda 2024 (INE)**, la calificación socioeconómica del **Registro Social de Hogares (RSH 2026)** y el catastro de **cités, viviendas colectivas y patrimonio histórico (`ZCH`/`ICH`)**. Permite observar en qué manzanas viven más personas mayores o población infantil, dónde predomina el arriendo o el hacinamiento, cómo se distribuyen los cités en el Barrio Brasil y dónde se localizan las iniciativas de inversión pública del **BIP**.

### 10.4. Eje 04: Metabolismo Urbano, Movilidad y Espacio Público (24 mapas)
* **¿Qué muestra y cómo se lee?** Evalúa la calidad ambiental cotidiana y la cercanía a pie dentro de la ciudad a través de `24` cartografías que integran:
  * **Isócronas de caminata peatonal (5, 10 y 15 minutos a pie):** Muestran qué manzanas cuentan con una plaza, parque, estación de transporte o centro de salud a distancia caminable y cuáles presentan déficit de proximidad.
  * **Arbolado y biodiversidad ciudadana:** Distribución del arbolado urbano y de las 52 especies registradas colaborativamente en GBIF.
  * **Ruido ambiental (`>68 dBA`):** Identifica las calles y frentes de manzana expuestos a niveles altos de ruido vehicular diurno y nocturno en corredores como la Ruta 5, Alameda, Av. Brasil y Av. Matucana.
  * **Gestión de residuos domiciliarios (`SUBDERE RSD 2024`):** Muestra la cobertura operativa de recolección, contenedores y papeleros en las **5 zonas de aseo municipal** de Santiago.

---

## 11. Criterios generales para la actualización y mantención del Atlas

Para mantener actualizado el **Atlas para la Gestión Territorial** o incorporar nuevas capas y documentos conservando la coherencia del **Prototipo 02**, el flujo de mantención sigue cuatro pasos simples y verificables:

```mermaid
flowchart LR
    P1["1. Incorporar o Actualizar Archivo\nGuardar la capa .geojson en data/ y src/data/\no la cartografía .jpg en src/img/cartografias/"]
    P2["2. Asociar a las 5 Dimensiones\nRegistrar la capa en ide_chile.js (id_ig)\no en catalogo_vgi_descentralizado.js (id_igv)\ncon sus 17 atributos homologados"]
    P3["3. Sincronizar Documentación\nActualizar manual.js (Módulo 03), los archivos .md\ny regenerar los libros .xlsx y el paquete .zip"]
    P4["4. Verificar y Publicar\nComprobar el conteo de las 294 capas en local\ny subir los cambios a producción en Git"]

    P1 --> P2 --> P3 --> P4
```

1. **Paridad de archivos entre el repositorio y la web:** Todo archivo de datos (`.geojson` o `.csv`) debe guardarse de manera idéntica tanto en la carpeta `data/` como en `src/data/`, y todo documento o catálogo descargable (`.md`, `.xlsx` o `.zip`) debe actualizarse tanto en `docs/` como en `src/docs/`.
2. **Adscripción a las 5 Dimensiones Analíticas y clave de origen (`id_ig` / `id_igv`):** Toda cobertura oficial del Estado debe registrarse con su identificador `id_ig` en `src/js/modulos/ide_chile.js`, y toda cobertura colaborativa de Información Geográfica Voluntaria debe registrarse con su identificador `id_igv` y nombre en español en `src/js/modulos/catalogo_vgi_descentralizado.js`, asignándola siempre a una de las 5 Dimensiones Analíticas y manteniendo sus 17 atributos homologados (`scripts/enriquecer_base_datos_metadatos.py`).
3. **Coherencia con la interfaz de 3 módulos:** Cualquier actualización visual o documental debe preservar la organización sintetizada en el **Módulo 01 (`Análisis`)**, el **Módulo 02 (`Explorar Mapa`**, con sus 5 mapas base sin clave de API y el panel inferior **Detalles**) y el **Módulo 03 (`Documentación`**, con sus 6 capítulos navegables `DOC · 01` a `DOC · 06`), así como la disposición en cabecera del **Tutorial Interactivo** (a la izquierda del título) y el **Glosario de siglas** (a la derecha del título).
4. **Verificación local previa a la publicación:** Antes de subir cambios a producción, se comprueba localmente la integridad de las capas (`scripts/verificar_conteo_capas.py` y `scripts/verificar_integridad_despliegue.py`) para que la publicación web en Netlify se realice de manera directa, rápida y sin interrupciones.

---

### 11.1. Catálogo descriptivo de todos los archivos del repositorio y de la plataforma

A continuación se presenta el catálogo general de los archivos y carpetas que componen el repositorio y la plataforma web, con una explicación sencilla y clara de su función, facilitando su comprensión para cualquier persona u organismo que desee consultar, actualizar o replicar el Atlas:

#### A. Archivos principales de la raíz del repositorio (`/`)

| Archivo o Carpeta | ¿Para qué sirve y cuál es su función en lenguaje claro? |
| :--- | :--- |
| [`README.md`](../../README.md) | **Presentación general del proyecto:** Explica de forma directa qué es el Atlas, sus objetivos estratégicos, cifras clave verificadas (294 capas, 5 dimensiones, 83 mapas), la matriz de los 9 hitos y los enlaces de acceso público. |
| [`MANUAL_USO.md`](MANUAL_USO.md) | **Manual de usuario de la plataforma:** Guía práctica paso a paso para navegar por los 3 módulos, usar el visor cuadrado, alternar los 5 mapas base sin clave de API, personalizar colores con la simbología Jenks, usar el Inspector Normativo PRC y leer el panel Detalles. |
| [`MANUAL_ACTUALIZACION_ATLAS.md`](MANUAL_ACTUALIZACION_ATLAS.md) | **Manual maestro de actualización técnica:** Este documento. Detalla la formulación estratégica, la matriz de hitos, la estructura de datos, el perfil de 17 atributos, la guía de los 4 ejes diagnósticos y las pautas para mantener o replicar el Atlas. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | **Guía de contribución y buenas prácticas:** Explica los pasos para incorporar nuevas capas al catálogo, actualizar los textos de los manuales y mantener la coherencia de estilos y nombres en español. |
| [`PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md`](PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md) | **Protocolo de verificación previa al despliegue:** Procedimiento de auditoría local que comprueba que las 294 capas y catálogos estén completos antes de publicar en Netlify y GitHub Pages. |
| [`netlify.toml`](../../netlify.toml) | **Configuración de publicación web en Netlify:** Indica al servidor de internet que sirva la plataforma directamente desde la carpeta `src/`, garantizando una carga rápida y sin errores de tiempo de espera. |
| [`LICENSE`](../../LICENSE) | **Licencia de software libre (GNU AGPLv3):** Establece los términos legales abiertos bajo los cuales cualquier persona o institución puede usar, estudiar, modificar y compartir el código fuente de la plataforma. |
| [`requirements.txt`](../../requirements.txt) | **Librerías de apoyo en Python:** Lista las herramientas necesarias para ejecutar localmente los scripts de auditoría, generación de planillas Excel y empaquetado del archivo comprimido ZIP. |
| [`TODO_SIGUIENTE.md`](../../TODO_SIGUIENTE.md) | **Bitácora de seguimiento y mejoras:** Registro de tareas pendientes, ideas de desarrollo y siguientes pasos técnicos del proyecto. |
| [`Metricas_Calidad_ISO_Capas_Oficiales_Actualizado.numbers`](../../Metricas_Calidad_ISO_Capas_Oficiales_Actualizado.numbers) | **Planilla de cálculo de respaldo:** Archivo complementario con la evaluación de calidad de las fuentes oficiales del Estado de Chile. |

---

#### B. Archivos de la aplicación web en producción (`src/`)

| Archivo en `src/` | ¿Para qué sirve y cuál es su función en lenguaje claro? |
| :--- | :--- |
| [`src/index.html`](../index.html) | **Página web principal de la plataforma:** Reúne la estructura completa de la interfaz en una sola página: la cabecera con el Tutorial Interactivo y el Glosario, el Módulo 01 (Análisis), el Módulo 02 (Explorar Mapa), el Módulo 03 (Documentación) y el pie de página de licencias. |
| [`src/css/estilos.css`](../css/estilos.css) | **Diseño visual adaptable:** Controla los colores, tipografías, tarjetas y tamaños de pantalla, asegurando que la plataforma sea cómoda de leer y usar tanto en computadores como en tablets y celulares. |
| [`src/js/config.js`](../js/config.js) | **Configuración general del Atlas:** Define el título y subtítulo oficial, las coordenadas de encuadre para el Barrio Brasil y la Comuna de Santiago, la versión del sistema (`?v=...`) y las 5 Dimensiones Analíticas. |
| [`src/js/app.js`](../js/app.js) | **Coordinador general de la aplicación:** Controla la barra de navegación para cambiar entre los 3 módulos, sincroniza los títulos de la cabecera y gestiona las herramientas generales del visor. |
| [`src/js/modulos/tutorial_interactivo.js`](../js/modulos/tutorial_interactivo.js) | **Tutorial interactivo de 18 pasos:** Guía visual que enseña a recorrer la plataforma en 4 bloques temáticos, presentando cada módulo y explicando para qué sirve cada botón antes de utilizarlo. |
| [`src/js/modulos/indicadores_analisis.js`](../js/modulos/indicadores_analisis.js) | **Controlador del Módulo 01 (Análisis):** Muestra las 83 cartografías diagnósticas en visor ampliado (Lightbox), las tarjetas de las 5 Dimensiones y el acordeón buscador de las 294 capas con botón de encendido directo en el mapa. |
| [`src/js/modulos/catalogo_vgi_descentralizado.js`](../js/modulos/catalogo_vgi_descentralizado.js) | **Catálogo de las 171 capas ciudadanas (IGV):** Lista y clasifica las coberturas colaborativas levantadas por la comunidad (OpenStreetMap y GBIF), asignándoles su nombre en español, color, símbolo y dimensión analítica. |
| [`src/js/modulos/ide_chile.js`](../js/modulos/ide_chile.js) | **Catálogo de las 123 capas oficiales del Estado:** Lista las coberturas públicas del Estado de Chile (Censo 2024, PRC, RSH, ministerios y municipio) y administra la carga ordenada de los datos hacia el visor. |
| [`src/js/modulos/mapa.js`](../js/modulos/mapa.js) | **Controlador del Módulo 02 (Explorar Mapa):** Inicializa el visor cartográfico cuadrado (Leaflet), configura los 5 mapas base abiertos y satelitales sin API, dibuja las capas encendidas y actualiza el panel inferior Detalles con los 17 atributos homologados. |
| [`src/js/modulos/simbologia_dinamica.js`](../js/modulos/simbologia_dinamica.js) | **Herramienta de simbología y colores:** Permite al usuario elegir cualquier variable de una capa activa y colorearla en el mapa usando métodos de clasificación estadística (*Cortes Naturales de Jenks*, cuantiles o intervalos iguales). |
| [`src/js/modulos/evaluador_normativo.js`](../js/modulos/evaluador_normativo.js) | **Inspector normativo del Plan Regulador Comunal (PRC):** Al hacer clic sobre cualquier predio o manzana, consulta qué normas urbanísticas aplican (alturas máximas, constructibilidad, usos de suelo y protección patrimonial ZCH/ICH) y permite descargar el Certificado Normativo. |
| [`src/js/modulos/geodesia.js`](../js/modulos/geodesia.js) | **Herramienta de medición métrica de áreas:** Calcula la superficie exacta en metros cuadrados (`m²`) y hectáreas (`ha`) y el perímetro en metros (`m`) de cualquier sector delimitado por el usuario sobre el mapa. |
| [`src/js/modulos/manual.js`](../js/modulos/manual.js) | **Controlador del Módulo 03 (Documentación):** Construye los 6 capítulos interactivos con buscador en vivo, tablas de objetivos, hitos verificados, licencias, enlaces de descarga y el inventario filtrable de las 294 capas. |
| [`src/js/modulos/licencias.js`](../js/modulos/licencias.js) | **Información de licencias abiertas:** Explica de forma comprensible los términos legales bajo los cuales se pueden reutilizar los mapas, los datos y el software (Creative Commons, ODbL y Ley de Transparencia). |

---

#### C. Conjuntos de datos espaciales y tablas territoriales (`data/` y `src/data/`)

| Conjunto de Archivos | ¿Para qué sirve y cuál es su función en lenguaje claro? |
| :--- | :--- |
| `data/capa_*.geojson` e `ide_*.geojson` (294 capas) | **Las 294 coberturas vectoriales operativas del Atlas:** Cada archivo contiene puntos, líneas o polígonos correspondientes a un equipamiento o temática territorial (123 oficiales del Estado con clave `id_ig` y 171 colaborativas de IGV con clave `id_igv`), todas con sus 17 atributos homologados. |
| `matriz_sintesis_barrio_brasil_manzanas.geojson` | **Matriz territorial del Barrio Brasil:** Archivo espacial que consolida las variables sociodemográficas del Censo 2024, vulnerabilidad RSH y conteo de equipamientos en cada manzana del Barrio Brasil. |
| `resumen_catastro_vgi.csv` | **Resumen estadístico de datos ciudadanos:** Tabla con el recuento y clasificación de las 79.841 entidades colaborativas registradas en la comuna y el barrio. |
| `bip_inversiones_santiago.csv` | **Cartera de inversiones públicas comunales:** Listado de proyectos e iniciativas de inversión del Banco Integrado de Proyectos (BIP) y del MOP localizados en Santiago. |
| `barrios_santiago_con_zonas_aseo.geojson` | **Zonificación de aseo municipal:** Polígonos de las 5 zonas operativas de recolección de basura y aseo urbano de la Municipalidad de Santiago. |
| `zonas_aseo_contenedores_papeleros_santiago.geojson` | **Catastro de infraestructura de aseo:** Puntos georreferenciados de contenedores públicos de basura y papeleros en la comuna. |
| `semaforos_rm_uoct_2026.geojson` | **Red de semáforos de Santiago:** Ubicación oficial de las intersecciones semaforizadas administradas por la Unidad Operativa de Control de Tránsito (UOCT). |
| `ZCH_ICH_RM_Patrimonio_IPT.geojson` | **Catastro de patrimonio protegido:** Cobertura de las Zonas de Conservación Histórica (`ZCH`) e Inmuebles de Conservación Histórica (`ICH`) del Plan Regulador. |

---

#### D. Documentación técnica, catálogos maestros y geodatabase descargable (`docs/` y `src/docs/`)

| Archivo en `docs/` | ¿Para qué sirve y cuál es su función en lenguaje claro? |
| :--- | :--- |
| [`geodatabase_completa_atlas_vgi.zip`](geodatabase_completa_atlas_vgi.zip) | **Paquete maestro descargable (542,35 MB):** Reúne en un único archivo comprimido las 294 coberturas GeoJSON, las matrices territoriales, los 3 libros maestros en Excel y todos los manuales para trabajar sin conexión en programas SIG (como QGIS o ArcGIS). |
| [`categorias_tematicas_osm.xlsx`](categorias_tematicas_osm.xlsx) | **Libro Excel de Dimensiones y Capas IGV:** Planilla con la definición de las 5 Dimensiones Analíticas, el inventario de las 171 capas ciudadanas, sus etiquetas equivalentes en OpenStreetMap/GBIF y el diccionario de variables. |
| [`catalogo_fuentes_vgi.xlsx`](catalogo_fuentes_vgi.xlsx) | **Libro Excel del Catálogo de 294 Fuentes:** Planilla con el registro detallado de las 123 fuentes oficiales del Estado y las 171 fuentes colaborativas de IGV, indicando institución custodia, escala de captura, año y tipo de licencia. |
| [`perfil_metadatos_vgi.xlsx`](perfil_metadatos_vgi.xlsx) | **Libro Excel de Metadatos y Calidad ISO:** Planilla que explica la estructura de los 17 atributos homologados aplicados a todas las capas y las normas internacionales de calidad cartográfica aplicadas (ISO 19115 e ISO 19157). |
| [`ARQUITECTURA.md`](ARQUITECTURA.md) | **Documento de arquitectura del sistema:** Explica cómo se organizan los 3 módulos de la plataforma, cómo fluyen los datos desde su origen hasta el navegador del usuario y cómo se sincronizan los archivos. |
| [`TRAZABILIDAD.md`](TRAZABILIDAD.md) | **Documento de trazabilidad y usabilidad:** Describe los fundamentos de la Información Geográfica Voluntaria (IGV), la articulación en 5 dimensiones y los resultados de las evaluaciones de usabilidad con vecinos y profesionales. |
| [`BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md`](BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md) | **Compendio bibliográfico (APA 7ª ed.):** Reúne 125 referencias académicas, metodológicas y cuerpos legales chilenos que respaldan las decisiones del Atlas. |

---

#### E. Cartografías temáticas diagnósticas (`src/img/cartografias/`)

| Grupo de Imágenes en `src/img/cartografias/` | ¿Para qué sirve y cuál es su función en lenguaje claro? |
| :--- | :--- |
| `14 archivos .jpg` (Eje 01 · Concentración KDE) | **Lámina 01 del Módulo 01:** Mapas de alta resolución que muestran en una malla de 20 metros la intensidad y aglomeración de equipamiento, comercio barrial, gastronomía y movilidad colaborativa en Santiago. |
| `11 archivos .jpg` (Eje 02 · Autocorrelación LISA) | **Lámina 02 del Módulo 01:** Mapas que comparan cada manzana censal con su entorno para identificar sectores bien dotados (*Alto-Alto*) y sectores de rezago prioritarios para inversión (*Bajo-Bajo*). |
| `34 archivos .jpg` (Eje 03 · Demografía y Cités) | **Lámina 03 del Módulo 01:** Mapas que combinan los resultados del Censo 2024, los tramos de vulnerabilidad del RSH 2026, el catastro de cités históricos y las iniciativas del Banco Integrado de Proyectos (BIP). |
| `24 archivos .jpg` (Eje 04 · Metabolismo y Movilidad) | **Lámina 04 del Módulo 01:** Mapas de caminabilidad peatonal a parques y salud (isócronas de 5 y 15 min), mapas de ruido vial (`>68 dBA`), arbolado urbano y zonas de aseo municipal (SUBDERE RSD 2024). |

---

#### F. Scripts de soporte, verificación y automatización (`scripts/`)

| Script en `scripts/` | ¿Para qué sirve y cuál es su función en lenguaje claro? |
| :--- | :--- |
| `scripts/verificar_conteo_capas.py` | **Comprobador de capas:** Programa que revisa automáticamente que el catálogo contenga exactamente las 294 coberturas requeridas (123 oficiales del Estado + 171 de IGV). |
| `scripts/verificar_integridad_despliegue.py` | **Auditor de integridad:** Comprueba que todos los archivos GeoJSON, libros Excel y el paquete ZIP descargable estén completos y sin errores antes de publicar cambios en internet. |
| `scripts/enriquecer_base_datos_metadatos.py` | **Estandarizador de atributos:** Inyecta en cada archivo GeoJSON el perfil homologado de 17 atributos ISO, asignando `id_ig` a las capas estatales e `id_igv` a las colaborativas. |
| `scripts/generar_catalogos_excel.py` | **Generador de planillas:** Construye de forma automatizada los 3 libros maestros en Excel (`.xlsx`) a partir de la información actualizada del proyecto. |
| `scripts/empaquetar_base_datos_completa.py` | **Empaquetador del ZIP:** Comprime las 294 coberturas espaciales y la documentación en el archivo maestro descargable `geodatabase_completa_atlas_vgi.zip` (542,35 MB). |
| `scripts/descargar_todas_las_categorias_osm.py` | **Extractor de datos ciudadanos:** Script de apoyo para consultar y descargar coberturas actualizadas desde la base colaborativa de OpenStreetMap. |
| `scripts/db/01_schema_postgis.sql` y `02_seed_metadata.sql` | **Estructura de respaldo en base de datos:** Archivos de diseño para respaldar la información del Atlas en una base de datos relacional y espacial (PostgreSQL con PostGIS). |
