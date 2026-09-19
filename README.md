# Ganesh Nimajjanam Hyderabad 2026

A single-page, dependency-free information site for the **Ganesh Nimajjanam (Anant Chaturdashi) immersion in Hyderabad on Friday, 25 September 2026**: verified dates, the 19 km Shobha Yatra route, designated immersion points, the Tank Bund and PoP rules, muhurat timings and travel advisories.

**Live:** https://siripuramrk.github.io/ganesh-nimajjanam-hyderabad/

## Why this exists

Every year the same questions flood WhatsApp on immersion day: *Is Tank Bund allowed this year? Where do PoP idols go? What is the muhurat? Which route is closed?* The answers are scattered across a dozen news reports and a High Court order. This site puts the verified answer to each of them on one page, with sources attached.

## Contents

| File | Purpose |
|---|---|
| `index.html` | The page. Semantic sections, no framework. |
| `assets/styles.css` | Styling. Dark theme, marigold accent, responsive. |
| `assets/app.js` | Countdown to immersion, section navigation, source rendering. |
| `data/facts.json` | Every fact as structured data, each with its source keys. Single source of truth for the page. |
| `tests/` | Test suite validating the data and the page. |
| `scripts/build.mjs` | Static build to `dist/`. |
| `.github/workflows/` | CI (tests) and GitHub Pages deployment. |

## Development

```bash
npm test        # validate facts + page integrity
npm run build   # emit dist/
npm run serve   # preview at http://localhost:8080
```

No runtime dependencies. Node 20+ required for the dev scripts.

## Accuracy and sourcing

Facts were compiled on **19 September 2026** from The Hindu, Deccan Chronicle, Gulte, Siasat Daily, Sakshi Post, The Hans India, Hyderabad Mail, PTI via NewsDrum and Bhagyanagar Ganesh Utsav Samithi announcements, plus reporting on the Telangana High Court orders of 2021 and 2023. Every entry in `data/facts.json` carries the keys of its sources, listed in `source_index`.

Two things to treat with care:

- **The muhurat** (10:55–13:18) is an astrologically computed window, not an official schedule. For a family immersion, confirm with your purohit.
- **Rules change by order.** The Tank Bund ban, the PoP ban and the 16-foot height cap are administrative and judicial decisions that have been revised between years. Always follow the signs posted on the day.

Corrections are welcome via issue or PR. Once the 2026 immersion is past, this site is historical rather than current, and the header should say so rather than quietly mislead.

## License

Content is factual; quote freely with attribution to the original outlets, which are linked on the page.
