/* ═══ ADMIN ═══
   O cadastro de metadados (capa, sinopse, gêneros, status) continua indo pro
   Supabase, igual antes. O que saiu foi o envio de capítulos pela web com token
   do GitHub: agora os HTMLs ficam na pasta capitulos/ do próprio site, e você
   sobe tudo (site + capítulos) arrastando a pasta no Netlify. Veja README.md. */
function renderAdmin(){
  const g=document.getElementById('nf-genres');
  g.innerHTML=GENRES.map(x=>`<button type="button" class="chip" data-g="${x.replace(/"/g,'')}" onclick="this.classList.toggle('on')">${x}</button>`).join('');
  renderAdminNovels();
}
function renderAdminNovels(){
  const el=document.getElementById('adm-novels');
  if(!NOVELS.length){ el.innerHTML=`<div style="color:var(--text-mute);font-family:sans-serif;font-size:.8rem">Nenhuma novel ainda.</div>`; return; }
  el.innerHTML = NOVELS.map(n=>{
    const auto = n.source==='local';
    const badge = auto
      ? `<span style="color:var(--gold);border:1px solid color-mix(in srgb,var(--gold) 40%,transparent);border-radius:4px;padding:1px 6px;font-size:.6rem">Local · auto</span>`
      : `<span style="color:var(--accent);border:1px solid color-mix(in srgb,var(--accent) 40%,transparent);border-radius:4px;padding:1px 6px;font-size:.6rem">Cadastrada</span>`;
    const btns = auto
      ? `<button onclick="editNovel('${n.slug}')" title="Editar capa, sinopse, gêneros e status desta obra. Ao salvar, fica guardado no cadastro.">✎ Editar capa/info</button>`
      : `<button onclick="editNovel('${n.slug}')">✎ Editar</button><button onclick="delNovel('${n.slug}')">Excluir</button>`;
    return `<div class="adm-novel"><div class="t">${esc(n.title)} ${badge}<div class="sl">${esc(n.slug)} · pasta: ${esc(n.gh_folder||'—')}</div></div>${btns}</div>`;
  }).join('');
}
function clearNovelForm(){
  ['nf-editing','nf-title','nf-author','nf-slug','nf-folder','nf-cover','nf-desc'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('nf-status').value='Em andamento';
  document.querySelectorAll('#nf-genres .chip').forEach(c=>c.classList.remove('on'));
  showCoverPreview(''); document.getElementById('nf-cover-status').textContent='';
  admMsg('nf-msg','','');
}

/* ═══ CAPA (upload fácil: escolhe imagem do PC, compacta e vira a capa) ═══ */
function showCoverPreview(src){
  const img=document.getElementById('nf-cover-preview');
  const btn=document.getElementById('nf-cover-clear');
  if(src){ img.src=src; img.style.display='block'; btn.style.display='inline'; }
  else { img.style.display='none'; img.removeAttribute('src'); btn.style.display='none'; }
}
function clearCover(){
  document.getElementById('nf-cover').value='';
  document.getElementById('nf-cover-status').textContent='';
  document.getElementById('nf-cover-file').value='';
  showCoverPreview('');
}
function onCoverUrlInput(){
  // quando a pessoa cola uma URL manualmente, mostra a prévia dela
  const v=document.getElementById('nf-cover').value.trim();
  document.getElementById('nf-cover-status').textContent='';
  showCoverPreview(v);
}
function handleCoverFile(file){
  if(!file) return;
  const status=document.getElementById('nf-cover-status');
  if(!file.type.startsWith('image/')){ status.textContent='Esse arquivo não é uma imagem.'; return; }
  status.textContent='Processando imagem…';
  const reader=new FileReader();
  reader.onerror=()=>{ status.textContent='Não consegui ler o arquivo.'; };
  reader.onload=e=>{
    const img=new Image();
    img.onerror=()=>{ status.textContent='Não consegui abrir essa imagem.'; };
    img.onload=()=>{
      // redimensiona pra no máximo 500px de largura (capa de novel é estreita) e exporta JPEG leve
      const maxW=500;
      const scale=Math.min(1, maxW/img.width);
      const w=Math.round(img.width*scale), h=Math.round(img.height*scale);
      const canvas=document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      const dataUrl=canvas.toDataURL('image/jpeg',0.82);
      document.getElementById('nf-cover').value=dataUrl;
      showCoverPreview(dataUrl);
      const kb=Math.round(dataUrl.length/1024);
      status.textContent='Capa pronta ('+kb+' KB). Clique em "Salvar novel" pra guardar.';
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function editNovel(slug){
  const n=novelBySlug(slug); if(!n)return;
  document.getElementById('nf-editing').value=slug;
  document.getElementById('nf-title').value=n.title||'';
  document.getElementById('nf-author').value=n.author||'';
  document.getElementById('nf-slug').value=n.slug||'';
  document.getElementById('nf-folder').value=n.gh_folder||'';
  document.getElementById('nf-cover').value=n.cover_url||'';
  document.getElementById('nf-desc').value=n.description||'';
  document.getElementById('nf-status').value=n.status||'Em andamento';
  document.querySelectorAll('#nf-genres .chip').forEach(c=>c.classList.toggle('on',(n.genres||[]).includes(c.dataset.g)));
  document.getElementById('nf-cover-status').textContent='';
  document.getElementById('nf-cover-file').value='';
  showCoverPreview(n.cover_url||'');
  window.scrollTo(0,0);
}
async function saveNovel(){
  const title=document.getElementById('nf-title').value.trim();
  const folder=document.getElementById('nf-folder').value.trim();
  if(!title||!folder){ admMsg('nf-msg','err','Título e pasta dos capítulos são obrigatórios.'); return; }
  const editing=document.getElementById('nf-editing').value;
  let slug=document.getElementById('nf-slug').value.trim()||slugify(title);
  const genres=[...document.querySelectorAll('#nf-genres .chip.on')].map(c=>c.dataset.g);
  const row={slug,title,author:document.getElementById('nf-author').value.trim(),
    description:document.getElementById('nf-desc').value.trim(),cover_url:document.getElementById('nf-cover').value.trim(),
    status:document.getElementById('nf-status').value,genres,gh_folder:folder,updated_at:new Date().toISOString()};
  try{
    if(editing && editing!==slug){ await sb.from('novels').update(row).eq('slug',editing); }
    else { await sb.from('novels').upsert(row,{onConflict:'slug'}); }
    admMsg('nf-msg','ok','Novel salva.'); delete CHAP_CACHE[slug];
    await loadNovels(); renderAdminNovels(); clearNovelForm();
  }catch(e){ admMsg('nf-msg','err','Erro: '+e.message); }
}
async function delNovel(slug){
  if(!confirm('Excluir esta novel? (os arquivos na pasta capitulos/ não são apagados)')) return;
  await sb.from('novels').delete().eq('slug',slug);
  await loadNovels(); renderAdminNovels();
}
function admMsg(id,type,txt){ const el=document.getElementById(id); el.className='msg'+(txt?' show '+type:''); el.textContent=txt; }
