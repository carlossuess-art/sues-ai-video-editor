#!/usr/bin/env python3
"""Recover legacy SUES editor into an ephemeral networkless container.
No host port, production mounts, proxy, backup rotation or public URL changes.
Do not print or use restored secrets for authentication.
"""
import hashlib,json,os,shutil,subprocess,sys,tarfile,tempfile,time,uuid
from pathlib import Path
from verify_editor_rollback_archive import verify

ROOT=Path('/opt/sues-video-setup');QA=ROOT/'qa-restore-drills'
BACKUP=ROOT/'update-backup-20261029-182329-365998';APP=ROOT/'release-mobile-layers-20261030'
MODULES=ROOT/'fuente.BJjpga/source/node_modules'
NAME='sues-editor-restore-qa-'+uuid.uuid4().hex[:12]
IMAGE='sha256:5b39ca522b4d0758a62a439dd8b2312832fa2baf9f68c97df88da3239ac1e5eb'

def run(*args,timeout=30,check=True):
 return subprocess.run(args,timeout=timeout,check=check,text=True,capture_output=True)

def drill():
 if not APP.is_dir() or not MODULES.is_dir():raise ValueError('production app runtime unavailable')
 proof=verify(BACKUP/'editor-state.tar',BACKUP/'editor-state.manifest.json')
 QA.mkdir(mode=0o700,exist_ok=True)
 if QA.is_symlink() or QA.stat().st_mode&0o077:raise ValueError('QA path permissions unsafe')
 original=ROOT/'editor/project.json'
 original_hash=hashlib.sha256(original.read_bytes()).hexdigest()
 started=False
 try:
  with tempfile.TemporaryDirectory(prefix='editor-startup-',dir=QA) as temp:
   location=Path(temp)
   with tarfile.open(BACKUP/'editor-state.tar','r:') as t:
    for member in t:
     name=member.name.removeprefix('./')
     if not name or name.startswith('/') or '..' in name.split('/') or '\\' in name or not (member.isdir() or member.isfile()) or member.issym() or member.islnk():
      raise ValueError('unsafe TAR entry')
     dest=location/name
     if member.isdir():dest.mkdir(mode=0o700,parents=True,exist_ok=True);continue
     dest.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
     with t.extractfile(member) as source,dest.open('xb') as output:
      shutil.copyfileobj(source,output,length=4*1024*1024)
     dest.chmod(0o600)
   state=location/'editor'
   if not (state/'project.json').is_file() or not (state/'jobs').is_dir():raise ValueError('restored editor files incomplete')
   # The isolated editor is a non-public process in a network namespace with
   # no external route, no host port bindings and no production data mounts.
   for root,dirs,files in os.walk(state):
    os.chown(root,1000,1000)
    for name in dirs:os.chown(os.path.join(root,name),1000,1000)
    for name in files:os.chown(os.path.join(root,name),1000,1000)
   run('docker','run','--detach','--rm','--name',NAME,'--network','none',
      '--cap-drop','ALL','--security-opt','no-new-privileges:true',
      '--read-only','--pids-limit','128','--memory','1024m','--cpus','1',
      '--tmpfs','/tmp:rw,nosuid,nodev,noexec,size=64m',
      '--user','1000:1000',
      '--mount',f'type=bind,src={APP},dst=/app,readonly',
      '--mount',f'type=bind,src={MODULES},dst=/app/node_modules,readonly',
      '--mount',f'type=bind,src={state},dst=/state',
      '--workdir','/app',IMAGE,'node','scripts/app/start.mjs',
      '/state/project.json','/state/jobs','3010',timeout=30)
   started=True
   code='''async function main(){const r=await fetch("http://127.0.0.1:3010/api/health");console.log(JSON.stringify({status:r.status,contentType:r.headers.get("content-type")}));}main().catch(()=>process.exit(5));'''
   last='not-ready';ok=False
   for i in range(30):
    status=run('docker','inspect','--format','{{.State.Running}}',NAME,check=False)
    if status.returncode!=0 or status.stdout.strip()!='true':raise ValueError('restore container exited prematurely')
    result=run('docker','exec',NAME,'node','-e',code,check=False,timeout=5)
    if result.returncode==0:
     response=json.loads(result.stdout.strip().splitlines()[-1]);last=str(response['status']);ok=True;break
    time.sleep(.35)
   if not ok:raise ValueError('restored editor failed local startup probe')
   info=json.loads(run('docker','inspect',NAME,'--format','{{json .HostConfig}}').stdout)
   if info['NetworkMode']!='none' or info['PortBindings'] not in (None,{}):raise ValueError('sandbox unexpectedly exposed')
   print(json.dumps({'status':'PASS','filesVerified':proof['files'],'editorStartedInIsolatedContainer':True,
       'localHealthHttpStatus':int(last),'networkMode':'none','publicPorts':0,
       'restoredIntoProduction':False,'credentialsUsed':False,'containerWasTemporary':True}))
 finally:
  if started:run('docker','rm','--force',NAME,check=False,timeout=15)
  if original.exists() and hashlib.sha256(original.read_bytes()).hexdigest()!=original_hash:
   raise ValueError('production project changed unexpectedly')

if __name__=='__main__':
 try:drill()
 except Exception as e:
  print(json.dumps({'status':'FAILED','reason':str(e)[:180]}));sys.exit(2)
