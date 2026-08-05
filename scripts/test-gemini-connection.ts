// src/scripts/test-gemini-connection.ts

import { GoogleGenerativeAI } from '@google/generative-ai'

async function testGeminiConnection() {
  console.log('🧪 Testando conexão com Gemini API...')
  
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY não configurada no .env.local')
    console.log('📝 Para configurar:')
    console.log('1. Acesse https://console.cloud.google.com/')
    console.log('2. Crie um projeto ou selecione existente')
    console.log('3. Ative a Gemini API')
    console.log('4. Crie uma chave de API')
    console.log('5. Adicione ao .env.local: GEMINI_API_KEY=sua_chave')
    return
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
    
    const result = await model.generateContent('Teste de conexão. Responda apenas com "OK"')
    const response = result.response.text()
    
    if (response.includes('OK')) {
      console.log('✅ Conexão com Gemini estabelecida com sucesso!')
    } else {
      console.error('❌ Resposta inesperada:', response)
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com Gemini:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.log('🔑 Sua chave API parece ser inválida. Verifique se está correta.')
      } else if (error.message.includes('quota')) {
        console.log('💳 Sua cota da API pode ter sido excedida. Verifique no Google Cloud Console.')
      } else if (error.message.includes('permission')) {
        console.log('🔒 A API Gemini pode não estar ativada no seu projeto.')
      }
    }
  }
}

// Executar
testGeminiConnection()