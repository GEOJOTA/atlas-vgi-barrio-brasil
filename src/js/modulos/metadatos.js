/*
  metadatos.js
  ------------
  Generador dual de metadatos espaciales estandarizados:
  1. JSON (ISO 19115-1:2014 elementos núcleo)
  2. XML (ISO 19139 / Perfil Nacional de Metadatos IDE Chile - SNIT)
     Directamente importable en GeoNetwork, GeoNode o catálogos institucionales.
*/

const ModuloMetadatos = (() => {

  const CLAVE_ALMACENAMIENTO = 'nodo-geoabierto:fichas-metadatos';

  function construirFicha(datos) {
    const ahora = new Date().toISOString();
    const uuid = 'urn:uuid:' + (crypto.randomUUID ? crypto.randomUUID() : 'vgi-' + Date.now());

    const oeste = parseFloat(datos.oeste) || -70.6675;
    const sur = parseFloat(datos.sur) || -33.4505;
    const este = parseFloat(datos.este) || -70.6565;
    const norte = parseFloat(datos.norte) || -33.4385;

    let sup = null;
    if (typeof ModuloMapa !== 'undefined' && ModuloMapa.calcularSuperficieBbox) {
      sup = ModuloMapa.calcularSuperficieBbox([oeste, sur, este, norte]);
    }

    return {
      estandar: 'ISO 19115-1:2014 / Perfil IDE Chile (SNIT)',
      uuid: uuid,
      fechaCreacion: ahora,
      identificacion: {
        titulo: datos.titulo || 'Catastro VGI Barrio Brasil — Universidad Alberto Hurtado',
        resumen: datos.resumen || 'Capa de datos espaciales voluntarios compilada para la gestión territorial.',
        proposito: datos.proposito || 'Evaluación, catalogación y gestión territorial con Información Geográfica Voluntaria (VGI).',
        categoriaTema: datos.categoriaTema || 'planningCadastre'
      },
      extensionGeografica: {
        oeste: oeste,
        sur: sur,
        este: este,
        norte: norte,
        superficie_m2: sup ? sup.areaM2 : (datos.superficie_m2 || null),
        superficie_ha: sup ? sup.areaHa : (datos.superficie_ha || null),
        superficie_km2: sup ? sup.areaKm2 : (datos.superficie_km2 || null),
        srs_superficie: sup ? sup.srs : 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)',
        descripcionTerritorio: datos.descripcionTerritorio || 'Barrio Brasil y Campus Universidad Alberto Hurtado, Santiago Centro, Chile'
      },
      sistemaReferencia: {
        codigo: datos.srs || 'EPSG:4326 (WGS84)',
        oficialNacional: 'EPSG:5361 (SIRGAS-Chile / UTM huso 19 Sur)',
        calculoMetricoSuperficie: 'EPSG:32719 (WGS 84 / UTM Huso 19 Sur)'
      },
      linaje: {
        declaracion: datos.linaje || 'Datos extraídos en vivo desde OpenStreetMap y GBIF vía Overpass QL.',
        fechaConsulta: ahora.slice(0, 10),
        procesamiento: 'Normalización de atributos según taxonomía VGI de 10 categorías (CAT-01 a CAT-10) y cálculo de superficies métricas en m² (EPSG:32719).'
      },
      restriccionesDeUso: {
        licencia: datos.restricciones || 'Open Database License (ODbL) 1.0 para datos OSM; CC-BY para registros biológicos.',
        acceso: 'Acceso público y libre reutilización con atribución a las fuentes comunitarias.'
      },
      puntoDeContacto: {
        organizacion: datos.contactoOrganizacion || 'Atlas de Información Geográfica Voluntaria — Nodo GeoAbierto',
        persona: datos.contactoPersona || 'GEOJOTA',
        correo: datos.contactoCorreo || 'juanpablolescanovillegas@gmail.com',
        rol: datos.rol || 'custodian'
      },
      mantenimiento: {
        frecuencia: datos.frecuencia || 'asNeeded'
      }
    };
  }

  /**
   * Genera documento XML conforme a ISO 19139 / perfil IDE Chile
   */
  function generarXMLISO19139(ficha) {
    const i = ficha.identificacion;
    const ext = ficha.extensionGeografica;
    const cont = ficha.puntoDeContacto;

    return `<?xml version="1.0" encoding="UTF-8"?>
<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd"
                 xmlns:gco="http://www.isotc211.org/2005/gco"
                 xmlns:gml="http://www.opengis.net/gml"
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xsi:schemaLocation="http://www.isotc211.org/2005/gmd http://schemas.opengis.net/iso/19139/20060504/gmd/gmd.xsd">
  <gmd:fileIdentifier>
    <gco:CharacterString>${ficha.uuid}</gco:CharacterString>
  </gmd:fileIdentifier>
  <gmd:language>
    <gmd:LanguageCode codeList="http://www.loc.gov/standards/iso639-2/" codeListValue="spa">Español</gmd:LanguageCode>
  </gmd:language>
  <gmd:characterSet>
    <gmd:MD_CharacterSetCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#MD_CharacterSetCode" codeListValue="utf8">UTF-8</gmd:MD_CharacterSetCode>
  </gmd:characterSet>
  <gmd:hierarchyLevel>
    <gmd:MD_ScopeCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#MD_ScopeCode" codeListValue="dataset">dataset</gmd:MD_ScopeCode>
  </gmd:hierarchyLevel>
  <gmd:contact>
    <gmd:CI_ResponsibleParty>
      <gmd:individualName><gco:CharacterString>${cont.persona}</gco:CharacterString></gmd:individualName>
      <gmd:organisationName><gco:CharacterString>${cont.organizacion}</gco:CharacterString></gmd:organisationName>
      <gmd:contactInfo>
        <gmd:CI_Contact>
          <gmd:address>
            <gmd:CI_Address>
              <gmd:electronicMailAddress><gco:CharacterString>${cont.correo}</gco:CharacterString></gmd:electronicMailAddress>
            </gmd:CI_Address>
          </gmd:address>
        </gmd:CI_Contact>
      </gmd:contactInfo>
      <gmd:role>
        <gmd:CI_RoleCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#CI_RoleCode" codeListValue="${cont.rol}">${cont.rol}</gmd:CI_RoleCode>
      </gmd:role>
    </gmd:CI_ResponsibleParty>
  </gmd:contact>
  <gmd:dateStamp>
    <gco:Date>${ficha.fechaCreacion.slice(0, 10)}</gco:Date>
  </gmd:dateStamp>
  <gmd:metadataStandardName>
    <gco:CharacterString>Perfil Nacional de Metadatos IDE Chile (ISO 19115:2003 / Cor 1:2006)</gco:CharacterString>
  </gmd:metadataStandardName>
  <gmd:metadataStandardVersion>
    <gco:CharacterString>2.0</gco:CharacterString>
  </gmd:metadataStandardVersion>
  <gmd:referenceSystemInfo>
    <gmd:MD_ReferenceSystem>
      <gmd:referenceSystemIdentifier>
        <gmd:RS_Identifier>
          <gmd:code><gco:CharacterString>${ficha.sistemaReferencia.codigo}</gco:CharacterString></gmd:code>
        </gmd:RS_Identifier>
      </gmd:referenceSystemIdentifier>
    </gmd:MD_ReferenceSystem>
  </gmd:referenceSystemInfo>
  <gmd:identificationInfo>
    <gmd:MD_DataIdentification>
      <gmd:citation>
        <gmd:CI_Citation>
          <gmd:title><gco:CharacterString>${escapeXML(i.titulo)}</gco:CharacterString></gmd:title>
          <gmd:date>
            <gmd:CI_Date>
              <gmd:date><gco:Date>${ficha.fechaCreacion.slice(0, 10)}</gco:Date></gmd:date>
              <gmd:dateType>
                <gmd:CI_DateTypeCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#CI_DateTypeCode" codeListValue="creation">creation</gmd:CI_DateTypeCode>
              </gmd:dateType>
            </gmd:CI_Date>
          </gmd:date>
        </gmd:CI_Citation>
      </gmd:citation>
      <gmd:abstract><gco:CharacterString>${escapeXML(i.resumen)}</gco:CharacterString></gmd:abstract>
      <gmd:purpose><gco:CharacterString>${escapeXML(i.proposito)}</gco:CharacterString></gmd:purpose>
      <gmd:resourceConstraints>
        <gmd:MD_LegalConstraints>
          <gmd:useLimitation><gco:CharacterString>${escapeXML(ficha.restriccionesDeUso.licencia)}</gco:CharacterString></gmd:useLimitation>
        </gmd:MD_LegalConstraints>
      </gmd:resourceConstraints>
      <gmd:resourceMaintenance>
        <gmd:MD_MaintenanceInformation>
          <gmd:maintenanceAndUpdateFrequency>
            <gmd:MD_MaintenanceFrequencyCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#MD_MaintenanceFrequencyCode" codeListValue="${ficha.mantenimiento ? ficha.mantenimiento.frecuencia : 'asNeeded'}">${ficha.mantenimiento ? ficha.mantenimiento.frecuencia : 'asNeeded'}</gmd:MD_MaintenanceFrequencyCode>
          </gmd:maintenanceAndUpdateFrequency>
        </gmd:MD_MaintenanceInformation>
      </gmd:resourceMaintenance>
      <gmd:topicCategory>
        <gmd:MD_TopicCategoryCode>${i.categoriaTema}</gmd:MD_TopicCategoryCode>
      </gmd:topicCategory>
      <gmd:extent>
        <gmd:EX_Extent>
          <gmd:description><gco:CharacterString>${escapeXML(ext.descripcionTerritorio)}${ext.superficie_m2 ? ` [Superficie métrica: ${ext.superficie_m2.toLocaleString('es-CL')} m² / ${ext.superficie_ha} ha reprojectada a ${ext.srs_superficie}]` : ''}</gco:CharacterString></gmd:description>
          <gmd:geographicElement>
            <gmd:EX_GeographicBoundingBox>
              <gmd:westBoundLongitude><gco:Decimal>${ext.oeste}</gco:Decimal></gmd:westBoundLongitude>
              <gmd:eastBoundLongitude><gco:Decimal>${ext.este}</gco:Decimal></gmd:eastBoundLongitude>
              <gmd:southBoundLatitude><gco:Decimal>${ext.sur}</gco:Decimal></gmd:southBoundLatitude>
              <gmd:northBoundLatitude><gco:Decimal>${ext.norte}</gco:Decimal></gmd:northBoundLatitude>
            </gmd:EX_GeographicBoundingBox>
          </gmd:geographicElement>
        </gmd:EX_Extent>
      </gmd:extent>
    </gmd:MD_DataIdentification>
  </gmd:identificationInfo>
  <gmd:dataQualityInfo>
    <gmd:DQ_DataQuality>
      <gmd:scope>
        <gmd:DQ_Scope>
          <gmd:level><gmd:MD_ScopeCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/gmxCodelists.xml#MD_ScopeCode" codeListValue="dataset">dataset</gmd:MD_ScopeCode></gmd:level>
        </gmd:DQ_Scope>
      </gmd:scope>
      <gmd:lineage>
        <gmd:LI_Lineage>
          <gmd:statement><gco:CharacterString>${escapeXML(ficha.linaje.declaracion)} | Fecha: ${ficha.linaje.fechaConsulta}</gco:CharacterString></gmd:statement>
        </gmd:LI_Lineage>
      </gmd:lineage>
    </gmd:DQ_DataQuality>
  </gmd:dataQualityInfo>
</gmd:MD_Metadata>`;
  }

  function escapeXML(cadena) {
    if (!cadena) return '';
    return String(cadena)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function guardarFichaLocal(ficha) {
    const fichas = JSON.parse(localStorage.getItem(CLAVE_ALMACENAMIENTO) || '[]');
    fichas.push(ficha);
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(fichas));
  }

  function exportarComoArchivoJSON(ficha) {
    const blob = new Blob([JSON.stringify(ficha, null, 2)], { type: 'application/json' });
    descargarBlob(blob, `metadatos-iso19115-${slugify(ficha.identificacion.titulo)}.json`);
  }

  function exportarComoArchivoXML(ficha) {
    const xml = generarXMLISO19139(ficha);
    const blob = new Blob([xml], { type: 'application/xml; charset=utf-8' });
    descargarBlob(blob, `metadatos-iso19139-idechile-${slugify(ficha.identificacion.titulo)}.xml`);
  }

  function descargarBlob(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  function slugify(texto) {
    return (texto || 'ficha')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 45);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ENRIQUECEDOR UNIVERSAL DE METADATOS PARA DESCARGAS DEL ATLAS
  // Conforme a ISO 19115-1:2014, ISO 19157:2023 y Perfil IDE Chile SNIT v2.0
  // ═══════════════════════════════════════════════════════════════════════

  let _matrizMetacalidadCache = null;

  async function obtenerCatalogoMetadatosGlobal() {
    if (_matrizMetacalidadCache) return _matrizMetacalidadCache;
    try {
      let resp = await fetch('docs/matriz_metacalidad.json').catch(() => null);
      if (!resp || !resp.ok) {
        resp = await fetch('src/docs/matriz_metacalidad.json').catch(() => null) ||
               await fetch('https://atlasvgiuah.netlify.app/docs/matriz_metacalidad.json').catch(() => null);
      }
      if (resp.ok) {
        const datos = await resp.json();
        if (datos && datos.capas) {
          _matrizMetacalidadCache = {};
          datos.capas.forEach(c => {
            _matrizMetacalidadCache[c.id] = c;
          });
          return _matrizMetacalidadCache;
        }
      }
    } catch (_) {}
    return _matrizMetacalidadCache || {};
  }

  function resolverMetadatosCapa(idCapa, fallbackInfo = {}) {
    const catalogo = _matrizMetacalidadCache || {};
    const cat = catalogo[idCapa] || {};

    let defOficial = null;
    if (typeof ModuloIDEChile !== 'undefined' && ModuloIDEChile.obtenerDefinicionCapa) {
      defOficial = ModuloIDEChile.obtenerDefinicionCapa(idCapa);
    }

    const id = idCapa || fallbackInfo.id || 'vgi_territorial';
    const idLower = id.toLowerCase();
    const esSII = idLower.includes('sii') || idLower.includes('predial');
    const esOficial = Boolean(
      esSII ||
      defOficial !== null ||
      idLower.startsWith('bbdd_') ||
      idLower.startsWith('ide_') ||
      idLower.startsWith('oficial_') ||
      idLower.includes('censo') ||
      idLower.includes('rsh') ||
      idLower.includes('bip') ||
      idLower.includes('igvust') ||
      idLower.includes('semaforos') ||
      idLower.includes('subdere') ||
      idLower.includes('munistgo')
    );

    const titulo = cat.nombre || (defOficial ? defOficial.nombre : null) || (esSII ? 'Catastro Predial del Servicio de Impuestos Internos (Segundo Semestre 2025)' : null) || fallbackInfo.nombre || fallbackInfo.titulo || 'Capa Territorial Atlas VGI';
    const institucion = cat.institucion || (defOficial ? defOficial.institucion : null) || (esSII ? 'Servicio de Impuestos Internos (SII)' : null) || fallbackInfo.institucion || 'Comunidad OpenStreetMap / IDE Chile';
    const ministerio = cat.ministerio || (defOficial ? defOficial.ministerio : null) || (esSII ? 'Ministerio de Hacienda' : null) || fallbackInfo.ministerio || 'Sector Público / Sociedad Civil';
    const grupo = cat.grupo || (defOficial ? defOficial.grupo : null) || (esSII ? 'normativa_ipt' : null) || fallbackInfo.grupo || 'general';
    const tipoFuente = cat.tipo_fuente || fallbackInfo.tipo_fuente || (esOficial ? 'Oficial (Estado de Chile)' : 'VGI (Comunitaria / Abierta)');
    const temporalidad = cat.temporalidad || (defOficial ? defOficial.temporalidad : null) || (esSII ? 'Segundo Semestre 2025' : null) || fallbackInfo.temporalidad || '2026';
    const licencia = cat.licencia || (defOficial ? defOficial.declaracion : null) || (esSII ? 'Información pública oficial — Ley N° 20.285 de Transparencia (Servicio de Impuestos Internos)' : null) || fallbackInfo.licencia || 'Open Database License (ODbL) 1.0 / Ley N° 20.285';
    const citaApa = cat.cita_apa || (defOficial ? defOficial.citaAPA : null) || (esSII ? 'Servicio de Impuestos Internos [SII]. (2025). Catastro de Bienes Raíces (Segundo Semestre 2025). Ministerio de Hacienda, Gobierno de Chile. https://www.sii.cl' : null) || fallbackInfo.cita_apa || fallbackInfo.citaAPA || `Atlas VGI UAH. (2026). ${titulo}. Universidad Alberto Hurtado.`;
    const crs = 'EPSG:4326 (WGS 84)';
    const igv = typeof cat.igv === 'number' ? cat.igv : (fallbackInfo.igv ? Number(fallbackInfo.igv) : 98.5);
    const grado = cat.grado || fallbackInfo.grado || (igv >= 95.0 ? 'A+ (Excelente)' : 'A (Muy Bueno)');
    const contacto = 'nodo-geoabierto@uahurtado.cl / contacto@ide.cl';
    const urlServicio = cat.url_servicio || (defOficial ? defOficial.urlServicio : null) || fallbackInfo.urlServicio || 'https://atlasvgiuah.netlify.app/';

    return {
      id,
      titulo,
      institucion,
      ministerio,
      grupo,
      tipo_fuente: tipoFuente,
      temporalidad,
      licencia,
      cita_apa: citaApa,
      crs,
      igv,
      grado_calidad: grado,
      contacto,
      url_servicio: urlServicio
    };
  }

  /**
   * Inyecta las columnas canónicas del Perfil de Metadatos del Catálogo
   * en cada entidad (feature.properties) y en el encabezado metadata del FeatureCollection.
   */
  function enriquecerGeoJSON(geojson, opciones = {}) {
    if (!geojson) return geojson;

    const idCapa = opciones.id || (geojson.name ? String(geojson.name) : 'capa_territorial');
    const meta = resolverMetadatosCapa(idCapa, opciones);

    const clon = JSON.parse(JSON.stringify(geojson));

    if (clon.type === 'FeatureCollection' && Array.isArray(clon.features)) {
      clon.name = `atlas_vgi_${slugify(meta.titulo)}`;
      clon.crs = {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
      };
      clon.metadata = {
        estandar: 'ISO 19115-1:2014 / ISO 19157:2023 / Perfil IDE Chile SNIT v2.0',
        fileIdentifier: `urn:uuid:vgi-cl-${meta.id}-${Date.now()}`,
        title: meta.titulo,
        organisationName: meta.institucion,
        ministerio: meta.ministerio,
        legalConstraints: meta.licencia,
        citation: meta.cita_apa,
        referenceSystemIdentifier: meta.crs,
        temporalExtent: meta.temporalidad,
        quality_igv_score: meta.igv,
        quality_grade: meta.grado_calidad,
        contactEmail: meta.contacto,
        serviceUrl: meta.url_servicio,
        totalEntities: clon.features.length,
        exportDate: new Date().toISOString()
      };

      clon.features.forEach(f => {
        if (!f) return;
        f.properties = f.properties || {};
        f.properties.meta_capa_id = meta.id;
        f.properties.meta_titulo = meta.titulo;
        f.properties.meta_institucion = meta.institucion;
        f.properties.meta_ministerio = meta.ministerio;
        f.properties.meta_grupo = meta.grupo;
        f.properties.meta_tipo_fuente = meta.tipo_fuente;
        f.properties.meta_temporalidad = meta.temporalidad;
        f.properties.meta_licencia = meta.licencia;
        f.properties.meta_cita_apa = meta.cita_apa;
        f.properties.meta_crs = meta.crs;
        f.properties.meta_igv = meta.igv;
        f.properties.meta_grado_calidad = meta.grado_calidad;
        f.properties.meta_contacto = meta.contacto;
        f.properties.meta_url_servicio = meta.url_servicio;
      });
    } else if (clon.type === 'Feature') {
      clon.properties = clon.properties || {};
      clon.properties.meta_capa_id = meta.id;
      clon.properties.meta_titulo = meta.titulo;
      clon.properties.meta_institucion = meta.institucion;
      clon.properties.meta_ministerio = meta.ministerio;
      clon.properties.meta_grupo = meta.grupo;
      clon.properties.meta_tipo_fuente = meta.tipo_fuente;
      clon.properties.meta_temporalidad = meta.temporalidad;
      clon.properties.meta_licencia = meta.licencia;
      clon.properties.meta_cita_apa = meta.cita_apa;
      clon.properties.meta_crs = meta.crs;
      clon.properties.meta_igv = meta.igv;
      clon.properties.meta_grado_calidad = meta.grado_calidad;
      clon.properties.meta_contacto = meta.contacto;
      clon.properties.meta_url_servicio = meta.url_servicio;
    }

    return clon;
  }

  /**
   * Enriquece y gatilla la descarga de un GeoJSON estructurado
   */
  function descargarGeoJSONEnriquecido(geojson, opciones = {}, nombreArchivo = null) {
    const geojsonEnriquecido = enriquecerGeoJSON(geojson, opciones);
    const nom = nombreArchivo || `atlas_vgi_${slugify(opciones.titulo || opciones.nombre || opciones.id || 'datos')}.geojson`;
    const blob = new Blob([JSON.stringify(geojsonEnriquecido, null, 2)], {
      type: 'application/geo+json; charset=utf-8'
    });
    descargarBlob(blob, nom);
  }

  /**
   * Helper para descargar cualquier capa por ID resolviendo su origen y metadatos
   */
  async function descargarCapaEnriquecidaPorId(idCapa, urlFallback = null, nombreArchivo = null) {
    await obtenerCatalogoMetadatosGlobal();

    // 1. Si la capa está cargada en memoria en ModuloMapa
    if (typeof ModuloMapa !== 'undefined' && ModuloMapa.obtenerGeoJSONCapa) {
      const gjMem = ModuloMapa.obtenerGeoJSONCapa(idCapa);
      if (gjMem && gjMem.features && gjMem.features.length > 0) {
        descargarGeoJSONEnriquecido(gjMem, { id: idCapa }, nombreArchivo);
        return true;
      }
    }

    // 2. Fetch del archivo estático
    let url = urlFallback;
    if (!url) {
      if (typeof ModuloIDEChile !== 'undefined' && ModuloIDEChile.obtenerDefinicionCapa) {
        const def = ModuloIDEChile.obtenerDefinicionCapa(idCapa);
        if (def && def.archivoLocal) url = def.archivoLocal;
      }
      if (!url) url = `data/capa_${idCapa}.geojson`;
    }

    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Error HTTP ${resp.status} al solicitar ${url}`);
    }
    const rawGj = await resp.json();
    descargarGeoJSONEnriquecido(rawGj, { id: idCapa }, nombreArchivo || `capa_${idCapa}_con_metadatos.geojson`);
    return true;
  }

  return {
    construirFicha,
    generarXMLISO19139,
    guardarFichaLocal,
    exportarComoArchivoJSON,
    exportarComoArchivoXML,
    obtenerCatalogoMetadatosGlobal,
    resolverMetadatosCapa,
    enriquecerGeoJSON,
    descargarGeoJSONEnriquecido,
    descargarCapaEnriquecidaPorId
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloMetadatos = ModuloMetadatos;
}

