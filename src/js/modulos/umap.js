/*
  umap.js
  -------
  UMap no tiene una API unificada de búsqueda entre instancias: cada
  municipalidad u organización puede tener la suya, además de la
  instancia pública umap.openstreetmap.fr. Lo único garantizado entre
  instancias es la URL pública de un mapa, así que este módulo trabaja
  a partir de esa URL.

  Estrategia:
  1. Siempre se puede embeber el mapa en un iframe (no depende de CORS).
  2. Se intenta además leer su GeoJSON para mostrar un resumen de datos;
     si la instancia no permite CORS, se informa y se deja el enlace de
     descarga manual. Ver docs/ARQUITECTURA.md sección 6.
*/

const ModuloUMap = (() => {

  /**
   * A partir de una URL como:
   *   https://umap.openstreetmap.fr/es/map/nombre-del-mapa_1234
   * separa instancia + id de mapa.
   */
  function analizarUrl(url) {
    const coincidencia = url.match(/^(https?:\/\/[^/]+)\/[a-z-]+\/map\/[^/]*_(\d+)/i);
    if (!coincidencia) return null;
    return { instancia: coincidencia[1], idMapa: coincidencia[2] };
  }

  function urlEmbebido(url) {
    // UMap acepta un modo "embed" agregando ?embedded o el sufijo /embed
    // según versión; probamos el parámetro, que es el más compatible.
    const separador = url.includes('?') ? '&' : '?';
    return url + separador + 'embed';
  }

  async function intentarDescargarGeojson({ instancia, idMapa }) {
    // Este endpoint no es universal: cambia entre versiones de UMap.
    // Se documenta el intento más común; si falla, se informa el motivo.
    const url = `${instancia}/es/map/${idMapa}/download/`;
    try {
      const respuesta = await fetch(url);
      if (!respuesta.ok) throw new Error('Respuesta ' + respuesta.status);
      return { ok: true, datos: await respuesta.json(), urlIntentada: url };
    } catch (error) {
      return { ok: false, motivo: error.message, urlIntentada: url };
    }
  }

  return { analizarUrl, urlEmbebido, intentarDescargarGeojson };
})();

if (typeof window !== 'undefined') {
  window.ModuloUMap = ModuloUMap;
  window.ModuloUmap = ModuloUMap;
}
