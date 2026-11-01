// Everything specific to QuakeRNG: names, copy, card art, and which facts the result card shows. app.js is generic.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => n.toLocaleString('en');
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const band = (x, cuts) => cuts.find(([max]) => x < max)[1];
const unknown = 'not in the catalog';
const usgs = (u) => (typeof u === 'string' && u.startsWith('https://earthquake.usgs.gov/') ? u : null);
const when = (m) => `${m.time.slice(0, 10)} ${m.time.slice(11, 16)} UTC`;

export default {
  key: 'quakerng',
  name: 'QuakeRNG',
  pageTitle: 'QuakeRNG: a daily earthquake discovery game',
  noun: 'earthquake', nouns: 'earthquakes', thing: 'Earthquake',
  worldNote: 'every earthquake that has ever happened',
  repo: 'https://github.com/sharkjujg/quakerng',
  headline: 'Discover an earthquake. Once a day.',
  intro: (n) => `Roll once to draw one earthquake of magnitude 6 or more from a pool of <b>${fmt(n)}</b> recorded since 1973. Every one has the same 1-in-${fmt(n)} chance, famous or forgotten. Badges explain what is unusual about it, and rarer badges earn more rarity points (RP). The daily limit resets at 00:00 UTC.`,
  notice: 'Prototype: the earthquakes are real (USGS catalog), but there are no accounts yet and your results are saved only in this browser. Each result is a record of a real event; some caused loss of life, so please treat it with care. <a href="#/about">What that means</a>',
  header: (m) => ({ title: `M${m.mag.toFixed(1)}: ${m.place || 'Unnamed location'}`, sub: when(m) }),
  label: (m) => `M${m.mag.toFixed(1)} ${m.region || m.place} (${m.time.slice(0, 4)})`,
  shelves: (m) => {
    const d = new Date(m.time);
    return [
      ['Year', m.time.slice(0, 4)], ['Decade', `${m.time.slice(0, 3)}0s`], ['Month', MONTHS[+m.time.slice(5, 7) - 1]], ['Weekday (UTC)', DAYS[d.getUTCDay()]],
      ['Magnitude', band(m.mag, [[6.5, '6.0 to 6.4'], [7, '6.5 to 6.9'], [7.5, '7.0 to 7.4'], [8, '7.5 to 7.9'], [Infinity, '8.0 or more']])],
      ...(m.depth === null ? [] : [['Depth', band(m.depth, [[10.01, 'Up to 10 km'], [70, '10 to 70 km'], [300, '70 to 300 km'], [Infinity, 'Over 300 km']])]]),
      ['Hemisphere', m.lat < 0 ? 'Southern' : 'Northern'],
      ...(m.region ? [['Region', m.region]] : []),
      ...(m.tsunami ? [['Impact', 'Tsunami flagged']] : []),
      ...(m.alert && m.alert !== 'green' ? [['Impact', `PAGER ${m.alert} alert`]] : []),
    ];
  },
  facts: (m) => [
    ['When', when(m)], ['Magnitude', `${m.mag.toFixed(1)}${m.magType ? ` (${m.magType})` : ''}`], ['Depth', m.depth === null ? unknown : `${fmt(m.depth)} km`],
    ['Location', m.place || unknown], ['Coordinates', `${m.lat}°, ${m.lon}°`],
    ['Tsunami flag', m.tsunami ? 'Yes (a USGS flag, not a confirmed wave)' : 'No'],
    ['"Did You Feel It?" reports', m.felt ? fmt(m.felt) : 'none or unknown'],
    ['Max shaking (MMI)', m.mmi ? String(m.mmi) : unknown], ['PAGER alert', m.alert || unknown], ['Significance', m.sig ? fmt(m.sig) : unknown],
    ['Source', usgs(m.url) ? 'USGS event page' : 'USGS catalog', usgs(m.url)],
  ],
  art(m) { // original seismogram: amplitude follows magnitude, color follows depth; it never affects scoring
    let h = hash(m.id);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
    const d = m.depth ?? 10, amp = 6 + (m.mag - 6) * 11, hue = d < 70 ? '#ff9d4d' : d < 300 ? '#6ec7ff' : '#b58cff';
    const pts = Array.from({ length: 90 }, (_, i) => {
      const x = 5 + i * (90 / 89), t = i / 89, env = t < 0.28 ? 0.06 : amp * Math.exp(-(t - 0.28) * 4) * (t < 0.34 ? (t - 0.28) / 0.06 : 1);
      return `${x.toFixed(1)},${(50 + (rnd() - 0.5) * 2 * Math.max(1.2, env)).toFixed(1)}`;
    }).join(' ');
    return `<svg class="avatar" viewBox="0 0 100 100" role="img" aria-label="Generated seismogram for the earthquake. Not a real recording.">
      <rect width="100" height="100" rx="8" fill="#10131c"/><g stroke="#2a3040" stroke-width=".4"><path d="M5 30H95M5 50H95M5 70H95M25 15V85M50 15V85M75 15V85"/></g>
      <polyline points="${pts}" fill="none" stroke="${hue}" stroke-width="1" stroke-linejoin="round"/>
      <text x="8" y="14" font-family="system-ui,sans-serif" font-weight="700" font-size="9" fill="${hue}">M${m.mag.toFixed(1)}</text>
      <text x="50" y="94" text-anchor="middle" font-family="system-ui,sans-serif" font-size="5.5" letter-spacing=".6" fill="#7e87a3">GENERATED TRACE</text></svg>`;
  },
  poolNotice: 'Every earthquake comes from the <a href="https://earthquake.usgs.gov/earthquakes/search/">USGS earthquake catalog</a> (U.S. Geological Survey, public domain): magnitude 6.0 or more from 1973 onward, as a snapshot. A value the catalog does not have is unknown and never earns a badge. Odds describe this pool of recorded events, and the USGS revises old records, so details can differ from the live catalog.',
  poolExtra(pool) {
    const tally = (get) => { const c = new Map(); for (const m of pool.members) for (const v of get(m)) c.set(v, (c.get(v) || 0) + 1); return [...c]; };
    const table = (title, rows) => `<table><thead><tr><th>${title}</th><th class="n">Earthquakes</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${fmt(v)}</td></tr>`).join('')}</tbody></table>`;
    const top = (rows, k) => rows.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, k);
    return `<h2>What is in the pool</h2><p class="small muted">Disclosed because a badge is only rare relative to this mix.</p>
      ${table('Decade', tally((m) => [`${m.time.slice(0, 3)}0s`]).sort((a, b) => a[0].localeCompare(b[0])))}${table('Top regions', top(tally((m) => (m.region ? [m.region] : [])), 10))}`;
  },
  aboutData: `<h2>Where the data comes from</h2>
    <p>Time, magnitude, depth, position, place name, tsunami flag, felt reports, shaking intensity, PAGER alert and significance come from the U.S. Geological Survey's earthquake catalog (ComCat), fetched once as a snapshot. Earthquakes of magnitude 6.0 or more from 1973 are included; earlier years are left out because global coverage is less complete. The "tsunami flag" is a USGS flag, not a confirmation that a wave occurred. The region comes from the catalog's place text and is unknown for the few events that have only a proper name. The artwork is a generated trace, not a recording. Each earthquake is a real event, and some caused deaths and destruction: this is a catalog game, not a measure of anyone's suffering.</p>`,
  terms: 'It is not affiliated with, sponsored or endorsed by the U.S. Geological Survey or any government agency. Earthquake data courtesy of the USGS; any errors in the snapshot or in the badges are this prototype\'s. Badges describe catalog measurements, not human impact.',
};
