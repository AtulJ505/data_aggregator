import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import Redis from 'ioredis';

// Use a dedicated disposable Redis database for this integration test.
if (!process.env.REDIS_URL) throw new Error('Set REDIS_URL to a disposable test Redis database');
const port = process.env.PORT || '13000';
const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
let output = '';
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['start'], {
  env: { ...process.env, PORT: port },
  detached: process.platform !== 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.stdout.on('data', data => { output += data; });
child.stderr.on('data', data => { output += data; });
try {
  await redis.del('aggregated_tokens');
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (child.exitCode !== null) throw new Error(`Production process exited: ${output}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/tokens`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), []);
      ready = true;
      break;
    } catch { await delay(100); }
  }
  assert.ok(ready, `Production API did not become ready: ${output}`);
  const fixture = [{ address: 'smoke-test-token', price: 1.25 }];
  await redis.set('aggregated_tokens', JSON.stringify(fixture), 'EX', 30);
  const response = await fetch(`http://127.0.0.1:${port}/api/tokens`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), fixture);
  console.log('Production npm start, empty cache, and Redis-backed REST response passed.');
} finally {
  if (child.pid && child.exitCode === null) {
    if (process.platform === 'win32') child.kill();
    else process.kill(-child.pid, 'SIGTERM');
  }
  await redis.del('aggregated_tokens');
  await redis.quit();
}
