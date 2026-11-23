'use strict';
// Shared geometry for SUES staged NLE track lanes. Pure and Node-testable.
// Timing is always source/NLE seconds, not screenshot layout pixels.
const SuesTimeline = (() => {
  function duration(clips) {
    if(!Array.isArray(clips))return 1;
    const values=clips.filter(c=>Number.isFinite(c.start)&&Number.isFinite(c.duration)&&c.start>=0&&c.duration>0)
      .map(c=>c.start+c.duration);
    return values.length?Math.max(1,Math.min(300,Math.max(...values))):1;
  }
  function bounds(clip,total) {
    if(!clip||!Number.isFinite(total)||total<=0||!Number.isFinite(clip.start)||!Number.isFinite(clip.duration)||clip.duration<0)throw Error('Invalid clip geometry');
    const first=Math.max(0,Math.min(1,clip.start/total));
    const last=Math.max(first,Math.min(1,(clip.start+clip.duration)/total));
    return {left:100*first,width:100*(last-first)};
  }
  function snap(seconds,total,fps=30) {
    if(!Number.isFinite(seconds)||!Number.isFinite(total)||total<=0||!Number.isInteger(fps)||fps<1||fps>120)throw Error('Invalid timeline seek');
    return Math.min(Math.max(0,Math.round(seconds*fps)/fps),total);
  }
  function stamp(seconds,fps=30) {
    if(!Number.isFinite(seconds)||seconds<0)throw Error('Invalid timestamp');
    const f=Math.round(seconds*fps),secondsInt=Math.floor(f/fps);
    return String(Math.floor(secondsInt/60)).padStart(2,'0')+':'+String(secondsInt%60).padStart(2,'0')+':'+String(f%fps).padStart(2,'0');
  }
  return Object.freeze({duration,bounds,snap,stamp});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=SuesTimeline;
