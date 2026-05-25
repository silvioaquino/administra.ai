// src/app/(dashboard)/simples/page.tsx
'use client'  // ← GARANTA QUE ESTÁ NO TOPO DO ARQUIVO

import { useState } from 'react'

export default function PaginaSimples() {
  const [contador, setContador] = useState(0)
  const [dados, setDados] = useState<any>(null)

  // 🔥 CORREÇÃO: Verificar se está no cliente antes de acessar window
  const isClient = typeof window !== 'undefined'

  return (
    <div style={{ padding: '20px' }}>
      <h1>Teste de Funcionalidade</h1>
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={() => setContador(contador + 1)}
          style={{ padding: '10px', marginRight: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Contador: {contador}
        </button>
        
        <button 
          onClick={async () => {
            try {
              const res = await fetch('/api/health')
              const data = await res.json()
              setDados(data)
            } catch (error) {
              console.error('Erro:', error)
              setDados({ error: 'Falha na requisição' })
            }
          }}
          style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Testar API /health
        </button>
      </div>
      
      {dados && (
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
          {JSON.stringify(dados, null, 2)}
        </pre>
      )}
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#e9ecef', borderRadius: '5px' }}>
        <p><strong>URL atual:</strong> {isClient ? window.location.href : 'Carregando...'}</p>
        <p><strong>User Agent:</strong> {isClient ? navigator.userAgent : 'Carregando...'}</p>
        <p><strong>React carregado:</strong> {isClient && typeof React !== 'undefined' ? 'Sim' : 'Não'}</p>
      </div>
    </div>
  )
}