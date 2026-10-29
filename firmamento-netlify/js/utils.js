/* ═══ HELPERS ═══ */
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function slugify(s){ return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function prettify(s){ return (s||'').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()).trim(); }
function normFolder(f){ return (f||'').replace(/^\/+|\/+$/g,''); }

let toastT;
function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),2500); }
