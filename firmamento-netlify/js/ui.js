/* ═══ CARD HTML ═══ */
function coverHtml(n){
  if(n.cover_url) return `<img src="${n.cover_url}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="ph" style="display:none"><div class="i">📜</div><div class="t">${esc(n.title)}</div></div>`;
  return `<div class="ph"><div class="i">📜</div><div class="t">${esc(n.title)}</div></div>`;
}
function cardHtml(n, sub){
  return `<div class="card" onclick="go('novel','${n.slug}')">
    <div class="cover">${coverHtml(n)}${n.status?`<span class="badge st">${esc(n.status)}</span>`:''}</div>
    <h4>${esc(n.title)}</h4>
    <div class="meta">${sub||esc(n.author||'')}</div>
  </div>`;
}

/* ═══ HOME ═══ */
async function renderHome(){
  const w=document.getElementById('home-wrap');
  w.innerHTML=`<div class="loading">Carregando…</div>`;
  // reading history
  const {data:hist}=await sb.from('reading_history').select('*').eq('user_id',ME.id).order('updated_at',{ascending:false}).limit(12);
  let html='';
  if(hist&&hist.length){
    html+=`<div class="section"><div class="sec-head"><h2>Continuar lendo</h2></div><div class="hscroll">`+
      hist.map(h=>{const n=novelBySlug(h.novel_slug); if(!n)return''; return `<div class="card" onclick="go('novel','${n.slug}')">
        <div class="cover">${coverHtml(n)}</div><h4>${esc(n.title)}</h4>
        <div class="meta"><span class="cont">▸ ${esc(h.chapter_name||('Cap. '+(h.chapter_index+1)))}</span></div></div>`;}).join('')+
      `</div></div>`;
  }
  // all novels
  html+=`<div class="section"><div class="sec-head"><h2>Biblioteca</h2><a class="more" onclick="go('catalog')">Ver tudo →</a></div>`;
  if(!NOVELS.length) html+=`<div class="empty"><div class="i">📖</div>Nenhuma novel cadastrada ainda.${PROFILE.role==='admin'?' Vá em Admin para adicionar.':''}</div>`;
  else html+=`<div class="grid">`+NOVELS.slice(0,12).map(n=>cardHtml(n)).join('')+`</div>`;
  html+=`</div>`;
  w.innerHTML=html;
}

/* ═══ CATALOG ═══ */
let catStatus=new Set(), catGenres=new Set();
function renderCatalogFilters(){
  const st=document.getElementById('cat-status');
  st.innerHTML='<span class="lab">Status</span>'+STATUSES.map(s=>`<button class="chip${catStatus.has(s)?' on':''}" onclick="toggleFilter('status','${s}')">${s}</button>`).join('');
  const usedGenres=[...new Set(NOVELS.flatMap(n=>n.genres||[]))];
  const list=usedGenres.length?usedGenres:GENRES;
  const g=document.getElementById('cat-genres');
  g.innerHTML='<span class="lab">Gêneros</span>'+list.map(x=>`<button class="chip${catGenres.has(x)?' on':''}" onclick="toggleFilter('genre','${x.replace(/'/g,"\\'")}')">${x}</button>`).join('');
}
function toggleFilter(kind,val){
  const set=kind==='status'?catStatus:catGenres;
  if(set.has(val)) set.delete(val); else set.add(val);
  renderCatalogFilters(); renderCatalog();
}
function renderCatalog(){
  const q=(document.getElementById('cat-search').value||'').toLowerCase();
  let list=NOVELS.filter(n=>{
    if(q && !(n.title.toLowerCase().includes(q)||(n.author||'').toLowerCase().includes(q))) return false;
    if(catStatus.size && !catStatus.has(n.status)) return false;
    if(catGenres.size && !(n.genres||[]).some(g=>catGenres.has(g))) return false;
    return true;
  });
  document.getElementById('cat-count').textContent=list.length+(list.length===1?' novel':' novels');
  const grid=document.getElementById('cat-grid');
  grid.innerHTML = list.length?list.map(n=>cardHtml(n)).join(''):`<div class="empty"><div class="i">🔍</div>Nenhuma novel com esses filtros.</div>`;
}
function navSearch(v){ go('catalog'); setTimeout(()=>{const i=document.getElementById('cat-search'); if(i){i.value=v; renderCatalog();}},50); }

/* ═══ LIBRARY (favorites) ═══ */
async function renderLibrary(){
  const w=document.getElementById('library-wrap');
  await loadFavs();
  const favNovels=NOVELS.filter(n=>FAVS.has(n.slug));
  let html=`<div class="section"><div class="sec-head"><h2>Meus favoritos</h2><span class="ct">${favNovels.length}</span></div>`;
  html += favNovels.length?`<div class="grid">`+favNovels.map(n=>cardHtml(n)).join('')+`</div>`:`<div class="empty"><div class="i">⭐</div>Você ainda não favoritou nenhuma novel.</div>`;
  html+=`</div>`;
  w.innerHTML=html;
}

/* ═══ USER MENU / TOAST UI bits ═══ */
function toggleMenu(e){ e.stopPropagation(); document.getElementById('user-menu').classList.toggle('open'); }
document.addEventListener('click',()=>document.getElementById('user-menu').classList.remove('open'));
