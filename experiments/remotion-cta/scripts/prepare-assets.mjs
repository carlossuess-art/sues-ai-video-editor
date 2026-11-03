import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const home=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const plan=JSON.parse(fs.readFileSync(path.join(home,'src/plan.json'),'utf8'));
const pub=path.join(home,'public');
fs.mkdirSync(path.join(pub,'assets'),{recursive:true});
fs.mkdirSync(path.join(pub,'fonts'),{recursive:true});

for(const name of ['Montserrat-Bold.ttf','Montserrat-ExtraBold.ttf']){
  const source=path.resolve(home,'../../assets/fonts/montserrat',name);
  if(!fs.existsSync(source)) throw new Error('Fuente del repositorio no disponible: '+source);
  fs.copyFileSync(source,path.join(pub,'fonts',name));
}
const sampleRate=24000, channels=1;
const n=Math.ceil((plan.totalFrames/plan.fps)*sampleRate);
const samples=new Float32Array(n);
let seed=20261103;
const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)*2-1;
const click=(time,gain=.25)=>{
  const at=Math.round(time*sampleRate);
  for(let i=0;i<650 && i+at<n;i++){
    const e=Math.exp(-i/145);
    const t=i/sampleRate;
    const value=(rand()*.68+Math.sin(2*Math.PI*200*t)*.3)*e*gain;
    samples[at+i]+=value;
  }
};
const sweep=(time,gain=.14)=>{
  const at=Math.round(time*sampleRate);
  for(let i=0;i<4800 && at+i<n;i++){
    const x=i/4800,env=Math.sin(Math.PI*x)**2;
    samples[at+i]+=rand()*env*gain*.3;
  }
};
for(const line of plan.typingLines){
 for(let k=0;k<line.text.length;k++){
  if(line.text[k]===' ') continue;
  const local=line.start+Math.ceil((k+1)*line.duration/line.text.length);
  click((plan.scenes.typewriter.start+local)/plan.fps,.22);
 }
}
sweep(plan.scenes.typewriter.start/plan.fps,.10);
sweep(plan.scenes.instagram.start/plan.fps,.17);
click((plan.scenes.instagram.start+plan.instagramClickLocalFrame)/plan.fps,.53);
const bytes=44+samples.length*2;
const data=Buffer.alloc(bytes);
data.write('RIFF',0);
data.writeUInt32LE(bytes-8,4);
data.write('WAVEfmt ',8);
data.writeUInt32LE(16,16);
data.writeUInt16LE(1,20);
data.writeUInt16LE(channels,22);
data.writeUInt32LE(sampleRate,24);
data.writeUInt32LE(sampleRate*2,28);
data.writeUInt16LE(2,32);
data.writeUInt16LE(16,34);
data.write('data',36);
data.writeUInt32LE(samples.length*2,40);
for(let i=0;i<samples.length;i++){
 const peak=Math.max(-1,Math.min(1,samples[i]));
 data.writeInt16LE(Math.round(peak*32767),44+i*2);
}
fs.writeFileSync(path.join(pub,'assets','sfx.wav'),data);
console.log('Fuentes locales y SFX generados: '+(bytes/1024).toFixed(0)+' KiB. Sin APIs ni créditos.');
