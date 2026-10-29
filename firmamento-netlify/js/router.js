/* ═══ ROUTER ═══ */
function go(view, arg){
  if(view==='home') location.hash='#/';
  else if(view==='catalog') location.hash='#/catalogo';
  else if(view==='library') location.hash='#/biblioteca';
  else if(view==='admin') location.hash='#/admin';
  else if(view==='novel') location.hash='#/novel/'+arg;
}
function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===id));
  if(id!=='reader') window.scrollTo(0,0);
}
async function route(){
  if(!ME){ showOnlyLogin(); return; }
  const h=location.hash.replace(/^#\/?/,'');
  const parts=h.split('/').filter(Boolean);
  const p0=parts[0]||'';
  if(p0==='catalogo'){ showView('catalog'); renderCatalogFilters(); renderCatalog(); }
  else if(p0==='biblioteca'){ showView('library'); renderLibrary(); }
  else if(p0==='admin'){ if(PROFILE.role!=='admin'){go('home');return;} showView('admin'); renderAdmin(); }
  else if(p0==='novel' && parts[1]){ showView('novel'); renderNovel(decodeURIComponent(parts[1])); }
  else if(p0==='ler' && parts[1]){ openReader(decodeURIComponent(parts[1]), +parts[2]||0); }
  else { showView('home'); renderHome(); }
}
window.addEventListener('hashchange',route);
