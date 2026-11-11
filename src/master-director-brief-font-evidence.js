// Read-only font provenance and exact-weight readiness for a human Film Director
// specification. Never substitutes Regular/Bold for a missing SemiBold.
import {readFileSync,existsSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const sha=data=>createHash('sha256').update(data).digest('hex');
const deny=code=>({schema:'sues-film-director-font-evidence/v1',
 status:'BLOCKED',code,approved:false,canExecute:false});
export function inspectFilmDirectorMontserrat({fontDirectory,sourceManifest}={}){
 if(typeof fontDirectory!=='string'||!fontDirectory.startsWith('/')||
    !sourceManifest||typeof sourceManifest!=='object'||typeof sourceManifest.files!=='object')
  return deny('INVALID_FONT_EVIDENCE_INPUT');
 const slots=[
  {purpose:'editorial-title',family:'Montserrat',weight:700,filename:'Montserrat-Bold.ttf'},
  {purpose:'progressive-captions',family:'Montserrat',weight:600,filename:'Montserrat-SemiBold.ttf'}
 ];
 let license;
 try{
  const buf=readFileSync(join(fontDirectory,'OFL.txt'));
  const record=sourceManifest.files['OFL.txt'];
  if(buf.length>20000||!record||sha(buf)!==record.sha256||
     !buf.toString('utf8').includes('SIL OPEN FONT LICENSE Version 1.1'))
   return deny('OFL_LICENSE_TEXT_MISSING_OR_HASH_MISMATCH');
  license={status:'OFL_TEXT_HASH_VERIFIED',sha256:sha(buf),
   license:'SIL Open Font License 1.1',humanReviewRequired:true};
 }catch{return deny('OFL_LICENSE_TEXT_MISSING_OR_HASH_MISMATCH');}
 const fonts=slots.map(slot=>{
  const expected=sourceManifest.files[slot.filename],path=join(fontDirectory,slot.filename);
  if(!expected||!existsSync(path))return {...slot,status:'EXACT_FONT_WEIGHT_NOT_AVAILABLE',approved:false};
  try{
   if(!statSync(path).isFile()||statSync(path).size>5000000)
    return {...slot,status:'FONT_FILE_INVALID',approved:false};
   const bytes=readFileSync(path),digest=sha(bytes);
   if(digest!==expected.sha256||bytes.length!==expected.bytes)
    return {...slot,status:'FONT_HASH_OR_SIZE_MISMATCH',approved:false};
   return {...slot,status:'AVAILABLE_WITH_OFL_EVIDENCE',sha256:digest,bytes:bytes.length,
    approved:false};
  }catch{return {...slot,status:'FONT_FILE_INVALID',approved:false};}
 });
 return {schema:'sues-film-director-font-evidence/v1',status:'PARTIAL_FONT_READINESS',
  license,fonts,exactWeightsAvailable:fonts.filter(f=>f.status==='AVAILABLE_WITH_OFL_EVIDENCE').length,
  missingWeights:fonts.filter(f=>f.status!=='AVAILABLE_WITH_OFL_EVIDENCE').map(f=>f.weight),
  creativeTypographyUnapproved:true,approved:false,canExecute:false};
}
