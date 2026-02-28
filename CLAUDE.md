# Stack Builder

- **Type:** Interactive web tool
- **Stack:** Vanilla JS/CSS/HTML (no build step)
- **Live:** https://nootroblog.com/stack-builder/

## What This Is

Nootropic stack designer. 45+ compounds with interaction detection (synergy/caution), cost estimates, dosing info, and shareable URLs.

## Features

- Search + category filter (racetams, adaptogens, choline, aminos, herbs, vitamins, peptides)
- Interaction matrix (39 interactions)
- Stack summary: pills/day, monthly cost, benefit coverage, balance score
- URL sharing via `?s=` parameter
- Embed mode via `?embed=1` (iframe generator)
- Hover tooltips (mechanism, half-life, cost)

## Structure

- `index.html` — page structure
- `style.css` — dark theme styling
- `app.js` — state management, URL encoding, modals
- `data.js` — 45 compounds + 39 interactions database

## Deployment

Zero build step. Netlify, Vercel, or Cloudflare Pages.
