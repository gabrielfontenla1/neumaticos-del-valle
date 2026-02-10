#!/bin/bash

PROJECT="/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle"
CMD="cd $PROJECT && claude --dangerously-skip-permissions"

osascript -e "
tell application \"iTerm\"
    activate
    delay 0.3
    create window with default profile
    delay 0.3

    -- Split horizontal: arriba y abajo
    tell current session of current window
        split horizontally with default profile
    end tell
    delay 0.3

    -- Ir al panel de arriba y split vertical
    tell first session of current tab of current window
        split vertically with default profile
    end tell
    delay 0.3

    -- Ir al panel de abajo y split vertical
    tell last session of current tab of current window
        split vertically with default profile
    end tell
    delay 0.5

    -- Poner nombre en cada sesion
    repeat with s in sessions of current tab of current window
        tell s
            set name to \"neumaticos-del-valle\"
            write text \"$CMD\"
        end tell
    end repeat

    -- Esperar a que Claude cargue
    delay 6

    -- Enviar instruccion a terminal DATABASE (primera sesion)
    tell first session of current tab of current window
        select
        write text \"Sos la terminal DATABASE. Solo vos modificas archivos de BD (supabase/migrations/, src/lib/supabase*.ts). Lee DB_PENDING.md para ver cambios pendientes.\"
    end tell

    delay 0.2

    tell application \"System Events\"
        tell process \"iTerm\"
            key code 36
        end tell
    end tell
end tell
"

echo "4 terminales 2x2 - neumaticos-del-valle"
echo "Terminal 1: DATABASE     Terminal 2: BACKEND"
echo "Terminal 3: FRONTEND     Terminal 4: QA"
