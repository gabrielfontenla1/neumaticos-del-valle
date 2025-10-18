#!/usr/bin/env python3
import json
import os

def restore_mcp_servers():
    """
    Restaura los servidores MCP perdidos: supabase, serena, playwright
    y agrega railway al .mcp.json del proyecto
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

    # Crear backup
    backup_path = config_path + '.backup-restore'
    with open(backup_path, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"✅ Backup creado: {backup_path}")

    # Asegurar que existe mcpServers globales
    if 'mcpServers' not in config:
        config['mcpServers'] = {}

    # Agregar servidores MCP faltantes a nivel GLOBAL
    servers_to_add = {
        'supabase': {
            "type": "stdio",
            "command": "npx",
            "args": ["-y", "mcp-supabase"]
        },
        'serena': {
            "type": "stdio",
            "command": "uvx",
            "args": [
                "--from",
                "git+https://github.com/oraios/serena",
                "serena-mcp-server",
                "--context",
                "ide-assistant"
            ]
        },
        'playwright': {
            "type": "stdio",
            "command": "npx",
            "args": ["@playwright/mcp@latest"]
        }
    }

    added_servers = []
    for name, cfg in servers_to_add.items():
        if name not in config['mcpServers']:
            config['mcpServers'][name] = cfg
            added_servers.append(name)
            print(f"  ✅ Agregado: {name}")
        else:
            print(f"  ⏭️  Ya existe: {name}")

    # Guardar cambios
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    print(f"\n✅ Servidores MCP globales actualizados")
    print(f"📋 Servidores agregados: {', '.join(added_servers) if added_servers else 'ninguno (ya existían)'}")

    # Ahora agregar railway al .mcp.json del proyecto
    print("\n📝 Actualizando .mcp.json del proyecto...")
    project_mcp_path = "/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle/.mcp.json"

    with open(project_mcp_path, 'r') as f:
        project_mcp = json.load(f)

    # Backup del .mcp.json
    project_mcp_backup = project_mcp_path + '.backup'
    with open(project_mcp_backup, 'w') as f:
        json.dump(project_mcp, f, indent=2)
    print(f"  ✅ Backup: {project_mcp_backup}")

    # Agregar railway
    if 'mcpServers' not in project_mcp:
        project_mcp['mcpServers'] = {}

    project_mcp['mcpServers']['railway'] = {
        "command": "npx",
        "args": ["-y", "@railway/mcp-server"],
        "env": {
            "RAILWAY_TOKEN": railway_token
        }
    }

    with open(project_mcp_path, 'w') as f:
        json.dump(project_mcp, f, indent=2)

    print(f"  ✅ Railway agregado a .mcp.json")

    # Eliminar railway de la configuración global del proyecto (limpieza)
    project_path = "/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle"
    if project_path in config and 'mcpServers' in config[project_path]:
        if 'railway' in config[project_path]['mcpServers']:
            del config[project_path]['mcpServers']['railway']
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            print(f"  🧹 Railway removido de ~/.claude.json (ahora está en .mcp.json)")

    print("\n⚠️  IMPORTANTE: Reinicia Claude Code para ver los cambios")
    print("\n📊 Resumen de servidores MCP:")
    print("\n  🌐 GLOBALES:")
    for name in sorted(config['mcpServers'].keys()):
        print(f"    - {name}")

    print("\n  📁 PROYECTO (en .mcp.json):")
    for name in sorted(project_mcp['mcpServers'].keys()):
        print(f"    - {name}")

if __name__ == "__main__":
    try:
        restore_mcp_servers()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
