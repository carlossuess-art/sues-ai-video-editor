// Non-destructive inventory: never maps aliases or approves resources automatically.
import {resolve} from 'node:path';
import {MediaLibrary} from '../../src/media-library.js';
const args=process.argv.slice(2),write=args.includes('--write'),directory=args.find(a=>!a.startsWith('--'));
if(!directory||args.some(a=>a.startsWith('--')&&a!=='--write'))throw Error('Uso: node scripts/resources/catalog_metadata_v2.mjs DIRECTORIO [--write]');
const library=new MediaLibrary(resolve(directory));let created=0,existing=0;
for(const asset of library.records()){
 library.resolve(asset.id);if(library.metadata(asset.id)){existing++;continue;}
 const metadata={schemaVersion:'sues-asset-metadata/v2',assetId:asset.id,sha256:asset.id,kind:asset.kind==='audio'?'music':asset.kind,logicalAlias:null,lifecycle:'integrated',origin:'existing-private-library',license:{rightsStatus:'unverified',commercialUseAllowed:false},
  technical:{...(asset.duration?{durationSec:asset.duration}:{}),...(asset.width?{width:asset.width,height:asset.height}:{})},
  semantics:{narrativeRoles:[],emotionTags:[],profileCompatibility:[]},constraints:{requiredCapabilities:[],faceExclusion:asset.kind==='image'},approvedForProduction:false,
  knownLimitations:['Procedencia declarada en el registro anterior; requiere revisión documental y creativa antes de selección semántica V2.','No se han medido loudness, true peak, BPM ni compatibilidad narrativa.']};
 if(write)library.saveMetadata(asset.id,metadata);created++;
}
console.log(JSON.stringify({mode:write?'write':'dry-run',resources:created+existing,newMetadata:created,existingMetadata:existing,automaticallyApproved:0,automaticallyMapped:0}));
