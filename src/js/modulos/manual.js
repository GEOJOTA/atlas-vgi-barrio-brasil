/*
  manual.js
  ---------
  Módulo 03: Manual de Uso del Atlas para la Gestión Territorial.
  Redactado en tercera persona con rigor metodológico, lenguaje institucional y acceso directo.

  Estructura:
  - Módulo 01 · Análisis: Narrativas espaciales (4 láminas) y 5 Dimensiones Analíticas.
  - Módulo 02 · Explorar Mapa: Visor cartográfico Leaflet inmediato y catálogo de 294 capas
    (123 oficiales + 171 IGV descentralizadas) agrupadas en las 5 dimensiones con buscador en español.
  - Módulo 03 · Documentación: Diccionario de descriptores, licencias y descarga integral de geodatabase.
  * Nota: El Manual de Actualización Técnica para desarrolladores se mantiene en el repositorio Git
    (docs/MANUAL_ACTUALIZACION_ATLAS.md).
*/

const ModuloManual = (() => {

  let capituloActivoId = 'cap-uso-01';
  let verTodosCapitulos = false;
  let textoBusquedaManual = '';

  /**
   * Construye dinámicamente el inventario de las 294 capas
   * (171 IGV descentralizadas + 123 Oficiales del Estado)
   */
  function construirInventarioDinamicoCapas() {
    const lista = [];

    // 1. 171 Capas IGV Descentralizadas
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
   * Retorna los capítulos del Manual de Uso del Atlas para la Gestión Territorial
   */
  function obtenerCapitulosManual() {
    const inventarioCapas = construirInventarioDinamicoCapas();
    const totalCapas = inventarioCapas.length || 294;

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
        titulo: 'Fundamentación, Objetivos y Cifras Clave del Atlas',
        subtitulo: 'Marco institucional, modelo de datos y arquitectura operacional del Atlas para la Gestión Territorial.',
        html: `
          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px; margin-bottom:16px;">
            <h4 style="margin:0 0 8px 0; color:#38bdf8;">Objetivo general</h4>
            <p style="font-size:0.94rem; line-height:1.7; color:var(--tinta-suave); margin:0 0 14px 0;">
              Desarrollar un Atlas para la Gestión Territorial reproducible, interoperable y centrado en el usuario, que integre geodatos abiertos, cartografía participativa y herramientas analíticas para subsanar vacíos de información territorial y apoyar la gestión local y la investigación en la Comuna de Santiago y Barrio Brasil.
            </p>
            <h4 style="margin:0 0 8px 0; color:#34d399;">Objetivos específicos</h4>
            <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.9rem; line-height:1.65;">
              <li><strong>OE 1.</strong> Caracterizar la disponibilidad, la cobertura y los vacíos de información geográfica del área de estudio, y definir las bases taxonómicas y de diseño centrado en el usuario que permitan integrar datos colaborativos e institucionales.</li>
              <li><strong>OE 2.</strong> Consolidar una geodatabase multipropósito que armonice coberturas oficiales e información voluntaria bajo estándares internacionales de calidad y metadatos.</li>
              <li><strong>OE 3.</strong> Implementar un geoportal web accesible e interoperable que permita visualizar cartografía multinivel, consultar el territorio en tiempo real y descargar geodatos abiertos.</li>
              <li><strong>OE 4.</strong> Evaluar la usabilidad y la pertinencia de la plataforma con distintos perfiles de actores territoriales y asegurar su transferibilidad técnica, metodológica y documental.</li>
            </ul>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:14px; margin:16px 0;">
            <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#38bdf8;">294 capas espaciales</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                123 coberturas oficiales del Estado de Chile y 171 coberturas de Información Geográfica Voluntaria (IGV) descentralizadas y traducidas 100% al español.
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
            <h4 style="margin:0 0 10px 0; color:#ffffff; font-size:0.95rem;">🧭 Navegación Rápida por la Plataforma</h4>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              <button type="button" class="accion" onclick="if(window.iniciarTutorialInteractivo) window.iniciarTutorialInteractivo();" style="font-size:0.82rem; padding:7px 12px; background:linear-gradient(135deg, #0284c7, #0369a1); color:#ffffff;">🎓 Iniciar Tutorial Interactivo</button>
              <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.82rem; padding:7px 12px;">📊 Módulo 01 · Análisis Territorial</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.82rem; padding:7px 12px;">🗺️ Módulo 02 · Explorar Mapa (294 Capas)</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('diccionario')" style="font-size:0.82rem; padding:7px 12px;">🗂️ Módulo 03 · Diccionario de Descriptores</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('licencias')" style="font-size:0.82rem; padding:7px 12px;">⚖️ Licencias y Marco Legal</button>
              <button type="button" class="accion" onclick="if(document.getElementById('btn-descargar-todo-ide')){document.getElementById('btn-descargar-todo-ide').click();}else if(document.getElementById('btn-descargar-bd-mapa')){document.getElementById('btn-descargar-bd-mapa').click();}" style="font-size:0.82rem; padding:7px 12px; background:linear-gradient(135deg, #10b981, #059669); color:#ffffff;">📦 Descargar Base de Datos (.zip)</button>
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
                El Atlas articula las 294 coberturas espaciales en <strong>5 Dimensiones Analíticas</strong> continuas entre el análisis interpretativo del Módulo 01 y la exploración cartográfica del Módulo 02:
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
        titulo: 'Operación del Módulo 02: Explorar Mapa (Visor Inmediato y Simbología Inteligente)',
        subtitulo: 'Visor cartográfico Leaflet sin requerimiento de API, mapas base abiertos, simbología automática con Natural Breaks (Jenks) y panel inferior de inspección.',
        html: `
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
                <h4 style="margin:0; color:#38bdf8; font-size:1.05rem;">1. Visor Inmediato y Mapas Base 100% Abiertos (Sin API Keys)</h4>
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.8rem; padding:6px 12px;">Abrir Visor (Módulo 02) ↗</button>
              </div>
              <p style="margin:0 0 10px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                El visor cartográfico Leaflet se despliega de forma instantánea al ingresar al Módulo 02. La plataforma erradica por completo la dependencia de proveedores que exigen tokens o credenciales comerciales (como Bing Maps o Google Maps), integrando 4 servidores cartográficos abiertos de alta disponibilidad mundial:
              </p>
              <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                <li><strong>CartoDB Dark Matter (Predeterminado):</strong> Base cartográfica oscura táctica de alto contraste, calibrada para resaltar las geometrías y análisis espaciales del Atlas.</li>
                <li><strong>OpenStreetMap Estándar:</strong> Cartografía colaborativa mundial con toponimia barrial completa, ciclofaixas y numeración predial.</li>
                <li><strong>CartoDB Positron:</strong> Base clara minimalista, óptima para revisión diurna e impresión de informes técnicos.</li>
                <li><strong>Imagen Satelital (Esri World Imagery):</strong> Ortoimágenes satelitales globales de alta resolución sin requerimiento de clave API.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(16,185,129,0.4); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#34d399; font-size:1.05rem;">2. Simbología Inteligente Predeterminada al Cargar Capas</h4>
              <p style="margin:0 0 10px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Cada una de las <strong>294 coberturas</strong> (123 oficiales + 171 IGV descentralizadas) se carga con una parametrización gráfica adaptada a sus atributos intrínsecos y dimensión analítica:
              </p>
              <ul style="margin:0 0 12px 0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                <li><strong>Capas cuantitativas / índices:</strong> Clasificación matemática automática mediante <strong>Natural Breaks (Jenks)</strong> en 5 clases, minimizando la varianza intraclase y maximizando la diferenciación espacial real (población Censo, superficies en m², montos de inversión, tasas de arbolado).</li>
                <li><strong>Capas de entidades / cualitativas:</strong> Simbología <strong>categorizada</strong> que asigna colores contrastantes armónicos a valores discretos (zonificación PRC, tipos de equipamiento, jerarquía vial, usos de suelo).</li>
                <li><strong>Rampas cromáticas por dimensión:</strong> Sociodemográfica (Cian/Viridis), Socioeconómica (Ámbar/YlOrRd), Socioambiental (Verde/Greens), Sociosanitaria (Magenta/Magma) y Sociourbana (Violeta/Purples).</li>
              </ul>
              <div style="background:rgba(15,23,42,0.7); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px;">
                <p style="margin:0; font-size:0.85rem; color:var(--tinta-suave); line-height:1.55;">
                  💡 <strong>Personalización dinámica:</strong> A través del panel desplegable <em>Simbología Dinámica</em> sobre el mapa, el analista puede modificar manualmente el método de corte (Jenks, Cuantiles, Intervalos Iguales, Desviación Estándar), la columna analítica, la rampa de color o invertir el gradiente según las necesidades del informe.
                </p>
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#38bdf8; font-size:1.05rem;">3. Panel Inferior de Detalles a Todo lo Ancho</h4>
              <p style="margin:0 0 8px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Situado inmediatamente debajo del mapa, el panel <em>Detalles del elemento</em> proporciona lectura cómoda y exhaustiva de todas las columnas, indicadores calculados (como superficies métricas en EPSG:32719 UTM 19S) y trazabilidad del custodio institucional o fuente colaborativa de la entidad seleccionada.
              </p>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(245,158,11,0.4); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#fbbf24; font-size:1.05rem;">4. Inspector Normativo PRC/OGUC y Delimitación Espacial</h4>
              <p style="margin:0 0 8px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Al activar el <strong>⚖ Inspector Normativo</strong> y cliquear sobre cualquier manzana o predio, el motor intersecta las capas oficiales del Plan Regulador Comunal de Santiago y la Ordenanza General de Urbanismo y Construcciones (OGUC):
              </p>
              <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.6;">
                <li>Zonificación PRC (usos permitidos y prohibidos según el Art. 2.1.24 OGUC).</li>
                <li>Afectaciones patrimoniales (Zonas Típicas, ZCH, Inmuebles de Conservación Histórica y Monumentos Nacionales).</li>
                <li>Dinámicas edificatorias oficiales (Permisos DOM y Recepciones Finales CRF del INE).</li>
              </ul>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-04',
        numero: 'USO · 04',
        icono: '⚖️',
        titulo: 'Marco Jurídico de Licencias Abiertas y Descarga Directa de Catálogos y Geodatabase (294 Coberturas)',
        subtitulo: 'Régimen tripartito de bienes comunes digitales (CC BY-SA 4.0 / ODbL 1.0 / GNU AGPLv3 / Ley 20.285), archivo maestro .zip y hojas maestras en Excel.',
        html: `
          <div style="display:flex; flex-direction:column; gap:18px;">
            
            <!-- Descarga de la Geodatabase Completa -->
            <div class="bloque" id="sec-lic-descargas-maestras" style="border-left:4px solid #10b981; background:rgba(16,185,129,0.06); padding:18px; border-radius:10px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px; margin-bottom:12px;">
                <div style="flex:1; min-width:280px;">
                  <span style="font-size:0.75rem; font-weight:800; color:#34d399; text-transform:uppercase; letter-spacing:0.05em;">ACCESO ABIERTO // DESCARGA INTEGRAL</span>
                  <h3 style="margin:4px 0 6px 0; color:#ffffff; font-size:1.25rem;">📦 Geodatabase Completa del Atlas para la Gestión Territorial (.zip)</h3>
                  <p class="descripcion" style="margin:0; font-size:0.89rem; color:var(--tinta-suave); line-height:1.6;">
                    El paquete consolidado incluye las <strong>294 coberturas espaciales operativas</strong> (171 capas colaborativas IGV descentralizadas + 123 capas oficiales del Estado de Chile), los libros maestros en Excel, las matrices de metacalidad y los esquemas PostGIS (<strong>542,35 MB comprimido / ~3,33 GB descomprimido</strong>).
                  </p>
                </div>
                <div>
                  <a href="docs/geodatabase_completa_atlas_vgi.zip" download="geodatabase_completa_atlas_vgi.zip" class="accion primaria-cta" style="background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; font-weight:800; padding:10px 20px; border-radius:8px; display:inline-flex; align-items:center; gap:8px; text-decoration:none; box-shadow:0 4px 14px rgba(16,185,129,0.35);">
                    ⬇️ Descargar Geodatabase Completa (.zip · 542 MB)
                  </a>
                </div>
              </div>
            </div>

            <!-- Tabla de Catálogos y Libros Maestros en Excel -->
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 6px 0; color:#38bdf8; font-size:1.05rem;">Catálogos Estructurados y Libros de Datos Disponibles para Descarga</h4>
              <p style="margin:0 0 12px 0; font-size:0.86rem; color:var(--tinta-suave);">Tablas maestras con el esquema formal de atributos, metadatos ISO 19115 y matrices de evaluación multicriterio:</p>
              
              <div class="contenedor-tabla-responsiva">
                <table class="tabla-datos" style="width:100%; font-size:0.86rem; min-width:680px;">
                  <thead>
                    <tr>
                      <th style="min-width:200px;">Catálogo / Documento</th>
                      <th style="min-width:260px;">Contenido y Estructura</th>
                      <th style="min-width:130px;">Formato y Peso</th>
                      <th style="min-width:110px;">Descarga</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Taxonomía y Diccionario de Capas</strong><br><code class="codigo-licencia">docs/categorias_tematicas_osm.xlsx</code></td>
                      <td>4 hojas: 10 categorías maestras (CAT-01 a CAT-10), descriptores barriales, esquema de atributos normalizados y referencias APA 7ª ed.</td>
                      <td>Excel (<code>.xlsx</code>) · ~52 KB</td>
                      <td><a href="docs/categorias_tematicas_osm.xlsx" download="categorias_tematicas_osm.xlsx" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar Excel</a></td>
                    </tr>
                    <tr>
                      <td><strong>Perfil de Metadatos y Estándares</strong><br><code class="codigo-licencia">docs/perfil_metadatos_vgi.xlsx</code></td>
                      <td>Matriz técnica de homologación de atributos con ISO 19115 / IDE Chile SNIT y catálogo de variables territoriales.</td>
                      <td>Excel (<code>.xlsx</code>) · ~31 KB</td>
                      <td><a href="docs/perfil_metadatos_vgi.xlsx" download="perfil_metadatos_vgi.xlsx" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar Excel</a></td>
                    </tr>
                    <tr>
                      <td><strong>Catálogo Sistemático de Fuentes</strong><br><code class="codigo-licencia">docs/catalogo_fuentes_vgi.xlsx</code></td>
                      <td>Inventario exhaustivo de fuentes oficiales y colaborativas con escala, cobertura, licenciamiento y aplicación.</td>
                      <td>Excel (<code>.xlsx</code>) · ~39 KB</td>
                      <td><a href="docs/catalogo_fuentes_vgi.xlsx" download="catalogo_fuentes_vgi.xlsx" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar Excel</a></td>
                    </tr>
                    <tr>
                      <td><strong>Ranking Consolidado de Calidad</strong><br><code class="codigo-licencia">docs/wlc_metacalidad_ranking.csv</code></td>
                      <td>Tabla plana tabular con puntajes cuantitativos, cualitativos, índice IGV y clasificación de idoneidad territorial.</td>
                      <td>CSV (<code>.csv</code>) · ~34 KB</td>
                      <td><a href="docs/wlc_metacalidad_ranking.csv" download="wlc_metacalidad_ranking.csv" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar CSV</a></td>
                    </tr>
                    <tr>
                      <td><strong>Bibliografía y Estado del Arte</strong><br><code class="codigo-licencia">docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md</code></td>
                      <td>125 referencias bibliográficas estructuradas bajo norma APA 7ª edición sobre VGI, ordenamiento territorial y SIG.</td>
                      <td>Markdown (<code>.md</code>) · ~81 KB</td>
                      <td><a href="docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md" download="BIBLIOGRAFIA_SEMINARIO_Y_ATLAS_APA7.md" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar .md</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Marco Tripartito de Licenciamiento Abierto -->
            <div class="bloque" id="sec-lic-marco-tripartito" style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 6px 0; color:#fbbf24; font-size:1.05rem;">Marco Tripartito de Licenciamiento Abierto (Atlas VGI Territorial)</h4>
              <p class="descripcion" style="margin:0 0 12px 0; font-size:0.87rem; color:var(--tinta-suave); line-height:1.6;">
                Se descarta expresamente la licencia permisiva MIT para el proyecto. En el contexto de los datos públicos y la Información Geográfica Voluntaria en Chile, MIT permite que actores privados cierren el código y monopolicen la cartografía comunitaria. En su lugar, se adopta un marco de <strong>copyleft y reciprocidad obligatoria</strong> fundamentado en la Ley N° 17.336 de Propiedad Intelectual y la Ley N° 20.285 de Transparencia y Acceso a la Información Pública:
              </p>

              <div class="contenedor-tabla-responsiva">
                <table class="tabla-datos" style="width:100%; font-size:0.86rem; min-width:720px;">
                  <thead>
                    <tr>
                      <th style="min-width:180px;">Ámbito del Proyecto</th>
                      <th style="min-width:210px;">Licencia Abierta Aplicada</th>
                      <th style="min-width:280px;">Términos de Reciprocidad y Uso</th>
                      <th style="min-width:110px;">Texto Legal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Documentación, Manuales y Cartografías</strong></td>
                      <td><span class="badge-licencia cc">CC BY-SA 4.0</span><br><small>Creative Commons Atribución-CompartirIgual 4.0</small></td>
                      <td>Permite compartir y adaptar las obras siempre que se reconozca la autoría y las obras derivadas se distribuyan bajo la misma licencia idéntica (Share-Alike).</td>
                      <td><a href="https://creativecommons.org/licenses/by-sa/4.0/deed.es" target="_blank" rel="noopener" class="enlace-externo">Ver licencia ↗</a></td>
                    </tr>
                    <tr>
                      <td><strong>Bases de Datos Espaciales y Capas IGV</strong></td>
                      <td><span class="badge-licencia odbl">ODbL 1.0</span><br><small>Open Database License v1.0</small></td>
                      <td>Compatibilidad nativa con la OpenStreetMap Foundation (OSMF). Cualquier base geográfica enriquecida debe compartirse bajo ODbL manteniendo atribución colectiva.</td>
                      <td><a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener" class="enlace-externo">Ver licencia ↗</a></td>
                    </tr>
                    <tr>
                      <td><strong>Código Fuente del Visor y Procesamiento</strong></td>
                      <td><span class="badge-licencia agpl">GNU AGPLv3</span><br><small>GNU Affero General Public License v3.0</small></td>
                      <td>Diseñada para software de red y plataformas web. Si se aloja una versión modificada del visor en un servidor, existe la obligación legal de liberar el código modificado a la comunidad.</td>
                      <td><a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener" class="enlace-externo">Ver licencia ↗</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Navegación entre módulos de la plataforma -->
            <div style="background:rgba(15,23,42,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <div>
                <h5 style="margin:0 0 4px 0; color:#ffffff; font-size:0.95rem;">Explorar otras secciones del Atlas</h5>
                <p style="margin:0; font-size:0.83rem; color:var(--tinta-suave);">Navegue fluidamente entre las dimensiones analíticas y el visor interactivo:</p>
              </div>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.82rem; padding:8px 14px;">
                  📊 Abrir Módulo 01: Análisis
                </button>
                <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.82rem; padding:8px 14px;">
                  🗺️ Abrir Módulo 02: Explorar Mapa
                </button>
              </div>
            </div>

          </div>
        `
      },
      {
        id: 'cap-uso-05',
        numero: 'USO · 05',
        icono: '🗂️',
        titulo: `Inventario General de las ${totalCapas} Coberturas Integradas (123 Oficiales + 171 IGV)`,
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
      'diccionario': 'manual',
      'licencias': 'manual',
      'documentacion': 'manual',
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
