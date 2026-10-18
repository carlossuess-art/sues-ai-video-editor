#!/usr/bin/env python3
"""Original procedural ambient pad for an editorial preview; no samples/models/APIs."""
import argparse,json,pathlib,wave
import numpy as np

def create(output):
    rate=48000;duration=46;n=int(rate*duration)
    mix=np.zeros((n,2),dtype=np.float64)
    chords=[(0,[36,48,55,59,62,64]),(10,[33,45,52,55,59,60]),(20,[29,41,48,52,57,60]),(30,[36,43,50,52,55,62])]
    for ci,(start,notes) in enumerate(chords):
        length=16;count=int(length*rate);time=np.arange(count)/rate
        envelope=np.minimum(1,time/3)*np.minimum(1,(length-time)/4)
        envelope=np.sin(np.clip(envelope,0,1)*np.pi/2)**2
        for j,midi in enumerate(notes):
            f=440*2**((midi-69)/12);strength=.35 if j==0 else .12
            for channel in range(2):
                detune=2**(((channel*2-1)*1.7)/1200)
                phase=(ci+j+channel)*.713
                carrier=np.sin(2*np.pi*f*detune*time+phase)+.12*np.sin(2*np.pi*f*detune*2*time+phase*.5)+.025*np.sin(2*np.pi*f*detune*3*time)
                modulation=.93+.07*np.sin(2*np.pi*(.035+j*.003)*time+phase)
                a=int(start*rate);mix[a:a+count,channel]+=carrier*envelope*modulation*strength
    dry=mix.copy()
    for delay,gain in [(.47,.12),(.83,.09),(1.31,.06),(2.09,.035)]:
        k=int(delay*rate);mix[k:]+=dry[:-k,::-1]*gain
    t=np.arange(n)/rate;mix*=np.minimum(1,t/1.3)[:,None]*np.minimum(1,(duration-t)/3)[:,None]
    mix-=mix.mean(axis=0);mix*=.78/np.max(np.abs(mix))
    if output.exists():raise ValueError('Output must be new')
    output.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(output),'wb') as audio:audio.setnchannels(2);audio.setsampwidth(2);audio.setframerate(rate);audio.writeframes((mix*32767).astype('<i2').tobytes())
    return {'assetId':'sues-original-ambient-pad-v1','rights':'owned','method':'original procedural chord pad; no borrowed melody, samples or generative service','duration':duration,'sampleRate':rate,'peak':float(np.max(np.abs(mix))),'rms':float(np.sqrt(np.mean(mix**2))),'chordsMidi':chords,'externalCostUSD':0,'humanListeningAcceptance':False}
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('output',type=pathlib.Path);a=p.parse_args();print(json.dumps(create(a.output),indent=2))
