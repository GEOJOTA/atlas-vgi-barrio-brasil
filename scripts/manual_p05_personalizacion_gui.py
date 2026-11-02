# -*- coding: utf-8 -*-
"""
scripts/manual_p05_personalizacion_gui.py
Capítulos 28 al 30: Guía Exhaustiva de Netlify, Estilos CSS, Colores :root, Punteros, Cursores y Marcadores SVG.
"""

PARTE_05 = r"""# PARTE V: PERSONALIZACIÓN VISUAL, ESTILOS, PUNTEROS Y CONFIGURACIÓN PERIMETRAL

---

## 28. Guía Exhaustiva de Modificación y Operación de Netlify

Netlify actúa como la red de distribución perimetral (*Edge CDN*) y motor de alojamiento estático y serverless del Atlas VGI. Toda directiva de compilación, enrutamiento, seguridad perimetral, variables de entorno y encabezados HTTP se gestiona de manera centralizada mediante el archivo `netlify.toml`, ubicado en la raíz del repositorio.

```text
┌────────────────────────────────────────────────────────────────────────┐
│             ARQUITECTURA DE ENRUTAMIENTO Y CACHÉ EN NETLIFY EDGE       │
├────────────────────────────────────────────────────────────────────────┤
│                           Petición del Cliente                         │
│                                    │                                   │
│         ┌──────────────────────────┴──────────────────────────┐        │
│         ▼                                                     ▼        │
│  Ruta: /docs/*.zip                                    Ruta: /data/*.geojson│
│  • Content-Type: application/zip                      • Content-Type: geo+json│
│  • Disposition: attachment                            • Cache: 24h + SWR 7d│
│  • Cache: max-age=0, must-revalidate                  • CORS: Access-Control *│
│                                                                        │
│         ┌─────────────────────────────────────────────────────┐        │
│         ▼                                                     ▼        │
│  Reglas de Redirección                                Variables LFS    │
│  • /geodatabase ──> /docs/geodatabase_...zip (302)    • SKIP_SMUDGE=0  │
│  • /manual      ──> /#manual (302)                    • FETCH_INCLUDE  │
└────────────────────────────────────────────────────────────────────────┘
```

### 28.1. Anatomía Línea por Línea de `netlify.toml`

```mermaid
flowchart LR
    subgraph IN_NET["1. INPUT"]
        GIT_PUSH["Push a Rama Principal (origin/main)"]
        LFS_OBJS["Objetos Binarios Git LFS (*.zip, *.xlsx, *.gpkg)"]
        TOML_CFG["Directivas Perimetrales (netlify.toml)"]
    end

    subgraph PROC_NET["2. PIPELINE DE DESPLIEGUE Y EDGE CDN"]
        SMUDGE_0["Expansión Binaria Git LFS (GIT_LFS_SKIP_SMUDGE=0)"]
        PUB_SRC["Publicación de Directorio Raíz (publish = 'src')"]
        HDR_INJ["Inyección de Cabeceras CORS (*), MIME geo+json y SWR Cache"]
    end

    subgraph OUT_NET["3. OUTPUT"]
        PROD_URL["Geoportal en Producción (atlasvgiuah.netlify.app)"]
        RESUME_DL["Descargas Reanudables (Accept-Ranges: bytes)"]
    end

    IN_NET --> PROC_NET --> OUT_NET
```

El archivo se encuentra calibrado para servir volúmenes masivos de datos vectoriales y garantizar que los archivos de Git LFS se expandan como binarios reales:

```toml
[build]
  publish = "src"                  # Directorio raíz expuesto públicamente en producción
  functions = "netlify/functions"  # Directorio para funciones serverless Node.js

[build.environment]
  # Archivos LFS que Netlify debe descargar obligatoriamente en el build:
  GIT_LFS_FETCH_INCLUDE = "*.zip,*.xlsx,*.csv,*.docx,*.gpkg,*.pbf"
  GIT_LFS_SKIP_SMUDGE = "0"        # Fuerza a git-lfs a expandir los binarios reales (no punteros de 130 bytes)
  NODE_VERSION = "18"              # Versión del runtime para Netlify Functions

# -----------------------------------------------------------------------------
# Cabeceras Globales de Seguridad Perimetral y CORS Abierto
# -----------------------------------------------------------------------------
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"                     # Previene ataques de Clickjacking permitiendo iframes solo de origen
    X-Content-Type-Options = "nosniff"                 # Obliga al navegador a respetar estrictamente el Content-Type declarado
    X-XSS-Protection = "1; mode=block"                 # Activa el filtro anti-XSS integrado en navegadores
    Referrer-Policy = "strict-origin-when-cross-origin"
    Access-Control-Allow-Origin = "*"                  # Habilita CORS abierto para que investigadores consuman los GeoJSON directamente
    Access-Control-Allow-Headers = "Origin, X-Requested-With, Content-Type, Accept, Range"
    Access-Control-Expose-Headers = "Content-Length, Content-Range"

# -----------------------------------------------------------------------------
# Tipos MIME y Reglas de Caché para la Geodatabase Comprimida (.zip)
# -----------------------------------------------------------------------------
[[headers]]
  for = "/docs/*.zip"
  [headers.values]
    Content-Type = "application/zip"
    Content-Disposition = "attachment; filename=\"geodatabase_completa_atlas_vgi.zip\""
    Cache-Control = "public, max-age=0, must-revalidate" # Fuerza al navegador a verificar cambios antes de usar caché
    Accept-Ranges = "bytes"                              # Habilita descargas reanudables por bloques de bytes

# -----------------------------------------------------------------------------
# Optimización de Rendimiento para Archivos Cartográficos GeoJSON
# -----------------------------------------------------------------------------
[[headers]]
  for = "/data/*.geojson"
  [headers.values]
    Content-Type = "application/geo+json; charset=utf-8"
    Cache-Control = "public, max-age=86400, stale-while-revalidate=604800" # Cachea 24 hrs y revalida en background

# -----------------------------------------------------------------------------
# Reglas de Enrutamiento y Redirecciones Canónicas (Redirects)
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

[[redirects]]
  from = "/datos"
  to = "/#licencias"
  status = 302
  force = false
```

### 28.2. Procedimiento Operativo para Modificar Netlify
1. **Cambiar el Directorio de Publicación:** Si en el futuro se añade un empaquetador (ej. Vite) que compile en `dist/`, modifique la línea `publish = "src"` por `publish = "dist"`.
2. **Agregar Nuevas Extensiones Binarias a Git LFS:** Si se incorporan rásteres GeoTIFF (`.tif`) o nubes de puntos LiDAR (`.laz`), añádalos a `GIT_LFS_FETCH_INCLUDE` en `netlify.toml`:
   ```toml
   GIT_LFS_FETCH_INCLUDE = "*.zip,*.xlsx,*.csv,*.docx,*.gpkg,*.pbf,*.tif,*.laz"
   ```
3. **Purgar la Caché del CDN de Netlify:**
   - Inicie sesión en [app.netlify.com](https://app.netlify.com).
   - Diríjase a **Sites** → **atlasvgiuah** → **Deploys**.
   - Despliegue el menú **Trigger deploy** y seleccione **Clear cache and deploy site**.

---

## 29. Guía Exhaustiva de Estilos CSS, Variables Semánticas `:root`, Temas y Accesibilidad

```mermaid
flowchart LR
    subgraph IN_CSS["1. INPUT"]
        ROOT_VARS["Tokens de Diseño en :root (Colores, Tipografía, Radios)"]
        MEDIA_Q["Breakpoints Responsivos (@media max-width: 768px)"]
        SVG_PINS["Marcadores Vectoriales Dinámicos L.divIcon"]
    end

    subgraph PROC_CSS["2. PIPELINE DE ESTILIZACIÓN Y LAYOUT"]
        CASCADE["Herencia Semántica en Paneles, Tarjetas y Modales"]
        FLEX_GRID["Maquetación Fluida CSS Grid / Flexbox + 100dvh"]
        ANIM_KEY["Animaciones @keyframes (Pulso de Radar y Transiciones)"]
    end

    subgraph OUT_CSS["3. OUTPUT"]
        WCAG_UI["Interfaz con Conformidad WCAG 2.1 (Nivel AA General / Nivel AAA Tipográfico)"]
        MULTI_DEV["Visualización Adaptativa en Escritorio, Tablet y Móvil"]
    end

    IN_CSS --> PROC_CSS --> OUT_CSS
```

El Atlas VGI implementa un sistema de diseño institucional sobrio, estructurado en CSS3 nativo puro en `src/css/estilos.css`, diseñado para garantizar legibilidad analítica y cumplir formalmente con el estándar internacional de accesibilidad **WCAG 2.1 (Nivel AA en el 100 % de los componentes y acentos cromáticos [4,58:1 a 8,87:1], y Nivel AAA en todo el contraste tipográfico de lectura [9,43:1 a 19,00:1])**.

### 29.1. Diccionario Completo de Tokens de Diseño en `:root`
Todas las variables visuales están centralizadas en el bloque `:root` de `src/css/estilos.css`:

```css
:root {
  /* ==========================================================================
     PALETA CROMÁTICA INSTITUCIONAL Y SEMÁNTICA
     ========================================================================== */
  --musgo: #06b6d4;           /* Cian táctico para acentos primarios, foco y estados activos */
  --agua: #38bdf8;            /* Azul cielo brillante para enlaces, pestañas e indicadores */
  --esmeralda: #10b981;       /* Verde esmeralda para descargas, confirmaciones y 100% OK */
  --ocre: #f59e0b;            /* Ámbar luminoso para advertencias, pendientes y alertas */
  --terracota: #f43f5e;       /* Rojo coral intenso para errores críticos y alertas de cierre */

  /* ==========================================================================
     SUPERFICIES DE MODO OSCURO PROFUNDO (DARK THEME PROFESIONAL)
     ========================================================================== */
  --fondo-app: #0c1527;       /* Fondo base de la aplicación (azul marino profundo, L = 0.0076) */
  --papel: #132039;           /* Superficie de paneles laterales y vistas principales (L = 0.0147) */
  --papel-alto: #1a2b4b;      /* Superficie para contenedores elevados y cabeceras (L = 0.0246) */
  --papel-tarjeta: #223861;   /* Superficie para tarjetas interactivas y fichas (L = 0.0403) */
  --papel-rehundido: #09101f; /* Superficie para consolas de código y bloques de datos (L = 0.0053) */
  --linea: #334e7b;           /* Bordes estructurales entre paneles y divisores */
  --linea-fuerte: #4b6cb7;    /* Bordes destacados para tarjetas activas y cabeceras */

  /* ==========================================================================
     TIPOGRAFÍA Y CONTRASTE DE LECTURA (CERTIFICADO WCAG 2.1 NIVEL AAA: 9.43:1 A 19.00:1)
     ========================================================================== */
  --tinta: #ffffff;           /* Texto principal (blanco puro, L = 1.0000; 11.63:1 a 19.00:1 AAA) */
  --tinta-suave: #f8fafc;     /* Texto secundario (blanco hielo, L = 0.9560; 11.14:1 a 18.20:1 AAA) */
  --tinta-tenue: #e2e8f0;     /* Texto auxiliar y metadatos (plata claro, L = 0.8012; 9.43:1 a 15.40:1 AAA) */

  /* ==========================================================================
     FAMILIAS TIPOGRÁFICAS Y DIMENSIONES ESTRUCTURALES
     ========================================================================== */
  --fuente-titulo: 'Fraunces', Georgia, serif;
  --fuente-cuerpo: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --fuente-mono: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --radio: 10px;
  --radio-sm: 6px;
  --sombra-panel: 0 12px 32px rgba(0, 0, 0, 0.55);
}
```

### 29.2. Cómo Cambiar la Apariencia y Colores de la Aplicación
1. **Cambiar el Color de Acento Primario de la Aplicación:**
   Si se requiere sustituir el azul cian por un azul marino institucional (`#003366`):
   ```css
   :root {
     --musgo: #004b87; /* Nuevo acento primario */
   }
   ```
2. **Modificar el Botón de Acción Principal (`button.accion`):**
   Ubique la clase `.accion` en `src/css/estilos.css` (línea ~320):
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

## 30. Guía Exhaustiva de Punteros, Cursores, Marcadores SVG y Geometrías Vectoriales

El comportamiento visual del puntero del ratón y el diseño de los marcadores comunican al usuario de forma inmediata el modo operativo del visor.

### 30.1. Modificación de Cursores CSS en la Interfaz
En `src/css/estilos.css` se regulan los cursores para cada estado de la aplicación:
* **Cursor Predeterminado:** `cursor: default;` aplicado sobre el `body` y áreas estáticas.
* **Cursor Interactivo (Puntero / Mano):** `cursor: pointer;` asignado a botones, enlaces, tarjetas de capas (`.tarjeta-capa-gis`), pestañas de navegación y conmutadores.
* **Cursor de Espera / Bloqueo:** `cursor: not-allowed;` asignado a elementos deshabilitados mientras se descarga la base de datos o se procesa una consulta Overpass:
  ```css
  button:disabled {
    cursor: not-allowed !important;
    opacity: 0.55;
    filter: grayscale(1);
  }
  ```
* **Cursor de Inspección Normativa (Crosshair):** Cuando se activa la herramienta del Plan Regulador Comunal (PRC), el mapa adopta una retícula de precisión:
  ```css
  .leaflet-container.modo-inspeccion-activa {
    cursor: crosshair !important;
  }
  ```

### 30.2. Marcadores Dinámicos SVG (`L.divIcon`) con Animación de Pulso
En lugar de iconos PNG estáticos que se pixelan al hacer zoom, el Atlas utiliza marcadores SVG vectoriales creados con `L.divIcon` en `src/js/modulos/mapa.js`:

```javascript
function crearIconoMarcadorSVG(colorHex, glifoEmoji) {
  return L.divIcon({
    className: 'marcador-svg-contenedor',
    html: `
      <div class="pin-svg-pulso" style="--color-pin: ${colorHex};">
        <div class="pin-halo"></div>
        <div class="pin-cuerpo">
          <span class="pin-glifo">${glifoEmoji}</span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}
```

Y en `src/css/estilos.css` se implementa la animación `@keyframes` de pulsación perimetral:

```css
.pin-svg-pulso {
  position: relative;
  width: 32px;
  height: 32px;
}

.pin-svg-pulso .pin-halo {
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-pin);
  opacity: 0.6;
  animation: pulso-marcador 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
}

.pin-svg-pulso .pin-cuerpo {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #111827;
  border: 2px solid var(--color-pin);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

@keyframes pulso-marcador {
  0% { transform: scale(0.95); opacity: 0.7; }
  70% { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(0.95); opacity: 0; }
}
```

### 30.3. Estilización de Geometrías Vectoriales (Polígonos y Líneas)
En `src/js/modulos/ide_chile.js`, los estilos de las capas vectoriales se definen mediante funciones dinámicas:

```javascript
function estiloCapaPoligono(feature) {
  return {
    fillColor: '#0284c7',
    weight: 1.5,
    opacity: 1,
    color: '#38bdf8',       // Borde brillante de alto contraste
    fillOpacity: 0.35,      // Opacidad que permite ver el mapa base inferior
    dashArray: feature.properties.proyectado ? '4, 4' : null
  };
}
```

---
"""
print("[+] Parte 05 enriquecida cargada exitosamente")
