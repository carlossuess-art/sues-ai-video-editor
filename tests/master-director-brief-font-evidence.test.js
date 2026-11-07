import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {inspectFilmDirectorMontserrat} from '../src/master-director-brief-font-evidence.js';
const digest=b=>createHash('sha256').update(b).digest('hex');
test('exact font evidence distinguishes licensed Bold from missing SemiBold without substitution',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-film-font-'));
 try{
  const license='SIL OPEN FONT LICENSE Version 1.1\nTerms and conditions',font=Buffer.from('mock-font');
  writeFileSync(join(dir,'OFL.txt'),license);writeFileSync(join(dir,'Montserrat-Bold.ttf'),font);
  const manifest={files:{'OFL.txt':{sha256:digest(license)},'Montserrat-Bold.ttf':{sha256:digest(font),bytes:font.length}}};
  const result=inspectFilmDirectorMontserrat({fontDirectory:dir,sourceManifest:manifest});
  assert.equal(result.license.status,'OFL_TEXT_HASH_VERIFIED');
  assert.equal(result.fonts[0].status,'AVAILABLE_WITH_OFL_EVIDENCE');
  assert.equal(result.fonts[1].status,'EXACT_FONT_WEIGHT_NOT_AVAILABLE');
  assert.deepEqual(result.missingWeights,[600]);
  assert.equal(result.approved,false);assert.equal(result.canExecute,false);
  manifest.files['Montserrat-Bold.ttf'].sha256='f'.repeat(64);
  assert.equal(inspectFilmDirectorMontserrat({fontDirectory:dir,sourceManifest:manifest}).fonts[0].status,'FONT_HASH_OR_SIZE_MISMATCH');
  manifest.files['OFL.txt'].sha256='f'.repeat(64);
  assert.equal(inspectFilmDirectorMontserrat({fontDirectory:dir,sourceManifest:manifest}).status,'BLOCKED');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
