#!/usr/bin/env node
/**
 * Agent Watcher - Automatización de Multi-Agentes
 *
 * Observa STATUS.md y activa agentes automáticamente cuando:
 * - Tienen tarea asignada (⏳ Pendiente)
 * - No están bloqueados por otros agentes
 *
 * Feedback:
 * - Logs en consola
 * - Notificaciones de macOS
 * - Sonidos de sistema
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  statusFile: path.join(__dirname, '..', 'STATUS.md'),
  debounceMs: 1500,
  sounds: {
    activate: '/System/Library/Sounds/Pop.aiff',      // Agente activado
    complete: '/System/Library/Sounds/Glass.aiff',    // Agente completó
    allDone: '/System/Library/Sounds/Funk.aiff',      // Todos terminaron
    error: '/System/Library/Sounds/Basso.aiff'        // Error
  }
};

// Mapeo de agentes
const AGENTS = {
  'ORCHESTRATOR': { emoji: '🧠', session: '🧠 ORCHESTRATOR' },
  'UI': { emoji: '🎨', session: '🎨 UI' },
  'PAGES': { emoji: '📱', session: '📱 PAGES' },
  'ADMIN': { emoji: '🔧', session: '🔧 ADMIN' },
  'API': { emoji: '⚙️', session: '⚙️ API' },
  'SERVICES': { emoji: '🔌', session: '🔌 SERVICES' }
};

// Mensajes de activación
const ACTIVATION_MESSAGES = {
  'API': 'Hay tarea para vos en SPECS.md. Leelo, ejecutá tu tarea, y cuando termines actualizá STATUS.md a 🟢 Completado.',
  'UI': 'Tus dependencias están listas. Leé SPECS.md, revisá INTERFACES.md para endpoints disponibles, y ejecutá tu tarea.',
  'PAGES': 'API y UI terminaron. Leé SPECS.md, consultá INTERFACES.md, e integrá todo.',
  'ADMIN': 'Hay tarea para vos en SPECS.md. Leelo y ejecutá tu tarea.',
  'SERVICES': 'Hay tarea para vos en SPECS.md. Leelo y ejecutá tu tarea.'
};

// Estado interno
const state = {
  activatedAgents: new Set(),
  lastAgentStates: {},
  featureStartTime: null
};

// ============================================
// UTILIDADES DE FEEDBACK
// ============================================

function playSound(soundPath) {
  try {
    execSync(`afplay "${soundPath}" &`, { stdio: 'ignore' });
  } catch (error) {
    // Ignorar errores de sonido
  }
}

function notify(title, message, sound = true) {
  try {
    const script = `display notification "${message}" with title "${title}"`;
    execSync(`osascript -e '${script}'`);
    if (sound) {
      playSound(CONFIG.sounds.activate);
    }
  } catch (error) {
    console.error('Error enviando notificación:', error.message);
  }
}

function log(emoji, message) {
  const time = new Date().toLocaleTimeString('es-AR');
  console.log(`${time} ${emoji} ${message}`);
}

// ============================================
// PARSEO DE STATUS.md
// ============================================

function parseStatus(content) {
  const agents = {};
  const lines = content.split('\n');

  // Nombres de agentes a buscar
  const agentNames = ['ORCHESTRATOR', 'UI', 'PAGES', 'ADMIN', 'API', 'SERVICES'];
  const agentEmojis = {
    'ORCHESTRATOR': '🧠',
    'UI': '🎨',
    'PAGES': '📱',
    'ADMIN': '🔧',
    'API': '⚙️',
    'SERVICES': '🔌'
  };

  // Solo parsear la sección "Estado Actual"
  let inEstadoActual = false;
  let foundAgents = 0;

  for (const line of lines) {
    // Detectar inicio de sección "Estado Actual"
    if (line.includes('Estado Actual')) {
      inEstadoActual = true;
      continue;
    }

    // Detectar fin de sección (siguiente ##  o ---)
    if (inEstadoActual && (line.startsWith('## ') || (line.startsWith('---') && foundAgents > 0))) {
      break; // Salir, ya tenemos los datos
    }

    // Solo procesar si estamos en la sección correcta
    if (!inEstadoActual) continue;

    // Solo procesar líneas de tabla que empiezan con |
    if (!line.trim().startsWith('|')) continue;

    // Dividir por | y limpiar
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;

    // Buscar si la primera celda contiene un nombre de agente
    const firstCell = cells[0];
    let agentName = null;

    for (const name of agentNames) {
      if (firstCell.includes(name)) {
        agentName = name;
        break;
      }
    }

    if (!agentName) continue;

    // Solo tomar la primera ocurrencia de cada agente
    if (agents[agentName]) continue;

    // Extraer estado (segunda celda)
    const statusCell = cells[1];
    let statusEmoji = '🟡'; // default Idle

    if (statusCell.includes('🟢')) statusEmoji = '🟢';
    else if (statusCell.includes('🔴')) statusEmoji = '🔴';
    else if (statusCell.includes('🔵')) statusEmoji = '🔵';
    else if (statusCell.includes('⏳')) statusEmoji = '⏳';
    else if (statusCell.includes('🟡')) statusEmoji = '🟡';

    // Extraer bloqueadores (tercera celda)
    const blockedByCell = cells[2];
    let blockedBy = [];

    if (blockedByCell && blockedByCell !== '-') {
      // Buscar nombres de agentes en la celda de bloqueadores
      for (const name of agentNames) {
        if (blockedByCell.includes(name)) {
          blockedBy.push(name);
        }
      }
    }

    agents[agentName] = {
      emoji: agentEmojis[agentName],
      status: statusEmoji,
      blockedBy
    };

    foundAgents++;
  }

  return agents;
}

function getStatusText(emoji) {
  const statusMap = {
    '🟢': 'Completado',
    '🔴': 'Bloqueado',
    '🟡': 'Idle',
    '🔵': 'Trabajando',
    '⏳': 'Pendiente'
  };
  return statusMap[emoji] || 'Desconocido';
}

// ============================================
// LÓGICA DE ACTIVACIÓN
// ============================================

function isReadyToActivate(agentName, agents) {
  const agent = agents[agentName];
  if (!agent) return false;

  // Solo activar si está Pendiente (⏳)
  if (agent.status !== '⏳') return false;

  // No re-activar
  if (state.activatedAgents.has(agentName)) return false;

  // Verificar bloqueadores
  for (const blocker of agent.blockedBy) {
    const blockerAgent = agents[blocker];
    if (blockerAgent && blockerAgent.status !== '🟢') {
      return false;
    }
  }

  return true;
}

function sendToiTerm(agentName, message) {
  // Mapeo de agente a nombre de sesión iTerm2
  const searchTerms = {
    'ORCHESTRATOR': 'Spanish Greeting',
    'UI': 'UI/Design',
    'PAGES': 'Claude Code',
    'ADMIN': 'Admin',
    'API': 'API Agent',
    'SERVICES': 'Services Architecture'
  };

  const term = searchTerms[agentName] || agentName;

  // Simplificar mensaje para AppleScript
  const simpleMessage = message
    .replace(/'/g, '')
    .replace(/"/g, '')
    .replace(/\n/g, ' ')
    .substring(0, 200);

  // AppleScript para enviar mensaje a sesión iTerm2
  // Usamos write contents of file para evitar problemas con newline
  const timestamp = Date.now();
  const msgPath = `/tmp/iterm_msg_${timestamp}.txt`;
  fs.writeFileSync(msgPath, simpleMessage + '\n');

  const scriptPath = '/tmp/iterm_send.scpt';
  const script = `tell application "iTerm2"
  activate
  delay 0.3
  repeat with aWindow in windows
    repeat with aTab in tabs of aWindow
      repeat with aSession in sessions of aTab
        if name of aSession contains "${term}" then
          tell aSession
            select
          end tell
          delay 0.2
          tell aSession
            write contents of file "${msgPath}"
          end tell
          return "OK"
        end if
      end repeat
    end repeat
  end repeat
  return "NOT_FOUND"
end tell`;

  try {
    fs.writeFileSync(scriptPath, script);
    const result = execSync(`osascript ${scriptPath}`, { encoding: 'utf8' });
    return result.trim() === 'OK';
  } catch (error) {
    log('⚠️', `Error ejecutando AppleScript: ${error.message}`);
    return false;
  }
}

// ============================================
// PROCESAMIENTO PRINCIPAL
// ============================================

function processStatusChange() {
  try {
    const content = fs.readFileSync(CONFIG.statusFile, 'utf8');
    const agents = parseStatus(content);

    // Mostrar estado actual
    console.log('\n' + '─'.repeat(50));
    log('📊', 'Estado actual:');

    let workingCount = 0;
    let pendingCount = 0;
    let completedCount = 0;

    for (const [name, data] of Object.entries(agents)) {
      if (name === 'ORCHESTRATOR') continue; // Skip orchestrator

      const statusText = getStatusText(data.status);
      const blockedText = data.blockedBy.length ? ` (bloqueado por: ${data.blockedBy.join(', ')})` : '';
      console.log(`       ${data.emoji} ${name}: ${data.status} ${statusText}${blockedText}`);

      if (data.status === '🔵') workingCount++;
      if (data.status === '⏳') pendingCount++;
      if (data.status === '🟢') completedCount++;
    }

    // Iniciar timer si hay trabajo pendiente
    if ((workingCount > 0 || pendingCount > 0) && !state.featureStartTime) {
      state.featureStartTime = Date.now();
    }

    // Detectar cambios de estado (para notificar completados)
    for (const [name, data] of Object.entries(agents)) {
      const prevStatus = state.lastAgentStates[name];

      // Agente pasó a Completado
      if (prevStatus && prevStatus !== '🟢' && data.status === '🟢') {
        log('✅', `${data.emoji} ${name} completó su tarea`);
        notify(`✅ ${name} Completado`, 'Tarea finalizada', false);
        playSound(CONFIG.sounds.complete);
      }

      // Agente pasó a Trabajando
      if (prevStatus && prevStatus !== '🔵' && data.status === '🔵') {
        log('🔵', `${data.emoji} ${name} está trabajando`);
      }

      state.lastAgentStates[name] = data.status;
    }

    // Activar agentes listos
    for (const agentName of Object.keys(AGENTS)) {
      if (agentName === 'ORCHESTRATOR') continue;

      if (isReadyToActivate(agentName, agents)) {
        const agent = AGENTS[agentName];
        log('🚀', `Activando ${agent.emoji} ${agentName}...`);

        const message = ACTIVATION_MESSAGES[agentName];

        if (sendToiTerm(agentName, message)) {
          state.activatedAgents.add(agentName);
          log('✅', `${agent.emoji} ${agentName} activado`);
          notify(`🚀 ${agentName} Activado`, 'Empezando a trabajar...');
        } else {
          log('❌', `No se pudo activar ${agentName} - sesión no encontrada`);
          playSound(CONFIG.sounds.error);
        }
      }
    }

    // Verificar si todos completaron
    const activeAgents = Object.entries(agents)
      .filter(([name, a]) => name !== 'ORCHESTRATOR' && a.status !== '🟡');

    const allDone = activeAgents.length > 0 &&
      activeAgents.every(([, a]) => a.status === '🟢');

    if (allDone && state.activatedAgents.size > 0) {
      const elapsed = state.featureStartTime
        ? Math.round((Date.now() - state.featureStartTime) / 1000 / 60)
        : '?';

      console.log('\n' + '═'.repeat(50));
      log('🎉', `¡TODOS LOS AGENTES COMPLETARON!`);
      log('⏱️', `Tiempo total: ~${elapsed} minutos`);
      console.log('═'.repeat(50) + '\n');

      notify('🎉 Feature Completa', `Todos los agentes terminaron en ~${elapsed}min`, false);
      playSound(CONFIG.sounds.allDone);

      // Reset state para próxima feature
      state.activatedAgents.clear();
      state.featureStartTime = null;
    }

  } catch (error) {
    log('❌', `Error: ${error.message}`);
    playSound(CONFIG.sounds.error);
  }
}

// ============================================
// INICIO
// ============================================

// Verificar que existe STATUS.md
if (!fs.existsSync(CONFIG.statusFile)) {
  console.error(`❌ No existe ${CONFIG.statusFile}`);
  console.error('   Asegurate de estar en el directorio correcto del proyecto.');
  process.exit(1);
}

// Banner de inicio
console.log('');
console.log('╔════════════════════════════════════════════════════╗');
console.log('║         🤖 AGENT WATCHER - Multi-Agent System      ║');
console.log('╠════════════════════════════════════════════════════╣');
console.log('║  Observando: STATUS.md                             ║');
console.log('║  Notificaciones: ✅ Activadas                      ║');
console.log('║  Sonidos: ✅ Activados                             ║');
console.log('║                                                    ║');
console.log('║  Ctrl+C para detener                               ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('');

// Sonido de inicio
playSound(CONFIG.sounds.activate);
notify('🤖 Watcher Iniciado', 'Observando STATUS.md...', false);

// Polling en lugar de fs.watch (más confiable en macOS)
let lastModified = 0;
const POLL_INTERVAL = 2000; // 2 segundos

function checkForChanges() {
  try {
    const stats = fs.statSync(CONFIG.statusFile);
    const currentModified = stats.mtimeMs;

    if (lastModified > 0 && currentModified !== lastModified) {
      log('📝', 'STATUS.md modificado');
      processStatusChange();
    }

    lastModified = currentModified;
  } catch (error) {
    log('⚠️', `Error verificando archivo: ${error.message}`);
  }
}

// Iniciar polling
setInterval(checkForChanges, POLL_INTERVAL);

// Procesar estado inicial
processStatusChange();
lastModified = fs.statSync(CONFIG.statusFile).mtimeMs;

// Mantener vivo
process.on('SIGINT', () => {
  console.log('\n');
  log('👋', 'Watcher detenido');
  playSound(CONFIG.sounds.complete);
  process.exit(0);
});
