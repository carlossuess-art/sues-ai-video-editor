import {compileTemplatePolicy} from './template.js';
import {compileDirectorEvents} from './director-contract.js';
import {indexMotionLibrary} from './motion-library.js';
import {CAMERA_PROFILES} from './reframe.js';

// Template aliases are editorial names; the Director consumes catalogue IDs.
export const MOTION_ALIASES=Object.freeze({
  'blurred-resource':'BLURRED_RESOURCE_01',
  'compare-yes-no':'COMPARE_YES_NO_01',
  'numbered-list':'NUMBER_BADGE_GOLD_01',
  'quote-card':'QUOTE_CARD_01',
  'divider-line':'DIVIDER_LINE_01'
});

export function prepareFoundationPlan({template,brand,catalog,director,duration,profile='composition',absoluteZoomLimit=1.6}){
  if(!Number.isFinite(duration)||duration<=0)throw new Error('Integration: duration');
  if(!Object.hasOwn(CAMERA_PROFILES,profile))throw new Error('Integration: camera profile');
  const framingZoom=CAMERA_PROFILES[profile].zoom;
  if(!Number.isFinite(absoluteZoomLimit)||absoluteZoomLimit<framingZoom||absoluteZoomLimit>1.6)
    throw new Error('Integration: absolute zoom limit');
  const library=indexMotionLibrary(catalog);
  const basePolicy=compileTemplatePolicy(template,brand);
  const unresolvedMotions=[];
  const motions=basePolicy.motions.flatMap(alias=>{
    const id=MOTION_ALIASES[alias]??alias;
    if(library.get(id))return [id];
    unresolvedMotions.push(alias);return [];
  });
  const policy={...basePolicy,motions,camera:{...basePolicy.camera,zoomSpace:'relative-to-framing'}};
  const events=compileDirectorEvents(director,policy);
  for(const event of events){
    if(event.end>duration)throw new Error('Integration: decision beyond source duration');
    if(event.type==='zoom'&&framingZoom*event.params.scale>absoluteZoomLimit+1e-9)
      throw new Error('Integration: combined zoom exceeds absolute limit');
  }
  return {version:'1.0',policy,events,unresolvedMotions,
    camera:{profile,framingZoom,absoluteZoomLimit,maxSemanticScale:Math.min(policy.camera.maxZoom,absoluteZoomLimit/framingZoom)},
    // This is a contract preflight, not a renderer or a V1 acceptance result.
    renderReady:false,pending:['timeline-time-map','motion-bindings-and-renderer','look-audio-outro-enforcement','safe-zone-layout','human-style-references','real-e2e']};
}
