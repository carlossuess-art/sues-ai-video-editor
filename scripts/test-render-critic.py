import importlib.util,json,pathlib,subprocess,tempfile
spec=importlib.util.spec_from_file_location('sues_render_audit',pathlib.Path(__file__).with_name('audit-render.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
with tempfile.TemporaryDirectory(prefix='sues-critic-silence-') as directory:
 root=pathlib.Path(directory);video=root/'silent.mp4';manifest=root/'manifest.json'
 subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','color=c=blue:s=270x480:r=30:d=1','-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t','1','-c:v','libx264','-preset','ultrafast','-c:a','aac','-shortest',str(video)],check=True)
 manifest.write_text(json.dumps({'duration':1,'captions':[]}))
 result=module.audit(video,manifest,root/'audit')
 assert result['fullDecode']=='pass' and result['audioPresent']
 assert not result['technicalPass'] and 'audio-silent-or-unusually-quiet' in result['issues']
 print(json.dumps({'silentEncodedAudioRejected':True,'technicalPass':result['technicalPass']}))