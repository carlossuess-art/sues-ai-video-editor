import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
test('deployment boots an upload-ready shell without private media and reuses prepared dependencies',()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-deploy-')),setup=join(root,'setup'),release=join(root,'release'),bin=join(root,'bin'),source=join(setup,'fuente.test/source');
 try{
  for(const p of [source+'/node_modules/ajv',release+'/scripts/deploy',release+'/examples/projects',bin])mkdirSync(p,{recursive:true});
  const sha='a'.repeat(40);writeFileSync(join(setup,'fuente-directorio.txt'),source);writeFileSync(join(setup,'fuente-commit.txt'),sha);
  writeFileSync(source+'/node_modules/ajv/package.json','{}');writeFileSync(source+'/package-lock.json','{}');writeFileSync(release+'/package-lock.json','{}');
  writeFileSync(release+'/examples/projects/calma-local.example.json',readFileSync('examples/projects/calma-local.example.json'));
  for(const [name,script] of Object.entries({git:`if [ "$1" = "-C" ] && [ "$2" = "${release}" ]; then echo ${sha}; exit 0; fi\n[ "$1" = "-c" ] && [ "$2" = "safe.directory=${source}" ] || exit 91\necho ${sha}`,docker:'if [ "$1 $2" = "image inspect" ]; then exit 0; fi\nif [ "$1 $2" = "container inspect" ]; then exit 1; fi\necho "$*" >>"'+root+'/docker-calls"\nexit 0',chown:'exit 0',ss:'exit 0',curl:'exit 0'}))writeFileSync(join(bin,name),'#!/bin/bash\n'+script+'\n',{mode:0o755});
  const script=readFileSync('scripts/deploy/prepare-service.sh','utf8').replaceAll('/opt/sues-video-setup',setup);writeFileSync(release+'/scripts/deploy/prepare-service.sh',script);
  const result=spawnSync('bash',[release+'/scripts/deploy/prepare-service.sh',setup],{encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH}});
  assert.equal(result.status,0,result.stderr);assert.match(readFileSync(setup+'/estado-servicio.txt','utf8'),/ARRANCADO LOOPBACK: subida disponible/);assert.match(result.stdout,/PENDIENTE: original.mp4/);
  assert.equal(readFileSync(source+'/package-lock.json','utf8'),'{}');const calls=readFileSync(root+'/docker-calls','utf8');assert.match(calls,/run -d --name sues-video-editor/);assert.ok(!calls.includes('scripts/app/doctor.mjs'));assert.ok(!calls.includes('npm'));assert.ok(!calls.includes('caddy'));assert.ok(!calls.includes('whatsapp'));
  const config=JSON.parse(readFileSync(setup+'/editor/project.json'));assert.equal(config.sourcePath,'/state/media/original.mp4');assert.equal(config.templatePath,'/app/examples/templates/sues-calma.template.json');
 }finally{rmSync(root,{recursive:true,force:true});}
});


test('per-invocation safe.directory handles the actual cross-owner Git repository without changing global config',()=>{
 const root=mkdtempSync(join(tmpdir(),'sues-git-owner-')),source=join(root,'source'),config=join(root,'gitconfig');
 try{
  mkdirSync(source);writeFileSync(config,'# Existing operator configuration\n');
  const env={...process.env,GIT_CONFIG_GLOBAL:config,GIT_CONFIG_NOSYSTEM:'1'};
  const run=args=>spawnSync('git',args,{encoding:'utf8',env});
  assert.equal(run(['init','-q',source]).status,0);
  assert.equal(run(['-C',source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-qm','fixture']).status,0);
  const expected=run(['-C',source,'rev-parse','HEAD']).stdout.trim();
  // Git's own test hook reproduces ownership rejection without privileged chown.
  env.GIT_TEST_ASSUME_DIFFERENT_OWNER='1';
  const blocked=run(['-C',source,'rev-parse','HEAD']);assert.notEqual(blocked.status,0);assert.match(blocked.stderr,/dubious ownership/);
  const checked=run(['-c','safe.directory='+source,'-C',source,'rev-parse','HEAD']);assert.equal(checked.status,0,checked.stderr);assert.equal(checked.stdout.trim(),expected);
  assert.equal(readFileSync(config,'utf8'),'# Existing operator configuration\n');
 }finally{rmSync(root,{recursive:true,force:true});}
});
