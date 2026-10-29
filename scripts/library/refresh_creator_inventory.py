#!/usr/bin/env python3
"""Merge metadata only. Usage: SNAPSHOT EXISTING_CATALOG OUTPUT.
Private inventories and media must remain outside Git. No approvals are granted.
"""
import json,re,sys
from pathlib import Path

def refresh(snapshot,catalogue):
    if catalogue.get('schema')!='sues-resource-audit/v1':raise ValueError('Unsupported catalogue')
    cards=catalogue['cards'];known={c['driveId'] for c in cards}
    if len(known)!=len(cards):raise ValueError('Duplicate existing Drive IDs')
    files={}
    for item in snapshot['items']:
        if item.get('mime_type')=='application/vnd.google-apps.folder':continue
        if not re.fullmatch(r'[\w-]{10,160}',item['id']):raise ValueError('Invalid Drive ID')
        files[item['id']]=item
    added=[]
    for drive_id,item in sorted(files.items()):
        if drive_id in known:continue
        mime=item['mime_type'];name=item['title'];ext=Path(name).suffix.lower()
        kind=('video-candidate' if mime.startswith('video/') else 'audio-source' if mime.startswith('audio/') else 'brand-media-candidate' if mime.startswith('image/') else 'font' if ext in ['.otf','.ttf'] else 'shortcut-unresolved' if mime=='application/vnd.google-apps.shortcut' else 'effect-source' if ext in ['.mogrt','.drfx','.fuse','.ffx','.prfpset','.glb'] else 'project-document-reference-or-output' if mime.startswith('application/vnd.google-apps.') or ext in ['.pdf','.docx'] else 'source-package-or-dependency')
        card={'driveId':drive_id,'resourceId':'DRIVE-'+drive_id,'name':name,'url':'https://drive.google.com/file/d/'+drive_id+'/view','mimeType':mime,'bytes':int(item.get('size') or 0),'folder':item.get('category'),'parentDriveId':item.get('parent'),'kind':kind,'availabilityEvidence':'creator-club-direct-folder-listing-2026-10-29','nativeImported':False,'nativeAssetId':None,'sha256':None,'bytesVerified':False,'decodeStatus':'not-retested','sampleReviewCount':0,'visibleContentEs':None,'fullVisualWatch':False,'needsSemanticReview':True,'technicalAuditStatus':'metadata-only','requiresAdaptation':kind in ['effect-source','source-package-or-dependency'],'eligibleForNewGeminiRequest':False,'reviewState':'discovered-not-verified','lifecycleEvidence':{'catalogued':True,'reviewScope':'metadata-only','compatible':'not-editor-verified','available':'drive-listed-not-runtime-tested','renderTested':False,'selectionExcluded':False},'rightsReview':'user-supplied-bank; per-file terms not verified'}
        cards.append(card);added.append(drive_id)
    catalogue['creatorClubRefresh']={'date':'2026-10-29','rootDriveId':'1l8P_ZvOmLfWiy1vN0HiH8-rV_BNtTnqR','listedFiles':len(files),'catalogueCards':len(cards),'newCards':len(added),'approvalGranted':False,'scope':'metadata-only; historical summaries remain dated evidence'}
    return catalogue

if __name__=='__main__':
    source,existing,out=map(Path,sys.argv[1:])
    result=refresh(json.loads(source.read_text()),json.loads(existing.read_text()))
    data=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
    if len(data.encode())>8*1024*1024:raise ValueError('Catalogue exceeds runtime limit')
    out.write_text(data)
    print(json.dumps(result['creatorClubRefresh']))
