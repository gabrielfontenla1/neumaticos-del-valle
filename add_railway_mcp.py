#!/usr/bin/env python3
import json
import os

def add_railway_mcp():
    """
    Agrega el servidor MCP de Railway a la configuración global de Claude Code
    """
    config_path = os.path.expanduser("~/.claude.json")

    # Leer el token de Railway
    railway_config_path = os.path.expanduser("~/.railway/config.json")
    with open(railway_config_path, 'r') as f:
        railway_config = json.load(f)
        railway_token = railway_config['user']['token']

    print("📖 Leyendo configuración actual...")

    # Leer configuración actual
    with open(config_path, 'r') as f:
        config = json.load(f)

    # Buscar la sección del proyecto actual
    project_path = "/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle"

    # Si el proyecto no existe en la config, crearlo
    if project_path not in config:
        config[project_path] = {
            "mcpServers": {},
            "allowedTools": [],
            "history": []
        }

    # Asegurar que existe mcpServers
    if 'mcpServers' not in config[project_path]:
        config[project_path]['mcpServers'] = {}

    # Agregar el servidor de Railway
    config[project_path]['mcpServers']['railway'] = {
        "type": "stdio",
        "command": "npx",
        "args": [
            "-y",
            "@railway/mcp-server"
        ],
        "env": {
            "RAILWAY_TOKEN": railway_token
        }
    }

    # Crear backup
    backup_path = config_path + '.backup'
    with open(backup_path, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"✅ Backup creado: {backup_path}")

    # Guardar cambios
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    print(f"✅ Servidor 'railway' agregado exitosamente")
    print(f"📍 Proyecto: {project_path}")
    print("⚠️  IMPORTANTE: Reinicia Claude Code para ver los cambios")
    print("\n📋 Configuración agregada:")
    print(json.dumps(config[project_path]['mcpServers']['railway'], indent=2))

if __name__ == "__main__":
    try:
        add_railway_mcp()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
