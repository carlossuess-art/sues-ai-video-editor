import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');

test('editor shell keeps persistent preview and export actions',()=>{
  assert.match(html,/id="render"[^>]*>Previsualizar</);
  assert.match(html,/id="export-video"[^>]*>Exportar MP4</);
  assert.match(html,/id="source-video"/);
  assert.match(html,/id="video"/);
});

test('task toolbar exposes only controls backed by current editor state',()=>{
  for(const tool of ['material','style','music','sfx','captions','visuals','camera','mix']){
    assert.match(html,new RegExp('data-editor-tool="'+tool+'"'));
  }
  assert.doesNotMatch(html,/data-editor-tool="look"/);
});

test('AI adjustment is visible but disabled until Director endpoint exists',()=>{
  assert.match(html,/id="ai-adjust"[^>]*disabled/);
  assert.match(html,/>✨ Ajustar con IA</);
});

test('real mixer controls retain existing backend ids',()=>{
  for(const id of ['music-gain','sfx-gain','music-duck','music-enabled','sfx-enabled']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
});
