# 🔧 Configurar Supabase MCP - Personal Access Token

## 🎯 Problema Encontrado

La configuración estaba usando el **formato antiguo** (servidor local con npx).
La **configuración correcta** usa el servidor HTTP remoto de Supabase.

## ✅ Ya actualicé la configuración

El archivo `~/.claude/claude_desktop_config.json` ahora tiene el formato correcto:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=oyiwyzmaxgnzyhmmkstr",
      "headers": {
        "Authorization": "Bearer SUPABASE_PERSONAL_ACCESS_TOKEN_NEEDED"
      }
    }
  }
}
```

## 🔑 Paso 1: Generar Personal Access Token

**Necesitas generar un token desde Supabase Dashboard:**

### Opción A: Clic directo
```
https://supabase.com/dashboard/account/tokens
```

### Opción B: Manual
1. Ve a https://supabase.com/dashboard
2. Haz clic en tu **perfil** (esquina superior derecha)
3. Selecciona **Account Settings**
4. Ve a la sección **Access Tokens**
5. Haz clic en **"Generate new token"**
6. Dale un nombre (ej: "Claude Code MCP")
7. **Copia el token** (solo se muestra una vez!)

---

## 🔧 Paso 2: Actualizar la Configuración

Una vez que tengas el token, ejecuta este comando reemplazando `TU_TOKEN_AQUI`:

```bash
# macOS/Linux
cat > ~/.claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=oyiwyzmaxgnzyhmmkstr",
      "headers": {
        "Authorization": "Bearer TU_TOKEN_AQUI"
      }
    }
  }
}
EOF
```

**O edita manualmente el archivo:**
```bash
nano ~/.claude/claude_desktop_config.json
```

Y reemplaza `SUPABASE_PERSONAL_ACCESS_TOKEN_NEEDED` con tu token real.

---

## 🚀 Paso 3: Reiniciar Claude Code

1. **Cierra completamente** Claude Code (Cmd+Q en Mac)
2. **Abre** Claude Code nuevamente
3. En el chat, escribe: `/mcp`
4. ✅ Deberías ver "Connected to Supabase"

---

## ✅ Verificación

Si todo funciona, al ejecutar `/mcp` deberías ver:

```
MCP Servers:
✓ supabase (connected)
  - Type: http
  - URL: https://mcp.supabase.com/mcp?project_ref=oyiwyzmaxgnzyhmmkstr
```

---

## 📊 Diferencias: Token vs Service Role Key

| Tipo | Uso | Ubicación |
|------|-----|-----------|
| **Personal Access Token** | Autenticación MCP (gestión de proyecto) | Account Settings → Access Tokens |
| **Service Role Key** | Acceso a datos de BD (desde código) | Project Settings → API → service_role |

**Son diferentes** - el MCP necesita el **Personal Access Token**.

---

## 🐛 Si Sigue Fallando

Si después de configurar el token sigue sin conectar:

### Opción 1: Verificar token
```bash
# Probar la API de Supabase directamente
curl -H "Authorization: Bearer TU_TOKEN" \
  "https://mcp.supabase.com/mcp?project_ref=oyiwyzmaxgnzyhmmkstr"
```

Debería responder con información del servidor MCP.

### Opción 2: Usar método alternativo (npx con token)

Si el HTTP no funciona, puedes probar el método alternativo:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref",
        "oyiwyzmaxgnzyhmmkstr"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "TU_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

### Opción 3: Continuar sin MCP

Si nada funciona, podemos continuar con las migraciones manuales que ya preparé en `EJECUTAR_MIGRACIONES.md`. **Funcionan perfectamente** sin necesidad del MCP.

---

## 🎯 Próximos Pasos

1. ✅ Genera el Personal Access Token
2. ✅ Actualiza la configuración con el token
3. ✅ Reinicia Claude Code
4. ✅ Prueba `/mcp`

Si funciona → podré ejecutar las migraciones automáticamente
Si no funciona → usamos el método manual (5 minutos)

**Ambos métodos funcionan igual de bien!** 🚀
