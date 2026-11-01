/*
  geodesia.js
  -----------
  Módulo de geodesia y reproyección cartográfica del Atlas VGI.
  Implementa la transformación conforme rigurosa de WGS 84 (EPSG:4326)
  a WGS 84 / UTM Huso 19 Sur (EPSG:32719) conforme a las ecuaciones de Transverse Mercator
  (Snyder, 1987; IGM Chile; IDE Chile).
  
  Permite el cálculo métrico exacto de superficies (m², ha, km²) mediante la fórmula
  de Gauss (Shoelace) sobre un plano euclidiano proyectado, eliminando las distorsiones
  angulares propias de coordenadas geográficas en grados decimales.
*/

const ModuloGeodesia = (() => {
  // Parámetros geodésicos del elipsoide WGS 84 (EPSG:4326 / EPSG:32719)
  const A_WGS84 = 6378137.0; // Semieje mayor en metros
  const F_WGS84 = 1 / 298.257223563; // Achatamiento elipsoidal
  const E2 = 2 * F_WGS84 - F_WGS84 * F_WGS84; // Primera excentricidad al cuadrado (~0.00669438)
  const E_PRIME2 = E2 / (1 - E2); // Segunda excentricidad al cuadrado (~0.00673950)
  const K0 = 0.9996; // Factor de escala en el meridiano central UTM
  const FALSO_ESTE = 500000.0; // Metros
  const FALSO_NORTE = 10000000.0; // Metros (Hemisferio Sur)
  const MERIDIANO_CENTRAL_19S = -69.0; // Longitud del meridiano central para Huso 19 Sur (grados)

  /**
   * Reproyecta coordenadas geográficas WGS84 (grados) a coordenadas planas métricas UTM 19S (EPSG:32719).
   * @param {number} lon - Longitud en grados decimales
   * @param {number} lat - Latitud en grados decimales
   * @returns {[number, number]} [Este, Norte] en metros
   */
  function wgs84aUTM19S(lon, lat) {
    const phi = lat * (Math.PI / 180);
    const lambda = lon * (Math.PI / 180);
    const lambda0 = MERIDIANO_CENTRAL_19S * (Math.PI / 180);
    const deltaLambda = lambda - lambda0;

    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const tanPhi = Math.tan(phi);

    const N = A_WGS84 / Math.sqrt(1 - E2 * sinPhi * sinPhi);
    const T = tanPhi * tanPhi;
    const C = E_PRIME2 * cosPhi * cosPhi;
    const A = cosPhi * deltaLambda;

    // Longitud del arco de meridiano desde el ecuador
    const M = A_WGS84 * (
      (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 * E2 * E2 / 256) * phi
      - (3 * E2 / 8 + 3 * E2 * E2 / 32 + 45 * E2 * E2 * E2 / 1024) * Math.sin(2 * phi)
      + (15 * E2 * E2 / 256 + 45 * E2 * E2 * E2 / 1024) * Math.sin(4 * phi)
      - (35 * E2 * E2 * E2 / 3072) * Math.sin(6 * phi)
    );

    const este = FALSO_ESTE + K0 * N * (
      A
      + (1 - T + C) * Math.pow(A, 3) / 6
      + (5 - 18 * T + T * T + 72 * C - 58 * E_PRIME2) * Math.pow(A, 5) / 120
    );

    const norte = FALSO_NORTE + K0 * (
      M + N * tanPhi * (
        A * A / 2
        + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * E_PRIME2) * Math.pow(A, 6) / 720
      )
    );

    return [este, norte];
  }

  /**
   * Calcula el área métrica plana de un polígono cerrado (anillo de coordenadas [lon, lat])
   * mediante reproyección conforme a EPSG:32719 y la fórmula de Gauss (Shoelace).
   * @param {Array<[number, number]>} coordsLonLat - Array de vértices [[lon, lat], ...]
   * @returns {{areaM2: number, areaHa: number, areaKm2: number, srs: string}}
   */
  function calcularSuperficiePoligono(coordsLonLat) {
    if (!coordsLonLat || coordsLonLat.length < 3) {
      return { areaM2: 0, areaHa: 0, areaKm2: 0, srs: 'EPSG:32719' };
    }

    const coordsUTM = coordsLonLat.map(pt => wgs84aUTM19S(pt[0], pt[1]));
    let suma = 0;
    const n = coordsUTM.length;
    for (let i = 0; i < n - 1; i++) {
      suma += (coordsUTM[i][0] * coordsUTM[i + 1][1]) - (coordsUTM[i + 1][0] * coordsUTM[i][1]);
    }
    const areaM2 = Math.abs(suma) / 2;

    return {
      areaM2: Math.round(areaM2 * 10) / 10,
      areaHa: Number((areaM2 / 10000).toFixed(3)),
      areaKm2: Number((areaM2 / 1000000).toFixed(6)),
      srs: 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)'
    };
  }

  /**
   * Calcula la superficie métrica plana de un Bounding Box [oeste, sur, este, norte]
   * proyectando sus 4 vértices a EPSG:32719 y evaluando el polígono resultante con Gauss.
   * @param {[number, number, number, number]} bbox
   * @returns {{areaM2: number, areaHa: number, areaKm2: number, srs: string, metodo: string}}
   */
  function calcularSuperficieBbox(bbox) {
    const [oeste, sur, este, norte] = bbox;
    const p1 = wgs84aUTM19S(oeste, sur);
    const p2 = wgs84aUTM19S(este, sur);
    const p3 = wgs84aUTM19S(este, norte);
    const p4 = wgs84aUTM19S(oeste, norte);

    const vertices = [p1, p2, p3, p4, p1];
    let suma = 0;
    for (let i = 0; i < 4; i++) {
      suma += (vertices[i][0] * vertices[i + 1][1]) - (vertices[i + 1][0] * vertices[i][1]);
    }
    const areaM2 = Math.abs(suma) / 2;

    return {
      areaM2: Math.round(areaM2),
      areaHa: Number((areaM2 / 10000).toFixed(2)),
      areaKm2: Number((areaM2 / 1000000).toFixed(4)),
      srs: 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)',
      metodo: 'Reproyección conforme Transverse Mercator (EPSG:32719) + Fórmula de Gauss'
    };
  }

  return {
    wgs84aUTM19S,
    calcularSuperficiePoligono,
    calcularSuperficieBbox,
    SRS_DESTINO: 'EPSG:32719',
    SRS_NOMBRE: 'WGS 84 / UTM Huso 19 Sur (Región Metropolitana de Santiago)'
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloGeodesia = ModuloGeodesia;
}
