import {readFileSync} from 'node:fs';
import {prepareForegroundEffects} from '../../src/foreground-effects.js';
import {validateAutomaticForeground} from '../../src/automatic-foreground.js';
const plan=JSON.parse(readFileSync(process.argv[2],'utf8'));
if(plan.foregroundEffects)prepareForegroundEffects(plan.foregroundEffects,plan);
if(plan.automaticForeground)validateAutomaticForeground(plan.automaticForeground,plan);
if(plan.foregroundEffects&&plan.automaticForeground)throw Error('Conflicting foreground modes');
