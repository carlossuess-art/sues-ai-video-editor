import {readFileSync} from 'node:fs';
import {prepareForegroundEffects} from '../../src/foreground-effects.js';
const plan=JSON.parse(readFileSync(process.argv[2],'utf8'));prepareForegroundEffects(plan.foregroundEffects,plan);
