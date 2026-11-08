#!/usr/bin/env python3
"""QA-only precise paused preview integrated into a NEW FableCut clone.

Never patches installed FableCut, never activates for production. Previous
verified-cache export script/endpoint is required. All changes fail closed
if upstream code anchors differ. Renderer source stays editable FableCut.
"""
from pathlib import Path
import argparse
import shutil

PREVIEW_ENGINE = '''/* SUES PRIVATE QA: precise paused scrub, not enabled in production. */
const suesPrivatePausedPreview = {
  seq: 0, pending: null, running: null, ownsDecoder: false,
  committedTime: null, errors: [], playIntent: 0,
};
function suesPrivateQueuePausedFrame(t) {
  if (state.playing || state.exporting || state.source.playing || isSourceMode() || !Number.isFinite(t)) return null;
  const a = suesPrivatePausedPreview;
  a.pending = { time: t, seq: ++a.seq };
  if (!a.running) {
    a.running = suesPrivateDrainPausedFrames().finally(() => {
      a.running = null;
      if (a.pending && !state.playing && !state.exporting) suesPrivateQueuePausedFrame(a.pending.time);
    });
  }
  return a.running;
}
async function suesPrivateDrainPausedFrames() {
  const a = suesPrivatePausedPreview;
  state.rendering = true; // do not let RAF draw stale HTMLVideo frames during async decode
  try {
    while (a.pending && !state.playing && !state.exporting && !isSourceMode()) {
      const job = a.pending;
      a.pending = null;
      if (!a.ownsDecoder) {
        exportDecodeBegin();
        a.ownsDecoder = true;
      }
      await seekVideosTo(job.time, { queueBusy: false });
      await prepareFrameAssets(job.time);
      if (job.seq !== a.seq || state.playing || state.exporting || isSourceMode()) continue;
      if (Math.abs(state.time - job.time) > 1e-7) continue;
      const required = mediaClips().filter(c => c.kind === 'video' && clipRenders(c) && activeAt(c, job.time));
      if (required.some(c => !runtime.exportFrames?.has(c.id)))
        throw Error('Precise preview is missing native video frames; refusing stale canvas');
      drawFrame(job.time);
      a.committedTime = job.time;
    }
  } catch (e) {
    a.errors.push(String(e?.message || e));
    a.pending = null;
    console.warn('[SUES private preview] Accurate scrub not committed:', e);
  } finally {
    state.rendering = false;
    if (state.playing || state.exporting || isSourceMode()) {
      if (a.ownsDecoder) { exportDecodeEnd(); a.ownsDecoder = false; }
    }
    noteActivity();
  }
}
function suesPrivateCancelPausedPreview() {
  const a = suesPrivatePausedPreview;
  a.seq += 1;
  a.pending = null;
  a.committedTime = null;
  // Keep decoder alive until the current native frame request settles.
  if (!a.running && a.ownsDecoder) { exportDecodeEnd(); a.ownsDecoder = false; }
}
async function suesPrivateStopPausedPreview() {
  suesPrivateCancelPausedPreview();
  const a = suesPrivatePausedPreview;
  if (a.running) await a.running.catch(() => {});
  if (a.ownsDecoder) { exportDecodeEnd(); a.ownsDecoder = false; }
}
async function suesPrivatePausedPreviewIdle() {
  for (let tries = 0; tries < 40; tries++) {
    const running = suesPrivatePausedPreview.running;
    if (!running && !suesPrivatePausedPreview.pending) return {
      committedTime: suesPrivatePausedPreview.committedTime,
      ownsDecoder: suesPrivatePausedPreview.ownsDecoder,
      errors: [...suesPrivatePausedPreview.errors],
    };
    if (running) await running.catch(() => {});
    else await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw Error('Private preview scheduler did not settle');
}
'''

SET_ANCHOR='''  seekMediaWhilePaused();
  if (state.audioHold) scheduleAudioHoldRefresh();'''
SET_PATCH='''  seekMediaWhilePaused();
  if (!state.playing && !state.exporting) {
    suesPrivatePausedPreview.playIntent++; // moving playhead cancels a deferred Play intent
    suesPrivateQueuePausedFrame(state.time);
  }
  if (state.audioHold) scheduleAudioHoldRefresh();'''
PLAY_ANCHOR='''function play() {
'''
PLAY_PATCH='''function play() {
  const activeScrub = suesPrivatePausedPreview;
  const intent = ++activeScrub.playIntent;
  // A decode may still be in flight. Wait for safe release; do not overlap.
  // Abort deferred Play if user presses Pause or moves the playhead meanwhile.
  if (activeScrub.running) {
    suesPrivateCancelPausedPreview();
    activeScrub.running.finally(() => {
      if (intent === activeScrub.playIntent && !state.playing && !state.exporting && !isSourceMode()) play();
    });
    return;
  }
  suesPrivateCancelPausedPreview();
'''
FAST_ANCHOR='''async function fastExport(opts = {}) {
  if (state.exporting) return { error: "an export is already running" };'''
FAST_PATCH='''async function fastExport(opts = {}) {
  if (state.exporting) return { error: "an export is already running" };
  await suesPrivateStopPausedPreview(); // release pause decoder before the export claims it'''
PAUSE_ANCHOR='''function pause() {
'''
PAUSE_PATCH='''function pause() {
  suesPrivatePausedPreview.playIntent++; // never start a deferred Play after Pause
'''
WEBCODECS_ANCHOR='''async function webCodecsExport() {
  if (state.exporting) return;'''
WEBCODECS_PATCH='''async function webCodecsExport() {
  if (state.exporting) return;
  await suesPrivateStopPausedPreview(); // avoid competing decoder sessions'''


def stage(source, dest):
    source, dest=Path(source).resolve(),Path(dest).resolve()
    if not source.is_dir() or dest.exists() or source == dest or source in dest.parents or dest in source.parents:
        raise ValueError('New separate private app clone required')
    app=(source/'app.js').read_text()
    for anchor in (SET_ANCHOR, PLAY_ANCHOR, PAUSE_ANCHOR, FAST_ANCHOR, WEBCODECS_ANCHOR, 'function setTime(t) {'):
        if app.count(anchor) != 1:
            raise ValueError('FableCut source changed; precise QA must not be applied')
    if app.count('suesPrivateVerifiedDecodeUrl') < 2 or not (source/'sues-faststart-qa-gateway.cjs').is_file():
        raise ValueError('Requires existing verified faststart private QA clone')
    shutil.copytree(source, dest)
    try:
        app=app.replace(SET_ANCHOR,SET_PATCH).replace(PLAY_ANCHOR,PLAY_PATCH).replace(PAUSE_ANCHOR,PAUSE_PATCH).replace(FAST_ANCHOR,FAST_PATCH).replace(WEBCODECS_ANCHOR,WEBCODECS_PATCH)
        app=app.replace('function setTime(t) {',PREVIEW_ENGINE+'\nfunction setTime(t) {')
        (dest/'app.js').write_text(app)
    except BaseException:
        shutil.rmtree(dest)
        raise
    return dest

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--source-qa-app',type=Path,required=True)
    p.add_argument('--dest-qa-app',type=Path,required=True)
    x=p.parse_args();print(stage(x.source_qa_app,x.dest_qa_app))

if __name__=='__main__':main()
