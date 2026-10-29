/*
  oauth-token.js  (ESQUELETO — NO FUNCIONAL TODAVÍA)
  ----------------------------------------------------
  Objetivo futuro: recibir el "code" que entrega OSM tras el login OAuth2
  y cambiarlo por un access_token, sin exponer el client_secret en el
  navegador. Esto es lo único que impide que Nodo GeoAbierto pueda subir
  correcciones directamente a OpenStreetMap.

  Pasos que faltan (dejados como lista para quien continúe el proyecto):

  1. Registrar la aplicación en https://www.openstreetmap.org/oauth2/applications
     (redirect URI: la URL del sitio desplegado + "/callback").
  2. Guardar CLIENT_ID y CLIENT_SECRET como variables de entorno en
     Netlify (Site settings → Environment variables), nunca en el código.
  3. Implementar acá el intercambio: recibir { code, code_verifier } desde
     el frontend, hacer POST a
     https://www.openstreetmap.org/oauth2/token con grant_type=authorization_code,
     y devolver el access_token al frontend (idealmente en una cookie
     httpOnly, no en el body, para reducir el riesgo de robo del token).
  4. En el frontend, agregar un módulo osm-escritura.js que use ese token
     para hacer POST/PUT contra la API de edición de OSM
     (api.openstreetmap.org/api/0.6/...), siguiendo el flujo estándar de
     "changeset" de OSM (abrir changeset → subir cambios → cerrar changeset).

  Netlify Functions: 125.000 invocaciones gratis al mes en el plan free,
  más que suficiente para el volumen esperado de un prototipo institucional.
*/

exports.handler = async function (event) {
  return {
    statusCode: 501,
    body: JSON.stringify({
      error: 'No implementado todavía.',
      detalle: 'Ver comentario al inicio de netlify/functions/oauth-token.js para los pasos pendientes.'
    })
  };
};
