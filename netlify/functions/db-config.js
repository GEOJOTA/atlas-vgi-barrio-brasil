/*
  netlify/functions/db-config.js
  ------------------------------
  Función serverless para suministrar dinámicamente la configuración
  pública de base de datos (SUPABASE_URL y SUPABASE_ANON_KEY) al cliente web
  sin necesidad de almacenar credenciales hardcodeadas en el repositorio Git.
*/

exports.handler = async function (event, context) {
  // Manejo de preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_ANON_KEY || '').trim();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    },
    body: JSON.stringify({
      proveedor: 'supabase',
      url: supabaseUrl,
      anon_key: supabaseKey,
      storage_bucket: 'atlas-geojson',
      disponible: Boolean(supabaseUrl && supabaseKey)
    })
  };
};
