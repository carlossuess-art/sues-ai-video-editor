// Pure source migration helper; no personal plugin data or credentials in this repository.
// The caller supplies the actual release contents and approved policy.
export function patchFilmDirectorFiles(files,policy){
 const root='skills/sues-ai-film-director/',skill=root+'SKILL.md';
 if(typeof files[skill]!=='string'||typeof policy!=='string'||!policy.includes('CERO INTERFERENCIAS'))throw Error('Real skill release and approved policy required');
 const out={};
 for(const [path,original] of Object.entries(files)){
  if(path==='plugin.json'||path==='.codex-plugin/plugin.json'){
   const m=JSON.parse(original);if(m.name!=='sues-ai-film-director')throw Error('Unexpected plugin identity');
   m.version='1.7.0';out[path]=JSON.stringify(m,null,2)+'\n';continue;
  }
  if(!path.startsWith(root)||!path.endsWith('.md'))continue;
  let s=original
   .replace(/naranja fuego\/neón intencional cuando convenga/gi,'dorado; otro color solo con autorización creativa específica')
   .replace(/blanco\/beige\/antracita\/fuego y complementarios deliberados/gi,'blanco, dorado luminoso y dorado oscuro, negro/antracita; colores excepcionales solo aprobados')
   .replace(/blanco\/beige\/antracita\/naranja fuego y complementarios\/neones deliberados/gi,'blanco, dorado luminoso y dorado oscuro, negro/antracita; colores excepcionales solo aprobados')
   .replace(/blanco, beige, antracita y naranja\/rojo fuego; dorados complementarios; neones narrativos permitidos si conviene/gi,'blanco, dorado luminoso, dorado oscuro y negro/antracita; otros colores solo con autorización creativa específica')
   .replace(/blanco, beige, negro antracita y rojo\/naranja fuego; colores complementarios\/neones solo como apoyo narrativo/gi,'blanco, dorado luminoso, dorado oscuro y negro/antracita; otros colores solo con autorización creativa específica')
   .replace(/ocultar duplicaciones solo cuando el gráfico transmita el mismo significado; proteger negaciones/gi,'cuando coincida una palabra seleccionada con título protagonista o texto protagonista de motion durante el mismo intervalo, neutralizar solo su resaltado: conservar cada palabra del subtítulo y recuperar el dorado fuera del solape; proteger negaciones')
   .replace(/STORYBOARD HUMANO, provisionalmente el formato visual de 7 fichas usado con el Reel 158404, susceptible de mejora diaria/gi,'tabla humana de guion técnico audiovisual por capas, según la norma 09/11, con selector interactivo previo de palabras clave; las fichas visuales son complementarias')
   .replace(/Carlos revisa y corrige \*\*solo la tabla humana\*\*/gi,'Carlos elige palabras clave en el selector interactivo y revisa y corrige **la tabla humana**');
  if(path===skill){
   s=s.replace(/^version:.*$/m,'version: 1.7.0').replace(/SUES AI Film Director · 1\.6\.1/,'SUES AI Film Director · 1.7.0');
   const header='\n## POLÍTICA PERMANENTE PRIORITARIA · 10/11/2026\n\n**Antes de CUALQUIER plan nuevo, revisión, reelaboración o corrección, leer y aplicar íntegramente `references/PRODUCTION_POLICY_20261110.md` además de las referencias obligatorias existentes.** La última decisión expresa aprobada sustituye toda instrucción histórica incompatible; no usar naranja fuego como identidad por defecto.\n\n**PASO 0 OBLIGATORIO: selector INTERACTIVO de palabras clave reales de la transcripción.** Presentar casillas editables con ocurrencias y contexto, preselección de la revisión anterior si existe, posibilidad de añadir términos presentes, y acción de enviar/confirmar selección. No inventar selección. Conservar texto fiel y normalizar solo para detectar coincidencias. Al coincidir con título/motion protagonista, desactivar automáticamente el énfasis inferior SOLO durante el solape; nunca borrar palabras. Recalcular tras cambios de título, tiempo o selección. La tabla A/V humana incorpora la selección y el resultado exacto por intervalos; el JSON o anexo conserva IDs y operaciones.\n\n**Máscara de Carlos preparada siempre que aparezca. CERO INTERFERENCIAS obligatorio. Favoritos primero mediante biblioteca compartida.** Un único proyecto activo con revisión/fingerprint, preservar lo no modificado y retirar explícitamente restos sustituidos incluso anidados/SFX. QA visual real de bordes, flash/niebla, tipografía, audio y dos pasadas antes de entrega. Reutilizar presets validados; la V18 de niebla/sofá sigue candidata hasta aprobación visual. No declarar instalados presets ni sincronización si no están comprobados. Aprobación de edición y de publicación siempre separadas.\n\n';
   const anchor='## NORMA DE SALIDA PRIORITARIA · 09/11/2026';if(!s.includes(anchor))throw Error('Unexpected skill structure');s=s.replace(anchor,header+anchor);
  }
  if(s!==original)out[path]=s;
 }
 out[root+'references/PRODUCTION_POLICY_20261110.md']=policy;
 return out;
}
// Compact transport encoding for an archive build when tools cannot share a filesystem.
// UTF-8, LZSS 16-bit distance / 8-bit length; the decoder validates exact size.
export function encodeTransfer(obj){
 const text=JSON.stringify(obj),input=[];
 for(const ch of text){const c=ch.codePointAt(0);if(c<128)input.push(c);else if(c<2048)input.push(192|(c>>6),128|(c&63));else if(c<65536)input.push(224|(c>>12),128|((c>>6)&63),128|(c&63));else input.push(240|(c>>18),128|((c>>12)&63),128|((c>>6)&63),128|(c&63));}
 const out=[],dict=new Map(),key=i=>((input[i]??0)<<16)|((input[i+1]??0)<<8)|(input[i+2]??0);
 const add=i=>{if(i+2>=input.length)return;const k=key(i),a=dict.get(k)??[];a.push(i);if(a.length>48)a.shift();dict.set(k,a)};
 let i=0;
 while(i<input.length){const flag=out.length;out.push(0);let mask=0;
  for(let bit=0;bit<8&&i<input.length;bit++){let len=0,dist=0;const a=dict.get(key(i))??[];
   for(let j=a.length-1;j>=0;j--){const p=a[j],d=i-p;if(d>65535)break;let n=0;while(n<258&&i+n<input.length&&input[p+n]===input[i+n])n++;if(n>len){len=n;dist=d;if(n===258)break}}
   if(len>=4){mask|=1<<bit;out.push(dist&255,dist>>8,len-3);for(let n=0;n<len;n++)add(i+n);i+=len;}
   else{out.push(input[i]);add(i++);}
  }out[flag]=mask;
 }
 const alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';let b64='';
 for(let j=0;j<out.length;j+=3){const a=out[j],b=out[j+1]??0,c=out[j+2]??0,n=(a<<16)|(b<<8)|c;b64+=alpha[n>>18]+alpha[(n>>12)&63]+(j+1<out.length?alpha[(n>>6)&63]:'=')+(j+2<out.length?alpha[n&63]:'=')}
 return {base64:b64,uncompressedBytes:input.length,compressedBytes:out.length};
}
