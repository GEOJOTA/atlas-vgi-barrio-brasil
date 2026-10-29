/**
 * src/js/modulos/manifold_canvas.js
 * ----------------------------------
 * Motor de Animación Manifold Data Flow & Relational Topological Network
 * Genera una red de análisis topológico relacional de alta definición (Retina HiDPI)
 * con partículas cromáticas multiespectro, líneas de flujo en gradiente policromático,
 * pulsos fotónicos dinámicos y láminas de ondas de Riemann/isopletas interactivas.
 * Totalmente optimizado, responsivo y sin impacto en el rendimiento.
 */

window.ManifoldCanvas = (function () {
  let canvas = null;
  let ctx = null;
  let animId = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let pulses = [];
  let mouse = { x: -1000, y: -1000, radius: 220 };
  let isEnabled = true;

  const NUM_PARTICLES = 85;
  const CONNECT_DIST = 155;

  const PALETA_CROMATICA = [
    { hex: "#00e5ff", r: 0, g: 229, b: 255 },    // Cyan Eléctrico
    { hex: "#38bdf8", r: 56, g: 189, b: 248 },   // Azul Cielo / Sky
    { hex: "#10b981", r: 16, g: 185, b: 129 },   // Esmeralda / Jade
    { hex: "#a855f7", r: 168, g: 85, b: 247 },   // Amatista / Violeta
    { hex: "#3b82f6", r: 59, g: 130, b: 246 },   // Zafiro / Cobalt
    { hex: "#fbbf24", r: 251, g: 191, b: 36 },   // Ámbar Dorado
    { hex: "#f43f5e", r: 244, g: 63, b: 94 }     // Coral Neón
  ];

  function obtenerColorAleatorio() {
    return PALETA_CROMATICA[Math.floor(Math.random() * PALETA_CROMATICA.length)];
  }

  function Particle(x, y) {
    this.x = x || Math.random() * (width || window.innerWidth);
    this.y = y || Math.random() * (height || window.innerHeight);
    this.vx = (Math.random() - 0.5) * 1.1;
    this.vy = (Math.random() - 0.5) * 1.1;
    this.baseRadius = Math.random() * 2.2 + 1.4;
    this.colorObj = obtenerColorAleatorio();
    this.pulse = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.035 + Math.random() * 0.03;
  }

  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;

    this.pulse += this.pulseSpeed;

    // Repulsión / atracción gravitacional suave del mouse
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < mouse.radius && dist > 0) {
      const force = (mouse.radius - dist) / mouse.radius;
      this.x -= (dx / dist) * force * 3.5;
      this.y -= (dy / dist) * force * 3.5;
    }
  };

  Particle.prototype.draw = function () {
    const currentRadius = Math.max(0.8, this.baseRadius + Math.sin(this.pulse) * 0.85);

    // Halo difuso exterior con el color propio
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.colorObj.r}, ${this.colorObj.g}, ${this.colorObj.b}, 0.22)`;
    ctx.fill();

    // Cuerpo de la partícula
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.colorObj.hex;
    ctx.shadowColor = this.colorObj.hex;
    ctx.shadowBlur = 12;
    ctx.fill();

    // Núcleo blanco de alta definición para máxima luminosidad
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.shadowBlur = 0;
  };

  function Pulse(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.progress = 0;
    this.speed = 0.018 + Math.random() * 0.022;
    this.colorObj = p1.colorObj;
  }

  Pulse.prototype.update = function () {
    this.progress += this.speed;
    return this.progress <= 1;
  };

  Pulse.prototype.draw = function () {
    const x = this.p1.x + (this.p2.x - this.p1.x) * this.progress;
    const y = this.p1.y + (this.p2.y - this.p1.y) * this.progress;

    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = this.colorObj.hex;
    ctx.shadowBlur = 14;
    ctx.fill();

    // Estela de datos fotónica
    ctx.beginPath();
    ctx.arc(x, y, 6.0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.colorObj.r}, ${this.colorObj.g}, ${this.colorObj.b}, 0.45)`;
    ctx.fill();

    ctx.shadowBlur = 0;
  };

  function init(containerId) {
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = "manifold-bg-container";
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "100vw";
      container.style.height = "100vh";
      container.style.pointerEvents = "none";
      container.style.zIndex = "0";
      container.style.opacity = "0.92"; // Visible, vibrante y dinámico
      document.body.prepend(container);
    } else {
      container.style.opacity = "0.92";
    }

    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "manifold-canvas";
      canvas.style.display = "block";
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      container.appendChild(canvas);
    }

    ctx = canvas.getContext("2d");
    resize();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    createParticles();
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
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.48;

          // Gradiente cromático dinámico entre los nodos conectados
          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, `rgba(${p1.colorObj.r}, ${p1.colorObj.g}, ${p1.colorObj.b}, ${alpha})`);
          grad.addColorStop(1, `rgba(${p2.colorObj.r}, ${p2.colorObj.g}, ${p2.colorObj.b}, ${alpha})`);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.1;
          ctx.stroke();

          // Generación periódica de pulsos de datos fotónicos
          if (Math.random() < 0.0035) {
            pulses.push(new Pulse(p1, p2));
          }
        }
      }
    }
  }

  function drawTopologicalWaves() {
    const time = Date.now() * 0.0009;
    const step = 35;

    // Configuración de las 4 láminas ondulantes topológicas
    const laminas = [
      {
        yBase: height * 0.20,
        amp1: 24,
        amp2: 14,
        freq1: 0.0035,
        freq2: 0.0018,
        speed: 1.0,
        color: "rgba(0, 229, 255, 0.42)",
        glowColor: "#00e5ff",
        width: 1.8
      },
      {
        yBase: height * 0.45,
        amp1: 30,
        amp2: 18,
        freq1: 0.0028,
        freq2: 0.0042,
        speed: -1.2,
        color: "rgba(168, 85, 247, 0.38)",
        glowColor: "#a855f7",
        width: 1.8
      },
      {
        yBase: height * 0.70,
        amp1: 28,
        amp2: 16,
        freq1: 0.0040,
        freq2: 0.0022,
        speed: 1.1,
        color: "rgba(16, 185, 129, 0.40)",
        glowColor: "#10b981",
        width: 2.0
      },
      {
        yBase: height * 0.88,
        amp1: 32,
        amp2: 20,
        freq1: 0.0030,
        freq2: 0.0015,
        speed: -0.9,
        color: "rgba(251, 191, 36, 0.35)",
        glowColor: "#fbbf24",
        width: 1.8
      }
    ];

    for (let l = 0; l < laminas.length; l++) {
      const lam = laminas[l];
      ctx.beginPath();
      let primerPunto = true;

      for (let x = -20; x <= width + 40; x += step) {
        // Deformación armónica continua
        let dy = Math.sin(x * lam.freq1 + time * lam.speed) * lam.amp1 +
                 Math.cos(x * lam.freq2 - time * lam.speed * 0.8) * lam.amp2;

        // Reacción elástica interactiva a la proximidad del puntero
        const distMouseX = Math.abs(mouse.x - x);
        const distMouseY = Math.abs(mouse.y - (lam.yBase + dy));
        if (distMouseX < 180 && distMouseY < 120) {
          const factor = (1 - distMouseX / 180) * (1 - distMouseY / 120);
          dy += (mouse.y > lam.yBase ? -28 : 28) * factor;
        }

        const y = lam.yBase + dy;
        if (primerPunto) {
          ctx.moveTo(x, y);
          primerPunto = false;
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = lam.color;
      ctx.lineWidth = lam.width;
      ctx.shadowColor = lam.glowColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function loop() {
    if (!isEnabled) return;
    ctx.clearRect(0, 0, width, height);

    drawTopologicalWaves();

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    drawConnections();

    // Actualizar y dibujar pulsos fotónicos en tránsito
    pulses = pulses.filter(p => {
      const alive = p.update();
      if (alive) p.draw();
      return alive;
    });

    animId = requestAnimationFrame(loop);
  }

  function triggerDataBurst(x, y) {
    const targetX = x || width / 2;
    const targetY = y || height / 2;
    for (let i = 0; i < 14; i++) {
      const p = new Particle(targetX, targetY);
      p.vx = (Math.random() - 0.5) * 5.5;
      p.vy = (Math.random() - 0.5) * 5.5;
      particles.push(p);
      if (particles.length > NUM_PARTICLES + 35) {
        particles.shift();
      }
    }
  }

  return {
    init: init,
    triggerDataBurst: triggerDataBurst
  };
})();
