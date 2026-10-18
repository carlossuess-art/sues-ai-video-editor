import test from 'node:test';
import assert from 'node:assert/strict';
import {captionCues,progressiveRuns} from '../src/caption-motion.js';
import {textAdvance} from '../src/font-kits.js';
const policy={font:'Inter',fontSize:96,scaleX:94,tracking:-2,progressive:true,characterEntrance:{staggerMs:24,settleMs:130}};
test('progressive cues retain real mapped timing and attach uncertain points to the real word',()=>{
 const words=[{text:'un',sourceWordIndex:10,start:4,end:4.5},{text:'mundo',sourceWordIndex:11,start:4.5,end:4.5,timingUncertain:true},{text:'tras',sourceWordIndex:12,start:4.5,end:5}];
 const cues=captionCues({wordIndexes:[10,11,12]},words);assert.deepEqual(cues.map(c=>[c.start,c.end,c.wordIndexes]),[[4,4.5,[10,11]],[4.5,5,[12]]]);assert.equal(cues[0].timingUncertain,true);
 const leading=captionCues({wordIndexes:[0,1]},[{text:'un',sourceWordIndex:0,start:2,end:2,timingUncertain:true},{text:'mundo',sourceWordIndex:1,start:2,end:2.5}]);assert.deepEqual(leading.map(c=>[c.start,c.end,c.wordIndexes]),[[2,2.5,[0,1]]]);
 const c={text:'un mundo tras',source:'auto',wordIndexes:[10,11,12],start:4,end:5,wordCues:cues},runs=progressiveRuns(c,[{text:c.text,size:96,x:510,y:1295,role:'companion'}],policy);
 assert.deepEqual(runs.map(r=>r.start),[4,4.5]);assert.deepEqual(runs.map(r=>r.text),['un mundo','un mundo tras']);assert.ok(runs.every(r=>r.x===510));assert.equal(runs.at(-1).end,5);
});
test('characters stagger inside the group without shifting the final word width or extending time',()=>{
 const c={text:'tu mente',wordIndexes:[0,1],start:2,end:3,wordCues:[{wordIndexes:[0],start:2,end:2.3},{wordIndexes:[1],start:2.3,end:3}]};
 const rows=[{text:'tu',size:72,x:510,y:1230,role:'companion'},{text:'mente',size:144,x:510,y:1322,role:'keyword'}],runs=progressiveRuns(c,rows,policy),letters=runs.filter(r=>r.character);
 assert.equal(letters.map(r=>r.text).join(''),'mente');assert.ok(letters.every((r,i)=>r.start>=2.3&&r.start<3&&r.end===3&&(!i||r.start>letters[i-1].start)));
 const left=letters[0].x-textAdvance('m',policy,144)/2,right=letters.at(-1).x+textAdvance('e',policy,144)/2;assert.ok(Math.abs(right-left-textAdvance('mente',policy,144))<1e-6);
 assert.equal(progressiveRuns({...c,source:'manual'},rows,policy),null);
 const short=progressiveRuns({...c,wordCues:[{wordIndexes:[0],start:2,end:2.95},{wordIndexes:[1],start:2.95,end:3}]},rows,policy);assert.ok(short.filter(r=>r.character).every(r=>r.start<2.3));
});
