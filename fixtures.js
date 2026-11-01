// QuakeRNG fixtures for check.html: one row per case, [rule id, field overrides, expected match].
export const V = '2026-11-01';
export const base = { id: 'us1', time: '2005-06-15T12:30Z', mag: 6.2, magType: 'mww', depth: 25, lat: 10, lon: 100, place: '10 km S of Somewhere, Country',
  region: 'Country', tsunami: false, felt: 50, mmi: 5.5, alert: 'green', sig: 600, url: '' };

export const cases = [
  ['strong-shaker', { mag: 6.5 }, true], ['strong-shaker', { mag: 6.4 }, false], ['strong-shaker', { mag: null }, false], ['strong-shaker', { mag: 0 }, false],
  ['major-quake', { mag: 7 }, true], ['major-quake', { mag: 6.9 }, false],
  ['great-quake', { mag: 8 }, true], ['great-quake', { mag: 7.9 }, false],
  ['monster', { mag: 8.8 }, true], ['monster', { mag: 8.7 }, false],
  ['shallow', { depth: 10 }, true], ['shallow', { depth: 10.1 }, false], ['shallow', { depth: 0 }, true], ['shallow', { depth: null }, false], ['shallow', { depth: -0.1 }, true], ['shallow', { depth: -11 }, false],
  ['intermediate', { depth: 70 }, true], ['intermediate', { depth: 69.9 }, false],
  ['deep-focus', { depth: 300 }, true], ['deep-focus', { depth: 299 }, false],
  ['very-deep', { depth: 600 }, true], ['very-deep', { depth: 599 }, false],
  ['tsunami-flag', { tsunami: true }, true], ['tsunami-flag', { tsunami: false }, false], ['tsunami-flag', { tsunami: undefined }, false], ['tsunami-flag', { tsunami: 1 }, false],
  ['widely-felt', { felt: 1000 }, true], ['widely-felt', { felt: 999 }, false], ['widely-felt', { felt: null }, false], ['widely-felt', { felt: 0 }, false],
  ['felt-by-many', { felt: 10000 }, true], ['felt-by-many', { felt: 9999 }, false],
  ['orange-alert', { alert: 'orange' }, true], ['orange-alert', { alert: 'red' }, true], ['orange-alert', { alert: 'yellow' }, false], ['orange-alert', { alert: null }, false], ['orange-alert', { alert: 'ORANGE' }, true],
  ['red-alert', { alert: 'red' }, true], ['red-alert', { alert: 'orange' }, false],
  ['strong-shaking', { mmi: 7 }, true], ['strong-shaking', { mmi: 6.9 }, false], ['strong-shaking', { mmi: null }, false],
  ['violent-shaking', { mmi: 9 }, true], ['violent-shaking', { mmi: 8.9 }, false],
  ['high-significance', { sig: 1000 }, true], ['high-significance', { sig: 999 }, false], ['high-significance', { sig: null }, false],
  ['early-record', { time: '1979-12-31T23:59Z' }, true], ['early-record', { time: '1980-01-01T00:00Z' }, false], ['early-record', { time: 'garbage' }, false], ['early-record', { time: undefined }, false],
  ['recent', { time: '2022-01-01T00:00Z' }, true], ['recent', { time: '2021-12-31T23:59Z' }, false],
  ['leap-day', { time: '2016-02-29T05:00Z' }, true], ['leap-day', { time: '2016-02-28T05:00Z' }, false], ['leap-day', { time: '2016-03-29T05:00Z' }, false],
  ['new-year', { time: '2010-01-01T05:00Z' }, true], ['new-year', { time: '2010-01-02T05:00Z' }, false], ['new-year', { time: '2010-02-01T05:00Z' }, false],
  ['midnight-hour', { time: '2010-05-05T00:59Z' }, true], ['midnight-hour', { time: '2010-05-05T01:00Z' }, false], ['midnight-hour', { time: '2010-05-05T23:00Z' }, false],
  ['southern-hemisphere', { lat: -0.01 }, true], ['southern-hemisphere', { lat: 0 }, false], ['southern-hemisphere', { lat: null }, false],
  ['equatorial', { lat: 5 }, true], ['equatorial', { lat: -5 }, true], ['equatorial', { lat: 5.1 }, false], ['equatorial', { lat: null }, false],
  ['polar-reach', { lat: 60 }, true], ['polar-reach', { lat: -60 }, true], ['polar-reach', { lat: 59.9 }, false],
  ['date-line', { lon: 175 }, true], ['date-line', { lon: -175 }, true], ['date-line', { lon: 174.9 }, false], ['date-line', { lon: null }, false],
  ['named-quake', { place: '2004 Sumatra - Andaman Islands Earthquake' }, true], ['named-quake', { place: '10 km S of Somewhere, Country' }, false], ['named-quake', { place: undefined }, false],
];

export function poolChecks(raw, pool, ok) {
  const ms = raw.members;
  ok('event ids are unique', new Set(ms.map((m) => m.id)).size === pool.n);
  ok('every event has a UTC time, a magnitude of 6 or more, a depth, and a position', ms.every((m) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/.test(m.time) && m.mag >= 6 && m.depth >= -10 && Math.abs(m.lat) <= 90 && Math.abs(m.lon) <= 180));
  ok('no event is dated before 1973 or after the capture date', ms.every((m) => m.time.slice(0, 4) >= '1973' && m.time.slice(0, 10) <= raw.meta.capturedAt));
  ok('events are in time order', ms.every((m, i) => i === 0 || m.time >= ms[i - 1].time));
  ok('unknown measurements are null, not zero or empty', ms.every((m) => ['felt', 'mmi', 'sig'].every((k) => m[k] === null || m[k] > 0)));
  ok('source links point at the USGS', ms.every((m) => m.url === '' || m.url.startsWith('https://earthquake.usgs.gov/')));
  ok('the pool is large enough to be a game (>= 1000)', pool.n >= 1000);
}
