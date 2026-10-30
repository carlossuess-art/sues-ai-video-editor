// Run only against an explicitly selected disposable QA project. Browser actions are real; no acceptance of all eight tools is inferred.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.SUES_QA_PLAYWRIGHT??'playwright');
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const output=process.env.SUES_QA_OUTPUT_DIR??'runtime/manual-qa';mkdirSync(output,{recursive:true});
const [base,id]=process.argv.slice(2);if(!base||!id||!process.env.SUES_QA_TOKEN_FILE)throw Error('Usage: SUES_QA_TOKEN_FILE=... node SCRIPT BASE DISPOSABLE_PROJECT_ID');
const width=Number(process.env.SUES_QA_WIDTH??393);const b=await chromium.launch({...(process.env.SUES_QA_CHROME?{executablePath:process.env.SUES_QA_CHROME}:{}),headless:true,args:['--no-sandbox']});
try{const c=await b.newContext({viewport:{width,height:width===393?852:915},isMobile:true,hasTouch:true,serviceWorkers:'block'});
const auth=await c.request.post(base+'/api/session',{headers:{Authorization:'Bearer '+readFileSync(process.env.SUES_QA_TOKEN_FILE,'utf8').trim(),Origin:base}});assert.equal(auth.status(),200);
const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/?project='+id);await p.locator('#post-adjust').waitFor({timeout:90000});await p.locator('#post-adjust').click();
await p.locator('.manual-lane-captions .manual-layer-block').nth(5).click({force:true});
async function reveal(loc){for(let i=0;i<12&&!await loc.isVisible();i++){const prev=p.locator('.mobile-property-pager button').filter({hasText:'Anterior'});if(await prev.isVisible()&&await prev.isEnabled())await prev.click();else break;}for(let i=0;i<12&&!await loc.isVisible();i++)await p.locator('.mobile-property-pager button').filter({hasText:'Siguiente'}).click();assert.ok(await loc.isVisible());}
const font=p.getByLabel('Tamaño de fuente en píxeles del vídeo 1080 × 1920');
await font.waitFor({timeout:90000});
for(let i=0;i<180&&!await font.isEnabled();i++)await p.waitForTimeout(1000);
assert.ok(await font.isEnabled(),'font editor becomes ready');
console.log('FONT-READY');await reveal(p.getByLabel('Color y acabado'));await p.getByLabel('Color y acabado').selectOption({label:'Cian'});
for(let i=0;i<60&&!(await font.isEnabled());i++)await p.waitForTimeout(500);
await reveal(font);await font.fill('180');await font.press('Tab');
for(let i=0;i<60&&!(await font.isEnabled());i++)await p.waitForTimeout(500);
await reveal(p.getByRole('button',{name:'◆ Añadir keyframe',exact:true}));await p.getByRole('button',{name:'◆ Añadir keyframe',exact:true}).click();
for(let i=0;i<60&&!(await font.isEnabled());i++)await p.waitForTimeout(500);
const after=await font.inputValue();assert.ok(Math.abs(Number(after)-180)<=1,'180px retained after adding a neutral keyframe: '+after);
await reveal(font);await p.screenshot({path:output+'/regression-caption-'+width+'.png'});console.log('CAPTION-RACE-PASS',after);
await p.locator('#manual-layer-back').click();await p.locator('[data-adjust-kind="images"]').click();await p.locator('#adjust-add-resource').click();
const details=p.locator('#adjust-inspector details').first();if(await details.getAttribute('open')===null)await details.locator('summary').click();
const chooser=details.locator('select');const opts=await chooser.locator('option').all();await chooser.selectOption(await opts[3].getAttribute('value'));await details.getByRole('button',{name:'Añadir aquí',exact:true}).click();
const state=await p.evaluate(()=>window.suesManualAdjust.liveState().draft);assert.deepEqual(state.imageEvents[0].box,{left:120,right:900,top:140,bottom:420});
for(let i=0;i<90;i++){if(await p.evaluate(()=>window.suesLivePreview.isReady()&&!window.suesLivePreview.isLoading()&&window.suesLivePreview.scene()?.images?.length))break;await p.waitForTimeout(1000);}
const scene=await p.evaluate(()=>({ready:window.suesLivePreview.isReady(),images:window.suesLivePreview.scene()?.images?.length,message:document.querySelector('.live-preview-message')?.textContent}));
assert.equal(scene.images,1);assert.ok(!/no se detectó/.test(scene.message));assert.deepEqual(errors,[]);await p.screenshot({path:output+'/regression-image-'+width+'.png'});writeFileSync(output+'/regression-ui-result.json',JSON.stringify({after,scene,errors},null,2));console.log('MANUAL-IMAGE-NO-FACE-PASS',JSON.stringify(scene));

const touch=p.locator('.touch-edit-target');await touch.waitFor({state:'visible'});let rect=await touch.boundingBox();await p.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await p.mouse.down();await p.mouse.move(rect.x+rect.width/2+12,rect.y+rect.height/2+8,{steps:5});await p.mouse.up();
assert.equal(await p.evaluate(()=>window.suesManualAdjust.liveState().selected),'image-0','drag retains image selection');
await p.waitForFunction(()=>!window.suesLivePreview.isLoading(),{},{timeout:90000});rect=await touch.boundingBox();const initialBox=await p.evaluate(()=>window.suesManualAdjust.liveState().draft.imageEvents[0].box),cdp=await c.newCDPSession(p),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-12,y,id:1},{x:x+12,y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-18,y,id:1},{x:x+18,y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
const resized=await p.evaluate(()=>window.suesManualAdjust.liveState().draft.imageEvents[0].box);assert.ok(resized.right-resized.left>initialBox.right-initialBox.left,'touch pinch enlarges actual image');assert.equal(await p.evaluate(()=>window.suesManualAdjust.liveState().selected),'image-0');console.log('IMAGE-DRAG-PINCH-SELECTION-PASS');
await p.locator('#manual-layer-back').click();await p.locator('[data-adjust-kind="effects"]').click();await p.locator('#adjust-add-resource').click();
await p.getByLabel('Efecto para añadir').selectOption('warm');await p.getByRole('button',{name:'Añadir efecto aquí',exact:true}).click();
const start=p.getByLabel('Inicio del efecto (s)');await reveal(start);await start.fill('5');const applyEffect=p.getByRole('button',{name:'Aplicar tiempo del efecto',exact:true});await reveal(applyEffect);await applyEffect.click();
const effectType=p.getByLabel('Tipo de efecto');await reveal(effectType);await effectType.selectOption('blur');
let transitions=await p.evaluate(()=>window.suesManualAdjust.liveState().draft.transitions);assert.equal(transitions.at(-1).type,'blur');assert.equal(transitions.at(-1).start,5);
await p.screenshot({path:output+'/regression-effects-'+width+'.png'});console.log('EFFECT-ADD-MOVE-MODIFY-PASS');
const removeEffect=p.getByRole('button',{name:'Quitar efecto',exact:true});await reveal(removeEffect);await removeEffect.click();assert.equal((await p.evaluate(()=>window.suesManualAdjust.liveState().draft.transitions)).length,0);await p.locator('#adjust-undo').click();console.log('EFFECT-REMOVE-UNDO-PASS');
await p.locator('#adjust-preview').click();await p.locator('#adjust-fragment-video').waitFor({state:'visible',timeout:240000});
const media=await p.locator('#adjust-fragment-video').getAttribute('src');const response=await c.request.get(base+media);assert.equal(response.status(),200);writeFileSync(output+'/corrected-fragment.mp4',await response.body());
await p.screenshot({path:output+'/regression-fragment-'+width+'.png'});console.log('CORRECTED-FRAGMENT-MP4-PASS');
await c.close();}finally{await b.close();}
