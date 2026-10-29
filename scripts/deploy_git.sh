#!/bin/bash
# ==============================================================================
# deploy_git.sh
# -------------
# Script de automatización de Git y control de versiones para Nodo GeoAbierto /
# Atlas de Información Geográfica Voluntaria — Departamento de Geografía UAH (2026).
# ==============================================================================

REPO_DIR="/Users/geojplescano/Programas/Práctica profesional 2026 S2/nodo-geoabierto"
cd "$REPO_DIR" || exit 1

echo "=========================================================================="
echo "   CONFIGURACIÓN Y SINCRONIZACIÓN GIT — NODO GEOABIERTO / ATLAS VGI"
echo "=========================================================================="

if ! command -v git &> /dev/null; then
    echo "[-] Error: Git no está instalado o no se encuentra en el PATH."
    exit 1
fi

# 1. Inicializar si no existe
if [ ! -d ".git" ]; then
    git init
    echo "[+] Repositorio Git inicializado localmente."
else
    echo "[*] Repositorio Git existente detectado."
fi

# 2. Configuración de autor de la práctica
git config user.name "GEOJOTA"
git config user.email "juanpablolescanovillegas@gmail.com"
echo "[+] Autor configurado: GEOJOTA <juanpablolescanovillegas@gmail.com>"

# 3. Vincular remote origin si no está presente
if ! git remote | grep -q "origin"; then
    git remote add origin https://github.com/GEOJOTA/atlas_vgi_uah.git
    echo "[+] Remoto origin añadido: https://github.com/GEOJOTA/atlas_vgi_uah.git"
fi

# 4. Agregar y commitear cambios
git add .
MENSAJE_COMMIT="${1:-feat(backend): robustecer backend serverless y local, constructor de consultas VGI, trazabilidad academica y despliegue multi-cloud}"
git commit -m "$MENSAJE_COMMIT" 2>/dev/null || echo "[*] Sin cambios nuevos pendientes de commit."

# 5. Rama principal
git branch -M main

echo ""
echo "=========================================================================="
echo "   INTENTANDO SUBIDA REMOTA A GITHUB (MAIN)"
echo "=========================================================================="
if git push -u origin main 2>/dev/null; then
    echo "[OK] Subida a GitHub completada exitosamente."
else
    echo "[!] La subida automática a GitHub requiere tu autenticación (Token o SSH)."
    echo "    Para sincronizar ahora ejecuta:"
    echo "    git push -u origin main"
fi
echo "=========================================================================="
