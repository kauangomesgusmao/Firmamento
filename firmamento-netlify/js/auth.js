/* ═══ THEME ═══ */
(()=>{ if((localStorage.getItem('theme')||'dark')==='light') document.documentElement.setAttribute('data-theme','light'); })();
function toggleTheme(){
  const l=document.documentElement.getAttribute('data-theme')==='light';
  if(l) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme','light');
  localStorage.setItem('theme',l?'dark':'light');
}

/* ═══ AUTH ═══ */
function setAuthMode(m){
  authMode=m;
  document.getElementById('tab-login').classList.toggle('active',m==='login');
  document.getElementById('tab-signup').classList.toggle('active',m==='signup');
  document.getElementById('field-name').style.display = m==='signup'?'block':'none';
  document.getElementById('au-btn').textContent = m==='signup'?'Criar conta':'Entrar';
  authMsg('','');
}
function authMsg(type,txt){
  const el=document.getElementById('auth-msg');
  el.className='auth-msg'+(txt?' show '+type:''); el.textContent=txt;
}
async function doAuth(){
  const email=document.getElementById('au-email').value.trim();
  const pass=document.getElementById('au-pass').value;
  const btn=document.getElementById('au-btn');
  if(!email||!pass){authMsg('err','Preencha email e senha.');return;}
  btn.disabled=true;
  try{
    if(authMode==='signup'){
      const name=document.getElementById('au-name').value.trim();
      const {data,error}=await sb.auth.signUp({email,password:pass,options:{data:{username:name}}});
      if(error) throw error;
      if(name && data.user){ await sb.from('profiles').update({username:name}).eq('id',data.user.id).then(()=>{}); }
      if(!data.session){ authMsg('ok','Conta criada! Se pedir, confirme pelo email e depois entre.'); setAuthMode('login'); btn.disabled=false; return; }
    } else {
      const {error}=await sb.auth.signInWithPassword({email,password:pass});
      if(error) throw error;
    }
  }catch(e){ authMsg('err', traduzErro(e.message)); btn.disabled=false; }
}
function traduzErro(m){
  if(/Invalid login/i.test(m)) return 'Email ou senha incorretos.';
  if(/already registered/i.test(m)) return 'Esse email já tem conta.';
  if(/at least 6/i.test(m)) return 'A senha precisa de pelo menos 6 caracteres.';
  if(/Email not confirmed/i.test(m)) return 'Confirme seu email antes de entrar.';
  return m;
}
async function doLogout(){ await sb.auth.signOut(); location.hash=''; location.reload(); }

async function loadProfile(){
  const {data}=await sb.from('profiles').select('*').eq('id',ME.id).maybeSingle();
  PROFILE=data||{role:'user',username:ME.email};
}
async function loadFavs(){
  const {data}=await sb.from('favorites').select('novel_slug').eq('user_id',ME.id);
  FAVS=new Set((data||[]).map(f=>f.novel_slug));
}

/* boot auth gate */
async function boot(){
  const {data:{session}}=await sb.auth.getSession();
  if(session){ await enterApp(session.user); }
  else { showOnlyLogin(); }
  sb.auth.onAuthStateChange(async (_e,s)=>{
    if(s && (!ME || ME.id!==s.user.id)){ await enterApp(s.user); }
    else if(!s && ME){ ME=null; showOnlyLogin(); }
  });
}
function showOnlyLogin(){
  document.getElementById('nav').style.display='none';
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-login').classList.add('active');
}
async function enterApp(user){
  ME=user;
  await loadProfile();
  await loadFavs();
  const isAdmin=PROFILE.role==='admin';
  document.getElementById('nav').style.display='flex';
  document.getElementById('nav-admin').style.display=isAdmin?'block':'none';
  document.getElementById('menu-admin').style.display=isAdmin?'block':'none';
  const uname=PROFILE.username||user.email;
  document.getElementById('u-nm').textContent=uname;
  document.getElementById('u-av').textContent=(uname[0]||'?').toUpperCase();
  document.getElementById('u-role').textContent=isAdmin?'Administrador':'Leitor';
  document.getElementById('view-login').classList.remove('active');
  await loadNovels();
  route();
}
