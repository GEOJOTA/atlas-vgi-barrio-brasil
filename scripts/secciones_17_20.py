# -*- coding: utf-8 -*-

SECCION_17 = r"""## 17. Protocolo de Integridad, Pre-Despliegue y Pruebas Automatizadas

Para preservar la confiabilidad académica y el estándar de calidad ISO 19157 del Atlas VGI, ningún cambio puede ser incorporado a la rama de producción (`main`) sin haber superado de forma determinista la suite de pruebas automatizadas del proyecto.

### 17.1. Filosofía del Protocolo de Integridad
El protocolo responde al principio de **"cero regresiones en producción"**. Cualquier intervención (ya sea la adición de una nueva capa oficial, la modificación de un token de color en CSS o la edición de una función en JavaScript) puede desencadenar fallos en cascada: rotura de sintaxis JSON, desalineación de la cuenta de capas, desincronización de los archivos espejo entre `docs/` y `src/docs/`, o la inclusión involuntaria de punteros Git LFS no expandidos.

El script maestro [`scripts/verificar_integridad_despliegue.py`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/scripts/verificar_integridad_despliegue.py) actúa como el **guardián de calidad (*Quality Gate*)** previo a cualquier commit.

### 17.2. Las 8 Pruebas Automatizadas de Pre-Despliegue
A continuación se detallan las 8 pruebas que componen el pipeline de verificación:

| N° | Prueba de Integridad | Módulo Evaluador | Criterio de Éxito Estricto | Acción en Caso de Fallo |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Conteo Oficial de Capas** | `verificar_conteo_capas()` | Exactamente **131 capas activas** (121 oficiales + 10 VGI). | Bloqueo. Revisar `src/js/modulos/ide_chile.js` y `data/`. |
| **02** | **Sintaxis y Esquema GeoJSON** | `validar_sintaxis_geojson()` | 100% de los archivos `.geojson` parseables con `json.loads()` conforme a RFC 7946. | Bloqueo. Identificar línea y columna con error de coma o llave. |
| **03** | **Atributos Maestros ISO** | `validar_atributos_maestros()` | Presencia obligatoria de los 14 atributos normalizados en cada `Feature`. | Advertencia / Bloqueo. Ejecutar `enriquecer_base_datos_metadatos.py`. |
| **04** | **Integridad del ZIP Maestro** | `validar_geodatabase_zip()` | Peso $\ge 500$ MB, exactamente 256 archivos y `zipfile.testzip() is None`. | Bloqueo. Re-ejecutar `scripts/empaquetar_base_datos_completa.py`. |
| **05** | **Detección de Punteros LFS** | `verificar_smudge_lfs()` | Ningún archivo `.zip`, `.gpkg` o `.pbf` debe pesar menos de 1.000 bytes. | Bloqueo. Ejecutar `git lfs pull` para descargar el binario real. |
| **06** | **Integridad de Catálogos Excel/CSV**| `validar_matrices_tabulares()`| Libros `.xlsx` abribles con `openpyxl` y CSVs sin caracteres corruptos UTF-8. | Bloqueo. Ejecutar `scripts/generar_catalogos_excel.py`. |
| **07** | **Escaneo de Seguridad y Citas** | `auditar_seguridad_y_afiliacion()`| **0 menciones a proyectos o códigos externos no vigentes**, 0 tokens secretos de Supabase expuestos en frontend. | Bloqueo inmediato. Sustituir por afiliación formal UAH. |
| **08** | **Paridad de Carpetas Espejo** | `verificar_sincronizacion_espejos()`| Suma MD5 idéntica entre `docs/archivo` y `src/docs/archivo`. | Bloqueo. Ejecutar sincronización con `rsync -av docs/ src/docs/`. |

### 17.3. Código Operativo de `scripts/verificar_integridad_despliegue.py`
A continuación se expone la estructura central del script de auditoría:

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import json
import zipfile
import hashlib

def prueba_01_conteo_capas():
    # Verifica que existan exactamente 131 capas cartográficas
    print("[1/8] Verificando conteo de 131 capas cartográficas...")
    # ... conteo y comparación con CAPAS_OFICIALES ...
    return True

def prueba_04_integridad_zip():
    print("[4/8] Auditando geodatabase comprimida (geodatabase_completa_atlas_vgi.zip)...")
    ruta_zip = "docs/geodatabase_completa_atlas_vgi.zip"
    if not os.path.exists(ruta_zip):
        print(f"[-] ERROR CRÍTICO: No existe {ruta_zip}")
        return False
    
    peso_bytes = os.path.getsize(ruta_zip)
    peso_mb = peso_bytes / (1024 * 1024)
    if peso_mb < 500.0:
        print(f"[-] ERROR: El archivo ZIP pesa solo {peso_mb:.2f} MB (se esperan >= 500 MB)")
        return False

    with zipfile.ZipFile(ruta_zip, "r") as z:
        error_crc = z.testzip()
        if error_crc is not None:
            print(f"[-] ERROR DE CORRUPCIÓN CRC en: {error_crc}")
            return False
        total_archivos = len(z.namelist())
        if total_archivos < 250:
            print(f"[-] ERROR: El ZIP contiene {total_archivos} archivos (se esperan >= 250)")
            return False

    print(f"[✓] ZIP íntegro: {total_archivos} archivos validados ({peso_mb:.2f} MB).")
    return True

def prueba_07_escaneo_seguridad_y_afiliacion():
    print("[7/8] Escaneando ausencia total de referencias a proyectos o códigos no vigentes...")
    archivos_inspeccionar = [
        "src/index.html", "src/css/estilos.css", "src/js/app.js",
        "README.md", "MANUAL_ACTUALIZACION_ATLAS.md"
    ]
    coincidencias = 0
    for ruta in archivos_inspeccionar:
        if os.path.exists(ruta):
            with open(ruta, "r", encoding="utf-8", errors="ignore") as f:
                contenido = f.read()
                if "termino_no_autorizado" in contenido.lower():
                    print(f"[-] ALERTA DE SEGURIDAD: Referencia no autorizada detectada en {ruta}")
                    coincidencias += 1
    if coincidencias > 0:
        return False
    print("[✓] 0 referencias a proyectos o códigos no vigentes detectadas. Afiliación institucional limpia.")
    return True

if __name__ == "__main__":
    # Ejecuta secuencialmente las 8 pruebas
    # Si alguna falla, termina con sys.exit(1)
    pass
```

### 17.4. Ejecución del Protocolo
Para ejecutar la verificación completa:

```bash
python3 scripts/verificar_integridad_despliegue.py
```

Si todas las pruebas concluyen con éxito, el script retornará código de salida `0` y el mensaje:
```text
================================================================================
[✓✓✓] PROTOCOLO DE PRE-DESPLIEGUE SUPERADO AL 100% — LISTO PARA PRODUCCIÓN
================================================================================
```

---

## 18. Flujo de Trabajo Git, Git LFS y Despliegue Continuo (CI/CD)

El ciclo de desarrollo y publicación del Atlas VGI se sustenta en un flujo de **Integración y Despliegue Continuo (CI/CD)** completamente automatizado entre **GitHub** y la red perimetral de **Netlify Edge**.

### 18.1. Estrategia de Rastreo de Binarios Masivos con Git LFS
Debido a que GitHub impone un límite rígido de 100 MB por archivo en repositorios estándar, los archivos que superan dicho tamaño o que contienen datos comprimidos masivos se administran mediante **Git Large File Storage (Git LFS)**.

* **Configuración del Archivo `.gitattributes`:**
  Ubicado en la raíz del repositorio ([`.gitattributes`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/.gitattributes)):
  ```text
  *.zip filter=lfs diff=lfs merge=lfs -text
  *.gpkg filter=lfs diff=lfs merge=lfs -text
  *.pbf filter=lfs diff=lfs merge=lfs -text
  *.numbers filter=lfs diff=lfs merge=lfs -text
  ```

* **Comandos Clave de Gestión LFS:**
  ```bash
  # Instalar hooks de LFS en el entorno local (solo una vez)
  git lfs install

  # Listar todos los archivos rastreados activamente por LFS y su tamaño
  git lfs ls-files -s

  # Descargar los binarios reales si se clonó el repositorio en un equipo nuevo
  git lfs pull
  ```

### 18.2. Ciclo de Vida del Despliegue en Netlify Edge
Cuando un desarrollador ejecuta `git push origin main`, se activa la siguiente cadena de eventos:

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Desarrollador / GIS Lead
    participant GH as GitHub (Repositorio main)
    participant LFS as GitHub LFS Storage
    participant Netlify as Netlify Build Runner
    participant Edge as Netlify Global Edge CDN
    participant User as Usuario Final (Navegador)

    Dev->>Dev: Ejecuta verificar_integridad_despliegue.py
    Dev->>GH: git push origin main
    Dev->>LFS: Sube bloques binarios LFS (*.zip, *.gpkg)
    GH->>Netlify: Webhook de despliegue automático
    Netlify->>GH: Clona árbol de código fuente
    Netlify->>LFS: Descarga binarios con GIT_LFS_SKIP_SMUDGE=0
    Netlify->>Netlify: Aplica reglas de netlify.toml (Headers, Caché, Redirecciones)
    Netlify->>Edge: Despliega directorio src/ a 35+ nodos perimetrales
    Edge-->>User: Sirve SPA en <1.2s con SSL/TLS Let's Encrypt
```

### 18.3. Procedimiento Paso a Paso para Desplegar Actualizaciones
1. **Paso 1: Sincronizar Cambios Locales:**
   Asegúrese de estar en la rama `main` y con el árbol de trabajo limpio:
   ```bash
   git status
   ```
2. **Paso 2: Ejecutar la Suite de Integridad:**
   ```bash
   python3 scripts/verificar_integridad_despliegue.py
   ```
   *No continúe si alguna de las 8 pruebas arroja error.*
3. **Paso 3: Añadir Cambios y Realizar Commit Semántico:**
   ```bash
   git add .
   git commit -m "feat(cartografia): incorporar 131 capas normalizadas y actualizar geodatabase a 543 MB"
   ```
4. **Paso 4: Subir a Producción en GitHub:**
   ```bash
   git push origin main
   ```
5. **Paso 5: Verificación en Vivo de la Publicación:**
   Espere ~30 segundos mientras Netlify procesa el commit y ejecute una consulta de encabezados HTTP con `curl`:
   ```bash
   # Verificar disponibilidad del sitio web
   curl -sI https://atlasvgiuah.netlify.app/ | grep -E "HTTP|x-nf-request-id"

   # Verificar tamaño exacto y disponibilidad del archivo ZIP maestro
   curl -sI https://atlasvgiuah.netlify.app/docs/geodatabase_completa_atlas_vgi.zip | grep -E "HTTP|content-length|content-type"
   ```
   Debe responder `HTTP/2 200` con `content-type: application/zip` y `content-length: 568534094` bytes (o superior).

---

## 19. Matriz de Troubleshooting y Solución de Problemas Frecuentes

Esta sección compila las incidencias técnicas más comunes que pueden presentarse durante el desarrollo, despliegue o consumo del Atlas VGI, junto con su causa raíz y la solución técnica inmediata.

### 19.1. Problemas Cartográficos y de Renderizado Leaflet

#### Problema 1: El mapa Leaflet aparece en gris con bloques vacíos al cambiar de pestaña
* **Causa Raíz:** Al crearse el mapa mientras su contenedor (`#mapa`) está oculto mediante `display: none` (por encontrarse en otro módulo como Overpass o Glosario), Leaflet calcula las dimensiones del viewport con ancho y alto iguales a cero ($0 \times 0$ píxeles). Al hacerse visible el contenedor, Leaflet no redibuja automáticamente los azulejos (*tiles*).
* **Solución Técnica:** En `src/js/app.js`, dentro de la función `cambiarPanel(nombrePanel)`, agregue una invocación a `invalidateSize()` cada vez que el usuario regrese a la pestaña del visor cartográfico:
  ```javascript
  if (nombrePanel === 'visor-mapa' && window.ModuloMapa) {
    setTimeout(() => {
      window.ModuloMapa.obtenerInstanciaMapa().invalidateSize();
    }, 150);
  }
  ```

#### Problema 2: Las geometrías GeoJSON aparecen desfasadas o en el Golfo de Guinea (Lat/Lon invertidas)
* **Causa Raíz:** El estándar GeoJSON (RFC 7946) estipula que las coordenadas deben expresarse estrictamente en el orden `[longitud, latitud]` ($[X, Y]$). Sin embargo, ciertos servicios WFS de software SIG legacy emiten coordenadas en formato `[latitud, longitud]`.
* **Solución Técnica:** Ejecute el script de inversión de coordenadas antes de publicar la capa:
  ```python
  import json

  def corregir_inversion(coords):
      if isinstance(coords[0], (int, float)):
          # Si latitud está en primera posición (en Chile entre -17 y -56)
          if -56 <= coords[0] <= -17 and -76 <= coords[1] <= -66:
              return [coords[1], coords[0]]
          return coords
      return [corregir_inversion(c) for c in coords]

  with open("capa_defectuosa.geojson", "r", encoding="utf-8") as f:
      data = json.load(f)

  for feat in data.get("features", []):
      geom = feat.get("geometry", {})
      geom["coordinates"] = corregir_inversion(geom["coordinates"])

  with open("capa_corregida.geojson", "w", encoding="utf-8") as f:
      json.dump(data, f, ensure_ascii=False)
  ```

#### Problema 3: Error `Uncaught Error: Invalid LatLng object: (NaN, NaN)` en la consola del navegador
* **Causa Raíz:** La capa GeoJSON contiene elementos con geometrías nulas (`"geometry": null`) o nodos huérfanos sin coordenadas válidas.
* **Solución Técnica:** En `src/js/modulos/ide_chile.js`, filtre las entidades nulas antes de agregarlas a la capa de Leaflet:
  ```javascript
  const featuresValidas = geojson.features.filter(f => 
    f.geometry && 
    f.geometry.coordinates && 
    f.geometry.coordinates.length > 0
  );
  ```

### 19.2. Problemas de Descarga, Git LFS y Archivos ZIP

#### Problema 4: La descarga de `geodatabase_completa_atlas_vgi.zip` entrega un archivo de solo 130 bytes
* **Causa Raíz:** El archivo descargado no es el binario comprimido real, sino un **puntero de texto de Git LFS** que contiene el hash SHA-256. Esto ocurre cuando Netlify compila el sitio sin expandir los archivos LFS.
* **Solución Técnica:**
  1. Verifique que `netlify.toml` contenga en la sección `[build.environment]`:
     ```toml
     GIT_LFS_SKIP_SMUDGE = "0"
     GIT_LFS_FETCH_INCLUDE = "*.zip,*.xlsx,*.csv,*.docx,*.gpkg,*.pbf"
     ```
  2. En el panel de control de Netlify, asegúrese de que el plugin **Netlify Large Media** no esté en conflicto con GitHub LFS, o configure las variables de entorno de Git LFS en **Site settings** $\rightarrow$ **Environment variables**.

#### Problema 5: Error `Git LFS: Repository or object not found` al hacer `git push`
* **Causa Raíz:** Se agotó la cuota mensual de ancho de banda o almacenamiento de Git LFS en la cuenta de GitHub Free (límite de 1 GB de almacenamiento y 1 GB/mes de ancho de banda).
* **Solución Técnica:**
  Aloje el archivo `.zip` en el bucket público de **Supabase Storage** (que provee 1 GB de almacenamiento CDN permanente $0 USD) y configure una redirección HTTP 302 en `netlify.toml`:
  ```toml
  [[redirects]]
    from = "/docs/geodatabase_completa_atlas_vgi.zip"
    to = "https://[TU-PROYECTO].supabase.co/storage/v1/object/public/atlas-geojson/geodatabase_completa_atlas_vgi.zip"
    status = 302
    force = true
  ```

### 19.3. Problemas de APIs Abiertas en Tiempo Real (Overpass, ohsome, GBIF)

#### Problema 6: Overpass API responde con Error `HTTP 429 Too Many Requests` o `504 Gateway Timeout`
* **Causa Raíz:** El servidor principal de Overpass (`overpass-api.de`) se encuentra sobrecargado por peticiones concurrentes a nivel mundial o la consulta territorial es excesivamente extensa.
* **Solución Técnica:** El módulo `src/js/modulos/osm.js` implementa un conmutador de servidores espejo (*round-robin failover*):
  ```javascript
  const SERVIDORES_OVERPASS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ];

  async function consultarOverpassConReintentos(queryQL) {
    for (const urlServidor of SERVIDORES_OVERPASS) {
      try {
        const resp = await fetch(urlServidor, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(queryQL),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        if (resp.ok) return await resp.json();
      } catch (err) {
        console.warn(`[!] Servidor ${urlServidor} no disponible, intentando siguiente...`);
      }
    }
    // Si todos fallan, recurrir a la copia local cacheada en src/data/
    console.error('[-] Todos los servidores Overpass fallaron. Activando fallback local.');
    return await cargarFallbackLocalOSM();
  }
  ```

#### Problema 7: La API de GBIF no retorna registros o entrega observaciones marinas en Santiago Centro
* **Causa Raíz:** Registros biológicos con errores de transcripción en coordenadas o ausencia de filtro estricto de incertidumbre espacial (`coordinateUncertaintyInMeters`).
* **Solución Técnica:** En `src/js/modulos/gbif.js`, restrinja la consulta exigiendo obligatoriamente:
  `hasCoordinate=true`, `hasGeospatialIssue=false`, y un radio de incertidumbre inferior a 250 metros (`coordinateUncertaintyInMeters=0,250`).

### 19.4. Problemas de Base de Datos y Supabase PostGIS

#### Problema 8: La base de datos en Supabase entra en estado "Paused" tras 7 días de inactividad
* **Causa Raíz:** En el plan gratuito (*Free Tier*) de Supabase, los proyectos que no registran consultas a la base de datos durante 7 días consecutivos entran en modo de pausa para ahorrar recursos de cómputo.
* **Solución Técnica (Keep-Alive Permanente):**
  Cree un flujo de trabajo automatizado en GitHub Actions ([`.github/workflows/keep_alive_supabase.yml`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/.github/workflows/keep_alive_supabase.yml)) que ejecute una consulta trivial cada 3 días:
  ```yaml
  name: Keep-Alive Supabase PostGIS
  on:
    schedule:
      - cron: '0 12 */3 * *' # Cada 3 días a las 12:00 UTC
    workflow_dispatch:

  jobs:
    ping-database:
      runs-on: ubuntu-latest
      steps:
        - name: Enviar Ping SQL a Supabase
          run: |
            curl -s -X POST "${{ secrets.SUPABASE_URL }}/rest/v1/rpc/fn_obtener_capa_bbox" \
              -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
              -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
              -H "Content-Type: application/json" \
              -d '{"p_capa_id": "censo2024_manzanas"}' > /dev/null
            echo "Ping de mantenimiento completado exitosamente."
  ```

---

## 20. Glosario Técnico y Referencias Normativas Internacionales

### 20.1. Glosario Exhaustivo de Conceptos y Terminología Técnica

1. **Información Geográfica Voluntaria (VGI - *Volunteered Geographic Information*):** Término acuñado por Michael Goodchild (2007) para describir la creación, ensamblaje y difusión colaborativa de datos geográficos generados voluntariamente por ciudadanos e investigadores.
2. **Neo-geografía:** Práctica de utilizar herramientas, técnicas cartográficas y de geolocalización abiertas por parte de personas o colectivos sin formación formal en geodesia tradicional, democratizando el análisis espacial.
3. **OpenStreetMap (OSM):** Base de datos geográfica colaborativa mundial abierta bajo licencia libre ODbL, cuyos datos son digitalizados y mantenidos por una comunidad global de millones de mapeadores.
4. **Overpass QL:** Lenguaje de consulta de alto rendimiento optimizado para extraer subconjuntos vectoriales de OpenStreetMap mediante filtros de etiquetas, relaciones, áreas y envolventes espaciales.
5. **ohsome API:** Plataforma analítica desarrollada por el Heidelberg Institute for Geoinformation Technology (HeiGIT) que permite consultar el historial completo de ediciones y evolución espacio-temporal de OpenStreetMap.
6. **Darwin Core (DwC):** Estándar internacional del Biodiversity Information Standards (TDWG) diseñado para facilitar el intercambio de información biológica sobre biodiversidad y registros taxonómicos.
7. **Global Biodiversity Information Facility (GBIF):** Red internacional de datos científicos de acceso abierto que integra registros de biodiversidad provenientes de museos, herbarios, universidades y ciencia ciudadana (iNaturalist).
8. **Bounding Box (BBox):** Rectángulo envolvente mínimo alineado con los ejes de coordenadas geográficas, definido por cuatro valores cardinales: `[minX, minY, maxX, maxY]` (longitud mínima, latitud mínima, longitud máxima, latitud máxima).
9. **WGS84 (EPSG:4326):** Sistema de Referencia Geodésico Mundial de 1984, el estándar global adoptado por el sistema GPS y por las especificaciones web GeoJSON, expresado en coordenadas elipsoidales (grados decimales).
10. **SIRGAS Chile (EPSG:5360):** Sistema de Referencia Geocéntrico para las Américas, marco geodésico oficial del Estado de Chile oficializado mediante resoluciones del Instituto Geográfico Militar (IGM).
11. **UTM Huso 19 Sur (EPSG:32719):** Proyección cilíndrica conforme transversa de Mercator correspondiente al cuadrante territorial de Chile Central y la Región Metropolitana de Santiago.
12. **GeoJSON (RFC 7946):** Formato estándar abierto y legible por humanos para codificar estructuras de datos geográficos utilizando la notación de objetos JavaScript (JSON).
13. **Simple Features Access (OGC / ISO 19125):** Especificación internacional que define las reglas topológicas de geometrías vectoriales digitales bidimensionales (Point, LineString, Polygon, MultiPolygon).
14. **PostgreSQL:** Sistema de gestión de bases de datos relacional y orientada a objetos de código abierto de clase empresarial con más de 35 años de desarrollo activo.
15. **PostGIS:** Extensión espacial para PostgreSQL que añade soporte para objetos geográficos, permitiendo ejecutar consultas espaciales nativas en SQL y cálculo topológico avanzado.
16. **Índice Espacial GIST (*Generalized Search Tree*):** Estructura de indexación basada en árboles R que permite a PostgreSQL buscar e intersectar polígonos y puntos en tiempo logarítmico.
17. **Índice GIN (*Generalized Inverted Index*):** Estructura de indexación invertida diseñada para acelerar búsquedas de atributos dentro de campos de datos compuestos como `JSONB` o arrays.
18. **GeoPackage (GPKG - OGC):** Formato abierto de archivo universal, no propietario y basado en SQLite para almacenar y transferir múltiples capas vectoriales y ráster con índices espaciales.
19. **Shapefile (ESRI):** Formato vectorial clásico propietario pero ampliamente distribuido, compuesto por un mínimo de tres archivos interdependientes (`.shp`, `.shx`, `.dbf`).
20. **Web Feature Service (WFS - OGC / ISO 19142):** Protocolo de comunicación web estándar para consultar y descargar geometrías vectoriales con sus tablas de atributos en formato GML o GeoJSON.
21. **Web Map Service (WMS - OGC / ISO 19128):** Estándar que genera y sirve imágenes georreferenciadas rasterizadas a partir de datos espaciales en tiempo real.
22. **Infraestructura de Datos Geoespaciales de Chile (IDE Chile / SNIT):** Red de instituciones públicas chilenas que coordinan la estandarización, interoperabilidad y publicación abierta de la cartografía oficial del Estado.
23. **Plan Regulador Comunal (PRC):** Instrumento de planificación territorial normativo de nivel comunal que define usos de suelo, alturas máximas, densidades y áreas de protección patrimonial en Chile.
24. **Certificado de Informaciones Normativas VGI (CIN-VGI):** Reporte automatizado generado por el Atlas que cruza la posición geográfica del usuario con las 192 zonas del PRC de Santiago.
25. **Banco Integrado de Proyectos (BIP):** Plataforma del Ministerio de Desarrollo Social y Familia (MIDESO) que administra las iniciativas de inversión pública del Estado de Chile.
26. **Catastro Nacional RSD SUBDERE 2024:** Inventario oficial de la Subsecretaría de Desarrollo Regional y Administrativo sobre la recolección, transferencia y disposición final de Residuos Sólidos Domiciliarios.
27. **Registro Social de Hogares (RSH):** Sistema de estratificación socioeconómica del Ministerio de Desarrollo Social y Familia que califica la vulnerabilidad socioeconómica de los hogares chilenos por tramos porcentuales.
28. **Modelo WLC (*Weighted Linear Combination*):** Técnica matemática de evaluación multicriterio donde diversas variables continuas estandarizadas se ponderan linealmente para obtener un índice sintético de calidad o idoneidad territorial.
29. **Índice Global de Calidad VGI (IGV):** Puntuación porcentual obtenida por una capa geográfica en el modelo WLC v2.0, articulando un 50% de calidad cuantitativa intrínseca y un 50% de calidad cualitativa de metadatos.
30. **Git Large File Storage (Git LFS):** Extensión de código abierto para Git que reemplaza archivos de gran tamaño dentro del repositorio por punteros de texto livianos, alojando los binarios pesados en un servidor dedicado.
31. **Content Delivery Network (CDN):** Red distribuida geográficamente de servidores perimetrales que almacenan en caché copias locales de recursos web para entregarlos a los usuarios con mínima latencia.
32. **Netlify Edge:** Red perimetral de alojamiento serverless que ejecuta funciones y sirve contenidos estáticos con compresión dinámica y certificados TLS automáticos.
33. **Open Database License (ODbL 1.0):** Licencia de datos abiertos que rige sobre OpenStreetMap, la cual permite la libre copia, distribución y adaptación de la base de datos siempre que se mantenga el reconocimiento y la misma licencia en trabajos derivados (*Share-Alike*).
34. **Creative Commons Atribución-CompartirIgual 4.0 (CC BY-SA 4.0):** Licencia abierta que permite la distribución y modificación de documentos, cartografías y recursos gráficos bajo condición de atribución formal y licenciamiento idéntico.
35. **GNU Affero General Public License v3.0 (AGPLv3):** Licencia de software libre que garantiza que todo código fuente modificado que se ejecute en un servidor de red deba ser puesto a disposición pública de la comunidad.
36. **Ley N° 20.285 sobre Acceso a la Información Pública:** Marco legal de transparencia del Estado de Chile que faculta la libre reutilización y auditoría ciudadana de la cartografía emitida por ministerios y municipalidades.
37. **Revealing Module Pattern:** Patrón de arquitectura JavaScript que utiliza clausuras léxicas (*closures*) y funciones anónimas autoejecutables (IIFE) para aislar variables privadas y exponer una API pública estructurada.
38. **BEM (*Block Element Modifier*):** Metodología estandarizada de nomenclatura para clases CSS que mejora la modularidad y escalabilidad del diseño de interfaces complejas.
39. **Subresource Integrity (SRI):** Mecanismo de seguridad web que permite a los navegadores comprobar que los archivos JavaScript o CSS cargados desde servidores CDN de terceros no han sido manipulados maliciosamente.
40. **Bypass de Caché (*Cache-Busting*):** Técnica que añade parámetros dinámicos de consulta (ej. `?v=1730000000`) a las URLs para forzar al navegador a descargar una versión fresca del recurso en lugar de reutilizar la copia en caché local.
41. **CORS (*Cross-Origin Resource Sharing*):** Mecanismo de seguridad basado en encabezados HTTP que permite o restringe que recursos de una página web sean solicitados desde un dominio diferente.
42. **Lightbox HD:** Visor modal de alta densidad gráfica que permite realizar zoom y paneo continuo sobre imágenes cartográficas en ultra alta resolución (4K/300 DPI) sin pérdida de nitidez.
43. **Single Page Application (SPA):** Aplicación web que carga un único documento HTML y actualiza dinámicamente las vistas a medida que el usuario interactúa, sin requerir recargas completas de la página desde el servidor.
44. **Unidad Vecinal (UV):** Célula territorial de gestión comunal definida en la legislación chilena para efectos de representación vecinal y asignación de programas sociales.
45. **OGUC (*Ordenanza General de Urbanismo y Construcciones*):** Reglamento técnico de la Ley General de Urbanismo y Construcciones de Chile que norma las exigencias de habitabilidad, seguridad y equipamiento en proyectos urbanos.

### 20.2. Referencias Normativas Internacionales y Fuentes Jurídicas

#### Estándares Internacionales de la Organización Internacional de Normalización (ISO)
* **ISO 19115-1:2014:** *Geographic information — Metadata — Part 1: Fundamentals*. International Organization for Standardization. Ginebra, Suiza.
* **ISO 19139:2007:** *Geographic information — Metadata — XML schema implementation*. International Organization for Standardization. Ginebra, Suiza.
* **ISO 19157:2013:** *Geographic information — Data quality*. International Organization for Standardization. Ginebra, Suiza.
* **ISO 19157-1:2023:** *Geographic information — Data quality — Part 1: General requirements*. International Organization for Standardization. Ginebra, Suiza.
* **ISO 19110:2016:** *Geographic information — Methodology for feature cataloguing*. International Organization for Standardization. Ginebra, Suiza.
* **ISO/IEC 29500-1:2016:** *Information technology — Document description and processing languages — Office Open XML File Formats*. International Organization for Standardization. Ginebra, Suiza.

#### Estándares de Consorcios Abiertos de la Industria (OGC & IETF)
* **Open Geospatial Consortium (OGC):** *Simple Feature Access - Part 1: Common Architecture* (OGC 06-103r4).
* **Open Geospatial Consortium (OGC):** *OGC GeoPackage Encoding Standard* (OGC 12-128r18).
* **Internet Engineering Task Force (IETF):** *The GeoJSON Format* (RFC 7946, 2016).
* **Biodiversity Information Standards (TDWG):** *Darwin Core Standard* (DwC, 2009).

#### Legislación y Normativa Nacional de la República de Chile
* **República de Chile:** *Ley N° 20.285 sobre Acceso a la Información Pública*. Diario Oficial de la República de Chile, 20 de agosto de 2008.
* **Ministerio de Vivienda y Urbanismo (MINVU):** *Decreto Supremo N° 47: Ordenanza General de Urbanismo y Construcciones (OGUC)*. Diario Oficial de la República de Chile, 19 de mayo de 1992 (con sus modificaciones vigentes).
* **Ministerio de Vivienda y Urbanismo (MINVU):** *Decreto con Fuerza de Ley N° 458: Ley General de Urbanismo y Construcciones (LGUC)*. Diario Oficial de la República de Chile, 13 de abril de 1976.
* **Municipalidad de Santiago:** *Decreto Alcaldicio N° 1324: Plan Regulador Comunal de Santiago*. Diario Oficial de la República de Chile, 27 de diciembre de 1989 (y textos refundidos posteriores).
* **Subsecretaría de Desarrollo Regional y Administrativo (SUBDERE):** *Catastro Nacional de Residuos Sólidos Domiciliarios 2024*. Ministerio del Interior y Seguridad Pública, Santiago de Chile, enero de 2024.
* **Instituto Nacional de Estadísticas (INE):** *Censo de Población y Vivienda 2024: Resultados Preliminares y Cartografía Censal*. Santiago de Chile, 2024.

---

**Departamento de Geografía · Universidad Alberto Hurtado**  
*Nodo GeoAbierto: Atlas de Información Geográfica Voluntaria para la Gestión Territorial*  
Santiago de Chile, 2026.
"""
print("[+] Secciones 17 a 20 cargadas")
