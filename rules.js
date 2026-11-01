// QuakeRNG badge rules. Each rule is a deterministic predicate over known fields: a value the catalog does not have never matches.
// test(m, poolDate) and evidence(m, poolDate) read the prepared member from prep().

export const norm = (s) => s.normalize('NFKC').toLowerCase();

const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const pos = (x) => (num(x) !== null && x > 0 ? x : null); // zero or absent is unknown for counts and intensities
const WHEN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})Z$/;

export function prep(raw) {
  const w = typeof raw.time === 'string' ? WHEN.exec(raw.time) : null;
  return {
    ...raw,
    mag: pos(raw.mag), depth: num(raw.depth) !== null && raw.depth >= 0 ? raw.depth : null, lat: num(raw.lat), lon: num(raw.lon),
    felt: pos(raw.felt), mmi: pos(raw.mmi), sig: pos(raw.sig),
    year: w ? +w[1] : null, month: w ? +w[2] : null, day: w ? +w[3] : null, hour: w ? +w[4] : null,
    pager: typeof raw.alert === 'string' ? norm(raw.alert) : null, // PAGER alert level
    tsu: raw.tsunami === true,
    named: typeof raw.place === 'string' && raw.place.endsWith('Earthquake'), // the catalog gives a few events a proper name
  };
}

const at = (m) => `${m.place || 'Unnamed location'} on ${m.time.slice(0, 10)}`;
const mag = (m) => `${at(m)} had magnitude ${m.mag}`;
const dep = (m) => `${at(m)} was ${m.depth} km deep`;

export const RULES = [
  { id: 'strong-shaker', name: 'Strong Shaker', family: 'Magnitude', rule: 'Magnitude 6.5 or more', test: (m) => m.mag !== null && m.mag >= 6.5, evidence: mag },
  { id: 'major-quake', name: 'Major Quake', family: 'Magnitude', rule: 'Magnitude 7.0 or more', test: (m) => m.mag !== null && m.mag >= 7, evidence: mag },
  { id: 'great-quake', name: 'Great Quake', family: 'Magnitude', rule: 'Magnitude 8.0 or more', test: (m) => m.mag !== null && m.mag >= 8, evidence: mag },
  { id: 'monster', name: 'Monster', family: 'Magnitude', rule: 'Magnitude 8.8 or more', test: (m) => m.mag !== null && m.mag >= 8.8, evidence: mag },
  { id: 'shallow', name: 'Shallow', family: 'Depth', rule: 'Depth of 10 km or less', test: (m) => m.depth !== null && m.depth <= 10, evidence: dep },
  { id: 'intermediate', name: 'Intermediate', family: 'Depth', rule: 'Depth of 70 km or more', test: (m) => m.depth !== null && m.depth >= 70, evidence: dep },
  { id: 'deep-focus', name: 'Deep Focus', family: 'Depth', rule: 'Depth of 300 km or more', test: (m) => m.depth !== null && m.depth >= 300, evidence: dep },
  { id: 'very-deep', name: 'Very Deep', family: 'Depth', rule: 'Depth of 600 km or more', test: (m) => m.depth !== null && m.depth >= 600, evidence: dep },
  { id: 'tsunami-flag', name: 'Tsunami Flag', family: 'Tsunami', rule: 'Flagged by USGS as possibly tsunami-generating (a flag, not a confirmed wave)',
    test: (m) => m.tsu, evidence: (m) => `${at(m)} carries the USGS tsunami flag` },
  { id: 'widely-felt', name: 'Widely Felt', family: 'Felt reports', rule: '1,000 or more "Did You Feel It?" reports',
    test: (m) => m.felt !== null && m.felt >= 1000, evidence: (m) => `${at(m)} drew ${m.felt.toLocaleString('en')} felt reports` },
  { id: 'felt-by-many', name: 'Felt by Many', family: 'Felt reports', rule: '10,000 or more "Did You Feel It?" reports',
    test: (m) => m.felt !== null && m.felt >= 10000, evidence: (m) => `${at(m)} drew ${m.felt.toLocaleString('en')} felt reports` },
  { id: 'orange-alert', name: 'Orange Alert', family: 'PAGER alert', rule: 'USGS PAGER impact alert of orange or red',
    test: (m) => m.pager === 'orange' || m.pager === 'red', evidence: (m) => `${at(m)} had a ${m.alert} PAGER alert` },
  { id: 'red-alert', name: 'Red Alert', family: 'PAGER alert', rule: 'USGS PAGER impact alert of red',
    test: (m) => m.pager === 'red', evidence: (m) => `${at(m)} had a red PAGER alert` },
  { id: 'strong-shaking', name: 'Strong Shaking', family: 'Shaking', rule: 'Maximum instrumental intensity (MMI) of 7 or more',
    test: (m) => m.mmi !== null && m.mmi >= 7, evidence: (m) => `${at(m)} reached MMI ${m.mmi}` },
  { id: 'violent-shaking', name: 'Violent Shaking', family: 'Shaking', rule: 'Maximum instrumental intensity (MMI) of 9 or more',
    test: (m) => m.mmi !== null && m.mmi >= 9, evidence: (m) => `${at(m)} reached MMI ${m.mmi}` },
  { id: 'high-significance', name: 'High Significance', family: 'Significance', rule: 'USGS significance score of 1,000 or more',
    test: (m) => m.sig !== null && m.sig >= 1000, evidence: (m) => `${at(m)} scored ${m.sig} for significance` },
  { id: 'early-record', name: 'Early Record', family: 'Era', rule: 'Happened before 1980', test: (m) => m.year !== null && m.year < 1980, evidence: (m) => `${at(m)} is from ${m.year}` },
  { id: 'recent', name: 'Recent', family: 'Era', rule: 'Happened in 2022 or later', test: (m) => m.year !== null && m.year >= 2022, evidence: (m) => `${at(m)} is from ${m.year}` },
  { id: 'leap-day', name: 'Leap Day', family: 'Date pattern', rule: 'Happened on 29 February (UTC)', test: (m) => m.month === 2 && m.day === 29, evidence: (m) => `${at(m)} fell on a leap day` },
  { id: 'new-year', name: 'New Year', family: 'Date pattern', rule: 'Happened on 1 January (UTC)', test: (m) => m.month === 1 && m.day === 1, evidence: (m) => `${at(m)} fell on New Year's Day` },
  { id: 'midnight-hour', name: 'Midnight Hour', family: 'Time of day', rule: 'Happened between 00:00 and 00:59 UTC', test: (m) => m.hour === 0, evidence: (m) => `${at(m)} struck at ${m.time.slice(11, 16)} UTC` },
  { id: 'southern-hemisphere', name: 'Southern Hemisphere', family: 'Hemisphere', rule: 'Epicenter south of the equator', test: (m) => m.lat !== null && m.lat < 0, evidence: (m) => `${at(m)} was at latitude ${m.lat}` },
  { id: 'equatorial', name: 'Equatorial', family: 'Latitude', rule: 'Epicenter within 5 degrees of the equator', test: (m) => m.lat !== null && Math.abs(m.lat) <= 5, evidence: (m) => `${at(m)} was at latitude ${m.lat}` },
  { id: 'polar-reach', name: 'Polar Reach', family: 'Latitude', rule: 'Epicenter at 60 degrees latitude or beyond', test: (m) => m.lat !== null && Math.abs(m.lat) >= 60, evidence: (m) => `${at(m)} was at latitude ${m.lat}` },
  { id: 'date-line', name: 'Date Line', family: 'Longitude', rule: 'Epicenter within 5 degrees of the 180th meridian', test: (m) => m.lon !== null && Math.abs(m.lon) >= 175, evidence: (m) => `${at(m)} was at longitude ${m.lon}` },
  { id: 'named-quake', name: 'Named Quake', family: 'Naming', rule: 'The catalog gives the event a proper name', test: (m) => m.named, evidence: (m) => `The catalog names this event "${m.place}"` },
];
