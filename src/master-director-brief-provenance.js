// Read-only evidence audit: distinguishes line-ending/trailing-newline drift
// from substantive Film Director storyboard changes. Never upgrades approval.
import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const deny=code=>({status:'BLOCKED',code,exact:false,editoriallyEqual:false,approved:false,canExecute:false});
export function auditFilmBriefProvenance({rawText,annex}={}){
 if(typeof rawText!=='string'||rawText.length>100000||
    annex?.schema!=='sues-master-film-brief-translation/v1'||
    !Array.isArray(annex.allSourceLines)||!annex.allSourceLines.length||
    typeof annex.sourceBriefSha256!=='string'||!/^[a-f0-9]{64}$/.test(annex.sourceBriefSha256)||
    annex.translationCoverage?.lostLines!==0||
    annex.allSourceLines.some((x,i)=>x?.line!==i+1||typeof x.text!=='string'))
   return deny('INVALID_PROVENANCE_INPUT');
 const stored=annex.allSourceLines.map(x=>x.text).join('\n');
 if(sha(stored)!==annex.sourceBriefSha256)
   return deny('ANNEX_TEXT_HASH_INCONSISTENT');
 const exact=sha(rawText)===annex.sourceBriefSha256;
 const canonical=rawText.replace(/\r\n/g,'\n').replace(/\n+$/,'');
 const storedCanonical=stored.replace(/\n+$/,'');
 const editoriallyEqual=canonical===storedCanonical;
 if(!editoriallyEqual)return {status:'CONTENT_CHANGED',code:'EDITORIAL_SOURCE_CONTENT_DIFFERS',
   exact:false,editoriallyEqual:false,rawSha256:sha(rawText),
   annexSha256:annex.sourceBriefSha256,approved:false,canExecute:false};
 return {status:exact?'IDENTICAL_BYTES':'FORMAT_ONLY_DIFFERENCE',
  exact,editoriallyEqual:true,
  rawSha256:sha(rawText),annexSha256:annex.sourceBriefSha256,
  difference:exact?'none':'CRLF_OR_TERMINAL_NEWLINE_ONLY',
  // Even a harmless difference cannot silently bypass a server SHA/fingerprint gate.
  requiresExactHashForExecution:!exact,approved:false,canExecute:false};
}
