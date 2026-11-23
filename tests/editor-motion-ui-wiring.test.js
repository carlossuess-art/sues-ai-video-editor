import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('same editor caption section hosts narrative review without another selector',()=>{
 const html=read('web/index.html');
 assert.ok(html.includes('id="caption-settings"'));
 assert.ok(html.includes('id="narrative-motion-panel"'));
 assert.ok(html.includes('id="captions"'));
 assert.ok(html.includes('src="/narrative-motion-panel.js"'));
 assert.ok(!html.includes('narrative-motion-upload-transcript'));
});
test('existing caption source-word IDs and job fingerprint are sent only on explicit button click',()=>{
 const app=read('web/app.js'),client=read('web/narrative-motion-panel.js');
 assert.ok(app.includes('sues:motion-context'));
 assert.ok(app.includes('wordIndexes:c.wordIndexes'));
 assert.ok(client.includes("button.addEventListener('click'"));
 assert.ok(client.includes("select[data-keyword]"));
 assert.ok(client.includes('sourceWordIndex'));
 assert.ok(client.includes("'x-sues-request':'editor'"));
 assert.ok(!client.includes('window.location.href'));
 assert.ok(!client.includes('innerHTML'));
});
test('only authenticated POST review endpoint; no editor mutation or media publish paths',()=>{
 const server=read('src/editor-server.js');
 assert.ok(server.includes("if(action==='motion-narrative'&&req.method==='POST')"));
 assert.ok(server.includes('buildEditorNarrativeMotionReview'));
 assert.ok(server.includes('source.inputs.source.sha256'));
 assert.ok(server.includes('job.fingerprint'));
 const start=server.indexOf("if(action==='motion-narrative'"),end=server.indexOf("if(action==='library-cues'",start);
 const handler=server.slice(start,end);
 assert.ok(!/jobs\.adjust\(|jobs\.create\(|render\(|applyCommandBatch\(|writeFileSync\(|publish\(/.test(handler));
});

test('HF preflight stays inside the existing captions panel and never writes a Reel',()=>{
 const html=read('web/index.html'),client=read('web/narrative-motion-panel.js');
 const server=read('src/editor-server.js');
 assert.ok(html.includes('id="narrative-motion-hf-preflight"'));
 assert.ok(html.includes('id="narrative-motion-hf-export"'));
 assert.ok(html.indexOf('id="narrative-motion-hf-preflight"')>html.indexOf('id="narrative-motion-panel"'));
 assert.ok(html.indexOf('id="narrative-motion-hf-preflight"')<html.indexOf('id="captions"'));
 assert.ok(client.includes("'/motion-hyperframes-preflight'")||
   client.includes("'/motion-hyperframes-preflight',{"));
 assert.ok(client.includes('PREPAR')||client.includes('HyperFrames'));
 assert.ok(client.includes('lastHF?.avMarkdown??lastReview.avMarkdown'));
 assert.ok(!client.includes('innerHTML'));
 const start=server.indexOf("if(action==='motion-hyperframes-preflight'&&req.method==='POST')");
 const end=server.indexOf("if(action==='library-cues'",start);
 assert.ok(start>0&&end>start);
 const route=server.slice(start,end);
 assert.ok(route.includes('prepareEditorHyperFramesPreflight'));
 assert.ok(route.includes('catalog.sourceTimeMap'));
 assert.ok(route.includes('catalog.timelineFingerprint'));
 assert.ok(!/jobs\.(?:create|adjust|render|apply)|applyCommandBatch\(|writeFileSync\(|publish\(|execFile\(/.test(route));
});
