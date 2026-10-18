// Original line-art geometry; no stock stickers, plugins or symbol-font fallback.
export const LINE_ART=Object.freeze({
 eye:'m 5 115 b 60 20 180 20 235 115 b 180 210 60 210 5 115 m 155 115 b 155 160 85 160 85 115 b 85 70 155 70 155 115 m 120 92 l 120 115 139 115',
 heart:'m 120 210 b 100 190 10 130 10 75 b 10 13 92 0 120 60 b 148 0 230 13 230 75 b 230 130 140 190 120 210 m 40 115 l 75 115 93 85 115 148 140 105 188 105',
 clapper:'m 10 95 l 190 95 190 205 b 190 220 180 228 165 228 l 35 228 b 18 228 10 220 10 205 l 10 95 m 10 95 l 0 52 174 10 184 52 10 95 m 10 132 l 190 132 m 38 95 l 24 132 m 82 95 l 68 132 m 126 95 l 112 132 m 170 95 l 156 132 m 83 161 l 83 202 124 181 83 161 m 25 48 l 56 83 m 66 38 l 97 73 m 108 28 l 140 62 m 149 18 l 180 52',
 makeup:'m 20 122 l 68 122 68 210 20 210 20 122 m 31 122 l 31 67 b 31 42 58 30 58 52 l 58 122 m 68 95 b 140 47 210 119 162 185 m 75 113 b 132 74 184 130 151 185 m 68 185 l 176 185 176 210 68 210 m 202 210 l 197 99 218 99 212 210 202 210 m 196 98 l 183 33 b 190 9 229 9 237 33 l 219 98 196 98',
 luggage:'m 90 64 l 179 64 b 191 64 199 72 199 84 l 199 219 90 219 90 64 m 114 64 l 114 17 171 17 171 64 m 109 17 l 176 17 m 199 98 l 90 98 m 24 111 l 90 111 90 219 24 219 24 111 m 39 111 l 39 93 77 93 77 111 m 24 157 l 90 157 m 63 158 l 145 158 b 155 158 160 166 160 175 l 160 223 63 223 63 158 m 86 158 l 86 141 123 141 123 158 m 78 174 l 78 207 m 145 174 l 145 207 m 28 219 l 28 229 m 187 219 l 187 229',
 clock:'m 123 16 b 64 -2 9 42 9 104 b 9 154 40 187 76 197 m 123 16 l 111 -2 147 5 134 39 123 16 m 95 53 l 95 105 134 127 m 155 64 l 159 68 m 166 91 l 170 95 m 165 121 l 169 125 m 151 151 l 155 155 m 125 173 l 129 177 m 95 184 l 99 188'
});
export function circlePath(x,y,r){const k=.55228475*r;return `m ${x-r} ${y} b ${x-r} ${y-k} ${x-k} ${y-r} ${x} ${y-r} b ${x+k} ${y-r} ${x+r} ${y-k} ${x+r} ${y} b ${x+r} ${y+k} ${x+k} ${y+r} ${x} ${y+r} b ${x-k} ${y+r} ${x-r} ${y+k} ${x-r} ${y}`;}

// ASS fills open contours; a raw open Bézier would acquire an unwanted chord.
// Expand authored center lines into filled stroke geometry with round joins.
export function strokeDrawing(path,width){
 const tokens=path.match(/[mlb]|-?\d+(?:\.\d+)?/g)??[];let i=0,command,point=null;const segments=[];
 const n=()=>Number(tokens[i++]);
 while(i<tokens.length){if(/^[mlb]$/.test(tokens[i]))command=tokens[i++];
  if(command==='m'){point={x:n(),y:n()};command='l';}
  else if(command==='l'){const next={x:n(),y:n()};if(point)segments.push([point,next]);point=next;}
  else if(command==='b'){
   const a=point,b={x:n(),y:n()},c={x:n(),y:n()},d={x:n(),y:n()};
   for(let step=1;step<=24;step++){const t=step/24,u=1-t,next={x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};segments.push([point,next]);point=next;}
  }else throw Error('Unsupported drawing command');
 }
 const f=v=>Number(v.toFixed(2)),r=width/2;let out='';const joints=new Map();
 for(const [a,b]of segments){const len=Math.hypot(b.x-a.x,b.y-a.y);if(len<.001)continue;const dx=-(b.y-a.y)/len*r,dy=(b.x-a.x)/len*r;
  out+=`m ${f(a.x+dx)} ${f(a.y+dy)} l ${f(b.x+dx)} ${f(b.y+dy)} ${f(b.x-dx)} ${f(b.y-dy)} ${f(a.x-dx)} ${f(a.y-dy)} `;joints.set(`${f(a.x)},${f(a.y)}`,a);joints.set(`${f(b.x)},${f(b.y)}`,b);
 }
 for(const p of joints.values()){for(let j=0;j<10;j++){const a=-j*2*Math.PI/10;out+=`${j?'l':'m'} ${f(p.x+Math.cos(a)*r)} ${f(p.y+Math.sin(a)*r)} `;}}
 return out;
}

export function ellipsePath(x,y,rx,ry){const kx=.55228475*rx,ky=.55228475*ry;return `m ${x-rx} ${y} b ${x-rx} ${y-ky} ${x-kx} ${y-ry} ${x} ${y-ry} b ${x+kx} ${y-ry} ${x+rx} ${y-ky} ${x+rx} ${y} b ${x+rx} ${y+ky} ${x+kx} ${y+ry} ${x} ${y+ry} b ${x-kx} ${y+ry} ${x-rx} ${y+ky} ${x-rx} ${y}`;}
