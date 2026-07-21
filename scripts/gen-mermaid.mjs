// scripts/gen-mermaid.mjs
// Gera diagramas Mermaid (module-flow + page-flow) a partir de coupling.json + analysis.json
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = 'C:/Dev.em.Transição/Sistemas/Sistema-Administra.ai/administra.ai';
const A = JSON.parse(readFileSync(join(ROOT, 'analysis.json'), 'utf8'));
const C = JSON.parse(readFileSync(join(ROOT, 'coupling.json'), 'utf8'));

// módulo de cada página (igual ao do coupling)
function moduleOf(page) {
  if (page.includes('(auth)')) return 'Auth';
  const m = page.match(/\(dashboard\)\/([^\/]+)/);
  if (!m) return 'Root';
  const seg = m[1];
  if (seg.startsWith('nfe')) return 'NFe';
  if (seg.startsWith('fichas-tecnicas')) return 'FichasTecnicas';
  if (seg.startsWith('planejamento')) return 'Planejamento';
  if (seg.startsWith('fluxo-caixa') || seg.startsWith('contas-bancarias') || seg === 'caixa' || seg.startsWith('livro-diario') || seg.startsWith('fechamento-mensal')) return 'Financeiro';
  if (seg.startsWith('config') || seg === 'admin') return 'AdminConfig';
  if (seg === 'page.tsx' || seg === '') return 'DashboardHome';
  return 'Outros';
}

// rótulo curto da página
function short(page) {
  return page
    .replace(/^app\//, '')
    .replace(/\(dashboard\)\//, '')
    .replace(/\(auth\)\//, 'auth/')
    .replace(/\/page\.tsx$/, '')
    .replace(/\[[^\]]+\]/g, '*');
}

// ---------- 1) MODULE FLOW ----------
const modLabel = {
  Auth: 'Auth', NFe: 'NFe', FichasTecnicas: 'FichasTecnicas',
  Planejamento: 'Planejamento', Financeiro: 'Financeiro',
  AdminConfig: 'Admin/Config', DashboardHome: 'DashboardHome',
};
let m = 'graph TD\n';
m += '  classDef core fill:#1e293b,stroke:#de4838,color:#fff;\n';
m += '  classDef cycle fill:#7f1d1d,stroke:#fca5a5,color:#fff;\n';
// módulos
const mods = Object.keys(modLabel);
for (const k of mods) m += `  ${k}["${modLabel[k]}"]\n`;
// arestas de acoplamento (do matrix), bidirecionais destacadas
const matrix = C.matrix;
const seen = new Set();
for (const [edge, w] of Object.entries(matrix)) {
  const [a, b] = edge.split('->');
  const rev = `${b}->${a}`;
  const isCycle = matrix[rev] !== undefined;
  const style = isCycle ? ' -.->|' : ' -->|';
  m += `  ${a}${style}${w}| ${b}\n`;
  seen.add(edge);
}
m += '\n  %% Core compartilhado por todos (ui/*, lib/utils, prisma, AuthProvider)\n';
m += '  CORE["CORE: ui/* + lib/utils + prisma + AuthProvider"]:::core\n';
for (const k of mods) m += `  ${k} --> CORE\n`;
// destacar ciclo NFe<->Financeiro
m += '\n  %% CICLO DE MÓDULO: NFe <-> Financeiro\n';
m += '  NFe:::cycle\n  Financeiro:::cycle\n';
writeFileSync(join(ROOT, 'module-flow.mmd'), m);

// ---------- 2) PAGE FLOW (agrupado por módulo, só arestas de domínio cruzadas) ----------
let p = 'graph TD\n';
const groups = {};
for (const page of A.pages) {
  const mod = moduleOf(page);
  (groups[mod] ||= []).push(page);
}
for (const [mod, pages] of Object.entries(groups)) {
  p += `  subgraph ${mod}["${modLabel[mod] || mod}"]\n`;
  for (const page of pages) {
    const id = 'P_' + short(page).replace(/[^a-zA-Z0-9]/g, '_');
    p += `    ${id}["${short(page)}"]\n`;
  }
  p += '  end\n';
}
// arestas de domínio cruzadas (pageFeatureDeps)
for (const [page, d] of Object.entries(C.pageFeatureDeps)) {
  const fromId = 'P_' + short(page).replace(/[^a-zA-Z0-9]/g, '_');
  // módulos de domínio importados
  for (const owner of d.domainMods) {
    p += `  ${fromId} -.->|importa ${owner}| ${owner}\n`;
  }
}
// arestas de API cruzadas (page -> api owner module)
for (const [page, d] of Object.entries(C.pageFeatureDeps)) {
  const fromId = 'P_' + short(page).replace(/[^a-zA-Z0-9]/g, '_');
  for (const api of d.domainApis) {
    const owner = ownerApiOf(api);
    if (owner && owner !== d.module) {
      p += `  ${fromId} ==>|${api.replace(/\?.*$/, '')}| ${owner}\n`;
    }
  }
}
writeFileSync(join(ROOT, 'page-flow.mmd'), p);

// helper reutilizado
function ownerApiOf(api) {
  if (/fichas-tecnicas/.test(api)) return 'FichasTecnicas';
  if (/nfe|produtos/.test(api)) return 'NFe';
  if (/planejamento/.test(api)) return 'Planejamento';
  if (/fluxo-caixa|contas-financeiras|caixa|livro-diario|fechamento-mensal|dre|boletos|retiradas|vendas|notas/.test(api)) return 'Financeiro';
  if (/auth|admin|config|empresa|onboarding|webhook/.test(api)) return 'AdminConfig';
  if (/dashboard/.test(api)) return 'DashboardHome';
  return null;
}

console.log('module-flow.mmd and page-flow.mmd written.');
console.log('\n--- module-flow.mmd ---\n');
console.log(m);
