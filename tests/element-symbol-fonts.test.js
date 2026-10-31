import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fontDownload} from '../src/font-catalog.js';
function glyphFor(bytes,code) {
 let cmap;
 for(let i=0;i<bytes.readUInt16BE(4);i++){const at=12+i*16;if(bytes.toString('ascii',at,at+4)==='cmap')cmap=bytes.readUInt32BE(at+8);}
 assert.ok(cmap);
 for(let i=0;i<bytes.readUInt16BE(cmap+2);i++){
  const table=cmap+bytes.readUInt32BE(cmap+4+i*8+4);
  if(bytes.readUInt16BE(table)!==4)continue;
  const count=bytes.readUInt16BE(table+6)/2,end=table+14,start=end+2*count+2,delta=start+2*count,range=delta+2*count;
  for(let j=0;j<count;j++)if(code>=bytes.readUInt16BE(start+2*j)&&code<=bytes.readUInt16BE(end+2*j)){
   const off=bytes.readUInt16BE(range+2*j),d=bytes.readInt16BE(delta+2*j);
   if(!off)return(code+d)&65535;
   const glyph=bytes.readUInt16BE(range+2*j+off+2*(code-bytes.readUInt16BE(start+2*j)));
   return glyph?(glyph+d)&65535:0;
  }
 }
 return 0;
}
test('interactive true/false symbols resolve to bundled browser fonts',()=>{
 const browser=readFileSync(new URL('../web/live-preview.js',import.meta.url),'utf8');
 assert.ok(browser.includes("'inter-bold'"));
 const fallback=readFileSync(fontDownload('inter-bold','file').path);
 for(const symbol of ['✓','×'])assert.notEqual(glyphFor(fallback,symbol.codePointAt(0)),0,symbol+' must not render as a missing-glyph square');
 const elements=readFileSync(new URL('../src/elements.js',import.meta.url),'utf8');
 assert.ok(elements.includes('× FALSO'));assert.ok(!elements.includes('✕ FALSO'));
});
