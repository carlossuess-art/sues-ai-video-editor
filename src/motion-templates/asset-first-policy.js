/** Asset-first decision layer for the existing SUES narrative-motion review.
 * Read-only: no image provider, FableCut write, purchase or creative approval.
 * Every candidate inherits its exact selected source word IDs; the editor
 * must verify the eventual asset's transparency, rights and source binding.
 */
const expect=(yes,msg)=>{if(!yes)throw Error(msg)};
const hasText=v=>typeof v==='string'&&v.trim().length>0;
const PROCEDURAL=new Set(['quantified-fact','data-trend']);
export const ASSET_FIRST_POLICY=Object.freeze({
 schema:'sues-asset-first-policy/v1',first:'reuse-existing-verified-approved-asset',
 ifAbsent:'generate-purpose-built-cutout-image-upstream-after-creative-review',
 output:'PNG RGBA or WebP with REAL alpha; preserve distinct movable parts',
 styles:['2D','2.5D','3D-look'],background:'transparent-never-printed',
 proceduralExceptions:['graphs','counters','rings','grids','vector-lines','timelines'],
 motionOwner:'HyperFrames / verified native FableCut capabilities',
 keepOriginalFace:true,limit:'2.5D image does not allow true 360-degree rotation',
 titleRules:'start-centered; translate complete compact multiline group upward when object enters',
 generationAutomated:false,publicationAuthorized:false
});
export function prepareAssetFirstReview(review){
 expect(review?.schema==='sues-narrative-motion-review/v1'&&Array.isArray(review.candidates),'TRUSTED_MOTION_REVIEW_REQUIRED');
 const selected=review.selectedWordIds??[];
 expect(Array.isArray(selected),'SOURCE_WORD_SELECTION_REQUIRED');
 const ids=new Set(selected);
 const seen=new Set();
 const proposals=review.candidates.map(c=>{
  expect(hasText(c.id)&&!seen.has(c.id),'INVALID_OR_DUPLICATE_MOTION_CANDIDATE');
  seen.add(c.id);
  const selectedIn=(c.sourceSpeech?.selectedWordIds??[]);
  expect(Array.isArray(selectedIn)&&selectedIn.length>0&&selectedIn.every(id=>ids.has(id)),
   'ASSET_PROPOSAL_MUST_USE_EXPLICITLY_SELECTED_SOURCE_WORDS');
  const isProcedural=PROCEDURAL.has(c.intent);
  return {proposalId:'asset-'+c.id,motionCandidateId:c.id,
   templateId:c.templateId,reason:c.reason,sourceSpeechAnchor:c.sourceSpeech.anchorWordId,
   selectedSourceWordIds:[...selectedIn],
   method:isProcedural?'procedural-graphic':'verified-transparent-image-first',
   selection:'FAVORITES_AND_EXISTING_LIBRARY_FIRST',
   missingResource:isProcedural?'PROCEDURAL_SPEC_PENDING':'REQUIRES_IMAGE_CREATION_BRIEF',
   assetId:null,assetSha256:null,alphaVerified:false,
   visualDesign:'PENDING_CARLOS_REVIEW',editorOperation:'NOT_GENERATED',
   creativeApproved:false,canExecute:false};
 });
 return {schema:'sues-asset-first-review/v1',policy:ASSET_FIRST_POLICY,
  motionReviewStatus:review.status,sourceSha256:review.source?.sourceSha256??null,
  proposals,readOnly:true,creativeApproved:false,canExecute:false,
  requiredChecks:['source-and-timeline-identity','user-word-choice',
   'approved-visual-design','library-rights-and-asset-sha256',
   'actual-alpha-pixels-if-image','native-engine-mapping','private-render-and-double-AV-QA']};
}
