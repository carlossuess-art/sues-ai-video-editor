#!/usr/bin/env python3
"""Inspect decoded export media. Technical evidence, never creative approval."""
import argparse,hashlib,json,pathlib,subprocess,math,re
def run(args):
    return subprocess.run(args,capture_output=True,text=True,check=True)
def audit(video,manifest,out):
    out.mkdir(parents=True,exist_ok=True)
    m=json.loads(manifest.read_text())
    probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]).stdout)
    streams=probe['streams'];v=next(s for s in streams if s['codec_type']=='video')
    a=next((s for s in streams if s['codec_type']=='audio'),None)
    errors=[]
    decode=run(['ffmpeg','-hide_banner','-xerror','-i',str(video),'-vf','blackdetect=d=0.3:pix_th=0.1,freezedetect=n=-60dB:d=2','-f','null','-'])
    black=[{'start':float(a),'end':float(b),'duration':float(d)} for a,b,d in re.findall(r'black_start:([0-9.]+) black_end:([0-9.]+) black_duration:([0-9.]+)',decode.stderr)]
    frozen=[float(t) for t in re.findall(r'freeze_start: ([0-9.]+)',decode.stderr)]
    duration=float(probe['format']['duration'])
    if abs(duration-m['duration'])>.12: errors.append('duration-mismatch')
    if not a: errors.append('audio-stream-missing')
    loudness=None
    if a:
        measured=run(['ffmpeg','-hide_banner','-i',str(video),'-vn','-af','loudnorm=I=-16:TP=-1:LRA=7:print_format=json','-f','null','-'])
        loudness=json.loads(measured.stderr[measured.stderr.rfind('{'):measured.stderr.rfind('}')+1])
        if not math.isfinite(float(loudness['input_i'])) or float(loudness['input_i']) < -35: errors.append('audio-silent-or-unusually-quiet')
        if float(loudness['input_tp'])>-.8: errors.append('true-peak-over-minus-0.8dBTP')
        if abs(float(v.get('start_time',0))-float(a.get('start_time',0)))>.08: errors.append('stream-start-offset')
    marks=[]
    for c in m['captions']:
        if not c.get('keyword') or c['end']-c['start']<.16: continue
        marks.append({'captionId':c['id'],'text':c['text'],'time':round((c['start']+c['end'])/2,3),'plannedStyle':c['keyword'].get('style'),'plannedScale':c['keyword'].get('scale')})
    # At most 16 evenly distributed planned cues; an explicit sample, not OCR.
    chosen=[marks[round(i*(len(marks)-1)/min(15,len(marks)-1))] for i in range(min(16,len(marks)))] if len(marks)>1 else marks
    for i,mark in enumerate(chosen):
        target=out/('caption-%02d.jpg'%i)
        run(['ffmpeg','-v','error','-ss',str(mark['time']),'-i',str(video),'-frames:v','1','-vf','scale=360:640','-y',str(target)])
        mark['frame']=target.name
    contact=out/'contact.jpg'
    run(['ffmpeg','-v','error','-i',str(video),'-vf','fps=1/2,scale=180:320,tile=7x5','-frames:v','1','-y',str(contact)])
    result={'schema':'sues-render-audit/v1','outputSha256':hashlib.file_digest(video.open('rb'),'sha256').hexdigest(),
      'fullDecode':'pass','duration':duration,'plannedDuration':m['duration'],'bytes':video.stat().st_size,
      'video':{k:v.get(k) for k in ('codec_name','width','height','r_frame_rate')},'audioPresent':bool(a),'loudness':loudness,
      'issues':errors,'technicalPass':not errors,'blackIntervals':black,'freezeStarts':frozen,'temporalFindingsNeedContextReview':True,'sampledCaptionFrames':chosen,
      'plannedComponents':{'broll':len(m.get('selectedMedia',[])),'transitions':len(m.get('globalTransitions',[])),
      'depthText':len(m.get('depthText',[])),'graphics':len(m.get('masterGraphics',[])),'music':bool(m.get('audioMix'))},
      'limits':['Planned counts do not prove visible or audible execution.','Sampled frames require visual review.','No subjective audio review or artistic approval.','No full-person tracking inferred.'],
      'creativeAcceptance':False}
    (out/'audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    return result
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('video',type=pathlib.Path);p.add_argument('manifest',type=pathlib.Path);p.add_argument('output',type=pathlib.Path)
    x=p.parse_args();r=audit(x.video,x.manifest,x.output);print(json.dumps({'technicalPass':r['technicalPass'],'issues':r['issues'],'sha256':r['outputSha256']}))