# -*- coding: utf-8 -*-
PARTE_08 = r"""# PARTE VIII: GUÍA MAESTRA DE MODIFICACIÓN DETALLE A DETALLE (COOKBOOK OPERATIVO)

---

## 40. Tutorial 01: Modificación de la Paleta Cromática y Variables `:root` en CSS

Toda la identidad visual del Atlas se gestiona de manera centralizada mediante variables personalizadas (*CSS Custom Properties*) declaradas en el pseudo-elemento `:root` del archivo `src/css/estilos.css`. Modificar un color en esta sección actualiza instantáneamente toda la aplicación (cabeceras, botones, bordes, modales y acentos).

```text
┌────────────────────────────────────────────────────────────────────────┐
│             ESTRUCTURA DE VARIABLES DE COLOR EN SRC/CSS/ESTILOS.CSS    │
├────────────────────────────────────────────────────────────────────────┤
│ :root {                                                                │
│   --musgo: #2d5a27;             /* Verde institucional primario UAH */ │
│   --musgo-claro: #417d38;       /* Hover y estados activos */          │
│   --musgo-oscuro: #1d3b19;      /* Cabeceras y sombras profundas */    │
│   --fondo-claro: #f8fafc;       /* Fondo del visor en modo diurno */   │
│   --fondo-oscuro: #0f172a;      /* Fondo de paneles en modo nocturno */│
│   --texto-primario: #1e293b;    /* Tipografía principal legible */     │
│   --borde-suave: #e2e8f0;       /* Separadores de módulos */           │
│   --acento-alerta: #dc2626;     /* Zonas críticas y barreras PMR */    │
│   --acento-patrimonio: #d97706; /* Inmuebles de Conservación Histórica */│
│ }                                                                      │
└────────────────────────────────────────────────────────────────────────┘
```

### 40.1. Procedimiento para Modificar el Color Primario Institucional
1. Abra el archivo `src/css/estilos.css`.
2. Localice el bloque `:root` al inicio del documento (líneas 1 a 25).
3. Modifique el valor hexadecimal de `--musgo`. Por ejemplo, para adoptar un tono azul marino cívico:
   ```css
   :root {
     --musgo: #1e3a8a;        /* Nuevo color primario: Azul Cívico */
     --musgo-claro: #2563eb;  /* Tono para hover y resaltado */
     --musgo-oscuro: #172554; /* Tono para barras de títulos */
   }
   ```
4. Guarde el archivo y refresque el navegador (`Ctrl + F5` o `Cmd + Shift + R`).

### 40.2. Creación de un Nuevo Tema Cromático (Ej: Modo Terracota Patrimonial)
Para añadir un tema personalizado alternativo activable mediante JavaScript:
```css
/* src/css/estilos.css */
body.tema-terracota {
  --musgo: #9a3412;        /* Óxido / Terracota de adobe */
  --musgo-claro: #c2410c;
  --musgo-oscuro: #7c2d12;
  --acento-patrimonio: #b45309;
}
```
Para activar este tema dinámicamente desde la consola o un botón:
```javascript
document.body.classList.toggle("tema-terracota");
```

---

## 41. Tutorial 02: Personalización de Punteros y Cursores del Ratón

El Atlas utiliza cursores de ratón diferenciados para proporcionar retroalimentación táctil al usuario según la herramienta activa:

### 41.1. Modificación del Cursor General del Lienzo del Mapa
Por defecto, Leaflet aplica el cursor `grab` (mano abierta) sobre el contenedor `#map`. Para cambiarlo a un cursor de agrimensura (*crosshair*) o puntero estándar:

1. Abra `src/css/estilos.css` y localice la regla para el contenedor del mapa:
   ```css
   /* Cursor por defecto en modo navegación */
   .leaflet-container {
     cursor: default !important;
   }

   /* Cursor cuando el usuario arrastra el lienzo */
   .leaflet-container.leaflet-drag-target {
     cursor: grabbing !important;
   }
   ```

### 41.2. Cursor de Precisión para el Inspector Normativo PRC (Crosshair)
Cuando el usuario activa el modo de inspección urbanística en `src/js/modulos/evaluador_normativo.js`, se inyecta una clase especial al contenedor para indicar que cualquier clic emitirá un certificado:

```javascript
// Activar modo inspección
function activarModoInspector() {
  const contenedorMapa = document.getElementById("map");
  contenedorMapa.classList.add("cursor-inspeccion-activa");
  mostrarToast("Modo Inspector Normativo activado: Haga clic en cualquier predio.", "info");
}

// Desactivar modo inspección
function desactivarModoInspector() {
  const contenedorMapa = document.getElementById("map");
  contenedorMapa.classList.remove("cursor-inspeccion-activa");
}
```
Y en `src/css/estilos.css`:
```css
/* Cursor de retícula de alta precisión con punto central */
.cursor-inspeccion-activa .leaflet-container {
  cursor: crosshair !important;
}
```

### 41.3. Cursor SVG Personalizado con Ícono de Brújula o Lupa
Si desea utilizar un gráfico SVG propio como puntero del ratón:
```css
.cursor-lupa-vgi {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%232d5a27" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>') 11 11, crosshair !important;
}
```

---

## 42. Tutorial 03: Creación y Modificación de Marcadores SVG (`L.divIcon`)

Los marcadores puntuales tradicionales basados en archivos `.png` sufren de pixelación en pantallas de alta densidad (Retina / 4K). El Atlas resuelve esto generando marcadores vectoriales puros mediante `L.divIcon`.

### 42.1. Anatomía de un Marcador SVG en el Atlas
La función generadora de marcadores reside en `src/js/modulos/mapa.js`. Acepta un ícono SVG incrustado y un color temático:

```javascript
function crearMarcadorIcono(tipoEquipamiento) {
  let iconoSVG = "";
  let colorFondo = "#2d5a27";

  switch (tipoEquipamiento) {
    case "arbol_patrimonial":
      colorFondo = "#15803d"; // Verde bosque
      iconoSVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 2L4 12h4v8h8v-8h4L12 2z"/></svg>`;
      break;

    case "patrimonio_ich":
      colorFondo = "#b45309"; // Ocre dorado
      iconoSVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 3L2 12h3v8h14v-8h3L12 3z"/></svg>`;
      break;

    case "salud_cesfam":
      colorFondo = "#dc2626"; // Rojo alerta
      iconoSVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M19 105h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>`;
      break;

    default:
      colorFondo = "#475569"; // Gris neutro
      iconoSVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><circle cx="12" cy="12" r="6"/></svg>`;
  }

  const htmlMarcador = `
    <div class="pin-marcador-svg" style="background-color: ${colorFondo};">
      ${iconoSVG}
    </div>
  `;

  return L.divIcon({
    className: "contenedor-pin-vgi",
    html: htmlMarcador,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28]
  });
}
```

### 42.2. Efecto de Pulso de Radar (@keyframes) para Puntos de Emergencia
Para añadir un halo animado que pulse continuamente en el mapa:
```css
/* src/css/estilos.css */
.pin-marcador-svg.con-radar::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid currentColor;
  animation: radar-vgi 2s infinite ease-out;
}

@keyframes radar-vgi {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}
```

---

## 43. Tutorial 04: Incorporación de Nuevos Mapas Base (TileLayers)

Si desea agregar un nuevo proveedor de mapas base (como ortofotos satelitales o topografía de montaña):

### 43.1. Añadir el Mosaico en `src/js/app.js`
Localice el objeto `mapasBase` y agregue la nueva fuente conforme al estándar XYZ:
```javascript
// Agregar capa de Satélite de ESRI ArcGIS Online
mapasBase["esri_satelite"] = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
  }
);

// Agregar capa Topográfica de OpenTopoMap
mapasBase["opentopomap"] = L.tileLayer(
  "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
  }
);
```

### 43.2. Añadir el Selector en el Menú de la Interfaz (`src/index.html`)
En la sección de selección de mapa base en la barra lateral:
```html
<label class="opcion-mapa-base">
  <input type="radio" name="mapa_base" value="esri_satelite" onchange="conmutarMapaBase('esri_satelite')">
  <span>🛰️ Ortofoto Satelital (ESRI)</span>
</label>
<label class="opcion-mapa-base">
  <input type="radio" name="mapa_base" value="opentopomap" onchange="conmutarMapaBase('opentopomap')">
  <span>⛰️ Topografía (OpenTopoMap)</span>
</label>
```

---

## 44. Tutorial 05: Incorporación de una Nueva Capa GeoJSON al Atlas

```mermaid
flowchart LR
    subgraph IN_NEW["1. INPUT"]
        RAW_SHP["Capa Nueva (Shapefile / GeoPackage / GeoJSON)"]
        META_DOC["Ficha de Procedencia, Licencia y Cita APA 7ª Ed."]
    end

    subgraph PROC_NEW["2. PIPELINE DE INTEGRACIÓN EN 6 ETAPAS"]
        STEP_1["1. Reproyección a WGS84 (EPSG:4326) y Guardado en data/ y src/data/"]
        STEP_2["2. Inyección de 14 Atributos ISO (enriquecer_base_datos_metadatos.py)"]
        STEP_3["3. Evaluación de Calidad WLC v2.0 y Registro en Catálogos .xlsx/.csv"]
        STEP_4["4. Registro en CAPAS_IDE_CHILE / CONFIG_CAPAS y Dimensiones"]
    end

    subgraph OUT_NEW["3. OUTPUT"]
        VALID_QA["5. Verificación 8/8 Tests (verificar_integridad_despliegue.py)"]
        DEPLOY_LIVE["6. Sincronización en Visor Web, Descargas y Producción Netlify"]
    end

    IN_NEW --> PROC_NEW --> OUT_NEW
```

Para incorporar una cobertura vectorial completamente nueva (por ejemplo, `capa_huertos_comunitarios.geojson`):

### Paso 1: Almacenar el Archivo Vectorial
Guarde el archivo GeoJSON proyectado en **WGS84 (EPSG:4326)** en la ruta:
`data/capa_huertos_comunitarios.geojson` y en `src/data/capa_huertos_comunitarios.geojson`.

### Paso 2: Inyectar el Esquema Maestro de 14 Atributos
Ejecute el script de enriquecimiento para estandarizar las claves:
```bash
python3 scripts/enriquecer_base_datos_metadatos.py
```

### Paso 3: Registrar la Capa en `docs/catalogo_fuentes_vgi.xlsx`
Abra el libro de cálculo o ejecute `python3 scripts/generar_entregables_excel.py` para asegurar que figure en las capas catalogadas con su respectiva licencia y linaje en `docs/catalogo_fuentes_vgi.xlsx` y `src/docs/catalogo_fuentes_vgi.xlsx`.

### Paso 4: Añadir la Casilla Checkbox en `src/index.html` o en `src/js/modulos/ide_chile.js`
Dentro del acordeón temático correspondiente:
```html
<div class="item-capa-control">
  <label class="switch-capa">
    <input type="checkbox" id="chk-huertos-comunitarios" onchange="alternarCapaVectorial('huertos_comunitarios', this.checked)">
    <span class="deslizador"></span>
  </label>
  <span class="etiqueta-capa">🌱 Huertos Comunitarios</span>
  <span class="conteo-badge" id="badge-huertos">--</span>
</div>
```

### Paso 5: Definir la Simbología y Carga en `src/js/modulos/mapa.js`
```javascript
capasConfiguradas["huertos_comunitarios"] = {
  url: "data/capa_huertos_comunitarios.geojson",
  estilo: {
    color: "#16a34a",
    fillColor: "#4ade80",
    fillOpacity: 0.6,
    weight: 2
  },
  onEachFeature: function(feature, layer) {
    const p = feature.properties || {};
    layer.bindPopup(`
      <div class="popup-vgi">
        <h4>🌱 ${p.nombre_objeto || "Huerto Comunitario"}</h4>
        <p><strong>Tipo:</strong> ${p.subcategoria || "Comunitario"}</p>
        <p><strong>Responsable:</strong> ${p.responsable_ingesta || "Vecinos Organizados"}</p>
      </div>
    `);
  }
};
```

---

## 45. Tutorial 06: Creación de Nuevas Consultas Overpass QL en el Módulo 02

El Módulo 02 permite a los investigadores ejecutar consultas personalizadas contra OpenStreetMap. Para incorporar una nueva plantilla predefinida:

1. Abra `src/js/modulos/osm.js`.
2. Localice el diccionario `PLANTILLAS_OVERPASS`.
3. Añada la nueva consulta formateada en Overpass QL:
   ```javascript
   PLANTILLAS_OVERPASS["grifos_incendio"] = {
     nombre: "🚒 Grifos contra Incendios (Emergency Hydrants)",
     ql: `[out:json][timeout:60];
   (
     node["emergency"="fire_hydrant"]({{bbox}});
   );
   out body;
   >;
   out skel qt;`
   };
   ```
4. Agregue el botón de acceso directo en el panel de `src/index.html`:
   ```html
   <button class="boton-plantilla-ql" onclick="cargarPlantillaOverpass('grifos_incendio')">
     🚒 Grifos contra Incendios
   </button>
   ```

---

## 46. Tutorial 07: Diseño y Publicación de un Nuevo Storyboard Cartográfico

Para crear un nuevo Storyboard temático (por ejemplo, **Rutas del Pan y Panaderías Tradicionales de Barrio Brasil**):

### Paso 1: Configurar el Objeto en `src/js/modulos/indicadores_analisis.js`
```javascript
STORYBOARDS.push({
  id: "storyboard-panaderias",
  titulo: "Rutas del Pan y Panaderías Centenarias",
  narrativa: "Recorrido por las panaderías tradicionales con hornos de leña y amasanderías de barrio que han resistido por más de 80 años en Barrio Brasil.",
  centro: [-33.4415, -70.6650],
  zoom: 17,
  capas: ["servicios", "movilidad_activa"],
  archivosGeoJSON: ["data/capa_servicios.geojson", "data/capa_movilidad_activa.geojson"],
  filtroAtributos: (props) => props.subcategoria === "bakery" || props.shop === "bakery"
});
```

### Paso 2: Crear la Tarjeta en `src/index.html`
```html
<article class="tarjeta-storyboard" onclick="abrirStoryboard('storyboard-panaderias')">
  <div class="storyboard-miniatura" style="background-image: url('img/storyboards/portada_kde.svg');"></div>
  <div class="storyboard-info">
    <h4>05. Rutas del Pan Tradicional</h4>
    <p>Amasanderías centenarias y resistencia comercial de barrio.</p>
  </div>
</article>
```

---

## 47. Tutorial 08: Modificación de Ponderadores del Modelo WLC ISO 19157

Si un investigador desea ajustar los pesos relativos del modelo de calidad en `scripts/modelo_indice_lineal_wlc.py`:

```python
# Modificación en scripts/modelo_indice_lineal_wlc.py
# Ponderación por defecto: 50% cuantitativo / 50% cualitativo
PESO_CUANTITATIVO = 0.60  # Incrementa peso de exactitud posicional y completitud
PESO_CUALITATIVO   = 0.40  # Reduce peso de linaje y reputación

def calcular_indice_global_vgi(p_cuant, p_cual):
    # Calcula el IGV normalizado en [0.0, 1.0]
    return round((PESO_CUANTITATIVO * p_cuant) + (PESO_CUALITATIVO * p_cual), 4)
```
Tras modificar los coeficientes, regenere los reportes y catálogos ejecutando:
```bash
python3 scripts/modelo_indice_lineal_wlc.py
python3 scripts/generar_entregables_excel.py
```

---

## 48. Tutorial 09: Actualización de la Zonificación del PRC de Santiago

Si la Municipalidad de Santiago publica una enmienda o actualización a la Ordenanza del Plan Regulador Comunal:

1. Actualice el archivo GeoJSON vectorial en `data/ide_minvu_ipt_prc_santiago.geojson` y su réplica en `src/data/ide_minvu_ipt_prc_santiago.geojson`.
2. Abra `src/js/modulos/evaluador_normativo.js`.
3. Actualice la tabla de correspondencia normativa `DICCIONARIO_ZONAS_PRC`:
   ```javascript
   const DICCIONARIO_ZONAS_PRC = {
     "ZCH-1": {
       nombre: "Zona de Conservación Histórica 1 - Barrio Brasil",
       alturaMaxMetros: 14.0,
       coefConstructibilidad: 2.4,
       coefOcupacionSuelo: 0.70,
       usosPermitidos: "Vivienda, comercio escala barrial, talleres artesanales, equipamiento comunitario.",
       usosProhibidos: "Discotecas, plantas industriales molestas o insalubres, bodegaje mayor."
     }
   };
   ```

---

## 49. Tutorial 10: Configuración Perimetral Avanzada en `netlify.toml`

Para incorporar nuevas políticas de seguridad en la red de distribución perimetral (*Edge CDN*):

### 49.1. Política de Seguridad de Contenidos (Content-Security-Policy - CSP)
Edite el archivo `netlify.toml` en la raíz del repositorio:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://overpass-api.de https://overpass.kumi.systems https://api.ohsome.org https://api.gbif.org https://*.supabase.co;"
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## 51. Tutorial 12: Incorporación de Nuevas Reglas de Validación en Pre-Despliegue

Para garantizar que futuras adiciones al Atlas cumplan con los estándares de calidad del proyecto, los desarrolladores pueden incorporar nuevas pruebas automatizadas en `scripts/verificar_integridad_despliegue.py`:

```python
# Adición de prueba en scripts/verificar_integridad_despliegue.py
def prueba_09_verificar_peso_maximo_capas():
    # Valida que ninguna capa GeoJSON barrial exceda los 15 MB para evitar bloqueos en navegadores moviles
    print("[*] TEST 9: Verificando que ninguna capa GeoJSON barrial exceda los 15 MB...")
    ruta_capas = os.path.join(BASE_DIR, "data")
    limite_bytes = 15 * 1024 * 1024  # 15 Megabytes
    
    for archivo in os.listdir(ruta_capas):
        if archivo.endswith(".geojson"):
            ruta_completa = os.path.join(ruta_capas, archivo)
            tamano = os.path.getsize(ruta_completa)
            if tamano > limite_bytes:
                print(f"    [FAIL] Capa {archivo} excede el límite móvil ({tamano / (1024**2):.2f} MB > 15 MB).")
                print("           Aplique simplificación topológica (ST_SimplifyPreserveTopology) antes de desplegar.")
                return False
    print("    ✓ Todas las capas GeoJSON cumplen con el límite de peso para clientes móviles.")
    return True
```
Para registrar la prueba, incorpórela en la lista `pruebas` de la función `main()`:
```python
pruebas = [
    prueba_01_sintaxis_geojson,
    prueba_02_coordenadas_wgs84,
    prueba_03_esquema_atributos,
    prueba_04_rango_wlc,
    prueba_05_coherencia_excel,
    prueba_06_sintaxis_python,
    prueba_07_red_y_recursos,
    prueba_08_sanitizacion_institucional,
    prueba_09_verificar_peso_maximo_capas  # Nueva prueba registrada
]
```

---

## 52. Tutorial 13: Sistema de Notificaciones Táctiles (Toast Notifications)

El Atlas cuenta con un sistema reactivo de notificaciones visuales flotantes (*Toasts*) que informa al usuario sobre el estado de las descargas, alertas de conectividad o resultados del Inspector Normativo sin interrumpir la navegación cartográfica.

### 52.1. Implementación de la Función Controladora en `src/js/app.js`
```javascript
function mostrarToast(mensaje, tipo = "info", duracionMs = 4000) {
  let contenedor = document.getElementById("contenedor-toasts");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "contenedor-toasts";
    contenedor.className = "pila-toasts-vgi";
    document.body.appendChild(contenedor);
  }

  const toast = document.createElement("div");
  toast.className = `toast-vgi toast-${tipo}`;
  
  const icono = tipo === "exito" ? "✓" : tipo === "error" ? "⚠" : "ℹ";
  toast.innerHTML = `
    <span class="toast-icono">${icono}</span>
    <span class="toast-mensaje">${mensaje}</span>
  `;

  contenedor.appendChild(toast);

  // Animación de entrada
  setTimeout(() => toast.classList.add("visible"), 50);

  // Animación de salida y remoción
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 400);
  }, duracionMs);
}
```

### 52.2. Estilos Visuales en `src/css/estilos.css`
```css
.pila-toasts-vgi {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast-vgi {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.95);
  color: #ffffff;
  font-size: 13px;
  font-family: inherit;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}

.toast-vgi.visible {
  transform: translateY(0);
  opacity: 1;
}

.toast-info  { border-left: 4px solid var(--musgo, #2d5a27); }
.toast-exito { border-left: 4px solid #16a34a; }
.toast-error { border-left: 4px solid #dc2626; }
```

---

## 53. Tutorial 14: Integración de Geoservicios WMS/WFS Oficiales del Estado de Chile

Si se requiere conectar capas servidas dinámicamente por ministerios del Estado a través del estándar OGC Web Map Service (WMS) —por ejemplo, la red de estaciones hidrométricas de la Dirección General de Aguas (DGA) o la cartografía catastral de la Dirección de Vialidad (MOP)—:

### 53.1. Configuración de Capa WMS en Leaflet (`src/js/modulos/mapa.js`)
```javascript
function cargarCapaOficialWMS(urlServidorWMS, nombreCapaWMS, tituloVisible) {
  const capaWMS = L.tileLayer.wms(urlServidorWMS, {
    layers: nombreCapaWMS,
    format: "image/png",
    transparent: true,
    version: "1.3.0",
    crs: L.CRS.EPSG4326, // Homologación geodésica estricta
    attribution: "Geoservicio Oficial IDE Chile &copy; Estado de Chile",
    maxZoom: 19
  });

  // Registro en el gestor de capas activas
  capasConfiguradas[nombreCapaWMS] = {
    tipo: "wms",
    instancia: capaWMS,
    nombre: tituloVisible
  };

  return capaWMS;
}

// Ejemplo de conexión a la cartografía base de IDE Chile
const capaIdeChileWMS = cargarCapaOficialWMS(
  "https://www.geoportal.cl/geoserver/wms",
  "ide_chile:limites_comunales_censales_2024",
  "Límites Comunales Oficiales (Censo 2024)"
);
```

---

## 54. Tutorial 15: Exportación Dinámica de Datos en Formatos GeoJSON, CSV y KML

Para empoderar a los investigadores locales, el visor permite exportar el subconjunto de datos filtrados en pantalla a diferentes formatos geográficos universales mediante generación dinámica de objetos binarios en el cliente (*Blobs*):

```javascript
// src/js/modulos/importador_capas.js
function descargarDatosEnCliente(contenidoTexto, nombreArchivo, tipoMime) {
  const blob = new Blob([contenidoTexto], { type: tipoMime });
  const urlTemporal = URL.createObjectURL(blob);
  
  const enlace = document.createElement("a");
  enlace.href = urlTemporal;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  
  // Liberar memoria en el navegador
  setTimeout(() => URL.revokeObjectURL(urlTemporal), 2000);
  mostrarToast(`Archivo ${nombreArchivo} exportado exitosamente.`, "exito");
}

// 1. Exportar a GeoJSON
function exportarCapaGeoJSON(coleccionFeatures, nombreCapa) {
  const texto = JSON.stringify({
    type: "FeatureCollection",
    generadoPor: "Atlas VGI UAH - Nodo GeoAbierto",
    fechaExportacion: new Date().toISOString(),
    features: coleccionFeatures
  }, null, 2);
  descargarDatosEnCliente(texto, `${nombreCapa}_vgi_uah.geojson`, "application/geo+json");
}

// 2. Exportar a CSV tabular (UTF-8 con BOM para apertura nativa en Microsoft Excel)
function exportarCapaCSV(coleccionFeatures, nombreCapa) {
  if (!coleccionFeatures.length) return;
  const encabezados = Object.keys(coleccionFeatures[0].properties || {});
  let csv = "\uFEFF" + ["id", "longitud", "latitud", ...encabezados].join(";") + "\n";

  for (const f of coleccionFeatures) {
    const coords = f.geometry && f.geometry.type === "Point" ? f.geometry.coordinates : [0, 0];
    const fila = [
      f.id || "",
      coords[0],
      coords[1],
      ...encabezados.map(h => `"${String(f.properties[h] || '').replace(/"/g, '""')}"`)
    ];
    csv += fila.join(";") + "\n";
  }
  descargarDatosEnCliente(csv, `${nombreCapa}_vgi_uah.csv`, "text/csv;charset=utf-8");
}
```

---

## 55. Tutorial 16: Protocolo de Auditoría de Accesibilidad Web (WCAG 2.1 Nivel AAA)

En el marco del diseño universal e inclusivo de la plataforma web, la interfaz del Atlas cumple con el nivel más exigente de accesibilidad internacional: **WCAG 2.1 AAA**. Esto exige una relación de contraste cromático mínima de **7:1** para texto normal y soporte integral de navegación por teclado.

### 55.1. Fórmula Matemática de Luminancia Relativa y Contraste
La luminancia relativa (`L`) de cualquier color RGB normalizado en `[0, 1]` se calcula mediante:

```text
L = 0.2126 × R + 0.7152 × G + 0.0722 × B
```

Donde cada canal `C` se linealiza a partir de su componente `C_sRGB` según:

```text
Si C_sRGB ≤ 0.03928  ⇒  C = C_sRGB / 12.92
Si C_sRGB > 0.03928  ⇒  C = ((C_sRGB + 0.055) / 1.055)^2.4
```

La relación de contraste entre dos colores con luminancias `L₁` (más claro) y `L₂` (más oscuro) se determina por:

```text
Ratio de Contraste = (L₁ + 0.05) / (L₂ + 0.05) ≥ 7.00 : 1   (Estándar WCAG 2.1 AAA)
```

### 55.2. Verificación de Accesibilidad en la Paleta del Atlas
- **Fondo Oscuro (`#0f172a`):** Luminancia `L₂ = 0.012`.
- **Texto Blanco (`#ffffff`):** Luminancia `L₁ = 1.000`.
  ```text
  Contraste = (1.000 + 0.05) / (0.012 + 0.05) = 1.05 / 0.062 ≈ 16.93 : 1   (Supera ampliamente el umbral AAA de 7:1)
  ```
- **Verde Institucional (`#2d5a27`) sobre Blanco (`#ffffff`):** Luminancia `L₂ = 0.088` ⇒ `Contraste = 1.05 / 0.138 ≈ 7.61 : 1` (Cumple WCAG 2.1 AAA).

---

## 56. Tutorial 17: Pipeline de Reempaquetado y Despliegue en Producción

Cada vez que se añadan, editen o depuren capas vectoriales, es imperativo regenerar el archivo comprimido masivo y auditar la integridad total del sistema antes de enviar a producción:

```bash
# 1. Regenerar el paquete masivo unificado en docs/ y src/docs/ (542,35 MB / 257 archivos)
python3 scripts/empaquetar_base_datos_completa.py

# 2. Ejecutar la suite automatizada de 8 pruebas de integridad pre-despliegue
python3 scripts/verificar_integridad_despliegue.py

# 3. Confirmar que Git LFS rastree adecuadamente los binarios (docs/geodatabase_completa_atlas_vgi.zip)
git lfs status

# 4. Commit semántico y publicación a producción
git add .
git commit -m "data(capas): actualizar coberturas vectoriales y paquete unificado"
git push origin main
```
Netlify compilará y desplegará la nueva versión automáticamente en su red perimetral en menos de 90 segundos.

---
"""
print("[+] Parte 08 enriquecida cargada exitosamente")
