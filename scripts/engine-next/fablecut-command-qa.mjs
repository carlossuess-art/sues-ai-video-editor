// Explicit private QA runner; source and destination are inside a trusted root.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {applyCommandBatch,projectFingerprint,undoCommandBatch} from '../../src/engine-next/fablecut-command-batch.js';
import {resolveCatalogAsset,searchResources,enrichCatalog} from '../../src/engine-next/fablecut-resource-search.js';
const require=createRequire(import.meta.url);
const [root,engine,source,dest]=process.argv.slice(2);
if(!root||!engine||!source||!dest)throw Error('root engine source dest required');
const base=fs.realpathSync(root),src=fs.realpathSync(source),out=path.resolve(dest);
if(!src.startsWith(base+'/')||!out.startsWith(base+'/automation-v1/')||fs.existsSync(out)||fs.realpathSync(path.dirname(out))!==base+'/automation-v1')throw Error('Unsafe QA location');
const native=require(path.join(engine,'project-ops.js')),catalog=enrichCatalog(JSON.parse(fs.readFileSync(base+'/automation-v1/resource-catalog.json')),{root:base+'/library',sfxIndex:JSON.parse(fs.readFileSync(base+'/library/sfx/DAEDAL_SFX_INDEX.json')),vfxIndex:JSON.parse(fs.readFileSync(base+'/daedal-vfx-originals/DAEDAL_VFX_INDEX.json'))});
const raw=JSON.parse(fs.readFileSync(src+'/project.json')),video=raw.media.find(m=>m.id==='m_sues_158404_video'),voice=raw.media.find(m=>m.id==='m_sues_158404_audio');
if(!video||!voice)throw Error('QA source missing');
const p={name:'SUES private command QA',width:1080,height:1920,fps:30,revision:1,background:'#000000',tracks:[{id:'V3',kind:'video'},{id:'V2',kind:'video'},{id:'V1',kind:'video'},{id:'A1',kind:'audio'},{id:'A2',kind:'audio'},{id:'A3',kind:'audio'}],media:[video,voice],clips:[{id:'base',mediaId:video.id,kind:'video',track:'V1',start:0,in:0,duration:3,props:{volume:0,fit:'cover',scale:1}},{id:'voice',mediaId:voice.id,kind:'audio',track:'A1',start:0,in:0,duration:3,props:{volume:1},locked:true}],inPoint:.5,outPoint:1.5};
const riser=searchResources(catalog,'riser',{type:'audio',limit:50}).find(x=>x.relativePath.includes('AirRiser_029'))??catalog.assets.find(x=>x.relativePath.includes('AirRiser_029'));
const light=catalog.assets.find(x=>x.relativePath.includes('Burn_05_Golden_Flash'));
const resolver=id=>resolveCatalogAsset(catalog,base+'/library',id);
const commands=[{id:'riser',action:'add_sfx',assetId:riser.id,start:.5,duration:.8,track:'A2',volume:.6},{id:'gold',action:'add_vfx',assetId:light.id,start:.5,duration:1,track:'V2',scale:1,opacity:.65,fit:'cover',blend:'screen'},{id:'zoom',action:'animate',clipId:'base',channel:'scale',keys:[{t:0,v:1},{t:1.5,v:1.08,ease:'ease-in-out'},{t:3,v:1}]},{id:'volume',action:'set_volume',clipId:'sues_cmd_'+(await import('node:crypto')).createHash('sha256').update(JSON.stringify('riser')).digest('hex').slice(0,24),volume:.5},{id:'fade',action:'transition',clipId:'sues_cmd_'+(await import('node:crypto')).createHash('sha256').update(JSON.stringify('gold')).digest('hex').slice(0,24),side:'in',type:'fade',duration:.2}];
const request={baseRevision:p.revision,baseFingerprint:projectFingerprint(p),commands},result=applyCommandBatch(p,request,{native,resolveAsset:resolver});
const before=JSON.stringify(p);let negative=0;
for(const bad of [{...request,baseRevision:0},{...request,commands:[...commands,{id:'bad',action:'unknown'}]},{...request,commands:[{...commands[0],start:.51}]},{...request,commands:[{...commands[0],assetId:'../evil'}]},{...request,commands:[{id:'bad',action:'set_volume',clipId:'voice',volume:.5}]}]){try{applyCommandBatch(p,bad,{native,resolveAsset:resolver});throw Error('unexpected success')}catch(e){if(e.message==='unexpected success')throw e;negative++}}
if(JSON.stringify(p)!==before||undoCommandBatch(result.project,result.undo).clips.length!==2)throw Error('atomicity/undo failed');
fs.mkdirSync(out);fs.mkdirSync(out+'/media');for(const m of p.media){const f=path.basename(m.src),real=fs.realpathSync(src+'/media/'+f);if(!real.startsWith(base+'/'))throw Error('Source media outside root');fs.symlinkSync(real,out+'/media/'+f)}
for(const a of result.assets)fs.symlinkSync(a.file,out+a.src);
fs.writeFileSync(out+'/project.json',JSON.stringify(result.project,null,2));fs.writeFileSync(out+'/execution-receipts.json',JSON.stringify({receipts:result.receipts,negative,undoVerified:true,request,license:'QA ONLY; catalog rights unverified'},null,2));fs.writeFileSync(out+'/undo.json',JSON.stringify(result.undo));
console.log(JSON.stringify({clips:result.project.clips.length,receipts:result.receipts,negative,undoVerified:true,search:searchResources(catalog,'teclado',{limit:3}).map(a=>a.relativePath)}));
