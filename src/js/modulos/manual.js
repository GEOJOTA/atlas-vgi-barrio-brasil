/*
  manual.js
  ---------
  Módulo 03: Manual de Uso del Atlas para la Gestión Territorial (Prototipo 02).
  Redactado en tercera persona con rigor metodológico, lenguaje institucional y acceso directo.

  Estructura:
  - Módulo 01 · Análisis: Narrativas espaciales (4 láminas) y 5 Dimensiones Analíticas.
  - Módulo 02 · Explorar Mapa: Visor cartográfico Leaflet inmediato y catálogo de 257 capas
    (123 oficiales + 134 IGV descentralizadas) agrupadas en las 5 dimensiones con buscador en español.
  - Módulo 03 · Documentación: Diccionario de descriptores, licencias y descarga integral de geodatabase.
  * Nota: El Manual de Actualización Técnica para desarrolladores se mantiene en el repositorio Git
    (docs/MANUAL_ACTUALIZACION_ATLAS.md).
*/

const ModuloManual = (() => {

  let capituloActivoId = 'cap-uso-01';
  let verTodosCapitulos = false;
  let textoBusquedaManual = '';

  /**
   * Construye dinámicamente el inventario de las 257 capas
   * (134 IGV descentralizadas + 123 Oficiales del Estado)
   */
  function construirInventarioDinamicoCapas() {
    const lista = [];

    // 1. 134 Capas IGV Descentralizadas
    const catalogoVGI = (typeof window !== 'undefined' && Array.isArray(window.CATALOGO_VGI_DESCENTRALIZADO))
      ? window.CATALOGO_VGI_DESCENTRALIZADO
      : [];

    catalogoVGI.forEach((vgi, idx) => {
      lista.push({
        num: `VGI-${String(idx + 1).padStart(3, '0')}`,
        id: vgi.id,
        nombre: vgi.nombre,
        institucion: vgi.institucion || 'OpenStreetMap / GBIF (IGV)',
        tipo: 'Colaborativa IGV',
        geometria: vgi.geometria || 'Puntos',
        archivo: vgi.archivoLocal || `data/capa_${vgi.id}.geojson`,
        descripcion: vgi.descripcion || 'Cobertura colaborativa barrial.'
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
   * Retorna los capítulos del Manual de Uso del Atlas (Prototipo 02)
   */
  function obtenerCapitulosManual() {
    const inventarioCapas = construirInventarioDinamicoCapas();
    const totalCapas = inventarioCapas.length || 257;

    const filasTablaCapas = inventarioCapas.map(c => {
      const colorBadge = c.tipo === 'Colaborativa IGV'
        ? 'background:rgba(6,182,212,0.15); color:#38bdf8; border:1px solid rgba(6,182,212,0.35);'
        : 'background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.35);';
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
      {
        id: 'cap-uso-01',
        numero: 'USO · 01',
        icono: '🏛️',
        titulo: 'Fundamentación, Objetivos y Cifras Clave del Atlas (Prototipo 02)',
        subtitulo: 'Marco institucional, modelo de datos y arquitectura operacional del Atlas para la Gestión Territorial.',
        html: `
          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px; margin-bottom:16px;">
            <h4 style="margin:0 0 8px 0; color:#38bdf8;">Objetivo general</h4>
            <p style="font-size:0.94rem; line-height:1.7; color:var(--tinta-suave); margin:0 0 14px 0;">
              Desarrollar un atlas territorial reproducible, interoperable y centrado en la toma de decisiones espaciales, que integre geodatos abiertos oficiales del Estado de Chile, información geográfica voluntaria (IGV/VGI) y herramientas analíticas multicriterio para subsanar vacíos de información, visibilizar patrones socioterritoriales y apoyar la gestión local en el Municipio de Santiago y el Barrio Brasil.
            </p>
            <h4 style="margin:0 0 8px 0; color:#34d399;">Objetivos específicos</h4>
            <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.9rem; line-height:1.65;">
              <li><strong>OE 1.</strong> Caracterizar la disponibilidad, la cobertura y los vacíos de información geográfica del área de estudio, definiendo una taxonomía espacial estandarizada que armonice fuentes comunitarias e institucionales.</li>
              <li><strong>OE 2.</strong> Consolidar una geodatabase comunitaria y municipal multipropósito bajo estándares internacionales de calidad y catalogación de metadatos.</li>
              <li><strong>OE 3.</strong> Implementar el <strong>Prototipo 02</strong>: un geoportal interactivo estructurado en tres componentes operacionales (Módulo 01 Análisis, Módulo 02 Explorar Mapa y Módulo 03 Documentación).</li>
              <li><strong>OE 4.</strong> Evaluar la usabilidad y la pertinencia de la plataforma con actores territoriales, garantizando su total auditabilidad, trazabilidad técnica y continuidad operativa.</li>
            </ul>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:14px; margin:16px 0;">
            <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#38bdf8;">257 capas espaciales</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                123 coberturas oficiales del Estado de Chile y 134 coberturas de Información Geográfica Voluntaria (IGV) descentralizadas y traducidas 100% al español.
              </div>
            </div>
            <div style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#c084fc;">83 cartografías temáticas</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                Estructuradas en 4 narrativas espaciales (KDE, LISA, Sociodemografía y Metabolismo Urbano) y 5 Dimensiones Analíticas.
              </div>
            </div>
            <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#fbbf24;">5 Dimensiones Analíticas</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                Sociodemográfica, Socioeconómica, Socioambiental, Sociosanitaria y Sociourbana, agrupando la totalidad del catálogo cartográfico.
              </div>
            </div>
            <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#34d399;">79.841 entidades / 112.264 nodos</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                Geodatabase comunitaria analizada en malla regular de 20 m sobre 1.711 manzanas censales de la Comuna de Santiago.
              </div>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.4); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; margin-top:16px;">
            <h4 style="margin:0 0 10px 0; color:#ffffff; font-size:0.95rem;">🧭 Navegación Rápida por la Plataforma (Prototipo 02)</h4>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.82rem; padding:7px 12px;">📊 Módulo 01 · Análisis Territorial</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.82rem; padding:7px 12px;">🗺️ Módulo 02 · Explorar Mapa (257 Capas)</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('diccionario')" style="font-size:0.82rem; padding:7px 12px;">🗂️ Módulo 03 · Diccionario de Descriptores</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('licencias')" style="font-size:0.82rem; padding:7px 12px;">⚖️ Licencias y Marco Legal</button>
              <button type="button" class="accion" onclick="document.getElementById('btn-descargar-todo-ide').click()" style="font-size:0.82rem; padding:7px 12px; background:linear-gradient(135deg, #10b981, #059669); color:#ffffff;">📦 Descargar Base de Datos (.zip)</button>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-02',
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
                Las <strong>Narrativas Espaciales Basadas en Datos</strong> constituyen la síntesis territorial del Atlas, elaborada a partir de <strong>83 cartografías temáticas</strong> que representan patrones de concentración, segregación espacial, estructura demográfica, habitabilidad, movilidad y metabolismo urbano en la Comuna de Santiago y el Barrio Brasil. Se presentan organizadas en 4 láminas interactivas:
              </p>

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(310px, 1fr)); gap:12px; margin-top:10px;">
                <!-- Lámina 1 -->
                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#38bdf8; text-transform:uppercase;">Lámina 01 · Densidad Continua</span>
                    <h5 style="margin:4px 0 6px 0; font-size:0.95rem; color:#ffffff;">Concentración Territorial de Actividad IGV en Santiago:</h5>
                    <p style="font-size:0.83rem; color:var(--tinta-suave); line-height:1.55; margin:0;">
                      Análisis espacial de las 14 cartografías de densidad continua (KDE) sobre la geodatabase comunitaria consolidada del Atlas IGV (79.841 entidades geométricas directas y 112.264 nodos muestreados en malla regular de 20 m), la red de semáforos UOCT y las dinámicas oficiales de Permisos de Edificación y Certificados de Recepción Final (CRF). Polarización entre la concentración del eje Alameda, Barrio Brasil, Santa Ana, Parque Almagro y Ejército frente a los vacíos en el arco periférico sur y suroriente de la comuna (Bogotá, Sierra Bella, Matta Sur, Diez de Julio y San Vicente).
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
                      Análisis espacial de las 11 cartografías de autocorrelación espacial local (Anselin, 1995) sobre las 1.711 manzanas censales de Santiago: dónde se agrupan estadísticamente los núcleos Alto-Alto (HH), qué barrios conforman bolsones Bajo-Bajo (LL) y cómo la cobertura colaborativa exhibe un desajuste inverso frente a la densidad residencial comunal.
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
                      Análisis espacial de las 34 cartografías sociodemográficas, habitacionales y de morfología predial de la comuna: concentración de los 432.081 habitantes, la hegemonía del departamento (92,7%) y del arriendo (72,1%), las alturas autorizadas de edificación, el Coeficiente de Ocupación del Suelo (COS medio de 0,47), la persistencia de cités en el sur y la conservación en Barrio Brasil y Yungay.
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
                El Atlas articula las 257 coberturas espaciales en <strong>5 Dimensiones Analíticas</strong> continuas entre el análisis interpretativo del Módulo 01 y la exploración cartográfica del Módulo 02:
              </p>
              <ul style="margin:0 0 14px 0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                <li><strong>1. Dimensión Sociodemográfica y Habitacional:</strong> Caracterización poblacional del Censo 2024, vulnerabilidad social (RSH), tipologías de vivienda, hacinamiento, arriendo y permisos/recepciones habitacionales del INE.</li>
                <li><strong>2. Dimensión Socioeconómica y Comercial:</strong> Iniciativas de inversión pública (BIP / MOP), comercio barrial colaborativo, mercados mayoristas, empleo y redes energéticas y de telecomunicaciones.</li>
                <li><strong>3. Dimensión Socioambiental y Espacio Público:</strong> Infraestructura verde urbana, arbolado y biodiversidad ciudadana (GBIF), monitoreo hidrometeorológico y metabolismo de residuos sólidos municipales.</li>
                <li><strong>4. Dimensión Sociosanitaria y Salud:</strong> Cobertura territorial de la red asistencial de salud pública (CESFAM y hospitales), farmacias de barrio, personas con dependencia funcional y jurisdicciones sanitarias.</li>
                <li><strong>5. Dimensión Sociourbana, Movilidad y Normativa:</strong> Zonificación del Plan Regulador Comunal (PRC Santiago), zonas de conservación histórica (ZCH), redes de transporte público (Metro, buses), ciclovías y accesibilidad universal.</li>
              </ul>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.82rem; padding:8px 14px;">📊 Explorar Dimensiones en Módulo 01 ↗</button>
                <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.82rem; padding:8px 14px;">🗺️ Ver Capas en Visor del Módulo 02 ↗</button>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-03',
        numero: 'USO · 03',
        icono: '🗺️',
        titulo: 'Operación del Módulo 02: Explorar Mapa (Visor y Consulta Espacial)',
        subtitulo: 'Visor cartográfico Leaflet inmediato, áreas de enfoque, panel de detalles a todo lo ancho y exportación GeoJSON con estilos.',
        html: `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:15px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
                <h4 style="margin:0; color:#38bdf8;">1. Visor Territorial Leaflet Directo</h4>
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.8rem; padding:6px 12px;">Abrir Visor (Módulo 02) ↗</button>
              </div>
              <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                <li><strong>Acceso inmediato:</strong> Al ingresar al Módulo 02, el visor cartográfico se presenta en primer plano de forma directa sin pantallas intermedias ni elementos obstructivos.</li>
                <li><strong>Áreas de enfoque:</strong> Selector rápido entre dos polígonos territoriales calibrados: a) <strong>Barrio Brasil Completo</strong> (escala barrial) y b) <strong>Comuna de Santiago</strong> (visión comunal integral).</li>
                <li><strong>Botón "Ver Atlas de Análisis":</strong> Permite regresar en un clic al Módulo 01 para examinar las 4 láminas territoriales y explorar las 257 capas desde sus 5 dimensiones analíticas.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:15px;">
              <h4 style="margin:0 0 6px 0; color:#34d399;">2. Activación de Capas desde Módulo 01 y Panel Inferior de Detalles</h4>
              <p style="margin:0 0 8px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Para una experiencia de navegación limpia y enfocada, la exploración y activación de las <strong>257 coberturas espaciales</strong> (123 oficiales + 134 IGV descentralizadas) se realiza desde el <strong>Módulo 01 (Análisis)</strong> a través de sus 5 Dimensiones Analíticas. Al activar cualquier capa, el sistema conmuta automáticamente al visor:
              </p>
              <ul style="margin:0 0 10px 0; padding-left:20px; color:var(--tinta-suave); font-size:0.87rem; line-height:1.6;">
                <li><strong>Panel inferior "Detalles del elemento":</strong> Situado justo debajo del mapa a todo lo ancho, ofrece máxima amplitud para examinar atributos, indicadores, columnas de datos, metadatos y enlaces de descarga de cada entidad seleccionada.</li>
                <li><strong>Exportación GeoJSON con Simbología Aplicada:</strong> El botón <em>Exportar vista (GeoJSON)</em> descarga la totalidad de elementos visibles incorporando en sus propiedades los estilos gráficos configurados (colores, contornos, rellenos, opacidades y rampas temáticas), listos para interoperar con QGIS u otros SIG.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(245,158,11,0.4); border-radius:10px; padding:15px;">
              <h4 style="margin:0 0 6px 0; color:#fbbf24;">3. Inspector Normativo PRC/OGUC</h4>
              <p style="margin:0 0 8px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Al activar <strong>⚖ Inspector Normativo</strong> y hacer clic en cualquier punto del mapa, el sistema ejecuta una intersección espacial geodésica y analiza automáticamente:
              </p>
              <ul style="margin:0 0 10px 0; padding-left:20px; color:var(--tinta-suave); font-size:0.87rem; line-height:1.6;">
                <li>Zonificación del Plan Regulador Comunal (PRC Santiago) y Plan Regulador Metropolitano (PRMS), evaluando usos permitidos y prohibidos bajo el <strong>Art. 2.1.24 OGUC</strong>.</li>
                <li>Restricciones por riesgo (Art. 2.1.17 OGUC), áreas verdes normadas y afectación patrimonial (Zonas Típicas, ZCH, ICH y Monumentos Nacionales).</li>
                <li>Permisos de edificación DOM y recepciones finales CRF del INE (densidad neta residencial y ocupación del suelo).</li>
              </ul>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-04',
        numero: 'USO · 04',
        icono: '📚',
        titulo: 'Operación del Módulo 03: Documentación, Diccionario y Licencias Abiertas',
        subtitulo: 'Diccionario de descriptores barriales, licencias abiertas, descarga de geodatabase completa y manuales técnicos.',
        html: `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <p style="margin:0; font-size:0.9rem; color:var(--tinta-suave); line-height:1.65;">
              El <strong>Módulo 03 · Documentación</strong> garantiza la certeza técnica, metodológica y jurídica del Atlas, integrando herramientas especializadas de metadatos, diccionario semántico y descarga de datos:
            </p>

            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(290px, 1fr)); gap:12px;">
              <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <span style="font-size:0.74rem; font-weight:800; color:#38bdf8;">CATÁLOGO SEMÁNTICO</span>
                  <h4 style="margin:4px 0 6px 0;">Diccionario de descriptores (134 Capas IGV)</h4>
                  <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Catálogo de objetos y atributos conforme a ISO 19110, homologación semántica con IDE Chile y categorización temática exhaustiva en español.</p>
                </div>
                <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('diccionario')" style="margin-top:10px; font-size:0.8rem;">Abrir Diccionario de descriptores ↗</button>
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
                <button type="button" class="accion" onclick="document.getElementById('btn-descargar-todo-ide').click()" style="margin-top:10px; font-size:0.8rem; background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; font-weight:700;">📦 Descargar BBDD Completa (.zip) ↗</button>
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.45); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:14px; margin-top:8px;">
              <h4 style="margin:0 0 6px 0; color:#fbbf24; font-size:0.95rem;">🛠️ Manual de Actualización y Mantención Técnica (Git)</h4>
              <p style="margin:0 0 10px 0; font-size:0.86rem; color:var(--tinta-suave); line-height:1.6;">
                Para garantizar la simplicidad y claridad de la interfaz web, el <strong>Manual de Actualización y Mantención Técnica</strong> se encuentra documentado y mantenido directamente en el repositorio de Git del proyecto. Contiene la arquitectura del stack tecnológico, la sincronización simétrica entre <code>data/</code> y <code>src/data/</code>, el protocolo de 6 etapas para la incorporación de nuevas coberturas y los scripts de geoprocesamiento:
              </p>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <a href="docs/MANUAL_ACTUALIZACION_ATLAS.md" download="MANUAL_ACTUALIZACION_ATLAS.md" class="accion secundaria" style="font-size:0.8rem; padding:6px 12px;">
                  📄 Descargar Manual de Actualización (Markdown)
                </a>
                <a href="docs/MANUAL_USO.md" download="MANUAL_USO_ATLAS.md" class="accion secundaria" style="font-size:0.8rem; padding:6px 12px;">
                  📄 Descargar Manual de Uso (Markdown)
                </a>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-05',
        numero: 'USO · 05',
        icono: '🗂️',
        titulo: `Inventario General de las ${totalCapas} Coberturas Integradas (123 Oficiales + 134 IGV)`,
        subtitulo: 'Registro completo de capas operativas con filtrado dinámico en tiempo real por código, custodio o temática.',
        html: `
          <div style="margin-bottom:12px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <input type="text" id="filtro-catalogo-manual-input" placeholder="🔍 Filtrar por código, nombre, custodia..." oninput="ModuloManual.filtrarTablaCatalogo(this.value)" style="flex:1; min-width:260px; padding:8px 12px; border-radius:6px; border:1px solid var(--linea); background:var(--fondo-tarjeta); color:var(--tinta); font-size:0.88rem;">
            <span style="font-size:0.85rem; color:var(--tinta-suave);">Total registradas: <strong>${totalCapas}</strong></span>
          </div>
          <div style="overflow-x:auto; max-height:520px; border:1px solid var(--linea-tarjeta); border-radius:8px;">
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
              <tbody id="tbody-catalogo-manual">
                ${filasTablaCapas}
              </tbody>
            </table>
          </div>
        `
      }
    ];
  }

  /**
   * Construye el HTML completo de la vista del Manual
   */
  function construirHTMLManual() {
    const capitulos = obtenerCapitulosManual();
    const q = textoBusquedaManual.trim().toLowerCase();

    const capsFiltrados = capitulos.filter(c => {
      if (!q) return true;
      const texto = (c.titulo + ' ' + c.subtitulo + ' ' + c.html).toLowerCase();
      return texto.includes(q);
    });

    const capActual = capitulos.find(c => c.id === capituloActivoId) || capitulos[0];
    const idxActual = capitulos.findIndex(c => c.id === (capActual ? capActual.id : ''));
    const capAnterior = idxActual > 0 ? capitulos[idxActual - 1] : null;
    const capSiguiente = idxActual < capitulos.length - 1 ? capitulos[idxActual + 1] : null;

    const capsAMostrar = (verTodosCapitulos || q)
      ? capsFiltrados
      : (capActual ? [capActual] : []);

    const htmlIndiceLateral = capitulos.map((c, idx) => {
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
      return `
        <article class="tarjeta-manual-capitulo bloque" id="${c.id}" style="border-top:3px solid var(--musgo); padding:22px; margin-bottom:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
            <span style="font-size:0.78rem; font-weight:700; color:var(--musgo);">Manual de uso del Atlas · ${c.numero}</span>
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
      <div class="bloque" style="padding:16px; margin-bottom:18px; display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="margin:0 0 4px 0; color:#ffffff; font-size:1.15rem;">Manual de Uso del Sistema</h3>
            <p style="margin:0; font-size:0.86rem; color:var(--tinta-suave);">Guía de navegación, exploración cartográfica y consulta analítica del Atlas para la Gestión Territorial.</p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <a href="docs/MANUAL_USO.md" download="MANUAL_USO_ATLAS.md" class="accion" style="font-size:0.82rem; padding:7px 14px;">
              Descargar Manual de Uso (.md)
            </a>
            <a href="docs/MANUAL_ACTUALIZACION_ATLAS.md" download="MANUAL_ACTUALIZACION_ATLAS.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 12px;" title="Manual de actualización técnica disponible en el repositorio">
              Manual de Actualización (Git .md)
            </a>
            <a href="docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md" download="BIBLIOGRAFIA_SEMINARIO_Y_ATLAS_APA7.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 12px;">
              Bibliografía APA (.md)
            </a>
          </div>
        </div>
        <div>
          <input type="search" id="buscador-general-manual" value="${textoBusquedaManual.replace(/"/g, '&quot;')}" placeholder="Buscar en los capítulos del manual de uso (ej: visor, dimensiones, capas, inspector normativo, atajos)..." oninput="ModuloManual.filtrarManual(this.value)" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid var(--linea-fuerte); background:var(--papel); color:var(--tinta); font-size:0.92rem;">
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

  function renderizarManual() {
    const html = construirHTMLManual();
    const contenedor = document.getElementById('contenido-manual') || document.getElementById('contenedor-manual-uso');
    if (contenedor) {
      contenedor.innerHTML = html;
    }
    return html;
  }

  function render() {
    return construirHTMLManual();
  }

  function alternarVerTodosCapitulos() {
    verTodosCapitulos = !verTodosCapitulos;
    renderizarManual();
  }

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

  function irAPanel(panelId) {
    const mapaAlias = {
      'inicio': 'inicio',
      'explorar': 'inicio',
      'mapa': 'inicio',
      'visor': 'inicio',
      'diccionario': 'diccionario',
      'licencias': 'licencias',
      'manual': 'manual',
      'indicadores': 'indicadores',
      'analisis': 'indicadores'
    };
    const idReal = mapaAlias[panelId] || panelId;
    if (typeof window.activarPanel === 'function') {
      window.activarPanel(idReal);
      return;
    }
    const btn = document.querySelector(`button[data-panel="${idReal}"]`);
    if (btn) btn.click();
  }

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
