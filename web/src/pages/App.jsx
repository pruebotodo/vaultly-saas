import React,{useEffect,useState} from 'react';
import { supabase } from '../lib/supabase';
import { Api } from '../lib/api';
import Logo from '../components/Logo';

export default function App({ session }){
  const token = session.access_token;
  const [user,setUser] = useState(null);
  const [url,setUrl] = useState('');
  const [loading,setLoading] = useState(false);
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('');
  const [items,setItems] = useState([]);
  const [selected,setSelected] = useState(null);
  const [error,setError] = useState('');

  useEffect(()=>{(async()=>{
    try{
      const u = await Api.user(token);
      setUser(u);
      await refresh();
    }catch(e){ setError(e.message); }
  })()},[token]);

  async function refresh(){ const list = await Api.items(token,query,category); setItems(list); }
  async function doIngestUrl(){
    if(!url.trim()) return;
    setLoading(true); setError('');
    try{
      await Api.ingestUrl(token,url.trim());
      setUrl(''); await refresh();
    }catch(e){ setError(e.message); }
    finally{ setLoading(false); }
  }

  return (
    <div className="container">
      <div className="header" style={{marginBottom:12}}>
        <div className="hstack">
          <Logo size={28}/>
          <h1 style={{margin:0}}>Vaultly</h1>
          {user && <span className="badge">{user.plan==='pro'?'Pro':'Free'}</span>}
        </div>
        <div className="hstack">
          <button className="btn" onClick={async()=>{
            if(user?.plan==='pro'){ const r=await Api.portal(token); window.location.href=r.url; }
            else { const r=await Api.checkout(token); window.location.href=r.url; }
          }}>{user?.plan==='pro'?'Gestionar plan':'Mejorar a Pro'}</button>
          <button className="btn" onClick={()=>supabase.auth.signOut()}>Salir</button>
        </div>
      </div>

      <p className="muted">Extrae audio de enlaces o archivos, transcribe, resume y clasifica por temas.</p>

      <div className="hstack" style={{marginBottom:12}}>
        <input className="input" style={{flex:1}} value={url} onChange={e=>setUrl(e.target.value)} placeholder="Pega un enlace público (YouTube, etc.)"/>
        <button className="btn" onClick={doIngestUrl} disabled={loading}>{loading?'Procesando…':'Ingerir'}</button>
      </div>

      {error && <div className="card" style={{borderColor:'#f88',background:'#fee',marginBottom:12}}>{error}</div>}

      <div className="hstack" style={{marginBottom:12}}>
        <input className="input" style={{flex:1}} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&refresh()} placeholder="Buscar por palabras…"/>
        <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {Array.from(new Set(items.flatMap(it=>(Array.isArray(it.categories)?it.categories:[])))).sort().map(c=>(
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className="btn" onClick={refresh}>Buscar</button>
      </div>

      <div className="grid">
        <div>
          <table className="table">
            <thead><tr><th>Título</th><th>Plataforma</th><th>Fecha</th></tr></thead>
            <tbody>
              {items.map(row => (
                <tr key={row.id} onClick={async()=>{ const it=await Api.item(token,row.id); setSelected(it); }} style={{cursor:'pointer'}}>
                  <td>{row.title||'(Sin título)'}</td>
                  <td>{row.platform||'-'}</td>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          {!selected ? (
            <div className="muted" style={{paddingTop:40}}>Selecciona un item para ver detalles.</div>
          ) : (
            <div className="card">
              <h3 style={{marginTop:0}}>{selected.title||'(Sin título)'}</h3>
              <div className="muted" style={{marginBottom:8}}>
                <b>Plataforma:</b> {selected.platform||'-'} · <b>Idioma:</b> {selected.language||'-'} · <b>Sentimiento:</b> {selected.sentiment||'-'}
              </div>
              <div className="chips">
                {(Array.isArray(selected.categories)?selected.categories:[]).map((c,i)=>(<span className="chip" key={i}>{c}</span>))}
              </div>
              <div className="card" style={{marginTop:12}}>
                <h4 style={{marginTop:0}}>Resumen</h4>
                <p style={{whiteSpace:'pre-wrap'}}>{selected.summary||'—'}</p>
              </div>
              <div className="card" style={{marginTop:12}}>
                <h4 style={{marginTop:0}}>Puntos clave</h4>
                <ul>{(Array.isArray(selected.key_points)?selected.key_points:[]).map((kp,i)=>(<li key={i}>{kp}</li>))}</ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
