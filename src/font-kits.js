import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('../assets/fonts/',import.meta.url));
const KITS=Object.freeze({
 'Open Sans':{family:'Open Sans',regular:'OpenSans.ttf',bold:'OpenSans-Bold.ttf',license:'OFL.txt',directory:ROOT},
 Inter:{family:'Inter',regular:'Inter-Regular.ttf',bold:'Inter-Bold.ttf',license:'OFL.txt',metrics:'metrics.json',directory:join(ROOT,'inter')},
 Montserrat:{family:'Montserrat',regular:'Montserrat-Regular.ttf',bold:'Montserrat-Bold.ttf',license:'OFL.txt',metrics:'metrics.json',directory:join(ROOT,'montserrat'),extras:['Montserrat-ExtraBold.ttf','Montserrat-BoldItalic.ttf','Montserrat-ExtraBoldItalic.ttf','Anton-Regular.ttf','Anton-OFL.txt','AllertaStencil-Regular.ttf','AllertaStencil-OFL.txt'],faces:[{file:'Montserrat-Regular.ttf',family:'Montserrat',weight:400},{file:'Montserrat-Bold.ttf',family:'Montserrat',weight:700},{file:'Montserrat-ExtraBold.ttf',family:'Montserrat ExtraBold',weight:800},{file:'Montserrat-BoldItalic.ttf',family:'Montserrat',weight:700,italic:true},{file:'Montserrat-ExtraBoldItalic.ttf',family:'Montserrat ExtraBold',weight:800,italic:true},{file:'Anton-Regular.ttf',family:'Anton',weight:400},{file:'AllertaStencil-Regular.ttf',family:'Allerta Stencil',weight:400}]}
});
export function fontKit(family){if(!Object.hasOwn(KITS,family))throw new Error('Unsupported caption font');return KITS[family];}
export function fontFaces(family){const k=fontKit(family);return k.faces??[{file:k.regular,family,weight:400},{file:k.bold,family,weight:700}];}
export function fontFiles(family){const k=fontKit(family);return [k.regular,k.bold,k.license,...(k.metrics?[k.metrics]:[]),...(k.extras??[])];}
export function typefaceTags(policy,role='normal',italic=false){
 if(policy.font!=='Montserrat')return '';
 if(role==='stampRing')return '\\fnAllerta Stencil\\b0\\i0';
 if(role==='stamp')return '\\fnAnton\\b0\\i0';
 const key=role==='keyword'||role==='keywordItalic';
 return `\\fn${key?'Montserrat ExtraBold':'Montserrat'}\\b${key?800:700}\\i${italic||role==='italic'||role==='keywordItalic'?1:0}`;
}
const metricCache=new Map();
function metricsFor(policy){const kit=fontKit(policy.font);if(!kit.metrics)return null;if(!metricCache.has(policy.font))metricCache.set(policy.font,JSON.parse(readFileSync(join(kit.directory,kit.metrics),'utf8')));const all=metricCache.get(policy.font);return all.roles?.[policy.fontRole]??all;}
export function resolveFontDirectory(directory,family){const files=fontFiles(family);return directory&&files.every(f=>existsSync(join(directory,f)))?resolve(directory):fontKit(family).directory;}
export function textAdvance(text,policy,size=policy.fontSize){
 const metrics=metricsFor(policy);if(!metrics)throw new Error('Progressive captions require verified font metrics');
 return [...text].reduce((sum,c)=>sum+(metrics.advances[c]??metrics.fallback),0)/(metrics.assEmHeight??metrics.unitsPerEm)*size*(policy.scaleX??100)/100+Math.max(0,[...text].length-1)*(policy.tracking??0);
}
export function fitCaptionSize(lines,policy,width=780){
 const base=policy.fontSize??56;if(!policy.fontSize)return base;
 const metrics=metricsFor(policy);if(!metrics)return base;
 const advance=text=>[...text].reduce((sum,c)=>sum+(metrics.advances[c]??metrics.fallback),0)/(metrics.fitEmHeight??metrics.unitsPerEm);
 const actual=Math.max(...lines.map(text=>advance(text)*base*(policy.scaleX??100)/100+Math.max(0,[...text].length-1)*(policy.tracking??0)));
 const size=Math.min(base,Math.floor(base*width/Math.max(width,actual)));if(size<64)throw new Error('Caption cannot fit at a readable size');return size;
}
