import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {googleAuth,readGoogleConfig,GOOGLE_CALLBACK} from '../src/editor-google-auth.js';
import {googleFixture,googleConfig} from './helpers/google-fixture.js';
const origin='https://editor.suesholistics.com';
function flow(){const f=googleFixture(),auth=googleAuth({config:googleConfig,publicOrigin:origin,fetcher:f.fetcher}),start=auth.begin(),url=new URL(start.url);f.setNonce(url.searchParams.get('nonce'));return {f,auth,start,url,params:new URLSearchParams({state:url.searchParams.get('state'),code:'test-code'}),cookies:start.cookie.split(';')[0]};}
test('Google uses code, PKCE, nonce, canonical HTTPS callback and minimal scopes',async()=>{
 const {auth,start,url,params,cookies,f}=flow();
 assert.equal(url.origin,'https://accounts.google.com');assert.equal(url.searchParams.get('redirect_uri'),origin+GOOGLE_CALLBACK);assert.equal(url.searchParams.get('scope'),'openid email');assert.equal(url.searchParams.get('response_type'),'code');assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.match(url.searchParams.get('code_challenge'),/^[\w-]{43}$/);assert.match(start.cookie,/HttpOnly; Secure; SameSite=Lax/);
 await auth.complete(params,cookies);assert.equal(f.calls(),1);await assert.rejects(auth.complete(params,cookies));
});
test('browser binding, state, denial, expiry and replay fail closed',async()=>{
 let x=flow();await assert.rejects(x.auth.complete(x.params,'sues_google=wrong'));assert.equal(x.f.calls(),0);await x.auth.complete(x.params,x.cookies);
 x=flow();x.params.set('error','access_denied');await assert.rejects(x.auth.complete(x.params,x.cookies));await assert.rejects(x.auth.complete(x.params,x.cookies));assert.equal(x.f.calls(),0);
 let time=Date.now();const f=googleFixture(),auth=googleAuth({config:googleConfig,publicOrigin:origin,fetcher:f.fetcher,now:()=>time}),start=auth.begin(),url=new URL(start.url);time+=600001;await assert.rejects(auth.complete(new URLSearchParams({state:url.searchParams.get('state'),code:'code'}),start.cookie));
});
test('reject forged signatures, algorithms, keys, issuer, audience, nonce, expiry and non-admin identity',async()=>{
 const invalid=[{email:'other@gmail.com'},{email_verified:false},{sub:''},{nonce:'wrong'},{iss:'https://evil.example'},{aud:'other-client'},{aud:[googleConfig.clientId,'other']},{azp:'other-client'},{exp:0},{exp:'9999999999'},{iat:Math.floor(Date.now()/1000)+600}];
 for(const claims of invalid){const x=flow();x.f.claims(claims);await assert.rejects(x.auth.complete(x.params,x.cookies),JSON.stringify(claims));}
 for(const header of [{alg:'none'},{alg:'HS256'},{kid:'unknown'}]){const x=flow();x.f.header(header);await assert.rejects(x.auth.complete(x.params,x.cookies));}
 const x=flow();x.f.badSignature();await assert.rejects(x.auth.complete(x.params,x.cookies));
});
test('pending flow bounded and missing config disabled; only private regular config accepted',()=>{
 assert.equal(googleAuth({config:null}),null);assert.throws(()=>googleAuth({config:googleConfig,publicOrigin:'http://example.com'}));
 const auth=googleAuth({config:googleConfig,publicOrigin:origin});for(let i=0;i<128;i++)auth.begin();assert.throws(()=>auth.begin());
 const dir=mkdtempSync(join(tmpdir(),'sues-google-'));try{const p=join(dir,'config');assert.equal(readGoogleConfig(p),null);writeFileSync(p,JSON.stringify(googleConfig),{mode:0o600});assert.deepEqual(readGoogleConfig(p),googleConfig);chmodSync(p,0o644);assert.throws(()=>readGoogleConfig(p));chmodSync(p,0o600);symlinkSync(p,join(dir,'link'));assert.throws(()=>readGoogleConfig(join(dir,'link')));}finally{rmSync(dir,{recursive:true,force:true});}
});
