// Run a validated batch against an existing private editable project; never
// mutate the source or the running production service. Keep immutable undo.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {applyCommandBatch,projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';
import {resolveCatalogAsset,enrichCatalog} from '../../src/engine-next/fablecut-resource-search.js';
const require=createRequire(import.meta.url);
const [root,engine,source,requestFile,destination]=process.argv.slice(2);
if(!destination)throw Error('Usage: root engine source request.json destination');
const base=fs.realpathSync(root),src=fs.realpathSync(source),out=path.resolve(destination),parent=fs.realpathSync(path.dirname(out));
if(!src.startsWith(base+'/')||parent!==base+'/automation-v1'||fs.existsSync(out)||src===out)throw Error('Unsafe or existing clone destination');
const sourceFile=src+'/project.json',original=fs.readFileSync(sourceFile,'utf8'),p=JSON.parse(original);
const native=require(path.join(engine,'project-ops.js')),catalog=enrichCatalog(JSON.parse(fs.readFileSync(base+'/automation-v1/resource-catalog.json')),{root:base+'/library',sfxIndex:JSON.parse(fs.readFileSync(base+'/library/sfx/DAEDAL_SFX_INDEX.json')),vfxIndex:JSON.parse(fs.readFileSync(base+'/daedal-vfx-originals/DAEDAL_VFX_INDEX.json'))});
const request=JSON.parse(fs.readFileSync(requestFile,'utf8'));
const r=applyCommandBatch(p,request,{native,resolveAsset:id=>resolveCatalogAsset(catalog,base+'/library',id)});
const links=new Map();
for(const m of p.media){
 if(!/^\/media\/[A-Za-z0-9_.% -]+$/.test(m.src)||decodeURIComponent(m.src).includes('..'))throw Error('Unsupported media URL '+m.id);
 const name=decodeURIComponent(m.src.slice(7)),file=fs.realpathSync(path.join(src,'media',name));
 if(!file.startsWith(base+'/')||!fs.statSync(file).isFile()||name.includes('/'))throw Error('Missing/unsafe source media '+m.id);
 links.set(name,file);
}
for(const a of r.assets){const name=a.src.slice(7);if(links.has(name)&&links.get(name)!==a.file)throw Error('Media collision');links.set(name,a.file)}
if(fs.readFileSync(sourceFile,'utf8')!==original)throw Error('Source changed during preparation');
const tmp=fs.mkdtempSync(parent+'/.command-clone-');
try{
 fs.mkdirSync(tmp+'/media');for(const [name,file] of links)fs.symlinkSync(file,tmp+'/media/'+name);
 fs.writeFileSync(tmp+'/project.json',JSON.stringify(r.project,null,2));
 fs.writeFileSync(tmp+'/execution-receipts.json',JSON.stringify({sourceFingerprint:projectFingerprint(p),resultFingerprint:projectFingerprint(r.project),sourceRevision:p.revision,resultRevision:r.project.revision,receipts:r.receipts,request,qaOnly:true},null,2));
 fs.writeFileSync(tmp+'/undo.json',JSON.stringify(r.undo));
 if(fs.existsSync(out))throw Error('Destination appeared concurrently');
 fs.renameSync(tmp,out);
}catch(e){fs.rmSync(tmp,{recursive:true,force:true});throw e}
console.log(JSON.stringify({revision:r.project.revision,clips:r.project.clips.length,media:r.project.media.length,receipts:r.receipts}));
