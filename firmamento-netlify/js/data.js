/* ═══ NOVELS DATA (Supabase + auto-scan local) ═══ */
async function loadNovels(){
  const {data,error}=await sb.from('novels').select('*').order('updated_at',{ascending:false});
  const supa = (error?[]:(data||[])).map(n=>({...n, source:'supabase'}));
  // pastas já cobertas por um cadastro manual -> não duplicar no auto-scan
  const usedFolders = new Set(supa.map(n=>normFolder(n.gh_folder)).filter(Boolean));
  let auto = [];
  if(AUTO_SCAN){
    try{ auto = (await loadLocalNovels()).filter(n=>!usedFolders.has(normFolder(n.gh_folder))); }
    catch(e){ console.warn('auto-scan falhou',e); }
  }
  // merge por slug: Supabase sobrescreve o auto (mesma novel enriquecida)
  const bySlug = new Map();
  auto.forEach(n=>bySlug.set(n.slug,n));
  supa.forEach(n=>bySlug.set(n.slug,n));
  NOVELS = [...bySlug.values()].sort((a,b)=>(b.updated_at||'').localeCompare(a.updated_at||'') || a.title.localeCompare(b.title));
}
function novelBySlug(slug){ return NOVELS.find(n=>n.slug===slug); }

/* descobre novels direto da pasta capitulos/ do próprio site (sem cadastro, sem GitHub) */
async function getManifest(){
  if(MANIFEST_CACHE) return MANIFEST_CACHE;
  try{ MANIFEST_CACHE = await fetch(MANIFEST_URL,{cache:'no-store'}).then(r=>r.ok?r.json():{folders:[]}); }
  catch(e){ MANIFEST_CACHE = {folders:[]}; }
  if(!MANIFEST_CACHE || !Array.isArray(MANIFEST_CACHE.folders)) MANIFEST_CACHE = {folders:[]};
  return MANIFEST_CACHE;
}
async function loadLocalNovels(){
  if(AUTO_CACHE) return AUTO_CACHE;
  const manifest = await getManifest();
  const out=[];
  for(const entry of manifest.folders){
    const folder = normFolder(entry.folder);
    const files = (entry.files||[]).filter(f=>f.toLowerCase().endsWith('.html'));
    if(!folder || !files.length) continue;
    const meta = entry.meta || {};
    const title = meta.title || await titleFromFirst(folder, files) || prettify(folder.split('/').pop());
    out.push(mkLocalNovel(folder, title, meta));
  }
  AUTO_CACHE=out;
  return out;
}
async function titleFromFirst(folder, files){
  const first=[...files].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))[0];
  if(!first) return '';
  try{
    const html=await fetch(folder+'/'+encodeURIComponent(first)).then(r=>r.text());
    const t=new DOMParser().parseFromString(html,'text/html').title||'';
    return t.split(/\s*[—–|]\s*|\s+-\s+/)[0].trim();  // tira " — Caps 1–10"
  }catch(e){ return ''; }
}
function mkLocalNovel(folder, title, meta){
  meta=meta||{};
  return {
    slug: meta.slug || slugify(title) || slugify(folder),
    title, author: meta.author||'',
    description: meta.description||'',
    cover_url: meta.cover_url||meta.cover||'',
    status: meta.status||'Em andamento',
    genres: Array.isArray(meta.genres)?meta.genres:[],
    gh_folder: folder,  // nome do campo mantido por compatibilidade com a tabela do Supabase — agora é só "pasta dos capítulos", local ao site
    updated_at: meta.updated_at||'',
    source: 'local'
  };
}

/* ═══ CAPÍTULOS (lidos da pasta local do site) ═══ */
async function listFolderFiles(folder){
  const manifest = await getManifest();
  const entry = manifest.folders.find(e=>normFolder(e.folder)===normFolder(folder));
  if(!entry) return [];
  return (entry.files||[]).filter(f=>f.toLowerCase().endsWith('.html')).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
}
function splitChapters(doc, fallback){
  const body=doc.body||doc.documentElement;
  const dataCaps=Array.from(body.querySelectorAll('article[data-cap],section[data-cap]'));
  if(dataCaps.length){
    return dataCaps.sort((a,b)=>(+a.dataset.cap)-(+b.dataset.cap)).map(el=>{
      const name=el.dataset.title||el.querySelector('h1,h2,h3')?.textContent.trim()||`Capítulo ${el.dataset.cap}`;
      const clone=el.cloneNode(true); clone.querySelector('h1,h2,h3')?.remove();
      return {name, content:clone.innerHTML, order:+el.dataset.cap};
    });
  }
  const title=doc.querySelector('h1,h2')?.textContent.trim()||doc.title?.trim()||fallback;
  return [{name:title, content:body.innerHTML, order:0}];
}
async function loadChapters(slug){
  if(CHAP_CACHE[slug]) return CHAP_CACHE[slug];
  const n=novelBySlug(slug); if(!n||!n.gh_folder) return [];
  const files=await listFolderFiles(n.gh_folder);
  const all=[];
  await Promise.all(files.map(async name=>{
    try{
      const html=await fetch(n.gh_folder+'/'+encodeURIComponent(name)).then(r=>r.text());
      const doc=new DOMParser().parseFromString(html,'text/html');
      splitChapters(doc,name).forEach(c=>all.push(c));
    }catch(e){ console.warn(name,e); }
  }));
  all.sort((a,b)=>(a.order||0)-(b.order||0));
  CHAP_CACHE[slug]=all;
  return all;
}
