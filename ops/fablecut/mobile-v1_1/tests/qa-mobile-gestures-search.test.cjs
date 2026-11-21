"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"stage"),c=require("./stage/sues-mobile-catalog");
test("Spanish aliases resolve the real volume, masks and split",()=>{
 assert.equal(c.search("bajar sonido")[0].id,"volume");
 assert.equal(c.search("máscaras")[0].id,"mask");
 assert.equal(c.search("hacer zoom").some(t=>t.id==="scale"),true);
 assert.equal(c.search("dividir")[0].id,"split");
});
test("mobile JS connects to native controls, not duplicate sliders",()=>{
 const search=fs.readFileSync(root+"/sues-mobile-search.js","utf8");
 assert.ok(search.includes('inspector.querySelector'));
 assert.ok(search.includes('data-k='));
 assert.ok(search.includes('window.SuesToolSearch'));
 const gestures=fs.readFileSync(root+"/sues-mobile-gestures.js","utf8");
 for(const name of ["setZoom(","setTime(","startClipGesture(","pushUndo(","selectClip("])
  assert.ok(gestures.includes(name),name);
 const html=fs.readFileSync(root+"/index.html","utf8");
 for(const s of ["sues-mobile-mcp.js","sues-mobile-catalog.js","sues-mobile-search.js","sues-mobile-gestures.js","sues-mobile-remote.js"])
  assert.ok(html.includes('src="'+s+'"'),s);
});

