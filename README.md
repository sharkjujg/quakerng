# QuakeRNG

A daily earthquake discovery game: roll once per UTC day, draw one magnitude 6+ earthquake from the USGS catalog, and see which badges make it unusual. A sibling of CinemaRNG, BrickRNG and ExoRNG, built on the same engine from the RNGdle-style plans.

**This is a prototype with real data.** The earthquakes are a snapshot of the [USGS earthquake catalog](https://earthquake.usgs.gov) (public domain): every magnitude 6.0+ event since 1973 (`data/pool-v1.json`, rebuilt by `tools/build_pool.py`). A value the catalog lacks is unknown and never earns a badge. There is no backend, so results live in the player's browser. Unofficial fan project, not affiliated with the USGS. Each result is a real event, and some caused loss of life.

*Earthquake data courtesy of the U.S. Geological Survey.*

## What is built

| Area | Status |
| --- | --- |
| Daily roll, unbiased secure draw, one per UTC day, retry-safe | Done, browser-local (the day comes from the host's `Date` header, not the device clock) |
| 26 badge rules, families, RP = 100 / p, overall rarity tiers, tie rules | Done, tested in `rules.js` |
| Animated reveal (name reel, count-up, rarity pulse and burst), skippable, reduced-motion aware | Done |
| Hundreds to thousands of achievements derived from your rolls, with goals scaled to the pool size | Done (`achievements.js`) |
| Badge catalog, badge pages, levels, history, export, delete, pool page | Done |
| Sign-in, ranked limit, leaderboards, friends, hearts, poems, Discord, moderation | Needs a server |

## Run it

No build step.

```
python -m http.server 8765
```

Open <http://localhost:8765>. Open `/check.html` for the self-check; its title becomes `PASS` or `FAIL n`.

## Layout

- `engine.js` and `achievements.js` generic scoring, tiers, sampling, day helpers and achievements (shared with sibling RNG games)
- `rules.js` this game's badge rules; `site.js` its names, copy, art and shelves; `fixtures.js` rule fixtures for `check.html`
- `app.js`, `index.html`, `style.css` the site (hash routes, so it works on any static host)
- `data/pool-v1.json` the published pool; `tools/build_pool.py` rebuilds it from the USGS

## Publishing

GitHub Pages serves the repository root from `main`. Push to `main` to update the site.
