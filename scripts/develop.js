const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const nodeMajorVersion = Number(process.versions.node.split('.')[0]);

if (nodeMajorVersion !== 20) {
  const nvmVersionsPath = path.join(os.homedir(), '.nvm', 'versions', 'node');
  const node20Version = fs.existsSync(nvmVersionsPath)
    ? fs.readdirSync(nvmVersionsPath)
      .filter((version) => version.startsWith('v20.'))
      .sort((first, second) => second.localeCompare(first, undefined, { numeric: true }))[0]
    : null;

  if (node20Version) {
    const node20Bin = path.join(nvmVersionsPath, node20Version, 'bin');
    const node20Executable = path.join(node20Bin, 'node');
    console.log(`Switching The Inkcaster to Node ${node20Version.slice(1)}...`);
    const child = spawn(node20Executable, [__filename], {
      stdio: 'inherit',
      env: { ...process.env, PATH: `${node20Bin}${path.delimiter}${process.env.PATH || ''}` },
    });
    child.on('exit', (code, signal) => {
      process.exitCode = code ?? (signal ? 1 : 0);
    });
  } else {
    console.error(`The Inkcaster requires Node 20 for local development. Current version: ${process.version}`);
    console.error('Install Node 20 with "nvm install 20", then try "npm run develop" again.');
    process.exitCode = 1;
  }

  return;
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
