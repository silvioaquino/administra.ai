// Teste isolado do Fator de Correção no ConversionService.
// Não depende do banco: importa o serviço compilado via tsx/ts-node.
import { ConversionService } from '../src/lib/services/conversion.service.ts'

function assert(cond, msg) {
  if (!cond) {
    console.error('❌ FALHOU:', msg)
    process.exitCode = 1
  } else {
    console.log('✅', msg)
  }
}

// Cenário: 1KG de alface custa R$ 5,00. Na receita usamos 300g líquidos.
// Mas compramos 1000g bruto e aproveitamos 700g (FC = 1,43).
// Uso na receita = 300g líquido.
const r = ConversionService.calculateConsumption(
  300, 'G',
  {
    purchaseUnit: 'KG',
    unitPrice: 5,
    fatorCorrecao: 1000 / 700, // 1.42857
  }
)

console.log('\n--- Resultado ---')
console.log('custo sem FC:', r.costWithoutCorrection.toFixed(4))
console.log('fatorCorrecao:', r.fatorCorrecao.toFixed(4))
console.log('custo com FC:', r.cost.toFixed(4))
console.log('perdaValor :', r.perdaValor.toFixed(4))

// 300g de 1KG(R$5) = 0,3 × 5 = 1,50 sem FC
assert(Math.abs(r.costWithoutCorrection - 1.5) < 1e-6, 'custo sem FC = 1,50')
// com FC 1,42857 => 1,50 × 1,42857 = 2,14286
assert(Math.abs(r.cost - 1.5 * (1000/700)) < 1e-4, 'custo com FC = 1,50 × 1,42857 ≈ 2,1429')
assert(Math.abs(r.perdaValor - (r.cost - r.costWithoutCorrection)) < 1e-6, 'perdaValor = custo - custoSemFC')
assert(Math.abs(r.fatorCorrecao - 1.42857) < 1e-4, 'fatorCorrecao refletido')

// Caso sem FC (default 1)
const r0 = ConversionService.calculateConsumption(300, 'G', { purchaseUnit: 'KG', unitPrice: 5 })
assert(r0.fatorCorrecao === 1, 'sem FC => fator 1')
assert(Math.abs(r0.cost - 1.5) < 1e-6, 'sem FC => custo 1,50')

console.log('\nTeste do Fator de Correção concluído.')
