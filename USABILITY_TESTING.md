# Guia de Testes de Usabilidade - Administra.ai

## Fluxos Críticos para Testar

### 1. Onboarding (Novo Usuário)
**Passos:**
1. Acessar `/register`
2. Cadastrar com email válido
3. Fazer login automático
4. Verificar redirecionamento para `/config/loja`
5. Preencher dados da empresa
6. Verificar trial ativo (7 dias)

**Critérios de Aceite:**
- [ ] Cadastro sem erro
- [ ] Validação de email funciona
- [ ] Dados da empresa salvos
- [ ] Trial visível no dashboard

### 2. Módulo Caixa Diário
**Funcionalidades:**
- Abrir caixa com valor inicial
- Registrar venda manual
- Registrar retirada
- Fechar caixa
- Consultar caixa fechado
- Imprimir comprovante

**Checklist Mobile:**
- [ ] Sidebar responsiva
- [ ] Botões touch-friendly (>44px)
- [ ] Inputs não ficam cortados
- [ ] Gráficos responsivos

### 3. Dashboard
**Métricas a validar:**
- Cards de estatísticas
- Gráficos (Receita/Despesa/Lucro)
- Filtros de período (Hoje/Mês/Ano)
- Últimos lançamentos
- Alertas (margem baixa, despesas altas)

### 4. Fichas Técnicas
**Testar:**
- Criar ficha técnica
- Adicionar ingredientes com custo
- Calcular custo por porção
- Margem de lucro calculada corretamente
- Alerta de margem < 30%

### 5. Planejamento
**Funcionalidades:**
- Configurar despesas fixas
- Configurar despesas variáveis  
- Metas mensais
- Funcionários e folha salarial

## Testes de Responsividade

### Breakpoints a testar:
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1024px+

### Ferramentas recomendadas:
- Chrome DevTools > Device Toolbar
- [Responsively App](https://responsively.app) - Desktop
- BrowserStack - Dispositivos reais

## Checklist de QA por Página

### Login (`/login`)
- [ ] Loading spinner visível
- [ ] Erro mostrado se credenciais erradas
- [ ] Botão mostrar senha funciona
- [ ] Link "Esqueceu senha" visível
- [ ] Responsivo no mobile

### Dashboard (`/`)
- [ ] Cards carregam com dados
- [ ] Filtros funcionam
- [ ] Gráficos renderizam sem erro
- [ ] Dark mode (se implementado)
- [ ] Performance < 2s load

### Caixa (`/caixa`)
- [ ] Tela inicial visível se caixa fechado
- [ ] Dashboard visível se caixa aberto
- [ ] Modais abrem/fecham corretamente
- [ ] Ações CRUD funcionam
- [ ] Feedback após operações

## Cenários de Erro

### Testar:
1. API offline - como app reage?
2. Token expirado - redireciona para login?
3. Dados inválidos - validação frontend?
4. Timeout de requisição - feedback ao usuário?
5. Refresh de página - estado mantido?

## Métricas de Usabilidade

| Métrica | Meta | Como Medir |
|---------|------|------------|
| Tempo de carregamento | < 2s | Lighthouse |
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| Tamanho toque mínimo | > 44px | DevTools |
| Contraste acessibilidade | > 4.5:1 | Axe DevTools |

## Ferramentas de Teste

### Automatizadas:
```bash
# Lighthouse CLI
npm install -g lighthouse
lighthouse https://seu-projeto.vercel.app --view

# Teste mobile
npx playwright test --project="Mobile Chrome"
```

### Manual:
- Chrome DevTools > Lighthouse
- Axe DevTools (extensão Chrome)
- WAVE (wave.webaim.org)

## Checklist de Deploy

Antes de cada merge:
- [ ] `npm run build` passa sem erro
- [ ] `npm run lint` não mostra warnings críticos
- [ ] Testes manuais executados
- [ ] Responsividade validada
- [ ] Erros console sem regressão

---

**Guia criado para:** Equipe de Usabilidade
**Data:** 2025-03-09