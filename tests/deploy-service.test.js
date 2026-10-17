import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
test('deployment stops at missing private assets, reuses dependencies and never launches Docker service',()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-deploy-')),setup=join(root,'setup'),release=join(root,'release'),bin=join(root,'bin'),source=join(setup,'fuente.test/source');
 try{
  for(const p of [source+'/node_modules/ajv',release+'/scripts/deploy',release+'/examples/projects',bin])mkdirSync(p,{recursive:true});
  const sha='a'.repeat(40);writeFileSync(join(setup,'fuente-directorio.txt'),source);writeFileSync(join(setup,'fuente-commit.txt'),sha);
  writeFileSync(source+'/node_modules/ajv/package.json','{}');writeFileSync(source+'/package-lock.json','{}');writeFileSync(release+'/package-lock.json','{}');
  writeFileSync(release+'/examples/projects/calma-local.example.json',readFileSync('examples/projects/calma-local.example.json'));
  for(const [name,script] of Object.entries({git:`echo ${sha}`,docker:'if [ "$1 $2" = "image inspect" ]; then exit 0; fi\nif [ "$1 $2" = "container inspect" ]; then exit 1; fi\necho UNEXPECTED_DOCKER_RUN >&2; exit 90',chown:'exit 0'}))writeFileSync(join(bin,name),'#!/bin/bash\n'+script+'\n',{mode:0o755});
  const script=readFileSync('scripts/deploy/prepare-service.sh','utf8').replaceAll('/opt/sues-video-setup',setup);writeFileSync(release+'/scripts/deploy/prepare-service.sh',script);
  const result=spawnSync('bash',[release+'/scripts/deploy/prepare-service.sh',setup],{encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH}});
  assert.equal(result.status,0,result.stderr);assert.match(readFileSync(setup+'/estado-servicio.txt','utf8'),/PENDIENTE MEDIOS/);assert.match(result.stdout,/PENDIENTE: original.mp4/);
  assert.equal(readFileSync(source+'/package-lock.json','utf8'),'{}');assert.ok(!result.stderr.includes('UNEXPECTED_DOCKER_RUN'));
  const config=JSON.parse(readFileSync(setup+'/editor/project.json'));assert.equal(config.sourcePath,'/state/media/original.mp4');assert.equal(config.templatePath,'/app/examples/templates/sues-calma.template.json');
 }finally{rmSync(root,{recursive:true,force:true});}
});
