#!/usr/bin/env node

// Custom start script for Railway deployment
const { spawn } = require('child_process');

const PORT = process.env.PORT || 8080;
const HOSTNAME = '0.0.0.0';

console.log(`🚀 Starting Next.js server on ${HOSTNAME}:${PORT}`);
console.log(`📋 Environment: ${process.env.NODE_ENV}`);

const nextStart = spawn('npx', ['next', 'start', '-H', HOSTNAME, '-p', PORT.toString()], {
  stdio: 'inherit',
  env: { ...process.env, PORT: PORT.toString() }
});

nextStart.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

nextStart.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code || 0);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, gracefully shutting down...');
  nextStart.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, gracefully shutting down...');
  nextStart.kill('SIGINT');
});
