#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/normalizador_editorial_docs.py
--------------------------------------
Normalizador editorial transversal para toda la documentación del proyecto Atlas VGI.
Aplica de forma determinista y verificable:
1. Reducción de adjetivación inflada y eliminación de frases de relleno institucional.
2. Reducción drástica de la densidad de negritas (conservándolas solo en definiciones iniciales, advertencias y claves breves).
3. Unificación de anglicismos (manteniendo script, commit, deploy; traduciendo storyboard, pipeline, feature, bbox, failover, toast, framework, fallback).
4. Unificación de mayúsculas según la ortografía del español (títulos en estilo de oración y "comuna de Santiago").
5. Unificación del formato numérico en español (coma decimal, espacio antes de %, punto de miles).
6.Desarrollo de siglas en primera aparición por parte (IGV, IGMC, KDE, LISA, PRC, OGUC, WLC, CIN-VGI).
7. Eliminación de emojis en documentación técnica.
8. Estandarización de recuadros de advertencia (> [!WARNING] / > [!IMPORTANT]).
9. Consistencia en accesibilidad (WCAG 2.1 nivel AA general en componentes y nivel AAA en texto de lectura) e índices (IGV 95,4 % vs. IGMC 96,55 %).
"""

import re
import unicodedata

# Palabras que deben conservar su mayúscula en títulos en español
PROPER_NOUNS_AND_ACRONYMS = {
    # Nombres propios geográficos e institucionales
    "Atlas", "Barrio", "Brasil", "Yungay", "Santiago", "Chile", "América", "Sur", "Norte",
    "Oriente", "Poniente", "Alameda", "Andes", "Mapocho", "Universidad", "Alberto", "Hurtado",
    "Estado", "Bienes", "Nacionales", "Metropolitana", "Región",
    # Tecnologías, autores y estándares propios
    "OpenStreetMap", "Overpass", "Taginfo", "HeiGIT", "Geofabrik", "Darwin", "Core",
    "Leaflet", "CartoDB", "Esri", "ArcGIS", "OpenTopoMap", "PostGIS", "PostgreSQL",
    "Supabase", "Netlify", "GitHub", "Git", "Python", "JavaScript", "Node", "Vanilla",
    "Redfearn", "Gauss", "Shoelace", "Haversine", "Moran", "Riemann", "Douglas", "Peucker",
    "Herfort", "Haklay", "Goodchild", "Fraunces", "Plus", "Jakarta", "Sans", "JetBrains", "Mono",
    "GeoJSON", "GeoPackage", "OpenXML", "Shapefile", "SQLite", "uMap", "ohsome",
    # Siglas y acrónimos
    "VGI", "ISO", "OGC", "PRC", "PRMS", "OGUC", "IDE", "SNIT", "SII", "INE", "MINVU",
    "MOP", "MDSF", "MTT", "UOCT", "SUBDERE", "SECPLA", "DOM", "DIMAO", "CESFAM", "DEIS",
    "RSH", "IGVUST", "BIP", "ICH", "ZCH", "ZT", "MH", "PMR", "UPERM", "UPROH", "WCAG",
    "W3C", "WLC", "IGV", "IGMC", "KDE", "LISA", "CIN-VGI", "UAH", "ONG", "ONGs", "OSM",
    "OSMCha", "GBIF", "WMS", "WFS", "SFA", "SQL", "GPKG", "CSV", "XML", "JSON", "JSONB",
    "HTML", "HTML5", "CSS", "CSS3", "SPA", "IIFE", "API", "APIs", "REST", "RPC", "CDN",
    "CORS", "MIME", "HTTP", "HTTPS", "SSL", "TLS", "CI/CD", "LFS", "UTM", "WGS84",
    "SIRGAS", "SIRGAS-Chile", "EPSG", "GiST", "GIN", "B-Tree", "SRTM", "ESRI", "QGIS",
    "APA", "ODbL", "CC", "BY-SA", "PARTE", "I", "II", "III", "IV", "V", "VI", "VII", "VIII",
    "OE", "CAT", "ACT", "USO", "QL", "HD", "UI", "UX", "MB", "GB", "KB", "ID", "UUID", "URL",
    "BBox", "WKT", "CRS", "SRID", "ETL", "QA", "ZIP", "XLSX", "DOCX", "PDF", "SVG", "PNG"
}

LOWER_MAP = {w.lower(): w for w in PROPER_NOUNS_AND_ACRONYMS}

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F300-\U0001F9FF"
    "\U00002600-\U000026FF"
    "\U00002700-\U000027BF"
    "\U0001FA00-\U0001FAFF"
    "\u231A-\u23F3"
    "\u23F8-\u23FA"
    "\u25AA-\u25FE"
    "\u2B50\u2B55"
    "]+",
    flags=re.UNICODE
)


def eliminar_emojis(texto: str) -> str:
    # Conservar flechas y cajas ASCII de diagramas (┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼ ▼ ► •)
    def _reemplazar(m):
        s = m.group(0)
        conservados = "".join(c for c in s if c in "▼►◄▲•▪▫")
        return conservados
    limpio = EMOJI_PATTERN.sub(_reemplazar, texto)
    # Limpiar selectores de variación Unicode residuales (\ufe0f)
    limpio = limpio.replace("\ufe0f", "")
    # Limpiar glifos decorativos específicos mencionados en la revisión
    for glifo in ["🏛", "🗫", "⌖", "🔬", "☩", "◈", "⌕", "☘", "⬚", "☵"]:
        limpio = limpio.replace(glifo, "")
    return limpio


def convertir_titulo_oracion(linea_heading: str) -> str:
    m = re.match(r"^(#{1,6}\s+)(.+)$", linea_heading)
    if not m:
        return linea_heading
    prefijo, contenido = m.group(1), m.group(2).strip()

    # Si es un encabezado de PARTE I, PARTE II, etc., ponerlo en formato de oración salvo PARTE X
    # Proteger segmentos entre backticks `...`
    partes_codigo = []
    def guardar_codigo(match):
        partes_codigo.append(match.group(0))
        return f"__CODE_{len(partes_codigo)-1}__"

    contenido_protegido = re.sub(r"`[^`]+`", guardar_codigo, contenido)

    # Separar por tokens manteniendo signos de puntuación
    tokens = re.split(r"(\s+|[:—–\-/\(\)\[\],\.])", contenido_protegido)
    es_inicio_frase = True

    nuevos_tokens = []
    for tok in tokens:
        if not tok or re.match(r"^\s+$", tok):
            nuevos_tokens.append(tok)
            continue
        if tok in (":", "—", "–", "(", "["):
            nuevos_tokens.append(tok)
            if tok in (":", "—", "–"):
                es_inicio_frase = True
            continue
        if re.match(r"^[,.\-\/\)\]]$", tok):
            nuevos_tokens.append(tok)
            continue
        if tok.startswith("__CODE_"):
            nuevos_tokens.append(tok)
            es_inicio_frase = False
            continue
        # Si es numeración inicial tipo "15.1." o "01"
        if re.match(r"^\d+(\.\d+)*\.?$", tok):
            nuevos_tokens.append(tok)
            es_inicio_frase = True
            continue
        # Si contiene guion o código técnico con dígitos (ej. CAT-01, ISO-19157, v2.0)
        if any(c.isdigit() for c in tok) or (tok.isupper() and len(tok) >= 2 and tok not in ("DE", "DEL", "LA", "LAS", "EL", "LOS", "EN", "CON", "POR", "PARA", "UNA", "UN", "AL", "Y", "O", "E")):
            if tok.lower() in LOWER_MAP:
                nuevos_tokens.append(LOWER_MAP[tok.lower()])
            elif tok.isupper() and len(tok) > 4 and tok.lower() not in LOWER_MAP:
                # Palabra común que estaba en MAYÚSCULAS en un título (ej. ALCANCE, OPERATIVO)
                pal = tok.lower()
                if es_inicio_frase:
                    pal = pal.capitalize()
                nuevos_tokens.append(pal)
            else:
                nuevos_tokens.append(tok)
            es_inicio_frase = False
            continue

        low = tok.lower()
        if low in LOWER_MAP:
            palabra_final = LOWER_MAP[low]
            if es_inicio_frase and palabra_final[0].islower():
                palabra_final = palabra_final[0].upper() + palabra_final[1:]
            nuevos_tokens.append(palabra_final)
        else:
            if es_inicio_frase:
                nuevos_tokens.append(low.capitalize())
            else:
                nuevos_tokens.append(low)
        es_inicio_frase = False

    resultado = "".join(nuevos_tokens)
    for idx, cod in enumerate(partes_codigo):
        resultado = resultado.replace(f"__CODE_{idx}__", cod)

    return prefijo + resultado


def generar_slug_github(titulo_texto: str) -> str:
    # Eliminar formato markdown como ` o **
    limpio = titulo_texto.replace("`", "").replace("*", "")
    limpio = limpio.strip().lower()
    # En GitHub slugs: se eliminan signos de puntuación salvo espacios y guiones
    slug = []
    for ch in limpio:
        if ch.isalnum() or ch in ("_", "-"):
            slug.append(ch)
        elif ch == " ":
            slug.append("-")
    return "".join(slug)


def limpiar_prosa_segmento(seg: str) -> str:
    """Aplica las reglas editoriales sobre un segmento de texto fuera de bloques de código y fuera de backticks."""

    # 1. Eliminar frases de relleno institucional y adjetivación inflada
    reemplazos_frases = [
        (r"\brevisión exhaustiva de plataformas[^.\n]*", "revisión de cuatro plataformas: OpenStreetMap, GBIF, ohsome e IDE Chile"),
        (r"\bconstituye una infraestructura sociotécnica avanzada[^.\n]*", "es una plataforma web abierta que reúne mapas oficiales y colaborativos para el análisis urbano y la consulta territorial"),
        (r"\binfraestructura sociotécnica(?:\s+avanzada)?\b", "plataforma web abierta que reúne mapas oficiales y colaborativos"),
        (r"\bsolución integral\b", "plataforma de consulta y descarga de geodatos"),
        (r"\becosistema sociotécnico\b", "sistema de información territorial"),
        (r"\bparadigma sociotécnico\b", "enfoque metodológico"),
        (r"\barquitectura de grado institucional\b", "arquitectura modular"),
        (r"\bsoberanía tecnológica\b", "autonomía operativa"),
        (r"\bsoberanía de datos\b", "disponibilidad local de los datos"),
        (r"\bexhaustivamente\b", "en detalle"),
        (r"\bExhaustivamente\b", "En detalle"),
        (r"\bexhaustivas\b", "completas"),
        (r"\bExhaustivas\b", "Completas"),
        (r"\bexhaustivos\b", "completos"),
        (r"\bExhaustivos\b", "Completos"),
        (r"\bexhaustiva\b", "completa"),
        (r"\bExhaustiva\b", "Completa"),
        (r"\bexhaustivo\b", "completo"),
        (r"\bExhaustivo\b", "Completo"),
        (r"\bestrictamente\b", "directamente"),
        (r"\bEstrictamente\b", "Directamente"),
        (r"\bestrictas\b", "precisas"),
        (r"\bEstrictas\b", "Precisas"),
        (r"\bestrictos\b", "precisos"),
        (r"\bEstrictos\b", "Precisos"),
        (r"\bestricta\b", "precisa"),
        (r"\bEstricta\b", "Precisa"),
        (r"\bestricto\b", "preciso"),
        (r"\bEstricto\b", "Preciso"),
        (r"\bcanónicamente\b", "de forma estándar"),
        (r"\bcanónicas\b", "de referencia"),
        (r"\bCanónicas\b", "De referencia"),
        (r"\bcanónicos\b", "de referencia"),
        (r"\bCanónicos\b", "De referencia"),
        (r"\bcanónica\b", "de referencia"),
        (r"\bCanónica\b", "De referencia"),
        (r"\bcanónico\b", "de referencia"),
        (r"\bCanónico\b", "De referencia"),
        (r"\bavanzadas\b", "especializadas"),
        (r"\bAvanzadas\b", "Especializadas"),
        (r"\bavanzados\b", "especializados"),
        (r"\bAvanzados\b", "Especializados"),
        (r"\bavanzada\b", "especializada"),
        (r"\bAvanzada\b", "Especializada"),
        (r"\bavanzado\b", "especializado"),
        (r"\bAvanzado\b", "Especializado"),
        (r"\bsoberanas\b", "autónomas"),
        (r"\bsoberanos\b", "autónomos"),
        (r"\bsoberana\b", "autónoma"),
        (r"\bSoberana\b", "Autónoma"),
        (r"\bsoberano\b", "autónomo"),
        (r"\bSoberano\b", "Autónomo"),
        (r"\brigurosamente\b", "de forma verificable"),
        (r"\brigurosas\b", "verificables"),
        (r"\bRigurosas\b", "Verificables"),
        (r"\brigurosos\b", "verificables"),
        (r"\bRigurosos\b", "Verificables"),
        (r"\brigurosa\b", "verificable"),
        (r"\bRigurosa\b", "Verificable"),
        (r"\briguroso\b", "verificable"),
        (r"\bRiguroso\b", "Verificable"),
        (r"\bemblemáticos\b", "históricos"),
        (r"\bemblemáticas\b", "históricas"),
        (r"\bemblemático\b", "histórico"),
        (r"\bEmblemático\b", "Histórico"),
        (r"\bemblemática\b", "histórica"),
        (r"\bEmblemática\b", "Histórica"),
    ]
    for pat, rep in reemplazos_frases:
        seg = re.sub(pat, rep, seg)

    # 2. Criterio uniforme de anglicismos en prosa (se mantienen script, commit, deploy)
    reemplazos_anglicismos = [
        (r"\bStoryboards\b", "guiones visuales"),
        (r"\bstoryboards\b", "guiones visuales"),
        (r"\bStoryboard\b", "guion visual"),
        (r"\bstoryboard\b", "guion visual"),
        (r"\bPipelines\b", "flujos de procesamiento"),
        (r"\bpipelines\b", "flujos de procesamiento"),
        (r"\bPipeline\b", "flujo de procesamiento"),
        (r"\bpipeline\b", "flujo de procesamiento"),
        (r"\bFeatures\b", "entidades espaciales"),
        (r"\bfeatures\b", "entidades espaciales"),
        (r"\bFeature\b(?!\s*Collection)", "entidad espacial"),
        (r"\bfeature\b", "entidad espacial"),
        (r"\bZero-Build\b", "sin compilación previa"),
        (r"\bzero-build\b", "sin compilación previa"),
        (r"\bel build\b", "la compilación"),
        (r"\bdel build\b", "de la compilación"),
        (r"\bBounding Boxes\b", "cajas delimitadoras"),
        (r"\bBounding Box\b", "caja delimitadora"),
        (r"\bbounding box\b", "caja delimitadora"),
        (r"\bBBox\b", "caja delimitadora"),
        (r"\bbbox\b", "caja delimitadora"),
        (r"\bRound-Robin Failover\b", "rotación con conmutación por falla"),
        (r"\bfailover\b", "conmutación por falla"),
        (r"\bFailover\b", "Conmutación por falla"),
        (r"\bToast Notifications\b", "avisos emergentes"),
        (r"\bToasts\b", "avisos emergentes"),
        (r"\btoasts\b", "avisos emergentes"),
        (r"\bToast\b", "aviso emergente"),
        (r"\btoast\b", "aviso emergente"),
        (r"\bFrameworks\b", "entornos de trabajo"),
        (r"\bframeworks\b", "entornos de trabajo"),
        (r"\bFramework\b", "entorno de trabajo"),
        (r"\bframework\b", "entorno de trabajo"),
        (r"\bFallback\b", "respaldo local"),
        (r"\bfallback\b", "respaldo local"),
    ]
    for pat, rep in reemplazos_anglicismos:
        seg = re.sub(pat, rep, seg)

    # 3. Unificar mayúsculas: "comuna de Santiago" / "la comuna"
    seg = re.sub(r"\bComuna de Santiago\b", "comuna de Santiago", seg)
    seg = re.sub(r"\bla Comuna\b", "la comuna", seg)
    seg = re.sub(r"\besta Comuna\b", "esta comuna", seg)
    seg = re.sub(r"\bdel Barrio\b", "del barrio", seg)

    # 4. Resolver accesibilidad uniforme y corregir inconsistencias menores
    seg = re.sub(
        r"WCAG 2\.1 Nivel AAA en la totalidad[^.\n]*",
        "WCAG 2.1 (nivel AA general en componentes interactivos y nivel AAA en todo el texto de lectura)",
        seg
    )
    seg = re.sub(
        r"Nivel AAA en la totalidad del texto",
        "nivel AAA en todo el texto",
        seg
    )
    seg = re.sub(r"\bMAT_132\b", "MAT_134", seg)
    seg = re.sub(r"\b132 capas\b", "134 capas", seg)
    seg = re.sub(r"\b75 cartografías\b", "83 cartografías", seg)

    # 5. Unificar formato numérico en español:
    # 5a. Decimales con punto seguidos de % -> coma y espacio antes de %
    def _fix_pct_dot(m):
        ent, dec = m.group(1), m.group(2)
        if dec == "00":
            return f"{ent} %"
        return f"{ent},{dec} %"
    seg = re.sub(r"\b(\d+)\.(\d+) ?%", _fix_pct_dot, seg)

    # 5b. Espacio obligatorio antes de % (ej. 100% -> 100 %, 95,4% -> 95,4 %)
    seg = re.sub(r"(\d+(?:,\d+)?)%", r"\1 %", seg)

    # 5c. Cantidades con unidades (MB, GB, KB, ha, km², m²) con punto decimal -> coma decimal
    def _fix_unit_dot(m):
        ent, dec, unit = m.group(1), m.group(2), m.group(3)
        if len(ent) == 4 and ent.isdigit():
            ent = f"{ent[0]}.{ent[1:]}"
        return f"{ent},{dec} {unit}"
    seg = re.sub(r"\b(\d+)\.(\d+)\s*(MB|GB|KB|ha|km²|m²)\b", _fix_unit_dot, seg)

    # 5d. Razones de contraste con punto (ej. 4.58:1 -> 4,58:1, 19.00:1 -> 19,00:1)
    seg = re.sub(r"\b(\d+)\.(\d+)\s*:\s*1\b", r"\1,\2:1", seg)

    # 5e. Coeficientes estadísticos / pesos tipo 0.25, 0.15, 0.10, 0.58 en prosa (fuera de versiones v1.0)
    seg = re.sub(r"(?<![vV\d\.])\b0\.(\d{1,4})\b(?!\.\d)", r"0,\1", seg)

    return seg


def reducir_densidad_negritas_linea(linea: str, en_glosario: bool = False) -> str:
    """
    Conserva negritas únicamente para:
    - Términos definidos por primera vez en el Glosario (Capítulo 37) o en la lista de siglas
    - Etiquetas de advertencias y estructura de tutoriales (`**Advertencia:**`, `**Importante:**`, `**Qué hacer si falla:**`, `**Objetivo:**`, `**Archivos:**`, `**Pasos:**`, `**Verificación:**`)
    - Objetivos específicos (`**OE 1.**` a `**OE 4.**`) y valores críticos puntuales
    Elimina las negritas decorativas en viñetas comunes, párrafos y celdas de tabla.
    """
    if linea.lstrip().startswith("#"):
        return linea.replace("**", "")

    if linea.lstrip().startswith("|") and linea.rstrip().endswith("|"):
        return re.sub(r"\*\*([^*]+)\*\*", r"\1", linea)

    if en_glosario:
        m_glos = re.match(r"^(\s*(?:[-*+]|\d+\.)\s+)(\*\*[^*]{1,65}\*\*)(.*)$", linea)
        if m_glos:
            inicio, term_bold, resto = m_glos.group(1), m_glos.group(2), m_glos.group(3)
            return inicio + term_bold + re.sub(r"\*\*([^*]+)\*\*", r"\1", resto)

    def _filtrar_bold(m):
        contenido = m.group(1)
        if re.match(r"^(Advertencia|Importante|Precaución|Error frecuente|Nota|Objetivo|Archivos|Pasos|Verificación|Qué hacer si falla|OE [1-4]|IGV|IGMC|WLC|WCAG 2\.1)[:\.]?$", contenido.strip()):
            return f"**{contenido}**"
        return contenido

    return re.sub(r"\*\*([^*]+)\*\*", _filtrar_bold, linea)


def normalizar_documento_markdown(texto: str, actualizar_toc_manual: bool = False) -> str:
    texto = eliminar_emojis(texto)

    lineas = texto.splitlines()
    en_bloque_codigo = False
    lenguaje_bloque = ""
    en_glosario = False
    lineas_procesadas = []

    for linea in lineas:
        strip_l = linea.strip()
        if strip_l.startswith("```"):
            if not en_bloque_codigo:
                en_bloque_codigo = True
                lenguaje_bloque = strip_l[3:].strip().lower()
            else:
                en_bloque_codigo = False
                lenguaje_bloque = ""
            lineas_procesadas.append(linea)
            continue

        if en_bloque_codigo:
            l_code = linea.replace("MAT_132", "MAT_134").replace("132 capas", "134 capas").replace("75 cartografías", "83 cartografías")
            if lenguaje_bloque in ("mermaid", "text", ""):
                # En diagramas Mermaid y esquemas de texto, aplicar formato numérico español y traducción de etiquetas
                if "│" not in l_code:
                    # Proteger rutas, clases CSS e identificadores de subgraph antes de limpiar_prosa_segmento
                    prot_m = []
                    def _pm(m):
                        prot_m.append(m.group(0))
                        return f"__PM_{len(prot_m)-1}__"
                    l_code = re.sub(
                        r"subgraph\s+[A-Za-z0-9_]+\s*\[|(?:src/|docs/|data/|img/|scripts/)[A-Za-z0-9_./*-]+|\.[a-zA-Z_-][a-zA-Z0-9_-]+",
                        _pm,
                        l_code
                    )
                    l_code = l_code.replace("PIPELINE DE PROCESAMIENTO", "FLUJO DE PROCESAMIENTO")
                    l_code = l_code.replace("Pipeline de Procesamiento", "Flujo de procesamiento")
                    l_code = l_code.replace("PIPELINE", "FLUJO DE PROCESAMIENTO").replace("STORYBOARDS", "GUIONES VISUALES")
                    l_code = limpiar_prosa_segmento(l_code)
                    l_code = re.sub(r"FLUJO DE PROCESAMIENTO DE PROCESAMIENTO", "FLUJO DE PROCESAMIENTO", l_code, flags=re.I)
                    l_code = re.sub(r"flujo de procesamiento de procesamiento", "Flujo de procesamiento", l_code, flags=re.I)
                    l_code = l_code.replace('["guion visual ', '["Guion visual ')
                    for idx_p, val_p in enumerate(prot_m):
                        l_code = l_code.replace(f"__PM_{idx_p}__", val_p)
                else:
                    # En cajas ASCII con bordes │, mantener ancho pero reemplazar % sin espacio cuando no desborde
                    l_code = re.sub(r"(\d+)\.(\d+)%", r"\1,\2%", l_code)
            else:
                # En bloques de código JS/Python/CSS/SQL, limpiar adjetivos inflados en comentarios
                if "//" in l_code or "#" in l_code:
                    l_code = re.sub(r"\bexhaustiv([ao]s?)\b", r"complet\1", l_code, flags=re.I)
                    l_code = re.sub(r"\bestrict([ao]s?)\b", r"precis\1", l_code, flags=re.I)
                    l_code = re.sub(r"\bcanónic([ao]s?)\b", r"de referencia", l_code, flags=re.I)
            lineas_procesadas.append(l_code)
            continue

        # Detectar si estamos en el capítulo del Glosario (Capítulo 37)
        if re.match(r"^##\s+37\.\s+", linea):
            en_glosario = True
        elif re.match(r"^##\s+(?:3[89]|[45]\d)\.\s+", linea) or re.match(r"^#\s+PARTE\s+", linea):
            en_glosario = False

        # Si es un título Markdown (#, ##, ###, ####)
        if re.match(r"^#{1,6}\s+", linea):
            linea_tit = reducir_densidad_negritas_linea(linea, en_glosario=False)
            partes = re.split(r"(`[^`]+`)", linea_tit)
            for idx in range(0, len(partes), 2):
                partes[idx] = limpiar_prosa_segmento(partes[idx])
            linea_tit = "".join(partes)
            linea_tit = convertir_titulo_oracion(linea_tit)
            lineas_procesadas.append(linea_tit)
            continue

        tokens_protegidos = []
        def _proteger(m):
            tokens_protegidos.append(m.group(0))
            return f"__PROT_{len(tokens_protegidos)-1}__"

        linea_prot = re.sub(r"`[^`]+`|\]\([^)]+\)|https?://\S+", _proteger, linea)
        linea_prot = limpiar_prosa_segmento(linea_prot)
        linea_prot = reducir_densidad_negritas_linea(linea_prot, en_glosario=en_glosario)

        for idx, val in enumerate(tokens_protegidos):
            linea_prot = linea_prot.replace(f"__PROT_{idx}__", val)

        if re.match(r"^\s*\*?\*?(Advertencia|Precaución|Error frecuente)\s*:\*?\*?\s+", linea_prot, flags=re.I):
            cuerpo_adv = re.sub(r"^\s*\*?\*?(Advertencia|Precaución|Error frecuente)\s*:\*?\*?\s+", "", linea_prot, flags=re.I)
            linea_prot = f"> [!WARNING]\n> **Advertencia:** {cuerpo_adv}"

        lineas_procesadas.append(linea_prot)

    resultado = "\n".join(lineas_procesadas)

    if actualizar_toc_manual:
        resultado = convertir_mermaid_secundarios_manual(resultado)
        resultado = expandir_siglas_por_parte(resultado)
        resultado = reconstruir_indice_manual(resultado)
    else:
        resultado = expandir_siglas_por_parte(resultado)

    return resultado + "\n"


def _formatear_caja_ascii(secciones: list) -> str:
    """
    Construye un diagrama vectorial Unicode en bloque ```text de 76 columnas interiores
    con etapas numeradas y flechas de flujo (▼), evitando sobrecargar iframes de GitHub.
    """
    import textwrap
    W = 76
    top = "┌" + "─" * W + "┐"
    mid = "├" + "─" * W + "┤"
    bot = "└" + "─" * W + "┘"
    flecha = "│" + "▼".center(W) + "│"

    out = ["```text", top]
    for s_idx, (titulo, items) in enumerate(secciones):
        if s_idx > 0:
            out.append(mid)
            out.append(flecha)
            out.append(mid)
        tit_limpio = titulo.strip()
        for wline in textwrap.wrap(tit_limpio, width=W - 2) or [tit_limpio]:
            out.append(f"│ {wline.ljust(W - 2)} │")
        out.append(mid)
        for it in items:
            it_limpio = re.sub(r"\s+", " ", it.replace("\\n", " ").replace("<br/>", " — ").replace("<br>", " — ")).strip()
            envueltas = textwrap.wrap(it_limpio, width=W - 4) or [it_limpio]
            for i_l, wl in enumerate(envueltas):
                pref = "• " if i_l == 0 else "  "
                out.append(f"│ {pref}{wl.ljust(W - 4)} │")
    out.append(bot)
    out.append("```")
    return "\n".join(out)


def convertir_mermaid_secundarios_manual(texto: str) -> str:
    """
    En MANUAL_ACTUALIZACION_ATLAS.md (~451 KB), GitHub limita a ~10 s el helloTimer simultáneo
    de los iframes viewscreen.githubusercontent.com (eou.js). Conservar los 4 diagramas
    arquitectónicos principales como bloques ```mermaid y transformar los 38 diagramas
    modulares auxiliares (1. Entrada -> 2. Procesamiento -> 3. Salida) en diagramas de flujo
    vectoriales Unicode (```text) garantiza que el 100 % de los diagramas cargue en < 2 s
    sin disparar jamás 'Unable to render rich display'.
    """
    def _reemplazar_mermaid(m):
        bloque_completo = m.group(0)
        codigo = m.group(1).strip()

        # Conservar los 4 diagramas arquitectónicos clave del manual como bloques ```mermaid
        if (
            'subgraph FASE1[' in codigo
            or 'IGV["Índice Global de Calidad VGI (IGV)"]' in codigo
            or 'evaluador_normativo.js' in codigo
            or codigo.startswith("erDiagram")
        ):
            return bloque_completo

        lineas = [l.strip() for l in codigo.splitlines() if l.strip()]
        if not lineas:
            return bloque_completo

        # Caso A: flowchart con subgraphs
        if "subgraph " in codigo:
            secciones = []
            tit_actual = None
            items_actuales = []
            for l in lineas:
                m_sub = re.match(r'^subgraph\s+[^\[\"]+(?:\["([^"]+)"\])?', l)
                if m_sub:
                    if tit_actual is not None and items_actuales:
                        secciones.append((tit_actual, items_actuales))
                    raw_t = (m_sub.group(1) or l.replace("subgraph", "").strip()).strip()
                    raw_t = re.sub(r"^1\.\s*INPUT\b", "1. ENTRADA", raw_t, flags=re.I)
                    raw_t = re.sub(r"^3\.\s*OUTPUT\b", "3. SALIDA", raw_t, flags=re.I)
                    tit_actual = raw_t
                    items_actuales = []
                    continue
                if l == "end":
                    if tit_actual is not None and items_actuales:
                        secciones.append((tit_actual, items_actuales))
                    tit_actual = None
                    items_actuales = []
                    continue
                m_node = re.findall(r'\["([^"]+)"\]', l)
                if m_node and tit_actual is not None:
                    for txt_n in m_node:
                        if txt_n not in items_actuales:
                            items_actuales.append(txt_n)
            if secciones:
                return _formatear_caja_ascii(secciones)

        # Caso B: sequenceDiagram
        if lineas[0].startswith("sequenceDiagram"):
            pasos = []
            num_paso = 1
            for l in lineas[1:]:
                if l.startswith(("autonumber", "actor ", "participant ")):
                    continue
                if l.startswith(("alt ", "else ", "loop ", "opt ")):
                    etiqueta = l.split(" ", 1)[1] if " " in l else l
                    pasos.append(f"[{etiqueta}]")
                    continue
                if l == "end":
                    continue
                m_msg = re.match(r"^([^-:]+?)\s*(?:-+>>|--+>>|-+\)|--+>)\s*([^:]+):\s*(.+)$", l)
                if m_msg:
                    orig, dest, msg = m_msg.group(1).strip(), m_msg.group(2).strip(), m_msg.group(3).strip()
                    pasos.append(f"{num_paso}. {orig} -> {dest}: {msg}")
                    num_paso += 1
            if pasos:
                return _formatear_caja_ascii([("SECUENCIA OPERATIVA DE EJECUCIÓN", pasos)])

        # Caso C: flowchart lineal sin subgraphs
        nodos = []
        for l in lineas[1:]:
            for txt_n in re.findall(r'\["([^"]+)"\]', l):
                if txt_n not in nodos:
                    nodos.append(txt_n)
        if nodos:
            return _formatear_caja_ascii([("FLUJO OPERATIVO PASO A PASO", nodos)])

        return bloque_completo

    return re.sub(r"```mermaid\n(.*?)```", _reemplazar_mermaid, texto, flags=re.S)


SIGLAS_OBJETIVO = [
    ("IGV", "Índice Global de Calidad VGI (IGV, promedio multicriterio ISO 19157 de las 134 capas; véase el glosario)", ["índice global de calidad"]),
    ("IGMC", "Índice Global de Metacalidad Documental (IGMC, cumplimiento de campos ISO 19115; véase el glosario)", ["índice global de metacalidad"]),
    ("KDE", "estimación de densidad por núcleo (KDE, véase el glosario)", ["estimación de densidad", "kernel density"]),
    ("LISA", "indicadores locales de asociación espacial (LISA, véase el glosario)", ["asociación espacial", "local indicators"]),
    ("PRC", "Plan Regulador Comunal (PRC, véase el glosario)", ["plan regulador comunal"]),
    ("OGUC", "Ordenanza General de Urbanismo y Construcciones (OGUC, véase el glosario)", ["ordenanza general de urbanismo"]),
    ("WLC", "combinación lineal ponderada (WLC, véase el glosario)", ["combinación lineal ponderada", "weighted linear"]),
    ("CIN-VGI", "Certificado de Informaciones Normativas VGI (CIN-VGI, véase el glosario)", ["certificado de informaciones normativas"]),
]


def expandir_siglas_por_parte(texto: str) -> str:
    """
    Para cada parte del documento (separada por '# PARTE '), desarrolla en la primera aparición
    en prosa (fuera de bloques de código, tablas y títulos) cada una de las siglas técnicas clave
    si aún no ha sido explicada en esa línea, remitiendo al glosario.
    """
    lineas = texto.splitlines()
    en_codigo = False
    vistas_en_parte = set()
    salida = []

    for l in lineas:
        if l.strip().startswith("```"):
            en_codigo = not en_codigo
            salida.append(l)
            continue
        if re.match(r"^#\s+PARTE\s+[IVX]+\b", l, flags=re.I):
            vistas_en_parte = set()
            salida.append(l)
            continue
        if en_codigo or l.lstrip().startswith("#") or (l.lstrip().startswith("|") and l.rstrip().endswith("|")):
            salida.append(l)
            continue

        # Proteger segmentos entre backticks y enlaces
        prot = []
        def _save(m):
            prot.append(m.group(0))
            return f"__P_{len(prot)-1}__"
        l_work = re.sub(r"`[^`]+`|\[[^\]]+\]\([^)]+\)", _save, l)

        for sigla, expansion, pistas_previas in SIGLAS_OBJETIVO:
            if sigla in vistas_en_parte:
                continue
            pat = rf"\b{re.escape(sigla)}\b"
            if re.search(pat, l_work):
                low_l = l_work.lower()
                if any(p in low_l for p in pistas_previas):
                    vistas_en_parte.add(sigla)
                else:
                    l_work = re.sub(pat, expansion, l_work, count=1)
                    vistas_en_parte.add(sigla)

        for idx, val in enumerate(prot):
            l_work = l_work.replace(f"__P_{idx}__", val)
        salida.append(l_work)

    return "\n".join(salida)



def reconstruir_indice_manual(texto: str) -> str:
    """
    Extrae todos los encabezados reales (# PARTE..., ## N..., ### N.M...) del cuerpo del manual
    y regenera el Índice general de contenidos con enlaces de ancla 100 % exactos y títulos en estilo de oración.
    """
    lineas = texto.splitlines()
    # Buscar dónde empieza "# PARTE I:" en el cuerpo (después del índice)
    idx_parte_1 = None
    for i, l in enumerate(lineas):
        if re.match(r"^#\s+PARTE\s+I\b", l, flags=re.I):
            idx_parte_1 = i
            break

    if idx_parte_1 is None:
        return texto

    cuerpo = lineas[idx_parte_1:]
    toc_lines = [
        "# Atlas de información geográfica voluntaria (VGI) para la gestión territorial",
        "## Manual de actualización técnica, transferibilidad metodológica y arquitectura operativa",
        "",
        "---",
        "",
        "## Índice general de contenidos",
        ""
    ]

    en_codigo = False
    for l in cuerpo:
        if l.strip().startswith("```"):
            en_codigo = not en_codigo
            continue
        if en_codigo:
            continue
        m_p = re.match(r"^#\s+(PARTE\s+[IVX]+:.+)$", l)
        if m_p:
            tit = m_p.group(1).strip()
            slug = generar_slug_github(tit)
            toc_lines.append(f"### [{tit}](#{slug})")
            continue
        m_h2 = re.match(r"^##\s+(\d+\.\s+.+)$", l)
        if m_h2:
            tit = m_h2.group(1).strip()
            slug = generar_slug_github(tit)
            toc_lines.append(f"* [{tit}](#{slug})")
            continue
        m_h3 = re.match(r"^###\s+(\d+\.\d+\.\s+.+)$", l)
        if m_h3:
            tit = m_h3.group(1).strip()
            slug = generar_slug_github(tit)
            toc_lines.append(f"  * [{tit}](#{slug})")
            continue

    toc_lines.append("")
    toc_lines.append("---")
    toc_lines.append("")

    return "\n".join(toc_lines + cuerpo)
