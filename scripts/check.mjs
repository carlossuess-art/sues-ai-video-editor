import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${dir}/${e.name}`):/\.(m?js)$/.test(e.name)?[`${dir}/${e.name}`]:[]);
for(const file of [...files('src'),...files('scripts')]){
  const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status??1);
}
