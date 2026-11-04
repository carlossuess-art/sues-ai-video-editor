// Easing belongs to the ending keyframe of each property segment. The named
// curves use the CSS cubic-bezier control points; no spring is approximated.
const curves={
  'ease-in':[0.42,0,1,1],
  'ease-out':[0,0,0.58,1],
  'ease-in-out':[0.42,0,0.58,1],
};
const bezier=(a,b,t)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
export function masterEasing(name,progress){
 if(!Number.isFinite(progress)||progress<0||progress>1)throw Error('Invalid animation progress');
 if(name==='linear')return progress;
 if(!Object.hasOwn(curves,name))throw Error('Unsupported easing');
 const c=curves[name];
 let low=0,high=1;
 for(let i=0;i<32;i++){const t=(low+high)/2;if(bezier(c[0],c[2],t)<progress)low=t;else high=t;}
 return progress===0?0:progress===1?1:bezier(c[1],c[3],(low+high)/2);
}
