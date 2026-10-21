import Ajv2020 from 'ajv/dist/2020.js';
import {readFileSync} from 'node:fs';
const validate=new Ajv2020({allErrors:true,strict:false}).compile(JSON.parse(readFileSync(new URL('../schemas/asset-metadata-v2.json',import.meta.url),'utf8')));
export const RESERVED_SFX_ALIASES=Object.freeze(['SFX_SIGNATURE_CHIME','SFX_MATCH_STRIKE','SFX_SUB_WHOOSH','SFX_TEXT_SNAP','SFX_CHARCOAL_SCRATCH','SFX_UI_GLASS_POP','SFX_CLOTH_WHOOSH','SFX_SUCKBACK','SFX_VINYL_BRAKE','SFX_HEARTBEAT','SFX_BREATH_INHALE','SFX_GLASS_PING','SFX_OUTRO_PIANO','SFX_EARTH_DROP']);
export function validateAssetMetadata(value,asset){
 if(!validate(value))throw Error('Metadatos V2 inválidos: '+validate.errors.map(e=>e.instancePath+' '+e.message).join('; '));
 if(value.assetId!==asset.id||value.sha256.toLowerCase()!==asset.id||value.kind!==(asset.kind==='audio'?'music':asset.kind))throw Error('Los metadatos no corresponden al recurso y hash reales.');
 if(value.logicalAlias!==null&&value.logicalAlias!==undefined&&!/^[A-Z][A-Z0-9_]{1,79}$/.test(value.logicalAlias))throw Error('Alias no válido.');
 if(value.logicalAlias?.startsWith('SFX_')&&value.kind!=='sfx')throw Error('Un alias SFX requiere un sonido puntual.');
 if(value.semantics.energyRange&&value.semantics.energyRange[0]>value.semantics.energyRange[1])throw Error('Rango de energía invertido.');
 if(value.approvedForProduction&&(!value.license.proofRef?.trim()||!value.testReportRef?.trim()))throw Error('La aprobación requiere referencias de licencia y prueba revisada.');
 return structuredClone(value);
}
export function publicAssetMetadata(value){
 if(!value)return null;
 // Private storage, licence proofs and arbitrary extension fields never enter a catalog/prompt.
 return {schemaVersion:value.schemaVersion,assetId:value.assetId,kind:value.kind,logicalAlias:value.logicalAlias??null,lifecycle:value.lifecycle,approvedForProduction:value.approvedForProduction,rightsStatus:value.license.rightsStatus,commercialUseAllowed:value.license.commercialUseAllowed,
  semantics:{narrativeRoles:value.semantics.narrativeRoles,emotionTags:value.semantics.emotionTags,profileCompatibility:value.semantics.profileCompatibility,...(value.semantics.energyRange?{energyRange:value.semantics.energyRange}:{})},
  constraints:{requiredCapabilities:value.constraints.requiredCapabilities,faceExclusion:value.constraints.faceExclusion,maxIntensity:value.constraints.maxIntensity,minIntervalSec:value.constraints.minIntervalSec}};
}
