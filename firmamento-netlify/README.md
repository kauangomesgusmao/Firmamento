# Firmamento

Plataforma web para ler novels. Começou como um leitor de HTMLs e virou uma biblioteca completa de várias obras, no estilo do mvlempyr.io — com login, favoritos, filtros por gênero e página própria por novel.

Site no ar: https://firmamento-novel.netlify.app/

## O que o projeto faz

- Lê novels importadas em HTML, inclusive arquivos com vários capítulos juntos (split automático em capítulos).
- Descobre as novels sozinho (auto-scan), lendo a pasta `capitulos/` do próprio site.
- Biblioteca persistente, histórico de leitura e favoritos sincronizados por conta.
- Cadastro de novels com capa, descrição, status e gêneros; filtros por gênero; estrelas (avaliações) e comentários — tudo por um painel de administração.
- Capa da novel enviada direto do computador pelo painel (a imagem é compactada automaticamente).

## Tecnologias e serviços usados

### Netlify
Plataforma de hospedagem do site. Publica os arquivos na web com HTTPS e domínio próprio (firmamento-novel.netlify.app). A publicação é feita enviando a pasta do site pelo painel do Netlify.

### Supabase
Backend da plataforma (banco de dados Postgres + autenticação + API, no plano gratuito). Guarda tudo que precisa de conta e de servidor:

- Login e cadastro, com separação entre usuário comum e administrador.
- Metadados das novels (descrição, capa, status, gênero), geridos pelo painel admin.
- Favoritos e histórico de leitura sincronizados por conta (acessíveis de qualquer aparelho).
- Estrelas (avaliações) e comentários.

O acesso aos dados é protegido por regras no próprio banco (Row Level Security): cada pessoa só enxerga e altera o que é seu, e apenas administradores podem editar o catálogo.

### Capítulos locais (pasta `capitulos/`)
Os textos das novels ficam dentro do próprio site, na pasta `capitulos/`. Um índice (`capitulos/index.json`), gerado por um script, lista quais obras e capítulos existem — é assim que o auto-scan descobre as novels, sem depender de serviços externos.

### PWA (manifest.json + sw.js)
O site é um Progressive Web App: o service worker (`sw.js`) faz cache do conteúdo, permite funcionamento offline e deixa o site instalável no celular como se fosse um app. O `manifest.json` define nome, ícone e comportamento da instalação.

### HTML / CSS / JavaScript
Aplicação client-side (roda no navegador), em HTML, CSS e JavaScript puros, sem framework pesado. O código é separado em arquivos por função (estilo, dados, leitor, painel admin).

### Servidor local em Python (versão anterior)
Antes da hospedagem na web, o Firmamento rodava como servidor local (`firmamento_server.py`), servindo as novels do PC para o celular na mesma rede Wi-Fi, com atualização automática ao editar a pasta de capítulos.

---

Em resumo: o **Netlify** publica o site, os **capítulos** ficam dentro do próprio site, e o **Supabase** cuida de contas, dados e interações dos usuários — com os dados de cada pessoa isolados por regras de segurança no banco.

## Estrutura do projeto

```
firmamento/
├── index.html
├── manifest.json          PWA (nome, ícone, instalação)
├── sw.js                  service worker (cache/offline)
├── css/
│   └── style.css
├── js/
│   ├── config.js          constantes do app
│   ├── utils.js           helpers
│   ├── data.js            novels (Supabase + auto-scan local) e leitura de capítulos
│   ├── auth.js            login/logout, tema
│   ├── router.js          navegação por hash
│   ├── ui.js              home, catálogo, biblioteca
│   ├── novel.js           página da novel, avaliação, comentários
│   ├── reader.js          leitor de capítulos
│   └── admin.js           painel admin (cadastro de novel)
├── capitulos/
│   ├── index.json         índice gerado pelo script (não editar à mão)
│   └── <arquivos .html>   os capítulos ficam aqui
└── scripts/
    └── gerar_manifesto.py regenera capitulos/index.json
```

## Como adicionar capítulos

1. Coloque os arquivos `.html` dentro de `capitulos/` (soltos na raiz = mesma novel; numa subpasta nova = outra novel).
2. (Opcional) Crie um `_meta.json` na pasta da novel com `title`, `author`, `description`, `cover_url`, `status`, `genres`.
3. Rode o script para atualizar o índice: `python scripts/gerar_manifesto.py`.
4. Publique a versão nova (envie a pasta no Netlify, ou dê push se o deploy for automático).
