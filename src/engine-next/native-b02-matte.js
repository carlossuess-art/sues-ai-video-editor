/** Strict fixed-scene staging adapter. Converts a verified MODNet grayscale file
 * to separate editable FableCut V2 child, V3 Carlos foreground and V4 track matte.
 * No production writes. No review approval. Caller owns asset upload/revision CAS.
 */
export function stageNativeB02Matte(project,{matteSrc,matteBytes,expectedRevision}={}){
 if(!project||!/^SUES 158404 · NATIVE LUMA MATTE PROOF · NOT APPROVED$/.test(project.name||'')||
   project.width!==1080||project.height!==1920||project.fps!==30||
   !Number.isInteger(expectedRevision)||project.revision!==expectedRevision||
   typeof matteSrc!=='string'||!/^\/media\/[a-zA-Z0-9][a-zA-Z0-9_.-]{0,120}\.mp4$/.test(matteSrc)||
   !Number.isSafeInteger(matteBytes)||matteBytes<1000)throw Error('Strict isolated staging contract required');
 const ids=new Set(project.tracks?.filter(t=>t.kind==='video').map(t=>t.id));
 if(!['V1','V2','V3','V4'].every(id=>ids.has(id)))throw Error('Required native video tracks absent');
 const base=project.clips.find(c=>c.id==='sues_video_source'),kid=project.clips.find(c=>c.id==='sues_b02_child_review_only');
 const voice=project.clips.find(c=>c.id==='sues_audio_original');
 if(base?.kind!=='video'||base?.track!=='V1'||!base.locked||base.start!==0||
   kid?.track!=='V2'||kid?.kind!=='image'||kid.disabled!==true||kid.start!==9.5||kid.duration!==4||
   voice?.kind!=='audio'||voice.track!=='A1'||voice.start!==0||voice.disabled===true||
   project.clips.some(c=>c.kind==='audio'&&c.id!==voice.id&&!c.disabled&&c.start<13.5&&c.start+c.duration>9.5))
   throw Error('Unmodified B02 staging resources required');
 const proposed=['sues_b02_carlos_foreground_luma_qa','sues_b02_temporal_luma_qa'];
 if(project.clips.some(c=>proposed.includes(c.id))||project.media.some(m=>m.id==='m_sues_b02_modnet_luma_qa'))throw Error('Matte already staged');
 // Leave existing title, hand and 3D completely intact. Never overlay another
 // active V3/V4 clip during the protected four-second B02 interval.
 if(project.clips.some(c=>!c.disabled&&['V3','V4'].includes(c.track)&&c.start<13.5&&c.start+c.duration>9.5))throw Error('B02 intersects an active upper layer');
 const next=structuredClone(project),c=next.clips.find(x=>x.id===kid.id);delete c.disabled;
 // A video + its duplicate foreground + an explicit voice track otherwise
 // mix the same spoken words three times. The QA scene owns ONE voice bus.
 next.clips.find(x=>x.id===base.id).props.volume=0;
 next.clips.find(x=>x.id===voice.id).props={...next.clips.find(x=>x.id===voice.id).props,volume:0.8};
 c.name='B02 kid behind Carlos · native matte staging only';
 c.props={...c.props,fit:'contain',x:340,y:-160,scale:.85,masks:[{shape:'rect',x:.5,y:.5,w:1,h:1,mode:'add',opacity:1,feather:90}]};
 next.media.push({id:'m_sues_b02_modnet_luma_qa',kind:'video',name:'MODNet B02 person grayscale 120f',src:matteSrc,width:512,height:896,duration:4,fps:30,size:matteBytes});
 const fg=structuredClone(base);fg.id=proposed[0];fg.name='Carlos foreground · V4 native luma QA';fg.track='V3';fg.start=9.5;fg.in=9.5;fg.duration=4;delete fg.locked;
 fg.props={...fg.props,matte:'luma',matteTrack:'V4',volume:0};
 next.clips.push(fg,{id:proposed[1],mediaId:'m_sues_b02_modnet_luma_qa',kind:'video',track:'V4',start:9.5,in:0,duration:4,name:'MODNet temporal V4 luma source · QA',props:{fit:'cover',scale:1,x:0,y:0,opacity:1}});
 return next;
}
