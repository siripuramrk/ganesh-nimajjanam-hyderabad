#!/usr/bin/env node
/*
 * Static build: copy index.html, assets/** and data/** into dist/, preserving structure.
 * No dependencies beyond node:fs, node:path, node:url.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, '..');

// Every one of these must exist or the build fails loudly.
const REQUIRED = ['index.html', 'assets/styles.css', 'assets/app.js', 'data/facts.json'];
// Trees copied wholesale into dist/.
const TREES = ['assets', 'data'];

/** Recursively list files under `dir`, relative to `dir`. */
function listFiles(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
}

/**
 * Run the build.
 * @param {{outDir?: string, cwd?: string, log?: (msg: string) => void}} [options]
 * @returns {{outDir: string, files: string[], bytes: number}}
 */
export function build(options = {}) {
  const cwd = resolve(options.cwd || PROJECT_ROOT);
  const outDir = resolve(options.outDir || join(cwd, 'dist'));
  const log = options.log || ((msg) => console.log(msg));

  // 1. Fail fast if anything required is missing.
  const missing = REQUIRED.filter((rel) => !existsSync(join(cwd, rel)));
  if (missing.length > 0) {
    throw new Error(
      `build: missing required source file(s): ${missing.join(', ')} (looked under ${cwd})`,
    );
  }

  // 2. Clear dist/ so stale artefacts never survive a build.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const written = [];

  // 3. index.html
  const indexSrc = join(cwd, 'index.html');
  cpSync(indexSrc, join(outDir, 'index.html'));
  written.push('index.html');

  // 4. assets/** and data/**
  for (const tree of TREES) {
    const srcRoot = join(cwd, tree);
    if (!existsSync(srcRoot)) continue;
    for (const file of listFiles(srcRoot)) {
      const rel = relative(cwd, file).split(sep).join('/');
      const dest = join(outDir, rel);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(file, dest);
      written.push(rel);
    }
  }

  written.sort();

  const bytes = written.reduce((total, rel) => {
    const info = statSync(join(outDir, rel));
    return total + info.size;
  }, 0);

  log(`build: wrote ${written.length} file(s) to ${relative(cwd, outDir) || outDir}`);
  for (const rel of written) {
    const size = statSync(join(outDir, rel)).size;
    log(`  ${rel}  (${size} bytes)`);
  }
  log(`build: total ${bytes} bytes`);

  return { outDir, files: written, bytes };
}

function isEntryPoint() {
  if (!process.argv[1]) return false;
  return resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
}

if (isEntryPoint()) {
  try {
    build({ outDir: process.argv[2] });
  } catch (error) {
    console.error(`build: FAILED — ${error.message}`);
    process.exitCode = 1;
  }
}
