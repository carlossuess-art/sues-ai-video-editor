#!/usr/bin/env python3
"""Read-only, evidence-bound 158404 → B02 integration audit.

Never writes to FableCut or marks a creative operation executed from mere
proximity of a native clip. Full-reel acceptance requires human video review.
"""
import argparse, hashlib, json, os
from pathlib import Path

STORY = Path('/opt/sues-video-setup/pr27-stage-20261106/real-158404/active-director-story-20261107.json')
PROJECT = Path('/srv/sues-fablecut-next/data/qa/b02-despill50-full-120f-proof-20261108/staging-editable-project.json')
ASR = Path('/srv/sues-fablecut-next/data/qa/b02-local-asr-candidate-20261108/caption-human-review-packet.json')
EVIDENCE = Path('/srv/sues-fablecut-next/data/qa/b02-despill50-full-120f-proof-20261108/manifest.json')
MEDIA_DIR = Path('/srv/sues-fablecut-next/data/media')
EXPORT_DIR = EVIDENCE.parent

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as file:
        for data in iter(lambda: file.read(1024 * 1024), b''):
            h.update(data)
    return h.hexdigest()

def audit(story, project, packet, manifest, source_hash, child_hash, exported_hash):
    issues=[]
    if story.get('schema')!='sues-master-story/v1' or len(story.get('narrative',{}).get('scenes',[]))!=7 or len(story.get('operations',[]))!=49:
        raise ValueError('Unexpected story structure; do not silently omit operations')
    if source_hash!=story.get('sourceSha256') or packet.get('sourceSha256')!=source_hash:
        raise ValueError('Original source hash differs from authoritative creative story')
    resources={r['id']:r for r in story['resources']}
    if child_hash!=resources['B02'].get('expectedSha256'):
        raise ValueError('B02 input image differs from creative story resource')
    expected=manifest.get('artifacts',{}).get('B02-4s-FABLECUT-NATIVE-120f-DESPILL50-V5-UNAPPROVED.mp4')
    if expected!=exported_hash or manifest.get('frameCount')!=120 or manifest.get('fps')!=30 or manifest.get('timelineWindow')!=[9.5,13.5]:
        raise ValueError('Native export evidence mismatch')
    if project.get('width')!=1080 or project.get('height')!=1920 or project.get('fps')!=30:
        raise ValueError('Unexpected native project canvas')
    clips={c['id']:c for c in project.get('clips',[])}
    if len(clips)!=len(project.get('clips',[])):raise ValueError('Duplicate native clip IDs')
    source=clips.get('sues_video_source');voice=clips.get('sues_audio_original')
    if not source or not source.get('locked') or not voice or not voice.get('locked'):
        raise ValueError('Original native video or voice is not protected')
    child=clips.get('sues_b02_child_review_only');foreground=clips.get('sues_b02_carlos_foreground_luma_qa');matte=clips.get('sues_b02_temporal_luma_qa')
    if not child or not foreground or not matte or any((c.get('start'),c.get('duration'))!=(9.5,4) for c in (child,foreground,matte)) or foreground.get('props',{}).get('matteTrack')!=matte.get('track'):
        raise ValueError('B02 native matte and clip coverage cannot be verified')
    if packet.get('automaticallyApproved') is not False or packet.get('status')!='REQUIRES_HUMAN_REVIEW':
        raise ValueError('Audio candidate human-review status unexpectedly changed')
    if packet.get('candidateWordCount')!=len(packet.get('candidates',[])):
        raise ValueError('ASR candidate count inconsistent')
    seen=set();groups={};per_scene={}
    for op in story['operations']:
        if op['id'] in seen:raise ValueError('Duplicate creative operation id')
        seen.add(op['id'])
        group=groups.setdefault(op['track'],{'total':0,'candidateOnly':0,'verified':0})
        group['total']+=1
        sc=per_scene.setdefault(op['sceneId'],{'total':0,'nativeCandidateOnly':0,'verified':0})
        sc['total']+=1
        # This is a verified *existence* of a native scene prototype; not plan completion.
        if op['id']=='shot-2-2' and op['track']=='broll' and op.get('resourceRef')=='B02' and op['start']==9.5 and op['end']==13.5:
            group['candidateOnly']+=1;sc['nativeCandidateOnly']+=1
        # No op is silently promoted to executed or creatively approved.
    if set(per_scene)!={s['id'] for s in story['narrative']['scenes']}:
        raise ValueError('Missing narrative scene')
    gold=clips.get('sues_hyperframes_gold_3d_review_only')
    if gold:
        issues.append({'id':'B02-GOLD-PLACEMENT','severity':'creative-review',
                       'detail':'Gold V5 object partly clipped in real 12-frame contact sheet; narrative necessity/placement unapproved',
                       'nativeProps':{'x':gold['props']['x'],'y':gold['props']['y'],'scale':gold['props']['scale']}})
    issues.extend([
        {'id':'B02-CAPTIONS','severity':'blocked','detail':'11 ASR candidates not human-corrected; no final subtitles enabled'},
        {'id':'B02-MATTE','severity':'review','detail':'Hair/garment matte and child edges require full-motion perceptual inspection'},
        {'id':'B02-AUDIO','severity':'review','detail':'Voice exists in export; no complete approved music or SFX mix'},
        {'id':'REEL-FULL-RENDER','severity':'blocked','detail':'4-second B02 export is not the complete 73.75-second Reel'},
        {'id':'PLAN-NATIVE-MAPPING','severity':'blocked','detail':'None of 49 creative operation IDs have full verified bidirectional execution evidence'},
    ])
    if story['timeline'].get('duration')!=project.get('delivery',{}).get('duration',story['timeline'].get('duration')):
        issues.append({'id':'DURATION-REVIEW','severity':'review','detail':'Inspect timeline differences; never round timestamps silently'})
    return {'schema':'sues-reel-production-readiness/v1', 'creativeApprovalOfThisRender':False,
      'original':{'sourceSha256':source_hash,'b02AssetSha256':child_hash},
      'plan':{'storySchema':story['schema'],'scenes':len(story['narrative']['scenes']),
              'operations':len(story['operations']),'resources':len(resources),'tracks':groups,'scenesById':per_scene},
      'nativeEvidence':{'verifiedNativeExportSha256':exported_hash,'width':1080,'height':1920,'fps':30,
                        'rangeStart':9.5,'rangeEnd':13.5,'frames':120,'clipCount':len(clips),
                        'sourceAndVoiceLocked':True,'b02NativeCandidateExists':True,
                        'previewExportSamples':len(manifest.get('firstFrameParity',{}).get('times',[]))},
      'asr':{'reviewed':False,'candidateWordCount':packet['candidateWordCount'],
              'issues':[x['code'] for x in packet.get('issues',[])]},
      'coverage':{'operationCount':49,'nativeSceneCandidateCount':1,'executedOperationsWithCertifiedManifest':0,
                  'fullReelExportedAndAccepted':False},'blockingIssues':issues,
      'status':'TECHNICAL_B02_CANDIDATE_ONLY_NOT_REEL_READY'}

def main():
    p=argparse.ArgumentParser();p.add_argument('--output',required=True);args=p.parse_args()
    story=json.loads(STORY.read_text());project=json.loads(PROJECT.read_text());packet=json.loads(ASR.read_text());manifest=json.loads(EVIDENCE.read_text());
    report=audit(story,project,packet,manifest,sha256(MEDIA_DIR/'sues-158404-original.mp4'),sha256(MEDIA_DIR/'sues-158404-child.jpg'),sha256(EXPORT_DIR/'B02-4s-FABLECUT-NATIVE-120f-DESPILL50-V5-UNAPPROVED.mp4'))
    output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'output':str(output),'status':report['status'],'coverage':report['coverage'],'sha256':sha256(output)}))

if __name__=='__main__':main()
