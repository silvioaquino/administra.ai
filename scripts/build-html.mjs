// scripts/build-html.mjs
// Gera relatorio-dependencias.html (autocontido) a partir de RELATORIO-DEPENDENCIAS.md,
// renderizando os blocos ```mermaid com a lib Mermaid (CDN) e o resto com marked (CDN).
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = 'C:/Dev.em.Transição/Sistemas/Sistema-Administra.ai/administra.ai';
const md = readFileSync(join(ROOT, 'RELATORIO-DEPENDENCIAS.md'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Relatório de Dependências — SeurGerente.ai</title>
<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  :root { --bg:#0b0f17; --panel:#111827; --panel2:#161f2e; --border:#233044; --text:#e5e7eb; --muted:#94a3b8; --accent:#de4838; --accent2:#f97316; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; line-height:1.6; }
  .container { max-width: 1100px; margin: 0 auto; padding: 32px 20px 80px; }
  h1 { font-size: 1.9rem; border-bottom: 2px solid var(--accent); padding-bottom: 10px; }
  h2 { font-size: 1.45rem; margin-top: 2.2rem; color:#fff; border-left: 4px solid var(--accent); padding-left: 10px; }
  h3 { font-size: 1.15rem; margin-top: 1.6rem; color:#f8fafc; }
  h4 { color:#f1f5f9; }
  a { color: var(--accent2); }
  code { background:#0d1420; padding: 2px 6px; border-radius: 5px; font-size: .88em; border:1px solid var(--border); }
  pre { background:#0d1420; border:1px solid var(--border); border-radius: 10px; padding: 14px; overflow:auto; }
  pre code { background: none; border: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: .9rem; }
  th, td { border: 1px solid var(--border); padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: var(--panel2); color:#fff; }
  tr:nth-child(even) td { background: rgba(255,255,255,.02); }
  blockquote { border-left: 4px solid var(--accent2); margin: 14px 0; padding: 6px 14px; background: var(--panel); color: var(--muted); }
  .mermaid { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 18px; margin: 18px 0; text-align: center; overflow:auto; }
  hr { border: none; border-top: 1px solid var(--border); margin: 28px 0; }
  ul, ol { padding-left: 22px; }
  .topbar { position: sticky; top:0; z-index: 10; background: linear-gradient(180deg, #0b0f17 80%, rgba(11,15,23,0)); padding: 10px 0; }
  .topbar b { color: var(--accent); }
</style>
</head>
<body>
  <div class="topbar container" style="padding-top:14px;padding-bottom:14px;">
    <b>SeurGerente.ai</b> &nbsp;•&nbsp; Relatório de Dependências entre Páginas
  </div>
  <div class="container">
    <div id="content"></div>
  </div>

  <script type="text/markdown" id="report-md">${md}</script>

  <script>
    const mdText = document.getElementById('report-md').textContent;
    const el = document.getElementById('content');

    // Fallback offline: se o CDN não carregar, mostra o markdown cru em <pre>.
    if (typeof marked === 'undefined' || typeof mermaid === 'undefined') {
      const warn = document.createElement('div');
      warn.style.cssText = 'background:#3b0d0d;border:1px solid #de4838;color:#fca5a5;padding:10px 14px;border-radius:8px;margin-bottom:16px';
      warn.textContent = 'Aviso: não foi possível carregar as bibliotecas (marked/mermaid) via CDN. Verifique sua conexão com a internet. O texto do relatório aparece abaixo em formato bruto.';
      el.appendChild(warn);
      const pre = document.createElement('pre');
      pre.textContent = mdText;
      el.appendChild(pre);
    } else {
      // 1) markdown -> html
      const html = marked.parse(mdText, { gfm: true, breaks: false });
      el.innerHTML = html;

      // 2) transformar blocos mermaid (pre>code.language-mermaid) em div.mermaid
      el.querySelectorAll('pre > code.language-mermaid').forEach((code) => {
        const pre = code.parentElement;
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = code.textContent;
        pre.replaceWith(div);
      });

      // 3) renderizar mermaid
      mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
      mermaid.run();
    }
  </script>
</body>
</html>
`;

writeFileSync(join(ROOT, 'relatorio-dependencias.html'), html);
console.log('relatorio-dependencias.html gerado (' + html.length + ' bytes).');
