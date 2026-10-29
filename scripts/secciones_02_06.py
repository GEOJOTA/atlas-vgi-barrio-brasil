# -*- coding: utf-8 -*-

SECCION_02 = """## 2. Inventario y Topografía Integral del Repositorio

Para operar, mantener o modificar el Atlas VGI es imprescindible comprender la topografía de directorios y la función exacta de cada artefacto. El repositorio organiza el código fuente, la cartografía activa, la documentación formal y los scripts de orquestación bajo una jerarquía limpia y modular:

```text
nodo-geoabierto/
├── .git/                                   # Metadatos del repositorio Git y base de objetos locales
├── .gitattributes                          # Configuración de rastreo LFS para archivos binarios masivos (*.zip, *.gpkg, *.pbf)
├── .github/                                # Configuraciones específicas de GitHub (workflows y plantillas)
├── .gitignore                              # Patrones de exclusión para artefactos temporales (.DS_Store, *.pyc, node_modules)
├── CONTRIBUTING.md                         # Guía de contribución para desarrolladores externos
├── INFORME_PROYECTO_ATLAS_VGI.md           # Memoria descriptiva y estado de avance del proyecto Atlas VGI
├── LICENSE                                 # Licencia tripartita (ODbL 1.0, CC BY-SA 4.0, GNU AGPLv3)
├── MANUAL_ACTUALIZACION_ATLAS.md           # Este manual maestro de actualización técnica y operativa (raíz)
├── MANUAL_USO.md                           # Manual de usuario final para navegación en la interfaz web (raíz)
├── Metricas_Calidad_ISO_Capas_Oficiales_Actualizado.numbers # Hoja de cálculo Apple Numbers con auditorías de calidad iniciales
├── PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md     # Protocolo de pre-despliegue y verificación de integridad
├── README.md                               # Documento de presentación general del repositorio en GitHub
├── TODO_SIGUIENTE.md                       # Bitácora histórica de tareas y backlog de desarrollo
├── backend/                                # Definiciones de backend, esquemas SQL y funciones serverless
│   ├── db/
│   │   ├── schema.sql                      # Esquema relacional y espacial DDL para PostgreSQL 17 + PostGIS 3.3
│   │   └── funciones_rpc.sql               # Funciones RPC de consulta espacial para Supabase
│   └── functions/                          # Esqueletos de endpoints de persistencia
├── config/                                 # Configuraciones globales desacopladas
│   └── config.json                         # Configuración JSON editable del Atlas (BBox inicial, APIs, metadatos predeterminados)
├── data/                                   # Almacén de trabajo para datos espaciales crudos y procesados
│   ├── subdere_rsd_2024_rm/                # Directorio de 12 capas del Catastro Nacional RSD SUBDERE 2024
│   │   ├── Analisis_Costos_Comuna_RM.geojson
│   │   ├── Ciudades_Pb_Pol_RM.geojson
│   │   ├── Criticidad_Sitios_Disposicion_RSD_Ene24_RM.geojson
│   │   ├── Distancia_Municipio_SDF_RM.geojson
│   │   ├── Gastos_Ingresos_SINIM_RM.geojson
│   │   ├── INVENTARIO_SUBDERE_RSD_2024_RM.json
│   │   ├── Poblacion_Comunal_Atendida_PTA_p_RM.geojson
│   │   ├── Poblacion_Comunal_PTA_RM.geojson
│   │   ├── RSD_PPC_PTA_RM.geojson
│   │   ├── Recoleccion_Transporte_RM.geojson
│   │   ├── SDF_Comunas_RM.geojson
│   │   ├── SDF_Municipios_RM.geojson
│   │   ├── Sitios_Disposicion_RSD_Ene24_RM.geojson
│   │   └── Sitios_Intermedios_Disposicion_RSD_Ene24_RM.geojson
│   ├── cache_consultas/                    # Respuestas cacheadas de Overpass y ohsome para desarrollo offline
│   └── *.geojson                           # Más de 200 archivos vectoriales GeoJSON normalizados
├── docs/                                   # Documentación técnica maestra y entregables curriculares (espejo)
│   ├── ANALISIS_METACALIDAD.md             # Informe técnico de evaluación de calidad ISO 19157 (95.41% IGV)
│   ├── ARQUITECTURA.md                     # Memoria de diseño de software y diagramas de componentes
│   ├── BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md   # Catálogo de 125 fuentes bibliográficas citadas bajo norma APA 7ª ed.
│   ├── GUIA_BASE_DATOS_SUPABASE.md         # Manual de administración de PostGIS y claves de conexión
│   ├── MANUAL_ACTUALIZACION_ATLAS.md       # Copia sincronizada del manual técnico maestro
│   ├── MANUAL_USO.md                       # Copia sincronizada del manual operativo de usuario
│   ├── PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md # Copia sincronizada del protocolo de integridad
│   ├── TRAZABILIDAD_ACADEMICA.md           # Bitácora de toma de decisiones de diseño cartográfico
│   ├── catalogo_fuentes_vgi.xlsx           # Matriz estructurada de proveedores, APIs y licencias
│   ├── categorias_tematicas_osm.xlsx       # Libro Excel con las 10 macrocategorías VGI y etiquetas OSM
│   ├── correlacion_dimensiones_calidad.csv # Matriz de correlación entre las 5 dimensiones cuantitativas y 5 cualitativas
│   ├── correlacion_dimensiones_calidad.png # Gráfico térmico (heatmap) de la correlación de calidad
│   ├── geodatabase_completa_atlas_vgi.zip  # Paquete comprimido oficial de 542.9 MB con 256 archivos
│   ├── matriz_metacalidad.json             # Resultados cuantitativos de la evaluación de las 131 capas
│   ├── perfil_metadatos_vgi.xlsx           # Libro Excel con el perfil de metadatos ISO 19115 y auditoría de calidad
│   ├── wlc_metacalidad_ranking.csv         # Ranking ordenado de capas según su puntuación WLC
│   └── wlc_metacalidad_resultado.json      # Estructura JSON de pesos y puntajes del modelo WLC
├── img/                                    # Recursos de imagen para documentación y marketing
│   └── cartografias/                       # Láminas cartográficas oficiales en alta resolución (Censo 2024, morfología)
├── netlify/                                # Funciones serverless de Netlify
│   └── functions/
│       └── oauth-token.js                  # Endpoint serverless para intercambio seguro de tokens OAuth2 de OSM
├── netlify.toml                            # Archivo maestro de configuración de compilación, headers y caché de Netlify
├── requirements.txt                        # Lista de dependencias Python para los scripts de mantenimiento
├── scripts/                                # Directorio de scripts Python para automatización, calidad y empaquetado
│   ├── analisis_metacalidad.py             # Auditor de calidad espacial ISO 19157 sobre las 131 capas
│   ├── build_all_deliverables.py           # Orquestador integral de compilación de entregables
│   ├── cargar_entidades_postgis.py         # Ingesta masiva de GeoJSON hacia tablas PostgreSQL/PostGIS
│   ├── empaquetar_base_datos_completa.py   # Generador del archivo ZIP maestro con cálculo de MD5 e inventarios
│   ├── generar_catalogos_excel.py          # Generador de libros OpenXML (.xlsx) con estilos y metadatos
│   ├── generar_doc_estado_avance.py        # Generador del informe formal de avance en formato Word (.docx)
│   ├── generar_gpkg_geofabrik.py           # Constructor de bases GeoPackage (.gpkg) a partir de Geofabrik
│   ├── generar_ppt_estado_avance_blanco.py # Generador de presentaciones ejecutivas PowerPoint (.pptx)
│   ├── generar_xls_estado_avance.py        # Constructor de la Carta Gantt y matrices curriculares en Excel (.xlsx)
│   ├── modelo_indice_lineal_wlc.py         # Motor matemático del Weighted Linear Combination para calidad espacial
│   ├── procesar_geofabrik_rm.py            # Cortador y clasificador del dump regional de OpenStreetMap
│   ├── verificar_conteo_capas.py           # Test unitario que valida la presencia de 121 capas oficiales + 10 VGI
│   └── verificar_integridad_despliegue.py  # Auditoría obligatoria previa a cada despliegue en producción
├── src/                                    # Raíz del sitio estático desplegado en producción por Netlify
│   ├── index.html                          # Punto de entrada de la Single Page Application (SPA)
│   ├── css/
│   │   └── estilos.css                     # Hoja de estilos universal (variables, reset, layout, mapa, consolas, modals)
│   ├── data/                               # Archivos GeoJSON activos servidos por el servidor web
│   │   ├── subdere_rsd_2024_rm/            # Capas SUBDERE 2024 para la aplicación web
│   │   └── *.geojson                       # 216 capas vectoriales activas para consumo directo
│   ├── docs/                               # Espejo público de documentos técnicos y paquetes descargables
│   │   └── geodatabase_completa_atlas_vgi.zip # Archivo ZIP descargable desde los botones de la interfaz
│   ├── img/                                # Logotipos, iconos e imágenes vectoriales servidas al cliente
│   │   ├── UAH-Insignia.jpg                # Isotipo institucional de la Universidad Alberto Hurtado
│   │   └── cartografias/                   # Láminas en alta definición accesibles vía Lightbox
│   └── js/                                 # Código fuente JavaScript modular de la aplicación
│       ├── app.js                          # Orquestador principal, enrutamiento, controladores de eventos y modales
│       ├── config.js                       # Parámetros en tiempo de ejecución inyectados en window.NODO_CONFIG
│       └── modulos/                        # Módulos especializados desacoplados
│           ├── db_client.js                # Cliente de conexión hacia Supabase con manejo de failover
│           ├── diccionario.js              # Controlador del Módulo 07: Diccionario territorial
│           ├── evaluador_calidad_cuantitativa.js # Controlador del Módulo 03: Auditor de calidad ISO 19157 en cliente
│           ├── evaluador_normativo.js      # Motor de consulta espacial punto-polígono del Inspector PRC
│           ├── gbif.js                     # Controlador del Módulo 04: Registros de biodiversidad
│           ├── geodesia.js                 # Rutinas de cálculo geodésico y transformaciones de coordenadas
│           ├── ide_chile.js                # Catálogo estructurado de las 121 capas oficiales del Estado
│           ├── importador_capas.js         # Módulo drag-and-drop para cargar archivos locales en el mapa
│           ├── indicadores_analisis.js     # Controlador del Módulo 09: 5 dimensiones y storyboards barriales
│           ├── licencias.js                # Controlador del Módulo 08: Marco legal y descarga de catálogos
│           ├── manifold_canvas.js          # Fondo interactivo de topografía animada y partículas en Canvas HTML5
│           ├── manual.js                   # Controlador del Módulo 10: Manual de uso y visor documental
│           ├── mapa.js                     # Controlador del Módulo 01: Inicialización y capas de Leaflet
│           ├── metadatos.js                # Controlador del Módulo 06: Generador de fichas ISO 19115/19139
│           ├── ohsome.js                   # Cliente API de ohsome para análisis de evolución histórica OSM
│           ├── osm.js                      # Controlador del Módulo 02: Consultas Overpass QL interactivas
│           ├── taginfo.js                  # Cliente API de Taginfo para estadísticas de etiquetas OSM en Chile
│           └── umap.js                     # Controlador del Módulo 05: Integración de iframes uMap
└── vercel.json                             # Configuración secundaria opcional para despliegues espejo en Vercel
```

### 2.1. Diferencia Crítica entre `data/` y `src/data/`
Una fuente recurrente de confusión al modificar datos es la coexistencia de `data/` y `src/data/`:
* **`data/` (Área de Trabajo del Analista SIG):** Es la carpeta de origen donde se descargan shapefiles, se ejecutan scripts de limpieza y se almacenan capas experimentales o versiones intermedias.
* **`src/data/` (Entorno de Producción Web):** Es la carpeta pública que el servidor web de Netlify expone en la raíz (`/data/nombre_capa.geojson`). **Los módulos JavaScript leen exclusivamente de `src/data/`.** Si un analista modifica un archivo en `data/` pero no lo copia a `src/data/`, el visor web continuará mostrando la versión antigua. El script `scripts/empaquetar_base_datos_completa.py` verifica y sincroniza ambas ubicaciones automáticamente.

---

## 3. Arquitectura del Sistema y Pila Tecnológica (Stack)

### 3.1. Visión Holística del Flujo de Datos
El Atlas VGI opera bajo una arquitectura desacoplada donde el navegador web del usuario asume el rol de cliente analítico y motor de visualización, comunicándose de manera asíncrona con servicios distribuidos:

```mermaid
flowchart TD
    subgraph Cliente["Navegador del Usuario (SPA Vanilla JS)"]
        UI["Interfaz Gráfica (HTML5 / CSS3 Tokens)"]
        APP["Orquestador Central (app.js)"]
        LeafletMap["Motor Cartográfico (Leaflet 1.9.4)"]
        ModulosJS["10 Módulos de Especialidad (IIFE Modules)"]
        UI --> APP
        APP --> LeafletMap
        APP --> ModulosJS
    end

    subgraph TripleFailover["Mecanismo de Triple Failover Espacial"]
        P1["1. Supabase PostGIS (RPC Espacial en Vivo)"]
        P2["2. Supabase Storage CDN (GeoJSON Remoto Optimizado)"]
        P3["3. Repositorio Local Estático (src/data/ GeoJSON)"]
        ModulosJS -->|Consulta Primaria| P1
        P1 -.->|Si falla o timeout| P2
        P2 -.->|Si falla o sin red| P3
    end

    subgraph InfraExterna["APIs Abiertas en Tiempo Real"]
        Overpass["Overpass API (Consultas QL en Vivo)"]
        Ohsome["ohsome API v2 (Métricas Históricas OSM)"]
        GBIF["GBIF API (Registros Darwin Core)"]
        Taginfo["Taginfo API (Frecuencia de Tags en Chile)"]
    end

    ModulosJS --> Overpass
    ModulosJS --> Ohsome
    ModulosJS --> GBIF
    ModulosJS --> Taginfo

    subgraph CDNNetlify["Infraestructura y Alojamiento ($0 USD)"]
        NetlifyEdge["Netlify Edge CDN (Compresión Brotli/Gzip)"]
        LFSStorage["GitHub Git LFS (Paquete Maestro ZIP 542 MB)"]
        NetlifyEdge --- LFSStorage
    end

    Cliente <--> NetlifyEdge
```

### 3.2. Pila Tecnológica Detallada
* **Capa de Presentación:** HTML5 semántico estructurado bajo el estándar BEM (*Block Element Modifier*), sin frameworks pesados (React, Angular o Vue) para garantizar carga instantánea (<1.2 segundos para el First Contentful Paint).
* **Capa de Estilos:** CSS3 nativo puro estructurado con variables semánticas (`:root`), Grid y Flexbox. No se utilizan preprocesadores (Sass/Less) para eliminar etapas de transpilación y permitir modificaciones directas en caliente.
* **Capa Lógica del Cliente:** JavaScript moderno (ES6+), implementado mediante el patrón de diseño *Revealing Module Pattern* envuelto en IIFE (*Immediately Invoked Function Expressions*). Esto evita la contaminación del ámbito global (`window`), exponiendo únicamente APIs públicas selectas como `window.ModuloMapa`, `window.ModuloIDEChile` o `window.ModuloIndicadores`.
* **Capa Cartográfica Web:** Leaflet 1.9.4 servido vía CDN oficial con integridad criptográfica Subresource Integrity (SRI). Soporta capas teseladas WMS/WMTS, geometrías vectoriales GeoJSON, marcadores dinámicos SVG (`L.divIcon`) y popups vinculados al Inspector Normativo.
* **Capa de Persistencia Relacional y Espacial:** PostgreSQL 17 con extensión PostGIS 3.3 alojado en Supabase Cloud. Maneja tablas espaciales nativas en coordenadas geográficas WGS84 (EPSG:4326), indexadas mediante árboles R espaciales (índices GIST).
* **Capa Serverless Perimetral:** Netlify Edge Network con soporte HTTP/2, compresión dinámica Brotli y funciones serverless basadas en Node.js 18.x (`netlify/functions/`) para tareas que requieren ocultar credenciales secretas (ej. OAuth de OpenStreetMap).

---

## 4. Guía Exhaustiva de Modificación de Netlify

Netlify es el proveedor perimetral de alojamiento y CDN del Atlas VGI. Toda directiva de compilación, enrutamiento, seguridad perimetral y encabezados HTTP se gestiona mediante el archivo maestro [`netlify.toml`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/netlify.toml) ubicado en la raíz del repositorio.

### 4.1. Anatomía y Configuración de `netlify.toml`
El archivo actual se encuentra optimizado para el servicio de grandes volúmenes de datos vectoriales y archivos comprimidos vía Git LFS. A continuación se desglosa su estructura operacional:

```toml
[build]
  publish = "src"       # Define 'src/' como el directorio raíz expuesto en producción
  functions = "netlify/functions" # Directorio donde residen funciones Node.js serverless

[build.environment]
  GIT_LFS_FETCH_INCLUDE = "*.zip,*.xlsx,*.csv,*.docx" # Archivos LFS que Netlify debe descargar obligatoriamente en el build
  GIT_LFS_SKIP_SMUDGE = "0"                          # Fuerza a git-lfs a expandir los archivos reales, no punteros de 130 bytes
  NODE_VERSION = "18"                                # Fija la versión del runtime para Netlify Functions

# -----------------------------------------------------------------------------
# Cabeceras Globales de Seguridad Perimetral
# -----------------------------------------------------------------------------
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"                   # Previene ataques de Clickjacking permitiendo iframes solo del mismo origen
    X-Content-Type-Options = "nosniff"               # Obliga al navegador a respetar el Content-Type declarado
    X-XSS-Protection = "1; mode=block"               # Activa el filtro anti-XSS integrado en navegadores
    Referrer-Policy = "strict-origin-when-cross-origin"
    Access-Control-Allow-Origin = "*"                # Habilita CORS abierto para que investigadores consuman los GeoJSON directamente

# -----------------------------------------------------------------------------
# Tipos MIME y Reglas de Caché para la Geodatabase Comprimida (.zip)
# -----------------------------------------------------------------------------
[[headers]]
  for = "/docs/*.zip"
  [headers.values]
    Content-Type = "application/zip"
    Content-Disposition = "attachment; filename=\"geodatabase_completa_atlas_vgi.zip\""
    Cache-Control = "public, max-age=0, must-revalidate" # Fuerza al navegador a verificar cambios antes de servir desde caché local

# -----------------------------------------------------------------------------
# Optimización de Rendimiento para Archivos Cartográficos GeoJSON
# -----------------------------------------------------------------------------
[[headers]]
  for = "/data/*.geojson"
  [headers.values]
    Content-Type = "application/geo+json; charset=utf-8"
    Cache-Control = "public, max-age=86400, stale-while-revalidate=604800" # Cachea por 24 hrs pero permite revalidación en segundo plano

# -----------------------------------------------------------------------------
# Reglas de Enrutamiento y Redirecciones
# -----------------------------------------------------------------------------
[[redirects]]
  from = "/geodatabase"
  to = "/docs/geodatabase_completa_atlas_vgi.zip"
  status = 302
  force = true

[[redirects]]
  from = "/manual"
  to = "/#manual"
  status = 302
  force = false
```

### 4.2. Procedimiento para Modificar Parámetros de Netlify
1. **Cambiar el Directorio de Publicación:** Si en el futuro se incorpora un empaquetador (ej. Vite o Webpack) que genere una carpeta `dist/`, debe modificarse la línea `publish = "src"` por `publish = "dist"`.
2. **Agregar Nuevas Extensiones a Git LFS en Netlify:** Si se incorporan archivos `.gpkg` o `.pbf` al repositorio, deben añadirse a la variable `GIT_LFS_FETCH_INCLUDE`:
   ```toml
   GIT_LFS_FETCH_INCLUDE = "*.zip,*.xlsx,*.csv,*.docx,*.gpkg,*.pbf"
   ```
3. **Purgar la Caché del CDN de Netlify:**
   * Iniciar sesión en [app.netlify.com](https://app.netlify.com).
   * Navegar a **Sites** $\rightarrow$ **atlasvgiuah** $\rightarrow$ **Deploys**.
   * Hacer clic en el menú desplegable **Trigger deploy** y seleccionar **Clear cache and deploy site**.
   * Esto forzará una reconstrucción limpia, descartando cualquier objeto en caché en los servidores de borde.

---

## 5. Guía Exhaustiva de Estilos, Colores y Tokens Visuales

El Atlas VGI implementa un sistema de diseño institucional sobrio, legible y de alta densidad de información, diseñado para el análisis territorial prolongado sin fatiga visual. Todas las propiedades visuales están centralizadas en [`src/css/estilos.css`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/src/css/estilos.css).

### 5.1. Diccionario de Tokens de Color en `:root`
Para modificar cualquier color de la interfaz, basta con alterar la variable correspondiente en la sección superior de `src/css/estilos.css` (líneas 1 a 65):

```css
:root {
  /* ==========================================================================
     PALETA CROMÁTICA INSTITUCIONAL Y SEMÁNTICA
     ========================================================================== */
  --musgo: #0284c7;           /* Azul cian de alto contraste para acentos primarios y selecciones activas */
  --esmeralda: #10b981;       /* Verde esmeralda para validaciones positivas, botones de descarga y estado 100% OK */
  --ocre: #f59e0b;            /* Amarillo ocre para alertas, advertencias y estados en progreso */
  --carmesí: #ef4444;         /* Rojo intenso para errores críticos, topología inválida y botones de cierre */
  --purpura: #8b5cf6;         /* Púrpura para capas normativas y patrimonio histórico */
  --ambar: #d97706;           /* Ámbar para equipamiento secundario y advertencias menores */

  /* ==========================================================================
     ESCALA DE GRISES Y SUPERFICIES DE FONDO (DARK THEME PROFESIONAL)
     ========================================================================== */
  --bg-dark: #0b111e;         /* Fondo base de la aplicación (azul muy oscuro casi negro) */
  --papel: #111827;           /* Superficie de tarjetas, paneles laterales y modales (gris carbón 900) */
  --papel-elevado: #1f2937;   /* Superficie para elementos flotantes, headers y menús desplegables (gris 800) */
  --linea: #374151;           /* Bordes sutiles entre paneles y divisores estructurales (gris 700) */
  --linea-suave: #1f2937;     /* Bordes secundarios internos para grillas de datos */

  /* ==========================================================================
     TIPOGRAFÍA Y CONTRASTE DE TEXTO (WCAG AAA)
     ========================================================================== */
  --tinta: #f9fafb;           /* Texto de máxima jerarquía (blanco cálido para títulos y valores KPI) */
  --tinta-suave: #9ca3af;     /* Texto de jerarquía secundaria (gris medio para párrafos y etiquetas) */
  --tinta-tenue: #6b7280;     /* Texto de baja jerarquía (gris oscuro para pies de página y metadatos) */

  /* ==========================================================================
     FAMILIAS TIPOGRÁFICAS
     ========================================================================== */
  --fuente-texto: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --fuente-datos: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* ==========================================================================
     DIMENSIONES Y RADIOS DE BORDE
     ========================================================================== */
  --ancho-consola-gis: 380px; /* Ancho fijo de la consola cartográfica izquierda en pantallas grandes */
  --alto-header: 56px;        /* Altura fija de la barra de navegación superior */
  --radio-sm: 4px;            /* Radio de esquinas para botones pequeños e insignias */
  --radio-md: 8px;            /* Radio de esquinas para tarjetas de capas y modales */
  --radio-lg: 14px;           /* Radio de esquinas para contenedores principales */
}
```

### 5.2. Cómo Cambiar el Esquema Cromático de la Aplicación
1. **Modificar el Color de Acento Primario:** Si se requiere cambiar el azul cian por un azul marino institucional o verde bosque, reemplace `--musgo`:
   ```css
   /* Ejemplo: Cambio a azul institucional UAH */
   --musgo: #004b87;
   ```
2. **Modificar el Fondo del Visor y Paneles:** Para atenuar el contraste o convertirlo en un tema grisáceo neutro:
   ```css
   --bg-dark: #121212;
   --papel: #1e1e1e;
   --papel-elevado: #2d2d2d;
   ```
3. **Modificar la Apariencia de los Botones de Acción (`.accion`):**
   Ubique la regla `.accion` en `src/css/estilos.css` (alrededor de la línea 320) para modificar el espaciado, sombra o gradiente:
   ```css
   button.accion {
     display: inline-flex;
     align-items: center;
     justify-content: center;
     gap: 8px;
     padding: 8px 16px;
     font-family: var(--fuente-texto);
     font-size: 0.88rem;
     font-weight: 700;
     color: #0b111e;
     background: var(--esmeralda);
     border: none;
     border-radius: var(--radio-sm);
     cursor: pointer;
     transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
     box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
   }
   button.accion:hover {
     filter: brightness(1.1);
     transform: translateY(-1px);
     box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
   }
   ```

---

## 6. Guía Exhaustiva de Modificación de Punteros, Cursores y Marcadores Espaciales

El comportamiento visual del ratón y la forma en que los elementos geográficos se señalan en pantalla comunican de inmediato el modo operativo en que se encuentra el usuario.

### 6.1. Modificación de Cursores CSS en la Interfaz
En `src/css/estilos.css` se definen los punteros para cada estado y herramienta:
* **Cursor Predeterminado:** `cursor: default;` aplicado al `body` y contenedores pasivos.
* **Cursor Interactivo de Puntero (Mano):** `cursor: pointer;` asignado a botones, enlaces, tarjetas de capas (`.tarjeta-capa-gis`), interruptores y pestañas.
* **Cursor de Espera / Bloqueo:** `cursor: wait;` o `cursor: not-allowed;` asignado a botones deshabilitados mientras se procesa una consulta en Overpass o se descarga la base de datos:
  ```css
  button:disabled {
    cursor: not-allowed !important;
    opacity: 0.55;
    filter: grayscale(1);
  }
  ```
* **Cursor de Inspección Normativa (Crosshair):** Cuando el usuario activa la herramienta de inspección territorial del PRC de Santiago, el contenedor del mapa debe cambiar a una retícula de precisión:
  ```css
  .leaflet-container.modo-inspeccion-activa {
    cursor: crosshair !important;
  }
  ```

### 6.2. Modificación de Cursores en el Mapa Leaflet (`mapa.js`)
Leaflet controla el cursor del mapa mediante clases CSS aplicadas sobre el contenedor `.leaflet-container`. Para personalizarlo quirúrgicamente en [`src/js/modulos/mapa.js`](file:///Users/geojplescano/Programas/Práctica%20profesional%202026%20S2/nodo-geoabierto/src/js/modulos/mapa.js):

1. **Cursor de Arrastre Libre (Pan):**
   Por defecto Leaflet usa `cursor: grab;` y al hacer clic sostenido conmuta a `cursor: grabbing;`. Para cambiarlo por un puntero clásico o flecha:
   ```javascript
   // En src/js/modulos/mapa.js, dentro de inicializarMapa():
   map.getContainer().style.cursor = 'default';
   ```
2. **Cursor Dinámico según la Herramienta Seleccionada:**
   Se puede implementar una función conmutadora de modo en `src/js/modulos/mapa.js`:
   ```javascript
   function setModoHerramientaMapa(modo) {
     const contenedor = map.getContainer();
     contenedor.classList.remove('modo-pan', 'modo-inspeccion', 'modo-medicion', 'modo-dibujo');
     
     switch (modo) {
       case 'inspeccion':
         contenedor.classList.add('modo-inspeccion');
         contenedor.style.cursor = 'crosshair';
         break;
       case 'medicion':
         contenedor.classList.add('modo-medicion');
         contenedor.style.cursor = 'cell';
         break;
       case 'dibujo':
         contenedor.classList.add('modo-dibujo');
         contenedor.style.cursor = 'draw-polygon'; // O cursor SVG personalizado
         break;
       default:
         contenedor.classList.add('modo-pan');
         contenedor.style.cursor = ''; // Restaura el grab nativo de Leaflet
     }
   }
   ```
3. **Punteros Personalizados con Imágenes o SVGs:**
   Para utilizar un puntero SVG propio en lugar de los cursores estándar del sistema operativo:
   ```css
   .leaflet-container.modo-inspeccion {
     cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2338bdf8" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>') 12 12, crosshair !important;
   }
   ```

### 6.3. Modificación de Marcadores Vectoriales (`L.divIcon` y `L.circleMarker`)
Los puntos de interés (POI) del Atlas no utilizan imágenes PNG obsoletas, sino marcadores SVG interactivos renderizados dinámicamente con `L.divIcon`:

```javascript
// Ejemplo en src/js/modulos/mapa.js o ide_chile.js para capas puntuales (ej. Semáforos UOCT o Salud)
function crearMarcadorVectorial(feature, latlng, colorHex, iconoSVG) {
  const htmlIcono = `
    <div class="marcador-pin-atlas" style="background:${colorHex};">
      <div class="pin-halo" style="border-color:${colorHex};"></div>
      <span class="pin-simbolo">${iconoSVG}</span>
    </div>
  `;

  return L.marker(latlng, {
    icon: L.divIcon({
      className: 'contenedor-marcador-svg',
      html: htmlIcono,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    })
  });
}
```

Para estilizar y animar estos marcadores en `src/css/estilos.css`:
```css
.contenedor-marcador-svg {
  background: transparent;
  border: none;
}

.marcador-pin-atlas {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 0.8rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5), inset 0 0 4px rgba(255, 255, 255, 0.6);
  position: relative;
  transition: transform 0.2s ease;
}

.marcador-pin-atlas:hover {
  transform: scale(1.25);
  z-index: 1000 !important;
}

.marcador-pin-atlas .pin-halo {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  opacity: 0.4;
  animation: pulso-marcador 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes pulso-marcador {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.4); opacity: 0; }
  100% { transform: scale(0.9); opacity: 0; }
}
```

### 6.4. Modificación de Estilos de Capas Poligonales y Lineales
Para modificar el color, grosor de línea, opacidad y resaltado al pasar el ratón (*hover*) en capas poligonales (como Censo 2024 Manzanas o Zonas del PRC):

```javascript
// En src/js/modulos/ide_chile.js o mapa.js:
const estiloPoligonoPRC = {
  color: '#8b5cf6',        // Color del perímetro (púrpura)
  weight: 1.5,             // Grosor en píxeles
  opacity: 0.85,           // Opacidad del contorno
  fillColor: '#8b5cf6',    // Color de relleno interior
  fillOpacity: 0.25,       // Opacidad de relleno translúcido
  dashArray: '3, 3'        // Línea punteada para zonificación preliminar
};

const estiloPoligonoHover = {
  color: '#38bdf8',        // Contorno se ilumina en azul cielo
  weight: 3,               // Se engruesa la línea
  fillOpacity: 0.5         // Relleno se vuelve más opaco
};

layer.on({
  mouseover: function(e) {
    const l = e.target;
    l.setStyle(estiloPoligonoHover);
    l.bringToFront();
  },
  mouseout: function(e) {
    geojsonLayer.resetStyle(e.target);
  }
});
```

---
"""
print("[+] Secciones 02 a 06 cargadas")
