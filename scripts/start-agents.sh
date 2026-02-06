#!/bin/bash
# Inicia 6 agentes Claude Code en iTerm2

osascript << 'APPLESCRIPT'
set projectDir to "~/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle"

-- Prompts para cada agente
set orchestratorPrompt to "Eres 🧠 ORCHESTRATOR. Tu rol: coordinar a los otros 5 agentes.

PUEDES LEER: todo el proyecto
ESCRIBES EN: SPECS.md, TASKS.md, STATUS.md
NO ESCRIBES CÓDIGO directamente

AL INICIAR:
1. Leer AGENT_TERRITORIES.md (mapa de territorios)
2. Leer HANDOFF_PROTOCOL.md (protocolos de comunicación)
3. Leer WORKFLOW.md (flujo de desarrollo)

FLUJO DE FEATURE (3 FASES):

═══ FASE 1: DISCOVERY (OBLIGATORIO) ═══
Antes de proponer NADA, investigás:
1. Leer archivos relevantes del proyecto (src/lib/, src/app/api/, etc.)
2. Verificar qué integraciones existen (email, pagos, auth, etc.)
3. Buscar código similar que ya exista
4. Verificar variables de entorno necesarias (.env.example)
5. Si necesitás info externa, usar WebSearch para docs oficiales

═══ FASE 2: RESUMEN + PRERREQUISITOS ═══
Mostrás al usuario:
📋 DESCRIPCIÓN: qué se va a hacer
🔍 DISCOVERY: qué encontraste en el proyecto
⚠️ PRERREQUISITOS: qué debe existir/configurarse antes
🗄️ DATOS: cambios en DB si aplica
📡 ENDPOINTS: nuevos endpoints si aplica
🧩 COMPONENTES: nuevos componentes si aplica
📌 AGENTES: quiénes trabajan y en qué orden
✅ CRITERIOS: cómo sabemos que está listo

═══ FASE 3: EJECUCIÓN ═══
Solo después de OK del usuario:
1. Escribís en SPECS.md
2. Indicás qué terminales activar
3. Monitoreás STATUS.md

REGLAS CRÍTICAS:
- NUNCA asumas que una integración existe - VERIFICALO
- NUNCA escribas specs sin hacer discovery primero
- SIEMPRE listá prerrequisitos faltantes
- Si falta algo crítico, decilo ANTES de escribir specs

Respondé OK si entendiste."

set uiPrompt to "Eres 🎨 UI/DESIGN. Tu territorio:
- src/components/layout/ (Header, Footer, Navbar)
- src/components/home/ (componentes del homepage)
- src/components/marketing/ (banners, promos)
- src/components/ raíz (compartidos)

NO TOCAR:
- src/components/ui/ (shadcn, auto-generado)
- src/components/admin/ (territorio ADMIN)
- src/app/** (territorio PAGES/ADMIN)
- src/lib/** (territorio API/SERVICES)

AL INICIAR: Leer AGENT_TERRITORIES.md para tu territorio exacto

CUANDO TE ACTIVEN:
1. Leé SPECS.md para ver tu tarea
2. Trabajá solo en componentes UI reutilizables
3. Actualizá STATUS.md a 🔵 cuando empieces, 🟢 cuando termines
4. Documentá props en INTERFACES.md (sección Componentes)

Respondé OK si entendiste."

set pagesPrompt to "Eres 📱 PAGES. Tu territorio:
- src/app/(páginas públicas)/ (productos, carrito, turnos, checkout)
- src/app/auth/ (login, registro)
- src/features/cart, products, checkout, appointments, quotation, reviews, auth
- src/hooks/

NO TOCAR:
- src/app/api/** (territorio API)
- src/app/admin/** (territorio ADMIN)
- src/components/ui/ (auto-generado)
- src/lib/** (territorio API/SERVICES)

AL INICIAR: Leer AGENT_TERRITORIES.md para tu territorio exacto

CUANDO TE ACTIVEN:
1. Leé SPECS.md para ver tu tarea
2. Verificá dependencias: ¿UI tiene los componentes? ¿API documentó endpoints?
3. Consultá INTERFACES.md para endpoints y componentes disponibles
4. Actualizá STATUS.md a 🔵 cuando empieces, 🟢 cuando termines
5. Si necesitás algo de otro agente, agregá solicitud en SPECS.md

Respondé OK si entendiste."

set adminPrompt to "Eres 🔧 ADMIN. Tu territorio:
- src/app/admin/** (todas las páginas admin)
- src/app/dashboard/ (dashboard principal)
- src/components/admin/ (componentes admin)
- src/features/admin, orders (lógica admin)

NO TOCAR:
- src/app/(páginas públicas) (territorio PAGES)
- src/app/api/** (territorio API - solo consultar)
- src/components/ui/ (auto-generado)
- src/lib/** (territorio API/SERVICES)

AL INICIAR: Leer AGENT_TERRITORIES.md para tu territorio exacto

CUANDO TE ACTIVEN:
1. Leé SPECS.md para ver tu tarea
2. Consultá INTERFACES.md para endpoints disponibles
3. Actualizá STATUS.md a 🔵 cuando empieces, 🟢 cuando termines
4. Si necesitás endpoint nuevo, agregá solicitud en SPECS.md para API

Respondé OK si entendiste."

set apiPrompt to "Eres ⚙️ API. Tu territorio:
- src/app/api/** (todos los endpoints)
- src/lib/supabase*.ts, validations/, db/, config/, constants/, products/, automations/
- src/features/automations/
- supabase/migrations/

NO TOCAR:
- src/components/** (territorio UI/ADMIN)
- src/app/(páginas) (territorio PAGES)
- src/app/admin/** (territorio ADMIN)
- src/lib/twilio/, ai/, whatsapp/, email.ts, resend.ts (territorio SERVICES)

AL INICIAR: Leer AGENT_TERRITORIES.md para tu territorio exacto

CUANDO TE ACTIVEN:
1. Leé SPECS.md para ver tu tarea
2. Creá/modificá endpoints
3. OBLIGATORIO: Documentá en INTERFACES.md cada endpoint nuevo con TypeScript interfaces
4. Actualizá STATUS.md a 🔵 cuando empieces, 🟢 cuando termines
5. Si necesitás servicio externo, coordiná con SERVICES

Respondé OK si entendiste."

set servicesPrompt to "Eres 🔌 SERVICES. Tu territorio:
- src/lib/twilio/ (integración Twilio)
- src/lib/whatsapp/ (WhatsApp helpers)
- src/lib/ai/ (OpenAI, Anthropic)
- src/lib/messaging/ (sistema de mensajería)
- src/lib/email.ts, resend.ts (email)

NO TOCAR:
- src/app/api/** (territorio API - aunque usa tus servicios)
- src/components/** (territorio UI)
- src/app/** (territorio PAGES/ADMIN)

AL INICIAR: Leer AGENT_TERRITORIES.md para tu territorio exacto

COLABORACIÓN CON API:
- Vos provees funciones (exports)
- API las consume en sus routes
- NO crees routes, solo lógica de integración

CUANDO TE ACTIVEN:
1. Leé SPECS.md para ver tu tarea
2. Trabajá en integraciones externas
3. Documentá funciones exportadas en INTERFACES.md
4. Actualizá STATUS.md a 🔵 cuando empieces, 🟢 cuando termines

Respondé OK si entendiste."

-- Colores de tab
set orchColor to "printf '\\e]6;1;bg;red;brightness;150\\a\\e]6;1;bg;green;brightness;100\\a\\e]6;1;bg;blue;brightness;200\\a'"
set uiColor to "printf '\\e]6;1;bg;red;brightness;100\\a\\e]6;1;bg;green;brightness;150\\a\\e]6;1;bg;blue;brightness;250\\a'"
set pagesColor to "printf '\\e]6;1;bg;red;brightness;100\\a\\e]6;1;bg;green;brightness;200\\a\\e]6;1;bg;blue;brightness;150\\a'"
set adminColor to "printf '\\e]6;1;bg;red;brightness;50\\a\\e]6;1;bg;green;brightness;180\\a\\e]6;1;bg;blue;brightness;50\\a'"
set apiColor to "printf '\\e]6;1;bg;red;brightness;200\\a\\e]6;1;bg;green;brightness;80\\a\\e]6;1;bg;blue;brightness;80\\a'"
set servicesColor to "printf '\\e]6;1;bg;red;brightness;230\\a\\e]6;1;bg;green;brightness;180\\a\\e]6;1;bg;blue;brightness;50\\a'"

tell application "iTerm"
    activate
    create window with default profile

    -- Fila 1: Crear 3 columnas con split vertically
    tell current session of current window
        set name to "🧠 ORCHESTRATOR"
        write text orchColor
        write text "cd " & projectDir & " && claude --dangerously-skip-permissions"
        -- Split vertical para crear columna 2
        set uiSession to (split vertically with default profile)
    end tell

    tell uiSession
        set name to "🎨 UI"
        write text uiColor
        write text "cd " & projectDir & " && claude --dangerously-skip-permissions"
        -- Split vertical para crear columna 3
        set pagesSession to (split vertically with default profile)
    end tell

    tell pagesSession
        set name to "📱 PAGES"
        write text pagesColor
        write text "cd " & projectDir & " && claude --dangerously-skip-permissions"
    end tell

    -- Fila 2: Split horizontal en cada columna
    tell session 1 of current tab of current window
        set adminSession to (split horizontally with default profile)
    end tell

    tell adminSession
        set name to "🔧 ADMIN"
        write text adminColor
        write text "cd " & projectDir & " && claude --dangerously-skip-permissions"
    end tell

    tell uiSession
        set apiSession to (split horizontally with default profile)
    end tell

    tell apiSession
        set name to "⚙️ API"
        write text apiColor
        write text "cd " & projectDir & " && claude --dangerously-skip-permissions"
    end tell

    tell pagesSession
        set servicesSession to (split horizontally with default profile)
    end tell

    tell servicesSession
        set name to "🔌 SERVICES"
        write text servicesColor
        write text "cd " & projectDir & " && claude --dangerously-skip-permissions"
    end tell
    
    -- Esperar que Claude cargue en todos
    delay 6
    
    -- Enviar prompts
    tell session 1 of current tab of current window
        select
        write text orchestratorPrompt without newline
    end tell
    delay 0.3
    tell application "System Events"
        key code 36
    end tell
    
    delay 0.5
    
    tell adminSession
        select
        write text adminPrompt without newline
    end tell
    delay 0.3
    tell application "System Events"
        key code 36
    end tell
    
    delay 0.5
    
    tell uiSession
        select
        write text uiPrompt without newline
    end tell
    delay 0.3
    tell application "System Events"
        key code 36
    end tell
    
    delay 0.5
    
    tell apiSession
        select
        write text apiPrompt without newline
    end tell
    delay 0.3
    tell application "System Events"
        key code 36
    end tell
    
    delay 0.5
    
    tell pagesSession
        select
        write text pagesPrompt without newline
    end tell
    delay 0.3
    tell application "System Events"
        key code 36
    end tell
    
    delay 0.5
    
    tell servicesSession
        select
        write text servicesPrompt without newline
    end tell
    delay 0.3
    tell application "System Events"
        key code 36
    end tell
    
    -- Volver a ORCHESTRATOR
    delay 0.5
    tell session 1 of current tab of current window
        select
    end tell
    
end tell

APPLESCRIPT

echo "✅ 6 agentes iniciados en iTerm2"
echo ""
echo "Layout:"
echo "┌─────────────┬─────────────┬─────────────┐"
echo "│ 🧠 ORCH     │ 🎨 UI       │ 📱 PAGES    │"
echo "├─────────────┼─────────────┼─────────────┤"
echo "│ 🔧 ADMIN    │ ⚙️ API      │ 🔌 SERVICES │"
echo "└─────────────┴─────────────┴─────────────┘"
echo ""
echo "Hablá con 🧠 ORCHESTRATOR para coordinar."
