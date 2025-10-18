# Pruebas del Railway MCP Server

## ⚠️ Estado Actual

El servidor MCP de Railway está **configurado correctamente** pero **no disponible aún** porque Claude Code necesita reiniciarse.

## ✅ Verificación de Configuración

```bash
# Configuración verificada en ~/.claude.json
✓ Servidor: railway
✓ Comando: npx -y @railway/mcp-server
✓ Token: Configurado desde ~/.railway/config.json
✓ Tipo: stdio (Model Context Protocol)
```

## 🔄 Pasos para Activar

### 1. Reiniciar Claude Code

**IMPORTANTE**: Los servidores MCP solo se cargan al inicio de Claude Code.

```bash
# Opción 1: Desde el menú de Claude Code
File → Quit Claude Code
# Luego reabrir

# Opción 2: Desde terminal (si aplica)
pkill -f "Claude Code"
# Luego reabrir manualmente
```

### 2. Verificar que el Servidor Está Cargado

Después de reiniciar, pregunta en Claude Code:

```
Claude, ¿qué servidores MCP tienes disponibles?
```

Deberías ver `railway` en la lista.

## 🧪 Pruebas a Realizar (Después del Reinicio)

### Prueba 1: Listar Servidores MCP
```
Claude, lista todos los servidores MCP disponibles
```

**Resultado esperado**: Debe aparecer `railway` en la lista.

---

### Prueba 2: Ver Proyectos de Railway
```
Claude, muéstrame mis proyectos de Railway
```

**Resultado esperado**: Lista de proyectos incluyendo "angelic-truth" (0ed91d35-b255-4998-b308-d6b47fab8d4b)

---

### Prueba 3: Ver Deployments
```
Claude, muéstrame los deployments del proyecto angelic-truth en Railway
```

**Resultado esperado**: Lista de deployments con IDs, estados y fechas.

---

### Prueba 4: Ver Logs del Último Build
```
Claude, muéstrame los logs del deployment 91420d2f-8a24-4c7b-855d-412daca612b5
```

**Resultado esperado**: Logs de build y runtime del deployment.

---

### Prueba 5: Ver Variables de Entorno
```
Claude, lista las variables de entorno del proyecto en Railway
```

**Resultado esperado**: Lista de variables de entorno configuradas.

---

### Prueba 6: Ver Estado del Servicio
```
Claude, ¿cuál es el estado actual del servicio en Railway?
```

**Resultado esperado**: Estado del servicio (running, deploying, crashed, etc.)

---

## 📊 Herramientas Esperadas del Railway MCP

Basándome en la versión 0.1.8, el servidor debería proporcionar:

### Recursos
- `railway://projects` - Lista de proyectos
- `railway://deployments/{projectId}` - Deployments de un proyecto
- `railway://services/{projectId}` - Servicios de un proyecto
- `railway://logs/{deploymentId}` - Logs de un deployment

### Herramientas
- `list_projects` - Listar todos los proyectos
- `list_services` - Listar servicios de un proyecto
- `list_deployments` - Listar deployments
- `get_deployment_logs` - Obtener logs de un deployment
- `list_variables` - Listar variables de entorno
- `create_variable` - Crear nueva variable
- `update_variable` - Actualizar variable existente
- `delete_variable` - Eliminar variable

## 🐛 Troubleshooting

### Problema: Servidor no aparece en la lista

**Solución 1**: Verificar configuración
```bash
python3 -c "import json; config = json.load(open('/Users/gabrielfontenla/.claude.json')); print(config['/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle']['mcpServers']['railway'])"
```

**Solución 2**: Verificar que el token es válido
```bash
railway whoami
```

**Solución 3**: Reinstalar el servidor
```bash
npm cache clean --force
npx -y @railway/mcp-server
```

---

### Problema: Error de autenticación

**Verificar token**:
```bash
cat ~/.railway/config.json | grep token
```

**Re-autenticar**:
```bash
railway logout
railway login
```

Luego ejecutar de nuevo:
```bash
python3 add_railway_mcp.py
```

---

### Problema: Servidor no responde

**Verificar que npx funciona**:
```bash
npx -y @railway/mcp-server 2>&1 &
# Debería quedar esperando input (Ctrl+C para cancelar)
```

**Verificar logs de Claude Code**:
```bash
# Los logs de Claude Code deberían mostrar información sobre MCP servers
# Ubicación depende del sistema operativo
```

---

## 📝 Datos del Proyecto para Pruebas

```yaml
Proyecto Railway:
  ID: 0ed91d35-b255-4998-b308-d6b47fab8d4b
  Nombre: angelic-truth
  Cuenta: Maria Gomez (neumaticosdelvalle.master@gmail.com)

Deployment Actual:
  ID: 91420d2f-8a24-4c7b-855d-412daca612b5
  Estado: Verificar en Railway Dashboard

GitHub:
  Repo: https://github.com/gabrielfontenla1/neumaticos-del-valle
  Branch: main
  Último commit: 950a28e (fix: Disable Nixpacks cache)
```

## ✅ Checklist de Verificación

Después de reiniciar Claude Code:

- [ ] El servidor `railway` aparece en la lista de MCP
- [ ] Puedo listar proyectos de Railway
- [ ] Puedo ver deployments del proyecto
- [ ] Puedo ver logs de builds
- [ ] Puedo listar variables de entorno
- [ ] Puedo ver el estado actual del servicio

## 🔗 Recursos Adicionales

- [Railway MCP Server GitHub](https://github.com/railwayapp/railway-mcp-server)
- [Model Context Protocol Docs](https://modelcontextprotocol.io)
- [Railway Dashboard](https://railway.app/project/0ed91d35-b255-4998-b308-d6b47fab8d4b)
- [Railway CLI Docs](https://docs.railway.app/guides/cli)

---

**Nota**: Este documento será actualizado con los resultados de las pruebas después del reinicio.
