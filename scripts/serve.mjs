#!/usr/bin/env node
/*
 * Tiny static file server. node:http only — no dependencies.
 * Usage: node scripts/serve.mjs   (PORT env var, default 8080)
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

/** Content-Type for a file path, defaulting to a byte stream. */
export function contentTypeFor(pathname) {
  return CONTENT_TYPES[extname(pathname).toLowerCase()] || 'application/octet-stream';
}

/**
 * Resolve a request path to a file inside `root`.
 * Returns null when the path is a traversal attempt or otherwise unsafe.
 */
export function resolveSafePath(root, requestPath) {
  const rootAbs = resolve(root);
  let decoded;
  try {
    decoded = decodeURIComponent(String(requestPath).split('?')[0].split('#')[0]);
  } catch {
    return null; // malformed percent-encoding
  }

  if (decoded.includes('\0')) return null;

  // Any `..` segment, raw or percent-encoded, is a traversal attempt.
  const segments = decoded.split(/[\\/]+/);
  if (segments.includes('..')) return null;

  const candidate = resolve(join(rootAbs, decoded));

  // Belt and braces: the resolved path must stay inside the root.
  if (candidate !== rootAbs && !candidate.startsWith(rootAbs + sep)) return null;

  return candidate;
}

/**
 * @param {string} [root] directory to serve
 * @param {{log?: (line: string) => void}} [options]
 */
export function createStaticServer(root = PROJECT_ROOT, options = {}) {
  const servedRoot = resolve(root);
  const log = options.log || ((line) => console.log(line));

  return createServer((req, res) => {
    const started = Date.now();
    const method = req.method || 'GET';

    let logged = false;
    const finish = (status) => {
      if (logged) return;
      logged = true;
      log(`${method} ${req.url} -> ${status} (${Date.now() - started}ms)`);
    };

    // `res` close is the one signal that always fires — for error responses, and for
    // streamed responses where the client closes as soon as Content-Length is satisfied
    // (the source stream is destroyed then, so its own 'end' may never fire).
    res.on('close', () => finish(res.statusCode || 200));

    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
      res.end('Method Not Allowed');
      finish(405);
      return;
    }

    const target = resolveSafePath(servedRoot, req.url || '/');

    if (target === null) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      finish(403);
      return;
    }

    let file = target;
    if (existsSync(file) && statSync(file).isDirectory()) {
      file = join(file, 'index.html');
    }

    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      finish(404);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentTypeFor(file),
      'Content-Length': statSync(file).size,
      'Cache-Control': 'no-cache',
    });

    if (method === 'HEAD') {
      res.end();
      finish(200);
      return;
    }

    // A read error destroys the response before writing starts, so report 500 rather
    // than letting the close handler below see an unfinished response.
    const stream = createReadStream(file);
    stream.on('error', () => {
      res.destroy();
      finish(500);
    });
    stream.pipe(res);
  });
}

function isEntryPoint() {
  if (!process.argv[1]) return false;
  return resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
}

if (isEntryPoint()) {
  const port = Number.parseInt(process.env.PORT || '8080', 10);
  const server = createStaticServer(PROJECT_ROOT);
  server.listen(port, () => {
    console.log(`serve: http://localhost:${port}/ (root: ${PROJECT_ROOT})`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      // Close without forcing exit so pending stdout (request logs) flushes.
      server.close(() => {
        process.exitCode = 0;
      });
    });
  }
}
