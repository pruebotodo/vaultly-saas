const BASE = import.meta.env.VITE_API_BASE;
export async function api(path,{method='GET',token,body,headers}={}){
  const r = await fetch(BASE+path, {
    method,
    headers: { 'Content-Type':'application/json', ...(token?{'Authorization':`Bearer ${token}`}:{}) , ...(headers||{}) },
    body: body?JSON.stringify(body):undefined
  });
  if(!r.ok){ const e = await r.json().catch(()=>({})); throw new Error(e.error||`HTTP ${r.status}`); }
  return r.json();
}
export const Api = {
  user: (t)=>api('/api/user',{token:t}),
  items: (t,q,c)=>api(`/api/items?q=${encodeURIComponent(q||'')}&category=${encodeURIComponent(c||'')}`,{token:t}),
  item: (t,id)=>api(`/api/items/${id}`,{token:t}),
  ingestUrl: (t,u)=>api('/api/ingest/url',{method:'POST',token:t,body:{url:u}}),
  checkout: (t)=>api('/api/billing/checkout',{method:'POST',token:t}),
  portal: (t)=>api('/api/billing/portal',{method:'POST',token:t}),
};
