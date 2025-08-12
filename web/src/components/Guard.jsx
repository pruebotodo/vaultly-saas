import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Guard({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="container">Cargando…</div>;
  if (!session) return <Auth/>;
  return children(session);
}

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function signIn(e){ e.preventDefault(); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError(error.message); }
  async function signUp(e){ e.preventDefault(); setError(''); const { error } = await supabase.auth.signUp({ email, password }); if (error) setError(error.message); }

  return (
    <div className="container" style={{maxWidth: 420}}>
      <h2>Inicia sesión</h2>
      <form onSubmit={signIn} className="card" style={{marginBottom:12}}>
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',marginBottom:8}}/>
        <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',marginBottom:8}}/>
        <button className="btn" type="submit">Entrar</button>
      </form>
      <div className="card">
        <div className="muted" style={{marginBottom:8}}>¿No tienes cuenta?</div>
        <button className="btn" onClick={signUp}>Crear cuenta</button>
      </div>
      {error && <div className="card" style={{borderColor:'#f88',background:'#fee',marginTop:12}}>{error}</div>}
    </div>
  );
}
