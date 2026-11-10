# Protocolo de integridad de datos, verificación pre-despliegue y publicación — Atlas para la Gestión Territorial
## Análisis y Exploración | Municipio de Santiago y Barrio Brasil

* **Entorno de Producción Primaria (Netlify CDN):** [https://atlasvgiuah.netlify.app](https://atlasvgiuah.netlify.app)
* **Entorno de Respaldo (GitHub Pages):** [https://geojota.github.io/atlas-vgi-barrio-brasil/](https://geojota.github.io/atlas-vgi-barrio-brasil/)
* **Parámetros Auditados:** **294 capas cartográficas** (`123` oficiales del Estado con `id_ig` + `171` descentralizadas de IGV con `id_igv`) · **5 dimensiones analíticas** · **4 guiones visuales (83 cartografías)** · **17 atributos homologados ISO 19157** · Paridad simétrica `data/` ↔ `src/data/` y `docs/` ↔ `src/docs/`.

---

## 1. Propósito del protocolo de integridad y despliegue

Este documento define las reglas de validación técnica, los scripts de verificación local en Python 3, la sincronización de directorios espejo, el control de caché (*Cache-Busting*) y el flujo de despliegue hacia producción del **Atlas para la Gestión Territorial**.

Su cumplimiento garantiza que ninguna actualización de código o de cartografía genere enlaces rotos (`HTTP 404`), archivos truncados por punteros de *Git LFS*, discrepancias en el conteo de las **294 coberturas operativas** ni tiempos excesivos de compilación (*timeout*) en Netlify.

---

## 2. Flujo de trabajo de auditoría local pre-despliegue y publicación continua (CI/CD)

```mermaid
flowchart LR
    subgraph IN["1. CAMBIOS EN REPOSITORIO LOCAL"]
        E1["Actualización de Capas GeoJSON / CSV\nen data/ y src/data/ (EPSG:4326, UTF-8)"]
        E2["Modificación de los 3 Módulos (01, 02, 03)\nsrc/index.html, src/css/estilos.css,\nsrc/js/modulos/*.js y docs/*.md"]
    end

    subgraph PROC["2. AUDITORÍA LOCAL EN PRE-COMMIT (Python 3)"]
        V1["Etapa 1 · Conteo de las 294 Capas\npython3 scripts/verificar_conteo_capas.py\n(123 Oficiales id_ig + 171 IGV id_igv)"]
        V2["Etapa 2 · Integridad Topológica y Espejo\npython3 scripts/verificar_integridad_despliegue.py\n(0 Punteros LFS | RFC 7946 | data/ == src/data/)"]
        V3["Etapa 3 · Perfil ISO 19157 y Cache-Busting\nVerificación de los 17 atributos en Detalles\ny actualización de ?v=... en src/index.html"]
    end

    subgraph OUT["3. DESPLIEGUE INSTANTÁNEO A PRODUCCIÓN"]
        D1["Push a Rama Principal (git push origin main)\nPublicación estática directa en Netlify (publish = 'src')\nhttps://atlasvgiuah.netlify.app"]
        D2["Espejo en GitHub Pages + Cron Keep-Alive\n.github/workflows/supabase_keepalive.yml\n(Ping PostGIS cada 72 horas)"]
        D3["Entregables Verificados en Producción\ndocs/geodatabase_completa_atlas_vgi.zip (542,35 MB)\n3 Libros .xlsx en Módulo 03 (DOC · 04)"]
    end

    E1 & E2 --> V1 --> V2 --> V3
    V3 --> D1 & D2 --> D3
```

---

## 3. Reglas de integridad del repositorio

### 3.1. Sincronización simétrica obligatoria (`data/` ↔ `src/data/` y `docs/` ↔ `src/docs/`)

Dado que `netlify.toml` establece `publish = "src"` como raíz del servidor HTTP mientras que los scripts de procesamiento en `scripts/` operan sobre `data/` y `docs/` en la raíz del repositorio, todo archivo de datos o documentación debe residir de forma idéntica en ambos pares de directorios:

```mermaid
flowchart TD
    subgraph RAIZ["Directorios Maestros en Raíz de Git"]
        R_DATA["data/*.geojson, *.csv\n(294 coberturas cartográficas)"]
        R_DOCS["docs/*.md, *.xlsx, *.zip"]
        R_MD["README.md, MANUAL_USO.md,\nMANUAL_ACTUALIZACION_ATLAS.md,\nPROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md"]
    end

    subgraph SYNC["Verificación Local de Paridad"]
        S_SCRIPT["scripts/verificar_integridad_despliegue.py\n& scripts/verificar_conteo_capas.py"]
    end

    subgraph WEB["Directorio de Publicación Web (src/)"]
        W_DATA["src/data/*.geojson, *.csv\n(Servidos vía Fetch API al Módulo 02)"]
        W_DOCS["src/docs/*.md, *.xlsx, *.zip\n(Descargables desde el Módulo 03)"]
    end

    R_DATA & R_DOCS & R_MD --> S_SCRIPT --> W_DATA & W_DOCS
```

### 3.2. Prohibición de punteros Git LFS en archivos `.geojson` y `.xlsx`
Ningún archivo `.geojson`, `.csv`, `.json` o `.xlsx` servido por la aplicación web puede almacenarse como puntero de texto `version https://git-lfs.github.com/spec/v1`, ya que las llamadas `fetch()` del navegador recibirían el puntero de 130 bytes en lugar de la estructura JSON o binaria real. El script `scripts/verificar_integridad_despliegue.py` inspecciona la cabecera de todos los archivos y alerta si detecta cualquier firma LFS.

### 3.3. Norma geodésica de almacenamiento (`EPSG:4326` / RFC 7946)
Todos los archivos `.geojson` en `data/` y `src/data/` deben estar proyectados en coordenadas geográficas `EPSG:4326` (WGS84 / SIRGAS-Chile) con longitud en el rango `[-71,8°, -69,5°]` y latitud en el rango `[-34,5°, -32,8°]`.

### 3.4. Desacoplamiento de scripts pesados respecto del build de Netlify
Las auditorías de las 294 capas (`verificar_integridad_despliegue.py` y `verificar_conteo_capas.py`) deben ejecutarse **localmente** antes del commit y nunca dentro del comando `[build] command` de `netlify.toml`, garantizando que el despliegue en Netlify finalice en pocos segundos sin superar el límite de tiempo de ejecución.

---

## 4. Bancos de pruebas pre-despliegue

| Banco | Script / Verificación | Condición de Aprobación (`PASS`) | Archivos Auditados |
| :---: | :--- | :--- | :--- |
| **Banco 1** | `python3 scripts/verificar_conteo_capas.py` | Conteo exacto de **294 capas cartográficas** (`123` oficiales del Estado con `id_ig` + `171` descentralizadas de IGV con `id_igv`). | `src/js/modulos/ide_chile.js`, `src/js/modulos/indicadores_analisis.js`, `src/index.html` |
| **Banco 2** | `python3 scripts/verificar_integridad_despliegue.py` | Existencia física, validez sintáctica JSON (`FeatureCollection`), coordenadas en rango WGS84 (`EPSG:4326`), presencia de los 17 atributos ISO 19157 y 0 punteros Git LFS en las 294 capas. | `data/*.geojson`, `src/data/*.geojson` |
| **Banco 3** | Paridad de directorios espejo | Paridad simétrica entre `data/` y `src/data/`, y presencia de los manuales, los 3 libros `.xlsx` y el paquete `.zip` en `docs/` y `src/docs/`. | `data/` ↔ `src/data/`, `docs/` ↔ `src/docs/` |
| **Banco 4** | Verificación del Módulo 01 (`Análisis`) | Presencia de las 5 dimensiones analíticas y los 4 guiones visuales con las 83 cartografías en `src/img/cartografias/`. | `src/js/modulos/indicadores_analisis.js`, `src/img/cartografias/` |
| **Banco 5** | Verificación del Módulo 02 (`Explorar mapa`) | Funcionamiento de los 5 mapas base sin clave API (`OpenStreetMap Estándar`, `OpenStreetMap HOT`, `Bing/Microsoft Satelital`, `Bing/Microsoft Híbrido` y `Esri World Imagery`), simbología dinámica Jenks, Inspector normativo (PRC) y panel inferior de **Detalles**. | `src/js/modulos/mapa.js`, `src/js/modulos/evaluador_normativo.js` |
| **Banco 6** | Verificación del Módulo 03 (`Documentación`) y Cabecera | Navegación operativa de los 6 capítulos (`DOC · 01` a `DOC · 06`), Tutorial interactivo de 18 pasos en 4 bloques (a la izquierda del título) y Glosario de siglas (a la derecha del título). | `src/js/modulos/manual.js`, `src/js/modulos/tutorial_interactivo.js`, `src/js/app.js`, `src/index.html` |
| **Banco 7** | Control de Caché (`Cache-Busting`) | Parámetro `?v=YYYYMMDD_vNN` uniforme y actualizado en las etiquetas `<link>` y `<script>` de `src/index.html` y en `src/js/config.js`. | `src/index.html`, `src/js/config.js` |
