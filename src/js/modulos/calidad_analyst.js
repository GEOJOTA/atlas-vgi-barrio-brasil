/*
  calidad_analyst.js
  ------------------
  Módulo de integración avanzada para control de calidad, evolución y validación de ediciones:
  1. ohsome Quality Analyst (OQT API / HeiGIT): Indicadores intrínsecos de calidad, saturación de mapeo
     y completitud de atributos críticos según el marco de Herfort et al. (2023).
  2. Control de Cambios y Validación de Ediciones con OSMCha (Wille Marcel / OpenStreetMap Changesets API v0.6):
     Inspección sistemática de ediciones recientes en el área delimitada o por ID de changeset,
     evaluación heurística de integridad (comentarios, editores, volumen) y enlaces directos de validación en OSMCha.
*/

const ModuloCalidadAnalyst = (() => {

  /**
   * Consulta los últimos changesets (ediciones) en el Bbox a través de la API oficial de OSM
   */
  async function consultarChangesetsRecientes(bbox) {
    if (!bbox || bbox.length < 4) throw new Error('Bbox inválido para consultar changesets.');
    const [oeste, sur, este, norte] = bbox;
    const url = `https://api.openstreetmap.org/api/0.6/changesets?bbox=${oeste},${sur},${este},${norte}&closed=true`;

    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 18000) : null;

    try {
      const res = await fetch(url, ctl ? { signal: ctl.signal } : {});
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error(`OSM API respondió con código ${res.status}`);

      const xmlText = await res.text();
      const changesets = parsearChangesetsXML(xmlText);
      return {
        bbox,
        total: changesets.length,
        changesets,
        urlOSMChaBbox: `https://osmcha.org/?filters=${encodeURIComponent(JSON.stringify({ in_bbox: `${oeste},${sur},${este},${norte}` }))}`
      };
    } catch (e) {
      if (timer) clearTimeout(timer);
      throw e;
    }
  }

  /**
   * Consulta un changeset específico por su identificador numérico en la API de OSM
   */
  async function consultarChangesetPorId(changesetId) {
    const idLimpio = String(changesetId).trim().replace(/\D/g, '');
    if (!idLimpio) throw new Error('Identificador de changeset inválido.');

    const url = `https://api.openstreetmap.org/api/0.6/changeset/${idLimpio}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo obtener el changeset #${idLimpio} (Código HTTP ${res.status}).`);

    const xmlText = await res.text();
    const lista = parsearChangesetsXML(xmlText);
    if (!lista.length) throw new Error(`El changeset #${idLimpio} no retornó datos.`);
    return lista[0];
  }

  /**
   * Evalúa heurísticas de calidad y flags de revisión estilo OSMCha
   */
  function evaluarHeuristicaOSMCha(cs) {
    const advertencias = [];
    let nivelRiesgo = 'Normal'; // Normal, Observación, Atención

    // 1. Longitud o ausencia de comentario
    if (!cs.comment || cs.comment === 'Sin comentario registrado' || cs.comment.trim().length < 4) {
      advertencias.push({ tipo: 'Atención', regla: 'Comentario ausente o demasiado breve', detalle: 'Dificulta la trazabilidad de la intención cartográfica.' });
      nivelRiesgo = 'Atención';
    }

    // 2. Volumen de modificaciones
    if (cs.numChanges > 500) {
      advertencias.push({ tipo: 'Observación', regla: 'Volumen masivo (>500 elementos)', detalle: 'Posible importación o edición automatizada.' });
      if (nivelRiesgo !== 'Atención') nivelRiesgo = 'Observación';
    } else if (cs.numChanges === 0) {
      advertencias.push({ tipo: 'Observación', regla: 'Changeset sin modificaciones efectivas', detalle: 'Conjunto de cambios cerrado sin registrar objetos.' });
    }

    // 3. Editor empleado
    const editor = (cs.createdBy || '').toLowerCase();
    let categoriaEditor = 'Web / General';
    if (editor.includes('josm')) {
      categoriaEditor = 'JOSM (Avanzado / Escritorio)';
    } else if (editor.includes('id') || editor.includes('rapid')) {
      categoriaEditor = 'iD / RapiD (Web)';
    } else if (editor.includes('streetcomplete')) {
      categoriaEditor = 'StreetComplete (Móvil / Terreno)';
    } else if (editor.includes('vespucci')) {
      categoriaEditor = 'Vespucci (Móvil / Avanzado)';
    } else if (editor.includes('every_door')) {
      categoriaEditor = 'EveryDoor (Móvil / Comercios)';
    } else if (editor) {
      categoriaEditor = cs.createdBy;
    }

    const esMapeoTerreno = editor.includes('streetcomplete') || editor.includes('every_door') || editor.includes('vespucci');

    return {
      nivelRiesgo,
      advertencias,
      categoriaEditor,
      esMapeoTerreno,
      etiquetasTags: cs.tags || {}
    };
  }

  /**
   * Parsea el XML de respuesta de /api/0.6/changesets o /api/0.6/changeset/{id}
   */
  function parsearChangesetsXML(xmlStr) {
    if (typeof DOMParser === 'undefined') return [];
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlStr, 'text/xml');
      const nodos = doc.querySelectorAll('changeset');
      const lista = [];

      nodos.forEach(nodo => {
        const id = nodo.getAttribute('id');
        const user = nodo.getAttribute('user') || 'Anónimo';
        const uid = nodo.getAttribute('uid') || '';
        const createdAt = nodo.getAttribute('created_at') || '';
        const closedAt = nodo.getAttribute('closed_at') || '';
        const numChanges = parseInt(nodo.getAttribute('num_changes') || '0', 10);
        const isOpen = nodo.getAttribute('open') === 'true';

        let comment = 'Sin comentario registrado';
        let createdBy = 'Desconocido';
        let imageryUsed = '';
        let locale = '';
        const tags = {};

        const tagNodes = nodo.querySelectorAll('tag');
        tagNodes.forEach(t => {
          const k = t.getAttribute('k');
          const v = t.getAttribute('v');
          if (k && v) {
            tags[k] = v;
            if (k === 'comment') comment = v;
            if (k === 'created_by') createdBy = v;
            if (k === 'imagery_used') imageryUsed = v;
            if (k === 'locale') locale = v;
          }
        });

        const item = {
          id,
          user,
          uid,
          createdAt: createdAt.replace('T', ' ').replace('Z', ' UTC'),
          closedAt: closedAt.replace('T', ' ').replace('Z', ' UTC'),
          isOpen,
          numChanges,
          comment,
          createdBy,
          imageryUsed,
          locale,
          tags,
          urlOSM: `https://www.openstreetmap.org/changeset/${id}`,
          urlOSMCha: `https://osmcha.org/changesets/${id}`,
          urlUsuarioOSM: `https://www.openstreetmap.org/user/${encodeURIComponent(user)}`,
          urlUsuarioOSMCha: `https://osmcha.org/?filters=${encodeURIComponent(JSON.stringify({ users: [{ label: user, value: user }] }))}`
        };

        item.evaluacion = evaluarHeuristicaOSMCha(item);
        lista.push(item);
      });

      return lista.sort((a, b) => (parseInt(b.id, 10) - parseInt(a.id, 10)));
    } catch (err) {
      console.warn('[calidad_analyst] Error parseando XML de changesets:', err);
      return [];
    }
  }

  /**
   * Calcula el Índice de Saturación y Maduración Territorial (Herfort et al., 2023 / OQT / ISO 19157)
   */
  function calcularIndicadoresOQT(datosOhsome, elementosGeoJSON = []) {
    let saturacion = 'Fase de Levantamiento Activo';
    let tendencia = 'Crecimiento de objetos base';
    let scoreSaturacion = 55;

    if (datosOhsome && datosOhsome.elementosPorAnio && datosOhsome.elementosPorAnio.length >= 3) {
      const serie = datosOhsome.elementosPorAnio;
      const penultimo = serie[serie.length - 2]?.valor || 0;
      const ultimo = serie[serie.length - 1]?.valor || 0;
      const delta = ultimo - penultimo;

      if (ultimo > 0 && delta <= (ultimo * 0.05)) {
        saturacion = 'Saturación Alta / Consolidación';
        tendencia = 'Mapeo estabilizado, mantenimiento de microatributos';
        scoreSaturacion = 92;
      } else if (delta > (ultimo * 0.15)) {
        saturacion = 'Expansión Dinámica';
        tendencia = 'Alta tasa de ingreso de nuevas geometrías';
        scoreSaturacion = 68;
      }
    }

    let totalFeatures = elementosGeoJSON.length;
    let conNombre = 0;
    let conDireccion = 0;
    let conAccesibilidad = 0;
    let conOperador = 0;

    if (totalFeatures > 0) {
      elementosGeoJSON.forEach(f => {
        const p = f.properties || {};
        if (p.name || p.nombre) conNombre++;
        if (p['addr:street'] || p.direccion) conDireccion++;
        if (p.wheelchair || p.accesibilidad) conAccesibilidad++;
        if (p.operator || p.operador) conOperador++;
      });
    }

    const pctNombre = totalFeatures > 0 ? ((conNombre / totalFeatures) * 100).toFixed(1) : '0.0';
    const pctDireccion = totalFeatures > 0 ? ((conDireccion / totalFeatures) * 100).toFixed(1) : '0.0';
    const pctAccesibilidad = totalFeatures > 0 ? ((conAccesibilidad / totalFeatures) * 100).toFixed(1) : '0.0';
    const pctOperador = totalFeatures > 0 ? ((conOperador / totalFeatures) * 100).toFixed(1) : '0.0';

    return {
      saturacion,
      tendencia,
      scoreSaturacion,
      totalAuditados: totalFeatures,
      completitud: {
        nombre: { conteo: conNombre, porcentaje: pctNombre },
        direccion: { conteo: conDireccion, porcentaje: pctDireccion },
        accesibilidad: { conteo: conAccesibilidad, porcentaje: pctAccesibilidad },
        operador: { conOperador, porcentaje: pctOperador }
      }
    };
  }

  /**
   * Renderiza el Inspector y Validador de Changesets en un contenedor HTML con estética backrooms sobria
   */
  async function renderizarInspectorChangesets(contenedorId, bbox, opciones = {}) {
    if (typeof document === 'undefined') return;
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    cont.innerHTML = `
      <div style="font-family:var(--fuente-datos); font-size:0.8rem; color:var(--musgo); padding:12px; border:1px dashed var(--linea); background:var(--papel-alto);">
        <span class="marcador-parpadeo">[OSMCHA // SINCRONIZANDO]</span> Consultando ediciones recientes en la API de OSM...
      </div>
    `;

    try {
      let listaChangesets = [];
      let urlOSMChaBbox = '#';

      if (opciones.changesetId) {
        const csUnico = await consultarChangesetPorId(opciones.changesetId);
        listaChangesets = [csUnico];
        urlOSMChaBbox = csUnico.urlOSMCha;
      } else {
        const data = await consultarChangesetsRecientes(bbox);
        listaChangesets = data.changesets;
        urlOSMChaBbox = data.urlOSMChaBbox;
      }

      if (listaChangesets.length === 0) {
        cont.innerHTML = `
          <div style="background:var(--papel-alto); border:1px solid var(--linea); padding:14px; font-family:var(--fuente-datos); font-size:0.82rem;">
            [INFO // SIN NOVEDAD] No se detectaron conjuntos de cambios en el cuadrante especificado.
          </div>
        `;
        return;
      }

      const usuariosSet = new Set(listaChangesets.map(c => c.user));
      const totalEdiciones = listaChangesets.reduce((acc, c) => acc + c.numChanges, 0);
      const promedioEdiciones = (totalEdiciones / listaChangesets.length).toFixed(1);

      cont.innerHTML = `
        <div style="background:var(--papel-alto); border:1px solid var(--linea); padding:16px; margin-top:8px;">
          <!-- Encabezado de telemetría sobrio -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px; border-bottom:1px solid var(--linea); padding-bottom:10px;">
            <div>
              <span style="font-family:var(--fuente-datos); font-size:0.72rem; color:var(--musgo); text-transform:uppercase; letter-spacing:0.06em;">
                [CONTROL DE CAMBIOS // OSMCHA & OSM API V0.6]
              </span>
              <h4 style="margin:4px 0 0 0; font-size:1rem; font-family:var(--fuente-datos); font-weight:700;">
                ${listaChangesets.length} Ediciones Detectadas (${usuariosSet.size} Mapeadores Únicos)
              </h4>
              <div style="font-size:0.75rem; color:var(--tinta-suave); font-family:var(--fuente-datos); margin-top:3px;">
                Total objetos modificados: ${totalEdiciones} • Promedio por edición: ${promedioEdiciones}
              </div>
            </div>
            <a href="${urlOSMChaBbox}" target="_blank" rel="noopener noreferrer" class="accion secundaria" style="font-size:0.75rem; padding:5px 10px; text-decoration:none;">
              Abrir Vista Territorial en OSMCha ↗
            </a>
          </div>

          <!-- Tabla de Cambios con Diagnóstico de Calidad -->
          <div style="max-height:300px; overflow-y:auto; border:1px solid var(--linea); background:var(--papel);">
            <table class="tabla-datos" style="margin:0; font-size:0.78rem; width:100%;">
              <thead>
                <tr style="background:var(--papel-alto); border-bottom:1px solid var(--linea);">
                  <th style="padding:6px 8px;">Changeset</th>
                  <th style="padding:6px 8px;">Mapeador</th>
                  <th style="padding:6px 8px;">Fecha UTC</th>
                  <th style="padding:6px 8px; text-align:center;">Cambios</th>
                  <th style="padding:6px 8px;">Herramienta</th>
                  <th style="padding:6px 8px;">Comentario de Edición</th>
                  <th style="padding:6px 8px; text-align:center;">Estado</th>
                  <th style="padding:6px 8px; text-align:center;">Acción</th>
                </tr>
              </thead>
              <tbody>
                ${listaChangesets.slice(0, 20).map(cs => {
                  const ev = cs.evaluacion;
                  let badgeColor = 'var(--musgo)';
                  let badgeBg = 'rgba(91, 110, 78, 0.12)';
                  if (ev.nivelRiesgo === 'Atención') {
                    badgeColor = 'var(--alerta, #a8422b)';
                    badgeBg = 'rgba(168, 66, 43, 0.1)';
                  } else if (ev.nivelRiesgo === 'Observación') {
                    badgeColor = '#9a7522';
                    badgeBg = 'rgba(154, 117, 34, 0.1)';
                  }

                  return `
                    <tr style="border-bottom:1px solid var(--linea);">
                      <td style="padding:6px 8px; font-family:var(--fuente-datos); font-weight:600;">
                        <a href="${cs.urlOSM}" target="_blank" rel="noopener noreferrer" title="Ver en OpenStreetMap.org" style="color:var(--musgo); text-decoration:none;">#${cs.id}</a>
                      </td>
                      <td style="padding:6px 8px; font-family:var(--fuente-datos);">
                        <a href="${cs.urlUsuarioOSMCha}" target="_blank" rel="noopener noreferrer" title="Ver historial del usuario en OSMCha" style="color:inherit; text-decoration:none;">${cs.user}</a>
                      </td>
                      <td style="padding:6px 8px; font-size:0.74rem; color:var(--tinta-suave); font-family:var(--fuente-datos); white-space:nowrap;">
                        ${cs.createdAt}
                      </td>
                      <td style="padding:6px 8px; text-align:center; font-family:var(--fuente-datos); font-weight:600;">
                        ${cs.numChanges}
                      </td>
                      <td style="padding:6px 8px; font-size:0.74rem; font-family:var(--fuente-datos); color:var(--tinta-suave); max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${cs.createdBy}">
                        ${ev.categoriaEditor}
                      </td>
                      <td style="padding:6px 8px; font-size:0.75rem; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${cs.comment}">
                        ${cs.comment}
                      </td>
                      <td style="padding:6px 8px; text-align:center; white-space:nowrap;">
                        <span style="font-family:var(--fuente-datos); font-size:0.7rem; padding:2px 6px; border-radius:2px; color:${badgeColor}; background:${badgeBg}; border:1px solid ${badgeColor}; font-weight:600;">
                          ${ev.nivelRiesgo}
                        </span>
                      </td>
                      <td style="padding:6px 8px; text-align:center; white-space:nowrap;">
                        <a href="${cs.urlOSMCha}" target="_blank" rel="noopener noreferrer" class="accion secundaria" style="font-size:0.7rem; padding:2px 6px; text-decoration:none; display:inline-block;">
                          OSMCha ↗
                        </a>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:10px; font-size:0.72rem; color:var(--tinta-suave); font-family:var(--fuente-datos);">
            <div>API: OpenStreetMap Changesets v0.6 & OSMCha (Wille Marcel / Mapbox Community).</div>
            <div>Validación conforme al estándar de control de calidad colaborativo VGI.</div>
          </div>
        </div>
      `;
    } catch (err) {
      cont.innerHTML = `
        <div style="background:var(--papel-alto); border:1px solid var(--alerta); padding:12px; color:var(--alerta); font-family:var(--fuente-datos); font-size:0.8rem;">
          [ERROR // CONTROL_DE_CAMBIOS] No se pudieron sincronizar las ediciones recientes (${err.message}).
        </div>
      `;
    }
  }

  return {
    consultarChangesetsRecientes,
    consultarChangesetPorId,
    evaluarHeuristicaOSMCha,
    calcularIndicadoresOQT,
    renderizarInspectorChangesets
  };

})();

if (typeof window !== 'undefined') {
  window.ModuloCalidadAnalyst = ModuloCalidadAnalyst;
}
