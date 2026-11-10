# -*- coding: utf-8 -*-
PARTE_08 = r"""# PARTE VIII: GUÍA DE MODIFICACIÓN PASO A PASO (16 TUTORIALES OPERATIVOS)

---

> [!NOTE]
> Cada uno de los 16 tutoriales de esta parte sigue una estructura fija de cinco secciones: **Objetivo**, **Archivos**, **Pasos** (redactados en modo imperativo), **Verificación** y un recuadro homogéneo de **Qué hacer si falla**. Para las siglas empleadas —como Plan Regulador Comunal (PRC), combinación lineal ponderada (*Weighted Linear Combination*, WLC), Índice Global de Calidad VGI (IGV) y Web Content Accessibility Guidelines (WCAG)— véase el glosario del Capítulo 37.

---

## 40. Tutorial 01: modificación de la paleta cromática y variables `:root` en CSS

* **Objetivo:** Actualizar los colores principales y de superficie de la interfaz web mediante las variables semánticas declaradas en `:root`.
* **Archivos:** `src/css/estilos.css` y `src/index.html`.
* **Pasos:**
  1. Abra el archivo `src/css/estilos.css` en un editor de código.
  2. Localice el bloque `:root` al inicio del documento (líneas 12 a 65).
  3. Modifique los valores hexadecimales de los acentos o superficies que desee ajustar:
     ```css
     :root {
       --fondo-app: #0c1527;      /* Superficie base de la aplicación */
       --papel: #132039;          /* Contenedor de paneles y vistas */
       --papel-alto: #1a2b4b;     /* Cabeceras y barras secundarias */
       --papel-tarjeta: #223861;  /* Tarjetas y fichas informativas */
       --tinta: #ffffff;          /* Texto principal de lectura */
       --tinta-suave: #f8fafc;    /* Subtítulos y descripciones */
       --musgo: #06b6d4;          /* Acento primario e indicadores activos */
       --agua: #38bdf8;           /* Enlaces y controles interactivos */
       --esmeralda: #10b981;      /* Estado operativo y descargas */
       --ocre: #f59e0b;           /* Avisos preventivos */
     }
     ```
  4. Actualice el parámetro de versión (`?v=...`) en la etiqueta `<link rel="stylesheet" href="css/estilos.css?v=...">` dentro de `src/index.html` para invalidar la caché del navegador.
  5. Guarde ambos archivos.
* **Verificación:** Recargue el navegador con `Cmd + Shift + R` (macOS) o `Ctrl + F5` (Windows/Linux) y compruebe que la barra superior, los botones activos y las tarjetas reflejen los nuevos colores.

> [!WARNING]
> **Qué hacer si falla:** Si la interfaz continúa mostrando los colores anteriores, abra las herramientas de desarrollo del navegador (`F12` > pestaña *Red* / *Network*), marque la casilla *Deshabilitar caché* (*Disable cache*) y vuelva a recargar la página. Verifique además que cada declaración CSS termine con punto y coma (`;`).

---

## 41. Tutorial 02: personalización de punteros y cursores del ratón

* **Objetivo:** Configurar el estilo del cursor sobre el lienzo del mapa tanto en modo de exploración normal como durante la consulta del inspector normativo del Plan Regulador Comunal (PRC).
* **Archivos:** `src/css/estilos.css` y `src/js/modulos/evaluador_normativo.js`.
* **Pasos:**
  1. Abra `src/css/estilos.css` y localice las reglas asociadas a `.leaflet-container`.
  2. Defina el cursor para el estado de reposo y el de arrastre del mapa:
     ```css
     .leaflet-container {
       cursor: grab !important;
     }
     .leaflet-container.leaflet-drag-target {
       cursor: grabbing !important;
     }
     ```
  3. Añada la regla de retícula (`crosshair`) para el modo de inspección normativa:
     ```css
     .cursor-inspeccion-activa .leaflet-container,
     #mapa-atlas.modo-inspector {
       cursor: crosshair !important;
     }
     ```
  4. Abra `src/js/modulos/evaluador_normativo.js` (o el manejador en `src/js/app.js`) y asegúrese de alternar la clase sobre `#mapa-atlas` al activar o desactivar el inspector:
     ```javascript
     function alternarCursorInspector(activo) {
       const lienzo = document.getElementById("mapa-atlas");
       if (lienzo) {
         lienzo.classList.toggle("modo-inspector", Boolean(activo));
       }
     }
     ```
  5. Guarde los cambios y recargue la vista del visor cartográfico.
* **Verificación:** Pase el puntero sobre el mapa en modo normal (debe mostrarse la mano abierta) y luego pulse el botón *Inspector normativo (PRC)* (el puntero debe cambiar a una cruz de precisión).

> [!WARNING]
> **Qué hacer si falla:** Si Leaflet sobrescribe el cursor con sus estilos en línea, confirme que el selector CSS incluya `#mapa-atlas.leaflet-container` con la directiva `!important` y que ningún elemento superpuesto tenga `pointer-events: all` cubriendo el lienzo.

---

## 42. Tutorial 03: creación y modificación de marcadores vectoriales SVG (`L.divIcon`)

* **Objetivo:** Crear o modificar íconos vectoriales SVG escalables para representar entidades puntuales sobre el visor Leaflet sin pérdida de nitidez en pantallas de alta densidad.
* **Archivos:** `src/js/modulos/mapa.js` y `src/css/estilos.css`.
* **Pasos:**
  1. Abra `src/js/modulos/mapa.js` y ubique la función constructora de íconos vectoriales (`crearIconoCategoria` o `L.divIcon`).
  2. Agregue o edite la rama correspondiente a la categoría deseada utilizando trazos SVG de línea uniforme (`stroke-width="1.8"`):
     ```javascript
     function crearMarcadorVectorial(colorHex, svgInterno) {
       const htmlPin = `
         <div class="pin-marcador-svg" style="background-color: ${colorHex};">
           ${svgInterno}
         </div>
       `;
       return L.divIcon({
         className: "contenedor-pin-vgi",
         html: htmlPin,
         iconSize: [30, 30],
         iconAnchor: [15, 15],
         popupAnchor: [0, -16]
       });
     }
     ```
  3. Abra `src/css/estilos.css` y verifique que la clase `.pin-marcador-svg` centre el vector y elimine el borde por defecto de Leaflet:
     ```css
     .contenedor-pin-vgi {
       background: transparent !important;
       border: none !important;
     }
     .pin-marcador-svg {
       width: 30px;
       height: 30px;
       border-radius: 50%;
       border: 2px solid #ffffff;
       display: flex;
       align-items: center;
       justify-content: center;
       box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
     }
     ```
  4. Guarde ambos archivos.
* **Verificación:** Active una categoría puntual en el visor (por ejemplo, *Educación* o *Salud*) y compruebe que los marcadores se dibujen centrados sobre las coordenadas reales al acercar y alejar el zoom.

> [!WARNING]
> **Qué hacer si falla:** Si el marcador parece desplazarse respecto a su posición al cambiar el nivel de zoom, revise que `iconAnchor` sea exactamente la mitad de `iconSize` (por ejemplo, `[15, 15]` para un tamaño de `[30, 30]`).

---

## 43. Tutorial 04: incorporación de nuevos mapas base (`L.tileLayer`)

* **Objetivo:** Agregar un nuevo proveedor de teselas cartográficas (como imagen satelital o mapa topográfico) al selector de mapas base del visor.
* **Archivos:** `src/js/modulos/mapa.js` y `src/index.html`.
* **Pasos:**
  1. Abra `src/js/modulos/mapa.js` y localice el diccionario de capas base (`capasBase` o `proveedoresTeselas`).
  2. Registre la nueva fuente especificando la plantilla URL XYZ, el zoom máximo y la atribución legal:
     ```javascript
     capasBase["opentopomap"] = L.tileLayer(
       "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
       {
         maxZoom: 17,
         attribution: "Datos: &copy; OpenStreetMap contributors, SRTM | Estilo: &copy; OpenTopoMap (CC-BY-SA)"
       }
     );
     ```
  3. Si el visor incluye un selector desplegable o control de capas en `src/index.html`, agregue la opción correspondiente con el valor `"opentopomap"`.
  4. Guarde los archivos y recargue el visor.
* **Verificación:** Seleccione el nuevo mapa base en el control de capas del visor y confirme que las teselas se descarguen con código HTTP `200 OK` en la pestaña *Red* del navegador.

> [!WARNING]
> **Qué hacer si falla:** Si las teselas aparecen en gris al acercar mucho el mapa, reduzca el parámetro `maxNativeZoom` al nivel máximo real soportado por el servidor externo (por ejemplo, `maxNativeZoom: 17, maxZoom: 19`) para que Leaflet escale las imágenes sin solicitar niveles inexistentes.

---

## 44. Tutorial 05: incorporación de una nueva capa GeoJSON al catálogo

```mermaid
flowchart LR
    subgraph IN_NEW["1. Entrada"]
        RAW_SHP["Archivo vectorial en EPSG:4326\ny metadatos de origen"]
    end

    subgraph PROC_NEW["2. Flujo de integración"]
        STEP_1["1. Copia en data/ y src/data/"]
        STEP_2["2. Inyección de 14 atributos ISO"]
        STEP_3["3. Evaluación WLC v2.0 y registro en catálogos"]
        STEP_4["4. Registro en ide_chile.js e index.html"]
    end

    subgraph OUT_NEW["3. Salida"]
        VALID_QA["5. Verificación con scripts de control"]
    end

    IN_NEW --> PROC_NEW --> OUT_NEW
```

* **Objetivo:** Integrar una cobertura vectorial nueva en el catálogo del Atlas manteniendo la paridad de archivos, los 14 atributos ISO y las métricas de calidad.
* **Archivos:** `data/<nueva_capa>.geojson`, `src/data/<nueva_capa>.geojson`, `src/js/modulos/ide_chile.js`, `src/index.html` y `scripts/enriquecer_base_datos_metadatos.py`.
* **Pasos:**
  1. Exporte la capa en formato GeoJSON con sistema de referencia **WGS84 (EPSG:4326)** y cópiela tanto en `data/` como en `src/data/`.
  2. Ejecute el script de normalización de atributos para inyectar las 14 columnas obligatorias del esquema ISO:
     ```bash
     python3 scripts/enriquecer_base_datos_metadatos.py
     ```
  3. Abra `src/js/modulos/ide_chile.js` y añada el descriptor de la capa dentro del diccionario `CAPAS_OFICIALES`, indicando `nombre`, `archivo`, `color`, `fuente` y `anio`.
  4. Abra `src/index.html` y agregue el botón de activación (`.chip-oficial[data-capa="id_nueva_capa"]`) en el acordeón temático correspondiente.
  5. Ejecute los scripts de actualización de catálogos y evaluación de calidad:
     ```bash
     python3 scripts/analisis_metacalidad.py
     python3 scripts/generar_entregables_excel.py
     ```
* **Verificación:** Ejecute `python3 scripts/verificar_conteo_capas.py` y `python3 scripts/verificar_integridad_despliegue.py`, y active la capa en el visor para confirmar que sus entidades se dibujen sobre el mapa.

> [!WARNING]
> **Qué hacer si falla:** Si las geometrías no aparecen sobre Santiago sino cerca de la coordenada `(0, 0)`, el archivo original estaba proyectado en coordenadas métricas UTM (EPSG:32719) en lugar de grados geográficos (EPSG:4326). Reproyecte el archivo a EPSG:4326 en QGIS antes de guardarlo en `data/` y `src/data/`.

---

## 45. Tutorial 06: creación de nuevas consultas Overpass QL en el módulo de consultas

* **Objetivo:** Incorporar una plantilla de consulta predefinida en lenguaje Overpass QL para extraer objetos de OpenStreetMap dentro de la caja delimitadora activa.
* **Archivos:** `src/js/modulos/osm.js` y `src/index.html`.
* **Pasos:**
  1. Abra `src/js/modulos/osm.js` y localice el diccionario de consultas o presets temáticos.
  2. Añada una nueva entrada definiendo las etiquetas `key=value` de OpenStreetMap (por ejemplo, grifos contra incendios `emergency=fire_hydrant`):
     ```javascript
     PRESETS_OVERPASS["grifos_incendio"] = {
       nombre: "Grifos contra incendios",
       filtro: 'node["emergency"="fire_hydrant"]',
       color: "#f43f5e"
     };
     ```
  3. Abra `src/index.html`, localice la sección de sugerencias de consulta en `#panel-explorador-osm` y agregue un botón con los atributos `data-clave="emergency"` y `data-valor="fire_hydrant"`.
  4. Guarde ambos archivos.
* **Verificación:** Abra la sección *Consultar datos > Consultas Overpass (OSM)*, pulse el nuevo botón de consulta y verifique que las entidades recuperadas se listen en la tabla inferior y se dibujen en el visor.

> [!WARNING]
> **Qué hacer si falla:** Si el servidor principal de Overpass devuelve un error `429 Too Many Requests` o `504 Gateway Timeout`, el cliente de `src/js/modulos/osm.js` activará automáticamente la conmutación por falla hacia el siguiente servidor espejo y mostrará un aviso en la franja superior. Si persiste, reduzca el tamaño de la caja delimitadora o el valor de `[timeout:25]`.

---

## 46. Tutorial 07: diseño y publicación de un nuevo guion visual (*storyboard*)

* **Objetivo:** Agregar un nuevo relato cartográfico con tarjetas de indicadores y mapas temáticos en el Módulo 05 (*Análisis y relatos*).
* **Archivos:** `src/js/modulos/indicadores_analisis.js`.
* **Pasos:**
  1. Guarde las láminas cartográficas o diagramas SVG del nuevo relato en la carpeta `src/img/cartografias/` (o `src/docs/`).
  2. Abra `src/js/modulos/indicadores_analisis.js` y localice el arreglo de relatos territoriales (`STORYBOARDS_DATA`).
  3. Inserte un nuevo objeto con su identificador, título, resumen, métricas destacadas (`kpis`), párrafos analíticos y lista de capas vinculadas:
     ```javascript
     {
       id: "sb-comercio-barrial",
       dimension: "Dimensión 02 · Equipamiento y servicios",
       territorio: "Barrio Brasil (223,75 ha)",
       titulo: "Comercio tradicional y abastecimiento de proximidad",
       bajada: "Distribución espacial de almacenes, panaderías y ferias libres respecto a la densidad habitacional.",
       capasRelacionadas: ["servicios", "censo2024_manzanas"],
       kpis: [
         { valor: "412", etiqueta: "Locales de barrio", sub: "Catastro OSM + Patentes" }
       ]
     }
     ```
  4. Guarde el archivo y recargue la plataforma.
* **Verificación:** Navegue a *Análisis y relatos > Indicadores y relatos*, haga clic sobre la nueva tarjeta y verifique que se abra la lámina de lectura con sus indicadores y el botón para cargar las capas asociadas en el visor.

> [!WARNING]
> **Qué hacer si falla:** Si alguna imagen del relato muestra el ícono de recurso roto, compruebe que la ruta relativa comience sin barra diagonal inicial (por ejemplo, `img/...` o `docs/...` relativas a `src/`) y respete exactamente las mayúsculas y minúsculas del nombre de archivo (Linux en Netlify distingue mayúsculas de minúsculas).

---

## 47. Tutorial 08: ajuste de ponderadores del modelo de calidad WLC (ISO 19157)

* **Objetivo:** Modificar los pesos de las dimensiones del modelo de combinación lineal ponderada (WLC) y recalcular el ranking de calidad de las 134 capas.
* **Archivos:** `scripts/analisis_metacalidad.py` y `src/js/modulos/evaluador_calidad_cuantitativa.js`.
* **Pasos:**
  1. Abra `scripts/analisis_metacalidad.py` y localice la definición de pesos de los componentes cuantitativos y cualitativos.
  2. Ajuste los ponderadores asegurándose de que la suma total sea exactamente igual a `1,00` (`100 %`):
     ```python
     # Suma de ponderadores = 1.00
     PESO_PILAR_CUANTITATIVO = 0.50
     PESO_PILAR_CUALITATIVO  = 0.50
     ```
  3. Actualice los mismos coeficientes en `src/js/modulos/evaluador_calidad_cuantitativa.js` para mantener la paridad entre el cálculo en servidor y el evaluador del navegador.
  4. Ejecute el script de recálculo desde la terminal:
     ```bash
     python3 scripts/analisis_metacalidad.py
     ```
  5. Sincronice los archivos generados (`docs/wlc_metacalidad_resultado.json` y `docs/ANALISIS_METACALIDAD.md`) con `src/docs/`.
* **Verificación:** Revise la salida en terminal de `scripts/analisis_metacalidad.py` y confirme que los archivos JSON y CSV en `docs/` y `src/docs/` tengan la nueva marca temporal y que el promedio coincida con lo mostrado en la vista *Evaluar calidad*.

> [!WARNING]
> **Qué hacer si falla:** Si la suma de los pesos difiere de `1,00`, el índice resultante excederá la escala de `0` a `100 %` y hará fallar la prueba de rango en `scripts/verificar_integridad_despliegue.py`. Verifique con `assert abs(sum(pesos) - 1.0) < 1e-6` antes de guardar.

---

## 48. Tutorial 09: actualización de la zonificación del Plan Regulador Comunal (PRC) de Santiago

* **Objetivo:** Actualizar los polígonos de zonificación o los parámetros urbanísticos (usos permitidos, usos prohibidos, alturas y coeficientes) que consulta el inspector normativo.
* **Archivos:** `data/ide_minvu_ipt_prc_santiago.geojson`, `src/data/ide_minvu_ipt_prc_santiago.geojson` y `src/js/modulos/evaluador_normativo.js`.
* **Pasos:**
  1. Si existen cambios geométricos en los polígonos de zonificación comunal, reemplace el archivo GeoJSON (en EPSG:4326) tanto en `data/` como en `src/data/`.
  2. Abra `src/js/modulos/evaluador_normativo.js` y localice las reglas normativas por zona (`ZONAS_PRC_DETALLE` o diccionario de zonas).
  3. Modifique los atributos de la zona modificada conforme a la Ordenanza Local vigente:
     ```javascript
     "ZCH-BB": {
       nombre: "Zona de Conservación Histórica Barrio Brasil",
       usosPermitidos: "Residencial; equipamiento de salud, educación, cultura y comercio barrial.",
       usosProhibidos: "Actividades productivas molestas o peligrosas; bodegaje mayor.",
       alturaMaxima: "Según perfil de edificación continua e Inmueble de Conservación Histórica (ICH)."
     }
     ```
  4. Guarde el archivo y recargue la plataforma web.
* **Verificación:** Active el botón *Inspector normativo (PRC)* en el visor, haga clic sobre un predio de la zona actualizada y descargue el Certificado de Informaciones Normativas VGI (CIN-VGI `.txt`) para verificar que contenga el nuevo texto.

> [!WARNING]
> **Qué hacer si falla:** Si al hacer clic sobre un predio el inspector informa *"Sin información de zona PRC"*, compruebe que el atributo de código de zona en el archivo GeoJSON (`ZONA`, `COD_ZONA` o `NOM_ZONA`) coincida con la propiedad leída por `evaluador_normativo.js`.

---

## 49. Tutorial 10: configuración de cabeceras y caché en `netlify.toml`

* **Objetivo:** Ajustar las cabeceras HTTP de control de caché, acceso entre orígenes (CORS) o redirecciones en el servidor perimetral de Netlify.
* **Archivos:** `netlify.toml`.
* **Pasos:**
  1. Abra el archivo `netlify.toml` en la raíz del repositorio.
  2. Localice los bloques `[[headers]]` o `[[redirects]]`.
  3. Para modificar el tiempo de almacenamiento en caché de las capas GeoJSON o habilitar cabeceras específicas, edite la sección correspondiente:
     ```toml
     [[headers]]
       for = "/data/*.geojson"
       [headers.values]
         Content-Type = "application/geo+json; charset=utf-8"
         Access-Control-Allow-Origin = "*"
         Cache-Control = "public, max-age=86400, stale-while-revalidate=604800"
     ```
  4. Guarde el archivo `netlify.toml`.
* **Verificación:** Ejecute `python3 -c "import tomllib; tomllib.load(open('netlify.toml', 'rb')); print('Sintaxis TOML correcta')"` en la terminal para validar que el archivo no contenga errores de formato antes de hacer `git commit`.

> [!WARNING]
> **Qué hacer si falla:** Un error de sintaxis en `netlify.toml` (como comillas sin cerrar o corchetes mal balanceados) detendrá por completo el despliegue en Netlify. Nunca modifique la variable `GIT_LFS_SKIP_SMUDGE = "0"`, ya que es indispensable para que Netlify expanda los archivos binarios reales de Git LFS.

---

## 50. Tutorial 11: incorporación de nuevas reglas en el verificador de integridad pre-despliegue

* **Objetivo:** Añadir una comprobación automatizada en el script de auditoría pre-despliegue para detectar errores antes de subir cambios al repositorio remoto.
* **Archivos:** `scripts/verificar_integridad_despliegue.py`.
* **Pasos:**
  1. Abra `scripts/verificar_integridad_despliegue.py` en su editor.
  2. Defina una nueva función de verificación que compruebe la condición deseada y lance un error o incremente el contador de fallos si no se cumple:
     ```python
     def verificar_existencia_manuales():
         rutas = [
             "MANUAL_ACTUALIZACION_ATLAS.md",
             "docs/MANUAL_ACTUALIZACION_ATLAS.md",
             "src/docs/MANUAL_ACTUALIZACION_ATLAS.md"
         ]
         for r in rutas:
             if not os.path.exists(r) or os.path.getsize(r) < 10000:
                 raise RuntimeError(f"Archivo de manual faltante o incompleto: {r}")
         print("✓ [VÁLIDO] Las tres copias del manual maestro existen y están sincronizadas.")
     ```
  3. Invoque la nueva función dentro del bloque principal de ejecución del script.
  4. Guarde el archivo.
* **Verificación:** Ejecute `python3 scripts/verificar_integridad_despliegue.py` en la terminal y compruebe que el script finalice con código de salida `0`.

> [!WARNING]
> **Qué hacer si falla:** Si el script finaliza con un código distinto de `0`, lea la línea marcada con `[ERROR]` o `[FALLO]` en la salida de terminal y corrija el archivo señalado antes de ejecutar `git push`.

---

## 51. Tutorial 12: configuración de avisos de estado de servicios externos

* **Objetivo:** Personalizar los mensajes de aviso que se muestran al usuario cuando un servicio externo (como Overpass API) presenta saturación o demora en responder.
* **Archivos:** `src/js/app.js`, `src/js/modulos/osm.js` y `src/index.html`.
* **Pasos:**
  1. Abra `src/js/app.js` y localice la función global `window.notificarEstadoServicio(mensaje, nivel)`.
  2. Ajuste la duración de visualización del aviso o los colores asociados a cada nivel (`"aviso"`, `"error"` o `"info"`):
     ```javascript
     window.notificarEstadoServicio = function(mensaje, nivel = "aviso") {
       const franja = document.getElementById("franja-estado-servicios");
       const texto = document.getElementById("estado-conexion");
       if (!franja || !texto) return;
       franja.style.display = "block";
       texto.textContent = mensaje;
     };
     ```
  3. Abra `src/js/modulos/osm.js` y edite el texto pasado a `window.notificarEstadoServicio(...)` dentro del bloque `catch` de la función `consultar()` para que indique qué ocurrió y qué acción realiza el sistema (por ejemplo: *"Overpass está saturado, reintentamos en el siguiente servidor espejo disponible…"*).
  4. Guarde ambos archivos.
* **Verificación:** Abra la consola del navegador (`F12`) y ejecute `window.notificarEstadoServicio("Prueba de aviso de conexión", "aviso")` para comprobar que la franja superior se despliegue con el mensaje y se oculte automáticamente tras unos segundos.

> [!WARNING]
> **Qué hacer si falla:** No deje la franja `#franja-estado-servicios` visible de forma permanente con un mensaje estático de conexión exitosa, ya que puede inducir a error si el usuario pierde conexión a internet posteriormente; mantenga `style="display:none;"` por defecto en `src/index.html`.

---

## 52. Tutorial 13: integración de geoservicios WMS oficiales del Estado de Chile

* **Objetivo:** Conectar una capa cartográfica servida mediante el estándar Web Map Service (WMS) del Open Geospatial Consortium (OGC) desde un servidor ministerial o de IDE Chile.
* **Archivos:** `src/js/modulos/ide_chile.js` y `src/js/modulos/mapa.js`.
* **Pasos:**
  1. Obtenga la URL base del servicio WMS y el nombre exacto de la capa (`layers`) consultando el documento `GetCapabilities` del organismo público.
  2. Abra `src/js/modulos/ide_chile.js` y registre la entrada indicando `tipo: "wms"`, `urlWms` y `capaWms`:
     ```javascript
     "mop_red_vial_wms": {
       nombre: "Red Vial Nacional (WMS MOP)",
       tipo: "wms",
       urlWms: "https://geoportal.mop.gob.cl/geoserver/wms",
       capaWms: "vialidad:red_vial_nacional",
       formato: "image/png",
       transparente: true,
       atribucion: "Ministerio de Obras Públicas (IDE MOP)"
     }
     ```
  3. En `src/js/modulos/mapa.js`, utilice `L.tileLayer.wms(urlWms, { layers: capaWms, format: "image/png", transparent: true })` para instanciar la capa sobre el lienzo.
  4. Guarde los archivos.
* **Verificación:** Active la capa WMS en el visor y compruebe en la pestaña *Red* del navegador que las peticiones `GetMap` devuelvan imágenes PNG con fondo transparente alineadas con la cartografía base.

> [!WARNING]
> **Qué hacer si falla:** Si el servidor ministerial solo publica en HTTP sin cifrado SSL o bloquea peticiones desde otros dominios, el navegador bloqueará la carga por política de contenido mixto (*Mixed Content*). En ese caso, descargue la cobertura mediante una petición WFS (`outputFormat=application/json`) y almacénela localmente en `src/data/` para garantizar su disponibilidad.

---

## 53. Tutorial 14: exportación dinámica de datos en formatos GeoJSON y CSV

* **Objetivo:** Modificar o ampliar las funciones de exportación en el navegador para descargar el subconjunto de entidades espaciales activas en formatos GeoJSON (RFC 7946) o CSV (UTF-8 con marca de orden de bytes BOM para apertura directa en hojas de cálculo).
* **Archivos:** `src/js/app.js`.
* **Pasos:**
  1. Abra `src/js/app.js` y localice las funciones de exportación del panel de consultas (`exportarGeoJSONActual` o `descargarArchivoTexto`).
  2. Verifique que la generación del archivo GeoJSON incluya la colección de entidades espaciales y los metadatos básicos de procedencia:
     ```javascript
     function exportarColeccionGeoJSON(features, nombreArchivo) {
       const coleccion = {
         type: "FeatureCollection",
         features: features || []
       };
       const blob = new Blob([JSON.stringify(coleccion, null, 2)], {
         type: "application/geo+json;charset=utf-8"
       });
       const url = URL.createObjectURL(blob);
       const enlace = document.createElement("a");
       enlace.href = url;
       enlace.download = nombreArchivo.endsWith(".geojson") ? nombreArchivo : `${nombreArchivo}.geojson`;
       document.body.appendChild(enlace);
       enlace.click();
       document.body.removeChild(enlace);
       URL.revokeObjectURL(url);
     }
     ```
  3. Para exportaciones tabulares en CSV, anteponga el carácter `"\uFEFF"` al texto generado para que Microsoft Excel y LibreOffice Calc reconozcan automáticamente las tildes y la letra `ñ`.
  4. Guarde los cambios en `src/js/app.js`.
* **Verificación:** Ejecute una consulta en el visor o en el explorador de OpenStreetMap, pulse el botón *Exportar GeoJSON* y abra el archivo descargado en QGIS para comprobar su geometría y tabla de atributos.

> [!WARNING]
> **Qué hacer si falla:** Si el botón de exportación genera un archivo vacío (`"features": []`), asegúrese de haber ejecutado primero una consulta o de tener al menos una capa activa en memoria antes de invocar la descarga.

---

## 54. Tutorial 15: auditoría de contraste y accesibilidad web (WCAG 2.1 AA general / AAA en texto)

* **Objetivo:** Auditar matemáticamente las razones de contraste entre los colores de fondo y de texto en `src/css/estilos.css` conforme a la norma W3C WCAG 2.1, verificando el nivel AA general en componentes interactivos (`CR >= 4,50:1`) y el nivel AAA en el texto de lectura (`CR >= 7,00:1`).
* **Archivos:** `src/css/estilos.css`.
* **Pasos:**
  1. Extraiga los pares de códigos hexadecimales de superficie (`--fondo-app`, `--papel`, `--papel-alto`, `--papel-tarjeta`, `--papel-rehundido`) y de primer plano (`--tinta`, `--tinta-suave`, `--tinta-tenue`, `--musgo`, `--agua`, `--esmeralda`, `--ocre`) definidos en `:root` dentro de `src/css/estilos.css`.
  2. Calcule la luminancia relativa `L = 0,2126 × R + 0,7152 × G + 0,0722 × B` y la razón de contraste `CR = (L₁ + 0,05) / (L₂ + 0,05)` ejecutando en terminal el siguiente comando en Python:
     ```bash
     python3 -c '
     def lum(h):
         h = h.lstrip("#")
         rgb = [int(h[i:i+2], 16)/255.0 for i in (0, 2, 4)]
         lin = [c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4 for c in rgb]
         return 0.2126*lin[0] + 0.7152*lin[1] + 0.0722*lin[2]
     def cr(h1, h2):
         l1, l2 = sorted([lum(h1), lum(h2)], reverse=True)
         return (l1 + 0.05) / (l2 + 0.05)
     pares = [
         ("--papel-rehundido vs --tinta", "#09101f", "#ffffff"),
         ("--fondo-app vs --tinta", "#0c1527", "#ffffff"),
         ("--papel vs --tinta", "#132039", "#ffffff"),
         ("--papel vs --tinta-suave", "#132039", "#f8fafc"),
         ("--papel-tarjeta vs --tinta-tenue", "#223861", "#e2e8f0"),
         ("--papel-tarjeta vs --esmeralda", "#223861", "#10b981")
     ]
     for nombre, f, t in pares:
         print(f"{nombre:34s} -> {cr(f, t):5.2f} : 1")
     '
     ```
  3. Contraste los resultados obtenidos con la Tabla 54.1 de referencia del proyecto.

### Tabla 54.1. Resultados de la auditoría de contraste sobre `src/css/estilos.css`

| Par de variables auditadas (`fondo` vs. `primer plano`) | Códigos hexadecimales | Luminancias (`L₂` / `L₁`) | Razón de contraste (`CR`) | Nivel WCAG 2.1 alcanzado |
| :--- | :---: | :---: | :---: | :---: |
| `--papel-rehundido` vs. `--tinta` (consolas y bloques de datos) | `#09101f` vs. `#ffffff` | `0,0053` / `1,0000` | `19,00 : 1` | Nivel AAA (`>= 7,0:1`) |
| `--fondo-app` vs. `--tinta` (lienzo general y títulos) | `#0c1527` vs. `#ffffff` | `0,0076` / `1,0000` | `18,23 : 1` | Nivel AAA (`>= 7,0:1`) |
| `--papel` vs. `--tinta` (paneles y vistas principales) | `#132039` vs. `#ffffff` | `0,0147` / `1,0000` | `16,24 : 1` | Nivel AAA (`>= 7,0:1`) |
| `--papel` vs. `--tinta-suave` (cuerpo de lectura) | `#132039` vs. `#f8fafc` | `0,0147` / `0,9560` | `15,56 : 1` | Nivel AAA (`>= 7,0:1`) |
| `--papel-alto` vs. `--tinta-suave` (subpaneles y barras) | `#1a2b4b` vs. `#f8fafc` | `0,0246` / `0,9560` | `13,49 : 1` | Nivel AAA (`>= 7,0:1`) |
| `--papel-tarjeta` vs. `--tinta` (títulos en tarjetas) | `#223861` vs. `#ffffff` | `0,0403` / `1,0000` | `11,63 : 1` | Nivel AAA (`>= 7,0:1`) |
| `--papel-tarjeta` vs. `--tinta-tenue` (metadatos y notas) | `#223861` vs. `#e2e8f0` | `0,0403` / `0,8012` | `9,43 : 1` | Nivel AAA (`>= 7,0:1`) |
| `--fondo-app` vs. `--ocre` (avisos preventivos) | `#0c1527` vs. `#f59e0b` | `0,0076` / `0,4410` | `8,52 : 1` | Nivel AAA (`>= 7,0:1`) |
| `--fondo-app` vs. `--agua` (enlaces sobre fondo base) | `#0c1527` vs. `#38bdf8` | `0,0076` / `0,4326` | `8,38 : 1` | Nivel AAA (`>= 7,0:1`) |
| `--papel` vs. `--musgo` (acentos cian en paneles) | `#132039` vs. `#06b6d4` | `0,0147` / `0,3645` | `6,41 : 1` | Nivel AA (AAA en texto grande) |
| `--papel-tarjeta` vs. `--agua` (enlaces sobre tarjetas) | `#223861` vs. `#38bdf8` | `0,0403` / `0,4326` | `5,35 : 1` | Nivel AA (AAA en texto grande) |
| `--papel-tarjeta` vs. `--esmeralda` (insignias en tarjetas) | `#223861` vs. `#10b981` | `0,0403` / `0,3636` | `4,58 : 1` | Nivel AA (`>= 4,5:1`) |

* **Verificación:** Compruebe que ningún par empleado en texto de lectura tenga un valor inferior a `7,00 : 1` (nivel AAA) y que ningún indicador o botón tenga un valor inferior a `4,50 : 1` (nivel AA).

> [!WARNING]
> **Qué hacer si falla:** Si al introducir un nuevo color en `:root` la razón de contraste cae por debajo de `4,50 : 1` sobre `--papel-tarjeta`, aumente la luminosidad del color de texto (acercándolo a `#f8fafc`) o reduzca la luminosidad del fondo antes de publicar.

---

## 55. Tutorial 16: reempaquetado de la base de datos y despliegue en producción

* **Objetivo:** Regenerar la documentación maestra, verificar la integridad de las 134 capas y publicar los cambios en los repositorios de producción (`origin/main` en Netlify y `espejo/main` en GitHub Pages).
* **Archivos:** `scripts/construir_manual_actualizacion_maestro.py`, `scripts/verificar_conteo_capas.py`, `scripts/verificar_integridad_despliegue.py` y árbol Git.
* **Pasos:**
  1. Reconstruya el manual de actualización sincronizando las copias en la raíz, `docs/` y `src/docs/`:
     ```bash
     python3 scripts/construir_manual_actualizacion_maestro.py
     ```
  2. Si modificó capas vectoriales o tablas maestras y necesita actualizar el paquete descargable ZIP (542,35 MB), ejecute únicamente en ese caso:
     ```bash
     python3 scripts/empaquetar_base_datos_completa.py
     ```
  3. Ejecute las pruebas de conteo de capas e integridad pre-despliegue:
     ```bash
     python3 scripts/verificar_conteo_capas.py
     python3 scripts/verificar_integridad_despliegue.py
     ```
  4. Revise con `git status -s` los archivos modificados, registre el commit y súbalo a producción:
     ```bash
     git add .
     git commit -m "docs: actualizar documentacion y sincronizar plataforma"
     git push origin main
     ```
* **Verificación:** Compruebe en la consola que `git push origin main` finalice sin errores y verifique la actualización en vivo en `https://atlasvgiuah.netlify.app/`.

> [!IMPORTANT]
> **Qué hacer si falla:** Si `git push` demora varios minutos, verifique con `git status` si modificó innecesariamente el archivo binario `docs/geodatabase_completa_atlas_vgi.zip` (542,35 MB en Git LFS). Si solo realizó cambios de código o documentación, restaure el binario con `git checkout -- docs/geodatabase_completa_atlas_vgi.zip src/docs/geodatabase_completa_atlas_vgi.zip` para que el envío a producción concluya en pocos segundos.

---
"""
print("[+] Parte 08 enriquecida cargada exitosamente")
