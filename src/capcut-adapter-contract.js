const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};

export const CAPCUT_ACTIONS=Object.freeze([
  'create_edit','apply_template','smart_cut','apply_style','change_caption_style',
  'add_motion','reframe_face','preview','validate','restore'
]);

export function validateCapcutRequest(r){
  assert(r&&r.version==='1.0','CapCut adapter: versión');
  assert(CAPCUT_ACTIONS.includes(r.action),'CapCut adapter: acción');
  assert(typeof r.projectRef==='string'&&r.projectRef.length>0,'CapCut adapter: projectRef');
  assert(r.cloneOriginal===true,'CapCut adapter: cloneOriginal obligatorio');
  assert(r.validateBeforeOpen===true,'CapCut adapter: validateBeforeOpen obligatorio');
  if(r.action==='restore') assert(typeof r.backupRef==='string'&&r.backupRef.length>0,'CapCut adapter: backupRef');
  return true;
}

export function adapterBoundary(){
  return Object.freeze({
    role:'optional-export-adapter',
    criticalForV1:false,
    rules:[
      'never-modify-original',
      'clone-before-write',
      'version-check',
      'lint-before-open',
      'preview-before-handoff',
      'replaceable-cli-or-mcp'
    ]
  });
}
