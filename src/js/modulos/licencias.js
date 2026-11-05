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
    const bloqueDescargas = `
      <div class="bloque" style="border-left:4px solid var(--ocre); margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:14px;">
          <div style="flex:1; min-width:280px;">
            <h3 style="margin:0 0 6px 0; color:var(--musgo);">Descarga de la base de datos completa y catálogos</h3>
            <p class="descripcion" style="margin:0;">
              El paquete consolidado incluye las <strong>133 capas del visor</strong> (10 categorías ciudadanas + 123 capas oficiales del Estado), los libros maestros en Excel, las matrices de calidad y los esquemas PostGIS (<strong>257 archivos · 542,35 MB comprimido / ~3,33 GB descomprimido</strong>).
            </p>
          </div>
          <div>
            <a href="docs/geodatabase_completa_atlas_vgi.zip?v=20261026_v13" download="geodatabase_completa_atlas_vgi.zip" class="accion primaria-cta">
              Descargar base de datos completa (.zip · 542 MB)
            </a>
          </div>
        </div>

        <div class="contenedor-tabla-responsiva">
          <table class="tabla-datos" style="margin-top:8px; font-size:0.88rem; width:100%;">
            <thead>
              <tr>
                <th style="min-width:200px;">Archivo / Catálogo</th>
                <th style="min-width:240px;">Contenido principal</th>
                <th style="min-width:140px;">Formato y peso aprox.</th>
                <th style="min-width:130px;">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Taxonomía y diccionario OSM Chile</strong><br><code class="codigo-licencia">docs/categorias_tematicas_osm.xlsx</code></td>
                <td>4 hojas: 10 categorías maestras (CAT-01 a CAT-10), 140 descriptores, esquema de 17 atributos y 125 referencias APA 7ª ed.</td>
                <td>Excel (<code>.xlsx</code>) · ~85 KB</td>
                <td><a href="docs/categorias_tematicas_osm.xlsx" download="categorias_tematicas_osm.xlsx" class="accion secundaria" style="font-size:0.8rem; padding:6px 12px; display:inline-block; text-align:center;">Descargar Excel</a></td>
              </tr>
              <tr>
                <td><strong>Perfil de metadatos y calidad (133 capas)</strong><br><code class="codigo-licencia">docs/perfil_metadatos_vgi.xlsx</code></td>
                <td>Matriz de evaluación multicriterio (WLC v2.0, IGV medio 95,4 %, 90 capas A+ y 43 A) y mapeo a ISO 19115 / IDE Chile.</td>
                <td>Excel (<code>.xlsx</code>) · ~65 KB</td>
                <td><a href="docs/perfil_metadatos_vgi.xlsx" download="perfil_metadatos_vgi.xlsx" class="accion secundaria" style="font-size:0.8rem; padding:6px 12px; display:inline-block; text-align:center;">Descargar Excel</a></td>
              </tr>
              <tr>
                <td><strong>Catálogo sistemático de fuentes</strong><br><code class="codigo-licencia">docs/catalogo_fuentes_vgi.xlsx</code></td>
                <td>Inventario de fuentes colaborativas y ministeriales con escala, cobertura, licencia y aplicación en el Barrio Brasil.</td>
                <td>Excel (<code>.xlsx</code>) · ~45 KB</td>
                <td><a href="docs/catalogo_fuentes_vgi.xlsx" download="catalogo_fuentes_vgi.xlsx" class="accion secundaria" style="font-size:0.8rem; padding:6px 12px; display:inline-block; text-align:center;">Descargar Excel</a></td>
              </tr>
              <tr>
                <td><strong>Ranking consolidado de calidad (CSV)</strong><br><code class="codigo-licencia">docs/wlc_metacalidad_ranking.csv</code></td>
                <td>Tabla plana con las 133 capas, puntajes cuantitativos, cualitativos, índice IGV y clasificación de calidad.</td>
                <td>CSV (<code>.csv</code>) · ~28 KB</td>
                <td><a href="docs/wlc_metacalidad_ranking.csv" download="wlc_metacalidad_ranking.csv" class="accion secundaria" style="font-size:0.8rem; padding:6px 12px; display:inline-block; text-align:center;">Descargar CSV</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    const bloqueAtlas = `
      <div class="bloque" style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
          <div>
            <h3 style="margin:0;">${LICENCIA_ATLAS.titulo}</h3>
            <p class="descripcion" style="margin:4px 0 0 0;">
              Licencias de reciprocidad comunitaria aplicadas a la documentación, las bases de datos y el código fuente (Ley N° 17.336 y Ley N° 20.285).
            </p>
          </div>
          <button type="button" class="accion secundaria" onclick="window.navegarAManual('cap-uso-01')" style="font-size:0.82rem; padding:6px 12px;">
            Ver en el manual →
          </button>
        </div>

        <div class="contenedor-tabla-responsiva">
          <table class="tabla-datos" style="margin-top:8px; font-size:0.88rem; width:100%;">
            <thead>
              <tr>
                <th style="min-width:180px;">Componente del proyecto</th>
                <th style="min-width:200px;">Licencia aplicada</th>
                <th style="min-width:280px;">¿Qué permite y qué exige?</th>
                <th style="min-width:130px;">Texto legal</th>
              </tr>
            </thead>
            <tbody>
              ${LICENCIA_ATLAS.pilares.map(p => `
                <tr>
                  <td><strong style="color:#ffffff;">${p.ambito}</strong></td>
                  <td><code class="codigo-licencia">${p.licencia}</code></td>
                  <td style="line-height:1.5;">${p.implicancia}</td>
                  <td><a href="${p.url}" target="_blank" rel="noopener" class="enlace-externo-licencia">Ver licencia ↗</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const bloquesFuentes = `
      <div class="bloque">
        <h3 style="margin:0 0 6px 0;">Comparativa de licencias por fuente de datos</h3>
        <p class="descripcion" style="margin:0 0 10px 0;">Condiciones de uso, atribución y redistribución de cada organismo o plataforma integrada:</p>
        <div class="contenedor-tabla-responsiva">
          <table class="tabla-datos" style="margin-top:6px; font-size:0.88rem; width:100%;">
            <thead>
              <tr>
                <th style="min-width:180px;">Fuente u organismo</th>
                <th style="min-width:200px;">Licencia</th>
                <th style="min-width:280px;">Condiciones de uso y atribución</th>
                <th style="min-width:130px;">Enlace oficial</th>
              </tr>
            </thead>
            <tbody>
              ${FUENTES.map(f => `
                <tr>
                  <td><strong style="color:#ffffff;">${f.nombre}</strong></td>
                  <td><code class="codigo-licencia">${f.licencia}</code></td>
                  <td style="line-height:1.5;">${f.implicancia}</td>
                  <td><a href="${f.url}" target="_blank" rel="noopener" class="enlace-externo-licencia">Sitio web ↗</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return bloqueDescargas + bloqueAtlas + bloquesFuentes;
  }

  return { render, FUENTES, LICENCIA_ATLAS };
})();

if (typeof window !== 'undefined') {
  window.ModuloLicencias = ModuloLicencias;
}
