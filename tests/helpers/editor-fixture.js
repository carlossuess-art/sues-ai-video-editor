import {mkdtempSync,writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
export function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'sues-editor-')),read=p=>JSON.parse(readFileSync(resolve('examples',p),'utf8'));
 const words='Ahora puedes detenerte y sentir. Después respira y escucha. Sigue con atención.'.split(' ').map((text,i)=>({text,start:2+i*.65,end:2+(i+1)*.65}));
 const values={template:read('templates/sues-calma.template.json'),brandKit:read('brand-kit.sues.json'),catalog:read('motions/catalog.sample.json'),transcript:{version:'1.0',language:'es',sourceDuration:24,words},camera:{keyframes:[0,24].map(time=>({time,x:0,y:0,width:1080,height:1920,zoom:1}))},vision:{frames:[0,24].map(time=>({time,frameWidth:1080,frameHeight:1920,faces:[{x:400,y:600,width:280,height:400,score:1,leftEye:{x:520,y:768},rightEye:{x:560,y:768}}]}))}};
 const config={title:'Prueba local',source:{duration:24,width:1080,height:1920},sourcePath:'source.mp4',fontDirectory:'fonts'};
 writeFileSync(join(dir,'source.mp4'),'fixture');mkdirSync(join(dir,'fonts'));for(const name of ['OpenSans.ttf','OpenSans-Bold.ttf','OFL.txt'])writeFileSync(join(dir,'fonts',name),'font fixture');
 for(const [key,value]of Object.entries(values)){writeFileSync(join(dir,key+'.json'),JSON.stringify(value));config[key+'Path']=key+'.json';}
 writeFileSync(join(dir,'project.json'),JSON.stringify(config));return {dir,profiles:{test:join(dir,'project.json')}};
}
