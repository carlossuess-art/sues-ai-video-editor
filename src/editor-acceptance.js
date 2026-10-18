import {qualitativeGate} from './e2e-acceptance.js';
export function editorialAcceptance(value,{fingerprint,outputSha256}){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['captionsReviewed','framingReviewed','audioReviewed','majorChanges','minorChanges'].includes(k)))throw new Error('Review fields invalid');
 for(const k of ['captionsReviewed','framingReviewed','audioReviewed'])if(typeof value[k]!=='boolean')throw new Error('Review checklist invalid');
 for(const k of ['majorChanges','minorChanges'])if(!Number.isInteger(value[k])||value[k]<0||value[k]>99)throw new Error('Review change count invalid');
 const gate=qualitativeGate(value),reviewed=value.captionsReviewed&&value.framingReviewed&&value.audioReviewed;
 return {version:'1.0',kind:'owner-editorial-review',...value,reviewed,pass:reviewed&&gate.pass,criterion:gate.criterion,fingerprint,outputSha256,createdAt:new Date().toISOString(),v1AutomaticallyDeclared:false};
}
