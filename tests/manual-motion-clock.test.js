import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../web/manual-adjust.js', import.meta.url), 'utf8');
const start = source.indexOf(' const manifestItems=()=>{');
const end = source.indexOf('\n function openElementPanel()', start);
assert.ok(start >= 0 && end > start);
function items(saved, draft) {
  return vm.runInNewContext(source.slice(start, end) + '\nmanifestItems()', {
    kind: 'motions',
    current: { settings: { motionLayerOverrides: saved } },
    draft: { motionLayerOverrides: draft, hiddenVisualEventIds: [] },
    plan: { manifest: { manualVisuals: { events: [{
      id: 'motion-one', sourceId: 'decision-one', category: 'motions',
      start: 2.9, end: 4.5,
      children: [{ id: 'label', start: 3.1, end: 4.5, content: 'SAVED' }]
    }] } } }
  });
}
test('reopening rendered Motion preserves parent and layer clocks', () => {
  const overrides = { 'decision-one': { offset: .1, layers: { label: { offset: .1, text: 'SAVED' } } } };
  const [item] = items(overrides, structuredClone(overrides));
  assert.equal(item.start, 2.9);
  assert.equal(item.children[0].start, 3.1);
});
test('new Motion edits apply only the delta from saved transforms', () => {
  const saved = { 'decision-one': { offset: .1, layers: { label: { offset: .1 } } } };
  const edited = { 'decision-one': { offset: .3, layers: { label: { offset: .4, text: 'EDITED' } } } };
  const [item] = items(saved, edited);
  assert.ok(Math.abs(item.start - 3.1) < 1e-9);
  assert.ok(Math.abs(item.children[0].start - 3.6) < 1e-9);
  assert.equal(item.children[0].content, 'EDITED');
});
