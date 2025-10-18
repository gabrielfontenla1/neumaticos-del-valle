#!/usr/bin/env node

const { exec } = require('child_process');
const port = process.argv[2] || 6001;

console.log(`🧹 Limpiando puerto ${port}...`);

// Para macOS y Linux
const killCommand = process.platform === 'win32'
  ? `netstat -ano | findstr :${port} | findstr LISTENING`
  : `lsof -ti:${port}`;

exec(killCommand, (error, stdout, stderr) => {
  if (error) {
    console.log(`✅ Puerto ${port} está libre`);
    process.exit(0);
  }

  if (stdout) {
    const pids = stdout.trim().split('\n');

    pids.forEach(pid => {
      if (pid) {
        const kill = process.platform === 'win32'
          ? `taskkill /PID ${pid} /F`
          : `kill -9 ${pid}`;

        exec(kill, (err) => {
          if (!err) {
            console.log(`✅ Proceso ${pid} terminado en puerto ${port}`);
          }
        });
      }
    });

    setTimeout(() => {
      console.log(`✅ Puerto ${port} limpiado exitosamente`);
      process.exit(0);
    }, 500);
  } else {
    console.log(`✅ Puerto ${port} está libre`);
    process.exit(0);
  }
});