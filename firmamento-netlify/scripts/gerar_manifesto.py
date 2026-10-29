#!/usr/bin/env python3
"""
Gera capitulos/index.json a partir do que estiver na pasta capitulos/.

Rode este script sempre que adicionar, remover ou renomear capítulos,
ANTES de arrastar a pasta do site para o Netlify. Sem isso o site não
vai saber que os arquivos novos existem (ele não lista pastas sozinho
no navegador — só lê o index.json).

Regras (iguais ao scan antigo do GitHub, só que local):
  - arquivos .html soltos direto em capitulos/      -> 1 novel (a pasta toda)
  - cada subpasta de capitulos/ com .html dentro    -> 1 novel separada
  - um "_meta.json" (ou "meta.json") dentro da pasta/subpasta é opcional e
    pode trazer: title, author, description, cover_url, status, genres,
    slug, updated_at — os mesmos campos do formulário do Admin.

Uso:
    python gerar_manifesto.py
    (ou: python3 scripts/gerar_manifesto.py, de qualquer lugar)
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

META_RE = re.compile(r'^_?meta\.json$', re.IGNORECASE)


def ler_meta(pasta: Path):
    for f in pasta.iterdir():
        if f.is_file() and META_RE.match(f.name):
            try:
                with f.open('r', encoding='utf-8') as fh:
                    data = json.load(fh)
                if isinstance(data, dict):
                    return data
            except (json.JSONDecodeError, OSError) as e:
                print(f'  aviso: não consegui ler {f} ({e})', file=sys.stderr)
    return {}


def listar_htmls(pasta: Path):
    return sorted(
        (f.name for f in pasta.iterdir() if f.is_file() and f.suffix.lower() == '.html'),
        key=lambda n: n.lower()
    )


def montar_entrada(pasta: Path, raiz: Path):
    htmls = listar_htmls(pasta)
    if not htmls:
        return None
    folder = pasta.relative_to(raiz).as_posix()
    meta = ler_meta(pasta)
    return {'folder': folder, 'files': htmls, 'meta': meta}


def gerar(capitulos_dir: Path):
    if not capitulos_dir.is_dir():
        print(f'Pasta não encontrada: {capitulos_dir}', file=sys.stderr)
        sys.exit(1)

    folders = []

    raiz = capitulos_dir.parent  # paths no index.json ficam relativos à raiz do site
    entrada_raiz = montar_entrada(capitulos_dir, raiz)
    if entrada_raiz:
        folders.append(entrada_raiz)

    for sub in sorted(p for p in capitulos_dir.iterdir() if p.is_dir()):
        entrada = montar_entrada(sub, raiz)
        if entrada:
            folders.append(entrada)

    manifesto = {
        'generated_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'folders': folders,
    }

    destino = capitulos_dir / 'index.json'
    with destino.open('w', encoding='utf-8') as fh:
        json.dump(manifesto, fh, ensure_ascii=False, indent=2)

    total_novels = len(folders)
    total_arquivos = sum(len(f['files']) for f in folders)
    print(f'OK: {destino}')
    print(f'{total_novels} novel(s), {total_arquivos} arquivo(s) HTML no total.')
    for f in folders:
        print(f'  - {f["folder"]}: {len(f["files"])} capítulo(s)')


if __name__ == '__main__':
    script_dir = Path(__file__).resolve().parent
    projeto_raiz = script_dir.parent
    gerar(projeto_raiz / 'capitulos')
