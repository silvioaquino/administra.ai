// app/api/webhook/cardapio-ai/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Tipos para a nova estrutura
interface ProdutoWebhook {
  nome: string
  quantidade: string | number
  valor: number
  adicionais?: Array<{
    nome: string
    quantidade: number
    valor: number
  }>
  observacao?: string
}

interface WebhookNovoFormato {
  nomeCliente: string
  telefoneCliente: string
  tipoPedido: string
  endereco: string
  dataCompra: string
  valorCompra: number
  numeroPedido?: string
  tipoPagamento?: string
  metodoPagamento?: string
  produtos: ProdutoWebhook[]
}

interface WebhookFormatoAntigo {
  cliente: {
    nome: string
    telefone: string
  }
  pedido: {
    tipo: string
    endereco?: string
    dataHora: string
    valorTotal: number
    tipoPagamento?: string
  }
  produtos: Array<{
    nome: string
    quantidade: number
    valor: number
    adicionais?: string[]
  }>
}

export async function POST(request: NextRequest) {
  console.log('🎯 WEBHOOK CARDAPIO.AI CHAMADO')
  
  try {
    // 1. Obter dados da requisição
    const requestBody = await request.json()
    console.log('📥 Dados recebidos:', JSON.stringify(requestBody, null, 2))

    // 2. Verificar conexão com banco
    console.log('🔌 Testando conexão com banco...')
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Conexão com banco OK')

    // 3. Buscar caixa aberto
    console.log('📦 Buscando caixa aberto...')
    const caixaAberto = await prisma.caixaAbertura.findFirst({
      where: { 
        status: 'ABERTO' 
      }
    })

    if (!caixaAberto) {
      console.log('❌ NENHUM CAIXA ABERTO ENCONTRADO')
      return NextResponse.json(
        { 
          success: false,
          error: 'Nenhum caixa aberto',
          message: 'Abra um caixa no sistema PDV antes de enviar pedidos'
        },
        { status: 400 }
      )
    }

    console.log('✅ Caixa aberto encontrado:', caixaAberto.id)

    // 4. Processar dados do webhook
    console.log('🔄 Processando dados do webhook...')
    
    let dadosProcessados: any = {}
    let tipoPagamento = 'PENDENTE'
    let nomeCliente = ''
    let telefoneCliente = ''
    let tipoPedido = ''
    let endereco = ''
    let valorTotal = 0
    let produtos: ProdutoWebhook[] = []
    let numeroPedido: string | undefined = undefined

    // NOVA ESTRUTURA - Dados diretos do Cardápio.ai
    if (isNovoFormato(requestBody)) {
      const dados = requestBody as WebhookNovoFormato
      
      dadosProcessados = {
        cliente: {
          nome: dados.nomeCliente,
          telefone: dados.telefoneCliente || 'Não informado'
        },
        pedido: {
          tipo: dados.tipoPedido || 'DELIVERY',
          endereco: dados.endereco || '',
          dataHora: dados.dataCompra ? converterDataBRParaISO(dados.dataCompra) : new Date().toISOString(),
          valorTotal: dados.valorCompra || 0
        },
        produtos: dados.produtos || [],
        origem: 'cardapio-ai',
        webhook_received_at: new Date().toISOString(),
        numeroPedido: dados.numeroPedido,
        metodoPagamento: dados.metodoPagamento
      }
      
      nomeCliente = dados.nomeCliente
      telefoneCliente = dados.telefoneCliente || ''
      tipoPedido = dados.tipoPedido || ''
      endereco = dados.endereco || ''
      valorTotal = parseFloat(dados.valorCompra.toString()) || 0
      produtos = dados.produtos || []
      numeroPedido = dados.numeroPedido
      
      // Extrair tipo de pagamento - priorizar metodoPagamento
      if (dados.metodoPagamento) {
        tipoPagamento = dados.metodoPagamento.toUpperCase()
      } else if (dados.tipoPagamento) {
        tipoPagamento = dados.tipoPagamento.toUpperCase()
      }
    }
    // Formato Cardápio.ai oficial (antigo)
    else if (isFormatoAntigo(requestBody)) {
      const dados = requestBody as WebhookFormatoAntigo
      
      dadosProcessados = {
        cliente: dados.cliente,
        pedido: dados.pedido,
        produtos: dados.produtos || [],
        origem: 'cardapio-ai',
        webhook_received_at: new Date().toISOString()
      }
      
      nomeCliente = dados.cliente.nome || ''
      telefoneCliente = dados.cliente.telefone || ''
      tipoPedido = dados.pedido.tipo || ''
      endereco = dados.pedido.endereco || ''
      valorTotal = parseFloat(dados.pedido.valorTotal.toString()) || 0
      produtos = dados.produtos.map(p => ({
        nome: p.nome,
        quantidade: p.quantidade,
        valor: p.valor,
        adicionais: p.adicionais ? p.adicionais.map(a => ({ nome: a, quantidade: 1, valor: 0 })) : []
      }))
      
      // Tentar extrair tipo de pagamento do webhook
      if (dados.pedido.tipoPagamento) {
        tipoPagamento = dados.pedido.tipoPagamento.toUpperCase()
      }
    }
    // Formato não reconhecido
    else {
      console.log('❌ Formato de dados não reconhecido')
      return NextResponse.json(
        { 
          success: false,
          error: 'Formato de dados inválido',
          message: 'Os dados do webhook não estão em um formato reconhecido'
        },
        { status: 400 }
      )
    }

    // Validar e mapear tipo de pagamento
    tipoPagamento = validarTipoPagamento(tipoPagamento)

    // Validar valor total
    if (isNaN(valorTotal) || valorTotal <= 0) {
      console.log('❌ Valor total inválido:', valorTotal)
      return NextResponse.json(
        { 
          success: false,
          error: 'Valor total inválido',
          message: 'O valor total do pedido deve ser um número maior que zero'
        },
        { status: 400 }
      )
    }

    console.log('✅ Dados processados:')
    console.log('   - Cliente:', nomeCliente)
    console.log('   - Telefone:', telefoneCliente)
    console.log('   - Tipo Pedido:', tipoPedido)
    console.log('   - Valor Total:', valorTotal)
    console.log('   - Tipo Pagamento:', tipoPagamento)
    console.log('   - Número Pedido:', numeroPedido)
    console.log('   - Produtos:', produtos.length)

    // 5. VERIFICAR SE JÁ EXISTE PEDIDO COM MESMO NÚMERO
    let vendaExistente = null
    if (numeroPedido) {
      console.log('🔍 Verificando pedido duplicado...')
      vendaExistente = await prisma.venda.findFirst({
        where: { numeroPedido },
        include: { produtos: true }
      })
      
      if (vendaExistente) {
        console.log('🔄 Pedido já existe, atualizando...')
        console.log('   - ID existente:', vendaExistente.id)
        console.log('   - Data original:', vendaExistente.dataVenda)
      } else {
        console.log('✅ Número de pedido é novo')
      }
    }

    // 6. SALVAR/ATUALIZAR NO BANCO usando transação
    console.log('💾 SALVANDO/ATUALIZANDO VENDA NO BANCO...')
    
    try {
      const resultado = await prisma.$transaction(async (tx) => {
        // Dados da venda
        const vendaData = {
          dadosPedido: dadosProcessados,
          valorTotal: valorTotal,
          tipoPagamento: tipoPagamento,
          caixaAberturaId: caixaAberto.id,
          manual: false,
          dataVenda: new Date(),
          nomeCliente: nomeCliente,
          telefoneCliente: telefoneCliente,
          tipoPedido: tipoPedido,
          endereco: endereco,
          numeroPedido: numeroPedido,
          empresaId: caixaAberto.empresaId,
          userId: caixaAberto.userId
        }

        let venda

        if (vendaExistente) {
          console.log('   Atualizando venda existente...')
          
          // Atualizar venda existente
          venda = await tx.venda.update({
            where: { id: vendaExistente.id },
            data: vendaData
          })

          console.log('✅ Venda atualizada:', venda.id)

          // Deletar produtos antigos
          console.log('   Removendo produtos antigos...')
          await tx.produtoVenda.deleteMany({
            where: { vendaId: venda.id }
          })

        } else {
          console.log('   Criando nova venda...')
          
          // Criar nova venda
          venda = await tx.venda.create({
            data: vendaData
          })

          console.log('✅ Nova venda criada:', venda.id)
        }

        // Criar produtos se existirem
        if (produtos && produtos.length > 0) {
          console.log('   Criando produtos...')
          
          const produtosData = produtos.map((produto) => ({
            vendaId: venda.id,
            nome: produto.nome || 'Produto sem nome',
            quantidade: parseInt(produto.quantidade.toString()) || 1,
            valor: parseFloat(produto.valor.toString()) || 0,
            adicionais: produto.adicionais || [],
            observacao: produto.observacao || null,
            empresaId: caixaAberto.empresaId,
            userId: caixaAberto.userId
          }))

          await tx.produtoVenda.createMany({
            data: produtosData
          })

          console.log('✅ Produtos criados/atualizados:', produtosData.length)
        }

        // Retornar a venda completa com produtos
        return await tx.venda.findUnique({
          where: { id: venda.id },
          include: {
            produtos: true
          }
        })
      })

      if (!resultado) {
        throw new Error('Falha ao criar/atualizar venda')
      }

      const acao = vendaExistente ? 'ATUALIZADA' : 'SALVA'
      console.log(`🎉 VENDA ${acao} COM SUCESSO!`)
      console.log('   - ID:', resultado.id)
      console.log('   - Cliente:', resultado.nomeCliente)
      console.log('   - Valor:', resultado.valorTotal)
      console.log('   - Tipo Pagamento:', resultado.tipoPagamento)
      console.log('   - Número Pedido:', resultado.numeroPedido)
      console.log('   - Data:', resultado.dataVenda)
      console.log('   - Produtos:', resultado.produtos.length)

      return NextResponse.json({ 
        success: true,
        message: vendaExistente ? 'Pedido atualizado com sucesso' : 'Pedido registrado com sucesso',
        action: vendaExistente ? 'updated' : 'created',
        venda_id: resultado.id,
        data: {
          id: resultado.id,
          nomeCliente: resultado.nomeCliente,
          valorTotal: resultado.valorTotal,
          tipoPagamento: resultado.tipoPagamento,
          numeroPedido: resultado.numeroPedido,
          dataVenda: resultado.dataVenda,
          caixaId: resultado.caixaAberturaId,
          produtosCount: resultado.produtos.length
        }
      })

    } catch (dbError: any) {
      console.error('💥 ERRO AO SALVAR NO BANCO:', dbError)
      console.error('   - Mensagem:', dbError.message)
      console.error('   - Código:', dbError.code)
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro ao salvar no banco',
          message: dbError.message,
          code: dbError.code
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('💥 ERRO GRAVE NO WEBHOOK:')
    console.error('   - Mensagem:', error.message)
    console.error('   - Stack:', error.stack)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      },
      { status: 500 }
    )
  }
}

// Função auxiliar para verificar se é o novo formato
function isNovoFormato(data: any): data is WebhookNovoFormato {
  return (
    typeof data.nomeCliente === 'string' &&
    typeof data.telefoneCliente === 'string' &&
    typeof data.tipoPedido === 'string' &&
    typeof data.valorCompra !== 'undefined'
  )
}

// Função auxiliar para verificar se é o formato antigo
function isFormatoAntigo(data: any): data is WebhookFormatoAntigo {
  return (
    data.cliente && 
    typeof data.cliente.nome === 'string' &&
    data.pedido &&
    typeof data.pedido.valorTotal !== 'undefined'
  )
}

// Função auxiliar para validar tipo de pagamento
function validarTipoPagamento(tipo: string): string {
  const tiposValidos = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'OUTRO', 'PENDENTE', 'VR']
  
  const mapeamentoTipos: { [key: string]: string } = {
    'CREDITO': 'CARTAO_CREDITO',
    'CRÉDITO': 'CARTAO_CREDITO',
    'DEBITO': 'CARTAO_DEBITO',
    'DÉBITO': 'CARTAO_DEBITO',
    'CARTAO': 'CARTAO_CREDITO',
    'CARTÃO': 'CARTAO_CREDITO',
    'DINHEIRO': 'DINHEIRO',
    'PIX': 'PIX',
    'DINHEIRO/PIX': 'PIX',
    'OUTROS': 'OUTRO',
    'VR': 'VR',
    'VALE REFEICAO': 'VR',
    'VALE REFEIÇÃO': 'VR',
    'PAGAMENTO PRESENCIAL': 'PENDENTE'
  }

  // Aplicar mapeamento se necessário
  const tipoMapeado = mapeamentoTipos[tipo.toUpperCase()] || tipo.toUpperCase()

  // Validar tipo de pagamento
  if (!tiposValidos.includes(tipoMapeado)) {
    console.log('⚠️ Tipo de pagamento inválido ou não especificado, usando PENDENTE:', tipo)
    return 'PENDENTE'
  }

  return tipoMapeado
}

// Função auxiliar para converter data BR para ISO
function converterDataBRParaISO(dataBR: string): string {
  try {
    // Formato: "09/11/2025"
    const [dia, mes, ano] = dataBR.split('/').map(Number)
    
    // Validar dados
    if (!dia || !mes || !ano || dia > 31 || mes > 12 || ano < 2000) {
      throw new Error('Data inválida')
    }
    
    const data = new Date(ano, mes - 1, dia)
    
    // Verificar se a data é válida
    if (isNaN(data.getTime())) {
      throw new Error('Data inválida')
    }
    
    return data.toISOString()
  } catch (error) {
    console.log('❌ Erro ao converter data, usando data atual:', error)
    return new Date().toISOString()
  }
}

// GET para testar o webhook
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const test = searchParams.get('test')
  
  if (test === 'data') {
    return NextResponse.json({
      message: 'Webhook Cardápio.ai está funcionando!',
      timestamp: new Date().toISOString(),
      exemplo_novo_formato: {
        nomeCliente: "Balcão",
        telefoneCliente: "0",
        tipoPedido: "Pedido Delivery",
        endereco: "undefined, undefined - undefined, undefined - undefined CEP undefined",
        dataCompra: "19/11/2025",
        valorCompra: 42,
        numeroPedido: "062-275168",
        tipoPagamento: "Pagamento presencial",
        metodoPagamento: "Dinheiro",
        produtos: [
          {
            nome: "Eco: Carne Guisada",
            quantidade: "1",
            valor: 15,
            adicionais: [
              {
                nome: "Mulato",
                quantidade: 1,
                valor: 0
              }
            ]
          }
        ]
      },
      instrucoes: 'Envie um POST com os dados do pedido no formato acima'
    })
  }
  
  return NextResponse.json({
    message: 'Webhook Cardápio.ai está funcionando!',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET ?test=data': 'Retorna exemplo da nova estrutura',
      'POST /': 'Recebe webhook do Cardápio.ai'
    }
  })
}