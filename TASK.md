# TASK — Build the Ganesh Nimajjanam Hyderabad 2026 website

You are the Tech Lead. `/workspace` is a git repo already cloned, already containing a seed commit.
Read this whole file before writing any code.

## Context

`/workspace/data/facts.json` is a **verified, source-attributed fact base** about the Ganesh
Nimajjanam (idol immersion) in Hyderabad on **Friday, 25 September 2026**. It was compiled from
The Hindu, Deccan Chronicle, Gulte, Siasat, Sakshi Post, The Hans India, Hyderabad Mail,
PTI/NewsDrum and the Bhagyanagar Ganesh Utsav Samithi, plus the Telangana High Court orders of
2021 and 2023. Every fact carries a `sources` array of keys into `source_index`.

**Do not invent, "improve", soften or add facts.** The JSON is the authority. If something is
missing, leave it out. Do not add dates, numbers, quotes, phone numbers, traffic-diversion
details or helpline numbers that are not in the JSON. Fabricated specifics on a page people
read before travelling to a lake are worse than a shorter page.

`README.md` describes the intended structure. It is the target.

## Deliverable

A single-page, **dependency-free** static site (vanilla HTML/CSS/JS — no framework, no CDN,
no Tailwind, no build-time npm packages) plus its test suite and CI.

Required files:

```
index.html
assets/styles.css
assets/app.js
data/facts.json          (already present — do not change its content)
tests/facts.test.mjs
tests/page.test.mjs
package.json
scripts/build.mjs
scripts/serve.mjs
.github/workflows/ci.yml
.gitignore
README.md                (already present — only update if the structure changed)
```

## index.html requirements

- Single page, semantic landmarks (`header`, `main`, `section`, `footer`), all content in English.
- Sections, in order:
  1. **Hero** — title "Ganesh Nimajjanam Hyderabad 2026", the immersion date **Friday, 25
     September 2026**, the tithi (Anant Chaturdashi), and a live countdown to the immersion
     muhurat / date driven by `assets/app.js`.
  2. **Key facts** — a grid rendered from `meta` + the high-signal `key_facts` entries
     (immersion date, installation date, muhurat, immersion points, height cap, police
     deployment, scale).
  3. **Shobha Yatra route** — an ordered list from `route`, with each stop's `note`.
  4. **Rules** — a clearly separated block covering, in this order of prominence:
     - Tank Bund road-side immersion is **banned** (railing + banners, HC order).
     - **PoP idols** may not enter Hussain Sagar or any natural water body — baby ponds only.
     - Approved Hussain Sagar points: NTR Marg, Necklace Road, People's Plaza.
     - 16 ft height cap.
     - Recommended: eco-friendly clay idols.
  5. **Getting around** — transport, road-works freeze, and what to avoid.
  6. **Sources** — every entry of `source_index` as a real `<a href>` with outlet and title.
  7. **Footer** — "Facts compiled 19 September 2026", a visible note that rules change by
     official order and the muhurat should be confirmed with a purohit, and the repo link.

- The page must **fetch `data/facts.json` at runtime** and render the fact/route/source sections
  from it (`assets/app.js`), so the JSON stays the single source of truth. Provide a `<noscript>`
  fallback that states the immersion date and links to the sources.
- No inline event handlers; use `addEventListener`.
- Accessibility: one `<h1>`, `lang="en"`, skip-to-content link, `aria-label`s on nav landmarks,
  visible focus styles, and text contrast that passes WCAG AA. Respect
  `@media (prefers-reduced-motion: reduce)` — the countdown must not animate under it, and
  `@media (prefers-color-scheme: light)` should give a readable light theme.
- Must work when opened over `file://` OR when served — if `fetch` of the JSON fails, show a
  clear inline error, not a blank page.

## scripts/build.mjs

Copy `index.html`, `assets/**`, and `data/**` into `dist/`, preserving structure. Print a summary
of files written. Exit non-zero if any source file is missing. No dependencies beyond `node:fs`,
`node:path`, `node:url`.

## scripts/serve.mjs

Tiny static server on `PORT` (default 8080) using `node:http` only. Correct `Content-Type` for
`.html`, `.css`, `.js`, `.json`, `.svg`. Path traversal must be rejected (403). Log each request.

## package.json

```json
{
  "name": "ganesh-nimajjanam-hyderabad",
  "type": "module",
  "private": true,
  "scripts": { "build": "node scripts/build.mjs", "serve": "node scripts/serve.mjs", "test": "node --test tests/" }
}
```
`name`, `type`, `private` exactly as above; keep `scripts` exactly as above (the `test` script
must run the suite with no extra flags). You may add `description`, `license`, `engines`.

## tests — must be real assertions, not smoke tests

`tests/facts.test.mjs` (import facts.json with `assert` on structure):
- `meta.immersion_date` is exactly `2026-09-25`, and that value is a **Friday**.
- `meta.festival_start` is exactly `2026-09-14` (a Monday).
- Every entry in `key_facts` has a non-empty `id`, `label`, `value`, `detail` and a `sources`
  array of at least one key.
- Every key in every `sources` array **exists** in `source_index` (no dangling references).
- Every `source_index` entry has a non-empty `title`, `outlet` and an `url` starting `https://`.
- `route` is non-empty, `order` values are 1..n contiguous and ascending, every stop has a
  non-empty `place`.
- `key_facts` ids are unique; `source_index` keys are unique by construction but assert the
  count matches the number of distinct keys used.

`tests/page.test.mjs` (read `index.html` and `assets/app.js` as text):
- `index.html` contains the string `2026-09-25` OR `25 September 2026` (the date must be
  discoverable without JS).
- `index.html` references `assets/styles.css` and `assets/app.js`.
- `index.html` links to every URL present in `source_index` (assert each URL string appears).
- `index.html` contains no `onclick=`/`onload=` inline handlers.
- `index.html` has exactly one `<h1`.
- `app.js` contains no `eval(`.
- The rules that matter are stated in the HTML text: `Tank Bund`, `Plaster of Paris` or `PoP`,
  `16 feet` or `16 ft`, `NTR Marg`, `Necklace Road`, `People's Plaza`.
- Run `build.mjs` into a temp dir and assert `dist/index.html`, `dist/assets/app.js`,
  `dist/assets/styles.css`, `dist/data/facts.json` all exist.

Every test must pass. Run `npm test` and paste the real output in your final report.

## CI

`.github/workflows/ci.yml` — on push and PR to `main`, Node 20, `npm test` then `npm run build`.
**NO PAGES / NO PUBLIC PUBLISHING.** This repository is PRIVATE and must stay private. Do NOT
create `pages.yml`, do NOT enable GitHub Pages, and do NOT add any deploy/publish/upload workflow.
`.github/workflows/ci.yml` (tests + build only) is the ONLY workflow permitted.

## .gitignore

`node_modules/`, `dist/`, `.DS_Store`, `*.log`.

## Definition of done — you must do all of these

1. All files above exist and `npm test` passes with real output.
2. `npm run build` succeeds and produces `dist/`.
3. Commit to `main` with a conventional message.
4. **Push to `origin main`.** The remote URL already contains a working token — do not change it,
   do not print it, do not add a new remote.
5. Verify the push landed: run `git log --oneline -3` AND
   `git status -sb` (must show `## main...origin/main` with no ahead/behind), and
   `git ls-remote origin -h refs/heads/main` — the SHA must equal your local `HEAD`.

In your final message report: files created, the real `npm test` output, the `HEAD` SHA, and
confirmation the push is visible from `git ls-remote`. If the push failed, say so plainly and
report the exact error — do not claim success.
