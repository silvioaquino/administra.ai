// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Categorias do DRE baseadas na planilha do Fluxo de Caixa
// Essas são categorias padrão para todos os usuários
const CATEGORIAS_SEED = [
  // RECEITA
  { codigo: '3.1', nome: 'Receita de Vendas', nivel: 1, tipo: 'receita', isHeader: false },
  { codigo: '3.1.1', nome: 'Receitas de Vendas', nivel: 2, tipo: 'receita', isHeader: false },
  { codigo: '3.1.2', nome: 'Vendas em Dinheiro', nivel: 3, tipo: 'receita', isHeader: false },
  { codigo: '3.1.3', nome: 'Maquineta Stone', nivel: 3, tipo: 'receita', isHeader: false },
  { codigo: '3.1.4', nome: 'Maquineta Caixa', nivel: 3, tipo: 'receita', isHeader: false },
  { codigo: '3.1.5', nome: 'Maquineta Infinity', nivel: 3, tipo: 'receita', isHeader: false },
  { codigo: '3.1.6', nome: 'Vendas em Cartão Débito', nivel: 2, tipo: 'receita', isHeader: false },
  { codigo: '3.1.7', nome: 'Maquineta Stone', nivel: 3, tipo: 'receita', isHeader: false },
  { codigo: '3.1.8', nome: 'Maquineta Caixa', nivel: 3, tipo: 'receita', isHeader: false },
  { codigo: '3.1.9', nome: 'Maquineta Infinity', nivel: 3, tipo: 'receita', isHeader: false },
  { codigo: '3.1.10', nome: 'Vendas em Cartão Crédito', nivel: 2, tipo: 'receita', isHeader: false },
  { codigo: '3.1.11', nome: 'Maquineta Stone', nivel: 3, tipo: 'receita', isHeader: false },
  { codigo: '3.1.12', nome: 'Maquineta Caixa', nivel: 3, tipo: 'receita', isHeader: false },
  { codigo: '3.1.13', nome: 'Maquineta Infinity', nivel: 3, tipo: 'receita', isHeader: false },
  { codigo: '3.1.14', nome: 'Vendas em Plataformas Digitais', nivel: 2, tipo: 'receita', isHeader: false },
  { codigo: '3.1.15', nome: 'Acertos', nivel: 2, tipo: 'receita', isHeader: false },

  // CUSTOS VARIÁVEIS
  { codigo: '4.1', nome: 'CUSTOS VARIÁVEIS', nivel: 0, tipo: 'despesa', isHeader: true },
  { codigo: '4.1.1', nome: 'Simples Federal', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '4.1.2', nome: 'Mercantil', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '4.1.3', nome: 'IPTU', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '4.1.4', nome: 'Parcelamento Impostos', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '4.1.5', nome: 'Imposto Bombeiros', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '4.1.6', nome: 'Devoluções de Vendas', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '4.1.7', nome: 'Abatimentos sobre Vendas', nivel: 1, tipo: 'despesa', isHeader: false },

  // CUSTOS COM PRODUTOS/INSUMOS
  { codigo: '4.2', nome: 'CUSTOS COM PRODUTOS/INSUMOS', nivel: 0, tipo: 'despesa', isHeader: true },
  { codigo: '4.3.1', nome: 'Produtos/Insumos', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '4.3.2', nome: 'Acerto Despesas', nivel: 1, tipo: 'despesa', isHeader: false },

  // DESPESAS FIXAS
  { codigo: '5.1', nome: 'DESPESAS FIXAS', nivel: 0, tipo: 'despesa', isHeader: true },
  { codigo: '5.1.1', nome: 'Tarifas Bancárias', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.1.2', nome: 'Aluguel de Maquinetas', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.1.3', nome: 'Empréstimos', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.1', nome: 'Aluguel Imóvel', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.2', nome: 'Energia (Celpe)', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.3', nome: 'Água (Compesa)', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.4', nome: 'Internet', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.5', nome: 'Telefone', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.6', nome: 'Celular', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.7', nome: 'Gasolina/Estacionamento/Táxi', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.8', nome: 'Financiamento Carro', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.9', nome: 'IPVA', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.10', nome: 'Botijão de Gás', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.11', nome: 'Outras Despesas', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.2.12', nome: 'Acertos', nivel: 1, tipo: 'despesa', isHeader: false },

  // DESPESAS COM PESSOAIS
  { codigo: '5.3', nome: 'Despesas com Pessoal', nivel: 0, tipo: 'despesa', isHeader: true },
  { codigo: '5.3.1', nome: 'Salários de Funcionários', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.3.2', nome: 'Adiantamento de Salários', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.3.3', nome: 'Pro-Labore', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.3.4', nome: 'Bolsa de Estágio', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.3.5', nome: 'Vale Transporte', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.3.6', nome: 'Rescisão', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.3.7', nome: 'Outras Despesas', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.3.8', nome: 'Ferias Funcionários', nivel: 1, tipo: 'despesa', isHeader: false },

  // PROVISÕES
  { codigo: '5.4', nome: 'PROVISÕES', nivel: 0, tipo: 'despesa', isHeader: true },
  { codigo: '5.4.1', nome: 'Férias de Funcionários', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.4.2', nome: '1/3 Férias', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.4.3', nome: 'FGTS', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.4.4', nome: 'INSS', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.4.5', nome: '13º Salário', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.4.6', nome: 'INSS Patronal', nivel: 1, tipo: 'despesa', isHeader: false },

  // Despesas com Serviços de Terceiros
  { codigo: '5.5', nome: 'Despesas com Serviços de Terceiros', nivel: 0, tipo: 'despesa', isHeader: true },
  { codigo: '5.5.1', nome: 'Contador', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.5.2', nome: 'TI', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.5.3', nome: 'Outras Despesas', nivel: 1, tipo: 'despesa', isHeader: false },

  // Despesas com Materiais e Equipamentos
  { codigo: '5.6', nome: 'Despesas com Materiais e Equipamentos', nivel: 0, tipo: 'despesa', isHeader: true },
  { codigo: '5.6.1', nome: 'Manutenção de Equipamentos', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.6.2', nome: 'Softwares', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.6.3', nome: 'Materiais de Expediente/Manutenção/Limpeza', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.6.4', nome: 'Manutenção de Veículos', nivel: 1, tipo: 'despesa', isHeader: false },

  // Fornecedores
  { codigo: '5.7', nome: 'Fornecedores', nivel: 0, tipo: 'despesa', isHeader: true },
  { codigo: '5.7.1', nome: 'Karne Keijo', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.7.2', nome: 'Natto', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.7.3', nome: 'Coca-Cola', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '5.7.4', nome: 'Outros', nivel: 1, tipo: 'despesa', isHeader: false },

  // INVESTIMENTOS
  { codigo: '6.1', nome: 'INVESTIMENTOS', nivel: 0, tipo: 'despesa', isHeader: true },
  { codigo: '6.1.1', nome: 'Investimento em Marketing', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '6.1.2', nome: 'Investimento em Bens Materiais', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '6.1.3', nome: 'Investimento em Desenvolvimento Empresarial', nivel: 1, tipo: 'despesa', isHeader: false },
  { codigo: '6.1.4', nome: 'Outros', nivel: 1, tipo: 'despesa', isHeader: false },
];

async function main() {
  console.log('Iniciando seed de categorias...');

  // Criar categorias usando $queryRaw (userId = null para categorias globais)
  for (const categoria of CATEGORIAS_SEED) {
    const existing = await prisma.$queryRaw`
      SELECT * FROM categorias WHERE codigo = ${categoria.codigo} LIMIT 1
    `;

    if (!existing || (Array.isArray(existing) && existing.length === 0)) {
      await prisma.$queryRaw`
        INSERT INTO categorias (codigo, nome, nivel, tipo, is_header, created_at, updated_at)
        VALUES (${categoria.codigo}, ${categoria.nome}, ${categoria.nivel}, ${categoria.tipo}, ${categoria.isHeader}, NOW(), NOW())
      `;
      console.log(`✓ Categoria criada: ${categoria.codigo} - ${categoria.nome}`);
    } else {
      console.log(`ℹ Categoria já existe: ${categoria.codigo} - ${categoria.nome}`);
    }
  }

  console.log('Seed de categorias concluída!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });