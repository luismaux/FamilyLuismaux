const N='family-luismaux-v29';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('family-luismaux-')&&k!==N).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
  const u=e.request.url;
  if(e.request.method!=='GET'||!u.startsWith('http')||/firestore\.googleapis|identitytoolkit|securetoken|www\.googleapis\.com\/(drive|upload)|accounts\.google\.com/.test(u))return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(N).then(x=>x.put(e.request,c)).catch(()=>{});return r}).catch(()=>caches.match(e.request)));
});
