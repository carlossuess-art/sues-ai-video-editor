// Build a private, disposable candidate. This never edits, switches or deploys the source.
import {cpSync,existsSync,lstatSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,realpathSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fileSha256} from '../../src/local-pipeline.js';
const repo=resolve(fileURLToPath(new URL('../..',import.meta.url))),baseArg=process.argv[2];
if(!baseArg||process.argv.length!==3){console.error('Usage: node scripts/master-director/build-isolated-candidate.mjs /absolute/path/to/editor-release');process.exit(2);}
const base=realpathSync(baseArg),manifest=JSON.parse(readFileSync(join(repo,'scripts/master-director/production-baseline-sha256.json'),'utf8'));
if(!lstatSync(base).isDirectory()||base===repo||base.startsWith(repo+'/'))throw Error('Invalid editor baseline');
for(const [name,sha] of Object.entries(manifest)){
 const f=join(base,name),st=lstatSync(f);if(!st.isFile()||st.isSymbolicLink()||fileSha256(f)!==sha)throw Error('Editor baseline changed: '+name);
}
const full=JSON.parse(readFileSync(join(repo,'scripts/master-director/production-full-sha256.json'),'utf8'));
const seen=[];
function collect(relative){
 const path=join(base,relative),st=lstatSync(path);if(st.isSymbolicLink())throw Error('Unexpected symlink in baseline: '+relative);
 if(st.isDirectory()){for(const name of readdirSync(path))collect(join(relative,name));return;}
 if(!st.isFile())throw Error('Unexpected non-file in baseline: '+relative);seen.push(relative);
 if(full.files[relative]!==fileSha256(path))throw Error('Editor baseline changed: '+relative);
}
for(const root of full.roots)collect(root);
for(const name of ['package.json','package-lock.json'])collect(name);
if(seen.length!==Object.keys(full.files).length)throw Error('Editor baseline files missing');
const output=mkdtempSync('/tmp/sues-director-candidate-');
try{
 cpSync(base,output,{recursive:true,force:false,errorOnExist:false,verbatimSymlinks:true});
 for(const [name,sha] of Object.entries(full.files)){const file=join(output,name),st=lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||fileSha256(file)!==sha)throw Error('Baseline changed during copy: '+name);}
 const patch=spawnSync('patch',['-p1','--batch','--forward','--fuzz=0','-i',join(repo,'scripts/master-director/production-baseline.patch')],{cwd:output,encoding:'utf8'});
 if(patch.status!==0)throw Error('Patch did not apply exactly: '+patch.stderr+' '+patch.stdout);
 for(const name of readdirSync(join(repo,'src')).filter(n=>/^master-director-.*\.js$/.test(n)))cpSync(join(repo,'src',name),join(output,'src',name),{errorOnExist:false});
 for(const name of readdirSync(join(repo,'tests')).filter(n=>/^master-director-.*\.test\.js$/.test(n)))cpSync(join(repo,'tests',name),join(output,'tests',name),{errorOnExist:false});
 cpSync(join(repo,'docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md'),join(output,'docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md'));
 for(const name of ['master-director-policy-check.mjs','smoke_master_director.mjs','smoke_master_native.mjs'])cpSync(join(repo,'scripts/app',name),join(output,'scripts/app',name));
 mkdirSync(join(output,'experiments/remotion-cta'),{recursive:true});
 cpSync(join(repo,'experiments/remotion-cta/src'),join(output,'experiments/remotion-cta/src'),{recursive:true});
 for(const name of ['package.json','package-lock.json','tsconfig.json'])if(existsSync(join(repo,'experiments/remotion-cta',name)))cpSync(join(repo,'experiments/remotion-cta',name),join(output,'experiments/remotion-cta',name));
 console.log(JSON.stringify({status:'ISOLATED_CANDIDATE_BUILT',path:output,baseFilesVerified:seen.length,renderRuntime:'not-installed',deployed:false}));
}catch(error){console.error('Candidate incomplete; retained for inspection at '+output);throw error;}
