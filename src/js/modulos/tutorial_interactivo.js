/**
 * tutorial_interactivo.js
 * -----------------------
 * Módulo de Tutorial Interactivo Guiado para el Atlas para la Gestión Territorial.
 * Recorre de manera navegable los 3 módulos y utilidades transversales (18 pasos),
 * presentando primero el propósito de cada módulo antes de examinar cada uno de sus
 * componentes internos, con barra de navegación por módulos y selector directo de pasos.
 */

(function (window, document) {
  'use strict';

  const GRUPOS_MODULOS_TUTORIAL = [
    { id: 'general', etiqueta: 'Visión General', pasoInicio: 0 },
    { id: 'mod01', etiqueta: 'Módulo 01 · Análisis', pasoInicio: 2 },
    { id: 'mod02', etiqueta: 'Módulo 02 · Mapa', pasoInicio: 7 },
    { id: 'mod03', etiqueta: 'Módulo 03 · Documentación', pasoInicio: 14 }
  ];

  const PASOS_TUTORIAL = [
    // =========================================================================
    // VISIÓN GENERAL (Pasos 1 y 2)
    // =========================================================================
    {
      id: 'paso-01-identidad',
      selector: '#cabecera-atlas .marca',
      modulo: 'indicadores',
      grupoNav: 'general',
      esPresentacionModulo: false,
      insignia: 'Visión General · Propósito',
      titulo: '¿Para qué sirve el Atlas para la Gestión Territorial?',
      texto: 'Esta plataforma articula información oficial del Estado e Información Geográfica Voluntaria (IGV) para diagnosticar brechas urbanas en la Comuna de Santiago y el Barrio Brasil. Su propósito es que vecinos, equipos municipales e investigadores puedan fundamentar proyectos y decisiones territoriales sin necesidad de instalar programas SIG complejos.'
    },
    {
      id: 'paso-02-barra-modulos',
      selector: '.barra-grupos-tarea',
      modulo: 'indicadores',
      grupoNav: 'general',
      esPresentacionModulo: false,
      insignia: 'Visión General · Flujo de Trabajo',
      titulo: 'Navegación Articulada en 3 Módulos',
      texto: 'Estos tres botones estructuran la secuencia metodológica del sistema: primero comprender los fenómenos territoriales ya modelados (Análisis), luego inspeccionar y cruzar coberturas sobre el territorio (Explorar Mapa) y finalmente consultar el respaldo metodológico, licencias y descargas maestras (Documentación).'
    },

    // =========================================================================
    // MÓDULO 01: ANÁLISIS (Pasos 3 a 7)
    // =========================================================================
    {
      id: 'paso-03-presentacion-mod01',
      selector: '#sec-ind-cabecera',
      modulo: 'indicadores',
      grupoNav: 'mod01',
      esPresentacionModulo: true,
      accionPrevia: 'cerrarAcordeonDimension',
      insignia: 'Módulo 01 · Presentación del Módulo',
      titulo: 'Presentación del Módulo 01: Análisis Territorial',
      texto: 'El Módulo 01 tiene como función transformar datos espaciales brutos en evidencia diagnóstica lista para interpretar. Antes de buscar capas individuales, aquí puedes identificar qué barrios presentan déficit de servicios, dónde existen clústeres de vulnerabilidad y cómo evoluciona la densificación comunal.'
    },
    {
      id: 'paso-04-narrativas-espaciales',
      selector: '#seccion-storyboards',
      modulo: 'indicadores',
      grupoNav: 'mod01',
      esPresentacionModulo: false,
      insignia: 'Módulo 01 · Componente 1',
      titulo: 'Cuatro Ejes de Diagnóstico Geoestadístico',
      texto: 'Este bloque agrupa cuatro investigaciones espaciales que aplican métodos cuantitativos complementarios: estimación de densidad por Kernel (KDE) para equipamiento urbano, autocorrelación espacial local (LISA / I de Moran) para detectar segregación, dinámica intercensal de vivienda y metabolismo ambiental.'
    },
    {
      id: 'paso-05-lectura-relato',
      selector: '.grilla-storyboards-cuadrados .tarjeta-storyboard-cuadrada:first-child',
      modulo: 'indicadores',
      grupoNav: 'mod01',
      esPresentacionModulo: false,
      insignia: 'Módulo 01 · Componente 2',
      titulo: 'Láminas de Evidencia, 83 Cartografías y Utilidad por Actor',
      texto: 'Al hacer clic en cualquiera de las tarjetas ("Leer relato"), se despliega un estudio detallado con carrusel de mapas en alta resolución, métricas comparativas entre zonas comunales y recomendaciones prácticas orientadas a cuatro perfiles: institución pública, organización vecinal, academia y comunidad mapeadora.'
    },
    {
      id: 'paso-06-cinco-dimensiones',
      selector: '#grilla-tarjetas-dimensiones',
      modulo: 'indicadores',
      grupoNav: 'mod01',
      esPresentacionModulo: false,
      accionPrevia: 'cerrarAcordeonDimension',
      insignia: 'Módulo 01 · Componente 3',
      titulo: 'Organización Multidimensional del Catálogo (5 Dimensiones)',
      texto: 'Para evitar la dispersión temática, las 294 capas del Atlas se clasifican en cinco dimensiones estratégicas (Sociodemográfica, Socioeconómica, Socioambiental, Sociosanitaria y Sociourbana). Seleccionar una tarjeta permite enfocar el diagnóstico en un ámbito específico de gestión urbana.'
    },
    {
      id: 'paso-07-acordeon-dimension',
      selector: '#contenedor-acordeon-capas',
      modulo: 'indicadores',
      grupoNav: 'mod01',
      esPresentacionModulo: false,
      accionPrevia: 'abrirAcordeonDimension',
      insignia: 'Módulo 01 · Componente 4',
      titulo: 'Explorador de Coberturas y Salto Directo al Visor',
      texto: 'Al activar una dimensión se despliega este panel interactivo. Sirve para filtrar por palabra clave las coberturas de esa dimensión, revisar su ficha técnica e implicancias territoriales, y enviar cualquier capa directamente al mapa interactivo mediante el botón "Ver en Mapa".'
    },

    // =========================================================================
    // MÓDULO 02: EXPLORAR MAPA (Pasos 8 a 14)
    // =========================================================================
    {
      id: 'paso-08-presentacion-mod02',
      selector: '#sec-inicio-hero',
      modulo: 'inicio',
      grupoNav: 'mod02',
      esPresentacionModulo: true,
      accionPrevia: 'cerrarSimbologia',
      insignia: 'Módulo 02 · Presentación del Módulo',
      titulo: 'Presentación del Módulo 02: Explorar Mapa (Visor SIG)',
      texto: 'El Módulo 02 constituye el laboratorio cartográfico interactivo del Atlas. Su función es permitir el cruce visual en tiempo real entre las 123 capas oficiales del Estado y las 171 capas colaborativas (IGV), facilitando la inspección predial, el control de simbología y la exportación de geodatos.'
    },
    {
      id: 'paso-09-encuadre-bbox',
      selector: '.barra-herramientas-mapa',
      modulo: 'inicio',
      grupoNav: 'mod02',
      esPresentacionModulo: false,
      insignia: 'Módulo 02 · Componente 1',
      titulo: 'Control de Escala Territorial y Delimitación Geodésica',
      texto: 'Desde esta barra de herramientas puedes conmutar el encuadre entre la escala barrial (Barrio Brasil) y la escala comunal (Comuna de Santiago), o usar "Delimitar área" para dibujar un cuadrante a medida sobre el mapa y obtener su superficie exacta en proyección métrica UTM 19S (EPSG:32719).'
    },
    {
      id: 'paso-10-inspector-normativo',
      selector: '#btn-inspector-normativo',
      modulo: 'inicio',
      grupoNav: 'mod02',
      esPresentacionModulo: false,
      insignia: 'Módulo 02 · Componente 2',
      titulo: 'Inspector Normativo del Plan Regulador Comunal (PRC)',
      texto: 'Esta herramienta convierte el visor en un consultor urbanístico: al activarla y pulsar sobre cualquier manzana o predio del mapa, evalúa espacialmente la zonificación del PRC de Santiago y las normas de la OGUC para emitir al instante un reporte de condiciones edificatorias y patrimoniales.'
    },
    {
      id: 'paso-11-exportacion-geodatos',
      selector: '#btn-descargar-bd-mapa',
      modulo: 'inicio',
      grupoNav: 'mod02',
      esPresentacionModulo: false,
      insignia: 'Módulo 02 · Componente 3',
      titulo: 'Exportación de Vista Activa y Geodatabase Completa',
      texto: 'Garantiza que la información sea 100% reutilizable fuera del navegador: "Exportar vista (GeoJSON)" descarga únicamente las entidades que tienes activas en pantalla, mientras que "Descargar base de datos (.zip)" entrega el archivo maestro de 542 MB con las 294 coberturas homologadas.'
    },
    {
      id: 'paso-12-simbologia-dinamica',
      selector: '#panel-simbologia-dinamica',
      modulo: 'inicio',
      grupoNav: 'mod02',
      esPresentacionModulo: false,
      accionPrevia: 'abrirSimbologia',
      insignia: 'Módulo 02 · Componente 4',
      titulo: 'Motor de Simbología Estadística (Natural Breaks / Jenks)',
      texto: 'Aunque cada capa se carga con una representación predefinida según su naturaleza cuantitativa o cualitativa, este panel permite reclasificar en vivo cualquier variable numérica mediante intervalos de Jenks (Natural Breaks), cuantiles o intervalos iguales, así como cambiar la paleta cromática.'
    },
    {
      id: 'paso-13-visor-leaflet',
      selector: '#mapa-atlas',
      modulo: 'inicio',
      grupoNav: 'mod02',
      esPresentacionModulo: false,
      accionPrevia: 'cerrarSimbologia',
      insignia: 'Módulo 02 · Componente 5',
      titulo: 'Lienzo Cartográfico y Conmutador de Mapas Base',
      texto: 'Sobre el visor cuadrado de alta visibilidad puedes inspeccionar geometrías vectoriales y, mediante el selector de la esquina superior derecha, cambiar el fondo cartográfico entre OpenStreetMap (Estándar y Humanitario) y las imágenes satelitales de Bing / Microsoft y Esri.'
    },
    {
      id: 'paso-14-panel-detalles',
      selector: '#sidebar-detalle-bidat',
      modulo: 'inicio',
      grupoNav: 'mod02',
      esPresentacionModulo: false,
      insignia: 'Módulo 02 · Componente 6',
      titulo: 'Panel Inferior de Detalles y Perfil de 17 Atributos',
      texto: 'Ubicado debajo del mapa para aprovechar todo el ancho de lectura, despliega la auditoría individual de cualquier elemento seleccionado en el visor, mostrando su código único (id_ig para fuentes estatales o id_igv para captura colaborativa), institución custodia, licencia y método de obtención.'
    },

    // =========================================================================
    // MÓDULO 03: DOCUMENTACIÓN (Pasos 15 a 18)
    // =========================================================================
    {
      id: 'paso-15-presentacion-mod03',
      selector: '#sec-manual-cabecera',
      modulo: 'manual',
      grupoNav: 'mod03',
      esPresentacionModulo: true,
      accionPrevia: 'irCapitulo01',
      insignia: 'Módulo 03 · Presentación del Módulo',
      titulo: 'Presentación del Módulo 03: Documentación y Descargas',
      texto: 'El Módulo 03 actúa como el respaldo metodológico, normativo y de datos abiertos de la plataforma. Sirve para comprender cómo fueron procesadas las capas, verificar los derechos de uso bajo estándares de ciencia abierta y consultar el inventario maestro del sistema.'
    },
    {
      id: 'paso-16-buscador-manuales',
      selector: '#buscador-general-manual',
      modulo: 'manual',
      grupoNav: 'mod03',
      esPresentacionModulo: false,
      accionPrevia: 'irCapitulo01',
      insignia: 'Módulo 03 · Componente 1',
      titulo: 'Buscador Documental en Tiempo Real y Manuales Descargables',
      texto: 'Este buscador filtra instantáneamente todos los capítulos técnicos para resolver dudas operativas puntuales. En la franja superior contigua se encuentran además los enlaces para descargar el Manual de Uso, el Manual de Actualización Técnica y la Bibliografía APA 7ª edición.'
    },
    {
      id: 'paso-17-indice-licencias-inventario',
      selector: '#cap-uso-04',
      modulo: 'manual',
      grupoNav: 'mod03',
      esPresentacionModulo: false,
      accionPrevia: 'irCapitulo04',
      insignia: 'Módulo 03 · Componente 2',
      titulo: 'Licencias Abiertas, Catálogos Excel e Inventario de 294 Capas',
      texto: 'Navegando por el índice lateral de capítulos se accede al marco jurídico tripartito (CC BY-SA 4.0, ODbL 1.0 y Ley N° 20.285), a la descarga directa de las planillas maestras en formato Excel (.xlsx) y al buscador tabular interactivo de las 294 coberturas integradas.'
    },
    {
      id: 'paso-18-glosario-siglas',
      selector: '#btn-abrir-glosario-rapido',
      modulo: 'indicadores',
      grupoNav: 'general',
      esPresentacionModulo: false,
      insignia: 'Utilidad Transversal · Consulta Rápida',
      titulo: 'Glosario Permanente de Siglas y Conceptos Técnicos',
      texto: 'Disponible en todo momento en el extremo superior derecho, este botón abre una ventana de consulta rápida que explica en lenguaje claro cada sigla utilizada en el Atlas (VGI, IGV, KDE, LISA, PRC, OGUC, RSH, SINIM, IDE), acompañando la lectura sin interrumpir tu sesión de trabajo.'
    }
  ];

  let pasoActual = 0;
  let tutorialActivo = false;
  let elementoSpotlight = null;
  let elementoTooltip = null;
  let temporizadorTransicion = null;

  /**
   * Crea e inyecta los elementos DOM del tutorial si no existen
   */
  function asegurarElementosDOM() {
    if (!elementoSpotlight) {
      elementoSpotlight = document.getElementById('tutorial-interactivo-spotlight');
      if (!elementoSpotlight) {
        elementoSpotlight = document.createElement('div');
        elementoSpotlight.id = 'tutorial-interactivo-spotlight';
        elementoSpotlight.className = 'tutorial-interactivo-spotlight';
        elementoSpotlight.style.display = 'none';
        document.body.appendChild(elementoSpotlight);
      }
    }

    if (!elementoTooltip) {
      elementoTooltip = document.getElementById('tutorial-tooltip-card');
      if (!elementoTooltip) {
        elementoTooltip = document.createElement('div');
        elementoTooltip.id = 'tutorial-tooltip-card';
        elementoTooltip.className = 'tutorial-card-tooltip';
        elementoTooltip.setAttribute('role', 'dialog');
        elementoTooltip.setAttribute('aria-modal', 'true');
        elementoTooltip.setAttribute('aria-label', 'Tutorial interactivo guiado');
        elementoTooltip.style.display = 'none';
        document.body.appendChild(elementoTooltip);
      }
    }
  }

  /**
   * Ejecuta acciones previas de preparación de la interfaz para que el componente
   * reseñado en el paso esté desplegado y visible antes de calcular su recuadro.
   */
  function ejecutarAccionPrevia(accion) {
    if (!accion) return;
    try {
      if (accion === 'abrirAcordeonDimension') {
        const contAcordeon = document.getElementById('contenedor-acordeon-capas');
        if (contAcordeon && contAcordeon.offsetParent === null) {
          if (window.ModuloIndicadoresAnalisis && typeof window.ModuloIndicadoresAnalisis.alternarDimension === 'function') {
            window.ModuloIndicadoresAnalisis.alternarDimension('sociodemografica');
          }
        }
      } else if (accion === 'cerrarAcordeonDimension') {
        if (window.ModuloIndicadoresAnalisis && typeof window.ModuloIndicadoresAnalisis.colapsarAcordeon === 'function') {
          window.ModuloIndicadoresAnalisis.colapsarAcordeon();
        }
      } else if (accion === 'abrirSimbologia') {
        const panelSimb = document.getElementById('panel-simbologia-dinamica');
        const cuerpoSimb = document.getElementById('cuerpo-simbologia-dinamica');
        if (panelSimb && panelSimb.classList.contains('colapsado')) {
          panelSimb.classList.remove('colapsado');
          if (cuerpoSimb) cuerpoSimb.style.display = 'block';
        }
      } else if (accion === 'cerrarSimbologia') {
        const panelSimb = document.getElementById('panel-simbologia-dinamica');
        const cuerpoSimb = document.getElementById('cuerpo-simbologia-dinamica');
        if (panelSimb && !panelSimb.classList.contains('colapsado')) {
          panelSimb.classList.add('colapsado');
          if (cuerpoSimb) cuerpoSimb.style.display = 'none';
        }
      } else if (accion === 'irCapitulo01') {
        if (window.ModuloManual && typeof window.ModuloManual.irACapitulo === 'function') {
          window.ModuloManual.irACapitulo('cap-uso-01');
        }
      } else if (accion === 'irCapitulo04') {
        if (window.ModuloManual && typeof window.ModuloManual.irACapitulo === 'function') {
          window.ModuloManual.irACapitulo('cap-uso-04');
        }
      }
    } catch (e) {
      // Continuar silenciosamente si algún módulo opcional no está cargado
    }
  }

  /**
   * Manejador de teclado para navegación accesible
   */
  function manejarTeclas(e) {
    if (!tutorialActivo) return;
    if (e.key === 'Escape') {
      detener();
    } else if (e.key === 'ArrowRight') {
      siguiente();
    } else if (e.key === 'ArrowLeft') {
      anterior();
    }
  }

  /**
   * Reposiciona el spotlight y la tarjeta tooltip con respecto al elemento destino
   */
  function actualizarPosiciones() {
    if (!tutorialActivo) return;
    const paso = PASOS_TUTORIAL[pasoActual];
    if (!paso || !elementoSpotlight || !elementoTooltip) return;

    const el = document.querySelector(paso.selector);
    if (!el) {
      // Fallback centrado si el selector no está disponible en ese instante
      elementoSpotlight.style.top = '12%';
      elementoSpotlight.style.left = '15%';
      elementoSpotlight.style.width = '70%';
      elementoSpotlight.style.height = '20%';
      elementoSpotlight.style.display = 'block';
      elementoTooltip.style.top = '36%';
      elementoTooltip.style.left = `${Math.max(16, (window.innerWidth - 480) / 2)}px`;
      elementoTooltip.style.display = 'block';
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 8;

    // 1. Posicionar marco de luz / spotlight
    const topSpot = Math.max(4, rect.top - pad);
    const leftSpot = Math.max(4, rect.left - pad);
    const widthSpot = Math.min(window.innerWidth - leftSpot - 4, rect.width + pad * 2);
    const heightSpot = Math.min(window.innerHeight - topSpot - 4, rect.height + pad * 2);

    elementoSpotlight.style.top = `${topSpot}px`;
    elementoSpotlight.style.left = `${leftSpot}px`;
    elementoSpotlight.style.width = `${Math.max(40, widthSpot)}px`;
    elementoSpotlight.style.height = `${Math.max(28, heightSpot)}px`;
    elementoSpotlight.style.display = 'block';

    // 2. Posicionar tarjeta tooltip
    const cardRect = elementoTooltip.getBoundingClientRect();
    const cardWidth = cardRect.width || 480;
    const cardHeight = cardRect.height || 290;

    let cardTop = 0;
    let cardLeft = 0;

    const espacioAbajo = window.innerHeight - (topSpot + heightSpot);
    const espacioArriba = topSpot;

    if (espacioAbajo >= cardHeight + 18) {
      cardTop = topSpot + heightSpot + 14;
    } else if (espacioArriba >= cardHeight + 18) {
      cardTop = topSpot - cardHeight - 14;
    } else {
      cardTop = Math.max(12, window.innerHeight - cardHeight - 18);
    }

    const centroObjetivo = leftSpot + widthSpot / 2;
    cardLeft = centroObjetivo - cardWidth / 2;

    if (cardLeft < 16) cardLeft = 16;
    if (cardLeft + cardWidth > window.innerWidth - 16) {
      cardLeft = Math.max(16, window.innerWidth - cardWidth - 16);
    }

    elementoTooltip.style.top = `${cardTop}px`;
    elementoTooltip.style.left = `${cardLeft}px`;
    elementoTooltip.style.display = 'block';
  }

  /**
   * Renderiza el contenido del paso actual incluyendo barra navegable por módulos y pasos
   */
  function renderizarPaso() {
    const paso = PASOS_TUTORIAL[pasoActual];
    if (!paso || !elementoTooltip) return;

    const totalPasos = PASOS_TUTORIAL.length;
    const numPaso = pasoActual + 1;
    const pctProgreso = Math.round((numPaso / totalPasos) * 100);
    const esUltimo = numPaso === totalPasos;
    const esPrimero = pasoActual === 0;

    const htmlBotonesModulos = GRUPOS_MODULOS_TUTORIAL.map(g => {
      const activo = paso.grupoNav === g.id;
      return `
        <button type="button"
                class="tutorial-tab-modulo ${activo ? 'activo' : ''}"
                onclick="ModuloTutorialInteractivo.irAPaso(${g.pasoInicio})"
                title="Saltar directamente a ${g.etiqueta}">
          ${g.etiqueta}
        </button>
      `;
    }).join('');

    const htmlPillsPasos = PASOS_TUTORIAL.map((p, idx) => {
      const activo = idx === pasoActual;
      const completado = idx < pasoActual;
      const claseExtra = p.esPresentacionModulo ? 'presentacion-modulo' : '';
      return `
        <button type="button"
                class="tutorial-pill-paso ${activo ? 'activo' : ''} ${completado ? 'completado' : ''} ${claseExtra}"
                onclick="ModuloTutorialInteractivo.irAPaso(${idx})"
                title="Paso ${idx + 1}: ${p.titulo}">
          ${idx + 1}
        </button>
      `;
    }).join('');

    elementoTooltip.innerHTML = `
      <div class="tutorial-card-header">
        <span class="tutorial-badge-modulo ${paso.esPresentacionModulo ? 'badge-presentacion' : ''}">${paso.insignia}</span>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="tutorial-contador-pasos">Paso ${numPaso} de ${totalPasos}</span>
          <button type="button" class="tutorial-btn-cerrar" title="Cerrar tutorial (Esc)" onclick="ModuloTutorialInteractivo.detener()" aria-label="Cerrar">✕</button>
        </div>
      </div>

      <div class="tutorial-nav-modulos" role="tablist" aria-label="Navegar por módulo del tutorial">
        ${htmlBotonesModulos}
      </div>

      <div class="tutorial-nav-pasos" role="navigation" aria-label="Ir a un paso específico">
        ${htmlPillsPasos}
      </div>

      <div class="tutorial-card-barra-progreso" role="progressbar" aria-valuenow="${pctProgreso}" aria-valuemin="0" aria-valuemax="100">
        <div class="tutorial-card-barra-relleno" style="width:${pctProgreso}%;"></div>
      </div>

      <h4 class="tutorial-card-titulo">${paso.titulo}</h4>
      <p class="tutorial-card-texto">${paso.texto}</p>

      <div class="tutorial-card-footer">
        <button type="button" class="tutorial-btn-saltar" onclick="ModuloTutorialInteractivo.detener()">Cerrar tutorial</button>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="tutorial-btn-accion secundario" ${esPrimero ? 'disabled' : ''} onclick="ModuloTutorialInteractivo.anterior()" title="Ir al paso anterior (Flecha Izquierda)">
            ◀ Anterior
          </button>
          <button type="button" class="tutorial-btn-accion primario" onclick="ModuloTutorialInteractivo.siguiente()" title="${esUltimo ? 'Finalizar tutorial' : 'Ir al siguiente paso (Flecha Derecha)'}">
            ${esUltimo ? 'Finalizar ✓' : 'Siguiente ▶'}
          </button>
        </div>
      </div>
    `;

    actualizarPosiciones();
  }

  /**
   * Ejecuta la transición hacia el paso indicado
   */
  function irAPaso(indice) {
    if (indice < 0 || indice >= PASOS_TUTORIAL.length) return;
    pasoActual = indice;
    const paso = PASOS_TUTORIAL[pasoActual];

    if (temporizadorTransicion) {
      clearTimeout(temporizadorTransicion);
    }

    // 1. Activar el módulo correspondiente si aplica
    if (paso.modulo && typeof window.activarPanel === 'function') {
      window.activarPanel(paso.modulo);
    }

    // 2. Ejecutar acción previa de preparación del componente (ej. abrir acordeón o capítulo)
    if (paso.accionPrevia) {
      ejecutarAccionPrevia(paso.accionPrevia);
    }

    // 3. Renderizar de inmediato el contenido de la tarjeta para respuesta instantánea
    renderizarPaso();

    // 4. Desplazar suavemente hacia el objetivo y reajustar posiciones del spotlight
    temporizadorTransicion = setTimeout(() => {
      if (!tutorialActivo) return;
      if (paso.accionPrevia) {
        ejecutarAccionPrevia(paso.accionPrevia);
      }
      const el = document.querySelector(paso.selector);
      if (el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } catch (e) {
          el.scrollIntoView(true);
        }
      }
      actualizarPosiciones();
      temporizadorTransicion = setTimeout(() => {
        if (tutorialActivo) actualizarPosiciones();
      }, 220);
    }, 100);
  }

  /**
   * Inicia el tutorial desde el paso 0
   */
  function iniciar() {
    asegurarElementosDOM();
    tutorialActivo = true;
    window.addEventListener('keydown', manejarTeclas);
    window.addEventListener('resize', actualizarPosiciones);
    window.addEventListener('scroll', actualizarPosiciones, { passive: true });
    irAPaso(0);
  }

  /**
   * Avanza al siguiente paso
   */
  function siguiente() {
    if (pasoActual < PASOS_TUTORIAL.length - 1) {
      irAPaso(pasoActual + 1);
    } else {
      detener();
    }
  }

  /**
   * Retrocede al paso anterior
   */
  function anterior() {
    if (pasoActual > 0) {
      irAPaso(pasoActual - 1);
    }
  }

  /**
   * Cierra y limpia el tutorial interactivo
   */
  function detener() {
    tutorialActivo = false;
    window.removeEventListener('keydown', manejarTeclas);
    window.removeEventListener('resize', actualizarPosiciones);
    window.removeEventListener('scroll', actualizarPosiciones);

    if (elementoSpotlight) {
      elementoSpotlight.style.display = 'none';
    }
    if (elementoTooltip) {
      elementoTooltip.style.display = 'none';
    }
  }

  // Exportar al objeto global
  const ModuloTutorialInteractivo = {
    iniciar: iniciar,
    siguiente: siguiente,
    anterior: anterior,
    irAPaso: irAPaso,
    detener: detener,
    obtenerPasos: function () {
      return PASOS_TUTORIAL.slice();
    }
  };

  window.ModuloTutorialInteractivo = ModuloTutorialInteractivo;
  window.iniciarTutorialInteractivo = iniciar;

})(window, document);
