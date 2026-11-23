import test from 'node:test';import assert from 'node:assert/strict';
import {safeNativeNleRead,auditNativeNleWebContract} from '../../src/engine-next/native-nle-web-contract.js';
test('read-only eligible requests never include version restoration, uploads, PUT or arbitrary paths',()=>{
 assert.equal(safeNativeNleRead('GET','/api/project'),true);
 assert.equal(safeNativeNleRead('GET','/api/versions'),true);
 for(const [method,path] of [['POST','/api/versions'],['PUT','/api/project'],['POST','/api/upload'],['POST','/api/import-url'],['GET','/api/versions/file'],['GET','/api/denoise'],['DELETE','/api/project']]){
  assert.equal(safeNativeNleRead(method,path),false,method+' '+path);
 }
});
test('inventories static modules and explicit API surface but never enables a generic proxy',()=>{
 const html='<script src="app.js"></script><script src="mask.js"></script><link href="/icons/favicon-32.png"><link href="style.css">';
 const js='fetch("/api/project");fetch("/api/versions");fetch("/api/upload");fetch("/api/import-url");';
 const x=auditNativeNleWebContract(html,js);assert.equal(x.staticAssetCount,4);assert.equal(x.explicitApiPathCount,4);
 assert.deepEqual(x.readOnlyEligible,['/api/project','/api/versions']);
 assert.deepEqual(x.requiresIndividualWriteGate,['/api/import-url','/api/upload']);
 assert.equal(x.unrestrictedReverseProxyAllowed,false);assert.equal(x.nativeUiExposed,false);
});
test('refuses remote assets, path traversal and excessive source input',()=>{
 assert.throws(()=>auditNativeNleWebContract('<script src="https://example.com/x.js">',''));
 assert.throws(()=>auditNativeNleWebContract('<script src="../app.js">',''));
 assert.throws(()=>auditNativeNleWebContract('a'.repeat(2_000_001),''));
});
