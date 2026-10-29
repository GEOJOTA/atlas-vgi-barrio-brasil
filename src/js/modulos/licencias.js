/*
  licencias.js
  ------------
  Marco legal, licencias abiertas y catálogos estructurados del Atlas VGI.
  Adopta el marco tripartito adaptado a la legislación chilena y los bienes
  comunes digitales (CC BY-SA 4.0 + ODbL 1.0 + GNU AGPLv3), descartando
  licencias permisivas (MIT) para garantizar la reciprocidad comunitaria.
*/

const ModuloLicencias = (() => {

  const LICENCIA_ATLAS = {
    titulo: 'Marco Tripartito de Licenciamiento Abierto (Atlas VGI UAH)',
    justificacion: 'Se descarta expresamente la licencia permisiva MIT para el proyecto. En el contexto de la Información Geográfica Voluntaria y los datos públicos en Chile, MIT permite que actores comerciales privaticen la cartografía y cierren el código sin compartir mejoras. En su reemplazo, se adopta un marco de copyleft y reciprocidad obligatoria fundamentado en la Ley N° 17.336 de Propiedad Intelectual y la Ley N° 20.285 de Transparencia y Acceso a la Información Pública:',
    pilares: [
      {
        ambito: 'Documentación, Metodología, Cartografía y Manual de Uso',
        licencia: 'Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)',
        implicancia: 'Permite compartir y adaptar libremente los contenidos siempre que se otorgue crédito al Atlas VGI UAH y se distribuyan las obras derivadas bajo la misma licencia idéntica (cláusula Share-Alike). Impide el cercamiento comercial.',
        url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.es'
      },
      {
        ambito: 'Bases de Datos Geográficas y Capas Espaciales (VGI)',
        licencia: 'Open Database License (ODbL) v1.0',
        implicancia: 'Garantiza compatibilidad nativa 1:1 con la OpenStreetMap Foundation (OSMF). Cualquier base de datos derivada enriquecida debe distribuirse bajo la misma licencia ODbL, manteniendo la atribución comunitaria obligatoria.',
        url: 'https://opendatacommons.org/licenses/odbl/'
      },
      {
        ambito: 'Código Fuente de la Plataforma Web y Scripts de Procesamiento',
        licencia: 'GNU Affero General Public License v3.0 (GNU AGPLv3)',
        implicancia: 'Diseñada para software de red y visores web. Si cualquier institución o empresa aloja una versión modificada del visor en un servidor, está legalmente obligada a poner a disposición de la comunidad el código fuente completo modificado.',
        url: 'https://www.gnu.org/licenses/agpl-3.0.html'
      }
    ]
  };

  const FUENTES = [
    {
      nombre: 'OpenStreetMap (OSM)',
      licencia: 'Open Database License (ODbL) 1.0',
      implicancia: 'Libertad para copiar, distribuir, transmitir y adaptar los datos espaciales, siempre que se atribuya a "© colaboradores de OpenStreetMap". Si se genera una base de datos derivada, debe distribuirse bajo la misma licencia ODbL (Share-Alike).',
      url: 'https://www.openstreetmap.org/copyright'
    },
    {
      nombre: 'ohsome API (HeiGIT - Universidad de Heidelberg)',
      licencia: 'Derivada ODbL 1.0 (datos históricos OSM)',
      implicancia: 'Las métricas y series temporales analíticas reflejan el historial de OpenStreetMap. Todo análisis cuantitativo preserva la atribución de autoría colectiva a la comunidad OSM y al HeiGIT.',
      url: 'https://docs.ohsome.org'
    },
    {
      nombre: 'GBIF (Global Biodiversity Information Facility)',
      licencia: 'Específica por dataset: CC0 1.0, CC-BY 4.0 o CC-BY-NC 4.0 (Darwin Core)',
      implicancia: 'Cada registro biológico declara sus propios términos legales. Para la gestión territorial comunitaria se priorizan observaciones bajo CC0 y CC-BY, respetando los derechos de los naturalistas.',
      url: 'https://www.gbif.org/citation-guidelines'
    },
    {
      nombre: 'UMap (OpenStreetMap Francia)',
      licencia: 'Declarada individualmente por cada colectivo cartográfico',
      implicancia: 'Los proyectos cartográficos comunitarios incorporados en el Atlas definen sus términos en la ficha del mapa matriz.',
      url: 'https://umap.openstreetmap.fr'
    },
    {
      nombre: 'IDE Chile / Sistema Nacional de Información Territorial (SNIT)',
      licencia: 'Datos Abiertos del Gobierno de Chile (Ley N° 20.285)',
      implicancia: 'Uso libre para fines públicos, de investigación académica y toma de decisiones territoriales, con mención obligatoria al ministerio o servicio técnico emisor (MBN, INE, MINVU, MTT).',
      url: 'https://www.ide.cl'
    }
  ];

  function render() {
    const bloqueAtlas = `
      <div class="bloque" style="border-left:4px solid var(--musgo); background:var(--papel-alto); padding:16px; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
          <div>
            <span class="marcador">07 / LICENCIAMIENTO</span>
            <h3 style="margin:4px 0 8px 0;">${LICENCIA_ATLAS.titulo}</h3>
          </div>
          <button type="button" class="accion" onclick="window.navegarAManual('doc-gobernanza')" style="font-size:0.82rem; padding:6px 14px;">
            📖 Ver Marco Jurídico en el Manual ↗
          </button>
        </div>
        <p style="font-size:0.9rem; line-height:1.5; color:var(--tinta); margin-bottom:12px;">
          ${LICENCIA_ATLAS.justificacion}
        </p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-top:12px;">
          ${LICENCIA_ATLAS.pilares.map(p => `
            <div style="background:var(--papel); border:1px solid var(--linea); padding:12px; border-radius:2px;">
              <strong style="font-size:0.88rem; color:var(--musgo-oscuro);">${p.ambito}</strong>
              <div style="font-family:'IBM Plex Mono', monospace; font-size:0.82rem; font-weight:bold; margin:6px 0; color:var(--tinta);">
                ${p.licencia}
              </div>
              <p style="font-size:0.82rem; color:var(--tinta-suave); margin-bottom:8px;">${p.implicancia}</p>
              <a href="${p.url}" target="_blank" rel="noopener" style="font-size:0.78rem; text-decoration:none;">Más información legal ↗</a>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const bloquesFuentes = `
      <div class="bloque">
        <h3>Licenciamiento de las Fuentes Proveedoras de Datos</h3>
        <p class="descripcion">Términos de reutilización, restricciones legales y condiciones de atribución de cada servicio integrado:</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px; margin-top:10px;">
          ${FUENTES.map(f => `
            <div style="background:var(--papel-alto); border:1px solid var(--linea); padding:12px;">
              <h4 style="margin:0 0 6px 0; font-size:0.95rem;">${f.nombre}</h4>
              <p style="font-size:0.82rem; margin:0 0 6px 0;"><strong>Licencia:</strong> <code>${f.licencia}</code></p>
              <p style="font-size:0.82rem; color:var(--tinta-suave); margin:0 0 8px 0;">${f.implicancia}</p>
              <p style="margin:0;"><a href="${f.url}" target="_blank" rel="noopener" style="font-size:0.78rem;">${f.url} ↗</a></p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const bloqueDescargas = `
      <div class="bloque" style="background:var(--papel-alto); border:1px solid var(--linea); padding:16px; margin-top:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
          <h3 style="margin:0;">📦 Base de Datos Integral y Catálogos Metodológicos</h3>
          <span class="doc-pequeno" style="font-family:'IBM Plex Mono', monospace;">Sincronizados en docs/ y src/docs/</span>
        </div>
        <p class="descripcion">Descarga directa de la base de datos geográfica unificada y de las hojas de cálculo oficiales elaboradas para el Atlas de Información Geográfica Voluntaria:</p>
        
        <!-- Tarjeta Maestra: Base de Datos Completa ZIP -->
        <div style="padding:16px; background:rgba(16, 185, 129, 0.08); border:1px solid rgba(16, 185, 129, 0.4); border-radius:4px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
            <div style="flex:1; min-width:280px;">
              <span class="marcador" style="color:var(--esmeralda); font-weight:800; font-size:0.72rem;">PAQUETE CONSOLIDADO OFICIAL</span>
              <h4 style="margin:4px 0 6px 0; font-size:1.05rem; color:#ffffff;">📦 Geodatabase Completa del Atlas VGI (Carpeta Comprimida .zip — 542,35 MB en red / ~3,33 GB descomprimido · 257 archivos)</h4>
              <p style="font-size:0.84rem; color:var(--tinta-suave); margin:0 0 8px 0; line-height:1.45;">
                Acceso total e integrado a los datos del proyecto: 132 capas del visor (10 macrocategorías VGI + 122 capas oficiales del Estado), extractos regionales de Geofabrik RM, capas cartográficas complementarias de <code>src/data/</code> y <code>data/</code>, los 3 libros maestros Excel (<code>docs/categorias_tematicas_osm.xlsx</code>, <code>docs/catalogo_fuentes_vgi.xlsx</code>, <code>docs/perfil_metadatos_vgi.xlsx</code>), datasets consolidados (<code>data/bip_inversiones_santiago.csv</code>, <code>data/resumen_catastro_vgi.csv</code>, <code>docs/wlc_metacalidad_ranking.csv</code>, <code>docs/correlacion_dimensiones_calidad.csv</code>) y metadatos ISO 19115/19139 (<code>docs/matriz_metacalidad.json</code>, <code>docs/wlc_metacalidad_resultado.json</code>, <code>docs/ANALISIS_METACALIDAD.md</code>).
              </p>
            </div>
            <a href="docs/geodatabase_completa_atlas_vgi.zip?v=20261026_v13" download="geodatabase_completa_atlas_vgi.zip" class="accion btn-descarga-coleccion" style="text-decoration:none; padding:10px 18px; font-size:0.86rem;">
              ⬇️ Descargar Base de Datos Completa (.zip)
            </a>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
          <div style="padding:12px; background:var(--papel); border:1px solid var(--linea); border-radius:2px;">
            <strong>1. Catálogo Sistemático de Fuentes VGI:</strong><br>
            <span class="descripcion">Inventario de fuentes colaborativas y oficiales (OSM, ohsome, GBIF, UMap, iNaturalist, IDE Chile) con cobertura, escala, licencia y aplicación en Barrio Brasil / UAH.</span><br>
            <a href="docs/catalogo_fuentes_vgi.xlsx" download="catalogo_fuentes_vgi.xlsx" class="accion secundaria" style="display:inline-block; margin-top:8px; font-size:0.82rem; text-decoration:none; padding:4px 12px;">⬇️ Descargar catalogo_fuentes_vgi.xlsx</a>
          </div>
          <div style="padding:12px; background:var(--papel); border:1px solid var(--linea); border-radius:2px;">
            <strong>2. Perfil de Metadatos VGI (ISO 19115 / IDE Chile):</strong><br>
            <span class="descripcion">Elementos núcleo, jerarquía de atributos, tipos de datos y mapeo al estándar oficial SNIT / IDE Chile e ISO 19139 XML.</span><br>
            <a href="docs/perfil_metadatos_vgi.xlsx" download="perfil_metadatos_vgi.xlsx" class="accion secundaria" style="display:inline-block; margin-top:8px; font-size:0.82rem; text-decoration:none; padding:4px 12px;">⬇️ Descargar perfil_metadatos_vgi.xlsx</a>
          </div>
          <div style="padding:12px; background:var(--papel); border:1px solid var(--linea); border-radius:2px;">
            <strong>3. Taxonomía de Categorías Temáticas OSM y Bibliografía APA (4 Hojas):</strong><br>
            <span class="descripcion">Libro maestro que incluye: Hoja 1 (Categorías Maestras CAT-01 a CAT-10), Hoja 2 (Catálogo de Etiquetas Chile con especificación de atributos y geometrías recomendadas), Hoja 3 (Diccionario de Atributos VGI con cálculo métrico EPSG:32719) y Hoja 4 (Aparato Bibliográfico de 125 fuentes en norma APA 7ª ed.).</span><br>
            <a href="docs/categorias_tematicas_osm.xlsx" download="categorias_tematicas_osm.xlsx" class="accion" style="display:inline-block; margin-top:8px; font-size:0.82rem; text-decoration:none; padding:4px 12px;">📊 Descargar categorias_tematicas_osm.xlsx (Maestro)</a>
          </div>
        </div>
      </div>
    `;

    return bloqueAtlas + bloquesFuentes + bloqueDescargas;
  }

  return { render, FUENTES, LICENCIA_ATLAS };
})();

if (typeof window !== 'undefined') {
  window.ModuloLicencias = ModuloLicencias;
}
