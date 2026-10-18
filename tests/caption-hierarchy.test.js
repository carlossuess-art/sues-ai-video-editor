import test from 'node:test';
import assert from 'node:assert/strict';
import {captionHierarchy,hierarchyLayout,METALLIC_GOLD} from '../src/caption-hierarchy.js';
import {buildPreviewASS,PREVIEW_LAYOUT} from '../src/local-preview.js';
import {validateTemplate} from '../src/template.js';
import {shortCaptionGroups} from '../src/short-captions.js';
import {readFileSync} from 'node:fs';
const template=JSON.parse(readFileSync('examples/templates/sues-calma.template.json'));
const brand=JSON.parse(readFileSync('examples/brand-kit.sues.json'));
const policy={...template.captions,font:'Inter',keywordUppercase:false,shadow:undefined,glow:undefined,hierarchy:{...template.captions.hierarchy,ratio:2},color:'#FFFFFF',accent:'#D7B56D'};
test('hierarchy selects one content word per phrase and preserves all source text, timing and indexes',()=>{
 const words='Te enseñaron a mirar, pero no a reconocer.'.split(' ').map(text=>({text}));
 const captions=[{text:'a mirar,',wordIndexes:[2,3],start:1,end:2},{text:'a reconocer.',wordIndexes:[6,7],start:3,end:4}];
 const result=captionHierarchy(captions,words,policy);
 assert.equal(result[0].keyword.level,'important');assert.equal(result[1].keyword.level,'exceptional');
 for(const [i,c]of result.entries()){const {keyword,...unchanged}=c;assert.deepEqual(unchanged,captions[i]);}
 assert.equal(captionHierarchy([{...captions[0],source:'manual'}],words,policy)[0].keyword,null);
});
test('keyword is exactly twice each companion with before/after order and safe vertical layout',()=>{
 for(const [text,indexes,selected]of [['tus ojos,',[1,2],2],['mirar, pero',[3,4],3],['el ego no',[5,6,7],6]]){
  const rows=hierarchyLayout({text,wordIndexes:indexes,keyword:{sourceWordIndex:selected}},policy,PREVIEW_LAYOUT.caption),hero=rows.find(r=>r.role==='keyword');
  assert.equal(rows.map(r=>r.text).join(' '),text);
  for(const row of rows){if(row.role==='companion')assert.equal(hero.size/row.size,2);assert.ok(row.y-row.size*.38>=PREVIEW_LAYOUT.caption.top);assert.ok(row.y+row.size*.38<=PREVIEW_LAYOUT.caption.bottom);}
 }
 const wide=hierarchyLayout({text:'hiperextraordinariamente',wordIndexes:[0],keyword:{sourceWordIndex:0}},policy,PREVIEW_LAYOUT.caption);assert.equal(wide,null);
});
test('exceptional word renders a gold reflective fill while ordinary emphasis stays white and text is escaped',()=>{
 const caption={text:'tu mente',lines:['tu mente'],wordIndexes:[0,1],start:2,end:3,keyword:{sourceWordIndex:1,level:'exceptional'}};
 const plan={policy:{captions:policy,outro:{duration:1,text:'SUES'}},renderColors:{dark:'#101820'},layout:PREVIEW_LAYOUT,duration:10,captions:[caption]};
 const metal=buildPreviewASS(plan);assert.equal((metal.match(/\\clip\(/g)??[]).length,METALLIC_GOLD.length);assert.ok(metal.includes('\\fs144'));assert.ok(metal.includes('\\fs72'));assert.ok(metal.includes('\\bord0\\shad0'));assert.ok(metal.includes('&H00E8FBFF&'));
 caption.keyword.level='important';const white=buildPreviewASS(plan);assert.ok(!white.includes('\\clip('));assert.ok(white.includes('\\1c&H00FFFFFF&}mente'));
 caption.text='tu {\\p1}';assert.ok(buildPreviewASS(plan).includes('｛＼p1｝'));
});
test('template rejects invalid hierarchy configuration',()=>{
 assert.equal(validateTemplate(template,brand),true);const bad=structuredClone(template);bad.captions.hierarchy.ratio=3;assert.throws(()=>validateTemplate(bad,brand),/hierarchy ratio/);
});
test('short groups break at commas so a keyword does not carry text from the next phrase',()=>{
 const words='eres culpa, eres temblores,'.split(' ').map((text,i)=>({text,start:i,end:i+1,sourceWordIndex:i,sourceSegmentIndex:0}));
 const result=shortCaptionGroups(words);assert.deepEqual(result.map(c=>c.text),['eres culpa,','eres temblores,']);assert.deepEqual(result.flatMap(c=>c.wordIndexes),[0,1,2,3]);
});
