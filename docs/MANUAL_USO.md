# Manual de Uso — Atlas para la Gestión Territorial
## Análisis y Exploración | Municipio de Santiago y Barrio Brasil

* **Plataforma Web en Producción:** [https://atlasvgiuah.netlify.app](https://atlasvgiuah.netlify.app)
* **Repositorio Espejo (GitHub Pages):** [https://geojota.github.io/atlas-vgi-barrio-brasil/](https://geojota.github.io/atlas-vgi-barrio-brasil/)
* **Geodatabase consolidada descargable (`.zip`):** `docs/geodatabase_completa_atlas_vgi.zip` (`542,35 MB` comprimidos; `294` capas cartográficas operativas).

---

## 1. Propósito del Atlas y a quién está dirigido este manual

El **Atlas para la Gestión Territorial (Análisis y Exploración | Municipio de Santiago y Barrio Brasil)** es una herramienta pública, abierta y gratuita que reúne en un mismo lugar dos grandes fuentes de conocimiento sobre la ciudad:
1. **La información oficial del Estado de Chile (`123` coberturas identificadas con la clave `id_ig`):** proveniente del Censo de Población y Vivienda 2024 (INE), el Registro Social de Hogares (RSH), el Plan Regulador Comunal de Santiago (PRC / MINVU), el Consejo de Monumentos Nacionales (CMN), la SUBDERE, el Servicio de Impuestos Internos (SII) y la Ilustre Municipalidad de Santiago.
2. **La Información Geográfica Voluntaria (`171` coberturas descentralizadas identificadas con la clave `id_igv`):** levantada de forma colaborativa por comunidades ciudadanas y científicas en **OpenStreetMap (OSM)** y en la red mundial de biodiversidad **GBIF**, que registra el equipamiento cotidiano a escala de calle y cuadra (comercios de barrio, ciclovías, paraderos, grifos, farmacias, desfibriladores, luminarias y especies de arbolado y aves urbanas).

Para que cualquier persona —tanto si es vecina o dirigente barrial sin experiencia previa en mapas digitales, como si forma parte de un equipo técnico municipal, una organización social o un grupo de investigación universitaria— pueda recorrer la plataforma con comodidad, el **Prototipo 02** organiza todas sus funciones en **tres módulos claros** acompañados por una **cabecera de ayuda permanente**:

```mermaid
flowchart LR
    subgraph CAB["Cabecera Superior Permanente"]
        TUT["Izquierda del Título:\nTutorial Interactivo\n(18 pasos navegables en 4 bloques)"]
        TIT["Centro:\nAtlas para la Gestión Territorial\nAnálisis y Exploración | Municipio de Santiago y Barrio Brasil"]
        GLO["Derecha del Título:\nGlosario de Siglas\n(Buscador instantáneo)"]
    end

    subgraph MODS["Los 3 Módulos Operativos de la Plataforma"]
        M1["Módulo 01 · Análisis\n4 Ejes Geoestadísticos (83 mapas)\n5 Dimensiones Analíticas\nAcordeón de 294 Capas"]
        M2["Módulo 02 · Explorar Mapa\nVisor cuadrado Leaflet 1.9.4\n5 Mapas Base sin API · Inspector PRC\nSimbología Jenks · Panel Detalles"]
        M3["Módulo 03 · Documentación\n6 Capítulos Navegables (DOC·01 a 06)\nDescarga de 3 Libros Excel y ZIP\nInventario Filtrable de 294 Capas"]
    end

    CAB --> MODS
    M1 <-->|"Activar capa en el mapa /\nVer Atlas de Análisis"| M2
    M2 <-->|"Consultar manual o\ndescargar base .zip"| M3
```

---

## 2. Cómo empezar: La Cabecera Superior, el Tutorial Interactivo y el Glosario de Siglas

En la franja superior de la pantalla encontrará siempre visibles el título oficial de la plataforma y dos botones de apoyo ubicados en extremos opuestos para que nunca se superpongan entre sí:

### 2.1. El Tutorial Interactivo (a la izquierda del título)
Si es la primera vez que ingresa al Atlas, le recomendamos pulsar el botón **Tutorial Interactivo** situado a la izquierda del título principal.
* **¿Cómo funciona?** Se abrirá una guía paso a paso compuesta por **18 etapas organizadas en 4 bloques navegables** (*Visión General*, *Módulo 01 · Análisis*, *Módulo 02 · Mapa* y *Módulo 03 · Documentación*).
* **Presentación de cada módulo antes de sus herramientas:** Antes de mostrar botones específicos, el tutorial explica primero qué es cada módulo y para qué sirve en la gestión territorial, cambiando automáticamente de pestaña a medida que usted avanza.
* **Navegación libre:** Usted puede usar los botones *Anterior* y *Siguiente*, saltar directamente a cualquiera de los 4 bloques desde la barra superior de la tarjeta del tutorial, o cerrarlo en cualquier momento con `Cerrar (Esc)`.

### 2.2. El Glosario de Siglas (a la derecha del título)
En la planificación urbana y en las bases de datos públicas es habitual encontrar siglas técnicas (`IGV`, `IDE`, `PRC`, `OGUC`, `ZCH`, `ICH`, `KDE`, `LISA`, `RSH`, `BIP`, `SUBDERE`, `CESFAM`, `ODbL`).
* **¿Para qué sirve?** Al pulsar el botón **Glosario de siglas** a la derecha del título, se despliega un recuadro con buscador instantáneo donde cada sigla está explicada en lenguaje claro y directo, sin necesidad de salir de la vista en la que esté trabajando.

```mermaid
flowchart LR
    subgraph TUT_BLOQUES["Estructura de los 18 Pasos del Tutorial Interactivo (4 Bloques Navegables)"]
        B_GEN["Bloque 1 · Visión General\n(Pasos 1 a 3)\nPropósito del Atlas, navegación\nen 3 módulos y uso del Glosario"]
        B_M01["Bloque 2 · Módulo 01 Análisis\n(Pasos 4 a 8)\nPresenta el Módulo 01 completo,\n4 láminas (83 mapas) y 5 Dimensiones"]
        B_M02["Bloque 3 · Módulo 02 Mapa\n(Pasos 9 a 14)\nPresenta el Módulo 02 completo, barra\nsuperior, 5 mapas base, Jenks, PRC y Detalles"]
        B_M03["Bloque 4 · Módulo 03 Documentación\n(Pasos 15 a 18)\nPresenta el Módulo 03 completo, 6 capítulos,\ndescargas Excel/ZIP e inventario de 294 capas"]
    end

    B_GEN --> B_M01 --> B_M02 --> B_M03
```

---

## 3. Guía paso a paso del Módulo 01: `Análisis`

El **Módulo 01 · Análisis** (`#panel-indicadores`) permite comprender qué ocurre en la Comuna de Santiago y en el Barrio Brasil a través de diagnósticos visuales ya procesados y listos para interpretar. Se divide en dos secciones principales:

### 3.1. Los 4 Ejes de Diagnóstico Geoestadístico (83 Cartografías Temáticas)
En la parte superior del Módulo 01 encontrará cuatro tarjetas correspondientes a las **4 láminas o guiones visuales de diagnóstico**. Al hacer clic en cualquiera de ellas se abre su galería interactiva con visor de alta resolución (zoom con rueda del ratón, pantalla completa y descarga de cada lámina en formato `.jpg`), acompañada de una explicación detallada y de una matriz que resume su utilidad para instituciones públicas, comunidad barrial, mapeadores voluntarios e investigadores:

| Lámina / Eje Geoestadístico | N° de Mapas | ¿Qué método utiliza y qué significa en lenguaje claro? | ¿Qué permite descubrir en Santiago y Barrio Brasil? |
| :--- | :---: | :--- | :--- |
| **Lámina 01 · Concentración Territorial de Actividad IGV en Santiago (KDE)** | `14` | Utiliza la **Estimación de Densidad por Núcleo (Kernel Density Estimation, KDE)** sobre **79.841 entidades** y **112.264 nodos** en una grilla de 20 metros. En lugar de mostrar miles de puntos encimados que no se pueden leer, calcula dónde se concentra con mayor intensidad la oferta de servicios, comercios, cultura y transporte. | Muestra el fuerte contraste entre el corredor central (Alameda, Casco Histórico y Barrio Brasil-Yungay), que concentra la mayor densidad de equipamiento cotidiano, y los sectores residenciales del sur de la comuna, donde la oferta mapeada disminuye. |
| **Lámina 02 · Segregación Espacial, Hotspots y Áreas de Rezago (LISA)** | `11` | Aplica el método de **Indicadores Locales de Asociación Espacial (LISA de Luc Anselin)** sobre las **1.711 manzanas censales** de Santiago. Compara cada manzana con sus manzanas vecinas inmediatas para identificar agrupamientos estadísticamente significativos. | Permite distinguir cuatro situaciones claras:<br>• **Alto-Alto (Rojo / Hotspot):** Manzanas con alta dotación rodeadas de vecinas también bien dotadas.<br>• **Bajo-Bajo (Azul / Coldspot):** Bolsones de rezago donde varias manzanas vecinas carecen simultáneamente de cobertura.<br>• **Alto-Bajo y Bajo-Alto:** Transiciones bruscas o islas dentro del tejido urbano. |
| **Lámina 03 · Estructura Sociodemográfica, Habitabilidad y Morfología Urbana** | `34` | Cruza los datos oficiales del **Censo de Población y Vivienda 2024 (INE)** con los tramos de vulnerabilidad del **Registro Social de Hogares (RSH 2026)**, el catastro de **cités y pasajes patrimoniales**, la edad constructiva del SII y la cartera de inversiones públicas del **BIP**. | Revela dónde residen más personas mayores o población infantil, qué unidades vecinales presentan mayor vulnerabilidad socioeconómica, dónde se localizan los cités históricos del Barrio Brasil y cómo contrasta la edificación patrimonial de baja altura con los bordes de renovación inmobiliaria en altura. |
| **Lámina 04 · Metabolismo Urbano, Movilidad y Espacio Público** | `24` | Evalúa el funcionamiento ambiental y la **accesibilidad caminable** (isócronas peatonales de 5 y 15 minutos) hacia parques, transporte y salud, junto con los mapas acústicos del Ministerio del Medio Ambiente y las zonas de recolección de residuos (**SUBDERE RSD 2024**). | Identifica qué manzanas están a más de 10 o 15 minutos a pie de un área verde o centro de salud, qué corredores viales superan el umbral crítico de ruido diurno/nocturno (**> 68 dBA**, como Ruta 5, Alameda y Av. Brasil) y cómo operan las 5 zonas municipales de aseo. |

### 3.2. Las 5 Dimensiones Analíticas y el Explorador Acordeón de las 294 Capas
Debajo de las cuatro láminas geoestadísticas, el Módulo 01 organiza la totalidad de las **294 coberturas cartográficas del Atlas** (`123` oficiales del Estado + `171` colaborativas de IGV) en **5 Dimensiones Analíticas**:

1. **Dimensión Sociodemográfica y Habitacional:** Población y vivienda del Censo 2024, vulnerabilidad social del RSH, hacinamiento, arriendo, cités, permisos de edificación y recepciones definitivas.
2. **Dimensión Socioeconómica y Comercial:** Proyectos de inversión pública (BIP y MOP), comercio local y gastronomía barrial, ferias libres, mercados, bancos, servicios y telecomunicaciones.
3. **Dimensión Socioambiental y Espacio Público:** Parques y plazas públicas, arbolado urbano, 52 coberturas de flora y fauna ciudadana (GBIF), islas de calor, ruido ambiental (`>68 dBA`), puntos limpios y zonas de aseo municipal (SUBDERE RSD).
4. **Dimensión Sociosanitaria y Salud:** Hospitales, consultorios y CESFAM, clínicas, farmacias, desfibriladores externos automáticos (DEA), grifos contra incendios y recintos deportivos.
5. **Dimensión Sociourbana, Movilidad y Normativa:** Zonificación del Plan Regulador Comunal (PRC Santiago), Zonas e Inmuebles de Conservación Histórica (`ZCH`/`ICH`), Monumentos Nacionales (CMN), estaciones de Metro, paraderos Red, ciclovías y luminarias.

**¿Cómo activar cualquier capa desde el Módulo 01?**
* Puede abrir cualquiera de los 5 acordeones temáticos o escribir una palabra clave en el buscador en español (por ejemplo, *"farmacias"*, *"cités"*, *"arbolado"*, *"censo"* o *"prc"*).
* Al pulsar el botón **"Activar en el mapa"** junto al nombre de una capa, el Atlas cambia automáticamente al **Módulo 02 (Explorar Mapa)**, enciende esa cobertura sobre el territorio y despliega su simbología.

```mermaid
flowchart TD
    subgraph M01_FLUJO["Flujo de Exploración en el Módulo 01 · Análisis (#panel-indicadores)"]
        EJE["1. Cuatro Ejes Geoestadísticos\n83 Cartografías Temáticas en Visor Lightbox\n(KDE · LISA · Censo 2024/RSH · Metabolismo Urbano)"]
        DIM["2. Cinco Dimensiones Analíticas\n1. Sociodemográfica · 2. Socioeconómica · 3. Socioambiental\n4. Sociosanitaria · 5. Sociourbana y Normativa"]
        ACO["3. Acordeón Buscador de las 294 Capas\n123 Oficiales (id_ig) + 171 IGV (id_igv)"]
    end

    EJE --> DIM --> ACO
    ACO -->|"Clic en 'Activar en el mapa'"| VIS["Salto automático al Módulo 02 (Explorar Mapa)\ncon la capa encendida y centrada"]
```

---

## 4. Guía paso a paso del Módulo 02: `Explorar Mapa`

El **Módulo 02 · Explorar Mapa** (`#panel-inicio`) es el entorno interactivo para recorrer las calles, manzanas y predios del Barrio Brasil y de la Comuna de Santiago, superponer capas, medir superficies, consultar el Plan Regulador e inspeccionar los datos detallados de cada lugar.

```mermaid
flowchart TD
    subgraph BARRA["1. Barra Superior Centrada (#barra-herramientas-mapa)"]
        B1["Área de enfoque:\nBarrio Brasil / Comuna de Santiago"]
        B2["Delimitar área:\nCálculo métrico EPSG:32719 (m² y ha)"]
        B3["Reencuadrar vista"]
        B4["Inspector normativo (PRC):\nConsulta punto en polígono bajo demanda"]
        B5["Exportar vista GeoJSON /\nDescargar base .zip"]
    end

    subgraph CENTRO["2. Cuerpo Central del Módulo 02"]
        LAT["Panel Lateral Izquierdo:\nBuscador de las 294 Capas por las\n5 Dimensiones + Simbología Dinámica (Jenks)"]
        VISOR["Lienzo Cartográfico Cuadrado (Leaflet 1.9.4)\n5 Mapas Base sin API:\nOSM Estándar · OSM HOT · Bing Satelital ·\nBing Híbrido con Calles · Esri World Imagery"]
    end

    subgraph INF["3. Panel Inferior de Ancho Completo: 'Detalles'"]
        DET["Atributos Nativos de la Entidad + Perfil Homologado de 17 Atributos ISO 19115 / 19157\n(Clave id_ig para las 123 capas oficiales | Clave id_igv para las 171 capas colaborativas IGV)\n+ Ficha del Inspector Normativo PRC (cuando se activa la consulta normativa)"]
    end

    BARRA --> CENTRO --> INF
```

### 4.1. Cómo usar los controles de la Barra Superior Centrada
Encima del visor encontrará una barra de herramientas centrada y adaptable a cualquier pantalla:
1. **Selector `Área de enfoque` (*Barrio Brasil Completo* / *Comuna de Santiago*):** Permite alternar con un clic entre el encuadre cercano de las manzanas del Barrio Brasil y la vista general de las 26 unidades vecinales de la Comuna de Santiago.
2. **Botón `Delimitar área` (Medición geodésica en `EPSG:32719`):** Al activarlo y arrastrar el cursor sobre el mapa, usted dibuja un polígono de análisis. La plataforma transforma automáticamente las coordenadas geográficas (`EPSG:4326`) al sistema métrico oficial de Chile (**SIRGAS-Chile / UTM Huso 19 Sur, `EPSG:32719`**) y calcula con precisión su superficie en metros cuadrados (`m²`) y hectáreas (`ha`), filtrando los elementos que caen dentro del recuadro.
3. **Botón `Reencuadrar`:** Si hizo mucho zoom o desplazó el mapa lejos del área de estudio, pulse este botón para volver de inmediato al encuadre óptimo.
4. **Botón `Inspector normativo (PRC)`:** Activa el modo de consulta urbanística sobre el Plan Regulador Comunal de Santiago (véase la sección 4.4 más abajo).
5. **Botón `Ver Atlas de Análisis`:** Regresa al Módulo 01 conservando las capas que usted dejó encendidas en el mapa.
6. **Botón `Exportar vista (GeoJSON)`:** Descarga en su equipo un archivo `.geojson` con las capas activas en ese momento, incluyendo sus colores y estilos para abrirlo directamente en QGIS o ArcGIS.
7. **Botón `Descargar base de datos (.zip)`:** Descarga el paquete completo de `542,35 MB` con las 294 coberturas, catálogos Excel y documentación.

### 4.2. Cómo elegir entre los 5 Mapas Base Abiertos y Satelitales (Sin clave de API)
En la esquina del visor (o en el selector de mapa base) puede elegir en cualquier momento el fondo cartográfico sobre el cual se dibujan las capas. En el Prototipo 02 se utilizan exclusivamente **5 mapas base estables que no requieren claves de API comerciales** (habiendo eliminado los antiguos fondos de Carto):

| N° | Nombre del Mapa Base | Proveedor | ¿Para qué tipo de lectura o tarea se recomienda? |
| :---: | :--- | :--- | :--- |
| `01` | **OpenStreetMap Estándar** *(Predeterminado)* | OpenStreetMap Foundation | Lectura detallada de nombres de calles, sentido de circulación vehicular, numeración predial, pasajes, plazas y comercio de barrio. |
| `02` | **OpenStreetMap Humanitario (HOT)** | Humanitarian OpenStreetMap Team | Ofrece un fondo claro y de tonos suaves que hace resaltar con gran nitidez los colores de las capas temáticas superpuestas y los servicios de emergencia o salud. |
| `03` | **Imagen Satelital (Bing / Microsoft)** | Microsoft VirtualEarth | Fotografía aérea y satelital de alta resolución para observar techumbres, patios interiores de cités, estacionamientos, sitios eriazos y copas reales de árboles. |
| `04` | **Satelital Híbrido con Calles (Bing / Microsoft)** | Microsoft VirtualEarth | Combina la imagen satelital de alta resolución de Bing/Microsoft con los nombres de las calles y avenidas superpuestos en español para no perder la orientación. |
| `05` | **Imagen Satelital (Esri World Imagery)** | Esri / Maxar / Earthstar Geographics | Mosaico satelital alternativo de alta definición, muy útil para comparar el estado de las edificaciones y áreas verdes entre distintas tomas satelitales. |

### 4.3. Cómo personalizar colores y clasificaciones con la `Simbología Dinámica`
En el panel lateral del Módulo 02 se encuentra la herramienta **Simbología Dinámica**, que permite cambiar en vivo cómo se colorean los datos de cualquier capa activa:
* **Elección de variable (atributo):** Seleccione el campo numérico o de texto que desea representar (por ejemplo, total de población, porcentaje de hogares vulnerables, avalúo o tipo de zona).
* **Métodos de clasificación estadística y representación disponibles (asignación predeterminada racional según los datos):**
  * **Color Único (*Plano*):** Asigna un color semántico uniforme a toda la capa (predeterminado para las 171 capas colaborativas IGV puntuales o lineales y coberturas sin variable de clasificación).
  * **Categorizado (*Valores únicos*):** Asigna un color diferente a cada categoría nominal hasta las 9 clases principales más «Otras categorías» (predeterminado para zonas del PRC, zonas de aseo, líneas de Metro o tipos de áreas verdes).
  * **Cuantiles (*Quantiles*):** Divide las manzanas o entidades en grupos con igual cantidad de elementos (predeterminado para porcentajes y quintiles comparativos del RSH).
  * **Cortes Naturales de Jenks (*Natural Breaks*):** Agrupa valores continuos muy desiguales separando saltos naturales de la distribución (predeterminado para totales censales por manzana, avalúos y catastro predial).
  * **Intervalos Iguales y *Pretty Breaks*:** Dividen el rango entre el mínimo y el máximo en tramos idénticos o límites redondeados legibles (predeterminado para densidades lineales, conteos de eventos o potencia instalada).
  * **Desviación Estándar:** Destaca qué unidades se alejan por encima o por debajo del promedio comunal.
* **Número de clases y paletas de colores:** Permite elegir entre `3` y `7` clases y aplicar rampas cromáticas accesibles (*Viridis*, *Amarillo-Naranja-Rojo*, *Azules*, *Verdes*, *Púrpuras* o *Espectral*), actualizando al instante el mapa y su leyenda.

### 4.4. Cómo consultar qué se puede construir o proteger con el `Inspector Normativo (PRC)`
El **Inspector normativo (PRC)** traduce la normativa urbanística del **Plan Regulador Comunal de Santiago** y la **Ordenanza General de Urbanismo y Construcciones (OGUC)** a una ficha clara y fácil de leer:
1. Pulse el botón **Inspector normativo (PRC)** en la barra superior del Módulo 02 para activarlo.
2. Haga clic sobre cualquier manzana, lote o plaza del mapa.
3. En el panel inferior se desplegará automáticamente la ficha normativa de ese punto exacto (mientras no se active el inspector, esta ficha permanece oculta para no recargar la vista), informando:
   * **Zona del Plan Regulador Comunal** (por ejemplo, `Zona A`, `Zona B`, `Zona D - Zona de Conservación Histórica`, `Sector Especial`).
   * **Normas de edificación:** Altura máxima permitida en metros y pisos aproximados, coeficiente de constructibilidad, porcentaje máximo de ocupación de suelo y sistema de agrupamiento (continuo, pareado o aislado).
   * **Usos de suelo permitidos y prohibidos:** Residencial, equipamiento (salud, educación, cultura, comercio), actividades productivas o área verde.
   * **Protección patrimonial:** Indica si el predio corresponde a un **Inmueble de Conservación Histórica (`ICH`)**, se ubica dentro de una **Zona de Conservación Histórica (`ZCH`)** o es **Monumento Histórico / Zona Típica (CMN)**, además de permitir descargar un **Certificado de Informaciones Normativas (`.txt`)** de referencia y consultar el expediente histórico de modificaciones del PRC en el Barrio Brasil (1990–2024).

### 4.5. Cómo leer el panel inferior de `Detalles` y los 17 atributos homologados (`id_ig` / `id_igv`)
Debajo del lienzo cuadrado del mapa se ubica el panel de ancho completo llamado **Detalles**. Cada vez que usted hace clic sobre un punto, una línea o un polígono en el visor, este panel muestra tanto los **atributos propios de la capa** como su **ficha estandarizada de 17 atributos de metadatos y calidad espacial (normas ISO 19115 e ISO 19157)**:

* **¿Cuál es la diferencia entre `id_ig` e `id_igv`?**
  * Si el primer atributo del elemento es **`id_ig`**, usted está consultando un registro perteneciente a una de las **123 capas oficiales del Estado de Chile** (Información Geográfica oficial).
  * Si el primer atributo del elemento es **`id_igv`**, usted está consultando un registro perteneciente a una de las **171 capas descentralizadas de Información Geográfica Voluntaria** (levantado por la comunidad en OpenStreetMap o GBIF).
* **¿Qué informan los otros 16 atributos?** Indican en español claro el nombre del elemento, su dimensión analítica, subtipo, institución o comunidad custodia, licencia abierta aplicable, escala de captura, sistema de referencia (`EPSG:4326` / `EPSG:32719`), superficie o longitud métrica, fecha de actualización y las métricas de calidad ISO 19157 (exactitud posicional, consistencia topológica, completitud de datos, exactitud temática y linaje de procesamiento):

| N° | Atributo en el Panel `Detalles` | Estándar ISO | ¿Qué informa en lenguaje claro? |
| :---: | :--- | :---: | :--- |
| `01` | **`id_ig` / `id_igv`** | ISO 19115 | Código único del registro: **`id_ig`** si pertenece a una de las 123 capas oficiales del Estado o **`id_igv`** si pertenece a una de las 171 capas colaborativas de IGV. |
| `02` | `nombre_capa` | ISO 19115 | Nombre oficial en español de la cobertura cartográfica dentro de las 294 capas del Atlas. |
| `03` | `dimension_analitica` | ISO 19115 | A cuál de las 5 Dimensiones Analíticas del territorio pertenece la capa. |
| `04` | `tipo_fuente` | ISO 19115 | Distingue entre `Información Geográfica Oficial (Estado de Chile)` e `Información Geográfica Voluntaria (IGV Descentralizada)`. |
| `05` | `institucion_custodia` | ISO 19115 | Organismo público responsable (INE, MINVU, MDSF, SUBDERE, SII, CMN, MuniStgo) o comunidad colaborativa (`OpenStreetMap Chile` / `GBIF`). |
| `06` | `sistema_referencia` | ISO 19115 | Coordenadas geográficas `EPSG:4326 (WGS 84)` para el visor web y proyección métrica `EPSG:32719 (SIRGAS-Chile UTM 19S)` para mediciones en metros. |
| `07` | `escala_referencia` | ISO 19115 | Nivel de detalle cartográfico de levantamiento (`1:1.000` a `1:5.000` barrial; `1:10.000` a `1:25.000` comunal). |
| `08` | `fecha_actualizacion` | ISO 19115 | Fecha verificada de última actualización o corte de extracción de los datos (`AAAA-MM-DD`). |
| `09` | `licencia_uso` | ISO 19115 | Régimen jurídico abierto: `Datos Abiertos del Estado (Ley N.° 20.285)`, `ODbL 1.0 (OpenStreetMap)` o `CC BY 4.0 (GBIF)`. |
| `10` | `exactitud_posicional` | ISO 19157 | Precisión de la ubicación geométrica respecto de la cartografía catastral y ortofotografías satelitales. |
| `11` | `consistencia_topologica` | ISO 19157 | Validez geométrica OGC Simple Features / RFC 7946 (polígonos cerrados y sin auto-intersecciones). |
| `12` | `completitud` | ISO 19157 | Nivel de presencia de atributos descriptivos completos dentro del área de estudio. |
| `13` | `exactitud_tematica` | ISO 19157 | Verificación de que la clasificación o categoría temática asignada al objeto es correcta. |
| `14` | `consistencia_temporal` | ISO 19157 | Vigencia temporal del registro dentro del periodo operativo del Atlas (`2024–2026`). |
| `15` | `linaje_fuente` | ISO 19157 | Trazabilidad del proceso de captura, reproyección, limpieza topológica y homologación de atributos. |
| `16` | `cobertura_territorial` | ISO 19115 | Alcance espacial de la capa (`Barrio Brasil`, `Comuna de Santiago` o `Región Metropolitana`). |
| `17` | `archivo_origen` | ISO 19115 | Ruta exacta del archivo `.geojson` en el repositorio (`data/<archivo>.geojson`). |

---

## 5. Guía paso a paso del Módulo 03: `Documentación`

El **Módulo 03 · Documentación** (`#panel-manual`) integra dentro de la misma plataforma toda la documentación de uso, licencias, catálogos y arquitectura técnica para que pueda consultarse sin necesidad de abrir archivos externos. Cuenta con un **buscador en tiempo real** y un índice lateral dividido en **6 capítulos navegables (`DOC · 01` a `DOC · 06`)**:

| Capítulo en la Plataforma | Título del Capítulo | ¿Qué puede consultar o descargar en él? |
| :---: | :--- | :--- |
| **`DOC · 01`** | **Fundamentación, Objetivos, Hitos con Entregables Verificados y Perfiles de Uso** | Explica qué problema resuelve el Atlas, presenta el Objetivo General y los Objetivos Específicos (`OE 1` a `OE 4`), detalla la tabla de los **9 Hitos con entregable verificado asociado (`Hito 1 / E1` a `Hito 9 / E9`)** y orienta a cada uno de los 4 perfiles de usuarios sobre cómo recorrer la plataforma. |
| **`DOC · 02`** | **Guía en Profundidad del Módulo 01 (Análisis)** | Explica de manera pedagógica cómo leer los mapas de densidad **KDE**, cómo interpretar los clústeres **LISA** (`Alto-Alto`, `Bajo-Bajo`, `Alto-Bajo`, `Bajo-Alto`), qué muestran los mapas del Censo 2024, RSH y metabolismo urbano, y cómo usar las 5 Dimensiones Analíticas. |
| **`DOC · 03`** | **Guía en Profundidad del Módulo 02 (Explorar Mapa)** | Detalla cada botón de la barra superior, las características de los **5 mapas base sin API**, los métodos de clasificación de la **Simbología Dinámica (Jenks, Cuantiles, Intervalos)** y el diccionario completo de los **17 atributos homologados (`id_ig` / `id_igv`)** del panel **Detalles**. |
| **`DOC · 04`** | **Licencias Abiertas, Descarga de Geodatabase (.zip) y Catálogos en Excel** | Permite descargar con un clic el paquete completo `geodatabase_completa_atlas_vgi.zip` (`542,35 MB`), los 3 libros maestros en formato Excel (`categorias_tematicas_osm.xlsx`, `perfil_metadatos_vgi.xlsx` y `catalogo_fuentes_vgi.xlsx`), la bibliografía APA 7ª ed., y explica qué permite hacer cada licencia abierta (`CC BY 4.0`, `ODbL 1.0`, `Ley N.° 20.285` y `GNU AGPLv3`). |
| **`DOC · 05`** | **Inventario General Filtrable de las 294 Coberturas** | Tabla interactiva con filtro en vivo donde se listan las **123 capas oficiales (`id_ig`)** y las **171 capas colaborativas de IGV (`id_igv`)**, indicando su código, archivo `.geojson`, organismo o comunidad custodia y descripción temática. |
| **`DOC · 06`** | **Arquitectura del Sistema, Flujo de Datos y Guía de Actualización del Atlas** | Describe cómo están organizados los 3 módulos del Atlas, cómo fluyen los datos desde las fuentes hasta el navegador y resume los criterios generales para mantener actualizada la plataforma. |

```mermaid
flowchart LR
    M03["Módulo 03 · Documentación\n(#panel-manual)"]

    C1["DOC · 01\nObjetivos, 9 Hitos (E1-E9)\ny 4 Perfiles de Uso"]
    C2["DOC · 02\nGuía Módulo 01:\n83 Mapas (KDE/LISA) y\n5 Dimensiones"]
    C3["DOC · 03\nGuía Módulo 02:\n5 Mapas Base, Jenks,\nPRC y 17 Atributos"]
    C4["DOC · 04\nLicencias Abiertas,\n3 Libros Excel (.xlsx) y\nGeodatabase (.zip 542 MB)"]
    C5["DOC · 05\nInventario Filtrable de\nlas 294 Capas\n(123 id_ig + 171 id_igv)"]
    C6["DOC · 06\nArquitectura, Flujos y\nGuía de Actualización"]

    M03 --> C1 & C2 & C3 & C4 & C5 & C6
```

