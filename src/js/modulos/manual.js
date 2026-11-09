/*
  manual.js
  ---------
  Módulo 03: Manual del Sistema y Actualización Técnica del Atlas para la Gestión Territorial (Prototipo 02).
  Redactado en tercera persona con formato de artículo metodológico y reporte técnico.

  Integra:
  - Parte I: Manual de Uso del Atlas (Fundamentación, arquitectura de 3 Módulos: Módulo 01 Análisis Territorial y Narrativas Espaciales,
    Módulo 02 Explorar Mapa con Leaflet/ICV Dinámico/Inspector Normativo PRC-OGUC/Consultas OSM-GBIF-uMap,
    Módulo 03 Documentación, Diccionario 133 capas, Catálogo ISO 19115, Calidad ISO 19157 y Licencias).
  - Parte II: Manual de Actualización y Mantención Técnica (Principios de ingeniería, arquitectura de Prototipo 02,
    sincronización simétrica data/ y src/data/, base dual .geojson + .gpkg, protocolo de 6 etapas para integración de coberturas,
    mantención de Narrativas Espaciales y Dimensiones Analíticas, validación final pre-despliegue y marco legal).
*/

const ModuloManual = (() => {

  let modoManualActivo = 'todos'; // 'todos' | 'uso' | 'actualizacion'

  /**
   * Construye dinámicamente el inventario de las 133 capas (123 Oficiales + 10 VGI)
   * directamente desde las configuraciones activas del sistema.
   */
  function construirInventarioDinamicoCapas() {
    const lista = [];

    // 1. 10 Categorías VGI desde NODO_CONFIG
    const catsVGI = (typeof window !== 'undefined' && window.NODO_CONFIG && Array.isArray(window.NODO_CONFIG.categorias_osm))
      ? window.NODO_CONFIG.categorias_osm
      : [];

    catsVGI.forEach((cat, idx) => {
      lista.push({
        num: `VGI-${String(idx + 1).padStart(2, '0')}`,
        id: cat.id,
        nombre: cat.nombre,
        institucion: 'OpenStreetMap / GBIF (VGI)',
        tipo: 'Colaborativa VGI',
        geometria: Array.isArray(cat.geometrias) ? cat.geometrias[0] : 'Vectorial',
        archivo: `data/capa_${cat.id}.geojson`,
        descripcion: cat.descripcion || 'Cobertura temática colaborativa.'
      });
    });

    // 2. 123 Capas Oficiales desde ModuloIDEChile
    let mapaOficiales = {};
    if (typeof window !== 'undefined' && window.ModuloIDEChile) {
      if (typeof window.ModuloIDEChile.obtenerCatalogoCapas === 'function') {
        try {
          mapaOficiales = window.ModuloIDEChile.obtenerCatalogoCapas() || {};
        } catch (e) {
          console.warn('ModuloManual: Error leyendo obtenerCatalogoCapas()', e);
        }
      } else if (window.ModuloIDEChile.CAPAS_OFICIALES) {
        mapaOficiales = window.ModuloIDEChile.CAPAS_OFICIALES;
      }
    }

    Object.values(mapaOficiales).forEach((capa, idx) => {
      const codigo = capa.num_bbdd
        ? `BBDD-${String(capa.num_bbdd).padStart(2, '0')}`
        : `OF-${String(idx + 1).padStart(2, '0')}`;
      lista.push({
        num: codigo,
        id: capa.id,
        nombre: capa.nombre || capa.id,
        institucion: capa.institucion || 'Estado de Chile (IDE)',
        tipo: 'Oficial Estado',
        geometria: capa.geometria || 'Vectorial',
        archivo: capa.archivoLocal || `data/${capa.id}.geojson`,
        descripcion: capa.descripcion || 'Cobertura oficial del catálogo territorial.'
      });
    });

    return lista;
  }

  /**
   * Define los capítulos técnicos del Manual (Parte I: Uso + Parte II: Actualización)
   */
  function obtenerCapitulosManual() {
    const inventarioCapas = construirInventarioDinamicoCapas();
    const totalCapas = inventarioCapas.length || 133;

    const filasTablaCapas = inventarioCapas.map(c => {
      const colorBadge = c.tipo === 'Colaborativa VGI'
        ? 'background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.35);'
        : 'background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.35);';
      return `
        <tr class="fila-catalogo-manual" data-busqueda="${(c.num + ' ' + c.id + ' ' + c.nombre + ' ' + c.institucion + ' ' + c.descripcion).toLowerCase()}">
          <td style="font-family:monospace; font-weight:700; color:#f59e0b; white-space:nowrap;">${c.num}</td>
          <td><strong>${c.nombre}</strong><br><code style="font-size:0.74rem; color:var(--tinta-tenue);">${c.archivo}</code></td>
          <td><span style="padding:2px 8px; border-radius:99px; font-size:0.74rem; font-weight:700; white-space:nowrap; ${colorBadge}">${c.tipo}</span></td>
          <td style="font-size:0.84rem;">${c.institucion}</td>
          <td style="font-size:0.82rem; color:var(--tinta-suave);">${c.descripcion}</td>
        </tr>
      `;
    }).join('');

    return [
      // =======================================================================
      // PARTE I: MANUAL DE USO DEL ATLAS (PROTOTIPO 02)
      // =======================================================================
      {
        id: 'cap-uso-01',
        parte: 'uso',
        numero: 'USO · 01',
        icono: '🏛️',
        titulo: 'Fundamentación, Objetivos y Cifras Clave del Atlas (Prototipo 02)',
        subtitulo: 'Marco epistemológico, objetivos estratégicos y magnitudes cuantitativas del Atlas para la Gestión Territorial.',
        html: `
          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px; margin-bottom:16px;">
            <h4 style="margin:0 0 8px 0; color:#38bdf8;">Objetivo general</h4>
            <p style="font-size:0.94rem; line-height:1.7; color:var(--tinta-suave); margin:0 0 14px 0;">
              Desarrollar un atlas territorial reproducible, interoperable y centrado en la toma de decisiones espaciales, que integre geodatos abiertos oficiales del Estado de Chile, información geográfica voluntaria (VGI) y herramientas analíticas multicriterio para subsanar vacíos de información, visibilizar patrones socioterritoriales y apoyar la gestión local en el Municipio de Santiago y el Barrio Brasil.
            </p>
            <h4 style="margin:0 0 8px 0; color:#34d399;">Objetivos específicos</h4>
            <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.9rem; line-height:1.65;">
              <li><strong>OE 1.</strong> Caracterizar la disponibilidad, la cobertura y los vacíos de información geográfica del área de estudio, definiendo una taxonomía espacial estandarizada que armonice fuentes comunitarias e institucionales.</li>
              <li><strong>OE 2.</strong> Consolidar una geodatabase comunitaria y municipal multipropósito bajo estándares internacionales de calidad (ISO 19157) y catalogación de metadatos (ISO 19115 / Perfil Nacional de Chile).</li>
              <li><strong>OE 3.</strong> Implementar el <strong>Prototipo 02</strong>: un geoportal interactivo estructurado en tres componentes operacionales (Módulo 01 Análisis, Módulo 02 Explorar Mapa y Módulo 03 Documentación).</li>
              <li><strong>OE 4.</strong> Evaluar la usabilidad y la pertinencia de la plataforma con actores territoriales, garantizando su total auditabilidad, trazabilidad técnica y continuidad operativa.</li>
            </ul>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:14px; margin:16px 0;">
            <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#38bdf8;">133 capas operativas</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                123 coberturas oficiales del Estado de Chile y 10 macrocategorías de información geográfica voluntaria (OpenStreetMap y GBIF).
              </div>
            </div>
            <div style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#c084fc;">83 cartografías analíticas</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                Estructuradas en 4 narrativas espaciales temáticas (KDE, LISA, Sociodemografía y Metabolismo Urbano).
              </div>
            </div>
            <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#fbbf24;">IGV: 95,4 % | IGMC: 96,55 %</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                <strong>IGV (95,4 %):</strong> calidad espacial ISO 19157 (90 A+ y 43 A). <strong>IGMC (96,55 %):</strong> completitud de metadatos ISO 19115.
              </div>
            </div>
            <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#34d399;">79.841 entidades / 112.264 nodos</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                Geodatabase comunitaria analizada en malla regular de 20 m sobre 1.711 manzanas censales de Santiago Centro.
              </div>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.4); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; margin-top:16px;">
            <h4 style="margin:0 0 10px 0; color:#ffffff; font-size:0.95rem;">🧭 Navegación Táctica Interactiva por la Plataforma (Prototipo 02)</h4>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.82rem; padding:7px 12px;">📊 Módulo 01 · Análisis Territorial</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.82rem; padding:7px 12px;">🗺️ Módulo 02 · Explorar Mapa</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('explorador-osm')" style="font-size:0.82rem; padding:7px 12px;">🔍 Consultar OpenStreetMap</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('biodiversidad-gbif')" style="font-size:0.82rem; padding:7px 12px;">🌿 Biodiversidad GBIF</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('proyectos-umap')" style="font-size:0.82rem; padding:7px 12px;">📍 Cartografía uMap</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('diccionario')" style="font-size:0.82rem; padding:7px 12px;">🗂️ Diccionario (133 Capas)</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('metadatos-iso')" style="font-size:0.82rem; padding:7px 12px;">🏛️ Generador Metadatos ISO 19115</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('calidad-ohsome')" style="font-size:0.82rem; padding:7px 12px;">🧪 Calidad Espacial ISO 19157</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('licencias')" style="font-size:0.82rem; padding:7px 12px;">⚖️ Licencias y Marco Legal</button>
              <button type="button" class="accion" onclick="document.getElementById('btn-abrir-modal-descarga-bd').click()" style="font-size:0.82rem; padding:7px 12px; background:linear-gradient(135deg, #10b981, #059669); color:#ffffff;">📦 Descarga BBDD (.zip)</button>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-02',
        parte: 'uso',
        numero: 'USO · 02',
        icono: '📊',
        titulo: 'Operación del Módulo 01: Análisis Territorial y Narrativas Espaciales',
        subtitulo: 'Síntesis territorial elaborada a partir de 83 cartografías temáticas y las 5 Dimensiones Analíticas.',
        html: `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                <h4 style="margin:0; color:#38bdf8; font-size:1.05rem;">1. Narrativas Espaciales Basadas en Datos</h4>
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.8rem; padding:6px 12px;">Ver en Módulo 01 ↗</button>
              </div>
              <p style="margin:0 0 12px 0; color:var(--tinta-suave); font-size:0.9rem; line-height:1.65;">
                Las <strong>Narrativas Espaciales Basadas en Datos</strong> constituyen la síntesis territorial del Atlas, elaborada a partir de <strong>83 cartografías temáticas</strong> que representan patrones de concentración, segregación espacial, estructura demográfica, habitabilidad, movilidad y metabolismo urbano en la Comuna de Santiago y el Barrio Brasil. Se presentan organizadas en 4 láminas temáticas interactivas:
              </p>

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(310px, 1fr)); gap:12px; margin-top:10px;">
                <!-- Lámina 1 -->
                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#38bdf8; text-transform:uppercase;">Lámina 01 · Densidad Continua</span>
                    <h5 style="margin:4px 0 6px 0; font-size:0.95rem; color:#ffffff;">Concentración Territorial de Actividad IGV en Santiago:</h5>
                    <p style="font-size:0.83rem; color:var(--tinta-suave); line-height:1.55; margin:0;">
                      Análisis espacial de las 14 cartografís de densidad continua (KDE) sobre la geodatabase comunitaria consolidada del Atlas IGV (79.841 entidades geométricas directas y 112.264 nodos muestreados en malla regular de 20 m), la red de semáforos UOCT y las dinámicas oficiales de Permisos de Edificación y Certificados de Recepción Final (CRF). Polarización entre la concentración del eje Alameda, Barrio Brasil, Santa Ana, Parque Almagro y Ejército frente a los vacíos en el arco periférico sur y suroriente de la comuna (Bogotá, Sierra Bella, Matta Sur, Diez de Julio y San Vicente).
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-densidad-kernel-kde')" style="margin-top:10px; font-size:0.78rem; padding:6px 10px;">Abrir Lámina 1 (KDE) ↗</button>
                </div>

                <!-- Lámina 2 -->
                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#fbbf24; text-transform:uppercase;">Lámina 02 · Autocorrelación Espacial</span>
                    <h5 style="margin:4px 0 6px 0; font-size:0.95rem; color:#ffffff;">Segregación Espacial, Hotspots y Áreas de Rezago en Santiago:</h5>
                    <p style="font-size:0.83rem; color:var(--tinta-suave); line-height:1.55; margin:0;">
                      Análisis espacial de las 11 cartografías de autocorrelación espacial local (Anselin, 1995) sobre las 1.711 manzanas censales (unidades territoriales básicas del INE) de Santiago: dónde se agrupan estadísticamente los núcleos Alto-Alto (HH), qué barrios conforman bolsones Bajo-Bajo (LL) y cómo la cobertura colaborativa exhibe un desajuste inverso frente a la densidad residencial comunal..
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-autocorrelacion-lisa')" style="margin-top:10px; font-size:0.78rem; padding:6px 10px;">Abrir Lámina 2 (LISA) ↗</button>
                </div>

                <!-- Lámina 3 -->
                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(168,85,247,0.3); border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#c084fc; text-transform:uppercase;">Lámina 03 · Demografía y Vivienda</span>
                    <h5 style="margin:4px 0 6px 0; font-size:0.95rem; color:#ffffff;">Estructura Sociodemográfica, Habitabilidad y Morfología Urbana en Santiago:</h5>
                    <p style="font-size:0.83rem; color:var(--tinta-suave); line-height:1.55; margin:0;">
                      Análisis espacial de las 34 cartografías sociodemográficas, habitacionales y de morfología predial de la comuna: dónde se concentran los 432.081 habitantes, la hegemonía del departamento (92,7%) y del arriendo (72,1%), las alturas autorizadas de edificación, el Coeficiente de Ocupación del Suelo (COS medio de 0,47) en conjuntos habitacionales con Certificados de Recepción Final (CRF), la persistencia de cités en el sur y la conservación en Barrio Brasil y Yungay.
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-demografia-habitabilidad-sociourbana')" style="margin-top:10px; font-size:0.78rem; padding:6px 10px;">Abrir Lámina 3 (Demografía) ↗</button>
                </div>

                <!-- Lámina 4 -->
                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(52,211,153,0.3); border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#34d399; text-transform:uppercase;">Lámina 04 · Medio Ambiente y Servicios</span>
                    <h5 style="margin:4px 0 6px 0; font-size:0.95rem; color:#ffffff;">Metabolismo Urbano de Santiago:</h5>
                    <p style="font-size:0.83rem; color:var(--tinta-suave); line-height:1.55; margin:0;">
                      Análisis espacial de las 24 cartografías socioambientales y operativas: el 84,6% de viajes en modos sustentables, las brechas de distancia a áreas verdes y salud en el borde sur, la exposición a ruido (>68 dBA) en corredores viales y la asimetría de contenedores entre las 5 zonas de aseo municipal.
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-socioambiental-movilidad-servicios')" style="margin-top:10px; font-size:0.78rem; padding:6px 10px;">Abrir Lámina 4 (Metabolismo) ↗</button>
                </div>
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#34d399; font-size:1.05rem;">2. Dimensiones Analíticas</h4>
              <p style="margin:0 0 10px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Posterior a las láminas del Atlas, el Módulo 01 articula las 133 coberturas en <strong>5 Dimensiones Analíticas</strong> estructuradas según el modelo territorial comunal:
              </p>
              <ul style="margin:0 0 14px 0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                <li><strong>Dimensión 01 · Demográfica y Habitacional (34 capas):</strong> Dinámica poblacional del Censo 2024, vulnerabilidad social (RSH), tipologías de vivienda, hacinamiento, arriendo y permisos/recepciones habitacionales del INE.</li>
                <li><strong>Dimensión 02 · Equipamiento y Espacio Público (28 capas):</strong> Red comunitaria de salud, educación, comercio, cultura, plazas y parques urbanos catastrados colaborativamente y validados por el SNIT.</li>
                <li><strong>Dimensión 03 · Movilidad y Accesibilidad (26 capas):</strong> Cobertura de Metro de Santiago, paradas RED Movilidad, ciclovías, flujos peatonales y red de semáforos UOCT.</li>
                <li><strong>Dimensión 04 · Medio Ambiente y Riesgo (24 capas):</strong> Contaminación acústica, arbolado georreferenciado, áreas verdes por habitante, microbasurales y zonas de inundación/sismicidad.</li>
                <li><strong>Dimensión 05 · Normativa y Gestión Urbana (21 capas):</strong> Zonificación del Plan Regulador Comunal (PRC Santiago), zonas de conservación histórica (ZCH), alturas permitidas, COS y dinámica histórica de la DOM.</li>
              </ul>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.82rem; padding:8px 14px;">📊 Explorar Dimensiones Analíticas en Módulo 01 ↗</button>
                <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('diccionario')" style="font-size:0.82rem; padding:8px 14px;">🗂️ Ver Coberturas en Diccionario de Datos ↗</button>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-03',
        parte: 'uso',
        numero: 'USO · 03',
        icono: '🗺️',
        titulo: 'Operación del Módulo 02: Explorar Mapa (Visor Cartográfico y Consultas)',
        subtitulo: 'Visor geoespacial Leaflet (133 capas), ICV dinámico, Inspector Normativo PRC/OGUC y consultas especializadas.',
        html: `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:15px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
                <h4 style="margin:0; color:#38bdf8;">1. Visor Territorial Leaflet y Control de Coberturas</h4>
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.8rem; padding:6px 12px;">Abrir Visor (Módulo 02) ↗</button>
              </div>
              <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                <li><strong>Encuadre territorial:</strong> Permite alternar entre el polígono completo de la <em>Comuna de Santiago / Barrio Brasil</em> (223,75 ha), el <em>Sector Patrimonial</em> (136,10 ha) o trazar un rectángulo personalizado mediante <strong>⛶ Dibujar Bbox</strong> (con cálculo métrico en m² y hectáreas reproyectado al vuelo a <code>EPSG:32719</code>).</li>
                <li><strong>Superposición multicapa:</strong> El panel <strong>🏛 Capas IDE</strong> y los selectores VGI permiten superponer hasta 4 capas simultáneamente preservando la legibilidad cartográfica gracias al control de opacidad dinámico.</li>
                <li><strong>Inspección puntual:</strong> Al hacer clic sobre cualquier elemento geométrico, el sistema despliega su ficha de atributos normalizada, su custodio institucional y el enlace de descarga individual en <code>GeoJSON</code>.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:15px;">
              <h4 style="margin:0 0 6px 0; color:#34d399;">2. Índice de Calidad VGI (ICV) Dinámico</h4>
              <p style="margin:0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                El visor computa en tiempo real el Índice de Calidad VGI de las capas activas a través de 3 parámetros normalizados:
              </p>
              <ul style="margin:6px 0 0 0; padding-left:20px; color:var(--tinta-suave); font-size:0.87rem; line-height:1.6;">
                <li><strong>Completitud Espacial:</strong> Ratio de entidades activas con geometría topológica válida y campos atributivos completos.</li>
                <li><strong>Actualidad Reciente:</strong> Fecha más reciente identificada en los metadatos y etiquetas cronológicas de las capas activas.</li>
                <li><strong>Atribución Institucional:</strong> Proporción de registros con custodia institucional verificada y licencia compatible.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(245,158,11,0.4); border-radius:10px; padding:15px;">
              <h4 style="margin:0 0 6px 0; color:#fbbf24;">3. Inspector Normativo PRC/OGUC y Certificado CIN-VGI</h4>
              <p style="margin:0 0 8px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Al activar <strong>⚖ Inspector Normativo</strong> y hacer clic en cualquier punto del territorio comunal, el sistema ejecuta una intersección espacial geodésica y genera el <strong>Certificado de Informaciones Normativas VGI (CIN-VGI)</strong>:
              </p>
              <ul style="margin:0 0 10px 0; padding-left:20px; color:var(--tinta-suave); font-size:0.87rem; line-height:1.6;">
                <li>Evalúa la zonificación del PRC Santiago y PRMS, determinando usos permitidos y prohibidos bajo el principio de exclusión negativa del <strong>Art. 2.1.24 OGUC</strong>.</li>
                <li>Detecta restricciones por riesgo (Art. 2.1.17 OGUC) y protecciones patrimoniales (Zonas Típicas, ZCH, ICH y Monumentos Nacionales).</li>
                <li>Cruza la dinámica edificatoria oficial: permisos de edificación DOM (2010–2025) y recepciones finales CRF (2011–2025 del INE), reportando Densidad Neta Real (viv/ha), Coeficiente de Ocupación del Suelo (COS) y Porcentaje de Suelo Libre.</li>
              </ul>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.8rem; padding:6px 12px;">Probar Inspector Normativo en el Mapa ↗</button>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:15px;">
              <h4 style="margin:0 0 10px 0; color:#c084fc;">4. Submódulos de Consulta Especializada</h4>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:10px;">
                <div style="background:rgba(2,6,23,0.5); border:1px solid var(--linea-tarjeta); border-radius:8px; padding:12px;">
                  <span style="font-size:0.72rem; font-weight:800; color:#38bdf8;">CONSULTA 01 · OVERPASS API</span>
                  <h5 style="margin:4px 0 4px 0;">OpenStreetMap &amp; TagInfo</h5>
                  <p style="font-size:0.82rem; color:var(--tinta-suave); margin:0 0 8px 0;">Consultas Overpass QL en tiempo real con filtrado por etiquetas, tipos de entidades (nwr) y descarga en GeoJSON.</p>
                  <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('explorador-osm')" style="font-size:0.76rem; padding:5px 10px;">Consultar OSM ↗</button>
                </div>
                <div style="background:rgba(2,6,23,0.5); border:1px solid var(--linea-tarjeta); border-radius:8px; padding:12px;">
                  <span style="font-size:0.72rem; font-weight:800; color:#34d399;">CONSULTA 02 · BIODIVERSIDAD</span>
                  <h5 style="margin:4px 0 4px 0;">GBIF Comunidad</h5>
                  <p style="font-size:0.82rem; color:var(--tinta-suave); margin:0 0 8px 0;">Registros biológicos georreferenciados (aves, flora urbana, insectos) documentados por ciudadanos en el polígono barrial.</p>
                  <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('biodiversidad-gbif')" style="font-size:0.76rem; padding:5px 10px;">Explorar GBIF ↗</button>
                </div>
                <div style="background:rgba(2,6,23,0.5); border:1px solid var(--linea-tarjeta); border-radius:8px; padding:12px;">
                  <span style="font-size:0.72rem; font-weight:800; color:#fbbf24;">CONSULTA 03 · COLABORACIÓN</span>
                  <h5 style="margin:4px 0 4px 0;">Proyectos uMap</h5>
                  <p style="font-size:0.82rem; color:var(--tinta-suave); margin:0 0 8px 0;">Acceso a iniciativas de mapeo colectivo, patrimonio barrial y cartografía comunitaria publicadas en uMap.</p>
                  <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('proyectos-umap')" style="font-size:0.76rem; padding:5px 10px;">Ver uMap ↗</button>
                </div>
                <div style="background:rgba(2,6,23,0.5); border:1px solid var(--linea-tarjeta); border-radius:8px; padding:12px;">
                  <span style="font-size:0.72rem; font-weight:800; color:#a855f7;">CONSULTA 04 · HISTÓRICA</span>
                  <h5 style="margin:4px 0 4px 0;">ohsome API</h5>
                  <p style="font-size:0.82rem; color:var(--tinta-suave); margin:0 0 8px 0;">Series temporales de evolución del arbolado, equipamientos y edificios desde 2007 hasta 2025.</p>
                  <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('calidad-ohsome')" style="font-size:0.76rem; padding:5px 10px;">Analizar con ohsome ↗</button>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-04',
        parte: 'uso',
        numero: 'USO · 04',
        icono: '📚',
        titulo: 'Operación del Módulo 03: Documentación, Metadatos y Estándares de Calidad',
        subtitulo: 'Catálogo de metadatos ISO 19115, calidad ISO 19157, diccionario ISO 19110 y licencias abiertas.',
        html: `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <p style="margin:0; font-size:0.9rem; color:var(--tinta-suave); line-height:1.65;">
              El <strong>Módulo 03 · Documentación</strong> garantiza la certeza técnica, metodológica y jurídica del Atlas, integrando herramientas especializadas de metadatos, evaluación de calidad y descarga de datos:
            </p>

            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(290px, 1fr)); gap:12px;">
              <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <span style="font-size:0.74rem; font-weight:800; color:#38bdf8;">CATÁLOGO SEMÁNTICO</span>
                  <h4 style="margin:4px 0 6px 0;">Diccionario de datos (133 Capas / 140 Descriptores)</h4>
                  <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Catálogo de objetos y atributos conforme a ISO 19110, homologación semántica con IDE Chile y categorización temática exhaustiva.</p>
                </div>
                <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('diccionario')" style="margin-top:10px; font-size:0.8rem;">Abrir Diccionario de datos ↗</button>
              </div>

              <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <span style="font-size:0.74rem; font-weight:800; color:#fbbf24;">METADATOS INTEROPERABLES</span>
                  <h4 style="margin:4px 0 6px 0;">Catálogo y generador de metadatos (ISO 19115)</h4>
                  <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Generador de metadatos bajo el Perfil Nacional de Chile (IDE Chile - SNIT). Edición editable en vivo de los 10 campos núcleo mínimos y exportación en JSON y XML (ISO 19139).</p>
                </div>
                <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('metadatos-iso')" style="margin-top:10px; font-size:0.8rem;">Abrir Generador de metadatos ↗</button>
              </div>

              <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <span style="font-size:0.74rem; font-weight:800; color:#34d399;">CALIDAD ESPACIAL</span>
                  <h4 style="margin:4px 0 6px 0;">Calidad &amp; ICV (ISO 19157 / WLC v2.0)</h4>
                  <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Evaluación multicriterio de las 133 capas según ISO 19157 (completitud, exactitud posicional y temática), series históricas ohsome y auditoría comunitaria.</p>
                </div>
                <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('calidad-ohsome')" style="margin-top:10px; font-size:0.8rem;">Abrir Evaluador de calidad ↗</button>
              </div>

              <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <span style="font-size:0.74rem; font-weight:800; color:#c084fc;">RÉGIMEN JURÍDICO</span>
                  <h4 style="margin:4px 0 6px 0;">Licencias y descargas (.xlsx / ZIP)</h4>
                  <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Marco jurídico de datos abiertos (ODbL 1.0, CC BY-SA 4.0, Ley N° 20.285 de Transparencia, Ley N° 19.628 de Protección de Datos) y catálogos en Excel.</p>
                </div>
                <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('licencias')" style="margin-top:10px; font-size:0.8rem;">Abrir Licencias y descargas ↗</button>
              </div>

              <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.35); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <span style="font-size:0.74rem; font-weight:800; color:#34d399;">ACCESO ABIERTO // DESCARGA INTEGRAL</span>
                  <h4 style="margin:4px 0 6px 0;">Geodatabase Completa del Atlas (.zip)</h4>
                  <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Descarga en un clic del paquete completo de capas en formato dual (GeoJSON + GeoPackage) junto con las fichas de metadatos estandarizadas.</p>
                </div>
                <button type="button" class="accion" onclick="document.getElementById('btn-abrir-modal-descarga-bd').click()" style="margin-top:10px; font-size:0.8rem; background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; font-weight:700;">📦 Descargar BBDD Completa (.zip) ↗</button>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-05',
        parte: 'uso',
        numero: 'USO · 05',
        icono: '🗂️',
        titulo: `Inventario General de las ${totalCapas} Coberturas Integradas (123 Oficiales + 10 VGI)`,
        subtitulo: 'Registro completo de capas operativas con filtrado dinámico por código, institución custodia o temática.',
        html: `
          <div style="margin-bottom:12px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <input type="text" id="filtro-catalogo-manual-input" placeholder="🔍 Filtrar por código, nombre, custodia..." oninput="ModuloManual.filtrarTablaCatalogo(this.value)" style="flex:1; min-width:260px; padding:8px 12px; border-radius:6px; border:1px solid var(--linea); background:var(--fondo-tarjeta); color:var(--tinta); font-size:0.88rem;">
            <span style="font-size:0.85rem; color:var(--tinta-suave);">Total registradas: <strong>${totalCapas}</strong></span>
          </div>
          <div style="overflow-x:auto; max-height:480px; border:1px solid var(--linea-tarjeta); border-radius:8px;">
            <table class="tabla-sintesis" style="width:100%; border-collapse:collapse; font-size:0.84rem;">
              <thead style="position:sticky; top:0; background:rgba(15,23,42,0.95); z-index:2;">
                <tr>
                  <th style="padding:10px; text-align:left; border-bottom:1px solid var(--linea);">Cód.</th>
                  <th style="padding:10px; text-align:left; border-bottom:1px solid var(--linea);">Nombre y archivo</th>
                  <th style="padding:10px; text-align:left; border-bottom:1px solid var(--linea);">Tipo</th>
                  <th style="padding:10px; text-align:left; border-bottom:1px solid var(--linea);">Custodio</th>
                  <th style="padding:10px; text-align:left; border-bottom:1px solid var(--linea);">Descripción temática</th>
                </tr>
              </thead>
              <tbody>
                ${filasTablaCapas}
              </tbody>
            </table>
          </div>
        `
      },

      // =======================================================================
      // PARTE II: MANUAL DE ACTUALIZACIÓN Y MANTENCIÓN TÉCNICA
      // =======================================================================
      {
        id: 'cap-act-01',
        parte: 'actualizacion',
        numero: 'ACT · 01',
        icono: '🏗️',
        titulo: 'Arquitectura Tecnológica, Software y Stack de Lenguajes',
        subtitulo: 'Arquitectura modular Prototipo 02, sincronización simétrica data/ y src/data/, base dual (.geojson + .gpkg) y motor geodésico propio EPSG:32719.',
        html: `
          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px; margin-bottom:14px;">
            <h4 style="margin:0 0 6px 0; color:#f59e0b;">1. Principios de Ingeniería del Prototipo 02</h4>
            <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.65; margin:0 0 10px 0;">
              El <strong>Prototipo 02</strong> organiza la experiencia del usuario en tres módulos esenciales: <strong>Módulo 01 · Análisis</strong> (con prioridad visual para las Narrativas Espaciales y las Dimensiones Analíticas), <strong>Módulo 02 · Explorar Mapa</strong> (visor cartográfico Leaflet con 133 coberturas e inspector normativo) y <strong>Módulo 03 · Documentación</strong> (diccionario de 133 capas, catálogo de metadatos ISO 19115, evaluador de calidad ISO 19157 y marco de licencias). La arquitectura del Prototipo 01 se encuentra respaldada íntegramente tanto en disco local como en la rama Git <code>prototipo-01</code>, asegurando total trazabilidad y reversibilidad.
            </p>
            <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.65; margin:0;">
              El sistema opera como una SPA (Single Page Application) completamente estática, autónoma y sin dependencias de compiladores externos, lo que permite su despliegue inmediato en cualquier servidor HTTP o CDN público (GitHub Pages, Netlify, Nginx).
            </p>
          </div>

          <div style="overflow-x:auto;">
            <table class="tabla-sintesis" style="width:100%; border-collapse:collapse; font-size:0.83rem;">
              <thead>
                <tr>
                  <th style="min-width:180px; width:180px;">Archivo Fuente</th>
                  <th style="min-width:220px; width:220px;">Rol Arquitectónico</th>
                  <th style="min-width:320px;">Especificación Técnica y Responsabilidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>src/index.html</code></td>
                  <td>Documento DOM maestro (SPA)</td>
                  <td>Articula los 3 módulos del Prototipo 02 (Análisis, Explorar Mapa y Documentación), el visor 2D Leaflet, modales analíticos y lightbox de cartografías temáticas.</td>
                </tr>
                <tr>
                  <td><code>src/css/estilos.css</code></td>
                  <td>Hoja de estilos del sistema</td>
                  <td>Variables CSS nativas (<code>:root</code>), grillas fluidas, diseño responsive móvil/escritorio, tarjetas tácticas y animaciones fluidas sin frameworks pesados.</td>
                </tr>
                <tr>
                  <td><code>src/js/app.js</code></td>
                  <td>Orquestador y Controlador</td>
                  <td>Gestiona el ciclo de vida de la aplicación, el enrutamiento por hash (<code>#panel-...</code>), la activación táctica de paneles y la sincronización de atajos.</td>
                </tr>
                <tr>
                  <td><code>src/js/modulos/indicadores_analisis.js</code></td>
                  <td>Módulo 01: Análisis Territorial</td>
                  <td>Implementa las 4 Narrativas Espaciales (83 cartografías) y las 5 Dimensiones Analíticas que agrupan las 133 coberturas de la geodatabase.</td>
                </tr>
                <tr>
                  <td><code>src/js/modulos/mapa.js</code></td>
                  <td>Módulo 02: Motor Cartográfico Leaflet</td>
                  <td>Gestor del lienzo 2D, renderizado de geometrías GeoJSON, simbología dinámica, zoom geodésico y cálculo de áreas BBox en EPSG:32719.</td>
                </tr>
                <tr>
                  <td><code>src/js/modulos/ide_chile.js</code></td>
                  <td>Módulo 02: Catálogo Capas Oficiales</td>
                  <td>Estructuración y carga de las 123 capas vectoriales del Estado de Chile con caché local y reintentos automáticos.</td>
                </tr>
                <tr>
                  <td><code>src/js/modulos/evaluador_normativo.js</code></td>
                  <td>Módulo 02: Inspector Normativo PRC</td>
                  <td>Intersección espacial de zonificaciones, usos permitidos/prohibidos (Art. 2.1.24 OGUC), riesgos y dinámica edificatoria DOM/CRF.</td>
                </tr>
                <tr>
                  <td><code>src/js/modulos/manual.js</code></td>
                  <td>Módulo 03: Manual del Sistema</td>
                  <td>Documentación interactiva navegable, inventario dinámico de capas, procedimientos de actualización y matriz de diagnóstico.</td>
                </tr>
                <tr>
                  <td><code>src/js/modulos/diccionario.js</code></td>
                  <td>Módulo 03: Diccionario ISO 19110</td>
                  <td>Catálogo estructurado de objetos geográficos y descriptores semánticos de las 133 capas integradas.</td>
                </tr>
                <tr>
                  <td><code>src/js/modulos/metadatos.js</code></td>
                  <td>Módulo 03: Generador ISO 19115</td>
                  <td>Auditoría y edición en tiempo real de los 10 campos núcleo mínimos del Perfil Nacional de Metadatos de Chile y exportación en XML/JSON.</td>
                </tr>
                <tr>
                  <td><code>src/js/modulos/evaluador_calidad_cuantitativa.js</code></td>
                  <td>Módulo 03: Calidad ISO 19157</td>
                  <td>Ponderación multicriterio WLC v2.0 para completitud, exactitud posicional y actualidad temporal de las coberturas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        `
      },
      {
        id: 'cap-act-02',
        parte: 'actualizacion',
        numero: 'ACT · 02',
        icono: '➕',
        titulo: 'Procedimiento Integral de Integración de Nuevas Coberturas (6 Etapas)',
        subtitulo: 'Protocolo secuencial estandarizado para la ingesta de capas vectoriales oficiales o comunitarias.',
        html: `
          <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6; margin-bottom:12px;">
            Toda nueva cobertura que se integre a la plataforma debe someterse rigurosamente a las siguientes 6 etapas metodológicas para mantener la integridad geodésica y documental:
          </p>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="background:rgba(15,23,42,0.55); border-left:4px solid #38bdf8; border-radius:6px; padding:12px;">
              <h5 style="margin:0 0 4px 0; color:#38bdf8;">Etapa 1: Ingesta, Auditoría y Reproyección Geodésica</h5>
              <p style="font-size:0.83rem; color:var(--tinta-suave); margin:0;">Verificar formato vectorial (GeoJSON o GPKG), auditar validez topológica con ST_IsValid y reproyectar a coordenadas geográficas WGS84 (<code>EPSG:4326</code>). El motor de cálculo interno utiliza UTM Huso 19S (<code>EPSG:32719</code>) para métricas lineales y de superficie.</p>
            </div>
            <div style="background:rgba(15,23,42,0.55); border-left:4px solid #34d399; border-radius:6px; padding:12px;">
              <h5 style="margin:0 0 4px 0; color:#34d399;">Etapa 2: Sincronización Simétrica en Directorios data/ y src/data/</h5>
              <p style="font-size:0.83rem; color:var(--tinta-suave); margin:0;">El archivo procesado debe guardarse simultáneamente en <code>data/</code> y <code>src/data/</code> bajo nomenclatura estandarizada en minúsculas y sin acentos ni espacios (ej. <code>capa_nueva_cobertura.geojson</code>).</p>
            </div>
            <div style="background:rgba(15,23,42,0.55); border-left:4px solid #fbbf24; border-radius:6px; padding:12px;">
              <h5 style="margin:0 0 4px 0; color:#fbbf24;">Etapa 3: Registro en el Catálogo ide_chile.js</h5>
              <p style="font-size:0.83rem; color:var(--tinta-suave); margin:0;">Declarar el objeto de la capa con sus metadatos (<code>id</code>, <code>nombre</code>, <code>institucion</code>, <code>color</code>, <code>archivoLocal</code>, <code>atributos</code>, <code>dimensionId</code>) dentro del diccionario <code>CAPAS_OFICIALES</code>.</p>
            </div>
            <div style="background:rgba(15,23,42,0.55); border-left:4px solid #c084fc; border-radius:6px; padding:12px;">
              <h5 style="margin:0 0 4px 0; color:#c084fc;">Etapa 4: Asociación a la Dimensión Analítica (indicadores_analisis.js)</h5>
              <p style="font-size:0.83rem; color:var(--tinta-suave); margin:0;">Incorporar el identificador de la nueva capa dentro del arreglo <code>capasIds</code> de la dimensión correspondiente en <code>DIMENSIONES</code> (Módulo 01) para que sea catalogada en el acordeón de coberturas.</p>
            </div>
            <div style="background:rgba(15,23,42,0.55); border-left:4px solid #f43f5e; border-radius:6px; padding:12px;">
              <h5 style="margin:0 0 4px 0; color:#f43f5e;">Etapa 5: Documentación Semántica en Diccionario y Metadatos</h5>
              <p style="font-size:0.83rem; color:var(--tinta-suave); margin:0;">Registrar la descripción de atributos en <code>diccionario.js</code> (ISO 19110) y completar la ficha de metadatos núcleo en <code>metadatos.js</code> (ISO 19115 / Perfil Chile).</p>
            </div>
            <div style="background:rgba(15,23,42,0.55); border-left:4px solid #10b981; border-radius:6px; padding:12px;">
              <h5 style="margin:0 0 4px 0; color:#10b981;">Etapa 6: Validación de Integridad Automatizada</h5>
              <p style="font-size:0.83rem; color:var(--tinta-suave); margin:0;">Ejecutar <code>python3 scripts/verificar_conteo_capas.py</code> y <code>python3 scripts/verificar_integridad_despliegue.py</code> para comprobar que no existan inconsistencias de conteo ni referencias rotas.</p>
            </div>
          </div>
        `
      },
      {
        id: 'cap-act-03',
        parte: 'actualizacion',
        numero: 'ACT · 03',
        icono: '📊',
        titulo: 'Mantención de Narrativas Espaciales, Evaluador Normativo y Diccionario',
        subtitulo: 'Esquema canónico de láminas de análisis territorial, actualización de enmiendas al PRC y metadatos ISO 19110.',
        html: `
          <h4 style="color:#f59e0b; margin:0 0 6px 0;">1. Estructura Obligatoria para Nuevas Narrativas Espaciales (Módulo 01)</h4>
          <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6; margin-bottom:10px;">
            Para garantizar que el modal <code>abrirLaminaStoryboard</code> se abra sin errores en el Módulo 01, toda lámina temática en <code>src/js/modulos/indicadores_analisis.js</code> debe definir obligatoriamente las siguientes 10 propiedades en <code>contenido</code>:
          </p>
          <ul style="padding-left:20px; color:var(--tinta-suave); font-size:0.86rem; line-height:1.65; margin-bottom:14px;">
            <li><code>introduccion</code>: Párrafo de apertura o síntesis ejecutiva (cadena de texto).</li>
            <li><code>datosClave</code>: Arreglo de 4 tarjetas KPI con <code>{ valor, label, sub }</code>.</li>
            <li><code>porcentajesClave</code>: Arreglo de barras con <code>{ label, valor, porcentaje, contexto }</code>.</li>
            <li><code>graficoComparativo</code>: Objeto con <code>titulo</code> y arreglo <code>filas</code> de <code>{ label, valor, porcentaje }</code>.</li>
            <li><code>diagramaSVG</code>: Función flecha <code>() =&gt; \`&lt;svg ...&gt;...\`</code> que retorna el código vectorial SVG interactivo.</li>
            <li><code>tablaIndicadores</code>: Arreglo de filas cuantitativas con <code>{ variable, valor, referencial, fuente }</code>.</li>
            <li><code>cuerpo</code>: Arreglo de cadenas de texto con los párrafos analíticos profundos.</li>
            <li><code>conclusion</code>: Síntesis de implicancia territorial y políticas públicas (cadena de texto).</li>
            <li><code>analisisPorActor</code>: Arreglo de 4 perfiles de usuarios-tipo con <code>{ id, icono, nombre, subtitulo, utilidad }</code> (usar IDs <code>institucion</code>, <code>comunidad</code>, <code>voluntario</code>, <code>ong</code>).</li>
            <li><code>apartadoBibliografico</code>: Objeto con arreglos <code>fuentesDatos</code> y <code>referenciasAcademicas</code> (norma APA 7ª ed.).</li>
          </ul>

          <h4 style="color:#38bdf8; margin:14px 0 6px 0;">2. Actualización del Evaluador Normativo e Hitos PRC</h4>
          <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6; margin-bottom:10px;">
            Al publicarse enmiendas o modificaciones sustanciales al Plan Regulador Comunal de Santiago en el Diario Oficial, se deben registrar en el arreglo <code>HISTORIAL_PRC_EXPEDIENTES</code> dentro de <code>src/js/modulos/evaluador_normativo.js</code> indicando fecha, número de decreto alcaldicio, artículos modificados y resumen normativo.
          </p>
        `
      },
      {
        id: 'cap-act-04',
        parte: 'actualizacion',
        numero: 'ACT · 04',
        icono: '🧪',
        titulo: 'Suite de Verificación Automatizada, Control de Caché y Despliegue',
        subtitulo: 'Batería de scripts Python pre-despliegue, invalidación de caché (?v=...) y publicación a producción.',
        html: `
          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:15px; margin-bottom:14px;">
            <h4 style="margin:0 0 6px 0; color:#34d399;">1. Batería de Scripts de Integridad y Conteo</h4>
            <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6; margin:0 0 8px 0;">
              Antes de realizar cualquier commit a producción, es mandatorio ejecutar la suite de scripts automatizados de validación:
            </p>
            <pre style="background:#020617; border:1px solid var(--linea); border-radius:6px; padding:10px; font-family:monospace; font-size:0.82rem; color:#38bdf8; overflow-x:auto; margin:0 0 8px 0;"><code># 1. Comprobación estricta de conteo de capas en módulos
python3 scripts/verificar_conteo_capas.py

# 2. Verificación de integridad de archivos y balance HTML
python3 scripts/verificar_integridad_despliegue.py</code></pre>
          </div>

          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:15px; margin-bottom:14px;">
            <h4 style="margin:0 0 6px 0; color:#fbbf24;">2. Control de Caché (Cache Busting)</h4>
            <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6; margin:0;">
              Al actualizar scripts o estilos, se debe incrementar el sufijo de versión <code>?v=...</code> en las etiquetas <code>&lt;script&gt;</code> y <code>&lt;link&gt;</code> de <code>src/index.html</code> para forzar la invalidación inmediata de la caché del navegador en los clientes.
            </p>
          </div>

          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:15px;">
            <h4 style="margin:0 0 6px 0; color:#a855f7;">3. Despliegue a Producción y Doble Remoto Git</h4>
            <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6; margin:0 0 8px 0;">
              El repositorio cuenta con dos remotos configurados: <code>origin</code> (repositorio principal con soporte Git LFS) y <code>espejo</code> (repositorio de sincronización estricta sin cuota LFS). El despliegue al remoto espejo se realiza mediante la rama técnica <code>espejo-deploy</code>.
            </p>
          </div>
        `
      },
      {
        id: 'cap-act-05',
        parte: 'actualizacion',
        numero: 'ACT · 05',
        icono: '⚖️',
        titulo: 'Matriz de Diagnóstico de Incidencias y Régimen Jurídico de Datos',
        subtitulo: 'Guía de resolución de problemas técnicos frecuentes y marco legal de licenciamiento abierto.',
        html: `
          <div style="overflow-x:auto; margin-bottom:16px;">
            <table class="tabla-sintesis" style="width:100%; border-collapse:collapse; font-size:0.83rem;">
              <thead>
                <tr>
                  <th style="min-width:220px; width:220px;">Síntoma Técnico</th>
                  <th style="min-width:260px;">Causa Identificada</th>
                  <th style="min-width:320px;">Procedimiento de Solución</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>La capa no se dibuja en el mapa.</strong></td>
                  <td>Archivo exportado en coordenadas planas UTM (<code>EPSG:32719</code>) en vez de geográficas (<code>EPSG:4326</code>).</td>
                  <td>Reproyectar a <code>EPSG:4326</code> en QGIS o Python y sobrescribir en <code>data/</code> y <code>src/data/</code>.</td>
                </tr>
                <tr>
                  <td><strong>Error 404 al activar cobertura.</strong></td>
                  <td>Discrepancia entre la ruta de <code>archivoLocal</code> en <code>ide_chile.js</code> y el archivo físico.</td>
                  <td>Verificar coincidencia estricta de caracteres en minúscula en la ruta del archivo.</td>
                </tr>
                <tr>
                  <td><strong>Modal de Lámina Temática no abre al hacer clic.</strong></td>
                  <td>Incompatibilidad de esquema en <code>indicadores_analisis.js</code> (falta alguna propiedad requerida en <code>contenido</code>).</td>
                  <td>Comprobar en la consola (F12) que <code>datosClave</code>, <code>porcentajesClave</code>, <code>diagramaSVG</code> y demás propiedades requeridas estén definidas.</td>
                </tr>
                <tr>
                  <td><strong>Modificaciones no visibles en navegador.</strong></td>
                  <td>Retención de archivos en caché local del navegador.</td>
                  <td>Incrementar <code>?v=...</code> en <code>src/index.html</code> y forzar recarga (Ctrl + F5).</td>
                </tr>
                <tr>
                  <td><strong>Descuadre en script de conteo de capas.</strong></td>
                  <td>Capa registrada en <code>ide_chile.js</code> pero omitida en <code>indicadores_analisis.js</code>.</td>
                  <td>Revisar el log del script para asociar la capa faltante a su dimensión correspondiente.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 style="color:#c084fc; margin:16px 0 8px 0;">2. Régimen Jurídico de Licencias y Protección de Datos</h4>
          <ul style="padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65; margin-bottom:14px;">
            <li><strong>Open Database License (ODbL 1.0)</strong>: Rige las categorías VGI provenientes de OpenStreetMap, exigiendo atribución y compartición bajo términos idénticos.</li>
            <li><strong>Creative Commons Atribución-CompartirIgual 4.0 (CC BY-SA 4.0)</strong>: Aplica sobre las cartografías derivadas y productos de síntesis generados por el Atlas para la Gestión Territorial.</li>
            <li><strong>GNU Affero General Public License v3 (AGPLv3)</strong>: Licencia del código fuente de software, asegurando la libertad comunitaria de auditoría y mejora.</li>
            <li><strong>Ley N° 20.285 de Transparencia</strong>: Fundamenta la disponibilidad y reutilización de datos geográficos generados por organismos públicos del Estado de Chile.</li>
            <li><strong>Ley N° 19.628 de Protección de la Vida Privada</strong>: Garantizada mediante la anonimización y agregación espacial de microdatos (RSH, Censo, SII) a nivel de manzana censal y unidad vecinal.</li>
          </ul>

          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
            <a href="docs/MANUAL_USO.md" download="MANUAL_USO_ATLAS_GESTION_TERRITORIAL.md" class="accion" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">📥 Descargar Manual de Uso (.md)</a>
            <a href="docs/MANUAL_ACTUALIZACION_ATLAS.md" download="MANUAL_ACTUALIZACION_ATLAS_GESTION_TERRITORIAL.md" class="accion" style="text-decoration:none; font-size:0.82rem; padding:8px 14px; background:linear-gradient(135deg, #f59e0b, #d97706); color:#0f172a; font-weight:800;">🛠️ Descargar Manual de Actualización Técnica (.md)</a>
            <a href="docs/ARQUITECTURA.md" download="ARQUITECTURA_ATLAS_GESTION_TERRITORIAL.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">🏗️ Arquitectura del Sistema (.md)</a>
            <a href="docs/ANALISIS_METACALIDAD.md" download="ANALISIS_METACALIDAD_ATLAS.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">📊 Análisis de MetaCalidad WLC (.md)</a>
            <a href="docs/GUIA_BASE_DATOS_SUPABASE.md" download="GUIA_BASE_DATOS_SUPABASE_POSTGIS.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">🗄️ Guía PostGIS / Supabase (.md)</a>
            <a href="docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md" download="BIBLIOGRAFIA_SEMINARIO_Y_ATLAS_APA7.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">📚 Bibliografía APA 7ª Ed. (.md)</a>
          </div>
        `
      }
    ];
  }

  let capituloActivoId = 'cap-uso-01';
  let verTodosCapitulos = false;
  let textoBusquedaManual = '';

  /**
   * Construye el HTML paginado por capítulo con índice lateral fijo y buscador visible
   */
  function construirHTMLManual() {
    const capitulos = obtenerCapitulosManual();
    const capsPorModo = modoManualActivo === 'todos'
      ? capitulos
      : capitulos.filter(c => c.parte === modoManualActivo);

    const q = textoBusquedaManual.trim().toLowerCase();
    const capsFiltrados = q
      ? capsPorModo.filter(c =>
          c.titulo.toLowerCase().includes(q) ||
          c.subtitulo.toLowerCase().includes(q) ||
          c.html.toLowerCase().includes(q) ||
          c.numero.toLowerCase().includes(q)
        )
      : capsPorModo;

    if (capsFiltrados.length > 0 && !capsFiltrados.some(c => c.id === capituloActivoId)) {
      capituloActivoId = capsFiltrados[0].id;
    }

    const idxActual = Math.max(0, capsFiltrados.findIndex(c => c.id === capituloActivoId));
    const capAnterior = idxActual > 0 ? capsFiltrados[idxActual - 1] : null;
    const capSiguiente = idxActual < capsFiltrados.length - 1 ? capsFiltrados[idxActual + 1] : null;

    const capsAMostrar = (verTodosCapitulos || q.length > 0)
      ? capsFiltrados
      : (capsFiltrados[idxActual] ? [capsFiltrados[idxActual]] : []);

    const htmlIndiceLateral = capsPorModo.map((c, idx) => {
      const activo = (!verTodosCapitulos && !q && c.id === capituloActivoId);
      return `
        <li>
          <button type="button" class="btn-ancla-indice ${activo ? 'activo' : ''}" onclick="ModuloManual.irACapitulo('${c.id}')">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${idx + 1}. ${c.titulo}</span>
            <span style="font-size:0.72rem; opacity:0.75; white-space:nowrap;">${c.numero.replace(' · ', '-')}</span>
          </button>
        </li>
      `;
    }).join('');

    const controlesPaginacionCap = `
      <div class="barra-paginacion-institucional">
        <div style="font-size:0.86rem; color:var(--tinta-suave);">
          ${q
            ? `Resultados de búsqueda para "<strong>${textoBusquedaManual}</strong>": <strong>${capsFiltrados.length}</strong> capítulo(s)`
            : `Capítulo <strong>${capsFiltrados.length ? idxActual + 1 : 0}</strong> de <strong>${capsFiltrados.length}</strong>`
          }
        </div>
        <div class="controles-pagina-botones">
          <button type="button" class="btn-pagina-nav" onclick="ModuloManual.irACapitulo('${capAnterior ? capAnterior.id : ''}')" ${!capAnterior || verTodosCapitulos || q ? 'disabled' : ''}>
            ← Capítulo anterior
          </button>
          <button type="button" class="btn-pagina-nav" onclick="ModuloManual.irACapitulo('${capSiguiente ? capSiguiente.id : ''}')" ${!capSiguiente || verTodosCapitulos || q ? 'disabled' : ''}>
            Capítulo siguiente →
          </button>
          <button type="button" class="btn-pagina-nav ${verTodosCapitulos ? 'activa' : ''}" onclick="ModuloManual.alternarVerTodosCapitulos()">
            ${verTodosCapitulos ? 'Ver por capítulo' : 'Ver todos los capítulos'}
          </button>
        </div>
      </div>
    `;

    const htmlCapitulos = capsAMostrar.map(c => {
      const bordeColor = c.parte === 'actualizacion' ? 'var(--ocre)' : 'var(--musgo)';
      const etiquetaParte = c.parte === 'actualizacion'
        ? 'Parte II · Manual de actualización y mantención técnica'
        : 'Parte I · Manual de uso del Atlas';
      return `
        <article class="tarjeta-manual-capitulo bloque" id="${c.id}" style="border-top:3px solid ${bordeColor}; padding:22px; margin-bottom:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
            <span style="font-size:0.78rem; font-weight:700; color:${bordeColor};">${etiquetaParte} · ${c.numero}</span>
          </div>
          <h3 style="margin:0 0 6px 0; font-size:1.25rem; color:var(--tinta);">${c.titulo}</h3>
          <p style="margin:0 0 14px 0; font-size:0.9rem; color:var(--tinta-suave); border-bottom:1px solid var(--linea); padding-bottom:10px;">${c.subtitulo}</p>
          <div class="cuerpo-capitulo-manual">
            ${c.html}
          </div>
        </article>
      `;
    }).join('');

    return `
      <!-- Barra superior de búsqueda y filtro por parte -->
      <div class="bloque" style="padding:16px; margin-bottom:18px; display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="accion ${modoManualActivo === 'todos' ? '' : 'secundaria'}" onclick="ModuloManual.cambiarModoManual('todos')" style="font-size:0.85rem; padding:7px 14px;">
              Ambos manuales (${capitulos.length} capítulos)
            </button>
            <button type="button" class="accion ${modoManualActivo === 'uso' ? '' : 'secundaria'}" onclick="ModuloManual.cambiarModoManual('uso')" style="font-size:0.85rem; padding:7px 14px;">
              Parte I: Manual de uso
            </button>
            <button type="button" class="accion ${modoManualActivo === 'actualizacion' ? '' : 'secundaria'}" onclick="ModuloManual.cambiarModoManual('actualizacion')" style="font-size:0.85rem; padding:7px 14px;">
              Parte II: Manual de actualización
            </button>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <a href="docs/MANUAL_ACTUALIZACION_ATLAS.md" download="MANUAL_ACTUALIZACION_ATLAS_VGI.md" class="accion primaria-cta" style="font-size:0.82rem; padding:7px 14px;">
              Descargar manual completo (.md)
            </a>
            <a href="docs/MANUAL_USO.md" download="MANUAL_USO_ATLAS_VGI.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 12px;">
              Manual de uso (.md)
            </a>
            <a href="docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md" download="BIBLIOGRAFIA_SEMINARIO_Y_ATLAS_APA7.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 12px;">
              Bibliografía APA (.md)
            </a>
          </div>
        </div>
        <div>
          <input type="search" id="buscador-general-manual" value="${textoBusquedaManual.replace(/"/g, '&quot;')}" placeholder="Buscar en el manual por tema, comando, módulo o estándar (ej: PostGIS, ISO 19157, PRC, nueva capa)..." oninput="ModuloManual.filtrarManual(this.value)" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid var(--linea-fuerte); background:var(--papel); color:var(--tinta); font-size:0.92rem;">
        </div>
      </div>

      <div class="layout-modulo-dividido">
        <aside class="indice-lateral-modulo" aria-label="Índice de capítulos del manual">
          <h4>Índice de capítulos</h4>
          <ul class="lista-anclas-indice">
            ${htmlIndiceLateral}
          </ul>
        </aside>

        <div class="contenido-paginado-modulo">
          ${controlesPaginacionCap}
          <div id="lista-capitulos-manual">
            ${htmlCapitulos || '<div class="bloque"><p class="descripcion">No se encontraron capítulos que coincidan con la búsqueda.</p></div>'}
          </div>
          ${controlesPaginacionCap}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza el Manual de Uso y el Manual de Actualización en el contenedor del Módulo 07
   */
  function renderizarManual() {
    const html = construirHTMLManual();
    const contenedor = document.getElementById('contenido-manual') || document.getElementById('contenedor-manual-uso');
    if (contenedor) {
      contenedor.innerHTML = html;
    }
    return html;
  }

  /**
   * Alias compatible con cargarResumenMetodologia() en app.js
   */
  function render() {
    return construirHTMLManual();
  }

  /**
   * Alterna entre ver 'todos', solo 'uso' o solo 'actualizacion'
   */
  function cambiarModoManual(modo) {
    modoManualActivo = modo || 'todos';
    const caps = obtenerCapitulosManual().filter(c => modoManualActivo === 'todos' || c.parte === modoManualActivo);
    if (caps.length > 0) capituloActivoId = caps[0].id;
    renderizarManual();
  }

  function alternarVerTodosCapitulos() {
    verTodosCapitulos = !verTodosCapitulos;
    renderizarManual();
  }

  /**
   * Muestra el capítulo seleccionado y desplaza suavemente al inicio del módulo
   */
  function irACapitulo(idCapitulo) {
    if (!idCapitulo) return;
    capituloActivoId = idCapitulo;
    textoBusquedaManual = '';
    if (!verTodosCapitulos) {
      renderizarManual();
      const panel = document.getElementById('panel-manual');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const el = document.getElementById(idCapitulo);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Navega directamente a cualquiera de los 10 módulos del Atlas (01 al 10)
   */
  function irAPanel(panelId) {
    const mapaAlias = {
      'inicio': 'inicio',
      'osm': 'explorador-osm',
      'explorador-osm': 'explorador-osm',
      'calidad': 'calidad-ohsome',
      'calidad-ohsome': 'calidad-ohsome',
      'gbif': 'biodiversidad-gbif',
      'biodiversidad-gbif': 'biodiversidad-gbif',
      'umap': 'proyectos-umap',
      'proyectos-umap': 'proyectos-umap',
      'metadatos': 'metadatos-iso',
      'metadatos-iso': 'metadatos-iso',
      'diccionario': 'diccionario',
      'licencias': 'licencias',
      'manual': 'manual',
      'indicadores': 'indicadores'
    };
    const idReal = mapaAlias[panelId] || panelId;

    if (typeof window.activarPanel === 'function') {
      window.activarPanel(idReal);
      return;
    }

    const btn = document.querySelector(`button[data-panel="${idReal}"]`);
    if (btn) btn.click();
  }

  /**
   * Filtra los capítulos del manual por texto libre manteniendo el foco del input
   */
  function filtrarManual(termino) {
    textoBusquedaManual = String(termino || '');
    renderizarManual();
    const input = document.getElementById('buscador-general-manual');
    if (input) {
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }

  /**
   * Filtra las filas de la tabla de las 133 capas dentro del capítulo USO · 04
   */
  function filtrarTablaCatalogo(termino) {
    const q = String(termino || '').trim().toLowerCase();
    const filas = document.querySelectorAll('.fila-catalogo-manual');
    filas.forEach(fila => {
      if (!q) {
        fila.style.display = '';
      } else {
        const data = fila.getAttribute('data-busqueda') || '';
        fila.style.display = data.includes(q) ? '' : 'none';
      }
    });
  }

  return {
    render,
    renderizarManual,
    cambiarModoManual,
    alternarVerTodosCapitulos,
    irACapitulo,
    irAPanel,
    filtrarManual,
    filtrarTablaCatalogo
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloManual = ModuloManual;
}
