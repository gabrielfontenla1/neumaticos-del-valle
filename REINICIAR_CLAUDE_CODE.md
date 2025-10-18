# 🔄 Guía para Reiniciar Claude Code y Cargar Railway MCP

## ⚠️ IMPORTANTE: Necesitas Reiniciar Claude Code

Los servidores MCP **solo se cargan al iniciar** Claude Code. Los cambios en la configuración NO se aplican hasta reiniciar.

## 📋 Estado Actual

### ✅ Configuración Correcta

#### Archivo `~/.claude.json` (9 servidores globales):
```
✓ sequential-thinking
✓ puppeteer
✓ magic
✓ context7
✓ shadcn
✓ github
✓ supabase (restaurado)
✓ serena (restaurado)
✓ playwright (restaurado)
```

#### Archivo `.mcp.json` (2 servidores del proyecto):
```
✓ shadcn
✓ railway (agregado con type: stdio)
```

### ❌ Problema Actual

Solo ves **puppeteer** porque Claude Code no ha recargado la configuración.

## 🔄 Pasos para Reiniciar

### Opción 1: Reinicio Normal

1. **Cerrar Claude Code completamente**
   - Ve al menú: `File → Quit Claude Code`
   - O usa: `Cmd + Q` (en Mac)

2. **Esperar 3-5 segundos**
   - Asegúrate de que el proceso se cerró completamente

3. **Reabrir Claude Code**
   - Abre desde Applications o Spotlight

4. **Abrir este proyecto**
   - Navega a: `/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle`

### Opción 2: Reinicio Forzado (si la Opción 1 no funciona)

```bash
# 1. Forzar cierre de Claude Code
pkill -9 "Claude Code"

# 2. Esperar 3 segundos
sleep 3

# 3. Reabrir manualmente desde Applications
open -a "Claude Code"
```

## ✅ Verificación Post-Reinicio

### Paso 1: Verificar Servidores Disponibles

Después de reiniciar, pregunta:

```
Claude, ¿qué servidores MCP tienes disponibles?
```

**Resultado esperado**: Deberías ver 11 servidores (9 globales + 2 del proyecto)

### Paso 2: Verificar Railway Específicamente

```
Claude, ¿tienes acceso al servidor MCP de Railway?
```

**Resultado esperado**: Debe responder que sí y listar las capacidades.

### Paso 3: Probar Railway

```
Claude, lista mis proyectos de Railway
```

**Resultado esperado**: Debe mostrar el proyecto "angelic-truth" (0ed91d35-b255-4998-b308-d6b47fab8d4b)

## 🐛 Troubleshooting

### Problema 1: Railway no aparece después de reiniciar

**Verificar .mcp.json**:
```bash
cat .mcp.json
```

Debe contener:
```json
{
  "mcpServers": {
    "railway": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@railway/mcp-server"],
      "env": {
        "RAILWAY_TOKEN": "..."
      }
    }
  }
}
```

**Verificar que el campo "type" existe**:
```bash
grep -A 2 '"railway"' .mcp.json
```

Debe mostrar: `"type": "stdio"`

### Problema 2: Ningún servidor global aparece

**Verificar configuración global**:
```bash
python3 << 'EOF'
import json
config = json.load(open('/Users/gabrielfontenla/.claude.json'))
if 'mcpServers' in config:
    print("Servidores globales:", list(config['mcpServers'].keys()))
else:
    print("ERROR: No hay mcpServers en ~/.claude.json")
EOF
```

### Problema 3: Error al cargar Railway

**Verificar que Railway CLI está autenticado**:
```bash
railway whoami
```

**Resultado esperado**:
```
Logged in as Maria Gomez (neumaticosdelvalle.master@gmail.com)
```

**Verificar que el token es válido**:
```bash
cat ~/.railway/config.json | python3 -c "import sys, json; print('Token:', json.load(sys.stdin)['user']['token'][:50] + '...')"
```

## 📊 Checklist Post-Reinicio

Marca cuando completes cada paso:

- [ ] Claude Code reiniciado completamente
- [ ] Proyecto neumaticos-del-valle abierto
- [ ] Comando ejecutado: "Claude, ¿qué servidores MCP tienes disponibles?"
- [ ] Veo 11 servidores MCP (9 globales + 2 proyecto)
- [ ] Railway aparece en la lista
- [ ] Comando ejecutado: "Claude, lista mis proyectos de Railway"
- [ ] Veo el proyecto "angelic-truth"
- [ ] Supabase aparece en la lista (restaurado)
- [ ] Serena aparece en la lista (restaurado)
- [ ] Playwright aparece en la lista (restaurado)

## 🎯 Comandos de Prueba

Una vez que Railway esté disponible, prueba estos comandos:

### Ver proyectos
```
Claude, muéstrame mis proyectos de Railway
```

### Ver deployments
```
Claude, lista los deployments del proyecto angelic-truth
```

### Ver logs del último build
```
Claude, muéstrame los logs del deployment 91420d2f-8a24-4c7b-855d-412daca612b5
```

### Ver servicios
```
Claude, lista los servicios del proyecto en Railway
```

### Ver variables de entorno
```
Claude, muéstrame las variables de entorno del proyecto en Railway
```

## 🔗 Archivos de Referencia

- `MCP_CONFIGURACION_FINAL.md` - Documentación completa de la configuración
- `RAILWAY_MCP_INFO.md` - Información específica del MCP de Railway
- `PRUEBAS_RAILWAY_MCP.md` - Guía de pruebas detallada
- `restore_mcp_servers.py` - Script de restauración de servidores

## 📞 Si Sigue Sin Funcionar

Si después de reiniciar Railway no aparece:

1. **Verifica los logs de Claude Code** (si están disponibles)
2. **Ejecuta el script de verificación**:
   ```bash
   python3 << 'EOF'
   import json

   # Verificar .mcp.json
   mcp = json.load(open('.mcp.json'))
   print("✓ .mcp.json existe")
   print("  Servidores:", list(mcp['mcpServers'].keys()))

   # Verificar railway
   railway = mcp['mcpServers']['railway']
   print("\n✓ Configuración de Railway:")
   print("  Type:", railway.get('type', 'FALTA'))
   print("  Command:", railway['command'])
   print("  Args:", railway['args'])
   print("  Token presente:", 'RAILWAY_TOKEN' in railway.get('env', {}))
   EOF
   ```

3. **Intenta mover Railway a configuración global**:
   ```bash
   python3 restore_mcp_servers.py
   # Modifica el script para agregar railway a nivel global
   ```

---

**Última actualización**: 2025-10-18
**Estado**: ✅ Configuración lista - Pendiente reinicio
