# Firmamento

Plataforma web para ler novels. Começou como um leitor de HTMLs e está virando uma biblioteca completa de várias obras, no estilo do mvlempyr.io — com login, favoritos, filtros por gênero e página própria por novel.

Site no ar: https://firmamento-novel.vercel.app/

## O que o projeto faz

- Lê novels importadas em HTML, inclusive arquivos com vários capítulos juntos (split automático em capítulos).
- Descobre as novels sozinho (auto-scan) lendo a pasta `capitulos/` direto do GitHub.
- Biblioteca persistente, histórico de leitura e favoritos.
- Versão em expansão: cadastro de novels, capa/descrição/status, filtros por gênero, estrelas e comentários, com painel de administração.

## Tecnologias e serviços usados

### Vercel
Plataforma de hospedagem e deploy do site. Ela pega o código deste repositório no GitHub e serve a aplicação na web, com HTTPS e domínio próprio (firmamento-novel.vercel.app). A cada envio de código novo (push), a Vercel reconstrói e publica o site automaticamente — não é preciso subir nada manualmente.

### Supabase
Backend da plataforma (Backend-as-a-Service: banco de dados Postgres + autenticação + API, no plano gratuito). É o que guarda tudo que precisa de conta e de servidor:
- Login e cadastro, separando usuário comum de administrador.
- Metadados das novels (descrição, capa, status, gênero), geridos pelo painel admin.
- Favoritos e histórico de leitura sincronizados por conta (acessíveis de qualquer aparelho).
- Estrelas (avaliações) e comentários.

### GitHub
Repositório do código e também dos capítulos das novels (pasta `capitulos/`). Como o repositório é público, o app lê os capítulos pela API do GitHub sem precisar de token — o token só é necessário para enviar capítulos novos. É daqui que o auto-scan lista as obras.

### PWA (manifest.json + sw.js)
O site é um Progressive Web App: o service worker (`sw.js`) faz cache do conteúdo, permite funcionamento offline e deixa o site instalável no celular como se fosse um app. O `manifest.json` define nome, ícone e comportamento da instalação.

### HTML / CSS / JavaScript
A aplicação é client-side (roda no navegador), feita em HTML, CSS e JavaScript puros, sem framework pesado.

### Servidor local em Python (versão anterior)
Antes da Vercel, o Firmamento rodava como servidor local (`firmamento_server.py`), servindo as novels do PC para o celular na mesma rede Wi-Fi, com auto-atualização ao editar a pasta de capítulos.

---

Em resumo: **GitHub** guarda o código e os capítulos, a **Vercel** publica o site, e o **Supabase** cuida de contas, dados e interações dos usuários.
