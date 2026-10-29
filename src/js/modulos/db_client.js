/*
  src/js/modulos/db_client.js
  ---------------------------
  Cliente de integración con base de datos espacial PostgreSQL + PostGIS (Supabase).
  Provee:
  1. Conexión resiliente a PostgREST y PostGIS RPC (fn_obtener_capa_bbox).
  2. Descarga CDN de alta velocidad desde Supabase Storage Bucket ('atlas-geojson').
  3. Mecanismo de Fallback Transparente: si la base de datos no está configurada o
     no responde, conmuta automáticamente a los archivos GeoJSON locales sin interrumpir al usuario.
  4. Indicador de estado de telemetría de la base de datos para la interfaz.
*/

const ModuloDBClient = (() => {

  // Configuración predeterminada (extensible desde config.js o localStorage)
  let dbConfig = {
    proveedor: 'supabase',
    nombreMotor: 'PostgreSQL 15+ / PostGIS',
    url: '',
    anonKey: '',
    storageBucket: 'atlas-geojson',
    activo: false,
    modo: 'auto' // 'auto' (Supabase -> fallback local), 'supabase' o 'local'
  };

  let estadoConexion = {
    conectado: false,
    ultimoPing: null,
    fuenteActiva: 'Local (Archivos GeoJSON / CDN)'
  };

  /**
   * Carga dinámicamente la configuración de base de datos desde la API serverless /api/db-config
   * evitando exponer credenciales en el código fuente del repositorio.
   */
  async function cargarConfiguracionRemota() {
    if (dbConfig.url && dbConfig.anonKey) return dbConfig;
    try {
      const resp = await fetch('/api/db-config');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.url && data.anon_key) {
          dbConfig.url = data.url.trim().replace(/\/+$/, '');
          dbConfig.anonKey = data.anon_key.trim();
          dbConfig.storageBucket = data.storage_bucket || dbConfig.storageBucket;
          dbConfig.activo = true;
          estadoConexion.fuenteActiva = 'Supabase PostGIS / Cloud Storage';
          console.log('[ModuloDBClient]: Credenciales suministradas dinámicamente vía /api/db-config.');
          probarConexion();
          return dbConfig;
        }
      }
    } catch (e) {
      // Entorno local sin serverless functions
    }
    return dbConfig;
  }

  /**
   * Inicializa la configuración de base de datos desde NODO_CONFIG o almacenamiento local
   */
  function inicializar(configExterna) {
    const configGlobal = (window.NODO_CONFIG && window.NODO_CONFIG.base_datos) || {};
    
    // Leer llaves guardadas en localStorage si existen
    const urlLocal = localStorage.getItem('nodo-vgi:supabase-url');
    const keyLocal = localStorage.getItem('nodo-vgi:supabase-anon-key');

    dbConfig.url = (urlLocal || configExterna?.url || configGlobal.url || '').trim().replace(/\/+$/, '');
    dbConfig.anonKey = (keyLocal || configExterna?.anonKey || configGlobal.anon_key || '').trim();
    dbConfig.storageBucket = configExterna?.storageBucket || configGlobal.storage_bucket || 'atlas-geojson';
    dbConfig.modo = configExterna?.modo || configGlobal.modo || 'auto';

    if (dbConfig.url && dbConfig.anonKey) {
      dbConfig.activo = true;
      estadoConexion.fuenteActiva = 'Supabase PostGIS / Cloud Storage';
    } else {
      dbConfig.activo = false;
      estadoConexion.fuenteActiva = 'Local (Archivos GeoJSON)';
      cargarConfiguracionRemota();
    }

    console.log(`[ModuloDBClient]: Inicializado. Proveedor: ${dbConfig.proveedor}. Activo: ${dbConfig.activo}`);
    return dbConfig;
  }

  /**
   * Verifica la conectividad con Supabase enviando un ping a la tabla de metadatos
   */
  async function probarConexion() {
    if (!dbConfig.url || !dbConfig.anonKey) {
      estadoConexion.conectado = false;
      estadoConexion.fuenteActiva = 'Local (Sin credenciales de BD)';
      return { ok: false, mensaje: 'Credenciales de Supabase no configuradas (Modo local activo).' };
    }

    const endpoint = `${dbConfig.url}/rest/v1/capas_metadata?select=id&limit=1`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': dbConfig.anonKey,
          'Authorization': `Bearer ${dbConfig.anonKey}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        estadoConexion.conectado = true;
        estadoConexion.ultimoPing = new Date();
        estadoConexion.fuenteActiva = 'PostgreSQL + PostGIS (Supabase)';
        return { ok: true, mensaje: 'Conexión exitosa con base de datos PostGIS en la nube.' };
      } else {
        estadoConexion.conectado = false;
        return { ok: false, mensaje: `Respuesta HTTP ${resp.status} al conectar con Supabase.` };
      }
    } catch (err) {
      estadoConexion.conectado = false;
      return { ok: false, mensaje: `Fallo de conexión: ${err.message}` };
    }
  }

  /**
   * Consulta una capa espacial por ID y BBox opcional.
   * Orden de resolución:
   * 1. Supabase PostGIS RPC (recorte espacial óptimo).
   * 2. Supabase Storage CDN (archivo GeoJSON íntegro en la nube).
   * 3. Fallback Local (archivo GeoJSON en data/ o src/data/).
   */
  async function consultarCapa(idCapa, defCapa, bbox) {
    let geojson = null;
    let origenUsado = '';

    if (!dbConfig.url && dbConfig.modo !== 'local') {
      await cargarConfiguracionRemota();
    }

    // =========================================================================
    // INTENTO 1: Consulta a PostGIS vía RPC de Supabase si está activo Y si se pasa BBox explícito
    // =========================================================================
    if (dbConfig.activo && dbConfig.url && dbConfig.modo !== 'local' && Array.isArray(bbox) && bbox.length === 4) {
      try {
        const [minx, miny, maxx, maxy] = bbox;

        const rpcUrl = `${dbConfig.url}/rest/v1/rpc/fn_obtener_capa_bbox`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const respRpc = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': dbConfig.anonKey,
            'Authorization': `Bearer ${dbConfig.anonKey}`
          },
          body: JSON.stringify({
            p_capa_id: idCapa,
            p_minx: minx,
            p_miny: miny,
            p_maxx: maxx,
            p_maxy: maxy
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (respRpc.ok) {
          const data = await respRpc.json();
          if (data && data.features && data.features.length > 0) {
            geojson = data;
            origenUsado = 'Supabase PostGIS (Función Espacial RPC)';
          }
        }
      } catch (eRpc) {
        console.warn(`[ModuloDBClient]: PostGIS RPC no respondió para ${idCapa}. Probando Storage CDN...`);
      }

      // =======================================================================
      // INTENTO 2: Descarga desde Supabase Storage Bucket ('atlas-geojson')
      // =======================================================================
      if (!geojson && defCapa && defCapa.archivoLocal) {
        try {
          const nombreArchivo = defCapa.archivoLocal.split('/').pop();
          const storageUrl = `${dbConfig.url}/storage/v1/object/public/${dbConfig.storageBucket}/${nombreArchivo}`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const respStorage = await fetch(storageUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (respStorage.ok) {
            geojson = await respStorage.json();
            origenUsado = 'Supabase Storage CDN (Archivo Íntegro)';
          }
        } catch (eStorage) {
          console.warn(`[ModuloDBClient]: Storage CDN no disponible para ${idCapa}. Activando Fallback Local...`);
        }
      }
    }

    // =========================================================================
    // INTENTO 3: Fallback Local Transparente (Respaldo en data/ y src/data/)
    // =========================================================================
    if (!geojson && defCapa && defCapa.archivoLocal) {
      const rutas = [
        defCapa.archivoLocal,
        `./${defCapa.archivoLocal}`,
        `../${defCapa.archivoLocal}`,
        `src/${defCapa.archivoLocal}`
      ];

      for (const r of rutas) {
        try {
          const resp = await fetch(r);
          if (resp.ok) {
            geojson = await resp.json();
            origenUsado = 'Repositorio Local Validado (Fallback Transparente)';
            break;
          }
        } catch (_) {}
      }
    }

    if (!geojson) {
      throw new Error(`No fue posible cargar la capa "${defCapa?.nombre || idCapa}" desde la base de datos ni desde el almacenamiento local.`);
    }

    return {
      geojson,
      origenUsado
    };
  }

  /**
   * Guarda las credenciales de Supabase en el navegador
   */
  function guardarCredenciales(url, anonKey) {
    if (url) localStorage.setItem('nodo-vgi:supabase-url', url.trim());
    if (anonKey) localStorage.setItem('nodo-vgi:supabase-anon-key', anonKey.trim());
    return inicializar({ url, anonKey });
  }

  return {
    inicializar,
    cargarConfiguracionRemota,
    probarConexion,
    consultarCapa,
    guardarCredenciales,
    obtenerConfig: () => ({ ...dbConfig }),
    obtenerEstado: () => ({ ...estadoConexion })
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloDBClient = ModuloDBClient;
  // Inicialización automática al cargar el script
  document.addEventListener('DOMContentLoaded', () => {
    ModuloDBClient.inicializar();
  });
}
