// Shell only. Never cache API responses, cookies, transcripts, videos or tokens.
const CACHE='sues-shell-v7',SHELL=['/','/app.js','/app.css','/icon.svg','/manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sues-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!SHELL.includes(url.pathname)||url.search)return;event.respondWith(fetch(event.request).catch(()=>caches.match(url.pathname)));});
