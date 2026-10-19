import {createHash} from 'node:crypto';

const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;

// Study recipes are explicit editorial direction, never inferred transcripts.
export function validateStudyRecipe(recipe,duration,styleId){
 if(recipe?.version!=='1.0'||!Array.isArray(recipe.labels)||!recipe.labels.length||recipe.labels.length>30)throw Error('Invalid editorial recipe');
 const profile=recipe.profiles?.[styleId];
 if(!profile||!Number.isInteger(profile.subjectEventLimit)||profile.subjectEventLimit<0||profile.subjectEventLimit>6||!Array.isArray(profile.transitions))throw Error('Invalid study profile');
 const range=e=>Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.start>=0&&e.end>e.start&&e.end<=duration;
 for(const [i,label] of recipe.labels.entries())if(!range(label)||typeof label.text!=='string'||!label.text.trim()||label.text.length>120||(i>0&&label.start<recipe.labels[i-1].end))throw Error('Invalid editorial label');
 for(const [i,event] of profile.transitions.entries())if(!range(event)||!['warm','blur','radial'].includes(event.type)||(i>0&&event.start<profile.transitions[i-1].end))throw Error('Invalid study transition');
 if(!Number.isFinite(recipe.musicGain)||recipe.musicGain<0||recipe.musicGain>1||!Number.isFinite(recipe.sfxGain)||recipe.sfxGain<0||recipe.sfxGain>.7)throw Error('Invalid study audio gain');
 return structuredClone({labels:recipe.labels,profile,musicGain:recipe.musicGain,sfxGain:recipe.sfxGain});
}

export function studyFingerprint({plan,settings,fontHashes,backgroundAudioHash,engineHash}){
 if(!engineHash||!fontHashes)throw Error('Study fingerprint requires engine and fonts');
 return createHash('sha256').update(JSON.stringify(stable({version:'editorial-study-v2',plan,settings,fontHashes,backgroundAudioHash:backgroundAudioHash??null,engineHash}))).digest('hex');
}
