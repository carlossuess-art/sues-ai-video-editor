#!/usr/bin/env python3
"""Generate a reversible alpha-only edge feather for a verified B02 QA asset.

This tool does NOT retouch RGB colors, faces, skin, masks of the speaker or any
production asset. It fails closed for unexpected dimensions or fingerprints.
"""
import argparse,hashlib,json,math,subprocess
from pathlib import Path

EXPECTED_WIDTH=512
EXPECTED_HEIGHT=896

def sha256(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):
            h.update(block)
    return h.hexdigest()

def ramp(distance,pixels):
    if pixels==0:return 1.0
    u=max(0.0,min(1.0,(distance+0.5)/pixels))
    return u*u*(3-2*u)

def apply_alpha_edges(raw,width,height,bottom,right):
    if len(raw)!=width*height*4:raise ValueError('Wrong RGBA buffer size')
    if not isinstance(bottom,int) or not isinstance(right,int) or not 0<=bottom<=height//3 or not 0<=right<=width//4 or (bottom==0 and right==0):
        raise ValueError('Feather bounds invalid')
    result=bytearray(raw)
    for y in range(height):
        fy=ramp(height-1-y,bottom)
        for x in range(width):
            fx=ramp(width-1-x,right)
            i=4*(y*width+x)+3
            result[i]=max(0,min(255,round(raw[i]*fx*fy)))
    return bytes(result)

def stage_project(project,newfilename,source_name='sues-child-despill50.png'):
    from copy import deepcopy
    d=deepcopy(project)
    if d.get('width')!=1080 or d.get('height')!=1920 or d.get('fps')!=30 or not isinstance(d.get('revision'),int):
        raise ValueError('Unexpected FableCut canvas or revision')
    clips=d.get('clips',[]); media=d.get('media',[])
    if not isinstance(clips,list) or not isinstance(media,list):raise ValueError('Missing native clips/media')
    child=next((x for x in clips if x.get('id')=='sues_b02_child_review_only'),None)
    base=next((x for x in media if x.get('id')=='m_sues_b02_child_refined50_qa'),None)
    if not child or not base or child.get('mediaId')!=base.get('id') or base.get('src')!='/media/'+source_name or not newfilename.startswith('sues-b02-alpha-') or not newfilename.endswith('.png'):
        raise ValueError('Unexpected original B02 alpha asset binding')
    for id in ['sues_video_source','sues_audio_original']:
        c=next((x for x in clips if x.get('id')==id),None)
        if not c or c.get('locked') is not True:raise ValueError('Locked source and voice required')
    matte=next((x for x in clips if x.get('id')=='sues_b02_temporal_luma_qa'),None)
    carlos=next((x for x in clips if x.get('id')=='sues_b02_carlos_foreground_luma_qa'),None)
    if not matte or not carlos or carlos.get('props',{}).get('matteTrack')!=matte.get('track'):
        raise ValueError('Active person tracking matte must remain')
    if any(x.get('id')=='sues_hyperframes_gold_3d_review_only' and x.get('disabled') is not True for x in clips):
        raise ValueError('Experimental gold must stay disabled')
    base['src']='/media/'+newfilename
    child['name']='B02 children alpha edge-feather QA CANDIDATE'
    d['name']='SUES B02 · alpha edge candidate · DO NOT PUBLISH'
    d['revision']+=1
    return d

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--source',required=True,type=Path)
    p.add_argument('--expected-sha256',required=True)
    p.add_argument('--out-image',required=True,type=Path)
    p.add_argument('--base-project',required=True,type=Path)
    p.add_argument('--out-project',required=True,type=Path)
    p.add_argument('--out-proof',required=True,type=Path)
    p.add_argument('--bottom',required=True,type=int)
    p.add_argument('--right',type=int,default=0)
    args=p.parse_args()
    paths=[args.out_image,args.out_project,args.out_proof]
    if len({str(x.resolve()) for x in paths+[args.source,args.base_project]})!=5:raise ValueError('QA outputs must be distinct from all input files')
    if any(x.exists() for x in paths):raise FileExistsError('Refusing to replace existing image, project or proof')
    sha=sha256(args.source)
    if len(args.expected_sha256)!=64 or sha!=args.expected_sha256:raise ValueError('Unexpected source bytes, no candidate generated')
    if args.source.suffix.lower()!='.png' or args.out_image.suffix.lower()!='.png' or not args.out_image.name.startswith('sues-b02-alpha-'):
        raise ValueError('Only named B02 PNG QA source/candidate supported')
    old=json.loads(args.base_project.read_text())
    candidate=stage_project(old,args.out_image.name)
    raw=subprocess.run(['ffmpeg','-v','error','-i',str(args.source),'-f','rawvideo','-pix_fmt','rgba','-frames:v','1','-'],check=True,capture_output=True).stdout
    new=apply_alpha_edges(raw,EXPECTED_WIDTH,EXPECTED_HEIGHT,args.bottom,args.right)
    if all(raw[i]==new[i] for i in range(3,len(raw),4)):
        raise ValueError('No alpha change detected')
    if any(raw[i]!=new[i] for i in range(len(raw)) if i%4!=3):raise ValueError('RGB changed unexpectedly')
    result=subprocess.run(['ffmpeg','-v','error','-f','rawvideo','-pix_fmt','rgba','-s','512x896','-i','pipe:0','-frames:v','1','-y',str(args.out_image)],input=new,capture_output=True)
    if result.returncode:raise RuntimeError('PNG encoding failed: '+result.stderr.decode(errors='replace')[-400:])
    args.out_project.write_text(json.dumps(candidate,ensure_ascii=False,indent=2)+'\n')
    proof={'schema':'sues-b02-alpha-edge-qa/v1','creativeApproval':False,
           'sourceSha256':sha,'outputSha256':sha256(args.out_image),
           'rgbUnchanged':True,'alphaChanged':True,'dimensions':[512,896],
           'bottomFeatherPixels':args.bottom,'rightFeatherPixels':args.right,
           'mediaBinding':'m_sues_b02_child_refined50_qa','sceneOperationId':'shot-2-2',
           'sourceProjectRevision':old['revision'],'qaProjectRevision':candidate['revision'],
           'status':'NATIVE_PREVIEW_PENDING_NOT_APPROVED'}
    args.out_proof.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(proof,ensure_ascii=False))

if __name__=='__main__':main()
