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

    -- Fila superior: split vertical 2 veces para 3 columnas
    tell first session of current tab of current window
        split vertically with default profile
    end tell
    delay 0.3
    tell first session of current tab of current window
        split vertically with default profile
    end tell
    delay 0.3

    -- Fila inferior: split vertical 2 veces para 3 columnas
    tell last session of current tab of current window
        split vertically with default profile
    end tell
    delay 0.3
    tell last session of current tab of current window
        split vertically with default profile
    end tell
    delay 0.5

    -- Configurar cada sesion con colores
    set sessionList to sessions of current tab of current window

    -- Terminal 1: DATABASE (color calido rojizo)
    tell item 1 of sessionList
        set name to \"Database Terminal\"
        set background color to {6939, 5654, 5654}
        write text \"$CMD\"
    end tell

    -- Terminal 2: BACKEND (color azulado)
    tell item 2 of sessionList
        set background color to {5654, 5654, 6939}
        write text \"$CMD\"
    end tell

    -- Terminal 3: FRONTEND (color verdoso)
    tell item 3 of sessionList
        set background color to {5654, 6425, 5654}
        write text \"$CMD\"
    end tell

    -- Terminal 4: QA (color purpura)
    tell item 4 of sessionList
        set background color to {6425, 5654, 6425}
        write text \"$CMD\"
    end tell

    -- Terminal 5: SERVICES (color cyan)
    tell item 5 of sessionList
        set background color to {5654, 6425, 6425}
        write text \"$CMD\"
    end tell

    -- Terminal 6: GIT (color amarillo)
    tell item 6 of sessionList
        set name to \"Git Terminal\"
        set background color to {6939, 6682, 5654}
        write text \"$CMD\"
    end tell

    -- Esperar a que Claude cargue
    delay 6

    -- Enviar instruccion a terminal DATABASE
    tell item 1 of sessionList
        select
        write text \"Sos la terminal DATABASE. Solo vos modificas archivos de BD (supabase/migrations/, src/lib/supabase*.ts). Lee DB_PENDING.md para ver cambios pendientes.\"
    end tell

    delay 0.2

    tell application \"System Events\"
        tell process \"iTerm\"
            key code 36
        end tell
    end tell

    delay 1

    -- Enviar instruccion a terminal GIT
    tell item 6 of sessionList
        select
        write text \"Sos la terminal GIT. Te encargas de commits, branches, merges y push. Las otras terminales no hacen git.\"
    end tell

    delay 0.2

    tell application \"System Events\"
        tell process \"iTerm\"
            key code 36
        end tell
    end tell

    -- Volver a seleccionar terminal 1
    tell item 1 of sessionList
        select
    end tell
end tell
"

echo "6 terminales 3x2 - neumaticos-del-valle"
echo "Terminal 1: DATABASE     Terminal 2: BACKEND     Terminal 3: FRONTEND"
echo "Terminal 4: QA           Terminal 5: SERVICES    Terminal 6: GIT"
