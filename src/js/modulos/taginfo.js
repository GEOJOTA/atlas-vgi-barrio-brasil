/*
  taginfo.js
  ----------
  Módulo de integración con la API oficial de Taginfo (OpenStreetMap Foundation / Jochen Topf).
  Permite validar en tiempo real la frecuencia global, tipología geométrica y estado
  de documentación oficial en el OSM Wiki para cualquier etiqueta del Atlas VGI.

  Endpoint oficial: https://taginfo.openstreetmap.org/api/4/
  CORS habilitado por defecto para consultas de navegador.
*/

const ModuloTaginfo = (() => {

  const BASE_URL = 'https://taginfo.openstreetmap.org/api/4';

  /**
   * Consulta las estadísticas globales de una etiqueta (key=value)
   */
  async function consultarEtiqueta(clave, valor) {
    if (!clave) throw new Error('Se requiere una clave OSM para consultar Taginfo.');
    const v = valor === '*' ? null : valor;

    let url = `${BASE_URL}/tag/stats?key=${encodeURIComponent(clave)}`;
    if (v) {
      url += `&value=${encodeURIComponent(v)}`;
    }

    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 6000) : null;

    try {
      const res = await fetch(url, ctl ? { signal: ctl.signal } : {});
      if (timer) clearTimeout(timer);
      if (!res.ok) {
        throw new Error(`Taginfo respondió con código ${res.status}`);
      }
      const data = await res.json();
      const stats = data.data || [];

      // Mapear desglose de geometrías
      let conteoNodos = 0;
      let conteoVias = 0;
      let conteoRelaciones = 0;
      let conteoTotal = 0;

      stats.forEach(item => {
        if (item.type === 'nodes') conteoNodos = item.count;
        if (item.type === 'ways') conteoVias = item.count;
        if (item.type === 'relations') conteoRelaciones = item.count;
        if (item.type === 'all') conteoTotal = item.count;
      });

      if (conteoTotal === 0 && (conteoNodos + conteoVias + conteoRelaciones > 0)) {
        conteoTotal = conteoNodos + conteoVias + conteoRelaciones;
      }

      return {
        clave,
        valor: v || '*',
        conteoTotal,
        conteoNodos,
        conteoVias,
        conteoRelaciones,
        urlTaginfo: `https://taginfo.openstreetmap.org/tags/${encodeURIComponent(clave)}=${encodeURIComponent(v || '')}`
      };
    } catch (e) {
      if (timer) clearTimeout(timer);
      throw e;
    }
  }

  /**
   * Consulta los valores más frecuentes para una clave determinada
   */
  async function consultarValoresClave(clave) {
    if (!clave) throw new Error('Se requiere una clave OSM para consultar valores.');

    const url = `${BASE_URL}/key/values?key=${encodeURIComponent(clave)}&sortname=count&sortorder=desc&rp=8`;
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 6000) : null;

    try {
      const res = await fetch(url, ctl ? { signal: ctl.signal } : {});
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error(`Taginfo respondió con código ${res.status}`);
      const data = await res.json();
      return (data.data || []).map(item => ({
        valor: item.value,
        conteo: item.count,
        fraccion: (item.fraction * 100).toFixed(2),
        descripcion: item.description || 'Sin descripción'
      }));
    } catch (e) {
      if (timer) clearTimeout(timer);
      throw e;
    }
  }

  /**
   * Renderiza una ficha visual de Taginfo dentro de un contenedor HTML
   */
  async function renderizarEnContenedor(contenedorId, clave, valor) {
    if (typeof document === 'undefined') return;
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    contenedor.innerHTML = `
      <div class="caja-taginfo-cargando" style="font-family:var(--fuente-datos); font-size:0.8rem; color:var(--musgo); padding:10px; border:1px dashed var(--linea);">
        <span class="marcador-parpadeo">[TAGINFO_API // CONECTANDO]</span> Consultando telemetría global para <code>${clave}=${valor}</code>...
      </div>
    `;

    try {
      const datos = await consultarEtiqueta(clave, valor);
      const valoresTop = await consultarValoresClave(clave).catch(() => []);

      contenedor.innerHTML = `
        <div class="tarjeta-taginfo-resultado" style="background:var(--papel-alto); border:1px solid var(--musgo); padding:14px; margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; border-bottom:1px solid var(--linea); padding-bottom:6px;">
            <div>
              <span style="font-family:var(--fuente-datos); font-size:0.72rem; color:var(--musgo); text-transform:uppercase; letter-spacing:0.06em;">[TAGINFO API v4 // TELEMETRÍA GLOBAL OSM]</span>
              <h4 style="margin:2px 0 0 0; font-size:1.05rem; font-family:var(--fuente-datos);">${datos.clave}=${datos.valor}</h4>
            </div>
            <a href="${datos.urlTaginfo}" target="_blank" rel="noopener noreferrer" class="accion secundaria" style="font-size:0.75rem; padding:4px 8px; text-decoration:none;">Ver en Taginfo ↗</a>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:12px;">
            <div style="background:var(--papel); padding:8px; border:1px solid var(--linea); text-align:center;">
              <span style="font-size:0.7rem; font-family:var(--fuente-datos); color:var(--tinta-suave); display:block;">OBJETOS TOTALES</span>
              <strong style="font-size:1.15rem; font-family:var(--fuente-datos); color:var(--tinta);">${Number(datos.conteoTotal).toLocaleString()}</strong>
            </div>
            <div style="background:var(--papel); padding:8px; border:1px solid var(--linea); text-align:center;">
              <span style="font-size:0.7rem; font-family:var(--fuente-datos); color:var(--tinta-suave); display:block;">NODOS (PUNTOS)</span>
              <strong style="font-size:1rem; font-family:var(--fuente-datos); color:var(--musgo);">${Number(datos.conteoNodos).toLocaleString()}</strong>
            </div>
            <div style="background:var(--papel); padding:8px; border:1px solid var(--linea); text-align:center;">
              <span style="font-size:0.7rem; font-family:var(--fuente-datos); color:var(--tinta-suave); display:block;">VÍAS (LÍNEAS/POLS)</span>
              <strong style="font-size:1rem; font-family:var(--fuente-datos); color:var(--agua);">${Number(datos.conteoVias).toLocaleString()}</strong>
            </div>
            <div style="background:var(--papel); padding:8px; border:1px solid var(--linea); text-align:center;">
              <span style="font-size:0.7rem; font-family:var(--fuente-datos); color:var(--tinta-suave); display:block;">RELACIONES</span>
              <strong style="font-size:1rem; font-family:var(--fuente-datos); color:var(--ocre);">${Number(datos.conteoRelaciones).toLocaleString()}</strong>
            </div>
          </div>

          ${valoresTop.length > 0 ? `
            <div style="margin-top:10px; font-size:0.78rem;">
              <span style="font-family:var(--fuente-datos); font-size:0.72rem; color:var(--tinta-suave); text-transform:uppercase;">Valores más frecuentes para la clave [${clave}]:</span>
              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                ${valoresTop.slice(0, 6).map(v => `
                  <span style="background:var(--papel); border:1px solid var(--linea); padding:2px 6px; font-family:var(--fuente-datos); font-size:0.75rem;">
                    <strong>${v.valor}</strong> <span style="color:var(--tinta-suave);">(${v.fraccion}%)</span>
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div style="margin-top:10px; font-size:0.72rem; color:var(--tinta-suave); border-top:1px dashed var(--linea); padding-top:6px; font-family:var(--fuente-datos);">
            Fuente: Taginfo API (Geofabrik / Topf, 2024). Base de datos planetaria OSM en tiempo real.
          </div>
        </div>
      `;
    } catch (err) {
      contenedor.innerHTML = `
        <div style="background:var(--papel-alto); border:1px solid var(--alerta); padding:10px; color:var(--alerta); font-family:var(--fuente-datos); font-size:0.8rem;">
          [ERROR // TAGINFO_API] No se pudo obtener la telemetría para ${clave}=${valor}. (${err.message}).
        </div>
      `;
    }
  }

  return {
    consultarEtiqueta,
    consultarValoresClave,
    renderizarEnContenedor
  };

})();

if (typeof window !== 'undefined') {
  window.ModuloTaginfo = ModuloTaginfo;
}
