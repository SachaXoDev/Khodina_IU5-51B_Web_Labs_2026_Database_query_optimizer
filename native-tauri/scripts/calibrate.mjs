import { readFile } from 'node:fs/promises';
import { loadClip, MODEL_ID, MODEL_REVISION } from '../src/clip-model.js';
import { bySimilarity, candidatePages, DEFAULT_THRESHOLD, MAX_THRESHOLD, MIN_THRESHOLD, scoreEntries, selectMatches } from '../src/clip-ranking.js';

const api = process.env.CLIP_DEMO_API;
const seed = await readFile(new URL('../../scripts/demo_optimizer_seed.sql', import.meta.url), 'utf8');
const captions = new Map([...seed.matchAll(/^\s*\(\d+, '([a-z_]+)', '((?:[^'\r\n]|'')*)',/gm)]
  .map(([, slug, caption]) => [slug, caption.replaceAll("''", "'")]));
if (captions.size !== 14) throw new Error('Expected the 14 demo captions in the optimizer seed.');

// Labels describe visible content, not index semantics. The two existing assets
// without a related demo caption are negative only against the labeled set.
const media = '../fixtures/';
const fixtures = [
  { path: `${media}index_users_email.jpg`, slug: 'card_cabinet' },
  { path: `${media}index_products_sku.jpg`, slug: 'digital_rain' },
  { path: `${media}index_orders_created_at.jpg`, slug: 'server_racks' },
  { path: `${media}index_logs_timestamp.jpg`, slug: 'circuit_board' },
  { path: '../../frontend/public/DefaultImage.jpg', slug: null },
  { path: '../../frontend/src/assets/hero.png', slug: null },
];

const offline = [...captions.values()].map((shortDescription, i) => ({ id: i + 1, shortDescription }));
const pages = candidatePages(async (afterId, limit) => {
  if (!api) return { items: offline, nextAfterId: null };
  const url = new URL('/api/indexes/clip-candidates', api);
  url.search = new URLSearchParams({ afterId, limit });
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!response.ok) throw new Error(`Candidate API: HTTP ${response.status}`);
  return response.json();
});
const knownCaptions = new Set(captions.values());
const seen = new Set();
const rankings = fixtures.map(() => []);
let compared = 0;

console.log(`${MODEL_ID}@${MODEL_REVISION} | q8 | ONNX Runtime CPU`);
console.log(`${api ? 'Live candidate API, all pages' : 'Offline, exactly the 14 seed captions'}; using cached weights if available.`);
const clip = await loadClip('cpu');
try {
  const images = await Promise.all(fixtures.map(async ({ path }) => clip.embedImage(new Blob([
    await readFile(new URL(path, import.meta.url)),
  ], { type: path.endsWith('.png') ? 'image/png' : 'image/jpeg' }))));
  for await (const descriptions of pages) {
    const text = await clip.embedText(descriptions.map(({ shortDescription }) => shortDescription));
    for (const { shortDescription } of descriptions) seen.add(shortDescription);
    for (const [i, image] of images.entries()) {
      const expected = captions.get(fixtures[i].slug);
      for (const row of scoreEntries(image, descriptions, text)) {
        const label = row.shortDescription === expected ? 'relevant' : knownCaptions.has(row.shortDescription) ? 'irrelevant' : 'unjudged';
        rankings[i].push({ ...row, label });
      }
    }
    compared += descriptions.length;
  }
} finally {
  await clip.dispose();
}
const missing = [...captions].filter(([, caption]) => !seen.has(caption)).map(([slug]) => slug);
if (missing.length) throw new Error(`Candidate set is missing demo captions: ${missing.join(', ')}. Seed the demo database before live calibration.`);
console.log(`Compared ${compared} candidates per image. Additional catalog captions without labels remain unjudged.`);

for (const [i, rows] of rankings.entries()) {
  rows.sort(bySimilarity);
  const { path, slug } = fixtures[i];
  const firstRelevant = rows.findIndex(({ label }) => label === 'relevant');
  const shown = rows.length <= 30 ? rows : rows.filter((row, rank) => rank < 10 || knownCaptions.has(row.shortDescription));
  console.log(`\n${path.split('/').at(-1)} | ${slug ? `first labeled match rank ${firstRelevant + 1}` : 'no relevant demo caption'}`);
  console.table(shown.map((row) => ({ id: row.id, label: row.label,
    cosine: row.cosine.toFixed(4), score: row.score.toFixed(4), description: row.shortDescription })));
}

const pairs = rankings.flat();
const relevant = pairs.filter(({ label }) => label === 'relevant').length;
const rates = [];
for (let hundredths = Math.round(MIN_THRESHOLD * 100); hundredths <= Math.round(MAX_THRESHOLD * 100); hundredths++) {
  const threshold = hundredths / 100;
  const passing = pairs.filter(({ score }) => score >= threshold);
  const tp = passing.filter(({ label }) => label === 'relevant').length;
  const fp = passing.filter(({ label }) => label === 'irrelevant').length;
  const fn = relevant - tp;
  const unjudged = passing.length - tp - fp;
  const negativeQueriesWithHits = rankings.filter((rows, i) => !fixtures[i].slug &&
    rows.some(({ score, label }) => label === 'irrelevant' && score >= threshold)).length;
  rates.push({ threshold, tp, fp, fn, unjudged, negativeQueriesWithHits, precision: tp + fp ? tp / (tp + fp) : null,
    recall: tp / relevant, f1: (2 * tp) / (2 * tp + fp + fn) });
}
const best = [...rates].sort((a, b) => b.f1 - a.f1 || (b.precision ?? 0) - (a.precision ?? 0) || b.threshold - a.threshold)[0];
console.log(`\nExploratory fixture sweep (no held-out accuracy estimate). Raw cosine ≥0.40 passes ${pairs.filter(({ label, cosine }) => label === 'relevant' && cosine >= 0.40).length}/${relevant} labeled positive pairs.`);
console.table({ default: rates.find((row) => row.threshold === DEFAULT_THRESHOLD), bestFixtureF1: best });
console.table([1, 3, 5].map((k) => {
  const hits = rankings.map((rows) => selectMatches(rows, DEFAULT_THRESHOLD, k));
  const returned = hits.flat();
  return { threshold: DEFAULT_THRESHOLD, k, queriesWithRelevantHit: hits.filter((rows) => rows.some(({ label }) => label === 'relevant')).length,
    positiveQueries: fixtures.filter(({ slug }) => slug).length, falseMatches: returned.filter(({ label }) => label === 'irrelevant').length,
    unjudged: returned.filter(({ label }) => label === 'unjudged').length };
}));