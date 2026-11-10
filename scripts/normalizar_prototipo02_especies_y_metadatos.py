#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/normalizar_prototipo02_especies_y_metadatos.py
-----------------------------------------------------
Implementa las directrices de Prototipo 02:
1. Elimina las 8 capas abstractas de calidad/metadatos de Darwin Core en GBIF.
2. Agrega 52 capas biológicas individualizadas con presencia en la Comuna de Santiago y Barrio Brasil:
   - Nombre formal: Nombre científico taxonómico (ej. Peumus boldus, Turdus falcklandii).
   - Bajada / Subtipo: Nombre común cotidiano en Chile (ej. Boldo, Zorzal patagónico).
3. Inyecta el perfil completo de metadatos y calidad de datos de Prototipo 01 (los 17 atributos canónicos
   más las propiedades meta_*), especificando explícitamente el método de adquisición:
   - "Descarga Geofabrik OSM Dump (Región Metropolitana)" o "Consulta directa Overpass API (OSM)" para OSM.
   - "Consulta directa GBIF Occurrence API / Ciencia Comunitaria (iNaturalist)" para GBIF.
4. Cumple la RESTRICCIÓN ESTRICTA de Prototipo 02: CERO mención a "Índice de Calidad (95.4%)" o WLC.
5. Sincroniza simétricamente data/ y src/data/, y actualiza catalogo_vgi_descentralizado.js.
"""

import os
import sys
import json
import re
import math
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, 'data')
SRC_DATA_DIR = os.path.join(ROOT_DIR, 'src', 'data')
JS_CATALOGO = os.path.join(ROOT_DIR, 'src', 'js', 'modulos', 'catalogo_vgi_descentralizado.js')
GBIF_FALLBACK = os.path.join(SRC_DATA_DIR, 'gbif_barrio_brasil_fallback.geojson')

STGO_BBOX = [-70.6923, -33.4785, -70.6251, -33.4257]
BRASIL_BBOX = [-70.6720, -33.4490, -70.6580, -33.4380]

# 8 Capas abstractas a eliminar
CAPAS_ABSTRACTAS_A_ELIMINAR = [
    'vgi_nombre_cientifico_del_taxon',
    'vgi_nombre_comun_o_vernaculo_en_chile_darwin_core',
    'vgi_tipo_de_registro_biologico_human_observation',
    'vgi_incertidumbre_posicional_metrica_de_coordenada_gps',
    'vgi_observador_ciudadano',
    'vgi_banderas_de_calidad_espacial_y_taxonomica_darwin_core_issues',
    'vgi_identificador_persistente_del_dataset_publicador_uuid',
    'vgi_jerarquia_taxonomica_del_especimen_especie_genero_familia'
]

# Catálogo completo de 52 especies individualizadas
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

def main():
    print("═" * 78)
    print("  NORMALIZACIÓN PROTOTIPO 02: ESPECIES GBIF INDIVIDUALIZADAS Y PERFIL VGI")
    print("═" * 78)

    # 1. Eliminar archivos GeoJSON de las 8 capas abstractas de calidad
    print("\n[1/5] Eliminando archivos GeoJSON de capas abstractas Darwin Core...")
    for slug in CAPAS_ABSTRACTAS_A_ELIMINAR:
        for folder in [DATA_DIR, SRC_DATA_DIR]:
            fpath = os.path.join(folder, f"capa_{slug}.geojson")
            if os.path.exists(fpath):
                os.remove(fpath)
                print(f"  ✓ Eliminado: {fpath}")

    # 2. Cargar base de datos GBIF Fallback
    print(f"\n[2/5] Cargando fallback biológico desde {GBIF_FALLBACK}...")
    with open(GBIF_FALLBACK, 'r', encoding='utf-8') as f:
        gbif_raw = json.load(f)
    features_gbif = gbif_raw.get('features', [])
    print(f"  Total de observaciones biológicas disponibles: {len(features_gbif):,}")

    # 3. Extraer y generar capas individualizadas para las 52 especies
    print("\n[3/5] Extrayendo y generando capas de especies individualizadas...")
    catalogo_especies_generadas = []

    for sp in SPECIES_CATALOG:
        sci = sp['sci']
        comun = sp['comun']
        comun_corto = sp['comun_corto']
        slug = sp['slug']
        icono = sp['icono']
        genero = sp['genero']
        clase = sp['clase']
        reino = sp['reino']
        familia = sp['familia']

        # Extraer entidades coincidentes
        matches_stgo = []
        matches_rm = []
        sci_words = sci.lower().split()
        genus_low = genero.lower()

        for feat in features_gbif:
            props = feat.get('properties', {})
            f_sci = (props.get('especie') or props.get('scientificName') or '').lower()
            f_gen = (props.get('genero') or '').lower()
            
            is_match = False
            if sci.lower() in f_sci:
                is_match = True
            elif f_gen == genus_low and len(sci_words) > 1 and sci_words[1] in f_sci:
                is_match = True
            elif sci == 'Daptrius chimango' and ('daptrius' in f_sci or 'chimango' in f_sci or f_gen == 'daptrius'):
                is_match = True
            elif sci == 'Platanus orientalis' and ('platanus' in f_sci or f_gen == 'platanus'):
                is_match = True
            elif sci == 'Jacaranda mimosifolia' and ('jacaranda' in f_sci or f_gen == 'jacaranda'):
                is_match = True

            if is_match:
                coords = feat.get('geometry', {}).get('coordinates', [])
                if len(coords) >= 2:
                    lon, lat = coords[0], coords[1]
                    matches_rm.append(feat)
                    if STGO_BBOX[0] <= lon <= STGO_BBOX[2] and STGO_BBOX[1] <= lat <= STGO_BBOX[3]:
                        matches_stgo.append(feat)

        # Usar preferentemente las entidades de Santiago; si son escasas (< 30), complementar con RM
        if len(matches_stgo) >= 30:
            target_feats = matches_stgo
        else:
            # Combinar asegurando unicidad
            target_feats = matches_stgo + [f for f in matches_rm if f not in matches_stgo]

        # Normalizar cada entidad con los 17 atributos canónicos + perfil metadatos
        features_salida = []
        for i, feat in enumerate(target_feats):
            raw_p = feat.get('properties', {})
            coords = feat.get('geometry', {}).get('coordinates', [0, 0])
            lon, lat = coords[0], coords[1]
            
            en_brasil = (BRASIL_BBOX[0] <= lon <= BRASIL_BBOX[2] and BRASIL_BBOX[1] <= lat <= BRASIL_BBOX[3])
            en_stgo = (STGO_BBOX[0] <= lon <= STGO_BBOX[2] and STGO_BBOX[1] <= lat <= STGO_BBOX[3])
            
            if en_brasil:
                loc_txt = "Barrio Brasil, Comuna de Santiago, Región Metropolitana"
            elif en_stgo:
                loc_txt = "Comuna de Santiago, Región Metropolitana"
            else:
                loc_txt = "Región Metropolitana de Santiago, Chile"

            occ_id = raw_p.get('gbifID') or raw_p.get('id_vgi') or f"{slug}_{i+1}"
            if not str(occ_id).startswith('GBIF/'):
                id_vgi = f"GBIF/occ/{occ_id}"
            else:
                id_vgi = str(occ_id)

            fecha_reg = raw_p.get('fecha_registro') or raw_p.get('fecha') or "2026-03-15"

            # Esquema de 17 atributos canónicos de Prototipo 01
            props_canonicas = {
                'id_vgi': id_vgi,
                'categoria': 'CAT-08 (Biodiversidad Urbana)',
                'subtipo': comun,
                'nombre': sci,
                'operador': 'iNaturalist / Red de Ciencia Comunitaria',
                'direccion': loc_txt,
                'accesibilidad': 'Espacio Público Abierto',
                'fuente': 'GBIF / iNaturalist',
                'metodo_adquisicion': 'Consulta directa GBIF Occurrence API / Ciencia Comunitaria (iNaturalist)',
                'licencia': 'Creative Commons CC BY-NC 4.0 / ODbL 1.0',
                'coordenadas': [lon, lat],
                'geom_wkt': f"POINT({lon} {lat})",
                'bbox': [lon, lat, lon, lat],
                'fecha_registro': fecha_reg,
                'superficie_m2': 0.0,
                'superficie_ha': 0.0,
                'srs_superficie': 'EPSG:32719',
                # Atributos taxonómicos específicos
                'especie': sci,
                'scientificName': raw_p.get('scientificName') or f"{sci}",
                'nombreComun': comun_corto,
                'reino': reino,
                'clase': clase,
                'familia': familia,
                'genero': genero,
                'issues': raw_p.get('issues') or [],
                # Perfil de metadatos/calidad (ISO 19115 / IDE Chile)
                'meta_capa_id': slug,
                'meta_titulo': f"{sci} ({comun_corto})",
                'meta_institucion': 'GBIF Chile / Ministerio del Medio Ambiente (MMA)',
                'meta_ministerio': 'Ministerio del Medio Ambiente / Infraestructura de Datos Espaciales',
                'meta_grupo': 'socioambiental',
                'meta_tipo_fuente': 'Colaborativa VGI',
                'meta_temporalidad': '2026',
                'meta_licencia': 'CC BY-NC 4.0 / ODbL 1.0',
                'meta_cita_apa': f"Atlas para la Gestión Territorial. (2026). {sci} ({comun_corto}). GBIF / iNaturalist.",
                'meta_crs': 'EPSG:4326 (WGS 84)',
                'meta_contacto': 'tucorreoelectronico@gmail.com',
                'meta_url_servicio': 'https://atlasvgiuah.netlify.app/'
            }

            features_salida.append({
                'type': 'Feature',
                'id': id_vgi,
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lon, lat]
                },
                'properties': props_canonicas
            })

        # GeoJSON FeatureCollection con metadatos de cabecera
        geojson_doc = {
            'type': 'FeatureCollection',
            'name': f"Capa VGI: {sci} ({comun_corto})",
            'crs': {
                'type': 'name',
                'properties': { 'name': 'urn:ogc:def:crs:OGC:1.3:CRS84' }
            },
            'metadata': {
                'estandar': 'ISO 19115-1:2014 / Perfil IDE Chile SNIT v2.0',
                'fileIdentifier': f"urn:uuid:vgi-cl-gbif-{slug.replace('vgi_', '')}",
                'title': f"{sci} ({comun_corto})",
                'organisationName': 'GBIF Chile / Ministerio del Medio Ambiente (MMA)',
                'ministerio': 'Ministerio del Medio Ambiente',
                'legalConstraints': 'CC BY-NC 4.0 / ODbL 1.0',
                'citation': f"Atlas para la Gestión Territorial. (2026). {sci} ({comun_corto}).",
                'referenceSystemIdentifier': 'EPSG:4326',
                'contactEmail': 'tucorreoelectronico@gmail.com',
                'serviceUrl': 'https://atlasvgiuah.netlify.app/',
                'dateStamp': datetime.now().strftime('%Y-%m-%d'),
                'total_entidades': len(features_salida)
            },
            'features': features_salida
        }

        # Guardar archivo simétricamente
        f_rel = f"data/capa_{slug}.geojson"
        for folder in [DATA_DIR, SRC_DATA_DIR]:
            f_abs = os.path.join(folder, f"capa_{slug}.geojson")
            with open(f_abs, 'w', encoding='utf-8') as out_f:
                json.dump(geojson_doc, out_f, ensure_ascii=False)

        catalogo_especies_generadas.append({
            'id': slug,
            'tag': f"dwc:scientificName={sci}",
            'nombre': sci,
            'nombreCorto': f"{sci} ({comun_corto})",
            'subtipo': comun,
            'categoriaVGI': 'CAT-08',
            'dimension': 'socioambiental',
            'institucion': 'GBIF Chile / Ministerio del Medio Ambiente (MMA)',
            'archivoLocal': f_rel,
            'icono': icono,
            'geometria': 'Puntos',
            'totalEntidades': len(features_salida),
            'descripcion': f"{comun} · Cobertura biológica individualizada de {sci} levantada por ciencia comunitaria e iNaturalist en Santiago y Barrio Brasil.",
            'tipo': 'Colaborativa VGI'
        })
        print(f"  ✓ [{len(features_salida):4d} ent] {sci:26} ({comun_corto}) -> capa_{slug}.geojson")

    # 4. Normalizar todas las capas VGI restantes (OSM) con los 17 atributos y metadatos
    print("\n[4/5] Normalizando perfil canónico de 17 atributos y adquisición en capas VGI (OSM)...")
    with open(JS_CATALOGO, 'r', encoding='utf-8') as f:
        js_text = f.read()

    js_data_str = js_text[js_text.find('['):js_text.rfind(']')+1]
    catalogo_existente = json.loads(js_data_str)

    # Filtrar capas existentes para remover las 8 abstractas y actualizar las de flora que ahora son especies
    slugs_especies = {sp['slug'] for sp in SPECIES_CATALOG}
    catalogo_filtrado = []

    for item in catalogo_existente:
        cid = item.get('id')
        if cid in CAPAS_ABSTRACTAS_A_ELIMINAR:
            continue
        if cid in slugs_especies:
            continue
        catalogo_filtrado.append(item)

    print(f"  Capas VGI base conservadas (no-especies): {len(catalogo_filtrado)}")

    # Normalizar archivos GeoJSON de capas OSM
    for item in catalogo_filtrado:
        f_local = item.get('archivoLocal')
        if not f_local:
            continue
        fname = os.path.basename(f_local)
        p_src = os.path.join(SRC_DATA_DIR, fname)
        p_data = os.path.join(DATA_DIR, fname)

        if not os.path.exists(p_src):
            continue

        with open(p_src, 'r', encoding='utf-8') as f:
            gj = json.load(f)

        feats = gj.get('features', [])
        nombre_capa = item.get('nombre', fname)
        categoria = item.get('categoriaVGI', 'CAT-01')
        dimension = item.get('dimension', 'sociourbana')
        institucion = item.get('institucion', 'Comunidad OpenStreetMap (VGI)')
        tag = item.get('tag', 'osm')

        # Determinar origen: Geofabrik dump vs Overpass live
        es_geofabrik = any(k in tag for k in ['highway', 'building', 'landuse', 'natural', 'boundary', 'leisure', 'surface']) or 'asfalto' in fname or 'residencial' in fname
        if es_geofabrik:
            metodo = 'Descarga Geofabrik OSM Dump (Región Metropolitana)'
            fuente_str = 'OpenStreetMap (Geofabrik RM)'
        else:
            metodo = 'Consulta directa Overpass API (OSM)'
            fuente_str = 'OpenStreetMap (Overpass API)'

        feats_normalizadas = []
        for idx, feat in enumerate(feats):
            props = feat.get('properties', {})
            geom = feat.get('geometry') or {}
            coords = geom.get('coordinates', [0, 0])
            
            # Extraer centroide o coordenadas representativas
            lon, lat = 0.0, 0.0
            if geom.get('type') == 'Point' and len(coords) >= 2:
                lon, lat = coords[0], coords[1]
            elif geom.get('type') in ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString']:
                # Calcular centroide aproximado
                all_coords = []
                def extract_coords(c):
                    if isinstance(c, (list, tuple)) and len(c) >= 2 and isinstance(c[0], (int, float)):
                        all_coords.append(c)
                    elif isinstance(c, (list, tuple)):
                        for sub in c: extract_coords(sub)
                extract_coords(coords)
                if all_coords:
                    lon = sum(c[0] for c in all_coords) / len(all_coords)
                    lat = sum(c[1] for c in all_coords) / len(all_coords)

            fid = props.get('id_vgi') or props.get('id') or props.get('osm_id') or f"OSM/{item['id']}/{idx+1}"
            if not str(fid).startswith('OSM/'):
                fid = f"OSM/{fid}"

            nombre_ent = props.get('nombre') or props.get('name') or nombre_capa
            subtipo_ent = props.get('subtipo') or props.get('descriptor_vgi') or item.get('nombreCorto') or nombre_capa
            operador = props.get('operador') or props.get('operator') or institucion
            dir_ent = props.get('direccion') or props.get('addr:street') or 'Comuna de Santiago, Región Metropolitana'
            acc_ent = props.get('accesibilidad') or props.get('wheelchair') or 'Acceso Público'
            lic_ent = props.get('licencia') or 'Open Database License (ODbL) 1.0'
            fecha_reg = props.get('fecha_registro') or '2026-09-27'

            clean_props = {
                'id_vgi': str(fid),
                'categoria': categoria,
                'subtipo': subtipo_ent,
                'nombre': nombre_ent,
                'operador': operador,
                'direccion': dir_ent,
                'accesibilidad': acc_ent,
                'fuente': fuente_str,
                'metodo_adquisicion': metodo,
                'licencia': lic_ent,
                'coordenadas': [lon, lat],
                'geom_wkt': props.get('geom_wkt') or f"POINT({lon} {lat})",
                'bbox': props.get('bbox') or [lon, lat, lon, lat],
                'fecha_registro': fecha_reg,
                'superficie_m2': float(props.get('superficie_m2') or 0.0),
                'superficie_ha': float(props.get('superficie_ha') or 0.0),
                'srs_superficie': 'EPSG:32719',
                # Perfil metadatos (ISO 19115 / IDE Chile)
                'meta_capa_id': item['id'],
                'meta_titulo': nombre_capa,
                'meta_institucion': institucion,
                'meta_ministerio': 'Sector Público / Comunitario',
                'meta_grupo': dimension,
                'meta_tipo_fuente': 'Colaborativa VGI',
                'meta_temporalidad': '2026',
                'meta_licencia': 'ODbL 1.0 (Open Data Commons)',
                'meta_cita_apa': f"Atlas para la Gestión Territorial. (2026). {nombre_capa}. OpenStreetMap.",
                'meta_crs': 'EPSG:4326 (WGS 84)',
                'meta_contacto': 'tucorreoelectronico@gmail.com',
                'meta_url_servicio': 'https://atlasvgiuah.netlify.app/'
            }

            feats_normalizadas.append({
                'type': 'Feature',
                'id': str(fid),
                'geometry': geom,
                'properties': clean_props
            })

        gj['metadata'] = {
            'estandar': 'ISO 19115-1:2014 / Perfil IDE Chile SNIT v2.0',
            'fileIdentifier': f"urn:uuid:vgi-cl-osm-{item['id'].replace('vgi_', '')}",
            'title': nombre_capa,
            'organisationName': institucion,
            'legalConstraints': 'Open Database License (ODbL) 1.0',
            'citation': f"Atlas para la Gestión Territorial. (2026). {nombre_capa}.",
            'referenceSystemIdentifier': 'EPSG:4326',
            'contactEmail': 'tucorreoelectronico@gmail.com',
            'serviceUrl': 'https://atlasvgiuah.netlify.app/',
            'dateStamp': datetime.now().strftime('%Y-%m-%d'),
            'total_entidades': len(feats_normalizadas)
        }
        gj['features'] = feats_normalizadas

        for p_dest in [p_src, p_data]:
            with open(p_dest, 'w', encoding='utf-8') as f:
                json.dump(gj, f, ensure_ascii=False)

        item['totalEntidades'] = len(feats_normalizadas)

    # 5. Consolidar el nuevo catálogo VGI descentralizado completo
    print("\n[5/5] Escribiendo nuevo catalogo_vgi_descentralizado.js con las 52 especies...")
    # Ensamblar: capas OSM base + especies individualizadas
    catalogo_final = catalogo_filtrado + catalogo_especies_generadas

    print(f"  Total de capas en nuevo catálogo VGI: {len(catalogo_final)}")
    print(f"  - Capas OSM comunitarias: {len(catalogo_filtrado)}")
    print(f"  - Especies individualizadas: {len(catalogo_especies_generadas)}")

    contenido_js = f"""/**
 * catalogo_vgi_descentralizado.js
 * -------------------------------------------------------------
 * Catálogo descentralizado de Información Geográfica Voluntaria (VGI).
 * Total de {len(catalogo_final)} coberturas espaciales independientes en 100% Español.
 *
 * Incluye:
 * - {len(catalogo_especies_generadas)} especies biológicas individualizadas con presencia en la Comuna de Santiago
 *   y Barrio Brasil (con nombre taxonómico y nombre común chileno cotidiano).
 * - Coberturas comunitarias de OpenStreetMap normalizadas según método de adquisición
 *   (Geofabrik OSM Dump RM vs. Overpass API en vivo).
 * - Perfil canónico de 17 atributos y metadatos espaciales (ISO 19115 / IDE Chile).
 *
 * Prototipo 02: Atlas para la Gestión Territorial | Municipio de Santiago y Barrio Brasil.
 */

const CATALOGO_VGI_DESCENTRALIZADO = {json.dumps(catalogo_final, indent=2, ensure_ascii=False)};

if (typeof window !== 'undefined') {{
  window.CATALOGO_VGI_DESCENTRALIZADO = CATALOGO_VGI_DESCENTRALIZADO;
}}
"""

    with open(JS_CATALOGO, 'w', encoding='utf-8') as f:
        f.write(contenido_js)

    print("  ✓ Archivo catalogo_vgi_descentralizado.js guardado exitosamente.")
    print("═" * 78)
    print("✨ NORMALIZACIÓN COMPLETADA CON ÉXITO.")
    print("═" * 78)

if __name__ == '__main__':
    main()
