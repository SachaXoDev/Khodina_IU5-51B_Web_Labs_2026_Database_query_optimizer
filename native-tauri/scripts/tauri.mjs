import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { config } from '../src/config.js';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const [command, ...args] = process.argv.slice(2);
let env = process.env;
let options = args;

if (command === 'dev' || command === 'build') {
  const values = loadEnv(command === 'dev' ? 'development' : 'production', cwd, 'VITE_');
  try {
    const { apiOrigin, mediaOrigin } = config(values.VITE_API_URL, values.VITE_MEDIA_URL);
    env = { ...env, VITE_API_URL: apiOrigin, VITE_MEDIA_URL: mediaOrigin };
    const allow = [...new Set([
      `${apiOrigin}/api/indexes`, `${apiOrigin}/api/indexes/:id([0-9]+)`, `${apiOrigin}/api/indexes/clip-candidates`,
      `${apiOrigin}/media/*`, `${apiOrigin}/assets/*`, `${mediaOrigin}/media/*`, `${mediaOrigin}/assets/*`,
    ])].map((url) => ({ url }));
    options = ['--config', JSON.stringify({
      app: { security: { capabilities: [{
        identifier: 'guest-catalog',
        description: 'Only the bundled guest catalog window may load the configured LAN API and thumbnail paths.',
        windows: ['main'],
        permissions: [{ identifier: 'http:default', allow }],
      }] } },
    }), ...args];
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

const cli = spawn(process.execPath, [require.resolve('@tauri-apps/cli/tauri.js'), ...(command ? [command] : []), ...options], {
  cwd, env, stdio: 'inherit',
});
cli.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
cli.on('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1); });
