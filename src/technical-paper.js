// Seven-by-seven grid on a cold paper canvas, elliptical feather, lens vignette
// and temporal grain. CapCut percentages are visual references, not pixel units.
export function technicalPaperFilters(graphics=[],base){
 const filters=[];
 for(const [i,g]of graphics.filter(g=>g.type!=='secret').entries()){
  const d=g.end-g.start;
  filters.push(`color=c=0xD9D9D9:s=1080x1920:r=30:d=${d},format=rgb24,vignette=angle=PI/4.4,noise=alls=12:allf=t+u:all_seed=20261018[paper${i}]`);
  filters.push(`color=c=0x7A7A7A:s=672x672:r=30:d=${d},format=rgba,geq=r='122':g='122':b='122':a='38*gt(lt(mod(X,96),2)+lt(mod(Y,96),2),0)*exp(-pow((X-336)/265,4)-pow((Y-336)/265,4))'[paper-grid${i}]`);
  filters.push(`[paper${i}][paper-grid${i}]overlay=x=174:y=574:format=auto,format=rgba,fade=t=in:st=0:d=0.12:alpha=1,fade=t=out:st=${Math.max(0,d-.16)}:d=0.16:alpha=1,setpts=PTS+${g.start}/TB[paper-scene${i}]`);
  filters.push(`[${base}][paper-scene${i}]overlay=eof_action=pass:repeatlast=0:enable='gte(t,${g.start})*lt(t,${g.end})'[paper-composed${i}]`);base=`paper-composed${i}`;
 }
 return {filters,base};
}
