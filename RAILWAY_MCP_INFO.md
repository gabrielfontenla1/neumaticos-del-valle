# Railway MCP Server - Configuración e Información

## ✅ Estado: Instalado y Configurado

El servidor MCP de Railway ha sido agregado exitosamente a este proyecto.

## 📋 Información del Servidor

- **Nombre**: `railway`
- **Paquete**: `@railway/mcp-server@0.1.8`
- **Tipo**: stdio
- **Repositorio**: https://github.com/railwayapp/railway-mcp-server
- **Documentación**: https://github.com/railwayapp/railway-mcp-server#readme

## 🔧 Configuración

```json
{
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "@railway/mcp-server"
  ],
  "env": {
    "RAILWAY_TOKEN": "[token configurado desde ~/.railway/config.json]"
  }
}
```

## 🎯 Capacidades Esperadas

El servidor MCP de Railway debería proporcionar:

1. **Ver logs de deployments** - Acceder a logs de build y runtime
2. **Gestionar servicios** - Listar, crear, actualizar servicios
3. **Ver deployments** - Información sobre deployments activos
4. **Gestionar variables de entorno** - CRUD de variables
5. **Ver proyectos** - Listar y gestionar proyectos de Railway
6. **Información de estado** - Estado de builds, servicios, etc.

## 🚀 Uso con Claude Code

Después de reiniciar Claude Code, podrás usar comandos como:

```
Claude, muestra los logs del último deployment en Railway
Claude, lista los servicios de este proyecto en Railway
Claude, ¿cuál es el estado del build actual en Railway?
Claude, crea una nueva variable de entorno en Railway
```

## 📁 Archivos de Configuración

### Configuración Global
- **Archivo**: `~/.claude.json`
- **Backup**: `~/.claude.json.backup`
- **Proyecto**: `/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle`

### Token de Railway
- **Archivo**: `~/.railway/config.json`
- **Usuario**: Maria Gomez (neumaticosdelvalle.master@gmail.com)
- **Proyecto ID**: `0ed91d35-b255-4998-b308-d6b47fab8d4b`
- **Proyecto**: angelic-truth

## ⚠️ IMPORTANTE

1. **Reiniciar Claude Code**: Los cambios solo se aplicarán después de reiniciar
2. **Token privado**: El token de Railway es privado y no debe compartirse
3. **Backup**: Se creó un backup en `~/.claude.json.backup`

## 🔄 Actualización del Servidor

Para actualizar a la última versión:

```bash
npm update @railway/mcp-server
```

O forzar la última versión (ya está configurado con `-y`):

```bash
npx -y @railway/mcp-server
```

## 🛠️ Script de Instalación

Se creó el script `add_railway_mcp.py` que:

1. Lee el token de Railway desde `~/.railway/config.json`
2. Agrega el servidor MCP a la configuración de Claude Code
3. Crea un backup automático
4. Configura las variables de entorno necesarias

El script es reutilizable para otros proyectos.

## 📝 Próximos Pasos

1. ✅ Servidor MCP agregado
2. ⏳ Reiniciar Claude Code
3. ⏳ Probar comandos de Railway
4. ⏳ Verificar logs del deployment actual

## 🔗 Enlaces Útiles

- [Railway MCP Server en GitHub](https://github.com/railwayapp/railway-mcp-server)
- [Railway Documentation](https://docs.railway.app)
- [Model Context Protocol](https://modelcontextprotocol.io)

---

**Fecha de instalación**: 2025-10-18
**Proyecto**: Neumáticos del Valle
**GitHub**: https://github.com/gabrielfontenla1/neumaticos-del-valle
