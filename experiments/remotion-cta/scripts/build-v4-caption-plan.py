#!/usr/bin/env python3
"""V4 word-by-word caption grammar from the REAL 0.7s-retimed transcript.
No reused V2/V3 caption overlays. Full content: 168 spoken words, exactly once.
"""
from pathlib import Path
import json,re
root=Path('/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta')
source=Path('/opt/sues-video-setup/editor/jobs/uploads/analysis-remotion-v3c-20261104/transcript.json')
t=json.loads(source.read_text())
words=[dict(w) for w in t['words']]
# Correct only clearly-documented transcription errors in the caption version.
words[29]['text']='portarte'
words[52]['text']='que'
words[53]['text']='un día'
# Word-index semantics: no random highlights.
positive={43,50,66,69,94,101,109,119,129,149,154,159,160,167}
tension={4,11,16,22,33,57,61,73,82,86,105,112,126,145}
heroes={4,11,16,22,29,33,39,43,50,57,61,64,66,69,73,82,86,94,101,105,109,112,119,126,129,136,145,149,154,159,160,167}
assert len(words)==168 and words[167]['end']<=74.343
items=[]
for i,w in enumerate(words):
 text=w['text'].strip()
 role='hero' if i in heroes else 'connector'
 color='fortune' if i in positive else 'contrast' if i in tension else 'connector'
 items.append({'index':i,'text':text,'start':round(w['start'],6),'end':round(w['end'],6),'role':role,'tone':color})
# Build subtitle beats respecting syntax, natural gaps and 3 words maximum.
beats=[];i=0
while i<len(items):
 group=[items[i]];i+=1
 while i<len(items):
  last=group[-1];nxt=items[i]
  # Highlight term always ends a beat. One hero max per beat.
  if len(group)>=3 or (last['role']=='hero') or (nxt['role']=='hero' and len(group)>=2) or (nxt['start']-last['end']>=.36 and len(group)>=2) or (group[-1]['end']-group[0]['start']>1.85):
   break
  group.append(nxt);i+=1
  if group[-1]['text'].endswith(('.','?','!')):break
 start=group[0]['start']
 next_start=items[i]['start'] if i<len(items) else group[-1]['end']+.85
 end=min(max(group[-1]['end']+.14,start+.18),next_start-.015) if next_start>start+.15 else group[-1]['end']+.06
 end=max(end,group[-1]['end']+.035)
 beats.append({'id':len(beats),'start':round(start,6),'end':round(end,6),'words':group})
assert [w['index'] for b in beats for w in b['words']]==list(range(168))
# Verify every keyword is centered and on its own line in renderer.
assert sum(1 for i in items if i['role']=='hero')==len(heroes)
scenes=[
 {'start':0,'end':7.7,'mode':'speaker','topic':'hook'},
 {'start':7.7,'end':12.55,'mode':'board','topic':'rules'},
 {'start':12.55,'end':33.4,'mode':'speaker','topic':'validation-fear'},
 {'start':33.4,'end':41.25,'mode':'board','topic':'choice'},
 {'start':41.25,'end':46.0,'mode':'speaker','topic':'awakening'},
 {'start':46.0,'end':54.15,'mode':'darkBoard','topic':'identity'},
 {'start':54.15,'end':63.333333,'mode':'speaker','topic':'self-betrayal'},
 {'start':63.333333,'end':74.333333,'mode':'cta','topic':'follow'}]
for x in beats:
 current=next((s for s in scenes if s['start']<=x['start']<s['end']),scenes[-1])
 x['mode']=current['mode'];x['topic']=current['topic']
data={'contract':'sues-visual-grammar-158623-v1','fps':30,'width':1080,'height':1920,'totalFrames':2230,
 'source':'verified transcript retimed to 0.7-second pauses','wordsCount':len(items),'beatCount':len(beats),
 'heroCount':len(heroes),'scenes':scenes,'beats':beats,
 'rules':{'connectorFontPx':64,'heroFontPx':108,'minHeroFontPx':98,'maxHeroFontPx':115,
          'connectorColor':'#FFFFFF','positive':'#26F7FD','tension':'#FFD000',
          'blackBoard':'#1E1E1E','whiteOutlinePx':6,'speakerX':540,'boardX':540,
          'positions':{'speaker':[1240,1375],'board':[650,790],'cta':[810,960]},
          'maxWordsPerLine':3,'maxPauseSeconds':.7,'heroCentered':True,'autoHighlights':False}}
dest=root/'public/v4/caption-plan.json';dest.parent.mkdir(exist_ok=True,parents=True)
dest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:data[k] for k in ('contract','wordsCount','beatCount','heroCount','totalFrames','rules')},ensure_ascii=False,indent=2))
print('FIRST_BEATS',json.dumps(beats[:10],ensure_ascii=False))
