import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sample=fs.readFileSync(path.join(root,'public/assets/keyboard-source.wav'));
const dataPos=sample.indexOf(Buffer.from('data'));
if(dataPos<0)throw new Error('Required licensed local keyboard sample missing');
const src=sample.subarray(dataPos+8);
const sampleRate=24000, frames=390, fps=30;
const total=Math.ceil(frames*sampleRate/fps),wave=new Float32Array(total);
const lines=[
 {t:'SI QUIERES',start:9,duration:25},
 {t:'DESARROLLAR',start:38,duration:36},
 {t:'TU NIVEL DE',start:77,duration:26},
 {t:'CONCIENCIA',start:107,duration:33}
];
let count=0;
function addTick(time,gain=.28){
 const pos=Math.round(time*sampleRate),max=Math.min(src.length/2,3100);
 for(let i=0;i<max&&pos+i<total;i++){
  const signal=src.readInt16LE(i*2)/32768;
  const env=Math.min(1,i/110)*Math.min(1,(max-i)/1250);
  wave[pos+i]+=signal*gain*env;
 }
 count++;
}
for(const line of lines){
 for(let k=0;k<line.t.length;k++){
  if(line.t[k]===' ')continue;
  const f=125+line.start+Math.ceil((k+1)*line.duration/line.t.length);
  addTick(f/fps,.24+(k%4)*.035);
 }
}
addTick((269+39)/fps,.75);
const wav=Buffer.alloc(44+total*2);
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sampleRate,24);
wav.writeUInt32LE(sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
wav.write('data',36);wav.writeUInt32LE(total*2,40);
for(let i=0;i<total;i++)wav.writeInt16LE(Math.round(Math.max(-.94,Math.min(.94,wave[i]))*32767),44+2*i);
fs.writeFileSync(path.join(root,'public/assets/cta-real-sfx.wav'),wav);
console.log('SFX ready: '+count+' character/click events, '+(total/sampleRate).toFixed(2)+'s');
