import { useEffect, useMemo, useState } from 'react';
import { createClient, Session } from '@supabase/supabase-js';

type Card = { id:string; name:string; kind:string; element:string; attack:number; defense:number; description:string; image_url:string|null; frame_color:string };
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = url && key ? createClient(url, key) : null;

export default function App() {
  const [session,setSession] = useState<Session|null>(null);
  const [email,setEmail] = useState(''); const [password,setPassword] = useState('');
  const [cards,setCards] = useState<Card[]>([]); const [inventory,setInventory] = useState<Record<string,number>>({});
  const [name,setName] = useState('Dragón de prueba'); const [kind,setKind] = useState('Monstruo'); const [element,setElement] = useState('Fuego');
  const [attack,setAttack] = useState('1500'); const [defense,setDefense] = useState('1200'); const [description,setDescription] = useState('Una criatura creada por ti.');
  const [frame,setFrame] = useState('#9b4d18'); const [image,setImage] = useState<File|null>(null); const [preview,setPreview] = useState('');
  const [busy,setBusy] = useState(false); const [message,setMessage] = useState(''); const [matches,setMatches] = useState<any[]>([]);
  const configured = !!supabase;

  useEffect(()=>{ if(!supabase) return; supabase.auth.getSession().then(({data})=>setSession(data.session)); const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); return ()=>subscription.unsubscribe(); },[]);
  useEffect(()=>{ if(session) refresh(); },[session]);
  async function refresh(){ if(!supabase) return; const [{data:c,error:ce},{data:i,error:ie},{data:m,error:me}] = await Promise.all([supabase.from('cards').select('*').order('created_at',{ascending:false}),supabase.from('inventory').select('card_id,quantity'),supabase.from('matches').select('*').order('updated_at',{ascending:false})]); if(ce||ie||me){setMessage((ce||ie||me)?.message||'Error');return;} setCards(c||[]); setInventory(Object.fromEntries((i||[]).map(x=>[x.card_id,x.quantity]))); setMatches(m||[]); }
  async function auth(action:'in'|'up'){ if(!supabase)return; setBusy(true); setMessage(''); const result=action==='in'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password}); setBusy(false); setMessage(result.error?.message || (action==='up'?'Registro creado. Revisa tu correo si la confirmación está activada.':'Sesión iniciada.')); }
  function chooseFile(file?:File){ if(!file)return; if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setMessage('Usa una imagen JPG, PNG o WEBP.');return;} if(file.size>5*1024*1024){setMessage('La imagen debe pesar menos de 5 MB.');return;} setImage(file); setPreview(URL.createObjectURL(file)); }
  async function saveCard(){ if(!supabase||!session)return; if(!name.trim()){setMessage('Escribe un nombre para la carta.');return;} setBusy(true);setMessage(''); try { let image_url:string|null=null; if(image){const path=`${session.user.id}/${crypto.randomUUID()}.${image.name.split('.').pop()||'jpg'}`; const {error}=await supabase.storage.from('card-art').upload(path,image,{contentType:image.type,upsert:false}); if(error)throw error; image_url=supabase.storage.from('card-art').getPublicUrl(path).data.publicUrl;}
    const {data,error}=await supabase.from('cards').insert({owner_id:session.user.id,name,kind,element,attack:Number(attack)||0,defense:Number(defense)||0,description,image_url,frame_color:frame}).select().single(); if(error)throw error;
    const {error:invError}=await supabase.from('inventory').upsert({user_id:session.user.id,card_id:data.id,quantity:1},{onConflict:'user_id,card_id'}); if(invError)throw invError;
    setImage(null);setPreview('');await refresh();setMessage('¡Carta guardada en tu colección!');
  }catch(e:any){setMessage(e.message||'No se pudo guardar.');}finally{setBusy(false);} }
  async function addCopy(card:Card){ if(!supabase||!session)return; const quantity=(inventory[card.id]||0)+1; const {error}=await supabase.from('inventory').upsert({user_id:session.user.id,card_id:card.id,quantity},{onConflict:'user_id,card_id'}); if(error)setMessage(error.message);else{setInventory(v=>({...v,[card.id]:quantity}));setMessage('Carta añadida al inventario.');} }
  async function saveMatch(){ if(!supabase||!session)return; setBusy(true); const state={savedAt:new Date().toISOString(),phase:'preparacion',deck:cards.map(c=>c.id),inventory}; const {error}=await supabase.from('matches').insert({user_id:session.user.id,state,status:'in_progress'}); setBusy(false);setMessage(error?.message||'Partida guardada.');if(!error)refresh(); }
  const total=useMemo(()=>Object.values(inventory).reduce((a,b)=>a+b,0),[inventory]);

  if(!configured) return <main className="center"><section className="panel auth"><Logo/><h2>Configura tu base de datos</h2><p>Para activar usuarios, inventario y guardado, copia <code>.env.example</code> a <code>.env</code> y completa las credenciales de tu proyecto Supabase. Consulta el README.</p></section></main>;
  if(!session) return <main className="center"><section className="panel auth"><Logo/><p className="muted">Tu mundo. Tus cartas. Tus duelos.</p><form onSubmit={e=>{e.preventDefault();auth('in')}}><input type="email" placeholder="Correo electrónico" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}/><button disabled={busy}>{busy?'Espera…':'Iniciar sesión'}</button></form><button className="ghost full" disabled={busy} onClick={()=>auth('up')}>Crear cuenta</button><Notice text={message}/></section></main>;

  return <main className="wrap"><header className="top"><div><Logo/><p className="muted">Editor · Colección · Partidas guardadas</p></div><button className="ghost" onClick={()=>supabase?.auth.signOut()}>Cerrar sesión</button></header>
    <div className="statsbar"><div><b>{cards.length}</b><span>Cartas creadas</span></div><div><b>{total}</b><span>Cartas en inventario</span></div><div><b>{matches.length}</b><span>Partidas guardadas</span></div></div>
    <div className="layout"><section className="panel"><h2>Crear y personalizar carta</h2><div className="card-preview" style={{borderColor:frame}}><strong>{name||'Nombre de carta'}</strong>{preview?<img src={preview} alt="Vista previa"/>:<div className="art-placeholder">🐉<small>Tu ilustración</small></div>}<small>{kind} · {element}</small><b>ATQ {attack||0}　 DEF {defense||0}</b><p>{description}</p></div>
      <label className="upload">＋ Subir imagen<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>chooseFile(e.target.files?.[0])}/></label>
      <label>Nombre<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre de carta"/></label><div className="two"><label>Tipo<input value={kind} onChange={e=>setKind(e.target.value)}/></label><label>Elemento<input value={element} onChange={e=>setElement(e.target.value)}/></label></div><div className="two"><label>Ataque<input type="number" value={attack} onChange={e=>setAttack(e.target.value)}/></label><label>Defensa<input type="number" value={defense} onChange={e=>setDefense(e.target.value)}/></label></div><label>Color del marco<input type="color" value={frame} onChange={e=>setFrame(e.target.value)}/></label><label>Descripción / efecto<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3}/></label><button disabled={busy} onClick={saveCard}>{busy?'Guardando…':'Guardar carta'}</button>
    </section><section className="panel"><div className="section-head"><h2>Mi colección</h2><button className="ghost" onClick={saveMatch} disabled={busy}>Guardar partida</button></div>{cards.length===0?<p className="muted">Todavía no tienes cartas. ¡Crea la primera!</p>:<div className="collection">{cards.map(c=><article className="mini-card" key={c.id} style={{borderColor:c.frame_color}}>{c.image_url?<img src={c.image_url} alt={c.name}/>:<div className="mini-placeholder">🃏</div>}<div className="mini-info"><b>{c.name}</b><small>{c.kind} · {c.element}</small><small>ATQ {c.attack} / DEF {c.defense}</small><small>Inventario: {inventory[c.id]||0}</small><button className="small" onClick={()=>addCopy(c)}>＋ Añadir copia</button></div></article>)}</div>}
      <h2 className="subheading">Partidas guardadas</h2>{matches.length===0?<p className="muted">Aún no hay partidas guardadas.</p>:matches.map(m=><div className="match" key={m.id}><b>Partida {m.id.slice(0,8)}</b><small>{new Date(m.created_at).toLocaleString()}</small><span>{m.status}</span></div>)}<Notice text={message}/>
    </section></div><footer>Card Duel · Juego original de cartas. No afiliado a Yu-Gi-Oh!.</footer></main>;
}
function Logo(){return <div className="logo">CARD <span>DUEL</span></div>}
function Notice({text}:{text:string}){return text?<p className="notice" role="status">{text}</p>:null}
