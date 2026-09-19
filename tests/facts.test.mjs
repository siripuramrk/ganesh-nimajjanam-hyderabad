import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const facts = JSON.parse(readFileSync(resolve(HERE, '..', 'data', 'facts.json'), 'utf8'));

/** Weekday name for a YYYY-MM-DD date string, in UTC. */
function weekdayOf(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateStr + 'T00:00:00Z').getUTCDay()];
}

test('meta.immersion_date is exactly 2026-09-25 and is a Friday', () => {
  assert.equal(facts.meta.immersion_date, '2026-09-25');
  assert.equal(weekdayOf(facts.meta.immersion_date), 'Friday');
});

test('meta.festival_start is exactly 2026-09-14 and is a Monday', () => {
  assert.equal(facts.meta.festival_start, '2026-09-14');
  assert.equal(weekdayOf(facts.meta.festival_start), 'Monday');
});

test('every key_facts entry has id, label, value, detail and at least one source key', () => {
  assert.ok(Array.isArray(facts.key_facts), 'key_facts must be an array');
  assert.ok(facts.key_facts.length > 0, 'key_facts must not be empty');
  for (const fact of facts.key_facts) {
    assert.ok(fact.id, `entry missing id: ${JSON.stringify(fact)}`);
    assert.ok(fact.label, `entry "${fact.id}" missing label`);
    assert.ok(fact.value, `entry "${fact.id}" missing value`);
    assert.ok(fact.detail, `entry "${fact.id}" missing detail`);
    assert.ok(Array.isArray(fact.sources), `entry "${fact.id}" sources must be an array`);
    assert.ok(fact.sources.length >= 1, `entry "${fact.id}" must cite at least one source`);
  }
});

test('every source key references an existing source_index entry', () => {
  const keys = Object.keys(facts.source_index);
  for (const fact of facts.key_facts) {
    for (const sourceKey of fact.sources) {
      assert.ok(
        keys.includes(sourceKey),
        `entry "${fact.id}" references missing source "${sourceKey}"`,
      );
    }
  }
});

test('every source_index entry has a non-empty title, outlet and an https URL', () => {
  for (const [key, entry] of Object.entries(facts.source_index)) {
    assert.ok(entry.title, `source "${key}" missing title`);
    assert.ok(entry.outlet, `source "${key}" missing outlet`);
    assert.ok(entry.url.startsWith('https://'), `source "${key}" URL is not https: ${entry.url}`);
  }
});

test('route is non-empty with contiguous ascending order and non-empty places', () => {
  assert.ok(Array.isArray(facts.route) && facts.route.length > 0, 'route must be a non-empty array');
  const orders = facts.route.map((stop) => stop.order);
  const expected = Array.from({ length: facts.route.length }, (_, i) => i + 1);
  assert.deepEqual(orders, expected, 'route order must be 1..n contiguous and ascending');
  for (const stop of facts.route) {
    assert.ok(stop.place, `route stop ${stop.order} missing place`);
  }
});

test('key_facts ids are unique', () => {
  const ids = facts.key_facts.map((fact) => fact.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate key_facts id found');
});

test('source_index key count matches the distinct keys actually cited', () => {
  const cited = new Set();
  for (const fact of facts.key_facts) {
    for (const key of fact.sources) cited.add(key);
  }
  assert.equal(
    Object.keys(facts.source_index).length,
    cited.size,
    'source_index should contain exactly the keys referenced by key_facts (no orphan, no dangling)',
  );
});
