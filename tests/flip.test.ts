// Proves the launch-day flip is green: LAUNCH_STATE = 'released' plus an App Store id is "the whole launch change"
// (launch-state.mjs), and site.yml runs `npm test` before it deploys. This copies the repo to a scratch clone, makes
// exactly that edit there, and runs the whole suite (build included) in it. The flip PR itself skips this test.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { LAUNCH_STATE } from '../src/lib/launch-state.mjs';

const ROOT = join(import.meta.dirname, '..');
const FAKE_ID = '1234567890';
const WORKING_TREE = ['src', 'tests', 'public', 'docs', 'astro.config.mjs', 'package.json', 'package-lock.json', 'tsconfig.json', 'vitest.config.ts'];
const scratch: string[] = [];

const run = (cwd: string, command: string, args: string[], env = process.env) =>
  spawnSync(command, args, { cwd, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// A real clone (the build dates pages from git history), then the working tree over it, so uncommitted edits count.
function flippedClone() {
  const parent = mkdtempSync(join(tmpdir(), 'taxfold-flip-'));
  scratch.push(parent);
  const repo = join(parent, 'repo');
  const clone = run(parent, 'git', ['clone', '--quiet', '--no-hardlinks', ROOT, repo]);
  expect(clone.status, clone.stderr).toBe(0);
  for (const entry of WORKING_TREE) cpSync(join(ROOT, entry), join(repo, entry), { recursive: true, force: true });
  symlinkSync(join(ROOT, 'node_modules'), join(repo, 'node_modules'));

  const file = join(repo, 'src/lib/launch-state.mjs');
  const source = readFileSync(file, 'utf8');
  const flipped = source
    .replace("export const LAUNCH_STATE = 'pre-beta';", "export const LAUNCH_STATE = 'released';")
    .replace("export const APP_STORE_ID = '';", `export const APP_STORE_ID = '${FAKE_ID}';`);
  expect(flipped, 'both constants must have been edited').not.toBe(source);
  expect(flipped).toContain("LAUNCH_STATE = 'released'");
  expect(flipped).toContain(`APP_STORE_ID = '${FAKE_ID}'`);
  writeFileSync(file, flipped);
  return repo;
}

afterAll(() => scratch.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe.skipIf(LAUNCH_STATE !== 'pre-beta')('the launch-day flip', () => {
  it('leaves `npm test` green: build, then every suite, against the flipped constants', () => {
    const repo = flippedClone();
    const env = { ...process.env, NO_COLOR: '1' };
    for (const key of Object.keys(env)) if (key === 'VITEST' || key.startsWith('VITEST_') || key.startsWith('TAXFOLD_') || key === 'FORCE_COLOR') delete env[key];
    const result = run(repo, 'npm', ['test'], env);
    const output = `${result.stdout}\n${result.stderr}`.replace(/\x1b\[[0-9;]*m/g, '');
    expect(existsSync(join(repo, 'dist/app-store-badge-black.svg')), 'the build rendered the released state').toBe(true);
    expect(readFileSync(join(repo, 'dist/index.html'), 'utf8')).toContain('class="store-badge"');
    expect(output, output.slice(-4000)).toMatch(/Tests\s+\d+ passed/);
    expect(output).not.toMatch(/Tests\s+\d+ failed/);
    expect(result.status, output.slice(-4000)).toBe(0);
  }, 300_000);
});
