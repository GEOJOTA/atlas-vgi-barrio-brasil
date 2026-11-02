/**
 * src/js/modulos/manifold_canvas.js
 * ----------------------------------
 * Motor de Variedades Diferenciales y Superficies de Riemann Dinámicas (True Dynamic Manifolds)
 * Renderiza hipersuperficies paramétricas 3D proyectadas en perspectiva (u, v) -> (X, Y, Z)
 * mediante familias de curvas geodésicas isoparamétricas suaves, cintas de curvatura gaussiana
 * translúcidas y perturbaciones del tensor métrico g_ij en tiempo real (sin grafos ni redes de nodos).
 */

window.ManifoldCanvas = (function () {
  let canvas = null;
  let ctx = null;
  let animId = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let isEnabled = true;

  // Coordenadas suavizadas del tensor de perturbación interactiva (puntero)
  let mouse = { x: -2000, y: -2000, tx: -2000, ty: -2000, active: false };
  // Ondas de curvatura (data bursts) sobre la variedad
  let ripples = [];

  // Definición de 3 variedades diferenciales (hojas de Riemann) superpuestas en el espacio 3D
  const MANIFOLD_SHEETS = [
    {
      name: 'riemann-sheet-cyan',
      yCenterRatio: 0.30,
      tiltX: 0.52,
      tiltZ: -0.14,
      uLines: 13,
      vSteps: 44,
      spreadX: 1.32,
      spreadY: 0.38,
      ampZ: 64,
      freqU: 2.3,
      freqV: 3.1,
      speed: 0.55,
      phaseOffset: 0.0,
      strokeRgb: '6, 182, 212',     // Cyan (#06b6d4)
      secondaryRgb: '56, 189, 248', // Sky (#38bdf8)
      glowHex: '#06b6d4',
      baseAlpha: 0.34,
      ribbonAlpha: 0.045
    },
    {
      name: 'calabi-fold-violet',
      yCenterRatio: 0.58,
      tiltX: 0.46,
      tiltZ: 0.16,
      uLines: 12,
      vSteps: 42,
      spreadX: 1.28,
      spreadY: 0.36,
      ampZ: 58,
      freqU: 2.7,
      freqV: 2.4,
      speed: -0.45,
      phaseOffset: 2.1,
      strokeRgb: '168, 85, 247',    // Violeta (#a855f7)
      secondaryRgb: '59, 130, 246', // Cobalto (#3b82f6)
      glowHex: '#a855f7',
      baseAlpha: 0.28,
      ribbonAlpha: 0.038
    },
    {
      name: 'gauss-surface-emerald',
      yCenterRatio: 0.84,
      tiltX: 0.56,
      tiltZ: -0.09,
      uLines: 11,
      vSteps: 40,
      spreadX: 1.35,
      spreadY: 0.34,
      ampZ: 52,
      freqU: 1.9,
      freqV: 2.8,
      speed: 0.40,
      phaseOffset: 4.2,
      strokeRgb: '16, 185, 129',    // Esmeralda (#10b981)
      secondaryRgb: '245, 158, 11', // Ámbar (#f59e0b)
      glowHex: '#10b981',
      baseAlpha: 0.26,
      ribbonAlpha: 0.035
    }
  ];

  function init(containerId) {
    let container = document.getElementById(containerId || 'manifold-bg-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'manifold-bg-container';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '0';
      container.style.opacity = '0.92';
      document.body.prepend(container);
    } else {
      container.style.opacity = '0.92';
    }

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'manifold-canvas';
      canvas.style.display = 'block';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      container.appendChild(canvas);
    }

    ctx = canvas.getContext('2d');
    resize();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', function (e) {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
      mouse.active = true;
    });
    window.addEventListener('mouseleave', function () {
      mouse.active = false;
    });

    if (!animId) {
      loop();
    }
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }

  /**
   * Evalúa un punto (u, v) en [-1, 1]^2 sobre la variedad diferencial 3D
   * y lo proyecta en el plano de pantalla con deformación de curvatura.
   */
  function evaluateManifoldPoint(sheet, u, v, t) {
    const phase = t * sheet.speed + sheet.phaseOffset;

    // Coordenadas base en el espacio tangente (u, v)
    const spanX = width * sheet.spreadX;
    const spanY = height * sheet.spreadY;

    // Torsión suave de hipersuperficie (pliegue de Riemann-Enneper amortiguado)
    const foldX = Math.sin(u * Math.PI * 0.85 + phase * 0.6) * 28 * (1 - 0.3 * v * v);
    const foldY = Math.cos(v * Math.PI * 0.75 - phase * 0.5) * 18;

    // Elevación diferencial Z(u, v, t) compuesta por modos armónicos acoplados
    const zWave1 = Math.sin(u * sheet.freqU + phase) * Math.cos(v * sheet.freqV - phase * 0.7);
    const zWave2 = Math.sin((u * 1.4 - v * 1.2) * 2.1 + phase * 1.15) * 0.55;
    const zSaddle = (u * u - v * v) * 0.28 * Math.sin(phase * 0.45);
    let z = (zWave1 + zWave2 + zSaddle) * sheet.ampZ;

    // Proyección 3D inclinada sobre el plano (x, y)
    const cosZ = Math.cos(sheet.tiltZ);
    const sinZ = Math.sin(sheet.tiltZ);
    const rawX = v * (spanX * 0.5) + foldX;
    const rawY = u * (spanY * 0.5) + foldY;

    const rotX = rawX * cosZ - rawY * sinZ;
    const rotY = (rawX * sinZ + rawY * cosZ) * sheet.tiltX;

    let sx = width * 0.5 + rotX;
    let sy = height * sheet.yCenterRatio + rotY - z;

    // Perturbación del tensor métrico por el cursor (pozo/domo gaussiano suave)
    if (mouse.x > -1000 && mouse.y > -1000) {
      const dx = sx - mouse.x;
      const dy = sy - mouse.y;
      const distSq = dx * dx + dy * dy;
      const sigmaSq = 240 * 240;
      if (distSq < sigmaSq * 2.5) {
        const gauss = Math.exp(-distSq / sigmaSq);
        const rippleTwist = Math.cos(Math.sqrt(distSq) * 0.035 - t * 3.2);
        const deltaZ = gauss * 44 * rippleTwist;
        sy -= deltaZ;
        sx += (dx / 240) * gauss * 14;
        z += deltaZ;
      }
    }

    // Perturbaciones por ondas de curvatura (triggerDataBurst)
    for (let r = 0; r < ripples.length; r++) {
      const rp = ripples[r];
      const dx = sx - rp.x;
      const dy = sy - rp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const waveDist = Math.abs(dist - rp.radius);
      if (waveDist < 130) {
        const env = (1 - waveDist / 130) * rp.alpha;
        const disp = Math.sin((dist - rp.radius) * 0.08) * 32 * env;
        sy -= disp;
        z += disp;
      }
    }

    return { x: sx, y: sy, z: z, u: u, v: v };
  }

  /**
   * Traza una curva suave mediante splines cuadráticos continuos sobre un arreglo de puntos
   */
  function traceSmoothSpline(pts) {
    if (!pts || pts.length < 2) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) * 0.5;
      const yc = (pts[i].y + pts[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  /**
   * Renderiza una variedad diferencial completa:
   * 1. Cintas de superficie translúcidas entre geodésicas adyacentes
   * 2. Familia de curvas geodésicas transversales (v-isolíneas)
   * 3. Familia de curvas geodésicas longitudinales (u-isolíneas) con modulación de curvatura
   */
  function drawManifoldSheet(sheet, t) {
    const uCount = sheet.uLines;
    const vCount = sheet.vSteps;
    const grid = [];

    for (let i = 0; i < uCount; i++) {
      const u = -1 + (2 * i) / (uCount - 1);
      const row = [];
      for (let j = 0; j < vCount; j++) {
        const v = -1 + (2 * j) / (vCount - 1);
        row.push(evaluateManifoldPoint(sheet, u, v, t));
      }
      grid.push(row);
    }

    // 1. Cintas continuas de hipersuperficie (sombreado diferencial entre u_i y u_{i+1})
    for (let i = 0; i < uCount - 1; i += 2) {
      const rowA = grid[i];
      const rowB = grid[i + 1];
      ctx.beginPath();
      traceSmoothSpline(rowA);
      for (let j = vCount - 1; j >= 0; j--) {
        ctx.lineTo(rowB[j].x, rowB[j].y);
      }
      ctx.closePath();

      const gradRibbon = ctx.createLinearGradient(0, rowA[0].y, width, rowB[vCount - 1].y);
      gradRibbon.addColorStop(0, `rgba(${sheet.strokeRgb}, 0.0)`);
      gradRibbon.addColorStop(0.25, `rgba(${sheet.strokeRgb}, ${sheet.ribbonAlpha})`);
      gradRibbon.addColorStop(0.75, `rgba(${sheet.secondaryRgb}, ${sheet.ribbonAlpha})`);
      gradRibbon.addColorStop(1, `rgba(${sheet.secondaryRgb}, 0.0)`);
      ctx.fillStyle = gradRibbon;
      ctx.fill();
    }

    // 2. Geodésicas transversales (curvas isoparamétricas u -> [-1, 1] para v fijo)
    for (let j = 0; j < vCount; j += 2) {
      const colPts = [];
      for (let i = 0; i < uCount; i++) {
        colPts.push(grid[i][j]);
      }
      const edgeFade = 1 - Math.pow(Math.abs(-1 + (2 * j) / (vCount - 1)), 2.2);
      const alphaV = Math.max(0.03, sheet.baseAlpha * 0.42 * edgeFade);

      ctx.beginPath();
      traceSmoothSpline(colPts);
      ctx.strokeStyle = `rgba(${sheet.secondaryRgb}, ${alphaV.toFixed(3)})`;
      ctx.lineWidth = 0.85;
      ctx.stroke();
    }

    // 3. Geodésicas longitudinales principales (curvas isoparamétricas v -> [-1, 1] para u fijo)
    for (let i = 0; i < uCount; i++) {
      const rowPts = grid[i];
      const uNorm = Math.abs(-1 + (2 * i) / (uCount - 1));
      const isPrincipalGeodesic = (i === Math.floor(uCount / 2)) || (i % 3 === 0);
      const alphaU = sheet.baseAlpha * (1 - 0.45 * uNorm) * (isPrincipalGeodesic ? 1.35 : 0.85);

      const gradLine = ctx.createLinearGradient(0, rowPts[0].y, width, rowPts[vCount - 1].y);
      gradLine.addColorStop(0, `rgba(${sheet.strokeRgb}, 0.02)`);
      gradLine.addColorStop(0.18, `rgba(${sheet.strokeRgb}, ${alphaU.toFixed(3)})`);
      gradLine.addColorStop(0.5, `rgba(${sheet.secondaryRgb}, ${(alphaU * 1.15).toFixed(3)})`);
      gradLine.addColorStop(0.82, `rgba(${sheet.strokeRgb}, ${alphaU.toFixed(3)})`);
      gradLine.addColorStop(1, `rgba(${sheet.strokeRgb}, 0.02)`);

      ctx.beginPath();
      traceSmoothSpline(rowPts);
      ctx.strokeStyle = gradLine;
      ctx.lineWidth = isPrincipalGeodesic ? 1.65 : 1.0;
      if (isPrincipalGeodesic) {
        ctx.shadowColor = sheet.glowHex;
        ctx.shadowBlur = 8;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function loop() {
    if (!isEnabled) return;
    ctx.clearRect(0, 0, width, height);

    // Interpolación armónica de la posición del puntero para deformación continua
    if (mouse.active) {
      if (mouse.x < -1000) {
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      } else {
        mouse.x += (mouse.tx - mouse.x) * 0.08;
        mouse.y += (mouse.ty - mouse.y) * 0.08;
      }
    } else {
      mouse.x += (-2000 - mouse.x) * 0.03;
      mouse.y += (-2000 - mouse.y) * 0.03;
    }

    const t = performance.now() * 0.001;

    // Actualizar ondas de curvatura (ripples)
    ripples = ripples.filter(rp => {
      rp.radius += rp.speed;
      rp.alpha *= 0.965;
      return rp.alpha > 0.02 && rp.radius < Math.max(width, height) * 1.2;
    });

    // Renderizar las 3 variedades diferenciales
    for (let s = 0; s < MANIFOLD_SHEETS.length; s++) {
      drawManifoldSheet(MANIFOLD_SHEETS[s], t);
    }

    animId = requestAnimationFrame(loop);
  }

  /**
   * Inyecta un pulso de curvatura radial sobre las variedades diferenciales
   */
  function triggerDataBurst(x, y) {
    const targetX = x || width * 0.5;
    const targetY = y || height * 0.45;
    ripples.push({
      x: targetX,
      y: targetY,
      radius: 10,
      speed: 7.5,
      alpha: 0.95
    });
    if (ripples.length > 6) {
      ripples.shift();
    }
  }

  return {
    init: init,
    triggerDataBurst: triggerDataBurst,
    isEnabled: true
  };
})();
