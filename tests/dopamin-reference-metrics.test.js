import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visualProfile} from '../src/style-variants.js';
const data=JSON.parse(readFileSync(new URL('../examples/references/dopamin-20261022.measured.json',import.meta.url)));
test('DOPAMIN reference evidence is measured and never treated as cut/zoom quotas',()=>{
 const p=visualProfile('SUES_DOPAMIN'),calma=visualProfile('SUES_CALMA');
 assert.equal(data.schema,'sues-reference-temporal-measurement/v1');
 assert.equal(data.referenceId,p.supplementalReference);
 assert.equal(p.reference,'deckeanu-keanu-primary');
 assert.equal(data.source.width,1080);assert.equal(data.source.height,1920);
 assert.ok(data.measurement.strongVisualChangeThresholds['0.20'].visualChangeCandidates>=data.measurement.strongVisualChangeThresholds['0.32'].visualChangeCandidates);
 assert.ok(data.measurement.strongVisualChangeThresholds['0.32'].visualChangeCandidates>=data.measurement.strongVisualChangeThresholds['0.45'].visualChangeCandidates);
 assert.ok(data.measurement.knownLimitations.some(s=>s.includes('not just editorial cuts')));
 assert.equal(calma.frequency,p.frequency/2);assert.equal(calma.supplementalReference,undefined);
 assert.ok(!Object.hasOwn(p,'cutsPerMinute')); // never force effect timing from detected changes
});
