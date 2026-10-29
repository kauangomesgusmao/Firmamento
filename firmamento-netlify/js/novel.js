/* ═══ NOVEL DETAIL ═══ */
async function renderNovel(slug){
  const w=document.getElementById('novel-wrap');
  const n=novelBySlug(slug);
  if(!n){ w.innerHTML=`<div class="empty"><div class="i">❓</div>Novel não encontrada.</div>`; return; }
  const isFav=FAVS.has(slug);
  // ratings
  const {data:rates}=await sb.from('ratings').select('stars,user_id').eq('novel_slug',slug);
  const avg=rates&&rates.length?(rates.reduce((a,b)=>a+b.stars,0)/rates.length):0;
  const myRate=(rates||[]).find(r=>r.user_id===ME.id)?.stars||0;
  w.innerHTML=`
  <div class="novel-hero">
    <div class="nc">${n.cover_url?`<img src="${n.cover_url}" onerror="this.parentNode.innerHTML='<div class=ph>📜</div>'">`:'<div class="ph">📜</div>'}</div>
    <div class="novel-info">
      <h1>${esc(n.title)}</h1>
      <div class="tags">${(n.genres||[]).map(g=>`<span class="tag">${esc(g)}</span>`).join('')}</div>
      ${n.status?`<div class="ninfo-row">Status: <b>${esc(n.status)}</b></div>`:''}
      ${n.author?`<div class="ninfo-row">Autor: <b>${esc(n.author)}</b></div>`:''}
      <div class="ninfo-row">Avaliação:
        <span class="stars" id="stars">${[1,2,3,4,5].map(i=>`<span class="s${i<=Math.round(myRate||avg)?' on':''}" onclick="rate('${slug}',${i})">★</span>`).join('')}</span>
        <span class="rate-ct">${avg?avg.toFixed(1):'—'}${rates&&rates.length?` (${rates.length})`:''}</span>
      </div>
      <div class="novel-actions">
        <button class="btn-p" onclick="startReading('${slug}')">Começar a ler</button>
        <button class="btn-s${isFav?' on':''}" id="fav-btn" onclick="toggleFav('${slug}')">${isFav?'★ Favoritado':'☆ Favoritar'}</button>
      </div>
    </div>
  </div>
  <div class="tabs">
    <button class="active" id="tabb-info" onclick="novelTab('info')">Informações</button>
    <button id="tabb-chaps" onclick="novelTab('chaps')">Capítulos</button>
  </div>
  <div class="tab-pane active" id="tab-info"><div class="desc">${esc(n.description||'Sem descrição.')}</div></div>
  <div class="tab-pane" id="tab-chaps"><div class="loading">Carregando capítulos…</div></div>
  <div class="comments" id="comments"></div>`;
  loadComments(slug);
  // preload chapters for count
  loadChapters(slug).then(chs=>{
    const pane=document.getElementById('tab-chaps');
    if(!pane) return;
    pane.innerHTML = chs.length?`<div class="chap-list">`+chs.map((c,i)=>`<div class="ch-row" onclick="openReaderHash('${slug}',${i})"><span class="n">${i+1}</span><span class="t">${esc(c.name)}</span></div>`).join('')+`</div>`:`<div class="empty"><div class="i">📂</div>Nenhum capítulo nesta pasta ainda.</div>`;
  });
}
function novelTab(t){
  document.getElementById('tabb-info').classList.toggle('active',t==='info');
  document.getElementById('tabb-chaps').classList.toggle('active',t==='chaps');
  document.getElementById('tab-info').classList.toggle('active',t==='info');
  document.getElementById('tab-chaps').classList.toggle('active',t==='chaps');
}
async function toggleFav(slug){
  if(FAVS.has(slug)){ await sb.from('favorites').delete().eq('user_id',ME.id).eq('novel_slug',slug); FAVS.delete(slug); }
  else { await sb.from('favorites').insert({user_id:ME.id,novel_slug:slug}); FAVS.add(slug); }
  const b=document.getElementById('fav-btn');
  if(b){ const on=FAVS.has(slug); b.className='btn-s'+(on?' on':''); b.textContent=on?'★ Favoritado':'☆ Favoritar'; }
}
async function rate(slug,stars){
  await sb.from('ratings').upsert({user_id:ME.id,novel_slug:slug,stars},{onConflict:'user_id,novel_slug'});
  toast('Avaliação salva'); renderNovel(slug);
}
async function startReading(slug){
  // resume last chapter if exists
  const {data}=await sb.from('reading_history').select('chapter_index').eq('user_id',ME.id).eq('novel_slug',slug).maybeSingle();
  openReaderHash(slug, data?data.chapter_index:0);
}
function openReaderHash(slug,idx){ location.hash='#/ler/'+slug+'/'+idx; }

/* ═══ COMMENTS ═══ */
async function loadComments(slug){
  const el=document.getElementById('comments'); if(!el) return;
  const {data}=await sb.from('comments').select('*').eq('novel_slug',slug).order('created_at',{ascending:false});
  const list=data||[];
  el.innerHTML=`<div class="sec-head"><h2>Comentários</h2><span class="ct">${list.length}</span></div>
    <div class="cmt-box"><textarea id="cmt-input" placeholder="Escreva um comentário..."></textarea>
    <div style="text-align:right;margin-top:8px"><button class="btn-admin" onclick="postComment('${slug}')">Comentar</button></div></div>
    <div id="cmt-list">`+ (list.length?list.map(c=>cmtHtml(c)).join(''):`<div style="color:var(--text-mute);font-family:sans-serif;font-size:.8rem;padding:10px">Seja o primeiro a comentar.</div>`) +`</div>`;
}
function cmtHtml(c){
  const mine=c.user_id===ME.id;
  const when=new Date(c.created_at).toLocaleDateString('pt-BR');
  return `<div class="cmt"><div class="head"><div class="av">${(c.username||'?')[0]?.toUpperCase()||'?'}</div>
    <span class="nm">${esc(c.username||'Leitor')}</span><span class="dt">${when}</span>
    ${mine?`<span class="del" onclick="delComment(${c.id},'${c.novel_slug}')">remover</span>`:''}</div>
    <div class="body">${esc(c.body)}</div></div>`;
}
async function postComment(slug){
  const inp=document.getElementById('cmt-input'); const body=inp.value.trim(); if(!body) return;
  await sb.from('comments').insert({user_id:ME.id,novel_slug:slug,body,username:PROFILE.username||ME.email});
  inp.value=''; loadComments(slug);
}
async function delComment(id,slug){ await sb.from('comments').delete().eq('id',id); loadComments(slug); }
