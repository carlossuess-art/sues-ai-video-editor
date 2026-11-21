// Read-only memory inspection for SUES MASTER DIRECTOR previews.
// Never relax the safety floor merely because a container test failed.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

export const PREVIEW_MIN_FREE_BYTES = 512*1024*1024;
const fail = (reason, data={}) => ({ok:false,reason,minFreeBytes:PREVIEW_MIN_FREE_BYTES,...data});
const valid = n => Number.isSafeInteger(n) && n>=0;

export function inspectMasterPreviewMemoryBudget({read=readFileSync}={}){
 try{
  const host=String(read('/proc/meminfo','utf8')).match(/^MemAvailable:\s+(\d+)\s+kB$/m);
  if(!host)return fail('HOST_MEMORY_UNOBSERVABLE');
  const hostAvailableBytes=Number(host[1])*1024;
  if(!valid(hostAvailableBytes))return fail('HOST_MEMORY_UNOBSERVABLE');
  const context={hostAvailableBytes};
  if(hostAvailableBytes<PREVIEW_MIN_FREE_BYTES)return fail('HOST_MEMORY_LOW',context);
  const membership=String(read('/proc/self/cgroup','utf8')).match(/^0::([^\r\n]*)$/m);
  if(!membership)return {ok:true,reason:'READY_HOST_ONLY',minFreeBytes:PREVIEW_MIN_FREE_BYTES,...context};
  const base=join('/sys/fs/cgroup',membership[1]||'/');
  const limitText=String(read(join(base,'memory.max'),'utf8')).trim();
  if(limitText==='max')return {ok:true,reason:'READY_CGROUP_UNLIMITED',minFreeBytes:PREVIEW_MIN_FREE_BYTES,...context};
  const cgroupLimitBytes=Number(limitText),cgroupUsedBytes=Number(String(read(join(base,'memory.current'),'utf8')).trim());
  if(!valid(cgroupLimitBytes)||!valid(cgroupUsedBytes))return fail('CGROUP_MEMORY_UNOBSERVABLE',context);
  const cgroupAvailableBytes=Math.max(0,cgroupLimitBytes-cgroupUsedBytes);
  const observed={...context,cgroupLimitBytes,cgroupUsedBytes,cgroupAvailableBytes};
  if(cgroupAvailableBytes<PREVIEW_MIN_FREE_BYTES)return fail('CGROUP_MEMORY_LOW',observed);
  return {ok:true,reason:'READY',minFreeBytes:PREVIEW_MIN_FREE_BYTES,...observed};
 }catch(error){
  return fail('MEMORY_INSPECTION_FAILED',{errorCode:typeof error?.code==='string'?error.code:'UNKNOWN'});
 }
}
