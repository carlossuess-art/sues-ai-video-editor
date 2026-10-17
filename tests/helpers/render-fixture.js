import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
export function worker(f,{badFirst=false}={}){
 const script=join(f.dir,'worker.py');writeFileSync(script,`import pathlib,sys,time,json,hashlib
p=pathlib.Path(sys.argv[sys.argv.index('--out')+1]);s=pathlib.Path(sys.argv[sys.argv.index('--source')+1]);time.sleep(.15)
marker=p.parents[2]/'first-seen'
bad=${badFirst?'True':'False'} and not marker.exists()
marker.write_text('seen')
p.write_bytes(b'0000ftyp89')
audit={'version':'1.0','sourcePreserved':True,'fullDecode':'pass','sourceSha256':hashlib.sha256(s.read_bytes()).hexdigest(),'outputSha256':('0'*64 if bad else hashlib.sha256(p.read_bytes()).hexdigest()),'bytes':10,'video':{'codec':'h264','width':1080,'height':1920,'fps':'30/1'},'durationEncoded':24,'audioPresent':True}
p.with_suffix('.audit.json').write_text(json.dumps(audit))
`);return script;
}
