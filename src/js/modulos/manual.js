/*
  manual.js
  ---------
  Módulo 03: Documentación Interactiva del Atlas para la Gestión Territorial.
  Navegable por capítulos, con buscador en tiempo real, acceso directo a los módulos,
  inventario dinámico de las 294 coberturas (123 oficiales + 171 IGV descentralizadas),
  entregables verificados, arquitectura, flujos de trabajo y descargas maestras.
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
    const catalogoIGV = (typeof window !== 'undefined' && Array.isArray(window.CATALOGO_VGI_DESCENTRALIZADO))
      ? window.CATALOGO_VGI_DESCENTRALIZADO
      : [];

    catalogoIGV.forEach((igv, idx) => {
      lista.push({
        num: `IGV-${String(idx + 1).padStart(3, '0')}`,
        id: igv.id,
        claveId: 'id_igv',
        nombre: igv.nombre,
        institucion: igv.institucion || 'OpenStreetMap / GBIF (IGV)',
        tipo: 'Colaborativa IGV',
        geometria: igv.geometria || 'Puntos',
        archivo: igv.archivoLocal || `data/capa_${igv.id}.geojson`,
        descripcion: igv.descripcion || 'Cobertura colaborativa descentralizada de Información Geográfica Voluntaria (IGV).'
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
        claveId: 'id_ig',
        nombre: capa.nombre || capa.id,
        institucion: capa.institucion || 'Estado de Chile (IDE)',
        tipo: 'Oficial Estado',
        geometria: capa.geometria || 'Vectorial',
        archivo: capa.archivoLocal || `data/${capa.id}.geojson`,
        descripcion: capa.descripcion || 'Cobertura oficial del Estado de Chile homologada con perfil de 17 atributos.'
      });
    });

    return lista;
  }

  /**
   * Retorna los 6 capítulos navegables de la Documentación del Atlas para la Gestión Territorial
   */
  function obtenerCapitulosManual() {
    const inventarioCapas = construirInventarioDinamicoCapas();
    const totalCapas = inventarioCapas.length || 294;

    const filasTablaCapas = inventarioCapas.map(c => {
      const colorBadge = c.tipo === 'Colaborativa IGV'
        ? 'background:rgba(6,182,212,0.15); color:#38bdf8; border:1px solid rgba(6,182,212,0.35);'
        : 'background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.35);';
      return `
        <tr class="fila-catalogo-manual" data-busqueda="${(c.num + ' ' + c.id + ' ' + c.claveId + ' ' + c.nombre + ' ' + c.institucion + ' ' + c.descripcion).toLowerCase()}">
          <td style="font-family:monospace; font-weight:700; color:#f59e0b; white-space:nowrap;">${c.num}</td>
          <td><strong>${c.nombre}</strong><br><code style="font-size:0.74rem; color:var(--tinta-tenue);">${c.archivo}</code> · <code style="font-size:0.72rem; color:#38bdf8;">${c.claveId}</code></td>
          <td><span style="padding:2px 8px; border-radius:99px; font-size:0.74rem; font-weight:700; white-space:nowrap; ${colorBadge}">${c.tipo}</span></td>
          <td style="font-size:0.84rem;">${c.institucion}</td>
          <td style="font-size:0.82rem; color:var(--tinta-suave);">${c.descripcion}</td>
        </tr>
      `;
    }).join('');

    return [
      {
        id: 'cap-uso-01',
        numero: 'DOC · 01',
        icono: '🏛️',
        titulo: 'Fundamentación, Objetivos, Entregables Verificados y Cifras Clave',
        subtitulo: 'Marco estratégico, objetivos del proyecto, entregables verificados por objetivo y cifras operativas del Atlas para la Gestión Territorial.',
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

          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px; margin-bottom:16px;">
            <h4 style="margin:0 0 10px 0; color:#fbbf24;">Componentes Ejecutados y Entregables Verificados por Objetivo Específico</h4>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">
              <div style="background:rgba(2,6,23,0.55); border:1px solid rgba(56,189,248,0.25); border-radius:8px; padding:12px;">
                <strong style="color:#38bdf8; font-size:0.88rem;">OE 1 · Caracterización y diseño centrado en el usuario</strong>
                <ul style="margin:6px 0 0 0; padding-left:18px; font-size:0.83rem; color:var(--tinta-suave); line-height:1.55;">
                  <li>Revisión de plataformas de geodatos abiertos (OpenStreetMap, GBIF e IDE Chile).</li>
                  <li>Organización temática del catálogo en las <strong>5 dimensiones analíticas</strong> del territorio.</li>
                  <li>Caracterización de los cuatro perfiles de actores territoriales e inventario de brechas de información.</li>
                  <li><em>Entregables verificados:</em> <code>docs/ARQUITECTURA.md</code>, <code>docs/TRAZABILIDAD.md</code>, <code>docs/catalogo_fuentes_vgi.xlsx</code> y <code>docs/categorias_tematicas_osm.xlsx</code>.</li>
                </ul>
              </div>
              <div style="background:rgba(2,6,23,0.55); border:1px solid rgba(52,211,153,0.25); border-radius:8px; padding:12px;">
                <strong style="color:#34d399; font-size:0.88rem;">OE 2 · Geodatabase multipropósito y calidad espacial</strong>
                <ul style="margin:6px 0 0 0; padding-left:18px; font-size:0.83rem; color:var(--tinta-suave); line-height:1.55;">
                  <li>Descarga, normalización y geoprocesamiento de las <strong>294 coberturas vectoriales</strong> (123 oficiales del Estado de Chile y 171 coberturas descentralizadas de Información Geográfica Voluntaria, IGV) en <code>EPSG:4326</code> y <code>EPSG:32719</code>.</li>
                  <li>Homologación del perfil de metadatos y calidad ISO 19157 de <strong>17 atributos</strong> en todas las capas, diferenciando <code>id_ig</code> (información geográfica oficial) e <code>id_igv</code> (información geográfica voluntaria).</li>
                  <li>Cruces espaciales comunales y barriales sintetizados en las 5 dimensiones analíticas.</li>
                  <li><em>Entregables verificados:</em> <code>src/data/*.geojson</code> (294 capas), <code>docs/perfil_metadatos_vgi.xlsx</code> y matrices de síntesis territorial.</li>
                </ul>
              </div>
              <div style="background:rgba(2,6,23,0.55); border:1px solid rgba(168,85,247,0.25); border-radius:8px; padding:12px;">
                <strong style="color:#c084fc; font-size:0.88rem;">OE 3 · Geoportal web accesible e interoperable</strong>
                <ul style="margin:6px 0 0 0; padding-left:18px; font-size:0.83rem; color:var(--tinta-suave); line-height:1.55;">
                  <li><strong>Definición de un prototipo sintetizado para usuarios no técnicos:</strong> prototipo más sintetizado que permita a usuarios sin experiencia técnica poder interactuar de forma más simple con la plataforma, articulado en 3 módulos (<em>Módulo 01 Análisis</em>, <em>Módulo 02 Explorar Mapa</em> y <em>Módulo 03 Documentación</em>).</li>
                  <li>Visor cartográfico cuadrado (Leaflet 1.9.4) con mapas base abiertos de OpenStreetMap e imágenes satelitales de Bing, Microsoft y Esri, simbología estadística dinámica (<em>Natural Breaks</em> / Jenks) y panel inferior de <strong>Detalles</strong>.</li>
                  <li>Inspector normativo del Plan Regulador Comunal (PRC) y OGUC, y 4 ejes de diagnóstico geoestadístico con 83 cartografías temáticas.</li>
                  <li><em>Entregables verificados:</em> <code>src/index.html</code>, <code>src/css/estilos.css</code>, <code>src/js/modulos/mapa.js</code>, <code>evaluador_normativo.js</code>, <code>indicadores_analisis.js</code> y <code>netlify.toml</code>.</li>
                </ul>
              </div>
              <div style="background:rgba(2,6,23,0.55); border:1px solid rgba(245,158,11,0.25); border-radius:8px; padding:12px;">
                <strong style="color:#fbbf24; font-size:0.88rem;">OE 4 · Evaluación de usabilidad y transferibilidad</strong>
                <ul style="margin:6px 0 0 0; padding-left:18px; font-size:0.83rem; color:var(--tinta-suave); line-height:1.55;">
                  <li>Evaluación de usabilidad (Modalidad 1) y conversaciones situadas con vecinos (Modalidad 2) con los cuatro perfiles de actores territoriales.</li>
                  <li>Tutorial interactivo navegable de 18 pasos con presentación de cada módulo y glosario permanente de siglas.</li>
                  <li>Documentación navegable en la plataforma y en Git (Manual de uso, Manual de actualización y Arquitectura) y empaquetado de la geodatabase completa (<code>.zip</code>).</li>
                  <li><em>Entregables verificados:</em> <code>docs/MANUAL_USO.md</code>, <code>docs/MANUAL_ACTUALIZACION_ATLAS.md</code>, <code>src/js/modulos/tutorial_interactivo.js</code> y <code>docs/geodatabase_completa_atlas_vgi.zip</code>.</li>
                </ul>
              </div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:14px; margin:16px 0;">
            <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#38bdf8;">294 capas espaciales</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                123 coberturas oficiales del Estado de Chile (<code>id_ig</code>) y 171 coberturas de Información Geográfica Voluntaria (<code>id_igv</code>) descentralizadas en español.
              </div>
            </div>
            <div style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#c084fc;">83 cartografías temáticas</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                Estructuradas en 4 ejes de diagnóstico geoestadístico (KDE, LISA, Sociodemografía y Metabolismo Urbano) y 5 Dimensiones Analíticas.
              </div>
            </div>
            <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#fbbf24;">17 atributos homologados</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                Perfil de metadatos y calidad ISO 19157/19115 integrado en todas las capas oficiales (<code>id_ig</code>) y colaborativas (<code>id_igv</code>) dentro del panel <em>Detalles</em>.
              </div>
            </div>
            <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#34d399;">18 pasos de inducción</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                Tutorial interactivo navegable por módulos y pasos que presenta cada módulo antes de recorrer sus componentes.
              </div>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.4); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; margin-top:16px;">
            <h4 style="margin:0 0 10px 0; color:#ffffff; font-size:0.95rem;">🧭 Navegación Directa por la Plataforma y Capítulos Documentales</h4>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              <button type="button" class="accion" onclick="if(window.iniciarTutorialInteractivo) window.iniciarTutorialInteractivo();" style="font-size:0.82rem; padding:7px 12px; background:linear-gradient(135deg, #0284c7, #0369a1); color:#ffffff;">🎓 Iniciar Tutorial Interactivo (18 pasos)</button>
              <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.82rem; padding:7px 12px;">📊 Ir al Módulo 01 · Análisis</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.82rem; padding:7px 12px;">🗺️ Ir al Módulo 02 · Explorar Mapa</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irACapitulo('cap-uso-04')" style="font-size:0.82rem; padding:7px 12px;">⚖️ Capítulo 04 · Licencias y Catálogos Excel</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irACapitulo('cap-uso-05')" style="font-size:0.82rem; padding:7px 12px;">🗂️ Capítulo 05 · Inventario de 294 Capas</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irACapitulo('cap-uso-06')" style="font-size:0.82rem; padding:7px 12px;">⚙️ Capítulo 06 · Arquitectura y Actualización</button>
              <button type="button" class="accion" onclick="if(document.getElementById('btn-descargar-bd-mapa')){document.getElementById('btn-descargar-bd-mapa').click();}" style="font-size:0.82rem; padding:7px 12px; background:linear-gradient(135deg, #10b981, #059669); color:#ffffff;">📦 Descargar Base de Datos (.zip)</button>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-02',
        numero: 'DOC · 02',
        icono: '📊',
        titulo: 'Guía del Módulo 01: Análisis Territorial, Ejes Geoestadísticos y 5 Dimensiones',
        subtitulo: 'Cómo interpretar los 4 ejes de diagnóstico geoestadístico (83 cartografías) y activar coberturas desde las 5 Dimensiones Analíticas.',
        html: `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                <h4 style="margin:0; color:#38bdf8; font-size:1.05rem;">1. Cuatro Ejes de Diagnóstico Geoestadístico (83 Cartografías)</h4>
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.8rem; padding:6px 12px;">Ir al Módulo 01 · Análisis ↗</button>
              </div>
              <p style="margin:0 0 12px 0; color:var(--tinta-suave); font-size:0.9rem; line-height:1.65;">
                El Módulo 01 presenta la evidencia geoestadística procesada sobre el Municipio de Santiago y el Barrio Brasil a partir de <strong>83 cartografías temáticas</strong> organizadas en 4 láminas interactivas con visor ampliable y matriz de utilidad para los 4 perfiles de actores territoriales:
              </p>

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(310px, 1fr)); gap:12px; margin-top:10px;">
                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#38bdf8; text-transform:uppercase;">Lámina 01 · Densidad Continua (14 mapas)</span>
                    <h5 style="margin:4px 0 6px 0; font-size:0.95rem; color:#ffffff;">Concentración Territorial de Actividad IGV en Santiago</h5>
                    <p style="font-size:0.83rem; color:var(--tinta-suave); line-height:1.55; margin:0;">
                      Estimación de densidad por núcleo (KDE) sobre 79.841 entidades geométricas y 112.264 nodos en malla de 20 m, contrastando la concentración en el eje Alameda y Barrio Brasil frente a los sectores sur y suroriente de la comuna.
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-densidad-kernel-kde')" style="margin-top:10px; font-size:0.78rem; padding:6px 10px;">Abrir Lámina 1 (KDE) ↗</button>
                </div>

                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#fbbf24; text-transform:uppercase;">Lámina 02 · Autocorrelación Espacial (11 mapas)</span>
                    <h5 style="margin:4px 0 6px 0; font-size:0.95rem; color:#ffffff;">Segregación Espacial, Hotspots y Áreas de Rezago (LISA)</h5>
                    <p style="font-size:0.83rem; color:var(--tinta-suave); line-height:1.55; margin:0;">
                      Indicadores locales de asociación espacial (Anselin, 1995) sobre las 1.711 manzanas censales de Santiago, identificando clústeres estadísticos Alto-Alto (HH), bolsones Bajo-Bajo (LL) y brechas de cobertura.
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-autocorrelacion-lisa')" style="margin-top:10px; font-size:0.78rem; padding:6px 10px;">Abrir Lámina 2 (LISA) ↗</button>
                </div>

                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(168,85,247,0.3); border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#c084fc; text-transform:uppercase;">Lámina 03 · Demografía y Vivienda (34 mapas)</span>
                    <h5 style="margin:4px 0 6px 0; font-size:0.95rem; color:#ffffff;">Estructura Sociodemográfica, Habitabilidad y Morfología Urbana</h5>
                    <p style="font-size:0.83rem; color:var(--tinta-suave); line-height:1.55; margin:0;">
                      Caracterización del Censo 2024, vulnerabilidad del Registro Social de Hogares (RSH), tipologías de edificación, arriendo, cités y zonas de conservación histórica en Barrio Brasil y Yungay.
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-demografia-habitabilidad-sociourbana')" style="margin-top:10px; font-size:0.78rem; padding:6px 10px;">Abrir Lámina 3 (Demografía) ↗</button>
                </div>

                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(52,211,153,0.3); border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#34d399; text-transform:uppercase;">Lámina 04 · Medio Ambiente y Servicios (24 mapas)</span>
                    <h5 style="margin:4px 0 6px 0; font-size:0.95rem; color:#ffffff;">Metabolismo Urbano, Movilidad y Espacio Público</h5>
                    <p style="font-size:0.83rem; color:var(--tinta-suave); line-height:1.55; margin:0;">
                      Accesibilidad caminable a áreas verdes y salud, arbolado urbano, ruido ambiental (&gt;68 dBA) en corredores viales y gestión de residuos sólidos en las 5 zonas de aseo municipal.
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-socioambiental-movilidad-servicios')" style="margin-top:10px; font-size:0.78rem; padding:6px 10px;">Abrir Lámina 4 (Metabolismo) ↗</button>
                </div>
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#34d399; font-size:1.05rem;">2. Las 5 Dimensiones Analíticas y el Explorador de 294 Capas</h4>
              <p style="margin:0 0 10px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                La totalidad de las <strong>294 coberturas espaciales</strong> (123 oficiales + 171 de IGV descentralizadas) se agrupa en <strong>5 Dimensiones Analíticas</strong>, accesibles tanto en el Módulo 01 como en el visor del Módulo 02:
              </p>
              <ul style="margin:0 0 14px 0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                <li><strong>1. Dimensión Sociodemográfica y Habitacional:</strong> Censo 2024, vulnerabilidad social (RSH), tipologías de vivienda, hacinamiento, arriendo y permisos/recepciones habitacionales del INE.</li>
                <li><strong>2. Dimensión Socioeconómica y Comercial:</strong> Iniciativas de inversión pública (BIP / MOP), comercio barrial colaborativo, ferias libres, mercados y redes de telecomunicaciones.</li>
                <li><strong>3. Dimensión Socioambiental y Espacio Público:</strong> Infraestructura verde urbana, arbolado y biodiversidad ciudadana (GBIF), ruido ambiental y gestión de residuos sólidos municipales.</li>
                <li><strong>4. Dimensión Sociosanitaria y Salud:</strong> Red asistencial de salud pública (CESFAM y hospitales), farmacias, desfibriladores (DEA) y cobertura territorial sanitaria.</li>
                <li><strong>5. Dimensión Sociourbana, Movilidad y Normativa:</strong> Zonificación del Plan Regulador Comunal (PRC Santiago), patrimonio protegido (ZCH/ICH), transporte público (Metro, Red), ciclovías y accesibilidad universal.</li>
              </ul>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.82rem; padding:8px 14px;">📊 Explorar Dimensiones en Módulo 01 ↗</button>
                <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.82rem; padding:8px 14px;">🗺️ Abrir Visor Cartográfico (Módulo 02) ↗</button>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-03',
        numero: 'DOC · 03',
        icono: '🗺️',
        titulo: 'Guía del Módulo 02: Explorar Mapa, Simbología Dinámica y Panel de Detalles',
        subtitulo: 'Visor cartográfico cuadrado (Leaflet 1.9.4), mapas base de OpenStreetMap, Bing/Microsoft y Esri, Inspector PRC y perfil de 17 atributos (id_ig / id_igv).',
        html: `
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
                <h4 style="margin:0; color:#38bdf8; font-size:1.05rem;">1. Visor Cuadrado de Alta Proporción y Mapas Base sin Claves de API</h4>
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.8rem; padding:6px 12px;">Abrir Módulo 02 · Explorar Mapa ↗</button>
              </div>
              <p style="margin:0 0 10px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                El Módulo 02 dispone un lienzo cartográfico de proporción amplia y cuadrada para priorizar la lectura espacial del territorio, acompañado de una barra de herramientas centrada y adaptable a cualquier resolución de pantalla. Se eliminaron los mapas base de Carto (que requieren API Key) y se integraron <strong>5 mapas base abiertos y satelitales</strong>:
              </p>
              <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                <li><strong>OpenStreetMap Estándar (Predeterminado):</strong> Cartografía colaborativa con toponimia barrial completa, equipamiento urbano, ciclovías y numeración predial.</li>
                <li><strong>OpenStreetMap Humanitario (HOT):</strong> Estilo de alto contraste orientado a equipamiento comunitario, servicios críticos y gestión territorial.</li>
                <li><strong>Imagen Satelital (Bing / Microsoft):</strong> Ortoimágenes satelitales de alta resolución servidas mediante teselas QuadKey de Microsoft VirtualEarth.</li>
                <li><strong>Satelital Híbrido con Calles (Bing / Microsoft):</strong> Mosaico aéreo de Bing/Microsoft con superposición de ejes viales y toponimia en español.</li>
                <li><strong>Imagen Satelital (Esri World Imagery):</strong> Cobertura satelital multiescalar provista por Esri, Maxar y Earthstar Geographics.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(16,185,129,0.4); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#34d399; font-size:1.05rem;">2. Motor de Simbología Estadística Dinámica (Natural Breaks / Jenks)</h4>
              <p style="margin:0 0 10px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Cada una de las <strong>294 coberturas</strong> se representa con simbología automática adaptada a su naturaleza geométrica y dimensión analítica, pudiendo personalizarse en vivo desde el panel <em>Simbología Dinámica</em>:
              </p>
              <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                <li><strong>Clasificación cuantitativa:</strong> Cortes Naturales de <strong>Jenks</strong>, Cuantiles, Intervalos Iguales o Desviación Estándar (de 3 a 7 clases).</li>
                <li><strong>Clasificación cualitativa:</strong> Simbología categorizada por atributo nominal (zonificación PRC, tipologías de equipamiento, jerarquía vial).</li>
                <li><strong>Exportación con estilos embebidos:</strong> El botón <em>Exportar vista (GeoJSON)</em> incorpora en cada entidad los colores y parámetros gráficos activos para conservar la simbología al abrir el archivo en QGIS o ArcGIS.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#38bdf8; font-size:1.05rem;">3. Panel Inferior de "Detalles" y Perfil Homologado de 17 Atributos (<code>id_ig</code> / <code>id_igv</code>)</h4>
              <p style="margin:0 0 8px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Ubicado inmediatamente debajo del mapa para otorgar máximo protagonismo al lienzo visual y amplitud de lectura a las tablas técnicas, el panel <strong>Detalles</strong> muestra al seleccionar cualquier entidad:
              </p>
              <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                <li><strong>Identificador normativo diferenciado:</strong> Las 123 capas oficiales utilizan el campo primario <code>id_ig</code> (Información Geográfica Oficial), mientras que las 171 capas colaborativas utilizan <code>id_igv</code> (Información Geográfica Voluntaria).</li>
                <li><strong>Perfil de 17 atributos y calidad ISO 19157:</strong> Incluye nombre, categoría/dimensión, subtipo, fuente, institución custodia, licencia, escala, sistema de referencia (<code>EPSG:4326</code> / <code>EPSG:32719</code>), superficie o longitud métrica, fecha de actualización y métricas de completitud, consistencia lógica y exactitud posicional.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(245,158,11,0.4); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#fbbf24; font-size:1.05rem;">4. Inspector Normativo (PRC) y Delimitación Geodésica UTM 19S</h4>
              <p style="margin:0 0 8px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                La barra superior del visor permite alternar entre las escalas <em>Barrio Brasil Completo</em> y <em>Comuna de Santiago</em>, activar <strong>Delimitar área</strong> (que reproyecta las coordenadas al vuelo a <code>EPSG:32719</code> UTM Huso 19 Sur para calcular hectáreas y m² reales) y activar el <strong>Inspector normativo (PRC)</strong>, cuya información regulatoria se despliega exclusivamente cuando el usuario lo consulta sobre un punto o predio del mapa.
              </p>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-04',
        numero: 'DOC · 04',
        icono: '⚖️',
        titulo: 'Licencias Abiertas, Descarga de Geodatabase (.zip) y Catálogos en Excel',
        subtitulo: 'Marco jurídico de datos abiertos (CC BY 4.0, CC BY-SA 4.0, ODbL 1.0, GNU AGPLv3 y Ley N° 20.285/21.180), paquete maestro .zip y libros OpenXML.',
        html: `
          <div style="display:flex; flex-direction:column; gap:18px;">
            <div class="bloque" id="sec-lic-descargas-maestras" style="border-left:4px solid #10b981; background:rgba(16,185,129,0.06); padding:18px; border-radius:10px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px; margin-bottom:12px;">
                <div style="flex:1; min-width:280px;">
                  <span style="font-size:0.75rem; font-weight:800; color:#34d399; text-transform:uppercase; letter-spacing:0.05em;">ACCESO ABIERTO // DESCARGA INTEGRAL</span>
                  <h3 style="margin:4px 0 6px 0; color:#ffffff; font-size:1.25rem;">📦 Geodatabase Completa del Atlas para la Gestión Territorial (.zip)</h3>
                  <p class="descripcion" style="margin:0; font-size:0.89rem; color:var(--tinta-suave); line-height:1.6;">
                    El paquete consolidado incluye las <strong>294 coberturas espaciales operativas</strong> (171 capas colaborativas de IGV descentralizadas + 123 capas oficiales del Estado de Chile), los libros maestros en Excel y la documentación técnica (<strong>542,35 MB comprimido / ~3,33 GB descomprimido</strong>).
                  </p>
                </div>
                <div>
                  <a href="docs/geodatabase_completa_atlas_vgi.zip" download="geodatabase_completa_atlas_vgi.zip" class="accion primaria-cta" style="background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; font-weight:800; padding:10px 20px; border-radius:8px; display:inline-flex; align-items:center; gap:8px; text-decoration:none; box-shadow:0 4px 14px rgba(16,185,129,0.35);">
                    ⬇️ Descargar Geodatabase Completa (.zip · 542 MB)
                  </a>
                </div>
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 6px 0; color:#38bdf8; font-size:1.05rem;">Catálogos Estructurados y Libros de Datos Disponibles para Descarga</h4>
              <p style="margin:0 0 12px 0; font-size:0.86rem; color:var(--tinta-suave);">Tablas maestras con las 5 dimensiones analíticas, el perfil homologado de 17 atributos (<code>id_ig</code> / <code>id_igv</code>), metadatos ISO 19115 y bibliografía:</p>
              
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
                      <td><strong>Dimensiones y Diccionario de Capas</strong><br><code class="codigo-licencia">docs/categorias_tematicas_osm.xlsx</code></td>
                      <td>Organización de las 5 dimensiones analíticas, descriptores de las 171 capas de IGV descentralizadas, esquema de 17 atributos normalizados y referencias APA 7ª ed.</td>
                      <td>Excel (<code>.xlsx</code>) · ~52 KB</td>
                      <td><a href="docs/categorias_tematicas_osm.xlsx" download="categorias_tematicas_osm.xlsx" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar Excel</a></td>
                    </tr>
                    <tr>
                      <td><strong>Perfil de Metadatos y Calidad (ISO 19115 / 19157)</strong><br><code class="codigo-licencia">docs/perfil_metadatos_vgi.xlsx</code></td>
                      <td>Matriz técnica de homologación de los 17 atributos (<code>id_ig</code> e <code>id_igv</code>) con ISO 19115 / IDE Chile SNIT y catálogo de variables territoriales.</td>
                      <td>Excel (<code>.xlsx</code>) · ~31 KB</td>
                      <td><a href="docs/perfil_metadatos_vgi.xlsx" download="perfil_metadatos_vgi.xlsx" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar Excel</a></td>
                    </tr>
                    <tr>
                      <td><strong>Catálogo Sistemático de Fuentes</strong><br><code class="codigo-licencia">docs/catalogo_fuentes_vgi.xlsx</code></td>
                      <td>Inventario exhaustivo de las 294 fuentes oficiales e IGV con escala, cobertura, licenciamiento y aplicación territorial.</td>
                      <td>Excel (<code>.xlsx</code>) · ~39 KB</td>
                      <td><a href="docs/catalogo_fuentes_vgi.xlsx" download="catalogo_fuentes_vgi.xlsx" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar Excel</a></td>
                    </tr>
                    <tr>
                      <td><strong>Bibliografía y Estado del Arte</strong><br><code class="codigo-licencia">docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md</code></td>
                      <td>125 referencias bibliográficas estructuradas bajo norma APA 7ª edición sobre IGV, ordenamiento territorial y ciencia de datos espaciales.</td>
                      <td>Markdown (<code>.md</code>) · ~81 KB</td>
                      <td><a href="docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md" download="BIBLIOGRAFIA_SEMINARIO_Y_ATLAS_APA7.md" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar .md</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bloque" id="sec-lic-marco-tripartito" style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 6px 0; color:#fbbf24; font-size:1.05rem;">Marco de Licenciamiento Abierto (Atlas para la Gestión Territorial)</h4>
              <p class="descripcion" style="margin:0 0 12px 0; font-size:0.87rem; color:var(--tinta-suave); line-height:1.6;">
                En coherencia con el pie de página de la plataforma, el proyecto adopta un régimen jurídico abierto fundamentado en la Ley N° 17.336 de Propiedad Intelectual, la Ley N° 20.285 sobre Acceso a la Información Pública y la Ley N° 21.180 de Transformación Digital del Estado:
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
                      <td><strong>Plataforma, Documentación y Síntesis Cartográfica</strong></td>
                      <td><span class="badge-licencia cc">CC BY 4.0 / CC BY-SA 4.0</span><br><small>Creative Commons Internacional</small></td>
                      <td>Permite compartir, reutilizar y adaptar la documentación y las láminas analíticas citando la autoría del Atlas para la Gestión Territorial.</td>
                      <td><a href="https://creativecommons.org/licenses/by/4.0/deed.es" target="_blank" rel="noopener" class="enlace-externo">Ver licencia ↗</a></td>
                    </tr>
                    <tr>
                      <td><strong>Coberturas de Información Geográfica Voluntaria (IGV)</strong></td>
                      <td><span class="badge-licencia odbl">ODbL 1.0 / CC BY 4.0</span><br><small>Open Database License v1.0 &amp; Darwin Core</small></td>
                      <td>Compatibilidad con OpenStreetMap Foundation (ODbL 1.0) y GBIF (CC BY 4.0 / CC0). Mantiene la atribución colectiva de las comunidades mapeadoras.</td>
                      <td><a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener" class="enlace-externo">Ver licencia ↗</a></td>
                    </tr>
                    <tr>
                      <td><strong>Coberturas Oficiales del Estado y Código Fuente</strong></td>
                      <td><span class="badge-licencia agpl">Ley N° 20.285 / GNU AGPLv3</span><br><small>Datos Públicos IDE Chile &amp; Software Abierto</small></td>
                      <td>Reutilización abierta de las 123 capas públicas (IDE Chile, INE, MINVU, MuniStgo) y reciprocidad del código fuente en red bajo GNU AGPLv3.</td>
                      <td><a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener" class="enlace-externo">Ver licencia ↗</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-05',
        numero: 'DOC · 05',
        icono: '🗂️',
        titulo: `Inventario General de las ${totalCapas} Coberturas Integradas (123 Oficiales + 171 IGV)`,
        subtitulo: 'Registro completo de las 294 capas operativas con filtrado dinámico en tiempo real por código (BBDD / IGV), clave primaria (id_ig / id_igv), custodio o temática.',
        html: `
          <div style="margin-bottom:12px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <input type="text" id="filtro-catalogo-manual-input" placeholder="🔍 Filtrar las 294 capas por código (IGV-001, BBDD-01), nombre, id_ig, id_igv o custodio..." oninput="ModuloManual.filtrarTablaCatalogo(this.value)" style="flex:1; min-width:260px; padding:8px 12px; border-radius:6px; border:1px solid var(--linea); background:var(--fondo-tarjeta); color:var(--tinta); font-size:0.88rem;">
            <span style="font-size:0.85rem; color:var(--tinta-suave);">Total registradas: <strong>${totalCapas}</strong> (123 Oficiales <code>id_ig</code> + 171 IGV <code>id_igv</code>)</span>
          </div>
          <div style="overflow-x:auto; max-height:520px; border:1px solid var(--linea-tarjeta); border-radius:8px;">
            <table class="tabla-sintesis" style="width:100%; border-collapse:collapse; font-size:0.84rem;">
              <thead style="position:sticky; top:0; background:rgba(15,23,42,0.95); z-index:2;">
                <tr>
                  <th style="padding:10px; text-align:left; border-bottom:1px solid var(--linea);">Cód.</th>
                  <th style="padding:10px; text-align:left; border-bottom:1px solid var(--linea);">Nombre, archivo y clave ID</th>
                  <th style="padding:10px; text-align:left; border-bottom:1px solid var(--linea);">Régimen</th>
                  <th style="padding:10px; text-align:left; border-bottom:1px solid var(--linea);">Custodio / Origen</th>
                  <th style="padding:10px; text-align:left; border-bottom:1px solid var(--linea);">Descripción temática</th>
                </tr>
              </thead>
              <tbody id="tbody-catalogo-manual">
                ${filasTablaCapas}
              </tbody>
            </table>
          </div>
        `
      },
      {
        id: 'cap-uso-06',
        numero: 'DOC · 06',
        icono: '⚙️',
        titulo: 'Arquitectura del Sistema, Flujos de Trabajo y Guía de Actualización Técnica',
        subtitulo: 'Estructura de los 3 módulos, flujo de datos de las 294 capas, motor geodésico EPSG:4326 ↔ EPSG:32719 y protocolo para actualizar o adaptar el Atlas.',
        html: `
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#38bdf8; font-size:1.05rem;">1. Arquitectura Modular de Tres Componentes Funcionales</h4>
              <p style="margin:0 0 10px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                El <strong>Atlas para la Gestión Territorial</strong> implementa una arquitectura web estática, rápida y sin requerimiento de compiladores pesados (JavaScript ES6+ modular), articulada en 3 módulos sincronizados con un repositorio cartográfico simétrico (<code>data/</code> ↔ <code>src/data/</code> y <code>docs/</code> ↔ <code>src/docs/</code>):
              </p>
              <div class="contenedor-tabla-responsiva">
                <table class="tabla-datos" style="width:100%; font-size:0.85rem; min-width:680px;">
                  <thead>
                    <tr>
                      <th>Módulo</th>
                      <th>Panel DOM (<code>src/index.html</code>)</th>
                      <th>Controladores Principales (<code>src/js/</code>)</th>
                      <th>Función Operativa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Cabecera Transversal</strong></td>
                      <td><code>#cabecera-atlas</code></td>
                      <td><code>app.js</code>, <code>modulos/tutorial_interactivo.js</code></td>
                      <td>Identidad institucional inmutable, <strong>Tutorial interactivo</strong> navegable de 18 pasos (a la izquierda del título) y <strong>Glosario de siglas</strong> (a la derecha del título).</td>
                    </tr>
                    <tr>
                      <td><strong>Módulo 01 · Análisis</strong></td>
                      <td><code>#panel-indicadores</code></td>
                      <td><code>modulos/indicadores_analisis.js</code>, <code>modulos/catalogo_vgi_descentralizado.js</code></td>
                      <td>4 ejes de diagnóstico geoestadístico (83 cartografías KDE/LISA/Censo/Metabolismo), 5 dimensiones analíticas y acordeón explorador de las 294 capas.</td>
                    </tr>
                    <tr>
                      <td><strong>Módulo 02 · Explorar Mapa</strong></td>
                      <td><code>#panel-inicio</code></td>
                      <td><code>modulos/mapa.js</code>, <code>modulos/ide_chile.js</code>, <code>modulos/simbologia_dinamica.js</code>, <code>modulos/evaluador_normativo.js</code>, <code>modulos/geodesia.js</code></td>
                      <td>Visor cuadrado Leaflet 1.9.4, 5 mapas base (OSM, Bing/Microsoft, Esri), delimitación geodésica UTM 19S, Inspector PRC, simbología Jenks y panel inferior de <strong>Detalles</strong> (17 atributos con <code>id_ig</code> / <code>id_igv</code>).</td>
                    </tr>
                    <tr>
                      <td><strong>Módulo 03 · Documentación</strong></td>
                      <td><code>#panel-manual</code></td>
                      <td><code>modulos/manual.js</code>, <code>modulos/licencias.js</code></td>
                      <td>Documentación navegable en 6 capítulos con buscador en vivo, descarga de manuales (<code>.docx</code> / <code>.md</code>), catálogos Excel, geodatabase <code>.zip</code> e inventario de 294 capas.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(52,211,153,0.35); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#34d399; font-size:1.05rem;">2. Flujo de Trabajo e Ingeniería de Datos (Input → Procesamiento → Output)</h4>
              <ol style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                <li><strong>Ingesta y Descentralización (Input):</strong> Extracción de las 123 coberturas oficiales (IDE Chile, MINVU, INE Censo 2024, RSH, SUBDERE, UOCT, CMN, SII, MuniStgo) y descentralización de las 171 coberturas de Información Geográfica Voluntaria (IGV desde OpenStreetMap y GBIF) en archivos GeoJSON individuales bajo <code>EPSG:4326</code>.</li>
                <li><strong>Homologación de 17 Atributos y Geodesia (Procesamiento):</strong> Estandarización del esquema de 17 columnas ISO 19115 / ISO 19157 diferenciando <code>id_ig</code> (capas oficiales) e <code>id_igv</code> (capas de IGV), junto con el cálculo geodésico de superficies y perímetros en <code>EPSG:32719</code> (SIRGAS-Chile / UTM Huso 19 Sur) mediante ecuaciones de Redfearn (<code>src/js/modulos/geodesia.js</code>).</li>
                <li><strong>Publicación Estática y Auditoría (Output):</strong> Sincronización entre <code>src/data/</code> y <code>data/</code>, verificación automatizada de las 294 capas (<code>scripts/verificar_conteo_capas.py</code> y <code>scripts/verificar_integridad_despliegue.py</code>) y despliegue inmediato en Netlify (<code>publish = "src"</code>).</li>
              </ol>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(245,158,11,0.35); border-radius:10px; padding:16px;">
              <h4 style="margin:0 0 8px 0; color:#fbbf24; font-size:1.05rem;">3. Protocolo Rápido de Actualización y Replicabilidad Territorial</h4>
              <ul style="margin:0 0 12px 0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                <li><strong>Actualizar o incorporar una capa:</strong> Colocar el archivo <code>.geojson</code> en <code>src/data/</code> (y su espejo en <code>data/</code>) con el esquema de 17 atributos (<code>id_ig</code> si es oficial o <code>id_igv</code> si es colaborativa) y registrarlo en <code>src/js/modulos/ide_chile.js</code> o <code>src/js/modulos/catalogo_vgi_descentralizado.js</code> asignado a una de las 5 dimensiones analíticas.</li>
                <li><strong>Adaptar el Atlas a otra comuna o barrio:</strong> Modificar las cajas delimitadoras (<code>bbox</code>) y centroides en <code>src/js/config.js</code> y <code>config/config.json</code>, ajustar el huso UTM si cambia de longitud en <code>src/js/modulos/geodesia.js</code> y reemplazar las capas normativas del PRC en <code>src/js/modulos/evaluador_normativo.js</code>.</li>
                <li><strong>Ejecutar auditoría local pre-despliegue:</strong> Correr <code>python3 scripts/verificar_conteo_capas.py</code> y <code>python3 scripts/verificar_integridad_despliegue.py</code> antes de publicar en Git.</li>
              </ul>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <a href="docs/MANUAL_ACTUALIZACION_ATLAS.md" download="MANUAL_ACTUALIZACION_ATLAS.md" class="accion" style="font-size:0.82rem; padding:7px 14px;">⬇️ Descargar Manual de Actualización Completo (.md)</a>
                <a href="docs/ARQUITECTURA.md" download="ARQUITECTURA_ATLAS.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 14px;">⬇️ Descargar Documento de Arquitectura (.md)</a>
              </div>
            </div>
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
            <span style="font-size:0.78rem; font-weight:700; color:var(--musgo);">Documentación del Atlas · ${c.numero}</span>
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
            <h3 style="margin:0 0 4px 0; color:#ffffff; font-size:1.15rem;">Documentación del Sistema (Uso, Arquitectura y Actualización)</h3>
            <p style="margin:0; font-size:0.86rem; color:var(--tinta-suave);">Navegue por los 6 capítulos interactivos o descargue los manuales maestros del Atlas para la Gestión Territorial.</p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <a href="docs/MANUAL_USO.md" download="MANUAL_USO_ATLAS.md" class="accion" style="font-size:0.82rem; padding:7px 14px;">
              Descargar Manual de Uso (.md)
            </a>
            <a href="docs/MANUAL_ACTUALIZACION_ATLAS.md" download="MANUAL_ACTUALIZACION_ATLAS.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 12px;" title="Manual de actualización técnica disponible en el repositorio">
              Manual de Actualización (.md)
            </a>
            <a href="docs/ARQUITECTURA.md" download="ARQUITECTURA_ATLAS.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 12px;">
              Arquitectura y Flujos (.md)
            </a>
            <a href="docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md" download="BIBLIOGRAFIA_SEMINARIO_Y_ATLAS_APA7.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 12px;">
              Bibliografía APA (.md)
            </a>
          </div>
        </div>
        <div>
          <input type="search" id="buscador-general-manual" value="${textoBusquedaManual.replace(/"/g, '&quot;')}" placeholder="Buscar en los 6 capítulos de documentación (ej: entregables, dimensiones, id_igv, inspector normativo, arquitectura)..." oninput="ModuloManual.filtrarManual(this.value)" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid var(--linea-fuerte); background:var(--papel); color:var(--tinta); font-size:0.92rem;">
        </div>
      </div>

      <div class="layout-modulo-dividido">
        <aside class="indice-lateral-modulo" aria-label="Índice de capítulos de documentación">
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
