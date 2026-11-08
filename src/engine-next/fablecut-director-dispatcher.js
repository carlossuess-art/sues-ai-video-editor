/** A narrow, auditable Master Director -> FableCut MCP command dispatcher.
 * Authorization and project verification are dependencies implemented by the
 * embedding, authenticated SUES host. Never a standalone public MCP proxy.
 * No user-supplied raw operations, overrides, force, or URL are accepted.
 */
import {prepareDirectorNativeTransform} from './fablecut-director-mcp-guard.js';
const IDENT=/^p_[a-zA-Z0-9_-]{2,96}$/;
const safeCause=e=>String(e?.message||'MCP operation failed').slice(0,240);
export class FableCutDirectorDispatchError extends Error{
 constructor(code,message){super(message);this.name='FableCutDirectorDispatchError';this.code=code;}
}
export async function dispatchDirectorNativeTransform(request,{authorize,readProject,invokeMcp,audit}={}){
 if(typeof authorize!=='function'||typeof readProject!=='function'||typeof invokeMcp!=='function'||typeof audit!=='function')
   throw new FableCutDirectorDispatchError('CONFIG','Authenticated SUES dispatcher dependencies required');
 if(!request||typeof request!=='object'||Object.keys(request).some(k=>!['actor','approvalId','projectId','revision','clipId','x','y','scale'].includes(k))||
    typeof request.actor!=='string'||request.actor.length<3||request.actor.length>100||
    typeof request.approvalId!=='string'||!/^[a-zA-Z0-9_-]{12,128}$/.test(request.approvalId)||
    !IDENT.test(request.projectId||'')||!Number.isInteger(request.revision))
   throw new FableCutDirectorDispatchError('INPUT','Unapproved or malformed native transform request');
 const permission=await authorize({actor:request.actor,approvalId:request.approvalId,projectId:request.projectId,action:'native-transform'});
 if(permission!==true)throw new FableCutDirectorDispatchError('FORBIDDEN','SUES approval required before native edit');
 const before=await readProject();
 if(!before||before.projectId!==request.projectId||before.data?.revision!==request.revision)
   throw new FableCutDirectorDispatchError('CONFLICT','Native project changed before dispatch');
 let command;try{command=prepareDirectorNativeTransform({project:before.data,projectId:before.projectId,expectedProjectId:request.projectId,
  revision:request.revision,clipId:request.clipId,x:request.x,y:request.y,scale:request.scale});}
 catch(e){throw new FableCutDirectorDispatchError('INVALID',safeCause(e));}
 const clip=before.data.clips.find(x=>x.id===request.clipId);
 // Audit before and after. If auditing fails, never dispatch an untraceable edit.
 const stamp={schema:'sues-director-mcp-dispatch/v1',actor:request.actor,approvalId:request.approvalId,
    projectId:request.projectId,clipId:request.clipId,fromRevision:request.revision,
    from:{x:clip.props?.x??0,y:clip.props?.y??0,scale:clip.props?.scale??1},to:{x:request.x,y:request.y,scale:request.scale}};
 await audit({...stamp,stage:'approved-before-dispatch'});
 let result;try{result=await invokeMcp(command.tool,command.arguments);}catch(e){
  await audit({...stamp,stage:'dispatch-failed',reason:safeCause(e)});throw new FableCutDirectorDispatchError('MCP_FAILURE','Native MCP operation rejected or unavailable');}
 if(typeof result!=='string'||!new RegExp(`\\bPatched \\(revision ${request.revision+1}\\)`).test(result)){
  await audit({...stamp,stage:'unverified-mcp-response'});
  throw new FableCutDirectorDispatchError('UNVERIFIED','MCP response did not confirm the expected revision');
 }
 const after=await readProject(),updated=after?.data?.clips?.find(x=>x.id===request.clipId);
 const verified=after?.projectId===request.projectId&&after.data.revision===request.revision+1&&updated&&
  updated.props?.x===request.x&&updated.props?.y===request.y&&updated.props?.scale===request.scale&&
  !!updated.disabled===command.expected.disabled&&after.data.clips.length===before.data.clips.length;
 await audit({...stamp,stage:verified?'committed-verified':'post-dispatch-verification-failed',toRevision:after?.data?.revision});
 if(!verified)throw new FableCutDirectorDispatchError('UNVERIFIED','Native state did not match the approved edit; do not retry automatically');
 return {ok:true,schema:stamp.schema,projectId:after.projectId,revision:after.data.revision,clipId:request.clipId,
  previousRevision:request.revision,readOnly:false,approved:true,rolledBack:false};
}
