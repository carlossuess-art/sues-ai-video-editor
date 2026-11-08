/** Inspection and fail-closed gateway policy for adapting EXISTING FableCut UI.
 * Never treat this as a complete proxy: only read-only endpoints are eligible,
 * even if the caller is authenticated. Media and writes need separate design.
 */
const READ_ONLY=new Set(['/api/project','/api/projects','/api/versions','/api/export/profiles']);
export function safeNativeNleRead(method,path){
 return method==='GET'&&typeof path==='string'&&READ_ONLY.has(path);
}
export function auditNativeNleWebContract(indexHTML,appJS){
 if(typeof indexHTML!=='string'||typeof appJS!=='string'||indexHTML.length>2_000_000||appJS.length>8_000_000)throw Error('Untrusted native UI source size');
 const assetMatches=[...indexHTML.matchAll(/(?:src|href)="([^"]+)"/g)].map(x=>x[1]);
 if(assetMatches.some(x=>/^(?:https?:)?\/\//i.test(x)||x.startsWith('data:')||x.includes('..')||x.includes('?')||x.includes('#')))throw Error('Native UI asset requires explicit audit');
 const assets=[...new Set(assetMatches.filter(x=>/\.(?:css|js|svg|png|ico)$/i.test(x)))].sort();
 const apiPaths=[...new Set([...appJS.matchAll(/\/api\/[a-zA-Z0-9_/-]+/g)].map(x=>x[0]))].sort();
 const writeSensitive=apiPaths.filter(x=>!READ_ONLY.has(x));
 return {schema:'sues-native-nle-ui-contract/v1',staticAssetCount:assets.length,staticAssets:assets,
   explicitApiPathCount:apiPaths.length,explicitApiPaths:apiPaths,
   readOnlyEligible:apiPaths.filter(x=>READ_ONLY.has(x)),requiresIndividualWriteGate:writeSensitive,
   unrestrictedReverseProxyAllowed:false,publicFableCutPortAllowed:false,
   nativeUiExposed:false,notes:['UI has root-absolute assets and API paths; path mapping is mandatory','CSP and frame origin require explicit verification','Do not assume GET-only covers all native editor workflows','Never proxy native upload/import-url/export/project PUT without authenticated operation-specific gates']};
}
