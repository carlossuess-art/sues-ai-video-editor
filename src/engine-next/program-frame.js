/** Authenticated server-side still from the SAME native FableCut program canvas.
 * Not video playback, not an export, not cinematic QA. Exactly one Chrome process
 * may inspect a frame at a time; cache is keyed by FableCut project revision.
 */
function visualSemantics(p){
 // Browser startup may persist newly expanded default props, increasing revision
 // without changing the visible edit. Reject real modifications during capture.
 return JSON.stringify({name:p.name,width:p.width,height:p.height,fps:p.fps,background:p.background,
  tracks:(p.tracks||[]).map(t=>[t.id,t.kind,!!t.locked,!!t.hidden,!!t.muted]),
  media:(p.media||[]).map(m=>[m.id,m.kind,m.src,m.duration,m.width,m.height]),
  clips:(p.clips||[]).map(c=>[c.id,c.mediaId,c.kind,c.track,c.start,c.in,c.duration,!!c.disabled,!!c.locked,
    c.props?.x??0,c.props?.y??0,c.props?.scale??1,c.props?.rotation??0,c.props?.opacity??1,
    c.props?.fit??'contain',c.props?.text??'',c.props?.fontSize??72,c.props?.font??'Segoe UI',
    c.props?.color??'#ffffff',c.props?.blur??0,c.props?.volume??1])});
}
export class ProgramFrameBusy extends Error {constructor(){super('Program frame renderer busy');this.name='ProgramFrameBusy';}}
export class ProgramFrameRenderer {
 constructor({client,puppeteer,executablePath,timeoutMs=20000,maxCache=12}={}){
  if(!client||!puppeteer?.launch||typeof executablePath!=='string'||!executablePath.startsWith('/'))throw Error('Trusted local native-frame configuration required');
  this.client=client;this.puppeteer=puppeteer;this.executablePath=executablePath;
  this.timeoutMs=timeoutMs;this.maxCache=maxCache;this.cache=new Map();this.busy=false;
 }
 async capture({time,expectedRevision}={}){
  if(typeof time!=='number'||!Number.isFinite(time)||time<0||time>300)throw Error('Invalid requested frame time');
  if(!Number.isInteger(expectedRevision)||expectedRevision<0)throw Error('Invalid expected revision');
  const {data:project,projectId}=await this.client.getProject();
  if(project.revision!==expectedRevision)throw Error('Stale native frame revision');
  if(!projectId||!Number.isInteger(project.width)||!Number.isInteger(project.height)||project.width<1||project.height<1)throw Error('Native project invalid');
  const duration=Math.max(...(project.clips??[]).map(c=>Number(c.start||0)+Number(c.duration||0)),0);
  if(time>=duration)throw Error('Frame beyond project duration');
  const frame=Math.round(time*(project.fps||30)),key=projectId+':'+project.revision+':'+frame;
  if(this.cache.has(key))return {...this.cache.get(key),cached:true};
  if(this.busy)throw new ProgramFrameBusy();this.busy=true;
  let browser;
  try{
   browser=await this.puppeteer.launch({executablePath:this.executablePath,headless:true,
     args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader'],
     defaultViewport:{width:1400,height:900}});
   const page=await browser.newPage();
   await page.goto(this.client.baseUrl+'/',{waitUntil:'domcontentloaded',timeout:this.timeoutMs});
   await page.waitForFunction(()=>typeof setTime==='function'&&!!document.querySelector('#preview'),{timeout:this.timeoutMs});
   await page.evaluate(t=>setTime(t),frame/(project.fps||30));
   const canvas=await page.$('#preview');if(!canvas)throw Error('No native program canvas');
   let png;
   for(let attempt=0;attempt<12;attempt++){
    await new Promise(resolve=>setTimeout(resolve,350));
    png=Buffer.from(await canvas.screenshot({type:'png'}));
    if(png.length>5000)break;
   }
   if(!png||png.length<=5000)throw Error('Native program did not decode a valid frame');
   const {data:after,projectId:afterId}=await this.client.getProject();
   if(afterId!==projectId||visualSemantics(after)!==visualSemantics(project))
     throw Error('Native project contents changed while capturing the frame');
   // FableCut can persist harmless default-property normalization on startup.
   // Use the POST-capture revision as authority; never force-write a stale revision.
   if(!Number.isInteger(after.revision)||after.revision<project.revision)throw Error('Native revision went backward');
   const proof={projectId,revision:after.revision,time:frame/(project.fps||30),png,width:project.width,height:project.height,cinematicQA:false,cached:false};
   this.cache.set(projectId+':'+after.revision+':'+frame,proof);
   while(this.cache.size>this.maxCache)this.cache.delete(this.cache.keys().next().value);
   return proof;
  }finally{await browser?.close();this.busy=false;}
 }
}