import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWordTimestampResult,normalizeOpenAIWhisperVerbose,openAIWhisperRequestSpec,validateASRAdapter} from '../src/asr.js';

test('generic word timestamps normalize to Transcript v1',()=>{
  const t=normalizeWordTimestampResult({
    language:'es',duration:2,text:'Hola mundo',
    words:[{text:'Hola',start:0,end:.5,confidence:.9},{text:'mundo',start:.6,end:1.1}]
  });
  assert.equal(t.version,'1.0');
  assert.equal(t.words[0].confidence,.9);
  assert.equal(t.timing,'word');
});

test('OpenAI whisper verbose_json maps word field',()=>{
  const t=normalizeOpenAIWhisperVerbose({
    language:'spanish',duration:1.2,text:'Hola',
    words:[{word:'Hola',start:.1,end:.8}]
  });
  assert.equal(t.provider,'openai/whisper-1');
  assert.equal(t.words[0].text,'Hola');
});

test('source duration override keeps original media duration contract',()=>{
  const t=normalizeOpenAIWhisperVerbose({
    language:'es',duration:1,text:'Hola',
    words:[{word:'Hola',start:.1,end:.8}]
  },{sourceDuration:1.5});
  assert.equal(t.sourceDuration,1.5);
});

test('request spec asks for real word timestamps without executing API',()=>{
  assert.deepEqual(openAIWhisperRequestSpec(),{
    model:'whisper-1',
    response_format:'verbose_json',
    timestamp_granularities:['word'],
    language:'es'
  });
});

test('invalid ASR results and adapters fail closed',()=>{
  assert.throws(()=>normalizeWordTimestampResult({duration:2,words:[]}));
  assert.throws(()=>validateASRAdapter({}));
  assert.equal(validateASRAdapter({transcribe(){}}),true);
});
