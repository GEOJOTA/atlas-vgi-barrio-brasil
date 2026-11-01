# -*- coding: utf-8 -*-

SECCION_07 = r"""## 7. Desglose Quirúrgico de los Módulos del Sistema (Módulos 01 al 10)

La plataforma organiza sus capacidades en 10 módulos funcionales independientes y comunicados a través del orquestador [`src/js/app.js`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/src/js/app.js). A continuación se documenta la ingeniería interna de cada uno:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      NAVEGACIÓN SUPERIOR DEL ATLAS                     │
│  [01 Visor VGI]  [02 Overpass]  [03 Calidad ISO]  [04 GBIF]  [05 uMap] │
│  [06 Metadatos]  [07 Glosario]  [08 Licencias]    [09 Storyboards]     │
│  [10 Manual Técnico]                                                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 7.1. Módulo 01: Visor Cartográfico Interactivo y Atlas VGI
* **Propósito:** Núcleo espacial de visualización y consulta cruzada de las 131 capas cartográficas (121 oficiales del Estado y 10 VGI comunitarias), equipado con consola de filtrado, buscador reactivo, visualización de leyendas, inspector normativo y herramientas de medición de terreno.
* **Archivos Clave:**
  - `src/index.html` (líneas 70 a 350): Markup del contenedor `#mapa`, barra de herramientas, controles de capas y botones de descarga.
  - `src/js/modulos/mapa.js`: Inicialización del mapa Leaflet, definición de proveedores de teselas base (*basemaps*), administración de grupos de capas (`L.layerGroup()`), eventos de zoom y centrado.
  - `src/js/modulos/ide_chile.js`: Diccionario maestro de las 121 capas oficiales del Estado, funciones de petición asíncrona (`fetch`), parseo GeoJSON y asignación de estilos según categoría institucional.
  - `src/js/modulos/evaluador_normativo.js`: Motor analítico que detecta clics sobre el mapa, intersecta las coordenadas con las 192 zonas del Plan Regulador Comunal (PRC) de Santiago y genera el Certificado de Informaciones Normativas VGI (CIN-VGI).
  - `src/js/modulos/importador_capas.js`: Lógica de carga drag-and-drop de archivos vectoriales locales del usuario en formatos GeoJSON, KML y Shapefile comprimido en ZIP.
* **Flujo de Ejecución:**
  1. Al cargar la página, `app.js` invoca `ModuloMapa.inicializarMapa()`.
  2. Se renderiza el mapa centrado en Barrio Brasil y Campus UAH: latitud `-33.4442`, longitud `-70.6656`, zoom `16`.
  3. Se construyen dinámicamente las tarjetas de capas en la consola lateral (`crearBotonesCategorias()` para VGI y `crearBotonesCapasOficiales()` para capas del Estado).
  4. Cuando el usuario hace clic en el interruptor de una capa, se invoca `alternarCapaOficialIDE(idCapa)`:
     * Si no está cargada en memoria, se ejecuta `ModuloIDEChile.consultarCapaOficial(idCapa)`.
     * Se crea una capa Leaflet GeoJSON con su popup interactivo y se agrega a `capasOficialesLeaflet[idCapa].addTo(map)`.
     * Se actualizan los KPIs de la consola (capas activas, entidades visibles e ICV dinámico).
* **Cómo Modificar el Zoom y Centro Predeterminado:**
  Edite `src/js/config.js` o `src/js/modulos/mapa.js`:
  ```javascript
  // Coordenadas iniciales [latitud, longitud] y nivel de zoom
  const CENTRO_INICIAL = [-33.4442, -70.6656];
  const ZOOM_INICIAL = 16;
  ```

### 7.2. Módulo 02: Consultas Overpass QL en Vivo
* **Propósito:** Interfaz de consulta directa y extracción en tiempo real hacia la API de OpenStreetMap mediante lenguaje Overpass QL, permitiendo descargar datos vectoriales frescos de cualquier área geográfica.
* **Archivos Clave:** `src/js/modulos/osm.js`, `src/index.html` (`#panel-explorador-osm`).
* **Endpoints Utilizados:** `https://overpass-api.de/api/interpreter`, `https://lz4.overpass-api.de/api/interpreter`.
* **Cómo Funciona:** El usuario define un Bounding Box manual o hace clic en "Capturar BBox actual del mapa". Selecciona una clave OSM (ej. `amenity`, `highway`, `building`, `leisure`) y el módulo construye la consulta:
  ```text
  [out:json][timeout:25];
  (
    node["amenity"="school"](-33.45,-70.68,-33.43,-70.65);
    way["amenity"="school"](-33.45,-70.68,-33.43,-70.65);
    relation["amenity"="school"](-33.45,-70.68,-33.43,-70.65);
  );
  out body;
  >;
  out skel qt;
  ```
* **Manejo de Errores y Timeouts:** Si Overpass está saturado (HTTP 429 o 504), `osm.js` implementa reintentos automáticos hacia servidores espejo y, si persisten, ofrece descargar el extracto local correspondiente desde `src/data/`.

### 7.3. Módulo 03: Calidad VGI & Auditoría Histórica (ohsome API)
* **Propósito:** Evaluación cuantitativa de la evolución temporal, densidad de aportes y número de colaboradores activos en OpenStreetMap para el área de estudio mediante la API ohsome desarrollada por HeiGIT (Universidad de Heidelberg).
* **Archivos Clave:** `src/js/modulos/ohsome.js`, `src/js/modulos/calidad_analyst.js`, `src/js/modulos/evaluador_calidad_cuantitativa.js`.
* **Endpoints:** `https://api.ohsome.org/v1/elements/count`, `https://api.ohsome.org/v1/users/count`.
* **Métricas Extraídas:**
  - `densidad_elementos`: Elementos OSM por km² dentro del polígono de Barrio Brasil.
  - `colaboradores_unicos`: Número de mapeadores distintos que han editado la zona en los últimos 5 años.
  - `evolucion_anual`: Tasa de crecimiento interanual de geometrías de edificios y vías.

### 7.4. Módulo 04: Biodiversidad Colaborativa (GBIF)
* **Propósito:** Consulta y mapeo de observaciones biológicas georreferenciadas provenientes del Global Biodiversity Information Facility (GBIF) y registros ciudadanos de iNaturalist para el cuadrante urbano de Santiago Centro.
* **Archivos Clave:** `src/js/modulos/gbif.js`, `src/index.html` (`#panel-biodiversidad-gbif`).
* **Endpoint:** `https://api.gbif.org/v1/occurrence/search`.
* **Estándar:** Darwin Core (DwC). Extrae taxones validados (`scientificName`, `vernacularName`, `decimalLatitude`, `decimalLongitude`, `eventDate`, `datasetName`, `license`).
* **Filtrado Espacial:** Construye un polígono WKT (*Well-Known Text*) con el bounding box de Barrio Brasil para excluir registros imprecisos o con flag de coordenadas dudosas (`hasCoordinate=true` & `coordinateUncertaintyInMeters<100`).

### 7.5. Módulo 05: Cartografía Colaborativa Externa (uMap)
* **Propósito:** Integración de proyectos cartográficos comunitarios desarrollados en instancias uMap de OpenStreetMap, permitiendo embeber mapas temáticos locales y descargar sus geometrías.
* **Archivos Clave:** `src/js/modulos/umap.js`.
* **Mecanismo:** Incrustación mediante `<iframe>` con directivas seguras de aislamiento (`sandbox="allow-scripts allow-same-origin allow-popups"`). Implementa detección de restricciones CORS: si la instancia remota bloquea la descarga directa del GeoJSON por cabeceras `Access-Control-Allow-Origin`, el módulo habilita un botón de descarga asistida y fallback a la copia local.

### 7.6. Módulo 06: Metadatos Estandarizados (ISO 19115 / ISO 19139)
* **Propósito:** Generador y exportador formal de fichas de metadatos espaciales conforme al perfil chileno de metadatos (SNIT / IDE Chile), compatible con catálogos GeoNetwork y CSW (Catalog Service for the Web).
* **Archivos Clave:** `src/js/modulos/metadatos.js`.
* **Formatos de Exportación:**
  - **JSON (ISO 19115-1:2014):** Objeto estructurado con los 7 paquetes obligatorios (Identificación, Extensión, Calidad/Linaje, Distribución, Sistema de Referencia, Mantenimiento y Puntos de Contacto).
  - **XML (ISO 19139:2007):** Archivo XML validable contra el esquema XSD de OGC/ISO (`gmd:MD_Metadata`), listo para ser importado directamente en geoportal.cl o servidores GeoNetwork institucionales.

### 7.7. Módulo 07: Diccionario Territorial y Descriptores
* **Propósito:** Repositorio conceptual interactivo con **134 descriptores técnicos, normativos y geográficos** que estandarizan el vocabulario utilizado en el Atlas, facilitando el diálogo entre la jerga técnica de los planificadores comunales y las etiquetas colaborativas de OpenStreetMap.
* **Archivos Clave:** `src/js/modulos/diccionario.js`.
* **Estructura del Término:** Cada descriptor contiene: `id`, `termino`, `categoria_tematica`, `definicion_conceptual`, `fuente_normativa` (ej. OGUC, Ley General de Urbanismo y Construcciones, Wiki OSM, INE), `etiqueta_osm_equivalente` y `capa_atlas_relacionada`. Cuenta con buscador en vivo por texto o categoría.

### 7.8. Módulo 08: Licencias Abiertas y Catálogos de Descarga
* **Propósito:** Gobernanza jurídica del Atlas, clarificación del marco legal tripartito y centro de descarga de matrices maestras en formatos abiertos OpenXML y CSV.
* **Archivos Clave:** `src/js/modulos/licencias.js`, `src/index.html` (`#panel-licencias`).
* **Descargables Directos:**
  - `docs/categorias_tematicas_osm.xlsx`
  - `docs/catalogo_fuentes_vgi.xlsx`
  - `docs/perfil_metadatos_vgi.xlsx`
  - `docs/bip_inversiones_santiago.csv`
  - `docs/geodatabase_completa_atlas_vgi.zip`

### 7.9. Módulo 09: Indicadores de Análisis y Storyboards Territoriales
* **Propósito:** Síntesis cuali-cuantitativa que organiza las 131 capas en 5 dimensiones estratégicas del territorio y presenta 7 storyboards barriales temáticos con análisis visuales, métricas prediales y acceso al visor Lightbox HD.
* **Archivos Clave:** `src/js/modulos/indicadores_analisis.js`, `src/index.html` (`#panel-indicadores-analisis`).
* **Las 5 Dimensiones Analíticas:**
  1. *Equipamiento Comunitario y Social:* Educación, salud, bomberos, carabineros, comisarías y centros sociales.
  2. *Movilidad, Accesibilidad y Espacio Público:* Red vial, ciclovías, estaciones de Metro, paraderos, semáforos UOCT y veredas.
  3. *Morfología Urbana, Densidad y Vivienda:* Manzanas Censo 2024, altura de edificación, pasajes, cités y catastro predial SII.
  4. *Patrimonio, Memoria e Identidad Barrial:* Zonas Típicas, Monumentos Históricos, Inmuebles de Conservación Histórica y sitios de memoria.
  5. *Medio Ambiente, Cobertura y Sostenibilidad:* Áreas verdes, arbolado urbano, islas de calor, catastro de residuos SUBDERE 2024 e infraestructura hídrica.
* **Visor Lightbox Pop-Up HD:** Permite ampliar a pantalla completa las láminas cartográficas de alta resolución (`src/img/cartografias/`) con controles interactivos de zoom, paneo y reseteo de vista.

### 7.10. Módulo 10: Manual de Uso y Guía Metodológica
* **Propósito:** Módulo integrado en la propia aplicación web que expone el manual operativo de usuario, la guía metodológica y la memoria de trazabilidad sin requerir la apertura de archivos externos.
* **Archivos Clave:** `src/js/modulos/manual.js`, `src/index.html` (`#panel-manual`).
* **Características:** Renderizado de pestañas de lectura dinámica, índice de navegación rápida y enlaces de descarga a la documentación formal en Markdown y PDF.

---

## 8. Cómo Agregar un Nuevo Módulo a la Plataforma (Paso a Paso)

La arquitectura modular permite incorporar un nuevo módulo funcional (por ejemplo, *Módulo 11: Sensorica Ambiental IoT*) siguiendo un procedimiento estrictamente estandarizado:

### Paso 1: Crear el Archivo Lógico del Módulo
Cree el archivo `src/js/modulos/sensorica_iot.js` utilizando el patrón IIFE:

```javascript
// src/js/modulos/sensorica_iot.js
// Módulo 11: Monitoreo y Sensores Ambientales IoT
// Departamento de Geografía · Universidad Alberto Hurtado

const ModuloSensoricaIoT = (() => {
  let sensoresCargados = [];

  async function inicializarModulo() {
    console.log('[+] Inicializando Módulo 11: Sensorica IoT...');
    await cargarDatosSensores();
    renderizarInterfaz();
  }

  async function cargarDatosSensores() {
    try {
      const resp = await fetch('data/sensores_calidad_aire_santiago.geojson');
      const data = await resp.json();
      sensoresCargados = data.features || [];
      console.log(`[✓] ${sensoresCargados.length} sensores cargados con éxito.`);
    } catch (err) {
      console.error('[-] Error al cargar datos de sensores:', err);
    }
  }

  function renderizarInterfaz() {
    const contenedor = document.getElementById('contenedor-sensores-iot');
    if (!contenedor) return;

    contenedor.innerHTML = `
      <div class="tarjeta-sensor-resumen">
        <h4>Sensores Ambientales en Tiempo Real</h4>
        <p>Total de estaciones activas en Barrio Brasil: <strong>${sensoresCargados.length}</strong></p>
      </div>
    `;
  }

  // API Pública expuesta
  return {
    inicializar: inicializarModulo,
    obtenerSensores: () => sensoresCargados
  };
})();

window.ModuloSensoricaIoT = ModuloSensoricaIoT;
```

### Paso 2: Agregar el Botón de Pestaña en la Barra Superior
En [`src/index.html`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/src/index.html), dentro del `<nav class="barra-pestanas-profundidad" id="lista-navegacion">` (alrededor de la línea 55), agregue el botón con su número de nodo:

```html
<button type="button" class="pestana-nodo" data-panel="sensorica-iot">
  <span class="insignia-nodo">11</span> ♨ Sensorica IoT
</button>
```

### Paso 3: Agregar el Contenedor del Panel HTML
En `src/index.html`, dentro del contenedor principal `<main class="contenido">`, agregue la sección con el ID correspondiente al `data-panel`:

```html
<!-- ---------- 11. SENSORICA AMBIENTAL IOT ---------- -->
<section class="panel" id="panel-sensorica-iot" aria-labelledby="titulo-sensorica">
  <header class="panel-header">
    <div class="panel-header-identificador">
      <span class="nodo-numero">NODO 11</span>
      <h2 id="titulo-sensorica">Sensores Ambientales y Calidad del Aire IoT</h2>
    </div>
    <p class="panel-descripcion">
      Monitoreo en tiempo real de material particulado (MP2.5 / MP10), temperatura y humedad relativa en Barrio Brasil.
    </p>
  </header>

  <div class="panel-cuerpo" id="contenedor-sensores-iot">
    <!-- Contenido inyectado dinámicamente por sensorica_iot.js -->
  </div>
</section>
```

### Paso 4: Registrar el Módulo en `src/js/app.js`
En [`src/js/app.js`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/src/js/app.js), agregue el módulo al manejador de navegación y ciclo de vida:

```javascript
// Dentro del evento DOMContentLoaded o del despachador de navegación:
const panelesInicializados = {};

function cambiarPanel(nombrePanel) {
  // ... lógica existente de ocultar/mostrar paneles ...

  if (nombrePanel === 'sensorica-iot' && !panelesInicializados['sensorica-iot']) {
    if (window.ModuloSensoricaIoT) {
      window.ModuloSensoricaIoT.inicializar();
      panelesInicializados['sensorica-iot'] = true;
    }
  }
}
```

### Paso 5: Incluir el Script con Parámetro Anti-Caché en `index.html`
Al pie de `src/index.html`, antes de `js/app.js`, agregue la etiqueta `<script>`:

```html
<script src="js/modulos/sensorica_iot.js?v=20261020_v1"></script>
```

---

## 9. Pipeline Cartográfico: Catálogo de 131 Capas y Cómo Modificar Capas

El Atlas VGI contiene exactamente **131 capas cartográficas auditadas y normalizadas** (121 capas oficiales del Estado de Chile y 10 macrocategorías comunitarias VGI de OpenStreetMap).

### 9.1. Estructura de `src/js/modulos/ide_chile.js`
El catálogo de capas oficiales reside en el objeto JavaScript `CAPAS_OFICIALES` dentro de `src/js/modulos/ide_chile.js`. Cada capa se define mediante un objeto con 9 atributos técnicos y bibliográficos:

```javascript
'censo2024_manzanas': {
  nombre: 'Censo 2024 — Manzanas Censales (Santiago)',
  institucion: 'Instituto Nacional de Estadísticas (INE)',
  ministerio: 'Ministerio de Economía, Fomento y Turismo',
  tipoServicio: 'GeoJSON WGS84 (EPSG:4326)',
  urlServicio: 'https://geoine-inechile.opendata.arcgis.com/',
  archivoLocal: 'data/ide_censo2024_manzanas.geojson',
  descripcion: 'Polígonos de manzanas censales con población total y viviendas censadas en el Censo de Población y Vivienda 2024.',
  declaracion: 'Datos procesados y agregados a nivel de manzana para la comuna de Santiago.',
  citaAPA: 'Instituto Nacional de Estadísticas. (2024). Censo de Población y Vivienda 2024: Manzanas censales Región Metropolitana. Santiago: INE Chile.'
},
'subdere_rsd_sitios_disposicion_instalaciones_rm': {
  nombre: 'SUBDERE 2024 — Sitios de Disposición Final RSD (RM)',
  institucion: 'Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE)',
  ministerio: 'Ministerio del Interior y Seguridad Pública',
  tipoServicio: 'GeoJSON WGS84 (EPSG:4326)',
  urlServicio: 'https://www.subdere.gov.cl/',
  archivoLocal: 'data/subdere_rsd_2024_rm/Sitios_Disposicion_RSD_Ene24_RM.geojson',
  descripcion: 'Catastro de vertederos, rellenos sanitarios y plantas de disposición final de residuos sólidos domiciliarios en la RM.',
  declaracion: 'Catastro Nacional de Residuos Sólidos Domiciliarios actualizado a enero de 2024.',
  citaAPA: 'Subsecretaría de Desarrollo Regional y Administrativo. (2024). Catastro Nacional de Residuos Sólidos Domiciliarios 2024. Santiago: SUBDERE.'
}
```

### 9.2. Esquema Maestro Obligatorio de 14 Atributos ISO por Entidad
Cualquier archivo GeoJSON que se incorpore a la plataforma debe contener en su objeto `properties` las siguientes 14 propiedades normalizadas. Esto permite que el Inspector Normativo, el Evaluador de Calidad ISO y las descargas en CSV operen de forma homogénea:

| N° | Atributo Maestro | Tipo de Dato | Descripción y Formato Estándar | Ejemplo Real |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id_atlas` | String | Identificador unívoco alfanumérico | `"VGI-CL-RM-001248"` |
| 2 | `categoria` | String | Macrocategoría temático-funcional | `"Equipamiento y Servicios"` |
| 3 | `subcategoria` | String | Tipo específico del elemento | `"Educación Básica y Media"` |
| 4 | `nombre` | String | Topónimo o nombre oficial de la entidad | `"Liceo Experimental Manuel de Salas"` |
| 5 | `fuente_origen`| String | Organización o proyecto emisor del dato | `"OpenStreetMap / MINEDUC"` |
| 6 | `licencia` | String | Licencia de reutilización del registro | `"ODbL 1.0 / Open Data"` |
| 7 | `fecha_captura`| String | Fecha ISO 8601 de captura o actualización | `"2026-08-15"` |
| 8 | `comuna` | String | Nombre oficial de la comuna DPA | `"Santiago"` |
| 9 | `region` | String | Región político-administrativa | `"Región Metropolitana de Santiago"` |
| 10 | `metadato_url` | String | Enlace URL a la ficha ISO 19115 | `"https://atlasvgiuah.netlify.app/docs/perfil_metadatos_vgi.xlsx"` |
| 11 | `tipo_geometria`| String | Geometría OGC Simple Feature | `"MultiPolygon"` / `"Point"` |
| 12 | `precision_posicional`| String | Tolerancia de precisión estimada | `"± 3.5 metros (GNSS / Ortofoto)"` |
| 13 | `estado_revision`| String | Nivel de curatoría en el Atlas | `"Auditado Grado A+ (ISO 19157)"` |
| 14 | `propiedades_originales`| Object | Diccionario JSON con los campos crudos del origen | `{"rbd": 9845, "dependencia": "Municipal"}` |

### 9.3. Procedimiento para Añadir una Nueva Capa Cartográfica
1. **Paso 1: Descargar y Homologar la Geometría:**
   Descargue el dataset crudo (ej. Shapefile o WFS). Con QGIS o GDAL/OGR, reproyéctelo obligatoriamente al sistema de referencia geográfico global **WGS84 (EPSG:4326)**:
   ```bash
   ogr2ogr -f "GeoJSON" -t_srs "EPSG:4326" capa_normalizada.geojson capa_origen.shp
   ```
2. **Paso 2: Inyectar los 14 Atributos Maestros con Python:**
   Ejecute un script de inyección para garantizar que no existan propiedades nulas en los 14 campos:
   ```python
   import json

   with open("capa_normalizada.geojson", "r", encoding="utf-8") as f:
       data = json.load(f)

   for idx, feat in enumerate(data.get("features", [])):
       props = feat.get("properties", {})
       feat["properties"] = {
           "id_atlas": f"CAPA-OFICIAL-{idx+1:06d}",
           "categoria": "Infraestructura",
           "subcategoria": "Red Eléctrica",
           "nombre": props.get("nombre", "Sin Nombre"),
           "fuente_origen": "Coordinador Eléctrico Nacional",
           "licencia": "Datos Públicos Estado de Chile",
           "fecha_captura": "2026-10-01",
           "comuna": "Santiago",
           "region": "Región Metropolitana",
           "metadato_url": "https://www.geoportal.cl",
           "tipo_geometria": feat.get("geometry", {}).get("type", "Unknown"),
           "precision_posicional": "± 5 metros",
           "estado_revision": "Validado",
           "propiedades_originales": props
       }

   with open("capa_normalizada.geojson", "w", encoding="utf-8") as f:
       json.dump(data, f, ensure_ascii=False, indent=2)
   ```
3. **Paso 3: Copiar a `data/` y `src/data/`:**
   Guarde el archivo tanto en `data/nombre_capa.geojson` como en `src/data/nombre_capa.geojson`.
4. **Paso 4: Registrar la Capa en `src/js/modulos/ide_chile.js`:**
   Agregue la clave técnica y metadatos en el objeto `CAPAS_OFICIALES`.
5. **Paso 5: Re-ejecutar Scripts de Auditoría y Empaquetado:**
   ```bash
   python3 scripts/verificar_conteo_capas.py
   python3 scripts/analisis_metacalidad.py
   python3 scripts/empaquetar_base_datos_completa.py
   ```

---

## 10. Extractos Masivos Regionales de Geofabrik RM y Generación de GeoPackage (.gpkg)

El Atlas complementa las consultas puntuales de Overpass con extractos regionales completos descargados de **Geofabrik GmbH**, permitiendo análisis a escala regional sobre los 52 municipios de la Región Metropolitana.

### 10.1. Flujo de Descarga y Corte Espacial
1. **Fuente Cruda:** Geofabrik genera dumps diarios de todo Chile en formato Protocolbuffer Binary Format (PBF):  
   `https://download.geofabrik.de/south-america/chile-latest.osm.pbf` (~500 MB).
2. **Corte por Bounding Box con Osmium:**
   Mediante la herramienta `osmium-tool`, el dump nacional se recorta contra el polígono de la Región Metropolitana de Santiago (`[-71.72, -34.30, -69.75, -32.92]`):
   ```bash
   osmium extract -b -71.72,-34.30,-69.75,-32.92 chile-latest.osm.pbf -o rm-latest.osm.pbf
   ```
3. **Clasificación en 10 Macrocategorías Regionales (`scripts/procesar_geofabrik_rm.py`):**
   El script Python `scripts/procesar_geofabrik_rm.py` toma el PBF regional y extrae 10 archivos GeoJSON correspondientes a las macrocategorías maestras:
   - `capa_osm_rm_cat01_educacion.geojson` (Colegios, universidades, jardines infantiles).
   - `capa_osm_rm_cat02_salud.geojson` (Hospitales, CESFAM, clínicas, farmacias).
   - `capa_osm_rm_cat03_transporte.geojson` (Paradas de bus, estaciones de tren/metro, terminales).
   - `capa_osm_rm_cat04_ciclovias.geojson` (Ciclovías segregadas, sendas ciclables, bicicleteros).
   - `capa_osm_rm_cat05_espacio_publico.geojson` (Plazas, parques urbanos, zonas de recreación).
   - `capa_osm_rm_cat06_patrimonio.geojson` (Edificios históricos, sitios arqueológicos, monumentos).
   - `capa_osm_rm_cat07_accesibilidad.geojson` (Rampas, cruces peatonales accesibles, semáforos sonoros).
   - `capa_osm_rm_cat08_biodiversidad.geojson` (Arbolado urbano significativo, reservas, ríos, canales).
   - `capa_osm_rm_cat09_edificaciones.geojson` (Polígonos de huella de edificios residenciales y comerciales).
   - `capa_osm_rm_cat10_cobertura_suelo.geojson` (Áreas verdes, suelos industriales, usos comerciales).

### 10.2. Generación de GeoPackage Multicapa (`scripts/generar_gpkg_geofabrik.py`)
Para que investigadores puedan cargar la base de datos de una sola vez en software SIG de escritorio (QGIS, ArcGIS Pro o gvSIG), el script [`scripts/generar_gpkg_geofabrik.py`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/scripts/generar_gpkg_geofabrik.py) consolida los 10 archivos GeoJSON en un único archivo SQLite/GeoPackage estándar OGC (`geofabrik_chile_rm_completo.gpkg`):

```bash
python3 scripts/generar_gpkg_geofabrik.py
```
El archivo resultante incluye índices espaciales R-Tree (`rtree_*`) en cada tabla, lo que acelera en un 90% el rendimiento de visualización y geoprocesamiento en QGIS.

---

## 11. Modelo Cuantitativo de Calidad Espacial ISO 19157 (WLC v2.0)

La evaluación de calidad cartográfica no es una estimación subjetiva, sino un **modelo computacional multicriterio ponderado** (*Weighted Linear Combination* - WLC) basado estrictamente en las normas ISO 19157:2013 e ISO 19157-1:2023.

### 11.1. Formulación Matemática del Modelo WLC
El Índice Global de Calidad Geográfica ($IGV$) de cada capa se calcula mediante la combinación lineal de dos pilares ortogonales ponderados al 50%:

$$IGV = 0.50 \cdot P_{\text{cuantitativo}} + 0.50 \cdot P_{\text{cualitativo}}$$

Donde el **Pilar Cuantitativo Espacial** ($P_{\text{cuantitativo}}$) evalúa las geometrías y atributos del GeoJSON:
$$P_{\text{cuantitativo}} = 0.30 \cdot C_{\text{topologia}} + 0.25 \cdot C_{\text{completitud}} + 0.20 \cdot C_{\text{posicional}} + 0.15 \cdot C_{\text{esquema}} + 0.10 \cdot C_{\text{granularidad}}$$

Y el **Pilar Cualitativo de Metadatos** ($P_{\text{cualitativo}}$) evalúa la gobernanza conforme a ISO 19115:
$$P_{\text{cualitativo}} = 0.30 \cdot M_{\text{nucleo}} + 0.25 \cdot M_{\text{linaje\_legal}} + 0.20 \cdot M_{\text{conformidad}} + 0.15 \cdot M_{\text{resolucion}} + 0.10 \cdot M_{\text{accesibilidad}}$$

### 11.2. Desglose Operativo de las 10 Dimensiones de Calidad
1. **Topología OGC ($C_{\text{topologia}}$ - 30% del Pilar 1):** Verifica la validez geométrica según las reglas OGC Simple Features (cierre de anillos poligonales, ausencia de auto-intersecciones, detección de geometrías colapsadas o nulas).
2. **Completitud Tabular ($C_{\text{completitud}}$ - 25% del Pilar 1):** Tasa de valores válidos no nulos ni vacíos en los campos informativos de la tabla de atributos.
3. **Integridad Posicional ($C_{\text{posicional}}$ - 20% del Pilar 1):** Porcentaje de vértices situados estrictamente dentro del Bounding Box oficial de la Región Metropolitana (`[-71.72, -34.30, -69.75, -32.92]`).
4. **Estructura y Esquema ($C_{\text{esquema}}$ - 15% del Pilar 1):** Cobertura de los 14 atributos maestros obligatorios en el objeto `properties`.
5. **Granularidad Geométrica ($C_{\text{granularidad}}$ - 10% del Pilar 1):** Riqueza y densidad de vértices que garantizan la no degradación de polígonos complejos.
6. **Metadatos Núcleo ($M_{\text{nucleo}}$ - 30% del Pilar 2):** Existencia de título normalizado, resumen descriptivo y sistema de referencia de coordenadas declarado.
7. **Linaje y Legal ($M_{\text{linaje\_legal}}$ - 25% del Pilar 2):** Presencia de cita bibliográfica formal bajo norma APA 7ª ed., declaración de linaje y licencia explícita.
8. **Conformidad ISO ($M_{\text{conformidad}}$ - 20% del Pilar 2):** Compatibilidad con los tipos de datos y estructuras del estándar ISO 19115-1:2014.
9. **Resolución Espacial ($M_{\text{resolucion}}$ - 15% del Pilar 2):** Declaración de escala equivalente de captura (ej. 1:5.000) o distancia de muestreo.
10. **Accesibilidad ($M_{\text{accesibilidad}}$ - 10% del Pilar 2):** Enlace web oficial verificable (`HTTP 200`) y disponibilidad de descarga sin barreras propietarias.

### 11.3. Rangos de Clasificación de Calidad
* **Grado A+ (Calidad Excelente):** $IGV \ge 95.00\%$ (Apta para modelamiento normativo vinculante e investigación científica de alto impacto).
* **Grado A (Calidad Muy Buena):** $90.00\% \le IGV < 95.00\%$ (Apta para planificación territorial y diagnóstico urbano).
* **Grado B (Calidad Aceptable):** $80.00\% \le IGV < 90.00\%$ (Requiere curatoría previa de atributos o topología).
* **Grado C (Calidad Deficiente):** $IGV < 80.00\%$ (No apta para producción cartográfica oficial sin reestructuración completa).

---
"""
print("[+] Secciones 07 a 11 cargadas")
