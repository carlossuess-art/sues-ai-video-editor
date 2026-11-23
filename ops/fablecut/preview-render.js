/* SUES / FableCut - preview dimensions; no project edits.
   This is an export setting, independent from final delivery quality. */
(function(root,factory) {
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FableCutPreview=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  const MAX_WIDTH=540,MAX_HEIGHT=960,FPS=15;
  function dimensions(w,h) {
    w=Number(w);h=Number(h);
    if(!Number.isInteger(w)||!Number.isInteger(h)||w<2||h<2)throw Error('Invalid source canvas');
    const ratio=Math.min(1,MAX_WIDTH/w,MAX_HEIGHT/h);
    const width=Math.max(2,Math.floor(w*ratio/2)*2);
    const height=Math.max(2,Math.floor(h*ratio/2)*2);
    return {w:width,h:height,sx:width/w,sy:height/h,fps:FPS};
  }
  function region(r,source) {
    if(!r)return null;
    return {x:r.x*source.sx,y:r.y*source.sy,w:r.w*source.sx,h:r.h*source.sy};
  }
  function applies(spec){return spec&&spec.preset==='sues-preview'}
  return {dimensions,region,applies,FPS};
});
