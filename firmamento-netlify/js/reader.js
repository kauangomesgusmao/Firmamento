/* ═══ READER ═══ */
async function openReader(slug,idx){
  cur={slug,idx};
  showView('reader');
  document.getElementById('reader-article').innerHTML=`<div class="loading">Carregando…</div>`;
  const n=novelBySlug(slug);
  document.getElementById('sb-title').textContent=n?n.title:'Capítulos';
  const chs=await loadChapters(slug);
  if(!chs.length){ document.getElementById('reader-article').innerHTML=`<div class="empty"><div class="i">📂</div>Sem capítulos.</div>`; return; }
  cur.idx=Math.max(0,Math.min(idx,chs.length-1));
  renderSidebar(chs); renderChapter(chs);
}
function renderSidebar(chs){
  document.getElementById('sb-list').innerHTML=chs.map((c,i)=>`<button class="ch-btn${i===cur.idx?' active':''}" onclick="goChapter(${i})">${esc(c.name)}</button>`).join('');
}
function renderChapter(chs){
  const ch=chs[cur.idx];
  const art=document.getElementById('reader-article');
  art.style.setProperty('--rs',fs+'px'); art.style.setProperty('--rf',font);
  const prev=cur.idx>0, next=cur.idx<chs.length-1;
  art.innerHTML=`<h1>${esc(ch.name)}</h1><div>${ch.content}</div>
    <div class="reader-nav">
      <button onclick="goChapter(${cur.idx-1})" ${prev?'':'disabled'}>← Anterior</button>
      <button class="nx" onclick="goChapter(${cur.idx+1})" ${next?'':'disabled'}>Próximo →</button>
    </div>`;
  document.getElementById('tb-title').textContent=ch.name;
  document.getElementById('reader-scroll').scrollTop=0;
  updateProg();
  saveHistory(ch);
}
function goChapter(i){
  const chs=CHAP_CACHE[cur.slug]; if(!chs||i<0||i>=chs.length) return;
  cur.idx=i; renderChapter(chs);
  document.querySelectorAll('.ch-btn').forEach((b,n)=>b.classList.toggle('active',n===i));
  closeSidebar();
  history.replaceState(null,'','#/ler/'+cur.slug+'/'+i);
}
async function saveHistory(ch){
  try{ await sb.from('reading_history').upsert({user_id:ME.id,novel_slug:cur.slug,chapter_index:cur.idx,chapter_name:ch.name,updated_at:new Date().toISOString()},{onConflict:'user_id,novel_slug'}); }catch(e){}
}
function exitReader(){ go('novel',cur.slug); }
function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebar(){ document.getElementById('sidebar').classList.remove('open'); }
function adjFs(d){ fs=Math.max(13,Math.min(26,fs+d)); localStorage.setItem('fs',fs); const a=document.getElementById('reader-article'); if(a)a.style.setProperty('--rs',fs+'px'); }
function setFont(f){ font=f; localStorage.setItem('font',f); const a=document.getElementById('reader-article'); if(a)a.style.setProperty('--rf',f); }
function updateProg(){ const sc=document.getElementById('reader-scroll'); if(!sc)return; const p=sc.scrollHeight<=sc.clientHeight?100:(sc.scrollTop/(sc.scrollHeight-sc.clientHeight))*100; document.getElementById('prog-fill').style.width=p+'%'; }
document.addEventListener('keydown',e=>{
  if(!document.getElementById('view-reader').classList.contains('active'))return;
  const chs=CHAP_CACHE[cur.slug]; if(!chs)return;
  if(e.key==='ArrowRight'&&cur.idx<chs.length-1)goChapter(cur.idx+1);
  if(e.key==='ArrowLeft'&&cur.idx>0)goChapter(cur.idx-1);
  if(e.key==='Escape')exitReader();
});
