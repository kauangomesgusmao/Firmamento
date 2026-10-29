/* ═══ START ═══ */
(()=>{ const s=document.querySelector('.font-sel'); if(s) Array.from(s.options).forEach(o=>{if(o.value===font)o.selected=true;}); })();
setAuthMode('login');
boot();
