# Prompt para Lovable — Recriar SeuGerente.ai SaaS com Design e Funcionalidades Aprimorados

---

## 🎯 Objetivo Geral

Recrie do zero o SaaS **SeuGerente.ai** — uma plataforma de gestão completa para restaurantes, lanchonetes, cafeterias e outros negócios do segmento alimentício. O sistema deve ser um **SaaS multi-tenant** com autenticação, assinaturas Stripe, trial de 7 dias e gestão completa de finanças, estoque, fichas técnicas e controle de caixa.

O foco principal é **modernizar o design** com um sistema de design profissional, consistente e atraente, além de **aprimorar as funcionalidades** para oferecer uma experiência mais intuitiva, poderosa e escalável.

---

## 🏢 Sobre o Produto (Proposta de Valor)

**SeuGerente.ai** é um gestor financeiro inteligente para restaurantes e comércios alimentícios. Ele conecta dados reais de vendas (via NF-e, NFC-e, lançamentos manuais e caixa diário) com planejamento financeiro avançado, permitindo que o gestor:

- **Planeje** metas de faturamento por período (almoço, jantar, café, turno único)
- **Controle** despesas fixas, variáveis e folha salarial comprovando margens ideais
- **Calcule** o preço de venda ideal de pratos usando mark-up e CMV máximo
- **Gestão** de fichas técnicas com custo por ingrediente, fator de correção e conversão de unidades
- **Monitore** o caixa diário, contas bancárias e DRE (Demonstrativo de Resultados)
- **Processe** notas fiscais (XML/NFC-e) com leitura de QR Code e normalização de produtos

O sistema é pensado para **contadores, gestores e donos de restaurantes** que precisam de controle financeiro preciso sem complicação.

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 15+ (App Router, TypeScript obrigatório)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui + lucide-react
- **Banco de Dados:** PostgreSQL com Prisma ORM (schema multi-tenant com isolamento automático por empresa)
- **Auth:** NextAuth.js v5 com Credentials Provider + bcrypt para hash de senhas
- **Pagamentos:** Stripe (planos básico R$49,90 e profissional R$99,90/mês)
- **Email:** Resend para confirmações e recuperação de senha
- **Charts:** Recharts (gráficos de linha, barras, pizza, área)
- **Validação:** Zod + React Hook Form
- **Notificações:** Sonner (toasts)
- **Testes:** Vitest + React Testing Library
- **Scanner:** html5-qrcode para leitura de QR Code/NFC-e
- **Normalização de Produtos:** Open Food Facts API (com cache e fallback local)
- **Impressão Térmica:** html2print ou biblioteca similare para comprovantes de caixa
- **Deploy:** Vercel com variáveis de ambiente (.env)

---

## 📊 Modelos de Dados (Prisma Schema)

Crie o seguinte schema Prisma com **isolamento multi-tenant** (toda query filtrada por `empresaId`):

### Usuário & Assinatura
- `User`: id, email, passwordHash, name, role (USER/ADMIN), trialEndsAt, empresas[]
- `Subscription`: id, userId, planId, status, startDate, endDate
- `Plan`: id, name, price, features (JSON), stripePriceId, isActive
- `Empresa`: id, userId, nome, whatsapp, segmento, cep, logradouro, numero, complemento, bairro, cidade, estado

### Financeiro (multi-tenant)
- `ContaFinanceira`: nome, tipo, saldoInicial, instituicao, isDefault
- `LivroDiario`: data, conta, descricao, clienteFornecedor, entrada, saida, tipo (VENDA/COMPRA), status, dataPagamento
- `Boleto`: codigoBarras, numeroDocumento, valor, dataVencimento, dataPagamento, status
- `PlanoContas`: codigo, nome, tipo (receita/despesa), grupo, nivel, ativo
- `FechamentoMensal`: ano, mes, status (ABERTO/FECHADO), dataFechamento

### Planejamento & Indicadores
- `PlanejamentoFaturamentoNovo`: ano, mes, metaDiaria, diasTrabalhados, metaTotal, periodos (JSON: cafe, almoco, jenta, turnoUnico)
- `PlanejamentoAcompanhamentoNovo`: ano, mes, faturamentoAlmoco, faturamentoJanta, faturamentoTotal
- `PlanejamentoDespesaFixaNovo`: ano, mes, nome, valor, status, dataVencimento, dataPagamento
- `PlanejamentoDespesaVariavelNovo`: ano, mes, percentualTotal, faturamentoBase, impactoMensal, config (JSON)
- `PlanejamentoFolhaSalarial`: ano, mes, totalSalarios, totalDecimo, totalFerias, totalFgts, totalInss, totalInssPatronal
- `Funcionario`: nome, salario
- `ProvisaoFuncionario`: ano, provisao, funcionarioNome, ativo
- `MetaFluxoCaixa`: ano, mes, metaFaturamentoDiaria, metaDespesasDiaria, metaLucroPercentual, diasUteis
- `FluxoCaixaDiario`: data, faturamentoRealizado, despesasRealizadas, lucroRealizado
- `TaxasCartaoConfig`: config (JSON: maquininhas, distribuicaoVendas, taxas), resultados
- `DespesaVariavel`: nome, percentual, aluguel

### Produtos & Fichas
- `Produto`: codigo, descricao, unidade, quantidade, valorUnitario, valorTotal, fornecedor, dataCompra, precoVenda, pesoUnitario, densidade, codigoBarras, nomeNormalizado, marca, categoriaSugestao, fonteDados, precisaRevisao
- `ProdutoVenda`: nome, quantidade, valor, adicionais (JSON)
- `FichaTecnica`: nome, categoria, precoVenda, custoTotal, fatorOscilacao, custoPorPorcao, margem, rendimentoPorcoes, ingredientes (JSON), modoPreparo
- `FichaItem`: fichaId, produtoId, quantidade, unidade, valorUnitario, custo, isProdutoAcabado, pesoBruto, pesoLiquido, fatorCorrecao

### Caixa
- `CaixaAbertura`: dataAbertura, valorInicial, observacao, status (ABERTO/FECHADO)
- `CaixaFechamento`: dataFechamento, valorAbertura, totalVendas, retiradas, saldoFinal
- `Venda`: dataVenda, dadosPedido (JSON), tipoPagamento, valorTotal, numeroPedido, nomeCliente, telefoneCliente
- `VendaManual`: dataVenda, tipoPagamento, valor, descricao
- `Retirada`: dataRetirada, valor, observacao

### Nota Fiscal
- `NotaFiscal`: chaveAcesso, numero, serie, dataEmissao, cnpjEmitente, nomeEmitente, ieEmitente, enderecoEmitente, valorTotal, cpfConsumidor
- `Pagamento`: notaFiscalId, formaPagamento, valor

### Controle de Acesso
- `Categoria`: codigo, nome, nivel, tipo, isHeader, parentId (hierarquia de plano de contas)

---

## 🎨 Sistema de Design (Design System)

Crie um design system moderno, profissional e consistente. Inspire-se em plataformas SaaS como **Linear, Notion, Figma, Supabase Studio**.

### Paleta de Cores
- **Primária:** `#de4838` (terracota/vermelho — manter como branding)
- **Secundária:** `#eab349` (dourado) ou `#3b82f6` (azul)
- **Neutras:** Cinza `900/800/100/50` para dark, `50/100/200/800` para light
- **Status:** Sucesso (verde `#10b981`), Alerta (amarelo `#f59e0b`), Erro (vermelho `#ef4444`), Info (azul `#3b82f6`)
- **Dark Mode nativo** (CSS variables + toggle no header)

### Tipografia
- Fonte: **Inter** ou **Satoshi** (via next/font)
- Hierarquia clara: H1 (24px bold), H2 (20px semibold), H3 (16px semibold), Body (14px), Caption (12px)

### Componentes Base (shadcn/ui)
- Botão: primary, secondary, outline, ghost, destructive — todos com `rounded-xl`
- Inputs: `rounded-xl`, bordas cinza claro, foco `ring-[#de4838]`
- Cards: `bg-white dark:bg-gray-900`, shadow `xl`, border `gray-200/800`
- Badges: status coloridos com `rounded-full`
- Tabelas: zebra, header gris claro, linhas hover
- Progress bars: animação suave
- Diálogos/Modais: backdrop blur, bordas arredondados

### Layout Geral
- **Sidebar esquerda fixa** (desktop), colapsável, dark background, gradiente `from-gray-900 to-gray-950`
- **Header sticky** (top), com breadcrumbs e ações rápidas
- **Mobile:** drawer lateral, bottom bar de navegação
- **Spacing:** padding `p-6`, gaps `gap-6`

---

## 🧩 Funcionalidades Existentes (preservar e aprimorar)

### 1. Auth & Onboarding
- Login com email/senha, senha visível/oculta
- Registro com: nome da loja, WhatsApp, segmento (dropdown com busca: Restaurante, Pizzaria, Cafeteria, etc.), CEP com busca automática (ViaCEP), planos exibidos
- Trial grátis de 7 dias (sem cartão)
- Esqueci senha / Reset de senha via email (Resend)
- Onboarding guiado (destaque as funcionalidades na primeira visita)
- Usuários multi-acesso (admin + operadores) com perfis

### 2. Dashboard Financeiro
- Cards de resumo: Receita, Despesas, Lucro, Margem (%)
- Gráfico de linhas: Receita vs Despesas vs Lucro (período: hoje, mês, ano, data específica)
- Metas de faturamento/despesa/lucro com barras de progresso
- Indicadores: Mark-up, CMV, % Despesas Fixas, % Despesas Variáveis, % Folha — com "health check" (saúde financeira)
- Últimos lançamentos + alertas inteligentes (saldo negativo, margem baixa, ficha abaixo do lucro alvo)
- Toggle de valores (mostrar/ocultar)

### 3. Planejamento Financeiro
- Metas de faturamento mensais (com períodos: café, almoço, jantar, turno único — toggle múltiplo)
- Despesas fixas (cadastro, edição inline, status PENDENTE/PAGO)
- Despesas variáveis (configuração de maquininhas por adquirente: InfinitePay, Stone, C6, etc.; distribuição de vendas por débito/crédito/voucher; taxas de manutenção, simples nacional)
- Folha salarial (funcionários, salários, décimo, férias, FGTS, INSS, INSS patronal)
- Provisões de funcionários (13º, férias, etc.)
- Mark-up calculator (com fórmula e campo de lucro desejado editável)
- CMV máximo (100% - %fixas - %variáveis - %lucro)
- Taxas de cartão (configuração detalhada)
- Sincronização automática com dados reais do livro diário

### 4. Gestão de Produtos & NF-e
- Upload/processamento de XML de NF-e/NFC-e
- Leitura de QR Code de NFC-e via câmera
- Lançamento manual de vendas e compras (com produto, quantidade, valor, forma de pagto)
- Catálogo de produtos com: código, descrição, unidade, estoque, preço de venda, fornecedor, código de barras, peso, densidade
- Normalização automática de produtos (OpenFoodFacts + correção manual)
- Batch operations (atualização em massa)

### 5. Fichas Técnicas (Receitas)
- Criação de fichas com ingredientes (produtos e sub-fichas)
- Conversão de unidades inteligente (g ↔ kg, L ↔ mL, unidades)
- Fator de correção (perda no pré-preparo: peso bruto/peso líquido)
- Fator de oscilação (margem de segurança)
- Cálculo de custo por porção
- Margem de lucro e preço sugerido (baseado no mark-up do planejamento)
- Composição visual: barra de custo/fixas/variáveis/lucro (como pizza ou barra)
- Alertas de margem baixa

### 6. Livro Diário & DRE
- Lançamentos contábeis (entradas/saídas)
- DRE editável (double-click para editar previsão)
- Comparativo previsão vs realizado (acurácia %)
- Produtos/insumos agrupados por nome normalizado
- Exportação CSV
- Categorias customizáveis (hierarquia: header > categoria > subcategoria > item)

### 7. Caixa Diário (PDV Simplificado)
- Abrir caixa (valor inicial)
- Registrar vendas (com itens, forma de pagto: dinheiro, PIX, cartão crédito/débito, VR/VT)
- Retiradas do caixa
- Fechar caixa (cálculo automático do saldo)
- Comprovante térmico (impressão ou preview)
- Consulta histórica de caixas

### 8. Contas Bancárias
- Cadastro de contas (corrente, carteira, aplicação, iFood, etc.)
- Saldo total, saldo por conta
- Transferências entre contas
- Visualização de movimentações

### 9. Fechamento Mensal
- Status ABERTO/CANCELADO/FECHADO
- Distribuição de lucro (percentual por funcionário/sócio)
- Exportação Excel
- Geração de PDF
- Plano de contas

### 10. Configurações da Loja
- Informações fiscais (CNPJ, nome, endereço)
- Horários de funcionamento (períodos configuráveis)
- Formas de pagamento (ativar/desativar, taxas extras, entrega/retirada)
- Bandeiras de cartão aceitas
- Links personalizados ( WhatsApp, cardápio online, link da mesa)
- Personalização visual (cores, logo, capa do cardápio)

---

## ✨ Melhorias de Design UI/UX

### Design Geral
1. **Design system consistente** — use shadcn/ui com tokens de design (CSS variables para cores, espaçamento, tipografia)
2. **Dark mode completo** com toggle no header (persistido no localStorage)
3. **Animações subtis** (transições de hover, loading states, skeleton loaders)
4. **Empty states ilustradas** (quando não há dados, mostre ilustrações amigáveis com call-to-action)
5. **Loading states elegantes** (skeletons em vez de spinners simples)
6. **Modais e diálogos** com backdrop blur e animações de entrada/saída
7. **Breadcrumbs** em todas as páginas para navegação clara
8. **Responsive first** — mobile, tablet, desktop
9. **Acessibilidade** — foco visível, contraste adequado, labels associados

### Dashboard
1. **Layout de widgets** configuráveis (drag & drop para reorganizar cards)
2. **Gráficos interativos** com Recharts melhorados (tooltips customizados, zoom, legendas)
3. **Visão de saúde financeira** com score de 0-100 e recomendações
4. **Comparativo YoY** (ano atual vs ano anterior)
5. **Exportação de gráficos** (PNG, PDF)

### Planejamento
1. **Wizard de configuração** do planejamento (passo a passo como no registro)
2. **Visualização de árvore** do plano de contas
3. **Gráfico de radar** showing performance vs benchmark setor
4. **Simulação** de "e se eu aumentasse/diminuísse X%"

### Fichas Técnicas
1. **Editor visual arrastar e soltar** para ingredientes
2. **Preview em tempo real** do custo conforme ingredientes são adicionados
3. **Composição de custo** em formato de pizza/barra empilhada
4. **Histórico de preços** (evolução do custo ao longo do tempo)

### Caixa
1. **Layout de PDV** moderno (similar a sistemas de caixa POS)
2. **Teclado numérico** para entrada rápida
3. **Resumo visual** do caixa com breakdown por forma de pagamento

---

## 🚀 Novas Funcionalidades (Aprimoramentos)

### 1. **Inteligência de Preços (AI-Powered)**
- Análise automática de concorrência (importação de cardápios similares)
- Sugestão de preço de venda ideal dinâmico
- Alertas de prateleira (preços fora da faixa ideal)

### 2. **Relatórios Avançados**
- Relatório de rentabilidade por prato (ranking)
- Análise de ticket médio por forma de pagamento
- Fluxo de caixa projetado
- Comparativo mês a mês
- Exportação em PDF profissional

### 3. **Controle de Estoque Inteligente**
- Alertas de estoque mínimo
- Previsão de consumo (baseada em vendas históricas)
- Reabastecimento automático (indicação de quantidade a comprar)

### 4. **Metas Inteligentes**
- Meta automática baseada na melhor média do período
- Progresso em tempo real via notificação push
- Gamificação: badges e conquistas

### 5. **Dashboard Admin do SaaS**
- Visão geral de todos os usuários/assinaturas
- Métricas de MRR, churn, LTV
- Gestão de planos e preços
- Logs de auditoria

### 6. **Webhooks & Integrações**
- Webhook de cartápio (cardapio.ai)
- Integração com iFood, Uber Eats, Ifood (recebimento automático de pedidos)
- API pública para integrações

### 7. **Notificações em Tempo Real**
- WebSocket ou polling para alertas críticos
- Notificação de caixa aberto/fechado
- Lembretes de vencimento de contas

---

## 🏗️ Arquitetura e Padrões de Código

### Estrutura de Pastas
```
src/
├── app/
│   ├── (auth)/          # Login, register, forgot, reset
│   ├── (dashboard)/     # Layout + todas as páginas do app
│   ├── api/             # API routes (REST)
│   └── layout.tsx, page.tsx
├── components/
│   ├── ui/              # shadcn/ui
│   ├── dashboard/       # Componentes específicos do dashboard
│   ├── fichas-tecnicas/ # Componentes de fichas
│   ├── produtos/        # Componentes de produtos
│   ├── caixa/           # Componentes de caixa
│   └── layout/          # Sidebar, Topbar
├── hooks/               # Hooks customizados
├── lib/
│   ├── prisma.ts        # Cliente Prisma
│   ├── auth.ts          # NextAuth options
│   ├── stripe.ts        # Configurações Stripe
│   ├── utils.ts         # Funções utilitárias
│   ├── dre-calculator.ts
│   ├── calculoDespesasVariaveis.ts
│   ├── services/        # Serviços (produtos, normalização, etc.)
│   └── validations/     # Schemas Zod
├── types/               # Tipos TypeScript
└── __tests__/           # Testes Vitest
```

### Padrões
1. **Componentes reutilizáveis** — cada widget/diagrama em componente próprio com props tipadas
2. **Hooks customizados** — `useEmpresas`, `useProdutos`, `useFichasTecnicas`, etc. (fetching com cache, loading, error)
3. **API REST consistente** — todas as rotas retornam `{ success: true|false, data, error? }`
4. **Isolamento multi-tenant** — middleware Prisma aplica `empresaId` automaticamente
5. **Cálculos puros** — fórmulas de indicadores/folha/despesas em arquivos lib separados (reutilizáveis entre página e API)
6. **Formulários com React Hook Form + Zod** para validação
7. **Toasts com Sonner** em vez de `alert()`
8. **Tipos compartilhados** — interfaces TypeScript em `src/types/` e reutilizadas entre frontend e backend

### Lógica de Negócio (CRITICAL — não quebrar)
- **Mark-Up:** `mu = 100 / (100 - %Fixas - %Variáveis - %Lucro)`
- **CMV Máximo:** `cmv = 100 - %Fixas - %Variáveis - %Lucro`
- **Despesas Variáveis** = taxa média de cartão (débito × %débito + crédito × %crédito + voucher × %voucher) + manutenção + simples nacional + (folha salarial ÷ faturamento × 100)
- **Aluguel de maquininha** entra nas despesas fixas (não nas variáveis)
- **Margem de lucro:** `(preço de venda - custo total - despesas proporcionais) / preço de venda × 100`
- **Trial de 7 dias** configurado no Stripe (`metadata: { trial_period_days: 7 }`)

---

## 📱 Páginas e Rotas

### Auth
- `/login` — login com email/senha
- `/register` — wizard de cadastro (loja, contato, segmento, endereço, senha, planos)
- `/forgot-password` — recuperação via email
- `/reset-password` — nova senha

### Dashboard
- `/` — Dashboard principal (stats, gráfico, metas, indicadores, alertas, lançamentos)

### Planejamento
- `/planejamento` — Planejamento financeiro completo (metas, despesas, folha, mark-up, indicadores)
- `/planejamento/configuracoes` — Configurações (despesas fixas, variáveis, funcionários, metas, provisões, taxas)
- `/planejamento/editar/*` — Páginas de edição específicas

### NF-e / Produtos
- `/nfe` — Visão geral (lançamentos do dia, estatísticas)
- `/nfe/lancamento` — Lançamento manual (venda/compra)
- `/nfe/compra` — Processamento de NFC-e via URL
- `/nfe/xml` — Upload de XML
- `/nfe/produtos` — Lista de produtos
- `/nfe/produtos/novo` — Cadastro de produto
- `/nfe/produtos/normalizacao` — Correção de nomes em massa
- `/nfe/produtos/[id]/edit` — Edição de produto

### Fichas Técnicas
- `/fichas-tecnicas` — Lista de fichas (cards com margem)
- `/fichas-tecnicas/nova` — Criação de nova ficha
- `/fichas-tecnicas/[id]/edit` — Edição de ficha

### Caixa
- `/caixa` — Tela inicial / DashboardCaixa (abrir/fechar, vendas, retiradas)

### Contas Bancárias
- `/contas-bancarias` — Lista de contas
- `/contas-bancarias/nova` — Nova conta
- `/contas-bancarias/[id]/editar` — Editar conta
- `/contas-bancarias/[id]/movimentacoes` — Movimentações

### Financeiro
- `/fluxo-caixa` — DRE editável e comparativo anual
- `/fluxo-caixa/configuracoes` — Configurações de metas
- `/livro-diario` — Lançamentos contábeis
- `/fechamento-mensal` — Fechamento contábil mensal
- `/fechamento-mensal/plano-contas` — Plano de contas

### Configurações
- `/config/loja` — Configurações da loja (informações, personalização, horários, pagamento, acessos, links)
- `/config/planos` — Gestão de planos (admin)

---

## 🔐 Requisitos Não-Funcionais

1. **Multi-tenancy rigoroso** — dados de cada empresa isolados (Prisma middleware)
2. **Trial de 7 dias** funcionando (sem cartão, Stripe)
3. **Rate limiting** em APIs (especialmente OpenFoodFacts)
4. **Caching** para resultados de cálculos pesados (Redis opcional)
5. **Logs de auditoria** para ações críticas (fechamento de caixa, DRE)
6. **Testes unitários** para fórmulas (Vitest)
7. **CI/CD** via GitHub Actions → Vercel
8. **Variáveis de ambiente** documentadas (.env.example)
9. **Documentação de API** (README com endpoints)

---

## 📋 Instruções Específicas para o Lovable

1. **Comece pelo auth flow** (login → register → trial) — o foundation de tudo
2. **Crie o Dashboard** com os stats cards e gráfico — o coração do produto
3. **Implemente o Planejamento Financeiro** — a feature mais complexa (metas, despesas, folha, mark-up, indicadores)
4. **Adicione NF-e e Gestão de Produtos** (processamento XML, lançamento manual, catálogo)
5. **Desenvolva Fichas Técnicas** integradas com o planejamento (mark-up sync)
6. **Finalize com Fluxo de Caixa/DRE, Caixa PDV, Contas Bancárias, Fechamento Mensal**
7. **Depois de tudo funcionando, refatore o design** com shadcn/ui e dark mode
8. Use **componentes shadcn/ui** como base e customize com `cva` (class-variance-authority)
9. **Persista o stripePriceId** nos planos reais do Stripe
10. **Mock dados** para demonstração (seed ou dados estáticos)

---

## 🎯 Critérios de Sucesso

- [ ] Todos os fluxos funcionam de ponta a ponta (registro → trial → uso)
- [ ] Mark-up e CMV calculados corretamente
- [ ] DRE editável e exportável
- [ ] Fichas técnicas com cálculo de custo preciso
- [ ] Caixa abre/fecha com cálculo automático de saldo
- [ ] Design moderno, consistente, com dark mode
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Sem alertas JS nativos (usar Sonner toasts)
- [ ] Testes cobrindo fórmulas de negócio