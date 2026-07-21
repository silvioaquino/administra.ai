import { z } from 'zod'

export const unitTypeSchema = z.enum(['G', 'KG', 'MG', 'L', 'ML', 'UN'])

export const fichaItemSchema = z.object({
  produtoId: z.number().positive('Produto é obrigatório'),
  quantidade: z.number().positive('Quantidade deve ser maior que zero'),
  unidade: unitTypeSchema.default('UN'),
  isProdutoAcabado: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // Se for UN, validar se produto tem pesoUnitario
  if (data.unidade === 'UN') {
    // A validação do pesoUnitario será feita no service
    // pois depende do produto selecionado
  }
})

export const fichaTecnicaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.string().optional(),
  precoVenda: z.number().min(0, 'Preço deve ser maior que zero'),
  rendimentoPorcoes: z.number().min(1, 'Rendimento deve ser maior que zero'),
  ingredientes: z.string().optional(),
  modoPreparo: z.string().optional(),
  items: z.array(fichaItemSchema).min(1, 'Adicione pelo menos um item'),
})
