#!/usr/bin/env python3
"""
scripts/subir_a_github.py
-------------------------
Script en Python para geógrafos y usuarios que prefieren ejecutar la subida a GitHub
con un simple clic en 'Run Python File' o ejecutando:
    python3 scripts/subir_a_github.py

Este script se encarga de cambiar al directorio del proyecto y ejecutar 'git push'
con explicaciones paso a paso en caso de requerir token de autenticación.
"""

import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(BASE_DIR)

def ejecutar_comando(cmd):
    resultado = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    return resultado.returncode, resultado.stdout, resultado.stderr

def principal():
    print("==========================================================================")
    print("      SUBIDA AUTOMATIZADA A GITHUB — ATLAS VGI (NODO GEOABIERTO)")
    print("==========================================================================")
    print(f"[*] Directorio de trabajo: {BASE_DIR}")

    # 1. Verificar estado de Git
    code, out, _ = ejecutar_comando("git status --short")
    if out.strip():
        print("[+] Guardando cambios pendientes...")
        ejecutar_comando("git add .")
        ejecutar_comando('git commit -m "feat(atlas-vgi): sincronizacion automatica desde script Python"')

    print("[*] Conectando con GitHub (rama: main)...")
    code, out, err = ejecutar_comando("git push -u origin main")

    if code == 0:
        print("\n[OK] ¡Subida exitosa a GitHub!")
        print("     Repositorio: https://github.com/GEOJOTA/atlas_vgi_uah")
        print("     GitHub Actions desplegará la plataforma automáticamente.")
    else:
        print("\n[!] GitHub requiere tu autenticación (Token de Acceso Personal o SSH).")
        print("    Detalle:", err.strip() or out.strip())
        print("\n--------------------------------------------------------------------------")
        print("¿CÓMO RESOLVERLO FÁCILMENTE?")
        print("--------------------------------------------------------------------------")
        print("GitHub ya no acepta tu contraseña normal para 'git push', requiere un Token:")
        print("1. Entra a: https://github.com/settings/tokens?type=beta o https://github.com/settings/tokens")
        print("2. Genera un nuevo token con permiso 'repo'.")
        print("3. Cuando la terminal te pida 'Password', pega ese Token.")
        print("\nO bien, puedes ingresar tu token aquí para que este script lo configure:")
        try:
            token = input("Pega tu GitHub Personal Access Token (o presiona Enter para cancelar): ").strip()
            if token:
                url_con_token = f"https://{token}@github.com/GEOJOTA/atlas_vgi_uah.git"
                print("[*] Intentando subir con el token ingresado...")
                code_t, out_t, err_t = ejecutar_comando(f"git push {url_con_token} main")
                if code_t == 0:
                    print("\n[OK] ¡Subida completada exitosamente a GitHub con tu token!")
                    ejecutar_comando(f"git remote set-url origin https://github.com/GEOJOTA/atlas_vgi_uah.git")
                else:
                    print(f"\n[-] Error con el token: {err_t.strip()}")
        except KeyboardInterrupt:
            print("\nOperación cancelada.")

if __name__ == "__main__":
    principal()
