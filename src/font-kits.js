import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('../assets/fonts/',import.meta.url));
const KITS=Object.freeze({
 'Open Sans':{family:'Open Sans',regular:'OpenSans.ttf',bold:'OpenSans-Bold.ttf',license:'OFL.txt',directory:ROOT},
 Inter:{family:'Inter',regular:'Inter-Regular.ttf',bold:'Inter-Bold.ttf',license:'OFL.txt',metrics:'metrics.json',directory:join(ROOT,'inter')}
});
export function fontKit(family){if(!Object.hasOwn(KITS,family))throw new Error('Unsupported caption font');return KITS[family];}
export function fontFiles(family){const k=fontKit(family);return [k.regular,k.bold,k.license,...(k.metrics?[k.metrics]:[])];}
export function resolveFontDirectory(directory,family){const files=fontFiles(family);return directory&&files.every(f=>existsSync(join(directory,f)))?resolve(directory):fontKit(family).directory;}
export function textAdvance(text,policy,size=policy.fontSize){
 const kit=fontKit(policy.font);if(!kit.metrics)throw new Error('Progressive captions require verified font metrics');
 const metrics=JSON.parse(readFileSync(join(kit.directory,kit.metrics),'utf8'));
 return [...text].reduce((sum,c)=>sum+(metrics.advances[c]??metrics.fallback),0)/(metrics.assEmHeight??metrics.unitsPerEm)*size*(policy.scaleX??100)/100+Math.max(0,[...text].length-1)*(policy.tracking??0);
}
export function fitCaptionSize(lines,policy,width=780){
 const base=policy.fontSize??56;if(!policy.fontSize)return base;
 const kit=fontKit(policy.font);if(!kit.metrics)return base;
 const metrics=JSON.parse(readFileSync(join(kit.directory,kit.metrics),'utf8'));
 const advance=text=>[...text].reduce((sum,c)=>sum+(metrics.advances[c]??metrics.fallback),0)/metrics.unitsPerEm;
 const actual=Math.max(...lines.map(text=>advance(text)*base*(policy.scaleX??100)/100+Math.max(0,[...text].length-1)*(policy.tracking??0)));
 const size=Math.min(base,Math.floor(base*width/Math.max(width,actual)));if(size<64)throw new Error('Caption cannot fit at a readable size');return size;
}
