#!/usr/bin/env python3
"""
Normaliza e integra de forma exhaustiva las 52 coberturas biológicas
individualizadas (14 especies de flora urbana/esclerófila y 38 especies de fauna)
para toda la Región Metropolitana (RM) y Barrio Brasil.

Fuentes integradas sin duplicados por especie:
  1. Caché API GBIF exhaustiva RM (/tmp/gbif_rm_cache/{slug}.json), cubriendo
     sinónimos taxonómicos verificados (Daptrius chimango filtrando D. megalopterus,
     Troglodytes musculus/aedon, Vachellia/Acacia caven, Schinus areira/molle,
     Platanus orientalis) y recorte estricto al polígono oficial RM.
  2. Respaldo local verificado (`src/data/gbif_rm_fallback.geojson`).
  3. Árboles mapeados en OpenStreetMap (`/tmp/pbf_rm_cache/points.pkl`, `natural=tree`)
     con clasificación botánica estricta (`species` prioritario sobre `genus`/`species:es`)
     para enriquecer las 14 especies arbóreas (en especial Platanus orientalis,
     Jubaea chilensis, Jacaranda mimosifolia, Schinus areira y Quillaja saponaria).

Garantías:
  - Recorte estricto contra el polígono regional RM (`ide_censo2024_regional.geojson`).
  - Esquema completo de 17 atributos + metadatos ISO (`vgi_utils`).
  - Sincronización de `src/data/`, `data/` y `catalogo_vgi_descentralizado.js`.
"""
import argparse
import json
import os
import pickle
import sys
import time
from concurrent.futures import ProcessPoolExecutor

import shapely

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

import vgi_utils  # noqa: E402

BASE = os.path.dirname(SCRIPT_DIR)
DATA_SRC = os.path.join(BASE, "src", "data")
GBIF_CACHE_DIR = "/tmp/gbif_rm_cache"
PBF_POINTS_PKL = "/tmp/pbf_rm_cache/points.pkl"
FALLBACK_GEOJSON = os.path.join(DATA_SRC, "gbif_rm_fallback.geojson")

SPECIES_CATALOG = [
    # FLORA NATIVA Y PATRIMONIAL (14 especies)
    {
        'sci': 'Quillaja saponaria',
        'comun': 'Quillay (Flora Esclerófila)',
        'comun_corto': 'Quillay',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Quillajaceae',
        'genero': 'Quillaja',
        'icono': '🌿',
        'slug': 'vgi_quillay_quillaja_saponaria_flora_esclerofila'
    },
    {
        'sci': 'Peumus boldus',
        'comun': 'Boldo (Árbol Nativo Medicinal)',
        'comun_corto': 'Boldo',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Monimiaceae',
        'genero': 'Peumus',
        'icono': '🌿',
        'slug': 'vgi_boldo_peumus_boldus'
    },
    {
        'sci': 'Cryptocarya alba',
        'comun': 'Peumo (Árbol Nativo Esclerófilo)',
        'comun_corto': 'Peumo',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Lauraceae',
        'genero': 'Cryptocarya',
        'icono': '🌿',
        'slug': 'vgi_peumo_cryptocarya_alba_arbol_nativo_esclerofilo'
    },
    {
        'sci': 'Maytenus boaria',
        'comun': 'Maitén (Árbol Nativo Siempreverde)',
        'comun_corto': 'Maitén',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Celastraceae',
        'genero': 'Maytenus',
        'icono': '🌿',
        'slug': 'vgi_maiten_maytenus_boaria_arbol_nativo_siempreverde'
    },
    {
        'sci': 'Lithraea caustica',
        'comun': 'Litre (Árbol Nativo Esclerófilo)',
        'comun_corto': 'Litre',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Anacardiaceae',
        'genero': 'Lithraea',
        'icono': '🌿',
        'slug': 'vgi_litre_lithraea_caustica'
    },
    {
        'sci': 'Jubaea chilensis',
        'comun': 'Palma Chilena (Nativa Vulnerable)',
        'comun_corto': 'Palma Chilena',
        'reino': 'Plantae',
        'clase': 'Liliopsida',
        'familia': 'Arecaceae',
        'genero': 'Jubaea',
        'icono': '🌴',
        'slug': 'vgi_palma_chilena_jubaea_chilensis_nativa_vulnerable'
    },
    {
        'sci': 'Schinus areira',
        'comun': 'Pimiento / Molle (Árbol Patrimonial)',
        'comun_corto': 'Pimiento / Molle',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Anacardiaceae',
        'genero': 'Schinus',
        'icono': '🌿',
        'slug': 'vgi_pimiento'
    },
    {
        'sci': 'Platanus orientalis',
        'comun': 'Plátano Oriental (Árbol Urbano)',
        'comun_corto': 'Plátano Oriental',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Platanaceae',
        'genero': 'Platanus',
        'icono': '🌿',
        'slug': 'vgi_platano_oriental_platanus_orientalis'
    },
    {
        'sci': 'Jacaranda mimosifolia',
        'comun': 'Jacarandá (Árbol Ornamental)',
        'comun_corto': 'Jacarandá',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Bignoniaceae',
        'genero': 'Jacaranda',
        'icono': '🌿',
        'slug': 'vgi_jacaranda_jacaranda_mimosifolia'
    },
    {
        'sci': 'Nicotiana glauca',
        'comun': 'Palqui Extranjero / Tabaco Moruno',
        'comun_corto': 'Palqui Extranjero',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Solanaceae',
        'genero': 'Nicotiana',
        'icono': '🌿',
        'slug': 'vgi_tabaco_moruno_nicotiana_glauca'
    },
    {
        'sci': 'Ailanthus altissima',
        'comun': 'Árbol del Cielo (Asilvestrado)',
        'comun_corto': 'Árbol del Cielo',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Simaroubaceae',
        'genero': 'Ailanthus',
        'icono': '🌿',
        'slug': 'vgi_arbol_del_cielo_ailanthus_altissima'
    },
    {
        'sci': 'Vachellia caven',
        'comun': 'Espino / Aromo (Árbol Nativo del Espinal)',
        'comun_corto': 'Espino',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Fabaceae',
        'genero': 'Vachellia',
        'icono': '🌿',
        'slug': 'vgi_espino_vachellia_caven'
    },
    {
        'sci': 'Kageneckia oblonga',
        'comun': 'Bollén (Árbol Nativo Esclerófilo)',
        'comun_corto': 'Bollén',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Rosaceae',
        'genero': 'Kageneckia',
        'icono': '🌿',
        'slug': 'vgi_bollen_kageneckia_oblonga'
    },
    {
        'sci': 'Colliguaja odorifera',
        'comun': 'Colliguay (Arbusto Nativo Resinoso)',
        'comun_corto': 'Colliguay',
        'reino': 'Plantae',
        'clase': 'Magnoliopsida',
        'familia': 'Euphorbiaceae',
        'genero': 'Colliguaja',
        'icono': '🌿',
        'slug': 'vgi_colliguay_colliguaja_odorifera'
    },

    # FAUNA AVES (27 especies)
    {
        'sci': 'Turdus falcklandii',
        'comun': 'Zorzal patagónico / Zorzal común',
        'comun_corto': 'Zorzal',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Turdidae',
        'genero': 'Turdus',
        'icono': '🐦',
        'slug': 'vgi_zorzal_patagonico_turdus_falcklandii'
    },
    {
        'sci': 'Columba livia',
        'comun': 'Paloma bravía / Paloma doméstica',
        'comun_corto': 'Paloma común',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Columbidae',
        'genero': 'Columba',
        'icono': '🐦',
        'slug': 'vgi_paloma_bravia_columba_livia'
    },
    {
        'sci': 'Zenaida auriculata',
        'comun': 'Tórtola torcaza / Tórtola común',
        'comun_corto': 'Tórtola',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Columbidae',
        'genero': 'Zenaida',
        'icono': '🐦',
        'slug': 'vgi_tortola_torcaza_zenaida_auriculata'
    },
    {
        'sci': 'Myiopsitta monachus',
        'comun': 'Cotorra argentina / Cata',
        'comun_corto': 'Cotorra argentina',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Psittacidae',
        'genero': 'Myiopsitta',
        'icono': '🦜',
        'slug': 'vgi_cotorra_argentina_myiopsitta_monachus'
    },
    {
        'sci': 'Daptrius chimango',
        'comun': 'Tiuque / Chimango (Milvago chimango)',
        'comun_corto': 'Tiuque',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Falconidae',
        'genero': 'Daptrius',
        'icono': '🦅',
        'slug': 'vgi_tiuque_milvago_chimango'
    },
    {
        'sci': 'Zonotrichia capensis',
        'comun': 'Chincol / Gorrión americano',
        'comun_corto': 'Chincol',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Passerellidae',
        'genero': 'Zonotrichia',
        'icono': '🐦',
        'slug': 'vgi_chincol_zonotrichia_capensis'
    },
    {
        'sci': 'Molothrus bonariensis',
        'comun': 'Mirlo común / Tordo renegrido',
        'comun_corto': 'Mirlo',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Icteridae',
        'genero': 'Molothrus',
        'icono': '🐦',
        'slug': 'vgi_mirlo_comun_molothrus_bonariensis'
    },
    {
        'sci': 'Passer domesticus',
        'comun': 'Gorrión común / Gorrión doméstico',
        'comun_corto': 'Gorrión',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Passeridae',
        'genero': 'Passer',
        'icono': '🐦',
        'slug': 'vgi_gorrion_comun_passer_domesticus'
    },
    {
        'sci': 'Troglodytes musculus',
        'comun': 'Chercán común / Ratona común',
        'comun_corto': 'Chercán',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Troglodytidae',
        'genero': 'Troglodytes',
        'icono': '🐦',
        'slug': 'vgi_chercan_comun_troglodytes_musculus'
    },
    {
        'sci': 'Spinus barbatus',
        'comun': 'Jilguero cordillerano / Jilguero',
        'comun_corto': 'Jilguero',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Fringillidae',
        'genero': 'Spinus',
        'icono': '🐦',
        'slug': 'vgi_jilguero_cordillerano_spinus_barbatus'
    },
    {
        'sci': 'Curaeus curaeus',
        'comun': 'Tordo común / Curæu',
        'comun_corto': 'Tordo',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Icteridae',
        'genero': 'Curaeus',
        'icono': '🐦',
        'slug': 'vgi_tordo_comun_curaeus_curaeus'
    },
    {
        'sci': 'Larus dominicanus',
        'comun': 'Gaviota dominicana',
        'comun_corto': 'Gaviota dominicana',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Laridae',
        'genero': 'Larus',
        'icono': '🕊️',
        'slug': 'vgi_gaviota_dominicana_larus_dominicanus'
    },
    {
        'sci': 'Phytotoma rara',
        'comun': 'Rara / Cortarramas',
        'comun_corto': 'Rara',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Cotingidae',
        'genero': 'Phytotoma',
        'icono': '🐦',
        'slug': 'vgi_rara_phytotoma_rara'
    },
    {
        'sci': 'Sephanoides sephaniodes',
        'comun': 'Picaflor chico / Pingüirirí',
        'comun_corto': 'Picaflor chico',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Trochilidae',
        'genero': 'Sephanoides',
        'icono': '🐦',
        'slug': 'vgi_picaflor_chico_sephanoides_sephaniodes'
    },
    {
        'sci': 'Elaenia albiceps',
        'comun': 'Fío-fío común / Viudita',
        'comun_corto': 'Fío-fío',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Tyrannidae',
        'genero': 'Elaenia',
        'icono': '🐦',
        'slug': 'vgi_fio_fio_elaenia_albiceps'
    },
    {
        'sci': 'Anairetes parulus',
        'comun': 'Cachudito común',
        'comun_corto': 'Cachudito',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Tyrannidae',
        'genero': 'Anairetes',
        'icono': '🐦',
        'slug': 'vgi_cachudito_comun_anairetes_parulus'
    },
    {
        'sci': 'Vanellus chilensis',
        'comun': 'Queltehue / Treile',
        'comun_corto': 'Queltehue',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Charadriidae',
        'genero': 'Vanellus',
        'icono': '🐦',
        'slug': 'vgi_queltehue_vanellus_chilensis'
    },
    {
        'sci': 'Tachycineta leucopyga',
        'comun': 'Golondrina chilena',
        'comun_corto': 'Golondrina chilena',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Hirundinidae',
        'genero': 'Tachycineta',
        'icono': '🐦',
        'slug': 'vgi_golondrina_chilena_tachycineta_leucopyga'
    },
    {
        'sci': 'Parabuteo unicinctus',
        'comun': 'Peuco / Gavilán mixto',
        'comun_corto': 'Peuco',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Accipitridae',
        'genero': 'Parabuteo',
        'icono': '🦅',
        'slug': 'vgi_peuco_parabuteo_unicinctus'
    },
    {
        'sci': 'Leptasthenura aegithaloides',
        'comun': 'Tijeral común',
        'comun_corto': 'Tijeral',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Furnariidae',
        'genero': 'Leptasthenura',
        'icono': '🐦',
        'slug': 'vgi_tijeral_comun_leptasthenura_aegithaloides'
    },
    {
        'sci': 'Columbina picui',
        'comun': 'Tortolita cuyana / Torcacita',
        'comun_corto': 'Tortolita',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Columbidae',
        'genero': 'Columbina',
        'icono': '🐦',
        'slug': 'vgi_tortolita_cuyana_columbina_picui'
    },
    {
        'sci': 'Geranoaetus melanoleucus',
        'comun': 'Águila mora / Águila chilena',
        'comun_corto': 'Águila mora',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Accipitridae',
        'genero': 'Geranoaetus',
        'icono': '🦅',
        'slug': 'vgi_aguila_mora_geranoaetus_melanoleucus'
    },
    {
        'sci': 'Mimus thenca',
        'comun': 'Tenca / Mimo chileno (Endémica)',
        'comun_corto': 'Tenca',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Mimidae',
        'genero': 'Mimus',
        'icono': '🐦',
        'slug': 'vgi_tenca_mimus_thenca'
    },
    {
        'sci': 'Sturnella loyca',
        'comun': 'Loica chilena / Pecho colorado',
        'comun_corto': 'Loica',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Icteridae',
        'genero': 'Sturnella',
        'icono': '🐦',
        'slug': 'vgi_loica_chilena_sturnella_loyca'
    },
    {
        'sci': 'Diuca diuca',
        'comun': 'Diuca común',
        'comun_corto': 'Diuca',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Thraupidae',
        'genero': 'Diuca',
        'icono': '🐦',
        'slug': 'vgi_diuca_comun_diuca_diuca'
    },
    {
        'sci': 'Falco peregrinus',
        'comun': 'Halcón peregrino',
        'comun_corto': 'Halcón peregrino',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Falconidae',
        'genero': 'Falco',
        'icono': '🦅',
        'slug': 'vgi_halcon_peregrino_falco_peregrinus'
    },
    {
        'sci': 'Falco sparverius',
        'comun': 'Cernícalo americano',
        'comun_corto': 'Cernícalo',
        'reino': 'Animalia',
        'clase': 'Aves',
        'familia': 'Falconidae',
        'genero': 'Falco',
        'icono': '🦅',
        'slug': 'vgi_cernicalo_americano_falco_sparverius'
    },

    # FAUNA REPTILES Y ANFIBIOS (4 especies)
    {
        'sci': 'Liolaemus tenuis',
        'comun': 'Lagartija esbelta / Lagartija tenue',
        'comun_corto': 'Lagartija esbelta',
        'reino': 'Animalia',
        'clase': 'Squamata',
        'familia': 'Liolaemidae',
        'genero': 'Liolaemus',
        'icono': '🦎',
        'slug': 'vgi_lagartija_esbelta_liolaemus_tenuis'
    },
    {
        'sci': 'Liolaemus lemniscatus',
        'comun': 'Lagartija lemniscata',
        'comun_corto': 'Lagartija lemniscata',
        'reino': 'Animalia',
        'clase': 'Squamata',
        'familia': 'Liolaemidae',
        'genero': 'Liolaemus',
        'icono': '🦎',
        'slug': 'vgi_lagartija_lemniscata_liolaemus_lemniscatus'
    },
    {
        'sci': 'Liolaemus nitidus',
        'comun': 'Lagarto nítido / Lagartija chilena',
        'comun_corto': 'Lagarto nítido',
        'reino': 'Animalia',
        'clase': 'Squamata',
        'familia': 'Liolaemidae',
        'genero': 'Liolaemus',
        'icono': '🦎',
        'slug': 'vgi_lagarto_nitido_liolaemus_nitidus'
    },
    {
        'sci': 'Rhinella spinulosa',
        'comun': 'Sapo espinoso / Sapo cordillerano',
        'comun_corto': 'Sapo espinoso',
        'reino': 'Animalia',
        'clase': 'Amphibia',
        'familia': 'Bufonidae',
        'genero': 'Rhinella',
        'icono': '🐸',
        'slug': 'vgi_sapo_espinoso_rhinella_spinulosa'
    },

    # FAUNA INSECTOS Y ARÁCNIDOS (7 especies)
    {
        'sci': 'Bombus terrestris',
        'comun': 'Abejorro común europeo',
        'comun_corto': 'Abejorro común',
        'reino': 'Animalia',
        'clase': 'Insecta',
        'familia': 'Apidae',
        'genero': 'Bombus',
        'icono': '🐝',
        'slug': 'vgi_abejorro_comun_europeo_bombus_terrestris'
    },
    {
        'sci': 'Apis mellifera',
        'comun': 'Abeja melífera / Abeja doméstica',
        'comun_corto': 'Abeja melífera',
        'reino': 'Animalia',
        'clase': 'Insecta',
        'familia': 'Apidae',
        'genero': 'Apis',
        'icono': '🐝',
        'slug': 'vgi_abeja_melifera_apis_mellifera'
    },
    {
        'sci': 'Harmonia axyridis',
        'comun': 'Chinita arlequín / Mariquita asiática',
        'comun_corto': 'Chinita arlequín',
        'reino': 'Animalia',
        'clase': 'Insecta',
        'familia': 'Coccinellidae',
        'genero': 'Harmonia',
        'icono': '🐞',
        'slug': 'vgi_chinita_arlequin_harmonia_axyridis'
    },
    {
        'sci': 'Boisea trivittata',
        'comun': 'Chinche del arce',
        'comun_corto': 'Chinche del arce',
        'reino': 'Animalia',
        'clase': 'Insecta',
        'familia': 'Rhopalidae',
        'genero': 'Boisea',
        'icono': '🪲',
        'slug': 'vgi_chinche_del_arce_boisea_trivittata'
    },
    {
        'sci': 'Menemerus semilimbatus',
        'comun': 'Araña saltarina gris',
        'comun_corto': 'Araña saltarina',
        'reino': 'Animalia',
        'clase': 'Arachnida',
        'familia': 'Salticidae',
        'genero': 'Menemerus',
        'icono': '🕷️',
        'slug': 'vgi_arana_saltarina_gris_menemerus_semilimbatus'
    },
    {
        'sci': 'Scytodes globula',
        'comun': 'Araña tigre (Depredadora natural)',
        'comun_corto': 'Araña tigre',
        'reino': 'Animalia',
        'clase': 'Arachnida',
        'familia': 'Scytodidae',
        'genero': 'Scytodes',
        'icono': '🕷️',
        'slug': 'vgi_arana_tigre_scytodes_globula'
    },
    {
        'sci': 'Loxosceles laeta',
        'comun': 'Araña de rincón (Sicárida de cuidado)',
        'comun_corto': 'Araña de rincón',
        'reino': 'Animalia',
        'clase': 'Arachnida',
        'familia': 'Sicariidae',
        'genero': 'Loxosceles',
        'icono': '🕷️',
        'slug': 'vgi_arana_de_rincon_loxosceles_laeta'
    }
]

# Sinónimos aceptados para el cruce en gbif_rm_fallback.geojson y GBIF
SPECIES_SYNONYMS = {
    "Daptrius chimango": {"daptrius chimango", "milvago chimango", "phalcoboenus chimango"},
    "Troglodytes musculus": {"troglodytes musculus", "troglodytes aedon"},
    "Vachellia caven": {"vachellia caven", "acacia caven"},
    "Schinus areira": {"schinus areira", "schinus molle"},
    "Platanus orientalis": {"platanus orientalis", "platanus × hispanica", "platanus x hispanica", "platanus x acerifolia"},
}


def _es_daptrius_chimango_valido(props: dict) -> bool:
    s = " ".join([
        str(props.get("especie") or ""),
        str(props.get("scientificName") or ""),
        str(props.get("nombreComun") or ""),
        str(props.get("nombre") or ""),
    ]).lower()
    if "megalopterus" in s or "mountain caracara" in s or "tiuque cordillerano" in s:
        return False
    return True


def _match_osm_tree_species(tags: dict) -> list:
    """Devuelve la(s) especie(s) científica(s) canónica(s) del catálogo correspondientes a un nodo OSM natural=tree."""
    if tags.get("natural") != "tree":
        return []
    sp = str(tags.get("species") or "").strip().lower()
    gen = str(tags.get("genus") or "").strip().lower()
    es = str(tags.get("species:es") or "").strip().lower()
    nm = str(tags.get("name") or "").strip().lower()

    # 1) Prioridad absoluta a la etiqueta taxonómica `species` cuando existe
    if sp:
        if "quillaja saponaria" in sp: return ["Quillaja saponaria"]
        if "peumus boldus" in sp: return ["Peumus boldus"]
        if "cryptocarya alba" in sp: return ["Cryptocarya alba"]
        if "maytenus boaria" in sp: return ["Maytenus boaria"]
        if "lithraea caustica" in sp: return ["Lithraea caustica"]
        if "jubaea chilensis" in sp: return ["Jubaea chilensis"]
        if "schinus areira" in sp or "schinus molle" in sp: return ["Schinus areira"]
        if "platanus" in sp: return ["Platanus orientalis"]
        if "jacaranda mimosifolia" in sp: return ["Jacaranda mimosifolia"]
        if "nicotiana glauca" in sp: return ["Nicotiana glauca"]
        if "ailanthus altissima" in sp: return ["Ailanthus altissima"]
        if "vachellia caven" in sp or "acacia caven" in sp: return ["Vachellia caven"]
        if "kageneckia oblonga" in sp: return ["Kageneckia oblonga"]
        if "colliguaja odorifera" in sp: return ["Colliguaja odorifera"]
        # Especie explícita distinta en OSM (p.ej. Acer pseudoplatanus, Acacia dealbata, Gleditsia): no mezclar
        return []

    # 2) Sin `species`: usar `genus` cuando identifica inequívocamente al taxon o combina con nombre común
    if gen:
        if "quillaja" in gen: return ["Quillaja saponaria"]
        if "peumus" in gen: return ["Peumus boldus"]
        if "cryptocarya" in gen: return ["Cryptocarya alba"]
        if "maytenus" in gen: return ["Maytenus boaria"]
        if "lithraea" in gen: return ["Lithraea caustica"]
        if "jubaea" in gen: return ["Jubaea chilensis"]
        if "schinus" in gen and "polygam" not in es and "latifol" not in es: return ["Schinus areira"]
        if "platanus" in gen: return ["Platanus orientalis"]
        if "jacaranda" in gen: return ["Jacaranda mimosifolia"]
        if "nicotiana" in gen: return ["Nicotiana glauca"]
        if "ailanthus" in gen: return ["Ailanthus altissima"]
        if "vachellia" in gen or ("acacia" in gen and "espino" in es): return ["Vachellia caven"]
        if "kageneckia" in gen: return ["Kageneckia oblonga"]
        if "colliguaja" in gen: return ["Colliguaja odorifera"]
        return []

    # 3) Respaldo solo por `species:es` / `name` cuando no hay ni `species` ni `genus`
    txt = f"{es} | {nm}"
    if "quillay" in txt: return ["Quillaja saponaria"]
    if "boldo" in txt: return ["Peumus boldus"]
    if "peumo" in txt: return ["Cryptocarya alba"]
    if "maitén" in txt or "maiten" in txt: return ["Maytenus boaria"]
    if "litre" in txt: return ["Lithraea caustica"]
    if "palma chilena" in txt: return ["Jubaea chilensis"]
    if "pimiento" in txt and "falso plátano" not in txt: return ["Schinus areira"]
    if "plátano oriental" in txt or "platano oriental" in txt or "plátano de sombra" in txt: return ["Platanus orientalis"]
    if "jacarand" in txt: return ["Jacaranda mimosifolia"]
    if "tabaco moruno" in txt: return ["Nicotiana glauca"]
    if "árbol del cielo" in txt or "arbol del cielo" in txt: return ["Ailanthus altissima"]
    if "espino" in txt and "tres espinas" not in txt: return ["Vachellia caven"]
    if "bollén" in txt or "bollen" in txt: return ["Kageneckia oblonga"]
    if "colliguay" in txt: return ["Colliguaja odorifera"]
    return []


def _cargar_osm_trees_por_especie() -> dict:
    por_especie = {sp["sci"]: [] for sp in SPECIES_CATALOG[:14]}
    if not os.path.exists(PBF_POINTS_PKL):
        return por_especie
    pts = pickle.load(open(PBF_POINTS_PKL, "rb"))
    for ot, clean_id, wkb, tags in pts:
        matches = _match_osm_tree_species(tags)
        if not matches:
            continue
        g = shapely.from_wkb(wkb)
        if g.is_empty:
            continue
        c = g.centroid
        for sci in matches:
            por_especie[sci].append({
                "id": f"OSM/{ot}/{clean_id}",
                "lat": round(c.y, 6),
                "lon": round(c.x, 6),
                "tags": tags,
            })
    return por_especie


def _cargar_fallback_por_especie() -> dict:
    por_especie = {sp["sci"]: [] for sp in SPECIES_CATALOG}
    if not os.path.exists(FALLBACK_GEOJSON):
        return por_especie
    syn_to_sci = {}
    for sp in SPECIES_CATALOG:
        sci = sp["sci"]
        syn_to_sci[sci.lower()] = sci
        for syn in SPECIES_SYNONYMS.get(sci, ()):
            syn_to_sci[syn] = sci

    fb = json.load(open(FALLBACK_GEOJSON, encoding="utf-8"))
    for ft in fb.get("features", []):
        p = ft.get("properties") or {}
        g = ft.get("geometry")
        if not g or g.get("type") != "Point":
            continue
        sp_raw = str(p.get("especie") or "").strip().lower()
        sci_raw = str(p.get("scientificName") or "").strip().lower()
        target = syn_to_sci.get(sp_raw)
        if not target:
            for syn, can in syn_to_sci.items():
                if sci_raw.startswith(syn):
                    target = can
                    break
        if not target:
            continue
        if target == "Daptrius chimango" and not _es_daptrius_chimango_valido(p):
            continue
        coords = g.get("coordinates") or []
        if len(coords) < 2:
            continue
        por_especie[target].append({
            "gbifID": p.get("gbifID") or str(p.get("id_vgi") or "").replace("GBIF/", ""),
            "lon": coords[0],
            "lat": coords[1],
            "eventDate": str(p.get("fecha") or p.get("fecha_registro") or "2026")[:10],
            "datasetName": p.get("operador") or "GBIF / Ciencia Comunitaria",
            "recordedBy": "",
            "locality": p.get("direccion") or "",
            "scientificName": p.get("scientificName") or target,
            "license": p.get("licencia") or "CC BY-NC 4.0",
        })
    return por_especie


_REFS = None


def _get_refs():
    global _REFS
    if _REFS is None:
        _REFS = vgi_utils.cargar_poligonos_referencia()
    return _REFS


def _procesar_especie(args):
    sp, entry, gbif_recs, fb_recs, osm_trees = args
    refs = _get_refs()
    sci = sp["sci"]
    slug = sp["slug"]
    comun = sp["comun"]
    comun_corto = sp["comun_corto"]
    reino = sp["reino"]
    clase = sp["clase"]
    familia = sp["familia"]
    genero = sp["genero"]

    titulo = entry["nombre"]
    cat = entry["categoriaVGI"]
    institucion = entry.get("institucion") or "GBIF / iNaturalist / eBird"
    grupo = entry.get("dimension") or "socioambiental"
    filename = os.path.basename(entry["archivoLocal"])
    cita_apa = f"Atlas para la Gestión Territorial. (2026). {titulo} ({sci}). GBIF / OpenStreetMap."

    seen_gbif = set()
    features = []
    br_count = 0

    def emit_point(id_igv, lon_f, lat_f, operador, localidad, fuente, metodo, licencia, fecha, sci_name, origen_dato, extra_tags=None):
        nonlocal br_count
        res = vgi_utils.procesar_geometria({"type": "Point", "coordinates": [lon_f, lat_f]}, refs)
        if not res:
            return
        geom_clean, meta_g, en_br = res
        if en_br:
            br_count += 1
        extras = {
            "dwc_scientificName": sci,
            "taxon_verbatim": sci_name,
            "nombre_comun": comun_corto,
            "reino": reino,
            "clase": clase,
            "familia": familia,
            "genero": genero,
            "origen_datos": origen_dato,
        }
        if extra_tags:
            for k in ("species:es", "height", "circumference", "diameter_crown", "addr:street"):
                if extra_tags.get(k):
                    extras[k.replace(":", "_")] = str(extra_tags[k])
        props = vgi_utils.construir_propiedades_vgi(
            id_igv=id_igv,
            categoria=cat,
            subtipo=f"{comun_corto} ({sci})",
            nombre=f"{comun_corto} — {sci}",
            operador=operador,
            direccion=localidad or "Región Metropolitana de Santiago",
            accesibilidad="Observación Ciencia Ciudadana / Abierta" if origen_dato == "GBIF" else "Arborización Urbana / Espacio Público",
            fuente=fuente,
            metodo_adquisicion=metodo,
            licencia=licencia,
            fecha_registro=fecha,
            meta_g=meta_g,
            capa_id=slug,
            titulo=titulo,
            institucion=institucion,
            grupo=grupo,
            cita_apa=cita_apa,
            extras=extras,
        )
        features.append({"type": "Feature", "geometry": geom_clean, "properties": props})

    # 1. Registros GBIF caché exhaustiva RM + respaldo RM
    for rec in (gbif_recs + fb_recs):
        gid = str(rec.get("gbifID") or "").strip()
        if not gid or gid in seen_gbif:
            continue
        seen_gbif.add(gid)
        lon, lat = rec.get("lon"), rec.get("lat")
        if lon is None or lat is None:
            continue
        op = str(rec.get("datasetName") or "GBIF / Ciencia Comunitaria").strip()
        loc = str(rec.get("locality") or "").strip()
        lic = str(rec.get("license") or "CC BY-NC 4.0").strip()
        fec = str(rec.get("eventDate") or "2026-11-10")[:10]
        emit_point(
            id_igv=f"GBIF/{gid}",
            lon_f=float(lon),
            lat_f=float(lat),
            operador=op,
            localidad=loc,
            fuente="GBIF Occurrence API (Región Metropolitana Completa)",
            metodo="Consulta exhaustiva por cuadrantes API GBIF + Recorte RM Oficial",
            licencia=lic,
            fecha=fec,
            sci_name=str(rec.get("scientificName") or sci),
            origen_dato="GBIF",
        )

    # 2. Árboles OSM (natural=tree) para las especies vegetales
    seen_osm = set()
    for t in osm_trees:
        oid = t["id"]
        if oid in seen_osm:
            continue
        seen_osm.add(oid)
        tags = t.get("tags") or {}
        emit_point(
            id_igv=oid,
            lon_f=float(t["lon"]),
            lat_f=float(t["lat"]),
            operador=str(tags.get("operator") or "Comunidad OpenStreetMap"),
            localidad=str(tags.get("addr:street") or "Arborización Urbana RM"),
            fuente="OpenStreetMap (natural=tree · Geofabrik Chile PBF)",
            metodo="Extracción botánica OSM (species/genus) + Recorte RM Oficial",
            licencia="ODbL 1.0 (Open Data Commons)",
            fecha=str(tags.get("check_date") or "2026-11-10")[:10],
            sci_name=str(tags.get("species") or sci),
            origen_dato="OSM_natural_tree",
            extra_tags=tags,
        )

    meta_header = {
        "capa_id": slug,
        "titulo": titulo,
        "especie_cientifica": sci,
        "total_rm": len(features),
        "total_barrio_brasil": br_count,
        "total_gbif": len(seen_gbif),
        "total_osm_tree": len(seen_osm),
        "generado": "2026-11-10",
    }
    vgi_utils.escribir_capa_geojson(filename, features, metadata=meta_header)
    return slug, sci, len(features), br_count, len(seen_gbif), len(seen_osm)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cached-only", action="store_true", help="Procesa solo especies ya presentes en /tmp/gbif_rm_cache/")
    args = parser.parse_args()

    t0 = time.time()
    _, _, cat_entries = vgi_utils.cargar_catalogo_vgi()
    entry_by_id = {e["id"]: e for e in cat_entries}

    osm_by_sci = _cargar_osm_trees_por_especie()
    print(f"[OSM Trees] Cargadas 14 especies arbóreas OSM (total={sum(len(v) for v in osm_by_sci.values())})", flush=True)
    fb_by_sci = _cargar_fallback_por_especie()
    print(f"[Fallback] Cargado gbif_rm_fallback.geojson (total={sum(len(v) for v in fb_by_sci.values())})", flush=True)

    tasks = []
    for sp in SPECIES_CATALOG:
        slug = sp["slug"]
        sci = sp["sci"]
        cache_file = os.path.join(GBIF_CACHE_DIR, f"{slug}.json")
        if args.cached_only and not os.path.exists(cache_file):
            continue
        gbif_recs = json.load(open(cache_file, encoding="utf-8")) if os.path.exists(cache_file) else []
        tasks.append((sp, entry_by_id[slug], gbif_recs, fb_by_sci.get(sci, []), osm_by_sci.get(sci, [])))

    print(f"[BUILD] Procesando {len(tasks)} especies en paralelo...", flush=True)
    actualizaciones = {}
    with ProcessPoolExecutor(max_workers=4) as pool:
        for i, (slug, sci, n_rm, n_br, n_gbif, n_osm) in enumerate(pool.map(_procesar_especie, tasks), 1):
            actualizaciones[slug] = {
                "totalEntidades": n_rm,
                "rm_count": n_rm,
                "br_count": n_br,
                "geometria": "Puntos",
            }
            print(f"[{i:02d}/{len(tasks):02d}] {sci:30s} | RM={n_rm:6d} (GBIF={n_gbif:6d} + OSM={n_osm:4d}) | BB={n_br:4d}", flush=True)

    updated = vgi_utils.actualizar_catalogo_vgi_js(actualizaciones)
    print(f"[DONE] {len(actualizaciones)} especies actualizadas en catálogo ({updated} líneas modificadas) en {time.time()-t0:.1f}s", flush=True)


if __name__ == "__main__":
    main()
