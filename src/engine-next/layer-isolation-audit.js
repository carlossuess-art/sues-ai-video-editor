/** Compare isolated NLE snapshots; evidence of visible changed pixels, not aesthetic approval. */
export function parsePsnr(stderr){
 const lines=String(stderr).split('\n').filter(x=>/PSNR\s+r:/.test(x));
 if(lines.length!==1)throw Error('Expected exactly one FFmpeg PSNR result');
 const m=/average:(inf|[0-9.]+)/.exec(lines[0]);if(!m)throw Error('PSNR average missing');
 const value=m[1]==='inf'?Infinity:Number(m[1]);if(Number.isNaN(value)||value<0)throw Error('Invalid PSNR value');
 return value;
}
export function isolateQuadrantChange(scores,expected='top-right'){
 const names=['top-left','top-right','bottom-left','bottom-right'];
 if(!names.includes(expected)||names.some(x=>!(x in scores)||typeof scores[x]!=='number'||Number.isNaN(scores[x])))throw Error('Quadrant evidence incomplete');
 const inside=scores[expected],others=names.filter(x=>x!==expected);
 return {schema:'sues-isolated-layer-delta/v1',status:Number.isFinite(inside)&&others.every(x=>scores[x]===Infinity)
   ?'VISIBLE_CHANGE_CONFINED_TO_EXPECTED_QUADRANT':'NOT_ISOLATED',
   expectedQuadrant:expected,scores,
   cinematicQA:false,notes:'This confirms spatial change only; it does not prove alpha edges, matte accuracy, movement continuity, semantic suitability or export parity.'};
}