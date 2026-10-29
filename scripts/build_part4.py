# -*- coding: utf-8 -*-
"""
scripts/build_part4.py
Genera scripts/manual_p04_frontend_cartografia.py
Capítulos 20 al 27: Arquitectura Frontend SPA, Motor Leaflet 1.9.4, Inspector Normativo PRC (CIN-VGI),
Los 7 Storyboards Barriales, Visor Lightbox Pop-Up HD, Topografía del Repositorio y Módulos 01 al 10.
"""

import os

BASE_DIR = "/Users/geojplescano/Programas/Práctica profesional 2026 S2/nodo-geoabierto"
OUTPUT_FILE = os.path.join(BASE_DIR, "scripts", "manual_p04_frontend_cartografia.py")

part4_text = r"""# PARTE IV: INGENIERÍA DE SOFTWARE, FRONTEND Y VISUALIZACIÓN INTERACTIVA

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

$$
\text{Si el número de intersecciones de un rayo horizontal con el perímetro es impar } \implies \text{Punto Interior}
$$

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

## 23. Los Siete Storyboards Cartográficos Barriales

El Atlas implementa una modalidad de divulgación territorial guiada denominada **Storyboards Cartográficos**. Cada storyboard es una secuencia analítica preconfigurada que sitúa al observador en un cuadrante específico, activa automáticamente las capas temáticas pertinentes, aplica filtros cromáticos y despliega una narrativa socio-espacial explicativa.

```text
┌────────────────────────────────────────────────────────────────────────┐
│             MATRIZ DE LOS 7 STORYBOARDS CARTOGRÁFICOS BARRIALES        │
├────────────────────────────────────────────────────────────────────────┤
│ • Storyboard 01: El Eje Fundacional y Plaza Brasil (Patrimonio y Ocio) │
│ • Storyboard 02: La Red Invisible de Cités y Pasajes (Densidad Oculta) │
│ • Storyboard 03: El Campus Central UAH y el Barrio Universitario      │
│ • Storyboard 04: Ciclovías, Conectividad y Barreras PMR                │
│ • Storyboard 05: Islas de Calor, Arbolado Urbano y Clima Local        │
│ • Storyboard 06: Comercio de Barrio, Ferias Libres y Economía Local    │
│ • Storyboard 07: Conflicto Normativo (PRC Santiago vs Zona Típica)     │
└────────────────────────────────────────────────────────────────────────┘
```

### 23.1. Storyboard 01: El Eje Fundacional y Plaza Brasil
- **Enfoque Espacial:** Plaza Brasil y entorno patrimonial inmediato (`[-33.4398, -70.6652]`, Zoom 17).
- **Capas Activadas:** `cat03_patrimonio_material`, `cat04_espacios_publicos`, `cat06_comercio_local`.
- **Narrativa Territorial:** Analiza la Plaza Brasil (inaugurada en 1900) como corazón verde y social del barrio, contrastando la arquitectura monumental de la Iglesia del Corazón de María con la vibrante oferta gastronómica y de ocio que floreció tras la declaratoria de Zona Típica en 1993.

### 23.2. Storyboard 02: La Red Invisible de Cités y Pasajes
- **Enfoque Espacial:** Eje calle Maturana y Pasaje Lucrecia Valdés (`[-33.4412, -70.6675]`, Zoom 18).
- **Capas Activadas:** `cat02_cites_vivienda`, `oficial_catastro_minvu_roles`, `cat10_seguridad_luminarias`.
- **Narrativa Territorial:** Revela la estructura habitacional microscópica de los más de 80 cités de Barrio Brasil. Muestra cómo tras una fachada continua de un solo rol predial fiscal, coexisten decenas de viviendas en pasajes peatonales comunitarios, visibilizando la precariedad de redes eléctricas y vías de evacuación.

### 23.3. Storyboard 03: El Campus Central UAH y el Barrio Universitario
- **Enfoque Espacial:** Manzana Cienfuegos, Erasmo Escala y Almirante Barroso (`[-33.4475, -70.6610]`, Zoom 17).
- **Capas Activadas:** `cat09_educacion_uah`, `cat07_movilidad_ciclovias`, `cat06_comercio_local`.
- **Narrativa Territorial:** Documenta el fenómeno de *estudiantización* impulsado por la Universidad Alberto Hurtado mediante el rescate y puesta en valor de más de 30 casonas patrimoniales. Analiza la demanda masiva de servicios estudiantiles, fotocopiadoras, librerías y alimentación económica.

### 23.4. Storyboard 04: Ciclovías, Conectividad y Barreras PMR
- **Enfoque Espacial:** Intersección Av. Brasil con Alameda y Línea 1 de Metro (`[-33.4490, -70.6640]`, Zoom 16).
- **Capas Activadas:** `cat07_movilidad_ciclovias`, `uoct_semaforos_santiago`, `barreras_pmr_veredas`.
- **Narrativa Territorial:** Diagnóstico de la movilidad activa y peatonal. Expone las discontinuidades de la ciclovía de Av. Brasil al llegar a la Alameda y mapea el 42% de esquinas que carecen de rampas rebajadas para sillas de ruedas conforme a la OGUC.

### 23.5. Storyboard 05: Islas de Calor, Arbolado Urbano y Clima Local
- **Enfoque Espacial:** Comparativa cuadrante Rosas/San Pablo vs Plaza Brasil (`[-33.4365, -70.6660]`, Zoom 16).
- **Capas Activadas:** `cat01_arbolado_urbano`, `temperatura_superficial_landsat`, `cat04_espacios_publicos`.
- **Narrativa Territorial:** Mapeo de la copa arbórea urbana e islas de calor. Demuestra que en las calles secundarias sin arbolado la temperatura superficial supera en hasta +5.8 °C el microclima generado por los plátanos orientales y jacarandás de Plaza Brasil.

### 23.6. Storyboard 06: Comercio de Barrio, Ferias Libres y Economía Local
- **Enfoque Espacial:** Eje calle Huérfanos y ferias barriales (`[-33.4410, -70.6630]`, Zoom 17).
- **Capas Activadas:** `cat06_comercio_local`, `ferias_libres_municipales`, `cat05_equipamiento_social`.
- **Narrativa Territorial:** Cartografía de la economía barrial de subsistencia y servicios tradicionales. Visibiliza talleres mecánicos, panaderías centenarias, almacenes de abarrotes y ferias libres que resisten a la homogeneización del retail corporativo.

### 23.7. Storyboard 07: Conflicto Normativo (PRC Santiago vs Zona Típica)
- **Enfoque Espacial:** Límite poniente de Ricardo Cumming y San Pablo (`[-33.4355, -70.6705]`, Zoom 16).
- **Capas Activadas:** `prc_zonificacion_santiago`, `cmn_zona_tipica_brasil`, `minvu_permisos_edificacion`.
- **Narrativa Territorial:** Contraste espacial entre el área protegida por el Decreto N° 432 del Consejo de Monumentos Nacionales (altura fija y conservación) y el borde libre del Plan Regulador Comunal de Santiago, donde proliferan torres habitacionales de hasta 22 pisos.

---

## 24. Visor Lightbox Pop-Up HD y Galería Multimedia

Para inspeccionar láminas cartográficas de ultra alta definición (4K a 300 DPI) y registros fotográficos patrimoniales sin pixelación, el sistema incorpora un visor modal interactivo con zoom suave por rueda de ratón y paneo bidireccional por arrastre (*drag*):

```javascript
// Implementación del Visor Lightbox HD en src/js/modulos/lightbox_hd.js
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
├── INFORME_PROYECTO_ATLAS_VGI.md           # Memoria descriptiva y estado de avance curricular
├── LICENSE                                 # Licencia tripartita (ODbL 1.0, CC BY-SA 4.0, AGPLv3)
├── MANUAL_ACTUALIZACION_ATLAS.md           # Este manual maestro (>5000 líneas) en la raíz
├── MANUAL_USO.md                           # Manual de usuario final para la interfaz web
├── PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md     # Protocolo de auditoría de pre-despliegue
├── README.md                               # Presentación del repositorio en GitHub
├── backend/                                # Definiciones de backend y esquemas SQL
│   ├── db/
│   │   ├── 01_schema_postgis.sql           # DDL PostgreSQL 17 + PostGIS 3.3
│   │   └── 02_seed_metadata.sql            # Siembra de metadatos de las capas oficiales
│   └── servidor_vgi.py                     # Servidor local de desarrollo en Python
├── config/                                 # Configuraciones globales desacopladas
│   └── config.json                         # Configuración JSON (BBox, endpoints, metadatos)
├── data/                                   # Almacén local de datos espaciales y extractos
│   ├── subdere_rsd_2024_rm/                # 14 capas del Catastro RSD SUBDERE 2024
│   ├── cache_consultas/                    # Respuestas cacheadas de Overpass y ohsome
│   └── *.geojson                           # Más de 200 archivos vectoriales GeoJSON
├── descargas/                              # Paquetes binarios para descarga pública
│   └── atlas_vgi_uah_base_datos_completa.zip # Paquete unificado de 543 MB (256 archivos)
├── docs/                                   # Documentación formal y entregables (espejo)
│   ├── ANALISIS_METACALIDAD.md             # Informe técnico de calidad ISO 19157 (95.41% IGV)
│   ├── ARQUITECTURA.md                     # Memoria de diseño de software
│   ├── BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md   # Catálogo de 125 fuentes bibliográficas APA 7ª ed.
│   ├── GUIA_BASE_DATOS_SUPABASE.md         # Manual de administración de PostGIS
│   ├── MANUAL_ACTUALIZACION_ATLAS.md       # Copia espejo del manual técnico maestro
│   ├── catalogo_fuentes_vgi.xlsx           # Matriz Excel de 131 fuentes
│   ├── categorias_tematicas_osm.xlsx       # Libro Excel de las 10 macrocategorías
│   └── geofabrik_rm_osm.gpkg              # GeoPackage SQLite multicapa OGC
├── netlify.toml                            # Configuración de compilación, headers y caché
├── scripts/                                # 62 scripts de automatización en Python
│   ├── descargar_todas_las_categorias_osm.py
│   ├── empaquetar_base_datos_completa.py
│   ├── modelo_indice_lineal_wlc.py
│   └── verificar_integridad_despliegue.py
└── src/                                    # Directorio raíz publicado en producción
    ├── index.html                          # Markup semántico de la SPA
    ├── css/estilos.css                     # Sistema de estilos y tokens :root
    ├── js/app.js                           # Orquestador central de la aplicación
    ├── js/modulos/                         # Módulos JS IIFE (mapa, osm, ohsome, etc.)
    ├── data/                               # Copia espejo de capas GeoJSON para Netlify
    └── docs/                               # Copia espejo de documentación y paquete ZIP
```

---

## 26. Desglose Quirúrgico de los 10 Módulos del Sistema (01 al 10)

La barra de navegación superior organiza las capacidades del Atlas en 10 módulos funcionales. Para garantizar la máxima comprensión de la ingeniería de software y el flujo de información de la plataforma, a continuación se desglosa cada módulo mediante su arquitectura de **PIPELINE (Input, Procesamiento y Output)**:

---

### Módulo 01: Visor Cartográfico y Atlas VGI (`src/js/app.js` y `src/js/modulos/mapa.js`)
* **Propósito Operativo:** Núcleo espacial interactivo; renderiza las 118 capas cartográficas; búsqueda en vivo; inspector normativo del PRC; medición métrica de distancias y polígonos.

```mermaid
flowchart LR
    subgraph IN_M1["1. INPUT"]
        GEOJSON["118 Capas GeoJSON (data/*.geojson)"]
        TILES["Mosaicos Base (OSM, Carto, Esri)"]
        CLIC["Clic del Usuario en el Mapa"]
    end

    subgraph PROC_M1["2. PIPELINE DE PROCESAMIENTO"]
        LOAD["Carga Asíncrona (Fetch API + IIFE)"]
        STYLE["Aplicación de Estilos CSS & L.divIcon"]
        RAY["Algoritmo Ray-Casting (Inspector PRC)"]
        MEASURE["Cálculo Geodésico de Distancias/Áreas"]
    end

    subgraph OUT_M1["3. OUTPUT"]
        MAP_VIEW["Lienzo Cartográfico Leaflet 1.9.4"]
        POPUPS["Popups con Atributos Normalizados ISO"]
        CIN["Certificado de Informaciones Normativas (CIN-VGI)"]
    end

    IN_M1 --> PROC_M1 --> OUT_M1
```

---

### Módulo 02: Consultas Overpass en Vivo (`src/js/modulos/osm.js`)
* **Propósito Operativo:** Interfaz de extracción en tiempo real hacia OpenStreetMap con lenguaje Overpass QL; selector de BBox y descarga GeoJSON directa.

```mermaid
flowchart LR
    subgraph IN_M2["1. INPUT"]
        BBOX_SEL["BBox Seleccionado (Barrio Brasil)"]
        QUERY_QL["Filtro Temático Overpass QL / Presets"]
        ENDPOINTS["Endpoints Espejo Overpass API"]
    end

    subgraph PROC_M2["2. PIPELINE DE PROCESAMIENTO"]
        FAILOVER["Algoritmo Round-Robin Failover (4 Espejos)"]
        OSM_JSON["Recepción de JSON OSM crudo (nodos/ways)"]
        OSMTOGEO["Conversión osm-to-geojson en Navegador"]
    end

    subgraph OUT_M2["3. OUTPUT"]
        CAPA_VIVA["Renderizado de Capa Temporal en Leaflet"]
        GEOJSON_DL["Descarga de Archivo GeoJSON del Usuario"]
        STATS_QL["Estadísticas de Entidades Obtenidas"]
    end

    IN_M2 --> PROC_M2 --> OUT_M2
```

---

### Módulo 03: Calidad & ICV ohsome API (`src/js/modulos/calidad.js`)
* **Propósito Operativo:** Auditoría histórica y temporal de aportes en OSM; densidad de nodos por km² y colaboradores únicos activos.

```mermaid
flowchart LR
    subgraph IN_M3["1. INPUT"]
        OHSOME_URL["Endpoint API v2 (api.ohsome.org)"]
        TIME_SERIES["Rango Temporal (2018 - 2026)"]
        POLY_BB["Polígono Delimitado Barrio Brasil"]
    end

    subgraph PROC_M3["2. PIPELINE DE PROCESAMIENTO"]
        FETCH_OH["Consulta Asíncrona a Endpoints HeiGIT"]
        METRICS_CALC["Cálculo de Densidad (entidades/km²)"]
        CHART_ENGINE["Generador de Series Temporales"]
    end

    subgraph OUT_M3["3. OUTPUT"]
        GRAF_HIST["Gráfico de Evolución de Mapeo Barrial"]
        METRICAS_ICV["Tablero de Completitud y Densidad VGI"]
        REPORT_OH["Auditoría Histórica de Edición OSM"]
    end

    IN_M3 --> PROC_M3 --> OUT_M3
```

---

### Módulo 04: Biodiversidad Urbana GBIF (`src/js/modulos/gbif.js`)
* **Propósito Operativo:** Registros biológicos georreferenciados bajo estándar Darwin Core; cruce con iNaturalist y filtros de incertidumbre métrica.

```mermaid
flowchart LR
    subgraph IN_M4["1. INPUT"]
        GBIF_API["GBIF Occurrence API (api.gbif.org/v1)"]
        WKT_POLY["Filtro Geométrico WKT de Barrio Brasil"]
        TAXON_FILTER["Filtros Taxonómicos (Plantae, Aves, Insecta)"]
    end

    subgraph PROC_M4["2. PIPELINE DE PROCESAMIENTO"]
        DWC_PARSE["Normalización Darwin Core (DwC)"]
        UNCERT_FLT["Filtro de Incertidumbre Espacial (<50m)"]
        CLUSTER_GEO["Agrupamiento de Observaciones Biológicas"]
    end

    subgraph OUT_M4["3. OUTPUT"]
        LAYER_GBIF["Capa Cartográfica de Especies Urbanas"]
        TAXON_CARD["Fichas Taxonómicas con Fotografías"]
        CSV_GBIF["Exportación de Registros de Biodiversidad"]
    end

    IN_M4 --> PROC_M4 --> OUT_M4
```

---

### Módulo 05: Cartografía UMap (`src/js/modulos/umap.js`)
* **Propósito Operativo:** Embebido seguro de proyectos colaborativos externos mediante iframes aislados con sandboxing.

```mermaid
flowchart LR
    subgraph IN_M5["1. INPUT"]
        UMAP_URL["URL de Mapas UMap Comunitarios"]
        CONFIG_EMBED["Parámetros de Visualización y Controles"]
    end

    subgraph PROC_M5["2. PIPELINE DE PROCESAMIENTO"]
        SANDBOX["Aislamiento Sandbox de iframe (allow-scripts)"]
        CORS_GUARD["Validación de Origen Seguro HTTPS"]
        RESIZE_OBS["Ajuste Responsivo Automático de Lienzo"]
    end

    subgraph OUT_M5["3. OUTPUT"]
        PANEL_UMAP["Lienzo Interactivo de Mapeo Ciudadano"]
        MAP_COLLAB["Integración de Proyectos Participativos"]
    end

    IN_M5 --> PROC_M5 --> OUT_M5
```

---

### Módulo 06: Metadatos Estandarizados ISO 19115/19139 (`src/js/modulos/metadatos.js`)
* **Propósito Operativo:** Generador y exportador formal de fichas de metadatos en formatos JSON y XML para GeoNetwork e IDE Chile.

```mermaid
flowchart LR
    subgraph IN_M6["1. INPUT"]
        ID_CAPA["Identificador de Capa Seleccionada"]
        REGISTRO_JSON["Metadatos Básicos (Fuente, Fecha, BBox)"]
        SCHEMA_ISO["Esquema Perfil Nacional IDE Chile SNIT"]
    end

    subgraph PROC_M6["2. PIPELINE DE PROCESAMIENTO"]
        BUILD_XML["Motor DOMParser y Serialización XML ISO 19139"]
        BUILD_JSON["Generación de Estructura JSON-LD GeoNetwork"]
        VALID_ISO["Validación de Conformidad ISO 19115-1:2014"]
    end

    subgraph OUT_M6["3. OUTPUT"]
        VIEWER_META["Ficha Técnica Interactiva en la Interfaz"]
        XML_FILE["Descarga de Archivo XML ISO 19139 Estructurado"]
        JSON_FILE["Descarga de Ficha en Formato JSON"]
    end

    IN_M6 --> PROC_M6 --> OUT_M6
```

---

### Módulo 07: Diccionario Territorial (`src/js/modulos/diccionario.js`)
* **Propósito Operativo:** Repositorio conceptual interactivo con descriptores que homologan la OGUC y el PRC con etiquetas OSM.

```mermaid
flowchart LR
    subgraph IN_M7["1. INPUT"]
        GLOSARIO_JSON["Base de 140 Descriptores Urbanísticos"]
        SEARCH_KEY["Término de Búsqueda del Usuario"]
        FILTRO_TIPO["Filtro por Categoría (Normativa / OSM)"]
    end

    subgraph PROC_M7["2. PIPELINE DE PROCESAMIENTO"]
        INDEX_TEXT["Búsqueda Textual Inmediata Client-Side"]
        HOMOLOGA["Cruce de Códigos OGUC vs Tags de OpenStreetMap"]
        LINK_CAPA["Vinculación con Capas Cartográficas del Atlas"]
    end

    subgraph OUT_M7["3. OUTPUT"]
        CARD_DESCRIP["Tarjetas Conceptuales con Ejemplos Barriales"]
        HIGHLIGHT["Botón para Resaltar Capas Asociadas en el Mapa"]
    end

    IN_M7 --> PROC_M7 --> OUT_M7
```

---

### Módulo 08: Licencias y Catálogos (`src/js/modulos/licencias.js`)
* **Propósito Operativo:** Gobernanza legal tripartita (ODbL, CC BY-SA, AGPLv3) y descarga de libros Excel (.xlsx) y archivos CSV.

```mermaid
flowchart LR
    subgraph IN_M8["1. INPUT"]
        CAT_XLSX["4 Libros Maestros OpenXML (.xlsx)"]
        CSV_FILES["Archivos Consolidados Tabulares CSV"]
        ZIP_MASTER["Paquete Completo geodatabase_completa.zip"]
    end

    subgraph PROC_M8["2. PIPELINE DE PROCESAMIENTO"]
        INTEG_CHECK["Validación de Integridad y Tamaño de Archivos"]
        LIC_MATRIX["Matriz de Compatibilidad Legal de Licencias"]
        DIRECT_DL["Gestión de Descargas Directas Asíncronas"]
    end

    subgraph OUT_M8["3. OUTPUT"]
        TAB_LEGAL["Cuadro de Gobernanza y Términos de Uso"]
        DOWNLOADS["Descarga de Catálogos XLSX, CSV y ZIP (543 MB)"]
    end

    IN_M8 --> PROC_M8 --> OUT_M8
```

---

### Módulo 09: Indicadores de Análisis y Storyboards (`src/js/modulos/storyboards.js`)
* **Propósito Operativo:** 7 narrativas espaciales situadas y acceso al Visor Lightbox Pop-Up HD.

```mermaid
flowchart LR
    subgraph IN_M9["1. INPUT"]
        STORY_ID["Selección de Storyboard Temático (01 al 07)"]
        COORD_VIEW["Coordenadas de Enfoque y Zoom Predefinidos"]
        CAPAS_REQ["Listado de Capas Requeridas por la Narrativa"]
    end

    subgraph PROC_M9["2. PIPELINE DE PROCESAMIENTO"]
        FLY_TO["Transición Suave de Cámara (map.flyTo)"]
        AUTO_LAYER["Activación/Desactivación Automática de Capas"]
        PANEL_TEXT["Carga de Narrativa Socio-Espacial y Fotografía"]
    end

    subgraph OUT_M9["3. OUTPUT"]
        SCENE_VIEW["Escenario Cartográfico Enfocado y Tematizado"]
        LIGHTBOX["Visor Multimedia Pop-Up HD para Fotografías"]
    end

    IN_M9 --> PROC_M9 --> OUT_M9
```

---

### Módulo 10: Manual de Uso y Metodología (`src/js/modulos/manual.js`)
* **Propósito Operativo:** Visualizador integrado de la documentación técnica y operativa sin requerir apertura de archivos externos.

```mermaid
flowchart LR
    subgraph IN_M10["1. INPUT"]
        DOC_MD["MANUAL_ACTUALIZACION_ATLAS.md (+5000 Líneas)"]
        USER_ROLE["Rol de Usuario Activo (#sel-perfil-usuario)"]
        TOC_NAV["Índice de Navegación de Capítulos"]
    end

    subgraph PROC_M10["2. PIPELINE DE PROCESAMIENTO"]
        FETCH_MD["Descarga del Documento Markdown desde CDN"]
        MD_RENDER["Compilación y Renderizado HTML en Tiempo Real"]
        SCROLL_SYNC["Sincronización de Anclas y Resaltado de Código"]
    end

    subgraph OUT_M10["3. OUTPUT"]
        DOC_VIEW["Lector de Documentación Integrado en Pantalla"]
        CODE_SNIP["Bloques de Código y Diagramas Técnicos Legibles"]
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

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("# -*- coding: utf-8 -*-\n")
    f.write('PARTE_04 = r"""' + part4_text + '"""\n')
    f.write('print("[+] Parte 04 enriquecida cargada exitosamente")\n')

print("[+] scripts/build_part4.py ejecutado correctamente.")
