const N='family-luismaux-v4';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=e.request.url;
  if(e.request.method!=='GET'||!u.startsWith('http')||/firestore\.googleapis|identitytoolkit|securetoken/.test(u))return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(N).then(x=>x.put(e.request,c)).catch(()=>{});return r}).catch(()=>caches.match(e.request)));
});
