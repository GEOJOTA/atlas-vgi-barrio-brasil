# -*- coding: utf-8 -*-
PARTE_04 = r"""# PARTE IV: INGENIERÍA DE SOFTWARE, FRONTEND Y VISUALIZACIÓN INTERACTIVA

---

## 20. Arquitectura Frontend de la SPA: Zero-Build Vanilla JavaScript y Patrón IIFE

El Atlas de Información Geográfica Voluntaria adopta una filosofía de ingeniería de software deliberadamente minimalista, de alto rendimiento y libre de obsolescencia tecnológica: **Zero-Build Vanilla JavaScript**. A diferencia de los desarrollos web contemporáneos sobrecargados de dependencias (Node.js, Webpack, Vite, React, Angular o Vue.js) que introducen fragilidad por rotura de paquetes, dependencias vulnerables (*supply chain attacks*) y tiempos de carga prolongados, el Atlas se ejecuta directamente en el navegador del usuario sin ninguna etapa intermedia de compilación ni transpilación.

```text
┌────────────────────────────────────────────────────────────────────────┐
│             ARQUITECTURA CLIENT-SIDE FIRST DEL ATLAS VGI               │
├────────────────────────────────────────────────────────────────────────┤
│                      index.html (HTML5 Semántico)                      │
│                                   │                                    │
│         ┌─────────────────────────┴─────────────────────────┐          │
│         ▼                                                   ▼          │
│  src/css/estilos.css (CSS3 Puro)                 src/js/app.js (Bus)   │
│  • Tokens Semánticos en :root                    • Orquestador Central │
│  • Grid / Flexbox Responsivo                     • Router de Paneles   │
│  • Modo Oscuro Nativo                            • Manejador de Hash   │
│                                                             │          │
│         ┌───────────────────────────────────────────────────┤          │
│         ▼                                                   ▼          │
│  MÓDULOS ESPECIALIZADOS IIFE                  MOTOR CARTOGRÁFICO       │
│  • ModuloIDEChile (122 capas)                 • Leaflet 1.9.4          │
│  • ModuloOSM (Overpass QL)                    • L.tileLayer / WMS      │
│  • ModuloOhsome (HeiGIT API)                  • L.geoJSON / L.divIcon  │
│  • ModuloEvaluadorNormativo (PRC)             • Popups Dinámicos       │
│  • ModuloIndicadores (Storyboards)            • Control de Escala      │
└────────────────────────────────────────────────────────────────────────┘
```

### 20.1. El Patrón Revealing Module Pattern (IIFE)

```mermaid
flowchart LR
    subgraph IN_SPA["1. INPUT"]
        HTML_DOM["src/index.html (DOM Semántico + 10 Secciones)"]
        CONFIG_JSON["config/config.json (BBox, Endpoints, Metadatos)"]
        ROLE_SEL["Selector de Perfil Territorial (#sel-perfil-usuario)"]
    end

    subgraph PROC_SPA["2. PIPELINE DE ORQUESTACIÓN CLIENT-SIDE"]
        BUS_APP["Orquestador Central (src/js/app.js)"]
        IIFE_ENCAP["Encapsulamiento Modular IIFE (Sin Contaminación Global)"]
        HASH_ROUT["Enrutador Reactivo de Pestañas y Estado por Rol"]
    end

    subgraph OUT_SPA["3. OUTPUT"]
        SPA_READY["Aplicación Web Zero-Build de Carga Instantánea"]
        MEM_ISOL["Aislamiento de Estado entre los 10 Módulos"]
    end

    IN_SPA --> PROC_SPA --> OUT_SPA
```

Para evitar la contaminación del objeto global (`window`) y garantizar el encapsulamiento estricto de variables de estado privadas, cada módulo funcional se construye mediante una expresión de función inmediatamente invocada (*Immediately Invoked Function Expression* - IIFE):

```javascript
// src/js/modulos/modulo_ejemplo.js
const ModuloEjemploVGI = (() => {
  // Estado privado (inaccesible desde fuera)
  let coleccionEntidades = [];
  let capaLeafletActiva = null;

  async function cargarDatosPrivados(url) {
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      coleccionEntidades = data.features || [];
      return coleccionEntidades;
    } catch (err) {
      console.error("[!] Error cargando datos:", err);
      return [];
    }
  }

  function renderizarEnMapa(mapa) {
    if (capaLeafletActiva) mapa.removeLayer(capaLeafletActiva);
    capaLeafletActiva = L.geoJSON({
      type: "FeatureCollection",
      features: coleccionEntidades
    }).addTo(mapa);
  }

  // Interfaz pública revelada (API del módulo)
  return {
    inicializar: async (mapa, url) => {
      await cargarDatosPrivados(url);
      renderizarEnMapa(mapa);
    },
    obtenerTotal: () => coleccionEntidades.length,
    destruir: (mapa) => {
      if (capaLeafletActiva) mapa.removeLayer(capaLeafletActiva);
      coleccionEntidades = [];
    }
  };
})();

// Registro controlado en el namespace global
window.ModuloEjemploVGI = ModuloEjemploVGI;
```

---

## 21. Motor Cartográfico: Leaflet 1.9.4, Renderizado y Simbología Dinámica

```mermaid
flowchart LR
    subgraph IN_LEAF["1. INPUT"]
        CAPAS_132["132 Capas GeoJSON Homologadas (EPSG:4326)"]
        TILES_XYZ["Mosaicos Base XYZ (OSM, Carto Positron/Dark, Esri)"]
        STYLE_DEF["Diccionario de Estilos y Paletas Temáticas"]
    end

    subgraph PROC_LEAF["2. PIPELINE DE RENDERIZADO CARTOGRÁFICO"]
        PROJ_3857["Proyección en Lienzo Web Mercator (EPSG:3857) y Cálculos UTM 19S"]
        SVG_ICON["Generación Dinámica de Marcadores Vectoriales L.divIcon"]
        BIND_POP["Vinculación de Popups Interactivos con los 14 Atributos ISO"]
    end

    subgraph OUT_LEAF["3. OUTPUT"]
        MAP_CANVAS["Visor Multinivel Fluido en Escritorio, Tablet y Móvil"]
        HUD_CTRL["Controles Flotantes de Capas, Escala y Coordenadas"]
    end

    IN_LEAF --> PROC_LEAF --> OUT_LEAF
```

El núcleo de visualización espacial se basa en **Leaflet versión 1.9.4**, una biblioteca ultraligera (~42 KB comprimida) que ofrece la mejor relación entre velocidad de renderizado, compatibilidad móvil y soporte de estándares web.

### 21.1. Inicialización del Mapa y Configuración de Proyección
El mapa se instancia en el contenedor `<div id="map"></div>`, configurado en el sistema de coordenadas elipsoidales WGS84 proyectadas sobre Web Mercator (EPSG:3857):

```javascript
// Configuración canónica del mapa en src/js/app.js
const mapa = L.map("map", {
  center: [-33.4429, -70.6638], // Coordenadas canónicas de Plaza Brasil
  zoom: 15,
  minZoom: 12,
  maxZoom: 19,
  zoomControl: false, // Desactivado para posicionamiento flotante personalizado
  attributionControl: false // Personalizado en barra inferior
});

// Posicionamiento de controles ergonómicos
L.control.zoom({ position: "bottomright" }).addTo(mapa);
L.control.scale({ imperial: false, metric: true, position: "bottomleft" }).addTo(mapa);
```

### 21.2. Mosaicos Base (Base Maps) y Conmutación Dinámica
El Atlas ofrece tres capas base de referencia cartográfica:

```javascript
const mapasBase = {
  osm_estandar: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> colaboradores'
  }),
  carto_positron: L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: '&copy; CartoDB &copy; OpenStreetMap'
  }),
  carto_dark: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: '&copy; CartoDB &copy; OpenStreetMap'
  })
};

// Carga por defecto: OpenStreetMap Estándar
mapasBase.osm_estandar.addTo(mapa);
```

### 21.3. Generador de Marcadores Vectoriales SVG con Efecto Pulso
Para destacar elementos críticos (como equipamientos de emergencia, sedes comunitarias o árboles patrimoniales), se utiliza el generador dinámico `L.divIcon`, combinando vectores SVG limpios con animaciones CSS:

```javascript
function crearMarcadorVectorial(iconoSVG, colorHex, animado = false) {
  const claseAnimacion = animado ? "pulso-activo" : "";
  const contenidoHTML = `
    <div class="contenedor-marcador ${claseAnimacion}" style="--color-marcador: ${colorHex}">
      <div class="halo-radar"></div>
      <div class="pin-icono">
        ${iconoSVG}
      </div>
    </div>
  `;
  return L.divIcon({
    className: "marcador-vgi-custom",
    html: contenidoHTML,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32]
  });
}
```

---

## 22. Inspector Normativo del Plan Regulador Comunal de Santiago (CIN-VGI)

Una de las innovaciones tecnológicas más destacadas del Atlas es el **Inspector Normativo Territorial**. Esta herramienta permite al usuario hacer clic en cualquier punto del mapa y recibir de forma instantánea el **Certificado de Informaciones Normativas VGI (CIN-VGI)**, calculando en el lado del cliente (*client-side*) la intersección geométrica con las 192 zonas urbanísticas del Plan Regulador Comunal (PRC) de Santiago.

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Actor Territorial
    participant Mapa as Leaflet 1.9.4 (#map)
    participant Inspector as ModuloEvaluadorNormativo
    participant Poligonos as Capas PRC Santiago (Client-side)
    participant UI as Popup Modal CIN-VGI

    Usuario->>Mapa: Clic en coordenadas [lat, lon]
    Mapa->>Inspector: Evento click(e.latlng)
    Inspector->>Inspector: Iniciar Algoritmo Ray-Casting
    loop Para cada polígono de zonificación PRC
        Inspector->>Poligonos: Evaluar Jordan Curve Theorem (puntoEnPoligono)
        Poligonos-->>Inspector: Intersección (true / false)
    end
    Inspector->>Inspector: Extraer normativa de zona (ZCH, alturas, constructibilidad, usos)
    Inspector->>UI: Renderizar Ficha Técnica Oficial CIN-VGI
    UI-->>Usuario: Desplegar ficha interactiva con botones Imprimir y Copiar JSON
```

### 22.1. El Algoritmo Ray-Casting (Point-in-Polygon)
Para evitar peticiones lentas a servidores remotos, el cálculo se realiza íntegramente en JavaScript mediante el **Algoritmo de Trazado de Rayos (*Ray-Casting Algorithm*)**, fundamentado en el Teorema de la Curva de Jordan:

```text
Si el número de intersecciones de un rayo horizontal con el perímetro es impar  ⇒  Punto Interior
```

```javascript
// Algoritmo de Trazado de Rayos (Jordan Curve Theorem) implementado en el Atlas
function puntoEnPoligono(punto, anilloCoordenadas) {
  const [x, y] = punto; // x = longitud, y = latitud
  let adentro = false;

  for (let i = 0, j = anilloCoordenadas.length - 1; i < anilloCoordenadas.length; j = i++) {
    const xi = anilloCoordenadas[i][0], yi = anilloCoordenadas[i][1];
    const xj = anilloCoordenadas[j][0], yj = anilloCoordenadas[j][1];

    const intersecta = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersecta) adentro = !adentro;
  }
  return adentro;
}

// Soporte robusto para polígonos complejos con anillos interiores (huecos) y MultiPolygons
function verificarInterseccionCompleta(punto, geometria) {
  if (geometria.type === "Polygon") {
    const [anilloExterior, ...anillosInteriores] = geometria.coordinates;
    // Debe estar dentro del anillo exterior
    if (!puntoEnPoligono(punto, anilloExterior)) return false;
    // Y NO debe estar dentro de ningún hueco interior
    for (const hueco of anillosInteriores) {
      if (puntoEnPoligono(punto, hueco)) return false;
    }
    return true;
  } else if (geometria.type === "MultiPolygon") {
    for (const poligono of geometria.coordinates) {
      const [anilloExterior, ...anillosInteriores] = poligono;
      if (puntoEnPoligono(punto, anilloExterior)) {
        let enHueco = false;
        for (const hueco of anillosInteriores) {
          if (puntoEnPoligono(punto, hueco)) { enHueco = true; break; }
        }
        if (!enHueco) return true;
      }
    }
  }
  return false;
}
```

### 22.2. Generación del Certificado de Informaciones Normativas (CIN-VGI)
Al detectar la intersección, el módulo extrae los atributos normativos y renderiza una ficha técnica oficial con los usos de suelo permitidos, alturas máximas, rasantes y restricciones patrimoniales:

```javascript
function generarFichaNormativaHTML(zonaPRC, coordenadas) {
  const [lat, lon] = coordenadas;
  return `
    <div class="ficha-cin-vgi">
      <header class="cin-cabecera">
        <span class="cin-insignia">PRC SANTIAGO</span>
        <h3>Certificado de Informaciones Normativas VGI</h3>
        <p class="cin-subtitulo">Coordenadas: ${lat.toFixed(5)}, ${lon.toFixed(5)}</p>
      </header>
      <div class="cin-cuerpo">
        <table class="cin-tabla">
          <tr><th>Zona Normativa:</th><td><strong>${zonaPRC.nombre_zona || "Zona A - Conservación"}</strong></td></tr>
          <tr><th>Código Subzona:</th><td><code>${zonaPRC.codigo || "ZCH-1"}</code></td></tr>
          <tr><th>Usos Permitidos:</th><td>${zonaPRC.usos_permitidos || "Residencial, Equipamiento menor, Comercio de barrio"}</td></tr>
          <tr><th>Usos Prohibidos:</th><td>${zonaPRC.usos_prohibidos || "Industria molesta, Discotecas, Almacenamiento masivo"}</td></tr>
          <tr><th>Altura Máxima:</th><td>${zonaPRC.altura_maxima || "14.0 metros (4 pisos + mansarda)"}</td></tr>
          <tr><th>Constructibilidad:</th><td>${zonaPRC.coef_constructibilidad || "2.4"}</td></tr>
          <tr><th>Ocupación de Suelo:</th><td>${zonaPRC.coef_ocupacion || "0.70 (70%)"}</td></tr>
          <tr><th>Protección Patrimonial:</th><td><span class="alerta-patrimonio">Zona de Conservación Histórica (ZCH)</span></td></tr>
        </table>
      </div>
      <footer class="cin-pie">
        <button onclick="window.print()" class="boton-imprimir-cin">Imprimir Certificado</button>
        <button onclick="copiarNormativaJSON('${zonaPRC.codigo}')" class="boton-json-cin">Copiar JSON</button>
      </footer>
    </div>
  `;
}
```

---

## 22.3. Métodos de Cálculo Empleados para las Métricas Morfológicas y Dinámica Edificatoria (LGUC / OGUC)

A fin de brindar una evaluación rigurosa y cuantitativa del tejido urbano en la Comuna de Santiago, el Inspector Normativo y la base de datos espacial del Atlas VGI incorporan cuatro métricas morfológicas clave calculadas a partir de fuentes oficiales del **Instituto Nacional de Estadísticas (INE)** —Permisos de Edificación (2010–2025) y Certificados de Recepción Final (CRF 2011–2025)—, articuladas en tres escalas operativas: **huella de edificación** (OSM / catastro vectorial), **predio / conjunto habitacional** (polígonos CRF) y **manzana censal** (Censo 2024 / síntesis comunal).

> [!IMPORTANT]
> **Alerta Metodológica de Cobertura en "🏗️ DINÁMICA EDIFICATORIA, PERMISOS DOM Y RECEPCIONES FINALES (CRF) INE:":**
> Los resultados arrojados no representan el universo total del punto muestreado sino que están basados en los datos (recepción final [2011–2025] y permisos de edificación [2010–2025]) disponibles públicamente.

### 1. Densidad Neta Real ($D_{\text{neta}}$, viv/ha — Art. 1.1.2 OGUC)
* **Definición Normativa:** Según el Artículo 1.1.2 de la Ordenanza General de Urbanismo y Construcciones (OGUC), la densidad neta corresponde a la *"relación entre el número de habitantes, o de unidades habitacionales, y la superficie del terreno que ocupan, deduciendo las áreas de uso público"*. A diferencia de la densidad bruta (que incluye calles, pasajes y equipamientos comunales), la densidad neta evalúa exclusivamente la concentración vertical y horizontal dentro de los límites del lote predial.
* **Formulación Matemática:**
  $$D_{\text{neta}} = \frac{N_{\text{viviendas}}}{\text{Superficie Predial (m}^2) / 10.000} = \frac{N_{\text{viviendas}}}{\text{Superficie Predial (ha)}}$$
* **Implementación Algorítmica:**
  Para cada polígono predial de conjunto habitacional registrado en el catastro de Recepción Final (`CRF_Santiago_Total.gpkg`), se toma el campo `N_VIVIENDA` y se divide por su superficie geodésica proyectada en UTM Huso 19S (`EPSG:32719`):
  ```python
  area_ha = poly.area / 10000.0
  densidad_neta = (n_vivienda / area_ha) if area_ha > 0 else 0.0
  ```
  En la Comuna de Santiago, los conjuntos habitacionales analizados registran una media de **1.659,4 viv/ha**, con cúspides de densificación intensiva superiores a **9.500 viv/ha** en tipologías de edificación aislada en altura.

### 2. Coeficiente de Ocupación de Suelo ($COS$ — Art. 1.1.2 OGUC)
* **Definición Normativa:** Conforme al Artículo 1.1.2 de la OGUC, el Coeficiente de Ocupación de Suelo es el *"número que multiplicado por la superficie total del predio, descontadas de esta última las áreas declaradas de utilidad pública, fija el máximo de metros cuadrados que pueden edificarse en el primer piso"*.
* **Formulación Matemática:**
  $$COS = \frac{\text{Superficie Edificada en Planta (m}^2)}{\text{Superficie Total del Lote (m}^2)}$$
  Donde $0.0 \le COS \le 1.0$.
* **Implementación Algorítmica (Intersección Predio-Huella OSM):**
  Dado que los registros tabulares del INE no contienen el desglose poligonal de la planta baja, el Atlas cruza espacialmente cada predio con la capa de **Huellas de Edificación (OSM)** (`edificaciones_poligonos.gpkg`, 20.260 huellas en Santiago) mediante indexación espacial jerárquica R-Tree:
  ```python
  possible_matches = gdf_edif.iloc[list(sindex_edif.intersection(poly.bounds))]
  exact_matches = possible_matches[possible_matches.intersects(poly)]
  intersections = exact_matches.intersection(poly)
  sup_edificada_planta = intersections.area.sum()
  cos = min(1.0, max(0.0, sup_edificada_planta / poly.area))
  ```
  La media observada en los conjuntos habitacionales recepcionados de Santiago es de **0,47** (ocupación promedio del 47% del lote en planta baja).

### 3. Porcentaje de Patio y Suelo Libre ($\% SL$)
* **Definición Técnica:** Representa la porción superficial del predio que permanece libre de edificaciones permanentes a nivel de terreno natural, destinada reglamentariamente a patios interiores, distanciamientos, áreas verdes privadas, permeabilidad de infiltración pluvial y circulaciones descubiertas.
* **Formulación Matemática:**
  $$\% SL = (1.0 - COS) \times 100\%$$
* **Significancia Territorial:** En el marco de la mitigación de islas de calor urbanas y conservación ambiental, este indicador permite diagnosticar el grado de sellamiento del suelo predial. En los conjuntos recepcionados de Santiago, el suelo libre promedio alcanza el **53,5%**, variando ampliamente entre cités históricos de baja altura y torres con placa comercial.

### 4. Cálculo de Frente y Fondo Predial (LGUC / OGUC vía OBB)
* **Definición Normativa:**
  - **Frente Predial (Art. 1.1.2 OGUC):** Línea de deslinde que separa el predio del bien nacional de uso público que le otorga acceso oficial (calle, avenida, pasaje).
  - **Fondo Predial:** Profundidad media del predio medida perpendicularmente desde la línea oficial de frente hacia el contrafrente o deslinde posterior.
* **Método de Rectángulo Mínimo Envolvente Orientado (Minimum Oriented Bounding Box - OBB):**
  En predios urbanos con geometrías irregulares, ángulos no ortogonales o trapezoidales, el uso de cajas de límites axis-aligned (AABB) introduce errores severos dependientes de la orientación de la calle. Por tanto, se computa el **Rectángulo Mínimo Rotado Envolvente** (`minimum_rotated_rectangle` en Shapely / GEOS):
  ```python
  mrr = poly.minimum_rotated_rectangle
  coords = list(mrr.exterior.coords)[:-1]
  side1 = Point(coords[0]).distance(Point(coords[1]))
  side2 = Point(coords[1]).distance(Point(coords[2]))

  frente_oguc = min(side1, side2)
  fondo_oguc = max(side1, side2)
  relacion_fondo_frente = fondo_oguc / frente_oguc if frente_oguc > 0 else 1.0
  ```
* **Morfología Diagnóstica:**
  - En los conjuntos habitacionales recepcionados de Santiago, el frente predial medio es de **32,3 metros** y el fondo medio de **54,5 metros**, con una relación media de **1,85**.
  - Ratios elevados ($\ge 2.5$) caracterizan los lotes históricos alargados del pericentro poniente (Cités y casonas coloniales de Barrio Brasil y Yungay).
  - Ratios balanceados ($\approx 1.0 - 1.5$) reflejan procesos de consolidación predial o fusiones inmobiliarias para torres residenciales en altura.

### 5. Articulación de Escalas Territoriales en el Inspector Normativo
El Inspector Normativo implementa la consulta espacial articulando simultáneamente dos filtros complementarios:
1. **Filtro de Manzana Inmediata:** Cruza el punto clicado con el código unificado de manzana censal (`MANZENT`), agregando los permisos de edificación autorizados (unidades, m², pisos máximos, destinos) y las recepciones finales efectivas (viviendas, COS medio, densidad media).
2. **Filtro de Zonificación PRC en Buffer de 500 metros:** A fin de prevenir el sesgo de sobredimensionamiento (tanto falsos positivos como falsos negativos) propio de macro-zonas muy extensas (por ejemplo la Zona B del PRC de Santiago que cubre gran parte de la comuna), se acota la búsqueda a los predios de la **misma zonificación** situados en un radio caminable de **500 metros**, entregando una caracterización precisa del comportamiento morfológico del entorno inmediato.

---

---

## 23. Los Cuatro Storyboards Territoriales y las 75 Cartografías Temáticas

El Atlas implementa en el Módulo 05 (`src/js/modulos/indicadores_analisis.js`) un sistema de divulgación y síntesis territorial guiada denominado **Storyboards**. Cada storyboard constituye un documento analítico interactivo que articula secciones metodológicas intercaladas con gráficos estadísticos dinámicos, diagramas vectoriales de arquitectura SVG y el catálogo completo de **75 cartografías temáticas (`2200 × 1423 px`)**, además de permitir la activación directa de sus capas vectoriales asociadas en el visor interactivo.

```mermaid
flowchart LR
    subgraph IN_SB["1. INPUT"]
        CARTO_75["75 Cartografías Temáticas (img/cartografias/*.jpg)"]
        PORTADAS_4["4 Portadas Vectoriales SVG (img/storyboards/*.svg)"]
        DATA_132["132 Capas GeoJSON + Estadísticas Censo 2024 / SUBDERE / MuniSTGO"]
    end

    subgraph PROC_SB["2. PIPELINE DE SÍNTESIS Y NARRATIVA ESPACIAL"]
        INTER_SEC["Ensamblaje de Secciones Analíticas Intercaladas"]
        SVG_DIAG["Renderizado de Diagramas de Flujo SVG Dimensionados (680x230)"]
        INLINE_CH["Generación de Gráficos Estadísticos Comparativos Inline"]
    end

    subgraph OUT_SB["3. OUTPUT"]
        MODAL_SB["Lámina Modal de Lectura Continua Multi-Dispositivo"]
        LIGHTBOX_HD["Ampliación en Lightbox (Cartografías, Diagramas SVG y Gráficos)"]
        MAP_TRIGGER["Activación Simultánea de Capas en el Visor Cartográfico"]
    end

    IN_SB --> PROC_SB --> OUT_SB
```

```text
┌────────────────────────────────────────────────────────────────────────┐
│       MATRIZ DE LOS 4 STORYBOARDS Y 75 CARTOGRAFÍAS TEMÁTICAS          │
├────────────────────────────────────────────────────────────────────────┤
│ • Storyboard 01: Concentración Territorial y Densidad KDE [11 Mapas]   │
│ • Storyboard 02: Autocorrelación Espacial Local (LISA)    [11 Mapas]   │
│ • Storyboard 03: Demografía, Habitabilidad y RSH Censo 24 [29 Mapas]   │
│ • Storyboard 04: Socioambiente, Movilidad y Residuos      [24 Mapas]   │
└────────────────────────────────────────────────────────────────────────┘
```

### 23.1. Storyboard 01: Concentración Territorial y Núcleos de Actividad VGI (KDE — 11 Cartografías)
- **Cobertura Cartográfica:** **11 cartografías temáticas** (10 macrocategorías VGI `CAT-01` a `CAT-10` + superficie de síntesis KDE Total Consolidado sobre los 10.166 registros multigeométricos).
- **Capas Vectoriales Asociadas:** `educacion` a `cobertura_suelo` (`data/capa_educacion.geojson` a `data/capa_cobertura_suelo.geojson` y consolidado `data/atlas_vgi_barrio_brasil_uah_completo.geojson`).
- **Síntesis Analítica:** Evalúa las superficies continuas de densidad por núcleo de Kernel (`f_h(x)`) en los 27 barrios de la Comuna de Santiago, identificando la concentración en el eje Alameda–Barrio Brasil (`6.924,1 ent/km²` de media barrial y cima comunal de `20.203,8 ent/km²`), Santa Ana (`1.728,2 ent/km²`) y Ejército (`1.007,0 ent/km²`), frente a los vacíos de cobertura en el borde sur comunal (Sierra Bella `1,9 ent/km²` y Bogotá `1,4 ent/km²`).

### 23.2. Storyboard 02: Segregación Espacial, Hotspots y Áreas de Rezago (LISA — 11 Cartografías)
- **Cobertura Cartográfica:** **11 cartografías temáticas** (10 macrocategorías VGI + Consolidado LISA Total sobre las 1.711 manzanas de Santiago con significancia `p < 0.05` en permutaciones de Monte Carlo).
- **Capas Vectoriales Asociadas:** `educacion` (`data/capa_educacion.geojson`), `servicios` (`data/capa_servicios.geojson`), `transporte` (`data/capa_transporte.geojson`), `movilidad_activa` (`data/capa_movilidad_activa.geojson`), `espacio_publico` (`data/capa_espacio_publico.geojson`), `censo2024_manzanas` (`data/ide_censo2024_manzanas.geojson`), `minvu_ipt_prc_santiago` (`data/ide_minvu_ipt_prc_santiago.geojson`).
- **Síntesis Analítica:** Identifica los conglomerados estadísticamente significativos en las 1.711 manzanas comunales: 140 manzanas (`8,2%`) conforman el núcleo *Hotspot Alto-Alto* (concentradas en un 45% dentro de Barrio Brasil con 63 manzanas, seguidas de Santa Ana con 23 y Yungay con 17), mientras 615 manzanas (`35,9%`) integran bolsones *Coldspot Bajo-Bajo* en el suroriente comunal (Sierra Bella, Bogotá, Matta Sur y Diez de Julio).

### 23.3. Storyboard 03: Estructura Sociodemográfica, Habitabilidad y Morfología Urbana (Censo 2024 y RSH — 29 Cartografías)
- **Cobertura Cartográfica:** **29 cartografías temáticas** (Población total de 432.081 habitantes en manzanas, densidad habitacional, tipología constructiva con 92,7% de departamentos, régimen de tenencia con 72,1% de arriendo, hogares unipersonales 40,8%, migración 40,4%, cités, hacinamiento, vulnerabilidad 0–40% RSH, dependencia funcional e índice IGVUST).
- **Capas Vectoriales Asociadas:** `censo2024_manzanas` (`data/ide_censo2024_manzanas.geojson`), `catastro_predial_sii` (`data/ide_sii_catastro_predial.geojson`), `minvu_patrimonio` (`data/ide_minvu_patrimonio_urbano.geojson`), `minvu_ipt_prc_santiago` (`data/ide_minvu_ipt_prc_santiago.geojson`), `bbdd_19` (`data/bbdd_19_santiago.geojson`), `bbdd_64` (`data/bbdd_64_santiago.geojson`), `bbdd_68` (`data/bbdd_68_santiago.geojson`), `bbdd_74` (`data/bbdd_74_santiago.geojson`).
- **Síntesis Analítica:** Caracteriza la coexistencia entre tres tejidos socio-morfológicos en Santiago: el corredor oriental hiperdensificado de torres en altura (Santa Isabel `650,5 hab/ha` y Santa Ana `618,0 hab/ha`), el pericentro patrimonial de escala media en Barrio Brasil y Yungay regulado por las Zonas de Conservación Histórica del PRC, y el arco sur donde convergen el arriendo sin contrato y el hacinamiento en cités.

### 23.4. Storyboard 04: Socioambiente, Proximidad Peatonal, Movilidad y Metabolismo Urbano (24 Cartografías)
- **Cobertura Cartográfica:** **24 cartografías temáticas** (Partición modal sustentable del 84,6% de los viajes, buffers de arbolado a 300 m y 500 m, distancias peatonales a áreas verdes, salud, transporte y educación, mapa de ruido ambiental en dBA y capacidad instalada de los 629 contenedores y 398 papeleros en las 5 macro-zonas de aseo municipal con `285.860 L` totales).
- **Capas Vectoriales Asociadas:** `munistgo_aseo_zonas_residuos_2026` (`data/zonas_aseo_contenedores_papeleros_santiago.geojson`), `biodiversidad` (`data/capa_biodiversidad.geojson`), `movilidad_activa` (`data/capa_movilidad_activa.geojson`), `espacio_publico` (`data/capa_espacio_publico.geojson`), `semaforos_rm_uoct_2026` (`data/semaforos_rm_uoct_2026.geojson`), `estaciones_metro` (`data/ide_estaciones_metro.geojson`), `establecimientos_salud` (`data/ide_establecimientos_salud.geojson`).
- **Síntesis Analítica:** Vincula la alta sostenibilidad modal de la comuna (62,4% transporte público, 17,0% caminata y 5,2% bicicleta) con las brechas de proximidad a áreas verdes en el borde surponiente, la exposición acústica (`> 68,6 dBA`) en corredores viales y la asimetría operativa entre las 5 zonas municipales de gestión de residuos.

---

## 24. Visor Lightbox Pop-Up HD Multi-Dispositivo y Galería Multimedia

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuario (Escritorio / Móvil / Tablet)
    participant Lamina as Lámina Modal Storyboard
    participant Lightbox as Motor Lightbox HD (indicadores_analisis.js)
    participant Canvas as Contenedor #lightbox-canvas

    alt Clic en Cartografía Temática JPG (2200x1423)
        Usuario->>Lamina: Clic en tarjeta o miniatura cartográfica
        Lamina->>Lightbox: abrirLightboxCartografia(src, titulo, subtitulo, rutaAlternativa)
        Lightbox->>Canvas: Inyecta <img> con fallback automático (img/ <-> src/img/)
    else Clic en Diagrama de Flujo SVG
        Usuario->>Lamina: Clic en contenedor .storyboard-diagrama-box
        Lamina->>Lightbox: abrirLightboxDiagrama(idStoryboard, idxSeccion)
        Lightbox->>Canvas: Inyecta <svg viewBox="0 0 680 230"> con dimensiones explícitas (min 680px / 88vw)
    else Clic en Gráfico Estadístico Inline
        Usuario->>Lamina: Clic en bloque .storyboard-inline-chart
        Lamina->>Lightbox: abrirLightboxGraficoInline(idStoryboard, idxSeccion)
        Lightbox->>Canvas: Renderiza barras comparativas ampliadas de alto contraste
    end
    Canvas-->>Usuario: Visualización en pantalla completa (100dvh)
    Usuario->>Canvas: Rueda de ratón / Pinch-to-Zoom (2 dedos) / Paneo táctil (1 dedo)
    Canvas->>Lightbox: Actualiza matriz CSS translate3d(x, y, 0) scale(z) en tiempo real (0.5x a 5.0x)
```

Para inspeccionar las 75 láminas cartográficas de alta definición (`2200 × 1423 px`), los diagramas vectoriales SVG y los gráficos estadísticos sin pérdida de nitidez en cualquier pantalla (ordenadores de escritorio, tablets y teléfonos móviles), el sistema incorpora un motor modal interactivo con soporte dual de ratón y eventos táctiles (`touchstart`, `touchmove`, `touchend`):

```javascript
// Implementación del Visor Lightbox HD en src/js/modulos/indicadores_analisis.js
const VisorLightboxHD = (() => {
  let factorZoom = 1.0;
  let desplazamientoX = 0, desplazamientoY = 0;
  let arrastrando = false;
  let inicioX = 0, inicioY = 0;

  function abrir(urlImagen, titulo, metadatos) {
    const modal = document.getElementById("modal-lightbox");
    const img = document.getElementById("lightbox-imagen");
    const cabecera = document.getElementById("lightbox-titulo");

    img.src = urlImagen;
    cabecera.textContent = titulo;
    factorZoom = 1.0;
    desplazamientoX = 0;
    desplazamientoY = 0;
    aplicarTransformacion(img);

    modal.classList.add("visible");
  }

  function aplicarTransformacion(img) {
    img.style.transform = `translate(${desplazamientoX}px, ${desplazamientoY}px) scale(${factorZoom})`;
  }

  function ajustarZoom(delta, img) {
    factorZoom = Math.min(Math.max(0.5, factorZoom + delta), 4.0);
    aplicarTransformacion(img);
  }

  return { abrir, ajustarZoom };
})();
```

---

## 25. Topografía Integral del Repositorio y Anatomía de Archivos

El repositorio organiza sus componentes bajo una estricta jerarquía modular de ingeniería de software:

```text
nodo-geoabierto/
├── .git/                                   # Metadatos del repositorio Git
├── .gitattributes                          # Configuración de rastreo LFS (*.zip, *.gpkg, *.pbf)
├── .github/                                # Workflows de GitHub Actions (keep-alive, testing)
├── .gitignore                              # Exclusiones de artefactos locales (.DS_Store, *.pyc)
├── CONTRIBUTING.md                         # Guía de contribución para desarrolladores
├── INFORME_PROYECTO_ATLAS_VGI.md           # Memoria descriptiva del proyecto
├── LICENSE                                 # Licencia tripartita (ODbL 1.0, CC BY-SA 4.0, AGPLv3)
├── MANUAL_ACTUALIZACION_ATLAS.md           # Este manual maestro (>5000 líneas) en la raíz
├── MANUAL_USO.md                           # Manual de usuario final para la interfaz web
├── PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md     # Protocolo de auditoría de pre-despliegue
├── README.md                               # Presentación del repositorio en GitHub
├── config/                                 # Configuraciones globales desacopladas
│   └── config.json                         # Configuración JSON (BBox, endpoints, metadatos)
├── data/                                   # Almacén raíz de datos espaciales (sincronizado con src/data/)
│   ├── capa_educacion.geojson .. capa_cobertura_suelo.geojson        # 10 macrocategorías VGI barriales
│   ├── atlas_vgi_barrio_brasil_uah_completo.geojson                  # Consolidado VGI Barrio Brasil
│   ├── capa_osm_rm_cat01_educacion.geojson .. cat10_*.geojson        # 10 capas regionales RM (Geofabrik)
│   ├── capa_osm_rm_completo_vgi.geojson                              # Consolidado regional RM
│   ├── ide_*.geojson, bbdd_*_santiago.geojson, subdere_rsd_*.geojson # 122 capas oficiales del Estado
│   ├── resumen_catastro_vgi.csv                                      # Resumen cuantitativo VGI
│   └── bip_inversiones_santiago.csv                                  # Inversión pública MIDESO BIP
├── docs/                                   # Documentación formal y entregables (sincronizado con src/docs/)
│   ├── geodatabase_completa_atlas_vgi.zip  # Paquete maestro ZIP (542,35 MB; 132 capas del visor y 257 archivos)
│   ├── ANALISIS_METACALIDAD.md             # Informe técnico de calidad ISO 19157 (95.41% IGV)
│   ├── ARQUITECTURA.md                     # Memoria de diseño de software
│   ├── BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md   # Catálogo de 125 fuentes bibliográficas APA 7ª ed.
│   ├── GUIA_BASE_DATOS_SUPABASE.md         # Manual de administración de PostGIS
│   ├── MANUAL_ACTUALIZACION_ATLAS.md       # Copia espejo del manual técnico maestro
│   ├── MANUAL_USO.md                       # Copia espejo del manual de usuario
│   ├── categorias_tematicas_osm.xlsx       # Libro Excel de las 10 macrocategorías OSM
│   ├── catalogo_fuentes_vgi.xlsx           # Matriz Excel de las 132 fuentes y capas
│   ├── perfil_metadatos_vgi.xlsx           # Matriz Excel de los 7 paquetes ISO 19115-1:2014
│   ├── wlc_metacalidad_ranking.csv         # Ranking WLC v2.0 de las 132 capas
│   ├── wlc_metacalidad_resultado.json      # Resultados detallados WLC v2.0 en JSON
│   ├── matriz_metacalidad.json             # Matriz multicriterio de las 10 dimensiones
│   └── correlacion_dimensiones_calidad.csv # Matriz de correlación de Pearson 10x10 (+ .png)
├── netlify.toml                            # Configuración de publicación (publish = "src"), headers y redirects
├── scripts/                                # Scripts de automatización en Python y SQL
│   ├── db/
│   │   ├── 01_schema_postgis.sql           # DDL PostgreSQL 17 + PostGIS 3.3 y vistas materializadas
│   │   └── 02_seed_metadata.sql            # Semilla inicial de metadatos y catálogo en Supabase
│   ├── descargar_todas_las_categorias_osm.py
│   ├── generar_gpkg_geofabrik.py
│   ├── empaquetar_base_datos_completa.py
│   ├── modelo_indice_lineal_wlc.py
│   ├── construir_manual_actualizacion_maestro.py
│   └── verificar_integridad_despliegue.py
└── src/                                    # Directorio raíz publicado en producción (Netlify CDN)
    ├── index.html                          # Markup semántico de la SPA (10 paneles)
    ├── css/estilos.css                     # Sistema de diseño y tokens :root
    ├── js/config.js                        # Configuración de entorno, BBox y categorías VGI
    ├── js/app.js                           # Orquestador central de la aplicación
    ├── js/modulos/                         # 19 módulos JS IIFE (mapa, ide_chile, osm, ohsome, etc.)
    ├── img/cartografias/                   # 75 cartografías temáticas JPG (2200x1423 px)
    ├── img/storyboards/                    # 4 portadas vectoriales SVG de los Storyboards
    ├── data/                               # Espejo exacto de data/ servido en producción
    └── docs/                               # Espejo exacto de docs/ servido en producción
```

---

## 26. Desglose de los 10 Módulos del Sistema (01 al 10) en Coherencia con la Plataforma Web

La barra de navegación superior (`#lista-navegacion` en `src/index.html`) organiza las capacidades del Atlas en **10 módulos funcionales numerados del `01` al `10`**. A continuación se desglosa cada módulo respetando estrictamente su numeración, denominación, scripts asociados y arquitectura de **PIPELINE (Input, Procesamiento y Output)** en la plataforma web:

---

### Módulo 01: Visor y Atlas VGI (`data-panel="inicio"` — `src/js/app.js`, `src/js/modulos/mapa.js`, `src/js/modulos/ide_chile.js`, `src/js/modulos/evaluador_normativo.js`)
* **Propósito Operativo:** Núcleo espacial interactivo; renderiza las 132 capas cartográficas (122 oficiales + 10 VGI); búsqueda en vivo; telemetría dinámica del Índice de Calidad VGI (ICV); Inspector Normativo del PRC de Santiago (Certificado CIN-VGI y 10 hitos históricos 1990–2024); dibujo de BBox con cálculo métrico en `EPSG:32719`.

```mermaid
flowchart LR
    subgraph IN_M1["1. INPUT"]
        GEOJSON["132 Capas GeoJSON (data/*.geojson)"]
        TILES["Mosaicos Base (OSM, Carto, Esri)"]
        CLIC["Clic del Usuario en el Mapa"]
    end

    subgraph PROC_M1["2. PIPELINE DE PROCESAMIENTO"]
        LOAD["Carga Asíncrona (Fetch API + IIFE)"]
        STYLE["Aplicación de Estilos CSS & L.divIcon"]
        RAY["Algoritmo Ray-Casting (Inspector PRC)"]
        MEASURE["Cálculo Geodésico EPSG:32719 de Áreas e ICV Dinámico"]
    end

    subgraph OUT_M1["3. OUTPUT"]
        MAP_VIEW["Lienzo Cartográfico Leaflet 1.9.4"]
        POPUPS["Popups con Atributos Normalizados ISO"]
        CIN["Certificado de Informaciones Normativas (CIN-VGI)"]
    end

    IN_M1 --> PROC_M1 --> OUT_M1
```

---

### Módulo 02: Consultas Overpass (`data-panel="explorador-osm"` — `src/js/modulos/osm.js` y `src/js/modulos/taginfo.js`)
* **Propósito Operativo:** Interfaz de extracción en tiempo real hacia OpenStreetMap con lenguaje Overpass QL; consultas rápidas en 1 clic para las 10 macrocategorías VGI; validación semántica Taginfo API v4 y exportación GeoJSON/CSV.

```mermaid
flowchart LR
    subgraph IN_M2["1. INPUT"]
        BBOX_SEL["BBox Seleccionado (Barrio Brasil / Personalizado)"]
        QUERY_QL["Filtro Temático Overpass QL / Presets 1-Clic"]
        ENDPOINTS["Endpoints Espejo Overpass API"]
    end

    subgraph PROC_M2["2. PIPELINE DE PROCESAMIENTO"]
        FAILOVER["Algoritmo Round-Robin Failover (Multi-Servidor)"]
        OSM_JSON["Recepción de JSON OSM crudo (nodes/ways/relations)"]
        OSMTOGEO["Reconstrucción Topológica a GeoJSON en Navegador"]
    end

    subgraph OUT_M2["3. OUTPUT"]
        CAPA_VIVA["Renderizado de Capa Temporal en el Visor"]
        GEOJSON_DL["Descarga Directa de Archivo GeoJSON / CSV"]
        STATS_QL["Conteo de Nodos, Vías, Relaciones y Etiquetas"]
    end

    IN_M2 --> PROC_M2 --> OUT_M2
```

---

### Módulo 03: Biodiversidad GBIF (`data-panel="biodiversidad-gbif"` — `src/js/modulos/gbif.js`)
* **Propósito Operativo:** Consulta de ocurrencias biológicas georreferenciadas bajo estándar Darwin Core (GBIF REST API v1); cruce con ciencia ciudadana (iNaturalist, eBird) y filtro espacial por BBox.

```mermaid
flowchart LR
    subgraph IN_M3["1. INPUT"]
        GBIF_API["GBIF Occurrence API (api.gbif.org/v1)"]
        WKT_POLY["Filtro Geométrico BBox de Barrio Brasil"]
        TAXON_FILTER["Filtros Taxonómicos (Plantae, Animalia, Fungi)"]
    end

    subgraph PROC_M3["2. PIPELINE DE PROCESAMIENTO"]
        DWC_PARSE["Normalización Darwin Core (DwC)"]
        UNCERT_FLT["Validación de Coordenadas y Taxonomía"]
        CLUSTER_GEO["Agrupamiento por Especie y Reino Biológico"]
    end

    subgraph OUT_M3["3. OUTPUT"]
        LAYER_GBIF["Capa Cartográfica de Especies Urbanas en el Visor"]
        TAXON_CARD["Tabla y Fichas Taxonómicas con Licencias CC"]
        CSV_GBIF["Exportación GeoJSON de Biodiversidad"]
    end

    IN_M3 --> PROC_M3 --> OUT_M3
```

---

### Módulo 04: Cartografía UMap (`data-panel="proyectos-umap"` — `src/js/modulos/umap.js` y `src/js/modulos/importador_capas.js`)
* **Propósito Operativo:** Integración de proyectos colaborativos uMap mediante iframes aislados y motor universal de importación local de archivos geográficos del usuario (`GeoJSON`, `KML`, `GPX` y `Shapefile .zip`).

```mermaid
flowchart LR
    subgraph IN_M4["1. INPUT"]
        UMAP_URL["URL de Mapas uMap Comunitarios"]
        LOCAL_FILE["Archivos Locales del Usuario (.geojson, .kml, .gpx, .zip)"]
    end

    subgraph PROC_M4["2. PIPELINE DE PROCESAMIENTO"]
        SANDBOX["Aislamiento Sandbox de iframe uMap"]
        PARSER_LOC["Conversión en Memoria a GeoJSON (toGeoJSON / JSZip)"]
        SYNC_MAP["Inyección de Capa Personalizada en el Visor Leaflet"]
    end

    subgraph OUT_M4["3. OUTPUT"]
        PANEL_UMAP["Lienzo Interactivo de Mapeo Ciudadano"]
        USER_LAYER["Visualización de Capas Propias junto al Catálogo Oficial"]
    end

    IN_M4 --> PROC_M4 --> OUT_M4
```

---

### Módulo 05: Indicadores & Storyboards (`data-panel="indicadores"` — `src/js/modulos/indicadores_analisis.js`)
* **Propósito Operativo:** Articulación de las 132 coberturas del Atlas en **5 Dimensiones Analíticas** (Sociodemográfica, Socioeconómica, Socioambiental, Sociosanitaria y Sociourbana/Habitabilidad) y **4 Storyboards de Resultados Territoriales** con **75 cartografías temáticas**, gráficos comparativos, diagramas vectoriales SVG y visor Lightbox multi-dispositivo.

```mermaid
flowchart LR
    subgraph IN_M5["1. INPUT"]
        DIM_5["5 Dimensiones Analíticas (132 Capas Asociadas)"]
        STORY_ID["4 Storyboards Temáticos (KDE, LISA, Censo 2024, Socioambiental)"]
        CARTO_SET["75 Cartografías (2200x1423 px) + Diagramas SVG + Gráficos"]
    end

    subgraph PROC_M5["2. PIPELINE DE PROCESAMIENTO"]
        ACORD_DIM["Despliegue de Acordeones con Conmutación Directa al Visor"]
        MODAL_RENDER["Renderizado de Lámina Analítica con Secciones Intercaladas"]
        ZOOM_TOUCH["Motor Lightbox con Zoom Rueda y Pinch-to-Zoom Táctil"]
    end

    subgraph OUT_M5["3. OUTPUT"]
        SCENE_VIEW["Activación de Capas de la Dimensión o Historia en el Mapa"]
        LIGHTBOX["Visualización a Pantalla Completa en Todos los Dispositivos"]
    end

    IN_M5 --> PROC_M5 --> OUT_M5
```

---

### Módulo 06: Calidad & ICV (`data-panel="calidad-ohsome"` — `src/js/modulos/evaluador_calidad_cuantitativa.js`, `src/js/modulos/ohsome.js`, `src/js/modulos/calidad_analyst.js`)
* **Propósito Operativo:** Evaluación multidimensional de calidad geoespacial articulada en tres submódulos: **Submódulo A** (Evaluador Universal de Calidad Espacial, Topología e Índice IGV bajo ISO 19157 e ISO 19115 para las 132 capas o GeoJSON externos), **Submódulo B** (Serie Histórica OSHDB/ohsome API v1/v2 con sensibilidad geométrica `/count`, `/length`, `/area`, reproyección métrica `EPSG:32719` e **Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157)**) y **Submódulo C** (Control de Cambios y Validación de Ediciones Recientes con OSMCha / OSM API v0.6).

```mermaid
flowchart LR
    subgraph IN_M6["1. INPUT"]
        CAPA_AUD["132 Capas del Catálogo o GeoJSON Externo"]
        OHSOME_URL["ohsome API v1/v2 (/elements/count, /length, /area, /users)"]
        OSMCHA_XML["OSM API v0.6 Changesets (/api/0.6/changesets)"]
    end

    subgraph PROC_M6["2. PIPELINE DE PROCESAMIENTO"]
        WLC_ENGINE["Submódulo A: Motor WLC v2.0 (50% Cuantitativo + 50% Cualitativo)"]
        OQT_SAT["Submódulo B: Reproyección EPSG:32719 e Índice de Saturación y Maduración Territorial"]
        CHA_HEUR["Submódulo C: Evaluación Heurística de Changesets OSMCha"]
    end

    subgraph OUT_M6["3. OUTPUT"]
        DICT_IGV["Índice Global IGV (%), Plan de Subsanación y Reporte ISO 19157"]
        SCORE_MAD["Score de Madurez (/100), Densidad (elem/km²) e Intensidad (edit/user)"]
        TABLE_CHA["Tabla de Auditoría de Ediciones Recientes con Enlaces a OSMCha"]
    end

    IN_M6 --> PROC_M6 --> OUT_M6
```

---

### Módulo 07: Manual de Uso y Actualización (`data-panel="manual"` — `src/js/modulos/manual.js`)
* **Propósito Operativo:** Documentación interactiva dividida en **Parte I: Manual de Uso del Atlas** (fundamentación, operación del visor, ICV dinámico, Inspector Normativo e inventario filtrable de las 132 coberturas) y **Parte II: Manual de Actualización y Mantención Técnica** (catálogo estandarizado multi-lenguaje, pipelines de flujo, protocolo de 6 etapas, validación pre-despliegue y régimen jurídico).

```mermaid
flowchart LR
    subgraph IN_M7["1. INPUT"]
        CAP_USO["Parte I: Capítulos de Uso (USO · 01 a USO · 04)"]
        CAP_ACT["Parte II: Capítulos de Actualización (ACT · 01 a ACT · 05)"]
        INV_132["Inventario Dinámico de las 132 Capas (NODO_CONFIG + IDE)"]
    end

    subgraph PROC_M7["2. PIPELINE DE PROCESAMIENTO"]
        FILTER_MODO["Conmutador de Vista (Ambos / Uso / Actualización)"]
        SEARCH_DOC["Filtrado Instantáneo de Documentación y Tabla de Capas"]
    end

    subgraph OUT_M7["3. OUTPUT"]
        DOC_VIEW["Visor Técnico Integrado con Navegación Directa a Módulos"]
        MD_DL["Descarga de Manuales (.md) y Bibliografía APA 7ª Ed."]
    end

    IN_M7 --> PROC_M7 --> OUT_M7
```

---

### Módulo 08: Metadatos ISO 19115 (`data-panel="metadatos-iso"` — `src/js/modulos/metadatos.js`)
* **Propósito Operativo:** Generador, editor y exportador de fichas de metadatos estandarizadas en formatos JSON y XML (`ISO 19139:2007`) conforme al Perfil Nacional de Metadatos de IDE Chile / SNIT.

```mermaid
flowchart LR
    subgraph IN_M8["1. INPUT"]
        ID_CAPA["Selección de Cobertura o Formulario ISO 19115"]
        REGISTRO_JSON["Identificación, BBox, CRS (EPSG:4326/5361/32719) y Linaje"]
    end

    subgraph PROC_M8["2. PIPELINE DE PROCESAMIENTO"]
        BUILD_XML["Serialización XML ISO 19139 (gmd:MD_Metadata)"]
        BUILD_JSON["Estructuración de Ficha JSON Estándar"]
    end

    subgraph OUT_M8["3. OUTPUT"]
        VIEWER_META["Vista Previa de Metadatos en Pantalla"]
        XML_FILE["Descarga de Archivo .xml (GeoNetwork) y .json"]
    end

    IN_M8 --> PROC_M8 --> OUT_M8
```

---

### Módulo 09: Diccionario (132 Capas) (`data-panel="diccionario"` — `src/js/modulos/diccionario.js`)
* **Propósito Operativo:** Catálogo de Objetos y Atributos Geográficos conforme a la norma **ISO 19110:2016**, integrando los **140 descriptores técnicos** que documentan las 132 coberturas operativas y las reglas de homologación semántica entre la normativa chilena (OGUC/PRC/IDE Chile) y OpenStreetMap.

```mermaid
flowchart LR
    subgraph IN_M9["1. INPUT"]
        GLOSARIO_JSON["Catálogo de 140 Descriptores Técnicos (ISO 19110)"]
        SEARCH_KEY["Búsqueda por Código, Institución, Etiqueta OSM o Atributo"]
    end

    subgraph PROC_M9["2. PIPELINE DE PROCESAMIENTO"]
        INDEX_TEXT["Filtrado Instantáneo por Origen (Todos / VGI / IDE / Brechas)"]
        HOMOLOGA["Despliegue de Tablas de Columnas, Tipos de Datos y Dominio"]
    end

    subgraph OUT_M9["3. OUTPUT"]
        CARD_DESCRIP["Fichas Técnicas de Especificación de Atributos"]
        XLSX_DL["Descarga del Catálogo Completo (.xlsx / .json)"]
    end

    IN_M9 --> PROC_M9 --> OUT_M9
```

---

### Módulo 10: Licencias & Catálogos (`data-panel="licencias"` — `src/js/modulos/licencias.js`)
* **Propósito Operativo:** Marco jurídico de datos abiertos (ODbL 1.0, CC BY-SA 4.0, AGPLv3, Ley N° 20.285 y Ley N° 19.628) y centro de descarga directa de la Geodatabase Completa (`docs/geodatabase_completa_atlas_vgi.zip` y `src/docs/geodatabase_completa_atlas_vgi.zip`, 542,35 MB), las capas regionales de Geofabrik (`data/capa_osm_rm_completo_vgi.geojson` y `data/geodatabase_osm_rm_geofabrik.gpkg`) y los 3 catálogos maestros OpenXML (`docs/categorias_tematicas_osm.xlsx`, `docs/catalogo_fuentes_vgi.xlsx` y `docs/perfil_metadatos_vgi.xlsx`).

```mermaid
flowchart LR
    subgraph IN_M10["1. INPUT"]
        CAT_XLSX["3 Libros Maestros OpenXML (.xlsx) en docs/ y 4 Consolidados CSV"]
        ZIP_MASTER["Paquete Maestro docs/geodatabase_completa_atlas_vgi.zip (542,35 MB)"]
    end

    subgraph PROC_M10["2. PIPELINE DE PROCESAMIENTO"]
        LIC_MATRIX["Sistematización de Condiciones Legales y Atribución"]
        DIRECT_DL["Entrega de Enlaces Directos Sincronizados en docs/ y src/docs/"]
    end

    subgraph OUT_M10["3. OUTPUT"]
        TAB_LEGAL["Cuadro de Gobernanza Jurídica y Fuentes"]
        DOWNLOADS["Descarga Inmediata de Geodatabase ZIP, Extractos RM y Catálogos XLSX"]
    end

    IN_M10 --> PROC_M10 --> OUT_M10
```

---

## 27. Guía Paso a Paso para Agregar un Nuevo Módulo a la Plataforma

Para incorporar un nuevo módulo (por ejemplo, *Módulo 11: Sensorica Ambiental IoT*):

1. **Paso 1: Crear el Archivo Lógico IIFE (`src/js/modulos/sensorica_iot.js`):**
   ```javascript
   const ModuloSensoricaIoT = (() => {
     let sensores = [];
     async function init() {
       const resp = await fetch('data/sensores_calidad_aire.geojson');
       sensores = (await resp.json()).features || [];
       render();
     }
     function render() {
       document.getElementById('contenedor-sensores').innerHTML = 
         `<p>Sensores activos: ${sensores.length}</p>`;
     }
     return { inicializar: init };
   })();
   window.ModuloSensoricaIoT = ModuloSensoricaIoT;
   ```
2. **Paso 2: Agregar el Botón en la Barra de Navegación (`src/index.html`):**
   ```html
   <button type="button" class="pestana-nodo" data-panel="sensorica-iot">
     <span class="insignia-nodo">11</span> ♨ Sensorica IoT
   </button>
   ```
3. **Paso 3: Agregar la Sección del Panel (`src/index.html`):**
   ```html
   <section class="panel" id="panel-sensorica-iot">
     <header class="panel-header"><h2>Sensores Ambientales IoT</h2></header>
     <div class="panel-cuerpo" id="contenedor-sensores"></div>
   </section>
   ```
4. **Paso 4: Registrar el Módulo en `src/js/app.js`:**
   Vincular el evento en la función `cambiarPanel(nombrePanel)`.
5. **Paso 5: Incluir el Script con Bypass de Caché en `index.html`:**
   ```html
   <script src="js/modulos/sensorica_iot.js?v=20261020_v1"></script>
   ```

---
"""
print("[+] Parte 04 enriquecida cargada exitosamente")
