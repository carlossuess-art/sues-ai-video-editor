import os,shutil,tempfile,subprocess,time,json,urllib.request
from pathlib import Path
base=Path('/srv/sues-fablecut-next/data/qa/studio-publication-preflight-20261108')
qaRoot=Path('/srv/sues-fablecut-next/data/qa')
# All writes are constrained to a freshly created QA directory. Never select
# the production DATA_DIR or its project.json for restoration.
clone=Path(tempfile.mkdtemp(prefix='publish-restore-drill-',dir=qaRoot))
proc=None
try:
  shutil.copytree(base/'projects',clone/'projects')
  shutil.copytree(base/'media',clone/'media')
  shutil.copy2(base/'project-original.json',clone/'project.json')
  os.chmod(clone,0o700)
  original=json.loads((clone/'project.json').read_text())
  assert original['revision']==54 and len(original['clips'])==6
  proc=subprocess.Popen(['/usr/bin/node','/srv/sues-fablecut-next/app/server.js'],cwd='/srv/sues-fablecut-next/app',env={**os.environ,'PORT':'7783','HOST':'127.0.0.1','FABLECUT_DATA_DIR':str(clone)},stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
  url='http://127.0.0.1:7783'
  def get(path,headers={}):
    with urllib.request.urlopen(urllib.request.Request(url+path,headers=headers),timeout=3) as x:return x.status,x.read(),dict(x.headers)
  for i in range(32):
    if proc.poll() is not None:raise RuntimeError('isolated clone process exited')
    try:
      status,body,_=get('/api/project');break
    except Exception:time.sleep(.2)
  else:raise RuntimeError('isolated clone unavailable')
  recovered=json.loads(body)
  # check native endpoint shape
  if isinstance(recovered,dict) and 'project' in recovered and 'revision' not in recovered:recovered=recovered['project']
  assert recovered['revision']==original['revision'] and len(recovered['clips'])==6
  a=json.dumps(recovered,sort_keys=True,separators=(',',':'));b=json.dumps(original,sort_keys=True,separators=(',',':'))
  assert a==b,'clone project differs from original data'
  st,vers,_=get('/api/versions?project=p_3c0550a1dd');assert st==200
  versions=json.loads(vers)
  st,bk,_=get('/api/projects/backup?id=p_3c0550a1dd');assert st==200
  backup=json.loads(bk);assert backup.get('fablecut')=='backup'
  # A clean restart with the isolated data must preserve the exact document.
  assert json.loads((clone/'project.json').read_text())==original
  print(json.dumps({'status':'PASS','isolated':True,'port':7783,'revision':recovered['revision'],'clips':len(recovered['clips']),'media':len(recovered['media']),'versionsResponseType':type(versions).__name__,'backupBytes':len(bk),'backupFormat':backup['fablecut'],'snapshotChanged':False}))
finally:
  if proc is not None:
    if proc.poll() is None:
      proc.terminate()
      try:proc.wait(timeout=6)
      except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=3)
  shutil.rmtree(clone)
