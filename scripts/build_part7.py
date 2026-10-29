# -*- coding: utf-8 -*-
"""
scripts/build_part7.py
Genera scripts/manual_p07_soporte_bibliografia.py
Capítulos 35 al 39: Flujo Git/LFS/Netlify, Matriz de Troubleshooting (15 casos forenses),
Glosario Extendido (52 términos), Marco Jurídico y Aparato Bibliográfico APA 7ª ed. (125 obras).
"""

import os
import sys

BASE_DIR = "/Users/geojplescano/Programas/Práctica profesional 2026 S2/nodo-geoabierto"
OUTPUT_FILE = os.path.join(BASE_DIR, "scripts", "manual_p07_soporte_bibliografia.py")
BIBLIO_FILE = os.path.join(BASE_DIR, "docs", "BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md")

# Leer el contenido del aparato bibliográfico oficial
with open(BIBLIO_FILE, "r", encoding="utf-8") as f:
    contenido_biblio = f.read()

part7_header = r"""# PARTE VII: OPERACIONES DE DESPLIEGUE, TROUBLESHOOTING, GLOSARIO Y MARCO TEÓRICO

---

## 35. Flujo de Trabajo en Git, Git LFS y Ciclo CI/CD en Netlify

El mantenimiento continuo y la reproducibilidad del Atlas de Información Geográfica Voluntaria exigen un flujo riguroso de control de versiones y despliegue continuo (*Continuous Integration / Continuous Deployment* - CI/CD). Este capítulo detalla la gestión de archivos binarios pesados mediante Git LFS, las políticas de ramas y confirmaciones (*commits*), y la configuración del entorno de compilación perimetral en Netlify.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CICLO DE INTEGRACIÓN Y DESPLIEGUE CONTINUO           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   Desarrollador / Investigador UAH                                      │
│             │                                                          │
│             ├──► 1. Edición y Validación Local                         │
│             │       python3 scripts/verificar_integridad_despliegue.py │
│             │                                                          │
│             ├──► 2. Confirmación Semántica y Git LFS                   │
│             │       git add . && git commit -m "feat: ..."             │
│             │                                                          │
│             ├──► 3. Publicación Remota a GitHub                        │
│             │       git push origin main                               │
│             │                                                          │
│             └──► 4. Disparo de Webhook Automático en Netlify           │
│                     │                                                  │
│                     ├──► Ingesta de Blobs Git LFS                      │
│                     ├──► Verificación de netlify.toml                 │
│                     ├──► Despliegue en Red Perimetral (Edge CDN)       │
│                     └──► Invalidación Inmediata de Caché Global        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```mermaid
flowchart LR
    DEV["Desarrollador / Investigador UAH"]
    VAL["scripts/verificar_integridad_despliegue.py"]
    GIT["git commit & git lfs track"]
    HUB["GitHub Repository (main)"]
    NET["Netlify Build Hook"]
    LFS["Ingesta Binarios LFS (543 MB ZIP)"]
    CDN["Netlify Global Edge CDN"]
    PROD["atlasvgiuah.netlify.app"]

    DEV -->|"1. Validación Local"| VAL
    VAL -->|"2. 8/8 Tests PASS"| GIT
    GIT -->|"3. git push origin main"| HUB
    HUB -->|"4. Webhook Trigger"| NET
    NET -->|"5. git lfs pull"| LFS
    LFS -->|"6. Atomic Deploy"| CDN
    CDN -->|"7. Live en Producción"| PROD
```

---

### 35.1 Configuración y Operación de Git Large File Storage (Git LFS)

El repositorio del Atlas contiene archivos geoespaciales masivos que superan los límites convencionales de Git (como extractos regionales de Geofabrik, GeoPackages SQLite y el paquete consolidado ZIP de 543 MB). Para gestionar estos recursos sin degradar el rendimiento del repositorio ni inflar el tamaño de la carpeta `.git/objects/`, se emplea **Git LFS (Large File Storage)**.

#### 1. Archivo de Configuración de Filtros (`.gitattributes`)

El archivo [`.gitattributes`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/.gitattributes) define qué patrones de archivos son interceptados por el motor LFS:

```gitattributes
# Archivos comprimidos y paquetes binarios masivos
*.zip filter=lfs diff=lfs merge=lfs -text
*.tar.gz filter=lfs diff=lfs merge=lfs -text
*.7z filter=lfs diff=lfs merge=lfs -text

# Contenedores espaciales OGC SQLite y Geodatabases
*.gpkg filter=lfs diff=lfs merge=lfs -text
*.sqlite filter=lfs diff=lfs merge=lfs -text

# Protocol Buffers binarios de OpenStreetMap
*.pbf filter=lfs diff=lfs merge=lfs -text
*.osm.pbf filter=lfs diff=lfs merge=lfs -text

# Coberturas vectoriales masivas regionales
datos/geofabrik_rm/*.geojson filter=lfs diff=lfs merge=lfs -text
datos/censo2024_raw/*.geojson filter=lfs diff=lfs merge=lfs -text

# Paquete masivo unificado institucional
descargas/atlas_vgi_uah_base_datos_completa.zip filter=lfs diff=lfs merge=lfs -text
```

#### 2. Comandos Esenciales de Gestión Git LFS

- **Instalación de los ganchos (*hooks*) locales de LFS:**
  ```bash
  git lfs install
  ```
- **Rastreo de un nuevo tipo de archivo pesado:**
  ```bash
  git lfs track "*.geopackage"
  git add .gitattributes
  ```
- **Descarga explícita de todos los objetos LFS en un clon nuevo:**
  ```bash
  git lfs pull
  ```
- **Verificación de archivos rastreados y sus tamaños:**
  ```bash
  git lfs ls-files
  ```

---

### 35.2 Convención de Mensajes de Confirmación (*Conventional Commits*)

Para mantener un historial de cambios legible, auditable y compatible con generadores automáticos de bitácoras (*Changelogs*), todo commit en el repositorio debe seguir la convención semántica:

$$
\text{tipo(ámbito opcional): descripción en presente o infinitivo}
$$

| Prefijo | Significado y Casos de Uso en el Atlas |
|---|---|
| `feat:` | Incorporación de una nueva funcionalidad cartográfica o módulo (ej: `feat(visor): agregar mapa de calor para arbolado urbano`). |
| `fix:` | Corrección de un fallo de renderizado, cálculo de calidad o enlace roto (ej: `fix(overpass): resolver timeout en consulta de patrimonio`). |
| `docs:` | Modificaciones en manuales, bitácoras o fichas de metadatos (ej: `docs(manual): expandir capitulos de PostGIS y Netlify`). |
| `data:` | Actualización, adición o depuración de coberturas GeoJSON o catálogos Excel (ej: `data(capas): refrescar capa de semaforos UOCT`). |
| `perf:` | Optimización de rendimiento, simplificación de geometrías o caché (ej: `perf(leaflet): implementar marcadores Canvas en arbolado`). |
| `refactor:` | Reestructuración de código JavaScript o Python sin alterar el comportamiento observable. |
| `style:` | Ajustes tipográficos, paletas de colores CSS `:root` o espaciado de interfaz. |
| `test:` | Adición o enriquecimiento de pruebas automatizadas en `verificar_integridad_despliegue.py`. |
| `chore:` | Tareas administrativas de mantenimiento, actualización de dependencias o configuración de Netlify. |

---

### 35.3 Automatización del Despliegue Perimetral en Netlify

El despliegue en producción es totalmente desatendido. Cada vez que se ejecuta un `git push origin main`, GitHub notifica a Netlify a través de un webhook seguro:

1. **Entorno de Compilación (*Build Container*):** Netlify inicializa una máquina virtual basada en Ubuntu 22.04 LTS (Jammy Jellyfish).
2. **Descarga de Objetos Git LFS:** Mediante la directiva `GIT_LFS_ENABLED = "true"` en las variables de entorno de Netlify, el clon incluye los binarios de `descargas/` y `datos/`.
3. **Parseo de `netlify.toml`:** Se aplican las directivas de publicación (`publish = "."`), las reglas de reescritura de cabeceras HTTP de seguridad y las políticas de caché perimetral.
4. **Despliegue Atómico (*Atomic Deploy*):** Los nuevos activos se distribuyen en milisegundos a todos los nodos perimetrales globales de Netlify.
5. **Invalidación de Caché Perimetral:** Se purga de inmediato la caché previa, garantizando que los usuarios reciban la última versión sin demoras.

---

## 36. Matriz de Troubleshooting y Resolución Forense de Incidentes (15 Casos Críticos)

A continuación se documenta el análisis forense de causa-raíz (*Root Cause Analysis* - RCA) y los procedimientos operativos de remediación paso a paso para los **15 incidentes técnicos más recurrentes** en el ciclo de vida del Atlas VGI:

```text
┌────────────────────────────────────────────────────────────────────────┐
│             MATRIZ DE RESOLUCIÓN FORENSE DE INCIDENTES (RCA)           │
├────────────────────────────────────────────────────────────────────────┤
│ Caso 01: Pantalla gris o tiles no renderizados en Leaflet              │
│ Caso 02: Inversión de coordenadas Latitud / Longitud en GeoJSON        │
│ Caso 03: Puntero Git LFS descargado como texto plano de 130 bytes      │
│ Caso 04: Error HTTP 429 Too Many Requests en Overpass API              │
│ Caso 05: Base de datos Supabase PostGIS en estado PAUSED               │
│ Caso 06: Bloqueo de peticiones AJAX por políticas CORS                 │
│ Caso 07: Error de parseo JSON por comas finales (Trailing Commas)      │
│ Caso 08: Geometrías nulas o vacías que rompen el ajuste de BBOX        │
│ Caso 09: Bloqueo de escritura por apertura concurrente en Excel (.xlsx)│
│ Caso 10: Caché perimetral persistente en navegadores de usuario        │
│ Caso 11: Error en algoritmo Ray-Casting por anillos poligonales rotos │
│ Caso 12: Desfase cartográfico por proyección UTM 19S (EPSG:32719)      │
│ Caso 13: Desbordamiento de memoria RAM (OOM) en procesamiento masivo   │
│ Caso 14: Discrepancia en el conteo de capas en interfaz web            │
│ Caso 15: Corrupción de caracteres especiales UTF-8 (Mojibake)          │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Caso 01: Pantalla Gris o Cuadrantes de Mapa no Renderizados en Leaflet
- **Síntoma:** Al conmutar entre pestañas de la SPA o al abrir un modal, el mapa de Leaflet muestra áreas grises y los mosaicos de OpenStreetMap solo aparecen parcialmente.
- **Causa Raíz:** Leaflet calcula las dimensiones de su contenedor (`#map`) al momento de inicializarse. Si el contenedor se encuentra oculto (`display: none`), sus dimensiones son $0 \times 0$ píxeles. Al hacerse visible, el motor no detecta automáticamente el cambio de tamaño del DOM.
- **Solución Paso a Paso:**
  Invoque el método `map.invalidateSize()` inmediatamente después de que el contenedor pase a ser visible, preferentemente dentro de un `setTimeout` o tras la transición CSS:
  ```javascript
  function alternarPestana(idPestana) {
      document.querySelectorAll('.modulo-pestana').forEach(p => p.classList.remove('activa'));
      const pestanaDestino = document.getElementById(idPestana);
      pestanaDestino.classList.add('activa');

      // Si la pestaña contiene el visor cartográfico, forzar recálculo
      if (idPestana === 'modulo-visor' && window.miMapaLeaflet) {
          setTimeout(() => {
              window.miMapaLeaflet.invalidateSize({ animate: false });
          }, 150);
      }
  }
  ```

---

### Caso 02: Inversión de Coordenadas Latitud / Longitud en Capas GeoJSON
- **Síntoma:** Al cargar una nueva capa vectorial, las entidades se proyectan en el Océano Índico o en la Antártida en lugar de Barrio Brasil.
- **Causa Raíz:** El estándar IETF GeoJSON (RFC 7946) estipula estrictamente el orden `[Longitud (X), Latitud (Y)]`. Por el contrario, la API de Leaflet (`L.latLng`) y la convención geográfica tradicional utilizan `[Latitud (Y), Longitud (X)]`.
- **Solución Paso a Paso:**
  1. Si procesa la capa en Python, verifique que `geometry.coordinates` respete `[lon, lat]`:
     ```python
     # Corrección en Python
     def invertir_coordenadas_geojson(coords):
         # Si la primera coordenada está entre -90 y 90 y la segunda entre -180 y 180 (Chile: lat ~ -33, lon ~ -70)
         if -40.0 <= coords[0] <= -20.0 and -80.0 <= coords[1] <= -60.0:
             return [coords[1], coords[0]] # Invertir a [lon, lat]
         return coords
     ```
  2. Si consume el GeoJSON en Leaflet mediante `L.geoJSON()`, Leaflet realiza la inversión internamente de manera automática, **siempre y cuando** el GeoJSON respete la norma `[lon, lat]`. Si una capa fue guardada erróneamente como `[lat, lon]`, utilice la opción `coordsToLatLng`:
     ```javascript
     L.geoJSON(datosCorruptos, {
         coordsToLatLng: function (coords) {
             // coords viene como [lat, lon] por error de origen -> invertir manualmente
             return new L.LatLng(coords[0], coords[1]);
         }
     }).addTo(map);
     ```

---

### Caso 03: Puntero Git LFS Descargado como Texto Plano de 130 Bytes
- **Síntoma:** El usuario hace clic en el botón de descarga masiva del archivo `atlas_vgi_uah_base_datos_completa.zip` y descarga un archivo corrupto de ~130 bytes cuyo contenido legible es:
  ```text
  version https://git-lfs.github.com/spec/v1
  oid sha256:4a8b7e...
  size 569832140
  ```
- **Causa Raíz:** El clon del repositorio en el entorno de despliegue de Netlify no ejecutó el comando `git lfs pull`, desplegando únicamente el archivo puntero (*LFS pointer file*) en lugar del binario real.
- **Solución Paso a Paso:**
  1. Acceda al panel de control de Netlify en `Site configuration` > `Environment variables`.
  2. Incorpore la variable de entorno:
     ```text
     GIT_LFS_ENABLED = "true"
     GIT_LFS_FETCH_INCLUDE = "descargas/*"
     ```
  3. Ejecute un nuevo despliegue manual con opción `Clear cache and deploy site`.
  4. Alternativamente, ejecute la verificación con `python3 scripts/verificar_integridad_despliegue.py`, el cual audita que el archivo ZIP supere obligatoriamente los 100 MB antes de permitir el commit.

---

### Caso 04: Error HTTP 429 Too Many Requests / 504 Gateway Timeout en Overpass API
- **Síntoma:** La descarga dinámica de categorías en vivo falla con código de error HTTP 429 o la petición se queda esperando indefinidamente hasta expirar con error 504.
- **Causa Raíz:** Los servidores públicos de Overpass API (`overpass-api.de`) implementan un sistema de colas y límites de velocidad (*rate limiting*) por dirección IP. Si se lanzan múltiples consultas complejas concurrentes con `[timeout:180]`, el servidor encola o rechaza temporalmente la IP.
- **Solución Paso a Paso:**
  Implemente en el script de consulta una lista de espejos (*mirrors*) con alternancia automática (*fallback*) y retroceso exponencial (*exponential backoff*):
  ```python
  SERVIDORES_OVERPASS = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
  ]

  def ejecutar_consulta_overpass_robusta(consulta_ql):
      for url in SERVIDORES_OVERPASS:
          try:
              print(f"[*] Intentando consulta en espejo: {url}")
              resp = requests.post(url, data={"data": consulta_ql}, timeout=60)
              if resp.status_code == 200:
                  return resp.json()
              elif resp.status_code == 429:
                  print("    [!] Servidor saturado (429). Esperando 10s...")
                  time.sleep(10)
          except requests.exceptions.RequestException as e:
              print(f"    [!] Fallo en espejo {url}: {e}")
              continue
      raise RuntimeError("Todos los servidores Overpass fallaron.")
  ```

---

### Caso 05: Base de Datos Supabase PostGIS en Estado PAUSED por Inactividad
- **Síntoma:** Las consultas espaciales a Supabase retornan errores de conexión o HTTP 503 *Service Unavailable*.
- **Causa Raíz:** En las instancias gratuitas de Supabase Cloud, el clúster de base de datos entra en modo de suspensión (*paused*) tras 7 días de inactividad de peticiones API.
- **Solución Paso a Paso:**
  1. Acceda al panel de administración de Supabase y haga clic en **Restore Project**. El clúster tardará entre 60 y 90 segundos en reanudarse.
  2. Para evitar suspensiones futuras, configure una tarea programada (*cron job*) que envíe un pulso de lectura cada 3 días a la tabla de metadatos:
     ```bash
     curl -s -H "apikey: SUPABASE_ANON_KEY" "https://tu-proyecto.supabase.co/rest/v1/capas_metadata?select=id&limit=1" > /dev/null
     ```
  3. Recuerde que el visor web cuenta con **triple failover**: si Supabase no responde, el mapa conmuta de forma transparente al GeoJSON local alojado en la Edge CDN de Netlify.

---

### Caso 06: Bloqueo de Peticiones AJAX por Políticas CORS (*Cross-Origin Resource Sharing*)
- **Síntoma:** En la consola de desarrollo del navegador aparece el error:
  `Access to fetch at 'https://...' from origin 'http://localhost:8000' has been blocked by CORS policy`.
- **Causa Raíz:** El recurso remoto no incluye el encabezado HTTP `Access-Control-Allow-Origin: *` o el navegador bloquea la petición por incompatibilidad de dominios.
- **Solución Paso a Paso:**
  1. En `netlify.toml`, asegúrese de declarar explícitamente las cabeceras CORS para todos los archivos estáticos:
     ```toml
     [[headers]]
       for = "/*"
       [headers.values]
         Access-Control-Allow-Origin = "*"
         Access-Control-Allow-Methods = "GET, POST, OPTIONS"
         Access-Control-Allow-Headers = "Content-Type, Authorization, apikey"
     ```
  2. Para desarrollo local, ejecute un servidor con soporte CORS habilitado:
     ```bash
     python3 -m http.server 8080 --bind 127.0.0.1
     ```

---

### Caso 07: Error de Parseo JSON por Comas Finales (*Trailing Commas*)
- **Síntoma:** `JSONDecodeError: Expecting property name enclosed in double quotes: line 1240 column 9`.
- **Causa Raíz:** En la generación manual o mediante scripts de un archivo GeoJSON, quedó una coma tras el último elemento de un arreglo `features: [..., ]` o de un objeto `properties: {..., }`. El estándar JSON estricto prohíbe comas finales.
- **Solución Paso a Paso:**
  Ejecute el script de saneamiento automático con expresiones regulares:
  ```python
  import re

  def limpiar_comas_finales(texto_json):
      # Elimina comas antes de llaves o corchetes de cierre
      texto_limpio = re.sub(r',\s*([\]}])', r'\1', texto_json)
      return texto_limpio
  ```

---

### Caso 08: Geometrías Nulas o Vacías que Rompen el Ajuste de Encuadre (*fitBounds*)
- **Síntoma:** Al invocar `map.fitBounds(capa.getBounds())` en Leaflet, se genera la excepción en consola: `Error: Bounds are not valid`.
- **Causa Raíz:** La capa GeoJSON contiene una entidad con `geometry: null` o con un arreglo de coordenadas vacío `coordinates: []`. Al intentar calcular los límites extremos (Norte, Sur, Este, Oeste), Leaflet obtiene valores `NaN` (*Not a Number*).
- **Solución Paso a Paso:**
  1. Valide siempre que los límites sean válidos antes de aplicarlos:
     ```javascript
     const limites = capaVectorial.getBounds();
     if (limites.isValid()) {
         map.fitBounds(limites, { padding: [20, 20], maxZoom: 18 });
     } else {
         console.warn("[!] Límites de capa no válidos. Revertiendo a vista por defecto.");
         map.setView([-33.4429, -70.6638], 15);
     }
     ```
  2. Depure el archivo GeoJSON eliminando entidades sin geometría:
     ```python
     data["features"] = [f for f in data["features"] if f.get("geometry") and f["geometry"].get("coordinates")]
     ```

---

### Caso 09: Bloqueo de Archivos Excel por Apertura Concurrente (`PermissionError`)
- **Síntoma:** `PermissionError: [Errno 13] Permission denied: 'catalogos/catalogo_capas_completo_vgi_uah.xlsx'`.
- **Causa Raíz:** El archivo `.xlsx` se encuentra abierto en Microsoft Excel, LibreOffice o Numbers en la computadora local. Estos programas bloquean el descriptor de archivo a nivel de sistema operativo para prevenir escrituras concurrentes.
- **Solución Paso a Paso:**
  1. Cierre la aplicación ofimática que mantiene abierto el archivo.
  2. Implemente en el script de generación una escritura atómica mediante archivo temporal con reemplazo seguro:
     ```python
     import tempfile
     import shutil

     def guardar_excel_seguro(wb, ruta_destino):
         directorio = os.path.dirname(ruta_destino)
         with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx", dir=directorio) as tmp:
             nombre_tmp = tmp.name
         wb.save(nombre_tmp)
         shutil.move(nombre_tmp, ruta_destino)
         print(f"✓ Guardado atómico completado en {ruta_destino}")
     ```

---

### Caso 10: Cambios en CSS/JS no Visibles por Caché Persistente en Clientes
- **Síntoma:** El desarrollador desplegó cambios visuales en el visor, pero los usuarios continúan viendo los colores o funciones antiguas.
- **Causa Raíz:** Los navegadores web almacenan en caché local los archivos `.css` y `.js` agresivamente si no se modifica su nombre o si los encabezados de respuesta indican duraciones prolongadas.
- **Solución Paso a Paso:**
  Aplique la técnica de **Cache-Busting por Query String** en las referencias de `index.html`:
  ```html
  <!-- Versión con control de huella de tiempo -->
  <link rel="stylesheet" href="css/estilos.css?v=20261020_01">
  <script src="js/app.js?v=20261020_01"></script>
  ```
  Y en `netlify.toml`, establezca la política de no-caché para los archivos HTML principales:
  ```toml
  [[headers]]
    for = "/*.html"
    [headers.values]
      Cache-Control = "public, max-age=0, must-revalidate"
  ```

---

### Caso 11: Error en Algoritmo Ray-Casting por Polígonos con Auto-Intersecciones
- **Síntoma:** El Inspector Normativo del PRC de Santiago clasifica erróneamente un punto ubicado dentro de una Zona de Conservación Histórica como "Fuera de Límite".
- **Causa Raíz:** El polígono de zonificación contiene vértices duplicados o segmentos que se auto-intersectan (*self-intersecting rings*), lo que altera la paridad (par/impar) del algoritmo de Jordan (*Ray-Casting algorithm*).
- **Solución Paso a Paso:**
  Saneee las geometrías en Python utilizando `shapely.validation.make_valid`:
  ```python
  from shapely.geometry import shape, mapping
  from shapely.validation import make_valid

  def corregir_topologia_poligono(feature_geojson):
      geom = shape(feature_geojson["geometry"])
      if not geom.is_valid:
          geom_corregida = make_valid(geom)
          feature_geojson["geometry"] = mapping(geom_corregida)
      return feature_geojson
  ```

---

### Caso 12: Desfase Cartográfico Masivo por Proyección UTM 19S (EPSG:32719)
- **Síntoma:** Las entidades no aparecen en el visor y al inspeccionar el GeoJSON, las coordenadas tienen valores como `[345210.45, 6298540.12]`.
- **Causa Raíz:** Los datos provienen de una fuente oficial del Estado que utiliza el sistema de coordenadas planas proyectadas SIRGAS-Chile / UTM Huso 19 Sur (EPSG:32719), mientras que Leaflet y GeoJSON esperan grados decimales en WGS84 (EPSG:4326).
- **Solución Paso a Paso:**
  Reproyecte la capa mediante `geopandas` antes de su ingesta en el visor:
  ```python
  import geopandas as gpd

  gdf = gpd.read_file("capa_utm.geojson")
  if gdf.crs != "EPSG:4326":
      print(f"[*] Reproyectando de {gdf.crs} a EPSG:4326...")
      gdf = gdf.to_crs(epsg=4326)
      gdf.to_file("capa_wgs84.geojson", driver="GeoJSON")
  ```

---

### Caso 13: Desbordamiento de Memoria RAM (OOM) en Procesamiento Masivo de OSM
- **Síntoma:** Al ejecutar un script sobre el extracto de Geofabrik de la Región Metropolitana, el proceso es abortado bruscamente con el mensaje `Killed: 9` o `MemoryError`.
- **Causa Raíz:** El archivo JSON supera los 1.5 GB de texto. La función `json.load()` intenta construir el árbol completo de objetos en memoria RAM, requiriendo entre 4 y 6 veces el peso del archivo en memoria desempacada.
- **Solución Paso a Paso:**
  Procese el archivo en modo secuencial (*streaming*) mediante la librería `ijson`:
  ```python
  import ijson

  def procesar_geojson_por_streaming(ruta_archivo):
      with open(ruta_archivo, 'rb') as f:
          # Itera elemento por elemento dentro del arreglo features sin cargar todo en RAM
          for feature in ijson.items(f, 'features.item'):
              props = feature.get('properties', {})
              # Procesar la entidad individualmente
              yield feature
  ```

---

### Caso 14: Discrepancia en el Conteo de Capas de la Interfaz Web
- **Síntoma:** La barra de estado indica "118 capas cargadas", pero en el directorio `datos/capas/` existen 125 archivos `.geojson`.
- **Causa Raíz:** El directorio local contiene archivos temporales, capas de respaldo (`copia_*.geojson`) o extractos auxiliares que no están registrados en el índice maestro `catalogo_capas_completo_vgi_uah.xlsx` ni en el arreglo de capas activas de `app.js`.
- **Solución Paso a Paso:**
  Ejecute el script de auditoría `scripts/verificar_conteo_capas.py` para listar los archivos huérfanos y elimínelos o muévalos a una carpeta externa fuera del árbol público de despliegue.

---

### Caso 15: Corrupción de Caracteres Especiales UTF-8 (Mojibake)
- **Síntoma:** Los nombres de calles o equipamientos en los popups se leen como "Plaza del RÃ©gimen", "EstaciÃ³n Central" o "BaÃ±os PÃºblicos".
- **Causa Raíz:** Los archivos fueron codificados originalmente en Windows-1252 / ISO-8859-1 y posteriormente guardados o interpretados como UTF-8, o sufrieron una doble codificación UTF-8 (*double UTF-8 encoding*).
- **Solución Paso a Paso:**
  Sanee la codificación en Python asegurando la decodificación y recodificación estricta:
  ```python
  def reparar_mojibake(texto):
      try:
          return texto.encode('latin1').decode('utf-8')
      except (UnicodeEncodeError, UnicodeDecodeError):
          return texto # Ya estaba correcto o es irrecuperable
  ```

---

## 37. Glosario Técnico Extendido (52 Términos Esenciales del Ecosistema VGI)

Para facilitar la comprensión interdisciplinaria entre geógrafos, urbanistas, ingenieros en informática y actores territoriales comunitarios, se presenta la definición enciclopédica y operativa de los conceptos nodales del Atlas:

1. **Información Geográfica Voluntaria (VGI):** Término acuñado por Michael Goodchild (2007) para describir la creación, compilación y difusión participativa de datos geoespaciales aportados voluntariamente por ciudadanos e individuos actuando como "sensores humanos inteligentes".
2. **Neogeografía:** Práctica cartográfica contemporánea caracterizada por la apropiación ciudadana de herramientas web y tecnologías geoespaciales fuera de los círculos profesionales tradicionales de la agrimensura y la cartografía formal del Estado.
3. **Sistemas de Información Geográfica Participativos (PGIS / SIG-P):** Integración sistemática de herramientas SIG con metodologías participativas de investigación-acción, orientadas a empoderar comunidades locales en la gestión de sus territorios y la defensa de sus derechos espaciales.
4. **Crowdsourcing Geográfico:** Modelo colaborativo de recolección de datos masivos en el cual una multitud abierta y distribuida contribuye pequeñas fracciones de información espacial que, agregadas, componen una cobertura exhaustiva.
5. **OpenStreetMap (OSM):** Proyecto colaborativo de cobertura mundial fundado en 2004 por Steve Coast, orientado a construir una base de datos cartográfica libre, editable y abierta bajo licencia Open Database License (ODbL).
6. **Nodo (OSM Node):** Primitiva geométrica fundamental en OpenStreetMap que representa una coordenada geográfica puntual única en el elipsoide WGS84, definida por su latitud, longitud y un conjunto de etiquetas semánticas (*tags*).
7. **Vía (OSM Way):** Secuencia ordenada de 2 a 2.000 nodos que modela una entidad lineal (calles, ríos, senderos) o, si el primer nodo coincide con el último, un área poligonal cerrada (edificios, parques, plazas).
8. **Relación (OSM Relation):** Estructura de datos compleja que agrupa elementos básicos (nodos, vías u otras relaciones) para modelar fenómenos territoriales compuestos, tales como rutas de transporte público, límites comunales o polígonos con huecos (*multipolygon*).
9. **Etiquetas (OSM Tags):** Pares de clave-valor (`clave=valor` o `key=value`) codificados en UTF-8 que describen las propiedades semánticas, funcionales o físicas de un elemento cartográfico (ej: `amenity=school`, `highway=cycleway`).
10. **Taginfo:** Servicio analítico oficial de OpenStreetMap que monitorea y documenta la frecuencia de uso, estadísticas y sintaxis de cada etiqueta en la base de datos global.
11. **Overpass QL:** Lenguaje declarativo de consultas optimizado para la extracción y filtrado en tiempo real de geometrías y atributos de la base de datos de OpenStreetMap mediante la API Overpass.
12. **ohsome API / Marco OSHDB:** Plataforma analítica de big data geoespacial desarrollada por el *Heidelberg Institute for Geoinformation Technology (HeiGIT)*, que permite auditar el historial completo de ediciones de OpenStreetMap (*OpenStreetMap History Database*) y calcular métricas temporales de calidad.
13. **Darwin Core Standard (DwC):** Estándar de metadatos del *Biodiversity Information Standards (TDWG)* diseñado para facilitar el intercambio y la integración interoperable de registros de observación de biodiversidad y especímenes biológicos.
14. **GBIF (Global Biodiversity Information Facility):** Red internacional e infraestructura de datos abierta financiada por gobiernos mundiales, orientada a proporcionar libre acceso a datos sobre todas las formas de vida en la Tierra.
15. **Open Database License (ODbL v1.0):** Licencia de derechos de autor y de bases de datos creada por Open Data Commons que rige sobre OpenStreetMap, garantizando los derechos de copia, distribución, modificación y enriquecimiento de los datos, sujeta a atribución y reciprocidad estricta (*Share-Alike*).
16. **Creative Commons Atribución (CC BY 4.0):** Licencia jurídica abierta que autoriza la reutilización, redistribución y adaptación comercial y no comercial de obras y datos, con el único requisito de brindar el debido reconocimiento de autoría.
17. **GNU Affero General Public License (AGPLv3):** Licencia de software libre con copyleft fuerte que exige que cualquier software derivado o modificado servido a través de una red informática (como aplicaciones web) ponga a disposición pública su código fuente completo.
18. **ISO 19115-1:2014:** Norma internacional que define el esquema conceptual y los elementos de metadatos estandarizados requeridos para describir recursos geográficos, servicios espaciales y colecciones cartográficas.
19. **ISO 19139:2007:** Especificación técnica que define la implementación del esquema XML (*Extensible Markup Language*) correspondiente al estándar de metadatos ISO 19115.
20. **ISO 19157:2013:** Estándar internacional que establece los principios, dimensiones, medidas y procedimientos para evaluar y documentar la calidad de la información geográfica (exactitud posicional, completitud, coherencia lógica, etc.).
21. **ISO 19110:2016:** Metodología y estructura formal para la catalogación y definición de fenómenos geográficos y sus atributos asociados (*feature cataloguing*).
22. **Combinación Lineal Ponderada (WLC):** Método matemático de evaluación multicriterio que calcula un índice de aptitud o calidad sintética mediante la suma de los valores de múltiples criterios multiplicados por sus respectivos pesos relativos normalizados.
23. **Proceso de Análisis Jerárquico (AHP):** Metodología de toma de decisiones multicriterio formulada por Thomas Saaty, basada en matrices de comparaciones pareadas y cálculo del vector propio principal para determinar pesos objetivos de importancia.
24. **Algoritmo Ray-Casting:** Técnica matemática de geometría computacional utilizada en pruebas de Punto en Polígono (*Point-in-Polygon* - PiP), fundamentada en el Teorema de la Curva de Jordan: un rayo proyectado desde el punto en cualquier dirección intersectará el perímetro del polígono un número impar de veces si el punto está dentro, y un número par si está fuera.
25. **WGS84 (EPSG:4326):** Sistema Geodésico Mundial de 1984, sistema de coordenadas elipsoidales tridimensionales de referencia universal utilizado por la constelación GPS y por defecto en los formatos web GeoJSON y OpenStreetMap.
26. **Web Mercator (EPSG:3857):** Proyección cartográfica conforme cilíndrica estándar utilizada por prácticamente la totalidad de los proveedores de mapas web (OpenStreetMap, Google Maps, Bing Maps) para proyectar el elipsoide WGS84 sobre un plano bidimensional cuadrado.
27. **SIRGAS-Chile / UTM Huso 19S (EPSG:32719):** Sistema de proyección cilíndrica conforme transversal oficial del Estado de Chile para la zona central (incluyendo la Región Metropolitana), cuyas unidades se expresan en metros planos.
28. **GeoJSON:** Formato abierto de intercambio de datos geoespaciales basado en el estándar JSON (*JavaScript Object Notation*), formalizado por el Grupo de Trabajo de Ingeniería de Internet (IETF) bajo la norma RFC 7946.
29. **GeoPackage (GPKG):** Estándar abierto del Open Geospatial Consortium (OGC) implementado como una base de datos relacional SQLite ligera autocontenida en un solo archivo binario, capaz de almacenar capas vectoriales, matriciales (*tiles*) y metadatos.
30. **ESRI Shapefile (SHP):** Formato vectorial histórico propietario de ESRI compuesto por múltiples archivos vinculados (`.shp`, `.shx`, `.dbf`, `.prj`), limitado a nombres de columnas de 10 caracteres y archivos de hasta 2 GB.
31. **Web Map Service (WMS):** Protocolo estándar OGC que sirve imágenes georreferenciadas de mapas renderizadas dinámicamente en el servidor en formatos raster como PNG o JPEG.
32. **Web Feature Service (WFS):** Protocolo estándar OGC que permite a los clientes solicitar, consultar e interactuar con geometrías y atributos vectoriales crudos a través de la web en formato GML o GeoJSON.
33. **Tile Map Service (XYZ Tiles):** Arquitectura de distribución de mosaicos cartográficos prerenderizados de $256 \times 256$ píxeles indexados jerárquicamente por nivel de zoom ($Z$) y coordenadas de tesela ($X, Y$).
34. **PostgreSQL 17:** Sistema gestor de bases de datos relacional orientada a objetos de código abierto, líder en estabilidad, extensibilidad y cumplimiento de normas SQL.
35. **PostGIS:** Extensión espacial para PostgreSQL que habilita tipos de datos geométricos y geográficos nativos, funciones topológicas avanzadas e indexación espacial conforme al estándar OGC Simple Features.
36. **Índice Espacial GiST:** Árbol de búsqueda generalizado (*Generalized Search Tree*) que implementa estructuras R-Tree en PostgreSQL para acelerar búsquedas espaciales multidimensionales y operadores de intersección (`&&`).
37. **JSONB:** Representación binaria optimizada de datos JSON en PostgreSQL que almacena los documentos en formato estructurado descompuesto, permitiendo búsquedas rápidas mediante índices GIN sin necesidad de parseo en tiempo de ejecución.
38. **Índice Invertido GIN:** Estructura de indexación en PostgreSQL diseñada para manejar tipos de datos con múltiples elementos internos (como arreglos o documentos JSONB), asignando punteros desde cada clave y valor hacia las filas correspondientes.
39. **Row Level Security (RLS):** Característica de seguridad de PostgreSQL que permite restringir a nivel de fila individual qué registros pueden ser consultados, insertados, modificados o eliminados según el rol del usuario conectado.
40. **Supabase Cloud:** Plataforma backend serverless de código abierto construida sobre PostgreSQL, que provee APIs automáticas (PostgREST), autenticación, almacenamiento de objetos y suscripciones en tiempo real.
41. **Single Page Application (SPA):** Aplicación o sitio web que interactúa con el usuario reescribiendo dinámicamente la página web actual en lugar de cargar páginas enteras desde un servidor, proporcionando una experiencia fluida tipo software de escritorio.
42. **Immediately Invoked Function Expression (IIFE):** Patrón de diseño en JavaScript que encapsula variables y funciones dentro de un ámbito léxico cerrado, ejecutándose inmediatamente tras su definición para prevenir la contaminación del objeto global `window`.
43. **Leaflet 1.9.4:** Biblioteca de software libre en JavaScript para la creación de mapas interactivos adaptables a dispositivos móviles, destacada por su peso ultraligero (~42 KB) y rendimiento eficiente.
44. **Edge Content Delivery Network (Edge CDN):** Red de servidores proxy distribuidos geográficamente en el borde de la red (*edge nodes*) que entregan contenido web estático a los usuarios desde el punto físicamente más cercano, minimizando la latencia.
45. **OpenXML Spreadsheet (.xlsx):** Formato de archivo estandarizado (ISO/IEC 29500) basado en paquetes ZIP que contienen múltiples archivos XML interrelacionados para representar hojas de cálculo complejas con fórmulas y estilos.
46. **GeoPandas:** Biblioteca de código abierto en Python que extiende las estructuras de datos de `pandas` para permitir operaciones espaciales vectoriales mediante `shapely`, `fiona` y `pyproj`.
47. **Plan Regulador Comunal de Santiago (PRC Santiago):** Instrumento de planificación territorial normativo a escala comunal que establece las condiciones urbanísticas de edificación, uso de suelo, vialidad y protección patrimonial en la comuna de Santiago.
48. **Zona de Conservación Histórica (ZCH):** Área urbana delimitada por el Plan Regulador Comunal en virtud de la Ley General de Urbanismo y Construcciones (LGUC), con el objeto de preservar su identidad patrimonial, morfológica y ambiental.
49. **Inmueble de Conservación Histórica (ICH):** Edificio, estructura o elemento urbano individual reconocido y protegido por el Plan Regulador Comunal por su valor arquitectónico, histórico o cultural.
50. **Infraestructura de Datos Espaciales de Chile (IDE Chile / SNIT):** Red de instituciones públicas del Estado de Chile articulada para coordinar la producción, estandarización y difusión de información geoespacial oficial y fidedigna.
51. **Unidad Operativa de Control de Tránsito (UOCT / MTT):** Organismo dependiente del Ministerio de Transportes y Telecomunicaciones encargado de gestionar, programar y supervisar en tiempo real la red de semáforos y los flujos vehiculares en las grandes urbes de Chile.
52. **Censo de Población y Vivienda 2024 (INE Chile):** Operativo estadístico y demográfico nacional levantado por el Instituto Nacional de Estadísticas para caracterizar el volumen, composición y condiciones habitacionales de la población chilena a nivel de manzana y zona censal.

---

## 38. Marco Jurídico, Licencias y Propiedad Intelectual Territorial

El desarrollo y publicación del Atlas de Información Geográfica Voluntaria para la Gestión Territorial se fundamenta en un marco de estricto cumplimiento normativo, garantizando la interoperabilidad jurídica y la soberanía de los datos públicos:

### 38.1 Ley N° 20.285 sobre Acceso a la Información Pública (Estado de Chile)

Todas las capas oficiales integradas en el Atlas (provenientes de MINVU, INE, MTT/UOCT, DGA y Municipalidad de Santiago) han sido recopiladas en conformidad con el principio de transparencia de la función pública consagrado en la Ley N° 20.285. Dicha normativa establece que la información elaborada con presupuesto público es de dominio público y de libre acceso ciudadano, autorizando su uso para fines científicos, analíticos y de planificación territorial sin cobro de aranceles.

### 38.2 Licencia Open Database License (ODbL v1.0) en Datos OpenStreetMap

Los datos vectoriales derivados de OpenStreetMap se distribuyen bajo la licencia internacional **ODbL v1.0**. Esta licencia otorga al usuario el derecho irrestricto de:
1. **Compartir:** Copiar, distribuir y transmitir la base de datos.
2. **Crear:** Producir obras y mapas derivados a partir de la base de datos.
3. **Adaptar:** Modificar, transformar y enriquecer los datos espaciales.

**Obligaciones Clave del Usuario:**
- **Atribución (*Attribution*):** Debe citar explícitamente a OpenStreetMap como fuente: *"© Colaboradores de OpenStreetMap"*.
- **Compartir Igual (*Share-Alike*):** Si se distribuye una versión modificada de la base de datos o una base de datos derivada, esta debe quedar sujeta a los mismos términos de la licencia ODbL.
- **Mantener Abierto (*Keep Open*):** Si se distribuye la base de datos o una obra adaptada, no se pueden aplicar medidas tecnológicas de protección (como DRM o cifrado restrictivo) que impidan que otros ejerzan los derechos garantizados por la licencia.

### 38.3 Política de Uso Justo de Teselas Cartográficas (*Tile Usage Policy*)

El Atlas VGI cumple rigurosamente con la política de uso de servidores de mosaicos de la OpenStreetMap Foundation (OSMF):
- Se prohíbe el raspado masivo (*scraping*) y la precarga automática de todas las teselas del mapa.
- El visor web envía una cabecera de agente de usuario (*User-Agent*) válida e identificable: `AtlasVGI-UAH-Geografia/1.0`.
- Se implementa almacenamiento en caché del lado del cliente en mosaicos ya visualizados, minimizando las solicitudes a los servidores comunitarios.

### 38.4 Licencia del Código Fuente del Atlas

El código fuente de la plataforma web, sus módulos interactivos y los scripts de automatización en Python se distribuyen bajo la licencia de software libre **GNU Affero General Public License versión 3 (AGPLv3)**. Esta licencia asegura que cualquier proyecto que utilice, modifique o sirva esta plataforma a través de internet deba mantener público y accesible el código fuente completo, fomentando la ciencia abierta y el desarrollo territorial soberano.

---

## 39. Aparato Bibliográfico Consolidado — 125 Referencias en Formato APA 7ª Edición

El siguiente corpus bibliográfico reúne las **125 referencias formales estandarizadas en norma APA 7ª edición**, integrando la totalidad de la literatura seminal de investigación del Departamento de Geografía de la Universidad Alberto Hurtado con los marcos normativos, jurídicos y estándares internacionales que fundamentan el diseño del Atlas VGI:

"""

# Integración limpia de las 125 referencias bibliográficas
part7_full = part7_header + "\n" + contenido_biblio + "\n"

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("# -*- coding: utf-8 -*-\n")
    f.write('PARTE_07 = r"""' + part7_full + '"""\n')
    f.write('print("[+] Parte 07 enriquecida cargada exitosamente")\n')

print("[+] scripts/build_part7.py ejecutado correctamente.")
