/** Quantitative diagnostics only. An SSIM score is never cinematic approval. */
export function parseSsim(stderr) {
  if(typeof stderr!=='string')throw TypeError('FFmpeg stderr required');
  const hits=[...stderr.matchAll(/SSIM\s+R:([0-9.]+)\s+\([^)]*\)\s+G:([0-9.]+)\s+\([^)]*\)\s+B:([0-9.]+)\s+\([^)]*\)\s+All:([0-9.]+)/g)];
  if(hits.length!==1)throw Error('Exactly one RGB SSIM result is required');
  const [r,g,b,all]=hits[0].slice(1).map(Number);
  if([r,g,b,all].some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('Invalid SSIM result');
  return {r,g,b,all};
}
export function assessFrameEvidence(rows,{expectedCount}={}) {
  if(!Array.isArray(rows)||!rows.length||rows.length!==expectedCount)throw Error('Incomplete frame evidence');
  if(rows.some(x=>!Number.isFinite(x.time)||x.time<0||x.width!==1080||x.height!==1920||!x.ssim||!Number.isFinite(x.ssim.all)))throw Error('Invalid frame evidence');
  return {status:'EVIDENCE_ONLY_NOT_CINEMATIC_QA',samples:rows.length,
    minimumSsim:Math.min(...rows.map(x=>x.ssim.all)),averageSsim:rows.reduce((a,x)=>a+x.ssim.all,0)/rows.length,
    notes:['SSIM compares against source, not an approved composite reference',
      'Different grades, titles, crops, overlays or motion can reduce SSIM for valid creative reasons',
      'Temporal masks, foreground alpha, word timings and export parity remain unverified']};
}