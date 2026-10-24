#!/usr/bin/env python3
"""Run an already installed, authorized local model. No network or model downloads."""
import argparse,hashlib,json,pathlib,re,subprocess,time
p=argparse.ArgumentParser()
p.add_argument('--llama',type=pathlib.Path,required=True);p.add_argument('--model',type=pathlib.Path,required=True)
p.add_argument('--request',type=pathlib.Path,required=True);p.add_argument('--out',type=pathlib.Path,required=True)
p.add_argument('--timeout',type=int,default=480)
x=p.parse_args()
if not 30<=x.timeout<=900:raise ValueError('Inference budget: 30..900 seconds')
request=json.loads(x.request.read_text());x.out.mkdir(parents=True,exist_ok=True)
prompt=x.out/'model-prompt.txt';prompt.write_text(request['prompt'])
command=[str(x.llama.resolve()),'-m',str(x.model.resolve()),'-ngl','0','-t','1','-tb','1','-b','128','-ub','128','-c','4096','-n','700','--temp','0','--no-warmup','--single-turn','--no-display-prompt','--simple-io','--reasoning','off','-f',str(prompt.resolve())]
started=time.monotonic();status='running'
try:
 with (x.out/'model-stdout.txt').open('w') as stdout,(x.out/'model-stderr.txt').open('w') as stderr:
  result=subprocess.run(command,stdout=stdout,stderr=stderr,timeout=x.timeout,check=True)
 raw=(x.out/'model-stdout.txt').read_text()
 if len(raw)>100000:raise ValueError('Model output limit')
 decoder=json.JSONDecoder();responses=[]
 for match in re.finditer(r'(?:^|\n)\s*(\{)',raw):
  try:obj,_=decoder.raw_decode(raw[match.start(1):])
  except json.JSONDecodeError:continue
  if isinstance(obj,dict) and obj.get('schema')=='sues-model-director/v1' and obj.get('inputSha256')==request['inputSha256']:responses.append(obj)
 if len(responses)!=1:raise ValueError('Expected exactly one complete, source-bound model response')
 (x.out/'model-response.json').write_text(json.dumps(responses[0],ensure_ascii=False,indent=2))
 status='response-ready-for-validator'
except subprocess.TimeoutExpired:
 status='inference-budget-exhausted';raise
except Exception:
 status='response-rejected';raise
finally:
 metadata={'status':status,'elapsedSeconds':round(time.monotonic()-started,2),'inputSha256':request['inputSha256'],
 'modelFile':x.model.name,'modelSha256':hashlib.file_digest(x.model.open('rb'),'sha256').hexdigest(),
 'promptSha256':hashlib.sha256(prompt.read_bytes()).hexdigest(),'maxGeneratedTokens':700,'timeoutSeconds':x.timeout,
 'requiresExecutionValidation':True,'creativeAcceptance':False}
 (x.out/'inference.json').write_text(json.dumps(metadata,indent=2))
 print(json.dumps(metadata),flush=True)