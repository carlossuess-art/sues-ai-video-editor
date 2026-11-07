#!/usr/bin/env node
// Narrow proof-of-concept only. The real 49-operation Film Director contract
// remains authoritative; no ignored operation is silently "completed" here.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,statSync,existsSync} from 'node:fs';
import {resolve,join,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {buildEngineNextLedger} from '../../src/engine-next/engine-capabilities.js';
const EXPECTED='9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad';
const args=Object.fromEntries(process.argv.slice(2).map(v=>{const a=v.indexOf('=');return a<0?[v,true]:[v.slice(0,a),v.slice(a+1)]}));
const required=['--source','--story','--out','--child','--gif','--audio'];
for(const key of required)if(!args[key])throw Error('Missing '+key+'; use --source= --story= --out= --child= --gif= --audio=');
const dir=resolve(String(args['--out'])),src=resolve(String(args['--source']));
if(dir.startsWith('/opt/sues-video-setup/editor/jobs')||dir.includes('/production/')||dir==='/'||dir==='/opt')throw Error('Unsafe POC output dir');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
if(sha(src)!==EXPECTED)throw Error('Source SHA mismatch; no synthetic substitute');
const story=JSON.parse(readFileSync(args['--story'],'utf8'));
const ledger=buildEngineNextLedger(story,{sourceSha256:EXPECTED});
if(ledger.operationCount!==49||ledger.sceneCount!==7)throw Error('Expect exactly 49 preserved operations / 7 scenes');
mkdirSync(join(dir,'media'),{recursive:true,mode:0o700});
const sources=[
 {id:'m_sues_158404_video',kind:'video',path:src,name:'Original Reel 158404',dur:73.766667,target:'sues-158404-original.mp4'},
 {id:'m_sues_158404_audio',kind:'audio',path:resolve(String(args['--audio'])),name:'Original Reel 158404 audio',dur:73.766667,target:'sues-158404-voice.m4a'},
 {id:'m_sues_158404_child',kind:'image',path:resolve(String(args['--child'])),name:'Niño intentando encajar (behind Carlos, matte required)',dur:4,target:'sues-158404-child.jpg'},
 {id:'m_sues_158404_hand',kind:'video',path:resolve(String(args['--gif'])),name:'Mano stop alpha; required QA',dur:0.96,target:'sues-158404-hand-alpha.mov'}
];
for(const m of sources){const target=join(dir,'media',m.target);if(!existsSync(target))copyFileSync(m.path,target);if(sha(m.path)!==sha(target))throw Error('Asset copy changed '+m.id);}
const media=sources.map(m=>({id:m.id,kind:m.kind,name:m.name,src:'/media/'+m.target,
 ...(m.kind==='video'?{duration:m.dur,width:m.id.endsWith('_video')?1080:256,height:m.id.endsWith('_video')?1920:256,fps:30}:m.kind==='audio'?{duration:m.dur}:{}),
 size:statSync(join(dir,'media',m.target)).size}));
const clips=[
 {id:'sues_video_source',mediaId:media[0].id,kind:'video',track:'V1',start:0,in:0,duration:73.766667,
   props:{fit:'cover'},locked:true,name:'ORIGINAL · do not cut without Film Director approval'},
 {id:'sues_audio_original',mediaId:media[1].id,kind:'audio',track:'A1',start:0,in:0,duration:73.766667,props:{volume:1},locked:true,
   name:'AUTHENTIC VOICE · protect all syllables'},
 {id:'sues_b02_child_review_only',mediaId:media[2].id,kind:'image',track:'V2',start:9.5,in:0,duration:4,
  props:{fit:'cover',scale:0.65,x:300},disabled:true,
  name:'B02 · DISABLED UNTIL TRUE BACKGROUND MATTE / VISIBILITY VERIFIED'},
 {id:'sues_alpha_hand_review_only',mediaId:media[3].id,kind:'video',track:'V3',start:22.88,in:0,duration:0.96,
  props:{fit:'contain',scale:0.33,x:140,y:210},disabled:true,
  name:'GIF STOP · DISABLED UNTIL ALPHA / PLACEMENT VERIFIED'},
 {id:'sues_title_after_word',kind:'text',track:'V4',start:2.28,in:0,duration:0.85,
  props:{text:'PERDERTE A TI MISMO',font:'Montserrat',bold:true,fontSize:72,color:'#FF7A18',strokeWidth:3,strokeColor:'#111111',y:-490},
  name:'TITLE · voice meaning completed at 2.28 s'}
];
const project={
 name:'SUES 158404 · ENGINE NEXT POC · NOT APPROVED',width:1080,height:1920,fps:30,
 revision:1,panSchema:1,background:'#17191D',
 tracks:[{id:'V4',kind:'video'},{id:'V3',kind:'video'},{id:'V2',kind:'video'},{id:'V1',kind:'video'},{id:'A1',kind:'audio'}],
 media,clips,markers:[{t:9.5,label:'B02 needs matte / child visibility',color:'orange'},
 {t:22.88,label:'GIF alpha QA',color:'orange'},{t:35.2,label:'M02 future HyperFrames source',color:'purple'}],
 delivery:{preset:'instagram-reels'},master:{gain:0},
};
writeFileSync(join(dir,'project.json'),JSON.stringify(project,null,2)+'\n',{mode:0o600});
writeFileSync(join(dir,'sues-engine-next-manifest.json'),JSON.stringify({
 status:'PROOF_OF_EDITABLE_TIMELINE_ONLY_NOT_CINEMATIC_QA',
 originalSourceSha256:EXPECTED,filmDirectorRevision:'c016c272a01f91f70edaa42d2612c14c915950210232760b0c478ca56c3bd1ff',
 approvedCreativeOperations:ledger.operationCount,
 materializedPocClips:clips.length,
 omittedOperations:ledger.operations.map(o=>o.operationId),
 reason:'Each future operation still requires mapping, no operation is approved by this sample',
 sourceEvidence:sources.map(m=>({id:m.id,sha256:sha(m.path)}))
},null,2)+'\n',{mode:0o600});
console.log('POC_PROJECT_CREATED',JSON.stringify({directory:dir,clips:clips.length,media:media.length,sourceSha256:EXPECTED,approvedOperationsPreserved:ledger.operationCount,disabledUnsafeClips:2}));