import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from '../scripts/build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const appJs = readFileSync(join(ROOT, 'assets', 'app.js'), 'utf8');
const facts = JSON.parse(readFileSync(join(ROOT, 'data', 'facts.json'), 'utf8'));

test('index.html states the immersion date without needing JavaScript', () => {
  assert.ok(
    html.includes('2026-09-25') || html.includes('25 September 2026'),
    'index.html must contain "2026-09-25" or "25 September 2026"',
  );
});

test('index.html references the stylesheet and the script', () => {
  assert.ok(html.includes('assets/styles.css'), 'index.html must reference assets/styles.css');
  assert.ok(html.includes('assets/app.js'), 'index.html must reference assets/app.js');
});

test('index.html links to every URL in source_index', () => {
  for (const [key, entry] of Object.entries(facts.source_index)) {
    assert.ok(
      html.includes(entry.url),
      `index.html is missing the URL for source "${key}": ${entry.url}`,
    );
  }
});

test('index.html contains no inline event handlers', () => {
  const inlineHandler = /\son(click|load|error|mouseover|submit|change|input|focus|blur)\s*=/i;
  assert.ok(!inlineHandler.test(html), 'found an inline on* handler in index.html');
});

test('index.html has exactly one h1', () => {
  const openings = html.match(/<h1[\s>]/gi) || [];
  const closings = html.match(/<\/h1>/gi) || [];
  assert.equal(openings.length, 1, `expected exactly one <h1>, found ${openings.length}`);
  assert.equal(closings.length, 1, `expected exactly one </h1>, found ${closings.length}`);
});

test('app.js contains no eval(', () => {
  assert.ok(!appJs.includes('eval('), 'app.js must not use eval()');
});

test('the rules that matter are stated in the HTML text', () => {
  const required = [
    ['Tank Bund', /Tank Bund/],
    ['Plaster of Paris or PoP', /Plaster of Paris|PoP/],
    ['16 feet or 16 ft', /16 feet|16 ft/],
    ['NTR Marg', /NTR Marg/],
    ['Necklace Road', /Necklace Road/],
    ["People's Plaza", /People(&rsquo;|'|&#8217;)?s Plaza/],
  ];
  for (const [label, pattern] of required) {
    assert.ok(pattern.test(html), `index.html does not state the rule for: ${label}`);
  }
});

test('build.mjs emits a complete dist/', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'gnh-build-'));
  const outDir = join(tempRoot, 'dist');
  try {
    const result = build({ outDir, log: () => {} });
    assert.ok(Array.isArray(result.files) && result.files.length > 0, 'build wrote no files');

    for (const rel of ['index.html', 'assets/app.js', 'assets/styles.css', 'data/facts.json']) {
      assert.ok(existsSync(join(outDir, rel)), `dist/${rel} was not produced`);
    }

    // The build must be byte-faithful for the data file the page fetches at runtime.
    const copied = readFileSync(join(outDir, 'data', 'facts.json'), 'utf8');
    assert.equal(copied, readFileSync(join(ROOT, 'data', 'facts.json'), 'utf8'));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
