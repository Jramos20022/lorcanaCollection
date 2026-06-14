const { spawn } = require('child_process');
const path = require('path');

const nodeMajorVersion = Number(process.versions.node.split('.')[0]);

if (nodeMajorVersion !== 20) {
  console.error(`The Inkcaster requires Node 20 for local development. Current version: ${process.version}`);
  console.error('Run "nvm use 20" and then try "npm run develop" again.');
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  spawn(npmCommand, ['run', 'watch'], {
    cwd: path.join(projectRoot, 'server'),
    stdio: 'inherit',
  }),
  spawn(npmCommand, ['run', 'dev'], {
    cwd: path.join(projectRoot, 'client'),
    stdio: 'inherit',
  }),
];

let shuttingDown = false;

const stopAll = (signal = 'SIGTERM') => {
  if (shuttingDown) return;
  shuttingDown = true;

  processes.forEach((childProcess) => {
    if (!childProcess.killed) childProcess.kill(signal);
  });
};

processes.forEach((childProcess) => {
  childProcess.on('error', (error) => {
    console.error(`Unable to start development process: ${error.message}`);
    stopAll();
    process.exitCode = 1;
  });

  childProcess.on('exit', (code, signal) => {
    if (shuttingDown) return;

    stopAll();
    process.exitCode = code ?? (signal ? 1 : 0);
  });
});

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));
