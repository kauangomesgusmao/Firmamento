/* ═══ CONFIG ═══
   Chaves e constantes do app. O Supabase continua cuidando de login, favoritos,
   histórico, avaliações e comentários — nada disso mudou.
   O que mudou: os capítulos não vêm mais da API do GitHub. Eles ficam na própria
   pasta `capitulos/` do site (lida via `capitulos/index.json`, gerado pelo script
   em scripts/gerar_manifesto.py). Veja README.md. */
const SUPA_URL = 'https://lpsynluplxgzagsgbauj.supabase.co';
const SUPA_KEY = 'sb_publishable_inDX8SLLcIW-yhiz1ZkOWw_kbIBJPZl';
const GENRES = ['Ação','Aventura','Fantasia','Artes Marciais','Romance','Comédia','Drama','Isekai','Xianxia','Xuanhuan','Wuxia','Sistema','Harém','Ecchi','Terror','Mistério','Sci-Fi','Slice of Life','Tragédia','Sobrenatural','Histórico','Psicológico'];
const STATUSES = ['Em andamento','Completo','Hiato','Em breve'];

/* ── Descoberta automática (modo antigo, agora local) ──
   Lê capitulos/index.json (gerado pelo script) e lista novels SEM precisar
   cadastrar no Supabase.
   - Arquivos .html soltos na raiz de capitulos/  -> viram 1 novel (a pasta inteira).
   - Cada subpasta com .html dentro               -> vira uma novel separada.
   Metadados (capa/descrição/gênero) podem vir de um _meta.json opcional na pasta.
   Um cadastro manual no Admin apontando a mesma pasta tem prioridade. */
const AUTO_SCAN = true;
const MANIFEST_URL = 'capitulos/index.json';

let ME = null;          // auth user
let PROFILE = null;     // {role, username}
let NOVELS = [];        // novels metadata (supabase + auto-scan local)
let AUTO_CACHE = null;  // cache das novels descobertas no manifesto nesta sessão
let MANIFEST_CACHE = null; // cache do capitulos/index.json nesta sessão
let CHAP_CACHE = {};    // slug -> [{name,content,order}]
let FAVS = new Set();   // favorite slugs
let authMode = 'login';
let fs = +localStorage.getItem('fs') || 17;
let font = localStorage.getItem('font') || 'Georgia,serif';
let cur = {slug:null, idx:0};

// por último: se o script do Supabase (CDN) não carregar, o erro fica isolado
// aqui em vez de deixar as variáveis acima indefinidas pro resto do app.
const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
