#!/bin/bash

# Open 4 iTerm2 terminals in 2x2 grid with Claude Code
# Terminal 1 (top-left): DATABASE - color cálido
# Terminal 2 (top-right): azul
# Terminal 3 (bottom-left): verde
# Terminal 4 (bottom-right): púrpura

PROJECT_PATH="/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle"

osascript <<EOF
tell application "iTerm2"
    activate

    create window with default profile

    delay 0.2

    tell application "System Events"
        tell process "iTerm2"
            keystroke "d" using command down
            delay 0.4
            keystroke "d" using {command down, shift down}
            delay 0.4
            key code 123 using {command down, option down}
            delay 0.3
            keystroke "d" using {command down, shift down}
            delay 0.4
        end tell
    end tell

    delay 0.5

    tell current window
        tell session 1 of current tab
            write text "cd $PROJECT_PATH"
            set background color to {7500, 6000, 6000}
            write text "claude --dangerously-skip-permissions"
        end tell

        delay 0.3

        tell session 2 of current tab
            write text "cd $PROJECT_PATH"
            set background color to {6000, 6000, 7500}
            write text "claude --dangerously-skip-permissions"
        end tell

        delay 0.3

        tell session 3 of current tab
            write text "cd $PROJECT_PATH"
            set background color to {6000, 7000, 6000}
            write text "claude --dangerously-skip-permissions"
        end tell

        delay 0.3

        tell session 4 of current tab
            write text "cd $PROJECT_PATH"
            set background color to {7000, 6000, 7000}
            write text "claude --dangerously-skip-permissions"
        end tell
    end tell

    delay 5

    tell current window
        tell session 1 of current tab
            select
        end tell
    end tell

    delay 0.3

    tell application "System Events"
        tell process "iTerm2"
            keystroke "Sos la terminal DATABASE. Solo vos modificás archivos de BD (supabase/migrations/, src/lib/supabase*.ts, src/lib/db/). Antes de trabajar, leé DB_PENDING.md para ver cambios pendientes."
            delay 0.2
            key code 36
        end tell
    end tell

end tell
EOF

echo "✅ 4 terminales abiertas en 2x2"
echo "🗄️  Terminal 1 (top-left): DATABASE"
echo "🔵 Terminal 2 (top-right)"
echo "🟢 Terminal 3 (bottom-left)"
echo "🟣 Terminal 4 (bottom-right)"
