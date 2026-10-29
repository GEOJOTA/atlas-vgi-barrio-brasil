/*
  manual.js
  ---------
  Módulo 07: Manual de Uso y Manual de Actualización Técnica del Atlas VGI.
  Redactado en tercera persona con formato de artículo metodológico y reporte técnico.

  Integra:
  - Parte I: Manual de Uso del Atlas (Fundamentación, arquitectura de interfaz, operación de los Módulos 01 al 10,
    ICV Dinámico, Inspector Normativo PRC/OGUC con expediente histórico 1990-2024 y Catálogo de las 132 capas).
  - Parte II: Manual de Actualización y Mantención Técnica (Principios de ingeniería, catálogo multi-lenguaje estandarizado,
    sincronización espejo data/ y src/data/, base dual .geojson + .gpkg, protocolo de 6 etapas para integración de coberturas,
    mantención de indicadores/storyboards/normativa, validación final, despliegue y bibliografía APA 7ª ed.).
*/

const ModuloManual = (() => {

  let modoManualActivo = 'todos'; // 'todos' | 'uso' | 'actualizacion'

  /**
   * Construye dinámicamente el inventario de las 132 capas (122 Oficiales + 10 VGI)
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

    // 2. 122 Capas Oficiales desde ModuloIDEChile
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
    const totalCapas = inventarioCapas.length || 132;

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
      // PARTE I: MANUAL DE USO DEL ATLAS
      // =======================================================================
      {
        id: 'cap-uso-01',
        parte: 'uso',
        numero: 'USO · 01',
        icono: '🧭',
        titulo: 'Fundamentación y Propósito General del Sistema',
        subtitulo: 'Articulación de las 132 coberturas geográficas, 140 descriptores normativos (ISO 19110) y 10 módulos funcionales.',
        html: `
          <p style="font-size:0.94rem; line-height:1.7; color:var(--tinta-suave);">
            El <strong>Atlas de Información Geográfica Voluntaria para la Gestión Territorial</strong> constituye una infraestructura de datos espaciales orientada a integrar, evaluar y contrastar la cartografía oficial del Estado de Chile con la información geográfica voluntaria (<em>Volunteered Geographic Information</em>, VGI; Goodchild, 2007; Haklay, 2010) para el análisis territorial de la <strong>Comuna de Santiago</strong> y el <strong>Barrio Brasil</strong>.
          </p>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:14px; margin:16px 0;">
            <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#38bdf8;">132 Capas Operativas</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                <strong>122 coberturas oficiales</strong> (MINVU, INE Censo 2024, MTT/UOCT, MDSF RSH, SUBDERE Residuos 2024, Municipalidad de Santiago, CMN, MMA, SII) y <strong>10 categorías VGI</strong> (OpenStreetMap y GBIF).
              </div>
            </div>
            <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#fbbf24;">140 Descriptores Normativos</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                Homologación conceptual y semántica de atributos en el <strong>Módulo 09</strong> conforme a la norma ISO 19110:2016 y los catálogos de la Infraestructura de Datos Geoespaciales de Chile.
              </div>
            </div>
            <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:14px;">
              <div style="font-size:1.35rem; font-weight:800; color:#34d399;">5 Dimensiones y 4 Storyboards (75 Mapas)</div>
              <div style="font-size:0.85rem; color:var(--tinta-suave); margin-top:4px;">
                Estructuración multidimensional y 4 storyboards temáticos con 75 cartografías sobre densidad KDE, clusters LISA, habitabilidad censal y metabolismo urbano.
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-02',
        parte: 'uso',
        numero: 'USO · 02',
        icono: '🗺️',
        titulo: 'Operación del Módulo 01: Visor Territorial, Calidad Dinámica e Inspector Normativo',
        subtitulo: 'Funcionamiento del lienzo cartográfico, cálculo en tiempo real del Índice de Calidad VGI (ICV) y evaluación del Plan Regulador Comunal.',
        html: `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:15px;">
              <h4 style="margin:0 0 6px 0; color:#38bdf8;">1. Control de Coberturas, Encuadre Territorial y Exportación</h4>
              <ul style="margin:0; padding-left:20px; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                <li><strong>Delimitación del ámbito de estudio:</strong> El selector superior permite alternar entre el polígono del <em>Barrio Brasil Completo</em> (223,75 ha) y la <em>Manzana UAH</em> (136,10 ha), o trazar un área personalizada mediante <strong>⛶ Dibujar Bbox</strong> (con cálculo métrico en m² y ha reproyectado a <code>EPSG:32719</code>).</li>
                <li><strong>Superposición multicapa:</strong> El subpanel <strong>🏛 Capas IDE</strong> y los selectores VGI habilitan la visualización simultánea de coberturas estatales y comunitarias (recomendándose activar entre 2 y 4 capas simultáneamente para preservar la legibilidad cartográfica).</li>
                <li><strong>Inspección de atributos y descarga:</strong> La selección de cualquier geometría despliega su ficha de atributos normalizados, la institución custodia y el enlace de exportación individual en formato <code>GeoJSON</code>. El botón <strong>📦 Base de Datos (.zip)</strong> descarga el repositorio completo.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:15px;">
              <h4 style="margin:0 0 6px 0; color:#34d399;">2. Índice de Calidad VGI (ICV) Dinámico</h4>
              <p style="margin:0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                El subpanel <strong>📊 Métricas</strong> computa el Índice de Calidad VGI en tiempo real a partir de las entidades efectivamente activas en el visor (función <code>actualizarTelemetriaCapasActivas</code>):
              </p>
              <ul style="margin:6px 0 0 0; padding-left:20px; color:var(--tinta-suave); font-size:0.87rem; line-height:1.6;">
                <li><strong>Completitud Espacial:</strong> Proporción de entidades activas con geometría válida y campos atributivos completos.</li>
                <li><strong>Actualidad Reciente:</strong> Período cronológico más reciente identificado en los atributos temporales y metadatos de las capas encendidas.</li>
                <li><strong>Atribución Completa:</strong> Proporción de registros con custodia institucional y licencia verificada.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.55); border:1px solid rgba(245,158,11,0.4); border-radius:10px; padding:15px;">
              <h4 style="margin:0 0 6px 0; color:#fbbf24;">3. Inspector Normativo PRC/OGUC y Expediente Histórico (1990–2024)</h4>
              <p style="margin:0 0 8px 0; color:var(--tinta-suave); font-size:0.89rem; line-height:1.65;">
                La activación de <strong>⚖ Inspector Normativo</strong> y la selección de un punto sobre el mapa ejecutan el cruce espacial de las coberturas regulatorias, emitiendo el <strong>Certificado de Informaciones Normativas VGI (CIN-VGI)</strong>:
              </p>
              <ul style="margin:0 0 12px 0; padding-left:20px; color:var(--tinta-suave); font-size:0.87rem; line-height:1.6;">
                <li>Evalúa la zonificación comunal (<code>PRC</code>) e intercomunal (<code>PRMS</code>), los usos permitidos (<code>UPERM</code>) y prohibidos (<code>UPROH</code>) conforme al principio de exclusión negativa del <strong>Art. 2.1.24 de la OGUC</strong>, además de las restricciones por riesgo (Art. 2.1.17 OGUC) y protección patrimonial (ZCH, ICH, Monumentos Nacionales).</li>
                <li>Integra la evaluación de <strong>Dinámica Edificatoria (Permisos DOM 2010–2025 y Recepciones Finales CRF 2011–2025 del INE)</strong> con métricas morfológicas de Densidad Neta Real (viv/ha, OGUC Art. 1.1.2), Coeficiente de Ocupación de Suelo (COS), Porcentaje de Suelo Libre/Patio y Frente/Fondo predial (a escala manzana y zonificación buffer 500 m), vinculando directamente al repositorio documental oficial de expedientes de Asesoría Urbana de la Municipalidad de Santiago.</li>
                <li>Incorpora la tarjeta de auditoría <strong>🏗️ DINÁMICA EDIFICATORIA, PERMISOS DOM Y RECEPCIONES FINALES (CRF) INE:</strong> con advertencia metodológica expresa: <em>Los resultados arrojados no representan el universo total del punto muestreado sino que están basados en los datos (recepción final [2011–2025] y permisos de edificación [2010–2025]) disponibles públicamente</em>.</li>
              </ul>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="accion" onclick="ModuloManual.irAPanel('inicio')" style="font-size:0.83rem; padding:7px 14px;">🗺️ Abrir Módulo 01 (Visor)</button>
                <a href="https://drive.google.com/drive/folders/1MMxFwr8G3fYCjX2NzO_0yeUIzPN-CSjz" target="_blank" rel="noopener noreferrer" class="accion secundaria" style="font-size:0.83rem; padding:7px 14px; text-decoration:none;">📂 Expedientes Históricos PRC Munistgo (Google Drive) ↗</a>
              </div>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-03',
        parte: 'uso',
        numero: 'USO · 03',
        icono: '🧩',
        titulo: 'Estructura Funcional de los Módulos 01 al 10',
        subtitulo: 'Especificación técnica de cada módulo de la plataforma y navegación directa.',
        html: `
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(295px, 1fr)); gap:12px;">
            <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span style="font-size:0.74rem; font-weight:800; color:#38bdf8;">MÓDULO 01</span>
                <h4 style="margin:4px 0 6px 0;">Visor para la gestión territorial</h4>
                <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Representación espacial integrada de las 132 coberturas, indicadores dinámicos de calidad y evaluación normativa del Plan Regulador Comunal.</p>
              </div>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('inicio')" style="margin-top:10px; font-size:0.8rem;">Abrir Módulo 01 ↗</button>
            </div>

            <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span style="font-size:0.74rem; font-weight:800; color:#38bdf8;">MÓDULO 02</span>
                <h4 style="margin:4px 0 6px 0;">Consultas Overpass (OSM)</h4>
                <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Identificación y consulta selectiva de equipamientos, redes y servicios barriales registrados colaborativamente en OpenStreetMap.</p>
              </div>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('explorador-osm')" style="margin-top:10px; font-size:0.8rem;">Abrir Módulo 02 ↗</button>
            </div>

            <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span style="font-size:0.74rem; font-weight:800; color:#34d399;">MÓDULO 03</span>
                <h4 style="margin:4px 0 6px 0;">Biodiversidad GBIF</h4>
                <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Caracterización de ocurrencias biológicas georreferenciadas de flora, arbolado y avifauna urbana bajo estándar Darwin Core.</p>
              </div>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('biodiversidad-gbif')" style="margin-top:10px; font-size:0.8rem;">Abrir Módulo 03 ↗</button>
            </div>

            <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span style="font-size:0.74rem; font-weight:800; color:#34d399;">MÓDULO 04</span>
                <h4 style="margin:4px 0 6px 0;">Cartografía uMap</h4>
                <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Articulación de proyectos de cartografía participativa y diagnósticos comunitarios elaborados por colectivos locales.</p>
              </div>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('proyectos-umap')" style="margin-top:10px; font-size:0.8rem;">Abrir Módulo 04 ↗</button>
            </div>

            <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(168,85,247,0.45); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span style="font-size:0.74rem; font-weight:800; color:#c084fc;">MÓDULO 05</span>
                <h4 style="margin:4px 0 6px 0;">Indicadores &amp; Storyboards</h4>
                <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Sistematización de las 132 coberturas en 5 Dimensiones Analíticas y 4 Storyboards territoriales con 75 cartografías temáticas.</p>
              </div>
              <button type="button" class="accion" onclick="ModuloManual.irAPanel('indicadores')" style="margin-top:10px; font-size:0.8rem;">Abrir Módulo 05 ↗</button>
            </div>

            <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span style="font-size:0.74rem; font-weight:800; color:#38bdf8;">MÓDULO 06</span>
                <h4 style="margin:4px 0 6px 0;">Calidad &amp; ICV (ISO 19157 / ohsome / OSMCha)</h4>
                <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Evaluación multicriterio WLC v2.0 (Submódulo A), series históricas ohsome API v1/v2 con Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157; Submódulo B) y auditoría OSMCha (Submódulo C).</p>
              </div>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('calidad-ohsome')" style="margin-top:10px; font-size:0.8rem;">Abrir Módulo 06 ↗</button>
            </div>

            <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span style="font-size:0.74rem; font-weight:800; color:#34d399;">MÓDULO 07</span>
                <h4 style="margin:4px 0 6px 0;">Manual de Uso y Actualización</h4>
                <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Documentación metodológica, diagramas de flujo (pipelines), inventario de coberturas y lineamientos de continuidad del Atlas.</p>
              </div>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('manual')" style="margin-top:10px; font-size:0.8rem;">Abrir Módulo 07 ↗</button>
            </div>

            <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span style="font-size:0.74rem; font-weight:800; color:#fbbf24;">MÓDULO 08</span>
                <h4 style="margin:4px 0 6px 0;">Metadatos ISO 19115</h4>
                <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Estructuración y exportación de fichas de metadatos en JSON y XML (ISO 19139) conforme al Perfil Nacional de IDE Chile.</p>
              </div>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('metadatos-iso')" style="margin-top:10px; font-size:0.8rem;">Abrir Módulo 08 ↗</button>
            </div>

            <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span style="font-size:0.74rem; font-weight:800; color:#fbbf24;">MÓDULO 09</span>
                <h4 style="margin:4px 0 6px 0;">Diccionario (132 Capas / 140 Descriptores)</h4>
                <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Catálogo de objetos y atributos (ISO 19110), homologación semántica con IDE Chile e identificación de brechas de información VGI.</p>
              </div>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('diccionario')" style="margin-top:10px; font-size:0.8rem;">Abrir Módulo 09 ↗</button>
            </div>

            <div style="background:rgba(15,23,42,0.6); border:1px solid var(--linea-tarjeta); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <span style="font-size:0.74rem; font-weight:800; color:#c084fc;">MÓDULO 10</span>
                <h4 style="margin:4px 0 6px 0;">Licencias &amp; Catálogos (.xlsx)</h4>
                <p style="font-size:0.84rem; color:var(--tinta-suave); line-height:1.55;">Marco jurídico de datos abiertos (ODbL 1.0, CC BY-SA 4.0, Ley N° 20.285, Ley N° 19.628) y catálogos tabulares consolidados.</p>
              </div>
              <button type="button" class="accion secundaria" onclick="ModuloManual.irAPanel('licencias')" style="margin-top:10px; font-size:0.8rem;">Abrir Módulo 09/10 ↗</button>
            </div>
          </div>
        `
      },
      {
        id: 'cap-uso-04',
        parte: 'uso',
        numero: 'USO · 04',
        icono: '🗂️',
        titulo: `Inventario General de las ${totalCapas} Coberturas Integradas (122 Oficiales + 10 VGI)`,
        subtitulo: 'Registro completo de capas operativas con filtrado dinámico por código, institución custodia o temática.',
        html: `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
            <p style="margin:0; font-size:0.88rem; color:var(--tinta-suave);">
              El inventario consolida las <strong>${totalCapas} coberturas operativas</strong> registradas en la plataforma:
            </p>
            <input type="search" id="input-filtro-catalogo-manual" placeholder="🔍 Filtrar inventario (ej: SUBDERE, PRC, Censo, VGI)..." oninput="ModuloManual.filtrarTablaCatalogo(this.value)" style="min-width:280px; padding:7px 12px; border-radius:8px; border:1px solid var(--linea); background:rgba(15,23,42,0.8); color:var(--tinta);">
          </div>
          <div style="max-height:420px; overflow-y:auto; border:1px solid var(--linea-tarjeta); border-radius:10px;">
            <table class="tabla-metadatos" style="width:100%; border-collapse:collapse; font-size:0.83rem;">
              <thead style="position:sticky; top:0; background:#0f172a; z-index:2;">
                <tr>
                  <th style="padding:10px; text-align:left;">Código</th>
                  <th style="padding:10px; text-align:left;">Denominación de Cobertura y Ruta</th>
                  <th style="padding:10px; text-align:left;">Origen</th>
                  <th style="padding:10px; text-align:left;">Institución Custodia</th>
                  <th style="padding:10px; text-align:left;">Descripción Técnica</th>
                </tr>
              </thead>
              <tbody id="tbody-catalogo-manual">
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
        subtitulo: 'Arquitectura estática autónoma, sincronización simétrica data/ y src/data/, base dual (.geojson + .gpkg) y motor geodésico propio EPSG:32719.',
        html: `
          <p style="font-size:0.9rem; line-height:1.65; color:var(--tinta-suave); margin-bottom:12px;">
            El Atlas implementa una <strong>arquitectura web estática y autónoma</strong>, ejecutándose íntegramente en el navegador del cliente mediante tecnologías web abiertas y peticiones asíncronas optimizadas (<code>Fetch API</code>). Esta formulación garantiza independencia frente a servidores de mapas propietarios de pago, eliminando vulnerabilidades de obsolescencia de paquetes compilados y asegurando su operación perpetua en <strong>Netlify</strong> y <strong>GitHub Pages</strong>.
          </p>

          <h4 style="color:#38bdf8; margin:14px 0 8px 0;">1. Stack Tecnológico Consolidado</h4>
          <ul style="padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65;">
            <li><strong>Front-End</strong>: HTML5 semántico estructurado en 10 módulos (pestañas <code>01</code> a <code>10</code>) y CSS3 puro con variables nativas en <code>src/css/estilos.css</code> (diseño táctico oscuro, ratios WCAG 2.1 AA y microcomponentes de geometrías).</li>
            <li><strong>Lógica de Aplicación</strong>: Vanilla JavaScript ES6+ modular basado en el Patrón de Módulo Revelador (IIFE), encapsulando el estado interno en objetos globales <code>window.Modulo...</code>.</li>
            <li><strong>Motor Cartográfico y Métricas</strong>: Leaflet 1.9.4 articulado con un módulo de reproyección y métricas en <code>src/js/modulos/geodesia.js</code> para la Zona UTM 19 Sur (<code>EPSG:32719</code>; ISO 19111), configurable mediante el Manual de Actualización Técnica.</li>
            <li><strong>Procesamiento y Auditoría</strong>: Suite en Python 3.10+ para verificación topológica, validación de esquemas JSON, cálculo de metacalidad (ISO 19115/19157) y reproyecciones.</li>
            <li><strong>Formatos Cartográficos</strong>: Formato de intercambio web <code>GeoJSON</code> (RFC 7946; Butler et al., 2016) en coordenadas <code>EPSG:4326</code>, y persistencia de bases relacionales en <code>OGC GeoPackage (.gpkg)</code> para resguardar los comentarios SQLite de columnas de SUBDERE RSD 2024.</li>
          </ul>

          <h4 style="color:#fbbf24; margin:16px 0 8px 0;">2. Catálogo Estandarizado Multi-Lenguaje de Archivos de la Plataforma Web</h4>
          <p style="font-size:0.86rem; color:var(--tinta-suave); margin-bottom:10px;">
            Todos los archivos que componen la plataforma web (HTML5, CSS3, JavaScript ES6+ IIFE, SQL/PostGIS, Configuración TOML/JSON y Python 3) se documentan bajo una estructura estandarizada que especifica su lenguaje, ruta, rol funcional, componentes internos y protocolo de modificación:
          </p>
          <div style="overflow-x:auto; border:1px solid var(--linea-tarjeta); border-radius:10px;">
            <table class="tabla-metadatos" style="width:100%; font-size:0.8rem;">
              <thead>
                <tr>
                  <th>Lenguaje</th>
                  <th>Ruta del Archivo</th>
                  <th>Rol Funcional en la Plataforma</th>
                  <th>Estructura Interna / API Pública</th>
                  <th>Protocolo de Modificación</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>HTML5</strong></td>
                  <td><code>src/index.html</code></td>
                  <td>Documento DOM maestro (SPA): articula las 10 pestañas (<code>01</code> a <code>10</code>), el visor 2D, acordeones de capas, modales de Storyboards y Lightbox.</td>
                  <td>Secciones <code>&lt;section class="panel" id="panel-..."&gt;</code>, grilla de botones <code>.chip-oficial</code> y carga secuencial de 21 scripts.</td>
                  <td>Añadir controles <code>.chip-oficial</code> para nuevas capas y actualizar el parámetro <code>?v=...</code> al editar JS/CSS.</td>
                </tr>
                <tr>
                  <td><strong>CSS3</strong></td>
                  <td><code>src/css/estilos.css</code></td>
                  <td>Hoja de estilos del sistema: variables nativas (<code>:root</code>), grillas responsivas, modo oscuro táctico, tarjetas de Storyboards y Lightbox multi-dispositivo.</td>
                  <td>Tokens de diseño, reglas <code>@media</code> para móvil/tablet/escritorio, clases <code>.lamina-storyboard-modal</code> y <code>.lightbox-figura-overlay</code>.</td>
                  <td>Editar variables CSS en <code>:root</code> para cambiar paleta cromática o tipografías en toda la plataforma.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/config.js</code></td>
                  <td>Configuración global síncrona (<code>window.NODO_CONFIG</code>): BBox territorial, comunas RM, endpoints API y las 10 macrocategorías VGI (<code>CAT-01</code> a <code>CAT-10</code>).</td>
                  <td>Objeto <code>CONFIG_PREDETERMINADA</code> y cargador asíncrono <code>cargarConfiguracion()</code> desde <code>config/config.json</code>.</td>
                  <td>Modificar coordenadas de encuadre, colores o consultas Overpass QL de las 10 categorías VGI.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/app.js</code></td>
                  <td>Orquestador central de la aplicación: navegación entre los 10 módulos, estado global de capas activas, filtros espaciales e ICV dinámico en tiempo real.</td>
                  <td>Funciones <code>activarPanel()</code>, <code>alternarCapaOficial()</code>, <code>actualizarTelemetriaCapasActivas()</code> y exportación GeoJSON/CSV.</td>
                  <td>Ajustar lógica de interacción global, contadores de telemetría o perfiles de usuario-tipo.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/modulos/geodesia.js</code></td>
                  <td>Motor matemático de reproyección geodésica al vuelo entre <code>EPSG:4326</code> (WGS84) y <code>EPSG:32719</code> (UTM 19S / SIRGAS-Chile).</td>
                  <td>IIFE <code>ModuloGeodesia</code> con serie de Redfearn / Transverse Mercator, área Gauss/Shoelace (m²/ha) y distancias euclidianas/Haversine.</td>
                  <td>Cambiar parámetros de huso UTM (ej. a Huso 18S) si el Atlas se adapta a otra región geográfica.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/modulos/mapa.js</code></td>
                  <td>Gestor del lienzo cartográfico Leaflet 1.9.4: mapas base, renderizado vectorial, simbología por categoría, popups y herramienta de dibujo de BBox.</td>
                  <td>IIFE <code>ModuloMapa</code> con <code>inicializarMapa()</code>, <code>dibujarCapaGeoJSON()</code> y <code>activarDibujoBbox()</code>.</td>
                  <td>Agregar nuevos proveedores de teselas base (WMS/XYZ) o personalizar estilos de marcadores y polígonos.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/modulos/ide_chile.js</code></td>
                  <td>Catálogo maestro de las <strong>122 coberturas oficiales del Estado</strong> (MINVU, INE, MTT/UOCT, MDSF, SUBDERE, MuniSTGO, SII, CMN, MMA).</td>
                  <td>IIFE <code>ModuloIDEChile</code> con diccionario <code>CAPAS_OFICIALES</code>, cargador con caché en memoria y recorte por BBox.</td>
                  <td>Registrar nuevas capas oficiales definiendo <code>id</code>, <code>nombre</code>, <code>institucion</code>, <code>archivoLocal</code> y simbología.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/modulos/evaluador_normativo.js</code></td>
                  <td>Inspector Normativo del Plan Regulador Comunal de Santiago (PRC/PRMS/OGUC), Certificado CIN-VGI y expediente histórico (1990–2024).</td>
                  <td>IIFE <code>ModuloEvaluadorNormativo</code> con algoritmo Ray-Casting (Point-in-Polygon), reglas Art. 2.1.24/2.1.17 OGUC y <code>HITOS_HISTORICOS_PRC_BRASIL</code>.</td>
                  <td>Añadir nuevas zonas normativas en <code>FUENTES_ORDENANZAS_IPT</code> o nuevos hitos de enmiendas al PRC.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/modulos/osm.js</code> &amp; <code>taginfo.js</code></td>
                  <td>Módulo 02: Cliente Overpass API con failover multi-servidor, constructor de consultas Overpass QL y validador semántico Taginfo API v4.</td>
                  <td>IIFE <code>ModuloOSM</code> y <code>ModuloTaginfo</code> con reconstrucción topológica de nodos/vías y normalización de etiquetas.</td>
                  <td>Añadir servidores espejo Overpass o incorporar nuevas plantillas de consulta rápida en 1 clic.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/modulos/gbif.js</code> &amp; <code>umap.js</code></td>
                  <td>Módulos 03 y 04: Cliente REST GBIF API v1 (estándar Darwin Core) y gestor de proyectos de cartografía participativa uMap e importación local.</td>
                  <td>IIFE <code>ModuloGBIF</code>, <code>ModuloUMap</code> e <code>ImportadorCapas</code> (soporte GeoJSON, KML, GPX y Shapefile ZIP).</td>
                  <td>Actualizar filtros taxonómicos Darwin Core o agregar nuevos enlaces de mapas colaborativos uMap.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/modulos/indicadores_analisis.js</code></td>
                  <td>Módulo 05: Articulación de las 132 capas en <strong>5 Dimensiones Analíticas</strong> y motor de los <strong>4 Storyboards</strong> (75 cartografías, gráficos, SVG y Lightbox).</td>
                  <td>IIFE <code>ModuloIndicadoresAnalisis</code> con arreglos <code>DIMENSIONES</code> y <code>STORYBOARDS</code>, modal de lectura y zoom pan/pinch.</td>
                  <td>Vincular nuevas capas en <code>capasIds</code> o agregar láminas y cartografías en <code>STORYBOARDS</code>.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/modulos/ohsome.js</code>, <code>calidad_analyst.js</code> &amp; <code>evaluador_calidad_cuantitativa.js</code></td>
                  <td>Módulo 06: Motor de Calidad Espacial ISO 19157/19115 (WLC v2.0), Índice de Saturación y Maduración Territorial (ohsome API v1/v2) y auditoría OSMCha.</td>
                  <td>Submódulo A (Evaluador Universal IGV), Submódulo B (Métricas históricas ohsome <code>/count</code>, <code>/length</code>, <code>/area</code> y Score de Madurez) y Submódulo C (OSMCha).</td>
                  <td>Ajustar pesos WLC en <code>PONDERADORES_DEFECTO</code> o umbrales heurísticos de saturación y changesets.</td>
                </tr>
                <tr>
                  <td><strong>JS ES6+</strong></td>
                  <td><code>src/js/modulos/manual.js</code>, <code>metadatos.js</code>, <code>diccionario.js</code> &amp; <code>licencias.js</code></td>
                  <td>Módulos 07, 08, 09 y 10: Visor del Manual, generador de Metadatos ISO 19115/19139 (JSON/XML), Diccionario ISO 19110 (140 descriptores) y Licencias/Catálogos.</td>
                  <td>IIFE <code>ModuloManual</code>, <code>ModuloMetadatos</code>, <code>ModuloDiccionario</code> y <code>ModuloLicencias</code>.</td>
                  <td>Documentar nuevos descriptores en <code>CATALOGO_DICCIONARIO</code> o actualizar plantillas XML ISO 19139.</td>
                </tr>
                <tr>
                  <td><strong>SQL / JSON / TOML</strong></td>
                  <td><code>scripts/db/01_schema_postgis.sql</code>, <code>scripts/db/02_seed_metadata.sql</code>, <code>config/config.json</code> &amp; <code>netlify.toml</code></td>
                  <td>Esquema relacional espacial PostGIS (tablas, funciones RPC e índices GiST/GIN), semilla de metadatos, configuración JSON del nodo y reglas de despliegue CDN/CORS en Netlify.</td>
                  <td>DDL SQL con geometrías <code>EPSG:4326</code>/<code>EPSG:32719</code>, cabeceras HTTP de caché y redirecciones SPA (<code>/geodatabase</code> → <code>/docs/geodatabase_completa_atlas_vgi.zip</code>).</td>
                  <td>Ejecutar <code>scripts/db/01_schema_postgis.sql</code> y <code>02_seed_metadata.sql</code> en PostgreSQL/Supabase o ajustar cabeceras en <code>netlify.toml</code>.</td>
                </tr>
                <tr>
                  <td><strong>Python 3</strong></td>
                  <td><code>scripts/*.py</code> (Scripts de ingeniería ETL, calidad y auditoría)</td>
                  <td>Pipelines de ingesta desde Overpass/GBIF/IDE, reproyección, recorte espacial, cálculo de metacalidad WLC, generación de catálogos Excel y validación pre-deploy.</td>
                  <td>Scripts modulares (<code>verificar_conteo_capas.py</code>, <code>verificar_integridad_despliegue.py</code>, <code>analisis_metacalidad.py</code>, <code>modelo_indice_lineal_wlc.py</code>, <code>generar_catalogos_excel.py</code>, <code>empaquetar_base_datos_completa.py</code>, <code>construir_manual_actualizacion_maestro.py</code>).</td>
                  <td>Ejecutar desde la raíz del proyecto para regenerar datos en <code>data/</code> y <code>src/data/</code>, catálogos en <code>docs/</code> y <code>src/docs/</code> o reconstruir los manuales.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h4 style="color:#f59e0b; margin:18px 0 10px 0;">3. Diagramas de Flujo Operativos (Pipelines INPUT → PROCESAMIENTO → OUTPUT)</h4>
          <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6; margin-bottom:12px;">
            A continuación se esquematizan los principales pipelines de datos del Atlas VGI bajo el modelo de tres etapas (<strong>1. Input / Entrada</strong> → <strong>2. Pipeline de Procesamiento / Módulo</strong> → <strong>3. Output / Entregables Verificables en Git y Plataforma Web</strong>):
          </p>
          <div style="display:flex; flex-direction:column; gap:14px;">
            <!-- Pipeline 1: Extracción Overpass QL y Normalización VGI -->
            <div style="background:#090e1a; border:1px solid rgba(56,189,248,0.35); border-radius:10px; padding:14px;">
              <div style="font-size:0.78rem; font-weight:800; color:#38bdf8; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Pipeline A · Extracción con Overpass API, Overpass QL y Taxonomía VGI (CAT-01 a CAT-10)</div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; align-items:stretch;">
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #38bdf8; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#7dd3fc; display:block; margin-bottom:4px;">1. INPUT / ENTRADA</strong>
                  BBox Territorial (Barrio Brasil / RM) + Diccionario de Etiquetas OSM en <code>src/js/config.js</code> y <code>config/config.json</code>.
                </div>
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #f59e0b; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#fcd34d; display:block; margin-bottom:4px;">2. PROCESAMIENTO (src/js/modulos/osm.js &amp; scripts/descargar_todas_las_categorias_osm.py)</strong>
                  Petición HTTP POST <code>[out:json][timeout:45]</code> con failover multi-servidor → Reconstrucción topológica de nodos y vías → Normalización al esquema maestro de 14 atributos.
                </div>
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #10b981; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#6ee7b7; display:block; margin-bottom:4px;">3. OUTPUT / RUTAS EN GIT Y WEB</strong>
                  10 Capas VGI barriales (<code>data/capa_educacion.geojson</code> a <code>data/capa_cobertura_suelo.geojson</code>), 10 regionales RM (<code>data/capa_osm_rm_cat01_educacion.geojson</code> a <code>cat10_cobertura_suelo.geojson</code>), consolidado <code>data/atlas_vgi_barrio_brasil_uah_completo.geojson</code> (sincronizados en <code>src/data/</code>) y libro <code>docs/categorias_tematicas_osm.xlsx</code> (<code>src/docs/</code>).
                </div>
              </div>
            </div>

            <!-- Pipeline 2: Inspector Normativo PRC Santiago (CIN-VGI) -->
            <div style="background:#090e1a; border:1px solid rgba(245,158,11,0.35); border-radius:10px; padding:14px;">
              <div style="font-size:0.78rem; font-weight:800; color:#fbbf24; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Pipeline B · Inspector Normativo del Plan Regulador Comunal de Santiago (CIN-VGI)</div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; align-items:stretch;">
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #38bdf8; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#7dd3fc; display:block; margin-bottom:4px;">1. INPUT / ENTRADA</strong>
                  Clic en coordenada <code>(lat, lng)</code> en el visor + Capas en <code>src/data/</code> y <code>data/</code>: <code>ide_minvu_ipt_prc_santiago.geojson</code>, <code>capa_ipt_prc_comunal.geojson</code>, <code>ZCH_ICH_RM_Patrimonio_IPT.geojson</code>, <code>ide_minvu_patrimonio.geojson</code> e <code>ide_minvu_ipt_areas_riesgo.geojson</code>.
                </div>
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #f59e0b; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#fcd34d; display:block; margin-bottom:4px;">2. PROCESAMIENTO (src/js/modulos/evaluador_normativo.js)</strong>
                  Algoritmo Point-in-Polygon (Ray-Casting) + Cruce con Art. 2.1.24 y 2.1.17 OGUC + Consulta a los 10 Hitos Históricos del PRC en Barrio Brasil (1990–2024).
                </div>
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #10b981; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#6ee7b7; display:block; margin-bottom:4px;">3. OUTPUT / RUTAS EN GIT Y WEB</strong>
                  Certificado de Informaciones Normativas VGI (CIN-VGI) interactivo e imprimible en el Módulo 01 (con alerta metodológica de cobertura de recepciones finales [2011–2025] y permisos DOM INE [2010–2025]) y catálogo de fuentes en <code>docs/catalogo_fuentes_vgi.xlsx</code> (<code>src/docs/</code>).
                </div>
              </div>
            </div>

            <!-- Pipeline 3: Motor Multicriterio de Calidad ISO 19157 & ISO 19115 (WLC v2.0 + ohsome) -->
            <div style="background:#090e1a; border:1px solid rgba(16,185,129,0.35); border-radius:10px; padding:14px;">
              <div style="font-size:0.78rem; font-weight:800; color:#34d399; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Pipeline C · Evaluación de Calidad Espacial WLC v2.0 e Índice de Saturación y Maduración Territorial (ISO 19157 / ohsome API)</div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; align-items:stretch;">
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #38bdf8; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#7dd3fc; display:block; margin-bottom:4px;">1. INPUT / ENTRADA</strong>
                  132 Capas en <code>src/data/*.geojson</code> y <code>data/*.geojson</code> + Series históricas OSHDB/ohsome API v1/v2 (<code>/elements/count</code>, <code>/length</code>, <code>/area</code> y <code>/users/count</code>).
                </div>
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #f59e0b; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#fcd34d; display:block; margin-bottom:4px;">2. PROCESAMIENTO (src/js/modulos/ohsome.js, calidad_analyst.js, scripts/analisis_metacalidad.py &amp; modelo_indice_lineal_wlc.py)</strong>
                  Reproyección a <code>EPSG:32719</code> → Cálculo de Densidad Espacial (<code>elem/km²</code> y <code>elem/10.000 m²</code>), Intensidad Comunitaria (<code>edit/user</code>), Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / ISO 19157) y Combinación Lineal Ponderada WLC.
                </div>
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #10b981; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#6ee7b7; display:block; margin-bottom:4px;">3. OUTPUT / RUTAS EN GIT Y WEB</strong>
                  <code>docs/ANALISIS_METACALIDAD.md</code>, <code>docs/matriz_metacalidad.json</code>, <code>docs/wlc_metacalidad_resultado.json</code>, <code>docs/wlc_metacalidad_ranking.csv</code>, <code>docs/correlacion_dimensiones_calidad.csv</code>, <code>docs/correlacion_dimensiones_calidad.png</code> y <code>docs/perfil_metadatos_vgi.xlsx</code> (sincronizados en <code>src/docs/</code>) + Módulo 06.
                </div>
              </div>
            </div>

            <!-- Pipeline 4: Síntesis Espacial, Indicadores KDE/LISA y Storyboards (Módulo 05) -->
            <div style="background:#090e1a; border:1px solid rgba(168,85,247,0.35); border-radius:10px; padding:14px;">
              <div style="font-size:0.78rem; font-weight:800; color:#c084fc; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Pipeline D · Modelamiento Espacial (KDE / LISA / Censo 2024) y Empaquetado de Geodatabase Completa</div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; align-items:stretch;">
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #38bdf8; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#7dd3fc; display:block; margin-bottom:4px;">1. INPUT / ENTRADA</strong>
                  <code>data/ide_censo2024_manzanas.geojson</code> + <code>data/RSH_*_UV_2026_*.geojson</code> + <code>data/BIP_Iniciativas_Inversion_RM_Comunas.geojson</code> + <code>data/bip_inversiones_santiago.csv</code> + <code>data/resumen_catastro_vgi.csv</code>.
                </div>
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #f59e0b; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#fcd34d; display:block; margin-bottom:4px;">2. PROCESAMIENTO (src/js/modulos/indicadores_analisis.js &amp; scripts/empaquetar_base_datos_completa.py)</strong>
                  Clasificación en 5 Dimensiones Analíticas + Articulación de los 4 Storyboards (75 cartografías) + Empaquetado e indexación SHA-256 de la Geodatabase completa.
                </div>
                <div style="background:rgba(30,41,59,0.7); border-left:3px solid #10b981; padding:10px; border-radius:6px; font-size:0.8rem;">
                  <strong style="color:#6ee7b7; display:block; margin-bottom:4px;">3. OUTPUT / RUTAS EN GIT Y WEB</strong>
                  <code>data/matriz_sintesis_barrio_brasil_manzanas.geojson</code> (<code>src/data/</code>), paquete maestro <code>docs/geodatabase_completa_atlas_vgi.zip</code> (<code>src/docs/geodatabase_completa_atlas_vgi.zip</code>) y 4 Storyboards interactivos en el Módulo 05.
                </div>
              </div>
            </div>
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
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="background:rgba(15,23,42,0.6); border-left:4px solid #38bdf8; padding:11px 15px; border-radius:8px;">
              <strong style="color:#38bdf8;">Etapa 1 · Normalización Geodésica a <code>EPSG:4326</code>:</strong>
              <span style="font-size:0.87rem; color:var(--tinta-suave); display:block; margin-top:3px;">
                La cobertura debe proyectarse en coordenadas geográficas <strong><code>EPSG:4326</code> (WGS84 / SIRGAS-Chile, grados decimales)</strong>. Se exporta en formato <code>GeoJSON</code> con codificación UTF-8 sin BOM (ejemplo: <code>bbdd_99.geojson</code>).
              </span>
            </div>

            <div style="background:rgba(15,23,42,0.6); border-left:4px solid #38bdf8; padding:11px 15px; border-radius:8px;">
              <strong style="color:#38bdf8;">Etapa 2 · Almacenamiento Simétrico en <code>data/</code> y <code>src/data/</code>:</strong>
              <span style="font-size:0.87rem; color:var(--tinta-suave); display:block; margin-top:3px;">
                El archivo debe copiarse de forma idéntica en <code>data/bbdd_99.geojson</code> y <code>src/data/bbdd_99.geojson</code>. Si dispone de base GeoPackage (.gpkg) original con diccionarios nativos, resguardarla paralelamente en ambos directorios.
              </span>
            </div>

            <div style="background:rgba(15,23,42,0.6); border-left:4px solid #38bdf8; padding:11px 15px; border-radius:8px;">
              <strong style="color:#38bdf8;">Etapa 3 · Registro en <code>src/js/modulos/ide_chile.js</code> (<code>CAPAS_OFICIALES</code>):</strong>
              <pre style="background:#090d16; padding:9px; border-radius:6px; font-size:0.77rem; color:#e2e8f0; overflow-x:auto; margin:6px 0 0 0;"><code>bbdd_99: {
  id: 'bbdd_99',
  nombre: 'Puntos Limpios y Reciclaje Barrial (BBDD-99)',
  institucion: 'Ilustre Municipalidad de Santiago / MMA',
  archivoLocal: 'data/bbdd_99.geojson',
  color: '#10b981',
  peso: 2,
  opacidadRelleno: 0.35,
  geometria: 'Punto', // 'Punto' | 'Línea' | 'Polígono'
  num_bbdd: 99,
  licencia: 'Datos Abiertos / Ley 20.285',
  descripcion: 'Catastro georreferenciado de infraestructura de reciclaje en el Barrio Brasil.'
},</code></pre>
            </div>

            <div style="background:rgba(15,23,42,0.6); border-left:4px solid #38bdf8; padding:11px 15px; border-radius:8px;">
              <strong style="color:#38bdf8;">Etapa 4 · Incorporación del Control Interactivo en <code>src/index.html</code>:</strong>
              <pre style="background:#090d16; padding:9px; border-radius:6px; font-size:0.77rem; color:#e2e8f0; overflow-x:auto; margin:6px 0 0 0;"><code>&lt;button type="button" class="chip-oficial" id="btn-oficial-bbdd_99" data-capa="bbdd_99" title="Ilustre Municipalidad de Santiago / MMA"&gt;
  &lt;span class="dot-color" style="background:#10b981;"&gt;&lt;/span&gt;
  &lt;span class="nombre-chip"&gt;99. Puntos Limpios y Reciclaje Barrial&lt;/span&gt;
  &lt;span class="badge-institucion-chip"&gt;MUNISTGO&lt;/span&gt;
  &lt;span class="badge-geom-chip"&gt;● PUN&lt;/span&gt;
&lt;/button&gt;</code></pre>
            </div>

            <div style="background:rgba(15,23,42,0.6); border-left:4px solid #38bdf8; padding:11px 15px; border-radius:8px;">
              <strong style="color:#38bdf8;">Etapa 5 · Asignación Dimensional y Catalogación Atributiva:</strong>
              <span style="font-size:0.87rem; color:var(--tinta-suave); display:block; margin-top:3px;">
                En <code>src/js/modulos/indicadores_analisis.js</code>, añadir el nombre en <code>NOMBRES_OFICIALES_FALLBACK</code> y asociar <code>'bbdd_99'</code> al arreglo <code>capasIds</code> de la dimensión analítica correspondiente en <code>DIMENSIONES</code>. En <code>src/js/modulos/diccionario.js</code>, documentar los atributos de la capa en <code>CATALOGO_DICCIONARIO</code>.
              </span>
            </div>

            <div style="background:rgba(16,185,129,0.1); border-left:4px solid #10b981; padding:11px 15px; border-radius:8px;">
              <strong style="color:#34d399;">Etapa 6 · Actualización de Geometrías sin Cambio de Identificador:</strong>
              <span style="font-size:0.87rem; color:var(--tinta-suave); display:block; margin-top:3px;">
                Cuando únicamente se actualizan las entidades conservando el nombre de archivo existente, basta con sobrescribir el archivo en <code>data/</code> y <code>src/data/</code> bajo <code>EPSG:4326</code>. El motor del visor procesa los nuevos datos automáticamente sin requerir cambios en el código JavaScript.
              </span>
            </div>
          </div>
        `
      },
      {
        id: 'cap-act-03',
        parte: 'actualizacion',
        numero: 'ACT · 03',
        icono: '📊',
        titulo: 'Mantención de Storyboards, Evaluador Normativo y Diccionario',
        subtitulo: 'Esquema canónico de láminas de análisis, actualización de enmiendas al PRC y metadatos ISO 19110.',
        html: `
          <h4 style="color:#f59e0b; margin:0 0 6px 0;">1. Estructura Obligatoria para Nuevos Storyboards (Módulo 05)</h4>
          <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6; margin-bottom:10px;">
            Para garantizar que el modal <code>abrirLaminaStoryboard</code> se abra sin errores, todo nuevo storyboard en <code>src/js/modulos/indicadores_analisis.js</code> debe definir obligatoriamente las siguientes 10 propiedades en <code>contenido</code>:
          </p>
          <ul style="padding-left:20px; color:var(--tinta-suave); font-size:0.86rem; line-height:1.65; margin-bottom:14px;">
            <li><code>introduccion</code>: Párrafo de apertura o síntesis ejecutiva (cadena de texto).</li>
            <li><code>datosClave</code>: Arreglo de 4 tarjetas KPI con <code>{ valor, label, sub }</code>.</li>
            <li><code>porcentajesClave</code>: Arreglo de barras con <code>{ label, valor, porcentaje, contexto }</code>.</li>
            <li><code>graficoComparativo</code>: Objeto con <code>titulo</code> y arreglo <code>filas</code> de <code>{ label, valor, porcentaje }</code>.</li>
            <li><code>diagramaSVG</code>: Función flecha <code>() =&gt; \`&lt;svg ...&gt;...\`</code> que retorna el código vectorial SVG.</li>
            <li><code>tablaIndicadores</code>: Arreglo de filas cuantitativas con <code>{ variable, valor, referencial, fuente }</code>.</li>
            <li><code>cuerpo</code>: Arreglo de cadenas de texto con los párrafos analíticos profundos.</li>
            <li><code>conclusion</code>: Síntesis de implicancia territorial y políticas públicas (cadena de texto).</li>
            <li><code>analisisPorActor</code>: Arreglo de 4 perfiles de usuarios-tipo con <code>{ id, icono, nombre, subtitulo, utilidad }</code> (usar IDs <code>institucion</code>, <code>comunidad</code>, <code>voluntario</code>, <code>ong</code>).</li>
            <li><code>apartadoBibliografico</code>: Objeto con arreglos <code>fuentesDatos</code> y <code>referenciasAcademicas</code> (norma APA 7ª ed.).</li>
          </ul>

          <h4 style="color:#38bdf8; margin:14px 0 6px 0;">2. Actualización del Evaluador Normativo e Hitos Históricos del PRC</h4>
          <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6;">
            En <code>src/js/modulos/evaluador_normativo.js</code>, el arreglo <code>HITOS_HISTORICOS_PRC_BRASIL</code> documenta la trayectoria regulatoria comunal. Al promulgarse una nueva enmienda o seccional en la Municipalidad de Santiago, se añade un nuevo objeto con <code>anio</code>, <code>hito</code> y <code>detalle</code>. Los datos se propagan automáticamente al inspector del visor y al Certificado CIN-VGI descargable.
          </p>

          <h4 style="color:#a855f7; margin:14px 0 6px 0;">3. Catálogo de Descriptores Técnicos (ISO 19110:2016)</h4>
          <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6;">
            En <code>src/js/modulos/diccionario.js</code>, cada cobertura registrada cuenta con su especificación formal en <code>CATALOGO_DICCIONARIO</code>, definiendo código, título, institución custodia, tipo geométrico, norma legal y matriz de atributos con nombre de columna, tipo de dato y descripción semántica.
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
          <h4 style="color:#34d399; margin:0 0 6px 0;">1. Verificación Pre-Despliegue Obligatoria</h4>
          <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6;">
            Previo a cualquier commit en producción, deben ejecutarse desde la raíz del repositorio los tres scripts de auditoría en Python:
          </p>
          <pre style="background:#090d16; padding:11px; border-radius:8px; font-size:0.79rem; color:#34d399; overflow-x:auto;"><code># 1. Audita la paridad de 132 capas (122 oficiales + 10 VGI) y 140 descriptores:
python scripts/verificar_conteo_capas.py

# 2. Audita integridad de archivos GeoJSON, ausencia de punteros LFS y paridad data/ <-> src/data/:
python scripts/verificar_integridad_despliegue.py

# 3. Calcula el Índice Global de MetaCalidad (ISO 19115 / ISO 19157):
python scripts/analisis_metacalidad.py</code></pre>

          <h4 style="color:#fbbf24; margin:14px 0 6px 0;">2. Control de Versión de Caché (Cache-Busting)</h4>
          <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6;">
            Al modificar archivos <code>.js</code> o <code>.css</code>, se incrementa el parámetro de versión <code>?v=...</code> en las etiquetas <code>&lt;link&gt;</code> y <code>&lt;script&gt;</code> de <code>src/index.html</code> (por ejemplo, de <code>?v=20261015_v5</code> a <code>?v=20261015_v6</code>), asegurando que los clientes web no retengan scripts obsoletos.
          </p>

          <h4 style="color:#38bdf8; margin:14px 0 6px 0;">3. Publicación en Producción (GitHub y Netlify)</h4>
          <p style="font-size:0.88rem; color:var(--tinta-suave); line-height:1.6;">
            Con los tres scripts en estado <code>[OK] EXITO</code>, los cambios se envían a la rama principal:
          </p>
          <pre style="background:#090d16; padding:11px; border-radius:8px; font-size:0.79rem; color:#38bdf8; overflow-x:auto;"><code>git add -A
git commit -m "Fix: Actualización técnica y documental del Atlas VGI"
git push origin main</code></pre>
          <p style="font-size:0.85rem; color:var(--tinta-tenue); margin-top:6px;">
            Netlify detectará el push en <code>main</code> y sincronizará la versión pública automáticamente en segundos.
          </p>
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
          <h4 style="color:#ef4444; margin:0 0 8px 0;">1. Matriz de Diagnóstico y Resolución Rápida de Errores</h4>
          <div style="overflow-x:auto; border:1px solid var(--linea-tarjeta); border-radius:10px; margin-bottom:16px;">
            <table class="tabla-metadatos" style="width:100%; font-size:0.82rem;">
              <thead>
                <tr>
                  <th>Síntoma Técnico</th>
                  <th>Causa Identificada</th>
                  <th>Procedimiento de Solución</th>
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
                  <td>Discrepancia entre la ruta de <code>archivoLocal</code> en <code>ide_chile.js</code> y el archivo en <code>src/data/</code>.</td>
                  <td>Verificar coincidencia estricta de caracteres en minúscula en la ruta del archivo.</td>
                </tr>
                <tr>
                  <td><strong>Modal de Storyboard no abre al hacer clic.</strong></td>
                  <td>Incompatibilidad de esquema en <code>indicadores_analisis.js</code> (falta alguna propiedad requerida).</td>
                  <td>Comprobar en la consola (F12) que <code>datosClave</code>, <code>porcentajesClave</code>, <code>filas</code> y <code>diagramaSVG()</code> existan.</td>
                </tr>
                <tr>
                  <td><strong>Modificaciones no visibles en navegador.</strong></td>
                  <td>Retención de archivos en caché local.</td>
                  <td>Incrementar <code>?v=...</code> en <code>src/index.html</code> y forzar recarga (Ctrl + F5).</td>
                </tr>
                <tr>
                  <td><strong>Descuadre en script de conteo de capas.</strong></td>
                  <td>Capa registrada en <code>ide_chile.js</code> pero omitida en <code>indicadores_analisis.js</code> o <code>diccionario.js</code>.</td>
                  <td>Revisar el log del script para asociar la capa faltante a su dimensión correspondiente.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 style="color:#c084fc; margin:16px 0 8px 0;">2. Régimen Jurídico de Licencias y Protección de Datos</h4>
          <ul style="padding-left:20px; color:var(--tinta-suave); font-size:0.88rem; line-height:1.65; margin-bottom:14px;">
            <li><strong>Open Database License (ODbL 1.0)</strong>: Rige las categorías VGI provenientes de OpenStreetMap, exigiendo atribución y compartición bajo términos idénticos.</li>
            <li><strong>Creative Commons Atribución-CompartirIgual 4.0 (CC BY-SA 4.0)</strong>: Aplica sobre las capas de síntesis y productos cartográficos derivados generados por la Universidad Alberto Hurtado.</li>
            <li><strong>GNU Affero General Public License v3 (AGPLv3)</strong>: Licencia del código fuente de software, asegurando la libertad comunitaria de auditoría y mejora.</li>
            <li><strong>Ley N° 20.285 de Transparencia</strong>: Fundamenta la disponibilidad y reutilización de datos geográficos generados por organismos públicos del Estado de Chile.</li>
            <li><strong>Ley N° 19.628 de Protección de la Vida Privada</strong>: Garantizada mediante la anonimización y agregación espacial de microdatos (RSH, Censo, SII) a nivel de manzana y unidad vecinal.</li>
          </ul>

          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
            <a href="docs/MANUAL_USO.md" download="MANUAL_USO_ATLAS_VGI.md" class="accion" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">📥 Descargar Manual de Uso (.md)</a>
            <a href="docs/MANUAL_ACTUALIZACION_ATLAS.md" download="MANUAL_ACTUALIZACION_ATLAS_VGI.md" class="accion" style="text-decoration:none; font-size:0.82rem; padding:8px 14px; background:linear-gradient(135deg, #f59e0b, #d97706); color:#0f172a; font-weight:800;">🛠️ Descargar Manual de Actualización Técnica (.md)</a>
            <a href="docs/ARQUITECTURA.md" download="ARQUITECTURA_ATLAS_VGI.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">🏗️ Arquitectura del Sistema (.md)</a>
            <a href="docs/ANALISIS_METACALIDAD.md" download="ANALISIS_METACALIDAD_ATLAS_VGI.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">📊 Análisis de MetaCalidad WLC (.md)</a>
            <a href="docs/GUIA_BASE_DATOS_SUPABASE.md" download="GUIA_BASE_DATOS_SUPABASE_POSTGIS.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">🗄️ Guía PostGIS / Supabase (.md)</a>
            <a href="docs/DICCIONARIO_CATASTRO_RSD_SUBDERE_2024.md" download="DICCIONARIO_CATASTRO_RSD_SUBDERE_2024.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">♻️ Diccionario SUBDERE RSD (.md)</a>
            <a href="docs/INFORME_PROYECTO_ATLAS_VGI.md" download="INFORME_PROYECTO_ATLAS_VGI.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">📄 Informe del Proyecto (.md)</a>
            <a href="docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md" download="BIBLIOGRAFIA_SEMINARIO_Y_ATLAS_APA7.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">📚 Bibliografía APA 7ª Ed. (125 refs .md)</a>
            <a href="docs/TRAZABILIDAD_ACADEMICA.md" download="TRAZABILIDAD_ACADEMICA_ATLAS_VGI.md" class="accion secundaria" style="text-decoration:none; font-size:0.82rem; padding:8px 14px;">🏛️ Memoria y Trazabilidad (.md)</a>
          </div>
        `
      }
    ];
  }

  /**
   * Construye el HTML completo del Manual de Uso y Manual de Actualización
   */
  function construirHTMLManual() {
    const capitulos = obtenerCapitulosManual();
    const capsFiltrados = modoManualActivo === 'todos'
      ? capitulos
      : capitulos.filter(c => c.parte === modoManualActivo);

    const htmlIndice = capsFiltrados.map(c => {
      const badgeColor = c.parte === 'actualizacion'
        ? 'background:rgba(245,158,11,0.18); color:#fbbf24; border:1px solid rgba(245,158,11,0.4);'
        : 'background:rgba(56,189,248,0.18); color:#38bdf8; border:1px solid rgba(56,189,248,0.4);';
      return `
        <button type="button" class="accion secundaria" onclick="ModuloManual.irACapitulo('${c.id}')" style="text-align:left; display:flex; align-items:center; gap:8px; padding:9px 12px; font-size:0.83rem;">
          <span style="padding:2px 6px; border-radius:5px; font-size:0.7rem; font-weight:800; ${badgeColor}">${c.numero}</span>
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.icono} ${c.titulo}</span>
        </button>
      `;
    }).join('');

    const htmlCapitulos = capsFiltrados.map(c => {
      const bordeColor = c.parte === 'actualizacion' ? '#f59e0b' : '#38bdf8';
      const etiquetaParte = c.parte === 'actualizacion'
        ? '🛠️ PARTE II · MANUAL DE ACTUALIZACIÓN Y MANTENCIÓN TÉCNICA'
        : '📘 PARTE I · MANUAL DE USO DEL ATLAS';
      return `
        <article class="tarjeta-manual-capitulo" id="${c.id}" style="background:rgba(15,23,42,0.45); border:1px solid var(--linea-tarjeta); border-top:3px solid ${bordeColor}; border-radius:12px; padding:22px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
            <span style="font-size:0.75rem; font-weight:800; letter-spacing:0.04em; color:${bordeColor};">${etiquetaParte} — ${c.numero}</span>
          </div>
          <h3 style="margin:0 0 6px 0; font-size:1.18rem; color:var(--tinta);">${c.icono} ${c.titulo}</h3>
          <p style="margin:0 0 14px 0; font-size:0.88rem; color:var(--tinta-tenue); border-bottom:1px solid var(--linea); padding-bottom:10px;">${c.subtitulo}</p>
          <div class="cuerpo-capitulo-manual">
            ${c.html}
          </div>
        </article>
      `;
    }).join('');

    return `
      <!-- Barra superior de selección entre Manual de Uso y Manual de Actualización -->
      <div style="background:rgba(15,23,42,0.75); border:1px solid var(--linea-tarjeta); border-radius:12px; padding:16px; margin-bottom:18px; display:flex; flex-direction:column; gap:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="accion ${modoManualActivo === 'todos' ? '' : 'secundaria'}" onclick="ModuloManual.cambiarModoManual('todos')" style="font-size:0.85rem; padding:8px 14px;">
              📚 Ambos Manuales
            </button>
            <button type="button" class="accion ${modoManualActivo === 'uso' ? '' : 'secundaria'}" onclick="ModuloManual.cambiarModoManual('uso')" style="font-size:0.85rem; padding:8px 14px;">
              📘 Parte I: Manual de Uso
            </button>
            <button type="button" class="accion ${modoManualActivo === 'actualizacion' ? '' : 'secundaria'}" onclick="ModuloManual.cambiarModoManual('actualizacion')" style="font-size:0.85rem; padding:8px 14px;">
              🛠️ Parte II: Manual de Actualización Técnica
            </button>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <input type="search" id="buscador-general-manual" placeholder="🔍 Filtrar documentación..." oninput="ModuloManual.filtrarManual(this.value)" style="padding:7px 12px; border-radius:8px; border:1px solid var(--linea); background:rgba(9,13,22,0.85); color:var(--tinta); min-width:210px;">
            <a href="docs/MANUAL_USO.md" download="MANUAL_USO_ATLAS_VGI.md" class="accion secundaria" style="text-decoration:none; font-size:0.8rem; padding:7px 12px;">📥 Uso (.md)</a>
            <a href="docs/MANUAL_ACTUALIZACION_ATLAS.md" download="MANUAL_ACTUALIZACION_ATLAS_VGI.md" class="accion secundaria" style="text-decoration:none; font-size:0.8rem; padding:7px 12px; border-color:#f59e0b; color:#fbbf24;">🛠️ Actualización (.md)</a>
            <a href="docs/BIBLIOGRAFIA_SEMINARIO_Y_ATLAS.md" download="BIBLIOGRAFIA_SEMINARIO_Y_ATLAS_APA7.md" class="accion secundaria" style="text-decoration:none; font-size:0.8rem; padding:7px 12px;">📚 Bibliografía APA (.md)</a>
          </div>
        </div>

        <!-- Índice rápido de capítulos -->
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:8px;">
          ${htmlIndice}
        </div>
      </div>

      <!-- Contenedor de capítulos -->
      <div id="lista-capitulos-manual">
        ${htmlCapitulos}
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
    renderizarManual();
  }

  /**
   * Desplaza suavemente la vista hacia un capítulo específico del manual
   */
  function irACapitulo(idCapitulo) {
    const el = document.getElementById(idCapitulo);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
   * Filtra los capítulos del manual por texto libre
   */
  function filtrarManual(termino) {
    const q = String(termino || '').trim().toLowerCase();
    const articulos = document.querySelectorAll('.tarjeta-manual-capitulo');
    articulos.forEach(art => {
      if (!q) {
        art.style.display = '';
      } else {
        const texto = (art.textContent || '').toLowerCase();
        art.style.display = texto.includes(q) ? '' : 'none';
      }
    });
  }

  /**
   * Filtra las filas de la tabla de las 132 capas dentro del capítulo USO · 04
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
    irACapitulo,
    irAPanel,
    filtrarManual,
    filtrarTablaCatalogo
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloManual = ModuloManual;
}
