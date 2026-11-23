"""Audit the installed DAEDAL packs without changing the library or rights metadata.
Every admitted asset matches its supplied index SHA/size and local CC0 licence.
Semantic labels remain filename/category candidates, never creative approval.
"""
import hashlib,json,pathlib,sys,os
root=pathlib.Path(sys.argv[1]).resolve();out=pathlib.Path(sys.argv[2]).resolve()
if root!=pathlib.Path('/srv/sues-fablecut-next/data') or out.parent!=root/'automation-v1' or out.exists():raise ValueError('private audit output required')
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def contained(p):
 p=p.resolve()
 if not p.is_relative_to(root) or not p.is_file():raise ValueError('invalid source path')
 return p
rows=[];native={};licensed={};blocked=[];licences={}
for kind,idx,docroot,sub in [('audio',root/'library/sfx/DAEDAL_SFX_INDEX.json',root/'library/sfx/DAEDAL_Documentacion','effects'),('visual',root/'daedal-vfx-originals/DAEDAL_VFX_INDEX.json',root/'daedal-vfx-originals/documentation','files')]:
 index=json.loads(idx.read_text())
 for a in index[sub]:
  try:
   pack=a['pack'];assert pack.replace('-','').isalnum()
   lp=contained(docroot/pack/'LICENSE.txt');lt=lp.read_text()
   if 'CC0 1.0 Universal' not in lt or 'commercial projects' not in lt or 'no third-party footage or presets were used' not in lt:raise ValueError('license text insufficient')
   file=contained(root/('library/sfx' if kind=='audio' else 'library')/a['relative_path'])
   digest=sha(file)
   if digest!=a['sha256'] or file.stat().st_size!=a['bytes']:raise ValueError('hash/size mismatch')
   ext=file.suffix.lower();media_kind={'.wav':'audio','.mp4':'video','.mov':'video','.webm':'video','.png':'image','.jpg':'image','.jpeg':'image'}.get(ext)
   if not media_kind or kind=='audio' and media_kind!='audio':raise ValueError('unsupported media format')
   stream=(a.get('video_streams') or [{}])[0];duration=a.get('duration_seconds') or 0
   licence_sha=sha(lp);licences[pack]={'file':str(lp),'sha256':licence_sha,'license':'CC0-1.0','commercialUseAllowed':True}
   native[digest]={'id':digest,'file':str(file),'src':'/media/daedal-'+digest[:24]+ext,'name':file.name,'kind':media_kind,'duration':duration,'size':a['bytes'],'sha256':digest,'licenseFile':str(lp),'licenseSha256':licence_sha,'license':'CC0-1.0',**({'width':stream['width'],'height':stream['height']} if stream.get('width') and stream.get('height') else {})}
   licensed[digest]={'sha256':digest,'rightsVerified':True,'commercialUseAllowed':True,'kind':media_kind,'duration':duration,'origin':'DAEDAL local publisher pack','license':'CC0-1.0','proofRef':str(lp),'proofSha256':licence_sha}
   rows.append({'id':digest,'relativePath':str(file.relative_to(root/'library')),'type':media_kind,'category':a.get('category'),'pack':pack,'tags':[a.get('category',''),pack],'physicalStatus':'PRESENT','indexDuration':duration,'license':'CC0-1.0','rightsVerified':True,'commercialUseAllowed':True,'semanticMatch':'NAME_OR_TAG_INFERENCE_ONLY','compatibility':'native-audio' if media_kind=='audio' else 'native-visual','usageStatus':'RIGHTS_VERIFIED_NOT_CREATIVE_APPROVED'})
  except Exception as e:blocked.append({'name':a.get('name',a.get('filename')),'reason':str(e)})
result={'schema':'sues-daedal-verified-library/v1','scope':'private-license-evidence-no-creative-approval','assets':rows,'nativeAssets':native,'licensedAssets':licensed,'licences':licences,'blocked':blocked}
with out.open('x') as f:os.chmod(out,0o600);json.dump(result,f,indent=2)
print(json.dumps({'indexed':len(rows)+len(blocked),'verified':len(rows),'unique':len(native),'blocked':len(blocked),'audio':sum(a['type']=='audio' for a in rows),'visual':sum(a['type']!='audio' for a in rows),'licenses':len(licences),'manifest':str(out),'sha256':sha(out),'firstBlocked':blocked[:5]}))
