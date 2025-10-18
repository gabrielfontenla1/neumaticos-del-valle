#!/usr/bin/env python3
import json
import os
import sys

def add_github_mcp():
    """
    Agrega el servidor MCP de GitHub a la configuración global de Claude Code
    """
    config_path = os.path.expanduser("~/.claude.json")

    print(f"📂 Leyendo configuración desde: {config_path}")

    # Leer configuración actual
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except Exception as e:
        print(f"❌ Error al leer archivo: {e}")
        sys.exit(1)

    # Asegurar que existe mcpServers
    if 'mcpServers' not in config:
        config['mcpServers'] = {}
        print("ℹ️  Creando sección 'mcpServers'")

    # Verificar si ya existe el servidor de GitHub
    if 'github' in config['mcpServers']:
        print("⚠️  El servidor 'github' ya existe en la configuración")
        print(f"   Configuración actual: {json.dumps(config['mcpServers']['github'], indent=2)}")
        respuesta = input("\n¿Deseas sobrescribirlo? (s/n): ")
        if respuesta.lower() != 's':
            print("❌ Operación cancelada")
            sys.exit(0)

    # Solicitar token de GitHub
    print("\n" + "="*60)
    print("🔑 GITHUB PERSONAL ACCESS TOKEN")
    print("="*60)
    print("Para usar el servidor MCP de GitHub necesitas un token.")
    print("Puedes generarlo en: https://github.com/settings/tokens")
    print("Permisos necesarios: repo, read:org, read:user")
    print("\nSi no tienes el token ahora, puedes agregarlo después")
    print("editando ~/.claude.json manualmente.")
    print("="*60 + "\n")

    token = input("Ingresa tu GitHub token (o presiona Enter para dejarlo vacío): ").strip()

    # Agregar el servidor
    config['mcpServers']['github'] = {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
            "GITHUB_PERSONAL_ACCESS_TOKEN": token if token else ""
        }
    }

    # Crear backup
    backup_path = config_path + '.backup'
    try:
        with open(backup_path, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"\n✅ Backup creado: {backup_path}")
    except Exception as e:
        print(f"⚠️  Error al crear backup: {e}")

    # Guardar cambios
    try:
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)

        print(f"✅ Servidor 'github' agregado exitosamente")

        if not token:
            print("\n⚠️  IMPORTANTE: No se configuró el token de GitHub")
            print(f"   Edita {config_path} y agrega tu token en:")
            print('   "mcpServers" -> "github" -> "env" -> "GITHUB_PERSONAL_ACCESS_TOKEN"')

        print("\n🔄 Reinicia Claude Code para que los cambios surtan efecto")
        print("\nConfiguración agregada:")
        print(json.dumps(config['mcpServers']['github'], indent=2))

    except Exception as e:
        print(f"❌ Error al guardar cambios: {e}")
        sys.exit(1)

if __name__ == "__main__":
    add_github_mcp()
