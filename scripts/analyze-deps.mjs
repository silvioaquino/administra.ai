// scripts/analyze-deps.mjs
// Processa o grafo do madge + uso de APIs para produzir análise de módulos.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';

const ROOT = 'C:/Dev.em.Transição/Sistemas/Sistema-Administra.ai/administra.ai';
const SRC = join(ROOT, 'src');

// 1) grafo do madge
const graph = JSON.parse(readFileSync(join(ROOT, 'madge-graph.json'), 'utf8'));
const nodes = Object.keys(graph);

// normaliza chaves para caminho relativo a src
function rel(p) {
  // madge retorna caminhos relativos ao diretório analisado (src)
  return p.replace(/\\/g, '/');
}
const pages = nodes.filter(n => n.endsWith('/page.tsx'));
const apiRoutes = nodes.filter(n => /\/api\//.test(n) && n.endsWith('route.ts'));

// classifica um módulo importado
function classify(mod) {
  if (mod.endsWith('/page.tsx')) return 'page';
  if (mod.endsWith('route.ts')) return 'api';
  if (/components\/ui\//.test(mod)) return 'ui';
  if (/components\/layout\//.test(mod)) return 'layout';
  if (/components\/providers\//.test(mod)) return 'provider';
  if (/(^|\/)hooks\//.test(mod)) return 'hook';
  if (/lib\/services\//.test(mod)) return 'service';
  if (/lib\/planejamento\//.test(mod)) return 'service'; // calc indicadores
  if (/lib\//.test(mod)) return 'lib';
  if (/components\//.test(mod)) return 'component';
  return 'other';
}

// 2) para cada página: suas importações diretas (outgoing edges)
const pageDeps = {}; // page -> { pages:[], api:[], ui:[], component:[], hook:[], service:[], lib:[], layout:[], provider:[], other:[] }
for (const page of pages) {
  const imports = graph[page] || [];
  const buckets = { page: [], api: [], ui: [], component: [], hook: [], service: [], lib: [], layout: [], provider: [], other: [] };
  for (const imp of imports) {
    buckets[classify(imp)].push(imp);
  }
  pageDeps[page] = buckets;
}

// 3) módulos compartilhados (não-page, não-api) importados por >=2 páginas
const sharedCount = {}; // module -> Set(pages)
for (const page of pages) {
  const buckets = pageDeps[page];
  const all = [].concat(...Object.values(buckets));
  for (const mod of all) {
    if (classify(mod) === 'page' || classify(mod) === 'api') continue;
    (sharedCount[mod] ||= new Set()).add(page);
  }
}
const sharedRanked = Object.entries(sharedCount)
  .map(([m, set]) => ({ module: m, count: set.size, pages: [...set] }))
  .filter(x => x.count >= 2)
  .sort((a, b) => b.count - a.count);

// 4) por página, quais páginas a importam (in-degree sobre pages) — raro, mas checa
const importedBy = {}; // page -> [pages that import it]
for (const page of pages) importedBy[page] = [];
for (const page of pages) {
  for (const imp of (graph[page] || [])) {
    if (classify(imp) === 'page' && imp !== page) importedBy[imp].push(page);
  }
}

// 5) leitura das páginas para extrair chamadas /api/* (fetch) e router.push/href
function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (e === 'page.tsx') acc.push(p);
  }
  return acc;
}
const pageFiles = walk(SRC);
const apiUsage = {}; // page -> Set(api route literals)
const navTargets = {}; // page -> Set(href/push literals)
const apiRe = /["'`](\/api\/[^"'`\s)]+)["'`]/g;
const navRe = /(?:href|push|replace)\b[^"'`]*(["'`])(\/[^"'`<>{}\s]+)\1/g;
for (const f of pageFiles) {
  const src = readFileSync(f, 'utf8');
  const relp = relative(SRC, f).replace(/\\/g, '/');
  const apis = new Set();
  let m;
  while ((m = apiRe.exec(src))) apis.add(m[1]);
  apiUsage[relp] = [...apis];
  const navs = new Set();
  while ((m = navRe.exec(src))) {
    const r = m[2];
    if (!r.startsWith('/api')) navs.add(r);
  }
  navTargets[relp] = [...navs];
}

// 6) circular deps via detecção simples (DFS) sobre o grafo completo
function findCycles(g) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};
  const cycles = [];
  const stack = [];
  function dfs(u) {
    color[u] = GRAY; stack.push(u);
    for (const v of (g[u] || [])) {
      if (color[v] === GRAY) {
        const idx = stack.indexOf(v);
        cycles.push(stack.slice(idx).concat(v));
      } else if (color[v] === WHITE) dfs(v);
    }
    stack.pop(); color[u] = BLACK;
  }
  for (const n of Object.keys(g)) if (color[n] === undefined) dfs(n);
  return cycles;
}
const cycles = findCycles(graph);

// 7) agrupar páginas em módulos propostos (baseado em prefixo de rota)
function moduleOf(page) {
  const m = page.match(/\(dashboard\)\/([^\/]+)/);
  if (page.includes('(auth)')) return 'Auth';
  if (!m) return 'Root';
  const seg = m[1];
  if (seg.startsWith('nfe')) return 'NFe';
  if (seg.startsWith('fichas-tecnicas')) return 'FichasTecnicas';
  if (seg.startsWith('planejamento')) return 'Planejamento';
  if (seg.startsWith('fluxo-caixa') || seg.startsWith('contas-bancarias') || seg === 'caixa' || seg.startsWith('livro-diario') || seg.startsWith('fechamento-mensal')) return 'Financeiro';
  if (seg.startsWith('config') || seg === 'admin') return 'Admin/Config';
  if (seg === 'page.tsx' || seg === '') return 'DashboardHome';
  return 'Outros';
}
const modulePages = {};
for (const page of pages) {
  const mod = moduleOf(page);
  (modulePages[mod] ||= []).push(page);
}

// módulos compartilhados que cruzam fronteiras de módulo (boundary violations)
const boundary = [];
for (const { module: mod, count, pages: ps } of sharedRanked) {
  const mods = new Set(ps.map(moduleOf));
  if (mods.size >= 2) {
    boundary.push({ module: mod, modulesTouched: [...mods], count });
  }
}

const out = {
  totalPages: pages.length,
  totalApiRoutes: apiRoutes.length,
  pages,
  pageDeps,
  sharedRanked,
  importedBy,
  apiUsage,
  navTargets,
  cycles: cycles.slice(0, 50),
  modulePages,
  boundary,
};
writeFileSync(join(ROOT, 'analysis.json'), JSON.stringify(out, null, 2));

// ---- impressão resumida ----
console.log('=== PÁGINAS:', pages.length, '| API routes:', apiRoutes.length, '===');
console.log('\n--- MÓDULOS PROPOSTOS (páginas por módulo) ---');
for (const [mod, ps] of Object.entries(modulePages)) {
  console.log(`\n# ${mod} (${ps.length})`);
  ps.forEach(p => console.log('   -', p));
}
console.log('\n--- TOP 25 MÓDULOS COMPARTILHADOS (importados por N páginas) ---');
sharedRanked.slice(0, 25).forEach(({ module: m, count }) => console.log(`   ${String(count).padStart(2)}  ${m}`));
console.log('\n--- BOUNDARY VIOLATIONS (módulos compartilhados que cruzam >=2 módulos de página) ---');
boundary.slice(0, 30).forEach(({ module: m, modulesTouched, count }) => console.log(`   ${String(count).padStart(2)}  ${m}  ->  [${modulesTouched.join(', ')}]`));
console.log('\n--- CICLOS DE DEPENDÊNCIA (amostra) ---');
if (cycles.length === 0) console.log('   nenhum ciclo detectado');
else cycles.slice(0, 20).forEach(c => console.log('   ', c.join(' -> ')));
