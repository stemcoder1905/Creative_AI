const { spawn } = require('child_process');
const path = require('path');

const studioDir = 'D:\\Creative_AI\\studio';
console.log('Starting Next.js dev server in:', studioDir);

const child = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
  cwd: studioDir,
  detached: true,
  stdio: 'ignore'
});

child.unref();
console.log('Next.js dev server launched successfully!');
