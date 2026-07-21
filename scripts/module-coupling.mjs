// scripts/module-coupling.mjs
// Calcula acoplamento de MÓDULO->MÓDULO a partir de analysis.json,
// usando serviços/hooks/APIs de DOMÍNIO (ignora core: ui, utils, providers, prisma, types-base).
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = 'C:/Dev.em.Transição/Sistemas/Sistema-Administra.ai/administra.ai';
const A = JSON.parse(readFileSync(join(ROOT, 'analysis.json'), 'utf8'));

const CORE = new Set(['ui', 'layout', 'provider', 'lib']); // core compartilhado (utils, prisma, etc.)

// módulo de propriedade de um módulo importado (domínio)
function ownerModule(mod) {
  if (/ficha-tecnica|conversion\.service|recipe-cost/.test(mod)) return 'FichasTecnicas';
  if (/normaliz|open-food-facts|produto-cache|rate-limiter/.test(mod)) return 'NFe';
  if (/planejamento|folha|calculoDespesasVariaveis|provisoes/.test(mod)) return 'Planejamento';
  if (/dre|fechamento/.test(mod)) return 'Financeiro';
  if (/useContasFinanceiras/.test(mod)) return 'Financeiro';
  if (/useCategorias/.test(mod)) return 'NFe';
  if (/auth|admin|stripe|email/.test(mod)) return 'Admin/Config';
  return null; // cross-cutting core
}
// módulo de propriedade de uma rota de API
function ownerApi(api) {
  if (/fichas-tecnicas/.test(api)) return 'FichasTecnicas';
  if (/nfe|produtos/.test(api)) return 'NFe';
  if (/planejamento/.test(api)) return 'Planejamento';
  if (/fluxo-caixa|contas-financeiras|caixa|livro-diario|fechamento-mensal|dre|boletos|retiradas|vendas|notas/.test(api)) return 'Financeiro';
  if (/auth|admin|config|empresa|onboarding|webhook/.test(api)) return 'Admin/Config';
  if (/dashboard/.test(api)) return 'DashboardHome';
  return null;
}
function moduleOf(page) {
  if (page.includes('(auth)')) return 'Auth';
  const m = page.match(/\(dashboard\)\/([^\/]+)/);
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

// 1) por página: deps de domínio (módulos) + APIs de domínio
const pageFeatureDeps = {}; // page -> { moduleDeps:Set, apiDeps:Set }
const MODULES = ['Auth', 'NFe', 'FichasTecnicas', 'Planejamento', 'Financeiro', 'Admin/Config', 'DashboardHome'];
const modEdges = {}; // "A->B" -> Set(pages)  (A usa domínio de B)
const apiOwnerPages = {}; // api -> Set(pages) para ver compartilhamento de API entre módulos

for (const page of A.pages) {
  const mod = moduleOf(page);
  const buckets = A.pageDeps[page];
  const domainMods = new Set();
  const domainApis = new Set();
  // módulos importados (component/hook/service)
  const imported = [].concat(buckets.component || [], buckets.hook || [], buckets.service || []);
  for (const m of imported) {
    const owner = ownerModule(m);
    if (owner && owner !== mod) { domainMods.add(owner); modEdges[`${mod}->${owner}`] ||= new Set(); modEdges[`${mod}->${owner}`].add(page); }
  }
  // APIs chamadas
  for (const api of (A.apiUsage[page] || [])) {
    const owner = ownerApi(api);
    if (owner) {
      domainApis.add(api);
      (apiOwnerPages[api] ||= new Set()).add(page);
      if (owner !== mod) { modEdges[`${mod}->${owner}`] ||= new Set(); modEdges[`${mod}->${owner}`].add(page + ' via ' + api); }
    }
  }
  pageFeatureDeps[page] = { module: mod, domainMods: [...domainMods], domainApis: [...domainApis] };
}

// 2) matriz de acoplamento módulo->módulo
const matrix = {};
for (const [edge, set] of Object.entries(modEdges)) {
  matrix[edge] = set.size;
}

// 3) APIs compartilhadas entre >=2 módulos de página (boundary a nível de backend)
const apiCrossModule = [];
for (const [api, pages] of Object.entries(apiOwnerPages)) {
  const mods = new Set([...pages].map(moduleOf));
  if (mods.size >= 2) apiCrossModule.push({ api, modules: [...mods], nPages: pages.size });
}
apiCrossModule.sort((a, b) => b.nPages - a.nPages);

// ---- impressão ----
console.log('=== ACOPLAMENTO DE MÓDULO -> MÓDULO (via serviços/hooks/APIs de domínio) ===');
console.log('(A -> B significa: páginas do módulo A consomem domínio próprio do módulo B)\n');
const edgeKeys = Object.keys(matrix).sort((a, b) => matrix[b] - matrix[a]);
for (const e of edgeKeys) console.log(`   ${e.padEnd(34)} ${matrix[e]}`);

console.log('\n=== APIs COMPARTILHADAS ENTRE MÓDULOS (boundary no backend) ===');
for (const { api, modules, nPages } of apiCrossModule.slice(0, 30)) {
  console.log(`   ${String(nPages).padStart(2)} pages  ${api}  ->  [${modules.join(', ')}]`);
}

console.log('\n=== DETALHE POR PÁGINA (deps de domínio) ===');
for (const page of A.pages) {
  const d = pageFeatureDeps[page];
  console.log(`\n• ${page}  [${d.module}]`);
  if (d.domainMods.length) console.log(`    importa domínio de: ${d.domainMods.join(', ')}`);
  if (d.domainApis.length) console.log(`    chama APIs: ${d.domainApis.join(', ')}`);
  if (!d.domainMods.length && !d.domainApis.length) console.log('    (sem dependência de domínio externa ao seu módulo)');
}

// salva para o relatório
writeFileSync(join(ROOT, 'coupling.json'), JSON.stringify({
  matrix, pageFeatureDeps, apiCrossModule, modEdges,
}, null, 2));
