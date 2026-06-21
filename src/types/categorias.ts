/**
 * Tipos compartilhados para categorias do DRE
 * Usados tanto pelo Fluxo de Caixa quanto pelo Livro Diário
 */

export interface CategoriaItem {
  codigo: string;
  nome: string;
  nivel: number;
  tipo: 'receita' | 'despesa';
  isHeader?: boolean;
}

export interface CategoriasResponse {
  success: boolean;
  data: {
    receita: CategoriaItem[];
    despesas: CategoriaItem[];
  };
}

// Agrupamento de categorias por nível
export interface CategoriasGrouped {
  nivel0: CategoriaItem[];
  nivel1: CategoriaItem[];
  nivel2: CategoriaItem[];
  nivel3: CategoriaItem[];
}

// Grupos predefinidos para exibição no select
export const GRUPOS_DESPESAS = [
  { titulo: 'CUSTOS VARIÁVEIS', codigos: ['4.1', '4.2'] },
  { titulo: 'CUSTOS COM PRODUTOS/INSUMOS', codigos: ['4.3'] },
  { titulo: 'DESPESAS FIXAS', codigos: ['5.1'] },
  { titulo: 'DESPESAS ADMINISTRATIVAS', codigos: ['5.2'] },
  { titulo: 'DESPESAS COM PESSOAIS', codigos: ['5.3'] },
  { titulo: 'PROVISÕES', codigos: ['5.4'] },
  { titulo: 'DESPESAS COM SERVIÇOS DE TERCEIROS', codigos: ['5.4'] },
  { titulo: 'DESPESAS COM MATERIAIS E EQUIPAMENTOS', codigos: ['5.5'] },
  { titulo: 'FORNECEDORES', codigos: ['5.7'] },
  { titulo: 'INVESTIMENTOS', codigos: ['6.1'] },
];