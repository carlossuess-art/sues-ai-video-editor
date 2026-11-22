"use strict";
// RFC 7233 single-range subset for video streaming; fail closed on invalid input.
function parseSingleRange(header,size){
 if(typeof header!=="string"||!Number.isSafeInteger(size)||size<=0)return null;
 const m=/^bytes=(\d*)-(\d*)$/.exec(header.trim());
 if(!m||(!m[1]&&!m[2]))return null;
 let start,end;
 if(!m[1]){
  const suffix=Number(m[2]);
  if(!Number.isSafeInteger(suffix)||suffix<1)return null;
  start=Math.max(0,size-suffix);end=size-1;
 }else{
  start=Number(m[1]);end=m[2]?Number(m[2]):size-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||
     start>=size||end<start)return null;
  end=Math.min(end,size-1);
 }
 return {start,end};
}
module.exports={parseSingleRange};
