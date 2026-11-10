/*
  manual.js
  ---------
  Módulo 03: Documentación Interactiva del Atlas para la Gestión Territorial.
  Navegable por capítulos (DOC · 01 a DOC · 06), con buscador en tiempo real,
  acceso directo a los módulos y herramientas del Prototipo 02, guía pedagógica
  y técnica en lenguaje claro, inventario dinámico filtrable de las 294 coberturas
  (123 oficiales id_ig + 171 de Información Geográfica Voluntaria id_igv),
  objetivos, los 9 hitos con entregable verificado asociado, arquitectura,
  flujos de trabajo y descargas maestras.
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
   * Retorna los 6 capítulos navegables en profundidad de la Documentación del Atlas para la Gestión Territorial
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
        titulo: 'Fundamentación, Objetivos, Hitos con Entregables Verificados y Perfiles de Uso',
        subtitulo: 'Qué es el Atlas para la Gestión Territorial, cómo articula la información del Estado con la cartografía ciudadana (IGV), cuáles son sus objetivos y cómo aprovecharlo según cada perfil de usuario.',
        html: `
          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px; margin-bottom:16px;">
            <h4 style="margin:0 0 8px 0; color:#38bdf8; font-size:1.05rem;">1. ¿Qué es el Atlas para la Gestión Territorial y qué problema resuelve?</h4>
            <p style="font-size:0.92rem; line-height:1.7; color:var(--tinta-suave); margin:0 0 12px 0;">
              En la planificación urbana y en la vida cotidiana de los barrios suele existir una brecha importante: por un lado, los organismos del Estado (como ministerios, el INE o el municipio) producen cartografía oficial rigurosa sobre censos, planes reguladores e inversiones, pero con ciclos de actualización que pueden tardar varios años; por otro lado, las comunidades de mapeo colaborativo y ciencia ciudadana levantan día a día el detalle fino del territorio (comercios de proximidad, ciclovías, paradas, grifos, accesibilidad peatonal o árboles urbanos), pero esos datos rara vez están cruzados ni homologados bajo las mismas normas técnicas que usa la gestión pública.
            </p>
            <p style="font-size:0.92rem; line-height:1.7; color:var(--tinta-suave); margin:0;">
              El <strong>Atlas para la Gestión Territorial (Análisis y Exploración | Municipio de Santiago y Barrio Brasil)</strong> une ambos mundos en una sola plataforma pública, gratuita y fácil de recorrer. Reúne <strong>294 coberturas cartográficas</strong> —compuestas por <strong>123 capas oficiales del Estado de Chile</strong> (identificadas con la clave <code>id_ig</code>) y <strong>171 capas descentralizadas de Información Geográfica Voluntaria, IGV</strong> (identificadas con la clave <code>id_igv</code>)— organizadas en <strong>5 dimensiones analíticas</strong> y presentadas a través de una arquitectura sintetizada de <strong>3 módulos operativos</strong> para que cualquier persona, con o sin formación en Sistemas de Información Geográfica (SIG), pueda consultar diagnósticos, explorar el mapa y descargar los datos.
            </p>
          </div>

          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px; margin-bottom:16px;">
            <h4 style="margin:0 0 8px 0; color:#38bdf8; font-size:1.05rem;">2. Objetivo general y objetivos específicos del proyecto</h4>
            <p style="font-size:0.93rem; line-height:1.7; color:var(--tinta-suave); margin:0 0 14px 0;">
              <strong>Objetivo general:</strong> Desarrollar un Atlas para la Gestión Territorial reproducible, interoperable y centrado en el usuario, que integre geodatos abiertos, cartografía participativa y herramientas analíticas para subsanar vacíos de información territorial y apoyar la gestión local y la investigación en la Comuna de Santiago y Barrio Brasil.
            </p>
            <h5 style="margin:0 0 8px 0; color:#34d399; font-size:0.95rem;">Objetivos específicos</h5>
            <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.9rem; line-height:1.68;">
              <li><strong>OE 1.</strong> Caracterizar la disponibilidad, la cobertura y los vacíos de información geográfica del área de estudio, y definir las bases taxonómicas y de diseño centrado en el usuario que permitan integrar datos colaborativos e institucionales.</li>
              <li><strong>OE 2.</strong> Consolidar una geodatabase multipropósito que armonice coberturas oficiales e información voluntaria bajo estándares internacionales de calidad y metadatos.</li>
              <li><strong>OE 3.</strong> Implementar un geoportal web accesible e interoperable que permita visualizar cartografía multinivel, consultar el territorio en tiempo real y descargar geodatos abiertos.</li>
              <li><strong>OE 4.</strong> Evaluar la usabilidad y la pertinencia de la plataforma con distintos perfiles de actores territoriales y asegurar su transferibilidad técnica, metodológica y documental.</li>
            </ul>
          </div>

          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px; margin-bottom:16px;">
            <h4 style="margin:0 0 10px 0; color:#fbbf24; font-size:1.05rem;">3. Componentes ejecutados y entregables verificados por objetivo específico</h4>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">
              <div style="background:rgba(2,6,23,0.55); border:1px solid rgba(56,189,248,0.25); border-radius:8px; padding:14px;">
                <strong style="color:#38bdf8; font-size:0.9rem;">OE 1 · Caracterización y diseño centrado en el usuario</strong>
                <ul style="margin:8px 0 0 0; padding-left:18px; font-size:0.84rem; color:var(--tinta-suave); line-height:1.6;">
                  <li>Revisión sistemática de plataformas de geodatos abiertos (OpenStreetMap, GBIF e IDE Chile).</li>
                  <li>Organización temática del catálogo en las <strong>5 dimensiones analíticas</strong> del territorio.</li>
                  <li>Caracterización de los cuatro perfiles de actores territoriales e identificación de brechas de información entre fuentes estatales y comunitarias.</li>
                  <li><em>Entregables verificados:</em> <code>docs/ARQUITECTURA.md</code>, <code>docs/TRAZABILIDAD.md</code>, <code>docs/catalogo_fuentes_vgi.xlsx</code> y <code>docs/categorias_tematicas_osm.xlsx</code>.</li>
                </ul>
              </div>
              <div style="background:rgba(2,6,23,0.55); border:1px solid rgba(52,211,153,0.25); border-radius:8px; padding:14px;">
                <strong style="color:#34d399; font-size:0.9rem;">OE 2 · Geodatabase multipropósito y calidad espacial</strong>
                <ul style="margin:8px 0 0 0; padding-left:18px; font-size:0.84rem; color:var(--tinta-suave); line-height:1.6;">
                  <li>Descarga, normalización y geoprocesamiento de las <strong>294 coberturas vectoriales</strong> (123 oficiales del Estado de Chile y 171 coberturas descentralizadas de Información Geográfica Voluntaria, IGV) en los sistemas de referencia <code>EPSG:4326</code> y <code>EPSG:32719</code>.</li>
                  <li>Homologación del perfil de metadatos y calidad ISO 19157 de <strong>17 atributos</strong> en todas las capas, diferenciando <code>id_ig</code> (información geográfica oficial) e <code>id_igv</code> (información geográfica voluntaria).</li>
                  <li>Cruces espaciales a escala comunal (1.711 manzanas) y barrial (Barrio Brasil) sintetizados en las 5 dimensiones analíticas.</li>
                  <li><em>Entregables verificados:</em> <code>src/data/*.geojson</code> (294 capas), <code>docs/perfil_metadatos_vgi.xlsx</code> y matrices de síntesis territorial.</li>
                </ul>
              </div>
              <div style="background:rgba(2,6,23,0.55); border:1px solid rgba(168,85,247,0.25); border-radius:8px; padding:14px;">
                <strong style="color:#c084fc; font-size:0.9rem;">OE 3 · Geoportal web accesible e interoperable</strong>
                <ul style="margin:8px 0 0 0; padding-left:18px; font-size:0.84rem; color:var(--tinta-suave); line-height:1.6;">
                  <li><strong>Definición de un prototipo sintetizado para usuarios no técnicos:</strong> prototipo más sintetizado que permita a usuarios sin experiencia técnica poder interactuar de forma más simple con la plataforma, articulado en 3 módulos (<em>Módulo 01 Análisis</em>, <em>Módulo 02 Explorar Mapa</em> y <em>Módulo 03 Documentación</em>).</li>
                  <li>Visor cartográfico cuadrado (Leaflet 1.9.4) con 5 mapas base abiertos sin requerimiento de clave API (OpenStreetMap Estándar y HOT, e imágenes satelitales de Bing/Microsoft y Esri), simbología estadística dinámica (<em>Natural Breaks</em> / Jenks) y panel inferior de <strong>Detalles</strong>.</li>
                  <li>Inspector normativo del Plan Regulador Comunal (PRC) y OGUC bajo demanda, y 4 ejes de diagnóstico geoestadístico con 83 cartografías temáticas.</li>
                  <li><em>Entregables verificados:</em> <code>src/index.html</code>, <code>src/css/estilos.css</code>, <code>src/js/modulos/mapa.js</code>, <code>evaluador_normativo.js</code>, <code>indicadores_analisis.js</code> y <code>netlify.toml</code>.</li>
                </ul>
              </div>
              <div style="background:rgba(2,6,23,0.55); border:1px solid rgba(245,158,11,0.25); border-radius:8px; padding:14px;">
                <strong style="color:#fbbf24; font-size:0.9rem;">OE 4 · Evaluación de usabilidad y transferibilidad</strong>
                <ul style="margin:8px 0 0 0; padding-left:18px; font-size:0.84rem; color:var(--tinta-suave); line-height:1.6;">
                  <li>Instrumentos de evaluación de usabilidad con tareas guiadas (Modalidad 1) y conversaciones situadas con vecinos (Modalidad 2) para los cuatro perfiles de actores territoriales.</li>
                  <li>Tutorial interactivo navegable de 18 pasos (a la izquierda del título) que presenta cada módulo antes de recorrer sus herramientas, y glosario permanente de siglas (a la derecha del título).</li>
                  <li>Documentación navegable en la plataforma y en Git (Manual de uso, Manual de actualización y Arquitectura) y empaquetado de la geodatabase completa (<code>.zip</code>).</li>
                  <li><em>Entregables verificados:</em> <code>docs/MANUAL_USO.md</code>, <code>docs/MANUAL_ACTUALIZACION_ATLAS.md</code>, <code>src/js/modulos/tutorial_interactivo.js</code> y <code>docs/geodatabase_completa_atlas_vgi.zip</code>.</li>
                </ul>
              </div>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px; margin-bottom:16px;">
            <h4 style="margin:0 0 10px 0; color:#38bdf8; font-size:1.05rem;">4. Los 9 Hitos del Proyecto con Entregable Verificado Asociado (Hito 1 / E1 a Hito 9 / E9)</h4>
            <p style="font-size:0.86rem; color:var(--tinta-suave); margin:0 0 12px 0; line-height:1.6;">
              En total coherencia con la Carta Gantt oficial del proyecto, el cronograma conserva exclusivamente los <strong>9 hitos que tienen un entregable físico y verificable asociado</strong> en el repositorio Git y en la plataforma en producción:
            </p>
            <div style="overflow-x:auto;">
              <table class="tabla-metadatos" style="width:100%; border-collapse:collapse; font-size:0.83rem;">
                <thead>
                  <tr style="background:rgba(15,23,42,0.85); color:#38bdf8;">
                    <th style="padding:8px; text-align:left;">Hito</th>
                    <th style="padding:8px; text-align:left;">Fecha (♦)</th>
                    <th style="padding:8px; text-align:left;">OE</th>
                    <th style="padding:8px; text-align:left;">Entregable verificado asociado</th>
                    <th style="padding:8px; text-align:left;">Localización verificable en repositorio y web</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style="padding:7px 8px;"><strong>Hito 1</strong></td><td style="padding:7px 8px;">03 sep 2026 ♦</td><td style="padding:7px 8px;">OE 1</td><td style="padding:7px 8px;"><strong>E1 ·</strong> Arquitectura y catálogo inicial de fuentes</td><td style="padding:7px 8px;"><code>docs/ARQUITECTURA.md</code>, <code>docs/catalogo_fuentes_vgi.xlsx</code></td></tr>
                  <tr><td style="padding:7px 8px;"><strong>Hito 2</strong></td><td style="padding:7px 8px;">09 sep 2026 ♦</td><td style="padding:7px 8px;">OE 1</td><td style="padding:7px 8px;"><strong>E2 ·</strong> Cinco dimensiones analíticas y etiquetas IGV</td><td style="padding:7px 8px;"><code>docs/categorias_tematicas_osm.xlsx</code>, <code>src/js/config.js</code></td></tr>
                  <tr><td style="padding:7px 8px;"><strong>Hito 3</strong></td><td style="padding:7px 8px;">16 sep 2026 ♦</td><td style="padding:7px 8px;">OE 1</td><td style="padding:7px 8px;"><strong>E3 ·</strong> Inventario de 294 fuentes y matriz de brechas</td><td style="padding:7px 8px;"><code>docs/catalogo_fuentes_vgi.xlsx</code>, <code>docs/TRAZABILIDAD.md</code></td></tr>
                  <tr><td style="padding:7px 8px;"><strong>Hito 4</strong></td><td style="padding:7px 8px;">08 oct 2026 ♦</td><td style="padding:7px 8px;">OE 2</td><td style="padding:7px 8px;"><strong>E4 ·</strong> Geodatabase de 294 capas y 17 atributos ISO (<code>id_ig</code> / <code>id_igv</code>)</td><td style="padding:7px 8px;"><code>src/data/*.geojson</code>, <code>docs/perfil_metadatos_vgi.xlsx</code>, <code>scripts/db/</code></td></tr>
                  <tr><td style="padding:7px 8px;"><strong>Hito 5</strong></td><td style="padding:7px 8px;">19 oct 2026 ♦</td><td style="padding:7px 8px;">OE 2</td><td style="padding:7px 8px;"><strong>E5 ·</strong> Matriz de síntesis barrial, catastro IGV e inversiones BIP</td><td style="padding:7px 8px;"><code>data/matriz_sintesis_barrio_brasil_manzanas.geojson</code>, <code>data/bip_inversiones_santiago.csv</code></td></tr>
                  <tr><td style="padding:7px 8px;"><strong>Hito 6</strong></td><td style="padding:7px 8px;">27 oct 2026 ♦</td><td style="padding:7px 8px;">OE 3</td><td style="padding:7px 8px;"><strong>E6 ·</strong> Plataforma en 3 módulos y visor cartográfico cuadrado</td><td style="padding:7px 8px;"><code>src/index.html</code>, <code>src/css/estilos.css</code>, <code>src/js/modulos/mapa.js</code></td></tr>
                  <tr><td style="padding:7px 8px;"><strong>Hito 7</strong></td><td style="padding:7px 8px;">04 nov 2026 ♦</td><td style="padding:7px 8px;">OE 3</td><td style="padding:7px 8px;"><strong>E7 ·</strong> Inspector PRC, Detalles, 83 mapas y despliegue en Netlify</td><td style="padding:7px 8px;"><code>evaluador_normativo.js</code>, <code>indicadores_analisis.js</code>, <code>netlify.toml</code></td></tr>
                  <tr><td style="padding:7px 8px;"><strong>Hito 8</strong></td><td style="padding:7px 8px;">09 nov 2026 ♦</td><td style="padding:7px 8px;">OE 4</td><td style="padding:7px 8px;"><strong>E8 ·</strong> Trazabilidad de usabilidad y Módulo 03 navegable</td><td style="padding:7px 8px;"><code>docs/TRAZABILIDAD.md</code>, <code>MANUAL_USO.md</code>, <code>src/js/modulos/manual.js</code></td></tr>
                  <tr><td style="padding:7px 8px;"><strong>Hito 9</strong></td><td style="padding:7px 8px;">12 nov 2026 ♦</td><td style="padding:7px 8px;">OE 4</td><td style="padding:7px 8px;"><strong>E9 ·</strong> Manual técnico, paquete ZIP (542,35 MB) y verificación</td><td style="padding:7px 8px;"><code>MANUAL_ACTUALIZACION_ATLAS.md</code>, <code>docs/geodatabase_completa_atlas_vgi.zip</code></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px; margin-bottom:16px;">
            <h4 style="margin:0 0 10px 0; color:#34d399; font-size:1.05rem;">5. ¿Cómo recorrer el Atlas según tu perfil de interés?</h4>
            <p style="font-size:0.88rem; color:var(--tinta-suave); margin:0 0 12px 0; line-height:1.6;">
              La plataforma fue diseñada considerando cuatro perfiles principales de usuarios. A continuación se sugiere por dónde empezar en cada caso:
            </p>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
              <div style="background:rgba(2,6,23,0.5); border-left:3px solid #38bdf8; border-radius:6px; padding:12px;">
                <strong style="color:#38bdf8; font-size:0.88rem;">🏛️ Equipos Municipales e Instituciones Públicas (SECPLAN, DOM, DIDECO, Ministerios)</strong>
                <p style="font-size:0.82rem; color:var(--tinta-suave); margin:6px 0 0 0; line-height:1.55;">
                  Comience en el <strong>Módulo 01 (Análisis)</strong> revisando la <em>Lámina 02 (Autocorrelación LISA)</em> para identificar manzanas con déficit de servicios y alta vulnerabilidad RSH. Luego pase al <strong>Módulo 02 (Explorar Mapa)</strong> para cruzar la cartera de proyectos BIP con el <strong>Inspector normativo (PRC)</strong> y verificar factibilidad de uso de suelo y protección patrimonial.
                </p>
              </div>
              <div style="background:rgba(2,6,23,0.5); border-left:3px solid #34d399; border-radius:6px; padding:12px;">
                <strong style="color:#34d399; font-size:0.88rem;">🏘️ Vecinas, Vecinos, Juntas de Vecinos y Organizaciones Barriales</strong>
                <p style="font-size:0.82rem; color:var(--tinta-suave); margin:6px 0 0 0; line-height:1.55;">
                  Pulse primero el <strong>Tutorial Interactivo</strong> en la esquina superior izquierda para conocer la plataforma paso a paso. En el <strong>Módulo 01</strong> revise las 5 dimensiones para ver qué equipamientos existen en el Barrio Brasil, y en el <strong>Módulo 02</strong> active las capas de su interés (áreas verdes, luminarias, salud, patrimonio) o consulte qué permite construir el Plan Regulador en su cuadra.
                </p>
              </div>
              <div style="background:rgba(2,6,23,0.5); border-left:3px solid #f59e0b; border-radius:6px; padding:12px;">
                <strong style="color:#fbbf24; font-size:0.88rem;">🗺️ Comunidad de Mapeo Colaborativo y Ciencia Ciudadana (OpenStreetMap / GBIF)</strong>
                <p style="font-size:0.82rem; color:var(--tinta-suave); margin:6px 0 0 0; line-height:1.55;">
                  Consulte la <em>Lámina 01 (Densidad Kernel KDE)</em> en el <strong>Módulo 01</strong> para detectar sectores de la comuna con menor densidad de registros colaborativos (sectores sur y suroriente). En el <strong>Módulo 02</strong> inspeccione cualquiera de las 171 capas <code>id_igv</code> en el panel inferior <strong>Detalles</strong> para revisar su completitud de etiquetas y planificar nuevas campañas de mapeo.
                </p>
              </div>
              <div style="background:rgba(2,6,23,0.5); border-left:3px solid #c084fc; border-radius:6px; padding:12px;">
                <strong style="color:#c084fc; font-size:0.88rem;">🎓 Investigadores, Docentes, Estudiantes y ONG</strong>
                <p style="font-size:0.82rem; color:var(--tinta-suave); margin:6px 0 0 0; line-height:1.55;">
                  Explore las 83 cartografías de alta resolución del <strong>Módulo 01</strong> (Censo 2024, LISA, KDE y metabolismo urbano), utilice el motor de <strong>Simbología Dinámica (Jenks)</strong> en el <strong>Módulo 02</strong> para clasificar variables en vivo y diríjase al capítulo <strong>DOC · 04</strong> de este módulo para descargar la geodatabase completa (<code>.zip</code> de 542,35 MB) y los catálogos en Excel.
                </p>
              </div>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.4); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; margin-top:16px;">
            <h4 style="margin:0 0 10px 0; color:#ffffff; font-size:0.95rem;">🧭 Accesos Rápidos a los Módulos y Capítulos de la Documentación</h4>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              <button type="button" class="accion" onclick="if(window.iniciarTutorialInteractivo) window.iniciarTutorialInteractivo();" style="font-size:0.82rem; padding:7px 12px; background:linear-gradient(135deg, #0284c7, #0369a1); color:#ffffff;">🎓 Iniciar Tutorial Interactivo (18 pasos)</button>
              <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.82rem; padding:7px 12px;">📊 Ir al Módulo 01 · Análisis</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.82rem; padding:7px 12px;">🗺️ Ir al Módulo 02 · Explorar Mapa</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irACapitulo('cap-uso-02')" style="font-size:0.82rem; padding:7px 12px;">📊 DOC · 02 Guía de Análisis</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irACapitulo('cap-uso-03')" style="font-size:0.82rem; padding:7px 12px;">🗺️ DOC · 03 Guía del Mapa</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irACapitulo('cap-uso-04')" style="font-size:0.82rem; padding:7px 12px;">⚖️ DOC · 04 Licencias y Descargas</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irACapitulo('cap-uso-05')" style="font-size:0.82rem; padding:7px 12px;">🗂️ DOC · 05 Inventario de 294 Capas</button>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irACapitulo('cap-uso-06')" style="font-size:0.82rem; padding:7px 12px;">⚙️ DOC · 06 Arquitectura y Actualización</button>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-02',
        numero: 'DOC · 02',
        icono: '📊',
        titulo: 'Guía en Profundidad del Módulo 01: Análisis Territorial, 4 Ejes Geoestadísticos y 5 Dimensiones',
        subtitulo: 'Explicación clara de qué mide cada uno de los 4 ejes geoestadísticos (KDE, LISA, Demografía Censo 2024 y Metabolismo Urbano), cómo leer sus 83 cartografías y cómo explorar las 294 capas por dimensión.',
        html: `
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                <h4 style="margin:0; color:#38bdf8; font-size:1.05rem;">1. ¿Para qué sirve el Módulo 01 (Análisis) y cómo está organizado?</h4>
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.8rem; padding:6px 12px;">Ir al Módulo 01 · Análisis ↗</button>
              </div>
              <p style="margin:0 0 12px 0; color:var(--tinta-suave); font-size:0.9rem; line-height:1.68;">
                El <strong>Módulo 01 · Análisis</strong> es el punto de partida diagnóstico del Atlas. Su propósito es ofrecer una lectura comprensible e inmediata de cómo se distribuyen la población, la vivienda, el equipamiento, el comercio, las áreas verdes y las brechas urbanas en la Comuna de Santiago y en el Barrio Brasil, antes de pasar a la exploración libre en el mapa. Se compone de dos grandes bloques interactivos:
              </p>
              <ol style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                <li><strong>Cuatro Láminas o Ejes de Diagnóstico Geoestadístico (83 cartografías temáticas):</strong> Cada lámina aborda una pregunta territorial clave mediante mapas elaborados con métodos estadísticos espaciales, acompañados de su interpretación y una tabla que explica cómo sirve esa evidencia a instituciones públicas, vecinos, mapeadores y académicos.</li>
                <li><strong>Las 5 Dimensiones Analíticas y el Explorador Acordeón de 294 Coberturas:</strong> Agrupa todas las capas del Atlas en cinco ámbitos temáticos e incluye un buscador en español que permite encender cualquier capa y saltar directamente al visor del Módulo 02 con un clic.</li>
              </ol>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 10px 0; color:#fbbf24; font-size:1.05rem;">2. Cómo leer e interpretar los 4 Ejes de Diagnóstico Geoestadístico (83 mapas)</h4>
              <p style="margin:0 0 14px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                A continuación se explica en lenguaje claro qué método utiliza cada una de las 4 láminas del Módulo 01, qué significan sus colores y categorías, y qué hallazgos revela sobre Santiago y el Barrio Brasil:
              </p>

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:14px;">
                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:16px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#38bdf8; text-transform:uppercase;">Lámina 01 · Estimación de Densidad por Núcleo (14 mapas KDE)</span>
                    <h5 style="margin:4px 0 8px 0; font-size:0.98rem; color:#ffffff;">Concentración Territorial de Actividad IGV en Santiago</h5>
                    <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.6; margin:0 0 8px 0;">
                      <strong>¿Qué es el método KDE?</strong> La <em>Estimación de Densidad de Kernel (KDE)</em> transforma miles de puntos individuales en una superficie continua de intensidad (similar a un mapa de calor riguroso), calculando cuántos elementos existen alrededor de cada celda de una malla de 20 metros.
                    </p>
                    <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.6; margin:0;">
                      <strong>¿Cómo se lee?</strong> Procesa <strong>79.841 entidades</strong> y <strong>112.264 nodos</strong> de IGV. Los tonos más intensos muestran subcentros con altísima vitalidad de servicios, cultura, gastronomía y transporte (como el eje Alameda, el centro histórico y el Barrio Brasil-Yungay), mientras que los tonos claros evidencian sectores residenciales del sur de la comuna con menor presencia de equipamiento mapeado.
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-densidad-kernel-kde')" style="margin-top:12px; font-size:0.8rem; padding:7px 12px;">Abrir Lámina 01 (14 Mapas KDE) ↗</button>
                </div>

                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:16px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#fbbf24; text-transform:uppercase;">Lámina 02 · Autocorrelación Espacial Local (11 mapas LISA)</span>
                    <h5 style="margin:4px 0 8px 0; font-size:0.98rem; color:#ffffff;">Segregación Espacial, Hotspots y Áreas de Rezago (LISA)</h5>
                    <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.6; margin:0 0 8px 0;">
                      <strong>¿Qué es el método LISA?</strong> Los <em>Indicadores Locales de Asociación Espacial</em> (formulados por Luc Anselin) evalúan sobre las <strong>1.711 manzanas censales</strong> si una manzana comparte condiciones similares o opuestas con sus manzanas vecinas de forma estadísticamente significativa.
                    </p>
                    <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.6; margin:0;">
                      <strong>¿Qué significan sus 4 categorías?</strong><br>
                      • <strong>Alto-Alto (Hotspot / Rojo):</strong> Manzanas con alta dotación rodeadas de vecinas también bien dotadas.<br>
                      • <strong>Bajo-Bajo (Coldspot / Azul):</strong> Bolsones de rezago donde tanto la manzana como su entorno tienen baja cobertura (zonas prioritarias de inversión).<br>
                      • <strong>Alto-Bajo y Bajo-Alto:</strong> Islas o transiciones abruptas entre una manzana y su vecindario inmediato.
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-autocorrelacion-lisa')" style="margin-top:12px; font-size:0.8rem; padding:7px 12px;">Abrir Lámina 02 (11 Mapas LISA) ↗</button>
                </div>

                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(168,85,247,0.3); border-radius:8px; padding:16px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#c084fc; text-transform:uppercase;">Lámina 03 · Demografía, RSH y Patrimonio (34 mapas)</span>
                    <h5 style="margin:4px 0 8px 0; font-size:0.98rem; color:#ffffff;">Estructura Sociodemográfica, Habitabilidad y Morfología Urbana</h5>
                    <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.6; margin:0 0 8px 0;">
                      <strong>¿Qué analiza esta lámina?</strong> Cruza los resultados del <strong>Censo de Población y Vivienda 2024 (INE)</strong> con los tramos de calificación socioeconómica del <strong>Registro Social de Hogares (RSH 2026)</strong>, el catastro de <strong>cités y pasajes históricos</strong> y la edad de las edificaciones del SII.
                    </p>
                    <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.6; margin:0;">
                      <strong>¿Para qué sirve?</strong> Permite distinguir dónde se concentran las personas mayores, los hogares en viviendas arrendadas o colectivas, la densificación en altura reciente frente a las manzanas patrimoniales de baja altura del Barrio Brasil, y la localización de la inversión pública del Banco Integrado de Proyectos (BIP).
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-demografia-habitabilidad-sociourbana')" style="margin-top:12px; font-size:0.8rem; padding:7px 12px;">Abrir Lámina 03 (34 Mapas Demografía) ↗</button>
                </div>

                <div style="background:rgba(2,6,23,0.6); border:1px solid rgba(52,211,153,0.3); border-radius:8px; padding:16px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <span style="font-size:0.72rem; font-weight:800; color:#34d399; text-transform:uppercase;">Lámina 04 · Ambiente, Caminabilidad y Residuos (24 mapas)</span>
                    <h5 style="margin:4px 0 8px 0; font-size:0.98rem; color:#ffffff;">Metabolismo Urbano, Movilidad y Espacio Público</h5>
                    <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.6; margin:0 0 8px 0;">
                      <strong>¿Qué es el metabolismo y la caminabilidad urbana?</strong> Evalúa cómo funciona ambiental y cotidianamente la ciudad: qué tan cerca están los vecinos a pie (isócronas de 5 y 15 minutos) de plazas, parques, transporte público y centros de salud, y cómo operan los flujos ambientales.
                    </p>
                    <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.6; margin:0;">
                      <strong>¿Qué variables integra?</strong> Incluye cobertura arbórea y registros de biodiversidad ciudadana (GBIF), mapas de exposición a ruido ambiental diurno y nocturno (&gt;68 dBA en ejes arteriales como Ruta 5, Alameda y Av. Brasil) y la operación de recolección de residuos sólidos domiciliarios (SUBDERE RSD 2024) en las 5 zonas de aseo comunal.
                    </p>
                  </div>
                  <button type="button" class="accion" onclick="ModuloIndicadoresAnalisis.abrirLaminaStoryboard('storyboard-socioambiental-movilidad-servicios')" style="margin-top:12px; font-size:0.8rem; padding:7px 12px;">Abrir Lámina 04 (24 Mapas Metabolismo) ↗</button>
                </div>
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 10px 0; color:#34d399; font-size:1.05rem;">3. Las 5 Dimensiones Analíticas y cómo usar el Explorador de 294 Capas</h4>
              <p style="margin:0 0 12px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Para evitar que el usuario tenga que buscar entre cientos de archivos técnicos sin orden aparente, las <strong>294 coberturas del Atlas</strong> (123 oficiales <code>id_ig</code> + 171 colaborativas <code>id_igv</code>) están clasificadas en <strong>5 Dimensiones Analíticas</strong>. En la parte inferior del Módulo 01 encontrará el explorador interactivo por acordeones con buscador en español: al hacer clic en el botón <em>"Activar en el mapa"</em> de cualquier capa, la plataforma cambia automáticamente al Módulo 02, enciende la capa, centra la vista y muestra su leyenda.
              </p>
              <div style="overflow-x:auto;">
                <table class="tabla-datos" style="width:100%; font-size:0.85rem; min-width:680px;">
                  <thead>
                    <tr>
                      <th style="width:240px;">Dimensión Analítica</th>
                      <th>Qué información agrupa (Oficial <code>id_ig</code> + Colaborativa <code>id_igv</code>)</th>
                      <th style="width:220px;">Preguntas territoriales que permite responder</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>1. Dimensión Sociodemográfica y Habitacional</strong></td>
                      <td>Manzanas del Censo 2024 (INE), estratificación del Registro Social de Hogares (RSH), tipologías de vivienda, hacinamiento, tenencia/arriendo, cités, permisos de edificación y recepciones finales.</td>
                      <td>¿Dónde viven más adultos mayores o niños? ¿Qué manzanas concentran mayor vulnerabilidad social o presión inmobiliaria?</td>
                    </tr>
                    <tr>
                      <td><strong>2. Dimensión Socioeconómica y Comercial</strong></td>
                      <td>Cartera de proyectos de inversión pública (BIP y MOP), comercios barriales y gastronomía (IGV), ferias libres, supermercados, bancos, servicios postales, oficinas y antenas/redes de telecomunicaciones.</td>
                      <td>¿Existe abastecimiento cotidiano a distancia caminable? ¿Dónde se están ejecutando las inversiones públicas comunales?</td>
                    </tr>
                    <tr>
                      <td><strong>3. Dimensión Socioambiental y Espacio Público</strong></td>
                      <td>Catastro de parques y áreas verdes (MINVU/INE y municipal), arbolado urbano, 52 coberturas de flora y fauna ciudadana (GBIF), islas de calor, mapas de ruido (&gt;68 dBA), puntos limpios y zonas de aseo (SUBDERE RSD).</td>
                      <td>¿Qué cuadras tienen déficit de áreas verdes o sombra arbórea? ¿Qué sectores están expuestos a alto ruido vehicular?</td>
                    </tr>
                    <tr>
                      <td><strong>4. Dimensión Sociosanitaria y Salud</strong></td>
                      <td>Red asistencial pública y privada (hospitales, CESFAM, centros comunitarios de salud mental, clínicas), farmacias, desfibriladores externos automáticos (DEA), grifos contra incendios y equipamiento deportivo.</td>
                      <td>¿Cuál es la cobertura de atención primaria y farmacias en el barrio? ¿Dónde hay desfibriladores o grifos ante emergencias?</td>
                    </tr>
                    <tr>
                      <td><strong>5. Dimensión Sociourbana, Movilidad y Normativa</strong></td>
                      <td>Zonificación del Plan Regulador Comunal (PRC Santiago), Zonas e Inmuebles de Conservación Histórica (ZCH/ICH), Monumentos Nacionales (CMN), estaciones de Metro, paraderos Red, ciclovías, cruces peatonales y luminarias.</td>
                      <td>¿Qué altura y usos permite el Plan Regulador en cada manzana? ¿Qué inmuebles tienen protección patrimonial? ¿Cómo se conecta la red de ciclovías?</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="font-size:0.82rem; padding:8px 14px;">📊 Explorar las 5 Dimensiones en el Módulo 01 ↗</button>
                <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.82rem; padding:8px 14px;">🗺️ Ir al Visor Cartográfico (Módulo 02) ↗</button>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-03',
        numero: 'DOC · 03',
        icono: '🗺️',
        titulo: 'Guía en Profundidad del Módulo 02: Explorar Mapa, Herramientas, Simbología y Panel de Detalles',
        subtitulo: 'Manual paso a paso del visor cuadrado (Leaflet 1.9.4), los 5 mapas base sin API, la barra de herramientas, el Inspector Normativo PRC, la simbología Jenks y los 17 atributos ISO 19157.',
        html: `
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
                <h4 style="margin:0; color:#38bdf8; font-size:1.05rem;">1. El Visor Cartográfico Cuadrado y la Barra Superior de Herramientas</h4>
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.8rem; padding:6px 12px;">Abrir Módulo 02 · Explorar Mapa ↗</button>
              </div>
              <p style="margin:0 0 12px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.68;">
                El <strong>Módulo 02 · Explorar Mapa</strong> está diseñado con un lienzo cartográfico de proporción amplia y cuadrada para facilitar la lectura tanto en sentido norte-sur como oriente-poniente, acompañado por un selector lateral de capas y una <strong>barra superior de controles centrada</strong>. A continuación se detalla para qué sirve cada control de la barra superior:
              </p>
              <div style="overflow-x:auto;">
                <table class="tabla-datos" style="width:100%; font-size:0.84rem; min-width:680px;">
                  <thead>
                    <tr>
                      <th style="width:210px;">Control en la Barra Superior</th>
                      <th>¿Qué hace y cómo funciona técnicamente?</th>
                      <th style="width:230px;">¿Cuándo conviene utilizarlo?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Área de enfoque</strong><br><small>(Barrio Brasil Completo / Comuna de Santiago)</small></td>
                      <td>Ajusta automáticamente el encuadre geográfico y el nivel de zoom del mapa entre la escala micro-urbana del <strong>Barrio Brasil</strong> (polígono delimitado por Av. Alameda, Av. Manuel Rodríguez, Av. San Pablo y Av. Matucana) y las 26 unidades vecinales de toda la <strong>Comuna de Santiago</strong>.</td>
                      <td>Al pasar de un análisis barrial detallado (cités, árboles, comercios) a una comparación comunal completa.</td>
                    </tr>
                    <tr>
                      <td><strong>Delimitar área</strong><br><small>(Cálculo métrico <code>EPSG:32719</code>)</small></td>
                      <td>Permite dibujar un rectángulo o polígono sobre el mapa para medir su superficie y filtrar elementos. Transforma las coordenadas geográficas (<code>EPSG:4326</code>) al sistema métrico plano oficial de Chile <strong>SIRGAS-Chile / UTM Huso 19 Sur (<code>EPSG:32719</code>)</strong>, entregando el área en metros cuadrados (m²) y hectáreas (ha).</td>
                      <td>Cuando necesite medir la superficie de un sector de intervención, una plaza, un conjunto de manzanas o un polígono de estudio.</td>
                    </tr>
                    <tr>
                      <td><strong>Reencuadrar</strong></td>
                      <td>Restablece con un solo clic la vista inicial y el nivel de zoom óptimo del área de enfoque activa si se ha desplazado fuera de la zona de estudio.</td>
                      <td>Después de hacer zoom muy cercano sobre un predio o calle específica.</td>
                    </tr>
                    <tr>
                      <td><strong>Inspector normativo (PRC)</strong></td>
                      <td>Activa o desactiva el modo de consulta urbanística sobre el <strong>Plan Regulador Comunal de Santiago (PRC)</strong> y la <strong>OGUC</strong>. Para mantener limpia la pantalla, su ficha regulatoria se despliega en el panel inferior <em>únicamente cuando usted lo activa y hace clic sobre un predio o manzana</em>.</td>
                      <td>Para conocer la zona del PRC, altura máxima permitida, usos de suelo, constructibilidad o si un inmueble es de Conservación Histórica (ICH/ZCH).</td>
                    </tr>
                    <tr>
                      <td><strong>Ver Atlas de Análisis</strong></td>
                      <td>Lleva de regreso de forma instantánea al <strong>Módulo 01 (Análisis)</strong> conservando el estado de las capas que dejó encendidas en el visor.</td>
                      <td>Para contrastar lo que está viendo en el mapa con las 83 láminas geoestadísticas (KDE / LISA).</td>
                    </tr>
                    <tr>
                      <td><strong>Exportar vista (GeoJSON)</strong></td>
                      <td>Empaqueta y descarga en su computador un archivo estándar <code>.geojson</code> (RFC 7946) con las entidades actualmente visibles y sus estilos de color activos.</td>
                      <td>Para abrir su selección actual directamente en programas SIG de escritorio como QGIS o ArcGIS.</td>
                    </tr>
                    <tr>
                      <td><strong>Descargar base de datos (.zip)</strong></td>
                      <td>Inicia la descarga directa del paquete maestro <code>geodatabase_completa_atlas_vgi.zip</code> (542,35 MB) con las 294 capas completas, los libros Excel y los manuales.</td>
                      <td>Cuando requiera trabajar sin conexión a internet con la totalidad de la base de datos del proyecto.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 10px 0; color:#34d399; font-size:1.05rem;">2. Los 5 Mapas Base Abiertos y Satelitales (Sin requerimiento de clave de API)</h4>
              <p style="margin:0 0 12px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Para garantizar que el visor funcione siempre sin bloqueos comerciales ni límites de visualización, en el Prototipo 02 se eliminaron los antiguos mapas de Carto (que solicitan clave de API) y se configuraron <strong>5 mapas base de acceso directo</strong> que puede alternar desde el control de capas del visor:
              </p>
              <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.68;">
                <li><strong>1. OpenStreetMap Estándar (Predeterminado):</strong> Muestra con gran nitidez el nombre de las calles, el sentido del tránsito, la numeración domiciliaria, los pasajes interiores, las plazas y los equipamientos comunitarios. Ideal para ubicarse rápidamente a nivel de cuadra.</li>
                <li><strong>2. OpenStreetMap Humanitario (HOT):</strong> Utiliza una paleta más suave y despejada que resalta equipamientos públicos (hospitales, escuelas, grifos, sedes sociales), facilitando que los colores de las capas temáticas que usted encienda se distingan con alto contraste.</li>
                <li><strong>3. Imagen Satelital (Bing / Microsoft):</strong> Ortofotografías aéreas y satelitales de alta resolución provistas por Microsoft VirtualEarth. Muy útil para observar techumbres, patios interiores de cités, copas de árboles reales y sitios eriazos.</li>
                <li><strong>4. Satelital Híbrido con Calles (Bing / Microsoft):</strong> Combina la fotografía satelital de Bing/Microsoft con el trazado de calles y nombres de vías superpuestos, permitiendo fotointerpretar sin perder la referencia de las direcciones.</li>
                <li><strong>5. Imagen Satelital (Esri World Imagery):</strong> Mosaico satelital global de Esri / Maxar, recomendado para contrastar imágenes de distintas fechas y verificar cambios recientes en edificaciones o cubiertas vegetales.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(16,185,129,0.4); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 10px 0; color:#34d399; font-size:1.05rem;">3. Cómo funciona la Simbología Estadística Dinámica (Natural Breaks / Jenks y otros métodos)</h4>
              <p style="margin:0 0 12px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Cuando usted activa una capa en el Módulo 02, puede abrir el panel de <strong>Simbología Dinámica</strong> para colorear el mapa según cualquiera de sus variables numéricas o categóricas. Para ayudarle a elegir el método de clasificación más adecuado, aquí se explica qué hace cada uno:
              </p>
              <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.68;">
                <li><strong>Cortes Naturales (Jenks / <em>Natural Breaks</em>):</strong> Es el método recomendado por defecto. Un algoritmo estadístico busca dónde se producen los "saltos" o agrupamientos naturales en los datos, agrupando valores similares entre sí y separando los valores muy distintos. Es ideal para datos urbanos desiguales (como densidad poblacional o avalúo fiscal).</li>
                <li><strong>Cuantiles (<em>Quantiles</em>):</strong> Divide el total de manzanas o unidades en grupos con exactamente la misma cantidad de elementos (por ejemplo, el 20 % más bajo, el 20 % medio-bajo, etc.). Es muy útil para comparar rankings relativos entre manzanas o unidades vecinales.</li>
                <li><strong>Intervalos Iguales (<em>Equal Intervals</em>):</strong> Divide el rango entre el valor mínimo y el máximo en tramos del mismo tamaño numérico (por ejemplo, de 0 a 25 %, de 25 a 50 %, etc.). Se recomienda para porcentajes o índices que ya están en una escala uniforme.</li>
                <li><strong>Desviación Estándar:</strong> Muestra qué tan por encima o por debajo del promedio comunal se encuentra cada manzana, destacando valores atípicos extremos.</li>
                <li><strong>Categorizado (Valores únicos):</strong> Asigna un color distinto a cada categoría de texto (por ejemplo, cada zona del Plan Regulador Comunal o cada tipo de establecimiento de salud).</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 10px 0; color:#38bdf8; font-size:1.05rem;">4. El Panel Inferior de "Detalles" y el Diccionario de los 17 Atributos Homologados (<code>id_ig</code> / <code>id_igv</code>)</h4>
              <p style="margin:0 0 12px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                Al hacer clic sobre cualquier punto, línea o polígono en el mapa, toda su información se despliega en el panel inferior de ancho completo llamado <strong>Detalles</strong> (ubicado debajo del visor para no tapar el mapa). Todas las entidades de las 294 capas comparten un <strong>perfil homologado de 17 atributos</strong> basado en los estándares internacionales <strong>ISO 19115</strong> (metadatos) e <strong>ISO 19157</strong> (calidad de datos espaciales). La clave principal distingue de inmediato el origen del dato:
              </p>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px; margin-bottom:14px;">
                <div style="background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.35); border-radius:8px; padding:12px;">
                  <strong style="color:#34d399;"><code>id_ig</code> · Identificador de Información Geográfica Oficial (123 capas)</strong>
                  <p style="font-size:0.83rem; color:var(--tinta-suave); margin:4px 0 0 0; line-height:1.55;">
                    Identifica a los registros provenientes de organismos públicos del Estado de Chile (IDE Chile, INE, MINVU, RSH, SUBDERE, SII, CMN y Municipalidad de Santiago).
                  </p>
                </div>
                <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.35); border-radius:8px; padding:12px;">
                  <strong style="color:#38bdf8;"><code>id_igv</code> · Identificador de Información Geográfica Voluntaria (171 capas)</strong>
                  <p style="font-size:0.83rem; color:var(--tinta-suave); margin:4px 0 0 0; line-height:1.55;">
                    Identifica a los registros levantados colaborativamente por la ciudadanía y comunidades abiertas en OpenStreetMap y en la red de biodiversidad GBIF.
                  </p>
                </div>
              </div>
              <div style="overflow-x:auto;">
                <table class="tabla-datos" style="width:100%; font-size:0.82rem; min-width:680px;">
                  <thead>
                    <tr>
                      <th style="width:45px;">N°</th>
                      <th style="width:190px;">Atributo en Panel Detalles</th>
                      <th style="width:120px;">Norma ISO</th>
                      <th>¿Qué informa en lenguaje claro?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><strong>01</strong></td><td><code>id_ig</code> / <code>id_igv</code></td><td>ISO 19115</td><td>Código único del elemento: <code>id_ig</code> si es un dato oficial del Estado o <code>id_igv</code> si es Información Geográfica Voluntaria.</td></tr>
                    <tr><td><strong>02</strong></td><td><code>nombre</code> / <code>nombre_capa</code></td><td>ISO 19115</td><td>Nombre propio del lugar o equipamiento (ej. "Plaza Brasil", "CESFAM Domeyko") y nombre de la capa a la que pertenece.</td></tr>
                    <tr><td><strong>03</strong></td><td><code>categoria</code> / <code>dimension_analitica</code></td><td>ISO 19115</td><td>A cuál de las 5 Dimensiones Analíticas del Atlas pertenece el elemento.</td></tr>
                    <tr><td><strong>04</strong></td><td><code>subtipo</code> / <code>tipo_fuente</code></td><td>ISO 19115</td><td>Clasificación específica del objeto y distinción entre fuente estatal oficial o fuente colaborativa de IGV.</td></tr>
                    <tr><td><strong>05</strong></td><td><code>institucion_custodia</code></td><td>ISO 19115</td><td>Organismo público o comunidad colaborativa responsable de mantener el dato (ej. MINVU, INE, Comunidad OpenStreetMap Chile, GBIF).</td></tr>
                    <tr><td><strong>06</strong></td><td><code>sistema_referencia</code></td><td>ISO 19115</td><td>Sistema de coordenadas: <code>EPSG:4326 (WGS 84)</code> para visualización web y <code>EPSG:32719 (SIRGAS-Chile UTM 19S)</code> para mediciones en metros.</td></tr>
                    <tr><td><strong>07</strong></td><td><code>escala_referencia</code></td><td>ISO 19115</td><td>Nivel de detalle cartográfico con que fue levantado el dato (de <code>1:1.000</code> a nivel predial/barrial hasta <code>1:25.000</code> a nivel comunal).</td></tr>
                    <tr><td><strong>08</strong></td><td><code>fecha_actualizacion</code></td><td>ISO 19115</td><td>Fecha verificada de última actualización o corte de extracción de la cobertura (formato <code>AAAA-MM-DD</code>).</td></tr>
                    <tr><td><strong>09</strong></td><td><code>licencia_uso</code></td><td>ISO 19115</td><td>Condición legal de uso abierto: Datos Abiertos del Estado (Ley N.° 20.285), <code>ODbL 1.0</code> (OpenStreetMap) o <code>CC BY 4.0</code> (GBIF).</td></tr>
                    <tr><td><strong>10</strong></td><td><code>exactitud_posicional</code></td><td>ISO 19157</td><td>Qué tan precisa es la ubicación geométrica del punto, línea o polígono respecto a las ortofotos y catastro oficial.</td></tr>
                    <tr><td><strong>11</strong></td><td><code>consistencia_topologica</code></td><td>ISO 19157</td><td>Certifica que la geometría está bien dibujada (polígonos cerrados sin auto-intersecciones y conformes al estándar RFC 7946).</td></tr>
                    <tr><td><strong>12</strong></td><td><code>completitud</code></td><td>ISO 19157</td><td>Indica qué porcentaje de los campos descriptivos importantes del elemento se encuentran completos y sin datos vacíos.</td></tr>
                    <tr><td><strong>13</strong></td><td><code>exactitud_tematica</code></td><td>ISO 19157</td><td>Verifica que la clasificación o etiqueta asignada al objeto (por ejemplo, farmacia, ciclovía o zona patrimonial) sea correcta.</td></tr>
                    <tr><td><strong>14</strong></td><td><code>consistencia_temporal</code></td><td>ISO 19157</td><td>Vigencia del dato dentro de la ventana temporal operativa del Atlas (2024–2026).</td></tr>
                    <tr><td><strong>15</strong></td><td><code>linaje_fuente</code></td><td>ISO 19157</td><td>Resumen de cómo se capturó, procesó, reproyectó y validó el dato desde su origen hasta el visor.</td></tr>
                    <tr><td><strong>16</strong></td><td><code>cobertura_territorial</code> / <code>metricas</code></td><td>ISO 19115</td><td>Ámbito espacial (Barrio Brasil o Comuna de Santiago) y su superficie (m²/ha) o longitud (m) calculada en UTM 19S.</td></tr>
                    <tr><td><strong>17</strong></td><td><code>archivo_origen</code></td><td>ISO 19115</td><td>Nombre exacto del archivo <code>.geojson</code> dentro del repositorio y del paquete descargable para su trazabilidad directa.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-04',
        numero: 'DOC · 04',
        icono: '⚖️',
        titulo: 'Licencias Abiertas, Descarga de Geodatabase (.zip) y Catálogos en Excel',
        subtitulo: 'Explicación práctica de qué permite hacer cada licencia abierta (CC BY 4.0, ODbL 1.0, Ley N° 20.285 y AGPLv3), descarga de la geodatabase completa (542,35 MB) y guía de los 3 libros Excel.',
        html: `
          <div style="display:flex; flex-direction:column; gap:18px;">
            <div class="bloque" id="sec-lic-descargas-maestras" style="border-left:4px solid #10b981; background:rgba(16,185,129,0.06); padding:18px; border-radius:10px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px; margin-bottom:12px;">
                <div style="flex:1; min-width:280px;">
                  <span style="font-size:0.75rem; font-weight:800; color:#34d399; text-transform:uppercase; letter-spacing:0.05em;">ACCESO ABIERTO // DESCARGA INTEGRAL PARA USO EN SIG O PLANILLAS</span>
                  <h3 style="margin:4px 0 6px 0; color:#ffffff; font-size:1.25rem;">📦 Geodatabase Completa del Atlas para la Gestión Territorial (.zip)</h3>
                  <p class="descripcion" style="margin:0; font-size:0.89rem; color:var(--tinta-suave); line-height:1.65;">
                    Si desea trabajar sin conexión o realizar sus propios cruces en software como <strong>QGIS, ArcGIS, R o Python</strong>, este paquete consolidado reúne las <strong>294 coberturas espaciales operativas</strong> (171 capas colaborativas de IGV con <code>id_igv</code> + 123 capas oficiales del Estado con <code>id_ig</code>), las matrices censales y barriales, los 3 libros maestros en Excel y toda la documentación técnica (<strong>542,35 MB comprimido / ~3,33 GB descomprimido</strong>).
                  </p>
                </div>
                <div>
                  <a href="docs/geodatabase_completa_atlas_vgi.zip" download="geodatabase_completa_atlas_vgi.zip" class="accion primaria-cta" style="background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; font-weight:800; padding:10px 20px; border-radius:8px; display:inline-flex; align-items:center; gap:8px; text-decoration:none; box-shadow:0 4px 14px rgba(16,185,129,0.35);">
                    ⬇️ Descargar Geodatabase Completa (.zip · 542,35 MB)
                  </a>
                </div>
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 6px 0; color:#38bdf8; font-size:1.05rem;">1. Libros Maestros en Excel (.xlsx) y Compendio Bibliográfico</h4>
              <p style="margin:0 0 12px 0; font-size:0.88rem; color:var(--tinta-suave); line-height:1.6;">
                Para quienes prefieren revisar inventarios, diccionarios de variables y tablas en planillas de cálculo (Microsoft Excel, LibreOffice Calc o Google Sheets), el proyecto dispone de tres libros estructurados en múltiples hojas temáticas junto con el compendio bibliográfico en norma APA 7ª edición:
              </p>
              
              <div class="contenedor-tabla-responsiva">
                <table class="tabla-datos" style="width:100%; font-size:0.85rem; min-width:680px;">
                  <thead>
                    <tr>
                      <th style="min-width:210px;">Libro / Documento</th>
                      <th style="min-width:280px;">¿Qué encontrará dentro y cómo aprovecharlo?</th>
                      <th style="min-width:120px;">Formato y Peso</th>
                      <th style="min-width:110px;">Descarga</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Dimensiones Analíticas y Diccionario IGV</strong><br><code class="codigo-licencia">docs/categorias_tematicas_osm.xlsx</code></td>
                      <td>Contiene la definición de las <strong>5 Dimensiones Analíticas</strong>, el listado de las 171 coberturas descentralizadas de IGV con sus etiquetas equivalentes en OpenStreetMap (<code>key=value</code>) y Darwin Core (GBIF), el diccionario de los 17 atributos y las referencias bibliográficas.</td>
                      <td>Excel (<code>.xlsx</code>) · ~52 KB</td>
                      <td><a href="docs/categorias_tematicas_osm.xlsx" download="categorias_tematicas_osm.xlsx" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar Excel</a></td>
                    </tr>
                    <tr>
                      <td><strong>Perfil de Metadatos y Calidad (ISO 19115 / 19157)</strong><br><code class="codigo-licencia">docs/perfil_metadatos_vgi.xlsx</code></td>
                      <td>Explica campo por campo el estándar de <strong>17 atributos homologados</strong> (diferenciando <code>id_ig</code> e <code>id_igv</code>), su correspondencia con el Perfil Nacional de Metadatos de IDE Chile / SNIT y las reglas de validación topológica y posicional aplicadas a las 294 capas.</td>
                      <td>Excel (<code>.xlsx</code>) · ~31 KB</td>
                      <td><a href="docs/perfil_metadatos_vgi.xlsx" download="perfil_metadatos_vgi.xlsx" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar Excel</a></td>
                    </tr>
                    <tr>
                      <td><strong>Catálogo Sistemático de las 294 Fuentes</strong><br><code class="codigo-licencia">docs/catalogo_fuentes_vgi.xlsx</code></td>
                      <td>Inventario completo de las 123 capas oficiales del Estado y las 171 capas colaborativas de IGV, detallando institución o comunidad custodia, año de vigencia, escala de captura, sistema de referencia y licencia específica de cada archivo.</td>
                      <td>Excel (<code>.xlsx</code>) · ~39 KB</td>
                      <td><a href="docs/catalogo_fuentes_vgi.xlsx" download="catalogo_fuentes_vgi.xlsx" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar Excel</a></td>
                    </tr>
                    <tr>
                      <td><strong>Bibliografía y Marco Normativo (APA 7ª ed.)</strong><br><code class="codigo-licencia">docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md</code></td>
                      <td>Reúne 125 referencias académicas, manuales metodológicos (Anselin, Goodchild, Haklay, ISO/TC 211) y cuerpos legales chilenos listos para citar en informes técnicos, tesis o proyectos barriales.</td>
                      <td>Markdown (<code>.md</code>) · ~81 KB</td>
                      <td><a href="docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md" download="BIBLIOGRAFIA_SEMINARIO_Y_ATLAS_APA7.md" class="accion secundaria" style="font-size:0.78rem; padding:5px 10px; display:inline-block;">Descargar .md</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bloque" id="sec-lic-marco-tripartito" style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 6px 0; color:#fbbf24; font-size:1.05rem;">2. Guía Ciudadana y Técnica de Licencias Abiertas: ¿Qué puedo hacer con los datos y mapas?</h4>
              <p class="descripcion" style="margin:0 0 12px 0; font-size:0.88rem; color:var(--tinta-suave); line-height:1.65;">
                Toda la información reunida en el <strong>Atlas para la Gestión Territorial</strong> es abierta y puede ser utilizada libremente en informes vecinales, estudios municipales, trabajos universitarios, prensa o nuevos desarrollos tecnológicos, respetando siempre la atribución de origen y la protección de datos personales (Ley N.° 19.628, razón por la cual los datos censales y del RSH se entregan agrupados por manzana o unidad vecinal y nunca a nivel de personas individuales):
              </p>

              <div class="contenedor-tabla-responsiva">
                <table class="tabla-datos" style="width:100%; font-size:0.85rem; min-width:720px;">
                  <thead>
                    <tr>
                      <th style="min-width:190px;">Componente del Atlas</th>
                      <th style="min-width:200px;">Licencia o Norma Aplicada</th>
                      <th style="min-width:290px;">¿Qué permite hacer y cómo debe citarse?</th>
                      <th style="min-width:110px;">Referencia Legal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Textos, Manuales y las 83 Cartografías Temáticas</strong></td>
                      <td><span class="badge-licencia cc">CC BY 4.0 / CC BY-SA 4.0</span><br><small>Creative Commons Internacional</small></td>
                      <td>Usted puede descargar, imprimir, compartir e incluir las láminas y textos en presentaciones o informes, indicando como fuente: <em>"Atlas para la Gestión Territorial — Municipio de Santiago y Barrio Brasil (2026)"</em>.</td>
                      <td><a href="https://creativecommons.org/licenses/by/4.0/deed.es" target="_blank" rel="noopener" class="enlace-externo">Ver licencia ↗</a></td>
                    </tr>
                    <tr>
                      <td><strong>171 Capas Colaborativas de IGV (<code>id_igv</code>)</strong></td>
                      <td><span class="badge-licencia odbl">ODbL 1.0 / CC BY 4.0</span><br><small>Open Database License &amp; Darwin Core</small></td>
                      <td>Permite usar, cruzar y derivar nueva cartografía a partir de los datos de OpenStreetMap y GBIF, manteniendo siempre el crédito: <em>"© Colaboradores de OpenStreetMap (ODbL 1.0)"</em> y <em>"GBIF.org (CC BY 4.0)"</em>.</td>
                      <td><a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener" class="enlace-externo">Ver licencia ↗</a></td>
                    </tr>
                    <tr>
                      <td><strong>123 Capas Oficiales del Estado (<code>id_ig</code>) y Código Web</strong></td>
                      <td><span class="badge-licencia agpl">Ley N° 20.285 / GNU AGPLv3</span><br><small>Datos Públicos IDE Chile &amp; Software Libre</small></td>
                      <td>Las capas estatales son de acceso público conforme a la Ley N.° 20.285 de Transparencia y lineamientos de IDE Chile/SNIT. El código del portal puede replicarse en otros municipios o barrios bajo licencia abierta GNU AGPLv3 / MIT.</td>
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
        titulo: `Inventario General Filtrable de las ${totalCapas} Coberturas Integradas (123 Oficiales + 171 IGV)`,
        subtitulo: 'Buscador interactivo en tiempo real de las 294 capas operativas del Atlas por código (BBDD / IGV), clave primaria (id_ig / id_igv), institución custodia, archivo GeoJSON o temática.',
        html: `
          <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; margin-bottom:14px;">
            <p style="margin:0; font-size:0.88rem; color:var(--tinta-suave); line-height:1.6;">
              En esta tabla puede consultar y filtrar en vivo la totalidad de las <strong>${totalCapas} coberturas geográficas</strong> que integran el Atlas. Escriba cualquier palabra clave en el buscador (por ejemplo: <code>censo</code>, <code>salud</code>, <code>prc</code>, <code>arbolado</code>, <code>id_ig</code> para ver las 123 capas oficiales del Estado o <code>id_igv</code> para ver las 171 capas colaborativas de Información Geográfica Voluntaria).
            </p>
          </div>
          <div style="margin-bottom:12px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <input type="text" id="filtro-catalogo-manual-input" placeholder="🔍 Filtrar las 294 capas por código (IGV-001, BBDD-01), nombre, id_ig, id_igv, institución o tema..." oninput="ModuloManual.filtrarTablaCatalogo(this.value)" style="flex:1; min-width:260px; padding:8px 12px; border-radius:6px; border:1px solid var(--linea); background:var(--fondo-tarjeta); color:var(--tinta); font-size:0.88rem;">
            <span style="font-size:0.85rem; color:var(--tinta-suave);">Total registradas: <strong>${totalCapas}</strong> (123 Oficiales <code>id_ig</code> + 171 IGV <code>id_igv</code>)</span>
          </div>
          <div style="overflow-x:auto; max-height:540px; border:1px solid var(--linea-tarjeta); border-radius:8px;">
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
        titulo: 'Arquitectura del Sistema, Flujo de Datos y Guía de Actualización del Atlas',
        subtitulo: 'Diseño del Prototipo 02 en 3 módulos, flujo de integración de las 294 coberturas y criterios generales para mantener actualizada la plataforma.',
        html: `
          <div style="display:flex; flex-direction:column; gap:18px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 8px 0; color:#38bdf8; font-size:1.05rem;">1. Estructura Modular de Tres Componentes Funcionales (Prototipo 02)</h4>
              <p style="margin:0 0 12px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.68;">
                El <strong>Atlas para la Gestión Territorial</strong> está construido sobre una estructura web estática en <strong>HTML5 semántico, CSS3 adaptable y JavaScript modular</strong> que funciona directamente en el navegador sin requerir instalaciones complejas ni servidores propietarios. Esta organización permite que la plataforma cargue con rapidez, opere de manera estable en producción y pueda ser consultada o mantenida con facilidad por equipos municipales, académicos o comunitarios:
              </p>

              <!-- Diagrama Visual de Arquitectura de 4 Etapas -->
              <div style="background:rgba(2,6,23,0.65); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:16px; margin-bottom:14px;">
                <div style="font-size:0.78rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:10px;">
                  📐 Flujo General de Datos del Prototipo 02 (Fuentes → Homologación → Herramientas del Visor → 3 Módulos)
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px; align-items:stretch;">
                  <div style="background:rgba(15,23,42,0.85); border-left:4px solid #34d399; border-radius:6px; padding:12px;">
                    <div style="font-size:0.75rem; font-weight:800; color:#34d399;">1. FUENTES · 294 CAPAS</div>
                    <p style="font-size:0.8rem; color:var(--tinta-suave); margin:6px 0 0 0; line-height:1.5;">
                      • <strong>123 Capas Oficiales (<code>id_ig</code>):</strong> IDE Chile, INE Censo 2024, MINVU PRC, RSH 2026, SUBDERE RSD, SII, CMN, MuniStgo.<br>
                      • <strong>171 Capas IGV (<code>id_igv</code>):</strong> OpenStreetMap (ODbL 1.0) y GBIF (52 especies).
                    </p>
                  </div>
                  <div style="background:rgba(15,23,42,0.85); border-left:4px solid #fbbf24; border-radius:6px; padding:12px;">
                    <div style="font-size:0.75rem; font-weight:800; color:#fbbf24;">2. HOMOLOGACIÓN DE DATOS</div>
                    <p style="font-size:0.8rem; color:var(--tinta-suave); margin:6px 0 0 0; line-height:1.5;">
                      • Coordenadas en <code>EPSG:4326</code> y <code>EPSG:32719</code>.<br>
                      • Estandarización de los <strong>17 atributos ISO 19115 / 19157</strong>.<br>
                      • Organización en 3 libros <code>.xlsx</code> y paquete <code>.zip</code> (542,35 MB).
                    </p>
                  </div>
                  <div style="background:rgba(15,23,42,0.85); border-left:4px solid #c084fc; border-radius:6px; padding:12px;">
                    <div style="font-size:0.75rem; font-weight:800; color:#c084fc;">3. FUNCIONES DEL VISOR</div>
                    <p style="font-size:0.8rem; color:var(--tinta-suave); margin:6px 0 0 0; line-height:1.5;">
                      • <strong>Medición métrica:</strong> Superficies en <code>m²</code> y <code>ha</code>.<br>
                      • <strong>Simbología:</strong> Jenks, Cuantiles e Intervalos.<br>
                      • <strong>Inspector PRC:</strong> Consulta urbanística por predio.
                    </p>
                  </div>
                  <div style="background:rgba(15,23,42,0.85); border-left:4px solid #38bdf8; border-radius:6px; padding:12px;">
                    <div style="font-size:0.75rem; font-weight:800; color:#38bdf8;">4. NAVEGACIÓN · 3 MÓDULOS</div>
                    <p style="font-size:0.8rem; color:var(--tinta-suave); margin:6px 0 0 0; line-height:1.5;">
                      • <strong>Cabecera:</strong> Tutorial (18 pasos) + Glosario.<br>
                      • <strong>Módulo 01:</strong> 83 mapas (KDE/LISA) + 5 Dimensiones.<br>
                      • <strong>Módulo 02:</strong> Visor cuadrado + 5 mapas base + Detalles.<br>
                      • <strong>Módulo 03:</strong> 6 capítulos + Descargas.
                    </p>
                  </div>
                </div>
              </div>

              <div class="contenedor-tabla-responsiva">
                <table class="tabla-datos" style="width:100%; font-size:0.84rem; min-width:680px;">
                  <thead>
                    <tr>
                      <th style="width:170px;">Componente</th>
                      <th style="width:155px;">Contenedor en <code>index.html</code></th>
                      <th style="width:220px;">Módulos JavaScript (<code>src/js/</code>)</th>
                      <th>Función dentro de la plataforma</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Cabecera Transversal</strong></td>
                      <td><code>#cabecera-atlas</code></td>
                      <td><code>config.js</code>, <code>app.js</code>, <code>modulos/tutorial_interactivo.js</code></td>
                      <td>Mantiene visible el título y subtítulo oficial y ubica en extremos opuestos el <strong>Tutorial Interactivo</strong> de 18 pasos en 4 bloques (a la izquierda del título) y el <strong>Glosario de siglas</strong> con buscador (a la derecha del título) para evitar cualquier superposición.</td>
                    </tr>
                    <tr>
                      <td><strong>Módulo 01 · Análisis</strong></td>
                      <td><code>#panel-indicadores</code></td>
                      <td><code>modulos/indicadores_analisis.js</code>, <code>modulos/catalogo_vgi_descentralizado.js</code></td>
                      <td>Presenta las 4 láminas geoestadísticas con las 83 cartografías (KDE, LISA, Demografía Censo 2024 y Metabolismo Urbano), las tarjetas de las 5 Dimensiones Analíticas y el acordeón buscador de las 294 coberturas con activación directa en el visor.</td>
                    </tr>
                    <tr>
                      <td><strong>Módulo 02 · Explorar Mapa</strong></td>
                      <td><code>#panel-inicio</code></td>
                      <td><code>modulos/mapa.js</code>, <code>modulos/ide_chile.js</code>, <code>modulos/simbologia_dinamica.js</code>, <code>modulos/evaluador_normativo.js</code>, <code>modulos/geodesia.js</code></td>
                      <td>Gestiona el visor cuadrado Leaflet 1.9.4, los 5 mapas base sin requerimiento de API (OpenStreetMap Estándar y HOT, Bing/Microsoft Satelital e Híbrido y Esri World Imagery), la barra superior centrada, la medición de áreas, el Inspector PRC bajo demanda, la simbología Jenks y el panel inferior <strong>Detalles</strong> (17 atributos con <code>id_ig</code> / <code>id_igv</code>).</td>
                    </tr>
                    <tr>
                      <td><strong>Módulo 03 · Documentación</strong></td>
                      <td><code>#panel-manual</code></td>
                      <td><code>modulos/manual.js</code>, <code>modulos/licencias.js</code></td>
                      <td>Articula estos 6 capítulos navegables (<code>DOC · 01</code> a <code>DOC · 06</code>) con buscador en vivo, tablas de licencias abiertas, descargas de los 3 libros Excel, manuales y geodatabase completa (<code>.zip</code>), e inventario dinámico de las 294 capas.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(245,158,11,0.35); border-radius:10px; padding:18px;">
              <h4 style="margin:0 0 8px 0; color:#fbbf24; font-size:1.05rem;">2. Criterios Generales para la Actualización y Mantención del Atlas</h4>
              <p style="margin:0 0 12px 0; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
                Para mantener actualizadas las coberturas espaciales, las cartografías temáticas y los documentos del <strong>Prototipo 02</strong>, el proyecto contempla cuatro pasos ordenados y verificables:
              </p>
              <div style="overflow-x:auto;">
                <table class="tabla-datos" style="width:100%; font-size:0.83rem; min-width:680px;">
                  <thead>
                    <tr>
                      <th style="width:75px;">Etapa</th>
                      <th style="width:230px;">Actividad de Actualización</th>
                      <th style="width:210px;">Ubicación en el Repositorio</th>
                      <th>Descripción Clara del Proceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Paso 01</strong></td>
                      <td><strong>Incorporación o actualización de coberturas GeoJSON</strong></td>
                      <td><code>data/</code> y <code>src/data/</code><br><code>ide_chile.js</code> / <code>catalogo_vgi_descentralizado.js</code></td>
                      <td>Guardar el archivo <code>.geojson</code> en coordenadas <code>EPSG:4326</code> (codificación UTF-8) tanto en <code>data/</code> como en <code>src/data/</code>, registrarlo en una de las <strong>5 Dimensiones Analíticas</strong> y completar sus <strong>17 atributos homologados</strong> (<code>id_ig</code> para fuentes estatales o <code>id_igv</code> para fuentes colaborativas de IGV).</td>
                    </tr>
                    <tr>
                      <td><strong>Paso 02</strong></td>
                      <td><strong>Actualización de cartografías temáticas o reglas normativas PRC</strong></td>
                      <td><code>src/img/cartografias/</code><br><code>indicadores_analisis.js</code> / <code>evaluador_normativo.js</code></td>
                      <td>Las láminas del <strong>Módulo 01</strong> se actualizan incorporando las imágenes <code>.jpg</code> en <code>src/img/cartografias/</code> y su descripción en <code>indicadores_analisis.js</code>. Las reglas urbanísticas del <strong>Módulo 02</strong> se actualizan en el diccionario de zonas del Plan Regulador en <code>evaluador_normativo.js</code>.</td>
                    </tr>
                    <tr>
                      <td><strong>Paso 03</strong></td>
                      <td><strong>Sincronización de catálogos Excel, paquete ZIP y manuales</strong></td>
                      <td><code>docs/</code> y <code>src/docs/</code><br><code>src/js/modulos/manual.js</code></td>
                      <td>Mantener sincronizados los archivos de documentación (<code>MANUAL_USO.md</code>, <code>MANUAL_ACTUALIZACION_ATLAS.md</code>, <code>ARQUITECTURA.md</code> y <code>TRAZABILIDAD.md</code>), los 3 libros Excel (<code>.xlsx</code>) y el paquete descargable <code>geodatabase_completa_atlas_vgi.zip</code> con los 6 capítulos de este módulo.</td>
                    </tr>
                    <tr>
                      <td><strong>Paso 04</strong></td>
                      <td><strong>Verificación de las 294 capas y publicación web</strong></td>
                      <td><code>scripts/verificar_conteo_capas.py</code><br><code>src/index.html</code> y <code>netlify.toml</code></td>
                      <td>Comprobar que las 294 capas (123 oficiales + 171 IGV) estén completas, actualizar el identificador de versión en <code>src/index.html</code> y <code>src/js/config.js</code> y publicar los cambios hacia el repositorio principal en producción.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
                <a href="docs/MANUAL_ACTUALIZACION_ATLAS.md" download="MANUAL_ACTUALIZACION_ATLAS.md" class="accion" style="font-size:0.82rem; padding:7px 14px;">⬇️ Descargar Manual de Actualización (.md)</a>
                <a href="docs/ARQUITECTURA.md" download="ARQUITECTURA_ATLAS.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 14px;">⬇️ Descargar Documento de Arquitectura (.md)</a>
                <a href="docs/TRAZABILIDAD.md" download="TRAZABILIDAD_ATLAS.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 14px;">⬇️ Descargar Documento de Trazabilidad (.md)</a>
                <a href="docs/PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md" download="PROTOCOL_INTEGRIDAD_Y_DESPLIEGUE.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 14px;">⬇️ Protocolo de Integridad y Despliegue (.md)</a>
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
            <h3 style="margin:0 0 4px 0; color:#ffffff; font-size:1.15rem;">Documentación del Sistema (Manual de Uso, Arquitectura y Actualización)</h3>
            <p style="margin:0; font-size:0.86rem; color:var(--tinta-suave);">Recorra los 6 capítulos interactivos redactados en lenguaje claro o descargue los manuales y catálogos maestros del Atlas para la Gestión Territorial.</p>
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
            <a href="docs/TRAZABILIDAD.md" download="TRAZABILIDAD_ATLAS.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 12px;">
              Trazabilidad (.md)
            </a>
            <a href="docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md" download="BIBLIOGRAFIA_SEMINARIO_Y_ATLAS_APA7.md" class="accion secundaria" style="font-size:0.82rem; padding:7px 12px;">
              Bibliografía APA (.md)
            </a>
          </div>
        </div>
        <div>
          <input type="search" id="buscador-general-manual" value="${textoBusquedaManual.replace(/"/g, '&quot;')}" placeholder="Buscar en los 6 capítulos de documentación (ej: entregables, dimensiones, KDE, LISA, id_igv, inspector normativo, Jenks, arquitectura)..." oninput="ModuloManual.filtrarManual(this.value)" style="width:100%; padding:10px 14px; border-radius:6px; border:1px solid var(--linea-fuerte); background:var(--papel); color:var(--tinta); font-size:0.92rem;">
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
