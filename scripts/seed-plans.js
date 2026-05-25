// scripts/seed-plans.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de planos...')
  
  const plans = [
    { 
      id: "basic", 
      name: "Plano Básico", 
      price: 49.90, 
      features: JSON.stringify(["Até 500 produtos", "Até 100 fichas técnicas", "Relatórios básicos", "1 usuário"]), 
      isActive: true 
    },
    { 
      id: "professional", 
      name: "Plano Profissional", 
      price: 99.90, 
      features: JSON.stringify(["Produtos ilimitados", "Fichas técnicas ilimitadas", "Relatórios avançados", "Até 5 usuários", "Suporte prioritário", "API de integração"]), 
      isActive: true 
    }
  ]
  
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan
    })
    console.log(`✅ Plano ${plan.name} criado/atualizado`)
  }
  
  console.log("🎉 Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })